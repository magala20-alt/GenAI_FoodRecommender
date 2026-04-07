"""
RAG Manager - Orchestrates the complete RAG pipeline.
Handles retrieval, augmentation, and generation workflow.
"""

import json
from typing import List, Dict, Any, Optional
import importlib.util
from pathlib import Path
from sqlalchemy.orm import Session

from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStore
from app.services.prompt_registry import PromptRegistry
from app.services.context_builder import ContextBuilder
from app.services.llm_client import get_llm_client


class RAGManager:
    """Main orchestrator for the RAG pipeline."""
    
    def __init__(self, db: Session):
        """
        Initialize RAG Manager.
        
        Args:
            db: Database session
        """
        self.db = db
        self.embedding_service = EmbeddingService()
        self.llm_client = get_llm_client()
    
    def recommend_meals(
        self,
        user_query: str,
        user_preferences: Optional[Dict[str, Any]] = None,
        include_examples: bool = True,
        include_all_meals: bool = False,
        k_retrieved: int = 5
    ) -> Dict[str, Any]:
        """
        Generate meal recommendations using RAG.
        
        Args:
            user_query: User's meal request/query
            user_preferences: User's dietary preferences (goal, cuisine, constraints)
            include_examples: Whether to include few-shot examples
            include_all_meals: Whether to include all meals as context fallback
            k_retrieved: Number of meals to retrieve from vector search
            
        Returns:
            Dict with:
                - response: LLM response (recommendations)
                - retrieved_meals: Meals used as context
                - sources: Attribution for recommendations
        """
        # Step 1: Generate embedding for the query
        query_embedding = self.embedding_service.generate_embedding(user_query)
        
        # Step 2: Retrieve similar meals from vector DB
        retrieved_meals = VectorStore.search_similar_meals(
            self.db,
            query_embedding,
            limit=k_retrieved,
            min_similarity=0.3
        )
        
        # If not enough results, get meals by cuisine from user preferences
        if len(retrieved_meals) < 2 and user_preferences and user_preferences.get('cuisine_preference'):
            cuisine_meals = VectorStore.get_meals_by_cuisine(
                self.db,
                user_preferences['cuisine_preference'],
                limit=k_retrieved
            )
            retrieved_meals.extend(cuisine_meals)
        
        # Step 3: Get all meals if needed as fallback
        all_meals = None
        if include_all_meals:
            all_meals = VectorStore.get_all_meals_for_context(self.db, limit=50)
        
        # Step 4: Load prompts and examples
        system_prompt = PromptRegistry.get_meal_prompt("search")
        examples = None
        if include_examples:
            examples = self._load_meal_examples()
        
        # Step 5: Build complete context
        messages = ContextBuilder.build_meal_recommendation_context(
            system_prompt=system_prompt,
            user_query=user_query,
            retrieved_meals=retrieved_meals,
            user_preferences=user_preferences,
            examples=examples,
            include_all_meals=include_all_meals,
            all_available_meals=all_meals
        )
        
        # Step 6: Call LLM
        response = self.llm_client.call(messages)
        
        # Step 7: Format and return result with sources
        return {
            "response": response,
            "retrieved_meals": retrieved_meals,
            "sources": [meal.get("name", "Unknown") for meal in retrieved_meals],
            "num_meals_retrieved": len(retrieved_meals)
        }
    
    def analyze_patient(
        self,
        patient_id: str,
        patient_data: Dict[str, Any],
        meal_history: List[Dict[str, Any]],
        predictions: Optional[Dict[str, Any]] = None,
        recent_trends: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate patient analysis/summary using RAG.
        
        Args:
            patient_id: Patient's ID
            patient_data: Patient profile and current metrics
            meal_history: Patient's recent meals
            predictions: Predicted metrics
            recent_trends: Identified trends
            
        Returns:
            Dict with:
                - response: LLM response (analysis/summary)
                - patient_id: Patient information
                - meal_context_size: Number of meals used
        """
        # Step 1: Load patient analysis prompt
        system_prompt = PromptRegistry.get_patient_prompt("clinician")
        
        # Step 2: Build context
        messages = ContextBuilder.build_patient_analysis_context(
            system_prompt=system_prompt,
            patient_data=patient_data,
            meal_history=meal_history,
            predictions=predictions,
            recent_trends=recent_trends
        )
        
        # Step 3: Ask for strict JSON so downstream routes can persist consistent fields.
        messages.append(
            {
                "role": "user",
                "content": (
                    "Return strict JSON only with keys: summary (string), actions (array of max 4 short strings). "
                    "Do not include markdown or extra keys."
                ),
            }
        )

        # Step 4: Call LLM
        response = self.llm_client.call(messages)
        parsed = self._extract_json_object(response)

        summary = str(parsed.get("summary") or "").strip()
        actions_raw = parsed.get("actions")
        actions = [str(item).strip() for item in actions_raw] if isinstance(actions_raw, list) else []
        actions = [item for item in actions if item][:4]

        if not summary:
            summary = str(response or "").strip() or "No AI summary available for this patient."

        return {
            "response": response,
            "summary": summary,
            "actions": actions,
            "patient_id": patient_id,
            "meal_context_size": len(meal_history)
        }
    
    def filter_patients(
        self,
        clinician_query: str,
        available_patients: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Filter patients based on clinician query using RAG.
        
        Args:
            clinician_query: Clinician's filter query
            available_patients: List of patient metadata
            
        Returns:
            Dict with:
                - response: LLM response (filtered patients)
                - interpretation: How the query was interpreted
        """
        # Step 1: Load patient filter prompt
        system_prompt = PromptRegistry.get_patient_prompt("filter")
        
        # Step 2: Build context
        messages = ContextBuilder.build_patient_filter_context(
            system_prompt=system_prompt,
            user_query=clinician_query,
            available_patients=available_patients
        )
        
        # Step 3: Force JSON output for deterministic filtering behavior.
        messages.append(
            {
                "role": "user",
                "content": (
                    "Return strict JSON only with keys: filters_applied (array of strings), "
                    "matching_patient_ids (array of patient IDs), reasoning (string). "
                    "Do not include markdown or any other keys."
                ),
            }
        )

        # Step 4: Call LLM
        response = self.llm_client.call(messages)
        parsed = self._extract_json_object(response)
        filters_applied_raw = parsed.get("filters_applied")
        matching_ids_raw = parsed.get("matching_patient_ids")

        filters_applied = [str(item).strip() for item in filters_applied_raw] if isinstance(filters_applied_raw, list) else []
        filters_applied = [item for item in filters_applied if item]

        matching_patient_ids = [str(item).strip() for item in matching_ids_raw] if isinstance(matching_ids_raw, list) else []
        matching_patient_ids = [item for item in matching_patient_ids if item]

        return {
            "response": response,
            "filters_applied": filters_applied,
            "matching_patient_ids": matching_patient_ids,
            "reasoning": str(parsed.get("reasoning") or "").strip(),
            "query": clinician_query,
            "patients_searched": len(available_patients)
        }

    def _extract_json_object(self, raw_text: str) -> Dict[str, Any]:
        if not raw_text:
            return {}
        try:
            parsed = json.loads(raw_text)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            start = raw_text.find("{")
            end = raw_text.rfind("}")
            if start == -1 or end == -1 or end <= start:
                return {}
            try:
                parsed = json.loads(raw_text[start : end + 1])
                return parsed if isinstance(parsed, dict) else {}
            except json.JSONDecodeError:
                return {}
    
    def generate_meal_embeddings_batch(
        self,
        meals: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Generate embeddings for multiple meals and store them.
        
        Args:
            meals: List of meal dicts with id, name, description
            
        Returns:
            List of meal dicts with embeddings stored
        """
        results = []
        
        for meal in meals:
            # Format text for embedding (use description and name)
            text_for_embedding = f"{meal.get('name', '')} {meal.get('description', '')}"
            
            # Generate embedding
            embedding = self.embedding_service.generate_embedding(text_for_embedding)
            
            # Store in DB
            if 'id' in meal:
                VectorStore.store_meal_embedding(
                    self.db,
                    meal['id'],
                    embedding,
                    llm_text=text_for_embedding
                )
            
            results.append({
                "meal_id": meal.get("id"),
                "name": meal.get("name"),
                "embedding_generated": True
            })
        
        return results
    
    def search_similar_meals(
        self,
        query: str,
        k: int = 5,
        min_similarity: float = 0.3
    ) -> List[Dict[str, Any]]:
        """
        Search for meals similar to a query.
        
        Args:
            query: Search query string
            k: Number of results to retrieve
            min_similarity: Minimum similarity threshold
            
        Returns:
            List of similar meals with similarity scores
        """
        # Generate query embedding
        query_embedding = self.embedding_service.generate_embedding(query)
        
        # Search vector DB
        results = VectorStore.search_similar_meals(
            self.db,
            query_embedding,
            limit=k,
            min_similarity=min_similarity
        )
        
        return results
    
    def _load_meal_examples(self) -> List[Dict[str, str]]:
        """
        Load few-shot examples for meal recommendations.
        
        Returns:
            List of example dicts with 'user' and 'assistant' keys
        """
        try:
            examples_path = Path(__file__).resolve().parents[2] / "prompts" / "meals" / "examples.py"
            if not examples_path.exists():
                return []

            spec = importlib.util.spec_from_file_location("meal_examples", examples_path)
            if spec is None or spec.loader is None:
                return []

            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            examples = getattr(module, "DIABETES_FRIENDLY_EXAMPLES", [])
            return examples if isinstance(examples, list) else []
        except Exception:
            # Return empty list if examples are unavailable or malformed.
            return []


def get_rag_manager(db: Session) -> RAGManager:
    """Factory function to get RAG manager instance."""
    return RAGManager(db)
