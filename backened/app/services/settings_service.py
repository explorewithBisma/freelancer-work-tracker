from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext

from app.models.user import User
from app.models.settings_model import UserSettings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ══════════════════════════════════════════
# PROFILE SERVICE
# ══════════════════════════════════════════
def get_profile(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def update_profile(db: Session, user_id: int, data: dict):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


# ══════════════════════════════════════════
# PASSWORD SERVICE
# ══════════════════════════════════════════
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def change_password(db: Session, user_id: int, current_pw: str, new_pw: str, confirm_pw: str):
    if new_pw != confirm_pw:
        return {"error": "Passwords do not match"}
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}
    if not verify_password(current_pw, user.password_hash):
        return {"error": "Current password is incorrect"}
    user.password_hash = hash_password(new_pw)
    db.commit()
    return {"success": True}


# ══════════════════════════════════════════
# USER SETTINGS SERVICE
# ══════════════════════════════════════════
def get_or_create_settings(db: Session, user_id: int):
    # Pehle check karo — already exist karta hai?
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if settings:
        return settings

    # Nahi mila — try to create, but race condition se bachao
    try:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
        return settings
    except IntegrityError:
        # Duplicate entry — doosri request ne pehle insert kar diya
        db.rollback()
        return db.query(UserSettings).filter(UserSettings.user_id == user_id).first()


def update_settings(db: Session, user_id: int, data: dict):
    settings = get_or_create_settings(db, user_id)
    for key, value in data.items():
        if value is not None:
            setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings