from pydantic import BaseModel, EmailStr


class ClientBase(BaseModel):
    name: str
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None


class ClientOut(ClientBase):
    id: str

    class Config:
        from_attributes = True


class ClientStats(BaseModel):
    """Client statistics for dashboard"""
    total_count: int = 0


class ClientStatsResponse(BaseModel):
    """Response for client statistics endpoint"""
    stats: ClientStats
