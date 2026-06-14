PHASE_6_DATA = {
    "title": "Korean 4.6 – Real‑Life B1 Fluency (Capstone)",
    "topic": "Real‑Life B1 Fluency (Capstone)",
    "description": "Travel, daily life, and opinions in one integrated journey.",
    "estimated_time": "40–45 minutes",
    "goals": [
        "Handle a chain of real‑life situations in Korean (travel, social, study/work)",
        "Combine stories, opinions, and problem‑solving in one conversation",
        "Show you can communicate independently on familiar topics at B1 level"
    ],
    "prerequisites": "Korean 4.5 – Longer Listening & Note‑Taking",
    "status": "locked",
    "content_markdown": (
        "# Korean 4.6 – Real‑Life B1 Fluency (Capstone)\n\n"
        "### B1 Independent User Goal\n"
        "At B1, you can handle most everyday situations, discuss familiar topics, express opinions, and describe experiences with simple reasons. This capstone lets you try that in realistic Korean scenarios.\n\n"
        "### Scenario-Based Capstones\n"
        "You will practice integrated skills across three core day scripts:\n"
        "1. **Travel & Accommodation Day:** Navigate local transit, check into a guesthouse, resolve a booking mismatch, and summarize the experience.\n"
        "2. **Campus/Work & Schedule Day:** Discuss timetables with a colleague, plan a meeting, adjust deadlines, and give opinions on workload.\n"
        "3. **Weekend/Social Day:** Meet friends, retell recent events, give opinions on study/work balance."
    ),
    "scenarios": [
        {
            "id": "scenario_a",
            "name": "Travel & Accommodation Day",
            "goals": ["Buy transport ticket", "Check into guesthouse", "Resolve booking mismatch", "Summarize travel day"]
        },
        {
            "id": "scenario_b",
            "name": "Campus/Work & Schedule Day",
            "goals": ["Discuss work schedule", "Plan meeting details", "Solve time conflict", "Give feedback on schedule"]
        },
        {
            "id": "scenario_c",
            "name": "Weekend/Social Day",
            "goals": ["Do small talk with friend", "Tell weekend story", "Discuss study-leisure balance", "Summarize reflections"]
        }
    ],
    "guided_snapshots": {
        "scenario_a": [
            {
                "id": "snap_a_1",
                "title": "Buy a ticket",
                "dialogue": [
                    {"speaker": "Staff", "text": "어디로 가십니까? (Where are you going?)"},
                    {"speaker": "Learner", "text": "부산행 기차표 두 장 주세요. (Two tickets for Busan, please.)"},
                    {"speaker": "Staff", "text": "오후 두 시 출발 열차 있습니다. 괜찮으십니까? (We have a train leaving at 2 PM. Is that okay?)"},
                    {"speaker": "Learner", "text": "네, 좋습니다. 얼마입니까? (Yes, that's good. How much is it?)"}
                ],
                "question": "What is the main task here?",
                "options": ["Buying transport tickets", "Booking a hotel", "Ordering dinner"],
                "correct": "Buying transport tickets",
                "problem_question": "What problem, if any, is in this scene?",
                "problem_options": ["No problem", "Train is delayed", "Ticket is too expensive"],
                "correct_problem": "No problem"
            }
        ],
        "scenario_b": [
            {
                "id": "snap_b_1",
                "title": "Plan group work",
                "dialogue": [
                    {"speaker": "Colleague", "text": "팀 회의 언제 할까요? (When shall we do the team meeting?)"},
                    {"speaker": "Learner", "text": "내일 오후 세 시 어때요? (How about tomorrow at 3 PM?)"},
                    {"speaker": "Colleague", "text": "죄송해요, 그때는 다른 회의가 있어요. (I'm sorry, I have another meeting then.)"},
                    {"speaker": "Learner", "text": "그럼 목요일 오전 열시는 괜찮으세요? (Then, is Thursday 10 AM okay?)"}
                ],
                "question": "What is the main task here?",
                "options": ["Planning a group meeting time", "Writing a project report", "Grading student homework"],
                "correct": "Planning a group meeting time",
                "problem_question": "What problem, if any, is in this scene?",
                "problem_options": ["Time conflict / Colleague is busy", "Room is locked", "Project is cancelled"],
                "correct_problem": "Time conflict / Colleague is busy"
            }
        ],
        "scenario_c": [
            {
                "id": "snap_c_1",
                "title": "Talk about weekend",
                "dialogue": [
                    {"speaker": "Friend", "text": "주말에 뭐 했어? (What did you do on the weekend?)"},
                    {"speaker": "Learner", "text": "친구랑 미술관에 갔어. 그리고 맛있는 파스타도 먹었어. (I went to an art museum with a friend. And we ate delicious pasta too.)"},
                    {"speaker": "Friend", "text": "재미있었겠다! 날씨는 좋았어? (Must have been fun! Was the weather good?)"},
                    {"speaker": "Learner", "text": "응, 날씨가 아주 따뜻했어. (Yes, the weather was very warm.)"}
                ],
                "question": "What is the main task here?",
                "options": ["Sharing weekend stories", "Buying paintings", "Booking cooking classes"],
                "correct": "Sharing weekend stories",
                "problem_question": "What problem, if any, is in this scene?",
                "problem_options": ["No problem", "Museum was closed", "Food was terrible"],
                "correct_problem": "No problem"
            }
        ]
    },
    "quiz": [
        {
            "id": "q_b1_cap_1",
            "type": "strategy_move",
            "question": "The clerk says they cannot find your reservation. What is the best next strategic move?",
            "options": [
                "Show them your booking confirmation email and ask them to check again.",
                "Shout at the clerk and demand a free room.",
                "Leave immediately and find another hotel without saying anything."
            ],
            "correct_answer": "Show them your booking confirmation email and ask them to check again.",
            "explanation": "Providing proof of reservation and politely asking for a re-check is the most effective problem-solving action at B1."
        },
        {
            "id": "q_b1_cap_2",
            "type": "problem_solving",
            "question": "Your colleague has a scheduling conflict. Choose the reply that best moves toward a resolution.",
            "options": [
                "그럼 다른 요일이나 시간은 어떠세요? 다음 주 수요일은 시간 있으세요? (Then how about another day or time? Do you have time next Wednesday?)",
                "시간이 없으면 회의하지 맙시다. (If there is no time, let's not meet.)",
                "제가 알아서 다 할게요. (I will do everything myself.)"
            ],
            "correct_answer": "그럼 다른 요일이나 시간은 어떠세요? 다음 주 수요일은 시간 있으세요? (Then how about another day or time? Do you have time next Wednesday?)",
            "explanation": "Suggesting alternative options cooperatively is key to successful B1 interaction in study/work contexts."
        },
        {
            "id": "q_b1_cap_3",
            "type": "summary_completeness",
            "question": "Which summary represents a complete description of a travel day?",
            "options": [
                "We bought train tickets, checked in successfully after resolving a minor room issue, and had a great day overall.",
                "The train was fast.",
                "I went to Busan."
            ],
            "correct_answer": "We bought train tickets, checked in successfully after resolving a minor room issue, and had a great day overall.",
            "explanation": "A complete B1 scenario summary covers the main event, the problem/resolution, and a general reflection."
        },
        {
            "id": "q_b1_cap_4",
            "type": "independence_level",
            "question": "Which response shows more B1 fluency and independent expression?",
            "options": [
                "네, 좋았어요. 날씨가 맑아서 친구와 기분 좋게 쇼핑을 할 수 있었거든요. (Yes, it was good. Because the weather was clear, I was able to enjoy shopping with my friend.)",
                "네. (Yes.)"
            ],
            "correct_answer": "네, 좋았어요. 날씨가 맑아서 친구와 기분 좋게 쇼핑을 할 수 있었거든요. (Yes, it was good. Because the weather was clear, I was able to enjoy shopping with my friend.)",
            "explanation": "Providing supporting reasons (~아서/어서, ~거든요) rather than one-word replies demonstrates independent communication ability."
        },
        {
            "id": "q_b1_cap_5",
            "type": "register_check",
            "question": "Is the sentence '어이, 방이 너무 더워요. 바꿔줘.' appropriate when speaking politely to hotel reception staff?",
            "options": [
                "No, it uses rude/casual imperatives ('어이', '바꿔줘') mixed with polite endings.",
                "Yes, it is perfectly polite and natural."
            ],
            "correct_answer": "No, it uses rude/casual imperatives ('어이', '바꿔줘') mixed with polite endings.",
            "explanation": "When speaking to staff, a polite register using honorific patterns like '죄송하지만 방을 바꾸어 주실 수 있나요?' is appropriate."
        }
    ],
    "homework": [
        {"id": "hw_b1_cap_1", "text": "Write a 10–12 sentence paragraph in Korean detailing a day combining travel, planning, and a personal opinion reflection."},
        {"id": "hw_b1_cap_2", "text": "Record a 2-minute audio of yourself summarizing the capstone scenario without script scripts."},
        {"id": "hw_b1_cap_3", "text": "Write a self-reflection in 3-4 sentences outlining which scenarios felt most natural and where you need help."}
    ]
}
