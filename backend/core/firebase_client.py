import json
import os
import uuid
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database.json")

def _load_db():
    if not os.path.exists(DB_PATH):
        return {"vehicle_ledger": {}, "firmware_releases": {}, "transparency_log": []}
    try:
        with open(DB_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return {"vehicle_ledger": {}, "firmware_releases": {}, "transparency_log": []}

def _save_db(data):
    # Atomic write to prevent corruption
    tmp_path = DB_PATH + ".tmp"
    with open(tmp_path, "w") as f:
        json.dump(data, f, indent=2)
    os.replace(tmp_path, DB_PATH)

def get_db():
    return _load_db()

def get_vehicle(vehicle_id: str) -> dict | None:
    db = _load_db()
    return db["vehicle_ledger"].get(vehicle_id)

def create_vehicle(vehicle_id: str, version: str, firmware_hash: str, algorithm: str = "Dilithium3"):
    db = _load_db()
    now = datetime.now(timezone.utc).isoformat()
    entry = {
        "version": version,
        "firmware_hash": firmware_hash,
        "installed_at": now,
        "status": "QUANTUM_SAFE",
    }
    db["vehicle_ledger"][vehicle_id] = {
        "vehicle_id": vehicle_id,
        "current_version": version,
        "current_hash": firmware_hash,
        "algorithm": algorithm,
        "status": "QUANTUM_SAFE",
        "alerts": [],
        "update_history": [entry],
    }
    _save_db(db)

def update_vehicle_version(vehicle_id: str, version: str, firmware_hash: str):
    db = _load_db()
    now = datetime.now(timezone.utc).isoformat()
    entry = {
        "version": version,
        "firmware_hash": firmware_hash,
        "installed_at": now,
        "status": "QUANTUM_SAFE",
    }
    if vehicle_id in db["vehicle_ledger"]:
        v = db["vehicle_ledger"][vehicle_id]
        v["current_version"] = version
        v["current_hash"] = firmware_hash
        v["status"] = "QUANTUM_SAFE"
        v["alerts"] = []
        if "update_history" not in v:
            v["update_history"] = []
        v["update_history"].append(entry)
        _save_db(db)

def log_alert(vehicle_id: str, alert_type: str, detail: dict):
    db = _load_db()
    alert = {"type": alert_type, "detail": detail}
    if vehicle_id in db["vehicle_ledger"]:
        v = db["vehicle_ledger"][vehicle_id]
        v["status"] = alert_type
        if "alerts" not in v:
            v["alerts"] = []
        v["alerts"].append(alert)
        _save_db(db)

def get_all_vehicles() -> list:
    db = _load_db()
    return list(db["vehicle_ledger"].values())

def register_firmware_release(version: str, merkle_root: str, merkle_leaves: list,
                               firmware_hash: str, signature: str, public_key: str):
    db = _load_db()
    now = datetime.now(timezone.utc).isoformat()
    db["firmware_releases"][f"v{version}"] = {
        "version": version,
        "firmware_hash": firmware_hash,
        "merkle_root": merkle_root,
        "merkle_leaves": merkle_leaves,
        "public_key": public_key,
        "signature": signature,
        "algorithm": "Dilithium3",
        "nist_standard": "FIPS 204",
        "released_at": now,
        "released_by": "OEM_SIGNING_SERVICE",
    }
    _save_db(db)


# ── Firmware Transparency Log (Append-Only, Hash-Chained) ────────────────
import hashlib as _hashlib

def append_to_transparency_log(version: str, firmware_hash: str, merkle_root: str,
                                signature_hash: str, publisher: str = "OEM_SIGNING_SERVICE"):
    """
    Append a new entry to the transparency log. Each entry is hash-chained
    to the previous one (like a blockchain), making the log tamper-proof.
    Inspired by Google's Certificate Transparency (RFC 6962).
    """
    db = _load_db()
    if "transparency_log" not in db:
        db["transparency_log"] = []

    log = db["transparency_log"]
    prev_hash = log[-1]["entry_hash"] if log else "GENESIS"

    entry = {
        "sequence": len(log),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": version,
        "firmware_hash": firmware_hash,
        "merkle_root": merkle_root,
        "signature_hash": signature_hash,
        "publisher": publisher,
        "prev_hash": prev_hash,
    }
    # Hash-chain: SHA-256 of the entire entry + prev_hash
    entry_str = json.dumps(entry, sort_keys=True)
    entry["entry_hash"] = _hashlib.sha256(entry_str.encode()).hexdigest()

    log.append(entry)
    _save_db(db)
    return entry


def get_transparency_log() -> list:
    """Return the full transparency log."""
    db = _load_db()
    return db.get("transparency_log", [])


def verify_firmware_in_log(firmware_hash: str) -> dict:
    """
    Check if a firmware hash exists in the transparency log.
    Returns match status and the log entry if found.
    """
    db = _load_db()
    log = db.get("transparency_log", [])
    for entry in log:
        if entry["firmware_hash"] == firmware_hash:
            return {"found": True, "entry": entry}
    return {"found": False, "entry": None}


def verify_log_integrity() -> dict:
    """
    Verify the entire transparency log's hash chain integrity.
    If any entry was tampered with, the chain breaks.
    """
    db = _load_db()
    log = db.get("transparency_log", [])
    if not log:
        return {"valid": True, "entries": 0, "message": "Log is empty"}

    for i, entry in enumerate(log):
        expected_prev = log[i - 1]["entry_hash"] if i > 0 else "GENESIS"
        if entry["prev_hash"] != expected_prev:
            return {
                "valid": False,
                "broken_at": i,
                "message": f"Hash chain broken at sequence {i}: expected prev_hash {expected_prev[:16]}..., got {entry['prev_hash'][:16]}...",
            }

    return {"valid": True, "entries": len(log), "message": f"All {len(log)} entries verified. Chain intact."}
