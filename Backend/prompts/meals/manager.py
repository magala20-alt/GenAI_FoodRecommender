# prompts/manager.py - Updated section

class PromptManager:
    def __init__(self, output_format: str = "cards"):
        """
        output_format: "cards" (natural language with structure) or "json" (structured data)
        """
        self.output_format = output_format
        self.system_prompt = BASE_SYSTEM_PROMPT
    
    def get_output_format_instruction(self) -> str:
        """Get format instruction for card-based UI"""
        if self.output_format == "json":
            return JSON_CARD_FORMAT
        return CARD_OUTPUT_FORMAT
    
    def create_full_prompt(
        self,
        query: str,
        retrieved_recipes: List[Dict],
        prompt_type: str = "base",
        filters: Optional[Dict] = None,
        include_examples: bool = True,
        conversation_history: Optional[List] = None,
        max_recipes: int = 3  # For carousel, typically 3-5
    ) -> List[Dict[str, str]]:
        """Create complete prompt for card-based output"""
        
        messages = [
            {
                "role": "system", 
                "content": self.get_system_prompt(
                    prompt_type, 
                    **filters if filters else {}
                )
            }
        ]
        
        # Add examples for card format
        if include_examples:
            examples = self.get_examples(prompt_type)
            for example in examples:
                messages.append({"role": "user", "content": example["user"]})
                messages.append({"role": "assistant", "content": example["assistant"]})
        
        # Add conversation history
        if conversation_history:
            messages.extend(conversation_history)
        
        # Format context from retrieved recipes
        context = self.build_context(retrieved_recipes[:max_recipes])
        
        # Build user prompt
        user_prompt = self._build_user_prompt(query, filters)
        
        # Combine everything
        full_user_content = f"""
## Retrieved Recipes (Context)
{context}

---

## User Request
{user_prompt}

---

## Important Output Requirements
1. Recommend exactly {max_recipes} recipes
2. Use the exact format specified below
3. Include glycemic load with both level (Low/Medium/High) and numeric score
4. Keep instructions concise (1-2 sentences per recipe)
5. Provide practical modifications

---

## Output Format
{self.get_output_format_instruction()}
"""
        
        messages.append({"role": "user", "content": full_user_content})
        
        return messages