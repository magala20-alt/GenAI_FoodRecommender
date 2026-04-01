from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_token, decode_token, get_password_hash, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import AdminCreateClinicianRequest, AuthResponse, ProfileUpdateRequest, RegisterRequest


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def build_auth_response(user: User) -> AuthResponse:
    return AuthResponse(
        token=create_token(
            subject=user.id,
            token_type="access",
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
        ),
        refreshToken=create_token(
            subject=user.id,
            token_type="refresh",
            expires_delta=timedelta(days=settings.refresh_token_expire_days),
        ),
        user=user,
    )


def create_refresh_auth_response(db: Session, refresh_token: str) -> AuthResponse:
    payload = decode_token(refresh_token, expected_type="refresh")
    user_id = payload.get("sub")
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    return build_auth_response(user)


def create_user(db: Session, payload: RegisterRequest) -> User:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    role = UserRole.PATIENT if payload.user_type == "patient" else UserRole.CLINICIAN
    user = User(
        email=payload.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=role,
        password_hash=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_clinician_by_admin(db: Session, payload: AdminCreateClinicianRequest) -> tuple[User, str]:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    temporary_password = payload.temporary_password or settings.clinician_default_password
    user = User(
        email=payload.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=UserRole.CLINICIAN,
        password_hash=get_password_hash(temporary_password),
        must_change_password=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, temporary_password


def update_user_profile(db: Session, user: User, payload: ProfileUpdateRequest) -> User:
    updates = payload.model_dump(exclude_none=True, by_alias=False)
    for field_name, value in updates.items():
        setattr(user, field_name, value)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def change_user_password(db: Session, user: User, current_password: str, new_password: str) -> User:
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    user.password_hash = get_password_hash(new_password)
    user.must_change_password = False
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
