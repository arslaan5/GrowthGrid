"""Health-check service — gathers a detailed backend status report."""

from __future__ import annotations

import platform
import sys
import time
from typing import Any

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine

# Recorded once at import time so uptime is relative to process start.
_PROCESS_START: float = time.monotonic()

# B2 requires SigV4 and path-style addressing on its S3-compatible endpoint.
_B2_CLIENT_CONFIG = Config(
    signature_version="s3v4",
    s3={"addressing_style": "path"},
)


# ---------------------------------------------------------------------------
# Individual checks
# ---------------------------------------------------------------------------


async def _check_database() -> dict[str, Any]:
    """Ping the database and collect pool metrics."""
    start = time.perf_counter()
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - start) * 1000, 2)

        pool = engine.pool
        result: dict[str, Any] = {
            "status": "ok",
            "latency_ms": latency_ms,
            "pool": {
                "size": pool.size(),
                "checked_out": pool.checkedout(),
                "overflow": pool.overflow(),
            },
        }
        # Flag suspiciously high latency so operators notice without digging.
        if latency_ms > 500:
            result["note"] = "latency is elevated — possible cold connection or network congestion"
        return result
    except Exception as exc:
        return {
            "status": "error",
            "detail": str(exc),
        }


def _check_storage() -> dict[str, Any]:
    """Verify the B2 bucket is reachable (synchronous boto3 call).

    Uses list_objects_v2 (MaxKeys=1) instead of head_bucket because B2
    application keys typically have ``readFiles`` capability but NOT
    ``listBuckets``, which head_bucket requires and returns 403 for.
    """
    start = time.perf_counter()
    try:
        s3 = boto3.client(
            "s3",
            endpoint_url=settings.B2_ENDPOINT_URL,
            aws_access_key_id=settings.B2_KEY_ID,
            aws_secret_access_key=settings.B2_APPLICATION_KEY,
            config=_B2_CLIENT_CONFIG,
        )
        s3.list_objects_v2(Bucket=settings.B2_BUCKET_NAME, MaxKeys=1)
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "status": "ok",
            "bucket": settings.B2_BUCKET_NAME,
            "latency_ms": latency_ms,
        }
    except (ClientError, BotoCoreError) as exc:
        return {
            "status": "error",
            "bucket": settings.B2_BUCKET_NAME,
            "detail": str(exc),
        }


def _check_system() -> dict[str, Any]:
    """Collect static runtime / OS information."""
    import os

    return {
        "python_version": sys.version.split()[0],
        "platform": platform.platform(),
        "pid": os.getpid(),
    }


# ---------------------------------------------------------------------------
# Aggregator
# ---------------------------------------------------------------------------


async def build_health_report(app_version: str) -> dict[str, Any]:
    """Run all checks concurrently and return the aggregated report."""
    import asyncio
    from datetime import UTC, datetime

    db_result, storage_result = await asyncio.gather(
        _check_database(),
        asyncio.get_event_loop().run_in_executor(None, _check_storage),
    )

    system_result = _check_system()

    # Derive overall status
    db_ok = db_result["status"] == "ok"
    storage_ok = storage_result["status"] == "ok"

    if db_ok and storage_ok:
        overall = "healthy"
    elif db_ok:
        overall = "degraded"  # storage issue but core DB is fine
    else:
        overall = "unhealthy"  # DB is the critical dependency

    return {
        "status": overall,
        "version": app_version,
        "timestamp": datetime.now(UTC).isoformat(),
        "uptime_seconds": round(time.monotonic() - _PROCESS_START, 2),
        "checks": {
            "database": db_result,
            "storage": storage_result,
            "system": system_result,
        },
    }
