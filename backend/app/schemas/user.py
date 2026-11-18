from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Literal, Optional, get_args
import re

# "How did you hear about InvoyQ?" answers
ReferralSource = Literal["instagram", "friend", "x", "linkedin", "app_store", "other"]
REFERRAL_SOURCES = get_args(ReferralSource)
REFERRAL_OTHER_MAX = 200


def clean_referral_other(source, other):
    """Free text is only kept for "other", trimmed and capped; blank becomes None."""
    if source != "other" or not isinstance(other, str):
        return None
    other = other.strip()[:REFERRAL_OTHER_MAX]
    return other or None


def normalize_email(value):
    """Trim and lower-case an email so lookups and uniqueness are case-insensitive."""
    return value.strip().lower() if isinstance(value, str) else value


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None

    @field_validator('email', mode='before')
    @classmethod
    def _normalize_email(cls, v):
        return normalize_email(v)

class UserCreate(UserBase):
    password: str
    # Legacy: old app builds send "mobile". The platform now comes from the X-Client-Platform header.
    registration_source: Optional[str] = None
    referral_source: Optional[ReferralSource] = None
    referral_source_other: Optional[str] = None

    @model_validator(mode="after")
    def _clean_referral(self):
        self.referral_source_other = clean_referral_other(self.referral_source, self.referral_source_other)
        return self
    
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
    referral_source: Optional[ReferralSource] = None
    referral_source_other: Optional[str] = None

    @model_validator(mode="after")
    def _clean_referral(self):
        if "referral_source" in self.model_fields_set:
            self.referral_source_other = clean_referral_other(self.referral_source, self.referral_source_other)
        return self

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
    is_admin: bool = False
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
    
    # OAuth and password fields for password management
    oauth_provider: str | None = None  # 'google' if OAuth user
    has_password: bool = False  # true if user has set a password

    # "How did you hear about InvoyQ?" (None = not answered yet)
    referral_source: str | None = None
    referral_source_other: str | None = None

    class Config:
        from_attributes = True


# Email verification schemas
class EmailVerificationResponse(BaseModel):
    """Response after successful email verification"""
    message: str
    email: str
    registration_source: Optional[str] = None


class ResendVerificationRequest(BaseModel):
    """Request to resend verification email"""
    email: EmailStr

    @field_validator('email', mode='before')
    @classmethod
    def _normalize_email(cls, v):
        return normalize_email(v)


class PasswordResetRequest(BaseModel):
    """Request to reset password with token"""
    token: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least 1 number')
        return v

