import os
from fastapi import FastAPI
from routes.analytics import router as analytics_router
from routes.batch import router as batch_router

app = FastAPI(title="VacciChain Analytics", version="1.0.0")

app.include_router(analytics_router, prefix="/analytics")
app.include_router(batch_router, prefix="/batch")


@app.get("/health")
def health():
    return {"status": "ok"}
