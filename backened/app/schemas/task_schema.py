from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TaskCreate(BaseModel):
    project_id: int
    title: str
    description: Optional[str] = None
    status: Optional[str] = "todo"


class TaskResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        orm_mode = True