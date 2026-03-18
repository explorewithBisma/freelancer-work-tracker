from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)