PHASE_2_DATA = {
    "title": "Korean 4.2 – Real‑World Korean: Travel & Errands",
    "topic": "Real‑World Korean: Travel & Errands",
    "description": "Handle basic situations in transport, shops, and hotels.",
    "estimated_time": "30–40 minutes",
    "goals": [
        "Ask for and understand information in stations, shops, and hotels",
        "Make simple but polite requests and check details (time, price, place)",
        "Solve small problems when things go wrong while travelling"
    ],
    "prerequisites": "Korean 4.1 – Keeping the Conversation Going",
    "status": "locked",
    "content_markdown": (
        "# Korean 4.2 – Real‑World Korean: Travel & Errands\n\n"
        "### B1 Travel & Errands Goal\n"
        "At B1, you should be able to deal with most situations when travelling—buying tickets, booking rooms, ordering food, asking for help, and clarifying information.\n\n"
        "### Key Contexts\n"
        "1. **Transport (교통):** Buying tickets, asking about times/routes.\n"
        "2. **Hotel/Guesthouse (숙소):** Checking in/out, basic questions, simple problems.\n"
        "3. **Shops/Cafés (상점/카페):** Ordering, asking prices, paying.\n"
        "4. **Help & Clarification (도움/확인):** Asking someone to repeat or explain."
    ),
    "contexts": ["transport", "hotel", "shop", "help"],
    "functional_phrases": [
        {"ko": "부산행 기차표 한 장 주세요.", "rom": "Busan-haeng gichapyo han jang juseyo.", "en": "One train ticket to Busan, please.", "tag": "request", "context": "transport"},
        {"ko": "다음 버스는 몇 시에 출발해요?", "rom": "Daeum beoseu-neun myeot si-e chulbal-haeyo?", "en": "What time does the next bus depart?", "tag": "info", "context": "transport"},
        {"ko": "체크인하고 싶은데요. 예약자 이름은 김민수입니다.", "rom": "Chekeuin-hago sipeundeyo. Yeyakja ireum-eun Kim Min-su-imnida.", "en": "I'd like to check in. The booking name is Minsu Kim.", "tag": "request", "context": "hotel"},
        {"ko": "방에 온수가 안 나와요.", "rom": "Bang-e onsu-ga an nawayo.", "en": "There is no hot water in the room.", "tag": "problem", "context": "hotel"},
        {"ko": "이거 얼마예요? 카드로 결제할 수 있나요?", "rom": "Igeo eolmayeyo? Kadeu-ro gyeolje-hal su innayo?", "en": "How much is this? Can I pay by card?", "tag": "info", "context": "shop"},
        {"ko": "죄송하지만 다시 말씀해 주시겠어요?", "rom": "Joesong-hajiman dasi malsseum-hae jusigess-eoyo?", "en": "Excuse me, but could you say that again?", "tag": "clarify", "context": "help"},
        {"ko": "이 근처에 약국이 어디에 있어요?", "rom": "I geuncheo-e yakguk-i eodi-e isseoyo?", "en": "Where is a pharmacy near here?", "tag": "info", "context": "help"}
    ],
    "trip_snapshot": [
        {"step": 1, "title": "Buy Ticket", "desc": "Buy a train ticket to Busan", "phrases": ["부산행 기차표 한 장 주세요."]},
        {"step": 2, "title": "Check In", "desc": "Check into the hotel using reservation name", "phrases": ["체크인하고 싶은데요."]},
        {"step": 3, "title": "Shop", "desc": "Ask for the price and pay at a local shop", "phrases": ["이거 얼마예요?"]},
        {"step": 4, "title": "Solve Problem", "desc": "Report that hot water is not running in your room", "phrases": ["방에 온수가 안 나와요."]}
    ],
    "dialogues": [
        {
            "id": "travel_dial_1",
            "context": "transport",
            "title": "Buying a Train Ticket",
            "turns": [
                {"speaker": "Clerk", "ko": "안녕하세요, 어디로 가십니까?", "en": "Hello, where are you heading?", "audio_url": "/api/v1/speech/tts?text=안녕하세요, 어디로 가십니까?&lang=ko"},
                {"speaker": "Customer", "ko": "부산행 기차표 한 장 주세요. 몇 시에 출발해요?", "en": "One ticket to Busan, please. What time does it depart?", "audio_url": "/api/v1/speech/tts?text=부산행 기차표 한 장 주세요. 몇 시에 출발해요?&lang=ko"},
                {"speaker": "Clerk", "ko": "두 시 반에 출발하는 기차가 있습니다. 3만 원입니다.", "en": "There is a train departing at 2:30. It is 30,000 won.", "audio_url": "/api/v1/speech/tts?text=두 시 반에 출발하는 기차가 있습니다. 3만 원입니다.&lang=ko"},
                {"speaker": "Customer", "ko": "네, 카드로 결제할게요. 감사합니다.", "en": "Yes, I will pay by card. Thank you.", "audio_url": "/api/v1/speech/tts?text=네, 카드로 결제할게요. 감사합니다.&lang=ko"}
            ],
            "questions": {
                "where": "Station",
                "task": "buy ticket",
                "key_info": "2:30 PM",
                "choices_where": ["Station", "Hotel", "Café"],
                "choices_task": ["buy ticket", "check-in", "order food"],
                "choices_key_info": ["1:30 PM", "2:30 PM", "3:30 PM"]
            }
        }
    ],
    "task_templates": {
        "scenarios": [
            {
                "id": "buy_ticket",
                "name": "Buy a Ticket",
                "partner_intro": "어서 오세요. 어디로 가세요? (Welcome. Where are you going?)",
                "required_slots": ["destination", "quantity"],
                "suggested_phrases": ["...행 표 주세요.", "몇 시에 출발해요?"]
            },
            {
                "id": "hotel_checkin",
                "name": "Check into Hotel",
                "partner_intro": "체크인이십니까? 성함이 어떻게 되세요? (Checking in? What is your name?)",
                "required_slots": ["name", "nights"],
                "suggested_phrases": ["체크인하고 싶은데요.", "예약자 이름은 ...입니다."]
            }
        ]
    },
    "quiz": [
        {
            "id": "q_b1_trav_1",
            "type": "situation_select",
            "question": "You want to check if this is the right bus to Seoul. What is the most natural question?",
            "options": [
                "이 버스 서울에 가요? (Does this bus go to Seoul?)",
                "오늘 날씨가 춥네요. (It's cold today.)",
                "커피 한 잔 주세요. (A cup of coffee, please.)"
            ],
            "correct_answer": "이 버스 서울에 가요? (Does this bus go to Seoul?)",
            "explanation": "Asking '이 버스 서울에 가요?' directly confirms the bus destination."
        },
        {
            "id": "q_b1_trav_2",
            "type": "info_extract",
            "question": "If the hotel clerk says: '방 번호는 402호이고, 비밀번호는 1234입니다.' What is the room number?",
            "options": [
                "Room 402",
                "Room 1234",
                "Room 102"
            ],
            "correct_answer": "Room 402",
            "explanation": "방 번호 (room number) is stated as 402호."
        },
        {
            "id": "q_b1_trav_3",
            "type": "problem_select",
            "question": "Which phrase describes a problem with the Wi-Fi connection?",
            "options": [
                "와이파이가 안 돼요. (Wi-Fi is not working.)",
                "와이파이가 아주 빨라요. (Wi-Fi is very fast.)",
                "와이파이 비밀번호가 뭐예요? (What is the Wi-Fi password?)"
            ],
            "correct_answer": "와이파이가 안 돼요. (Wi-Fi is not working.)",
            "explanation": "'안 돼요' indicates that something is not working or not functional."
        }
    ],
    "homework": [
        {"id": "hw_b1_trav_1", "text": "Write 3 mini-scripts (4-6 lines) covering: buying a ticket, checking in, and ordering at a café."},
        {"id": "hw_b1_trav_2", "text": "Record yourself speaking both roles of your custom hotel check-in script."},
        {"id": "hw_b1_trav_3", "text": "Write 3 sentences in Korean describing a past travel problem you encountered and resolved."}
    ]
}
