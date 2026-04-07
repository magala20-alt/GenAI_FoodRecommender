from __future__ import annotations

import ast
import csv
import html
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.meals import Meals


def _to_float(value: str | None) -> float | None:
    if value is None:
        return None
    raw = str(value).strip()
    if not raw:
        return None
    try:
        return float(raw)
    except ValueError:
        return None


def _to_int(value: str | None) -> int | None:
    numeric = _to_float(value)
    return int(numeric) if numeric is not None else None


def _as_clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    raw = html.unescape(str(value)).strip()
    return raw or None


def _stringify_listish(value: str | None) -> str | None:
    clean = _as_clean_text(value)
    if not clean:
        return None

    try:
        parsed = ast.literal_eval(clean)
        if isinstance(parsed, list):
            items = [str(item).strip() for item in parsed if str(item).strip()]
            return "\n".join(items) if items else None
    except (ValueError, SyntaxError):
        pass

    return clean


def _build_llm_text(
    name: str,
    category: str | None,
    description: str | None,
    ingredients: str | None,
    keywords: str | None,
    instructions: str | None,
) -> str:
    blocks: list[str] = [f"Meal: {name}"]
    if category:
        blocks.append(f"Category: {category}")
    if description:
        blocks.append(f"Description: {description}")
    if ingredients:
        blocks.append("Ingredients:\n" + "\n".join(f"- {line}" for line in ingredients.splitlines()))
    if keywords:
        blocks.append("Tags: " + ", ".join([tag.strip() for tag in keywords.splitlines() if tag.strip()]))
    if instructions:
        blocks.append("Instructions:\n" + "\n".join(f"- {line}" for line in instructions.splitlines()))
    return "\n\n".join(blocks)


def import_meals_from_csv(
    db: Session,
    csv_path: Path,
    limit: int | None = None,
) -> dict[str, int]:
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    created = 0
    updated = 0
    processed = 0

    with csv_path.open("r", encoding="utf-8", newline="") as fp:
        reader = csv.DictReader(fp)

        for row in reader:
            if limit is not None and processed >= limit:
                break

            source_recipe_id = _as_clean_text(row.get("RecipeId"))
            name = _as_clean_text(row.get("Name"))
            if not name:
                continue

            category = _as_clean_text(row.get("RecipeCategory"))
            description = _as_clean_text(row.get("Description"))
            keywords = _stringify_listish(row.get("Keywords"))
            ingredients = _stringify_listish(row.get("ingredients_combined") or row.get("RecipeIngredientParts"))
            instructions = _stringify_listish(row.get("RecipeInstructions"))
            image_url = _as_clean_text(row.get("Images"))

            llm_text = _as_clean_text(row.get("llm_text"))
            if not llm_text:
                llm_text = _build_llm_text(
                    name=name,
                    category=category,
                    description=description,
                    ingredients=ingredients,
                    keywords=keywords,
                    instructions=instructions,
                )

            meal = None
            if source_recipe_id:
                meal = db.scalar(select(Meals).where(Meals.source_recipe_id == source_recipe_id))
            if meal is None:
                meal = db.scalar(select(Meals).where(Meals.name == name))

            payload: dict[str, Any] = {
                "source_recipe_id": source_recipe_id,
                "name": name,
                "description": description,
                "cuisine": category,
                "recipe_category": category,
                "keywords": keywords,
                "ingredients": ingredients,
                "instructions": instructions,
                "image_url": image_url,
                "servings": _to_float(row.get("RecipeServings")),
                "cook_time_minutes": _to_int(row.get("CookTime")),
                "prep_time_minutes": _to_int(row.get("PrepTime")),
                "total_time_minutes": _to_int(row.get("TotalTime")),
                "calories": _to_int(row.get("Calories")),
                "fat_g": _to_float(row.get("FatContent")),
                "saturated_fat_g": _to_float(row.get("SaturatedFatContent")),
                "cholesterol_mg": _to_float(row.get("CholesterolContent")),
                "sodium_mg": _to_float(row.get("SodiumContent")),
                "carbs_g": _to_float(row.get("CarbohydrateContent")),
                "fiber_g": _to_float(row.get("FiberContent")),
                "sugar_g": _to_float(row.get("SugarContent")),
                "protein_g": _to_float(row.get("ProteinContent")),
                "llm_text": llm_text,
            }

            if meal is None:
                meal = Meals(**payload)
                db.add(meal)
                created += 1
            else:
                for key, value in payload.items():
                    setattr(meal, key, value)
                updated += 1

            processed += 1

            if processed % 500 == 0:
                db.flush()

    db.commit()

    return {
        "processed": processed,
        "created": created,
        "updated": updated,
    }
