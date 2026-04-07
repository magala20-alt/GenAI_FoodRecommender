"""
Import patient data from CSV into users and patient_onboarding tables.
Usage: python import_patients.py <path_to_csv>
"""
import csv
import sys
from datetime import datetime
from uuid import uuid4

from sqlalchemy import select

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.patient_onboarding import PatientOnboarding


def extract_name_from_email(email: str) -> tuple[str, str]:
    """Extract first and last name from email address.
    Example: sarah.johnson@email.com -> ('Sarah', 'Johnson')
    Fallback: use email prefix if format doesn't match.
    """
    try:
        local_part = email.split("@")[0]
        parts = local_part.split(".")
        if len(parts) >= 2:
            first_name = parts[0].capitalize()
            last_name = parts[1].capitalize()
            return first_name, last_name
    except Exception:
        pass
    # Fallback
    return "Patient", email.split("@")[0].capitalize()


def csv_to_bool(value: str | int) -> bool | None:
    """Convert CSV string/int to boolean. '0' or 0 -> False, '1' or 1 -> True."""
    if value == "" or value is None:
        return None
    try:
        return bool(int(value))
    except (ValueError, TypeError):
        return None


def csv_to_float(value: str | float) -> float | None:
    """Convert CSV string to float, return None if empty/invalid."""
    if value == "" or value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def csv_to_int(value: str | int) -> int | None:
    """Convert CSV string to int, return None if empty/invalid."""
    if value == "" or value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def parse_enrollment_date(date_str: str) -> datetime | None:
    """Parse enrollment date from CSV."""
    if not date_str or date_str == "":
        return None
    for date_format in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(date_str, date_format)
        except ValueError:
            continue
    print(f"Warning: Could not parse date '{date_str}', skipping.")
    return None


def import_patients(csv_path: str) -> None:
    """Import patient data from CSV into database."""
    db = SessionLocal()
    imported_count = 0
    skipped_count = 0

    try:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                try:
                    email = row.get("Email", "").strip() or row.get("email", "").strip()
                    name_source_email = email
                    
                    # Validate email is present
                    if not email:
                        print(f"Row {row_num}: Skipped - no email provided")
                        skipped_count += 1
                        continue
                    
                    # Check if user already exists
                    existing_user = db.scalar(select(User).where(User.email == email))
                    if existing_user:
                        print(f"Row {row_num}: Skipped - user with email '{email}' already exists")
                        skipped_count += 1
                        continue
                    
                    # Extract name from the source email field when available.
                    first_name, last_name = extract_name_from_email(name_source_email)
                    
                    # Create user record
                    user = User(
                        id=str(uuid4()),
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        role=UserRole.PATIENT,
                        password_hash=get_password_hash("TempPassword123!"),  # Temp password; patient should change on first login
                        must_change_password=True,
                        is_active=True,
                    )
                    db.add(user)
                    db.flush()  # Flush to get the user ID before creating onboarding
                    
                    # Create patient onboarding record
                    onboarding = PatientOnboarding(
                        id=str(uuid4()),
                        user_id=user.id,
                        age=csv_to_int(row.get("age")),
                        gender=row.get("gender", "").strip() or None,
                        ethnicity=row.get("ethnicity", "").strip() or None,
                        education_level=row.get("education_level", "").strip() or None,
                        income_level=row.get("income_level", "").strip() or None,
                        employment_status=row.get("employment_status", "").strip() or None,
                        smoking_status=row.get("smoking_status", "").strip() or None,
                        alcohol_consumption_per_week=csv_to_float(row.get("alcohol_consumption_per_week")),
                        physical_activity_minutes_per_week=csv_to_int(row.get("physical_activity_minutes_per_week")),
                        diet_score=csv_to_float(row.get("diet_score")),
                        sleep_hours=csv_to_float(row.get("sleep_hours_per_day")),
                        screen_time=csv_to_float(row.get("screen_time_hours_per_day")),
                        family_history=[v.strip() for v in row.get("family_history_diabetes", "").split(";") if v.strip()] or [],
                        hypertension=csv_to_bool(row.get("hypertension_history")),
                        cardiovascular_history=row.get("cardiovascular_history", "").strip() or None,
                        bmi=csv_to_float(row.get("bmi")),
                        waist_to_hip_ratio=csv_to_float(row.get("waist_to_hip_ratio")),
                        bp_systolic=csv_to_int(row.get("systolic_bp")),
                        bp_diastolic=csv_to_int(row.get("diastolic_bp")),
                        heart_rate=csv_to_int(row.get("heart_rate")),
                        cholesterol_total=csv_to_float(row.get("cholesterol_total")),
                        hdl_cholesterol=csv_to_float(row.get("hdl_cholesterol")),
                        ldl_cholesterol=csv_to_float(row.get("ldl_cholesterol")),
                        triglycerides=csv_to_float(row.get("triglycerides")),
                        glucose=csv_to_float(row.get("glucose")),
                        baseline_risk_score=csv_to_float(row.get("baseline_risk_score")),
                        trajectory_type=row.get("trajectory_type", "").strip() or None,
                        enrollment_date=parse_enrollment_date(row.get("enrollment_date", "").strip()),
                        diagnosed_diabetes=csv_to_bool(row.get("diagnosed_diabetes")),
                        phone_number=row.get("phone_number", "").strip() or None,
                        country=row.get("country", "").strip() or None,
                        emergency_contact_full_name=row.get("emergency_contact_full_name", "").strip() or None,
                        emergency_contact_relationship=row.get("emergency_contact_relationship", "").strip() or None,
                        emergency_contact_phone=row.get("emergency_contact_phone", "").strip() or None,
                    )
                    db.add(onboarding)
                    imported_count += 1
                    print(f"Row {row_num}: Imported patient {email}")
                
                except Exception as e:
                    print(f"Row {row_num}: Error - {str(e)}")
                    skipped_count += 1
                    db.rollback()
                    continue
        
        # Commit all changes
        db.commit()
        print(f"\nSUCCESS: Imported {imported_count} patients")
        if skipped_count > 0:
            print(f"WARNING: Skipped {skipped_count} rows")
    
    except FileNotFoundError:
        print(f"Error: File '{csv_path}' not found")
        sys.exit(1)
    except Exception as e:
        print(f"Error during import: {str(e)}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_patients.py <path_to_csv>")
        print("Example: python import_patients.py datasets/patients.csv")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    import_patients(csv_file)
