"""
VeriOTA — Firmware Transparency Log Router
Inspired by Google's Certificate Transparency (RFC 6962).

Defense against: Compromised OEM signing key.
If attacker steals the private key, they can sign firmware — but they can't
add entries to the transparency log. ECU checks the log before accepting.

π-Seeded Genesis: The log's genesis hash is derived from π (Nothing-Up-My-Sleeve).

Endpoints:
  - POST /api/transparency/publish     — OEM publishes firmware to the log
  - GET  /api/transparency/log         — View the full append-only log
  - GET  /api/transparency/verify      — Verify hash chain integrity
  - GET  /api/transparency/root        — Get current log root hash
  - GET  /api/transparency/verify/{fw} — Verify inclusion of a specific hash
  - POST /api/transparency/check       — Check if a firmware hash is in the log
"""
import hashlib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.firebase_client import (
    append_to_transparency_log, get_transparency_log,
    verify_firmware_in_log, verify_log_integrity,
    verify_inclusion, get_log_root, PI_GENESIS_HASH
)

router = APIRouter(tags=["Firmware Transparency Log"])


class PublishRequest(BaseModel):
    version: str
    firmware_hash: str
    merkle_root: str
    signature: str


class CheckRequest(BaseModel):
    firmware_hash: str


@router.post("/api/transparency/publish")
async def publish_firmware(req: PublishRequest):
    """
    Publish a firmware version to the transparency log.
    Called by the OEM after signing. Creates a hash-chained log entry.
    """
    sig_hash = hashlib.sha256(req.signature.encode()).hexdigest()
    entry = append_to_transparency_log(
        version=req.version,
        firmware_hash=req.firmware_hash,
        merkle_root=req.merkle_root,
        signature_hash=sig_hash,
    )
    return {
        "status": "PUBLISHED",
        "sequence": entry["sequence"],
        "entry_hash": entry["entry_hash"],
        "prev_hash": entry["prev_hash"],
        "genesis_hash": PI_GENESIS_HASH,
        "message": f"Firmware v{req.version} added to transparency log at sequence {entry['sequence']}",
    }


@router.get("/api/transparency/log")
async def get_log():
    """Return the full firmware transparency log."""
    log = get_transparency_log()
    integrity = verify_log_integrity()
    return {
        "total_entries": len(log),
        "chain_valid": integrity["valid"],
        "integrity_message": integrity["message"],
        "genesis_hash": PI_GENESIS_HASH,
        "log": log,
    }


@router.get("/api/transparency/verify")
async def verify_chain():
    """Verify the hash chain integrity of the transparency log."""
    result = verify_log_integrity()
    return result


@router.get("/api/transparency/root")
async def get_root():
    """Get the current root hash of the transparency log."""
    return get_log_root()


@router.get("/api/transparency/verify/{firmware_hash}")
async def verify_firmware_inclusion(firmware_hash: str):
    """
    Verify inclusion of a specific firmware hash in the transparency log.
    Returns inclusion proof (chain of hashes from genesis to the entry).
    """
    result = verify_inclusion(firmware_hash)
    if result["found"]:
        return {
            "status": "VERIFIED",
            "in_transparency_log": True,
            "position": result["position"],
            "total_entries": result["total_entries"],
            "entry": result["entry"],
            "inclusion_proof": result["inclusion_proof"],
            "genesis_hash": result["genesis_hash"],
            "message": "Firmware hash found in transparency log. Inclusion proof valid.",
        }
    else:
        return {
            "status": "NOT_FOUND",
            "in_transparency_log": False,
            "genesis_hash": result["genesis_hash"],
            "message": "WARNING: Firmware hash NOT in transparency log. Possible stolen-key attack.",
        }


@router.post("/api/transparency/check")
async def check_firmware(req: CheckRequest):
    """
    Check if a firmware hash exists in the transparency log.
    This is the critical check: even with a valid signature,
    firmware NOT in the log is rejected (stolen key scenario).
    """
    result = verify_firmware_in_log(req.firmware_hash)
    if result["found"]:
        return {
            "status": "VERIFIED",
            "in_transparency_log": True,
            "published_at": result["entry"]["timestamp"],
            "sequence": result["entry"]["sequence"],
            "version": result["entry"]["version"],
            "message": "Firmware was officially published by OEM. Safe to install.",
        }
    else:
        return {
            "status": "NOT_FOUND",
            "in_transparency_log": False,
            "message": "WARNING: This firmware hash was NEVER published to the transparency log. "
                       "Possible stolen-key attack. REJECT this firmware.",
        }
