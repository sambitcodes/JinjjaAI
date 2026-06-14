PHASE_5_DATA = {
    "title": "Korean 4.5 – Longer Listening & Note‑Taking",
    "topic": "Longer Listening & Note-Taking",
    "description": "Understand longer Korean and keep simple notes.",
    "estimated_time": "35–40 minutes",
    "goals": [
        "Follow longer speech about familiar topics (school, work, hobbies, travel)",
        "Catch the main points and important details",
        "Take simple notes and use them to summarize what you heard"
    ],
    "prerequisites": "Korean 4.4 – Politeness & Register in Real Life",
    "status": "locked",
    "content_markdown": (
        "# Korean 4.5 – Longer Listening & Note‑Taking\n\n"
        "### B1 Listening Goal\n"
        "At B1, you should understand the main points of clear, standard speech on familiar matters, including short narratives and explanations.\n\n"
        "### Main Points vs Details\n"
        "- **Main Points:** The big ideas, the speaker's overall opinion, or key events.\n"
        "- **Details:** Specific times, names, locations, prices, or examples.\n\n"
        "### Note-Taking Strategies\n"
        "When taking notes, do not try to write every word. Use templates to capture key relationships."
    ),
    "example_listenings": [
        {
            "id": "list_ex_1",
            "ko": "저는 주말에 보통 친구들과 함께 한강 공원에 가요. 자전거를 타고 맛있는 것도 먹어요. 이번 주말에는 날씨가 좋아서 사람이 진짜 많았어요. 다음 주에는 등산을 갈 거예요.",
            "en": "I usually go to Hangang Park with my friends on weekends. We ride bikes and eat delicious food. This weekend the weather was good, so there were really a lot of people. Next week, I will go hiking.",
            "topic": "Weekend plans & activities"
        }
    ],
    "note_templates": [
        {
            "type": "story",
            "fields": ["Who", "Where", "When", "Main events", "Feelings"]
        },
        {
            "type": "talk",
            "fields": ["Topic", "Opinion", "Reasons/Examples"]
        }
    ],
    "notes_summary_examples": [
        {
            "notes": "Who: Speaker & friends. Where: Hangang Park. When: Weekends. Main events: Ride bikes, eat food. Feelings/Context: Weather good, lots of people.",
            "summary_ko": "주말에 친구들과 한강 공원에서 자전거를 타고 맛있는 음식을 먹었습니다. 날씨가 좋아서 사람이 아주 많았습니다.",
            "summary_en": "On the weekend, I rode bikes and ate delicious food with friends at Hangang Park. The weather was good, so there were many people."
        }
    ],
    "practice_listenings": [
        {
            "id": "long_b1_1",
            "audio_url": "/api/v1/speech/tts?text=어제는 회사에서 중요한 회의가 있었어요. 회의는 오후 두 시에 시작해서 네 시에 끝났어요. 새로운 프로젝트에 대해 이야기했는데, 조금 힘들었지만 결과가 좋아서 기뻤어요. 퇴근 후에는 동료들과 저녁을 먹으면서 이야기를 나눴어요.",
            "ko": "어제는 회사에서 중요한 회의가 있었어요. 회의는 오후 두 시에 시작해서 네 시에 끝났어요. 새로운 프로젝트에 대해 이야기했는데, 조금 힘들었지만 결과가 좋아서 기뻤어요. 퇴근 후에는 동료들과 저녁을 먹으면서 이야기를 나눴어요.",
            "en": "Yesterday there was an important meeting at work. The meeting started at 2 PM and ended at 4 PM. We talked about the new project; it was a bit tough, but the result was good so I was happy. After work, I had dinner and talked with colleagues.",
            "topic": "Important work meeting",
            "main_idea_options": [
                "The speaker had an important meeting at work and had dinner with colleagues.",
                "The speaker had a difficult day and decided to quit their job.",
                "The speaker went on a business trip to another country."
            ],
            "correct_main_idea": "The speaker had an important meeting at work and had dinner with colleagues.",
            "detail_questions": [
                {
                    "question": "What time did the meeting start?",
                    "options": ["1 PM", "2 PM", "4 PM"],
                    "correct": "2 PM"
                },
                {
                    "question": "How did the speaker feel about the project result?",
                    "options": ["Angry", "Sad", "Happy"],
                    "correct": "Happy"
                }
            ]
        }
    ],
    "quiz": [
        {
            "id": "q_b1_list_1",
            "type": "main_idea",
            "question": "What is the main topic of the statement: '저는 요리하는 것을 아주 좋아해요. 매주 주말마다 새로운 한국 음식을 만들고 가족들과 같이 먹어요.'?",
            "options": [
                "Cooking Korean food on weekends",
                "Going to a Korean restaurant",
                "Buying groceries at the market"
            ],
            "correct_answer": "Cooking Korean food on weekends",
            "explanation": "The speaker expresses their love for cooking and states they make new Korean dishes every weekend to eat with family."
        },
        {
            "id": "q_b1_list_2",
            "type": "detail",
            "question": "Extract the meeting finish time from: '회의는 오후 두 시에 시작해서 네 시에 끝났어요.'",
            "options": [
                "2 PM",
                "3 PM",
                "4 PM"
            ],
            "correct_answer": "4 PM",
            "explanation": "'네 시에 끝났어요' means it finished at 4 o'clock."
        },
        {
            "id": "q_b1_list_3",
            "type": "best_summary",
            "question": "Which summary is the most balanced (main points only)?",
            "options": [
                "The speaker had a meeting from 2 to 4 PM about a project, was happy with the good results, and had dinner with colleagues.",
                "The speaker started a meeting, drank coffee, ate dinner, talked, and went home at 9 PM.",
                "The speaker dislikes meetings."
            ],
            "correct_answer": "The speaker had a meeting from 2 to 4 PM about a project, was happy with the good results, and had dinner with colleagues.",
            "explanation": "This summary covers the main points (meeting time, topic, outcome, dinner) without unnecessary trivial details."
        },
        {
            "id": "q_b1_list_4",
            "type": "note_quality",
            "question": "Which set of notes is better for a B1 listener?",
            "options": [
                "Keywords: Meeting 2-4PM, project tough but good results, dinner with colleagues.",
                "Full sentences: Yesterday at 2 PM there was a meeting and we talked about projects. I was happy and then I ate dinner."
            ],
            "correct_answer": "Keywords: Meeting 2-4PM, project tough but good results, dinner with colleagues.",
            "explanation": "Taking notes with concise keywords and structures is much more effective than trying to write full sentences while listening."
        },
        {
            "id": "q_b1_list_5",
            "type": "missing_part",
            "question": "In the summary: 'We had a meeting yesterday.' What critical B1 detail is missing?",
            "options": [
                "The outcome/results of the meeting and follow-up activities",
                "The color of the conference table",
                "What the speaker wore"
            ],
            "correct_answer": "The outcome/results of the meeting and follow-up activities",
            "explanation": "A complete B1 summary should include key outcomes or main reasons/events, not just the starting point."
        }
    ],
    "homework": [
        {"id": "hw_b1_list_1", "text": "Listen to one B1-level Korean audio outside the app and note down Topic, 3-5 keywords, and a 1-2 sentence summary in Korean."},
        {"id": "hw_b1_list_2", "text": "Re-listen to the in-app work meeting audio, take structured notes, and write a refined 2-sentence summary."},
        {"id": "hw_b1_list_3", "text": "Write a 2-3 sentence reflection in Korean/English about what is hardest for you when listening to Korean."}
    ]
}
