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
  Eye,
  ArrowRight,
  CheckSquare,
  Bookmark,
  Brain,
  AlertCircle
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

interface Course6Phase5ImplicitWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  refusal: "accent-pink",
  hint: "brand-400",
  criticism: "yellow-400",
  emotional_subtext: "accent-teal"
};

const CATEGORY_LABELS: Record<string, string> = {
  refusal: "Polite Refusal",
  hint: "Indirect Hint",
  criticism: "Soft Criticism",
  emotional_subtext: "Emotional Subtext"
};

export default function Course6Phase5ImplicitWizard({
  activeLesson,
  speakWord,
  onComplete
}: Course6Phase5ImplicitWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 6;

  // Data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);
  const [recognitionData, setRecognitionData] = useState<any>(null);
  const [responseTemplates, setResponseTemplates] = useState<any>(null);
  const [softenTemplates, setSoftenTemplates] = useState<any>(null);

  // Activity 1 sub-steps
  const [activity1SubStep, setActivity1SubStep] = useState<"1A" | "1B" | "1C">("1A");

  // 1A – Dialogue recognition
  const [activeDialogueIdx, setActiveDialogueIdx] = useState(0);
  const [selectedDialogueOpt, setSelectedDialogueOpt] = useState<number | null>(null);
  const [dialogueChecked, setDialogueChecked] = useState(false);
  const [dialogueCorrect, setDialogueCorrect] = useState<boolean | null>(null);

  // 1B – Yes/No/Maybe
  const [activeYnmIdx, setActiveYnmIdx] = useState(0);
  const [selectedYnm, setSelectedYnm] = useState<string | null>(null);
  const [ynmChecked, setYnmChecked] = useState(false);
  const [ynmCorrect, setYnmCorrect] = useState<boolean | null>(null);

  // 1C – Emotion inference
  const [activeEiIdx, setActiveEiIdx] = useState(0);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [eiChecked, setEiChecked] = useState(false);
  const [eiCorrect, setEiCorrect] = useState<boolean | null>(null);

  // Pattern card expand
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  // Activity 2 sub-steps
  const [activity2SubStep, setActivity2SubStep] = useState<"2A" | "2B" | "2C">("2A");

  // 2A – Response builder
  const [activeRtIdx, setActiveRtIdx] = useState(0);
  const [rtStep, setRtStep] = useState<"pick_meaning" | "write_response">("pick_meaning");
  const [selectedRealMeaning, setSelectedRealMeaning] = useState<string | null>(null);
  const [userResponse, setUserResponse] = useState("");
  const [rtFeedback, setRtFeedback] = useState<any>(null);
  const [submittingRt, setSubmittingRt] = useState(false);

  // 2B – Soften rewrite
  const [activeSoftenIdx, setActiveSoftenIdx] = useState(0);
  const [selectedSoftenOpt, setSelectedSoftenOpt] = useState<number | null>(null);
  const [softenFeedback, setSoftenFeedback] = useState<any>(null);
  const [submittingSoften, setSubmittingSoften] = useState(false);

  // 2C – AI implicit chat
  const [chatContext, setChatContext] = useState<"social" | "academic" | "work">("social");
  const [chatStarted, setChatStarted] = useState(false);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [aiText, setAiText] = useState("");
  const [aiSending, setAiSending] = useState(false);
  const [aiFinished, setAiFinished] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [finishingChat, setFinishingChat] = useState(false);

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

  // Homework
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Homework AI coaching
  const [coachSessionId, setCoachSessionId] = useState<string | null>(null);
  const [coachMessages, setCoachMessages] = useState<any[]>([]);
  const [coachText, setCoachText] = useState("");
  const [coachSending, setCoachSending] = useState(false);
  const [coachFinished, setCoachFinished] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean5/5/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean5/5/core-data");
          setCoreData(res);
        } else if (step === 3 && !recognitionData) {
          const res = await apiJson("/practice/implicit/recognition");
          setRecognitionData(res);
        } else if (step === 4 && !responseTemplates) {
          const [rtRes, stRes] = await Promise.all([
            apiJson("/practice/implicit/response-templates"),
            apiJson("/practice/implicit/soften-templates")
          ]);
          setResponseTemplates(rtRes);
          setSoftenTemplates(stRes);
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean5/phase-5/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean5/5/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading Phase 5 data:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => speakWord(text);

  // 1A check
  const handleCheckDialogue = async () => {
    if (!recognitionData || selectedDialogueOpt === null) return;
    const item = recognitionData.recognition_dialogues[activeDialogueIdx];
    const isCorrect = selectedDialogueOpt === item.correct_idx;
    setDialogueChecked(true);
    setDialogueCorrect(isCorrect);
    try {
      await apiJson("/practice/implicit/recognition/answer", {
        method: "POST",
        body: JSON.stringify({ dialogue_id: item.id, selected_idx: selectedDialogueOpt, time_taken_ms: 2000 })
      });
    } catch (e) { console.error(e); }
  };

  // 1B check
  const handleCheckYnm = () => {
    if (!recognitionData || !selectedYnm) return;
    const item = recognitionData.yes_no_maybe_items[activeYnmIdx];
    setYnmChecked(true);
    setYnmCorrect(selectedYnm === item.answer);
  };

  // 1C check
  const handleCheckEmotion = () => {
    if (!recognitionData || !selectedEmotion) return;
    const item = recognitionData.emotion_inference_items[activeEiIdx];
    setEiChecked(true);
    setEiCorrect(selectedEmotion === item.correct);
  };

  // 2A response
  const handleSubmitResponse = async () => {
    if (!responseTemplates || !userResponse.trim()) return;
    const template = responseTemplates.response_templates[activeRtIdx];
    setSubmittingRt(true);
    try {
      const res = await apiJson("/practice/implicit/response/submit", {
        method: "POST",
        body: JSON.stringify({
          template_id: template.id,
          user_response: userResponse,
          real_meaning: template.real_meaning
        })
      });
      setRtFeedback(res);
    } catch (e) {
      setRtFeedback({ feedback_en: "Good effort! Compare your response to the model answer below.", feedback_ko: "잘 하셨어요!" });
    } finally {
      setSubmittingRt(false);
    }
  };

  // 2B soften
  const handleSubmitSoften = async () => {
    if (!softenTemplates || selectedSoftenOpt === null) return;
    const template = softenTemplates.soften_templates[activeSoftenIdx];
    setSubmittingSoften(true);
    try {
      const res = await apiJson("/practice/implicit/soften/submit", {
        method: "POST",
        body: JSON.stringify({ template_id: template.id, selected_option_idx: selectedSoftenOpt })
      });
      setSoftenFeedback(res);
    } catch (e) {
      setSoftenFeedback({ feedback_en: "Good choice! That softens the message effectively." });
    } finally {
      setSubmittingSoften(false);
    }
  };

  // 2C chat
  const handleStartChat = async () => {
    setAiMessages([]);
    setAiFinished(false);
    setAiReport(null);
    setChatStarted(true);
    try {
      const res = await apiJson("/conversation/c1/implicit-practice/start", { method: "POST" });
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
      const res = await apiJson("/conversation/c1/implicit-practice/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend, context: chatContext })
      });
      setAiMessages(prev => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") playAudio(res.reply_ko);
    } catch (err) { console.error(err); }
    finally { setAiSending(false); }
  };

  const handleFinishChat = async () => {
    setFinishingChat(true);
    try {
      const res = await apiJson("/conversation/c1/implicit-practice/finish", { method: "POST" });
      setAiReport(res.implicit_understanding_report);
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
      await apiJson("/quiz/korean5/phase-5/answer", {
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
        const res = await apiJson("/quiz/korean5/phase-5/finish", {
          method: "POST",
          body: JSON.stringify({ score, mistakes: quizMistakes })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Subtext Reader C1");
        setStep(6);
      } catch (err) { console.error(err); }
      finally { setFinishingQuiz(false); }
    }
  };

  // Homework
  const handleToggleHomework = async (id: string, current: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !current }));
    try {
      await apiJson("/phases/korean5/5/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !current })
      });
    } catch (err) { console.error(err); }
  };

  // Coaching session
  const handleStartCoaching = async () => {
    setCoachMessages([]);
    setCoachFeedback(null);
    setCoachFinished(false);
    try {
      const res = await apiJson("/conversation/c1/subtext-coaching/start", { method: "POST" });
      setCoachSessionId(res.session_id);
      setCoachMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") playAudio(res.opener);
    } catch (err) { console.error(err); }
  };

  const handleSendCoachTurn = async () => {
    if (!coachText.trim() || !coachSessionId) return;
    const textToSend = coachText;
    setCoachText("");
    setCoachMessages(prev => [...prev, { sender: "user", text: textToSend }]);
    setCoachSending(true);
    try {
      const res = await apiJson("/conversation/c1/subtext-coaching/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setCoachMessages(prev => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") playAudio(res.reply_ko);
    } catch (err) { console.error(err); }
    finally { setCoachSending(false); }
  };

  const handleFinishCoaching = async () => {
    if (!coachSessionId) return;
    try {
      const res = await apiJson("/conversation/c1/subtext-coaching/finish", { method: "POST" });
      setCoachFeedback(res.feedback);
      setCoachFinished(true);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex-grow flex flex-col justify-between max-w-2xl mx-auto w-full font-sans">

      {/* Header */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-zinc-900 border border-white/10">
            <Eye className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg">
              {activeLesson?.title || "Korean 5.5 – Implicit Meaning"}
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Subtext, Indirectness & Inference</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-32 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 rounded-full transition-all duration-500" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 font-bold">{Math.round((step / totalSteps) * 100)}%</span>
          <button 
            onClick={() => setShowOutline(!showOutline)}
            className="text-[10px] bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded transition cursor-pointer"
          >
            {showOutline ? "Hide Outline" : "View Outline"}
          </button>
        </div>
      </header>

      {/* ─── SCREEN 1: Welcome ─── */}
      {step === 1 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Eye className="w-8 h-8 animate-pulse" />
          </div>

          <h2 className="text-3xl font-black text-white">Korean 5.5</h2>
          <h3 className="text-xl font-bold text-brand-400 mt-1">Implicit Meaning & 'Reading Between the Lines'</h3>

          <p className="text-zinc-300 text-sm leading-relaxed max-w-md mx-auto">
            {metadata?.description || "Understand hints, indirectness, and subtext in Korean."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Recognise implied meaning in conversations, messages, and stories",
                "Interpret polite hints, indirect refusals, and emotional subtext",
                "Respond appropriately when the real message is not said directly"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 40}–45 minutes</p>
          </div>

          {/* What you'll practise chips */}
          <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
            {["Dialogue Inference", "Yes/No/Maybe", "Emotion Reading", "Response Building", "Softening Rewrites", "AI Subtext Coach"].map(chip => (
              <span key={chip} className="px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full text-[10px] text-brand-300 font-bold">{chip}</span>
            ))}
          </div>

          {/* Mode selector */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Conversation Mode</span>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setMode("text")} className={`p-3 rounded-xl border text-xs font-bold transition ${mode === "text" ? "border-brand-500 bg-brand-500/10 text-white" : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"}`}>
                Text Input
              </button>
              <button onClick={() => setMode("voice")} className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${mode === "voice" ? "border-brand-500 bg-brand-500/10 text-white" : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"}`}>
                <Mic className="w-3.5 h-3.5" /><span>Voice + Text</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button onClick={() => setStep(2)} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-500/20">
              <span>Start Phase 5</span><ChevronRight className="w-4 h-4" />
            </button>
            
          </div>

          {showOutline && (
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-1.5 animate-fade-in max-w-md mx-auto w-full font-mono">
              <p className="font-extrabold text-white text-center pb-2">Course syllabus activities:</p>
              <p>✓ Screen 1 – Welcome / Phase Overview</p>
              <p>✓ Screen 2 – Concept: Implicit Meaning & Indirect Speech</p>
              <p>✓ Screen 3 – Activity 1: Spot the Hidden Message (Dialogue, Yes/No/Maybe, Emotion)</p>
              <p>✓ Screen 4 – Activity 2: Responding & Softening (Response Builder, Soften Rewrites, AI Chat)</p>
              <p>✓ Screen 5 – Mini-Quiz: 5 inference checkpoints</p>
              <p>✓ Screen 6 – Homework & AI Subtext Coaching</p>
            </div>
          )}
        </div>
      )}

      {/* ─── SCREEN 2: Concept Explanation ─── */}
      {step === 2 && coreData && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-5 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-400" />
              <span>Implicit Meaning & Indirect Speech</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          {/* C1 Concept block */}
          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300 space-y-2">
            <p className="font-bold text-white">C1 Goal: Reading Between the Lines</p>
            <p className="italic font-serif">"At C1, you can recognise implicit meaning — what people suggest without saying it directly. Looking beyond the literal words to infer the real message or emotion."</p>
            <div className="border-t border-white/5 pt-2 space-y-1">
              <p className="font-bold text-zinc-200 text-[11px]">Inference as a skill:</p>
              <p className="text-zinc-400">Use clues — <span className="text-brand-300">words</span>, <span className="text-accent-teal">tone</span>, <span className="text-accent-pink">context</span>, <span className="text-yellow-400">relationship</span> — to reconstruct the speaker's real intent.</p>
            </div>
          </div>

          {/* Implicit pattern cards */}
          <div className="space-y-2">
            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">5 Core Implicit Patterns in Korean</span>
            <div className="space-y-2">
              {coreData.implicit_patterns.map((pattern: any) => {
                const isExpanded = expandedPattern === pattern.id;
                return (
                  <div
                    key={pattern.id}
                    className="bg-zinc-900 rounded-xl border border-white/5 overflow-hidden cursor-pointer"
                    onClick={() => setExpandedPattern(isExpanded ? null : pattern.id)}
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] uppercase font-mono font-black px-2 py-0.5 rounded-full ${
                          pattern.category === "refusal" ? "bg-accent-pink/15 text-accent-pink" :
                          pattern.category === "hint" ? "bg-brand-500/15 text-brand-400" :
                          pattern.category === "criticism" ? "bg-yellow-500/15 text-yellow-400" :
                          "bg-accent-teal/15 text-accent-teal"
                        }`}>{CATEGORY_LABELS[pattern.category] || pattern.category}</span>
                        <p className="text-xs font-bold text-white">{pattern.pattern_en}</p>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </div>

                    {isExpanded && (
                      <div className="border-t border-white/[0.03] p-3 space-y-2 animate-fade-in">
                        <div className="flex items-start gap-2">
                          <p className="font-korean text-sm text-zinc-200 leading-relaxed flex-1">{pattern.korean_example}</p>
                          <button onClick={(e) => { e.stopPropagation(); playAudio(pattern.korean_example); }} className="text-zinc-500 hover:text-brand-400 transition shrink-0 cursor-pointer">
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="p-2 bg-zinc-950 rounded-lg border border-white/[0.03]">
                            <p className="text-zinc-500 font-mono uppercase text-[8px] mb-1">Literal</p>
                            <p className="text-zinc-300 italic">{pattern.literal_en}</p>
                          </div>
                          <div className="p-2 bg-accent-teal/5 rounded-lg border border-accent-teal/15">
                            <p className="text-zinc-500 font-mono uppercase text-[8px] mb-1">Real Meaning</p>
                            <p className="text-accent-teal font-medium">{pattern.real_meaning_en}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {pattern.clues.map((clue: string, i: number) => (
                            <span key={i} className="text-[9px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-white/5">🔍 {clue}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* ─── SCREEN 3: Activity 1 – Spot the Hidden Message ─── */}
      {step === 3 && recognitionData && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-brand-400" />
              <span>
                {activity1SubStep === "1A" && "1A: What Do They Really Mean?"}
                {activity1SubStep === "1B" && "1B: Yes, Polite No, or Unsure?"}
                {activity1SubStep === "1C" && "1C: How Do They Feel?"}
              </span>
            </h2>
            <div className="flex gap-1">
              {["1A", "1B", "1C"].map(sub => (
                <button key={sub} onClick={() => setActivity1SubStep(sub as any)} className={`px-2 py-0.5 rounded text-[10px] font-bold ${activity1SubStep === sub ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}>{sub}</button>
              ))}
            </div>
          </div>

          {/* Activity 1A – Dialogue recognition */}
          {activity1SubStep === "1A" && (
            <div className="space-y-4 text-left animate-fade-in">
              <div className="p-1 bg-zinc-900/60 rounded-xl text-[10px] text-zinc-500 flex items-center gap-1.5 px-3">
                <AlertCircle className="w-3 h-3 text-brand-400 shrink-0" />
                <span>Scenario: <span className="text-zinc-300">{recognitionData.recognition_dialogues[activeDialogueIdx].scenario}</span></span>
              </div>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[8px] uppercase font-mono font-black px-2 py-0.5 rounded-full ${
                      recognitionData.recognition_dialogues[activeDialogueIdx].category === "refusal" ? "bg-accent-pink/15 text-accent-pink" :
                      recognitionData.recognition_dialogues[activeDialogueIdx].category === "hint" ? "bg-brand-500/15 text-brand-400" :
                      "bg-yellow-500/15 text-yellow-400"
                    }`}>{CATEGORY_LABELS[recognitionData.recognition_dialogues[activeDialogueIdx].category] || recognitionData.recognition_dialogues[activeDialogueIdx].category}</span>
                  </div>
                  <button onClick={() => playAudio(recognitionData.recognition_dialogues[activeDialogueIdx].dialogue_ko)} className="p-1 bg-zinc-900 border border-white/5 rounded text-[9px] text-zinc-300 hover:text-white px-2 flex items-center gap-1 cursor-pointer">
                    <Volume2 className="w-3.5 h-3.5" /> Listen
                  </button>
                </div>
                <div className="space-y-1.5">
                  {recognitionData.recognition_dialogues[activeDialogueIdx].dialogue_ko.split("\n").map((line: string, i: number) => (
                    <p key={i} className="font-korean text-zinc-200 text-sm leading-relaxed">{line}</p>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-500 italic border-t border-white/[0.03] pt-2">
                  {recognitionData.recognition_dialogues[activeDialogueIdx].dialogue_en.split("\n").map((line: string, i: number) => (
                    <span key={i} className="block">{line}</span>
                  ))}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-white">{recognitionData.recognition_dialogues[activeDialogueIdx].question}</p>
                {recognitionData.recognition_dialogues[activeDialogueIdx].options.map((opt: string, idx: number) => {
                  let cls = "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10";
                  if (dialogueChecked) {
                    if (idx === recognitionData.recognition_dialogues[activeDialogueIdx].correct_idx) cls = "border-accent-teal bg-accent-teal/5 text-accent-teal";
                    else if (idx === selectedDialogueOpt) cls = "border-accent-pink bg-accent-pink/5 text-accent-pink";
                  } else if (selectedDialogueOpt === idx) cls = "border-brand-500 bg-brand-500/10 text-white";
                  return (
                    <button key={idx} onClick={() => !dialogueChecked && setSelectedDialogueOpt(idx)} disabled={dialogueChecked} className={`w-full p-3 rounded-xl border text-xs font-medium text-left transition ${cls}`}>
                      {idx === 0 ? "A" : idx === 1 ? "B" : "C"}. {opt}
                    </button>
                  );
                })}
              </div>

              {dialogueChecked && (
                <div className={`p-4 rounded-xl border text-xs space-y-2 ${dialogueCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                  <p className="font-black">{dialogueCorrect ? "✓ Correct! You spotted the real meaning." : "✗ Not quite. Here's what to look for:"}</p>
                  <p className="text-zinc-400 leading-normal">{recognitionData.recognition_dialogues[activeDialogueIdx].explanation}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {recognitionData.recognition_dialogues[activeDialogueIdx].clue_phrases.map((clue: string, i: number) => (
                      <span key={i} className="text-[9px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded-full border border-white/5">🔍 {clue}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                {!dialogueChecked ? (
                  <button onClick={handleCheckDialogue} disabled={selectedDialogueOpt === null} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (activeDialogueIdx < recognitionData.recognition_dialogues.length - 1) {
                        setActiveDialogueIdx(prev => prev + 1);
                        setSelectedDialogueOpt(null);
                        setDialogueChecked(false);
                        setDialogueCorrect(null);
                      } else {
                        setActivity1SubStep("1B");
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {activeDialogueIdx < recognitionData.recognition_dialogues.length - 1 ? "Next Dialogue →" : "Proceed to Yes/No/Maybe →"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 1B – Yes/No/Maybe */}
          {activity1SubStep === "1B" && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Is this a genuine Yes, a Polite No, or Unsure?</span>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-2">
                <p className="text-[10px] text-zinc-500 font-mono">📋 Context: {recognitionData.yes_no_maybe_items[activeYnmIdx].context}</p>
                <div className="flex items-start gap-2">
                  <p className="font-korean text-zinc-200 text-sm leading-relaxed flex-1">{recognitionData.yes_no_maybe_items[activeYnmIdx].reply_ko}</p>
                  <button onClick={() => playAudio(recognitionData.yes_no_maybe_items[activeYnmIdx].reply_ko)} className="text-zinc-500 hover:text-brand-400 transition cursor-pointer shrink-0">
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 italic">{recognitionData.yes_no_maybe_items[activeYnmIdx].reply_en}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: "yes", label: "✅ Yes", color: "accent-teal" },
                  { val: "polite_no", label: "🚫 Polite No", color: "accent-pink" },
                  { val: "unsure", label: "🤔 Unsure", color: "yellow-400" }
                ].map(opt => {
                  let cls = "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10";
                  if (ynmChecked && opt.val === recognitionData.yes_no_maybe_items[activeYnmIdx].answer) cls = "border-accent-teal bg-accent-teal/5 text-accent-teal";
                  else if (ynmChecked && opt.val === selectedYnm) cls = "border-accent-pink bg-accent-pink/5 text-accent-pink";
                  else if (selectedYnm === opt.val) cls = "border-brand-500 bg-brand-500/10 text-white";
                  return (
                    <button key={opt.val} onClick={() => !ynmChecked && setSelectedYnm(opt.val)} disabled={ynmChecked} className={`p-3 rounded-xl border text-xs font-bold transition text-center ${cls}`}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {ynmChecked && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${ynmCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                  <p className="font-black">{ynmCorrect ? "✓ Correct reading!" : "✗ Not quite — here's the key:"}</p>
                  <p className="text-zinc-400 leading-relaxed">{recognitionData.yes_no_maybe_items[activeYnmIdx].explanation}</p>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setActivity1SubStep("1A")} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                {!ynmChecked ? (
                  <button onClick={handleCheckYnm} disabled={!selectedYnm} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">Check Answer</button>
                ) : activeYnmIdx < recognitionData.yes_no_maybe_items.length - 1 ? (
                  <button onClick={() => { setActiveYnmIdx(prev => prev + 1); setSelectedYnm(null); setYnmChecked(false); setYnmCorrect(null); }} className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">Next →</button>
                ) : (
                  <button onClick={() => setActivity1SubStep("1C")} className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Emotion Reading <ChevronRight className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          )}

          {/* Activity 1C – Emotion inference */}
          {activity1SubStep === "1C" && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">How does the speaker probably feel?</span>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-2">
                <div className="flex items-start gap-2">
                  <p className="font-korean text-zinc-200 text-sm leading-relaxed flex-1">{recognitionData.emotion_inference_items[activeEiIdx].snippet_ko}</p>
                  <button onClick={() => playAudio(recognitionData.emotion_inference_items[activeEiIdx].snippet_ko)} className="text-zinc-500 hover:text-brand-400 transition cursor-pointer shrink-0">
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 italic">{recognitionData.emotion_inference_items[activeEiIdx].snippet_en}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {recognitionData.emotion_inference_items[activeEiIdx].options.map((opt: string) => {
                  let cls = "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10";
                  if (eiChecked && opt === recognitionData.emotion_inference_items[activeEiIdx].correct) cls = "border-accent-teal bg-accent-teal/5 text-accent-teal";
                  else if (eiChecked && opt === selectedEmotion) cls = "border-accent-pink bg-accent-pink/5 text-accent-pink";
                  else if (selectedEmotion === opt) cls = "border-brand-500 bg-brand-500/10 text-white";
                  return (
                    <button key={opt} onClick={() => !eiChecked && setSelectedEmotion(opt)} disabled={eiChecked} className={`p-3 rounded-xl border text-xs font-bold transition text-center ${cls}`}>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {eiChecked && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${eiCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                  <p className="font-black">{eiCorrect ? "✓ Correct emotional reading!" : "✗ Good try — here's what signals the emotion:"}</p>
                  <p className="text-zinc-400 leading-relaxed">{recognitionData.emotion_inference_items[activeEiIdx].explanation}</p>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setActivity1SubStep("1B")} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                {!eiChecked ? (
                  <button onClick={handleCheckEmotion} disabled={!selectedEmotion} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">Check Emotion</button>
                ) : activeEiIdx < recognitionData.emotion_inference_items.length - 1 ? (
                  <button onClick={() => { setActiveEiIdx(prev => prev + 1); setSelectedEmotion(null); setEiChecked(false); setEiCorrect(null); }} className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">Next →</button>
                ) : (
                  <button onClick={() => setStep(4)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Activity 2 <ChevronRight className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── SCREEN 4: Activity 2 – Responding & Softening ─── */}
      {step === 4 && responseTemplates && softenTemplates && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-brand-400" />
              <span>
                {activity2SubStep === "2A" && "2A: How Would You Respond?"}
                {activity2SubStep === "2B" && "2B: Make It Indirect"}
                {activity2SubStep === "2C" && "2C: Live Implicit Chat"}
              </span>
            </h2>
            <div className="flex gap-1">
              {["2A", "2B", "2C"].map(sub => (
                <button key={sub} onClick={() => setActivity2SubStep(sub as any)} className={`px-2 py-0.5 rounded text-[10px] font-bold ${activity2SubStep === sub ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}>{sub}</button>
              ))}
            </div>
          </div>

          {/* 2A – Response builder */}
          {activity2SubStep === "2A" && responseTemplates.response_templates[activeRtIdx] && (
            <div className="space-y-4 text-left animate-fade-in">
              {(() => {
                const template = responseTemplates.response_templates[activeRtIdx];
                return (
                  <>
                    <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-[10px] text-zinc-400">
                      📋 Scenario: <span className="text-zinc-200">{template.scenario}</span>
                    </div>

                    <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-2">
                      <span className="text-[8px] uppercase font-mono text-zinc-500 font-bold">What they said:</span>
                      <div className="flex items-start gap-2">
                        <p className="font-korean text-zinc-200 text-sm leading-relaxed flex-1">{template.implicit_line_ko}</p>
                        <button onClick={() => playAudio(template.implicit_line_ko)} className="text-zinc-500 hover:text-brand-400 transition cursor-pointer shrink-0">
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 italic">{template.implicit_line_en}</p>
                    </div>

                    {rtStep === "pick_meaning" && (
                      <>
                        <p className="text-xs font-bold text-white">Step 1: What do they really mean?</p>
                        <div className="space-y-2">
                          {["They want to change venues / prefer somewhere else.", template.real_meaning, "They're just making small talk."].map((opt, idx) => (
                            <button key={idx} onClick={() => setSelectedRealMeaning(opt)} className={`w-full p-3 rounded-xl border text-xs font-medium text-left transition ${selectedRealMeaning === opt ? "border-brand-500 bg-brand-500/10 text-white" : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"}`}>
                              {opt}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-end">
                          <button onClick={() => selectedRealMeaning && setRtStep("write_response")} disabled={!selectedRealMeaning} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">
                            Next: Write Response →
                          </button>
                        </div>
                      </>
                    )}

                    {rtStep === "write_response" && (
                      <>
                        <p className="text-xs font-bold text-white">Step 2: Write a natural Korean response that shows you understood the hint:</p>
                        <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 space-y-1">
                          <p className="text-[9px] text-zinc-500 uppercase font-mono">💡 Key Skill:</p>
                          <p className="text-[10px] text-zinc-400 leading-relaxed">{template.key_skill}</p>
                        </div>
                        <textarea
                          value={userResponse}
                          onChange={e => setUserResponse(e.target.value)}
                          rows={3}
                          disabled={!!rtFeedback}
                          placeholder="Write your Korean response here..."
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-brand-500/50 resize-none font-korean"
                        />

                        {rtFeedback && (
                          <div className="p-4 bg-brand-500/5 border border-brand-500/15 rounded-xl space-y-2 text-xs animate-fade-in">
                            <p className="font-black text-white">✓ Feedback</p>
                            <p className="text-zinc-300 leading-relaxed">{rtFeedback.feedback_en}</p>
                            <div className="border-t border-white/5 pt-2 space-y-1">
                              <p className="text-[9px] text-zinc-500 uppercase font-mono">Model Response:</p>
                              <p className="font-korean text-accent-teal font-bold text-sm">{template.model_response_ko}</p>
                              <p className="text-zinc-400 italic text-[10px]">{template.model_response_en}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          {!rtFeedback ? (
                            <button onClick={handleSubmitResponse} disabled={!userResponse.trim() || submittingRt} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                              {submittingRt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Submit Response
                            </button>
                          ) : activeRtIdx < responseTemplates.response_templates.length - 1 ? (
                            <button onClick={() => { setActiveRtIdx(prev => prev + 1); setRtStep("pick_meaning"); setSelectedRealMeaning(null); setUserResponse(""); setRtFeedback(null); }} className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">Next Scenario →</button>
                          ) : (
                            <button onClick={() => setActivity2SubStep("2B")} className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Make It Indirect <ChevronRight className="w-4 h-4" /></button>
                          )}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* 2B – Soften rewrite */}
          {activity2SubStep === "2B" && softenTemplates.soften_templates[activeSoftenIdx] && (
            <div className="space-y-4 text-left animate-fade-in">
              {(() => {
                const template = softenTemplates.soften_templates[activeSoftenIdx];
                return (
                  <>
                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Choose the best indirect, polite version:</span>

                    <div className="p-4 bg-accent-pink/5 border border-accent-pink/15 rounded-2xl space-y-2">
                      <span className="text-[8px] uppercase font-mono text-accent-pink font-bold">Too Direct / Blunt:</span>
                      <p className="font-korean text-zinc-200 text-sm">{template.direct_ko}</p>
                      <p className="text-[10px] text-zinc-500 italic">{template.direct_en}</p>
                    </div>

                    <p className="text-xs font-bold text-white">Select the more indirect, face-saving version:</p>
                    <div className="space-y-2">
                      {template.indirect_options.map((opt: any, idx: number) => {
                        let cls = "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10";
                        if (softenFeedback) cls = "border-accent-teal bg-accent-teal/5 text-accent-teal";
                        else if (selectedSoftenOpt === idx) cls = "border-brand-500 bg-brand-500/10 text-white";
                        return (
                          <button key={idx} onClick={() => !softenFeedback && setSelectedSoftenOpt(idx)} disabled={!!softenFeedback} className={`w-full p-4 rounded-2xl border text-left flex flex-col gap-1.5 transition ${cls}`}>
                            <span className="text-[8px] uppercase font-mono font-black text-zinc-500">{opt.label}</span>
                            <p className="font-korean text-sm">{opt.ko}</p>
                            <p className="text-[10px] italic text-zinc-400">{opt.en}</p>
                          </button>
                        );
                      })}
                    </div>

                    {softenFeedback && (
                      <div className="p-4 bg-accent-teal/5 border border-accent-teal/20 rounded-xl text-xs space-y-1 animate-fade-in">
                        <p className="font-black text-accent-teal">✓ Good choice!</p>
                        <p className="text-zinc-400 leading-relaxed">{softenFeedback.feedback_en}</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      {!softenFeedback ? (
                        <button onClick={handleSubmitSoften} disabled={selectedSoftenOpt === null || submittingSoften} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                          {submittingSoften ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Submit
                        </button>
                      ) : activeSoftenIdx < softenTemplates.soften_templates.length - 1 ? (
                        <button onClick={() => { setActiveSoftenIdx(prev => prev + 1); setSelectedSoftenOpt(null); setSoftenFeedback(null); }} className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">Next →</button>
                      ) : (
                        <button onClick={() => setActivity2SubStep("2C")} className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Live Chat <ChevronRight className="w-4 h-4" /></button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* 2C – AI Implicit Chat */}
          {activity2SubStep === "2C" && (
            <div className="space-y-4 text-left animate-fade-in">
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
                <p className="text-xs font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-400" /> Live Reading Between the Lines</p>
                <p className="text-[10px] text-zinc-400 leading-relaxed">The AI coach will use indirect Korean speech. Your job: figure out the real meaning and respond appropriately!</p>
              </div>

              {/* Context selector */}
              {!chatStarted && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-white">Choose context:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["social", "academic", "work"] as const).map(ctx => (
                      <button key={ctx} onClick={() => setChatContext(ctx)} className={`p-3 rounded-xl border text-xs font-bold capitalize transition ${chatContext === ctx ? "border-brand-500 bg-brand-500/10 text-white" : "border-white/5 bg-zinc-900 text-zinc-400"}`}>
                        {ctx === "social" ? "👥 Social" : ctx === "academic" ? "📚 Academic" : "💼 Work"}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleStartChat} className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
                    <Eye className="w-4 h-4" /> Start Reading Between the Lines
                  </button>
                </div>
              )}

              {chatStarted && (
                <>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {aiMessages.map((msg, idx) => (
                      <div key={idx} className={`p-3 rounded-xl text-xs leading-relaxed ${msg.sender === "assistant" ? "bg-brand-500/10 border border-brand-500/15 text-zinc-200" : "bg-zinc-900 border border-white/5 text-zinc-300 ml-4"}`}>
                        <span className="text-[8px] uppercase font-mono text-zinc-500 block mb-1">{msg.sender === "assistant" ? "AI Coach" : "You"}</span>
                        {msg.text}
                      </div>
                    ))}
                    {aiSending && <div className="flex items-center gap-2 text-zinc-500 text-xs pl-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...</div>}
                  </div>

                  {!aiFinished && (
                    <div className="flex gap-2">
                      <input value={aiText} onChange={e => setAiText(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendAiTurn()} placeholder="What do they really mean? How do you respond?" className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-brand-500/50 font-korean" disabled={aiSending} />
                      <button onClick={handleSendAiTurn} disabled={!aiText.trim() || aiSending} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white p-2 rounded-xl transition cursor-pointer"><ArrowRight className="w-4 h-4" /></button>
                    </div>
                  )}

                  {!aiFinished && aiMessages.length >= 3 && (
                    <button onClick={handleFinishChat} disabled={finishingChat} className="w-full text-xs text-zinc-400 hover:text-white underline cursor-pointer flex items-center justify-center gap-1.5">
                      {finishingChat ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Finish Session
                    </button>
                  )}

                  {aiFinished && aiReport && (
                    <div className="p-4 bg-brand-500/5 border border-brand-500/15 rounded-xl text-xs space-y-2 animate-fade-in">
                      <p className="font-black text-white">📊 Implicit Understanding Report</p>
                      <div className="space-y-1">
                        {aiReport.successes?.map((s: string, i: number) => <p key={i} className="text-accent-teal">✓ {s}</p>)}
                        {aiReport.missed_hints?.map((m: string, i: number) => <p key={i} className="text-yellow-400">⚠ {m}</p>)}
                        {aiReport.suggestions?.map((s: string, i: number) => <p key={i} className="text-zinc-400">💡 {s}</p>)}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(3)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Proceed to Quiz <ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── SCREEN 5: Mini-Quiz ─── */}
      {step === 5 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-brand-400" />
              <span>Mini-Quiz – Implicit Meaning</span>
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
              <div className="flex items-center gap-2">
                <span className={`text-[8px] uppercase font-mono font-black px-2 py-0.5 rounded-full ${
                  quizBlueprint[quizIdx].type === "implicit_meaning" ? "bg-brand-500/15 text-brand-400" :
                  quizBlueprint[quizIdx].type === "speech_act_function" ? "bg-yellow-500/15 text-yellow-400" :
                  quizBlueprint[quizIdx].type === "yes_no_maybe" ? "bg-accent-teal/15 text-accent-teal" :
                  quizBlueprint[quizIdx].type === "emotion_inference" ? "bg-accent-pink/15 text-accent-pink" :
                  "bg-zinc-700 text-zinc-400"
                }`}>{quizBlueprint[quizIdx].type.replace(/_/g, " ")}</span>
              </div>

              <p className="text-sm font-semibold text-zinc-200 leading-relaxed">{quizBlueprint[quizIdx].question}</p>

              <div className="space-y-2">
                {quizBlueprint[quizIdx].options?.map((opt: string) => {
                  let cls = "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10";
                  if (quizChecked) {
                    if (opt === quizBlueprint[quizIdx].correct_answer) cls = "border-accent-teal bg-accent-teal/5 text-accent-teal";
                    else if (opt === quizSelectedOpt) cls = "border-accent-pink bg-accent-pink/5 text-accent-pink";
                  } else if (quizSelectedOpt === opt) cls = "border-brand-500 bg-brand-500/10 text-white";
                  return (
                    <button key={opt} onClick={() => !quizChecked && setQuizSelectedOpt(opt)} disabled={quizChecked} className={`w-full p-4 rounded-2xl border text-left text-xs font-medium transition ${cls}`}>
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
                  <button onClick={handleCheckQuiz} disabled={!quizSelectedOpt} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer">Check Answer</button>
                ) : (
                  <button onClick={handleNextQuizOrComplete} disabled={finishingQuiz} className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 disabled:opacity-50 px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                    {finishingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    {quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── SCREEN 6: Homework & AI Subtext Coaching ─── */}
      {step === 6 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">

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
              <Bookmark className="w-5 h-5 text-brand-400" />
              <span>Homework & Subtext Coaching</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of {totalSteps}</span>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">📚 Practice Assignments</span>
            {homeworkItems.map((item: any) => (
              <div key={item.id} onClick={() => handleToggleHomework(item.id, !!completedHomework[item.id])} className={`flex items-start gap-3 p-4 rounded-2xl border transition cursor-pointer ${completedHomework[item.id] ? "border-accent-teal/30 bg-accent-teal/5" : "border-white/5 bg-zinc-900/60"}`}>
                <CheckSquare className={`w-4 h-4 mt-0.5 shrink-0 ${completedHomework[item.id] ? "text-accent-teal" : "text-zinc-600"}`} />
                <p className="text-xs text-zinc-300 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          {/* AI Subtext Coaching */}
          <div className="border-t border-white/5 pt-4 space-y-3">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">🤖 AI Subtext Coaching Session</span>
            {!coachSessionId ? (
              <button onClick={handleStartCoaching} className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-white py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
                <Eye className="w-4 h-4 text-brand-400" /> Start Subtext & Implicit Meaning Coaching
              </button>
            ) : (
              <>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {coachMessages.map((msg, idx) => (
                    <div key={idx} className={`p-3 rounded-xl text-xs leading-relaxed ${msg.sender === "assistant" ? "bg-brand-500/10 border border-brand-500/15 text-zinc-200" : "bg-zinc-900 border border-white/5 text-zinc-300 ml-4"}`}>
                      <span className="text-[8px] uppercase font-mono text-zinc-500 block mb-1">{msg.sender === "assistant" ? "Tutor" : "You"}</span>
                      {msg.text}
                    </div>
                  ))}
                  {coachSending && <div className="flex items-center gap-2 text-zinc-500 text-xs pl-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...</div>}
                </div>

                {!coachFinished && (
                  <div className="flex gap-2">
                    <input value={coachText} onChange={e => setCoachText(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendCoachTurn()} placeholder="Give your interpretation and response..." className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-brand-500/50 font-korean" disabled={coachSending} />
                    <button onClick={handleSendCoachTurn} disabled={!coachText.trim() || coachSending} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white p-2 rounded-xl transition cursor-pointer"><ArrowRight className="w-4 h-4" /></button>
                  </div>
                )}

                {!coachFinished && coachMessages.length >= 3 && (
                  <button onClick={handleFinishCoaching} className="w-full text-xs text-zinc-400 hover:text-white underline cursor-pointer">Finish Coaching Session</button>
                )}

                {coachFinished && coachFeedback && (
                  <div className="p-3 bg-accent-teal/5 border border-accent-teal/20 rounded-xl text-xs text-accent-teal animate-fade-in">
                    <p className="font-black mb-1">✓ Coaching Complete!</p>
                    <p className="text-zinc-400 leading-relaxed">{coachFeedback}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Next phase suggestion */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-3 text-xs text-zinc-400 space-y-1">
            <p className="font-bold text-white text-[11px]">🚀 Up Next:</p>
            <p>Phase 6 – C1 Advanced Communication Capstone (combining all skills)</p>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <button onClick={() => setStep(5)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={onComplete} className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-brand-500/20">
              <CheckCircle2 className="w-4 h-4" /> Complete Phase 5
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
