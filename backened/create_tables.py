"""
One-time dev setup: create all tables on a fresh database.

This is NOT a migration tool — it only runs CREATE TABLE IF NOT EXISTS for
every model class currently registered on SQLAlchemy's Base.metadata, and
does nothing for a table that already exists (no column diffing, no
altering existing tables). Use it once against an empty database.
For schema changes after that, hand-write the ALTER statements (see
Database/fwt database.sql for prior examples) or introduce a real
migration tool such as Alembic — this script deliberately does not
attempt to replace one.

Usage (from backened/, with the venv active):
    python create_tables.py
"""

# Import app.main (not just app.database) so every route/service module is
# loaded, which transitively imports every model module. SQLAlchemy only
# creates tables for models that have actually been imported and registered
# on Base.metadata by the time create_all() runs.
import app.main  # noqa: F401
from app.database import Base, engine

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    tables = sorted(Base.metadata.tables.keys())
    print(f"Created/verified {len(tables)} tables:")
    for name in tables:
        print(f"  - {name}")
