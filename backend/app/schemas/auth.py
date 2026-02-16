from pydantic import BaseModel, field_validator
import re

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenRefresh(BaseModel):
    refresh_token: str


class AccessToken(BaseModel):
    access_token: str
    token_type: str


class GoogleAuthRequest(BaseModel):
    """Request for mobile Google authentication with ID token"""
    id_token: str
    device_id: str | None = None


class ChangePassword(BaseModel):
    current_password: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least 1 number')
        return v


class SetPassword(BaseModel):
    """Schema for OAuth users to set their first password"""
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least 1 number')
        return v
