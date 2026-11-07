"""Plan usage for the signed-in user: what they have used this month and what their plan allows."""
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_database
from app.dependencies.auth import get_current_user
from app.repositories.user_repository import UserInDB
from app.services.plans import UsageService

router = APIRouter()


@router.get("/usage")
async def get_usage(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user),
):
    """Monthly invoice and extraction usage, limits (null = unlimited) and the reset date."""
    return await UsageService(db).summary(current_user)
