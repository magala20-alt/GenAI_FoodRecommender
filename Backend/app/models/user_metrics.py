from datetime import UTC, datetime
from enum import StrEnum
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# this table helps detect failure risk and provides insights for improving user engagement and health outcomes.
class UserMetrics(Base):
    __tablename__ = "user_metrics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    total_meals_logged: Mapped[int] = mapped_column(Integer, default=0)
    avg_calories: Mapped[int] = mapped_column(Integer, default=0)
    skipped_meals: Mapped[int] = mapped_column(Integer, default=0)
    average_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    streak: Mapped[int] = mapped_column(Integer, default=0)  # Consecutive days of meal logging
    adherence: Mapped[float | None] = mapped_column(Float, nullable=True)  # Percentage of days with meal logs vs. total days since onboarding
    last_logged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="user_metrics")
