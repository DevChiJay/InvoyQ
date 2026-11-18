"""Auto-generated, editable product SKUs (PROD-0001, PROD-0002, …)."""
import asyncio

from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate


def product(sku=None, name="Widget"):
    body = {"name": name, "unit_price": "10.00"}
    if sku is not None:
        body["sku"] = sku
    return body


async def next_sku(client, auth_headers):
    r = await client.get("/v1/products/next-sku", headers=auth_headers)
    assert r.status_code == 200, r.text
    return r.json()["sku"]


async def create(client, auth_headers, sku=None):
    return await client.post("/v1/products", json=product(sku), headers=auth_headers)


async def test_first_sku_and_increment(client, auth_headers):
    assert await next_sku(client, auth_headers) == "PROD-0001"
    r = await create(client, auth_headers)
    assert r.status_code == 201, r.text
    assert r.json()["sku"] == "PROD-0001"
    assert await next_sku(client, auth_headers) == "PROD-0002"
    assert (await create(client, auth_headers, sku="   ")).json()["sku"] == "PROD-0002"


async def test_manual_sku_moves_sequence_and_others_ignored(client, auth_headers):
    assert (await create(client, auth_headers, sku="PROD-0050")).status_code == 201
    assert (await create(client, auth_headers, sku="SHOE-RED-42")).status_code == 201
    assert (await create(client, auth_headers, sku="PROD-12A")).status_code == 201
    assert await next_sku(client, auth_headers) == "PROD-0051"


async def test_sequence_passes_9999(client, auth_headers):
    await create(client, auth_headers, sku="PROD-9999")
    assert await next_sku(client, auth_headers) == "PROD-10000"


async def test_soft_deleted_number_not_reused(client, auth_headers):
    r = await create(client, auth_headers)
    await client.delete(f"/v1/products/{r.json()['id']}", headers=auth_headers)
    assert await next_sku(client, auth_headers) == "PROD-0002"


async def test_sequence_is_per_user(client, auth_headers, auth_headers_pro):
    await create(client, auth_headers)
    assert await next_sku(client, auth_headers_pro) == "PROD-0001"


async def test_concurrent_auto_creates_get_distinct_skus(test_db, test_user):
    repo = ProductRepository(test_db)
    data = ProductCreate(name="Widget", unit_price="10.00")
    made = await asyncio.gather(*[repo.create_product(test_user.id, data) for _ in range(4)])
    assert sorted(p.sku for p in made) == ["PROD-0001", "PROD-0002", "PROD-0003", "PROD-0004"]


async def test_duplicate_manual_sku_is_400(client, auth_headers):
    await create(client, auth_headers, sku="PROD-0001")
    r = await create(client, auth_headers, sku="PROD-0001")
    assert r.status_code == 400
    assert "already exists" in r.json()["detail"]


async def test_sku_can_be_edited(client, auth_headers):
    pid = (await create(client, auth_headers)).json()["id"]
    r = await client.put(f"/v1/products/{pid}", json={"sku": "MY-CODE"}, headers=auth_headers)
    assert r.status_code == 200, r.text
    assert r.json()["sku"] == "MY-CODE"
