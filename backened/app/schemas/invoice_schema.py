from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class InvoiceCreate(BaseModel):
    client_id: int
    project_id: Optional[int] = None
    invoice_number: str
    date_from: date
    date_to: date
    total_amount: float = 0.0
    status: str = "draft"


class InvoiceResponse(BaseModel):
    id: int
    user_id: int
    client_id: int
    project_id: Optional[int] = None
    invoice_number: str
    date_from: date
    date_to: date
    total_amount: float
    status: str
    created_at: datetime

    class Config:
        orm_mode = True