from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.schemas.project_schema import ProjectCreate, ProjectResponse
from app.services.project_service import create_project, get_projects, get_project, delete_project

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("", response_model=ProjectResponse)
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
    return project


@router.get("", response_model=list[ProjectResponse])
def read_projects(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_projects(db, current_user.id)


@router.get("/{project_id}", response_model=ProjectResponse)
def read_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    project = get_project(db, project_id, current_user.id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project


@router.delete("/{project_id}")
def remove_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    project = delete_project(db, project_id, current_user.id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return {"message": "Project deleted successfully"}