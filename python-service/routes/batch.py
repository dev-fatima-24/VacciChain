import os
import httpx
from fastapi import APIRouter, HTTPException
from schemas import BatchVerifyRequest, BatchVerifyResponse, WalletResult

router = APIRouter(tags=["Batch"])

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:4000")


@router.post(
    "/verify",
    response_model=BatchVerifyResponse,
    summary="Bulk verify Stellar wallet vaccination status",
    description=(
        "Accepts up to **100** Stellar public-key addresses and returns the vaccination "
        "status for each one by querying the on-chain verification endpoint.\n\n"
        "- Each address must be a valid Stellar public key starting with `G`.\n"
        "- Wallets that cannot be reached are returned with an `error` field instead of "
        "`vaccinated`/`record_count`.\n\n"
        "**Auth:** No authentication required — mirrors the public `/verify/:wallet` endpoint."
    ),
    responses={
        400: {"description": "Request contains more than 100 wallets"},
    },
)
async def batch_verify(request: BatchVerifyRequest):
    if len(request.wallets) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 wallets per request")

    results: list[WalletResult] = []
    async with httpx.AsyncClient() as client:
        for wallet in request.wallets:
            try:
                res = await client.get(f"{BACKEND_URL}/verify/{wallet}", timeout=10)
                data = res.json()
                results.append(WalletResult(
                    wallet=wallet,
                    vaccinated=data.get("vaccinated", False),
                    record_count=data.get("record_count", 0),
                ))
            except Exception as e:
                results.append(WalletResult(wallet=wallet, error=str(e)))

    return BatchVerifyResponse(results=results, total=len(results))
