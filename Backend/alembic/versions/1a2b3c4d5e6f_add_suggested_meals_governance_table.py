"""add suggested meals governance table

Revision ID: 1a2b3c4d5e6f
Revises: 0d7c1d2e9b44
Create Date: 2026-04-09 10:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = "1a2b3c4d5e6f"
down_revision: Union[str, Sequence[str], None] = "0d7c1d2e9b44"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if not inspector.has_table("suggested_meals"):
        op.create_table(
            "suggested_meals",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("cuisine", sa.String(length=120), nullable=True),
            sa.Column("calories", sa.Integer(), nullable=True),
            sa.Column("protein_g", sa.Float(), nullable=True),
            sa.Column("carbs_g", sa.Float(), nullable=True),
            sa.Column("fat_g", sa.Float(), nullable=True),
            sa.Column("prep_time_minutes", sa.Integer(), nullable=True),
            sa.Column("cook_time_minutes", sa.Integer(), nullable=True),
            sa.Column("ingredients", sa.Text(), nullable=True),
            sa.Column("instructions", sa.Text(), nullable=True),
            sa.Column("source_query", sa.Text(), nullable=False),
            sa.Column("user_id", sa.String(length=36), nullable=True),
            sa.Column("model_name", sa.String(length=100), nullable=False, server_default="gemini-2.5-flash"),
            sa.Column("llm_confidence", sa.Float(), nullable=False, server_default="0.7"),
            sa.Column("status", sa.Enum("pending", "approved", "rejected", "promoted", name="suggestedmealstatus"), nullable=False, server_default="pending"),
            sa.Column("approval_reason", sa.Text(), nullable=True),
            sa.Column("approved_by_user_id", sa.String(length=36), nullable=True),
            sa.Column("promoted_meal_id", sa.String(length=36), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["approved_by_user_id"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_suggested_meals_approved_at"), "suggested_meals", ["approved_at"], unique=False)
        op.create_index(op.f("ix_suggested_meals_created_at"), "suggested_meals", ["created_at"], unique=False)
        op.create_index(op.f("ix_suggested_meals_name"), "suggested_meals", ["name"], unique=False)
        op.create_index(op.f("ix_suggested_meals_status"), "suggested_meals", ["status"], unique=False)
        op.create_index(op.f("ix_suggested_meals_user_id"), "suggested_meals", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_suggested_meals_user_id"), table_name="suggested_meals")
    op.drop_index(op.f("ix_suggested_meals_status"), table_name="suggested_meals")
    op.drop_index(op.f("ix_suggested_meals_name"), table_name="suggested_meals")
    op.drop_index(op.f("ix_suggested_meals_created_at"), table_name="suggested_meals")
    op.drop_index(op.f("ix_suggested_meals_approved_at"), table_name="suggested_meals")
    op.drop_table("suggested_meals")
