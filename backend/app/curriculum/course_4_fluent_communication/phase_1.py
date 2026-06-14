PHASE_1_DATA = {
    "title": "Korean 4.1 – Keeping the Conversation Going",
    "topic": "Keeping the Conversation Going",
    "description": "Ask follow-up questions, react naturally, and speak more fluently.",
    "estimated_time": "30–35 minutes",
    "goals": [
        "Use reaction phrases and conversation fillers to sound more natural",
        "Ask follow-up questions instead of stopping after one answer",
        "Use simple repair phrases when you don't understand"
    ],
    "prerequisites": "Korean 3.6 – B1 Conversations & Stories (Capstone)",
    "status": "locked",
    "content_markdown": (
        "# Korean 4.1 – Keeping the Conversation Going\n\n"
        "### B1 Fluency Goal\n"
        "At this level, you shouldn't only answer questions—you should react, ask questions back, and keep the conversation alive.\n\n"
        "### Conversation Moves & Fillers\n"
        "To sound natural, intermediate speakers use three categories of conversational moves:\n"
        "1. **Reactions (리액션):** Show interest or empathy (e.g. 진짜요?, 대단하네요!).\n"
        "2. **Follow-up questions (질문하기):** Keep the focus moving (e.g. 어땠어요?, 그 다음에는 뭐 했어요?).\n"
        "3. **Repair & Clarification (다시 묻기):** Clear up confusion smoothly (e.g. 무슨 뜻이에요?, 다시 말씀해 주시겠어요?)."
    ),
    "conversation_moves": [
        {"ko": "진짜요?", "rom": "Jinjja-yo?", "en": "Really?", "tag": "reaction"},
        {"ko": "대단하네요!", "rom": "Daedan-haneyo!", "en": "That's great / amazing!", "tag": "reaction"},
        {"ko": "아쉽네요.", "rom": "Aswipneyo.", "en": "What a pity / That's too bad.", "tag": "reaction"},
        {"ko": "어땠어요?", "rom": "Eottaess-eoyo?", "en": "How was it?", "tag": "follow-up"},
        {"ko": "그 다음에는 뭐 했어요?", "rom": "Geu daeum-eneun mwo haess-eoyo?", "en": "What did you do then?", "tag": "follow-up"},
        {"ko": "무슨 뜻이에요?", "rom": "Museun tteus-ieyo?", "en": "What do you mean?", "tag": "repair"},
        {"ko": "다시 말씀해 주시겠어요?", "rom": "Dasi malsseum-hae jusigess-eoyo?", "en": "Could you say that again?", "tag": "repair"}
    ],
    "short_vs_flowing_examples": {
        "short": {
            "title": "Short (Dead End)",
            "a": "어제 뭐 했어요? (What did you do yesterday?)",
            "b": "공부했어요. (I studied.)"
        },
        "flowing": {
            "title": "Flowing (Continued)",
            "a": "어제 뭐 했어요? (What did you do yesterday?)",
            "b": "시험이 있어서 도서관에서 공부했어요. 진짜 어려웠어요. 영호 씨는 어제 뭐 했어요? (I studied at the library because of an exam. It was really hard. What did you do yesterday, Yeongho?)"
        }
    },
    "guided_practice": {
        "items": [
            {
                "id": "flu_rec_1",
                "question": "어제 뭐 했어요? (What did you do yesterday?)",
                "opt_a": "집에서 쉬었어요. (I rested at home. - Short / Ends flow)",
                "opt_b": "집에서 책을 읽으면서 쉬었어요. 아주 힐링이 됐어요. 친구는 주말에 뭐 했어요? (I read books and rested at home. It was very healing. What did you do over the weekend?)",
                "correct_option": "B",
                "explanation": "Option B uses multiple details and asks a question back ('친구는 주말에 뭐 했어요?'), keeping the conversation flowing."
            }
        ]
    },
    "build_templates": {
        "partner_lines": [
            {"id": "pt_1", "text": "지난주에 감기에 걸려서 많이 아팠어요. (I caught a cold last week and was very sick.)", "suggested_reactions": ["아쉽네요.", "진짜요?"], "suggested_followups": ["지금은 괜찮아요?", "어떻게 아팠어요?"]}
        ]
    },
    "quickfire": [
        {"id": "qf_1", "partner_line": "새로운 운동을 시작했어요.", "options": ["어땠어요?", "무슨 뜻이에요?", "아쉽네요."], "correct": "어땠어요?", "explanation": "Asking 'How was it?' (어땠어요?) is the most natural follow-up to someone starting a new exercise."}
    ],
    "quiz": [
        {
            "id": "q_b1_flu_1",
            "type": "followup_select",
            "question": "Pick the best follow-up question for: '새 자전거를 샀어요.' (I bought a new bicycle.)",
            "options": [
                "어디에서 샀어요? 마음에 들어요? (Where did you buy it? Do you like it?)",
                "저는 매일 밥을 먹어요. (I eat food every day.)",
                "비가 올 것 같아요. (I think it will rain.)"
            ],
            "correct_answer": "어디에서 샀어요? 마음에 들어요? (Where did you buy it? Do you like it?)",
            "explanation": "Asking where they bought it and if they like it shows interest and keeps the conversation active."
        },
        {
            "id": "q_b1_flu_2",
            "type": "reaction_select",
            "question": "Which reaction fits best when someone says: '어제 지갑과 휴대폰을 다 잃어버렸어요.' (I lost both my wallet and phone yesterday.)",
            "options": [
                "아이구, 어떡해요! 많이 속상하시겠어요. (Oh no, what should you do! You must be very upset.)",
                "대단하네요! 축하해요. (That's amazing! Congratulations.)",
                "안녕하세요. 반갑습니다. (Hello. Nice to meet you.)"
            ],
            "correct_answer": "아이구, 어떡해요! 많이 속상하시겠어요. (Oh no, what should you do! You must be very upset.)",
            "explanation": "Expressing concern and sympathy is the only natural response to losing valuables."
        },
        {
            "id": "q_b1_flu_3",
            "type": "repair_select",
            "question": "If your conversation partner speaks too quickly and you missed the last part, which repair phrase is most appropriate?",
            "options": [
                "죄송하지만 조금만 더 천천히 말씀해 주시겠어요? (I am sorry, but could you please speak a little slower?)",
                "왜 늦었어요? (Why are you late?)",
                "내일 학교에 안 갈 거예요. (I am not going to school tomorrow.)"
            ],
            "correct_answer": "죄송하지만 조금만 더 천천히 말씀해 주시겠어요? (I am sorry, but could you please speak a little slower?)",
            "explanation": "Politely requesting slower speech is a standard B1 repair technique to resolve comprehension gaps."
        }
    ],
    "homework": [
        {"id": "hw_b1_flu_1", "text": "Write 5 conversation pairs in Korean showing a reaction phrase and a follow-up question to your partner's statement."},
        {"id": "hw_b1_flu_2", "text": "Record a 2-minute monologue imagining a dialogue where you use at least 3 reaction and 3 follow-up moves."},
        {"id": "hw_b1_flu_3", "text": "Write a 3-sentence self-reflection about what you find most challenging when trying to keep a Korean conversation flowing."}
    ]
}
