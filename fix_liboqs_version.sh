#!/bin/bash
set -e

echo "=== Reinstalling matching liboqs-python wrapper for C lib 0.12.0 ==="
source ~/veriota-dev/venv/bin/activate

# Uninstall old version
pip uninstall liboqs-python -y 2>/dev/null || true

# Clone the Python wrapper at 0.12.0 tag
cd /tmp
rm -rf liboqs-python
git clone --depth 1 --branch 0.12.0 https://github.com/open-quantum-safe/liboqs-python.git
cd liboqs-python

# The C library is already installed at /usr/local
# Set env vars so the wrapper knows not to auto-download
pip install . 2>&1 | tail -10

echo "=== Testing Dilithium3 end-to-end ==="
python3 << 'PYEOF'
import oqs
mechs = oqs.get_enabled_sig_mechanisms()
print("Dilithium3 available:", "Dilithium3" in mechs)
sig = oqs.Signature("Dilithium3")
pub = sig.generate_keypair()
msg = b"VeriOTA firmware hash test"
signature = sig.sign(msg)
ok = sig.verify(msg, signature, pub)
print("Sign + Verify:", "PASS" if ok else "FAIL")
print("Public key size:", len(pub), "bytes (expected: 1952)")
print("Signature size:", len(signature), "bytes (expected: 3293)")
PYEOF
echo "=== Agent 1 COMPLETE ==="
