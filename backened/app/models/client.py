from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey
from app.database import Base

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(120), nullable=False)
    email = Column(String(190))
    phone = Column(String(30))
    company = Column(String(120))
    created_at = Column(DateTime, server_default=func.now())