import pytest
import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def sign_firmware(firmware: bytes) -> dict:
    """Helper: sign firmware and return metadata dict."""
    res = client.post("/sign", files={"firmware": ("fw.bin", firmware, "application/octet-stream")})
    assert res.status_code == 200, f"Sign failed: {res.text}"
    return res.json()


def verify_firmware(firmware: bytes, meta: dict) -> dict:
    """Helper: verify firmware against given signed metadata."""
    trusted_merkle = json.dumps({
        "root": meta["merkle_root"],
        "leaves": meta["merkle_leaves"],
    })
    res = client.post(
        "/verify",
        files={"firmware": ("fw.bin", firmware, "application/octet-stream")},
        data={
            "signature": meta["signature"],
            "public_key": meta["public_key"],
            "trusted_merkle": trusted_merkle,
            "signed_at": meta.get("signed_at", ""),
            "firmware_hash_signed": meta.get("firmware_hash", ""),
            "vehicle_id": meta.get("vehicle_id", "GLOBAL"),
        },
    )
    assert res.status_code == 200, f"Verify failed: {res.text}"
    return res.json()


def test_verify_clean_firmware():
    """Sign then verify exact same firmware — must return VERIFIED."""
    firmware = bytes(range(256)) * 16  # 4096 bytes
    meta = sign_firmware(firmware)
    result = verify_firmware(firmware, meta)
    assert result["status"] == "VERIFIED"
    assert result["installation_safe"] is True
    assert result["signature_valid"] is True
    assert result["merkle_match"] is True
    assert result["tampered_chunks"] == []


def test_verify_tampered_firmware_first_chunk():
    """Flip byte 100 in chunk 0 — must detect TAMPERED at chunk_index=0."""
    firmware = bytearray(bytes(range(256)) * 16)  # 4096 bytes
    meta = sign_firmware(bytes(firmware))
    firmware[100] ^= 0xFF  # Flip byte 100 (in chunk 0)
    result = verify_firmware(bytes(firmware), meta)
    assert result["status"] == "TAMPERED"
    assert result["installation_safe"] is False
    assert len(result["tampered_chunks"]) > 0
    assert result["tampered_chunks"][0]["chunk_index"] == 0
    assert result["tampered_chunks"][0]["byte_start"] == 0


def test_verify_tampered_firmware_second_chunk():
    """Flip byte in chunk 1 (offset 4097) — must detect TAMPERED at chunk_index=1."""
    firmware = bytearray(bytes(range(256)) * 32)  # 8192 bytes = 2 chunks
    meta = sign_firmware(bytes(firmware))
    firmware[4097] ^= 0xFF  # Flip byte in chunk 1
    result = verify_firmware(bytes(firmware), meta)
    assert result["status"] == "TAMPERED"
    assert any(c["chunk_index"] == 1 for c in result["tampered_chunks"])


def test_verify_completely_replaced_firmware():
    """Replace entire firmware with different bytes — all chunks must be tampered."""
    original = bytes(range(256)) * 16
    meta = sign_firmware(original)
    replaced = bytes(255 - b for b in original)
    result = verify_firmware(replaced, meta)
    assert result["status"] == "TAMPERED"
    assert result["installation_safe"] is False
    assert len(result["tampered_chunks"]) > 0


def test_verify_empty_firmware():
    """Empty firmware must return 400."""
    res = client.post(
        "/verify",
        files={"firmware": ("fw.bin", b"", "application/octet-stream")},
        data={
            "signature": "dGVzdA==",
            "public_key": "dGVzdA==",
            "trusted_merkle": '{"root":"abc","leaves":["abc"]}',
        },
    )
    assert res.status_code == 400


def test_verify_invalid_trusted_merkle_json():
    """Malformed trusted_merkle JSON must return 400."""
    firmware = bytes(range(256)) * 16
    res = client.post(
        "/verify",
        files={"firmware": ("fw.bin", firmware, "application/octet-stream")},
        data={
            "signature": "dGVzdA==",
            "public_key": "dGVzdA==",
            "trusted_merkle": "NOT_VALID_JSON",
        },
    )
    assert res.status_code == 400
