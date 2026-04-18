#!/bin/bash
set -e
source ~/veriota-dev/venv/bin/activate

pip install \
  fastapi==0.110.0 \
  "uvicorn[standard]==0.29.0" \
  python-multipart==0.0.9 \
  firebase-admin==6.5.0 \
  cryptography==42.0.5 \
  pytest==8.1.1 \
  pytest-asyncio==0.23.6 \
  httpx==0.27.0 \
  semver==3.0.2 \
  python-dotenv==1.0.1 \
  requests==2.31.0 \
  2>&1 | tail -20

echo "=== All backend packages installed ==="
python3 -c "import fastapi, uvicorn, firebase_admin, semver, oqs; print('All imports OK')"
