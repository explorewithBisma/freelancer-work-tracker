from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TimeEntryCreate(BaseModel):
    task_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    note: Optional[str] = None


class TimeEntryResponse(BaseModel):
    id: int
    task_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: int
    note: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True