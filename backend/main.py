"""
main.py — FastAPI application entry point
"""
import sys
import os

# Ensure the backend directory is on the Python path
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from utils.logger import get_logger
from routes.health import router as health_router
from routes.analyze import router as analyze_router
from routes.chat import router as chat_router

logger = get_logger(__name__)

# --- App ---
app = FastAPI(
    title="DocAnalyse AI",
    description="AI-powered document analysis and conversational Q&A system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global exception handler ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )

# --- Routers ---
app.include_router(health_router)
app.include_router(analyze_router)
app.include_router(chat_router)


# --- Startup ---
@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("DocAnalyse AI Backend starting up...")
    logger.info(f"  Gemini model : {settings.gemini_model}")
    logger.info(f"  Embedding    : {settings.embedding_model}")
    logger.info(f"  spaCy model  : {settings.spacy_model}")
    logger.info(f"  Vector store : {settings.vector_store_dir}")
    logger.info(f"  CORS origins : {settings.origins_list}")
    logger.info("=" * 60)

    if not settings.gemini_api_key or settings.gemini_api_key == "your_gemini_api_key_here":
        logger.warning("⚠️  GEMINI_API_KEY is not set! Document analysis will fail.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info",
    )
