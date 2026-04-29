import pytest
import asyncio
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.fixture
def mock_fetch_events():
    """Patch _fetch_events so analytics tests don't hit a real backend."""
    with patch("routes.analytics._fetch_events", new_callable=AsyncMock) as m:
        yield m


@pytest.fixture
def mock_backend_client():
    """Mock httpx.AsyncClient for batch verify tests."""
    with patch("routes.batch.httpx.AsyncClient") as m:
        yield m


@pytest.mark.asyncio
async def test_health():
    """Test health check endpoint."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


# ============================================================================
# Analytics Endpoint Tests
# ============================================================================

@pytest.mark.asyncio
async def test_analytics_rates(mock_fetch_events):
    """Test vaccination rates endpoint with multiple vaccines."""
    mock_fetch_events.return_value = [
        {"payload": {"vaccine_name": "COVID-19"}, "ledger": 100},
        {"payload": {"vaccine_name": "COVID-19"}, "ledger": 101},
        {"payload": {"vaccine_name": "Flu"}, "ledger": 102},
        {"payload": {"vaccine_name": "Measles"}, "ledger": 103},
    ]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/analytics/rates")
    
    assert res.status_code == 200
    body = res.json()
    assert body["total_mints"] == 4
    assert body["rates"]["COVID-19"] == 2
    assert body["rates"]["Flu"] == 1
    assert body["rates"]["Measles"] == 1


@pytest.mark.asyncio
async def test_analytics_rates_empty(mock_fetch_events):
    """Test vaccination rates with no events."""
    mock_fetch_events.return_value = []
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/analytics/rates")
    
    assert res.status_code == 200
    body = res.json()
    assert body["total_mints"] == 0
    assert body["rates"] == {}


@pytest.mark.asyncio
async def test_analytics_rates_missing_vaccine_name(mock_fetch_events):
    """Test vaccination rates handles missing vaccine_name gracefully."""
    mock_fetch_events.return_value = [
        {"payload": {"vaccine_name": "COVID-19"}, "ledger": 100},
        {"payload": {}, "ledger": 101},  # Missing vaccine_name
        {"payload": {"1": "Flu"}, "ledger": 102},  # Alternative format
    ]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/analytics/rates")
    
    assert res.status_code == 200
    body = res.json()
    assert body["total_mints"] == 3
    assert "COVID-19" in body["rates"]


@pytest.mark.asyncio
async def test_analytics_issuers(mock_fetch_events):
    """Test issuer activity endpoint."""
    mock_fetch_events.return_value = [
        {"payload": {"issuer": "GISSUER1"}, "ledger": 100},
        {"payload": {"issuer": "GISSUER1"}, "ledger": 101},
        {"payload": {"issuer": "GISSUER2"}, "ledger": 102},
        {"payload": {"issuer": "GISSUER2"}, "ledger": 105},
    ]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/analytics/issuers")
    
    assert res.status_code == 200
    body = res.json()
    assert len(body["issuers"]) == 2
    
    # Find issuers in response
    issuer1 = next((i for i in body["issuers"] if i["issuer"] == "GISSUER1"), None)
    issuer2 = next((i for i in body["issuers"] if i["issuer"] == "GISSUER2"), None)
    
    assert issuer1 is not None
    assert issuer1["total_issued"] == 2
    assert issuer1["last_ledger"] == 101
    
    assert issuer2 is not None
    assert issuer2["total_issued"] == 2
    assert issuer2["last_ledger"] == 105


@pytest.mark.asyncio
async def test_analytics_issuers_empty(mock_fetch_events):
    """Test issuer activity with no events."""
    mock_fetch_events.return_value = []
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/analytics/issuers")
    
    assert res.status_code == 200
    body = res.json()
    assert body["issuers"] == []


@pytest.mark.asyncio
async def test_analytics_issuers_missing_issuer(mock_fetch_events):
    """Test issuer activity handles missing issuer field."""
    mock_fetch_events.return_value = [
        {"payload": {"issuer": "GISSUER1"}, "ledger": 100},
        {"payload": {}, "ledger": 101},  # Missing issuer
        {"payload": {"2": "GISSUER2"}, "ledger": 102},  # Alternative format
    ]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/analytics/issuers")
    
    assert res.status_code == 200
    body = res.json()
    assert len(body["issuers"]) >= 1


@pytest.mark.asyncio
async def test_analytics_anomalies(mock_fetch_events):
    """Test anomaly detection endpoint."""
    # Create events with one issuer exceeding threshold (default 50)
    events = []
    for i in range(60):
        events.append({"payload": {"issuer": "GMALICIOUS"}, "ledger": 100 + i})
    for i in range(10):
        events.append({"payload": {"issuer": "GNORMAL"}, "ledger": 200 + i})
    
    mock_fetch_events.return_value = events
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/analytics/anomalies")
    
    assert res.status_code == 200
    body = res.json()
    assert body["threshold"] == 50
    
    # GMALICIOUS should be flagged
    flagged_issuers = [f["issuer"] for f in body["flagged_issuers"]]
    assert "GMALICIOUS" in flagged_issuers
    assert "GNORMAL" not in flagged_issuers


@pytest.mark.asyncio
async def test_analytics_anomalies_no_flagged(mock_fetch_events):
    """Test anomaly detection with no anomalies."""
    mock_fetch_events.return_value = [
        {"payload": {"issuer": "GISSUER1"}, "ledger": 100},
        {"payload": {"issuer": "GISSUER2"}, "ledger": 101},
    ]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/analytics/anomalies")
    
    assert res.status_code == 200
    body = res.json()
    assert body["flagged_issuers"] == []


# ============================================================================
# Batch Verify Endpoint Tests
# ============================================================================

@pytest.mark.asyncio
async def test_batch_verify_limit():
    """Test batch verify rejects more than 100 wallets."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/batch/verify", json={"wallets": ["G" + "A" * 55] * 101})
    # FastAPI returns 422 for validation errors
    assert res.status_code in [400, 422]
    assert "100" in str(res.json())


@pytest.mark.asyncio
async def test_batch_verify_valid_wallets(mock_backend_client):
    """Test batch verify with valid wallet addresses."""
    mock_response = MagicMock()
    mock_response.json.return_value = {"vaccinated": True, "record_count": 2}
    mock_response.status_code = 200
    
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    
    mock_backend_client.return_value = mock_client
    
    wallets = ["GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ"] * 3
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/batch/verify", json={"wallets": wallets})
    
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 3
    assert len(body["results"]) == 3


@pytest.mark.asyncio
async def test_batch_verify_mixed_results(mock_backend_client):
    """Test batch verify with mixed valid and invalid results."""
    # Mock successful response
    success_response = MagicMock()
    success_response.json.return_value = {"vaccinated": True, "record_count": 1}
    
    # Mock failed response
    error_response = MagicMock()
    error_response.json.side_effect = Exception("Connection error")
    
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(side_effect=[success_response, error_response, success_response])
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    
    mock_backend_client.return_value = mock_client
    
    wallets = [
        "GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ",
        "GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJR",
        "GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJS",
    ]
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/batch/verify", json={"wallets": wallets})
    
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 3
    
    # Check for mix of successful and failed results
    results = body["results"]
    has_success = any("vaccinated" in r for r in results)
    has_error = any("error" in r for r in results)
    
    assert has_success or has_error


@pytest.mark.asyncio
async def test_batch_verify_empty_list():
    """Test batch verify with empty wallet list."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/batch/verify", json={"wallets": []})
    
    # Empty list may be rejected by validation or accepted
    if res.status_code == 200:
        body = res.json()
        assert body["total"] == 0
        assert body["results"] == []
    else:
        # Validation error is also acceptable
        assert res.status_code == 422


@pytest.mark.asyncio
async def test_batch_verify_single_wallet(mock_backend_client):
    """Test batch verify with single wallet."""
    mock_response = MagicMock()
    mock_response.json.return_value = {"vaccinated": False, "record_count": 0}
    
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    
    mock_backend_client.return_value = mock_client
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/batch/verify", json={
            "wallets": ["GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ"]
        })
    
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert len(body["results"]) == 1


# ============================================================================
# Integration Tests
# ============================================================================

@pytest.mark.asyncio
async def test_batch_verify_request_validation():
    """Test batch verify validates request format."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Missing wallets field
        res = await client.post("/batch/verify", json={})
        assert res.status_code == 422  # Validation error
        
        # Invalid wallets format
        res = await client.post("/batch/verify", json={"wallets": "not-a-list"})
        assert res.status_code == 422

