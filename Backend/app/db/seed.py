from sqlalchemy import select

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.patient_onboarding import PatientOnboarding
from app.models.user import User, UserRole

# This module contains functions to initialize the database and seed it with demo data.
def bootstrap_database() -> None:
    Base.metadata.create_all(bind=engine) # Create database tables based on SQLAlchemy models

    if not settings.bootstrap_demo_data:
        return

    with SessionLocal() as db:
        seed_demo_users(db)


# Seed the database with demo users (one clinician and one patient) if they don't already exist.
def seed_demo_users(db) -> None:
    clinician = db.scalar(select(User).where(User.email == "clinician@example.com"))
    if not clinician:
        clinician = User(
            email="clinician@example.com",
            first_name="Sarah",
            last_name="Johnson",
            role=UserRole.CLINICIAN,
            specialty="Endocrinology",
            license_number="MD123456",
            hospital_id="hospital-1",
            password_hash=get_password_hash("password"),
        )
        db.add(clinician)

    patient = db.scalar(select(User).where(User.email == "patient@example.com"))
    if not patient:
        patient = User(
            email="patient@example.com",
            first_name="Ama",
            last_name="Mensah",
            role=UserRole.PATIENT,
            password_hash=get_password_hash("password"),
        )
        db.add(patient)
        db.flush()

        db.add(
            PatientOnboarding(
                user_id=patient.id,
                budget_preference="medium",
                country="Ghana",
                cuisine_preferences=[],
            )
        )

    db.commit()
