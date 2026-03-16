from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.user import UserRead


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(LoginRequest):
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    user_type: str = Field(default="patient", alias="userType")

    model_config = ConfigDict(populate_by_name=True)


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(alias="refreshToken")

    model_config = ConfigDict(populate_by_name=True)


class ProfileUpdateRequest(BaseModel):
    first_name: str | None = Field(default=None, alias="firstName")
    last_name: str | None = Field(default=None, alias="lastName")
    specialty: str | None = None
    license_number: str | None = Field(default=None, alias="licenseNumber")
    hospital_id: str | None = Field(default=None, alias="hospitalId")

    model_config = ConfigDict(populate_by_name=True)


class AuthResponse(BaseModel):
    token: str
    refresh_token: str = Field(alias="refreshToken")
    user: UserRead

    model_config = ConfigDict(populate_by_name=True)
