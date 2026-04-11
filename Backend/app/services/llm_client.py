"""
LLM Client - Interface for calling language models (OpenAI, Gemini, etc.).
Provides a unified interface regardless of the underlying LLM provider.
"""

import logging
import os
from typing import Any, Dict, List, Optional
from abc import ABC, abstractmethod

from app.core.config import settings


logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    """Abstract base for LLM providers."""
    
    @abstractmethod
    def call(self, messages: List[Dict[str, Any]]) -> str:
        """Call the LLM with messages."""
        pass


class OpenAICompatibleProvider(LLMProvider):
    """OpenAI SDK chat-completions provider for OpenAI-compatible endpoints."""
    
    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        *,
        base_url: str | None = None,
        provider_label: str = "OpenAI",
        provider_key_env: tuple[str, ...] = (),
    ):
        """Initialize an OpenAI-compatible provider."""
        try:
            import openai
        except ImportError:
            raise ImportError(
                "OpenAI package not installed. Install with: pip install openai"
            )
        
        self.openai = openai
        self.provider_label = provider_label
        resolved_key = (api_key or "").strip()
        if not resolved_key:
            resolved_key = (settings.llm_api_key or "").strip()
        if not resolved_key:
            for env_var in provider_key_env:
                env_value = (os.getenv(env_var) or "").strip()
                if env_value:
                    resolved_key = env_value
                    break

        self.api_key = resolved_key
        self.model = (model or settings.llm_model or "").strip()
        
        if not self.api_key:
            raise ValueError(f"{provider_label} API key not provided")
        
        client_kwargs: dict[str, Any] = {"api_key": self.api_key}
        if base_url:
            client_kwargs["base_url"] = base_url
        self.client = openai.OpenAI(**client_kwargs)
    
    def call(self, messages: List[Dict[str, Any]]) -> str:
        """Call the configured OpenAI-compatible API."""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=settings.llm_temperature,
            max_tokens=2000
        )
        return response.choices[0].message.content or ""


class OpenAIProvider(OpenAICompatibleProvider):
    """OpenAI API provider."""

    def __init__(self, api_key: str | None = None, model: str | None = None):
        super().__init__(
            api_key=api_key,
            model=model,
            provider_label="OpenAI",
            provider_key_env=("OPENAI_API_KEY",),
        )


class GeminiProvider(OpenAICompatibleProvider):
    """Gemini API provider via the OpenAI-compatible Google endpoint."""

    GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
    DEFAULT_MODELS = [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash-lite",
    ]

    def __init__(self, api_key: str | None = None, model: str | None = None):
        resolved_model = (model or settings.llm_model or "").strip()
        if not resolved_model or not resolved_model.startswith("gemini-"):
            resolved_model = self.DEFAULT_MODELS[0]

        super().__init__(
            api_key=api_key,
            model=resolved_model,
            base_url=self.GEMINI_BASE_URL,
            provider_label="Gemini",
            provider_key_env=("GEMINI_API_KEY", "GOOGLE_API_KEY"),
        )
        self.model_candidates = [self.model] + [candidate for candidate in self.DEFAULT_MODELS if candidate != self.model]

    def call(self, messages: List[Dict[str, Any]]) -> str:
        last_error: Exception | None = None

        for candidate_model in self.model_candidates:
            try:
                response = self.client.chat.completions.create(
                    model=candidate_model,
                    messages=messages,
                    temperature=settings.llm_temperature,
                    max_tokens=2000,
                )
                self.model = candidate_model
                return response.choices[0].message.content or ""
            except Exception as exc:
                last_error = exc
                error_text = str(exc).lower()
                if "not found" not in error_text and "unsupported" not in error_text:
                    raise
                logger.warning("Gemini model %s failed, trying fallback model", candidate_model)

        if last_error is not None:
            raise last_error

        raise RuntimeError("Gemini provider failed without an explicit error")




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

    @staticmethod
    def _resolve_provider_name() -> str:
        provider_name = (settings.llm_provider or "").strip().lower()
        api_key = (settings.llm_api_key or "").strip()
        gemini_key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip()
        openai_key = (os.getenv("OPENAI_API_KEY") or "").strip()

        if provider_name in {"google", "google-gemini"}:
            return "gemini"

        # Default to Gemini when provider is omitted.
        if not provider_name:
            if gemini_key:
                return "gemini"
            if openai_key:
                return "openai"
            return "gemini"

        # Support seamless migrations by auto-switching from openai label when a Google key is provided.
        if provider_name == "openai" and (api_key.startswith("AIza") or gemini_key):
            logger.info("Auto-detected Gemini provider from Google API key prefix.")
            return "gemini"

        return provider_name

    @staticmethod
    def _provider_factories() -> dict[str, type[LLMProvider]]:
        return {
            "gemini": GeminiProvider,
            "openai": OpenAIProvider,
        }

    @classmethod
    def _provider_priority(cls) -> list[str]:
        configured = cls._resolve_provider_name()
        priorities = [configured]
        for fallback_name in ("gemini", "openai"):
            if fallback_name not in priorities:
                priorities.append(fallback_name)
        return priorities

    @classmethod
    def _build_provider(cls, provider_name: str) -> LLMProvider:
        factories = cls._provider_factories()
        provider_cls = factories.get(provider_name)
        if provider_cls is None:
            supported = ", ".join(sorted(factories.keys()))
            raise ValueError(
                f"Unknown LLM provider: {provider_name}. "
                f"Supported: {supported}"
            )
        return provider_cls()

    @classmethod
    def _ensure_provider(cls) -> None:
        if cls._provider is not None:
            return

        last_error: Exception | None = None
        for provider_name in cls._provider_priority():
            try:
                cls._provider = cls._build_provider(provider_name)
                logger.info("Initialized LLM provider: %s", provider_name)
                return
            except Exception as exc:  # noqa: BLE001 - provider setup should be resilient
                last_error = exc
                logger.warning("LLM provider %s initialization failed: %s", provider_name, exc)

        if last_error is not None:
            raise last_error
        raise RuntimeError("No LLM provider could be initialized")
    
    @classmethod
    def _initialize_provider(cls) -> None:
        """Initialize the LLM provider based on configuration."""
        cls._provider = None
        cls._ensure_provider()
    
    @classmethod
    def set_provider(cls, provider: LLMProvider) -> None:
        """Manually set the LLM provider."""
        cls._provider = provider
    
    def call(
        self,
        messages: List[Dict[str, Any]],
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
            override_name = provider_override.lower()
            provider = self._build_provider(override_name)
           
        
        if not provider:
            self._initialize_provider()
            provider = self._provider

        if not provider:
            raise RuntimeError("No LLM provider could be initialized from configured API keys")
        
        return provider.call(messages)
    
    @classmethod
    def reset(cls) -> None:
        """Reset the singleton instance."""
        cls._instance = None
        cls._provider = None


def get_llm_client() -> LLMClient:
    """Get the singleton LLM client instance."""
    return LLMClient()
