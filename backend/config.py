"""
config.py — Centralized settings via pydantic-settings
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    # --- API ---
    gemini_api_key: str = ""
    api_secret_key: str = "changeme"

    # --- Server ---
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # --- CORS ---
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    # --- Storage ---
    vector_store_dir: str = "./vector_store/storage"

    # --- OCR ---
    tesseract_cmd: str = "C:\\Program Files\\Tesseract-OCR\\tesseract.exe"

    # --- Models ---
    embedding_model: str = "all-MiniLM-L6-v2"
    gemini_model: str = "gemini-2.5-flash"
    spacy_model: str = "en_core_web_sm"

    # --- Chunking ---
    chunk_size: int = 512
    chunk_overlap: int = 50
    top_k_chunks: int = 5

    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        from pathlib import Path
        root_dir = Path(__file__).resolve().parent.parent
        env_file = str(root_dir / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
print(f"DEBUG: Config loaded. gemini_api_key length: {len(settings.gemini_api_key)}")

