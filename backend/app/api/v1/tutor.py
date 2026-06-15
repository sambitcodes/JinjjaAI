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
