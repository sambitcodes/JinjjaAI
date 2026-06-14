PHASE_5_DATA = {
    "title": "Korean 5.5 – Implicit Meaning & 'Reading Between the Lines'",
    "topic": "Implicit Meaning & Indirect Speech",
    "description": "Understand hints, indirectness, and subtext in Korean.",
    "estimated_time": "35–45 minutes",
    "goals": [
        "Recognise implied meaning in conversations, messages, and stories",
        "Interpret polite hints, indirect refusals, and emotional subtext",
        "Respond appropriately when the real message is not said directly"
    ],
    "prerequisites": "Korean 5.4 – High-Level Register & Style",
    "status": "locked",
    "content_markdown": (
        "# Korean 5.5 – Implicit Meaning & 'Reading Between the Lines'\n\n"
        "### C1 Goal: Implicit Meaning\n"
        "At C1, you can understand longer, demanding texts and **recognise implicit meaning** — "
        "what people *suggest* without saying it directly.\n\n"
        "### Reading Between the Lines\n"
        "**Reading between the lines** means looking beyond the literal words to infer the "
        "real message or emotion the speaker intends. A sentence's *form* (question, statement) "
        "often does not match its *function* (request, refusal, suggestion).\n\n"
        "### Indirect Speech Acts\n"
        "An **indirect speech act** occurs when what is said is not what is meant:\n"
        "- '이제 좀 늦지 않았나요?' (Isn't it getting a bit late now?) → real function: *end the meeting*\n"
        "- '요즘 좀 바빠서…' (These days I'm a bit busy…) → real function: *polite refusal*\n\n"
        "### Politeness & Face\n"
        "People use **indirectness to protect face** — both their own and others'. "
        "In Korean, direct refusals, criticism, or requests can feel aggressive or rude. "
        "Experienced speakers choose soft forms that carry the message indirectly.\n\n"
        "### Inference as a Skill\n"
        "**Inference** means using available clues — words, tone, context, relationship — "
        "to reconstruct the speaker's real intent. At C1, you should be able to do this "
        "rapidly, even in real-time conversation."
    ),
    "implicit_patterns": [
        {
            "id": "ip_1",
            "category": "refusal",
            "pattern_en": "Polite refusal disguised as a soft excuse",
            "korean_example": "확인해 봐야 할 것 같아요.",
            "literal_en": "I think I'll have to check.",
            "real_meaning_en": "I probably can't / I'm not interested, but I don't want to say no directly.",
            "clues": ["봐야 할 것 같아요 (tentative obligation)", "not a firm yes or no"]
        },
        {
            "id": "ip_2",
            "category": "refusal",
            "pattern_en": "Busyness as indirect refusal",
            "korean_example": "요즘 좀 많이 바빠서요…",
            "literal_en": "These days I'm a bit busy…",
            "real_meaning_en": "I can't or don't want to, but I'm softening the refusal with an excuse.",
            "clues": ["trailing 서요... (reason + trailing off)", "no explicit no"]
        },
        {
            "id": "ip_3",
            "category": "hint",
            "pattern_en": "Indirect suggestion through a concern",
            "korean_example": "거기는 주차가 좀 힘들지 않나요?",
            "literal_en": "Isn't parking a bit difficult there?",
            "real_meaning_en": "I'd prefer we go somewhere else / Please suggest a different place.",
            "clues": ["question form used as suggestion", "mentions inconvenience without direct request"]
        },
        {
            "id": "ip_4",
            "category": "criticism",
            "pattern_en": "Understated disappointment / indirect criticism",
            "korean_example": "생각보다 조금 아쉽네요.",
            "literal_en": "It's a little disappointing compared to what I expected.",
            "real_meaning_en": "I'm quite unhappy with this / This wasn't good enough.",
            "clues": ["아쉽다 (bittersweet/disappointed)", "조금 (a little — understatement)"]
        },
        {
            "id": "ip_5",
            "category": "emotional_subtext",
            "pattern_en": "Gratitude expressed through self-deprecation",
            "korean_example": "아이고, 제가 뭐 도움이 됐겠어요…",
            "literal_en": "Oh my, I don't think I was much help…",
            "real_meaning_en": "Thank you — I'm touched you think so (humble expression of gratitude).",
            "clues": ["self-deprecating form used to accept/deflect praise", "아이고 (emotional exclamation)"]
        }
    ],
    "recognition_dialogues": [
        {
            "id": "rd_1",
            "category": "refusal",
            "scenario": "A friend invites you to a weekend trip.",
            "dialogue_ko": "A: 이번 주말에 같이 여행 갈래?\nB: 어… 이번 주말은 집에 좀 볼일이 있어서요.",
            "dialogue_en": "A: Want to go on a trip together this weekend?\nB: Um… this weekend I have some things to take care of at home.",
            "question": "What does B really mean?",
            "options": [
                "B is genuinely busy with chores at home.",
                "B is politely declining the invitation.",
                "B wants to reschedule for next weekend."
            ],
            "correct_idx": 1,
            "explanation": "'볼일이 있어서요' (I have things to do) is a classic soft excuse used to decline invitations indirectly. The trailing 요 and vague nature of 'bolil' (errands/business) signal polite refusal.",
            "clue_phrases": ["볼일이 있어서요", "trailing off with 서요"]
        },
        {
            "id": "rd_2",
            "category": "hint",
            "scenario": "During a long meeting, a senior colleague says:",
            "dialogue_ko": "A: 슬슬 다들 피곤하지 않으세요?\nB: 맞아요, 오늘 많이 했네요.",
            "dialogue_en": "A: Isn't everyone getting tired by now?\nB: That's right, we've covered a lot today.",
            "question": "What is A really suggesting?",
            "options": [
                "A is asking a genuine question about fatigue.",
                "A is hinting that the meeting should end.",
                "A wants to take a short break."
            ],
            "correct_idx": 1,
            "explanation": "'슬슬 피곤하지 않으세요?' uses a rhetorical question about tiredness to indirectly signal it's time to wrap up — a common indirect speech act in Korean professional settings.",
            "clue_phrases": ["슬슬 (gradually/now)", "피곤하지 않으세요? (rhetorical)"]
        },
        {
            "id": "rd_3",
            "category": "criticism",
            "scenario": "A manager reviews a report:",
            "dialogue_ko": "팀장님: 수고했어요. 근데 이 부분은 조금 더 구체적으로 다듬어 봤으면 좋겠어요.",
            "dialogue_en": "Manager: Good work. But I'd like this part to be refined a bit more concretely.",
            "question": "What is the manager really communicating?",
            "options": [
                "The report is excellent overall.",
                "This section needs significant improvement.",
                "The manager is unsure what they want."
            ],
            "correct_idx": 1,
            "explanation": "Opening with '수고했어요' (good work) softens a critique. '조금 더 구체적으로 다듬어 봤으면 좋겠어요' is indirect criticism — the 'I'd like it if…' construction is a polite but clear signal that the work isn't satisfactory.",
            "clue_phrases": ["조금 더 (a bit more — understatement)", "다듬어 봤으면 좋겠어요 (I'd like it revised)"]
        }
    ],
    "yes_no_maybe_items": [
        {
            "id": "ynm_1",
            "context": "You invite a colleague to lunch.",
            "reply_ko": "어, 가고 싶은데 오늘 점심에 해야 할 것들이 좀 있어요.",
            "reply_en": "Oh, I'd love to, but I have some things I need to do during lunch today.",
            "answer": "polite_no",
            "explanation": "'가고 싶은데' (I'd like to go, but…) followed by a reason is a classic polite no pattern — the desire is expressed positively to soften the refusal."
        },
        {
            "id": "ynm_2",
            "context": "You ask a friend if they liked the movie.",
            "reply_ko": "음… 나쁘지는 않았어. 그냥 내 취향이랑 조금 달랐을 뿐이야.",
            "reply_en": "Hmm… it wasn't bad. It just wasn't quite my taste.",
            "answer": "polite_no",
            "explanation": "'나쁘지는 않았어' (it wasn't bad) and 'it just wasn't my taste' together communicate dislike without a blunt statement."
        },
        {
            "id": "ynm_3",
            "context": "You ask a colleague to review your presentation.",
            "reply_ko": "네, 물론이죠! 내일 오전에 시간 내볼게요.",
            "reply_en": "Yes, of course! I'll make time tomorrow morning.",
            "answer": "yes",
            "explanation": "A clear, direct yes with a specific time commitment — no hedging or vague excuses."
        }
    ],
    "emotion_inference_items": [
        {
            "id": "ei_1",
            "snippet_ko": "아, 뭐 어떡해… 그냥 이미 지난 일인데.",
            "snippet_en": "Ah, what can you do… it's already in the past.",
            "options": ["Happy", "Relieved", "Resigned / disappointed", "Angry"],
            "correct": "Resigned / disappointed",
            "explanation": "'어떡해' (what can one do) and framing it as 'already past' suggests resigned acceptance of something unwanted — a quiet expression of disappointment or regret."
        },
        {
            "id": "ei_2",
            "snippet_ko": "진짜? 그럼 나만 몰랐던 거야?",
            "snippet_en": "Really? So I was the only one who didn't know?",
            "options": ["Pleased", "Embarrassed / annoyed", "Curious", "Indifferent"],
            "correct": "Embarrassed / annoyed",
            "explanation": "The rhetorical question '나만 몰랐던 거야?' (I was the only one who didn't know?) signals embarrassment mixed with mild annoyance at being left out."
        }
    ],
    "soften_templates": [
        {
            "id": "st_1",
            "direct_ko": "싫어요. 안 갈 거예요.",
            "direct_en": "I don't want to. I'm not going.",
            "indirect_options": [
                {"ko": "저는 그날 좀 어려울 것 같아요.", "en": "That day might be a bit difficult for me.", "label": "Soft excuse"},
                {"ko": "좋긴 한데, 상황을 좀 봐야 할 것 같아요.", "en": "It sounds nice, but I'll need to see how things go.", "label": "Hedged maybe"}
            ]
        },
        {
            "id": "st_2",
            "direct_ko": "이 보고서는 별로예요. 다시 쓰세요.",
            "direct_en": "This report isn't good. Please rewrite it.",
            "indirect_options": [
                {"ko": "이 부분을 조금 더 구체적으로 다듬어 주시면 더 좋을 것 같아요.", "en": "I think it would be better if this part were refined a bit more concretely.", "label": "Polite suggestion"},
                {"ko": "전체적으로 방향을 다시 한번 점검해 보시는 게 좋을 것 같습니다.", "en": "It might be good to review the overall direction once more.", "label": "Indirect rewrite request"}
            ]
        }
    ],
    "response_templates": [
        {
            "id": "rt_1",
            "scenario": "Your friend indirectly says they don't want to meet at the same café again.",
            "implicit_line_ko": "거기는 항상 자리가 없더라고… 근처에 새로 생긴 데도 있던데.",
            "implicit_line_en": "There's never any seats there… I heard there's a new place nearby.",
            "real_meaning": "I'd prefer a different café.",
            "model_response_ko": "오, 맞아! 그럼 그 새로 생긴 데로 가볼까? 나도 거기 궁금했어.",
            "model_response_en": "Oh, right! Shall we try that new place then? I was curious about it too.",
            "key_skill": "Pick up on the hint and agree naturally without making the other person feel they had to ask directly."
        },
        {
            "id": "rt_2",
            "scenario": "A colleague hints they are overwhelmed with their current workload.",
            "implicit_line_ko": "요즘 일이 좀 많이 쌓여서 정신이 없네요…",
            "implicit_line_en": "These days work has piled up and I'm all over the place…",
            "real_meaning": "I'm struggling / overwhelmed — possibly a hint for help or sympathy.",
            "model_response_ko": "많이 힘드시겠어요. 혹시 제가 도울 수 있는 게 있으면 말씀해 주세요.",
            "model_response_en": "That sounds really tough. Please let me know if there's anything I can help with.",
            "key_skill": "Acknowledge the implied distress and offer support without forcing them to ask explicitly."
        }
    ],
    "quiz": [
        {
            "id": "q_c1_imp_1",
            "type": "implicit_meaning",
            "question": "What does this reply really mean? '좋긴 한데, 이번엔 좀 어려울 것 같아요.'",
            "options": [
                "A genuine yes with enthusiasm.",
                "A polite refusal or strong hesitation.",
                "A request for more information."
            ],
            "correct_answer": "A polite refusal or strong hesitation.",
            "explanation": "'좋긴 한데' (it sounds good, but…) concedes positively before introducing a vague obstacle — a textbook soft refusal pattern in Korean."
        },
        {
            "id": "q_c1_imp_2",
            "type": "speech_act_function",
            "question": "What is the real communicative function of: '이 방이 좀 더운 것 같지 않아요?'",
            "options": [
                "A genuine question about room temperature.",
                "An indirect request to open a window or adjust the temperature.",
                "A complaint directed at someone personally."
            ],
            "correct_answer": "An indirect request to open a window or adjust the temperature.",
            "explanation": "A rhetorical observation about discomfort ('isn't this room a bit hot?') is a classic indirect speech act — the form is a question but the function is a polite request for action."
        },
        {
            "id": "q_c1_imp_3",
            "type": "yes_no_maybe",
            "question": "Classify this response: '한번 생각해 볼게요…' (I'll think about it once…)",
            "options": [
                "Yes",
                "Polite No / Unsure (likely decline)",
                "Definite maybe"
            ],
            "correct_answer": "Polite No / Unsure (likely decline)",
            "explanation": "'한번 생각해 볼게요' (I'll think about it) followed by trailing off is almost always a polite way of declining without a direct no — the '한번' (just once) and vagueness signal low commitment."
        },
        {
            "id": "q_c1_imp_4",
            "type": "emotion_inference",
            "question": "How does the speaker probably feel? '뭐, 그게 최선이었겠지.'",
            "options": [
                "Satisfied and happy.",
                "Resigned / quietly disappointed.",
                "Excited about the outcome."
            ],
            "correct_answer": "Resigned / quietly disappointed.",
            "explanation": "'최선이었겠지' (I suppose that was the best one could do) uses '겠지' (I suppose/must have) to express reluctant acceptance — the emotion is resignation or quiet disappointment, not satisfaction."
        },
        {
            "id": "q_c1_imp_5",
            "type": "response_strategy",
            "question": "Your friend says: '거기 주차가 좀 불편하더라고.' Which reply best shows you understood the real message?",
            "options": [
                "'그래? 나는 괜찮았는데.' (Really? I was fine with it.)",
                "'맞아, 그럼 이번엔 다른 데로 갈까?' (Right, shall we go somewhere else this time?)",
                "'주차장이 작긴 해도 그냥 걸어가면 되잖아.' (The car park is small but you can just walk.)"
            ],
            "correct_answer": "'맞아, 그럼 이번엔 다른 데로 갈까?' (Right, shall we go somewhere else this time?)",
            "explanation": "The friend is hinting they'd prefer a different venue. Acknowledging the hint and smoothly proposing an alternative shows you understood the implied message — more so than deflecting or dismissing the concern."
        }
    ],
    "homework": [
        {
            "id": "hw_c1_imp_1",
            "text": "Find a short Korean dialogue (drama, webtoon, or real conversation). Identify at least 3 lines where the speaker's meaning is different from the literal words. Write: (1) the original line, (2) what you think it really means, (3) the clues that helped you (words, tone, context)."
        },
        {
            "id": "hw_c1_imp_2",
            "text": "Take 3 direct Korean sentences (a blunt refusal, a direct criticism, and a direct request) and rewrite each as an indirect, polite hint. Compare the direct and indirect versions and note what changed."
        },
        {
            "id": "hw_c1_imp_3",
            "text": "In 3–4 sentences (Korean or English), reflect: How does your own culture signal polite refusal or disagreement? How does Korean do it differently? Where do you personally need to be more careful when interpreting or producing indirect speech in Korean?"
        }
    ]
}
