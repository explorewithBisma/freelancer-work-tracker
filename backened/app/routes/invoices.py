from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_db, get_current_user
from app.schemas.invoice_schema import InvoiceCreate, InvoiceResponse
from app.services.invoice_service import (
    create_invoice,
    get_invoices,
    get_invoice,
    delete_invoice
)
from app.models.invoice import Invoice

router = APIRouter(prefix="/invoices", tags=["Invoices"])


class InvoiceUpdate(BaseModel):
    status: Optional[str] = None


@router.post("", response_model=InvoiceResponse)
def add_invoice(
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    invoice = create_invoice(
        db,
        current_user.id,
        payload.client_id,
        payload.project_id,
        payload.invoice_number,
        payload.date_from,
        payload.date_to,
        payload.total_amount,
        payload.status
    )
    return invoice


@router.get("", response_model=list[InvoiceResponse])
def read_invoices(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_invoices(db, current_user.id)


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def read_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    invoice = get_invoice(db, invoice_id, current_user.id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


# ✅ NEW: Update invoice status
@router.patch("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: int,
    payload: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if payload.status:
        invoice.status = payload.status
    db.commit()
    db.refresh(invoice)
    return invoice


@router.delete("/{invoice_id}")
def remove_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    invoice = delete_invoice(db, invoice_id, current_user.id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Invoice deleted successfully"}