"""
utils/helpers.py — Base64 decoding, file type detection, response formatting
"""
import base64
import uuid
from pathlib import Path
from utils.logger import get_logger

logger = get_logger(__name__)


def decode_base64_file(file_base64: str) -> bytes:
    """Strip data URI prefix if present and decode base64 to bytes."""
    if "," in file_base64:
        file_base64 = file_base64.split(",", 1)[1]
    # Fix padding
    padding = 4 - len(file_base64) % 4
    if padding != 4:
        file_base64 += "=" * padding
    try:
        return base64.b64decode(file_base64)
    except Exception as e:
        logger.error(f"Base64 decode failed: {e}")
        raise ValueError(f"Invalid base64 content: {e}")


def generate_document_id() -> str:
    """Generate a unique document ID."""
    return str(uuid.uuid4())


def detect_file_type(file_name: str, provided_type: str) -> str:
    """Resolve file type from provided hint or filename extension."""
    type_map = {
        "pdf": "pdf",
        "docx": "docx",
        "doc": "docx",
        "image": "image",
        "jpg": "image",
        "jpeg": "image",
        "png": "image",
        "tiff": "image",
        "bmp": "image",
    }
    # Try provided type first
    resolved = type_map.get(provided_type.lower().strip())
    if resolved:
        return resolved
    # Fall back to extension
    ext = Path(file_name).suffix.lstrip(".").lower()
    resolved = type_map.get(ext)
    if resolved:
        return resolved
    raise ValueError(f"Unsupported file type: '{provided_type}' / extension '{ext}'")


def format_success_response(
    document_id: str,
    file_name: str,
    summary: str,
    entities: dict,
    sentiment: dict,
    num_chunks: int,
) -> dict:
    
    # Map sentiment to simple string for hackathon requirements
    sentiment_str = "Neutral"
    if isinstance(sentiment, dict) and "label" in sentiment:
        label = sentiment["label"].upper()
        if "POS" in label:
            sentiment_str = "Positive"
        elif "NEG" in label:
            sentiment_str = "Negative"
            
    # Map entities to strictly required keys
    filtered_entities = {
        "names": entities.get("names", []),
        "dates": entities.get("dates", []),
        "organizations": entities.get("organizations", []),
        "amounts": entities.get("amounts", [])
    }
    
    return {
        "status": "success",
        "fileName": file_name,
        "summary": summary,
        "entities": filtered_entities,
        "sentiment": sentiment_str,
        # Keep internal fields for chat system
        "document_id": document_id,
        "metadata": {"chunks_indexed": num_chunks},
    }
