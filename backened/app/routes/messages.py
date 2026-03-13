from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.schemas.message_schema import MessageCreate, MessageResponse
from app.services.message_service import create_message, get_messages_by_conversation, delete_message
from app.services.conversation_service import get_conversation

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.post("", response_model=MessageResponse)
def add_message(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    conversation = get_conversation(db, payload.conversation_id, current_user.id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return create_message(db, payload.conversation_id, payload.sender_type, payload.message)


@router.get("/conversation/{conversation_id}", response_model=list[MessageResponse])
def read_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    conversation = get_conversation(db, conversation_id, current_user.id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return get_messages_by_conversation(db, conversation_id)


@router.delete("/{message_id}")
def remove_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    msg = delete_message(db, message_id)

    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    return {"message": "Message deleted successfully"}