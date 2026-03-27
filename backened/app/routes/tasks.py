from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_db, get_current_user
from app.schemas.task_schema import TaskCreate, TaskResponse
from app.services.task_service import (
    create_task, 
    get_tasks, 
    get_task, 
    delete_task, 
    update_task_status
)

# FIXED: Removed prefix="/tasks" because it's already in main.py.
# This prevents the "double-address" error (tasks/tasks).
router = APIRouter(tags=["Tasks"])

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def add_task(
    payload: TaskCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user) # Added for security
):
    # Pass current_user.id to ensure the task belongs to the logged-in freelancer
    task = create_task(
        db,
        current_user.id,
        payload.project_id,
        payload.title,
        payload.description,
        payload.status
    )
    return task

@router.get("/", response_model=List[TaskResponse])
def read_tasks(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_tasks(db, current_user.id)

@router.get("/{task_id}/", response_model=TaskResponse)
def read_task(
    task_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    task = get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.patch("/{task_id}/", response_model=TaskResponse)
def update_task_status_route(
    task_id: int, 
    payload: dict, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    new_status = payload.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status field is required")

    task = update_task_status(db, task_id, current_user.id, new_status)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.delete("/{task_id}/")
def remove_task(
    task_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    success = delete_task(db, task_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}