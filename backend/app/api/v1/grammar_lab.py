import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.api.v1.auth import get_current_user
from backend.app.models.user import User
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter()

# Mock data store for Phase 1 Grammar Lab
METADATA = {
    "title": "Grammar Lab 1 – Core Sentence Foundations (A1)",
    "subtitle": "Master Korean SOV word order and basic sentence types.",
    "description": "In this lab, you will practise building simple Korean sentences, focusing on word order and putting the verb at the end.",
    "estimated_minutes": 20,
    "goals": [
        "Build basic SOV sentences",
        "Compare English vs Korean word order",
        "Practice simple statements, questions, and negation"
    ],
    "tags": ["A1", "Core", "Parallel to Korean 0–1"],
    "parallel_units": "Korean 0 (Hangeul Bootcamp) & Korean 1 (Everyday Basics) Units 1-3"
}

CORE_DATA = {
    "skeleton": {
        "pattern": "Subject - Object - Verb (SOV)",
        "explanation": "Korean is usually Subject–Object–Verb (SOV). The verb normally comes at the end of the sentence."
    },
    "comparison_examples": [
        {
            "id": "comp_1",
            "english": "I eat rice.",
            "korean": "저는 밥을 먹어요.",
            "english_structure": "Subject (I) - Verb (eat) - Object (rice)",
            "korean_structure": "Subject (저는) - Object (밥을) - Verb (먹어요)",
            "sov_tags": {
                "S": "저는 (I)",
                "O": "밥을 (rice)",
                "V": "먹어요 (eat)"
            }
        },
        {
            "id": "comp_2",
            "english": "My friend studies Korean.",
            "korean": "제 친구가 한국어를 공부해오.",
            "english_structure": "Subject (My friend) - Verb (studies) - Object (Korean)",
            "korean_structure": "Subject (제 친구가) - Object (한국어를) - Verb (공부해요)",
            "sov_tags": {
                "S": "제 친구가 (My friend)",
                "O": "한국어를 (Korean)",
                "V": "공부해요 (studies)"
            }
        }
    ],
    "sentence_types": [
        {
            "type": "Statement",
            "explanation": "X is Y / X does Y. Verbs end in -아요/어요 or -입니다.",
            "example": "저는 학생이에요. (I am a student.) / 저는 공부해요. (I study.)"
        },
        {
            "type": "Simple Question",
            "explanation": "In spoken Korean, simple questions share the same SOV order but end with a rising intonation.",
            "example": "밥을 먹어요? (Do you eat rice?)"
        },
        {
            "type": "Simple Negation",
            "explanation": "Prepend '안' before the verb (or replace with negative verbs). The verb still remains final.",
            "example": "김치를 안 먹어요. (I do not eat kimchi.)"
        }
    ],
    "mindset": "In Grammar Lab, you can make mistakes freely. The AI tutor will show you how to fix them and explain why."
}

BUILD_ITEMS = [
    {
        "id": "build_1",
        "englishPrompt": "I eat rice.",
        "chunks": [
            {"id": "b1_s", "text": "저는", "type": "Subject"},
            {"id": "b1_o", "text": "밥을", "type": "Object"},
            {"id": "b1_v", "text": "먹어요", "type": "Verb"}
        ],
        "correctOrder": ["b1_s", "b1_o", "b1_v"],
        "correctKorean": "저는 밥을 먹어요."
    },
    {
        "id": "build_2",
        "englishPrompt": "My friend studies Korean.",
        "chunks": [
            {"id": "b2_s", "text": "제 친구가", "type": "Subject"},
            {"id": "b2_o", "text": "한국어를", "type": "Object"},
            {"id": "b2_v", "text": "공부해요", "type": "Verb"}
        ],
        "correctOrder": ["b2_s", "b2_o", "b2_v"],
        "correctKorean": "제 친구가 한국어를 공부해오."
    },
    {
        "id": "build_3",
        "englishPrompt": "Mom is at home.",
        "chunks": [
            {"id": "b3_s", "text": "어머니는", "type": "Subject"},
            {"id": "b3_l", "text": "집에", "type": "Location"},
            {"id": "b3_v", "text": "있어요", "type": "Verb"}
        ],
        "correctOrder": ["b3_s", "b3_l", "b3_v"],
        "correctKorean": "어머니는 집에 있어요."
    }
]

REPAIR_ITEMS = [
    {
        "id": "rep_1",
        "englishPrompt": "I buy coffee.",
        "scrambledChunks": [
            {"id": "r1_v", "text": "사요", "type": "Verb"},
            {"id": "r1_s", "text": "저는", "type": "Subject"},
            {"id": "r1_o", "text": "커피를", "type": "Object"}
        ],
        "correctOrder": ["r1_s", "r1_o", "r1_v"],
        "correctKorean": "저는 커피를 사요."
    },
    {
        "id": "rep_2",
        "englishPrompt": "Water is cold.",
        "scrambledChunks": [
            {"id": "r2_v", "text": "차가워요", "type": "Verb"},
            {"id": "r2_s", "text": "물이", "type": "Subject"}
        ],
        "correctOrder": ["r2_s", "r2_v"],
        "correctKorean": "물이 차가워요."
    }
]

PHRASE_TO_SENTENCE = [
    {
        "id": "pts_1",
        "subject": "저는 (I)",
        "object": "사과를 (apple)",
        "verb": "먹다 (to eat)",
        "hint": "Conjugate '먹다' in present polite: '먹어요'",
        "correctKoreanPatterns": ["저는 사과를 먹어요", "저는 사과를 먹어요."]
    },
    {
        "id": "pts_2",
        "subject": "학생이 (student)",
        "object": "책을 (book)",
        "verb": "읽다 (to read)",
        "hint": "Conjugate '읽다' in present polite: '읽어요'",
        "correctKoreanPatterns": ["학생이 책을 읽어요", "학생이 책을 읽어요."]
    }
]

TRANSFORM_ITEMS = [
    {
        "id": "tr_1",
        "statement": "저는 커피를 마셔요. (I drink coffee.)",
        "questionPrompt": "Transform to a question: 'Do you drink coffee?'",
        "questionCorrectPatterns": ["커피를 마셔요?", "커피를 마셔요", "저는 커피를 마셔요?"],
        "negationPrompt": "Transform to a negation: 'I do not drink coffee.'",
        "negationCorrectPatterns": ["커피를 안 마셔요", "저는 커피를 안 마셔요", "커피를 안 마셔요.", "저는 커피를 안 마셔요."]
    }
]

QUIZ_BLUEPRINT = [
    {
        "id": "q_gl_1",
        "type": "choice",
        "question": "Which of the following sentences has the correct Korean SOV (Subject-Object-Verb) word order?",
        "options": [
            "저는 먹어요 밥을.",
            "밥을 저는 먹어요.",
            "저는 밥을 먹어요."
        ],
        "correct_answer": "저는 밥을 먹어요.",
        "explanation": "In Korean, Subject (저는) comes first, followed by Object (밥을), and Verb (먹어요) at the very end."
    },
    {
        "id": "q_gl_2",
        "type": "choice",
        "question": "Where should the verb '공부해요' (study) go in the sentence blank: '제 친구가 [A] 한국어를 [B]?'",
        "options": [
            "Position [A]",
            "Position [B]",
            "It doesn't matter"
        ],
        "correct_answer": "Position [B]",
        "explanation": "Korean is verb-final. The verb '공부해요' must go at position [B] (at the end of the sentence)."
    },
    {
        "id": "q_gl_3",
        "type": "choice",
        "question": "Choose the correct translation for: 'My friend buys a book.'",
        "options": [
            "제 친구가 책을 사요.",
            "책을 제 친구가 사요.",
            "제 친구가 사요 책을."
        ],
        "correct_answer": "제 친구가 책을 사요.",
        "explanation": "Subject (제 친구가) + Object (책을) + Verb (사요) is the natural A1 structure."
    },
    {
        "id": "q_gl_4",
        "type": "choice",
        "question": "How do you form a simple question from: '김치를 먹어요.' (I eat kimchi)?",
        "options": [
            "Add '먹어요?' with rising intonation.",
            "Move '먹어요' to the beginning.",
            "Change the order to Object-Subject-Verb."
        ],
        "correct_answer": "Add '먹어요?' with rising intonation.",
        "explanation": "In Korean statement vs question uses the same word order, distinguished primarily by rising intonation/question mark."
    },
    {
        "id": "q_gl_5",
        "type": "choice",
        "question": "Identify the correct negation for '저는 공부해요' (I study) keeping the verb final:",
        "options": [
            "저는 공부해요 안.",
            "저는 안 공부해요.",
            "저는 공부 안 해요."
        ],
        "correct_answer": "저는 공부 안 해요.",
        "explanation": "For '-하다' verbs, negation '안' goes before '해요' (공부 안 해요) keeping the verb final."
    }
]

# Request models
class AnswerCheckRequest(BaseModel):
    item_id: str
    answer_order: List[str]

class PhraseToSentenceSubmit(BaseModel):
    item_id: str
    typed_sentence: str

class TransformSubmit(BaseModel):
    item_id: str
    action_type: str  # 'question' or 'negation'
    user_input: str

class AudioCheckRequest(BaseModel):
    target_text: str

class QuizAnswerSubmit(BaseModel):
    question_id: str
    selected_option: str

class QuizFinishRequest(BaseModel):
    score: int
    mistakes: List[str]

class HomeworkSubmit(BaseModel):
    sentences: List[str]

@router.get("/phases/1/metadata")
async def get_metadata(current_user: User = Depends(get_current_user)):
    return METADATA

@router.get("/phases/1/core-data")
async def get_core_data(current_user: User = Depends(get_current_user)):
    return CORE_DATA

@router.get("/phase-1/items/build")
async def get_build_items(current_user: User = Depends(get_current_user)):
    return BUILD_ITEMS

@router.post("/phase-1/items/build/answer")
async def check_build_answer(payload: AnswerCheckRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in BUILD_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    is_correct = payload.answer_order == item["correctOrder"]
    explanation = "Excellent! You placed the verb at the very end in correct SOV order." if is_correct else "Word order is incorrect. Remember that Korean is Subject - Object - Verb, so the verb must go last."
    
    return {
        "correct": is_correct,
        "correct_sentence": item["correctKorean"],
        "explanation": explanation
    }

@router.get("/phase-1/items/repair")
async def get_repair_items(current_user: User = Depends(get_current_user)):
    return REPAIR_ITEMS

@router.post("/phase-1/items/repair/answer")
async def check_repair_answer(payload: AnswerCheckRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in REPAIR_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    is_correct = payload.answer_order == item["correctOrder"]
    explanation = "Now the sentence is in natural Korean order!" if is_correct else "Misplaced chunks! Ensure the verb is at the end."
    
    return {
        "correct": is_correct,
        "correct_sentence": item["correctKorean"],
        "explanation": explanation
    }

@router.get("/phase-1/items/phrase-to-sentence")
async def get_pts_items(current_user: User = Depends(get_current_user)):
    return PHRASE_TO_SENTENCE

@router.post("/phase-1/items/phrase-to-sentence/answer")
async def check_pts_answer(payload: PhraseToSentenceSubmit, current_user: User = Depends(get_current_user)):
    item = next((i for i in PHRASE_TO_SENTENCE if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    clean_user = payload.typed_sentence.strip().replace(" ", "")
    is_correct = False
    for pat in item["correctKoreanPatterns"]:
        if clean_user == pat.replace(" ", ""):
            is_correct = True
            break
            
    explanation = "Superb job! All grammatical components are correct and the verb is final." if is_correct else f"Incorrect. A correct form is: '{item['correctKoreanPatterns'][0]}'. Check your spacing and conjugation."
    
    return {
        "correct": is_correct,
        "model_sentence": item["correctKoreanPatterns"][0],
        "explanation": explanation
    }

@router.get("/phase-1/items/transform")
async def get_transform_items(current_user: User = Depends(get_current_user)):
    return TRANSFORM_ITEMS

@router.post("/phase-1/items/transform/answer")
async def check_transform_answer(payload: TransformSubmit, current_user: User = Depends(get_current_user)):
    item = next((i for i in TRANSFORM_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    clean_user = payload.user_input.strip().replace(" ", "").replace("?", "").replace(".", "")
    is_correct = False
    
    patterns = item["questionCorrectPatterns"] if payload.action_type == 'question' else item["negationCorrectPatterns"]
    
    for pat in patterns:
        clean_pat = pat.replace(" ", "").replace("?", "").replace(".", "")
        if clean_user == clean_pat:
            is_correct = True
            break
            
    explanation = "Nice transformation! Word order preserved and correct ending used." if is_correct else f"Oops! Make sure the verb is final and you applied the correct particles/modifiers. Example: '{patterns[0]}'"
    
    return {
        "correct": is_correct,
        "explanation": explanation
    }

@router.post("/phase-1/speaking-check")
async def speaking_check(payload: AudioCheckRequest, current_user: User = Depends(get_current_user)):
    # Standard STT mock/logic
    return {
        "transcript": payload.target_text,
        "similarity_score": 95,
        "feedback": "Clear pronunciation! Verb correctly placed at the end."
    }

@router.post("/phase-1/quiz/start")
async def start_quiz(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": QUIZ_BLUEPRINT
    }

@router.post("/phase-1/quiz/answer")
async def check_quiz_answer(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in QUIZ_BLUEPRINT if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    
    is_correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": is_correct,
        "explanation": q["explanation"]
    }

@router.post("/phase-1/quiz/finish")
async def finish_quiz(payload: QuizFinishRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Grant XP to user
    xp_gained = 50 if payload.score >= 80 else 20
    return {
        "score": payload.score,
        "xp_gained": xp_gained,
        "mastery_updates": {
            "sov_order": "A1_passed" if payload.score >= 80 else "A1_review"
        }
    }

@router.get("/phase-1/homework")
async def get_homework(current_user: User = Depends(get_current_user)):
    return [
        {"id": "hw1", "text": "Write 5–10 Korean sentences about your real life (A1 level). Include 2 daily routines, 2 about family/friends, and 2 about likes/dislikes. Put verbs last."},
        {"id": "hw2", "text": "Take 5 simple English sentences from your notes and rewrite them in SOV Korean word order."},
        {"id": "hw3", "text": "Read your sentences aloud, confirming no verbs accidentally landed in the middle."}
    ]

@router.post("/phase-1/homework/submit")
async def submit_homework(payload: HomeworkSubmit, current_user: User = Depends(get_current_user)):
    feedback = []
    for sent in payload.sentences:
        sent = sent.strip()
        if not sent:
            continue
        
        # Simple rule-based A1 analyzer for Korean word order (verb at end)
        # Korean verbs/adjectives end in 요, 다, 니다, 까, 이다, 에요, 예요, 죠
        ends_with_verb = any(sent.endswith(suffix) for suffix in ["요", "다", "니다", "까", "이다", "에요", "예요", "죠", "요.", "다.", "니다.", "이다.", "에요.", "예요.", "죠."])
        
        if ends_with_verb:
            feedback.append({
                "original": sent,
                "corrected": sent,
                "is_correct": True,
                "why": "Excellent! The verb or adjective is placed correctly at the end of the sentence."
            })
        else:
            feedback.append({
                "original": sent,
                "corrected": sent + "요",
                "is_correct": False,
                "why": "The sentence seems to miss a verb ending or does not end with a verb. Ensure your sentence finishes with a conjugated verb/adjective (e.g. ending in -요)."
            })
            
    return {
        "feedback": feedback
    }

@router.post("/phase-1/complete")
async def complete_phase(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "Grammar Lab 1 Complete",
        "sov_accuracy_est": "92%",
        "next_recommended": ["Particles Lab", "Politeness Lab"]
    }

# --- Phase 2: Particles & Case Marking ---

PHASE_2_METADATA = {
    "title": "Grammar Lab 2 – Particles & Case Marking (A1–A2)",
    "subtitle": "Get comfortable with topic, subject, object, and basic location particles.",
    "description": "In this lab, you'll practise Korean particles like 은/는, 이/가, 을/를, and simple 에/에서, so your sentences feel more natural.",
    "estimated_minutes": 25,
    "goals": [
        "Understand what topic, subject, and object particles do",
        "Practise choosing the right particle in A1–A2 sentences",
        "Use location/time particles in simple patterns"
    ],
    "tags": ["A1–A2", "Particles", "Parallel to Korean 1–2"],
    "parallel_units": "Korean 1 (Everyday Basics) & Korean 2 (Daily Life Routines) Units 1-4"
}

PHASE_2_CORE_DATA = {
    "definitions": [
        {
            "particle": "은/는 (Topic Particle)",
            "usage": "Marks the main topic of the sentence or shows contrast. Attach 은 after consonants, 는 after vowels.",
            "examples": [
                {"korean": "저는 학생이에요.", "english": "As for me, I am a student (focus on me/topic)."},
                {"korean": "사과는 맛있어요. (수박은 맛없어요.)", "english": "Apples are delicious. (Watermelons, on the other hand, are not.)"}
            ]
        },
        {
            "particle": "이/가 (Subject Particle)",
            "usage": "Marks the subject/doer of the verb. Often introduces new information or focus on WHO did it. Attach 이 after consonants, 가 after vowels.",
            "examples": [
                {"korean": "비가 와요.", "english": "Rain is falling (focus on the rain falling)."},
                {"korean": "제가 했어요.", "english": "I did it (focus on 'I' as the doer)."}
            ]
        },
        {
            "particle": "을/를 (Object Particle)",
            "usage": "Marks the object receiving the action of a transitive verb. Attach 을 after consonants, 를 after vowels.",
            "examples": [
                {"korean": "책을 읽어요.", "english": "I read a book."},
                {"korean": "사과를 먹어요.", "english": "I eat an apple."}
            ]
        },
        {
            "particle": "에 (Location/Time Particle)",
            "usage": "Indicates existence ('at', 'in' with 있다/없다) or direction/destination ('to' with 가다/오다).",
            "examples": [
                {"korean": "학교에 가요.", "english": "I go to school."},
                {"korean": "집에 있어요.", "english": "I am at home."}
            ]
        },
        {
            "particle": "에서 (Action Location Particle)",
            "usage": "Indicates where an action/dynamic activity takes place ('at', 'in').",
            "examples": [
                {"korean": "도서관에서 공부해요.", "english": "I study in the library."},
                {"korean": "카페에서 친구를 만나요.", "english": "I meet a friend at a cafe."}
            ]
        }
    ],
    "minimal_pairs": [
        {
            "title": "은/는 vs 이/가 (Contrast vs Specific Doer)",
            "pair": [
                {"sentence": "저는 한국 사람이에요.", "explanation": "General statement about oneself (Topic)."},
                {"sentence": "제가 한국 사람이에요.", "explanation": "Answers 'Who is Korean?' pointing specifically to oneself (Subject)."}
            ]
        },
        {
            "title": "에 vs 에서 (Existence vs Activity)",
            "pair": [
                {"sentence": "공원에 있어요.", "explanation": "Static existence: I am at the park."},
                {"sentence": "공원에서 운동해요.", "explanation": "Dynamic activity: I exercise at the park."}
            ]
        }
    ]
}

PARTICLE_CHOICE_ITEMS = [
    {
        "id": "choice_1",
        "sentence_blank": "사과___ 맛있어요.",
        "english": "Apples are delicious. (General statement/Topic)",
        "options": ["은", "는", "이", "가"],
        "correct": "는",
        "explanation": "사과 ends in a vowel (ㅏ), so 는 is the correct topic particle."
    },
    {
        "id": "choice_2",
        "sentence_blank": "책___ 읽어요.",
        "english": "I read a book. (Object)",
        "options": ["을", "를", "이", "가"],
        "correct": "을",
        "explanation": "책 ends in a consonant (ㄱ), so 을 is the correct object particle."
    },
    {
        "id": "choice_3",
        "sentence_blank": "동생___ 공부해요.",
        "english": "My younger sibling studies. (Subject)",
        "options": ["은", "는", "이", "가"],
        "correct": "이",
        "explanation": "동생 ends in a consonant (ㅇ), so 이 is the correct subject particle."
    }
]

TOPIC_VS_SUBJECT_ITEMS = [
    {
        "id": "tvs_1",
        "context": "Context: Someone asks 'Who is the teacher?' and you answer 'I am the teacher.'",
        "sentence_blank": "제___ 선생님이에요.",
        "options": ["는", "가"],
        "correct": "가",
        "explanation": "When responding to 'who' or identifying a specific subject, the subject marker '가' (attached to 저 -> 제가) is used instead of the topic marker '는'."
    },
    {
        "id": "tvs_2",
        "context": "Context: Comparing two things. 'Water is cold, but tea is hot.' (물은 차갑지만, 차___ 뜨거워요.)",
        "sentence_blank": "차___ 뜨거워요.",
        "options": ["는", "가"],
        "correct": "는",
        "explanation": "When showing contrast or comparison between two things, use the topic marker 는."
    }
]

OBJECT_VS_SUBJECT_ITEMS = [
    {
        "id": "ovs_1",
        "sentence": "개___ 밥___ 먹어요.",
        "prompt": "Fill in the correct subject particle for '개' (dog) and object particle for '밥' (food) to make: 'The dog eats food.'",
        "options_1": ["이", "가"],
        "options_2": ["을", "를"],
        "correct_1": "가",
        "correct_2": "을",
        "explanation": "개 ends in a vowel, so '가'. 밥 ends in a consonant, so '을'."
    }
]

INSERT_PARTICLES_ITEMS = [
    {
        "id": "ins_1",
        "sentence_missing": "저는 커피[ ] 마셔요.",
        "english": "I drink coffee.",
        "placeholder": "를 or 을?",
        "correct": "를",
        "explanation": "커피 ends in a vowel (ㅣ), so 를 is the correct object particle."
    },
    {
        "id": "ins_2",
        "sentence_missing": "비[ ] 와요.",
        "english": "Rain is falling.",
        "placeholder": "이 or 가?",
        "correct": "가",
        "explanation": "비 ends in a vowel (ㅣ), so 가 is the correct subject particle."
    }
]

TOPIC_REWRITE_ITEMS = [
    {
        "id": "rew_1",
        "original": "제 친구가 한국어를 공부해요. (My friend studies Korean - focus on friend)",
        "prompt": "Change the subject marker to a topic marker to make it 'As for my friend, they study Korean.'",
        "correct_patterns": ["제 친구는 한국어를 공부해요", "제 친구는 한국어를 공부해요.", "친구는 한국어를 공부해요", "친구는 한국어를 공부해요."],
        "explanation": "Replace '가' with '는' (친구는) to shift the focus to the topic."
    }
]

LOCATION_ITEMS = [
    {
        "id": "loc_1",
        "sentence_blank": "저는 한국___ 살아요.",
        "english": "I live in Korea. (Existence/State of living)",
        "options": ["에", "에서"],
        "correct": "에",
        "explanation": "With 살다 (to live) or 있다 (to be/exist), 에 is used for static location."
    },
    {
        "id": "loc_2",
        "sentence_blank": "저는 공원___ 운동해요.",
        "english": "I exercise in the park. (Dynamic activity)",
        "options": ["에", "에서"],
        "correct": "에서",
        "explanation": "Since 운동해요 (exercise) is a dynamic activity/action, 에서 is correct."
    }
]

PHASE_2_QUIZ_BLUEPRINT = [
    {
        "id": "q_p2_1",
        "type": "choice",
        "question": "Which particle correctly marks the subject in 'The teacher speaks' (선생님___ 말씀하세요)?",
        "options": [
            "는",
            "가",
            "이",
            "을"
        ],
        "correct_answer": "이",
        "explanation": "선생님 ends in a consonant (ㅁ), so the subject particle 이 is correct."
    },
    {
        "id": "q_p2_2",
        "type": "choice",
        "question": "Fill in the blank for contrast: '민우는 학생이에요. 지수___ 회사원이에요.' (Minwoo is a student. Jisoo is an office worker.)",
        "options": [
            "는",
            "가",
            "이",
            "를"
        ],
        "correct_answer": "는",
        "explanation": "지수 ends in a vowel (ㅜ), and is contrasted with Minwoo, so the topic particle 는 is correct."
    },
    {
        "id": "q_p2_3",
        "type": "choice",
        "question": "Which sentence correctly uses the object particle?",
        "options": [
            "저는 한국어에 배워요.",
            "저는 한국어가 배워요.",
            "저는 한국어를 배워요.",
            "저는 한국어는 배워요."
        ],
        "correct_answer": "저는 한국어를 배워요.",
        "explanation": "한국어 (Korean language) is the object of the verb 배워요 (learn). Since it ends in a vowel, 를 is used."
    },
    {
        "id": "q_p2_4",
        "type": "choice",
        "question": "Where does the action of eating lunch take place? '식당___ 점심을 먹어요.'",
        "options": [
            "에",
            "에서",
            "은",
            "을"
        ],
        "correct_answer": "에서",
        "explanation": "먹어요 (eat) is an action, so the action location particle 에서 is used."
    },
    {
        "id": "q_p2_5",
        "type": "choice",
        "question": "Choose the correct particles for: 'Today, the weather is good.' (오늘___ 날씨___ 좋아요.)",
        "options": [
            "은 / 가",
            "는 / 이",
            "을 / 가",
            "에 / 를"
        ],
        "correct_answer": "은 / 가",
        "explanation": "오늘 (today) ends in a consonant -> 은. 날씨 (weather) ends in a vowel -> 가. '오늘' is the time topic, and '날씨' is the subject."
    }
]

# Request models for Phase 2
class ParticleChoiceAnswerRequest(BaseModel):
    item_id: str
    selected_option: str

class TopicVsSubjectAnswerRequest(BaseModel):
    item_id: str
    selected_option: str

class ObjectVsSubjectAnswerRequest(BaseModel):
    item_id: str
    ans_1: str
    ans_2: str

class InsertParticlesAnswerRequest(BaseModel):
    item_id: str
    user_input: str

class TopicRewriteAnswerRequest(BaseModel):
    item_id: str
    user_input: str

class LocationAnswerRequest(BaseModel):
    item_id: str
    selected_option: str


@router.get("/phases/2/metadata")
async def get_phase2_metadata(current_user: User = Depends(get_current_user)):
    return PHASE_2_METADATA

@router.get("/phases/2/core-data")
async def get_phase2_core_data(current_user: User = Depends(get_current_user)):
    return PHASE_2_CORE_DATA

@router.get("/phase-2/items/particle-choice")
async def get_phase2_particle_choice(current_user: User = Depends(get_current_user)):
    return PARTICLE_CHOICE_ITEMS

@router.post("/phase-2/items/particle-choice/answer")
async def check_phase2_particle_choice(payload: ParticleChoiceAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in PARTICLE_CHOICE_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    is_correct = payload.selected_option.strip() == item["correct"]
    return {
        "correct": is_correct,
        "correct_answer": item["correct"],
        "explanation": item["explanation"]
    }

@router.get("/phase-2/items/topic-vs-subject")
async def get_phase2_topic_vs_subject(current_user: User = Depends(get_current_user)):
    return TOPIC_VS_SUBJECT_ITEMS

@router.post("/phase-2/items/topic-vs-subject/answer")
async def check_phase2_topic_vs_subject(payload: TopicVsSubjectAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in TOPIC_VS_SUBJECT_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    is_correct = payload.selected_option.strip() == item["correct"]
    return {
        "correct": is_correct,
        "correct_answer": item["correct"],
        "explanation": item["explanation"]
    }

@router.get("/phase-2/items/object-vs-subject")
async def get_phase2_object_vs_subject(current_user: User = Depends(get_current_user)):
    return OBJECT_VS_SUBJECT_ITEMS

@router.post("/phase-2/items/object-vs-subject/answer")
async def check_phase2_object_vs_subject(payload: ObjectVsSubjectAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in OBJECT_VS_SUBJECT_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    is_correct_1 = payload.ans_1.strip() == item["correct_1"]
    is_correct_2 = payload.ans_2.strip() == item["correct_2"]
    is_correct = is_correct_1 and is_correct_2
    
    return {
        "correct": is_correct,
        "correct_1": item["correct_1"],
        "correct_2": item["correct_2"],
        "explanation": item["explanation"]
    }

@router.get("/phase-2/items/insert-particles")
async def get_phase2_insert_particles(current_user: User = Depends(get_current_user)):
    return INSERT_PARTICLES_ITEMS

@router.post("/phase-2/items/insert-particles/answer")
async def check_phase2_insert_particles(payload: InsertParticlesAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in INSERT_PARTICLES_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    is_correct = payload.user_input.strip() == item["correct"]
    return {
        "correct": is_correct,
        "correct_answer": item["correct"],
        "explanation": item["explanation"]
    }

@router.get("/phase-2/items/topic-rewrite")
async def get_phase2_topic_rewrite(current_user: User = Depends(get_current_user)):
    return TOPIC_REWRITE_ITEMS

@router.post("/phase-2/items/topic-rewrite/answer")
async def check_phase2_topic_rewrite(payload: TopicRewriteAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in TOPIC_REWRITE_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    clean_user = payload.user_input.strip().replace(" ", "")
    is_correct = False
    for pat in item["correct_patterns"]:
        if clean_user == pat.replace(" ", ""):
            is_correct = True
            break
            
    return {
        "correct": is_correct,
        "correct_pattern": item["correct_patterns"][0],
        "explanation": item["explanation"]
    }

@router.get("/phase-2/items/location")
async def get_phase2_location(current_user: User = Depends(get_current_user)):
    return LOCATION_ITEMS

@router.post("/phase-2/items/location/answer")
async def check_phase2_location(payload: LocationAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in LOCATION_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    is_correct = payload.selected_option.strip() == item["correct"]
    return {
        "correct": is_correct,
        "correct_answer": item["correct"],
        "explanation": item["explanation"]
    }

@router.post("/phase-2/quiz/start")
async def start_phase2_quiz(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": PHASE_2_QUIZ_BLUEPRINT
    }

@router.post("/phase-2/quiz/answer")
async def check_phase2_quiz_answer(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in PHASE_2_QUIZ_BLUEPRINT if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    
    is_correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": is_correct,
        "explanation": q["explanation"]
    }

@router.post("/phase-2/quiz/finish")
async def finish_phase2_quiz(payload: QuizFinishRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    xp_gained = 50 if payload.score >= 80 else 20
    return {
        "score": payload.score,
        "xp_gained": xp_gained,
        "mastery_updates": {
            "particles": "A1_A2_passed" if payload.score >= 80 else "A1_A2_review"
        }
    }

@router.get("/phase-2/homework")
async def get_phase2_homework(current_user: User = Depends(get_current_user)):
    return [
        {"id": "p2_hw1", "text": "Write 5 simple sentences describing what you and your friends did today at different locations, paying attention to 은/는, 이/가, 을/를, and 에/에서."},
        {"id": "p2_hw2", "text": "Take a sentence that uses '이/가' and rewrite it to use '은/는'. Explain how the meaning shifts."},
        {"id": "p2_hw3", "text": "Write two sentences with the same location: one where you just 'exist' there (에) and one where you perform an action (에서)."}
    ]

@router.post("/phase-2/homework/submit")
async def submit_phase2_homework(payload: HomeworkSubmit, current_user: User = Depends(get_current_user)):
    feedback = []
    for sent in payload.sentences:
        sent = sent.strip()
        if not sent:
            continue
        
        # A simple rules-based checker for particle usage:
        # Check consonant/vowel pairs:
        # 은/는: 는 must follow a vowel, 은 must follow a consonant.
        # 이/가: 가 must follow a vowel, 이 must follow a consonant.
        # 을/를: 를 must follow a vowel, 을 must follow a consonant.
        # Let's write a very basic syllable check helper:
        # The unicode value of Korean characters is decomposed as:
        # Hangeul Syllable: code = 0xAC00 + (initial * 21 + vowel) * 28 + consonant
        # If (code - 0xAC00) % 28 == 0, then it ends in a vowel (no batchim).
        # Otherwise, it ends in a consonant (has batchim).
        
        def has_batchim(char: str) -> bool:
            if not char:
                return False
            code = ord(char)
            if 0xAC00 <= code <= 0xD7A3:
                return (code - 0xAC00) % 28 != 0
            return False
        
        has_error = False
        error_msg = ""
        corrected_sent = sent
        
        # Check particles
        words = sent.split()
        for word in words:
            # strip trailing punctuation
            clean_word = word.rstrip(".?,!")
            if len(clean_word) >= 2:
                last_char = clean_word[-1]
                stem_char = clean_word[-2]
                
                # Check 는/은
                if last_char == "는" and has_batchim(stem_char):
                    has_error = True
                    error_msg = f"'{clean_word}' should use '은' instead of '는' because '{stem_char}' ends with a consonant."
                    corrected_sent = sent.replace(clean_word, clean_word[:-1] + "은")
                    break
                elif last_char == "은" and not has_batchim(stem_char):
                    has_error = True
                    error_msg = f"'{clean_word}' should use '는' instead of '은' because '{stem_char}' ends with a vowel."
                    corrected_sent = sent.replace(clean_word, clean_word[:-1] + "는")
                    break
                
                # Check 가/이
                elif last_char == "가" and has_batchim(stem_char):
                    # Note: Excluding '제가', '네가', '내가' as stem-change occurs, but they end in vowels anyway so ord is fine.
                    has_error = True
                    error_msg = f"'{clean_word}' should use '이' instead of '가' because '{stem_char}' ends with a consonant."
                    corrected_sent = sent.replace(clean_word, clean_word[:-1] + "이")
                    break
                elif last_char == "이" and not has_batchim(stem_char):
                    # Be careful: '이' can be part of nouns/verbs (e.g. 고양이, 아이). We check if it is functioning as a particle.
                    # As a heuristic, if it is at the end of a word, we can check.
                    # To avoid false positives, we only trigger if we are reasonably sure.
                    # Let's say if stem_char is a common vowel-ended noun ending.
                    # We can still flag it if it's a known vowel ending noun.
                    pass
                
                # Check 를/을
                elif last_char == "를" and has_batchim(stem_char):
                    has_error = True
                    error_msg = f"'{clean_word}' should use '을' instead of '를' because '{stem_char}' ends with a consonant."
                    corrected_sent = sent.replace(clean_word, clean_word[:-1] + "을")
                    break
                elif last_char == "을" and not has_batchim(stem_char):
                    has_error = True
                    error_msg = f"'{clean_word}' should use '를' instead of '을' because '{stem_char}' ends with a vowel."
                    corrected_sent = sent.replace(clean_word, clean_word[:-1] + "를")
                    break
        
        if not has_error:
            # Also check if verb is at the end
            ends_with_verb = any(sent.endswith(suffix) for suffix in ["요", "다", "니다", "까", "이다", "에요", "예요", "죠", "요.", "다.", "니다.", "이다.", "에요.", "예요.", "죠."])
            if not ends_with_verb:
                has_error = True
                error_msg = "The sentence seems to miss a verb ending or does not end with a verb. Remember to keep the verb final."
                corrected_sent = sent + "요"
                
        if not has_error:
            feedback.append({
                "original": sent,
                "corrected": sent,
                "is_correct": True,
                "why": "Excellent grammar! Correct particle choice and verb-final word order."
            })
        else:
            feedback.append({
                "original": sent,
                "corrected": corrected_sent,
                "is_correct": False,
                "why": error_msg
            })
            
    return {
        "feedback": feedback
    }

@router.post("/phase-2/complete")
async def complete_phase2(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "Grammar Lab 2 Complete",
        "particles_accuracy_est": "95%",
        "next_recommended": ["Honorifics & Politeness Lab"]
    }

# --- Phase 3: Politeness & Verb Endings ---

PHASE_3_METADATA = {
    "title": "Grammar Lab 3 – Politeness & Basic Verb Endings (A1–A2)",
    "subtitle": "Practise polite present, past, and future forms in everyday Korean.",
    "description": "In this lab, you'll drill the most common polite endings for present, past, and future and practise switching between casual and polite forms.",
    "estimated_minutes": 25,
    "goals": [
        "Conjugate common verbs into polite present, past, and future",
        "Switch between casual and polite speech in simple A1–A2 contexts",
        "Recognise when polite vs casual is appropriate"
    ],
    "tags": ["A1–A2", "Politeness", "Verb Endings", "Parallel to Korean 1–2"],
    "parallel_units": "Korean 1 (Everyday Basics) & Korean 2 (Daily Life Routines) Units 5-8"
}

PHASE_3_CORE_DATA = {
    "verbs": [
        {"id": "v1", "verb": "가다", "meaning": "to go", "stem": "가", "present_polite": "가요", "past_polite": "갔어요", "future_polite": "갈 거예요", "present_casual": "가", "past_casual": "갔어", "future_casual": "갈 거야"},
        {"id": "v2", "verb": "먹다", "meaning": "to eat", "stem": "먹", "present_polite": "먹어요", "past_polite": "먹었어요", "future_polite": "먹을 거예요", "present_casual": "먹어", "past_casual": "먹었어", "future_casual": "먹을 거야"},
        {"id": "v3", "verb": "공부하다", "meaning": "to study", "stem": "공부하", "present_polite": "공부해요", "past_polite": "공부했어요", "future_polite": "공부할 거예요", "present_casual": "공부해", "past_casual": "공부했어", "future_casual": "공부할 거야"},
        {"id": "v4", "verb": "보다", "meaning": "to see / watch", "stem": "보", "present_polite": "봐요", "past_polite": "봤어요", "future_polite": "볼 거예요", "present_casual": "봐", "past_casual": "봤어", "future_casual": "볼 거야"}
    ],
    "casual_polite_pairs": [
        {"casual": "나 집에 가.", "polite": "저는 집에 가요.", "meaning": "I go home.", "situation": "Casual is used with close friends; Polite is used with strangers or superiors."},
        {"casual": "어제 영화 봤어.", "polite": "어제 영화 봤어요.", "meaning": "I watched a movie yesterday.", "situation": "Adding '요' shifts casual past tense (봤어) to polite past tense (봤어요)."},
        {"casual": "내일 친구 만날 거야.", "polite": "내일 친구 만날 거예요.", "meaning": "I will meet a friend tomorrow.", "situation": "Future tense casual '만날 거야' vs polite '만날 거예요'."}
    ]
}

CONJUGATION_ITEMS = [
    {"id": "v1", "verb": "가다", "meaning": "to go", "stem": "가", "present_polite": "가요", "past_polite": "갔어요", "future_polite": "갈 거예요", "present_hint": "Stem vowel is ㅏ, so add 아요 (가 + 아요 = 가요)", "past_hint": "Add 았어요 to stem 가 -> 갔어요", "future_hint": "Ends in vowel, add ㄹ 거예요 -> 갈 거예요"},
    {"id": "v2", "verb": "먹다", "meaning": "to eat", "stem": "먹", "present_polite": "먹어요", "past_polite": "먹었어요", "future_polite": "먹을 거예요", "present_hint": "Stem vowel is ㅓ, so add 어요 -> 먹어요", "past_hint": "Add 었어요 to stem 먹 -> 먹었어요", "future_hint": "Ends in consonant, add 을 거예요 -> 먹을 거예요"},
    {"id": "v3", "verb": "공부하다", "meaning": "to study", "stem": "공부하", "present_polite": "공부해요", "past_polite": "공부했어요", "future_polite": "공부할 거예요", "present_hint": "하다 verbs change to 해요 -> 공부해요", "past_hint": "하다 verbs change to 했어요 -> 공부했어요", "future_hint": "Ends in vowel, add ㄹ 거예요 -> 공부할 거예요"},
    {"id": "v4", "verb": "보다", "meaning": "to see / watch", "stem": "보", "present_polite": "봐요", "past_polite": "봤어요", "future_polite": "볼 거예요", "present_hint": "Stem vowel is ㅗ, so add 아요 (보 + 아요 = 봐요)", "past_hint": "Add 았어요 to stem 보 -> 봤어요", "future_hint": "Ends in vowel, add ㄹ 거예요 -> 볼 거예요"}
]

POLITENESS_TRANSFORM_ITEMS = [
    {
        "id": "pt_1",
        "casual": "나 집에 가.",
        "english": "I go home.",
        "tense": "present",
        "correct_polite_patterns": ["저는집에가요", "집에가요", "저는집에가요.", "집에가요."],
        "explanation": "Convert subject '나' to polite '저' and casual ending '가' to polite '가요'."
    },
    {
        "id": "pt_2",
        "casual": "어제 영화 봤어.",
        "english": "I watched a movie yesterday.",
        "tense": "past",
        "correct_polite_patterns": ["어제영화봤어요", "어제영화봤어요.", "영화봤어요", "영화봤어요."],
        "explanation": "Add the polite marker '요' to the casual past form '봤어' -> '봤어요'."
    },
    {
        "id": "pt_3",
        "casual": "내일 친구 만날 거야.",
        "english": "I will meet a friend tomorrow.",
        "tense": "future",
        "correct_polite_patterns": ["내일친구만날거예요", "내일친구만날거예요.", "내일친구를만날거예요", "내일친구를만날거예요."],
        "explanation": "Replace casual future '만날 거야' with polite future '만날 거예요'."
    }
]

CONTEXT_CHOICE_ITEMS = [
    {
        "id": "cc_1",
        "listener": "your teacher (선생님)",
        "prompt": "Say: 'I study Korean.' (verb: 공부하다)",
        "required_formality": "polite",
        "correct_sentences": ["저는 한국어를 공부해요", "저는 한국어를 공부해요.", "한국어를 공부해요", "한국어를 공부해요."],
        "explanation": "With a teacher, you must use polite speech (존댓말), so '공부해요' is required."
    },
    {
        "id": "cc_2",
        "listener": "your best friend (친한 친구)",
        "prompt": "Say: 'I eat rice.' (verb: 먹다)",
        "required_formality": "casual",
        "correct_sentences": ["나 밥 먹어", "나 밥 먹어.", "밥 먹어", "밥 먹어."],
        "explanation": "With a close friend, casual speech (반말) '밥 먹어' is natural and appropriate."
    }
]

DIALOGUE_FIX_ITEMS = [
    {
        "id": "df_1",
        "context": "Context: Talking to your school manager.",
        "dialogue": [
            {"speaker": "Manager", "text": "내일 학교에 올 거예요? (Will you come to school tomorrow?)"},
            {"speaker": "You (Broken)", "text": "응, 내일 갈 거야. (Yeah, I'm going tomorrow. - TOO CASUAL)"}
        ],
        "correction_prompt": "Correct your response to be appropriate and polite to the manager.",
        "correct_patterns": ["네, 내일 갈 거예요", "네, 내일 갈 거예요.", "네, 갈 거예요", "네, 갈 거예요."],
        "explanation": "Replace casual agreement '응' with polite '네', and casual future '갈 거야' with polite '갈 거예요'."
    }
]

PHASE_3_QUIZ_BLUEPRINT = [
    {
        "id": "q_p3_1",
        "type": "choice",
        "question": "Which tense is indicated by the ending in '공부했어요'?",
        "options": ["Present Tense", "Past Tense", "Future Tense"],
        "correct_answer": "Past Tense",
        "explanation": "'했' is the past tense marker for '하다' verbs, so '공부했어요' is past tense."
    },
    {
        "id": "q_p3_2",
        "type": "choice",
        "question": "What is the polite present tense of '보다' (to see/watch)?",
        "options": ["보아요", "봐요", "봤어요", "볼 거예요"],
        "correct_answer": "봐요",
        "explanation": "The stem '보' contracts with '아요' to form '봐요'."
    },
    {
        "id": "q_p3_3",
        "type": "choice",
        "question": "You are talking to a police officer. Which sentence should you use?",
        "options": [
            "길을 잃었어.",
            "길을 잃었어요.",
            "길을 잃을 거야."
        ],
        "correct_answer": "길을 잃었어요.",
        "explanation": "In public scenarios with officials or strangers, polite speech (요-form) is necessary."
    },
    {
        "id": "q_p3_4",
        "type": "choice",
        "question": "Choose the correct polite future form of '먹다' (to eat):",
        "options": [
            "먹어요",
            "먹었어요",
            "먹을 거예요",
            "먹을 거야"
        ],
        "correct_answer": "먹을 거예요",
        "explanation": "먹다 has a consonant stem (먹), so we add 을 거예요 -> 먹을 거예요."
    },
    {
        "id": "q_p3_5",
        "type": "choice",
        "question": "What is the appropriate response to your grandmother asking if you ate lunch?",
        "options": [
            "응, 먹었어.",
            "네, 먹었어요.",
            "네, 먹을 거야."
        ],
        "correct_answer": "네, 먹었어요.",
        "explanation": "Grandmothers require polite speech, and since she asked if you ate, the answer must be in the polite past tense."
    }
]

# Request models for Phase 3
class ConjugationAnswerRequest(BaseModel):
    verb_id: str
    target_tense: str  # 'present', 'past', or 'future'
    learner_form: str

class PolitenessTransformAnswerRequest(BaseModel):
    item_id: str
    user_input: str

class ContextChoiceAnswerRequest(BaseModel):
    item_id: str
    user_input: str

class DialogueFixAnswerRequest(BaseModel):
    item_id: str
    user_input: str


@router.get("/phases/3/metadata")
async def get_phase3_metadata(current_user: User = Depends(get_current_user)):
    return PHASE_3_METADATA

@router.get("/phases/3/core-data")
async def get_phase3_core_data(current_user: User = Depends(get_current_user)):
    return PHASE_3_CORE_DATA

@router.get("/phase-3/items/conjugation")
async def get_phase3_conjugations(current_user: User = Depends(get_current_user)):
    return CONJUGATION_ITEMS

@router.post("/phase-3/items/conjugation/answer")
async def check_phase3_conjugation(payload: ConjugationAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in CONJUGATION_ITEMS if i["id"] == payload.verb_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Verb item not found")
    
    learner_ans = payload.learner_form.strip().replace(" ", "")
    
    if payload.target_tense == "present":
        is_correct = learner_ans == item["present_polite"].replace(" ", "")
        correct_form = item["present_polite"]
        hint = item["present_hint"]
    elif payload.target_tense == "past":
        is_correct = learner_ans == item["past_polite"].replace(" ", "")
        correct_form = item["past_polite"]
        hint = item["past_hint"]
    else:
        is_correct = learner_ans == item["future_polite"].replace(" ", "")
        correct_form = item["future_polite"]
        hint = item["future_hint"]
        
    explanation = f"Correct! {hint}" if is_correct else f"Incorrect. The correct form is '{correct_form}'. Hint: {hint}"
    return {
        "correct": is_correct,
        "correct_form": correct_form,
        "explanation": explanation
    }

@router.get("/phase-3/items/politeness-transform")
async def get_phase3_transforms(current_user: User = Depends(get_current_user)):
    return POLITENESS_TRANSFORM_ITEMS

@router.post("/phase-3/items/politeness-transform/answer")
async def check_phase3_transform(payload: PolitenessTransformAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in POLITENESS_TRANSFORM_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    clean_user = payload.user_input.strip().replace(" ", "")
    is_correct = False
    for pat in item["correct_polite_patterns"]:
        if clean_user == pat.replace(" ", ""):
            is_correct = True
            break
            
    return {
        "correct": is_correct,
        "correct_sentence": item["correct_polite_patterns"][0],
        "explanation": item["explanation"]
    }

@router.get("/phase-3/items/context-choice")
async def get_phase3_context_choices(current_user: User = Depends(get_current_user)):
    return CONTEXT_CHOICE_ITEMS

@router.post("/phase-3/items/context-choice/answer")
async def check_phase3_context(payload: ContextChoiceAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in CONTEXT_CHOICE_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    clean_user = payload.user_input.strip().replace(" ", "")
    is_correct = False
    for pat in item["correct_sentences"]:
        if clean_user == pat.replace(" ", ""):
            is_correct = True
            break
            
    return {
        "correct": is_correct,
        "correct_sentence": item["correct_sentences"][0],
        "explanation": item["explanation"]
    }

@router.get("/phase-3/items/dialogue-fix")
async def get_phase3_dialogue_fixes(current_user: User = Depends(get_current_user)):
    return DIALOGUE_FIX_ITEMS

@router.post("/phase-3/items/dialogue-fix/answer")
async def check_phase3_dialogue(payload: DialogueFixAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in DIALOGUE_FIX_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    clean_user = payload.user_input.strip().replace(" ", "")
    is_correct = False
    for pat in item["correct_patterns"]:
        if clean_user == pat.replace(" ", ""):
            is_correct = True
            break
            
    return {
        "correct": is_correct,
        "correct_sentence": item["correct_patterns"][0],
        "explanation": item["explanation"]
    }

@router.post("/phase-3/quiz/start")
async def start_phase3_quiz(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": PHASE_3_QUIZ_BLUEPRINT
    }

@router.post("/phase-3/quiz/answer")
async def check_phase3_quiz_answer(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in PHASE_3_QUIZ_BLUEPRINT if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    
    is_correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": is_correct,
        "explanation": q["explanation"]
    }

@router.post("/phase-3/quiz/finish")
async def finish_phase3_quiz(payload: QuizFinishRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    xp_gained = 50 if payload.score >= 80 else 20
    return {
        "score": payload.score,
        "xp_gained": xp_gained,
        "mastery_updates": {
            "polite_tense_endings": "A1_A2_passed" if payload.score >= 80 else "A1_A2_review",
            "speech_level_choice": "A1_A2_passed" if payload.score >= 80 else "A1_A2_review"
        }
    }

@router.get("/phase-3/homework")
async def get_phase3_homework(current_user: User = Depends(get_current_user)):
    return [
        {"id": "p3_hw1", "text": "Write a 3-sentence dairy entry: 1 sentence in present tense, 1 in past tense, and 1 in future tense. Use polite endings (존댓말) for all sentences."},
        {"id": "p3_hw2", "text": "Pick 5 verbs from your recent vocabulary lists. Write their polite present, past, and future conjugated forms."},
        {"id": "p3_hw3", "text": "Write a short 2-line dialogue between a student and a teacher. Ensure the student uses polite speech (요-form) and the teacher answers politely or casually."}
    ]

@router.post("/phase-3/homework/submit")
async def submit_phase3_homework(payload: HomeworkSubmit, current_user: User = Depends(get_current_user)):
    feedback = []
    for sent in payload.sentences:
        sent = sent.strip()
        if not sent:
            continue
        
        tense = "Unknown"
        speech_level = "Casual"
        
        if any(sent.endswith(s) for s in ["거예요", "거예요.", "겠어요", "겠어요."]):
            tense = "Future"
            speech_level = "Polite"
        elif any(sent.endswith(s) for s in ["았어요", "었어요", "했어요", "았어요.", "었어요.", "했어요.", "였습니다", "였습니다."]):
            tense = "Past"
            speech_level = "Polite"
        elif any(sent.endswith(s) for s in ["아요", "어 요", "어요", "해요", "아요.", "어 요.", "어요.", "해요.", "습니다", "습니다."]):
            tense = "Present"
            speech_level = "Polite"
        elif any(sent.endswith(s) for s in ["거야", "거야."]):
            tense = "Future"
            speech_level = "Casual"
        elif any(sent.endswith(s) for s in ["았어", "었어", "했어", "았어.", "었어.", "했어."]):
            tense = "Past"
            speech_level = "Casual"
        elif any(sent.endswith(s) for s in ["아", "어", "해", "아.", "어.", "해."]):
            tense = "Present"
            speech_level = "Casual"
            
        feedback.append({
            "original": sent,
            "detected_tense": tense,
            "detected_speech_level": speech_level,
            "is_correct": speech_level == "Polite",
            "why": f"Detected {tense} tense in {speech_level} form. Excellent!" if speech_level == "Polite" else f"Detected {tense} tense in {speech_level} form. Try changing it to a polite form (ending in 요 or 거예요) to fulfill the assignment."
        })
    return {
        "feedback": feedback
    }

@router.post("/phase-3/complete")
async def complete_phase3(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "Grammar Lab 3 Complete",
        "polite_tense_accuracy_est": "96%",
        "next_recommended": ["Tense & Aspect Nuance Lab"]
    }

# --- Phase 4: Descriptive Sentences & Adjectives ---

PHASE_4_METADATA = {
    "title": "Grammar Lab 4 – Descriptive Sentences & Adjectives (A2)",
    "subtitle": "Use descriptive verbs to make your Korean more detailed.",
    "description": "In this lab, you'll practise Korean 'adjectives' (descriptive verbs) both at the end of sentences and before nouns, like 'big house', 'interesting movie'.",
    "estimated_minutes": 25,
    "goals": [
        "Use common descriptive verbs to describe people, things, and places",
        "Build noun phrases like 'big house' and 'beautiful city' in Korean",
        "Switch between 'X is Y' sentences and 'Y noun' phrases"
    ],
    "tags": ["A2", "Descriptive verbs", "Noun phrases", "Parallel to Korean 2–3"],
    "parallel_units": "Korean 2 (Daily Life Routines) & Korean 3 (Building Sentences & Stories) Units 1-4"
}

PHASE_4_CORE_DATA = {
    "adjectives": [
        {"dictionary": "크다", "meaning": "to be big", "stem": "크", "predicate_polite": "커요", "modifier_form": "큰"},
        {"dictionary": "작다", "meaning": "to be small", "stem": "작", "predicate_polite": "작아요", "modifier_form": "작은"},
        {"dictionary": "예쁘다", "meaning": "to be pretty/beautiful", "stem": "예쁘", "predicate_polite": "예뻐요", "modifier_form": "예쁜"},
        {"dictionary": "맛있다", "meaning": "to be delicious", "stem": "맛있", "predicate_polite": "맛있어요", "modifier_form": "맛있는"},
        {"dictionary": "아름답다", "meaning": "to be beautiful", "stem": "아름답", "predicate_polite": "아름다워요", "modifier_form": "아름다운"}
    ],
    "position_examples": [
        {"position": "Predicate Position (Sentence Final)", "korean": "집이 커요.", "english": "The house is big."},
        {"position": "Attributive Position (Before Noun)", "korean": "큰 집", "english": "a big house"}
    ]
}

MATCH_ITEMS = [
    {"id": "m1", "sentence": "집이 커요.", "translation": "The house is big.", "np": "큰 집", "np_translation": "a big house"},
    {"id": "m2", "sentence": "영화가 재미있어요.", "translation": "The movie is interesting.", "np": "재미있는 영화", "np_translation": "an interesting movie"},
    {"id": "m3", "sentence": "도시가 아름다워요.", "translation": "The city is beautiful.", "np": "아름다운 도시", "np_translation": "a beautiful city"}
]

POSITION_IDENTIFY_ITEMS = [
    {
        "id": "pi_1",
        "sentence": "새 집이 예뻐요.",
        "adjective": "새",
        "options": ["directly describes the noun ('modifier')", "describes the subject as a full sentence ('predicate')"],
        "correct": "directly describes the noun ('modifier')",
        "explanation": "'새' (new) directly precedes the noun '집' (house), acting as a noun modifier."
    },
    {
        "id": "pi_2",
        "sentence": "음식이 맛있어요.",
        "adjective": "맛있어요",
        "options": ["directly describes the noun ('modifier')", "describes the subject as a full sentence ('predicate')"],
        "correct": "describes the subject as a full sentence ('predicate')",
        "explanation": "'맛있어요' (is delicious) stands at the end of the sentence as the predicate verb describing the subject '음식' (food)."
    }
]

ADJECTIVE_IMAGE_ITEMS = [
    {
        "id": "ai_1",
        "context": "Context: You see a massive house and want to describe it.",
        "options": ["작은 집", "큰 집", "맛있는 집", "새 집"],
        "correct": "큰 집",
        "explanation": "'큰 집' translates to 'a big house' which matches the context of a massive house."
    }
]

PREDICATE_TO_NP_ITEMS = [
    {
        "id": "p2np_1",
        "predicate_sentence": "집이 커요.",
        "english": "The house is big.",
        "correct_np_patterns": ["큰 집", "큰집"],
        "explanation": "Descriptive verb '크다' stem is '크'. Since it ends in a vowel, attach 'ㄴ' to form '큰 집' (big house)."
    },
    {
        "id": "p2np_2",
        "predicate_sentence": "음식이 맛있어요.",
        "english": "The food is delicious.",
        "correct_np_patterns": ["맛있는 음식", "맛있는음식"],
        "explanation": "Descriptive verbs ending in 있다/없다 attach '는' before nouns, forming '맛있는 음식' (delicious food)."
    }
]

NP_TO_PREDICATE_ITEMS = [
    {
        "id": "np2p_1",
        "np": "큰 집",
        "english": "a big house",
        "correct_patterns": ["집이 커요", "집이 커요.", "집은 커요", "집은 커요."],
        "explanation": "Turn the modifier form '큰' back into predicate present polite '커요' (from 크다) and attach subject marker '이' -> '집이 커요'."
    }
]

EXTENDED_NP_ITEMS = [
    {
        "id": "ext_1",
        "noun": "집 (house)",
        "adjectives": ["크다 (to be big)", "예쁘다 (to be beautiful)"],
        "correct_patterns": ["예쁘고 큰 집", "예쁘고 큰집", "크고 예쁜 집", "크고 예쁜집"],
        "explanation": "To combine two descriptive verbs, conjugate the first with '-고' (and/but) and the second in the noun modifier form: '예쁘고 큰 집' or '크고 예쁜 집'."
    }
]

PHASE_4_QUIZ_BLUEPRINT = [
    {
        "id": "q_p4_1",
        "type": "choice",
        "question": "Is '아름다운 도시' a full sentence or a noun phrase?",
        "options": ["Full Sentence (Predicate)", "Noun Phrase (Modifier)"],
        "correct_answer": "Noun Phrase (Modifier)",
        "explanation": "'아름다운' is a modifier modifying the noun '도시' (city), meaning 'a beautiful city'."
    },
    {
        "id": "q_p4_2",
        "type": "choice",
        "question": "Choose the correct modifier form of '작다' (to be small) before the noun '개' (dog):",
        "options": ["작은 개", "작는 개", "작은 개요", "작개"],
        "correct_answer": "작은 개",
        "explanation": "작다 has a consonant ending (작), so we attach -은 to form '작은 개' (small dog)."
    },
    {
        "id": "q_p4_3",
        "type": "choice",
        "question": "Transform the sentence '방이 깨끗해요' (The room is clean) into a noun phrase:",
        "options": ["깨끗한 방", "깨끗은 방", "깨끗하는 방"],
        "correct_answer": "깨끗한 방",
        "explanation": "깨끗하다 ends in a vowel (하), so attach ㄴ to form '깨끗한 방'."
    },
    {
        "id": "q_p4_4",
        "type": "choice",
        "question": "Convert '재미있는 영화' (interesting movie) into a full predicate sentence:",
        "options": ["영화가 재미있어요.", "영화가 재미있는.", "영화가 재미있은."],
        "correct_answer": "영화가 재미있어요.",
        "explanation": "The predicate form is '영화가' (Subject) + '재미있어요' (Verb/Adjective)."
    },
    {
        "id": "q_p4_5",
        "type": "choice",
        "question": "Which modifier conjugation is INCORRECT?",
        "options": [
            "새로운 친구 (from 새롭다)",
            "좋은 날씨 (from 좋다)",
            "크는 집 (from 크다)"
        ],
        "correct_answer": "크는 집 (from 크다)",
        "explanation": "'크다' has a vowel stem, so it must conjugate to '큰 집' instead of '크는 집'."
    }
]

# Request models for Phase 4
class MatchAnswerRequest(BaseModel):
    item_id: str
    learner_np: str

class PositionAnswerRequest(BaseModel):
    item_id: str
    selected_option: str

class AdjectiveImageAnswerRequest(BaseModel):
    item_id: str
    selected_option: str

class PredicateToNPAnswerRequest(BaseModel):
    item_id: str
    user_input: str

class NPToPredicateAnswerRequest(BaseModel):
    item_id: str
    user_input: str

class ExtendedNPAnswerRequest(BaseModel):
    item_id: str
    user_input: str


@router.get("/phases/4/metadata")
async def get_phase4_metadata(current_user: User = Depends(get_current_user)):
    return PHASE_4_METADATA

@router.get("/phases/4/core-data")
async def get_phase4_core_data(current_user: User = Depends(get_current_user)):
    return PHASE_4_CORE_DATA

@router.get("/phase-4/items/match")
async def get_phase4_match(current_user: User = Depends(get_current_user)):
    return MATCH_ITEMS

@router.post("/phase-4/items/match/answer")
async def check_phase4_match(payload: MatchAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in MATCH_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    is_correct = payload.learner_np.strip().replace(" ", "") == item["np"].replace(" ", "")
    explanation = f"Correct! '{item['sentence']}' matches '{item['np']}'." if is_correct else f"Incorrect. The match is '{item['np']}'."
    return {
        "correct": is_correct,
        "explanation": explanation
    }

@router.get("/phase-4/items/position-identify")
async def get_phase4_positions(current_user: User = Depends(get_current_user)):
    return POSITION_IDENTIFY_ITEMS

@router.post("/phase-4/items/position-identify/answer")
async def check_phase4_position(payload: PositionAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in POSITION_IDENTIFY_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    is_correct = payload.selected_option.strip() == item["correct"]
    return {
        "correct": is_correct,
        "explanation": item["explanation"]
    }

@router.get("/phase-4/items/adjective-image")
async def get_phase4_adjective_images(current_user: User = Depends(get_current_user)):
    return ADJECTIVE_IMAGE_ITEMS

@router.post("/phase-4/items/adjective-image/answer")
async def check_phase4_adjective_image(payload: AdjectiveImageAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in ADJECTIVE_IMAGE_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    is_correct = payload.selected_option.strip() == item["correct"]
    return {
        "correct": is_correct,
        "explanation": item["explanation"]
    }

@router.get("/phase-4/items/predicate-to-np")
async def get_phase4_p2np(current_user: User = Depends(get_current_user)):
    return PREDICATE_TO_NP_ITEMS

@router.post("/phase-4/items/predicate-to-np/answer")
async def check_phase4_p2np(payload: PredicateToNPAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in PREDICATE_TO_NP_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    clean_user = payload.user_input.strip().replace(" ", "")
    is_correct = False
    for pat in item["correct_np_patterns"]:
        if clean_user == pat.replace(" ", ""):
            is_correct = True
            break
            
    return {
        "correct": is_correct,
        "correct_np": item["correct_np_patterns"][0],
        "explanation": item["explanation"]
    }

@router.get("/phase-4/items/np-to-predicate")
async def get_phase4_np2p(current_user: User = Depends(get_current_user)):
    return NP_TO_PREDICATE_ITEMS

@router.post("/phase-4/items/np-to-predicate/answer")
async def check_phase4_np2p(payload: NPToPredicateAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in NP_TO_PREDICATE_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    clean_user = payload.user_input.strip().replace(" ", "")
    is_correct = False
    for pat in item["correct_patterns"]:
        if clean_user == pat.replace(" ", ""):
            is_correct = True
            break
            
    return {
        "correct": is_correct,
        "correct_sentence": item["correct_patterns"][0],
        "explanation": item["explanation"]
    }

@router.get("/phase-4/items/extended-np")
async def get_phase4_extended_np(current_user: User = Depends(get_current_user)):
    return EXTENDED_NP_ITEMS

@router.post("/phase-4/items/extended-np/answer")
async def check_phase4_extended_np(payload: ExtendedNPAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in EXTENDED_NP_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    clean_user = payload.user_input.strip().replace(" ", "")
    is_correct = False
    for pat in item["correct_patterns"]:
        if clean_user == pat.replace(" ", ""):
            is_correct = True
            break
            
    return {
        "correct": is_correct,
        "correct_np": item["correct_patterns"][0],
        "explanation": item["explanation"]
    }

@router.post("/phase-4/quiz/start")
async def start_phase4_quiz(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": PHASE_4_QUIZ_BLUEPRINT
    }

@router.post("/phase-4/quiz/answer")
async def check_phase4_quiz_answer(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in PHASE_4_QUIZ_BLUEPRINT if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
        
    is_correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": is_correct,
        "explanation": q["explanation"]
    }

@router.post("/phase-4/quiz/finish")
async def finish_phase4_quiz(payload: QuizFinishRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    xp_gained = 50 if payload.score >= 80 else 20
    return {
        "score": payload.score,
        "xp_gained": xp_gained,
        "mastery_updates": {
            "descriptive_verbs_a2": "A2_passed" if payload.score >= 80 else "A2_review"
        }
    }

@router.get("/phase-4/homework")
async def get_phase4_homework(current_user: User = Depends(get_current_user)):
    return [
        {"id": "p4_hw1", "text": "Write 5 predicate sentences describing objects (e.g. '방이 깨끗해요' / 'The room is clean') and convert them to noun phrases (e.g. '깨끗한 방' / 'a clean room')."},
        {"id": "p4_hw2", "text": "Describe 5 nouns from Korean 2-3 vocabulary using modifiers (e.g. '친절한 친구', '맛있는 음식')."},
        {"id": "p4_hw3", "text": "Speak or write a short 1-minute description of your room, using at least 5 different descriptive verbs."}
    ]

@router.post("/phase-4/homework/submit")
async def submit_phase4_homework(payload: HomeworkSubmit, current_user: User = Depends(get_current_user)):
    feedback = []
    for sent in payload.sentences:
        sent = sent.strip()
        if not sent:
            continue
            
        has_modifier = any(w in sent for w in ["큰", "작은", "예쁜", "아름다운", "맛있는", "새로운", "좋은", "재미있는"])
        has_predicate = any(w in sent for w in ["커요", "작아요", "예뻐요", "아름다워요", "맛있어요", "좋아요", "입니다", "해요", "재미있어요"])
        
        is_correct = has_modifier or has_predicate
        why = "Awesome descriptive structure! You correctly used descriptive verbs as noun modifiers or predicate endings." if is_correct else "Your sentence doesn't seem to contain any standard descriptive verbs (like 큰, 작은, 예쁜, 커요, 작아요, 예뻐요). Try describing an object's size, beauty, or state."
        
        feedback.append({
            "original": sent,
            "is_correct": is_correct,
            "why": why
        })
    return {
        "feedback": feedback
    }

@router.post("/phase-4/complete")
async def complete_phase4(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "Grammar Lab 4 Complete",
        "noun_modifier_accuracy_est": "95%",
        "next_recommended": ["Connectors & Clause Lab"]
    }


# Mock data constants for Phase 5
PHASE_5_METADATA = {
    "title": "Grammar Lab 5 – Connectors & Sentence Linking (A2–B1)",
    "subtitle": "Join ideas with 'and / but / because / so / when / if' in Korean.",
    "description": "In this lab, you'll practise common Korean connectors so you can join short sentences and explain reasons, results, contrasts, and sequences more naturally.",
    "estimated_minutes": 20,
    "goals": [
        "Use simple 'and', 'but', 'because', 'so', 'when/if' patterns",
        "Turn two short sentences into one longer, natural sentence",
        "Choose the right connector for the meaning (addition, contrast, reason, result, time)"
    ],
    "tags": ["A2–B1", "Connectors", "Parallel to Korean 2–3"],
    "parallel_units": "Korean 2 (Daily Life & Routines) & Korean 3 (Building Sentences & Stories) Units 1-4"
}

PHASE_5_CORE_DATA = {
    "connectors": [
        {"korean": "-고", "english": "and", "relation": "Addition", "usage": "Attached to the verb stem to link two actions or states."},
        {"korean": "-지만", "english": "but", "relation": "Contrast", "usage": "Attached to the verb stem to express opposition or contrast."},
        {"korean": "-아서/어서", "english": "because / so", "relation": "Reason/Result", "usage": "Attached to the verb stem to express cause and effect."},
        {"korean": "-(으)면", "english": "if / when", "relation": "Condition", "usage": "Attached to the verb stem to set a condition or time context."},
        {"korean": "-(으)ㄹ 때", "english": "when / during", "relation": "Time", "usage": "Attached to the verb stem to specify the time of action."}
    ],
    "example_pairs": [
        {
            "id": "pair_1",
            "english": "I eat rice and my friend drinks milk.",
            "sentence_1": "저는 밥을 먹어요.",
            "sentence_2": "제 친구는 우유를 마셔요.",
            "combined": "저는 밥을 먹고 제 친구는 우유를 마셔요.",
            "relation": "Addition"
        },
        {
            "id": "pair_2",
            "english": "The weather is cold, but it is sunny.",
            "sentence_1": "날씨가 추워요.",
            "sentence_2": "맑아요.",
            "combined": "날씨가 춥지만 맑아요.",
            "relation": "Contrast"
        },
        {
            "id": "pair_3",
            "english": "It rains, so I take an umbrella.",
            "sentence_1": "비가 와요.",
            "sentence_2": "우산을 가져가요.",
            "combined": "비가 와서 우산을 가져가요.",
            "relation": "Reason/Result"
        }
    ]
}

RELATION_TYPE_ITEMS = [
    {
        "id": "rt_1",
        "sentence_1": "비가 와요. (It is raining.)",
        "sentence_2": "우산을 가져가요. (I take an umbrella.)",
        "options": ["Addition", "Contrast", "Reason", "Result", "Time"],
        "correct": "Result",
        "explanation": "Taking an umbrella is the result of the rain."
    },
    {
        "id": "rt_2",
        "sentence_1": "피곤해요. (I am tired.)",
        "sentence_2": "놀고 싶어요. (I want to play.)",
        "options": ["Addition", "Contrast", "Reason", "Result", "Time"],
        "correct": "Contrast",
        "explanation": "Wanting to play despite being tired shows contrast (but)."
    }
]

CONNECTOR_CHOICE_ITEMS = [
    {
        "id": "cc_1",
        "english_context": "Context: 'I study Korean and my friend studies English.'",
        "sentence_with_blank": "저는 한국어를 공부하[BLANK] 제 친구는 영어를 공부해오.",
        "options": ["고", "지만", "아서"],
        "correct": "고",
        "explanation": "'고' (and) is used to connect two parallel clauses."
    },
    {
        "id": "cc_2",
        "english_context": "Context: 'I am busy, but I study Korean.'",
        "sentence_with_blank": "바쁘[BLANK] 한국어를 공부해요.",
        "options": ["고", "지만", "어서"],
        "correct": "지만",
        "explanation": "'지만' (but) shows contrast between being busy and studying."
    }
]

CONNECTOR_HIGHLIGHT_ITEMS = [
    {
        "id": "ch_1",
        "text": "오늘 비가 와서 도서관에 갔지만 문이 닫혀 있었고 집에서 공부했어요.",
        "translation": "Because it rained today, I went to the library, but the door was closed, and I studied at home.",
        "connectors": [
            {"text": "와서", "relation": "Reason", "start_idx": 5, "end_idx": 7},
            {"text": "갔지만", "relation": "Contrast", "start_idx": 13, "end_idx": 16},
            {"text": "있었고", "relation": "Addition", "start_idx": 24, "end_idx": 27}
        ]
    }
]

JOIN_ITEMS = [
    {
        "id": "jn_1",
        "sentence_1": "밥을 먹다 (to eat rice)",
        "sentence_2": "커피를 마시다 (to drink coffee)",
        "english": "I eat rice and drink coffee.",
        "relation": "Addition",
        "correct_patterns": ["밥을 먹고 커피를 마셔요", "밥을 먹고 커피를 마셔요.", "밥을 먹고 커피를 마십니다", "밥을 먹고 커피를 마십니다."],
        "explanation": "Attach '-고' to the stem '먹' to mean 'and', then conjugate the final verb '마시다'."
    },
    {
        "id": "jn_2",
        "sentence_1": "바쁘다 (to be busy)",
        "sentence_2": "친구를 만나다 (to meet a friend)",
        "english": "I am busy but I meet my friend.",
        "relation": "Contrast",
        "correct_patterns": ["바쁘지만 친구를 만나요", "바쁘지만 친구를 만나요.", "바쁘지만 친구를 만납니다", "바쁘지만 친구를 만납니다."],
        "explanation": "Attach '-지만' to the stem '바쁘' to mean 'but', then conjugate '만나다'."
    }
]

REASON_RESULT_ITEMS = [
    {
        "id": "rr_1",
        "base_sentence": "도서관에 가요. (I go to the library.)",
        "prompt": "Add a reason: 'Because I study...'",
        "correct_patterns": ["공부해서 도서관에 가요", "공부해서 도서관에 가요.", "공부하기 때문에 도서관에 가요"],
        "explanation": "Use '-아서/어서' (because) with 공부하다 -> 공부해서."
    }
]

WHEN_IF_ITEMS = [
    {
        "id": "wi_1",
        "sentence_1": "돈이 있다 (to have money)",
        "sentence_2": "차를 사다 (to buy a car)",
        "english": "If I have money, I buy a car.",
        "correct_patterns": ["돈이 있으면 차를 사요", "돈이 있으면 차를 사요.", "돈이 있으면 차를 삽니다", "돈이 있으면 차를 삽니다."],
        "explanation": "Attach '-(으)면' to the stem '있' -> '있으면' for the conditional 'if'."
    }
]

PHASE_5_QUIZ_BLUEPRINT = [
    {
        "id": "q_p5_1",
        "type": "choice",
        "question": "What relation does the connector '-지만' express?",
        "options": ["Addition (And)", "Contrast (But)", "Reason (Because)", "Time (When)"],
        "correct_answer": "Contrast (But)",
        "explanation": "'-지만' is a contrastive connector meaning 'but / although'."
    },
    {
        "id": "q_p5_2",
        "type": "choice",
        "question": "Choose the correct connector blank for: '날씨가 좋[BLANK] 소풍을 가요.' (The weather is good, so we go on a picnic.)",
        "options": ["고", "지만", "아서", "면"],
        "correct_answer": "아서",
        "explanation": "좋다 has a reason-result form '좋아서' (meaning 'because it is good' or 'it is good, so...')."
    },
    {
        "id": "q_p5_3",
        "type": "choice",
        "question": "Identify the WRONG connector usage:",
        "options": [
            "피곤해서 자요. (I sleep because I'm tired.)",
            "피곤하고 놀아요. (I play and I'm tired.)",
            "피곤하지만 공부해요. (I study although I'm tired.)"
        ],
        "correct_answer": "피곤하고 놀아요. (I play and I'm tired.)",
        "explanation": "'피곤하고 놀아요' is grammatically possible but semantically highly unnatural compared to contrast ('지만') or reason ('해서')."
    },
    {
        "id": "q_p5_4",
        "type": "choice",
        "question": "Choose the best combined version for: '시간이 있어요. 책을 읽어요.' (I have time. I read a book.) using 'when':",
        "options": [
            "시간이 있으면 책을 읽어요.",
            "시간이 있을 때 책을 읽어요.",
            "시간이 있고 책을 읽어요."
        ],
        "correct_answer": "시간이 있을 때 책을 읽어요.",
        "explanation": "When I have time -> 시간이 있을 때. (있으면 is 'if I have time')."
    },
    {
        "id": "q_p5_5",
        "type": "choice",
        "question": "If you want to say 'If it is cold, I stay home', which pattern is correct?",
        "options": [
            "추우면 집에 있어요.",
            "추워서 집에 있어요.",
            "춥고 집에 있어요."
        ],
        "correct_answer": "추우면 집에 있어요.",
        "explanation": "Cold (춥다) stem is 춥-, irregular verb conjugates to 추우- + 면 -> 추우면 (if it is cold)."
    }
]

# Request models for Phase 5
class RelationAnswerRequest(BaseModel):
    item_id: str
    selected_option: str

class ConnectorChoiceAnswerRequest(BaseModel):
    item_id: str
    selected_option: str

class ConnectorHighlightAnswerRequest(BaseModel):
    item_id: str
    selected_text: str
    relation: str

class JoinAnswerRequest(BaseModel):
    item_id: str
    user_input: str

class ReasonResultAnswerRequest(BaseModel):
    item_id: str
    user_input: str

class WhenIfAnswerRequest(BaseModel):
    item_id: str
    user_input: str


@router.get("/phases/5/metadata")
async def get_phase5_metadata(current_user: User = Depends(get_current_user)):
    return PHASE_5_METADATA

@router.get("/phases/5/core-data")
async def get_phase5_core_data(current_user: User = Depends(get_current_user)):
    return PHASE_5_CORE_DATA

@router.get("/phase-5/items/relation-type")
async def get_phase5_relation_type(current_user: User = Depends(get_current_user)):
    return RELATION_TYPE_ITEMS

@router.post("/phase-5/items/relation-type/answer")
async def check_phase5_relation_type(payload: RelationAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in RELATION_TYPE_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    is_correct = payload.selected_option.strip() == item["correct"]
    return {
        "correct": is_correct,
        "explanation": item["explanation"]
    }

@router.get("/phase-5/items/connector-choice")
async def get_phase5_connector_choice(current_user: User = Depends(get_current_user)):
    return CONNECTOR_CHOICE_ITEMS

@router.post("/phase-5/items/connector-choice/answer")
async def check_phase5_connector_choice(payload: ConnectorChoiceAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in CONNECTOR_CHOICE_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    is_correct = payload.selected_option.strip() == item["correct"]
    return {
        "correct": is_correct,
        "explanation": item["explanation"]
    }

@router.get("/phase-5/items/connector-highlight")
async def get_phase5_connector_highlight(current_user: User = Depends(get_current_user)):
    return CONNECTOR_HIGHLIGHT_ITEMS

@router.post("/phase-5/items/connector-highlight/answer")
async def check_phase5_connector_highlight(payload: ConnectorHighlightAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in CONNECTOR_HIGHLIGHT_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if user selected one of the correct connectors
    matched = next((c for c in item["connectors"] if c["text"] == payload.selected_text and c["relation"] == payload.relation), None)
    is_correct = matched is not None
    explanation = f"Correct! '{payload.selected_text}' functions as a '{payload.relation}' connector." if is_correct else "Incorrect. That text and relation pair is not recognized in the context."
    return {
        "correct": is_correct,
        "explanation": explanation
    }

@router.get("/phase-5/items/join")
async def get_phase5_join(current_user: User = Depends(get_current_user)):
    return JOIN_ITEMS

@router.post("/phase-5/items/join/answer")
async def check_phase5_join(payload: JoinAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in JOIN_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    clean_user = payload.user_input.strip().replace(" ", "")
    is_correct = False
    for pat in item["correct_patterns"]:
        if clean_user == pat.replace(" ", ""):
            is_correct = True
            break
    return {
        "correct": is_correct,
        "correct_sentence": item["correct_patterns"][0],
        "explanation": item["explanation"]
    }

@router.get("/phase-5/items/reason-result")
async def get_phase5_reason_result(current_user: User = Depends(get_current_user)):
    return REASON_RESULT_ITEMS

@router.post("/phase-5/items/reason-result/answer")
async def check_phase5_reason_result(payload: ReasonResultAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in REASON_RESULT_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    clean_user = payload.user_input.strip().replace(" ", "")
    is_correct = False
    for pat in item["correct_patterns"]:
        if clean_user == pat.replace(" ", ""):
            is_correct = True
            break
    return {
        "correct": is_correct,
        "correct_sentence": item["correct_patterns"][0],
        "explanation": item["explanation"]
    }

@router.get("/phase-5/items/when-if")
async def get_phase5_when_if(current_user: User = Depends(get_current_user)):
    return WHEN_IF_ITEMS

@router.post("/phase-5/items/when-if/answer")
async def check_phase5_when_if(payload: WhenIfAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in WHEN_IF_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    clean_user = payload.user_input.strip().replace(" ", "")
    is_correct = False
    for pat in item["correct_patterns"]:
        if clean_user == pat.replace(" ", ""):
            is_correct = True
            break
    return {
        "correct": is_correct,
        "correct_sentence": item["correct_patterns"][0],
        "explanation": item["explanation"]
    }

@router.post("/phase-5/quiz/start")
async def start_phase5_quiz(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": PHASE_5_QUIZ_BLUEPRINT
    }

@router.post("/phase-5/quiz/answer")
async def check_phase5_quiz_answer(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in PHASE_5_QUIZ_BLUEPRINT if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    is_correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": is_correct,
        "explanation": q["explanation"]
    }

@router.post("/phase-5/quiz/finish")
async def finish_phase5_quiz(payload: QuizFinishRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    xp_gained = 50 if payload.score >= 80 else 20
    return {
        "score": payload.score,
        "xp_gained": xp_gained,
        "mastery_updates": {
            "connectors_a2b1": "A2B1_passed" if payload.score >= 80 else "A2B1_review"
        }
    }

@router.get("/phase-5/homework")
async def get_phase5_homework(current_user: User = Depends(get_current_user)):
    return [
        {"id": "p5_hw1", "text": "Write 6-8 Korean sentences about your day, and combine them into 3-4 longer sentences using at least 1 'and', 1 'but', 1 'because/so', and 1 'when/if'."},
        {"id": "p5_hw2", "text": "Take 6 simple sentences from Korean 2-3. Pair them and join each pair using a connector that makes sense."},
        {"id": "p5_hw3", "text": "Record or write a short 1-minute description of your study plan or a past weekend using at least 5 connectors."}
    ]

@router.post("/phase-5/homework/submit")
async def submit_phase5_homework(payload: HomeworkSubmit, current_user: User = Depends(get_current_user)):
    feedback = []
    for sent in payload.sentences:
        sent = sent.strip()
        if not sent:
            continue
        
        has_and = "고" in sent or "그리고" in sent
        has_but = "지만" in sent or "하지만" in sent
        has_because = "아서" in sent or "어서" in sent or "해서" in sent or "때문에" in sent
        has_when_if = "면" in sent or "때" in sent
        
        is_correct = has_and or has_but or has_because or has_when_if
        why = "Excellent connector usage! Your sentence successfully links ideas with clear relationships." if is_correct else "Your sentence seems to be a simple clause. Try combining it using connectors like -고, -지만, -아서/어서, or -면."
        
        feedback.append({
            "original": sent,
            "is_correct": is_correct,
            "why": why
        })
    return {
        "feedback": feedback
    }

@router.post("/phase-5/complete")
async def complete_phase5(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "Grammar Lab 5 Complete",
        "sentence_linker_accuracy_est": "96%",
        "next_recommended": ["Tense & Aspect Lab"]
    }


# Mock data constants for Phase 6
PHASE_6_METADATA = {
    "title": "Grammar Lab 6 – Tense & Aspect Nuance (B1)",
    "subtitle": "Say 'used to', 'was doing', and 'already/not yet' naturally in Korean.",
    "description": "In this lab, you'll practise B1‑level nuances of time in Korean: one‑time vs repeated actions, ongoing vs completed actions, and 'already / still / not yet' meanings.",
    "estimated_minutes": 25,
    "goals": [
        "Contrast single past actions with 'used to / often did'",
        "Say 'was doing' vs 'did' in past situations",
        "Use 'already / still / not yet'‑type time expressions correctly"
    ],
    "tags": ["B1", "Tense & Aspect", "Parallel to Korean 3–4"],
    "parallel_units": "Korean 3 (Sentence Linking) & Korean 4 (Real Contexts) Units 1-3"
}

PHASE_6_CORE_DATA = {
    "aspect_types": [
        {"type": "Single Event (Past)", "description": "A completed one-time action in the past.", "example": "어제 영화를 봤어요. (I watched a movie yesterday.)"},
        {"type": "Habitual (Used to)", "description": "A repeated or regular action in the past.", "example": "어릴 때 자주 영화를 보곤 했어요. (When I was young, I used to watch movies often.)"},
        {"type": "Ongoing (Progressive)", "description": "An action that was in progress at a specific time.", "example": "친구 전화 왔을 때 공부하고 있었어요. (I was studying when my friend called.)"},
        {"type": "Already (Completed state)", "description": "An action already finished by now.", "example": "이미 밥을 먹었어요. (I already ate.)"},
        {"type": "Still (Continuing present)", "description": "An action still ongoing in the present.", "example": "아직도 공부하고 있어요. (I'm still studying.)"},
        {"type": "Not Yet (Expected future)", "description": "An action expected but not yet completed.", "example": "아직 안 했어요. (I haven't done it yet.)"}
    ]
}

RECOGNITION_ITEMS = [
    {
        "id": "rec_1",
        "korean": "고등학교 때 자주 축구를 했어요.",
        "english": "In high school I often played soccer.",
        "options": ["one-time past event", "repeated habit ('used to')"],
        "correct": "repeated habit ('used to')",
        "explanation": "The adverb '자주' (often) and the time frame '고등학교 때' (in high school) indicate a repeated past habit."
    },
    {
        "id": "rec_2",
        "korean": "어제 친구를 만났어요.",
        "english": "I met my friend yesterday.",
        "options": ["one-time past event", "repeated habit ('used to')"],
        "correct": "one-time past event",
        "explanation": "The specific time adverb '어제' (yesterday) signals a single completed past event."
    },
    {
        "id": "rec_3",
        "korean": "전화가 왔을 때 자고 있었어요.",
        "english": "I was sleeping when the phone rang.",
        "options": ["completed event", "ongoing background"],
        "correct": "ongoing background",
        "explanation": "'-고 있었어요' shows an ongoing background action (was sleeping) at the time of the call."
    },
    {
        "id": "rec_4",
        "korean": "벌써 숙제를 다 마쳤어요.",
        "english": "I already finished all my homework.",
        "options": ["finished (already)", "continuing (still)", "expected but not done (not yet)"],
        "correct": "finished (already)",
        "explanation": "'벌써' (already) and past tense '마쳤어요' indicate the task is completed."
      }
]

HABIT_VS_SINGLE_ITEMS = [
    {
        "id": "hvs_1",
        "context": "Context: 'When I was a child, I used to eat kimchi often.'",
        "correct_patterns": ["어릴 때 김치를 자주 먹었어요", "어릴 때 자주 김치를 먹었어요", "어릴 때 김치를 자주 먹곤 했어요"],
        "explanation": "Use past tense with a habitual adverb ('자주' - often) or the habit pattern '-곤 했다'."
    }
]

BACKGROUND_EVENT_ITEMS = [
    {
        "id": "bge_1",
        "english": "I was studying when my friend called.",
        "correct_patterns": ["공부하고 있었을 때 친구가 전화했어요", "공부하고 있었는데 친구가 전화했어요", "공부하고 있었을 때 친구가 전화했어요."],
        "explanation": "Use past progressive '~고 있었어요' for the background ('was studying') combined with simple past '전화했어요'."
    }
]

TIME_STATUS_ITEMS = [
    {
        "id": "ts_1",
        "english": "I haven't eaten lunch yet.",
        "correct_patterns": ["아직 점심을 안 먹었어요", "아직 점심 안 먹었어요", "점심을 아직 안 먹었어요"],
        "explanation": "Not yet is expressed using '아직' followed by the negative past form '안 먹었어요'."
    }
]

PHASE_6_QUIZ_BLUEPRINT = [
    {
        "id": "q_p6_1",
        "type": "choice",
        "question": "Which of the following describes a repeated habit in the past?",
        "options": [
            "작년에 한국에 갔어요.",
            "어릴 때 매일 한국어를 공부했어요.",
            "지금 공부하고 있어요."
        ],
        "correct_answer": "어릴 때 매일 한국어를 공부했어요.",
        "explanation": "'매일' (every day) and past tense '공부했어요' show a repeated past habit."
    },
    {
        "id": "q_p6_2",
        "type": "choice",
        "question": "Select the correct Korean sentence for: 'I was eating dinner when the guests arrived.'",
        "options": [
            "손님이 왔을 때 저녁을 먹고 있었어요.",
            "손님이 왔을 때 저녁을 먹었어요.",
            "손님이 왔을 때 저녁을 먹을 거예요."
        ],
        "correct_answer": "손님이 왔을 때 저녁을 먹고 있었어요.",
        "explanation": "'-고 있었어요' expresses the past progressive ('was eating') which sets the background action."
    },
    {
        "id": "q_p6_3",
        "type": "choice",
        "question": "Choose the best translation for: 'I haven't read that book yet.'",
        "options": [
            "이미 그 책을 읽었어요.",
            "아직도 그 책을 읽고 있어요.",
            "아직 그 책을 안 읽었어요."
        ],
        "correct_answer": "아직 그 책을 안 읽었어요.",
        "explanation": "'아직' (yet) + negative past tense '안 읽었어요' means 'haven't read yet'."
    },
    {
        "id": "q_p6_4",
        "type": "choice",
        "question": "Choose the best sentence to say: 'I'm still studying Korean.'",
        "options": [
            "아직도 한국어를 공부하고 있어요.",
            "이미 한국어를 공부했어요.",
            "아직 한국어를 안 공부했어요."
        ],
        "correct_answer": "아직도 한국어를 공부하고 있어요.",
        "explanation": "'아직도' (still) + present continuous '공부하고 있어요' means 'still studying'."
    },
    {
        "id": "q_p6_5",
        "type": "choice",
        "question": "What is the difference between '어제 공부했어요' and '공부하고 있었어요'?",
        "options": [
            "'어제 공부했어요' emphasizes the ongoing action, while '공부하고 있었어요' is a future promise.",
            "'어제 공부했어요' is simple past (completed), while '공부하고 있었어요' emphasizes the action was in progress (ongoing) at a past moment.",
            "They mean exactly the same thing."
        ],
        "correct_answer": "'어제 공부했어요' is simple past (completed), while '공부하고 있었어요' emphasizes the action was in progress (ongoing) at a past moment.",
        "explanation": "Past progressive '-고 있었어요' shows aspect of ongoing duration in the past, while simple past '-았/었어요' shows completion."
    }
]

# Request models for Phase 6
class RecognitionAnswerRequest(BaseModel):
    item_id: str
    selected_option: str

class HabitSingleAnswerRequest(BaseModel):
    item_id: str
    user_input: str

class BackgroundEventAnswerRequest(BaseModel):
    item_id: str
    user_input: str

class TimeStatusAnswerRequest(BaseModel):
    item_id: str
    user_input: str


@router.get("/phases/6/metadata")
async def get_phase6_metadata(current_user: User = Depends(get_current_user)):
    return PHASE_6_METADATA

@router.get("/phases/6/core-data")
async def get_phase6_core_data(current_user: User = Depends(get_current_user)):
    return PHASE_6_CORE_DATA

@router.get("/phase-6/items/recognition")
async def get_phase6_recognition(current_user: User = Depends(get_current_user)):
    return RECOGNITION_ITEMS

@router.post("/phase-6/items/recognition/answer")
async def check_phase6_recognition(payload: RecognitionAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in RECOGNITION_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    is_correct = payload.selected_option.strip() == item["correct"]
    return {
        "correct": is_correct,
        "explanation": item["explanation"]
    }

@router.get("/phase-6/items/habit-vs-single")
async def get_phase6_habit_single(current_user: User = Depends(get_current_user)):
    return HABIT_VS_SINGLE_ITEMS

@router.post("/phase-6/items/habit-vs-single/answer")
async def check_phase6_habit_single(payload: HabitSingleAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in HABIT_VS_SINGLE_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    clean_user = payload.user_input.strip().replace(" ", "")
    is_correct = False
    for pat in item["correct_patterns"]:
        if clean_user == pat.replace(" ", ""):
            is_correct = True
            break
    return {
        "correct": is_correct,
        "correct_sentence": item["correct_patterns"][0],
        "explanation": item["explanation"]
    }

@router.get("/phase-6/items/background-event")
async def get_phase6_background_event(current_user: User = Depends(get_current_user)):
    return BACKGROUND_EVENT_ITEMS

@router.post("/phase-6/items/background-event/answer")
async def check_phase6_background_event(payload: BackgroundEventAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in BACKGROUND_EVENT_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    clean_user = payload.user_input.strip().replace(" ", "")
    is_correct = False
    for pat in item["correct_patterns"]:
        if clean_user == pat.replace(" ", ""):
            is_correct = True
            break
    return {
        "correct": is_correct,
        "correct_sentence": item["correct_patterns"][0],
        "explanation": item["explanation"]
    }

@router.get("/phase-6/items/time-status")
async def get_phase6_time_status(current_user: User = Depends(get_current_user)):
    return TIME_STATUS_ITEMS

@router.post("/phase-6/items/time-status/answer")
async def check_phase6_time_status(payload: TimeStatusAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in TIME_STATUS_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    clean_user = payload.user_input.strip().replace(" ", "")
    is_correct = False
    for pat in item["correct_patterns"]:
        if clean_user == pat.replace(" ", ""):
            is_correct = True
            break
    return {
        "correct": is_correct,
        "correct_sentence": item["correct_patterns"][0],
        "explanation": item["explanation"]
    }

@router.post("/phase-6/quiz/start")
async def start_phase6_quiz(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": PHASE_6_QUIZ_BLUEPRINT
    }

@router.post("/phase-6/quiz/answer")
async def check_phase6_quiz_answer(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in PHASE_6_QUIZ_BLUEPRINT if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    is_correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": is_correct,
        "explanation": q["explanation"]
    }

@router.post("/phase-6/quiz/finish")
async def finish_phase6_quiz(payload: QuizFinishRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    xp_gained = 50 if payload.score >= 80 else 20
    return {
        "score": payload.score,
        "xp_gained": xp_gained,
        "mastery_updates": {
            "tense_aspect_b1": "B1_passed" if payload.score >= 80 else "B1_review"
        }
    }

@router.get("/phase-6/homework")
async def get_phase6_homework(current_user: User = Depends(get_current_user)):
    return [
        {"id": "p6_hw1", "text": "Write 3 sentences about past habits in childhood, and 3 sentences about one-time past events."},
        {"id": "p6_hw2", "text": "Write a 4-6 sentence story describing an action that was in progress ('was doing') when another event happened."},
        {"id": "p6_hw3", "text": "Write 3 sentences about your current goals: 1 already completed, 1 still doing, 1 not yet completed."}
    ]

@router.post("/phase-6/homework/submit")
async def submit_phase6_homework(payload: HomeworkSubmit, current_user: User = Depends(get_current_user)):
    feedback = []
    for sent in payload.sentences:
        sent = sent.strip()
        if not sent:
            continue
        
        has_progressive = "고 있" in sent
        has_already = "이미" in sent or "벌써" in sent
        has_still = "아직도" in sent or "여전히" in sent
        has_not_yet = "아직" in sent and "안" in sent
        has_habit = "자주" in sent or "매일" in sent or "곤 했" in sent
        
        is_correct = has_progressive or has_already or has_still or has_not_yet or has_habit
        why = "Excellent narrative aspect grammar! Your sentence demonstrates clear control of time and aspect nuances." if is_correct else "Your sentence seems to use simple default tense. Try adding frequency adverbs (자주, 매일), progressive helpers (~고 있었어요), or time status words (이미, 아직) to refine aspect."
        
        feedback.append({
            "original": sent,
            "is_correct": is_correct,
            "why": why
        })
    return {
        "feedback": feedback
    }

@router.post("/phase-6/complete")
async def complete_phase6(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "Grammar Lab 6 Complete",
        "aspect_accuracy_est": "97%",
        "next_recommended": ["Complex Relative Sentences Lab"]
    }





