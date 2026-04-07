from typing import Any

from pydantic import ConfigDict
from pydantic import BaseModel, Field


class PatientMealRecommendationRequest(BaseModel):
    query: str = Field(min_length=2)
    k_retrieved: int = Field(default=5, ge=1, le=20, alias="kRetrieved")
    include_examples: bool = Field(default=True, alias="includeExamples")


class PatientMealRecommendationResponse(BaseModel):
    response: str
    retrieved_meals: list[dict[str, Any]] = Field(alias="retrievedMeals")
    sources: list[str]
    num_meals_retrieved: int = Field(alias="numMealsRetrieved")


class MealsImportRequest(BaseModel):
    csv_path: str = Field(default="datasets/recipes_processed.csv", alias="csvPath")
    limit: int | None = Field(default=None, ge=1)


class MealsImportResponse(BaseModel):
    processed: int
    created: int
    updated: int


class MealPlanMeal(BaseModel):
    id: str
    type: str
    name: str
    cuisine: str
    calories: int
    carbs: float
    protein: float
    fat: float
    instructions: list[str]
    budget: str
    nutrition_score: int = Field(alias="nutritionScore")


class PatientMealPlanResponse(BaseModel):
    id: str
    date: str
    meals: list[MealPlanMeal]
    patient_id: str = Field(alias="patientId")
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")


class EmbeddingGenerateResponse(BaseModel):
    generated: int


class MealSnapshotExtractRequest(BaseModel):
    input_mode: str = Field(default="photo", alias="inputMode")
    image_data_url: str | None = Field(default=None, alias="imageDataUrl")
    transcript: str | None = None
    meal_description: str | None = Field(default=None, alias="mealDescription")
    meal_type: str | None = Field(default=None, alias="mealType")


class MealSnapshotExtractResponse(BaseModel):
    meal_name: str = Field(alias="mealName")
    estimated_calories: int = Field(alias="estimatedCalories")
    confidence: float
    reasoning: str
    tags: list[str] = []
    suggested_meal_type: str | None = Field(default=None, alias="suggestedMealType")


class PatientMealLogCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    meal_name: str = Field(min_length=2, validation_alias="mealName")
    calories: int = Field(ge=0)
    meal_type: str | None = Field(default=None, validation_alias="mealType")
    source: str | None = None
    confidence: float | None = None
    notes: str | None = None
    consumed_at: str | None = Field(default=None, validation_alias="consumedAt")


class PatientMealLogItem(BaseModel):
    id: str
    model_config = ConfigDict(populate_by_name=True)

    meal_name: str = Field(serialization_alias="mealName")
    calories: int
    meal_type: str | None = Field(default=None, serialization_alias="mealType")
    source: str | None = None
    confidence: float | None = None
    notes: str | None = None
    consumed_at: str = Field(serialization_alias="consumedAt")


class PatientMealLogCreateResponse(BaseModel):
    status: str
    item: PatientMealLogItem


class PatientMealLogHistoryResponse(BaseModel):
    items: list[PatientMealLogItem]


class PatientVitalsLogCreateRequest(BaseModel):
    glucose: float | None = None
    bmi: float | None = None
    systolic_bp: float | None = Field(default=None, alias="systolicBp")
    diastolic_bp: float | None = Field(default=None, alias="diastolicBp")
    heart_rate: float | None = Field(default=None, alias="heartRate")
    timestamp: str | None = None


class PatientVitalsLogItem(BaseModel):
    id: str
    timestamp: str
    glucose: float | None = None
    bmi: float | None = None
    systolic_bp: float | None = Field(default=None, alias="systolicBp")
    diastolic_bp: float | None = Field(default=None, alias="diastolicBp")
    heart_rate: float | None = Field(default=None, alias="heartRate")


class PatientVitalsLogCreateResponse(BaseModel):
    status: str
    item: PatientVitalsLogItem


class PatientVitalsLogHistoryResponse(BaseModel):
    items: list[PatientVitalsLogItem]


class ClinicianPatientFilterRequest(BaseModel):
    query: str = Field(min_length=2)


class ClinicianPatientFilterMatch(BaseModel):
    id: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    email: str
    risk_level: str | None = Field(default=None, alias="riskLevel")
    adherence: float | None = None
    alerts_count: int = Field(default=0, alias="alertsCount")


class ClinicianPatientFilterResponse(BaseModel):
    query: str
    filters_applied: list[str] = Field(alias="filtersApplied")
    reasoning: str
    matching_patient_ids: list[str] = Field(alias="matchingPatientIds")
    matched_patients: list[ClinicianPatientFilterMatch] = Field(alias="matchedPatients")
    patients_searched: int = Field(alias="patientsSearched")
