"""
Product repository for MongoDB operations.

Handles product catalog CRUD, stock management,
and inventory tracking with atomic operations.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClientSession
from app.repositories.base import BaseRepository
from app.schemas.product import ProductOut, ProductCreate, ProductUpdate, ProductInDB, ProductStats
from typing import List, Optional
from datetime import datetime
from decimal import Decimal


class ProductRepository(BaseRepository[ProductInDB]):
    """Repository for product operations."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "products", ProductInDB)
    
    async def create_product(
        self,
        user_id: str,
        product_data: ProductCreate
    ) -> ProductInDB:
        """
        Create a new product for a user.
        
        Args:
            user_id: ID of the user creating the product
            product_data: Product creation data
            
        Returns:
            Created product document
            
        Raises:
            ValueError: If SKU already exists for this user
            
        Example:
            product = await product_repo.create_product(
                user_id,
                ProductCreate(sku="LAPTOP-001", name="Laptop", unit_price=1000)
            )
        """
        # Check if SKU already exists for this user
        exists = await self.exists({
            "user_id": user_id,
            "sku": product_data.sku
        })
        if exists:
            raise ValueError(f"Product with SKU '{product_data.sku}' already exists")
        
        from app.repositories.base import _serialize_for_mongo
        
        doc = product_data.model_dump()
        doc.update({
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        # Serialize Decimal and other non-BSON types
        doc = _serialize_for_mongo(doc)
        
        result = await self.collection.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        
        return ProductInDB(**doc)
    
    async def get_by_id_and_user(
        self,
        product_id: str,
        user_id: str
    ) -> Optional[ProductInDB]:
        """
        Get product by ID, ensuring it belongs to the user.
        
        Args:
            product_id: Product ID
            user_id: User ID (for ownership check)
            
        Returns:
            Product document or None if not found or not owned by user
        """
        return await self.get_one({
            "_id": self._to_object_id(product_id),
            "user_id": user_id
        })
    
    async def get_by_sku(
        self,
        user_id: str,
        sku: str
    ) -> Optional[ProductInDB]:
        """
        Get product by SKU for a user.
        
        Args:
            user_id: User ID
            sku: Product SKU
            
        Returns:
            Product document or None if not found
            
        Example:
            product = await product_repo.get_by_sku(user_id, "LAPTOP-001")
        """
        return await self.get_one({
            "user_id": user_id,
            "sku": sku
        })
    
    async def list_by_user(
        self,
        user_id: str,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
        sort_by: str = "created_at",
        sort_order: int = -1
    ) -> List[ProductInDB]:
        """
        List all products for a user with filters.
        
        Args:
            user_id: User ID
            is_active: Filter by active status (None = all)
            search: Search term for name/description/SKU
            skip: Number of records to skip
            limit: Maximum records to return
            sort_by: Field to sort by
            sort_order: Sort direction (1=asc, -1=desc)
            
        Returns:
            List of product documents
            
        Example:
            products = await product_repo.list_by_user(
                user_id,
                is_active=True,
                search="laptop",
                limit=20
            )
        """
        filter_query = {"user_id": user_id}
        
        # Filter by active status
        if is_active is not None:
            filter_query["is_active"] = is_active
        
        # Add search filter
        if search:
            filter_query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"sku": {"$regex": search, "$options": "i"}}
            ]
        
        return await self.get_many(
            filter_query,
            skip=skip,
            limit=limit,
            sort=[(sort_by, sort_order)]
        )
    
    async def update_product(
        self,
        product_id: str,
        user_id: str,
        update_data: ProductUpdate
    ) -> Optional[ProductInDB]:
        """
        Update a product, ensuring ownership.
        
        Args:
            product_id: Product ID
            user_id: User ID (for ownership check)
            update_data: Fields to update
            
        Returns:
            Updated product or None if not found/not owned
            
        Raises:
            ValueError: If trying to update SKU to one that already exists
        """
        # First check ownership
        existing = await self.get_by_id_and_user(product_id, user_id)
        if not existing:
            return None
        
        # If updating SKU, check for conflicts
        if update_data.sku and update_data.sku != existing.sku:
            sku_exists = await self.exists({
                "user_id": user_id,
                "sku": update_data.sku,
                "_id": {"$ne": self._to_object_id(product_id)}
            })
            if sku_exists:
                raise ValueError(f"Product with SKU '{update_data.sku}' already exists")
        
        return await self.update(product_id, update_data)
    
    async def adjust_quantity(
        self,
        product_id: str,
        user_id: str,
        adjustment: int,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Optional[ProductInDB]:
        """
        Adjust product quantity atomically (±).
        
        Args:
            product_id: Product ID
            user_id: User ID (for ownership check)
            adjustment: Quantity to add (positive) or subtract (negative)
            session: Optional MongoDB session for transactions
            
        Returns:
            Updated product or None if not found/not owned
            
        Raises:
            ValueError: If adjustment would result in negative quantity
            
        Example:
            # Add 10 units
            product = await product_repo.adjust_quantity(product_id, user_id, 10)
            
            # Deduct 5 units
            product = await product_repo.adjust_quantity(product_id, user_id, -5)
            
            # In a transaction
            async with transaction_session(mongodb.client) as session:
                product = await product_repo.adjust_quantity(
                    product_id, user_id, -5, session=session
                )
        """
        # Build update filter with ownership check
        filter_query = {
            "_id": self._to_object_id(product_id),
            "user_id": user_id
        }
        
        # If subtracting, ensure sufficient quantity
        if adjustment < 0:
            filter_query["quantity_available"] = {"$gte": abs(adjustment)}
        
        # Atomic increment/decrement
        result = await self.collection.find_one_and_update(
            filter_query,
            {
                "$inc": {"quantity_available": adjustment},
                "$set": {"updated_at": datetime.utcnow()}
            },
            return_document=True,
            session=session
        )
        
        if not result:
            # Check if product exists
            existing = await self.get_by_id_and_user(product_id, user_id)
            if not existing:
                return None
            # If exists but update failed, insufficient quantity
            if adjustment < 0:
                raise ValueError(
                    f"Insufficient quantity. Available: {existing.quantity_available}, "
                    f"Requested: {abs(adjustment)}"
                )
            return None
        
        result["_id"] = str(result["_id"])
        return ProductInDB(**result)
    
    async def soft_delete(
        self,
        product_id: str,
        user_id: str
    ) -> bool:
        """
        Soft delete a product (set is_active=False).
        
        Preserves product for historical invoice references.
        
        Args:
            product_id: Product ID
            user_id: User ID (for ownership check)
            
        Returns:
            True if deactivated, False if not found/not owned
            
        Example:
            deleted = await product_repo.soft_delete(product_id, user_id)
        """
        result = await self.collection.update_one(
            {
                "_id": self._to_object_id(product_id),
                "user_id": user_id
            },
            {
                "$set": {
                    "is_active": False,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0
    
    async def count_by_user(
        self,
        user_id: str,
        is_active: Optional[bool] = None
    ) -> int:
        """
        Count products for a user.
        
        Args:
            user_id: User ID
            is_active: Filter by active status
            
        Returns:
            Number of products
        """
        filter_query = {"user_id": user_id}
        if is_active is not None:
            filter_query["is_active"] = is_active
        
        return await self.count(filter_query)
    
    async def search_products(
        self,
        user_id: str,
        query: str,
        is_active: Optional[bool] = True,
        limit: int = 10
    ) -> List[ProductInDB]:
        """
        Full-text search products.
        
        Uses MongoDB text index for efficient searching.
        
        Args:
            user_id: User ID
            query: Search query string
            is_active: Filter by active status
            limit: Maximum results
            
        Returns:
            List of matching products
        """
        filter_query = {
            "user_id": user_id,
            "$text": {"$search": query}
        }
        
        if is_active is not None:
            filter_query["is_active"] = is_active
        
        cursor = self.collection.find(filter_query).limit(limit)
        docs = await cursor.to_list(length=limit)
        
        for doc in docs:
            doc["_id"] = str(doc["_id"])
        
        return [ProductInDB(**doc) for doc in docs]
    
    async def get_stats(self, user_id: str) -> ProductStats:
        """
        Get product statistics for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Product statistics including counts, inventory value, etc.
            
        Example:
            stats = await product_repo.get_stats(user_id)
            # Returns: ProductStats(
            #   total_count=100,
            #   active_count=85,
            #   low_stock_count=5,
            #   ...
            # )
        """
        # Build aggregation pipeline for comprehensive stats
        pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$facet": {
                    "overall": [
                        {
                            "$group": {
                                "_id": None,
                                "total_count": {"$sum": 1},
                                "active_count": {
                                    "$sum": {"$cond": [{"$eq": ["$is_active", True]}, 1, 0]}
                                },
                                "inactive_count": {
                                    "$sum": {"$cond": [{"$eq": ["$is_active", False]}, 1, 0]}
                                },
                                "low_stock_count": {
                                    "$sum": {"$cond": [{"$and": [{"$lt": ["$quantity_available", 10]}, {"$gt": ["$quantity_available", 0]}]}, 1, 0]}
                                },
                                "out_of_stock_count": {
                                    "$sum": {"$cond": [{"$eq": ["$quantity_available", 0]}, 1, 0]}
                                },
                                "total_inventory_value": {
                                    "$sum": {
                                        "$multiply": [
                                            {"$toDouble": "$unit_price"},
                                            "$quantity_available"
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        ]
        
        results = await self.collection.aggregate(pipeline).to_list(length=1)
        
        if results and results[0]["overall"]:
            stats_data = results[0]["overall"][0]
            return ProductStats(
                total_count=stats_data.get("total_count", 0),
                active_count=stats_data.get("active_count", 0),
                inactive_count=stats_data.get("inactive_count", 0),
                low_stock_count=stats_data.get("low_stock_count", 0),
                out_of_stock_count=stats_data.get("out_of_stock_count", 0),
                total_inventory_value=Decimal(str(stats_data.get("total_inventory_value", 0.0))),
                currency="NGN"  # Default currency
            )
        
        return ProductStats()
