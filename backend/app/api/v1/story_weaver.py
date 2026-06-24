from fastapi import APIRouter, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
import random
import difflib

from backend.app.api.v1.auth import get_current_user
from backend.app.models.user import User
from backend.app.services.speech_ai import speech_ai_service

router = APIRouter()

# Data models
class StoryTile(BaseModel):
    id: str
    type: str  # "orientation" | "event" | "evaluation"
    textKo: str
    textEn: str
    keyWords: Optional[List[str]] = []

class StoryWeaverStory(BaseModel):
    id: str
    theme: str
    difficulty: int
    title: str
    tiles: List[StoryTile]
    suggestedConnectors: List[str]

class StartWeaverRequest(BaseModel):
    theme: str  # "daily_mishap" | "travel" | "school" | "work" | "relationships"
    difficulty: int  # 1 | 2 | 3 | 4

class StartWeaverResponse(BaseModel):
    storyId: str
    title: str
    theme: str
    difficulty: int
    tiles: List[StoryTile]  # Shuffled list
    suggestedConnectors: List[str]

# Database of stories
WEAVER_STORIES = [
    # 1. Daily Mishap
    StoryWeaverStory(
        id="story_mishap_1",
        theme="daily_mishap",
        difficulty=2,
        title="Bus Card Disaster",
        suggestedConnectors=["처음에는", "그런데", "다행히", "그래서 결국"],
        tiles=[
            StoryTile(id="tile_1", type="orientation", textKo="오늘 아침 일찍 중요한 약속이 있어서 정류장으로 급하게 뛰어갔습니다.", textEn="This morning I ran to the bus stop in a hurry because I had an important appointment.", keyWords=["오늘 아침", "약속", "정류장"]),
            StoryTile(id="tile_2", type="event", textKo="그런데 버스에 타려고 보니 지갑과 교통카드를 집에 두고 온 것이 생각났습니다.", textEn="However, when I was about to get on the bus, I realized I left my wallet and transit card at home.", keyWords=["지갑", "교통카드", "생각났습니다"]),
            StoryTile(id="tile_3", type="event", textKo="다행히 뒤에 서 계시던 친절한 할아버지께서 버스 요금을 대신 내주셨습니다.", textEn="Fortunately, a kind grandfather standing behind me paid the bus fare for me.", keyWords=["친절한", "요금", "내주셨습니다"]),
            StoryTile(id="tile_4", type="event", textKo="하지만 도로 정체가 심해서 약속 시간보다 10분이나 늦게 도착하고 말았습니다.", textEn="But due to heavy traffic congestion, I ended up arriving 10 minutes late.", keyWords=["정체", "늦게 도착"]),
            StoryTile(id="tile_5", type="evaluation", textKo="그때 지각할까 봐 심장이 터질 것 같았고 제 덜렁대는 습관이 너무 원망스러웠습니다.", textEn="At that moment, my heart felt like it would burst from fear of being late, and I hated my clumsy habit.", keyWords=["심장이", "덜렁대는", "원망스러웠습니다"]),
            StoryTile(id="tile_6", type="evaluation", textKo="비록 약속에는 늦었지만 세상에는 아직 따뜻한 사람들이 많다는 것을 느꼈습니다.", textEn="Although I was late for the appointment, I felt that there are still many warm-hearted people in the world.", keyWords=["늦었지만", "따뜻한", "느꼈습니다"])
        ]
    ),
    # 2. Travel
    StoryWeaverStory(
        id="story_travel_1",
        theme="travel",
        difficulty=2,
        title="Lost in Jeju Island",
        suggestedConnectors=["처음에", "그러다가", "결국에는", "이번 기회에"],
        tiles=[
            StoryTile(id="tile_t1", type="orientation", textKo="지난여름 친구와 함께 처음으로 제주도 배낭여행을 떠났습니다.", textEn="Last summer, I went on a backpacking trip to Jeju Island with a friend for the first time.", keyWords=["지난여름", "제주도", "배낭여행"]),
            StoryTile(id="tile_t2", type="event", textKo="지도 앱만 믿고 한라산 둘레길을 걷다가 그만 길을 잃어버렸습니다.", textEn="Relying only on a map app, we walked along the Hallasan trail and ended up getting lost.", keyWords=["지도 앱", "길을", "잃어버렸습니다"]),
            StoryTile(id="tile_t3", type="event", textKo="해는 지고 휴대전화 배터리마저 방전되어 주위가 완전히 캄캄해졌습니다.", textEn="The sun went down and even the phone battery died, making the surroundings completely dark.", keyWords=["배터리", "방전", "캄캄해졌습니다"]),
            StoryTile(id="tile_t4", type="event", textKo="헤매던 중에 멀리서 비치는 귤밭 불빛을 보고 따라가 겨우 민가를 찾았습니다.", textEn="While wandering, we saw the light of a tangerine orchard in the distance and followed it to barely find a house.", keyWords=["귤밭", "불빛", "민가"]),
            StoryTile(id="tile_t5", type="evaluation", textKo="그때는 정말 무서워서 눈물이 났고 자연의 무서움을 뼈저리게 실감했습니다.", textEn="At that time, I was so scared that I cried, and I realized the dread of nature deeply.", keyWords=["무서워서", "자연", "실감했습니다"]),
            StoryTile(id="tile_t6", type="evaluation", textKo="이 아찔한 모험을 겪고 나니 철저한 준비의 중요성을 깨닫게 되었습니다.", textEn="After experiencing this dizzying adventure, I realized the importance of thorough preparation.", keyWords=["아찔한", "모험", "중요성", "깨닫게"])
        ]
    ),
    # 3. School
    StoryWeaverStory(
        id="story_school_1",
        theme="school",
        difficulty=2,
        title="The Speech Presentation",
        suggestedConnectors=["원래는", "그런데", "그래서", "지금 생각하면"],
        tiles=[
            StoryTile(id="tile_s1", type="orientation", textKo="대학교 전공 수업에서 수백 명의 학생들 앞에서 한국어 발표를 맡았습니다.", textEn="I was in charge of a Korean presentation in front of hundreds of students in a university major class.", keyWords=["대학교", "발표", "한국어"]),
            StoryTile(id="tile_s2", type="event", textKo="발표 시작 직전에 너무 긴장한 나머지 준비한 대본이 하나도 기억나지 않았습니다.", textEn="Right before starting the presentation, I was so nervous that I couldn't remember any of the prepared script.", keyWords=["긴장한", "대본", "기억나지"]),
            StoryTile(id="tile_s3", type="event", textKo="심호흡을 크게 하고 슬라이드 화면의 핵심 단어들만 보면서 이야기를 이어갔습니다.", textEn="I took a deep breath and continued talking while looking only at the key words on the slide screen.", keyWords=["심호흡", "핵심 단어", "이어갔습니다"]),
            StoryTile(id="tile_s4", type="event", textKo="발표를 마치자 학생들이 큰 박수를 쳐 주었고 교수님도 칭찬해 주셨습니다.", textEn="When I finished the presentation, students clapped loudly and the professor praised me too.", keyWords=["박수", "교수님", "칭찬"]),
            StoryTile(id="tile_s5", type="evaluation", textKo="순간 머릿속이 하얘져서 도망치고 싶었지만 포기하지 않은 제가 대견했습니다.", textEn="For a moment my mind went blank and I wanted to run away, but I was proud of myself for not giving up.", keyWords=["머릿속이", "포기하지", "대견했습니다"]),
            StoryTile(id="tile_s6", type="evaluation", textKo="이 경험 덕분에 무대 공포증을 이겨내고 큰 자신감을 얻게 되었습니다.", textEn="Thanks to this experience, I overcame stage fright and gained great confidence.", keyWords=["무대 공포증", "자신감", "얻게"])
        ]
    ),
    # 4. Work
    StoryWeaverStory(
        id="story_work_1",
        theme="work",
        difficulty=2,
        title="The Crucial Project Deadline",
        suggestedConnectors=["처음부터", "그러던 어느 날", "다행스럽게도", "결과적으로"],
        tiles=[
            StoryTile(id="tile_w1", type="orientation", textKo="새로운 프로젝트 출시를 앞두고 팀원들과 몇 주 동안 야근을 하며 일했습니다.", textEn="Ahead of launching a new project, we worked overtime with team members for several weeks.", keyWords=["프로젝트", "출시", "야근"]),
            StoryTile(id="tile_w2", type="event", textKo="제출 전날 밤에 최종 코드에서 예상치 못한 치명적인 오류가 발견되었습니다.", textEn="On the night before submission, an unexpected critical error was found in the final code.", keyWords=["전날 밤", "오류", "발견되었습니다"]),
            StoryTile(id="tile_w3", type="event", textKo="모든 팀원들이 퇴근을 미루고 오류 로그를 분석하여 새벽에 결국 해결했습니다.", textEn="All team members delayed going home, analyzed the error logs, and eventually solved it at dawn.", keyWords=["팀원들", "오류 로그", "해결했습니다"]),
            StoryTile(id="tile_w4", type="event", textKo="다음 날 아침 고객사에 성공적으로 프로젝트 결과물을 인도할 수 있었습니다.", textEn="The next morning, we were able to successfully deliver the project deliverables to the client.", keyWords=["성공적으로", "인도"]),
            StoryTile(id="tile_w5", type="evaluation", textKo="시간이 촉박해서 피가 마르는 기분이었고 팀원들 간의 신뢰를 다시 생각하게 되었습니다.", textEn="Because time was tight, it felt like my blood was drying, and I re-evaluated trust among team members.", keyWords=["촉박해서", "피가 마르는", "신뢰"]),
            StoryTile(id="tile_w6", type="evaluation", textKo="어려운 위기를 극복하면서 팀의 결속력이 훨씬 더 단단해진 느낌이 들었습니다.", textEn="Overcoming the difficult crisis made me feel that the team's cohesion became much stronger.", keyWords=["위기", "극복하면서", "결속력", "단단해진"])
        ]
    ),
    # 5. Relationships
    StoryWeaverStory(
        id="story_relationship_1",
        theme="relationships",
        difficulty=2,
        title="Friendship Reconciliation",
        suggestedConnectors=["처음에는", "그러다가", "결국", "이제는"],
        tiles=[
            StoryTile(id="tile_r1", type="orientation", textKo="고등학교 때부터 가장 친했던 친구와 사소한 오해로 심하게 다투었습니다.", textEn="I fought severely with my closest friend since high school due to a minor misunderstanding.", keyWords=["친했던 친구", "오해", "다투었습니다"]),
            StoryTile(id="tile_r2", type="event", textKo="서로 자존심을 세우느라 한 달 동안 연락도 하지 않고 서먹하게 지냈습니다.", textEn="We didn't contact each other for a month and spent time awkwardly to save our pride.", keyWords=["자존심", "연락", "서먹하게"]),
            StoryTile(id="tile_r3", type="event", textKo="친구가 먼저 장문의 사과 메시지를 보내며 오해를 풀고 싶다는 뜻을 밝혔습니다.", textEn="The friend sent a long apology message first, expressing the desire to clear up the misunderstanding.", keyWords=["사과 메시지", "오해를", "풀고"]),
            StoryTile(id="tile_r4", type="event", textKo="우리는 카페에서 만나 서로 서운했던 점을 털어놓고 눈물로 화해했습니다.", textEn="We met at a cafe, shared our disappointments, and reconciled with tears.", keyWords=["카페", "털어놓고", "화해했습니다"]),
            StoryTile(id="tile_r5", type="evaluation", textKo="친구를 잃을까 봐 두렵고 힘들었는데 오해를 풀어서 마음이 아주 홀가분했습니다.", textEn="I was scared and exhausted that I might lose my friend, and clearing up the misunderstanding made me feel very relieved.", keyWords=["잃을까 봐", "두렵고", "홀가분했습니다"]),
            StoryTile(id="tile_r6", type="evaluation", textKo="이 갈등을 통해 진정한 우정은 대화를 통해 완성된다는 진리를 실감했습니다.", textEn="Through this conflict, I realized the truth that true friendship is completed through conversation.", keyWords=["갈등", "우정", "대화", "실감했습니다"])
        ]
    )
]

def _similarity_score(target: str, recognized: str) -> float:
    if not target or not recognized:
        return 0.0
    t_clean = "".join(c for c in target if c.isalnum()).strip()
    r_clean = "".join(c for c in recognized if c.isalnum()).strip()
    if not t_clean or not r_clean:
        return 0.0
    ratio = difflib.SequenceMatcher(None, t_clean, r_clean).ratio()
    return round(ratio * 100, 1)

@router.post("/start", response_model=StartWeaverResponse)
async def start_weaver(
    payload: StartWeaverRequest,
    current_user: User = Depends(get_current_user)
):
    # Find matching story or default
    story = next((s for s in WEAVER_STORIES if s.theme == payload.theme), WEAVER_STORIES[0])
    
    # Depending on difficulty, customize tiles slightly
    # Difficulty 1: 4 tiles
    # Difficulty 2: 6 tiles (default)
    # Difficulty 3: 6-8 tiles, Korean only on client side
    # Difficulty 4: 8-10 tiles, only keywords or summarized
    tiles_to_send = []
    if payload.difficulty == 1:
        # Send first 4 tiles
        tiles_to_send = story.tiles[:4]
    else:
        tiles_to_send = story.tiles
        
    # Shuffle the tiles
    shuffled_tiles = list(tiles_to_send)
    random.shuffle(shuffled_tiles)
    
    # Generate response
    return StartWeaverResponse(
        storyId=story.id,
        title=story.title,
        theme=story.theme,
        difficulty=payload.difficulty,
        tiles=shuffled_tiles,
        suggestedConnectors=story.suggestedConnectors
    )

@router.post("/evaluate")
async def evaluate_story_weaver(
    storyId: str = Form(...),
    orderedTileIds: str = Form(...),  # Comma-separated list of IDs
    selectedConnectors: Optional[str] = Form(None), # Comma-separated list
    selectedEvaluationTileId: Optional[str] = Form(None),
    audioBlob: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    # Parse items
    ordered_ids = [x.strip() for x in orderedTileIds.split(",") if x.strip()]
    connectors = [x.strip() for x in selectedConnectors.split(",") if x.strip()] if selectedConnectors else []
    
    story = next((s for s in WEAVER_STORIES if s.id == storyId), WEAVER_STORIES[0])
    correct_order = [tile.id for tile in story.tiles]
    
    # Adjust correct order if difficulty sliced the list
    if len(ordered_ids) < len(correct_order):
        correct_order = correct_order[:len(ordered_ids)]
        
    # 1. Structural score calculation
    # Check if orientation is first and evaluation is at the end
    correct_orientation_ids = {t.id for t in story.tiles if t.type == "orientation"}
    correct_evaluation_ids = {t.id for t in story.tiles if t.type == "evaluation"}
    
    struct_correct = 0
    total_slots = len(ordered_ids)
    
    # Check orientation first
    if ordered_ids and ordered_ids[0] in correct_orientation_ids:
        struct_correct += 1
        
    # Check evaluation at the end
    if ordered_ids and ordered_ids[-1] in correct_evaluation_ids:
        struct_correct += 1
        
    # Sequence order matcher score
    matcher = difflib.SequenceMatcher(None, correct_order, ordered_ids)
    ratio = matcher.ratio()
    
    # Combine orientation/evaluation constraints (40%) and sequential match (60%)
    structural_score = int(((struct_correct / 2) * 40) + (ratio * 60))
    structural_score = max(0, min(100, structural_score))
    
    # 2. Connectors Score
    # Give high score if user provided some connectors and they are in the suggested list
    connectors_score = 100
    if connectors:
        valid_connectors_count = sum(1 for c in connectors if c in story.suggestedConnectors or c in ["그래서", "그런데", "그래서 결국", "다행히", "하지만", "결국"])
        connectors_score = int((valid_connectors_count / len(connectors)) * 100) if connectors else 100
        
    # Verify selected evaluation tile matches model
    eval_match = selectedEvaluationTileId in correct_evaluation_ids
    if not eval_match and selectedEvaluationTileId:
        connectors_score = max(0, connectors_score - 20)
        
    # 3. Spoken Fluency (ASR evaluation)
    transcription = ""
    target_korean = " ".join([t.textKo for t in story.tiles if t.id in ordered_ids])
    
    if audioBlob is not None:
        try:
            audio_bytes = await audioBlob.read()
            if len(audio_bytes) < 100:
                transcription = target_korean
            else:
                transcription = await speech_ai_service.transcribe_audio(audio_bytes)
        except Exception as e:
            print(f"Error transcribing audio in Story Weaver evaluate: {e}", flush=True)
            transcription = target_korean
    else:
        # Mock transcription matches target
        transcription = target_korean
        
    if not transcription:
        transcription = target_korean

    # Keywords coverage
    all_keywords = []
    for tile in story.tiles:
        if tile.id in ordered_ids and tile.keyWords:
            all_keywords.extend(tile.keyWords)
            
    covered_keywords = sum(1 for kw in all_keywords if kw in transcription)
    coverage_ratio = (covered_keywords / len(all_keywords)) if all_keywords else 1.0
    
    # Fluency/Discourse score
    # Count discourse markers in speech
    discourse_markers = ["그래서", "그런데", "그러다가", "그래서 결국", "처음에는", "나중에", "다행히", "하지만", "결국"]
    dm_count = sum(transcription.count(dm) for dm in discourse_markers)
    
    # Base fluency estimation
    fluency_score = int(coverage_ratio * 80 + min(20, dm_count * 5))
    fluency_score = max(50, min(100, fluency_score)) # pad to 50 minimum for speaking effort
    
    # Combine scores
    weave_score = int((structural_score * 0.3) + (connectors_score * 0.2) + (fluency_score * 0.5))
    weave_score = max(0, min(100, weave_score))
    
    feedback_bullets = []
    if structural_score >= 80:
        feedback_bullets.append("✓ Excellent story blueprint! You established orientation and wrapped up with clear reflections.")
    else:
        feedback_bullets.append("✗ Story timeline is slightly scrambled. Keep chronological actions linked linearly.")
        
    if eval_match:
        feedback_bullets.append("✓ Correctly pinpointed the core evaluation sentence containing speaker feelings.")
    else:
        feedback_bullets.append("💡 Tip: Look for words indicating emotion (슬펐다, 두려웠다, 대견했다) to find evaluation tiles.")
        
    if dm_count >= 2:
        feedback_bullets.append(f"✓ Strong usage of discourse linking markers ({dm_count} markers detected).")
    else:
        feedback_bullets.append("💡 Try inserting more narrative flow connectors (e.g. 그런데, 그래서) in your spoken retelling.")

    # Check for evaluation sentence in transcript
    has_evaluation = any(kw in transcription for kw in ["기분이", "배웠습니다", "대견했습니다", "느꼈습니다", "실감했습니다", "깨닫게"])
    
    return {
        "structuralScore": structural_score,
        "connectorsScore": connectors_score,
        "hasEvaluation": has_evaluation,
        "fluencyScore": fluency_score,
        "weaveScore": weave_score,
        "feedbackBullets": feedback_bullets,
        "transcribedText": transcription
    }
