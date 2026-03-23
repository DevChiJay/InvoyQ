"""
Admin user management endpoints.

Provides functionality for admins to list, view, update,
and deactivate users.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr

from app.dependencies.auth import get_current_admin_user
from app.db.mongo import get_database
from app.repositories.user_repository import UserRepository, UserInDB
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.client_repository import ClientRepository
from app.schemas.invoice_mongo import InvoiceOut

router = APIRouter()


# Response schemas for admin endpoints
class AdminUserOut(BaseModel):
    """User data returned by admin endpoints."""
    id: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_pro: bool
    is_admin: bool = False
    avatar_url: Optional[str] = None
    registration_source: Optional[str] = None
    created_at: str
    updated_at: str
    
    # Subscription info
    subscription_status: Optional[str] = None
    subscription_provider: Optional[str] = None
    
    # Business info
    company_name: Optional[str] = None
    phone: Optional[str] = None
    
    # Stats
    invoice_count: int = 0

    class Config:
        from_attributes = True


class AdminUserListResponse(BaseModel):
    """Paginated list of users."""
    items: List[AdminUserOut]
    total: int
    limit: int
    offset: int
    has_more: bool


class AdminUserUpdate(BaseModel):
    """Request body for updating a user."""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    is_pro: Optional[bool] = None


class AdminUserInvoiceOut(BaseModel):
    """Invoice data for admin user invoices endpoint."""
    id: str
    number: str
    status: str
    currency: str
    subtotal: str
    tax: str
    total: str
    issued_date: str
    due_date: str
    client_name: Optional[str] = None
    created_at: str


class AdminUserInvoicesResponse(BaseModel):
    """Response for user invoices list."""
    user_id: str
    user_email: str
    user_name: Optional[str] = None
    items: List[AdminUserInvoiceOut]
    total: int
    limit: int
    offset: int
    has_more: bool


def _user_to_admin_out(user: UserInDB, invoice_count: int = 0) -> AdminUserOut:
    """Convert UserInDB to AdminUserOut."""
    return AdminUserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_pro=user.is_pro,
        is_admin=getattr(user, 'is_admin', False),
        avatar_url=user.avatar_url,
        registration_source=user.registration_source,
        created_at=user.created_at.isoformat() if user.created_at else "",
        updated_at=user.updated_at.isoformat() if user.updated_at else "",
        subscription_status=user.subscription_status,
        subscription_provider=user.subscription_provider,
        company_name=user.company_name,
        phone=user.phone,
        invoice_count=invoice_count
    )


@router.get("", response_model=AdminUserListResponse)
async def list_users(
    search: Optional[str] = Query(None, description="Search by email or name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_pro: Optional[bool] = Query(None, description="Filter by pro status"),
    registration_source: Optional[str] = Query(None, description="Filter by source: web or mobile"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: int = Query(-1, description="Sort order: 1=asc, -1=desc"),
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: UserInDB = Depends(get_current_admin_user),
):
    """
    List all users with optional filtering and pagination.
    
    Admin only endpoint.
    """
    user_repo = UserRepository(db)
    invoice_repo = InvoiceRepository(db)
    
    users, total = await user_repo.list_users(
        search=search,
        is_active=is_active,
        is_pro=is_pro,
        registration_source=registration_source,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Get invoice counts for each user
    user_items = []
    for u in users:
        invoice_count = await invoice_repo.count_by_user(user_id=u.id)
        user_items.append(_user_to_admin_out(u, invoice_count=invoice_count))
    
    return AdminUserListResponse(
        items=user_items,
        total=total,
        limit=limit,
        offset=skip,
        has_more=(skip + len(users)) < total
    )


@router.get("/{user_id}", response_model=AdminUserOut)
async def get_user(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: UserInDB = Depends(get_current_admin_user),
):
    """
    Get a single user by ID.
    
    Admin only endpoint.
    """
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return _user_to_admin_out(user)


@router.patch("/{user_id}", response_model=AdminUserOut)
async def update_user(
    user_id: str,
    update_data: AdminUserUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: UserInDB = Depends(get_current_admin_user),
):
    """
    Update a user's information.
    
    Admin only endpoint. Can update:
    - full_name
    - email
    - is_active (activate/deactivate)
    - is_pro (toggle pro status)
    """
    user_repo = UserRepository(db)
    
    # Check user exists
    existing_user = await user_repo.get_by_id(user_id)
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check email uniqueness if changing email
    if update_data.email and update_data.email != existing_user.email:
        email_exists = await user_repo.email_exists(update_data.email)
        if email_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
    
    # Update user
    updated_user = await user_repo.admin_update_user(
        user_id=user_id,
        is_active=update_data.is_active,
        is_pro=update_data.is_pro,
        full_name=update_data.full_name,
        email=update_data.email
    )
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )
    
    return _user_to_admin_out(updated_user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: UserInDB = Depends(get_current_admin_user),
):
    """
    Soft delete a user (sets is_active=False).
    
    Admin only endpoint.
    """
    user_repo = UserRepository(db)
    
    # Check user exists
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent self-deletion
    if user_id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    success = await user_repo.deactivate_user(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )
    
    return None


@router.get("/{user_id}/invoices", response_model=AdminUserInvoicesResponse)
async def get_user_invoices(
    user_id: str,
    status: Optional[str] = Query(None, description="Filter by invoice status"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: int = Query(-1, description="Sort order: 1=asc, -1=desc"),
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: UserInDB = Depends(get_current_admin_user),
):
    """
    List all invoices for a specific user.
    
    Admin only endpoint.
    """
    user_repo = UserRepository(db)
    invoice_repo = InvoiceRepository(db)
    client_repo = ClientRepository(db)
    
    # Get user
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get invoices
    invoices = await invoice_repo.list_by_user(
        user_id=user_id,
        status=status,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Get total count
    total = await invoice_repo.count_by_user(user_id=user_id, status=status)
    
    # Build response with client names
    items = []
    for inv in invoices:
        client_name = None
        if inv.client_id:
            client = await client_repo.get_by_id(inv.client_id)
            if client:
                client_name = client.name
        
        items.append(AdminUserInvoiceOut(
            id=inv.id,
            number=inv.number,
            status=inv.status,
            currency=inv.currency,
            subtotal=str(inv.subtotal),
            tax=str(inv.tax),
            total=str(inv.total),
            issued_date=inv.issued_date.isoformat() if inv.issued_date else "",
            due_date=inv.due_date.isoformat() if inv.due_date else "",
            client_name=client_name,
            created_at=inv.created_at.isoformat() if inv.created_at else ""
        ))
    
    return AdminUserInvoicesResponse(
        user_id=user_id,
        user_email=user.email,
        user_name=user.full_name,
        items=items,
        total=total,
        limit=limit,
        offset=skip,
        has_more=(skip + len(items)) < total
    )
