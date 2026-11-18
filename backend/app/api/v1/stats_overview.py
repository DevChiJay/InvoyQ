"""
Public growth stats: signups by platform and referral source, activation, invoices,
AI extractions and Pro. Read-only and unauthenticated (polled by an external agent), so it
returns counts only: never emails, names, ids or the referral free text. Rate-limited per IP.
"""

from datetime import date, datetime, time, timedelta
from typing import Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from app.core.rate_limiter import stats_rate_limiter
from app.db.mongo import get_database
from app.schemas.user import REFERRAL_SOURCES
from app.utils.platform import CLIENT_PLATFORMS, LEGACY_MOBILE

router = APIRouter()

ACTIVATION_WINDOW = timedelta(days=7)
DEFAULT_RANGE_DAYS = 30
UNKNOWN_REFERRAL = "unknown"


class StatsRange(BaseModel):
    from_: date = Field(serialization_alias="from")
    to: date


class StatsTotals(BaseModel):
    users: int
    verified_users: int
    invoices: int
    extractions: int


class NewUsers(BaseModel):
    total: int
    # web / ios / android, plus "mobile" for accounts made by app builds before platform tracking
    by_platform: Dict[str, int]
    # "unknown" = didn't answer (web signups, older app builds, skipped)
    by_referral: Dict[str, int]


class Activation(BaseModel):
    """Signups in range that created an invoice within 7 days of signing up."""
    cohort_size: int
    activated: int
    # Signed up less than 7 days ago and no invoice yet: still has time, so left out of the rate
    pending: int
    # activated / (cohort_size - pending); None when nobody's window has closed yet
    rate: Optional[float] = None


class InvoiceStats(BaseModel):
    created_in_range: int


class ExtractionStats(BaseModel):
    in_range: int
    authenticated: int
    anonymous: int  # landing-page demo


class ProStats(BaseModel):
    active: int  # same rule as plans.is_pro_active: is_pro and not past subscription_end_date
    new_in_range: int  # subscription_start_date in range


class StatsOverviewOut(BaseModel):
    range: StatsRange
    totals: StatsTotals
    new_users: NewUsers
    activation: Activation
    invoices: InvoiceStats
    extractions: ExtractionStats
    pro: ProStats


def _bounds(from_: Optional[date], to: Optional[date], now: datetime) -> tuple[date, date, datetime, datetime]:
    """Whole UTC days, both ends inclusive. Returns the dates and the [start, end) datetimes."""
    to = to or now.date()
    from_ = from_ or (to - timedelta(days=DEFAULT_RANGE_DAYS - 1))
    if from_ > to:
        raise HTTPException(status_code=400, detail="'from' must be on or before 'to'")
    return from_, to, datetime.combine(from_, time.min), datetime.combine(to + timedelta(days=1), time.min)


async def _counts_by(db: AsyncIOMotorDatabase, match: dict, field: str) -> Dict[Optional[str], int]:
    pipeline = [{"$match": match}, {"$group": {"_id": f"${field}", "n": {"$sum": 1}}}]
    return {row["_id"]: row["n"] async for row in db.users.aggregate(pipeline)}


async def _activation(db: AsyncIOMotorDatabase, window: dict, now: datetime) -> Activation:
    window_ms = int(ACTIVATION_WINDOW.total_seconds() * 1000)
    pipeline = [
        {"$match": {"created_at": window}},
        {"$project": {"created_at": 1, "uid": {"$toString": "$_id"}}},
        {
            "$lookup": {
                "from": "invoices",
                "let": {"uid": "$uid", "deadline": {"$add": ["$created_at", window_ms]}},
                "pipeline": [
                    {"$match": {"$expr": {"$and": [
                        {"$eq": ["$user_id", "$$uid"]},
                        {"$lt": ["$created_at", "$$deadline"]},
                    ]}}},
                    {"$limit": 1},
                    {"$project": {"_id": 1}},
                ],
                "as": "first_invoice",
            }
        },
        {"$project": {"created_at": 1, "activated": {"$gt": [{"$size": "$first_invoice"}, 0]}}},
    ]
    cohort = activated = pending = 0
    window_open_since = now - ACTIVATION_WINDOW
    async for row in db.users.aggregate(pipeline):
        cohort += 1
        if row["activated"]:
            activated += 1
        elif row["created_at"] > window_open_since:
            pending += 1
    decided = cohort - pending
    return Activation(
        cohort_size=cohort,
        activated=activated,
        pending=pending,
        rate=round(activated / decided, 4) if decided else None,
    )


@router.get(
    "/overview",
    response_model=StatsOverviewOut,
    response_model_by_alias=True,
    dependencies=[Depends(stats_rate_limiter.dependency())],
)
async def get_stats(
    from_: Optional[date] = Query(None, alias="from", description="First day (UTC), default 30 days before 'to'"),
    to: Optional[date] = Query(None, description="Last day (UTC, inclusive), default today"),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Growth stats for a date range. Public (no auth), read-only, counts only."""
    now = datetime.utcnow()
    from_, to, start, end = _bounds(from_, to, now)
    window = {"$gte": start, "$lt": end}
    new_user_match = {"created_at": window}

    by_platform: Dict[str, int] = {p: 0 for p in (*CLIENT_PLATFORMS, LEGACY_MOBILE)}
    for source, n in (await _counts_by(db, new_user_match, "registration_source")).items():
        key = source or "web"  # accounts from before the field existed defaulted to web
        by_platform[key] = by_platform.get(key, 0) + n

    by_referral: Dict[str, int] = {r: 0 for r in (*REFERRAL_SOURCES, UNKNOWN_REFERRAL)}
    for source, n in (await _counts_by(db, new_user_match, "referral_source")).items():
        key = source or UNKNOWN_REFERRAL
        by_referral[key] = by_referral.get(key, 0) + n

    pro_active_query = {
        "is_pro": True,
        "$or": [{"subscription_end_date": None}, {"subscription_end_date": {"$gt": now}}],
    }
    extractions_in_range = await db.extractions.count_documents({"created_at": window})
    anonymous = await db.extractions.count_documents({"created_at": window, "user_id": None})

    return StatsOverviewOut(
        range=StatsRange(from_=from_, to=to),
        totals=StatsTotals(
            users=await db.users.count_documents({}),
            verified_users=await db.users.count_documents({"is_verified": True}),
            invoices=await db.invoices.count_documents({}),
            extractions=await db.extractions.count_documents({}),
        ),
        new_users=NewUsers(
            total=sum(by_platform.values()),
            by_platform=by_platform,
            by_referral=by_referral,
        ),
        activation=await _activation(db, window, now),
        invoices=InvoiceStats(created_in_range=await db.invoices.count_documents({"created_at": window})),
        extractions=ExtractionStats(
            in_range=extractions_in_range,
            authenticated=extractions_in_range - anonymous,
            anonymous=anonymous,
        ),
        pro=ProStats(
            active=await db.users.count_documents(pro_active_query),
            new_in_range=await db.users.count_documents({"subscription_start_date": window}),
        ),
    )
