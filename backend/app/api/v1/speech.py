from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.api.v1.auth import get_current_user
from backend.app.models.user import User
from backend.app.models.study import PronunciationAttempt
from backend.app.schemas.speech import PronunciationScoreResponse, STTResponse

from backend.app.services.speech_ai import speech_ai_service

router = APIRouter()

@router.post("/score-pronunciation", response_model=PronunciationScoreResponse)
async def score_pronunciation(
    target_text: str = Form(...),
    audio_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Read audio bytes
    audio_bytes = await audio_file.read()
    
    # Pronunciation Engine calculations using real Speech AI Service with automatic CPU fallbacks
    res = await speech_ai_service.score_pronunciation(audio_bytes, target_text)
    accuracy_score = res["accuracy_score"]
    transcription = res["transcription"]
    phoneme_details = res["phoneme_details"]
    
    attempt = PronunciationAttempt(
        user_id=current_user.id,
        target_text=target_text,
        accuracy_score=accuracy_score,
        phoneme_details=phoneme_details
    )
    db.add(attempt)
    await db.commit()
    
    return PronunciationScoreResponse(
        accuracy_score=accuracy_score,
        target_text=target_text,
        transcription=transcription,
        phoneme_details=phoneme_details
    )

import difflib

def _similarity_score(target: str, recognized: str) -> float:
    if not target or not recognized:
        return 0.0
    ratio = difflib.SequenceMatcher(None, target.strip(), recognized.strip()).ratio()
    return round(ratio * 100, 1)

@router.post("/shadow")
async def speech_shadow_check(
    target_text: str = Form(...),
    audio_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    audio_bytes = await audio_file.read()
    transcription = ""
    try:
        transcription = await speech_ai_service.transcribe_audio(audio_bytes)
    except Exception as e:
        print(f"STT error in speech shadow endpoint: {e}", flush=True)
        
    similarity = _similarity_score(target_text, transcription)
    return {
        "recognized_text": transcription,
        "similarity_score": similarity
    }

from fastapi.responses import StreamingResponse

import httpx

@router.post("/stt", response_model=STTResponse)
async def speech_to_text(
    audio_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Read audio bytes
    audio_bytes = await audio_file.read()
    
    # Transcribe speech using Whisper alignment service with auto-CPU fallback
    transcription = await speech_ai_service.transcribe_audio(audio_bytes)
    return STTResponse(transcription=transcription, language="ko")

@router.get("/tts-boundaries")
async def text_to_speech_boundaries(text: str, lang: str = "ko", voice: str = None):
    """
    Get word boundary timing information for the given text and voice from edge-tts.
    """
    if not voice or voice == "google-online" or voice == "null" or voice == "undefined":
        if lang == "ko":
            voice = "ko-KR-SunHiNeural"
        else:
            voice = "en-US-AriaNeural"

    if voice.startswith("Google ") or voice.startswith("Microsoft ") or "Desktop" in voice:
        lower_v = voice.lower()
        if "korean" in lower_v or "ko-kr" in lower_v:
            voice = "ko-KR-InJoonNeural" if "male" in lower_v or "jinho" in lower_v else "ko-KR-SunHiNeural"
        else:
            voice = "en-US-GuyNeural" if "male" in lower_v or "david" in lower_v else "en-US-AriaNeural"

    boundaries = []
    try:
        import edge_tts
        communicate = edge_tts.Communicate(text, voice, boundary="WordBoundary")
        async for chunk in communicate.stream():
            if chunk["type"] == "WordBoundary":
                offset_sec = chunk["offset"] / 10000000.0
                duration_sec = chunk["duration"] / 10000000.0
                boundaries.append({
                    "text": chunk["text"],
                    "start": offset_sec,
                    "end": offset_sec + duration_sec
                })
        return boundaries
    except Exception as e:
        print(f"!!! Failed to get word boundaries: {e}", flush=True)
        return []

@router.get("/tts")
async def text_to_speech(text: str, lang: str = "ko", voice: str = None):
    """
    Generate highly natural Korean/English neural speech using Microsoft Edge TTS or Google TTS fallback.
    Streams high-fidelity MP3 audio back to the client instantly.
    """
    # Map default or 'google-online' values to Edge TTS voices for best premium experience
    if not voice or voice == "google-online" or voice == "null" or voice == "undefined":
        if lang == "ko":
            voice = "ko-KR-SunHiNeural"
        else:
            voice = "en-US-AriaNeural"

    # Supported neural voice fallback mappings just in case a browser-specific voice was passed to backend
    if voice.startswith("Google ") or voice.startswith("Microsoft ") or "Desktop" in voice:
        lower_v = voice.lower()
        if "korean" in lower_v or "ko-kr" in lower_v:
            voice = "ko-KR-InJoonNeural" if "male" in lower_v or "jinho" in lower_v else "ko-KR-SunHiNeural"
        else:
            voice = "en-US-GuyNeural" if "male" in lower_v or "david" in lower_v else "en-US-AriaNeural"

    try:
        import edge_tts
        communicate = edge_tts.Communicate(text, voice)
        
        async def stream_edge_audio():
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    yield chunk["data"]

        return StreamingResponse(stream_edge_audio(), media_type="audio/mpeg")
    except Exception as e:
        print(f"!!! Microsoft Edge TTS failed: {e}. Falling back to chunked Google Translate TTS.", flush=True)
        try:
            def split_text(t, max_len=200):
                chunks = []
                sentences = t.replace("\n", " ").split(". ")
                current_chunk = ""
                for s in sentences:
                    s_clean = s.strip()
                    if not s_clean:
                        continue
                    if len(current_chunk) + len(s_clean) + 2 <= max_len:
                        current_chunk = f"{current_chunk}. {s_clean}" if current_chunk else s_clean
                    else:
                        if current_chunk:
                            chunks.append(current_chunk)
                        if len(s_clean) > max_len:
                            words = s_clean.split(" ")
                            sub_chunk = ""
                            for w in words:
                                if len(sub_chunk) + len(w) + 1 <= max_len:
                                    sub_chunk = f"{sub_chunk} {w}" if sub_chunk else w
                                else:
                                    if sub_chunk:
                                        chunks.append(sub_chunk)
                                    sub_chunk = w
                            if sub_chunk:
                                current_chunk = sub_chunk
                        else:
                            current_chunk = s_clean
                if current_chunk:
                    chunks.append(current_chunk)
                return chunks

            text_chunks = split_text(text)
            print(f"Google TTS Fallback - Chunked long text into {len(text_chunks)} segments.", flush=True)

            async def stream_google_audio():
                url = "https://translate.google.com/translate_tts"
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                }
                async with httpx.AsyncClient() as client:
                    for chunk in text_chunks:
                        if not chunk.strip():
                            continue
                        params = {
                            "ie": "UTF-8",
                            "tl": lang,
                            "client": "tw-ob",
                            "q": chunk
                        }
                        async with client.stream("GET", url, params=params, headers=headers, timeout=12.0) as response:
                            if response.status_code == 200:
                                async for chunk_bytes in response.iter_bytes():
                                    yield chunk_bytes
                            else:
                                print(f"!!! Google TTS chunk request failed: status={response.status_code}", flush=True)

            return StreamingResponse(stream_google_audio(), media_type="audio/mpeg")
        except Exception as e2:
            print(f"!!! All TTS engines failed: {e2}", flush=True)
            from fastapi import HTTPException
            raise HTTPException(status_code=500, detail="TTS generation failed")


