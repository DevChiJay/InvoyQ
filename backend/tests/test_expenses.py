"""
Integration tests for Expenses API endpoints.

Tests expense CRUD operations, category filtering, date range filtering,
period filters, and aggregation summaries.
"""

import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import date, timedelta

from app.repositories.user_repository import UserInDB
from app.repositories.expense_repository import ExpenseRepository


@pytest.mark.integration
class TestExpensesAPI:
    """Test suite for /v1/expenses endpoints."""
    
    @pytest.mark.asyncio
    async def test_create_expense(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user: UserInDB
    ):
        """Test creating a new expense."""
        response = await client.post(
            "/v1/expenses",
            json={
                "category": "travel",
                "description": "Flight to Lagos",
                "amount": 85000.00,
                "currency": "NGN",
                "vendor": "Air Peace",
                "date": str(date.today()),
                "tags": ["business", "urgent"]
            },
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["category"] == "travel"
        assert data["description"] == "Flight to Lagos"
        assert data["amount"] == "85000.00"
        assert data["user_id"] == test_user.id
        assert "id" in data
        assert "created_at" in data
        assert set(data["tags"]) == {"business", "urgent"}
    
    @pytest.mark.asyncio
    async def test_create_expense_requires_auth(
        self,
        client: AsyncClient
    ):
        """Test creating expense without authentication fails."""
        response = await client.post(
            "/v1/expenses",
            json={
                "category": "office",
                "description": "Supplies",
                "amount": 5000.00,
                "currency": "NGN",
                "date": str(date.today())
            }
        )
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_list_expenses(
        self,
        client: AsyncClient,
        auth_headers: dict,
        create_multiple_expenses
    ):
        """Test listing expenses with pagination."""
        # Create 10 expenses
        await create_multiple_expenses(10)
        
        response = await client.get(
            "/v1/expenses?limit=5&offset=0",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 5
        assert data["total"] == 10
        assert data["limit"] == 5
        assert data["offset"] == 0
        assert data["has_more"] is True
    
    @pytest.mark.asyncio
    async def test_list_expenses_filter_by_category(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_db: AsyncIOMotorDatabase,
        test_user: UserInDB
    ):
        """Test filtering expenses by category."""
        expense_repo = ExpenseRepository(test_db)
        from app.schemas.expense import ExpenseCreate
        
        # Create expenses with different categories
        await expense_repo.create_expense(
            user_id=test_user.id,
            expense_data=ExpenseCreate(
                category="travel",
                description="Flight",
                amount=50000.00,
                currency="NGN",
                date=date.today()
            )
        )
        
        await expense_repo.create_expense(
            user_id=test_user.id,
            expense_data=ExpenseCreate(
                category="office",
                description="Supplies",
                amount=5000.00,
                currency="NGN",
                date=date.today()
            )
        )
        
        # Filter by travel category
        response = await client.get(
            "/v1/expenses?category=travel",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["category"] == "travel"
    
    @pytest.mark.asyncio
    async def test_list_expenses_date_range(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_db: AsyncIOMotorDatabase,
        test_user: UserInDB
    ):
        """Test filtering expenses by date range."""
        expense_repo = ExpenseRepository(test_db)
        from app.schemas.expense import ExpenseCreate
        
        today = date.today()
        yesterday = today - timedelta(days=1)
        last_week = today - timedelta(days=7)
        
        # Create expenses on different dates
        await expense_repo.create_expense(
            user_id=test_user.id,
            expense_data=ExpenseCreate(
                category="office",
                description="Recent expense",
                amount=1000.00,
                currency="NGN",
                date=today
            )
        )
        
        await expense_repo.create_expense(
            user_id=test_user.id,
            expense_data=ExpenseCreate(
                category="office",
                description="Old expense",
                amount=2000.00,
                currency="NGN",
                date=last_week
            )
        )
        
        # Filter for last 3 days
        date_from = (today - timedelta(days=2)).isoformat()
        date_to = today.isoformat()
        
        response = await client.get(
            f"/v1/expenses?date_from={date_from}&date_to={date_to}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["description"] == "Recent expense"
    
    @pytest.mark.asyncio
    async def test_list_expenses_period_filter_week(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_db: AsyncIOMotorDatabase,
        test_user: UserInDB
    ):
        """Test filtering expenses by week period."""
        expense_repo = ExpenseRepository(test_db)
        from app.schemas.expense import ExpenseCreate
        
        today = date.today()
        
        # Create expense this week
        await expense_repo.create_expense(
            user_id=test_user.id,
            expense_data=ExpenseCreate(
                category="office",
                description="This week expense",
                amount=5000.00,
                currency="NGN",
                date=today
            )
        )
        
        # Create expense last month
        await expense_repo.create_expense(
            user_id=test_user.id,
            expense_data=ExpenseCreate(
                category="office",
                description="Last month expense",
                amount=3000.00,
                currency="NGN",
                date=today - timedelta(days=35)
            )
        )
        
        # Filter for this week
        response = await client.get(
            f"/v1/expenses?period=week&reference_date={today.isoformat()}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 1
        assert any("This week" in item["description"] for item in data["items"])
    
    @pytest.mark.asyncio
    async def test_list_expenses_period_filter_month(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_db: AsyncIOMotorDatabase,
        test_user: UserInDB
    ):
        """Test filtering expenses by month period."""
        expense_repo = ExpenseRepository(test_db)
        from app.schemas.expense import ExpenseCreate
        
        today = date.today()
        
        # Create expense this month
        await expense_repo.create_expense(
            user_id=test_user.id,
            expense_data=ExpenseCreate(
                category="travel",
                description="This month trip",
                amount=50000.00,
                currency="NGN",
                date=today
            )
        )
        
        # Filter for this month
        response = await client.get(
            f"/v1/expenses?period=month&reference_date={today.isoformat()}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 1
    
    @pytest.mark.asyncio
    async def test_get_expense_categories(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_db: AsyncIOMotorDatabase,
        test_user: UserInDB
    ):
        """Test retrieving unique expense categories."""
        expense_repo = ExpenseRepository(test_db)
        from app.schemas.expense import ExpenseCreate
        
        # Create expenses with different categories
        categories = ["travel", "office", "utilities", "office"]  # office appears twice
        
        for category in categories:
            await expense_repo.create_expense(
                user_id=test_user.id,
                expense_data=ExpenseCreate(
                    category=category,
                    description=f"{category} expense",
                    amount=1000.00,
                    currency="NGN",
                    date=date.today()
                )
            )
        
        response = await client.get(
            "/v1/expenses/categories",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert set(data) == {"travel", "office", "utilities"}  # Unique categories
    
    @pytest.mark.asyncio
    async def test_get_expense_summary(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_db: AsyncIOMotorDatabase,
        test_user: UserInDB
    ):
        """Test getting expense summary grouped by category."""
        expense_repo = ExpenseRepository(test_db)
        from app.schemas.expense import ExpenseCreate
        
        # Create expenses in different categories
        await expense_repo.create_expense(
            user_id=test_user.id,
            expense_data=ExpenseCreate(
                category="travel",
                description="Flight 1",
                amount=50000.00,
                currency="NGN",
                date=date.today()
            )
        )
        
        await expense_repo.create_expense(
            user_id=test_user.id,
            expense_data=ExpenseCreate(
                category="travel",
                description="Flight 2",
                amount=30000.00,
                currency="NGN",
                date=date.today()
            )
        )
        
        await expense_repo.create_expense(
            user_id=test_user.id,
            expense_data=ExpenseCreate(
                category="office",
                description="Supplies",
                amount=15000.00,
                currency="NGN",
                date=date.today()
            )
        )
        
        response = await client.get(
            "/v1/expenses/summary",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "summaries" in data
        assert "grand_total" in data
        assert len(data["summaries"]) == 2  # travel and office
        
        # Check travel category summary
        travel_summary = next((s for s in data["summaries"] if s["category"] == "travel"), None)
        assert travel_summary is not None
        assert float(travel_summary["total_amount"]) == 80000.00
        assert travel_summary["count"] == 2
        
        # Check grand total
        assert float(data["grand_total"]) == 95000.00
    
    @pytest.mark.asyncio
    async def test_get_expense_summary_with_period_filter(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_db: AsyncIOMotorDatabase,
        test_user: UserInDB
    ):
        """Test expense summary with period filter."""
        expense_repo = ExpenseRepository(test_db)
        from app.schemas.expense import ExpenseCreate
        
        today = date.today()
        
        # Create expense this month
        await expense_repo.create_expense(
            user_id=test_user.id,
            expense_data=ExpenseCreate(
                category="travel",
                description="Recent trip",
                amount=50000.00,
                currency="NGN",
                date=today
            )
        )
        
        # Create expense last year
        await expense_repo.create_expense(
            user_id=test_user.id,
            expense_data=ExpenseCreate(
                category="travel",
                description="Old trip",
                amount=30000.00,
                currency="NGN",
                date=date(today.year - 1, 1, 15)
            )
        )
        
        # Get summary for this month only
        response = await client.get(
            f"/v1/expenses/summary?period=month&reference_date={today.isoformat()}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should only include this month's expense
        assert float(data["grand_total"]) == 50000.00
        assert "period_start" in data
        assert "period_end" in data
    
    @pytest.mark.asyncio
    async def test_get_expense(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_expense
    ):
        """Test retrieving a single expense by ID."""
        response = await client.get(
            f"/v1/expenses/{test_expense.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_expense.id
        assert data["category"] == test_expense.category
        assert data["description"] == test_expense.description
    
    @pytest.mark.asyncio
    async def test_get_expense_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test retrieving non-existent expense returns 404."""
        response = await client.get(
            "/v1/expenses/000000000000000000000000",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_update_expense(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_expense
    ):
        """Test updating expense details."""
        response = await client.put(
            f"/v1/expenses/{test_expense.id}",
            json={
                "description": "Updated description",
                "amount": 75.50,
                "vendor": "New Vendor"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Updated description"
        assert data["amount"] == "75.50"
        assert data["vendor"] == "New Vendor"
        assert data["category"] == test_expense.category  # Unchanged
    
    @pytest.mark.asyncio
    async def test_delete_expense(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_expense
    ):
        """Test deleting an expense."""
        response = await client.delete(
            f"/v1/expenses/{test_expense.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
        
        # Verify expense is deleted
        get_response = await client.get(
            f"/v1/expenses/{test_expense.id}",
            headers=auth_headers
        )
        
        assert get_response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_expense_ownership_isolation(
        self,
        client: AsyncClient,
        auth_headers: dict,
        auth_headers_pro: dict,
        test_expense
    ):
        """Test users can only see their own expenses."""
        # test_expense belongs to test_user
        # Try to access with auth_headers_pro (different user)
        
        response = await client.get(
            f"/v1/expenses/{test_expense.id}",
            headers=auth_headers_pro
        )
        
        assert response.status_code == 404  # Not found (ownership check)
    
    @pytest.mark.asyncio
    async def test_category_normalization(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test category names are normalized (lowercase, trimmed)."""
        response = await client.post(
            "/v1/expenses",
            json={
                "category": "  TRAVEL  ",  # Should be normalized to "travel"
                "description": "Test expense",
                "amount": 1000.00,
                "currency": "NGN",
                "date": str(date.today())
            },
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["category"] == "travel"  # Normalized
    
    @pytest.mark.asyncio
    async def test_tag_deduplication(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test duplicate tags are removed."""
        response = await client.post(
            "/v1/expenses",
            json={
                "category": "office",
                "description": "Test expense",
                "amount": 1000.00,
                "currency": "NGN",
                "date": str(date.today()),
                "tags": ["urgent", "business", "urgent"]  # Duplicate "urgent"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert len(data["tags"]) == 2  # Deduplicated
        assert set(data["tags"]) == {"urgent", "business"}
