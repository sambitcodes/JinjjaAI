import uuid
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, Integer, Float, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base

class MasteryScore(Base):
    __tablename__ = "mastery_scores"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    item_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "vocabulary" or "grammar"
    item_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    repetitions: Mapped[int] = mapped_column(Integer, default=0)
    next_review_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="mastery_scores")

class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    # Phase 6 conversation session columns
    scenario_id: Mapped[str] = mapped_column(String(100), nullable=True, default=None)
    mode: Mapped[str] = mapped_column(String(50), nullable=True, default="text") # text|voice
    turn_count: Mapped[int] = mapped_column(Integer, default=0)
    overall_score: Mapped[float] = mapped_column(Float, nullable=True)
    task_completion_score: Mapped[float] = mapped_column(Float, nullable=True)
    accuracy_score: Mapped[float] = mapped_column(Float, nullable=True)
    fluency_score: Mapped[float] = mapped_column(Float, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_role: Mapped[str] = mapped_column(String(50), nullable=False)  # "user" or "assistant"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    correction_metadata: Mapped[dict] = mapped_column(JSONB, nullable=True, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")

class PronunciationAttempt(Base):
    __tablename__ = "pronunciation_attempts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target_text: Mapped[str] = mapped_column(String(500), nullable=False)
    accuracy_score: Mapped[float] = mapped_column(Float, nullable=False)
    phoneme_details: Mapped[dict] = mapped_column(JSONB, nullable=True, default=dict)
    attempted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    # Phase 5 Speaking Lab extensions (nullable for backward compat)
    recognized_text: Mapped[str] = mapped_column(Text, nullable=True, default=None)
    attempt_type: Mapped[str] = mapped_column(String(50), nullable=True, default="shadowing")  # shadowing|pattern|free|assessment

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="pronunciation_attempts")


class UserExerciseAttempt(Base):
    __tablename__ = "user_exercise_attempts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    is_correct: Mapped[bool] = mapped_column(nullable=False)
    time_taken_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_exercise_attempts")

