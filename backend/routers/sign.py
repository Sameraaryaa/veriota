"""
VeriOTA — Signing Engine (ML-DSA-65 / FIPS 204)
Crypto-agile: algorithm selectable via PQC_ALGORITHM env var.
"""
import os
import hashlib
import json
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from core.dilithium import load_or_generate_keypair, sign_message, encode_b64, get_algorithm_info
from core.merkle import build_merkle_tree

router = APIRouter()

PRIVATE_KEY_PATH = os.getenv("DILITHIUM_PRIVATE_KEY_PATH", "./keys/dilithium3_private.key")
PUBLIC_KEY_PATH = os.getenv("DILITHIUM_PUBLIC_KEY_PATH", "./keys/dilithium3_public.key")


@router.post("/sign")
async def sign_firmware(
    firmware: UploadFile = File(...),
    vehicle_id: str = Form(default="GLOBAL"),
):
    """
    Sign firmware with ML-DSA-65 (NIST FIPS 204).
    Produces a composite payload: merkle_root + timestamp + firmware_hash + vehicle_id.
    This prevents:
    - Replay attacks (timestamp binding)
    - Cross-vehicle flashing (vehicle_id binding)
    - Firmware tampering (Merkle root binding)
    """
    firmware_bytes = await firmware.read()
    if not firmware_bytes:
        raise HTTPException(status_code=400, detail="Firmware file is empty.")

    public_key, private_key = load_or_generate_keypair(PRIVATE_KEY_PATH, PUBLIC_KEY_PATH)
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

    signature = sign_message(signed_payload, private_key)
    algo = get_algorithm_info()

    return {
        "algorithm": algo["algorithm"],
        "nist_standard": algo["nist_standard"],
        "nist_level": algo["nist_level"],
        "quantum_security_bits": algo["quantum_security_bits"],
        "hard_problem": algo["hard_problem"],
        "firmware_hash": firmware_hash,
        "firmware_size": len(firmware_bytes),
        "chunk_size": 4096,
        "chunk_count": merkle_data["chunk_count"],
        "tree_depth": merkle_data.get("tree_depth", 0),
        "merkle_root": merkle_data["root"],
        "merkle_leaves": merkle_data["leaves"],
        "public_key": encode_b64(public_key),
        "signature": encode_b64(signature),
        "signature_size_bytes": algo["signature_bytes"],
        "public_key_size_bytes": algo["public_key_bytes"],
        "signed_at": signed_at,
        "vehicle_id": vehicle_id,
        "payload_binding": "merkle_root + timestamp + firmware_hash + vehicle_id (composite)",
        "vs_rsa2048": f"Signature is {algo['signature_bytes']} bytes vs RSA-2048's 256 bytes — but only {algo['signature_bytes'] / len(firmware_bytes) * 100:.4f}% of firmware size",
    }
