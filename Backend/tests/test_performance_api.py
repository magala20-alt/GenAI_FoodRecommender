from pathlib import Path
import statistics
import sys
import time
from uuid import uuid4
import os

import pytest
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from app.main import app


client = TestClient(app)


def _register_patient_token() -> str:
    email = f"perf-{uuid4().hex[:10]}@example.com"
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "Patient@12345",
            "firstName": "Perf",
            "lastName": "Tester",
            "userType": "patient",
        },
    )
    assert response.status_code == 201
    return response.json()["token"]


def _elapsed_ms(func) -> float:
    start = time.perf_counter()
    func()
    return (time.perf_counter() - start) * 1000

# average latency of health endpoint should be under 250ms
@pytest.mark.performance
def test_performance_health_endpoint_average_latency() -> None:
    iterations = 20
    avg_limit_ms = float(os.getenv("HEALTH_AVG_MAX_MS", "250"))

    # Warm-up call to avoid startup skew in measured samples.
    warmup = client.get("/api/health")
    assert warmup.status_code == 200

    samples = []
    for _ in range(iterations):
        duration_ms = _elapsed_ms(lambda: client.get("/api/health"))
        samples.append(duration_ms)

    average_ms = statistics.mean(samples)
    assert average_ms <= avg_limit_ms, (
        f"Health endpoint average latency {average_ms:.2f}ms exceeded {avg_limit_ms:.2f}ms"
    )

# test for chat suggestions endpoint - p95 latency should be under 1200ms
@pytest.mark.performance
def test_performance_chat_suggestions_p95_latency() -> None:
    iterations = 15
    p95_limit_ms = float(os.getenv("CHAT_SUGGESTIONS_P95_MAX_MS", "1200"))
    token = _register_patient_token()

    headers = {"Authorization": f"Bearer {token}"}

    # Warm-up call to reduce first-request effects.
    warmup = client.get("/api/patient-rag/chat/suggestions", headers=headers)
    assert warmup.status_code == 200

    samples = []
    for _ in range(iterations):
        start = time.perf_counter()
        response = client.get("/api/patient-rag/chat/suggestions", headers=headers)
        elapsed_ms = (time.perf_counter() - start) * 1000
        assert response.status_code == 200
        samples.append(elapsed_ms)

    samples_sorted = sorted(samples)
    index = max(0, int(0.95 * len(samples_sorted)) - 1)
    p95_ms = samples_sorted[index]
    assert p95_ms <= p95_limit_ms, (
        f"Chat suggestions p95 latency {p95_ms:.2f}ms exceeded {p95_limit_ms:.2f}ms"
    )
