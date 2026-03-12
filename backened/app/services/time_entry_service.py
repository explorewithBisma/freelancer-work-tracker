from sqlalchemy.orm import Session
from app.models.time_entry import TimeEntry

def calculate_duration_minutes(start_time, end_time):
    if end_time is None:
        return 0
    diff = end_time - start_time
    return int(diff.total_seconds() // 60)


def create_time_entry(
    db: Session,
    task_id: int,
    start_time,
    end_time=None,
    note: str = None
):
    duration_minutes = calculate_duration_minutes(start_time, end_time)

    time_entry = TimeEntry(
        task_id=task_id,
        start_time=start_time,
        end_time=end_time,
        duration_minutes=duration_minutes,
        note=note
    )

    db.add(time_entry)
    db.commit()
    db.refresh(time_entry)
    return time_entry


def get_time_entries(db: Session):
    return db.query(TimeEntry).all()


def get_time_entry(db: Session, entry_id: int):
    return db.query(TimeEntry).filter(TimeEntry.id == entry_id).first()


def delete_time_entry(db: Session, entry_id: int):
    entry = db.query(TimeEntry).filter(TimeEntry.id == entry_id).first()

    if entry:
        db.delete(entry)
        db.commit()

    return entry