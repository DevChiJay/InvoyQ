from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

from app.dependencies.auth import get_current_user
from app.db.mongo import get_database
from app.repositories.user_repository import UserInDB
from app.repositories.client_repository import ClientRepository
from app.schemas.client import ClientCreate, ClientOut, ClientUpdate, ClientStatsResponse


router = APIRouter()


@router.get("/clients", response_model=List[ClientOut])
async def list_clients(
    limit: int = 50,
    skip: int = 0,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user),
):
    client_repo = ClientRepository(db)
    
    if limit <= 0:
        limit = 50
    limit = min(limit, 100)
    if skip < 0:
        skip = 0
    
    clients = await client_repo.list_by_user(
        user_id=current_user.id,
        limit=limit,
        skip=skip
    )
    return clients


@router.get("/clients/stats", response_model=ClientStatsResponse)
async def get_client_stats(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Get client statistics for the authenticated user.
    
    Returns aggregated statistics including total client count.
    This endpoint is optimized for dashboard metrics.
    """
    client_repo = ClientRepository(db)
    
    stats = await client_repo.get_stats(user_id=current_user.id)
    
    return ClientStatsResponse(stats=stats)


@router.post("/clients", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
async def create_client(
    payload: ClientCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    client_repo = ClientRepository(db)
    client = await client_repo.create_client(
        user_id=current_user.id,
        client_data=payload
    )
    return client


@router.get("/clients/{client_id}", response_model=ClientOut)
async def get_client(
    client_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    client_repo = ClientRepository(db)
    client = await client_repo.get_by_id_and_user(client_id, current_user.id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.put("/clients/{client_id}", response_model=ClientOut)
async def update_client(
    client_id: str,
    payload: ClientUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    client_repo = ClientRepository(db)
    
    # Verify ownership
    existing = await client_repo.get_by_id_and_user(client_id, current_user.id)
    if not existing:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Update client
    update_data = payload.model_dump(exclude_unset=True)
    updated_client = await client_repo.update_client(
        client_id=client_id,
        user_id=current_user.id,
        update_data=update_data
    )
    
    return updated_client


@router.delete("/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    client_repo = ClientRepository(db)
    
    # Verify ownership
    existing = await client_repo.get_by_id_and_user(client_id, current_user.id)
    if not existing:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Delete client
    await client_repo.delete(client_id)
    return None
