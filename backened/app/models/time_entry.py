from sqlalchemy import Column, Integer, DateTime, String, func, ForeignKey
from app.database import Base

class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=0)
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())