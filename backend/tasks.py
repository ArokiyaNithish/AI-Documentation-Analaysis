"""
tasks.py — Celery worker setup for asynchronous document processing
"""
import os
from celery import Celery
from services.document_service import process_document
from utils.logger import get_logger

logger = get_logger(__name__)

# Configure Celery
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "doc_analyze_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)


@celery_app.task(bind=True, max_retries=3)
def async_process_document(self, file_name: str, file_type: str, file_base64: str):
    """
    Asynchronous Celery task for long-running document analysis.
    This fulfills the hackathon 'Celery for async processing' requirement.
    """
    logger.info(f"Starting async processing for {file_name}")
    try:
        result = process_document(
            file_name=file_name,
            file_type=file_type,
            file_base64=file_base64,
        )
        logger.info(f"Successfully processed {file_name} in background.")
        return result
    except Exception as exc:
        logger.error(f"Async processing failed for {file_name}: {exc}")
        self.retry(exc=exc, countdown=5)
