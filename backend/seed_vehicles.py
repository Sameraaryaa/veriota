"""
Seeds 20 vehicles into Local JSON DB.
All start at v2.1.4 with QUANTUM_SAFE status.
Uses deterministic but realistic SHA-256 hashes (not hardcoded garbage).
"""
import os
import hashlib
from datetime import datetime, timezone
import sys

# Add backend to path so we can import core
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from core.firebase_client import _save_db, _load_db

# 20 Professional/Realistic TATA Vehicles (Indian Manufacturer)
vehicles = [
    "TATA-Nexon-EV-001", "TATA-Nexon-EV-002", "TATA-Nexon-EV-003", "TATA-Nexon-EV-004", "TATA-Nexon-EV-005",
    "TATA-Harrier-EV-01", "TATA-Harrier-EV-02", "TATA-Harrier-EV-03", "TATA-Harrier-EV-04", "TATA-Harrier-EV-05",
    "TATA-Curvv-EV-01", "TATA-Curvv-EV-02", "TATA-Curvv-EV-03", "TATA-Curvv-EV-04", "TATA-Curvv-EV-05",
    "TATA-Punch-EV-01", "TATA-Punch-EV-02", "TATA-Punch-EV-03", "TATA-Punch-EV-04", "TATA-Punch-EV-05"
]

print(f"Seeding {len(vehicles)} vehicles into Local JSON DB...")
db = _load_db()

# Wipe the old ledger completely so ghost VINs (like VIN-007) are removed
db["vehicle_ledger"] = {}

for vid in vehicles:
    now = datetime.now(timezone.utc).isoformat()

    # Deterministic, vehicle-specific firmware hash
    firmware_hash = hashlib.sha256(
        f"veriota_v2.1.4_firmware_for_{vid}_baseline".encode()
    ).hexdigest()

    db["vehicle_ledger"][vid] = {
        "vehicle_id": vid,
        "current_version": "2.1.4",
        "current_hash": firmware_hash,
        "algorithm": "ML-DSA-65",
        "nist_standard": "FIPS 204",
        "status": "QUANTUM_SAFE",
        "alerts": [],
        "update_history": [
            {
                "version": "1.0.0",
                "firmware_hash": hashlib.sha256(f"veriota_v1.0.0_firmware_for_{vid}".encode()).hexdigest(),
                "installed_at": datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc).isoformat(),
                "status": "QUANTUM_SAFE",
            },
            {
                "version": "2.0.0",
                "firmware_hash": hashlib.sha256(f"veriota_v2.0.0_firmware_for_{vid}".encode()).hexdigest(),
                "installed_at": datetime(2025, 6, 10, 14, 30, 0, tzinfo=timezone.utc).isoformat(),
                "status": "QUANTUM_SAFE",
            },
            {
                "version": "2.1.4",
                "firmware_hash": firmware_hash,
                "installed_at": now,
                "status": "QUANTUM_SAFE",
            },
        ],
    }
    print(f"  ✔ Seeded {vid} — hash: {firmware_hash[:16]}...")

_save_db(db)

print(f"\nDone — {len(vehicles)} vehicles seeded at v2.1.4 (QUANTUM_SAFE), ML-DSA-65, FIPS 204.")
print("Database migrated to local database.json successfully.")
