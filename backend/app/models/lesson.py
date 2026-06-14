import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base
from backend.app.models.user import User

class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False)
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[dict] = mapped_column(JSONB, nullable=True, default=dict)

class Vocabulary(Base):
    __tablename__ = "vocabulary"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    word_hangul: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    word_romanized: Mapped[str] = mapped_column(String(255), nullable=False)
    meaning_english: Mapped[str] = mapped_column(String(555), nullable=False)
    part_of_speech: Mapped[str] = mapped_column(String(100), nullable=True)
    audio_url: Mapped[str] = mapped_column(String(555), nullable=True)

class Grammar(Base):
    __tablename__ = "grammar"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    pattern: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    usage_rules: Mapped[str] = mapped_column(Text, nullable=True)
    examples: Mapped[dict] = mapped_column(JSONB, nullable=True, default=dict)

class CuratedLesson(Base):
    __tablename__ = "curated_lessons"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    examples: Mapped[list] = mapped_column(JSONB, nullable=False, default=list) # Array of: {ko, en, note}
    quizzes: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)  # Array of: {type, question, options, correct_answer, explanation}
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user: Mapped["User"] = relationship(User, back_populates="curated_lessons", foreign_keys=[user_id])

