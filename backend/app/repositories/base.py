"""
Base repository class for MongoDB operations.

Provides common CRUD operations and utilities that can be
inherited by specific repository implementations.
"""

from typing import TypeVar, Generic, Optional, List, Dict, Any, Type
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorCollection
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime, date
from decimal import Decimal


T = TypeVar('T', bound=BaseModel)


def _serialize_for_mongo(obj: Any) -> Any:
    """
    Recursively convert Python types to MongoDB-compatible types.
    
    - Decimal → str (preserves precision)
    - date → datetime (BSON only supports datetime)
    - dict → recursively serialize values
    - list → recursively serialize elements
    """
    if isinstance(obj, Decimal):
        return str(obj)
    elif isinstance(obj, date) and not isinstance(obj, datetime):
        # Convert date to datetime (BSON doesn't support date-only)
        return datetime.combine(obj, datetime.min.time())
    elif isinstance(obj, dict):
        return {k: _serialize_for_mongo(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_serialize_for_mongo(item) for item in obj]
    return obj


class BaseRepository(Generic[T]):
    """
    Base repository with common MongoDB operations.
    
    Type Parameters:
        T: Pydantic model type for the repository
        
    Attributes:
        collection_name: Name of the MongoDB collection
        model_class: Pydantic model class for validation
    """
    
    def __init__(
        self,
        db: AsyncIOMotorDatabase,
        collection_name: str,
        model_class: Type[T]
    ):
        """
        Initialize base repository.
        
        Args:
            db: MongoDB database instance
            collection_name: Name of the collection
            model_class: Pydantic model class
        """
        self.db = db
        self.collection: AsyncIOMotorCollection = db[collection_name]
        self.collection_name = collection_name
        self.model_class = model_class
    
    def _to_object_id(self, id_str: str) -> ObjectId:
        """Convert string ID to ObjectId."""
        try:
            return ObjectId(id_str)
        except Exception:
            raise ValueError(f"Invalid ObjectId: {id_str}")
    
    def _serialize_doc(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """
        Serialize document for storage (convert ObjectId to string in _id).
        
        Args:
            doc: Document dictionary
            
        Returns:
            Serialized document
        """
        if doc and "_id" in doc and isinstance(doc["_id"], ObjectId):
            doc["_id"] = str(doc["_id"])
        return doc
    
    async def create(self, data: BaseModel, **extra_fields) -> T:
        """
        Create a new document.
        
        Args:
            data: Pydantic model with data to create
            **extra_fields: Additional fields to add (e.g., created_at)
            
        Returns:
            Created document as Pydantic model
            
        Example:
            user = await user_repo.create(
                UserCreate(email="test@example.com", ...),
                created_at=datetime.utcnow()
            )
        """
        doc = data.model_dump(exclude_unset=True)
        doc.update(extra_fields)
        
        # Add timestamps if not present
        now = datetime.utcnow()
        doc.setdefault("created_at", now)
        doc.setdefault("updated_at", now)
        
        # Serialize Decimal and other non-BSON types
        doc = _serialize_for_mongo(doc)
        
        result = await self.collection.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        
        return self.model_class(**doc)
    
    async def get_by_id(self, id: str) -> Optional[T]:
        """
        Get document by ID.
        
        Args:
            id: Document ID (string or ObjectId)
            
        Returns:
            Document as Pydantic model, or None if not found
            
        Example:
            user = await user_repo.get_by_id("64a1b2c3d4e5f6g7h8i9j0k1")
        """
        doc = await self.collection.find_one({"_id": self._to_object_id(id)})
        if not doc:
            return None
        
        doc["_id"] = str(doc["_id"])
        return self.model_class(**doc)
    
    async def get_one(self, filter_query: Dict[str, Any]) -> Optional[T]:
        """
        Get a single document matching the filter.
        
        Args:
            filter_query: MongoDB filter query
            
        Returns:
            Document as Pydantic model, or None if not found
            
        Example:
            user = await user_repo.get_one({"email": "test@example.com"})
        """
        doc = await self.collection.find_one(filter_query)
        if not doc:
            return None
        
        doc["_id"] = str(doc["_id"])
        return self.model_class(**doc)
    
    async def get_many(
        self,
        filter_query: Dict[str, Any],
        skip: int = 0,
        limit: int = 100,
        sort: Optional[List[tuple]] = None
    ) -> List[T]:
        """
        Get multiple documents matching the filter.
        
        Args:
            filter_query: MongoDB filter query
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            sort: Sort specification
            
        Returns:
            List of documents as Pydantic models
            
        Example:
            clients = await client_repo.get_many(
                {"user_id": user_id},
                sort=[("created_at", -1)],
                limit=20
            )
        """
        cursor = self.collection.find(filter_query)
        
        if sort:
            cursor = cursor.sort(sort)
        
        cursor = cursor.skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        
        # Serialize _id fields
        for doc in docs:
            doc["_id"] = str(doc["_id"])
        
        return [self.model_class(**doc) for doc in docs]
    
    async def update(
        self,
        id: str,
        update_data: BaseModel | Dict[str, Any],
        **extra_fields
    ) -> Optional[T]:
        """
        Update a document by ID.
        
        Args:
            id: Document ID
            update_data: Pydantic model or dict with fields to update
            **extra_fields: Additional fields to update
            
        Returns:
            Updated document, or None if not found
            
        Example:
            user = await user_repo.update(
                user_id,
                UserUpdate(full_name="New Name"),
                updated_at=datetime.utcnow()
            )
        """
        if isinstance(update_data, dict):
            update_dict = update_data
        else:
            update_dict = update_data.model_dump(exclude_unset=True)
        # Serialize Decimal and other non-BSON types
        update_dict = _serialize_for_mongo(update_dict)
        
        update_dict.update(extra_fields)
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await self.collection.find_one_and_update(
            {"_id": self._to_object_id(id)},
            {"$set": update_dict},
            return_document=True
        )
        
        if not result:
            return None
        
        result["_id"] = str(result["_id"])
        return self.model_class(**result)
    
    async def delete(self, id: str) -> bool:
        """
        Delete a document by ID.
        
        Args:
            id: Document ID
            
        Returns:
            True if deleted, False if not found
            
        Example:
            deleted = await client_repo.delete(client_id)
        """
        result = await self.collection.delete_one({"_id": self._to_object_id(id)})
        return result.deleted_count > 0
    
    async def count(self, filter_query: Dict[str, Any]) -> int:
        """
        Count documents matching the filter.
        
        Args:
            filter_query: MongoDB filter query
            
        Returns:
            Number of matching documents
            
        Example:
            count = await product_repo.count({"user_id": user_id, "is_active": True})
        """
        return await self.collection.count_documents(filter_query)
    
    async def exists(self, filter_query: Dict[str, Any]) -> bool:
        """
        Check if any document matches the filter.
        
        Args:
            filter_query: MongoDB filter query
            
        Returns:
            True if at least one document matches, False otherwise
            
        Example:
            email_exists = await user_repo.exists({"email": "test@example.com"})
        """
        count = await self.collection.count_documents(filter_query, limit=1)
        return count > 0
