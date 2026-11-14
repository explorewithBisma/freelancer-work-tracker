"""Demo-account helpers (public portfolio demo).

The demo freelancer and the demo client are identified by email. Identification
is deliberately dependency-free (no model imports) so models/routes can use it.
"""
import os

from fastapi import HTTPException

DEMO_USER_NAME = "Demo Freelancer"
CHAT_DAILY_CAP = 30
CHAT_LIMIT_MESSAGE = "Demo chat limit reached for today — try again tomorrow."
EMAIL_DISABLED_MESSAGE = "Email sending is disabled in the demo."


def demo_user_email() -> str:
    return os.getenv("DEMO_USER_EMAIL", "demo@fwt-demo.com").strip().lower()


def demo_client_email() -> str:
    return os.getenv("DEMO_CLIENT_EMAIL", "demo-client@fwt-demo.com").strip().lower()


def _norm(email) -> str:
    return (email or "").strip().lower()


def is_demo_email(email) -> bool:
    return _norm(email) == demo_user_email()


def is_demo_client_email(email) -> bool:
    return _norm(email) == demo_client_email()


def is_demo_user(user) -> bool:
    return user is not None and is_demo_email(getattr(user, "email", None))


def is_demo_domain(email) -> bool:
    """True for any address on the demo domain; nothing is ever emailed there."""
    return _norm(email).endswith("@fwt-demo.com")


def block_demo(user, message: str) -> None:
    """Raise 403 with a friendly message if `user` is the demo user."""
    if is_demo_user(user):
        raise HTTPException(status_code=403, detail=message)
