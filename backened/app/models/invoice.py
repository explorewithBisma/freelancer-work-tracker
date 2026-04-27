from sqlalchemy import Column, Integer, String, Date, DateTime, func, ForeignKey, Numeric
from app.database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    client_id      = Column(Integer, ForeignKey("clients.id"), nullable=False)
    project_id     = Column(Integer, ForeignKey("projects.id"), nullable=True)
    invoice_number = Column(String(60), unique=True, nullable=False)
    date_from      = Column(Date, nullable=False)
    date_to        = Column(Date, nullable=False)
    total_amount   = Column(Numeric(15, 2), default=0.00)  # ✅ FIX: 10→15 digits
    status         = Column(String(20), default="draft")
    created_at     = Column(DateTime, server_default=func.now())