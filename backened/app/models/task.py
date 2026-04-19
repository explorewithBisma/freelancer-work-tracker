from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, Text
from app.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id  = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title       = Column(String(180), nullable=False)
    description = Column(Text, nullable=True)
    status      = Column(String(50), nullable=False, default="todo")
    # ✅ NEW: Priority column
    priority    = Column(String(20), nullable=True, default="medium")
    created_at  = Column(DateTime, server_default=func.now())