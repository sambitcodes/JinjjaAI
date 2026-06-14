PHASE_4_DATA = {
    "title": "Korean 3.4 – Opinions & Simple Arguments",
    "topic": "Opinions & Simple Arguments",
    "description": "Say what you think and give short reasons.",
    "estimated_time": "30–35 minutes",
    "goals": [
        "Express likes/dislikes and simple opinions about everyday topics",
        "Use 'I think...' patterns with reasons and contrasts",
        "Respond in simple ways when you agree or disagree"
    ],
    "prerequisites": "Korean 3.3 – Experiences & Simple Anecdotes",
    "status": "locked",
    "content_markdown": (
        "# Korean 3.4 – Opinions & Simple Arguments\n\n"
        "### B1 Opinion Goal\n"
        "At B1, you should be able to say what you think and briefly explain why—about familiar topics like school, work, hobbies, and daily life.\n\n"
        "### Core Opinion Patterns:\n"
        "- **I think (that) _:** 제 생각에는 ~ 것 같아요 / ~ 다고 생각해요.\n"
        "- **In my opinion, _:** 제 의견으로는 ~.\n"
        "- **I like/dislike _ because _:** ~은/는 ~기 때문에 좋아해요/싫어해요.\n"
        "- **What do you think about _?:** ~에 대해 어떻게 생각해요?\n\n"
        "### Agreeing & Disagreeing Simply:\n"
        "- **Agree:** 저도 찬성해요 (I agree) / 저도 그렇게 생각해요 (I think so too).\n"
        "- **Disagree:** 저는 그렇게 생각하지 않아요 (I don't think so) / 잘 모르겠어요 (I'm not sure)."
    ),
    "opinion_patterns": [
        {"ko": "제 생각에는 ~ 것 같아요", "en": "I think that...", "rom": "Je saeng-gak-e-neun ... geot gat-a-yo", "tag": "opinion"},
        {"ko": "~다고 생각해요", "en": "I think that...", "rom": "...da-go saeng-gak-hae-yo", "tag": "opinion"},
        {"ko": "제 의견으로는 ~", "en": "In my opinion...", "rom": "Je ui-gyeon-eu-ro-neun...", "tag": "opinion"},
        {"ko": "~에 대해 어떻게 생각해요?", "en": "What do you think about...?", "rom": "...e dae-hae eo-tteo-ke saeng-gak-hae-yo?", "tag": "question"}
    ],
    "agree_disagree_patterns": [
        {"ko": "저도 그렇게 생각해요", "en": "I think so too.", "rom": "Jeo-do geu-reo-ke saeng-gak-hae-yo", "tag": "agree"},
        {"ko": "저도 찬성해요", "en": "I agree.", "rom": "Jeo-do chan-seong-hae-yo", "tag": "agree"},
        {"ko": "저는 그렇게 생각하지 않아요", "en": "I don't think so.", "rom": "Jeo-neun geu-reo-ke saeng-gak-ha-ji an-a-yo", "tag": "disagree"},
        {"ko": "잘 모르겠어요", "en": "I'm not sure.", "rom": "Jal mo-reu-geot-seo-yo", "tag": "neutral"}
    ],
    "topic_ideas": [
        {"id": "online_study", "name": "Online vs In-person Study", "icon": "laptop"},
        {"id": "city_life", "name": "City vs Countryside", "icon": "map-pin"},
        {"id": "work_study", "name": "Working vs Studying", "icon": "briefcase"},
        {"id": "social_media", "name": "Social Media Habits", "icon": "smartphone"}
    ],
    "understanding_practice": [
        {
            "id": "op_rec_1",
            "type": "opinion_fact",
            "text": "제 생각에는 온라인 수업이 정말 편리한 것 같아요.",
            "en": "I think online classes are really convenient.",
            "is_opinion": True,
            "explanation": "This is an opinion because it uses '제 생각에는 ~ 것 같아요' (I think that) and expresses a subjective viewpoint ('convenient')."
        },
        {
            "id": "op_rec_2",
            "type": "opinion_fact",
            "text": "한국어 수업은 오후 일곱 시에 시작해요.",
            "en": "The Korean class starts at 7 PM.",
            "is_opinion": False,
            "explanation": "This is a fact because it expresses an objective detail about the schedule with a specific time."
        },
        {
            "id": "op_rec_3",
            "type": "find_reason",
            "text": "저는 밤에 공부하는 것을 좋아해요. 왜냐하면 조용하기 때문이에요.",
            "en": "I like studying at night because it is quiet.",
            "opinion_part": "저는 밤에 공부하는 것을 좋아해요",
            "reason_part": "왜냐하면 조용하기 때문이에요",
            "explanation": "'왜냐하면 조용하기 때문이에요' contains '왜냐하면' (because) and '기 때문이에요' which specifies the reason."
        }
    ],
    "quiz": [
        {
            "id": "q_b1_op_1",
            "type": "context",
            "question": "Which of the following is a subjective opinion (not a fact)?",
            "options": [
                "제 생각에는 서울이 부산보다 더 재미있는 것 같아요. (I think Seoul is more fun than Busan.)",
                "서울은 대한민국의 수도입니다. (Seoul is the capital of South Korea.)",
                "KTX 기차표는 삼만 원입니다. (The KTX train ticket is 30,000 won.)"
            ],
            "correct_answer": "제 생각에는 서울이 부산보다 더 재미있는 것 같아요. (I think Seoul is more fun than Busan.)",
            "explanation": "It starts with '제 생각에는' (I think) and expresses a personal opinion."
        },
        {
            "id": "q_b1_op_2",
            "type": "context",
            "question": "Choose the best reason to complete the statement: '저는 도시 생활을 싫어해요. [ ]'",
            "options": [
                "왜냐하면 너무 시끄럽고 복잡하기 때문이에요. (Because it is too noisy and crowded.)",
                "왜냐하면 조용하고 평화롭기 때문이에요. (Because it is quiet and peaceful.)",
                "왜냐하면 아주 싸기 때문이에요. (Because it is very cheap.)"
            ],
            "correct_answer": "왜냐하면 너무 시끄럽고 복잡하기 때문이에요. (Because it is too noisy and crowded.)",
            "explanation": "Disliking city life matches the reason that it is noisy and crowded."
        },
        {
            "id": "q_b1_op_3",
            "type": "context",
            "question": "Fill in the blank with the correct reason connector: '피곤해요. [ ] 일찍 자고 싶어요.' (I am tired. So I want to sleep early.)",
            "options": [
                "그래서 (So / Therefore)",
                "하지만 (But / However)",
                "왜냐하면 (Because)"
            ],
            "correct_answer": "그래서 (So / Therefore)",
            "explanation": "'그래서' links cause and effect: I am tired. So I want to sleep early."
        },
        {
            "id": "q_b1_op_4",
            "type": "context",
            "question": "Choose a natural response that expresses disagreement to the opinion: '스마트폰을 안 쓰는 게 좋은 것 같아요.' (I think it is good to not use smartphones.)",
            "options": [
                "저는 그렇게 생각하지 않아요. 스마트폰은 아주 유용해요. (I don't think so. Smartphones are very useful.)",
                "저도 그렇게 생각해요. 스마트폰은 정말 편리해요. (I think so too. Smartphones are really convenient.)",
                "잘 모르겠어요. 찬성해요. (I'm not sure. I agree.)"
            ],
            "correct_answer": "저는 그렇게 생각하지 않아요. 스마트폰은 아주 유용해요. (I don't think so. Smartphones are very useful.)",
            "explanation": "'저는 그렇게 생각하지 않아요' expresses polite disagreement."
        }
    ],
    "homework": [
        {"id": "hw_b1_op_1", "text": "Write a 5–7 sentence paragraph about one everyday topic (e.g. online classes vs in-person). Include 1 main opinion, at least 2 reasons, and 1 contrast sentence."},
        {"id": "hw_b1_op_2", "text": "Write 3 short responses to other opinions (agree/disagree) using B1 polite patterns."},
        {"id": "hw_b1_op_3", "text": "Record yourself reading your opinion paragraph and listen for natural flow."}
    ],
    "stance_options": {
        "online_study": [
            {"id": "like", "ko": "온라인 공부를 좋아해요", "en": "I like online studying"},
            {"id": "dislike", "ko": "온라인 공부를 싫어해요", "en": "I dislike online studying"}
        ],
        "city_life": [
            {"id": "like", "ko": "도시 생활을 좋아해요", "en": "I like city life"},
            {"id": "dislike", "ko": "도시 생활을 싫어해요", "en": "I dislike city life"}
        ],
        "work_study": [
            {"id": "like", "ko": "공부하는 것보다 일하는 게 좋은 것 같아요", "en": "I think working is better than studying"},
            {"id": "dislike", "ko": "일하는 것보다 공부하는 게 좋은 것 같아요", "en": "I think studying is better than working"}
        ],
        "social_media": [
            {"id": "like", "ko": "SNS를 하는 것이 유익하다고 생각해요", "en": "I think doing SNS is beneficial"},
            {"id": "dislike", "ko": "SNS를 하는 것이 시간 낭비라고 생각해요", "en": "I think doing SNS is a waste of time"}
        ]
    },
    "reason_phrases": {
        "online_study": [
            {"ko": "시간을 절약할 수 있기 때문이에요", "en": "because it saves time"},
            {"ko": "집에서 편하게 공부할 수 있기 때문이에요", "en": "because I can study comfortably at home"},
            {"ko": "집중하기 어렵기 때문이에요", "en": "because it is hard to concentrate"},
            {"ko": "친구들을 만날 수 없기 때문이에요", "en": "because I cannot meet friends"}
        ],
        "city_life": [
            {"ko": "대중교통이 아주 편리하기 때문이에요", "en": "because public transportation is very convenient"},
            {"ko": "문화 시설이 많기 때문이에요", "en": "because there are many cultural facilities"},
            {"ko": "너무 복잡하고 공기가 나쁘기 때문이에요", "en": "because it is too crowded and air is bad"},
            {"ko": "물가가 비싸기 때문이에요", "en": "because cost of living is expensive"}
        ],
        "work_study": [
            {"ko": "돈을 벌 수 있기 때문이에요", "en": "because I can earn money"},
            {"ko": "사회 경험을 쌓을 수 있기 때문이에요", "en": "because I can gain social experience"},
            {"ko": "새로운 것을 배우는 게 재미있기 때문이에요", "en": "because learning new things is fun"},
            {"ko": "미래를 준비하는 데 도움이 되기 때문이에요", "en": "because it helps prepare for the future"}
        ],
        "social_media": [
            {"ko": "다양한 정보를 얻을 수 있기 때문이에요", "en": "because I can get various information"},
            {"ko": "멀리 있는 친구들과 연락할 수 있기 때문이에요", "en": "because I can contact friends who are far away"},
            {"ko": "눈이 아프고 피곤하기 때문이에요", "en": "because my eyes hurt and I feel tired"},
            {"ko": "개인 정보가 유출될 수 있기 때문이에요", "en": "because personal information can be leaked"}
        ]
    }
}
