"""Bulk backfill baseline diabetes risk scores for patient onboarding records.

Usage examples:
  python backfill_patient_risk_scores.py
  python backfill_patient_risk_scores.py --all
  python backfill_patient_risk_scores.py --threshold 0.35

By default, only patients with null baseline_risk_score are processed.
"""

from __future__ import annotations

import argparse
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.patient_alert import PatientAlert
from app.models.patient_onboarding import PatientOnboarding
from app.models.user import User, UserRole
from app.models.userHealth_metrics import UserHealthReadings
from app.models.user_metrics import UserMetrics
from app.services.alerts import _fallback_reason as _alert_fallback_reason
from app.services.alerts import _llm_reason as _alert_llm_reason
from app.services.diabetes_risk import score_patient_risk_on_login


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Backfill patient baseline risk scores using the trained model"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Recompute risk for all patients with onboarding data, not only missing scores",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.3,
        help="Diagnosis threshold used when persisting diagnosed_diabetes (default: 0.3)",
    )
    parser.add_argument(
        "--sync-alerts",
        action="store_true",
        help="Create or update patient_alerts rows from the computed risk scores",
    )
    parser.add_argument(
        "--alert-threshold",
        type=float,
        default=0.3,
        help="Minimum risk score required before an alert row is written (default: 0.3)",
    )
    return parser.parse_args()


def _patient_query(process_all: bool):
    stmt = (
        select(User)
        .join(PatientOnboarding, PatientOnboarding.user_id == User.id)
        .where(User.role == UserRole.PATIENT)
        .order_by(User.email.asc())
    )

    if process_all:
        return stmt

    return stmt.where(PatientOnboarding.baseline_risk_score.is_(None))


def _severity_for_score(risk_score: float) -> str:
    if risk_score >= 0.7:
        return "High"
    if risk_score >= 0.3:
        return "Medium"
    return "Low"


def _build_llm_reason(db, user_id: str) -> str:
    onboarding = db.scalar(select(PatientOnboarding).where(PatientOnboarding.user_id == user_id))
    metrics = db.scalar(select(UserMetrics).where(UserMetrics.user_id == user_id))
    latest = db.scalar(
        select(UserHealthReadings)
        .where(UserHealthReadings.user_id == user_id)
        .order_by(UserHealthReadings.timestamp.desc())
        .limit(1)
    )

    if onboarding is None:
        return "Risk score was backfilled from the model."

    try:
        return _alert_llm_reason(onboarding, metrics, latest)
    except Exception:
        return _alert_fallback_reason(onboarding, metrics)


def _sync_alert_for_patient(db, user: User, alert_threshold: float) -> bool:
    onboarding = db.scalar(select(PatientOnboarding).where(PatientOnboarding.user_id == user.id))
    if onboarding is None or onboarding.baseline_risk_score is None:
        return False

    if onboarding.baseline_risk_score < alert_threshold:
        return False

    severity = _severity_for_score(onboarding.baseline_risk_score)
    existing_alert = db.scalar(
        select(PatientAlert)
        .where(
            PatientAlert.patient_id == user.id,
            PatientAlert.alert_type == "High risk score",
            PatientAlert.status == "Open",
        )
        .order_by(PatientAlert.created_at.desc())
        .limit(1)
    )

    message = "Backfilled risk score alert"
    reason = _build_llm_reason(db, user.id)

    if existing_alert:
        existing_alert.severity = severity
        existing_alert.alert_message = message
        existing_alert.llm_reason = reason
        existing_alert.risk_score_snapshot = onboarding.baseline_risk_score
        existing_alert.updated_at = datetime.now(UTC)
        db.add(existing_alert)
    else:
        db.add(
            PatientAlert(
                id=str(uuid4()),
                patient_id=user.id,
                alert_type="risk_score_backfill",
                severity=severity,
                alert_message=message,
                llm_reason=reason,
                risk_score_snapshot=onboarding.baseline_risk_score,
                status="Open",
                created_at=datetime.now(UTC),
            )
        )

    db.commit()
    return True


def backfill_patient_risk_scores(process_all: bool, threshold: float, sync_alerts: bool, alert_threshold: float) -> None:
    with SessionLocal() as db:
        patients = list(db.scalars(_patient_query(process_all)))

        if not patients:
            scope = "all patients" if process_all else "patients with null risk scores"
            print(f"No {scope} found. Nothing to backfill.")
            return

        processed = 0
        updated = 0
        alerts_written = 0
        failed = 0

        print(f"Starting backfill for {len(patients)} patient(s)...")
        for user in patients:
            processed += 1
            before = db.scalar(
                select(PatientOnboarding.baseline_risk_score).where(PatientOnboarding.user_id == user.id)
            )

            try:
                score_patient_risk_on_login(db=db, user=user, threshold=threshold)
                after = db.scalar(
                    select(PatientOnboarding.baseline_risk_score).where(PatientOnboarding.user_id == user.id)
                )
                if after is not None and (before is None or process_all):
                    updated += 1

                if sync_alerts and after is not None:
                    if _sync_alert_for_patient(db=db, user=user, alert_threshold=alert_threshold):
                        alerts_written += 1

                print(f"[{processed}/{len(patients)}] {user.email}: {before} -> {after}")
            except Exception as exc:  # noqa: BLE001 - keep one failure from stopping bulk run
                failed += 1
                db.rollback()
                print(f"[{processed}/{len(patients)}] {user.email}: failed ({exc})")

        print("\nBackfill complete")
        print(f"Processed: {processed}")
        print(f"Updated:   {updated}")
        print(f"Alerts:    {alerts_written}")
        print(f"Failed:    {failed}")


def main() -> None:
    args = parse_args()
    backfill_patient_risk_scores(
        process_all=args.all,
        threshold=args.threshold,
        sync_alerts=args.sync_alerts,
        alert_threshold=args.alert_threshold,
    )


if __name__ == "__main__":
    main()
