#!/bin/bash
set -e

echo "=== Syncing frontend source files to WSL Next.js project ==="
FRONTEND_WSL=~/veriota-frontend
FRONTEND_WIN=/mnt/c/Users/arya/Desktop/veriota/frontend

# Sync all source files (overwrite defaults)
cp -r "$FRONTEND_WIN/src/"* "$FRONTEND_WSL/src/"
cp "$FRONTEND_WIN/netlify.toml" "$FRONTEND_WSL/"

# Install Netlify Next.js plugin
cd "$FRONTEND_WSL"
npm install @netlify/plugin-nextjs --save-dev --legacy-peer-deps 2>&1 | tail -5

echo "=== Running Next.js type check ==="
npx tsc --noEmit 2>&1 || true

echo "=== Building Next.js production bundle ==="
npm run build 2>&1 | tail -20

echo "=== Build complete ==="
