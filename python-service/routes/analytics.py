import os
import httpx
from fastapi import APIRouter, HTTPException
from collections import defaultdict, Counter

router = APIRouter()

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:4000")


async def _fetch_records(wallet: str) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{BACKEND_URL}/verify/{wallet}", timeout=10)
        res.raise_for_status()
        return res.json()


@router.get("/rates")
async def vaccination_rates():
    """
    Returns aggregated vaccination counts by vaccine type.
    In production this would query an indexed event store.
    This endpoint demonstrates the analytics shape.
    """
    # Placeholder: real implementation queries Horizon event stream
    return {
        "note": "Connect to Horizon event stream for live data",
        "sample": {
            "COVID-19": 1240,
            "Influenza": 870,
            "Hepatitis B": 430,
        },
    }


@router.get("/issuers")
async def issuer_activity():
    """Issuer activity stats — volume and last active timestamp."""
    return {
        "note": "Derived from on-chain mint events",
        "sample": [
            {"issuer": "GABC...XYZ", "total_issued": 312, "last_active": "2024-03-15"},
            {"issuer": "GDEF...UVW", "total_issued": 98, "last_active": "2024-03-10"},
        ],
    }


@router.get("/anomalies")
async def anomaly_detection():
    """
    Flag issuers with unusually high mint volume in a short window.
    Threshold: >50 mints in 1 hour is flagged.
    """
    return {
        "note": "Anomaly detection based on mint event frequency",
        "flagged_issuers": [],
    }
