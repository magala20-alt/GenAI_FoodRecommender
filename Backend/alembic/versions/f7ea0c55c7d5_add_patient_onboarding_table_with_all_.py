"""add patient_onboarding table with all fields

Revision ID: f7ea0c55c7d5
Revises: 602a6807f841
Create Date: 2026-03-29 22:32:06.435364

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f7ea0c55c7d5'
down_revision: Union[str, Sequence[str], None] = '602a6807f841'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create patient_onboarding table with all fields
    op.create_table('patient_onboarding',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('gender', sa.String(length=20), nullable=True),
        sa.Column('ethnicity', sa.String(length=50), nullable=True),
        sa.Column('education_level', sa.String(length=100), nullable=True),
        sa.Column('income_level', sa.String(length=50), nullable=True),
        sa.Column('employment_status', sa.String(length=100), nullable=True),
        sa.Column('smoking_status', sa.String(length=50), nullable=True),
        sa.Column('alcohol_consumption_per_week', sa.Float(), nullable=True),
        sa.Column('physical_activity_minutes_per_week', sa.Integer(), nullable=True),
        sa.Column('diet_score', sa.Float(), nullable=True),
        sa.Column('sleep_hours', sa.Float(), nullable=True),
        sa.Column('screen_time', sa.Float(), nullable=True),
        sa.Column('family_history', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('hypertension', sa.Boolean(), nullable=True),
        sa.Column('cardiovascular_history', sa.String(length=120), nullable=True),
        sa.Column('bmi', sa.Float(), nullable=True),
        sa.Column('waist_to_hip_ratio', sa.Float(), nullable=True),
        sa.Column('budget_preference', sa.String(length=20), nullable=False, server_default='medium'),
        sa.Column('country', sa.String(length=120), nullable=True),
        sa.Column('weight_kg', sa.Float(), nullable=True),
        sa.Column('height_cm', sa.Float(), nullable=True),
        sa.Column('bp_systolic', sa.Integer(), nullable=True),
        sa.Column('bp_diastolic', sa.Integer(), nullable=True),
        sa.Column('prescribed_diet', sa.String(length=120), nullable=True),
        sa.Column('primary_goal', sa.String(length=40), nullable=False, server_default='allOfAbove'),
        sa.Column('target_weight_kg', sa.Float(), nullable=True),
        sa.Column('baseline_risk_score', sa.Float(), nullable=True),
        sa.Column('trajectory_type', sa.String(length=50), nullable=True),
        sa.Column('enrollment_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('diagnosed_diabetes', sa.Boolean(), nullable=True),
        sa.Column('heart_rate', sa.Integer(), nullable=True),
        sa.Column('cholesterol_total', sa.Float(), nullable=True),
        sa.Column('hdl_cholesterol', sa.Float(), nullable=True),
        sa.Column('ldl_cholesterol', sa.Float(), nullable=True),
        sa.Column('triglycerides', sa.Float(), nullable=True),
        sa.Column('phone_number', sa.String(length=20), nullable=True),
        sa.Column('emergency_contact_full_name', sa.String(length=255), nullable=True),
        sa.Column('emergency_contact_relationship', sa.String(length=100), nullable=True),
        sa.Column('emergency_contact_phone', sa.String(length=20), nullable=True),
        sa.Column('cuisine_preferences', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('dietary_restrictions', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('prescribed_medications', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('preferred_cuisines', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('diet_goals', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('calorie_target', sa.Integer(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patient_onboarding_user_id'), 'patient_onboarding', ['user_id'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_patient_onboarding_user_id'), table_name='patient_onboarding')
    op.drop_table('patient_onboarding')
