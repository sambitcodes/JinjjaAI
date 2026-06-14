PHASE_3_DATA = {
    "title": "Korean 5.3 – Nuanced Opinions & Soft Power",
    "topic": "Nuanced Opinions & Soft Power",
    "description": "Express complex opinions gently and precisely in Korean.",
    "estimated_time": "35–45 minutes",
    "goals": [
        "Show different levels of certainty: strong, cautious, and unsure",
        "Use hedging and softening phrases to sound balanced and polite",
        "Express partial agreement and subtle disagreement in real discussions"
    ],
    "prerequisites": "Korean 5.2 – Idioms & Natural Expressions",
    "status": "locked",
    "content_markdown": (
        "# Korean 5.3 – Nuanced Opinions & Soft Power\n\n"
        "### Concept of Stance & Hedging\n"
        "At C1, expressing an opinion is not just about being blunt or direct. It requires adjusting your **stance** (attitude, certainty) and using **hedging** (cautious qualifications) or **softening** (reducing emotional impact) to remain balanced, polite, and persuasive.\n\n"
        "### Stance Levels\n"
        "1. **Strong / Direct (확신/직설):** Used when 100% sure (e.g., *~가 확실합니다*, *의심할 여지가 없습니다*).\n"
        "2. **Balanced / Cautious (조절/신중):** Used for standard balanced claims (e.g., *~인 것 같습니다*, *대체로 ~인 경향이 있습니다*).\n"
        "3. **Tentative / Exploratory (추측/탐색):** Used when unsure or exploring options (e.g., *혹시 ~일지도 모릅니다*, *일부 그런 면도 있을 수 있지만*).\n\n"
        "### Softening Disagreement\n"
        "Rather than saying '아니요, 틀렸습니다' (No, that's wrong), C1 speakers use partial agreement frames: *말씀하신 부분도 일리가 있지만, 한편으로는...* (What you said makes sense, but on the other hand...)"
    ),
    "stance_levels": [
        {
            "id": "strong",
            "name": "Strong / Direct",
            "korean": "확신 / 직설",
            "description": "Indicates complete certainty and absolute claims.",
            "examples": ["~임이 확실합니다 (It is certain that...)", "의심할 여지가 없습니다 (There is no room for doubt)"]
        },
        {
            "id": "balanced",
            "name": "Balanced / Cautious",
            "korean": "조절 / 신중",
            "description": "Presents claims reasonably with qualifying details.",
            "examples": ["~인 것 같습니다 (It seems that...)", "~인 경향이 있습니다 (Has a tendency to...)"]
        },
        {
            "id": "tentative",
            "name": "Tentative / Exploratory",
            "korean": "추측 / 탐색",
            "description": "Expresses possibilities cautiously, keeping options open.",
            "examples": ["~일지도 모릅니다 (Might possibly be...)", "개인적인 견해로는 (From my personal viewpoint)"]
        }
    ],
    "softening_phrases": [
        {"ko": "대체로", "en": "generally/largely"},
        {"ko": "어느 정도", "en": "to some extent"},
        {"ko": "일부 면에서는", "en": "in some aspects"},
        {"ko": "조심스럽지만", "en": "cautiously speaking"}
    ],
    "recognition_items": [
        {
            "id": "rec_1",
            "sentence": "이 아이디어는 완전히 실현 불가능함이 확실합니다.",
            "translation": "This idea is definitely impossible to implement.",
            "stance": "strong",
            "explanation": "The expression '완전히' (completely) combined with '확실합니다' (it is certain) marks a strong, unhedged absolute stance.",
            "markers": ["완전히", "확실합니다"]
        },
        {
            "id": "rec_2",
            "sentence": "이 계획은 대체로 좋은 해결책이 될 수 있을 것 같습니다.",
            "translation": "This plan seems like it could generally be a good solution.",
            "stance": "balanced",
            "explanation": "The markers '대체로' (generally) and '것 같습니다' (seems like) hedge the claim to present it cautiously.",
            "markers": ["대체로", "것 같습니다"]
        },
        {
            "id": "rec_3",
            "sentence": "조심스럽지만 다른 관점도 있을 수 있다고 생각합니다.",
            "translation": "It is cautious, but I think there could be other perspectives.",
            "stance": "tentative",
            "explanation": "The phrase '조심스럽지만' (cautiously) and '있을 수 있다' (could be possible) indicate exploratory and highly tentative stance.",
            "markers": ["조심스럽지만", "있을 수 있다"]
        }
    ],
    "hedged_vs_unhedged": [
        {
            "id": "hvu_1",
            "context": "Talking to a professor or supervisor about an assignment deadline extension request:",
            "unhedged": "과제가 너무 많아서 다음 주까지 제출하는 것은 절대 안 됩니다.",
            "hedged": "다른 과제들이 겹쳐서 다음 주까지 제출하기는 조금 어려울 것 같습니다.",
            "explanation": "The hedged version uses '조금' (a little) and '어려울 것 같습니다' (seems difficult) to soften the rejection and sound more respectful."
        }
    ],
    "dialogues_softening": [
        {
            "id": "ds_1",
            "dialogue_ko": "A: 야간 자율학습은 시간 낭비일 뿐이에요.\nB: 말씀하신 부분도 일리가 있지만, 조용히 공부하고 싶은 학생에게는 유용할 수도 있습니다.",
            "dialogue_en": "A: Late night self-study is just a waste of time.\nB: What you said makes sense, but it could be useful for students who want to study quietly.",
            "softening_marker": "말씀하신 부분도 일리가 있지만"
        }
    ],
    "rewrite_templates": [
        {
            "id": "st_1",
            "plain_text": "SNS는 사람들의 건강을 완전히 망친다.",
            "underlined": "완전히 망친다",
            "context_theme": "social_media",
            "options": [
                {"text": "해로운 경향이 있는 것 같습니다", "stance": "balanced"},
                {"text": "일부 해를 끼칠지도 모릅니다", "stance": "tentative"}
            ]
        }
    ],
    "partial_agreement_templates": [
        {
            "id": "pa_1",
            "statement": "재택근무가 사무실 출근보다 훨씬 효율적입니다.",
            "options": [
                {"ko_phrase": "의견에 전적으로 동감하지만, 일부 업무는 대면 협업이 필요할 수 있습니다.", "label": "Mostly agree with nuance"},
                {"ko_phrase": "일부 효율적인 면도 있겠지만, 장기적으로는 팀 단합에 해가 될 수도 있습니다.", "label": "Mostly disagree with concession"}
            ]
        }
    ],
    "quiz": [
        {
            "id": "q_c1_st_1",
            "type": "stance_strength",
            "question": "What stance level does this sentence represent? '인터넷 사용이 청소년에게 나쁜 영향을 미칠 수도 있을 것 같습니다.'",
            "options": [
                "Strong / Direct",
                "Balanced / Cautious",
                "Tentative / Exploratory"
            ],
            "correct_answer": "Tentative / Exploratory",
            "explanation": "'수도 있을 것 같습니다' (might possibly seem) combines multiple layers of speculation, forming a highly tentative stance."
        },
        {
            "id": "q_c1_st_2",
            "type": "best_hedged",
            "question": "Which sentence represents the best hedged rewrite of: '이 마케팅 계획은 절대로 성공하지 못합니다' for a professional business meeting?",
            "options": [
                "이 계획은 실패할 것이 확실합니다. (This plan is certain to fail.)",
                "이 마케팅 계획은 현재 상황에서 예산 대비 효율이 약간 떨어질 우려가 있습니다. (There is a concern that this marketing plan might be slightly less efficient relative to the budget under current conditions.)",
                "그냥 이 계획은 버리는 게 맞습니다. (Just throwing away this plan is right.)"
            ],
            "correct_answer": "이 마케팅 계획은 현재 상황에서 예산 대비 효율이 약간 떨어질 우려가 있습니다. (There is a concern that this marketing plan might be slightly less efficient relative to the budget under current conditions.)",
            "explanation": "It qualifies the assessment by pointing to 'budget efficiency' and soft indicators ('우려가 있습니다' - there is a concern) rather than using absolute terms."
        },
        {
            "id": "q_c1_st_3",
            "type": "agreement_type",
            "question": "Classify this reply: '그 의견도 일리가 있지만, 반면에 실용성 면에서는 다시 검토해 볼 필요가 있습니다.'",
            "options": [
                "Full Agreement",
                "Partial Agreement / Soft Disagreement",
                "Full Disagreement"
            ],
            "correct_answer": "Partial Agreement / Soft Disagreement",
            "explanation": "'일리가 있지만' (makes sense but) and '검토해 볼 필요가 있다' (needs review) are typical signs of partial agreement / soft disagreement."
        },
        {
            "id": "q_c1_st_4",
            "type": "excessive_hedging",
            "question": "Why is '개인적인 제 생각으로는 아마도 혹시 틀릴 수도 있을 것 같습니다' considered poor B2/C1 speech?",
            "options": [
                "It is too formal.",
                "It is excessively hedged, making the speaker sound completely lacking in confidence and the opinion unclear.",
                "It contains slang."
            ],
            "correct_answer": "It is excessively hedged, making the speaker sound completely lacking in confidence and the opinion unclear.",
            "explanation": "Over-hedging using '개인적인', '아마도', '혹시', and '수도 있을 것 같다' all at once dilutes the message entirely."
        }
    ],
    "homework": [
        {"id": "hw_c1_st_1", "text": "Choose a topic (e.g. social media, online classes) and write three versions of your opinion representing Strong, Balanced, and Tentative stances in Korean."},
        {"id": "hw_c1_st_2", "text": "Write a short debate exchange (6 lines) demonstrating polite partial agreement and hedging."},
        {"id": "hw_c1_st_3", "text": "Record a 2-minute voice reflection analyzing how difficult it is to balance politeness and clarity when disagreeing in Korean."}
    ]
}
