from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_db, get_current_user
from app.schemas.client import ClientCreate, ClientOut
from app.services.client_service import create_client, get_clients, get_client, delete_client
from app.models.client import Client

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
    current_user = Depends(get_current_user)
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


# ✅ NEW: Update client endpoint
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
    client = delete_client(db, client_id, current_user.id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted successfully"}