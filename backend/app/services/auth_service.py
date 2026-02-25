"""Auth service — registration, authentication, current-user resolution."""

import uuid

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.core.security import decode_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.repositories import user_repo
from app.schemas.auth import ChangePassword, UserRegister

logger = get_logger("auth")


async def register_user(data: UserRegister, db: AsyncSession) -> User:
    """Register a new user. Raises 409 if email already exists."""
    existing = await user_repo.find_by_email(data.email, db)

    if existing:
        logger.warning("Registration attempt with existing email: %s", data.email)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = await user_repo.create_user(
        email=data.email,
        hashed_password=await hash_password(data.password),
        db=db,
    )
    logger.info("New user registered: %s", user.id)
    return user


async def authenticate_user(email: str, password: str, db: AsyncSession) -> User:
    """Authenticate user by email and password. Raises 401 on failure."""
    user = await user_repo.find_by_email(email, db)

    if not user or not await verify_password(password, user.hashed_password):
        logger.warning("Failed login attempt for email: %s", email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    logger.info("User logged in: %s", user.id)
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
        logger.warning("Invalid or expired token presented")
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
        logger.warning("Token references non-existent user: %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


async def change_password(
    user: User,
    data: ChangePassword,
    db: AsyncSession,
) -> None:
    """Change the current user's password. Raises 400 if current password is wrong."""
    if not await verify_password(data.current_password, user.hashed_password):
        logger.warning("Failed password change attempt for user %s", user.id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    new_hash = await hash_password(data.new_password)
    await user_repo.update_password(user, new_hash, db)
    logger.info("Password changed for user %s", user.id)


async def delete_account(user: User, db: AsyncSession) -> None:
    """Permanently delete the user and all associated data."""
    user_id = user.id
    await user_repo.delete_user(user, db)
    logger.info("Account deleted: %s", user_id)
