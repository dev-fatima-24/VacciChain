"""APScheduler job that runs anomaly detection and fires alerts."""
import os

import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from alerting import dispatch_alerts
from routes.analytics import anomaly_detection

logger = structlog.get_logger(service="scheduler")

SCHEDULE_MINUTES = int(os.getenv("ANOMALY_SCHEDULE_MINUTES", "15"))

scheduler = AsyncIOScheduler()


async def _run_anomaly_check() -> None:
    try:
        result = await anomaly_detection()
        flagged = result.get("flagged_issuers", [])
        logger.info("anomaly_check_complete", flagged_count=len(flagged))
        await dispatch_alerts(flagged)
    except Exception as exc:
        logger.error("anomaly_check_failed", error=str(exc))


def start_scheduler() -> None:
    scheduler.add_job(_run_anomaly_check, "interval", minutes=SCHEDULE_MINUTES, id="anomaly_check")
    scheduler.start()
    logger.info("scheduler_started", interval_minutes=SCHEDULE_MINUTES)


def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)
    logger.info("scheduler_stopped")
