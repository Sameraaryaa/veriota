#!/bin/bash
set -e

echo "=== Building liboqs C library from source ==="
cd /tmp
rm -rf liboqs
git clone --depth 1 --branch 0.12.0 https://github.com/open-quantum-safe/liboqs.git
cd liboqs
mkdir build && cd build
cmake -GNinja .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_SHARED_LIBS=ON \
  -DOQS_DIST_BUILD=ON \
  -DOQS_USE_OPENSSL=ON \
  -DCMAKE_INSTALL_PREFIX=/usr/local
ninja -j$(nproc)
echo "1234" | sudo -S ninja install
echo "1234" | sudo -S ldconfig

echo "=== Verifying liboqs C library ==="
ls /usr/local/lib/liboqs*

echo "=== Installing liboqs-python wrapper ==="
cd /tmp
rm -rf liboqs-python
git clone --depth 1 --branch 0.12.0 https://github.com/open-quantum-safe/liboqs-python.git
cd liboqs-python

source ~/veriota-dev/venv/bin/activate
# Point it to the installed C library
export LIBOQS_INCLUDE_DIR=/usr/local/include
export LIBOQS_LIB_DIR=/usr/local/lib
pip install . --no-build-isolation 2>&1 | tail -10

echo "=== Verifying Dilithium3 is available ==="
python3 -c "
import oqs
mechs = oqs.get_enabled_sig_mechanisms()
print('All PQC sigs:', mechs)
has_dil = 'Dilithium3' in mechs
has_mldsa = 'ML-DSA-65' in mechs
print('Dilithium3 available:', has_dil)
print('ML-DSA-65 available:', has_mldsa)
if has_dil:
    sig = oqs.Signature('Dilithium3')
    print('Dilithium3 init SUCCESS')
elif has_mldsa:
    sig = oqs.Signature('ML-DSA-65')
    print('ML-DSA-65 init SUCCESS (will use this as Dilithium3 equivalent)')
"
