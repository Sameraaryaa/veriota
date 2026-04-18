# VeriOTA — Anti Gravity Execution Guide
### Post-Quantum Secure Automotive OTA Update Chain
**Hackathon:** Mich Josh Cybersecurity Hackathon 2026 | **Problem Statement:** 03  
**Contributors:** Samera · Moonish  
**AI Agent:** Anti Gravity  
**Status:** Build from scratch — nothing pre-existing

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Environment Setup](#3-environment-setup)
4. [Component 1 — PQC Signing Engine](#4-component-1--pqc-signing-engine)
5. [Component 2 — Tamper Verifier](#5-component-2--tamper-verifier)
6. [Component 3 — Version Ledger API](#6-component-3--version-ledger-api)
7. [Component 4 — Fleet Dashboard (Next.js)](#7-component-4--fleet-dashboard-nextjs)
8. [Demo Scripts](#8-demo-scripts)
9. [Firebase Setup](#9-firebase-setup)
10. [Local Development Workflow](#10-local-development-workflow)
11. [Deployment](#11-deployment)
12. [Testing & Validation](#12-testing--validation)
13. [Cybersecurity Enhancements (Hackathon Edge)](#13-cybersecurity-enhancements-hackathon-edge)
14. [Anti Gravity Agent Instructions](#14-anti-gravity-agent-instructions)

---

## 1. PROJECT OVERVIEW

### What VeriOTA Does

VeriOTA is a post-quantum secure Over-the-Air (OTA) firmware update system for software-defined vehicles (SDVs). It replaces the industry-standard RSA-2048 / ECC signing (used in Uptane/TUF) with **CRYSTALS-Dilithium3** — a lattice-based signature scheme standardized by NIST as **FIPS 204 (August 2024)** — making it immune to Shor's Algorithm on quantum computers.

### Three Security Layers

| Layer | Mechanism | Protects Against |
|-------|-----------|-----------------|
| 1 | CRYSTALS-Dilithium3 signature (FIPS 204) | Quantum forgery, HNDL attacks |
| 2 | SHA-256 Merkle tree (4KB chunks) | Any byte-level firmware tampering |
| 3 | Firebase version ledger (monotonic versioning) | Rollback attacks using old valid signatures |

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| PQC Cryptography | liboqs-python | 0.10.0 |
| Backend Framework | Python + FastAPI | 3.11 / 0.110 |
| Frontend | Next.js (App Router) | 14 |
| UI Styling | Tailwind CSS | 3.4 |
| Database / Ledger | Firebase Firestore | asia-south1 region |
| Integrity Hashing | Python hashlib SHA-256 | stdlib |
| Backend Deploy | Railway | free tier |
| Frontend Deploy | Vercel | free tier |

---

## 2. REPOSITORY STRUCTURE

Anti Gravity must create the following directory and file structure exactly:

```
veriota/
├── backend/
│   ├── main.py                  # FastAPI app entrypoint — registers all routers
│   ├── requirements.txt         # All Python dependencies
│   ├── Procfile                 # Railway deployment config
│   ├── .env.example             # Template for environment variables
│   ├── routers/
│   │   ├── sign.py              # POST /sign
│   │   ├── verify.py            # POST /verify
│   │   └── ledger.py            # POST /ledger/update, POST /ledger/register, GET /fleet
│   ├── core/
│   │   ├── dilithium.py         # Dilithium3 sign/verify wrappers using liboqs
│   │   ├── merkle.py            # Merkle tree build + tamper localization logic
│   │   └── firebase_client.py   # Firestore read/write operations
│   └── tests/
│       ├── test_sign.py
│       ├── test_verify.py
│       └── test_ledger.py
│
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   ├── .env.local.example
│   └── src/
│       └── app/
│           ├── layout.tsx
│           ├── page.tsx                   # Fleet dashboard main page
│           ├── components/
│           │   ├── VehicleCard.tsx        # Per-vehicle status card
│           │   ├── FleetSummaryBar.tsx    # Top aggregate stats bar
│           │   ├── AlertPanel.tsx         # Expandable tamper/rollback alert detail
│           │   ├── DemoControlPanel.tsx   # Three demo action buttons
│           │   └── AlgorithmComparison.tsx # RSA vs Dilithium side-by-side table
│           └── lib/
│               ├── firebase.ts            # Firebase SDK init
│               └── api.ts                 # Backend API call wrappers
│
├── demo/
│   ├── tamper_attack.py         # Demo Scenario 1
│   ├── rollback_attack.py       # Demo Scenario 2
│   ├── rsa_comparison.py        # Demo Scenario 3
│   ├── generate_firmware.py     # Generates firmware_clean.bin and firmware_tampered.bin
│   └── README.md                # How to run each demo script
│
└── README.md                    # Project overview and quickstart
```

---

## 3. ENVIRONMENT SETUP

### 3.1 Backend — Python Environment

Anti Gravity must execute these commands in order:

```bash
# From project root
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

### 3.2 backend/requirements.txt

Anti Gravity must create this file with exactly the following content:

```
fastapi==0.110.0
uvicorn[standard]==0.29.0
python-multipart==0.0.9
liboqs-python==0.10.0
firebase-admin==6.5.0
cryptography==42.0.5
pytest==8.1.1
pytest-asyncio==0.23.6
httpx==0.27.0
semver==3.0.2
python-dotenv==1.0.1
```

### 3.3 backend/.env.example

Anti Gravity must create this file:

```
FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
FIREBASE_PROJECT_ID=veriota-hackathon
DILITHIUM_PRIVATE_KEY_PATH=./keys/dilithium3_private.key
DILITHIUM_PUBLIC_KEY_PATH=./keys/dilithium3_public.key
```

### 3.4 Frontend — Node Environment

```bash
cd frontend
npm install
```

### 3.5 frontend/.env.local.example

Anti Gravity must create this file:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=veriota-hackathon.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=veriota-hackathon
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=veriota-hackathon.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 4. COMPONENT 1 — PQC SIGNING ENGINE

### 4.1 Purpose

Receives a raw firmware binary file. Splits it into 4KB chunks. Builds a SHA-256 Merkle tree. Signs the Merkle root using CRYSTALS-Dilithium3. Returns signature, public key, and full Merkle metadata as JSON.

### 4.2 backend/core/dilithium.py

Anti Gravity must create this file with the following complete implementation:

```python
import oqs
import base64
from pathlib import Path

ALGORITHM = "Dilithium3"

def generate_keypair() -> tuple[bytes, bytes]:
    """Generate a Dilithium3 keypair. Returns (public_key, private_key) as raw bytes."""
    with oqs.Signature(ALGORITHM) as signer:
        public_key = signer.generate_keypair()
        private_key = signer.export_secret_key()
    return public_key, private_key

def sign_message(message: bytes, private_key: bytes) -> bytes:
    """Sign a message with Dilithium3 private key. Returns raw signature bytes."""
    with oqs.Signature(ALGORITHM, secret_key=private_key) as signer:
        signature = signer.sign(message)
    return signature

def verify_signature(message: bytes, signature: bytes, public_key: bytes) -> bool:
    """Verify a Dilithium3 signature. Returns True if valid, False otherwise."""
    try:
        with oqs.Signature(ALGORITHM) as verifier:
            return verifier.verify(message, signature, public_key)
    except Exception:
        return False

def encode_b64(data: bytes) -> str:
    return base64.b64encode(data).decode("utf-8")

def decode_b64(data: str) -> bytes:
    return base64.b64decode(data.encode("utf-8"))

def load_or_generate_keypair(private_path: str, public_path: str) -> tuple[bytes, bytes]:
    """Load keypair from disk. If not found, generate and save."""
    priv = Path(private_path)
    pub = Path(public_path)
    if priv.exists() and pub.exists():
        return pub.read_bytes(), priv.read_bytes()
    pub_key, priv_key = generate_keypair()
    priv.parent.mkdir(parents=True, exist_ok=True)
    priv.write_bytes(priv_key)
    pub.write_bytes(pub_key)
    return pub_key, priv_key
```

### 4.3 backend/core/merkle.py

Anti Gravity must create this file with the following complete implementation:

```python
import hashlib
from typing import List, Dict, Any

CHUNK_SIZE = 4096  # 4KB — matches ARM Cortex-M4 page size

def sha256(data: bytes) -> bytes:
    return hashlib.sha256(data).digest()

def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def chunk_firmware(firmware: bytes) -> List[bytes]:
    """Split firmware into fixed 4KB chunks. Zero-pad the last chunk if needed."""
    chunks = [firmware[i:i + CHUNK_SIZE] for i in range(0, len(firmware), CHUNK_SIZE)]
    if chunks and len(chunks[-1]) < CHUNK_SIZE:
        chunks[-1] = chunks[-1].ljust(CHUNK_SIZE, b'\x00')
    return chunks

def build_merkle_tree(firmware: bytes) -> Dict[str, Any]:
    """
    Build a complete Merkle tree from firmware bytes.
    Returns a dict with: root, leaves, tree (all levels), chunk_count, file_size.
    """
    chunks = chunk_firmware(firmware)
    leaves = [sha256(chunk) for chunk in chunks]

    tree = [leaves]
    current = leaves[:]

    while len(current) > 1:
        if len(current) % 2 == 1:
            current = current + [current[-1]]  # duplicate last node if odd
        current = [
            sha256(current[i] + current[i + 1])
            for i in range(0, len(current), 2)
        ]
        tree.append(current)

    merkle_root = tree[-1][0]

    return {
        "root": merkle_root.hex(),
        "leaves": [h.hex() for h in leaves],
        "tree": [[h.hex() for h in level] for level in tree],
        "chunk_count": len(chunks),
        "file_size": len(firmware),
    }

def verify_merkle(firmware: bytes, trusted_leaves: List[str]) -> Dict[str, Any]:
    """
    Rebuild Merkle tree from received firmware and compare leaf hashes against trusted leaves.
    Returns verification result with tampered chunk details if any.
    """
    computed = build_merkle_tree(firmware)
    computed_leaves = computed["leaves"]
    tampered_chunks = []

    for i, (trusted, computed_hash) in enumerate(zip(trusted_leaves, computed_leaves)):
        if trusted != computed_hash:
            tampered_chunks.append({
                "chunk_index": i,
                "byte_start": i * CHUNK_SIZE,
                "byte_end": (i + 1) * CHUNK_SIZE - 1,
                "trusted_hash": trusted,
                "computed_hash": computed_hash,
            })

    # Also catch size mismatch (extra or missing chunks)
    if len(computed_leaves) != len(trusted_leaves):
        return {
            "merkle_match": False,
            "tampered_chunks": [],
            "error": f"Chunk count mismatch: expected {len(trusted_leaves)}, got {len(computed_leaves)}",
            "computed_root": computed["root"],
        }

    return {
        "merkle_match": len(tampered_chunks) == 0,
        "tampered_chunks": tampered_chunks,
        "computed_root": computed["root"],
    }
```

### 4.4 backend/routers/sign.py

Anti Gravity must create this file:

```python
import os
import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException
from core.dilithium import load_or_generate_keypair, sign_message, encode_b64
from core.merkle import build_merkle_tree

router = APIRouter()

PRIVATE_KEY_PATH = os.getenv("DILITHIUM_PRIVATE_KEY_PATH", "./keys/dilithium3_private.key")
PUBLIC_KEY_PATH = os.getenv("DILITHIUM_PUBLIC_KEY_PATH", "./keys/dilithium3_public.key")

@router.post("/sign")
async def sign_firmware(firmware: UploadFile = File(...)):
    """
    Accepts a firmware binary file.
    Builds Merkle tree, signs the Merkle root with Dilithium3.
    Returns full signing metadata as JSON.
    """
    firmware_bytes = await firmware.read()

    if not firmware_bytes:
        raise HTTPException(status_code=400, detail="Firmware file is empty.")

    # Load or generate Dilithium3 keypair
    public_key, private_key = load_or_generate_keypair(PRIVATE_KEY_PATH, PUBLIC_KEY_PATH)

    # Build Merkle tree
    merkle_data = build_merkle_tree(firmware_bytes)
    merkle_root_bytes = bytes.fromhex(merkle_data["root"])

    # Sign the Merkle root
    signature = sign_message(merkle_root_bytes, private_key)

    # Full firmware SHA-256 for reference
    firmware_hash = hashlib.sha256(firmware_bytes).hexdigest()

    return {
        "algorithm": "Dilithium3",
        "nist_standard": "FIPS 204",
        "firmware_hash": firmware_hash,
        "firmware_size": len(firmware_bytes),
        "chunk_size": 4096,
        "chunk_count": merkle_data["chunk_count"],
        "merkle_root": merkle_data["root"],
        "merkle_leaves": merkle_data["leaves"],
        "public_key": encode_b64(public_key),
        "signature": encode_b64(signature),
        "signed_at": datetime.now(timezone.utc).isoformat(),
    }
```

---

## 5. COMPONENT 2 — TAMPER VERIFIER

### 5.1 Purpose

Receives a firmware binary + signature + public key + trusted Merkle metadata. Rebuilds the Merkle tree from the received binary. Verifies the Dilithium3 signature. Localizes any tampered chunks to exact byte ranges. Returns VERIFIED or TAMPERED with full forensic detail.

### 5.2 backend/routers/verify.py

Anti Gravity must create this file:

```python
import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from core.dilithium import verify_signature, decode_b64
from core.merkle import build_merkle_tree, verify_merkle

router = APIRouter()

@router.post("/verify")
async def verify_firmware(
    firmware: UploadFile = File(...),
    signature: str = Form(...),
    public_key: str = Form(...),
    trusted_merkle: str = Form(...),  # JSON string: {"root": "...", "leaves": [...]}
):
    """
    Verifies firmware integrity using Dilithium3 signature and Merkle tree comparison.
    Returns VERIFIED with clean status, or TAMPERED with exact chunk + byte range details.
    """
    firmware_bytes = await firmware.read()

    if not firmware_bytes:
        raise HTTPException(status_code=400, detail="Firmware file is empty.")

    try:
        trusted_data = json.loads(trusted_merkle)
        trusted_root = trusted_data["root"]
        trusted_leaves = trusted_data["leaves"]
    except (json.JSONDecodeError, KeyError):
        raise HTTPException(status_code=400, detail="trusted_merkle must be valid JSON with 'root' and 'leaves' keys.")

    # Step 1: Verify Dilithium3 signature over the trusted Merkle root
    sig_bytes = decode_b64(signature)
    pub_bytes = decode_b64(public_key)
    root_bytes = bytes.fromhex(trusted_root)
    signature_valid = verify_signature(root_bytes, sig_bytes, pub_bytes)

    # Step 2: Rebuild Merkle tree from received firmware
    merkle_result = verify_merkle(firmware_bytes, trusted_leaves)
    computed_root = merkle_result.get("computed_root", "")
    merkle_match = merkle_result["merkle_match"]
    tampered_chunks = merkle_result.get("tampered_chunks", [])

    is_safe = signature_valid and merkle_match

    return {
        "status": "VERIFIED" if is_safe else "TAMPERED",
        "signature_valid": signature_valid,
        "merkle_match": merkle_match,
        "merkle_root_expected": trusted_root,
        "merkle_root_computed": computed_root,
        "tampered_chunks": tampered_chunks,
        "installation_safe": is_safe,
    }
```

---

## 6. COMPONENT 3 — VERSION LEDGER API

### 6.1 Purpose

Maintains a per-vehicle version history in Firestore. Enforces monotonically increasing version numbers. Blocks rollback attempts even when the attacker presents a valid signature for an older version. Provides fleet-wide status for the dashboard.

### 6.2 backend/core/firebase_client.py

Anti Gravity must create this file:

```python
import os
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP

_db = None

def get_db():
    global _db
    if _db is None:
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-service-account.json")
        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        _db = firestore.client()
    return _db

def get_vehicle(vehicle_id: str) -> dict | None:
    db = get_db()
    doc = db.collection("vehicle_ledger").document(vehicle_id).get()
    return doc.to_dict() if doc.exists else None

def create_vehicle(vehicle_id: str, version: str, firmware_hash: str, algorithm: str = "Dilithium3"):
    db = get_db()
    entry = {
        "version": version,
        "firmware_hash": firmware_hash,
        "installed_at": SERVER_TIMESTAMP,
        "status": "QUANTUM_SAFE",
    }
    db.collection("vehicle_ledger").document(vehicle_id).set({
        "vehicle_id": vehicle_id,
        "current_version": version,
        "current_hash": firmware_hash,
        "algorithm": algorithm,
        "status": "QUANTUM_SAFE",
        "alerts": [],
        "update_history": [entry],
    })

def update_vehicle_version(vehicle_id: str, version: str, firmware_hash: str):
    db = get_db()
    entry = {
        "version": version,
        "firmware_hash": firmware_hash,
        "installed_at": SERVER_TIMESTAMP,
        "status": "QUANTUM_SAFE",
    }
    db.collection("vehicle_ledger").document(vehicle_id).update({
        "current_version": version,
        "current_hash": firmware_hash,
        "status": "QUANTUM_SAFE",
        "alerts": [],
        "update_history": firestore.ArrayUnion([entry]),
    })

def log_alert(vehicle_id: str, alert_type: str, detail: dict):
    db = get_db()
    alert = {"type": alert_type, "detail": detail}
    db.collection("vehicle_ledger").document(vehicle_id).update({
        "status": alert_type,
        "alerts": firestore.ArrayUnion([alert]),
    })

def get_all_vehicles() -> list:
    db = get_db()
    docs = db.collection("vehicle_ledger").stream()
    return [doc.to_dict() for doc in docs]

def register_firmware_release(version: str, merkle_root: str, merkle_leaves: list,
                               firmware_hash: str, signature: str, public_key: str):
    db = get_db()
    db.collection("firmware_releases").document(f"v{version}").set({
        "version": version,
        "firmware_hash": firmware_hash,
        "merkle_root": merkle_root,
        "merkle_leaves": merkle_leaves,
        "public_key": public_key,
        "signature": signature,
        "algorithm": "Dilithium3",
        "nist_standard": "FIPS 204",
        "released_at": SERVER_TIMESTAMP,
        "released_by": "OEM_SIGNING_SERVICE",
    })
```

### 6.3 backend/routers/ledger.py

Anti Gravity must create this file:

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import semver
from core.firebase_client import (
    get_vehicle, create_vehicle, update_vehicle_version,
    log_alert, get_all_vehicles, register_firmware_release
)

router = APIRouter()

class LedgerUpdateRequest(BaseModel):
    vehicle_id: str
    version: str
    firmware_hash: str
    signature: Optional[str] = None

class LedgerRegisterRequest(BaseModel):
    version: str
    merkle_root: str
    merkle_leaves: list
    firmware_hash: str
    signature: str
    public_key: str

@router.post("/ledger/update")
async def update_ledger(req: LedgerUpdateRequest):
    """
    Update a vehicle's firmware version in the ledger.
    Blocks rollback: new version must be strictly greater than current version.
    """
    vehicle = get_vehicle(req.vehicle_id)

    if vehicle is None:
        # First time this vehicle is seen — create its ledger entry
        create_vehicle(req.vehicle_id, req.version, req.firmware_hash)
        return {
            "status": "APPROVED",
            "vehicle_id": req.vehicle_id,
            "new_version": req.version,
            "previous_version": None,
            "message": "Vehicle registered and firmware version recorded.",
        }

    current_version = vehicle.get("current_version", "0.0.0")

    # Semantic version comparison
    try:
        is_newer = semver.compare(req.version, current_version) > 0
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid semver format: {req.version} or {current_version}")

    if not is_newer:
        # Rollback detected — log alert and block
        log_alert(req.vehicle_id, "ROLLBACK_BLOCKED", {
            "attempted_version": req.version,
            "current_version": current_version,
        })
        raise HTTPException(status_code=409, detail={
            "status": "ROLLBACK_BLOCKED",
            "vehicle_id": req.vehicle_id,
            "attempted_version": req.version,
            "current_version": current_version,
            "reason": f"Attempted version ({req.version}) is not greater than current version ({current_version}).",
        })

    # Version is valid — approve and update
    update_vehicle_version(req.vehicle_id, req.version, req.firmware_hash)
    return {
        "status": "APPROVED",
        "vehicle_id": req.vehicle_id,
        "new_version": req.version,
        "previous_version": current_version,
    }

@router.post("/ledger/register")
async def register_release(req: LedgerRegisterRequest):
    """Register a new firmware release in the firmware_releases collection."""
    register_firmware_release(
        version=req.version,
        merkle_root=req.merkle_root,
        merkle_leaves=req.merkle_leaves,
        firmware_hash=req.firmware_hash,
        signature=req.signature,
        public_key=req.public_key,
    )
    return {"status": "REGISTERED", "version": req.version}

@router.get("/fleet")
async def get_fleet():
    """Return status of all vehicles for the dashboard."""
    vehicles = get_all_vehicles()
    summary = {
        "total": len(vehicles),
        "quantum_safe": sum(1 for v in vehicles if v.get("status") == "QUANTUM_SAFE"),
        "tampered": sum(1 for v in vehicles if v.get("status") == "TAMPERED"),
        "rollback_blocked": sum(1 for v in vehicles if v.get("status") == "ROLLBACK_BLOCKED"),
        "legacy_rsa": sum(1 for v in vehicles if v.get("algorithm") == "RSA-2048"),
    }
    return {"vehicles": vehicles, "fleet_summary": summary}

@router.get("/health")
async def health():
    return {"status": "ok", "service": "VeriOTA Backend"}
```

### 6.4 backend/main.py

Anti Gravity must create this file:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import sign, verify, ledger

app = FastAPI(
    title="VeriOTA API",
    description="Post-Quantum Secure Automotive OTA — CRYSTALS-Dilithium3 + Merkle Tree",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to Vercel domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sign.router)
app.include_router(verify.router)
app.include_router(ledger.router)
```

### 6.5 backend/Procfile

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## 7. COMPONENT 4 — FLEET DASHBOARD (Next.js)

### 7.1 Purpose

Real-time fleet security dashboard. Uses Firebase onSnapshot listeners to update vehicle cards without polling. Shows aggregate fleet stats. Provides three demo action buttons. Displays RSA vs Dilithium comparison table.

### 7.2 frontend/src/app/lib/firebase.ts

Anti Gravity must create this file:

```typescript
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
```

### 7.3 frontend/src/app/lib/api.ts

Anti Gravity must create this file:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function triggerTamperAttack(vehicleId: string): Promise<any> {
  // Fetches a tampered firmware binary from /demo/firmware_tampered.bin (served as static)
  const formData = new FormData();
  const res = await fetch("/demo/firmware_tampered.bin");
  const blob = await res.blob();
  formData.append("firmware", blob, "firmware_tampered.bin");

  // Also fetch signed metadata
  const metaRes = await fetch("/demo/signed_metadata.json");
  const meta = await metaRes.json();

  formData.append("signature", meta.signature);
  formData.append("public_key", meta.public_key);
  formData.append("trusted_merkle", JSON.stringify({
    root: meta.merkle_root,
    leaves: meta.merkle_leaves,
  }));

  const verifyRes = await fetch(`${API_URL}/verify`, { method: "POST", body: formData });
  const verifyData = await verifyRes.json();

  // Log alert to Firestore via ledger API
  if (!verifyData.installation_safe) {
    await fetch(`${API_URL}/ledger/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle_id: vehicleId,
        version: "TAMPERED",
        firmware_hash: "tampered",
      }),
    });
  }
  return verifyData;
}

export async function triggerRollbackAttack(vehicleId: string): Promise<any> {
  const res = await fetch(`${API_URL}/ledger/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicle_id: vehicleId,
      version: "1.0.0",
      firmware_hash: "rollback_test",
    }),
  });
  return res.json();
}

export async function getFleet(): Promise<any> {
  const res = await fetch(`${API_URL}/fleet`);
  return res.json();
}
```

### 7.4 frontend/src/app/components/VehicleCard.tsx

Anti Gravity must create this file:

```tsx
"use client";

type Alert = {
  type: string;
  detail: Record<string, any>;
};

type Vehicle = {
  vehicle_id: string;
  current_version: string;
  algorithm: string;
  status: "QUANTUM_SAFE" | "TAMPERED" | "ROLLBACK_BLOCKED" | "LEGACY_RSA";
  alerts: Alert[];
  last_updated?: string;
};

const STATUS_STYLES: Record<string, string> = {
  QUANTUM_SAFE: "bg-green-900 border-green-500 text-green-300",
  TAMPERED: "bg-red-900 border-red-500 text-red-300",
  ROLLBACK_BLOCKED: "bg-yellow-900 border-yellow-500 text-yellow-300",
  LEGACY_RSA: "bg-gray-800 border-gray-500 text-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  QUANTUM_SAFE: "✓ QUANTUM SAFE",
  TAMPERED: "✗ TAMPERED",
  ROLLBACK_BLOCKED: "⚠ ROLLBACK BLOCKED",
  LEGACY_RSA: "⚠ LEGACY RSA",
};

export default function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const style = STATUS_STYLES[vehicle.status] || STATUS_STYLES["LEGACY_RSA"];
  const label = STATUS_LABELS[vehicle.status] || vehicle.status;

  return (
    <div className={`rounded-xl border-2 p-4 transition-all duration-500 ${style}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="font-mono font-bold text-lg">{vehicle.vehicle_id}</span>
        <span className="text-xs font-semibold px-2 py-1 rounded-full border border-current">
          {label}
        </span>
      </div>
      <div className="text-sm opacity-80 mb-1">
        Version: <span className="font-mono">{vehicle.current_version}</span>
      </div>
      <div className="text-sm opacity-80 mb-2">
        Algorithm: <span className="font-mono">{vehicle.algorithm}</span>
      </div>
      {vehicle.alerts && vehicle.alerts.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs cursor-pointer opacity-70 hover:opacity-100">
            {vehicle.alerts.length} alert(s) — click to expand
          </summary>
          <div className="mt-2 space-y-1">
            {vehicle.alerts.map((alert, i) => (
              <div key={i} className="text-xs font-mono bg-black/30 rounded p-2">
                <div className="font-bold">{alert.type}</div>
                <pre className="whitespace-pre-wrap opacity-80">
                  {JSON.stringify(alert.detail, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
```

### 7.5 frontend/src/app/components/FleetSummaryBar.tsx

Anti Gravity must create this file:

```tsx
type Summary = {
  total: number;
  quantum_safe: number;
  tampered: number;
  rollback_blocked: number;
  legacy_rsa: number;
};

export default function FleetSummaryBar({ summary }: { summary: Summary }) {
  return (
    <div className="grid grid-cols-5 gap-4 mb-8 text-center">
      {[
        { label: "Total Vehicles", value: summary.total, color: "text-white" },
        { label: "Quantum Safe", value: summary.quantum_safe, color: "text-green-400" },
        { label: "Tampered", value: summary.tampered, color: "text-red-400" },
        { label: "Rollback Blocked", value: summary.rollback_blocked, color: "text-yellow-400" },
        { label: "Legacy RSA", value: summary.legacy_rsa, color: "text-gray-400" },
      ].map((item) => (
        <div key={item.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className={`text-3xl font-bold font-mono ${item.color}`}>{item.value}</div>
          <div className="text-xs text-gray-400 mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
```

### 7.6 frontend/src/app/components/DemoControlPanel.tsx

Anti Gravity must create this file:

```tsx
"use client";
import { useState } from "react";
import { triggerTamperAttack, triggerRollbackAttack } from "../lib/api";

export default function DemoControlPanel() {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  async function runDemo(type: string) {
    setLoading(type);
    setResult(null);
    try {
      let data;
      if (type === "tamper") data = await triggerTamperAttack("VIN-007");
      else if (type === "rollback") data = await triggerRollbackAttack("VIN-012");
      setResult({ type, data });
    } catch (e: any) {
      setResult({ type, error: e.message });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
      <h2 className="text-lg font-bold text-white mb-4">🧪 Live Demo Controls</h2>
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={() => runDemo("tamper")}
          disabled={loading !== null}
          className="bg-red-700 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-lg disabled:opacity-50 transition"
        >
          {loading === "tamper" ? "Running..." : "① Simulate Tamper Attack"}
        </button>
        <button
          onClick={() => runDemo("rollback")}
          disabled={loading !== null}
          className="bg-yellow-700 hover:bg-yellow-600 text-white font-semibold px-5 py-2 rounded-lg disabled:opacity-50 transition"
        >
          {loading === "rollback" ? "Running..." : "② Simulate Rollback"}
        </button>
        <button
          onClick={() => window.open("/comparison", "_blank")}
          className="bg-blue-700 hover:bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg transition"
        >
          ③ Compare RSA vs Dilithium
        </button>
      </div>
      {result && (
        <pre className="mt-4 text-xs font-mono text-green-300 bg-black/40 rounded-lg p-4 overflow-auto max-h-48">
          {JSON.stringify(result.data || result.error, null, 2)}
        </pre>
      )}
    </div>
  );
}
```

### 7.7 frontend/src/app/page.tsx

Anti Gravity must create this file:

```tsx
"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./lib/firebase";
import VehicleCard from "./components/VehicleCard";
import FleetSummaryBar from "./components/FleetSummaryBar";
import DemoControlPanel from "./components/DemoControlPanel";

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    total: 0, quantum_safe: 0, tampered: 0, rollback_blocked: 0, legacy_rsa: 0,
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "vehicle_ledger"), (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());
      setVehicles(data);
      setSummary({
        total: data.length,
        quantum_safe: data.filter((v) => v.status === "QUANTUM_SAFE").length,
        tampered: data.filter((v) => v.status === "TAMPERED").length,
        rollback_blocked: data.filter((v) => v.status === "ROLLBACK_BLOCKED").length,
        legacy_rsa: data.filter((v) => v.algorithm === "RSA-2048").length,
      });
    });
    return () => unsub();
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-mono tracking-tight">
            VeriOTA Fleet Dashboard
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Post-Quantum Secure OTA · CRYSTALS-Dilithium3 · FIPS 204 · Real-Time
          </p>
        </div>
        <FleetSummaryBar summary={summary} />
        <DemoControlPanel />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {vehicles.map((v) => (
            <VehicleCard key={v.vehicle_id} vehicle={v} />
          ))}
        </div>
        {vehicles.length === 0 && (
          <div className="text-center text-gray-500 py-24 text-lg">
            No vehicles registered yet. Run the backend seed script to populate.
          </div>
        )}
      </div>
    </main>
  );
}
```

---

## 8. DEMO SCRIPTS

### 8.1 demo/generate_firmware.py

Anti Gravity must create this file. Run this first to generate test firmware files:

```python
"""
Generates two firmware binary files for demo purposes:
  - firmware_clean.bin    : 10MB of pseudorandom bytes (legitimate firmware)
  - firmware_tampered.bin : identical to clean, but byte 200,000 is flipped (0x4F -> 0x50)
"""
import os
import random

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
SIZE = 10 * 1024 * 1024  # 10MB
TAMPER_BYTE_INDEX = 200_000

print("Generating firmware_clean.bin (10MB)...")
random.seed(42)  # Fixed seed for reproducibility
data = bytearray(random.getrandbits(8) for _ in range(SIZE))
clean_path = os.path.join(OUTPUT_DIR, "firmware_clean.bin")
with open(clean_path, "wb") as f:
    f.write(data)
print(f"  Saved: {clean_path}")

print("Generating firmware_tampered.bin (byte 200,000 flipped)...")
tampered = bytearray(data)
original_byte = tampered[TAMPER_BYTE_INDEX]
tampered[TAMPER_BYTE_INDEX] = original_byte ^ 0xFF  # Flip all bits of that byte
tampered_path = os.path.join(OUTPUT_DIR, "firmware_tampered.bin")
with open(tampered_path, "wb") as f:
    f.write(tampered)
print(f"  Saved: {tampered_path}")
print(f"  Tampered byte index: {TAMPER_BYTE_INDEX} | Original: 0x{original_byte:02X} -> Modified: 0x{tampered[TAMPER_BYTE_INDEX]:02X}")
print("Done.")
```

### 8.2 demo/tamper_attack.py — Demo Scenario 1

```python
"""
Demo Scenario 1: Firmware Tamper Attack
Uploads firmware_tampered.bin to /verify endpoint.
Expected output: TAMPERED status with chunk index and byte range.
Usage: python tamper_attack.py --api http://localhost:8000 --vehicle VIN-007
"""
import argparse
import json
import requests
import os

parser = argparse.ArgumentParser()
parser.add_argument("--api", default="http://localhost:8000")
parser.add_argument("--vehicle", default="VIN-007")
args = parser.parse_args()

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CLEAN_BIN = os.path.join(SCRIPT_DIR, "firmware_clean.bin")
TAMPERED_BIN = os.path.join(SCRIPT_DIR, "firmware_tampered.bin")
META_JSON = os.path.join(SCRIPT_DIR, "signed_metadata.json")

# Step 1: Sign the clean firmware to get trusted metadata
print("Step 1: Signing clean firmware to get trusted Merkle metadata...")
with open(CLEAN_BIN, "rb") as f:
    sign_res = requests.post(f"{args.api}/sign", files={"firmware": ("firmware_clean.bin", f, "application/octet-stream")})
sign_res.raise_for_status()
meta = sign_res.json()
with open(META_JSON, "w") as f:
    json.dump(meta, f, indent=2)
print(f"  Merkle root: {meta['merkle_root'][:16]}...")
print(f"  Chunks: {meta['chunk_count']}")

# Step 2: Submit tampered firmware for verification against trusted metadata
print(f"\nStep 2: Submitting tampered firmware for verification (vehicle: {args.vehicle})...")
trusted_merkle = json.dumps({"root": meta["merkle_root"], "leaves": meta["merkle_leaves"]})
with open(TAMPERED_BIN, "rb") as f:
    verify_res = requests.post(
        f"{args.api}/verify",
        files={"firmware": ("firmware_tampered.bin", f, "application/octet-stream")},
        data={
            "signature": meta["signature"],
            "public_key": meta["public_key"],
            "trusted_merkle": trusted_merkle,
        },
    )
verify_res.raise_for_status()
result = verify_res.json()

print(f"\n{'='*60}")
print(f"  STATUS: {result['status']}")
print(f"  Signature valid: {result['signature_valid']}")
print(f"  Merkle match: {result['merkle_match']}")
print(f"  Installation safe: {result['installation_safe']}")
if result["tampered_chunks"]:
    for chunk in result["tampered_chunks"]:
        print(f"\n  TAMPERED CHUNK:")
        print(f"    Chunk index : {chunk['chunk_index']}")
        print(f"    Byte range  : {chunk['byte_start']} – {chunk['byte_end']}")
        print(f"    Expected    : {chunk['trusted_hash'][:16]}...")
        print(f"    Computed    : {chunk['computed_hash'][:16]}...")
print(f"{'='*60}")
```

### 8.3 demo/rollback_attack.py — Demo Scenario 2

```python
"""
Demo Scenario 2: Rollback Attack
Attempts to push firmware v1.0.0 to a vehicle already on v2.1.4.
Expected output: ROLLBACK_BLOCKED with current vs attempted version.
Usage: python rollback_attack.py --api http://localhost:8000 --vehicle VIN-012
"""
import argparse
import requests

parser = argparse.ArgumentParser()
parser.add_argument("--api", default="http://localhost:8000")
parser.add_argument("--vehicle", default="VIN-012")
args = parser.parse_args()

# First, ensure vehicle is at v2.1.4
print(f"Setting {args.vehicle} to v2.1.4 (current patched version)...")
setup_res = requests.post(f"{args.api}/ledger/update", json={
    "vehicle_id": args.vehicle,
    "version": "2.1.4",
    "firmware_hash": "aabbccdd" * 8,
})
print(f"  Setup status: {setup_res.status_code}")

# Now attempt rollback to v1.0.0
print(f"\nAttempting rollback to v1.0.0 for {args.vehicle}...")
rollback_res = requests.post(f"{args.api}/ledger/update", json={
    "vehicle_id": args.vehicle,
    "version": "1.0.0",
    "firmware_hash": "11223344" * 8,
})

print(f"\n{'='*60}")
if rollback_res.status_code == 409:
    data = rollback_res.json()
    detail = data.get("detail", data)
    print(f"  STATUS: {detail.get('status', 'ROLLBACK_BLOCKED')}")
    print(f"  Vehicle      : {args.vehicle}")
    print(f"  Current ver  : {detail.get('current_version')}")
    print(f"  Attempted ver: {detail.get('attempted_version')}")
    print(f"  Reason       : {detail.get('reason')}")
else:
    print(f"  Unexpected response: {rollback_res.status_code}")
    print(f"  {rollback_res.json()}")
print(f"{'='*60}")
```

### 8.4 demo/rsa_comparison.py — Demo Scenario 3

```python
"""
Demo Scenario 3: RSA-2048 vs CRYSTALS-Dilithium3 Side-by-Side Comparison
Signs the same firmware with both algorithms and prints a comparison table.
Usage: python rsa_comparison.py --api http://localhost:8000
"""
import argparse
import time
import os
import hashlib
import base64
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
import oqs
import requests

parser = argparse.ArgumentParser()
parser.add_argument("--api", default="http://localhost:8000")
args = parser.parse_args()

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FIRMWARE_PATH = os.path.join(SCRIPT_DIR, "firmware_clean.bin")

with open(FIRMWARE_PATH, "rb") as f:
    firmware_bytes = f.read()

firmware_hash = hashlib.sha256(firmware_bytes).digest()

# RSA-2048 Benchmark
print("Benchmarking RSA-2048...")
rsa_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
t0 = time.perf_counter()
rsa_sig = rsa_key.sign(firmware_hash, padding.PKCS1v15(), hashes.SHA256())
rsa_sign_time = (time.perf_counter() - t0) * 1000

t0 = time.perf_counter()
rsa_key.public_key().verify(rsa_sig, firmware_hash, padding.PKCS1v15(), hashes.SHA256())
rsa_verify_time = (time.perf_counter() - t0) * 1000

rsa_pub_bytes = rsa_key.public_key().public_bytes(
    serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo
)

# Dilithium3 Benchmark
print("Benchmarking CRYSTALS-Dilithium3...")
with oqs.Signature("Dilithium3") as sig:
    t0 = time.perf_counter()
    pub_key = sig.generate_keypair()
    dil_sig = sig.sign(firmware_hash)
    dil_sign_time = (time.perf_counter() - t0) * 1000

    priv_key_bytes = sig.export_secret_key()

with oqs.Signature("Dilithium3") as verifier:
    t0 = time.perf_counter()
    verifier.verify(firmware_hash, dil_sig, pub_key)
    dil_verify_time = (time.perf_counter() - t0) * 1000

# Print comparison table
print(f"\n{'='*65}")
print(f"  {'Property':<30} {'RSA-2048':<15} {'Dilithium3':<15}")
print(f"  {'-'*60}")
rows = [
    ("Hard Problem",         "Integer Factorization",  "Module-LWE / MSIS"),
    ("Quantum Safe?",        "NO (Shor's breaks it)",  "YES (no known attack)"),
    ("Classical Security",   "~112 bits",              "~140 bits"),
    ("Quantum Security",     "BROKEN",                 "~128+ bits"),
    (f"Public Key Size",     f"{len(rsa_pub_bytes)} bytes", f"{len(pub_key)} bytes"),
    (f"Signature Size",      f"{len(rsa_sig)} bytes",  f"{len(dil_sig)} bytes"),
    (f"Sign Time",           f"{rsa_sign_time:.2f} ms", f"{dil_sign_time:.2f} ms"),
    (f"Verify Time",         f"{rsa_verify_time:.2f} ms", f"{dil_verify_time:.2f} ms"),
    ("NIST Status",          "Legacy (deprecated)",    "FIPS 204 (Aug 2024)"),
    ("Dashboard Badge",      "⚠ QUANTUM VULNERABLE",  "✓ QUANTUM SAFE"),
]
for prop, rsa_val, dil_val in rows:
    print(f"  {prop:<30} {rsa_val:<15} {dil_val:<15}")
print(f"{'='*65}")
print("\nConclusion: Dilithium3 signatures are ~13x larger but QUANTUM-SAFE.")
print("The 3,293-byte overhead is < 0.003% of a 10MB firmware package.")
```

---

## 9. FIREBASE SETUP

Anti Gravity must output instructions to set up Firebase. The human must complete these steps manually:

### 9.1 Steps to Complete Manually

```
1. Go to https://console.firebase.google.com
2. Click "Add Project" → Name it: veriota-hackathon
3. Disable Google Analytics (not needed)
4. Click "Create Project"

5. In the project console, click the gear icon → Project Settings
6. Go to "Service Accounts" tab
7. Click "Generate New Private Key" → Download the JSON file
8. Save it as: backend/firebase-service-account.json
   (DO NOT commit this file to git — it is in .gitignore)

9. In Firebase console, click "Firestore Database" in the left menu
10. Click "Create Database"
11. Choose: Start in production mode
12. Select region: asia-south1 (Mumbai — closest to Bangalore)
13. Click "Enable"

14. Go to Project Settings → General → Your Apps
15. Click "</>" (Web app)
16. Register app name: veriota-dashboard
17. Copy the firebaseConfig object values into frontend/.env.local
```

### 9.2 Seed 20 Vehicles into Firestore

Anti Gravity must create `backend/seed_vehicles.py`:

```python
"""
Seeds 20 vehicles into Firestore vehicle_ledger collection.
All start at v2.1.4 with QUANTUM_SAFE status.
Run once: python seed_vehicles.py
"""
import os
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
from dotenv import load_dotenv

load_dotenv()

cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-service-account.json")
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

vehicles = [f"VIN-{str(i).zfill(3)}" for i in range(1, 21)]

for vid in vehicles:
    db.collection("vehicle_ledger").document(vid).set({
        "vehicle_id": vid,
        "current_version": "2.1.4",
        "current_hash": "aabbccdd" * 8,
        "algorithm": "Dilithium3",
        "status": "QUANTUM_SAFE",
        "alerts": [],
        "update_history": [{
            "version": "2.1.4",
            "firmware_hash": "aabbccdd" * 8,
            "installed_at": SERVER_TIMESTAMP,
            "status": "QUANTUM_SAFE",
        }],
    })
    print(f"  Seeded {vid}")

print(f"\nDone — {len(vehicles)} vehicles seeded.")
```

---

## 10. LOCAL DEVELOPMENT WORKFLOW

### 10.1 Start Backend

```bash
cd backend
source venv/bin/activate          # Windows: venv\Scripts\activate
cp .env.example .env
# Edit .env with your Firebase credentials path
uvicorn main:app --reload --port 8000
```

Backend will be available at: `http://localhost:8000`  
API docs (auto-generated): `http://localhost:8000/docs`

### 10.2 Generate Keys on First Run

The signing engine auto-generates Dilithium3 keys on first `/sign` call and saves them to `backend/keys/`. No manual step needed.

### 10.3 Seed Firestore

```bash
cd backend
python seed_vehicles.py
```

### 10.4 Start Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local with your Firebase config values and API URL
npm run dev
```

Dashboard will be available at: `http://localhost:3000`

### 10.5 Run Demo Scripts

```bash
cd demo
python generate_firmware.py          # Run once to create firmware binaries
python tamper_attack.py              # Demo Scenario 1
python rollback_attack.py            # Demo Scenario 2
python rsa_comparison.py             # Demo Scenario 3
```

---

## 11. DEPLOYMENT

### 11.1 Backend — Railway

```bash
cd backend

# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init

# Set environment variables in Railway dashboard:
# FIREBASE_CREDENTIALS_PATH  → (upload the JSON file as a Railway Volume)
# FIREBASE_PROJECT_ID        → veriota-hackathon
# DILITHIUM_PRIVATE_KEY_PATH → ./keys/dilithium3_private.key
# DILITHIUM_PUBLIC_KEY_PATH  → ./keys/dilithium3_public.key

# Deploy
railway up
```

After deploy, Railway provides a URL like: `https://veriota-backend.up.railway.app`

### 11.2 Frontend — Vercel

```bash
cd frontend

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# All NEXT_PUBLIC_FIREBASE_* values from your Firebase project
# NEXT_PUBLIC_API_URL → your Railway backend URL

# Redeploy with env vars
vercel --prod
```

### 11.3 Post-Deployment Checklist

```
[ ] GET https://your-railway-url/health returns { "status": "ok" }
[ ] Dashboard loads at Vercel URL with 20 vehicle cards
[ ] All cards show QUANTUM_SAFE (green)
[ ] Tamper Attack button turns VIN-007 red
[ ] Rollback Attack button turns VIN-012 amber
[ ] RSA vs Dilithium comparison table opens correctly
[ ] Firestore real-time updates reflect in < 1 second on dashboard
```

---

## 12. TESTING & VALIDATION

### 12.1 backend/tests/test_sign.py

Anti Gravity must create this file:

```python
import pytest
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from main import app

client = TestClient(app)

def make_firmware(size: int = 1024) -> bytes:
    return bytes(range(256)) * (size // 256) + bytes(range(size % 256))

def test_sign_basic():
    firmware = make_firmware(8192)
    res = client.post("/sign", files={"firmware": ("fw.bin", firmware, "application/octet-stream")})
    assert res.status_code == 200
    data = res.json()
    assert data["algorithm"] == "Dilithium3"
    assert data["nist_standard"] == "FIPS 204"
    assert "merkle_root" in data
    assert "signature" in data
    assert "public_key" in data
    assert data["chunk_count"] == 2  # 8192 bytes / 4096 = 2 chunks

def test_sign_empty_firmware():
    res = client.post("/sign", files={"firmware": ("fw.bin", b"", "application/octet-stream")})
    assert res.status_code == 400

def test_sign_non_multiple_chunk_size():
    firmware = make_firmware(5000)  # Not a multiple of 4096
    res = client.post("/sign", files={"firmware": ("fw.bin", firmware, "application/octet-stream")})
    assert res.status_code == 200
    data = res.json()
    assert data["chunk_count"] == 2  # ceil(5000/4096) = 2
```

### 12.2 backend/tests/test_verify.py

Anti Gravity must create this file:

```python
import pytest
import json
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from main import app

client = TestClient(app)

def get_signed_metadata(firmware: bytes) -> dict:
    res = client.post("/sign", files={"firmware": ("fw.bin", firmware, "application/octet-stream")})
    assert res.status_code == 200
    return res.json()

def test_verify_clean_firmware():
    firmware = bytes(range(256)) * 16  # 4096 bytes clean
    meta = get_signed_metadata(firmware)
    trusted_merkle = json.dumps({"root": meta["merkle_root"], "leaves": meta["merkle_leaves"]})
    res = client.post("/verify",
        files={"firmware": ("fw.bin", firmware, "application/octet-stream")},
        data={"signature": meta["signature"], "public_key": meta["public_key"], "trusted_merkle": trusted_merkle},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "VERIFIED"
    assert data["installation_safe"] is True
    assert data["tampered_chunks"] == []

def test_verify_tampered_firmware():
    firmware = bytearray(bytes(range(256)) * 16)
    meta = get_signed_metadata(bytes(firmware))
    firmware[100] ^= 0xFF  # Flip byte 100
    trusted_merkle = json.dumps({"root": meta["merkle_root"], "leaves": meta["merkle_leaves"]})
    res = client.post("/verify",
        files={"firmware": ("fw.bin", bytes(firmware), "application/octet-stream")},
        data={"signature": meta["signature"], "public_key": meta["public_key"], "trusted_merkle": trusted_merkle},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "TAMPERED"
    assert data["installation_safe"] is False
    assert len(data["tampered_chunks"]) > 0
    assert data["tampered_chunks"][0]["chunk_index"] == 0
    assert data["tampered_chunks"][0]["byte_start"] == 0
```

### 12.3 Run All Tests

```bash
cd backend
pytest tests/ -v
```

Expected: all tests pass with green output.

---

## 13. CYBERSECURITY ENHANCEMENTS (HACKATHON EDGE)

These additions will impress judges and demonstrate deeper security thinking beyond the base implementation.

### 13.1 Enhancement 1 — Timestamp Binding in Signatures

**Problem:** A valid Dilithium signature on old firmware could be replayed days later.  
**Fix:** Include a UTC timestamp and vehicle ID in the signed payload alongside the Merkle root.

In `backend/routers/sign.py`, change what gets signed:

```python
from datetime import datetime, timezone
import json

# Instead of signing only the Merkle root bytes, sign this composite payload:
signed_payload = json.dumps({
    "merkle_root": merkle_data["root"],
    "signed_at": datetime.now(timezone.utc).isoformat(),
    "firmware_hash": firmware_hash,
}).encode("utf-8")

signature = sign_message(signed_payload, private_key)
```

**Judge talking point:** "Our signatures bind to a timestamp, preventing replay of yesterday's valid package."

### 13.2 Enhancement 2 — Vehicle-Specific Binding

**Problem:** A package signed for VIN-001 could be replayed to VIN-002.  
**Fix:** Include vehicle_id in the signed payload when calling `/verify`.

```python
# Add vehicle_id to signed payload
signed_payload = json.dumps({
    "merkle_root": merkle_data["root"],
    "vehicle_id": vehicle_id,
    "signed_at": timestamp,
}).encode("utf-8")
```

**Judge talking point:** "Each firmware package is cryptographically bound to a specific vehicle VIN."

### 13.3 Enhancement 3 — HNDL Attack Visualizer on Dashboard

Add a panel to the dashboard that shows a live simulation of what happens when a nation-state stores today's RSA-signed traffic and attempts to break it in 2036. Show:
- RSA: "Traffic recorded 2026. Quantum computer breaks key in 2036. Fleet compromised."
- Dilithium: "Traffic recorded 2026. Quantum computer runs Shor's. Private key NOT recoverable. Fleet safe."

This is purely a UI visualization component — no extra backend logic needed.

### 13.4 Enhancement 4 — Firestore Security Rules

In the Firebase console, set these Firestore security rules to prevent client-side writes:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /vehicle_ledger/{vehicleId} {
      allow read: if true;
      allow write: if false;  // Only backend service account can write
    }
    match /firmware_releases/{version} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

**Judge talking point:** "The version ledger is read-only from the client. Only our authenticated backend service account can write — preventing client-side manipulation."

### 13.5 Enhancement 5 — Production Migration Path Note

Add a `PRODUCTION_NOTES.md` in the repo root stating:

- Replace liboqs with a **FIPS 140-2 Level 3 HSM-backed** Dilithium implementation (Entrust or Thales nShield)
- Replace Firebase Firestore ledger with **Google Trillian** (cryptographic append-only log) or **Hyperledger Fabric**
- Add **M-of-N threshold signing** for key ceremony (prevents insider key theft)
- Integrate with **Uptane's four-role model** (Root, Targets, Snapshot, Timestamp) replacing only the signing algorithm

---

## 14. ANTI GRAVITY AGENT INSTRUCTIONS

This section is written directly for the Anti Gravity AI coding agent. Follow these instructions precisely in order.

### Phase 1 — Scaffold

```
1. Create the full directory structure defined in Section 2.
2. Create all files listed — start with backend/core/, then backend/routers/, then backend/main.py.
3. Create frontend/src/app/lib/, then frontend/src/app/components/, then frontend/src/app/page.tsx.
4. Create all demo/ scripts.
5. Create all test files.
```

### Phase 2 — Implement

```
6. Implement backend/core/dilithium.py exactly as specified in Section 4.2.
7. Implement backend/core/merkle.py exactly as specified in Section 4.3.
8. Implement backend/core/firebase_client.py exactly as specified in Section 6.2.
9. Implement backend/routers/sign.py as in Section 4.4.
10. Implement backend/routers/verify.py as in Section 5.2.
11. Implement backend/routers/ledger.py as in Section 6.3.
12. Implement backend/main.py as in Section 6.4.
13. Implement all frontend TypeScript files as specified in Section 7.
14. Implement all demo Python scripts as specified in Section 8.
15. Implement all test files as specified in Section 12.
```

### Phase 3 — Validate

```
16. Run: cd backend && pip install -r requirements.txt
17. Run: cd backend && python -m pytest tests/ -v
    - All tests must pass before proceeding.
18. Run: cd backend && uvicorn main:app --reload --port 8000
    - Verify GET http://localhost:8000/health returns {"status":"ok"}
    - Verify GET http://localhost:8000/docs shows all routes
19. Run: cd demo && python generate_firmware.py
    - Verify firmware_clean.bin and firmware_tampered.bin are created
20. Run: cd demo && python tamper_attack.py
    - Verify output shows TAMPERED status with chunk index and byte range
21. Run: cd demo && python rollback_attack.py
    - Verify output shows ROLLBACK_BLOCKED with version details
22. Run: cd demo && python rsa_comparison.py
    - Verify comparison table prints correctly
23. Run: cd frontend && npm run dev
    - Verify dashboard loads at http://localhost:3000
```

### Phase 4 — Deploy

```
24. Deploy backend to Railway following Section 11.1.
25. Deploy frontend to Vercel following Section 11.2.
26. Run post-deployment checklist in Section 11.3.
27. All 7 checklist items must pass before submission.
```

### Critical Rules for Anti Gravity

- **Never skip a step.** Execute phases in order: Scaffold → Implement → Validate → Deploy.
- **Never use placeholder code.** Every function must be fully implemented, not stubbed.
- **CHUNK_SIZE is always 4096.** Do not change this value anywhere.
- **Algorithm string is always "Dilithium3".** Do not use "dilithium3" or "DILITHIUM3".
- **All API responses must match the exact JSON structure** shown in the API specs.
- **Firestore collection names are case-sensitive:** `vehicle_ledger` and `firmware_releases`.
- **Do not generate RSA keys longer than 2048 bits** in the comparison script — this is intentional for the demo.
- **The seed script must create exactly 20 vehicles:** VIN-001 through VIN-020.
- **If any test fails, fix the implementation before proceeding to the next phase.**

---

*VeriOTA · Mich Josh Cybersecurity Hackathon 2026 · Problem Statement 03*  
*Contributors: Samera · Moonish · Built with Anti Gravity*
