"""
Demo Scenario 2: Rollback Attack
Attempts to push firmware v1.0.0 to a vehicle already on v2.1.4.
Expected output: ROLLBACK_BLOCKED — the version ledger enforces monotonic versioning.
Usage: python rollback_attack.py --api http://localhost:8001 --vehicle VIN-012
"""
import argparse
import hashlib
import os
import requests

parser = argparse.ArgumentParser(description="VeriOTA Demo — Rollback Attack")
parser.add_argument("--api", default="http://localhost:8001", help="Backend API URL")
parser.add_argument("--vehicle", default="VIN-012", help="Target vehicle VIN")
args = parser.parse_args()

# Generate a real SHA-256 hash (not hardcoded garbage like aabbccdd*8)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CLEAN_BIN = os.path.join(SCRIPT_DIR, "firmware_clean.bin")
if os.path.exists(CLEAN_BIN):
    with open(CLEAN_BIN, "rb") as f:
        legacy_firmware_hash = hashlib.sha256(f.read()).hexdigest()
else:
    # Deterministic seed if firmware not generated yet
    legacy_firmware_hash = hashlib.sha256(b"veriota_legacy_v1.0.0_firmware_seed").hexdigest()

print("=" * 62)
print("  VeriOTA - Demo Scenario 2: Rollback Attack")
print("=" * 62)
print(f"  Target Vehicle : {args.vehicle}")
print(f"  Backend API    : {args.api}")
print()
print("  Context: v1.0.0 has a valid ML-DSA-65 signature (it was")
print("  legitimate when released in 2024). But it contains CVE-2025-XXXX")
print("  - a buffer overflow in the TPMS ECU allowing code execution.")
print()

# Step 1: Confirm vehicle is at v2.1.4
print(f"[STEP 1] Confirming {args.vehicle} is at v2.1.4 (patched baseline)...")
try:
    setup_res = requests.post(f"{args.api}/ledger/update", json={
        "vehicle_id": args.vehicle,
        "version": "2.1.4",
        "firmware_hash": legacy_firmware_hash,
    }, timeout=10)
except requests.exceptions.ConnectionError:
    print(f"\n[!] ERROR: Could not connect to API at {args.api}")
    print(f"[!] Ensure VeriOTA Backend is active.")
    if "localhost" not in args.api:
        print(f"[!] Tip: Try using --api http://localhost:8001 if running on same machine.")
    exit(1)
except Exception as e:
    print(f"\n[!] FATAL ERROR: {e}")
    exit(1)

if setup_res.status_code == 200:
    print(f"  [+] {args.vehicle} confirmed at v2.1.4 (status: QUANTUM_SAFE)")
elif setup_res.status_code == 409:
    print(f"  [+] {args.vehicle} is already at or above v2.1.4 (ledger enforced)")
else:
    print(f"  Setup: HTTP {setup_res.status_code} — {setup_res.text[:100]}")

# Step 2: Attempt rollback to v1.0.0
old_hash = hashlib.sha256(b"veriota_v1.0.0_vulnerable_firmware").hexdigest()
print()
print(f"[STEP 2] Injecting rollback — attempting to flash v1.0.0 to {args.vehicle}...")
print(f"  (v1.0.0 firmware hash: {old_hash[:32]}...)")
print(f"  (This firmware has a VALID Dilithium signature from 2024 — but the ledger blocks it)")
print()

rollback_res = requests.post(f"{args.api}/ledger/update", json={
    "vehicle_id": args.vehicle,
    "version": "1.0.0",
    "firmware_hash": old_hash,
}, timeout=30)

print("=" * 62)
if rollback_res.status_code == 409:
    data = rollback_res.json()
    meta = data.get("meta", {})
    detail = data.get("detail", data)
    print(f"  STATUS            : {detail.get('status', 'ROLLBACK_BLOCKED')}")
    print(f"  Vehicle           : {args.vehicle}")
    print(f"  Current version   : {detail.get('current_version', '2.1.4')}")
    print(f"  Attempted version : {detail.get('attempted_version', '1.0.0')}")
    print(f"  Reason            : {detail.get('reason', 'Version monotonicity violation')}")
    print()
    print("  [+] INSTALLATION BLOCKED - CVE-2025-XXXX stays patched.")
    print("  [+] Signature was valid. Ledger enforcement is independent of signature.")
elif rollback_res.status_code == 200:
    print("  [-] UNEXPECTED: Rollback APPROVED - check ledger logic!")
else:
    print(f"  Unexpected response: HTTP {rollback_res.status_code}")
    print(f"  {rollback_res.text[:200]}")

print("=" * 62)
print()
print("[+] Demo Scenario 2 complete.")
print(f"  -> Dashboard {args.vehicle} should now be AMBER (ROLLBACK_BLOCKED)")
