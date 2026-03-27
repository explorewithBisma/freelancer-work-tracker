from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TimeEntryBase(BaseModel):
    task_id: int
    duration_seconds: int  # Changed from start/end times to match your Stopwatch
    date: str              # Format: YYYY-MM-DD
    note: Optional[str] = None

class TimeEntryCreate(TimeEntryBase):
    """Schema for creating a new time entry"""
    pass

class TimeEntryResponse(TimeEntryBase):
    """Schema for returning time entry data to the frontend"""
    id: int
    created_at: datetime

    class Config:
        # Pydantic v2 uses 'from_attributes', v1 uses 'orm_mode'
        # Since you're using orm_mode, I'll keep it for compatibility
        orm_mode = True