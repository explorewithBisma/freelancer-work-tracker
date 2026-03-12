from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.schemas.client import ClientCreate, ClientOut
from app.services.client_service import create_client, get_clients, get_client, delete_client

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.post("", response_model=ClientOut)
def add_client(
    payload: ClientCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    client = create_client(
        db,
        current_user.id,
        payload.name,
        payload.email,
        payload.phone,
        payload.company
    )
    return client


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