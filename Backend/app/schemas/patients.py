from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ClinicianPatientListItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    email: str
    age: int | None = None
    risk_level: str | None = Field(default=None, alias="riskLevel")
    adherence: float | None = None
    alerts: str | None = None


class ClinicianPatientProfile(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    email: str

    age: int | None = None
    gender: str | None = None
    risk_level: str | None = Field(default=None, alias="riskLevel")
    adherence: float | None = None
    alerts: str | None = None

    onboarded_date: datetime | None = Field(default=None, alias="onboardedDate")
    calorie_target: int | None = Field(default=None, alias="calorieTarget")
    primary_goal: str | None = Field(default=None, alias="primaryGoal")
    budget_preference: str | None = Field(default=None, alias="budgetPreference")
    country: str | None = None

    weight_kg: float | None = Field(default=None, alias="weightKg")
    height_cm: float | None = Field(default=None, alias="heightCm")
    bp_systolic: int | None = Field(default=None, alias="bpSystolic")
    bp_diastolic: int | None = Field(default=None, alias="bpDiastolic")

    heart_rate: int | None = Field(default=None, alias="heartRate")
    cholesterol_total: float | None = Field(default=None, alias="cholesterolTotal")
    hdl_cholesterol: float | None = Field(default=None, alias="hdlCholesterol")
    ldl_cholesterol: float | None = Field(default=None, alias="ldlCholesterol")
    triglycerides: float | None = None

    phone_number: str | None = Field(default=None, alias="phoneNumber")
    emergency_contact_full_name: str | None = Field(default=None, alias="emergencyContactFullName")
    emergency_contact_relationship: str | None = Field(default=None, alias="emergencyContactRelationship")
    emergency_contact_phone: str | None = Field(default=None, alias="emergencyContactPhone")

    cuisine_preferences: list[str] = Field(default_factory=list, alias="cuisinePreferences")
    dietary_restrictions: list[str] = Field(default_factory=list, alias="dietaryRestrictions")
    prescribed_medications: list[str] = Field(default_factory=list, alias="prescribedMedications")
