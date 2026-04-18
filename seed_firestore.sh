#!/bin/bash
set -e

echo "=== Syncing backend files to WSL ==="
cp -r /mnt/c/Users/arya/Desktop/veriota/backend/* ~/veriota-dev/backend/
ls ~/veriota-dev/backend/firebase-service-account.json && echo "  ✔ Service account present"
ls ~/veriota-dev/backend/.env && echo "  ✔ .env present"

source ~/veriota-dev/venv/bin/activate
cd ~/veriota-dev/backend

echo ""
echo "=== Seeding 20 vehicles into Firestore ==="
python3 seed_vehicles.py
