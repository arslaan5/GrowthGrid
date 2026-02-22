from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.analytics import router as analytics_router
from app.api.auth import router as auth_router
from app.api.entries import router as entries_router
from app.api.uploads import router as uploads_router
from app.core.config import settings

app = FastAPI(
    title="GrowthGrid API",
    description="A personal learning journal API",
    version="0.1.0",
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


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
