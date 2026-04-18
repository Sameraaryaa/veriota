import pytest
import sys
import os
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# Mock Firestore so tests don't need real Firebase credentials
_mock_db: dict = {}


def _make_mock_db():
    db = MagicMock()

    def mock_get(vehicle_id):
        doc = MagicMock()
        doc.exists = vehicle_id in _mock_db
        doc.to_dict = lambda: _mock_db.get(vehicle_id)
        return doc

    def mock_set(data):
        vehicle_id = data["vehicle_id"]
        _mock_db[vehicle_id] = data

    def mock_update(data):
        pass  # We test via the ledger state, not Firestore internals

    collection = MagicMock()
    document = MagicMock()
    document.get = lambda: mock_get(document._vehicle_id)
    collection.document = lambda vid: _make_doc_mock(vid)
    db.collection = lambda name: collection
    return db


def _make_doc_mock(vehicle_id):
    doc = MagicMock()
    doc._vehicle_id = vehicle_id

    def get():
        m = MagicMock()
        m.exists = vehicle_id in _mock_db
        m.to_dict = lambda: dict(_mock_db.get(vehicle_id, {}))
        return m

    def set(data):
        _mock_db[vehicle_id] = dict(data)
        _mock_db[vehicle_id]["vehicle_id"] = vehicle_id

    def update(data):
        if vehicle_id in _mock_db:
            for k, v in data.items():
                if hasattr(v, '_document') or str(type(v)).find('ArrayUnion') != -1:
                    pass  # skip ArrayUnion mocking
                else:
                    _mock_db[vehicle_id][k] = v

    doc.get = get
    doc.set = set
    doc.update = update
    return doc


@pytest.fixture(autouse=True)
def clear_mock_db():
    """Reset the in-memory mock DB before each test."""
    _mock_db.clear()
    yield
    _mock_db.clear()


@patch("core.firebase_client.get_db")
def test_health(mock_get_db):
    """Health endpoint must return 200 with status ok."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "VeriOTA Backend"


@patch("core.firebase_client.get_db")
def test_ledger_first_registration(mock_get_db):
    """First time a vehicle is seen — must be APPROVED and created."""
    mock_db = MagicMock()
    mock_doc = _make_doc_mock("VIN-TEST-001")
    mock_db.collection.return_value.document.return_value = mock_doc
    mock_get_db.return_value = mock_db

    res = client.post("/ledger/update", json={
        "vehicle_id": "VIN-TEST-001",
        "version": "1.0.0",
        "firmware_hash": "aabbccdd" * 8,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "APPROVED"
    assert data["vehicle_id"] == "VIN-TEST-001"
    assert data["new_version"] == "1.0.0"
    assert data["previous_version"] is None


@patch("core.firebase_client.get_db")
def test_ledger_valid_upgrade(mock_get_db):
    """Upgrading from v1.0.0 to v2.0.0 must be APPROVED."""
    _mock_db["VIN-TEST-002"] = {
        "vehicle_id": "VIN-TEST-002",
        "current_version": "1.0.0",
        "status": "QUANTUM_SAFE",
    }
    mock_db = MagicMock()
    mock_db.collection.return_value.document.return_value = _make_doc_mock("VIN-TEST-002")
    mock_get_db.return_value = mock_db

    res = client.post("/ledger/update", json={
        "vehicle_id": "VIN-TEST-002",
        "version": "2.0.0",
        "firmware_hash": "11223344" * 8,
    })
    assert res.status_code == 200
    assert res.json()["status"] == "APPROVED"


@patch("core.firebase_client.get_db")
def test_ledger_rollback_blocked(mock_get_db):
    """Attempting v1.0.0 after v2.1.4 must return 409 ROLLBACK_BLOCKED."""
    _mock_db["VIN-TEST-003"] = {
        "vehicle_id": "VIN-TEST-003",
        "current_version": "2.1.4",
        "status": "QUANTUM_SAFE",
    }
    mock_db = MagicMock()
    mock_db.collection.return_value.document.return_value = _make_doc_mock("VIN-TEST-003")
    mock_get_db.return_value = mock_db

    res = client.post("/ledger/update", json={
        "vehicle_id": "VIN-TEST-003",
        "version": "1.0.0",
        "firmware_hash": "deadbeef" * 8,
    })
    assert res.status_code == 409
    detail = res.json()["detail"]
    assert detail["status"] == "ROLLBACK_BLOCKED"
    assert detail["attempted_version"] == "1.0.0"
    assert detail["current_version"] == "2.1.4"


@patch("core.firebase_client.get_db")
def test_ledger_same_version_blocked(mock_get_db):
    """Repeating the same version (v2.1.4 → v2.1.4) must return 409 ROLLBACK_BLOCKED."""
    _mock_db["VIN-TEST-004"] = {
        "vehicle_id": "VIN-TEST-004",
        "current_version": "2.1.4",
        "status": "QUANTUM_SAFE",
    }
    mock_db = MagicMock()
    mock_db.collection.return_value.document.return_value = _make_doc_mock("VIN-TEST-004")
    mock_get_db.return_value = mock_db

    res = client.post("/ledger/update", json={
        "vehicle_id": "VIN-TEST-004",
        "version": "2.1.4",
        "firmware_hash": "aabbccdd" * 8,
    })
    assert res.status_code == 409
    assert res.json()["detail"]["status"] == "ROLLBACK_BLOCKED"


def test_ledger_invalid_semver():
    """Invalid semver format must return 400."""
    with patch("core.firebase_client.get_db") as mock_get_db:
        _mock_db["VIN-TEST-005"] = {
            "vehicle_id": "VIN-TEST-005",
            "current_version": "not-a-semver",
            "status": "QUANTUM_SAFE",
        }
        mock_db = MagicMock()
        mock_db.collection.return_value.document.return_value = _make_doc_mock("VIN-TEST-005")
        mock_get_db.return_value = mock_db

        res = client.post("/ledger/update", json={
            "vehicle_id": "VIN-TEST-005",
            "version": "invalid",
            "firmware_hash": "abc",
        })
        assert res.status_code == 400
