import uuid
from pydantic import BaseModel

class LessonBase(BaseModel):
    title: str
    level: int
    sequence_order: int
    content_markdown: str
    metadata_json: dict | None = None

class LessonCreate(LessonBase):
    pass

class LessonResponse(LessonBase):
    id: uuid.UUID

    class Config:
        from_attributes = True

class VocabularyBase(BaseModel):
    word_hangul: str
    word_romanized: str
    meaning_english: str
    part_of_speech: str | None = None
    audio_url: str | None = None

class VocabularyResponse(VocabularyBase):
    id: uuid.UUID

    class Config:
        from_attributes = True

class GrammarBase(BaseModel):
    pattern: str
    explanation: str
    usage_rules: str | None = None
    examples: dict | None = None

class GrammarResponse(GrammarBase):
    id: uuid.UUID

    class Config:
        from_attributes = True

class CuratedLessonResponse(BaseModel):
    id: uuid.UUID
    title: str
    level: int
    topic: str
    content_markdown: str
    examples: list
    quizzes: list

    class Config:
        from_attributes = True

