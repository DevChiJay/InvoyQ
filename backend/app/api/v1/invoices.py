from typing import List, Optional
from decimal import Decimal, ROUND_HALF_UP
from datetime import date
import datetime as dt
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies.auth import get_current_user
from app.db.mongo import get_database
from app.repositories.user_repository import UserInDB
from app.repositories.client_repository import ClientRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.schemas.invoice_mongo import (
    InvoiceCreate, InvoiceOut, InvoiceUpdate, UserBusinessInfo
)


router = APIRouter()

TWO_PLACES = Decimal("0.01")


def _create_user_business_info(user: UserInDB) -> UserBusinessInfo:
    """Create user business info from user document."""
    return UserBusinessInfo(
        full_name=user.full_name,
        email=user.email,
        phone=getattr(user, 'phone', None),
        company_name=getattr(user, 'company_name', None),
        company_logo_url=getattr(user, 'company_logo_url', None),
        company_address=getattr(user, 'company_address', None),
        tax_id=getattr(user, 'tax_id', None),
        website=getattr(user, 'website', None),
    )


@router.get("/invoices", response_model=List[InvoiceOut])
async def list_invoices(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None),
    client_id: Optional[str] = Query(None),
    due_from: Optional[date] = Query(None),
    due_to: Optional[date] = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user),
):
    """
    List invoices for the authenticated user.
    
    Supports filtering by status, client, and due date range.
    Returns paginated results.
    """
    repo = InvoiceRepository(db)
    
    invoices = await repo.list_by_user(
        user_id=str(current_user.id),
        status=status,
        client_id=client_id,
        due_from=due_from,
        due_to=due_to,
        skip=offset,
        limit=limit
    )
    
    # Add user business info to each invoice
    result = []
    for invoice in invoices:
        invoice_out = InvoiceOut(**invoice.model_dump())
        invoice_out.user_business_info = _create_user_business_info(current_user)
        result.append(invoice_out)
    
    return result


@router.post("/invoices", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    payload: InvoiceCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Create a new invoice.
    
    - Validates client ownership
    - Auto-generates invoice number if not provided
    - Supports both manual items and product-based items
    """
    client_repo = ClientRepository(db)
    invoice_repo = InvoiceRepository(db)
    
    # Ensure client belongs to current user
    client = await client_repo.get_by_id_and_user(
        client_id=payload.client_id,
        user_id=str(current_user.id)
    )
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Generate invoice number if not provided
    number = payload.number
    if not number:
        today = dt.date.today()
        # Count existing invoices issued today for sequence
        count_today = await invoice_repo.count_by_user_and_date(
            user_id=str(current_user.id),
            issued_date=today
        )
        number = f"INV-{today:%Y%m%d}-{count_today + 1:03d}"
    
    # Check for existing invoice with same number
    existing_invoice = await invoice_repo.get_by_number(
        user_id=str(current_user.id),
        number=number
    )
    if existing_invoice:
        raise HTTPException(
            status_code=400,
            detail=f"Invoice number '{number}' already exists. Please use a different number."
        )
    
    # Create invoice with auto-generated number
    payload.number = number
    invoice = await invoice_repo.create_invoice(
        user_id=str(current_user.id),
        client_id=payload.client_id,
        invoice_data=payload
    )
    
    # Add user business info
    invoice_out = InvoiceOut(**invoice.model_dump())
    invoice_out.user_business_info = _create_user_business_info(current_user)
    
    return invoice_out


@router.get("/invoices/{invoice_id}", response_model=InvoiceOut)
async def get_invoice(
    invoice_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get a single invoice by ID.
    
    Returns 404 if invoice doesn't exist or doesn't belong to the user.
    """
    repo = InvoiceRepository(db)
    
    invoice = await repo.get_by_id_and_user(
        invoice_id=invoice_id,
        user_id=str(current_user.id)
    )
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Add user business info
    invoice_out = InvoiceOut(**invoice.model_dump())
    invoice_out.user_business_info = _create_user_business_info(current_user)
    
    return invoice_out


@router.put("/invoices/{invoice_id}", response_model=InvoiceOut)
async def update_invoice(
    invoice_id: str,
    payload: InvoiceUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Update an existing invoice.
    
    Only fields provided in the request will be updated.
    Returns 404 if invoice doesn't exist or doesn't belong to the user.
    """
    repo = InvoiceRepository(db)
    
    # Check if invoice exists and belongs to user
    existing_invoice = await repo.get_by_id_and_user(
        invoice_id=invoice_id,
        user_id=str(current_user.id)
    )
    
    if not existing_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Update invoice
    invoice = await repo.update_invoice(
        invoice_id=invoice_id,
        user_id=str(current_user.id),
        invoice_data=payload
    )
    
    # Add user business info
    invoice_out = InvoiceOut(**invoice.model_dump())
    invoice_out.user_business_info = _create_user_business_info(current_user)
    
    return invoice_out


@router.delete("/invoices/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(
    invoice_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Delete an invoice.
    
    Returns 404 if invoice doesn't exist or doesn't belong to the user.
    """
    repo = InvoiceRepository(db)
    
    deleted = await repo.delete_invoice(
        invoice_id=invoice_id,
        user_id=str(current_user.id)
    )
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return None
