"""Tests for security utility functions."""

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
)


def test_hash_password_returns_hash():
    hashed = hash_password("testpass123")
    assert hashed != "testpass123"
    assert hashed.startswith("$2b$")


def test_verify_password_correct():
    hashed = hash_password("mypassword")
    assert verify_password("mypassword", hashed) is True


def test_verify_password_incorrect():
    hashed = hash_password("mypassword")
    assert verify_password("wrongpassword", hashed) is False


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
