"""
Extraction Repository for MongoDB operations.
Handles storing and retrieving AI extraction results.
"""
from datetime import datetime
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field
from app.repositories.base import BaseRepository


class ExtractionInDB(BaseModel):
    """Internal schema for extraction stored in database"""
    id: str = Field(alias="_id")
    user_id: Optional[str] = None  # None for anonymous extractions
    source_type: str  # 'text' or 'image'
    raw_text: str
    parsed_data: dict
    confidence_score: Optional[float] = None
    created_at: datetime
    
    class Config:
        populate_by_name = True
        from_attributes = True


class ExtractionRepository(BaseRepository):
    """Repository for extraction CRUD operations"""

    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "extractions")

    async def create_extraction(
        self,
        user_id: Optional[str],
        source_type: str,
        raw_text: str,
        parsed_data: dict,
        confidence_score: Optional[float] = None
    ) -> ExtractionInDB:
        """
        Create a new extraction record.
        
        Args:
            user_id: User ID (None for anonymous)
            source_type: 'text' or 'image'
            raw_text: Raw input text
            parsed_data: Parsed/extracted data
            confidence_score: Optional confidence score
            
        Returns:
            Created extraction
        """
        extraction_data = {
            "user_id": user_id,
            "source_type": source_type,
            "raw_text": raw_text,
            "parsed_data": parsed_data,
            "confidence_score": confidence_score,
            "created_at": datetime.utcnow()
        }
        
        result = await self.collection.insert_one(extraction_data)
        extraction_data["_id"] = str(result.inserted_id)
        
        return ExtractionInDB(**extraction_data)

    async def get_by_user(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 10
    ) -> List[ExtractionInDB]:
        """
        Get extractions for a specific user.
        
        Args:
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of extractions
        """
        cursor = self.collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        extractions = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            extractions.append(ExtractionInDB(**doc))
        
        return extractions
