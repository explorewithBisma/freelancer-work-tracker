from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.schemas.dashboard_schema import DashboardSummaryResponse
from app.services.dashboard_service import get_dashboard_summary

# ✅ FIX: Removed prefix="/dashboard" — main.py already adds it
router = APIRouter(tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def read_dashboard_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_dashboard_summary(db, current_user.id)