
# Structured output format (for JSON mode)
JSON_OUTPUT_FORMAT = """
Return your response in this JSON format:
{
  top_recommendation: {
    "meal": "",
    "cuisine": "",
    "reason": "",
    Steps: "",
    Protein:"",
    Calories: "",
    Carbs: "",
    Fat: "",
    Fiber: "",
    Description: "",

  },
  "alternatives": [
    {
     "meal": "",
    "cuisine": "",
    "reason": "",
    Steps: "",
    Protein:"",
    Calories: "",
    Carbs: "",
    Fat: "",
    Fiber: "",
    Description: "",
    }
  ],
  "tips": ["Cooking tip 1", "Cooking tip 2"],
  "refinement_suggestions": ["Try adding more protein", "Could substitute with chicken"]
}
"""

# Natural language format for the chatbot
NATURAL_MEAL_MESSAGE_FORMAT = """
Format your response naturally with:
1. A clear top recommendation with reasoning
2. 2-3 alternatives with brief justifications
3. Practical cooking tips
4. Questions for refinement

Use markdown for readability:
- **Bold** for recipe names
- Bullet points for tips
- Separate sections clearly
"""

# Structured output format for clinician summaries
CLINICIAN_SUMMARY_FORMAT = """
Return a concise summary for clinicians:
1. Key eating patterns (e.g., "High sugar intake in evenings")
2. Potential risks (e.g., "Risk of blood sugar spikes")
3. Trends (e.g., "Increasing calorie intake over 2 weeks")
4. Actionable recommendations (e.g., "Scheduling a meeting with patient", "Changing medication", "Suggesting dietary changes")
Use professional language and be concise. Do NOT provide medical advice or diagnoses.
"""
