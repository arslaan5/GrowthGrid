"""Tests for Entry CRUD API endpoints."""

import uuid

from httpx import AsyncClient


def unique_email() -> str:
    return f"entry-test-{uuid.uuid4().hex[:8]}@example.com"


async def _register_and_login(client: AsyncClient) -> str:
    """Helper: register a user, login, set cookie on client, return email."""
    email = unique_email()
    await client.post(
        "/auth/register",
        json={"email": email, "password": "testpass123"},
    )
    login_resp = await client.post(
        "/auth/login",
        json={"email": email, "password": "testpass123"},
    )
    token = login_resp.cookies.get("access_token")
    client.cookies.set("access_token", token)
    return email


# ----------------------------- Create


async def test_create_entry_minimal(client: AsyncClient):
    await _register_and_login(client)
    response = await client.post(
        "/entries",
        json={
            "date": "2026-02-22",
            "content": "Learned about async Python today.",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == "Learned about async Python today."
    assert data["date"] == "2026-02-22"
    assert data["tags"] == []
    assert data["links"] == []


async def test_create_entry_with_tags_and_links(client: AsyncClient):
    await _register_and_login(client)
    response = await client.post(
        "/entries",
        json={
            "date": "2026-02-22",
            "title": "FastAPI deep-dive",
            "content": "Studied dependency injection in FastAPI.",
            "tags": ["python", "fastapi"],
            "links": [
                {"title": "FastAPI Docs", "url": "https://fastapi.tiangolo.com"},
            ],
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "FastAPI deep-dive"
    tag_names = sorted([t["name"] for t in data["tags"]])
    assert tag_names == ["fastapi", "python"]
    assert len(data["links"]) == 1
    assert data["links"][0]["url"] == "https://fastapi.tiangolo.com"


async def test_create_entry_unauthenticated(client: AsyncClient):
    response = await client.post(
        "/entries",
        json={"date": "2026-02-22", "content": "Should fail"},
    )
    assert response.status_code == 401


# ----------------------------- Read


async def test_get_entry_by_id(client: AsyncClient):
    await _register_and_login(client)
    create_resp = await client.post(
        "/entries",
        json={"date": "2026-02-22", "content": "Test entry"},
    )
    entry_id = create_resp.json()["id"]

    response = await client.get(f"/entries/{entry_id}")
    assert response.status_code == 200
    assert response.json()["id"] == entry_id


async def test_get_entry_not_found(client: AsyncClient):
    await _register_and_login(client)
    fake_id = str(uuid.uuid4())
    response = await client.get(f"/entries/{fake_id}")
    assert response.status_code == 404


async def test_list_entries(client: AsyncClient):
    await _register_and_login(client)
    # Create 2 entries
    await client.post(
        "/entries",
        json={"date": "2026-02-20", "content": "Entry one"},
    )
    await client.post(
        "/entries",
        json={"date": "2026-02-21", "content": "Entry two"},
    )

    response = await client.get("/entries")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    # Newest first
    assert data["entries"][0]["date"] >= data["entries"][1]["date"]


async def test_list_entries_filter_by_date(client: AsyncClient):
    await _register_and_login(client)
    await client.post(
        "/entries",
        json={"date": "2026-01-15", "content": "Specific date entry"},
    )

    response = await client.get("/entries", params={"date": "2026-01-15"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for entry in data["entries"]:
        assert entry["date"] == "2026-01-15"


async def test_list_entries_filter_by_tag(client: AsyncClient):
    await _register_and_login(client)
    tag_name = f"tag-{uuid.uuid4().hex[:6]}"
    await client.post(
        "/entries",
        json={
            "date": "2026-02-22",
            "content": "Tagged entry",
            "tags": [tag_name],
        },
    )

    response = await client.get("/entries", params={"tag": tag_name})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1


# ----------------------------- Update


async def test_update_entry(client: AsyncClient):
    await _register_and_login(client)
    create_resp = await client.post(
        "/entries",
        json={"date": "2026-02-22", "content": "Original"},
    )
    entry_id = create_resp.json()["id"]

    response = await client.put(
        f"/entries/{entry_id}",
        json={"content": "Updated content", "tags": ["updated"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Updated content"
    assert any(t["name"] == "updated" for t in data["tags"])


async def test_update_entry_not_found(client: AsyncClient):
    await _register_and_login(client)
    fake_id = str(uuid.uuid4())
    response = await client.put(
        f"/entries/{fake_id}",
        json={"content": "nope"},
    )
    assert response.status_code == 404


# ----------------------------- Delete


async def test_delete_entry(client: AsyncClient):
    await _register_and_login(client)
    create_resp = await client.post(
        "/entries",
        json={"date": "2026-02-22", "content": "To be deleted"},
    )
    entry_id = create_resp.json()["id"]

    response = await client.delete(f"/entries/{entry_id}")
    assert response.status_code == 204

    # Confirm it's gone
    get_resp = await client.get(f"/entries/{entry_id}")
    assert get_resp.status_code == 404


async def test_delete_entry_not_found(client: AsyncClient):
    await _register_and_login(client)
    fake_id = str(uuid.uuid4())
    response = await client.delete(f"/entries/{fake_id}")
    assert response.status_code == 404


# ----------------------------- Isolation: other user can't see my entries


async def test_entry_isolation_between_users(client: AsyncClient):
    """User B cannot read User A's entries."""
    # User A creates an entry
    await _register_and_login(client)
    create_resp = await client.post(
        "/entries",
        json={"date": "2026-02-22", "content": "User A private note"},
    )
    entry_id = create_resp.json()["id"]

    # Switch to User B
    client.cookies.clear()
    await _register_and_login(client)

    response = await client.get(f"/entries/{entry_id}")
    assert response.status_code == 404
