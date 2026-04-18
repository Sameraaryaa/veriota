"""
Demo Scenario 3: RSA-2048 vs CRYSTALS-Dilithium3 Side-by-Side Comparison
Signs the same firmware with both algorithms and prints a comparison table.
Usage: python rsa_comparison.py
"""
import time
import os
import hashlib
import base64
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
import oqs

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FIRMWARE_PATH = os.path.join(SCRIPT_DIR, "firmware_clean.bin")

if not os.path.exists(FIRMWARE_PATH):
    print("ERROR: firmware_clean.bin not found. Run generate_firmware.py first.")
    exit(1)

print("Loading firmware_clean.bin (10MB)...")
with open(FIRMWARE_PATH, "rb") as f:
    firmware_bytes = f.read()

firmware_hash = hashlib.sha256(firmware_bytes).digest()
print(f"Firmware hash: {firmware_hash.hex()[:32]}...")

# === RSA-2048 Benchmark ===
print("\nBenchmarking RSA-2048...")
rsa_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
t0 = time.perf_counter()
rsa_sig = rsa_key.sign(firmware_hash, padding.PKCS1v15(), hashes.SHA256())
rsa_sign_time = (time.perf_counter() - t0) * 1000

t0 = time.perf_counter()
rsa_key.public_key().verify(rsa_sig, firmware_hash, padding.PKCS1v15(), hashes.SHA256())
rsa_verify_time = (time.perf_counter() - t0) * 1000

rsa_pub_bytes = rsa_key.public_key().public_bytes(
    serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo
)

# === Dilithium3 Benchmark ===
print("Benchmarking CRYSTALS-Dilithium3...")
with oqs.Signature("Dilithium3") as sig:
    t0 = time.perf_counter()
    pub_key = sig.generate_keypair()
    dil_sig = sig.sign(firmware_hash)
    dil_sign_time = (time.perf_counter() - t0) * 1000
    priv_key_bytes = sig.export_secret_key()

with oqs.Signature("Dilithium3") as verifier:
    t0 = time.perf_counter()
    verifier.verify(firmware_hash, dil_sig, pub_key)
    dil_verify_time = (time.perf_counter() - t0) * 1000

# === Output Comparison Table ===
print(f"\n{'=' * 68}")
print(f"  {'Property':<30} {'RSA-2048':<18} {'Dilithium3 (VeriOTA)':<18}")
print(f"  {'-' * 65}")
rows = [
    ("Hard Problem",              "Integer Factorization",   "Module-LWE / MSIS"),
    ("Quantum Safe?",             "❌ NO (Shor's breaks it)", "✅ YES (no attack)"),
    ("Classical Security",        "~112 bits",               "~140 bits"),
    ("Quantum Security",          "💀 BROKEN",              "~128+ bits"),
    ("NIST Status",               "Legacy (deprecated)",     "FIPS 204 (Aug 2024)"),
    (f"Public Key Size",          f"{len(rsa_pub_bytes)} bytes",    f"{len(pub_key)} bytes"),
    (f"Signature Size",           f"{len(rsa_sig)} bytes",          f"{len(dil_sig)} bytes"),
    (f"Sign Time",                f"{rsa_sign_time:.2f} ms",        f"{dil_sign_time:.2f} ms"),
    (f"Verify Time",              f"{rsa_verify_time:.3f} ms",      f"{dil_verify_time:.3f} ms"),
    ("Automotive OTA (current)",  "Uptane default",          "VeriOTA (this system)"),
    ("Dashboard Badge",           "⚠ QUANTUM VULNERABLE",   "✓ QUANTUM SAFE"),
]
for prop, rsa_val, dil_val in rows:
    print(f"  {prop:<30} {rsa_val:<18} {dil_val:<18}")
print(f"{'=' * 68}")
print(f"\nOverhead vs RSA: Dilithium3 signature is {len(dil_sig) / len(rsa_sig):.1f}x larger")
print(f"But: {len(dil_sig)} bytes is {len(dil_sig) / len(firmware_bytes) * 100:.4f}% of a 10MB firmware")
print("Conclusion: Overhead is negligible. Security gain is total.")
