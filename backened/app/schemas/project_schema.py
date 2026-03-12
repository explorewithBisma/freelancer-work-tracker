from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ProjectCreate(BaseModel):
    client_id: int
    title: str
    description: Optional[str] = None
    hourly_rate: Optional[float] = None
    status: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    user_id: int
    client_id: int
    title: str
    description: Optional[str] = None
    hourly_rate: Optional[float] = None
    status: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True