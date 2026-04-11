# Meal Data Governance Implementation Guide

## Overview

This document describes the complete data governance system for LLM-suggested meals. When the vector similarity search returns no strong matches, the LLM is now able to suggest meals outside the canonical database. These suggestions are stored separately with a full approval workflow before being promoted to the canonical meals table.

---

## Architecture

### Database Schema

**suggested_meals Table**

```sql
CREATE TABLE suggested_meals (
    id VARCHAR(36) PRIMARY KEY,

    -- Meal Content
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cuisine VARCHAR(120),
    calories INTEGER,
    protein_g FLOAT,
    carbs_g FLOAT,
    fat_g FLOAT,
    prep_time_minutes INTEGER,
    cook_time_minutes INTEGER,
    ingredients TEXT,
    instructions TEXT,

    -- Source Context
    source_query TEXT NOT NULL,  -- The user query that generated this suggestion
    user_id VARCHAR(36) FOREIGN KEY,
    model_name VARCHAR(100),  -- e.g., "gemini-2.5-flash"
    llm_confidence FLOAT,  -- 0.0 to 1.0

    -- Governance Workflow
    status ENUM('pending', 'approved', 'rejected', 'promoted'),
    approval_reason TEXT,
    approved_by_user_id VARCHAR(36) FOREIGN KEY,
    promoted_meal_id VARCHAR(36),  -- Link to canonical meals.id after promotion

    -- Timestamps
    created_at DATETIME(UTC) NOT NULL,
    updated_at DATETIME(UTC) NOT NULL,
    approved_at DATETIME(UTC)
);
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Patient requests meal recommendation with query         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. RAG searches canonical meals in vector DB                │
│    Some results found: retrieved_meals                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. LLM generates recommendation response                    │
│    - References canonical meals when available             │
│    - Suggests "[New: not in base list] Meal Name" if none  │
│      of retrieved meals match well                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Recommendation endpoint extracts [New:...] meals        │
│    - Uses regex pattern to find suggested meals            │
│    - Creates SuggestedMeal records (status=PENDING)        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Admin reviews pending suggestions                        │
│    - Views stats: pending, approved, rejected, promoted   │
│    - Can approve (status=APPROVED) or reject               │
│    - Optionally adds approval_reason                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┬──────────┐
         │                   │          │
         ▼                   ▼          ▼
    [APPROVED]         [REJECTED]   [PENDING]
         │                   │          │
         ▼                   ▼          ▼
   Can Promote         Discarded   Still Review
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Admin promotes approved meal to canonical meals         │
│    - Creates new Meals record                              │
│    - Generates embedding for search                        │
│    - SuggestedMeal.status = PROMOTED                       │
│    - SuggestedMeal.promoted_meal_id = new Meals.id      │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Components

### 1. Database Model

**File**: `Backend/app/models/suggested_meal.py`

```python
class SuggestedMeal(Base):
    """Stores meal suggestions from LLM with approval workflow."""
    __tablename__ = "suggested_meals"

    id: str = PK()
    name: str = unique meal name
    description: str | None
    cuisine: str | None
    calories: int | None
    protein_g, carbs_g, fat_g: float | None
    ingredients, instructions: str | None

    # Source context
    source_query: str  # User's query that generated this
    user_id: str | None  # Patient who requested
    model_name: str = "gemini-2.5-flash"
    llm_confidence: float = 0.7  # LLM's confidence score

    # Governance
    status: SuggestedMealStatus = ENUM(pending|approved|rejected|promoted)
    approval_reason: str | None
    approved_by_user_id: str | None
    promoted_meal_id: str | None  # FK to canonical meals.id

    # Timestamps
    created_at, updated_at, approved_at: datetime
```

### 2. Service Layer

**File**: `Backend/app/services/suggested_meal_service.py`

Provides stateless functions for the governance workflow:

```python
class SuggestedMealService:

    @staticmethod
    def extract_new_meal_suggestions(
        llm_response: str,
        source_query: str,
        user_id: str | None,
        model_name: str,
        confidence: float
    ) -> list[dict]:
        """Parse [New: not in base list] meals from LLM response."""
        # Regex patterns:
        # - [New: not in base list] Meal Name - description
        # - Meal Name [New: ...] or similar
        # Returns list of meal dicts ready for storage

    @staticmethod
    def store_suggested_meal(db: Session, meal_data: dict) -> SuggestedMeal:
        """Store a suggested meal in PENDING status."""
        # Checks for duplicates before inserting

    @staticmethod
    def list_pending_suggestions(
        db: Session,
        limit: int = 50,
        offset: int = 0
    ) -> tuple[list[SuggestedMeal], int]:
        """Fetch pending suggestions for admin review."""

    @staticmethod
    def get_governance_stats(db: Session) -> dict:
        """Get counts: total, pending, approved, rejected, promoted."""

    @staticmethod
    def approve_suggestion(
        db: Session,
        suggestion_id: str,
        approver_user_id: str,
        reason: str | None
    ) -> SuggestedMeal:
        """Move suggestion to APPROVED status."""

    @staticmethod
    def reject_suggestion(
        db: Session,
        suggestion_id: str,
        reason: str | None
    ) -> SuggestedMeal:
        """Move suggestion to REJECTED status."""

    @staticmethod
    def promote_to_canonical(
        db: Session,
        suggestion_id: str,
        prep_time_minutes: int | None,
        cook_time_minutes: int | None
    ) -> tuple[SuggestedMeal, Meals]:
        """
        Promote APPROVED suggestion to canonical meals:
        1. Create new Meals record
        2. Generate embedding
        3. Update SuggestedMeal.status = PROMOTED
        4. Set SuggestedMeal.promoted_meal_id
        """
```

### 3. API Endpoints

**File**: `Backend/app/api/routes/patient_rag.py`

#### Patient Endpoints

**POST** `/patient-rag/recommendations`

- Existing endpoint, now captures LLM-suggested meals
- After LLM response, checks for `[New: not in base list]` patterns
- Calls `SuggestedMealService.extract_new_meal_suggestions()`
- Stores suggestions in background (non-blocking)

#### Admin Endpoints

**GET** `/patient-rag/admin/suggested-meals`

- List pending suggestions with pagination
- Returns governance stats (pending, approved, rejected, promoted counts)
- Requires admin role
- Query params: `skip=0&limit=50`

**POST** `/patient-rag/admin/suggested-meals/{suggestion_id}/approve`

- Approve a pending suggestion
- Request body: `{ status: "approved", reason?: string }`
- Sets `approved_by_user_id` and `approved_at`

**POST** `/patient-rag/admin/suggested-meals/{suggestion_id}/reject`

- Reject a pending suggestion
- Request body: `{ status: "rejected", reason?: string }`

**POST** `/patient-rag/admin/suggested-meals/{suggestion_id}/promote`

- Promote an approved suggestion to canonical meals
- Request body: `{ prepTimeMinutes?: int, cookTimeMinutes?: int }`
- Creates new Meals record
- Generates vector embedding
- Returns created meal ID

### 4. Pydantic Schemas

**File**: `Backend/app/schemas/patient_rag.py`

```python
class SuggestedMealCreateRequest(BaseModel):
    """Store a suggested meal."""
    name: str
    description: str | None
    cuisine: str | None
    calories: int | None
    proteinG: float | None
    carbsG: float | None
    fatG: float | None
    ingredients: str | None
    instructions: str | None
    sourceQuery: str
    modelName: str = "gemini-2.5-flash"
    llmConfidence: float = 0.7

class ListPendingSuggestionsResponse(BaseModel):
    """Governance stats + list of pending suggestions."""
    total: int
    pending: int
    approved: int
    rejected: int
    promoted: int
    suggestions: list[SuggestedMealItem]

class ApprovalDecisionRequest(BaseModel):
    """Approve or reject a suggestion."""
    status: str  # "approved" or "rejected"
    reason: str | None

class ApprovalDecisionResponse(BaseModel):
    """Confirmation of approval/rejection."""
    id: str
    status: str
    reason: str | None
    updatedAt: str

class PromoteMealRequest(BaseModel):
    """Promote approved suggestion to canonical meals."""
    prepTimeMinutes: int | None
    cookTimeMinutes: int | None

class PromoteMealResponse(BaseModel):
    """Confirmation of promotion."""
    suggestedMealId: str
    promotedMealId: str
    mealName: str
    promotedAt: str
```

### 5. Mobile Admin UI

**File**: `GenAI_FoodRecommender/app/screens/admin/SuggestedMealsScreen.tsx`

Features:

- **Stats Dashboard**: Shows counts of pending, approved, rejected, promoted
- **Pending Suggestions List**: Scrollable list of suggestions awaiting review
- **Detail Modal**: Full meal details + LLM metadata
- **Approval Actions**:
  - Approve with optional reason
  - Reject with optional reason
  - Promote (if approved) with prep/cook time
- **Color-coded Status**: pending (yellow), approved (green), rejected (red), promoted (blue)

---

## Workflow Example

### Scenario: Patient asks for "pescatarian meals under 400 calories"

1. **Request**: POST `/patient-rag/recommendations`

   ```json
   { "query": "pescatarian meals under 400 calories", "kRetrieved": 5 }
   ```

2. **Backend Processing**:
   - RAG retrieves 2 pescatarian meals from DB
   - LLM generates response including suggested meals
   - Response text contains: "... [New: not in base list] Seared Scallops with Fennel ..."

3. **Meal Capture**:
   - Endpoint regex extracts: `"Seared Scallops with Fennel"`
   - Creates SuggestedMeal record:
     ```
     {
       name: "Seared Scallops with Fennel",
       source_query: "pescatarian meals under 400 calories",
       user_id: "patient-123",
       model_name: "gemini-2.5-flash",
       llm_confidence: 0.7,
       status: "PENDING"
     }
     ```

4. **Admin Review** (next day):
   - Admin opens Suggested Meals screen
   - Sees stats: pending=1, approved=0, rejected=0, promoted=0
   - Clicks "Seared Scallops with Fennel"
   - Modal shows full details
   - Admin clicks "Approve" with reason "Good pescatarian protein source"
   - Status → APPROVED, approved_by_user_id = admin-001, approved_at = now

5. **Promotion**:
   - Admin sees "Ready to Promote" section
   - Clicks "Promote to Canonical Meals"
   - Endpoint:
     1. Creates new Meals record
     2. Sets prep_time_minutes=5, cook_time_minutes=10
     3. Generates embedding
     4. Updates SuggestedMeal: status=PROMOTED, promoted_meal_id=meals-999
   - Meal is now in canonical DB!

6. **Future Requests**:
   - When next patient asks for pescatarian meals, this new meal appears in results
   - No [New:...] label needed—it's now canonical

---

## Execution Steps

### 1. Run Migration

```bash
cd Backend
# Make sure alembic.ini points to your database
alembic upgrade head
```

This creates the `suggested_meals` table with all necessary columns and indexes.

### 2. Restart Backend

```bash
# If using uvicorn
uvicorn app.main:app --reload

# Or your deployment method
```

Backend will now:

- Accept meal recommendation requests
- Extract suggested meals from LLM responses
- Store them with governance workflow

### 3. Build Mobile App (Optional)

If you want the admin UI in the mobile app:

```bash
cd GenAI_FoodRecommender
npm install  # or yarn
npm run android  # or ios
```

The SuggestedMealsScreen is now available as a modal at `/patient-rag/admin/suggested-meals`.

---

## Configuration

### Environment Variables

No new env vars required! Uses existing:

- `LLM_API_KEY`, `GEMINI_API_KEY`, etc. (for LLM provider)
- `DATABASE_URL` (for storing suggestions)

### Model Defaults

In `Backend/app/services/suggested_meal_service.py`:

- `model_name`: defaults to `"gemini-2.5-flash"`
- `llm_confidence`: defaults to `0.7`

Can be overridden when calling `extract_new_meal_suggestions()`.

---

## Best Practices

### For Data Quality

1. **Review Before Promotion**
   - Always approve manually before promoting
   - Don't auto-promote—hallucinations happen

2. **Audit Trail**
   - `approved_by_user_id` and `approval_reason` track decisions
   - Query this for compliance/debugging

3. **Duplicate Prevention**
   - `store_suggested_meal()` checks `(name, source_query)` uniqueness
   - Prevents same LLM suggestion from being stored twice

### For Performance

1. **Embedding Generation**
   - Only generated for promoted meals (not pending)
   - Regeneration is non-blocking

2. **Pagination**
   - Admin endpoint uses `skip`/`limit` for large suggestion sets
   - Default: first 50 pending

3. **Indexing**
   - Columns indexed: `status`, `created_at`, `name`, `user_id`
   - Fast queries for admin dashboard

---

## Troubleshooting

### Issue: Suggestions not appearing in admin panel

**Check**:

1. Migration ran: `SELECT COUNT(*) FROM suggested_meals;`
2. LLM response contains `[New: not in base list]` pattern
3. User has admin role
4. No database errors in backend logs

### Issue: Promoted meal not showing in search results

**Check**:

1. Embedding was generated during promotion
2. Meal was inserted into `meals` table
3. Vector DB regeneration completed (check VectorStore logs)
4. Search query mentions the meal's keywords

### Issue: Regex not extracting meals

**Patterns detected**:

- `[New: not in base list] Meal Name`
- `[New] Meal Name`
- `Meal Name [New: ...]`

If LLM uses different format, update regex in `extract_new_meal_suggestions()`.

---

## Future Enhancements

1. **Batch Promotion**: Admin can promote multiple meals at once
2. **Suggestion Analytics**: Track which meals are most frequently suggested
3. **ML Ranking**: Score suggestions by popularity/approval rate
4. **Auto-cleanup**: Archive rejected suggestions after 30 days
5. **Cuisine Learning**: Infer cuisine from ingredients/instructions
6. **Nutritionist Review**: Assign to nutritionist role before promotion

---

## Summary

✅ **Completed**:

- Database model and migration
- Service layer with full workflow
- API endpoints (patient + admin)
- Mobile admin UI
- Automatic extraction from LLM responses
- Governance workflow: pending → approved/rejected → promoted
- Full audit trail and metadata

🚀 **Ready to Use**:

- Patients get better recommendations as new meals are discovered
- Base dataset improves over time without manual curation
- Quality controlled through admin approval
- Reversible (rejected meals can be re-reviewed)
- Transparent (all decisions logged)
