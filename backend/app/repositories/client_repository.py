"""
Client repository for MongoDB operations.

Handles client CRUD operations and user-scoped queries.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.repositories.base import BaseRepository
from app.schemas.client import ClientOut, ClientCreate, ClientUpdate
from typing import List, Optional
from datetime import datetime
from pydantic import Field


class ClientInDB(ClientOut):
    """Client document model for MongoDB storage."""
    id: str = Field(alias="_id")
    user_id: str  # Reference to user who owns this client
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True


class ClientRepository(BaseRepository[ClientInDB]):
    """Repository for client operations."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "clients", ClientInDB)
    
    async def create_client(
        self,
        user_id: str,
        client_data: ClientCreate
    ) -> ClientInDB:
        """
        Create a new client for a user.
        
        Args:
            user_id: ID of the user creating the client
            client_data: Client creation data
            
        Returns:
            Created client document
            
        Example:
            client = await client_repo.create_client(
                user_id,
                ClientCreate(name="Acme Corp", email="contact@acme.com")
            )
        """
        from app.repositories.base import _serialize_for_mongo
        
        doc = client_data.model_dump()
        doc.update({
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        # Serialize Decimal and other non-BSON types (for future-proofing)
        doc = _serialize_for_mongo(doc)
        
        result = await self.collection.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        
        return ClientInDB(**doc)
    
    async def get_by_id_and_user(
        self,
        client_id: str,
        user_id: str
    ) -> Optional[ClientInDB]:
        """
        Get client by ID, ensuring it belongs to the user.
        
        Args:
            client_id: Client ID
            user_id: User ID (for ownership check)
            
        Returns:
            Client document or None if not found or not owned by user
            
        Example:
            client = await client_repo.get_by_id_and_user(client_id, user_id)
            if not client:
                raise HTTPException(404, "Client not found")
        """
        return await self.get_one({
            "_id": self._to_object_id(client_id),
            "user_id": user_id
        })
    
    async def list_by_user(
        self,
        user_id: str,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
        sort_by: str = "name",
        sort_order: int = 1
    ) -> List[ClientInDB]:
        """
        List all clients for a user with optional search and sorting.
        
        Args:
            user_id: User ID
            search: Optional search term (searches name and email)
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
            sort_by: Field to sort by (default: "name")
            sort_order: Sort direction (1 for asc, -1 for desc)
            
        Returns:
            List of client documents
            
        Example:
            clients = await client_repo.list_by_user(
                user_id,
                search="acme",
                skip=0,
                limit=20,
                sort_by="created_at",
                sort_order=-1
            )
        """
        filter_query = {"user_id": user_id}
        
        # Add search filter if provided
        if search:
            filter_query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        
        return await self.get_many(
            filter_query,
            skip=skip,
            limit=limit,
            sort=[(sort_by, sort_order)]
        )
    
    async def update_client(
        self,
        client_id: str,
        user_id: str,
        update_data: ClientUpdate
    ) -> Optional[ClientInDB]:
        """
        Update a client, ensuring ownership.
        
        Args:
            client_id: Client ID
            user_id: User ID (for ownership check)
            update_data: Fields to update
            
        Returns:
            Updated client or None if not found/not owned
            
        Example:
            client = await client_repo.update_client(
                client_id,
                user_id,
                ClientUpdate(phone="+1234567890")
            )
        """
        # First check ownership
        existing = await self.get_by_id_and_user(client_id, user_id)
        if not existing:
            return None
        
        # Perform update
        return await self.update(client_id, update_data)
    
    async def delete_client(
        self,
        client_id: str,
        user_id: str
    ) -> bool:
        """
        Delete a client, ensuring ownership.
        
        Args:
            client_id: Client ID
            user_id: User ID (for ownership check)
            
        Returns:
            True if deleted, False if not found/not owned
            
        Example:
            deleted = await client_repo.delete_client(client_id, user_id)
            if not deleted:
                raise HTTPException(404, "Client not found")
        """
        result = await self.collection.delete_one({
            "_id": self._to_object_id(client_id),
            "user_id": user_id
        })
        return result.deleted_count > 0
    
    async def count_by_user(self, user_id: str) -> int:
        """
        Count total clients for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Number of clients
            
        Example:
            count = await client_repo.count_by_user(user_id)
        """
        return await self.count({"user_id": user_id})
    
    async def search_clients(
        self,
        user_id: str,
        query: str,
        limit: int = 10
    ) -> List[ClientInDB]:
        """
        Full-text search clients by name.
        
        Uses MongoDB text index for efficient searching.
        
        Args:
            user_id: User ID
            query: Search query string
            limit: Maximum results
            
        Returns:
            List of matching clients
            
        Example:
            results = await client_repo.search_clients(user_id, "acme corp")
        """
        filter_query = {
            "user_id": user_id,
            "$text": {"$search": query}
        }
        
        cursor = self.collection.find(filter_query).limit(limit)
        docs = await cursor.to_list(length=limit)
        
        for doc in docs:
            doc["_id"] = str(doc["_id"])
        
        return [ClientInDB(**doc) for doc in docs]
