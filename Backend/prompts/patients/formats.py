
# For natural language queries (like your UI)
NATURAL_LANGUAGE_FILTER_PROMPT = """
You are a patient filter assistant. Convert this natural language request into patient filters and return matching patients.

## Query: {query}

## Patient Data:
{patient_data}

## Instructions:
- Understand the intent: "{query}"
- Apply standard clinical definitions
- Return matching patients with their key metrics
- If no matches, suggest adjusting filters

## Response Template:
**Filters Applied:**
- [Filter 1]
- [Filter 2]

## Table Columns Required
| Column | Description | Format |
|--------|-------------|--------|
| Initials | Two-letter uppercase initials from name | "SM", "JT", etc. |
| Name | Full name | "Sarah Mensah" |
| Email | Email address | "sarah.m@email.com" |
| Age | Age in years | 42 |
| Risk Level | Risk badge with dot | "·High", "·Medium", "·Low" |
| Adherence | Percentage with bar/visual indicator | "28%" |
| Alerts | Number of active alerts | "2active", "1active", "None" |
| Actions | Available actions | "View", "Intervene", "Note" |

## Response Format
Return a JSON object with:
{
  "patients": [
    {
      "initials": "SM",
      "name": "Sarah Mensah",
      "email": "sarah.m@email.com",
      "age": 42,
      "risk_level": "High",
      "risk_display": "·High",
      "adherence": 28,
      "adherence_display": "28%",
      "alerts": 2,
      "alerts_display": "2active",
      "actions": ["View", "Intervene"],
      "action_display": "View / Intervene"
    }
  ]}

Found X patients matching: {filter_summary}
"""

# For structured filter building (backend)
STRUCTURED_FILTER_PROMPT = """
Parse this query into structured filters:

Query: "{query}"

Return JSON:
{{
  "filters": [
    {{"field": "risk_level", "operator": "eq", "value": "High"}},
    {{"field": "bp_trend", "operator": "trend", "direction": "rising", "days": 7}},
    {{"field": "missed_meals", "operator": "gte", "value": 3, "days": 7}}
  ],
  "timeframe": "last_7_days",
  "original_query": "{query}"
}}
"""