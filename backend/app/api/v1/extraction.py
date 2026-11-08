from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_database
from app.dependencies.auth import get_current_user
from app.repositories.user_repository import UserInDB
from app.services.plans import EXTRACTIONS, UsageService
from app.repositories.extraction_repository import ExtractionRepository
from app.core.config import settings
from app.services.openai_extractor import OpenAIExtractor
from app.core.rate_limiter import extraction_rate_limiter, free_extract_rate_limiter

router = APIRouter()


def get_extractor(provider: Optional[str] = None):
    # Always use OpenAI extractor. Keeping this factory allows easy monkeypatching in tests.
    return OpenAIExtractor(api_key=settings.OPENAI_API_KEY)


@router.post("/extract-job-details", dependencies=[Depends(extraction_rate_limiter.dependency())])
async def extract_job_details(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user),
    provider: Optional[str] = None,
    text: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
):
    # Acquire inputs; we send image directly to GPT-Vision (no local OCR)
    raw_text = (text or "").strip()
    file_bytes = None
    file_mime: Optional[str] = None
    if file is not None:
        file_bytes = file.file.read()
        file_mime = getattr(file, "content_type", None)

    if not raw_text and not file_bytes:
        raise HTTPException(status_code=400, detail="Add some text or an image to extract from.")

    # Count one extraction against the plan before calling OpenAI; a failed call gives it back.
    usage = UsageService(db)
    ticket = await usage.consume(current_user, EXTRACTIONS)

    extractor = get_extractor(provider)
    try:
        # Await the async API: the sync wrappers use anyio.run(), which fails inside the server's event loop.
        parsed: Dict[str, Any] = await extractor.aextract(raw_text or None, file_bytes, file_mime)
    except HTTPException:
        await usage.refund(ticket)
        raise
    except Exception as e:
        await usage.refund(ticket)
        raise HTTPException(status_code=500, detail=f"Extraction failed: {e}")

    repo = ExtractionRepository(db)
    extraction = await repo.create_extraction(
        user_id=str(current_user.id),
        source_type="screenshot" if file is not None else "text",
        raw_text=raw_text,
        parsed_data=parsed,
        confidence_score=float(parsed.get("confidence") or 0),
    )

    return {"extraction_id": extraction.id, "parsed": parsed}


@router.post("/free-extract-invoice", dependencies=[Depends(free_extract_rate_limiter.dependency())])
async def free_extract_invoice(
    request: Request,
    text: str = Form(...),
):
    """
    Public endpoint — no authentication required.
    Accepts plain text describing a transaction and returns structured invoice data.
    Rate-limited to 3 requests per IP per 24 hours.
    """
    raw_text = text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="text field must not be empty.")

    extractor = get_extractor()
    try:
        parsed: Dict[str, Any] = await extractor._call_openai_text(raw_text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {e}")

    return parsed
