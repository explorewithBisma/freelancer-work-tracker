from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# This class MUST be named exactly 'TaskCreate'
class TaskCreate(BaseModel):
    project_id: int
    title: str
    description: Optional[str] = None
    status: Optional[str] = "todo"

# This class MUST be named exactly 'TaskResponse'
class TaskResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None 

    class Config:
        from_attributes = True
        orm_mode = True