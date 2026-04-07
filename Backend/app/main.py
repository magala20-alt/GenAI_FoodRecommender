from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.onboarding import router as onboarding_router
from app.api.routes.patient_rag import router as patient_rag_router
from app.api.routes.patients import router as patients_router
from app.core.config import settings
from app.db.seed import bootstrap_database

# This is the main application file for the CareSync backend. 
# It sets up the FastAPI app, includes API routes, and initializes the database on startup.

@asynccontextmanager
async def lifespan(_: FastAPI):
    bootstrap_database() # Create tables and seed demo data on startup
    yield

# Initialize the FastAPI app with the specified title and lifespan function
app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers for health checks, authentication, onboarding, and clinician patient views.
app.include_router(health_router, prefix=settings.api_v1_prefix)
app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(onboarding_router, prefix=settings.api_v1_prefix)
app.include_router(patients_router, prefix=settings.api_v1_prefix)
app.include_router(patient_rag_router, prefix=settings.api_v1_prefix)
