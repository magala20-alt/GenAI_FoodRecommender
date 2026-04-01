# Example prompts and responses for diabetes-friendly meal recommendations, used for few-shot learning in the LLM prompt.

DIABETES_FRIENDLY_EXAMPLES = [
    {
        "user": "Show me diabetes-friendly Chinese recipes",
        "assistant": """
**Recipe 1: Garlic Stir Fry**
- Carbs: 15g
- Fats: 8g
- Calories: 220 kcal
- Protein: 18g
- Glycemic Load: Low (5)
- Instructions: Heat 1 tbsp oil, sauté minced garlic (4 cloves) for 30 seconds, add sliced chicken breast (150g), cook until golden, add bok choy (2 cups), stir-fry 3-4 minutes. Season with 1 tbsp low-sodium soy sauce.
- Modifications: Replace with tofu for vegetarian option; add cauliflower rice to increase volume without carbs
- Best for: Quick weeknight dinner, post-workout meal

**Recipe 2: Steamed Fish with Ginger**
- Carbs: 8g
- Fats: 6g
- Calories: 180 kcal
- Protein: 28g
- Glycemic Load: Very Low (3)
- Instructions: Place white fish fillet (150g) on heatproof plate, top with ginger slivers (1 tbsp) and scallions, steam 8-10 minutes. Drizzle with 1 tsp sesame oil and 1 tbsp light soy sauce.
- Modifications: Use salmon for higher omega-3; add steamed broccoli on side
- Best for: Light lunch, heart-healthy option

**Recipe 3: Cucumber Salad**
- Carbs: 6g
- Fats: 4g
- Calories: 65 kcal
- Protein: 2g
- Glycemic Load: Low (2)
- Instructions: Slice cucumbers (2 cups) thinly, toss with rice vinegar (2 tbsp), sesame seeds (1 tsp), pinch of salt, and optional chili flakes. Chill for 10 minutes before serving.
- Modifications: Add edamame for protein; include seaweed for minerals
- Best for: Appetizer, side dish, summer meal
"""
    },
    {
        "user": "I need low-carb breakfast ideas",
        "assistant": """
**Recipe 1: Vegetable Egg Muffins**
- Carbs: 4g
- Fats: 12g
- Calories: 180 kcal
- Protein: 14g
- Glycemic Load: Very Low (2)
- Instructions: Whisk 6 eggs with chopped spinach (1 cup), bell peppers (½ cup), and mushrooms (½ cup). Pour into muffin tin, bake at 350°F for 20 minutes.
- Modifications: Add cheese for more flavor; use egg whites for lower fat
- Best for: Meal prep, grab-and-go breakfast

**Recipe 2: Greek Yogurt Berry Bowl**
- Carbs: 12g
- Fats: 8g
- Calories: 210 kcal
- Protein: 18g
- Glycemic Load: Low (4)
- Instructions: Combine 1 cup plain Greek yogurt with ½ cup mixed berries, top with 1 tbsp chopped almonds.
- Modifications: Use coconut yogurt for dairy-free; add chia seeds for fiber
- Best for: Quick breakfast, post-workout snack
"""
    }
]

CLINICAL_SUMMARY_EXAMPLES = [
    """
** AI Summary for Clinician Review **
Patient engagement has declined significantly over the past 7 days, with only 2 out of 7 meal logs recorded. 
Combined with a rising blood pressure trend (142/95 mmHg, up from 128/82 two weeks ago) and a worsening glucose pattern averaging 8.9 mmol/L, the adherence risk score has reached 0.87 — the highest in this patient's history. 
Immediate clinical review is recommended.

** Recommendations for Clinician Action **
1. Schedule a follow-up appointment within the next week. Within 48HOURS (Priorty)
2. Discuss potential barriers to adherence, such as medication side effects or lifestyle challenges.
3. Simplify Meal plan.
"""
]