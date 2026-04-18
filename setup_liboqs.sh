#!/bin/bash
set -e

source ~/veriota-dev/venv/bin/activate

echo "=== Installing liboqs-python 0.14.1 ==="
pip install liboqs-python==0.14.1 2>&1 | tail -5

echo "=== Checking available signature mechanisms ==="
python3 -c "
import oqs
mechs = oqs.get_enabled_sig_mechanisms()
print('Dilithium3 available:', 'Dilithium3' in mechs)
print('ML-DSA-65 available:', 'ML-DSA-65' in mechs)
print('Dilithium mechanisms:', [m for m in mechs if 'Dilithium' in m or 'ML-DSA' in m])
"
