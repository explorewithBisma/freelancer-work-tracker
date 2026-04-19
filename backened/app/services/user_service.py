from sqlalchemy.orm import Session
from app.models.user import User
from passlib.context import CryptContext

# ✅ FIX: hash_password directly here — removes circular import with auth_service
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, full_name: str, email: str, password: str):
    hashed = _pwd_context.hash(password)

    user = User(
        full_name=full_name,
        email=email,
        password_hash=hashed
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()