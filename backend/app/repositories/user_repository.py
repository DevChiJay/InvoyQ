"""
User repository for MongoDB operations.

Handles user CRUD operations, authentication queries,
and profile management.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.repositories.base import BaseRepository
from app.schemas.user import UserOut, UserCreate, UserUpdate
from typing import Optional
from datetime import datetime


class UserInDB(UserOut):
    """User document model for MongoDB storage."""
    _id: str
    hashed_password: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    
    # OAuth fields
    oauth_provider: Optional[str] = None
    oauth_provider_id: Optional[str] = None
    
    class Config:
        populate_by_name = True


class UserRepository(BaseRepository[UserInDB]):
    """Repository for user operations."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "users", UserInDB)
    
    async def get_by_email(self, email: str) -> Optional[UserInDB]:
        """
        Find user by email address.
        
        Args:
            email: User email address
            
        Returns:
            User document or None if not found
            
        Example:
            user = await user_repo.get_by_email("test@example.com")
        """
        return await self.get_one({"email": email})
    
    async def get_by_oauth(
        self,
        provider: str,
        provider_id: str
    ) -> Optional[UserInDB]:
        """
        Find user by OAuth provider and ID.
        
        Args:
            provider: OAuth provider name (e.g., "google")
            provider_id: Provider's user ID
            
        Returns:
            User document or None if not found
            
        Example:
            user = await user_repo.get_by_oauth("google", "123456789")
        """
        return await self.get_one({
            "oauth_provider": provider,
            "oauth_provider_id": provider_id
        })
    
    async def create_user(
        self,
        user_data: UserCreate,
        hashed_password: str,
        oauth_provider: Optional[str] = None,
        oauth_provider_id: Optional[str] = None
    ) -> UserInDB:
        """
        Create a new user.
        
        Args:
            user_data: User creation data
            hashed_password: Hashed password
            oauth_provider: Optional OAuth provider
            oauth_provider_id: Optional OAuth provider user ID
            
        Returns:
            Created user document
            
        Example:
            user = await user_repo.create_user(
                UserCreate(email="test@example.com", password="secret"),
                hashed_password=hash_password("secret")
            )
        """
        doc = user_data.model_dump(exclude={"password"})
        doc.update({
            "hashed_password": hashed_password,
            "is_active": True,
            "is_verified": False if not oauth_provider else True,  # OAuth users auto-verified
            "is_pro": False,
            "subscription_status": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        if oauth_provider:
            doc["oauth_provider"] = oauth_provider
            doc["oauth_provider_id"] = oauth_provider_id
        
        result = await self.collection.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        
        return UserInDB(**doc)
    
    async def update_user(
        self,
        user_id: str,
        update_data: UserUpdate
    ) -> Optional[UserInDB]:
        """
        Update user profile.
        
        Args:
            user_id: User ID
            update_data: Fields to update
            
        Returns:
            Updated user or None if not found
            
        Example:
            user = await user_repo.update_user(
                user_id,
                UserUpdate(full_name="John Doe", company_name="Acme Corp")
            )
        """
        return await self.update(user_id, update_data)
    
    async def verify_email(self, user_id: str) -> Optional[UserInDB]:
        """
        Mark user's email as verified.
        
        Args:
            user_id: User ID
            
        Returns:
            Updated user or None if not found
        """
        result = await self.collection.find_one_and_update(
            {"_id": self._to_object_id(user_id)},
            {
                "$set": {
                    "is_verified": True,
                    "updated_at": datetime.utcnow()
                }
            },
            return_document=True
        )
        
        if not result:
            return None
        
        result["_id"] = str(result["_id"])
        return UserInDB(**result)
    
    async def update_subscription(
        self,
        user_id: str,
        is_pro: bool,
        subscription_status: Optional[str] = None,
        subscription_provider: Optional[str] = None,
        subscription_start_date: Optional[datetime] = None,
        subscription_end_date: Optional[datetime] = None
    ) -> Optional[UserInDB]:
        """
        Update user's subscription status.
        
        Args:
            user_id: User ID
            is_pro: Pro subscription status
            subscription_status: Subscription status string
            subscription_provider: Payment provider
            subscription_start_date: Subscription start date
            subscription_end_date: Subscription end date
            
        Returns:
            Updated user or None if not found
        """
        update_fields = {
            "is_pro": is_pro,
            "updated_at": datetime.utcnow()
        }
        
        if subscription_status is not None:
            update_fields["subscription_status"] = subscription_status
        if subscription_provider is not None:
            update_fields["subscription_provider"] = subscription_provider
        if subscription_start_date is not None:
            update_fields["subscription_start_date"] = subscription_start_date
        if subscription_end_date is not None:
            update_fields["subscription_end_date"] = subscription_end_date
        
        result = await self.collection.find_one_and_update(
            {"_id": self._to_object_id(user_id)},
            {"$set": update_fields},
            return_document=True
        )
        
        if not result:
            return None
        
        result["_id"] = str(result["_id"])
        return UserInDB(**result)
    
    async def deactivate_user(self, user_id: str) -> bool:
        """
        Deactivate a user account.
        
        Args:
            user_id: User ID
            
        Returns:
            True if deactivated, False if not found
        """
        result = await self.collection.update_one(
            {"_id": self._to_object_id(user_id)},
            {
                "$set": {
                    "is_active": False,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0
    
    async def email_exists(self, email: str) -> bool:
        """
        Check if email is already registered.
        
        Args:
            email: Email address to check
            
        Returns:
            True if email exists, False otherwise
        """
        return await self.exists({"email": email})
