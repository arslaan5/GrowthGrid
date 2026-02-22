"""Tests for auth API endpoints."""

import uuid

from httpx import AsyncClient


def unique_email() -> str:
    """Generate a unique email for test isolation."""
    return f"test-{uuid.uuid4().hex[:8]}@example.com"


async def test_register_success(client: AsyncClient):
    email = unique_email()
    response = await client.post(
        "/auth/register",
        json={"email": email, "password": "testpass123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == email
    assert "id" in data
    assert "hashed_password" not in data


async def test_register_duplicate_email(client: AsyncClient):
    email = unique_email()
    # First registration
    resp1 = await client.post(
        "/auth/register",
        json={"email": email, "password": "testpass123"},
    )
    assert resp1.status_code == 201

    # Second registration with same email
    resp2 = await client.post(
        "/auth/register",
        json={"email": email, "password": "testpass456"},
    )
    assert resp2.status_code == 409


async def test_login_success(client: AsyncClient):
    email = unique_email()
    # Register first
    await client.post(
        "/auth/register",
        json={"email": email, "password": "testpass123"},
    )
    # Then login
    response = await client.post(
        "/auth/login",
        json={"email": email, "password": "testpass123"},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Login successful"
    assert "access_token" in response.cookies


async def test_login_wrong_password(client: AsyncClient):
    email = unique_email()
    await client.post(
        "/auth/register",
        json={"email": email, "password": "testpass123"},
    )
    response = await client.post(
        "/auth/login",
        json={"email": email, "password": "wrongpassword"},
    )
    assert response.status_code == 401


async def test_login_nonexistent_user(client: AsyncClient):
    response = await client.post(
        "/auth/login",
        json={"email": "noone@example.com", "password": "testpass123"},
    )
    assert response.status_code == 401


async def test_me_authenticated(client: AsyncClient):
    email = unique_email()
    # Register and login
    await client.post(
        "/auth/register",
        json={"email": email, "password": "testpass123"},
    )
    login_response = await client.post(
        "/auth/login",
        json={"email": email, "password": "testpass123"},
    )

    # Extract the cookie value and set it on the client directly
    token = login_response.cookies.get("access_token")
    assert token is not None, "access_token cookie should be set after login"
    client.cookies.set("access_token", token)

    # Access /me with cookie
    response = await client.get("/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == email


async def test_me_unauthenticated(client: AsyncClient):
    response = await client.get("/auth/me")
    assert response.status_code == 401


async def test_logout(client: AsyncClient):
    response = await client.post("/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"
