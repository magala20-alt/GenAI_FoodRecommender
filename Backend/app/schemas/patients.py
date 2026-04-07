from datetime import datetime
from typing import Annotated

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
    alerts_count: int = Field(default=0, alias="alertsCount")


class ClinicianPatientProfile(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    email: str

    age: int | None = None
    gender: str | None = None
    risk_level: str | None = Field(default=None, alias="riskLevel")
    risk_score: float | None = Field(default=None, alias="riskScore")
    adherence: float | None = None
    alerts: str | None = None
    meals_logged: int | None = Field(default=None, alias="mealsLogged")
    streak: int | None = None
    sessions_7d: int | None = Field(default=None, alias="sessions7d")
    missed_appointments: int | None = Field(default=None, alias="missedAppointments")
    alerts_count: int = Field(default=0, alias="alertsCount")

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
    bmi: float | None = None
    glucose: float | None = None
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
    daily_steps: int | None = Field(default=None, alias="dailySteps")
    target_hba1c: float | None = Field(default=None, alias="targetHba1c")


class PatientHealthReading(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    timestamp: datetime
    bmi: float | None = None
    systolic_bp: float | None = Field(default=None, alias="systolicBp")
    diastolic_bp: float | None = Field(default=None, alias="diastolicBp")
    heart_rate: float | None = Field(default=None, alias="heartRate")
    glucose: float | None = None
    cholesterol_total: float | None = Field(default=None, alias="cholesterolTotal")
    hdl_cholesterol: float | None = Field(default=None, alias="hdlCholesterol")
    ldl_cholesterol: float | None = Field(default=None, alias="ldlCholesterol")
    triglycerides: float | None = None


class CarePlanUpdateRequest(BaseModel):
    prescribed_medications: list[str] | None = Field(default=None, alias="prescribedMedications")
    dietary_restrictions: list[str] | None = Field(default=None, alias="dietaryRestrictions")
    cuisine_preferences: list[str] | None = Field(default=None, alias="cuisinePreferences")
    calorie_target: int | None = Field(default=None, alias="calorieTarget")
    target_weight_kg: float | None = Field(default=None, alias="targetWeightKg")
    daily_steps: int | None = Field(default=None, alias="dailySteps")
    target_hba1c: float | None = Field(default=None, alias="targetHba1c")

    model_config = ConfigDict(populate_by_name=True)


class InterventionMessageRequest(BaseModel):
    message: str


class InterventionMessageResponse(BaseModel):
    status: str
    detail: str


class InterventionMessageRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    patient_id: str = Field(alias="patientId")
    clinician_id: str | None = Field(default=None, alias="clinicianId")
    clinician_name: str | None = Field(default=None, alias="clinicianName")
    message: str
    created_at: datetime = Field(alias="createdAt")


class LatestInterventionMessageResponse(BaseModel):
    has_message: bool = Field(alias="hasMessage")
    message: InterventionMessageRead | None = None


class PatientAppointmentRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    patient_id: str = Field(alias="patientId")
    patient_name: str | None = Field(default=None, alias="patientName")
    scheduled_at: datetime = Field(alias="scheduledAt")
    title: str
    detail: str
    period: str
    date_label: str = Field(alias="dateLabel")
    reschedule_status: str | None = Field(default=None, alias="rescheduleStatus")
    reschedule_reason: str | None = Field(default=None, alias="rescheduleReason")
    reschedule_alert_id: str | None = Field(default=None, alias="rescheduleAlertId")


class NextAppointmentResponse(BaseModel):
    has_appointment: bool = Field(alias="hasAppointment")
    appointment: PatientAppointmentRead | None = None


class AppointmentRescheduleRequest(BaseModel):
    reason: str


class AppointmentRescheduleResponse(BaseModel):
    status: str
    detail: str
    appointment: PatientAppointmentRead | None = None


class PatientMealLogItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    meal_name: str | None = Field(default=None, alias="mealName")
    meal_type: str | None = Field(default=None, alias="mealType")
    cuisine: str | None = None
    calories: int | None = None
    budget: str | None = None
    logged_at: datetime | None = Field(default=None, alias="loggedAt")
    method: str | None = None


class PatientMealsSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    consumed_kcal_today: int | None = Field(default=None, alias="consumedKcalToday")
    calorie_target: int | None = Field(default=None, alias="calorieTarget")
    remaining_kcal_today: int | None = Field(default=None, alias="remainingKcalToday")
    meals_logged: int = Field(alias="mealsLogged")


class PatientMealsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    summary: PatientMealsSummary
    logs: list[PatientMealLogItem]


class BloodWorkEntryCreateRequest(BaseModel):
    timestamp: datetime | None = None
    bmi: float | None = None
    systolic_bp: float | None = Field(default=None, alias="systolicBp")
    diastolic_bp: float | None = Field(default=None, alias="diastolicBp")
    heart_rate: float | None = Field(default=None, alias="heartRate")
    glucose: float | None = None
    cholesterol_total: float | None = Field(default=None, alias="cholesterolTotal")
    hdl_cholesterol: float | None = Field(default=None, alias="hdlCholesterol")
    ldl_cholesterol: float | None = Field(default=None, alias="ldlCholesterol")
    triglycerides: float | None = None

    model_config = ConfigDict(populate_by_name=True)


class BloodWorkSnapshotRequest(BaseModel):
    extracted_text: str | None = Field(default=None, alias="extractedText")
    image_data_url: str | None = Field(default=None, alias="imageDataUrl")
    file_name: str | None = Field(default=None, alias="fileName")

    model_config = ConfigDict(populate_by_name=True)


class BloodWorkSnapshotResponse(BaseModel):
    bmi: float | None = None
    systolic_bp: float | None = Field(default=None, alias="systolicBp")
    diastolic_bp: float | None = Field(default=None, alias="diastolicBp")
    heart_rate: float | None = Field(default=None, alias="heartRate")
    glucose: float | None = None
    cholesterol_total: float | None = Field(default=None, alias="cholesterolTotal")
    hdl_cholesterol: float | None = Field(default=None, alias="hdlCholesterol")
    ldl_cholesterol: float | None = Field(default=None, alias="ldlCholesterol")
    triglycerides: float | None = None
    notes: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class PatientAlertRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    patient_id: str = Field(alias="patientId")
    patient_name: str = Field(alias="patientName")
    alert_type: str = Field(alias="alertType")
    severity: str
    message: str
    llm_reason: str | None = Field(default=None, alias="llmReason")
    risk_score_snapshot: float | None = Field(default=None, alias="riskScoreSnapshot")
    status: str
    created_at: datetime = Field(alias="createdAt")


class AlertsSummaryResponse(BaseModel):
    open_count: int = Field(alias="openCount")
    high_count: int = Field(alias="highCount")
    medium_count: int = Field(alias="mediumCount")
    low_count: int = Field(alias="lowCount")


class ScheduleMeetingRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    time: str
    period: str
    title: str
    detail: str
    border_tone: str = Field(alias="borderTone")
    badge_label: str | None = Field(default=None, alias="badgeLabel")
    badge_tone: str | None = Field(default=None, alias="badgeTone")


class ScheduleTodoRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    label: str
    done: bool
    badge_label: str | None = Field(default=None, alias="badgeLabel")
    badge_tone: str | None = Field(default=None, alias="badgeTone")


class ScheduleTodayResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    date_label: str = Field(alias="dateLabel")
    meetings: list[ScheduleMeetingRead]
    todos: list[ScheduleTodoRead]


class ScheduleAppointmentCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    patient_id: Annotated[str, Field(alias="patientId")]
    scheduled_at: Annotated[datetime, Field(alias="scheduledAt")]
    title: str
    detail: str | None = None


class ScheduleAppointmentRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    patient_id: str = Field(alias="patientId")
    patient_name: str = Field(alias="patientName")
    scheduled_at: datetime = Field(alias="scheduledAt")
    title: str
    detail: str
    period: str
    date_label: str = Field(alias="dateLabel")


class ScheduleTaskCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    description: str
    task_type: Annotated[str, Field(default="follow_up", alias="taskType")]
    clinician_id: Annotated[str | None, Field(default=None, alias="clinicianId")]


class AISummaryRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    patient_id: str = Field(alias="patientId")
    patient_name: str = Field(alias="patientName")
    clinician_id: str = Field(alias="clinicianId")
    risk_score: float | None = Field(default=None, alias="riskScore")
    risk_level: str = Field(alias="riskLevel")
    generated_at: datetime = Field(alias="generatedAt")
    summary_text: str = Field(alias="summaryText")
    suggested_actions: list[str] = Field(default_factory=list, alias="suggestedActions")


class AISummariesRegenerateResponse(BaseModel):
    generated_count: int = Field(alias="generatedCount")
