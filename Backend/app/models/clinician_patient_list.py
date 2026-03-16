from datetime import UTC, datetime
from enum import StrEnum
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# This module defines the ClinicianPatientList model, which represents the many-to-many relationship between clinicians and patients.
class ClinicianPatientList(Base):
    __tablename__ = "clinician_patient_list"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    clinician_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

#relationships to link clinicians and patients, 
# allowing for easy retrieval of a clinician's patient list and a patient's assigned clinician(s).
    clinician = relationship("User", foreign_keys=[clinician_id], backref="patients")
    patient = relationship("User", foreign_keys=[patient_id], backref="clinicians")