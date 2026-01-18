"""
Pagination utilities for MongoDB queries.

Provides cursor-based and offset-based pagination helpers
for efficient data retrieval from MongoDB collections.
"""

from typing import Generic, TypeVar, List, Optional, Dict, Any
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorCollection


T = TypeVar('T')


class PaginationParams(BaseModel):
    """
    Query parameters for pagination.
    
    Attributes:
        skip: Number of documents to skip (offset pagination)
        limit: Maximum number of documents to return
        cursor: Cursor token for cursor-based pagination (optional)
    """
    skip: int = Field(default=0, ge=0, description="Number of documents to skip")
    limit: int = Field(default=50, ge=1, le=100, description="Number of documents per page")
    cursor: Optional[str] = Field(default=None, description="Cursor token for pagination")


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated response wrapper.
    
    Type Parameters:
        T: Type of items in the response
        
    Attributes:
        items: List of items for current page
        total: Total number of items (if count requested)
        skip: Current skip offset
        limit: Current limit
        has_more: Whether there are more items after this page
        next_cursor: Cursor token for next page (cursor-based pagination)
    """
    items: List[T]
    total: Optional[int] = None
    skip: int
    limit: int
    has_more: bool
    next_cursor: Optional[str] = None
    
    class Config:
        arbitrary_types_allowed = True


async def paginate_query(
    collection: AsyncIOMotorCollection,
    filter_query: Dict[str, Any],
    skip: int = 0,
    limit: int = 50,
    sort: Optional[List[tuple]] = None,
    count_total: bool = False
) -> Dict[str, Any]:
    """
    Execute a paginated query on a MongoDB collection.
    
    Args:
        collection: MongoDB collection to query
        filter_query: MongoDB filter query
        skip: Number of documents to skip
        limit: Maximum number of documents to return
        sort: Sort specification (e.g., [("created_at", -1)])
        count_total: Whether to count total documents matching filter
        
    Returns:
        Dictionary with:
            - items: List of documents
            - total: Total count (if count_total=True)
            - skip: Current skip value
            - limit: Current limit value
            - has_more: Boolean indicating if more items exist
            
    Example:
        result = await paginate_query(
            db.products,
            {"user_id": user_id, "is_active": True},
            skip=0,
            limit=20,
            sort=[("created_at", -1)],
            count_total=True
        )
    """
    # Build query cursor
    cursor = collection.find(filter_query)
    
    # Apply sorting
    if sort:
        cursor = cursor.sort(sort)
    
    # Apply pagination
    cursor = cursor.skip(skip).limit(limit + 1)  # Fetch one extra to check has_more
    
    # Execute query
    items = await cursor.to_list(length=limit + 1)
    
    # Check if there are more items
    has_more = len(items) > limit
    if has_more:
        items = items[:limit]  # Remove the extra item
    
    # Optionally count total
    total = None
    if count_total:
        total = await collection.count_documents(filter_query)
    
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": has_more
    }


def build_pagination_metadata(
    total: Optional[int],
    skip: int,
    limit: int,
    has_more: bool
) -> Dict[str, Any]:
    """
    Build pagination metadata for API responses.
    
    Args:
        total: Total number of items (if known)
        skip: Current skip offset
        limit: Current limit
        has_more: Whether more items exist
        
    Returns:
        Dictionary with pagination metadata
        
    Example:
        metadata = build_pagination_metadata(
            total=150,
            skip=20,
            limit=20,
            has_more=True
        )
        # Returns: {
        #     "total": 150,
        #     "page": 2,
        #     "pages": 8,
        #     "skip": 20,
        #     "limit": 20,
        #     "has_more": True
        # }
    """
    metadata = {
        "skip": skip,
        "limit": limit,
        "has_more": has_more
    }
    
    if total is not None:
        metadata["total"] = total
        metadata["page"] = (skip // limit) + 1 if limit > 0 else 1
        metadata["pages"] = (total + limit - 1) // limit if limit > 0 else 1
    
    return metadata


class CursorPagination:
    """
    Cursor-based pagination helper.
    
    More efficient than offset pagination for large datasets,
    as it doesn't require skipping documents.
    
    Example:
        paginator = CursorPagination(field="_id")
        result = await paginator.paginate(
            db.invoices,
            {"user_id": user_id},
            cursor="64a1b2c3d4e5f6g7h8i9j0k1",
            limit=20
        )
    """
    
    def __init__(self, field: str = "_id", ascending: bool = False):
        """
        Initialize cursor pagination.
        
        Args:
            field: Field to use for cursor (must be unique and indexed)
            ascending: Sort direction (True for ascending, False for descending)
        """
        self.field = field
        self.sort_direction = 1 if ascending else -1
    
    async def paginate(
        self,
        collection: AsyncIOMotorCollection,
        filter_query: Dict[str, Any],
        cursor: Optional[str] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Execute cursor-based pagination.
        
        Args:
            collection: MongoDB collection
            filter_query: Base filter query
            cursor: Cursor token (value of field from last item of previous page)
            limit: Number of items per page
            
        Returns:
            Dictionary with items, next_cursor, and has_more
        """
        # Modify filter to use cursor
        if cursor:
            cursor_filter = {
                self.field: {"$gt": cursor} if self.sort_direction == 1 else {"$lt": cursor}
            }
            filter_query = {**filter_query, **cursor_filter}
        
        # Execute query
        cursor_obj = collection.find(filter_query).sort(self.field, self.sort_direction).limit(limit + 1)
        items = await cursor_obj.to_list(length=limit + 1)
        
        # Check for more items
        has_more = len(items) > limit
        if has_more:
            items = items[:limit]
        
        # Get next cursor
        next_cursor = None
        if items and has_more:
            last_item = items[-1]
            next_cursor = str(last_item.get(self.field))
        
        return {
            "items": items,
            "next_cursor": next_cursor,
            "has_more": has_more,
            "limit": limit
        }
