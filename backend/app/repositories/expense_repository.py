"""
Expense repository for MongoDB operations.

Handles expense CRUD, date filtering, and
category-based reporting.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.repositories.base import BaseRepository
from app.schemas.expense import ExpenseOut, ExpenseCreate, ExpenseUpdate, ExpenseInDB, ExpenseSummary
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal


class ExpenseRepository(BaseRepository[ExpenseInDB]):
    """Repository for expense operations."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "expenses", ExpenseInDB)
    
    async def create_expense(
        self,
        user_id: str,
        expense_data: ExpenseCreate
    ) -> ExpenseInDB:
        """
        Create a new expense for a user.
        
        Args:
            user_id: ID of the user creating the expense
            expense_data: Expense creation data
            
        Returns:
            Created expense document
            
        Example:
            expense = await expense_repo.create_expense(
                user_id,
                ExpenseCreate(
                    category="office",
                    description="Office supplies",
                    amount=150.00,
                    date=date.today()
                )
            )
        """
        from app.repositories.base import _serialize_for_mongo
        
        doc = expense_data.model_dump()
        doc.update({
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        # Serialize Decimal and other non-BSON types
        doc = _serialize_for_mongo(doc)
        
        result = await self.collection.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        
        return ExpenseInDB(**doc)
    
    async def get_by_id_and_user(
        self,
        expense_id: str,
        user_id: str
    ) -> Optional[ExpenseInDB]:
        """
        Get expense by ID, ensuring it belongs to the user.
        
        Args:
            expense_id: Expense ID
            user_id: User ID (for ownership check)
            
        Returns:
            Expense document or None if not found or not owned by user
        """
        return await self.get_one({
            "_id": self._to_object_id(expense_id),
            "user_id": user_id
        })
    
    async def list_by_user(
        self,
        user_id: str,
        category: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        date_range_query: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None,
        skip: int = 0,
        limit: int = 50,
        sort_by: str = "expense_date",
        sort_order: int = -1
    ) -> List[ExpenseInDB]:
        """
        List expenses for a user with filters.
        
        Args:
            user_id: User ID
            category: Filter by category
            date_from: Filter from this date (inclusive)
            date_to: Filter to this date (inclusive)
            date_range_query: Pre-built date range query (from parse_period_filter)
            tags: Filter by tags (any match)
            skip: Number of records to skip
            limit: Maximum records to return
            sort_by: Field to sort by
            sort_order: Sort direction (1=asc, -1=desc)
            
        Returns:
            List of expense documents
            
        Example:
            # Filter by date range
            expenses = await expense_repo.list_by_user(
                user_id,
                date_from=date(2026, 1, 1),
                date_to=date(2026, 1, 31)
            )
            
            # Filter by category
            expenses = await expense_repo.list_by_user(
                user_id,
                category="travel"
            )
            
            # With period filter
            from app.utils.date_filters import parse_period_filter
            expenses = await expense_repo.list_by_user(
                user_id,
                date_range_query=parse_period_filter("month")
            )
        """
        filter_query = {"user_id": user_id}
        
        # Category filter
        if category:
            filter_query["category"] = category.lower()
        
        # Date range filter (explicit or from period)
        if date_range_query:
            filter_query["expense_date"] = date_range_query
        elif date_from or date_to:
            date_filter = {}
            if date_from:
                date_filter["$gte"] = datetime.combine(date_from, datetime.min.time())
            if date_to:
                date_filter["$lte"] = datetime.combine(date_to, datetime.max.time())
            if date_filter:
                filter_query["expense_date"] = date_filter
        
        # Tags filter (match any tag)
        if tags:
            filter_query["tags"] = {"$in": [tag.lower() for tag in tags]}
        
        return await self.get_many(
            filter_query,
            skip=skip,
            limit=limit,
            sort=[(sort_by, sort_order)]
        )
    
    async def update_expense(
        self,
        expense_id: str,
        user_id: str,
        update_data: ExpenseUpdate
    ) -> Optional[ExpenseInDB]:
        """
        Update an expense, ensuring ownership.
        
        Args:
            expense_id: Expense ID
            user_id: User ID (for ownership check)
            update_data: Fields to update
            
        Returns:
            Updated expense or None if not found/not owned
        """
        # First check ownership
        existing = await self.get_by_id_and_user(expense_id, user_id)
        if not existing:
            return None
        
        return await self.update(expense_id, update_data)
    
    async def delete_expense(
        self,
        expense_id: str,
        user_id: str
    ) -> bool:
        """
        Delete an expense, ensuring ownership.
        
        Args:
            expense_id: Expense ID
            user_id: User ID (for ownership check)
            
        Returns:
            True if deleted, False if not found/not owned
        """
        result = await self.collection.delete_one({
            "_id": self._to_object_id(expense_id),
            "user_id": user_id
        })
        return result.deleted_count > 0
    
    async def get_summary(
        self,
        user_id: str,
        category: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        date_range_query: Optional[Dict[str, Any]] = None
    ) -> List[ExpenseSummary]:
        """
        Get expense summary grouped by category.
        
        Args:
            user_id: User ID
            category: Filter by specific category (None = all categories)
            date_from: Filter from this date
            date_to: Filter to this date
            date_range_query: Pre-built date range query
            
        Returns:
            List of expense summaries by category
            
        Example:
            # Summary for this month
            from app.utils.date_filters import parse_period_filter
            summaries = await expense_repo.get_summary(
                user_id,
                date_range_query=parse_period_filter("month")
            )
            # Returns: [
            #   {"category": "office", "total_amount": 1500.00, "count": 5, "currency": "NGN"},
            #   {"category": "travel", "total_amount": 3200.00, "count": 3, "currency": "NGN"}
            # ]
        """
        # Build filter query
        filter_query = {"user_id": user_id}
        
        if category:
            filter_query["category"] = category.lower()
        
        if date_range_query:
            filter_query["expense_date"] = date_range_query
        elif date_from or date_to:
            date_filter = {}
            if date_from:
                date_filter["$gte"] = datetime.combine(date_from, datetime.min.time())
            if date_to:
                date_filter["$lte"] = datetime.combine(date_to, datetime.max.time())
            if date_filter:
                filter_query["expense_date"] = date_filter
        
        # Aggregation pipeline
        pipeline = [
            {"$match": filter_query},
            {
                "$group": {
                    "_id": {
                        "category": "$category",
                        "currency": "$currency"
                    },
                    "total_amount": {"$sum": {"$toDouble": "$amount"}},
                    "count": {"$sum": 1}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "category": "$_id.category",
                    "currency": "$_id.currency",
                    "total_amount": 1,
                    "count": 1
                }
            },
            {"$sort": {"total_amount": -1}}
        ]
        
        results = await self.collection.aggregate(pipeline).to_list(length=None)
        
        # Convert to Pydantic models
        return [ExpenseSummary(**result) for result in results]
    
    async def count_by_user(
        self,
        user_id: str,
        category: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> int:
        """
        Count expenses for a user with optional filters.
        
        Args:
            user_id: User ID
            category: Filter by category
            date_from: Filter from this date
            date_to: Filter to this date
            
        Returns:
            Number of expenses
        """
        filter_query = {"user_id": user_id}
        
        if category:
            filter_query["category"] = category.lower()
        
        if date_from or date_to:
            date_filter = {}
            if date_from:
                date_filter["$gte"] = datetime.combine(date_from, datetime.min.time())
            if date_to:
                date_filter["$lte"] = datetime.combine(date_to, datetime.max.time())
            if date_filter:
                filter_query["expense_date"] = date_filter
        
        return await self.count(filter_query)
    
    async def get_categories(self, user_id: str) -> List[str]:
        """
        Get all unique expense categories for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            List of category strings
            
        Example:
            categories = await expense_repo.get_categories(user_id)
            # Returns: ["office", "travel", "utilities", "marketing"]
        """
        categories = await self.collection.distinct("category", {"user_id": user_id})
        return sorted(categories)
