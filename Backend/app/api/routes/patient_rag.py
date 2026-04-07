from __future__ import annotations

from datetime import UTC, datetime
import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_patient, get_current_user
from app.db.session import get_db
from app.models.clinician_patient_list import ClinicianPatientList
from app.models.mealHistory import MealHistory
from app.models.meals import Meals
from app.models.patient_alert import PatientAlert
from app.models.patient_onboarding import PatientOnboarding
from app.models.userHealth_metrics import UserHealthReadings
from app.models.user_metrics import UserMetrics
from app.models.user import User
from app.models.user import UserRole
from app.schemas.patient_rag import (
    ClinicianPatientFilterMatch,
    ClinicianPatientFilterRequest,
    ClinicianPatientFilterResponse,
    EmbeddingGenerateResponse,
    MealPlanMeal,
    MealSnapshotExtractRequest,
    MealSnapshotExtractResponse,
    MealsImportRequest,
    MealsImportResponse,
    PatientMealLogCreateRequest,
    PatientMealLogCreateResponse,
    PatientMealLogHistoryResponse,
    PatientMealLogItem,
    PatientMealPlanResponse,
    PatientMealRecommendationRequest,
    PatientMealRecommendationResponse,
)
from app.services.llm_client import get_llm_client
from app.services.meal_import_service import import_meals_from_csv
from app.services.prompt_registry import PromptRegistry
from app.services.rag_manager import get_rag_manager
from app.services.vector_store import VectorStore


router = APIRouter(prefix="/patient-rag", tags=["patient-rag"])


def _resolve_csv_path(csv_path: str) -> Path:
    candidate = Path(csv_path)
    if candidate.is_absolute():
        return candidate
    return Path(__file__).resolve().parents[3] / candidate


def _split_instructions(instructions: str | None) -> list[str]:
    if not instructions:
        return ["Follow standard preparation steps for this meal."]
    lines = [line.strip("- ").strip() for line in instructions.splitlines() if line.strip()]
    return lines if lines else ["Follow standard preparation steps for this meal."]


def _meal_type_for_index(index: int) -> str:
    return ["breakfast", "lunch", "dinner", "snack"][index % 4]


def _nutrition_score(calories: int | None, fiber_g: float | None, sugar_g: float | None) -> int:
    base = 70
    if calories is not None:
        if calories <= 250:
            base += 8
        elif calories <= 450:
            base += 4
        else:
            base -= 6
    if fiber_g is not None:
        base += min(10, int(fiber_g))
    if sugar_g is not None:
        base -= min(12, int(sugar_g / 2))
    return max(1, min(100, base))


def _extract_json_object(raw_text: str) -> dict:
    stripped = (raw_text or "").strip()
    if not stripped:
        return {}
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


def _to_int(value: object, default: int = 0) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _to_float(value: object, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _normalize_meal_type(value: str | None) -> str | None:
    if not value:
        return None
    normalized = value.strip().lower()
    if normalized.startswith("break"):
        return "Breakfast"
    if normalized.startswith("lunch"):
        return "Lunch"
    if normalized.startswith("dinner"):
        return "Dinner"
    if normalized.startswith("snack"):
        return "Snack"
    return value.strip().title()


def _infer_meal_type_from_time(consumed_at: datetime | None) -> str:
    if consumed_at is None:
        return "Dinner"
    hour = consumed_at.hour
    if hour < 11:
        return "Breakfast"
    if hour < 16:
        return "Lunch"
    if hour < 21:
        return "Dinner"
    return "Snack"


def _find_matching_meal_id(db: Session, meal_name: str) -> str | None:
    exact = db.scalar(select(Meals).where(Meals.name == meal_name))
    if exact:
        return exact.id

    partial = db.scalar(select(Meals).where(Meals.name.ilike(f"%{meal_name}%")).limit(1))
    if partial:
        return partial.id

    return None


def _risk_level_from_score(risk_score: float | None) -> str | None:
    if risk_score is None:
        return None
    if risk_score >= 0.7:
        return "High"
    if risk_score >= 0.3:
        return "Medium"
    return "Low"


def _clinician_scope_patient_ids(db: Session, current_user: User) -> list[str]:
    if current_user.role == UserRole.ADMIN:
        return db.scalars(select(User.id).where(User.role == UserRole.PATIENT)).all()
    return db.scalars(
        select(ClinicianPatientList.patient_id).where(ClinicianPatientList.clinician_id == current_user.id)
    ).all()


def _fallback_match_ids(query: str, available_patients: list[dict[str, object]]) -> list[str]:
    q = query.lower()
    ids: list[str] = []

    for patient in available_patients:
        pid = str(patient.get("id") or "")
        if not pid:
            continue

        risk_level = str(patient.get("risk_level") or "").lower()
        adherence = patient.get("adherence")
        alerts_count = int(patient.get("alerts_count") or 0)
        latest_metrics = patient.get("last_metrics") if isinstance(patient.get("last_metrics"), dict) else {}
        glucose = latest_metrics.get("glucose") if isinstance(latest_metrics, dict) else None

        if "high risk" in q and risk_level != "high":
            continue
        if "medium risk" in q and risk_level != "medium":
            continue
        if "low risk" in q and risk_level != "low":
            continue
        if "alert" in q and alerts_count <= 0:
            continue
        if "low adherence" in q and (adherence is None or float(adherence) >= 70):
            continue
        if "high glucose" in q and (glucose is None or float(glucose) < 140):
            continue

        ids.append(pid)

    return ids


@router.post("/admin/import", response_model=MealsImportResponse)
def admin_import_recipes_csv(
    payload: MealsImportRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> MealsImportResponse:
    csv_file = _resolve_csv_path(payload.csv_path)
    result = import_meals_from_csv(db=db, csv_path=csv_file, limit=payload.limit)
    return MealsImportResponse(**result)


@router.post("/admin/generate-embeddings", response_model=EmbeddingGenerateResponse)
def admin_generate_meal_embeddings(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> EmbeddingGenerateResponse:
    rag = get_rag_manager(db)
    meals = db.scalars(select(Meals)).all()

    generated = 0
    for meal in meals:
        text = meal.llm_text or f"{meal.name}. {meal.description or ''}".strip()
        embedding = rag.embedding_service.generate_embedding(text)
        VectorStore.store_meal_embedding(db, meal.id, embedding, llm_text=text)
        generated += 1

    return EmbeddingGenerateResponse(generated=generated)


@router.post("/recommendations", response_model=PatientMealRecommendationResponse)
def patient_recommend_meals(
    payload: PatientMealRecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient),
) -> PatientMealRecommendationResponse:
    onboarding = db.scalar(select(PatientOnboarding).where(PatientOnboarding.user_id == current_user.id))

    preferences = {
        "goal": onboarding.primary_goal if onboarding else None,
        "dietary_preference": ", ".join(onboarding.dietary_restrictions or []) if onboarding else None,
        "cuisine_preference": ", ".join(onboarding.cuisine_preferences or []) if onboarding else None,
        "dietary_constraints": ", ".join(onboarding.prescribed_medications or []) if onboarding else None,
    }
    preferences = {k: v for k, v in preferences.items() if v}

    rag = get_rag_manager(db)
    result = rag.recommend_meals(
        user_query=payload.query,
        user_preferences=preferences,
        include_examples=payload.include_examples,
        include_all_meals=False,
        k_retrieved=payload.k_retrieved,
    )

    if not result.get("retrieved_meals"):
        fallback = VectorStore.search_meals_by_text(db=db, query_text=payload.query, limit=payload.k_retrieved)
        result["retrieved_meals"] = fallback
        result["sources"] = [meal.get("name", "Unknown") for meal in fallback]
        result["num_meals_retrieved"] = len(fallback)

    return PatientMealRecommendationResponse(
        response=result["response"],
        retrievedMeals=result.get("retrieved_meals", []),
        sources=result.get("sources", []),
        numMealsRetrieved=result.get("num_meals_retrieved", 0),
    )


@router.post("/meal-log/extract", response_model=MealSnapshotExtractResponse)
def patient_extract_meal_snapshot(
    payload: MealSnapshotExtractRequest,
    _: User = Depends(get_current_patient),
) -> MealSnapshotExtractResponse:
    if not payload.image_data_url and not payload.transcript and not payload.meal_description:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide an image, voice transcript, or manual description")

    system_prompt = PromptRegistry.get_meal_prompt("snapshot")
    contextual_input = (
        f"input_mode={payload.input_mode}\n"
        f"meal_type_hint={payload.meal_type or 'unknown'}\n"
        f"voice_transcript={payload.transcript or 'N/A'}\n"
        f"manual_description={payload.meal_description or 'N/A'}"
    )

    llm_raw = ""
    if payload.image_data_url:
        try:
            import openai

            from app.core.config import settings

            client = openai.OpenAI(api_key=settings.llm_api_key)
            response = client.chat.completions.create(
                model=settings.llm_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": system_prompt},
                            {"type": "text", "text": contextual_input},
                            {"type": "image_url", "image_url": {"url": payload.image_data_url}},
                        ],
                    }
                ],
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
                    "content": f"{system_prompt}\n\n{contextual_input}",
                }
            ]
        )

    parsed = _extract_json_object(llm_raw)
    meal_name = str(parsed.get("meal_name") or payload.meal_description or payload.transcript or "Meal").strip()
    estimated_calories = max(0, _to_int(parsed.get("estimated_calories"), 0))
    confidence = max(0.0, min(1.0, _to_float(parsed.get("confidence"), 0.6)))
    reasoning = str(parsed.get("reasoning") or "Estimated from the provided meal input.").strip()
    tags_value = parsed.get("tags") if isinstance(parsed.get("tags"), list) else []
    suggested_meal_type = parsed.get("suggested_meal_type") if isinstance(parsed.get("suggested_meal_type"), str) else None

    return MealSnapshotExtractResponse(
        mealName=meal_name,
        estimatedCalories=estimated_calories,
        confidence=confidence,
        reasoning=reasoning,
        tags=[str(tag) for tag in tags_value[:6]],
        suggestedMealType=_normalize_meal_type(suggested_meal_type),
    )


@router.post("/meal-log", response_model=PatientMealLogCreateResponse)
def patient_create_meal_log(
    payload: PatientMealLogCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient),
) -> PatientMealLogCreateResponse:
    consumed_at = datetime.now(UTC)
    if payload.consumed_at:
        try:
            consumed_at = datetime.fromisoformat(payload.consumed_at.replace("Z", "+00:00"))
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid consumedAt format") from exc

    log = MealHistory(
        user_id=current_user.id,
        meal_id=_find_matching_meal_id(db, payload.meal_name),
        calories=payload.calories,
        consumed_at=consumed_at,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    item = PatientMealLogItem(
        id=log.id,
        mealName=payload.meal_name,
        calories=payload.calories,
        mealType=_normalize_meal_type(payload.meal_type),
        source=payload.source,
        confidence=payload.confidence,
        notes=payload.notes,
        consumedAt=log.consumed_at.isoformat(),
    )
    return PatientMealLogCreateResponse(status="saved", item=item)


@router.get("/meal-log/history", response_model=PatientMealLogHistoryResponse)
def patient_meal_log_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient),
) -> PatientMealLogHistoryResponse:
    rows = db.execute(
        select(MealHistory, Meals)
        .outerjoin(Meals, Meals.id == MealHistory.meal_id)
        .where(MealHistory.user_id == current_user.id)
        .order_by(MealHistory.consumed_at.desc())
        .limit(50)
    ).all()

    items: list[PatientMealLogItem] = []
    for history, meal in rows:
        calories = int(history.calories or (meal.calories if meal and meal.calories is not None else 0))
        meal_type = _infer_meal_type_from_time(history.consumed_at)
        items.append(
            PatientMealLogItem(
                id=history.id,
                mealName=(meal.name if meal and meal.name else "Logged meal"),
                calories=calories,
                mealType=meal_type,
                source="history",
                confidence=None,
                notes=None,
                consumedAt=history.consumed_at.isoformat(),
            )
        )

    return PatientMealLogHistoryResponse(items=items)


@router.get("/meal-plan/today", response_model=PatientMealPlanResponse)
def patient_today_meal_plan(
    query: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient),
) -> PatientMealPlanResponse:
    # Simple deterministic daily query seeded by the date for consistent UX.
    effective_query = (query or "balanced diabetic-friendly meals for today").strip()

    rag = get_rag_manager(db)
    result = rag.recommend_meals(
        user_query=effective_query,
        user_preferences={},
        include_examples=True,
        include_all_meals=False,
        k_retrieved=4,
    )

    retrieved = result.get("retrieved_meals", [])
    if not retrieved:
        retrieved = VectorStore.search_meals_by_text(db=db, query_text=effective_query, limit=4)

    meals: list[MealPlanMeal] = []
    for idx, meal in enumerate(retrieved[:4]):
        calories = int(meal.get("calories") or 0)
        carbs = float(meal.get("carbs_g") or 0.0)
        protein = float(meal.get("protein_g") or 0.0)
        fat = float(meal.get("fat_g") or 0.0)
        fiber = float(meal.get("fiber_g") or 0.0) if meal.get("fiber_g") is not None else None
        sugar = float(meal.get("sugar_g") or 0.0) if meal.get("sugar_g") is not None else None

        meals.append(
            MealPlanMeal(
                id=meal.get("meal_id") or f"meal-{idx}",
                type=_meal_type_for_index(idx),
                name=meal.get("name") or "Meal suggestion",
                cuisine=meal.get("cuisine") or meal.get("recipe_category") or "General",
                calories=calories,
                carbs=carbs,
                protein=protein,
                fat=fat,
                instructions=_split_instructions(meal.get("instructions")),
                budget="medium",
                nutritionScore=_nutrition_score(calories=calories, fiber_g=fiber, sugar_g=sugar),
            )
        )

    now = datetime.now(UTC).isoformat()
    return PatientMealPlanResponse(
        id=f"plan-{current_user.id}-{datetime.now(UTC).date().isoformat()}",
        date=datetime.now(UTC).date().isoformat(),
        meals=meals,
        patientId=current_user.id,
        createdAt=now,
        updatedAt=now,
    )


@router.post("/clinician/filter-patients", response_model=ClinicianPatientFilterResponse)
def clinician_filter_patients(
    payload: ClinicianPatientFilterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClinicianPatientFilterResponse:
    if current_user.role == UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Clinician or admin access required")

    allowed_ids = _clinician_scope_patient_ids(db, current_user)
    if not allowed_ids:
        return ClinicianPatientFilterResponse(
            query=payload.query,
            filtersApplied=[],
            reasoning="No patients are currently assigned to this clinician.",
            matchingPatientIds=[],
            matchedPatients=[],
            patientsSearched=0,
        )

    user_rows = db.execute(
        select(User, PatientOnboarding, UserMetrics)
        .outerjoin(PatientOnboarding, PatientOnboarding.user_id == User.id)
        .outerjoin(UserMetrics, UserMetrics.user_id == User.id)
        .where(User.id.in_(allowed_ids), User.role == UserRole.PATIENT)
        .order_by(User.first_name.asc(), User.last_name.asc())
    ).all()

    available_patients: list[dict[str, object]] = []
    patient_lookup: dict[str, ClinicianPatientFilterMatch] = {}

    for user, onboarding, metrics in user_rows:
        latest_reading = db.scalar(
            select(UserHealthReadings)
            .where(UserHealthReadings.user_id == user.id)
            .order_by(UserHealthReadings.timestamp.desc())
            .limit(1)
        )
        alerts_count = db.scalar(
            select(func.count(PatientAlert.id)).where(PatientAlert.patient_id == user.id, PatientAlert.status == "Open")
        ) or 0

        risk_level = _risk_level_from_score(onboarding.baseline_risk_score if onboarding else None)
        full_name = f"{user.first_name} {user.last_name}".strip()

        available_patients.append(
            {
                "id": user.id,
                "name": full_name,
                "risk_level": risk_level,
                "diagnosis": "Diabetes" if onboarding and onboarding.diagnosed_diabetes else "N/A",
                "adherence": (metrics.adherence if metrics else None),
                "alerts_count": alerts_count,
                "last_metrics": {
                    "blood_pressure": (
                        f"{int(latest_reading.systolic_bp)}/{int(latest_reading.diastolic_bp)}"
                        if latest_reading and latest_reading.systolic_bp is not None and latest_reading.diastolic_bp is not None
                        else "N/A"
                    ),
                    "glucose": (latest_reading.glucose if latest_reading else (onboarding.glucose if onboarding else None)),
                    "weight": (onboarding.weight_kg if onboarding else None),
                },
            }
        )

        patient_lookup[user.id] = ClinicianPatientFilterMatch(
            id=user.id,
            firstName=user.first_name,
            lastName=user.last_name,
            email=user.email,
            riskLevel=risk_level,
            adherence=(metrics.adherence if metrics else None),
            alertsCount=int(alerts_count),
        )

    rag = get_rag_manager(db)
    rag_result = rag.filter_patients(clinician_query=payload.query, available_patients=available_patients)

    matching_ids = [pid for pid in rag_result.get("matching_patient_ids", []) if pid in patient_lookup]
    if not matching_ids:
        matching_ids = _fallback_match_ids(payload.query, available_patients)
    if not matching_ids and payload.query.strip().lower() in {"all", "all patients", "show all"}:
        matching_ids = list(patient_lookup.keys())

    matched_patients = [patient_lookup[pid] for pid in matching_ids]

    return ClinicianPatientFilterResponse(
        query=payload.query,
        filtersApplied=rag_result.get("filters_applied", []),
        reasoning=str(rag_result.get("reasoning") or rag_result.get("response") or ""),
        matchingPatientIds=matching_ids,
        matchedPatients=matched_patients,
        patientsSearched=len(available_patients),
    )
