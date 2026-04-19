from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    created_at: Optional[datetime] = None

    # ✅ FIX: Pydantic v1 syntax — ConfigDict(from_attributes=True) Pydantic v2 ka tha
    class Config:
        orm_mode = True