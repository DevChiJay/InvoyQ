"""
Invoice repository for MongoDB operations.

Handles invoice CRUD, product integration,
event tracking, and date filtering.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClientSession
from app.repositories.base import BaseRepository
from app.schemas.invoice_mongo import (
    InvoiceOut, InvoiceCreate, InvoiceUpdate, InvoiceInDB,
    InvoiceEvent
)
from typing import List, Optional, Dict, Any
from datetime import datetime, date


class InvoiceRepository(BaseRepository[InvoiceInDB]):
    """Repository for invoice operations."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "invoices", InvoiceInDB)
    
    async def create_invoice(
        self,
        user_id: str,
        client_id: str,
        invoice_data: InvoiceCreate,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> InvoiceInDB:
        """
        Create a new invoice.
        
        Args:
            user_id: ID of the user creating the invoice
            client_id: ID of the client
            invoice_data: Invoice creation data
            session: Optional MongoDB session for transactions
            
        Returns:
            Created invoice document
            
        Example:
            invoice = await invoice_repo.create_invoice(
                user_id,
                client_id,
                InvoiceCreate(
                    number="INV-001",
                    items=[...],
                    status="draft"
                )
            )
        """
        from app.repositories.base import _serialize_for_mongo
        from app.repositories.product_repository import ProductRepository
        from decimal import Decimal
        
        doc = invoice_data.model_dump()
        
        # Process product_items to convert them to invoice items with product details
        final_items = []
        
        # Handle product_items (from catalog)
        if invoice_data.product_items:
            product_repo = ProductRepository(self.db)
            for product_item in invoice_data.product_items:
                # Fetch product details
                product = await product_repo.get_by_id_and_user(
                    product_id=product_item.product_id,
                    user_id=user_id
                )
                if not product:
                    # Skip product if not found or doesn't belong to user
                    # Could log warning here
                    continue
                    
                # Create invoice item with product reference
                quantity = Decimal(str(product_item.quantity))
                unit_price = Decimal(str(product.unit_price))
                tax_rate = Decimal(str(product.tax_rate or "0"))
                amount = quantity * unit_price
                
                item = {
                    "product_id": product_item.product_id,
                    "description": product.name,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "tax_rate": tax_rate,
                    "amount": amount
                }
                final_items.append(item)
        
        # Handle custom items (manual entries)
        if invoice_data.items:
            for custom_item in invoice_data.items:
                # Convert to dict and ensure amount is calculated
                item_dict = custom_item.model_dump()
                if item_dict.get("amount") is None:
                    quantity = Decimal(str(item_dict.get("quantity", 1)))
                    unit_price = Decimal(str(item_dict.get("unit_price", 0)))
                    item_dict["amount"] = quantity * unit_price
                # No product_id for custom items
                item_dict["product_id"] = None
                final_items.append(item_dict)
        
        # Replace items in doc and remove product_items (only used for API input)
        doc["items"] = final_items
        doc.pop("product_items", None)  # Remove product_items field from storage
        
        # Add system fields
        now = datetime.utcnow()
        doc.update({
            "user_id": user_id,
            "client_id": client_id,
            "created_at": now,
            "updated_at": now,
            "events": [
                {
                    "action": "created",
                    "timestamp": now,
                    "details": {"created_by": "system"}
                }
            ]
        })
        
        # Serialize Decimal and other non-BSON types
        doc = _serialize_for_mongo(doc)
        
        result = await self.collection.insert_one(doc, session=session)
        doc["_id"] = str(result.inserted_id)
        
        return InvoiceInDB(**doc)
    
    async def get_by_id_and_user(
        self,
        invoice_id: str,
        user_id: str
    ) -> Optional[InvoiceInDB]:
        """
        Get invoice by ID, ensuring it belongs to the user.
        
        Args:
            invoice_id: Invoice ID
            user_id: User ID (for ownership check)
            
        Returns:
            Invoice document or None if not found or not owned by user
        """
        return await self.get_one({
            "_id": self._to_object_id(invoice_id),
            "user_id": user_id
        })
    
    async def get_by_number(
        self,
        user_id: str,
        number: str
    ) -> Optional[InvoiceInDB]:
        """
        Get invoice by number for a user.
        
        Args:
            user_id: User ID
            number: Invoice number
            
        Returns:
            Invoice document or None if not found
        """
        return await self.get_one({
            "user_id": user_id,
            "number": number
        })
    
    async def list_by_user(
        self,
        user_id: str,
        client_id: Optional[str] = None,
        status: Optional[str] = None,
        due_from: Optional[date] = None,
        due_to: Optional[date] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        date_range_query: Optional[Dict[str, Any]] = None,
        skip: int = 0,
        limit: int = 50,
        sort_by: str = "created_at",
        sort_order: int = -1
    ) -> List[InvoiceInDB]:
        """
        List invoices for a user with filters.
        
        Args:
            user_id: User ID
            client_id: Filter by client
            status: Filter by status
            due_from: Filter by due date (from)
            due_to: Filter by due date (to)
            date_from: Filter issued date (from)
            date_to: Filter issued date (to)
            date_range_query: Pre-built date range query
            skip: Number of records to skip
            limit: Maximum records to return
            sort_by: Field to sort by
            sort_order: Sort direction (1=asc, -1=desc)
            
        Returns:
            List of invoice documents
            
        Example:
            # Filter by status and date range
            invoices = await invoice_repo.list_by_user(
                user_id,
                status="paid",
                due_from=date(2026, 1, 1),
                due_to=date(2026, 1, 31)
            )
        """
        filter_query = {"user_id": user_id}
        
        # Client filter
        if client_id:
            filter_query["client_id"] = client_id
        
        # Status filter
        if status:
            filter_query["status"] = status
        
        # Due date range filter
        if due_from or due_to:
            due_date_filter = {}
            if due_from:
                due_date_filter["$gte"] = due_from
            if due_to:
                due_date_filter["$lte"] = due_to
            if due_date_filter:
                filter_query["due_date"] = due_date_filter
        
        # Issued date range filter
        if date_range_query:
            filter_query["issued_date"] = date_range_query
        elif date_from or date_to:
            date_filter = {}
            if date_from:
                date_filter["$gte"] = date_from
            if date_to:
                date_filter["$lte"] = date_to
            if date_filter:
                filter_query["issued_date"] = date_filter
        
        return await self.get_many(
            filter_query,
            skip=skip,
            limit=limit,
            sort=[(sort_by, sort_order)]
        )
    
    async def update_invoice(
        self,
        invoice_id: str,
        user_id: str,
        invoice_data: InvoiceUpdate
    ) -> Optional[InvoiceInDB]:
        """
        Update an invoice, ensuring ownership.
        
        Args:
            invoice_id: Invoice ID
            user_id: User ID (for ownership check)
            invoice_data: Fields to update
            
        Returns:
            Updated invoice or None if not found/not owned
        """
        from app.repositories.base import _serialize_for_mongo
        
        # First check ownership
        existing = await self.get_by_id_and_user(invoice_id, user_id)
        if not existing:
            return None
        
        # Track status changes
        update_dict = invoice_data.model_dump(exclude_unset=True)
        if "status" in update_dict and update_dict["status"] != existing.status:
            # Append status change event
            event = InvoiceEvent(
                action="status_changed",
                timestamp=datetime.utcnow(),
                details={
                    "old_status": existing.status,
                    "new_status": update_dict["status"]
                }
            )
            
            # Serialize event data
            event_data = _serialize_for_mongo(event.model_dump())
            
            # Use $push to append event
            await self.collection.update_one(
                {"_id": self._to_object_id(invoice_id)},
                {
                    "$push": {"events": event_data},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
        
        return await self.update(invoice_id, invoice_data)
    
    async def add_event(
        self,
        invoice_id: str,
        user_id: str,
        action: str,
        details: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Add an event to invoice history.
        
        Args:
            invoice_id: Invoice ID
            user_id: User ID (for ownership check)
            action: Event action (e.g., "sent", "paid", "viewed")
            details: Optional event details
            
        Returns:
            True if event added, False if invoice not found/not owned
            
        Example:
            await invoice_repo.add_event(
                invoice_id,
                user_id,
                "sent",
                {"sent_to": "client@example.com", "method": "email"}
            )
        """
        from app.repositories.base import _serialize_for_mongo
        
        event = InvoiceEvent(
            action=action,
            timestamp=datetime.utcnow(),
            details=details or {}
        )
        
        # Serialize event data
        event_data = _serialize_for_mongo(event.model_dump())
        
        result = await self.collection.update_one(
            {
                "_id": self._to_object_id(invoice_id),
                "user_id": user_id
            },
            {
                "$push": {"events": event_data},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        return result.modified_count > 0
    
    async def delete_invoice(
        self,
        invoice_id: str,
        user_id: str
    ) -> bool:
        """
        Delete an invoice, ensuring ownership.
        
        Args:
            invoice_id: Invoice ID
            user_id: User ID (for ownership check)
            
        Returns:
            True if deleted, False if not found/not owned
        """
        result = await self.collection.delete_one({
            "_id": self._to_object_id(invoice_id),
            "user_id": user_id
        })
        return result.deleted_count > 0
    
    async def count_by_user(
        self,
        user_id: str,
        status: Optional[str] = None
    ) -> int:
        """
        Count invoices for a user.
        
        Args:
            user_id: User ID
            status: Filter by status
            
        Returns:
            Number of invoices
        """
        filter_query = {"user_id": user_id}
        if status:
            filter_query["status"] = status
        
        return await self.count(filter_query)
    
    async def count_by_user_and_date(
        self,
        user_id: str,
        issued_date: date
    ) -> int:
        """
        Count invoices for a user on a specific date.
        
        Args:
            user_id: User ID
            issued_date: Date to filter by
            
        Returns:
            Number of invoices issued on that date
        """
        from datetime import datetime as dt_module
        
        # Convert date to datetime range for the entire day
        start_of_day = dt_module.combine(issued_date, dt_module.min.time())
        end_of_day = dt_module.combine(issued_date, dt_module.max.time())
        
        filter_query = {
            "user_id": user_id,
            "issued_date": {
                "$gte": start_of_day,
                "$lte": end_of_day
            }
        }
        
        return await self.count(filter_query)
    
    async def number_exists(
        self,
        user_id: str,
        number: str,
        exclude_id: Optional[str] = None
    ) -> bool:
        """
        Check if invoice number exists for a user.
        
        Args:
            user_id: User ID
            number: Invoice number to check
            exclude_id: Optional invoice ID to exclude (for updates)
            
        Returns:
            True if number exists, False otherwise
        """
        filter_query = {
            "user_id": user_id,
            "number": number
        }
        
        if exclude_id:
            filter_query["_id"] = {"$ne": self._to_object_id(exclude_id)}
        
        return await self.exists(filter_query)
