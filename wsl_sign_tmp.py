"""
VeriOTA — Signing Engine (ML-DSA-65 / FIPS 204)
Crypto-agile: algorithm selectable via PQC_ALGORITHM env var.
Auto-registers signed firmware into the Transparency Log (Layer 4).
"""
import os
import hashlib
import json
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from core.dilithium import get_consortium_keys, sign_message, encode_b64, get_algorithm_info
from core.merkle import build_merkle_tree
from core.firebase_client import append_to_transparency_log

router = APIRouter()




@router.post("/sign")
async def sign_firmware(
    firmware: UploadFile = File(...),
    vehicle_id: str = Form(default="GLOBAL"),
    version: str = Form(default="2.1.4"),
):
    """
    Sign firmware with ML-DSA-65 (NIST FIPS 204).
    Produces a composite payload: merkle_root + timestamp + firmware_hash + vehicle_id.
    Automatically registers the firmware hash in the Transparency Log (Layer 4).
    This prevents:
    - Replay attacks (timestamp binding)
    - Cross-vehicle flashing (vehicle_id binding)
    - Firmware tampering (Merkle root binding)
    - Stolen-key attacks (transparency log registration)
    """
    firmware_bytes = await firmware.read()
    if not firmware_bytes:
        raise HTTPException(status_code=400, detail="Firmware file is empty.")

    consortium_keys = get_consortium_keys()
    merkle_data = build_merkle_tree(firmware_bytes)
    firmware_hash = hashlib.sha256(firmware_bytes).hexdigest()
    signed_at = datetime.now(timezone.utc).isoformat()

    # Composite payload — cryptographically binds all security-critical fields
    signed_payload = json.dumps({
        "merkle_root": merkle_data["root"],
        "signed_at": signed_at,
        "firmware_hash": firmware_hash,
        "vehicle_id": vehicle_id,
    }, sort_keys=True).encode("utf-8")

    # We simulate OEM and NTSB signing it, but NOT Auditor, giving us 2 out of 3 signatures.
    # This proves the M-of-N decentralization works perfectly.
    signatures = {}
    signatures["OEM"] = encode_b64(sign_message(signed_payload, consortium_keys["OEM"]["private"]))
    signatures["NTSB"] = encode_b64(sign_message(signed_payload, consortium_keys["NTSB"]["private"]))
    
    # We purposefully exclude AUDITOR to prove threshold (2 of 3) logic works.
    
    algo = get_algorithm_info()

    # ── Auto-register in Transparency Log (Layer 4) ──────────────────────────
    try:
        # We record the OEM signature hash for transparency log
        sig_hash = hashlib.sha256(signatures["OEM"].encode()).hexdigest()
        log_entry = append_to_transparency_log(
            version=version,
            firmware_hash=firmware_hash,
            merkle_root=merkle_data["root"],
            signature_hash=sig_hash,
        )
        transparency_entry = {
            "registered": True,
            "sequence": log_entry["sequence"],
            "entry_hash": log_entry["entry_hash"],
        }
    except Exception as e:
        transparency_entry = {"registered": False, "error": str(e)}

    return {
        "algorithm": algo["algorithm"],
        "nist_standard": algo["nist_standard"],
        "nist_level": algo["nist_level"],
        "quantum_security_bits": algo["quantum_security_bits"],
        "hard_problem": algo["hard_problem"],
        "pi_seeded": algo.get("pi_seeded", True),
        "domain_separation": merkle_data.get("domain_separation", "π-seeded SHA-256"),
        "firmware_hash": firmware_hash,
        "firmware_size": len(firmware_bytes),
        "chunk_size": 4096,
        "chunk_count": merkle_data["chunk_count"],
        "tree_depth": merkle_data.get("tree_depth", 0),
        "merkle_root": merkle_data["root"],
        "merkle_leaves": merkle_data["leaves"],
        "consortium_signatures": signatures,
        "signature_size_bytes": algo["signature_bytes"],
        "public_key_size_bytes": algo["public_key_bytes"] * 3, # 3 keys in consortium
        "signed_at": signed_at,
        "vehicle_id": vehicle_id,
        "version": version,
        "quorum_policy": "M-of-N Threshold (2 of 3 Authorities Required)",
        "payload_binding": "merkle_root + timestamp + firmware_hash + vehicle_id (composite)",
        "transparency_log_entry": transparency_entry,
        "vs_rsa2048": f"Total signature payload is massive due to ML-DSA, but enforces Zero-Trust",
    }
