#!/bin/bash
# Sync .env.local and source files, then start Next.js dev server
cp /mnt/c/Users/arya/Desktop/veriota/frontend/.env.local ~/veriota-frontend/.env.local
cp -r /mnt/c/Users/arya/Desktop/veriota/frontend/src/* ~/veriota-frontend/src/
cd ~/veriota-frontend
echo "=== Starting VeriOTA Dashboard ==="
echo "  Dashboard: http://localhost:3001"
echo "  Comparison: http://localhost:3001/comparison"
echo ""
npm run dev -- --port 3001
