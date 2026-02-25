"""Backblaze B2 storage service via boto3 (S3-compatible API)."""

import contextlib
import uuid
from io import BytesIO

from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile, status

from app.core.b2_client import get_s3_client
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("storage")

# Maximum file size: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/markdown",
}


async def upload_file(file: UploadFile, entry_id: uuid.UUID) -> tuple[str, str]:
    """Upload a file to B2 and return (object_key, public_url).

    Raises HTTPException on validation or upload failure.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' is not allowed.",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 10 MB size limit.",
        )

    # Build a unique key: entries/<entry_id>/<uuid>_<original_name>
    ext_name = file.filename or "file"
    unique_prefix = uuid.uuid4().hex[:8]
    object_key = f"entries/{entry_id}/{unique_prefix}_{ext_name}"

    s3 = get_s3_client()
    try:
        s3.upload_fileobj(
            BytesIO(contents),
            settings.B2_BUCKET_NAME,
            object_key,
            ExtraArgs={"ContentType": file.content_type},
        )
    except ClientError as exc:
        logger.error("B2 upload failed for key %s: %s", object_key, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to upload file to storage: {exc}",
        ) from exc

    # Construct the public URL
    file_url = f"{settings.B2_ENDPOINT_URL}/{settings.B2_BUCKET_NAME}/{object_key}"
    return object_key, file_url


async def delete_file(object_key: str) -> None:
    """Delete a file from B2. Silently ignores missing files."""
    s3 = get_s3_client()
    with contextlib.suppress(ClientError):
        s3.delete_object(Bucket=settings.B2_BUCKET_NAME, Key=object_key)


def generate_presigned_url(object_key: str, expires_in: int = 3600) -> str:
    """Generate a pre-signed download URL for a B2 object.

    The URL is valid for `expires_in` seconds (default 1 hour).
    """
    s3 = get_s3_client()
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.B2_BUCKET_NAME, "Key": object_key},
        ExpiresIn=expires_in,
    )
