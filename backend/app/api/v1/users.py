from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.dependencies.auth import get_current_user
from app.schemas.user import UserOut, UserRead, UserUpdate
from app.repositories.user_repository import UserRepository, UserInDB
from app.db.mongo import get_database
from app.services.storage import save_bytes
import uuid
from pathlib import Path

router = APIRouter()

@router.get("/me", response_model=UserRead)
async def read_me(current_user: UserInDB = Depends(get_current_user)):
    """Get current authenticated user details"""
    return current_user

@router.patch("/me", response_model=UserRead)
async def update_me(
    user_update: UserUpdate,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update current user's profile and business details"""
    user_repo = UserRepository(db)
    
    # Update only the fields that were provided
    update_data = user_update.model_dump(exclude_unset=True)
    
    updated_user = await user_repo.update(current_user.id, update_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return updated_user

@router.post("/upload-avatar", response_model=dict)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Upload user avatar image"""
    user_repo = UserRepository(db)
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB")
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}{file_extension}"
    
    # Save file
    abs_path, public_url = save_bytes(unique_filename, contents)
    
    # Update user avatar URL
    await user_repo.update(current_user.id, {"avatar_url": public_url})
    
    return {"url": public_url, "message": "Avatar uploaded successfully"}

@router.post("/upload-logo", response_model=dict)
async def upload_company_logo(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Upload company logo image"""
    user_repo = UserRepository(db)
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/svg+xml"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB")
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"logo_{current_user.id}_{uuid.uuid4().hex[:8]}{file_extension}"
    
    # Save file
    abs_path, public_url = save_bytes(unique_filename, contents)
    
    # Update user company logo URL
    await user_repo.update(current_user.id, {"company_logo_url": public_url})
    
    return {"url": public_url, "message": "Company logo uploaded successfully"}
