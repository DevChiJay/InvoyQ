"""Registration platform (X-Client-Platform) and "How did you hear about InvoyQ?"."""
import pytest

from app.core.rate_limiter import auth_rate_limiter
from app.utils.platform import resolve_platform

PASSWORD = "secret123"


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """/register is limited to 5 per minute per IP; each test starts fresh."""
    auth_rate_limiter.requests.clear()
    yield
    auth_rate_limiter.requests.clear()


@pytest.mark.parametrize(
    "header, fallback, expected",
    [
        ("ios", None, "ios"),
        ("Android", "mobile", "android"),
        ("web", None, "web"),
        (None, "mobile", "mobile"),
        ("windows-phone", "mobile", "mobile"),
        ("windows-phone", None, "web"),
        (None, None, "web"),
        (None, "web", "web"),
    ],
)
def test_resolve_platform(header, fallback, expected):
    assert resolve_platform(header, fallback) == expected


async def _register(client, email, headers=None, **body):
    return await client.post(
        "/v1/auth/register",
        json={"email": email, "password": PASSWORD, "full_name": "New", **body},
        headers=headers or {},
    )


async def _stored(test_db, email):
    return await test_db.users.find_one({"email": email})


async def test_register_uses_platform_header(client, test_db):
    r = await _register(client, "ios@example.com", {"X-Client-Platform": "ios"}, registration_source="mobile")
    assert r.status_code == 201, r.text
    assert (await _stored(test_db, "ios@example.com"))["registration_source"] == "ios"


async def test_register_old_app_body_stays_mobile(client, test_db):
    await _register(client, "old@example.com", registration_source="mobile")
    assert (await _stored(test_db, "old@example.com"))["registration_source"] == "mobile"


async def test_register_web_default(client, test_db):
    await _register(client, "web@example.com")
    assert (await _stored(test_db, "web@example.com"))["registration_source"] == "web"


async def test_register_stores_referral(client, test_db):
    await _register(
        client, "ref@example.com", {"X-Client-Platform": "android"},
        referral_source="other", referral_source_other="  a podcast  ",
    )
    doc = await _stored(test_db, "ref@example.com")
    assert doc["registration_source"] == "android"
    assert doc["referral_source"] == "other"
    assert doc["referral_source_other"] == "a podcast"


async def test_register_drops_other_text_for_non_other(client, test_db):
    await _register(client, "ig@example.com", referral_source="instagram", referral_source_other="ignored")
    doc = await _stored(test_db, "ig@example.com")
    assert doc["referral_source"] == "instagram"
    assert doc["referral_source_other"] is None


async def test_register_rejects_unknown_referral(client):
    r = await _register(client, "bad@example.com", referral_source="tiktok")
    assert r.status_code == 422


async def test_register_without_referral(client, test_db):
    await _register(client, "none@example.com")
    assert (await _stored(test_db, "none@example.com"))["referral_source"] is None


async def test_update_me_sets_referral(client, auth_headers):
    r = await client.patch(
        "/v1/me", json={"referral_source": "other", "referral_source_other": "x" * 500}, headers=auth_headers
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["referral_source"] == "other"
    assert len(body["referral_source_other"]) == 200

    # Switching away from "other" clears the free text
    r = await client.patch("/v1/me", json={"referral_source": "friend"}, headers=auth_headers)
    assert r.json()["referral_source"] == "friend"
    assert r.json()["referral_source_other"] is None

    # Unrelated profile updates leave the answer alone
    r = await client.patch("/v1/me", json={"phone": "123"}, headers=auth_headers)
    assert r.json()["referral_source"] == "friend"
