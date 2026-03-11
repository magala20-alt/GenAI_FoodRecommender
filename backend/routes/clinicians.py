from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
import models, schemas
from auth import verify_password

router = APIRouter(prefix="/auth")

# function to open database
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# function to handle login from the backend
@router.post("/login")
def login(data: schemas.ClinicianLogin, db: Session = Depends(get_db)):

    clinician = db.query(models.Clinician).filter(
        models.Clinician.email == data.email
    ).first()

    if not clinician:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, clinician.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {"message": "Login successful"}