"""Tests for file upload API endpoints (B2 mocked)."""

import uuid
from io import BytesIO
from unittest.mock import patch, MagicMock

from httpx import AsyncClient


def unique_email() -> str:
    return f"upload-test-{uuid.uuid4().hex[:8]}@example.com"


async def _register_login_create_entry(client: AsyncClient) -> str:
    """Helper: register, login, create an entry, return its id."""
    email = unique_email()
    await client.post(
        "/auth/register",
        json={"email": email, "password": "testpass123"},
    )
    login_resp = await client.post(
        "/auth/login",
        json={"email": email, "password": "testpass123"},
    )
    client.cookies.set("access_token", login_resp.cookies.get("access_token"))

    entry_resp = await client.post(
        "/entries",
        json={"date": "2026-02-22", "content": "Entry for upload test"},
    )
    return entry_resp.json()["id"]


# ----------------------------- Upload


@patch("app.services.storage_service._get_s3_client")
async def test_upload_file_success(mock_s3_factory, client: AsyncClient):
    mock_s3 = MagicMock()
    mock_s3_factory.return_value = mock_s3

    entry_id = await _register_login_create_entry(client)

    file_content = b"hello world"
    response = await client.post(
        "/uploads",
        data={"entry_id": entry_id},
        files={"file": ("test.txt", BytesIO(file_content), "text/plain")},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["file_name"] == "test.txt"
    assert "file_url" in data
    assert "id" in data

    # Verify boto3 was called
    mock_s3.upload_fileobj.assert_called_once()


@patch("app.services.storage_service._get_s3_client")
async def test_upload_disallowed_type(mock_s3_factory, client: AsyncClient):
    mock_s3 = MagicMock()
    mock_s3_factory.return_value = mock_s3

    entry_id = await _register_login_create_entry(client)

    response = await client.post(
        "/uploads",
        data={"entry_id": entry_id},
        files={"file": ("malware.exe", BytesIO(b"evil"), "application/x-msdownload")},
    )
    assert response.status_code == 400
    assert "not allowed" in response.json()["detail"]

    # S3 should NOT have been called
    mock_s3.upload_fileobj.assert_not_called()


async def test_upload_unauthenticated(client: AsyncClient):
    fake_id = str(uuid.uuid4())
    response = await client.post(
        "/uploads",
        data={"entry_id": fake_id},
        files={"file": ("test.txt", BytesIO(b"data"), "text/plain")},
    )
    assert response.status_code == 401


@patch("app.services.storage_service._get_s3_client")
async def test_upload_to_nonexistent_entry(mock_s3_factory, client: AsyncClient):
    mock_s3 = MagicMock()
    mock_s3_factory.return_value = mock_s3

    # Login but use a fake entry id
    email = unique_email()
    await client.post(
        "/auth/register",
        json={"email": email, "password": "testpass123"},
    )
    login_resp = await client.post(
        "/auth/login",
        json={"email": email, "password": "testpass123"},
    )
    client.cookies.set("access_token", login_resp.cookies.get("access_token"))

    fake_entry_id = str(uuid.uuid4())
    response = await client.post(
        "/uploads",
        data={"entry_id": fake_entry_id},
        files={"file": ("test.txt", BytesIO(b"data"), "text/plain")},
    )
    assert response.status_code == 404


# ----------------------------- Attachment appears on entry


@patch("app.services.storage_service._get_s3_client")
async def test_attachment_visible_on_entry(mock_s3_factory, client: AsyncClient):
    mock_s3 = MagicMock()
    mock_s3_factory.return_value = mock_s3

    entry_id = await _register_login_create_entry(client)

    await client.post(
        "/uploads",
        data={"entry_id": entry_id},
        files={"file": ("notes.pdf", BytesIO(b"%PDF-1.4"), "application/pdf")},
    )

    # Fetch the entry and check attachments
    entry_resp = await client.get(f"/entries/{entry_id}")
    assert entry_resp.status_code == 200
    attachments = entry_resp.json()["attachments"]
    assert len(attachments) >= 1
    assert attachments[0]["file_name"] == "notes.pdf"


# ----------------------------- Delete attachment


@patch("app.services.storage_service._get_s3_client")
async def test_delete_attachment(mock_s3_factory, client: AsyncClient):
    mock_s3 = MagicMock()
    mock_s3_factory.return_value = mock_s3

    entry_id = await _register_login_create_entry(client)

    upload_resp = await client.post(
        "/uploads",
        data={"entry_id": entry_id},
        files={"file": ("temp.png", BytesIO(b"\x89PNG"), "image/png")},
    )
    attachment_id = upload_resp.json()["id"]

    # Delete
    del_resp = await client.delete(f"/uploads/{attachment_id}")
    assert del_resp.status_code == 204

    # Verify it's gone from entry
    entry_resp = await client.get(f"/entries/{entry_id}")
    att_ids = [a["id"] for a in entry_resp.json()["attachments"]]
    assert attachment_id not in att_ids

    # Verify S3 delete was called
    mock_s3.delete_object.assert_called_once()


@patch("app.services.storage_service._get_s3_client")
async def test_delete_attachment_not_found(mock_s3_factory, client: AsyncClient):
    mock_s3 = MagicMock()
    mock_s3_factory.return_value = mock_s3

    email = unique_email()
    await client.post(
        "/auth/register",
        json={"email": email, "password": "testpass123"},
    )
    login_resp = await client.post(
        "/auth/login",
        json={"email": email, "password": "testpass123"},
    )
    client.cookies.set("access_token", login_resp.cookies.get("access_token"))

    fake_id = str(uuid.uuid4())
    response = await client.delete(f"/uploads/{fake_id}")
    assert response.status_code == 404
