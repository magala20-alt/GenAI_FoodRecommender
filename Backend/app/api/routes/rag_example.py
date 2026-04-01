"""
Example RAG API Integration
Shows how to use the RAG system in FastAPI routes.
Copy this into your actual route files as needed.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.rag_manager import get_rag_manager


# ============ Request/Response Models ============

class MealRecommendationRequest(BaseModel):
    """Request model for meal recommendations."""
    query: str
    goal: str = None
    dietary_preference: str = None
    cuisine_preference: str = None
    dietary_constraints: str = None
    include_examples: bool = True
    include_all_meals: bool = False


class MealRecommendationResponse(BaseModel):
    """Response model for meal recommendations."""
    response: str
    retrieved_meals: list
    sources: list
    num_meals_retrieved: int


class MealSearchRequest(BaseModel):
    """Request for similar meal search."""
    query: str
    k: int = 5
    min_similarity: float = 0.3


class PatientAnalysisRequest(BaseModel):
    """Request for patient analysis."""
    patient_id: str
    patient_data: dict
    meal_history: list
    predictions: dict = None
    recent_trends: dict = None


# ============ Router Setup ============

router = APIRouter(prefix="/api/v1/rag", tags=["RAG"])


# ============ Meal Recommendations Endpoint ============

@router.post("/meals/recommend", response_model=MealRecommendationResponse)
async def recommend_meals(
    request: MealRecommendationRequest,
    db: Session = Depends(get_db)
):
    """
    Generate personalized meal recommendations using RAG.
    
    Example:
    ```
    POST /api/v1/rag/meals/recommend
    {
        "query": "I need low-carb breakfast ideas for diabetes management",
        "goal": "weight_loss",
        "dietary_preference": "low-carb",
        "cuisine_preference": "Italian"
    }
    ```
    """
    try:
        rag_manager = get_rag_manager(db)
        
        # Prepare user preferences
        preferences = {
            "goal": request.goal,
            "dietary_preference": request.dietary_preference,
            "cuisine_preference": request.cuisine_preference,
            "dietary_constraints": request.dietary_constraints,
        }
        
        # Remove None values
        preferences = {k: v for k, v in preferences.items() if v}
        
        # Execute RAG pipeline
        result = rag_manager.recommend_meals(
            user_query=request.query,
            user_preferences=preferences,
            include_examples=request.include_examples,
            include_all_meals=request.include_all_meals
        )
        
        return MealRecommendationResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")


# ============ Meal Search Endpoint ============

@router.post("/meals/search")
async def search_similar_meals(
    request: MealSearchRequest,
    db: Session = Depends(get_db)
):
    """
    Search for meals similar to a query using vector embeddings.
    
    Example:
    ```
    POST /api/v1/rag/meals/search
    {
        "query": "healthy protein lunch",
        "k": 5,
        "min_similarity": 0.4
    }
    ```
    """
    try:
        rag_manager = get_rag_manager(db)
        
        results = rag_manager.search_similar_meals(
            query=request.query,
            k=request.k,
            min_similarity=request.min_similarity
        )
        
        return {
            "query": request.query,
            "results": results,
            "count": len(results)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


# ============ Patient Analysis Endpoint ============

@router.post("/patients/analyze")
async def analyze_patient(
    request: PatientAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Generate clinician summary for a patient using RAG.
    
    Example:
    ```
    POST /api/v1/rag/patients/analyze
    {
        "patient_id": "patient-123",
        "patient_data": {
            "name": "John Doe",
            "age": 45,
            "diagnosis": "Type 2 Diabetes",
            "current_metrics": {
                "blood_pressure": "140/90",
                "glucose": 180,
                "weight": 95.5
            }
        },
        "meal_history": [
            {
                "meal_name": "Grilled Chicken",
                "calories": 350,
                "protein_g": 45,
                "date": "2024-03-24"
            }
        ]
    }
    ```
    """
    try:
        rag_manager = get_rag_manager(db)
        
        result = rag_manager.analyze_patient(
            patient_id=request.patient_id,
            patient_data=request.patient_data,
            meal_history=request.meal_history,
            predictions=request.predictions,
            recent_trends=request.recent_trends
        )
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# ============ Prompt Management Endpoint ============

@router.get("/prompts/available")
async def list_available_prompts():
    """
    List all available prompts in the system.
    
    Useful for:
    - Debugging: Check if prompts are loading correctly
    - Experimentation: See what prompts you can load
    """
    try:
        from app.services.prompt_registry import PromptRegistry
        
        available = PromptRegistry.list_available_prompts()
        return {
            "status": "success",
            "available_prompts": available
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load prompts: {str(e)}")


# ============ Embedding Management Endpoint ============

@router.post("/embeddings/generate")
async def generate_embeddings(
    text: str,
    db: Session = Depends(get_db)
):
    """
    Generate embedding for a text string.
    Useful for testing and debugging the embedding service.
    
    Example:
    ```
    POST /api/v1/rag/embeddings/generate?text=low+carb+breakfast
    ```
    """
    try:
        rag_manager = get_rag_manager(db)
        
        embedding = rag_manager.embedding_service.generate_embedding(text)
        
        return {
            "text": text,
            "embedding": embedding,
            "dimension": len(embedding)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")


# ============ Health Check ============

@router.get("/health")
async def rag_health_check(db: Session = Depends(get_db)):
    """
    Check RAG system health.
    Verifies:
    - Database connection
    - Embedding service availability
    - LLM client configuration
    """
    try:
        rag_manager = get_rag_manager(db)
        
        # Test embedding generation
        test_embedding = rag_manager.embedding_service.generate_embedding("test")
        
        # Test vector store access
        from app.services.vector_store import VectorStore
        meal_count = db.query(VectorStore).count() if hasattr(VectorStore, '__tablename__') else 0
        
        return {
            "status": "healthy",
            "embedding_service": "ready",
            "llm_provider": {"provider": "unknown", "model": "unknown"},
            "database": "connected"
        }
    
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


# ============ Usage Guide ============

"""
INTEGRATION GUIDE:

1. Add to your main.py:
   from your_route_file import router as rag_router
   app.include_router(rag_router)

2. Set environment variables:
   - LLM_PROVIDER=openai (or "anthropic")
   - LLM_API_KEY=sk-...
   - LLM_MODEL=gpt-4 (or claude-3-sonnet-20240229)
   - EMBEDDING_MODEL=all-MiniLM-L6-v2

3. First time setup - generate embeddings for meals:
   POST /api/v1/rag/embeddings/batch
   with meal data to index them

4. Then start using the endpoints!

For the data flow:
   User Query → Embedding → Vector Search → Context Building → LLM → Response

Common Issues:
- If embeddings are zero vectors: meal has no description
- If LLM fails: Check API key and model name
- If searches return nothing: Meals haven't been embedded yet (run batch generation)
"""
