"""Shared Backblaze B2 (S3-compatible) client configuration."""

import functools

import boto3
from botocore.config import Config

from app.core.config import settings

# B2 requires SigV4 and path-style addressing on its S3-compatible endpoint.
B2_CLIENT_CONFIG = Config(
    signature_version="s3v4",
    s3={"addressing_style": "path"},
)


@functools.lru_cache(maxsize=1)
def get_s3_client():
    """Return a cached boto3 S3 client configured for Backblaze B2."""
    return boto3.client(
        "s3",
        endpoint_url=settings.B2_ENDPOINT_URL,
        aws_access_key_id=settings.B2_KEY_ID,
        aws_secret_access_key=settings.B2_APPLICATION_KEY,
        config=B2_CLIENT_CONFIG,
    )
