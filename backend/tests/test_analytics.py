"""Tests for the analytics endpoints (heatmap & summary)."""

import uuid
from datetime import date, timedelta

import pytest
from httpx import AsyncClient

# ------------------------------------------------------------------ helpers


def _unique_email(prefix: str = "ana") -> str:
    """Return a globally-unique email so tests never collide with data
    left over from previous runs on the persistent Neon DB."""
    return f"{prefix}_{uuid.uuid4().hex[:8]}@test.com"


async def _register_and_login(client: AsyncClient, email: str | None = None):
    email = email or _unique_email()
    await client.post(
        "/auth/register",
        json={"email": email, "password": "secret123"},
    )
    resp = await client.post(
        "/auth/login",
        json={"email": email, "password": "secret123"},
    )
    token = resp.cookies.get("access_token")
    client.cookies.set("access_token", token)
    return client


async def _create_entry(
    client: AsyncClient,
    entry_date: str,
    title: str = "Note",
    tags: list[str] | None = None,
):
    payload: dict = {
        "date": entry_date,
        "title": title,
        "content": "some content",
    }
    if tags:
        payload["tags"] = tags
    resp = await client.post("/entries", json=payload)
    assert resp.status_code == 201
    return resp.json()


# ------------------------------------------------------------------ heatmap


@pytest.mark.asyncio
async def test_heatmap_empty(client: AsyncClient):
    """No entries → empty heatmap list."""
    await _register_and_login(client)
    resp = await client.get("/analytics/heatmap")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_heatmap_single_date(client: AsyncClient):
    """One entry → one heatmap day with count 1."""
    await _register_and_login(client)
    today = date.today().isoformat()
    await _create_entry(client, today)

    resp = await client.get("/analytics/heatmap")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["date"] == today
    assert data[0]["count"] == 1


@pytest.mark.asyncio
async def test_heatmap_multiple_entries_same_date(client: AsyncClient):
    """Two entries on the same day → count=2 for that day."""
    await _register_and_login(client)
    today = date.today().isoformat()
    await _create_entry(client, today, title="A")
    await _create_entry(client, today, title="B")

    resp = await client.get("/analytics/heatmap")
    data = resp.json()
    assert len(data) == 1
    assert data[0]["count"] == 2


@pytest.mark.asyncio
async def test_heatmap_multiple_dates(client: AsyncClient):
    """Entries on different days → separate heatmap days sorted by date."""
    await _register_and_login(client)
    d1 = (date.today() - timedelta(days=1)).isoformat()
    d2 = date.today().isoformat()
    await _create_entry(client, d1)
    await _create_entry(client, d2)

    resp = await client.get("/analytics/heatmap")
    data = resp.json()
    assert len(data) == 2
    assert data[0]["date"] == d1
    assert data[1]["date"] == d2


@pytest.mark.asyncio
async def test_heatmap_unauthenticated(client: AsyncClient):
    resp = await client.get("/analytics/heatmap")
    assert resp.status_code == 401


# ------------------------------------------------------------------ summary


@pytest.mark.asyncio
async def test_summary_empty(client: AsyncClient):
    """No entries → zeroes and null tag."""
    await _register_and_login(client)
    resp = await client.get("/analytics/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_entries"] == 0
    assert data["current_streak"] == 0
    assert data["longest_streak"] == 0
    assert data["most_used_tag"] is None
    assert data["entries_this_month"] == 0


@pytest.mark.asyncio
async def test_summary_with_entries(client: AsyncClient):
    """Several entries across days → correct totals and streaks."""
    await _register_and_login(client)
    today = date.today()

    # Create a 3-day streak ending today
    for i in range(3):
        d = (today - timedelta(days=i)).isoformat()
        await _create_entry(client, d, tags=["python"])

    # Extra entry 5 days ago (gap → separate streak)
    await _create_entry(
        client,
        (today - timedelta(days=5)).isoformat(),
        tags=["rust"],
    )

    resp = await client.get("/analytics/summary")
    data = resp.json()

    assert data["total_entries"] == 4
    assert data["current_streak"] == 3
    assert data["longest_streak"] == 3
    assert data["most_used_tag"] == "python"  # 3 uses vs 1 for rust


@pytest.mark.asyncio
async def test_summary_most_used_tag(client: AsyncClient):
    """Most-used tag is the one assigned to the most entries."""
    await _register_and_login(client)
    today = date.today().isoformat()

    await _create_entry(client, today, title="A", tags=["go", "python"])
    await _create_entry(client, today, title="B", tags=["python"])
    await _create_entry(client, today, title="C", tags=["rust"])

    resp = await client.get("/analytics/summary")
    data = resp.json()
    assert data["most_used_tag"] == "python"  # 2 entries vs 1 each for go/rust


@pytest.mark.asyncio
async def test_summary_entries_this_month(client: AsyncClient):
    """Only entries in the current calendar month are counted."""
    await _register_and_login(client)
    today = date.today()

    # Entry this month
    await _create_entry(client, today.isoformat())

    # Entry last month (if possible)
    first = today.replace(day=1)
    last_month = first - timedelta(days=1)
    await _create_entry(client, last_month.isoformat())

    resp = await client.get("/analytics/summary")
    data = resp.json()
    assert data["total_entries"] == 2
    assert data["entries_this_month"] == 1


@pytest.mark.asyncio
async def test_summary_unauthenticated(client: AsyncClient):
    resp = await client.get("/analytics/summary")
    assert resp.status_code == 401


# ------------------------------------------------------------------ isolation


@pytest.mark.asyncio
async def test_analytics_user_isolation(client: AsyncClient):
    """User A's entries do not appear in User B's analytics."""
    # User A
    await _register_and_login(client)
    await _create_entry(client, date.today().isoformat(), tags=["x"])

    # User B
    client.cookies.clear()
    await _register_and_login(client)

    heatmap = await client.get("/analytics/heatmap")
    assert heatmap.json() == []

    summary = await client.get("/analytics/summary")
    s = summary.json()
    assert s["total_entries"] == 0
    assert s["most_used_tag"] is None
