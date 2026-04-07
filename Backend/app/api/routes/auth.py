from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AdminCreateClinicianRequest,
    AdminCreateClinicianResponse,
    AuthResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    ProfileUpdateRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    ResetPasswordVerifyResponse,
    RefreshTokenRequest,
    RegisterRequest,
)
from app.schemas.user import UserRead
from app.services.auth import (
    authenticate_user,
    build_auth_response,
    change_user_password,
    create_clinician_by_admin,
    create_refresh_auth_response,
    create_user,
    complete_password_reset,
    request_password_reset,
    verify_password_reset_token,
    update_user_profile,
)
from app.services.diabetes_risk import score_patient_risk_for_user_id


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> AuthResponse:
    user = authenticate_user(db, email=payload.email, password=payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    # Per-session scoring: refresh patient diabetes risk after the login response is sent.
    background_tasks.add_task(score_patient_risk_for_user_id, user.id, 0.3)

    return build_auth_response(user)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = create_user(db=db, payload=payload)
    return build_auth_response(user)


@router.post("/refresh", response_model=AuthResponse)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)) -> AuthResponse:
    return create_refresh_auth_response(db=db, refresh_token=payload.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout() -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.put("/profile", response_model=UserRead)
def update_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    return update_user_profile(db=db, user=current_user, payload=payload)


@router.post("/change-password", response_model=UserRead)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    return change_user_password(
        db=db,
        user=current_user,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> ForgotPasswordResponse:
    request_password_reset(db=db, email=payload.email)
    return ForgotPasswordResponse(detail="If the email exists, a reset link has been sent.")


@router.get("/reset-password/verify", response_model=ResetPasswordVerifyResponse)
def verify_reset_password(
    token: str,
    db: Session = Depends(get_db),
) -> ResetPasswordVerifyResponse:
    verify_password_reset_token(db=db, token=token)
    return ResetPasswordVerifyResponse(valid=True)


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> ResetPasswordResponse:
    complete_password_reset(db=db, token=payload.token, new_password=payload.new_password)
    return ResetPasswordResponse(detail="Password updated successfully.")


@router.post("/admin/clinicians", response_model=AdminCreateClinicianResponse, status_code=status.HTTP_201_CREATED)
def create_clinician_account(
    payload: AdminCreateClinicianRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> AdminCreateClinicianResponse:
    user, temporary_password = create_clinician_by_admin(db=db, payload=payload)
    return AdminCreateClinicianResponse(user=user, temporaryPassword=temporary_password)
