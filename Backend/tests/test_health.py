from pathlib import Path
import sys
from uuid import uuid4

from fastapi.testclient import TestClient

# Ensure Backend root is importable when pytest is run from different working directories.
ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.main import app

# This are unit tests for backend API endpoints
client = TestClient(app)

# This test verifies that the health check endpoint is functioning correctly.
def test_health_check() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_patient() -> None:
    login_response = client.post(
        "/api/auth/login",
        json={"email": "admin@caresync.com", "password": "Admin@12345"},
    )

    assert login_response.status_code == 200
    payload = login_response.json()
    access_token = payload.get("token") or payload.get("accessToken")
    assert access_token is not None

    response = client.get("/api/patients", headers={"Authorization": f"Bearer {access_token}"})

    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_rag() ->None:
    email = f"patient-rag-{uuid4().hex[:10]}@example.com"
    register_response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "Patient@12345",
            "firstName": "Rag",
            "lastName": "Patient",
            "userType": "patient",
        },
    )

    assert register_response.status_code == 201
    payload = register_response.json()
    access_token = payload.get("token") or payload.get("accessToken")
    assert access_token is not None
    
    response = client.post("/api/patient-rag/recommendations", json={
        "query": "low carb high protein dinner",
        "includeExamples": True,
        "kRetrieved": 5
    }, headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    json_response = response.json()
    assert "response" in json_response
    assert "retrievedMeals" in json_response
    assert "numMealsRetrieved" in json_response

if __name__ == "__main__":
    import pytest

    raise SystemExit(pytest.main([__file__, "-v"]))