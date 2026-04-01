"""
Embedding Service - Generates vector embeddings for meals, recipes, and patient data.
Uses HuggingFace sentence transformers for efficient embedding generation.
"""

from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer  # type: ignore

from app.core.config import settings


class EmbeddingService:
    """Manages embedding generation for RAG context retrieval."""
    
    def __init__(self, model_name: str = None):
        """Initialize embedding model."""
        model_name = model_name or settings.embedding_model
        self.model = SentenceTransformer(model_name)
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
