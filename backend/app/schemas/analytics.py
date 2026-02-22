"""Pydantic schemas for analytics responses."""

import datetime as _dt

from pydantic import BaseModel


class HeatmapDay(BaseModel):
    date: _dt.date
    count: int


class SummaryResponse(BaseModel):
    total_entries: int
    current_streak: int
    longest_streak: int
    most_used_tag: str | None
    entries_this_month: int
