import os
from collections import defaultdict
from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:4000")
# Anomaly threshold: flag issuers with more than this many mints in the dataset
ANOMALY_THRESHOLD = int(os.getenv("ANOMALY_THRESHOLD", "50"))


async def _fetch_events(event_type: str, limit: int = 500) -> list:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{BACKEND_URL}/events",
            params={"event_type": event_type, "limit": limit},
            timeout=10,
        )
        res.raise_for_status()
        return res.json().get("events", [])


@router.get("/rates")
async def vaccination_rates():
    """Vaccination counts grouped by vaccine name, derived from indexed mint events."""
    events = await _fetch_events("VaccinationMinted")
    counts: dict[str, int] = defaultdict(int)
    for e in events:
        vaccine = e.get("payload", {}).get("vaccine_name") or e.get("payload", {}).get("1")
        if vaccine:
            counts[str(vaccine)] += 1
    return {"rates": dict(counts), "total_mints": len(events)}


@router.get("/issuers")
async def issuer_activity():
    """Issuer activity — mint volume and last active ledger, from indexed events."""
    events = await _fetch_events("VaccinationMinted")
    stats: dict[str, dict] = {}
    for e in events:
        issuer = e.get("payload", {}).get("issuer") or e.get("payload", {}).get("2")
        if not issuer:
            continue
        issuer = str(issuer)
        if issuer not in stats:
            stats[issuer] = {"issuer": issuer, "total_issued": 0, "last_ledger": 0}
        stats[issuer]["total_issued"] += 1
        if e.get("ledger", 0) > stats[issuer]["last_ledger"]:
            stats[issuer]["last_ledger"] = e["ledger"]
    return {"issuers": list(stats.values())}


@router.get("/anomalies")
async def anomaly_detection():
    """Flag issuers whose total mint count exceeds ANOMALY_THRESHOLD."""
    events = await _fetch_events("VaccinationMinted")
    counts: dict[str, int] = defaultdict(int)
    for e in events:
        issuer = e.get("payload", {}).get("issuer") or e.get("payload", {}).get("2")
        if issuer:
            counts[str(issuer)] += 1
    flagged = [
        {"issuer": issuer, "total_issued": count}
        for issuer, count in counts.items()
        if count > ANOMALY_THRESHOLD
    ]
    return {"flagged_issuers": flagged, "threshold": ANOMALY_THRESHOLD}
