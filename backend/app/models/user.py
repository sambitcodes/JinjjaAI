import uuid
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, Integer, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    profile: Mapped["Profile"] = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    mastery_scores: Mapped[list["MasteryScore"]] = relationship("MasteryScore", back_populates="user", cascade="all, delete-orphan")
    conversations: Mapped[list["Conversation"]] = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    pronunciation_attempts: Mapped[list["PronunciationAttempt"]] = relationship("PronunciationAttempt", back_populates="user", cascade="all, delete-orphan")
    curated_lessons: Mapped[list["CuratedLesson"]] = relationship("CuratedLesson", back_populates="user", cascade="all, delete-orphan")
    user_exercise_attempts: Mapped[list["UserExerciseAttempt"]] = relationship("UserExerciseAttempt", back_populates="user", cascade="all, delete-orphan")
    user_notes: Mapped[list["UserNote"]] = relationship("UserNote", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=True)
    native_language: Mapped[str] = mapped_column(String(50), default="English")
    level_progress: Mapped[int] = mapped_column(Integer, default=1)
    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_active: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Onboarding details
    dob: Mapped[str] = mapped_column(String(50), nullable=True)
    gender: Mapped[str] = mapped_column(String(50), nullable=True)
    study_reason: Mapped[str] = mapped_column(String(255), nullable=True)
    occupation: Mapped[str] = mapped_column(String(100), nullable=True)
    korean_culture_experience: Mapped[str] = mapped_column(String(255), nullable=True)
    korean_proficiency: Mapped[str] = mapped_column(String(100), nullable=True)
    korean_name: Mapped[str] = mapped_column(String(100), nullable=True)
    avatar_base64: Mapped[str] = mapped_column(String, nullable=True)
    
    course_states: Mapped[dict] = mapped_column(JSONB, nullable=True, default=dict)
    activity_log: Mapped[list] = mapped_column(JSONB, nullable=True, default=list)
    scheduled_courses: Mapped[list] = mapped_column(JSONB, nullable=True, default=list)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="profile")
