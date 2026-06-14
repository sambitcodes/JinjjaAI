PHASE_6_DATA = {
    "title": "Korean 5.6 – C1 Real-World Communication (Capstone)",
    "topic": "Integrated C1 Scenario-Based Communication",
    "description": "Handle complex situations in Korean with nuance and confidence.",
    "estimated_time": "45–60 minutes",
    "goals": [
        "Navigate multi-step real-life scenarios in Korean (social, academic, professional)",
        "Use idioms, nuanced stance, and appropriate register in integrated tasks",
        "Show you can understand implicit meaning and respond naturally at C1 level"
    ],
    "prerequisites": "Korean 5.5 – Implicit Meaning & 'Reading Between the Lines'",
    "status": "locked",
    "skills_targeted": [
        {"id": "idioms", "label": "Idioms & Natural Expressions", "icon": "sparkles"},
        {"id": "stance", "label": "Nuanced Stance & Hedging", "icon": "sliders"},
        {"id": "register", "label": "Register & Style Switching", "icon": "layers"},
        {"id": "subtext", "label": "Subtext & Implicit Meaning", "icon": "eye"},
        {"id": "fluency", "label": "Coherence & Fluency", "icon": "activity"}
    ],
    "content_markdown": (
        "# Korean 5.6 – C1 Real-World Communication (Capstone)\n\n"
        "### C1 Real-World Goal\n"
        "At C1, you can use language **flexibly and effectively** for social, academic, and professional purposes, "
        "and understand implicit meaning even in demanding situations.\n\n"
        "### Why Scenario-Based?\n"
        "Real communication is never just one skill. In this capstone, you work through **multi-stage scenarios** — "
        "a small 'story' with real goals, realistic context, and several linked activities (messages, conversations, decisions). "
        "This mirrors how C1 is assessed in modern language examinations.\n\n"
        "### What This Capstone Checks\n"
        "- Can you understand and respond to complex, indirect messages?\n"
        "- Can you adapt your style to social vs academic vs professional interlocutors?\n"
        "- Do you use idioms, nuanced stance, and connectors naturally?\n"
        "- Can you manage a problem and describe it clearly afterward?\n\n"
        "### Three Scenario Tracks\n"
        "**Social / Personal (Scenario A):** Sensitive conversations, personal issues, storytelling.\n"
        "**Academic (Scenario B):** Group project conflict, professor email, spoken summary.\n"
        "**Professional (Scenario C):** Client dissatisfaction, internal discussion, written update."
    ),
    "preview_scenarios": [
        {
            "id": "scenario_a",
            "type": "social",
            "label": "Scenario A – Social / Personal",
            "subtitle": "Difficult Conversation Day",
            "description": "A close friend reaches out with a personal concern. You need to interpret the implicit emotion, reply with sensitivity and appropriate Korean idioms, then later describe the situation to someone else.",
            "skills": ["subtext", "idioms", "stance"],
            "snapshots": [
                {
                    "id": "a_s1",
                    "label": "Problem appears",
                    "ko": "야, 있잖아… 요즘 우리 사이가 좀 어색한 것 같아서. 내가 뭔가 잘못한 게 있어?",
                    "en": "Hey, you know… I feel like things have been a bit awkward between us lately. Did I do something wrong?",
                    "challenge_question": "What is the main communicative challenge here?",
                    "challenge_options": ["Grammar accuracy", "Interpreting emotional subtext and implicit concern", "Choosing formal vocabulary"],
                    "challenge_correct": 1
                },
                {
                    "id": "a_s2",
                    "label": "Solution discussion",
                    "ko": "어… 딱히 그런 건 아닌데, 요즘 내가 좀 바빠서 신경을 많이 못 쓴 것 같아. 미안해.",
                    "en": "Hmm… it's not exactly that, but I think I've been too busy lately and haven't been paying enough attention. Sorry.",
                    "challenge_question": "What stance level is most appropriate for this apology?",
                    "challenge_options": ["Strong / Direct", "Balanced / Cautious (acknowledge without over-committing)", "Tentative / Avoidant"],
                    "challenge_correct": 1
                },
                {
                    "id": "a_s3",
                    "label": "Follow-up message",
                    "ko": "고마워. 그냥 솔직하게 말해줘서 다행이야. 앞으로 더 자주 연락하자.",
                    "en": "Thanks. I'm just glad you told me honestly. Let's keep in touch more often from now on.",
                    "challenge_question": "Which Korean 5 skill is most on display here?",
                    "challenge_options": ["Formal register", "Emotional subtext & natural idioms", "Academic vocabulary"],
                    "challenge_correct": 1
                }
            ]
        },
        {
            "id": "scenario_b",
            "type": "academic",
            "label": "Scenario B – Academic",
            "subtitle": "Project & Professor Day",
            "description": "A group project teammate is not contributing. You negotiate a solution with the team, then draft a polite email to your professor explaining the situation.",
            "skills": ["register", "stance", "idioms"],
            "snapshots": [
                {
                    "id": "b_s1",
                    "label": "Problem appears",
                    "ko": "팀원한테서 연락이 없어요. 제출 기한이 사흘밖에 안 남았는데 어떡하죠?",
                    "en": "There's no word from one of the team members. We have only three days until the deadline — what should we do?",
                    "challenge_question": "What is the best first communicative step?",
                    "challenge_options": ["Immediately email the professor", "Discuss the situation within the team first (semi-formal register)", "Ignore it and hope for the best"],
                    "challenge_correct": 1
                },
                {
                    "id": "b_s2",
                    "label": "Solution discussion",
                    "ko": "일단 팀 내에서 역할을 다시 나눠서 진행하고, 교수님께 상황을 설명드리는 게 좋을 것 같아요.",
                    "en": "For now, it might be best to redistribute roles within the team and let the professor know about the situation.",
                    "challenge_question": "What register should the professor email use?",
                    "challenge_options": ["Informal/casual", "Neutral/polite", "Formal/academic with appropriate hedging"],
                    "challenge_correct": 2
                },
                {
                    "id": "b_s3",
                    "label": "Follow-up email",
                    "ko": "교수님, 저희 팀에서 한 가지 여쭤봐도 될까요? 팀원 중 한 명과 연락이 되지 않아 일정 조정이 필요할 것 같습니다.",
                    "en": "Professor, may we ask you something? We have been unable to reach one team member and may need to adjust our schedule.",
                    "challenge_question": "Which formal register marker is correctly used here?",
                    "challenge_options": ["여쭤봐도 될까요? (honorific request form)", "연락이 안 돼요 (casual)", "일정 바꿔야 해요 (blunt)"],
                    "challenge_correct": 0
                }
            ]
        },
        {
            "id": "scenario_c",
            "type": "professional",
            "label": "Scenario C – Professional",
            "subtitle": "Client & Team Day",
            "description": "A client is dissatisfied with a deliverable. You discuss the response strategy with your team, draft a professional client reply, then give a brief spoken summary of next steps.",
            "skills": ["register", "subtext", "stance"],
            "snapshots": [
                {
                    "id": "c_s1",
                    "label": "Problem appears",
                    "ko": "고객사에서 이런 메시지가 왔어요: '기대했던 것과 조금 달라서 아쉽네요.'",
                    "en": "This message came from the client: 'It's a little disappointing that it's different from what we expected.'",
                    "challenge_question": "What is the client really communicating?",
                    "challenge_options": ["Mild preference for something different", "Significant dissatisfaction — implicit complaint requiring action", "A compliment"],
                    "challenge_correct": 1
                },
                {
                    "id": "c_s2",
                    "label": "Internal discussion",
                    "ko": "일단 고객 의견을 충분히 반영해서 수정안을 드리고, 다음 단계를 명확하게 안내드리는 게 좋겠습니다.",
                    "en": "For now, it would be best to fully reflect the client's feedback in a revised version and clearly communicate the next steps.",
                    "challenge_question": "What stance best fits this professional reply?",
                    "challenge_options": ["Strong / Assertive (defend original work)", "Balanced — acknowledge concern, offer solution, state next steps", "Tentative / Avoidant"],
                    "challenge_correct": 1
                },
                {
                    "id": "c_s3",
                    "label": "Client reply",
                    "ko": "소중한 의견 주셔서 감사합니다. 말씀하신 부분을 충분히 반영하여 수정 버전을 금주 내로 전달드리겠습니다.",
                    "en": "Thank you for your valuable feedback. We will fully incorporate your comments and deliver a revised version by the end of this week.",
                    "challenge_question": "Which C1 skill makes this reply effective?",
                    "challenge_options": ["Complex grammar", "Professional register + empathy + clear commitment (stance & register)", "Use of informal idioms"],
                    "challenge_correct": 1
                }
            ]
        }
    ],
    "strategy_idiom_options": {
        "social": ["마음이 무겁다 (feel heavy-hearted)", "솔직히 말하면 (to be honest)", "눈치를 보다 (read the room)", "마음을 털어놓다 (open up / confide)", "발걸음이 가볍다 (feel relieved)"],
        "academic": ["머리를 맞대다 (put heads together)", "발 벗고 나서다 (take proactive action)", "시간을 벌다 (buy time)", "앞장서다 (take the lead)", "해결의 실마리 (clue to a solution)"],
        "professional": ["고객 입장에서 (from the client's perspective)", "기대에 부응하다 (meet expectations)", "한 발 물러서서 (take a step back)", "상황을 정리하다 (take stock of the situation)", "차질 없이 진행하다 (proceed without disruption)"]
    },
    "capstone_scenarios": [
        {
            "id": "cap_a",
            "type": "social",
            "title": "Scenario A – Difficult Conversation Day",
            "intro_ko": "친한 친구에게서 메시지가 왔습니다. 친구가 뭔가 마음이 불편한 것 같은데, 직접적으로 말하지는 않네요.",
            "intro_en": "You received a message from a close friend. They seem a bit upset about something but aren't saying it directly.",
            "stages": ["Input & Understanding", "Reply to Friend", "Written Update", "Spoken Summary"],
            "input_message_ko": "야, 나 요즘 뭔가 좀 힘드네. 다들 바쁘니까 뭐 딱히 뭐라 할 수는 없지만… 그냥 가끔 나 혼자인 것 같은 느낌? 아무튼, 잘 지내지?",
            "input_message_en": "Hey, things have been a bit tough lately. I can't really say anything since everyone's busy but… I just sometimes feel like I'm alone, you know? Anyway, how are you?",
            "comprehension_questions": [
                {
                    "q": "What is the friend really expressing?",
                    "options": ["They are doing fine.", "They feel lonely and are hinting they miss you.", "They are asking for financial help."],
                    "correct": 1
                }
            ]
        },
        {
            "id": "cap_b",
            "type": "academic",
            "title": "Scenario B – Project & Professor Day",
            "intro_ko": "팀 프로젝트가 문제가 생겼습니다. 팀원 한 명이 연락이 되지 않고, 제출 기한이 다가오고 있어요.",
            "intro_en": "Your group project has hit a problem. One team member has gone silent and the deadline is approaching.",
            "stages": ["Read Situation", "Team Chat", "Draft Email", "Spoken Summary"],
            "input_message_ko": "팀장님, 김지호 씨가 3일째 연락이 안 돼요. 제 파트는 다 됐는데 지호 씨 파트가 없으면 제출을 못 할 것 같아요. 어떻게 할까요?",
            "input_message_en": "Team leader, Jiho Kim hasn't been in contact for 3 days. My part is done, but without Jiho's part I don't think we can submit. What should we do?",
            "comprehension_questions": [
                {
                    "q": "What is the most urgent communicative need?",
                    "options": ["Complain to the professor immediately.", "Coordinate within the team and decide on next steps (semi-formal register).", "Abandon the project."],
                    "correct": 1
                }
            ]
        },
        {
            "id": "cap_c",
            "type": "professional",
            "title": "Scenario C – Client & Team Day",
            "intro_ko": "고객사로부터 만족스럽지 못하다는 뉘앙스의 메시지를 받았습니다. 팀 내부 회의를 거쳐 공식 답변을 준비해야 합니다.",
            "intro_en": "You received a message from a client implying dissatisfaction. You need to handle an internal discussion and prepare a formal response.",
            "stages": ["Read Client Message", "Internal Discussion", "Draft Client Reply", "Spoken Summary"],
            "input_message_ko": "전달받은 결과물이 처음 협의했던 방향과 다소 달라 당황스럽습니다. 추가 논의가 필요할 것 같습니다.",
            "input_message_en": "The deliverable we received differs somewhat from the direction we initially agreed on, which is a bit surprising. It seems like further discussion will be needed.",
            "comprehension_questions": [
                {
                    "q": "What is the client's implicit message?",
                    "options": ["They are satisfied but want minor changes.", "They are significantly dissatisfied and expect corrective action.", "They are cancelling the contract."],
                    "correct": 1
                }
            ]
        }
    ],
    "quiz": [
        {
            "id": "q_cap_1",
            "type": "best_next_move",
            "question": "A client sends this message: '전달받은 내용이 기대와 좀 다르네요.' What is the best first communicative move?",
            "options": [
                "Defend your original work and explain why it was correct.",
                "Acknowledge their concern, thank them for the feedback, and offer a revision plan.",
                "Ask them to clarify what they expected in detail before saying anything."
            ],
            "correct_answer": "Acknowledge their concern, thank them for the feedback, and offer a revision plan.",
            "explanation": "At C1 professional level, the priority is empathy + proactive solution. Defending immediately or asking for extensive clarification first risks seeming unresponsive or defensive."
        },
        {
            "id": "q_cap_2",
            "type": "nuanced_reply",
            "question": "Which reply shows the strongest C1-level nuance for: '이번 프로젝트 결과가 생각보다 좀 아쉽습니다.'",
            "options": [
                "'알겠습니다. 수정하겠습니다.' (Understood. We'll fix it.)",
                "'이번 결과물에 아쉬움을 느끼신 점, 충분히 이해합니다. 말씀하신 부분을 반영하여 개선안을 최대한 빠르게 준비해 드리겠습니다.' (I fully understand your disappointment with this deliverable. We will prepare an improved version incorporating your feedback as quickly as possible.)",
                "'저희는 최선을 다했습니다.' (We did our best.)"
            ],
            "correct_answer": "'이번 결과물에 아쉬움을 느끼신 점, 충분히 이해합니다. 말씀하신 부분을 반영하여 개선안을 최대한 빠르게 준비해 드리겠습니다.' (I fully understand your disappointment with this deliverable. We will prepare an improved version incorporating your feedback as quickly as possible.)",
            "explanation": "The C1 reply: (1) validates the emotion ('충분히 이해합니다'), (2) commits to action with appropriate formal language, and (3) uses hedged urgency ('최대한 빠르게'). The others are too abrupt or defensive."
        },
        {
            "id": "q_cap_3",
            "type": "subtext_handling",
            "question": "A friend says: '요즘 같이 밥 먹을 사람이 없더라고…' Which reply shows you understood the implied message?",
            "options": [
                "'그렇구나, 밥이 맛있으면 혼자 먹어도 괜찮잖아.' (I see — if the food is good, eating alone is fine.)",
                "'어, 나도 요즘 시간이 있는데! 이번 주에 같이 밥 먹을까?' (Oh, I have time lately too! Shall we eat together this week?)",
                "'왜? 친구들이 없어?' (Why? Don't you have friends?)"
            ],
            "correct_answer": "'어, 나도 요즘 시간이 있는데! 이번 주에 같이 밥 먹을까?' (Oh, I have time lately too! Shall we eat together this week?)",
            "explanation": "The friend is hinting they feel lonely and want company. The C1 response picks up the implicit invitation and responds warmly without making the friend feel exposed for not asking directly."
        },
        {
            "id": "q_cap_4",
            "type": "scenario_strategy",
            "question": "In a professional complaint situation, what should you prioritise FIRST in your response?",
            "options": [
                "Defending the quality of your work with data.",
                "Showing empathy and understanding before moving to explanation or solution.",
                "Asking detailed clarifying questions before acknowledging any problem."
            ],
            "correct_answer": "Showing empathy and understanding before moving to explanation or solution.",
            "explanation": "C1 professional communication always leads with acknowledgment and empathy ('이해합니다', 'apologies for the inconvenience') — this preserves the relationship before the content. Defending immediately or delaying acknowledgment damages rapport."
        },
        {
            "id": "q_cap_5",
            "type": "skill_reflection",
            "question": "Which Korean 5 skill would help most when a professor says: '이 부분을 조금 더 다듬어 봤으면 좋겠어요.'?",
            "options": [
                "Idioms & Natural Expressions (Korean 5.2)",
                "Implicit Meaning & Subtext (Korean 5.5) — recognising this as indirect criticism",
                "High-Level Register (Korean 5.4) — switching to casual register"
            ],
            "correct_answer": "Implicit Meaning & Subtext (Korean 5.5) — recognising this as indirect criticism",
            "explanation": "'조금 더 다듬어 봤으면 좋겠어요' (I'd like it if you refined it a little more) is indirect C1-level criticism — it sounds polite but signals the work needs significant improvement. Identifying this requires the subtext skills from Korean 5.5."
        }
    ],
    "c1_descriptors": [
        {"id": "d1", "skill": "Fluency & Coherence", "descriptor": "I can express ideas fluently and spontaneously without much obvious searching for expressions."},
        {"id": "d2", "skill": "Flexibility", "descriptor": "I can select appropriate formulation from a broad range of language to express myself clearly."},
        {"id": "d3", "skill": "Implicit Meaning", "descriptor": "I can understand implicit meaning in demanding texts and conversations."},
        {"id": "d4", "skill": "Register & Style", "descriptor": "I can understand and produce language appropriate to different social, academic, and professional contexts."},
        {"id": "d5", "skill": "Idiomaticity", "descriptor": "I can use a broad range of vocabulary including idiomatic expressions and collocations."}
    ],
    "homework": [
        {
            "id": "hw_cap_1",
            "text": "Create your C1 Portfolio: Write one piece demonstrating each Korean 5 skill — (1) an advanced story, (2) a passage with rich idioms, (3) a nuanced opinion piece, (4) a formal email or report, (5) a dialogue showing implicit meaning handling."
        },
        {
            "id": "hw_cap_2",
            "text": "Self-rate yourself against 5 CEFR C1 descriptors (Fluency, Flexibility, Implicit Meaning, Register, Idiomaticity) on a scale of 1–5. For each, write 1–2 sentences about where you feel strong and where you need more work."
        },
        {
            "id": "hw_cap_3",
            "text": "In 3–4 sentences (Korean or English), describe: Which real-life Korean domains you want to handle next (business, academic research, creative writing)? Which Korean 5 skills will you keep practising most?"
        }
    ]
}
