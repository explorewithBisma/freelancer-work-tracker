from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import secrets, hashlib, os
from datetime import datetime, timedelta
from jose import jwt, JWTError

from app.dependencies import get_db
from app.schemas.user import UserCreate, UserOut
from app.schemas.auth import Token
from app.services.user_service import get_user_by_email, create_user, get_user_by_id
from app.services.auth_service import verify_password, create_access_token, hash_password
from app.services.email_service import send_reset_email

router = APIRouter(tags=["Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM  = "HS256"

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

_reset_tokens: dict = {}


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
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token")
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/forgot-password", status_code=200)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if not user:
        return {"message": "If this email is registered, a reset link has been sent."}
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    _reset_tokens[token_hash] = {
        "email": payload.email,
        "expires_at": datetime.utcnow() + timedelta(minutes=15)
    }
    try:
        send_reset_email(payload.email, raw_token)
    except Exception as e:
        print(f"Email sending failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email. Try again later.")
    return {"message": "If this email is registered, a reset link has been sent."}


@router.post("/reset-password", status_code=200)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    token_data = _reset_tokens.get(token_hash)
    if not token_data:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if datetime.utcnow() > token_data["expires_at"]:
        del _reset_tokens[token_hash]
        raise HTTPException(status_code=400, detail="Reset token has expired. Request a new one.")
    user = get_user_by_email(db, token_data["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    del _reset_tokens[token_hash]
    return {"message": "Password reset successfully! You can now login with your new password."}