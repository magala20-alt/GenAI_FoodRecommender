from pathlib import Path
import sys
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from app.main import app


client = TestClient(app)


@pytest.mark.blackbox
def test_blackbox_rejects_unauthorized_patient_list_access() -> None:
    response = client.get("/api/patients")
    assert response.status_code == 401
    payload = response.json()
    assert "detail" in payload


@pytest.mark.blackbox
def test_blackbox_login_requires_valid_schema() -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": "invalid-email-format", "password": 123},
    )
    assert response.status_code == 422
    payload = response.json()
    assert "detail" in payload
    assert isinstance(payload["detail"], list)


@pytest.mark.blackbox
def test_blackbox_duplicate_registration_returns_conflict() -> None:
    email = f"blackbox-{uuid4().hex[:10]}@example.com"
    payload = {
        "email": email,
        "password": "Patient@12345",
        "firstName": "Black",
        "lastName": "Box",
        "userType": "patient",
    }

    first = client.post("/api/auth/register", json=payload)
    assert first.status_code == 201

    duplicate = client.post("/api/auth/register", json=payload)
    assert duplicate.status_code == 409
    duplicate_payload = duplicate.json()
    assert duplicate_payload.get("detail") == "Email already exists"


@pytest.mark.blackbox
def test_blackbox_rag_rejects_invalid_k_retrieved_range() -> None:
    email = f"blackbox-rag-{uuid4().hex[:10]}@example.com"
    register = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "Patient@12345",
            "firstName": "Rag",
            "lastName": "Blackbox",
            "userType": "patient",
        },
    )
    assert register.status_code == 201

    token = register.json()["token"]
    response = client.post(
        "/api/patient-rag/recommendations",
        json={
            "query": "high protein",
            "includeExamples": True,
            "kRetrieved": 100,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422
    payload = response.json()
    assert "detail" in payload
