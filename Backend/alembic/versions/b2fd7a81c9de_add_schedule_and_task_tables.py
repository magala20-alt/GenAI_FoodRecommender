"""add schedule and task tables

Revision ID: b2fd7a81c9de
Revises: 46a5543419fd
Create Date: 2026-04-04 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = "b2fd7a81c9de"
down_revision: Union[str, Sequence[str], None] = "46a5543419fd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if not inspector.has_table("schedules"):
        op.create_table(
            "schedules",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("patient_id", sa.String(length=36), nullable=False),
            sa.Column("schedule_data", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["patient_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_schedules_patient_id"), "schedules", ["patient_id"], unique=False)

    if not inspector.has_table("tasks"):
        op.create_table(
            "tasks",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("clinician_id", sa.String(length=36), nullable=False),
            sa.Column("task_type", sa.String(length=80), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("status", sa.String(length=20), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["clinician_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_tasks_clinician_id"), "tasks", ["clinician_id"], unique=False)
        op.create_index(op.f("ix_tasks_created_at"), "tasks", ["created_at"], unique=False)
        op.create_index(op.f("ix_tasks_status"), "tasks", ["status"], unique=False)
        op.create_index(op.f("ix_tasks_task_type"), "tasks", ["task_type"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_tasks_task_type"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_status"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_created_at"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_clinician_id"), table_name="tasks")
    op.drop_table("tasks")

    op.drop_index(op.f("ix_schedules_patient_id"), table_name="schedules")
    op.drop_table("schedules")
