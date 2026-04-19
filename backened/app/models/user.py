from sqlalchemy import Column, Integer, String, DateTime, Text, func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    full_name     = Column(String(120), nullable=False)
    email         = Column(String(190), unique=True, nullable=False)
    phone         = Column(String(30),  nullable=True)   # ✅ NEW
    bio           = Column(Text,        nullable=True)   # ✅ NEW
    password_hash = Column(String(255), nullable=False)
    created_at    = Column(DateTime, server_default=func.now())