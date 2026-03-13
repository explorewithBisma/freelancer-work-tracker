from sqlalchemy.orm import Session
from app.models.conversation import Conversation

def create_conversation(db: Session, user_id: int, client_id: int):
    conversation = Conversation(
        user_id=user_id,
        client_id=client_id
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation

def get_conversations(db: Session, user_id: int):
    return db.query(Conversation).filter(Conversation.user_id == user_id).all()

def get_conversation(db: Session, conversation_id: int, user_id: int):
    return db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id
    ).first()

def delete_conversation(db: Session, conversation_id: int, user_id: int):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id
    ).first()

    if conversation:
        db.delete(conversation)
        db.commit()

    return conversation