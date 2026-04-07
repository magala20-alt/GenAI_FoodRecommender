from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_patient
from app.db.session import get_db
from app.models.patient_onboarding import PatientOnboarding
from app.models.user import User
from app.schemas.onboarding import (
    OnboardingCompletionRequest,
    OnboardingStatusResponse,
    PatientOnboardingRead,
    PatientOnboardingUpdateRequest,
)
from app.schemas.user import UserRead
from app.services.onboarding import complete_patient_onboarding


router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.get("/me", response_model=OnboardingStatusResponse)
def get_onboarding_status(current_user: User = Depends(get_current_patient)) -> OnboardingStatusResponse:
    return OnboardingStatusResponse(
        onboarding_completed=current_user.onboarding_completed,
        completed_at=current_user.onboarding.completed_at if current_user.onboarding else None,
    )


@router.get("/me/details", response_model=PatientOnboardingRead)
def get_onboarding_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient),
) -> PatientOnboardingRead:
    onboarding = db.scalar(select(PatientOnboarding).where(PatientOnboarding.user_id == current_user.id))
    if onboarding is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Onboarding data not found")
    return onboarding


@router.put("/me/details", response_model=PatientOnboardingRead)
def update_onboarding_details(
    payload: PatientOnboardingUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient),
) -> PatientOnboardingRead:
    onboarding = db.scalar(select(PatientOnboarding).where(PatientOnboarding.user_id == current_user.id))
    if onboarding is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Onboarding data not found")

    updates = payload.model_dump(exclude_unset=True, by_alias=False)

    daily_step_goal = updates.pop("daily_step_goal", None)
    if daily_step_goal is not None:
        diet_goals = list(onboarding.diet_goals or [])
        prefix = "daily_steps:"
        diet_goals = [item for item in diet_goals if not str(item).startswith(prefix)]
        diet_goals.append(f"{prefix}{int(daily_step_goal)}")
        onboarding.diet_goals = diet_goals

    for field_name, value in updates.items():
        setattr(onboarding, field_name, value)

    db.add(onboarding)
    db.commit()
    db.refresh(onboarding)
    return onboarding


@router.post("/complete", response_model=UserRead)
def complete_onboarding(
    payload: OnboardingCompletionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient),
) -> User:
    return complete_patient_onboarding(db=db, user=current_user, payload=payload)
