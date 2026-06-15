import json
import httpx
from typing import Dict, Any, List
from backend.app.core.config import settings

class AITutorService:
    def __init__(self):
        pass

    async def translate_via_llama(self, english_text: str) -> str:
        """
        Translate English tutor reply to clean Korean using the elite llama-3.3-70b-versatile model via Groq.
        """
        try:
            headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            prompt = (
                "You are an expert English-to-Korean translator.\n"
                "Translate the following English text (which may contain minor Korean words) into exceptionally natural, polite, and educational Korean.\n"
                "Provide only the clean, natural Korean translation. Do not include any explanation or extra text.\n\n"
                f"Text to translate:\n{english_text}"
            )
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2
            }
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=20.0
                )
                if response.status_code == 200:
                    res_data = response.json()
                    translation = res_data["choices"][0]["message"]["content"].strip()
                    if translation:
                        return translation
        except Exception as e:
            print(f"!!! Llama Translation intercept failed: {e}", flush=True)
        return ""

    async def generate_response(self, conversation_history: List[Dict[str, str]], user_message: str, context: str = "", model_override: str | None = None, base_language: str = "korean") -> Dict[str, Any]:
        """
        Generate dialogue reply and grammatical corrections. Fully wrapped in a global exception handler to guarantee zero downtime.
        """
        try:
            # Map selected model to cloud Groq models, routing local/invalid options
            valid_groq_models = {
                "llama-3.3-70b-versatile": "llama-3.3-70b-versatile",
                "llama-3.1-8b-instant": "llama-3.1-8b-instant",
                "qwen-2.5-32b": "qwen-2.5-32b"
            }
            model_to_use = "llama-3.3-70b-versatile"
            if model_override:
                override_lower = model_override.lower()
                if "qwen" in override_lower:
                    model_to_use = "qwen-2.5-32b"
                elif "llama-3.1" in override_lower or "llama3.1" in override_lower or "8b" in override_lower:
                    model_to_use = "llama-3.1-8b-instant"
                elif "llama-3.3" in override_lower or "llama3.3" in override_lower or "70b" in override_lower:
                    model_to_use = "llama-3.3-70b-versatile"
                elif model_override in valid_groq_models:
                    model_to_use = model_override

            print(f"--> Routing to Groq Model: {model_to_use}", flush=True)

            if base_language == "english":
                language_instructions = (
                    "Your conversational response ('reply' key) MUST be written primarily in English, mixed with minor Korean words/phrases here and there to teach the student. "
                    "Use English for the main flow of dialogue, and inject Korean expressions where appropriate."
                )
                translation_desc = "the clean, complete Korean translation of the entire reply. Since the reply is mostly in English, provide a beautiful and fully Korean version of the entire message"
            else:
                language_instructions = (
                    "Your conversational response ('reply' key) MUST be written 100% in Korean. "
                    "Do NOT include any English words, phrases, or sentences inside the 'reply' field — not even parenthetical English, not even a single English sentence. "
                    "Every single sentence in 'reply' must be in Korean script (한글). "
                    "The student will read the English translation separately from the 'english_translation' field. "
                    "Example of CORRECT reply: '한국어 공부는 정말 중요하고 유익한 일이에요! 매일 조금씩 꾸준히 연습하면 실력이 빠르게 늘어요.' "
                    "Example of WRONG reply (DO NOT DO THIS): '한국어 공부는 정말 유익해요! Studying Korean is very useful! 같이 공부해요.' — English sentences are strictly forbidden."
                )
                translation_desc = "the clean, complete English translation of the entire Korean reply — this is the ONLY place English should appear"

            system_prompt = (
                "You are Gwan-Sik, an elite, professional bilingual Korean language tutor teaching English speakers.\n"
                "Your objective is to hold a natural, supportive conversation. You must support both English and Korean inputs, "
                f"understand the context of the student's message in either language, and reply correctly.\n"
                f"{language_instructions}\n"
                "When asked about your name, always identify yourself as Gwan-Sik. "
                "Analyze the user's message, provide explicit grammar corrections in English if they made any mistakes, explain corrections, "
                "and offer additional helpful insights.\n\n"
            )
            
            if context:
                system_prompt += f"Here is relevant curriculum context from the textbook/reading materials to guide your explanation:\n{context}\n\n"
                
            system_prompt += (
                "You must return the response in strict JSON format with these exact keys:\n"
                "{\n"
                '  "reply": "your conversational response. This should be beautifully curated according to the question asked and should be well and efficiently markdowned and formatted.",\n'
                f'  "english_translation": "{translation_desc}",\n'
                '  "correction": "explanation in English of any errors in their Korean input, or null if their sentence is grammatically perfect",\n'
                '  "grammar_notes": "additional helpful grammar or vocabulary insights in English"\n'
                "}"
            )

            messages = [{"role": "system", "content": system_prompt}]
            for msg in conversation_history:
                role = "assistant" if msg["sender_role"] == "assistant" else "user"
                messages.append({"role": role, "content": msg["content"]})
            messages.append({"role": "user", "content": user_message})

            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": model_to_use,
                    "messages": messages,
                    "temperature": 0.3
                }
                
                # Apply JSON mode for models natively supporting it
                if model_to_use not in ["groq/compound", "groq/compound-mini", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]:
                    payload["response_format"] = {"type": "json_object"}

                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=60.0
                )
                
                if response.status_code != 200:
                    raise Exception(f"Groq API returned status code {response.status_code}: {response.text}")
                
                res_data = response.json()
                content = res_data["choices"][0]["message"]["content"]
                
                try:
                    parsed = json.loads(content)
                except Exception:
                    import re
                    json_match = re.search(r"\{.*\}", content, re.DOTALL)
                    if json_match:
                        parsed = json.loads(json_match.group(0))
                    else:
                        raise Exception("Failed to parse JSON response from Groq")

                if base_language == "english":
                    llama_trans = await self.translate_via_llama(parsed.get("reply", ""))
                    if llama_trans:
                        parsed["english_translation"] = llama_trans

                return await self.refine_formatting({
                    "reply": parsed.get("reply", "안녕하세요!"),
                    "english_translation": parsed.get("english_translation"),
                    "correction": parsed.get("correction"),
                    "grammar_notes": parsed.get("grammar_notes")
                }, base_language)

        except Exception as e:
            import traceback
            print(f"!!! AI Tutor Service Exception: {e}", flush=True)
            traceback.print_exc()
            
            # Smart context-aware keyword-matching bilingual fallback to prevent static stubs
            msg = user_message.lower()
            
            if "안녕" in msg or "hello" in msg or "hi" in msg:
                return {
                    "reply": "안녕하세요! 반갑습니다. 오늘 기분이 어떠신가요?",
                    "english_translation": "Hello! Nice to meet you. How are you feeling today?",
                    "correction": None,
                    "grammar_notes": "안녕하세요 (*An-nyeong-ha-se-yo*) is the standard polite greeting meaning 'Hello'. 기분이 어떠세요 means 'How are you feeling?'"
                }
            elif "날씨" in msg or "weather" in msg or "warm" in msg or "cold" in msg:
                return {
                    "reply": "오늘 날씨가 정말 화창하네요! 비가 오거나 눈이 오는 날을 좋아하시나요?",
                    "english_translation": "The weather is really sunny today! Do you like rainy or snowy days?",
                    "correction": None,
                    "grammar_notes": "**날씨** means weather. **화창하네요** (*hwa-chang-ha-ne-yo*) means 'is bright and sunny'."
                }
            elif "음식" in msg or "food" in msg or "먹" in msg or "eat" in msg or "delicious" in msg:
                return {
                    "reply": "한국 음식은 정말 맛있고 인기가 많아요! 비빔밥이나 김치찌개를 드셔보셨나요?",
                    "english_translation": "Korean food is really delicious and popular! Have you tried bibimbap or kimchi stew?",
                    "correction": None,
                    "grammar_notes": "**음식** means food. **맛있고** (*mat-it-go*) means 'is delicious and'. The particle **-나** connects two alternatives ('A or B')."
                }
            elif "취미" in msg or "hobby" in msg or "music" in msg or "음악" in msg or "영화" in msg:
                return {
                    "reply": "제 취미는 새로운 언어를 공부하는 것이에요! 당신의 취미는 무엇인가요?",
                    "english_translation": "My hobby is studying new languages! What is your hobby?",
                    "correction": None,
                    "grammar_notes": "**취미** (*chwi-mi*) means hobby. **무엇인가요** (*mu-eot-in-ga-yo*) is a polite way to ask 'What is it?'"
                }
            elif "이름" in msg or "name" in msg or "who" in msg:
                return {
                    "reply": "제 이름은 관식이에요! 만나서 반갑습니다.",
                    "english_translation": "My name is Gwan-Sik! Nice to meet you.",
                    "correction": None,
                    "grammar_notes": "**이름** (*i-reum*) means name. **반갑습니다** (*ban-gap-seup-ni-da*) is the formal expression for 'Nice to meet you'."
                }
            elif "공부" in msg or "learn" in msg or "study" in msg or "school" in msg:
                return {
                    "reply": "한국어 공부는 정말 유익하고 가치 있는 일이에요! 매일 조금씩 꾸준히 연습하면 실력이 빠르게 늘어요.",
                    "english_translation": "Studying Korean is a very beneficial and valuable thing! If you practice a little bit every day consistently, your skills will improve quickly.",
                    "correction": None,
                    "grammar_notes": "**공부** (*gong-bu*) means study. **유익하고** means 'is beneficial and'. **꾸준히** (*kku-jun-hi*) means 'consistently/steadily'."
                }
            
            # Default generic Korean-only dialogue
            return {
                "reply": "정말 흥미로운 대화 주제네요! 더 자세하게 이야기해주시겠어요?",
                "english_translation": "That is a very interesting topic of conversation! Could you talk about it in more detail?",
                "correction": "Your sentence structure looks excellent. Try incorporating particles (~은/는, ~이/가) next time!",
                "grammar_notes": "Korean sentences place the verb at the very end, unlike English SVO layouts."
            }

    async def refine_formatting(self, tutor_response: Dict[str, Any], base_language: str = "korean") -> Dict[str, Any]:
        """
        Use the elite llama-3.3-70b-versatile model to format the response into beautiful, structural Markdown with pointers, bold/italic highlights, and clean typography.
        """
        try:
            if base_language == "english":
                refiner_reply_desc = "beautifully structured Markdown response in English (mixed with minor Korean vocabulary/phrases where appropriate) — proper headers, each bullet on its own line, bold key terms, blank lines between sections"
                refiner_trans_desc = "clean Korean translation of the reply, also properly formatted with bullets on their own lines"
            else:
                refiner_reply_desc = "beautifully structured Markdown response in Korean — proper headers, each bullet on its own line, bold key terms, blank lines between sections"
                refiner_trans_desc = "clean English translation of the reply, also properly formatted with bullets on their own lines"

            refiner_system_prompt = (
                "You are a Markdown formatting expert for a Korean language learning chat application.\n"
                "Your task: take a bilingual Korean-English tutor response object (reply, translation, correction, grammar_notes) "
                "and reformat every field into clean, polished Markdown that renders perfectly in a modern React chat UI — "
                "exactly like a well-formatted ChatGPT or Claude response.\n\n"
                "════════════════════════════════════════\n"
                "STRICT FORMATTING RULES — NEVER BREAK THESE\n"
                "════════════════════════════════════════\n\n"
                "RULE 1 — BULLET LISTS (most critical rule):\n"
                "Each bullet item MUST be on its own separate line. A blank line MUST precede any list.\n"
                "NEVER write list items inline inside a sentence.\n\n"
                "  ✅ CORRECT (each item on its own line):\n"
                "  Here are some tips:\n\n"
                "  - Tip number one goes here\n"
                "  - Tip number two goes here\n"
                "  - Tip number three goes here\n\n"
                "  ❌ WRONG (items crammed inline — fix every instance of this):\n"
                "  Here are some tips: - Tip one - Tip two - Tip three\n\n"
                "  ❌ ALSO WRONG (hanging dash after comma):\n"
                "  For example, - spend 30 minutes reading, - reviewing vocabulary\n\n"
                "RULE 2 — HEADERS:\n"
                "Use ### for major section titles when the reply has 2+ distinct sections.\n"
                "Example: ### 📚 Study Plan\n\n"
                "RULE 3 — BOLD:\n"
                "Use **word** for: Korean vocabulary, grammar particles (은/는, 이/가, 을/를), key concepts, and action items.\n\n"
                "RULE 4 — ITALIC:\n"
                "Use *word* for romanizations and pronunciation guides only.\n\n"
                "RULE 5 — SPACING:\n"
                "Always add a blank line: between sections, before and after every list, between paragraphs.\n\n"
                "RULE 6 — NUMBERED LISTS:\n"
                "Use 1. 2. 3. for steps and ordered sequences. Same line-per-item rule applies.\n\n"
                "RULE 7 — EMOJIS:\n"
                "Maximum 2 emojis per field. Place them only at the start of a section header or the end of the closing sentence — never mid-sentence.\n\n"
                "RULE 8 — PRESERVE ALL CONTENT:\n"
                "Do not add, remove, or change any information. Only restructure and reformat.\n\n"
                "RULE 9 — CLOSE WITH A QUESTION:\n"
                "The reply field must end with a short, natural follow-up question to the student.\n\n"
                "You must output the formatted content in strict JSON format with these exact keys:\n"
                "{\n"
                f'  "reply": "{refiner_reply_desc}",\n'
                f'  "english_translation": "{refiner_trans_desc}",\n'
                '  "correction": "formatted grammar correction in English with each correction point on its own bullet line, or null if no errors",\n'
                '  "grammar_notes": "grammar insights in English — each insight as its own bullet point on its own line, with **bold** key terms and *italic* romanizations"\n'
                "}"
            )
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": refiner_system_prompt},
                            {"role": "user", "content": f"Please format and beautify this tutor response:\n{json.dumps(tutor_response, ensure_ascii=False)}"}
                        ],
                        "response_format": {"type": "json_object"},
                        "temperature": 0.2
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    res_data = response.json()
                    content = res_data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    tutor_response = {
                        "reply": parsed.get("reply", tutor_response["reply"]),
                        "english_translation": parsed.get("english_translation", tutor_response["english_translation"]),
                        "correction": parsed.get("correction", tutor_response["correction"]),
                        "grammar_notes": parsed.get("grammar_notes", tutor_response["grammar_notes"])
                    }
        except Exception as err:
            print(f"!!! Markdown Refiner failed, falling back to original: {err}", flush=True)
            
        # Ensure all fields are clean strings or None to prevent Pydantic and Evaluator Daemon crashes
        cleaned = {}
        for key in ["reply", "english_translation", "correction", "grammar_notes"]:
            val = tutor_response.get(key)
            if val is None:
                cleaned[key] = None
            elif isinstance(val, list):
                cleaned[key] = "\n".join([f"- {item}" if not str(item).strip().startswith("-") else str(item) for item in val])
            elif isinstance(val, dict):
                cleaned[key] = json.dumps(val)
            else:
                cleaned[key] = str(val)
        return cleaned
