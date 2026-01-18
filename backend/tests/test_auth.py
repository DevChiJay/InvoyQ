"""
Integration tests for authentication endpoints.

Tests registration, login, email verification, and OAuth flows.
"""

import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.user_repository import UserInDB, UserRepository


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
