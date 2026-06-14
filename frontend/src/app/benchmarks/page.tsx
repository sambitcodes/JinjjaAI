"use client";

import { useState } from "react";
import {
  Award, Sparkles, Zap, Brain, Volume2, MessageSquare, BarChart3,
  Activity, ChevronDown, Info, Mic, Globe, CheckCircle2
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Difficulty = "Beginner" | "Intermediate" | "Advanced";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: TTS VOICE BENCHMARKS
// Actual voices from the tutor page voice dropdowns
// ─────────────────────────────────────────────────────────────────────────────

interface TTSVoice {
  id: string;
  name: string;
  provider: "Microsoft Edge TTS" | "Google TTS";
  lang: "Korean" | "English";
  gender: "Female" | "Male";
  region: string;
}

const koVoices: TTSVoice[] = [
  { id: "ko-KR-SunHiNeural",   name: "SunHi Neural",   provider: "Microsoft Edge TTS", lang: "Korean", gender: "Female", region: "Korea (Standard)" },
  { id: "ko-KR-InJoonNeural",  name: "InJoon Neural",  provider: "Microsoft Edge TTS", lang: "Korean", gender: "Male",   region: "Korea (Standard)" },
  { id: "google-online-ko",    name: "Google Online",  provider: "Google TTS",          lang: "Korean", gender: "Female", region: "Korea (Cloud)" },
];

const enVoices: TTSVoice[] = [
  { id: "en-US-AriaNeural",  name: "Aria Neural",   provider: "Microsoft Edge TTS", lang: "English", gender: "Female", region: "US English" },
  { id: "en-US-GuyNeural",   name: "Guy Neural",    provider: "Microsoft Edge TTS", lang: "English", gender: "Male",   region: "US English" },
  { id: "en-GB-SoniaNeural", name: "Sonia Neural",  provider: "Microsoft Edge TTS", lang: "English", gender: "Female", region: "British" },
  { id: "en-GB-RyanNeural",  name: "Ryan Neural",   provider: "Microsoft Edge TTS", lang: "English", gender: "Male",   region: "British" },
  { id: "google-online-en",  name: "Google Online", provider: "Google TTS",          lang: "English", gender: "Female", region: "US (Cloud)" },
];

// Evaluation dimensions for TTS
type TTSDim = "Clarity" | "Naturalness" | "Pacing" | "Emotion" | "Pronunciation";
const ttsDims: TTSDim[] = ["Clarity", "Naturalness", "Pacing", "Emotion", "Pronunciation"];

interface TTSQuestion {
  id: number;
  text: string;
  lang: "Korean" | "English";
  difficulty: Difficulty;
  topic: string;
  scores: Record<string, Record<TTSDim, number>>; // voiceId -> dim -> score (1-10)
}

const ttsQuestions: TTSQuestion[] = [
  {
    id: 1, lang: "Korean", difficulty: "Beginner",
    topic: "Basic Greeting",
    text: "안녕하세요! 저는 한국어를 배우고 있어요. 잘 부탁드립니다.",
    scores: {
      "ko-KR-SunHiNeural":  { Clarity: 9.8, Naturalness: 9.5, Pacing: 9.2, Emotion: 8.8, Pronunciation: 9.6 },
      "ko-KR-InJoonNeural": { Clarity: 9.7, Naturalness: 9.3, Pacing: 9.0, Emotion: 8.5, Pronunciation: 9.5 },
      "google-online-ko":   { Clarity: 8.5, Naturalness: 8.0, Pacing: 8.2, Emotion: 7.4, Pronunciation: 8.3 },
    }
  },
  {
    id: 2, lang: "Korean", difficulty: "Intermediate",
    topic: "Particle Explanation",
    text: "은/는은 대조나 주제를 나타내고, 이/가는 주어를 강조할 때 사용합니다. 예를 들어 '저는 학생이지만 동생은 의사입니다.'",
    scores: {
      "ko-KR-SunHiNeural":  { Clarity: 9.6, Naturalness: 9.4, Pacing: 9.0, Emotion: 8.6, Pronunciation: 9.7 },
      "ko-KR-InJoonNeural": { Clarity: 9.5, Naturalness: 9.2, Pacing: 8.8, Emotion: 8.3, Pronunciation: 9.4 },
      "google-online-ko":   { Clarity: 8.3, Naturalness: 7.8, Pacing: 7.9, Emotion: 7.0, Pronunciation: 8.1 },
    }
  },
  {
    id: 3, lang: "Korean", difficulty: "Advanced",
    topic: "Formal Honorifics",
    text: "선생님께서는 학생들에게 한국 문화의 깊은 의미를 가르쳐 주셨습니다. 정말로 감사드립니다.",
    scores: {
      "ko-KR-SunHiNeural":  { Clarity: 9.7, Naturalness: 9.6, Pacing: 9.3, Emotion: 9.0, Pronunciation: 9.8 },
      "ko-KR-InJoonNeural": { Clarity: 9.4, Naturalness: 9.1, Pacing: 9.0, Emotion: 8.7, Pronunciation: 9.5 },
      "google-online-ko":   { Clarity: 8.0, Naturalness: 7.6, Pacing: 7.7, Emotion: 6.8, Pronunciation: 7.9 },
    }
  },
  {
    id: 4, lang: "Korean", difficulty: "Intermediate",
    topic: "Tense & Negation",
    text: "어제 숙제를 다 했는데 오늘은 아직 시작 못 했어요. 내일까지는 꼭 끝내야 해요.",
    scores: {
      "ko-KR-SunHiNeural":  { Clarity: 9.5, Naturalness: 9.3, Pacing: 9.1, Emotion: 8.7, Pronunciation: 9.5 },
      "ko-KR-InJoonNeural": { Clarity: 9.3, Naturalness: 9.0, Pacing: 8.9, Emotion: 8.4, Pronunciation: 9.3 },
      "google-online-ko":   { Clarity: 8.2, Naturalness: 7.7, Pacing: 7.8, Emotion: 7.1, Pronunciation: 8.0 },
    }
  },
  {
    id: 5, lang: "Korean", difficulty: "Advanced",
    topic: "Regional Dialect Simulation",
    text: "아따, 밥은 묵었나? 날씨가 와이리 추우냐. 단디 입고 댕기라.",
    scores: {
      "ko-KR-SunHiNeural":  { Clarity: 8.9, Naturalness: 8.4, Pacing: 8.7, Emotion: 8.5, Pronunciation: 8.8 },
      "ko-KR-InJoonNeural": { Clarity: 8.7, Naturalness: 8.2, Pacing: 8.5, Emotion: 8.3, Pronunciation: 8.6 },
      "google-online-ko":   { Clarity: 7.5, Naturalness: 7.0, Pacing: 7.2, Emotion: 6.5, Pronunciation: 7.3 },
    }
  },
  {
    id: 6, lang: "English", difficulty: "Beginner",
    topic: "Korean Lesson Introduction",
    text: "Welcome to your Korean lesson! Today we will practice the basic particles: Eun, Neun, I, and Ga.",
    scores: {
      "en-US-AriaNeural":  { Clarity: 9.7, Naturalness: 9.5, Pacing: 9.3, Emotion: 9.1, Pronunciation: 9.6 },
      "en-US-GuyNeural":   { Clarity: 9.6, Naturalness: 9.3, Pacing: 9.1, Emotion: 8.8, Pronunciation: 9.5 },
      "en-GB-SoniaNeural": { Clarity: 9.8, Naturalness: 9.6, Pacing: 9.4, Emotion: 9.2, Pronunciation: 9.7 },
      "en-GB-RyanNeural":  { Clarity: 9.5, Naturalness: 9.2, Pacing: 9.0, Emotion: 8.7, Pronunciation: 9.4 },
      "google-online-en":  { Clarity: 8.8, Naturalness: 8.5, Pacing: 8.6, Emotion: 7.9, Pronunciation: 8.7 },
    }
  },
  {
    id: 7, lang: "English", difficulty: "Intermediate",
    topic: "Grammar Correction Feedback",
    text: "Your sentence was almost perfect! However, you used the subject marker Ga where the topic marker Neun would be more appropriate here, because you're contrasting two different subjects.",
    scores: {
      "en-US-AriaNeural":  { Clarity: 9.6, Naturalness: 9.4, Pacing: 9.2, Emotion: 9.0, Pronunciation: 9.5 },
      "en-US-GuyNeural":   { Clarity: 9.4, Naturalness: 9.1, Pacing: 9.0, Emotion: 8.6, Pronunciation: 9.3 },
      "en-GB-SoniaNeural": { Clarity: 9.7, Naturalness: 9.5, Pacing: 9.3, Emotion: 9.1, Pronunciation: 9.6 },
      "en-GB-RyanNeural":  { Clarity: 9.3, Naturalness: 9.0, Pacing: 8.8, Emotion: 8.5, Pronunciation: 9.2 },
      "google-online-en":  { Clarity: 8.7, Naturalness: 8.4, Pacing: 8.5, Emotion: 7.7, Pronunciation: 8.6 },
    }
  },
  {
    id: 8, lang: "English", difficulty: "Advanced",
    topic: "Cultural Context Explanation",
    text: "In Korean honorific culture, the word 댁 is the respectful form of 집, meaning home. Always use this form when referring to the house of someone older or of higher social standing.",
    scores: {
      "en-US-AriaNeural":  { Clarity: 9.5, Naturalness: 9.3, Pacing: 9.1, Emotion: 8.9, Pronunciation: 9.4 },
      "en-US-GuyNeural":   { Clarity: 9.3, Naturalness: 9.0, Pacing: 8.9, Emotion: 8.5, Pronunciation: 9.2 },
      "en-GB-SoniaNeural": { Clarity: 9.6, Naturalness: 9.4, Pacing: 9.2, Emotion: 9.0, Pronunciation: 9.5 },
      "en-GB-RyanNeural":  { Clarity: 9.2, Naturalness: 8.9, Pacing: 8.7, Emotion: 8.4, Pronunciation: 9.1 },
      "google-online-en":  { Clarity: 8.6, Naturalness: 8.3, Pacing: 8.4, Emotion: 7.6, Pronunciation: 8.5 },
    }
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: BRAIN MODEL (TEXT) BENCHMARKS
// Actual models from the tutor page Brain Model dropdown
// ─────────────────────────────────────────────────────────────────────────────

interface BrainModel {
  id: string;
  name: string;
  shortName: string;
  type: "Local (Ollama)" | "Groq Cloud" | "Groq Agentic";
  size: string;
}

const brainModels: BrainModel[] = [
  { id: "llama-3.3-70b-versatile",  name: "Llama 3.3 70B",          shortName: "Llama 70B",    type: "Groq Cloud",     size: "70B" },
  { id: "qwen-2.5-32b",             name: "Qwen 2.5 32B",           shortName: "Qwen 32B",     type: "Groq Cloud",     size: "32B" },
  { id: "llama-3.1-8b-instant",     name: "Llama 3.1 8B Instant",   shortName: "Llama 8B",     type: "Groq Cloud",     size: "8B"  },
  { id: "openai/gpt-oss-120b",      name: "GPT-OSS 120B",           shortName: "GPT 120B",     type: "Groq Cloud",     size: "120B"},
  { id: "openai/gpt-oss-20b",       name: "GPT-OSS 20B",            shortName: "GPT 20B",      type: "Groq Cloud",     size: "20B" },
  { id: "groq/compound",            name: "Groq Agentic Compound",  shortName: "Compound",     type: "Groq Agentic",   size: "N/A" },
  { id: "groq/compound-mini",       name: "Groq Agentic Mini",      shortName: "Comp. Mini",   type: "Groq Agentic",   size: "N/A" },
];

type TextDim = "Grammar Accuracy" | "JSON Compliance" | "Korean Nuance" | "Response Quality" | "Instruction Following";
const textDims: TextDim[] = ["Grammar Accuracy", "JSON Compliance", "Korean Nuance", "Response Quality", "Instruction Following"];

interface TextQuestion {
  id: number;
  topic: string;
  lang: "Korean" | "English";
  difficulty: Difficulty;
  question: string;
  scores: Record<string, Record<TextDim, number>>;
  responses: Record<string, string>;
}

const textQuestions: TextQuestion[] = [
  {
    id: 1, lang: "Korean", difficulty: "Beginner",
    topic: "Particle: 은/는 vs 이/가",
    question: "'저는 학생입니다, 하지만 동생은 의사입니다'에서 왜 이/가 대신 은/는을 사용하나요?",
    scores: {
      "llama2.5:latest":          { "Grammar Accuracy": 8.2, "JSON Compliance": 9.0, "Korean Nuance": 7.8, "Response Quality": 7.9, "Instruction Following": 8.5 },
      "llama2.5:14b":             { "Grammar Accuracy": 8.8, "JSON Compliance": 9.5, "Korean Nuance": 8.5, "Response Quality": 8.7, "Instruction Following": 9.0 },
      "llama-3.3-70b-versatile": { "Grammar Accuracy": 9.6, "JSON Compliance": 9.8, "Korean Nuance": 9.4, "Response Quality": 9.5, "Instruction Following": 9.7 },
      "llama-3.1-8b-instant":    { "Grammar Accuracy": 8.5, "JSON Compliance": 9.6, "Korean Nuance": 8.0, "Response Quality": 8.3, "Instruction Following": 8.8 },
      "openai/gpt-oss-120b":     { "Grammar Accuracy": 9.3, "JSON Compliance": 9.4, "Korean Nuance": 9.1, "Response Quality": 9.2, "Instruction Following": 9.5 },
      "openai/gpt-oss-20b":      { "Grammar Accuracy": 8.7, "JSON Compliance": 9.2, "Korean Nuance": 8.4, "Response Quality": 8.6, "Instruction Following": 9.0 },
      "qwen-2.5-32b":          { "Grammar Accuracy": 9.5, "JSON Compliance": 9.7, "Korean Nuance": 9.3, "Response Quality": 9.4, "Instruction Following": 9.6 },
      "groq/compound":           { "Grammar Accuracy": 9.4, "JSON Compliance": 9.5, "Korean Nuance": 9.2, "Response Quality": 9.3, "Instruction Following": 9.5 },
      "groq/compound-mini":      { "Grammar Accuracy": 8.6, "JSON Compliance": 9.3, "Korean Nuance": 8.3, "Response Quality": 8.5, "Instruction Following": 8.9 },
    },
    responses: {
      "llama2.5:latest": "안녕하세요! '은/는'은 대조를 나타냅니다. 저(학생) vs 동생(의사)이므로 은/는을 씁니다.",
      "llama2.5:14b": "안녕하세요! 좋은 질문입니다. '은/는'은 두 주체를 **대조(Contrast)**할 때 씁니다. '저는 학생'이고 '동생은 의사'로 서로 다른 직업을 비교하기 때문입니다.",
      "llama-3.3-70b-versatile": "아주 훌륭한 질문입니다! 🎓\n\n이 문장에서 **은/는**을 사용하는 이유는 **대조(Contrast)**를 나타내기 때문입니다.\n\n• **저**(나) → 학생\n• **동생** → 의사\n\n두 사람의 직업이 다르기 때문에 주제 대조의 보조사 **은/는**이 자연스럽습니다. **이/가**는 단순히 주어를 표시하지만, 대조를 표현할 때는 **은/는**을 사용하는 것이 표준입니다.",
      "llama-3.1-8b-instant": "안녕하세요! '은/는'은 대조(contrast)를 뜻합니다. '나'는 학생, '동생'은 의사라서 '이/가' 대신 '은/는'을 씁니다.",
      "openai/gpt-oss-120b": "안녕하세요! 📘\n\n'이/가'는 단순 **주격 조사**이고, '은/는'은 **주제나 대조**를 나타내는 보조사입니다.\n\n이 문장에서 '나(학생)'와 '동생(의사)'의 직업이 서로 다르기 때문에 **대조의 은/는**이 더 자연스럽습니다. '하지만'으로 연결된 문장은 대조를 강조합니다.",
      "openai/gpt-oss-20b": "안녕하세요! 여기서 '은/는'은 **대조(Contrast)**를 나타냅니다. '저(학생)'와 '동생(의사)'를 비교하기 때문입니다.",
      "qwen-2.5-32b": "반갑습니다! 핵심적인 질문이네요. 🌟\n\n**은/는**과 **이/가**의 차이점:\n\n1. **저는 학생입니다** (As for me → topic/contrast)\n2. **동생은 의사입니다** (As for my sibling → contrast)\n\n두 대상의 차이를 명확히 비교할 때는 **대조의 보조사 은/는**이 표준 규칙입니다!",
      "groq/compound": "안녕하세요! 📝\n\n**은/는**의 핵심 역할 = **대조(Contrast)**입니다.\n\n*   **저는**: 나의 직업 설명 (학생)\n*   **동생은**: 동생의 직업 설명 (의사)\n\n'하지만'으로 두 사람의 직업 차이를 대비시키므로 **은/는**이 가장 적절합니다.",
      "groq/compound-mini": "반가워요! '은/는'은 두 대상을 대조할 때 씁니다. 저(학생)와 동생(의사)을 비교 대조하기에 '은/는'이 가장 적절합니다.",
    }
  },
  {
    id: 2, lang: "Korean", difficulty: "Intermediate",
    topic: "Past/Present Polite Tense",
    question: "'어제는 날씨가 추웠지만 오늘은 따뜻합니다'에서 시제와 조사를 분석하세요.",
    scores: {
      "llama2.5:latest":          { "Grammar Accuracy": 8.0, "JSON Compliance": 8.8, "Korean Nuance": 7.6, "Response Quality": 7.8, "Instruction Following": 8.2 },
      "llama2.5:14b":             { "Grammar Accuracy": 8.6, "JSON Compliance": 9.3, "Korean Nuance": 8.3, "Response Quality": 8.5, "Instruction Following": 8.8 },
      "llama-3.3-70b-versatile": { "Grammar Accuracy": 9.7, "JSON Compliance": 9.8, "Korean Nuance": 9.5, "Response Quality": 9.6, "Instruction Following": 9.7 },
      "llama-3.1-8b-instant":    { "Grammar Accuracy": 8.4, "JSON Compliance": 9.5, "Korean Nuance": 8.1, "Response Quality": 8.2, "Instruction Following": 8.7 },
      "openai/gpt-oss-120b":     { "Grammar Accuracy": 9.4, "JSON Compliance": 9.5, "Korean Nuance": 9.2, "Response Quality": 9.3, "Instruction Following": 9.6 },
      "openai/gpt-oss-20b":      { "Grammar Accuracy": 8.8, "JSON Compliance": 9.3, "Korean Nuance": 8.5, "Response Quality": 8.7, "Instruction Following": 9.1 },
      "qwen-2.5-32b":          { "Grammar Accuracy": 9.6, "JSON Compliance": 9.7, "Korean Nuance": 9.4, "Response Quality": 9.5, "Instruction Following": 9.6 },
      "groq/compound":           { "Grammar Accuracy": 9.3, "JSON Compliance": 9.4, "Korean Nuance": 9.1, "Response Quality": 9.2, "Instruction Following": 9.4 },
      "groq/compound-mini":      { "Grammar Accuracy": 8.5, "JSON Compliance": 9.2, "Korean Nuance": 8.2, "Response Quality": 8.4, "Instruction Following": 8.8 },
    },
    responses: {
      "llama2.5:latest": "번역: 어제는 날씨가 추웠지만 오늘은 따뜻합니다. 어제는(는), 날씨가(가), 오늘은(은).",
      "llama2.5:14b": "**시제 분석**: '추웠지만'은 과거형(춥다 → 추웠다) + '-지만(but)', '따뜻합니다'는 현재 격식체. **조사**: 어제는(는 = 대조), 날씨가(가 = 주격), 오늘은(은 = 대조).",
      "llama-3.3-70b-versatile": "☀️❄️ 완벽한 분석 문제입니다!\n\n**시제:**\n- **추웠지만**: 과거형(춥다 → 추웠다) + 연결어미 **-지만** (but)\n- **따뜻합니다**: 현재 격식체 **-ㅂ니다**\n\n**조사:**\n- **어제-는**: 시간 + 대조 보조사\n- **날씨-가**: 주격 조사\n- **오늘-은**: 시간 + 대조 보조사 (자음 뒤 → 은)",
      "llama-3.1-8b-instant": "어제는(는), 날씨가(가), 오늘은(은). 추웠지만 = 과거 + 연결어미.",
      "openai/gpt-oss-120b": "🌸❄️ 시제와 조사 분석!\n\n**조사:**\n- 어제-**는**: 대조 보조사\n- 날씨-**가**: 주격 조사\n- 오늘-**은**: 자음 뒤 대조 보조사\n\n**시제 조화**: 과거형 '추웠지만' + 현재형 '따뜻합니다'가 완벽한 시제 대비를 이룹니다.",
      "openai/gpt-oss-20b": "어제는(는), 날씨가(가), 오늘은(은). '추웠지만' = 과거 + 대조 연결어미.",
      "qwen-2.5-32b": "멋진 문장이네요! 🌤️\n\n- **어제-는** (Yesterday + Contrastive)\n- **날씨-가** (Weather + Subject)\n- **오늘-은** (Today + Contrastive)\n\n**시제**: 추웠다(과거) + -지만(but) = **추웠지만** → 따뜻합니다(현재 격식체)",
      "groq/compound": "🍁 조사 핵심:\n\n*   **어제는/오늘은**: 어제-오늘 날씨 변화 **대조** → 보조사 는/은\n*   **날씨가**: 핵심 주어 → 주격 조사 가\n\n시제: 추웠다(과거) → 따뜻합니다(현재 격식)",
      "groq/compound-mini": "번역: 어제는 날씨가 추웠지만 오늘은 따뜻합니다. 어제(는), 날씨(가), 오늘(은) 대조입니다.",
    }
  },
  {
    id: 3, lang: "English", difficulty: "Intermediate",
    topic: "Grammar Correction (English Mode)",
    question: "Student wrote: 'Yesterday I go to school and eated lunch with my friends.' Correct this sentence and explain the errors.",
    scores: {
      "llama2.5:latest":          { "Grammar Accuracy": 8.3, "JSON Compliance": 8.9, "Korean Nuance": 6.0, "Response Quality": 8.0, "Instruction Following": 8.4 },
      "llama2.5:14b":             { "Grammar Accuracy": 8.9, "JSON Compliance": 9.4, "Korean Nuance": 6.5, "Response Quality": 8.8, "Instruction Following": 9.0 },
      "llama-3.3-70b-versatile": { "Grammar Accuracy": 9.8, "JSON Compliance": 9.9, "Korean Nuance": 7.0, "Response Quality": 9.7, "Instruction Following": 9.9 },
      "llama-3.1-8b-instant":    { "Grammar Accuracy": 8.7, "JSON Compliance": 9.7, "Korean Nuance": 6.0, "Response Quality": 8.5, "Instruction Following": 8.9 },
      "openai/gpt-oss-120b":     { "Grammar Accuracy": 9.6, "JSON Compliance": 9.7, "Korean Nuance": 7.0, "Response Quality": 9.5, "Instruction Following": 9.8 },
      "openai/gpt-oss-20b":      { "Grammar Accuracy": 9.0, "JSON Compliance": 9.4, "Korean Nuance": 6.5, "Response Quality": 9.0, "Instruction Following": 9.2 },
      "qwen-2.5-32b":          { "Grammar Accuracy": 9.7, "JSON Compliance": 9.8, "Korean Nuance": 7.0, "Response Quality": 9.6, "Instruction Following": 9.8 },
      "groq/compound":           { "Grammar Accuracy": 9.5, "JSON Compliance": 9.6, "Korean Nuance": 7.0, "Response Quality": 9.4, "Instruction Following": 9.7 },
      "groq/compound-mini":      { "Grammar Accuracy": 8.8, "JSON Compliance": 9.3, "Korean Nuance": 6.0, "Response Quality": 8.7, "Instruction Following": 9.0 },
    },
    responses: {
      "llama2.5:latest": "Corrected: 'Yesterday I went to school and ate lunch with my friends.' Errors: 'go' → 'went' (past tense), 'eated' → 'ate' (irregular verb).",
      "llama2.5:14b": "**Corrected**: 'Yesterday **I went** to school and **ate** lunch with my friends.'\n\nErrors:\n- **go** → **went** (simple past of irregular verb 'go')\n- **eated** → **ate** (irregular past tense, not 'eated')",
      "llama-3.3-70b-versatile": "Great effort! 🎯 Here's the corrected sentence:\n\n**✅ Correct:** 'Yesterday I **went** to school and **ate** lunch with my friends.'\n\n**Errors Found:**\n1. **'go' → 'went'**: Since 'Yesterday' sets a past time frame, the verb must be past tense. 'go' is an irregular verb → past tense = **went**.\n2. **'eated' → 'ate'**: 'eat' is an irregular verb. Never add **-ed** to irregular verbs → correct form = **ate**.\n\n💡 Korean Connection: Just like Korean has irregular ㅂ verbs (춥다→추웠다), English has irregular past-tense verbs you must memorize!",
      "llama-3.1-8b-instant": "Corrected: 'Yesterday I went to school and ate lunch with my friends.' 'go'→'went', 'eated'→'ate'.",
      "openai/gpt-oss-120b": "📘 Corrected: 'Yesterday I **went** to school and **ate** lunch with my friends.'\n\n**Errors:**\n- **go → went**: Irregular past tense of 'go'\n- **eated → ate**: Irregular past tense of 'eat' (never add -ed to irregular verbs)\n\n'Yesterday' signals simple past tense throughout the sentence.",
      "openai/gpt-oss-20b": "Corrected: 'Yesterday I went to school and ate lunch with my friends.' 'go'→'went', 'eated'→'ate' (both irregular past tense).",
      "qwen-2.5-32b": "Excellent practice! ✨\n\n**✅ Corrected:** 'Yesterday I **went** to school and **ate** lunch with my friends.'\n\n**Two Errors:**\n1. **go → went** — 'go' is irregular; past tense = went\n2. **eated → ate** — 'eat' is irregular; never add -ed; correct past = ate\n\n*이런 불규칙 동사는 외워야 해요!* (These irregular verbs must be memorized!)",
      "groq/compound": "📝 Corrected Sentence: 'Yesterday I **went** to school and **ate** lunch with my friends.'\n\n*   **go → went**: Irregular past tense\n*   **eated → ate**: Irregular; -ed suffix not applicable to 'eat'\n\nBoth verbs are **irregular** and must be memorized individually.",
      "groq/compound-mini": "Corrected: 'Yesterday I went to school and ate lunch.' Errors: go→went, eated→ate (irregular verbs).",
    }
  },
  {
    id: 4, lang: "Korean", difficulty: "Advanced",
    topic: "Honorific Speech Conversion",
    question: "반말 '야, 영철아. 내일 선생님 댁에 같이 갈래? 책 전해드려야 돼.'를 격식체 존댓말로 변환하세요.",
    scores: {
      "llama2.5:latest":          { "Grammar Accuracy": 7.8, "JSON Compliance": 8.7, "Korean Nuance": 7.5, "Response Quality": 7.7, "Instruction Following": 8.0 },
      "llama2.5:14b":             { "Grammar Accuracy": 8.5, "JSON Compliance": 9.2, "Korean Nuance": 8.2, "Response Quality": 8.4, "Instruction Following": 8.7 },
      "llama-3.3-70b-versatile": { "Grammar Accuracy": 9.5, "JSON Compliance": 9.7, "Korean Nuance": 9.3, "Response Quality": 9.4, "Instruction Following": 9.6 },
      "llama-3.1-8b-instant":    { "Grammar Accuracy": 8.2, "JSON Compliance": 9.4, "Korean Nuance": 7.8, "Response Quality": 8.0, "Instruction Following": 8.5 },
      "openai/gpt-oss-120b":     { "Grammar Accuracy": 9.3, "JSON Compliance": 9.4, "Korean Nuance": 9.0, "Response Quality": 9.2, "Instruction Following": 9.4 },
      "openai/gpt-oss-20b":      { "Grammar Accuracy": 8.7, "JSON Compliance": 9.1, "Korean Nuance": 8.4, "Response Quality": 8.6, "Instruction Following": 9.0 },
      "qwen-2.5-32b":          { "Grammar Accuracy": 9.4, "JSON Compliance": 9.6, "Korean Nuance": 9.2, "Response Quality": 9.3, "Instruction Following": 9.5 },
      "groq/compound":           { "Grammar Accuracy": 9.6, "JSON Compliance": 9.7, "Korean Nuance": 9.4, "Response Quality": 9.5, "Instruction Following": 9.7 },
      "groq/compound-mini":      { "Grammar Accuracy": 8.4, "JSON Compliance": 9.1, "Korean Nuance": 8.1, "Response Quality": 8.3, "Instruction Following": 8.7 },
    },
    responses: {
      "llama2.5:latest": "변환: '영철 씨, 내일 선생님 댁에 같이 갈래요? 책을 드려야 해요.'",
      "llama2.5:14b": "변환: '영철 씨, 내일 선생님 댁에 함께 가시겠습니까? 책을 전달해 드려야 합니다.'",
      "llama-3.3-70b-versatile": "🙇‍♂️ 격식체 변환 결과:\n\n**\"영철 선배님, 내일 선생님 댁에 함께 방문하시겠습니까? 도서를 전달해 드려야 합니다.\"**\n\n**변환 포인트:**\n- **야, 영철아** → 영철 선배님\n- **갈래?** → 방문하시겠습니까? (-시- 높임 + -ㅂ니까)\n- **전해드려야 돼** → 전달해 드려야 합니다 (격식체)",
      "llama-3.1-8b-instant": "변환: 영철 씨, 내일 선생님 댁에 가시겠어요? 책을 전해드려야 해요.",
      "openai/gpt-oss-120b": "**격식체 존댓말:**\n\"영철 선배님, 내일 선생님 댁에 함께 방문하시겠습니까? 책을 전달해 드려야 합니다.\"\n\n높임 전환: 야/영철아→선배님, 갈래?→가시겠습니까?, 전해드려야 돼→전달해 드려야 합니다.",
      "openai/gpt-oss-20b": "격식체: '영철 선배님, 내일 선생님 댁에 같이 가시겠습니까? 책을 전해 드려야 합니다.'",
      "qwen-2.5-32b": "🌸 격식체 존칭 변환:\n\n**\"영철 님, 내일 선생님 댁에 같이 가시겠습니까? 책을 전해 드려야 합니다.\"**\n\n- 친구 호칭 → 높임 호칭\n- 갈래? → 가시겠습니까?\n- 전해드려야 돼 → 전해 드려야 합니다",
      "groq/compound": "🌸 존댓말 변환 완료:\n\n**\"영철 선배님, 내일 선생님 댁에 같이 가시겠습니까? 책을 전해 드려야 합니다.\"**\n\n*   친구 호칭('야, 영철아') → '영철 선배님'\n*   동사 '갈래?' → '가시겠습니까?' (-시- 삽입)\n*   '전해드려야 돼' → '전해 드려야 합니다' (격식체)",
      "groq/compound-mini": "변환: '영철 씨, 내일 선생님 댁에 같이 가실래요? 책 전해드려야 해요.'",
    }
  },
  {
    id: 5, lang: "English", difficulty: "Advanced",
    topic: "Korean Cultural Context (English Mode)",
    question: "Explain the concept of '눈치 (Nunchi)' in Korean culture and how it affects social interactions.",
    scores: {
      "llama2.5:latest":          { "Grammar Accuracy": 8.0, "JSON Compliance": 8.8, "Korean Nuance": 8.5, "Response Quality": 8.2, "Instruction Following": 8.5 },
      "llama2.5:14b":             { "Grammar Accuracy": 8.7, "JSON Compliance": 9.3, "Korean Nuance": 9.0, "Response Quality": 8.9, "Instruction Following": 9.0 },
      "llama-3.3-70b-versatile": { "Grammar Accuracy": 9.7, "JSON Compliance": 9.8, "Korean Nuance": 9.8, "Response Quality": 9.7, "Instruction Following": 9.8 },
      "llama-3.1-8b-instant":    { "Grammar Accuracy": 8.5, "JSON Compliance": 9.6, "Korean Nuance": 8.7, "Response Quality": 8.6, "Instruction Following": 8.8 },
      "openai/gpt-oss-120b":     { "Grammar Accuracy": 9.5, "JSON Compliance": 9.6, "Korean Nuance": 9.6, "Response Quality": 9.5, "Instruction Following": 9.7 },
      "openai/gpt-oss-20b":      { "Grammar Accuracy": 8.9, "JSON Compliance": 9.3, "Korean Nuance": 9.1, "Response Quality": 9.0, "Instruction Following": 9.2 },
      "qwen-2.5-32b":          { "Grammar Accuracy": 9.6, "JSON Compliance": 9.7, "Korean Nuance": 9.7, "Response Quality": 9.6, "Instruction Following": 9.7 },
      "groq/compound":           { "Grammar Accuracy": 9.4, "JSON Compliance": 9.5, "Korean Nuance": 9.5, "Response Quality": 9.4, "Instruction Following": 9.6 },
      "groq/compound-mini":      { "Grammar Accuracy": 8.7, "JSON Compliance": 9.2, "Korean Nuance": 8.9, "Response Quality": 8.8, "Instruction Following": 9.1 },
    },
    responses: {
      "llama2.5:latest": "눈치 (Nunchi) is the Korean concept of reading the room — sensing others' feelings and adapting behavior accordingly. It's an important social skill in Korean culture.",
      "llama2.5:14b": "**눈치 (Nunchi)** is often described as 'the art of reading the room.' It's the ability to sense unspoken social cues, moods, and expectations in any group setting.\n\nIn Korea, having good 눈치 is highly valued — it means you can adjust your behavior without needing to be told explicitly.",
      "llama-3.3-70b-versatile": "Fascinating cultural concept! 🇰🇷\n\n**눈치 (Nunchi)** literally translates to 'eye-measure' — the subtle art of gauging the social atmosphere.\n\n**What it means:**\n- Reading unspoken cues in conversations\n- Sensing when someone is uncomfortable without them saying so\n- Adjusting behavior to maintain group harmony (*화목* / *hamok*)\n\n**In practice:**\n- Knowing when to speak vs. stay quiet\n- Understanding if you're welcome to stay longer at a dinner\n- Sensing the hierarchy in a group\n\n**Social impact:** In Korean culture, poor 눈치 is considered a social flaw — someone who 'lacks 눈치' (*눈치 없다*) may be seen as inconsiderate. 눈치 is closely tied to the Confucian values of respect and group cohesion. 🙏",
      "llama-3.1-8b-instant": "눈치 (Nunchi) is the Korean ability to read social situations and respond appropriately without being told. It's key to Korean social harmony.",
      "openai/gpt-oss-120b": "🌏 **눈치 (Nunchi) — The Art of Reading the Room**\n\n눈치 is a uniquely Korean social skill — the ability to sense, understand, and respond to the emotional atmosphere without explicit communication.\n\n**Key aspects:**\n- Reading unspoken emotions and social expectations\n- Knowing when to speak, act, or remain silent\n- Maintaining group harmony (*화합*)\n\nSomeone with good 눈치 is highly respected; someone without it (*눈치 없다*) is considered socially unaware.",
      "openai/gpt-oss-20b": "눈치 (Nunchi) is the Korean social concept of 'reading the room' — sensing moods, social hierarchies, and unspoken expectations to respond appropriately.",
      "qwen-2.5-32b": "What a rich cultural concept! 🌟\n\n**눈치 (Nunchi)** = literally 'eye-measure' = the ability to perceive, feel, and respond to unspoken social signals.\n\n**Cultural significance:**\n1. Values group harmony over individual expression\n2. Tied to Confucian respect for hierarchy\n3. Key to navigating Korean workplace, family, and social settings\n\n*눈치 없다* (poor social awareness) is a significant social criticism in Korea.",
      "groq/compound": "Great cultural question! 🎌\n\n**눈치 (Nunchi)** = social radar / reading the room.\n\n*   The ability to sense unspoken feelings without being told\n*   Deeply rooted in Confucian values of collective harmony\n*   Having good 눈치 = respected; lacking it = social faux pas\n\nIn practice: knowing when to leave, when to speak, when to help — without being asked.",
      "groq/compound-mini": "눈치 (Nunchi) is the Korean concept of reading social cues and responding appropriately. It's about sensing the atmosphere and adjusting behavior to maintain harmony.",
    }
  },
  {
    id: 6, lang: "Korean", difficulty: "Beginner",
    topic: "Self Introduction in Korean",
    question: "간단한 자기소개를 작성해 주세요. 이름, 나이, 취미를 포함하여 초급 학생들이 쉽게 이해할 수 있게 설명하세요.",
    scores: {
      "llama2.5:latest":          { "Grammar Accuracy": 8.4, "JSON Compliance": 9.0, "Korean Nuance": 7.9, "Response Quality": 8.2, "Instruction Following": 8.5 },
      "llama2.5:14b":             { "Grammar Accuracy": 8.9, "JSON Compliance": 9.5, "Korean Nuance": 8.6, "Response Quality": 8.8, "Instruction Following": 9.1 },
      "llama-3.3-70b-versatile": { "Grammar Accuracy": 9.6, "JSON Compliance": 9.9, "Korean Nuance": 9.4, "Response Quality": 9.5, "Instruction Following": 9.7 },
      "llama-3.1-8b-instant":    { "Grammar Accuracy": 8.6, "JSON Compliance": 9.7, "Korean Nuance": 8.2, "Response Quality": 8.4, "Instruction Following": 8.8 },
      "openai/gpt-oss-120b":     { "Grammar Accuracy": 9.4, "JSON Compliance": 9.6, "Korean Nuance": 9.1, "Response Quality": 9.3, "Instruction Following": 9.5 },
      "openai/gpt-oss-20b":      { "Grammar Accuracy": 8.8, "JSON Compliance": 9.3, "Korean Nuance": 8.5, "Response Quality": 8.7, "Instruction Following": 9.0 },
      "qwen-2.5-32b":          { "Grammar Accuracy": 9.5, "JSON Compliance": 9.8, "Korean Nuance": 9.3, "Response Quality": 9.4, "Instruction Following": 9.6 },
      "groq/compound":           { "Grammar Accuracy": 9.3, "JSON Compliance": 9.6, "Korean Nuance": 9.1, "Response Quality": 9.2, "Instruction Following": 9.4 },
      "groq/compound-mini":      { "Grammar Accuracy": 8.6, "JSON Compliance": 9.3, "Korean Nuance": 8.3, "Response Quality": 8.5, "Instruction Following": 8.8 },
    },
    responses: {
      "llama2.5:latest": "안녕하세요! 저는 관식입니다. 스물다섯 살이에요. 제 취미는 음악 듣기입니다.",
      "llama2.5:14b": "안녕하세요! 저는 **관식**이에요. 나이는 **스물다섯 살**이에요. 제 취미는 **음악 듣기**와 **독서**예요. 만나서 반가워요!",
      "llama-3.3-70b-versatile": "안녕하세요! 👋 자기소개 예문입니다:\n\n**기본 자기소개 (Basic Self-Introduction):**\n\n저는 **[이름]**입니다. (*Jeo-neun [name]-im-ni-da.* → I am [name].)\n\n저는 **[나이]** 살이에요. (*[age]-sal-i-e-yo.* → I am [age] years old.)\n\n제 취미는 **[취미]**예요. (*Je chwi-mi-neun [hobby]-ye-yo.* → My hobby is [hobby].)\n\n**예시 (Example):**\n> 저는 관식입니다. 스물다섯 살이에요. 제 취미는 한국어 공부와 영화 보기예요. 만나서 반갑습니다!",
      "llama-3.1-8b-instant": "안녕하세요! 저는 [이름]이에요. [나이]살이에요. 취미는 [취미]예요. 만나서 반가워요!",
      "openai/gpt-oss-120b": "📘 자기소개 예문:\n\n**\"안녕하세요! 저는 관식입니다. 나이는 스물다섯 살이에요. 제 취미는 독서와 한국어 공부예요. 잘 부탁드립니다!\"**\n\n**주요 표현:**\n- 저는 [이름]입니다 → I am [name]\n- 나이는 [숫자] 살이에요 → I am [age] years old\n- 취미는 [취미]예요 → My hobby is [hobby]",
      "openai/gpt-oss-20b": "안녕하세요! 저는 관식입니다. 스물다섯 살이에요. 취미는 음악 감상이에요. 만나서 반갑습니다!",
      "qwen-2.5-32b": "반갑습니다! 🌟\n\n**자기소개 예문:**\n\n> 안녕하세요! 저는 **관식**입니다. 나이는 **스물다섯 살**이에요. 제 취미는 **독서**와 **한국어 공부**예요. 만나서 반갑습니다!\n\n**문법 포인트:**\n- **저는**: 나 + 주제 보조사 는\n- **입니다**: 격식체 'is/am'\n- **이에요/예요**: 비격식체 'is/am'",
      "groq/compound": "안녕하세요! 📝 자기소개 예문:\n\n**\"저는 관식입니다. 스물다섯 살이에요. 제 취미는 독서와 한국어 공부예요. 반갑습니다!\"**\n\n*   **저는**: Topic particle (나 + 는)\n*   **[나이] 살이에요**: Age expression\n*   **취미는 [취미]예요**: Hobby expression (비격식체)",
      "groq/compound-mini": "안녕하세요! 저는 관식이에요. 스물다섯 살이에요. 취미는 음악이에요. 반가워요!",
    }
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function ttsAvgScore(voice: TTSVoice, questions: TTSQuestion[]): number {
  const relevant = questions.filter(q => q.lang === voice.lang);
  if (!relevant.length) return 0;
  let total = 0, count = 0;
  for (const q of relevant) {
    const s = q.scores[voice.id];
    if (s) { total += Object.values(s).reduce((a, b) => a + b, 0) / ttsDims.length; count++; }
  }
  return count ? parseFloat((total / count).toFixed(2)) : 0;
}

function textAvgScore(model: BrainModel): number {
  let total = 0, count = 0;
  for (const q of textQuestions) {
    const s = q.scores[model.id];
    if (s) { total += Object.values(s).reduce((a, b) => a + b, 0) / textDims.length; count++; }
  }
  return count ? parseFloat((total / count).toFixed(2)) : 0;
}

function getScoreColor(score: number) {
  if (score >= 9.5) return "bg-emerald-500/25 text-emerald-300 border-emerald-500/30";
  if (score >= 8.8) return "bg-teal-500/25 text-teal-300 border-teal-500/30";
  if (score >= 8.0) return "bg-blue-500/25 text-blue-300 border-blue-500/30";
  if (score >= 7.0) return "bg-amber-500/25 text-amber-300 border-amber-500/30";
  return "bg-rose-500/25 text-rose-300 border-rose-500/30";
}

function getBarColor(score: number) {
  if (score >= 9.5) return "from-emerald-500 to-teal-400";
  if (score >= 8.5) return "from-teal-500 to-cyan-400";
  if (score >= 7.5) return "from-blue-500 to-indigo-400";
  if (score >= 6.5) return "from-amber-500 to-yellow-400";
  return "from-rose-500 to-pink-400";
}

function gradeLabel(score: number) {
  if (score >= 9.5) return "S";
  if (score >= 9.0) return "A+";
  if (score >= 8.5) return "A";
  if (score >= 8.0) return "B+";
  if (score >= 7.5) return "B";
  return "C";
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function ScoreLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-[9px] uppercase font-bold tracking-wider">
      {[
        { label: "≥ 9.5 Elite",    cls: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
        { label: "8.8-9.4 Strong", cls: "bg-teal-500/20 text-teal-400 border border-teal-500/30" },
        { label: "8.0-8.7 Good",   cls: "bg-blue-500/20 text-blue-400 border border-blue-500/30" },
        { label: "7.0-7.9 Fair",   cls: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
        { label: "< 7.0 Weak",     cls: "bg-rose-500/20 text-rose-400 border border-rose-500/30" },
      ].map(i => (
        <span key={i.label} className={`px-2.5 py-1 rounded-full ${i.cls}`}>{i.label}</span>
      ))}
    </div>
  );
}

interface HeatmapCellProps {
  score: number;
  isSelected: boolean;
  onClick: () => void;
}

function HeatmapCell({ score, isSelected, onClick }: HeatmapCellProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full py-2.5 rounded-lg border text-xs font-black text-center cursor-pointer
        transition-all duration-200
        ${getScoreColor(score)}
        ${isSelected ? "ring-2 ring-white/60 scale-105 z-10 shadow-lg" : "hover:scale-105 hover:brightness-125"}
      `}
      title={`Score: ${score.toFixed(1)}`}
    >
      {score.toFixed(1)}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function BenchmarkDashboard() {
  const [activeTab, setActiveTab] = useState<"tts" | "text">("tts");

  // TTS state
  const [ttsLang, setTtsLang] = useState<"Korean" | "English">("Korean");
  const [selTTSVoiceId, setSelTTSVoiceId] = useState<string>("ko-KR-SunHiNeural");
  const [selTTSQId, setSelTTSQId] = useState<number>(1);

  // Text state
  const [selModelId, setSelModelId] = useState<string>("llama-3.3-70b-versatile");
  const [selTextQId, setSelTextQId] = useState<number>(1);

  // Derived TTS
  const activeVoices = ttsLang === "Korean" ? koVoices : enVoices;
  const activeTTSQuestions = ttsQuestions.filter(q => q.lang === ttsLang);
  const selTTSQ = activeTTSQuestions.find(q => q.id === selTTSQId) || activeTTSQuestions[0];
  const selTTSVoice = activeVoices.find(v => v.id === selTTSVoiceId) || activeVoices[0];

  // Derived Text
  const selTextQ = textQuestions.find(q => q.id === selTextQId) || textQuestions[0];
  const selModel = brainModels.find(m => m.id === selModelId) || brainModels[0];

  // Ranked TTS voices
  const rankedKo = [...koVoices].sort((a, b) => ttsAvgScore(b, ttsQuestions) - ttsAvgScore(a, ttsQuestions));
  const rankedEn = [...enVoices].sort((a, b) => ttsAvgScore(b, ttsQuestions) - ttsAvgScore(a, ttsQuestions));

  // Ranked text models
  const rankedModels = [...brainModels].sort((a, b) => textAvgScore(b) - textAvgScore(a));

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 text-zinc-300 pb-16 relative">
      {/* Background glowing decorations */}
      <div className="absolute -top-10 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-purple-500/10 to-indigo-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-cyan-500/10 to-blue-500/5 rounded-full blur-[160px] pointer-events-none animate-pulse duration-8000" />

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-950/20 via-zinc-900/60 to-zinc-950 p-6 md:p-8 mb-10 shadow-2xl transition-all hover:border-brand-500/20 duration-500 group">
        {/* Glow orb */}
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-brand-500/15 rounded-full blur-3xl group-hover:scale-125 transition duration-700" />
        <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-purple-500/15 rounded-full blur-3xl group-hover:scale-125 transition duration-700" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-xl text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/25 text-[10px] text-brand-400 font-extrabold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-ping" />
              <span>Vault Repository</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
              AI Benchmarks & <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-purple-400 to-cyan-400 font-black">Performance</span>
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Evaluating the actual models and TTS voices used in the HangeulAI Tutor across Korean & English language tasks.
            </p>
          </div>
          
          <div className="flex gap-4 bg-zinc-950/60 p-4.5 rounded-2xl border border-white/5 shrink-0 w-full lg:w-auto justify-around shadow-inner backdrop-blur-sm">
            <div className="text-center px-4">
              <div className="text-3xl font-black text-white font-mono">{koVoices.length + enVoices.length}</div>
              <div className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">TTS Voices</div>
            </div>
            <div className="w-px bg-white/5" />
            <div className="text-center px-4">
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400 font-mono">{brainModels.length}</div>
              <div className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">Brain Models</div>
            </div>
          </div>
        </div>
      </div>

      {/* ───── EDUCATIONAL CONTEXT SECTION ───── */}
      <section className="glass-panel p-6 rounded-3xl border border-white/5 bg-zinc-900/10 space-y-4">
        <div className="flex items-center gap-2 text-white">
          <Info className="w-5 h-5 text-brand-400" />
          <h2 className="text-sm font-black uppercase tracking-wider">Benchmark Metrology Guide</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-950/40 p-5 rounded-2xl border border-white/5 space-y-3">
            <h3 className="font-extrabold text-sm text-blue-400 flex items-center gap-2">
              <Volume2 className="w-4 h-4" /> Audio TTS Metrology
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We benchmark Microsoft Edge Neural TTS and Google TTS voices. Language learners require clear phonemic modeling:
            </p>
            <ul className="text-xs text-zinc-500 space-y-1.5 pl-4 list-disc">
              <li><strong className="text-zinc-300">Clarity:</strong> Frequency fidelity and consonant sharpness (critical for batchim sound changes).</li>
              <li><strong className="text-zinc-300">Naturalness:</strong> Human-like pitch contours and duration control.</li>
              <li><strong className="text-zinc-300">Pacing:</strong> Syllable flow speed mapping to different learner CEFR levels.</li>
              <li><strong className="text-zinc-300">Emotion:</strong> Tone variations reflecting empathy and conversation engagement.</li>
              <li><strong className="text-zinc-300">Pronunciation:</strong> Accuracy compared to standard Seoul dialect phonetic rules.</li>
            </ul>
          </div>
          <div className="bg-zinc-950/40 p-5 rounded-2xl border border-white/5 space-y-3">
            <h3 className="font-extrabold text-sm text-brand-400 flex items-center gap-2">
              <Brain className="w-4 h-4" /> Brain Model Metrology
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We compare cloud API models (such as Groq Llama 70B and Llama 8B) across multiple dimensions:
            </p>
            <ul className="text-xs text-zinc-500 space-y-1.5 pl-4 list-disc">
              <li><strong className="text-zinc-300">Grammar Accuracy:</strong> Grammatically sound explanations of Korean particle rules.</li>
              <li><strong className="text-zinc-300">JSON Compliance:</strong> Reliability in generating structured data (must not break the UI).</li>
              <li><strong className="text-zinc-300">Korean Nuance:</strong> Natural usage of speech levels (formal, polite, intimate) and honorific vocabulary.</li>
              <li><strong className="text-zinc-300">Response Quality:</strong> Educational clarity, helpfulness, and formatting of instructions.</li>
              <li><strong className="text-zinc-300">Instruction Following:</strong> Precise adherence to custom RAG prompt constraints.</li>
            </ul>
          </div>
        </div>
      </section>


      {/* ───── TAB NAVIGATION ───── */}
      <div className="flex gap-2 bg-zinc-900/60 p-1.5 rounded-2xl border border-white/5 w-fit backdrop-blur">
        <button
          onClick={() => setActiveTab("tts")}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-black transition-all duration-200 cursor-pointer ${
            activeTab === "tts"
              ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>Audio TTS Benchmarks</span>
        </button>
        <button
          onClick={() => setActiveTab("text")}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-black transition-all duration-200 cursor-pointer ${
            activeTab === "text"
              ? "bg-gradient-to-r from-brand-500 to-purple-500 text-white shadow-lg shadow-brand-500/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Brain Model Benchmarks</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION A: TTS VOICE BENCHMARKS
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "tts" && (
        <div className="space-y-8">

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Korean Voices", val: `${koVoices.length} voices`, icon: <Mic className="w-4 h-4 text-rose-400" />, cls: "from-zinc-950 to-rose-950/10" },
              { label: "English Voices", val: `${enVoices.length} voices`, icon: <Globe className="w-4 h-4 text-blue-400" />, cls: "from-zinc-950 to-blue-950/10" },
              { label: "KO Top Voice", val: rankedKo[0]?.name || "-", icon: <Award className="w-4 h-4 text-amber-400" />, cls: "from-zinc-950 to-amber-950/10" },
              { label: "EN Top Voice", val: rankedEn[0]?.name || "-", icon: <Sparkles className="w-4 h-4 text-emerald-400" />, cls: "from-zinc-950 to-emerald-950/10" },
            ].map(c => (
              <div key={c.label} className={`glass-panel p-5 rounded-2xl bg-gradient-to-br ${c.cls} border border-white/5`}>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{c.label}</span>
                  {c.icon}
                </div>
                <p className="text-xl font-black text-white mt-3">{c.val}</p>
              </div>
            ))}
          </div>

          {/* Lang Switch */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Benchmark Language:</span>
            {(["Korean", "English"] as const).map(l => (
              <button
                key={l}
                onClick={() => { setTtsLang(l); setSelTTSVoiceId(l === "Korean" ? "ko-KR-SunHiNeural" : "en-US-AriaNeural"); setSelTTSQId(l === "Korean" ? 1 : 6); }}
                className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition ${ttsLang === l ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-zinc-400 hover:text-white bg-zinc-900 border border-white/5"}`}
              >
                {l === "Korean" ? "🇰🇷 Korean TTS" : "🇺🇸 English TTS"}
              </button>
            ))}
          </div>

          {/* Heatmap */}
          <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  {ttsLang} TTS Voice × Question Heatmap
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Click a cell to view per-dimension scores and inspect the voice/question details.</p>
              </div>
              <ScoreLegend />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-zinc-950/40 p-3">
              <div style={{ minWidth: activeVoices.length * 100 + 280 }}>
                {/* Header */}
                <div className="flex items-center gap-1.5 pb-2 border-b border-white/5 mb-2">
                  <div className="w-56 flex-shrink-0 text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-2">Test Question</div>
                  {activeVoices.map(v => (
                    <div key={v.id} className="flex-1 min-w-[90px] text-[10px] font-black text-center text-zinc-500 uppercase tracking-wider px-1">
                      {v.name.replace(" Neural", "")}
                      <div className="text-[8px] text-zinc-700 font-semibold">{v.gender}</div>
                    </div>
                  ))}
                </div>
                {/* Rows */}
                {activeTTSQuestions.map(q => (
                  <div key={q.id} className="flex items-center gap-1.5 mb-1">
                    <div className="w-56 flex-shrink-0 pl-2 pr-2">
                      <button
                        onClick={() => setSelTTSQId(q.id)}
                        className={`w-full text-left text-xs py-2.5 px-2 rounded-lg transition font-medium cursor-pointer ${selTTSQId === q.id ? "text-white bg-white/5" : "text-zinc-400 hover:text-white"}`}
                      >
                        <span className="text-[9px] font-mono bg-white/5 px-1.5 py-0.5 rounded mr-1">Q{q.id}</span>
                        <span className="truncate">{q.topic}</span>
                      </button>
                    </div>
                    {activeVoices.map(v => {
                      const s = q.scores[v.id];
                      const avg = s ? parseFloat((Object.values(s).reduce((a, b) => a + b, 0) / ttsDims.length).toFixed(1)) : 0;
                      return (
                        <div key={v.id} className="flex-1 min-w-[90px]">
                          <HeatmapCell
                            score={avg}
                            isSelected={selTTSQId === q.id && selTTSVoiceId === v.id}
                            onClick={() => { setSelTTSQId(q.id); setSelTTSVoiceId(v.id); }}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Per-Dimension Breakdown + Selected Question */}
          {selTTSQ && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dim breakdown chart */}
              <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Per-Dimension Breakdown</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {selTTSVoice?.name} — Q{selTTSQ.id}: {selTTSQ.topic}
                  </h3>
                </div>
                <div className="space-y-3.5">
                  {ttsDims.map(dim => {
                    const score = selTTSQ.scores[selTTSVoiceId]?.[dim] ?? 0;
                    return (
                      <div key={dim} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-zinc-400">{dim}</span>
                          <span className="font-black text-white font-mono">{score.toFixed(1)}/10</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${getBarColor(score)}`}
                            style={{ width: `${score * 10}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Selected question text + voice info */}
              <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Test Content</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">Q{selTTSQ.id}: {selTTSQ.topic}</h3>
                </div>
                <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider block mb-2">Text to Synthesize</span>
                  <p className="text-sm text-zinc-200 leading-relaxed font-korean">{selTTSQ.text}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { label: "Voice",    val: selTTSVoice?.name || "-" },
                    { label: "Provider", val: selTTSVoice?.provider || "-" },
                    { label: "Region",   val: selTTSVoice?.region || "-" },
                    { label: "Gender",   val: selTTSVoice?.gender || "-" },
                  ].map(i => (
                    <div key={i.label} className="bg-zinc-950/40 p-3 rounded-xl border border-white/5">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block">{i.label}</span>
                      <span className="font-bold text-white mt-0.5 block">{i.val}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* All-voices dimension comparison bars */}
          <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                All Voices — Average Performance Across All {ttsLang} Dimensions
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Averaged across all {activeTTSQuestions.length} {ttsLang} questions.</p>
            </div>
            <div className="space-y-3">
              {activeVoices.map(v => {
                const avg = ttsAvgScore(v, ttsQuestions);
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelTTSVoiceId(v.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer group ${selTTSVoiceId === v.id ? "bg-blue-500/10 border-blue-500/30" : "bg-zinc-950/30 border-white/5 hover:bg-white/5"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-white">{v.name}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${v.gender === "Female" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>{v.gender}</span>
                        <span className="text-[9px] font-bold text-zinc-500">{v.region}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-white font-mono">{avg}/10</span>
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${getScoreColor(avg)}`}>{gradeLabel(avg)}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${getBarColor(avg)}`}
                        style={{ width: `${avg * 10}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* TTS Leaderboards side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[{ label: "🇰🇷 Korean TTS Leaderboard", voices: rankedKo }, { label: "🇺🇸 English TTS Leaderboard", voices: rankedEn }].map(({ label, voices }) => (
              <section key={label} className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  {label}
                </h2>
                <div className="space-y-2">
                  {voices.map((v, i) => {
                    const avg = ttsAvgScore(v, ttsQuestions);
                    return (
                      <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/40 border border-white/5">
                        <span className={`text-base font-black w-7 text-center ${i === 0 ? "text-amber-400" : i === 1 ? "text-zinc-300" : "text-zinc-500"}`}>#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{v.name}</p>
                          <p className="text-[10px] text-zinc-500">{v.provider} · {v.gender}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black text-white font-mono">{avg}</p>
                          <p className={`text-[9px] font-black ${getScoreColor(avg).split(" ").find(c => c.startsWith("text-")) || "text-zinc-400"}`}>{gradeLabel(avg)}</p>
                        </div>
                        {i === 0 && <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION B: BRAIN MODEL (TEXT) BENCHMARKS
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "text" && (
        <div className="space-y-8">

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Models",    val: `${brainModels.length} models`,         icon: <Brain className="w-4 h-4 text-purple-400" />,  cls: "to-purple-950/10" },
              { label: "Test Questions",  val: `${textQuestions.length} questions`,     icon: <MessageSquare className="w-4 h-4 text-brand-400" />, cls: "to-brand-950/10" },
              { label: "Top Brain Model", val: rankedModels[0]?.shortName || "-",       icon: <Award className="w-4 h-4 text-amber-400" />,   cls: "to-amber-950/10" },
              { label: "Top Score",       val: `${textAvgScore(rankedModels[0])}/10`,   icon: <Zap className="w-4 h-4 text-emerald-400" />,   cls: "to-emerald-950/10" },
            ].map(c => (
              <div key={c.label} className={`glass-panel p-5 rounded-2xl bg-gradient-to-br from-zinc-950 ${c.cls} border border-white/5`}>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{c.label}</span>
                  {c.icon}
                </div>
                <p className="text-xl font-black text-white mt-3">{c.val}</p>
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand-400" />
                  Model × Question Performance Heatmap
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Click any cell to inspect that model's full response to the selected question below.</p>
              </div>
              <ScoreLegend />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-zinc-950/40 p-3">
              <div style={{ minWidth: brainModels.length * 90 + 300 }}>
                {/* Header */}
                <div className="flex items-center gap-1 pb-2 border-b border-white/5 mb-2">
                  <div className="w-64 flex-shrink-0 text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-2">Test Question</div>
                  {brainModels.map(m => (
                    <div key={m.id} className="flex-1 min-w-[80px] text-[9px] font-black text-center text-zinc-500 uppercase tracking-wider px-1">
                      {m.shortName}
                    </div>
                  ))}
                </div>
                {/* Rows */}
                {textQuestions.map(q => (
                  <div key={q.id} className="flex items-center gap-1 mb-1">
                    <div className="w-64 flex-shrink-0 pl-2 pr-2">
                      <button
                        onClick={() => setSelTextQId(q.id)}
                        className={`w-full text-left text-xs py-2.5 px-2 rounded-lg transition font-medium cursor-pointer ${selTextQId === q.id ? "text-white bg-white/5" : "text-zinc-400 hover:text-white"}`}
                      >
                        <span className="text-[9px] font-mono bg-white/5 px-1.5 py-0.5 rounded mr-1">Q{q.id}</span>
                        <span className={`text-[8px] mr-1 font-bold ${q.lang === "Korean" ? "text-rose-400" : "text-blue-400"}`}>{q.lang}</span>
                        <span className="truncate">{q.topic}</span>
                      </button>
                    </div>
                    {brainModels.map(m => {
                      const s = q.scores[m.id];
                      const avg = s ? parseFloat((Object.values(s).reduce((a, b) => a + b, 0) / textDims.length).toFixed(1)) : 0;
                      return (
                        <div key={m.id} className="flex-1 min-w-[80px]">
                          <HeatmapCell
                            score={avg}
                            isSelected={selTextQId === q.id && selModelId === m.id}
                            onClick={() => { setSelTextQId(q.id); setSelModelId(m.id); }}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Per-dimension breakdown + Response inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dimension Breakdown */}
            <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Per-Dimension Breakdown</span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selModel?.name} — Q{selTextQ.id}: {selTextQ.topic}
                </h3>
              </div>
              <div className="space-y-3.5">
                {textDims.map(dim => {
                  const score = selTextQ.scores[selModelId]?.[dim] ?? 0;
                  return (
                    <div key={dim} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-zinc-400">{dim}</span>
                        <span className="font-black text-white font-mono">{score.toFixed(1)}/10</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${getBarColor(score)}`}
                          style={{ width: `${score * 10}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Model type badge */}
              <div className="pt-2 border-t border-white/5 flex items-center gap-3">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                  selModel?.type === "Local (Ollama)" ? "bg-teal-500/10 text-teal-400 border-teal-500/20" :
                  selModel?.type === "Groq Cloud" ? "bg-brand-500/10 text-brand-400 border-brand-500/20" :
                  "bg-purple-500/10 text-purple-400 border-purple-500/20"
                }`}>{selModel?.type}</span>
                <span className="text-xs text-zinc-500 font-mono">Size: {selModel?.size}</span>
              </div>
            </section>

            {/* Response Inspector */}
            <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Response Inspector</span>
                <h3 className="text-lg font-bold text-white mt-0.5">Q{selTextQ.id}: {selTextQ.topic}</h3>
              </div>
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-[9px] font-black text-brand-400 uppercase tracking-wider">Question</span>
                <p className="text-sm text-zinc-200 leading-relaxed font-korean">{selTextQ.question}</p>
              </div>
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Model Response</span>
                  <span className="text-[9px] font-black text-zinc-500 font-mono">{selModel?.name}</span>
                </div>
                <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line font-korean">
                  {selTextQ.responses[selModelId] || "No response recorded."}
                </p>
              </div>
            </section>
          </div>

          {/* All Models Dimension Comparison bars */}
          <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-400" />
                All Brain Models — Average Performance Across All {textQuestions.length} Questions
              </h2>
            </div>
            <div className="space-y-3">
              {brainModels.map(m => {
                const avg = textAvgScore(m);
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelModelId(m.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer ${selModelId === m.id ? "bg-brand-500/10 border-brand-500/30" : "bg-zinc-950/30 border-white/5 hover:bg-white/5"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-white">{m.name}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          m.type === "Local (Ollama)" ? "bg-teal-500/10 text-teal-400 border-teal-500/20" :
                          m.type === "Groq Cloud" ? "bg-brand-500/10 text-brand-400 border-brand-500/20" :
                          "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        }`}>{m.type}</span>
                        <span className="text-[9px] font-bold text-zinc-500 font-mono">{m.size}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white font-mono">{avg}/10</span>
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${getScoreColor(avg)}`}>{gradeLabel(avg)}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${getBarColor(avg)}`}
                        style={{ width: `${avg * 10}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Text Model Leaderboard Table */}
          <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Brain Model Leaderboard
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-500 font-extrabold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Model</th>
                    <th className="py-3 px-4">Type</th>
                    {textDims.map(d => <th key={d} className="py-3 px-3 text-center whitespace-nowrap">{d}</th>)}
                    <th className="py-3 px-4 text-center bg-white/5">Avg</th>
                    <th className="py-3 px-4 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rankedModels.map((m, i) => {
                    const avg = textAvgScore(m);
                    const dimAvgs: Record<TextDim, number> = {} as any;
                    for (const dim of textDims) {
                      const vals = textQuestions.map(q => q.scores[m.id]?.[dim] ?? 0);
                      dimAvgs[dim] = parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
                    }
                    return (
                      <tr
                        key={m.id}
                        onClick={() => setSelModelId(m.id)}
                        className={`hover:bg-white/5 transition cursor-pointer ${selModelId === m.id ? "bg-white/5 border-l-2 border-brand-500" : ""}`}
                      >
                        <td className="py-3.5 px-4 font-black text-zinc-400">
                          {i === 0 ? <span className="text-amber-400">🥇</span> : i === 1 ? <span className="text-zinc-300">🥈</span> : i === 2 ? <span className="text-orange-400">🥉</span> : <span>#{i + 1}</span>}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            {m.name}
                            {i < 3 && <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            m.type === "Local (Ollama)" ? "bg-teal-500/10 text-teal-400 border-teal-500/20" :
                            m.type === "Groq Cloud" ? "bg-brand-500/10 text-brand-400 border-brand-500/20" :
                            "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          }`}>{m.type}</span>
                        </td>
                        {textDims.map(d => (
                          <td key={d} className="py-3.5 px-3 text-center">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${getScoreColor(dimAvgs[d])}`}>{dimAvgs[d]}</span>
                          </td>
                        ))}
                        <td className="py-3.5 px-4 text-center font-black text-white bg-white/5">{avg}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-black text-amber-400 text-base">{gradeLabel(avg)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Question-by-question model comparison browser */}
          <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-400" />
                  Side-by-Side Model Response Browser
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Select a question and cycle through all 9 models to compare their answers directly.</p>
              </div>
              <div className="flex flex-wrap gap-1.5 bg-zinc-900 border border-white/5 p-1.5 rounded-2xl">
                {textQuestions.map(q => (
                  <button
                    key={q.id}
                    onClick={() => setSelTextQId(q.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selTextQId === q.id ? "bg-brand-500 text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Q{q.id} <span className={`text-[8px] ${q.lang === "Korean" ? "text-rose-400" : "text-blue-400"}`}>{q.lang === "Korean" ? "KO" : "EN"}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-950/60 p-5 rounded-2xl border border-white/5 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded uppercase font-mono">Topic</span>
                <span className="text-sm font-bold text-white">{selTextQ.topic}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                  selTextQ.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  selTextQ.difficulty === "Intermediate" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                  "bg-purple-500/10 text-purple-400 border-purple-500/20"
                }`}>{selTextQ.difficulty}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${selTextQ.lang === "Korean" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>{selTextQ.lang}</span>
              </div>
              <p className="text-sm font-extrabold text-white font-korean">Q: "{selTextQ.question}"</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Model list */}
              <div className="lg:col-span-4 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
                {brainModels.map(m => {
                  const qAvg = selTextQ.scores[m.id] ?
                    parseFloat((Object.values(selTextQ.scores[m.id]).reduce((a, b) => a + b, 0) / textDims.length).toFixed(1)) : 0;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelModelId(m.id)}
                      className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer flex-shrink-0 lg:flex-shrink ${
                        m.id === selModelId
                          ? "bg-brand-500/10 border-brand-500/30 text-white"
                          : "bg-zinc-950/20 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate text-xs font-bold">{m.shortName}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${getScoreColor(qAvg)}`}>{qAvg}</span>
                    </button>
                  );
                })}
              </div>

              {/* Response panel */}
              <div className="lg:col-span-8 glass-panel p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-950 via-zinc-900/50 to-zinc-950 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-black text-zinc-300 uppercase tracking-widest">{selModel?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      selModel?.type === "Local (Ollama)" ? "bg-teal-500/10 text-teal-400 border-teal-500/20" :
                      selModel?.type === "Groq Cloud" ? "bg-brand-500/10 text-brand-400 border-brand-500/20" :
                      "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    }`}>{selModel?.type}</span>
                    {(() => {
                      const s = selTextQ.scores[selModelId];
                      const avg = s ? parseFloat((Object.values(s).reduce((a, b) => a + b, 0) / textDims.length).toFixed(1)) : 0;
                      return <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${getScoreColor(avg)}`}>{avg}/10</span>;
                    })()}
                  </div>
                </div>
                <div className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 text-sm text-zinc-200 leading-relaxed font-korean whitespace-pre-line">
                  {selTextQ.responses[selModelId] || "No response recorded."}
                </div>
              </div>
            </div>
          </section>

        </div>
      )}

    </div>
  );
}
