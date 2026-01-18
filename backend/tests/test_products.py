"""
Integration tests for Products API endpoints.

Tests product CRUD operations, SKU uniqueness, stock management,
and ownership validation.
"""

import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.user_repository import UserInDB
from app.repositories.product_repository import ProductRepository


@pytest.mark.integration
class TestProductsAPI:
    """Test suite for /v1/products endpoints."""
    
    @pytest.mark.asyncio
    async def test_create_product(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user: UserInDB
    ):
        """Test creating a new product."""
        response = await client.post(
            "/v1/products",
            json={
                "sku": "WIDGET-001",
                "name": "Super Widget",
                "description": "A wonderful widget",
                "unit_price": 149.99,
                "tax_rate": 7.5,
                "currency": "NGN",
                "quantity_available": 50,
                "is_active": True
            },
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["sku"] == "WIDGET-001"
        assert data["name"] == "Super Widget"
        assert data["unit_price"] == "149.99"
        assert data["quantity_available"] == 50
        assert data["user_id"] == test_user.id
        assert "id" in data
        assert "created_at" in data
    
    @pytest.mark.asyncio
    async def test_create_product_duplicate_sku(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_product
    ):
        """Test creating product with duplicate SKU fails."""
        response = await client.post(
            "/v1/products",
            json={
                "sku": test_product.sku,  # Duplicate SKU
                "name": "Duplicate Product",
                "unit_price": 99.99,
                "currency": "NGN",
                "quantity_available": 10
            },
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_create_product_requires_auth(
        self,
        client: AsyncClient
    ):
        """Test creating product without authentication fails."""
        response = await client.post(
            "/v1/products",
            json={
                "sku": "NOAUTH-001",
                "name": "No Auth Product",
                "unit_price": 99.99,
                "currency": "NGN",
                "quantity_available": 10
            }
        )
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_list_products(
        self,
        client: AsyncClient,
        auth_headers: dict,
        create_multiple_products
    ):
        """Test listing products with pagination."""
        # Create 5 products
        await create_multiple_products(5)
        
        response = await client.get(
            "/v1/products?limit=3&offset=0",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 3
        assert data["total"] == 5
        assert data["limit"] == 3
        assert data["offset"] == 0
        assert data["has_more"] is True
    
    @pytest.mark.asyncio
    async def test_list_products_with_search(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_db: AsyncIOMotorDatabase,
        test_user: UserInDB
    ):
        """Test searching products by name/description/SKU."""
        product_repo = ProductRepository(test_db)
        from app.schemas.product import ProductCreate
        
        # Create products with different names
        await product_repo.create_product(
            user_id=test_user.id,
            product_data=ProductCreate(
                sku="LAPTOP-001",
                name="MacBook Pro",
                description="Apple laptop",
                unit_price=2500.00,
                currency="NGN",
                quantity_available=10
            )
        )
        
        await product_repo.create_product(
            user_id=test_user.id,
            product_data=ProductCreate(
                sku="MOUSE-001",
                name="Magic Mouse",
                description="Apple mouse",
                unit_price=150.00,
                currency="NGN",
                quantity_available=50
            )
        )
        
        # Search for "laptop"
        response = await client.get(
            "/v1/products?search=laptop",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert "laptop" in data["items"][0]["name"].lower() or "laptop" in data["items"][0]["description"].lower()
    
    @pytest.mark.asyncio
    async def test_list_products_filter_active(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_db: AsyncIOMotorDatabase,
        test_user: UserInDB
    ):
        """Test filtering products by is_active status."""
        product_repo = ProductRepository(test_db)
        from app.schemas.product import ProductCreate
        
        # Create active product
        await product_repo.create_product(
            user_id=test_user.id,
            product_data=ProductCreate(
                sku="ACTIVE-001",
                name="Active Product",
                unit_price=100.00,
                currency="NGN",
                quantity_available=10,
                is_active=True
            )
        )
        
        # Create inactive product
        await product_repo.create_product(
            user_id=test_user.id,
            product_data=ProductCreate(
                sku="INACTIVE-001",
                name="Inactive Product",
                unit_price=100.00,
                currency="NGN",
                quantity_available=10,
                is_active=False
            )
        )
        
        # Filter for active only
        response = await client.get(
            "/v1/products?is_active=true",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["is_active"] is True
    
    @pytest.mark.asyncio
    async def test_get_product(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_product
    ):
        """Test retrieving a single product by ID."""
        response = await client.get(
            f"/v1/products/{test_product.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_product.id
        assert data["sku"] == test_product.sku
        assert data["name"] == test_product.name
    
    @pytest.mark.asyncio
    async def test_get_product_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test retrieving non-existent product returns 404."""
        response = await client.get(
            "/v1/products/000000000000000000000000",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_update_product(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_product
    ):
        """Test updating product details."""
        response = await client.put(
            f"/v1/products/{test_product.id}",
            json={
                "name": "Updated Product Name",
                "unit_price": 199.99,
                "description": "Updated description"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Product Name"
        assert data["unit_price"] == "199.99"
        assert data["description"] == "Updated description"
        assert data["sku"] == test_product.sku  # SKU unchanged
    
    @pytest.mark.asyncio
    async def test_update_product_sku_conflict(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_db: AsyncIOMotorDatabase,
        test_user: UserInDB,
        test_product
    ):
        """Test updating product SKU to existing SKU fails."""
        product_repo = ProductRepository(test_db)
        from app.schemas.product import ProductCreate
        
        # Create another product with different SKU
        another_product = await product_repo.create_product(
            user_id=test_user.id,
            product_data=ProductCreate(
                sku="ANOTHER-001",
                name="Another Product",
                unit_price=50.00,
                currency="NGN",
                quantity_available=20
            )
        )
        
        # Try to update test_product's SKU to match another_product
        response = await client.put(
            f"/v1/products/{test_product.id}",
            json={"sku": another_product.sku},
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_delete_product(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_product
    ):
        """Test soft-deleting a product (is_active=false)."""
        response = await client.delete(
            f"/v1/products/{test_product.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
        
        # Verify product is soft-deleted
        get_response = await client.get(
            f"/v1/products/{test_product.id}",
            headers=auth_headers
        )
        
        assert get_response.status_code == 200
        assert get_response.json()["is_active"] is False
    
    @pytest.mark.asyncio
    async def test_adjust_quantity_add(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_product
    ):
        """Test adding stock quantity."""
        original_qty = test_product.quantity_available
        
        response = await client.patch(
            f"/v1/products/{test_product.id}/adjust-quantity",
            json={"adjustment": 25},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["quantity_available"] == original_qty + 25
    
    @pytest.mark.asyncio
    async def test_adjust_quantity_subtract(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_product
    ):
        """Test subtracting stock quantity."""
        original_qty = test_product.quantity_available
        
        response = await client.patch(
            f"/v1/products/{test_product.id}/adjust-quantity",
            json={"adjustment": -10},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["quantity_available"] == original_qty - 10
    
    @pytest.mark.asyncio
    async def test_adjust_quantity_insufficient_stock(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_product
    ):
        """Test subtracting more than available quantity fails."""
        response = await client.patch(
            f"/v1/products/{test_product.id}/adjust-quantity",
            json={"adjustment": -(test_product.quantity_available + 100)},
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "insufficient" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_product_ownership_isolation(
        self,
        client: AsyncClient,
        auth_headers: dict,
        auth_headers_pro: dict,
        test_product
    ):
        """Test users can only see their own products."""
        # test_product belongs to test_user
        # Try to access with auth_headers_pro (different user)
        
        response = await client.get(
            f"/v1/products/{test_product.id}",
            headers=auth_headers_pro
        )
        
        assert response.status_code == 404  # Not found (ownership check)
    
    @pytest.mark.asyncio
    async def test_list_products_sorted(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_db: AsyncIOMotorDatabase,
        test_user: UserInDB
    ):
        """Test listing products with sorting."""
        product_repo = ProductRepository(test_db)
        from app.schemas.product import ProductCreate
        
        # Create products with different prices
        for i, price in enumerate([50.00, 150.00, 100.00]):
            await product_repo.create_product(
                user_id=test_user.id,
                product_data=ProductCreate(
                    sku=f"SORT-{i:03d}",
                    name=f"Product {i}",
                    unit_price=price,
                    currency="NGN",
                    quantity_available=10
                )
            )
        
        # Sort by price descending
        response = await client.get(
            "/v1/products?sort_by=unit_price&sort_order=desc",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        prices = [float(item["unit_price"]) for item in data["items"]]
        assert prices == sorted(prices, reverse=True)
