from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from app.database import Base

class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    
    # These MUST match the arguments we pass in time_entry_service.py
    duration_seconds = Column(Integer, nullable=False) 
    date = Column(String(50), nullable=False) # Stores YYYY-MM-DD
    
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())