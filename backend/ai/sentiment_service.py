"""
ai/sentiment_service.py — Sentiment analysis via HuggingFace DistilBERT
"""
from utils.logger import get_logger

logger = get_logger(__name__)

_pipeline = None


def _get_pipeline():
    global _pipeline
    if _pipeline is None:
        try:
            from transformers import pipeline
            _pipeline = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                truncation=True,
                max_length=512,
            )
            logger.info("Sentiment pipeline loaded.")
        except Exception as e:
            logger.error(f"Sentiment pipeline load failed: {e}")
            return None
    return _pipeline


def analyze_sentiment(text: str) -> dict:
    """
    Analyze overall sentiment of the document.
    Returns label (POSITIVE/NEGATIVE/NEUTRAL) and confidence score.
    """
    pipe = _get_pipeline()
    if pipe is None:
        return {"label": "NEUTRAL", "score": 0.5, "error": "Model unavailable"}

    try:
        # Use first 2000 chars as representative sample
        sample = text[:2000]
        result = pipe(sample)[0]
        label = result["label"]
        score = round(result["score"], 4)

        # Map to friendly labels
        friendly = {
            "POSITIVE": "Positive 😊",
            "NEGATIVE": "Negative 😟",
        }.get(label, "Neutral 😐")

        return {
            "label": label,
            "friendly_label": friendly,
            "score": score,
            "confidence": f"{int(score * 100)}%",
        }
    except Exception as e:
        logger.error(f"Sentiment analysis failed: {e}")
        return {"label": "NEUTRAL", "score": 0.5, "friendly_label": "Neutral 😐", "confidence": "50%"}
