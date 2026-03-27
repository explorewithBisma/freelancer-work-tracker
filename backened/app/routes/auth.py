from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.user import UserCreate, UserOut
from app.schemas.auth import Token
from app.services.user_service import get_user_by_email, create_user
from app.services.auth_service import verify_password, create_access_token

# FIXED: Removed the prefix="/auth" here because it is already in main.py
# This prevents the "double auth" (auth/auth/login) error.
router = APIRouter(tags=["Auth"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = create_user(db, payload.full_name, payload.email, payload.password)

    # Returning the user object directly works with your UserOut schema
    return user

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # form_data.username is used by OAuth2PasswordRequestForm for the email field
    user = get_user_by_email(db, form_data.username)

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Creating the JWT token for the session
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}