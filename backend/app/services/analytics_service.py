"""Analytics service — business logic for heatmap, summary, streaks."""

import uuid
from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import analytics_repo

# ------------------------------------------------------------------ heatmap


async def get_heatmap(
    user_id: uuid.UUID,
    db: AsyncSession,
) -> list[dict]:
    """Return [{date, count}] for every date the user has entries."""
    return await analytics_repo.get_heatmap_data(user_id, db)


# ------------------------------------------------------------------ streaks


def _compute_streaks(dates: list[date]) -> tuple[int, int]:
    """Given a sorted-descending list of *distinct* dates, return
    (current_streak, longest_streak).

    Current streak counts from today backwards. If the user has no entry
    today, the streak starts from yesterday (to be forgiving for
    users who haven't logged yet today).
    """
    if not dates:
        return 0, 0

    today = date.today()

    # ---- longest streak (walk chronologically) ----
    sorted_asc = sorted(dates)
    longest = 1
    current_run = 1
    for i in range(1, len(sorted_asc)):
        if sorted_asc[i] - sorted_asc[i - 1] == timedelta(days=1):
            current_run += 1
            longest = max(longest, current_run)
        else:
            current_run = 1

    # ---- current streak (walk from today backwards) ----
    date_set = set(dates)

    # Allow today or yesterday as the starting point
    if today in date_set:
        check = today
    elif (today - timedelta(days=1)) in date_set:
        check = today - timedelta(days=1)
    else:
        return 0, longest

    current_streak = 0
    while check in date_set:
        current_streak += 1
        check -= timedelta(days=1)

    return current_streak, longest


# ------------------------------------------------------------------ summary


async def get_summary(
    user_id: uuid.UUID,
    db: AsyncSession,
) -> dict:
    """Return aggregated summary metrics for the user."""
    today = date.today()
    first_of_month = today.replace(day=1)

    total_entries = await analytics_repo.get_total_entries(user_id, db)
    entries_this_month = await analytics_repo.get_entries_since(
        user_id, first_of_month, db
    )
    distinct_dates = await analytics_repo.get_distinct_entry_dates(user_id, db)
    current_streak, longest_streak = _compute_streaks(distinct_dates)
    most_used_tag = await analytics_repo.get_most_used_tag(user_id, db)

    return {
        "total_entries": total_entries,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "most_used_tag": most_used_tag,
        "entries_this_month": entries_this_month,
    }
