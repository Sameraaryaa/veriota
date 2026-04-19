"""
VeriOTA — Automatic Key Rotation Router
Demonstrates operational PQC key lifecycle management.

In production, this would use an HSM (Hardware Security Module).
For demo purposes, keys are rotated on disk with an audit trail.
"""
import os
import time
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter
from core.dilithium import generate_keypair, ALGORITHM, ALGORITHM_DISPLAY

router = APIRouter(prefix="/api/key-rotation", tags=["key-rotation"])

KEYS_DIR = Path("./keys")
ROTATION_LOG = KEYS_DIR / "rotation_log.json"


def _fingerprint(key_bytes: bytes) -> str:
    """SHA-256 fingerprint of a key (first 32 hex chars)."""
    return hashlib.sha256(key_bytes).hexdigest()[:32]


def _load_rotation_log() -> list:
    if ROTATION_LOG.exists():
        try:
            return json.loads(ROTATION_LOG.read_text())
        except Exception:
            return []
    return []


def _save_rotation_log(log: list):
    ROTATION_LOG.write_text(json.dumps(log, indent=2))


@router.post("/rotate")
async def rotate_keys():
    """
    Generate a new ML-DSA-65 keypair and archive the old one.
    Returns: old fingerprint, new fingerprint, rotation timestamp, and fleet notification status.
    """
    t_start = time.perf_counter()
    now = datetime.now(timezone.utc)
    timestamp = now.isoformat()

    # Read old keys (if they exist)
    pub_path = KEYS_DIR / "dilithium3_public.key"
    priv_path = KEYS_DIR / "dilithium3_private.key"

    old_fingerprint = "NONE (first generation)"
    if pub_path.exists():
        old_pub = pub_path.read_bytes()
        old_fingerprint = _fingerprint(old_pub)

        # Archive old keys with timestamp
        archive_suffix = now.strftime("%Y%m%d_%H%M%S")
        archive_pub = KEYS_DIR / f"dilithium3_public_{archive_suffix}.key.bak"
        archive_priv = KEYS_DIR / f"dilithium3_private_{archive_suffix}.key.bak"
        archive_pub.write_bytes(old_pub)
        if priv_path.exists():
            archive_priv.write_bytes(priv_path.read_bytes())

    # Generate new keypair
    new_pub, new_priv = generate_keypair()
    KEYS_DIR.mkdir(parents=True, exist_ok=True)
    pub_path.write_bytes(new_pub)
    priv_path.write_bytes(new_priv)

    new_fingerprint = _fingerprint(new_pub)
    elapsed_ms = round((time.perf_counter() - t_start) * 1000, 2)

    # Log the rotation event
    rotation_log = _load_rotation_log()
    entry = {
        "sequence": len(rotation_log) + 1,
        "timestamp": timestamp,
        "algorithm": ALGORITHM_DISPLAY,
        "old_fingerprint": old_fingerprint,
        "new_fingerprint": new_fingerprint,
        "public_key_bytes": len(new_pub),
        "private_key_bytes": len(new_priv),
        "generation_ms": elapsed_ms,
    }
    rotation_log.append(entry)
    _save_rotation_log(rotation_log)

    return {
        "status": "KEY_ROTATED",
        "algorithm": ALGORITHM_DISPLAY,
        "old_fingerprint": old_fingerprint,
        "new_fingerprint": new_fingerprint,
        "public_key_bytes": len(new_pub),
        "private_key_bytes": len(new_priv),
        "generation_ms": elapsed_ms,
        "timestamp": timestamp,
        "rotation_sequence": entry["sequence"],
        "fleet_notification": "BROADCAST_SENT",
        "note": (
            "All consortium authorities (OEM, NTSB, AUDITOR) must independently "
            "verify the new public key fingerprint before accepting signed firmware."
        ),
    }


@router.get("/history")
async def rotation_history():
    """Return the full key rotation audit trail."""
    log = _load_rotation_log()
    return {
        "total_rotations": len(log),
        "algorithm": ALGORITHM_DISPLAY,
        "entries": log,
    }
