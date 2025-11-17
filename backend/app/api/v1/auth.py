from datetime import datetime, timedelta
from typing import Optional
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
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


def send_verification_email(user: User, db: Session) -> bool:
    """Generate verification token and send email to user"""
    # Generate token and set expiry (24 hours)
    user.verification_token = generate_verification_token()
    user.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
    db.commit()
    
    # Create verification URL
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={user.verification_token}"
    
    # Send email
    return email_service.send_verification_email(
        to_email=user.email,
        verification_url=verification_url,
        full_name=user.full_name
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user (not verified initially)
    user = User(
        email=user_in.email, 
        full_name=user_in.full_name, 
        hashed_password=get_password_hash(user_in.password),
        is_verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Send verification email (don't fail registration if email fails)
    try:
        send_verification_email(user, db)
    except Exception as e:
        # Log error but don't fail registration
        print(f"Failed to send verification email: {e}")
    
    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user: Optional[User] = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    # Check if email is verified
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Email not verified. Please check your email for verification link."
        )
    
    access_token = create_access_token({"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/verify-email", response_model=EmailVerificationResponse)
def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify user's email address using the token from email link"""
    user = db.query(User).filter(User.verification_token == token).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    
    # Check if token has expired
    if user.verification_token_expires and user.verification_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification token has expired. Please request a new one.")
    
    # Mark user as verified
    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()
    
    return {
        "message": "Email verified successfully! You can now log in.",
        "email": user.email
    }


@router.post("/resend-verification", response_model=dict)
def resend_verification(request: ResendVerificationRequest, db: Session = Depends(get_db)):
    """Resend verification email to user"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists and is not verified, a verification email has been sent."}
    
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email is already verified")
    
    # Send verification email
    try:
        success = send_verification_email(user, db)
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
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback and create/login user"""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    try:
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
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            # Update existing user with Google OAuth info if not already set
            if not user.oauth_provider:
                user.oauth_provider = "google"
                user.oauth_provider_id = google_user_id
            if not user.avatar_url and avatar_url:
                user.avatar_url = avatar_url
            # Mark as verified if Google says email is verified
            if email_verified and not user.is_verified:
                user.is_verified = True
            db.commit()
        else:
            # Create new user with Google OAuth
            user = User(
                email=email,
                full_name=full_name,
                oauth_provider="google",
                oauth_provider_id=google_user_id,
                avatar_url=avatar_url,
                is_verified=email_verified,  # Trust Google's verification
                hashed_password=None,  # No password for OAuth users
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Generate JWT access token
        access_token = create_access_token({"sub": str(user.id)})
        
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

