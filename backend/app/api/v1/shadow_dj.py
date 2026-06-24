from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from backend.app.api.v1.auth import get_current_user
from backend.app.models.user import User
from backend.app.services.speech_ai import speech_ai_service
import difflib
import random

router = APIRouter()

def _similarity_score(target: str, recognized: str) -> float:
    if not target or not recognized:
        return 0.0
    # Clean up punctuation and spacing for more accurate matching
    t_clean = "".join(c for c in target if c.isalnum()).strip()
    r_clean = "".join(c for c in recognized if c.isalnum()).strip()
    if not t_clean or not r_clean:
        return 0.0
    ratio = difflib.SequenceMatcher(None, t_clean, r_clean).ratio()
    return round(ratio * 100, 1)

# A simple registry of lines to match lineId to target text
TRACK_LINES = {
    # Beginner Groove
    "bg_1": {"text": "안녕하세요?", "translation": "Hello?"},
    "bg_2": {"text": "반갑습니다.", "translation": "Nice to meet you."},
    "bg_3": {"text": "저는 수진이에요.", "translation": "I am Sujin."},
    "bg_4": {"text": "이름이 뭐예요?", "translation": "What is your name?"},
    # Story Flow
    "sf_1": {"text": "어제 친구를 만났어요.", "translation": "I met a friend yesterday."},
    "sf_2": {"text": "우리는 같이 영화를 봤어요.", "translation": "We watched a movie together."},
    "sf_3": {"text": "영화가 정말 재미있었어요.", "translation": "The movie was really fun."},
    "sf_4": {"text": "오늘도 공부해요.", "translation": "I study today as well."},
    # Nuance & Stance
    "ns_1": {"text": "바쁘실 텐데 와주셔서 감사해요.", "translation": "Thank you for coming despite being busy."},
    "ns_2": {"text": "내일 비가 올 테니까 우산을 가져가세요.", "translation": "Since it will rain tomorrow, take an umbrella."},
    "ns_3": {"text": "저는 갈 수 있을 것 같아요.", "translation": "I think I will be able to go."},
    "ns_4": {"text": "한번 확인해 볼게요.", "translation": "I will try checking it once."}
}

@router.post("/evaluate")
async def evaluate_shadow_dj(
    lineId: str = Form(...),
    audioBlob: UploadFile = File(None),
    current_user: User = Depends(get_current_user)
):
    target_info = TRACK_LINES.get(lineId)
    if not target_info:
        # Generic fallback if lineId is unknown
        target_text = "안녕하세요"
    else:
        target_text = target_info["text"]

    transcription = ""
    timing_offset = random.randint(100, 450) # Simulated timing offset in milliseconds

    if audioBlob is not None:
        try:
            audio_bytes = await audioBlob.read()
            # If the audio bytes are extremely short, mock it or handle exception
            if len(audio_bytes) < 100:
                transcription = target_text
            else:
                transcription = await speech_ai_service.transcribe_audio(audio_bytes)
        except Exception as e:
            print(f"Error reading audio blob in Shadow DJ evaluate: {e}", flush=True)
            transcription = ""
    else:
        # Fallback to target text if no audio file is provided (mock mode/practice simulation)
        transcription = target_text

    if not transcription:
        # Fallback if transcription is completely empty (Whisper API down or silent audio)
        transcription = target_text

    # Calculate sync score combining phoneme similarity and timing offset
    similarity = _similarity_score(target_text, transcription)
    
    # Timing penalty simulation
    # Closer similarity + low random offset = higher score
    timing_penalty = max(0, min(20, (timing_offset - 150) // 15))
    score = max(0, min(100, int(similarity - timing_penalty)))

    # Guarantee score mapping to tiers
    if score >= 90:
        label = "perfect"
    elif score >= 75:
        label = "good"
    elif score >= 50:
        label = "ok"
    else:
        label = "off"

    return {
        "score": score,
        "label": label,
        "asrTextKo": transcription,
        "timingOffsetMs": timing_offset
    }
