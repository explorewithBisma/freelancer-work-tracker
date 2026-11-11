from fastapi import APIRouter, Depends, HTTPException, status
#for organizing all endpoints, unauthorized access 401 , 404 status no found
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
#for username , password , for chcking the bearer in header
from sqlalchemy.orm import Session
#tool of sqlalchemy for transaction with db like read and write 
from pydantic import BaseModel, EmailStr
import logging
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError

from app.dependencies import get_db
from app.schemas.user import UserCreate, UserOut
from app.schemas.auth import Token
from app.services.user_service import get_user_by_email, create_user, get_user_by_id
from app.services.auth_service import verify_password, create_access_token, hash_password
from app.services.email_service import send_reset_email
from app.config import settings
from app.models.user import User

logger = logging.getLogger("app.auth")
router = APIRouter(tags=["Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
SECRET_KEY = settings.SECRET_KEY
ALGORITHM  = settings.ALGORITHM

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

RESET_PURPOSE = "password_reset"
RESET_TOKEN_MINUTES = 30


def _create_reset_token(user: User) -> str:
    # Embeds a slice of the current password hash so the token stops working
    # once the password changes (single use).
    claims = {
        "sub": str(user.id),
        "purpose": RESET_PURPOSE,
        "pwd": user.password_hash[-10:],
        "exp": datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_MINUTES),
    }
    return jwt.encode(claims, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = create_user(db, payload.full_name, payload.email, payload.password)
    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def get_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("purpose") or payload.get("role"):
            raise ValueError("not an access token")
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/forgot-password", status_code=200)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    generic = {"message": "If this email is registered, a reset link has been sent."}
    user = get_user_by_email(db, payload.email)
    if not user:
        return generic
    try:
        send_reset_email(payload.email, _create_reset_token(user))
    except Exception:
        logger.exception("Reset email failed for %s", payload.email)
    return generic


@router.post("/reset-password", status_code=200)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    invalid = HTTPException(status_code=400, detail="Invalid or expired reset token")
    try:
        claims = jwt.decode(payload.token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise invalid
    if claims.get("purpose") != RESET_PURPOSE:
        raise invalid
    try:
        user = get_user_by_id(db, int(claims.get("sub")))
    except (TypeError, ValueError):
        raise invalid
    if not user or claims.get("pwd") != user.password_hash[-10:]:
        raise invalid
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password reset successfully! You can now login with your new password."}
