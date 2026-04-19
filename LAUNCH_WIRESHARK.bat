@echo off
echo ========================================================
echo VeriOTA - Wireshark Demo Launcher (WSL Mode)
echo ========================================================
echo.
echo Launching Wireshark from your WSL environment mapping to port 8001...
echo.

:: Launch the WSL installation of Wireshark!
wsl -d Ubuntu --exec wireshark -k -i lo -Y "tcp.port==8001"
:: Fallback if wsl -d Ubuntu fails (maybe default distro is different)
if errorlevel 1 (
    wsl --exec wireshark -k -i lo -Y "tcp.port==8001"
)

if errorlevel 1 (
    echo.
    echo [!] Failed to launch WSL Wireshark. 
    echo Please ensure WSLg (Windows Subsystem for Linux GUI) is working.
    echo.
    pause
    exit /b 1
)

exit /b 0
