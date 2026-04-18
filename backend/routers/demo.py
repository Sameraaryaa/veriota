"""
VeriOTA — Demo Simulator Router
Exposes attack simulation scripts as streaming Server-Sent Events (SSE).

Each demo endpoint streams real-time output from the attack/verification scripts
directly to the browser terminal widget — no black box, no hardcoded messages.
"""
import subprocess
import os
import sys
import asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api/demo", tags=["demo"])

PYTHON_EXEC = sys.executable
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEMO_DIR = os.path.join(os.path.dirname(BACKEND_DIR), "demo")
API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8001")


def _find_script(script_name: str) -> str | None:
    """Locate a script in demo dir or backend dir."""
    for d in [DEMO_DIR, BACKEND_DIR]:
        p = os.path.join(d, script_name)
        if os.path.exists(p):
            return p
    return None


async def _stream_script(script_name: str, args: list) -> StreamingResponse:
    """Stream script output line-by-line as Server-Sent Events."""
    script_path = _find_script(script_name)
    if not script_path:
        async def err():
            yield f"data: ERROR: Script {script_name} not found in demo/ or backend/ dir.\n\n"
        return StreamingResponse(err(), media_type="text/event-stream")

    async def generate():
        try:
            proc = await asyncio.create_subprocess_exec(
                PYTHON_EXEC, script_path, *args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            # Stream stdout line by line
            async for line in proc.stdout:
                text = line.decode("utf-8", errors="replace").rstrip()
                if text:
                    yield f"data: {text}\n\n"
                    await asyncio.sleep(0)  # allow event loop to flush

            # Stream stderr as warnings
            stderr_out = await proc.stderr.read()
            if stderr_out:
                for line in stderr_out.decode("utf-8", errors="replace").split("\n"):
                    if line.strip():
                        yield f"data: STDERR: {line}\n\n"

            returncode = await proc.wait()
            yield f"data: EXIT_CODE:{returncode}\n\n"
            yield f"data: __STREAM_END__\n\n"

        except Exception as e:
            yield f"data: FATAL: {str(e)}\n\n"
            yield f"data: __STREAM_END__\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )


@router.post("/tamper")
async def trigger_tamper(vehicle: str = "VIN-007"):
    """Stream: Tamper attack on a vehicle — mutates firmware, triggers Merkle failure & Firestore alert."""
    return await _stream_script("tamper_attack.py", [
        "--vehicle", vehicle,
        "--api", API_URL,
    ])


@router.post("/rollback")
async def trigger_rollback(vehicle: str = "VIN-012"):
    """Stream: Rollback attack — attempts to flash old vulnerable firmware, blocked by version ledger."""
    return await _stream_script("rollback_attack.py", [
        "--vehicle", vehicle,
        "--api", API_URL,
    ])


@router.post("/hndl")
async def trigger_hndl():
    """Stream: HNDL simulation — runs RSA vs ML-DSA-65 side-by-side benchmark."""
    return await _stream_script("rsa_comparison.py", [])


@router.post("/reset")
async def trigger_reset():
    """Stream: Reset fleet database — reseed all vehicles to QUANTUM_SAFE at v2.1.4."""
    return await _stream_script("seed_vehicles.py", [])
