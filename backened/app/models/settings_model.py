from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, func
from app.database import Base

class UserSettings(Base):
    __tablename__ = "user_settings"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    currency   = Column(String(10),   default="USD")
    tax_label  = Column(String(50),   default="Tax")
    tax_rate   = Column(Numeric(5,2), default=0.00)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())