from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import random

from backend.app.api.v1.auth import get_current_user
from backend.app.models.user import User
from backend.app.curriculum.course_5_advanced_korean.phase_2 import PHASE_2_DATA

router = APIRouter()

# Schema Definitions
class StartHeistRequest(BaseModel):
    mode: str  # "practice" | "arcade"
    theme: str  # "work" | "school" | "family" | "mixed"
    difficulty: int  # 1 to 4

class LockOption(BaseModel):
    id: str
    textKo: str
    meaningEn: str
    register: str
    connotation: str
    isCorrect: bool

class GapSchema(BaseModel):
    id: str
    hint: str

class IdiomHeistLock(BaseModel):
    id: str
    type: str  # "context_choice" | "literal_vs_idiomatic" | "collocation" | "gapfill" | "idiom_rewrite"
    theme: str
    difficulty: int
    scenarioDesc: str
    plainSentenceKo: Optional[str] = None
    plainSentenceEn: Optional[str] = None
    underlinedSegment: Optional[str] = None
    hint: Optional[str] = None
    idiomOptions: List[LockOption] = []
    gaps: List[GapSchema] = []

class StartHeistResponse(BaseModel):
    sessionId: str
    locks: List[IdiomHeistLock]

class SolveLockRequest(BaseModel):
    lockId: str
    userChoiceId: Optional[str] = None
    userSentenceKo: Optional[str] = None

class SolveLockResponse(BaseModel):
    success: bool
    partialSuccess: Optional[bool] = False
    score: Optional[int] = 0
    explanation: str
    usedIdiomIds: List[str]

# Scenario generator mapping to heist steps
HEIST_SCENARIOS = [
    "Planning the break-in: You need to formulate the crew strategy.",
    "Hacking the vault system: Bypass the firewall and unlock security.",
    "Creating a distraction: Keep the guards occupied while the team slips inside.",
    "Cracking the safe: Crack the primary mechanical tumbler.",
    "Securing the vault loot: Identify the rare artifacts and secure them.",
    "Disabling the laser grids: Safely bypass the tripwire security.",
    "The getaway escape: Slip past the sirens and escape to the safehouse.",
    "Final inspection: Double-check that all logs have been clean-wiped."
]

@router.post("/start", response_model=StartHeistResponse)
async def start_heist(
    payload: StartHeistRequest,
    current_user: User = Depends(get_current_user)
):
    # Determine number of locks
    num_locks = 6 if payload.mode == "practice" else 8
    
    # Theme filter map
    theme_filter = "all"
    if payload.theme == "work":
        theme_filter = "theme_work_effort"
    elif payload.theme == "school":
        theme_filter = "theme_work_effort"
    elif payload.theme == "family":
        theme_filter = "theme_emotions"
    
    locks_pool = []
    
    # 1. Map Context Choices (from context_dialogues)
    for cd in PHASE_2_DATA.get("context_dialogues", []):
        if theme_filter != "all" and cd.get("theme") != theme_filter:
            continue
        
        # Build lock options
        options = []
        for i, opt in enumerate(cd.get("options", [])):
            options.append(LockOption(
                id=f"opt_{i}",
                textKo=opt.get("text", ""),
                meaningEn="",
                register=cd.get("register", "neutral"),
                connotation=cd.get("connotation", "neutral"),
                isCorrect=opt.get("is_correct", False)
            ))
            
        locks_pool.append(IdiomHeistLock(
            id=f"lock_cd_{cd.get('id')}",
            type="context_choice",
            theme=payload.theme,
            difficulty=payload.difficulty,
            scenarioDesc="Dialogue Clue: Translate or identify the natural dialogue subtext to disable the lock.",
            plainSentenceKo=cd.get("dialogue_ko"),
            plainSentenceEn=cd.get("dialogue_en"),
            idiomOptions=options
        ))

    # 2. Map Literal vs Idiomatic
    for lvi in PHASE_2_DATA.get("literal_vs_idiomatic", []):
        if theme_filter != "all" and lvi.get("theme") != theme_filter:
            continue
            
        options = [
            LockOption(id="lvi_literal", textKo=lvi.get("literal_sentence"), meaningEn="Basic literal expression", register=lvi.get("register", "neutral"), connotation="neutral", isCorrect=False),
            LockOption(id="lvi_idiomatic", textKo=lvi.get("idiomatic_sentence"), meaningEn="Advanced idiomatic upgrade", register=lvi.get("register", "neutral"), connotation="positive", isCorrect=True)
        ]
        locks_pool.append(IdiomHeistLock(
            id=f"lock_lvi_{lvi.get('id')}",
            type="literal_vs_idiomatic",
            theme=payload.theme,
            difficulty=payload.difficulty,
            scenarioDesc=f"Idiom Upgrade: {lvi.get('context_desc')}",
            idiomOptions=options
        ))

    # 3. Map Collocations
    for coll in PHASE_2_DATA.get("collocations", []):
        options = []
        for i, opt in enumerate(coll.get("options", [])):
            options.append(LockOption(
                id=f"coll_{i}",
                textKo=opt.get("text", ""),
                meaningEn="",
                register="neutral",
                connotation="neutral",
                isCorrect=opt.get("is_correct", False)
            ))
        locks_pool.append(IdiomHeistLock(
            id=f"lock_coll_{coll.get('id')}",
            type="collocation",
            theme=payload.theme,
            difficulty=payload.difficulty,
            scenarioDesc=f"Collocation Lock: Pick the natural verb that pairs with '{coll.get('noun')}'",
            plainSentenceKo=f"Noun: {coll.get('noun')}",
            idiomOptions=options
        ))

    # 4. Map Gap-fills (production_templates)
    for prod in PHASE_2_DATA.get("production_templates", []):
        if theme_filter != "all" and prod.get("theme") != theme_filter:
            continue
        gaps = [GapSchema(id=gap.get("id"), hint=gap.get("hint")) for gap in prod.get("gaps", [])]
        locks_pool.append(IdiomHeistLock(
            id=f"lock_gap_{prod.get('id')}",
            type="gapfill",
            theme=payload.theme,
            difficulty=payload.difficulty,
            scenarioDesc="System Firewall: Fill in the missing advanced idioms to complete the sequence.",
            plainSentenceKo=prod.get("text_ko"),
            plainSentenceEn=prod.get("text_en"),
            gaps=gaps
        ))

    # 5. Map Rewrites
    for rew in PHASE_2_DATA.get("rewrites", []):
        if theme_filter != "all" and rew.get("theme") != theme_filter:
            continue
        locks_pool.append(IdiomHeistLock(
            id=f"lock_rew_{rew.get('id')}",
            type="idiom_rewrite",
            theme=payload.theme,
            difficulty=payload.difficulty,
            scenarioDesc="Laser Grid Bypass: Rewrite the plain sentence by upgrading the underlined part with the target idiom.",
            plainSentenceKo=rew.get("plain_text"),
            underlinedSegment=rew.get("underlined"),
            hint=rew.get("hint")
        ))

    # Fallback padding if pool is small
    if not locks_pool:
        # Pad with collocation locks
        locks_pool = [
            IdiomHeistLock(
                id="lock_fallback_coll",
                type="collocation",
                theme=payload.theme,
                difficulty=payload.difficulty,
                scenarioDesc="Backup System Bypass: Connect the natural verb to the noun.",
                plainSentenceKo="Noun: 스트레스 (Stress)",
                idiomOptions=[
                    LockOption(id="f_opt1", textKo="풀다 (to relieve)", meaningEn="", register="neutral", connotation="positive", isCorrect=True),
                    LockOption(id="f_opt2", textKo="구르다 (to stamp)", meaningEn="", register="neutral", connotation="neutral", isCorrect=False),
                    LockOption(id="f_opt3", textKo="내리다 (to lower)", meaningEn="", register="neutral", connotation="neutral", isCorrect=False)
                ]
            )
        ]

    # Sample and shuffle locks
    selected_locks = []
    for i in range(num_locks):
        lock_template = locks_pool[i % len(locks_pool)]
        # Make a shallow copy to modify scenario label
        copied = lock_template.copy()
        copied.scenarioDesc = f"Step {i+1} - {HEIST_SCENARIOS[i % len(HEIST_SCENARIOS)]} -> {copied.scenarioDesc}"
        selected_locks.append(copied)

    # Randomize list order to keep it fresh
    random.shuffle(selected_locks)

    # Generate a dummy session ID
    session_id = f"heist_{random.randint(10000, 99999)}"

    return StartHeistResponse(
        sessionId=session_id,
        locks=selected_locks
    )

@router.post("/solve-lock", response_model=SolveLockResponse)
async def solve_lock(
    payload: SolveLockRequest,
    current_user: User = Depends(get_current_user)
):
    lock_id = payload.lockId
    choice_id = payload.userChoiceId
    user_sent = payload.userSentenceKo.strip() if payload.userSentenceKo else ""

    success = False
    explanation = "Vault mechanism failed to open."
    used_ids = []

    # 1. Context choice evaluation
    if lock_id.startswith("lock_cd_"):
        cd_id = lock_id.replace("lock_cd_", "")
        cd = next((c for c in PHASE_2_DATA.get("context_dialogues", []) if c.get("id") == cd_id), None)
        if cd:
            correct_idx = next((i for i, o in enumerate(cd.get("options", [])) if o.get("is_correct")), 0)
            target_choice = f"opt_{correct_idx}"
            if choice_id == target_choice:
                success = True
                explanation = cd.get("explanation", "Correct choice!")
                used_ids.append(cd.get("target_idiom", ""))
            else:
                explanation = f"Alarm triggered! This idiom isn't quite right. {cd.get('explanation')}"

    # 2. Literal vs Idiomatic evaluation
    elif lock_id.startswith("lock_lvi_"):
        lvi_id = lock_id.replace("lock_lvi_", "")
        lvi = next((l for l in PHASE_2_DATA.get("literal_vs_idiomatic", []) if l.get("id") == lvi_id), None)
        if lvi:
            if choice_id == "lvi_idiomatic":
                success = True
                explanation = lvi.get("explanation", "Success! Using the idiomatic expression adds rich fluency.")
                used_ids.append(lvi.get("idiomatic_sentence", ""))
            else:
                explanation = f"Plain Korean is okay, but C1 expressions add richness. {lvi.get('explanation')}"

    # 3. Collocations evaluation
    elif lock_id.startswith("lock_coll_"):
        coll_id = lock_id.replace("lock_coll_", "")
        coll = next((c for c in PHASE_2_DATA.get("collocations", []) if c.get("id") == coll_id), None)
        if coll:
            correct_idx = next((i for i, o in enumerate(coll.get("options", [])) if o.get("is_correct")), 0)
            target_choice = f"coll_{correct_idx}"
            if choice_id == target_choice:
                success = True
                explanation = coll.get("explanation", "Correct collocation match!")
                used_ids.append(coll.get("noun", ""))
            else:
                explanation = f"Mismatch! That verb does not naturally collocate with this noun. {coll.get('explanation')}"

    # 4. Gapfill evaluation
    elif lock_id.startswith("lock_gap_"):
        prod_id = lock_id.replace("lock_gap_", "")
        prod = next((p for p in PHASE_2_DATA.get("production_templates", []) if p.get("id") == prod_id), None)
        if prod:
            # We check if userSentenceKo contains any correct answers or matches them
            # Since gapfill input could be a comma-separated list of values, let's parse it
            # e.g. "발을 동동 구르며, 물거품이 될까, 스트레스가 풀렸다"
            user_tokens = [t.strip() for t in user_sent.split(",") if t.strip()]
            gaps = prod.get("gaps", [])
            
            correct_count = 0
            feedback_messages = []
            
            for i, gap in enumerate(gaps):
                target = gap.get("correct_answer", "").strip()
                user_val = user_tokens[i] if i < len(user_tokens) else ""
                
                # Check match (lenient space/substring check)
                if user_val and (user_val == target or target in user_val or user_val in target):
                    correct_count += 1
                    feedback_messages.append(f"{gap.get('id')}: Correct ({target})")
                    used_ids.append(target)
                else:
                    feedback_messages.append(f"{gap.get('id')}: Incorrect (Expected '{target}')")
            
            score = int((correct_count / len(gaps)) * 100) if gaps else 0
            success = (score == 100)
            explanation = " | ".join(feedback_messages)

    # 5. Idiom Rewrite evaluation
    elif lock_id.startswith("lock_rew_"):
        rew_id = lock_id.replace("lock_rew_", "")
        rew = next((r for r in PHASE_2_DATA.get("rewrites", []) if r.get("id") == rew_id), None)
        if rew:
            target = rew.get("idiom_answer", "").strip()
            # Clean spaces
            target_clean = "".join(target.split())
            user_clean = "".join(user_sent.split())
            
            if target_clean in user_clean or user_clean in target_clean:
                success = True
                explanation = f"Lock bypassed! You successfully integrated '{target}' into the sentence."
                used_ids.append(target)
            else:
                explanation = f"Conjugation jam! The lock requires the idiom '{target}' with proper ending structure."

    # Fallback check
    else:
        if choice_id == "f_opt1" or "풀다" in user_sent:
            success = True
            explanation = "Collocation bypassed successfully!"
            used_ids.append("스트레스를 풀다")

    return SolveLockResponse(
        success=success,
        explanation=explanation,
        usedIdiomIds=used_ids
    )
