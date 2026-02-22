"""Pydantic schemas for journal entries."""

import uuid
import datetime as _dt

from pydantic import BaseModel, Field


# ---------- Nested create / response schemas ----------


class LinkCreate(BaseModel):
    title: str | None = None
    url: str


class LinkResponse(BaseModel):
    id: uuid.UUID
    title: str | None = None
    url: str

    model_config = {"from_attributes": True}


class AttachmentResponse(BaseModel):
    id: uuid.UUID
    file_name: str
    file_url: str
    uploaded_at: _dt.datetime

    model_config = {"from_attributes": True}


class TagResponse(BaseModel):
    id: uuid.UUID
    name: str

    model_config = {"from_attributes": True}


# ---------- Entry schemas ----------


class EntryCreate(BaseModel):
    date: _dt.date
    title: str | None = None
    content: str = Field(..., min_length=1)
    tags: list[str] = Field(default_factory=list)
    links: list[LinkCreate] = Field(default_factory=list)


class EntryUpdate(BaseModel):
    date: _dt.date | None = None
    title: str | None = None
    content: str | None = None
    tags: list[str] | None = None
    links: list[LinkCreate] | None = None


class EntryResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    date: _dt.date
    title: str | None = None
    content: str
    created_at: _dt.datetime
    updated_at: _dt.datetime
    tags: list[TagResponse] = []
    links: list[LinkResponse] = []
    attachments: list[AttachmentResponse] = []

    model_config = {"from_attributes": True}


class EntryListResponse(BaseModel):
    entries: list[EntryResponse]
    total: int
