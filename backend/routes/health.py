"""
routes/health.py — GET /health
"""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/health", summary="Health check")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "DocAnalyse AI Backend",
        "version": "1.0.0",
    }
