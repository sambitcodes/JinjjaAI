PHASE_5_DATA = {
    "title": "Korean 2.5 – Daily Life Stories (Past–Present–Future)",
    "topic": "Daily Life Stories",
    "description": "Tell short stories about your life across yesterday, today, and tomorrow.",
    "estimated_time": "25–30 minutes",
    "goals": [
        "Combine past, present, and future sentences about daily life",
        "Describe your week in simple, connected sentences",
        "Understand short stories about someone’s past, present, and future plans"
    ],
    "prerequisites": "Korean 2.4 – Future Plans & Schedules",
    "status": "locked",
    "content_markdown": (
        "# Korean 2.5 – Daily Life Stories (Past–Present–Future)\n\n"
        "### Linking Yesterday, Today, and Tomorrow\n"
        "At the A2 level, you should be able to tell short stories about your life that cross tenses seamlessly. Let's learn to string together simple past routines, present routines/feelings, and future plans.\n\n"
        "### Three-Part Story Frame:\n"
        "1. **Past Anchor (Yesterday / Last Weekend):** 어제 / 지난 주말에\n"
        "2. **Present Anchor (Today / These Days):** 오늘 / 요즘에\n"
        "3. **Future Anchor (Tomorrow / Next Week):** 내일 / 다음 주에\n\n"
        "### Story Example:\n"
        "- **어제** 친구를 만났어요. **오늘** 회사에서 일해요. **내일** 집에서 쉴 거예요."
    ),
    "time_anchors": [
        {"ko": "어제", "en": "yesterday", "type": "past"},
        {"ko": "지난 주말", "en": "last weekend", "type": "past"},
        {"ko": "오늘", "en": "today", "type": "present"},
        {"ko": "요즘", "en": "these days / nowadays", "type": "present"},
        {"ko": "내일", "en": "tomorrow", "type": "future"},
        {"ko": "이번 주말", "en": "this weekend", "type": "future"},
        {"ko": "다음 주", "en": "next week", "type": "future"}
    ],
    "story_examples": [
        {
            "id": "ex_story_1",
            "ko": "지난 주말에 저는 집에서 푹 쉬었어요. 오늘 바빠요. 회사에서 일해요. 다음 주에 친구랑 여행을 갈 거예요.",
            "en": "Last weekend I rested well at home. Today I am busy. I work at the office. Next week I will go on a trip with a friend."
        }
    ],
    "listening_items": [
        {
            "id": "lis_stories_1",
            "audio_text": "어제 저는 한국 음식을 먹었어요. 오늘 도서관에서 공부해요. 내일 친구를 만날 거예요.",
            "options": [
                {"id": "opt_stories1_1", "text": "A story about eating Korean food yesterday, studying at the library today, and meeting a friend tomorrow.", "correct": True},
                {"id": "opt_stories1_2", "text": "A story about going on a trip last weekend and working today.", "correct": False},
                {"id": "opt_stories1_3", "text": "A story about watching a movie yesterday and resting at home tomorrow.", "correct": False}
            ],
            "correct_id": "opt_stories1_1",
            "timeline_questions": [
                {
                    "question": "What did they do yesterday?",
                    "options": ["Ate Korean food", "Studied at library", "Met a friend"],
                    "correct_answer": "Ate Korean food",
                    "explanation": "They said '어제 저는 한국 음식을 먹었어요' which means they ate Korean food yesterday."
                },
                {
                    "question": "What will they do tomorrow?",
                    "options": ["Study", "Rest", "Meet a friend"],
                    "correct_answer": "Meet a friend",
                    "explanation": "They said '내일 친구를 만날 거예요' which means they will meet a friend tomorrow."
                }
            ]
        }
    ],
    "builder_options": {
        "anchors": {
            "past": ["어제", "지난 주말에"],
            "present": ["오늘", "요즘에"],
            "future": ["내일", "이번 주말에", "다음 주에"]
        },
        "activities": {
            "past": [
                {"ko": "집에서 푹 쉬었다", "past_ko": "집에서 푹 쉬었어요", "en": "rested well at home"},
                {"ko": "친구를 만났다", "past_ko": "친구를 만났어요", "en": "met a friend"},
                {"ko": "한국 음식을 먹었다", "past_ko": "한국 음식을 먹었어요", "en": "ate Korean food"}
            ],
            "present": [
                {"ko": "도서관에서 공부한다", "present_ko": "도서관에서 공부해요", "en": "study at the library"},
                {"ko": "회사에서 일한다", "present_ko": "회사에서 일해요", "en": "work at the office"},
                {"ko": "집에서 음악을 듣는다", "present_ko": "집에서 음악을 들어요", "en": "listen to music at home"}
            ],
            "future": [
                {"ko": "영화를 볼 것이다", "future_ko": "영화를 볼 거예요", "en": "will watch a movie"},
                {"ko": "여행을 갈 것이다", "future_ko": "여행을 갈 거예요", "en": "will go on a trip"},
                {"ko": "집에서 청소를 할 것이다", "future_ko": "집에서 청소를 할 거예요", "en": "will clean the house"}
            ]
        }
    },
    "quiz": [
        {
            "id": "q_story_1",
            "type": "listening",
            "question": "Listen to the daily story. What do they do today?",
            "audio_text": "오늘 도서관에서 공부해요.",
            "options": [
                "Study at the library.",
                "Eat Korean food.",
                "Go on a trip."
            ],
            "correct_answer": "Study at the library.",
            "explanation": "오늘 도서관에서 공부해요 means 'Today I study at the library'."
        },
        {
            "id": "q_story_2",
            "type": "label",
            "question": "Identify the tense of: '내일 갈 거예요.'",
            "options": [
                "Past",
                "Present",
                "Future"
            ],
            "correct_answer": "Future",
            "explanation": "갈 거예요 is the future tense ending."
        },
        {
            "id": "q_story_3",
            "type": "label",
            "question": "Identify the tense of: '어제 친구를 만났어요.'",
            "options": [
                "Past",
                "Present",
                "Future"
            ],
            "correct_answer": "Past",
            "explanation": "만났어요 is the past tense form of 만나다."
        },
        {
            "id": "q_story_4",
            "type": "order",
            "question": "Order these timeline anchors from Past to Future: [오늘, 내일, 어제]",
            "options": [
                "어제 -> 오늘 -> 내일",
                "오늘 -> 어제 -> 내일",
                "내일 -> 오늘 -> 어제"
            ],
            "correct_answer": "어제 -> 오늘 -> 내일",
            "explanation": "어제 (yesterday) -> 오늘 (today) -> 내일 (tomorrow) is the correct chronological order."
        },
        {
            "id": "q_story_5",
            "type": "choice",
            "question": "Choose the paragraph that correctly mixes tenses in order (Past -> Present -> Future):",
            "options": [
                "어제 집에서 쉴 거예요. 오늘 일했어요. 내일 공부해요.",
                "어제 집에서 쉬었어요. 오늘 일해요. 내일 공부할 거예요.",
                "내일 집에서 쉴 거예요. 오늘 일해요. 어제 공부했어요."
            ],
            "correct_answer": "어제 집에서 쉬었어요. 오늘 일해요. 내일 공부할 거예요.",
            "explanation": "This follows Past ('쉬었어요') -> Present ('일해요') -> Future ('공부할 거예요')."
        }
    ],
    "homework": [
        {"id": "hw_story_1", "text": "Write a short story (4–6 sentences) about your life using past, present, and future: 1-2 for yesterday, 1-2 for today, 1-2 for tomorrow."},
        {"id": "hw_story_2", "text": "Record yourself telling this story without reading, if possible."},
        {"id": "hw_story_3", "text": "Write a similar story for another person (real or imaginary), using correct polite tenses."}
    ]
}
