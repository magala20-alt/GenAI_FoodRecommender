import numpy as np
import pandas as pd

from app.services.diabetes_risk import prepare_model_input


class IdentityScaler:
    def __init__(self) -> None:
        self.last_input = None

    def transform(self, X):
        self.last_input = X.copy()
        return X.to_numpy(dtype=float)


def test_prepare_model_input_builds_expected_features() -> None:
    scaler = IdentityScaler()
    df = pd.DataFrame(
        [
            {
                "age": 42,
                "gender": "Female",
                "ethnicity": "Black",
                "education_level": "College",
                "income_level": "Mid",
                "employment_status": "Employed",
                "smoking_status": "Yes",
                "alcohol_consumption_per_week": 3,
                "physical_activity_minutes_per_week": 180,
                "diet_score": 7.0,
                "sleep_hours_per_day": 6.5,
                "screen_time_hours_per_day": 8.0,
                "family_history_diabetes": "No",
                "hypertension_history": 2,
                "cardiovascular_history": "No",
                "bmi": 30.1,
                "waist_to_hip_ratio": 0.9,
                "systolic_bp": 145,
                "diastolic_bp": 90,
                "heart_rate": 78,
                "cholesterol_total": 220,
                "hdl_cholesterol": 0,
                "ldl_cholesterol": 130,
                "triglycerides": 200,
                "glucose": 110,
            }
        ]
    )

    matrix = prepare_model_input(df, scaler)

    assert isinstance(matrix, np.ndarray)
    assert matrix.shape[0] == 1

    transformed = scaler.last_input
    assert transformed is not None

    assert "smoking" in transformed.columns
    assert "alcohol_week" in transformed.columns
    assert "activity_minutes_week" in transformed.columns
    assert "sleep_hours" in transformed.columns
    assert "sedentary_hours" in transformed.columns
    assert "hypertension" in transformed.columns
    assert "cardio" in transformed.columns
    assert "hdl" in transformed.columns

    assert transformed.loc[0, "smoking"] == 1
    assert transformed.loc[0, "hypertension"] == 1
    assert transformed.loc[0, "cardio"] == 0
    assert transformed.loc[0, "family_history_diabetes"] == 0

    assert transformed.loc[0, "lipid_ratio"] == 0
    assert transformed.loc[0, "bp_mean"] == (145 + 90) / 2
    assert transformed.loc[0, "lifestyle_risk"] == 8.0 - (180 / 60)
    assert transformed.loc[0, "bmi_glucose"] == 30.1 * 110


def test_prepare_model_input_adds_missing_indicators_and_fills() -> None:
    scaler = IdentityScaler()
    df = pd.DataFrame([{"age": None, "bmi": None, "systolic_bp": 120, "diastolic_bp": None}])

    matrix = prepare_model_input(df, scaler)

    assert isinstance(matrix, np.ndarray)
    transformed = scaler.last_input
    assert transformed is not None

    assert "age_missing" in transformed.columns
    assert transformed.loc[0, "age_missing"] == 1
    assert not transformed.isna().any().any()
