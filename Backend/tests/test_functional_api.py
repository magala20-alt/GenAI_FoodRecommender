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


def _register_patient() -> str:
    email = f"functional-{uuid4().hex[:10]}@example.com"
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "Patient@12345",
            "firstName": "Functional",
            "lastName": "Tester",
            "userType": "patient",
        },
    )
    assert response.status_code == 201
    payload = response.json()
    token = payload.get("token")
    assert token
    return token


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.functional
def test_functional_auth_profile_update_roundtrip() -> None:
    token = _register_patient()

    me_response = client.get("/api/auth/me", headers=_auth_headers(token))
    assert me_response.status_code == 200
    me_payload = me_response.json()
    assert me_payload["role"] == "patient"

    updated_first_name = f"Fn{uuid4().hex[:6]}"
    update_response = client.put(
        "/api/auth/profile",
        json={"firstName": updated_first_name},
        headers=_auth_headers(token),
    )
    assert update_response.status_code == 200
    update_payload = update_response.json()
    assert update_payload["firstName"] == updated_first_name


@pytest.mark.functional
def test_functional_patient_meal_and_vitals_log_flow() -> None:
    token = _register_patient()

    meal_log_response = client.post(
        "/api/patient-rag/meal-log",
        json={
            "mealName": "Grilled chicken salad",
            "calories": 420,
            "mealType": "lunch",
            "source": "manual",
        },
        headers=_auth_headers(token),
    )
    assert meal_log_response.status_code == 200
    meal_payload = meal_log_response.json()
    assert meal_payload["status"] == "saved"
    assert meal_payload["item"]["mealName"] == "Grilled chicken salad"

    meal_history_response = client.get(
        "/api/patient-rag/meal-log/history",
        headers=_auth_headers(token),
    )
    assert meal_history_response.status_code == 200
    meal_history_payload = meal_history_response.json()
    assert isinstance(meal_history_payload["items"], list)
    assert any(item["mealName"] == "Grilled chicken salad" for item in meal_history_payload["items"])

    vitals_response = client.post(
        "/api/patient-rag/vitals-log",
        json={
            "glucose": 108,
            "bmi": 24.5,
            "systolicBp": 120,
            "diastolicBp": 78,
            "heartRate": 72,
        },
        headers=_auth_headers(token),
    )
    assert vitals_response.status_code == 200
    vitals_payload = vitals_response.json()
    assert vitals_payload["status"] == "saved"
    assert vitals_payload["item"]["glucose"] == 108

    vitals_history_response = client.get(
        "/api/patient-rag/vitals-log/history",
        headers=_auth_headers(token),
    )
    assert vitals_history_response.status_code == 200
    vitals_history_payload = vitals_history_response.json()
    assert isinstance(vitals_history_payload["items"], list)
    assert any(item.get("glucose") == 108 for item in vitals_history_payload["items"])
