"""Entry CRUD service — business logic for entries, tags, and links."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.entry import Entry
from app.repositories import entry_repo
from app.schemas.entry import EntryCreate, EntryUpdate
from app.services.analytics_service import invalidate_user_analytics

logger = get_logger("entries")

# ------------------------------------------------------------------ CRUD


async def create_entry(
    data: EntryCreate,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Entry:
    """Create a new journal entry with tags and links."""
    tags = await entry_repo.resolve_tags(data.tags, user_id, db)
    links = [{"title": lk.title, "url": lk.url} for lk in data.links]

    entry = await entry_repo.create_entry(
        user_id=user_id,
        entry_date=data.date,
        title=data.title,
        content=data.content,
        tags=tags,
        links=links,
        db=db,
    )
    invalidate_user_analytics(user_id)
    logger.info("Entry created: %s by user %s", entry.id, user_id)
    return entry


async def get_entry_by_id(
    entry_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Entry:
    """Fetch a single entry (must belong to user). Raises 404."""
    entry = await entry_repo.find_entry_by_id(entry_id, user_id, db)

    if not entry:
        logger.warning("Entry %s not found for user %s", entry_id, user_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )
    return entry


async def list_entries(
    user_id: uuid.UUID,
    db: AsyncSession,
    date_filter: str | None = None,
    tag_filter: str | None = None,
    search_filter: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[Entry], int]:
    """List entries with optional date / tag / search filter."""
    return await entry_repo.list_entries(
        user_id=user_id,
        db=db,
        date_filter=date_filter,
        tag_filter=tag_filter,
        search_filter=search_filter,
        offset=offset,
        limit=limit,
    )


async def update_entry(
    entry_id: uuid.UUID,
    data: EntryUpdate,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Entry:
    """Update an existing entry. Raises 404 if not found / not owned."""
    entry = await get_entry_by_id(entry_id, user_id, db)

    tags = None
    if data.tags is not None:
        tags = await entry_repo.resolve_tags(data.tags, user_id, db)

    links = None
    if data.links is not None:
        links = [{"title": lk.title, "url": lk.url} for lk in data.links]

    updated = await entry_repo.update_entry_fields(
        entry=entry,
        entry_date=data.date,
        title=data.title,
        content=data.content,
        tags=tags,
        links=links,
        db=db,
    )
    invalidate_user_analytics(user_id)
    return updated


async def delete_entry(
    entry_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    """Delete an entry. Raises 404 if not found / not owned."""
    entry = await get_entry_by_id(entry_id, user_id, db)
    await entry_repo.delete_entry(entry, db)
    invalidate_user_analytics(user_id)
    logger.info("Entry deleted: %s by user %s", entry_id, user_id)


# ------------------------------------------------------------------ tags


async def list_user_tags(
    user_id: uuid.UUID,
    db: AsyncSession,
) -> list[str]:
    """Return all distinct tag names the user has ever used."""
    return await entry_repo.list_user_tags(user_id, db)
