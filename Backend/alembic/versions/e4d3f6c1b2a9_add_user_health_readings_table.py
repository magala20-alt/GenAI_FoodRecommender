"""add user_health_readings table

Revision ID: e4d3f6c1b2a9
Revises: c1f9d26a4b7e
Create Date: 2026-04-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e4d3f6c1b2a9"
down_revision: Union[str, Sequence[str], None] = "c1f9d26a4b7e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_health_readings",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("bmi", sa.Float(), nullable=True),
        sa.Column("systolic_bp", sa.Float(), nullable=True),
        sa.Column("diastolic_bp", sa.Float(), nullable=True),
        sa.Column("heart_rate", sa.Float(), nullable=True),
        sa.Column("glucose", sa.Float(), nullable=True),
        sa.Column("cholesterol_total", sa.Float(), nullable=True),
        sa.Column("hdl_cholesterol", sa.Float(), nullable=True),
        sa.Column("ldl_cholesterol", sa.Float(), nullable=True),
        sa.Column("triglycerides", sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_health_readings_user_id"), "user_health_readings", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_health_readings_user_id"), table_name="user_health_readings")
    op.drop_table("user_health_readings")
