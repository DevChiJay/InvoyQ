"""
MongoDB connection management using Motor (async MongoDB driver).

This module provides:
- MongoDB client singleton
- Database instance access
- Connection lifecycle management (startup/shutdown)
- Dependency injection for FastAPI routes
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
from typing import Optional


class MongoDB:
    """MongoDB connection manager singleton."""
    
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None


# Global MongoDB instance
mongodb = MongoDB()


async def connect_to_mongo() -> None:
    """
    Initialize MongoDB connection on application startup.
    
    Creates Motor client and connects to the configured database.
    Should be called in FastAPI lifespan startup event.
    """
    mongodb.client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
        minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
        serverSelectionTimeoutMS=5000,  # 5 seconds timeout for server selection
    )
    mongodb.database = mongodb.client[settings.MONGODB_DB_NAME]
    
    # Verify connection by pinging the database
    try:
        await mongodb.client.admin.command('ping')
        print(f"✅ Connected to MongoDB database: {settings.MONGODB_DB_NAME}")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection() -> None:
    """
    Close MongoDB connection on application shutdown.
    
    Closes the Motor client and releases resources.
    Should be called in FastAPI lifespan shutdown event.
    """
    if mongodb.client:
        mongodb.client.close()
        print("✅ Closed MongoDB connection")


def get_database() -> AsyncIOMotorDatabase:
    """
    Get the MongoDB database instance.
    
    Used as a FastAPI dependency for routes that need database access.
    
    Returns:
        AsyncIOMotorDatabase: The active MongoDB database instance
        
    Raises:
        RuntimeError: If database is not initialized (connect_to_mongo not called)
    
    Example:
        @router.get("/items")
        async def list_items(db: AsyncIOMotorDatabase = Depends(get_database)):
            items = await db.items.find().to_list(100)
            return items
    """
    if mongodb.database is None:
        raise RuntimeError(
            "Database not initialized. Ensure connect_to_mongo() is called on startup."
        )
    return mongodb.database
