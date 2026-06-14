import asyncio
from backend.app.core.config import settings
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text(
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course_states JSONB DEFAULT '{}'::jsonb"
        ))
        await conn.execute(text(
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activity_log JSONB DEFAULT '[]'::jsonb"
        ))
        await conn.execute(text(
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS scheduled_courses JSONB DEFAULT '[]'::jsonb"
        ))
        print("Profile JSONB columns added/verified successfully.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
