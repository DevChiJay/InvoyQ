import secrets
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordBearer
from jose import jwt, JWTError
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import settings
from app.db.mongo import get_database
from app.repositories.user_repository import UserRepository, UserInDB

reuse_oauth2 = OAuth2PasswordBearer(tokenUrl="/v1/auth/login")
stats_bearer = HTTPBearer(auto_error=False, scheme_name="StatsToken")


async def require_stats_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(stats_bearer),
) -> None:
    """Gate for machine-polled stats: `Authorization: Bearer <STATS_API_TOKEN>`. Fails closed if unset."""
    expected = settings.STATS_API_TOKEN
    if not expected:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stats API token not configured")
    if credentials is None or not secrets.compare_digest(credentials.credentials.encode(), expected.encode()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing stats token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    db: AsyncIOMotorDatabase = Depends(get_database),
    token: str = Depends(reuse_oauth2)
) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if user is None:
        raise credentials_exception
    return user


async def get_current_admin_user(
    current_user: UserInDB = Depends(get_current_user)
) -> UserInDB:
    """
    Verify the current user has admin privileges.
    
    Raises 403 Forbidden if user is not an admin.
    """
    if not getattr(current_user, 'is_admin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
