"""
LLM Client - Interface for calling language models (OpenAI, Anthropic, etc.)
Provides a unified interface regardless of the underlying LLM provider.
"""

from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod

from app.core.config import settings


class LLMProvider(ABC):
    """Abstract base for LLM providers."""
    
    @abstractmethod
    def call(self, messages: List[Dict[str, str]]) -> str:
        """Call the LLM with messages."""
        pass


class OpenAIProvider(LLMProvider):
    """OpenAI API provider."""
    
    def __init__(self, api_key: str = None, model: str = None):
        """Initialize OpenAI provider."""
        try:
            import openai
        except ImportError:
            raise ImportError(
                "OpenAI package not installed. Install with: pip install openai"
            )
        
        self.openai = openai
        self.api_key = api_key or settings.llm_api_key
        self.model = model or settings.llm_model
        
        if not self.api_key:
            raise ValueError("OpenAI API key not provided")
        
        self.client = openai.OpenAI(api_key=self.api_key)
    
    def call(self, messages: List[Dict[str, str]]) -> str:
        """Call OpenAI API."""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=settings.llm_temperature,
            max_tokens=2000
        )
        return response.choices[0].message.content


class AnthropicProvider(LLMProvider):
    """Anthropic Claude API provider."""
    
    def __init__(self, api_key: str = None, model: str = None):
        """Initialize Anthropic provider."""
        try:
            import anthropic
        except ImportError:
            raise ImportError(
                "Anthropic package not installed. Install with: pip install anthropic"
            )
        
        self.anthropic = anthropic
        self.api_key = api_key or settings.llm_api_key
        self.model = model or settings.llm_model or "claude-3-sonnet-20240229"
        
        if not self.api_key:
            raise ValueError("Anthropic API key not provided")
        
        self.client = anthropic.Anthropic(api_key=self.api_key)
    
    def call(self, messages: List[Dict[str, str]]) -> str:
        """Call Anthropic API."""
        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=messages
        )
        return response.content[0].text


class LLMClient:
    """Unified client for calling different LLM providers."""
    
    _instance: Optional['LLMClient'] = None
    _provider: Optional[LLMProvider] = None
    
    def __new__(cls):
        """Singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize_provider()
        return cls._instance
    
    @classmethod
    def _initialize_provider(cls) -> None:
        """Initialize the LLM provider based on configuration."""
        provider_name = settings.llm_provider.lower()
        
        if provider_name == "openai":
            cls._provider = OpenAIProvider()
        elif provider_name == "anthropic" or provider_name == "claude":
            cls._provider = AnthropicProvider()
        else:
            raise ValueError(
                f"Unknown LLM provider: {provider_name}. "
                f"Supported: openai, anthropic"
            )
    
    @classmethod
    def set_provider(cls, provider: LLMProvider) -> None:
        """Manually set the LLM provider."""
        cls._provider = provider
    
    def call(
        self,
        messages: List[Dict[str, str]],
        provider_override: Optional[str] = None
    ) -> str:
        """
        Call the LLM.
        
        Args:
            messages: List of message dicts with 'role' and 'content' keys
            provider_override: Temporarily use a different provider
            
        Returns:
            LLM response text
        """
        provider = self._provider
        
        if provider_override:
            if provider_override.lower() == "openai":
                provider = OpenAIProvider()
            elif provider_override.lower() == "anthropic":
                provider = AnthropicProvider()
        
        if not provider:
            raise RuntimeError("No LLM provider initialized")
        
        return provider.call(messages)
    
    @classmethod
    def reset(cls) -> None:
        """Reset the singleton instance."""
        cls._instance = None
        cls._provider = None


def get_llm_client() -> LLMClient:
    """Get the singleton LLM client instance."""
    return LLMClient()
