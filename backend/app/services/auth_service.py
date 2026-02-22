"""Auth service — registration, authentication, current-user resolution."""

import uuid

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.repositories import user_repo
from app.schemas.auth import UserRegister


async def register_user(data: UserRegister, db: AsyncSession) -> User:
    """Register a new user. Raises 409 if email already exists."""
    existing = await user_repo.find_by_email(data.email, db)

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    return await user_repo.create_user(
        email=data.email,
        hashed_password=hash_password(data.password),
        db=db,
    )


async def authenticate_user(email: str, password: str, db: AsyncSession) -> User:
    """Authenticate user by email and password. Raises 401 on failure."""
    user = await user_repo.find_by_email(email, db)

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return user


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate JWT from cookie, return current user."""
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = await user_repo.find_by_id(uuid.UUID(user_id), db)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user
