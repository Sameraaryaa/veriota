@echo off
title [REDACTED] - OTA Exploit Framework
color 0C
cls

echo.
echo     _____ _   _ ____  _____ ____     _____ _  _ ____  _     ____  _  _____
echo    / ____^| ^| ^| ^|  _ \^| ____^|  _ \   ^| ____^| ^|/ /^|  _ \^| ^|   / __ \^|^|^|^|_   _^|
echo   ^| ^|    ^|  __  ^| ^|_) ^|  _  ^| ^|_) ^|  ^|  _  ^|   / ^| ^|_) ^| ^|  ^| ^|  ^| ^|^| ^| ^| ^|
echo   ^| ^|___ ^| ^|  ^| ^|  _ ^<^| ^|___^|  _ ^<   ^| ^|___^| ^|\ \^|  __/^| ^|__^| ^|__^| ^| ^| ^| ^|
echo    \____^|_^|  ^|_^|_^| \_\____^|_^| \_\  ^|____^|_^| \_\_^|   ^|____\____/^|_^| ^|_^|
echo.
echo    [  OTA FIRMWARE EXPLOIT FRAMEWORK v3.1  ]
echo    [  TARGET: Automotive ECU via OTA Channel  ]
echo.
echo  -----------------------------------------------------------
echo   WARNING: Unauthorized access to vehicle systems is a
echo   federal crime under CFAA / EU Cyber Resilience Act.
echo   This tool is for AUTHORIZED PENETRATION TESTING ONLY.
echo  -----------------------------------------------------------
echo.

set /p SOC_IP="  [*] Enter target SOC IP [default: localhost]: "
if "%SOC_IP%"=="" set SOC_IP=localhost

echo.
echo  [*] Verifying connection to %SOC_IP%:8001 ...
powershell -Command "try { $c = New-Object System.Net.Sockets.TcpClient('%SOC_IP%', 8001); $c.Close(); exit 0 } catch { exit 1 }"
if %errorlevel% neq 0 (
  color 0C
  echo  [!] ERROR: Cannot reach VeriOTA Backend at %SOC_IP%:8001
  echo  [!] Ensure START_VERIOTA.bat is running and WSL is responsive.
  echo.
  pause
  exit /b
)

echo  [+] Port 8001 OPEN - FastAPI connectivity confirmed
echo  [+] Service: VeriOTA Backend v2.0.0
echo  [+] Crypto: ML-DSA-65 (FIPS 204) identified
echo  [+] Defense: Merkle tree integrity active
echo.

:MENU
echo  ===========================================================
echo   EXPLOIT MODULES:
echo.
echo    [1] FIRMWARE INJECTION   - Inject CAN-bus backdoor
echo                               Flip byte 200,000 in transit
echo                               Triggers Merkle tree alarm
echo.
echo    [2] VERSION ROLLBACK     - Replay signed v1.0.0 firmware
echo                               Bypass patch to exploit known CVE
echo                               Blocked by version ledger
echo.
echo    [0] EXIT
echo  ===========================================================
echo.
set /p CHOICE="  exploit> "

if "%CHOICE%"=="1" goto TAMPER
if "%CHOICE%"=="2" goto ROLLBACK
if "%CHOICE%"=="0" exit
goto MENU

:TAMPER
echo.
echo  [*] Loading exploit module: firmware_injection
echo  [*] Generating clean firmware payload (10MB)...
timeout /t 1 /nobreak >nul
echo  [+] Payload ready: firmware_clean.bin (10,485,760 bytes)
echo  [*] Signing with stolen OEM key via ML-DSA-65...
timeout /t 1 /nobreak >nul
echo  [+] Valid signature obtained (3,293 bytes)
echo  [*] INJECTING BACKDOOR at byte offset 200,000...
echo  [*] Byte 0x93 flipped to 0x6C (CAN-bus flood routine)
timeout /t 1 /nobreak >nul
echo  [+] Tampered binary: firmware_tampered.bin
echo.
echo  [!] DEPLOYING tampered firmware to vehicle...
echo  -----------------------------------------------------------
echo.
python demo\tamper_attack.py --api http://%SOC_IP%:8001 --vehicle TATA-Nexon-EV-001
echo.
echo  -----------------------------------------------------------
echo  [!] Attack complete. Check SOC dashboard for detection.
echo.
pause
goto MENU

:ROLLBACK
echo.
echo  [*] Loading exploit module: version_rollback
echo  [*] Fetching archived firmware v1.0.0...
timeout /t 1 /nobreak >nul
echo  [+] Found valid OEM signature for v1.0.0
echo  [+] Known CVE: Buffer overflow in CAN handler
echo  [*] Target: VIN-012 currently running v2.1.4
echo  [*] Attempting downgrade: v2.1.4 -- v1.0.0
timeout /t 1 /nobreak >nul
echo.
echo  [!] PUSHING vulnerable firmware to vehicle...
echo  -----------------------------------------------------------
echo.
python demo\rollback_attack.py --api http://%SOC_IP%:8001 --vehicle TATA-Harrier-EV-05
echo.
echo  -----------------------------------------------------------
echo  [!] Attack complete. Check SOC dashboard for detection.
echo.
pause
goto MENU
