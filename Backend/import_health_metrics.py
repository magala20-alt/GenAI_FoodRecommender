"""Import health metrics CSV into user_health_readings.

Usage:
    python import_health_metrics.py <health_metrics_csv_path> [patients_csv_path]

Example:
    python import_health_metrics.py datasets/health_metrics_all_patients.csv datasets/patients.csv
"""

import csv
import sys
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import delete, select

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.userHealth_metrics import UserHealthReadings


def csv_to_float(value: str) -> float | None:
    if value is None:
        return None
    cleaned = str(value).strip()
    if cleaned == "":
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def load_patient_email_map(patients_csv_path: str) -> dict[str, str]:
    patient_email_map: dict[str, str] = {}
    with open(patients_csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            patient_id = (row.get("patient_id") or "").strip()
            email = (row.get("Email") or row.get("email") or "").strip()
            if patient_id and email:
                patient_email_map[patient_id] = email
    return patient_email_map


def import_health_metrics(health_csv_path: str, patients_csv_path: str) -> None:
    db = SessionLocal()
    inserted_count = 0
    skipped_count = 0

    try:
        patient_email_map = load_patient_email_map(patients_csv_path)

        users = db.scalars(select(User).where(User.role == UserRole.PATIENT)).all()
        user_id_by_email = {u.email.strip().lower(): u.id for u in users}

        user_ids_for_refresh: set[str] = set()
        staged_rows: list[UserHealthReadings] = []

        with open(health_csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row_num, row in enumerate(reader, start=2):
                patient_id = (row.get("patient_id") or "").strip()
                source_email = patient_email_map.get(patient_id, "")
                user_id = user_id_by_email.get(source_email.lower()) if source_email else None

                if not user_id:
                    skipped_count += 1
                    print(f"Row {row_num}: Skipped - no patient user match for patient_id '{patient_id}'")
                    continue

                date_value = (row.get("date") or "").strip()
                try:
                    ts = datetime.strptime(date_value, "%Y-%m-%d").replace(tzinfo=UTC)
                except ValueError:
                    skipped_count += 1
                    print(f"Row {row_num}: Skipped - invalid date '{date_value}'")
                    continue

                reading = UserHealthReadings(
                    id=str(uuid4()),
                    user_id=user_id,
                    timestamp=ts,
                    bmi=csv_to_float(row.get("bmi")),
                    systolic_bp=csv_to_float(row.get("systolic_bp")),
                    diastolic_bp=csv_to_float(row.get("diastolic_bp")),
                    heart_rate=csv_to_float(row.get("heart_rate")),
                    glucose=csv_to_float(row.get("glucose")),
                    cholesterol_total=csv_to_float(row.get("cholesterol_total")),
                    hdl_cholesterol=csv_to_float(row.get("hdl_cholesterol")),
                    ldl_cholesterol=csv_to_float(row.get("ldl_cholesterol")),
                    triglycerides=csv_to_float(row.get("triglycerides")),
                )
                staged_rows.append(reading)
                user_ids_for_refresh.add(user_id)

        if user_ids_for_refresh:
            db.execute(delete(UserHealthReadings).where(UserHealthReadings.user_id.in_(user_ids_for_refresh)))

        db.add_all(staged_rows)
        inserted_count = len(staged_rows)

        db.commit()
        print(f"SUCCESS: Imported {inserted_count} health metric rows")
        if skipped_count:
            print(f"WARNING: Skipped {skipped_count} rows")

    except FileNotFoundError as exc:
        db.rollback()
        print(f"Error: file not found - {exc}")
        sys.exit(1)
    except Exception as exc:
        db.rollback()
        print(f"Error during import: {exc}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_health_metrics.py <health_metrics_csv_path> [patients_csv_path]")
        sys.exit(1)

    health_csv = sys.argv[1]
    patients_csv = sys.argv[2] if len(sys.argv) > 2 else "datasets/patients.csv"
    import_health_metrics(health_csv, patients_csv)
