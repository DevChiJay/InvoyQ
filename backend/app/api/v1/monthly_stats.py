"""
API endpoints for monthly statistics.
Provides aggregated views of invoices, expenses, products, and clients by month.
"""
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime

from app.db.mongo import get_database
from app.dependencies.auth import get_current_user
from app.repositories.user_repository import UserInDB
from app.repositories.monthly_stats_repository import MonthlyStatsRepository
from app.schemas.monthly_stats import MonthlyStatsResponse

router = APIRouter()


@router.get("/monthly", response_model=MonthlyStatsResponse)
async def get_monthly_stats(
    month: int = Query(..., ge=1, le=12, description="Month number (1-12)"),
    year: int = Query(..., ge=2000, le=2100, description="Year"),
    currency: str = Query("NGN", min_length=3, max_length=3, description="Currency filter (ISO 4217 code)"),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get aggregated statistics for a specific month.
    
    Returns monthly breakdown of:
    - Total revenue (from paid invoices)
    - Total expenses
    - Net income (revenue - expenses)
    - Invoice counts (total, paid, unpaid)
    - Total products sold (quantity sum from paid invoices)
    - Top 5 best-selling products
    - New clients added in month
    
    **Query Parameters:**
    - `month`: Month number (1-12)
    - `year`: Year
    - `currency`: Currency code for filtering (default: NGN)
    
    **Example:**
    ```
    GET /api/v1/stats/monthly?month=3&year=2026&currency=NGN
    ```
    """
    repo = MonthlyStatsRepository(db)
    
    stats = await repo.get_monthly_stats(
        user_id=str(current_user.id),
        month=month,
        year=year,
        currency=currency.upper()
    )
    
    return MonthlyStatsResponse(stats=stats)
