# RAG System Architecture & Implementation Guide

## Overview

You now have a **complete Retrieval-Augmented Generation (RAG)** system that:

- ✅ Retrieves relevant context from your vector database
- ✅ Augments queries with system prompts, examples, and retrieved data
- ✅ Generates responses using Gemini/OpenAI
- ✅ Maintains source attribution
- ✅ Loads prompts dynamically (no code changes needed)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    FastAPI Endpoint                      │
│              (User Query + Preferences)                  │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │   RAG Manager Orchestrator       │
        │   (rag_manager.py)              │
        └────────────────┬────────────────┘
                         │
        ┌────────────────▼────────────────────────────┐
        │  1. Embedding Generation                    │
        │     (embedding_service.py)                  │
        │     - Convert user query to vector          │
        │     - Use sentence-transformers model       │
        └────────────────┬───────────────────────────┘
                         │
        ┌────────────────▼────────────────────────────┐
        │  2. Vector Similarity Search                │
        │     (vector_store.py)                       │
        │     - Query pgvector in PostgreSQL          │
        │     - Retrieve top-k similar items          │
        │     - Filter by similarity threshold        │
        └────────────────┬───────────────────────────┘
                         │
        ┌────────────────▼────────────────────────────┐
        │  3. Prompt Loading & Assembly               │
        │     (prompt_registry.py)                    │
        │     - Load prompts from filesystem          │
        │     + context_builder.py                    │
        │     - Combine system + user + context       │
        │     - Add few-shot examples                 │
        └────────────────┬───────────────────────────┘
                         │
        ┌────────────────▼────────────────────────────┐
        │  4. LLM Call                                │
        │     (llm_client.py)                         │
        │     - Call Gemini or OpenAI                 │
        │     - Pass complete prompt                  │
        │     - Return response                       │
        └────────────────┬───────────────────────────┘
                         │
        ┌────────────────▼────────────────────────────┐
        │  5. Return Result with Sources              │
        │     - LLM response                          │
        │     - Retrieved items for attribution       │
        │     - Similarity scores                     │
        └────────────────────────────────────────────┘
```

---

## Core Components

### 1. **Embedding Service** (`embedding_service.py`)

**Purpose**: Generates vector embeddings for text

**Key Methods**:

- `generate_embedding(text)` - Create embedding for single text
- `generate_embeddings_batch(texts)` - Batch embeddings efficiently
- `similarity_score(emb1, emb2)` - Calculate cosine similarity

**Model**: `all-MiniLM-L6-v2` (384 dimensions, fast & accurate)

**When Used**:

1. First time: Embed all meals in your database
2. Per request: Embed user queries for search
3. Can be changed via `EMBEDDING_MODEL` environment variable

---

### 2. **Vector Store** (`vector_store.py`)

**Purpose**: Manages vector similarity search in PostgreSQL

**Key Methods**:

- `search_similar_meals()` - Find meals by similarity
- `get_meals_by_cuisine()` - Filter by cuisine
- `store_meal_embedding()` - Save embeddings to DB
- `get_all_meals_for_context()` - Retrieve all meals

**Database**: PostgreSQL with pgvector extension

- Uses cosine distance for similarity
- Supports efficient nearest-neighbor search
- Already integrated (pgvector==0.3.6 in requirements)

---

### 3. **Prompt Registry** (`prompt_registry.py`)

**Purpose**: Dynamically loads prompts from the filesystem

**Key Methods**:

- `load_prompt(category, prompt_name)` - Load specific prompt
- `get_meal_prompt(type)` - Load meal recommendation prompts
- `get_patient_prompt(type)` - Load patient analysis prompts
- `list_available_prompts()` - See all available prompts

**Advantages**:

- ✅ **No code changes needed** to update prompts
- ✅ Prompts loaded from `Backend/prompts/` folder
- ✅ Supports caching for performance
- ✅ Easy experimentation

**Example**:

```python
# Just edit prompts/meals/base.py and it's loaded automatically
prompt = PromptRegistry.get_meal_prompt("search")
```

---

### 4. **Context Builder** (`context_builder.py`)

**Purpose**: Assembles complete prompts with context

**Key Methods**:

- `build_meal_recommendation_context()` - For meal recommendations
- `build_patient_analysis_context()` - For clinician summaries
- `build_patient_filter_context()` - For patient filtering

**What it Combines**:

1. **System Prompt** - Role and instructions
2. **Retrieved Context** - Similar meals/data from vector DB
3. **Examples** - Few-shot learning for better outputs
4. **User Input** - The actual query/request
5. **User Preferences** - Goals, dietary constraints, etc.

**Result**: Complete message list ready for LLM API

---

### 5. **LLM Client** (`llm_client.py`)

**Purpose**: Unified interface for different LLM providers

**Supported Providers**:

1. **Gemini** (gemini-2.5-flash, gemini-2.5-pro)
2. **OpenAI** (gpt-4o-mini, gpt-4o)

**Key Methods**:

- `call(messages)` - Call the LLM
- `set_provider()` - Switch providers
- Singleton pattern for efficient use

**Configuration**:

```bash
# Set in .env
LLM_PROVIDER=gemini
LLM_API_KEY=AIza-your-google-ai-key
LLM_MODEL=gemini-2.5-flash
LLM_TEMPERATURE=0.7          # Creativity vs consistency
```

---

### 6. **RAG Manager** (`rag_manager.py`)

**Purpose**: Orchestrates the entire RAG pipeline

**Key Methods**:

- `recommend_meals()` - Generate meal recommendations
- `analyze_patient()` - Generate patient summaries
- `filter_patients()` - Find patients by criteria
- `search_similar_meals()` - Direct similarity search
- `generate_meal_embeddings_batch()` - Create embeddings for meals

**Workflow Example** (recommend_meals):

```
1. Embed user query
2. Search vector DB for similar meals
3. Get system prompt from registry
4. Load few-shot examples
5. Build complete context
6. Call LLM
7. Return response + sources
```

---

## Data Flow Examples

### Example 1: User Asks for Meal Recommendation

```
User Request:
  "I need low-carb breakfast ideas for diabetes management"
        ↓
1. EMBEDDING: Convert to vector (384 dims)
        ↓
2. VECTOR SEARCH: Find similar meals in DB
   Results: [Egg Muffins (0.85), Greek Yogurt (0.82), Oatmeal (0.41)]
        ↓
3. LOAD PROMPTS: Get meal recommendation prompt from prompts/meals/base.py
        ↓
4. BUILD CONTEXT:
   System: "You are an expert nutritionist..."
   Examples: [Low-carb breakfast examples]
   Context: [Retrieved meals with nutrition info]
   Query: User's request
        ↓
5. CALL LLM: Send to Gemini/OpenAI
        ↓
6. RETURN:
   {
     "response": "Here are 3 breakfast ideas...",
     "retrieved_meals": ["Egg Muffins", "Greek Yogurt", ...],
     "sources": ["Egg Muffins (85% match)", ...]
   }
```

### Example 2: Clinician Analyzes Patient

```
Clinician Requests Patient Summary
        ↓
1. LOAD DATA: Get patient metrics + meal history from DB
        ↓
2. LOAD PROMPTS: Get clinician analysis prompt
        ↓
3. BUILD CONTEXT:
   Patient Info: [Name, Age, Diagnosis, Current Metrics]
   Meal History: [Last 7 meals with nutrition]
   Trends: [Eating patterns, health risks]
        ↓
4. CALL LLM: Gemini/OpenAI analyzes
        ↓
5. RETURN: Professional summary
```

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create `.env` file in Backend/ folder:

```bash
# LLM Configuration
LLM_PROVIDER=gemini
LLM_API_KEY=AIza-your-google-ai-key
LLM_MODEL=gemini-2.5-flash
LLM_TEMPERATURE=0.7                    # 0-1, higher = more creative

# Optional provider-specific keys supported by llm_client.py
# GEMINI_API_KEY=AIza-your-google-ai-key
# GOOGLE_API_KEY=AIza-your-google-ai-key
# OPENAI_API_KEY=sk-your-openai-key

# Embedding Configuration
EMBEDDING_MODEL=all-MiniLM-L6-v2      # HuggingFace model name
VECTOR_DB_DIMENSION=384                # Must match model output
MAX_RETRIEVED_ITEMS=5                  # How many meals/items to retrieve

# Database (PostgreSQL required for pgvector)
DATABASE_URL=postgresql://user:pass@localhost/caresync_db
```

### 3. Prepare Your Database

1. **Ensure PostgreSQL has pgvector extension installed**
2. **Run migrations** (already set up in your project)
3. **Build embeddings** for existing meals:

```python
# In your database initialization:
from app.services.rag_manager import get_rag_manager
from app.db.session import SessionLocal

db = SessionLocal()
rag_manager = get_rag_manager(db)

# Get all meals and generate embeddings
meals = get_all_meals()  # Your method
rag_manager.generate_meal_embeddings_batch(meals)
```

---

## Integration Steps

### Option 1: Add to Existing Routes

**In your route file** (e.g., `app/api/routes/meals.py`):

```python
from app.services.rag_manager import get_rag_manager
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

router = APIRouter()

@router.post("/recommend")
async def recommend_meals(
    query: str,
    db: Session = Depends(get_db)
):
    rag = get_rag_manager(db)
    result = rag.recommend_meals(
        user_query=query,
        user_preferences={"goal": "weight_loss"}
    )
    return result
```

### Option 2: Use Example Routes

Copy endpoints from `app/api/routes/rag_example.py`:

```python
# In app/main.py
from app.api.routes.rag_example import router as rag_router
app.include_router(rag_router)
```

---

## Customization Guide

### Change Embedding Model

**In config.py**:

```python
EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2  # Larger, more accurate
# Other options:
# - all-mpnet-base-v2 (smaller but accurate)
# - all-roberta-large-v1 (larger)
```

### Change LLM Provider

**In .env**:

```bash
# Switch to OpenAI
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...
```

### Modify Prompts

**Edit** `Backend/prompts/meals/base.py`:

```python
SYSTEM_PROMT = """
Your new system prompt here...
"""
```

**No code changes needed**—it's loaded automatically!

### Adjust Similarity Threshold

**In RAG call**:

```python
results = rag.search_similar_meals(
    query="breakfast",
    min_similarity=0.5  # Higher = stricter matching
)
```

---

## Testing the System

### Test 1: Check Embeddings Work

```bash
curl -X POST "http://localhost:8000/api/v1/rag/embeddings/generate?text=breakfast"
```

### Test 2: Test Meal Recommendation

```bash
curl -X POST "http://localhost:8000/api/v1/rag/meals/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I need low-carb breakfast",
    "goal": "weight_loss"
  }'
```

### Test 3: Check Available Prompts

```bash
curl "http://localhost:8000/api/v1/rag/prompts/available"
```

---

## Common Issues & Solutions

| Issue                         | Cause                         | Solution                                                                                        |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------- |
| "No LLM provider initialized" | API key not set               | Set LLM_API_KEY or GEMINI_API_KEY in .env                                                       |
| Search returns nothing        | Meals not embedded            | Run `generate_meal_embeddings_batch()`                                                          |
| Embeddings are all zeros      | Empty or missing descriptions | Add descriptions to meals in DB                                                                 |
| Slow vector search            | Large dataset                 | Add pgvector index: `CREATE INDEX ON meals USING ivfflat (embedding l2_ops) WITH (lists = 100)` |
| Poor recommendations          | Low similarity results        | Lower `min_similarity` threshold or get more meals in DB                                        |

---

## Next Steps

### 1. **Test the System**

- Run the health check endpoint
- Generate embeddings for your meals
- Try a recommendation request

### 2. **Customize Prompts**

- Edit prompts in `Backend/prompts/`
- Test with different LLM providers
- Adjust temperature for different use cases

### 3. **Integrate with Frontend**

- Call `/api/v1/rag/meals/recommend` from React/React Native
- Display recommendations with sources
- Show similarity scores

### 4. **Monitor & Improve**

- Track which recommendations users like
- Add new meals and re-generate embeddings
- A/B test different prompts

---

## File Structure

```
Backend/app/
├── services/
│   ├── embedding_service.py      # Embedding generation
│   ├── vector_store.py           # Vector DB operations
│   ├── prompt_registry.py        # Dynamic prompt loading
│   ├── context_builder.py        # Prompt assembly
│   ├── llm_client.py             # LLM interface
│   ├── rag_manager.py            # RAG orchestrator
│   ├── auth.py                   # (existing)
│   └── onboarding.py             # (existing)
├── api/routes/
│   └── rag_example.py            # Example endpoints
├── prompts/
│   ├── meals/
│   │   ├── base.py               # Meal prompts
│   │   ├── examples.py           # Meal examples
│   │   └── ...
│   └── patients/
│       ├── base.py               # Patient prompts
│       └── ...
└── core/
    └── config.py                 # (updated with LLM settings)
```

---

## Performance Considerations

- **Embedding Generation**: ~100ms per meal (cpu-bound)
- **Vector Search**: <10ms for top-5 similar items
- **LLM Call**: 1-10 seconds (network-bound)
- **Memory**: ~2GB for embedding model + DB connection

### Optimization Tips:

1. Cache embeddings (already done in DB)
2. Batch embedding generation
3. Use connection pooling for DB
4. Consider async LLM calls for high traffic
5. Add results caching for common queries

---

## References

- **Sentence Transformers**: https://www.sbert.net/
- **pgvector**: https://github.com/pgvector/pgvector
- **Google Gemini API**: https://ai.google.dev/
- **OpenAI API**: https://platform.openai.com/docs/
- **RAG Techniques**: https://arxiv.org/abs/2005.11401
