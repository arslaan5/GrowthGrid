"""User repository — all user-related DB operations."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


async def find_by_email(email: str, db: AsyncSession) -> User | None:
    """Return user with the given email, or None."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def find_by_id(user_id: uuid.UUID, db: AsyncSession) -> User | None:
    """Return user with the given UUID, or None."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(email: str, hashed_password: str, db: AsyncSession) -> User:
    """Insert a new user and return it."""
    user = User(email=email, hashed_password=hashed_password)
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user
