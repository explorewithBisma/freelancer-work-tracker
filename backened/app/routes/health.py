from fastapi import APIRouter,Depends
from sqlalchemy import text
from sqlalchemy.orm import session
from app.dependencies import get_db
router=APIRouter(tags=["health"])
@router.get("/health")
def health(db: session= Depends(get_db)):
    db.execute(text("SELECT 1"))
    return{
        "status":"ok", "db":"connected"
    }