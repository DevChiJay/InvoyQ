from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for OAuth users
    full_name = Column(String, nullable=True)
    
    # OAuth fields
    oauth_provider = Column(String, nullable=True)  # 'google', 'github', etc.
    oauth_provider_id = Column(String, nullable=True)  # Google's user ID
    
    is_active = Column(Boolean, default=True)
    
    # Email verification fields
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
    
    # Pro-tier subscription fields
    is_pro = Column(Boolean, default=False)
    subscription_status = Column(String, nullable=True)  # active, cancelled, expired, pending
    subscription_provider = Column(String, nullable=True)  # paystack, stripe
    subscription_provider_id = Column(String, nullable=True)  # external subscription ID
    subscription_start_date = Column(DateTime, nullable=True)
    subscription_end_date = Column(DateTime, nullable=True)
    subscription_updated_at = Column(DateTime, nullable=True, default=datetime.utcnow)
    
    # Business/Profile details
    avatar_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    company_logo_url = Column(String, nullable=True)
    company_address = Column(String, nullable=True)
    tax_id = Column(String, nullable=True)  # VAT/Tax ID
    website = Column(String, nullable=True)
