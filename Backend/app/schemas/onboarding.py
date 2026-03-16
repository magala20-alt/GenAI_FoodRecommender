from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OnboardingCompletionRequest(BaseModel):
    new_password: str = Field(alias="newPassword")
    confirm_password: str = Field(alias="confirmPassword")
    budget_preference: str = Field(alias="budgetPreference")
    country: str
    weight: float
    height: float
    bp_systolic: int = Field(alias="bpSystolic")
    bp_diastolic: int = Field(alias="bpDiastolic")
    primary_goal: str = Field(alias="primaryGoal")
    target_weight: float | None = Field(default=None, alias="targetWeight")
    cuisine_preferences: list[str] = Field(default_factory=list, alias="cuisinePreferences")
    dietary_restrictions: list[str] = Field(default_factory=list, alias="dietaryRestrictions")
    prescribed_medications: list[str] = Field(default_factory=list, alias="prescribedMedications")
    preferred_cuisines: list[str] = Field(default_factory=list, alias="preferredCuisines")
    diet_goals: list[str] = Field(default_factory=list, alias="dietGoals")
    calorie_target: int | None = Field(default=None, alias="calorieTarget")

    model_config = ConfigDict(populate_by_name=True)


class OnboardingStatusResponse(BaseModel):
    onboarding_completed: bool = Field(alias="onboardingCompleted")

    model_config = ConfigDict(populate_by_name=True)


class PatientOnboardingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    user_id: str = Field(alias="userId")
    budget_preference: str = Field(alias="budgetPreference")
    country: str | None = None
    weight_kg: float | None = Field(default=None, alias="weightKg")
    height_cm: float | None = Field(default=None, alias="heightCm")
    bp_systolic: int | None = Field(default=None, alias="bpSystolic")
    bp_diastolic: int | None = Field(default=None, alias="bpDiastolic")
    prescribed_diet: str | None = Field(default=None, alias="prescribedDiet")
    primary_goal: str = Field(alias="primaryGoal")
    target_weight_kg: float | None = Field(default=None, alias="targetWeightKg")
    cuisine_preferences: list[str] = Field(default_factory=list, alias="cuisinePreferences")
    dietary_restrictions: list[str] = Field(default_factory=list, alias="dietaryRestrictions")
    prescribed_medications: list[str] = Field(default_factory=list, alias="prescribedMedications")
    preferred_cuisines: list[str] = Field(default_factory=list, alias="preferredCuisines")
    diet_goals: list[str] = Field(default_factory=list, alias="dietGoals")
    calorie_target: int | None = Field(default=None, alias="calorieTarget")
    completed_at: datetime | None = Field(default=None, alias="completedAt")
    updated_at: datetime = Field(alias="updatedAt")
