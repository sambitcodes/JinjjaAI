import asyncio
from backend.app.core.config import settings
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    # settings.DATABASE_URL is used by the application
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        print("Clearing all user activity, progress, achievements, and mastery scores for every user...")
        
        # Deleting all user attempts, messages, conversations, mastery scores, curated lessons
        await conn.execute(text("DELETE FROM user_exercise_attempts"))
        await conn.execute(text("DELETE FROM pronunciation_attempts"))
        await conn.execute(text("DELETE FROM mastery_scores"))
        await conn.execute(text("DELETE FROM curated_lessons"))
        await conn.execute(text("DELETE FROM messages"))
        await conn.execute(text("DELETE FROM conversations"))
        
        # Reset profiles to base levels
        await conn.execute(text("""
            UPDATE profiles 
            SET total_xp = 0,
                current_streak = 0,
                level_progress = 1
        """))
        
        print("Successfully reset progress for all users in database.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
