"""Free-plan limits: 100 invoices and 10 extractions a month, unlimited on Pro."""
import asyncio
from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException
from httpx import AsyncClient

from app.api.v1 import extraction as extraction_module
from app.core.config import settings
from app.repositories.user_repository import UserRepository
from app.services import plans
from app.services.plans import EXTRACTIONS, INVOICES, UsageService


class StubExtractor:
    async def aextract(self, text, file_bytes=None, file_mime=None):
        return {"jobs": ["Logo design"], "amount": 1000, "currency": "NGN", "confidence": 0.9}


def invoice_payload(client_id: str, n: int) -> dict:
    return {
        "client_id": client_id,
        "number": f"INV-LIMIT-{n:03d}",
        "items": [{"description": "Work", "quantity": "1", "unit_price": "100.00"}],
        "currency": "NGN",
        "status": "draft",
        "subtotal": 100.00,
        "tax": 0.00,
        "total": 100.00,
    }


# --- plan rules ---------------------------------------------------------------------------


def test_defaults_match_the_free_plan():
    assert settings.FREE_INVOICES_PER_MONTH == 100
    assert settings.FREE_EXTRACTIONS_PER_MONTH == 10


async def test_pro_rules(test_user, test_user_pro):
    assert not plans.is_pro_active(test_user)
    assert plans.is_pro_active(test_user_pro)
    assert plans.limits_for(test_user_pro)[INVOICES] is None
    assert plans.limits_for(test_user)[INVOICES] == 100


async def test_admin_pro_without_end_date_never_lapses(test_user):
    test_user.is_pro = True
    test_user.subscription_end_date = None
    assert plans.is_pro_active(test_user, now=datetime.utcnow() + timedelta(days=4000))


async def test_expired_pro_counts_as_free(test_user_pro):
    later = test_user_pro.subscription_end_date + timedelta(days=1)
    assert not plans.is_pro_active(test_user_pro, now=later)
    assert plans.limits_for(test_user_pro, now=later)[EXTRACTIONS] == 10


# --- counting -----------------------------------------------------------------------------


async def test_limit_is_enforced_and_error_is_readable(test_db, test_user, monkeypatch):
    monkeypatch.setattr(settings, "FREE_EXTRACTIONS_PER_MONTH", 3)
    usage = UsageService(test_db)
    for _ in range(3):
        await usage.consume(test_user, EXTRACTIONS)
    with pytest.raises(HTTPException) as exc:
        await usage.consume(test_user, EXTRACTIONS)
    assert exc.value.status_code == 403
    detail = exc.value.detail
    assert detail["code"] == "limit_reached"
    assert detail["resource"] == EXTRACTIONS
    assert detail["limit"] == 3 and detail["used"] == 3
    assert "reset" in detail["message"].lower()


async def test_concurrent_requests_cannot_overshoot(test_db, test_user, monkeypatch):
    monkeypatch.setattr(settings, "FREE_INVOICES_PER_MONTH", 3)
    usage = UsageService(test_db)
    results = await asyncio.gather(
        *[usage.consume(test_user, INVOICES) for _ in range(8)], return_exceptions=True
    )
    ok = [r for r in results if not isinstance(r, Exception)]
    blocked = [r for r in results if isinstance(r, HTTPException)]
    assert len(ok) == 3
    assert len(blocked) == 5
    assert await test_db.usage.count_documents({"user_id": test_user.id}) == 1


async def test_refund_gives_a_unit_back_but_never_goes_negative(test_db, test_user):
    usage = UsageService(test_db)
    ticket = await usage.consume(test_user, EXTRACTIONS)
    await usage.refund(ticket)
    await usage.refund(ticket)
    summary = await usage.summary(test_user)
    assert summary["extractions"]["used"] == 0


async def test_pro_is_never_blocked_but_still_counted(test_db, test_user_pro):
    usage = UsageService(test_db)
    for _ in range(15):
        await usage.consume(test_user_pro, INVOICES)
    summary = await usage.summary(test_user_pro)
    assert summary["plan"] == "pro"
    assert summary["invoices"] == {"used": 15, "limit": None}


async def test_new_month_starts_from_zero(test_db, test_user, monkeypatch):
    monkeypatch.setattr(settings, "FREE_EXTRACTIONS_PER_MONTH", 1)
    usage = UsageService(test_db)
    now = datetime(2026, 11, 20, 10, 0)
    await usage.consume(test_user, EXTRACTIONS, now=now)
    with pytest.raises(HTTPException):
        await usage.consume(test_user, EXTRACTIONS, now=now)
    await usage.consume(test_user, EXTRACTIONS, now=datetime(2026, 12, 1, 0, 1))


async def test_first_touch_is_seeded_from_what_the_user_already_created(test_db, test_user, monkeypatch):
    monkeypatch.setattr(settings, "FREE_INVOICES_PER_MONTH", 5)
    now = datetime.utcnow()
    await test_db.invoices.insert_many(
        [{"user_id": test_user.id, "created_at": now, "number": f"X-{i}"} for i in range(5)]
    )
    with pytest.raises(HTTPException) as exc:
        await UsageService(test_db).consume(test_user, INVOICES)
    assert exc.value.detail["used"] == 5


def test_reset_date_wraps_the_year():
    assert plans.period_bounds(datetime(2026, 12, 15))[1] == datetime(2027, 1, 1)
    assert plans.period_for(datetime(2026, 3, 1)) == "2026-03"


# --- through the API ----------------------------------------------------------------------


async def test_usage_endpoint_shape(client: AsyncClient, auth_headers):
    response = await client.get("/v1/usage", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["plan"] == "free"
    assert body["invoices"] == {"used": 0, "limit": 100}
    assert body["extractions"] == {"used": 0, "limit": 10}
    assert body["payments_enabled"] is False
    assert body["resets_at"].endswith("Z")


async def test_usage_requires_login(client: AsyncClient):
    assert (await client.get("/v1/usage")).status_code == 401


async def test_extraction_is_blocked_after_the_limit(client: AsyncClient, auth_headers, monkeypatch):
    monkeypatch.setattr(settings, "FREE_EXTRACTIONS_PER_MONTH", 2)
    monkeypatch.setattr(extraction_module, "get_extractor", lambda provider=None: StubExtractor())
    for _ in range(2):
        ok = await client.post("/v1/extract-job-details", data={"text": "Logo 1000"}, headers=auth_headers)
        assert ok.status_code == 200
    blocked = await client.post("/v1/extract-job-details", data={"text": "Logo 1000"}, headers=auth_headers)
    assert blocked.status_code == 403
    assert blocked.json()["detail"]["code"] == "limit_reached"
    usage = await client.get("/v1/usage", headers=auth_headers)
    assert usage.json()["extractions"] == {"used": 2, "limit": 2}


async def test_invoice_is_blocked_after_the_limit(client: AsyncClient, auth_headers, test_client_data, monkeypatch):
    monkeypatch.setattr(settings, "FREE_INVOICES_PER_MONTH", 2)
    for n in range(2):
        r = await client.post("/v1/invoices", json=invoice_payload(test_client_data.id, n), headers=auth_headers)
        assert r.status_code == 201, r.text
    blocked = await client.post("/v1/invoices", json=invoice_payload(test_client_data.id, 99), headers=auth_headers)
    assert blocked.status_code == 403
    assert blocked.json()["detail"]["resource"] == INVOICES


async def test_failed_invoice_is_refunded(client: AsyncClient, auth_headers, test_client_data):
    first = await client.post("/v1/invoices", json=invoice_payload(test_client_data.id, 1), headers=auth_headers)
    assert first.status_code == 201, first.text
    duplicate = await client.post("/v1/invoices", json=invoice_payload(test_client_data.id, 1), headers=auth_headers)
    assert duplicate.status_code == 400  # same number
    usage = await client.get("/v1/usage", headers=auth_headers)
    assert usage.json()["invoices"]["used"] == 1


async def test_pro_user_can_exceed_free_limits(client: AsyncClient, auth_headers_pro, test_db, test_user_pro, monkeypatch):
    monkeypatch.setattr(settings, "FREE_EXTRACTIONS_PER_MONTH", 1)
    monkeypatch.setattr(extraction_module, "get_extractor", lambda provider=None: StubExtractor())
    for _ in range(3):
        r = await client.post("/v1/extract-job-details", data={"text": "Logo 1000"}, headers=auth_headers_pro)
        assert r.status_code == 200
