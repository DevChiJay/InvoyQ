"""
Pytest configuration and fixtures for MongoDB-based tests.

Provides test database setup, cleanup, and common fixtures
for testing FastAPI endpoints with async MongoDB.
"""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timedelta

from app.main import app
from app.db.mongo import get_database
from app.dependencies.auth import get_current_user
from app.core.security import get_password_hash
from app.repositories.user_repository import UserRepository, UserInDB
from app.repositories.client_repository import ClientRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.invoice_repository import InvoiceRepository


# Test database configuration
TEST_MONGODB_URI = "mongodb://localhost:27017"
TEST_MONGODB_DB_NAME = "invoiq_test"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_mongo_client() -> AsyncGenerator[AsyncIOMotorClient, None]:
    """
    Create MongoDB client for testing.
    
    Scope: session (one client for all tests)
    """
    client = AsyncIOMotorClient(TEST_MONGODB_URI)
    yield client
    client.close()


@pytest.fixture(scope="function")
async def test_db(test_mongo_client: AsyncIOMotorClient) -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """
    Provide clean test database for each test.
    
    Scope: function (fresh DB for each test)
    Cleanup: Drops database after test
    """
    db = test_mongo_client[TEST_MONGODB_DB_NAME]
    
    # Create indexes for test database
    await _create_test_indexes(db)
    
    yield db
    
    # Cleanup: Drop all collections after test
    await test_mongo_client.drop_database(TEST_MONGODB_DB_NAME)


async def _create_test_indexes(db: AsyncIOMotorDatabase):
    """Create essential indexes for test database."""
    # Users
    await db.users.create_index("email", unique=True)
    
    # Clients
    await db.clients.create_index("user_id")
    
    # Products
    await db.products.create_index([("user_id", 1), ("sku", 1)], unique=True)
    await db.products.create_index("is_active")
    
    # Invoices
    await db.invoices.create_index([("user_id", 1), ("number", 1)], unique=True)
    await db.invoices.create_index("user_id")
    await db.invoices.create_index("status")
    
    # Expenses
    await db.expenses.create_index([("user_id", 1), ("date", -1)])
    await db.expenses.create_index("category")


@pytest.fixture
async def client(test_db: AsyncIOMotorDatabase) -> AsyncGenerator[AsyncClient, None]:
    """
    Provide HTTP client for testing FastAPI endpoints.
    
    Overrides get_database dependency to use test database.
    """
    # Override database dependency
    app.dependency_overrides[get_database] = lambda: test_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    
    # Clear overrides
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(test_db: AsyncIOMotorDatabase) -> UserInDB:
    """
    Create a test user in the database.
    
    Returns:
        UserInDB: Test user with verified email
    """
    user_repo = UserRepository(test_db)
    
    user = await user_repo.create_user(
        email="test@example.com",
        full_name="Test User",
        hashed_password=get_password_hash("testpassword"),
        is_verified=True
    )
    
    return user


@pytest.fixture
async def test_user_pro(test_db: AsyncIOMotorDatabase) -> UserInDB:
    """
    Create a pro (subscribed) test user.
    
    Returns:
        UserInDB: Pro user with active subscription
    """
    user_repo = UserRepository(test_db)
    
    user = await user_repo.create_user(
        email="pro@example.com",
        full_name="Pro User",
        hashed_password=get_password_hash("testpassword"),
        is_verified=True
    )
    
    # Upgrade to pro
    await user_repo.update_subscription(
        user_id=user.id,
        is_pro=True,
        subscription_status="active",
        subscription_provider="stripe",
        subscription_start_date=datetime.utcnow(),
        subscription_end_date=datetime.utcnow() + timedelta(days=30)
    )
    
    # Refresh user
    user = await user_repo.get_by_id(user.id)
    
    return user


@pytest.fixture
async def auth_headers(test_user: UserInDB) -> dict:
    """
    Generate authentication headers for test user.
    
    Returns:
        dict: Headers with Bearer token
    """
    from app.api.v1.auth import create_access_token
    
    access_token = create_access_token({"sub": test_user.id})
    
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
async def auth_headers_pro(test_user_pro: UserInDB) -> dict:
    """
    Generate authentication headers for pro user.
    
    Returns:
        dict: Headers with Bearer token for pro user
    """
    from app.api.v1.auth import create_access_token
    
    access_token = create_access_token({"sub": test_user_pro.id})
    
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
async def test_client_data(test_db: AsyncIOMotorDatabase, test_user: UserInDB):
    """
    Create a test client for the test user.
    
    Returns:
        Client document
    """
    client_repo = ClientRepository(test_db)
    
    from app.schemas.client import ClientCreate
    
    client = await client_repo.create_client(
        user_id=test_user.id,
        client_data=ClientCreate(
            name="Acme Corp",
            email="contact@acme.com",
            phone="+1234567890",
            address="123 Main St, City, Country"
        )
    )
    
    return client


@pytest.fixture
async def test_product(test_db: AsyncIOMotorDatabase, test_user: UserInDB):
    """
    Create a test product for the test user.
    
    Returns:
        Product document
    """
    product_repo = ProductRepository(test_db)
    
    from app.schemas.product import ProductCreate
    
    product = await product_repo.create_product(
        user_id=test_user.id,
        product_data=ProductCreate(
            sku="TEST-001",
            name="Test Product",
            description="A test product",
            unit_price=99.99,
            tax_rate=7.5,
            currency="NGN",
            quantity_available=100,
            is_active=True
        )
    )
    
    return product


@pytest.fixture
async def test_expense(test_db: AsyncIOMotorDatabase, test_user: UserInDB):
    """
    Create a test expense for the test user.
    
    Returns:
        Expense document
    """
    expense_repo = ExpenseRepository(test_db)
    
    from app.schemas.expense import ExpenseCreate
    from datetime import date
    
    expense = await expense_repo.create_expense(
        user_id=test_user.id,
        expense_data=ExpenseCreate(
            category="office",
            description="Test expense",
            amount=50.00,
            currency="NGN",
            vendor="Test Vendor",
            date=date.today(),
            tags=["test"]
        )
    )
    
    return expense


# Helper function for creating multiple test entities
@pytest.fixture
async def create_multiple_products(test_db: AsyncIOMotorDatabase, test_user: UserInDB):
    """
    Factory fixture for creating multiple products.
    
    Usage:
        products = await create_multiple_products(5)
    """
    async def _create(count: int):
        product_repo = ProductRepository(test_db)
        from app.schemas.product import ProductCreate
        
        products = []
        for i in range(count):
            product = await product_repo.create_product(
                user_id=test_user.id,
                product_data=ProductCreate(
                    sku=f"PROD-{i:03d}",
                    name=f"Product {i}",
                    description=f"Test product {i}",
                    unit_price=10.0 * (i + 1),
                    tax_rate=7.5,
                    currency="NGN",
                    quantity_available=50 + i,
                    is_active=True
                )
            )
            products.append(product)
        
        return products
    
    return _create


@pytest.fixture
async def create_multiple_expenses(test_db: AsyncIOMotorDatabase, test_user: UserInDB):
    """
    Factory fixture for creating multiple expenses.
    
    Usage:
        expenses = await create_multiple_expenses(10, category="travel")
    """
    async def _create(count: int, category: str = "office"):
        expense_repo = ExpenseRepository(test_db)
        from app.schemas.expense import ExpenseCreate
        from datetime import date, timedelta
        
        expenses = []
        for i in range(count):
            expense = await expense_repo.create_expense(
                user_id=test_user.id,
                expense_data=ExpenseCreate(
                    category=category,
                    description=f"Expense {i}",
                    amount=25.0 * (i + 1),
                    currency="NGN",
                    vendor=f"Vendor {i}",
                    date=date.today() - timedelta(days=i),
                    tags=["test"]
                )
            )
            expenses.append(expense)
        
        return expenses
    
    return _create


# Marker for slow tests
def pytest_configure(config):
    """Register custom pytest markers."""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
