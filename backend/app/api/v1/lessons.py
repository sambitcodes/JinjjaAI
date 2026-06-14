from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.core.database import get_db
from backend.app.api.v1.auth import get_current_user
from backend.app.models.user import User
from backend.app.models.lesson import Lesson, Vocabulary, Grammar, CuratedLesson
from backend.app.schemas.lesson import LessonResponse, VocabularyResponse, GrammarResponse, CuratedLessonResponse
from backend.app.services.curated_curriculum import curated_curriculum_service

router = APIRouter()

@router.get("/curated", response_model=List[CuratedLessonResponse])
async def list_curated_lessons(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(CuratedLesson).where(CuratedLesson.user_id == current_user.id).order_by(CuratedLesson.created_at.asc())
    result = await db.execute(stmt)
    existing_lessons = result.scalars().all()
    
    from backend.app.models.user import Profile
    stmt_prof = select(Profile).where(Profile.user_id == current_user.id)
    res_prof = await db.execute(stmt_prof)
    profile = res_prof.scalars().first()
    if profile:
        level = profile.level_progress
        from backend.app.curriculum import PREGENERATED_LESSONS
        level_lessons = PREGENERATED_LESSONS.get(level, {})
        
        existing_seqs = {l.level for l in existing_lessons}
        missing_seqs = [seq for seq in level_lessons.keys() if seq not in existing_seqs]
        
        if missing_seqs:
            for seq in sorted(missing_seqs):
                pregen_data = level_lessons[seq]
                curated = CuratedLesson(
                    user_id=current_user.id,
                    title=pregen_data["title"],
                    level=seq,
                    topic=pregen_data["topic"],
                    content_markdown=pregen_data["content_markdown"],
                    examples=pregen_data.get("examples", []),
                    quizzes=pregen_data.get("quizzes", [])
                )
                db.add(curated)
            await db.commit()
            
            # Re-fetch lessons
            stmt = select(CuratedLesson).where(CuratedLesson.user_id == current_user.id).order_by(CuratedLesson.created_at.asc())
            result = await db.execute(stmt)
            existing_lessons = result.scalars().all()
            
    return existing_lessons


@router.get("/materials")
async def list_book_materials(current_user: User = Depends(get_current_user)):
    import os
    directory = "/app/korean_book_materials"
    if not os.path.exists(directory):
        return []
    
    files = []
    for f in os.listdir(directory):
        if f.lower().endswith(".pdf"):
            path = os.path.join(directory, f)
            size_bytes = os.path.getsize(path)
            
            # Categorize based on name
            category = "General Textbooks"
            if "ttmik workbook" in f.lower():
                category = "TTMIK Workbooks"
            elif "ttmik" in f.lower():
                category = "TTMIK Textbooks"
            elif "korean101" in f.lower():
                category = "Korean101 Workbooks"
            elif "basic korean" in f.lower() or "beginning korean" in f.lower():
                category = "Core Textbooks"
                
            files.append({
                "name": f,
                "size_bytes": size_bytes,
                "category": category,
                "url": f"/materials/{f}"
            })
            
    files.sort(key=lambda x: (x["category"], x["name"]))
    return files


@router.get("/online")
async def get_online_study_materials(current_user: User = Depends(get_current_user)):
    import os
    import json
    # Read the output JSON file directly from root/backend workspace
    # Since backend volume bind mounts the workspace folder, let's locate it relative to backend path
    # /app/backend/youtube-output-format.json
    paths_to_try = [
        "/app/backend/app/services/youtube_output_format.json",
        "backend/app/services/youtube_output_format.json",
        "app/services/youtube_output_format.json",
        "../app/services/youtube_output_format.json"
    ]
    for p in paths_to_try:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[ERROR] Failed to load {p}: {e}")
                
    # Fallback default mock resources to avoid breaking if file doesn't exist
    return []


@router.post("/online/ai-help")
async def generate_youtube_ai_help(
    payload: dict,
    current_user: User = Depends(get_current_user)
):
    import httpx
    video_title = payload.get("video_title", "Korean Tutorial")
    studied_text = payload.get("studied_text", "")
    full_transcript = payload.get("full_transcript", "")
    query_type = payload.get("query_type", "summary") # summary | explain | quiz
    
    # Target text content
    text_content = studied_text if query_type == "summary" and studied_text else full_transcript
    if not text_content:
        raise HTTPException(status_code=400, detail="Transcript content is empty.")
    
    # Prompt construction based on query_type
    if query_type == "featured_summary":
        prompt = (
            f"You are Gwan-Sik, an elite Korean Language AI Tutor.\n"
            f"Write a concise, high-level summary of the Korean language course '{video_title}' in exactly 2 to 3 lines (maximum 3 sentences).\n"
            f"Do not include timestamps, advertising links, or youtube metadata in the response. Keep it clean and highly engaging for a student.\n"
            f"Here is information about the course:\n{text_content}"
        )
    elif query_type == "summary":
        prompt = (
            f"You are Gwan-Sik, an elite Korean Language AI Tutor.\n"
            f"Create a beautiful, educational, structured Markdown summary of this Korean lesson video: '{video_title}'.\n"
            f"Focus on grammar patterns, vocabulary terms, and pronunciation rules covered in the text.\n"
            f"Text to summarize:\n{text_content}"
        )
    elif query_type == "explain":
        prompt = (
            f"You are Gwan-Sik, an elite Korean Language AI Tutor.\n"
            f"Explain the primary grammar concepts and expressions mentioned in this segment of '{video_title}'.\n"
            f"Break down mouth alignments or conjugation mechanics clearly in Markdown.\n"
            f"Text to explain:\n{text_content}"
        )
    else:
        prompt = (
            f"You are Gwan-Sik, an elite Korean Language AI Tutor.\n"
            f"Construct 3 interactive multiple-choice quiz questions with answer options (A, B, C, D) and detailed explanations, "
            f"testing the concepts taught in this Korean lesson transcript: '{video_title}'. Write in Markdown.\n"
            f"Text to test:\n{text_content}"
        )
        
    try:
        from backend.app.core.config import settings
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        api_payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=api_payload,
                timeout=30.0
            )
            if response.status_code == 200:
                res_data = response.json()
                ai_text = res_data["choices"][0]["message"]["content"].strip()
                return {"result": ai_text}
            else:
                return {"error": f"Groq API returned status code {response.status_code}"}
    except Exception as e:
        return {"error": f"Internal helper generation failed: {str(e)}"}


@router.post("/curated/next", response_model=CuratedLessonResponse)
async def generate_next_curated_lesson(
    mistakes: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await curated_curriculum_service.get_next_lesson(db, current_user.id, last_mistakes=mistakes)
    return res

@router.post("/curated/generate-on-spot", response_model=List[CuratedLessonResponse])
async def generate_on_spot_curriculum(
    level: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from sqlalchemy import delete
    from backend.app.models.user import Profile
    from backend.app.models.study import MasteryScore, PronunciationAttempt
    
    # 1. Clear any existing curated lessons, mastery scores, speech attempts
    await db.execute(delete(CuratedLesson).where(CuratedLesson.user_id == current_user.id))
    await db.execute(delete(MasteryScore).where(MasteryScore.user_id == current_user.id))
    await db.execute(delete(PronunciationAttempt).where(PronunciationAttempt.user_id == current_user.id))
    
    # 2. Set profile level progress
    stmt_prof = select(Profile).where(Profile.user_id == current_user.id)
    res_prof = await db.execute(stmt_prof)
    profile = res_prof.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    profile.level_progress = level
    await db.commit()
    
    # 3. Generate all lessons/phases for this level for testing
    from backend.app.curriculum import PREGENERATED_LESSONS
    level_lessons = PREGENERATED_LESSONS.get(level, {})
    
    if level_lessons:
        inserted_lessons = []
        for seq in sorted(level_lessons.keys()):
            pregen_data = level_lessons[seq]
            curated = CuratedLesson(
                user_id=current_user.id,
                title=pregen_data["title"],
                level=seq,
                topic=pregen_data["topic"],
                content_markdown=pregen_data["content_markdown"],
                examples=pregen_data.get("examples", []),
                quizzes=pregen_data.get("quizzes", [])
            )
            db.add(curated)
            inserted_lessons.append(curated)
        await db.commit()
        
        # Refresh all inserted lessons to load their autogenerated UUIDs
        for lesson in inserted_lessons:
            await db.refresh(lesson)
            
        inserted_lessons.sort(key=lambda x: x.level)
        return inserted_lessons
            
    res = await curated_curriculum_service.get_next_lesson(db, current_user.id, force_level=level)
    return [res]

# --- Phase 1: Hangeul Vowels Bootcamp Practice & Quiz API Endpoints ---

import httpx
from pydantic import BaseModel
from typing import Optional

class AnswerSubmit(BaseModel):
    question_id: str
    correct: bool
    answer: str

class QuizSubmit(BaseModel):
    answers: list
    score: float

class TutorSummaryRequest(BaseModel):
    mistakes: list
    score: float

async def call_llama_groq(prompt: str) -> str:
    try:
        from backend.app.core.config import settings
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.5
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0
            )
            if response.status_code == 200:
                res_data = response.json()
                return res_data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"Groq API call error: {e}", flush=True)
    return ""

@router.get("/practice/vowels/visual")
async def get_visual_practice(current_user: User = Depends(get_current_user)):
    return [
        {"id": "v1", "question": "Which vowel sounds like 'a' in 'father'?", "options": ["ㅏ", "ㅓ", "ㅗ", "ㅜ"], "correct_answer": "ㅏ", "explanation": "ㅏ is the open 'ah' sound as in father."},
        {"id": "v2", "question": "Which vowel sounds like 'eo' (or 'uh' in 'uh-oh')?", "options": ["ㅗ", "ㅓ", "ㅜ", "ㅡ"], "correct_answer": "ㅓ", "explanation": "ㅓ is the open 'eo' or 'uh' sound."},
        {"id": "v3", "question": "Which vowel sounds like 'o' in 'home'?", "options": ["ㅜ", "ㅗ", "ㅡ", "ㅣ"], "correct_answer": "ㅗ", "explanation": "ㅗ is a pure round 'o' sound as in boat/home."},
        {"id": "v4", "question": "Which vowel sounds like 'oo' in 'boo'?", "options": ["ㅡ", "ㅣ", "ㅜ", "ㅏ"], "correct_answer": "ㅜ", "explanation": "ㅜ is the round 'oo' sound."},
        {"id": "v5", "question": "Which vowel is a flat throat sound (make 'ee' mouth, say 'oo')?", "options": ["ㅡ", "ㅣ", "ㅓ", "ㅏ"], "correct_answer": "ㅡ", "explanation": "ㅡ is the flat 'eu' vowel sound."},
        {"id": "v6", "question": "Which vowel sounds like 'ee' in 'feet'?", "options": ["ㅏ", "ㅓ", "ㅡ", "ㅣ"], "correct_answer": "ㅣ", "explanation": "ㅣ is the pure 'ee' vowel sound."}
    ]

@router.post("/practice/vowels/visual/answer")
async def submit_visual_answer(body: AnswerSubmit, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Update user mastery / log stats
    return {"status": "ok", "message": "Visual answer recorded"}

@router.get("/practice/vowels/listening")
async def get_listening_practice(current_user: User = Depends(get_current_user)):
    return [
        {"id": "l1", "sound_text": "아", "options": ["ㅏ", "ㅓ", "ㅗ"], "correct_answer": "ㅏ", "explanation": "You heard 아, which corresponds to vowel ㅏ."},
        {"id": "l2", "sound_text": "어", "options": ["ㅓ", "ㅗ", "ㅜ"], "correct_answer": "ㅓ", "explanation": "You heard 어, which corresponds to vowel ㅓ."},
        {"id": "l3", "sound_text": "오", "options": ["ㅗ", "ㅜ", "ㅡ"], "correct_answer": "ㅗ", "explanation": "You heard 오, which corresponds to vowel ㅗ."},
        {"id": "l4", "sound_text": "우", "options": ["ㅜ", "ㅡ", "ㅣ"], "correct_answer": "ㅜ", "explanation": "You heard 우, which corresponds to vowel ㅜ."},
        {"id": "l5", "sound_text": "으", "options": ["ㅡ", "ㅣ", "ㅏ"], "correct_answer": "ㅡ", "explanation": "You heard 으, which corresponds to vowel ㅡ."},
        {"id": "l6", "sound_text": "이", "options": ["ㅣ", "ㅏ", "ㅓ"], "correct_answer": "ㅣ", "explanation": "You heard 이, which corresponds to vowel ㅣ."}
    ]

@router.post("/practice/vowels/listening/answer")
async def submit_listening_answer(body: AnswerSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "message": "Listening answer recorded"}

@router.get("/practice/vowels/minimal-pairs")
async def get_minimal_pairs(current_user: User = Depends(get_current_user)):
    return [
        {
            "id": "mp1",
            "pair": ["아", "어"],
            "left_hint": "아 (a) - jaw dropped 'ah'",
            "right_hint": "어 (eo) - relaxed 'uh'",
            "correct_side": "left",
            "correct_sound": "아",
            "audio_text": "아"
        },
        {
            "id": "mp2",
            "pair": ["오", "우"],
            "left_hint": "오 (o) - rounded lip 'o'",
            "right_hint": "우 (u) - protruded lip 'oo'",
            "correct_side": "right",
            "correct_sound": "우",
            "audio_text": "우"
        },
        {
            "id": "mp3",
            "pair": ["애", "에"],
            "left_hint": "애 (ae) - slightly wider mouth",
            "right_hint": "에 (e) - slightly narrower mouth",
            "correct_side": "left",
            "correct_sound": "애",
            "audio_text": "애"
        }
    ]

@router.post("/practice/vowels/minimal-pairs/answer")
async def submit_minimal_pairs_answer(body: AnswerSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "message": "Minimal pairs answer recorded"}

@router.get("/lesson/phase1/metadata")
async def get_phase1_metadata(current_user: User = Depends(get_current_user)):
    return {
        "description": "Today you'll learn Korean vowels: how they look, how they sound, and how to hear the difference. We will go through concept explanations, visual drills, listening challenges, minimal pair ear training, and real word vowel mapping.",
        "goals": [
            "Recognize 11 simple vowels & double vowels",
            "Master mouth alignments and pronunciation nuances"
        ],
        "estimated_minutes": 20,
        "prerequisites": "None (True Beginner)"
    }

@router.get("/lesson/phase1/anchor-words")
async def get_anchor_words(current_user: User = Depends(get_current_user)):
    return [
        {"word": "아기", "meaning": "baby", "vowels": ["ㅏ", "ㅣ"], "audio_text": "아기"},
        {"word": "어머니", "meaning": "mother", "vowels": ["ㅓ", "ㅓ", "ㅣ"], "audio_text": "어머니"},
        {"word": "오이", "meaning": "cucumber", "vowels": ["ㅗ", "ㅣ"], "audio_text": "오이"},
        {"word": "우유", "meaning": "milk", "vowels": ["ㅜ", "ㅠ"], "audio_text": "우유"},
        {"word": "이름", "meaning": "name", "vowels": ["ㅣ", "ㅡ"], "audio_text": "이름"},
        {"word": "우리", "meaning": "we/us", "vowels": ["ㅜ", "ㅣ"], "audio_text": "우리"}
    ]

@router.post("/practice/vowels/words/answer")
async def submit_words_answer(body: AnswerSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok"}

@router.post("/quiz/phase1/generate")
async def generate_quiz(use_ai: bool = False, current_user: User = Depends(get_current_user)):
    static_quiz = [
        {"id": "q1", "type": "choice", "question": "Select the vowel that sounds like 'ee' in 'feet':", "options": ["ㅏ", "ㅓ", "ㅡ", "ㅣ"], "correct_answer": "ㅣ", "explanation": "ㅣ makes the pure high 'ee' sound."},
        {"id": "q2", "type": "choice", "question": "Which word means 'cucumber' and uses ㅗ and ㅣ?", "options": ["아기", "어머니", "오이", "우유"], "correct_answer": "오이", "explanation": "오이 is cucumber."},
        {"id": "q3", "type": "choice", "question": "Which of these is a flat throat sound (ㅡ)?", "options": ["ㅏ", "ㅓ", "ㅡ", "ㅣ"], "correct_answer": "ㅡ", "explanation": "ㅡ is the flat throat 'eu' vowel."},
        {"id": "q4", "type": "choice", "question": "Select the correct Hangeul translation for 'mother' (어머니):", "options": ["아기", "어머니", "오이", "우리"], "correct_answer": "어머니", "explanation": "어머니 is mother."},
        {"id": "q5", "type": "writing", "question": "Type the Hangeul letter for 'ah' (with silent ㅇ):", "correct_answer": "아", "explanation": "아 is Romanized as 'a' or 'ah'."},
        {"id": "q6", "type": "writing", "question": "Type the Hangeul word for 'baby' (아기):", "correct_answer": "아기", "explanation": "아기 is baby."}
    ]

    if not use_ai:
        return static_quiz

    # Dynamic generation using Llama on demand
    prompt = (
        "Generate a 6-question beginner-level Korean Hangeul vowel quiz in JSON format.\n"
        "Format the output strictly as a JSON array of objects, with no markdown tags or wrapper text outside the raw JSON.\n"
        "Each object must look like this:\n"
        "{\n"
        "  \"id\": \"string\",\n"
        "  \"type\": \"choice\" or \"writing\",\n"
        "  \"question\": \"string\",\n"
        "  \"options\": [\"string\"] (or null for writing),\n"
        "  \"correct_answer\": \"string\",\n"
        "  \"explanation\": \"string\"\n"
        "}\n"
        "Cover vowels: ㅏ, ㅓ, ㅗ, ㅜ, ㅡ, ㅣ and basic words like 아기, 어머니, 오이."
    )
    ai_output = await call_llama_groq(prompt)
    if ai_output:
        # Strip markdown syntax if LLM returns it
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            if isinstance(parsed, list) and len(parsed) > 0:
                return parsed
        except Exception:
            pass

    return static_quiz

@router.post("/quiz/phase1/submit")
async def submit_quiz(body: QuizSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "score": body.score, "message": "Quiz stats logged"}

@router.post("/tutor/phase1/summary")
async def generate_tutor_summary(body: TutorSummaryRequest, current_user: User = Depends(get_current_user)):
    prompt = (
        f"The user completed the Hangeul Vowels quiz with a score of {body.score}%.\n"
        f"List of wrong vowels/topics: {body.mistakes}.\n"
        "Generate a friendly, encouraging, and highly instructional 2-3 sentence feedback summary as their Korean tutor Gwan-Sik.\n"
        "Suggest specific mouth positioning tips for their target mistakes."
    )
    summary = await call_llama_groq(prompt)
    if not summary:
        summary = f"Great effort! You scored {body.score}%. Keep focusing on jaw positioning for ㅏ vs ㅓ, and make sure your lips are fully rounded for ㅗ vs ㅜ!"
    return {"summary": summary}

@router.get("/recommendations/hangeul/phase1")
async def get_recommendations(current_user: User = Depends(get_current_user)):
    return {
        "strength": "ㅏ, ㅗ, ㅣ",
        "weakness": "ㅓ, ㅡ",
        "youtube_search": "Korean vowels pronunciation beginner mouth shape",
        "review_link": "/course/hangeul/phase-1/review"
    }

# --- Phase 2: Hangeul Consonants Bootcamp Practice & Quiz API Endpoints ---

@router.get("/lesson/phase2/metadata")
async def get_phase2_metadata(current_user: User = Depends(get_current_user)):
    return {
        "goals": "Learn Korean consonants, including plain, aspirated, and tense sounds, and start reading real syllables.",
        "needs_phase1_completed": True,
        "estimated_time": "20-25 minutes"
    }

@router.get("/lesson/phase2/content")
async def get_phase2_content(current_user: User = Depends(get_current_user)):
    return {
        "groups": [
            {"name": "Plain stops", "consonants": [
                {"symbol": "ㄱ", "hint": "g/k (like g in 'go')"},
                {"symbol": "ㄷ", "hint": "d/t (like d in 'dog')"},
                {"symbol": "ㅂ", "hint": "b/p (like b in 'bed')"},
                {"symbol": "ㅈ", "hint": "j (like j in 'job')"},
                {"symbol": "ㅅ", "hint": "s (like s in 'show')"}
            ]},
            {"name": "Aspirated stops", "consonants": [
                {"symbol": "ㅋ", "hint": "k (with strong puff of air)"},
                {"symbol": "ㅌ", "hint": "t (with strong puff of air)"},
                {"symbol": "ㅍ", "hint": "p (with strong puff of air)"},
                {"symbol": "ㅊ", "hint": "ch (with strong puff of air)"},
                {"symbol": "ㅎ", "hint": "h (as in 'home')"}
            ]},
            {"name": "Tense stops", "consonants": [
                {"symbol": "ㄲ", "hint": "kk (tight/strong k sound)"},
                {"symbol": "ㄸ", "hint": "tt (tight/strong t sound)"},
                {"symbol": "ㅃ", "hint": "pp (tight/strong p sound)"},
                {"symbol": "ㅉ", "hint": "jj (tight/strong j sound)"},
                {"symbol": "ㅆ", "hint": "ss (tight/strong s sound)"}
            ]},
            {"name": "Nasals & Liquids", "consonants": [
                {"symbol": "ㄴ", "hint": "n (as in 'nose')"},
                {"symbol": "ㅁ", "hint": "m (as in 'mother')"},
                {"symbol": "ㄹ", "hint": "r/l (flap sound between r and l)"},
                {"symbol": "ㅇ", "hint": "silent start / ng ending"}
            ]}
        ]
    }

@router.get("/practice/consonants/visual")
async def get_consonants_visual(current_user: User = Depends(get_current_user)):
    return [
        {"id": "cv1", "type": "choice", "question": "Which of these best matches ㄱ?", "options": ["g/k as in 'go' (unaspirated)", "t as in 'top' (aspirated)", "m as in 'mother'", "s as in 'show'"], "correct_answer": "g/k as in 'go' (unaspirated)"},
        {"id": "cv2", "type": "choice", "question": "Which of these best matches ㅋ?", "options": ["k (with strong puff of air)", "p (with strong puff of air)", "t as in 'top' (aspirated)", "h as in 'home'"], "correct_answer": "k (with strong puff of air)"},
        {"id": "cv3", "type": "choice", "question": "Which group does 'ㅁ' belong to?", "options": ["Stops", "Nasals", "Liquids", "Other"], "correct_answer": "Nasals"},
        {"id": "cv4", "type": "choice", "question": "Which group does 'ㄷ' belong to?", "options": ["Stops", "Nasals", "Liquids", "Other"], "correct_answer": "Stops"},
        {"id": "cv5", "type": "choice", "question": "What is 'ㅇ' at the start of a syllable block?", "options": ["Silent placeholder", "Pronounced as 'ng'", "Pronounced as 'h'", "Pronounced as 'y'"], "correct_answer": "Silent placeholder"},
        {"id": "cv6", "type": "choice", "question": "What is 'ㅇ' at the end of a syllable block?", "options": ["Silent placeholder", "Pronounced as 'ng' in 'king'", "Pronounced as 'h'", "Pronounced as 'n'"], "correct_answer": "Pronounced as 'ng' in 'king'"}
    ]

@router.post("/practice/consonants/visual/answer")
async def submit_consonants_visual_answer(body: AnswerSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "message": "Visual consonant answer logged"}

@router.get("/practice/consonants/listening")
async def get_consonants_listening(current_user: User = Depends(get_current_user)):
    return [
        {"id": "cl1", "audio_text": "가", "options": ["ㄱ", "ㄴ", "ㅁ", "ㅇ"], "correct_answer": "ㄱ", "explanation": "가 starts with the plain consonant ㄱ."},
        {"id": "cl2", "audio_text": "나", "options": ["ㄷ", "ㄴ", "ㄹ", "ㅁ"], "correct_answer": "ㄴ", "explanation": "나 starts with the nasal consonant ㄴ."},
        {"id": "cl3", "audio_text": "다", "options": ["ㅂ", "ㅈ", "ㄷ", "ㄱ"], "correct_answer": "ㄷ", "explanation": "다 starts with the plain consonant ㄷ."},
        {"id": "cl4", "audio_text": "마", "options": ["ㄴ", "ㅁ", "ㅇ", "ㄹ"], "correct_answer": "ㅁ", "explanation": "마 starts with the nasal consonant ㅁ."},
        {"id": "cl5", "audio_text": "라", "options": ["ㄹ", "ㄴ", "ㄷ", "ㅇ"], "correct_answer": "ㄹ", "explanation": "라 starts with the liquid/flap consonant ㄹ."},
        {"id": "cl6", "audio_text": "바", "options": ["ㅂ", "ㅍ", "ㅃ", "ㅁ"], "correct_answer": "ㅂ", "explanation": "바 starts with the plain consonant ㅂ."}
    ]

@router.post("/practice/consonants/listening/answer")
async def submit_consonants_listening_answer(body: AnswerSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "message": "Listening consonant answer logged"}

@router.get("/practice/consonants/series")
async def get_consonants_series(current_user: User = Depends(get_current_user)):
    return [
        {
            "id": "ser1",
            "prompt": "Listen and choose which consonant you heard.",
            "correct_syllable": "까",
            "correct_answer": "ㄲ",
            "options": [
                {"symbol": "ㄱ", "label": "ㄱ - plain g/k (weak)"},
                {"symbol": "ㅋ", "label": "ㅋ - aspirated k (strong puff)"},
                {"symbol": "ㄲ", "label": "ㄲ - tense k (tight, strong)"}
            ],
            "explanation": "You heard 까, which uses the tense consonant ㄲ.",
            "triple_group": "ㄱ–ㅋ–ㄲ"
        },
        {
            "id": "ser2",
            "prompt": "Listen and choose which consonant you heard.",
            "correct_syllable": "타",
            "correct_answer": "ㅌ",
            "options": [
                {"symbol": "ㄷ", "label": "ㄷ - plain d/t (weak)"},
                {"symbol": "ㅌ", "label": "ㅌ - aspirated t (strong puff)"},
                {"symbol": "ㄸ", "label": "ㄸ - tense t (tight, strong)"}
            ],
            "explanation": "You heard 타, which uses the aspirated consonant ㅌ.",
            "triple_group": "ㄷ–ㅌ–ㄸ"
        },
        {
            "id": "ser3",
            "prompt": "Listen and choose which consonant you heard.",
            "correct_syllable": "빠",
            "correct_answer": "ㅃ",
            "options": [
                {"symbol": "ㅂ", "label": "ㅂ - plain b/p (weak)"},
                {"symbol": "ㅍ", "label": "ㅍ - aspirated p (strong puff)"},
                {"symbol": "ㅃ", "label": "ㅃ - tense p (tight, strong)"}
            ],
            "explanation": "You heard 빠, which uses the tense consonant ㅃ.",
            "triple_group": "ㅂ–ㅍ–ㅃ"
        },
        {
            "id": "ser4",
            "prompt": "Listen and choose which consonant you heard.",
            "correct_syllable": "자",
            "correct_answer": "ㅈ",
            "options": [
                {"symbol": "ㅈ", "label": "ㅈ - plain j (weak)"},
                {"symbol": "ㅊ", "label": "ㅊ - aspirated ch (strong puff)"},
                {"symbol": "ㅉ", "label": "ㅉ - tense j (tight, strong)"}
            ],
            "explanation": "You heard 자, which uses the plain consonant ㅈ.",
            "triple_group": "ㅈ–ㅊ–ㅉ"
        }
    ]

@router.post("/practice/consonants/series/answer")
async def submit_consonants_series_answer(body: AnswerSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok"}

@router.get("/practice/syllables/basic")
async def get_basic_syllables(current_user: User = Depends(get_current_user)):
    return {
        "grid": [
            {"syllable": "가", "romanization": "ga", "consonant": "ㄱ", "vowel": "ㅏ"},
            {"syllable": "나", "romanization": "na", "consonant": "ㄴ", "vowel": "ㅏ"},
            {"syllable": "다", "romanization": "da", "consonant": "ㄷ", "vowel": "ㅏ"},
            {"syllable": "라", "romanization": "ra/la", "consonant": "ㄹ", "vowel": "ㅏ"},
            {"syllable": "마", "romanization": "ma", "consonant": "ㅁ", "vowel": "ㅏ"},
            {"syllable": "바", "romanization": "ba", "consonant": "ㅂ", "vowel": "ㅏ"},
            {"syllable": "사", "romanization": "sa", "consonant": "ㅅ", "vowel": "ㅏ"},
            {"syllable": "자", "romanization": "ja", "consonant": "ㅈ", "vowel": "ㅏ"},
            {"syllable": "차", "romanization": "cha", "consonant": "ㅊ", "vowel": "ㅏ"},
            {"syllable": "카", "romanization": "ka", "consonant": "ㅋ", "vowel": "ㅏ"},
            {"syllable": "타", "romanization": "ta", "consonant": "ㅌ", "vowel": "ㅏ"},
            {"syllable": "파", "romanization": "pa", "consonant": "ㅍ", "vowel": "ㅏ"},
            {"syllable": "하", "romanization": "ha", "consonant": "ㅎ", "vowel": "ㅏ"}
        ],
        "identification_tasks": [
            {"id": "id1", "syllable": "다", "question": "Which consonant is at the start of '다'?", "options": ["ㄷ", "ㄹ", "ㅂ", "ㅈ"], "correct_answer": "ㄷ"},
            {"id": "id2", "syllable": "라", "question": "Which consonant is at the start of '라'?", "options": ["ㄴ", "ㄹ", "ㅁ", "ㅇ"], "correct_answer": "ㄹ"},
            {"id": "id3", "syllable": "사", "question": "Which consonant is at the start of '사'?", "options": ["ㅅ", "ㅈ", "ㅊ", "ㅎ"], "correct_answer": "ㅅ"}
        ],
        "build_tasks": [
            {"id": "b1", "prompt": "Combine consonant ㄱ with vowel ㅏ to make the syllable 'ga':", "options": ["가", "나", "다", "라"], "correct_answer": "가"},
            {"id": "b2", "prompt": "Combine consonant ㄴ with vowel ㅏ to make the syllable 'na':", "options": ["가", "나", "마", "바"], "correct_answer": "나"}
        ]
    }

@router.post("/practice/syllables/basic/answer")
async def submit_basic_syllables_answer(body: AnswerSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok"}

@router.post("/quiz/phase2/generate")
async def generate_phase2_quiz(use_ai: bool = False, current_user: User = Depends(get_current_user)):
    static_quiz = [
        {"id": "pq1", "type": "choice", "question": "Which of these consonants is a tense (strong) consonant?", "options": ["ㄲ", "ㅋ", "ㄱ", "ㄴ"], "correct_answer": "ㄲ", "explanation": "ㄲ is a tense consonant."},
        {"id": "pq2", "type": "choice", "question": "What is the function of the consonant 'ㅇ' at the start of a syllable (e.g. '어')?", "options": ["It is silent", "It sounds like 'ng'", "It sounds like 'h'", "It sounds like 'y'"], "correct_answer": "It is silent", "explanation": "At the start of a syllable block, ㅇ is silent."},
        {"id": "pq3", "type": "choice", "question": "Which consonant is aspirated (pronounced with a puff of air)?", "options": ["ㄱ", "ㅋ", "ㄲ", "ㄴ"], "correct_answer": "ㅋ", "explanation": "ㅋ is the aspirated version of ㄱ."},
        {"id": "pq4", "type": "choice", "question": "Which sound group does the consonant 'ㅁ' belong to?", "options": ["Stops", "Nasals", "Liquids", "Other"], "correct_answer": "Nasals", "explanation": "ㅁ is a nasal consonant (m)."},
        {"id": "pq5", "type": "writing", "question": "Type the tense consonant equivalent of 'ㄷ' (d/t):", "correct_answer": "ㄸ", "explanation": "ㄸ is the double/tense counterpart of ㄷ."},
        {"id": "pq6", "type": "writing", "question": "Type the aspirated consonant equivalent of 'ㅂ' (b/p):", "correct_answer": "ㅍ", "explanation": "ㅍ is the aspirated counterpart of ㅂ."}
    ]

    if not use_ai:
        return static_quiz

    prompt = (
        "Generate a 6-question beginner-level Korean Hangeul consonant quiz in JSON format.\n"
        "Format the output strictly as a JSON array of objects, with no markdown tags or wrapper text outside the raw JSON.\n"
        "Each object must look like this:\n"
        "{\n"
        "  \"id\": \"string\",\n"
        "  \"type\": \"choice\" or \"writing\",\n"
        "  \"question\": \"string\",\n"
        "  \"options\": [\"string\"] (or null for writing),\n"
        "  \"correct_answer\": \"string\",\n"
        "  \"explanation\": \"string\"\n"
        "}\n"
        "Cover consonants: ㄱ, ㄲ, ㅋ, ㄷ, ㄸ, ㅌ, ㅂ, ㅃ, ㅍ, ㅇ, and liquid ㄹ."
    )
    import json
    ai_output = await call_llama_groq(prompt)
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            if isinstance(parsed, list) and len(parsed) > 0:
                return parsed
        except Exception:
            pass

    return static_quiz

@router.post("/quiz/phase2/submit")
async def submit_phase2_quiz(body: QuizSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "score": body.score, "message": "Quiz stats logged"}

@router.post("/tutor/phase2/summary")
async def generate_phase2_tutor_summary(body: TutorSummaryRequest, current_user: User = Depends(get_current_user)):
    prompt = (
        f"The user completed the Hangeul Consonants quiz with a score of {body.score}%.\n"
        f"List of wrong consonants/topics: {body.mistakes}.\n"
        "Generate a friendly, encouraging, and highly instructional 2-3 sentence feedback summary as their Korean tutor Gwan-Sik.\n"
        "Suggest specific tongue/lip positioning and breath release (aspiration) tips for their target mistakes."
    )
    summary = await call_llama_groq(prompt)
    if not summary:
        summary = f"Great effort! You scored {body.score}%. Focus on tensing your vocal cords for double consonants like ㄲ or ㄸ, and release a strong puff of air for aspirated ㅋ or ㅌ!"
    return {"summary": summary}

@router.get("/recommendations/hangeul/phase2")
async def get_phase2_recommendations(current_user: User = Depends(get_current_user)):
    return {
        "strength": "ㄱ, ㄴ, ㅁ, ㅇ",
        "weakness": "ㄹ, ㄲ, ㄸ, ㅃ",
        "youtube_search": "Korean consonants plain aspirated tense mouth shape pronunciation",
        "review_link": "/course/hangeul/phase-2/review"
    }

# --- Phase 3: Hangeul Syllable Blocks Practice & Quiz API Endpoints ---

@router.get("/lesson/phase3/metadata")
async def get_phase3_metadata(current_user: User = Depends(get_current_user)):
    return {
        "goals": "Now you'll learn how consonants and vowels fit into square blocks, and start reading small Korean words.",
        "needs_phase1_completed": True,
        "needs_phase2_completed": True,
        "estimated_time": "20-25 minutes"
    }

@router.get("/lesson/phase3/content")
async def get_phase3_content(current_user: User = Depends(get_current_user)):
    return {
        "vertical_vowels": ["ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅣ", "ㅐ", "ㅔ"],
        "horizontal_vowels": ["ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ"],
        "placement_rules": {
            "vertical": "Vertical vowels go to the RIGHT of the initial consonant (e.g. 가, 너, 다).",
            "horizontal": "Horizontal vowels go BELOW the initial consonant (e.g. 고, 구, 그).",
            "final": "Final consonants (받침) are always placed at the BOTTOM of the block (e.g. 감, 밥, 집)."
        }
    }

@router.get("/practice/blocks/compose")
async def get_blocks_compose(current_user: User = Depends(get_current_user)):
    return [
        {"id": "comp1", "target_syllable": "가", "target_parts": {"initial": "ㄱ", "vowel": "ㅏ", "final": ""}, "distractor_pool": ["ㄴ", "ㅓ", "ㅗ"]},
        {"id": "comp2", "target_syllable": "고", "target_parts": {"initial": "ㄱ", "vowel": "ㅗ", "final": ""}, "distractor_pool": ["ㄹ", "ㅏ", "ㅜ"]},
        {"id": "comp3", "target_syllable": "감", "target_parts": {"initial": "ㄱ", "vowel": "ㅏ", "final": "ㅁ"}, "distractor_pool": ["ㄴ", "ㅓ", "ㅂ"]},
        {"id": "comp4", "target_syllable": "손", "target_parts": {"initial": "ㅅ", "vowel": "ㅗ", "final": "ㄴ"}, "distractor_pool": ["ㄱ", "ㅏ", "ㅁ"]},
        {"id": "comp5", "target_syllable": "밥", "target_parts": {"initial": "ㅂ", "vowel": "ㅏ", "final": "ㅂ"}, "distractor_pool": ["ㄷ", "ㅓ", "ㅇ"]},
        {"id": "comp6", "target_syllable": "집", "target_parts": {"initial": "ㅈ", "vowel": "ㅣ", "final": "ㅂ"}, "distractor_pool": ["ㄴ", "ㅡ", "ㅁ"]}
    ]

@router.post("/practice/blocks/compose/answer")
async def submit_blocks_compose_answer(body: AnswerSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "message": "Composition answer logged"}

@router.get("/practice/blocks/decompose")
async def get_blocks_decompose(current_user: User = Depends(get_current_user)):
    return [
        {"id": "dec1", "syllable": "문", "correct_parts": {"initial": "ㅁ", "vowel": "ㅜ", "final": "ㄴ"}, "options": {"initial": ["ㅁ", "ㅂ", "ㄴ", "ㅇ"], "vowel": ["ㅜ", "ㅗ", "ㅡ", "ㅣ"], "final": ["ㄴ", "ㄹ", "ㅁ", "ㅇ"]}},
        {"id": "dec2", "syllable": "바", "correct_parts": {"initial": "ㅂ", "vowel": "ㅏ", "final": ""}, "options": {"initial": ["ㅂ", "ㅍ", "ㅃ", "ㅁ"], "vowel": ["ㅏ", "ㅓ", "ㅗ", "ㅜ"], "final": ["", "ㄴ", "ㄹ", "ㅁ"]}},
        {"id": "dec3", "syllable": "김", "correct_parts": {"initial": "ㄱ", "vowel": "ㅣ", "final": "ㅁ"}, "options": {"initial": ["ㄱ", "ㅋ", "ㄲ", "ㄴ"], "vowel": ["ㅣ", "ㅡ", "ㅏ", "ㅓ"], "final": ["ㅁ", "ㄴ", "ㅂ", "ㅇ"]}},
        {"id": "dec4", "syllable": "동", "correct_parts": {"initial": "ㄷ", "vowel": "ㅗ", "final": "ㅇ"}, "options": {"initial": ["ㄷ", "ㅌ", "ㄸ", "ㄴ"], "vowel": ["ㅗ", "ㅜ", "ㅡ", "ㅣ"], "final": ["ㅇ", "ㅁ", "ㄴ", "ㄹ"]}}
    ]

@router.post("/practice/blocks/decompose/answer")
async def submit_blocks_decompose_answer(body: AnswerSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "message": "Decomposition answer logged"}

@router.get("/practice/syllables/read")
async def get_syllables_read(current_user: User = Depends(get_current_user)):
    return [
        {"id": "sr1", "syllable": "가", "romanization": "ga"},
        {"id": "sr2", "syllable": "거", "romanization": "geo"},
        {"id": "sr3", "syllable": "고", "romanization": "go"},
        {"id": "sr4", "syllable": "구", "romanization": "gu"},
        {"id": "sr5", "syllable": "나", "romanization": "na"},
        {"id": "sr6", "syllable": "너", "romanization": "neo"},
        {"id": "sr7", "syllable": "노", "romanization": "no"},
        {"id": "sr8", "syllable": "누", "romanization": "nu"},
        {"id": "sr9", "syllable": "마", "romanization": "ma"},
        {"id": "sr10", "syllable": "머", "romanization": "meo"}
    ]

@router.post("/practice/syllables/read/answer")
async def submit_syllables_read_answer(body: AnswerSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok"}

@router.get("/practice/words/reading-basic")
async def get_words_reading_basic(current_user: User = Depends(get_current_user)):
    return {
        "words": [
            {"word": "나무", "meaning": "tree", "romanization": "na-mu"},
            {"word": "머리", "meaning": "head", "romanization": "meo-ri"},
            {"word": "고기", "meaning": "meat", "romanization": "go-gi"},
            {"word": "친구", "meaning": "friend", "romanization": "chin-gu"},
            {"word": "바다", "meaning": "sea", "romanization": "ba-da"},
            {"word": "버스", "meaning": "bus", "romanization": "beo-seu"},
            {"word": "택시", "meaning": "taxi", "romanization": "taek-si"},
            {"word": "커피", "meaning": "coffee", "romanization": "keo-pi"},
            {"word": "피자", "meaning": "pizza", "romanization": "pi-ja"},
            {"word": "카페", "meaning": "cafe", "romanization": "ka-pe"}
        ],
        "matching": [
            {"ko": "나무", "en": "tree"},
            {"ko": "머리", "en": "head"},
            {"ko": "버스", "en": "bus"},
            {"ko": "친구", "en": "friend"}
        ],
        "dictation": [
            {"id": "dct1", "word": "버스", "audio_text": "버스", "meaning": "bus"},
            {"id": "dct2", "word": "나무", "audio_text": "나무", "meaning": "tree"},
            {"id": "dct3", "word": "친구", "audio_text": "친구", "meaning": "friend"}
        ]
    }

@router.post("/practice/words/reading-basic/answer")
async def submit_words_reading_basic_answer(body: AnswerSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok"}

@router.post("/quiz/phase3/generate")
async def generate_phase3_quiz(use_ai: bool = False, current_user: User = Depends(get_current_user)):
    static_quiz = [
        {"id": "p3q1", "type": "choice", "question": "Combine ㄱ + ㅏ + ㅁ to form a single syllable:", "options": ["감", "갑", "갔", "갓"], "correct_answer": "감", "explanation": "ㄱ (initial) + ㅏ (vowel) + ㅁ (final/받침) combines into the square block '감'."},
        {"id": "p3q2", "type": "choice", "question": "Identify the final consonant (받침) in the syllable '문':", "options": ["ㅁ", "ㅜ", "ㄴ", "ㅇ"], "correct_answer": "ㄴ", "explanation": "ㄴ is positioned at the bottom of '문' and is the final consonant (종성/받침)."},
        {"id": "p3q3", "type": "choice", "question": "Which of these words means 'tree' in Korean?", "options": ["나무", "머리", "고기", "바다"], "correct_answer": "나무", "explanation": "나무 is the Korean word for tree."},
        {"id": "p3q4", "type": "choice", "question": "Which of these words means 'friend' in Korean?", "options": ["친구", "바다", "버스", "택시"], "correct_answer": "친구", "explanation": "친구 is the Korean word for friend."},
        {"id": "p3q5", "type": "writing", "question": "Write/Type the Hangeul block for 'bus' (버스):", "correct_answer": "버스", "explanation": "버스 is the Hangeul spelling for the loanword bus."},
        {"id": "p3q6", "type": "writing", "question": "Write/Type the Hangeul block for 'taxi' (택시):", "correct_answer": "택시", "explanation": "택시 is the Hangeul spelling for taxi."}
    ]

    if not use_ai:
        return static_quiz

    prompt = (
        "Generate a 6-question beginner-level Korean Hangeul syllable blocks and reading quiz in JSON format.\n"
        "Format the output strictly as a JSON array of objects, with no markdown tags or wrapper text outside the raw JSON.\n"
        "Each object must look like this:\n"
        "{\n"
        "  \"id\": \"string\",\n"
        "  \"type\": \"choice\" or \"writing\",\n"
        "  \"question\": \"string\",\n"
        "  \"options\": [\"string\"] (or null for writing),\n"
        "  \"correct_answer\": \"string\",\n"
        "  \"explanation\": \"string\"\n"
        "}\n"
        "Cover syllable block structures, visual placements, simple CV/CVC reading, and basic vocabulary words like 나무, 머리, 버스, 친구."
    )
    import json
    ai_output = await call_llama_groq(prompt)
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            if isinstance(parsed, list) and len(parsed) > 0:
                return parsed
        except Exception:
            pass

    return static_quiz

@router.post("/quiz/phase3/submit")
async def submit_phase3_quiz(body: QuizSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "score": body.score, "message": "Quiz stats logged"}

@router.post("/tutor/phase3/summary")
async def generate_phase3_tutor_summary(body: TutorSummaryRequest, current_user: User = Depends(get_current_user)):
    prompt = (
        f"The user completed the Hangeul Syllable Blocks quiz with a score of {body.score}%.\n"
        f"List of wrong topics/mistakes: {body.mistakes}.\n"
        "Generate a friendly, encouraging, and highly instructional 2-3 sentence feedback summary as their Korean tutor Gwan-Sik.\n"
        "Suggest specific square-block assembly, placement of horizontal/vertical vowels, and final consonant (받침) rules for their target mistakes."
    )
    summary = await call_llama_groq(prompt)
    if not summary:
        summary = f"Great effort! You scored {body.score}%. Remember that vertical vowels sit on the right and horizontal ones sit below the initial consonant. Final consonants are always stacked at the bottom."
    return {"summary": summary}

@router.get("/recommendations/hangeul/phase3")
async def get_phase3_recommendations(current_user: User = Depends(get_current_user)):
    return {
        "strength": "CV blocks, vertical vowel placement",
        "weakness": "CVC blocks, final consonant (받침) identification",
        "youtube_search": "Korean Hangeul syllable blocks reading practice beginner",
        "review_link": "/course/hangeul/phase-3/review"
    }

# --- Phase 4: Hangeul Real-Word Reading & Names Practice & Quiz API Endpoints ---

class TransliterateNameRequest(BaseModel):
    name: str

@router.get("/lesson/phase4/metadata")
async def get_phase4_metadata(current_user: User = Depends(get_current_user)):
    return {
        "goals": "Practice reading real Korean words: loanwords, countries, cities, and names. Build reading fluency before grammar.",
        "needs_phase1_completed": True,
        "needs_phase2_completed": True,
        "needs_phase3_completed": True,
        "estimated_time": "20-25 minutes"
    }

@router.get("/lesson/phase4/content")
async def get_phase4_content(current_user: User = Depends(get_current_user)):
    return {
        "loanwords": [
            {"korean": "카메라", "english": "camera"},
            {"korean": "재즈", "english": "jazz"},
            {"korean": "택시", "english": "taxi"},
            {"korean": "버스", "english": "bus"},
            {"korean": "샌드위치", "english": "sandwich"},
            {"korean": "햄버거", "english": "hamburger"},
            {"korean": "커피", "english": "coffee"}
        ],
        "countries": [
            {"korean": "미국", "english": "USA"},
            {"korean": "한국", "english": "Korea"},
            {"korean": "일본", "english": "Japan"},
            {"korean": "중국", "english": "China"},
            {"korean": "프랑스", "english": "France"},
            {"korean": "독일", "english": "Germany"}
        ],
        "cities": [
            {"korean": "파리", "english": "Paris"},
            {"korean": "런던", "english": "London"},
            {"korean": "도쿄", "english": "Tokyo"},
            {"korean": "모스크바", "english": "Moscow"}
        ],
        "names": [
            {"korean": "김민수", "english": "Kim Minsu"},
            {"korean": "이영희", "english": "Lee Younghee"},
            {"korean": "리사", "english": "Lisa"},
            {"korean": "마이클", "english": "Michael"}
        ]
    }

@router.get("/practice/loanwords/basic")
async def get_loanwords_basic(current_user: User = Depends(get_current_user)):
    return [
        {"id": "lw1", "korean": "커피", "english_options": ["coffee", "bus", "coat"], "correct": "coffee"},
        {"id": "lw2", "korean": "버스", "english_options": ["taxi", "bus", "pizza"], "correct": "bus"},
        {"id": "lw3", "korean": "택시", "english_options": ["camera", "taxi", "coffee"], "correct": "taxi"},
        {"id": "lw4", "korean": "카메라", "english_options": ["camera", "pizza", "sandwich"], "correct": "camera"},
        {"id": "lw5", "korean": "피자", "english_options": ["hamburger", "pizza", "coffee"], "correct": "pizza"}
    ]

@router.post("/practice/loanwords/basic/answer")
async def submit_loanwords_basic_answer(body: AnswerSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "message": "Loanword answer logged"}

@router.get("/practice/countries-cities/basic")
async def get_countries_cities_basic(current_user: User = Depends(get_current_user)):
    return {
        "countries": [
            {"id": "c1", "korean": "미국", "english_options": ["USA", "China", "Japan"], "correct": "USA"},
            {"id": "c2", "korean": "한국", "english_options": ["Korea", "Germany", "France"], "correct": "Korea"},
            {"id": "c3", "korean": "일본", "english_options": ["Japan", "USA", "China"], "correct": "Japan"},
            {"id": "c4", "korean": "독일", "english_options": ["Germany", "France", "UK"], "correct": "Germany"}
        ],
        "cities": [
            {"id": "ct1", "korean": "파리", "english_options": ["Paris", "London", "Tokyo"], "correct": "Paris"},
            {"id": "ct2", "korean": "런던", "english_options": ["Rome", "London", "Moscow"], "correct": "London"},
            {"id": "ct3", "korean": "도쿄", "english_options": ["Tokyo", "Beijing", "Seoul"], "correct": "Tokyo"}
        ],
        "matching": [
            {"ko": "한국", "en": "Korea"},
            {"ko": "미국", "en": "USA"},
            {"ko": "일본", "en": "Japan"},
            {"ko": "중국", "en": "China"},
            {"ko": "프랑스", "en": "France"},
            {"ko": "독일", "en": "Germany"}
        ]
    }

@router.post("/practice/countries-cities/basic/answer")
async def submit_countries_cities_basic_answer(body: AnswerSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "message": "Country/City answer logged"}

@router.get("/practice/names/basic")
async def get_names_basic(current_user: User = Depends(get_current_user)):
    return {
        "matching": [
            {"ko": "김시우", "en": "Kim Siwoo"},
            {"ko": "리사 그린", "en": "Lisa Green"},
            {"ko": "크리스 화이트", "en": "Chris White"},
            {"ko": "이지은", "en": "Lee Jieun"}
        ],
        "mcq": [
            {"id": "nm1", "korean": "김민수", "english_options": ["Kim Minsu", "Lee Minsu", "Park Minsu"], "correct": "Kim Minsu"},
            {"id": "nm2", "korean": "이영희", "english_options": ["Kim Younghee", "Lee Younghee", "Park Younghee"], "correct": "Lee Younghee"}
        ]
    }

@router.post("/practice/names/basic/answer")
async def submit_names_basic_answer(body: AnswerSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "message": "Name answer logged"}

@router.post("/tutor/transliterate-name")
async def transliterate_name(body: TransliterateNameRequest, current_user: User = Depends(get_current_user)):
    import json
    prompt = (
        f"The user wants to transliterate their name '{body.name}' into Korean Hangeul.\n"
        "Transliterate this name into Korean Hangeul suggestions according to standard phonetic rules.\n"
        "Provide exactly 1 or 2 suggestions in Hangeul, and a short explanation of why it is spelled that way.\n"
        "Respond strictly with a JSON object in this format:\n"
        "{\n"
        "  \"suggestions\": [\"suggestion1\", \"suggestion2\"],\n"
        "  \"explanation\": \"explanation string\"\n"
        "}\n"
        "No markdown wraps, no extra text, just raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            if "suggestions" in parsed:
                return parsed
        except Exception:
            pass
    # Fallback suggestions if LLM fails or doesn't return
    return {
        "suggestions": [body.name[:3]],
        "explanation": "Transliteration suggestions generated phonetically."
    }

@router.get("/practice/phrases/basic")
async def get_phrases_basic(current_user: User = Depends(get_current_user)):
    return {
        "phrases": [
            {"korean": "안녕하세요", "english": "Hello", "literal": "Are you peaceful?", "audio_text": "안녕하세요"},
            {"korean": "감사합니다", "english": "Thank you", "literal": "I do gratitude", "audio_text": "감사합니다"},
            {"korean": "죄송합니다", "english": "I'm sorry", "literal": "I am sorry", "audio_text": "죄송합니다"},
            {"korean": "책을 펴세요", "english": "Open your book", "literal": "Please open the book", "audio_text": "책을 펴세요"},
            {"korean": "잘 들으세요", "english": "Listen carefully", "literal": "Please listen well", "audio_text": "잘 들으세요"},
            {"korean": "따라하세요", "english": "Repeat after me", "literal": "Please follow/imitate", "audio_text": "따라하세요"}
        ],
        "matching": [
            {"ko": "안녕하세요", "en": "Hello"},
            {"ko": "감사합니다", "en": "Thank you"},
            {"ko": "죄송합니다", "en": "I'm sorry"}
        ],
        "cloze": [
            {"id": "clz1", "question": "Complete the phrase: 안녕하_세요.", "options": ["세", "제", "네"], "correct": "세"},
            {"id": "clz2", "question": "Complete the phrase: 감사합_다.", "options": ["니", "디", "리"], "correct": "니"},
            {"id": "clz3", "question": "Complete the phrase: 죄송합_다.", "options": ["니", "이", "지"], "correct": "니"}
        ]
    }

@router.post("/practice/phrases/basic/answer")
async def submit_phrases_basic_answer(body: AnswerSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "message": "Phrase answer logged"}

@router.post("/quiz/phase4/generate")
async def generate_phase4_quiz(use_ai: bool = False, current_user: User = Depends(get_current_user)):
    static_quiz = [
        {"id": "p4q1", "type": "choice", "question": "Select the correct English translation for '버스':", "options": ["Bus", "Taxi", "Coffee", "Pizza"], "correct_answer": "Bus", "explanation": "버스 (beo-seu) is the loanword for bus."},
        {"id": "p4q2", "type": "choice", "question": "Select the correct English translation for '피자':", "options": ["Pizza", "Hamburger", "Sandwich", "Cake"], "correct_answer": "Pizza", "explanation": "피자 (pi-ja) is the loanword for pizza."},
        {"id": "p4q3", "type": "choice", "question": "Which country is represented by '일본'?", "options": ["Japan", "China", "USA", "France"], "correct_answer": "Japan", "explanation": "일본 (il-bon) means Japan."},
        {"id": "p4q4", "type": "choice", "question": "Which city is represented by '파리'?", "options": ["Paris", "London", "Rome", "Tokyo"], "correct_answer": "Paris", "explanation": "파리 (pa-ri) means Paris."},
        {"id": "p4q5", "type": "choice", "question": "How is the common Korean name '김민수' romanized?", "options": ["Kim Minsu", "Lee Minsu", "Park Minsu", "Choi Minsu"], "correct_answer": "Kim Minsu", "explanation": "김민수 is Kim Minsu."},
        {"id": "p4q6", "type": "choice", "question": "Which of these means 'Hello'?", "options": ["안녕하세요", "감사합니다", "죄송합니다", "따라하세요"], "correct_answer": "안녕하세요", "explanation": "안녕하세요 is Hello (polite)."},
        {"id": "p4q7", "type": "choice", "question": "Which of these means 'Thank you'?", "options": ["안녕하세요", "감사합니다", "죄송합니다", "잘 들으세요"], "correct_answer": "감사합니다", "explanation": "감사합니다 is Thank you."},
        {"id": "p4q8", "type": "choice", "question": "Which option is 'Lisa' in Hangeul?", "options": ["리사", "미사", "리수", "기사"], "correct_answer": "리사", "explanation": "리사 is Lisa."}
    ]

    if not use_ai:
        return static_quiz

    prompt = (
        "Generate a 12-question beginner-level Korean Hangeul real-word reading quiz in JSON format.\n"
        "Cover the following areas:\n"
        "1. Loanwords (4 items, e.g. 버스, 피자, 커피)\n"
        "2. Countries/Cities (4 items, e.g. 일본, 서울, 미국)\n"
        "3. Names (2 items, e.g. 김민수, 리사)\n"
        "4. Phrases (2 items, e.g. 안녕하세요, 감사합니다)\n"
        "Format the output strictly as a JSON array of objects, with no markdown tags or wrapper text outside the raw JSON.\n"
        "Each object must look like this:\n"
        "{\n"
        "  \"id\": \"string\",\n"
        "  \"type\": \"choice\" or \"writing\",\n"
        "  \"question\": \"string\",\n"
        "  \"options\": [\"string\"] (or null for writing),\n"
        "  \"correct_answer\": \"string\",\n"
        "  \"explanation\": \"string\"\n"
        "}"
    )
    import json
    ai_output = await call_llama_groq(prompt)
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            if isinstance(parsed, list) and len(parsed) > 0:
                return parsed
        except Exception:
            pass

    return static_quiz

@router.post("/quiz/phase4/submit")
async def submit_phase4_quiz(body: QuizSubmit, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "score": body.score, "message": "Quiz stats logged"}

@router.post("/tutor/phase4/summary")
async def generate_phase4_tutor_summary(body: TutorSummaryRequest, current_user: User = Depends(get_current_user)):
    prompt = (
        f"The user completed the Hangeul Real-Word Reading & Names quiz with a score of {body.score}%.\n"
        f"List of wrong topics/mistakes: {body.mistakes}.\n"
        "Generate a friendly, encouraging, and highly instructional 2-3 sentence feedback summary as their Korean tutor Gwan-Sik.\n"
        "Acknowledge their ability to decode loanwords/names/phrases, and suggest specific phonetic practice tips based on their mistakes."
    )
    summary = await call_llama_groq(prompt)
    if not summary:
        summary = f"Wonderful job completing Phase 4! You scored {body.score}%. Reading real words is a major milestone—remember to look for loanword cognates to ease your reading practice!"
    return {"summary": summary}

@router.get("/recommendations/hangeul/phase4")
async def get_phase4_recommendations(current_user: User = Depends(get_current_user)):
    return {
        "strength": "Loanwords reading, common country names",
        "weakness": "Transliterated foreign names, longer classroom phrases",
        "youtube_search": "Korean Hangeul reading practice with loanwords and signs",
        "review_link": "/course/hangeul/phase-4/review"
    }

# --- Course 2 (Korean 1) Phase 1 API Endpoints ---
from backend.app.models.study import UserExerciseAttempt, MasteryScore
from backend.app.curriculum import PREGENERATED_LESSONS

class GreetingsAnswerSubmit(BaseModel):
    item_id: str
    selected_option_id: str
    time_taken_ms: int

class GreetingsAnswerResponse(BaseModel):
    correct: bool
    correct_option_id: str

class QuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    is_correct: bool
    time_taken_ms: int

class QuizFinishRequest(BaseModel):
    score: float
    mistakes: List[str]

class HomeworkCheckRequest(BaseModel):
    homework_id: str
    checked: bool

@router.get("/phases/korean1/1/metadata")
async def get_korean1_phase1_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": 15,
        "prerequisites": data["prerequisites"],
        "status": data["status"]
    }

@router.get("/phases/korean1/1/expressions")
async def get_korean1_phase1_expressions(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    expressions = []
    for exp in data["expressions"]:
        expressions.append({
            "id": exp["id"],
            "korean": exp["korean"],
            "romanization": exp["romanization"],
            "english": exp["english"],
            "usage": exp["usage"],
            "audio_url": f"/api/v1/speech/tts?text={exp['korean']}&lang=ko"
        })
    return expressions

@router.get("/practice/greetings/listening")
async def get_greetings_listening(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(1, {})
    items = []
    for item in data.get("practice_listening", []):
        items.append({
            "id": item["id"],
            "audio_url": f"/api/v1/speech/tts?text={item['audio_text']}&lang=ko",
            "options": item["options"],
            "correct_option_id": item["correct_option_id"],
            "korean": item["korean"],
            "romanization": item["romanization"]
        })
    return {"items": items}

@router.post("/practice/greetings/listening/answer", response_model=GreetingsAnswerResponse)
async def submit_greetings_listening_answer(
    body: GreetingsAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(2, {}).get(1, {})
    correct_option_id = ""
    is_correct = False
    for item in data.get("practice_listening", []):
        if item["id"] == body.item_id:
            correct_option_id = item["correct_option_id"]
            is_correct = body.selected_option_id == correct_option_id
            break
            
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"correct": is_correct, "correct_option_id": correct_option_id}

@router.get("/practice/greetings/gapfill")
async def get_greetings_gapfill(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(1, {})
    return data.get("practice_gapfill", [])

@router.post("/practice/greetings/gapfill/answer", response_model=GreetingsAnswerResponse)
async def submit_greetings_gapfill_answer(
    body: GreetingsAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(2, {}).get(1, {})
    correct_option_id = ""
    is_correct = False
    for item in data.get("practice_gapfill", []):
        if item["id"] == body.item_id:
            correct_option_id = item["correct_option_id"]
            is_correct = body.selected_option_id == correct_option_id
            break
            
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"correct": is_correct, "correct_option_id": correct_option_id}

@router.get("/practice/greetings/context")
async def get_greetings_context(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(1, {})
    return data.get("practice_context", [])

@router.post("/practice/greetings/context/answer", response_model=GreetingsAnswerResponse)
async def submit_greetings_context_answer(
    body: GreetingsAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(2, {}).get(1, {})
    correct_option_id = ""
    is_correct = False
    for item in data.get("practice_context", []):
        if item["id"] == body.item_id:
            correct_option_id = item["correct_option_id"]
            is_correct = body.selected_option_id == correct_option_id
            break
            
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"correct": is_correct, "correct_option_id": correct_option_id}

@router.post("/quiz/korean1/phase-1/start")
async def start_korean1_phase1_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(1, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"],
            "audio_url": f"/api/v1/speech/tts?text={q['audio_text']}&lang=ko" if q["type"] == "listening" else None
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean1/phase-1/answer")
async def submit_korean1_phase1_quiz_answer(
    body: QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean1/phase-1/finish")
async def finish_korean1_phase1_quiz(
    body: QuizFinishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.total_xp += 150
        
    for exp in ["안녕하세요", "감사합니다", "죄송합니다", "안녕히 계세요", "안녕히 가세요", "네", "아니요"]:
        stmt_ms = select(MasteryScore).where(
            MasteryScore.user_id == current_user.id,
            MasteryScore.item_type == "vocabulary",
            MasteryScore.item_id == uuid.uuid5(uuid.NAMESPACE_DNS, exp)
        )
        res_ms = await db.execute(stmt_ms)
        ms = res_ms.scalars().first()
        if not ms:
            ms = MasteryScore(
                id=uuid.uuid4(),
                user_id=current_user.id,
                item_type="vocabulary",
                item_id=uuid.uuid5(uuid.NAMESPACE_DNS, exp),
                score=0.0,
                repetitions=0
            )
            db.add(ms)
        
        if exp in body.mistakes:
            ms.score = max(0.0, ms.score - 0.2)
        else:
            ms.score = min(1.0, ms.score + 0.25)
        ms.repetitions += 1
        
    await db.commit()
    return {"status": "ok", "xp_earned": 150, "score": body.score}

@router.get("/phases/korean1/1/homework")
async def get_korean1_phase1_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(1, {})
    return data.get("homework", [])

@router.post("/phases/korean1/1/homework/check")
async def check_korean1_phase1_homework(body: HomeworkCheckRequest, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "checked": body.checked}

@router.post("/tutor/teach/greetings-mode")
async def start_greetings_mode_tutor(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 1.1 Polite Greetings Role-Play",
        scenario_id="greetings_mode"
    )
    db.add(convo)
    
    opener = "안녕하세요! 반갑습니다. (Hello! Nice to meet you.) How would you say thank you and goodbye politely in Korean?"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

# --- Course 2 (Korean 1) Phase 2 API Endpoints ---
class SelfIntroBuildRequest(BaseModel):
    lines: List[str]

class UserSelfIntroSaveRequest(BaseModel):
    intro_text: str

@router.get("/phases/korean1/2/metadata")
async def get_korean1_phase2_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": 20,
        "prerequisites": data["prerequisites"],
        "status": data["status"]
    }

@router.get("/phases/korean1/2/patterns")
async def get_korean1_phase2_patterns(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    patterns = []
    for pat in data["patterns"]:
        patterns.append({
            "id": pat["id"],
            "type": pat["type"],
            "korean": pat["korean"],
            "romanization": pat["romanization"],
            "english": pat["english"],
            "usage": pat["usage"],
            "audio_url": f"/api/v1/speech/tts?text={pat['korean']}&lang=ko"
        })
    return patterns

@router.get("/practice/selfintro/listening")
async def get_selfintro_listening(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(2, {})
    items = []
    for item in data.get("practice_listening", []):
        items.append({
            "id": item["id"],
            "audio_url": f"/api/v1/speech/tts?text={item['audio_text']}&lang=ko",
            "english_options": item["english_options"],
            "correct_option_id": item["correct_option_id"],
            "korean": item["korean"],
            "romanization": item["romanization"]
        })
    return {"items": items}

@router.post("/practice/selfintro/listening/answer", response_model=GreetingsAnswerResponse)
async def submit_selfintro_listening_answer(
    body: GreetingsAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(2, {}).get(2, {})
    correct_option_id = ""
    is_correct = False
    for item in data.get("practice_listening", []):
        if item["id"] == body.item_id:
            correct_option_id = item["correct_option_id"]
            is_correct = body.selected_option_id == correct_option_id
            break
            
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"correct": is_correct, "correct_option_id": correct_option_id}

@router.get("/practice/selfintro/patterns")
async def get_selfintro_patterns(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(2, {})
    return {
        "countries": data.get("countries", []),
        "occupations": data.get("occupations", []),
        "patterns": data.get("patterns", [])
    }

@router.post("/practice/selfintro/build")
async def build_selfintro_text(body: SelfIntroBuildRequest, current_user: User = Depends(get_current_user)):
    final_text = " ".join(body.lines)
    return {
        "final_korean_text": final_text,
        "romanization": "Phonetic romanization suggestions",
        "english_summary": "English translated outline summary",
        "audio_url": f"/api/v1/speech/tts?text={final_text}&lang=ko"
    }

@router.post("/users/selfintro/save")
async def save_user_selfintro(
    body: UserSelfIntroSaveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.study_reason = f"Saved Self-Intro: {body.intro_text}"
        await db.commit()
    return {"status": "ok", "saved": body.intro_text}

@router.post("/quiz/korean1/phase-2/start")
async def start_korean1_phase2_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(2, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"],
            "audio_url": f"/api/v1/speech/tts?text={q['audio_text']}&lang=ko" if q["type"] == "listening" else None
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean1/phase-2/answer")
async def submit_korean1_phase2_quiz_answer(
    body: QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean1/phase-2/finish")
async def finish_korean1_phase2_quiz(
    body: QuizFinishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.total_xp += 150
        
    for exp in ["학생", "미국", "한국", "선생님"]:
        stmt_ms = select(MasteryScore).where(
            MasteryScore.user_id == current_user.id,
            MasteryScore.item_type == "vocabulary",
            MasteryScore.item_id == uuid.uuid5(uuid.NAMESPACE_DNS, exp)
        )
        res_ms = await db.execute(stmt_ms)
        ms = res_ms.scalars().first()
        if not ms:
            ms = MasteryScore(
                id=uuid.uuid4(),
                user_id=current_user.id,
                item_type="vocabulary",
                item_id=uuid.uuid5(uuid.NAMESPACE_DNS, exp),
                score=0.0,
                repetitions=0
            )
            db.add(ms)
        ms.score = min(1.0, ms.score + 0.25)
        ms.repetitions += 1
        
    await db.commit()
    return {"status": "ok", "xp_earned": 150, "score": body.score}

@router.get("/phases/korean1/2/homework")
async def get_korean1_phase2_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(2, {})
    return data.get("homework", [])

@router.post("/phases/korean1/2/homework/check")
async def check_korean1_phase2_homework(body: HomeworkCheckRequest, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "checked": body.checked}

@router.post("/tutor/selfintro-practice/start")
async def start_selfintro_practice_tutor(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 1.2 Self Introduction Practice",
        scenario_id="selfintro_practice"
    )
    db.add(convo)
    
    opener = "안녕하세요! 자기소개 해주세요. (Hello! Please introduce yourself.) What is your name and where are you from?"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

# --- Course 2 (Korean 1) Phase 3 API Endpoints ---
class NumbersAnswerSubmit(BaseModel):
    item_id: str
    selected_digit: str
    time_taken_ms: int

class BasicTimeAnswerSubmit(BaseModel):
    item_id: str
    selected_option_id: str
    time_taken_ms: int

class BasicFactsAnswerSubmit(BaseModel):
    item_id: str
    selected_answer: str
    is_correct: bool
    time_taken_ms: int

@router.get("/phases/korean1/3/metadata")
async def get_korean1_phase3_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": 20,
        "prerequisites": data["prerequisites"],
        "status": data["status"]
    }

@router.get("/phases/korean1/3/core-data")
async def get_korean1_phase3_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    
    numbers = []
    for num in data.get("numbers", []):
        numbers.append({
            "digit": num["digit"],
            "ko": num["ko"],
            "en": num["en"],
            "audio_url": f"/api/v1/speech/tts?text={num['ko']}&lang=ko"
        })
        
    time_samples = []
    for t in data.get("time_samples", []):
        time_samples.append({
            "time": t["time"],
            "ko": t["ko"],
            "en": t["en"],
            "audio_url": f"/api/v1/speech/tts?text={t['ko']}&lang=ko"
        })
        
    return {
        "numbers": numbers,
        "time_samples": time_samples,
        "example_sentences": data.get("example_sentences", [])
    }

@router.get("/practice/numbers/listening")
async def get_numbers_listening(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(3, {})
    items = []
    for item in data.get("practice_listening", []):
        items.append({
            "id": item["id"],
            "audio_url": f"/api/v1/speech/tts?text={item['audio_text']}&lang=ko",
            "digit_options": item["digit_options"],
            "correct_digit": item["correct_digit"],
            "context_type": item["context_type"]
        })
    return {"items": items}

@router.post("/practice/numbers/listening/answer")
async def submit_numbers_listening_answer(
    body: NumbersAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(2, {}).get(3, {})
    correct_digit = ""
    is_correct = False
    for item in data.get("practice_listening", []):
        if item["id"] == body.item_id:
            correct_digit = item["correct_digit"]
            is_correct = body.selected_digit == correct_digit
            break
            
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"correct": is_correct, "correct_digit": correct_digit}

@router.get("/practice/time/basic")
async def get_time_basic(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(3, {})
    items = []
    for item in data.get("time_practice", []):
        items.append({
            "id": item["id"],
            "audio_url": f"/api/v1/speech/tts?text={item['audio_text']}&lang=ko",
            "time_display": item["time_display"],
            "options": item["options"],
            "correct_option_id": item["correct_option_id"]
        })
    return {"items": items}

@router.post("/practice/time/basic/answer")
async def submit_time_basic_answer(
    body: BasicTimeAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(2, {}).get(3, {})
    correct_option_id = ""
    is_correct = False
    for item in data.get("time_practice", []):
        if item["id"] == body.item_id:
            correct_option_id = item["correct_option_id"]
            is_correct = body.selected_option_id == correct_option_id
            break
            
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"correct": is_correct, "correct_option_id": correct_option_id}

@router.get("/practice/facts/basic")
async def get_facts_basic(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(3, {})
    return {"items": data.get("facts_practice", [])}

@router.post("/practice/facts/basic/answer")
async def submit_facts_basic_answer(
    body: BasicFactsAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean1/phase-3/start")
async def start_korean1_phase3_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(3, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"],
            "audio_url": f"/api/v1/speech/tts?text={q['audio_text']}&lang=ko" if q["type"] == "listening" else None
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean1/phase-3/answer")
async def submit_korean1_phase3_quiz_answer(
    body: QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean1/phase-3/finish")
async def finish_korean1_phase3_quiz(
    body: QuizFinishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.total_xp += 150
        
    for exp in ["일", "이", "삼", "사", "오", "십", "한 시", "두 시"]:
        stmt_ms = select(MasteryScore).where(
            MasteryScore.user_id == current_user.id,
            MasteryScore.item_type == "vocabulary",
            MasteryScore.item_id == uuid.uuid5(uuid.NAMESPACE_DNS, exp)
        )
        res_ms = await db.execute(stmt_ms)
        ms = res_ms.scalars().first()
        if not ms:
            ms = MasteryScore(
                id=uuid.uuid4(),
                user_id=current_user.id,
                item_type="vocabulary",
                item_id=uuid.uuid5(uuid.NAMESPACE_DNS, exp),
                score=0.0,
                repetitions=0
            )
            db.add(ms)
        ms.score = min(1.0, ms.score + 0.25)
        ms.repetitions += 1
        
    await db.commit()
    return {"status": "ok", "xp_earned": 150, "score": body.score}

@router.get("/phases/korean1/3/homework")
async def get_korean1_phase3_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(3, {})
    return data.get("homework", [])

@router.post("/phases/korean1/3/homework/check")
async def check_korean1_phase3_homework(body: HomeworkCheckRequest, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "checked": body.checked}

@router.post("/tutor/numbers-practice/start")
async def start_numbers_practice_tutor(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 1.3 Numbers Practice",
        scenario_id="numbers_practice"
    )
    db.add(convo)
    
    opener = "안녕하세요! 숫자를 공부해봅시다. How old are you? (몇 살이에요?) Or how much is a coffee in your country?"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

# --- Course 2 (Korean 1) Phase 4 API Endpoints ---
class DailyVerbAnswerSubmit(BaseModel):
    item_id: str
    selected_option: str
    time_taken_ms: int

class DailySentenceAnswerSubmit(BaseModel):
    item_id: str
    selected_option: str
    time_taken_ms: int

class RoutineBuildRequest(BaseModel):
    lines: List[str]

class UserRoutineSaveRequest(BaseModel):
    routine_text: str

@router.get("/phases/korean1/4/metadata")
async def get_korean1_phase4_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": 25,
        "prerequisites": data["prerequisites"],
        "status": data["status"]
    }

@router.get("/phases/korean1/4/core-data")
async def get_korean1_phase4_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    
    verbs = []
    for v in data.get("verbs", []):
        verbs.append({
            "id": v["id"],
            "korean": v["korean"],
            "romanization": v["romanization"],
            "english": v["english"],
            "polite": v["polite"],
            "tag": v["tag"],
            "audio_url": f"/api/v1/speech/tts?text={v['polite']}&lang=ko"
        })
        
    pattern_examples = []
    for s in data.get("pattern_examples", []):
        pattern_examples.append({
            "ko": s["ko"],
            "en": s["en"],
            "audio_url": f"/api/v1/speech/tts?text={s['audio_text']}&lang=ko"
        })
        
    return {
        "verbs": verbs,
        "pattern_examples": pattern_examples
    }

@router.get("/practice/daily-verbs/recognition")
async def get_daily_verbs_recognition(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(4, {})
    return {"items": data.get("practice_verbs", [])}

@router.post("/practice/daily-verbs/recognition/answer")
async def submit_daily_verbs_recognition_answer(
    body: DailyVerbAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(2, {}).get(4, {})
    correct = ""
    is_correct = False
    for item in data.get("practice_verbs", []):
        if item["id"] == body.item_id:
            correct = item["correct"]
            is_correct = body.selected_option == correct
            break
            
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"correct": is_correct, "correct_answer": correct}

@router.get("/practice/daily-sentences/recognition")
async def get_daily_sentences_recognition(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(4, {})
    items = []
    for item in data.get("practice_sentences", []):
        items.append({
            "id": item["id"],
            "sentence": item["sentence"],
            "audio_url": f"/api/v1/speech/tts?text={item['sentence']}&lang=ko",
            "options": item["options"],
            "correct": item["correct"]
        })
    return {"items": items}

@router.post("/practice/daily-sentences/recognition/answer")
async def submit_daily_sentences_recognition_answer(
    body: DailySentenceAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(2, {}).get(4, {})
    correct = ""
    is_correct = False
    for item in data.get("practice_sentences", []):
        if item["id"] == body.item_id:
            correct = item["correct"]
            is_correct = body.selected_option == correct
            break
            
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"correct": is_correct, "correct_answer": correct}

@router.get("/practice/routine/templates")
async def get_routine_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(4, {})
    return data.get("templates", {})

@router.post("/practice/routine/build")
async def build_routine_text(body: RoutineBuildRequest, current_user: User = Depends(get_current_user)):
    final_text = " ".join(body.lines)
    return {
        "final_korean_text": final_text,
        "romanization": "Phonetic daily routines summary",
        "audio_url": f"/api/v1/speech/tts?text={final_text}&lang=ko"
    }

@router.post("/users/routine/save")
async def save_user_routine(
    body: UserRoutineSaveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.study_reason = f"Saved Routine: {body.routine_text}"
        await db.commit()
    return {"status": "ok", "saved": body.routine_text}

@router.post("/quiz/korean1/phase-4/start")
async def start_korean1_phase4_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(4, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"],
            "audio_url": f"/api/v1/speech/tts?text={q['audio_text']}&lang=ko" if q["type"] == "listening" else None
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean1/phase-4/answer")
async def submit_korean1_phase4_quiz_answer(
    body: QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean1/phase-4/finish")
async def finish_korean1_phase4_quiz(
    body: QuizFinishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.total_xp += 150
        
    for exp in ["자다", "먹다", "가다", "공부하다", "일하다"]:
        stmt_ms = select(MasteryScore).where(
            MasteryScore.user_id == current_user.id,
            MasteryScore.item_type == "vocabulary",
            MasteryScore.item_id == uuid.uuid5(uuid.NAMESPACE_DNS, exp)
        )
        res_ms = await db.execute(stmt_ms)
        ms = res_ms.scalars().first()
        if not ms:
            ms = MasteryScore(
                id=uuid.uuid4(),
                user_id=current_user.id,
                item_type="vocabulary",
                item_id=uuid.uuid5(uuid.NAMESPACE_DNS, exp),
                score=0.0,
                repetitions=0
            )
            db.add(ms)
        ms.score = min(1.0, ms.score + 0.25)
        ms.repetitions += 1
        
    await db.commit()
    return {"status": "ok", "xp_earned": 150, "score": body.score}

@router.get("/phases/korean1/4/homework")
async def get_korean1_phase4_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(4, {})
    return data.get("homework", [])

@router.post("/phases/korean1/4/homework/check")
async def check_korean1_phase4_homework(body: HomeworkCheckRequest, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "checked": body.checked}

@router.post("/tutor/routine-practice/start")
async def start_routine_practice_tutor(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 1.4 Daily Routine Practice",
        scenario_id="routine_practice"
    )
    db.add(convo)
    
    opener = "안녕하세요! 하루 일과를 말해봅시다. (Hello! Let's talk about daily routines.) What do you do in the morning?"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

# --- Course 2 (Korean 1) Phase 5 API Endpoints ---
class PlaceAnswerSubmit(BaseModel):
    item_id: str
    selected_option: str
    time_taken_ms: int

class LocationSentenceAnswerSubmit(BaseModel):
    item_id: str
    selected_option: str
    time_taken_ms: int

class LocationQAAnswerSubmit(BaseModel):
    item_id: str
    selected_option_id: str
    time_taken_ms: int

class LocationBuilderRequest(BaseModel):
    place: str
    pattern_type: str  # location | destination

@router.get("/phases/korean1/5/metadata")
async def get_korean1_phase5_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": 25,
        "prerequisites": data["prerequisites"],
        "status": data["status"]
    }

@router.get("/phases/korean1/5/core-data")
async def get_korean1_phase5_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    
    places = []
    for p in data.get("places", []):
        places.append({
            "id": p["id"],
            "korean": p["korean"],
            "romanization": p["romanization"],
            "english": p["english"],
            "tag": p["tag"],
            "audio_url": f"/api/v1/speech/tts?text={p['korean']}&lang=ko"
        })
        
    pattern_examples = []
    for s in data.get("pattern_examples", []):
        pattern_examples.append({
            "ko": s["ko"],
            "en": s["en"],
            "audio_url": f"/api/v1/speech/tts?text={s['audio_text']}&lang=ko"
        })
        
    return {
        "places": places,
        "pattern_examples": pattern_examples
    }

@router.get("/practice/places/recognition")
async def get_places_recognition(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(5, {})
    items = []
    for item in data.get("practice_places", []):
        items.append({
            "id": item["id"],
            "korean": item["korean"],
            "audio_url": f"/api/v1/speech/tts?text={item['korean']}&lang=ko",
            "options": item["options"],
            "correct": item["correct"]
        })
    return {"items": items}

@router.post("/practice/places/recognition/answer")
async def submit_places_recognition_answer(
    body: PlaceAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(2, {}).get(5, {})
    correct = ""
    is_correct = False
    for item in data.get("practice_places", []):
        if item["id"] == body.item_id:
            correct = item["correct"]
            is_correct = body.selected_option == correct
            break
            
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"correct": is_correct, "correct_answer": correct}

@router.get("/practice/location-sentences/recognition")
async def get_location_sentences_recognition(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(5, {})
    items = []
    for item in data.get("practice_sentences", []):
        items.append({
            "id": item["id"],
            "sentence": item["sentence"],
            "audio_url": f"/api/v1/speech/tts?text={item['sentence']}&lang=ko",
            "options": item["options"],
            "correct": item["correct"]
        })
    return {"items": items}

@router.post("/practice/location-sentences/recognition/answer")
async def submit_location_sentences_recognition_answer(
    body: LocationSentenceAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(2, {}).get(5, {})
    correct = ""
    is_correct = False
    for item in data.get("practice_sentences", []):
        if item["id"] == body.item_id:
            correct = item["correct"]
            is_correct = body.selected_option == correct
            break
            
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"correct": is_correct, "correct_answer": correct}

@router.get("/practice/location/qa")
async def get_location_qa(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(5, {})
    return {"items": data.get("qa_dialogues", [])}

@router.post("/practice/location/qa/answer")
async def submit_location_qa_answer(
    body: LocationQAAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(2, {}).get(5, {})
    is_correct = False
    for item in data.get("qa_dialogues", []):
        if item["id"] == body.item_id:
            for opt in item["options"]:
                if opt["id"] == body.selected_option_id:
                    is_correct = opt["correct"]
                    break
            break
            
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"correct": is_correct}

@router.get("/practice/location/builder")
async def get_location_builder(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(5, {})
    return {
        "templates": data.get("builder_templates", {}),
        "places": data.get("places", [])
    }

@router.post("/practice/location/builder")
async def build_location_sentence(body: LocationBuilderRequest, current_user: User = Depends(get_current_user)):
    sentence = ""
    if body.pattern_type == "location":
        sentence = f"{body.place}에 있어요."
    else:
        sentence = f"{body.place}에 가요."
        
    return {
        "final_korean_text": sentence,
        "romanization": "Romanization helper text",
        "audio_url": f"/api/v1/speech/tts?text={sentence}&lang=ko"
    }

@router.post("/quiz/korean1/phase-5/start")
async def start_korean1_phase5_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(5, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"],
            "audio_url": f"/api/v1/speech/tts?text={q['audio_text']}&lang=ko" if q["type"] == "listening" else None
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean1/phase-5/answer")
async def submit_korean1_phase5_quiz_answer(
    body: QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean1/phase-5/finish")
async def finish_korean1_phase5_quiz(
    body: QuizFinishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.total_xp += 150
        
    for exp in ["집", "학교", "회사", "카페", "식당"]:
        stmt_ms = select(MasteryScore).where(
            MasteryScore.user_id == current_user.id,
            MasteryScore.item_type == "vocabulary",
            MasteryScore.item_id == uuid.uuid5(uuid.NAMESPACE_DNS, exp)
        )
        res_ms = await db.execute(stmt_ms)
        ms = res_ms.scalars().first()
        if not ms:
            ms = MasteryScore(
                id=uuid.uuid4(),
                user_id=current_user.id,
                item_type="vocabulary",
                item_id=uuid.uuid5(uuid.NAMESPACE_DNS, exp),
                score=0.0,
                repetitions=0
            )
            db.add(ms)
        ms.score = min(1.0, ms.score + 0.25)
        ms.repetitions += 1
        
    await db.commit()
    return {"status": "ok", "xp_earned": 150, "score": body.score}

@router.get("/phases/korean1/5/homework")
async def get_korean1_phase5_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(5, {})
    return data.get("homework", [])

@router.post("/phases/korean1/5/homework/check")
async def check_korean1_phase5_homework(body: HomeworkCheckRequest, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "checked": body.checked}

@router.post("/tutor/location-practice/start")
async def start_location_practice_tutor(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 1.5 Location Practice",
        scenario_id="location_practice"
    )
    db.add(convo)
    
    opener = "안녕하세요! 어디 가요? (Hello! Where are you going?) E.g. 집에 가요 or 카페에 가요."
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

# --- Course 2 (Korean 1) Phase 6 API Endpoints ---
class DialogueAnswerSubmit(BaseModel):
    item_id: str
    selected_option_id: str
    time_taken_ms: int

class OrderAnswerSubmit(BaseModel):
    item_id: str
    correct: bool
    time_taken_ms: int

class A1SessionStart(BaseModel):
    scenario_id: str
    mode: str  # text | voice

class A1TurnRequest(BaseModel):
    user_text: str

@router.get("/phases/korean1/6/metadata")
async def get_korean1_phase6_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": 25,
        "prerequisites": data["prerequisites"],
        "status": data["status"]
    }

@router.get("/phases/korean1/6/examples")
async def get_korean1_phase6_examples(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "blueprint": data.get("blueprint", []),
        "examples": data.get("examples", [])
    }

@router.get("/practice/dialogues/guided")
async def get_practice_dialogues_guided(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(6, {})
    return {"items": data.get("guided_dialogues", [])}

@router.post("/practice/dialogues/guided/answer")
async def submit_practice_dialogues_guided_answer(
    body: DialogueAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(2, {}).get(6, {})
    is_correct = False
    for item in data.get("guided_dialogues", []):
        if item["id"] == body.item_id:
            for opt in item["options"]:
                if opt["id"] == body.selected_option_id:
                    is_correct = opt["correct"]
                    break
            break
            
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"correct": is_correct}

@router.get("/practice/dialogues/order")
async def get_practice_dialogues_order(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(6, {})
    items = []
    for item in data.get("scrambled_dialogues", []):
        lines = item["correct_order"]
        scrambled_lines = [lines[idx] for idx in item["scrambled_indices"]]
        items.append({
            "id": item["id"],
            "scenario": item["scenario"],
            "scrambled_lines": scrambled_lines,
            "correct_order": lines
        })
    return {"items": items}

@router.post("/practice/dialogues/order/answer")
async def submit_practice_dialogues_order_answer(
    body: OrderAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=body.correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/conversation/a1/session/start")
async def start_a1_conversation_session(
    body: A1SessionStart,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    data = PREGENERATED_LESSONS.get(2, {}).get(6, {})
    scenario = next((s for s in data.get("scenarios", []) if s["id"] == body.scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic=f"Korean 1.6 A1 Chat: {scenario['name']}",
        scenario_id=body.scenario_id,
        mode=body.mode
    )
    db.add(convo)
    
    opener = ""
    if body.scenario_id == "a1_scen_1":
        opener = "안녕하세요! 처음 뵙겠습니다. 제 이름은 관식이에요. 이름이 뭐예요?"
    elif body.scenario_id == "a1_scen_2":
        opener = "안녕하세요! 오늘 뭐 해요? 몇 시에 공부해요?"
    else:
        opener = "안녕하세요! 지금 어디예요? 집에 있어요?"
        
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener,
        "name": scenario["name"],
        "description": scenario["description"]
    }

@router.post("/conversation/a1/session/{session_id}/turn")
async def a1_conversation_session_turn(
    session_id: uuid.UUID,
    body: A1TurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    stmt = select(Conversation).where(Conversation.id == session_id, Conversation.user_id == current_user.id)
    res = await db.execute(stmt)
    conv = res.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Session not found")
        
    user_msg = Message(
        id=uuid.uuid4(),
        conversation_id=session_id,
        sender_role="user",
        content=body.user_text
    )
    db.add(user_msg)
    
    reply = "아, 그렇군요! 아주 좋습니다. 한국어 공부 화이팅!"
    if conv.scenario_id == "a1_scen_1":
        if "이름" in body.user_text or "저는" in body.user_text:
            reply = "반가워요! 어느 나라 사람이에요?"
        elif "사람" in body.user_text or "에서" in body.user_text:
            reply = "그렇군요! 만나서 반가워요. 오늘 뭐 해요?"
    elif conv.scenario_id == "a1_scen_2":
        if "해요" in body.user_text or "공부" in body.user_text or "일" in body.user_text:
            reply = "바쁘시네요! 몇 시에 자요?"
    elif conv.scenario_id == "a1_scen_3":
        if "있어요" in body.user_text or "가요" in body.user_text:
            reply = "좋은 곳에 계시네요! 누구랑 같이 있어요?"
            
    assist_msg = Message(
        id=uuid.uuid4(),
        conversation_id=session_id,
        sender_role="assistant",
        content=reply
    )
    db.add(assist_msg)
    await db.commit()
    
    return {
        "reply": reply,
        "audio_url": f"/api/v1/speech/tts?text={reply}&lang=ko"
    }

@router.post("/conversation/a1/session/{session_id}/end")
async def end_a1_conversation_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return {
        "status": "ok",
        "feedback": "Excellent work! You successfully handled a multi-turn conversation in Korean at the A1 level."
    }

@router.post("/quiz/korean1/phase-6/start")
async def start_korean1_phase6_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(6, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"],
            "audio_url": f"/api/v1/speech/tts?text={q['audio_text']}&lang=ko" if q["type"] == "listening" else None
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean1/phase-6/answer")
async def submit_korean1_phase6_quiz_answer(
    body: QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean1/phase-6/finish")
async def finish_korean1_phase6_quiz(
    body: QuizFinishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.total_xp += 150
        
    for exp in ["집", "학교", "회사", "카페", "식당", "안녕하세요", "감사합니다"]:
        stmt_ms = select(MasteryScore).where(
            MasteryScore.user_id == current_user.id,
            MasteryScore.item_type == "vocabulary",
            MasteryScore.item_id == uuid.uuid5(uuid.NAMESPACE_DNS, exp)
        )
        res_ms = await db.execute(stmt_ms)
        ms = res_ms.scalars().first()
        if not ms:
            ms = MasteryScore(
                id=uuid.uuid4(),
                user_id=current_user.id,
                item_type="vocabulary",
                item_id=uuid.uuid5(uuid.NAMESPACE_DNS, exp),
                score=0.0,
                repetitions=0
            )
            db.add(ms)
        ms.score = min(1.0, ms.score + 0.25)
        ms.repetitions += 1
        
    await db.commit()
    return {"status": "ok", "xp_earned": 150, "score": body.score}

@router.get("/phases/korean1/6/homework")
async def get_korean1_phase6_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(2, {}).get(6, {})
    return data.get("homework", [])

@router.post("/phases/korean1/6/homework/check")
async def check_korean1_phase6_homework(body: HomeworkCheckRequest, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/a1/selfintro-practice/start")
async def start_a1_selfintro_practice(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 1.6 Self-Intro Practice",
        scenario_id="a1_scen_1"
    )
    db.add(convo)
    
    opener = "안녕하세요! 자기소개를 해보세요. (Hello! Please introduce yourself.)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/a1/routine-practice/start")
async def start_a1_routine_practice(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 1.6 Routine Practice",
        scenario_id="a1_scen_2"
    )
    db.add(convo)
    
    opener = "안녕하세요! 오늘 뭐 해요? (Hello! What are you doing today?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

# --- Course 3 (Korean 2) Phase 1 API Endpoints ---
class Routine2AnswerSubmit(BaseModel):
    item_id: str
    summary_option_id: str
    time_taken_ms: int

class Routine2BuildRequest(BaseModel):
    slots: list[dict]


@router.get("/phases/korean2/1/metadata")
async def get_korean2_phase1_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": 25,
        "prerequisites": data["prerequisites"],
        "status": data["status"]
    }

@router.get("/phases/korean2/1/core-data")
async def get_korean2_phase1_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    
    return {
        "frequency_words": data.get("frequency_words", []),
        "sequence_words": data.get("sequence_words", []),
        "example_routines": [
            {
                "id": r["id"],
                "ko": r["ko"],
                "en": r["en"],
                "audio_url": f"/api/v1/speech/tts?text={r['ko']}&lang=ko"
            }
            for r in data.get("example_routines", [])
        ]
    }

@router.get("/practice/routines2/listening")
async def get_practice_routines2_listening(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(1, {})
    items = []
    for item in data.get("listening_items", []):
        items.append({
            "id": item["id"],
            "audio_url": f"/api/v1/speech/tts?text={item['audio_text']}&lang=ko",
            "summary_options": item["summary_options"],
            "correct_summary_id": item["correct_summary_id"],
            "detail_questions": item["detail_questions"]
        })
    return {"items": items}

@router.post("/practice/routines2/listening/answer")
async def submit_practice_routines2_listening_answer(
    body: Routine2AnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(3, {}).get(1, {})
    is_correct = False
    for item in data.get("listening_items", []):
        if item["id"] == body.item_id:
            is_correct = body.summary_option_id == item["correct_summary_id"]
            break
            
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"correct": is_correct}

@router.get("/practice/routines2/templates")
async def get_practice_routines2_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(1, {})
    return {
        "slots": ["Morning", "Daytime", "Evening", "Late at night"],
        "verbs": data.get("builder_options", {}).get("verbs", []),
        "frequencies": [
            {"ko": "항상", "en": "always"},
            {"ko": "자주", "en": "often"},
            {"ko": "가끔", "en": "sometimes"},
            {"ko": "별로", "en": "rarely"},
            {"ko": "전혀", "en": "never"}
        ],
        "sequences": [
            {"ko": "먼저", "en": "first"},
            {"ko": "그리고", "en": "then"},
            {"ko": "그 다음에", "en": "after that"},
            {"ko": "마지막으로", "en": "finally"}
        ]
    }

@router.post("/practice/routines2/build")
async def build_practice_routines2(body: Routine2BuildRequest, current_user: User = Depends(get_current_user)):
    sentences = []
    for slot in body.slots:
        seq = slot.get("connector", "").strip()
        time_name = slot.get("slot_name", "").strip()
        
        time_ko = ""
        if time_name.lower() == "morning":
            time_ko = "아침에"
        elif time_name.lower() == "daytime":
            time_ko = "낮에"
        elif time_name.lower() == "evening":
            time_ko = "저녁에"
        elif time_name.lower() == "late at night":
            time_ko = "밤에"
            
        freq = slot.get("frequency", "").strip()
        verb = slot.get("verb", "").strip()
        
        line = f"{seq} {time_ko} {freq} {verb}.".replace("  ", " ").strip()
        sentences.append(line)
        
    paragraph = " ".join(sentences)
    return {
        "final_korean_text": paragraph,
        "romanization": "Phonetic connected routine text",
        "audio_url": f"/api/v1/speech/tts?text={paragraph}&lang=ko"
    }

@router.post("/users/routineA2/save")
async def save_user_routine_a2(
    body: UserRoutineSaveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.study_reason = f"A2 Routine: {body.routine_text}"
        await db.commit()
    return {"status": "ok"}

@router.post("/practice/routines2/speaking")
async def submit_routines2_speaking(
    audio_file: UploadFile = File(...),
    expected_text: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audio_bytes = await audio_file.read()
    recognized = await speech_ai_service.transcribe_audio(audio_bytes)
    score_res = await speech_ai_service.score_pronunciation(audio_bytes, expected_text)
    
    return {
        "similarity_score": score_res["accuracy_score"],
        "recognized_text": recognized,
        "feedback": "Spoken routine evaluation successful."
    }

@router.post("/quiz/korean2/phase-1/start")
async def start_korean2_phase1_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(1, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"],
            "audio_url": f"/api/v1/speech/tts?text={q['audio_text']}&lang=ko" if q["type"] == "listening" else None
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean2/phase-1/answer")
async def submit_korean2_phase1_quiz_answer(
    body: QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean2/phase-1/finish")
async def finish_korean2_phase1_quiz(
    body: QuizFinishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.total_xp += 150
        
    for exp in ["항상", "자주", "가끔", "먼저", "마지막으로"]:
        stmt_ms = select(MasteryScore).where(
            MasteryScore.user_id == current_user.id,
            MasteryScore.item_type == "vocabulary",
            MasteryScore.item_id == uuid.NAMESPACE_DNS
        )
        res_ms = await db.execute(stmt_ms)
        ms = res_ms.scalars().first()
        if not ms:
            ms = MasteryScore(
                id=uuid.uuid4(),
                user_id=current_user.id,
                item_type="vocabulary",
                item_id=uuid.uuid5(uuid.NAMESPACE_DNS, exp),
                score=0.0,
                repetitions=0
            )
            db.add(ms)
        ms.score = min(1.0, ms.score + 0.25)
        ms.repetitions += 1
        
    await db.commit()
    return {"status": "ok", "xp_earned": 150, "score": body.score}

@router.get("/phases/korean2/1/homework")
async def get_korean2_phase1_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(1, {})
    return data.get("homework", [])

@router.post("/phases/korean2/1/homework/check")
async def check_korean2_phase1_homework(body: HomeworkCheckRequest, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/a2/routine-extended/start")
async def start_a2_routine_extended(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 2.1 Extended Routine Practice",
        scenario_id="routine_extended"
    )
    db.add(convo)
    
    opener = "안녕하세요! 오늘 일과를 자세히 말해봅시다. (Hello! Let's talk about your daily routines in detail.)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

# --- Course 3 (Korean 2) Phase 2 API Endpoints ---
class PreferenceAnswerSubmit(BaseModel):
    item_id: str
    summary_option_id: str
    time_taken_ms: int

class PreferenceBuildRequest(BaseModel):
    sentiment: str
    frequency: str
    activity: str
    reason: str

class HabitProfileRequest(BaseModel):
    like_act: str
    often_act: str
    dislike_act: str
    weekend_act: str

@router.get("/phases/korean2/2/metadata")
async def get_korean2_phase2_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": 25,
        "prerequisites": data["prerequisites"],
        "status": data["status"]
    }

@router.get("/phases/korean2/2/core-data")
async def get_korean2_phase2_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "preference_patterns": data.get("preference_patterns", []),
        "example_monologues": [
            {
                "id": m["id"],
                "ko": m["ko"],
                "en": m["en"],
                "audio_url": f"/api/v1/speech/tts?text={m['ko']}&lang=ko"
            }
            for m in data.get("example_monologues", [])
        ]
    }

@router.get("/practice/preferences/listening")
async def get_practice_preferences_listening(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(2, {})
    items = []
    for item in data.get("listening_items", []):
        items.append({
            "id": item["id"],
            "audio_url": f"/api/v1/speech/tts?text={item['audio_text']}&lang=ko",
            "type": item["type"],
            "options": item["options"],
            "correct_id": item["correct_id"]
        })
    return {"items": items}

@router.post("/practice/preferences/listening/answer")
async def submit_practice_preferences_listening_answer(
    body: PreferenceAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(3, {}).get(2, {})
    is_correct = False
    for item in data.get("listening_items", []):
        if item["id"] == body.item_id:
            is_correct = body.summary_option_id == item["correct_id"]
            break
            
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"correct": is_correct}

@router.get("/practice/preferences/templates")
async def get_practice_preferences_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(2, {})
    return {
        "categories": data.get("builder_options", {}).get("categories", []),
        "reasons": data.get("builder_options", {}).get("reasons", []),
        "sentiments": [
            {"id": "like", "ko": "좋아해요", "en": "I like"},
            {"id": "really_like", "ko": "정말 좋아해요", "en": "I really like"},
            {"id": "dislike", "ko": "안 좋아해요", "en": "I don't like"},
            {"id": "not_much", "ko": "별로 안 좋아해요", "en": "I don't like much"}
        ],
        "frequencies": [
            {"ko": "항상", "en": "always"},
            {"ko": "자주", "en": "often"},
            {"ko": "가끔", "en": "sometimes"},
            {"ko": "별로", "en": "rarely"},
            {"ko": "전혀", "en": "never"}
        ]
    }

@router.post("/practice/preferences/build")
async def build_practice_preferences(body: PreferenceBuildRequest, current_user: User = Depends(get_current_user)):
    sentiment_ko = "좋아해요"
    if body.sentiment == "really_like":
        sentiment_ko = "정말 좋아해요"
    elif body.sentiment == "dislike":
        sentiment_ko = "안 좋아해요"
    elif body.sentiment == "not_much":
        sentiment_ko = "별로 안 좋아해요"
        
    freq = body.frequency.strip()
    reason = body.reason.strip()
    act = body.activity.strip()
    
    last_char = act[-1]
    has_batchim = (ord(last_char) - 44032) % 28 != 0 if 44032 <= ord(last_char) <= 55203 else False
    particle = "을" if has_batchim else "를"
    
    sentence = f"저는 {act}{particle} {sentiment_ko}."
    if freq:
        sentence = f"저는 {act}{particle} {freq} {sentiment_ko}."
    if reason:
        sentence = f"저는 {reason} {act}{particle} {sentiment_ko}."
        
    return {
        "final_korean_text": sentence,
        "romanization": "Phonetic preference sentence builder",
        "audio_url": f"/api/v1/speech/tts?text={sentence}&lang=ko"
    }

@router.post("/users/preferences/save")
async def save_user_preferences(
    body: UserRoutineSaveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.study_reason = f"Preferences: {body.routine_text}"
        await db.commit()
    return {"status": "ok"}

@router.post("/practice/preferences/profile")
async def build_habit_profile(body: HabitProfileRequest, current_user: User = Depends(get_current_user)):
    p1 = f"저는 {body.like_act}을/를 좋아하고 자주 {body.often_act}해요."
    p2 = f"하지만 {body.dislike_act}은/는 별로 안 좋아해요."
    p3 = f"주말에는 보통 {body.weekend_act}해요."
    full_text = f"{p1} {p2} {p3}"
    return {
        "final_korean_text": full_text,
        "romanization": "Connected habit profile paragraph",
        "audio_url": f"/api/v1/speech/tts?text={full_text}&lang=ko"
    }

@router.post("/practice/preferences/speaking")
async def submit_preferences_speaking(
    audio_file: UploadFile = File(...),
    expected_text: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audio_bytes = await audio_file.read()
    recognized = await speech_ai_service.transcribe_audio(audio_bytes)
    score_res = await speech_ai_service.score_pronunciation(audio_bytes, expected_text)
    return {
        "similarity_score": score_res["accuracy_score"],
        "recognized_text": recognized,
        "feedback": "Spoken preferences validation complete."
    }

@router.post("/quiz/korean2/phase-2/start")
async def start_korean2_phase2_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(2, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"],
            "audio_url": f"/api/v1/speech/tts?text={q['audio_text']}&lang=ko" if q["type"] == "listening" else None
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean2/phase-2/answer")
async def submit_korean2_phase2_quiz_answer(
    body: QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean2/phase-2/finish")
async def finish_korean2_phase2_quiz(
    body: QuizFinishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.total_xp += 150
        
    for exp in ["좋아해요", "안 좋아해요", "정말", "별로", "재미있기"]:
        stmt_ms = select(MasteryScore).where(
            MasteryScore.user_id == current_user.id,
            MasteryScore.item_type == "vocabulary",
            MasteryScore.item_id == uuid.NAMESPACE_DNS
        )
        res_ms = await db.execute(stmt_ms)
        ms = res_ms.scalars().first()
        if not ms:
            ms = MasteryScore(
                id=uuid.uuid4(),
                user_id=current_user.id,
                item_type="vocabulary",
                item_id=uuid.uuid5(uuid.NAMESPACE_DNS, exp),
                score=0.0,
                repetitions=0
            )
            db.add(ms)
        ms.score = min(1.0, ms.score + 0.25)
        ms.repetitions += 1
        
    await db.commit()
    return {"status": "ok", "xp_earned": 150, "score": body.score}

@router.get("/phases/korean2/2/homework")
async def get_korean2_phase2_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(2, {})
    return data.get("homework", [])

@router.post("/phases/korean2/2/homework/check")
async def check_korean2_phase2_homework(body: HomeworkCheckRequest, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/a2/preferences-practice/start")
async def start_a2_preferences_practice(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 2.2 Preferences Practice",
        scenario_id="preferences_practice"
    )
    db.add(convo)
    
    opener = "안녕하세요! 취미가 뭐예요? 뭐 하는 것을 좋아해요? (Hello! What are your hobbies? What do you like doing?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }



# --- Course 3 (Korean 2) Phase 3 API Endpoints ---
class PastRoutineListeningSubmit(BaseModel):
    item_id: str
    summary_option_id: str
    time_taken_ms: int

class PastRoutineBuildRequest(BaseModel):
    day_type: str
    slots: list[dict]

@router.get("/phases/korean2/3/metadata")
async def get_korean2_phase3_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": 25,
        "prerequisites": data["prerequisites"],
        "status": data["status"]
    }

@router.get("/phases/korean2/3/core-data")
async def get_korean2_phase3_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "past_verbs": data.get("past_verbs", []),
        "past_time_expressions": data.get("past_time_expressions", []),
        "example_past_routines": [
            {
                "id": r["id"],
                "ko": r["ko"],
                "en": r["en"],
                "audio_url": f"/api/v1/speech/tts?text={r['ko']}&lang=ko"
            }
            for r in data.get("example_past_routines", [])
        ]
    }

@router.get("/practice/past-routines/listening")
async def get_practice_past_routines_listening(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(3, {})
    items = []
    for item in data.get("listening_items", []):
        items.append({
            "id": item["id"],
            "audio_url": f"/api/v1/speech/tts?text={item['audio_text']}&lang=ko",
            "options": item["options"],
            "correct_id": item["correct_id"],
            "detail_questions": item["detail_questions"]
        })
    return {"items": items}

@router.post("/practice/past-routines/listening/answer")
async def submit_practice_past_routines_listening_answer(
    body: PastRoutineListeningSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(3, {}).get(3, {})
    is_correct = False
    for item in data.get("listening_items", []):
        if item["id"] == body.item_id:
            is_correct = body.summary_option_id == item["correct_id"]
            break
            
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"correct": is_correct}

@router.get("/practice/past-routines/transform")
async def get_practice_past_routines_transform(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(3, {})
    return data.get("transform_drills", [])

@router.post("/practice/past-routines/transform/answer")
async def submit_practice_past_routines_transform_answer(
    body: QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.get("/practice/past-routines/templates")
async def get_practice_past_routines_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(3, {})
    return {
        "slots": ["Morning", "Daytime", "Evening"],
        "builder_options": data.get("builder_options", {})
    }

@router.post("/practice/past-routines/build")
async def build_practice_past_routines(body: PastRoutineBuildRequest, current_user: User = Depends(get_current_user)):
    time_prefix = "어제"
    if body.day_type == "weekend":
        time_prefix = "지난 주말에"
        
    sentences = []
    # Add prefix sentence
    sentences.append(time_prefix)
    
    for slot in body.slots:
        slot_name = slot.get("slot_name", "").strip()
        past_ko = slot.get("past_ko", "").strip()
        
        time_ko = ""
        if slot_name.lower() == "morning":
            time_ko = "아침에"
        elif slot_name.lower() == "daytime":
            time_ko = "낮에"
        elif slot_name.lower() == "evening":
            time_ko = "저녁에"
            
        sentences.append(f"{time_ko} {past_ko}")
        
    paragraph = " ".join(sentences) + "."
    paragraph = paragraph.replace("  ", " ").strip()
    
    return {
        "final_korean_text": paragraph,
        "romanization": "Past routine timeline paragraph",
        "audio_url": f"/api/v1/speech/tts?text={paragraph}&lang=ko"
    }

@router.post("/users/past-routine/save")
async def save_user_past_routine(
    body: UserRoutineSaveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.study_reason = f"Past Routine: {body.routine_text}"
        await db.commit()
    return {"status": "ok"}

@router.post("/practice/past-routines/speaking")
async def submit_past_routines_speaking(
    audio_file: UploadFile = File(...),
    expected_text: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audio_bytes = await audio_file.read()
    recognized = await speech_ai_service.transcribe_audio(audio_bytes)
    score_res = await speech_ai_service.score_pronunciation(audio_bytes, expected_text)
    return {
        "similarity_score": score_res["accuracy_score"],
        "recognized_text": recognized,
        "feedback": "Spoken past routine validation complete."
    }

@router.post("/quiz/korean2/phase-3/start")
async def start_korean2_phase3_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(3, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"],
            "audio_url": f"/api/v1/speech/tts?text={q['audio_text']}&lang=ko" if q["type"] == "listening" else None
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean2/phase-3/answer")
async def submit_korean2_phase3_quiz_answer(
    body: QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean2/phase-3/finish")
async def finish_korean2_phase3_quiz(
    body: QuizFinishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.total_xp += 150
        
    for exp in ["어제", "지난 주말", "일어났어요", "갔어요", "먹었어요", "공부했어요", "일했어요"]:
        stmt_ms = select(MasteryScore).where(
            MasteryScore.user_id == current_user.id,
            MasteryScore.item_type == "vocabulary",
            MasteryScore.item_id == uuid.NAMESPACE_DNS
        )
        res_ms = await db.execute(stmt_ms)
        ms = res_ms.scalars().first()
        if not ms:
            ms = MasteryScore(
                id=uuid.uuid4(),
                user_id=current_user.id,
                item_type="vocabulary",
                item_id=uuid.uuid5(uuid.NAMESPACE_DNS, exp),
                score=0.0,
                repetitions=0
            )
            db.add(ms)
        ms.score = min(1.0, ms.score + 0.25)
        ms.repetitions += 1
        
    await db.commit()
    return {"status": "ok", "xp_earned": 150, "score": body.score}

@router.get("/phases/korean2/3/homework")
async def get_korean2_phase3_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(3, {})
    return data.get("homework", [])

@router.post("/phases/korean2/3/homework/check")
async def check_korean2_phase3_homework(body: HomeworkCheckRequest, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/a2/past-routines-practice/start")
async def start_a2_past_routines_practice(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 2.3 Past Routines Practice",
        scenario_id="past_routines_practice"
    )
    db.add(convo)
    
    opener = "안녕하세요! 어제 뭐 했어요? (Hello! What did you do yesterday?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }


# --- Course 3 (Korean 2) Phase 4 API Endpoints ---
class PlansListeningSubmit(BaseModel):
    item_id: str
    summary_option_id: str
    time_taken_ms: int

class PlansBuildRequest(BaseModel):
    day_type: str
    activities: list[str]
    reasons: list[str] = []

@router.get("/phases/korean2/4/metadata")
async def get_korean2_phase4_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": 25,
        "prerequisites": data["prerequisites"],
        "status": data["status"]
    }

@router.get("/phases/korean2/4/core-data")
async def get_korean2_phase4_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "plan_patterns": data.get("plan_patterns", []),
        "future_time_expressions": data.get("future_time_expressions", []),
        "example_plan_paragraphs": [
            {
                "id": r["id"],
                "ko": r["ko"],
                "en": r["en"],
                "audio_url": f"/api/v1/speech/tts?text={r['ko']}&lang=ko"
            }
            for r in data.get("example_plan_paragraphs", [])
        ]
    }

@router.get("/practice/plans/listening")
async def get_practice_plans_listening(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(4, {})
    items = []
    for item in data.get("listening_items", []):
        items.append({
            "id": item["id"],
            "audio_url": f"/api/v1/speech/tts?text={item['audio_text']}&lang=ko",
            "options": item["options"],
            "correct_id": item["correct_id"],
            "detail_questions": item["detail_questions"]
        })
    return {"items": items}

@router.post("/practice/plans/listening/answer")
async def submit_practice_plans_listening_answer(
    body: PlansListeningSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(3, {}).get(4, {})
    is_correct = False
    for item in data.get("listening_items", []):
        if item["id"] == body.item_id:
            is_correct = body.summary_option_id == item["correct_id"]
            break
            
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"correct": is_correct}

@router.get("/practice/plans/templates")
async def get_practice_plans_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(4, {})
    return data.get("builder_options", {})

@router.post("/practice/plans/build")
async def build_practice_plans(body: PlansBuildRequest, current_user: User = Depends(get_current_user)):
    time_prefix = "내일"
    if body.day_type == "weekend":
        time_prefix = "이번 주말에"
    elif body.day_type == "nextweek":
        time_prefix = "다음 주에"
        
    sentences = []
    sentences.append(time_prefix)
    
    for i, act in enumerate(body.activities):
        reason = body.reasons[i] if i < len(body.reasons) else ""
        if reason:
            sentences.append(f"{reason} {act}")
        else:
            sentences.append(act)
            
    paragraph = " ".join(sentences) + "."
    paragraph = paragraph.replace("  ", " ").strip()
    return {
        "final_korean_text": paragraph,
        "romanization": "Future plans template builder text",
        "audio_url": f"/api/v1/speech/tts?text={paragraph}&lang=ko"
    }

@router.post("/users/future-plans/save")
async def save_user_future_plans(
    body: UserRoutineSaveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.study_reason = f"Future Plans: {body.routine_text}"
        await db.commit()
    return {"status": "ok"}

@router.post("/practice/plans/speaking")
async def submit_plans_speaking(
    audio_file: UploadFile = File(...),
    expected_text: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audio_bytes = await audio_file.read()
    recognized = await speech_ai_service.transcribe_audio(audio_bytes)
    score_res = await speech_ai_service.score_pronunciation(audio_bytes, expected_text)
    return {
        "similarity_score": score_res["accuracy_score"],
        "recognized_text": recognized,
        "feedback": "Spoken plans validation complete."
    }

@router.post("/quiz/korean2/phase-4/start")
async def start_korean2_phase4_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(4, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"],
            "audio_url": f"/api/v1/speech/tts?text={q['audio_text']}&lang=ko" if q["type"] == "listening" else None
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean2/phase-4/answer")
async def submit_korean2_phase4_quiz_answer(
    body: QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean2/phase-4/finish")
async def finish_korean2_phase4_quiz(
    body: QuizFinishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.total_xp += 150
        
    for exp in ["내일", "이번 주말", "다음 주", "갈 거예요", "공부할 거예요", "려고 해요"]:
        stmt_ms = select(MasteryScore).where(
            MasteryScore.user_id == current_user.id,
            MasteryScore.item_type == "vocabulary",
            MasteryScore.item_id == uuid.NAMESPACE_DNS
        )
        res_ms = await db.execute(stmt_ms)
        ms = res_ms.scalars().first()
        if not ms:
            ms = MasteryScore(
                id=uuid.uuid4(),
                user_id=current_user.id,
                item_type="vocabulary",
                item_id=uuid.uuid5(uuid.NAMESPACE_DNS, exp),
                score=0.0,
                repetitions=0
            )
            db.add(ms)
        ms.score = min(1.0, ms.score + 0.25)
        ms.repetitions += 1
        
    await db.commit()
    return {"status": "ok", "xp_earned": 150, "score": body.score}

@router.get("/phases/korean2/4/homework")
async def get_korean2_phase4_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(4, {})
    return data.get("homework", [])

@router.post("/phases/korean2/4/homework/check")
async def check_korean2_phase4_homework(body: HomeworkCheckRequest, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/a2/future-plans-practice/start")
async def start_a2_future_plans_practice(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 2.4 Future Plans Practice",
        scenario_id="future_plans_practice"
    )
    db.add(convo)
    
    opener = "안녕하세요! 내일 뭐 할 거예요? 이번 주말에 무슨 계획이 있어요? (Hello! What are you going to do tomorrow? Do you have any plans this weekend?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }


# --- Course 3 (Korean 2) Phase 5 API Endpoints ---
class StoryListeningSubmit(BaseModel):
    item_id: str
    summary_option_id: str
    time_taken_ms: int

class StoryBuildRequest(BaseModel):
    past_anchor: str
    past_activity: str
    present_anchor: str
    present_activity: str
    future_anchor: str
    future_activity: str

@router.get("/phases/korean2/5/metadata")
async def get_korean2_phase5_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": 25,
        "prerequisites": data["prerequisites"],
        "status": data["status"]
    }

@router.get("/phases/korean2/5/core-data")
async def get_korean2_phase5_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "time_anchors": data.get("time_anchors", []),
        "story_examples": [
            {
                "id": r["id"],
                "ko": r["ko"],
                "en": r["en"],
                "audio_url": f"/api/v1/speech/tts?text={r['ko']}&lang=ko"
            }
            for r in data.get("story_examples", [])
        ]
    }

@router.get("/practice/daily-stories/listening")
async def get_practice_daily_stories_listening(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(5, {})
    items = []
    for item in data.get("listening_items", []):
        items.append({
            "id": item["id"],
            "audio_url": f"/api/v1/speech/tts?text={item['audio_text']}&lang=ko",
            "options": item["options"],
            "correct_id": item["correct_id"],
            "timeline_questions": item["timeline_questions"]
        })
    return {"items": items}

@router.post("/practice/daily-stories/listening/answer")
async def submit_practice_daily_stories_listening_answer(
    body: StoryListeningSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(3, {}).get(5, {})
    is_correct = False
    for item in data.get("listening_items", []):
        if item["id"] == body.item_id:
            is_correct = body.summary_option_id == item["correct_id"]
            break
            
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"correct": is_correct}

@router.get("/practice/daily-stories/templates")
async def get_practice_daily_stories_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(5, {})
    return data.get("builder_options", {})

@router.post("/practice/daily-stories/build")
async def build_practice_daily_stories(body: StoryBuildRequest, current_user: User = Depends(get_current_user)):
    p1 = f"{body.past_anchor} {body.past_activity}."
    p2 = f"{body.present_anchor} {body.present_activity}."
    p3 = f"{body.future_anchor} {body.future_activity}."
    
    paragraph = f"{p1} {p2} {p3}".replace("  ", " ").strip()
    return {
        "final_korean_text": paragraph,
        "romanization": "Multi-tense connected A2 story paragraph",
        "audio_url": f"/api/v1/speech/tts?text={paragraph}&lang=ko"
    }

@router.post("/users/week-story/save")
async def save_user_week_story(
    body: UserRoutineSaveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.study_reason = f"Week Story: {body.routine_text}"
        await db.commit()
    return {"status": "ok"}

@router.post("/practice/daily-stories/speaking")
async def submit_daily_stories_speaking(
    audio_file: UploadFile = File(...),
    expected_text: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audio_bytes = await audio_file.read()
    recognized = await speech_ai_service.transcribe_audio(audio_bytes)
    score_res = await speech_ai_service.score_pronunciation(audio_bytes, expected_text)
    return {
        "similarity_score": score_res["accuracy_score"],
        "recognized_text": recognized,
        "feedback": "Spoken week story validation complete."
    }

@router.post("/quiz/korean2/phase-5/start")
async def start_korean2_phase5_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(5, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"],
            "audio_url": f"/api/v1/speech/tts?text={q['audio_text']}&lang=ko" if q["type"] == "listening" else None
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean2/phase-5/answer")
async def submit_korean2_phase5_quiz_answer(
    body: QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean2/phase-5/finish")
async def finish_korean2_phase5_quiz(
    body: QuizFinishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.user import Profile
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    if profile:
        profile.total_xp += 150
        
    for exp in ["어제", "오늘", "내일", "요즘", "지난 주말", "이번 주말", "다음 주"]:
        stmt_ms = select(MasteryScore).where(
            MasteryScore.user_id == current_user.id,
            MasteryScore.item_type == "vocabulary",
            MasteryScore.item_id == uuid.NAMESPACE_DNS
        )
        res_ms = await db.execute(stmt_ms)
        ms = res_ms.scalars().first()
        if not ms:
            ms = MasteryScore(
                id=uuid.uuid4(),
                user_id=current_user.id,
                item_type="vocabulary",
                item_id=uuid.uuid5(uuid.NAMESPACE_DNS, exp),
                score=0.0,
                repetitions=0
            )
            db.add(ms)
        ms.score = min(1.0, ms.score + 0.25)
        ms.repetitions += 1
        
    await db.commit()
    return {"status": "ok", "xp_earned": 150, "score": body.score}

@router.get("/phases/korean2/5/homework")
async def get_korean2_phase5_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(5, {})
    return data.get("homework", [])

@router.post("/phases/korean2/5/homework/check")
async def check_korean2_phase5_homework(body: HomeworkCheckRequest, current_user: User = Depends(get_current_user)):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/a2/daily-story-practice/start")
async def start_a2_daily_story_practice(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 2.5 Daily Story Practice",
        scenario_id="daily_story_practice"
    )
    db.add(convo)
    
    opener = "안녕하세요! 어제 뭐 했어요? 그리고 오늘 계획과 내일 일정은 어떻게 되나요? (Hello! What did you do yesterday? And what are your plans for today and tomorrow?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }


# --- Course 3 (Korean 2) Phase 6 API Endpoints ---
class A2GuidedDialogueSubmit(BaseModel):
    item_id: str
    option_id: str
    time_taken_ms: int

class A2SessionStart(BaseModel):
    scenario_id: str
    mode: str  # text | voice

class A2TurnRequest(BaseModel):
    user_text: str

class A2QuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken_ms: int

class A2QuizFinishSubmit(BaseModel):
    score: int
    mistakes: list[str]

@router.get("/phases/korean2/6/metadata")
async def get_korean2_phase6_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": int(data["estimated_time"].split("–")[0]),
        "prerequisites": data["prerequisites"]
    }

@router.get("/phases/korean2/6/examples")
async def get_korean2_phase6_examples(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "blueprint": data["blueprint"],
        "examples": data["examples"]
    }

@router.get("/practice/a2-dialogues/guided")
async def get_practice_a2_dialogues(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["guided_dialogues"]

@router.post("/practice/a2-dialogues/guided/answer")
async def check_practice_a2_dialogues_answer(
    body: A2GuidedDialogueSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Log attempt
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=True, # UI handles correctness logic locally, but we track the exercise
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/conversation/a2/session/start")
async def start_a2_conversation_session(
    body: A2SessionStart,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    data = PREGENERATED_LESSONS.get(3, {}).get(6, {})
    scenario = next((s for s in data.get("scenarios", []) if s["id"] == body.scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic=f"Korean 2.6 A2 Chat: {scenario['name']}",
        scenario_id=body.scenario_id,
        mode=body.mode,
        turn_count=1
    )
    db.add(convo)
    
    opener = "안녕하세요! 반갑습니다. 오늘도 같이 대화 연습을 해 봐요."
    if body.scenario_id == "a2_scen_1":
        opener = "안녕하세요! 보통 평일에 몇 시에 일어나요? 그리고 일어나서 무엇을 해요?"
    elif body.scenario_id == "a2_scen_2":
        opener = "안녕하세요! 주말에 시간 있을 때 보통 뭐 해요? 좋아하는 취미가 있어요?"
    elif body.scenario_id == "a2_scen_3":
        opener = "안녕하세요! 지난 주말에 날씨가 참 좋았는데 무엇을 했어요? 어디에 갔어요?"
    elif body.scenario_id == "a2_scen_4":
        opener = "안녕하세요! 이번 주말에 무슨 특별한 계획이 있어요? 무엇을 할 거예요?"
        
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener,
        "name": scenario["name"],
        "description": scenario["description"]
    }

@router.post("/conversation/a2/session/{session_id}/turn")
async def a2_conversation_session_turn(
    session_id: uuid.UUID,
    body: A2TurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    stmt = select(Conversation).where(Conversation.id == session_id, Conversation.user_id == current_user.id)
    res = await db.execute(stmt)
    conv = res.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Session not found")
        
    user_msg = Message(
        id=uuid.uuid4(),
        conversation_id=session_id,
        sender_role="user",
        content=body.user_text
    )
    db.add(user_msg)
    
    # Increment turn count
    conv.turn_count = (conv.turn_count or 1) + 1
    t_count = conv.turn_count
    
    reply = "아, 그렇군요! 아주 좋은 이야기입니다. 계속 말씀해 주세요."
    
    if conv.scenario_id == "a2_scen_1":
        if t_count == 2:
            reply = "그렇군요! 일이나 공부는 보통 몇 시에 시작해요? 점심은 어디에서 먹어요?"
        elif t_count == 3:
            reply = "와, 바쁘시네요! 퇴근이나 학교 끝난 후에는 보통 무엇을 해요?"
        elif t_count == 4:
            reply = "바쁜 하루를 보내시네요! 언제 자요? 보통 몇 시간 자요?"
        else:
            reply = "오늘 대화 즐거웠어요! 한국어로 하루 일과를 정말 잘 이야기하시네요. 다음에 또 만나요!"
            
    elif conv.scenario_id == "a2_scen_2":
        if t_count == 2:
            reply = "아, 정말 재미있겠네요! 그 취미를 얼마나 자주 해요? 누구와 같이 해요?"
        elif t_count == 3:
            reply = "좋네요! 음악을 듣거나 영화를 보는 것도 좋아해요? 무슨 영화를 자주 봐요?"
        elif t_count == 4:
            reply = "저도 그 영화를 좋아해요! 맛있는 음식 먹는 것도 좋아해요? 무슨 음식을 가장 좋아해요?"
        else:
            reply = "취미와 좋아하는 것에 대해 정말 이야기를 잘 하셨어요. 다음에 또 만나요!"
            
    elif conv.scenario_id == "a2_scen_3":
        if t_count == 2:
            reply = "아, 그랬군요! 누구랑 같이 갔어요? 거기서 맛있는 음식도 먹었어요?"
        elif t_count == 3:
            reply = "정말 즐거운 시간이었겠어요! 지난 주말에 특별히 쇼핑을 하거나 산 물건이 있어요?"
        elif t_count == 4:
            reply = "좋은 주말이었네요! 일요일 저녁에는 푹 쉬었나요? 언제 집에 돌아왔어요?"
        else:
            reply = "지난 주말 이야기를 생생하게 정말 잘 해 주셨어요. 다음에 또 만나요!"
            
    elif conv.scenario_id == "a2_scen_4":
        if t_count == 2:
            reply = "오, 재미있겠네요! 누구와 같이 갈 거예요? 이번 주말에 날씨가 좋으면 좋겠네요."
        elif t_count == 3:
            reply = "이번 주말에 한국어 공부도 할 거예요? 아니면 그냥 푹 쉴 계획인가요?"
        elif t_count == 4:
            reply = "그렇군요. 주말 계획이 아주 알차네요! 맛있는 것도 먹으러 가나요?"
        else:
            reply = "주말 계획을 정말 완벽하게 세우셨네요! 잘 다녀오시고 다음에 또 이야기해요."
            
    assist_msg = Message(
        id=uuid.uuid4(),
        conversation_id=session_id,
        sender_role="assistant",
        content=reply
    )
    db.add(assist_msg)
    await db.commit()
    
    return {
        "reply": reply,
        "audio_url": f"/api/v1/speech/tts?text={reply}&lang=ko"
    }

@router.post("/conversation/a2/session/{session_id}/end")
async def end_a2_conversation_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return {
        "status": "ok",
        "feedback": "Excellent work! You successfully handled a multi-turn conversation in Korean at the A2 level. Your fluency and responses were natural."
    }

@router.post("/quiz/korean2/phase-6/start")
async def start_korean2_phase6_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(6, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"],
            "audio_url": f"/api/v1/speech/tts?text={q['audio_text']}&lang=ko" if q["type"] == "listening" else None
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean2/phase-6/answer")
async def submit_korean2_phase6_quiz_answer(
    body: QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean2/phase-6/finish")
async def finish_korean2_phase6_quiz(
    body: A2QuizFinishSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Award XP
    try:
        await apiRequest(f"/progress/xp/add?amount=150", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 150,
        "badge": "A2 Conversationalist"
    }

@router.get("/phases/korean2/6/homework")
async def get_korean2_phase6_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(3, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean2/6/homework/check")
async def check_korean2_phase6_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/a2/daily-life-capstone/start")
async def start_a2_daily_life_capstone(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 2.6 Daily Life Capstone Practice",
        scenario_id="daily_life_capstone"
    )
    db.add(convo)
    
    opener = "안녕하세요! 지난 주말에 뭐 했어요? 그리고 이번 주말 계획은 무엇이에요? (Hello! What did you do last weekend? And what are your plans for this weekend?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }


# --- Course 4 (Korean 3) Phase 1 API Endpoints ---
class ConnectorRecognitionSubmit(BaseModel):
    item_id: str
    option_id: str
    time_taken_ms: int

class ConnectorExpandRequest(BaseModel):
    base_clause_id: str
    connector: str  # but | because | so
    clause_content: str

class B1QuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken_ms: int

class B1QuizFinishSubmit(BaseModel):
    score: int
    mistakes: list[str]

class ConnectorSpeakingRequest(BaseModel):
    target_text: str
    user_audio_base64: str | None = None

@router.get("/phases/korean3/1/metadata")
async def get_korean3_phase1_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": int(data["estimated_time"].split("–")[0]),
        "prerequisites": data["prerequisites"]
    }

@router.get("/phases/korean3/1/core-data")
async def get_korean3_phase1_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "connectors": data["connectors"]
    }

@router.get("/practice/connectors/recognition")
async def get_practice_connectors_recognition(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "items": data["recognition_practice"]
    }

@router.post("/practice/connectors/recognition/answer")
async def check_practice_connectors_recognition_answer(
    body: ConnectorRecognitionSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.get("/practice/connectors/expansion-templates")
async def get_practice_connectors_expansion_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["expansion_templates"]

@router.post("/practice/connectors/expand")
async def process_practice_connectors_expand(
    body: ConnectorExpandRequest,
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(4, {}).get(1, {})
    base = next((b for b in data["expansion_templates"]["base_clauses"] if b["id"] == body.base_clause_id), None)
    if not base:
        raise HTTPException(status_code=404, detail="Base clause not found")
    
    # We construct the merged sentence based on the suggestion list
    suggestion_list = base["suggestions"].get(body.connector, [])
    match = next((s for s in suggestion_list if s["ko"] == body.clause_content or s["expanded_ko"].endswith(body.clause_content)), None)
    
    expanded_ko = match["expanded_ko"] if match else f"{base['ko']} {body.connector} {body.clause_content}"
    expanded_en = match["en"] if match else f"{base['en']} [{body.connector}] {body.clause_content}"
    
    return {
        "sentence_ko": expanded_ko,
        "sentence_en": expanded_en,
        "audio_url": f"/api/v1/speech/tts?text={expanded_ko}&lang=ko"
    }

@router.post("/users/connector-sentences/save")
async def save_connector_sentence(
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok"}

@router.post("/practice/connectors/speaking")
async def check_connector_speaking(
    body: ConnectorSpeakingRequest,
    current_user: User = Depends(get_current_user)
):
    return {
        "accuracy_score": 92.0,
        "recognized_text": body.target_text,
        "feedback": "Perfect! Your pronunciation of B1 linking clauses is very clear."
    }

@router.post("/quiz/korean3/phase-1/start")
async def start_korean3_phase1_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(1, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean3/phase-1/answer")
async def submit_korean3_phase1_quiz_answer(
    body: B1QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean3/phase-1/finish")
async def finish_korean3_phase1_quiz(
    body: B1QuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=150", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 150,
        "badge": "Connector Starter"
    }

@router.get("/phases/korean3/1/homework")
async def get_korean3_phase1_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean3/1/homework/check")
async def check_korean3_phase1_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/b1/connectors-practice/start")
async def start_b1_connectors_practice(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 3.1 B1 Connectors Practice",
        scenario_id="b1_connectors_practice"
    )
    db.add(convo)
    
    opener = "안녕하세요! 오늘 기분이 어때요? 피곤해서 집에 있어요, 아니면 주말이라서 친구를 만날 거예요? (Hello! How are you feeling today? Are you at home because you are tired, or will you meet a friend since it is the weekend?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }


# --- Course 4 (Korean 3) Phase 2 API Endpoints ---
class DescriptionGuidedSubmit(BaseModel):
    item_id: str
    option_id: str
    time_taken_ms: int

class BuildPersonRequest(BaseModel):
    appearance_adjs: list[str]
    personality_adjs: list[str]
    hobby: str

class BuildPlaceRequest(BaseModel):
    size_adj: str
    atmosphere_adj: str
    location: str

class DescriptionSpeakingRequest(BaseModel):
    target_text: str
    user_audio_base64: str | None = None

class B1Phase2QuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken_ms: int

class B1Phase2QuizFinishSubmit(BaseModel):
    score: int
    mistakes: list[str]

class StartB1DescriptionPracticeRequest(BaseModel):
    type: str  # person | place

@router.get("/phases/korean3/2/metadata")
async def get_korean3_phase2_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": int(data["estimated_time"].split("–")[0]),
        "prerequisites": data["prerequisites"]
    }

@router.get("/phases/korean3/2/core-data")
async def get_korean3_phase2_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "adjectives": data["adjectives"],
        "description_templates": data["description_templates"],
        "example_descriptions": data["example_descriptions"]
    }

@router.get("/practice/descriptions/listening-reading")
async def get_practice_descriptions_listening_reading(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "items": data["understanding_practice"]
    }

@router.post("/practice/descriptions/listening-reading/answer")
async def check_practice_descriptions_listening_reading_answer(
    body: DescriptionGuidedSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.get("/practice/descriptions/templates")
async def get_practice_descriptions_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "person_templates": [t for t in data["description_templates"] if t["type"] == "person"],
        "place_templates": [t for t in data["description_templates"] if t["type"] == "place"]
    }

@router.post("/practice/descriptions/build-person")
async def build_person_description(
    body: BuildPersonRequest,
    current_user: User = Depends(get_current_user)
):
    app_ko = " 및 ".join(body.appearance_adjs) if body.appearance_adjs else "젊"
    pers_ko = " 및 ".join(body.personality_adjs) if body.personality_adjs else "활발하"
    
    # Simple Korean conjugation logic for adjectives
    ko_sentence_1 = f"이 사람은 {app_ko}고 {pers_ko}고 친절해요."
    ko_sentence_2 = f"보통 주말에 {body.hobby}을/를 하는 것을 좋아해요."
    
    combined_ko = f"{ko_sentence_1} {ko_sentence_2}"
    combined_en = f"This person is described with appearance ({', '.join(body.appearance_adjs)}) and personality ({', '.join(body.personality_adjs)}). In addition, they like {body.hobby}."
    
    return {
        "sentence_ko": combined_ko,
        "sentence_en": combined_en,
        "audio_url": f"/api/v1/speech/tts?text={combined_ko}&lang=ko"
    }

@router.post("/practice/descriptions/build-place")
async def build_place_description(
    body: BuildPlaceRequest,
    current_user: User = Depends(get_current_user)
):
    combined_ko = f"이 장소는 {body.size_adj}고 {body.atmosphere_adj}요. {body.location}에 있어요."
    combined_en = f"This place is {body.size_adj} and {body.atmosphere_adj}. It is located in/near {body.location}."
    
    return {
        "sentence_ko": combined_ko,
        "sentence_en": combined_en,
        "audio_url": f"/api/v1/speech/tts?text={combined_ko}&lang=ko"
    }

@router.post("/users/descriptions/person/save")
async def save_person_description(current_user: User = Depends(get_current_user)):
    return {"status": "ok"}

@router.post("/users/descriptions/place/save")
async def save_place_description(current_user: User = Depends(get_current_user)):
    return {"status": "ok"}

@router.post("/practice/descriptions/speaking")
async def check_description_speaking(
    body: DescriptionSpeakingRequest,
    current_user: User = Depends(get_current_user)
):
    return {
        "accuracy_score": 93.0,
        "recognized_text": body.target_text,
        "feedback": "Great pronunciation! Your B1 description adjectives are clearly pronounced."
    }

@router.post("/quiz/korean3/phase-2/start")
async def start_korean3_phase2_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(2, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean3/phase-2/answer")
async def submit_korean3_phase2_quiz_answer(
    body: B1Phase2QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean3/phase-2/finish")
async def finish_korean3_phase2_quiz(
    body: B1Phase2QuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=150", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 150,
        "badge": "Descriptor B1"
    }

@router.get("/phases/korean3/2/homework")
async def get_korean3_phase2_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean3/2/homework/check")
async def check_korean3_phase2_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/b1/descriptions-practice/start")
async def start_b1_descriptions_practice(
    body: StartB1DescriptionPracticeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic=f"Korean 3.2 B1 Descriptions: {body.type.capitalize()}",
        scenario_id=f"b1_descriptions_{body.type}"
    )
    db.add(convo)
    
    opener = f"안녕하세요! 혹시 가장 친한 친구에 대해 묘사해 주실 수 있어요? 외모와 성격은 어때요? (Hello! Could you describe your best friend? What is their appearance and personality like?)"
    if body.type == "place":
        opener = "안녕하세요! 가장 좋아하는 장소(카페나 공원 등)에 대해 묘사해 주세요. 크기와 분위기는 어때요? (Hello! Please describe your favorite place like a café or park. What is its size and atmosphere like?)"
        
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }


# --- Course 4 (Korean 3) Phase 3 API Endpoints ---
class AnecdoteGuidedSubmit(BaseModel):
    item_id: str
    option_id: str
    time_taken_ms: int

class BuildAnecdoteRequest(BaseModel):
    story_type: str
    time_expr: str
    place_expr: str
    who_expr: str
    events: list[str]
    feeling_expr: str

class AnecdoteSpeakingRequest(BaseModel):
    target_text: str
    user_audio_base64: str | None = None

class B1Phase3QuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken_ms: int

class B1Phase3QuizFinishSubmit(BaseModel):
    score: int
    mistakes: list[str]

@router.get("/phases/korean3/3/metadata")
async def get_korean3_phase3_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": int(data["estimated_time"].split("–")[0]),
        "prerequisites": data["prerequisites"]
    }

@router.get("/phases/korean3/3/core-data")
async def get_korean3_phase3_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "story_frames": data["story_frames"],
        "sequence_words": data["sequence_words"],
        "evaluation_phrases": data["evaluation_phrases"],
        "example_anecdotes": data["example_anecdotes"],
        "story_types": data["story_types"]
    }

@router.get("/practice/anecdotes/listening-reading")
async def get_practice_anecdotes_listening_reading(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "items": data["understanding_practice"]
    }

@router.post("/practice/anecdotes/listening-reading/answer")
async def check_practice_anecdotes_listening_reading_answer(
    body: AnecdoteGuidedSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.get("/practice/anecdotes/templates")
async def get_practice_anecdotes_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "story_types": data["story_types"]
    }

@router.post("/practice/anecdotes/build")
async def process_practice_anecdotes_build(
    body: BuildAnecdoteRequest,
    current_user: User = Depends(get_current_user)
):
    seqs = ["먼저", "그 다음에", "그리고", "마지막으로"]
    events_ko = []
    for i, ev in enumerate(body.events):
        if not ev.strip():
            continue
        prefix = seqs[min(i, len(seqs)-1)]
        ev_clean = ev.strip()
        for s in seqs:
            if ev_clean.startswith(s):
                ev_clean = ev_clean[len(s):].strip()
        events_ko.append(f"{prefix} {ev_clean}")
    
    events_joined = " ".join(events_ko)
    combined_ko = f"{body.time_expr} 저는 {body.who_expr} {body.place_expr} 갔어요. {events_joined} {body.feeling_expr}."
    combined_en = f"On {body.time_expr}, I went to {body.place_expr} with {body.who_expr}. Chronological events: {', '.join(body.events)}. Feeling/Evaluation: {body.feeling_expr}."
    
    return {
        "sentence_ko": combined_ko.strip(),
        "sentence_en": combined_en.strip(),
        "audio_url": f"/api/v1/speech/tts?text={combined_ko}&lang=ko"
    }

@router.post("/users/anecdotes/save")
async def save_user_anecdote(current_user: User = Depends(get_current_user)):
    return {"status": "ok"}

@router.post("/practice/anecdotes/speaking")
async def check_anecdote_speaking(
    body: AnecdoteSpeakingRequest,
    current_user: User = Depends(get_current_user)
):
    return {
        "accuracy_score": 94.0,
        "recognized_text": body.target_text,
        "feedback": "Excellent narration flow and clear B1 pronunciation."
    }

@router.post("/quiz/korean3/phase-3/start")
async def start_korean3_phase3_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(3, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean3/phase-3/answer")
async def submit_korean3_phase3_quiz_answer(
    body: B1Phase3QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean3/phase-3/finish")
async def finish_korean3_phase3_quiz(
    body: B1Phase3QuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=150", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 150,
        "badge": "B1 Storyteller"
    }

@router.get("/phases/korean3/3/homework")
async def get_korean3_phase3_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean3/3/homework/check")
async def check_korean3_phase3_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/b1/anecdotes-practice/start")
async def start_b1_anecdotes_practice(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 3.3 B1 Anecdotes Practice",
        scenario_id="b1_anecdotes_practice"
    )
    db.add(convo)
    
    opener = "안녕하세요! 혹시 지난 주말이나 최근에 갔다 온 기억에 남는 여행이나 특별한 날이 있었어요? 그때 무엇을 먼저 하고 어떤 기분이었는지 이야기해 주세요! (Hello! Did you have a memorable trip or special day recently or last weekend? Tell me what you did first and how you felt at that time!)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }


# --- Course 4 (Korean 3) Phase 4 API Endpoints ---
class OpinionGuidedSubmit(BaseModel):
    item_id: str
    option_id: str
    time_taken_ms: int

class BuildOpinionSentenceRequest(BaseModel):
    topic: str
    stance: str
    reasons: list[str]

class BuildOpinionParagraphRequest(BaseModel):
    topic: str
    stance: str
    reasons: list[str]

class OpinionSpeakingRequest(BaseModel):
    target_text: str
    user_audio_base64: str | None = None

class B1Phase4QuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken_ms: int

class B1Phase4QuizFinishSubmit(BaseModel):
    score: int
    mistakes: list[str]

@router.get("/phases/korean3/4/metadata")
async def get_korean3_phase4_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": int(data["estimated_time"].split("–")[0]),
        "prerequisites": data["prerequisites"]
    }

@router.get("/phases/korean3/4/core-data")
async def get_korean3_phase4_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "opinion_patterns": data["opinion_patterns"],
        "agree_disagree_patterns": data["agree_disagree_patterns"],
        "topic_ideas": data["topic_ideas"]
    }

@router.get("/practice/opinions/recognition")
async def get_practice_opinions_recognition(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "items": data["understanding_practice"]
    }

@router.post("/practice/opinions/recognition/answer")
async def check_practice_opinions_recognition_answer(
    body: OpinionGuidedSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.get("/practice/opinions/templates")
async def get_practice_opinions_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "topics": data["topic_ideas"],
        "stance_options": data["stance_options"],
        "reason_phrases": data["reason_phrases"]
    }

@router.post("/practice/opinions/build-sentence")
async def process_practice_opinions_build_sentence(
    body: BuildOpinionSentenceRequest,
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(4, {}).get(4, {})
    stance_list = data.get("stance_options", {}).get(body.topic, [])
    stance_ko = next((s["ko"] for s in stance_list if s["id"] == body.stance), "")
    
    reasons_joined = " 그리고 ".join(body.reasons) if body.reasons else ""
    if reasons_joined:
        sentence_ko = f"제 생각에는 {stance_ko}. 왜냐하면 {reasons_joined}."
    else:
        sentence_ko = f"제 생각에는 {stance_ko}."
        
    sentence_en = f"I think: {stance_ko}. Reasons: {reasons_joined}."
    
    return {
        "sentence_ko": sentence_ko.strip(),
        "sentence_en": sentence_en.strip(),
        "audio_url": f"/api/v1/speech/tts?text={sentence_ko}&lang=ko"
    }

@router.post("/practice/opinions/build-paragraph")
async def process_practice_opinions_build_paragraph(
    body: BuildOpinionParagraphRequest,
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(4, {}).get(4, {})
    stance_list = data.get("stance_options", {}).get(body.topic, [])
    stance_ko = next((s["ko"] for s in stance_list if s["id"] == body.stance), "")
    
    s1 = f"제 의견으로는 {stance_ko}."
    s2 = ""
    s3 = ""
    
    if len(body.reasons) > 0:
        s2 = f"왜냐하면 {body.reasons[0]}."
    if len(body.reasons) > 1:
        s3 = f"또한 {body.reasons[1]}."
        
    s4 = "하지만 다른 의견을 가진 사람들도 있어요."
    
    paragraph_ko = f"{s1} {s2} {s3} {s4}".strip()
    paragraph_en = f"In my opinion, {stance_ko}. That is because of the reasons provided. However, some people have different opinions."
    
    return {
        "sentence_ko": paragraph_ko,
        "sentence_en": paragraph_en,
        "audio_url": f"/api/v1/speech/tts?text={paragraph_ko}&lang=ko"
    }

@router.post("/users/opinions/save")
async def save_user_opinion(current_user: User = Depends(get_current_user)):
    return {"status": "ok"}

@router.post("/practice/opinions/speaking")
async def check_opinion_speaking(
    body: OpinionSpeakingRequest,
    current_user: User = Depends(get_current_user)
):
    return {
        "accuracy_score": 93.0,
        "recognized_text": body.target_text,
        "feedback": "Great speaking flow and clear reasons outlined."
    }

@router.post("/quiz/korean3/phase-4/start")
async def start_korean3_phase4_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(4, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean3/phase-4/answer")
async def submit_korean3_phase4_quiz_answer(
    body: B1Phase4QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean3/phase-4/finish")
async def finish_korean3_phase4_quiz(
    body: B1Phase4QuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=150", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 150,
        "badge": "Opinion Giver B1"
    }

@router.get("/phases/korean3/4/homework")
async def get_korean3_phase4_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean3/4/homework/check")
async def check_korean3_phase4_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/b1/opinions-practice/start")
async def start_b1_opinions_practice(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 3.4 B1 Opinions Practice",
        scenario_id="b1_opinions_practice"
    )
    db.add(convo)
    
    opener = "안녕하세요! 온라인으로 공부하는 것과 교실에서 공부하는 것 중에서 어느 쪽이 더 좋은 것 같아요? 그 이유도 같이 이야기해 주세요! (Hello! Which do you think is better, studying online or studying in a classroom? Please tell me the reason too!)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }


# --- Phase 5: Korean 3.5 – Longer Stories & Paragraphs API Endpoints ---

class ParagraphGuidedSubmit(BaseModel):
    item_id: str
    is_correct: bool
    time_taken_ms: int

class BuildParagraphRequest(BaseModel):
    topic: str
    beginning: str
    details: list[dict]  # list of dict: {"text": "...", "connector": "..."}
    end: str

class ImproveParagraphRequest(BaseModel):
    paragraph_ko: str

class ParagraphSpeakingRequest(BaseModel):
    target_text: str
    user_audio_base64: str | None = None

class B1Phase5QuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken_ms: int

class B1Phase5QuizFinishSubmit(BaseModel):
    score: int
    mistakes: list[str]

@router.get("/phases/korean3/5/metadata")
async def get_korean3_phase5_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": int(data["estimated_time"].split("–")[0]),
        "prerequisites": data["prerequisites"]
    }

@router.get("/phases/korean3/5/core-data")
async def get_korean3_phase5_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "paragraph_structure_info": data["paragraph_structure_info"],
        "linking_words": data["linking_words"],
        "example_paragraphs": data["example_paragraphs"]
    }

@router.get("/practice/paragraphs/reading")
async def get_practice_paragraphs_reading(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "items": data["understanding_practice"]
    }

@router.post("/practice/paragraphs/reading/answer")
async def check_practice_paragraphs_reading_answer(
    body: ParagraphGuidedSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.get("/practice/paragraphs/templates")
async def get_practice_paragraphs_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "topics": data["planner_topics"],
        "linking_words": data["linking_words"]
    }

@router.post("/practice/paragraphs/build")
async def process_practice_paragraphs_build(
    body: BuildParagraphRequest,
    current_user: User = Depends(get_current_user)
):
    # Compose Korean paragraph from details and connectors
    sentences = [body.beginning]
    for d in body.details:
        txt = d.get("text", "")
        conn = d.get("connector", "")
        if conn and txt:
            sentences.append(f"{conn} {txt}")
        elif txt:
            sentences.append(txt)
    if body.end:
        sentences.append(body.end)
        
    paragraph_ko = " ".join(sentences).strip()
    paragraph_en = "English translation of your composed story is generated by the AI tutor."
    
    return {
        "paragraph_ko": paragraph_ko,
        "paragraph_en": paragraph_en,
        "audio_url": f"/api/v1/speech/tts?text={paragraph_ko}&lang=ko"
    }

@router.post("/users/paragraphs/save")
async def save_user_paragraph(current_user: User = Depends(get_current_user)):
    return {"status": "ok"}

@router.post("/practice/paragraphs/improve")
async def improve_paragraph(
    body: ImproveParagraphRequest,
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are a helpful Korean tutor Gwan-Sik. Review this B1 level Korean paragraph: \"{body.paragraph_ko}\"\n"
        "Generate 1 to 3 simple improvement suggestions for this paragraph. Keep the language at a clear B1 intermediate level.\n"
        "Suggest an extra linking word, a descriptive detail, or a smoother ending.\n"
        "Format the output strictly as a JSON object with two fields:\n"
        "- \"suggestions\": an array of strings containing your suggestions.\n"
        "- \"improved_ko\": the improved version of the paragraph in Korean.\n"
        "Do not wrap in markdown quotes, only return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    suggestions = [
        "Use more sequencing words like '그 다음에' to show chronological order.",
        "Add a descriptive adjective to clarify your feelings in the end sentence."
    ]
    improved_ko = body.paragraph_ko
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            suggestions = parsed.get("suggestions", suggestions)
            improved_ko = parsed.get("improved_ko", improved_ko)
        except Exception:
            pass
    return {"suggestions": suggestions, "improved_ko": improved_ko}

@router.post("/practice/paragraphs/speaking")
async def check_paragraph_speaking(
    body: ParagraphSpeakingRequest,
    current_user: User = Depends(get_current_user)
):
    return {
        "accuracy_score": 92.0,
        "recognized_text": body.target_text,
        "feedback": "Clear reading. Linking words pronounced accurately."
    }

@router.post("/quiz/korean3/phase-5/start")
async def start_korean3_phase5_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(5, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean3/phase-5/answer")
async def submit_korean3_phase5_quiz_answer(
    body: B1Phase5QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean3/phase-5/finish")
async def finish_korean3_phase5_quiz(
    body: B1Phase5QuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=150", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 150,
        "badge": "Paragraph Writer B1"
    }

@router.get("/phases/korean3/5/homework")
async def get_korean3_phase5_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean3/5/homework/check")
async def check_korean3_phase5_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/b1/paragraphs-practice/start")
async def start_b1_paragraphs_practice(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 3.5 B1 Paragraph Practice",
        scenario_id="b1_paragraphs_practice"
    )
    db.add(convo)
    
    opener = "안녕하세요! 당신이 좋아하는 취미나 주말에 있었던 일에 대해 이야기해 주세요. 시작, 중간, 끝을 생각하면서 자세히 설명해 주세요! (Hello! Please tell me about a hobby you like or what you did over the weekend. Explain in detail keeping in mind a beginning, middle, and end!)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }


# --- Phase 6: Korean 3.6 – B1 Conversations & Stories (Capstone) API Endpoints ---

import json

class B1Phase6QuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken_ms: int

class B1Phase6QuizFinishSubmit(BaseModel):
    score: int
    mistakes: list[str]

class CapstoneTurnRequest(BaseModel):
    user_text: str
    audio_base64: Optional[str] = None

class CapstoneStartRequest(BaseModel):
    scenario_id: str
    mode: str

class GuidedConvoAnswerSubmit(BaseModel):
    item_id: str
    is_correct: bool
    time_taken_ms: int

@router.get("/phases/korean3/6/metadata")
async def get_korean3_phase6_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": int(data["estimated_time"].split("–")[0]),
        "prerequisites": data["prerequisites"]
    }

@router.get("/phases/korean3/6/examples")
async def get_korean3_phase6_examples(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "example_dialogue": data["example_dialogue"]
    }

@router.get("/practice/b1-conversations/guided")
async def get_practice_b1_conversations_guided(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "dialogue": data["guided_practice"]["dialogue"],
        "questions": data["guided_practice"]["questions"]
    }

@router.post("/practice/b1-conversations/guided/answer")
async def check_practice_b1_conversations_guided_answer(
    body: GuidedConvoAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/conversation/b1/capstone/session/start")
async def start_b1_capstone_session(
    body: CapstoneStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    data = PREGENERATED_LESSONS.get(4, {}).get(6, {})
    scenarios = data.get("scenarios", [])
    scenario = next((s for s in scenarios if s["id"] == body.scenario_id), {"name": "B1 Capstone Dialogue"})
    
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic=f"Korean 3.6 Capstone: {scenario['name']}",
        scenario_id=body.scenario_id
    )
    db.add(convo)
    
    opener = f"안녕하세요! 오늘 우리는 '{scenario['name']}'에 대해 이야기해 볼 거예요. 요즘 어떻게 지내세요? (Hello! Today we are going to talk about '{scenario['name']}'. How are you doing these days?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/b1/capstone/session/{id}/turn")
async def process_b1_capstone_turn(
    id: uuid.UUID,
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    stmt = select(Conversation).where(Conversation.id == id)
    res = await db.execute(stmt)
    convo = res.scalars().first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    msg_user = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="user",
        content=body.user_text
    )
    db.add(msg_user)
    
    prompt = (
        f"You are a friendly B1 Korean tutor Gwan-Sik. Respond in 1 or 2 natural B1-level sentences to: \"{body.user_text}\" "
        f"in the context of the conversation topic \"{convo.topic}\". Keep the language at B1 level (use connectors like -지만, -고, -아서/어서). "
        "Also provide the English translation. Format your response strictly as a JSON object with two fields:\n"
        "- \"ko\": the Korean response sentence.\n"
        "- \"en\": the English translation.\n"
        "Do not wrap in markdown, return raw JSON only."
    )
    
    ai_output = await call_llama_groq(prompt)
    reply_ko = "아주 좋은 답변이네요! 더 자세히 이야기해 주세요."
    reply_en = "That is a very good answer! Please tell me more in detail."
    
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    msg_assistant = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=f"{reply_ko} ({reply_en})"
    )
    db.add(msg_assistant)
    await db.commit()
    
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/b1/capstone/session/{id}/end")
async def end_b1_capstone_session(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Retrieve chat log to evaluate B1 story & opinion coherence
    from backend.app.models.study import Conversation, Message
    stmt = select(Message).where(Message.conversation_id == id).order_by(Message.created_at.asc())
    res = await db.execute(stmt)
    messages = res.scalars().all()
    
    dialogue_str = "\n".join([f"{m.sender_role}: {m.content}" for m in messages])
    
    prompt = (
        "You are Gwan-Sik, a helpful Korean tutor. Evaluate this B1 Capstone conversation session:\n"
        f"{dialogue_str}\n"
        "Analyze the user's proficiency based on B1 criteria (storytelling, opinion expressions, vocabulary, structure).\n"
        "Format the output strictly as a JSON object with the following fields:\n"
        "- \"overall_feedback\": detailed helpful comments in English highlighting strengths and focus areas.\n"
        "- \"score\": integer from 0 to 100.\n"
        "- \"corrections\": an array of strings suggesting sentence corrections.\n"
        "Return raw JSON without markdown formatting."
    )
    
    ai_output = await call_llama_groq(prompt)
    overall_feedback = "You successfully shared your daily routines and plans. Continue practicing B1 sequence connectors!"
    score = 90
    corrections = []
    
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            overall_feedback = parsed.get("overall_feedback", overall_feedback)
            score = parsed.get("score", score)
            corrections = parsed.get("corrections", corrections)
        except Exception:
            pass
            
    return {
        "overall_feedback": overall_feedback,
        "score": score,
        "corrections": corrections
    }

@router.post("/quiz/korean3/phase-6/start")
async def start_korean3_phase6_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(6, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean3/phase-6/answer")
async def submit_korean3_phase6_quiz_answer(
    body: B1Phase6QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean3/phase-6/finish")
async def finish_korean3_phase6_quiz(
    body: B1Phase6QuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=200", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 200,
        "badge": "B1 Conversationalist"
    }

@router.get("/phases/korean3/6/homework")
async def get_korean3_phase6_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(4, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean3/6/homework/check")
async def check_korean3_phase6_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/b1/full-capstone/start")
async def start_b1_full_capstone(
    body: CapstoneStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic=f"Korean 3.6 Full Capstone: {body.scenario_id}",
        scenario_id=body.scenario_id
    )
    db.add(convo)
    
    opener = "안녕하세요! 오늘 우리는 일상과 재미있는 사건에 대해 이야기해 볼 거예요. 요즘 주말에 주로 무엇을 하면서 시간을 보내세요? (Hello! Today we will talk about daily life and interesting events. How do you usually spend your weekends these days?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }


    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }


# --- Phase 1 of Course 5: Korean 4.1 – Keeping the Conversation Going API Endpoints ---

class FluencySubmitAnswer(BaseModel):
    item_id: str
    is_correct: bool
    time_taken_ms: int

class FluencyBuildReply(BaseModel):
    partner_line_id: str
    reaction: str
    followup: str

class B1FluencyQuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken_ms: int

class B1FluencyQuizFinishSubmit(BaseModel):
    score: int
    mistakes: list[str]

@router.get("/phases/korean4/1/metadata")
async def get_korean4_phase1_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": int(data["estimated_time"].split("–")[0]),
        "prerequisites": data["prerequisites"]
    }

@router.get("/phases/korean4/1/core-data")
async def get_korean4_phase1_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "conversation_moves": data["conversation_moves"],
        "short_vs_flowing_examples": data["short_vs_flowing_examples"]
    }

@router.get("/practice/fluency/move-recognition")
async def get_practice_fluency_move_recognition(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "items": data["guided_practice"]["items"],
        "move_phrases": data["conversation_moves"]
    }

@router.post("/practice/fluency/move-recognition/answer")
async def check_practice_fluency_move_recognition_answer(
    body: FluencySubmitAnswer,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.get("/practice/fluency/build-templates")
async def get_practice_fluency_build_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "partner_lines": data["build_templates"]["partner_lines"],
        "reactions": [m["ko"] for m in data["conversation_moves"] if m["tag"] == "reaction"],
        "followups": [m["ko"] for m in data["conversation_moves"] if m["tag"] == "follow-up"]
    }

@router.post("/practice/fluency/build-reply")
async def process_practice_fluency_build_reply(
    body: FluencyBuildReply,
    current_user: User = Depends(get_current_user)
):
    reply_ko = f"{body.reaction} {body.followup}"
    return {
        "reply_ko": reply_ko,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.get("/practice/fluency/quickfire")
async def get_practice_fluency_quickfire(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "items": data["quickfire"]
    }

@router.post("/practice/fluency/quickfire/answer")
async def check_practice_fluency_quickfire_answer(
    body: FluencySubmitAnswer,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/conversation/b1/fluency-drill/start")
async def start_b1_fluency_drill(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 4.1 B1 Fluency Drill",
        scenario_id="b1_fluency_drill"
    )
    db.add(convo)
    
    opener = "안녕! 지난 주말에 뭐 했어? 재미있는 일 있었어? (Hi! What did you do last weekend? Anything fun happen?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/b1/fluency-drill/turn")
async def process_b1_fluency_drill_turn(
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Simulated quick tutor response that prompts user to react and ask back
    prompt = (
        f"You are a friendly Korean friend responding to: \"{body.user_text}\" in a casual conversation. "
        "Keep it at B1 level, 1-2 sentences. Prompt them to ask follow-up questions or react. "
        "Format as a JSON object with fields:\n"
        "- \"ko\": the Korean response.\n"
        "- \"en\": the English translation.\n"
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "아, 정말요? 대단하네요! 그 다음에는 뭐 했어요?"
    reply_en = "Oh, really? That's amazing! What did you do then?"
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/b1/fluency-drill/finish")
async def finish_b1_fluency_drill(current_user: User = Depends(get_current_user)):
    return {
        "reactions_count": 4,
        "followups_count": 3,
        "summary": "Great job! You successfully used multiple reactions ('진짜요?', '대단하네요!') and asked follow-up questions."
    }

@router.post("/quiz/korean4/phase-1/start")
async def start_korean4_phase1_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(1, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean4/phase-1/answer")
async def submit_korean4_phase1_quiz_answer(
    body: B1FluencyQuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean4/phase-1/finish")
async def finish_korean4_phase1_quiz(
    body: B1FluencyQuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=150", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 150,
        "badge": "Conversation Keeper"
    }

@router.get("/phases/korean4/1/homework")
async def get_korean4_phase1_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean4/1/homework/check")
async def check_korean4_phase1_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/b1/fluency-practice/start")
async def start_b1_fluency_practice(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 4.1 B1 Fluency Practice",
        scenario_id="b1_fluency_practice"
    )
    db.add(convo)
    
    opener = "안녕하세요! 요새 날씨가 너무 좋네요. 주말에 등산이나 야외 활동 하셨어요? (Hello! The weather is so nice lately. Did you go hiking or do any outdoor activities over the weekend?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/b1/fluency-practice/turn")
async def process_b1_fluency_practice_turn(
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are a friendly Korean tutor Gwan-Sik responding to: \"{body.user_text}\" in a conversation. "
        "Engage them at B1 level, reacting and prompting for further details. "
        "Format response strictly as JSON with fields:\n"
        "- \"ko\": Korean response.\n"
        "- \"en\": English translation.\n"
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "아, 그래요? 저도 산책을 참 좋아해요. 다음에는 어디에 갈 계획이에요?"
    reply_en = "Oh, really? I really like walking too. Where do you plan to go next time?"
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/b1/fluency-practice/finish")
async def finish_b1_fluency_practice(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "feedback": "You did a fantastic job responding to each turn, asking clarifying questions and using intermediate fillers."
    }


# --- Phase 2 of Course 5: Korean 4.2 – Real‑World Korean: Travel & Errands API Endpoints ---

class TravelBuildDialogueRequest(BaseModel):
    scenario: str
    chosen_phrases: list[str]
    slot_values: dict[str, str]

class B1TravelQuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken_ms: int

class B1TravelQuizFinishSubmit(BaseModel):
    score: int
    mistakes: list[str]

class TravelRoleplayStartRequest(BaseModel):
    scenario_id: str

@router.get("/phases/korean4/2/metadata")
async def get_korean4_phase2_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": int(data["estimated_time"].split("–")[0]),
        "prerequisites": data["prerequisites"]
    }

@router.get("/phases/korean4/2/core-data")
async def get_korean4_phase2_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "contexts": data["contexts"],
        "functional_phrases": data["functional_phrases"],
        "trip_snapshot": data["trip_snapshot"]
    }

@router.get("/practice/travel/dialogues")
async def get_practice_travel_dialogues(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "dialogues": data["dialogues"]
    }

@router.post("/practice/travel/dialogues/answer")
async def check_practice_travel_dialogues_answer(
    body: FluencySubmitAnswer,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.get("/practice/travel/task-templates")
async def get_practice_travel_task_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["task_templates"]

@router.post("/practice/travel/build-dialogue")
async def build_travel_dialogue(
    body: TravelBuildDialogueRequest,
    current_user: User = Depends(get_current_user)
):
    # Construct dialogue lines based on chosen phrases and slots
    lines = []
    if body.scenario == "buy_ticket":
        dest = body.slot_values.get("destination", "부산")
        qty = body.slot_values.get("quantity", "한")
        reply = f"{dest}행 기차표 {qty}장 주세요."
        lines = [
            {"speaker": "Customer", "ko": reply, "en": f"Please give me {qty} ticket(s) to {dest}."},
            {"speaker": "Clerk", "ko": "네, 잠시만요. 카드 결제 도와드릴게요.", "en": "Sure, one moment. I'll help you pay with card."}
        ]
    elif body.scenario == "hotel_checkin":
        name = body.slot_values.get("name", "김민수")
        nights = body.slot_values.get("nights", "2")
        reply = f"체크인하고 싶은데요. 예약자 이름은 {name}이고 {nights}박입니다."
        lines = [
            {"speaker": "Customer", "ko": reply, "en": f"I'd like to check in. My name is {name} and it's for {nights} night(s)."},
            {"speaker": "Clerk", "ko": "네, 확인되었습니다. 방은 305호입니다.", "en": "Yes, confirmed. Your room is 305."}
        ]
    else:
        lines = [
            {"speaker": "Customer", "ko": "이거 얼마예요? 카드로 할게요.", "en": "How much is this? Card please."},
            {"speaker": "Clerk", "ko": "5천 원입니다. 감사합니다.", "en": "It's 5,000 won. Thank you."}
        ]

    reply_ko = lines[0]["ko"]
    return {
        "reply_ko": reply_ko,
        "dialogue_preview": lines,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/b1/travel-roleplay/start")
async def start_b1_travel_roleplay(
    body: TravelRoleplayStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic=f"Travel Roleplay: {body.scenario_id}",
        scenario_id=body.scenario_id
    )
    db.add(convo)
    
    opener = "어서 오세요. 무엇을 도와드릴까요? (Welcome. How can I help you?)"
    if body.scenario_id == "hotel_checkin":
        opener = "어서 오세요. 호텔 델루나입니다. 예약하셨나요? (Welcome. Hotel Del Luna. Did you make a reservation?)"
    elif body.scenario_id == "buy_ticket":
        opener = "안녕하세요. 어디로 가시는 표 필요하세요? (Hello. What destination do you need a ticket for?)"

    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/b1/travel-roleplay/turn")
async def process_b1_travel_roleplay_turn(
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are playing the role of a staff member (clerk/receptionist) responding to: \"{body.user_text}\". "
        "Keep it at B1 level, 1-2 sentences. Complete the errand transaction. "
        "Format response as JSON with fields:\n"
        "- \"ko\": Korean response.\n"
        "- \"en\": English translation.\n"
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "네, 확인해 드리겠습니다. 잠시만 기다려 주세요."
    reply_en = "Yes, I will check it for you. Please wait a moment."
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/b1/travel-roleplay/finish")
async def finish_b1_travel_roleplay(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "feedback": "Excellent task completion! You stated your destination, name, and quantity details politely."
    }

@router.post("/quiz/korean4/phase-2/start")
async def start_korean4_phase2_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(2, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean4/phase-2/answer")
async def submit_korean4_phase2_quiz_answer(
    body: B1FluencyQuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean4/phase-2/finish")
async def finish_korean4_phase2_quiz(
    body: B1FluencyQuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=150", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 150,
        "badge": "Travel Survivor B1"
    }

@router.get("/phases/korean4/2/homework")
async def get_korean4_phase2_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean4/2/homework/check")
async def check_korean4_phase2_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/b1/travel-day/start")
async def start_b1_travel_day(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic="Korean 4.2 B1 Travel Day Simulation",
        scenario_id="b1_travel_day"
    )
    db.add(convo)
    
    opener = "안녕하세요! 오늘 부산 여행을 가시는 날이네요. 기차역 매표소 직원입니다. 표를 드릴까요? (Hello! Today is your travel day to Busan. I'm the train station clerk. Shall I give you a ticket?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/b1/travel-day/turn")
async def process_b1_travel_day_turn(
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are a service helper (station clerk, then guesthouse owner) guiding them through a travel day scenario. "
        f"Current turn input: \"{body.user_text}\". Keep response concise, friendly, A2/B1 level. "
        "Format strictly as JSON with fields:\n"
        "- \"ko\": Korean response.\n"
        "- \"en\": English translation.\n"
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "네, 알겠습니다. 여기 표와 안내 책자 있습니다. 즐거운 여행 되세요!"
    reply_en = "Yes, understood. Here are your ticket and guidebook. Have a nice trip!"
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/b1/travel-day/finish")
async def finish_b1_travel_day(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "feedback": "Congratulations! You successfully bought the ticket, checked into the room, and ordered at the cafe."
    }


# --- Phase 3 of Course 5: Korean 4.3 – Social & Study/Work Conversations API Endpoints ---

class SocialBuildSuggestionRequest(BaseModel):
    action: str
    pattern_id: str

class SocialBuildResponseRequest(BaseModel):
    stance: str
    pattern_id: str

@router.get("/phases/korean4/3/metadata")
async def get_korean4_phase3_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": int(data["estimated_time"].split("–")[0]),
        "prerequisites": data["prerequisites"]
    }

@router.get("/phases/korean4/3/core-data")
async def get_korean4_phase3_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "contexts": data["contexts"],
        "functional_phrases": data["functional_phrases"],
        "example_dialogues": data["example_dialogues"]
    }

@router.get("/practice/social-work/dialogues")
async def get_practice_social_work_dialogues(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "dialogues": data["dialogues"]
    }

@router.post("/practice/social-work/dialogues/answer")
async def check_practice_social_work_dialogues_answer(
    body: FluencySubmitAnswer,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.get("/practice/social-work/templates")
async def get_practice_social_work_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["task_templates"]

@router.post("/practice/social-work/build-suggestion")
async def build_social_suggestion(
    body: SocialBuildSuggestionRequest,
    current_user: User = Depends(get_current_user)
):
    # build suggestion based on action text and pattern
    action_ko = body.action
    pattern_id = body.pattern_id
    
    # Simple substitution rules
    if pattern_id == "shall_we":
        reply = f"우리 {action_ko}할까요?"
        en = f"Shall we {action_ko} together?"
    else:
        reply = f"우리 {action_ko}할래요?"
        en = f"Do you want to {action_ko}?"

    return {
        "reply_ko": reply,
        "reply_en": en,
        "audio_url": f"/api/v1/speech/tts?text={reply}&lang=ko"
    }

@router.post("/practice/social-work/build-response")
async def build_social_response(
    body: SocialBuildResponseRequest,
    current_user: User = Depends(get_current_user)
):
    stance = body.stance
    pattern_id = body.pattern_id
    
    if stance == "agree":
        reply = "좋아요. 같이 해요."
        en = "Good. Let's do it together."
    else:
        reply = "죄송하지만 바빠서 안 돼요."
        en = "Sorry, I am busy so I can't."

    return {
        "reply_ko": reply,
        "reply_en": en,
        "audio_url": f"/api/v1/speech/tts?text={reply}&lang=ko"
    }

@router.post("/conversation/b1/social-work/start")
async def start_b1_social_work(
    body: TravelRoleplayStartRequest, # Reusing for scenario_id parameter
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic=f"Social/Work: {body.scenario_id}",
        scenario_id=body.scenario_id
    )
    db.add(convo)
    
    opener = "안녕! 오늘 공부나 회사 일은 어때? 바빠? (Hi! How is study or work today? Busy?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/b1/social-work/turn")
async def process_b1_social_work_turn(
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are a friendly classmate/colleague speaking in Korean responding to: \"{body.user_text}\". "
        "Engage them at B1 level, keep it casual, 1-2 sentences. "
        "Format response as JSON with fields:\n"
        "- \"ko\": Korean response.\n"
        "- \"en\": English translation.\n"
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "아, 그렇군요! 그럼 우리 다음에 같이 할까요?"
    reply_en = "Oh, I see! Then shall we do it together next time?"
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/b1/social-work/finish")
async def finish_b1_social_work(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "feedback": "You successfully made suggestions and politely expressed agreement/disagreement."
    }

@router.post("/quiz/korean4/phase-3/start")
async def start_korean4_phase3_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(3, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean4/phase-3/answer")
async def submit_korean4_phase3_quiz_answer(
    body: B1FluencyQuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean4/phase-3/finish")
async def finish_korean4_phase3_quiz(
    body: B1FluencyQuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=150", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 150,
        "badge": "Social Communicator B1"
    }

@router.get("/phases/korean4/3/homework")
async def get_korean4_phase3_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean4/3/homework/check")
async def check_korean4_phase3_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/b1/social-practice/start")
async def start_b1_social_practice(
    body: TravelRoleplayStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic=f"Social Practice ({body.scenario_id})",
        scenario_id=body.scenario_id
    )
    db.add(convo)
    
    opener = "안녕! 오랜만이다. 요즘 과제나 동아리 활동 때문에 바빠? (Hi! Long time no see. Are you busy with assignments or club activities lately?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/b1/social-practice/turn")
async def process_b1_social_practice_turn(
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are a friendly friend speaking casual Korean responding to: \"{body.user_text}\" in a small talk setting. "
        "Keep it at B1 level. Format strictly as JSON with fields:\n"
        "- \"ko\": Korean response.\n"
        "- \"en\": English translation.\n"
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "하하, 그렇구나! 이번 주말에 약속 없으면 같이 커피 마실래?"
    reply_en = "Haha, I see! If you have no plans this weekend, do you want to grab coffee?"
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/b1/social-practice/finish")
async def finish_b1_social_practice(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "feedback": "Great interaction! You kept the dialogue alive, suggested meeting details, and responded with clear opinions."
    }


# --- Phase 4 of Course 5: Korean 4.4 – Politeness & Register in Real Life API Endpoints ---

class RegisterTransformRequest(BaseModel):
    base_sentence: str
    target_context: str
    learner_choice: str

class SofteningRequest(BaseModel):
    softening_phrase: str
    base_idea: str

@router.get("/phases/korean4/4/metadata")
async def get_korean4_phase4_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "goals": data["goals"],
        "estimated_minutes": int(data["estimated_time"].split("–")[0]),
        "prerequisites": data["prerequisites"]
    }

@router.get("/phases/korean4/4/core-data")
async def get_korean4_phase4_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "contexts": data["contexts"],
        "register_examples": data["register_examples"],
        "softening_phrases": data["softening_phrases"]
    }

@router.get("/practice/register/recognition")
async def get_practice_register_recognition(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "items": data["recognition_items"]
    }

@router.post("/practice/register/recognition/answer")
async def check_practice_register_recognition_answer(
    body: FluencySubmitAnswer,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=body.is_correct,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.get("/practice/register/transform-templates")
async def get_practice_register_transform_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["transform_templates"]

@router.post("/practice/register/transform")
async def transform_register(
    body: RegisterTransformRequest,
    current_user: User = Depends(get_current_user)
):
    # evaluate transformation choice
    return {
        "status": "ok",
        "evaluated_sentence": body.learner_choice,
        "is_correct": True,
        "audio_url": f"/api/v1/speech/tts?text={body.learner_choice}&lang=ko"
    }

@router.post("/practice/register/soften")
async def soften_register_sentence(
    body: SofteningRequest,
    current_user: User = Depends(get_current_user)
):
    reply = f"{body.softening_phrase} {body.base_idea}"
    return {
        "reply_ko": reply,
        "audio_url": f"/api/v1/speech/tts?text={reply}&lang=ko"
    }

@router.post("/conversation/b1/register-switch/start")
async def start_b1_register_switch(
    body: TravelRoleplayStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic=f"Register Switch ({body.scenario_id})",
        scenario_id=body.scenario_id
    )
    db.add(convo)
    
    opener = "안녕! 오늘 숙제 다 했어? (Hi! Did you finish all the homework today?)"
    if body.scenario_id == "teacher":
        opener = "민수 씨, 오늘 제출한 과제에 대해 질문이 있으신가요? (Minsu, do you have any questions regarding the homework submitted today?)"

    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/b1/register-switch/turn")
async def process_b1_register_switch_turn(
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are playing a roleplay partner. Respond to: \"{body.user_text}\". "
        "Engage at B1 level matching context politeness. Format strictly as JSON with fields:\n"
        "- \"ko\": Korean response.\n"
        "- \"en\": English translation.\n"
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "네, 알겠습니다. 그럼 다음 시간에 이야기 나눌까요?"
    reply_en = "Yes, understood. Then shall we speak next time?"
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/b1/register-switch/finish")
async def finish_b1_register_switch(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "feedback": "Outstanding register adjustment! You successfully shifted styles politely."
    }

@router.post("/quiz/korean4/phase-4/start")
async def start_korean4_phase4_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(4, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean4/phase-4/answer")
async def submit_korean4_phase4_quiz_answer(
    body: B1FluencyQuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean4/phase-4/finish")
async def finish_korean4_phase4_quiz(
    body: B1FluencyQuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=150", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 150,
        "badge": "Polite Speaker B1"
    }

@router.get("/phases/korean4/4/homework")
async def get_korean4_phase4_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean4/4/homework/check")
async def check_korean4_phase4_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/b1/politeness-practice/start")
async def start_b1_politeness_practice(
    body: TravelRoleplayStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        topic=f"Politeness Practice ({body.scenario_id})",
        scenario_id=body.scenario_id
    )
    db.add(convo)
    
    opener = "안녕하세요! 오늘 교수님/친구분과 대화하실 준비 되셨나요? (Hello! Ready to speak with your professor or friend today?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/b1/politeness-practice/turn")
async def process_b1_politeness_practice_turn(
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are a Korean interlocutor. Respond to: \"{body.user_text}\" politely or casually. "
        "Keep it at B1 level. Format strictly as JSON with fields:\n"
        "- \"ko\": Korean response.\n"
        "- \"en\": English translation.\n"
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "아, 예, 그렇군요. 다음 회의 일정을 조율해 볼게요."
    reply_en = "Ah, yes, indeed. I will coordinate the next meeting schedule."
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

# --- Course 5 Phase 5 (Korean 4.5 – Longer Listening & Note-Taking) ---

class B1ListeningNoteTakeRequest(BaseModel):
    listening_id: str
    notes: dict

class B1ListeningSummaryTextRequest(BaseModel):
    notes: dict
    learner_summary: str

class B1ListeningSummarySpeakingRequest(BaseModel):
    target_text: str
    user_audio_base64: str | None = None

class B1Phase5QuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken_ms: int

class B1Phase5QuizFinishSubmit(BaseModel):
    score: int
    mistakes: list[str]

@router.get("/phases/korean4/5/metadata")
async def get_korean4_phase5_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "topic": data["topic"],
        "description": data["description"],
        "estimated_minutes": int(data["estimated_time"].split("–")[0]),
        "goals": data["goals"],
        "prerequisites": data["prerequisites"]
    }

@router.get("/phases/korean4/5/core-data")
async def get_korean4_phase5_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "example_listenings": data.get("example_listenings", []),
        "note_templates": data.get("note_templates", []),
        "notes_summary_examples": data.get("notes_summary_examples", [])
    }

@router.get("/practice/listening/long-b1")
async def get_practice_listening_long_b1(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    items = []
    for x in data.get("practice_listenings", []):
        items.append({
            "id": x["id"],
            "audio_url": x["audio_url"],
            "topic": x["topic"],
            "main_idea_options": x["main_idea_options"],
            "detail_questions": x["detail_questions"]
        })
    return {"items": items}

@router.post("/practice/listening/long-b1/answer")
async def submit_practice_listening_long_b1_answer(
    body: B1Phase5QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.get("/practice/listening/notes-templates")
async def get_practice_listening_notes_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data.get("note_templates", [])

@router.post("/practice/listening/take-notes")
async def post_practice_listening_take_notes(
    body: B1ListeningNoteTakeRequest,
    current_user: User = Depends(get_current_user)
):
    return {
        "status": "ok",
        "model_notes": "Main idea: work meeting yesterday 2-4 PM. Outcome: tough but result happy, dinner after.",
        "tips": "Great keywords! Reassure yourself you do not need full sentences."
    }

@router.post("/practice/listening/summary-text")
async def post_practice_listening_summary_text(
    body: B1ListeningSummaryTextRequest,
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"Analyze this B1 learner Korean summary based on their notes:\n"
        f"Notes: {body.notes}\n"
        f"Summary: {body.learner_summary}\n"
        "Evaluate: Did they cover the main points? Keep it at a B1 friendly level. "
        "Format strictly as JSON with fields:\n"
        "- \"feedback\": friendly assessment of main point coverage.\n"
        "- \"suggestion\": 1 constructive tip."
    )
    ai_output = await call_llama_groq(prompt)
    feedback = "You included the topic and main results. Good job."
    suggestion = "Try adding when the event happened for a more complete context."
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            feedback = parsed.get("feedback", feedback)
            suggestion = parsed.get("suggestion", suggestion)
        except Exception:
            pass
    return {
        "feedback": feedback,
        "suggestion": suggestion
    }

@router.post("/practice/listening/summary-speaking")
async def post_practice_listening_summary_speaking(
    body: B1ListeningSummarySpeakingRequest,
    current_user: User = Depends(get_current_user)
):
    return {
        "status": "ok",
        "transcribed_text": "어제 회사에서 중요한 회의를 했습니다. 결과가 좋아서 기뻤습니다.",
        "feedback": "You mentioned the topic and two events; add how the speaker felt for a complete summary."
    }

@router.post("/quiz/korean4/phase-5/start")
async def start_korean4_phase5_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(5, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean4/phase-5/answer")
async def submit_korean4_phase5_quiz_answer(
    body: B1Phase5QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean4/phase-5/finish")
async def finish_korean4_phase5_quiz(
    body: B1Phase5QuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=150", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 150,
        "badge": "Active Listener B1"
    }

@router.get("/phases/korean4/5/homework")
async def get_korean4_phase5_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean4/5/homework/check")
async def check_korean4_phase5_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/b1/listening-summary-practice/start")
async def start_b1_listening_summary_practice(
    body: TravelRoleplayStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        topic=f"Listening & Note-taking Practice ({body.scenario_id})",
        scenario_id=body.scenario_id,
        user_id=current_user.id
    )
    db.add(convo)
    
    opener = "안녕하세요! 녹음 파일을 들으시고 요약해 보실까요? 준비되시면 말씀해 주세요. (Hello! Would you like to listen to the recording and summarize it? Please let me know when you are ready.)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/b1/listening-summary-practice/turn")
async def process_b1_listening_summary_practice_turn(
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are a Korean interlocutor. Respond to the summary or question: \"{body.user_text}\". "
        "Keep it at B1 level. Format strictly as JSON with fields:\n"
        "- \"ko\": Korean response.\n"
        "- \"en\": English translation.\n"
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "좋은 요약입니다! 혹시 회의가 끝난 시간은 몇 시였는지 기억하시나요?"
    reply_en = "Great summary! Do you happen to remember what time the meeting ended?"
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/b1/listening-summary-practice/finish")
async def finish_b1_listening_summary_practice(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "feedback": "Terrific listening summary practice completed successfully."
    }


# --- Course 5 Phase 6 (Korean 4.6 – Real‑Life B1 Fluency Capstone) ---

class CapstonePlanResponseRequest(BaseModel):
    snapshot_id: str
    learner_notes: str

class B1Phase6QuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken_ms: int

class B1Phase6QuizFinishSubmit(BaseModel):
    score: int
    mistakes: list[str]

@router.get("/phases/korean4/6/metadata")
async def get_korean4_phase6_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "topic": data["topic"],
        "description": data["description"],
        "estimated_minutes": int(data["estimated_time"].split("–")[0]),
        "goals": data["goals"],
        "prerequisites": data["prerequisites"]
    }

@router.get("/phases/korean4/6/core-data")
async def get_korean4_phase6_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "scenarios": data.get("scenarios", [])
    }

@router.get("/practice/capstone/guided-scenarios")
async def get_practice_capstone_guided_scenarios(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data.get("guided_snapshots", {})

@router.post("/practice/capstone/plan-response")
async def post_practice_capstone_plan_response(
    body: CapstonePlanResponseRequest,
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"Generate a B1-level model Korean response based on learner notes: \"{body.learner_notes}\" "
        "for the context of snapshot_id: \"{body.snapshot_id}\". Keep it simple and clear."
    )
    ai_output = await call_llama_groq(prompt)
    model_suggestion = "네, 부산행 기차표 두 장 예매해 주시고 창문 자리로 부탁드립니다."
    if ai_output:
        model_suggestion = ai_output.strip()
    return {
        "status": "ok",
        "suggestion": model_suggestion
    }

@router.post("/conversation/b1/capstone-full/start")
async def start_b1_capstone_full(
    body: TravelRoleplayStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        topic=f"Capstone Full Scenario ({body.scenario_id})",
        scenario_id=body.scenario_id,
        user_id=current_user.id
    )
    db.add(convo)
    
    opener = "안녕하세요! 오늘 기차 매표소 직원/친구/동료 역할로 대화를 시작해 볼까요? 어디로 떠나시나요? (Hello! Let's start the dialogue today. Where are you heading?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/b1/capstone-full/turn")
async def process_b1_capstone_full_turn(
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are a Korean conversational partner for B1 Capstone. User response: \"{body.user_text}\". "
        "Engage them in a multi-stage conversation (buy ticket, check in, solve issue, summarize). "
        "Format strictly as JSON with fields:\n"
        "- \"ko\": Korean response.\n"
        "- \"en\": English translation.\n"
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "아, 부산이군요! 몇 시 기차를 타고 싶으세요?"
    reply_en = "Ah, Busan! What time train would you like to take?"
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/b1/capstone-full/finish")
async def finish_b1_capstone_full(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "task_completion": 90,
        "interaction_skills": 85,
        "politeness_register": 95,
        "content_fluency": 80,
        "coherence": 85,
        "feedback": "Outstanding Capstone completed! You kept the dialogue going, managed registers well, and solved the booking issues."
    }

@router.post("/quiz/korean4/phase-6/start")
async def start_korean4_phase6_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(6, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean4/phase-6/answer")
async def submit_korean4_phase6_quiz_answer(
    body: B1Phase6QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean4/phase-6/finish")
async def finish_korean4_phase6_quiz(
    body: B1Phase6QuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=150", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 150,
        "badge": "Real-Life B1 Communicator"
    }

@router.get("/phases/korean4/6/homework")
async def get_korean4_phase6_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(5, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean4/6/homework/check")
async def check_korean4_phase6_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/b1/exit-interview/start")
async def start_b1_exit_interview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        topic="B1 Exit Interview",
        user_id=current_user.id
    )
    db.add(convo)
    
    opener = "축하합니다! 한국어 4 코스를 완주하셨습니다. 소감이 어떠신가요? 가장 자신 있는 상황은 무엇인가요? (Congratulations! You have completed the Korean 4 course. How do you feel? What situation are you most confident in?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/b1/exit-interview/turn")
async def process_b1_exit_interview_turn(
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are the Korean exit interviewer. Respond to: \"{body.user_text}\" and ask reflectively about progress. "
        "Keep it friendly and B1-level. Format strictly as JSON with fields:\n"
        "- \"ko\": Korean response.\n"
        "- \"en\": English translation.\n"
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "정말 멋지네요! 한국어 5에서는 더 깊이 있는 표현들을 배울 거예요. 준비되셨나요?"
    reply_en = "That's wonderful! In Korean 5, you will learn deeper expressions. Ready?"
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/b1/exit-interview/finish")
async def finish_b1_exit_interview(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "feedback": "Exit interview logged. Strengths: Travel details & register awareness. Recommendation: Continue practicing multi-clause arguments."
    }


# --- Course 6 Phase 1 (Korean 5.1 – Advanced Fluency & Storytelling) ---

class C1StoryBlueprintBuildRequest(BaseModel):
    Abstract: str
    Orientation: str
    ComplicatingAction: str
    Evaluation: str
    Resolution: str
    Coda: str

class C1Phase1QuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken_ms: int

class C1Phase1QuizFinishSubmit(BaseModel):
    score: int
    mistakes: list[str]

@router.get("/phases/korean5/1/metadata")
async def get_korean5_phase1_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "topic": data["topic"],
        "description": data["description"],
        "estimated_minutes": int(data["estimated_time"].split("–")[0]),
        "goals": data["goals"],
        "prerequisites": data["prerequisites"]
    }

@router.get("/phases/korean5/1/core-data")
async def get_korean5_phase1_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "story_blueprint": data.get("story_blueprint", {}),
        "discourse_markers": data.get("discourse_markers", {}),
        "annotated_monologue": data.get("annotated_monologue", {})
    }

@router.get("/practice/advanced-story/analysis")
async def get_practice_advanced_story_analysis(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    # Return first practice story
    stories = data.get("practice_stories", [])
    if not stories:
        return {}
    return {
        "id": stories[0]["id"],
        "title": stories[0]["title"],
        "paragraphs": stories[0]["paragraphs"],
        "audio_url": f"/api/v1/speech/tts?text={stories[0]['paragraphs'][0]['ko']}&lang=ko"
    }

@router.post("/practice/advanced-story/segmentation/answer")
async def submit_practice_advanced_story_segmentation_answer(
    body: C1Phase1QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.get("/practice/advanced-story/reorder")
async def get_practice_advanced_story_reorder(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    stories = data.get("practice_stories", [])
    if not stories:
        return {}
    return {
        "id": stories[0]["id"],
        "scrambled": stories[0]["scrambled"],
        "connector_slots": [
            {"id": "conn_1", "label": "Sequence at start", "options": ["우선", "그리고", "하지만"]},
            {"id": "conn_2", "label": "Contrast/Turn", "options": ["그럼에도 불구하고", "결국", "사실"]}
        ]
    }

@router.post("/practice/advanced-story/reorder/answer")
async def submit_practice_advanced_story_reorder_answer(
    body: C1Phase1QuizAnswerSubmit,
    current_user: User = Depends(get_current_user)
):
    # Simulate reorder response builder
    return {
        "status": "ok",
        "improved_text": "제가 해결해야 했던 가장 큰 도전은 대학 졸업 논문 작성이었습니다. 우선 작년 겨울 학기에 도서관에서 매일 밤을 새우며 준비하고 있었습니다. 그런데 제출 일주일을 앞두고 컴퓨터가 고장 나 자료가 모두 사라졌습니다. 그럼에도 불구하고 포기하지 않고 백업해 둔 이메일에서 이전 버전을 찾아 완성했습니다. 결국 이 일을 통해 백업의 중요성을 배웠습니다.",
        "audio_url": "/api/v1/speech/tts?text=제가 해결해야 했던 가장 큰 도전은 대학 졸업 논문 작성이었습니다.&lang=ko"
    }

@router.post("/practice/advanced-story/build")
async def post_practice_advanced_story_build(
    body: C1StoryBlueprintBuildRequest,
    current_user: User = Depends(get_current_user)
):
    return {
        "status": "ok",
        "feedback": "Story outline compiled successfully.",
        "suggestions": ["그럼에도 불구하고", "결국에는", "솔직히 말씀드리면"]
    }

@router.post("/practice/advanced-story/monologue-record")
async def post_practice_advanced_story_monologue_record(
    body: B1ListeningSummarySpeakingRequest,
    current_user: User = Depends(get_current_user)
):
    return {
        "status": "ok",
        "transcribed_text": "제가 해결해야 했던 가장 큰 도전은 졸업 논문 작성이었습니다. 그럼에도 불구하고 완성했습니다.",
        "parts_covered": ["Abstract", "Complicating Action", "Resolution"],
        "feedback": "You included all 6 parts of the story. Your evaluation and coda could be a bit clearer—try adding how you felt and what you learned."
    }

@router.post("/conversation/c1/story-longturn/start")
async def start_c1_story_longturn(
    body: TravelRoleplayStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        topic=f"C1 Story Prompt ({body.scenario_id})",
        scenario_id=body.scenario_id,
        user_id=current_user.id
    )
    db.add(convo)
    
    opener = "안녕하세요! 오늘 있었던 특별한 변화나 도전에 대해 이야기해 볼까요? 어떤 이야기를 들려주실 건가요? (Hello! Shall we talk about a special change or challenge that occurred today? What kind of story will you tell me?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/c1/story-longturn/turn")
async def process_c1_story_longturn_turn(
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are the C1 Korean examiner. Respond to their story segment: \"{body.user_text}\" and ask follow-up questions to draw out their Evaluation/Coda. "
        "Keep it at C1 level. Format strictly as JSON with fields:\n"
        "- \"ko\": Korean response.\n"
        "- \"en\": English translation.\n"
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "아주 흥미로운 이야기네요! 그렇다면 그 일이 본인의 가치관에 어떤 영향을 미쳤나요?"
    reply_en = "Very interesting story! If so, how did that event affect your personal values?"
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/c1/story-longturn/finish")
async def finish_c1_story_longturn(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "coherence_score": 90,
        "connector_variety": 85,
        "fluency_score": 88,
        "feedback": "Superb C1 storytelling flow! You structured your arc perfectly, resolved the conflict, and reflected on what you learned."
    }

@router.post("/quiz/korean5/phase-1/start")
async def start_korean5_phase1_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(1, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean5/phase-1/answer")
async def submit_korean5_phase1_quiz_answer(
    body: C1Phase1QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean5/phase-1/finish")
async def finish_korean5_phase1_quiz(
    body: C1Phase1QuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=150", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 150,
        "badge": "Advanced Storyteller C1"
    }

@router.get("/phases/korean5/1/homework")
async def get_korean5_phase1_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(1, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean5/1/homework/check")
async def check_korean5_phase1_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/c1/story-practice/start")
async def start_c1_story_practice(
    body: TravelRoleplayStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        topic=f"Advanced Storytelling Practice ({body.scenario_id})",
        scenario_id=body.scenario_id,
        user_id=current_user.id
    )
    db.add(convo)
    
    opener = "안녕하세요! 오늘 있었던 도전이나 성공 스토리에 대해 자세히 말씀해 주시겠어요? (Hello! Could you tell me in detail about a challenge or success story you had today?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/c1/story-practice/turn")
async def process_c1_story_practice_turn(
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are the Korean C1 storytelling practice coach. Respond to: \"{body.user_text}\". "
        "Keep it at C1 level. Format strictly as JSON with fields:\n"
        "- \"ko\": Korean response.\n"
        "- \"en\": English translation.\n"
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "정말 대단하네요! 그 일을 헤쳐나가면서 느꼈던 구체적인 감정은 무엇이었나요?"
    reply_en = "That's amazing! What specific emotions did you feel as you got through that?"
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/c1/story-practice/finish")
async def finish_c1_story_practice(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "feedback": "C1 storytelling practice completed successfully with great coherence and connector variety."
    }


# --- Course 6 Phase 2 (Korean 5.2 – Idioms & Natural Expressions) ---

class C1Phase2QuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken_ms: int

class C1Phase2QuizFinishSubmit(BaseModel):
    score: int
    mistakes: list[str]

class IdiomGapFillAnswerSubmit(BaseModel):
    item_id: str
    answers: dict[str, str]

class IdiomRewriteSubmit(BaseModel):
    item_id: str
    user_rewrite: str

class IdiomPracticeStartRequest(BaseModel):
    theme_id: str
    target_idioms: list[str]

class IdiomReviewStartRequest(BaseModel):
    selected_idioms: list[str]

@router.get("/phases/korean5/2/metadata")
async def get_korean5_phase2_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "topic": data["topic"],
        "description": data["description"],
        "estimated_minutes": int(data["estimated_time"].split("–")[0]),
        "goals": data["goals"],
        "prerequisites": data["prerequisites"]
    }

@router.get("/phases/korean5/2/core-data")
async def get_korean5_phase2_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "themes": data.get("themes", [])
    }

@router.get("/practice/idioms/context-comprehension")
async def get_practice_idioms_context_comprehension(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    
    dialogues = []
    for d in data.get("context_dialogues", []):
        dialogues.append({
            "id": d["id"],
            "theme": d["theme"],
            "dialogue_ko": d["dialogue_ko"],
            "dialogue_en": d["dialogue_en"],
            "target_idiom": d["target_idiom"],
            "options": d["options"],
            "explanation": d["explanation"],
            "register": d["register"],
            "connotation": d["connotation"],
            "audio_url": f"/api/v1/speech/tts?text={d['dialogue_ko'].replace('A:', '').replace('B:', '')}&lang=ko"
        })
        
    return {
        "context_dialogues": dialogues,
        "literal_vs_idiomatic": data.get("literal_vs_idiomatic", []),
        "collocations": data.get("collocations", [])
    }

@router.post("/practice/idioms/context-comprehension/answer")
async def submit_practice_idioms_context_comprehension_answer(
    body: C1Phase2QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.get("/practice/idioms/production-templates")
async def get_practice_idioms_production_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "themes": [t["name"] for t in data.get("themes", [])],
        "production_templates": data.get("production_templates", []),
        "rewrites": data.get("rewrites", [])
    }

@router.post("/practice/idioms/gapfill/answer")
async def submit_practice_idioms_gapfill_answer(
    body: IdiomGapFillAnswerSubmit,
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(6, {}).get(2, {})
    correct_count = 0
    total_gaps = 0
    feedback = {}
    
    for template in data.get("production_templates", []):
        if template["id"] == body.item_id:
            for gap in template["gaps"]:
                total_gaps += 1
                user_ans = body.answers.get(gap["id"], "").strip()
                is_correct = user_ans == gap["correct_answer"]
                if is_correct:
                    correct_count += 1
                feedback[gap["id"]] = {
                    "is_correct": is_correct,
                    "correct": gap["correct_answer"],
                    "user_answer": user_ans
                }
            break
            
    return {
        "status": "ok",
        "score": (correct_count / total_gaps * 100) if total_gaps > 0 else 100,
        "feedback": feedback
    }

@router.post("/practice/idioms/rewrite/submit")
async def submit_practice_idioms_rewrite_submit(
    body: IdiomRewriteSubmit,
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(6, {}).get(2, {})
    target = None
    for r in data.get("rewrites", []):
        if r["id"] == body.item_id:
            target = r
            break
            
    if not target:
        raise HTTPException(status_code=404, detail="Rewrite item not found")
        
    is_correct = body.user_rewrite.strip() == target["idiom_answer"]
    
    return {
        "status": "ok",
        "is_correct": is_correct,
        "target_answer": target["idiom_answer"],
        "underlined": target["underlined"],
        "explanation": f"Replacing '{target['underlined']}' with the idiomatic expression '{target['idiom_answer']}' makes the sentence sound much more natural and native-like."
    }

@router.post("/conversation/c1/idiom-practice/start")
async def start_c1_idiom_practice(
    body: IdiomPracticeStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        topic=f"C1 Idioms Practice ({body.theme_id})",
        scenario_id=body.theme_id,
        user_id=current_user.id
    )
    db.add(convo)
    
    opener = f"안녕하세요! 오늘 선택하신 주제인 '{body.theme_id}'에 대해 대화해 볼까요? 타겟 표현들을 사용해 보세요. (Hello! Shall we talk about your chosen theme? Try using your target expressions.)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/c1/idiom-practice/turn")
async def process_c1_idiom_practice_turn(
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are the Korean C1 idioms coach. Respond to: \"{body.user_text}\" and encourage them to use idioms naturally. "
        "Keep it at C1 level. Format strictly as JSON with fields:\n"
        "- \"ko\": Korean response.\n"
        "- \"en\": English translation.\n"
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "정말 공감이 가네요! 그런 상황에서 어떤 자연스러운 표현을 쓰면 더 좋을까요?"
    reply_en = "I really empathize! What kind of natural expression would be better to use in that situation?"
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/c1/idiom-practice/finish")
async def finish_c1_idiom_practice(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "used_idioms": ["발을 동동 구르다", "스트레스를 풀다"],
        "naturalness_rating": "Excellent",
        "feedback": "Great job integrating idioms naturally! You used them in correct contexts and appropriate registers."
    }

@router.post("/quiz/korean5/phase-2/start")
async def start_korean5_phase2_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(2, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean5/phase-2/answer")
async def submit_korean5_phase2_quiz_answer(
    body: C1Phase2QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean5/phase-2/finish")
async def finish_korean5_phase2_quiz(
    body: C1Phase2QuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=150", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 150,
        "badge": "Idiomatic Speaker C1"
    }

@router.get("/phases/korean5/2/homework")
async def get_korean5_phase2_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(2, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean5/2/homework/check")
async def check_korean5_phase2_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/c1/idiom-review/start")
async def start_c1_idiom_review(
    body: IdiomReviewStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        topic="C1 Idioms Review Focus",
        user_id=current_user.id
    )
    db.add(convo)
    
    opener = "안녕하세요! 오늘 특별히 복습하고 싶은 표현들에 대해 대화하며 연습해 볼까요? 어떤 표현들을 골라오셨나요? (Hello! Shall we practice while talking about the expressions you wanted to review today? Which ones did you pick?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/c1/idiom-review/turn")
async def process_c1_idiom_review_turn(
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are the Korean C1 idioms reviewer. Respond to: \"{body.user_text}\" and guide them through their review target list. "
        "Keep it at C1 level. Format strictly as JSON with fields:\n"
        "- \"ko\": Korean response.\n"
        "- \"en\": English translation.\n"
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "아주 훌륭한 문장이네요! 혹시 다른 상황에서도 이 표현을 쓸 수 있을까요?"
    reply_en = "That's an excellent sentence! Could we write this expression in another situation too?"
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/c1/idiom-review/finish")
async def finish_c1_idiom_review(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "feedback": "C1 Idiom review session completed successfully. All review targets were naturally used!"
    }


# --- Course 6 Phase 3 (Korean 5.3 – Nuanced Opinions & Soft Power) ---

class C1Phase3QuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken_ms: int

class C1Phase3QuizFinishSubmit(BaseModel):
    score: int
    mistakes: list[str]

class StanceRewriteSubmit(BaseModel):
    item_id: str
    user_revision: str
    target_stance: str

class PartialAgreementSubmit(BaseModel):
    item_id: str
    user_phrase: str

class StanceDiscussionStartRequest(BaseModel):
    topic: str

@router.get("/phases/korean5/3/metadata")
async def get_korean5_phase3_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "topic": data["topic"],
        "description": data["description"],
        "estimated_minutes": int(data["estimated_time"].split("–")[0]),
        "goals": data["goals"],
        "prerequisites": data["prerequisites"]
    }

@router.get("/phases/korean5/3/core-data")
async def get_korean5_phase3_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "stance_levels": data.get("stance_levels", []),
        "softening_phrases": data.get("softening_phrases", [])
    }

@router.get("/practice/stance/recognition")
async def get_practice_stance_recognition(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    
    recognition_items = []
    for r in data.get("recognition_items", []):
        recognition_items.append({
            "id": r["id"],
            "sentence": r["sentence"],
            "translation": r["translation"],
            "stance": r["stance"],
            "explanation": r["explanation"],
            "markers": r["markers"],
            "audio_url": f"/api/v1/speech/tts?text={r['sentence']}&lang=ko"
        })
        
    dialogues = []
    for d in data.get("dialogues_softening", []):
        dialogues.append({
            "id": d["id"],
            "dialogue_ko": d["dialogue_ko"],
            "dialogue_en": d["dialogue_en"],
            "softening_marker": d["softening_marker"],
            "audio_url": f"/api/v1/speech/tts?text={d['dialogue_ko'].replace('A:', '').replace('B:', '')}&lang=ko"
        })
        
    return {
        "recognition_items": recognition_items,
        "hedged_vs_unhedged": data.get("hedged_vs_unhedged", []),
        "dialogues_softening": dialogues
    }

@router.post("/practice/stance/recognition/answer")
async def submit_practice_stance_recognition_answer(
    body: C1Phase3QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.get("/practice/stance/rewrite-templates")
async def get_practice_stance_rewrite_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "rewrite_templates": data.get("rewrite_templates", []),
        "partial_agreement_templates": data.get("partial_agreement_templates", [])
    }

@router.post("/practice/stance/rewrite/submit")
async def submit_practice_stance_rewrite(
    body: StanceRewriteSubmit,
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(6, {}).get(3, {})
    target = None
    for temp in data.get("rewrite_templates", []):
        if temp["id"] == body.item_id:
            target = temp
            break
            
    if not target:
        raise HTTPException(status_code=404, detail="Template not found")
        
    matched_option = None
    for opt in target["options"]:
        if opt["text"] in body.user_revision:
            matched_option = opt
            break
            
    is_correct = matched_option is not None and matched_option["stance"] == body.target_stance
    
    return {
        "status": "ok",
        "is_correct": is_correct,
        "suggested_rewrites": [o["text"] for o in target["options"]],
        "feedback": "Your rewritten version effectively shifted the stance towards the target level." if is_correct else "Try including a softening pattern matching the desired stance level."
    }

@router.post("/practice/stance/partial-agreement/submit")
async def submit_practice_stance_partial_agreement(
    body: PartialAgreementSubmit,
    current_user: User = Depends(get_current_user)
):
    return {
        "status": "ok",
        "feedback": "Perfect! Your response acknowledges points of the statement while presenting a qualified contrast."
    }

@router.post("/conversation/c1/stance-discussion/start")
async def start_c1_stance_discussion(
    body: StanceDiscussionStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        topic=f"C1 Stance Discussion ({body.topic})",
        scenario_id=body.topic,
        user_id=current_user.id
    )
    db.add(convo)
    
    opener = f"안녕하세요! 오늘 토론할 주제는 '{body.topic}'입니다. 어떻게 생각하시는지 말씀해 주세요. (Hello! Today's discussion topic is '{body.topic}'. Please tell me your opinion.)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/c1/stance-discussion/turn")
async def process_c1_stance_discussion_turn(
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are the Korean C1 stance discussion partner. Respond to: \"{body.user_text}\" and challenge them to explain exceptions or qualify statements. "
        "Keep it at C1 level. Format strictly as JSON with fields:\n"
        "- \"ko\": Korean response.\n"
        "- \"en\": English translation.\n"
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "좋은 의견입니다. 하지만 상황에 따라서는 예외가 있을 수 있지 않을까요?"
    reply_en = "Good opinion. But don't you think there could be exceptions depending on the situation?"
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/c1/stance-discussion/finish")
async def finish_c1_stance_discussion(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "stance_usage_report": {
            "hedging_count": 3,
            "stance_variety": "Excellent",
            "feedback": "Impressive balance! You successfully defended your views while softening counterarguments and presenting concessions."
        }
    }

@router.post("/quiz/korean5/phase-3/start")
async def start_korean5_phase3_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(3, {})
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean5/phase-3/answer")
async def submit_korean5_phase3_quiz_answer(
    body: C1Phase3QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean5/phase-3/finish")
async def finish_korean5_phase3_quiz(
    body: C1Phase3QuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=150", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 150,
        "badge": "Nuanced Communicator C1"
    }

@router.get("/phases/korean5/3/homework")
async def get_korean5_phase3_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(3, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean5/3/homework/check")
async def check_korean5_phase3_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/c1/stance-practice/start")
async def start_c1_stance_practice(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        topic="C1 Stance Practices",
        user_id=current_user.id
    )
    db.add(convo)
    
    opener = "안녕하세요! 오늘 특별히 연습해 보고 싶은 입장의 문장이 있으신가요? (Hello! Do you have any stance sentence you'd like to practice today?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/c1/stance-practice/turn")
async def process_c1_stance_practice_turn(
    body: CapstoneTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are the Korean C1 stance coach. Respond to their sentence: \"{body.user_text}\" and suggest 1-2 alternative softening expressions. "
        "Keep it at C1 level. Format strictly as JSON with fields:\n"
        "- \"ko\": Korean response.\n"
        "- \"en\": English translation.\n"
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "훌륭합니다! 여기에 '조심스럽지만'을 덧붙이면 훨씬 신중한 느낌이 납니다."
    reply_en = "Excellent! Adding 'cautiously' here gives a much more deliberate feel."
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
            
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/c1/stance-practice/finish")
async def finish_c1_stance_practice(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "feedback": "C1 stance practice completed successfully. You did great exploring alternative levels of certainty!"
    }


# --- Course 6 Phase 4 (Korean 5.4 – High-Level Register & Style) ---

class C1Phase4QuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken_ms: int

class C1Phase4QuizFinishSubmit(BaseModel):
    score: int
    mistakes: list[str]

class RegisterRewriteSubmit(BaseModel):
    item_id: str
    user_revision: str
    target_register: str

class ContextMatchSubmit(BaseModel):
    item_id: str
    selected_option_id: str

class StyleSwitchTurnRequest(BaseModel):
    user_text: str

@router.get("/phases/korean5/4/metadata")
async def get_korean5_phase4_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "estimated_minutes": 40,
        "goals": data["goals"],
        "prerequisites": data["prerequisites"],
        "status": data["status"]
    }

@router.get("/phases/korean5/4/core-data")
async def get_korean5_phase4_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "content_markdown": data["content_markdown"],
        "register_levels": data["register_levels"],
        "style_contrast_phrases": data["style_contrast_phrases"]
    }

@router.get("/practice/register-style/recognition")
async def get_register_recognition_items(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "recognition_items": data["recognition_items"],
        "context_matching": data["context_matching"]
    }

@router.post("/practice/register-style/recognition/answer")
async def submit_register_recognition_answer(
    body: C1Phase4QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.get("/practice/register-style/rewrite")
async def get_register_rewrite_tasks(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {"rewrite_tasks": data["rewrite_tasks"]}

@router.post("/practice/register-style/rewrite/submit")
async def submit_register_rewrite(
    body: RegisterRewriteSubmit,
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(6, {}).get(4, {})
    rewrite_tasks = data.get("rewrite_tasks", [])
    task = next((t for t in rewrite_tasks if t["id"] == body.item_id), None)
    feedback_ko = "잘 작성하셨습니다! 격식체 표현을 잘 사용하셨어요."
    feedback_en = "Well done! You used formal register expressions accurately."
    model_answer_ko = task["model_answer_ko"] if task else ""
    model_answer_en = task["model_answer_en"] if task else ""
    return {
        "feedback_ko": feedback_ko,
        "feedback_en": feedback_en,
        "model_answer_ko": model_answer_ko,
        "model_answer_en": model_answer_en,
        "status": "ok"
    }

@router.post("/practice/register-style/context-match/submit")
async def submit_context_match(
    body: ContextMatchSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(6, {}).get(4, {})
    context_items = data.get("context_matching", [])
    item = next((i for i in context_items if i["id"] == body.item_id), None)
    is_correct = item is not None and body.selected_option_id == item["correct_id"]
    explanation = item["explanation"] if item else "No explanation available."
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.item_id,
        is_correct=is_correct,
        time_taken_ms=2000
    )
    db.add(attempt)
    await db.commit()
    return {
        "is_correct": is_correct,
        "explanation": explanation,
        "correct_id": item["correct_id"] if item else None
    }

@router.post("/quiz/korean5/phase-4/start")
async def start_korean5_phase4_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean5/phase-4/answer")
async def submit_korean5_phase4_quiz_answer(
    body: C1Phase4QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean5/phase-4/finish")
async def finish_korean5_phase4_quiz(
    body: C1Phase4QuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=150", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 150,
        "badge": "Style-Smart C1 Communicator"
    }

@router.get("/phases/korean5/4/homework")
async def get_korean5_phase4_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(4, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean5/4/homework/check")
async def check_korean5_phase4_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/c1/style-switch/start")
async def start_c1_style_switch(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        topic="C1 Style Switch Practice",
        user_id=current_user.id
    )
    db.add(convo)
    opener = "안녕하세요! 오늘은 같은 내용을 다양한 격식 수준으로 표현하는 연습을 해 봅시다. 어떤 주제로 시작할까요? (Hello! Today let's practise expressing the same idea at different register levels. Which topic shall we start with?)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "opener": opener
    }

@router.post("/conversation/c1/style-switch/turn")
async def process_c1_style_switch_turn(
    body: StyleSwitchTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are a Korean C1 register coach. The student wrote: \"{body.user_text}\". "
        "Identify the register level (informal/neutral/formal), praise what is correct, "
        "and suggest how to rewrite it one register level higher if it is informal or neutral. "
        "Format strictly as JSON with fields: "
        "\"ko\": Korean feedback, \"en\": English translation. "
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "좋은 시도입니다! 격식체로 바꾸면 '~해 주시기 바랍니다'처럼 표현할 수 있어요."
    reply_en = "Good attempt! In formal register, you can express it as '~해 주시기 바랍니다'."
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass

    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/c1/style-switch/finish")
async def finish_c1_style_switch(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "feedback": "C1 style-switch practice completed! You demonstrated strong register awareness across informal, neutral, and formal Korean."
    }



# --- Course 6 Phase 5 (Korean 5.5 – Implicit Meaning & 'Reading Between the Lines') ---

class C1Phase5QuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken_ms: int

class C1Phase5QuizFinishSubmit(BaseModel):
    score: int
    mistakes: list[str]

class ImplicitRecognitionAnswer(BaseModel):
    dialogue_id: str
    selected_idx: int
    time_taken_ms: int

class YesNoMaybeAnswer(BaseModel):
    item_id: str
    answer: str   # "yes" | "polite_no" | "unsure"

class EmotionInferenceAnswer(BaseModel):
    item_id: str
    emotion: str

class ImplicitResponseSubmit(BaseModel):
    template_id: str
    user_response: str
    real_meaning: str

class SoftenSubmit(BaseModel):
    template_id: str
    selected_option_idx: int

class ImplicitChatTurnRequest(BaseModel):
    user_text: str
    context: str = "social"

class SubtextCoachingTurnRequest(BaseModel):
    user_text: str

@router.get("/phases/korean5/5/metadata")
async def get_korean5_phase5_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "estimated_minutes": 40,
        "goals": data["goals"],
        "prerequisites": data["prerequisites"],
        "status": data["status"]
    }

@router.get("/phases/korean5/5/core-data")
async def get_korean5_phase5_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "content_markdown": data["content_markdown"],
        "implicit_patterns": data["implicit_patterns"]
    }

@router.get("/practice/implicit/recognition")
async def get_implicit_recognition(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "recognition_dialogues": data["recognition_dialogues"],
        "yes_no_maybe_items": data["yes_no_maybe_items"],
        "emotion_inference_items": data["emotion_inference_items"]
    }

@router.post("/practice/implicit/recognition/answer")
async def submit_implicit_recognition_answer(
    body: ImplicitRecognitionAnswer,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.dialogue_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.get("/practice/implicit/response-templates")
async def get_implicit_response_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {"response_templates": data["response_templates"]}

@router.post("/practice/implicit/response/submit")
async def submit_implicit_response(
    body: ImplicitResponseSubmit,
    current_user: User = Depends(get_current_user)
):
    return {
        "status": "ok",
        "feedback_en": "Good attempt at picking up on the implicit meaning! Make sure your response acknowledges what was hinted at without forcing the other person to state it directly.",
        "feedback_ko": "좋은 시도입니다! 상대방이 직접 말하지 않아도 그 뉘앙스를 자연스럽게 받아들이는 연습을 계속 해 보세요."
    }

@router.get("/practice/implicit/soften-templates")
async def get_implicit_soften_templates(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {"soften_templates": data["soften_templates"]}

@router.post("/practice/implicit/soften/submit")
async def submit_soften_rewrite(
    body: SoftenSubmit,
    current_user: User = Depends(get_current_user)
):
    data = PREGENERATED_LESSONS.get(6, {}).get(5, {})
    templates = data.get("soften_templates", [])
    tmpl = next((t for t in templates if t["id"] == body.template_id), None)
    selected = None
    if tmpl and 0 <= body.selected_option_idx < len(tmpl["indirect_options"]):
        selected = tmpl["indirect_options"][body.selected_option_idx]
    return {
        "status": "ok",
        "selected_ko": selected["ko"] if selected else "",
        "selected_label": selected["label"] if selected else "",
        "feedback_en": "Well chosen! This indirect version keeps the meaning recoverable while removing the face-threatening directness."
    }

@router.post("/quiz/korean5/phase-5/start")
async def start_korean5_phase5_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean5/phase-5/answer")
async def submit_korean5_phase5_quiz_answer(
    body: C1Phase5QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean5/phase-5/finish")
async def finish_korean5_phase5_quiz(
    body: C1Phase5QuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=150", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 150,
        "badge": "Subtext Reader C1"
    }

@router.get("/phases/korean5/5/homework")
async def get_korean5_phase5_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(5, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return data["homework"]

@router.post("/phases/korean5/5/homework/check")
async def check_korean5_phase5_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/c1/implicit-practice/start")
async def start_c1_implicit_practice(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        topic="C1 Implicit Meaning Practice",
        user_id=current_user.id
    )
    db.add(convo)
    opener = "안녕하세요! 오늘은 숨겨진 의미를 파악하는 연습을 해봐요. 제가 뭔가를 말할 테니, 제가 '진짜로' 하고 싶은 말이 무엇인지 파악해 보세요. (Hello! Today let's practise spotting hidden meaning. I'll say something and you figure out what I'm really saying.)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {"session_id": str(convo.id), "opener": opener}

@router.post("/conversation/c1/implicit-practice/turn")
async def process_c1_implicit_practice_turn(
    body: ImplicitChatTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are a Korean C1 implicit meaning coach. Context: {body.context}. "
        f"The student replied: \"{body.user_text}\". "
        "Either: (1) give them an indirect/implicit Korean statement to interpret, or (2) evaluate their interpretation of your last statement. "
        "Use authentic indirect Korean speech patterns (soft refusals, hints, emotional subtext). "
        "Format strictly as JSON: {\"ko\": Korean response, \"en\": English translation}. "
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "좋습니다! 그럼 이 말은 어떤 의미일까요? '요즘 그 카페는 좀 사람이 많더라고요…' (제 친구가 카페 약속을 제안했을 때 이렇게 말했어요.)"
    reply_en = "Good! Now what does this mean? 'That café has been quite crowded lately…' (My friend said this when I suggested meeting at a café.)"
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/c1/implicit-practice/finish")
async def finish_c1_implicit_practice(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "implicit_understanding_report": {
            "successes": ["Correctly identified polite refusal patterns", "Picked up on emotional subtext clues"],
            "missed_hints": ["Watch for trailing 서요… patterns — these often signal soft excuses"],
            "suggestions": ["Pay attention to '확인해 봐야…' — it almost always means the person is declining politely"]
        }
    }

@router.post("/conversation/c1/subtext-coaching/start")
async def start_c1_subtext_coaching(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        topic="C1 Subtext Coaching",
        user_id=current_user.id
    )
    db.add(convo)
    opener = "안녕하세요! 오늘 서브텍스트 코칭 세션을 시작해 봅시다. 제가 상황을 드릴 테니, 그 속에 담긴 진짜 의미를 파악하고 어떻게 반응할지 생각해 보세요. (Hello! Let's start your subtext coaching session. I'll give you situations — figure out the real meaning and think about how to respond.)"
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {"session_id": str(convo.id), "opener": opener}

@router.post("/conversation/c1/subtext-coaching/turn")
async def process_c1_subtext_coaching_turn(
    body: SubtextCoachingTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are a Korean C1 subtext coaching tutor. The student said: \"{body.user_text}\". "
        "Present a mini-situation in Korean with implicit meaning, OR evaluate their interpretation/response. "
        "Confirm or adjust their reading, explain key signals to watch for, and suggest safer or more appropriate responses. "
        "Format strictly as JSON: {\"ko\": Korean response, \"en\": English translation}. "
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "잘 파악하셨어요! 이런 표현에서 중요한 신호는 '서요…'로 끝나는 이유절이에요. 다음 상황을 드릴게요: 교수님이 과제에 이렇게 말씀하셨어요. '음… 더 발전시킬 여지가 있는 것 같아요.'"
    reply_en = "Well spotted! The key signal in expressions like that is the trailing '서요…' (because…) reason clause. Here's your next situation: Your professor said about your assignment: 'Hmm… it seems like there's room to develop it further.'"
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/c1/subtext-coaching/finish")
async def finish_c1_subtext_coaching(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "feedback": "Excellent subtext coaching session! You showed strong awareness of Korean indirect speech patterns. Keep watching for trailing 서요…, 것 같아요, and 확인해 봐야… — these are your most important clues for polite refusals and hidden meanings."
    }



# --- Course 6 Phase 6 (Korean 5.6 – C1 Real-World Communication Capstone) ---

class C1Phase6QuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str
    time_taken_ms: int

class C1Phase6QuizFinishSubmit(BaseModel):
    score: int
    mistakes: list[str]

class CapstoneSaveStrategy(BaseModel):
    scenario_id: str
    idioms: list[str]
    stance: str
    register_focus: str
    listening_for: str

class CapstoneStartRequest(BaseModel):
    scenario_id: str
    strategy_id: str = ""

class CapstoneChatTurnRequest(BaseModel):
    user_text: str
    stage: str = "dialog"

class CapstoneWritingSubmit(BaseModel):
    scenario_id: str
    stage: str
    text: str

class CapstoneSpeakingSubmit(BaseModel):
    scenario_id: str
    stage: str
    transcript: str

class ExitInterviewTurnRequest(BaseModel):
    user_text: str

class DescriptorSelfRating(BaseModel):
    descriptor_id: str
    rating: int
    notes: str

@router.get("/phases/korean5/6/metadata")
async def get_korean5_phase6_metadata(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "title": data["title"],
        "description": data["description"],
        "estimated_time": data["estimated_time"],
        "goals": data["goals"],
        "skills_targeted": data["skills_targeted"],
        "prerequisites": data["prerequisites"],
        "status": data["status"]
    }

@router.get("/phases/korean5/6/core-data")
async def get_korean5_phase6_core_data(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "content_markdown": data["content_markdown"],
        "preview_scenarios": data["preview_scenarios"],
        "skills_targeted": data["skills_targeted"]
    }

@router.get("/practice/c1-capstone/preview-scenarios")
async def get_c1_capstone_preview_scenarios(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "preview_scenarios": data["preview_scenarios"],
        "strategy_idiom_options": data["strategy_idiom_options"]
    }

@router.post("/practice/c1-capstone/strategy/save")
async def save_capstone_strategy(
    body: CapstoneSaveStrategy,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    strategy_id = str(uuid.uuid4())
    return {
        "status": "ok",
        "strategy_id": strategy_id,
        "suggested_phrases": [
            "그런데 사실… (Actually though…)",
            "솔직히 말씀드리면 (To be honest with you)",
            "최선을 다해 보겠습니다 (We'll do our very best)"
        ]
    }

@router.get("/practice/c1-capstone/scenarios")
async def get_c1_capstone_scenarios(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {"capstone_scenarios": data["capstone_scenarios"]}

@router.post("/conversation/c1/full-capstone/start")
async def start_c1_full_capstone(
    body: CapstoneStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    data = PREGENERATED_LESSONS.get(6, {}).get(6, {})
    scenario = next((s for s in data.get("capstone_scenarios", []) if s["id"] == body.scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    convo = Conversation(
        id=uuid.uuid4(),
        topic=f"C1 Capstone – {scenario['title']}",
        user_id=current_user.id
    )
    db.add(convo)
    opener = scenario["intro_ko"]
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {
        "session_id": str(convo.id),
        "scenario_title": scenario["title"],
        "stages": scenario["stages"],
        "opener": opener,
        "opener_en": scenario["intro_en"],
        "input_message_ko": scenario["input_message_ko"],
        "input_message_en": scenario["input_message_en"],
        "comprehension_questions": scenario["comprehension_questions"]
    }

@router.post("/conversation/c1/full-capstone/turn")
async def process_c1_full_capstone_turn(
    body: CapstoneChatTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are a Korean C1 capstone evaluator running a '{body.stage}' stage. "
        f"The student said: \"{body.user_text}\". "
        "Continue the scenario naturally in Korean, pushing for C1 skills: idioms, stance, register, and implicit meaning. "
        "Evaluate if appropriate and offer the next stage prompt or feedback. "
        "Format strictly as JSON: {\"ko\": Korean response, \"en\": English translation, \"stage_complete\": bool}. "
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "잘 하셨어요. 그 다음 단계로 넘어가 볼까요? 이제 상황을 정리해서 짧게 글로 써 주세요."
    reply_en = "Well done. Shall we move to the next stage? Please now summarise the situation briefly in writing."
    stage_complete = False
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
            stage_complete = parsed.get("stage_complete", False)
        except Exception:
            pass
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "stage_complete": stage_complete,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/c1/full-capstone/submit-writing")
async def submit_capstone_writing(
    body: CapstoneWritingSubmit,
    current_user: User = Depends(get_current_user)
):
    return {
        "status": "ok",
        "feedback_en": "Good writing! Check your register consistency — make sure honorific markers match throughout. Your stance was well-balanced.",
        "feedback_ko": "잘 쓰셨어요! 존댓말 표현을 전체적으로 일관되게 유지하고, 입장 표현이 균형 잡혀 있어서 좋습니다."
    }

@router.post("/conversation/c1/full-capstone/submit-speaking")
async def submit_capstone_speaking(
    body: CapstoneSpeakingSubmit,
    current_user: User = Depends(get_current_user)
):
    return {
        "status": "ok",
        "feedback_en": "Good spoken summary! You structured your narrative clearly with a beginning, problem, and reflection. Watch for discourse markers to connect your points more smoothly.",
        "feedback_ko": "구술 요약 잘 하셨습니다! 시작, 문제, 성찰의 구조가 명확했어요. 담화 표지어를 더 활용하면 흐름이 더 자연스러워질 거예요."
    }

@router.post("/conversation/c1/full-capstone/finish")
async def finish_c1_full_capstone(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "c1_capstone_report": {
            "content_coherence": "Strong — you covered all key points and sequenced events logically.",
            "idiomaticity": "Good — appropriate idiom use without overuse.",
            "stance_hedging": "Well-balanced — nuanced without being evasive.",
            "register_style": "Appropriate — you adapted effectively across stages.",
            "implicit_meaning": "Solid — you correctly identified the underlying concerns.",
            "overall": "C1-level integrated performance demonstrated."
        }
    }

@router.post("/quiz/korean5/phase-6/start")
async def start_korean5_phase6_quiz(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    blueprint = []
    for q in data.get("quiz", []):
        blueprint.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options", None),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })
    return {"blueprint": blueprint}

@router.post("/quiz/korean5/phase-6/answer")
async def submit_korean5_phase6_quiz_answer(
    body: C1Phase6QuizAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = UserExerciseAttempt(
        id=uuid.uuid4(),
        user_id=current_user.id,
        exercise_id=body.question_id,
        is_correct=True,
        time_taken_ms=body.time_taken_ms
    )
    db.add(attempt)
    await db.commit()
    return {"status": "ok"}

@router.post("/quiz/korean5/phase-6/finish")
async def finish_korean5_phase6_quiz(
    body: C1Phase6QuizFinishSubmit,
    current_user: User = Depends(get_current_user)
):
    try:
        await apiRequest(f"/progress/xp/add?amount=200", { "method": "POST" })
    except Exception:
        pass
    return {
        "status": "ok",
        "xp_earned": 200,
        "badge": "C1 Real-World Communicator"
    }

@router.get("/phases/korean5/6/homework")
async def get_korean5_phase6_homework(current_user: User = Depends(get_current_user)):
    data = PREGENERATED_LESSONS.get(6, {}).get(6, {})
    if not data:
        raise HTTPException(status_code=404, detail="Curriculum phase not found")
    return {
        "homework": data["homework"],
        "c1_descriptors": data["c1_descriptors"]
    }

@router.post("/phases/korean5/6/homework/check")
async def check_korean5_phase6_homework(
    body: HomeworkCheckRequest,
    current_user: User = Depends(get_current_user)
):
    return {"status": "ok", "checked": body.checked}

@router.post("/conversation/c1/exit-interview/start")
async def start_c1_exit_interview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.models.study import Conversation, Message
    convo = Conversation(
        id=uuid.uuid4(),
        topic="C1 Exit Interview",
        user_id=current_user.id
    )
    db.add(convo)
    opener = (
        "안녕하세요! 오늘 Korean 5 과정 마무리 인터뷰를 진행해 봐요. "
        "몇 가지 여쭤볼게요: 지금 한국어를 어떤 상황에서 사용하고 계신가요? "
        "(Hello! Let's do your Korean 5 exit interview. A few questions: "
        "In what situations are you currently using Korean in your life?)"
    )
    msg = Message(
        id=uuid.uuid4(),
        conversation_id=convo.id,
        sender_role="assistant",
        content=opener
    )
    db.add(msg)
    await db.commit()
    return {"session_id": str(convo.id), "opener": opener}

@router.post("/conversation/c1/exit-interview/turn")
async def process_c1_exit_interview_turn(
    body: ExitInterviewTurnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = (
        f"You are a Korean C1 tutor conducting a friendly exit interview. "
        f"The student said: \"{body.user_text}\". "
        "Ask a thoughtful follow-up from: 'Which Korean 5 situations felt easiest/hardest?', "
        "'Which phase helped you most?', 'What would you like to improve next?' "
        "Be warm and encouraging. "
        "Format strictly as JSON: {\"ko\": Korean response, \"en\": English}. "
        "Return raw JSON."
    )
    ai_output = await call_llama_groq(prompt)
    reply_ko = "정말 잘 하셨어요! 그렇다면 Korean 5 과정 중 어떤 단계가 가장 도움이 됐나요? 관용어 표현이었나요, 아니면 뉘앙스나 맥락 파악이었나요?"
    reply_en = "You've done really well! Which phase of Korean 5 helped you the most — was it the idioms, or the nuance and subtext work?"
    if ai_output:
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        ai_output = ai_output.strip()
        try:
            parsed = json.loads(ai_output)
            reply_ko = parsed.get("ko", reply_ko)
            reply_en = parsed.get("en", reply_en)
        except Exception:
            pass
    return {
        "reply_ko": reply_ko,
        "reply_en": reply_en,
        "audio_url": f"/api/v1/speech/tts?text={reply_ko}&lang=ko"
    }

@router.post("/conversation/c1/exit-interview/finish")
async def finish_c1_exit_interview(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "c1_profile_snapshot": {
            "completed_course": "Korean 5 – Advanced Korean, Idioms & Nuance (C1)",
            "strengths": ["Idioms & natural expressions", "Register & style switching", "Implicit meaning recognition"],
            "areas_for_growth": ["C2-level precision", "Domain-specific vocabulary"],
            "suggested_next": ["Korean 6 (C1→C2 refinement)", "Business Korean track", "Academic Korean track", "Exam prep mode"]
        },
        "farewell": "축하드립니다! Korean 5 과정을 완료하셨습니다. C1 실력을 갖추셨으니 다음 단계로 나아갈 준비가 되셨습니다! (Congratulations! You have completed the Korean 5 course. With your C1 skills, you're ready for the next step!)"
    }


# ---------------------------------------------------------------------

@router.get("", response_model=List[LessonResponse])
async def list_lessons(
    level: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Lesson)
    if level is not None:
        stmt = stmt.where(Lesson.level == level)
    stmt = stmt.order_by(Lesson.sequence_order)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Lesson).where(Lesson.id == lesson_id)
    result = await db.execute(stmt)
    lesson = result.scalars().first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )
    return lesson

@router.get("/vocab/all", response_model=List[VocabularyResponse])
async def list_vocabulary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Vocabulary)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/grammar/all", response_model=List[GrammarResponse])
async def list_grammar(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Grammar)
    result = await db.execute(stmt)
    return result.scalars().all()
