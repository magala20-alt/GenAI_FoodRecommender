"""add ai summaries table

Revision ID: d91f8b4e2c3a
Revises: b2fd7a81c9de
Create Date: 2026-04-04 14:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = "d91f8b4e2c3a"
down_revision: Union[str, Sequence[str], None] = "b2fd7a81c9de"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if not inspector.has_table("ai_summaries"):
        op.create_table(
            "ai_summaries",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("patient_id", sa.String(length=36), nullable=False),
            sa.Column("clinician_id", sa.String(length=36), nullable=False),
            sa.Column("risk_score", sa.Float(), nullable=True),
            sa.Column("risk_level", sa.String(length=20), nullable=False),
            sa.Column("summary_text", sa.Text(), nullable=False),
            sa.Column("suggested_actions", sa.Text(), nullable=True),
            sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["patient_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["clinician_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_ai_summaries_clinician_id"), "ai_summaries", ["clinician_id"], unique=False)
        op.create_index(op.f("ix_ai_summaries_generated_at"), "ai_summaries", ["generated_at"], unique=False)
        op.create_index(op.f("ix_ai_summaries_patient_id"), "ai_summaries", ["patient_id"], unique=True)
        op.create_index(op.f("ix_ai_summaries_risk_level"), "ai_summaries", ["risk_level"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ai_summaries_risk_level"), table_name="ai_summaries")
    op.drop_index(op.f("ix_ai_summaries_patient_id"), table_name="ai_summaries")
    op.drop_index(op.f("ix_ai_summaries_generated_at"), table_name="ai_summaries")
    op.drop_index(op.f("ix_ai_summaries_clinician_id"), table_name="ai_summaries")
    op.drop_table("ai_summaries")
