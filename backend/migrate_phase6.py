"""
Direct DB migration script: adds Phase 6 columns to conversations.
Run from /app directory inside the backend container.
"""
import asyncio
from backend.app.core.config import settings
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        # Add nullable columns if they do not exist
        await conn.execute(text(
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS scenario_id VARCHAR(100)"
        ))
        await conn.execute(text(
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS mode VARCHAR(50) DEFAULT 'text'"
        ))
        await conn.execute(text(
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS turn_count INTEGER DEFAULT 0"
        ))
        await conn.execute(text(
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS overall_score FLOAT"
        ))
        await conn.execute(text(
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS task_completion_score FLOAT"
        ))
        await conn.execute(text(
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS accuracy_score FLOAT"
        ))
        await conn.execute(text(
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS fluency_score FLOAT"
        ))
        print("Phase 6 DB columns added/verified successfully.")
    await engine.dispose()

asyncio.run(run())
