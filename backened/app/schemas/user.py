from pydantic import BaseModel, EmailStr
from datetime import datetime
from pydantic import ConfigDict

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
