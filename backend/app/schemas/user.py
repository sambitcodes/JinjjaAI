import uuid
from datetime import datetime
from pydantic import BaseModel

class ProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    display_name: str | None
    native_language: str
    level_progress: int
    total_xp: int
    current_streak: int
    last_active: datetime
    dob: str | None = None
    study_reason: str | None = None
    occupation: str | None = None
    korean_culture_experience: str | None = None
    korean_proficiency: str | None = None
    korean_name: str | None = None
    avatar_base64: str | None = None
    course_states: dict | None = None
    activity_log: list | None = None
    scheduled_courses: list | None = None

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    display_name: str | None = None
    native_language: str | None = None
    level_progress: int | None = None
    dob: str | None = None
    study_reason: str | None = None
    occupation: str | None = None
    korean_culture_experience: str | None = None
    korean_proficiency: str | None = None
    korean_name: str | None = None
    avatar_base64: str | None = None
    course_states: dict | None = None
    activity_log: list | None = None
    scheduled_courses: list | None = None

class UserFullResponse(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    profile: ProfileResponse | None

    class Config:
        from_attributes = True
