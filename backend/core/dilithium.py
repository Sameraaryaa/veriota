"""
VeriOTA — Post-Quantum Cryptographic Engine
Algorithm: ML-DSA-65 (CRYSTALS-Dilithium3) — NIST FIPS 204, August 2024

ML-DSA-65 is the officially standardized name for what was formerly called Dilithium3.
Security Level: NIST Level 3 (~192-bit classical, ~128-bit quantum security)
Hard Problem: Module Learning With Errors (MLWE) + Module SIS (MSIS)
"""
import oqs
import base64
import os
from pathlib import Path

# Crypto-agility: algorithm is configurable via environment variable.
# Supports: ML-DSA-65 (preferred), ML-DSA-44, ML-DSA-87, Dilithium3 (legacy fallback)
_configured = os.getenv("PQC_ALGORITHM", "ML-DSA-65")

# Graceful fallback: newer liboqs uses "ML-DSA-65", older uses "Dilithium3"
def _resolve_algorithm(preferred: str) -> str:
    """Resolve algorithm name against what this liboqs version supports."""
    try:
        sigs = oqs.get_enabled_sig_mechanisms()
        if preferred in sigs:
            return preferred
        # Try fallback mappings
        fallbacks = {
            "ML-DSA-65": ["Dilithium3", "dilithium3"],
            "ML-DSA-44": ["Dilithium2", "dilithium2"],
            "ML-DSA-87": ["Dilithium5", "dilithium5"],
        }
        for alt in fallbacks.get(preferred, []):
            if alt in sigs:
                return alt
        # Last resort: return as-is and let oqs raise a clear error
        return preferred
    except Exception:
        return preferred

ALGORITHM = _resolve_algorithm(_configured)
ALGORITHM_DISPLAY = "ML-DSA-65 (FIPS 204)" if "DSA" in ALGORITHM or "Dilithium" in ALGORITHM else ALGORITHM


def generate_keypair() -> tuple[bytes, bytes]:
    """
    Generate an ML-DSA-65 keypair.
    Returns (public_key, private_key) as raw bytes.
    Public key: 1952 bytes | Private key: 4000 bytes | Security: NIST Level 3
    """
    with oqs.Signature(ALGORITHM) as signer:
        public_key = signer.generate_keypair()
        private_key = signer.export_secret_key()
    return public_key, private_key


def sign_message(message: bytes, private_key: bytes) -> bytes:
    """
    Sign a message with ML-DSA-65 private key.
    Input: arbitrary bytes message
    Output: 3293-byte signature (EUF-CMA secure under MLWE assumption)
    """
    with oqs.Signature(ALGORITHM, secret_key=private_key) as signer:
        signature = signer.sign(message)
    return signature


def verify_signature(message: bytes, signature: bytes, public_key: bytes) -> bool:
    """
    Verify an ML-DSA-65 signature.
    Returns True if valid, False otherwise.
    No timing side-channels: uses constant-time comparison internally.
    """
    try:
        with oqs.Signature(ALGORITHM) as verifier:
            return verifier.verify(message, signature, public_key)
    except Exception:
        return False


def get_algorithm_info() -> dict:
    """Return metadata about the active PQC algorithm for API responses."""
    return {
        "algorithm": "ML-DSA-65",
        "nist_standard": "FIPS 204",
        "nist_level": 3,
        "classical_security_bits": 140,
        "quantum_security_bits": 128,
        "hard_problem": "Module Learning With Errors (MLWE) + Module SIS",
        "public_key_bytes": 1952,
        "private_key_bytes": 4000,
        "signature_bytes": 3293,
        "liboqs_name": ALGORITHM,
    }


def encode_b64(data: bytes) -> str:
    return base64.b64encode(data).decode("utf-8")


def decode_b64(data: str) -> bytes:
    return base64.b64decode(data.encode("utf-8"))


def load_or_generate_keypair(private_path: str, public_path: str) -> tuple[bytes, bytes]:
    """Load keypair from disk. If not found, generate and persist."""
    priv = Path(private_path)
    pub = Path(public_path)
    if priv.exists() and pub.exists():
        return pub.read_bytes(), priv.read_bytes()
    pub_key, priv_key = generate_keypair()
    priv.parent.mkdir(parents=True, exist_ok=True)
    priv.write_bytes(priv_key)
    pub.write_bytes(pub_key)
    return pub_key, priv_key
