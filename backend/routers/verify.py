"""
VeriOTA — Verify + Firestore Alert Router
Verifies firmware integrity and writes real-time alerts to Firestore.
This is the critical link between attack simulation and dashboard live updates.
"""
import json
import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from core.dilithium import verify_signature, decode_b64
from core.merkle import build_merkle_tree, verify_merkle, get_merkle_proof
from core.firebase_client import log_alert, get_db

router = APIRouter()


@router.post("/verify")
async def verify_firmware(
    firmware: UploadFile = File(...),
    signature: str = Form(...),
    public_key: str = Form(...),
    trusted_merkle: str = Form(...),
    signed_at: str = Form(default=""),
    firmware_hash_signed: str = Form(default=""),
    vehicle_id: str = Form(default="GLOBAL"),
    write_alert: str = Form(default="true"),  # Write to Firestore on tamper
):
    """
    Verifies firmware integrity:
    1. Dilithium/ML-DSA signature verification (composite payload)
    2. Merkle tree rebuild from received firmware
    3. Tamper localization (chunk index + exact byte range)
    4. Firestore alert write on TAMPERED (enables live dashboard updates)
    """
    firmware_bytes = await firmware.read()
    if not firmware_bytes:
        raise HTTPException(status_code=400, detail="Firmware file is empty.")

    # Parse trusted Merkle metadata
    try:
        trusted_data = json.loads(trusted_merkle)
        trusted_root = trusted_data["root"]
        trusted_leaves = trusted_data["leaves"]
    except (json.JSONDecodeError, KeyError):
        raise HTTPException(
            status_code=400,
            detail="trusted_merkle must be valid JSON with 'root' and 'leaves' keys."
        )

    sig_bytes = decode_b64(signature)
    pub_bytes = decode_b64(public_key)

    # ── Step 1: Signature Verification ───────────────────────────────────────
    # Try composite payload first (timestamp + VIN bound — prevents replay & cross-vehicle attacks)
    signature_valid = False
    if signed_at and firmware_hash_signed:
        composite_payload = json.dumps({
            "merkle_root": trusted_root,
            "signed_at": signed_at,
            "firmware_hash": firmware_hash_signed,
            "vehicle_id": vehicle_id,
        }, sort_keys=True).encode("utf-8")
        signature_valid = verify_signature(composite_payload, sig_bytes, pub_bytes)

    # Fallback: raw Merkle root bytes (backward compatibility)
    if not signature_valid:
        root_bytes = bytes.fromhex(trusted_root)
        signature_valid = verify_signature(root_bytes, sig_bytes, pub_bytes)

    # ── Step 2: Merkle Tree Rebuild + Tamper Localization ────────────────────
    merkle_result = verify_merkle(firmware_bytes, trusted_leaves)
    computed_root = merkle_result.get("computed_root", "")
    merkle_match = merkle_result["merkle_match"]
    tampered_chunks = merkle_result.get("tampered_chunks", [])

    is_safe = signature_valid and merkle_match
    status = "VERIFIED" if is_safe else "TAMPERED"

    # ── Step 3: Write to Firestore for Live Dashboard Update ─────────────────
    if status == "TAMPERED" and vehicle_id != "GLOBAL" and write_alert.lower() == "true":
        try:
            alert_detail = {
                "chunk_count_tampered": len(tampered_chunks),
                "tampered_chunks": [
                    {
                        "chunk_index": c["chunk_index"],
                        "byte_start": c["byte_start"],
                        "byte_end": c["byte_end"],
                        "trusted_hash": c.get("trusted_hash", ""),
                        "computed_hash": c.get("computed_hash", ""),
                    }
                    for c in tampered_chunks[:10]  # store max 10 chunks
                ],
                "merkle_root_expected": trusted_root[:32] + "...",
                "merkle_root_computed": computed_root[:32] + "...",
                "firmware_hash_received": hashlib.sha256(firmware_bytes).hexdigest(),
                "signature_valid": signature_valid,
                "detected_at": datetime.now(timezone.utc).isoformat(),
            }
            log_alert(vehicle_id, "TAMPERED", alert_detail)
            # Invalidate fleet cache so dashboard picks up RED status immediately
            try:
                from routers.ledger import _fleet_cache
                _fleet_cache["data"] = None
            except Exception:
                pass
        except Exception as e:
            # Never let Firestore write failure break the verification response
            pass

    # ── Step 4: Generate Merkle Proof for First Tampered Chunk ───────────────
    merkle_proof = None
    if tampered_chunks and len(trusted_leaves) > 0:
        first_chunk = tampered_chunks[0]["chunk_index"]
        merkle_proof = get_merkle_proof(trusted_leaves, first_chunk)

    return {
        "status": status,
        "signature_valid": signature_valid,
        "merkle_match": merkle_match,
        "merkle_root_expected": trusted_root,
        "merkle_root_computed": computed_root,
        "tampered_chunks": tampered_chunks,
        "tampered_chunk_count": len(tampered_chunks),
        "installation_safe": is_safe,
        "vehicle_id": vehicle_id,
        "alert_written_to_firestore": (status == "TAMPERED" and vehicle_id != "GLOBAL"),
        "merkle_proof_first_chunk": merkle_proof,
        "forensic_summary": (
            f"TAMPERED: {len(tampered_chunks)} chunk(s) modified. "
            f"First tampered: Chunk #{tampered_chunks[0]['chunk_index']}, "
            f"Bytes {tampered_chunks[0]['byte_start']}–{tampered_chunks[0]['byte_end']}."
            if tampered_chunks else "CLEAN: All chunks match trusted Merkle tree."
        ),
    }


@router.get("/merkle-proof")
async def get_merkle_proof_endpoint(
    chunk_index: int,
    merkle_leaves: str,  # JSON array of hex leaf hashes
):
    """
    Generate O(log N) Merkle proof for a specific chunk.
    An ECU can verify chunk authenticity with only these sibling hashes — not the full tree.
    This is how Bitcoin SPV nodes work, applied to automotive firmware verification.
    """
    try:
        leaves = json.loads(merkle_leaves)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="merkle_leaves must be a JSON array of hex strings.")

    result = get_merkle_proof(leaves, chunk_index)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result
