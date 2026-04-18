#!/bin/bash
set -e
source ~/veriota-dev/venv/bin/activate

# Copy backend files to WSL home for import resolution
cp -r /mnt/c/Users/arya/Desktop/veriota/backend ~/veriota-dev/

cd ~/veriota-dev/backend

echo "=== Running VeriOTA Test Suite ==="
python3 -m pytest tests/test_sign.py tests/test_verify.py -v --tb=short 2>&1
echo "=== Tests for sign + verify done ==="
