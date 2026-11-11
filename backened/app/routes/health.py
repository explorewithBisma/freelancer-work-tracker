from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.dependencies import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    # No DB access: safe for Render's health check and keeps Neon asleep.
    return {"status": "ok"}


@router.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "connected"}
