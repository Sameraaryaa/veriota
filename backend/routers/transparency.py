"""
VeriOTA — Firmware Transparency Log Router
Inspired by Google's Certificate Transparency (RFC 6962).

Defense against: Compromised OEM signing key.
If attacker steals the private key, they can sign firmware — but they can't
add entries to the transparency log. ECU checks the log before accepting.

Endpoints:
  - POST /api/transparency/publish  — OEM publishes firmware to the log
  - GET  /api/transparency/log      — View the full append-only log
  - GET  /api/transparency/verify   — Verify hash chain integrity
  - POST /api/transparency/check    — Check if a firmware hash is in the log
"""
import hashlib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.firebase_client import (
    append_to_transparency_log, get_transparency_log,
    verify_firmware_in_log, verify_log_integrity
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
        "log": log,
    }


@router.get("/api/transparency/verify")
async def verify_chain():
    """Verify the hash chain integrity of the transparency log."""
    result = verify_log_integrity()
    return result


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
