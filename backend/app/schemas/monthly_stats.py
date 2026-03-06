"""
Monthly statistics schemas for aggregated data views.
Provides monthly breakdowns of revenue, expenses, invoices, and products.
"""
from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field
from decimal import Decimal


class TopProduct(BaseModel):
    """Top selling product in a month"""
    product_id: Optional[str] = Field(None, description="Product ID (null for custom items)")
    name: str = Field(..., description="Product name or custom item description")
    quantity_sold: int = Field(..., description="Total quantity sold in month")
    
    class Config:
        json_encoders = {
            Decimal: str,
        }


class MonthlyStats(BaseModel):
    """Aggregated statistics for a specific month"""
    month: int = Field(..., ge=1, le=12, description="Month number (1-12)")
    year: int = Field(..., description="Year")
    currency: str = Field(default="NGN", description="Currency for monetary values")
    
    # Financial metrics
    total_revenue: Decimal = Field(default=Decimal("0.00"), description="Total revenue from paid invoices")
    total_expenses: Decimal = Field(default=Decimal("0.00"), description="Total expenses in month")
    net_income: Decimal = Field(default=Decimal("0.00"), description="Revenue minus expenses")
    
    # Invoice metrics
    total_invoices: int = Field(default=0, description="Total number of invoices in month")
    paid_invoices: int = Field(default=0, description="Number of paid invoices")
    unpaid_invoices: int = Field(default=0, description="Number of draft/sent/overdue invoices")
    
    # Product metrics
    total_products_sold: int = Field(default=0, description="Total quantity of products sold")
    top_products: List[TopProduct] = Field(default_factory=list, description="Top 5 best-selling products")
    
    # Client metrics
    new_clients: int = Field(default=0, description="Number of new clients added this month")
    
    # Date range
    period_start: date = Field(..., description="Start date of month period")
    period_end: date = Field(..., description="End date of month period")
    
    class Config:
        json_encoders = {
            Decimal: str,
            date: lambda v: v.isoformat(),
        }


class MonthlyStatsResponse(BaseModel):
    """Response wrapper for monthly statistics"""
    stats: MonthlyStats
    
    class Config:
        json_encoders = {
            Decimal: str,
            date: lambda v: v.isoformat(),
        }
