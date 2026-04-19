from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.schemas.settings_schema import (
    ProfileUpdate, ProfileOut,
    PasswordChange,
    SettingsUpdate, SettingsOut,
)
from app.services.settings_service import (
    get_profile, update_profile,
    change_password,
    get_or_create_settings, update_settings,
)

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/profile", response_model=ProfileOut)
def read_profile(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    user = get_profile(db, current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/profile", response_model=ProfileOut)
def edit_profile(payload: ProfileUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    updated = update_profile(db, current_user.id, payload.dict(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated


@router.post("/change-password")
def update_password(payload: PasswordChange, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    result = change_password(db, current_user.id, payload.current_password, payload.new_password, payload.confirm_password)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "Password updated successfully"}


@router.get("/preferences", response_model=SettingsOut)
def read_settings(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_or_create_settings(db, current_user.id)


@router.patch("/preferences", response_model=SettingsOut)
def edit_settings(payload: SettingsUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return update_settings(db, current_user.id, payload.dict(exclude_none=True))