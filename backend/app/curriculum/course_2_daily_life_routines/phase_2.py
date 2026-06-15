PHASE_2_DATA = {
    "title": "Korean 2.2 – Habits, Likes & Dislikes",
    "topic": "Habits, Likes & Dislikes",
    "description": "Talk about what you like doing, how often, and why.",
    "estimated_time": "25–30 minutes",
    "goals": [
        "Express likes, dislikes, and simple preferences about daily activities",
        "Combine habits with frequency words from Phase 1",
        "Understand simple conversations about hobbies and interests"
    ],
    "prerequisites": "Korean 2.1 – Longer Routines & Time Expressions",
    "status": "locked",
    "content_markdown": (
        "# Korean 2.2 – Habits, Likes & Dislikes\n\n"
        "### Expressing Preferences\n"
        "At A2, you should be able to say what you like or don't like doing, how often you do it, and give short reasons.\n\n"
        "### Core Preference Patterns (Frames):\n"
        "- **[Noun]을/를 좋아해요 (jo-a-hae-yo):** I like [Noun].\n"
        "- **[Noun]을/를 안 좋아해요 (an jo-a-hae-yo):** I don't like [Noun].\n"
        "- **[Noun]을/를 정말 좋아해요 (jeong-mal jo-a-hae-yo):** I really like [Noun].\n"
        "- **[Noun]을/를 별로 안 좋아해요 (byeol-lo an jo-a-hae-yo):** I don't like [Noun] very much.\n\n"
        "### Asking Questions:\n"
        "- **[Noun]을/를 좋아해요? (jo-a-hae-yo?):** Do you like [Noun]?\n\n"
        "### Giving Simple Reasons:\n"
        "Use **~기 때문에 (~gi ttae-mun-e)** or simpler present connectors like **재미있기 때문에 (because it's fun)** to explain your likes/dislikes."
    ),
    "preference_patterns": [
        {"id": "pp_like", "korean": "을/를 좋아해요", "romanization": "eul/reul jo-a-hae-yo", "english": "I like [noun]", "note": "Standard polite preference."},
        {"id": "pp_dislike", "korean": "을/를 안 좋아해요", "romanization": "eul/reul an jo-a-hae-yo", "english": "I don't like [noun]", "note": "Standard negative preference."},
        {"id": "pp_really_like", "korean": "을/를 정말 좋아해요", "romanization": "eul/reul jeong-mal jo-a-hae-yo", "english": "I really like [noun]", "note": "Emphasized preference."},
        {"id": "pp_not_much", "korean": "을/를 별로 안 좋아해요", "romanization": "eul/reul byeol-lo an jo-a-hae-yo", "english": "I don't like [noun] much", "note": "Softened negative preference."}
    ],
    "example_monologues": [
        {
            "id": "ex_mono_1",
            "ko": "저는 한국 드라마를 정말 좋아해요. 그래서 자주 봐요. 하지만 축구는 별로 안 좋아해요. 재미가 없기 때문이에요.",
            "en": "I really like Korean dramas. So, I watch them often. But I don't like soccer very much because it's not fun."
        }
    ],
    "listening_items": [
        {
            "id": "lis_pref_1",
            "audio_text": "저는 음악을 정말 좋아해요. 그래서 매일 들어요. 하지만 요리는 안 좋아해요. 피곤해요.",
            "type": "like/dislike",
            "options": [
                {"id": "opt_pref1_1", "text": "They like music but don't like cooking.", "correct": True},
                {"id": "opt_pref1_2", "text": "They like cooking but don't like music.", "correct": False},
                {"id": "opt_pref1_3", "text": "They don't like music and never listen to it.", "correct": False}
            ],
            "correct_id": "opt_pref1_1"
        },
        {
            "id": "lis_pref_2",
            "audio_text": "저는 주말에 자주 축구를 해요. 축구를 아주 좋아해요.",
            "type": "hobby",
            "options": [
                {"id": "opt_pref2_1", "text": "Playing soccer (축구)", "correct": True},
                {"id": "opt_pref2_2", "text": "Watching dramas (드라마 보기)", "correct": False},
                {"id": "opt_pref2_3", "text": "Cooking at home (요리)", "correct": False}
            ],
            "correct_id": "opt_pref2_1"
        }
    ],
    "builder_options": {
        "categories": [
            {
                "id": "cat_food",
                "name": "Food & drink",
                "activities": [
                    {"ko": "김치", "en": "Kimchi"},
                    {"ko": "커피", "en": "Coffee"},
                    {"ko": "불고기", "en": "Bulgogi"}
                ]
            },
            {
                "id": "cat_hobbies",
                "name": "Hobbies",
                "activities": [
                    {"ko": "한국 드라마 보기", "en": "watching Korean dramas"},
                    {"ko": "책 읽기", "en": "reading books"},
                    {"ko": "요리하기", "en": "cooking"}
                ]
            },
            {
                "id": "cat_sports",
                "name": "Sports",
                "activities": [
                    {"ko": "축구", "en": "soccer"},
                    {"ko": "태권도", "en": "Taekwondo"},
                    {"ko": "야구", "en": "baseball"}
                ]
            }
        ],
        "reasons": [
            {"ko": "재미있기 때문에", "en": "because it's fun"},
            {"ko": "바쁘기 때문에", "en": "because I am busy"},
            {"ko": "어렵기 때문에", "en": "because it's difficult"},
            {"ko": "피곤하기 때문에", "en": "because I am tired"}
        ]
    },
    "quiz": [
        {
            "id": "q_pref_1",
            "type": "context",
            "question": "Choose the correct Korean sentence for: 'I don't like coffee much.'",
            "options": [
                "커피를 별로 안 좋아해요.",
                "커피를 정말 좋아해요.",
                "커피를 좋아해요."
            ],
            "correct_answer": "커피를 별로 안 좋아해요.",
            "explanation": "별로 안 좋아해요 represents 'don't like much / not very much'."
        },
        {
            "id": "q_pref_2",
            "type": "listening",
            "question": "Listen to the sentiment and choose whether they like or dislike the activity:",
            "audio_text": "저는 요리를 정말 좋아해요",
            "options": [
                "Like",
                "Dislike"
            ],
            "correct_answer": "Like",
            "explanation": "정말 좋아해요 means 'really like'."
        },
        {
            "id": "q_pref_3",
            "type": "context",
            "question": "Complete the sentence with the correct reason connector: '축구가 [ ] 때문에 자주 해요.' (because it's fun)",
            "options": [
                "재미있기",
                "피곤하기",
                "어렵기"
            ],
            "correct_answer": "재미있기",
            "explanation": "재미있기 때문에 means 'because it is fun/interesting'."
        },
        {
            "id": "q_pref_4",
            "type": "writing",
            "question": "Type the Korean word meaning 'really':",
            "correct_answer": "정말",
            "explanation": "정말 is the adverb meaning 'really' or 'very' in Korean."
        }
    ],
    "homework": [
        {"id": "hw_pref_1", "text": "Write 4-5 Korean sentences stating your hobbies and one thing you don't like doing."},
        {"id": "hw_pref_2", "text": "Write reasons for one hobby you like and one activity you dislike in Korean."},
        {"id": "hw_pref_3", "text": "Record your voice talking for 30 seconds about your likes/dislikes."}
    ]
}
