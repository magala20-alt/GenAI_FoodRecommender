from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_token, decode_token, get_password_hash, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import AuthResponse, ProfileUpdateRequest, RegisterRequest


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


def update_user_profile(db: Session, user: User, payload: ProfileUpdateRequest) -> User:
    updates = payload.model_dump(exclude_none=True, by_alias=False)
    for field_name, value in updates.items():
        setattr(user, field_name, value)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user
