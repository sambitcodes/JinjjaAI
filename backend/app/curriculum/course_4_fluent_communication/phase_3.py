PHASE_3_DATA = {
    "title": "Korean 4.3 – Social & Study/Work Conversations",
    "topic": "Social & Study/Work Conversations",
    "description": "Use Korean naturally with classmates, colleagues, and friends.",
    "estimated_time": "30–40 minutes",
    "goals": [
        "Start and join small talk in social/study/work settings",
        "Make simple suggestions, invitations, and plans",
        "Agree and disagree politely about familiar topics"
    ],
    "prerequisites": "Korean 4.2 – Real‑World Korean: Travel & Errands",
    "status": "locked",
    "content_markdown": (
        "# Korean 4.3 – Social & Study/Work Conversations\n\n"
        "### B1 Social, Study & Work Goal\n"
        "At B1, you should be able to talk about work, school and free time, express your opinions, and take part in simple discussions with friends or classmates.\n\n"
        "### Key Contexts\n"
        "1. **Social (사교):** Meeting new people in a group, chatting at a café/club.\n"
        "2. **Study (학업):** Group project, homework, exam prep chats.\n"
        "3. **Light Work (업무):** Discussing schedule, simple tasks, checking progress."
    ),
    "contexts": ["social", "study", "work"],
    "functional_phrases": [
        {"ko": "여기 앉아도 돼요?", "rom": "Yeogi anjado dwaeyo?", "en": "Can I sit here?", "tag": "Starting/Joining", "context": "social"},
        {"ko": "요즘 어떻게 지내요?", "rom": "Yojeum eotteoke jinaeyo?", "en": "How is your day going?", "tag": "Starting/Joining", "context": "social"},
        {"ko": "오늘 수업/업무는 어때요?", "rom": "Oneul sueop/eommu-neun eottaeyo?", "en": "How is your class/work?", "tag": "Starting/Joining", "context": "social"},
        {"ko": "보통 퇴근하고 뭐 해요?", "rom": "Botong toegeun-hago mwo haeyo?", "en": "What do you usually do after work?", "tag": "Routines/Responsibilities", "context": "work"},
        {"ko": "지금 무슨 공부 하고 있어요?", "rom": "Jigeum museun gongbu hago isseoyo?", "en": "What are you studying now?", "tag": "Routines/Responsibilities", "context": "study"},
        {"ko": "우리 같이 도서관에서 공부할래요?", "rom": "Uri gachi doseogwan-eseo gongbu-hallaeyo?", "en": "Shall we study together at the library?", "tag": "Suggestions/Invitations", "context": "study"},
        {"ko": "커피 한 잔 마실래요?", "rom": "Keopi han jan masillaeyo?", "en": "Do you want to grab coffee?", "tag": "Suggestions/Invitations", "context": "social"},
        {"ko": "저도 그렇게 생각해요.", "rom": "Jeodo geureoke saenggak-haeyo.", "en": "I think so too.", "tag": "Agreeing/Disagreeing", "context": "social"},
        {"ko": "그건 잘 모르겠어요.", "rom": "Geugeon jal moreugess-eoyo.", "en": "I'm not sure about that.", "tag": "Agreeing/Disagreeing", "context": "social"}
    ],
    "example_dialogues": [
        {
            "id": "social_dial_1",
            "context": "study",
            "title": "Planning Group Study",
            "turns": [
                {"speaker": "Ji-Woo", "ko": "안녕! 오늘 수업 어땠어?", "en": "Hi! How was class today?", "label": "Start"},
                {"speaker": "Min-Ho", "ko": "조금 어려웠지만 재미있었어. 내일 시험 공부 같이 할래?", "en": "It was a bit hard but interesting. Do you want to study for the exam together tomorrow?", "label": "Suggestion"},
                {"speaker": "Ji-Woo", "ko": "좋아, 같이 하자! 도서관에서 세 시에 만날까?", "en": "Sure, let's do it! Shall we meet at the library at 3?", "label": "Agreement / Detail Suggestion"},
                {"speaker": "Min-Ho", "ko": "응, 그래. 그때 보자!", "en": "Yes, okay. See you then!", "label": "Closing"}
            ]
        }
    ],
    "dialogues": [
        {
            "id": "social_dial_practice_1",
            "context": "study",
            "title": "Group Project Schedule",
            "turns": [
                {"speaker": "Ji-Won", "ko": "민수 씨, 이번 주말에 시간 있어요?", "en": "Minsu, do you have time this weekend?", "audio_url": "/api/v1/speech/tts?text=민수 씨, 이번 주말에 시간 있어요?&lang=ko"},
                {"speaker": "Min-Su", "ko": "네, 토요일 오후에는 괜찮아요. 왜요?", "en": "Yes, Saturday afternoon is fine. Why?", "audio_url": "/api/v1/speech/tts?text=네, 토요일 오후에는 괜찮아요. 왜요?&lang=ko"},
                {"speaker": "Ji-Won", "ko": "같이 발표 자료를 준비하는 게 어때요?", "en": "How about preparing the presentation materials together?", "audio_url": "/api/v1/speech/tts?text=같이 발표 자료를 준비하는 게 어때요?&lang=ko"},
                {"speaker": "Min-Su", "ko": "그거 아주 좋은 생각이에요! 세 시에 만날까요?", "en": "That's a very good idea! Shall we meet at 3 o'clock?", "audio_url": "/api/v1/speech/tts?text=그거 아주 좋은 생각이에요! 세 시에 만날까요?&lang=ko"}
            ],
            "questions": {
                "where": "School",
                "topic": "A project",
                "suggestion_speaker": "Ji-Won",
                "agreement_line": "그거 아주 좋은 생각이에요!",
                "choices_where": ["School", "Workplace", "Café", "Home"],
                "choices_topic": ["A project", "Weekend plans", "Work schedule"]
            }
        }
    ],
    "task_templates": {
        "suggestion_patterns": [
            {"id": "shall_we", "pattern": "...ㄹ까요?", "desc": "Shall we...?"},
            {"id": "want_to", "pattern": "...ㄹ래요?", "desc": "Do you want to...?"}
        ],
        "response_patterns": [
            {"id": "agree", "pattern": "좋아요. 같이 해요.", "desc": "Good. Let's do it."},
            {"id": "disagree", "pattern": "죄송하지만 바빠서 안 돼요.", "desc": "Sorry, I am busy so I can't."}
        ]
    },
    "quiz": [
        {
            "id": "q_b1_soc_1",
            "type": "opening_line",
            "question": "You meet a new classmate for the first time. Which opening line is most appropriate?",
            "options": [
                "안녕하세요, 저는 새로 온 김민수입니다. 만나서 반가워요. (Hello, I'm Minsu Kim who just arrived. Nice to meet you.)",
                "이거 너무 비싸요. 안 살게요. (This is too expensive. I won't buy it.)",
                "방에 뜨거운 물이 안 나와요. (There's no hot water in the room.)"
            ],
            "correct_answer": "안녕하세요, 저는 새로 온 김민수입니다. 만나서 반가워요. (Hello, I'm Minsu Kim who just arrived. Nice to meet you.)",
            "explanation": "A standard self-introduction is the best opening line when meeting someone new."
        },
        {
            "id": "q_b1_soc_2",
            "type": "sentence_function",
            "question": "Identify the function of: '오늘 회식 같이 갈래요?' (Do you want to go to the company dinner together?)",
            "options": [
                "Suggestion / Invitation",
                "Polite Disagreement",
                "Neutral Fact Statement"
            ],
            "correct_answer": "Suggestion / Invitation",
            "explanation": "'~ㄹ래요?' is used to suggest or invite someone to perform an activity."
        },
        {
            "id": "q_b1_soc_3",
            "type": "agreement_type",
            "question": "What kind of reaction is: '그건 조금 힘들 것 같아요.' (I think that might be a bit difficult.)",
            "options": [
                "Soft Disagreement",
                "Enthusiastic Agreement",
                "Neutral Query"
            ],
            "correct_answer": "Soft Disagreement",
            "explanation": "'~ㄹ 것 같아요' delivers disagreement softly and politely in Korean."
        }
    ],
    "homework": [
        {"id": "hw_b1_soc_1", "text": "Write 3 mini-scripts (4-6 lines) covering: coffee shop small talk, scheduling a project session, and discussing work tasks."},
        {"id": "hw_b1_soc_2", "text": "Record yourself speaking both roles of your custom study planning script."},
        {"id": "hw_b1_soc_3", "text": "Write 3 sentences in Korean describing which setting (social, study, work) feels easiest for you to converse in and why."}
    ]
}
