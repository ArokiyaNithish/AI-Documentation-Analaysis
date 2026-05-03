"""
vector_store/faiss_store.py — FAISS-based vector store with disk persistence
"""
import os
import json
import numpy as np
import faiss
from pathlib import Path
from typing import List, Tuple
from config import settings
from utils.logger import get_logger

logger = get_logger(__name__)

# Ensure storage dir exists
Path(settings.vector_store_dir).mkdir(parents=True, exist_ok=True)


def _index_path(document_id: str) -> Path:
    return Path(settings.vector_store_dir) / f"{document_id}.index"


def _chunks_path(document_id: str) -> Path:
    return Path(settings.vector_store_dir) / f"{document_id}.chunks.json"


def save_index(document_id: str, embeddings: np.ndarray, chunks: List[str]) -> None:
    """Build a FAISS flat L2 index from embeddings and persist to disk."""
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    # Normalize embeddings for cosine similarity approximation
    faiss.normalize_L2(embeddings)
    index.add(embeddings.astype(np.float32))

    faiss.write_index(index, str(_index_path(document_id)))

    with open(_chunks_path(document_id), "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False)

    logger.info(f"FAISS index saved for doc '{document_id}': {index.ntotal} vectors, dim={dim}")


def search_index(document_id: str, query_embedding: np.ndarray, top_k: int = None) -> List[str]:
    """Search the FAISS index for top-K most relevant chunks."""
    top_k = top_k or settings.top_k_chunks
    idx_path = _index_path(document_id)
    chunks_path = _chunks_path(document_id)

    if not idx_path.exists() or not chunks_path.exists():
        raise FileNotFoundError(f"No index found for document_id '{document_id}'. Re-analyze the document.")

    index = faiss.read_index(str(idx_path))
    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    query = query_embedding.reshape(1, -1).astype(np.float32)
    faiss.normalize_L2(query)
    distances, indices = index.search(query, min(top_k, index.ntotal))

    results = []
    for idx in indices[0]:
        if 0 <= idx < len(chunks):
            results.append(chunks[idx])

    logger.info(f"FAISS search returned {len(results)} chunks for doc '{document_id}'")
    return results


def index_exists(document_id: str) -> bool:
    return _index_path(document_id).exists()


def delete_index(document_id: str) -> None:
    for path in [_index_path(document_id), _chunks_path(document_id)]:
        if path.exists():
            path.unlink()
    logger.info(f"Deleted index for doc '{document_id}'")
