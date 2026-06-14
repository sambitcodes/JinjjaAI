import json
from typing import Dict, Any, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.models.lesson import Lesson, CuratedLesson
from backend.app.models.user import Profile
from backend.app.curriculum import PREGENERATED_LESSONS

class CuratedCurriculumService:
    async def get_next_lesson(self, db: AsyncSession, user_id: uuid.UUID, last_mistakes: int | None = None, force_level: int | None = None) -> Dict[str, Any]:
        """
        Loads pregenerated lessons directly from static course configurations,
        bypassing all AI Curation.
        """
        # 1. Fetch user profile
        stmt_prof = select(Profile).where(Profile.user_id == user_id)
        res_prof = await db.execute(stmt_prof)
        profile = res_prof.scalars().first()
        if not profile:
            raise ValueError("User profile not found")

        current_level = force_level if force_level is not None else profile.level_progress
        
        # Get latest curated lesson for this user
        stmt_latest = select(CuratedLesson).where(CuratedLesson.user_id == user_id).order_by(CuratedLesson.created_at.desc())
        res_latest = await db.execute(stmt_latest)
        latest_curated = res_latest.scalars().first()

        next_sequence = 1
        reinforce_mode = False

        if force_level is not None:
            next_sequence = 1
        elif latest_curated:
            if last_mistakes is not None and last_mistakes > 0:
                # Keep level and sequence the same to reinforce concepts (reinforce mode)
                next_sequence = latest_curated.level
                reinforce_mode = True
            else:
                # Advance sequence order
                next_sequence = latest_curated.level + 1

        # Graduation trigger dynamically configured per level length
        level_lessons = PREGENERATED_LESSONS.get(current_level, {})
        if level_lessons and next_sequence > len(level_lessons):
            print(f"--> User graduated from Level {current_level}! Upgrading profile progress to next level", flush=True)
            profile.level_progress = current_level + 1
            await db.commit()
            current_level = current_level + 1
            next_sequence = 1

        # Enforce static lookup
        pregen_data = PREGENERATED_LESSONS.get(current_level, {}).get(next_sequence)
        
        if not pregen_data:
            # High-quality static placeholder for other levels/sequences that aren't loaded yet
            pregen_data = {
                "title": f"Course Level {current_level} - Lesson {next_sequence}",
                "topic": "Curriculum Placeholder",
                "content_markdown": (
                    f"# Course Level {current_level}: Lesson {next_sequence}\n\n"
                    "This course card is fully integrated! Please input your pre-generated course materials here to load them.\n\n"
                    "### Target Focus\n"
                    "*   Advanced grammatical structures\n"
                    "*   Bilingual speaking checks\n"
                    "*   Authentic conversation dialogues"
                ),
                "examples": [
                    {"ko": "한국어 공부", "en": "Korean study", "note": "Placeholder example"}
                ],
                "quizzes": [
                    {
                        "type": "choice",
                        "question": "What is the focus of this card placeholder?",
                        "options": ["Pregenerated content integration", "AI curation", "Speech grading", "Database setup"],
                        "correct_answer": "Pregenerated content integration",
                        "explanation": "This card serves pregenerated content supplied directly by the curriculum map."
                    },
                    {
                        "type": "writing",
                        "question": "Type the word for Korean language (한국어):",
                        "options": None,
                        "correct_answer": "한국어",
                        "explanation": "한국어 is the Korean name for the Korean language."
                    }
                ]
            }

        # Save to database
        curated = CuratedLesson(
            user_id=user_id,
            title=pregen_data["title"],
            level=next_sequence,
            topic=pregen_data["topic"],
            content_markdown=pregen_data["content_markdown"],
            examples=pregen_data["examples"],
            quizzes=pregen_data["quizzes"]
        )
        db.add(curated)
        await db.commit()
        await db.refresh(curated)
        
        return {
            "id": str(curated.id),
            "title": curated.title,
            "level": curated.level,
            "topic": curated.topic,
            "content_markdown": curated.content_markdown,
            "examples": curated.examples,
            "quizzes": curated.quizzes
        }

curated_curriculum_service = CuratedCurriculumService()
