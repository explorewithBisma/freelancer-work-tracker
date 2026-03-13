from pydantic import BaseModel
from datetime import datetime
from typing import Literal

class MessageCreate(BaseModel):
    conversation_id: int
    sender_type: Literal["client", "user", "bot"]
    message: str

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_type: str
    message: str
    created_at: datetime

    class Config:
        orm_mode = True