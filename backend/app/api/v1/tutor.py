import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.core.database import get_db
from backend.app.api.v1.auth import get_current_user
from backend.app.models.user import User
from backend.app.models.study import Conversation, Message
from pydantic import BaseModel
from typing import List

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    model: str | None = None
    base_language: str | None = "korean"

class ChatResponse(BaseModel):
    reply: str
    english_translation: str | None = None
    correction: str | None = None
    grammar_notes: str | None = None
    suggested_options: List[str] | None = None

@router.post("/conversations", response_model=dict)
async def create_conversation(
    topic: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = Conversation(user_id=current_user.id, topic=topic)
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return {"id": conv.id, "topic": conv.topic, "started_at": conv.started_at}

@router.get("/conversations", response_model=List[dict])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Conversation).where(Conversation.user_id == current_user.id).order_by(Conversation.started_at.desc())
    result = await db.execute(stmt)
    convs = result.scalars().all()
    
    filtered_convs = []
    for c in convs:
        stmt_msg = select(Message).where(Message.conversation_id == c.id)
        res_msg = await db.execute(stmt_msg)
        if len(res_msg.scalars().all()) > 0:
            filtered_convs.append(c)
            
    return [{"id": c.id, "topic": c.topic, "started_at": c.started_at} for c in filtered_convs]

@router.get("/conversations/{conv_id}/messages", response_model=List[dict])
async def get_conversation_messages(
    conv_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt_conv = select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == current_user.id)
    res_conv = await db.execute(stmt_conv)
    if not res_conv.scalars().first():
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    stmt = select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at.asc())
    result = await db.execute(stmt)
    messages = result.scalars().all()
    return [
        {
            "sender": "user" if m.sender_role == "user" else "ai",
            "text": m.content,
            "displayedText": m.content,
            "correction": m.correction_metadata.get("correction") if m.correction_metadata else None,
            "grammarNotes": m.correction_metadata.get("grammar_notes") if m.correction_metadata else None,
            "englishTranslation": m.correction_metadata.get("english_translation") if m.correction_metadata else None,
            "suggestedOptions": m.correction_metadata.get("suggested_options") if m.correction_metadata else None,
            "showTranslation": False
        }
        for m in messages
    ]

@router.post("/conversations/{conv_id}/chat", response_model=ChatResponse)
async def chat_with_tutor(
    conv_id: uuid.UUID,
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == current_user.id)
    result = await db.execute(stmt)
    conv = result.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # 1. Fetch relevant RAG chunks from pgvector database based on user message
    from backend.app.services.rag_engine import rag_engine_service
    retrieved_chunks = await rag_engine_service.hybrid_retrieve(db, payload.message, limit=3)
    context_str = "\n".join([chunk["content"] for chunk in retrieved_chunks])

    # 2. Retrieve conversation history
    stmt_history = select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at)
    res_history = await db.execute(stmt_history)
    db_messages = res_history.scalars().all()
    history = [{"sender_role": msg.sender_role, "content": msg.content} for msg in db_messages]

    if len(history) == 0:
        short_topic = payload.message[:25]
        if len(payload.message) > 25:
            short_topic += "..."
        conv.topic = short_topic

    # Save User message
    user_msg = Message(conversation_id=conv_id, sender_role="user", content=payload.message)
    db.add(user_msg)
    
    # 3. Call local AI Tutor reasoning service passing the RAG context
    from backend.app.services.ai_tutor import AITutorService
    import time
    import asyncio
    
    tutor_service = AITutorService()
    start_time = time.time()
    ai_response = await tutor_service.generate_response(
        history, payload.message, context_str, payload.model, payload.base_language or "korean"
    )
    duration_ms = (time.time() - start_time) * 1000.0
    
    reply = ai_response["reply"]
    english_translation = ai_response["english_translation"]
    correction = ai_response["correction"]
    grammar_notes = ai_response["grammar_notes"]
    suggested_options = ai_response.get("suggested_options", ["기초 모음 공부하기", "Let's learn greetings"])
    
    # Trigger AI Evaluator Daemon to dynamically rate model performance and compile SFT datasets
    from backend.app.services.evaluator_daemon import tutor_evaluator_daemon
    asyncio.create_task(tutor_evaluator_daemon.evaluate_exchange(
        model_id=payload.model or "llama-3.3-70b-versatile",
        duration_ms=duration_ms,
        user_msg=payload.message,
        reply=reply,
        grammar_notes=grammar_notes
    ))
    
    # Save Assistant response
    assist_msg = Message(
        conversation_id=conv_id, 
        sender_role="assistant", 
        content=reply,
        correction_metadata={
            "english_translation": english_translation,
            "correction": correction, 
            "grammar_notes": grammar_notes,
            "suggested_options": suggested_options
        }
    )
    db.add(assist_msg)
    await db.commit()
    
    return ChatResponse(
        reply=reply,
        english_translation=english_translation,
        correction=correction,
        grammar_notes=grammar_notes,
        suggested_options=suggested_options
    )

@router.delete("/conversations/{conv_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conv_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == current_user.id)
    result = await db.execute(stmt)
    conv = result.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Delete associated messages first
    stmt_msgs = select(Message).where(Message.conversation_id == conv_id)
    res_msgs = await db.execute(stmt_msgs)
    msgs = res_msgs.scalars().all()
    for msg in msgs:
        await db.delete(msg)
        
    await db.delete(conv)
    await db.commit()
    return

@router.get("/benchmarks", response_model=List[dict])
async def get_live_benchmarks():
    """
    Fetch the dynamically updated benchmark stats from our continuous evaluation feedback daemon.
    """
    import os
    import json
    scores_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "services", "benchmark_scores.json")
    if os.path.exists(scores_file):
        with open(scores_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


class GwanSikChatRequest(BaseModel):
    message: str
    course_id: int
    phase_num: int
    step: int
    screen_context: str | None = None
    conversation_history: List[dict] = []  # [{"role": "user"|"assistant", "content": str}]

class GwanSikChatResponse(BaseModel):
    reply: str

class GwanSikNoteRequest(BaseModel):
    course_id: int
    phase_num: int
    step: int
    screen_context: str | None = None
    conversation_history: List[dict] = []

class GwanSikNoteResponse(BaseModel):
    title: str
    keyConcepts: str
    explanation: str
    example: str
    quickRevision: str


@router.post("/gwan-sik/chat", response_model=GwanSikChatResponse)
async def gwan_sik_chat(
    payload: GwanSikChatRequest,
    current_user: User = Depends(get_current_user)
):
    system_prompt = (
        "You are Gwan-Sik, a warm, supportive, lightweight contextual study helper for a student learning Hangeul/Korean.\n"
        "Your purpose is strictly restricted to helping the learner understand the CURRENT LESSON screen only.\n"
        "Do NOT act as a general-purpose AI or tutor for anything outside this screen's scope.\n\n"
        f"CURRENT SCREEN SCOPE:\n"
        f"- Course ID: {payload.course_id}\n"
        f"- Phase Number: {payload.phase_num}\n"
        f"- Step: {payload.step}\n"
        f"- Screen Context: {payload.screen_context or 'Not specified'}\n\n"
        "CRITICAL INSTRUCTIONS:\n"
        "1. You must ONLY answer questions directly related to the Korean grammar, letters, vocabulary, examples, or explanations visible on this screen.\n"
        "2. If the user asks ANY question that is off-topic, unrelated to this specific lesson, or seeks general knowledge (e.g. 'Who won the 2022 FIFA World Cup?', 'Write a python script', 'How to bake a cake', or even unrelated general Korean grammar not visible/relevant to the current step), you MUST respond EXACTLY with:\n"
        "   'I\\'m currently designed to help only with this lesson\\'s content. Please ask a question related to the current topic.'\n"
        "3. Keep your answers brief, clear, and focused on helping the student understand this specific slide."
    )

    try:
        import httpx
        from backend.app.core.config import settings
        
        messages = [{"role": "system", "content": system_prompt}]
        for msg in payload.conversation_history:
            messages.append({
                "role": "user" if msg["role"] == "user" else "assistant",
                "content": msg["content"]
            })
        messages.append({"role": "user", "content": payload.message})

        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload_data = {
            "model": "llama-3.3-70b-versatile",
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 500
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
                reply = res_data["choices"][0]["message"]["content"].strip()
                return GwanSikChatResponse(reply=reply)
            else:
                return GwanSikChatResponse(reply="I'm currently designed to help only with this lesson's content. Please ask a question related to the current topic.")
    except Exception as e:
        print(f"Gwan-Sik API error: {e}", flush=True)
        return GwanSikChatResponse(reply="I'm currently designed to help only with this lesson's content. Please ask a question related to the current topic.")


@router.post("/gwan-sik/generate-note", response_model=GwanSikNoteResponse)
async def gwan_sik_generate_note(
    payload: GwanSikNoteRequest,
    current_user: User = Depends(get_current_user)
):
    prompt = (
        "You are Gwan-Sik, the learner's study companion.\n"
        "Analyze the following conversation and the screen content to extract a concise, structured study note in JSON format.\n\n"
        f"SCREEN CONTEXT:\n{payload.screen_context or 'Not specified'}\n\n"
        f"CONVERSATION HISTORY:\n"
    )
    for msg in payload.conversation_history:
        prompt += f"- {msg['role']}: {msg['content']}\n"
    
    prompt += (
        "\nInstructions:\n"
        "Extract a concise note. Output ONLY a valid JSON object matching this structure (do not output any other text or code blocks):\n"
        "{\n"
        "  \"title\": \"A concise title (e.g. Using 은 vs 는)\",\n"
        "  \"keyConcepts\": \"Bullet points of key concepts\",\n"
        "  \"explanation\": \"A clear, brief explanation of the grammar/rules discussed\",\n"
        "  \"example\": \"A relevant Korean sentence example with translation if present in chat or context\",\n"
        "  \"quickRevision\": \"A quick revision rule-of-thumb point\"\n"
        "}"
    )

    try:
        import httpx
        from backend.app.core.config import settings
        import json
        
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload_data = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
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
                note_json = json.loads(res_data["choices"][0]["message"]["content"].strip())
                return GwanSikNoteResponse(
                    title=note_json.get("title", "Study Note"),
                    keyConcepts=note_json.get("keyConcepts", "Korean grammar concept"),
                    explanation=note_json.get("explanation", "Contextual grammar note"),
                    example=note_json.get("example", ""),
                    quickRevision=note_json.get("quickRevision", "Practice regularly!")
                )
    except Exception as e:
        print(f"Failed to generate note: {e}", flush=True)
    
    # Fallback response
    return GwanSikNoteResponse(
        title=f"Lesson C{payload.course_id} P{payload.phase_num} Step {payload.step} Study Notes",
        keyConcepts="Main Hangeul spelling & patterns",
        explanation="Study notes based on active screen and chat feedback",
        example="",
        quickRevision="Review the lesson player syllabus map regularly."
    )
