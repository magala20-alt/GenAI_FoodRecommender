"""expand meals for csv and rag

Revision ID: 31f44c0d7a99
Revises: 0d7c1d2e9b44
Create Date: 2026-04-04 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "31f44c0d7a99"
down_revision: Union[str, Sequence[str], None] = "1a2b3c4d5e6f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("meals", sa.Column("source_recipe_id", sa.String(length=50), nullable=True))
    op.add_column("meals", sa.Column("recipe_category", sa.String(length=120), nullable=True))
    op.add_column("meals", sa.Column("keywords", sa.Text(), nullable=True))
    op.add_column("meals", sa.Column("ingredients", sa.Text(), nullable=True))
    op.add_column("meals", sa.Column("instructions", sa.Text(), nullable=True))
    op.add_column("meals", sa.Column("image_url", sa.Text(), nullable=True))
    op.add_column("meals", sa.Column("servings", sa.Float(), nullable=True))
    op.add_column("meals", sa.Column("cook_time_minutes", sa.Integer(), nullable=True))
    op.add_column("meals", sa.Column("saturated_fat_g", sa.Float(), nullable=True))
    op.add_column("meals", sa.Column("cholesterol_mg", sa.Float(), nullable=True))
    op.add_column("meals", sa.Column("sodium_mg", sa.Float(), nullable=True))
    op.add_column("meals", sa.Column("fiber_g", sa.Float(), nullable=True))
    op.add_column("meals", sa.Column("sugar_g", sa.Float(), nullable=True))
    op.add_column("meals", sa.Column("total_time_minutes", sa.Integer(), nullable=True))

    op.create_index("ix_meals_source_recipe_id", "meals", ["source_recipe_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_meals_source_recipe_id", table_name="meals")

    op.drop_column("meals", "total_time_minutes")
    op.drop_column("meals", "sugar_g")
    op.drop_column("meals", "fiber_g")
    op.drop_column("meals", "sodium_mg")
    op.drop_column("meals", "cholesterol_mg")
    op.drop_column("meals", "saturated_fat_g")
    op.drop_column("meals", "cook_time_minutes")
    op.drop_column("meals", "servings")
    op.drop_column("meals", "image_url")
    op.drop_column("meals", "instructions")
    op.drop_column("meals", "ingredients")
    op.drop_column("meals", "keywords")
    op.drop_column("meals", "recipe_category")
    op.drop_column("meals", "source_recipe_id")
