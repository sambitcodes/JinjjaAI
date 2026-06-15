"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Sparkles,
  BookOpen,
  Award,
  Loader2,
  CheckCircle2,
  Mic,
  MessageCircle,
  Layers,
  ArrowRight,
  RefreshCw,
  CheckSquare,
  Bookmark,
  BarChart2
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function apiJson(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const cleanPath = (path.startsWith("/phases/") || path.startsWith("/quiz/") || path.startsWith("/practice/")) ? `/lessons${path}` : path;
  const res = await fetch(`${API_BASE}${cleanPath}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((opts.headers as Record<string, string>) || {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

interface Course6Phase4RegisterWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

const REGISTER_COLORS: Record<string, string> = {
  informal: "accent-pink",
  neutral: "brand-500",
  formal: "accent-teal"
};

const REGISTER_LABELS: Record<string, string> = {
  informal: "Informal / Casual (반말)",
  neutral: "Neutral / Polite (존댓말)",
  formal: "Formal / Academic (격식체)"
};

export default function Course6Phase4RegisterWizard({
  activeLesson,
  speakWord,
  onComplete
}: Course6Phase4RegisterWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 6;

  // Data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);
  const [recognitionData, setRecognitionData] = useState<any>(null);
  const [rewriteData, setRewriteData] = useState<any>(null);

  // Activity 1 states
  const [activity1SubStep, setActivity1SubStep] = useState<"1A" | "1B">("1A");

  // Activity 1A – Register recognition
  const [activeRecIdx, setActiveRecIdx] = useState(0);
  const [selectedRegister, setSelectedRegister] = useState<string | null>(null);
  const [recChecked, setRecChecked] = useState(false);
  const [recCorrect, setRecCorrect] = useState<boolean | null>(null);

  // Activity 1B – Context matching
  const [activeCmIdx, setActiveCmIdx] = useState(0);
  const [selectedCmOption, setSelectedCmOption] = useState<string | null>(null);
  const [cmChecked, setCmChecked] = useState(false);
  const [cmCorrect, setCmCorrect] = useState<boolean | null>(null);
  const [cmExplanation, setCmExplanation] = useState<string | null>(null);

  // Activity 2 states
  const [activity2SubStep, setActivity2SubStep] = useState<"2A" | "2B">("2A");

  // Activity 2A – Register rewrite
  const [activeRwIdx, setActiveRwIdx] = useState(0);
  const [rewriteText, setRewriteText] = useState("");
  const [rwFeedback, setRwFeedback] = useState<any>(null);
  const [submittingRw, setSubmittingRw] = useState(false);

  // Activity 2B – AI style-switch chat
  const [chatStarted, setChatStarted] = useState(false);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [aiText, setAiText] = useState("");
  const [aiSending, setAiSending] = useState(false);
  const [aiFinished, setAiFinished] = useState(false);
  const [aiFinishMsg, setAiFinishMsg] = useState<string | null>(null);
  const [finishingChat, setFinishingChat] = useState(false);

  // Register contrast active tab
  const [contrastIdx, setContrastIdx] = useState(0);
  const [contrastTab, setContrastTab] = useState<"informal" | "neutral" | "formal">("informal");

  // Quiz states
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);
  const [quizBadge, setQuizBadge] = useState<string | null>(null);

  // Homework states
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Homework AI practice
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [practiceMessages, setPracticeMessages] = useState<any[]>([]);
  const [practiceText, setPracticeText] = useState("");
  const [practiceSending, setPracticeSending] = useState(false);
  const [practiceFinished, setPracticeFinished] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean5/4/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean5/4/core-data");
          setCoreData(res);
        } else if (step === 3 && !recognitionData) {
          const res = await apiJson("/practice/register-style/recognition");
          setRecognitionData(res);
        } else if (step === 4 && !rewriteData) {
          const res = await apiJson("/practice/register-style/rewrite");
          setRewriteData(res);
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean5/phase-4/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean5/4/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading C1 register data:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => speakWord(text);

  // Activity 1A – Check register recognition
  const handleCheckRec = async () => {
    if (!recognitionData) return;
    const item = recognitionData.recognition_items[activeRecIdx];
    const isCorrect = selectedRegister === item.register;
    setRecChecked(true);
    setRecCorrect(isCorrect);
    try {
      await apiJson("/practice/register-style/recognition/answer", {
        method: "POST",
        body: JSON.stringify({ question_id: item.id, answer: selectedRegister, time_taken_ms: 2000 })
      });
    } catch (e) { console.error(e); }
  };

  // Activity 1B – Context match
  const handleCheckCm = async () => {
    if (!recognitionData) return;
    const item = recognitionData.context_matching[activeCmIdx];
    setCmChecked(true);
    try {
      const res = await apiJson("/practice/register-style/context-match/submit", {
        method: "POST",
        body: JSON.stringify({ item_id: item.id, selected_option_id: selectedCmOption })
      });
      setCmCorrect(res.is_correct);
      setCmExplanation(res.explanation);
    } catch (e) {
      console.error(e);
      const isCorrect = selectedCmOption === item.correct_id;
      setCmCorrect(isCorrect);
      setCmExplanation(item.explanation);
    }
  };

  // Activity 2A – Rewrite submit
  const handleSubmitRewrite = async () => {
    if (!rewriteData || !rewriteText.trim()) return;
    const task = rewriteData.rewrite_tasks[activeRwIdx];
    setSubmittingRw(true);
    try {
      const res = await apiJson("/practice/register-style/rewrite/submit", {
        method: "POST",
        body: JSON.stringify({
          item_id: task.id,
          user_revision: rewriteText,
          target_register: task.target_register
        })
      });
      setRwFeedback(res);
    } catch (e) {
      console.error(e);
      setRwFeedback({
        feedback_ko: "제출이 완료되었습니다.",
        feedback_en: "Submission received.",
        model_answer_ko: task.model_answer_ko,
        model_answer_en: task.model_answer_en
      });
    } finally {
      setSubmittingRw(false);
    }
  };

  // Activity 2B – AI Chat
  const handleStartChat = async () => {
    setAiMessages([]);
    setAiFinished(false);
    setAiFinishMsg(null);
    setChatStarted(true);
    try {
      const res = await apiJson("/conversation/c1/style-switch/start", { method: "POST" });
      setAiSessionId(res.session_id);
      setAiMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") playAudio(res.opener);
    } catch (err) { console.error(err); }
  };

  const handleSendAiTurn = async () => {
    if (!aiText.trim() || !aiSessionId) return;
    const textToSend = aiText;
    setAiText("");
    setAiMessages(prev => [...prev, { sender: "user", text: textToSend }]);
    setAiSending(true);
    try {
      const res = await apiJson("/conversation/c1/style-switch/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setAiMessages(prev => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") playAudio(res.reply_ko);
    } catch (err) { console.error(err); }
    finally { setAiSending(false); }
  };

  const handleFinishChat = async () => {
    setFinishingChat(true);
    try {
      const res = await apiJson("/conversation/c1/style-switch/finish", { method: "POST" });
      setAiFinishMsg(res.feedback);
      setAiFinished(true);
    } catch (err) { console.error(err); }
    finally { setFinishingChat(false); }
  };

  // Quiz
  const handleCheckQuiz = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelectedOpt) return;
    const isCorrect = quizSelectedOpt === current.correct_answer;
    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    if (!isCorrect) setQuizMistakes(prev => [...prev, current.id]);
    try {
      await apiJson("/quiz/korean5/phase-4/answer", {
        method: "POST",
        body: JSON.stringify({ question_id: current.id, answer: quizSelectedOpt, time_taken_ms: 2000 })
      });
    } catch (e) { console.error(e); }
  };

  const handleNextQuizOrComplete = async () => {
    if (quizIdx < quizBlueprint.length - 1) {
      setQuizIdx(quizIdx + 1);
      setQuizSelectedOpt(null);
      setQuizChecked(false);
      setQuizCorrect(null);
    } else {
      setFinishingQuiz(true);
      try {
        const correctCount = quizBlueprint.length - quizMistakes.length;
        const score = Math.round((correctCount / quizBlueprint.length) * 100);
        const res = await apiJson("/quiz/korean5/phase-4/finish", {
          method: "POST",
          body: JSON.stringify({ score, mistakes: quizMistakes })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Style-Smart C1 Communicator");
        setStep(6);
      } catch (err) { console.error(err); }
      finally { setFinishingQuiz(false); }
    }
  };

  // Homework
  const handleToggleHomework = async (id: string, current: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !current }));
    try {
      await apiJson("/phases/korean5/4/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !current })
      });
    } catch (err) { console.error(err); }
  };

  // Homework AI practice
  const handleStartPractice = async () => {
    setPracticeMessages([]);
    setPracticeFeedback(null);
    setPracticeFinished(false);
    try {
      const res = await apiJson("/conversation/c1/style-switch/start", { method: "POST" });
      setPracticeSessionId(res.session_id);
      setPracticeMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") playAudio(res.opener);
    } catch (err) { console.error(err); }
  };

  const handleSendPracticeTurn = async () => {
    if (!practiceText.trim() || !practiceSessionId) return;
    const textToSend = practiceText;
    setPracticeText("");
    setPracticeMessages(prev => [...prev, { sender: "user", text: textToSend }]);
    setPracticeSending(true);
    try {
      const res = await apiJson("/conversation/c1/style-switch/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setPracticeMessages(prev => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") playAudio(res.reply_ko);
    } catch (err) { console.error(err); }
    finally { setPracticeSending(false); }
  };

  const handleFinishPractice = async () => {
    if (!practiceSessionId) return;
    try {
      const res = await apiJson("/conversation/c1/style-switch/finish", { method: "POST" });
      setPracticeFeedback(res.feedback);
      setPracticeFinished(true);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex-grow flex flex-col justify-between">

      {/* Top Header */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <Layers className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Korean 5.4 – High-Level Register & Style"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Register, Style & Code-Switching</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-40 h-3 bg-zinc-900/80 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 rounded-full transition-all duration-500" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 font-bold">{Math.round((step / totalSteps) * 100)}%</span>
          <button 
            onClick={() => setShowOutline(!showOutline)}
            className="text-[10px] bg-zinc-900 border border-white/10 hover:bg-zinc-900 text-zinc-300 px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer uppercase tracking-wider font-bold"
          >
            {showOutline ? "Hide Outline" : "View Outline"}
          </button>
        </div>
      </header>

      {/* ─── SCREEN 1: Welcome ─── */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Layers className="w-8 h-8 animate-pulse shrink-0" />
          </div>

          <h2 className="text-5xl font-black text-white tracking-tight font-sans">Korean 5.4</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">High-Level Register & Style</h3>

          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Switch between casual, neutral, and formal Korean with confidence."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Recognize informal, neutral, and formal Korean in social, academic, and professional contexts",
                "Rewrite your ideas to match reader, situation, and medium",
                "Speak and write appropriately to friends, teachers, and colleagues at C1 level"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 40}–45 minutes</p>
          </div>

          {/* What you'll practise chips */}
          <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl mx-auto">
            {["Register Recognition", "Context Matching", "Rewrite Drills", "Style-Switch Chat", "Quiz", "Homework"].map(chip => (
              <span key={chip} className="px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full text-[10px] text-brand-300 font-bold">{chip}</span>
            ))}
          </div>

          {/* Mode Selector */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Conversation Mode</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("text")}
                className={`p-3 rounded-xl border text-xs font-bold transition ${
                  mode === "text"
                    ? "border-brand-500 bg-brand-500/10 text-white"
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                Text Input
              </button>
              <button
                onClick={() => setMode("voice")}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  mode === "voice"
                    ? "border-brand-500 bg-brand-500/10 text-white"
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice + Text</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button
              onClick={() => setStep(2)}
              className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 4</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
          </div>

          {showOutline && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-2 animate-fade-in max-w-2xl mx-auto w-full font-mono">
              <p className="font-extrabold text-white text-center pb-2">Course syllabus activities:</p>
              <p>✓ Screen 1 – Welcome / Phase Overview</p>
              <p>✓ Screen 2 – Register & Style Concept Explanation</p>
              <p>✓ Screen 3 – Activity 1: Recognition & Context Matching</p>
              <p>✓ Screen 4 – Activity 2: Rewrite Drills & Style-Switch Chat</p>
              <p>✓ Screen 5 – Mini-Quiz: Register awareness checkpoints</p>
              <p>✓ Screen 6 – Homework & Coaching review</p>
            </div>
          )}
        </div>
      )}

      {/* ─── SCREEN 2: Concept Explanation ─── */}
      {step === 2 && coreData && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-5 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>Register, Style & Context</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          {/* Concept intro */}
          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">Register vs Style</p>
            <p className="italic font-serif">
              "Register is who you're talking to and in what context — it sets the social appropriateness level.
               Style is the specific vocabulary and structural choices you make within that register."
            </p>
          </div>

          {/* Three register level cards */}
          <div className="space-y-3">
            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Three Core Register Levels</span>
            <div className="grid grid-cols-3 gap-2">
              {coreData.register_levels.map((lvl: any) => (
                <div key={lvl.id} className="p-3 bg-zinc-900 rounded-xl border border-white/5 flex flex-col gap-1.5">
                  <span className="text-[8px] uppercase tracking-widest font-mono font-bold text-zinc-500">{lvl.id}</span>
                  <p className="font-bold text-xs text-white leading-tight">{lvl.name}</p>
                  <p className="font-korean text-[10px] text-brand-300 font-bold">{lvl.korean}</p>
                  <p className="text-[9px] text-zinc-400 leading-snug">{lvl.description}</p>
                  <div className="mt-1 border-t border-white/5 pt-1.5">
                    <div className="flex justify-between items-start">
                      <p className="font-korean text-[10px] text-zinc-200 leading-snug">{lvl.example_ko}</p>
                      <button
                        onClick={() => playAudio(lvl.example_ko)}
                        className="p-0.5 text-zinc-500 hover:text-brand-400 transition shrink-0 ml-1 cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[9px] text-zinc-500 italic">{lvl.example_en}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Style contrast table */}
          <div className="space-y-2">
            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Style Contrast Examples</span>
            <div className="flex gap-1 mb-2">
              {coreData.style_contrast_phrases.map((phrase: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setContrastIdx(i)}
                  className={`text-[10px] px-3 py-1 rounded-lg font-bold border transition ${
                    contrastIdx === i ? "bg-brand-500/20 border-brand-500/40 text-white" : "bg-zinc-900 border-white/5 text-zinc-400"
                  }`}
                >
                  {phrase.concept}
                </button>
              ))}
            </div>
            {coreData.style_contrast_phrases[contrastIdx] && (() => {
              const phrase = coreData.style_contrast_phrases[contrastIdx];
              return (
                <div className="space-y-2 animate-fade-in">
                  {(["informal", "neutral", "formal"] as const).map(level => (
                    <div key={level} className="flex items-start gap-3 p-3 bg-zinc-950 rounded-xl border border-white/[0.03]">
                      <span className={`text-[8px] uppercase font-mono font-black shrink-0 mt-0.5 ${
                        level === "informal" ? "text-accent-pink" : level === "neutral" ? "text-brand-400" : "text-accent-teal"
                      }`}>{level}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-korean text-xs text-white leading-snug">{phrase[level].ko}</p>
                          <button onClick={() => playAudio(phrase[level].ko)} className="text-zinc-500 hover:text-brand-400 transition cursor-pointer shrink-0">
                            <Volume2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[9px] text-zinc-500 italic">{phrase[level].en}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* ─── SCREEN 3: Activity 1 – Recognition & Context Matching ─── */}
      {step === 3 && recognitionData && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-brand-400" />
              <span>
                {activity1SubStep === "1A" && "1A: Register Recognition"}
                {activity1SubStep === "1B" && "1B: Context Matching"}
              </span>
            </h2>
            <div className="flex gap-1">
              {["1A", "1B"].map(sub => (
                <button
                  key={sub}
                  onClick={() => setActivity1SubStep(sub as any)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${activity1SubStep === sub ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Activity 1A */}
          {activity1SubStep === "1A" && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Identify the register level of this Korean sentence:</span>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase">Korean Sentence:</span>
                  <button
                    onClick={() => playAudio(recognitionData.recognition_items[activeRecIdx].sentence)}
                    className="p-1 bg-zinc-900 border border-white/5 rounded text-[9px] text-zinc-300 hover:text-white px-2 flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Listen
                  </button>
                </div>
                <p className="font-korean text-zinc-200 text-sm leading-relaxed">
                  {recognitionData.recognition_items[activeRecIdx].sentence}
                </p>
                <p className="text-[11px] text-zinc-500 italic">
                  "{recognitionData.recognition_items[activeRecIdx].translation}"
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-white">Select the register level:</p>
                <div className="grid grid-cols-3 gap-2">
                  {["informal", "neutral", "formal"].map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => !recChecked && setSelectedRegister(lvl)}
                      disabled={recChecked}
                      className={`p-3 rounded-xl border text-xs font-bold transition capitalize ${
                        selectedRegister === lvl
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {recChecked && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${recCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                  <p className="font-black">{recCorrect ? "✓ Correct Register!" : "✗ Not quite. Review the markers:"}</p>
                  <p className="text-zinc-400 leading-normal">{recognitionData.recognition_items[activeRecIdx].explanation}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Key markers: {recognitionData.recognition_items[activeRecIdx].markers.join(", ")}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                {!recChecked ? (
                  <button
                    onClick={handleCheckRec}
                    disabled={!selectedRegister}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Register
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (activeRecIdx < recognitionData.recognition_items.length - 1) {
                        setActiveRecIdx(prev => prev + 1);
                        setSelectedRegister(null);
                        setRecChecked(false);
                        setRecCorrect(null);
                      } else {
                        setActivity1SubStep("1B");
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {activeRecIdx < recognitionData.recognition_items.length - 1 ? "Next Sentence" : "Proceed to Context Matching →"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 1B – Context Matching */}
          {activity1SubStep === "1B" && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">
                Choose the most appropriate sentence for the context:
              </span>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5">
                <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
                  📋 {recognitionData.context_matching[activeCmIdx].context}
                </p>
              </div>

              <div className="space-y-2">
                {recognitionData.context_matching[activeCmIdx].options.map((opt: any) => {
                  let borderClass = "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10";
                  if (cmChecked) {
                    if (opt.id === recognitionData.context_matching[activeCmIdx].correct_id) {
                      borderClass = "border-accent-teal bg-accent-teal/5 text-accent-teal";
                    } else if (opt.id === selectedCmOption) {
                      borderClass = "border-accent-pink bg-accent-pink/5 text-accent-pink";
                    }
                  } else if (selectedCmOption === opt.id) {
                    borderClass = "border-brand-500 bg-brand-500/10 text-white";
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => !cmChecked && setSelectedCmOption(opt.id)}
                      disabled={cmChecked}
                      className={`w-full p-4 rounded-2xl border text-left transition flex flex-col gap-1 ${borderClass}`}
                    >
                      <span className="text-[8px] uppercase tracking-widest font-mono font-bold text-zinc-500">{opt.label}</span>
                      <p className="font-korean text-sm leading-snug">{opt.text}</p>
                    </button>
                  );
                })}
              </div>

              {cmChecked && cmExplanation && (
                <div className={`p-4 rounded-xl border text-xs space-y-1 ${cmCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                  <p className="font-black">{cmCorrect ? "✓ Right Context Match!" : "✗ Not the best fit. See why:"}</p>
                  <p className="text-zinc-400 leading-normal">{cmExplanation}</p>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                {!cmChecked ? (
                  <button
                    onClick={handleCheckCm}
                    disabled={!selectedCmOption}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : activeCmIdx < recognitionData.context_matching.length - 1 ? (
                  <button
                    onClick={() => {
                      setActiveCmIdx(prev => prev + 1);
                      setSelectedCmOption(null);
                      setCmChecked(false);
                      setCmCorrect(null);
                      setCmExplanation(null);
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next Context →
                  </button>
                ) : (
                  <button
                    onClick={() => setStep(4)}
                    className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    Proceed to Activity 2 <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── SCREEN 4: Activity 2 – Rewrite Drills & Style-Switch Chat ─── */}
      {step === 4 && rewriteData && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-brand-400" />
              <span>
                {activity2SubStep === "2A" && "2A: Register Rewrite Drills"}
                {activity2SubStep === "2B" && "2B: Style-Switch AI Chat"}
              </span>
            </h2>
            <div className="flex gap-1">
              {["2A", "2B"].map(sub => (
                <button
                  key={sub}
                  onClick={() => setActivity2SubStep(sub as any)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${activity2SubStep === sub ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Activity 2A – Rewrite */}
          {activity2SubStep === "2A" && (
            <div className="space-y-4 text-left animate-fade-in">
              {rewriteData.rewrite_tasks[activeRwIdx] && (() => {
                const task = rewriteData.rewrite_tasks[activeRwIdx];
                return (
                  <>
                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">
                      Rewrite this sentence in a higher register:
                    </span>

                    {/* Source */}
                    <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] uppercase tracking-widest font-mono font-bold text-accent-pink">
                          Original ({task.source_register})
                        </span>
                        <button onClick={() => playAudio(task.original_ko)} className="text-zinc-500 hover:text-brand-400 cursor-pointer transition">
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="font-korean text-zinc-200 text-sm leading-relaxed">{task.original_ko}</p>
                      <p className="text-[10px] text-zinc-500 italic">{task.original_en}</p>
                    </div>

                    {/* Target label */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">Target Register:</span>
                      <span className="text-[10px] font-bold text-accent-teal uppercase">{task.target_register}</span>
                    </div>

                    {/* Hints */}
                    <div className="bg-zinc-950 p-3 rounded-xl border border-white/[0.03] space-y-1">
                      <p className="text-[9px] text-zinc-500 font-mono uppercase font-bold">💡 Hints:</p>
                      {task.hints.map((hint: string, i: number) => (
                        <p key={i} className="text-[10px] text-zinc-400">• {hint}</p>
                      ))}
                    </div>

                    {/* Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white">Your rewrite:</label>
                      <textarea
                        value={rewriteText}
                        onChange={e => setRewriteText(e.target.value)}
                        rows={3}
                        placeholder="Type your rewritten sentence here..."
                        disabled={!!rwFeedback}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-brand-500/50 resize-none font-korean"
                      />
                    </div>

                    {rwFeedback && (
                      <div className="p-4 bg-brand-500/5 border border-brand-500/15 rounded-xl space-y-2 text-xs animate-fade-in">
                        <p className="font-black text-white">✓ Feedback</p>
                        <p className="text-zinc-300">{rwFeedback.feedback_en}</p>
                        <div className="border-t border-white/5 pt-2 space-y-1">
                          <p className="text-[9px] text-zinc-500 uppercase font-mono">Model Answer:</p>
                          <p className="font-korean text-accent-teal font-bold">{rwFeedback.model_answer_ko}</p>
                          <p className="text-zinc-400 italic text-[10px]">{rwFeedback.model_answer_en}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      {!rwFeedback ? (
                        <button
                          onClick={handleSubmitRewrite}
                          disabled={!rewriteText.trim() || submittingRw}
                          className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          {submittingRw ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Submit Rewrite
                        </button>
                      ) : activeRwIdx < rewriteData.rewrite_tasks.length - 1 ? (
                        <button
                          onClick={() => {
                            setActiveRwIdx(prev => prev + 1);
                            setRewriteText("");
                            setRwFeedback(null);
                          }}
                          className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Next Rewrite →
                        </button>
                      ) : (
                        <button
                          onClick={() => setActivity2SubStep("2B")}
                          className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer"
                        >
                          Proceed to Style-Switch Chat <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Activity 2B – AI Style-Switch Chat */}
          {activity2SubStep === "2B" && (
            <div className="space-y-4 text-left animate-fade-in">
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
                <p className="text-xs font-bold text-white flex items-center gap-2"><MessageCircle className="w-4 h-4 text-brand-400" /> Style-Switch AI Coach</p>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Write a Korean sentence at any register level, and the AI coach will identify it, give feedback,
                  and show you how to express the same idea one register level higher.
                </p>
              </div>

              {!chatStarted ? (
                <button
                  onClick={handleStartChat}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> Start Style-Switch Session
                </button>
              ) : (
                <>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {aiMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl text-xs leading-relaxed ${
                          msg.sender === "assistant"
                            ? "bg-brand-500/10 border border-brand-500/15 text-zinc-200"
                            : "bg-zinc-900 border border-white/5 text-zinc-300 ml-4"
                        }`}
                      >
                        <span className="text-[8px] uppercase font-mono text-zinc-500 block mb-1">
                          {msg.sender === "assistant" ? "AI Coach" : "You"}
                        </span>
                        {msg.text}
                      </div>
                    ))}
                    {aiSending && (
                      <div className="flex items-center gap-2 text-zinc-500 text-xs pl-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
                      </div>
                    )}
                  </div>

                  {!aiFinished && (
                    <div className="flex gap-2">
                      <input
                        value={aiText}
                        onChange={e => setAiText(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendAiTurn()}
                        placeholder="Type in any register level Korean..."
                        className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-brand-500/50 font-korean"
                        disabled={aiSending}
                      />
                      <button
                        onClick={handleSendAiTurn}
                        disabled={!aiText.trim() || aiSending}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white p-2 rounded-xl transition cursor-pointer"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {!aiFinished && aiMessages.length >= 3 && (
                    <button
                      onClick={handleFinishChat}
                      disabled={finishingChat}
                      className="w-full text-xs text-zinc-400 hover:text-white underline cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {finishingChat ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Finish Session
                    </button>
                  )}

                  {aiFinished && aiFinishMsg && (
                    <div className="p-4 bg-accent-teal/5 border border-accent-teal/20 rounded-xl text-xs text-accent-teal space-y-1 animate-fade-in">
                      <p className="font-black">✓ Session Complete!</p>
                      <p className="text-zinc-400 leading-relaxed">{aiFinishMsg}</p>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(3)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                  Proceed to Quiz <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── SCREEN 5: Mini-Quiz ─── */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Mini-Quiz – Register & Style</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">
              {quizBlueprint.length > 0 ? `${quizIdx + 1}/${quizBlueprint.length}` : "Loading..."}
            </span>
          </div>

          {quizBlueprint.length === 0 ? (
            <div className="flex items-center gap-2 text-zinc-400 text-sm justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading quiz...
            </div>
          ) : (
            <div className="space-y-4 text-left animate-fade-in">
              <p className="text-sm font-semibold text-zinc-200 leading-relaxed">
                {quizBlueprint[quizIdx].question}
              </p>

              <div className="space-y-2">
                {quizBlueprint[quizIdx].options?.map((opt: string) => {
                  let cls = "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10";
                  if (quizChecked) {
                    if (opt === quizBlueprint[quizIdx].correct_answer) {
                      cls = "border-accent-teal bg-accent-teal/5 text-accent-teal";
                    } else if (opt === quizSelectedOpt) {
                      cls = "border-accent-pink bg-accent-pink/5 text-accent-pink";
                    }
                  } else if (quizSelectedOpt === opt) {
                    cls = "border-brand-500 bg-brand-500/10 text-white";
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                      disabled={quizChecked}
                      className={`w-full p-4 rounded-2xl border text-left text-xs font-medium transition ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {quizChecked && (
                <div className={`p-4 rounded-xl border text-xs space-y-1 ${quizCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                  <p className="font-black">{quizCorrect ? "✓ Correct!" : "✗ Not quite."}</p>
                  <p className="text-zinc-400 leading-relaxed">{quizBlueprint[quizIdx].explanation}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={!quizSelectedOpt}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 disabled:opacity-50 px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {finishingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    {quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── SCREEN 6: Homework & Completion ─── */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">

          {quizBadge && (
            <div className="bg-brand-500/10 border border-brand-500/25 rounded-2xl p-5 text-center space-y-2 animate-fade-in">
              <Award className="w-8 h-8 text-brand-400 mx-auto" />
              <p className="text-white font-black text-sm">Badge Earned!</p>
              <p className="text-brand-300 font-bold text-xs">{quizBadge}</p>
              {quizScore !== null && (
                <p className="text-zinc-400 text-xs">Quiz Score: <span className="text-white font-bold">{quizScore}%</span></p>
              )}
            </div>
          )}

          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-brand-400" />
              <span>Homework & Coaching</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of {totalSteps}</span>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">📚 Practice Assignments</span>
            {homeworkItems.map((item: any) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-4 rounded-2xl border transition cursor-pointer ${
                  completedHomework[item.id] ? "border-accent-teal/30 bg-accent-teal/5" : "border-white/5 bg-zinc-900/60"
                }`}
                onClick={() => handleToggleHomework(item.id, !!completedHomework[item.id])}
              >
                <CheckSquare className={`w-4 h-4 mt-0.5 shrink-0 ${completedHomework[item.id] ? "text-accent-teal" : "text-zinc-600"}`} />
                <p className="text-xs text-zinc-300 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          {/* AI coaching section */}
          <div className="border-t border-white/5 pt-4 space-y-3">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">🤖 AI Register Coaching</span>
            {!practiceSessionId ? (
              <button
                onClick={handleStartPractice}
                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-white py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-brand-400" /> Start Register Coaching Session
              </button>
            ) : (
              <>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {practiceMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        msg.sender === "assistant"
                          ? "bg-brand-500/10 border border-brand-500/15 text-zinc-200"
                          : "bg-zinc-900 border border-white/5 text-zinc-300 ml-4"
                      }`}
                    >
                      <span className="text-[8px] uppercase font-mono text-zinc-500 block mb-1">
                        {msg.sender === "assistant" ? "AI Coach" : "You"}
                      </span>
                      {msg.text}
                    </div>
                  ))}
                  {practiceSending && (
                    <div className="flex items-center gap-2 text-zinc-500 text-xs pl-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
                    </div>
                  )}
                </div>

                {!practiceFinished && (
                  <div className="flex gap-2">
                    <input
                      value={practiceText}
                      onChange={e => setPracticeText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendPracticeTurn()}
                      placeholder="Write a Korean sentence in any register..."
                      className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-brand-500/50 font-korean"
                      disabled={practiceSending}
                    />
                    <button
                      onClick={handleSendPracticeTurn}
                      disabled={!practiceText.trim() || practiceSending}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white p-2 rounded-xl transition cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {!practiceFinished && practiceMessages.length >= 3 && (
                  <button
                    onClick={handleFinishPractice}
                    className="w-full text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Finish Coaching Session
                  </button>
                )}

                {practiceFinished && practiceFeedback && (
                  <div className="p-3 bg-accent-teal/5 border border-accent-teal/20 rounded-xl text-xs text-accent-teal animate-fade-in">
                    <p className="font-black mb-1">✓ Coaching Complete!</p>
                    <p className="text-zinc-400 leading-relaxed">{practiceFeedback}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <button onClick={() => setStep(5)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={onComplete}
              className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <CheckCircle2 className="w-4 h-4" /> Complete Phase 4
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
