from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.schemas.conversation_schema import ConversationCreate, ConversationResponse
from app.services.conversation_service import (
    create_conversation,
    get_conversations,
    get_conversation,
    delete_conversation
)

router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.post("", response_model=ConversationResponse)
def add_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return create_conversation(db, current_user.id, payload.client_id)


@router.get("", response_model=list[ConversationResponse])
def read_conversations(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_conversations(db, current_user.id)


@router.get("/{conversation_id}", response_model=ConversationResponse)
def read_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    conversation = get_conversation(db, conversation_id, current_user.id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return conversation


@router.delete("/{conversation_id}")
def remove_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    conversation = delete_conversation(db, conversation_id, current_user.id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return {"message": "Conversation deleted successfully"}