"""Analytics service — business logic for heatmap, summary."""

import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import analytics_cache
from app.repositories import analytics_repo

# ------------------------------------------------------------------ heatmap


async def get_heatmap(
    user_id: uuid.UUID,
    db: AsyncSession,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict]:
    """Return [{date, count}] for every date the user has entries.

    Optionally filter to a date range [start_date, end_date] inclusive.
    Results are cached for 60 s per (user, date-range) combination.
    """
    cache_key = ("heatmap", user_id, start_date, end_date)
    cached = analytics_cache.get(cache_key)
    if cached is not None:
        return cached

    result = await analytics_repo.get_heatmap_data(
        user_id, db, start_date=start_date, end_date=end_date
    )
    analytics_cache.set(cache_key, result)
    return result


# ------------------------------------------------------------------ summary


async def get_summary(
    user_id: uuid.UUID,
    db: AsyncSession,
) -> dict:
    """Return aggregated summary metrics for the user.

    Results are cached for 60 s per user.
    """
    cache_key = ("summary", user_id)
    cached = analytics_cache.get(cache_key)
    if cached is not None:
        return cached

    today = date.today()
    first_of_month = today.replace(day=1)

    total_entries = await analytics_repo.get_total_entries(user_id, db)
    entries_this_month = await analytics_repo.get_entries_since(user_id, first_of_month, db)
    current_streak, longest_streak = await analytics_repo.get_streaks(user_id, db)
    most_used_tag = await analytics_repo.get_most_used_tag(user_id, db)

    result = {
        "total_entries": total_entries,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "most_used_tag": most_used_tag,
        "entries_this_month": entries_this_month,
    }
    analytics_cache.set(cache_key, result)
    return result


# ------------------------------------------------------------------ cache bust


def invalidate_user_analytics(user_id: uuid.UUID) -> None:
    """Clear all cached analytics for a user.

    Call this after creating, updating, or deleting an entry.
    """
    analytics_cache.invalidate_for_user(user_id)
