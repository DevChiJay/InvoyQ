"""
Expense schemas for MongoDB-based expense tracking.
Handles business expense management with categories and date filtering.
"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from decimal import Decimal


class ExpenseBase(BaseModel):
    """Base expense schema with common fields"""
    category: str = Field(..., min_length=1, max_length=100, description="Expense category (e.g., office, travel, utilities)")
    description: str = Field(..., min_length=1, max_length=500, description="Expense description")
    amount: Decimal = Field(..., gt=0, description="Expense amount")
    currency: str = Field(default="NGN", min_length=3, max_length=3, description="ISO 4217 currency code")
    vendor: Optional[str] = Field(None, max_length=255, description="Vendor/supplier name")
    date: date = Field(..., description="Date of expense")
    receipt_url: Optional[str] = Field(None, max_length=500, description="URL to receipt image/document")
    tags: list[str] = Field(default_factory=list, description="Tags for categorization")

    @field_validator('currency')
    @classmethod
    def validate_currency(cls, v: str) -> str:
        """Ensure currency is uppercase ISO 4217 code"""
        return v.upper()

    @field_validator('category')
    @classmethod
    def validate_category(cls, v: str) -> str:
        """Trim and lowercase category"""
        v = v.strip().lower()
        if not v:
            raise ValueError('Category cannot be empty')
        return v

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        """Trim, lowercase, and deduplicate tags"""
        if v:
            # Remove empty strings, trim, lowercase, and deduplicate
            cleaned = list(set(tag.strip().lower() for tag in v if tag and tag.strip()))
            return cleaned
        return []


class ExpenseCreate(ExpenseBase):
    """Schema for creating a new expense"""
    pass


class ExpenseUpdate(BaseModel):
    """Schema for updating an existing expense (all fields optional)"""
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    amount: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    vendor: Optional[str] = Field(None, max_length=255)
    date: Optional[date] = None
    receipt_url: Optional[str] = Field(None, max_length=500)
    tags: Optional[list[str]] = None

    @field_validator('currency')
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        """Ensure currency is uppercase ISO 4217 code"""
        return v.upper() if v else v

    @field_validator('category')
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        """Trim and lowercase category"""
        if v is not None:
            v = v.strip().lower()
            if not v:
                raise ValueError('Category cannot be empty')
        return v

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        """Trim, lowercase, and deduplicate tags"""
        if v is not None:
            cleaned = list(set(tag.strip().lower() for tag in v if tag and tag.strip()))
            return cleaned
        return v


class ExpenseOut(ExpenseBase):
    """Schema for expense output (API responses)"""
    id: str = Field(..., description="Expense ID (MongoDB ObjectId as string)")
    user_id: str = Field(..., description="Owner user ID")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: str,  # Serialize Decimal as string to avoid precision loss
        }


class ExpenseInDB(ExpenseOut):
    """
    Internal schema for expense as stored in MongoDB.
    Includes _id field mapping.
    """
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True
        from_attributes = True
        json_encoders = {
            Decimal: str,
        }


class ExpenseListResponse(BaseModel):
    """Paginated list response for expenses"""
    items: list[ExpenseOut]
    total: int
    limit: int
    offset: int
    has_more: bool


class ExpenseSummary(BaseModel):
    """Expense summary grouped by category"""
    category: str
    total_amount: Decimal
    count: int
    currency: str

    class Config:
        json_encoders = {
            Decimal: str,
        }


class ExpenseSummaryResponse(BaseModel):
    """Response for expense summary endpoint"""
    summaries: list[ExpenseSummary]
    grand_total: Decimal
    period_start: Optional[date] = None
    period_end: Optional[date] = None

    class Config:
        json_encoders = {
            Decimal: str,
        }


# Common expense categories (for reference/autocomplete)
EXPENSE_CATEGORIES = [
    "office",
    "travel",
    "utilities",
    "software",
    "hardware",
    "supplies",
    "rent",
    "salaries",
    "marketing",
    "meals",
    "transportation",
    "professional_services",
    "insurance",
    "taxes",
    "maintenance",
    "other"
]
