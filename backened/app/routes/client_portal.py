from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional

from app.dependencies import get_db, get_current_user
from app.models.client import Client
from app.models.project import Project
from app.models.task import Task
from app.models.time_entry import TimeEntry
from app.models.invoice import Invoice
from app.services.auth_service import verify_password, hash_password
from app.services.email_service import send_client_portal_email
from app.config import settings

router = APIRouter(tags=["Client Portal"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/client-portal/login")

class ClientSetPassword(BaseModel):
    email: EmailStr
    password: str

class ClientToken(BaseModel):
    access_token: str
    token_type: str

def create_client_token(client_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(client_id), "role": "client", "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

def get_current_client(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("role") != "client":
            raise HTTPException(status_code=403, detail="Not a client token")
        client_id = int(payload.get("sub"))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


# ════════════════════════════════
# SET PASSWORD — freelancer sets for THEIR specific client
# ✅ FIX: Uses freelancer auth to find exact client record
# ════════════════════════════════
@router.post("/set-password", status_code=200)
def set_client_password(
    payload: ClientSetPassword,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # ✅ Freelancer must be logged in
):
    # Find client belonging to THIS freelancer with this email
    client = db.query(Client).filter(
        Client.email == payload.email,
        Client.user_id == current_user.id  # ✅ Only this freelancer's client
    ).first()

    if not client:
        raise HTTPException(status_code=404, detail="No client found with this email")

    client.password_hash = hash_password(payload.password)
    db.commit()

    try:
        send_client_portal_email(
            to_email    = client.email,
            client_name = client.name,
            password    = payload.password,
        )
    except Exception as e:
        print(f"⚠️ Portal email failed: {e}")

    return {"message": f"Password set for {client.name}. Portal access email sent to {client.email}."}


# ════════════════════════════════
# CLIENT LOGIN
# ✅ FIX: Match by email + password — returns correct client_id
# Each freelancer sets different password → different client_id → different data
# ════════════════════════════════
@router.post("/login", response_model=ClientToken)
def client_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Get ALL clients with this email across all freelancers
    clients = db.query(Client).filter(
        Client.email == form_data.username,
        Client.password_hash != None
    ).all()

    if not clients:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Find the one whose password matches
    matched_client = None
    for client in clients:
        if verify_password(form_data.password, client.password_hash):
            matched_client = client
            break

    if not matched_client:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Token contains this specific client's ID → correct freelancer's data
    token = create_client_token(matched_client.id)
    return {"access_token": token, "token_type": "bearer"}


# ════════════════════════════════
# CLIENT ME
# ════════════════════════════════
@router.get("/me")
def get_client_me(current_client: Client = Depends(get_current_client)):
    return {
        "id":      current_client.id,
        "name":    current_client.name,
        "email":   current_client.email,
        "company": current_client.company,
    }


# ════════════════════════════════
# CLIENT DASHBOARD
# ✅ Data is isolated by client_id which is per-freelancer
# ════════════════════════════════
@router.get("/dashboard")
def client_dashboard(
    current_client: Client = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    client_id = current_client.id

    projects = db.query(Project).filter(Project.client_id == client_id).all()
    project_ids = [p.id for p in projects]

    all_tasks = db.query(Task).filter(Task.project_id.in_(project_ids)).all() if project_ids else []
    task_ids  = [t.id for t in all_tasks]

    total_seconds = 0
    if task_ids:
        from sqlalchemy import func as sqlfunc
        secs = db.query(sqlfunc.sum(TimeEntry.duration_seconds)).filter(
            TimeEntry.task_id.in_(task_ids)
        ).scalar()
        total_seconds = secs or 0

    invoices = db.query(Invoice).filter(Invoice.client_id == client_id).all()

    project_summaries = []
    for p in projects:
        p_tasks  = [t for t in all_tasks if t.project_id == p.id]
        done     = sum(1 for t in p_tasks if t.status == "done")
        total    = len(p_tasks)
        progress = round((done / total * 100) if total > 0 else 0)
        project_summaries.append({
            "id":          p.id,
            "title":       p.title,
            "description": p.description,
            "status":      p.status,
            "hourly_rate": p.hourly_rate,
            "progress":    progress,
            "total_tasks": total,
            "done_tasks":  done,
        })

    invoice_summaries = []
    for inv in invoices:
        invoice_summaries.append({
            "invoice_number": inv.invoice_number,
            "total_amount":   float(inv.total_amount or 0),
            "status":         inv.status,
            "date_from":      str(inv.date_from),
            "date_to":        str(inv.date_to),
        })

    return {
        "client": {
            "name":    current_client.name,
            "company": current_client.company,
            "email":   current_client.email,
        },
        "summary": {
            "total_projects":  len(projects),
            "total_tasks":     len(all_tasks),
            "completed_tasks": sum(1 for t in all_tasks if t.status == "done"),
            "hours_logged":    round(total_seconds / 3600, 1),
            "total_invoices":  len(invoices),
            "pending_amount":  sum(float(i.total_amount or 0) for i in invoices if i.status != "paid"),
        },
        "projects": project_summaries,
        "invoices": invoice_summaries,
    }