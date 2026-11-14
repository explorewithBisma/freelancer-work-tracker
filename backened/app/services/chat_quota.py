"""Database-backed daily quotas for the AI chat endpoints.

Serverless instances share no memory, so every counter lives in the database and is
bumped with a single atomic INSERT ... ON CONFLICT DO UPDATE ... WHERE count < cap.
All counters for one request are bumped in ONE transaction: if any limit is hit, the
whole transaction is rolled back, so a rejected message never consumes anyone's allowance.
"""
import hashlib
import hmac
import ipaddress
import os
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple

from fastapi import Request
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.demo import CHAT_LIMIT_MESSAGE
from app.services.demo_chat import consume_demo_chat

# scope names
LANDING_IP, LANDING_GLOBAL, AI_GLOBAL, USER, CLIENT = "landing_ip", "landing_global", "ai_global", "user", "client"

BUSY_MESSAGE = "The assistant is very busy today — please try again tomorrow."
LANDING_IP_MESSAGE = "You've reached today's free chat limit — please try again tomorrow."
UNAVAILABLE_MESSAGE = "The assistant is temporarily unavailable. Please try again later."


def _cap(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except ValueError:
        return default


# Read on every call so the caps can be tuned with env vars (no redeploy logic needed).
def user_cap() -> int: return _cap("CHAT_USER_DAILY_CAP", 200)
def client_cap() -> int: return _cap("CHAT_CLIENT_DAILY_CAP", 50)
def landing_ip_cap() -> int: return _cap("LANDING_IP_DAILY_CAP", 10)
def landing_global_cap() -> int: return _cap("LANDING_GLOBAL_DAILY_CAP", 300)
def global_cap() -> int: return _cap("CHAT_GLOBAL_DAILY_CAP", 1000)


def limit_message(scope: str, cap: int) -> str:
    if scope == LANDING_IP:
        return LANDING_IP_MESSAGE
    if scope in (LANDING_GLOBAL, AI_GLOBAL):
        return BUSY_MESSAGE
    if scope == USER:
        return f"You've reached today's AI assistant limit ({cap} messages). It resets at midnight UTC."
    if scope == CLIENT:
        return f"You've reached today's assistant limit ({cap} messages). Please try again tomorrow."
    return BUSY_MESSAGE


def _consume(db: Session, scope: str, subject: str, cap: int) -> bool:
    """Atomically count one message for today (UTC). No commit. False if the cap is reached."""
    row = db.execute(
        text(
            """
            INSERT INTO chat_usage (scope, subject, usage_date, message_count)
            VALUES (:s, :sub, :d, 1)
            ON CONFLICT (scope, subject, usage_date) DO UPDATE
                SET message_count = chat_usage.message_count + 1
                WHERE chat_usage.message_count < :cap
            RETURNING message_count
            """
        ),
        {"s": scope, "sub": subject, "d": datetime.now(timezone.utc).date(), "cap": cap},
    ).first()
    return row is not None


def admit(db: Session, checks: List[Tuple[str, str, int]], demo_user_id: Optional[int] = None) -> Optional[str]:
    """Run all quota checks in one transaction.

    Returns None if the message is allowed (and commits the counters), otherwise the
    friendly message to show (and rolls everything back, consuming nothing).
    The global AI ceiling is always checked last.
    """
    all_checks = list(checks) + [(AI_GLOBAL, "all", global_cap())]
    try:
        if demo_user_id is not None and not consume_demo_chat(db, demo_user_id, commit=False):
            db.rollback()
            return CHAT_LIMIT_MESSAGE
        for scope, subject, cap in all_checks:
            if not _consume(db, scope, subject, cap):
                db.rollback()
                return limit_message(scope, cap)
        db.commit()
        return None
    except Exception:
        db.rollback()
        # Fail closed: if the counters can't be read, don't spend Groq quota.
        return UNAVAILABLE_MESSAGE


def client_ip(request: Request) -> str:
    """Caller IP. On Vercel, x-real-ip / x-forwarded-for are set by the platform (not by the visitor)."""
    ip = (request.headers.get("x-real-ip") or "").strip()
    if not ip:
        ip = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
    if not ip and request.client:
        ip = request.client.host or ""
    return ip


def ip_subject(ip: str) -> str:
    """Salted hash of the IP (raw IPs are never stored). IPv6 is grouped by /64."""
    try:
        addr = ipaddress.ip_address(ip)
        if addr.version == 6:
            ip = str(ipaddress.ip_network(f"{ip}/64", strict=False).network_address)
    except ValueError:
        ip = ip or "unknown"
    key = hashlib.sha256(f"chat-ip:{settings.SECRET_KEY}".encode()).digest()
    return hmac.new(key, ip.encode(), hashlib.sha256).hexdigest()[:32]


def purge_old_usage(db: Session, keep_days: int = 2) -> int:
    cutoff = datetime.now(timezone.utc).date() - timedelta(days=keep_days)
    n = db.execute(text("DELETE FROM chat_usage WHERE usage_date < :c"), {"c": cutoff}).rowcount
    db.commit()
    return n
