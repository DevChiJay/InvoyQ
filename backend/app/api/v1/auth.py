from datetime import datetime, timedelta
from typing import Optional
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.db.mongo import get_database
from app.repositories.user_repository import UserRepository
from app.schemas.auth import Token
from app.schemas.user import UserCreate, UserOut, EmailVerificationResponse, ResendVerificationRequest
from app.core.security import verify_password, get_password_hash
from app.services.email import email_service

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def generate_verification_token() -> str:
    """Generate a secure random verification token"""
    return secrets.token_urlsafe(32)


async def send_verification_email(user_id: str, email: str, full_name: str, db: AsyncIOMotorDatabase) -> bool:
    """Generate verification token and send email to user"""
    user_repo = UserRepository(db)
    
    # Generate token and set expiry (24 hours)
    verification_token = generate_verification_token()
    verification_token_expires = datetime.utcnow() + timedelta(hours=24)
    
    await user_repo.update(
        user_id,
        {
            "verification_token": verification_token,
            "verification_token_expires": verification_token_expires
        }
    )
    
    # Create verification URL
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    
    # Send email
    return email_service.send_verification_email(
        to_email=email,
        verification_url=verification_url,
        full_name=full_name
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    user_repo = UserRepository(db)
    
    existing = await user_repo.get_by_email(user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user (not verified initially)
    user = await user_repo.create_user(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        is_verified=False
    )
    
    # Send verification email (don't fail registration if email fails)
    try:
        await send_verification_email(user.id, user.email, user.full_name, db)
    except Exception as e:
        # Log error but don't fail registration
        print(f"Failed to send verification email: {e}")
    
    return user


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncIOMotorDatabase = Depends(get_database)):
    user_repo = UserRepository(db)
    
    user = await user_repo.get_by_email(form_data.username)
    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    # Check if email is verified
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Email not verified. Please check your email for verification link."
        )
    
    access_token = create_access_token({"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/verify-email", response_model=EmailVerificationResponse)
async def verify_email(token: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Verify user's email address using the token from email link"""
    user_repo = UserRepository(db)
    
    user = await user_repo.get_by_verification_token(token)
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    
    # Check if token has expired
    if user.verification_token_expires and user.verification_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification token has expired. Please request a new one.")
    
    # Mark user as verified
    await user_repo.verify_email(user.id)
    
    return {
        "message": "Email verified successfully! You can now log in.",
        "email": user.email
    }


@router.post("/resend-verification", response_model=dict)
async def resend_verification(request: ResendVerificationRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Resend verification email to user"""
    user_repo = UserRepository(db)
    
    user = await user_repo.get_by_email(request.email)
    
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists and is not verified, a verification email has been sent."}
    
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email is already verified")
    
    # Send verification email
    try:
        success = await send_verification_email(user.id, user.email, user.full_name, db)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send verification email. Please try again later.")
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send verification email. Please try again later.")
    
    return {"message": "Verification email sent successfully. Please check your inbox."}


# ==================== Google OAuth ====================
from urllib.parse import urlencode
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests


@router.get("/google/login")
def google_login():
    """Redirect user to Google OAuth consent screen"""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return {"auth_url": auth_url}


@router.get("/google/callback")
async def google_callback(code: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Handle Google OAuth callback and create/login user"""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    try:
        user_repo = UserRepository(db)
        
        # Exchange authorization code for access token
        import httpx
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)
            token_response.raise_for_status()
            tokens = token_response.json()
        
        # Verify and decode the ID token
        id_info = id_token.verify_oauth2_token(
            tokens["id_token"],
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        
        # Extract user information
        google_user_id = id_info["sub"]
        email = id_info.get("email")
        full_name = id_info.get("name", "")
        avatar_url = id_info.get("picture")
        email_verified = id_info.get("email_verified", False)
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")
        
        # Check if user exists by email or OAuth ID
        user = await user_repo.get_by_email(email)
        if not user:
            user = await user_repo.get_by_oauth(provider="google", provider_id=google_user_id)
        
        if user:
            # Update existing user with Google OAuth info if not already set
            update_data = {}
            if not user.oauth_provider:
                update_data["oauth_provider"] = "google"
                update_data["oauth_provider_id"] = google_user_id
            if not user.avatar_url and avatar_url:
                update_data["avatar_url"] = avatar_url
            # Mark as verified if Google says email is verified
            if email_verified and not user.is_verified:
                update_data["is_verified"] = True
            
            if update_data:
                await user_repo.update(user.id, update_data)
                # Refresh user object
                user = await user_repo.get_by_id(user.id)
        else:
            # Create new user with Google OAuth
            user = await user_repo.create_user(
                email=email,
                full_name=full_name,
                oauth_provider="google",
                oauth_provider_id=google_user_id,
                avatar_url=avatar_url,
                is_verified=email_verified,  # Trust Google's verification
                hashed_password=None  # No password for OAuth users
            )
        
        # Generate JWT access token
        access_token = create_access_token({"sub": user.id})
        
        # Redirect to frontend with token
        redirect_url = f"{settings.FRONTEND_URL}/auth/callback?token={access_token}"
        
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=redirect_url)
        
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=400, detail=f"Failed to exchange code for token: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth error: {str(e)}")

