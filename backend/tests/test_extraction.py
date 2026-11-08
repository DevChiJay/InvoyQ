"""Extraction endpoint: needs a signed-in user, uses the stub extractor (no OpenAI calls)."""
import pytest
from httpx import AsyncClient

from app.api.v1 import extraction as extraction_module


class StubExtractor:
    async def aextract(self, text, file_bytes=None, file_mime=None):
        return {"jobs": ["Logo design"], "amount": 50000, "currency": "NGN", "confidence": 0.9}


class FailingExtractor:
    async def aextract(self, text, file_bytes=None, file_mime=None):
        raise RuntimeError("OpenAI is down")


async def test_extraction_requires_login(client: AsyncClient, monkeypatch):
    monkeypatch.setattr(extraction_module, "get_extractor", lambda provider=None: StubExtractor())
    response = await client.post("/v1/extract-job-details", data={"text": "Logo design 50000"})
    assert response.status_code == 401


async def test_extraction_saves_the_user_id(client: AsyncClient, auth_headers, test_user, test_db, monkeypatch):
    monkeypatch.setattr(extraction_module, "get_extractor", lambda provider=None: StubExtractor())
    response = await client.post(
        "/v1/extract-job-details", data={"text": "Logo design 50000"}, headers=auth_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["parsed"]["amount"] == 50000
    doc = await test_db.extractions.find_one({"user_id": test_user.id})
    assert doc is not None


async def test_empty_extraction_is_rejected_and_not_counted(client: AsyncClient, auth_headers, test_db):
    response = await client.post("/v1/extract-job-details", data={"text": "  "}, headers=auth_headers)
    assert response.status_code == 400
    assert await test_db.usage.count_documents({}) == 0


async def test_failed_extraction_is_refunded(client: AsyncClient, auth_headers, test_user, test_db, monkeypatch):
    monkeypatch.setattr(extraction_module, "get_extractor", lambda provider=None: FailingExtractor())
    response = await client.post("/v1/extract-job-details", data={"text": "x"}, headers=auth_headers)
    assert response.status_code == 500
    usage = await client.get("/v1/usage", headers=auth_headers)
    assert usage.json()["extractions"]["used"] == 0
