from datetime import UTC, datetime
from enum import StrEnum
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BudgetPreference(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class PrimaryGoal(StrEnum):
    LOSE_WEIGHT = "loseWeight"
    MANAGE_GLUCOSE = "manageGlucose"
    IMPROVE_DIET = "improveDiet"
    ALL_OF_ABOVE = "allOfAbove"

# This module defines the PatientOnboarding model, which stores patient-specific onboarding data such as dietary preferences, health metrics, and goals.
# It has a one-to-one relationship with the User model, allowing us to link onboarding data to the corresponding patient user.
class PatientOnboarding(Base):
    __tablename__ = "patient_onboarding"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    ethnicity: Mapped[str | None] = mapped_column(String(50), nullable=True)
    education_level: Mapped[str | None] = mapped_column(String(100), nullable=True)
    income_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    employment_status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    smoking_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    alcohol_consumption_per_week: Mapped[float | None] = mapped_column(Float, nullable=True)
    physical_activity_minutes_per_week: Mapped[int | None] = mapped_column(Integer, nullable=True)
    diet_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    sleep_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    screen_time: Mapped[float | None] = mapped_column(Float, nullable=True)
    family_history: Mapped[list[str]] = mapped_column(JSON, default=list)
    hypertension: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    cardiovascular_history: Mapped[str | None] = mapped_column(String(120), nullable=True)
    bmi: Mapped[float | None] = mapped_column(Float, nullable=True)
    waist_to_hip_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    heart_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cholesterol_total: Mapped[float | None] = mapped_column(Float, nullable=True)
    hdl_cholesterol: Mapped[float | None] = mapped_column(Float, nullable=True)
    ldl_cholesterol: Mapped[float | None] = mapped_column(Float, nullable=True)
    triglycerides: Mapped[float | None] = mapped_column(Float, nullable=True)
    glucose: Mapped[float | None] = mapped_column(Float, nullable=True) # fasting glucose level in mg/dL
    budget_preference: Mapped[str] = mapped_column(String(20), default=BudgetPreference.MEDIUM.value)
    country: Mapped[str | None] = mapped_column(String(120), nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    bp_systolic: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bp_diastolic: Mapped[int | None] = mapped_column(Integer, nullable=True)
    prescribed_diet: Mapped[str | None] = mapped_column(String(120), nullable=True)
    primary_goal: Mapped[str] = mapped_column(String(40), default=PrimaryGoal.ALL_OF_ABOVE.value)
    target_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    baseline_risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    trajectory_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    enrollment_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    diagnosed_diabetes: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    emergency_contact_full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    emergency_contact_relationship: Mapped[str | None] = mapped_column(String(100), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cuisine_preferences: Mapped[list[str]] = mapped_column(JSON, default=list)
    dietary_restrictions: Mapped[list[str]] = mapped_column(JSON, default=list)
    prescribed_medications: Mapped[list[str]] = mapped_column(JSON, default=list)
    preferred_cuisines: Mapped[list[str]] = mapped_column(JSON, default=list)
    diet_goals: Mapped[list[str]] = mapped_column(JSON, default=list)
    calorie_target: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    user = relationship("User", back_populates="onboarding")
