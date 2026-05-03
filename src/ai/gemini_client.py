"""
ai/gemini_client.py — Gemini API wrapper for summarization and RAG Q&A
Strictly uses gemini-2.5-flash via direct REST call (bypasses SDK version bugs).
"""
import os
import requests
from utils.logger import get_logger
from config import settings

logger = get_logger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
_BASE_URL  = "https://generativelanguage.googleapis.com/v1beta/models"
_TIMEOUT   = 120  # seconds

def _call_gemini(prompt: str) -> str:
    """
    Direct HTTPS call to Gemini generateContent endpoint.
    Bypasses the SDK entirely to avoid version compatibility issues.
    """
    api_key = settings.gemini_api_key
    model_name = settings.gemini_model

    if not api_key:
        logger.error("GEMINI_API_KEY is not set in environment or .env file.")
        raise RuntimeError("Gemini API key is missing. Please check your configuration.")

    logger.debug(f"Calling Gemini ({model_name}) with prompt length: {len(prompt)}")
    
    url = f"{_BASE_URL}/{model_name}:generateContent?key={api_key}"
    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 2048,
        }
    }
    try:
        resp = requests.post(url, json=payload, timeout=_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return text.strip()
    except requests.HTTPError as e:
        detail = resp.text if resp else str(e)
        logger.error(f"Gemini API HTTP error: {detail}")
        raise RuntimeError(f"Gemini API error: {detail}")
    except Exception as e:
        logger.error(f"Gemini call failed: {e}")
        raise RuntimeError(f"Gemini call failed: {e}")


# ── Public helpers ─────────────────────────────────────────────────────────────

def summarize_document(text: str) -> str:
    """Generate a concise single-paragraph summary of a document."""
    prompt = (
        "You are an expert document analyst. "
        "Read the document below and write a single concise paragraph that "
        "summarises its key content accurately. "
        "Do NOT use bullet points, numbered lists, or headings. "
        "Just one factual paragraph.\n\n"
        f"Document:\n---\n{text[:12000]}\n---\n\nSummary:"
    )
    result = _call_gemini(prompt)
    logger.info("Summarization complete.")
    return result


def answer_question(
    question: str,
    context_chunks: list,
    chat_history: list = None,
) -> str:
    """RAG Q&A — answer strictly from retrieved document chunks."""
    context = "\n\n---\n\n".join(context_chunks)

    history_text = ""
    if chat_history:
        lines = []
        for turn in chat_history[-6:]:
            role = "User" if turn.get("role") == "user" else "Assistant"
            lines.append(f"{role}: {turn.get('content', '')}")
        history_text = "\n".join(lines)

    prompt = (
        "You are an intelligent document assistant.\n"
        "Answer the user's question ONLY from the document context below.\n"
        "If the answer is not in the document, say exactly: "
        "'I couldn't find that information in the document.'\n\n"
        f"Document Context:\n===\n{context}\n===\n\n"
        + (f"Conversation so far:\n{history_text}\n\n" if history_text else "")
        + f"User: {question}\nAssistant:"
    )
    result = _call_gemini(prompt)
    logger.info("Q&A answer generated.")
    return result
