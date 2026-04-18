"""
Generates two firmware binary files for demo purposes:
  - firmware_clean.bin    : 10MB of pseudorandom bytes (legitimate firmware)
  - firmware_tampered.bin : identical to clean, but byte 200,000 is flipped
"""
import os
import random

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
SIZE = 10 * 1024 * 1024  # 10MB
TAMPER_BYTE_INDEX = 200_000

print("Generating firmware_clean.bin (10MB)...")
random.seed(42)  # Fixed seed for reproducibility
data = bytearray(random.getrandbits(8) for _ in range(SIZE))
clean_path = os.path.join(OUTPUT_DIR, "firmware_clean.bin")
with open(clean_path, "wb") as f:
    f.write(data)
print(f"  ✔ Saved: {clean_path}")

print("Generating firmware_tampered.bin (byte 200,000 flipped)...")
tampered = bytearray(data)
original_byte = tampered[TAMPER_BYTE_INDEX]
tampered[TAMPER_BYTE_INDEX] = original_byte ^ 0xFF  # Flip all bits
tampered_path = os.path.join(OUTPUT_DIR, "firmware_tampered.bin")
with open(tampered_path, "wb") as f:
    f.write(tampered)
print(f"  ✔ Saved: {tampered_path}")
print(f"  ℹ Tampered byte index: {TAMPER_BYTE_INDEX}")
print(f"    Original: 0x{original_byte:02X} → Modified: 0x{tampered[TAMPER_BYTE_INDEX]:02X}")
print("Done.")
