from pydantic import BaseModel
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseModel):
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # Refresh tokens last 30 days
    # Extraction settings
    EXTRACTOR_PROVIDER: str = os.getenv("EXTRACTOR_PROVIDER", "openai")  # openai only
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")

    # Storage settings
    STORAGE_PROVIDER: str = os.getenv("STORAGE_PROVIDER", "local")  # local | supabase (future)
    STORAGE_LOCAL_DIR: str = os.getenv("STORAGE_LOCAL_DIR", os.path.abspath(os.path.join(os.getcwd(), "generated")))

    # App base URL (used to build public-ish URLs in dev)
    APP_BASE_URL: str = os.getenv("APP_BASE_URL", "http://localhost:8000")

    # Payments
    PAYSTACK_SECRET_KEY: str | None = os.getenv("PAYSTACK_SECRET_KEY")
    PAYSTACK_BASE_URL: str = os.getenv("PAYSTACK_BASE_URL", "https://api.paystack.co")
    STRIPE_SECRET_KEY: str | None = os.getenv("STRIPE_SECRET_KEY")
    
    # Email/SMTP settings for email verification
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str | None = os.getenv("SMTP_USER")
    SMTP_PASSWORD: str | None = os.getenv("SMTP_PASSWORD")
    # Gmail requires FROM email to match authenticated user
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL") or os.getenv("SMTP_USER") or "hello@invoyq.com"
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "InvoYQ")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    SMTP_USE_SSL: bool = os.getenv("SMTP_USE_SSL", "false").lower() == "true"
    
    # Frontend URL for email verification links
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Google OAuth settings
    GOOGLE_CLIENT_ID: str | None = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str | None = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/v1/auth/google/callback")
    
    # MongoDB settings
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "invoyq")
    MONGODB_MAX_POOL_SIZE: int = int(os.getenv("MONGODB_MAX_POOL_SIZE", "50"))
    MONGODB_MIN_POOL_SIZE: int = int(os.getenv("MONGODB_MIN_POOL_SIZE", "10"))

    class Config:
        arbitrary_types_allowed = True

settings = Settings()
