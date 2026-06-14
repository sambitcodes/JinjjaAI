PHASE_1_DATA = {
    "title": "Korean 3.1 – Connecting Ideas: Because, So & But",
    "topic": "Connecting Ideas",
    "description": "Link your sentences to explain reasons, results, and contrasts.",
    "estimated_time": "30–35 minutes",
    "goals": [
        "Join two ideas with connectors (and, but, because, so, when)",
        "Explain reasons for your habits, likes, and plans",
        "Tell more connected mini-stories instead of single sentences"
    ],
    "prerequisites": "Korean 2.6 – Everyday Conversations (A2 Capstone)",
    "status": "locked",
    "content_markdown": (
        "# Korean 3.1 – Connecting Ideas: Because, So & But\n\n"
        "### Connecting Ideas at B1\n"
        "At the B1 level, you should be able to connect phrases and sentences to describe experiences and give reasons. In this phase, you’ll learn to join your sentences with words like 'because', 'so', and 'but'.\n\n"
        "### Core Connectors & Functions:\n"
        "1. **-고 (And):** Adds more information (e.g. 공부하고 음악을 들어요).\n"
        "2. **-지만 (But):** Shows contrast (e.g. 재미있지만 어려워요).\n"
        "3. **-아서/어서 (Because/So):** Gives a reason or cause-and-effect relationship (e.g. 피곤해서 잤어요).\n"
        "4. **-(으)니까 (Since/So):** Gives a logical reason, advice, or suggestion context (e.g. 비가 오니까 우산을 쓰세요).\n"
        "5. **-(으)ㄹ 때 (When):** Sets a background time frame (e.g. 시간이 있을 때 운동을 해요).\n\n"
        "### From Two Sentences to One:\n"
        "- **Before:** 저는 한국어를 공부해요. 재미있어요. (I study Korean. It is fun.)\n"
        "- **After:** 한국어는 **재미있어서** 매일 공부해요. (Since/Because Korean is fun, I study it every day.)"
    ),
    "connectors": [
        {
            "id": "conn_and",
            "korean_label": "-고",
            "english_function": "Add",
            "description": "Adds sequential or parallel actions (And)",
            "example_ko": "밥을 먹고 커피를 마셨어요.",
            "example_en": "I ate food and drank coffee."
        },
        {
            "id": "conn_but",
            "korean_label": "-지만",
            "english_function": "Contrast",
            "description": "Shows contrast or opposition (But)",
            "example_ko": "한국어는 어렵지만 재미있어요.",
            "example_en": "Korean is difficult but fun."
        },
        {
            "id": "conn_because",
            "korean_label": "-아서/어서",
            "english_function": "Reason / Result",
            "description": "Indicates a reason, cause, or sequence of actions (Because / So)",
            "example_ko": "비가 와서 집에 있었어요.",
            "example_en": "Because it rained, I stayed at home."
        },
        {
            "id": "conn_so",
            "korean_label": "-(으)니까",
            "english_function": "Logical So",
            "description": "Indicates a logical reason, often followed by command/suggestion (So / Since)",
            "example_ko": "날씨가 추우니까 코트를 입으세요.",
            "example_en": "Since the weather is cold, wear a coat."
        },
        {
            "id": "conn_when",
            "korean_label": "-(으)ㄹ 때",
            "english_function": "Time background",
            "description": "Sets a temporal background clause (When)",
            "example_ko": "시간이 있을 때 음악을 들어요.",
            "example_en": "When I have time, I listen to music."
        }
    ],
    "recognition_practice": [
        {
            "id": "rec_conn_1",
            "sentence1": "피곤해요 (I am tired)",
            "sentence2": "일찍 잘 거예요 (I will sleep early)",
            "prompt": "Choose the best connector to join: 'I am tired' and 'I will sleep early'.",
            "options": [
                {"id": "opt_rec1_1", "text": "-아서/어서 (because / so)", "correct": True},
                {"id": "opt_rec1_2", "text": "-지만 (but)", "correct": False},
                {"id": "opt_rec1_3", "text": "-고 (and)", "correct": False}
            ],
            "correct_connector": "-아서/어서",
            "relationship_type": "reason",
            "explanation": "Sleeping early is a result of being tired. '-아서/어서' (so/because) represents this cause-effect relationship."
        },
        {
            "id": "rec_conn_2",
            "sentence1": "매일 공부해요 (I study every day)",
            "sentence2": "한국어가 아직 어려워요 (Korean is still difficult)",
            "prompt": "Choose the best connector to show contrast: 'I study every day' BUT 'Korean is still difficult'.",
            "options": [
                {"id": "opt_rec2_1", "text": "-지만 (but)", "correct": True},
                {"id": "opt_rec2_2", "text": "-고 (and)", "correct": False},
                {"id": "opt_rec2_3", "text": "-(으)ㄹ 때 (when)", "correct": False}
            ],
            "correct_connector": "-지만",
            "relationship_type": "contrast",
            "explanation": "Studying daily contrasts with finding it difficult, making '-지만' (but) the correct contrast connector."
        }
    ],
    "expansion_templates": {
        "base_clauses": [
            {
                "id": "base_1",
                "ko": "한국어를 매일 공부해요",
                "en": "I study Korean every day",
                "suggestions": {
                    "but": [
                        {"ko": "어려워요", "expanded_ko": "한국어는 어렵지만 매일 공부해요", "en": "Korean is difficult but I study it every day"},
                        {"ko": "바빠요", "expanded_ko": "요즘 바쁘지만 한국어를 매일 공부해요", "en": "I am busy lately but I study Korean every day"}
                    ],
                    "because": [
                        {"ko": "재미있어요", "expanded_ko": "한국어가 재미있어서 매일 공부해요", "en": "Because Korean is fun, I study it every day"},
                        {"ko": "한국 친구가 있어요", "expanded_ko": "한국 친구가 있어서 매일 공부해요", "en": "Because I have a Korean friend, I study it every day"}
                    ],
                    "so": [
                        {"ko": "한국에 가고 싶어요", "expanded_ko": "한국어를 매일 공부하니까 한국에 가고 싶어요", "en": "I study Korean every day, so I want to go to Korea"}
                    ]
                }
            }
        ],
        "topics": [
            {"id": "topic_habits", "name": "Habits", "phrases": ["아침에 일찍 일어나요", "매일 커피를 마셔요", "공원에서 운동해요"]},
            {"id": "topic_likes", "name": "Likes/Dislikes", "phrases": ["매운 음식을 좋아해요", "쇼핑을 싫어해요", "영화 보는 것을 좋아해요"]},
            {"id": "topic_plans", "name": "Plans", "phrases": ["내일 친구를 만날 거예요", "주말에 집에서 쉴 거예요", "한국 여행을 갈 거예요"]}
        ]
    },
    "quiz": [
        {
            "id": "q_b1_conn_1",
            "type": "context",
            "question": "Which connector correctly joins these ideas: '바쁘다' (to be busy) and '친구를 만났다' (met a friend)?\n'바쁘[ ] 친구를 만났어요.'",
            "options": [
                "지만 (but)",
                "고 (and)",
                "아서 (because)"
            ],
            "correct_answer": "지만 (but)",
            "explanation": "Being busy contrasts with meeting a friend. '-지만' means 'but'."
        },
        {
            "id": "q_b1_conn_2",
            "type": "context",
            "question": "What relationship is expressed in this sentence: '비가 와서 우산을 썼어요.'?",
            "options": [
                "Reason / Result",
                "Contrast",
                "Time background"
            ],
            "correct_answer": "Reason / Result",
            "explanation": "'-아서' in '와서' expresses the reason (it rained) for the result (using an umbrella)."
        },
        {
            "id": "q_b1_conn_3",
            "type": "context",
            "question": "Fill in the blank: '시간이 있을 [ ] 영화를 봐요.' (When I have time, I watch movies.)",
            "options": [
                "때",
                "지만",
                "고"
            ],
            "correct_answer": "때",
            "explanation": "'-(으)ㄹ 때' sets the time background ('when')."
        },
        {
            "id": "q_b1_conn_4",
            "type": "context",
            "question": "Spot the grammatical naturalness error: '피곤하지만 잤어요.' vs '피곤해서 잤어요.'",
            "options": [
                "'피곤하지만 잤어요' is incorrect because sleeping is a natural result of fatigue, not a contrast.",
                "'피곤해서 잤어요' is incorrect because sleeping contrasts with fatigue.",
                "Both sentences are equally natural in daily conversations."
            ],
            "correct_answer": "'피곤하지만 잤어요' is incorrect because sleeping is a natural result of fatigue, not a contrast.",
            "explanation": "Since sleeping is a natural result of being tired, '-해서' (reason/result) is natural, whereas '-하지만' (contrast) is logically incorrect."
        }
    ],
    "homework": [
        {"id": "hw_b1_conn_1", "text": "Write 5 Korean sentences about your daily life using: 1 'because', 1 'so', 1 'but', and 2 of your choice."},
        {"id": "hw_b1_conn_2", "text": "Rewrite your old A2 routine paragraph using connectors to explain reasons (e.g. why you study Korean or why you wake up early)."},
        {"id": "hw_b1_conn_3", "text": "Record yourself reading your B1 connected sentences aloud, ensuring clear pronunciation of the linked syllables."}
    ]
}
