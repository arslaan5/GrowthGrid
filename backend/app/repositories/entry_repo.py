"""Entry repository — all entry/tag/link DB operations."""

import uuid
from datetime import date as date_type

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.entry import Entry
from app.models.tag import Tag, entry_tags
from app.models.link import Link


# ------------------------------------------------------------------ helpers


def _eager_options():
    """Standard eager-load options for an entry query."""
    return [
        selectinload(Entry.tags),
        selectinload(Entry.links),
        selectinload(Entry.attachments),
    ]


# ------------------------------------------------------------------ tags


async def resolve_tags(tag_names: list[str], db: AsyncSession) -> list[Tag]:
    """Get-or-create Tag rows for a list of tag name strings."""
    if not tag_names:
        return []

    unique_names = list({name.strip().lower() for name in tag_names if name.strip()})

    result = await db.execute(select(Tag).where(Tag.name.in_(unique_names)))
    existing: dict[str, Tag] = {t.name: t for t in result.scalars().all()}

    tags: list[Tag] = []
    for name in unique_names:
        if name in existing:
            tags.append(existing[name])
        else:
            new_tag = Tag(name=name)
            db.add(new_tag)
            tags.append(new_tag)

    await db.flush()
    return tags


# ------------------------------------------------------------------ CRUD


async def create_entry(
    user_id: uuid.UUID,
    entry_date: date_type,
    title: str,
    content: str,
    tags: list[Tag],
    links: list[dict],
    db: AsyncSession,
) -> Entry:
    """Insert a new entry with tags and links, return it fully loaded."""
    entry = Entry(
        user_id=user_id,
        date=entry_date,
        title=title,
        content=content,
        tags=tags,
    )
    db.add(entry)
    await db.flush()

    for link_data in links:
        db.add(Link(
            entry_id=entry.id,
            title=link_data["title"],
            url=link_data["url"],
        ))
    await db.flush()

    result = await db.execute(
        select(Entry).options(*_eager_options()).where(Entry.id == entry.id)
    )
    return result.scalar_one()


async def find_entry_by_id(
    entry_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Entry | None:
    """Return entry if it exists and belongs to user, otherwise None."""
    result = await db.execute(
        select(Entry)
        .options(*_eager_options())
        .where(Entry.id == entry_id, Entry.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def list_entries(
    user_id: uuid.UUID,
    db: AsyncSession,
    date_filter: str | None = None,
    tag_filter: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[Entry], int]:
    """List entries with optional filters. Returns (entries, total)."""
    base = select(Entry).where(Entry.user_id == user_id)
    count_q = select(func.count()).select_from(Entry).where(Entry.user_id == user_id)

    if date_filter:
        d = date_type.fromisoformat(date_filter)
        base = base.where(Entry.date == d)
        count_q = count_q.where(Entry.date == d)

    if tag_filter:
        tag_name = tag_filter.strip().lower()
        base = base.join(entry_tags).join(Tag).where(Tag.name == tag_name)
        count_q = (
            count_q.join(entry_tags, Entry.id == entry_tags.c.entry_id)
            .join(Tag, entry_tags.c.tag_id == Tag.id)
            .where(Tag.name == tag_name)
        )

    total_result = await db.execute(count_q)
    total = total_result.scalar_one()

    result = await db.execute(
        base.options(*_eager_options())
        .order_by(Entry.date.desc(), Entry.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    entries = list(result.scalars().unique().all())
    return entries, total


async def update_entry_fields(
    entry: Entry,
    entry_date: date_type | None,
    title: str | None,
    content: str | None,
    tags: list[Tag] | None,
    links: list[dict] | None,
    db: AsyncSession,
) -> Entry:
    """Apply field updates to an existing entry, return it reloaded."""
    if entry_date is not None:
        entry.date = entry_date
    if title is not None:
        entry.title = title
    if content is not None:
        entry.content = content

    if tags is not None:
        entry.tags.clear()
        entry.tags.extend(tags)

    if links is not None:
        await db.execute(delete(Link).where(Link.entry_id == entry.id))
        await db.flush()
        for link_data in links:
            db.add(Link(
                entry_id=entry.id,
                title=link_data["title"],
                url=link_data["url"],
            ))

    await db.flush()

    result = await db.execute(
        select(Entry).options(*_eager_options()).where(Entry.id == entry.id)
    )
    return result.scalar_one()


async def delete_entry(entry: Entry, db: AsyncSession) -> None:
    """Delete an entry from the database."""
    await db.delete(entry)
    await db.flush()
