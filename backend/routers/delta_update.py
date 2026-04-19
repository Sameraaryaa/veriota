import os
import hashlib
import json
from datetime import datetime, timezone
from fastapi import APIRouter
from core.dilithium import load_or_generate_keypair, sign_message, encode_b64

router = APIRouter(prefix="/api/delta", tags=["delta-update"])

PRIVATE_KEY_PATH = os.getenv("DILITHIUM_PRIVATE_KEY_PATH", "./keys/dilithium3_private.key")
PUBLIC_KEY_PATH = os.getenv("DILITHIUM_PUBLIC_KEY_PATH", "./keys/dilithium3_public.key")

@router.post("/simulate")
async def simulate_delta_update():
    """
    Simulates sending a small delta patch (e.g., 10MB) instead of a full firmware image (500MB).
    Only the modified ECU chunks are hashed and signed with ML-DSA-65.
    """
    full_firmware_size = 500 * 1024 * 1024 # 500 MB
    delta_patch_size = 10 * 1024 * 1024 # 10 MB
    
    # Simulate changed chunks
    changed_chunks = [
        {"chunk_id": 42, "module": "Braking System", "hash": hashlib.sha256(b"brake_v2.1.5").hexdigest()},
        {"chunk_id": 89, "module": "Infotainment", "hash": hashlib.sha256(b"info_v2.1.5").hexdigest()}
    ]
    
    # Compute delta Merkle root (simulated)
    merkle_sub_tree = "".join([c["hash"] for c in changed_chunks]).encode("utf-8")
    delta_root = hashlib.sha256(merkle_sub_tree).hexdigest()
    
    payload = json.dumps({
        "base_version": "v2.1.4",
        "target_version": "v2.1.5",
        "delta_root": delta_root,
        "changed_chunks": changed_chunks
    }, sort_keys=True).encode("utf-8")
    
    pub_pqc, priv_pqc = load_or_generate_keypair(PRIVATE_KEY_PATH, PUBLIC_KEY_PATH)
    sig_pqc = sign_message(payload, priv_pqc)
    
    return {
        "status": "DELTA_PATCH_GENERATED",
        "base_version": "v2.1.4",
        "target_version": "v2.1.5",
        "full_image_size_bytes": full_firmware_size,
        "delta_patch_size_bytes": delta_patch_size,
        "bandwidth_saved_pct": round(((full_firmware_size - delta_patch_size) / full_firmware_size) * 100, 2),
        "changed_modules": len(changed_chunks),
        "delta_merkle_root": delta_root,
        "signature": encode_b64(sig_pqc),
        "algorithm": "ML-DSA-65"
    }
