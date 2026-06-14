PHASE_1_DATA = {
    "title": "Korean 1.1 – Greetings & Polite Basics",
    "topic": "Greetings & Polite Basics",
    "description": "Say hello, thank you, and goodbye in natural Korean.",
    "estimated_time": "15–20 minutes",
    "goals": [
        "Greet people politely in Korean",
        "Say thank you, sorry, and excuse me",
        "Respond with yes/no in simple daily situations"
    ],
    "prerequisites": "Hangeul Vowels & Consonants (Phase 1-6)",
    "status": "unlocked",
    "content_markdown": (
        "# Korean 1.1 – Greetings & Polite Basics\n\n"
        "### In Korean, politeness is built into the language.\n"
        "In this phase, you'll learn polite greetings and everyday expressions you can use with anyone.\n"
        "The default safe style of speech for talking to strangers, teachers, and adults is polite language (존댓말).\n\n"
        "#### Key Polite Expressions:\n"
        "- **안녕하세요 (An-nyeong-ha-se-yo):** Hello / How are you? (Safe polite form)\n"
        "- **감사합니다 (Gam-sa-ham-ni-da):** Thank you (Polite formal form)\n"
        "- **죄송합니다 (Joe-song-ham-ni-da):** Sorry / Excuse me (Polite formal form)\n"
        "- **안녕히 계세요 (An-nyeong-hi gye-se-yo):** Goodbye (When you are leaving, and the other person is staying)\n"
        "- **안녕히 가세요 (An-nyeong-hi ga-se-yo):** Goodbye (When the other person is leaving, or both of you are leaving)\n"
        "- **네 (Ne):** Yes / Agreement\n"
        "- **아니요 (A-ni-yo):** No / Disagreement\n"
    ),
    "expressions": [
        {
            "id": "exp_hello",
            "korean": "안녕하세요",
            "romanization": "An-nyeong-ha-se-yo",
            "english": "Hello / How are you?",
            "usage": "Standard polite greeting used at any time of day to show respect."
        },
        {
            "id": "exp_thankyou",
            "korean": "감사합니다",
            "romanization": "Gam-sa-ham-ni-da",
            "english": "Thank you",
            "usage": "The most common and respectful way to express gratitude."
        },
        {
            "id": "exp_sorry",
            "korean": "죄송합니다",
            "romanization": "Joe-song-ham-ni-da",
            "english": "I'm sorry / Excuse me",
            "usage": "Polite apology or safe way to get attention/excuse yourself in public."
        },
        {
            "id": "exp_goodbye_stay",
            "korean": "안녕히 계세요",
            "romanization": "An-nyeong-hi gye-se-yo",
            "english": "Goodbye (to person staying)",
            "usage": "Literally 'Please stay in peace.' Use when you leave and they stay."
        },
        {
            "id": "exp_goodbye_go",
            "korean": "안녕히 가세요",
            "romanization": "An-nyeong-hi ga-se-yo",
            "english": "Goodbye (to person leaving)",
            "usage": "Literally 'Please go in peace.' Use when they leave (or both leave)."
        },
        {
            "id": "exp_yes",
            "korean": "네",
            "romanization": "Ne",
            "english": "Yes",
            "usage": "Polite agreement. Can also mean 'I see' or 'Aha' during a conversation."
        },
        {
            "id": "exp_no",
            "korean": "아니요",
            "romanization": "A-ni-yo",
            "english": "No",
            "usage": "Polite disagreement or denial."
        }
    ],
    "practice_listening": [
        {
            "id": "lis_g1",
            "audio_text": "안녕하세요",
            "options": [
                {"id": "opt_hello", "text": "Hello"},
                {"id": "opt_thanks", "text": "Thank you"},
                {"id": "opt_sorry", "text": "I'm sorry"}
            ],
            "correct_option_id": "opt_hello",
            "korean": "안녕하세요",
            "romanization": "An-nyeong-ha-se-yo"
        },
        {
            "id": "lis_g2",
            "audio_text": "감사합니다",
            "options": [
                {"id": "opt_bye", "text": "Goodbye"},
                {"id": "opt_thanks", "text": "Thank you"},
                {"id": "opt_no", "text": "No"}
            ],
            "correct_option_id": "opt_thanks",
            "korean": "감사합니다",
            "romanization": "Gam-sa-ham-ni-da"
        },
        {
            "id": "lis_g3",
            "audio_text": "죄송합니다",
            "options": [
                {"id": "opt_yes", "text": "Yes"},
                {"id": "opt_hello", "text": "Hello"},
                {"id": "opt_sorry", "text": "I'm sorry / Excuse me"}
            ],
            "correct_option_id": "opt_sorry",
            "korean": "죄송합니다",
            "romanization": "Joe-song-ham-ni-da"
        },
        {
            "id": "lis_g4",
            "audio_text": "안녕히 계세요",
            "options": [
                {"id": "opt_bye_stay", "text": "Goodbye (stay)"},
                {"id": "opt_bye_go", "text": "Goodbye (go)"},
                {"id": "opt_hello", "text": "Hello"}
            ],
            "correct_option_id": "opt_bye_stay",
            "korean": "안녕히 계세요",
            "romanization": "An-nyeong-hi gye-se-yo"
        }
    ],
    "practice_matching": [
        {"ko": "안녕하세요", "en": "Hello"},
        {"ko": "감사합니다", "en": "Thank you"},
        {"ko": "죄송합니다", "en": "I'm sorry"},
        {"ko": "네", "en": "Yes"},
        {"ko": "아니요", "en": "No"}
    ],
    "practice_gapfill": [
        {
            "id": "gf_g1",
            "prompt": "You meet someone for the first time.",
            "koreanTemplate": "[ ]세요!",
            "options": [
                {"id": "opt_gf_1", "text": "안녕핫"},
                {"id": "opt_gf_2", "text": "안녕하"},
                {"id": "opt_gf_3", "text": "감사합"}
            ],
            "correct_option_id": "opt_gf_2",
            "explanation": "안녕하세요 is the standard polite greeting. The root is '안녕하' (to be at peace)."
        },
        {
            "id": "gf_g2",
            "prompt": "You want to say 'Thank you' formally.",
            "koreanTemplate": "감사합[ ].",
            "options": [
                {"id": "opt_gf_b1", "text": "네"},
                {"id": "opt_gf_b2", "text": "니다"},
                {"id": "opt_gf_b3", "text": "가요"}
            ],
            "correct_option_id": "opt_gf_b2",
            "explanation": "감사합니다 is completed with '-니다' (formal polite ending)."
        }
    ],
    "practice_context": [
        {
            "id": "ctx_g1",
            "scenario": "A cashier gives you your change at a convenience store.",
            "options": [
                {"id": "opt_ctx_1", "text": "죄송합니다"},
                {"id": "opt_ctx_2", "text": "아니요"},
                {"id": "opt_ctx_3", "text": "감사합니다"}
            ],
            "correct_option_id": "opt_ctx_3",
            "explanation": "When receiving service or items, say '감사합니다' (Thank you) to show gratitude."
        },
        {
            "id": "ctx_g2",
            "scenario": "You accidentally bump into someone on a crowded subway train.",
            "options": [
                {"id": "opt_ctx_b1", "text": "안녕하세요"},
                {"id": "opt_ctx_b2", "text": "죄송합니다"},
                {"id": "opt_ctx_b3", "text": "네"}
            ],
            "correct_option_id": "opt_ctx_b2",
            "explanation": "Use '죄송합니다' to apologize politely for minor accidents like bumping into someone."
        },
        {
            "id": "ctx_g3",
            "scenario": "You are leaving a cafe while the staff/baristas remain inside.",
            "options": [
                {"id": "opt_ctx_c1", "text": "안녕히 계세요"},
                {"id": "opt_ctx_c2", "text": "안녕히 가세요"},
                {"id": "opt_ctx_c3", "text": "아니요"}
            ],
            "correct_option_id": "opt_ctx_c1",
            "explanation": "Use '안녕히 계세요' (Please stay in peace) when you are leaving and the other party stays."
        }
    ],
    "quiz": [
        {"id": "q_lis_1", "type": "listening", "question": "Listen and select the meaning of the spoken phrase:", "audio_text": "안녕하세요", "options": ["Hello", "Thank you", "Yes"], "correct_answer": "Hello", "explanation": "안녕하세요 means Hello."},
        {"id": "q_lis_2", "type": "listening", "question": "Listen and select the meaning of the spoken phrase:", "audio_text": "감사합니다", "options": ["No", "Goodbye", "Thank you"], "correct_answer": "Thank you", "explanation": "감사합니다 means Thank you."},
        {"id": "q_ctx_3", "type": "context", "question": "Choose the best polite response: Someone says '고마워요' (Thank you) and asks if you are okay, you want to reply 'Yes, I'm okay' starting with:", "options": ["네", "아니요", "죄송합니다"], "correct_answer": "네", "explanation": "네 is the polite form for Yes."},
        {"id": "q_ctx_4", "type": "context", "question": "You leave a friend's house while they stay home. What do you say?", "options": ["안녕히 가세요", "안녕히 계세요", "안녕하세요"], "correct_answer": "안녕히 계세요", "explanation": "안녕히 계세요 is used when you are leaving and the other person is staying."},
        {"id": "q_type_5", "type": "writing", "question": "Type the polite Hangeul word for 'Yes' (네):", "correct_answer": "네", "explanation": "네 is polite yes in Korean."},
        {"id": "q_speak_6", "type": "speaking", "question": "Say hello politely to your teacher:", "correct_answer": "안녕하세요", "explanation": "안녕하세요 is the standard polite greeting 'Hello'."}
    ],
    "homework": [
        {"id": "hw_1", "text": "Practice saying your polite hello (안녕하세요) 5 times today out loud."},
        {"id": "hw_2", "text": "Record yourself saying thank you (감사합니다) and apologize (죄송합니다); compare your pronunciation to native audio."},
        {"id": "hw_3", "text": "Greet at least one person politely (or practice in front of a mirror) using '안녕하세요'."}
    ]
}
