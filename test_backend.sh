#!/bin/bash
cp -r /mnt/c/Users/arya/Desktop/veriota/backend/* ~/veriota-dev/backend/
source ~/veriota-dev/venv/bin/activate
cd ~/veriota-dev/backend
uvicorn main:app --host 0.0.0.0 --port 8000 &
UVICORN_PID=$!
sleep 6
echo "=== Health Check ==="
curl -s http://localhost:8000/health
echo ""
echo "=== Fleet Check ==="
curl -s http://localhost:8000/fleet | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Total vehicles: {d[\"fleet_summary\"][\"total\"]}'); print(f'Quantum safe: {d[\"fleet_summary\"][\"quantum_safe\"]}')"
echo ""
echo "=== All endpoints available at http://localhost:8000/docs ==="
wait $UVICORN_PID
