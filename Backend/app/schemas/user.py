from pydantic import BaseModel, ConfigDict, EmailStr, Field

# This module defines the UserRead schema, which is used to represent user data in API responses. 
# It includes fields for user information such as id, email, name, role, onboarding status, and optional fields for clinicians.
class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    email: EmailStr
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    role: str
    onboarding_completed: bool = Field(alias="onboardingCompleted")
    specialty: str | None = None
    license_number: str | None = Field(default=None, alias="licenseNumber")
    hospital_id: str | None = Field(default=None, alias="hospitalId")
