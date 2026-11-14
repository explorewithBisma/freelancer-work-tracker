from fastapi import APIRouter, Depends, HTTPException
from app.errors import conflict_on_integrity
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import logging

from app.dependencies import get_db, get_current_user
from app.schemas.client import ClientCreate, ClientOut
from app.services.client_service import create_client, get_clients, get_client, delete_client
from app.models.client import Client
from app.demo import is_demo_user, EMAIL_DISABLED_MESSAGE
from app.routes.client_portal import create_set_password_token
from app.services.email_service import send_client_portal_email, frontend_url

logger = logging.getLogger("app.clients")
router = APIRouter(prefix="/clients", tags=["Clients"])


class ClientUpdate(BaseModel):
    name:    Optional[str] = None
    email:   Optional[str] = None
    phone:   Optional[str] = None
    company: Optional[str] = None


@router.post("", response_model=ClientOut)
def add_client(
    payload: ClientCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)   #for chcking the user(freelancer) login , and have valid tokens

):
    return create_client(db, current_user.id, payload.name, payload.email, payload.phone, payload.company)


@router.get("", response_model=list[ClientOut])
def read_clients(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_clients(db, current_user.id)


@router.get("/{client_id}", response_model=ClientOut)
def read_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    client = get_client(db, client_id, current_user.id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


# NEW: Update client endpoint
@router.put("/{client_id}", response_model=ClientOut)
def update_client(
    client_id: int,
    payload: ClientUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    if payload.name    is not None: client.name    = payload.name
    if payload.email   is not None: client.email   = payload.email
    if payload.phone   is not None: client.phone   = payload.phone
    if payload.company is not None: client.company = payload.company
    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}")
def remove_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    with conflict_on_integrity(db, "This client has invoices. Delete them first."):
        client = delete_client(db, client_id, current_user.id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted successfully"}


# FREELANCER endpoint: emails the client a one-time "set your password" link.
# Lives under /clients (freelancer session). /client-portal/* is reserved for
# the client session and public client calls. No password is ever emailed.
@router.post("/{client_id}/portal-invite", status_code=200)
def invite_client_to_portal(
    client_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    if not client.email:
        raise HTTPException(status_code=400, detail="This client has no email address. Add one first.")

    if is_demo_user(current_user):
        # Demo: never contact Brevo, never issue a token.
        return {"message": EMAIL_DISABLED_MESSAGE, "email_sent": False, "demo": True}

    token = create_set_password_token(client)
    set_password_url = f"{frontend_url()}/client-set-password?token={token}"

    email_sent = False
    try:
        email_sent = send_client_portal_email(
            to_email         = client.email,
            client_name      = client.name,
            set_password_url = set_password_url,
            freelancer_name  = current_user.full_name,
        )
    except Exception:
        logger.exception("Portal invitation email failed for client %s", client.id)

    message = (
        f"Invitation sent to {client.email}."
        if email_sent else
        f"Could not send the email to {client.email}. Check the email settings and try again."
    )
    return {"message": message, "email_sent": email_sent}
