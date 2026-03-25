from sqlalchemy.orm import Session
from app.models.time_entry import TimeEntry
from datetime import datetime

def calculate_duration_minutes(start_time, end_time):
    if end_time is None:
        return 0
    diff = end_time - start_time
    return int(diff.total_seconds() // 60)

def create_time_entry(db: Session, task_id: int, start_time: datetime, note: str = None):
    time_entry = TimeEntry(
        task_id=task_id,
        start_time=start_time,
        duration_minutes=0,
        note=note
    )
    db.add(time_entry)
    db.commit()
    db.refresh(time_entry)
    return time_entry

def update_time_entry(db: Session, entry_id: int, end_time: datetime, note: str = None):
    entry = db.query(TimeEntry).filter(TimeEntry.id == entry_id).first()
    if entry:
        entry.end_time = end_time
        entry.duration_minutes = calculate_duration_minutes(entry.start_time, end_time)
        if note:
            entry.note = note
        db.commit()
        db.refresh(entry)
    return entry

def get_time_entries(db: Session):
    return db.query(TimeEntry).all()

# --- THIS IS THE MISSING FUNCTION CAUSING YOUR ERROR ---
def get_time_entry(db: Session, entry_id: int):
    return db.query(TimeEntry).filter(TimeEntry.id == entry_id).first()

def delete_time_entry(db: Session, entry_id: int):
    entry = db.query(TimeEntry).filter(TimeEntry.id == entry_id).first()
    if entry:
        db.delete(entry)
        db.commit()
    return entry