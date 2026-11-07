"""Monthly stats: status counts and the trend endpoint that feeds the stats-page charts."""
from datetime import datetime
from decimal import Decimal


def invoice(user_id, when, status, total, currency="NGN"):
    return {
        "user_id": user_id, "client_id": "c1", "number": f"N-{when:%Y%m%d}-{total}-{status}-{currency}",
        "issued_date": when, "due_date": when, "status": status, "total": str(total), "subtotal": str(total),
        "tax": "0", "currency": currency, "items": [], "created_at": when, "updated_at": when,
    }


def expense(user_id, when, amount, currency="NGN"):
    return {
        "user_id": user_id, "expense_date": when, "amount": str(amount), "currency": currency,
        "category": "office", "description": "x", "created_at": when, "updated_at": when,
    }


async def seed(db, user_id):
    await db.invoices.insert_many([
        invoice(user_id, datetime(2026, 11, 5), "paid", 1000),
        invoice(user_id, datetime(2026, 11, 5, 14), "paid", 500),
        invoice(user_id, datetime(2026, 11, 20), "sent", 300),
        invoice(user_id, datetime(2026, 10, 12), "paid", 200),
        invoice(user_id, datetime(2026, 11, 8), "paid", 999, currency="USD"),   # other currency
        invoice("someone-else", datetime(2026, 11, 8), "paid", 7777),           # other user
    ])
    await db.expenses.insert_many([
        expense(user_id, datetime(2026, 11, 7), 100),
        expense(user_id, datetime(2026, 10, 3), 50),
        expense("someone-else", datetime(2026, 11, 7), 5555),
    ])


async def test_trend_is_zero_filled_and_matches_definitions(client, auth_headers, test_db, test_user):
    await seed(test_db, test_user.id)
    r = await client.get("/v1/stats/trend", params={"month": 11, "year": 2026, "currency": "NGN", "months": 3}, headers=auth_headers)
    assert r.status_code == 200, r.text
    trend = r.json()["trend"]
    assert [(m["year"], m["month"]) for m in trend["months"]] == [(2026, 9), (2026, 10), (2026, 11)]
    sep, octo, nov = trend["months"]
    assert Decimal(sep["revenue"]) == 0 and sep["total_invoices"] == 0
    assert Decimal(octo["revenue"]) == 200 and Decimal(octo["expenses"]) == 50 and Decimal(octo["net_income"]) == 150
    assert Decimal(nov["revenue"]) == 1500          # paid only, NGN only, this user only
    assert Decimal(nov["expenses"]) == 100
    assert Decimal(nov["net_income"]) == 1400
    assert nov["total_invoices"] == 3 and nov["paid_invoices"] == 2


async def test_daily_series_covers_the_whole_month(client, auth_headers, test_db, test_user):
    await seed(test_db, test_user.id)
    r = await client.get("/v1/stats/trend", params={"month": 11, "year": 2026}, headers=auth_headers)
    daily = r.json()["trend"]["daily"]
    assert len(daily) == 30
    assert daily[0]["date"] == "2026-11-01" and daily[-1]["date"] == "2026-11-30"
    by_day = {d["date"]: d for d in daily}
    assert Decimal(by_day["2026-11-05"]["revenue"]) == 1500
    assert Decimal(by_day["2026-11-07"]["expenses"]) == 100
    assert Decimal(by_day["2026-11-06"]["revenue"]) == 0
    # unpaid invoices are not revenue
    assert Decimal(by_day["2026-11-20"]["revenue"]) == 0


async def test_trend_spans_a_year_boundary(client, auth_headers):
    r = await client.get("/v1/stats/trend", params={"month": 2, "year": 2026, "months": 4}, headers=auth_headers)
    months = r.json()["trend"]["months"]
    assert [(m["year"], m["month"]) for m in months] == [(2025, 11), (2025, 12), (2026, 1), (2026, 2)]
    assert len(r.json()["trend"]["daily"]) == 28  # Feb 2026


async def test_trend_agrees_with_the_monthly_endpoint(client, auth_headers, test_db, test_user):
    await seed(test_db, test_user.id)
    params = {"month": 11, "year": 2026, "currency": "NGN"}
    monthly = (await client.get("/v1/stats/monthly", params=params, headers=auth_headers)).json()["stats"]
    trend = (await client.get("/v1/stats/trend", params={**params, "months": 1}, headers=auth_headers)).json()["trend"]
    assert Decimal(trend["months"][0]["revenue"]) == Decimal(monthly["total_revenue"])
    assert Decimal(trend["months"][0]["expenses"]) == Decimal(monthly["total_expenses"])
    assert Decimal(trend["months"][0]["net_income"]) == Decimal(monthly["net_income"])
    assert sum(Decimal(d["revenue"]) for d in trend["daily"]) == Decimal(monthly["total_revenue"])


async def test_monthly_stats_lists_status_counts(client, auth_headers, test_db, test_user):
    await seed(test_db, test_user.id)
    r = await client.get("/v1/stats/monthly", params={"month": 11, "year": 2026, "currency": "NGN"}, headers=auth_headers)
    assert r.json()["stats"]["status_counts"] == {"paid": 2, "sent": 1}


async def test_trend_requires_login_and_validates_months(client, auth_headers):
    assert (await client.get("/v1/stats/trend", params={"month": 11, "year": 2026})).status_code == 401
    bad = await client.get("/v1/stats/trend", params={"month": 11, "year": 2026, "months": 13}, headers=auth_headers)
    assert bad.status_code == 422
