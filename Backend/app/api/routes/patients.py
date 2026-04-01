from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.clinician_patient_list import ClinicianPatientList
from app.models.patient_onboarding import PatientOnboarding
from app.models.user import User, UserRole
from app.schemas.patients import ClinicianPatientListItem, ClinicianPatientProfile


router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=list[ClinicianPatientListItem])
def get_clinician_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ClinicianPatientListItem]:
    if current_user.role == UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Clinician or admin access required")

    if current_user.role == UserRole.ADMIN:
        stmt = (
            select(User, PatientOnboarding)
            .outerjoin(PatientOnboarding, PatientOnboarding.user_id == User.id)
            .where(User.role == UserRole.PATIENT)
            .order_by(User.first_name.asc(), User.last_name.asc())
        )
        rows = db.execute(stmt).all()
    else:
        stmt = (
            select(User, PatientOnboarding)
            .join(ClinicianPatientList, ClinicianPatientList.patient_id == User.id)
            .outerjoin(PatientOnboarding, PatientOnboarding.user_id == User.id)
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
            riskLevel=None,
            adherence=None,
            alerts=None,
        )
        for user, onboarding in rows
    ]


@router.get("/{patient_id}", response_model=ClinicianPatientProfile)
def get_patient_profile(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClinicianPatientProfile:
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

    onboarding = db.scalar(select(PatientOnboarding).where(PatientOnboarding.user_id == patient_id))

    return ClinicianPatientProfile(
        id=patient.id,
        firstName=patient.first_name,
        lastName=patient.last_name,
        email=patient.email,
        age=onboarding.age if onboarding else None,
        gender=onboarding.gender if onboarding else None,
        riskLevel=None,
        adherence=None,
        alerts=None,
        onboardedDate=onboarding.completed_at if onboarding else None,
        calorieTarget=onboarding.calorie_target if onboarding else None,
        primaryGoal=onboarding.primary_goal if onboarding else None,
        budgetPreference=onboarding.budget_preference if onboarding else None,
        country=onboarding.country if onboarding else None,
        weightKg=onboarding.weight_kg if onboarding else None,
        heightCm=onboarding.height_cm if onboarding else None,
        bpSystolic=onboarding.bp_systolic if onboarding else None,
        bpDiastolic=onboarding.bp_diastolic if onboarding else None,
        heartRate=onboarding.heart_rate if onboarding else None,
        cholesterolTotal=onboarding.cholesterol_total if onboarding else None,
        hdlCholesterol=onboarding.hdl_cholesterol if onboarding else None,
        ldlCholesterol=onboarding.ldl_cholesterol if onboarding else None,
        triglycerides=onboarding.triglycerides if onboarding else None,
        phoneNumber=onboarding.phone_number if onboarding else None,
        emergencyContactFullName=onboarding.emergency_contact_full_name if onboarding else None,
        emergencyContactRelationship=onboarding.emergency_contact_relationship if onboarding else None,
        emergencyContactPhone=onboarding.emergency_contact_phone if onboarding else None,
        cuisinePreferences=onboarding.cuisine_preferences if onboarding else [],
        dietaryRestrictions=onboarding.dietary_restrictions if onboarding else [],
        prescribedMedications=onboarding.prescribed_medications if onboarding else [],
    )
