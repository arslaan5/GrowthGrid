"""File upload API routes."""

import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.schemas.entry import AttachmentResponse
from app.services.auth_service import get_current_user
from app.services.upload_service import create_attachment, remove_attachment

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("", response_model=AttachmentResponse, status_code=201)
async def upload(
    entry_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a file and attach it to a journal entry."""
    return await create_attachment(entry_id, file, current_user.id, db)


@router.delete("/{attachment_id}", status_code=204)
async def remove(
    attachment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an attachment (removes file from B2 and DB row)."""
    await remove_attachment(attachment_id, current_user.id, db)
