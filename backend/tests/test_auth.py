"""
Integration tests for authentication endpoints.

Tests registration, login, email verification, and OAuth flows.
"""

from datetime import datetime

import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.rate_limiter import auth_rate_limiter, password_reset_rate_limiter
from app.repositories.user_repository import UserInDB, UserRepository


@pytest.fixture(autouse=True)
def reset_rate_limiters():
    """The in-memory per-IP limiters would otherwise 429 later tests in this module."""
    auth_rate_limiter.requests.clear()
    password_reset_rate_limiter.requests.clear()
    yield
    auth_rate_limiter.requests.clear()
    password_reset_rate_limiter.requests.clear()


@pytest.mark.integration
class TestAuthAPI:
    """Test suite for /v1/auth endpoints."""
    
    @pytest.mark.asyncio
    async def test_register_user(
        self,
        client: AsyncClient,
        test_db: AsyncIOMotorDatabase
    ):
        """Test user registration."""
        response = await client.post(
            "/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "full_name": "New User",
                "password": "securepassword123"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["full_name"] == "New User"
        assert "id" in data
        assert "password" not in data
        assert "hashed_password" not in data
    
    @pytest.mark.asyncio
    async def test_register_duplicate_email(
        self,
        client: AsyncClient,
        test_user: UserInDB
    ):
        """Test registration with existing email fails."""
        response = await client.post(
            "/v1/auth/register",
            json={
                "email": test_user.email,
                "full_name": "Another User",
                "password": "password123"
            }
        )
        
        assert response.status_code == 400
        assert "email already registered" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_login_success(
        self,
        client: AsyncClient,
        test_user: UserInDB
    ):
        """Test successful login with valid credentials."""
        response = await client.post(
            "/v1/auth/login",
            data={
                "username": test_user.email,
                "password": "testpassword"  # Password from fixture
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    @pytest.mark.asyncio
    async def test_login_invalid_credentials(
        self,
        client: AsyncClient,
        test_user: UserInDB
    ):
        """Test login with invalid password fails."""
        response = await client.post(
            "/v1/auth/login",
            data={
                "username": test_user.email,
                "password": "wrongpassword"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_login_nonexistent_user(
        self,
        client: AsyncClient
    ):
        """Test login with non-existent email fails."""
        response = await client.post(
            "/v1/auth/login",
            data={
                "username": "nobody@example.com",
                "password": "password123"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_register_normalizes_email(
        self,
        client: AsyncClient,
        test_db: AsyncIOMotorDatabase
    ):
        """Mixed-case, padded emails are stored lower-cased and trimmed."""
        response = await client.post(
            "/v1/auth/register",
            json={"email": "  Mixed.Case@Example.COM ", "full_name": "Mixed", "password": "password123"}
        )
        assert response.status_code == 201
        assert response.json()["email"] == "mixed.case@example.com"
        doc = await test_db.users.find_one({"email": "mixed.case@example.com"})
        assert doc is not None

    @pytest.mark.asyncio
    async def test_register_duplicate_email_different_case(
        self,
        client: AsyncClient,
        test_user: UserInDB
    ):
        response = await client.post(
            "/v1/auth/register",
            json={"email": test_user.email.upper(), "full_name": "Dup", "password": "password123"}
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    @pytest.mark.parametrize("variant", ["TEST@EXAMPLE.COM", "Test@Example.com", " test@example.com "])
    async def test_login_is_case_insensitive(
        self,
        client: AsyncClient,
        test_user: UserInDB,
        variant: str
    ):
        response = await client.post(
            "/v1/auth/login",
            data={"username": variant, "password": "testpassword"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_login_legacy_mixed_case_account(
        self,
        client: AsyncClient,
        test_db: AsyncIOMotorDatabase
    ):
        """Accounts stored before normalization (mixed case) can still sign in, in any case."""
        from app.core.security import get_password_hash
        await test_db.users.insert_one({
            "email": "Legacy.User@Example.com",
            "full_name": "Legacy",
            "hashed_password": get_password_hash("legacypass1"),
            "is_active": True,
            "is_verified": True,
            "is_pro": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })
        for variant in ("Legacy.User@Example.com", "legacy.user@example.com", "LEGACY.USER@EXAMPLE.COM"):
            response = await client.post(
                "/v1/auth/login",
                data={"username": variant, "password": "legacypass1"},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            assert response.status_code == 200, variant

        # Registering the same address in another case must not create a second account.
        response = await client.post(
            "/v1/auth/register",
            json={"email": "legacy.user@example.com", "full_name": "Dup", "password": "password123"}
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_resend_verification_is_case_insensitive(
        self,
        client: AsyncClient,
        test_user: UserInDB
    ):
        """The verified test user is found regardless of case, so we get 'already verified'."""
        response = await client.post(
            "/v1/auth/resend-verification",
            json={"email": test_user.email.upper()}
        )
        assert response.status_code == 400
        assert "already verified" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_get_current_user(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user: UserInDB
    ):
        """Test retrieving current authenticated user."""
        response = await client.get(
            "/v1/users/me",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["id"] == test_user.id
    
    @pytest.mark.asyncio
    async def test_protected_route_requires_auth(
        self,
        client: AsyncClient
    ):
        """Test protected routes require authentication."""
        response = await client.get("/v1/users/me")
        
        assert response.status_code == 401
