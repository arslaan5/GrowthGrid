import asyncio
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.core.config import settings


def _hash_password_sync(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def _verify_password_sync(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


async def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt (runs in thread to avoid blocking)."""
    return await asyncio.to_thread(_hash_password_sync, password)


async def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash (runs in thread)."""
    return await asyncio.to_thread(_verify_password_sync, plain_password, hashed_password)


def create_access_token(user_id: str) -> str:
    """Create a JWT access token with expiry."""
    expire = datetime.now(UTC) + timedelta(days=settings.JWT_EXPIRY_DAYS)
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decode and validate a JWT token. Returns payload or None if invalid."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
