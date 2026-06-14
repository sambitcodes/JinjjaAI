"""
Phase 5 – Speaking Lab API
All endpoints for the 7-screen speaking wizard.

Llama/Groq is NEVER called automatically — only when the user explicitly
clicks a "Get AI Feedback" / "Generate AI Tip" button (use_ai=True param).
"""
import difflib
import json
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from backend.app.core.database import get_db
from backend.app.api.v1.auth import get_current_user
from backend.app.models.user import User
from backend.app.models.study import PronunciationAttempt
from backend.app.services.speech_ai import speech_ai_service

router = APIRouter()

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _similarity_score(target: str, recognized: str) -> float:
    """
    Token-level similarity using difflib SequenceMatcher.
    Returns a 0–100 float.
    """
    if not target or not recognized:
        return 0.0
    ratio = difflib.SequenceMatcher(None, target.strip(), recognized.strip()).ratio()
    return round(ratio * 100, 1)


def _word_diffs(target: str, recognized: str) -> list[dict]:
    """
    Return a list of word-level diff objects: { word, status }.
    status: "correct" | "wrong" | "missing"
    """
    t_words = target.strip().split()
    r_words = recognized.strip().split()
    diffs = []
    matcher = difflib.SequenceMatcher(None, t_words, r_words)
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            for w in t_words[i1:i2]:
                diffs.append({"word": w, "status": "correct"})
        elif tag in ("replace", "delete"):
            for w in t_words[i1:i2]:
                diffs.append({"word": w, "status": "wrong"})
        elif tag == "insert":
            pass  # extra words the user said — we ignore them
    return diffs


async def _call_llama(prompt: str) -> str:
    """Shared Groq/Llama call."""
    import httpx
    from backend.app.core.config import settings
    try:
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.5,
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0,
            )
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"Groq API call error: {e}", flush=True)
    return ""


# ---------------------------------------------------------------------------
# Pydantic request/response models
# ---------------------------------------------------------------------------

class PatternAttemptRequest(BaseModel):
    pattern_id: str
    user_slot_choices: dict
    recognized_text: str
    similarity_score: float


class AssessmentSubmitRequest(BaseModel):
    items: list[dict]   # [{ target, recognized, score, type }]


class FeedbackRequest(BaseModel):
    target_text: str
    recognized_text: str
    similarity_score: float
    sound_category: Optional[str] = None


class FreeSpeakingFeedbackRequest(BaseModel):
    prompt: str
    recognized_text: str


# ---------------------------------------------------------------------------
# Screen 1 – Overview & Calibration
# ---------------------------------------------------------------------------

@router.get("/phase5/metadata")
async def get_phase5_metadata(current_user: User = Depends(get_current_user)):
    return {
        "title": "Speaking Lab 1 – Listen & Repeat",
        "description": (
            "You'll listen to short Korean sentences, repeat them, and get "
            "immediate feedback on accuracy, rhythm, and speed."
        ),
        "estimated_minutes": 20,
        "difficulty": "A1",
        "target_skills": [
            "Guided shadowing (ear-mouth loop)",
            "Targeted phoneme drilling",
            "Pattern-based production",
            "Free speaking tasks",
        ],
        "setup_tips": [
            "Find a quiet environment with minimal background noise.",
            "Position your microphone close to your mouth.",
            "Speak clearly and at a natural, relaxed pace.",
            "Use headphones if possible to avoid audio feedback.",
        ],
    }


@router.post("/check-setup")
async def check_setup(
    audio_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Runs STT on a short test recording to verify the microphone and
    Whisper pipeline are both working. Does NOT call Llama.
    """
    audio_bytes = await audio_file.read()
    try:
        transcription = await speech_ai_service.transcribe_audio(audio_bytes)
        stt_ok = bool(transcription and transcription.strip())
        return {
            "stt_ok": stt_ok,
            "transcription": transcription,
            "signal_quality_score": 85 if stt_ok else 30,  # heuristic — improve with audio analysis later
            "hint": (
                None if stt_ok
                else "We couldn't detect speech. Make sure your microphone is enabled and you spoke clearly."
            ),
        }
    except Exception as e:
        return {
            "stt_ok": False,
            "transcription": "",
            "signal_quality_score": 0,
            "hint": f"Setup check failed: {str(e)}. Check that Faster-Whisper is running.",
        }


# ---------------------------------------------------------------------------
# Screen 2 – Guided Shadowing
# ---------------------------------------------------------------------------

SHADOWING_ITEMS = [
    {
        "id": "sh1",
        "target_text_ko": "안녕하세요",
        "romanization": "an-nyeong-ha-se-yo",
        "english_gloss": "Hello (polite)",
        "category": "greeting",
    },
    {
        "id": "sh2",
        "target_text_ko": "감사합니다",
        "romanization": "gam-sa-ham-ni-da",
        "english_gloss": "Thank you",
        "category": "greeting",
    },
    {
        "id": "sh3",
        "target_text_ko": "제 이름은 뭐예요?",
        "romanization": "je i-reum-eun mwo-ye-yo?",
        "english_gloss": "What is my name?",
        "category": "question",
    },
    {
        "id": "sh4",
        "target_text_ko": "저는 학생이에요",
        "romanization": "jeo-neun hak-saeng-i-e-yo",
        "english_gloss": "I am a student",
        "category": "self-intro",
    },
    {
        "id": "sh5",
        "target_text_ko": "한국어를 공부해요",
        "romanization": "han-gug-eo-reul gong-bu-hae-yo",
        "english_gloss": "I study Korean",
        "category": "self-intro",
    },
    {
        "id": "sh6",
        "target_text_ko": "이거 얼마예요?",
        "romanization": "i-geo eol-ma-ye-yo?",
        "english_gloss": "How much is this?",
        "category": "shopping",
    },
    {
        "id": "sh7",
        "target_text_ko": "화장실이 어디예요?",
        "romanization": "hwa-jang-sil-i eo-di-ye-yo?",
        "english_gloss": "Where is the bathroom?",
        "category": "navigation",
    },
    {
        "id": "sh8",
        "target_text_ko": "잘 먹겠습니다",
        "romanization": "jal meok-get-seum-ni-da",
        "english_gloss": "I will eat well (said before meals)",
        "category": "culture",
    },
]


@router.get("/shadowing/items")
async def get_shadowing_items(
    level: str = Query("A1"),
    current_user: User = Depends(get_current_user),
):
    return SHADOWING_ITEMS


@router.post("/shadowing/attempt")
async def submit_shadowing_attempt(
    target_text: str = Form(...),
    item_id: str = Form(...),
    audio_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audio_bytes = await audio_file.read()

    # STT via existing Faster-Whisper service
    recognized_text = ""
    try:
        recognized_text = await speech_ai_service.transcribe_audio(audio_bytes)
    except Exception as e:
        print(f"STT error in shadowing attempt: {e}", flush=True)

    similarity = _similarity_score(target_text, recognized_text)
    word_diffs = _word_diffs(target_text, recognized_text)

    # Persist to DB
    attempt = PronunciationAttempt(
        user_id=current_user.id,
        target_text=target_text,
        accuracy_score=similarity / 100.0,
        recognized_text=recognized_text,
        attempt_type="shadowing",
        phoneme_details={"item_id": item_id, "word_diffs": word_diffs},
    )
    db.add(attempt)
    await db.commit()

    return {
        "recognized_text": recognized_text,
        "similarity_score": similarity,
        "word_diffs": word_diffs,
        "color": "green" if similarity >= 80 else ("yellow" if similarity >= 55 else "red"),
        "feedback_hint": (
            "Excellent! Your pronunciation was very accurate." if similarity >= 80
            else "Good effort! Focus on the highlighted syllables and try again."
            if similarity >= 55
            else "Keep practicing! Listen carefully and repeat more slowly."
        ),
    }


# ---------------------------------------------------------------------------
# Screen 3 – Pronunciation Feedback Drill
# ---------------------------------------------------------------------------

PHONEME_TARGETS = [
    {
        "id": "ph1",
        "sound_category": "eo_vs_o",
        "label": "ㅓ vs ㅗ",
        "description": "The two 'o-like' vowels: ㅓ (open mouth, relaxed) vs ㅗ (rounded lips).",
        "tip": "For ㅓ, keep your lips relaxed and slightly open. For ㅗ, round your lips like saying 'oh'.",
        "examples": [
            {"word": "어머니", "romanization": "eo-meo-ni", "gloss": "mother"},
            {"word": "오빠", "romanization": "op-pa", "gloss": "older brother"},
        ],
    },
    {
        "id": "ph2",
        "sound_category": "eu_vs_u",
        "label": "ㅡ vs ㅜ",
        "description": "The flat throat vowel ㅡ vs the rounded ㅜ.",
        "tip": "For ㅡ, spread lips wide as if smiling, no lip rounding. For ㅜ, push lips forward like an 'oo'.",
        "examples": [
            {"word": "그냥", "romanization": "geu-nyang", "gloss": "just/anyway"},
            {"word": "우유", "romanization": "u-yu", "gloss": "milk"},
        ],
    },
    {
        "id": "ph3",
        "sound_category": "batchim_stop",
        "label": "받침 Final Stops",
        "description": "Final consonants ㅂ/ㅍ→[p], ㄱ/ㅋ→[k], ㄷ/ㅌ/ㅅ→[t] are unreleased stops.",
        "tip": "Don't release the final consonant — hold the position and stop airflow. English speakers tend to add a small puff at the end.",
        "examples": [
            {"word": "밥", "romanization": "bap", "gloss": "rice/food"},
            {"word": "책", "romanization": "chaek", "gloss": "book"},
        ],
    },
]


@router.get("/pronunciation/targets")
async def get_pronunciation_targets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns prioritized phoneme targets. In a full implementation this would
    query pronunciation_attempts to find the user's weak spots. For now we
    return a static curated set of the hardest sounds for English speakers.
    """
    return PHONEME_TARGETS


@router.post("/pronunciation/attempt")
async def submit_pronunciation_attempt(
    target_text: str = Form(...),
    sound_category: str = Form(...),
    audio_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audio_bytes = await audio_file.read()
    recognized_text = ""
    try:
        recognized_text = await speech_ai_service.transcribe_audio(audio_bytes)
    except Exception as e:
        print(f"STT error in pronunciation attempt: {e}", flush=True)

    similarity = _similarity_score(target_text, recognized_text)
    word_diffs = _word_diffs(target_text, recognized_text)

    attempt = PronunciationAttempt(
        user_id=current_user.id,
        target_text=target_text,
        accuracy_score=similarity / 100.0,
        recognized_text=recognized_text,
        attempt_type="pronunciation_drill",
        phoneme_details={"sound_category": sound_category, "word_diffs": word_diffs},
    )
    db.add(attempt)
    await db.commit()

    return {
        "recognized_text": recognized_text,
        "similarity_score": similarity,
        "word_diffs": word_diffs,
        "color": "green" if similarity >= 80 else ("yellow" if similarity >= 55 else "red"),
    }


@router.post("/pronunciation/feedback")
async def get_pronunciation_feedback(body: FeedbackRequest, current_user: User = Depends(get_current_user)):
    """
    ON-DEMAND Llama call — only triggered when user clicks "Get AI Tip".
    """
    prompt = (
        f"A Korean language learner was practicing the sound category '{body.sound_category or 'general'}'.\n"
        f"Target sentence: '{body.target_text}'\n"
        f"What they said (transcribed by Whisper): '{body.recognized_text}'\n"
        f"Pronunciation similarity score: {body.similarity_score}/100\n\n"
        "As a friendly Korean pronunciation coach, provide:\n"
        "1. One sentence of encouragement.\n"
        "2. One very specific, actionable pronunciation tip in simple English.\n"
        "Keep the total response under 4 sentences."
    )
    feedback = await _call_llama(prompt)
    if not feedback:
        feedback = (
            f"Good effort with {body.similarity_score:.0f}% accuracy! "
            "Try slowing down slightly and focus on matching the vowel mouth positions exactly. "
            "Listen to the model audio one more time and repeat."
        )
    return {"feedback": feedback}


# ---------------------------------------------------------------------------
# Screen 4 – Controlled Pattern Tasks
# ---------------------------------------------------------------------------

SPEAKING_PATTERNS = [
    {
        "id": "pat1",
        "pattern_ko": "제 이름은 _예요.",
        "pattern_en": "My name is _.",
        "slot_label": "Your name",
        "slot_type": "text",
        "slot_options": ["민수", "지은", "제임스", "리사", "사라"],
        "example_complete_ko": "제 이름은 민수예요.",
        "example_complete_en": "My name is Minsu.",
    },
    {
        "id": "pat2",
        "pattern_ko": "저는 _에서 왔어요.",
        "pattern_en": "I came from _.",
        "slot_label": "Country",
        "slot_type": "select",
        "slot_options": ["미국", "한국", "영국", "인도", "캐나다", "호주"],
        "example_complete_ko": "저는 미국에서 왔어요.",
        "example_complete_en": "I came from the USA.",
    },
    {
        "id": "pat3",
        "pattern_ko": "저는 _을 좋아해요.",
        "pattern_en": "I like _.",
        "slot_label": "Hobby or food",
        "slot_type": "select",
        "slot_options": ["음악을", "커피를", "운동을", "독서를", "요리를"],
        "example_complete_ko": "저는 음악을 좋아해요.",
        "example_complete_en": "I like music.",
    },
]


@router.get("/patterns")
async def get_speaking_patterns(
    level: str = Query("A1"),
    current_user: User = Depends(get_current_user),
):
    return SPEAKING_PATTERNS


@router.post("/pattern/attempt")
async def submit_pattern_attempt(
    pattern_id: str = Form(...),
    expected_text: str = Form(...),
    audio_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audio_bytes = await audio_file.read()
    recognized_text = ""
    try:
        recognized_text = await speech_ai_service.transcribe_audio(audio_bytes)
    except Exception as e:
        print(f"STT error in pattern attempt: {e}", flush=True)

    similarity = _similarity_score(expected_text, recognized_text)
    word_diffs = _word_diffs(expected_text, recognized_text)

    attempt = PronunciationAttempt(
        user_id=current_user.id,
        target_text=expected_text,
        accuracy_score=similarity / 100.0,
        recognized_text=recognized_text,
        attempt_type="pattern",
        phoneme_details={"pattern_id": pattern_id, "word_diffs": word_diffs},
    )
    db.add(attempt)
    await db.commit()

    # Basic structural check: did they include the key pattern words?
    structure_ok = any(
        kw in (recognized_text or "")
        for kw in ["이에요", "예요", "왔어요", "좋아해요"]
    )

    return {
        "recognized_text": recognized_text,
        "expected_text": expected_text,
        "similarity_score": similarity,
        "word_diffs": word_diffs,
        "structure_ok": structure_ok,
        "color": "green" if similarity >= 75 else ("yellow" if similarity >= 50 else "red"),
    }


@router.post("/pattern/feedback")
async def get_pattern_feedback(body: FeedbackRequest, current_user: User = Depends(get_current_user)):
    """ON-DEMAND Llama call for pattern structural feedback."""
    prompt = (
        f"A Korean A1 learner attempted to say the sentence:\n"
        f"Target: '{body.target_text}'\n"
        f"What Whisper heard: '{body.recognized_text}'\n"
        f"Similarity score: {body.similarity_score}/100\n\n"
        "As tutor Gwan-Sik:\n"
        "1. Comment briefly on whether the sentence structure and particle usage sounds correct.\n"
        "2. Give ONE specific improvement tip (grammar or pronunciation).\n"
        "Keep it under 3 sentences and keep it encouraging."
    )
    feedback = await _call_llama(prompt)
    if not feedback:
        feedback = (
            f"You got {body.similarity_score:.0f}% accuracy on this pattern! "
            "Check that you're using the correct politeness ending (-요) and the right object particle (을/를)."
        )
    return {"feedback": feedback}


# ---------------------------------------------------------------------------
# Screen 5 – Free Speaking Mini-tasks
# ---------------------------------------------------------------------------

FREE_TASKS = [
    {
        "id": "free1",
        "prompt_en": "Introduce yourself in 2–3 sentences.",
        "prompt_hint": "Say your name, where you're from, and one thing you like.",
        "sample_structure": ["제 이름은 _예요.", "저는 _에서 왔어요.", "저는 _을 좋아해요."],
        "suggested_length_seconds": 20,
    },
    {
        "id": "free2",
        "prompt_en": "Talk about your favorite food.",
        "prompt_hint": "Name the food and say why you like it.",
        "sample_structure": ["저는 _을 좋아해요.", "왜냐하면 맛있어요!"],
        "suggested_length_seconds": 20,
    },
    {
        "id": "free3",
        "prompt_en": "Say what you do on weekends.",
        "prompt_hint": "Use at least two activities.",
        "sample_structure": ["주말에 _해요.", "그리고 _도 해요."],
        "suggested_length_seconds": 25,
    },
]


@router.get("/free-tasks")
async def get_free_tasks(
    level: str = Query("A1"),
    current_user: User = Depends(get_current_user),
):
    return FREE_TASKS


@router.post("/free-tasks/attempt")
async def submit_free_task_attempt(
    task_id: str = Form(...),
    prompt_text: str = Form(...),
    audio_file: UploadFile = File(...),
    use_ai: bool = Form(False),  # Only True when user clicks "Analyze with AI"
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audio_bytes = await audio_file.read()
    recognized_text = ""
    try:
        recognized_text = await speech_ai_service.transcribe_audio(audio_bytes)
    except Exception as e:
        print(f"STT error in free task: {e}", flush=True)

    word_count = len(recognized_text.split()) if recognized_text else 0
    fluency_score = min(100.0, word_count * 5.0)  # basic heuristic: 20+ words = 100

    attempt = PronunciationAttempt(
        user_id=current_user.id,
        target_text=prompt_text,
        accuracy_score=fluency_score / 100.0,
        recognized_text=recognized_text,
        attempt_type="free",
        phoneme_details={"task_id": task_id, "word_count": word_count},
    )
    db.add(attempt)
    await db.commit()

    ai_feedback = None
    if use_ai and recognized_text:
        ai_prompt = (
            f"A Korean A1 learner was asked to: '{prompt_text}'\n"
            f"They said (transcribed): '{recognized_text}'\n\n"
            "As tutor Gwan-Sik:\n"
            "1. Did they answer the prompt? (yes/no + brief comment)\n"
            "2. Note their sentence count and variety (brief).\n"
            "3. Note one grammar or politeness issue if any.\n"
            "4. Give one encouragement line.\n"
            "Keep total response under 5 sentences."
        )
        ai_feedback = await _call_llama(ai_prompt)
        if not ai_feedback:
            ai_feedback = (
                f"You spoke {word_count} words — great effort! "
                "Make sure to end sentences with a polite -요 form. Keep practicing!"
            )

    return {
        "recognized_text": recognized_text,
        "word_count": word_count,
        "fluency_score": fluency_score,
        "ai_feedback": ai_feedback,
        "color": "green" if fluency_score >= 70 else ("yellow" if fluency_score >= 40 else "red"),
    }


# ---------------------------------------------------------------------------
# Screen 6 – Phase 5 Mini-Assessment
# ---------------------------------------------------------------------------

ASSESSMENT_BLUEPRINT = [
    {"type": "shadowing", "item_id": "sh1", "target": "안녕하세요", "gloss": "Hello (polite)"},
    {"type": "shadowing", "item_id": "sh4", "target": "저는 학생이에요", "gloss": "I am a student"},
    {"type": "pattern", "item_id": "pat1", "target": "제 이름은 민수예요.", "gloss": "My name is Minsu."},
    {"type": "free", "item_id": "free1", "target": "Introduce yourself in 2–3 sentences.", "gloss": "Self-intro"},
]


@router.post("/assessment/start")
async def start_assessment(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": ASSESSMENT_BLUEPRINT,
        "instructions": (
            "This assessment has 4 items. "
            "For shadowing items, listen and repeat accurately. "
            "For the pattern item, fill in the slot and speak the full sentence. "
            "For the free task, introduce yourself naturally."
        ),
        "passing_threshold": 70,
    }


@router.post("/assessment/submit")
async def submit_assessment(
    body: AssessmentSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.items:
        return {"total_score": 0, "passed": False, "breakdown": []}

    total = sum(item.get("score", 0) for item in body.items)
    avg_score = total / len(body.items)
    passed = avg_score >= 70

    # Award XP if passed
    if passed:
        try:
            from backend.app.models.user import Profile
            from sqlalchemy.future import select as sa_select
            stmt = sa_select(Profile).where(Profile.user_id == current_user.id)
            res = await db.execute(stmt)
            profile = res.scalars().first()
            if profile:
                profile.total_xp = (profile.total_xp or 0) + 150
                await db.commit()
        except Exception as e:
            print(f"XP award error: {e}", flush=True)

    return {
        "total_score": round(avg_score, 1),
        "passed": passed,
        "breakdown": body.items,
        "xp_awarded": 150 if passed else 0,
        "message": (
            "Phase 5 Speaking Lab completed! You've unlocked Conversation Mode." if passed
            else "Good effort! Review the pronunciation drill and try again when ready."
        ),
    }


# ---------------------------------------------------------------------------
# Screen 7 – Summary & Recommendations
# ---------------------------------------------------------------------------

@router.get("/phase5/summary")
async def get_phase5_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(PronunciationAttempt)
        .where(PronunciationAttempt.user_id == current_user.id)
        .order_by(PronunciationAttempt.attempted_at.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    attempts = result.scalars().all()

    shadowing = [a for a in attempts if a.attempt_type == "shadowing"]
    pattern = [a for a in attempts if a.attempt_type == "pattern"]
    free = [a for a in attempts if a.attempt_type == "free"]

    def avg(lst):
        return round(sum(a.accuracy_score for a in lst) / len(lst) * 100, 1) if lst else 0

    shadowing_avg = avg(shadowing)
    pattern_avg = avg(pattern)
    free_avg = avg(free)
    overall = avg(attempts)

    # Score trend (last 5 shadowing attempts)
    trend = [round(a.accuracy_score * 100, 1) for a in reversed(shadowing[-5:])]

    # Recommendations
    recs = []
    if shadowing_avg < 70:
        recs.append("Review Hangeul vowel minimal pairs — especially ㅓ vs ㅗ and ㅡ vs ㅜ.")
    if pattern_avg < 70:
        recs.append("Practice substitution drills: vary the slot values in the sentence patterns.")
    if free_avg < 50:
        recs.append("Focus on building 2–3 sentence responses before attempting longer free speech.")
    if overall >= 75:
        recs.append("You're ready — try Conversation Mode with tutor Gwan-Sik!")

    return {
        "shadowing_avg": shadowing_avg,
        "pattern_avg": pattern_avg,
        "free_speaking_avg": free_avg,
        "overall_avg": overall,
        "trend": trend,
        "total_attempts": len(attempts),
        "recommendations": recs or ["Keep practicing! Every repetition builds muscle memory."],
        "patterns_practiced": ["Self-introduction", "Country of origin", "Likes & hobbies"],
        "next_module": "Conversation Mode – simple role-plays with Gwan-Sik",
    }
