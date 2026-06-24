from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.app.api.v1.auth import get_current_user
from backend.app.models.user import User

router = APIRouter()

class RegisterEvaluateRequest(BaseModel):
    caseId: str
    targetRegister: str # "casual" | "neutral" | "formal"
    userSentenceKo: str

@router.post("/evaluate")
async def evaluate_register(
    payload: RegisterEvaluateRequest,
    current_user: User = Depends(get_current_user)
):
    user_text = payload.userSentenceKo.strip()
    target = payload.targetRegister.strip().lower()

    if not user_text:
        return {
            "detectedRegister": "unknown",
            "isCorrect": False,
            "feedbackEn": "Please write a sentence in Korean.",
            "markers": []
        }

    # Detect register endings
    detected = "unknown"
    markers = []

    # Formal check
    formal_suffixes = ["습니다", "합니다", "입니다", "바랍니다", "합시다", "드립니다", "됩니다", "가겠습니다", "하겠습니다", "하겠습니까"]
    # Neutral check
    neutral_suffixes = ["해요", "세요", "돼요", "지요", "군요", "네요", "오?", "가요", "봐요", "대요", "죠"]
    # Casual check
    casual_suffixes = ["해", "야", "지", "어", "아", "단다", "냐", "란다", "잖아", "다"]

    # Match ends
    if any(user_text.endswith(s) for s in formal_suffixes):
        detected = "formal"
        matched_suffix = next(s for s in formal_suffixes if user_text.endswith(s))
        markers.append(matched_suffix)
    elif any(user_text.endswith(s) for s in neutral_suffixes):
        detected = "neutral"
        matched_suffix = next(s for s in neutral_suffixes if user_text.endswith(s))
        markers.append(matched_suffix)
    elif any(user_text.endswith(s) for s in casual_suffixes):
        detected = "casual"
        matched_suffix = next(s for s in casual_suffixes if user_text.endswith(s))
        markers.append(matched_suffix)
    else:
        # Default fallback
        detected = "neutral"
        markers.append("~요")

    is_correct = (detected == target)

    # General feedback
    if is_correct:
        feedback = f"Great switch! You successfully ended the sentence in the {target} register using the '{markers[0]}' marker."
    else:
        feedback = f"Mismatched register. Your sentence was detected as {detected} (marker: '{markers[0]}'), but you were asked to write in {target}."

    return {
        "detectedRegister": detected,
        "isCorrect": is_correct,
        "feedbackEn": feedback,
        "markers": markers
    }
