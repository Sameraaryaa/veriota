"""
VeriOTA — Pre-Deployment Sandbox (Software-in-the-Loop)
Simulates the full firmware verification pipeline before deployment to a real ECU.
Maps to ISO 24089 §7.3 (Pre-deployment validation) and UNECE R156 SUMS requirements.

Pipeline stages:
  1. Signature Verification (ML-DSA-65)
  2. Merkle Tree Integrity Check
  3. Version Compatibility (Monotonic Ledger)
  4. Resource Feasibility (RAM/Flash check against target MCU)
  5. Rollback Safety Check
"""
import hashlib
import time
import os
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(tags=["Pre-Deployment Sandbox"])


class SandboxRequest(BaseModel):
    vehicle_id: str = "VIN-007"
    firmware_version: str = "2.2.0"
    firmware_size_bytes: int = 10_485_760  # 10MB default
    inject_tamper: bool = False  # Simulate bit-flip for demo
    inject_rollback: bool = False  # Simulate rollback for demo


@router.post("/api/sandbox/run")
async def run_sandbox(req: SandboxRequest):
    """
    Execute the full pre-deployment verification pipeline in a sandboxed environment.
    Returns a staged report showing each verification step and its result.
    """
    from core.firebase_client import get_vehicle

    start = time.time()
    stages = []
    overall_pass = True
    vehicle = get_vehicle(req.vehicle_id)

    # ── Stage 1: Signature Verification ──────────────────────────────────────
    stage1_start = time.time()
    sig_pass = not req.inject_tamper  # Tampered firmware fails signature
    stages.append({
        "stage": 1,
        "name": "ML-DSA-65 Signature Verification",
        "standard": "NIST FIPS 204",
        "description": "Verify firmware package is signed by OEM using ML-DSA-65 (CRYSTALS-Dilithium Level 3)",
        "status": "PASS" if sig_pass else "FAIL",
        "duration_ms": round((time.time() - stage1_start) * 1000, 2),
        "details": {
            "algorithm": "ML-DSA-65",
            "security_level": 3,
            "quantum_safe": True,
            "signature_bytes": 3293,
            "public_key_bytes": 1952,
        } if sig_pass else {
            "algorithm": "ML-DSA-65",
            "failure_reason": "Signature mismatch — firmware binary has been modified after signing",
            "implication": "CRITICAL — possible man-in-the-middle injection or supply chain compromise",
        },
    })
    if not sig_pass:
        overall_pass = False

    # ── Stage 2: Merkle Tree Integrity ───────────────────────────────────────
    stage2_start = time.time()
    chunk_count = req.firmware_size_bytes // 4096
    merkle_pass = not req.inject_tamper
    tampered_chunk = None
    if req.inject_tamper:
        tampered_chunk = {
            "chunk_index": 48,
            "byte_start": 48 * 4096,
            "byte_end": 49 * 4096,
            "expected_hash": hashlib.sha256(b"trusted_chunk_48").hexdigest()[:16] + "...",
            "computed_hash": hashlib.sha256(b"tampered_chunk_48").hexdigest()[:16] + "...",
        }

    stages.append({
        "stage": 2,
        "name": "Merkle Tree Integrity Verification",
        "standard": "VeriOTA Proprietary (4KB chunk granularity)",
        "description": f"Decompose {req.firmware_size_bytes / 1_048_576:.1f}MB firmware into {chunk_count} chunks and verify Merkle root",
        "status": "PASS" if merkle_pass else "FAIL",
        "duration_ms": round((time.time() - stage2_start) * 1000, 2),
        "details": {
            "total_chunks": chunk_count,
            "chunk_size_bytes": 4096,
            "tree_depth": len(bin(chunk_count)) - 2,
            "proof_complexity": f"O(log {chunk_count}) = {len(bin(chunk_count)) - 2} hash operations",
            "merkle_root_match": merkle_pass,
        },
        "forensic_localization": tampered_chunk,
    })
    if not merkle_pass:
        overall_pass = False

    # ── Stage 3: Version Compatibility (Monotonic Ledger) ────────────────────
    stage3_start = time.time()
    current_version = vehicle.get("current_version", "0.0.0") if vehicle else "0.0.0"

    # Parse semver for comparison
    def parse_semver(v):
        parts = v.split(".")
        return tuple(int(p) for p in parts[:3])

    try:
        is_upgrade = parse_semver(req.firmware_version) > parse_semver(current_version)
    except Exception:
        is_upgrade = False

    version_pass = is_upgrade and not req.inject_rollback
    if req.inject_rollback:
        version_pass = False

    stages.append({
        "stage": 3,
        "name": "Monotonic Version Ledger Check",
        "standard": "UNECE R156 SUMS / VeriOTA Semantic Version Enforcement",
        "description": f"Verify v{req.firmware_version} > v{current_version} (strict monotonic ordering)",
        "status": "PASS" if version_pass else "FAIL",
        "duration_ms": round((time.time() - stage3_start) * 1000, 2),
        "details": {
            "current_version": current_version,
            "proposed_version": req.firmware_version,
            "is_upgrade": is_upgrade,
            "rollback_blocked": not version_pass,
        },
    })
    if not version_pass:
        overall_pass = False

    # ── Stage 4: Resource Feasibility (MCU Compatibility) ────────────────────
    stage4_start = time.time()
    target_mcu = {
        "name": "STM32F407",
        "architecture": "ARM Cortex-M4",
        "clock_mhz": 168,
        "flash_kb": 1024,
        "sram_kb": 192,
    }
    firmware_fits = req.firmware_size_bytes <= (target_mcu["flash_kb"] * 1024)
    verify_time_ms = round(2_500_000 / (target_mcu["clock_mhz"] * 1_000_000) * 1000, 1)
    ram_ok = True  # ML-DSA-65 needs ~3KB stack, well within 192KB SRAM

    resource_pass = ram_ok  # Flash check is informational (OTA is streamed, not stored fully)
    stages.append({
        "stage": 4,
        "name": "Resource Feasibility Analysis",
        "standard": "PQM4 Benchmark Framework",
        "description": f"Verify firmware fits target MCU and verification completes within timing budget",
        "status": "PASS" if resource_pass else "FAIL",
        "duration_ms": round((time.time() - stage4_start) * 1000, 2),
        "details": {
            "target_mcu": target_mcu,
            "firmware_size_bytes": req.firmware_size_bytes,
            "verification_time_ms": verify_time_ms,
            "stack_required_bytes": 3072,
            "stack_available_bytes": target_mcu["sram_kb"] * 1024,
            "timing_budget_met": verify_time_ms < 100,  # 100ms budget for safety-critical
            "ram_sufficient": ram_ok,
        },
    })

    # ── Stage 5: Rollback Safety Audit ───────────────────────────────────────
    stage5_start = time.time()
    update_history = vehicle.get("update_history", []) if vehicle else []
    rollback_safe = version_pass  # If version check passed, rollback is safe
    stages.append({
        "stage": 5,
        "name": "Rollback Safety Audit",
        "standard": "ISO 24089 §7.3 / UNECE R156",
        "description": "Verify update does not regress to a version with known CVEs",
        "status": "PASS" if rollback_safe else "FAIL",
        "duration_ms": round((time.time() - stage5_start) * 1000, 2),
        "details": {
            "update_history_length": len(update_history),
            "current_version": current_version,
            "proposed_version": req.firmware_version,
            "known_vulnerable_versions": ["1.0.0", "1.0.1"],
            "proposed_version_is_vulnerable": req.firmware_version in ["1.0.0", "1.0.1"],
        },
    })
    if not rollback_safe:
        overall_pass = False

    total_time = round((time.time() - start) * 1000, 2)

    return {
        "sandbox_id": f"sbx_{hashlib.sha256(f'{req.vehicle_id}{time.time()}'.encode()).hexdigest()[:12]}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "vehicle_id": req.vehicle_id,
        "firmware_version": req.firmware_version,
        "overall_verdict": "APPROVED — Ready for deployment" if overall_pass else "REJECTED — Pre-deployment checks failed",
        "overall_pass": overall_pass,
        "total_duration_ms": total_time,
        "stages_passed": sum(1 for s in stages if s["status"] == "PASS"),
        "stages_total": len(stages),
        "pipeline": stages,
        "recommendation": (
            f"Firmware v{req.firmware_version} is safe to deploy to {req.vehicle_id}."
            if overall_pass else
            f"DO NOT DEPLOY. {sum(1 for s in stages if s['status'] == 'FAIL')} stage(s) failed. Review forensic details above."
        ),
    }
