from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class ClientCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None


class ClientOut(BaseModel):
    id: int
    user_id: int
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True