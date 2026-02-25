from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.limiter import limiter
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import AuthMessage, ChangePassword, UserLogin, UserRegister, UserResponse
from app.services.auth_service import (
    authenticate_user,
    change_password,
    delete_account,
    get_current_user,
    register_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit("5/minute")
async def register(request: Request, data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    user = await register_user(data, db)
    return user


@router.post("/login", response_model=AuthMessage)
@limiter.limit("5/minute")
async def login(
    request: Request,
    data: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Login and set JWT in HTTP-only cookie."""
    user = await authenticate_user(data.email, data.password, db)
    token = create_access_token(str(user.id))

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=settings.is_production,
        samesite="none" if settings.is_production else "lax",
        max_age=7 * 24 * 60 * 60,  # 7 days
        path="/",  # Explicitly set path to root
    )

    return {"message": "Login successful"}


@router.post("/logout", response_model=AuthMessage)
async def logout(response: Response):
    """Logout by clearing the auth cookie."""
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=settings.is_production,
        samesite="none" if settings.is_production else "lax",
        path="/",  # Must match the path used when setting the cookie
    )
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user."""
    return current_user


@router.put("/password", response_model=AuthMessage)
async def update_password(
    data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the current user's password."""
    await change_password(current_user, data, db)
    return {"message": "Password updated successfully"}


@router.delete("/account", status_code=204)
async def remove_account(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete the current user's account and all data."""
    await delete_account(current_user, db)
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=settings.is_production,
        samesite="none" if settings.is_production else "lax",
        path="/",  # Must match the path used when setting the cookie
    )
