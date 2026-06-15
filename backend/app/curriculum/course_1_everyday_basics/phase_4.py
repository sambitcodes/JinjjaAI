PHASE_4_DATA = {
    "title": "Korean 1.4 – Daily Activities",
    "topic": "Daily Activities",
    "description": "Talk about what you do every day using simple present-tense sentences.",
    "estimated_time": "25–30 minutes",
    "goals": [
        "Learn high-frequency verbs for daily life (wake up, eat, go, study, etc.)",
        "Use polite present-tense patterns to talk about routines",
        "Describe a simple 'day in your life' at A1 level"
    ],
    "prerequisites": "Korean 1.3 – Numbers & Everyday Facts",
    "status": "locked",
    "content_markdown": (
        "# Korean 1.4 – Daily Activities\n\n"
        "### High-Frequency Everyday Verbs\n"
        "To describe your day, you need core action verbs. Korean verbs end in **-다** in their dictionary form:\n"
        "- **자다 (ja-da):** to sleep\n"
        "- **일어나다 (il-eo-na-da):** to wake up / get up\n"
        "- **먹다 (meok-da):** to eat\n"
        "- **마시다 (ma-si-da):** to drink\n"
        "- **가다 (ga-da):** to go\n"
        "- **오다 (o-da):** to come\n"
        "- **공부하다 (gong-bu-ha-da):** to study\n"
        "- **일하다 (il-ha-da):** to work\n\n"
        "### Simple Polite Present Tense (-아요 / -어요 / -해요)\n"
        "In polite speech (해요체), we conjugate verb stems depending on their last vowel:\n"
        "1. **-아요:** Stems ending in **아** or **오** (e.g., 가다 -> 가요, 자다 -> 자요).\n"
        "2. **-어요:** Stems ending in other vowels (e.g., 먹다 -> 먹어요).\n"
        "3. **-해요:** Verbs ending in **하다** always change to **해요** (e.g., 공부하다 -> 공부해요, 일하다 -> 일해요).\n\n"
        "#### Simple Habit Sentence Structure:\n"
        "- **저는 공부해요 (Jeo-neun gong-bu-hae-yo):** I study. / I am studying.\n"
        "- **저는 밥을 먹어요 (Jeo-neun bab-eul meok-eo-yo):** I eat a meal (rice).\n"
        "- **저는 학교에 가요 (Jeo-neun hak-gyo-e ga-yo):** I go to school.\n"
    ),
    "verbs": [
        {"id": "v_sleep", "korean": "자다", "romanization": "ja-da", "english": "to sleep", "polite": "자요", "tag": "evening"},
        {"id": "v_wake", "korean": "일어나다", "romanization": "il-eo-na-da", "english": "to wake up", "polite": "일어나요", "tag": "morning"},
        {"id": "v_eat", "korean": "먹다", "romanization": "meok-da", "english": "to eat", "polite": "먹어요", "tag": "day"},
        {"id": "v_drink", "korean": "마시다", "romanization": "ma-si-da", "english": "to drink", "polite": "마셔요", "tag": "day"},
        {"id": "v_go", "korean": "가다", "romanization": "ga-da", "english": "to go", "polite": "가요", "tag": "day"},
        {"id": "v_come", "korean": "오다", "romanization": "o-da", "english": "to come", "polite": "와요", "tag": "day"},
        {"id": "v_study", "korean": "공부하다", "romanization": "gong-bu-ha-da", "english": "to study", "polite": "공부해요", "tag": "day"},
        {"id": "v_work", "korean": "일하다", "romanization": "il-ha-da", "english": "to work", "polite": "일해요", "tag": "day"}
    ],
    "pattern_examples": [
        {"ko": "저는 아침에 일어나요.", "en": "I wake up in the morning.", "audio_text": "저는 아침에 일어나요"},
        {"ko": "저는 학교에 가요.", "en": "I go to school.", "audio_text": "저는 학교에 가요"},
        {"ko": "저는 저녁에 자요.", "en": "I sleep in the evening.", "audio_text": "저는 저녁에 자요"}
    ],
    "practice_verbs": [
        {"id": "prac_v_1", "korean": "공부하다", "options": ["to study", "to sleep", "to drink"], "correct": "to study"},
        {"id": "prac_v_2", "korean": "먹다", "options": ["to eat", "to come", "to work"], "correct": "to eat"},
        {"id": "prac_v_3", "korean": "일어나다", "options": ["to sleep", "to wake up", "to go"], "correct": "to wake up"}
    ],
    "practice_sentences": [
        {"id": "prac_s_1", "sentence": "저는 커피를 마셔요", "options": ["I drink coffee", "I eat bread", "I study Korean"], "correct": "I drink coffee"},
        {"id": "prac_s_2", "sentence": "저는 도서관에 가요", "options": ["I go to the library", "I work at an office", "I sleep at home"], "correct": "I go to the library"}
    ],
    "templates": {
        "morning": [
            {"label": "Wake up", "ko": "일어나요", "en": "wake up"},
            {"label": "Drink water", "ko": "물을 마셔요", "en": "drink water"},
            {"label": "Eat breakfast", "ko": "아침을 먹어요", "en": "eat breakfast"}
        ],
        "daytime": [
            {"label": "Go to school", "ko": "학교에 가요", "en": "go to school"},
            {"label": "Work", "ko": "일해요", "en": "work"},
            {"label": "Study Korean", "ko": "한국어를 공부해요", "en": "study Korean"}
        ],
        "evening": [
            {"label": "Eat dinner", "ko": "저녁을 먹어요", "en": "eat dinner"},
            {"label": "Watch TV", "ko": "텔레비전을 봐요", "en": "watch TV"},
            {"label": "Sleep", "ko": "자요", "en": "sleep"}
        ]
    },
    "quiz": [
        {
            "id": "q_rout_1", 
            "type": "listening", 
            "question": "Hear the daily routine phrase and select the correct meaning:", 
            "audio_text": "공부해요", 
            "options": ["to study", "to work", "to eat", "to sleep"], 
            "correct_answer": "to study", 
            "explanation": "공부해요 (gong-bu-hae-yo) means '(I) study'."
        },
        {
            "id": "q_rout_2", 
            "type": "context", 
            "question": "Translate: '저는 집에 가요.'", 
            "options": ["I go home.", "I study at home.", "I sleep at home."], 
            "correct_answer": "I go home.", 
            "explanation": "집 means home, 가요 means go. '저는 집에 가요' = 'I go home.'"
        },
        {
            "id": "q_rout_3", 
            "type": "context", 
            "question": "Complete the polite present habit: '저는 밥을 [ ].' (I eat a meal/rice.)", 
            "options": ["가요", "먹어요", "일해요"], 
            "correct_answer": "먹어요", 
            "explanation": "먹어요 is the polite present form of 먹다 (to eat)."
        },
        {
            "id": "q_rout_4", 
            "type": "writing", 
            "question": "Type the polite present form of the verb meaning 'to work' (일하다):", 
            "correct_answer": "일해요", 
            "explanation": "일하다 conjugates to 일해요 in polite speech."
        },
        {
            "id": "q_rout_5", 
            "type": "speaking", 
            "question": "Read this routine sentence aloud: '저는 한국어를 공부해요'", 
            "correct_answer": "저는 한국어를 공부해요", 
            "explanation": "This reads 'I study Korean'."
        }
    ],
    "homework": [
        {"id": "hw_rout_1", "text": "Write 3 simple Korean sentences describing your morning, daytime, and evening routine."},
        {"id": "hw_rout_2", "text": "Practice reading your saved routine paragraph aloud 3 times."},
        {"id": "hw_rout_3", "text": "Record your routine sentences on a voice recorder and check the verb endings."}
    ]
}

