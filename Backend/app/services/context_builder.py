"""
Context Builder - Assembles complete prompts by combining system prompts,
retrieved context (from vector DB and SQL DB), examples, and user queries.
"""

from typing import List, Dict, Any, Optional


class ContextBuilder:
    """Builds complete prompts by assembling context from multiple sources."""
    
    @staticmethod
    def build_meal_recommendation_context(
        system_prompt: str,
        user_query: str,
        retrieved_meals: List[Dict[str, Any]],
        user_preferences: Optional[Dict[str, Any]] = None,
        examples: Optional[List[Dict[str, str]]] = None,
        include_all_meals: bool = False,
        all_available_meals: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, str]]:
        """
        Build complete prompt for meal recommendations.
        
        Args:
            system_prompt: System role/instructions
            user_query: User's request/query
            retrieved_meals: Meals retrieved from vector similarity
            user_preferences: User's dietary preferences, goals, etc.
            examples: Few-shot examples for better LLM performance
            include_all_meals: Whether to include all meals as fallback context
            all_available_meals: All meals in the system (for fallback)
            
        Returns:
            List of message dicts ready for LLM API
        """
        messages = []
        
        # Add system prompt
        system_content = system_prompt
        if user_preferences:
            system_content += ContextBuilder._format_user_preferences(user_preferences)
        
        messages.append({
            "role": "system",
            "content": system_content
        })
        
        # Add few-shot examples
        if examples:
            for example in examples:
                messages.append({"role": "user", "content": example.get("user", "")})
                messages.append({"role": "assistant", "content": example.get("assistant", "")})
        
        # Build user message with context
        context_str = ContextBuilder._format_retrieved_meals_context(retrieved_meals)
        
        # Add fallback meals if provided
        if include_all_meals and all_available_meals:
            context_str += ContextBuilder._format_all_meals_context(all_available_meals)
        
        user_message = f"""## Context: Available Meals
{context_str}

## User Request
{user_query}

## Important Requirements
    1. Prioritize meals from the provided context when they fit the request
    2. If context is sparse or cuisine-specific matches are missing, suggest suitable alternatives from general culinary knowledge
    3. Explain why each recommendation matches the user's needs
    4. Provide nutritional information where relevant
    5. Include preparation tips or modifications if applicable
"""
        
        messages.append({"role": "user", "content": user_message})
        
        return messages
    
    @staticmethod
    def build_patient_analysis_context(
        system_prompt: str,
        patient_data: Dict[str, Any],
        meal_history: List[Dict[str, Any]],
        predictions: Optional[Dict[str, Any]] = None,
        recent_trends: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, str]]:
        """
        Build complete prompt for patient analysis/summary.
        
        Args:
            system_prompt: System role/instructions
            patient_data: Patient's profile and current metrics
            meal_history: Patient's recent meal history
            predictions: Predicted health metrics
            recent_trends: Identified trends in patient data
            
        Returns:
            List of message dicts ready for LLM API
        """
        messages = []
        
        # Add system prompt
        messages.append({"role": "system", "content": system_prompt})
        
        # Build comprehensive user message
        user_message = f"""## Patient Information
{ContextBuilder._format_patient_data(patient_data)}

## Recent Meal History
{ContextBuilder._format_meal_history(meal_history)}
"""
        
        if predictions:
            user_message += f"""## Health Predictions
{ContextBuilder._format_predictions(predictions)}
"""
        
        if recent_trends:
            user_message += f"""## Identified Trends
{ContextBuilder._format_trends(recent_trends)}
"""
        
        user_message += """## Your Task
Provide a professional summary of this patient's current status, trends, and recommendations."""
        
        messages.append({"role": "user", "content": user_message})
        
        return messages
    
    @staticmethod
    def build_patient_filter_context(
        system_prompt: str,
        user_query: str,
        available_patients: List[Dict[str, Any]]
    ) -> List[Dict[str, str]]:
        """
        Build prompt for filtering/searching patients.
        
        Args:
            system_prompt: System role/instructions
            user_query: Clinician's query (e.g., "Find patients with high BP and missed meals")
            available_patients: All available patients metadata
            
        Returns:
            List of message dicts ready for LLM API
        """
        messages = []
        
        messages.append({"role": "system", "content": system_prompt})
        
        patients_str = "## Available Patients\n"
        for patient in available_patients:
            patients_str += f"\nID: {patient.get('id')} | {patient.get('name')} | Risk: {patient.get('risk_level')}"
            adherence = patient.get('adherence')
            if adherence is not None:
                patients_str += f" | Adherence: {adherence}%"
            alerts_count = patient.get('alerts_count')
            if alerts_count is not None:
                patients_str += f" | Alerts: {alerts_count}"
            if patient.get('last_metrics'):
                patients_str += f" | BP: {patient['last_metrics'].get('blood_pressure')}"
                glucose = patient['last_metrics'].get('glucose')
                if glucose is not None:
                    patients_str += f" | Glucose: {glucose}"
        
        user_message = f"""{patients_str}

## Query
{user_query}

## Task
Identify which patients match the criteria and explain why."""
        
        messages.append({"role": "user", "content": user_message})
        
        return messages
    
    # ============ Formatting Helper Methods ============
    
    @staticmethod
    def _format_retrieved_meals_context(meals: List[Dict[str, Any]]) -> str:
        """Format retrieved meals for context."""
        if not meals:
            return "No specific meals matched the query. General recommendations available."
        
        context = "### Most Relevant Meals:\n"
        for i, meal in enumerate(meals, 1):
            context += f"\n**{i}. {meal.get('name', 'Unknown')}** (Match Score: {meal.get('similarity_score', 0):.2f})\n"
            if meal.get('cuisine'):
                context += f"   Cuisine: {meal['cuisine']}\n"
            if meal.get('description'):
                context += f"   Description: {meal['description']}\n"
            context += (
                f"   Nutrition: {meal.get('calories', 0)} cal, "
                f"Protein: {meal.get('protein_g', 0)}g, "
                f"Carbs: {meal.get('carbs_g', 0)}g, "
                f"Fat: {meal.get('fat_g', 0)}g\n"
            )
            if meal.get('prep_time_minutes'):
                context += f"   Prep Time: {meal['prep_time_minutes']} minutes\n"
        
        return context
    
    @staticmethod
    def _format_all_meals_context(meals: List[Dict[str, Any]]) -> str:
        """Format all meals as fallback context."""
        context = "\n### All Available Meals (if needed as fallback):\n"
        for meal in meals[:20]:  # Limit to 20 to avoid token bloat
            context += f"- {meal.get('name', 'Unknown')} ({meal.get('cuisine', 'N/A')}, {meal.get('calories', 0)} cal)\n"
        if len(meals) > 20:
            context += f"- ... and {len(meals) - 20} more meals available\n"
        return context
    
    @staticmethod
    def _format_user_preferences(preferences: Dict[str, Any]) -> str:
        """Format user preferences for system prompt."""
        if not preferences:
            return ""
        
        context = "\n\n## User Profile:\n"
        if preferences.get('goal'):
            context += f"- Health Goal: {preferences['goal']}\n"
        if preferences.get('dietary_preference'):
            context += f"- Dietary Preference: {preferences['dietary_preference']}\n"
        if preferences.get('cuisine_preference'):
            context += f"- Cuisine Preference: {preferences['cuisine_preference']}\n"
        if preferences.get('dietary_constraints'):
            context += f"- Constraints/Conditions: {preferences['dietary_constraints']}\n"
        if preferences.get('allergies'):
            context += f"- Allergies: {preferences['allergies']}\n"
        
        return context
    
    @staticmethod
    def _format_patient_data(patient: Dict[str, Any]) -> str:
        """Format patient data for context."""
        context = f"- **Name**: {patient.get('name', 'Unknown')}\n"
        if patient.get('age'):
            context += f"- **Age**: {patient['age']}\n"
        if patient.get('diagnosis'):
            context += f"- **Diagnosis**: {patient['diagnosis']}\n"
        if patient.get('current_metrics'):
            metrics = patient['current_metrics']
            context += f"- **Current Blood Pressure**: {metrics.get('blood_pressure', 'N/A')}\n"
            context += f"- **Glucose Level**: {metrics.get('glucose', 'N/A')} mg/dL\n"
            context += f"- **Weight**: {metrics.get('weight', 'N/A')} kg\n"
        if patient.get('risk_level'):
            context += f"- **Risk Level**: {patient['risk_level']}\n"
        
        return context
    
    @staticmethod
    def _format_meal_history(meals: List[Dict[str, Any]]) -> str:
        """Format meal history for context."""
        if not meals:
            return "No recent meal history available.\n"
        
        context = ""
        for meal in meals[-7:]:  # Last 7 meals
            context += f"- {meal.get('meal_name', 'Unknown')}: {meal.get('calories', 0)} cal, "
            context += f"Protein: {meal.get('protein_g', 0)}g | Date: {meal.get('date', 'N/A')}\n"
        
        return context
    
    @staticmethod
    def _format_predictions(predictions: Dict[str, Any]) -> str:
        """Format predicted metrics for context."""
        context = ""
        if predictions.get('predicted_glucose'):
            context += f"- Predicted Glucose (7 days): {predictions['predicted_glucose']} mg/dL\n"
        if predictions.get('weight_trend'):
            context += f"- Weight Trend: {predictions['weight_trend']}\n"
        
        return context
    
    @staticmethod
    def _format_trends(trends: Dict[str, Any]) -> str:
        """Format identified trends for context."""
        context = ""
        if trends.get('eating_pattern'):
            context += f"- Eating Pattern: {trends['eating_pattern']}\n"
        if trends.get('health_concerns'):
            context += f"- Health Concerns: {trends['health_concerns']}\n"
        if trends.get('adherence_issues'):
            context += f"- Adherence Issues: {trends['adherence_issues']}\n"
        
        return context
