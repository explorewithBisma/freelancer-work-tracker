from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.time_entry_schema import TimeEntryCreate, TimeEntryResponse
from app.services.time_entry_service import (
    create_time_entry,
    get_time_entries,
    get_time_entry,
    delete_time_entry
)

router = APIRouter(prefix="/time-entries", tags=["Time Entries"])


@router.post("", response_model=TimeEntryResponse)
def add_time_entry(payload: TimeEntryCreate, db: Session = Depends(get_db)):
    entry = create_time_entry(
        db,
        payload.task_id,
        payload.start_time,
        payload.end_time,
        payload.note
    )
    return entry


@router.get("", response_model=list[TimeEntryResponse])
def read_time_entries(db: Session = Depends(get_db)):
    return get_time_entries(db)


@router.get("/{entry_id}", response_model=TimeEntryResponse)
def read_time_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = get_time_entry(db, entry_id)

    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")

    return entry


@router.delete("/{entry_id}")
def remove_time_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = delete_time_entry(db, entry_id)

    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")

    return {"message": "Time entry deleted successfully"}