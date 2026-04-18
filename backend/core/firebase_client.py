import json
import os
import uuid
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database.json")

def _load_db():
    if not os.path.exists(DB_PATH):
        return {"vehicle_ledger": {}, "firmware_releases": {}}
    try:
        with open(DB_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return {"vehicle_ledger": {}, "firmware_releases": {}}

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
