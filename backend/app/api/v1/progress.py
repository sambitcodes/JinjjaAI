from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.core.database import get_db
from backend.app.api.v1.auth import get_current_user
from backend.app.models.user import User, Profile
from backend.app.models.study import MasteryScore, PronunciationAttempt
from backend.app.models.lesson import CuratedLesson
from backend.app.schemas.user import ProfileResponse, ProfileUpdate
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel

router = APIRouter()

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.patch("/profile", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if payload.display_name is not None:
        profile.display_name = payload.display_name
    if payload.native_language is not None:
        profile.native_language = payload.native_language
    if payload.level_progress is not None:
        profile.level_progress = payload.level_progress
    if payload.dob is not None:
        profile.dob = payload.dob
    if payload.gender is not None:
        profile.gender = payload.gender
    if payload.study_reason is not None:
        profile.study_reason = payload.study_reason
    if payload.occupation is not None:
        profile.occupation = payload.occupation
    if payload.korean_culture_experience is not None:
        profile.korean_culture_experience = payload.korean_culture_experience
    if payload.korean_proficiency is not None:
        profile.korean_proficiency = payload.korean_proficiency
    if payload.korean_name is not None:
        profile.korean_name = payload.korean_name
    if payload.avatar_base64 is not None:
        profile.avatar_base64 = payload.avatar_base64
    if payload.course_states is not None:
        profile.course_states = payload.course_states
    if payload.activity_log is not None:
        profile.activity_log = payload.activity_log
    if payload.scheduled_courses is not None:
        profile.scheduled_courses = payload.scheduled_courses
        
    await db.commit()
    await db.refresh(profile)
    return profile

class GenerateNameRequest(BaseModel):
    name: str
    dob: str
    gender: str = "Prefer not to say"
    study_reason: str
    occupation: str
    korean_culture_experience: str
    korean_proficiency: str

@router.post("/profile/generate-korean-name")
async def generate_korean_name(
    payload: GenerateNameRequest,
    current_user: User = Depends(get_current_user)
):
    import httpx
    import json
    
    prompt = (
        "You are a master traditional Korean naming expert.\n"
        f"Generate a beautiful, culturally authentic, and meaningful Korean name for a student with these details:\n"
        f"- English/Original Name: {payload.name}\n"
        f"- DOB: {payload.dob}\n"
        f"- Gender Identity: {payload.gender}\n"
        f"- Reason for studying Korean: {payload.study_reason}\n"
        f"- Current Occupation: {payload.occupation}\n"
        f"- Korean Culture Experience: {payload.korean_culture_experience}\n"
        f"- Korean Language Proficiency: {payload.korean_proficiency}\n\n"
        "IMPORTANT: Generate a name that is culturally appropriate for the person's gender identity. "
        "For Male, use traditionally masculine Korean names (e.g. 서준, 민준, 지훈). "
        "For Female, use traditionally feminine Korean names (e.g. 지우, 서연, 민선). "
        "For Non-binary, gender-neutral, or 'Prefer not to say', use beautiful gender-neutral Korean names (e.g. 지우, 유나, 하늘).\n"
        "Generate a fun, warm, and highly personalized Korean name in Hangul (2 syllables usually). "
        "Explain the deep meaning of the syllables and write a warm, encouraging explanation of why this name perfectly fits their background.\n\n"
        "Return the response in strict JSON format with these exact keys:\n"
        "{\n"
        '  "korean_name": "the Korean name in Hangul letters",\n'
        '  "pronunciation": "the English phonetic spelling of the Korean name",\n'
        '  "meaning": "a detailed, warm, and inspiring explanation of the name\'s meaning and its alignment with their background"\n'
        "}"
    )

    try:
        from backend.app.core.config import settings
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": "You are an elite Korean naming specialist. Output strict JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.7
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                res_data = response.json()
                content = res_data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                return parsed
    except Exception as e:
        print(f"!!! Name generator failed, using default: {e}", flush=True)
        
    # Standard graceful fallback
    return {
        "korean_name": "슬기",
        "pronunciation": "Seul-gi",
        "meaning": "Meaning 'wisdom' in pure native Korean. Generated as a perfect fit for a diligent learner starting their journey!"
    }

@router.post("/xp/add", response_model=ProfileResponse)
async def add_xp(
    amount: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Update XP
    profile.total_xp = max(0, profile.total_xp + amount)
    
    # Calculate real-time streak
    now = datetime.now(timezone.utc)
    if profile.last_active:
        time_diff = now.date() - profile.last_active.date()
        if time_diff == timedelta(days=1):
            profile.current_streak += 1
        elif time_diff > timedelta(days=1):
            profile.current_streak = 1
    else:
        profile.current_streak = 1
        
    profile.last_active = now

    # Level formula: level = floor(sqrt(xp / 100)) + 1
    import math
    new_level = math.floor(math.sqrt(profile.total_xp / 100)) + 1
    profile.level_progress = max(1, new_level)
        
    await db.commit()
    await db.refresh(profile)
    return profile

class RecordMasteryRequest(BaseModel):
    item_type: str  # "vocabulary" or "grammar"
    item_string: str  # e.g. "사과", "은/는"
    is_correct: bool

@router.post("/mastery/record")
async def record_mastery(
    payload: RecordMasteryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import uuid
    item_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, payload.item_string)
    stmt_ms = select(MasteryScore).where(
        MasteryScore.user_id == current_user.id,
        MasteryScore.item_type == payload.item_type,
        MasteryScore.item_id == item_uuid
    )
    res_ms = await db.execute(stmt_ms)
    ms = res_ms.scalars().first()
    if not ms:
        ms = MasteryScore(
            id=uuid.uuid4(),
            user_id=current_user.id,
            item_type=payload.item_type,
            item_id=item_uuid,
            score=0.0,
            repetitions=0
        )
        db.add(ms)
    
    ms.repetitions += 1
    if payload.is_correct:
        ms.score = min(1.0, ms.score + 0.25)
    else:
        ms.score = max(0.0, ms.score - 0.2)
        
    await db.commit()
    return {"status": "success", "score": ms.score}

@router.get("/stats")
async def get_curriculum_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Count curated lessons completed from profile course_states instead of CuratedLesson rows
    stmt_prof = select(Profile).where(Profile.user_id == current_user.id)
    res_prof = await db.execute(stmt_prof)
    profile = res_prof.scalars().first()
    
    completed_lessons = 0
    if profile and profile.course_states:
        for cid, state in profile.course_states.items():
            if isinstance(state, dict):
                completed_lessons += len(state.get("completedPhases", []))

    # 2. Fetch vocabulary mastery average
    stmt_vocab = select(MasteryScore).where(MasteryScore.user_id == current_user.id, MasteryScore.item_type == "vocabulary")
    res_vocab = await db.execute(stmt_vocab)
    vocab_scores = res_vocab.scalars().all()
    # MasteryScore.score is scaled 0.0 - 1.0, so multiply by 100 for percentage
    vocab_avg = round(sum(v.score for v in vocab_scores) / len(vocab_scores) * 100, 1) if vocab_scores else 0.0

    # 3. Fetch grammar mastery average
    stmt_gram = select(MasteryScore).where(MasteryScore.user_id == current_user.id, MasteryScore.item_type == "grammar")
    res_gram = await db.execute(stmt_gram)
    gram_scores = res_gram.scalars().all()
    gram_avg = round(sum(g.score for g in gram_scores) / len(gram_scores) * 100, 1) if gram_scores else 0.0

    # 4. Fetch average pronunciation accuracy
    stmt_speech = select(PronunciationAttempt).where(PronunciationAttempt.user_id == current_user.id)
    res_speech = await db.execute(stmt_speech)
    attempts = res_speech.scalars().all()
    speech_avg = round(sum(a.accuracy_score for a in attempts) / len(attempts), 1) if attempts else 0.0

    # If no lessons completed and no scores recorded yet, baseline is 0.0
    return {
        "vocab_mastery": min(vocab_avg + (completed_lessons * 2.5), 100.0) if (vocab_scores or completed_lessons > 0) else 0.0,
        "grammar_mastery": min(gram_avg + (completed_lessons * 3.0), 100.0) if (gram_scores or completed_lessons > 0) else 0.0,
        "pronunciation_average": speech_avg,
        "lessons_completed": completed_lessons
    }

@router.post("/reset", response_model=ProfileResponse)
async def reset_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch user profile
    stmt_prof = select(Profile).where(Profile.user_id == current_user.id)
    res_prof = await db.execute(stmt_prof)
    profile = res_prof.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # 2. Delete dynamic learning assets
    from sqlalchemy import delete
    await db.execute(delete(CuratedLesson).where(CuratedLesson.user_id == current_user.id))
    await db.execute(delete(MasteryScore).where(MasteryScore.user_id == current_user.id))
    await db.execute(delete(PronunciationAttempt).where(PronunciationAttempt.user_id == current_user.id))

    # 3. Reset Profile stats
    profile.total_xp = 0
    profile.current_streak = 0
    profile.level_progress = 1
    profile.last_active = datetime.now(timezone.utc)
    profile.course_states = {}
    profile.activity_log = []
    profile.scheduled_courses = []

    await db.commit()
    await db.refresh(profile)
    return profile

@router.get("/activity-summary")
async def get_activity_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res_prof = await db.execute(stmt)
    profile = res_prof.scalars().first()
    
    if not profile or not profile.course_states:
        return {"summary": "You haven't started any courses yet. Once you complete a phase or study, a summary of your achievements will appear here!"}
    
    from backend.app.curriculum import PREGENERATED_LESSONS
    
    completed_info = []
    for cid_str, state in profile.course_states.items():
        try:
            cid = int(cid_str)
        except ValueError:
            continue
        completed_phases = state.get("completedPhases", [])
        last_phase = state.get("lastPhase", 0)
        
        course_data = PREGENERATED_LESSONS.get(cid, {})
        if not course_data:
            continue
        
        # Course title (usually stored on one of the phases or we fallback)
        first_phase_data = course_data.get(1, {})
        course_title = first_phase_data.get("title", f"Course {cid}").split(" – ")[0]
        
        comp_names = []
        for p in completed_phases:
            p_data = course_data.get(p, {})
            if p_data:
                comp_names.append(p_data.get("title", f"Phase {p}"))
                
        last_phase_name = ""
        if last_phase:
            lp_data = course_data.get(last_phase, {})
            if lp_data:
                last_phase_name = lp_data.get("title", f"Phase {last_phase}")
                
        completed_info.append({
            "course": course_title,
            "completed_phases": comp_names,
            "last_active_phase": last_phase_name
        })
        
    if not completed_info:
        return {"summary": "You haven't completed any phases yet. Start studying on the Lessons page!"}
        
    prompt = (
        "You are an inspiring, warm, and expert Korean language coach.\n"
        "Based on the student's curriculum completion data, generate a well-formatted markdown summary of what they have learned.\n"
        "Keep the tone extremely encouraging, highlighting key linguistic milestones for each course/phase.\n\n"
        "Here is the student's progress:\n"
    )
    for info in completed_info:
        prompt += f"- **{info['course']}**:\n"
        if info['completed_phases']:
            prompt += f"  - Completed Phases: {', '.join(info['completed_phases'])}\n"
        if info['last_active_phase']:
            prompt += f"  - Currently Studying: {info['last_active_phase']}\n"
            
    prompt += (
        "\nGenerate a beautifully structured markdown summary. For each course/phase listed above: \n"
        "1. Summarize the key concepts covered (e.g. reading vowels/consonants, speaking polite present endings, Sino-Korean numbers, past/future routines, or tenses).\n"
        "2. Keep the descriptions clear, distinct, and separate per course/phase.\n"
        "3. Add a short, warm sentence of encouragement at the end.\n"
        "Do not use generic text; tailor it directly to the topics in these specific phases."
    )
    
    import httpx
    try:
        from backend.app.core.config import settings
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": "You are a professional Korean language coaching assistant. Output markdown content."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7
                },
                timeout=30.0
            )
            if response.status_code == 200:
                res_data = response.json()
                summary = res_data["choices"][0]["message"]["content"]
                return {"summary": summary}
    except Exception as e:
        print(f"!!! Groq activity summary failed: {e}", flush=True)
        
    fallback = "# Your Learning Achievements\n\n"
    for info in completed_info:
        fallback += f"### {info['course']}\n"
        if info['completed_phases']:
            fallback += f"- **Completed Phases**: {', '.join(info['completed_phases'])}\n"
        if info['last_active_phase']:
            fallback += f"- **Active Focus**: Currently studying {info['last_active_phase']}.\n"
        fallback += "\n"
    fallback += "\n*Excellent work! Keep going, consistency is key to mastering Korean!*"
    return {"summary": fallback}
