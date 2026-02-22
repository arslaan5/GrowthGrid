"""Shared test fixtures for auth API tests."""

import asyncio

import pytest
from app.core.config import settings
from app.db.session import get_db
from app.main import app
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool


# ---------------------------------------------------------------------------
# Single event loop for the whole session — avoids asyncpg
# "Event loop is closed" errors on Windows.
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def event_loop():
    policy = asyncio.DefaultEventLoopPolicy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


# ---------------------------------------------------------------------------
# Per-test engine + session factory.
# NullPool ensures every session.begin() gets a *brand-new* asyncpg
# connection — no pooling, no "another operation is in progress" errors.
# ---------------------------------------------------------------------------
@pytest.fixture
async def client():
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        poolclass=NullPool,
    )
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def _override_get_db():
        async with factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = _override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    await engine.dispose()
