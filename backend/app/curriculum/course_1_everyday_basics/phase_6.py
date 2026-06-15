PHASE_6_DATA = {
    "title": "Korean 1.6 – Everyday Conversations (A1)",
    "topic": "Everyday Conversations",
    "description": "Use your Korean to handle short, simple conversations about daily life.",
    "estimated_time": "25–30 minutes",
    "goals": [
        "Combine greetings, self-intro, numbers, routines, and places",
        "Practice 3–5-turn conversations on familiar topics (home, daily life, plans)",
        "Build confidence for your first real conversations in Korean"
    ],
    "prerequisites": "Korean 1.5 – Places & Location",
    "status": "locked",
    "content_markdown": (
        "# Korean 1.6 – Everyday Conversations (A1)\n\n"
        "### What is an A1 Conversation?\n"
        "At A1, you can have short conversations about yourself, your day, and places around you when the other person speaks slowly and helps you. That's what we'll practice here.\n\n"
        "### Typical A1 Topics:\n"
        "1. **Greetings & identity:** Say hello, tell your name and where you are from.\n"
        "2. **Daily Routines:** Tell when you wake up, study, or go to sleep.\n"
        "3. **Location & Places:** Say where you are or where you are going right now.\n\n"
        "### The Conversation Blueprint:\n"
        "A standard A1 exchange follows a 3-step path:\n"
        "- **Start:** Greeting + small identity question.\n"
        "- **Middle:** One simple question/answer about routine, time, or place.\n"
        "- **End:** Short polite closing phrase (goodbye / see you)."
    ),
    "blueprint": [
        {"step": "Start", "desc": "Greeting + small identity question (e.g. 어디예요?)"},
        {"step": "Middle", "desc": "One simple question/answer about routine, time, or place (e.g. 뭐 해요?)"},
        {"step": "End", "desc": "Short closing phrase (e.g. 안녕히 계세요)"}
    ],
    "examples": [
        {
            "id": "ex_1",
            "title": "First Meeting Small Talk",
            "dialogue": [
                {"speaker": "Tutor", "ko": "안녕하세요! 이름이 뭐예요?", "en": "Hello! What is your name?"},
                {"speaker": "Learner", "ko": "안녕하세요. 저는 지수예요. 미국 사람이에요.", "en": "Hello. I am Jisoo. I am American."},
                {"speaker": "Tutor", "ko": "반가워요, 지수 씨! 오늘 어디 가요?", "en": "Nice to meet you, Jisoo! Where are you going today?"},
                {"speaker": "Learner", "ko": "학교에 가요. 공부해요.", "en": "I am going to school. I study."},
                {"speaker": "Tutor", "ko": "아, 공부해요! 화이팅! 안녕히 가세요.", "en": "Ah, you study! Hwating! Goodbye."}
            ]
        }
    ],
    "guided_dialogues": [
        {
            "id": "gd_1",
            "context": "Greeting a tutor at school",
            "lines": [
                {"speaker": "Tutor", "ko": "안녕하세요! 어디예요?", "en": "Hello! Where are you?"},
                {"speaker": "Learner", "ko": "안녕하세요. 저는 학교에 있어요.", "en": "Hello. I am at school."}
            ],
            "prompt": "What should the tutor say next to ask where you are going later?",
            "options": [
                {"id": "opt_gd1_1", "text": "어디 가요? (Where are you going?)", "correct": True},
                {"id": "opt_gd1_2", "text": "이름이 뭐예요? (What is your name?)", "correct": False},
                {"id": "opt_gd1_3", "text": "몇 살이에요? (How old are you?)", "correct": False}
            ],
            "explanation": "Since the learner stated they are at school, the next natural flow in places small talk is asking where they go next ('어디 가요?')."
        },
        {
            "id": "gd_2",
            "context": "Meeting at a café",
            "lines": [
                {"speaker": "Tutor", "ko": "안녕하세요. 저는 영희예요. 이름이 뭐예요?", "en": "Hello. I am Yeong-hui. What is your name?"},
                {"speaker": "Learner", "ko": "안녕하세요, 영희 씨. 저는 마이클이에요.", "en": "Hello, Yeong-hui. I am Michael."}
            ],
            "prompt": "What should the tutor say next to ask about origin?",
            "options": [
                {"id": "opt_gd2_1", "text": "어느 나라 사람이에요? (Which country person are you?)", "correct": True},
                {"id": "opt_gd2_2", "text": "몇 시에 일어나요? (What time do you wake up?)", "correct": False},
                {"id": "opt_gd2_3", "text": "식당에 있어요. (I am at the restaurant.)", "correct": False}
            ],
            "explanation": "Asking which country they are from ('어느 나라 사람이에요?') fits the initial self-introduction sequence."
        }
    ],
    "scrambled_dialogues": [
        {
            "id": "sd_1",
            "scenario": "Scrambled Greeting & Routine Dialog",
            "correct_order": [
                {"ko": "안녕하세요!", "en": "Hello!", "audio_text": "안녕하세요"},
                {"ko": "네, 안녕하세요! 오늘 뭐 해요?", "en": "Yes, hello! What are you doing today?", "audio_text": "네 안녕하세요 오늘 뭐 해요"},
                {"ko": "카페에서 공부해요. 그리고 커피를 마셔요.", "en": "I study at the café. And I drink coffee.", "audio_text": "카페에서 공부해요 그리고 커피를 마셔요"},
                {"ko": "좋아요! 안녕히 계세요.", "en": "Great! Goodbye.", "audio_text": "좋아요 안녕히 계세요"}
            ],
            "scrambled_indices": [2, 0, 3, 1]
        }
    ],
    "quiz": [
        {
            "id": "q_conv_1",
            "type": "context",
            "question": "Choose the best next line for this conversation:\nA: 안녕하세요. 이름이 뭐예요?\nB: [ ]",
            "options": [
                "저는 준우예요.",
                "식당에 가요.",
                "감사합니다."
            ],
            "correct_answer": "저는 준우예요.",
            "explanation": "'이름이 뭐예요?' asks for your name. '저는 준우예요' answers this directly."
        },
        {
            "id": "q_conv_2",
            "type": "listening",
            "question": "Listen to the A1 question and select the correct English question detail:",
            "audio_text": "어느 나라 사람이에요",
            "options": [
                "Which country are you from?",
                "Where are you going?",
                "What time is it?"
            ],
            "correct_answer": "Which country are you from?",
            "explanation": "'어느 나라 사람이에요?' is the standard polite question to ask someone's nationality."
        },
        {
            "id": "q_conv_3",
            "type": "context",
            "question": "Select the correct Korean sentence order for: 'I go to the park' (park = 공원)",
            "options": [
                "공원에 가요.",
                "가요 공원에.",
                "공원 있어요."
            ],
            "correct_answer": "공원에 가요.",
            "explanation": "The place noun '공원' takes the destination particle '에', followed by the verb '가요'."
        },
        {
            "id": "q_conv_4",
            "type": "writing",
            "question": "Complete the response: '어디예요?' -> '[ ]에 있어요.' (Meaning 'I am at home.')",
            "correct_answer": "집",
            "explanation": "'집' means home. Attached to '에 있어요', it translates to 'I am at home'."
        }
    ],
    "homework": [
        {"id": "hw_conv_1", "text": "Write a 4-line conversation greeting a partner, stating your name/nationality, and reading it aloud."},
        {"id": "hw_conv_2", "text": "Write a 4-line dialog describing a cafe/school route using '에 가요' and '에 있어요'."},
        {"id": "hw_conv_3", "text": "Act out both roles of a mini-dialogue and record your voice reading them in natural tempo."}
    ],
    "scenarios": [
        {
            "id": "a1_scen_1",
            "name": "Meeting for the first time",
            "description": "Greet the tutor, introduce your name and where you are from, and answer one question about your day.",
            "prompt": "You are meeting your Korean tutor Gwan-Sik for the first time. Keep it polite!"
        },
        {
            "id": "a1_scen_2",
            "name": "Talking about your day",
            "description": "Talk about when you wake up, study, or go home today.",
            "prompt": "Discuss your routine and what time you do basic actions."
        },
        {
            "id": "a1_scen_3",
            "name": "Talking about where you are/going",
            "description": "Say where you are currently located and where you are heading next.",
            "prompt": "Answer location questions using 집에/학교에/카페에 and 있어요/가요."
        }
    ]
}
