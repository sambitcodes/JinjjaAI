"""
Direct DB migration script: adds Phase 5 columns to pronunciation_attempts.
Run from /app directory inside the backend container.
"""
import asyncio
from backend.app.core.config import settings
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text(
            "ALTER TABLE pronunciation_attempts ADD COLUMN IF NOT EXISTS recognized_text TEXT"
        ))
        await conn.execute(text(
            "ALTER TABLE pronunciation_attempts ADD COLUMN IF NOT EXISTS attempt_type VARCHAR(50) DEFAULT 'shadowing'"
        ))
        print("Phase 5 DB columns added/verified successfully.")
    await engine.dispose()

asyncio.run(run())
