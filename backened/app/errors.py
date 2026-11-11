from contextlib import contextmanager

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session


@contextmanager
def conflict_on_integrity(db: Session, message: str):
    """Turn a database integrity error (e.g. a blocking foreign key) into a 409
    with a user-friendly message instead of a 500."""
    try:
        yield
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=message)
