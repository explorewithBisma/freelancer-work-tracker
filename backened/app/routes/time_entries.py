from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_db
from app.schemas.time_entry_schema import TimeEntryCreate, TimeEntryResponse
from app.services.time_entry_service import (
    create_time_entry,
    get_time_entries,
    get_time_entry,
    delete_time_entry
)

# FIXED: Removed prefix here because it's already defined in main.py
router = APIRouter(tags=["Time Entries"])

@router.post("/", response_model=TimeEntryResponse)
def add_time_entry(payload: TimeEntryCreate, db: Session = Depends(get_db)):
    """
    Receives time tracked from the React Stopwatch and saves it.
    """
    try:
        entry = create_time_entry(
            db=db,
            task_id=payload.task_id,
            duration_seconds=payload.duration_seconds,
            date=payload.date,
            note=payload.note
        )
        return entry
    except Exception as e:
        # This helps you see exactly what went wrong in the terminal if it fails
        print(f"Error creating time entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[TimeEntryResponse])
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
    success = delete_time_entry(db, entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return {"message": "Time entry deleted successfully"}