from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_db, get_current_user
from app.schemas.project_schema import ProjectCreate, ProjectResponse
from app.services.project_service import create_project, get_projects, get_project, delete_project

router = APIRouter(tags=["Projects"])

class ProjectUpdate(BaseModel):
    client_id:   Optional[int] = None
    title:       Optional[str] = None
    description: Optional[str] = None
    hourly_rate: Optional[float] = None
    status:      Optional[str] = None
    deadline:    Optional[str] = None

@router.post("/", response_model=ProjectResponse)
def add_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    project = create_project(
        db,
        current_user.id,
        payload.client_id,
        payload.title,
        payload.description,
        payload.hourly_rate,
        payload.status
    )
    # Save deadline if provided
    if hasattr(payload, 'deadline') and payload.deadline:
        project.deadline = payload.deadline
        db.commit()
        db.refresh(project)
    return project

@router.get("/", response_model=list[ProjectResponse])
def read_projects(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_projects(db, current_user.id)

@router.get("/{project_id}/", response_model=ProjectResponse)
def read_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    project = get_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

# ✅ PUT endpoint for editing
@router.put("/{project_id}/")
def update_project_route(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    from app.models.project import Project
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if payload.client_id is not None:   project.client_id   = payload.client_id
    if payload.title is not None:       project.title       = payload.title
    if payload.description is not None: project.description = payload.description
    if payload.hourly_rate is not None: project.hourly_rate = payload.hourly_rate
    if payload.status is not None:      project.status      = payload.status
    if payload.deadline is not None:    project.deadline    = payload.deadline

    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}/")
def remove_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    project = delete_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

@router.delete("/{project_id}/close")
def close_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    from app.models.project import Project
    from app.models.task import Task
    from app.models.time_entry import TimeEntry
    from app.models.invoice import Invoice

    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    task_ids = [t.id for t in tasks]

    if task_ids:
        db.query(TimeEntry).filter(TimeEntry.task_id.in_(task_ids)).delete(synchronize_session=False)

    db.query(Task).filter(Task.project_id == project_id).delete(synchronize_session=False)
    db.query(Invoice).filter(Invoice.project_id == project_id).delete(synchronize_session=False)
    db.delete(project)
    db.commit()

    return {"message": "Project closed and all related data removed successfully"}