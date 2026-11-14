from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy import func
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.dependencies import get_db
from app.models.client import Client
from app.models.project import Project
from app.models.task import Task
from app.models.time_entry import TimeEntry
from app.models.invoice import Invoice
from app.services.auth_service import verify_password, hash_password
from app.config import settings
from app.demo import demo_user_email, demo_client_email, is_demo_client_email
from app.models.user import User

router = APIRouter(tags=["Client Portal"])


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/client-portal/login")

# ✅ FIX: client_id use karo email ki jagah
class ClientSetPasswordWithToken(BaseModel):
    token: str
    password: str

SET_PASSWORD_PURPOSE = "client_set_password"
SET_PASSWORD_HOURS = 24
MIN_PASSWORD_LENGTH = 8


def _pwd_marker(client: Client) -> str:
    # Ties a token to the client's current password. Once the password is set,
    # the marker changes and the token stops working (single use).
    return (client.password_hash or "")[-10:]


def create_set_password_token(client: Client) -> str:
    claims = {
        "sub": str(client.id),
        "purpose": SET_PASSWORD_PURPOSE,
        "pwd": _pwd_marker(client),
        "exp": datetime.now(timezone.utc) + timedelta(hours=SET_PASSWORD_HOURS),
    }
    return jwt.encode(claims, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

class ClientToken(BaseModel):
    access_token: str
    token_type: str

CLIENT_PURPOSE = "client_portal"

def create_client_token(client_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(client_id), "role": "client", "purpose": CLIENT_PURPOSE, "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

def get_current_client(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("role") != "client" or payload.get("purpose") != CLIENT_PURPOSE:
            raise HTTPException(status_code=403, detail="Not a client token")
        client_id = int(payload.get("sub"))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


# ════════════════════════════════
# SET PASSWORD WITH TOKEN — public; the client follows the emailed link
# ════════════════════════════════
@router.post("/set-password-with-token", status_code=200)
def set_password_with_token(payload: ClientSetPasswordWithToken, db: Session = Depends(get_db)):
    invalid = HTTPException(status_code=400, detail="Invalid or expired link. Ask your freelancer to send a new invitation.")
    if len(payload.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(status_code=400, detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters.")
    try:
        claims = jwt.decode(payload.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise invalid
    if claims.get("purpose") != SET_PASSWORD_PURPOSE:
        raise invalid
    try:
        client = db.query(Client).filter(Client.id == int(claims.get("sub"))).first()
    except (TypeError, ValueError):
        raise invalid
    if not client or is_demo_client_email(client.email) or claims.get("pwd") != _pwd_marker(client):
        raise invalid

    client.password_hash = hash_password(payload.password)
    db.commit()
    return {"message": "Password set. You can now sign in to the client portal."}


# ════════════════════════════════
# CLIENT LOGIN
# ✅ email + password dono match — correct client milega
# ════════════════════════════════
@router.post("/login", response_model=ClientToken)
def client_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # All clients sharing this email; matched case-insensitively and ignoring surrounding spaces
    clients = db.query(Client).filter(
        func.lower(Client.email) == form_data.username.strip().lower(),
        Client.password_hash != None
    ).all()

    if not clients:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Jiska password match kare woh exact client
    matched_client = None
    for client in clients:
        if verify_password(form_data.password, client.password_hash):
            matched_client = client
            break

    if not matched_client:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_client_token(matched_client.id)
    return {"access_token": token, "token_type": "bearer"}


# ════════════════════════════════
# DEMO LOGIN — token for the demo client ONLY (no password exists for it)
# ════════════════════════════════
@router.post("/demo-login", response_model=ClientToken)
def client_demo_login(db: Session = Depends(get_db)):
    demo_user = db.query(User).filter(func.lower(User.email) == demo_user_email()).first()
    client = None
    if demo_user:
        client = db.query(Client).filter(
            Client.user_id == demo_user.id,
            func.lower(Client.email) == demo_client_email(),
        ).first()
    if not client:
        raise HTTPException(status_code=404, detail="The client demo is not available right now.")
    return {"access_token": create_client_token(client.id), "token_type": "bearer"}


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
# ✅ Data isolated by client_id — har client ka alag data
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