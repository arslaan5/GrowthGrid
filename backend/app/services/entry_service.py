"""Entry CRUD service — business logic for entries, tags, and links."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entry import Entry
from app.repositories import entry_repo
from app.schemas.entry import EntryCreate, EntryUpdate

# ------------------------------------------------------------------ CRUD


async def create_entry(
    data: EntryCreate,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Entry:
    """Create a new journal entry with tags and links."""
    tags = await entry_repo.resolve_tags(data.tags, db)
    links = [{"title": lk.title, "url": lk.url} for lk in data.links]

    return await entry_repo.create_entry(
        user_id=user_id,
        entry_date=data.date,
        title=data.title,
        content=data.content,
        tags=tags,
        links=links,
        db=db,
    )


async def get_entry_by_id(
    entry_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Entry:
    """Fetch a single entry (must belong to user). Raises 404."""
    entry = await entry_repo.find_entry_by_id(entry_id, user_id, db)

    if not entry:
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
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[Entry], int]:
    """List entries with optional date / tag filter."""
    return await entry_repo.list_entries(
        user_id=user_id,
        db=db,
        date_filter=date_filter,
        tag_filter=tag_filter,
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
        tags = await entry_repo.resolve_tags(data.tags, db)

    links = None
    if data.links is not None:
        links = [{"title": lk.title, "url": lk.url} for lk in data.links]

    return await entry_repo.update_entry_fields(
        entry=entry,
        entry_date=data.date,
        title=data.title,
        content=data.content,
        tags=tags,
        links=links,
        db=db,
    )


async def delete_entry(
    entry_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    """Delete an entry. Raises 404 if not found / not owned."""
    entry = await get_entry_by_id(entry_id, user_id, db)
    await entry_repo.delete_entry(entry, db)


# ------------------------------------------------------------------ tags


async def list_user_tags(
    user_id: uuid.UUID,
    db: AsyncSession,
) -> list[str]:
    """Return all distinct tag names the user has ever used."""
    return await entry_repo.list_user_tags(user_id, db)
