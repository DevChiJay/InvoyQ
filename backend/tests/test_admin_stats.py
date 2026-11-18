"""GET /v1/admin/stats."""
from datetime import datetime, timedelta

import pytest

from app.api.v1.auth import create_access_token
from app.core.security import get_password_hash
from app.repositories.user_repository import UserRepository


@pytest.fixture
async def admin_headers(test_db):
    admin = await UserRepository(test_db).create_user(
        email="admin@example.com", full_name="Admin", hashed_password=get_password_hash("x1y2z3"), is_verified=True
    )
    await test_db.users.update_one({"email": "admin@example.com"}, {"$set": {"is_admin": True}})
    # Keep the admin out of the signup window being measured
    await test_db.users.update_many({"email": "admin@example.com"}, {"$set": {"created_at": datetime(2020, 1, 1)}})
    return {"Authorization": f"Bearer {create_access_token({'sub': admin.id})}"}


async def make_user(test_db, email, created_at, platform="web", referral=None, **extra):
    user = await UserRepository(test_db).create_user(
        email=email, full_name=email, hashed_password="x", is_verified=True,
        registration_source=platform, referral_source=referral,
    )
    await test_db.users.update_many({"email": email}, {"$set": {"created_at": created_at, **extra}})
    return user


async def add_invoice(test_db, user_id, created_at, n):
    await test_db.invoices.insert_one({"user_id": user_id, "number": f"INV-{n}", "created_at": created_at})


async def test_stats(client, test_db, admin_headers):
    now = datetime.utcnow()
    d20 = now - timedelta(days=20)
    fast = await make_user(test_db, "fast@x.com", d20, "ios", "instagram")
    slow = await make_user(test_db, "slow@x.com", d20, "android", "friend")
    await make_user(test_db, "idle@x.com", d20, "mobile")
    fresh = await make_user(test_db, "fresh@x.com", now - timedelta(days=2), "web", "other")
    await make_user(test_db, "fresh2@x.com", now - timedelta(days=1), "ios")
    await make_user(
        test_db, "pro@x.com", datetime(2021, 1, 1),
        is_pro=True, subscription_start_date=now - timedelta(days=3), subscription_end_date=None,
    )
    await make_user(
        test_db, "lapsed@x.com", datetime(2021, 1, 1),
        is_pro=True, subscription_end_date=now - timedelta(days=1),
    )
    # Legacy document without the field at all → counted as web
    await test_db.users.insert_one({"email": "ancient@x.com", "created_at": now - timedelta(days=5), "is_verified": False})

    await add_invoice(test_db, fast.id, d20 + timedelta(days=2), 1)
    await add_invoice(test_db, slow.id, d20 + timedelta(days=10), 2)
    await add_invoice(test_db, fresh.id, now - timedelta(days=1), 3)
    await add_invoice(test_db, fast.id, datetime(2021, 6, 1), 4)  # outside range

    await test_db.extractions.insert_many([
        {"user_id": fast.id, "created_at": now - timedelta(days=3)},
        {"user_id": None, "created_at": now - timedelta(days=3)},
        {"user_id": None, "created_at": datetime(2021, 1, 1)},
    ])

    r = await client.get("/v1/admin/stats", headers=admin_headers)
    assert r.status_code == 200, r.text
    body = r.json()

    assert body["range"]["to"] == now.date().isoformat()
    assert body["totals"] == {"users": 9, "verified_users": 8, "invoices": 4, "extractions": 3}

    new = body["new_users"]
    assert new["total"] == 6
    assert new["by_platform"] == {"web": 2, "ios": 2, "android": 1, "mobile": 1}
    assert new["by_referral"]["instagram"] == 1
    assert new["by_referral"]["friend"] == 1
    assert new["by_referral"]["other"] == 1
    assert new["by_referral"]["unknown"] == 3

    # fast + fresh activated; slow (day 10) and idle didn't; fresh2 and ancient are still in their window
    assert body["activation"] == {"cohort_size": 6, "activated": 2, "pending": 2, "rate": 0.5}

    assert body["invoices"] == {"created_in_range": 3}
    assert body["extractions"] == {"in_range": 2, "authenticated": 1, "anonymous": 1}
    assert body["pro"] == {"active": 1, "new_in_range": 1}


async def test_stats_custom_range(client, test_db, admin_headers):
    await make_user(test_db, "a@x.com", datetime(2025, 3, 10, 23, 59))
    await make_user(test_db, "b@x.com", datetime(2025, 3, 11, 0, 0))
    r = await client.get("/v1/admin/stats?from=2025-03-01&to=2025-03-10", headers=admin_headers)
    body = r.json()
    assert body["range"] == {"from": "2025-03-01", "to": "2025-03-10"}
    assert body["new_users"]["total"] == 1
    assert body["activation"]["rate"] == 0.0


async def test_stats_bad_range(client, admin_headers):
    r = await client.get("/v1/admin/stats?from=2025-03-10&to=2025-03-01", headers=admin_headers)
    assert r.status_code == 400


async def test_stats_requires_admin(client, auth_headers):
    r = await client.get("/v1/admin/stats", headers=auth_headers)
    assert r.status_code == 403
