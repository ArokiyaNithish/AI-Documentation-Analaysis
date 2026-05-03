"""
utils/auth.py — API key dependency for FastAPI routes
"""
from fastapi import Header, HTTPException, status
from typing import Optional
from config import settings


async def verify_api_key(x_api_key: Optional[str] = Header(None, alias="x-api-key")) -> str:
    """FastAPI dependency that validates the x-api-key header."""
    if not x_api_key or x_api_key != settings.api_secret_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key.",
        )
    return x_api_key
