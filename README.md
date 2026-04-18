# VeriOTA — Post-Quantum Automotive OTA Security Platform

> **First-of-its-kind** open prototype combining NIST FIPS 204 (ML-DSA-65) firmware signing,
> Merkle-tree tamper localization, real-time fleet SOC dashboard, and 3D ECU simulation.
> No company — not Bosch, Continental, or Uptane — has shipped all of these features together.

---

## 🚀 Quick Start — One Click Launch

**Double-click `START_VERIOTA.bat`** on Windows (requires WSL).

This will:
1. Free ports 8001 and 3001
2. Start the FastAPI backend with ML-DSA-65 engine
3. Start the Next.js SOC dashboard
4. Open your browser automatically

---

## 📍 Access URLs

| URL | Purpose |
|-----|---------|
| `http://localhost:3001` | **SOC Fleet Dashboard** — 20-vehicle real-time fleet monitor |
| `http://localhost:3001/ecu-sim.html` | **3D ECU Simulator** — Three.js animated attack/defense visualization |
| `http://localhost:3001/comparison` | **RSA vs ML-DSA-65** — live benchmark comparison page |
| `http://localhost:8001/docs` | **Swagger API Docs** — interactive API explorer |
| `http://localhost:8001/health` | **Backend Health** — service status + algorithm info |

---

## 🎬 Live Demo (3 Scenarios)

### Scenario 1 — Tamper Attack (from a separate terminal or machine)
```bash
wsl python ~/veriota-dev/demo/tamper_attack.py --api http://localhost:8001 --vehicle VIN-007
# Dashboard: VIN-007 turns RED within 2 seconds
# SOC terminal shows: Chunk #48 · Bytes 196608–200703 tampered
```

### Scenario 2 — Rollback Attack
```bash
wsl python ~/veriota-dev/demo/rollback_attack.py --api http://localhost:8001 --vehicle VIN-012
# Dashboard: VIN-012 turns AMBER
# Version ledger blocks v1.0.0 → v2.1.4 downgrade
```

### Scenario 3 — RSA vs ML-DSA-65 Benchmark
```bash
wsl python ~/veriota-dev/demo/rsa_comparison.py
# Live comparison: key sizes, signature sizes, quantum safety
```

### Or use the UI buttons
All 3 scenarios can be triggered from the **Cyber Warfare Simulator** panel on the dashboard.
Output streams live to the terminal via SSE.

---

## 🧱 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 VeriOTA Platform                        │
├─────────────────┬──────────────────────────────────────-┤
│  Frontend        │  Backend (FastAPI)                   │
│  Next.js         │  Port 8001                           │
│  Port 3001       │                                      │
│                  │  POST /sign          ML-DSA-65 sign  │
│  SOC Dashboard   │  POST /sign-hybrid   ML-DSA + ECDSA  │
│  ECU Simulator   │  POST /verify        Merkle verify   │
│  Comparison Page │  GET  /merkle-proof  O(log N) proof  │
│                  │  GET  /fleet         Fleet status     │
│                  │  POST /ledger/update Rollback block   │
│                  │  POST /ecu/simulate  ECU timing sim   │
│                  │  POST /api/demo/*    SSE streaming    │
└─────────────────┴────────────────────────────────────────┘
         │                         │
    Firestore                    liboqs
  (vehicle_ledger)           (ML-DSA-65 / FIPS 204)
```

---

## ⚡ Key Technical Features

| Feature | Detail |
|---------|--------|
| **Algorithm** | ML-DSA-65 (CRYSTALS-Dilithium3), NIST FIPS 204, Aug 2024 |
| **Security Level** | NIST Level 3 — ~128-bit quantum, ~140-bit classical |
| **Merkle Chunks** | 4KB (ARM Cortex-M4 page boundary), SHA-256 per chunk |
| **Tamper Localization** | Exact chunk index + byte range reported |
| **Merkle Proof Paths** | O(log N) sibling hash path for ECU-efficient verification |
| **Hybrid Signing** | ML-DSA-65 + ECDSA P-256 dual-signature (quantum transition) |
| **ECU Simulation** | ARM Cortex-M4 @ 168MHz timing extrapolation (PQM4 benchmark) |
| **Rollback Prevention** | Semver monotonicity enforced in Firestore version ledger |
| **Live Demo Streaming** | SSE (Server-Sent Events) — attack script output to browser terminal |
| **Dashboard Updates** | Tamper → Firestore → Dashboard in <2 seconds |

---

## 🛠 Manual Setup (WSL Required)

### Prerequisites
- Windows 10/11 with WSL2
- Ubuntu in WSL
- Node.js 18+ in WSL
- Python 3.10+ in WSL

### Backend Setup
```bash
# In WSL
cd ~/veriota-dev
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn python-dotenv firebase-admin oqs cryptography requests

# Generate firmware test files
cd demo && python generate_firmware.py

# Seed fleet (20 vehicles)
cd ../backend && python seed_vehicles.py

# Start backend
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Setup
```bash
# In WSL
cd ~/veriota-frontend
npm install
# .env.local already contains: NEXT_PUBLIC_API_URL=http://localhost:8001
npm run dev -- --port 3001
```

### Environment Variables

**Backend** (`backend/.env`):
```
FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
DILITHIUM_PRIVATE_KEY_PATH=./keys/dilithium3_private.key
DILITHIUM_PUBLIC_KEY_PATH=./keys/dilithium3_public.key
PQC_ALGORITHM=ML-DSA-65
BACKEND_API_URL=http://localhost:8001
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

## 🔐 API Reference

### Sign Firmware (ML-DSA-65)
```bash
curl -X POST http://localhost:8001/sign \
  -F "firmware=@demo/firmware_clean.bin" \
  -F "vehicle_id=VIN-007"
```

### Verify Firmware
```bash
curl -X POST http://localhost:8001/verify \
  -F "firmware=@demo/firmware_tampered.bin" \
  -F "signature=<sig_from_sign>" \
  -F "public_key=<pubkey_from_sign>" \
  -F "trusted_merkle=<merkle_json_from_sign>" \
  -F "vehicle_id=VIN-007" \
  -F "write_alert=true"
```

### Hybrid Sign (ML-DSA-65 + ECDSA)
```bash
curl -X POST http://localhost:8001/sign-hybrid \
  -F "firmware=@demo/firmware_clean.bin" \
  -F "vehicle_id=VIN-007"
```

### ECU Simulation (ARM Cortex-M4 timing)
```bash
curl http://localhost:8001/ecu/benchmark
```

### Merkle Proof Path (O log N)
```bash
curl "http://localhost:8001/merkle-proof?chunk_index=48&merkle_leaves=[...]"
```

---

## 📊 Why VeriOTA is Unique

| Feature | Uptane | Bosch ESCRYPT | Continental | **VeriOTA** |
|---------|--------|---------------|-------------|-------------|
| PQC Signing | ❌ None | 🔶 Planned | 🔶 Planned | ✅ ML-DSA-65 LIVE |
| Hybrid Signing | ❌ | 🔶 | 🔶 | ✅ ML-DSA + ECDSA |
| Byte-level tamper localization | ❌ | ❌ | ❌ | ✅ Chunk # + byte range |
| Merkle Proof Path O(log N) | ❌ | ❌ | ❌ | ✅ **First in automotive** |
| Live fleet SOC dashboard | ❌ | 🔶 Enterprise | 🔶 Enterprise | ✅ Open source |
| ECU verification simulation | ❌ | 🔶 Internal | ❌ | ✅ Public API |
| 3D attack visualization | ❌ | ❌ | ❌ | ✅ Three.js simulator |
| Live SSE attack streaming | ❌ | ❌ | ❌ | ✅ Real-time to browser |
| Open prototype | ✅ Spec only | ❌ Closed | ❌ Closed | ✅ **Full working code** |

---

## 📂 Project Structure

```
veriota/
├── START_VERIOTA.bat          ← One-click launcher (Windows)
├── backend/
│   ├── main.py                ← FastAPI app, all routers registered
│   ├── core/
│   │   ├── dilithium.py       ← ML-DSA-65 (FIPS 204) engine
│   │   ├── merkle.py          ← Merkle tree + O(log N) proof paths
│   │   └── firebase_client.py ← Firestore ledger + alert writes
│   ├── routers/
│   │   ├── sign.py            ← POST /sign
│   │   ├── sign_hybrid.py     ← POST /sign-hybrid
│   │   ├── verify.py          ← POST /verify + /merkle-proof
│   │   ├── ledger.py          ← POST /ledger/update
│   │   ├── demo.py            ← SSE streaming attack demo
│   │   └── ecu_sim.py         ← ECU timing simulation
│   └── seed_vehicles.py       ← Seed 20 vehicles to Firestore
├── demo/
│   ├── generate_firmware.py   ← Generate 10MB clean + tampered bin
│   ├── tamper_attack.py       ← Demo Scenario 1
│   ├── rollback_attack.py     ← Demo Scenario 2
│   └── rsa_comparison.py      ← Demo Scenario 3 (HNDL)
└── frontend/
    ├── public/
    │   └── ecu-sim.html       ← Standalone 3D ECU Simulator (Three.js)
    └── src/app/
        ├── page.tsx            ← SOC Fleet Dashboard
        ├── comparison/         ← RSA vs ML-DSA-65 comparison
        └── components/
            ├── DemoControlPanel.tsx
            ├── VehicleCard.tsx
            └── LiveThreatFeed.tsx
```
