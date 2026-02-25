from datetime import UTC, datetime

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.analytics import router as analytics_router
from app.api.auth import router as auth_router
from app.api.entries import router as entries_router
from app.api.uploads import router as uploads_router
from app.core.config import settings
from app.core.limiter import limiter
from app.core.logging import get_logger, setup_logging
from app.services.health_service import build_health_report

setup_logging()
logger = get_logger("main")

_APP_VERSION = "0.1.0"

app = FastAPI(
    title="GrowthGrid API",
    description="A personal learning journal API",
    version=_APP_VERSION,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return a consistent 422 response for validation errors."""
    logger.warning("Validation error on %s %s: %s", request.method, request.url.path, exc.errors())
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions — log and return a 500."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(entries_router)
app.include_router(uploads_router)
app.include_router(analytics_router)


@app.get("/", summary="API manifest")
async def root():
    """Return a brief description of the API and links to key resources."""
    return {
        "name": "GrowthGrid API",
        "description": "A personal learning journal — track your daily growth.",
        "version": _APP_VERSION,
        "timestamp": datetime.now(UTC).isoformat(),
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_schema": "/openapi.json",
        },
        "endpoints": {
            "health": "/health",
            "auth": "/auth",
            "entries": "/entries",
            "uploads": "/uploads",
            "analytics": "/analytics",
        },
    }


@app.get("/health", summary="Detailed health report")
async def health_check():
    """Run live checks against the database and object storage and return a
    structured status report.  Overall ``status`` is one of:

    - **healthy** — all subsystems operational
    - **degraded** — DB is up but storage is unreachable
    - **unhealthy** — database is unreachable
    """
    return await build_health_report(_APP_VERSION)
