import uuid
from pydantic import BaseModel, EmailStr, Field

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str | None = None
    type: str | None = None

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    display_name: str | None = Field(default=None, max_length=100)
    native_language: str = "English"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: str

    class Config:
        from_attributes = True
