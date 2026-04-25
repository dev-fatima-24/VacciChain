import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.fixture
def mock_fetch_events():
    """Patch _fetch_events so analytics tests don't hit a real backend."""
    with patch("routes.analytics._fetch_events", new_callable=AsyncMock) as m:
        yield m


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_analytics_rates(mock_fetch_events):
    mock_fetch_events.return_value = [
        {"payload": {"vaccine_name": "COVID-19"}, "ledger": 100},
        {"payload": {"vaccine_name": "COVID-19"}, "ledger": 101},
        {"payload": {"vaccine_name": "Flu"}, "ledger": 102},
    ]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/analytics/rates")
    assert res.status_code == 200
    body = res.json()
    assert body["total_mints"] == 3
    assert body["rates"]["COVID-19"] == 2
    assert body["rates"]["Flu"] == 1


@pytest.mark.asyncio
async def test_batch_verify_limit():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/batch/verify", json={"wallets": ["G" * 56] * 101})
    assert res.status_code == 400
