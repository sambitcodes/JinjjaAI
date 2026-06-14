PHASE_4_DATA = {
    "title": "Korean 2.4 – Future Plans & Schedules",
    "topic": "Future Plans & Schedules",
    "description": "Say what you’re going to do tomorrow, this weekend, and next week.",
    "estimated_time": "25–30 minutes",
    "goals": [
        "Use simple future/plan expressions for everyday activities",
        "Talk about plans for tomorrow or this weekend in a few sentences",
        "Understand short descriptions of someone’s plans"
    ],
    "prerequisites": "Korean 2.3 – Talking About Yesterday",
    "status": "locked",
    "content_markdown": (
        "# Korean 2.4 – Future Plans & Schedules\n\n"
        "### Talking About the Future\n"
        "To describe your near-future plans (tomorrow, this weekend), Korean commonly uses the polite plan ending **~(으)ㄹ 거예요 (~[eu]l geo-yeo-yo)**.\n\n"
        "### Conjugation Rules:\n"
        "- Verb stems ending in a vowel: Add **~ㄹ 거예요** (e.g. 가다 -> 갈 거예요).\n"
        "- Verb stems ending in a consonant: Add **~을 거예요** (e.g. 먹다 -> 먹을 거예요).\n"
        "- To express intentions or active plans, you can also use **~(으)려고 해요 (~[eu]ryeo-go hae-yo)**, meaning 'I plan/intend to'.\n\n"
        "### Future Time Adverbs:\n"
        "- **내일 (nae-il):** tomorrow\n"
        "- **이번 주말 (i-beon ju-mal):** this weekend\n"
        "- **다음 주 (da-eum ju):** next week\n"
        "- **나중에 (na-jung-e):** later"
    ),
    "plan_patterns": [
        {"id": "pat_will", "korean": "을/ㄹ 거예요", "romanization": "eul/l geo-yeo-yo", "english": "I will / I am going to", "note": "Basic future plan statement."},
        {"id": "pat_intend", "korean": "으려고/려고 해요", "romanization": "eu-ryeo-go/ryeo-go hae-yo", "english": "I intend to / plan to", "note": "Expresses intention."}
    ],
    "future_time_expressions": [
        {"ko": "내일", "en": "tomorrow"},
        {"ko": "모레", "en": "the day after tomorrow"},
        {"ko": "이번 주말", "en": "this weekend"},
        {"ko": "다음 주말", "en": "next weekend"},
        {"ko": "다음 주", "en": "next week"},
        {"ko": "오늘 밤", "en": "tonight"},
        {"ko": "나중에", "en": "later today"}
    ],
    "example_plan_paragraphs": [
        {
            "id": "ex_plan_1",
            "ko": "내일 저는 친구를 만날 거예요. 우리는 같이 점심을 먹으려고 해요. 그리고 다음 주말에 가족을 보러 갈 거예요.",
            "en": "Tomorrow I will meet a friend. We plan to eat lunch together. And next weekend I will go to see my family."
        }
    ],
    "listening_items": [
        {
            "id": "lis_plans_1",
            "audio_text": "내일 저는 아침에 도서관에 갈 거예요. 도서관에서 한국어를 공부하려고 해요. 그리고 저녁에 친구랑 영화를 볼 거예요.",
            "options": [
                {"id": "opt_plans1_1", "text": "They will study Korean at the library tomorrow and watch a movie with a friend in the evening.", "correct": True},
                {"id": "opt_plans1_2", "text": "They plan to work at the office all day tomorrow.", "correct": False},
                {"id": "opt_plans1_3", "text": "They will go on a trip with their family this weekend.", "correct": False}
            ],
            "correct_id": "opt_plans1_1",
            "detail_questions": [
                {
                    "question": "Where are they going tomorrow morning?",
                    "options": ["Library (도서관)", "School (학교)", "Office (회사)"],
                    "correct_answer": "Library (도서관)",
                    "explanation": "They said '도서관에 갈 거예요' which means going to the library."
                },
                {
                    "question": "What are they going to do in the evening?",
                    "options": ["Eat dinner", "Watch a movie with a friend", "Read a book"],
                    "correct_answer": "Watch a movie with a friend",
                    "explanation": "They said '저녁에 친구랑 영화를 볼 거예요' which means watch a movie with a friend in the evening."
                }
            ]
        }
    ],
    "builder_options": {
        "horizons": [
            {
                "id": "horizon_tomorrow",
                "name": "Tomorrow",
                "activities": [
                    {"ko": "도서관에 가다", "future_ko": "도서관에 갈 거예요", "en": "go to the library"},
                    {"ko": "한국어를 공부하다", "future_ko": "한국어를 공부할 거예요", "en": "study Korean"},
                    {"ko": "회사에서 일하다", "future_ko": "회사에서 일할 거예요", "en": "work at the office"}
                ]
            },
            {
                "id": "horizon_weekend",
                "name": "This weekend",
                "activities": [
                    {"ko": "친구를 만나다", "future_ko": "친구를 만날 거예요", "en": "meet a friend"},
                    {"ko": "영화관에 가다", "future_ko": "영화관에 갈 거예요", "en": "go to the movie theater"},
                    {"ko": "집에서 쉬다", "future_ko": "집에서 쉴 거예요", "en": "rest at home"}
                ]
            },
            {
                "id": "horizon_nextweek",
                "name": "Next week",
                "activities": [
                    {"ko": "여행을 가다", "future_ko": "여행을 갈 거예요", "en": "go on a trip"},
                    {"ko": "가족을 방문하다", "future_ko": "가족을 방문하려고 해요", "en": "visit family"},
                    {"ko": "새 책을 읽다", "future_ko": "새 책을 읽으려고 해요", "en": "read a new book"}
                ]
            }
        ],
        "reasons": [
            {"ko": "재미있기 때문에", "en": "because it's fun"},
            {"ko": "피곤하기 때문에", "en": "because I'm tired"},
            {"ko": "시험이 있기 때문에", "en": "because I have an exam"},
            {"ko": "한국어를 좋아하기 때문에", "en": "because I like Korean"}
        ]
    },
    "quiz": [
        {
            "id": "q_plan_1",
            "type": "listening",
            "question": "Listen to the future plans and select what they will do tomorrow:",
            "audio_text": "내일 저는 친구를 만날 거예요.",
            "options": [
                "Meet a friend.",
                "Study at the library.",
                "Work at the office."
            ],
            "correct_answer": "Meet a friend.",
            "explanation": "친구를 만날 거예요 means 'will meet a friend'."
        },
        {
            "id": "q_plan_2",
            "type": "context",
            "question": "Select the correct Korean time expression for: 'this weekend'",
            "options": [
                "이번 주말",
                "다음 주말",
                "다음 주"
            ],
            "correct_answer": "이번 주말",
            "explanation": "이번 주말 means 'this weekend'."
        },
        {
            "id": "q_plan_3",
            "type": "choice",
            "question": "Choose the correct Korean sentence for: 'I plan to study Korean next week.'",
            "options": [
                "다음 주에 한국어를 공부하려고 해요.",
                "어제 한국어를 공부했어요.",
                "오늘 한국어를 공부해요."
            ],
            "correct_answer": "다음 주에 한국어를 공부하려고 해요.",
            "explanation": "공부하려고 해요 represents 'I plan to study'."
        },
        {
            "id": "q_plan_4",
            "type": "choice",
            "question": "Conjugate '가다' (to go) into the simple plan future tense:",
            "options": [
                "갈 거예요",
                "갔어요",
                "가요"
            ],
            "correct_answer": "갈 거예요",
            "explanation": "가다 stem ending in vowel + ㄹ 거예요 -> 갈 거예요."
        },
        {
            "id": "q_plan_5",
            "type": "choice",
            "question": "What is the best response to: '내일 뭐 할 거예요?' (What are you going to do tomorrow?)",
            "options": [
                "내일 도서관에 갈 거예요.",
                "어제 영화를 봤어요.",
                "지금 공부하고 있어요."
            ],
            "correct_answer": "내일 도서관에 갈 거예요.",
            "explanation": "The question is in the future tense ('뭐 할 거예요?'), so the answer must also be in the future tense."
        }
    ],
    "homework": [
        {"id": "hw_plan_1", "text": "Write 4–6 Korean sentences about your plans for tomorrow and this weekend. Include at least one time expression ('tomorrow', 'this weekend') and one plan pattern."},
        {"id": "hw_plan_2", "text": "Add 1–2 simple reasons to your plans (e.g., 'because it’s fun', 'because I need to study')."},
        {"id": "hw_plan_3", "text": "Record yourself explaining your plans, and listen back."}
    ]
}
