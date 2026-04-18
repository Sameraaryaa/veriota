#!/bin/bash
cp /mnt/c/Users/arya/Desktop/veriota/frontend/.env.local ~/veriota-frontend/.env.local
cp -r /mnt/c/Users/arya/Desktop/veriota/frontend/src/* ~/veriota-frontend/src/
cd ~/veriota-frontend

# Kill any existing Next.js on port 3001
fuser -k 3001/tcp 2>/dev/null || true
sleep 1

# Launch with nohup bound to 0.0.0.0 so Windows browser can reach it via WSL IP
nohup npm run dev -- --port 3001 --hostname 0.0.0.0 > /tmp/frontend.log 2>&1 &
echo "Frontend PID: $!"

# Wait for ready
for i in $(seq 1 15); do
  sleep 1
  if grep -q "Ready in" /tmp/frontend.log 2>/dev/null; then
    echo "=== Frontend READY ==="
    break
  fi
  echo "  Waiting... ($i)"
done

tail -8 /tmp/frontend.log

WSL_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "=== Access Dashboard at ==="
echo "  http://${WSL_IP}:3001"
echo "  (also try http://localhost:3001 after running port forward)"
