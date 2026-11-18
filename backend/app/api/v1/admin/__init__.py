"""
Admin API endpoints.

All endpoints require admin authentication.
"""

from fastapi import APIRouter
from app.api.v1.admin import stats, users

router = APIRouter()

router.include_router(users.router, prefix="/users", tags=["admin-users"])
router.include_router(stats.router, prefix="/stats", tags=["admin-stats"])
