from sqlalchemy import select

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.patient_onboarding import PatientOnboarding
from app.models.patient_alert import PatientAlert
from app.models.user import User, UserRole

# This module contains functions to initialize the database and seed it with default auth data.
def bootstrap_database() -> None:
    Base.metadata.create_all(bind=engine) # Create database tables based on SQLAlchemy models

    if not settings.bootstrap_demo_data:
        return

    with SessionLocal() as db:
        seed_admin_account(db)


def seed_admin_account(db) -> None:
    # Remove old hard-coded demo users so admin auth is the single default entry point.
    for legacy_email in ("clinician@example.com", "patient@example.com", "admin@caresync.local"):
        legacy_user = db.scalar(select(User).where(User.email == legacy_email))
        if legacy_user:
            # Delete linked onboarding rows first to avoid ORM setting FK to NULL on flush.
            db.query(PatientOnboarding).filter(PatientOnboarding.user_id == legacy_user.id).delete(
                synchronize_session=False
            )
            db.delete(legacy_user)

    admin = db.scalar(select(User).where(User.email == settings.admin_email))
    if not admin:
        admin = User(
            email=settings.admin_email,
            first_name=settings.admin_first_name,
            last_name=settings.admin_last_name,
            role=UserRole.ADMIN,
            specialty="System Administration",
            license_number="ADMIN-ROOT",
            hospital_id="caresync-core",
            password_hash=get_password_hash(settings.admin_password),
        )
        db.add(admin)
    else:
        # Keep admin profile aligned with configured credentials on each bootstrap.
        admin.first_name = settings.admin_first_name
        admin.last_name = settings.admin_last_name
        admin.role = UserRole.ADMIN
        admin.specialty = "System Administration"
        admin.license_number = "ADMIN-ROOT"
        admin.hospital_id = "caresync-core"
        admin.password_hash = get_password_hash(settings.admin_password)

    # Clean up orphan onboarding rows if demo patient was removed from an existing database.
    db.query(PatientOnboarding).filter(~PatientOnboarding.user_id.in_(db.query(User.id))).delete(synchronize_session=False)

    db.commit()
