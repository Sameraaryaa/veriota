#!/bin/bash
set -e

echo "=== Bootstrapping Next.js 14 Frontend ==="
cd /mnt/c/Users/arya/Desktop/veriota

# Remove existing incomplete frontend dir if any
rm -rf frontend

# Bootstrap Next.js 14 with TypeScript, Tailwind, App Router
npx -y create-next-app@14 frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --no-git \
  --import-alias "@/*" \
  --no-eslint \
  << 'EOF'
EOF

echo "=== Installing Firebase SDK ==="
cd /mnt/c/Users/arya/Desktop/veriota/frontend
npm install firebase --save --legacy-peer-deps

echo "=== Frontend scaffold complete ==="
node -v && npm -v
ls src/app/
