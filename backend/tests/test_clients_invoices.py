"""
Integration tests for Clients and Invoices API endpoints.

Tests CRUD operations for clients and invoices with MongoDB.
"""

import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.user_repository import UserInDB


@pytest.mark.integration
class TestClientsAPI:
    """Test suite for /v1/clients endpoints."""
    
    @pytest.mark.asyncio
    async def test_create_client(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user: UserInDB
    ):
        """Test creating a new client."""
        response = await client.post(
            "/v1/clients",
            json={
                "name": "Acme Corp",
                "email": "billing@acme.test",
                "phone": "123-456-7890",
                "address": "123 Main St"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Acme Corp"
        assert data["email"] == "billing@acme.test"
        assert data["user_id"] == test_user.id
        assert "id" in data
    
    @pytest.mark.asyncio
    async def test_list_clients(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_client_data
    ):
        """Test listing clients."""
        response = await client.get(
            "/v1/clients",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(c["name"] == test_client_data["name"] for c in data)
    
    @pytest.mark.asyncio
    async def test_get_client(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_db: AsyncIOMotorDatabase,
        test_user: UserInDB
    ):
        """Test retrieving a single client."""
        from app.repositories.client_repository import ClientRepository
        from app.schemas.client import ClientCreate
        
        # Create test client
        client_repo = ClientRepository(test_db)
        test_client = await client_repo.create_client(
            user_id=test_user.id,
            client_data=ClientCreate(
                name="Test Client",
                email="test@client.com",
                phone="555-0100",
                address="Test Address"
            )
        )
        
        response = await client.get(
            f"/v1/clients/{test_client.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_client.id
        assert data["name"] == "Test Client"
    
    @pytest.mark.asyncio
    async def test_update_client(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_db: AsyncIOMotorDatabase,
        test_user: UserInDB
    ):
        """Test updating client details."""
        from app.repositories.client_repository import ClientRepository
        from app.schemas.client import ClientCreate
        
        # Create test client
        client_repo = ClientRepository(test_db)
        test_client = await client_repo.create_client(
            user_id=test_user.id,
            client_data=ClientCreate(
                name="Original Name",
                email="original@test.com"
            )
        )
        
        response = await client.put(
            f"/v1/clients/{test_client.id}",
            json={
                "name": "Updated Name",
                "email": "updated@test.com"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["email"] == "updated@test.com"
    
    @pytest.mark.asyncio
    async def test_delete_client(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_db: AsyncIOMotorDatabase,
        test_user: UserInDB
    ):
        """Test deleting a client."""
        from app.repositories.client_repository import ClientRepository
        from app.schemas.client import ClientCreate
        
        # Create test client
        client_repo = ClientRepository(test_db)
        test_client = await client_repo.create_client(
            user_id=test_user.id,
            client_data=ClientCreate(
                name="To Delete",
                email="delete@test.com"
            )
        )
        
        response = await client.delete(
            f"/v1/clients/{test_client.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
    
    @pytest.mark.asyncio
    async def test_clients_require_auth(
        self,
        client: AsyncClient
    ):
        """Test client endpoints require authentication."""
        response = await client.get("/v1/clients")
        assert response.status_code == 401


@pytest.mark.integration
class TestInvoicesAPI:
    """Test suite for /v1/invoices endpoints."""
    
    @pytest.mark.asyncio
    async def test_create_invoice(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_db: AsyncIOMotorDatabase,
        test_user: UserInDB
    ):
        """Test creating an invoice."""
        from app.repositories.client_repository import ClientRepository
        from app.schemas.client import ClientCreate
        
        # Create client first
        client_repo = ClientRepository(test_db)
        test_client = await client_repo.create_client(
            user_id=test_user.id,
            client_data=ClientCreate(
                name="Invoice Client",
                email="invoiceclient@test.com"
            )
        )
        
        response = await client.post(
            "/v1/invoices",
            json={
                "client_id": test_client.id,
                "number": "INV-001",
                "status": "draft",
                "items": [
                    {
                        "description": "Design work",
                        "quantity": 10,
                        "unit_price": 50.00
                    },
                    {
                        "description": "Hosting",
                        "quantity": 12,
                        "unit_price": 10.00
                    }
                ],
                "subtotal": 620.00,
                "tax": 0.00,
                "total": 620.00
            },
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["number"] == "INV-001"
        assert len(data["items"]) == 2
        assert data["client_id"] == test_client.id
    
    @pytest.mark.asyncio
    async def test_list_invoices(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_db: AsyncIOMotorDatabase,
        test_user: UserInDB
    ):
        """Test listing invoices."""
        from app.repositories.client_repository import ClientRepository
        from app.repositories.invoice_repository import InvoiceRepository
        from app.schemas.client import ClientCreate
        from app.schemas.invoice import InvoiceCreate, InvoiceItemCreate
        
        # Create client and invoice
        client_repo = ClientRepository(test_db)
        test_client = await client_repo.create_client(
            user_id=test_user.id,
            client_data=ClientCreate(name="List Test", email="list@test.com")
        )
        
        invoice_repo = InvoiceRepository(test_db)
        await invoice_repo.create_invoice(
            user_id=test_user.id,
            invoice_data=InvoiceCreate(
                client_id=test_client.id,
                number="INV-LIST-001",
                status="draft",
                items=[
                    InvoiceItemCreate(
                        description="Test item",
                        quantity=1,
                        unit_price=100.00
                    )
                ],
                subtotal=100.00,
                tax=0.00,
                total=100.00
            )
        )
        
        response = await client.get(
            "/v1/invoices",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert any(inv["number"] == "INV-LIST-001" for inv in data)
    
    @pytest.mark.asyncio
    async def test_invoices_require_auth(
        self,
        client: AsyncClient
    ):
        """Test invoice endpoints require authentication."""
        response = await client.get("/v1/invoices")
        assert response.status_code == 401
