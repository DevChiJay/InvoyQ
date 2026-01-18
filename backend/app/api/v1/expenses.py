"""
Expenses API endpoints.

Handles business expense tracking including:
- Expense CRUD operations
- Category-based filtering
- Date range filtering (weekly/monthly presets)
- Tag-based organization
- Summary/aggregation by category
"""

from typing import Optional, List
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_database
from app.dependencies.auth import get_current_user
from app.repositories.user_repository import UserInDB
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseOut,
    ExpenseListResponse,
    ExpenseSummary,
    ExpenseSummaryResponse,
    EXPENSE_CATEGORIES
)
from app.utils.date_filters import parse_period_filter, PeriodFilter


router = APIRouter()


@router.post(
    "",
    response_model=ExpenseOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new expense"
)
async def create_expense(
    expense_data: ExpenseCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Create a new expense record.
    
    - **category**: Expense category (e.g., office, travel, utilities)
    - **description**: Detailed description
    - **amount**: Expense amount (must be positive)
    - **currency**: ISO 4217 currency code (default: NGN)
    - **vendor**: Optional vendor/supplier name
    - **date**: Date of expense
    - **receipt_url**: Optional URL to receipt image/document
    - **tags**: Optional list of tags for categorization
    
    Returns the created expense with generated ID.
    """
    repo = ExpenseRepository(db)
    
    expense = await repo.create_expense(
        user_id=str(current_user.id),
        expense_data=expense_data
    )
    
    return expense


@router.get(
    "",
    response_model=ExpenseListResponse,
    summary="List expenses"
)
async def list_expenses(
    category: Optional[str] = Query(None, description="Filter by category"),
    date_from: Optional[date] = Query(None, description="Filter from date (inclusive)"),
    date_to: Optional[date] = Query(None, description="Filter to date (inclusive)"),
    period: Optional[str] = Query(
        None,
        description="Period filter: 'week', 'month', or 'year'. Overrides date_from/date_to if provided."
    ),
    reference_date: Optional[date] = Query(
        None,
        description="Reference date for period filter (default: today)"
    ),
    tags: Optional[List[str]] = Query(None, description="Filter by tags (any match)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records to return"),
    sort_by: str = Query("date", description="Field to sort by"),
    sort_order: int = Query(-1, description="Sort order: 1=asc, -1=desc"),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    List all expenses for the authenticated user.
    
    Supports multiple filtering options:
    - **By category**: Filter to specific expense category
    - **By date range**: Use date_from and date_to for explicit range
    - **By period**: Use 'week', 'month', or 'year' for preset ranges
    - **By tags**: Filter expenses with specific tags
    
    Examples:
    - `/expenses?period=week` - Expenses from this week (Mon-Sun)
    - `/expenses?period=month&reference_date=2026-01-01` - January 2026 expenses
    - `/expenses?category=travel&date_from=2026-01-01&date_to=2026-01-31`
    - `/expenses?tags=urgent&tags=reimbursable`
    
    Returns paginated list with metadata.
    """
    repo = ExpenseRepository(db)
    
    # Build date range query from period or explicit dates
    date_range_query = None
    if period:
        # Validate period
        if period not in [p.value for p in PeriodFilter]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid period. Must be one of: {', '.join([p.value for p in PeriodFilter])}"
            )
        date_range_query = parse_period_filter(period, reference_date)
    
    expenses = await repo.list_by_user(
        user_id=str(current_user.id),
        category=category,
        date_from=date_from,
        date_to=date_to,
        date_range_query=date_range_query,
        tags=tags,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Count total for pagination metadata
    total = await repo.count_by_user(
        user_id=str(current_user.id),
        category=category,
        date_from=date_from,
        date_to=date_to
    )
    
    return ExpenseListResponse(
        items=expenses,
        total=total,
        limit=limit,
        offset=skip,
        has_more=(skip + len(expenses)) < total
    )


@router.get(
    "/categories",
    response_model=List[str],
    summary="Get expense categories"
)
async def get_expense_categories(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all unique expense categories used by the authenticated user.
    
    Returns a sorted list of category strings.
    Useful for autocomplete/dropdown UI components.
    """
    repo = ExpenseRepository(db)
    
    categories = await repo.get_categories(user_id=str(current_user.id))
    
    return categories


@router.get(
    "/summary",
    response_model=ExpenseSummaryResponse,
    summary="Get expense summary by category"
)
async def get_expense_summary(
    category: Optional[str] = Query(None, description="Filter by specific category"),
    date_from: Optional[date] = Query(None, description="Filter from date"),
    date_to: Optional[date] = Query(None, description="Filter to date"),
    period: Optional[str] = Query(None, description="Period filter: 'week', 'month', or 'year'"),
    reference_date: Optional[date] = Query(None, description="Reference date for period filter"),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get expense summary grouped by category.
    
    Returns aggregated totals for each category within the specified
    date range or period.
    
    Examples:
    - `/expenses/summary?period=month` - This month's summary
    - `/expenses/summary?date_from=2026-01-01&date_to=2026-12-31` - Year 2026 summary
    - `/expenses/summary?category=travel&period=week` - Travel expenses this week
    
    Returns:
    - List of summaries by category (sorted by total descending)
    - Grand total across all categories
    - Period start/end dates (if applicable)
    """
    repo = ExpenseRepository(db)
    
    # Build date range query
    date_range_query = None
    period_start = None
    period_end = None
    
    if period:
        if period not in [p.value for p in PeriodFilter]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid period. Must be one of: {', '.join([p.value for p in PeriodFilter])}"
            )
        date_range_query = parse_period_filter(period, reference_date)
        
        # Extract period boundaries for response
        if date_range_query:
            period_start = date_range_query.get("$gte")
            period_end = date_range_query.get("$lte")
            if period_start:
                period_start = period_start.date()
            if period_end:
                period_end = period_end.date()
    
    summaries = await repo.get_summary(
        user_id=str(current_user.id),
        category=category,
        date_from=date_from,
        date_to=date_to,
        date_range_query=date_range_query
    )
    
    # Calculate grand total
    grand_total = sum(s.total_amount for s in summaries)
    
    return ExpenseSummaryResponse(
        summaries=summaries,
        grand_total=grand_total,
        period_start=period_start or date_from,
        period_end=period_end or date_to
    )


@router.get(
    "/{expense_id}",
    response_model=ExpenseOut,
    summary="Get expense details"
)
async def get_expense(
    expense_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get a single expense by ID.
    
    Returns 404 if expense doesn't exist or doesn't belong to the user.
    """
    repo = ExpenseRepository(db)
    
    expense = await repo.get_by_id_and_user(
        expense_id=expense_id,
        user_id=str(current_user.id)
    )
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    return expense


@router.put(
    "/{expense_id}",
    response_model=ExpenseOut,
    summary="Update expense"
)
async def update_expense(
    expense_id: str,
    expense_data: ExpenseUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Update an existing expense.
    
    All fields are optional - only provided fields will be updated.
    
    Returns 404 if expense doesn't exist or doesn't belong to the user.
    """
    repo = ExpenseRepository(db)
    
    expense = await repo.update_expense(
        expense_id=expense_id,
        user_id=str(current_user.id),
        update_data=expense_data
    )
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    return expense


@router.delete(
    "/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete expense"
)
async def delete_expense(
    expense_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Delete an expense.
    
    Returns 404 if expense doesn't exist or doesn't belong to the user.
    """
    repo = ExpenseRepository(db)
    
    deleted = await repo.delete_expense(
        expense_id=expense_id,
        user_id=str(current_user.id)
    )
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    return None
    """
    Delete an expense permanently.
    
    Returns 404 if expense doesn't exist or doesn't belong to the user.
    """
    repo = ExpenseRepository(db)
    
    deleted = await repo.delete_expense(
        expense_id=expense_id,
        user_id=str(current_user.id)
    )
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    return None
