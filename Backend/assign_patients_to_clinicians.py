"""Assign patients evenly across clinician accounts.

Usage:
  python assign_patients_to_clinicians.py
  python assign_patients_to_clinicians.py --clinician-emails a@x.com b@y.com

Behavior:
- Loads all patient users.
- Loads clinician users (or the subset provided via --clinician-emails).
- Clears existing clinician_patient_list rows for those patients.
- Reassigns patients in round-robin order for an even split.
"""

from __future__ import annotations

import argparse
from collections import defaultdict

from sqlalchemy import delete, select

from app.db.session import SessionLocal
from app.models.clinician_patient_list import ClinicianPatientList
from app.models.user import User, UserRole


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Assign patients evenly across clinicians")
    parser.add_argument(
        "--clinician-emails",
        nargs="*",
        default=None,
        help="Optional list of clinician emails to use for assignment",
    )
    return parser.parse_args()


def assign_patients_evenly(clinician_emails: list[str] | None = None) -> None:
    with SessionLocal() as db:
        patient_stmt = select(User).where(User.role == UserRole.PATIENT).order_by(User.email.asc())
        patients = list(db.scalars(patient_stmt))

        if not patients:
            print("No patient users found. Nothing to assign.")
            return

        clinician_stmt = select(User).where(User.role == UserRole.CLINICIAN).order_by(User.email.asc())
        clinicians = list(db.scalars(clinician_stmt))

        if clinician_emails:
            clinician_email_set = {email.strip().lower() for email in clinician_emails if email.strip()}
            clinicians = [c for c in clinicians if c.email.lower() in clinician_email_set]

        if len(clinicians) < 2:
            print("Need at least 2 clinician accounts to divide patients between them.")
            print(f"Clinicians found: {len(clinicians)}")
            return

        patient_ids = [p.id for p in patients]

        # Reset prior assignments for these patients to avoid duplicates.
        db.execute(delete(ClinicianPatientList).where(ClinicianPatientList.patient_id.in_(patient_ids)))

        assigned_counts: dict[str, int] = defaultdict(int)
        links: list[ClinicianPatientList] = []

        for index, patient in enumerate(patients):
            clinician = clinicians[index % len(clinicians)]
            links.append(
                ClinicianPatientList(
                    clinician_id=clinician.id,
                    patient_id=patient.id,
                )
            )
            assigned_counts[clinician.email] += 1

        db.add_all(links)
        db.commit()

        print("Assignment completed.")
        print(f"Total patients assigned: {len(patients)}")
        print("Distribution:")
        for clinician in clinicians:
            print(f"- {clinician.email}: {assigned_counts.get(clinician.email, 0)} patients")


def main() -> None:
    args = parse_args()
    assign_patients_evenly(args.clinician_emails)


if __name__ == "__main__":
    main()
