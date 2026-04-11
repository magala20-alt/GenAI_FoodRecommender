"""add meal_name to meal_history

Revision ID: d4f8bc9e5a21
Revises: d91f8b4e2c3a
Create Date: 2026-04-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4f8bc9e5a21'
down_revision: Union[str, Sequence[str], None] = '1a2b3c4d5e6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('meal_history', sa.Column('meal_name', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('meal_history', 'meal_name')