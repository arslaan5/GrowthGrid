"""Analytics repository — all analytics-related DB queries."""

import uuid
from datetime import date

from sqlalchemy import desc, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entry import Entry
from app.models.tag import Tag, entry_tags


async def get_heatmap_data(
    user_id: uuid.UUID,
    db: AsyncSession,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict]:
    """Return [{date, count}] for every date the user has entries.

    Optionally filter to a date range [start_date, end_date] inclusive.
    """
    stmt = select(Entry.date, func.count().label("count")).where(Entry.user_id == user_id)
    if start_date is not None:
        stmt = stmt.where(Entry.date >= start_date)
    if end_date is not None:
        stmt = stmt.where(Entry.date <= end_date)
    stmt = stmt.group_by(Entry.date).order_by(Entry.date)

    result = await db.execute(stmt)
    return [{"date": row.date, "count": row.count} for row in result.all()]


async def get_total_entries(user_id: uuid.UUID, db: AsyncSession) -> int:
    """Return total entry count for the user."""
    result = await db.execute(
        select(func.count()).select_from(Entry).where(Entry.user_id == user_id)
    )
    return result.scalar_one()


async def get_entries_since(user_id: uuid.UUID, since: date, db: AsyncSession) -> int:
    """Return count of entries on or after `since` date."""
    result = await db.execute(
        select(func.count()).select_from(Entry).where(Entry.user_id == user_id, Entry.date >= since)
    )
    return result.scalar_one()


async def get_streaks(user_id: uuid.UUID, db: AsyncSession) -> tuple[int, int]:
    """Compute current and longest streaks entirely in SQL.

    Uses the "islands and gaps" window-function pattern:
    1. Get distinct entry dates.
    2. Subtract a row-number offset so consecutive dates share the same group key.
    3. Count each group → streak length.
    4. Longest streak = MAX(streak_len).
    5. Current streak = the streak whose last_date is today or yesterday.

    Returns (current_streak, longest_streak).
    """
    query = text("""
        WITH distinct_dates AS (
            SELECT DISTINCT date AS d
            FROM entries
            WHERE user_id = :user_id
        ),
        grouped AS (
            SELECT
                d,
                d - (ROW_NUMBER() OVER (ORDER BY d))::int AS grp
            FROM distinct_dates
        ),
        streaks AS (
            SELECT
                COUNT(*) AS streak_len,
                MAX(d) AS last_date
            FROM grouped
            GROUP BY grp
        )
        SELECT
            COALESCE(MAX(streak_len), 0)::int AS longest_streak,
            COALESCE(
                MAX(CASE WHEN last_date >= CURRENT_DATE - 1 THEN streak_len END),
                0
            )::int AS current_streak
        FROM streaks
    """)
    result = await db.execute(query, {"user_id": user_id})
    row = result.one()
    return row.current_streak, row.longest_streak


async def get_most_used_tag(user_id: uuid.UUID, db: AsyncSession) -> str | None:
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
