"""Analytics repository — all analytics-related DB queries."""

import uuid
from datetime import date

from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entry import Entry
from app.models.tag import Tag, entry_tags


async def get_heatmap_data(
    user_id: uuid.UUID, db: AsyncSession
) -> list[dict]:
    """Return [{date, count}] for every date the user has entries."""
    result = await db.execute(
        select(Entry.date, func.count().label("count"))
        .where(Entry.user_id == user_id)
        .group_by(Entry.date)
        .order_by(Entry.date)
    )
    return [{"date": row.date, "count": row.count} for row in result.all()]


async def get_total_entries(
    user_id: uuid.UUID, db: AsyncSession
) -> int:
    """Return total entry count for the user."""
    result = await db.execute(
        select(func.count())
        .select_from(Entry)
        .where(Entry.user_id == user_id)
    )
    return result.scalar_one()


async def get_entries_since(
    user_id: uuid.UUID, since: date, db: AsyncSession
) -> int:
    """Return count of entries on or after `since` date."""
    result = await db.execute(
        select(func.count())
        .select_from(Entry)
        .where(Entry.user_id == user_id, Entry.date >= since)
    )
    return result.scalar_one()


async def get_distinct_entry_dates(
    user_id: uuid.UUID, db: AsyncSession
) -> list[date]:
    """Return distinct entry dates for the user, sorted descending."""
    result = await db.execute(
        select(Entry.date)
        .where(Entry.user_id == user_id)
        .distinct()
        .order_by(desc(Entry.date))
    )
    return [row[0] for row in result.all()]


async def get_most_used_tag(
    user_id: uuid.UUID, db: AsyncSession
) -> str | None:
    """Return the name of the most-used tag, or None if no tags exist."""
    result = await db.execute(
        select(Tag.name, func.count().label("cnt"))
        .join(entry_tags, Tag.id == entry_tags.c.tag_id)
        .join(Entry, Entry.id == entry_tags.c.entry_id)
        .where(Entry.user_id == user_id)
        .group_by(Tag.name)
        .order_by(desc("cnt"))
        .limit(1)
    )
    row = result.first()
    return row[0] if row else None
