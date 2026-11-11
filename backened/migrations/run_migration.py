"""Run a .sql migration file against DATABASE_URL inside ONE transaction.

Usage (from backened/):
    python migrations/run_migration.py migrations/001_fk_rules_and_invoice_project_name.sql

All statements succeed or none are applied.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine  # noqa: E402

if __name__ == "__main__":
    path = sys.argv[1]
    sql = open(path, encoding="utf-8").read()
    with engine.begin() as conn:  # commits on success, rolls back on any error
        conn.exec_driver_sql(sql)
    print(f"Applied {path}")
