from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import re

class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None

class UserCreate(UserBase):
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least 1 number')
        return v

class UserUpdate(BaseModel):
    """Schema for updating user profile and business details"""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    company_address: Optional[str] = None
    tax_id: Optional[str] = None
    website: Optional[str] = None

class UserOut(UserBase):
    id: str
    is_verified: bool = False

    class Config:
        from_attributes = True

class UserRead(UserBase):
    id: str
    is_active: bool
    is_verified: bool
    is_pro: bool
    subscription_status: str | None = None
    subscription_provider: str | None = None
    subscription_start_date: datetime | None = None
    subscription_end_date: datetime | None = None
    
    # Business/Profile details
    avatar_url: str | None = None
    phone: str | None = None
    company_name: str | None = None
    company_logo_url: str | None = None
    company_address: str | None = None
    tax_id: str | None = None
    website: str | None = None

    class Config:
        from_attributes = True


# Email verification schemas
class EmailVerificationResponse(BaseModel):
    """Response after successful email verification"""
    message: str
    email: str


class ResendVerificationRequest(BaseModel):
    """Request to resend verification email"""
    email: EmailStr

