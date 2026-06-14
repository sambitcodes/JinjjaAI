PHASE_3_DATA = {
    "title": "Korean 3.3 – Experiences & Simple Anecdotes",
    "topic": "Experiences & Simple Anecdotes",
    "description": "Tell short stories about memorable days and events.",
    "estimated_time": "30–40 minutes",
    "goals": [
        "Describe past experiences in 6–8 connected sentences",
        "Use sequence words (first, then, after that, finally) to structure stories",
        "Say how you felt and give simple comments on events"
    ],
    "prerequisites": "Korean 3.2 – Describing People & Places",
    "status": "locked",
    "content_markdown": (
        "# Korean 3.3 – Experiences & Simple Anecdotes\n\n"
        "### B1 Storytelling Goal\n"
        "At B1, you should be able to describe experiences and events, and tell short stories about your life. This phase teaches you how to organize a story and connect sentences about a memorable event.\n\n"
        "### Story Frame:\n"
        "1. **Beginning:** Time + Place + Who (e.g., Last weekend I was at... with...).\n"
        "2. **Middle:** Main events in chronological order.\n"
        "3. **End:** Result + Final feeling or evaluation.\n\n"
        "### Sequence & Evaluation Words:\n"
        "- **Sequence:** 먼저 (first), 그 다음에 (then/next), 그리고 (and/then), 마지막으로 (finally).\n"
        "- **Evaluation/Feelings:** 재미있었어요 (was fun), 행복했어요 (was happy), 피곤했어요 (was tired)."
    ),
    "story_frames": {
        "beginning": "시간, 장소, 함께한 사람 소개",
        "middle": "일어난 사건들의 순서대로 나열",
        "end": "사건의 결과 및 기분/평가"
    },
    "sequence_words": [
        {"ko": "먼저", "en": "first"},
        {"ko": "그 다음에", "en": "then / after that"},
        {"ko": "그리고", "en": "and / then"},
        {"ko": "마지막으로", "en": "finally"}
    ],
    "evaluation_phrases": [
        {"ko": "재미있었어요", "en": "it was fun"},
        {"ko": "행복했어요", "en": "I was happy"},
        {"ko": "피곤했어요", "en": "I was tired"},
        {"ko": "힘들었어요", "en": "it was difficult/hard"}
    ],
    "example_anecdotes": [
        {
            "id": "ex_anec_1",
            "title": "A Weekend Trip to Busan",
            "ko": "지난달에 저는 친구랑 부산으로 여행을 갔어요. 먼저 아침에 KTX 열차를 탔어요. 그 다음에 부산역 근처 식당에서 맛있는 해물 밀면을 먹었어요. 그리고 바다를 구경하고 사진을 많이 찍었어요. 마지막으로 저녁에 호텔에 돌아와서 쉬었어요. 조금 피곤했지만 아주 행복했어요.",
            "en": "Last month, I went on a trip to Busan with a friend. First, in the morning, we took the KTX train. Next, we ate delicious seafood milmyeon at a restaurant near Busan Station. And we looked around the sea and took many pictures. Finally, in the evening, we returned to the hotel and rested. We were a bit tired but very happy.",
            "highlights": {
                "sequence": ["먼저", "그 다음에", "그리고", "마지막으로"],
                "feelings": ["피곤했지만", "행복했어요"]
            }
        }
    ],
    "understanding_practice": [
        {
            "id": "und_anec_1",
            "text": "지난 주말에 친구 생일 파티가 있었어요. 먼저 선물을 사고 친구 집으로 갔어요. 그 다음에 친구들과 맛있는 음식을 먹고 이야기를 많이 나눴어요. 마지막으로 케이크를 먹고 노래를 불렀어요. 아주 재미있었고 신났어요.",
            "audio_url": "/api/v1/speech/tts?text=지난 주말에 친구 생일 파티가 있었어요. 먼저 선물을 사고 친구 집으로 갔어요. 그 다음에 친구들과 맛있는 음식을 먹고 이야기를 많이 나눴어요. 마지막으로 케이크를 먹고 노래를 불렀어요. 아주 재미있었고 신났어요.&lang=ko",
            "questions": [
                {
                    "question": "What is this story mainly about?",
                    "options": [
                        "A friend's birthday party last weekend",
                        "A weekend trip to Busan",
                        "A problem at school"
                    ],
                    "correct_answer": "A friend's birthday party last weekend",
                    "explanation": "The text starts with '지난 주말에 친구 생일 파티가 있었어요' showing it's about a birthday party."
                },
                {
                    "question": "What did the narrator do first?",
                    "options": [
                        "Bought a gift",
                        "Ate cake",
                        "Sang songs"
                    ],
                    "correct_answer": "Bought a gift",
                    "explanation": "The text states '먼저 선물을 사고...' meaning 'First, I bought a gift...'"
                }
            ]
        }
    ],
    "quiz": [
        {
            "id": "q_b1_anec_1",
            "type": "context",
            "question": "Choose the correct sequence word for the blank: '아침에 운동을 했어요. [ ] 샤워를 했어요.' (I exercised in the morning. Then I took a shower.)",
            "options": [
                "그 다음에 (then / after that)",
                "먼저 (first)",
                "마지막으로 (finally)"
            ],
            "correct_answer": "그 다음에 (then / after that)",
            "explanation": "'그 다음에' means then/next, representing sequential actions."
        },
        {
            "id": "q_b1_anec_2",
            "type": "context",
            "question": "Read the sentence and choose the correct English feeling: '힘들었지만 보람 있었어요.'",
            "options": [
                "It was difficult but rewarding.",
                "It was fun and exciting.",
                "I was tired and went to sleep."
            ],
            "correct_answer": "It was difficult but rewarding.",
            "explanation": "'힘들다' means to be hard/difficult and '보람 있다' means to be rewarding."
        },
        {
            "id": "q_b1_anec_3",
            "type": "context",
            "question": "Arrange these sentences to form a logical story (Beginning -> Middle -> End):\n1) 마지막으로 밤에 영화를 봤어요.\n2) 지난 토요일에 동생하고 극장에 갔어요.\n3) 먼저 버스를 타고 매표소에서 표를 샀어요.",
            "options": [
                "2 -> 3 -> 1",
                "3 -> 2 -> 1",
                "2 -> 1 -> 3"
            ],
            "correct_answer": "2 -> 3 -> 1",
            "explanation": "Logic: Introduce background (2), show first event (3), and end (1)."
        }
    ],
    "homework": [
        {"id": "hw_b1_anec_1", "text": "Write a short story (6–8 sentences) about a trip or visit you made using past tense and at least 3 sequence words."},
        {"id": "hw_b1_anec_2", "text": "Describe a time you had a small problem (e.g. lost keys) and say how you felt in the end."},
        {"id": "hw_b1_anec_3", "text": "Record yourself telling your Busan trip story or your own story from memory."}
    ],
    "story_types": [
        {
            "id": "fun_day",
            "name": "A fun day",
            "description": "Describe a great day spending time with friends or family.",
            "prompts": ["a weekend hang out", "a birthday celebration", "a picnic in the park"]
        },
        {
            "id": "trip_visit",
            "name": "A trip or visit",
            "description": "Describe a vacation, visit to a new city, or visiting relatives.",
            "prompts": ["a trip to the beach", "visiting another city", "hiking up a mountain"]
        }
    ]
}
