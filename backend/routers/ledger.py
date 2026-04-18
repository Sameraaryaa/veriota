import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import semver
from core.firebase_client import (
    get_vehicle, create_vehicle, update_vehicle_version,
    log_alert, get_all_vehicles, register_firmware_release
)

router = APIRouter()


class LedgerUpdateRequest(BaseModel):
    vehicle_id: str
    version: str
    firmware_hash: str
    signature: Optional[str] = None


class LedgerRegisterRequest(BaseModel):
    version: str
    merkle_root: str
    merkle_leaves: list
    firmware_hash: str
    signature: str
    public_key: str


@router.post("/ledger/update")
async def update_ledger(req: LedgerUpdateRequest):
    """
    Update a vehicle's firmware version in the ledger.
    Blocks rollback: new version must be strictly greater than current version.
    Enhancement: even with a valid signature, rollback is refused by the ledger.
    """
    vehicle = get_vehicle(req.vehicle_id)

    if vehicle is None:
        # First time this vehicle is seen — create its ledger entry
        create_vehicle(req.vehicle_id, req.version, req.firmware_hash)
        now = datetime.now(timezone.utc).isoformat()
        return {
            "status": "APPROVED",
            "vehicle_id": req.vehicle_id,
            "new_version": req.version,
            "previous_version": None,
            "ledger_entry_id": f"ldg_{uuid.uuid4().hex[:12]}",
            "timestamp": now,
            "message": "Vehicle registered and firmware version recorded.",
        }

    current_version = vehicle.get("current_version", "0.0.0")

    # Semantic version comparison — strictly greater required
    try:
        is_newer = semver.compare(req.version, current_version) > 0
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid semver format: {req.version} or {current_version}"
        )

    if not is_newer:
        # Rollback detected — log alert and block
        log_alert(req.vehicle_id, "ROLLBACK_BLOCKED", {
            "attempted_version": req.version,
            "current_version": current_version,
        })
        _fleet_cache["data"] = None  # Invalidate cache so dashboard sees RED/AMBER immediately
        raise HTTPException(status_code=409, detail={
            "status": "ROLLBACK_BLOCKED",
            "vehicle_id": req.vehicle_id,
            "attempted_version": req.version,
            "current_version": current_version,
            "reason": (
                f"Attempted version ({req.version}) is not greater than "
                f"current version ({current_version})."
            ),
        })

    # Version is valid — approve and update
    update_vehicle_version(req.vehicle_id, req.version, req.firmware_hash)
    _fleet_cache["data"] = None  # Invalidate cache
    now = datetime.now(timezone.utc).isoformat()
    return {
        "status": "APPROVED",
        "vehicle_id": req.vehicle_id,
        "new_version": req.version,
        "previous_version": current_version,
        "ledger_entry_id": f"ldg_{uuid.uuid4().hex[:12]}",
        "timestamp": now,
    }


@router.post("/ledger/register")
async def register_release(req: LedgerRegisterRequest):
    """Register a new firmware release in the firmware_releases collection."""
    register_firmware_release(
        version=req.version,
        merkle_root=req.merkle_root,
        merkle_leaves=req.merkle_leaves,
        firmware_hash=req.firmware_hash,
        signature=req.signature,
        public_key=req.public_key,
    )
    return {"status": "REGISTERED", "version": req.version}


# ── Fleet Cache (prevents Firestore quota exhaustion from dashboard polling) ──
import time as _time
_fleet_cache: dict = {"data": None, "ts": 0}
_FLEET_CACHE_TTL = 3  # seconds — Firestore hit at most every 3s


@router.get("/fleet")
async def get_fleet():
    """Return status of all vehicles for the dashboard. Cached for 3s."""
    now = _time.time()
    if _fleet_cache["data"] and (now - _fleet_cache["ts"]) < _FLEET_CACHE_TTL:
        return _fleet_cache["data"]

    try:
        vehicles = get_all_vehicles()
    except Exception:
        # Firestore quota exhausted or network issue — return stale cache
        if _fleet_cache["data"]:
            return _fleet_cache["data"]
        return {"vehicles": [], "fleet_summary": {"total": 0, "quantum_safe": 0, "tampered": 0, "rollback_blocked": 0, "legacy_rsa": 0}}

    # Extract last_updated from the most recent update_history entry (doc §6.3.4)
    for v in vehicles:
        history = v.get("update_history", [])
        if history:
            last = history[-1]
            installed = last.get("installed_at")
            if installed:
                # Firestore timestamps may be datetime objects or strings
                if hasattr(installed, "isoformat"):
                    v["last_updated"] = installed.isoformat()
                else:
                    v["last_updated"] = str(installed)
            else:
                v["last_updated"] = None
        else:
            v["last_updated"] = None

    summary = {
        "total": len(vehicles),
        "quantum_safe": sum(1 for v in vehicles if v.get("status") == "QUANTUM_SAFE"),
        "tampered": sum(1 for v in vehicles if v.get("status") == "TAMPERED"),
        "rollback_blocked": sum(1 for v in vehicles if v.get("status") == "ROLLBACK_BLOCKED"),
        "legacy_rsa": sum(1 for v in vehicles if v.get("algorithm") == "RSA-2048"),
    }
    result = {"vehicles": vehicles, "fleet_summary": summary}
    _fleet_cache["data"] = result
    _fleet_cache["ts"] = now
    return result


@router.get("/health")
async def health():
    return {"status": "ok", "service": "VeriOTA Backend"}
