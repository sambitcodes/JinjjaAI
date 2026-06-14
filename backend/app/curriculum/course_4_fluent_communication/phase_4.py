PHASE_4_DATA = {
    "title": "Korean 4.4 – Politeness & Register in Real Life",
    "topic": "Politeness & Register in Real Life",
    "description": "Speak differently with friends, teachers, and staff.",
    "estimated_time": "30–35 minutes",
    "goals": [
        "Recognize when speech is casual, polite, or more formal",
        "Adjust your Korean when speaking to friends, older people, and staff",
        "Use softening phrases for polite disagreement and requests"
    ],
    "prerequisites": "Korean 4.3 – Social & Study/Work Conversations",
    "status": "locked",
    "content_markdown": (
        "# Korean 4.4 – Politeness & Register in Real Life\n\n"
        "### B1 Politeness & Register Goal\n"
        "At B1, you should understand how to change your speech level and language register depending on who you're talking to and the situation.\n\n"
        "### Register & Contexts\n"
        "1. **Friend/Close Classmate (친구/반말):** Casual register, direct style.\n"
        "2. **Teacher/Elder/Boss (선생님/존댓말/높임말):** Respectful register, polite verb endings (-(으)십니다, -아요/어요), honorific vocab.\n"
        "3. **Service Staff (점원/존댓말):** Polite, set phrases, standard polite register."
    ),
    "contexts": ["friend", "teacher", "staff"],
    "register_examples": [
        {
            "meaning": "Can we meet tomorrow?",
            "friend": "내일 만날까?",
            "teacher": "선생님, 내일 뵐 수 있을까요?",
            "staff": "내일 뵙겠습니다."
        },
        {
            "meaning": "I don't agree with that.",
            "friend": "난 그렇게 생각 안 해.",
            "teacher": "그 부분은 잘 모르겠습니다.",
            "staff": "그건 조금 어려울 것 같습니다."
        }
    ],
    "softening_phrases": [
        {"ko": "그건 잘 모르겠어요.", "rom": "Geugeon jal moreugess-eoyo.", "en": "I'm not sure about that.", "tag": "disagreement"},
        {"ko": "죄송하지만 조금 어려울 것 같아요.", "rom": "Joesong-hajiman jogeum eoryeoul geot gat-ayo.", "en": "I'm sorry, but I think that might be difficult.", "tag": "disagreement"},
        {"ko": "혹시 시간 있으세요?", "rom": "Hoksi sigan isseuseyo?", "en": "Do you happen to have time?", "tag": "request"}
    ],
    "recognition_items": [
        {
            "id": "reg_rec_1",
            "sentence": "내일 올 수 있어? (Can you come tomorrow?)",
            "gloss": "Casual language / Banmal",
            "listener": "friend",
            "appropriateness": "OK for friend, too casual for teacher",
            "choices_listener": ["friend", "teacher", "staff"]
        },
        {
            "id": "reg_rec_2",
            "sentence": "죄송하지만 다시 말씀해 주시겠습니까? (Excuse me, but could you say that again?)",
            "gloss": "Formal respectful register",
            "listener": "teacher",
            "appropriateness": "Just right for teacher/boss",
            "choices_listener": ["friend", "teacher", "staff"]
        }
    ],
    "transform_templates": [
        {
            "id": "trans_1",
            "base_meaning": "Can you help me with this?",
            "neutral_ko": "이것 좀 도와줘.",
            "friend_ver": "이것 좀 도와줄래?",
            "teacher_ver": "이것 좀 도와주실 수 있으세요?",
            "staff_ver": "도움이 좀 필요합니다."
        }
    ],
    "quiz": [
        {
            "id": "q_b1_reg_1",
            "type": "situation_choice",
            "question": "You want to ask your professor a question about homework. Choose the best phrase.",
            "options": [
                "교수님, 질문이 하나 있는데요. 시간 있으세요? (Professor, I have a question. Do you have time?)",
                "야, 이것 좀 도와줘. (Hey, help me with this.)",
                "이거 얼마입니까? (How much is this?)"
            ],
            "correct_answer": "교수님, 질문이 하나 있는데요. 시간 있으세요? (Professor, I have a question. Do you have time?)",
            "explanation": "Addressing the professor with '교수님' and using polite honorific registers is correct."
        },
        {
            "id": "q_b1_reg_2",
            "type": "register_class",
            "question": "Classify this sentence: '내일 만날까?' (Shall we meet tomorrow?)",
            "options": [
                "Casual style (Banmal)",
                "Respectful style (Nopimmal)",
                "Service/Customer style"
            ],
            "correct_answer": "Casual style (Banmal)",
            "explanation": "'~ㄹ까?' without '요' represents casual banmal speech register used between friends."
        },
        {
            "id": "q_b1_reg_3",
            "type": "politeness_level",
            "question": "Which response represents a polite softened disagreement?",
            "options": [
                "그건 조금 어려울 것 같아요. (I think that might be a bit difficult.)",
                "틀렸어요. (You are wrong.)",
                "싫어요. (I hate/dislike it.)"
            ],
            "correct_answer": "그건 조금 어려울 것 같아요. (I think that might be a bit difficult.)",
            "explanation": "'~ㄹ 것 같아요' is a typical softening pattern in Korean to express disagreement politely."
        }
    ],
    "homework": [
        {"id": "hw_b1_reg_1", "text": "Write 3 sets of sentences (Friend/Teacher/Staff variants) for: 'Can you help me?'"},
        {"id": "hw_b1_reg_2", "text": "Write 3 polite disagreement sentences using softening starters."},
        {"id": "hw_b1_reg_3", "text": "Write a short reflection about which speech level (casual vs respectful) is harder to manage in conversations."}
    ]
}
