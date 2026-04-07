from datetime import UTC, datetime
from enum import StrEnum
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# This module defines the MealHistory model, which tracks the meals consumed by users. 
# It includes fields for the user ID, meal ID, nutritional information, user rating, and timestamps for when the meal was consumed and when the record was created/updated. 
# The MealHistory model has a many-to-one relationship with the User model and a many-to-one relationship with the Meals model.
class MealHistory(Base):
    __tablename__ = "meal_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    meal_id: Mapped[str] = mapped_column(String(36), ForeignKey("meals.id", ondelete="SET NULL"), nullable=True)
    meal_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    calories: Mapped[int | None] = mapped_column(Integer, nullable=True)
    protein_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    carbs_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    fat_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)  # User rating for the meal (1-5)
    consumed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    user = relationship("User", back_populates="meal_history")
    meal = relationship("Meals")