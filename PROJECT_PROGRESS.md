# VeriOTA — Project Progress Report

> **Last Updated:** 2026-04-18 09:28 IST  
> **Version:** 2.0.0  
> **Status:** ✅ DEMO-READY — All systems operational

---

## Project Overview

**VeriOTA** is a post-quantum secure Over-The-Air (OTA) firmware update verification platform for automotive ECUs. It replaces legacy RSA-2048 with **ML-DSA-65 (NIST FIPS 204)** lattice-based signatures and provides defense-in-depth through Merkle tree forensic localization and monotonic version enforcement.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    ATTACKER LAPTOP                          │
│  tamper_attack.py / rollback_attack.py / rsa_comparison.py  │
│         ↓ HTTP POST to http://<SOC_IP>:8001                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    SOC LAPTOP (Main)                        │
│                                                             │
│  ┌───────────────────┐    ┌─────────────────────────────┐   │
│  │  FastAPI Backend   │    │  Next.js Frontend           │   │
│  │  Port 8001         │    │  Port 3001                  │   │
│  │                    │    │                             │   │
│  │  /sign             │    │  / (SOC Dashboard)          │   │
│  │  /sign-hybrid      │    │  /comparison                │   │
│  │  /verify           │    │  /compliance                │   │
│  │  /fleet            │    │  /ecu-sim.html              │   │
│  │  /ledger/update    │    │                             │   │
│  │  /api/sandbox/run  │    │                             │   │
│  │  /api/compliance   │    │                             │   │
│  │  /api/threat-model │    │                             │   │
│  │  /api/demo/*       │    │                             │   │
│  └────────┬──────────┘    └─────────────────────────────┘   │
│           │                                                 │
│  ┌────────▼──────────┐                                      │
│  │  database.json     │  (Local JSON DB — no Firebase)      │
│  └───────────────────┘                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Completion Status

### Core Cryptography
| Feature | Status | Details |
|---|---|---|
| ML-DSA-65 Signing | ✅ Done | `liboqs-python`, NIST FIPS 204 |
| ML-DSA-65 Verification | ✅ Done | Deterministic, 14.8ms on STM32F407 |
| Hybrid ECDSA + ML-DSA-65 | ✅ Done | Dual co-signing for crypto-agility |
| Crypto-Agility (env swap) | ✅ Done | `PQC_ALGORITHM` environment variable |

### Integrity & Anti-Rollback
| Feature | Status | Details |
|---|---|---|
| Merkle Tree (4KB chunks) | ✅ Done | O(log N) proof path, byte-level localization |
| Monotonic Version Ledger | ✅ Done | Semantic versioning, strict v_new > v_current |
| Tamper Forensic Localization | ✅ Done | Pinpoints exact chunk index + byte range |

### SOC Dashboard (Frontend)
| Feature | Status | Details |
|---|---|---|
| Fleet Overview (20 vehicles) | ✅ Done | Real-time polling (5s interval) |
| Vehicle Cards with status | ✅ Done | GREEN/RED/AMBER color coding |
| Forensic Threat Reports | ✅ Done | Structured tamper detail in modal |
| Live Threat Intel terminal | ✅ Done | Scrolling event log |
| Algorithm Comparison page | ✅ Done | RSA-2048 vs ML-DSA-65 live benchmark |
| Compliance & Intel page | ✅ Done | 4-tab: Regulatory / TARA / PQM4 / Q-Day |
| 3D ECU Simulator | ✅ Done | Three.js, firmware flash + tamper visualization |

### Backend APIs
| Endpoint | Status | Purpose |
|---|---|---|
| `POST /sign` | ✅ Done | Sign firmware with ML-DSA-65 |
| `POST /sign-hybrid` | ✅ Done | Hybrid ECDSA + ML-DSA-65 |
| `POST /verify` | ✅ Done | Verify + Merkle integrity |
| `GET /fleet` | ✅ Done | Dashboard fleet data (cached) |
| `POST /ledger/update` | ✅ Done | Version ledger with rollback block |
| `POST /api/sandbox/run` | ✅ Done | 5-stage pre-deployment SIL testing |
| `GET /api/compliance` | ✅ Done | UNECE R155/R156, ISO 21434/24089 mapping |
| `GET /api/threat-model` | ✅ Done | TARA threat analysis (5 threats) |
| `GET /api/benchmarks/pqm4` | ✅ Done | STM32F407 PQM4 cycle counts |
| `POST /api/demo/tamper` | ✅ Done | SSE-streamed tamper attack |
| `POST /api/demo/rollback` | ✅ Done | SSE-streamed rollback attack |
| `POST /api/demo/hndl` | ✅ Done | RSA vs ML-DSA benchmark |
| `POST /api/demo/reset` | ✅ Done | Fleet reset to clean state |

### Infrastructure
| Feature | Status | Details |
|---|---|---|
| Firebase dependency | ✅ Removed | Replaced with local JSON database |
| START_VERIOTA.bat | ✅ Done | One-click full platform startup |
| Cross-laptop attack support | ✅ Done | Scripts accept `--api` flag |

---

## Change Log

### 2026-04-18 10:55 IST
- Created global hidden Sidebar navigation to unify all web interfaces
- Replaced dashboard attack controls with a dedicated `/attacks` Cyber Warfare Simulator page
- Added an interactive `fleet-mesh.html` (India Map) with live web-nodes pulsing upon attack
- Synced Sidebar overlay into `ecu-sim.html` and `fleet-mesh.html`

### 2026-04-18 10:18 IST
- Redesigned `ATTACKER.bat` as a realistic hacking terminal
- Removed defender tools (Reset/Sandbox) from attacker menu — only exploit modules
- Added staged scan output, ASCII art, legal disclaimer for authenticity

### 2026-04-18 09:28 IST
- Created project progress report

### 2026-04-18 02:51 IST
- Added **Pre-Deployment Sandbox** (`POST /api/sandbox/run`) — 5-stage SIL pipeline
- Verified all 3 scenarios: clean (5/5 PASS), tamper (1&2 FAIL), rollback (3&5 FAIL)

### 2026-04-18 02:42 IST
- Added **Compliance & Threat Intelligence** backend router (`compliance.py`)
  - `GET /api/compliance` — UNECE R155/R156, ISO/SAE 21434, ISO 24089, NIST FIPS 204
  - `GET /api/threat-model` — 5-threat TARA analysis (ISO/SAE 21434 §15)
  - `GET /api/benchmarks/pqm4` — STM32F407 PQM4 benchmark data + Q-Day intelligence
- Created **Compliance frontend page** (`/compliance`) with 4 tabs
- Added compliance link to DemoControlPanel

### 2026-04-18 02:32 IST
- **Removed Firebase completely** — replaced with local `database.json`
- Rewrote `firebase_client.py` as local DB facade (same API surface)
- Rewrote `seed_vehicles.py` to use local DB
- Seeded 20 vehicles successfully
- Eliminated all quota exhaustion / rate limit issues permanently

### 2026-04-17 (Earlier Session)
- Implemented server-side fleet cache (3s TTL) with stale fallback
- Increased polling interval from 2s → 5s to prevent quota exhaustion
- Added `last_updated` field to vehicle cards
- Refactored threat modals from raw JSON to structured forensic reports
- Added cache invalidation on tamper/rollback events
- Created `START_VERIOTA.bat` for one-click startup
- Built 3D ECU Simulator (`/ecu-sim.html`)
- Implemented SSE-streamed attack scripts
- Created Algorithm Comparison page (`/comparison`)

---

## How to Run (Quick Start)

### Option 1: One-Click (Windows)
```
Double-click: START_VERIOTA.bat
```

### Option 2: Manual
```bash
# Terminal 1: Backend
cd ~/veriota-dev/backend
source ../venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8001

# Terminal 2: Frontend
cd ~/veriota-frontend
npm run dev -- --port 3001
```

### URLs
| Page | URL |
|---|---|
| SOC Dashboard | http://localhost:3001 |
| 3D ECU Simulator | http://localhost:3001/ecu-sim.html |
| Algo Comparison | http://localhost:3001/comparison |
| Compliance & Intel | http://localhost:3001/compliance |
| API Docs (Swagger) | http://localhost:8001/docs |

---

## Cross-Laptop Attack Setup (Hackathon Demo)

> This section explains how to use a **second laptop as the "Attacker"** to launch attacks against VeriOTA running on the main SOC laptop.

### Step 1: Find the SOC Laptop's IP
On the SOC laptop (the one running VeriOTA), open a terminal and run:
```
ipconfig
```
Look for the **Wi-Fi or Ethernet IPv4 address** (e.g., `192.168.x.x` or `10.x.x.x`).
Both laptops must be on the **same Wi-Fi network**.

### Step 2: Copy attack scripts to Attacker Laptop
Copy the `demo/` folder from the SOC laptop to the attacker laptop:
```
veriota/demo/
  ├── tamper_attack.py
  ├── rollback_attack.py
  ├── rsa_comparison.py
  ├── generate_firmware.py
  ├── firmware_clean.bin
  └── firmware_tampered.bin
```

The attacker laptop needs **Python 3.10+** with these packages:
```bash
pip install requests cryptography
```

### Step 3: Generate firmware binaries (if not already present)
```bash
cd demo/
python generate_firmware.py
```

### Step 4: Launch Attacks
Replace `<SOC_IP>` with the actual IP from Step 1.

**Tamper Attack (Dashboard turns RED):**
```bash
python tamper_attack.py --api http://<SOC_IP>:8001 --vehicle VIN-007
```

**Rollback Attack (Dashboard turns AMBER):**
```bash
python rollback_attack.py --api http://<SOC_IP>:8001 --vehicle VIN-012
```

**RSA vs ML-DSA Benchmark:**
```bash
python rsa_comparison.py --api http://<SOC_IP>:8001
```

### Step 5: Reset Fleet (from SOC laptop dashboard)
Click the **"Reset Fleet"** button on the dashboard, or:
```bash
curl -X POST http://<SOC_IP>:8001/api/demo/reset
```

### Firewall Note (Important!)
If the attacker laptop can't connect, you may need to allow port 8001 through Windows Firewall on the SOC laptop:
```powershell
netsh advfirewall firewall add rule name="VeriOTA Backend" dir=in action=allow protocol=TCP localport=8001
```

---

## Known Issues & Notes
- VIN-007 may show ROLLBACK_BLOCKED from previous test sessions. Hit "Reset Fleet" to clear.
- The local `database.json` is in `~/veriota-dev/backend/`. Delete it and re-run `python seed_vehicles.py` to start fresh.
- Frontend hot-reloads automatically when code changes. Backend requires restart (or use `--reload` flag).
