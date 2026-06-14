"""
Phase 6 – Conversation Mode API Endpoints
Handles scenario selection, stateful chats, mid-convo scaffolding hints,
post-chat evaluations, and annotated transcript reviews.
"""
import uuid
import difflib
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from backend.app.core.database import get_db
from backend.app.api.v1.auth import get_current_user
from backend.app.models.user import User, Profile
from backend.app.models.study import Conversation, Message, MasteryScore
from backend.app.services.speech_ai import speech_ai_service
from backend.app.services.rag_engine import rag_engine_service

router = APIRouter()

# ---------------------------------------------------------------------------
# Scenarios Catalog Data
# ---------------------------------------------------------------------------
CONVERSATION_SCENARIOS = [
    {
        "id": "cafe",
        "title": "At a Café – Ordering a Drink",
        "description": "You enter a cozy café in Seoul. Order your favorite beverage, ask about the price, and pay for the drink.",
        "cefr_level": "A1",
        "focus_grammar": "Polite present tense (-아/어요), Polite requests (-주세요)",
        "focus_vocab": "Coffee (커피), Tea (차), Americano (아메리카노), Ice (아이스), Price (얼마예요)",
        "role": "Barista (바리스타)",
        "opener": "안녕하세요! 어서 오세요. 주문하시겠어요?",
        "key_phrases": ["아메리카노 주세요", "이거 얼마예요?", "따뜻한 거 주세요", "아이스로 주세요"],
        "rag_notes": "At a Korean cafe, you request ice by saying '아이스로' or hot by saying '따뜻한 걸로'. Particle '주세요' is appended to nouns for polite requests.",
        "vocab_words": ["커피", "차", "아메리카노", "아이스", "얼마"]
    },
    {
        "id": "greeting",
        "title": "Meeting Someone for the First Time",
        "description": "Introduce yourself to a new colleague or classmate. Exchange names, discuss where you are from, and express pleasure in meeting them.",
        "cefr_level": "A1",
        "focus_grammar": "Topic particle (-은/는), Copula (-예요/이에요)",
        "focus_vocab": "Name (이름), Country (나라), Student (학생), Nice to meet you (반갑습니다)",
        "role": "New Friend (친구)",
        "opener": "안녕하세요! 처음 뵙겠습니다. 제 이름은 지은이에요. 이름이 어떻게 되세요?",
        "key_phrases": ["제 이름은 _예요", "저는 _에서 왔어요", "반갑습니다"],
        "rag_notes": "When meeting someone, say '처음 뵙겠습니다' (nice to meet you) or '반갑습니다'. Use -은/는 for topic focus.",
        "vocab_words": ["이름", "나라", "학생", "반갑다"]
    },
    {
        "id": "hobbies",
        "title": "Talking About Your Hobbies",
        "description": "Discuss your favorite spare time activities, food, and what you enjoy doing on weekends.",
        "cefr_level": "A1",
        "focus_grammar": "Likes (-을/를 좋아해요), Connective (-고, 그리고)",
        "focus_vocab": "Hobbies (취미), Food (음식), Weekends (주말), Music (음악), Cooking (요리)",
        "role": "Language Partner (언어 교환 파트너)",
        "opener": "요즘 주말에 보통 뭐 하세요? 취미가 뭐예요?",
        "key_phrases": ["저는 _을 좋아해요", "주말에 _해요", "그리고 요리도 좋아해요"],
        "rag_notes": "To express likes, use '[Noun]을/를 좋아해요'. To link clauses or sentences, use '-고' or '그리고'.",
        "vocab_words": ["취미", "음식", "주말", "음악", "요리"]
    },
    {
        "id": "hotel",
        "title": "Checking In at a Hotel",
        "description": "You arrived at a hotel in Busan. Confirm your reservation name, ask about breakfast timing, and request extra towels.",
        "cefr_level": "A2",
        "focus_grammar": "Existence/Possession (-이/가 있어요), Requesting actions (-아/어 주세요)",
        "focus_vocab": "Reservation (예약), Room (방), Key (열쇠), Breakfast (조식), Towel (수건)",
        "role": "Hotel Receptionist (호텔 직원)",
        "opener": "어서 오세요, 부산 오션 호텔입니다. 예약자 성함이 어떻게 되시나요?",
        "key_phrases": ["예약했어요", "조식은 몇 시예요?", "수건을 더 주세요"],
        "rag_notes": "For check-in, use '예약했어요' (I made a reservation). Asking about time: '몇 시예요?'. Asking for items: '[Noun]이/가 있어요?' or '[Noun] 주세요'.",
        "vocab_words": ["예약", "방", "열쇠", "조식", "수건"]
    }
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
async def _call_llama_tutor(prompt: str) -> str:
    """Helper to call local/cloud reasoning LLM."""
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
            "temperature": 0.6,
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
        print(f"Error calling Llama: {e}", flush=True)
    return ""

def _levenshtein_score(target: str, recognized: str) -> float:
    if not target or not recognized:
        return 0.0
    ratio = difflib.SequenceMatcher(None, target.strip(), recognized.strip()).ratio()
    return round(ratio * 100, 1)

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/phase6/metadata")
async def get_phase6_metadata(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns Phase 6 target details customized using learner profile data.
    """
    # Fetch User Profile info
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    user_level = profile.level_progress if profile else 1
    
    # Query weak points
    stmt_mastery = select(MasteryScore).where(MasteryScore.user_id == current_user.id, MasteryScore.score < 0.7)
    res_mastery = await db.execute(stmt_mastery)
    weak_items = res_mastery.scalars().all()
    
    suggested_scenario = "Meeting Someone" if user_level == 1 else "Checking In at a Hotel"
    
    return {
        "title": "Conversation Lab 1 – Guided Role‑Plays",
        "description": "Practice short, realistic Korean conversations (3–8 turns) with an AI partner tuned to your level.",
        "cefr_band": "A1/A2",
        "suggested_scenario": suggested_scenario,
        "weak_areas_found": len(weak_items) > 0,
        "total_scenarios": len(CONVERSATION_SCENARIOS),
        "typical_duration_minutes": 10
    }

@router.get("/scenarios")
async def list_scenarios(
    level: str = Query("A1"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns scenarios list highlighting recommended ones mapped to the user's weak points.
    """
    # Fetch user weak items
    stmt = select(MasteryScore).where(MasteryScore.user_id == current_user.id, MasteryScore.score < 0.70)
    res = await db.execute(stmt)
    weak_items = res.scalars().all()
    weak_words = {w.item_id for w in weak_items} # Placeholder match

    scenarios = []
    for s in CONVERSATION_SCENARIOS:
        is_recommended = False
        # Simple heuristic matching
        if s["id"] == "cafe" and "주세요" in str(weak_words):
            is_recommended = True
        elif s["id"] == "greeting" and level == "A1":
            is_recommended = True # Default for A1
            
        scenarios.append({
            **s,
            "recommended": is_recommended
        })
        
    return {
        "recommended": [s for s in scenarios if s["recommended"]],
        "scenarios": scenarios
    }

@router.post("/session/start")
async def start_conversation_session(
    scenario_id: str = Form(...),
    mode: str = Form("text"), # text | voice
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Initiates a new role-play session. Saves a Conversation instance and
    posts the opener message from Gwan-Sik.
    """
    scenario = next((s for s in CONVERSATION_SCENARIOS if s["id"] == scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    # Create Conversation Session
    conv = Conversation(
        user_id=current_user.id,
        topic=f"Role-Play: {scenario['title']}",
        scenario_id=scenario_id,
        mode=mode,
        turn_count=0
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)

    # Save Opener as the first assistant message
    opener_msg = Message(
        conversation_id=conv.id,
        sender_role="assistant",
        content=scenario["opener"],
        correction_metadata={
            "english_translation": "Welcome! Ordering a drink? / Hello, Nice to meet you. / What is your name?",
            "correction": None,
            "grammar_notes": scenario["rag_notes"]
        }
    )
    db.add(opener_msg)
    await db.commit()

    return {
        "session_id": conv.id,
        "title": scenario["title"],
        "role": scenario["role"],
        "cefr_level": scenario["cefr_level"],
        "focus_grammar": scenario["focus_grammar"],
        "focus_vocab": scenario["focus_vocab"],
        "mode": mode,
        "opener": scenario["opener"],
        "opener_translation": opener_msg.correction_metadata["english_translation"]
    }

@router.post("/session/{session_id}/turn")
async def conversation_session_turn(
    session_id: uuid.UUID,
    user_text: Optional[str] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Executes a single conversational turn. Performs STT if voice mode, scores pronunciation,
    retrieves context, gets LLM response, and saves turn to database.
    """
    stmt = select(Conversation).where(Conversation.id == session_id, Conversation.user_id == current_user.id)
    res = await db.execute(stmt)
    conv = res.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found")
        
    scenario = next((s for s in CONVERSATION_SCENARIOS if s["id"] == conv.scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario config mismatch")

    # STT if voice/audio provided
    recognized = ""
    pron_score = None
    if audio_file:
        audio_bytes = await audio_file.read()
        recognized = await speech_ai_service.transcribe_audio(audio_bytes)
        # score pronunciation using helper
        score_res = await speech_ai_service.score_pronunciation(audio_bytes, recognized or "안녕하세요")
        pron_score = score_res["accuracy_score"]
    else:
        recognized = user_text or ""

    if not recognized.strip():
        raise HTTPException(status_code=400, detail="Empty text or voice input")

    # Save User message
    user_msg = Message(
        conversation_id=session_id,
        sender_role="user",
        content=recognized,
        correction_metadata={
            "pron_score": pron_score
        }
    )
    db.add(user_msg)
    conv.turn_count += 1
    await db.commit()

    # RAG dynamic retrieve context matching scenario phrases
    retrieved_chunks = await rag_engine_service.hybrid_retrieve(db, recognized, limit=2)
    context_str = "\n".join([chunk["content"] for chunk in retrieved_chunks])

    # Fetch dialogue history
    stmt_history = select(Message).where(Message.conversation_id == session_id).order_by(Message.created_at.asc())
    res_history = await db.execute(stmt_history)
    history_msgs = res_history.scalars().all()
    history_str = "\n".join([f"{'User' if m.sender_role == 'user' else 'Tutor Gwan-Sik'}: {m.content}" for m in history_msgs])

    # LLM Tutor Prompt
    llm_prompt = (
        f"You are tutor Gwan-Sik, a warm and encouraging Korean language coach.\n"
        f"We are role-playing the scenario: '{scenario['title']}'. Your role: '{scenario['role']}'.\n"
        f"CEFR target: {scenario['cefr_level']}. Speak in simple, short Korean sentences appropriate for A1/A2.\n"
        f"RAG materials helper notes: {scenario['rag_notes']}\n"
        f"Retrieved curriculum chunks: {context_str}\n\n"
        f"Conversation History:\n{history_str}\n\n"
        f"Task: Generate Gwan-Sik's next turn. Speak MOSTLY in Korean. Keep it under 2 sentences.\n"
        f"You MUST format the output as a JSON block with four keys: 'reply' (Korean), 'english_translation' (English translation of your reply), 'correction' (provide a correction in simple English ONLY if the user's last message had a grammar or politeness mistake, else null), and 'grammar_notes' (a brief one-sentence tip or rule, else null).\n"
        f"Example JSON format:\n{{\n  \"reply\": \"아이스 아메리카노 맞으세요? 얼마예요.\",\n  \"english_translation\": \"Is an iced americano correct? That will be [price].\",\n  \"correction\": \"You should say '아이스 아메리카노요' instead of '아이스 아메리카노'.\",\n  \"grammar_notes\": \"Use -요 suffix for polite speech.\"\n}}"
    )

    tutor_json = await _call_llama_tutor(llm_prompt)
    
    # Parse reply
    reply = ""
    english_translation = ""
    correction = None
    grammar_notes = None
    
    try:
        # strip any markdown backticks
        clean_json = tutor_json.strip()
        if "```json" in clean_json:
            clean_json = clean_json.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_json:
            clean_json = clean_json.split("```")[1].split("```")[0].strip()
            
        data = json_loads_safe(clean_json)
        reply = data.get("reply", "")
        english_translation = data.get("english_translation", "")
        correction = data.get("correction")
        grammar_notes = data.get("grammar_notes")
    except Exception:
        # Fallback if json parsing failed
        reply = "좋습니다! 다음은 무엇을 드릴까요?"
        english_translation = "Great! What can I get you next?"

    # Save Assistant response
    assist_msg = Message(
        conversation_id=session_id,
        sender_role="assistant",
        content=reply,
        correction_metadata={
            "english_translation": english_translation,
            "correction": correction,
            "grammar_notes": grammar_notes
        }
    )
    db.add(assist_msg)
    await db.commit()

    # Generate TTS link if in voice mode
    tts_url = None
    if conv.mode == "voice":
        tts_url = f"/speech/tts?text={reply}&lang=ko"

    return {
        "recognized_text": recognized,
        "reply": reply,
        "english_translation": english_translation,
        "correction": correction,
        "grammar_notes": grammar_notes,
        "tts_url": tts_url,
        "pron_score": pron_score
    }

@router.get("/session/{session_id}/hints")
async def get_conversation_hints(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns 3 phrase hints, 3 vocabulary hints, and 1 grammar hint to scaffold learners.
    """
    stmt = select(Conversation).where(Conversation.id == session_id, Conversation.user_id == current_user.id)
    res = await db.execute(stmt)
    conv = res.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Session not found")
        
    scenario = next((s for s in CONVERSATION_SCENARIOS if s["id"] == conv.scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario mismatch")

    # Author scenario hints
    vocab_hints = [{"word": w, "meaning": "Target word"} for w in scenario["vocab_words"][:3]]
    phrase_hints = scenario["key_phrases"][:3]
    grammar_hint = {
        "pattern": scenario["focus_grammar"].split(",")[0],
        "example": scenario["key_phrases"][0]
    }
    
    return {
        "vocab_hints": vocab_hints,
        "phrase_hints": phrase_hints,
        "grammar_hint": grammar_hint
    }

@router.post("/session/{session_id}/evaluate")
async def evaluate_conversation_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Evaluates transcript logs using LLM scoring tutor feedback models.
    Updates user level progress and mastery parameters.
    """
    stmt = select(Conversation).where(Conversation.id == session_id, Conversation.user_id == current_user.id)
    res = await db.execute(stmt)
    conv = res.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Session not found")
        
    scenario = next((s for s in CONVERSATION_SCENARIOS if s["id"] == conv.scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario mismatch")

    # Fetch messages
    stmt_msg = select(Message).where(Message.conversation_id == session_id).order_by(Message.created_at.asc())
    res_msg = await db.execute(stmt_msg)
    messages = res_msg.scalars().all()
    
    user_turns = [m.content for m in messages if m.sender_role == "user"]
    ai_turns = [m.content for m in messages if m.sender_role == "assistant"]
    
    transcript_str = "\n".join([f"{'User' if m.sender_role == 'user' else 'Tutor Gwan-Sik'}: {m.content}" for m in messages])

    # Run LLM evaluator call
    eval_prompt = (
        f"You are the senior evaluator agent for HangeulAI.\n"
        f"Evaluate the following Korean A1/A2 conversation role-play scenario: '{scenario['title']}'.\n\n"
        f"Transcript:\n{transcript_str}\n\n"
        f"Analyze the transcript across these criteria:\n"
        f"1. Task Completion (0-100): Did the user successfully complete the scenario goals?\n"
        f"2. Language Accuracy (0-100): Did they make grammar/politeness mistakes?\n"
        f"3. Vocabulary Variety (0-100): Did they employ appropriate scenario terminology?\n\n"
        f"You MUST return a JSON block with the following keys: 'task_completion_score' (number), 'accuracy_score' (number), 'vocabulary_score' (number), 'overall_score' (number), 'summary' (short string), 'strengths' (list of strings), and 'suggestions' (list of strings).\n"
        f"Keep the summary and suggestions simple and brief."
    )

    eval_json = await _call_llama_tutor(eval_prompt)
    
    # Defaults
    tc_score = 80.0
    acc_score = 75.0
    vocab_score = 70.0
    ov_score = 75.0
    summary = "Good effort! You managed to complete the role-play scenario and ordered your drink successfully."
    strengths = ["Used greeting correctly", "Expressed request politely with 주세요"]
    suggestions = ["Pay closer attention to object particles", "Vary your beverage selections"]

    try:
        clean_json = eval_json.strip()
        if "```json" in clean_json:
            clean_json = clean_json.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_json:
            clean_json = clean_json.split("```")[1].split("```")[0].strip()
        data = json_loads_safe(clean_json)
        tc_score = float(data.get("task_completion_score", tc_score))
        acc_score = float(data.get("accuracy_score", acc_score))
        vocab_score = float(data.get("vocabulary_score", vocab_score))
        ov_score = float(data.get("overall_score", ov_score))
        summary = data.get("summary", summary)
        strengths = data.get("strengths", strengths)
        suggestions = data.get("suggestions", suggestions)
    except Exception:
        pass

    # Heuristic fluency score from user pronunciation attempts
    pron_scores = [m.correction_metadata.get("pron_score") for m in messages if m.sender_role == "user" and m.correction_metadata and m.correction_metadata.get("pron_score")]
    fluency = round(sum(pron_scores) / len(pron_scores), 1) if pron_scores else 80.0

    # Save scores to Conversation
    conv.overall_score = ov_score
    conv.task_completion_score = tc_score
    conv.accuracy_score = acc_score
    conv.fluency_score = fluency
    await db.commit()

    # Award User XP (150 XP for completing a conversation)
    try:
        stmt_prof = select(Profile).where(Profile.user_id == current_user.id)
        res_prof = await db.execute(stmt_prof)
        profile = res_prof.scalars().first()
        if profile:
            profile.total_xp = (profile.total_xp or 0) + 150
            await db.commit()
    except Exception as e:
        print(f"XP award error: {e}", flush=True)

    return {
        "overall_score": ov_score,
        "task_completion_score": tc_score,
        "accuracy_score": acc_score,
        "vocabulary_score": vocab_score,
        "fluency_score": fluency,
        "summary": summary,
        "strengths": strengths,
        "suggestions": suggestions,
        "xp_awarded": 150
    }

@router.get("/session/{session_id}/review")
async def get_conversation_review(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns annotated conversation transcript review logs,
    generates correction exercises, and provides curriculum redirect links.
    """
    stmt = select(Conversation).where(Conversation.id == session_id, Conversation.user_id == current_user.id)
    res = await db.execute(stmt)
    conv = res.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Session not found")

    stmt_msg = select(Message).where(Message.conversation_id == session_id).order_by(Message.created_at.asc())
    res_msg = await db.execute(stmt_msg)
    messages = res_msg.scalars().all()

    # Compile annotated transcript
    transcript = []
    correction_exercises = []
    
    for m in messages:
        sender = "user" if m.sender_role == "user" else "ai"
        item = {
            "id": str(m.id),
            "sender": sender,
            "text": m.content,
            "correction": m.correction_metadata.get("correction") if m.correction_metadata else None,
            "english_translation": m.correction_metadata.get("english_translation") if m.correction_metadata else None,
            "grammar_notes": m.correction_metadata.get("grammar_notes") if m.correction_metadata else None
        }
        transcript.append(item)
        
        # If user turn had a correction, construct a mini quiz exercise!
        if sender == "user" and m.correction_metadata and m.correction_metadata.get("correction"):
            correction_exercises.append({
                "message_id": str(m.id),
                "original": m.content,
                "hint": "Try using the correct politeness particles or forms.",
                "correction": m.correction_metadata.get("correction"),
                "explanation": m.correction_metadata.get("grammar_notes") or "Ensure standard polite endings (-요)."
            })

    # Default fallbacks if no corrections recorded
    if not correction_exercises:
        correction_exercises.append({
            "message_id": "mock_ex_1",
            "original": "아메리카노 원해요",
            "hint": "Use the polite request form '-주세요' instead of '원해요' (want).",
            "correction": "아메리카노 주세요",
            "explanation": "주세요 is the default polite request format in cafes/stores."
        })

    # Determine practice redirect mapping
    practice_redirects = []
    if conv.accuracy_score and conv.accuracy_score < 75:
        practice_redirects.append({
            "phase": 2,
            "title": "Phase 2 – Consonant Foundations",
            "reason": "Review plain/aspirated/tense consonants structures to improve particle spelling."
        })
    if conv.fluency_score and conv.fluency_score < 75:
        practice_redirects.append({
            "phase": 5,
            "title": "Phase 5 – Speaking Lab",
            "reason": "Train minimal pair shadowing drills to enhance pronunciation."
        })
    else:
        practice_redirects.append({
            "phase": 3,
            "title": "Phase 3 – Syllable Blocks & Writing",
            "reason": "Review syllable block placements for advanced vocabulary combinations."
        })

    return {
        "transcript": transcript,
        "exercises": correction_exercises,
        "redirects": practice_redirects
    }

# Safe JSON Loader
def json_loads_safe(s: str) -> dict:
    import json
    return json.loads(s)
