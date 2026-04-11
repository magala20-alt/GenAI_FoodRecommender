"""Service for managing suggested meals and the approval workflow."""

import logging
import re
from datetime import UTC, datetime

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models.meals import Meals
from app.models.suggested_meal import SuggestedMeal, SuggestedMealStatus
from app.models.userHealth_metrics import UserHealthReadings
from app.services.vector_store import VectorStore

logger = logging.getLogger(__name__)


class SuggestedMealService:
    """Handles storage, approval, and promotion of LLM-suggested meals."""

    @staticmethod
    def extract_new_meal_suggestions(llm_response: str, source_query: str, user_id: str | None = None, model_name: str = "gemini-2.5-flash", confidence: float = 0.7) -> list[dict]:
        """
        Extract any [New: not in base list] meals from LLM response.
        
        Looks for patterns like:
        - "[New: not in base list] Meal Name"
        - "Meal Name [New]"
        
        Returns list of dicts with meal info ready for storage.
        """
        suggestions = []
        
        # Pattern 1: [New: not in base list] Meal Name - description
        pattern1 = r"\[New:\s*(?:not in base\s+)?list\]\s*([^-\n]+?)(?:\s*-\s*(.+?))?(?=\n|\[New|$)"
        
        # Pattern 2: Meal Name [New: ...] or similar ending
        pattern2 = r"([^[\n]+?)\s*\[New[^\]]*\]"
        
        matches1 = re.finditer(pattern1, llm_response, re.IGNORECASE)
        matches2 = re.finditer(pattern2, llm_response, re.IGNORECASE)
        
        seen_names = set()
        
        for match in list(matches1) + list(matches2):
            meal_name = match.group(1).strip()
            description = match.group(2).strip() if match.lastindex >= 2 else None
            
            if meal_name and meal_name.lower() not in seen_names:
                seen_names.add(meal_name.lower())
                suggestions.append({
                    "name": meal_name,
                    "description": description,
                    "source_query": source_query,
                    "user_id": user_id,
                    "model_name": model_name,
                    "llm_confidence": confidence,
                })
        
        logger.info(f"Extracted {len(suggestions)} new meal suggestions from LLM response")
        return suggestions

    @staticmethod
    def store_suggested_meal(db: Session, meal_data: dict) -> SuggestedMeal | None:
        """Store a suggested meal in the pending status."""
        try:
            # Check if meal already exists (by name + source_query combination)
            existing = db.scalar(
                select(SuggestedMeal).where(
                    and_(
                        SuggestedMeal.name == meal_data["name"],
                        SuggestedMeal.source_query == meal_data["source_query"],
                    )
                )
            )
            if existing:
                logger.info(f"Suggested meal already exists: {meal_data['name']}")
                return existing
            
            suggested_meal = SuggestedMeal(
                name=meal_data["name"],
                description=meal_data.get("description"),
                cuisine=meal_data.get("cuisine"),
                calories=meal_data.get("calories"),
                protein_g=meal_data.get("protein_g"),
                carbs_g=meal_data.get("carbs_g"),
                fat_g=meal_data.get("fat_g"),
                ingredients=meal_data.get("ingredients"),
                instructions=meal_data.get("instructions"),
                source_query=meal_data["source_query"],
                user_id=meal_data.get("user_id"),
                model_name=meal_data.get("model_name", "gemini-2.5-flash"),
                llm_confidence=meal_data.get("llm_confidence", 0.7),
                status=SuggestedMealStatus.PENDING,
            )
            db.add(suggested_meal)
            db.commit()
            db.refresh(suggested_meal)
            logger.info(f"Stored suggested meal: {suggested_meal.name} (id={suggested_meal.id})")
            return suggested_meal
        except Exception as exc:
            logger.exception("Failed to store suggested meal", exc_info=exc)
            db.rollback()
            return None

    @staticmethod
    def list_pending_suggestions(db: Session, limit: int = 50, offset: int = 0) -> tuple[list[SuggestedMeal], int]:
        """List pending suggestions for review."""
        query = select(SuggestedMeal).where(
            SuggestedMeal.status == SuggestedMealStatus.PENDING
        ).order_by(SuggestedMeal.created_at.desc())
        
        total = db.scalar(select(SuggestedMeal).where(
            SuggestedMeal.status == SuggestedMealStatus.PENDING
        ).__str__().replace("SELECT", "SELECT COUNT(*)").replace("FROM suggested_meals ORDER BY", "FROM suggested_meals WHERE"))
        
        # Simpler count
        total = db.query(SuggestedMeal).filter(
            SuggestedMeal.status == SuggestedMealStatus.PENDING
        ).count()
        
        suggestions = db.scalars(
            query.limit(limit).offset(offset)
        ).all()
        
        return suggestions, total

    @staticmethod
    def get_governance_stats(db: Session) -> dict:
        """Get summary stats on suggested meals."""
        total = db.query(SuggestedMeal).count()
        pending = db.query(SuggestedMeal).filter(SuggestedMeal.status == SuggestedMealStatus.PENDING).count()
        approved = db.query(SuggestedMeal).filter(SuggestedMeal.status == SuggestedMealStatus.APPROVED).count()
        rejected = db.query(SuggestedMeal).filter(SuggestedMeal.status == SuggestedMealStatus.REJECTED).count()
        promoted = db.query(SuggestedMeal).filter(SuggestedMeal.status == SuggestedMealStatus.PROMOTED).count()
        
        return {
            "total": total,
            "pending": pending,
            "approved": approved,
            "rejected": rejected,
            "promoted": promoted,
        }

    @staticmethod
    def approve_suggestion(db: Session, suggestion_id: str, approver_user_id: str, reason: str | None = None) -> SuggestedMeal | None:
        """Approve a pending suggestion."""
        try:
            suggestion = db.scalar(select(SuggestedMeal).where(SuggestedMeal.id == suggestion_id))
            if not suggestion:
                logger.warning(f"Suggestion not found: {suggestion_id}")
                return None
            
            if suggestion.status != SuggestedMealStatus.PENDING:
                logger.warning(f"Suggestion not pending: {suggestion_id} (status={suggestion.status})")
                return suggestion
            
            suggestion.status = SuggestedMealStatus.APPROVED
            suggestion.approved_by_user_id = approver_user_id
            suggestion.approval_reason = reason
            suggestion.approved_at = datetime.now(UTC)
            
            db.commit()
            db.refresh(suggestion)
            logger.info(f"Approved suggestion: {suggestion_id}")
            return suggestion
        except Exception as exc:
            logger.exception("Failed to approve suggestion", exc_info=exc)
            db.rollback()
            return None

    @staticmethod
    def reject_suggestion(db: Session, suggestion_id: str, reason: str | None = None) -> SuggestedMeal | None:
        """Reject a pending suggestion."""
        try:
            suggestion = db.scalar(select(SuggestedMeal).where(SuggestedMeal.id == suggestion_id))
            if not suggestion:
                logger.warning(f"Suggestion not found: {suggestion_id}")
                return None
            
            if suggestion.status != SuggestedMealStatus.PENDING:
                logger.warning(f"Suggestion not pending: {suggestion_id} (status={suggestion.status})")
                return suggestion
            
            suggestion.status = SuggestedMealStatus.REJECTED
            suggestion.approval_reason = reason
            
            db.commit()
            db.refresh(suggestion)
            logger.info(f"Rejected suggestion: {suggestion_id}")
            return suggestion
        except Exception as exc:
            logger.exception("Failed to reject suggestion", exc_info=exc)
            db.rollback()
            return None

    @staticmethod
    def promote_to_canonical(
        db: Session,
        suggestion_id: str,
        prep_time_minutes: int | None = None,
        cook_time_minutes: int | None = None,
    ) -> tuple[SuggestedMeal | None, Meals | None]:
        """
        Promote an approved suggestion to the canonical meals table.
        Returns (updated_suggestion, new_meal).
        """
        try:
            suggestion = db.scalar(select(SuggestedMeal).where(SuggestedMeal.id == suggestion_id))
            if not suggestion:
                logger.warning(f"Suggestion not found: {suggestion_id}")
                return None, None
            
            if suggestion.status != SuggestedMealStatus.APPROVED:
                logger.warning(f"Suggestion not approved: {suggestion_id} (status={suggestion.status})")
                return suggestion, None
            
            # Create new canonical meal
            new_meal = Meals(
                name=suggestion.name,
                description=suggestion.description,
                cuisine=suggestion.cuisine,
                calories=suggestion.calories,
                protein_g=suggestion.protein_g,
                carbs_g=suggestion.carbs_g,
                fat_g=suggestion.fat_g,
                prep_time_minutes=prep_time_minutes,
                cook_time_minutes=cook_time_minutes,
                ingredients=suggestion.ingredients,
                instructions=suggestion.instructions,
            )
            
            db.add(new_meal)
            db.flush()
            
            # Generate embedding for the new meal
            try:
                VectorStore.generate_and_store_embedding(db=db, meal=new_meal)
            except Exception as emit_exc:
                logger.warning(f"Failed to generate embedding for promoted meal {new_meal.id}", exc_info=emit_exc)
            
            # Update suggestion to link to promoted meal
            suggestion.promoted_meal_id = new_meal.id
            suggestion.status = SuggestedMealStatus.PROMOTED
            
            db.commit()
            db.refresh(suggestion)
            db.refresh(new_meal)
            
            logger.info(f"Promoted suggestion {suggestion_id} to canonical meal {new_meal.id}")
            return suggestion, new_meal
        except Exception as exc:
            logger.exception("Failed to promote suggestion to canonical meal", exc_info=exc)
            db.rollback()
            return None, None
