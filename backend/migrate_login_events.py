"""
Migration: Create login_events table for admin tracking.
Run with: python migrate_login_events.py
"""

import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# ── Get DB URL ────────────────────────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

raw_url = os.getenv("DATABASE_URL", "")
if not raw_url:
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgres")
    server = os.getenv("POSTGRES_SERVER", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    db = os.getenv("POSTGRES_DB", "hangeulai")
    raw_url = f"postgresql+asyncpg://{user}:{password}@{server}:{port}/{db}"
elif raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+asyncpg://"):
    raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS login_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    event_type VARCHAR(20) NOT NULL,
    method VARCHAR(20) NOT NULL,
    ip_address VARCHAR(100),
    user_agent VARCHAR(500),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_login_events_user_id ON login_events(user_id);
CREATE INDEX IF NOT EXISTS ix_login_events_email   ON login_events(email);
CREATE INDEX IF NOT EXISTS ix_login_events_timestamp ON login_events(timestamp DESC);
"""

async def migrate():
    engine = create_async_engine(raw_url, echo=True)
    async with engine.begin() as conn:
        await conn.execute(text(CREATE_TABLE_SQL))
    await engine.dispose()
    print("\n✅ login_events table created successfully!")

if __name__ == "__main__":
    asyncio.run(migrate())
