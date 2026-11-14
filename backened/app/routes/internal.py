import hmac
import os

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.services.demo_seed import seed_demo
from app.services.chat_quota import purge_old_usage

router = APIRouter(prefix="/internal", tags=["Internal"], include_in_schema=False)


@router.get("/demo-reset")
def demo_reset(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Daily demo reset, called by Vercel Cron, which sends `Authorization: Bearer $CRON_SECRET`."""
    secret = os.getenv("CRON_SECRET")
    if not secret:
        raise HTTPException(status_code=503, detail="Demo reset is not configured")
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization")
    if not hmac.compare_digest(authorization.encode(), f"Bearer {secret}".encode()):
        raise HTTPException(status_code=403, detail="Forbidden")
    seeded = seed_demo(db)
    return {"status": "ok", "seeded": seeded, "purged_usage_rows": purge_old_usage(db)}
