from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.patient_onboarding import PatientOnboarding
from app.models.user import User
from app.schemas.onboarding import OnboardingCompletionRequest


def complete_patient_onboarding(db: Session, user: User, payload: OnboardingCompletionRequest) -> User:
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")

    onboarding = db.scalar(select(PatientOnboarding).where(PatientOnboarding.user_id == user.id))
    if onboarding is None:
        onboarding = PatientOnboarding(user_id=user.id)

    onboarding.budget_preference = payload.budget_preference
    onboarding.country = payload.country
    onboarding.weight_kg = payload.weight
    onboarding.height_cm = payload.height
    onboarding.bp_systolic = payload.bp_systolic
    onboarding.bp_diastolic = payload.bp_diastolic
    onboarding.primary_goal = payload.primary_goal
    onboarding.target_weight_kg = payload.target_weight
    onboarding.cuisine_preferences = payload.cuisine_preferences
    onboarding.dietary_restrictions = payload.dietary_restrictions
    onboarding.prescribed_medications = payload.prescribed_medications
    onboarding.preferred_cuisines = payload.preferred_cuisines
    onboarding.diet_goals = payload.diet_goals
    onboarding.calorie_target = payload.calorie_target
    onboarding.completed_at = datetime.now(UTC)

    user.password_hash = get_password_hash(payload.new_password)

    db.add(onboarding)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
