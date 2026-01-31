"""
Product schemas for MongoDB-based product catalog.
Handles product management with SKU tracking, pricing, and inventory.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from decimal import Decimal


class ProductBase(BaseModel):
    """Base product schema with common fields"""
    sku: str = Field(..., min_length=1, max_length=100, description="Stock Keeping Unit - unique per user")
    name: str = Field(..., min_length=1, max_length=255, description="Product name")
    description: Optional[str] = Field(None, max_length=1000, description="Product description")
    category: Optional[str] = Field(None, max_length=100, description="Product category (optional)")
    unit_price: Decimal = Field(..., ge=0, description="Price per unit")
    tax_rate: Decimal = Field(default=Decimal("0.00"), ge=0, le=100, description="Tax rate as percentage (e.g., 7.5 for 7.5%)")
    currency: str = Field(default="NGN", min_length=3, max_length=3, description="ISO 4217 currency code")
    quantity_available: int = Field(default=0, ge=0, description="Available stock quantity")
    is_active: bool = Field(default=True, description="Whether product is active and available for sale")

    @field_validator('currency')
    @classmethod
    def validate_currency(cls, v: str) -> str:
        """Ensure currency is uppercase ISO 4217 code"""
        return v.upper()

    @field_validator('sku')
    @classmethod
    def validate_sku(cls, v: str) -> str:
        """Trim and validate SKU"""
        v = v.strip()
        if not v:
            raise ValueError('SKU cannot be empty')
        return v


class ProductCreate(ProductBase):
    """Schema for creating a new product"""
    pass


class ProductUpdate(BaseModel):
    """Schema for updating an existing product (all fields optional)"""
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, max_length=100)
    unit_price: Optional[Decimal] = Field(None, ge=0)
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    quantity_available: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None

    @field_validator('currency')
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        """Ensure currency is uppercase ISO 4217 code"""
        return v.upper() if v else v

    @field_validator('sku')
    @classmethod
    def validate_sku(cls, v: Optional[str]) -> Optional[str]:
        """Trim and validate SKU"""
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError('SKU cannot be empty')
        return v


class ProductQuantityAdjustment(BaseModel):
    """Schema for adjusting product quantity (±)"""
    adjustment: int = Field(..., description="Quantity to add (positive) or subtract (negative)")
    
    @field_validator('adjustment')
    @classmethod
    def validate_adjustment(cls, v: int) -> int:
        """Ensure adjustment is not zero"""
        if v == 0:
            raise ValueError('Adjustment cannot be zero')
        return v


class ProductOut(ProductBase):
    """Schema for product output (API responses)"""
    id: str = Field(..., description="Product ID (MongoDB ObjectId as string)")
    user_id: str = Field(..., description="Owner user ID")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: str,  # Serialize Decimal as string to avoid precision loss
        }


class ProductInDB(ProductOut):
    """
    Internal schema for product as stored in MongoDB.
    Includes _id field mapping.
    """
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True
        from_attributes = True
        json_encoders = {
            Decimal: str,
        }


class ProductListResponse(BaseModel):
    """Paginated list response for products"""
    items: list[ProductOut]
    total: int
    limit: int
    offset: int
    has_more: bool


# Request models for invoice creation with products
class ProductItem(BaseModel):
    """Product reference in invoice creation"""
    product_id: str = Field(..., description="Product ID to include in invoice")
    quantity: Decimal = Field(..., gt=0, description="Quantity of product")

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v: Decimal) -> Decimal:
        """Ensure quantity is positive"""
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        return v
