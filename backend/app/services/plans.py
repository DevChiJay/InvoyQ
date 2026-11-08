"""
Plan limits: who is Pro, what the Free plan allows, and monthly usage counting.

Usage is counted in the ``usage`` collection, one document per (user, "YYYY-MM") with an
``invoices`` and an ``extractions`` counter. A counter, rather than a recount of invoices,
means concurrent requests cannot overshoot the limit (the increment is a single atomic
update guarded by ``$lt: limit``) and deleting invoices does not hand the allowance back.

Months are calendar months in UTC and reset on the 1st.
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from app.core.config import settings

INVOICES = "invoices"
EXTRACTIONS = "extractions"
RESOURCES = (INVOICES, EXTRACTIONS)

_LABELS = {INVOICES: "invoices", EXTRACTIONS: "AI extractions"}


def is_pro_active(user: Any, now: Optional[datetime] = None) -> bool:
    """Pro means ``is_pro`` and a subscription that has not run out.

    No end date (an admin grant without an expiry) never lapses until it is revoked. A paid
    plan whose end date has passed counts as Free again without any cron job.
    """
    if not getattr(user, "is_pro", False):
        return False
    end = getattr(user, "subscription_end_date", None)
    if end is None:
        return True
    return end > (now or datetime.utcnow())


def limits_for(user: Any, now: Optional[datetime] = None) -> Dict[str, Optional[int]]:
    """Monthly limits for a user. ``None`` means unlimited."""
    if is_pro_active(user, now):
        return {INVOICES: None, EXTRACTIONS: settings.PRO_EXTRACTIONS_PER_MONTH}
    return {
        INVOICES: settings.FREE_INVOICES_PER_MONTH,
        EXTRACTIONS: settings.FREE_EXTRACTIONS_PER_MONTH,
    }


def period_for(now: Optional[datetime] = None) -> str:
    now = now or datetime.utcnow()
    return f"{now.year:04d}-{now.month:02d}"


def period_bounds(now: Optional[datetime] = None) -> tuple[datetime, datetime]:
    """[start, next_start) of the calendar month containing ``now``."""
    now = now or datetime.utcnow()
    start = datetime(now.year, now.month, 1)
    nxt = datetime(now.year + 1, 1, 1) if now.month == 12 else datetime(now.year, now.month + 1, 1)
    return start, nxt


def _reset_label(now: Optional[datetime] = None) -> str:
    reset = period_bounds(now)[1]
    return f"{reset.day} {reset:%b}"


def limit_reached_error(resource: str, limit: int, used: int, now: Optional[datetime] = None) -> HTTPException:
    """403 with a structured detail. ``message`` is plain English so any client can show it as is."""
    resets_at = period_bounds(now)[1]
    if resource == EXTRACTIONS:
        message = (
            f"You've used all {limit} AI extractions on the Free plan this month. "
            f"They reset on {_reset_label(now)}. Upgrade to Pro for unlimited extractions."
        )
    else:
        message = (
            f"You've reached the Free plan limit of {limit} {_LABELS[resource]} this month. "
            f"It resets on {_reset_label(now)}. Upgrade to Pro for unlimited invoices."
        )
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "code": "limit_reached",
            "resource": resource,
            "limit": limit,
            "used": used,
            "resets_at": resets_at.isoformat() + "Z",
            "message": message,
        },
    )


@dataclass(frozen=True)
class UsageTicket:
    """Receipt for one consumed unit, so a failed operation can give it back."""

    user_id: str
    period: str
    resource: str


class UsageService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.usage = db.usage

    async def _ensure_period(self, user_id: str, period: str, now: Optional[datetime]) -> Dict[str, Any]:
        """Return this month's usage document, creating it on first touch.

        A new document is seeded from what the user actually created this month, so turning
        limits on mid-month does not hand every existing user a fresh allowance.
        """
        doc = await self.usage.find_one({"user_id": user_id, "period": period})
        if doc:
            return doc
        start, end = period_bounds(now)
        created = {"$gte": start, "$lt": end}
        seed_invoices = await self.db.invoices.count_documents({"user_id": user_id, "created_at": created})
        seed_extractions = await self.db.extractions.count_documents({"user_id": user_id, "created_at": created})
        try:
            await self.usage.update_one(
                {"user_id": user_id, "period": period},
                {
                    "$setOnInsert": {
                        "user_id": user_id,
                        "period": period,
                        INVOICES: seed_invoices,
                        EXTRACTIONS: seed_extractions,
                        "created_at": datetime.utcnow(),
                    }
                },
                upsert=True,
            )
        except DuplicateKeyError:
            pass  # A concurrent request created it first; read theirs.
        return await self.usage.find_one({"user_id": user_id, "period": period}) or {}

    async def consume(self, user: Any, resource: str, now: Optional[datetime] = None) -> UsageTicket:
        """Use one unit of ``resource`` or raise the 403 limit error."""
        user_id = str(user.id)
        period = period_for(now)
        limit = limits_for(user, now)[resource]
        await self._ensure_period(user_id, period, now)

        if limit is None:
            await self.usage.update_one({"user_id": user_id, "period": period}, {"$inc": {resource: 1}})
        else:
            updated = await self.usage.find_one_and_update(
                {"user_id": user_id, "period": period, resource: {"$lt": limit}},
                {"$inc": {resource: 1}},
                return_document=ReturnDocument.AFTER,
            )
            if updated is None:
                doc = await self.usage.find_one({"user_id": user_id, "period": period}) or {}
                raise limit_reached_error(resource, limit, int(doc.get(resource, limit)), now)
        return UsageTicket(user_id=user_id, period=period, resource=resource)

    async def refund(self, ticket: UsageTicket) -> None:
        """Give a unit back, for example when the invoice insert or the OpenAI call failed."""
        await self.usage.update_one(
            {"user_id": ticket.user_id, "period": ticket.period, ticket.resource: {"$gt": 0}},
            {"$inc": {ticket.resource: -1}},
        )

    async def summary(self, user: Any, now: Optional[datetime] = None) -> Dict[str, Any]:
        """Shape returned by ``GET /v1/usage``."""
        user_id = str(user.id)
        period = period_for(now)
        doc = await self._ensure_period(user_id, period, now)
        limits = limits_for(user, now)
        return {
            "plan": "pro" if is_pro_active(user, now) else "free",
            "period": period,
            "resets_at": period_bounds(now)[1].isoformat() + "Z",
            INVOICES: {"used": int(doc.get(INVOICES, 0)), "limit": limits[INVOICES]},
            EXTRACTIONS: {"used": int(doc.get(EXTRACTIONS, 0)), "limit": limits[EXTRACTIONS]},
            "payments_enabled": settings.PAYMENTS_ENABLED,
        }
