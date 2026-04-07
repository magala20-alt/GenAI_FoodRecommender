from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.patient_alert import PatientAlert
from app.models.patient_onboarding import PatientOnboarding
from app.models.user_metrics import UserMetrics
from app.models.userHealth_metrics import UserHealthReadings
from app.services.llm_client import get_llm_client


HIGH_RISK_THRESHOLD = 0.7


def _fallback_reason(onboarding: PatientOnboarding, metrics: UserMetrics | None) -> str:
    reasons: list[str] = []
    if metrics and metrics.adherence is not None and metrics.adherence < 50:
        reasons.append(f"low adherence at {metrics.adherence:.1f}%")
    if onboarding.glucose is not None and onboarding.glucose >= 140:
        reasons.append("elevated glucose")
    if onboarding.bp_systolic is not None and onboarding.bp_systolic >= 140:
        reasons.append("elevated systolic blood pressure")
    if not reasons:
        reasons.append("risk factors in recent patient profile")
    return ", ".join(reasons)


def _llm_reason(onboarding: PatientOnboarding, metrics: UserMetrics | None, latest: UserHealthReadings | None) -> str:
    llm_client = get_llm_client()
    risk = onboarding.baseline_risk_score
    context = (
        f"Risk score: {risk}\n"
        f"Adherence: {metrics.adherence if metrics and metrics.adherence is not None else 'N/A'}\n"
        f"Meals logged: {metrics.total_meals_logged if metrics else 'N/A'}\n"
        f"Streak: {metrics.streak if metrics else 'N/A'}\n"
        f"Glucose: {latest.glucose if latest and latest.glucose is not None else onboarding.glucose}\n"
        f"Systolic BP: {latest.systolic_bp if latest and latest.systolic_bp is not None else onboarding.bp_systolic}\n"
        f"BMI: {latest.bmi if latest and latest.bmi is not None else onboarding.bmi}\n"
    )
    prompt = (
        "Explain in one concise sentence why this diabetes patient has high risk. "
        "Focus on measurable factors and avoid recommendations.\n\n"
        f"{context}"
    )
    return llm_client.call(messages=[{"role": "user", "content": prompt}]).strip()


def ensure_high_risk_alert(db: Session, patient_id: str) -> PatientAlert | None:
    onboarding = db.scalar(select(PatientOnboarding).where(PatientOnboarding.user_id == patient_id))
    if onboarding is None or onboarding.baseline_risk_score is None:
        return None

    if onboarding.baseline_risk_score < HIGH_RISK_THRESHOLD:
        return None

    open_alert = db.scalar(
        select(PatientAlert)
        .where(
            PatientAlert.patient_id == patient_id,
            PatientAlert.alert_type == "high_risk_score",
            PatientAlert.status == "Open",
        )
        .order_by(PatientAlert.created_at.desc())
        .limit(1)
    )

    if open_alert:
        # Keep the current alert up-to-date when risk changes.
        open_alert.risk_score_snapshot = onboarding.baseline_risk_score
        db.add(open_alert)
        db.commit()
        db.refresh(open_alert)
        return open_alert

    metrics = db.scalar(select(UserMetrics).where(UserMetrics.user_id == patient_id))
    latest = db.scalar(
        select(UserHealthReadings)
        .where(UserHealthReadings.user_id == patient_id)
        .order_by(UserHealthReadings.timestamp.desc())
        .limit(1)
    )

    try:
        reason = _llm_reason(onboarding, metrics, latest)
    except Exception:
        reason = _fallback_reason(onboarding, metrics)

    alert = PatientAlert(
        patient_id=patient_id,
        alert_type="high_risk_score",
        severity="High",
        alert_message="High risk score detected",
        llm_reason=reason,
        risk_score_snapshot=onboarding.baseline_risk_score,
        status="Open",
        created_at=datetime.now(UTC),
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert
