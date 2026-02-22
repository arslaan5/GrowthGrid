"""Analytics API — heatmap and summary endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.schemas.analytics import HeatmapDay, SummaryResponse
from app.services.analytics_service import get_heatmap, get_summary
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/heatmap", response_model=list[HeatmapDay])
async def heatmap(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return date/count pairs for the heatmap calendar."""
    return await get_heatmap(user.id, db)


@router.get("/summary", response_model=SummaryResponse)
async def summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return aggregated dashboard metrics."""
    data = await get_summary(user.id, db)
    return SummaryResponse(**data)
