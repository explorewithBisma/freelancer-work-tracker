from sqlalchemy.orm import Session
from app.models.message import Message

def create_message(db: Session, conversation_id: int, sender_type: str, message: str):
    msg = Message(
        conversation_id=conversation_id,
        sender_type=sender_type,
        message=message
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

def get_messages_by_conversation(db: Session, conversation_id: int):
    return db.query(Message).filter(Message.conversation_id == conversation_id).all()

def delete_message(db: Session, message_id: int):
    msg = db.query(Message).filter(Message.id == message_id).first()

    if msg:
        db.delete(msg)
        db.commit()

    return msg