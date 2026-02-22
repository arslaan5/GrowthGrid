from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import AuthMessage, UserLogin, UserRegister, UserResponse
from app.services.auth_service import authenticate_user, get_current_user, register_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    user = await register_user(data, db)
    return user


@router.post("/login", response_model=AuthMessage)
async def login(
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
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,  # 7 days
    )

    return {"message": "Login successful"}


@router.post("/logout", response_model=AuthMessage)
async def logout(response: Response):
    """Logout by clearing the auth cookie."""
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=True,
        samesite="none",
    )
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user."""
    return current_user
