import httpx
import os
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:4000")


class BatchVerifyRequest(BaseModel):
    wallets: List[str]


@router.post("/verify")
async def batch_verify(request: BatchVerifyRequest):
    """Bulk verify a list of Stellar wallet addresses."""
    if len(request.wallets) > 100:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Maximum 100 wallets per request")

    results = []
    async with httpx.AsyncClient() as client:
        for wallet in request.wallets:
            try:
                res = await client.get(f"{BACKEND_URL}/verify/{wallet}", timeout=10)
                data = res.json()
                results.append({
                    "wallet": wallet,
                    "vaccinated": data.get("vaccinated", False),
                    "record_count": data.get("record_count", 0),
                })
            except Exception as e:
                results.append({"wallet": wallet, "error": str(e)})

    return {"results": results, "total": len(results)}
