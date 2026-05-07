from pydantic import BaseModel, EmailStr    #basemodel help us in making the schemas, chck the format, emailstr chck the email format 
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

    #  Pydantic v1 syntax — ConfigDict(from_attributes=True) Pydantic v2 ka tha
    class Config:
        orm_mode = True