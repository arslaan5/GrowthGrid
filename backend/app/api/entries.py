"""Entry CRUD API routes."""

import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.schemas.entry import (
    EntryCreate,
    EntryListResponse,
    EntryResponse,
    EntryUpdate,
)
from app.services.auth_service import get_current_user
from app.services.entry_service import (
    create_entry,
    delete_entry,
    get_entry_by_id,
    list_entries,
    update_entry,
)

router = APIRouter(prefix="/entries", tags=["entries"])


@router.post("", response_model=EntryResponse, status_code=201)
async def create(
    data: EntryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new journal entry."""
    entry = await create_entry(data, current_user.id, db)
    return entry


@router.get("", response_model=EntryListResponse)
async def list_all(
    date: date | None = Query(None, description="Filter by date (YYYY-MM-DD)"),
    tag: str | None = Query(None, description="Filter by tag name"),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List journal entries with optional filters."""
    entries, total = await list_entries(
        user_id=current_user.id,
        db=db,
        date_filter=str(date) if date else None,
        tag_filter=tag,
        offset=offset,
        limit=limit,
    )
    return EntryListResponse(entries=entries, total=total)


@router.get("/{entry_id}", response_model=EntryResponse)
async def get_one(
    entry_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single journal entry by ID."""
    return await get_entry_by_id(entry_id, current_user.id, db)


@router.put("/{entry_id}", response_model=EntryResponse)
async def update(
    entry_id: uuid.UUID,
    data: EntryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a journal entry."""
    return await update_entry(entry_id, data, current_user.id, db)


@router.delete("/{entry_id}", status_code=204)
async def remove(
    entry_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a journal entry."""
    await delete_entry(entry_id, current_user.id, db)
