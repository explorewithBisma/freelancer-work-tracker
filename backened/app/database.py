from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")

# Neon/Heroku-style URLs use postgres://; SQLAlchemy requires postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# True on Vercel's serverless runtime (the platform sets VERCEL=1).
IS_VERCEL = bool(os.environ.get("VERCEL"))

if IS_VERCEL:
    # Serverless: each invocation may be a fresh instance, so don't hold a pool.
    # Use Neon's "-pooler" (PgBouncer) host to keep connection counts low.
    engine = create_engine(DATABASE_URL, poolclass=NullPool)
else:
    # pool_pre_ping / pool_recycle: Neon suspends idle compute and drops connections.
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()