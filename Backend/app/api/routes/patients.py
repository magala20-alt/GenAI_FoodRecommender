from datetime import UTC, date, datetime, timedelta
import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.clinician_patient_list import ClinicianPatientList
from app.models.ai_summary import AISummary
from app.models.mealHistory import MealHistory
from app.models.meals import Meals
from app.models.patient_alert import PatientAlert
from app.models.patient_onboarding import PatientOnboarding
from app.models.schedule import Schedule
from app.models.task import Task
from app.models.user_metrics import UserMetrics
from app.models.userHealth_metrics import UserHealthReadings
from app.models.user import User, UserRole
from app.schemas.patients import (
    AlertsSummaryResponse,
    BloodWorkEntryCreateRequest,
    BloodWorkSnapshotRequest,
    BloodWorkSnapshotResponse,
    CarePlanUpdateRequest,
    ClinicianPatientListItem,
    ClinicianPatientProfile,
    InterventionMessageRequest,
    InterventionMessageResponse,
    PatientAlertRead,
    PatientHealthReading,
    PatientMealLogItem,
    PatientMealsResponse,
    PatientMealsSummary,
    ScheduleMeetingRead,
    ScheduleAppointmentCreateRequest,
    ScheduleAppointmentRead,
    ScheduleTaskCreateRequest,
    ScheduleTodoRead,
    ScheduleTodayResponse,
    AISummaryRead,
    AISummariesRegenerateResponse,
)
from app.services.llm_client import get_llm_client
from app.services.rag_manager import get_rag_manager


router = APIRouter(prefix="/patients", tags=["patients"])


def _risk_level_from_score(risk_score: float | None) -> str | None:
    if risk_score is None:
        return None
    if risk_score >= 0.7:
        return "High"
    if risk_score >= 0.3:
        return "Medium"
    return "Low"


def _legacy_risk_level(latest_glucose: float | None, latest_systolic: float | None) -> str | None:
    if latest_glucose is None and latest_systolic is None:
        return None
    if (latest_glucose is not None and latest_glucose >= 140) or (latest_systolic is not None and latest_systolic >= 140):
        return "High"
    if (latest_glucose is not None and latest_glucose >= 120) or (latest_systolic is not None and latest_systolic >= 130):
        return "Medium"
    return "Low"


def _extract_goal_value(diet_goals: list[str], key: str) -> str | None:
    prefix = f"{key}:"
    for item in diet_goals:
        if item.startswith(prefix):
            return item[len(prefix):].strip()
    return None


def _set_goal_value(diet_goals: list[str], key: str, value: str | None) -> list[str]:
    prefix = f"{key}:"
    filtered = [item for item in diet_goals if not item.startswith(prefix)]
    if value is not None and str(value).strip() != "":
        filtered.append(f"{prefix}{value}")
    return filtered


def _assert_clinician_access_to_patient(db: Session, current_user: User, patient_id: str) -> User:
    if current_user.role == UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Clinician or admin access required")

    patient = db.get(User, patient_id)
    if not patient or patient.role != UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    if current_user.role == UserRole.CLINICIAN:
        link_stmt = select(ClinicianPatientList.id).where(
            ClinicianPatientList.clinician_id == current_user.id,
            ClinicianPatientList.patient_id == patient_id,
        )
        link = db.scalar(link_stmt)
        if not link:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    return patient


def _alerts_scope_patient_ids(db: Session, current_user: User) -> list[str]:
    if current_user.role == UserRole.ADMIN:
        return db.scalars(select(User.id).where(User.role == UserRole.PATIENT)).all()
    return db.scalars(
        select(ClinicianPatientList.patient_id).where(ClinicianPatientList.clinician_id == current_user.id)
    ).all()


def _infer_meal_type(consumed_at: datetime | None) -> str | None:
    if consumed_at is None:
        return None
    hour = consumed_at.hour
    if hour < 11:
        return "Breakfast"
    if hour < 16:
        return "Lunch"
    if hour < 21:
        return "Dinner"
    return "Snack"


def _calculate_streak(log_dates: set[date]) -> int:
    if not log_dates:
        return 0

    current = max(log_dates)
    streak = 0
    while current in log_dates:
        streak += 1
        current -= timedelta(days=1)
    return streak


def _refresh_user_metrics(
    db: Session,
    patient_id: str,
    onboarding: PatientOnboarding | None,
    metrics: UserMetrics | None,
) -> UserMetrics | None:
    meal_timestamps = db.scalars(
        select(MealHistory.consumed_at)
        .where(MealHistory.user_id == patient_id)
        .order_by(MealHistory.consumed_at.desc())
    ).all()

    if metrics is None:
        metrics = UserMetrics(user_id=patient_id)

    log_dates = {ts.date() for ts in meal_timestamps if ts is not None}
    total_meals_logged = len(meal_timestamps)
    streak = _calculate_streak(log_dates)
    last_logged_at = meal_timestamps[0] if meal_timestamps else None

    onboarding_start = None
    if onboarding is not None:
        onboarding_start = onboarding.completed_at or onboarding.enrollment_date

    adherence = None
    if onboarding_start is not None:
        total_days_since_onboarding = max(1, (date.today() - onboarding_start.date()).days + 1)
        adherence = round((len(log_dates) / total_days_since_onboarding) * 100.0, 1)

    has_changes = (
        metrics.total_meals_logged != total_meals_logged
        or metrics.streak != streak
        or metrics.last_logged_at != last_logged_at
        or metrics.adherence != adherence
    )

    metrics.total_meals_logged = total_meals_logged
    metrics.streak = streak
    metrics.last_logged_at = last_logged_at
    metrics.adherence = adherence

    if has_changes:
        db.add(metrics)
        db.commit()
        db.refresh(metrics)

    return metrics


def _safe_float(value: object) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _extract_json_object(raw_text: str) -> dict:
    if not raw_text:
        return {}
    try:
        parsed = json.loads(raw_text)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        # Handle LLM responses with extra text around a JSON object.
        start = raw_text.find("{")
        end = raw_text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return {}
        try:
            parsed = json.loads(raw_text[start : end + 1])
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}


def _actions_from_json(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return []
    if isinstance(parsed, list):
        return [str(item).strip() for item in parsed if str(item).strip()]
    return []


def _risk_level_from_value(score: float | None) -> str:
    if score is None:
        return "Low"
    if score >= 0.7:
        return "High"
    if score >= 0.3:
        return "Medium"
    return "Low"


def _fallback_ai_summary(
    patient_name: str,
    risk_level: str,
    risk_score: float | None,
    adherence: float | None,
    glucose: float | None,
    systolic: float | None,
    open_alerts: int,
) -> tuple[str, list[str]]:
    summary = (
        f"{patient_name} is currently in {risk_level.lower()} risk tier"
        + (f" (score {risk_score:.2f})" if risk_score is not None else "")
        + ". "
        + (f"Adherence is {adherence:.1f}%. " if adherence is not None else "Adherence data is limited. ")
        + (f"Latest glucose is {glucose:.1f}. " if glucose is not None else "Glucose data is limited. ")
        + (f"Latest systolic BP is {systolic:.0f}. " if systolic is not None else "Blood pressure data is limited. ")
        + (f"There are {open_alerts} open alerts requiring review." if open_alerts > 0 else "No open alerts at the moment.")
    )

    actions: list[str] = []
    if risk_level == "High":
        actions.extend(["Urgent clinical review", "Medication and care-plan check", "Patient outreach today"])
    elif risk_level == "Medium":
        actions.extend(["Review meal adherence trends", "Schedule near-term follow-up"])
    else:
        actions.extend(["Continue monitoring", "Reinforce current care plan"])
    if open_alerts > 0:
        actions.append("Address open alerts")
    return summary, actions[:4]

# function that generates an AI summary for a patient and stores it in the database, 
# using RAG for enhanced insights and a fallback mechanism for robustness.   
def _generate_and_store_ai_summary(
    db: Session,
    current_user: User,
    patient_id: str,
) -> AISummary:
    patient = _assert_clinician_access_to_patient(db, current_user, patient_id)
    onboarding = db.scalar(select(PatientOnboarding).where(PatientOnboarding.user_id == patient_id))
    metrics = db.scalar(select(UserMetrics).where(UserMetrics.user_id == patient_id))
    latest_reading = db.scalar(
        select(UserHealthReadings)
        .where(UserHealthReadings.user_id == patient_id)
        .order_by(UserHealthReadings.timestamp.desc())
        .limit(1)
    )
    open_alerts = db.scalar(
        select(func.count(PatientAlert.id)).where(PatientAlert.patient_id == patient_id, PatientAlert.status == "Open")
    ) or 0

    risk_score = onboarding.baseline_risk_score if onboarding else None
    risk_level = _risk_level_from_value(risk_score)
    patient_name = f"{patient.first_name} {patient.last_name}".strip()

    meal_rows = db.execute(
        select(MealHistory, Meals)
        .outerjoin(Meals, Meals.id == MealHistory.meal_id)
        .where(MealHistory.user_id == patient_id)
        .order_by(MealHistory.consumed_at.desc())
        .limit(30)
    ).all()

    meal_history: list[dict] = []
    for history, meal in meal_rows:
        meal_history.append(
            {
                "meal_name": meal.name if meal else "Unknown meal",
                "calories": int(history.calories or (meal.calories if meal else 0) or 0),
                "protein_g": float((meal.protein_g if meal else 0) or 0),
                "carbs_g": float((meal.carbs_g if meal else 0) or 0),
                "date": history.consumed_at.isoformat() if history.consumed_at else None,
            }
        )

    patient_data = {
        "name": patient_name,
        "age": (onboarding.age if onboarding else None),
        "diagnosis": "Diabetes" if onboarding and onboarding.diagnosed_diabetes else "N/A",
        "risk_level": risk_level,
        "current_metrics": {
            "blood_pressure": (
                f"{int(latest_reading.systolic_bp)}/{int(latest_reading.diastolic_bp)}"
                if latest_reading and latest_reading.systolic_bp is not None and latest_reading.diastolic_bp is not None
                else "N/A"
            ),
            "glucose": (latest_reading.glucose if latest_reading else None),
            "weight": (onboarding.weight_kg if onboarding else None),
        },
    }

    predictions = {
        "predicted_glucose": (latest_reading.glucose if latest_reading else None),
        "weight_trend": onboarding.trajectory_type if onboarding else None,
    }

    recent_trends = {
        "eating_pattern": (
            "Consistent" if metrics and metrics.streak and metrics.streak >= 3 else "Inconsistent"
        ),
        "health_concerns": (
            "Open alerts present" if open_alerts > 0 else "No active alerts"
        ),
        "adherence_issues": (
            "Adherence below target"
            if metrics and metrics.adherence is not None and metrics.adherence < 70
            else "No critical adherence issue"
        ),
    }

    summary_text: str
    actions: list[str]
    try:
        rag = get_rag_manager(db)
        rag_result = rag.analyze_patient(
            patient_id=patient_id,
            patient_data=patient_data,
            meal_history=meal_history,
            predictions=predictions,
            recent_trends=recent_trends,
        )
        summary_text = str(rag_result.get("summary") or "").strip()
        actions = [str(item).strip() for item in rag_result.get("actions", [])]
        actions = [item for item in actions if item][:4]
        if not summary_text:
            raise ValueError("RAG summary missing")
    except Exception:
        summary_text, actions = _fallback_ai_summary(
            patient_name=patient_name,
            risk_level=risk_level,
            risk_score=risk_score,
            adherence=(metrics.adherence if metrics else None),
            glucose=(latest_reading.glucose if latest_reading else None),
            systolic=(latest_reading.systolic_bp if latest_reading else None),
            open_alerts=open_alerts,
        )

    clinician_id = current_user.id
    if current_user.role == UserRole.ADMIN:
        linked_clinician = db.scalar(
            select(ClinicianPatientList.clinician_id).where(ClinicianPatientList.patient_id == patient_id).limit(1)
        )
        if linked_clinician:
            clinician_id = linked_clinician

    record = db.scalar(select(AISummary).where(AISummary.patient_id == patient_id))
    if record is None:
        record = AISummary(patient_id=patient_id, clinician_id=clinician_id)

    record.clinician_id = clinician_id
    record.risk_score = risk_score
    record.risk_level = risk_level
    record.summary_text = summary_text
    record.suggested_actions = json.dumps(actions)
    record.generated_at = datetime.now(UTC)

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def _to_ai_summary_read(db: Session, row: AISummary) -> AISummaryRead:
    patient = db.get(User, row.patient_id)
    patient_name = f"{patient.first_name} {patient.last_name}".strip() if patient else "Unknown"
    return AISummaryRead(
        id=row.id,
        patientId=row.patient_id,
        patientName=patient_name,
        clinicianId=row.clinician_id,
        riskScore=row.risk_score,
        riskLevel=row.risk_level,
        generatedAt=row.generated_at,
        summaryText=row.summary_text,
        suggestedActions=_actions_from_json(row.suggested_actions),
    )
    stripped = raw_text.strip()
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        start = stripped.find("{")
        end = stripped.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(stripped[start : end + 1])
            except json.JSONDecodeError:
                return {}
        return {}


def _extract_snapshot_with_llm(payload: BloodWorkSnapshotRequest) -> BloodWorkSnapshotResponse:
    prompt = (
        "Extract blood work readings from the provided clinical snapshot. "
        "Return JSON only with keys: bmi, systolic_bp, diastolic_bp, heart_rate, glucose, "
        "cholesterol_total, hdl_cholesterol, ldl_cholesterol, triglycerides, notes. "
        "Use null for unknown values."
    )

    content_blocks: list[dict] = [{"type": "text", "text": prompt}]
    if payload.extracted_text:
        content_blocks.append({"type": "text", "text": f"Text snapshot:\n{payload.extracted_text}"})

    llm_raw = ""

    # Try OpenAI vision when an image is provided; fallback to text-only LLM extraction.
    if payload.image_data_url:
        try:
            import openai

            from app.core.config import settings

            client = openai.OpenAI(api_key=settings.llm_api_key)
            image_blocks = list(content_blocks)
            image_blocks.append({"type": "image_url", "image_url": {"url": payload.image_data_url}})

            response = client.chat.completions.create(
                model=settings.llm_model,
                messages=[{"role": "user", "content": image_blocks}],
                temperature=0,
                max_tokens=700,
            )
            llm_raw = response.choices[0].message.content or ""
        except Exception:
            llm_raw = ""

    if not llm_raw:
        llm_client = get_llm_client()
        llm_raw = llm_client.call(
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"{prompt}\n\n"
                        f"Text snapshot:\n{payload.extracted_text or 'N/A'}"
                    ),
                }
            ]
        )

    data = _extract_json_object(llm_raw)
    return BloodWorkSnapshotResponse(
        bmi=_safe_float(data.get("bmi")),
        systolicBp=_safe_float(data.get("systolic_bp")),
        diastolicBp=_safe_float(data.get("diastolic_bp")),
        heartRate=_safe_float(data.get("heart_rate")),
        glucose=_safe_float(data.get("glucose")),
        cholesterolTotal=_safe_float(data.get("cholesterol_total")),
        hdlCholesterol=_safe_float(data.get("hdl_cholesterol")),
        ldlCholesterol=_safe_float(data.get("ldl_cholesterol")),
        triglycerides=_safe_float(data.get("triglycerides")),
        notes=(str(data.get("notes")) if data.get("notes") is not None else None),
    )


@router.get("", response_model=list[ClinicianPatientListItem])
def get_clinician_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ClinicianPatientListItem]:
    if current_user.role == UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Clinician or admin access required")

    if current_user.role == UserRole.ADMIN:
        stmt = (
            select(User, PatientOnboarding, UserMetrics)
            .outerjoin(PatientOnboarding, PatientOnboarding.user_id == User.id)
            .outerjoin(UserMetrics, UserMetrics.user_id == User.id)
            .where(User.role == UserRole.PATIENT)
            .order_by(User.first_name.asc(), User.last_name.asc())
        )
        rows = db.execute(stmt).all()
    else:
        stmt = (
            select(User, PatientOnboarding, UserMetrics)
            .join(ClinicianPatientList, ClinicianPatientList.patient_id == User.id)
            .outerjoin(PatientOnboarding, PatientOnboarding.user_id == User.id)
            .outerjoin(UserMetrics, UserMetrics.user_id == User.id)
            .where(
                ClinicianPatientList.clinician_id == current_user.id,
                User.role == UserRole.PATIENT,
            )
            .order_by(User.first_name.asc(), User.last_name.asc())
        )
        rows = db.execute(stmt).all()

    return [
        ClinicianPatientListItem(
            id=user.id,
            firstName=user.first_name,
            lastName=user.last_name,
            email=user.email,
            age=onboarding.age if onboarding else None,
            riskLevel=_risk_level_from_score(onboarding.baseline_risk_score) if onboarding else None,
            adherence=(metrics.adherence if metrics else None),
            alerts=("Open alerts" if db.scalar(select(func.count(PatientAlert.id)).where(PatientAlert.patient_id == user.id, PatientAlert.status == "Open")) else None),
            alertsCount=(db.scalar(select(func.count(PatientAlert.id)).where(PatientAlert.patient_id == user.id, PatientAlert.status == "Open")) or 0),
        )
        for user, onboarding, metrics in rows
    ]


@router.get("/{patient_id}", response_model=ClinicianPatientProfile)
def get_patient_profile(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClinicianPatientProfile:
    patient = _assert_clinician_access_to_patient(db, current_user, patient_id)

    onboarding = db.scalar(select(PatientOnboarding).where(PatientOnboarding.user_id == patient_id))
    metrics = db.scalar(select(UserMetrics).where(UserMetrics.user_id == patient_id))
    metrics = _refresh_user_metrics(db, patient_id, onboarding, metrics)
    latest_reading = db.scalar(
        select(UserHealthReadings)
        .where(UserHealthReadings.user_id == patient_id)
        .order_by(UserHealthReadings.timestamp.desc())
        .limit(1)
    )
    reading_count = db.scalar(
        select(func.count(UserHealthReadings.id)).where(UserHealthReadings.user_id == patient_id)
    ) or 0
    sessions_7d = db.scalar(
        select(func.count(MealHistory.id)).where(
            MealHistory.user_id == patient_id,
            MealHistory.consumed_at >= (datetime.now(UTC) - timedelta(days=7)),
        )
    ) or 0

    latest_glucose = (latest_reading.glucose if latest_reading else None) or (onboarding.glucose if onboarding else None)
    latest_systolic = (latest_reading.systolic_bp if latest_reading else None) or (onboarding.bp_systolic if onboarding else None)
    diet_goals = onboarding.diet_goals if onboarding else []
    daily_steps_raw = _extract_goal_value(diet_goals, "daily_steps")
    target_hba1c_raw = _extract_goal_value(diet_goals, "target_hba1c")

    risk_level = _risk_level_from_score(onboarding.baseline_risk_score if onboarding else None)
    if risk_level is None:
        risk_level = _legacy_risk_level(latest_glucose, latest_systolic)

    alerts_list: list[str] = []
    if latest_glucose is not None and latest_glucose >= 140:
        alerts_list.append("Glucose elevated")
    if latest_systolic is not None and latest_systolic >= 140:
        alerts_list.append("Blood pressure elevated")

    return ClinicianPatientProfile(
        id=patient.id,
        firstName=patient.first_name,
        lastName=patient.last_name,
        email=patient.email,
        age=onboarding.age if onboarding else None,
        gender=onboarding.gender if onboarding else None,
        riskLevel=risk_level,
        riskScore=onboarding.baseline_risk_score if onboarding else None,
        adherence=(metrics.adherence if metrics else None),
        alerts=", ".join(alerts_list) if alerts_list else "No active alerts",
        onboardedDate=(onboarding.completed_at if onboarding and onboarding.completed_at else onboarding.enrollment_date if onboarding else None),
        calorieTarget=onboarding.calorie_target if onboarding else None,
        primaryGoal=onboarding.primary_goal if onboarding else None,
        budgetPreference=onboarding.budget_preference if onboarding else None,
        country=onboarding.country if onboarding else None,
        weightKg=onboarding.weight_kg if onboarding else None,
        heightCm=onboarding.height_cm if onboarding else None,
        bpSystolic=int((latest_reading.systolic_bp if latest_reading else None) or (onboarding.bp_systolic if onboarding else 0)) or None,
        bpDiastolic=int((latest_reading.diastolic_bp if latest_reading else None) or (onboarding.bp_diastolic if onboarding else 0)) or None,
        heartRate=int((latest_reading.heart_rate if latest_reading else None) or (onboarding.heart_rate if onboarding else 0)) or None,
        bmi=(latest_reading.bmi if latest_reading else None) or (onboarding.bmi if onboarding else None),
        glucose=(latest_reading.glucose if latest_reading else None) or (onboarding.glucose if onboarding else None),
        cholesterolTotal=(latest_reading.cholesterol_total if latest_reading else None) or (onboarding.cholesterol_total if onboarding else None),
        hdlCholesterol=(latest_reading.hdl_cholesterol if latest_reading else None) or (onboarding.hdl_cholesterol if onboarding else None),
        ldlCholesterol=(latest_reading.ldl_cholesterol if latest_reading else None) or (onboarding.ldl_cholesterol if onboarding else None),
        triglycerides=(latest_reading.triglycerides if latest_reading else None) or (onboarding.triglycerides if onboarding else None),
        phoneNumber=onboarding.phone_number if onboarding else None,
        emergencyContactFullName=onboarding.emergency_contact_full_name if onboarding else None,
        emergencyContactRelationship=onboarding.emergency_contact_relationship if onboarding else None,
        emergencyContactPhone=onboarding.emergency_contact_phone if onboarding else None,
        cuisinePreferences=onboarding.cuisine_preferences if onboarding else [],
        dietaryRestrictions=onboarding.dietary_restrictions if onboarding else [],
        prescribedMedications=onboarding.prescribed_medications if onboarding else [],
        dailySteps=int(daily_steps_raw) if daily_steps_raw else None,
        targetHba1c=float(target_hba1c_raw) if target_hba1c_raw else None,
        mealsLogged=(metrics.total_meals_logged if metrics else None),
        streak=(metrics.streak if metrics else None),
        sessions7d=(sessions_7d if sessions_7d else None),
        missedAppointments=None,
        alertsCount=(db.scalar(select(func.count(PatientAlert.id)).where(PatientAlert.patient_id == patient_id, PatientAlert.status == "Open")) or 0),
    )


@router.get("/alerts/patient/{patient_id}", response_model=list[PatientAlertRead])
def get_patient_alerts(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PatientAlertRead]:
    patient = _assert_clinician_access_to_patient(db, current_user, patient_id)
    rows = db.scalars(
        select(PatientAlert)
        .where(PatientAlert.patient_id == patient_id)
        .order_by(PatientAlert.created_at.desc())
    ).all()
    patient_name = f"{patient.first_name} {patient.last_name}".strip()
    return [
        PatientAlertRead(
            id=row.id,
            patientId=row.patient_id,
            patientName=patient_name,
            alertType=row.alert_type,
            severity=row.severity,
            message=row.alert_message,
            llmReason=row.llm_reason,
            riskScoreSnapshot=row.risk_score_snapshot,
            status=row.status,
            createdAt=row.created_at,
        )
        for row in rows
    ]


@router.get("/alerts/all", response_model=list[PatientAlertRead])
def get_alerts(
    patient_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PatientAlertRead]:
    allowed_ids = _alerts_scope_patient_ids(db, current_user)
    if patient_id:
        if patient_id not in allowed_ids:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
        allowed_ids = [patient_id]

    if not allowed_ids:
        return []

    patient_name_rows = db.execute(select(User.id, User.first_name, User.last_name).where(User.id.in_(allowed_ids))).all()
    names = {pid: f"{first} {last}".strip() for pid, first, last in patient_name_rows}

    rows = db.scalars(
        select(PatientAlert)
        .where(PatientAlert.patient_id.in_(allowed_ids))
        .order_by(PatientAlert.created_at.desc())
    ).all()
    return [
        PatientAlertRead(
            id=row.id,
            patientId=row.patient_id,
            patientName=names.get(row.patient_id, "Unknown"),
            alertType=row.alert_type,
            severity=row.severity,
            message=row.alert_message,
            llmReason=row.llm_reason,
            riskScoreSnapshot=row.risk_score_snapshot,
            status=row.status,
            createdAt=row.created_at,
        )
        for row in rows
    ]


@router.get("/alerts/summary", response_model=AlertsSummaryResponse)
def get_alerts_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AlertsSummaryResponse:
    allowed_ids = _alerts_scope_patient_ids(db, current_user)
    if not allowed_ids:
        return AlertsSummaryResponse(openCount=0, highCount=0, mediumCount=0, lowCount=0)

    open_count = db.scalar(
        select(func.count(PatientAlert.id)).where(PatientAlert.patient_id.in_(allowed_ids), PatientAlert.status == "Open")
    ) or 0
    high_count = db.scalar(
        select(func.count(PatientAlert.id)).where(PatientAlert.patient_id.in_(allowed_ids), PatientAlert.status == "Open", PatientAlert.severity == "High")
    ) or 0
    medium_count = db.scalar(
        select(func.count(PatientAlert.id)).where(PatientAlert.patient_id.in_(allowed_ids), PatientAlert.status == "Open", PatientAlert.severity == "Medium")
    ) or 0
    low_count = db.scalar(
        select(func.count(PatientAlert.id)).where(PatientAlert.patient_id.in_(allowed_ids), PatientAlert.status == "Open", PatientAlert.severity == "Low")
    ) or 0

    return AlertsSummaryResponse(openCount=open_count, highCount=high_count, mediumCount=medium_count, lowCount=low_count)


@router.post("/alerts/{alert_id}/dismiss", response_model=PatientAlertRead)
def dismiss_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PatientAlertRead:
    alert = db.get(PatientAlert, alert_id)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    _assert_clinician_access_to_patient(db, current_user, alert.patient_id)

    alert.status = "Resolved"
    alert.resolved_at = datetime.now(UTC)
    db.add(alert)
    db.commit()
    db.refresh(alert)

    patient = db.get(User, alert.patient_id)
    patient_name = f"{patient.first_name} {patient.last_name}".strip() if patient else "Unknown"
    return PatientAlertRead(
        id=alert.id,
        patientId=alert.patient_id,
        patientName=patient_name,
        alertType=alert.alert_type,
        severity=alert.severity,
        message=alert.alert_message,
        llmReason=alert.llm_reason,
        riskScoreSnapshot=alert.risk_score_snapshot,
        status=alert.status,
        createdAt=alert.created_at,
    )


@router.get("/schedule/today", response_model=ScheduleTodayResponse)
def get_schedule_today(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScheduleTodayResponse:
    allowed_ids = _alerts_scope_patient_ids(db, current_user)
    now = datetime.now(UTC)
    date_label = f"{now.strftime('%A')}, {now.day} {now.strftime('%B')}"

    patient_name_rows = db.execute(select(User.id, User.first_name, User.last_name).where(User.id.in_(allowed_ids))).all() if allowed_ids else []
    names = {pid: f"{first} {last}".strip() for pid, first, last in patient_name_rows}

    schedule_rows = db.scalars(
        select(Schedule)
        .where(Schedule.patient_id.in_(allowed_ids))
        .order_by(Schedule.created_at.desc())
        .limit(100)
    ).all() if allowed_ids else []

    def _parse_datetime(value: str | None) -> datetime | None:
        if not value:
            return None
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=UTC)
            return parsed
        except ValueError:
            return None

    meetings: list[ScheduleMeetingRead] = []
    for row in schedule_rows:
        payload = _extract_json_object(row.schedule_data)
        scheduled_at = _parse_datetime(str(payload.get("scheduledAt") or ""))
        if scheduled_at is None:
            continue
        if scheduled_at.date() != now.date():
            continue

        patient_name = names.get(row.patient_id, "Patient")
        hour = scheduled_at.hour
        badge_label = None
        badge_tone = None
        if len(meetings) == 0:
            badge_label = "Now"
            badge_tone = "now"
        elif len(meetings) == 1:
            badge_label = "In 2h"
            badge_tone = "soon"
        elif hour >= 12:
            badge_label = "Afternoon"
            badge_tone = "neutral"

        meetings.append(
            ScheduleMeetingRead(
                id=row.id,
                time=scheduled_at.strftime("%I:%M").lstrip("0"),
                period=scheduled_at.strftime("%p"),
                title=f"{payload.get('title') or 'Check-in'} · {patient_name}",
                detail=str(payload.get("detail") or "Scheduled appointment"),
                borderTone="high" if hour < 12 else "medium" if hour < 16 else "low",
                badgeLabel=badge_label,
                badgeTone=badge_tone,
            )
        )

    meetings.sort(key=lambda m: (m.period, m.time))

    task_stmt = select(Task)
    if current_user.role != UserRole.ADMIN:
        task_stmt = task_stmt.where(Task.clinician_id == current_user.id)
    task_rows = db.scalars(task_stmt.order_by(Task.created_at.desc()).limit(20)).all()

    todos: list[ScheduleTodoRead] = []
    for row in task_rows:
        done = row.status.lower() in {"done", "completed", "resolved"}
        badge_label = "Urgent" if row.task_type.lower() in {"urgent", "high", "critical"} else "Today" if not done else None
        badge_tone = "urgent" if badge_label == "Urgent" else "today" if badge_label == "Today" else None
        todos.append(
            ScheduleTodoRead(
                id=row.id,
                label=row.description,
                done=done,
                badgeLabel=badge_label,
                badgeTone=badge_tone,
            )
        )

    return ScheduleTodayResponse(dateLabel=date_label, meetings=meetings, todos=todos)


@router.post("/schedule/appointments", response_model=ScheduleMeetingRead)
def create_schedule_appointment(
    payload: ScheduleAppointmentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScheduleMeetingRead:
    patient = _assert_clinician_access_to_patient(db, current_user, payload.patient_id)

    schedule_payload = {
        "scheduledAt": payload.scheduled_at.isoformat(),
        "title": payload.title,
        "detail": payload.detail or "Scheduled appointment",
    }
    row = Schedule(
        patient_id=payload.patient_id,
        schedule_data=json.dumps(schedule_payload),
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    scheduled_at = payload.scheduled_at
    if scheduled_at.tzinfo is None:
        scheduled_at = scheduled_at.replace(tzinfo=UTC)
    return ScheduleMeetingRead(
        id=row.id,
        time=scheduled_at.strftime("%I:%M").lstrip("0"),
        period=scheduled_at.strftime("%p"),
        title=f"{payload.title} · {patient.first_name} {patient.last_name}",
        detail=payload.detail or "Scheduled appointment",
        borderTone="high" if scheduled_at.hour < 12 else "medium" if scheduled_at.hour < 16 else "low",
        badgeLabel=None,
        badgeTone=None,
    )


@router.get("/schedule/appointments", response_model=list[ScheduleAppointmentRead])
def get_schedule_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ScheduleAppointmentRead]:
    allowed_ids = _alerts_scope_patient_ids(db, current_user)
    if not allowed_ids:
        return []

    patient_name_rows = db.execute(select(User.id, User.first_name, User.last_name).where(User.id.in_(allowed_ids))).all()
    names = {pid: f"{first} {last}".strip() for pid, first, last in patient_name_rows}

    schedule_rows = db.scalars(
        select(Schedule)
        .where(Schedule.patient_id.in_(allowed_ids))
        .order_by(Schedule.created_at.desc())
        .limit(500)
    ).all()

    appointments: list[ScheduleAppointmentRead] = []
    for row in schedule_rows:
        payload = _extract_json_object(row.schedule_data)
        scheduled_at_raw = str(payload.get("scheduledAt") or "")
        if not scheduled_at_raw:
            continue
        try:
            scheduled_at = datetime.fromisoformat(scheduled_at_raw.replace("Z", "+00:00"))
            if scheduled_at.tzinfo is None:
                scheduled_at = scheduled_at.replace(tzinfo=UTC)
        except ValueError:
            continue

        patient_name = names.get(row.patient_id, "Patient")
        appointments.append(
            ScheduleAppointmentRead(
                id=row.id,
                patientId=row.patient_id,
                patientName=patient_name,
                scheduledAt=scheduled_at,
                title=str(payload.get("title") or "Check-in"),
                detail=str(payload.get("detail") or "Scheduled appointment"),
                period=scheduled_at.strftime("%p"),
                dateLabel=scheduled_at.strftime("%Y-%m-%d"),
            )
        )

    return appointments


@router.post("/schedule/tasks", response_model=ScheduleTodoRead)
def create_schedule_task(
    payload: ScheduleTaskCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScheduleTodoRead:
    clinician_id = current_user.id
    if current_user.role == UserRole.ADMIN and payload.clinician_id:
        target_user = db.get(User, payload.clinician_id)
        if target_user is None or target_user.role != UserRole.CLINICIAN:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinician not found")
        clinician_id = target_user.id

    row = Task(
        clinician_id=clinician_id,
        task_type=payload.task_type,
        description=payload.description,
        status="Pending",
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    badge_label = "Urgent" if row.task_type.lower() in {"urgent", "high", "critical"} else "Today"
    badge_tone = "urgent" if badge_label == "Urgent" else "today"
    return ScheduleTodoRead(
        id=row.id,
        label=row.description,
        done=False,
        badgeLabel=badge_label,
        badgeTone=badge_tone,
    )


@router.get("/ai-summaries", response_model=list[AISummaryRead])
def get_ai_summaries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AISummaryRead]:
    allowed_ids = _alerts_scope_patient_ids(db, current_user)
    if not allowed_ids:
        return []

    rows = db.scalars(
        select(AISummary)
        .where(AISummary.patient_id.in_(allowed_ids))
        .order_by(AISummary.generated_at.desc())
    ).all()

    if not rows:
        for patient_id in allowed_ids:
            _generate_and_store_ai_summary(db, current_user, patient_id)
        rows = db.scalars(
            select(AISummary)
            .where(AISummary.patient_id.in_(allowed_ids))
            .order_by(AISummary.generated_at.desc())
        ).all()

    return [_to_ai_summary_read(db, row) for row in rows]


@router.post("/ai-summaries/regenerate", response_model=AISummariesRegenerateResponse)
def regenerate_ai_summaries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AISummariesRegenerateResponse:
    allowed_ids = _alerts_scope_patient_ids(db, current_user)
    generated = 0
    for patient_id in allowed_ids:
        _generate_and_store_ai_summary(db, current_user, patient_id)
        generated += 1
    return AISummariesRegenerateResponse(generatedCount=generated)


@router.post("/{patient_id}/ai-summary/regenerate", response_model=AISummaryRead)
def regenerate_patient_ai_summary(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AISummaryRead:
    row = _generate_and_store_ai_summary(db, current_user, patient_id)
    return _to_ai_summary_read(db, row)


@router.get("/{patient_id}/ai-summary", response_model=AISummaryRead)
def get_patient_ai_summary(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AISummaryRead:
    _assert_clinician_access_to_patient(db, current_user, patient_id)
    row = db.scalar(select(AISummary).where(AISummary.patient_id == patient_id))
    if row is None:
        row = _generate_and_store_ai_summary(db, current_user, patient_id)
    return _to_ai_summary_read(db, row)


@router.put("/{patient_id}/care-plan", response_model=ClinicianPatientProfile)
def update_patient_care_plan(
    patient_id: str,
    payload: CarePlanUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClinicianPatientProfile:
    _assert_clinician_access_to_patient(db, current_user, patient_id)

    onboarding = db.scalar(select(PatientOnboarding).where(PatientOnboarding.user_id == patient_id))
    if onboarding is None:
        onboarding = PatientOnboarding(user_id=patient_id)

    updates = payload.model_dump(exclude_unset=True, by_alias=False)
    if "prescribed_medications" in updates:
        onboarding.prescribed_medications = updates["prescribed_medications"] or []
    if "dietary_restrictions" in updates:
        onboarding.dietary_restrictions = updates["dietary_restrictions"] or []
    if "cuisine_preferences" in updates:
        onboarding.cuisine_preferences = updates["cuisine_preferences"] or []
    if "calorie_target" in updates:
        onboarding.calorie_target = updates["calorie_target"]
    if "target_weight_kg" in updates:
        onboarding.target_weight_kg = updates["target_weight_kg"]

    diet_goals = onboarding.diet_goals or []
    if "daily_steps" in updates:
        diet_goals = _set_goal_value(diet_goals, "daily_steps", str(updates["daily_steps"]) if updates["daily_steps"] is not None else None)
    if "target_hba1c" in updates:
        diet_goals = _set_goal_value(diet_goals, "target_hba1c", str(updates["target_hba1c"]) if updates["target_hba1c"] is not None else None)
    onboarding.diet_goals = diet_goals

    db.add(onboarding)
    db.commit()

    return get_patient_profile(patient_id=patient_id, db=db, current_user=current_user)


@router.post("/{patient_id}/intervention-message", response_model=InterventionMessageResponse)
def send_intervention_message(
    patient_id: str,
    payload: InterventionMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterventionMessageResponse:
    _assert_clinician_access_to_patient(db, current_user, patient_id)

    clean_message = payload.message.strip()
    if not clean_message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")

    # Placeholder for Expo push integration: this endpoint validates and accepts the message.
    return InterventionMessageResponse(
        status="queued",
        detail="Intervention message queued for patient app delivery",
    )


@router.get("/{patient_id}/meals", response_model=PatientMealsResponse)
def get_patient_meals(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PatientMealsResponse:
    _assert_clinician_access_to_patient(db, current_user, patient_id)

    onboarding = db.scalar(select(PatientOnboarding).where(PatientOnboarding.user_id == patient_id))

    rows = db.execute(
        select(MealHistory, Meals)
        .outerjoin(Meals, Meals.id == MealHistory.meal_id)
        .where(MealHistory.user_id == patient_id)
        .order_by(MealHistory.consumed_at.desc())
        .limit(100)
    ).all()

    logs: list[PatientMealLogItem] = []
    consumed_today = 0
    today = date.today()

    for history, meal in rows:
        calories_value = history.calories if history.calories is not None else (meal.calories if meal else None)
        consumed_at = history.consumed_at

        if consumed_at is not None and consumed_at.date() == today and calories_value is not None:
            consumed_today += int(calories_value)

        logs.append(
            PatientMealLogItem(
                id=history.id,
                mealName=(meal.name if meal else None),
                mealType=_infer_meal_type(consumed_at),
                cuisine=(meal.cuisine if meal else None),
                calories=(int(calories_value) if calories_value is not None else None),
                budget=(onboarding.budget_preference if onboarding else None),
                loggedAt=consumed_at,
                method=None,
            )
        )

    calorie_target = onboarding.calorie_target if onboarding else None
    remaining = None
    if calorie_target is not None:
        remaining = calorie_target - consumed_today

    summary = PatientMealsSummary(
        consumedKcalToday=(consumed_today if rows else None),
        calorieTarget=calorie_target,
        remainingKcalToday=remaining,
        mealsLogged=len(rows),
    )

    return PatientMealsResponse(summary=summary, logs=logs)


@router.get("/{patient_id}/health-readings", response_model=list[PatientHealthReading])
def get_patient_health_readings(
    patient_id: str,
    days: int = Query(default=60, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PatientHealthReading]:
    _assert_clinician_access_to_patient(db, current_user, patient_id)

    since = datetime.now(UTC) - timedelta(days=days)
    rows = db.scalars(
        select(UserHealthReadings)
        .where(
            UserHealthReadings.user_id == patient_id,
            UserHealthReadings.timestamp >= since,
        )
        .order_by(UserHealthReadings.timestamp.asc())
    ).all()

    return [
        PatientHealthReading(
            timestamp=row.timestamp,
            bmi=row.bmi,
            systolicBp=row.systolic_bp,
            diastolicBp=row.diastolic_bp,
            heartRate=row.heart_rate,
            glucose=row.glucose,
            cholesterolTotal=row.cholesterol_total,
            hdlCholesterol=row.hdl_cholesterol,
            ldlCholesterol=row.ldl_cholesterol,
            triglycerides=row.triglycerides,
        )
        for row in rows
    ]


@router.post("/{patient_id}/health-readings", response_model=PatientHealthReading)
def create_patient_health_reading(
    patient_id: str,
    payload: BloodWorkEntryCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PatientHealthReading:
    _assert_clinician_access_to_patient(db, current_user, patient_id)

    reading = UserHealthReadings(
        user_id=patient_id,
        timestamp=payload.timestamp or datetime.now(UTC),
        bmi=payload.bmi,
        systolic_bp=payload.systolic_bp,
        diastolic_bp=payload.diastolic_bp,
        heart_rate=payload.heart_rate,
        glucose=payload.glucose,
        cholesterol_total=payload.cholesterol_total,
        hdl_cholesterol=payload.hdl_cholesterol,
        ldl_cholesterol=payload.ldl_cholesterol,
        triglycerides=payload.triglycerides,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    return PatientHealthReading(
        timestamp=reading.timestamp,
        bmi=reading.bmi,
        systolicBp=reading.systolic_bp,
        diastolicBp=reading.diastolic_bp,
        heartRate=reading.heart_rate,
        glucose=reading.glucose,
        cholesterolTotal=reading.cholesterol_total,
        hdlCholesterol=reading.hdl_cholesterol,
        ldlCholesterol=reading.ldl_cholesterol,
        triglycerides=reading.triglycerides,
    )


@router.post("/{patient_id}/health-readings/extract-snapshot", response_model=BloodWorkSnapshotResponse)
def extract_bloodwork_snapshot(
    patient_id: str,
    payload: BloodWorkSnapshotRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BloodWorkSnapshotResponse:
    _assert_clinician_access_to_patient(db, current_user, patient_id)

    if not payload.extracted_text and not payload.image_data_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide extracted text or image snapshot")

    try:
        return _extract_snapshot_with_llm(payload)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Snapshot extraction failed: {exc}") from exc
