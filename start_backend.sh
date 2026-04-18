#!/bin/bash
# Copies latest backend files and launches uvicorn

cp -r /mnt/c/Users/arya/Desktop/veriota/backend/* ~/veriota-dev/backend/

source ~/veriota-dev/venv/bin/activate
cd ~/veriota-dev/backend

echo "=== VeriOTA Backend Starting ==="
echo "  API:  http://localhost:8000"
echo "  Docs: http://localhost:8000/docs"
echo "  Health: http://localhost:8000/health"
echo ""
uvicorn main:app --reload --host 0.0.0.0 --port 8000
