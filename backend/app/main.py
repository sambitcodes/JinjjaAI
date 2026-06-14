from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.core.config import settings
from backend.app.api.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Mount book materials directory safely
import os
materials_dir = "/app/korean_book_materials"
if not os.path.exists(materials_dir):
    local_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "korean_book_materials"))
    if os.path.exists(local_path):
        materials_dir = local_path
    else:
        os.makedirs(materials_dir, exist_ok=True)

app.mount("/materials", StaticFiles(directory=materials_dir), name="materials")

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS],
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
