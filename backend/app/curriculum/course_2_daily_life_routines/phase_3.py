PHASE_3_DATA = {
    "title": "Korean 2.3 – Talking About Yesterday",
    "topic": "Talking About Yesterday",
    "description": "Describe what you did yesterday and last weekend.",
    "estimated_time": "25–30 minutes",
    "goals": [
        "Use simple past tense for familiar daily verbs",
        "Talk about yesterday’s activities in short paragraphs",
        "Understand short stories about someone’s day in the past"
    ],
    "prerequisites": "Korean 2.2 – Habits, Likes & Dislikes",
    "status": "locked",
    "content_markdown": (
        "# Korean 2.3 – Talking About Yesterday\n\n"
        "### Talking About the Past\n"
        "To describe what you did yesterday or last weekend, you need the polite past tense ending **~았어요/었어요 (~ass-eo-yo / eoss-eo-yo)**.\n\n"
        "### How it Works (Past Tense Rule):\n"
        "- If the verb stem ends in vowels **ㅏ (a)** or **ㅗ (o)**, add **~았어요** (e.g. 가다 -> 갔어요).\n"
        "- For other vowels, add **~었어요** (e.g. 먹다 -> 먹었어요).\n"
        "- Verbs ending in **하다** change to **했어요** (e.g. 공부하다 -> 공부했어요).\n\n"
        "### Past Time Adverbs:\n"
        "- **어제 (eo-je):** yesterday\n"
        "- **지난 주말 (ji-nan ju-mal):** last weekend\n"
        "- **어젯밤 (eo-jet-bam):** last night\n"
        "- **지난주 (ji-nan-ju):** last week"
    ),
    "past_verbs": [
        {"dictionary": "일어나다", "present": "일어나요", "past": "일어났어요", "romanization": "il-eo-nass-eo-yo", "english": "woke up / got up"},
        {"dictionary": "가다", "present": "가요", "past": "갔어요", "romanization": "gass-eo-yo", "english": "went"},
        {"dictionary": "먹다", "present": "먹어요", "past": "먹었어요", "romanization": "meog-eoss-eo-yo", "english": "ate"},
        {"dictionary": "공부하다", "present": "공부해요", "past": "공부했어요", "romanization": "gong-bu-haess-eo-yo", "english": "studied"},
        {"dictionary": "일하다", "present": "일해요", "past": "일했어요", "romanization": "il-haess-eo-yo", "english": "worked"},
        {"dictionary": "만나다", "present": "만나요", "past": "만났어요", "romanization": "man-nass-eo-yo", "english": "met"},
        {"dictionary": "보다", "present": "봐요", "past": "봤어요", "romanization": "bwas-seoyo", "english": "watched / saw"},
        {"dictionary": "자다", "present": "자요", "past": "잤어요", "romanization": "jass-eo-yo", "english": "slept / went to bed"},
        {"dictionary": "쉬다", "present": "쉬어요", "past": "쉬었어요", "romanization": "swi-eoss-eo-yo", "english": "rested"}
    ],
    "past_time_expressions": [
        {"ko": "어제", "en": "yesterday"},
        {"ko": "지난 주말", "en": "last weekend"},
        {"ko": "어젯밤", "en": "last night"},
        {"ko": "어제 아침", "en": "yesterday morning"},
        {"ko": "어제 오후", "en": "yesterday afternoon"},
        {"ko": "어제 저녁", "en": "yesterday evening"},
        {"ko": "지난주", "en": "last week"}
    ],
    "example_past_routines": [
        {
            "id": "ex_past_1",
            "ko": "어제 저는 아침 일찍 일어났어요. 그리고 학교에 갔어요. 오후에 친구를 만났어요. 우리는 영화를 봤어요. 밤에 일찍 잤어요.",
            "en": "Yesterday I woke up early in the morning. And I went to school. In the afternoon I met a friend. We watched a movie. At night I went to sleep early."
        }
    ],
    "listening_items": [
        {
            "id": "lis_past_1",
            "audio_text": "어제 저는 7시에 일어났어요. 아침을 먹고 회사에 갔어요. 회사에서 열심히 일했어요. 저녁에 집에 와서 쉬었어요.",
            "options": [
                {"id": "opt_past1_1", "text": "They woke up at 7, went to work, and rested at home in the evening.", "correct": True},
                {"id": "opt_past1_2", "text": "They stayed home all day yesterday and slept.", "correct": False},
                {"id": "opt_past1_3", "text": "They met a friend at 7 and watched a movie at a cafe.", "correct": False}
            ],
            "correct_id": "opt_past1_1",
            "detail_questions": [
                {
                    "question": "What time did they wake up yesterday?",
                    "options": ["6:00 AM", "7:00 AM", "8:00 AM"],
                    "correct_answer": "7:00 AM",
                    "explanation": "They said '7시에 일어났어요' which means woke up at 7 o'clock."
                },
                {
                    "question": "What did they do in the evening?",
                    "options": ["Met a friend", "Went to the office", "Came home and rested"],
                    "correct_answer": "Came home and rested",
                    "explanation": "They said '저녁에 집에 와서 쉬었어요' which means came home and rested in the evening."
                }
            ]
        }
    ],
    "builder_options": {
        "morning": [
            {"ko": "아침 일찍 일어났다", "past_ko": "아침 일찍 일어났어요", "en": "woke up early in the morning"},
            {"ko": "아침 식사를 했다", "past_ko": "아침 식사를 했어요", "en": "had breakfast"},
            {"ko": "공원에 갔다", "past_ko": "공원에 갔어요", "en": "went to the park"}
        ],
        "day": [
            {"ko": "학교에서 공부했다", "past_ko": "학교에서 공부했어요", "en": "studied at school"},
            {"ko": "회사에서 일했다", "past_ko": "회사에서 일했어요", "en": "worked at the office"},
            {"ko": "카페에서 친구를 만났다", "past_ko": "카페에서 친구를 만났어요", "en": "met a friend at a cafe"}
        ],
        "evening": [
            {"ko": "집에서 음악을 들었다", "past_ko": "집에서 음악을 들었어요", "en": "listened to music at home"},
            {"ko": "영화를 봤다", "past_ko": "영화를 봤어요", "en": "watched a movie"},
            {"ko": "일찍 잤다", "past_ko": "일찍 잤어요", "en": "went to sleep early"}
        ]
    },
    "transform_drills": [
        {
            "id": "trans_1",
            "present": "저는 매일 공부해요.",
            "options": [
                "저는 어제 공부했어요.",
                "저는 어제 공부해요.",
                "저는 어제 공부할 거예요."
            ],
            "correct_answer": "저는 어제 공부했어요.",
            "explanation": "공부해요 (study) changes to 공부했어요 (studied) in the past tense."
        },
        {
            "id": "trans_2",
            "present": "친구를 만나요.",
            "options": [
                "친구를 만났어요.",
                "친구를 만나요.",
                "친구를 만나겠어요."
            ],
            "correct_answer": "친구를 만났어요.",
            "explanation": "만나요 (meet) changes to 만났어요 (met) in the past tense."
        },
        {
            "id": "trans_3",
            "present": "오늘 커피를 마셔요.",
            "options": [
                "어제 커피를 마셨어요.",
                "어제 커피를 마셔요.",
                "어제 커피를 마실 거예요."
            ],
            "correct_answer": "어제 커피를 마셨어요.",
            "explanation": "마셔요 (drink) changes to 마셨어요 (drank) in the past tense."
        }
    ],
    "quiz": [
        {
            "id": "q_past_1",
            "type": "listening",
            "question": "Listen to the description of yesterday. What did they do?",
            "audio_text": "어제 저는 영화를 봤어요.",
            "options": [
                "They watched a movie.",
                "They read a book.",
                "They worked at the office."
            ],
            "correct_answer": "They watched a movie.",
            "explanation": "영화를 봤어요 means 'watched a movie'."
        },
        {
            "id": "q_past_2",
            "type": "context",
            "question": "Select the correct past time phrase for: 'last weekend'",
            "options": [
                "지난 주말",
                "어젯밤",
                "어제 오후"
            ],
            "correct_answer": "지난 주말",
            "explanation": "지난 주말 literally means 'last weekend'."
        },
        {
            "id": "q_past_3",
            "type": "choice",
            "question": "Which sentence refers to a past activity?",
            "options": [
                "어제 친구를 만났어요.",
                "오늘 친구를 만나요.",
                "내일 친구를 만날 거예요."
            ],
            "correct_answer": "어제 친구를 만났어요.",
            "explanation": "만났어요 is the past tense form of 만나요."
        },
        {
            "id": "q_past_4",
            "type": "choice",
            "question": "Transform '회사에서 일해요' to the past tense:",
            "options": [
                "회사에서 일했어요.",
                "회사에서 일해요.",
                "회사에서 일하겠어요."
            ],
            "correct_answer": "회사에서 일했어요.",
            "explanation": "일해요 (work) becomes 일했어요 (worked) in the past tense."
        },
        {
            "id": "q_past_5",
            "type": "choice",
            "question": "Choose the correct translation for 'Yesterday I woke up early':",
            "options": [
                "어제 일찍 일어났어요.",
                "오늘 일찍 일어나요.",
                "어제 늦게 잤어요."
            ],
            "correct_answer": "어제 일찍 일어났어요.",
            "explanation": "일찍 means early and 일어났어요 means woke up."
        }
    ],
    "homework": [
        {"id": "hw_past_1", "text": "Write 4–6 sentences in Korean about what you did yesterday (or last weekend). Include at least two different past‑tense verbs and one time expression."},
        {"id": "hw_past_2", "text": "Record yourself telling your 'yesterday' story from memory and listen to your recording."},
        {"id": "hw_past_3", "text": "Write a short comparison: 'On weekdays I usually work, but yesterday I rested' using present vs past forms."}
    ]
}
