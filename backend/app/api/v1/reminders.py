from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_database
from app.dependencies.auth import get_current_user
from app.repositories.user_repository import UserInDB
from app.repositories.invoice_repository import InvoiceRepository

router = APIRouter()


@router.post("/send-reminder")
async def send_reminder(
    invoice_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Send a payment reminder for an invoice.
    
    Updates invoice status to 'sent' if currently 'draft'.
    Returns queued status for reminder.
    """
    repo = InvoiceRepository(db)
    
    inv = await repo.get_by_id_and_user(
        invoice_id=invoice_id,
        user_id=str(current_user.id)
    )
    
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # For now, just set status to 'sent' if draft
    if inv.status == "draft":
        from app.schemas.invoice_mongo import InvoiceUpdate
        await repo.update_invoice(
            invoice_id=invoice_id,
            user_id=str(current_user.id),
            invoice_data=InvoiceUpdate(status="sent")
        )

    return {"status": "queued", "invoice_id": invoice_id}
