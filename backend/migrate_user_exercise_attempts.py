import asyncio
from backend.app.core.config import settings
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS user_exercise_attempts (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                exercise_id VARCHAR(100) NOT NULL,
                is_correct BOOLEAN NOT NULL,
                time_taken_ms INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
        """))
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_user_exercise_attempts_user_id ON user_exercise_attempts(user_id)
        """))
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_user_exercise_attempts_exercise_id ON user_exercise_attempts(exercise_id)
        """))
        print("user_exercise_attempts table and indexes created/verified successfully.")
    await engine.dispose()

asyncio.run(run())
