# RAG System - Quick Start Guide

## What Was Built ✅

I've created a **complete RAG (Retrieval-Augmented Generation)** system with these components:

### 📁 **New Files Created:**

1. **`app/services/embedding_service.py`** - Generates vector embeddings
2. **`app/services/vector_store.py`** - Manages vector similarity search (pgvector)
3. **`app/services/prompt_registry.py`** - Loads prompts dynamically from filesystem
4. **`app/services/context_builder.py`** - Assembles prompts with retrieved context
5. **`app/services/llm_client.py`** - Unified interface for Gemini/OpenAI
6. **`app/services/rag_manager.py`** - Main orchestrator (all pieces together)
7. **`app/api/routes/rag_example.py`** - Example API endpoints
8. **`RAG_IMPLEMENTATION_GUIDE.md`** - Complete architecture & setup guide

### 📝 **Modified Files:**

1. **`app/core/config.py`** - Added LLM configuration settings
2. **`requirements.txt`** - Added embedding & LLM packages

---

## Quick Start (5 Steps)

### **Step 1: Install Dependencies**

```bash
cd Backend
pip install -r requirements.txt
```

### **Step 2: Set Up Environment Variables**

Create `Backend/.env`:

```bash
# Gemini-first setup
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.5-flash
LLM_API_KEY=AIza-your-google-ai-key

# Optional provider-specific keys supported by llm_client.py
# GEMINI_API_KEY=AIza-your-google-ai-key
# GOOGLE_API_KEY=AIza-your-google-ai-key

# Optional OpenAI fallback
# OPENAI_API_KEY=sk-your-openai-key
LLM_TEMPERATURE=0.7
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

### **Step 3: Generate Embeddings for Your Meals**

This only needs to be done once. Add to your database seeding:

```python
from app.services.rag_manager import get_rag_manager
from app.db.session import SessionLocal

db = SessionLocal()
rag = get_rag_manager(db)

# Get your meals from DB
meals = db.query(Meals).all()

# Convert to dicts for embedding
meal_dicts = [
    {
        "id": meal.id,
        "name": meal.name,
        "description": meal.description
    }
    for meal in meals
]

# Generate and store embeddings
rag.generate_meal_embeddings_batch(meal_dicts)
print("✅ Embeddings generated!")
```

### **Step 4: Add RAG Routes to Your App**

**In `Backend/app/main.py`:**

```python
from app.api.routes.rag_example import router as rag_router

# After other routers are included:
app.include_router(rag_router)
```

### **Step 5: Test It!**

```bash
# Start your FastAPI server
uvicorn app.main:app --reload

# In another terminal, test:
curl -X POST "http://localhost:8000/api/v1/rag/meals/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I need low-carb breakfast ideas",
    "goal": "weight_loss",
    "dietary_preference": "low-carb"
  }'
```

---

## How It Works (Simple View)

```
User asks: "I need low-carb breakfast"
            ↓
Step 1: Convert question to vector (embedding)
            ↓
Step 2: Find similar meals in database (vector search)
            ↓
Step 3: Load system prompt from prompts folder
            ↓
Step 4: Build complete prompt:
        - System instructions
        - Retrieved meals (context)
        - User's question
        - Few-shot examples
            ↓
Step 5: Send to LLM (Gemini/OpenAI)
            ↓
Step 6: Return recommendations WITH SOURCES
```

---

## Key Features

### 🎯 **Retrieval** (Vector Search)

- Finds similar meals using embeddings
- Uses PostgreSQL + pgvector for fast similarity search
- Fallback to cuisine filtering if no matches

### 📦 **Augmentation** (Context Building)

- Combines system prompts + retrieved data
- Adds few-shot examples for better LLM responses
- Includes user preferences and constraints

### 🧠 **Generation** (LLM)

- Calls Gemini (default) or OpenAI
- Returns complete recommendations
- Attributes sources (which meals were used)

### 📝 **Dynamic Prompts**

- Loaded from `Backend/prompts/` folder
- No code changes needed to update
- Easy experimentation and customization

---

## Available API Endpoints

### **Meal Recommendations**

```
POST /api/v1/rag/meals/recommend

{
  "query": "low-carb breakfast",
  "goal": "weight_loss",
  "dietary_preference": "low-carb",
  "cuisine_preference": "Italian",
  "dietary_constraints": "diabetic-friendly"
}
```

### **Meal Search**

```
POST /api/v1/rag/meals/search

{
  "query": "protein-rich lunch",
  "k": 5,
  "min_similarity": 0.4
}
```

### **Patient Analysis**

```
POST /api/v1/rag/patients/analyze

{
  "patient_id": "patient-123",
  "patient_data": {...},
  "meal_history": [...]
}
```

### **View Available Prompts**

```
GET /api/v1/rag/prompts/available
```

### **Generate Embedding**

```
POST /api/v1/rag/embeddings/generate?text=breakfast
```

See `rag_example.py` for full examples!

---

## Customization

### **Change the Embedding Model**

Edit `Backend/.env`:

```bash
EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2  # More accurate, slower
```

### **Change the LLM**

Edit `Backend/.env`:

```bash
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
```

### **Modify Prompts**

Edit `Backend/prompts/meals/base.py` or `Backend/prompts/patients/base.py`

- Changes are loaded automatically
- No restart needed!

### **Adjust Recommendations**

In your code:

```python
rag.recommend_meals(
    query="breakfast",
    include_examples=True,      # Add few-shot examples
    include_all_meals=False,    # Include all meals as fallback
    k_retrieved=5               # Number of similar meals to retrieve
)
```

---

## Architecture Overview

```
┌─ Embedding Service (sentence-transformers)
│  └─ Converts text to 384-dim vectors
│
├─ Vector Store (PostgreSQL + pgvector)
│  └─ Stores & searches embeddings
│
├─ Prompt Registry (Dynamic filesystem loading)
│  └─ Loads from Backend/prompts/
│
├─ Context Builder (Assembles complete prompts)
│  └─ System + Examples + Context + Query
│
├─ LLM Client (Gemini/OpenAI wrapper)
│  └─ Makes API calls
│
└─ RAG Manager (Orchestrator)
   └─ Coordinates all above components
```

---

## Troubleshooting

| Problem                                                | Solution                                                 |
| ------------------------------------------------------ | -------------------------------------------------------- |
| `ImportError: No module named 'sentence_transformers'` | `pip install sentence-transformers`                      |
| `LLM_API_KEY not found`                                | Add to `.env` file in Backend/ folder                    |
| Search returns nothing                                 | Run embedding generation for meals                       |
| Slow recommendations                                   | Reduce `k_retrieved` or increase `min_similarity`        |
| "No meals match"                                       | Add more meals to database or lower similarity threshold |

---

## Next Steps

1. **✅ Install & Configure** (Steps 1-2 above)
2. **✅ Generate Embeddings** (Step 3)
3. **✅ Add Routes** (Step 4)
4. **🧪 Test** (Step 5)
5. **📱 Integrate with Frontend** - Call the endpoints from React/React Native
6. **🎨 Customize Prompts** - Edit to match your brand voice
7. **📊 Monitor & Improve** - Track what works, iterate

---

## Full Documentation

See **`RAG_IMPLEMENTATION_GUIDE.md`** for:

- Complete architecture diagrams
- Detailed component explanations
- Advanced customization options
- Performance tuning tips
- Database optimization

---

## Questions?

Check the implementation guide or run:

```bash
# Check RAG system health
curl http://localhost:8000/api/v1/rag/health

# List available prompts
curl http://localhost:8000/api/v1/rag/prompts/available
```

---

**You're all set! Start building with RAG! 🚀**
