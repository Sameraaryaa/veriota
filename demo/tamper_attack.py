"""
Demo Scenario 1: Firmware Tamper Attack
Uploads firmware_tampered.bin to /verify endpoint.
Updates vehicle_ledger in Firestore via the write_alert flag so dashboard turns RED.
Usage: python tamper_attack.py --api http://localhost:8001 --vehicle VIN-007
"""
import argparse
import json
import os
import requests

parser = argparse.ArgumentParser(description="VeriOTA Demo — Tamper Attack")
parser.add_argument("--api", default="http://localhost:8001", help="Backend API URL")
parser.add_argument("--vehicle", default="VIN-007", help="Target vehicle VIN")
args = parser.parse_args()

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CLEAN_BIN = os.path.join(SCRIPT_DIR, "firmware_clean.bin")
TAMPERED_BIN = os.path.join(SCRIPT_DIR, "firmware_tampered.bin")

if not os.path.exists(CLEAN_BIN):
    print("ERROR: firmware_clean.bin not found. Run: python generate_firmware.py")
    exit(1)

if not os.path.exists(TAMPERED_BIN):
    print("ERROR: firmware_tampered.bin not found. Run: python generate_firmware.py")
    exit(1)

print("=" * 62)
print("  VeriOTA — Demo Scenario 1: Firmware Tamper Attack")
print("=" * 62)
print(f"  Target Vehicle : {args.vehicle}")
print(f"  Backend API    : {args.api}")
print()

# Step 1: Sign the clean firmware to get trusted Merkle metadata
print("[STEP 1] Signing clean firmware with ML-DSA-65 (FIPS 204)...")
with open(CLEAN_BIN, "rb") as f:
    sign_res = requests.post(
        f"{args.api}/sign",
        files={"firmware": ("firmware_clean.bin", f, "application/octet-stream")},
        data={"vehicle_id": args.vehicle},
        timeout=60,
    )
sign_res.raise_for_status()
meta = sign_res.json()

print(f"  ✔ Algorithm    : {meta.get('algorithm', 'ML-DSA-65')} ({meta.get('nist_standard', 'FIPS 204')})")
print(f"  ✔ Merkle root  : {meta['merkle_root'][:24]}...")
print(f"  ✔ Chunks       : {meta['chunk_count']} × 4KB = {meta['firmware_size'] // 1024}KB firmware")
print(f"  ✔ Signed at    : {meta['signed_at']}")
print(f"  ✔ Vehicle VIN  : {meta['vehicle_id']}")
print(f"  ✔ Sig size     : {meta.get('signature_size_bytes', 3293)} bytes (vs RSA-2048: 256 bytes)")
print()

# Step 2: Submit tampered firmware — simulates attacker flipping byte 200000
print("[STEP 2] Submitting TAMPERED firmware (byte 200,000 flipped to simulate CAN backdoor injection)...")
trusted_merkle = json.dumps({"root": meta["merkle_root"], "leaves": meta["merkle_leaves"]})

with open(TAMPERED_BIN, "rb") as f:
    verify_res = requests.post(
        f"{args.api}/verify",
        files={"firmware": ("firmware_tampered.bin", f, "application/octet-stream")},
        data={
            "signature": meta["signature"],
            "public_key": meta["public_key"],
            "trusted_merkle": trusted_merkle,
            "signed_at": meta["signed_at"],
            "firmware_hash_signed": meta["firmware_hash"],
            "vehicle_id": args.vehicle,
            "write_alert": "true",   # ← This triggers the Firestore write → dashboard update
        },
        timeout=60,
    )
verify_res.raise_for_status()
result = verify_res.json()

print()
print("=" * 62)
print(f"  STATUS              : {result['status']}")
print(f"  Signature valid     : {result['signature_valid']}")
print(f"  Merkle match        : {result['merkle_match']}")
print(f"  Installation safe   : {result['installation_safe']}")
print(f"  Firestore alert     : {result.get('alert_written_to_firestore', False)}")
print()

if result.get("tampered_chunks"):
    print(f"  ⚠  TAMPERED CHUNKS ({len(result['tampered_chunks'])} detected):")
    for chunk in result["tampered_chunks"][:5]:
        print(f"    ├─ Chunk #{chunk['chunk_index']} — Bytes {chunk['byte_start']}–{chunk['byte_end']}")
        print(f"    ├─ Trusted hash : {chunk.get('trusted_hash', '')[:24]}...")
        print(f"    └─ Computed hash: {chunk.get('computed_hash', '')[:24]}...")
else:
    print("  No tampered chunks detected.")

print()
if result.get("forensic_summary"):
    print(f"  FORENSIC SUMMARY: {result['forensic_summary']}")

print("=" * 62)
print()
print("✔ Demo Scenario 1 complete.")
print(f"  → Dashboard VIN {args.vehicle} should now be RED (TAMPERED)")
print(f"  → Click the node to see chunk #, byte range, and hash diff")
