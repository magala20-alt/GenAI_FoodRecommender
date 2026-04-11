"""
Embedding Service - Generates vector embeddings for meals, recipes, and patient data.
Uses HuggingFace sentence transformers for efficient embedding generation.
"""

import logging
import os
from pathlib import Path
from typing import Any, List
import numpy as np

from app.core.config import settings


logger = logging.getLogger(__name__)


class EmbeddingService:
    """Manages embedding generation for RAG context retrieval."""

    _model_cache: dict[str, Any] = {}

    @staticmethod
    def _clear_invalid_ssl_env_vars() -> bool:
        """Remove broken SSL env var paths that can break HuggingFace/httpx downloads."""
        changed = False
        for env_name in ("SSL_CERT_FILE", "REQUESTS_CA_BUNDLE", "CURL_CA_BUNDLE"):
            value = os.environ.get(env_name)
            if not value:
                continue

            if not Path(value).exists():
                os.environ.pop(env_name, None)
                logger.warning("Removed invalid %s path: %s", env_name, value)
                changed = True

        return changed
    
    def __init__(self, model_name: str = None):
        """Initialize embedding model."""
        model_name = model_name or settings.embedding_model

        cached_model = self._model_cache.get(model_name)
        if cached_model is not None:
            self.model = cached_model
            self.dimension = settings.vector_db_dimension
            return

        try:
            from sentence_transformers import SentenceTransformer  # type: ignore
            self.model = SentenceTransformer(model_name)
        except OSError:
            # Retry once after cleaning broken SSL env paths from the process.
            cleaned = self._clear_invalid_ssl_env_vars()
            if not cleaned:
                raise
            from sentence_transformers import SentenceTransformer  # type: ignore
            self.model = SentenceTransformer(model_name)

        self._model_cache[model_name] = self.model
        self.dimension = settings.vector_db_dimension
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text string.
        
        Args:
            text: Input text to embed
            
        Returns:
            List of floats representing the embedding vector
        """
        if not text or not text.strip():
            # Return zero vector for empty text
            return [0.0] * self.dimension
        
        embedding = self.model.encode(text, convert_to_numpy=True)
        # Ensure correct dimension
        if len(embedding) != self.dimension:
            raise ValueError(
                f"Embedding dimension {len(embedding)} "
                f"doesn't match expected {self.dimension}"
            )
        return embedding.tolist()
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts efficiently.
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return [emb.tolist() for emb in embeddings]
    
    def similarity_score(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings.
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Similarity score between 0 and 1
        """
        emb1 = np.array(embedding1)
        emb2 = np.array(embedding2)
        
        # Cosine similarity
        dot_product = np.dot(emb1, emb2)
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))
