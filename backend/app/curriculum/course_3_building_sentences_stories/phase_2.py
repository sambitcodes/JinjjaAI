PHASE_2_DATA = {
    "title": "Korean 3.2 – Describing People & Places",
    "topic": "Describing People & Places",
    "description": "Talk about people, places, and things in more detail.",
    "estimated_time": "30–35 minutes",
    "goals": [
        "Use more adjectives for appearance, personality, and places",
        "Build 4–6 sentence descriptions of people and places",
        "Understand detailed descriptions in short texts or dialogues"
    ],
    "prerequisites": "Korean 3.1 – Connecting Ideas: Because, So & But",
    "status": "locked",
    "content_markdown": (
        "# Korean 3.2 – Describing People & Places\n\n"
        "### B1 Description Goal\n"
        "At B1, you should be able to describe people, places, and things in some detail, not just with one or two words. You’ll learn how to build longer descriptions step by step.\n\n"
        "### Adjective Categories:\n"
        "1. **People - Appearance:** 키가 크다 (tall), 키가 작다 (short), 젊다 (young), 나이가 많다 (old), 잘생기다 (good-looking).\n"
        "2. **People - Personality:** 친절하다 (kind), 재미있다 (funny), 진지하다 (serious), 조용하다 (quiet), 활발하다 (active).\n"
        "3. **Places:** 크다 (big), 작다 (small), 조용하다 (quiet), 시끄럽다 (noisy), 아름답다 (beautiful), 복잡하다 (crowded), 편안하다 (comfortable).\n"
        "4. **Objects:** 무겁다 (heavy), 가볍다 (light), 새롭다 (new), 오래되다 (old), 편리하다 (convenient).\n\n"
        "### Description Templates:\n"
        "- **People:** 이 사람은 [외모]고 [성격]요. [취미/세부사항]을 좋아해요.\n"
        "- **Places:** 이 장소는 [크기]고 [분위기]요. [위치]에 있어요."
    ),
    "adjectives": [
        {"ko": "키가 크다", "rom": "ki-ga keu-da", "en": "tall", "tag": "appearance"},
        {"ko": "키가 작다", "rom": "ki-ga jak-da", "en": "short", "tag": "appearance"},
        {"ko": "젊다", "rom": "jeolm-da", "en": "young", "tag": "appearance"},
        {"ko": "잘생기다", "rom": "jal-saeng-gi-da", "en": "good-looking", "tag": "appearance"},
        {"ko": "친절하다", "rom": "chin-jeol-ha-da", "en": "kind", "tag": "personality"},
        {"ko": "재미있다", "rom": "jae-mi-it-da", "en": "funny", "tag": "personality"},
        {"ko": "조용하다", "rom": "jo-yong-ha-da", "en": "quiet", "tag": "personality"},
        {"ko": "활발하다", "rom": "hwal-bal-ha-da", "en": "active", "tag": "personality"},
        {"ko": "크다", "rom": "keu-da", "en": "big", "tag": "place"},
        {"ko": "작다", "rom": "jak-da", "en": "small", "tag": "place"},
        {"ko": "아름답다", "rom": "a-reum-dab-da", "en": "beautiful", "tag": "place"},
        {"ko": "편안하다", "rom": "pyeon-an-ha-da", "en": "comfortable", "tag": "place"},
        {"ko": "무겁다", "rom": "mu-geop-da", "en": "heavy", "tag": "object"},
        {"ko": "가볍다", "rom": "ga-byeop-da", "en": "light", "tag": "object"},
        {"ko": "편리하다", "rom": "pyeon-ri-ha-da", "en": "convenient", "tag": "object"}
    ],
    "description_templates": [
        {
            "id": "temp_person",
            "type": "person",
            "title": "People Description Frame",
            "structure": "이 사람은 (외모 형용사)고 (성격 형용사)요. 그리고 (취미)을 좋아해요."
        },
        {
            "id": "temp_place",
            "type": "place",
            "title": "Place Description Frame",
            "structure": "이 장소는 (크기 형용사)고 (분위기 형용사)요. (위치)에 있어요."
        }
    ],
    "example_descriptions": [
        {
            "id": "ex_desc_1",
            "title": "Describing a Friend",
            "ko": "제 친구 민우는 키가 크고 활발해요. 항상 친절해서 친구들이 아주 많아요. 보통 주말에 축구하는 것을 좋아해요.",
            "en": "My friend Minwoo is tall and active. Because he is always kind, he has a lot of friends. He usually likes playing soccer on weekends.",
            "highlights": {
                "appearance": ["키가 크고"],
                "personality": ["활발해요", "친절해서"],
                "details": ["축구하는 것을 좋아해요"]
            }
        }
    ],
    "understanding_practice": [
        {
            "id": "und_desc_1",
            "type": "person",
            "text": "제 동생은 키가 작고 귀여워요. 성격은 조용하지만 아주 똑똑해요. 컴퓨터 게임을 좋아해서 방에서 자주 게임을 해요.",
            "audio_url": "/api/v1/speech/tts?text=제 동생은 키가 작고 귀여워요. 성격은 조용하지만 아주 똑똑해요. 컴퓨터 게임을 좋아해서 방에서 자주 게임을 해요.&lang=ko",
            "questions": [
                {
                    "question": "Is this text describing a person, place, or object?",
                    "options": ["A Person", "A Place", "An Object"],
                    "correct_answer": "A Person",
                    "explanation": "The text describes '제 동생' (my younger sibling) using appearance and personality adjectives, showing it is describing a person."
                },
                {
                    "question": "What is the sibling's personality like?",
                    "options": ["Quiet and smart", "Active and funny", "Kind and noisy"],
                    "correct_answer": "Quiet and smart",
                    "explanation": "The text states '성격은 조용하지만 아주 똑똑해요' which means 'their personality is quiet but very smart'."
                }
            ]
        },
        {
            "id": "und_desc_2",
            "type": "place",
            "text": "우리 집 근처 카페는 아주 작고 조용해요. 커피가 맛있고 음악이 편안해서 자주 가요. 지하철역 근처에 있어서 편리해요.",
            "audio_url": "/api/v1/speech/tts?text=우리 집 근처 카페는 아주 작고 조용해요. 커피가 맛있고 음악이 편안해서 자주 가요. 지하철역 근처에 있어서 편리해요.&lang=ko",
            "questions": [
                {
                    "question": "What size is the café described in the text?",
                    "options": ["Small", "Big", "Very crowded"],
                    "correct_answer": "Small",
                    "explanation": "The text says '카페는 아주 작고 조용해요' meaning the café is very small and quiet."
                },
                {
                    "question": "Where is the café located?",
                    "options": ["Near the subway station", "Near school", "In the countryside"],
                    "correct_answer": "Near the subway station",
                    "explanation": "The text mentions '지하철역 근처에 있어서 편리해요' meaning it's near the subway station."
                }
            ]
        }
    ],
    "quiz": [
        {
            "id": "q_b1_desc_1",
            "type": "context",
            "question": "Which adjective describes appearance?",
            "options": [
                "키가 크다 (tall)",
                "친절하다 (kind)",
                "편안하다 (comfortable)"
            ],
            "correct_answer": "키가 크다 (tall)",
            "explanation": "'키가 크다' describes a physical appearance, whereas '친절하다' describes personality and '편안하다' describes atmosphere."
        },
        {
            "id": "q_b1_desc_2",
            "type": "context",
            "question": "Fill in the blank to connect size and atmosphere: '우리 사무실은 크[ ] 조용해요.' (Our office is big and quiet.)",
            "options": [
                "고",
                "지만",
                "아서"
            ],
            "correct_answer": "고",
            "explanation": "'-고' connects two clauses sequentially or in parallel (and)."
        },
        {
            "id": "q_b1_desc_3",
            "type": "context",
            "question": "Arrange these sentences into a logical description order:\n1) 보통 주말에 책을 읽어요.\n2) 제 친구는 친절해요.\n3) 이름은 민수예요.",
            "options": [
                "3 -> 2 -> 1",
                "1 -> 2 -> 3",
                "2 -> 1 -> 3"
            ],
            "correct_answer": "3 -> 2 -> 1",
            "explanation": "Logical structure begins with name introduction (3), moves to character trait descriptions (2), and ends with hobbies/details (1)."
        }
    ],
    "homework": [
        {"id": "hw_b1_desc_1", "text": "Write a 5–7 sentence paragraph describing a person you know (appearance + personality + relationship detail)."},
        {"id": "hw_b1_desc_2", "text": "Write a 5–7 sentence paragraph describing a place you like (size, atmosphere, location, why you go there)."},
        {"id": "hw_b1_desc_3", "text": "Record yourself speaking one description from memory, trying to sound natural and clear."}
    ]
}
