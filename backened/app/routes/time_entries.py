from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.dependencies import get_db, get_current_user
from app.schemas.time_entry_schema import TimeEntryCreate, TimeEntryResponse
from app.services.time_entry_service import (
    create_time_entry, get_time_entries, get_time_entry, delete_time_entry
)
from app.models.time_entry import TimeEntry
from app.models.task import Task

router = APIRouter(tags=["Time Entries"])

#Note update ke liye schema
class TimeEntryNoteUpdate(BaseModel):
    note: Optional[str] = None

@router.post("/", response_model=TimeEntryResponse)
def add_time_entry(
    payload: TimeEntryCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
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
        print(f"Error creating time entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[TimeEntryResponse])
def read_time_entries(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Only return entries for current user's tasks
    entries = (
        db.query(TimeEntry)
        .join(Task, TimeEntry.task_id == Task.id)
        .filter(Task.user_id == current_user.id)
        .all()
    )
    return entries

@router.get("/{entry_id}", response_model=TimeEntryResponse)
def read_time_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    entry = get_time_entry(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return entry

# PATCH endpoint — note update karne ke liye
@router.patch("/{entry_id}/", response_model=TimeEntryResponse)
def update_time_entry_note(
    entry_id: int,
    payload: TimeEntryNoteUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Current user ka entry hai ya nahi check karo
    entry = (
        db.query(TimeEntry)
        .join(Task, TimeEntry.task_id == Task.id)
        .filter(TimeEntry.id == entry_id, Task.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")

    entry.note = payload.note
    db.commit()
    db.refresh(entry)
    return entry

@router.delete("/{entry_id}/")
def remove_time_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    success = delete_time_entry(db, entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return {"message": "Time entry deleted successfully"}