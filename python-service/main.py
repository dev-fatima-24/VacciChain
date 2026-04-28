import os
import structlog
from fastapi import FastAPI, Request
from routes.analytics import router as analytics_router
from routes.batch import router as batch_router
from schemas import HealthResponse

structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(
        getattr(__import__("logging"), os.getenv("LOG_LEVEL", "INFO"))
    ),
)

logger = structlog.get_logger(service="python-service")

app = FastAPI(title="VacciChain Analytics", version="1.0.0")

app.include_router(analytics_router, prefix="/analytics")
app.include_router(batch_router, prefix="/batch")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    response = await call_next(request)
    logger.info("request", method=request.method, path=request.url.path, status=response.status_code)
    return response


@app.get("/health")
def health():
    return HealthResponse(status="ok")
