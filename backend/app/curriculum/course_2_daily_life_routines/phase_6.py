PHASE_6_DATA = {
    "title": "Korean 2.6 – Everyday Conversations (A2 Capstone)",
    "topic": "Everyday Conversations (A2 Capstone)",
    "description": "Have longer simple conversations about your daily life, past, and future.",
    "estimated_time": "25–30 minutes",
    "goals": [
        "Talk about your daily routines, habits, past activities, and future plans",
        "Ask and answer questions in short social exchanges on familiar topics",
        "Build confidence for real-world conversations at A2"
    ],
    "prerequisites": "Korean 2.5 – Daily Life Stories (Past–Present–Future)",
    "status": "locked",
    "content_markdown": (
        "# Korean 2.6 – Everyday Conversations (A2 Capstone)\n\n"
        "### A2 Conversation Skills\n"
        "At the A2 level, you can handle simple conversations about daily topics like family, work, hobbies, and plans if the other person helps and speaks slowly. In this phase, you’ll practice exactly that.\n\n"
        "### Typical A2 Conversation Topics:\n"
        "1. **Home & Living:** Where you live, with whom.\n"
        "2. **Daily Routines & Habits:** What you do regularly, hobbies, likes/dislikes.\n"
        "3. **Past Experiences:** What you did yesterday, last weekend, or on a recent trip.\n"
        "4. **Future Plans:** What you will do tomorrow, this weekend, or next week.\n\n"
        "### Conversation Blueprint (A2 vs A1):\n"
        "- **Length:** A2 conversations typically span 6–10 turns instead of 3–5.\n"
        "- **Initiative:** The learner asks questions back (e.g., '그리고 씨는요?', '주말에 뭐 할 거예요?'), not just answering.\n"
        "- **Tense Integration:** Topics shift naturally from past routines to future goals."
    ),
    "blueprint": [
        {"step": "Start", "desc": "Greeting + basic identity and initial check-in (e.g. 요즘 어떻게 지내요?)"},
        {"step": "Middle", "desc": "3-6 turns discussing daily routines, hobbies, past weekend, or upcoming plans. The learner should ask questions back."},
        {"step": "End", "desc": "Polite closing (e.g. 다음에 또 만나요, 오늘 감사합니다)"}
    ],
    "examples": [
        {
            "id": "ex_a2_1",
            "title": "Weekend Talk with Gwan-Sik",
            "dialogue": [
                {"speaker": "Tutor", "ko": "안녕하세요! 지난 주말에 뭐 했어요?", "en": "Hello! What did you do last weekend?"},
                {"speaker": "Learner", "ko": "안녕하세요. 지난 주말에 집에서 쉬었어요. 그리고 영화를 봤어요. 관식 씨는 뭐 했어요?", "en": "Hello. I rested at home last weekend. And I watched a movie. What did you do, Gwan-Sik?"},
                {"speaker": "Tutor", "ko": "저는 친구하고 공원에서 축구를 했어요. 이번 주말에는 무슨 계획이 있어요?", "en": "I played soccer with a friend at the park. Do you have any plans for this weekend?"},
                {"speaker": "Learner", "ko": "이번 주말에는 부모님을 만날 거예요. 같이 맛있는 음식을 먹을 거예요.", "en": "This weekend, I will meet my parents. We will eat delicious food together."},
                {"speaker": "Tutor", "ko": "좋은 주말 보내세요! 다음에 또 이야기해요.", "en": "Have a great weekend! Let's talk again next time."},
                {"speaker": "Learner", "ko": "네, 감사합니다. 안녕히 계세요!", "en": "Yes, thank you. Goodbye!"}
            ]
        }
    ],
    "guided_dialogues": {
        "activity_1a": [
            {
                "id": "gd_a2_1",
                "context": "Talking about weekend plans",
                "lines": [
                    {"speaker": "Tutor", "ko": "이번 주말에 친구를 만나요?", "en": "Are you meeting a friend this weekend?"},
                    {"speaker": "Learner", "ko": "아니요, 친구를 안 만나요. 그냥 집에서 쉴 거예요.", "en": "No, I am not meeting a friend. I will just rest at home."},
                    {"speaker": "Tutor", "ko": "그렇군요. 집에서 보통 뭐 해요?", "en": "I see. What do you usually do at home?"}
                ],
                "prompt": "What should the learner say next to describe a typical hobby at home?",
                "options": [
                    {"id": "opt_gd_a2_1_1", "text": "넷플릭스를 봐요. 그리고 한국어를 공부해요. (I watch Netflix. And I study Korean.)", "correct": True},
                    {"id": "opt_gd_a2_1_2", "text": "어제 회사에서 일했어요. (Yesterday I worked at the office.)", "correct": False},
                    {"id": "opt_gd_a2_1_3", "text": "내일 친구랑 등산을 갈 거예요. (Tomorrow I will go hiking with a friend.)", "correct": False}
                ],
                "explanation": "The question asks what the learner *usually* does at home (present habit). Option 1 answers this with hobbies and uses the correct present tense."
            },
            {
                "id": "gd_a2_2",
                "context": "Discussing hobbies and sports",
                "lines": [
                    {"speaker": "Tutor", "ko": "요즘 무슨 운동을 자주 해요?", "en": "What exercise do you do often these days?"},
                    {"speaker": "Learner", "ko": "요즘 공원에서 달리기를 해요. 건강에 좋아서 자주 해요. 선생님은 운동을 좋아해요?", "en": "These days I run in the park. I do it often because it is good for health. Teacher, do you like exercise?"},
                    {"speaker": "Tutor", "ko": "네, 저는 수영을 좋아해요. 보통 일주일에 두 번 수영장에 가요.", "en": "Yes, I like swimming. I usually go to the swimming pool twice a week."}
                ],
                "prompt": "What is the best follow-up question the learner can ask to continue the conversation about swimming?",
                "options": [
                    {"id": "opt_gd_a2_2_1", "text": "수영장이 어디에 있어요? (Where is the swimming pool?)", "correct": True},
                    {"id": "opt_gd_a2_2_2", "text": "어제 빵을 먹었어요. (Yesterday I ate bread.)", "correct": False},
                    {"id": "opt_gd_a2_2_3", "text": "내일은 날씨가 좋을 거예요. (Tomorrow the weather will be nice.)", "correct": False}
                ],
                "explanation": "Asking where the swimming pool is ('수영장이 어디에 있어요?') is a logical follow-up question that demonstrates conversational active listening."
            }
        ],
        "activity_1b": [
            {
                "id": "gd_a2_3",
                "question": "어제 저녁에 뭐 먹었어요? (What did you eat yesterday evening?)",
                "options": [
                    {"id": "opt_gd_a2_3_1", "text": "비빔밥을 먹었어요. 정말 맛있었어요. (I ate bibimbap. It was really delicious.)", "correct": True},
                    {"id": "opt_gd_a2_3_2", "text": "내일 식당에서 고기를 먹을 거예요. (Tomorrow I will eat meat at the restaurant.)", "correct": False},
                    {"id": "opt_gd_a2_3_3", "text": "보통 집에서 아침을 먹어요. (I usually eat breakfast at home.)", "correct": False}
                ],
                "explanation": "The question asks about a past meal ('어제 저녁... 먹었어요?'). Option 1 is the correct past-tense response."
            },
            {
                "id": "gd_a2_4",
                "question": "내일 몇 시에 만날까요? (What time shall we meet tomorrow?)",
                "options": [
                    {"id": "opt_gd_a2_4_1", "text": "오후 두 시에 만나요. 시간 괜찮아요? (Let's meet at 2:00 PM. Is that time okay?)", "correct": True},
                    {"id": "opt_gd_a2_4_2", "text": "어제 두 시에 만났어요. (We met at two o'clock yesterday.)", "correct": False},
                    {"id": "opt_gd_a2_4_3", "text": "매일 공부해요. (I study every day.)", "correct": False}
                ],
                "explanation": "The tutor is suggesting or asking for a time to meet tomorrow ('내일 ... 만날까요?'). Option 1 suggests a time in the future and asks if it's fine."
            }
        ]
    },
    "scenarios": [
        {
            "id": "a2_scen_1",
            "name": "Talking about your weekday routine",
            "description": "Discuss your daily schedule, when you study or work, and your daily habits.",
            "prompt": "Greet Gwan-Sik, talk about your daily schedule (morning, afternoon, night), and ask about his routine."
        },
        {
            "id": "a2_scen_2",
            "name": "Talking about hobbies and likes",
            "description": "Talk about what you like to do on weekends, your favorite hobbies, and food.",
            "prompt": "Talk about your favorite hobbies and activities, express why you like them, and ask about Gwan-Sik's preferences."
        },
        {
            "id": "a2_scen_3",
            "name": "Talking about last weekend",
            "description": "Tell Gwan-Sik what you did last weekend, where you went, and who you met.",
            "prompt": "Describe your past weekend in detail using past tense, and ask about Gwan-Sik's weekend."
        },
        {
            "id": "a2_scen_4",
            "name": "Talking about plans for this weekend",
            "description": "Share your plans for the upcoming weekend, including time and destination plans.",
            "prompt": "Describe what you will do this weekend using future plans/schedules, and ask about Gwan-Sik's weekend plans."
        }
    ],
    "quiz": [
        {
            "id": "q_a2_conv_1",
            "type": "context",
            "question": "Choose the best next line to keep the conversation going naturally:\nA: 저는 영화 보는 것을 좋아해요. 주말에 극장에 자주 가요.\nB: [ ]",
            "options": [
                "아, 그렇군요! 무슨 영화를 좋아해요?",
                "어제 도서관에서 공부했어요.",
                "내일 학교에 갈 거예요."
            ],
            "correct_answer": "아, 그렇군요! 무슨 영화를 좋아해요?",
            "explanation": "Asking what movies they like ('무슨 영화를 좋아해요?') naturally continues the discussion about watching movies."
        },
        {
            "id": "q_a2_conv_2",
            "type": "listening",
            "question": "Listen to the A2 dialogue and select the main topic:",
            "audio_text": "어제 친구를 만나서 커피를 마셨어요. 그리고 같이 쇼핑을 했어요.",
            "options": [
                "Talking about yesterday's social activities",
                "Talking about tomorrow's office schedule",
                "Talking about daily morning routines"
            ],
            "correct_answer": "Talking about yesterday's social activities",
            "explanation": "The dialogue describes meeting a friend, drinking coffee, and shopping yesterday ('어제...')."
        },
        {
            "id": "q_a2_conv_3",
            "type": "context",
            "question": "Identify the response containing a grammatical tense error for this question: '내일 뭐 할 거예요?'",
            "options": [
                "어제 집에서 쉬었어요.",
                "내일 도서관에서 한국어를 공부할 거예요.",
                "주말에 여행을 가려고 해요."
            ],
            "correct_answer": "어제 집에서 쉬었어요.",
            "explanation": "'내일 뭐 할 거예요?' asks about future plans. '어제... 쉬었어요' is in the past tense and answers about yesterday, which is incorrect."
        },
        {
            "id": "q_a2_conv_4",
            "type": "context",
            "question": "Which follow-up question is the most natural way to ask Gwan-Sik about his routine after describing your own?",
            "options": [
                "관식 씨는 하루 일과가 어떻게 돼요?",
                "이름이 뭐예요?",
                "수영장이 어디예요?"
            ],
            "correct_answer": "관식 씨는 하루 일과가 어떻게 돼요?",
            "explanation": "'하루 일과가 어떻게 돼요?' means 'What is your daily routine like?' which is the perfect way to ask back about routines."
        }
    ],
    "homework": [
        {"id": "hw_a2_conv_1", "text": "Write a short dialogue (6–8 turns) describing your daily routines and weekend plans, and ask a question back."},
        {"id": "hw_a2_conv_2", "text": "Record yourself simulating the conversation by speaking both parts aloud, ensuring distinct intonation."},
        {"id": "hw_a2_conv_3", "text": "Start a conversation with the AI Tutor on 'last weekend' and sustain it for at least 8 turns."}
    ]
}
