"""
services/document_service.py — Full document processing pipeline orchestrator
"""
from utils.logger import get_logger
from utils.helpers import decode_base64_file, detect_file_type, generate_document_id, format_success_response
from services.extraction import extract_text
from services.text_processing import clean_text, chunk_text
from ai.gemini_client import summarize_document
from ai.ner_service import extract_entities
from ai.sentiment_service import analyze_sentiment

logger = get_logger(__name__)


def process_document(file_name: str, file_type: str, file_base64: str) -> dict:
    """
    Full pipeline:
    Base64 decode → file type detect → extract text → clean → analyze → return JSON
    Embeddings/FAISS are optional (skipped gracefully if unavailable).
    """
    logger.info(f"Processing document: {file_name} ({file_type})")

    # 1. Decode base64
    try:
        file_bytes = decode_base64_file(file_base64)
        logger.debug(f"Decoded {len(file_bytes)} bytes")
    except Exception as e:
        logger.error(f"Base64 decode error: {e}")
        raise ValueError(f"Invalid base64 content: {e}")

    # 2. Resolve file type
    resolved_type = detect_file_type(file_name, file_type)

    # 3. Extract raw text
    raw_text = extract_text(file_bytes, resolved_type)

    # 4. Clean text
    cleaned_text = clean_text(raw_text)
    logger.info(f"Cleaned text: {len(cleaned_text)} chars")

    # 5. Generate document ID
    document_id = generate_document_id()

    # 6. AI processing — each step isolated, won't break others if one fails
    logger.info("Running AI analysis...")

    try:
        summary = summarize_document(cleaned_text)
        logger.info("✅ Summarization done")
    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        raise RuntimeError(f"Summarization failed: {e}")

    try:
        entities = extract_entities(cleaned_text)
        logger.info("✅ NER done")
    except Exception as e:
        logger.warning(f"NER failed (non-fatal), using empty: {e}")
        entities = {"names": [], "dates": [], "organizations": [], "amounts": []}

    try:
        sentiment = analyze_sentiment(cleaned_text)
        logger.info("✅ Sentiment done")
    except Exception as e:
        logger.warning(f"Sentiment failed (non-fatal), defaulting: {e}")
        sentiment = {"label": "NEUTRAL", "score": 0.5}

    # 7. Chunk → embed → store in FAISS (optional — skipped if libs not installed)
    num_chunks = 0
    try:
        from services.text_processing import chunk_text
        from ai.embeddings import embed_texts
        from vector_store.faiss_store import save_index

        chunks = chunk_text(cleaned_text)
        if chunks:
            embeddings = embed_texts(chunks)
            save_index(document_id, embeddings, chunks)
            num_chunks = len(chunks)
            logger.info(f"✅ FAISS index saved: {num_chunks} chunks")
    except Exception as e:
        logger.warning(f"Embedding/FAISS skipped (non-fatal): {e}")

    # 8. Format and return response
    return format_success_response(
        document_id=document_id,
        file_name=file_name,
        summary=summary,
        entities=entities,
        sentiment=sentiment,
        num_chunks=num_chunks,
    )
