"""Upload service — business logic for file uploads and attachment management."""

import uuid

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.models.attachment import Attachment
from app.repositories import attachment_repo
from app.services.entry_service import get_entry_by_id
from app.services.storage_service import delete_file, generate_presigned_url, upload_file

logger = get_logger("uploads")


def _extract_object_key(file_url: str) -> str:
    """Extract the S3 object key from the full URL."""
    prefix = f"{settings.B2_ENDPOINT_URL}/{settings.B2_BUCKET_NAME}/"
    if file_url.startswith(prefix):
        return file_url[len(prefix) :]
    return file_url.split(f"/{settings.B2_BUCKET_NAME}/", 1)[-1]


async def create_attachment(
    entry_id: uuid.UUID,
    file: UploadFile,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Attachment:
    """Validate ownership, upload file to B2, persist attachment record."""
    # Ensure entry exists and belongs to the user (raises 404)
    await get_entry_by_id(entry_id, user_id, db)

    # Upload to Backblaze B2
    _object_key, file_url = await upload_file(file, entry_id)

    attachment = await attachment_repo.create_attachment(
        entry_id=entry_id,
        file_name=file.filename or "file",
        file_url=file_url,
        db=db,
    )
    logger.info("Attachment uploaded: %s for entry %s", attachment.id, entry_id)
    return attachment


async def remove_attachment(
    attachment_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    """Verify ownership, delete file from B2, remove DB record."""
    attachment = await attachment_repo.find_by_id_with_entry(attachment_id, db)

    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found",
        )

    if attachment.entry.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found",
        )

    object_key = _extract_object_key(attachment.file_url)
    await delete_file(object_key)
    await attachment_repo.delete_attachment(attachment, db)
    logger.info("Attachment deleted: %s", attachment_id)


async def get_attachment_presigned_url(
    attachment_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> str:
    """Return a short-lived pre-signed download URL for the given attachment."""
    attachment = await attachment_repo.find_by_id_with_entry(attachment_id, db)

    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found",
        )

    if attachment.entry.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found",
        )

    object_key = _extract_object_key(attachment.file_url)
    return generate_presigned_url(object_key)
