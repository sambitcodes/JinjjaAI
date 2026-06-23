import uuid
import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.core.database import get_db
from backend.app.api.v1.auth import get_current_user
from backend.app.models.user import User
from backend.app.models.study import UserNote
from backend.app.core.config import settings
from pydantic import BaseModel
from typing import List

router = APIRouter()

class NoteCreateRequest(BaseModel):
    course_id: int
    phase_num: int
    step: int
    content: str
    is_ai: bool = False

class NoteAiSummaryRequest(BaseModel):
    course_id: int
    phase_num: int
    step: int
    question: str
    selected_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str | None = None

@router.get("", response_model=List[dict])
async def list_notes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(UserNote).where(UserNote.user_id == current_user.id).order_by(UserNote.created_at.desc())
    result = await db.execute(stmt)
    notes = result.scalars().all()
    return [
        {
            "id": str(n.id),
            "course_id": n.course_id,
            "phase_num": n.phase_num,
            "step": n.step,
            "content": n.content,
            "is_ai": n.is_ai,
            "created_at": n.created_at.isoformat()
        }
        for n in notes
    ]

@router.post("", response_model=dict)
async def create_note(
    payload: NoteCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = UserNote(
        user_id=current_user.id,
        course_id=payload.course_id,
        phase_num=payload.phase_num,
        step=payload.step,
        content=payload.content,
        is_ai=payload.is_ai
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return {
        "id": str(note.id),
        "course_id": note.course_id,
        "phase_num": note.phase_num,
        "step": note.step,
        "content": note.content,
        "is_ai": note.is_ai,
        "created_at": note.created_at.isoformat()
    }

@router.post("/generate-ai-summary", response_model=dict)
async def generate_ai_summary(
    payload: NoteAiSummaryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        "You are Gwan-Sik, an expert, supportive bilingual Korean language tutor.\n"
        "Generate a brief 2-3 sentence review summary in English for the student's personal study diary.\n"
        "Explain what this exercise/question was about, clarify the correct answer, and provide a quick rule of thumb.\n\n"
        f"Exercise Question: {payload.question}\n"
        f"Student's Answer: {payload.selected_answer}\n"
        f"Correct Answer: {payload.correct_answer}\n"
        f"Result: {'Correct' if payload.is_correct else 'Incorrect'}\n"
        f"Explanation Context: {payload.explanation or 'None'}\n\n"
        "Instructions:\n"
        "- Write in clean, concise English.\n"
        "- If the student got it wrong, kindly explain why the correct option fits best.\n"
        "- If they got it right, briefly highlight the grammar rule for positive reinforcement.\n"
        "- Output ONLY the final summary paragraph. No labels, greeting headers, or quotes."
    )

    summary_text = "Review entry generated successfully."
    try:
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload_data = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload_data,
                timeout=20.0
            )
            if response.status_code == 200:
                res_data = response.json()
                summary_text = res_data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"Failed to generate AI note summary: {e}", flush=True)
        # Fallback offline generator
        status_word = "correct" if payload.is_correct else "incorrect"
        summary_text = (
            f"Reviewed the question: '{payload.question}'. "
            f"The answer chosen was {payload.selected_answer} ({status_word}). "
            f"The correct answer is {payload.correct_answer}. "
            f"Tip: {payload.explanation or 'Pay close attention to grammatical register and context particles.'}"
        )

    # Save to database
    note = UserNote(
        user_id=current_user.id,
        course_id=payload.course_id,
        phase_num=payload.phase_num,
        step=payload.step,
        content=summary_text,
        is_ai=True
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)

    return {
        "id": str(note.id),
        "course_id": note.course_id,
        "phase_num": note.phase_num,
        "step": note.step,
        "content": note.content,
        "is_ai": note.is_ai,
        "created_at": note.created_at.isoformat()
    }

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(UserNote).where(UserNote.id == note_id, UserNote.user_id == current_user.id)
    result = await db.execute(stmt)
    note = result.scalars().first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    await db.delete(note)
    await db.commit()
    return
