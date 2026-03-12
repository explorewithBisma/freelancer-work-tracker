from sqlalchemy.orm import Session
from app.models.invoice import Invoice

def create_invoice(
    db: Session,
    user_id: int,
    client_id: int,
    project_id: int = None,
    invoice_number: str = "",
    date_from=None,
    date_to=None,
    total_amount: float = 0.0,
    status: str = "draft"
):
    invoice = Invoice(
        user_id=user_id,
        client_id=client_id,
        project_id=project_id,
        invoice_number=invoice_number,
        date_from=date_from,
        date_to=date_to,
        total_amount=total_amount,
        status=status
    )

    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


def get_invoices(db: Session, user_id: int):
    return db.query(Invoice).filter(Invoice.user_id == user_id).all()


def get_invoice(db: Session, invoice_id: int, user_id: int):
    return db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == user_id
    ).first()


def delete_invoice(db: Session, invoice_id: int, user_id: int):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == user_id
    ).first()

    if invoice:
        db.delete(invoice)
        db.commit()

    return invoice