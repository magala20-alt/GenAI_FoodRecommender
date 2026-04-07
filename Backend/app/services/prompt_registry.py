"""
Prompt Registry - Dynamically loads and manages prompts from the prompts folder.
Allows flexible prompt management without code changes, enabling experimentation.
"""

import os
from typing import Dict, List, Optional, Any
from pathlib import Path
import sys
import importlib.util

from app.core.config import settings


class PromptRegistry:
    """Registry for managing and loading prompts from filesystem."""
    
    # Paths to prompt modules
    PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"
    MEALS_PROMPTS_DIR = PROMPTS_DIR / "meals"
    PATIENTS_PROMPTS_DIR = PROMPTS_DIR / "patients"
    
    # Cache for loaded prompts
    _cache: Dict[str, Any] = {}
    
    @classmethod
    def load_prompt(cls, category: str, prompt_name: str, reload: bool = False) -> str:
        """
        Load a specific prompt string from the prompts folder.
        
        Args:
            category: "meals" or "patients"
            prompt_name: Name of the prompt variable (e.g., "SYSTEM_PROMT", "CLINICIAN_SYSTEM_PROMPT")
            reload: Force reload from disk instead of cache
            
        Returns:
            Prompt string
            
        Raises:
            ValueError: If prompt not found
        """
        cache_key = f"{category}:{prompt_name}"
        
        if not reload and cache_key in cls._cache:
            return cls._cache[cache_key]
        
        # Determine which module to load
        if category.lower() == "meals":
            module_path = cls.MEALS_PROMPTS_DIR / "base.py"
        elif category.lower() == "patients":
            module_path = cls.PATIENTS_PROMPTS_DIR / "base.py"
        else:
            raise ValueError(f"Unknown category: {category}")
        
        if not module_path.exists():
            raise FileNotFoundError(f"Prompt module not found: {module_path}")
        
        # Load module dynamically
        spec = importlib.util.spec_from_file_location("prompt_module", module_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Cannot load module from {module_path}")
        
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        # Get the prompt string
        if not hasattr(module, prompt_name):
            available = [name for name in dir(module) 
                        if not name.startswith('_') and isinstance(getattr(module, name), str)]
            raise ValueError(
                f"Prompt '{prompt_name}' not found in {category}. "
                f"Available: {available}"
            )
        
        prompt = getattr(module, prompt_name)
        cls._cache[cache_key] = prompt
        
        return prompt
    
    @classmethod
    def get_meal_prompt(cls, prompt_type: str = "base") -> str:
        """
        Get a meal-related system prompt.
        
        Args:
            prompt_type: Type of prompt ("base", "search", "filter", etc.)
            
        Returns:
            System prompt string
        """
        if prompt_type == "base" or prompt_type == "search":
            return cls.load_prompt("meals", "SYSTEM_PROMT")
        elif prompt_type == "snapshot":
            return cls.load_prompt("meals", "MEAL_SNAPSHOT_EXTRACT_PROMPT")
        else:
            raise ValueError(f"Unknown meal prompt type: {prompt_type}")
    
    @classmethod
    def get_patient_prompt(cls, prompt_type: str = "clinician") -> str:
        """
        Get a patient-related system prompt.
        
        Args:
            prompt_type: Type of prompt ("clinician", "filter", etc.)
            
        Returns:
            System prompt string
        """
        if prompt_type == "clinician":
            return cls.load_prompt("patients", "CLINICIAN_SYSTEM_PROMPT")
        elif prompt_type == "filter":
            return cls.load_prompt("patients", "PATIENT_FILTER_SYSTEM_PROMPT")
        else:
            raise ValueError(f"Unknown patient prompt type: {prompt_type}")
    
    @classmethod
    def list_available_prompts(cls) -> Dict[str, List[str]]:
        """
        List all available prompts by category.
        
        Returns:
            Dict mapping categories to lists of prompt names
        """
        prompts = {
            "meals": cls._list_prompts_in_module(cls.MEALS_PROMPTS_DIR / "base.py"),
            "patients": cls._list_prompts_in_module(cls.PATIENTS_PROMPTS_DIR / "base.py"),
        }
        return prompts
    
    @classmethod
    def _list_prompts_in_module(cls, module_path: Path) -> List[str]:
        """
        List all prompt variables (strings) in a module.
        
        Args:
            module_path: Path to the Python module
            
        Returns:
            List of prompt variable names
        """
        if not module_path.exists():
            return []
        
        spec = importlib.util.spec_from_file_location("prompt_module", module_path)
        if spec is None or spec.loader is None:
            return []
        
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        prompts = [
            name for name in dir(module)
            if not name.startswith('_') and isinstance(getattr(module, name), str)
        ]
        
        return prompts
    
    @classmethod
    def clear_cache(cls) -> None:
        """Clear the prompt cache."""
        cls._cache.clear()
