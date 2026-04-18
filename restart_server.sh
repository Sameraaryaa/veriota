#!/bin/bash
cp -r /mnt/c/Users/arya/Desktop/veriota/backend/* ~/veriota-dev/backend/
cp -r /mnt/c/Users/arya/Desktop/veriota/demo/* ~/veriota-dev/demo/

pkill -f uvicorn
sleep 1

cd ~/veriota-dev/backend
source ../venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
echo "Uvicorn restarted."
