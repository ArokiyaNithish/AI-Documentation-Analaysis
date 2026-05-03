"""
ai/embeddings.py — Sentence Transformer embedding generation
"""
import numpy as np
from typing import List
from utils.logger import get_logger

logger = get_logger(__name__)

_model = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        from config import settings
        _model = SentenceTransformer(settings.embedding_model)
        logger.info(f"Embedding model '{settings.embedding_model}' loaded.")
    return _model


def embed_texts(texts: List[str]) -> np.ndarray:
    """Generate embeddings for a list of text chunks."""
    model = _get_model()
    embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    logger.debug(f"Generated {len(embeddings)} embeddings of dim {embeddings.shape[1]}")
    return embeddings


def embed_query(query: str) -> np.ndarray:
    """Generate embedding for a single query string."""
    model = _get_model()
    return model.encode([query], convert_to_numpy=True)[0]
