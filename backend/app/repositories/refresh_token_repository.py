"""
Refresh token repository for MongoDB operations.

Handles refresh token creation, validation, rotation, and reuse detection.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel, Field
import secrets


class RefreshTokenInDB(BaseModel):
    """Refresh token document model for MongoDB storage."""
    id: str = Field(alias="_id")
    user_id: str
    token: str
    expires_at: datetime
    created_at: datetime
    revoked: bool = False
    revoked_at: Optional[datetime] = None
    replaced_by_token: Optional[str] = None  # For token rotation tracking
    device_id: Optional[str] = None  # To track which device issued the token
    
    class Config:
        populate_by_name = True


class RefreshTokenRepository:
    """Repository for refresh token operations."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db["refresh_tokens"]
    
    async def create_refresh_token(
        self,
        user_id: str,
        expires_delta: Optional[timedelta] = None,
        device_id: Optional[str] = None
    ) -> RefreshTokenInDB:
        """
        Create a new refresh token for a user.
        
        Args:
            user_id: User ID
            expires_delta: Token expiry duration (default: 30 days)
            device_id: Optional device identifier
            
        Returns:
            Created refresh token document
        """
        token = secrets.token_urlsafe(64)
        expires_at = datetime.utcnow() + (expires_delta or timedelta(days=30))
        
        token_doc = {
            "user_id": user_id,
            "token": token,
            "expires_at": expires_at,
            "created_at": datetime.utcnow(),
            "revoked": False,
            "device_id": device_id
        }
        
        result = await self.collection.insert_one(token_doc)
        token_doc["_id"] = str(result.inserted_id)
        
        return RefreshTokenInDB(**token_doc)
    
    async def get_by_token(self, token: str) -> Optional[RefreshTokenInDB]:
        """
        Find refresh token by token value.
        
        Args:
            token: Refresh token string
            
        Returns:
            Refresh token document or None if not found
        """
        doc = await self.collection.find_one({"token": token})
        if doc:
            doc["_id"] = str(doc["_id"])
            return RefreshTokenInDB(**doc)
        return None
    
    async def revoke_token(
        self,
        token: str,
        replaced_by_token: Optional[str] = None
    ) -> bool:
        """
        Revoke a refresh token.
        
        Args:
            token: Token to revoke
            replaced_by_token: New token that replaces this one (for rotation)
            
        Returns:
            True if revoked successfully
        """
        update_data = {
            "revoked": True,
            "revoked_at": datetime.utcnow()
        }
        if replaced_by_token:
            update_data["replaced_by_token"] = replaced_by_token
        
        result = await self.collection.update_one(
            {"token": token},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def revoke_all_user_tokens(self, user_id: str) -> int:
        """
        Revoke all refresh tokens for a user (security breach detected).
        
        Args:
            user_id: User ID
            
        Returns:
            Number of tokens revoked
        """
        result = await self.collection.update_many(
            {"user_id": user_id, "revoked": False},
            {
                "$set": {
                    "revoked": True,
                    "revoked_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count
    
    async def detect_token_reuse(self, token: str) -> bool:
        """
        Detect if a token has been reused (security breach).
        
        A token is considered reused if:
        1. It's already revoked
        2. It has a replacement token (was rotated)
        
        Args:
            token: Token to check
            
        Returns:
            True if token reuse detected
        """
        token_doc = await self.get_by_token(token)
        if not token_doc:
            return False
        
        # If token is revoked and has a replacement, it's been reused
        return token_doc.revoked and token_doc.replaced_by_token is not None
    
    async def is_valid(self, token: str) -> bool:
        """
        Check if a refresh token is valid.
        
        Args:
            token: Token to validate
            
        Returns:
            True if token is valid (not revoked and not expired)
        """
        token_doc = await self.get_by_token(token)
        if not token_doc:
            return False
        
        # Check if revoked
        if token_doc.revoked:
            return False
        
        # Check if expired
        if token_doc.expires_at < datetime.utcnow():
            return False
        
        return True
    
    async def cleanup_expired_tokens(self) -> int:
        """
        Delete expired tokens from database (maintenance task).
        
        Returns:
            Number of tokens deleted
        """
        result = await self.collection.delete_many({
            "expires_at": {"$lt": datetime.utcnow()}
        })
        return result.deleted_count
    
    async def get_user_tokens(self, user_id: str) -> List[RefreshTokenInDB]:
        """
        Get all active tokens for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            List of active refresh tokens
        """
        cursor = self.collection.find({
            "user_id": user_id,
            "revoked": False,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        tokens = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            tokens.append(RefreshTokenInDB(**doc))
        
        return tokens
