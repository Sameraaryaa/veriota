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

# 20 Professional/Realistic Vehicle IDs
vehicles = [
    "MBZ-EQS-580-001", "MBZ-EQS-580-002", "MBZ-EQS-580-003", "MBZ-EQS-580-004", "MBZ-EQS-580-005",
    "BMW-i7-xDrive-01", "BMW-i7-xDrive-02", "BMW-i7-xDrive-03", "BMW-i7-xDrive-04", "BMW-i7-xDrive-05",
    "AUDI-eTron-GT-01", "AUDI-eTron-GT-02", "AUDI-eTron-GT-03", "AUDI-eTron-GT-04", "AUDI-eTron-GT-05",
    "TSLA-ModelS-PD-1", "TSLA-ModelS-PD-2", "TSLA-ModelS-PD-3", "TSLA-ModelS-PD-4", "TSLA-ModelS-PD-5"
]

print(f"Seeding {len(vehicles)} vehicles into Local JSON DB...")
db = _load_db()

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
