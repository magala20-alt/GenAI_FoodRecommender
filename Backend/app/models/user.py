from datetime import UTC, datetime
from enum import StrEnum
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(StrEnum):
    PATIENT = "patient"
    CLINICIAN = "clinician"
    ADMIN = "admin"

# This module defines the User model, which represents both patients and clinicians in the system. 
# It includes fields for authentication, role-based access control, and onboarding status. 
# The User model has a one-to-one relationship with the PatientOnboarding model for storing patient-specific onboarding data.
class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"))
    specialty: Mapped[str | None] = mapped_column(String(120), nullable=True)
    license_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    hospital_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    onboarding = relationship("PatientOnboarding", back_populates="user", uselist=False)
    meal_history = relationship("MealHistory", back_populates="user")
    user_metrics = relationship("UserMetrics", back_populates="user")
    cuisine_scores = relationship("CuisineScore", back_populates="user")

    @property
    def onboarding_completed(self) -> bool:
        """Clinicians and admins are always considered onboarded; patients are onboarded when completed_at is set."""
        if self.role != UserRole.PATIENT:
            return True
        return self.onboarding is not None and self.onboarding.completed_at is not None
