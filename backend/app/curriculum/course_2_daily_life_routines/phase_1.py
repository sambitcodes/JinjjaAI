PHASE_1_DATA = {
    "title": "Korean 2.1 – Longer Routines & Time Expressions",
    "topic": "Longer Routines & Time Expressions",
    "description": "Describe your day in more detail using time and frequency words.",
    "estimated_time": "25–30 minutes",
    "goals": [
        "Use time expressions like 'always', 'often', 'sometimes', 'never'",
        "Tell a longer daily routine (4–6 sentences) in Korean",
        "Understand spoken descriptions of someone's day"
    ],
    "prerequisites": "Korean 1: Everyday Basics (Completed)",
    "status": "locked",
    "content_markdown": (
        "# Korean 2.1 – Longer Routines & Time Expressions\n\n"
        "### A1 vs A2 Routines\n"
        "In Korean 1, you said simple sentences like 'I go to school' or 'I study Korean.' Now, you'll connect these into longer routines and add words like 'usually', 'often', and 'then'.\n\n"
        "### Frequency Words (빈도 부사)\n"
        "Frequency words modify verbs and usually go right before the verb phrase:\n"
        "- **항상 (hang-sang):** Always\n"
        "- **자주 (ja-ju):** Often\n"
        "- **가끔 (ga-kgeum):** Sometimes\n"
        "- **별로 (byeol-lo):** Rarely / Not often (usually paired with negative verbs, e.g. 별로 안 가요)\n"
        "- **전혀 (jeon-hyeo):** Never (usually paired with negative verbs, e.g. 전혀 안 해요)\n\n"
        "### Sequence Words (순서 연결어)\n"
        "Use these words to chain multiple sentences in a chronological sequence:\n"
        "- **먼저 (meon-jeo):** First\n"
        "- **그리고 (geu-ri-go):** And then / And\n"
        "- **그 다음에 (geu da-eum-e):** After that\n"
        "- **마지막으로 (ma-ji-mak-eu-ro):** Finally / In the end"
    ),
    "frequency_words": [
        {"id": "fw_always", "korean": "항상", "romanization": "hang-sang", "english": "always", "note": "Goes before the verb phrase."},
        {"id": "fw_often", "korean": "자주", "romanization": "ja-ju", "english": "often", "note": "Indicates high frequency."},
        {"id": "fw_sometimes", "korean": "가끔", "romanization": "ga-kgeum", "english": "sometimes", "note": "Indicates moderate frequency."},
        {"id": "fw_rarely", "korean": "별로", "romanization": "byeol-lo", "english": "rarely", "note": "Usually paired with negative verb forms."},
        {"id": "fw_never", "korean": "전혀", "romanization": "jeon-hyeo", "english": "never", "note": "Used with negative verbs."}
    ],
    "sequence_words": [
        {"id": "sw_first", "korean": "먼저", "english": "first", "note": "Starts the timeline sequence."},
        {"id": "sw_then", "korean": "그리고", "english": "then / and then", "note": "Connects related actions."},
        {"id": "sw_after", "korean": "그 다음에", "english": "after that", "note": "Indicates subsequent step."},
        {"id": "sw_finally", "korean": "마지막으로", "english": "finally / in the end", "note": "Ends the routine list."}
    ],
    "example_routines": [
        {
            "id": "ex_rot_1",
            "ko": "먼저 아침에 항상 일찍 일어나요. 그리고 학교에 가요. 그 다음에 오후에 자주 친구를 만나요. 마지막으로 저녁에 가끔 운동해요.",
            "en": "First, I always wake up early in the morning. And then I go to school. After that, I often meet friends in the afternoon. Finally, I sometimes exercise in the evening."
        }
    ],
    "listening_items": [
        {
            "id": "lis_r2_1",
            "audio_text": "먼저 아침에 항상 일찍 일어나요 그리고 회사에 가요 그 다음에 오후에 자주 회의를 해요 마지막으로 저녁에 가끔 책을 읽어요",
            "summary_options": [
                {"id": "opt_l1_1", "text": "They always wake up early, go to the office, often have meetings, and sometimes read books at night.", "correct": True},
                {"id": "opt_l1_2", "text": "They never go to the office and only read books in the morning.", "correct": False},
                {"id": "opt_l1_3", "text": "They always sleep during the day and study at school at night.", "correct": False}
            ],
            "correct_summary_id": "opt_l1_1",
            "detail_questions": [
                {
                    "id": "det_l1_1",
                    "question": "When do they read books (책을 읽어요)?",
                    "options": ["Morning", "Afternoon", "Evening"],
                    "correct": "Evening"
                },
                {
                    "id": "det_l1_2",
                    "question": "How often do they have meetings (회의를 해요)?",
                    "options": ["Always", "Often", "Sometimes"],
                    "correct": "Often"
                }
            ]
        }
    ],
    "builder_options": {
        "verbs": [
            {"ko": "일어나요", "en": "wake up"},
            {"ko": "공부해요", "en": "study"},
            {"ko": "친구를 만나요", "en": "meet friends"},
            {"ko": "운동해요", "en": "exercise"},
            {"ko": "책을 읽어요", "en": "read a book"},
            {"ko": "자요", "en": "sleep"}
        ]
    },
    "quiz": [
        {
            "id": "q_rot2_1",
            "type": "context",
            "question": "Which word means 'often' in Korean?",
            "options": ["항상", "자주", "가끔"],
            "correct_answer": "자주",
            "explanation": "자주 means often. 항상 means always, and 가끔 means sometimes."
        },
        {
            "id": "q_rot2_2",
            "type": "listening",
            "question": "Listen to the sequence word and select its meaning:",
            "audio_text": "그 다음에",
            "options": ["First", "After that", "Finally"],
            "correct_answer": "After that",
            "explanation": "그 다음에 (geu da-eum-e) translates directly to 'after that' or 'next'."
        },
        {
            "id": "q_rot2_3",
            "type": "context",
            "question": "Re-order these routine steps chronologically: \n1. 마지막으로 저녁에 자요.\n2. 먼저 아침에 일어나요.\n3. 그리고 낮에 공부해요.",
            "options": [
                "2 -> 3 -> 1",
                "1 -> 2 -> 3",
                "3 -> 2 -> 1"
            ],
            "correct_answer": "2 -> 3 -> 1",
            "explanation": "먼저 (First) starts the sequence, 그리고 (then) continues, and 마지막으로 (finally) ends it."
        },
        {
            "id": "q_rot2_4",
            "type": "writing",
            "question": "Type the Korean frequency word meaning 'always':",
            "correct_answer": "항상",
            "explanation": "항상 is the adverb meaning 'always' in Korean."
        }
    ],
    "homework": [
        {"id": "hw_rot2_1", "text": "Write a 5-sentence daily routine paragraph using at least two frequency words and one sequence connector."},
        {"id": "hw_rot2_2", "text": "Record your voice reading your A2 routine aloud and review the acoustic pace."},
        {"id": "hw_rot2_3", "text": "Rewrite your routine replacing weekday tasks with your typical weekend habits."}
    ]
}
