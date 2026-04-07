import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_analytics_rates():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/analytics/rates")
    assert res.status_code == 200
    assert "sample" in res.json()


@pytest.mark.asyncio
async def test_batch_verify_limit():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/batch/verify", json={"wallets": ["G" * 56] * 101})
    assert res.status_code == 400
