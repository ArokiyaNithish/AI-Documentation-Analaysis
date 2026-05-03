"""
ai/ner_service.py — Named Entity Recognition using spaCy
"""
from typing import Dict, List
from utils.logger import get_logger

logger = get_logger(__name__)

_nlp = None


def _get_nlp():
    global _nlp
    if _nlp is None:
        import spacy
        from config import settings
        try:
            _nlp = spacy.load(settings.spacy_model)
            logger.info(f"spaCy model '{settings.spacy_model}' loaded.")
        except OSError:
            logger.warning(f"spaCy model '{settings.spacy_model}' not found. Falling back to en_core_web_sm.")
            try:
                _nlp = spacy.load("en_core_web_sm")
            except OSError:
                logger.error("No spaCy model found. Run: python -m spacy download en_core_web_sm")
                return None
    return _nlp


def extract_entities(text: str) -> Dict[str, List[str]]:
    """
    Extract named entities from text and group by type.
    Returns dict with: names, dates, organizations, amounts, locations.
    """
    nlp = _get_nlp()
    if nlp is None:
        return {"names": [], "dates": [], "organizations": [], "amounts": [], "locations": []}

    # Process in chunks to avoid memory issues with large docs
    max_chars = 50000
    text_sample = text[:max_chars]

    try:
        doc = nlp(text_sample)

        entity_map: Dict[str, List[str]] = {
            "names": [],
            "dates": [],
            "organizations": [],
            "amounts": [],
            "locations": [],
        }

        label_routing = {
            "PERSON": "names",
            "DATE": "dates",
            "TIME": "dates",
            "ORG": "organizations",
            "MONEY": "amounts",
            "PERCENT": "amounts",
            "QUANTITY": "amounts",
            "GPE": "locations",
            "LOC": "locations",
        }

        seen = set()
        for ent in doc.ents:
            key = label_routing.get(ent.label_)
            if key:
                entity_text = ent.text.strip()
                dedup_key = (key, entity_text.lower())
                if dedup_key not in seen and len(entity_text) > 1:
                    entity_map[key].append(entity_text)
                    seen.add(dedup_key)

        # Cap each category to top-20
        for k in entity_map:
            entity_map[k] = entity_map[k][:20]

        logger.info(f"NER extracted: {sum(len(v) for v in entity_map.values())} entities")
        return entity_map

    except Exception as e:
        logger.error(f"NER failed: {e}")
        return {"names": [], "dates": [], "organizations": [], "amounts": [], "locations": []}
