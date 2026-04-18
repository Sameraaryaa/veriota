@echo off
title VeriOTA - Post-Quantum Fleet Security Platform
color 0A
cls

echo.
echo  VeriOTA - Post-Quantum Automotive OTA Security
echo  ML-DSA-65 / NIST FIPS 204 / Merkle Tamper Localization
echo  =====================================================
echo.

:: Kill anything on our ports
echo [1/4] Freeing ports 8001 and 3001...
wsl bash -c "fuser -k 8001/tcp 2>/dev/null; fuser -k 3001/tcp 2>/dev/null" >nul 2>&1
timeout /t 2 /nobreak >nul

:: Start Backend in a new window via WSL
echo [2/4] Starting FastAPI backend (port 8001)...
start "VeriOTA Backend [port 8001]" wsl bash -c "cd ~/veriota-dev/backend && source ../venv/bin/activate && echo BACKEND STARTING... && uvicorn main:app --host 0.0.0.0 --port 8001"
timeout /t 5 /nobreak >nul

:: Start Frontend in a new window via WSL
echo [3/4] Starting Next.js frontend (port 3001)...
start "VeriOTA Frontend [port 3001]" wsl bash -c "cd ~/veriota-frontend && echo FRONTEND STARTING... && npm run dev -- --port 3001"
timeout /t 8 /nobreak >nul

:: Open Browser
echo [4/4] Opening VeriOTA in browser...
start "" "http://localhost:3001"

echo.
echo  VeriOTA is running!
echo.
echo  SOC Dashboard      :  http://localhost:3001
echo  ECU 3D Simulator   :  http://localhost:3001/ecu-sim.html
echo  Algo Comparison    :  http://localhost:3001/comparison
echo  Compliance         :  http://localhost:3001/compliance
echo  API Docs (Swagger) :  http://localhost:8001/docs
echo.
echo  Press any key to open ECU 3D Simulator...
pause >nul
start "" "http://localhost:3001/ecu-sim.html"
echo  Press any key to exit this window...
pause >nul
