"""
services/text_processing.py — Text cleaning, normalization, and chunking
"""
import re
from typing import List
from config import settings
from utils.logger import get_logger

logger = get_logger(__name__)


def clean_text(raw_text: str) -> str:
    """Normalize whitespace, remove control characters, fix encoding artifacts."""
    # Remove null bytes and control chars (except newlines/tabs)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", raw_text)
    # Collapse multiple spaces
    text = re.sub(r" {2,}", " ", text)
    # Collapse 3+ newlines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Strip leading/trailing whitespace per line
    lines = [line.strip() for line in text.splitlines()]
    text = "\n".join(lines)
    return text.strip()


def chunk_text(text: str, chunk_size: int = None, overlap: int = None) -> List[str]:
    """
    Split text into overlapping word-based chunks.
    Each chunk is approximately chunk_size words with overlap words shared.
    """
    chunk_size = chunk_size or settings.chunk_size
    overlap = overlap or settings.chunk_overlap

    words = text.split()
    if not words:
        return []

    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        if end == len(words):
            break
        start += chunk_size - overlap  # slide with overlap

    logger.info(f"Chunked into {len(chunks)} chunks (size={chunk_size}, overlap={overlap})")
    return chunks
