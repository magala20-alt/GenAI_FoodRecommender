"""add glucose to patient_onboarding

Revision ID: c1f9d26a4b7e
Revises: 9a2f4d8d2b11
Create Date: 2026-04-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c1f9d26a4b7e"
down_revision: Union[str, Sequence[str], None] = "9a2f4d8d2b11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("patient_onboarding", sa.Column("glucose", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("patient_onboarding", "glucose")
