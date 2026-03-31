from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, ForeignKey, func
from app.database import Base

# ⚠️ User model yahan NAHI — woh already auth mein define hai
# Sirf UserSettings model hai yahan

class UserSettings(Base):
    __tablename__ = "user_settings"

    id                   = Column(Integer, primary_key=True, index=True)
    user_id              = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Currency & Tax
    currency             = Column(String(10),  default="USD")
    tax_label            = Column(String(50),  default="Tax")
    tax_rate             = Column(Numeric(5,2), default=0.00)

    # Language
    language             = Column(String(10),  default="en")

    # Appearance
    theme                = Column(String(20),  default="light")
    accent_color         = Column(String(20),  default="#6c47ff")
    compact_mode         = Column(Boolean,      default=False)

    # Notifications
    notif_invoice_paid   = Column(Boolean, default=True)
    notif_project_update = Column(Boolean, default=True)
    notif_task_reminder  = Column(Boolean, default=False)
    notif_weekly_report  = Column(Boolean, default=True)
    notif_email_digest   = Column(Boolean, default=False)
    notif_browser_push   = Column(Boolean, default=False)

    created_at           = Column(DateTime, server_default=func.now())
    updated_at           = Column(DateTime, server_default=func.now(), onupdate=func.now())