from sqlalchemy.orm import Session
from app.models.client import Client

def create_client(db: Session, user_id: int, name: str, email: str = None, phone: str = None, company: str = None):
    client = Client(
        user_id=user_id,
        name=name,
        email=email,
        phone=phone,
        company=company
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client

def get_clients(db: Session, user_id: int):
    return db.query(Client).filter(Client.user_id == user_id).all()

def get_client(db: Session, client_id: int, user_id: int):
    return db.query(Client).filter(Client.id == client_id, Client.user_id == user_id).first()

def delete_client(db: Session, client_id: int, user_id: int):
    client = db.query(Client).filter(Client.id == client_id, Client.user_id == user_id).first()
    if client:
        db.delete(client)
        db.commit()
    return client