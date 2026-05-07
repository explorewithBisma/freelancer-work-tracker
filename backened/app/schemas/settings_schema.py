from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class ProfileUpdate(BaseModel):
    full_name: Optional[str]      = None
    email:     Optional[EmailStr] = None
    phone:     Optional[str]      = None
    bio:       Optional[str]      = None


class ProfileOut(BaseModel):
    id:         int
    full_name:  str
    email:      str
    phone:      Optional[str] = None
    bio:        Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


class PasswordChange(BaseModel):
    current_password: str
    new_password:     str
    confirm_password: str


class SettingsUpdate(BaseModel):
    currency:             Optional[str]   = None
    tax_label:            Optional[str]   = None
    tax_rate:             Optional[float] = None
    language:             Optional[str]   = None
    theme:                Optional[str]   = None
    accent_color:         Optional[str]   = None
    compact_mode:         Optional[bool]  = None
    notif_invoice_paid:   Optional[bool]  = None
    notif_project_update: Optional[bool]  = None
    notif_task_reminder:  Optional[bool]  = None
    notif_weekly_report:  Optional[bool]  = None
    notif_email_digest:   Optional[bool]  = None
    notif_browser_push:   Optional[bool]  = None

class SettingsOut(BaseModel):
    id:                   int
    user_id:              int
    currency:             Optional[str]   = "USD"
    tax_label:            Optional[str]   = "Tax"
    tax_rate:             Optional[float] = 0.0
    language:             Optional[str]   = "en"
    theme:                Optional[str]   = "light"
    accent_color:         Optional[str]   = "#3b82f6"
    compact_mode:         Optional[bool]  = False
    notif_invoice_paid:   Optional[bool]  = True
    notif_project_update: Optional[bool]  = True
    notif_task_reminder:  Optional[bool]  = True
    notif_weekly_report:  Optional[bool]  = True
    notif_email_digest:   Optional[bool]  = True
    notif_browser_push:   Optional[bool]  = True
    
    class Config:
        orm_mode = True