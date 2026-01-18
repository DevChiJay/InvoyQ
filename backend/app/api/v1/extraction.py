from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_database
from app.repositories.extraction_repository import ExtractionRepository
from app.core.config import settings
from app.services.openai_extractor import OpenAIExtractor
from app.core.rate_limiter import extraction_rate_limiter

router = APIRouter()


def get_extractor(provider: Optional[str] = None):
    # Always use OpenAI extractor. Keeping this factory allows easy monkeypatching in tests.
    return OpenAIExtractor(api_key=settings.OPENAI_API_KEY)


@router.post("/extract-job-details")
async def extract_job_details(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_database),
    provider: Optional[str] = None,
    text: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
):
    # Apply rate limiting
    extraction_rate_limiter.check_rate_limit(request)
    # Acquire inputs; we send image directly to GPT-Vision (no local OCR)
    raw_text = (text or "").strip()
    file_bytes = None
    file_mime: Optional[str] = None
    if file is not None:
        file_bytes = file.file.read()
        file_mime = getattr(file, "content_type", None)

    extractor = get_extractor(provider)
    try:
        if file_bytes and hasattr(extractor, "extract"):
            parsed: Dict[str, Any] = extractor.extract(raw_text or None, file_bytes, file_mime)
        else:
            parsed = extractor.extract_from_text(raw_text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {e}")

    # Persist extraction (anonymous, no user required)
    repo = ExtractionRepository(db)
    extraction = await repo.create_extraction(
        user_id=None,  # Anonymous extraction
        source_type="screenshot" if file is not None else "text",
        raw_text=raw_text,
        parsed=parsed,
        confidence=int(parsed.get("confidence") or 0),
        source_url=None
    )

    return {"extraction_id": extraction.id, "parsed": parsed}
