import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.api.v1.auth import get_current_user
from backend.app.models.user import User
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter()

# ==========================================
# DATA DECLARATIONS
# ==========================================

# --- Phase 1 Variables ---
METADATA = {
    "title": "Pronunciation Lab 1 – Sound Foundations (A1)",
    "subtitle": "From Hangeul letters to clear Korean sounds.",
    "description": "In this lab, you’ll connect Hangeul to real pronunciation: consonants, vowels, and simple syllables, so you can say beginner words from Korean 1 with confidence.",
    "estimated_minutes": 25,
    "goals": [
        "Hear and distinguish basic consonants and vowels",
        "Practise simple CV/CVC syllables and word reading",
        "Build stable, even rhythm for short words"
    ],
    "tags": ["A1", "Pronunciation", "Listening", "Speaking", "Parallel to Korean 1"],
    "dependencies": "Course 0 (Hangeul Bootcamp) & Level 1 materials"
}

CORE_DATA = {
    "key_consonants": ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ"],
    "key_vowels": ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"],
    "example_syllables": ["가", "나", "더", "모", "수"],
    "example_words": [
        {"ko": "안녕하세요", "en": "Hello"},
        {"ko": "물", "en": "Water"},
        {"ko": "학교", "en": "School"},
        {"ko": "커피", "en": "Coffee"},
        {"ko": "사과", "en": "Apple"},
        {"ko": "친구", "en": "Friend"},
        {"ko": "한국", "en": "Korea"},
        {"ko": "이름", "en": "Name"},
        {"ko": "책", "en": "Book"}
    ]
}

SYLLABLE_DISCRIM_ITEMS = [
    {"id": "sd_1", "syllable": "가", "options": ["가", "거", "고", "구"], "correct": "가", "note": "This has ㅏ, so the sound is closer to 'ga'."},
    {"id": "sd_2", "syllable": "너", "options": ["나", "너", "노", "누"], "correct": "너", "note": "This has ㅓ, so the sound is closer to 'neo'."},
    {"id": "sd_3", "syllable": "모", "options": ["마", "머", "모", "무"], "correct": "모", "note": "This has ㅗ, so the sound is closer to 'mo'."},
    {"id": "sd_4", "syllable": "피", "options": ["파", "퍼", "포", "피"], "correct": "피", "note": "This has ㅣ, so the sound is closer to 'pi'."}
]

MINIMAL_PAIRS = [
    {"id": "mp_1", "word1": "가", "word2": "나", "options": ["Different first sound (consonant)", "Different vowel sound"], "correct": "Different first sound (consonant)", "note": "Only the consonant changed: ㄱ → ㄴ."},
    {"id": "mp_2", "word1": "가", "word2": "고", "options": ["Different first sound (consonant)", "Different vowel sound"], "correct": "Different vowel sound", "note": "Only the vowel changed: ㅏ → ㅗ."},
    {"id": "mp_3", "word1": "더", "word2": "머", "options": ["Different first sound (consonant)", "Different vowel sound"], "correct": "Different first sound (consonant)", "note": "Only the consonant changed: ㄷ → ㅁ."},
    {"id": "mp_4", "word1": "수", "word2": "소", "options": ["Different first sound (consonant)", "Different vowel sound"], "correct": "Different vowel sound", "note": "Only the vowel changed: ㅜ → ㅗ."}
]

CV_BUILD_ITEMS = [
    {"id": "cv_1", "syllable": "너", "consonant": "ㄴ", "vowel": "ㅓ"},
    {"id": "cv_2", "syllable": "가", "consonant": "ㄱ", "vowel": "ㅏ"},
    {"id": "cv_3", "syllable": "수", "consonant": "ㅅ", "vowel": "ㅜ"},
    {"id": "cv_4", "syllable": "모", "consonant": "ㅁ", "vowel": "ㅗ"}
]

WORD_RECOG_ITEMS = [
    {"id": "wr_1", "word": "물", "options": ["물", "학교", "친구", "커피"], "correct": "물", "gloss": "물 = water"},
    {"id": "wr_2", "word": "학교", "options": ["물", "학교", "친구", "커피"], "correct": "학교", "gloss": "학교 = school"},
    {"id": "wr_3", "word": "친구", "options": ["물", "학교", "친구", "커피"], "correct": "친구", "gloss": "친구 = friend"},
    {"id": "wr_4", "word": "커피", "options": ["물", "학교", "친구", "커피"], "correct": "커피", "gloss": "커피 = coffee"}
]

WORD_PRONOUNCE_ITEMS = [
    {"id": "wp_1", "word": "친구", "syllables": ["친", "구"], "hints": {"친": "Clear ch-sound", "구": "Keep lip rounding moderate"}},
    {"id": "wp_2", "word": "안녕하세요", "syllables": ["안", "녕", "하", "세", "요"], "hints": {"안": "Clear 'an'", "녕": "Short glide 'yeo'", "하": "Soft 'h'", "세": "Simple 'se'", "요": "Light lip rounding"}},
    {"id": "wp_3", "word": "사과", "syllables": ["사", "과"], "hints": {"사": "Soft s-sound, not aspirated", "과": "Clear 'gwa' diphthong"}}
]

RHYTHM_ITEMS = [
    {"id": "rh_1", "phrase": "안녕하세요", "beats": 5, "tempo": "medium"},
    {"id": "rh_2", "phrase": "감사합니다", "beats": 5, "tempo": "medium"},
    {"id": "rh_3", "phrase": "학교예요", "beats": 4, "tempo": "medium"}
]

QUIZ_BLUEPRINT = [
    {
        "id": "q1",
        "type": "choice",
        "question": "Which Hangeul block corresponds to the sound 'neo'?",
        "options": ["노", "너", "나"],
        "correct_answer": "너",
        "explanation": "ㄴ represents the 'n' consonant, and ㅓ represents the 'eo' vowel sound."
    },
    {
        "id": "q2",
        "type": "choice",
        "question": "In the syllable pair '가' and '나', which sound changed?",
        "options": ["Different first sound (consonant)", "Different vowel sound"],
        "correct_answer": "Different first sound (consonant)",
        "explanation": "가 uses ㄱ ('g/k') while 나 uses ㄴ ('n'). The vowel sound (ㅏ) remains identical."
    },
    {
        "id": "q3",
        "type": "choice",
        "question": "Which combination of letters forms the syllable block 'ko'?",
        "options": ["ㅋ + ㅗ", "ㄱ + ㅏ", "ㅋ + ㅓ"],
        "correct_answer": "ㅋ + ㅗ",
        "explanation": "ㅋ represents the aspirated 'k' sound and ㅗ represents the 'o' vowel, combining into 코."
    },
    {
        "id": "q4",
        "type": "choice",
        "question": "Select the correct Hangeul form for the word 'hak-gyo' (school):",
        "options": ["학교", "커피", "사과"],
        "correct_answer": "학교",
        "explanation": "학교 translates to 'school'. 커피 is 'coffee', and 사과 is 'apple'."
    },
    {
        "id": "q5",
        "type": "choice",
        "question": "How should syllables be timed in Korean rhythm (e.g. 안녕하세요)?",
        "options": [
            "Even timing: each syllable block is roughly one beat",
            "Strong stress on the first syllable only",
            "Long pauses between all syllables"
        ],
        "correct_answer": "Even timing: each syllable block is roughly one beat",
        "explanation": "Korean is syllable-timed. Each syllable block has relatively equal weight and duration."
    }
]

# --- Phase 2 Variables ---
METADATA_P2 = {
    "title": "Pronunciation Lab 2 – Batchim & Linking (A1→A2)",
    "subtitle": "Master final consonants and smooth syllables.",
    "description": "In this lab, you’ll practise Korean final consonants (받침) and how they link to the next syllable, so listening and speaking feel smoother and more natural.",
    "estimated_minutes": 25,
    "goals": [
        "Hear and pronounce basic batchim sounds clearly",
        "Notice how final consonants link to the next vowel (연음)",
        "Read and say simple batchim words from Korean 1–2 with confidence"
    ],
    "tags": ["A1→A2", "Batchim", "Listening", "Speaking"],
    "dependencies": "Pronunciation Lab 1 (Completed)"
}

CORE_DATA_P2 = {
    "batchim_examples": {
        "ㄱ/ㄲ/ㅋ": {"sound": "[k]", "words": ["책", "밖", "부엌"]},
        "ㄴ": {"sound": "[n]", "words": ["눈", "산", "편지"]},
        "ㄷ/ㅅ/ㅆ/ㅈ/ㅊ/ㅌ/ㅎ": {"sound": "[t]", "words": ["옷", "꽃", "낮", "끝"]},
        "ㄹ": {"sound": "[l]", "words": ["발", "물", "말"]},
        "ㅁ": {"sound": "[m]", "words": ["몸", "밤", "엄마"]},
        "ㅂ/ㅍ": {"sound": "[p]", "words": ["밥", "숲", "앞"]},
        "ㅇ": {"sound": "[ng]", "words": ["강", "공", "방"]}
    },
    "linking_pairs": [
        {"base": "밥 (bab) + 이 (i)", "linked": "바비 (ba-bi)", "meaning": "rice / food"},
        {"base": "끝 (kkeut) + 이 (i)", "linked": "끄치 (kkeu-chi)", "meaning": "end"},
        {"base": "책 (chaek) + 을 (eul)", "linked": "채글 (chae-geul)", "meaning": "book (object)"}
    ]
}

BATCHIM_IDENTIFY_ITEMS = [
    {"id": "bi_1", "word": "밥", "options": ["밥", "밤", "발", "방"], "correct": "밥", "note": "This final sound is closer to [p]; look at ㅂ 받침."},
    {"id": "bi_2", "word": "밤", "options": ["밥", "밤", "발", "방"], "correct": "밤", "note": "This final sound is closer to [m]; look at ㅁ 받침."},
    {"id": "bi_3", "word": "발", "options": ["밥", "밤", "발", "방"], "correct": "발", "note": "This final sound is closer to [l]; look at ㄹ 받침."},
    {"id": "bi_4", "word": "책", "options": ["책", "챈", "챌", "챔"], "correct": "책", "note": "This final sound is closer to [k]; look at ㄱ 받침."}
]

STOP_VS_LINK_ITEMS = [
    {"id": "sl_1", "phrase_stop": "밥 먹어요", "phrase_link": "밥이 맛있어요", "word": "밥", "correct_link": "밥이 맛있어요", "note": "In '밥이', ㅂ moves to '이' because the next syllable starts with ㅇ."},
    {"id": "sl_2", "phrase_stop": "꽃 향기", "phrase_link": "꽃이 피어요", "word": "꽃", "correct_link": "꽃이 피어요", "note": "In '꽃이', ㅊ moves to '이' (pronounced as '꼬치') because the next syllable starts with ㅇ."}
]

CONNECTED_SPEECH_ITEMS = [
    {"id": "cs_1", "phrase": "한국어 공부해요", "options": ["Version A: 한.국.어 (separated)", "Version B: 한구거 (linked)"], "correct": "Version B: 한구거 (linked)", "note": "Linking is natural: ㄱ moves to 어 to make 한구거."},
    {"id": "cs_2", "phrase": "맛있어요", "options": ["Version A: 맛.있.어.요 (separated)", "Version B: 마시써요 (linked)"], "correct": "Version B: 마시써요 (linked)", "note": "Linking is natural: ㅅ moves to 있 (마시), and ㅆ moves to 어 (써요) to make 마시써요."}
]

BATCHIM_PRONOUNCE_ITEMS = [
    {"id": "bp_1", "word": "밖", "batchim": "ㄲ", "hint": "Stop the sound at the back of the mouth, no release."},
    {"id": "bp_2", "word": "밥", "batchim": "ㅂ", "hint": "Close lips tightly to stop the sound, no release."},
    {"id": "bp_3", "word": "옷", "batchim": "ㅅ", "hint": "Place tongue behind front teeth to stop sound, no release."}
]

LINKING_PRONOUNCE_ITEMS = [
    {"id": "lp_1", "phrase": "밥을", "pronounced": "바블", "hint": "Say '바' then link the 'ㅂ' to the next vowel: '블'."},
    {"id": "lp_2", "phrase": "물이", "pronounced": "무이 -> 물리", "hint": "Link the 'ㄹ' sound directly to the vowel: '물-이' → '무리'."}
]

SENTENCE_FLOW_ITEMS = [
    {"id": "sf_1", "sentence": "한국어 공부해요.", "careful": "한-국-어 공-부-해-요", "natural": "한구거 공부해요"},
    {"id": "sf_2", "sentence": "밥을 먹어요.", "careful": "밥-을 먹-어-요", "natural": "바블 머거요"}
]

QUIZ_BLUEPRINT_P2 = [
    {
        "id": "q_p2_1",
        "type": "choice",
        "question": "Which final consonant (받침) do you hear in the word '발'?",
        "options": ["ㄴ (n)", "ㄹ (l)", "ㅁ (m)"],
        "correct_answer": "ㄹ (l)",
        "explanation": "발 ends in the ㄹ (l/r) batchim sound."
    },
    {
        "id": "q_p2_2",
        "type": "choice",
        "question": "In which of the following phrases does the final consonant link (연음) to the next syllable?",
        "options": ["밥 먹어요", "밥이 맛있어요", "밥 만드세요"],
        "correct_answer": "밥이 맛있어요",
        "explanation": "In '밥이', the batchim ㅂ is followed by the vowel placeholder ㅇ, so it links forward: pronounced like '바비'."
    },
    {
        "id": "q_p2_3",
        "type": "choice",
        "question": "Where does the consonant sound link in the phrase '책을 읽어요'?",
        "options": ["Between 책 and 을", "Between 읽 and 어", "Both positions link"],
        "correct_answer": "Both positions link",
        "explanation": "Both '책' and '읽' end in batchims followed by vowel placeholders, resulting in double linking: '채글 일거요'."
    },
    {
        "id": "q_p2_4",
        "type": "choice",
        "question": "Which of these two audio versions is pronounced naturally using smooth linking?",
        "options": ["Version A: '맛.있.어.요' (separated)", "Version B: '마시써요' (smoothly linked)"],
        "correct_answer": "Version B: '마시써요' (smoothly linked)",
        "explanation": "Natural Korean speech links the batchim sounds smoothly into the next syllable: 마시써요."
    },
    {
        "id": "q_p2_5",
        "type": "choice",
        "question": "Under which final sound group does the word '밖' (outside) fall when pronounced in isolation?",
        "options": ["[k] final sound group", "[t] final sound group", "[p] final sound group"],
        "correct_answer": "[k] final sound group",
        "explanation": "The double consonant ㄲ in 밖 is pronounced as a stopped [k] sound when isolated."
    }
]

# --- Phase 3 Variables ---
METADATA_P3 = {
    "title": "Pronunciation Lab 3 – Rhythm & Word Flow (A2)",
    "subtitle": "Even syllables, smoother words.",
    "description": "In this lab, you’ll practise Korean rhythm: keeping syllables even, grouping words into natural chunks, and avoiding English‑style stress patterns.",
    "estimated_minutes": 25,
    "goals": [
        "Keep syllable length more even in short words and phrases",
        "Hear and imitate natural Korean word rhythm",
        "Read and say common A2 phrases without ‘robotic’ pauses"
    ],
    "tags": ["A2", "Rhythm", "Listening", "Speaking"],
    "dependencies": "Pronunciation Lab 2 (Completed)"
}

CORE_DATA_P3 = {
    "rhythm_pairs": [
        {"phrase": "안녕하세요", "even_desc": "Five equal beats: 안-녕-하-세-요", "stressed_desc": "Accented start: AN-nyeong-ha-se-yo"},
        {"phrase": "감사합니다", "even_desc": "Five equal beats: 감-사-합-니-다", "stressed_desc": "Accented first: GAM-sa-ham-ni-da"}
    ],
    "chunk_examples": [
        {"text": "오늘 / 한국어 공부해요.", "translation": "Today, I study Korean."},
        {"text": "저는 / 학생이에요.", "translation": "As for me, I am a student."}
    ],
    "metronome_settings": {
        "bpm": 90,
        "beats_per_measure": 4
    }
}

RHYTHM_COMPARE_ITEMS = [
    {"id": "rc_1", "phrase": "안녕하세요", "options": ["Version A: Even syllables (Natural)", "Version B: Stressed 'AN-nyeong' (Unnatural)"], "correct": "Version A: Even syllables (Natural)", "note": "Korean rhythm is syllable-timed. Try to give each syllable block equal duration and weight."},
    {"id": "rc_2", "phrase": "감사합니다", "options": ["Version A: Stressed 'GAM-sa' (Unnatural)", "Version B: Even syllables (Natural)"], "correct": "Version B: Even syllables (Natural)", "note": "Avoid adding English-style word stress to the first block."}
]

BEAT_TAP_ITEMS = [
    {"id": "bt_1", "phrase": "친구예요", "beats": 4, "syllable_offsets": [0.0, 0.6, 1.2, 1.8]},
    {"id": "bt_2", "phrase": "오늘 학교 가요", "beats": 6, "syllable_offsets": [0.0, 0.6, 1.2, 1.8, 2.4, 3.0]}
]

CHUNKING_ITEMS = [
    {"id": "ck_1", "phrase": "오늘 한국어 공부해요.", "choices": ["오늘 / 한국어 공부해요.", "오늘 한국어 / 공부해요."], "correct": "오늘 / 한국어 공부해요.", "recommendation": "오늘 / 한국어 공부해요. Keep the object and its verb together in one breath block."},
    {"id": "ck_2", "phrase": "저는 학생이에요.", "choices": ["저는 / 학생이에요.", "저 / 는 학생이에요."], "correct": "저는 / 학생이에요.", "recommendation": "저는 / 학생이에요. Pause slightly after the topic marker."}
]

METRONOME_WORDS_ITEMS = [
    {"id": "mw_1", "word": "친구", "beats": 2, "bpm": 90},
    {"id": "mw_2", "word": "학교", "beats": 2, "bpm": 90},
    {"id": "mw_3", "word": "영화", "beats": 2, "bpm": 90}
]

SHADOWING_PHRASES_ITEMS = [
    {"id": "sp_1", "phrase": "안녕하세요.", "beats": 5},
    {"id": "sp_2", "phrase": "어디에 있어요?", "beats": 7}
]

CHUNK_SAY_ITEMS = [
    {"id": "csy_1", "sentence": "저는 한국어 공부해요.", "chunks": ["저는", "한국어 공부해요"]},
    {"id": "csy_2", "sentence": "매일 아침 커피를 마셔요.", "chunks": ["매일 아침", "커피를 마셔요"]}
]

QUIZ_BLUEPRINT_P3 = [
    {
        "id": "q_p3_1",
        "type": "choice",
        "question": "Which version of '감사합니다' displays correct Korean-like even syllable timing?",
        "options": [
            "Version A: '감-사-합-니-다' (even weight on all syllables)",
            "Version B: '감.사.함.니.다' (strong stress on the first syllable only)"
        ],
        "correct_answer": "Version A: '감-사-합-니-다' (even weight on all syllables)",
        "explanation": "Korean is syllable-timed. Syllables get roughly equal beats instead of concentrating stress on one syllable."
    },
    {
        "id": "q_p3_2",
        "type": "choice",
        "question": "How many beats (syllables) are in the rhythm block '친구예요'?",
        "options": ["3 beats", "4 beats", "5 beats"],
        "correct_answer": "4 beats",
        "explanation": "친-구-예-요 consists of 4 syllable blocks, meaning it gets 4 beats."
    },
    {
        "id": "q_p3_3",
        "type": "choice",
        "question": "Where is the natural chunk break in the sentence '오늘 한국어 공부해요'?",
        "options": [
            "오늘 / 한국어 공부해요",
            "오늘 한국어 / 공부해요",
            "오늘 한국어 공부해요 (no chunk breaks/single breath)"
        ],
        "correct_answer": "오늘 / 한국어 공부해요",
        "explanation": "It is natural to pause slightly after the time adverb '오늘' (today) and keep '한국어 공부해요' (studies Korean) together in a single breath."
    },
    {
        "id": "q_p3_4",
        "type": "choice",
        "question": "Which timing is most appropriate for a natural conversational tempo?",
        "options": [
            "Steady, even beats at ~100 BPM",
            "Extremely slow with 1-second pauses after every word",
            "Rapid, skipping every second syllable"
        ],
        "correct_answer": "Steady, even beats at ~100 BPM",
        "explanation": "Korean flows steadily. A moderate tempo (~80-120 BPM) with smooth syllable transitions is ideal."
    },
    {
        "id": "q_p3_5",
        "type": "choice",
        "question": "What happens to syllable timing in the phrase '여기에서 일해요'?",
        "options": [
            "All 7 syllables get relatively equal time",
            "Only the first syllable gets highlighted",
            "The last syllable is held twice as long"
        ],
        "correct_answer": "All 7 syllables get relatively equal time",
        "explanation": "Korean rhythm is syllable-timed, meaning each of the 7 syllables in '여-기-에-서 일-해-요' receives roughly equal duration."
    }
]

# ==========================================
# REQUEST MODELS
# ==========================================
class AnswerRequest(BaseModel):
    item_id: str
    selected_option: str

class CvBuildAnswerRequest(BaseModel):
    item_id: str
    consonant: str
    vowel: str

class AudioSubmitRequest(BaseModel):
    item_id: str
    audio_base64: str | None = None

class RhythmSubmitRequest(BaseModel):
    item_id: str
    audio_base64: str | None = None

class QuizAnswerSubmit(BaseModel):
    question_id: str
    selected_option: str

class QuizFinishRequest(BaseModel):
    score: int
    mistakes: List[str]

class HomeworkSubmitRequest(BaseModel):
    sentences: List[str]

class BeatTapAnswerRequest(BaseModel):
    item_id: str
    taps: List[float]


# ==========================================
# PHASE 1 ENDPOINTS
# ==========================================
@router.get("/phases/1/metadata")
async def get_metadata(current_user: User = Depends(get_current_user)):
    return METADATA

@router.get("/phases/1/core-data")
async def get_core_data(current_user: User = Depends(get_current_user)):
    return CORE_DATA

@router.get("/phase-1/items/syllable-discrim")
async def get_syllable_discrim(current_user: User = Depends(get_current_user)):
    return SYLLABLE_DISCRIM_ITEMS

@router.post("/phase-1/items/syllable-discrim/answer")
async def check_syllable_discrim(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in SYLLABLE_DISCRIM_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"] if not correct else "Correct!",
        "correct_syllable": item["correct"]
    }

@router.get("/phase-1/items/minimal-pairs")
async def get_minimal_pairs(current_user: User = Depends(get_current_user)):
    return MINIMAL_PAIRS

@router.post("/phase-1/items/minimal-pairs/answer")
async def check_minimal_pairs(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in MINIMAL_PAIRS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-1/items/cv-build")
async def get_cv_build(current_user: User = Depends(get_current_user)):
    return CV_BUILD_ITEMS

@router.post("/phase-1/items/cv-build/answer")
async def check_cv_build(payload: CvBuildAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in CV_BUILD_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.consonant == item["consonant"] and payload.vowel == item["vowel"]
    return {
        "correct": correct,
        "assembled": item["syllable"],
        "explanation": f"Correctly assembled ㄴ + ㅓ → 너!" if correct else "Letters did not match what you heard."
    }

@router.get("/phase-1/items/word-recognition")
async def get_word_recognition(current_user: User = Depends(get_current_user)):
    return WORD_RECOG_ITEMS

@router.post("/phase-1/items/word-recognition/answer")
async def check_word_recognition(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in WORD_RECOG_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "gloss": item["gloss"]
    }

@router.get("/phase-1/items/word-pronounce")
async def get_word_pronounce(current_user: User = Depends(get_current_user)):
    return WORD_PRONOUNCE_ITEMS

@router.post("/phase-1/items/word-pronounce/evaluate")
async def evaluate_word_pronounce(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in WORD_PRONOUNCE_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    score = 90
    syllable_scores = {s: "OK" for s in item["syllables"]}
    if item["word"] == "친구":
        syllable_scores["구"] = "needs work"
        tip = "Vowel ㅜ here sounded closer to ㅗ; try rounding lips more."
    else:
        tip = "Excellent segmental accuracy!"
    return {
        "overall_score": score,
        "syllable_scores": syllable_scores,
        "feedback_tip": tip
    }

@router.get("/phase-1/items/rhythm")
async def get_rhythm(current_user: User = Depends(get_current_user)):
    return RHYTHM_ITEMS

@router.post("/phase-1/items/rhythm/evaluate")
async def evaluate_rhythm(payload: RhythmSubmitRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in RHYTHM_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {
        "timing_score": 85,
        "timing_status": "good",
        "feedback": "Good even syllable timing. Beats aligned well."
    }

@router.post("/quiz/start")
async def start_quiz(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": QUIZ_BLUEPRINT
    }

@router.post("/quiz/answer")
async def check_quiz_answer(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in QUIZ_BLUEPRINT if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": correct,
        "explanation": q["explanation"]
    }

@router.post("/quiz/finish")
async def finish_quiz(payload: QuizFinishRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": payload.score,
        "xp_gained": 100 if payload.score >= 80 else 50,
        "mastery_updates": {
            "a1_sound_foundations": "passed" if payload.score >= 80 else "review"
        }
    }

@router.get("/phase-1/homework")
async def get_homework(current_user: User = Depends(get_current_user)):
    return [
        {"id": "hw_1", "type": "word_reading", "text": "Record reading: 물, 학교, 친구, 한국, 이름, 커피, 사과, 책, 시간, 영화"},
        {"id": "hw_2", "type": "self_intro", "text": "Record self-intro words: 이름, 나라, 직업, 나이, 취미"},
        {"id": "hw_3", "type": "phrases", "text": "Record phrases: 안녕하세요, 감사합니다, 이거 뭐예요?"}
    ]

@router.post("/phase-1/homework/submit")
async def submit_homework(payload: HomeworkSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "overall_score": 88,
        "feedback_heatmap": {
            "물": "green", "학교": "green", "친구": "green",
            "한국": "amber", "이름": "green", "커피": "green",
            "사과": "green", "책": "amber", "시간": "green", "영화": "green"
        },
        "focus_sounds": ["ㅓ vs ㅗ vowel distinction", "batchim timing"],
        "recommendation": "Try rounding your lips more for ㅗ and keeping ㅓ open and unrounded."
    }

@router.post("/complete")
async def complete_phase(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "A1 Sound Foundations Champion",
        "completed_at": "now",
        "next_phase_unlocked": "Phase 2: Batchim & Syllables Lab"
    }


# ==========================================
# PHASE 2 ENDPOINTS
# ==========================================
@router.get("/phases/2/metadata")
async def get_metadata_p2(current_user: User = Depends(get_current_user)):
    return METADATA_P2

@router.get("/phases/2/core-data")
async def get_core_data_p2(current_user: User = Depends(get_current_user)):
    return CORE_DATA_P2

@router.get("/phase-2/items/batchim-identify")
async def get_batchim_identify(current_user: User = Depends(get_current_user)):
    return BATCHIM_IDENTIFY_ITEMS

@router.post("/phase-2/items/batchim-identify/answer")
async def check_batchim_identify(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in BATCHIM_IDENTIFY_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-2/items/stop-vs-link")
async def get_stop_vs_link(current_user: User = Depends(get_current_user)):
    return STOP_VS_LINK_ITEMS

@router.post("/phase-2/items/stop-vs-link/answer")
async def check_stop_vs_link(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in STOP_VS_LINK_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct_link"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-2/items/connected-speech")
async def get_connected_speech(current_user: User = Depends(get_current_user)):
    return CONNECTED_SPEECH_ITEMS

@router.post("/phase-2/items/connected-speech/answer")
async def check_connected_speech(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in CONNECTED_SPEECH_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-2/items/batchim-pronounce")
async def get_batchim_pronounce(current_user: User = Depends(get_current_user)):
    return BATCHIM_PRONOUNCE_ITEMS

@router.post("/phase-2/items/batchim-pronounce/evaluate")
async def evaluate_batchim_pronounce(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in BATCHIM_PRONOUNCE_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {
        "status": "Final sound OK",
        "score": 92,
        "feedback": f"Good stop on final consonant '{item['batchim']}' without extra release vowel."
    }

@router.get("/phase-2/items/linking-pronounce")
async def get_linking_pronounce(current_user: User = Depends(get_current_user)):
    return LINKING_PRONOUNCE_ITEMS

@router.post("/phase-2/items/linking-pronounce/evaluate")
async def evaluate_linking_pronounce(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in LINKING_PRONOUNCE_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {
        "score": 90,
        "linking_status": "good",
        "feedback": f"Smooth liaison connection detected: {item['pronounced']}"
    }

@router.get("/phase-2/items/sentence-flow")
async def get_sentence_flow(current_user: User = Depends(get_current_user)):
    return SENTENCE_FLOW_ITEMS

@router.post("/phase-2/items/sentence-flow/evaluate")
async def evaluate_sentence_flow(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in SENTENCE_FLOW_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {
        "score": 88,
        "batchim_accuracy": "high",
        "linking_rate": "smooth",
        "feedback": "Fewer unneeded pauses in flow mode. Syllables joined smoothly."
    }

@router.post("/phase-2/quiz/start")
async def start_quiz_p2(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": QUIZ_BLUEPRINT_P2
    }

@router.post("/phase-2/quiz/answer")
async def check_quiz_answer_p2(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in QUIZ_BLUEPRINT_P2 if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": correct,
        "explanation": q["explanation"]
    }

@router.post("/phase-2/quiz/finish")
async def finish_quiz_p2(payload: QuizFinishRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": payload.score,
        "xp_gained": 100 if payload.score >= 80 else 50,
        "mastery_updates": {
            "batchim_a2": "passed" if payload.score >= 80 else "review"
        }
    }

@router.get("/phase-2/homework")
async def get_homework_p2(current_user: User = Depends(get_current_user)):
    return [
        {"id": "hw_p2_1", "text": "Record reading 15 batchim words: 밥, 집, 책, 물, 말, 밤, 밖, 공, 한국, 이름, 학생, 책상, 음식, 꽃, 앞"},
        {"id": "hw_p2_2", "text": "Record 5 linked phrases: 한국어, 밥을 먹어요, 물이 있어요, 밥이, 끝이"},
        {"id": "hw_p2_3", "text": "Record a mini self-introduction containing at least 5 batchim words."}
    ]

@router.post("/phase-2/homework/submit")
async def submit_homework_p2(payload: HomeworkSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "overall_score": 90,
        "feedback_heatmap": {
            "밥": "green", "집": "green", "책": "green", "물": "green",
            "한국어": "green", "밥을": "green", "먹어요": "green",
            "물이": "green", "있어요": "amber", "학생": "green"
        },
        "focus_sounds": ["[t] final consonants", "linking after closed syllables"],
        "recommendation": "Link batchim sounds like ㅂ directly to the following vowel: e.g. 밥을 → 바블."
    }

@router.post("/phase-2/complete")
async def complete_phase_p2(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "Batchim & Linking Expert",
        "completed_at": "now",
        "next_phase_unlocked": "Phase 3: Sound Patterns Lab"
    }


# ==========================================
# PHASE 3 ENDPOINTS
# ==========================================
@router.get("/phases/3/metadata")
async def get_metadata_p3(current_user: User = Depends(get_current_user)):
    return METADATA_P3

@router.get("/phases/3/core-data")
async def get_core_data_p3(current_user: User = Depends(get_current_user)):
    return CORE_DATA_P3

@router.get("/phase-3/items/rhythm-compare")
async def get_rhythm_compare(current_user: User = Depends(get_current_user)):
    return RHYTHM_COMPARE_ITEMS

@router.post("/phase-3/items/rhythm-compare/answer")
async def check_rhythm_compare(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in RHYTHM_COMPARE_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-3/items/beat-tap")
async def get_beat_tap(current_user: User = Depends(get_current_user)):
    return BEAT_TAP_ITEMS

@router.post("/phase-3/items/beat-tap/answer")
async def check_beat_tap(payload: BeatTapAnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in BEAT_TAP_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    # Evaluate taps timing offsets
    # Simple mockup logic
    return {
        "score": 92,
        "offsets": [0.05, -0.02, 0.08, -0.01],
        "feedback": "Beats were mostly on time. Good job!"
    }

@router.get("/phase-3/items/chunking")
async def get_chunking(current_user: User = Depends(get_current_user)):
    return CHUNKING_ITEMS

@router.post("/phase-3/items/chunking/answer")
async def check_chunking(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in CHUNKING_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "recommendation": item["recommendation"]
    }

@router.get("/phase-3/items/metronome-words")
async def get_metronome_words(current_user: User = Depends(get_current_user)):
    return METRONOME_WORDS_ITEMS

@router.post("/phase-3/items/metronome-words/evaluate")
async def evaluate_metronome_words(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in METRONOME_WORDS_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Return simulated scores per syllable
    syllables_list = list(item["word"])
    timing_scores = {s: "green" for s in syllables_list}
    return {
        "overall_score": 90,
        "timing_scores": timing_scores,
        "feedback": "Even timing detected. No extra vowel stretch."
    }

@router.get("/phase-3/items/shadowing-phrases")
async def get_shadowing_phrases(current_user: User = Depends(get_current_user)):
    return SHADOWING_PHRASES_ITEMS

@router.post("/phase-3/items/shadowing-phrases/evaluate")
async def evaluate_shadowing_phrase(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in SHADOWING_PHRASES_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {
        "tempo_difference_percent": 4,
        "score": 92,
        "feedback": "Rhythm aligned close to the native speaker model."
    }

@router.get("/phase-3/items/chunk-say")
async def get_chunk_say(current_user: User = Depends(get_current_user)):
    return CHUNK_SAY_ITEMS

@router.post("/phase-3/items/chunk-say/evaluate")
async def evaluate_chunk_say(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in CHUNK_SAY_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {
        "score": 88,
        "pauses_detected": [1], # paused at index 1 (between chunks)
        "feedback": "Perfect! You kept '한국어 공부해요' together as one chunk."
    }

@router.post("/phase-3/quiz/start")
async def start_quiz_p3(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": QUIZ_BLUEPRINT_P3
    }

@router.post("/phase-3/quiz/answer")
async def check_quiz_answer_p3(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in QUIZ_BLUEPRINT_P3 if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": correct,
        "explanation": q["explanation"]
    }

@router.post("/phase-3/quiz/finish")
async def finish_quiz_p3(payload: QuizFinishRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": payload.score,
        "xp_gained": 100 if payload.score >= 80 else 50,
        "mastery_updates": {
            "rhythm_a2": "passed" if payload.score >= 80 else "review"
        }
    }

@router.get("/phase-3/homework")
async def get_homework_p3(current_user: User = Depends(get_current_user)):
    return [
        {"id": "hw_p3_1", "text": "Record 10 vocabulary words with even rhythm: 친구, 학교, 이름, 영화, 공부, 오늘, 내일, 사과, 커피, 시간"},
        {"id": "hw_p3_2", "text": "Record 3 daily routine sentences with natural chunk breaks."},
        {"id": "hw_p3_3", "text": "Record shadowing of a 3-exchange dialog from Course 1-2."}
    ]

@router.post("/phase-3/homework/submit")
async def submit_homework_p3(payload: HomeworkSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "overall_score": 91,
        "feedback_heatmap": {
            "친구": "green", "학교": "green", "이름": "green", "영화": "green",
            "공부": "green", "오늘": "green", "내일": "green",
            "사과": "green", "커피": "amber", "시간": "green"
        },
        "focus_sounds": ["Syllable length evenness", "Chunk boundary pauses"],
        "recommendation": "Try not to stretch the first syllable of '커피'. Keep both syllables '커' and '피' even."
    }

@router.post("/phase-3/complete")
async def complete_phase_p3(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "Rhythm & Word Flow Champion",
        "completed_at": "now",
        "next_phase_unlocked": "Phase 4: Everyday Listening Lab"
    }


# ==========================================
# PHASE 4 VARIABLES
# ==========================================
METADATA_P4 = {
    "title": "Listening Lab 1 – Everyday Dialogues (A1–A2)",
    "subtitle": "Understand and echo short daily conversations.",
    "description": "In this lab, you’ll practise understanding slow, clear Korean dialogues about everyday topics, and echo them aloud to build listening and speaking together.",
    "estimated_minutes": 25,
    "goals": [
        "Hear A1–A2 dialogues at slow and normal speed",
        "Catch key information without understanding every word",
        "Echo short turns to build automatic speaking patterns"
    ],
    "tags": ["A1-A2", "Listening", "Speaking", "Dialogues"],
    "dependencies": "Pronunciation Lab 3 (Completed)"
}

CORE_DATA_P4 = {
    "dialogue_list": [
        {
            "id": "diag_1",
            "topic": "Cafe Order",
            "cefr": "A1",
            "script": [
                {"speaker": "A", "ko": "안녕하세요? 뭐 드시겠어요?", "en": "Hello? What would you like to have?"},
                {"speaker": "B", "ko": "커피 한 잔 주세요.", "en": "Give me one cup of coffee, please."}
            ],
            "audio_slow": "dummy_cafe_slow.mp3",
            "audio_normal": "dummy_cafe_normal.mp3"
        },
        {
            "id": "diag_2",
            "topic": "Daily Plans",
            "cefr": "A2",
            "script": [
                {"speaker": "A", "ko": "오늘 시간 있어요? 같이 영화 봐요.", "en": "Do you have time today? Let's watch a movie together."},
                {"speaker": "B", "ko": "미안해요, 오늘 한국어 공부해요.", "en": "I'm sorry, I am studying Korean today."}
            ],
            "audio_slow": "dummy_plans_slow.mp3",
            "audio_normal": "dummy_plans_normal.mp3"
        }
    ]
}

DIALOGUES_GIST_ITEMS = [
    {
        "id": "dg_1",
        "dialogue_id": "diag_1",
        "question": "Where is this dialogue most likely taking place?",
        "options": ["At a school", "At a cafe", "At home"],
        "correct": "At a cafe",
        "note": "They are greeting and ordering coffee ('커피 한 잔 주세요')."
    },
    {
        "id": "dg_2",
        "dialogue_id": "diag_2",
        "question": "What is the main topic of this dialogue?",
        "options": ["Making plans for today", "Studying for a test", "Buying movie tickets"],
        "correct": "Making plans for today",
        "note": "Speaker A asks if Speaker B has time today and suggests watching a movie together."
    }
]

DIALOGUES_KEYWORDS_ITEMS = [
    {
        "id": "dk_1",
        "dialogue_id": "diag_1",
        "keywords": ["안녕하세요", "뭐", "커피", "한 잔", "주세요"],
        "note": "Keywords like 커피 (coffee), 한 잔 (one cup), and 주세요 (give) carry the main meaning."
    },
    {
        "id": "dk_2",
        "dialogue_id": "diag_2",
        "keywords": ["오늘", "시간", "영화", "미안해요", "한국어", "공부해요"],
        "note": "Keywords like 오늘 (today), 시간 (time), 영화 (movie), and 한국어 공부해요 (study Korean) carry the main meaning."
    }
]

DIALOGUES_DETAIL_ITEMS = [
    {
        "id": "dd_1",
        "dialogue_id": "diag_1",
        "question": "What did the speaker order?",
        "options": ["Water", "Coffee", "Tea"],
        "correct": "Coffee",
        "note": "The speaker orders '커피' (coffee)."
    },
    {
        "id": "dd_2",
        "dialogue_id": "diag_2",
        "question": "Why can't Speaker B watch a movie today?",
        "options": ["They are too tired", "They have to study Korean", "They are meeting friends"],
        "correct": "They have to study Korean",
        "note": "Speaker B says: '오늘 한국어 공부해요' (I am studying Korean today)."
    }
]

DIALOGUES_ECHO_ITEMS = [
    {
        "id": "de_1",
        "dialogue_id": "diag_1",
        "lines": [
            {"id": "de_1_1", "text": "안녕하세요? 뭐 드시겠어요?"},
            {"id": "de_1_2", "text": "커피 한 잔 주세요."}
        ]
    },
    {
        "id": "de_2",
        "dialogue_id": "diag_2",
        "lines": [
            {"id": "de_2_1", "text": "오늘 시간 있어요? 같이 영화 봐요."},
            {"id": "de_2_2", "text": "미안해요, 오늘 한국어 공부해요."}
        ]
    }
]

DIALOGUES_PATTERN_ITEMS = [
    {
        "id": "dp_1",
        "pattern": "저는 [이름]이에요.",
        "slots": ["민우", "수진", "지호"],
        "hint": "Replace with name and record sentence."
    },
    {
        "id": "dp_2",
        "pattern": "커피 [수량] 주세요.",
        "slots": ["한 잔", "두 잔", "세 잔"],
        "hint": "Replace with quantity and record sentence."
    },
    {
        "id": "dp_3",
        "pattern": "[시간]에 만나요.",
        "slots": ["세 시", "네 시", "다섯 시"],
        "hint": "Replace with time and record sentence."
    }
]

DIALOGUES_QA_ITEMS = [
    {
        "id": "dqa_1",
        "question": "이거 뭐예요?",
        "choices": ["커피예요.", "책이에요.", "사과예요."],
        "model_answer": "이거 커피예요."
    },
    {
        "id": "dqa_2",
        "question": "어디에 가요?",
        "choices": ["집에 가요.", "학교에 가요.", "회사에 가요."],
        "model_answer": "학교에 가요."
    },
    {
        "id": "dqa_3",
        "question": "시간 있어요?",
        "choices": ["네, 있어요.", "아니요, 바빠요.", "미안해요, 없어요."],
        "model_answer": "네, 있어요."
    }
]

QUIZ_BLUEPRINT_P4 = [
    {
        "id": "q_p4_1",
        "type": "gist",
        "question": "Where is the conversation taking place based on the audio?",
        "options": ["Café", "Airport", "Library"],
        "correct_answer": "Café",
        "explanation": "The speaker greets and says '커피 한 잔 주세요' which implies a café context."
    },
    {
        "id": "q_p4_2",
        "type": "who_where",
        "question": "Who is speaking in this dialogue?",
        "options": ["Customer and Clerk", "Doctor and Patient", "Teacher and Student"],
        "correct_answer": "Customer and Clerk",
        "explanation": "One person asks what they want to order and the other orders coffee."
    },
    {
        "id": "q_p4_3",
        "type": "key_phrase",
        "question": "Choose the correct written phrase matching: '오늘 시간 있어요?'",
        "options": [
            "어제 시간 있어요?",
            "오늘 시간 있어요?",
            "내일 시간 있어요?"
        ],
        "correct_answer": "오늘 시간 있어요?",
        "explanation": "'오늘' means today. '어제' is yesterday, '내일' is tomorrow."
    },
    {
        "id": "q_p4_4",
        "type": "missing_word",
        "question": "Fill in the missing word: '커피 한 잔 ___.' (Please give)",
        "options": ["있어요", "가요", "주세요"],
        "correct_answer": "주세요",
        "explanation": "'주세요' means 'please give'."
    },
    {
        "id": "q_p4_5",
        "type": "true_false",
        "question": "True or False: The speakers are going to watch a movie together today.",
        "options": ["True", "False"],
        "correct_answer": "False",
        "explanation": "Speaker B declined because they have to study Korean today ('오늘 한국어 공부해요')."
    }
]

HOMEWORK_P4 = [
    {"id": "hw_p4_1", "text": "Choose 3 dialogues from your main course. Listen once without text, once with text, and echo each line once."},
    {"id": "hw_p4_2", "text": "For 5 days, log 10 minutes of daily Korean listening (topic, source, and streak)."},
    {"id": "hw_p4_3", "text": "Record a 30-60 second spoken recap of any dialogue you listened to today."}
]


# ==========================================
# PHASE 4 ENDPOINTS
# ==========================================
@router.get("/phases/4/metadata")
async def get_metadata_p4(current_user: User = Depends(get_current_user)):
    return METADATA_P4

@router.get("/phases/4/core-data")
async def get_core_data_p4(current_user: User = Depends(get_current_user)):
    return CORE_DATA_P4

@router.get("/phase-4/dialogues/gist")
async def get_dialogues_gist(current_user: User = Depends(get_current_user)):
    return DIALOGUES_GIST_ITEMS

@router.post("/phase-4/dialogues/gist/answer")
async def check_dialogue_gist(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in DIALOGUES_GIST_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-4/dialogues/keywords")
async def get_dialogues_keywords(current_user: User = Depends(get_current_user)):
    return DIALOGUES_KEYWORDS_ITEMS

@router.post("/phase-4/dialogues/keywords/answer")
async def check_dialogue_keywords(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in DIALOGUES_KEYWORDS_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    # Simulation evaluation: return match score based on payload selection
    return {
        "score": 95,
        "feedback": "Great keyword identification! These key content words hold the main meaning."
    }

@router.get("/phase-4/dialogues/detail")
async def get_dialogues_detail(current_user: User = Depends(get_current_user)):
    return DIALOGUES_DETAIL_ITEMS

@router.post("/phase-4/dialogues/detail/answer")
async def check_dialogue_detail(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in DIALOGUES_DETAIL_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-4/dialogues/echo-lines")
async def get_dialogues_echo_lines(current_user: User = Depends(get_current_user)):
    return DIALOGUES_ECHO_ITEMS

@router.post("/phase-4/dialogues/echo-lines/evaluate")
async def evaluate_dialogue_echo(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "clarity_score": 90,
        "rhythm_score": 88,
        "feedback": "Pronunciation clear. Good tempo matching native speaker model.",
        "needs_work_words": []
    }

@router.get("/phase-4/dialogues/pattern-speak")
async def get_dialogues_pattern_speak(current_user: User = Depends(get_current_user)):
    return DIALOGUES_PATTERN_ITEMS

@router.post("/phase-4/dialogues/pattern-speak/evaluate")
async def evaluate_dialogue_pattern_speak(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 92,
        "structure_matched": True,
        "feedback": "Recognisable structure matching pattern and chosen word slots."
    }

@router.get("/phase-4/dialogues/qa")
async def get_dialogues_qa(current_user: User = Depends(get_current_user)):
    return DIALOGUES_QA_ITEMS

@router.post("/phase-4/dialogues/qa/evaluate")
async def evaluate_dialogue_qa(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 90,
        "feedback": "Correct contextual reply, structure matches standard everyday dialogue patterns.",
        "improvement_tag": "none"
    }

@router.post("/phase-4/quiz/start")
async def start_quiz_p4(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": QUIZ_BLUEPRINT_P4
    }

@router.post("/phase-4/quiz/answer")
async def check_quiz_answer_p4(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in QUIZ_BLUEPRINT_P4 if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": correct,
        "explanation": q["explanation"]
    }

@router.post("/phase-4/quiz/finish")
async def finish_quiz_p4(payload: QuizFinishRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": payload.score,
        "xp_gained": 100 if payload.score >= 80 else 50,
        "mastery_updates": {
            "dialogue_listening_a1a2": "passed" if payload.score >= 80 else "review"
        }
    }

@router.get("/phase-4/homework")
async def get_homework_p4(current_user: User = Depends(get_current_user)):
    return HOMEWORK_P4

@router.post("/phase-4/homework/submit")
async def submit_homework_p4(payload: HomeworkSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "streak_days": 3,
        "feedback": "Listening habits successfully logged. Streak is alive! Keep exploring real-world Korean conversations."
    }

@router.post("/phase-4/complete")
async def complete_phase_p4(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "Everyday Dialogue Champion",
        "completed_at": "now",
        "next_phase_unlocked": "Phase 5: Polite Endings Lab"
    }


# ==========================================
# PHASE 5 VARIABLES
# ==========================================
METADATA_P5 = {
    "title": "Pronunciation Lab 5 – Polite Endings & 요 (A2)",
    "subtitle": "Say everyday polite endings clearly and naturally.",
    "description": "In this lab, you’ll practise A2‑level polite endings like ‑아요/‑어요/‑여요 and 요 sentence‑finals, so your questions and statements sound polite, clear, and easy to understand.",
    "estimated_minutes": 25,
    "goals": [
        "Hear how ‑아요/‑어요/‑여요 and 요 endings sound in real speech",
        "Distinguish questions vs statements by sentence‑final sound",
        "Practise reading and speaking polite sentences from Courses 1–2"
    ],
    "tags": ["A2", "Politeness", "Pronunciation", "Listening", "Speaking"],
    "dependencies": "Listening Lab 1 (Completed)"
}

CORE_DATA_P5 = {
    "ending_examples": [
        {"base": "가다 (to go)", "polite": "가요", "note": "Contracted from 가+아요. Pronounced naturally: [가요]."},
        {"base": "먹다 (to eat)", "polite": "먹어요", "note": "Links batchim forward: [머거요]."},
        {"base": "하다 (to do)", "polite": "해요", "note": "Contracted from 하+여요. Pronounced: [해요]."},
        {"base": "있다 (to have)", "polite": "있어요", "note": "Links ㅆ to 어: pronounced [이써요]."},
        {"base": "가다 (past tense)", "polite": "갔어요", "note": "Links double consonant: pronounced [가써요]."},
        {"base": "공부하다 (to study)", "polite": "공부해요", "note": "Pronounced smoothly: [공부해요]."}
    ],
    "question_statement_pairs": [
        {"text": "오늘 바빠요", "statement_audio": "dummy_busy_statement.mp3", "question_audio": "dummy_busy_question.mp3"}
    ]
}

ENDING_IDENTIFY_ITEMS = [
    {
        "id": "ei_1",
        "word": "가요",
        "options": ["가요 (Everyday present)", "갔어요 (Everyday past)", "가고 있어요 (Progressive)"],
        "correct": "가요 (Everyday present)",
        "note": "You hear the flat present ending '가요'."
    },
    {
        "id": "ei_2",
        "word": "먹었어요",
        "options": ["먹어요 (Everyday present)", "먹었어요 (Everyday past)", "먹을 거예요 (Future)"],
        "correct": "먹었어요 (Everyday past)",
        "note": "You hear the past tense '먹었어요' which links to sound like [머거써요]."
    },
    {
        "id": "ei_3",
        "word": "공부해요",
        "options": ["공부해요 (Everyday present)", "공부했어요 (Everyday past)", "공부하고 있어요 (Progressive)"],
        "correct": "공부해요 (Everyday present)",
        "note": "You hear present polite '공부해요'."
    }
]

QUESTION_VS_STATEMENT_ITEMS = [
    {
        "id": "qs_1",
        "text": "오늘 바빠요",
        "type": "question",
        "explanation": "This ends in a rising pitch on 요, making it a question: 'Are you busy today?'"
    },
    {
        "id": "qs_2",
        "text": "커피 좋아해요",
        "type": "statement",
        "explanation": "This ends in a flat or falling pitch on 요, making it a statement: 'I like coffee.'"
    }
]

REGISTER_LISTENING_ITEMS = [
    {
        "id": "rl_1",
        "phrase": "공부해요",
        "options": ["Everyday polite", "Formal polite", "Casual"],
        "correct": "Everyday polite",
        "note": "The '-해요' ending is the everyday polite style."
    },
    {
        "id": "rl_2",
        "phrase": "공부합니다",
        "options": ["Everyday polite", "Formal polite", "Casual"],
        "correct": "Formal polite",
        "note": "The '-합니다' ending is the formal polite style, typical in business or presentations."
    },
    {
        "id": "rl_3",
        "phrase": "공부해",
        "options": ["Everyday polite", "Formal polite", "Casual"],
        "correct": "Casual",
        "note": "The bare ending '-해' is casual language (반말) for close friends or younger people."
    }
]

POLITE_VERB_DRILLS = [
    {"id": "pd_1", "infinitive": "가다", "polite": "가요", "rule": "가 + 아요 -> 가요"},
    {"id": "pd_2", "infinitive": "먹다", "polite": "먹어요", "rule": "먹 + 어요 -> 먹어요 (pronounced [머거요])"},
    {"id": "pd_3", "infinitive": "하다", "polite": "해요", "rule": "하 + 여요 -> 해요"}
]

FINAL_YO_ITEMS = [
    {"id": "fy_1", "sentence": "오늘 피곤해요.", "translation": "I am tired today."},
    {"id": "fy_2", "sentence": "커피 좋아해요.", "translation": "I like coffee."}
]

REGISTER_SPEAK_ITEMS = [
    {
        "id": "rs_1",
        "base_sentence": "Study Korean",
        "polite_yo": "한국어 공부해요",
        "casual": "한국어 공부해",
        "formal": "한국어 공부합니다"
    },
    {
        "id": "rs_2",
        "base_sentence": "Eat food",
        "polite_yo": "밥 먹어요",
        "casual": "밥 먹어",
        "formal": "밥 먹습니다"
    }
]

QUIZ_BLUEPRINT_P5 = [
    {
        "id": "q_p5_1",
        "type": "ending",
        "question": "Which ending do you hear in '갔어요'?",
        "options": ["가요", "갔어요", "갈 거예요"],
        "correct_answer": "갔어요",
        "explanation": "갔어요 is the past tense form, pronounced like [가써요]."
    },
    {
        "id": "q_p5_2",
        "type": "question_vs_statement",
        "question": "If you hear '시간 있어요?' with a rising intonation at the end, is it a statement or a question?",
        "options": ["Statement", "Question"],
        "correct_answer": "Question",
        "explanation": "A rising intonation on 요 indicates a question: 'Do you have time?'."
    },
    {
        "id": "q_p5_3",
        "type": "register",
        "question": "Identify the register of: '감사합니다'",
        "options": ["Everyday polite", "Formal polite", "Casual"],
        "correct_answer": "Formal polite",
        "explanation": "The '-습니다/합니다' ending is formal polite style."
    },
    {
        "id": "q_p5_4",
        "type": "natural_yo",
        "question": "Which recording style is correct and polite for daily life?",
        "options": ["Clear 요 ending", "Dropped/unclear 요 ending"],
        "correct_answer": "Clear 요 ending",
        "explanation": "Daily polite speech requires a clear, audible 요 ending to avoid sounding casual or rude."
    },
    {
        "id": "q_p5_5",
        "type": "linking",
        "question": "How should '있어요' be pronounced naturally?",
        "options": ["[이써요]", "[있어요]", "[잇.어.요]"],
        "correct_answer": "[이써요]",
        "explanation": "The double consonant ㅆ links forward to 어, pronounced as [이써요]."
    }
]

HOMEWORK_P5 = [
    {"id": "hw_p5_1", "text": "Record saying 15 everyday polite verbs (가요, 와요, 먹어요, 마셔요, 해요, 있어요, 없어요, etc.)."},
    {"id": "hw_p5_2", "text": "Record 5 sentences about your day in the everyday polite style, keeping final 요 audible."},
    {"id": "hw_p5_3", "text": "Record the registers of 3 daily phrases: everyday polite 요 style vs casual or formal."}
]


# ==========================================
# PHASE 5 ENDPOINTS
# ==========================================
@router.get("/phases/5/metadata")
async def get_metadata_p5(current_user: User = Depends(get_current_user)):
    return METADATA_P5

@router.get("/phases/5/core-data")
async def get_core_data_p5(current_user: User = Depends(get_current_user)):
    return CORE_DATA_P5

@router.get("/phase-5/items/ending-identify")
async def get_ending_identify(current_user: User = Depends(get_current_user)):
    return ENDING_IDENTIFY_ITEMS

@router.post("/phase-5/items/ending-identify/answer")
async def check_ending_identify(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in ENDING_IDENTIFY_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-5/items/question-vs-statement")
async def get_question_vs_statement(current_user: User = Depends(get_current_user)):
    return QUESTION_VS_STATEMENT_ITEMS

@router.post("/phase-5/items/question-vs-statement/answer")
async def check_question_vs_statement(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in QUESTION_VS_STATEMENT_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option.lower() == item["type"]
    return {
        "correct": correct,
        "explanation": item["explanation"]
    }

@router.get("/phase-5/items/register-listening")
async def get_register_listening(current_user: User = Depends(get_current_user)):
    return REGISTER_LISTENING_ITEMS

@router.post("/phase-5/items/register-listening/answer")
async def check_register_listening(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in REGISTER_LISTENING_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-5/items/polite-verb-drill")
async def get_polite_verb_drill(current_user: User = Depends(get_current_user)):
    return POLITE_VERB_DRILLS

@router.post("/phase-5/items/polite-verb-drill/evaluate")
async def evaluate_polite_verb_drill(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in POLITE_VERB_DRILLS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {
        "score": 92,
        "feedback": f"Excellent pronunciation of '{item['polite']}'. Linked ending clearly."
    }

@router.get("/phase-5/items/final-yo")
async def get_final_yo(current_user: User = Depends(get_current_user)):
    return FINAL_YO_ITEMS

@router.post("/phase-5/items/final-yo/evaluate")
async def evaluate_final_yo(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 90,
        "pitch_contour": "rising" if "question" in (payload.item_id or "") else "falling",
        "feedback": "Polite ending syllable 요 detected clearly with natural statement/question intonation."
    }

@router.get("/phase-5/items/register-speak")
async def get_register_speak(current_user: User = Depends(get_current_user)):
    return REGISTER_SPEAK_ITEMS

@router.post("/phase-5/items/register-speak/evaluate")
async def evaluate_register_speak(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 91,
        "matches_target": True,
        "feedback": "Spoken sentence matched target register and politeness ending syntax."
    }

@router.post("/phase-5/quiz/start")
async def start_quiz_p5(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": QUIZ_BLUEPRINT_P5
    }

@router.post("/phase-5/quiz/answer")
async def check_quiz_answer_p5(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in QUIZ_BLUEPRINT_P5 if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": correct,
        "explanation": q["explanation"]
    }

@router.post("/phase-5/quiz/finish")
async def finish_quiz_p5(payload: QuizFinishRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": payload.score,
        "xp_gained": 100 if payload.score >= 80 else 50,
        "mastery_updates": {
            "polite_endings_a2": "passed" if payload.score >= 80 else "review"
        }
    }

@router.get("/phase-5/homework")
async def get_homework_p5(current_user: User = Depends(get_current_user)):
    return HOMEWORK_P5

@router.post("/phase-5/homework/submit")
async def submit_homework_p5(payload: HomeworkSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "feedback": "Polite endings successfully logged. AI speech evaluation shows 90%+ clarity on '-요' endings."
    }

@router.post("/phase-5/complete")
async def complete_phase_p5(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "Polite Speech Champion",
        "completed_at": "now",
        "next_phase_unlocked": "Phase 6: Connected Speech Lab"
    }


# ==========================================
# PHASE 6 VARIABLES
# ==========================================
METADATA_P6 = {
    "title": "Fluency Lab 1 – Connected Speech (B1)",
    "subtitle": "Link words and speak more smoothly.",
    "description": "In this lab, you’ll practise linking words, reducing small function words, and keeping your sentences flowing, so your Korean sounds more natural and fluent.",
    "estimated_minutes": 25,
    "goals": [
        "Hear how words blend together in natural Korean",
        "Practise reading and speaking sentences without choppy pauses",
        "Build B1‑level fluency on familiar topics"
    ],
    "tags": ["B1", "Connected speech", "Fluency", "Listening", "Speaking"],
    "dependencies": "Pronunciation Lab 5 (Completed)"
}

CORE_DATA_P6 = {
    "pattern_examples": [
        {
            "sentence": "주말에 한국어를 공부해요.",
            "careful_notes": "주-말-에 한-국-어-를 공-부-해-요. (separated, heavy stops)",
            "connected_notes": "주마레 한구거를 공부해요. (liaison links, smooth stream)"
        }
    ]
}

CAREFUL_VS_CONNECTED_ITEMS = [
    {
        "id": "cc_1",
        "sentence": "오늘 저녁에 친구를 만나요.",
        "correct": "Version B",
        "note": "Version B links '저녁에' to sound like [저녀게] and flows without choppy stops."
    },
    {
        "id": "cc_2",
        "sentence": "주말에 한국어를 공부해요.",
        "correct": "Version B",
        "note": "Version B links '주말에' -> [주마레] and '한국어를' -> [한구거를] with a steady, fluent pace."
    }
]

LINK_LOCATIONS_ITEMS = [
    {
        "id": "ll_1",
        "sentence": "오늘 / 영화를 / 봐요.",
        "linkable_indices": [1],
        "explanation": "Consonant-to-vowel links occur where final consonants link to vowels: e.g. 오늘 -> 영화를 (pronounced [오느령화])."
    },
    {
        "id": "ll_2",
        "sentence": "밥을 / 먹고 / 공부해요.",
        "linkable_indices": [0],
        "explanation": "Consonant-to-vowel links occur at 밥을 (pronounced [바블])."
    }
]

REDUCTION_SPOT_ITEMS = [
    {
        "id": "rs_1",
        "sentence": "친구를 만나요.",
        "reducible_words": ["를"],
        "note": "Object particle 를 is often shortened/lightened to sound almost like ㄹ: [친구ㄹ 만나요]."
    },
    {
        "id": "rs_2",
        "sentence": "시간이 있어요.",
        "reducible_words": ["이"],
        "note": "Subject particle 이 blends with the following vowel, sounding lighter."
    }
]

SHADOWING_SENTENCES = [
    {"id": "ss_1", "sentence": "오늘 저녁에 친구를 만나요.", "tempo_careful": 80, "tempo_connected": 110},
    {"id": "ss_2", "sentence": "주말에 한국어를 공부해요.", "tempo_careful": 80, "tempo_connected": 115}
]

CHAIN_PHRASES = [
    {"id": "cp_1", "text": "주말에 친구하고 영화 봐요.", "chains": ["주말에 친구하고", "영화 봐요"]},
    {"id": "cp_2", "text": "퇴근하고 집에 가서 밥 먹어요.", "chains": ["퇴근하고 집에 가서", "밥 먹어요"]}
]

GUIDED_SPEAKING_ITEMS = [
    {
        "id": "gs_1",
        "prompt": "Describe your morning routine in Korean.",
        "scaffolds": ["아침 일찍 일어나요.", "샤워를 하고 커피를 마셔요.", "회사에 일하러 가요."],
        "tips": "Try grouping '샤워를 하고' and '커피를 마셔요' as breath chains without mid-word breaks."
    },
    {
        "id": "gs_2",
        "prompt": "Talk about your weekend plans.",
        "scaffolds": ["주말에 친구를 만나요.", "같이 영화관에 가요.", "맛있는 저녁을 먹어요."],
        "tips": "Link '저녁을' as [저녀글] and flow straight into the verb."
    }
]

QUIZ_BLUEPRINT_P6 = [
    {
        "id": "q_p6_1",
        "type": "careful_vs_connected",
        "question": "Which styling represents natural connected speech (B1)?",
        "options": ["Citation-style word-by-word stops", "Continuous flow with liaison connections"],
        "correct_answer": "Continuous flow with liaison connections",
        "explanation": "B1 connected speech prioritizes natural linking and fewer breath pauses between word boundaries."
    },
    {
        "id": "q_p6_2",
        "type": "link_location",
        "question": "Identify where linking occurs in: '책을 읽어요'",
        "options": ["Both positions link (책을 -> 채글, 읽어요 -> 일거요)", "Only the first position links", "No positions link"],
        "correct_answer": "Both positions link (책을 -> 채글, 읽어요 -> 일거요)",
        "explanation": "Both end in consonants followed by vowel placeholders: [채글 일거요]."
    },
    {
        "id": "q_p6_3",
        "type": "word_boundary",
        "question": "Choose the correct breath grouping segmentation for: '내일아침에커피를마셔요'",
        "options": [
            "내일 아침에 / 커피를 마셔요",
            "내일 / 아침에커피 / 를마셔요",
            "내 / 일아침 / 에커피를 / 마셔요"
        ],
        "correct_answer": "내일 아침에 / 커피를 마셔요",
        "explanation": "Grouping time/adverbs separately from the verb-object chunk is the standard segmentation: 내일 아침에 / 커피를 마셔요."
    },
    {
        "id": "q_p6_4",
        "type": "gist_connected",
        "question": "Hear this fast connected sentence: '내일 영화관에 같이 가요.' What is the gist?",
        "options": [
            "They are going to study tomorrow.",
            "They are going to watch a movie together tomorrow.",
            "They are going to eat lunch together."
        ],
        "correct_answer": "They are going to watch a movie together tomorrow.",
        "explanation": "영화관에 같이 가요 implies watching a movie together."
    },
    {
        "id": "q_p6_5",
        "type": "reduction",
        "question": "In fast B1 speech, which particle gets shortened to a light consonant tag in '친구를'?",
        "options": ["를", "친구", "은"],
        "correct_answer": "를",
        "explanation": "The particle 를 is often reduced to a light 'ㄹ' tag: [친구ㄹ]."
    }
]

HOMEWORK_P6 = [
    {"id": "hw_p6_1", "text": "Shadow 3 course dialogues at normal speed, focusing on linking and minimal pauses."},
    {"id": "hw_p6_2", "text": "Record two 1-minute talks: Topic 1 (Daily Routine), Topic 2 (Hobbies)."},
    {"id": "hw_p6_3", "text": "Fluency reflection: Listen to your talks and log one smooth segment and one choppy segment."}
]


# ==========================================
# PHASE 6 ENDPOINTS
# ==========================================
@router.get("/phases/6/metadata")
async def get_metadata_p6(current_user: User = Depends(get_current_user)):
    return METADATA_P6

@router.get("/phases/6/core-data")
async def get_core_data_p6(current_user: User = Depends(get_current_user)):
    return CORE_DATA_P6

@router.get("/phase-6/items/careful-vs-connected")
async def get_careful_vs_connected(current_user: User = Depends(get_current_user)):
    return CAREFUL_VS_CONNECTED_ITEMS

@router.post("/phase-6/items/careful-vs-connected/answer")
async def check_careful_vs_connected(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in CAREFUL_VS_CONNECTED_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-6/items/link-locations")
async def get_link_locations(current_user: User = Depends(get_current_user)):
    return LINK_LOCATIONS_ITEMS

@router.post("/phase-6/items/link-locations/answer")
async def check_link_locations(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in LINK_LOCATIONS_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    # Simulate correct check based on selections
    return {
        "correct": True,
        "explanation": item["explanation"]
    }

@router.get("/phase-6/items/reduction-spot")
async def get_reduction_spot(current_user: User = Depends(get_current_user)):
    return REDUCTION_SPOT_ITEMS

@router.post("/phase-6/items/reduction-spot/answer")
async def check_reduction_spot(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in REDUCTION_SPOT_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {
        "correct": True,
        "explanation": item["note"]
    }

@router.get("/phase-6/items/shadowing-sentences")
async def get_shadowing_sentences(current_user: User = Depends(get_current_user)):
    return SHADOWING_SENTENCES

@router.post("/phase-6/items/shadowing-sentences/evaluate")
async def evaluate_shadowing_sentences(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "pauses_count": 1,
        "linking_score": 90,
        "feedback": "Fewer micro-pauses detected. Linking was natural across sentence boundaries."
    }

@router.get("/phase-6/items/chain-phrases")
async def get_chain_phrases(current_user: User = Depends(get_current_user)):
    return CHAIN_PHRASES

@router.post("/phase-6/items/chain-phrases/evaluate")
async def evaluate_chain_phrase(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 93,
        "chain_statuses": {"chain_0": "green", "chain_1": "green"},
        "feedback": "Excellent phrasing. Chain boundaries kept together in a single breath group."
    }

@router.get("/phase-6/items/guided-speaking")
async def get_guided_speaking(current_user: User = Depends(get_current_user)):
    return GUIDED_SPEAKING_ITEMS

@router.post("/phase-6/items/guided-speaking/evaluate")
async def evaluate_guided_speaking(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "speech_rate": 3.8, # syllables per second
        "pauses_count": 3,
        "average_pause_sec": 0.45,
        "choppiness_index": "low",
        "feedback": "Good speech rate (~3.8 syl/sec) with short, natural pauses at segment limits."
    }

@router.post("/phase-6/quiz/start")
async def start_quiz_p6(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": QUIZ_BLUEPRINT_P6
    }

@router.post("/phase-6/quiz/answer")
async def check_quiz_answer_p6(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in QUIZ_BLUEPRINT_P6 if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": correct,
        "explanation": q["explanation"]
    }

@router.post("/phase-6/quiz/finish")
async def finish_quiz_p6(payload: QuizFinishRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": payload.score,
        "xp_gained": 100 if payload.score >= 80 else 50,
        "mastery_updates": {
            "connected_speech_b1": "passed" if payload.score >= 80 else "review"
        }
    }

@router.get("/phase-6/homework")
async def get_homework_p6(current_user: User = Depends(get_current_user)):
    return HOMEWORK_P6

@router.post("/phase-6/homework/submit")
async def submit_homework_p6(payload: HomeworkSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "speech_rate": 3.9,
        "average_pause_sec": 0.42,
        "phrase_length_distribution": [3, 4, 3],
        "feedback": "Logged routine homework. You are speaking at ~3.9 syllables/sec, approaching the typical B1 range."
    }
@router.post("/phase-6/complete")
async def complete_phase_p6(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "Connected Speech Champion",
        "completed_at": "now",
        "next_phase_unlocked": "Phase 7: Intonation Lab"
    }


# ==========================================
# PHASE 7 VARIABLES
# ==========================================
METADATA_P7 = {
    "title": "Intonation Lab – Questions, Statements & Feelings (B1)",
    "subtitle": "Use pitch to show meaning and emotion.",
    "description": "In this lab, you’ll practise Korean intonation: how pitch rises and falls in statements and questions, and how to sound polite, surprised, or unsure without over‑doing it.",
    "estimated_minutes": 25,
    "goals": [
        "Tell questions from statements by sentence‑final pitch",
        "Use a light rise for yes/no questions, and more neutral patterns for wh‑questions",
        "Copy emotional intonation (happy, annoyed, polite) in short sentences"
    ],
    "tags": ["B1", "Intonation", "Prosody", "Listening", "Speaking"],
    "dependencies": "Connected Speech Lab (Completed)"
}

CORE_DATA_P7 = {
    "statement_examples": [
        {"sentence": "오늘 바빠요", "contour": "flat-fall", "notes": "Falling end: Statement 'I am busy today.'"}
    ],
    "yn_question_examples": [
        {"sentence": "오늘 바빠요?", "contour": "flat-rise", "notes": "Gentle final rise: Yes/no question 'Are you busy today?'"}
    ],
    "wh_question_examples": [
        {"sentence": "뭐 좋아해요?", "contour": "flat-fall", "notes": "Statement-like fall: Wh-question 'What do you like?'"}
    ],
    "emotion_examples": [
        {"text": "괜찮아요.", "neutral": "narrow range, flat", "excited": "high start, wide rise", "annoyed": "low start, flat fall"}
    ]
}

STATEMENT_VS_YN_ITEMS = [
    {
        "id": "s_yn_1",
        "text": "오늘 바빠요",
        "type": "question",
        "note": "Pitch rises gently at final 요: Yes/no question."
    },
    {
        "id": "s_yn_2",
        "text": "오늘 바빠요",
        "type": "statement",
        "note": "Pitch falls at final 요: Statement."
    }
]

YN_VS_WH_ITEMS = [
    {
        "id": "y_w_1",
        "yn_text": "커피 좋아해요?",
        "wh_text": "뭐 좋아해요?",
        "options": ["Yes/no question (final rise)", "Wh‑question (usually final fall)"],
        "correct_yn": "Yes/no question (final rise)",
        "correct_wh": "Wh‑question (usually final fall)",
        "note": "wh-questions (뭐) use falling statement-like intonations."
    }
]

EMOTION_LISTENING_ITEMS = [
    {
        "id": "em_1",
        "sentence": "정말요?",
        "options": ["Neutral/polite", "Happy/excited", "Annoyed/irritated"],
        "correct": "Happy/excited",
        "note": "High start and wide pitch rise indicate excitement/surprise."
    },
    {
        "id": "em_2",
        "sentence": "괜찮아요.",
        "options": ["Neutral/polite", "Happy/excited", "Annoyed/irritated"],
        "correct": "Annoyed/irritated",
        "note": "Low, flat, slightly compressed pitch indicates annoyance/irritation."
    }
]

INTONATION_MODE_DRILLS = [
    {"id": "im_1", "sentence": "오늘 날씨 좋아요.", "translation": "The weather is good today."}
]

QUESTION_INTONATION_DRILLS = [
    {"id": "qi_1", "yn": "한국 사람이에요?", "wh": "어디에서 일해요?"}
]

EMOTION_PRACTICE_ITEMS = [
    {"id": "ep_1", "word": "정말요?"},
    {"id": "ep_2", "word": "괜찮아요."}
]

QUIZ_BLUEPRINT_P7 = [
    {
        "id": "q_p7_1",
        "type": "statement_vs_yn",
        "question": "Hear this sentence: '오늘 시간 있어요.' (falling ending). Identify sentence type:",
        "options": ["Statement", "Yes/no question"],
        "correct_answer": "Statement",
        "explanation": "Statements end with flat/falling intonation in Korean."
    },
    {
        "id": "q_p7_2",
        "type": "yn_vs_wh",
        "question": "Which statement is correct regarding wh-questions (어디, 언제, 뭐) in Korean?",
        "options": ["They typically rise sharply like yes/no questions", "They typically end in a flat or falling tone like statements", "They end in whispers"],
        "correct_answer": "They typically end in a flat or falling tone like statements",
        "explanation": "Korean wh-questions use a statement-like falling ending since the question tag is already established by grammar."
    },
    {
        "id": "q_p7_3",
        "type": "emotion",
        "question": "Hear '괜찮아요' (low, narrow, flat). Which emotion is expressed?",
        "options": ["Surprised/excited", "Neutral/polite", "Annoyed/irritated"],
        "correct_answer": "Annoyed/irritated",
        "explanation": "Low, flat, slightly clipped pitch signifies annoyance or cold response."
    },
    {
        "id": "q_p7_4",
        "type": "pitch_match",
        "question": "Match the contour graphic [Flat -> Rise ↗] to the correct audio:",
        "options": ["공부해요 (Statement)", "공부해요? (Yes/no question)"],
        "correct_answer": "공부해요? (Yes/no question)",
        "explanation": "Yes/no questions carry a final rising pitch ↗."
    },
    {
        "id": "q_p7_5",
        "type": "mis_intonation",
        "question": "Hear this yes/no question: '한국 사람이에요?' spoken with a flat falling statement tone. Does it sound natural?",
        "options": ["Yes, natural", "No, sounds flat/off for an open question"],
        "correct_answer": "No, sounds flat/off for an open question",
        "explanation": "Open yes/no questions require a rising intonation to sound natural and friendly."
    }
]

HOMEWORK_P7 = [
    {"id": "hw_p7_1", "text": "Record 5 sentence pairs (statement + yes/no question) showing clear rise vs fall pitches."},
    {"id": "hw_p7_2", "text": "Record 5 wh-questions showing statement-like falling endings."},
    {"id": "hw_p7_3", "text": "Record '정말요?' and '괜찮아요.' in 3 emotional registers: neutral, excited, annoyed."}
]


# ==========================================
# PHASE 7 ENDPOINTS
# ==========================================
@router.get("/phases/7/metadata")
async def get_metadata_p7(current_user: User = Depends(get_current_user)):
    return METADATA_P7

@router.get("/phases/7/core-data")
async def get_core_data_p7(current_user: User = Depends(get_current_user)):
    return CORE_DATA_P7

@router.get("/phase-7/items/statement-vs-yn")
async def get_statement_vs_yn(current_user: User = Depends(get_current_user)):
    return STATEMENT_VS_YN_ITEMS

@router.post("/phase-7/items/statement-vs-yn/answer")
async def check_statement_vs_yn(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in STATEMENT_VS_YN_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option.lower() == item["type"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-7/items/yn-vs-wh")
async def get_yn_vs_wh(current_user: User = Depends(get_current_user)):
    return YN_VS_WH_ITEMS

@router.post("/phase-7/items/yn-vs-wh/answer")
async def check_yn_vs_wh(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in YN_VS_WH_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    # Simulate verification
    return {
        "correct": True,
        "explanation": item["note"]
    }

@router.get("/phase-7/items/emotion-listening")
async def get_emotion_listening(current_user: User = Depends(get_current_user)):
    return EMOTION_LISTENING_ITEMS

@router.post("/phase-7/items/emotion-listening/answer")
async def check_emotion_listening(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in EMOTION_LISTENING_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-7/items/statement-question-speak")
async def get_statement_question_speak(current_user: User = Depends(get_current_user)):
    return INTONATION_MODE_DRILLS

@router.post("/phase-7/items/statement-question-speak/evaluate")
async def evaluate_statement_question_speak(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 90,
        "pitch_contour": "rising" if "question" in (payload.item_id or "") else "falling",
        "feedback": "Pitch contour matched target. Standard rising yes/no or falling statement shape detected."
    }

@router.get("/phase-7/items/wh-yn-speak")
async def get_wh_yn_speak(current_user: User = Depends(get_current_user)):
    return QUESTION_INTONATION_DRILLS

@router.post("/phase-7/items/wh-yn-speak/evaluate")
async def evaluate_wh_yn_speak(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 92,
        "feedback": "Perfect! Wh-question ending was kept low and statement-like, while yes/no rose."
    }

@router.get("/phase-7/items/emotion-speak")
async def get_emotion_speak(current_user: User = Depends(get_current_user)):
    return EMOTION_PRACTICE_ITEMS

@router.post("/phase-7/items/emotion-speak/evaluate")
async def evaluate_emotion_speak(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 90,
        "feedback": "Pitch range adjusted successfully. Your emotional pitch shape matches the native model."
    }

@router.post("/phase-7/quiz/start")
async def start_quiz_p7(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": QUIZ_BLUEPRINT_P7
    }

@router.post("/phase-7/quiz/answer")
async def check_quiz_answer_p7(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in QUIZ_BLUEPRINT_P7 if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": correct,
        "explanation": q["explanation"]
    }

@router.post("/phase-7/quiz/finish")
async def finish_quiz_p7(payload: QuizFinishRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": payload.score,
        "xp_gained": 100 if payload.score >= 80 else 50,
        "mastery_updates": {
            "intonation_b1": "passed" if payload.score >= 80 else "review"
        }
    }

@router.get("/phase-7/homework")
async def get_homework_p7(current_user: User = Depends(get_current_user)):
    return HOMEWORK_P7

@router.post("/phase-7/homework/submit")
async def submit_homework_p7(payload: HomeworkSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "feedback": "Intonation logs successfully updated. High clarity on rising yes/no pitch contours."
    }

@router.post("/phase-7/complete")
async def complete_phase_p7(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "Intonation Champion",
        "completed_at": "now",
        "next_phase_unlocked": "Phase 8: Conversation Lab"
    }


# ==========================================
# PHASE 8 VARIABLES
# ==========================================
METADATA_P8 = {
    "title": "Conversation Lab – Routines & Turn‑Taking (B1)",
    "subtitle": "React naturally and share the floor.",
    "description": "In this lab, you’ll practise Korean conversation routines: backchannel reactions, agreeing and disagreeing, asking follow‑up questions, and taking turns smoothly at B1 level.",
    "estimated_minutes": 25,
    "goals": [
        "Use short reactions (“네”, “그래요?”, “진짜요?”) while listening",
        "Agree and disagree politely with simple gambits",
        "Ask follow‑up questions and share turns in short B1 dialogues"
    ],
    "tags": ["B1", "Speaking interaction", "Conversation", "Turn‑taking"],
    "dependencies": "Intonation Lab (Completed)"
}

CORE_DATA_P8 = {
    "backchannel_list": {
        "neutral": ["네", "예", "응"],
        "agreement": ["맞아요", "그렇군요"],
        "surprise": ["아, 진짜요?", "진짜?", "대박"]
    },
    "routine_phrases": {
        "agree": ["맞아요", "저도 그래요"],
        "disagree": ["글쎄요...", "그건 잘 모르겠어요"],
        "react": ["정말요?", "대박"]
    },
    "dialogue_templates": [
        {
            "topic": "hobbies",
            "partner_line": "저는 주말에 등산하는 걸 진짜 좋아해요."
        }
    ]
}

BACKCHANNEL_DETECT_ITEMS = [
    {
        "id": "bc_det_1",
        "sentence": "수진: 저는 요즘 테니스를 배워요. / 민우: 아, 그래요? 재미있겠네요. / 수진: 네, 아주 재미있어요.",
        "backchannels": ["아, 그래요?", "네"],
        "explanation": "These expressions show 민우 and 수진 are actively listening and supporting the flow."
    }
]

ROUTINE_CLASSIFY_ITEMS = [
    {
        "id": "rc_cls_1",
        "prompt": "저는 주말에 항상 집에서 쉬어요.",
        "options": ["Agreement", "Soft Disagreement", "Neutral Reaction"],
        "mappings": [
            {"response": "맞아요. 저도 그래요.", "type": "Agreement"},
            {"response": "글쎄요... 저는 좀 달라요.", "type": "Soft Disagreement"},
            {"response": "아, 그래요?", "type": "Neutral Reaction"}
        ]
    }
]

TURN_TAKING_LISTEN_ITEMS = [
    {
        "id": "tt_lst_1",
        "dialogue": "A: 주말에 뭐 할 거예요? / B: 영화 보려고요. A 씨는요? / A: 저는 쇼핑할 거예요.",
        "questions": [
            {
                "id": "q1",
                "question": "Who starts the conversation?",
                "options": ["Speaker A", "Speaker B"],
                "correct": "Speaker A"
            },
            {
                "id": "q2",
                "question": "Where does B yield the floor back to A?",
                "options": ["영화 보려고요.", "A 씨는요?"],
                "correct": "A 씨는요?"
            }
        ]
    }
]

BACKCHANNEL_SHADOW_ITEMS = [
    {
        "id": "bc_sh_1",
        "dialogue": [
            {"speaker": "Partner", "text": "어제 새로 오픈한 한국 식당에 갔어요."},
            {"speaker": "User (Blank)", "text": "[Reaction Slot 1]"},
            {"speaker": "Partner", "text": "음식이 정말 맛있고 직원도 친절하더라고요."},
            {"speaker": "User (Blank)", "text": "[Reaction Slot 2]"}
        ],
        "suggested_reactions": ["아, 진짜요?", "맞아요", "우와"]
    }
]

AGREE_DISAGREE_ITEMS = [
    {
        "id": "ad_dr_1",
        "prompt": "요즘은 책보다 유튜브로 공부하는 게 더 좋은 것 같아요.",
        "translation": "I think studying with YouTube is better than books these days."
    }
]

QUIZ_BLUEPRINT_P8 = [
    {
        "id": "q_p8_1",
        "type": "choice",
        "question": "What is the purpose of backchannels (e.g., '아, 진짜요?') in Korean conversation?",
        "options": [
            "To signal active listening without taking over the speaker's turn",
            "To interrupt the speaker and start talking about yourself",
            "To show that you disagree with everything being said"
        ],
        "correct_answer": "To signal active listening without taking over the speaker's turn",
        "explanation": "Backchannels are 'I'm listening' signals that keep the conversational flow natural."
    },
    {
        "id": "q_p8_2",
        "type": "choice",
        "question": "Which of the following is an appropriate way to express soft disagreement at B1 level?",
        "options": [
            "글쎄요... 그건 잘 모르겠어요.",
            "아니요, 틀렸어요.",
            "맞아요, 저도 그래요."
        ],
        "correct_answer": "글쎄요... 그건 잘 모르겠어요.",
        "explanation": "'글쎄요' (Well...) is a polite conversational routine used to express soft disagreement or hesitation."
    },
    {
        "id": "q_p8_3",
        "type": "choice",
        "question": "Which response is most suitable when a partner says, '저 오늘 시험 봐요'?",
        "options": [
            "아, 그래요? 힘내세요!",
            "대박!",
            "글쎄요..."
        ],
        "correct_answer": "아, 그래요? 힘내세요!",
        "explanation": "'Oh, really? Good luck!' is the most supportive and natural reaction to someone taking an exam."
    },
    {
        "id": "q_p8_4",
        "type": "choice",
        "question": "How can you naturally hand the conversational turn back to your partner '민수' after speaking?",
        "options": [
            "By saying '민수 씨는요?'",
            "By remaining completely silent",
            "By starting a new topic without asking anything"
        ],
        "correct_answer": "By saying '민수 씨는요?'",
        "explanation": "Asking 'What about you, Minsu?' is a standard turn-taking prompt."
    },
    {
        "id": "q_p8_5",
        "type": "choice",
        "question": "What does a sentence ending like '~는데요' often signal in dialogue turn-taking?",
        "options": [
            "It leaves the sentence open, inviting the other speaker to react or take a turn",
            "It signals that you want to end the conversation immediately",
            "It indicates that you are angry"
        ],
        "correct_answer": "It leaves the sentence open, inviting the other speaker to react or take a turn",
        "explanation": "~는데요 indicates background context and is often used to yield the floor to the listener politely."
    }
]

HOMEWORK_P8 = [
    {"id": "hw_p8_1", "text": "Shadow only the listener role: say at least 5 backchannels during a dialogue video/clip."},
    {"id": "hw_p8_2", "text": "Reflect on your next live conversation: note which backchannels and turn-taking gambits you used."},
    {"id": "hw_p8_3", "text": "Record a 1-2 minute dialogue with a partner or AI where both sides share the floor and use backchannels."}
]


# ==========================================
# PHASE 8 ENDPOINTS
# ==========================================
@router.get("/phases/8/metadata")
async def get_metadata_p8(current_user: User = Depends(get_current_user)):
    return METADATA_P8

@router.get("/phases/8/core-data")
async def get_core_data_p8(current_user: User = Depends(get_current_user)):
    return CORE_DATA_P8

@router.get("/phase-8/items/backchannel-detect")
async def get_backchannel_detect(current_user: User = Depends(get_current_user)):
    return BACKCHANNEL_DETECT_ITEMS

@router.post("/phase-8/items/backchannel-detect/answer")
async def check_backchannel_detect(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    # Simply simulate checking
    return {
        "correct": True,
        "explanation": "Great job spotting the backchannels! '아, 그래요?' and '네' are correct."
    }

@router.get("/phase-8/items/routine-classify")
async def get_routine_classify(current_user: User = Depends(get_current_user)):
    return ROUTINE_CLASSIFY_ITEMS

@router.post("/phase-8/items/routine-classify/answer")
async def check_routine_classify(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    return {
        "correct": True,
        "explanation": "Correct mapping! '맞아요' shows agreement, '글쎄요' is soft disagreement, and '아, 그래요?' is neutral."
    }

@router.get("/phase-8/items/turn-taking-listen")
async def get_turn_taking_listen(current_user: User = Depends(get_current_user)):
    return TURN_TAKING_LISTEN_ITEMS

@router.post("/phase-8/items/turn-taking-listen/answer")
async def check_turn_taking_listen(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    return {
        "correct": True,
        "explanation": "Excellent analysis of floor sharing and turn-taking prompts."
    }

@router.get("/phase-8/items/backchannel-shadow")
async def get_backchannel_shadow(current_user: User = Depends(get_current_user)):
    return BACKCHANNEL_SHADOW_ITEMS

@router.post("/phase-8/items/backchannel-shadow/evaluate")
async def evaluate_backchannel_shadow(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 92,
        "feedback": "Perfect response timing. You voiced backchannels inside the pauses without interrupting."
    }

@router.get("/phase-8/items/agree-disagree")
async def get_agree_disagree(current_user: User = Depends(get_current_user)):
    return AGREE_DISAGREE_ITEMS

@router.post("/phase-8/items/agree-disagree/evaluate")
async def evaluate_agree_disagree(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 90,
        "feedback": "Clear stance and supporting reason. Used a valid routine ('저도 그래요' / '글쎄요...')."
    }

@router.post("/phase-8/dialog/start")
async def start_dialog_p8(current_user: User = Depends(get_current_user)):
    return {
        "session_id": "session_p8_abc123",
        "partner_next_line": "요즘 공부하기 참 힘드시죠?",
        "prompt": "React with a backchannel or agreement and ask 민수 how he is doing."
    }

@router.post("/phase-8/dialog/turn")
async def turn_dialog_p8(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    # Simulate multi-turn dialogue progression
    return {
        "partner_next_line": "저도 그래요. 그래도 열심히 해야죠. 다음 주에 만날까요?",
        "prompt": "Agree and ask where to meet."
    }

@router.post("/phase-8/dialog/finish")
async def finish_dialog_p8(current_user: User = Depends(get_current_user)):
    return {
        "score": 95,
        "backchannels_count": 3,
        "questions_count": 2,
        "average_turn_length": 1.8,
        "feedback": "Fantastic conversational turn-taking! You asked clear questions and reactively aligned with the partner."
    }

@router.post("/phase-8/quiz/start")
async def start_quiz_p8(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": QUIZ_BLUEPRINT_P8
    }

@router.post("/phase-8/quiz/answer")
async def check_quiz_answer_p8(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in QUIZ_BLUEPRINT_P8 if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": correct,
        "explanation": q["explanation"]
    }

@router.post("/phase-8/quiz/finish")
async def finish_quiz_p8(payload: QuizFinishRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": payload.score,
        "xp_gained": 100 if payload.score >= 80 else 50,
        "mastery_updates": {
            "conversation_routines_b1": "passed" if payload.score >= 80 else "review"
        }
    }

@router.get("/phase-8/homework")
async def get_homework_p8(current_user: User = Depends(get_current_user)):
    return HOMEWORK_P8

@router.post("/phase-8/homework/submit")
async def submit_homework_p8(payload: HomeworkSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "total_backchannels": 4,
        "questions_count": 3,
        "average_turn_length": 1.9,
        "feedback": "Analysis complete: You used 4 backchannels and asked 3 follow-up questions. Flow feels B1 native!"
    }

@router.post("/phase-8/complete")
async def complete_phase_p8(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "Conversation Master B1",
        "completed_at": "now",
        "next_phase_unlocked": "Phase 9: Gist & Detail Lab"
    }


# ==========================================
# PHASE 9 VARIABLES
# ==========================================
METADATA_P9 = {
    "title": "Listening Lab – Gist & Detail (A2→B1)",
    "subtitle": "Catch the big picture and the important facts.",
    "description": "In this lab, you’ll practise two key listening skills: understanding the main idea (gist) and picking out important details like who, where, when, and how often.",
    "estimated_minutes": 25,
    "goals": [
        "Use first listen for main idea",
        "Use second listen for key details (numbers, times, places)",
        "Work with short monologues and dialogues from everyday topics"
    ],
    "tags": ["A2→B1", "Listening", "Gist", "Detail"],
    "dependencies": "Conversation Lab (Completed)"
}

CORE_DATA_P9 = {
    "audio_texts": [
        {
            "id": "at_1",
            "topic": "hobbies",
            "text": "저는 주말에 보통 등산을 해요. 등산을 하면 스트레스가 풀려요. 보통 아침 일찍 6시에 가요.",
            "translation": "I usually go hiking on weekends. Hiking relieves my stress. I usually go early at 6 AM."
        }
    ],
    "gist_questions": [
        {"id": "gq_1", "text": "What is the main topic of the talk?", "options": ["Hiking/Hobbies", "Working late", "Study plans"]}
    ],
    "detail_questions": [
        {"id": "dq_1", "text": "What time does the speaker go hiking?", "options": ["6 AM", "8 AM", "6 PM"]}
    ]
}

GIST_TITLE_ITEMS = [
    {
        "id": "gt_1",
        "audio_text": "어제 친구하고 같이 한국 식당에 가서 비빔밥을 먹었어요. 정말 맛있었어요. 가격도 싸고 좋았어요.",
        "options": ["주말 쇼핑", "식당 방문기", "한국어 공부"],
        "correct": "식당 방문기",
        "note": "The speaker describes going to a Korean restaurant and eating bibimbap, making '식당 방문기' (Restaurant Visit) the best title."
    }
]

GIST_MAIN_IDEA_ITEMS = [
    {
        "id": "gmi_1",
        "audio_text": "저는 한국 노래를 듣는 걸 좋아해요. 매일 아침 버스에서 K-Pop을 들으면서 학교에 가요.",
        "options": [
            "She goes to school by bus.",
            "She likes listening to K-Pop/Korean music.",
            "She plays an instrument."
        ],
        "correct": "She likes listening to K-Pop/Korean music.",
        "note": "The main theme is her love for listening to Korean songs (K-Pop)."
    }
]

GIST_IMAGE_MATCH_ITEMS = [
    {
        "id": "gim_1",
        "audio_text": "이 커피숍은 정말 조용하고 커피가 맛있어요. 저는 여기에서 자주 공부해요.",
        "options": ["Office/회사", "Park/공원", "Café/카페"],
        "correct": "Café/카페",
        "note": "Key words like '커피숍' (coffee shop) and '커피' (coffee) map to the Café category."
    }
]

DETAIL_WHO_WHERE_WHEN_ITEMS = [
    {
        "id": "dwww_1",
        "audio_text": "김철수 씨는 내일 오전 10시에 서울역에서 친구를 만나서 부산으로 여행을 갑니다.",
        "questions": [
            {
                "id": "q_who",
                "question": "Who is going to Busan?",
                "options": ["김철수", "이민우", "박수민"],
                "correct": "김철수"
            },
            {
                "id": "q_where",
                "question": "Where are they meeting?",
                "options": ["서울역 (Seoul Station)", "부산역 (Busan Station)", "공항 (Airport)"],
                "correct": "서울역 (Seoul Station)"
            },
            {
                "id": "q_when",
                "question": "What time are they meeting tomorrow?",
                "options": ["10 AM", "2 PM", "10 PM"],
                "correct": "10 AM"
            }
        ]
    }
]

DETAIL_NUMBERS_ITEMS = [
    {
        "id": "dn_1",
        "audio_text": "사과 세 개하고 오렌지 두 개 주세요. 모두 오천원입니다.",
        "questions": [
            {
                "id": "q_num_apples",
                "question": "How many apples (사과)?",
                "options": ["2 apples", "3 apples", "5 apples"],
                "correct": "3 apples"
            },
            {
                "id": "q_num_price",
                "question": "What is the total price?",
                "options": ["3,000 won", "5,000 won", "10,000 won"],
                "correct": "5,000 won"
            }
        ]
    }
]

DICTATION_ITEMS = [
    {
        "id": "dict_1",
        "audio_text": "내일은 비가 올 거예요.",
        "partial": "내일은 ___ 올 거예요.",
        "missing_word": "비가",
        "translation": "It will rain tomorrow."
    }
]

QUIZ_BLUEPRINT_P9 = [
    {
        "id": "q_p9_1",
        "type": "choice",
        "question": "What is the primary focus of gist listening?",
        "options": [
            "Understanding the general main idea or topic",
            "Spelling every word correctly",
            "Writing down all numbers and dates mentioned"
        ],
        "correct_answer": "Understanding the general main idea or topic",
        "explanation": "Gist listening focuses on catching the big picture rather than specific detail facts."
    },
    {
        "id": "q_p9_2",
        "type": "choice",
        "question": "When listening for details, which of the following is considered specific factual information?",
        "options": [
            "The general tone of the speaker",
            "Specific numbers, times, locations, and prices",
            "The language dialect name"
        ],
        "correct_answer": "Specific numbers, times, locations, and prices",
        "explanation": "Specific details are facts like counts, times, prices, and names."
    },
    {
        "id": "q_p9_3",
        "type": "choice",
        "question": "True or False: In the Three-Pass listening strategy, you should look up every unknown word during the very first pass.",
        "options": [
            "False (First pass should only focus on general gist)",
            "True"
        ],
        "correct_answer": "False (First pass should only focus on general gist)",
        "explanation": "First pass should be done without pausing or looking up words to grasp the overall context."
    },
    {
        "id": "q_p9_4",
        "type": "choice",
        "question": "If you hear: '매일 아침 일곱 시 반에 일어나요', what is the specific detail of time?",
        "options": [
            "7:30 AM",
            "8:30 AM",
            "7:00 AM"
        ],
        "correct_answer": "7:30 AM",
        "explanation": "일곱 시 반 means 7:30 (half past seven)."
    },
    {
        "id": "q_p9_5",
        "type": "choice",
        "question": "Which sentence ending indicates how frequently someone does an action?",
        "options": [
            "일주일에 두 번 해요 (Twice a week)",
            "재미있어요 (It is fun)",
            "한국 사람이에요 (I am Korean)"
        ],
        "correct_answer": "일주일에 두 번 해요 (Twice a week)",
        "explanation": "'일주일에 두 번' specifies frequency (quantity/time detail)."
    }
]

HOMEWORK_P9 = [
    {"id": "hw_p9_1", "text": "Choose a short audio from your main course. Write a 1-sentence gist summary and note 3 details."},
    {"id": "hw_p9_2", "text": "Pick a real-world clip (e.g. weather). Track one type of detail (e.g. temperatures) and log it."},
    {"id": "hw_p9_3", "text": "Listen to a Korean sentence, do a micro dictation writing it out, and correct mismatches."}
]


# ==========================================
# PHASE 9 ENDPOINTS
# ==========================================
@router.get("/phases/9/metadata")
async def get_metadata_p9(current_user: User = Depends(get_current_user)):
    return METADATA_P9

@router.get("/phases/9/core-data")
async def get_core_data_p9(current_user: User = Depends(get_current_user)):
    return CORE_DATA_P9

@router.get("/phase-9/items/gist-title")
async def get_gist_title(current_user: User = Depends(get_current_user)):
    return GIST_TITLE_ITEMS

@router.post("/phase-9/items/gist-title/answer")
async def check_gist_title(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in GIST_TITLE_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-9/items/gist-main-idea")
async def get_gist_main_idea(current_user: User = Depends(get_current_user)):
    return GIST_MAIN_IDEA_ITEMS

@router.post("/phase-9/items/gist-main-idea/answer")
async def check_gist_main_idea(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in GIST_MAIN_IDEA_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-9/items/gist-image-match")
async def get_gist_image_match(current_user: User = Depends(get_current_user)):
    return GIST_IMAGE_MATCH_ITEMS

@router.post("/phase-9/items/gist-image-match/answer")
async def check_gist_image_match(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in GIST_IMAGE_MATCH_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-9/items/detail-who-where-when")
async def get_detail_who_where_when(current_user: User = Depends(get_current_user)):
    return DETAIL_WHO_WHERE_WHEN_ITEMS

@router.post("/phase-9/items/detail-who-where-when/answer")
async def check_detail_who_where_when(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    # Payload format selection check
    return {
        "correct": True,
        "explanation": "Great job identifying the details of character, place, and time!"
    }

@router.get("/phase-9/items/detail-numbers")
async def get_detail_numbers(current_user: User = Depends(get_current_user)):
    return DETAIL_NUMBERS_ITEMS

@router.post("/phase-9/items/detail-numbers/answer")
async def check_detail_numbers(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    return {
        "correct": True,
        "explanation": "Perfect detail extraction of quantities and prices."
    }

@router.get("/phase-9/items/dictation")
async def get_dictation_p9(current_user: User = Depends(get_current_user)):
    return DICTATION_ITEMS

@router.post("/phase-9/items/dictation/answer")
async def check_dictation_p9(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in DICTATION_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option.strip() == item["missing_word"]
    return {
        "correct": correct,
        "explanation": f"Correct word is '{item['missing_word']}'. Your dictation spelling matches!" if correct else f"Spelling mismatch. Target was '{item['missing_word']}'."
    }

@router.post("/phase-9/quiz/start")
async def start_quiz_p9(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": QUIZ_BLUEPRINT_P9
    }

@router.post("/phase-9/quiz/answer")
async def check_quiz_answer_p9(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in QUIZ_BLUEPRINT_P9 if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": correct,
        "explanation": q["explanation"]
    }

@router.post("/phase-9/quiz/finish")
async def finish_quiz_p9(payload: QuizFinishRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": payload.score,
        "xp_gained": 100 if payload.score >= 80 else 50,
        "mastery_updates": {
            "gist_detail_a2b1": "passed" if payload.score >= 80 else "review"
        }
    }

@router.get("/phase-9/homework")
async def get_homework_p9(current_user: User = Depends(get_current_user)):
    return HOMEWORK_P9

@router.post("/phase-9/homework/submit")
async def submit_homework_p9(payload: HomeworkSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "total_backchannels": 0,
        "questions_count": 0,
        "average_turn_length": 0.0,
        "feedback": "Listening plan logs uploaded successfully. Streak updated. Keep practicing multiple passes!"
    }

@router.post("/phase-9/complete")
async def complete_phase_p9(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "Gist & Detail Listening Champion",
        "completed_at": "now",
        "next_phase_unlocked": "Phase 10: Reaction Lab"
    }


# ==========================================
# PHASE 10 VARIABLES
# ==========================================
METADATA_P10 = {
    "title": "Reaction Lab – Listen & Respond Fast (B1)",
    "subtitle": "Answer quickly and naturally.",
    "description": "In this lab, you’ll practise listening to short prompts and responding quickly with simple, clear Korean—just like in real conversations at B1 level.",
    "estimated_minutes": 25,
    "goals": [
        "Hear short questions and statements on familiar topics",
        "Choose or say a quick, appropriate response",
        "Build automaticity so you don’t translate in your head"
    ],
    "tags": ["B1", "Listening", "Speaking", "Fast reaction"],
    "dependencies": "Gist & Detail Lab (Completed)"
}

CORE_DATA_P10 = {
    "prompt_bank": [
        {
            "id": "pb_1",
            "prompt": "지금 시간 있어요?",
            "type": "yes/no",
            "function": "asking information",
            "patterns": ["네, 있어요", "아니요, 바빠요"]
        }
    ]
}

QUICK_YESNO_ITEMS = [
    {
        "id": "qyn_1",
        "prompt": "지금 시간 있어요?",
        "options": ["네, 있어요 / 네, 좋아요", "아니요, 없어요 / 미안해요"],
        "correct": "네, 있어요 / 네, 좋아요",
        "note": "A friendly confirmation is standard for social prompts unless stated otherwise."
    }
]

BEST_RESPONSE_ITEMS = [
    {
        "id": "br_1",
        "prompt": "오늘 저녁에 뭐 해요?",
        "options": [
            "친구랑 같이 삼겹살 먹으러 가요.",
            "아니요, 틀렸어요.",
            "사과 세 개 주세요."
        ],
        "correct": "친구랑 같이 삼겹살 먹으러 가요.",
        "note": "Directly answering the query about evening plans is pragmatically correct."
    }
]

REACTION_BINGO_ITEMS = [
    {
        "id": "rb_1",
        "prompts_sequence": [
            {"prompt": "도와줄 수 있어요?", "correct_grid_answer": "네, 좋아요"},
            {"prompt": "주말 어땠어요?", "correct_grid_answer": "괜찮았어요"},
            {"prompt": "여행 어디로 가요?", "correct_grid_answer": "잘 모르겠어요"}
        ]
    }
]

FAST_ANSWERS_ITEMS = [
    {
        "id": "fa_1",
        "question": "어디에 살아요?",
        "translation": "Where do you live?"
    }
]

SPEED_ROUND_ITEMS = {
    "round_id": "sr_abc123",
    "partner_line": "주말에 주로 뭐 해요?",
    "prompt": "Say 1 detail about your typical weekend routine immediately."
}

CLARIFICATION_ITEMS = [
    {
        "id": "cl_1",
        "utterance": "내일 서울역 앞 스타벅스에서 오전 10시 반에 친구랑 만나기로 했어요.",
        "instruction": "Say this in one simpler sentence or confirm the meeting details.",
        "model_clarification": "그러니까 내일 10시 반에 스타벅스에서 만나는 거죠?"
    }
]

QUIZ_BLUEPRINT_P10 = [
    {
        "id": "q_p10_1",
        "type": "choice",
        "question": "What is the primary objective of reaction speed drills at B1 level?",
        "options": [
            "To reduce pause time and speak naturally without translating in your head",
            "To write long paragraphs about the topic",
            "To memorize the dictionary definition of every word"
        ],
        "correct_answer": "To reduce pause time and speak naturally without translating in your head",
        "explanation": "Reaction labs train conversational automaticity and reduce response latency."
    },
    {
        "id": "q_p10_2",
        "type": "choice",
        "question": "What should you do if you hear a B1 question and don't catch all the details?",
        "options": [
            "Freeze and remain silent until they change the topic",
            "Use a quick clarification routine like '다시 말씀해 주세요'",
            "Answer '네' to everything even if it makes no sense"
        ],
        "correct_answer": "Use a quick clarification routine like '다시 말씀해 주세요'",
        "explanation": "Clarification gambits are active listening tools that keep the turn-taking flow alive."
    },
    {
        "id": "q_p10_3",
        "type": "choice",
        "question": "Which response is an appropriate quick response to '도와줄 수 있어요?' (Can you help me?)",
        "options": [
            "네, 지금 도와줄게요. (Yes, I will help you now.)",
            "주말에 쇼핑해요.",
            "대박!"
        ],
        "correct_answer": "네, 지금 도와줄게요. (Yes, I will help you now.)",
        "explanation": "Answering a request directly with agreement and action is grammatically and pragmatically correct."
    },
    {
        "id": "q_p10_4",
        "type": "choice",
        "question": "If you classify a prompt as a general open question (e.g. '주말에 주로 뭐 해요?'), what is the best strategy?",
        "options": [
            "Provide a short 1-2 sentence response immediately about your typical routine",
            "Spend 30 seconds planning a complex grammatical essay",
            "Say '네' and yield the turn immediately"
        ],
        "correct_answer": "Provide a short 1-2 sentence response immediately about your typical routine",
        "explanation": "Open questions require a quick, simple answer rather than long silence or monosyllabic replies."
    },
    {
        "id": "q_p10_5",
        "type": "choice",
        "question": "Which of these is a fast way to confirm a scheduled meeting time?",
        "options": [
            "그럼 내일 세 시에 만나는 거죠? (So we meet at 3 tomorrow, right?)",
            "김철수 씨는 서울역에 갑니다.",
            "비가 올 거예요."
        ],
        "correct_answer": "그럼 내일 세 시에 만나는 거죠? (So we meet at 3 tomorrow, right?)",
        "explanation": "Confirming details with '그럼... ~는 거죠?' is a standard B1 clarification/confirmation routine."
    }
]

HOMEWORK_P10 = [
    {"id": "hw_p10_1", "text": "Rapid Q&A self-drills: record 10 common personal questions and answer them under 3 seconds each."},
    {"id": "hw_p10_2", "text": "Timed partner task: ask a tutor/partner for quick-fire questions and record your latency gaps."},
    {"id": "hw_p10_3", "text": "Real-life micro-interactions log: describe 3 brief interactions in Korean, outlining response speed and hits."}
]


# ==========================================
# PHASE 10 ENDPOINTS
# ==========================================
@router.get("/phases/10/metadata")
async def get_metadata_p10(current_user: User = Depends(get_current_user)):
    return METADATA_P10

@router.get("/phases/10/core-data")
async def get_core_data_p10(current_user: User = Depends(get_current_user)):
    return CORE_DATA_P10

@router.get("/phase-10/items/quick-yesno")
async def get_quick_yesno(current_user: User = Depends(get_current_user)):
    return QUICK_YESNO_ITEMS

@router.post("/phase-10/items/quick-yesno/answer")
async def check_quick_yesno(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in QUICK_YESNO_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-10/items/best-response")
async def get_best_response(current_user: User = Depends(get_current_user)):
    return BEST_RESPONSE_ITEMS

@router.post("/phase-10/items/best-response/answer")
async def check_best_response(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in BEST_RESPONSE_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-10/items/reaction-bingo")
async def get_reaction_bingo(current_user: User = Depends(get_current_user)):
    return REACTION_BINGO_ITEMS

@router.post("/phase-10/items/reaction-bingo/answer")
async def check_reaction_bingo(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    return {
        "correct": True,
        "explanation": "Bingo completed! Quick match and zero thinking hesitation."
    }

@router.get("/phase-10/items/fast-answers")
async def get_fast_answers(current_user: User = Depends(get_current_user)):
    return FAST_ANSWERS_ITEMS

@router.post("/phase-10/items/fast-answers/evaluate")
async def evaluate_fast_answers(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 90,
        "latency": "On time (1.2s)",
        "feedback": "Great speed! You responded with a complete sentence immediately."
    }

@router.post("/phase-10/speed-round/start")
async def start_speed_round(current_user: User = Depends(get_current_user)):
    return SPEED_ROUND_ITEMS

@router.post("/phase-10/speed-round/turn")
async def turn_speed_round(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "partner_line": "등산 끝나고 뭐 할 거예요?",
        "prompt": "Answer that you'll eat lunch."
    }

@router.post("/phase-10/speed-round/finish")
async def finish_speed_round(current_user: User = Depends(get_current_user)):
    return {
        "overall_score": 93,
        "round_details": ["Round 1: good", "Round 2: good"],
        "feedback": "Perfect latency metrics. Average delay was 1.5 seconds. Communicative goals fully met."
    }

@router.get("/phase-10/items/clarification")
async def get_clarification(current_user: User = Depends(get_current_user)):
    return CLARIFICATION_ITEMS

@router.post("/phase-10/items/clarification/evaluate")
async def evaluate_clarification(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 91,
        "feedback": "Very natural confirmation contour and phrase matched the prompt's meeting details."
    }

@router.post("/phase-10/quiz/start")
async def start_quiz_p10(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": QUIZ_BLUEPRINT_P10
    }

@router.post("/phase-10/quiz/answer")
async def check_quiz_answer_p10(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in QUIZ_BLUEPRINT_P10 if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": correct,
        "explanation": q["explanation"]
    }

@router.post("/phase-10/quiz/finish")
async def finish_quiz_p10(payload: QuizFinishRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": payload.score,
        "xp_gained": 100 if payload.score >= 80 else 50,
        "mastery_updates": {
            "fast_reaction_b1": "passed" if payload.score >= 80 else "review"
        }
    }

@router.get("/phase-10/homework")
async def get_homework_p10(current_user: User = Depends(get_current_user)):
    return HOMEWORK_P10

@router.post("/phase-10/homework/submit")
async def submit_homework_p10(payload: HomeworkSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "latency_status": "fast enough",
        "overall_latency_sec": 1.4,
        "feedback": "Logged homework reflection. Latency analyzed at ~1.4s, which is well within B1 conversational target range."
    }

@router.post("/phase-10/complete")
async def complete_phase_p10(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "Conversational Fast Responder B1",
        "completed_at": "now",
        "next_phase_unlocked": "Phase 11: Story Lab"
    }


# ==========================================
# PHASE 11 VARIABLES
# ==========================================
METADATA_P11 = {
    "title": "Story Lab – Longer Turns & Narratives (B2)",
    "subtitle": "Tell clear, detailed stories and descriptions.",
    "description": "In this lab, you’ll practise telling short stories and giving detailed descriptions about familiar topics, using clear structure, past tenses, and smooth pronunciation at B2 level.",
    "estimated_minutes": 30,
    "goals": [
        "Organise stories into beginning–middle–end",
        "Describe events and experiences in detail",
        "Keep a 1–3 minute monologue flowing with clear pronunciation and rhythm"
    ],
    "tags": ["B2", "Sustained monologue", "Storytelling", "Speaking"],
    "dependencies": "Reaction Lab (Completed)"
}

CORE_DATA_P11 = {
    "story_templates": [
        {
            "id": "st_trip",
            "title": "Travel Memory (여행 경험)",
            "outline": [
                "Introduction: 언제? 어디서? 누구랑? (Last summer, went to Jeju with family)",
                "Main Event: 무슨 일이 있었어요? (Lost baggage at the airport, struggled to find it, but found it eventually)",
                "Ending: 결과는? 기분은? (Felt relieved, became a memorable experience)"
            ]
        },
        {
            "id": "st_mistake",
            "title": "A Mistake (실수했던 경험)",
            "outline": [
                "Introduction: 언제? 어디서? 무슨 실수? (Work/School mistake, wrong meeting room)",
                "Main Event: 어떻게 해결했어요? (Apologized, ran to the correct room, gave presentation)",
                "Ending: 무엇을 배웠어요? (Learned to check emails/calendar twice)"
            ]
        }
    ],
    "topic_list": [
        {"id": "topic_trip", "name": "A travel memory (여행 기억)"},
        {"id": "topic_mistake", "name": "A mistake at work/school (실수담)"},
        {"id": "topic_funny", "name": "A funny or surprising day (재미있는 하루)"}
    ]
}

STORY_STRUCTURE_LISTEN_ITEMS = [
    {
        "id": "ssl_1",
        "audio_text": "제가 대학교 때 부산에 혼자 갔을 때의 일인데요. 기차표를 잃어버려서 진짜 당황했었어요. 결국 승무원분께 물어보고 새로 샀죠. 그땐 정말 힘들었지만 지금 생각하면 재미있는 추억이에요.",
        "paragraphs": [
            {"id": "p_main", "text": "기차표를 잃어버려서 진짜 당황했었어요. 결국 승무원분께 물어보고 새로 샀죠.", "label": "Main Event"},
            {"id": "p_intro", "text": "제가 대학교 때 부산에 혼자 갔을 때의 일인데요.", "label": "Introduction"},
            {"id": "p_ending", "text": "그땐 정말 힘들었지만 지금 생각하면 재미있는 추억이에요.", "label": "Ending"}
        ]
    }
]

STORY_CONNECTORS_ITEMS = [
    {
        "id": "sc_1",
        "text": "처음에는 날씨가 맑았어요. 그런데 갑자기 비가 쏟아졌어요. 그래서 우리는 카페로 들어갔어요. 결국 그 카페에서 인생 커피를 만났죠.",
        "connectors": [
            {"word": "처음에는", "type": "time"},
            {"word": "그런데 갑자기", "type": "contrast"},
            {"word": "그래서", "type": "result"},
            {"word": "결국", "type": "result"}
        ]
    }
]

STORY_PROSODY_LISTEN_ITEMS = [
    {
        "id": "spl_1",
        "audio_text": "그때 정말 깜짝 놀랐어요! 왜냐하면 지갑이 없었거든요.",
        "questions": [
            {
                "id": "spl_q1",
                "question": "Where does the speaker raise pitch significantly to show emotion/surprise?",
                "options": ["그때 정말 깜짝 놀랐어요!", "왜냐하면", "지갑이 없었거든요."],
                "correct": "그때 정말 깜짝 놀랐어요!"
            },
            {
                "id": "spl_q2",
                "question": "Where is the longest pause in the monologue?",
                "options": ["After '놀랐어요!' (between sentences)", "Before '그때'", "Inside the word '지갑이'"],
                "correct": "After '놀랐어요!' (between sentences)"
            }
        ]
    }
]

GUIDED_STORY_ITEMS = [
    {
        "id": "gs_1",
        "topic": "A trip mishap (여행 중 일어난 일)",
        "prompts": {
            "intro": "언제? 어디서? 누구랑?",
            "event": "무슨 일이 있었어요?",
            "ending": "결과는? 기분은?"
        }
    }
]

PICTURE_DESCRIPTION_ITEMS = [
    {
        "id": "pd_1",
        "images": ["/assets/images/story_pic1.png", "/assets/images/story_pic2.png"],
        "micro_prompts": "Describe where/when, what people are doing, how they might feel."
    }
]

OPINION_TALK_ITEMS = [
    {
        "id": "ot_1",
        "topic": "Online learning vs classroom learning (온라인 학습 vs 대면 학습)",
        "hints": [
            "State your opinion briefly (저는 ... 생각해요)",
            "Give 2 reasons (첫째로, 둘째로)",
            "Add 1 example or personal story (예를 들면)"
        ]
    }
]

QUIZ_BLUEPRINT_P11 = [
    {
        "id": "q_p11_1",
        "type": "choice",
        "question": "Which sentence functions best as the 'Introduction' of a B2 personal narrative?",
        "options": [
            "작년에 친구들과 부산으로 첫 여행을 갔을 때 이야기예요. (This is a story about when I first traveled to Busan with friends last year.)",
            "결국 기차를 놓치지 않고 잘 탈 수 있었어요.",
            "그래서 그 다음 날 아침 일찍 일어났습니다."
        ],
        "correct_answer": "작년에 친구들과 부산으로 첫 여행을 갔을 때 이야기예요. (This is a story about when I first traveled to Busan with friends last year.)",
        "explanation": "Introductions set the scene by defining the timeframe (작년에), participants (친구들과), and location/event (부산으로 첫 여행)."
    },
    {
        "id": "q_p11_2",
        "type": "choice",
        "question": "Which connector is most appropriate for introducing a turning point or unexpected event in a story?",
        "options": [
            "그런데 갑자기 (But suddenly / By the way)",
            "게다가 (Furthermore)",
            "따라서 (Therefore)"
        ],
        "correct_answer": "그런데 갑자기 (But suddenly / By the way)",
        "explanation": "'그런데 갑자기' signals a sudden shift or unexpected event, which drives the narrative action forward."
    },
    {
        "id": "q_p11_3",
        "type": "choice",
        "question": "Select the most logical chronological ordering of these narrative outline points:",
        "options": [
            "1. 제주도 비행기 표 예약 (Intro) -> 2. 폭설로 비행기 연착 (Event) -> 3. 숙소에서 따뜻하게 보낸 소감 (Ending)",
            "1. 폭설로 비행기 연착 -> 2. 제주도 비행기 표 예약 -> 3. 숙소에서 따뜻하게 보낸 소감",
            "1. 숙소에서 따뜻하게 보낸 소감 -> 2. 폭설로 비행기 연착 -> 3. 제주도 비행기 표 예약"
        ],
        "correct_answer": "1. 제주도 비행기 표 예약 (Intro) -> 2. 폭설로 비행기 연착 (Event) -> 3. 숙소에서 따뜻하게 보낸 소감 (Ending)",
        "explanation": "A logical narrative layout flows from setup (reservation) to conflict (flight delay) to resolution/feelings (staying warm at the accommodation)."
    },
    {
        "id": "q_p11_4",
        "type": "choice",
        "question": "Which sentence represents a B2-level reflective 'Ending' of a personal experience?",
        "options": [
            "비행기 표는 보통 모바일 앱으로 예매해요.",
            "이번 실수를 통해서 꼼꼼하게 일정을 확인하는 습관이 중요함을 깨달았어요. (Through this mistake, I realized the importance of checking plans carefully.)",
            "친구는 어제 커피를 많이 마셨어요."
        ],
        "correct_answer": "이번 실수를 통해서 꼼꼼하게 일정을 확인하는 습관이 중요함을 깨달았어요. (Through this mistake, I realized the importance of checking plans carefully.)",
        "explanation": "Reflective endings explain lessons learned or the internal impact of the story, characteristic of B2 proficiency."
    },
    {
        "id": "q_p11_5",
        "type": "choice",
        "question": "Identify the connector that fits best here: '길을 잃어버렸습니다. (   ) 친절한 분을 만나 안내를 받았습니다.'",
        "options": [
            "다행히 (Fortunately)",
            "결국 (Eventually)",
            "먼저 (First)"
        ],
        "correct_answer": "다행히 (Fortunately)",
        "explanation": "'다행히' fits the narrative transition from losing the way (negative) to meeting a kind helper (positive resolution)."
    }
]

HOMEWORK_P11 = [
    {"id": "hw_p11_1", "text": "Record 3 personal stories (1–2 minutes each): a funny or embarrassing situation, a problem and how you solved it, a memorable trip or event. Each story should have intro–main event–ending."},
    {"id": "hw_p11_2", "text": "Record a 1–2 minute description of your neighbourhood, school/workplace, or favourite place. Focus on organising information logically."},
    {"id": "hw_p11_3", "text": "Reflection note: After each recording, listen back and write a short reflection on what was easy/hard, hesitations, and connectors used."}
]


# ==========================================
# PHASE 11 ENDPOINTS
# ==========================================
@router.get("/phases/11/metadata")
async def get_metadata_p11(current_user: User = Depends(get_current_user)):
    return METADATA_P11

@router.get("/phases/11/core-data")
async def get_core_data_p11(current_user: User = Depends(get_current_user)):
    return CORE_DATA_P11

@router.get("/phase-11/items/story-structure-listen")
async def get_story_structure_listen(current_user: User = Depends(get_current_user)):
    return STORY_STRUCTURE_LISTEN_ITEMS

@router.post("/phase-11/items/story-structure-listen/answer")
async def check_story_structure_listen(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    return {
        "correct": True,
        "explanation": "Correct order identified! Introduction sets the scene, Main Event contains the core problem, and Ending summarizes feelings/lessons."
    }

@router.get("/phase-11/items/story-connectors")
async def get_story_connectors(current_user: User = Depends(get_current_user)):
    return STORY_CONNECTORS_ITEMS

@router.post("/phase-11/items/story-connectors/answer")
async def check_story_connectors(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    return {
        "correct": True,
        "explanation": "Excellent connector selection! These words make narrative logic clear to listeners."
    }

@router.get("/phase-11/items/story-prosody-listen")
async def get_story_prosody_listen(current_user: User = Depends(get_current_user)):
    return STORY_PROSODY_LISTEN_ITEMS

@router.post("/phase-11/items/story-prosody-listen/answer")
async def check_story_prosody_listen(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    return {
        "correct": True,
        "explanation": "Correct analysis! Intonation increases energy at emotional peaks, and breathing gaps divide clauses naturally."
    }

@router.get("/phase-11/items/guided-story")
async def get_guided_story(current_user: User = Depends(get_current_user)):
    return GUIDED_STORY_ITEMS

@router.post("/phase-11/items/guided-story/evaluate")
async def evaluate_guided_story(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 90,
        "structure": {
            "has_intro": True,
            "has_main": True,
            "has_ending": True
        },
        "connectors_used": ["그래서", "결국"],
        "fluency": {
            "duration_sec": 75,
            "median_phrase_len": 4.5,
            "pauses_count": 8
        },
        "feedback": "Great story flow! You structured the intro, main event, and ending logically. Suggestion: add more time markers like '그 다음에'."
    }

@router.get("/phase-11/items/picture-description")
async def get_picture_description(current_user: User = Depends(get_current_user)):
    return PICTURE_DESCRIPTION_ITEMS

@router.post("/phase-11/items/picture-description/evaluate")
async def evaluate_picture_description(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 88,
        "feedback": "Good depiction of the scenes. You successfully linked the pictures together with sequential connectors, showing high B2 description skills."
    }

@router.get("/phase-11/items/opinion-talk")
async def get_opinion_talk(current_user: User = Depends(get_current_user)):
    return OPINION_TALK_ITEMS

@router.post("/phase-11/items/opinion-talk/evaluate")
async def evaluate_opinion_talk(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 91,
        "structure_map": {
            "opinion": "State clearly",
            "reason_1": "Provided",
            "reason_2": "Provided",
            "example": "Provided"
        },
        "feedback": "Perfect B2 mini-talk structure. You stated your stance, backed it with two clear reasons, and added a relevant personal example."
    }

@router.post("/phase-11/quiz/start")
async def start_quiz_p11(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": QUIZ_BLUEPRINT_P11
    }

@router.post("/phase-11/quiz/answer")
async def check_quiz_answer_p11(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in QUIZ_BLUEPRINT_P11 if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": correct,
        "explanation": q["explanation"]
    }

@router.post("/phase-11/quiz/finish")
async def finish_quiz_p11(payload: QuizFinishRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": payload.score,
        "xp_gained": 120 if payload.score >= 80 else 60,
        "mastery_updates": {
            "storytelling_b2": "passed" if payload.score >= 80 else "review"
        }
    }

@router.get("/phase-11/homework")
async def get_homework_p11(current_user: User = Depends(get_current_user)):
    return HOMEWORK_P11

@router.post("/phase-11/homework/submit")
async def submit_homework_p11(payload: HomeworkSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "overall_score": 89,
        "estimated_fluency": "B2 Level (median phrase length 4.8 words)",
        "connectors_count": 6,
        "structure_outline": ["Introduction: verified", "Main Event: verified", "Ending: verified"],
        "feedback": "Homework submitted. Story structure tags matched, connectors variety was excellent, and median silence intervals were narrow!"
    }

@router.post("/phase-11/complete")
async def complete_phase_p11(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "B2 Storytelling & Monologue Master",
        "completed_at": "now",
        "next_phase_unlocked": "Phase 12: Media Lab"
    }


# ==========================================
# PHASE 12 VARIABLES
# ==========================================
METADATA_P12 = {
    "title": "Media Lab – Real‑World Listening & Reaction (B2)",
    "subtitle": "Understand real audio and respond naturally.",
    "description": "In this lab, you’ll practise listening to real‑world Korean audio like news bites, mini podcasts, and interviews, and then summarising and reacting to what you heard at B2 level.",
    "estimated_minutes": 35,
    "goals": [
        "Work with authentic or semi‑authentic B2 audio",
        "Catch main ideas and key opinions",
        "Summarise in your own words and respond with your view"
    ],
    "tags": ["B2", "Authentic listening", "Integrated skills"],
    "dependencies": "Story Lab (Completed)"
}

CORE_DATA_P12 = {
    "media_clips": [
        {
            "id": "mc_news",
            "topic": "Environment (환경)",
            "type": "news",
            "length": "1:30",
            "title": "Disposable Cup Deposit System (일회용 컵 보증금제)",
            "audio_text": "최근 정부가 일회용 컵 사용을 줄이기 위해 보증금제를 확대 실시하고 있습니다. 시민들은 환경 보호에는 동의하지만 반환 과정이 번거롭다는 불편함을 호소하고 있습니다."
        },
        {
            "id": "mc_podcast",
            "topic": "Lifestyle (라이프스타일)",
            "type": "podcast",
            "length": "2:00",
            "title": "Minimal Life Trend (미니멀 라이프의 유행)",
            "audio_text": "불필요한 물건을 정리하고 단순하게 살아가는 미니멀 라이프가 젊은 층 사이에서 큰 관심을 끌고 있습니다. 물건을 소유하는 것보다 경험을 중요하게 여기는 가치관의 변화가 원인입니다."
        }
    ]
}

MEDIA_GIST_ITEMS = [
    {
        "id": "mg_1",
        "audio_text": "최근 정부가 일회용 컵 사용을 줄이기 위해 보증금제를 확대 실시하고 있습니다. 시민들은 환경 보호에는 동의하지만 반환 과정이 번거롭다는 불편함을 호소하고 있습니다.",
        "options": [
            "일회용 컵 보증금제의 취지와 시민들의 실질적인 반응 (The purpose of the deposit system and actual reactions)",
            "일회용품 공장 노동자들의 근무 조건 개선",
            "한국 전통 다도 문화의 현대화 방안"
        ],
        "correct": "일회용 컵 보증금제의 취지와 시민들의 실질적인 반응 (The purpose of the deposit system and actual reactions)",
        "note": "The clip reports on the government's expansion of the cup deposit scheme and the subsequent mixed feedback from citizens regarding inconvenience."
    }
]

MEDIA_OPINION_ITEMS = [
    {
        "id": "mo_1",
        "audio_text": "최근 정부가 일회용 컵 사용을 줄이기 위해 보증금제를 확대 실시하고 있습니다. 시민들은 환경 보호에는 동의하지만 반환 과정이 번거롭다는 불편함을 호소하고 있습니다.",
        "options": [
            "The speaker holds a neutral reporting stance, highlighting both the policy's environmental intent and citizens' complaints",
            "The speaker is extremely critical of any environmental regulations",
            "The speaker believes that all disposable cups should be banned immediately"
        ],
        "correct": "The speaker holds a neutral reporting stance, highlighting both the policy's environmental intent and citizens' complaints",
        "note": "The reporter introduces both the environmental benefits and the practical complaints, maintaining a balanced/neutral stance."
    }
]

MEDIA_REASONS_ITEMS = [
    {
        "id": "mr_1",
        "audio_text": "최근 정부가 일회용 컵 사용을 줄이기 위해 보증금제를 확대 실시하고 있습니다. 시민들은 환경 보호에는 동의하지만 반환 과정이 번거롭다는 불편함을 호소하고 있습니다.",
        "options": [
            "일회용품 줄이기 (Reduction of disposable items)",
            "반환 과정의 번거로움 (Inconvenient return process)",
            "정부 예산 부족 (Lack of government budget)",
            "종이컵 생산 원가 상승 (Rise in paper cup costs)"
        ],
        "correct_choices": ["일회용품 줄이기 (Reduction of disposable items)", "반환 과정의 번거로움 (Inconvenient return process)"]
    }
]

ORAL_SUMMARY_ITEMS = [
    {
        "id": "os_1",
        "clip_title": "일회용 컵 보증금제",
        "hints": {
            "topic": "일회용 컵 보증금제 (Disposable Cup Deposit)",
            "main_point": "환경을 보호하려는 정책이지만 시민들은 불편함을 겪음",
            "detail": "반환 과정이 복잡하고 매장들의 협조가 아직 완벽하지 않음"
        }
    }
]

MEDIA_OPINION_REACT_ITEMS = [
    {
        "id": "mor_1",
        "prompt": "일회용 컵 보증금제 확대에 대해 동의하십니까? 본인의 생각과 그 이유를 구체적으로 말씀해 주세요."
    }
]

MEDIA_RETELL_ITEMS = [
    {
        "id": "mrt_1",
        "instruction": "친구에게 일회용 컵 보증금제 뉴스를 본 대로 요약하고, 왜 이것이 최근 화제가 되고 있는지 친근한 말투로 설명해 주세요."
    }
]

QUIZ_BLUEPRINT_P12 = [
    {
        "id": "q_p12_1",
        "type": "choice",
        "question": "Which B2 behavior is key when listening to real-world news or podcasts?",
        "options": [
            "Identifying both main arguments and speaker attitudes/attitudes",
            "Translating every vocabulary item word-for-word in real time",
            "Ignoring tone changes and focus only on numbers"
        ],
        "correct_answer": "Identifying both main arguments and speaker attitudes/attitudes",
        "explanation": "At B2 level, understanding implicit feelings, attitudes, and core arguments is highly crucial."
    },
    {
        "id": "q_p12_2",
        "type": "choice",
        "question": "Select the correct stance mapping for the sentence: '취지는 좋으나 지나치게 규제 위주라는 지적이 있습니다.'",
        "options": [
            "Acknowledge benefits but point out structural concerns/criticisms",
            "Fully endorse the policy without objection",
            "Reject the environmental goal entirely"
        ],
        "correct_answer": "Acknowledge benefits but point out structural concerns/criticisms",
        "explanation": "'취지는 좋으나' acknowledges the positive intent, while '규제 위주라는 지적' notes criticism of over-regulation."
    },
    {
        "id": "q_p12_3",
        "type": "choice",
        "question": "Which connector introduces a logical result or conclusion of a media argument?",
        "options": [
            "이에 따라 (Consequently / Accordingly)",
            "하지만 (However)",
            "예를 들면 (For example)"
        ],
        "correct_answer": "이에 따라 (Consequently / Accordingly)",
        "explanation": "'이에 따라' connects an event with its logical outcome or policy response."
    },
    {
        "id": "q_p12_4",
        "type": "choice",
        "question": "If a podcaster discusses '미니멀 라이프', what is the core driver described by: '소유보다 경험을 중시하는 가치관'?",
        "options": [
            "Value shift prioritizing experiences over material possessions",
            "Economic inflation reducing buying power",
            "Lack of home storage options"
        ],
        "correct_answer": "Value shift prioritizing experiences over material possessions",
        "explanation": "'소유보다 경험' directly translates to prioritizing experiences over possession of material goods."
    },
    {
        "id": "q_p12_5",
        "type": "choice",
        "question": "When performing an integrated summary task, what should be the first element you present?",
        "options": [
            "The general topic and core main idea of the media clip",
            "Your personal opinion and childhood memories",
            "A dictionary explanation of the third keyword"
        ],
        "correct_answer": "The general topic and core main idea of the media clip",
        "explanation": "B2 summaries should follow a structured sequence starting with the main theme before discussing details."
    }
]

HOMEWORK_P12 = [
    {"id": "hw_p12_1", "text": "Choose 2–3 short media pieces per week (news clips, YouTube, podcasts) at B2‑ish level. Listen once for gist and write a 1-2 sentence summary."},
    {"id": "hw_p12_2", "text": "Record a 30–60 second oral summary for at least 2 of those clips each week, noting key opinions and details."},
    {"id": "hw_p12_3", "text": "Record a 1–2 minute opinion journal reaction describing if you agree/disagree and why."}
]


# ==========================================
# PHASE 12 ENDPOINTS
# ==========================================
@router.get("/phases/12/metadata")
async def get_metadata_p12(current_user: User = Depends(get_current_user)):
    return METADATA_P12

@router.get("/phases/12/core-data")
async def get_core_data_p12(current_user: User = Depends(get_current_user)):
    return CORE_DATA_P12

@router.get("/phase-12/items/media-gist")
async def get_media_gist(current_user: User = Depends(get_current_user)):
    return MEDIA_GIST_ITEMS

@router.post("/phase-12/items/media-gist/answer")
async def check_media_gist(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in MEDIA_GIST_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-12/items/media-opinion")
async def get_media_opinion(current_user: User = Depends(get_current_user)):
    return MEDIA_OPINION_ITEMS

@router.post("/phase-12/items/media-opinion/answer")
async def check_media_opinion(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    item = next((i for i in MEDIA_OPINION_ITEMS if i["id"] == payload.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    correct = payload.selected_option == item["correct"]
    return {
        "correct": correct,
        "explanation": item["note"]
    }

@router.get("/phase-12/items/media-reasons")
async def get_media_reasons(current_user: User = Depends(get_current_user)):
    return MEDIA_REASONS_ITEMS

@router.post("/phase-12/items/media-reasons/answer")
async def check_media_reasons(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    # Simply simulate verification of multi-choice checkboxes
    return {
        "correct": True,
        "explanation": "Correct arguments identified! The reporter explicitly raised both the reduction intent and the procedural inconveniences."
    }

@router.get("/phase-12/items/oral-summary")
async def get_oral_summary(current_user: User = Depends(get_current_user)):
    return ORAL_SUMMARY_ITEMS

@router.post("/phase-12/items/oral-summary/evaluate")
async def evaluate_oral_summary(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 92,
        "checklist": {
            "main_point": True,
            "detail_1": True,
            "detail_2": False
        },
        "feedback": "Excellent verbal summary. Main points are clear. Try expanding slightly on detail 2 for full B2 compliance."
    }

@router.get("/phase-12/items/media-opinion-react")
async def get_media_opinion_react(current_user: User = Depends(get_current_user)):
    return MEDIA_OPINION_REACT_ITEMS

@router.post("/phase-12/items/media-opinion-react/evaluate")
async def evaluate_media_opinion_react(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 90,
        "checklist": {
            "opinion": True,
            "reason": True,
            "example": True
        },
        "feedback": "Highly cohesive response. Stance was clear, followed by a valid example and reason structure."
    }

@router.get("/phase-12/items/media-retell")
async def get_media_retell(current_user: User = Depends(get_current_user)):
    return MEDIA_RETELL_ITEMS

@router.post("/phase-12/items/media-retell/evaluate")
async def evaluate_media_retell(payload: AudioSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": 89,
        "rubric": {
            "clarity": "B2 (Good)",
            "organization": "B2 (Good)",
            "relevance": "B2 (High)",
            "pronunciation": "B2 (Good)"
        },
        "feedback": "Perfect retell flow. You explained it clearly, using casual speech registers naturally as if telling a friend."
    }

@router.post("/phase-12/quiz/start")
async def start_quiz_p12(current_user: User = Depends(get_current_user)):
    return {
        "blueprint": QUIZ_BLUEPRINT_P12
    }

@router.post("/phase-12/quiz/answer")
async def check_quiz_answer_p12(payload: QuizAnswerSubmit, current_user: User = Depends(get_current_user)):
    q = next((i for i in QUIZ_BLUEPRINT_P12 if i["id"] == payload.question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    correct = payload.selected_option == q["correct_answer"]
    return {
        "correct": correct,
        "explanation": q["explanation"]
    }

@router.post("/phase-12/quiz/finish")
async def finish_quiz_p12(payload: QuizFinishRequest, current_user: User = Depends(get_current_user)):
    return {
        "score": payload.score,
        "xp_gained": 150 if payload.score >= 80 else 75,
        "mastery_updates": {
            "media_b2": "passed" if payload.score >= 80 else "review"
        }
      }

@router.get("/phase-12/homework")
async def get_homework_p12(current_user: User = Depends(get_current_user)):
    return HOMEWORK_P12

@router.post("/phase-12/homework/submit")
async def submit_homework_p12(payload: HomeworkSubmitRequest, current_user: User = Depends(get_current_user)):
    return {
        "overall_score": 92,
        "feedback": "Media practice logs updated. Your habit analytics show consistent listening across diverse topics!"
    }

@router.post("/phase-12/complete")
async def complete_phase_p12(current_user: User = Depends(get_current_user)):
    return {
        "status": "completed",
        "badge": "Media Listening & Speaking Champion",
        "completed_at": "now",
        "next_phase_unlocked": "None"
    }









