from pydantic import BaseModel, Field
from typing import List, Optional


# ── Health ────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = Field(..., description="Service liveness status", examples=["ok"])


# ── Analytics ─────────────────────────────────────────────────────────────────

class VaccinationRatesResponse(BaseModel):
    note: str = Field(..., description="Data-source note for this placeholder response")
    sample: dict = Field(
        ...,
        description="Map of vaccine name → total administrations",
        examples=[{"COVID-19": 1240, "Influenza": 870}],
    )


class IssuerStat(BaseModel):
    issuer: str = Field(..., description="Stellar public key of the issuer", examples=["GABC...XYZ"])
    total_issued: int = Field(..., description="Total vaccination NFTs minted by this issuer", ge=0)
    last_active: str = Field(..., description="ISO-8601 date of most recent mint", examples=["2024-03-15"])


class IssuerActivityResponse(BaseModel):
    note: str = Field(..., description="Data-source note for this placeholder response")
    sample: List[IssuerStat]


class AnomalyResponse(BaseModel):
    note: str = Field(..., description="Detection methodology description")
    flagged_issuers: List[str] = Field(
        ...,
        description="Stellar addresses of issuers flagged for unusual mint volume (>50 mints/hour)",
    )


# ── Batch ─────────────────────────────────────────────────────────────────────

class BatchVerifyRequest(BaseModel):
    wallets: List[str] = Field(
        ...,
        description="List of Stellar public-key addresses to verify (max 100)",
        min_length=1,
        max_length=100,
        examples=[["GABC...XYZ", "GDEF...UVW"]],
    )


class WalletResult(BaseModel):
    wallet: str = Field(..., description="Stellar public-key address that was checked")
    vaccinated: Optional[bool] = Field(None, description="True if at least one valid vaccination record exists")
    record_count: Optional[int] = Field(None, description="Number of vaccination records found", ge=0)
    error: Optional[str] = Field(None, description="Error message if this wallet could not be verified")


class BatchVerifyResponse(BaseModel):
    results: List[WalletResult] = Field(..., description="Per-wallet verification results")
    total: int = Field(..., description="Number of wallets processed", ge=0)
