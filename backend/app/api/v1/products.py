"""
Products API endpoints.

Handles product catalog CRUD operations including:
- Product creation with SKU management
- Product listing with search and filters
- Stock quantity adjustments
- Soft delete (deactivation)
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_database
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.product_repository import ProductRepository
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductOut,
    ProductQuantityAdjustment,
    ProductListResponse
)
from app.utils.pagination import paginate_query, build_pagination_metadata


router = APIRouter()


@router.post(
    "",
    response_model=ProductOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product"
)
async def create_product(
    product_data: ProductCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new product in the catalog.
    
    - **sku**: Unique stock keeping unit (unique per user)
    - **name**: Product name
    - **description**: Optional product description
    - **unit_price**: Price per unit
    - **tax_rate**: Tax rate as percentage (e.g., 7.5 for 7.5%)
    - **currency**: ISO 4217 currency code (default: NGN)
    - **quantity_available**: Initial stock quantity (default: 0)
    - **is_active**: Whether product is active (default: true)
    
    Returns the created product with generated ID.
    """
    repo = ProductRepository(db)
    
    try:
        product = await repo.create_product(
            user_id=str(current_user.id),
            product_data=product_data
        )
        return product
    except ValueError as e:
        # SKU already exists
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "",
    response_model=ProductListResponse,
    summary="List products"
)
async def list_products(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search in name, description, or SKU"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records to return"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: int = Query(-1, description="Sort order: 1=asc, -1=desc"),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    """
    List all products for the authenticated user.
    
    Supports:
    - Filtering by active status
    - Search across name, description, and SKU
    - Pagination with skip/limit
    - Sorting by any field
    
    Returns paginated list with metadata.
    """
    repo = ProductRepository(db)
    
    products = await repo.list_by_user(
        user_id=str(current_user.id),
        is_active=is_active,
        search=search,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Count total for pagination metadata
    total = await repo.count_by_user(
        user_id=str(current_user.id),
        is_active=is_active
    )
    
    return ProductListResponse(
        items=products,
        total=total,
        limit=limit,
        offset=skip,
        has_more=(skip + len(products)) < total
    )


@router.get(
    "/{product_id}",
    response_model=ProductOut,
    summary="Get product details"
)
async def get_product(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    """
    Get a single product by ID.
    
    Returns 404 if product doesn't exist or doesn't belong to the user.
    """
    repo = ProductRepository(db)
    
    product = await repo.get_by_id_and_user(
        product_id=product_id,
        user_id=str(current_user.id)
    )
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return product


@router.put(
    "/{product_id}",
    response_model=ProductOut,
    summary="Update product"
)
async def update_product(
    product_id: str,
    product_data: ProductUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing product.
    
    All fields are optional - only provided fields will be updated.
    
    Returns 404 if product doesn't exist or doesn't belong to the user.
    Returns 400 if trying to update SKU to one that already exists.
    """
    repo = ProductRepository(db)
    
    try:
        product = await repo.update_product(
            product_id=product_id,
            user_id=str(current_user.id),
            update_data=product_data
        )
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        return product
    except ValueError as e:
        # SKU conflict
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete product (soft delete)"
)
async def delete_product(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    """
    Soft delete a product by setting is_active to false.
    
    The product is not removed from the database to preserve
    historical references in invoices.
    
    Returns 404 if product doesn't exist or doesn't belong to the user.
    """
    repo = ProductRepository(db)
    
    deleted = await repo.soft_delete(
        product_id=product_id,
        user_id=str(current_user.id)
    )
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return None


@router.patch(
    "/{product_id}/adjust-quantity",
    response_model=ProductOut,
    summary="Adjust product stock quantity"
)
async def adjust_product_quantity(
    product_id: str,
    adjustment_data: ProductQuantityAdjustment,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    """
    Adjust product quantity by a positive or negative amount.
    
    - **adjustment**: Quantity to add (positive) or subtract (negative)
    
    Examples:
    - `{"adjustment": 10}` - Add 10 units to stock
    - `{"adjustment": -5}` - Remove 5 units from stock
    
    Returns 404 if product doesn't exist or doesn't belong to the user.
    Returns 400 if adjustment would result in negative quantity.
    """
    repo = ProductRepository(db)
    
    try:
        product = await repo.adjust_quantity(
            product_id=product_id,
            user_id=str(current_user.id),
            adjustment=adjustment_data.adjustment
        )
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        return product
    except ValueError as e:
        # Insufficient quantity
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
