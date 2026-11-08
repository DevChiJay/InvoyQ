"""Admin tools for upgrading users to Pro: single grant, revoke and bulk."""
from datetime import datetime, timedelta

import pytest

from app.api.v1.auth import create_access_token
from app.core.security import get_password_hash
from app.repositories.user_repository import UserRepository
from app.services.plans import is_pro_active


@pytest.fixture
async def admin_headers(test_db):
    repo = UserRepository(test_db)
    admin = await repo.create_user(
        email="admin@example.com", full_name="Admin", hashed_password=get_password_hash("x1y2z3"), is_verified=True
    )
    await test_db.users.update_one({"email": "admin@example.com"}, {"$set": {"is_admin": True}})
    return {"Authorization": f"Bearer {create_access_token({'sub': admin.id})}"}


async def make_user(test_db, email: str):
    return await UserRepository(test_db).create_user(
        email=email, full_name=email.split("@")[0], hashed_password=get_password_hash("x1y2z3"), is_verified=True
    )


async def test_grant_sets_everything_a_paid_plan_would(client, admin_headers, test_db, test_user):
    response = await client.patch(
        f"/v1/admin/users/{test_user.id}", json={"is_pro": True, "pro_days": 30}, headers=admin_headers
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["is_pro"] is True and body["pro_active"] is True
    assert body["subscription_status"] == "active"
    assert body["subscription_provider"] == "admin"
    end = datetime.fromisoformat(body["subscription_end_date"])
    assert timedelta(days=29) < end - datetime.utcnow() < timedelta(days=31)

    user = await UserRepository(test_db).get_by_id(test_user.id)
    assert is_pro_active(user)


async def test_grant_without_days_has_no_end_date(client, admin_headers, test_user):
    response = await client.patch(f"/v1/admin/users/{test_user.id}", json={"is_pro": True}, headers=admin_headers)
    body = response.json()
    assert body["subscription_end_date"] is None
    assert body["pro_active"] is True


async def test_revoke_returns_to_free(client, admin_headers, test_user_pro):
    response = await client.patch(f"/v1/admin/users/{test_user_pro.id}", json={"is_pro": False}, headers=admin_headers)
    body = response.json()
    assert body["is_pro"] is False and body["pro_active"] is False
    assert body["subscription_status"] == "cancelled"


async def test_granted_user_gets_unlimited_plan(client, admin_headers, test_user, auth_headers):
    assert (await client.get("/v1/usage", headers=auth_headers)).json()["plan"] == "free"
    await client.patch(f"/v1/admin/users/{test_user.id}", json={"is_pro": True}, headers=admin_headers)
    usage = (await client.get("/v1/usage", headers=auth_headers)).json()
    assert usage["plan"] == "pro"
    assert usage["invoices"]["limit"] is None


async def test_bulk_grant_by_id_and_email_reports_missing(client, admin_headers, test_db, test_user):
    other = await make_user(test_db, "other@example.com")
    response = await client.post(
        "/v1/admin/users/bulk-pro",
        json={
            "user_ids": [test_user.id, "not-an-id"],
            "emails": ["OTHER@example.com", "ghost@example.com"],
            "days": 90,
        },
        headers=admin_headers,
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["updated"] == 2
    assert sorted(body["not_found"]) == ["ghost@example.com", "not-an-id"]
    repo = UserRepository(test_db)
    assert is_pro_active(await repo.get_by_id(test_user.id))
    assert is_pro_active(await repo.get_by_id(other.id))


async def test_bulk_revoke(client, admin_headers, test_db, test_user_pro):
    response = await client.post(
        "/v1/admin/users/bulk-pro", json={"emails": [test_user_pro.email], "is_pro": False}, headers=admin_headers
    )
    assert response.json()["updated"] == 1
    assert not is_pro_active(await UserRepository(test_db).get_by_id(test_user_pro.id))


async def test_bulk_needs_targets_and_respects_the_cap(client, admin_headers):
    assert (await client.post("/v1/admin/users/bulk-pro", json={}, headers=admin_headers)).status_code == 400
    too_many = {"emails": [f"u{i}@example.com" for i in range(201)]}
    assert (await client.post("/v1/admin/users/bulk-pro", json=too_many, headers=admin_headers)).status_code == 400


async def test_non_admins_are_refused(client, auth_headers, test_user):
    assert (await client.post("/v1/admin/users/bulk-pro", json={"emails": ["a@b.co"]}, headers=auth_headers)).status_code == 403
    r = await client.patch(f"/v1/admin/users/{test_user.id}", json={"is_pro": True}, headers=auth_headers)
    assert r.status_code == 403


async def test_admin_list_shows_usage_and_pro_state(client, admin_headers, test_db, test_user, auth_headers):
    await client.get("/v1/usage", headers=auth_headers)  # touch the counter
    await test_db.usage.update_one({"user_id": test_user.id}, {"$set": {"extractions": 4, "invoices": 7}})
    response = await client.get("/v1/admin/users", headers=admin_headers)
    row = next(u for u in response.json()["items"] if u["id"] == test_user.id)
    assert row["usage_extractions"] == 4 and row["usage_invoices"] == 7
    assert row["pro_active"] is False
