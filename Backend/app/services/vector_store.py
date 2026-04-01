"""
Vector Store Service - Manages vector similarity search against PostgreSQL with pgvector.
Retrieves meals, recipes, and patient data similar to a query.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.meals import Meals
from app.core.config import settings


class VectorStore:
    """Manages vector similarity search in PostgreSQL with pgvector."""
    
    @staticmethod
    def search_similar_meals(
        db: Session,
        query_embedding: List[float],
        limit: int = None,
        min_similarity: float = 0.5,
        exclude_meal_ids: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Find meals similar to the query embedding using vector similarity.
        Uses pgvector's cosine distance (<->) operator.
        
        Args:
            db: Database session
            query_embedding: Query embedding vector
            limit: Maximum number of results (uses settings if not specified)
            min_similarity: Minimum similarity score (0-1)
            exclude_meal_ids: List of meal IDs to exclude from results
            
        Returns:
            List of dicts with meal data and similarity scores
        """
        if limit is None:
            limit = settings.max_retrieved_items
        
        # Build query using pgvector cosine distance
        # Lower distance = higher similarity, so we use negative distance for ordering
        query = db.query(
            Meals,
            # Calculate similarity as 1 - normalized distance
            (1 - (Meals.embedding.l2_distance(query_embedding) / 2)).label('similarity')
        ).filter(
            Meals.embedding.isnot(None)
        )
        
        # Exclude specified meals
        if exclude_meal_ids:
            query = query.filter(Meals.id.notin_(exclude_meal_ids))
        
        # Order by similarity (descending) and limit
        results = query.order_by(
            (1 - (Meals.embedding.l2_distance(query_embedding) / 2)).desc()
        ).limit(limit).all()
        
        # Filter by minimum similarity and format results
        output = []
        for meal, similarity in results:
            if similarity >= min_similarity:
                output.append({
                    'meal_id': meal.id,
                    'name': meal.name,
                    'description': meal.description,
                    'cuisine': meal.cuisine,
                    'calories': meal.calories,
                    'protein_g': meal.protein_g,
                    'carbs_g': meal.carbs_g,
                    'fat_g': meal.fat_g,
                    'prep_time_minutes': meal.prep_time_minutes,
                    'llm_text': meal.llm_text,
                    'similarity_score': float(similarity),
                })
        
        return output
    
    @staticmethod
    def get_meals_by_cuisine(
        db: Session,
        cuisine: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get meals by cuisine type for context.
        
        Args:
            db: Database session
            cuisine: Cuisine type to filter by
            limit: Maximum number of results
            
        Returns:
            List of meal dictionaries
        """
        meals = db.query(Meals).filter(
            Meals.cuisine.ilike(f"%{cuisine}%")
        ).limit(limit).all()
        
        return [
            {
                'meal_id': meal.id,
                'name': meal.name,
                'cuisine': meal.cuisine,
                'calories': meal.calories,
                'protein_g': meal.protein_g,
                'carbs_g': meal.carbs_g,
                'fat_g': meal.fat_g,
                'description': meal.description,
            }
            for meal in meals
        ]
    
    @staticmethod
    def get_all_meals_for_context(
        db: Session,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get all meals for context building.
        
        Args:
            db: Database session
            limit: Maximum number of meals to retrieve
            
        Returns:
            List of meal dictionaries
        """
        meals = db.query(Meals).limit(limit).all()
        
        return [
            {
                'meal_id': meal.id,
                'name': meal.name,
                'description': meal.description,
                'cuisine': meal.cuisine,
                'calories': meal.calories,
                'protein_g': meal.protein_g,
                'carbs_g': meal.carbs_g,
                'fat_g': meal.fat_g,
                'prep_time_minutes': meal.prep_time_minutes,
            }
            for meal in meals
        ]
    
    @staticmethod
    def store_meal_embedding(
        db: Session,
        meal_id: str,
        embedding: List[float],
        llm_text: str = None
    ) -> None:
        """
        Store or update embedding for a meal.
        
        Args:
            db: Database session
            meal_id: ID of the meal
            embedding: Embedding vector
            llm_text: Optional formatted text used to generate embedding
        """
        meal = db.query(Meals).filter(Meals.id == meal_id).first()
        if meal:
            meal.embedding = embedding
            if llm_text:
                meal.llm_text = llm_text
            db.commit()
