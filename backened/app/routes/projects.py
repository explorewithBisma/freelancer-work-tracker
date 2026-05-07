from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date

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

def auto_create_invoice(db, project, user_id):
    """Auto create draft invoice when project is marked completed"""
    from app.models.invoice import Invoice
    from app.models.time_entry import TimeEntry
    from app.models.task import Task
    import random

    # Check if invoice already exists for this project
    existing = db.query(Invoice).filter(Invoice.project_id == project.id).first()
    if existing:
        return None  # Already has invoice

    # Calculate total hours from time entries
    tasks = db.query(Task).filter(Task.project_id == project.id).all()
    task_ids = [t.id for t in tasks]
    total_seconds = 0
    if task_ids:
        entries = db.query(TimeEntry).filter(TimeEntry.task_id.in_(task_ids)).all()
        total_seconds = sum(e.duration_seconds or 0 for e in entries)

    total_hours = round(total_seconds / 3600, 2)
    hourly_rate = float(project.hourly_rate or 0)
    total_amount = round(total_hours * hourly_rate, 2)

    # Generate invoice number
    inv_number = f"INV-{date.today().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

    # Create draft invoice
    invoice = Invoice(
        user_id        = user_id,
        client_id      = project.client_id,
        project_id     = project.id,
        invoice_number = inv_number,
        date_from      = date(date.today().year, 1, 1),
        date_to        = date.today(),
        total_amount   = total_amount if total_amount > 0 else 0,
        status         = "draft"
    )
    db.add(invoice)
    db.commit()
    return invoice

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
    if hasattr(payload, 'deadline') and payload.deadline:
        project.deadline = payload.deadline
        db.commit()
        db.refresh(project)

    # Auto invoice if created as completed
    if payload.status == "completed":
        auto_create_invoice(db, project, current_user.id)

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

# ✅ PUT endpoint — auto invoice when marked completed
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

    old_status = project.status

    if payload.client_id is not None:   project.client_id   = payload.client_id
    if payload.title is not None:       project.title       = payload.title
    if payload.description is not None: project.description = payload.description
    if payload.hourly_rate is not None: project.hourly_rate = payload.hourly_rate
    if payload.status is not None:      project.status      = payload.status
    if payload.deadline is not None:    project.deadline    = payload.deadline

    db.commit()
    db.refresh(project)

    # ✅ Auto create invoice if status changed TO completed
    invoice_created = None
    if payload.status == "completed" and old_status != "completed":
        invoice_created = auto_create_invoice(db, project, current_user.id)

    response = {
        "id":           project.id,
        "user_id":      project.user_id,
        "client_id":    project.client_id,
        "title":        project.title,
        "description":  project.description,
        "hourly_rate":  project.hourly_rate,
        "status":       project.status,
        "deadline":     str(project.deadline) if project.deadline else None,
        "created_at":   str(project.created_at) if hasattr(project, 'created_at') else None,
    }

    if invoice_created:
        response["auto_invoice"] = {
            "message": f"✅ Draft invoice '{invoice_created.invoice_number}' automatically created!",
            "invoice_number": invoice_created.invoice_number,
            "amount": float(invoice_created.total_amount)
        }

    return response

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

# ✅ FIXED: close_project — invoice pehle banta hai, phir data delete hota hai
@router.delete("/{project_id}/close")
def close_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    from app.models.project import Project
    from app.models.task import Task
    from app.models.time_entry import TimeEntry

    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # ✅ STEP 1: Auto-create invoice BEFORE deleting time entries
    invoice_created = auto_create_invoice(db, project, current_user.id)

    # ✅ STEP 2: Delete tasks and time entries (NOT invoices)
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    task_ids = [t.id for t in tasks]

    if task_ids:
        db.query(TimeEntry).filter(TimeEntry.task_id.in_(task_ids)).delete(synchronize_session=False)

    db.query(Task).filter(Task.project_id == project_id).delete(synchronize_session=False)

    # ✅ Invoices DELETE nahi hogi — woh records rehne chahiye
    db.delete(project)
    db.commit()

    response = {"message": "Project closed and all related data removed successfully"}

    if invoice_created:
        response["auto_invoice"] = {
            "message": f"✅ Draft invoice '{invoice_created.invoice_number}' automatically created!",
            "invoice_number": invoice_created.invoice_number,
            "amount": float(invoice_created.total_amount)
        }

    return response