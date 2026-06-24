from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.core.config import settings
from backend.app.api.router import api_router

from contextlib import asynccontextmanager
from backend.app.core.database import engine, Base
from sqlalchemy import text
# Import all models so they register with Base before create_all
from backend.app.models import user, lesson, study

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Lifespan: Verifying and creating database tables...", flush=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Lifespan: Database tables verified/created successfully. Running migration checks...", flush=True)
        await conn.execute(text(
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(50)"
        ))
        # Admin: create login_events table if it doesn't exist yet
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS login_events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                email VARCHAR(255) NOT NULL,
                event_type VARCHAR(20) NOT NULL,
                method VARCHAR(20) NOT NULL,
                ip_address VARCHAR(100),
                user_agent VARCHAR(500),
                timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_login_events_user_id ON login_events(user_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_login_events_email ON login_events(email)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_login_events_timestamp ON login_events(timestamp DESC)"
        ))
        print("Lifespan: login_events table verified/created successfully.", flush=True)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Mount book materials directory safely
import os

def _find_materials_dir() -> str:
    # The Dockerfile copies the repo into /app/backend/, so PDFs land at:
    #   /app/backend/korean_book_materials/
    # __file__ is /app/backend/app/main.py  →  go up 2 levels to reach /app/backend/
    candidates = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "korean_book_materials")),  # Docker: /app/backend/korean_book_materials
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "korean_book_materials")),  # Local dev fallback
        "/app/korean_book_materials",  # Legacy override
    ]
    for candidate in candidates:
        if os.path.isdir(candidate) and any(f.endswith(".pdf") for f in os.listdir(candidate) if os.path.isfile(os.path.join(candidate, f))):
            print(f"Materials dir found: {candidate}", flush=True)
            return candidate
    # Nothing found – create a placeholder so StaticFiles doesn't crash
    fallback = candidates[0]
    os.makedirs(fallback, exist_ok=True)
    print(f"WARNING: No PDFs found. Created empty materials dir: {fallback}", flush=True)
    return fallback

materials_dir = _find_materials_dir()
app.mount("/materials", StaticFiles(directory=materials_dir), name="materials")

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    origins = [str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS]
    print(f"DEBUG CORS: Allowed origins configured: {origins}", flush=True)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include core routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }
