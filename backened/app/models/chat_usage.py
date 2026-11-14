from sqlalchemy import Column, Integer, String, Date
from app.database import Base


class ChatUsage(Base):
    """Daily AI-chat counters (per IP / per user / per client / global) for rate limiting.
    IPs are stored only as salted hashes."""
    __tablename__ = "chat_usage"

    scope         = Column(String(30), primary_key=True)
    subject       = Column(String(80), primary_key=True)
    usage_date    = Column(Date, primary_key=True)
    message_count = Column(Integer, nullable=False, default=0)
