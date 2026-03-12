from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.task_schema import TaskCreate, TaskResponse
from app.services.task_service import create_task, get_tasks, get_task, delete_task

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


@router.get("", response_model=list[TaskResponse])
def read_tasks(db: Session = Depends(get_db)):
    return get_tasks(db)


@router.get("/{task_id}", response_model=TaskResponse)
def read_task(task_id: int, db: Session = Depends(get_db)):
    task = get_task(db, task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task


@router.delete("/{task_id}")
def remove_task(task_id: int, db: Session = Depends(get_db)):
    task = delete_task(db, task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return {"message": "Task deleted successfully"}