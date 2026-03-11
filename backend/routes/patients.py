from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Patient, Clinician


router = APIRouter(prefix="/patients")

# function to open database
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/newPatient")
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):

    new_patient = models.Patient(
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        allergies=patient.allergies,
        conditions=patient.conditions
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return {"message": "Patient created"}