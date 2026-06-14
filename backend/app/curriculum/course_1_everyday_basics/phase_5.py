PHASE_5_DATA = {
    "title": "Korean 1.5 – Places & Location",
    "topic": "Places & Location",
    "description": "Say where you are, where you're going, and talk about everyday places.",
    "estimated_time": "25–30 minutes",
    "goals": [
        "Learn common place words (home, school, office, café, store, etc.)",
        "Ask and answer 'Where are you?' and 'Where are you going?' in simple polite Korean",
        "Describe basic movements like 'go to school' or 'go to the café'"
    ],
    "prerequisites": "Korean 1.4 – Daily Activities",
    "status": "locked",
    "content_markdown": (
        "# Korean 1.5 – Places & Location\n\n"
        "### Core Places (장소)\n"
        "Here are high-frequency everyday places you'll need to know:\n"
        "- **집 (jip):** Home\n"
        "- **학교 (hak-gyo):** School\n"
        "- **회사 (hoe-sa):** Office / Company\n"
        "- **카페 (ka-pe):** Café\n"
        "- **식당 (sik-dang):** Restaurant\n"
        "- **마트 (ma-teu):** Supermarket / Store\n"
        "- **공원 (gong-won):** Park\n"
        "- **역 (yeok):** Station\n"
        "- **화장실 (hwa-jang-sil):** Bathroom\n\n"
        "### Key Particles & Patterns\n"
        "Korean uses suffixes (particles) attached to place nouns to show location or movement direction:\n"
        "1. **Location: 에 있어요 (at/in [place]):** E.g. **집에 있어요 (jip-e is-seo-yo)** = I am at home.\n"
        "2. **Destination: 에 가요 (going to [place]):** E.g. **학교에 가요 (hak-gyo-e ga-yo)** = I go to school.\n\n"
        "#### Simple Conversational Q&A:\n"
        "- **Q: 어디예요? (eo-di-ye-yo?):** Where are you?\n"
        "- **A: 회사예요 (hoe-sa-ye-yo):** I am at the office.\n"
        "- **Q: 어디 가요? (eo-di ga-yo?):** Where are you going?\n"
        "- **A: 카페에 가요 (ka-pe-e ga-yo):** I am going to the café.\n"
    ),
    "places": [
        {"id": "p_home", "korean": "집", "romanization": "jip", "english": "Home", "tag": "home"},
        {"id": "p_school", "korean": "학교", "romanization": "hak-gyo", "english": "School", "tag": "study"},
        {"id": "p_office", "korean": "회사", "romanization": "hoe-sa", "english": "Office / Company", "tag": "work"},
        {"id": "p_cafe", "korean": "카페", "romanization": "ka-pe", "english": "Café", "tag": "leisure"},
        {"id": "p_restaurant", "korean": "식당", "romanization": "sik-dang", "english": "Restaurant", "tag": "leisure"},
        {"id": "p_store", "korean": "마트", "romanization": "ma-teu", "english": "Store / Supermarket", "tag": "leisure"},
        {"id": "p_park", "korean": "공원", "romanization": "gong-won", "english": "Park", "tag": "leisure"},
        {"id": "p_station", "korean": "역", "romanization": "yeok", "english": "Station", "tag": "leisure"},
        {"id": "p_bathroom", "korean": "화장실", "romanization": "hwa-jang-sil", "english": "Bathroom", "tag": "home"}
    ],
    "pattern_examples": [
        {"ko": "어디예요? 집에 있어요.", "en": "Where are you? I'm at home.", "audio_text": "어디예요 집에 있어요"},
        {"ko": "어디 가요? 학교에 가요.", "en": "Where are you going? I'm going to school.", "audio_text": "어디 가요 학교에 가요"},
        {"ko": "식당에 가요.", "en": "I am going to the restaurant.", "audio_text": "식당에 가요"}
    ],
    "practice_places": [
        {"id": "prac_p_1", "korean": "학교", "options": ["School", "Home", "Office"], "correct": "School"},
        {"id": "prac_p_2", "korean": "회사", "options": ["Office", "Café", "Bathroom"], "correct": "Office"},
        {"id": "prac_p_3", "korean": "화장실", "options": ["Bathroom", "Restaurant", "Park"], "correct": "Bathroom"}
    ],
    "practice_sentences": [
        {"id": "prac_ps_1", "sentence": "저는 카페에 있어요", "options": ["I am at the café", "I am going to the café", "I am at home"], "correct": "I am at the café"},
        {"id": "prac_ps_2", "sentence": "공원에 가요", "options": ["I go to the park", "I am at the park", "I go to the station"], "correct": "I go to the park"}
    ],
    "qa_dialogues": [
        {
            "id": "qa_1",
            "question": "어디예요? (Where are you?)",
            "options": [
                {"id": "opt_qa1_1", "text": "집에 있어요. (I'm at home.)", "correct": True},
                {"id": "opt_qa1_2", "text": "집에 가요. (I'm going home.)", "correct": False}
            ],
            "explanation": "어디예요? asks for your current location. 집에 있어요 (I'm at home) matches this. 집에 가요 means you are moving towards home."
        },
        {
            "id": "qa_2",
            "question": "어디 가요? (Where are you going?)",
            "options": [
                {"id": "opt_qa2_1", "text": "회사에 가요. (I'm going to the office.)", "correct": True},
                {"id": "opt_qa2_2", "text": "회사에 있어요. (I'm at the office.)", "correct": False}
            ],
            "explanation": "어디 가요? asks for your destination. '회사에 가요' represents destination movement."
        }
    ],
    "builder_templates": {
        "location": "저는 [장소]에 있어요.",
        "destination": "저는 [장소]에 가요."
    },
    "quiz": [
        {"id": "q_loc_1", "type": "listening", "question": "Hear the place and select the correct English name:", "audio_text": "식당", "options": ["Restaurant", "School", "Station", "Café"], "correct_answer": "Restaurant", "explanation": "식당 (sik-dang) means restaurant in Korean."},
        {"id": "q_loc_2", "type": "context", "question": "Identify where the person is: '저는 회사에 있어요.'", "options": ["at home", "at the office", "at school"], "correct_answer": "at the office", "explanation": "회사 (hoe-sa) means office. '저는 회사에 있어요' translates to 'I am at the office'."},
        {"id": "q_loc_3", "type": "context", "question": "Complete the destination response: '어디 가요?' -> '[ ]에 가요.' (I am going to the station.)", "options": ["역", "집", "화장실"], "correct_answer": "역", "explanation": "역 (yeok) is station. '역에 가요' is 'I am going to the station'."},
        {"id": "q_loc_4", "type": "writing", "question": "Type the polite Korean word for 'home' (집):", "correct_answer": "집", "explanation": "집 means home/house in Korean."},
        {"id": "q_loc_5", "type": "speaking", "question": "Read this destination sentence aloud: '저는 학교에 가요'", "correct_answer": "저는 학교에 가요", "explanation": "This reads 'I go to school / I am going to school'."}
    ],
    "homework": [
        {"id": "hw_loc_1", "text": "Write 3 simple Korean sentences stating where you are right now (e.g. 집에 있어요)."},
        {"id": "hw_loc_2", "text": "Name 3 places you plan to visit tomorrow in Korean and speak them aloud using '에 가요'."},
        {"id": "hw_loc_3", "text": "Sketch a simple blueprint layout of your current room and label the door or window in Korean."}
    ]
}
