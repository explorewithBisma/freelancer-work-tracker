from sqlalchemy import Column, Integer, Date, ForeignKey
from app.database import Base


class DemoChatUsage(Base):
    """Per-day AI chat message counter for the demo user (counted in the DB because
    serverless instances share no memory)."""
    __tablename__ = "demo_chat_usage"

    user_id       = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    usage_date    = Column(Date, primary_key=True)
    message_count = Column(Integer, nullable=False, default=0)
