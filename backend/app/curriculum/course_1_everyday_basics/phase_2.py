PHASE_2_DATA = {
    "title": "Korean 1.2 – Introducing Yourself",
    "topic": "Introducing Yourself",
    "description": "Say your name, where you're from, and ask others about themselves.",
    "estimated_time": "20–25 minutes",
    "goals": [
        "Introduce yourself with name and country",
        "Ask and answer simple 'Where are you from?' questions",
        "Build a short A1-level self-introduction"
    ],
    "prerequisites": "Korean 1.1 – Greetings & Polite Basics",
    "status": "locked",
    "content_markdown": (
        "# Korean 1.2 – Introducing Yourself\n\n"
        "### A typical Korean self-introduction (자기소개) at A1 level includes:\n"
        "1. **Greeting:** 안녕하세요 (Hello)\n"
        "2. **Name:** 제 이름은 [Name]입니다 (My name is...) or 저는 [Name]입니다 (I am...)\n"
        "3. **Country / Origin:** 저는 [Country] 사람입니다 (I am a [Country] person) or 저는 [Country]에서 왔습니다 (I came from [Country])\n"
        "4. **Closing:** 반갑습니다 (Nice to meet you / Glad to meet you)\n\n"
        "#### Polite Sentences & Question Frames:\n"
        "- **제 이름은 [이름]입니다 (Je i-reum-eun [Name]-im-ni-da):** My name is [Name].\n"
        "- **저는 [나라] 사람입니다 (Jeo-neun [Country] sa-ram-im-ni-da):** I am [Country-ian]. (e.g. 저는 미국 사람입니다 - I'm American)\n"
        "- **저는 [직업]입니다 (Jeo-neun [Job]-im-ni-da):** I am a [Job]. (e.g. 저는 학생입니다 - I'm a student)\n"
        "- **이름이 어떻게 되세요? (I-reum-i eo-tteo-ke doe-se-yo?):** What is your name? (Polite conversational form)\n"
        "- **어느 나라 사람입니까? (Eo-neu na-ra sa-ram-im-ni-kka?):** What nationality are you? / Where are you from?\n"
    ),
    "patterns": [
        {
            "id": "pat_name_1",
            "type": "name",
            "korean": "제 이름은 [이름]입니다",
            "romanization": "Je i-reum-eun [Name]-im-ni-da",
            "english": "My name is [Name]",
            "usage": "The standard, polite way to introduce your name. Replace [이름] with your name."
        },
        {
            "id": "pat_name_2",
            "type": "name",
            "korean": "저는 [이름]입니다",
            "romanization": "Jeo-neun [Name]-im-ni-da",
            "english": "I am [Name]",
            "usage": "A direct, polite alternative. Very common in casual polite intros."
        },
        {
            "id": "pat_country_1",
            "type": "country",
            "korean": "저는 [나라] 사람입니다",
            "romanization": "Jeo-neun [Country] sa-ram-im-ni-da",
            "english": "I am from [Country] / I am [Nationality]",
            "usage": "Literal: 'I am [Country] person'. e.g., 저는 한국 사람입니다 (I am Korean)."
        },
        {
            "id": "pat_country_2",
            "type": "country",
            "korean": "저는 [나라]에서 왔습니다",
            "romanization": "Jeo-neun [Country]-eoseo wat-seum-ni-da",
            "english": "I came from [Country]",
            "usage": "Use this to emphasize where you traveled or originated from."
        },
        {
            "id": "pat_occupation_1",
            "type": "occupation",
            "korean": "저는 [직업]입니다",
            "romanization": "Jeo-neun [Occupation]-im-ni-da",
            "english": "I am a [Occupation]",
            "usage": "State your profession. e.g. 학생 (student), 회사원 (office worker), 선생님 (teacher)."
        },
        {
            "id": "pat_q_name",
            "type": "question",
            "korean": "이름이 어떻게 되세요?",
            "romanization": "I-reum-i eo-tteo-ke doe-se-yo?",
            "english": "What is your name?",
            "usage": "A highly natural, polite conversation frame to ask for someone's name."
        },
        {
            "id": "pat_q_country",
            "type": "question",
            "korean": "어느 나라 사람입니까?",
            "romanization": "Eo-neu na-ra sa-ram-im-ni-kka?",
            "english": "Where are you from? / What is your nationality?",
            "usage": "A polite formal question to ask someone their country of origin."
        }
    ],
    "practice_listening": [
        {
            "id": "lis_intro_1",
            "audio_text": "제 이름은 김민수입니다",
            "english_options": [
                {"id": "opt_li_1", "text": "My name is Kim Minsu."},
                {"id": "opt_li_2", "text": "I am from Korea."},
                {"id": "opt_li_3", "text": "I am a student."}
            ],
            "correct_option_id": "opt_li_1",
            "korean": "제 이름은 김민수입니다",
            "romanization": "Je i-reum-eun Kim Min-su-im-ni-da"
        },
        {
            "id": "lis_intro_2",
            "audio_text": "저는 미국 사람입니다",
            "english_options": [
                {"id": "opt_li_b1", "text": "What is your name?"},
                {"id": "opt_li_b2", "text": "I am from the USA / I am American."},
                {"id": "opt_li_b3", "text": "I work at an office."}
            ],
            "correct_option_id": "opt_li_b2",
            "korean": "저는 미국 사람입니다",
            "romanization": "Jeo-neun Mi-guk sa-ram-im-ni-da"
        },
        {
            "id": "lis_intro_3",
            "audio_text": "저는 학생입니다",
            "english_options": [
                {"id": "opt_li_c1", "text": "I am a student."},
                {"id": "opt_li_c2", "text": "Nice to meet you."},
                {"id": "opt_li_c3", "text": "My name is Lisa."}
            ],
            "correct_option_id": "opt_li_c1",
            "korean": "저는 학생입니다",
            "romanization": "Jeo-neun hak-saeng-im-ni-da"
        }
    ],
    "countries": [
        {"ko": "미국", "en": "USA"},
        {"ko": "한국", "en": "Korea"},
        {"ko": "영국", "en": "UK"},
        {"ko": "캐나다", "en": "Canada"},
        {"ko": "프랑스", "en": "France"},
        {"ko": "독일", "en": "Germany"},
        {"ko": "일본", "en": "Japan"},
        {"ko": "중국", "en": "China"}
    ],
    "occupations": [
        {"ko": "학생", "en": "Student"},
        {"ko": "회사원", "en": "Office Worker"},
        {"ko": "선생님", "en": "Teacher"},
        {"ko": "의사", "en": "Doctor"},
        {"ko": "엔지니어", "en": "Engineer"}
    ],
    "quiz": [
        {
            "id": "q_intro_lis_1", 
            "type": "listening", 
            "question": "Listen to the speaker and identify what type of details they are introducing:", 
            "audio_text": "저는 영국 사람입니다", 
            "options": ["Name (이름)", "Origin (출신)", "Occupation (직업)"], 
            "correct_answer": "Origin (출신)", 
            "explanation": "저는 영국 사람입니다 means 'I am British / from the UK' (Origin)."
        },
        {
            "id": "q_intro_match_2", 
            "type": "context", 
            "question": "Choose the correct English meaning for the Korean line: 제 이름은 지우입니다", 
            "options": ["My name is Jiwoo.", "I am from France.", "I am a teacher."], 
            "correct_answer": "My name is Jiwoo.", 
            "explanation": "제 이름은 지우입니다 translates to 'My name is Jiwoo'."
        },
        {
            "id": "q_intro_fill_3", 
            "type": "context", 
            "question": "Choose the correct country word to say 'I am Canadian': 저는 [ ] 사람입니다.", 
            "options": ["캐나다", "학생", "반갑습니다"], 
            "correct_answer": "캐나다", 
            "explanation": "캐나다 is Canada. Combining it makes '저는 캐나다 사람입니다' (I am Canadian)."
        },
        {
            "id": "q_intro_type_4", 
            "type": "writing", 
            "question": "Type the polite Hangeul word meaning 'student':", 
            "correct_answer": "학생", 
            "explanation": "학생 means student in Korean."
        },
        {
            "id": "q_intro_speak_5", 
            "type": "speaking", 
            "question": "Introduce your origin by reading this sentence aloud: '저는 미국 사람입니다'", 
            "correct_answer": "저는 미국 사람입니다", 
            "explanation": "This sentence says 'I am American'."
        }
    ],
    "homework": [
        {"id": "hw_intro_1", "text": "Record yourself saying your complete self-intro (greeting, name, origin, closing) 3 times out loud."},
        {"id": "hw_intro_2", "text": "Practice introducing yourself to a mirror: '안녕하세요. 제 이름은 ... 입니다. 반갑습니다!'"},
        {"id": "hw_intro_3", "text": "Write your self-introduction as a short text message in Korean and save it in your notes."}
    ]
}

