"""
routes/chat.py — POST /api/chat  (RAG-based Q&A)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from utils.auth import verify_api_key
from utils.logger import get_logger
from ai.embeddings import embed_query
from ai.gemini_client import answer_question
from vector_store.faiss_store import search_index, index_exists

logger = get_logger(__name__)
router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="User's question")
    document_id: str = Field(..., description="Document ID from analyze response")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Prior conversation turns")


@router.post(
    "/api/chat",
    summary="Chat with a document using RAG",
    dependencies=[Depends(verify_api_key)],
)
async def chat_with_document(request: ChatRequest):
    """
    RAG pipeline:
    1. Embed the question
    2. Retrieve top-K relevant chunks from FAISS
    3. Send context + question to Gemini
    4. Return grounded answer
    """
    logger.info(f"Chat request for doc '{request.document_id}': {request.question[:80]}")

    if not index_exists(request.document_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No document found with id '{request.document_id}'. Please re-analyze the document.",
        )

    try:
        # 1. Embed the question
        query_embedding = embed_query(request.question)

        # 2. Retrieve relevant chunks
        relevant_chunks = search_index(request.document_id, query_embedding)

        if not relevant_chunks:
            return {
                "answer": "I couldn't find relevant information in the document to answer your question.",
                "sources_used": 0,
            }

        # 3. Build chat history for context
        history = [{"role": m.role, "content": m.content} for m in (request.history or [])]

        # 4. Generate answer via Gemini
        answer = answer_question(
            question=request.question,
            context_chunks=relevant_chunks,
            chat_history=history,
        )

        return {
            "answer": answer,
            "document_id": request.document_id,
            "sources_used": len(relevant_chunks),
        }

    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat error: {e}",
        )
