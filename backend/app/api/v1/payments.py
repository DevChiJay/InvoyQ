from datetime import datetime, timedelta
from decimal import Decimal
from typing import Literal
import hmac
import hashlib
import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.payment import Payment
from app.services.paystack import create_subscription_payment_link as paystack_link, verify_payment as paystack_verify
from app.services.stripe import create_subscription_payment_link as stripe_link, verify_payment as stripe_verify
from app.schemas.user import UserRead
from app.core.config import settings
from app.utils.logger import get_logger
from pydantic import BaseModel

# Set up logging
logger = get_logger(__name__)

router = APIRouter()


class CreateSubscriptionRequest(BaseModel):
    provider: Literal["paystack", "stripe"] = "paystack"
    currency: str = "USD"
    callback_url: str | None = None


class SubscriptionResponse(BaseModel):
    payment_url: str
    reference: str


class VerifyPaymentRequest(BaseModel):
    reference: str
    provider: Literal["paystack", "stripe"] = "paystack"


@router.post("/subscription/create", response_model=SubscriptionResponse)
def create_pro_subscription(
    request: CreateSubscriptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a payment link for pro-tier subscription."""
    if current_user.is_pro and current_user.subscription_status == "active":
        raise HTTPException(status_code=400, detail="User already has an active pro subscription")
    
    # Define subscription pricing (you can make this configurable)
    amount = Decimal("29.99") if request.currency.upper() == "USD" else Decimal("12000")  # $29.99 or ₦12,000
    
    # Generate reference
    reference = f"pro_sub_{current_user.id}_{int(datetime.utcnow().timestamp())}"
    
    # Create payment record
    payment = Payment(
        user_id=current_user.id,
        payment_type="subscription",
        amount=amount,
        currency=request.currency.upper(),
        provider=request.provider,
        provider_ref=reference,
        status="pending",
        description="Pro Subscription Payment"
    )
    db.add(payment)
    db.commit()
    
    # Create payment link
    if request.provider == "paystack":
        payment_url = paystack_link(
            amount=amount,
            email=current_user.email,
            reference=reference,
            currency="NGN" if request.currency.upper() == "NGN" else "USD",
            callback_url=request.callback_url
        )
    else:
        payment_url = stripe_link(
            amount=amount,
            currency=request.currency.lower(),
            reference=reference
        )
    
    return SubscriptionResponse(payment_url=payment_url, reference=reference)


@router.post("/subscription/verify")
def verify_subscription_payment(
    request: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify subscription payment and activate pro tier."""
    # Find payment record
    payment = db.query(Payment).filter(
        Payment.provider_ref == request.reference,
        Payment.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Verify with provider
    if request.provider == "paystack":
        result = paystack_verify(request.reference)
        success = result.get("data", {}).get("status") == "success"
    else:
        result = stripe_verify(request.reference)
        success = result.get("payment_status") == "paid"
    
    if success:
        # Update payment status
        payment.status = "paid"
        payment.updated_at = datetime.utcnow()
        
        # Update user subscription
        current_user.is_pro = True
        current_user.subscription_status = "active"
        current_user.subscription_provider = request.provider
        current_user.subscription_provider_id = result.get("subscription_id") or request.reference
        current_user.subscription_start_date = datetime.utcnow()
        current_user.subscription_end_date = datetime.utcnow() + timedelta(days=30)  # Monthly
        current_user.subscription_updated_at = datetime.utcnow()
        
        db.commit()
        
        return {"message": "Subscription activated successfully", "is_pro": True}
    else:
        payment.status = "failed"
        payment.updated_at = datetime.utcnow()
        db.commit()
        raise HTTPException(status_code=400, detail="Payment verification failed")


@router.get("/subscription/status")
def get_subscription_status(
    current_user: User = Depends(get_current_user)
):
    """Get current user's subscription status."""
    return {
        "is_pro": current_user.is_pro,
        "subscription_status": current_user.subscription_status,
        "subscription_provider": current_user.subscription_provider,
        "subscription_start_date": current_user.subscription_start_date,
        "subscription_end_date": current_user.subscription_end_date,
        "days_remaining": (current_user.subscription_end_date - datetime.utcnow()).days if current_user.subscription_end_date else None
    }


@router.get("/history")
def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """Get user's payment history."""
    payments = db.query(Payment).filter(
        Payment.user_id == current_user.id
    ).order_by(Payment.created_at.desc()).limit(limit).offset(offset).all()
    
    return [
        {
            "id": p.id,
            "payment_type": p.payment_type,
            "amount": float(p.amount),
            "currency": p.currency,
            "provider": p.provider,
            "provider_ref": p.provider_ref,
            "status": p.status,
            "description": p.description,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        }
        for p in payments
    ]


@router.post("/webhook/paystack")
async def paystack_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Paystack webhook notifications with signature verification."""
    try:
        # Get raw body for signature verification
        body = await request.body()
        signature = request.headers.get("x-paystack-signature")
        
        if not signature:
            logger.warning("Paystack webhook received without signature")
            raise HTTPException(status_code=400, detail="Missing signature")
        
        # Verify webhook signature
        if not _verify_paystack_signature(body, signature):
            logger.warning("Paystack webhook signature verification failed")
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Parse payload
        try:
            payload = json.loads(body.decode('utf-8'))
        except json.JSONDecodeError:
            logger.error("Failed to parse Paystack webhook payload")
            raise HTTPException(status_code=400, detail="Invalid JSON payload")
        
        event = payload.get("event")
        data = payload.get("data", {})
        
        logger.info(f"Paystack webhook received: {event}")
        
        # Handle different webhook events
        if event == "charge.success":
            await _handle_paystack_charge_success(data, db)
        elif event == "subscription.create":
            await _handle_paystack_subscription_create(data, db)
        elif event == "subscription.disable":
            await _handle_paystack_subscription_disable(data, db)
        else:
            logger.info(f"Unhandled Paystack webhook event: {event}")
        
        return {"status": "received"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing Paystack webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


def _verify_paystack_signature(body: bytes, signature: str) -> bool:
    """Verify Paystack webhook signature using HMAC-SHA512."""
    if not settings.PAYSTACK_SECRET_KEY:
        logger.warning("PAYSTACK_SECRET_KEY not set, skipping signature verification")
        return True  # Allow for development/testing
    
    try:
        # Compute expected signature
        computed_signature = hmac.new(
            settings.PAYSTACK_SECRET_KEY.encode('utf-8'),
            body,
            hashlib.sha512
        ).hexdigest()
        
        # Compare signatures (time-safe comparison)
        return hmac.compare_digest(signature, computed_signature)
    except Exception as e:
        logger.error(f"Error verifying Paystack signature: {str(e)}")
        return False


async def _handle_paystack_charge_success(data: dict, db: Session):
    """Handle successful charge event from Paystack."""
    reference = data.get("reference")
    amount = data.get("amount", 0) / 100  # Convert from kobo to naira/dollars
    status = data.get("status")
    
    if not reference:
        logger.warning("Paystack charge.success event missing reference")
        return
    
    logger.info(f"Processing successful charge for reference: {reference}")
    
    # Find payment record
    payment = db.query(Payment).filter(
        Payment.provider_ref == reference,
        Payment.provider == "paystack"
    ).first()
    
    if not payment:
        logger.warning(f"Payment record not found for reference: {reference}")
        return
    
    # Verify payment wasn't already processed
    if payment.status == "paid":
        logger.info(f"Payment {reference} already processed")
        return
    
    # Update payment status
    payment.status = "paid"
    payment.updated_at = datetime.utcnow()
    
    # Get user and update subscription
    user = db.query(User).filter(User.id == payment.user_id).first()
    if not user:
        logger.error(f"User not found for payment {reference}")
        return
    
    # Activate pro subscription
    user.is_pro = True
    user.subscription_status = "active"
    user.subscription_provider = "paystack"
    user.subscription_provider_id = reference
    user.subscription_start_date = datetime.utcnow()
    user.subscription_end_date = datetime.utcnow() + timedelta(days=30)  # Monthly subscription
    user.subscription_updated_at = datetime.utcnow()
    
    try:
        db.commit()
        logger.info(f"Successfully activated pro subscription for user {user.id} (payment: {reference})")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update database for payment {reference}: {str(e)}")
        raise


async def _handle_paystack_subscription_create(data: dict, db: Session):
    """Handle subscription creation event from Paystack."""
    subscription_code = data.get("subscription_code")
    customer_email = data.get("customer", {}).get("email")
    
    logger.info(f"Paystack subscription created: {subscription_code} for {customer_email}")
    
    # Find user by email and update subscription info if needed
    if customer_email:
        user = db.query(User).filter(User.email == customer_email).first()
        if user and user.subscription_provider == "paystack":
            user.subscription_provider_id = subscription_code
            user.subscription_updated_at = datetime.utcnow()
            db.commit()


async def _handle_paystack_subscription_disable(data: dict, db: Session):
    """Handle subscription disable event from Paystack."""
    subscription_code = data.get("subscription_code")
    customer_email = data.get("customer", {}).get("email")
    
    logger.info(f"Paystack subscription disabled: {subscription_code} for {customer_email}")
    
    # Find user and disable subscription
    if customer_email:
        user = db.query(User).filter(User.email == customer_email).first()
        if user and user.subscription_provider_id == subscription_code:
            user.is_pro = False
            user.subscription_status = "cancelled"
            user.subscription_end_date = datetime.utcnow()
            user.subscription_updated_at = datetime.utcnow()
            db.commit()
            logger.info(f"Disabled pro subscription for user {user.id}")


@router.post("/webhook/stripe")
def stripe_webhook(payload: dict):
    """Handle Stripe webhook notifications."""
    # Verify webhook signature (implement according to Stripe docs)
    # For now, this is a placeholder
    event_type = payload.get("type")
    data = payload.get("data", {})
    
    if event_type == "checkout.session.completed":
        # Handle successful subscription
        pass
    
    return {"status": "received"}