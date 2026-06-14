import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.future import select
from backend.app.core.config import settings
from backend.app.models.user import User, Profile
from backend.app.models.lesson import Lesson, CuratedLesson
from backend.app.models.study import MasteryScore, PronunciationAttempt, Conversation, Message
from backend.app.services.rag_engine import rag_engine_service
from backend.app.core.database import Base
from backend.app.api.router import api_router

# Configure SQLAlchemy mappers explicitly to resolve relationship references
Base.registry.configure()

# Path to the books directory (supports local path and docker volume mapping)
BOOKS_DIR = "/app/korean_book_materials" if os.path.exists("/app/korean_book_materials") else "c:/Users/sambi/OneDrive/Desktop/Projects/HangeulAI/korean_book_materials"

async def ingest_pdfs():
    print("Starting PDF Ingestion Pipeline...")
    
    # Verify directory exists
    if not os.path.exists(BOOKS_DIR):
        print(f"Directory {BOOKS_DIR} not found. Please ensure materials are placed there.")
        return

    # Dynamic import to avoid dependency issues on base environment
    try:
        import pypdf
    except ImportError:
        print("Installing pypdf library for PDF extraction...")
        import subprocess
        subprocess.run(["pip", "install", "pypdf"])
        import pypdf

    # Set up DB connection using app credentials
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = async_sessionmaker(bind=engine, expire_on_commit=False)

    pdf_files = [f for f in os.listdir(BOOKS_DIR) if f.endswith(".pdf")]
    print(f"Found {len(pdf_files)} PDF books for ingestion.")

    async with async_session() as session:
        for idx, filename in enumerate(pdf_files):
            filepath = os.path.join(BOOKS_DIR, filename)
            print(f"[{idx+1}/{len(pdf_files)}] Parsing {filename}...")
            
            # Skip if already ingested
            prefix = filename.replace('.pdf', '')
            stmt_check = select(Lesson).where(Lesson.title.like(f"{prefix} - Chunk %"))
            res_check = await session.execute(stmt_check)
            if res_check.scalars().first():
                print(f"--> {filename} is already ingested. Skipping.")
                continue
            
            try:
                # Read PDF contents
                reader = pypdf.PdfReader(filepath)
                full_text = ""
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        # Clean null bytes which are not supported by PostgreSQL text columns
                        cleaned_text = text.replace('\x00', '')
                        full_text += cleaned_text + "\n"
                
                # Chunk content
                chunks = rag_engine_service.chunk_document(full_text, chunk_size=400, overlap=40)
                print(f"Extracted {len(chunks)} text chunks from {filename}.")

                # Create Lesson records with embeddings
                for c_idx, chunk in enumerate(chunks):
                    embedding_vector = await rag_engine_service.get_embedding(chunk)
                    
                    # Create unique Lesson record
                    lesson = Lesson(
                        title=f"{filename.replace('.pdf', '')} - Chunk {c_idx+1}",
                        level=1 if "Level 1" in filename else (2 if "Level 2" in filename else 3),
                        sequence_order=c_idx + 1,
                        content_markdown=chunk,
                        metadata_json={
                            "source_file": filename,
                            "chunk_index": c_idx,
                            "embedding_dimension": len(embedding_vector)
                        }
                    )
                    session.add(lesson)
                
                await session.commit()
                print(f"Successfully ingested {filename} into database.")
                
            except Exception as e:
                print(f"Error parsing {filename}: {e}")
                await session.rollback()

    await engine.dispose()
    print("Ingestion Pipeline Completed Successfully!")

if __name__ == "__main__":
    asyncio.run(ingest_pdfs())
