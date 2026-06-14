from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from backend.app.core.config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=False
)

# Async session factory
async_session_factory = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

# Dependency to get db session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
