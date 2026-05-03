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
from ai.embeddings import embed_texts
from vector_store.faiss_store import save_index

logger = get_logger(__name__)


def process_document(file_name: str, file_type: str, file_base64: str) -> dict:
    """
    Full pipeline:
    Base64 decode → file type detect → extract text → clean → analyze → embed → store → return JSON
    """
    logger.info(f"Processing document: {file_name} ({file_type})")

    # 1. Decode base64
    file_bytes = decode_base64_file(file_base64)
    logger.debug(f"Decoded {len(file_bytes)} bytes")

    # 2. Resolve file type
    resolved_type = detect_file_type(file_name, file_type)

    # 3. Extract raw text
    raw_text = extract_text(file_bytes, resolved_type)

    # 4. Clean text
    cleaned_text = clean_text(raw_text)
    logger.info(f"Cleaned text: {len(cleaned_text)} chars")

    # 5. Generate document ID
    document_id = generate_document_id()

    # 6. Parallel AI processing
    logger.info("Running AI analysis...")

    summary = summarize_document(cleaned_text)
    entities = extract_entities(cleaned_text)
    sentiment = analyze_sentiment(cleaned_text)

    # 7. Chunk → embed → store in FAISS
    chunks = chunk_text(cleaned_text)
    if chunks:
        embeddings = embed_texts(chunks)
        save_index(document_id, embeddings, chunks)
        logger.info(f"Stored {len(chunks)} chunks in FAISS index '{document_id}'")

    # 8. Format and return response
    return format_success_response(
        document_id=document_id,
        file_name=file_name,
        summary=summary,
        entities=entities,
        sentiment=sentiment,
        num_chunks=len(chunks),
    )
