"""
Enhanced invoice schemas for MongoDB with events tracking and product integration.
Extends existing invoice functionality with product references and audit trail.
"""
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from decimal import Decimal


class UserBusinessInfo(BaseModel):
    """Subset of user business details for invoice display"""
    full_name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    company_address: Optional[str] = None
    tax_id: Optional[str] = None
    website: Optional[str] = None
    
    class Config:
        from_attributes = True


class InvoiceItemBase(BaseModel):
    """Base invoice item schema"""
    description: str = Field(..., min_length=1, max_length=500)
    quantity: Decimal = Field(default=Decimal("1.00"), gt=0)
    unit_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    tax_rate: Decimal = Field(default=Decimal("0.00"), ge=0, le=100, description="Tax rate as percentage")
    amount: Optional[Decimal] = Field(None, ge=0, description="Line total (auto-calculated if not provided)")


class InvoiceItemCreate(InvoiceItemBase):
    """Schema for creating invoice items manually"""
    pass


class InvoiceItemWithProduct(BaseModel):
    """
    Invoice item as stored in MongoDB (includes optional product reference).
    Used internally after product resolution.
    """
    product_id: Optional[str] = Field(None, description="Reference to product._id if item from product catalog")
    description: str
    quantity: Decimal
    unit_price: Decimal
    tax_rate: Decimal
    amount: Decimal


class InvoiceItemOut(BaseModel):
    """Schema for invoice item output"""
    product_id: Optional[str] = None
    description: str
    quantity: Decimal
    unit_price: Decimal
    tax_rate: Decimal = Decimal("0.00")
    amount: Decimal

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: str,
        }


class InvoiceEvent(BaseModel):
    """
    Invoice event for audit trail.
    Tracks status changes, sends, payments, etc.
    """
    action: str = Field(..., description="Event action: created, sent, paid, status_changed, updated, deleted")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: dict = Field(default_factory=dict, description="Additional event details (e.g., old_status, new_status)")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class ProductItemReference(BaseModel):
    """
    Product reference for invoice creation.
    Used in InvoiceCreate to specify products to add.
    """
    product_id: str = Field(..., description="Product ID to include in invoice")
    quantity: Decimal = Field(..., gt=0, description="Quantity of product")


class InvoiceBase(BaseModel):
    """Base invoice schema"""
    client_id: str = Field(..., description="Client ID (MongoDB ObjectId as string)")
    number: Optional[str] = Field(None, max_length=100, description="Invoice number (auto-generated if not provided)")
    status: str = Field(default="draft", description="Invoice status: draft, sent, paid, overdue, cancelled")
    issued_date: Optional[date] = None
    due_date: Optional[date] = None
    currency: str = Field(default="NGN", min_length=3, max_length=3, description="ISO 4217 currency code")
    subtotal: Optional[Decimal] = Field(None, ge=0)
    tax: Optional[Decimal] = Field(None, ge=0)
    total: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=1000)
    pdf_url: Optional[str] = Field(None, max_length=500)
    payment_link: Optional[str] = Field(None, max_length=500, description="Optional user-provided payment link")


class InvoiceCreate(InvoiceBase):
    """
    Schema for creating a new invoice.
    Supports both manual items and product-based items.
    """
    items: Optional[List[InvoiceItemCreate]] = Field(None, description="Manual invoice items")
    product_items: Optional[List[ProductItemReference]] = Field(None, description="Products to add from catalog")


class InvoiceUpdate(BaseModel):
    """Schema for updating an existing invoice (all fields optional)"""
    client_id: Optional[str] = None
    number: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = None
    issued_date: Optional[date] = None
    due_date: Optional[date] = None
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    subtotal: Optional[Decimal] = Field(None, ge=0)
    tax: Optional[Decimal] = Field(None, ge=0)
    total: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=1000)
    pdf_url: Optional[str] = Field(None, max_length=500)
    payment_link: Optional[str] = Field(None, max_length=500)
    items: Optional[List[InvoiceItemCreate]] = Field(None, description="Replace all items if provided")


class InvoiceOut(InvoiceBase):
    """Schema for invoice output (API responses)"""
    id: str = Field(..., description="Invoice ID (MongoDB ObjectId as string)")
    user_id: str = Field(..., description="Owner user ID")
    items: List[InvoiceItemOut] = Field(default_factory=list)
    events: List[InvoiceEvent] = Field(default_factory=list, description="Invoice event history")
    user_business_info: Optional[UserBusinessInfo] = Field(None, description="Business details for invoice display")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: str,
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
        }


class InvoiceInDB(BaseModel):
    """
    Internal schema for invoice as stored in MongoDB.
    Includes _id field mapping and embedded items/events.
    """
    id: str = Field(alias="_id")
    user_id: str
    client_id: str
    number: str
    status: str
    issued_date: Optional[date] = None
    due_date: Optional[date] = None
    currency: str
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    notes: Optional[str] = None
    pdf_url: Optional[str] = None
    payment_link: Optional[str] = None
    items: List[InvoiceItemWithProduct] = Field(default_factory=list)
    events: List[InvoiceEvent] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        from_attributes = True
        json_encoders = {
            Decimal: str,
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
        }


class InvoiceListResponse(BaseModel):
    """Paginated list response for invoices"""
    items: List[InvoiceOut]
    total: int
    limit: int
    offset: int
    has_more: bool


# Invoice status constants
INVOICE_STATUS_DRAFT = "draft"
INVOICE_STATUS_SENT = "sent"
INVOICE_STATUS_PAID = "paid"
INVOICE_STATUS_OVERDUE = "overdue"
INVOICE_STATUS_CANCELLED = "cancelled"

INVOICE_STATUSES = [
    INVOICE_STATUS_DRAFT,
    INVOICE_STATUS_SENT,
    INVOICE_STATUS_PAID,
    INVOICE_STATUS_OVERDUE,
    INVOICE_STATUS_CANCELLED,
]

# Event action constants
EVENT_CREATED = "created"
EVENT_SENT = "sent"
EVENT_PAID = "paid"
EVENT_STATUS_CHANGED = "status_changed"
EVENT_UPDATED = "updated"
EVENT_DELETED = "deleted"
