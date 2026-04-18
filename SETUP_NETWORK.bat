@echo off
:: THIS MUST BE RUN AS ADMINISTRATOR
:: Right-click -> Run as Administrator

echo ==========================================
echo  VeriOTA - Network Setup for Cross-Laptop
echo ==========================================
echo.

:: Get WSL IP
for /f "tokens=*" %%i in ('wsl bash -c "hostname -I | awk ''{print $1}''"') do set WSL_IP=%%i
echo  WSL Internal IP: %WSL_IP%
echo.

:: Add port forwarding: Windows -> WSL
echo [1/2] Setting up port forwarding (Windows -> WSL)...
netsh interface portproxy delete v4tov4 listenport=8001 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy add v4tov4 listenport=8001 listenaddress=0.0.0.0 connectport=8001 connectaddress=%WSL_IP%
echo  Done.

:: Add firewall rule
echo [2/2] Opening firewall port 8001...
netsh advfirewall firewall delete rule name="VeriOTA" >nul 2>&1
netsh advfirewall firewall add rule name="VeriOTA" dir=in action=allow protocol=TCP localport=8001
echo  Done.

echo.
echo ==========================================
echo  SUCCESS! Other laptops can now connect.
echo.
echo  Your IP addresses:
ipconfig | findstr /i "IPv4"
echo.
echo  Tell the attacker to use one of the
echo  above IPs (the Wi-Fi one, usually
echo  starting with 10.x or 192.168.x)
echo ==========================================
pause
