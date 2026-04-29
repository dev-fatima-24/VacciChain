"""
Authentication middleware for the VacciChain analytics service.

Supports two auth methods:
  1. X-API-Key header — validated against ANALYTICS_API_KEY env var
  2. Authorization: Bearer <jwt> — validated as an admin JWT (role == 'issuer')
"""

import os
import jwt
from fastapi import Header, HTTPException, Security
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials

_api_key_scheme = APIKeyHeader(name="X-API-Key", auto_error=False)
_bearer_scheme = HTTPBearer(auto_error=False)


def _get_analytics_api_key() -> str:
    key = os.getenv("ANALYTICS_API_KEY", "")
    if not key:
        raise RuntimeError("ANALYTICS_API_KEY environment variable is not set")
    return key


def require_analytics_auth(
    api_key: str | None = Security(_api_key_scheme),
    credentials: HTTPAuthorizationCredentials | None = Security(_bearer_scheme),
) -> dict:
    """
    FastAPI dependency that enforces authentication on analytics endpoints.

    Accepts either:
    - X-API-Key header matching ANALYTICS_API_KEY secret
    - Bearer JWT with role == 'issuer' signed by JWT_SECRET

    Returns the identity dict on success, raises HTTP 401 on failure.
    """
    # 1. API key check
    if api_key:
        expected = _get_analytics_api_key()
        if api_key == expected:
            return {"method": "api_key"}
        raise HTTPException(status_code=401, detail="Invalid API key")

    # 2. JWT check
    if credentials:
        token = credentials.credentials
        jwt_secret = os.getenv("JWT_SECRET", "")
        if not jwt_secret:
            raise HTTPException(status_code=500, detail="JWT_SECRET not configured")
        try:
            payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")

        if payload.get("role") != "issuer":
            raise HTTPException(status_code=403, detail="Admin role required")
        return {"method": "jwt", "sub": payload.get("sub")}

    raise HTTPException(status_code=401, detail="Authentication required")
