from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_db
from app.schemas.task_schema import TaskCreate, TaskResponse
# Added 'update_task_status' to the imports below
from app.services.task_service import create_task, get_tasks, get_task, delete_task, update_task_status

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("", response_model=TaskResponse)
def add_task(payload: TaskCreate, db: Session = Depends(get_db)):
    task = create_task(
        db,
        payload.project_id,
        payload.title,
        payload.description,
        payload.status
    )
    return task

@router.get("", response_model=List[TaskResponse])
def read_tasks(db: Session = Depends(get_db)):
    return get_tasks(db)

@router.get("/{task_id}", response_model=TaskResponse)
def read_task(task_id: int, db: Session = Depends(get_db)):
    task = get_task(db, task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task

# --- NEW UPDATE ROUTE ADDED HERE ---
@router.patch("/{task_id}", response_model=TaskResponse)
def update_task_status_route(task_id: int, payload: dict, db: Session = Depends(get_db)):
    """
    Updates the status of a specific task (e.g., moving it from 'todo' to 'in_progress').
    """
    # Extract the new status from the JSON body sent by React
    new_status = payload.get("status")
    
    if not new_status:
        raise HTTPException(status_code=400, detail="Status field is required")

    task = update_task_status(db, task_id, new_status)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task

@router.delete("/{task_id}")
def remove_task(task_id: int, db: Session = Depends(get_db)):
    task = delete_task(db, task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return {"message": "Task deleted successfully"}