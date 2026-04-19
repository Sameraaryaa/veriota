"""
VeriOTA — FastAPI Application Entry Point
All routers registered here. CORS enabled for demo cross-origin access.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import sign, sign_hybrid, verify, ledger, demo, ecu_sim, compliance, sandbox, transparency, crypto_info, delta_update, key_rotation

app = FastAPI(
    title="VeriOTA — Post-Quantum Automotive OTA Security",
    description=(
        "CRYSTALS-Dilithium3 / ML-DSA-65 (NIST FIPS 204) post-quantum secure "
        "firmware signing and verification for Software-Defined Vehicles. "
        "Implements: Merkle tree tamper localization, rollback prevention ledger, "
        "hybrid signing (ML-DSA-65 + ECDSA), ECU simulation, and real-time fleet SOC dashboard."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Allow all origins for demo (in production: restrict to OEM domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core OTA Security APIs
app.include_router(sign.router)
app.include_router(sign_hybrid.router)
app.include_router(verify.router)
app.include_router(ledger.router)

# Demo & Simulation APIs
app.include_router(demo.router)
app.include_router(ecu_sim.router)
app.include_router(delta_update.router)
app.include_router(key_rotation.router)

# Compliance & Threat Intelligence
app.include_router(compliance.router)

# Pre-Deployment Sandbox (SIL Testing)
app.include_router(sandbox.router)

# Firmware Transparency Log (Layer 4: Stolen-Key Defense)
app.include_router(transparency.router)

# Crypto Info (π-Seeded Algorithm Metadata)
app.include_router(crypto_info.router)

@app.get("/health")
async def health():
    from core.dilithium import ALGORITHM, ALGORITHM_DISPLAY
    return {
        "status": "ok",
        "service": "VeriOTA Backend",
        "version": "2.0.0",
        "pqc_algorithm": ALGORITHM_DISPLAY,
        "nist_standard": "FIPS 204",
        "endpoints": {
            "sign": "POST /sign",
            "sign_hybrid": "POST /sign-hybrid",
            "verify": "POST /verify",
            "merkle_proof": "GET /merkle-proof",
            "fleet": "GET /fleet",
            "ecu_simulate": "POST /ecu/simulate-verify",
            "ecu_benchmark": "GET /ecu/benchmark",
            "demo_tamper": "POST /api/demo/tamper",
            "demo_rollback": "POST /api/demo/rollback",
            "demo_hndl": "POST /api/demo/hndl",
            "demo_reset": "POST /api/demo/reset",
            "compliance": "GET /api/compliance",
            "threat_model": "GET /api/threat-model",
            "pqm4_benchmarks": "GET /api/benchmarks/pqm4",
            "sandbox_run": "POST /api/sandbox/run",
            "transparency_publish": "POST /api/transparency/publish",
            "transparency_log": "GET /api/transparency/log",
            "transparency_verify": "GET /api/transparency/verify",
            "transparency_root": "GET /api/transparency/root",
            "transparency_verify_hash": "GET /api/transparency/verify/{firmware_hash}",
            "transparency_check": "POST /api/transparency/check",
            "crypto_info": "GET /crypto/info",
            "demo_transparency_bypass": "POST /api/demo/transparency-bypass",
        }
    }
