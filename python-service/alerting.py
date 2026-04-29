"""Webhook alerting for anomaly detection results."""
import os
from datetime import datetime, timezone
from typing import Any

import httpx
import structlog

logger = structlog.get_logger(service="alerting")

ALERT_WEBHOOK_URL = os.getenv("ALERT_WEBHOOK_URL", "")
ALERT_WEBHOOK_TYPE = os.getenv("ALERT_WEBHOOK_TYPE", "slack").lower()  # slack | pagerduty | email


def _build_payload(anomaly: dict, webhook_type: str) -> dict[str, Any]:
    issuer = anomaly["issuer"]
    count = anomaly["total_issued"]
    ts = datetime.now(timezone.utc).isoformat()
    text = (
        f"[VacciChain] Anomaly detected — issuer: {issuer}, "
        f"type: high_mint_volume, record_count: {count}, timestamp: {ts}"
    )
    if webhook_type == "pagerduty":
        return {
            "routing_key": os.getenv("PAGERDUTY_ROUTING_KEY", ""),
            "event_action": "trigger",
            "payload": {
                "summary": text,
                "severity": "warning",
                "source": "vaccichain-analytics",
                "custom_details": {"issuer": issuer, "record_count": count, "timestamp": ts},
            },
        }
    if webhook_type == "email":
        return {"to": os.getenv("ALERT_EMAIL_TO", ""), "subject": "VacciChain Anomaly Alert", "body": text}
    # default: Slack
    return {"text": text}


async def dispatch_alerts(flagged: list[dict]) -> None:
    """POST one webhook call per flagged issuer. Logs and continues on failure."""
    if not ALERT_WEBHOOK_URL or not flagged:
        return
    async with httpx.AsyncClient(timeout=10) as client:
        for anomaly in flagged:
            payload = _build_payload(anomaly, ALERT_WEBHOOK_TYPE)
            try:
                res = await client.post(ALERT_WEBHOOK_URL, json=payload)
                res.raise_for_status()
                logger.info("alert_sent", issuer=anomaly["issuer"], webhook_type=ALERT_WEBHOOK_TYPE)
            except Exception as exc:
                logger.error("alert_failed", issuer=anomaly["issuer"], error=str(exc))
