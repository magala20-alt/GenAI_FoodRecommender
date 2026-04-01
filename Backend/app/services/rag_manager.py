"""
RAG Manager - Orchestrates the complete RAG pipeline.
Handles retrieval, augmentation, and generation workflow.
"""

from typing import List, Dict, Any, Optional
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
        
        # Step 3: Call LLM
        response = self.llm_client.call(messages)
        
        return {
            "response": response,
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
        
        # Step 3: Call LLM
        response = self.llm_client.call(messages)
        
        return {
            "response": response,
            "query": clinician_query,
            "patients_searched": len(available_patients)
        }
    
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
            # Try to load examples from the prompts module
            from app.prompts.meals.examples import DIABETES_FRIENDLY_EXAMPLES
            return DIABETES_FRIENDLY_EXAMPLES if DIABETES_FRIENDLY_EXAMPLES else []
        except (ImportError, AttributeError):
            # Return empty list if examples not available
            return []


def get_rag_manager(db: Session) -> RAGManager:
    """Factory function to get RAG manager instance."""
    return RAGManager(db)
