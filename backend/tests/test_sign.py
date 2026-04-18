import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def make_firmware(size: int = 1024) -> bytes:
    return bytes(range(256)) * (size // 256) + bytes(range(size % 256))


def test_sign_basic():
    """Sign a clean 8KB firmware — verify all required fields returned including vehicle_id."""
    firmware = make_firmware(8192)
    res = client.post(
        "/sign",
        files={"firmware": ("fw.bin", firmware, "application/octet-stream")},
        data={"vehicle_id": "TEST-VIN-001"}
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["algorithm"] == "Dilithium3"
    assert data["nist_standard"] == "FIPS 204"
    assert "merkle_root" in data
    assert "signature" in data
    assert "public_key" in data
    assert "merkle_leaves" in data
    assert "signed_at" in data
    assert data["vehicle_id"] == "TEST-VIN-001"
    assert data["chunk_count"] == 2  # 8192 bytes / 4096 = 2 chunks
    assert data["chunk_size"] == 4096
    assert data["firmware_size"] == 8192


def test_sign_empty_firmware():
    """Signing an empty file must return HTTP 400."""
    res = client.post("/sign", files={"firmware": ("fw.bin", b"", "application/octet-stream")})
    assert res.status_code == 400


def test_sign_non_multiple_chunk_size():
    """5000 bytes firmware — last chunk is zero-padded, chunk_count must be 2."""
    firmware = make_firmware(5000)
    res = client.post("/sign", files={"firmware": ("fw.bin", firmware, "application/octet-stream")})
    assert res.status_code == 200
    data = res.json()
    assert data["chunk_count"] == 2  # ceil(5000/4096) = 2
    assert data["firmware_size"] == 5000


def test_sign_single_chunk():
    """Firmware exactly 4096 bytes — must produce 1 chunk."""
    firmware = make_firmware(4096)
    res = client.post("/sign", files={"firmware": ("fw.bin", firmware, "application/octet-stream")})
    assert res.status_code == 200
    data = res.json()
    assert data["chunk_count"] == 1


def test_sign_public_key_size():
    """Dilithium3 public key must be 1952 bytes (base64 decoded)."""
    import base64
    firmware = make_firmware(4096)
    res = client.post("/sign", files={"firmware": ("fw.bin", firmware, "application/octet-stream")})
    assert res.status_code == 200
    pub_bytes = base64.b64decode(res.json()["public_key"])
    assert len(pub_bytes) == 1952, f"Expected 1952, got {len(pub_bytes)}"


def test_sign_signature_size():
    """Dilithium3 signature must be 3293 bytes (base64 decoded)."""
    import base64
    firmware = make_firmware(4096)
    res = client.post("/sign", files={"firmware": ("fw.bin", firmware, "application/octet-stream")})
    assert res.status_code == 200
    sig_bytes = base64.b64decode(res.json()["signature"])
    assert len(sig_bytes) == 3293, f"Expected 3293, got {len(sig_bytes)}"
