PHASE_3_DATA = {
    "title": "Korean 1.3 – Numbers & Everyday Facts",
    "topic": "Numbers & Everyday Facts",
    "description": "Say basic numbers and understand simple time and everyday information.",
    "estimated_time": "20–25 minutes",
    "goals": [
        "Read and understand basic numbers in Korean",
        "Recognize simple time and factual information (age, price, phone)",
        "Answer simple 'How old / How much / What time?' questions at A1 level"
    ],
    "prerequisites": "Korean 1.2 – Introducing Yourself",
    "status": "locked",
    "content_markdown": (
        "# Korean 1.3 – Numbers & Everyday Facts\n\n"
        "### Sino-Korean Numbers (일, 이, 삼...)\n"
        "Korean uses two number systems. In this phase, we focus on the **Sino-Korean system**, "
        "which is used for dates, phone numbers, prices, and minutes/seconds. (For hours in telling time, "
        "Korean uses the Native system, but at A1 level we start with simple number recognitions).\n\n"
        "#### Sino-Korean Numbers 0–10:\n"
        "- **공/영 (gong/yeong):** 0\n"
        "- **일 (il):** 1\n"
        "- **이 (i):** 2\n"
        "- **삼 (sam):** 3\n"
        "- **사 (sa):** 4\n"
        "- **오 (o):** 5\n"
        "- **육 (yuk):** 6\n"
        "- **칠 (chil):** 7\n"
        "- **팔 (pal):** 8\n"
        "- **구 (gu):** 9\n"
        "- **십 (sip):** 10\n\n"
        "#### Higher Numbers:\n"
        "- Combine tens and single units: **십일 (sip-il)** = 11, **십오 (sip-o)** = 15, **이십 (i-sip)** = 20.\n"
        "- **백 (baek):** 100\n"
        "- **천 (cheon):** 1,000\n"
        "- **만 (man):** 10,000\n\n"
        "### Telling Time & Everyday Facts\n"
        "- **몇 시예요? (myeot si-ye-yo?):** What time is it?\n"
        "- **한 시 (han si):** 1 o'clock. (Told in Native Korean hours: 한, 두, 세, 네...)\n"
        "- **얼마예요? (eol-ma-ye-yo?):** How much is it?\n"
        "- **몇 살이에요? (myeot sal-i-e-yo?):** How old are you?\n"
    ),
    "numbers": [
        {"digit": "0", "ko": "영", "en": "Zero"},
        {"digit": "1", "ko": "일", "en": "One"},
        {"digit": "2", "ko": "이", "en": "Two"},
        {"digit": "3", "ko": "삼", "en": "Three"},
        {"digit": "4", "ko": "사", "en": "Four"},
        {"digit": "5", "ko": "오", "en": "Five"},
        {"digit": "6", "ko": "육", "en": "Six"},
        {"digit": "7", "ko": "칠", "en": "Seven"},
        {"digit": "8", "ko": "팔", "en": "Eight"},
        {"digit": "9", "ko": "구", "en": "Nine"},
        {"digit": "10", "ko": "십", "en": "Ten"},
        {"digit": "11", "ko": "십일", "en": "Eleven"},
        {"digit": "15", "ko": "십오", "en": "Fifteen"},
        {"digit": "20", "ko": "이십", "en": "Twenty"}
    ],
    "time_samples": [
        {"time": "1:00", "ko": "한 시", "en": "One o'clock"},
        {"time": "2:00", "ko": "두 시", "en": "Two o'clock"},
        {"time": "3:00", "ko": "세 시", "en": "Three o'clock"},
        {"time": "7:30", "ko": "일곱 시 반", "en": "Seven thirty (half)"}
    ],
    "example_sentences": [
        {"ko": "이거 얼마예요?", "en": "How much is this?", "note": "Basic price query"},
        {"ko": "천 원입니다", "en": "It is 1,000 Won", "note": "Price reply"},
        {"ko": "저는 스무 살입니다", "en": "I am 20 years old", "note": "Age statement"}
    ],
    "practice_listening": [
        {
            "id": "lis_num_1",
            "audio_text": "오",
            "digit_options": ["2", "5", "9", "15"],
            "correct_digit": "5",
            "context_type": "plain number"
        },
        {
            "id": "lis_num_2",
            "audio_text": "십칠",
            "digit_options": ["7", "10", "17", "70"],
            "correct_digit": "17",
            "context_type": "plain number"
        },
        {
            "id": "lis_num_3",
            "audio_text": "전화번호는 영일공입니다",
            "digit_options": ["010", "119", "112", "011"],
            "correct_digit": "010",
            "context_type": "sentence_with_number"
        }
    ],
    "time_practice": [
        {
            "id": "time_prac_1",
            "ko_phrase": "세 시",
            "audio_text": "세 시",
            "time_display": "3:00",
            "options": ["1:00", "2:00", "3:00", "4:00"],
            "correct_option_id": "3:00"
        },
        {
            "id": "time_prac_2",
            "ko_phrase": "일곱 시 반",
            "audio_text": "일곱 시 반",
            "time_display": "7:30",
            "options": ["7:00", "7:30", "8:30", "12:30"],
            "correct_option_id": "7:30"
        }
    ],
    "facts_practice": [
        {
            "id": "fact_age_1",
            "type": "age",
            "question": "Choose the correct Korean sentence for: 'I am 15 years old.'",
            "options": [
                "저는 십오 살입니다.",
                "저는 열다섯 살입니다.",
                "저는 다섯 살입니다."
            ],
            "correct_answer": "저는 열다섯 살입니다.",
            "explanation": "Korean uses Native numerals for age; 15 is 열다섯."
        },
        {
            "id": "fact_price_2",
            "type": "price",
            "question": "How much is this item: '오천 원입니다'?",
            "options": ["500 Won", "5,000 Won", "1,500 Won"],
            "correct_answer": "5,000 Won",
            "explanation": "오천 (o-cheon) means 5,000. '오천 원입니다' translates to 'It is 5,000 Won'."
        },
        {
            "id": "fact_phone_3",
            "type": "phone",
            "question": "Which digit sequence matches '일이삼사'?",
            "options": ["1-2-3-4", "5-6-7-8", "1-3-5-7"],
            "correct_answer": "1-2-3-4",
            "explanation": "일 (1), 이 (2), 삼 (3), 사 (4) corresponds to 1-2-3-4."
        }
    ],
    "quiz": [
        {
            "id": "q_num_1", 
            "type": "listening", 
            "question": "Hear the number and select the correct digits:", 
            "audio_text": "십이", 
            "options": ["2", "12", "20", "10"], 
            "correct_answer": "12", 
            "explanation": "십이 (sip-i) is 12 (10 + 2)."
        },
        {
            "id": "q_num_2", 
            "type": "context", 
            "question": "Which Korean word means the number 8?", 
            "options": ["일", "삼", "팔", "구"], 
            "correct_answer": "팔", 
            "explanation": "팔 (pal) corresponds to number 8."
        },
        {
            "id": "q_num_3", 
            "type": "context", 
            "question": "Match the clock time for: 두 시", 
            "options": ["1:00", "2:00", "3:00", "12:00"], 
            "correct_answer": "2:00", 
            "explanation": "두 시 means 2 o'clock."
        },
        {
            "id": "q_num_4", 
            "type": "writing", 
            "question": "Type the Sino-Korean word for number 3:", 
            "correct_answer": "삼", 
            "explanation": "삼 (sam) represents 3."
        },
        {
            "id": "q_num_5", 
            "type": "speaking", 
            "question": "Read this price sentence aloud: '오천 원입니다'", 
            "correct_answer": "오천 원입니다", 
            "explanation": "This reads 'It is 5,000 Won'."
        }
    ],
    "homework": [
        {"id": "hw_num_1", "text": "Write down 5 numbers from your daily life (phone digits, age, prices) and translate them to Korean."},
        {"id": "hw_num_2", "text": "Check a digital clock and practice saying the hours (e.g. 1 o'clock, 2 o'clock) out loud."},
        {"id": "hw_num_3", "text": "Practice saying '오천 원' (5,000 Won) and '만 원' (10,000 Won) three times."}
    ]
}

