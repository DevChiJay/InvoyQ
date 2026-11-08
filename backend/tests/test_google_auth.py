"""
Integration tests for Google sign-in: POST /v1/auth/google/mobile and the shared
find-or-create-or-link logic used by the web callback.

Google's token verification is replaced with a fake that checks the audience the same way
google-auth does, so no network access or real tokens are needed.
"""

import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.rate_limiter import auth_rate_limiter, password_reset_rate_limiter
from app.core.security import get_password_hash
from app.repositories.user_repository import UserRepository

WEB_CLIENT_ID = "web-client.apps.googleusercontent.com"
IOS_CLIENT_ID = "ios-client.apps.googleusercontent.com"


def make_payload(**overrides):
    payload = {
        "aud": WEB_CLIENT_ID,
        "sub": "google-sub-1",
        "email": "ada@example.com",
        "email_verified": True,
        "name": "Ada Obi",
        "picture": "https://example.com/ada.png",
    }
    payload.update(overrides)
    return payload


@pytest.fixture(autouse=True)
def google_env(monkeypatch):
    """Configure a web client id, fake Google's verifier, and reset the in-memory rate limiters."""
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", WEB_CLIENT_ID)
    monkeypatch.setattr(settings, "GOOGLE_ALLOWED_CLIENT_IDS", "")
    auth_rate_limiter.requests.clear()
    password_reset_rate_limiter.requests.clear()

    tokens: dict = {}

    def fake_verify(token, request, audience=None, **kwargs):
        payload = tokens.get(token)
        if payload is None:
            raise ValueError("Could not verify token signature.")
        allowed = [audience] if isinstance(audience, str) else list(audience or [])
        if payload["aud"] not in allowed:
            raise ValueError("Token has wrong audience, expected one of " + ", ".join(allowed))
        return payload

    monkeypatch.setattr("app.api.v1.auth.id_token.verify_oauth2_token", fake_verify)
    yield tokens
    auth_rate_limiter.requests.clear()
    password_reset_rate_limiter.requests.clear()


async def google_login(client: AsyncClient, tokens: dict, payload: dict, token: str = "tok"):
    tokens[token] = payload
    return await client.post(
        "/v1/auth/google/mobile", json={"id_token": token, "device_id": "test-device"}
    )


@pytest.mark.integration
class TestGoogleMobileAuth:
    @pytest.mark.asyncio
    async def test_new_user_is_created_and_can_use_the_api(
        self, client: AsyncClient, test_db: AsyncIOMotorDatabase, google_env
    ):
        response = await google_login(client, google_env, make_payload())

        assert response.status_code == 200
        body = response.json()
        assert body["token_type"] == "bearer"
        assert body["access_token"] and body["refresh_token"]

        doc = await test_db.users.find_one({"email": "ada@example.com"})
        assert doc["oauth_provider"] == "google"
        assert doc["oauth_provider_id"] == "google-sub-1"
        assert doc["hashed_password"] is None
        assert doc["is_verified"] is True
        assert doc["registration_source"] == "mobile"

        me = await client.get(
            "/v1/me", headers={"Authorization": f"Bearer {body['access_token']}"}
        )
        assert me.status_code == 200
        assert me.json()["email"] == "ada@example.com"
        assert me.json()["has_password"] is False
        assert me.json()["oauth_provider"] == "google"

    @pytest.mark.asyncio
    async def test_second_login_reuses_the_same_user(
        self, client: AsyncClient, test_db: AsyncIOMotorDatabase, google_env
    ):
        first = await google_login(client, google_env, make_payload())
        second = await google_login(client, google_env, make_payload())

        assert first.status_code == second.status_code == 200
        assert await test_db.users.count_documents({"email": "ada@example.com"}) == 1

    @pytest.mark.asyncio
    async def test_existing_password_account_is_linked_case_insensitively(
        self, client: AsyncClient, test_db: AsyncIOMotorDatabase, google_env
    ):
        repo = UserRepository(test_db)
        existing = await repo.create_user(
            email="Ada@Example.com",
            full_name="Ada",
            hashed_password=get_password_hash("password123"),
            is_verified=False,
        )

        response = await google_login(client, google_env, make_payload())

        assert response.status_code == 200
        assert await test_db.users.count_documents({}) == 1
        user = await repo.get_by_id(existing.id)
        assert user.oauth_provider == "google"
        assert user.oauth_provider_id == "google-sub-1"
        assert user.is_verified is True
        assert user.hashed_password is not None  # keeps its password

    @pytest.mark.asyncio
    async def test_unverified_google_email_is_refused_and_nothing_is_linked(
        self, client: AsyncClient, test_db: AsyncIOMotorDatabase, google_env
    ):
        repo = UserRepository(test_db)
        existing = await repo.create_user(
            email="ada@example.com",
            full_name="Ada",
            hashed_password=get_password_hash("password123"),
            is_verified=True,
        )

        response = await google_login(
            client, google_env, make_payload(email_verified=False)
        )

        assert response.status_code == 400
        assert "isn't verified" in response.json()["detail"]
        user = await repo.get_by_id(existing.id)
        assert user.oauth_provider is None
        assert await test_db.users.count_documents({}) == 1

    @pytest.mark.asyncio
    async def test_unverified_email_does_not_create_a_user(
        self, client: AsyncClient, test_db: AsyncIOMotorDatabase, google_env
    ):
        response = await google_login(
            client, google_env, make_payload(email_verified=False)
        )

        assert response.status_code == 400
        assert await test_db.users.count_documents({}) == 0

    @pytest.mark.asyncio
    async def test_string_true_email_verified_is_accepted(
        self, client: AsyncClient, google_env
    ):
        response = await google_login(
            client, google_env, make_payload(email_verified="true")
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_missing_email_is_a_400_not_a_500(
        self, client: AsyncClient, google_env
    ):
        payload = make_payload()
        del payload["email"]

        response = await google_login(client, google_env, payload)

        assert response.status_code == 400
        assert response.json()["detail"] == "Email not provided by Google"

    @pytest.mark.asyncio
    async def test_different_google_account_for_a_linked_email_is_refused(
        self, client: AsyncClient, test_db: AsyncIOMotorDatabase, google_env
    ):
        repo = UserRepository(test_db)
        await repo.create_user(
            email="ada@example.com",
            full_name="Ada",
            oauth_provider="google",
            oauth_provider_id="original-sub",
            is_verified=True,
        )

        response = await google_login(
            client, google_env, make_payload(sub="someone-elses-sub")
        )

        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_wrong_audience_is_rejected_without_leaking_details(
        self, client: AsyncClient, google_env
    ):
        response = await google_login(
            client, google_env, make_payload(aud="some-other-app.apps.googleusercontent.com")
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid Google ID token"

    @pytest.mark.asyncio
    async def test_unknown_token_is_rejected(self, client: AsyncClient, google_env):
        response = await client.post(
            "/v1/auth/google/mobile", json={"id_token": "garbage"}
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid Google ID token"

    @pytest.mark.asyncio
    async def test_extra_allowed_client_id_is_accepted(
        self, client: AsyncClient, google_env, monkeypatch
    ):
        payload = make_payload(aud=IOS_CLIENT_ID)

        rejected = await google_login(client, google_env, payload)
        assert rejected.status_code == 400

        monkeypatch.setattr(
            settings, "GOOGLE_ALLOWED_CLIENT_IDS", f" {IOS_CLIENT_ID} , "
        )
        accepted = await google_login(client, google_env, payload)
        assert accepted.status_code == 200

    @pytest.mark.asyncio
    async def test_not_configured_returns_500(
        self, client: AsyncClient, google_env, monkeypatch
    ):
        monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", None)

        response = await google_login(client, google_env, make_payload())

        assert response.status_code == 500
        assert response.json()["detail"] == "Google OAuth not configured"


@pytest.mark.integration
class TestGoogleUserPassword:
    """A Google-created account can add a password and then use email+password (what the mobile app needs)."""

    @pytest.mark.asyncio
    async def test_google_account_cannot_password_login_until_a_password_is_set(
        self, client: AsyncClient, google_env
    ):
        google = await google_login(client, google_env, make_payload())
        token = google.json()["access_token"]

        before = await client.post(
            "/v1/auth/login",
            data={"username": "ada@example.com", "password": "newpass123"},
        )
        assert before.status_code == 401

        set_pw = await client.post(
            "/v1/set-password",
            json={"new_password": "newpass123"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert set_pw.status_code == 200

        after = await client.post(
            "/v1/auth/login",
            data={"username": "ada@example.com", "password": "newpass123"},
        )
        assert after.status_code == 200
        assert after.json()["access_token"]

        me = await client.get(
            "/v1/me", headers={"Authorization": f"Bearer {token}"}
        )
        assert me.json()["has_password"] is True


def test_google_audiences_combines_and_dedupes(monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", WEB_CLIENT_ID)
    monkeypatch.setattr(
        settings, "GOOGLE_ALLOWED_CLIENT_IDS", f"{IOS_CLIENT_ID},{WEB_CLIENT_ID}, ,"
    )
    assert settings.google_audiences() == [WEB_CLIENT_ID, IOS_CLIENT_ID]

    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", None)
    monkeypatch.setattr(settings, "GOOGLE_ALLOWED_CLIENT_IDS", "")
    assert settings.google_audiences() == []
