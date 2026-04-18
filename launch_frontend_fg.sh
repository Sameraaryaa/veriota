#!/bin/bash
cp /mnt/c/Users/arya/Desktop/veriota/frontend/.env.local ~/veriota-frontend/.env.local
cp -r /mnt/c/Users/arya/Desktop/veriota/frontend/src/* ~/veriota-frontend/src/
cd ~/veriota-frontend

echo "=== Access Dashboard at ==="
WSL_IP=$(hostname -I | awk '{print $1}')
echo "  http://${WSL_IP}:3001"
echo "  (also try http://localhost:3001 after running port forward)"
echo "=== Starting Next.js (Foreground) ==="

# We run this in the foreground so the WSL session stays open
npm run dev -- --port 3001 --hostname 0.0.0.0
