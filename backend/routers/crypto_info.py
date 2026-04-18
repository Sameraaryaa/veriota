"""
VeriOTA — Crypto Info Router
Exposes /crypto/info endpoint with π-seeded algorithm metadata.
"""
from fastapi import APIRouter
from core.dilithium import get_algorithm_info

router = APIRouter(tags=["Crypto Info"])


@router.get("/crypto/info")
async def crypto_info():
    """
    Return full cryptographic metadata including π-seeding details,
    Nothing-Up-My-Sleeve explanation, and NIST compliance data.
    """
    return get_algorithm_info()
