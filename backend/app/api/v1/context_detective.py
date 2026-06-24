from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.app.api.v1.auth import get_current_user
from backend.app.models.user import User

router = APIRouter()

class ReplyEvaluateRequest(BaseModel):
    caseId: str
    userReplyKo: str

@router.post("/evaluate-reply")
async def evaluate_reply(
    payload: ReplyEvaluateRequest,
    current_user: User = Depends(get_current_user)
):
    reply = payload.userReplyKo.strip()
    case_id = payload.caseId

    if not reply:
        return {
            "appropriateness": "mismatch",
            "feedback": "Empty reply. Please write a sentence in Korean to match the context."
        }

    # Lexical analysis based on case subtext
    # Check if the case is a refusal or negative subtext
    is_refusal = any(ref in case_id for ref in ["ynm_1", "ynm_2", "rd_1", "ei_1"])
    is_yes = any(y in case_id for y in ["ynm_3"])
    is_task_or_meeting = any(t in case_id for t in ["rd_2", "rd_3", "ei_2"])

    # Keywords lists
    refusal_keywords = ["괜찮", "다음", "아쉽", "이해", "바쁘", "미안", "다음에", "바쁜", "힘내", "걱정", "다시"]
    yes_keywords = ["좋아", "감사", "고마", "내일", "만나", "보자", "확인", "부탁", "그래", "오케이"]
    task_keywords = ["수고", "퇴근", "끝", "수정", "정리", "바꾸", "확인", "알겠", "알았", "팀장님"]

    matched = False
    
    if is_refusal:
        matched = any(kw in reply for kw in refusal_keywords)
        if matched:
            appropriateness = "good"
            feedback = "Great job! Your reply politely acknowledges the indirect refusal or resignation."
        else:
            # Check if they sent a positive word instead
            conflicts = any(kw in reply for kw in yes_keywords)
            appropriateness = "mismatch" if conflicts else "ok"
            feedback = "You should respond with a soft acknowledgement (e.g. '괜찮아요. 다음에 봐요') rather than pushing for a yes." if conflicts else "Your reply is okay, but could be more polite and understanding of their situation."

    elif is_yes:
        matched = any(kw in reply for kw in yes_keywords)
        if matched:
            appropriateness = "good"
            feedback = "Perfect! You correctly caught the positive response and confirmed naturally."
        else:
            conflicts = any(kw in reply for kw in refusal_keywords)
            appropriateness = "mismatch" if conflicts else "ok"
            feedback = "They said yes! Your reply shouldn't treat this as a refusal." if conflicts else "Appropriate, but you can sound more enthusiastic about their confirmation."

    else:
        # Task or meeting context
        matched = any(kw in reply for kw in task_keywords) or any(kw in reply for kw in refusal_keywords)
        if matched:
            appropriateness = "good"
            feedback = "Excellent! You matched the tone of the workplace or relationship context."
        else:
            appropriateness = "ok"
            feedback = "Your reply is grammatically fine, but try using standard workplace phrases like '알겠습니다' or '수고하셨습니다'."

    return {
        "appropriateness": appropriateness,
        "feedback": feedback
    }
