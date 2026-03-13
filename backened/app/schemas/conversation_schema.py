from pydantic import BaseModel
from datetime import datetime

class ConversationCreate(BaseModel):
    client_id: int


class ConversationResponse(BaseModel):
    id: int
    user_id: int
    client_id: int
    created_at: datetime

    class Config:
        orm_mode = True