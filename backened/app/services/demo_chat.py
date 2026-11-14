from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.demo import CHAT_DAILY_CAP


def consume_demo_chat(db: Session, user_id: int, cap: int = CHAT_DAILY_CAP, commit: bool = True) -> bool:
    """Atomically count one demo chat message for today (UTC).

    Returns True if the message is allowed, False if the daily cap is reached.
    A single INSERT ... ON CONFLICT DO UPDATE ... WHERE keeps the check-and-increment
    race-free across concurrent serverless instances.
    """
    today = datetime.now(timezone.utc).date()
    row = db.execute(
        text(
            """
            INSERT INTO demo_chat_usage (user_id, usage_date, message_count)
            VALUES (:u, :d, 1)
            ON CONFLICT (user_id, usage_date) DO UPDATE
                SET message_count = demo_chat_usage.message_count + 1
                WHERE demo_chat_usage.message_count < :cap
            RETURNING message_count
            """
        ),
        {"u": user_id, "d": today, "cap": cap},
    ).first()
    if commit:
        db.commit()
    return row is not None
