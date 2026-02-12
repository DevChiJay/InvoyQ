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
from app.repositories.product_repository import ProductRepository
from app.schemas.invoice_mongo import (
    InvoiceCreate, InvoiceOut, InvoiceUpdate, UserBusinessInfo,
    InvoiceStatsResponse
)
from app.services.email import email_service
from pydantic import BaseModel


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
    skip: int = Query(0, ge=0),
    status: Optional[str] = Query(None),
    client_id: Optional[str] = Query(None),
    due_from: Optional[date] = Query(None),
    due_to: Optional[date] = Query(None),
    search: Optional[str] = Query(None, description="Search by invoice number or client name"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: int = Query(-1, description="Sort order: 1=asc, -1=desc"),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user),
):
    """
    List invoices for the authenticated user.
    
    Supports filtering by status, client, and due date range.
    Supports search by invoice number or client name.
    Returns paginated results with sorting.
    """
    repo = InvoiceRepository(db)
    client_repo = ClientRepository(db)
    
    invoices = await repo.list_by_user(
        user_id=str(current_user.id),
        status=status,
        client_id=client_id,
        due_from=due_from,
        due_to=due_to,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Add user business info and client data to each invoice
    result = []
    for invoice in invoices:
        # Get client data
        client = await client_repo.get_by_id_and_user(
            client_id=invoice.client_id,
            user_id=str(current_user.id)
        )
        
        invoice_out = InvoiceOut(**invoice.model_dump())
        invoice_out.user_business_info = _create_user_business_info(current_user)
        invoice_out.client = client.model_dump() if client else None
        
        # Apply search filter if provided
        if search:
            search_lower = search.lower()
            matches_number = invoice.number and search_lower in invoice.number.lower()
            matches_client = client and search_lower in client.name.lower()
            if not (matches_number or matches_client):
                continue
        
        result.append(invoice_out)
    
    return result


@router.get("/invoices/stats", response_model=InvoiceStatsResponse)
async def get_invoice_stats(
    date_from: Optional[date] = Query(None, description="Filter from this date"),
    date_to: Optional[date] = Query(None, description="Filter to this date"),
    currency: Optional[str] = Query(None, description="Filter by currency (default: aggregate all)"),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Get invoice statistics for the authenticated user.
    
    Returns aggregated statistics including:
    - Total revenue across all invoices
    - Amount and count by status (paid, pending, draft, overdue, cancelled)
    - Optional filtering by date range and currency
    
    This endpoint is optimized for dashboard metrics and doesn't require
    fetching all invoices. Perfect for showing accurate business stats.
    
    Query parameters (optional, reserved for premium features):
    - date_from: Start date for filtering invoices by issued_date
    - date_to: End date for filtering invoices by issued_date
    - currency: Filter by specific currency code
    """
    repo = InvoiceRepository(db)
    
    # Get aggregated stats
    stats = await repo.get_stats(
        user_id=str(current_user.id),
        date_from=date_from,
        date_to=date_to,
        currency=currency
    )
    
    return InvoiceStatsResponse(
        stats=stats,
        date_from=date_from,
        date_to=date_to
    )


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
    
    # Reduce product quantities if product_items are provided
    if payload.product_items:
        product_repo = ProductRepository(db)
        for product_item in payload.product_items:
            try:
                # Adjust quantity (negative to reduce)
                quantity_to_reduce = -int(Decimal(product_item.quantity))
                await product_repo.adjust_quantity(
                    product_id=product_item.product_id,
                    user_id=str(current_user.id),
                    adjustment=quantity_to_reduce
                )
            except ValueError as e:
                # If insufficient quantity, log warning but don't fail invoice creation
                # The invoice is already created, so we just warn about inventory issue
                print(f"Warning: Could not reduce quantity for product {product_item.product_id}: {str(e)}")
            except Exception as e:
                # Log any other errors but continue
                print(f"Error adjusting product quantity: {str(e)}")
    
    # Add user business info and client data
    invoice_out = InvoiceOut(**invoice.model_dump())
    invoice_out.user_business_info = _create_user_business_info(current_user)
    invoice_out.client = client.model_dump() if client else None
    
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
    client_repo = ClientRepository(db)
    
    invoice = await repo.get_by_id_and_user(
        invoice_id=invoice_id,
        user_id=str(current_user.id)
    )
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Get client data
    client = await client_repo.get_by_id_and_user(
        client_id=invoice.client_id,
        user_id=str(current_user.id)
    )
    
    # Add user business info and client
    invoice_out = InvoiceOut(**invoice.model_dump())
    invoice_out.user_business_info = _create_user_business_info(current_user)
    invoice_out.client = client.model_dump() if client else None
    
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
    client_repo = ClientRepository(db)
    
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
    
    # Get client data
    client = await client_repo.get_by_id_and_user(
        client_id=invoice.client_id,
        user_id=str(current_user.id)
    )
    
    # Add user business info and client
    invoice_out = InvoiceOut(**invoice.model_dump())
    invoice_out.user_business_info = _create_user_business_info(current_user)
    invoice_out.client = client.model_dump() if client else None
    
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


class SendInvoiceRequest(BaseModel):
    """Request body for sending invoice via email"""
    email: Optional[str] = None


@router.post("/invoices/{invoice_id}/send")
async def send_invoice_email(
    invoice_id: str,
    request: SendInvoiceRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Send invoice via email to client.
    
    If email is not provided, uses the client's email from the invoice.
    Updates invoice status to 'sent' if currently 'draft'.
    """
    repo = InvoiceRepository(db)
    client_repo = ClientRepository(db)
    
    # Get invoice
    invoice = await repo.get_by_id_and_user(
        invoice_id=invoice_id,
        user_id=str(current_user.id)
    )
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Get client to get email
    client = await client_repo.get_by_id_and_user(
        client_id=invoice.client_id,
        user_id=str(current_user.id)
    )
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Determine recipient email
    recipient_email = request.email or client.email
    
    if not recipient_email:
        raise HTTPException(
            status_code=400,
            detail="Client email not found. Please provide an email address."
        )
    
    # Update status to sent if it's draft
    if invoice.status == "draft":
        await repo.update_invoice(
            invoice_id=invoice_id,
            user_id=str(current_user.id),
            invoice_data=InvoiceUpdate(status="sent")
        )
    
    # Send email
    try:
        await email_service.send_invoice_email(
            to_email=recipient_email,
            client_name=client.name,
            invoice_number=invoice.number or "Draft",
            invoice_total=str(invoice.total),
            currency=invoice.currency,
            due_date=invoice.due_date.strftime("%B %d, %Y") if invoice.due_date else "Not specified",
            user_name=current_user.full_name or "InvoYQ User",
            company_name=getattr(current_user, 'company_name', None)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email: {str(e)}"
        )
    
    return {"message": f"Invoice sent successfully to {recipient_email}"}
