"""Tests for security utility functions."""

import pytest

from app.core.security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)


@pytest.mark.asyncio
async def test_hash_password_returns_hash():
    hashed = await hash_password("testpass123")
    assert hashed != "testpass123"
    assert hashed.startswith("$2b$")


@pytest.mark.asyncio
async def test_verify_password_correct():
    hashed = await hash_password("mypassword")
    assert await verify_password("mypassword", hashed) is True


@pytest.mark.asyncio
async def test_verify_password_incorrect():
    hashed = await hash_password("mypassword")
    assert await verify_password("wrongpassword", hashed) is False


def test_create_and_decode_token():
    user_id = "550e8400-e29b-41d4-a716-446655440000"
    token = create_access_token(user_id)
    payload = decode_token(token)

    assert payload is not None
    assert payload["sub"] == user_id


def test_decode_invalid_token():
    result = decode_token("invalid.token.string")
    assert result is None


def test_decode_empty_token():
    result = decode_token("")
    assert result is None
