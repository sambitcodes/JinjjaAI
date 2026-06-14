PHASE_4_DATA = {
    "title": "Korean 5.4 – High-Level Register & Style",
    "topic": "High-Level Register & Style",
    "description": "Switch between casual, neutral, and formal Korean with confidence.",
    "estimated_time": "35–45 minutes",
    "goals": [
        "Recognize informal, neutral, and formal Korean in social, academic, and professional contexts",
        "Rewrite your ideas to match reader, situation, and medium",
        "Speak and write appropriately to friends, teachers, and colleagues at C1 level"
    ],
    "prerequisites": "Korean 5.3 – Nuanced Opinions & Soft Power",
    "status": "locked",
    "content_markdown": (
        "# Korean 5.4 – High-Level Register & Style\n\n"
        "### What is Register?\n"
        "**Register** refers to the variety of language used in a specific social situation. "
        "In Korean, register is determined by **who you are speaking to** (relationship), "
        "**where you are** (context), and **what medium you use** (spoken vs written). "
        "It is NOT the same as politeness alone — even at a formal level you can be casual in style.\n\n"
        "### Three Core Register Levels\n"
        "1. **Informal / Casual (반말/구어체):** Used with close friends, younger people, or in very relaxed settings. "
        "Verb endings like ~해, ~야, ~지 are typical.\n"
        "2. **Neutral / Polite (존댓말/표준어):** The default for most everyday interactions with strangers, "
        "service staff, and acquaintances. Uses ~해요, ~습니다-level endings but keeps a warm tone.\n"
        "3. **Formal / Academic (격식체/문어체):** Used in academic writing, official correspondence, presentations, "
        "and professional reports. Characterised by passive voice, nominalisation, and impersonal constructions.\n\n"
        "### Style vs Register\n"
        "**Style** is the specific set of word choices, sentence structures, and tone that sits *within* a register. "
        "Two texts can share the same formal register but differ in style: a legal brief vs an academic essay are both formal but sound very different.\n\n"
        "### Why C1 Matters Here\n"
        "At C1, you are expected to **code-switch fluidly** — not just know the rules but apply them naturally "
        "under real-time communicative pressure. This means rewriting the same idea for a friend, a professor, and a corporate report."
    ),
    "register_levels": [
        {
            "id": "informal",
            "name": "Informal / Casual",
            "korean": "반말 / 구어체",
            "description": "Used with close friends, family (peers), or in very relaxed social situations.",
            "markers": ["~해, ~야, ~지 endings", "Shortened words (뭐해? instead of 무엇을 하고 있습니까?)", "Sentence-final particles 야/아"],
            "example_ko": "야, 오늘 뭐 할 거야?",
            "example_en": "Hey, what are you doing today?"
        },
        {
            "id": "neutral",
            "name": "Neutral / Polite",
            "korean": "존댓말 / 표준어",
            "description": "The standard for most daily interactions with strangers, colleagues, and service staff.",
            "markers": ["~해요, ~세요 endings", "Full subject-object-verb structure", "Polite particles 께서/에서"],
            "example_ko": "오늘 어디 가세요?",
            "example_en": "Where are you going today?"
        },
        {
            "id": "formal",
            "name": "Formal / Academic",
            "korean": "격식체 / 문어체",
            "description": "Used for academic writing, official correspondence, reports, and presentations.",
            "markers": ["~습니다/합니다 endings", "Passive constructions (~어지다, ~게 되다)", "Nominalisation (~함, ~기)", "Impersonal subject 본 연구/본 보고서"],
            "example_ko": "본 회의에서 제안된 내용은 다음과 같습니다.",
            "example_en": "The content proposed in this meeting is as follows."
        }
    ],
    "style_contrast_phrases": [
        {
            "id": "scp_1",
            "concept": "Apologising for being late",
            "informal": {"ko": "미안, 늦었어!", "en": "Sorry, I'm late!"},
            "neutral": {"ko": "죄송합니다, 늦어서 정말 미안해요.", "en": "I'm very sorry for being late."},
            "formal": {"ko": "지연된 점 정중히 사과드립니다.", "en": "I sincerely apologise for the delay."}
        },
        {
            "id": "scp_2",
            "concept": "Requesting information",
            "informal": {"ko": "이거 어떻게 해?", "en": "How do I do this?"},
            "neutral": {"ko": "이것은 어떻게 하면 되나요?", "en": "How does one do this?"},
            "formal": {"ko": "해당 절차에 관하여 안내해 주시기 바랍니다.", "en": "Please guide us regarding the relevant procedure."}
        }
    ],
    "recognition_items": [
        {
            "id": "rec_r1",
            "sentence": "야, 그거 진짜 별로였지?",
            "translation": "Hey, that was really not great, right?",
            "register": "informal",
            "explanation": "'야' (hey) and '~지?' (right?) are typical casual, informal endings used among close friends.",
            "markers": ["야", "~지?", "진짜 별로"]
        },
        {
            "id": "rec_r2",
            "sentence": "오늘 회의 결과는 다음과 같이 공유드립니다.",
            "translation": "The results of today's meeting are shared as follows.",
            "register": "formal",
            "explanation": "'다음과 같이' (as follows) and '공유드립니다' (share with you, honorific) are highly formal written/professional patterns.",
            "markers": ["다음과 같이", "공유드립니다"]
        },
        {
            "id": "rec_r3",
            "sentence": "그 발표는 어땠어요? 재미있었나요?",
            "translation": "How was the presentation? Was it interesting?",
            "register": "neutral",
            "explanation": "~어요/나요 endings are the neutral-polite register standard for everyday social interaction.",
            "markers": ["~어요", "~나요?"]
        }
    ],
    "rewrite_tasks": [
        {
            "id": "rw_r1",
            "original_ko": "선생님, 숙제 내일 내도 돼?",
            "original_en": "Teacher, is it okay to submit homework tomorrow? (casual)",
            "source_register": "informal",
            "target_register": "neutral",
            "model_answer_ko": "선생님, 숙제를 내일 제출해도 될까요?",
            "model_answer_en": "Teacher, may I submit the homework tomorrow?",
            "hints": ["Replace ~돼? with ~될까요?", "Add 를 after 숙제", "Drop casual 내도 → 제출해도"]
        },
        {
            "id": "rw_r2",
            "original_ko": "이 문제에 대해 같이 생각해 봐요.",
            "original_en": "Let's think about this problem together. (neutral/polite)",
            "source_register": "neutral",
            "target_register": "formal",
            "model_answer_ko": "해당 사안에 대하여 논의해 주시기 바랍니다.",
            "model_answer_en": "Please discuss the relevant issue.",
            "hints": ["Replace 이 문제 with 해당 사안", "Replace 같이 생각해 봐요 with 논의해 주시기 바랍니다", "Use ~에 대하여 (formal) instead of ~에 대해"]
        }
    ],
    "context_matching": [
        {
            "id": "cm_1",
            "context": "Writing a company memo to all employees about a schedule change",
            "options": [
                {"id": "cm_1a", "text": "야, 일정 바뀌었어!", "register": "informal", "label": "Casual"},
                {"id": "cm_1b", "text": "일정이 변경되었습니다. 아래 내용을 참고해 주시기 바랍니다.", "register": "formal", "label": "Formal"},
                {"id": "cm_1c", "text": "일정이 바뀌었어요. 확인해 주세요.", "register": "neutral", "label": "Neutral"}
            ],
            "correct_id": "cm_1b",
            "explanation": "Company-wide memos require formal register: impersonal constructions and polite formal verb endings like ~습니다/바랍니다."
        },
        {
            "id": "cm_2",
            "context": "Texting a close university classmate about what to eat for lunch",
            "options": [
                {"id": "cm_2a", "text": "점심 뭐 먹을지 같이 정해요.", "register": "neutral", "label": "Neutral"},
                {"id": "cm_2b", "text": "점심 뭐 먹어?", "register": "informal", "label": "Casual"},
                {"id": "cm_2c", "text": "점심 메뉴를 함께 협의해 보겠습니다.", "register": "formal", "label": "Formal"}
            ],
            "correct_id": "cm_2b",
            "explanation": "Informal texting to close friends uses casual speech (반말) — short, direct questions without honorific endings."
        }
    ],
    "quiz": [
        {
            "id": "q_c1_reg_1",
            "type": "register_identification",
            "question": "What register does this sentence use? '이번 프로젝트 결과는 다음 주에 공유드릴 예정입니다.'",
            "options": [
                "Informal / Casual",
                "Neutral / Polite",
                "Formal / Academic"
            ],
            "correct_answer": "Formal / Academic",
            "explanation": "'공유드릴 예정입니다' (plan to share, formal honorific) and structured nominalized verb ending mark this as professional/formal register."
        },
        {
            "id": "q_c1_reg_2",
            "type": "best_rewrite",
            "question": "Which is the best formal rewrite of: '교수님, 이 내용 잘 이해가 안 가요.'?",
            "options": [
                "교수님, 이거 이해 못하겠어.",
                "교수님, 해당 내용에 대해 보다 자세한 설명을 부탁드려도 될까요?",
                "교수님, 이 내용을 이해하기가 좀 어려운 것 같아요."
            ],
            "correct_answer": "교수님, 해당 내용에 대해 보다 자세한 설명을 부탁드려도 될까요?",
            "explanation": "The formal version uses '해당 내용' (the relevant content), '보다 자세한' (more detailed), and '부탁드려도 될까요?' (may I ask), all hallmarks of formal respectful register."
        },
        {
            "id": "q_c1_reg_3",
            "type": "context_choice",
            "question": "Which sentence is most appropriate for an official email to a government office?",
            "options": [
                "거기 언제 문 열어요?",
                "해당 기관의 운영 시간에 대해 안내해 주시기 바랍니다.",
                "언제 여시나요?"
            ],
            "correct_answer": "해당 기관의 운영 시간에 대해 안내해 주시기 바랍니다.",
            "explanation": "'해당 기관' (the relevant institution), '운영 시간' (operating hours), and '안내해 주시기 바랍니다' (please guide us) are all formal constructions appropriate for official correspondence."
        },
        {
            "id": "q_c1_reg_4",
            "type": "style_difference",
            "question": "What is the main difference between REGISTER and STYLE in Korean?",
            "options": [
                "Register refers to politeness level while style refers to vocabulary choice within a register.",
                "Register and style are the same concept.",
                "Style is more formal than register."
            ],
            "correct_answer": "Register refers to politeness level while style refers to vocabulary choice within a register.",
            "explanation": "Register sets the social appropriateness level (informal/neutral/formal), while style is the particular 'flavour' or word-choice pattern within that register."
        }
    ],
    "homework": [
        {"id": "hw_c1_reg_1", "text": "Take one simple sentence (e.g. '오늘 늦을 것 같아요') and rewrite it in all three registers: informal, neutral, and formal."},
        {"id": "hw_c1_reg_2", "text": "Find a real Korean news article and identify at least 5 formal register markers (e.g. passive voice, nominalisation, ~습니다 endings). Translate each into neutral register."},
        {"id": "hw_c1_reg_3", "text": "Write a short 3-email chain: (1) Casual text to a friend, (2) Polite email to a colleague, (3) Formal letter to a professor — all requesting the same thing."}
    ]
}
