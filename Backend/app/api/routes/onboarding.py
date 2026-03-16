from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_patient
from app.db.session import get_db
from app.models.user import User
from app.schemas.onboarding import OnboardingCompletionRequest, OnboardingStatusResponse
from app.schemas.user import UserRead
from app.services.onboarding import complete_patient_onboarding


router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.get("/me", response_model=OnboardingStatusResponse)
def get_onboarding_status(current_user: User = Depends(get_current_patient)) -> OnboardingStatusResponse:
    return OnboardingStatusResponse(onboarding_completed=current_user.onboarding_completed)


@router.post("/complete", response_model=UserRead)
def complete_onboarding(
    payload: OnboardingCompletionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient),
) -> User:
    return complete_patient_onboarding(db=db, user=current_user, payload=payload)
