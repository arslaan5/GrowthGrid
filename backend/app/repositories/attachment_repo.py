"""Attachment repository — all attachment-related DB operations."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.attachment import Attachment


async def create_attachment(
    entry_id: uuid.UUID,
    file_name: str,
    file_url: str,
    db: AsyncSession,
) -> Attachment:
    """Insert a new attachment record and return it."""
    attachment = Attachment(
        entry_id=entry_id,
        file_name=file_name,
        file_url=file_url,
    )
    db.add(attachment)
    await db.flush()
    await db.refresh(attachment)
    return attachment


async def find_by_id_with_entry(attachment_id: uuid.UUID, db: AsyncSession) -> Attachment | None:
    """Return attachment with its parent entry eagerly loaded, or None."""
    result = await db.execute(
        select(Attachment)
        .options(selectinload(Attachment.entry))
        .where(Attachment.id == attachment_id)
    )
    return result.scalar_one_or_none()


async def delete_attachment(attachment: Attachment, db: AsyncSession) -> None:
    """Delete an attachment record."""
    await db.delete(attachment)
    await db.flush()
