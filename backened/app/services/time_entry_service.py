from sqlalchemy.orm import Session
from app.models.time_entry import TimeEntry
from datetime import datetime

def create_time_entry(db: Session, task_id: int, duration_seconds: int, date: str, note: str = None):
    """
    Creates a completed time entry. 
    Matches the logic where React sends the total elapsed time.
    """
    time_entry = TimeEntry(
        task_id=task_id,
        duration_seconds=duration_seconds,
        date=date,
        note=note
    )
    db.add(time_entry)
    db.commit()
    db.refresh(time_entry)
    return time_entry

def get_time_entries(db: Session):
    """Fetch all time logs from the database"""
    return db.query(TimeEntry).all()

def get_time_entry(db: Session, entry_id: int):
    """Fetch a single entry by its ID"""
    return db.query(TimeEntry).filter(TimeEntry.id == entry_id).first()

def delete_time_entry(db: Session, entry_id: int):
    """Remove a time log"""
    entry = db.query(TimeEntry).filter(TimeEntry.id == entry_id).first()
    if entry:
        db.delete(entry)
        db.commit()
        return True
    return False

# NOTE: We removed update_time_entry and calculate_duration_minutes 
# because the React Stopwatch now sends the final duration immediately.