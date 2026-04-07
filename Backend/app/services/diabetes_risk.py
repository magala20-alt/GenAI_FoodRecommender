from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any
import logging
import pickle

import numpy as np
import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.patient_onboarding import PatientOnboarding
from app.models.user import User, UserRole
from app.models.userHealth_metrics import UserHealthReadings
from app.db.session import SessionLocal
from app.services.alerts import ensure_high_risk_alert


logger = logging.getLogger(__name__)


MODEL_FEATURES = [
    "age",
    "bmi",
    "systolic_bp",
    "diastolic_bp",
    "hdl_cholesterol",
    "triglycerides",
    "cholesterol_total",
    "ldl_cholesterol",
    "physical_activity_minutes_per_week",
    "sleep_hours_per_day",
    "screen_time_hours_per_day",
    "smoking_status",
    "alcohol_consumption_per_week",
    "hypertension_history",
    "cardiovascular_history",
    "family_history_diabetes",
]

RENAME_MAP = {
    "smoking_status": "smoking",
    "alcohol_consumption_per_week": "alcohol_week",
    "physical_activity_minutes_per_week": "activity_minutes_week",
    "sleep_hours_per_day": "sleep_hours",
    "screen_time_hours_per_day": "sedentary_hours",
    "hypertension_history": "hypertension",
    "cardiovascular_history": "cardio",
    "hdl_cholesterol": "hdl",
}

_BINARY_TRUE = {"yes", "y", "true", "t", "1", "2", "positive", "present"}
_BINARY_FALSE = {"no", "n", "false", "f", "0", "negative", "absent"}


def _normalize_binary_value(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (bool, np.bool_)):
        return float(int(value))
    if isinstance(value, (int, np.integer, float, np.floating)):
        if pd.isna(value):
            return None
        if value in (1, 2):
            return 1.0
        if value == 0:
            return 0.0
        return float(value)

    text = str(value).strip().lower()
    if text in _BINARY_TRUE:
        return 1.0
    if text in _BINARY_FALSE:
        return 0.0
    return None


def prepare_model_input(df: pd.DataFrame, scaler: Any) -> np.ndarray:
    """
    Prepare user health records into model-ready, scaled feature matrix.

    The function is robust to missing source columns and mixed binary encodings.
    """
    if df.empty:
        raise ValueError("Input dataframe is empty")

    prepared = df.copy()

    # Ensure all required source features exist before selection.
    for col in MODEL_FEATURES:
        if col not in prepared.columns:
            prepared[col] = np.nan

    prepared = prepared[MODEL_FEATURES].rename(columns=RENAME_MAP)

    binary_columns = ["smoking", "hypertension", "cardio", "family_history_diabetes"]
    for col in binary_columns:
        if col in prepared.columns:
            prepared[col] = prepared[col].apply(_normalize_binary_value)

    # Add missing indicators before filling values.
    for col in list(prepared.columns):
        prepared[f"{col}_missing"] = prepared[col].isna().astype(int)

    for col in prepared.columns:
        prepared[col] = pd.to_numeric(prepared[col], errors="coerce")
        median_value = prepared[col].median(skipna=True)
        if pd.isna(median_value):
            median_value = 0.0
        prepared[col] = prepared[col].fillna(median_value)

    if "glucose" in df.columns:
        prepared["bmi_glucose"] = prepared["bmi"] * pd.to_numeric(df["glucose"], errors="coerce").fillna(0.0)

    hdl_non_zero = prepared["hdl"].replace(0, np.nan)
    prepared["lipid_ratio"] = (prepared["triglycerides"] / hdl_non_zero).replace([np.inf, -np.inf], np.nan).fillna(0.0)
    prepared["bp_mean"] = (prepared["systolic_bp"] + prepared["diastolic_bp"]) / 2.0
    prepared["lifestyle_risk"] = prepared["sedentary_hours"] - (prepared["activity_minutes_week"] / 60.0)

    if scaler is None or not hasattr(scaler, "transform"):
        raise ValueError("A fitted scaler with a transform() method is required")

    scaled_matrix = scaler.transform(prepared)
    return np.asarray(scaled_matrix)


def _artifact_path(filename: str) -> Path:
    backend_dir = Path(__file__).resolve().parents[2]
    return backend_dir / "model" / filename


@lru_cache(maxsize=1)
def load_diabetes_model() -> Any:
    model_path = _artifact_path("random_forest_model.pkl")
    if not model_path.exists():
        raise FileNotFoundError(f"Model artifact not found at {model_path}")
    with model_path.open("rb") as f:
        return pickle.load(f)


@lru_cache(maxsize=1)
def load_diabetes_scaler() -> Any:
    scaler_path = _artifact_path("scaler.pkl")
    if not scaler_path.exists():
        raise FileNotFoundError(f"Scaler artifact not found at {scaler_path}")
    with scaler_path.open("rb") as f:
        return pickle.load(f)


def _patient_feature_frame(onboarding: PatientOnboarding, latest: UserHealthReadings | None) -> pd.DataFrame:
    family_history = onboarding.family_history or []
    family_history_diabetes = 1 if any("diabet" in str(item).lower() for item in family_history) else 0

    row = {
        "age": onboarding.age,
        "gender": onboarding.gender,
        "ethnicity": onboarding.ethnicity,
        "education_level": onboarding.education_level,
        "income_level": onboarding.income_level,
        "employment_status": onboarding.employment_status,
        "smoking_status": onboarding.smoking_status,
        "alcohol_consumption_per_week": onboarding.alcohol_consumption_per_week,
        "physical_activity_minutes_per_week": onboarding.physical_activity_minutes_per_week,
        "diet_score": onboarding.diet_score,
        "sleep_hours_per_day": onboarding.sleep_hours,
        "screen_time_hours_per_day": onboarding.screen_time,
        "family_history_diabetes": family_history_diabetes,
        "hypertension_history": onboarding.hypertension,
        "cardiovascular_history": onboarding.cardiovascular_history,
        "bmi": (latest.bmi if latest and latest.bmi is not None else onboarding.bmi),
        "waist_to_hip_ratio": onboarding.waist_to_hip_ratio,
        "systolic_bp": (latest.systolic_bp if latest and latest.systolic_bp is not None else onboarding.bp_systolic),
        "diastolic_bp": (latest.diastolic_bp if latest and latest.diastolic_bp is not None else onboarding.bp_diastolic),
        "heart_rate": (latest.heart_rate if latest and latest.heart_rate is not None else onboarding.heart_rate),
        "cholesterol_total": (
            latest.cholesterol_total if latest and latest.cholesterol_total is not None else onboarding.cholesterol_total
        ),
        "hdl_cholesterol": (
            latest.hdl_cholesterol if latest and latest.hdl_cholesterol is not None else onboarding.hdl_cholesterol
        ),
        "ldl_cholesterol": (
            latest.ldl_cholesterol if latest and latest.ldl_cholesterol is not None else onboarding.ldl_cholesterol
        ),
        "triglycerides": (
            latest.triglycerides if latest and latest.triglycerides is not None else onboarding.triglycerides
        ),
        "glucose": (latest.glucose if latest and latest.glucose is not None else onboarding.glucose),
    }

    return pd.DataFrame([row])


def score_patient_risk_on_login(db: Session, user: User, threshold: float = 0.3) -> float | None:
    """
    Compute and persist diabetes risk for a patient at login time.

    Returns the risk probability when scoring succeeds; otherwise returns None.
    """
    if user.role != UserRole.PATIENT:
        return None

    onboarding = db.scalar(select(PatientOnboarding).where(PatientOnboarding.user_id == user.id))
    if onboarding is None:
        return None

    latest = db.scalar(
        select(UserHealthReadings)
        .where(UserHealthReadings.user_id == user.id)
        .order_by(UserHealthReadings.timestamp.desc())
        .limit(1)
    )

    try:
        model = load_diabetes_model()
        scaler = load_diabetes_scaler()
        features = _patient_feature_frame(onboarding, latest)
        model_input = prepare_model_input(features, scaler)

        if hasattr(model, "predict_proba"):
            risk_score = float(model.predict_proba(model_input)[0][1])
        elif hasattr(model, "predict"):
            risk_score = float(model.predict(model_input)[0])
        else:
            logger.warning("Loaded model does not expose predict_proba/predict methods")
            return None

        onboarding.baseline_risk_score = risk_score
        onboarding.diagnosed_diabetes = risk_score >= threshold
        onboarding.trajectory_type = "highRisk" if risk_score >= threshold else "lowRisk"

        db.add(onboarding)
        db.commit()

        # Ensure alerting stays in sync with newly computed high risk.
        ensure_high_risk_alert(db=db, patient_id=user.id)
        return risk_score
    except Exception as exc:  # noqa: BLE001 - scoring should never break login
        logger.warning("Diabetes risk scoring skipped for user %s: %s", user.id, exc)
        db.rollback()
        return None


def score_patient_risk_for_user_id(user_id: str, threshold: float = 0.3) -> float | None:
    """
    Background-task wrapper that opens its own database session.

    This keeps login fast while still updating patient risk after a successful sign-in.
    """
    db = SessionLocal()
    try:
        user = db.get(User, user_id)
        if user is None:
            return None
        return score_patient_risk_on_login(db=db, user=user, threshold=threshold)
    finally:
        db.close()
