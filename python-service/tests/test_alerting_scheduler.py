import pytest
from unittest.mock import AsyncMock, MagicMock, patch


# ============================================================================
# alerting.dispatch_alerts
# ============================================================================

@pytest.mark.asyncio
async def test_dispatch_alerts_no_url_skips(monkeypatch):
    """No webhook URL → no HTTP call made."""
    monkeypatch.setenv("ALERT_WEBHOOK_URL", "")
    import importlib, alerting
    importlib.reload(alerting)

    with patch("alerting.httpx.AsyncClient") as mock_client:
        await alerting.dispatch_alerts([{"issuer": "GTEST", "total_issued": 60}])
    mock_client.assert_not_called()


@pytest.mark.asyncio
async def test_dispatch_alerts_empty_list_skips(monkeypatch):
    """Empty flagged list → no HTTP call made."""
    monkeypatch.setenv("ALERT_WEBHOOK_URL", "https://hooks.example.com/slack")
    import importlib, alerting
    importlib.reload(alerting)

    with patch("alerting.httpx.AsyncClient") as mock_client:
        await alerting.dispatch_alerts([])
    mock_client.assert_not_called()


@pytest.mark.asyncio
async def test_dispatch_alerts_slack_payload(monkeypatch):
    """Slack webhook sends correct payload shape."""
    monkeypatch.setenv("ALERT_WEBHOOK_URL", "https://hooks.example.com/slack")
    monkeypatch.setenv("ALERT_WEBHOOK_TYPE", "slack")
    import importlib, alerting
    importlib.reload(alerting)

    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_post = AsyncMock(return_value=mock_response)
    mock_client = AsyncMock()
    mock_client.post = mock_post
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch("alerting.httpx.AsyncClient", return_value=mock_client):
        await alerting.dispatch_alerts([{"issuer": "GMALICIOUS", "total_issued": 75}])

    mock_post.assert_called_once()
    _, kwargs = mock_post.call_args
    payload = kwargs["json"]
    assert "text" in payload
    assert "GMALICIOUS" in payload["text"]
    assert "75" in payload["text"]


@pytest.mark.asyncio
async def test_dispatch_alerts_pagerduty_payload(monkeypatch):
    """PagerDuty webhook sends correct payload shape."""
    monkeypatch.setenv("ALERT_WEBHOOK_URL", "https://events.pagerduty.com/v2/enqueue")
    monkeypatch.setenv("ALERT_WEBHOOK_TYPE", "pagerduty")
    monkeypatch.setenv("PAGERDUTY_ROUTING_KEY", "test-routing-key")
    import importlib, alerting
    importlib.reload(alerting)

    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_post = AsyncMock(return_value=mock_response)
    mock_client = AsyncMock()
    mock_client.post = mock_post
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch("alerting.httpx.AsyncClient", return_value=mock_client):
        await alerting.dispatch_alerts([{"issuer": "GMALICIOUS", "total_issued": 75}])

    _, kwargs = mock_post.call_args
    payload = kwargs["json"]
    assert payload["routing_key"] == "test-routing-key"
    assert payload["event_action"] == "trigger"
    assert payload["payload"]["custom_details"]["issuer"] == "GMALICIOUS"
    assert payload["payload"]["custom_details"]["record_count"] == 75


@pytest.mark.asyncio
async def test_dispatch_alerts_email_payload(monkeypatch):
    """Email webhook sends correct payload shape."""
    monkeypatch.setenv("ALERT_WEBHOOK_URL", "https://api.example.com/email")
    monkeypatch.setenv("ALERT_WEBHOOK_TYPE", "email")
    monkeypatch.setenv("ALERT_EMAIL_TO", "admin@example.com")
    import importlib, alerting
    importlib.reload(alerting)

    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_post = AsyncMock(return_value=mock_response)
    mock_client = AsyncMock()
    mock_client.post = mock_post
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch("alerting.httpx.AsyncClient", return_value=mock_client):
        await alerting.dispatch_alerts([{"issuer": "GMALICIOUS", "total_issued": 75}])

    _, kwargs = mock_post.call_args
    payload = kwargs["json"]
    assert payload["to"] == "admin@example.com"
    assert "GMALICIOUS" in payload["body"]


@pytest.mark.asyncio
async def test_dispatch_alerts_http_error_continues(monkeypatch):
    """HTTP failure on one alert does not raise; logs and continues."""
    monkeypatch.setenv("ALERT_WEBHOOK_URL", "https://hooks.example.com/slack")
    monkeypatch.setenv("ALERT_WEBHOOK_TYPE", "slack")
    import importlib, alerting
    importlib.reload(alerting)

    mock_post = AsyncMock(side_effect=Exception("connection refused"))
    mock_client = AsyncMock()
    mock_client.post = mock_post
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch("alerting.httpx.AsyncClient", return_value=mock_client):
        # Should not raise
        await alerting.dispatch_alerts([
            {"issuer": "GISSUER1", "total_issued": 60},
            {"issuer": "GISSUER2", "total_issued": 80},
        ])

    assert mock_post.call_count == 2


# ============================================================================
# scheduler._run_anomaly_check
# ============================================================================

@pytest.mark.asyncio
async def test_run_anomaly_check_dispatches_flagged():
    """_run_anomaly_check calls dispatch_alerts with flagged issuers."""
    flagged = [{"issuer": "GMALICIOUS", "total_issued": 99}]

    with patch("scheduler.anomaly_detection", new=AsyncMock(return_value={"flagged_issuers": flagged})), \
         patch("scheduler.dispatch_alerts", new=AsyncMock()) as mock_dispatch:
        from scheduler import _run_anomaly_check
        await _run_anomaly_check()

    mock_dispatch.assert_called_once_with(flagged)


@pytest.mark.asyncio
async def test_run_anomaly_check_no_flagged():
    """_run_anomaly_check calls dispatch_alerts with empty list when none flagged."""
    with patch("scheduler.anomaly_detection", new=AsyncMock(return_value={"flagged_issuers": []})), \
         patch("scheduler.dispatch_alerts", new=AsyncMock()) as mock_dispatch:
        from scheduler import _run_anomaly_check
        await _run_anomaly_check()

    mock_dispatch.assert_called_once_with([])


@pytest.mark.asyncio
async def test_run_anomaly_check_handles_exception():
    """_run_anomaly_check swallows exceptions from anomaly_detection."""
    with patch("scheduler.anomaly_detection", new=AsyncMock(side_effect=Exception("backend down"))), \
         patch("scheduler.dispatch_alerts", new=AsyncMock()) as mock_dispatch:
        from scheduler import _run_anomaly_check
        await _run_anomaly_check()  # must not raise

    mock_dispatch.assert_not_called()
