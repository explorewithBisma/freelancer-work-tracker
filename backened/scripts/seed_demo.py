"""Create or reset the public demo account and its sample data (idempotent).

Only the demo user's data is touched. Usage (from backened/, venv active):
    python scripts/seed_demo.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal  # noqa: E402
from app.services.demo_seed import seed_demo  # noqa: E402

if __name__ == "__main__":
    db = SessionLocal()
    try:
        print("Demo seeded:", seed_demo(db))
    finally:
        db.close()
