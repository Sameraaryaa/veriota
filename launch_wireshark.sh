#!/bin/bash
# VeriOTA - Wireshark WSL Demo Launcher

echo "Launching TShark for WSL capturing on loopback port 8001..."

# Bypass the headless background server context by spawning 
# a native Windows command prompt that drops back into WSL to run tshark!
cmd.exe /c start cmd.exe /k 'color 0c && echo [VERIOTA THREAT INTERCEPT - PACKET SNIFFER] && wsl tshark -i lo -Y tcp.port==8001'

echo "Command sent to Windows."
