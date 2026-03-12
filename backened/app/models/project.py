from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, Float
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
    title = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    hourly_rate = Column(Float, nullable=True)
    status = Column(String(50), nullable=True)
    created_at = Column(DateTime, server_default=func.now())