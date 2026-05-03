"""
routes/analyze.py — POST /api/document-analyze
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from utils.auth import verify_api_key
from utils.logger import get_logger
from services.document_service import process_document

logger = get_logger(__name__)
router = APIRouter()


class AnalyzeRequest(BaseModel):
    fileName: str = Field(..., description="Original file name with extension")
    fileType: str = Field(..., description="File type: pdf, docx, or image")
    fileBase64: str = Field(..., description="Base64-encoded file content")


@router.post(
    "/api/document-analyze",
    summary="Analyze a document with AI",
    dependencies=[Depends(verify_api_key)],
)
async def analyze_document(request: AnalyzeRequest):
    """
    Accept a base64-encoded document, extract text, run AI analysis,
    store embeddings, and return structured JSON.
    """
    logger.info(f"Analyze request: {request.fileName} ({request.fileType})")

    if not request.fileBase64 or len(request.fileBase64) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="fileBase64 is empty or invalid.",
        )

    try:
        result = process_document(
            file_name=request.fileName,
            file_type=request.fileType,
            file_base64=request.fileBase64,
        )
        return result
    except ValueError as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=400, content={"status": "error", "message": str(e)})
    except RuntimeError as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=422, content={"status": "error", "message": str(e)})
    except Exception as e:
        logger.error(f"Unexpected error during document analysis: {e}", exc_info=True)
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Internal error: {e}"})
