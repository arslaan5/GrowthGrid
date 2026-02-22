import uuid
from datetime import datetime

from pydantic import BaseModel


class UserRegister(BaseModel):
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthMessage(BaseModel):
    message: str
