"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft, ChevronRight, Volume2, Sparkles, BookOpen, Award,
  Loader2, CheckCircle2, Mic, MessageCircle, Eye, ArrowRight,
  CheckSquare, Bookmark, Brain, Trophy, Star, Target, Layers,
  Activity, BarChart2, Users, GraduationCap, Briefcase
} from "lucide-react";

let API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
if (API_BASE && !API_BASE.includes("/api/v1")) {
  API_BASE = API_BASE.replace(/\/$/, "") + "/api/v1";
}

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

interface Course6Phase6CapstoneWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

const SCENARIO_TYPE_CONFIG: Record<string, { icon: any; color: string; badge: string; trackColor: string }> = {
  social: { icon: Users, color: "accent-teal", badge: "bg-accent-teal/15 text-accent-teal", trackColor: "from-accent-teal/30 to-accent-teal/5" },
  academic: { icon: GraduationCap, color: "brand-400", badge: "bg-brand-500/15 text-brand-400", trackColor: "from-brand-500/30 to-brand-500/5" },
  professional: { icon: Briefcase, color: "yellow-400", badge: "bg-yellow-500/15 text-yellow-400", trackColor: "from-yellow-500/30 to-yellow-500/5" }
};

const SKILL_ICON_MAP: Record<string, any> = {
  idioms: Sparkles, stance: BarChart2, register: Layers, subtext: Eye, fluency: Activity
};

export default function Course6Phase6CapstoneWizard({
  activeLesson, speakWord, onComplete
}: Course6Phase6CapstoneWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 6;

  // Data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [capstoneScenarios, setCapstoneScenarios] = useState<any[]>([]);

  // Screen 2 – accordion
  const [expandedScenario, setExpandedScenario] = useState<string | null>("scenario_a");

  // Screen 3 – Activity 1 sub-steps
  const [activity1SubStep, setActivity1SubStep] = useState<"1A" | "1B">("1A");
  const [selectedPreviewType, setSelectedPreviewType] = useState<"social" | "academic" | "professional">("social");
  const [previewSnapshotIdx, setPreviewSnapshotIdx] = useState(0);
  const [challengeSelected, setChallengeSelected] = useState<number | null>(null);
  const [challengeChecked, setChallengeChecked] = useState(false);
  const [challengeCorrect, setChallengeCorrect] = useState<boolean | null>(null);

  // Strategy planner
  const [strategyScenario, setStrategyScenario] = useState<"social" | "academic" | "professional">("social");
  const [selectedIdioms, setSelectedIdioms] = useState<string[]>([]);
  const [strategyStance, setStrategyStance] = useState("");
  const [strategyRegister, setStrategyRegister] = useState("");
  const [strategyListening, setStrategyListening] = useState("");
  const [strategySaved, setStrategySaved] = useState(false);
  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [savingStrategy, setSavingStrategy] = useState(false);
  const [suggestedPhrases, setSuggestedPhrases] = useState<string[]>([]);

  // Screen 4 – Capstone scenario runner
  const [selectedCapstoneId, setSelectedCapstoneId] = useState<string | null>(null);
  const [capstoneSession, setCapstoneSession] = useState<any>(null);
  const [capstoneStarting, setCapstoneStarting] = useState(false);
  const [capstoneStage, setCapstoneStage] = useState<"input" | "dialog" | "writing" | "speaking" | "report">("input");
  const [comprehensionAnswer, setComprehensionAnswer] = useState<number | null>(null);
  const [comprehensionChecked, setComprehensionChecked] = useState(false);
  const [comprehensionCorrect, setComprehensionCorrect] = useState<boolean | null>(null);
  const [capstoneMessages, setCapstoneMessages] = useState<any[]>([]);
  const [capstoneInput, setCapstoneInput] = useState("");
  const [capstoneSending, setCapstoneSending] = useState(false);
  const [capstoneWriting, setCapstoneWriting] = useState("");
  const [capstoneWritingFeedback, setCapstoneWritingFeedback] = useState<any>(null);
  const [submittingWriting, setSubmittingWriting] = useState(false);
  const [capstoneSpeaking, setCapstoneSpeaking] = useState("");
  const [capstoneSpeakingFeedback, setCapstoneSpeakingFeedback] = useState<any>(null);
  const [submittingSpeaking, setSubmittingSpeaking] = useState(false);
  const [capstoneReport, setCapstoneReport] = useState<any>(null);
  const [finishingCapstone, setFinishingCapstone] = useState(false);

  // Screen 5 – Quiz
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);
  const [quizBadge, setQuizBadge] = useState<string | null>(null);

  // Screen 6 – Homework & Exit Interview
  const [homeworkData, setHomeworkData] = useState<any>(null);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});
  const [selfRatings, setSelfRatings] = useState<Record<string, number>>({});
  const [exitSessionId, setExitSessionId] = useState<string | null>(null);
  const [exitMessages, setExitMessages] = useState<any[]>([]);
  const [exitText, setExitText] = useState("");
  const [exitSending, setExitSending] = useState(false);
  const [exitFinished, setExitFinished] = useState(false);
  const [exitProfile, setExitProfile] = useState<any>(null);
  const [exitFarewell, setExitFarewell] = useState<string | null>(null);

  const playAudio = (text: string) => speakWord(text);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean5/6/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean5/6/core-data");
          setCoreData(res);
        } else if (step === 3 && !previewData) {
          const res = await apiJson("/practice/c1-capstone/preview-scenarios");
          setPreviewData(res);
        } else if (step === 4 && capstoneScenarios.length === 0) {
          const res = await apiJson("/practice/c1-capstone/scenarios");
          setCapstoneScenarios(res.capstone_scenarios || []);
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean5/phase-6/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && !homeworkData) {
          const res = await apiJson("/phases/korean5/6/homework");
          setHomeworkData(res);
        }
      } catch (err) {
        console.error("Error loading Phase 6 data:", err);
      }
    };
    load();
  }, [step]);

  // Get selected preview scenario
  const selectedPreviewScenario = previewData?.preview_scenarios?.find((s: any) => s.type === selectedPreviewType);
  const currentSnapshot = selectedPreviewScenario?.snapshots?.[previewSnapshotIdx];

  // Save strategy
  const handleSaveStrategy = async () => {
    if (!strategyStance) return;
    setSavingStrategy(true);
    try {
      const res = await apiJson("/practice/c1-capstone/strategy/save", {
        method: "POST",
        body: JSON.stringify({
          scenario_id: strategyScenario,
          idioms: selectedIdioms,
          stance: strategyStance,
          register_focus: strategyRegister,
          listening_for: strategyListening
        })
      });
      setStrategyId(res.strategy_id);
      setSuggestedPhrases(res.suggested_phrases || []);
      setStrategySaved(true);
    } catch (err) {
      setSuggestedPhrases(["솔직히 말씀드리면", "최선을 다해 보겠습니다", "충분히 이해합니다"]);
      setStrategySaved(true);
    } finally {
      setSavingStrategy(false);
    }
  };

  // Start capstone
  const handleStartCapstone = async (scenarioId: string) => {
    setSelectedCapstoneId(scenarioId);
    setCapstoneStage("input");
    setCapstoneMessages([]);
    setCapstoneReport(null);
    setCapstoneStarting(true);
    try {
      const res = await apiJson("/conversation/c1/full-capstone/start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: scenarioId, strategy_id: strategyId || "" })
      });
      setCapstoneSession(res);
      setCapstoneMessages([{ sender: "system", text: res.opener, en: res.opener_en }]);
    } catch (err) { console.error(err); }
    finally { setCapstoneStarting(false); }
  };

  // Comprehension check
  const handleCheckComprehension = () => {
    if (!capstoneSession || comprehensionAnswer === null) return;
    const q = capstoneSession.comprehension_questions[0];
    const isCorrect = comprehensionAnswer === q.correct;
    setComprehensionChecked(true);
    setComprehensionCorrect(isCorrect);
  };

  // Capstone dialog turn
  const handleCapstoneTurn = async () => {
    if (!capstoneInput.trim()) return;
    const textToSend = capstoneInput;
    setCapstoneInput("");
    setCapstoneMessages(prev => [...prev, { sender: "user", text: textToSend }]);
    setCapstoneSending(true);
    try {
      const res = await apiJson("/conversation/c1/full-capstone/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend, stage: capstoneStage })
      });
      setCapstoneMessages(prev => [...prev, { sender: "assistant", text: res.reply_ko, en: res.reply_en }]);
      if (mode === "voice") playAudio(res.reply_ko);
    } catch (err) { console.error(err); }
    finally { setCapstoneSending(false); }
  };

  // Writing submit
  const handleSubmitWriting = async () => {
    if (!capstoneWriting.trim() || !selectedCapstoneId) return;
    setSubmittingWriting(true);
    try {
      const res = await apiJson("/conversation/c1/full-capstone/submit-writing", {
        method: "POST",
        body: JSON.stringify({ scenario_id: selectedCapstoneId, stage: "writing", text: capstoneWriting })
      });
      setCapstoneWritingFeedback(res);
    } catch (err) {
      setCapstoneWritingFeedback({ feedback_en: "Good writing!", feedback_ko: "잘 쓰셨어요!" });
    } finally { setSubmittingWriting(false); }
  };

  // Speaking submit
  const handleSubmitSpeaking = async () => {
    if (!capstoneSpeaking.trim() || !selectedCapstoneId) return;
    setSubmittingSpeaking(true);
    try {
      const res = await apiJson("/conversation/c1/full-capstone/submit-speaking", {
        method: "POST",
        body: JSON.stringify({ scenario_id: selectedCapstoneId, stage: "speaking", transcript: capstoneSpeaking })
      });
      setCapstoneSpeakingFeedback(res);
    } catch (err) {
      setCapstoneSpeakingFeedback({ feedback_en: "Good summary!", feedback_ko: "잘 하셨어요!" });
    } finally { setSubmittingSpeaking(false); }
  };

  // Finish capstone
  const handleFinishCapstone = async () => {
    setFinishingCapstone(true);
    try {
      const res = await apiJson("/conversation/c1/full-capstone/finish", { method: "POST" });
      setCapstoneReport(res.c1_capstone_report);
      setCapstoneStage("report");
    } catch (err) { console.error(err); }
    finally { setFinishingCapstone(false); }
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
      await apiJson("/quiz/korean5/phase-6/answer", {
        method: "POST",
        body: JSON.stringify({ question_id: current.id, answer: quizSelectedOpt, time_taken_ms: 2000 })
      });
    } catch (e) { console.error(e); }
  };

  const handleNextQuizOrFinish = async () => {
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
        const res = await apiJson("/quiz/korean5/phase-6/finish", {
          method: "POST",
          body: JSON.stringify({ score, mistakes: quizMistakes })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "C1 Real-World Communicator");
        setStep(6);
      } catch (err) { console.error(err); }
      finally { setFinishingQuiz(false); }
    }
  };

  // Homework
  const handleToggleHomework = async (id: string, current: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !current }));
    try {
      await apiJson("/phases/korean5/6/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !current })
      });
    } catch (err) { console.error(err); }
  };

  // Exit interview
  const handleStartExitInterview = async () => {
    setExitMessages([]);
    setExitFinished(false);
    setExitProfile(null);
    try {
      const res = await apiJson("/conversation/c1/exit-interview/start", { method: "POST" });
      setExitSessionId(res.session_id);
      setExitMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") playAudio(res.opener);
    } catch (err) { console.error(err); }
  };

  const handleSendExitTurn = async () => {
    if (!exitText.trim() || !exitSessionId) return;
    const textToSend = exitText;
    setExitText("");
    setExitMessages(prev => [...prev, { sender: "user", text: textToSend }]);
    setExitSending(true);
    try {
      const res = await apiJson("/conversation/c1/exit-interview/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setExitMessages(prev => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") playAudio(res.reply_ko);
    } catch (err) { console.error(err); }
    finally { setExitSending(false); }
  };

  const handleFinishExitInterview = async () => {
    if (!exitSessionId) return;
    try {
      const res = await apiJson("/conversation/c1/exit-interview/finish", { method: "POST" });
      setExitProfile(res.c1_profile_snapshot);
      setExitFarewell(res.farewell);
      setExitFinished(true);
    } catch (err) { console.error(err); }
  };

    const outlineSteps = [
    { num: 1, label: "Screen 1 – Welcome / Phase Overview" },
    { num: 2, label: "Screen 2 – Concept: Scenario-Based C1 Tasks" },
    { num: 3, label: "Screen 3 – Activity 1: Scenario Preview + Strategy Planner" },
    { num: 4, label: "Screen 4 – Activity 2: Live C1 Capstone (4 stages: Input → Dialog → Writing → Speaking)" },
    { num: 5, label: "Screen 5 – Mini-Quiz: Strategy & C1 Awareness (5 questions)" },
    { num: 6, label: "Screen 6 – Homework, C1 Portfolio, Exit Interview & Course Completion" }
  ];

  return (
    <div className="flex-grow flex flex-col justify-between">

      {/* Header */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight">
              {activeLesson?.title || "Korean 5.6 – C1 Capstone"}
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Real-World C1 Communication</p>
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
      {showOutline && (
        <div className="mb-6 p-5 bg-zinc-950/80 rounded-3xl border border-white/5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 font-mono">Curriculum Syllabus Map</span>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {outlineSteps.map(s => (
              <button
                key={s.num}
                onClick={() => {
                  setStep(s.num);
                  setShowOutline(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition ${step === s.num
                    ? "border-brand-500 bg-brand-500/10 text-white"
                    : "border-white/5 bg-zinc-900/40 text-zinc-400 hover:border-white/10 hover:text-white"
                  }`}
              >
                <div className="text-[9px] font-black font-mono text-zinc-500">STEP {s.num}</div>
                <div className="text-xs font-bold truncate">{s.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── SCREEN 1: Welcome ─── */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="relative mx-auto w-fit">
            <div className="p-4 bg-yellow-500/10 rounded-full border border-yellow-500/25 text-yellow-400">
              <Trophy className="w-10 h-10" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-brand-500 rounded-full border-2 border-zinc-950">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          </div>

          <div>
            <h2 className="text-5xl font-black text-white tracking-tight">Korean 5.6</h2>
            <h3 className="text-xl font-bold text-yellow-400 mt-1">C1 Real-World Communication (Capstone)</h3>
          </div>

          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Handle complex situations in Korean with nuance and confidence."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Capstone Goals:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Navigate multi-step real-life scenarios in Korean (social, academic, professional)",
                "Use idioms, nuanced stance, and appropriate register in integrated tasks",
                "Show you can understand implicit meaning and respond naturally at C1 level"
              ]).map((g: string, i: number) => <li key={i}>{g}</li>)}
            </ul>
          </div>

          {/* Skill chips */}
          <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl mx-auto">
            {["Scenario-based", "Integrated Skills", "Subtext & Nuance", "Social / Academic / Professional"].map(chip => (
              <span key={chip} className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[10px] text-yellow-300 font-bold">{chip}</span>
            ))}
          </div>

          {/* C1 Skills Checklist */}
          <div className="grid grid-cols-2 gap-2 max-w-md mx-auto w-full">
            {(metadata?.skills_targeted || [
              { id: "idioms", label: "Idioms & Expressions" },
              { id: "stance", label: "Nuanced Stance" },
              { id: "register", label: "Register & Style" },
              { id: "subtext", label: "Subtext & Inference" },
              { id: "fluency", label: "Coherence & Fluency" }
            ]).map((skill: any) => {
              const IconComp = SKILL_ICON_MAP[skill.id] || Sparkles;
              return (
                <div key={skill.id} className="flex items-center gap-2 p-2 bg-zinc-900/60 rounded-xl border border-white/5">
                  <IconComp className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span className="text-[10px] text-zinc-300">{skill.label}</span>
                </div>
              );
            })}
          </div>

          {/* Mode & Time */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full space-y-3 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">⏱️ Estimated Time</span>
              <span className="text-xs font-bold text-zinc-300">{metadata?.estimated_time || "45–60 minutes"}</span>
            </div>
            <div className="border-t border-white/[0.03] pt-3 space-y-2">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Interaction Mode</span>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setMode("text")} className={`p-2.5 rounded-xl border text-xs font-bold transition ${mode === "text" ? "border-yellow-500 bg-yellow-500/10 text-white" : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"}`}>Text</button>
                <button onClick={() => setMode("voice")} className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${mode === "voice" ? "border-yellow-500 bg-yellow-500/10 text-white" : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"}`}>
                  <Mic className="w-3.5 h-3.5" /> Voice + Text
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button onClick={() => setStep(2)} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/20">
              <Trophy className="w-4 h-4" /> Start C1 Capstone
            </button>
            
          </div>

          
        </div>
      )}

      {/* ─── SCREEN 2: Concept Explanation ─── */}
      {step === 2 && coreData && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-5 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-yellow-400" />
              <span>Scenario-Based C1 Tasks</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          {/* C1 Quote card */}
          <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-2xl p-4 space-y-2">
            <p className="text-[9px] text-yellow-400 font-mono uppercase font-black">C1 Real-World Communicative Goal</p>
            <p className="text-xs text-zinc-300 italic leading-relaxed font-serif">
              "At C1, you can use language flexibly and effectively for social, academic and professional purposes and understand implicit meaning in demanding situations."
            </p>
            <div className="border-t border-white/[0.03] pt-2 space-y-1 text-[10px] text-zinc-400">
              <p className="font-bold text-white text-[11px]">Multiple skills at once:</p>
              <p>Listening · Speaking · Reading · Writing · Inference · Stance — all in one scenario.</p>
            </div>
          </div>

          {/* Skills targeted */}
          <div className="space-y-2">
            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Skills This Capstone Checks</span>
            <div className="grid grid-cols-1 gap-2">
              {[
                { q: "Understand and respond to complex, indirect messages?", skill: "subtext" },
                { q: "Adapt style to social vs academic vs professional interlocutors?", skill: "register" },
                { q: "Use idioms, nuanced stance, and connectors naturally?", skill: "idioms" },
                { q: "Manage a problem and describe it clearly afterward?", skill: "fluency" }
              ].map((item, i) => {
                const IconComp = SKILL_ICON_MAP[item.skill] || Sparkles;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-white/5">
                    <div className="p-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/15 shrink-0">
                      <IconComp className="w-3.5 h-3.5 text-yellow-400" />
                    </div>
                    <p className="text-xs text-zinc-300">Can you <span className="font-bold text-white">{item.q}</span></p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scenario preview cards */}
          <div className="space-y-2">
            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Three Scenario Tracks</span>
            <div className="grid grid-cols-3 gap-2">
              {(coreData.preview_scenarios || []).map((sc: any) => {
                const cfg = SCENARIO_TYPE_CONFIG[sc.type] || SCENARIO_TYPE_CONFIG.social;
                const IconComp = cfg.icon;
                return (
                  <div key={sc.id} onClick={() => setExpandedScenario(expandedScenario === sc.id ? null : sc.id)} className={`p-3 rounded-xl border cursor-pointer transition ${expandedScenario === sc.id ? `border-${cfg.color}/40 bg-${cfg.color}/5` : "border-white/5 bg-zinc-900/60 hover:border-white/10"}`}>
                    <IconComp className={`w-5 h-5 text-${cfg.color} mb-2`} />
                    <p className="text-[10px] font-bold text-white leading-tight">{sc.label.replace("Scenario ", "")}</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5">{sc.subtitle}</p>
                  </div>
                );
              })}
            </div>
            {expandedScenario && (() => {
              const sc = coreData.preview_scenarios?.find((s: any) => s.id === expandedScenario);
              if (!sc) return null;
              return (
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs space-y-2 animate-fade-in">
                  <p className="text-zinc-300 leading-relaxed">{sc.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {sc.skills.map((s: string) => (
                      <span key={s} className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-white/5 capitalize">{s}</span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* ─── SCREEN 3: Activity 1 – Scenario Preview & Strategy ─── */}
      {step === 3 && previewData && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-5 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-yellow-400" />
              <span>{activity1SubStep === "1A" ? "1A: Preview a C1 Scenario" : "1B: Strategy Planner"}</span>
            </h2>
            <div className="flex gap-1">
              {["1A", "1B"].map(sub => (
                <button key={sub} onClick={() => setActivity1SubStep(sub as any)} className={`px-3 py-0.5 rounded text-[10px] font-bold ${activity1SubStep === sub ? "bg-yellow-500 text-zinc-950" : "bg-zinc-900 text-zinc-400"}`}>{sub}</button>
              ))}
            </div>
          </div>

          {/* 1A – Scenario preview */}
          {activity1SubStep === "1A" && (
            <div className="space-y-4 text-left animate-fade-in">
              {/* Scenario type picker */}
              <div className="grid grid-cols-3 gap-2">
                {(["social", "academic", "professional"] as const).map(type => {
                  const cfg = SCENARIO_TYPE_CONFIG[type];
                  const IconComp = cfg.icon;
                  return (
                    <button key={type} onClick={() => { setSelectedPreviewType(type); setPreviewSnapshotIdx(0); setChallengeSelected(null); setChallengeChecked(false); setChallengeCorrect(null); }} className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${selectedPreviewType === type ? `border-${cfg.color}/40 bg-${cfg.color}/5 text-white` : "border-white/5 bg-zinc-900/60 text-zinc-400"}`}>
                      <IconComp className={`w-4 h-4 text-${cfg.color}`} />
                      <span className="capitalize">{type}</span>
                    </button>
                  );
                })}
              </div>

              {selectedPreviewScenario && currentSnapshot && (
                <>
                  {/* Stage indicator */}
                  <div className="flex gap-1.5">
                    {selectedPreviewScenario.snapshots.map((_: any, i: number) => (
                      <div key={i} className={`flex-1 h-1 rounded-full transition ${i <= previewSnapshotIdx ? `bg-${SCENARIO_TYPE_CONFIG[selectedPreviewType].color}` : "bg-zinc-800"}`} />
                    ))}
                  </div>

                  <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-[8px] uppercase font-mono font-black px-2 py-0.5 rounded-full ${SCENARIO_TYPE_CONFIG[selectedPreviewType].badge}`}>
                        {currentSnapshot.label}
                      </span>
                      <button onClick={() => playAudio(currentSnapshot.ko)} className="flex items-center gap-1 text-[9px] text-zinc-400 hover:text-white border border-white/5 px-2 py-0.5 rounded cursor-pointer">
                        <Volume2 className="w-3 h-3" /> Listen
                      </button>
                    </div>
                    <p className="font-korean text-zinc-200 text-sm leading-relaxed">{currentSnapshot.ko}</p>
                    <p className="text-[10px] text-zinc-500 italic">{currentSnapshot.en}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-white">{currentSnapshot.challenge_question}</p>
                    {currentSnapshot.challenge_options.map((opt: string, idx: number) => {
                      let cls = "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10";
                      if (challengeChecked) {
                        if (idx === currentSnapshot.challenge_correct) cls = "border-accent-teal bg-accent-teal/5 text-accent-teal";
                        else if (idx === challengeSelected) cls = "border-accent-pink bg-accent-pink/5 text-accent-pink";
                      } else if (challengeSelected === idx) cls = "border-yellow-500 bg-yellow-500/10 text-white";
                      return (
                        <button key={idx} onClick={() => !challengeChecked && setChallengeSelected(idx)} disabled={challengeChecked} className={`w-full p-3 rounded-xl border text-xs font-medium text-left transition ${cls}`}>
                          {String.fromCharCode(65 + idx)}. {opt}
                        </button>
                      );
                    })}
                  </div>

                  {challengeChecked && (
                    <div className={`p-3 rounded-xl border text-xs ${challengeCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                      {challengeCorrect ? "✓ Correct — good C1 situational awareness!" : "✗ Think about the communicative context and what matters most at C1 level."}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    {!challengeChecked ? (
                      <button onClick={() => challengeSelected !== null && setChallengeChecked(true) && setChallengeCorrect(challengeSelected === currentSnapshot.challenge_correct)} disabled={challengeSelected === null} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">Check Answer</button>
                    ) : previewSnapshotIdx < selectedPreviewScenario.snapshots.length - 1 ? (
                      <button onClick={() => { setPreviewSnapshotIdx(prev => prev + 1); setChallengeSelected(null); setChallengeChecked(false); setChallengeCorrect(null); }} className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">Next Snapshot →</button>
                    ) : (
                      <button onClick={() => setActivity1SubStep("1B")} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Strategy Planner <ChevronRight className="w-4 h-4" /></button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 1B – Strategy Planner */}
          {activity1SubStep === "1B" && (
            <div className="space-y-4 text-left animate-fade-in">
              <p className="text-xs text-zinc-400">Choose a scenario type and fill in your strategy before the live capstone:</p>

              <div className="grid grid-cols-3 gap-2">
                {(["social", "academic", "professional"] as const).map(type => (
                  <button key={type} onClick={() => { setStrategyScenario(type); setSelectedIdioms([]); }} className={`p-2.5 rounded-xl border text-[10px] font-bold capitalize transition ${strategyScenario === type ? "border-yellow-500 bg-yellow-500/10 text-white" : "border-white/5 bg-zinc-900 text-zinc-400"}`}>{type}</button>
                ))}
              </div>

              {/* Idiom picker */}
              <div className="space-y-2">
                <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Pick useful idioms for your scenario:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(previewData.strategy_idiom_options?.[strategyScenario] || []).map((idiom: string) => (
                    <button key={idiom} onClick={() => setSelectedIdioms(prev => prev.includes(idiom) ? prev.filter(i => i !== idiom) : [...prev, idiom])} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${selectedIdioms.includes(idiom) ? "border-yellow-500 bg-yellow-500/10 text-yellow-300" : "border-white/5 bg-zinc-900 text-zinc-400"}`}>
                      {idiom}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Stance</label>
                  <select value={strategyStance} onChange={e => setStrategyStance(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/50">
                    <option value="">Choose…</option>
                    <option value="strong">Strong / Direct</option>
                    <option value="balanced">Balanced / Nuanced</option>
                    <option value="cautious">Cautious / Hedged</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Register Focus</label>
                  <select value={strategyRegister} onChange={e => setStrategyRegister(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/50">
                    <option value="">Choose…</option>
                    <option value="informal">Informal (반말)</option>
                    <option value="neutral">Neutral (존댓말)</option>
                    <option value="formal">Formal (격식체)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Listening out for (subtext / implicit meaning):</label>
                <input value={strategyListening} onChange={e => setStrategyListening(e.target.value)} placeholder="e.g. polite refusals, emotional hints, hidden complaints…" className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50" />
              </div>

              {strategySaved && suggestedPhrases.length > 0 && (
                <div className="p-3 bg-brand-500/5 border border-brand-500/15 rounded-xl text-xs space-y-1.5 animate-fade-in">
                  <p className="font-black text-white">✓ Strategy Saved! Suggested bonus phrases:</p>
                  {suggestedPhrases.map((p, i) => <p key={i} className="text-zinc-400">• {p}</p>)}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!strategySaved ? (
                  <button onClick={handleSaveStrategy} disabled={!strategyStance || savingStrategy} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                    {savingStrategy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save Strategy
                  </button>
                ) : (
                  <button onClick={() => setStep(4)} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                    Live Capstone <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── SCREEN 4: Live C1 Capstone ─── */}
      {step === 4 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-5 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span>Live C1 Scenario</span>
            </h2>
            {capstoneSession && (
              <div className="flex gap-1 text-[8px] font-mono font-black uppercase">
                {["Input", "Dialog", "Writing", "Speaking"].map((stage, i) => {
                  const stageKeys = ["input", "dialog", "writing", "speaking"];
                  const isActive = capstoneStage === stageKeys[i];
                  const isDone = ["input", "dialog", "writing", "speaking"].indexOf(capstoneStage) > i;
                  return (
                    <span key={stage} className={`px-1.5 py-0.5 rounded ${isActive ? "bg-yellow-500 text-zinc-950" : isDone ? "bg-accent-teal/20 text-accent-teal" : "bg-zinc-900 text-zinc-600"}`}>
                      {isDone ? "✓ " : ""}{stage}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scenario selector */}
          {!capstoneSession && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs text-zinc-400">Choose your capstone scenario:</p>
              {capstoneScenarios.map(sc => {
                const cfg = SCENARIO_TYPE_CONFIG[sc.type] || SCENARIO_TYPE_CONFIG.social;
                const IconComp = cfg.icon;
                return (
                  <button key={sc.id} onClick={() => handleStartCapstone(sc.id)} disabled={capstoneStarting} className={`w-full p-4 rounded-2xl border border-white/5 bg-gradient-to-br ${cfg.trackColor} hover:border-${cfg.color}/30 text-left flex items-start gap-3 transition group cursor-pointer`}>
                    <div className={`p-2 rounded-xl bg-${cfg.color}/10 border border-${cfg.color}/15 shrink-0 mt-0.5`}>
                      <IconComp className={`w-4 h-4 text-${cfg.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{sc.title}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">{sc.intro_en}</p>
                      <div className="flex gap-1 mt-2">
                        {sc.stages.map((stage: string) => (
                          <span key={stage} className="text-[8px] bg-zinc-900 border border-white/5 px-1.5 py-0.5 rounded text-zinc-500">{stage}</span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition shrink-0 mt-2" />
                  </button>
                );
              })}
            </div>
          )}

          {capstoneStarting && (
            <div className="flex items-center gap-2 text-zinc-400 text-sm justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin" /> Starting scenario…
            </div>
          )}

          {/* Stage: Input & Comprehension */}
          {capstoneSession && capstoneStage === "input" && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-2">
                <span className="text-[8px] uppercase font-mono text-zinc-500 font-bold">📩 Incoming Message:</span>
                <div className="flex items-start gap-2">
                  <p className="font-korean text-zinc-200 text-sm leading-relaxed flex-1">{capstoneSession.input_message_ko}</p>
                  <button onClick={() => playAudio(capstoneSession.input_message_ko)} className="text-zinc-500 hover:text-yellow-400 transition cursor-pointer shrink-0"><Volume2 className="w-4 h-4" /></button>
                </div>
                <p className="text-[10px] text-zinc-500 italic">{capstoneSession.input_message_en}</p>
              </div>

              {capstoneSession.comprehension_questions[0] && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-white">{capstoneSession.comprehension_questions[0].q}</p>
                  {capstoneSession.comprehension_questions[0].options.map((opt: string, idx: number) => {
                    let cls = "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10";
                    if (comprehensionChecked) {
                      if (idx === capstoneSession.comprehension_questions[0].correct) cls = "border-accent-teal bg-accent-teal/5 text-accent-teal";
                      else if (idx === comprehensionAnswer) cls = "border-accent-pink bg-accent-pink/5 text-accent-pink";
                    } else if (comprehensionAnswer === idx) cls = "border-yellow-500 bg-yellow-500/10 text-white";
                    return (
                      <button key={idx} onClick={() => !comprehensionChecked && setComprehensionAnswer(idx)} disabled={comprehensionChecked} className={`w-full p-3 rounded-xl border text-xs font-medium text-left transition ${cls}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!comprehensionChecked ? (
                  <button onClick={handleCheckComprehension} disabled={comprehensionAnswer === null} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">Check</button>
                ) : (
                  <button onClick={() => setCapstoneStage("dialog")} className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">Start Dialog →</button>
                )}
              </div>
            </div>
          )}

          {/* Stage: Dialog */}
          {capstoneSession && capstoneStage === "dialog" && (
            <div className="space-y-3 animate-fade-in">
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {capstoneMessages.map((msg, idx) => (
                  <div key={idx} className={`p-3 rounded-xl text-xs leading-relaxed ${msg.sender === "assistant" || msg.sender === "system" ? "bg-yellow-500/10 border border-yellow-500/15 text-zinc-200" : "bg-zinc-900 border border-white/5 text-zinc-300 ml-4"}`}>
                    <span className="text-[8px] uppercase font-mono text-zinc-500 block mb-1">{msg.sender === "user" ? "You" : "AI Interlocutor"}</span>
                    {msg.text}
                    {msg.en && <p className="text-[9px] text-zinc-500 italic mt-1">{msg.en}</p>}
                  </div>
                ))}
                {capstoneSending && <div className="flex items-center gap-2 text-zinc-500 text-xs pl-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…</div>}
              </div>

              <div className="flex gap-2">
                <input value={capstoneInput} onChange={e => setCapstoneInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleCapstoneTurn()} placeholder="Reply in Korean…" className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 font-korean" disabled={capstoneSending} />
                <button onClick={handleCapstoneTurn} disabled={!capstoneInput.trim() || capstoneSending} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 p-2 rounded-xl transition cursor-pointer"><ArrowRight className="w-4 h-4" /></button>
              </div>

              {capstoneMessages.length >= 3 && (
                <button onClick={() => setCapstoneStage("writing")} className="w-full text-xs text-zinc-400 hover:text-white underline cursor-pointer">Move to Writing Stage →</button>
              )}
            </div>
          )}

          {/* Stage: Writing */}
          {capstoneSession && capstoneStage === "writing" && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-[10px] text-zinc-400">
                📝 <span className="text-zinc-200 font-bold">Writing Task:</span> Write a short Korean message or summary (8–10 sentences) relating to this scenario. Use appropriate register and stance.
              </div>
              <textarea value={capstoneWriting} onChange={e => setCapstoneWriting(e.target.value)} rows={6} disabled={!!capstoneWritingFeedback} placeholder="Write your Korean message or summary here…" className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 resize-none font-korean" />

              {capstoneWritingFeedback && (
                <div className="p-4 bg-brand-500/5 border border-brand-500/15 rounded-xl text-xs space-y-2 animate-fade-in">
                  <p className="font-black text-white">✓ Writing Feedback</p>
                  <p className="text-zinc-300 leading-relaxed">{capstoneWritingFeedback.feedback_en}</p>
                  <p className="text-zinc-500 italic">{capstoneWritingFeedback.feedback_ko}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!capstoneWritingFeedback ? (
                  <button onClick={handleSubmitWriting} disabled={!capstoneWriting.trim() || submittingWriting} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                    {submittingWriting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Submit Writing
                  </button>
                ) : (
                  <button onClick={() => setCapstoneStage("speaking")} className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">Speaking Stage →</button>
                )}
              </div>
            </div>
          )}

          {/* Stage: Speaking */}
          {capstoneSession && capstoneStage === "speaking" && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-[10px] text-zinc-400">
                🎙️ <span className="text-zinc-200 font-bold">Speaking Task:</span> Give a 2–3 minute spoken summary (narrative + reflection + opinion). Type your transcript or record and paste it below.
              </div>
              <textarea value={capstoneSpeaking} onChange={e => setCapstoneSpeaking(e.target.value)} rows={5} disabled={!!capstoneSpeakingFeedback} placeholder="Type or paste your spoken summary transcript here…" className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 resize-none font-korean" />

              {capstoneSpeakingFeedback && (
                <div className="p-4 bg-brand-500/5 border border-brand-500/15 rounded-xl text-xs space-y-2 animate-fade-in">
                  <p className="font-black text-white">✓ Speaking Feedback</p>
                  <p className="text-zinc-300 leading-relaxed">{capstoneSpeakingFeedback.feedback_en}</p>
                  <p className="text-zinc-500 italic">{capstoneSpeakingFeedback.feedback_ko}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!capstoneSpeakingFeedback ? (
                  <button onClick={handleSubmitSpeaking} disabled={!capstoneSpeaking.trim() || submittingSpeaking} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                    {submittingSpeaking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Submit Speaking
                  </button>
                ) : (
                  <button onClick={handleFinishCapstone} disabled={finishingCapstone} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                    {finishingCapstone ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Get C1 Report →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stage: Report */}
          {capstoneSession && capstoneStage === "report" && capstoneReport && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-5 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <p className="font-black text-white text-sm">C1 Capstone Report</p>
                </div>
                <div className="space-y-2">
                  {Object.entries(capstoneReport).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-teal shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-zinc-300 capitalize">{key.replace(/_/g, " ")}: </span>
                        <span className="text-zinc-400">{String(value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setStep(5)} className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
                Proceed to Mini-Quiz <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {capstoneSession && capstoneStage !== "report" && (
            <div className="flex justify-between pt-2 border-t border-white/5">
              <button onClick={() => setStep(3)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
              <button onClick={() => setStep(5)} className="text-xs text-zinc-500 hover:text-white underline cursor-pointer">Skip to Quiz</button>
            </div>
          )}
        </div>
      )}

      {/* ─── SCREEN 5: Mini-Quiz ─── */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-yellow-400" />
              <span>Mini-Quiz – Scenario Strategy & C1 Awareness</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">
              {quizBlueprint.length > 0 ? `${quizIdx + 1}/${quizBlueprint.length}` : "Loading…"}
            </span>
          </div>

          {quizBlueprint.length === 0 ? (
            <div className="flex items-center gap-2 text-zinc-400 text-sm justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading quiz…
            </div>
          ) : (
            <div className="space-y-4 text-left animate-fade-in">
              <div className="flex items-center gap-2">
                <span className={`text-[8px] uppercase font-mono font-black px-2 py-0.5 rounded-full ${
                  quizBlueprint[quizIdx].type === "best_next_move" ? "bg-yellow-500/15 text-yellow-400" :
                  quizBlueprint[quizIdx].type === "nuanced_reply" ? "bg-brand-500/15 text-brand-400" :
                  quizBlueprint[quizIdx].type === "subtext_handling" ? "bg-accent-teal/15 text-accent-teal" :
                  quizBlueprint[quizIdx].type === "scenario_strategy" ? "bg-accent-pink/15 text-accent-pink" :
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
                  } else if (quizSelectedOpt === opt) cls = "border-yellow-500 bg-yellow-500/10 text-white";
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
                  <button onClick={handleCheckQuiz} disabled={!quizSelectedOpt} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer">Check Answer</button>
                ) : (
                  <button onClick={handleNextQuizOrFinish} disabled={finishingQuiz} className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 disabled:opacity-50 px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                    {finishingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    {quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── SCREEN 6: Homework, Portfolio & Exit Interview ─── */}
      {step === 6 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-5 flex-grow flex flex-col justify-center">

          {/* Badge award */}
          {quizBadge && (
            <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-2xl p-5 text-center space-y-2 animate-fade-in">
              <Trophy className="w-9 h-9 text-yellow-400 mx-auto" />
              <p className="text-white font-black">🎉 Course Completion Badge!</p>
              <p className="text-yellow-300 font-bold text-sm">{quizBadge}</p>
              {quizScore !== null && (
                <p className="text-zinc-400 text-xs">Quiz Score: <span className="text-white font-bold">{quizScore}%</span> · XP: <span className="text-yellow-400 font-bold">+200</span></p>
              )}
            </div>
          )}

          {/* Course completion card */}
          <div className="p-4 bg-gradient-to-br from-yellow-500/5 via-brand-500/5 to-accent-teal/5 border border-yellow-500/20 rounded-2xl text-center space-y-1">
            <p className="font-black text-white text-sm">🏆 Korean 5: Advanced Korean, Idioms & Nuance (C1)</p>
            <p className="text-zinc-400 text-xs">You've completed the entire Korean 5 course!</p>
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-yellow-400" />
              <span>Portfolio & Homework</span>
            </h2>
            <span className="text-xs text-zinc-500">Step 6 of {totalSteps}</span>
          </div>

          {/* Homework */}
          <div className="space-y-2">
            {(homeworkData?.homework || []).map((item: any) => (
              <div key={item.id} onClick={() => handleToggleHomework(item.id, !!completedHomework[item.id])} className={`flex items-start gap-3 p-4 rounded-2xl border transition cursor-pointer ${completedHomework[item.id] ? "border-accent-teal/30 bg-accent-teal/5" : "border-white/5 bg-zinc-900/60"}`}>
                <CheckSquare className={`w-4 h-4 mt-0.5 shrink-0 ${completedHomework[item.id] ? "text-accent-teal" : "text-zinc-600"}`} />
                <p className="text-xs text-zinc-300 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          {/* C1 Descriptor Self-Rating */}
          {homeworkData?.c1_descriptors && (
            <div className="space-y-2">
              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Self-Rate Against C1 Descriptors:</span>
              {homeworkData.c1_descriptors.map((d: any) => (
                <div key={d.id} className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 space-y-1.5">
                  <p className="text-[10px] font-bold text-white">{d.skill}</p>
                  <p className="text-[9px] text-zinc-500 leading-relaxed italic">{d.descriptor}</p>
                  <div className="flex gap-1 pt-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setSelfRatings(prev => ({ ...prev, [d.id]: n }))} className={`w-7 h-7 rounded-lg text-xs font-bold border transition cursor-pointer ${selfRatings[d.id] >= n ? "bg-yellow-500 border-yellow-500 text-zinc-950" : "bg-zinc-800 border-white/5 text-zinc-500"}`}>{n}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Exit Interview */}
          <div className="border-t border-white/5 pt-4 space-y-3">
            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">🤖 C1 Exit Interview with AI Tutor</span>
            {!exitSessionId ? (
              <button onClick={handleStartExitInterview} className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-white py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
                <GraduationCap className="w-4 h-4 text-yellow-400" /> Start C1 Exit Interview
              </button>
            ) : (
              <>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {exitMessages.map((msg, idx) => (
                    <div key={idx} className={`p-3 rounded-xl text-xs leading-relaxed ${msg.sender === "assistant" ? "bg-yellow-500/10 border border-yellow-500/15 text-zinc-200" : "bg-zinc-900 border border-white/5 text-zinc-300 ml-4"}`}>
                      <span className="text-[8px] uppercase font-mono text-zinc-500 block mb-1">{msg.sender === "assistant" ? "AI Tutor" : "You"}</span>
                      {msg.text}
                    </div>
                  ))}
                  {exitSending && <div className="flex items-center gap-2 text-zinc-500 text-xs pl-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…</div>}
                </div>

                {!exitFinished && (
                  <div className="flex gap-2">
                    <input value={exitText} onChange={e => setExitText(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendExitTurn()} placeholder="Share your experience in Korean or English…" className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 font-korean" disabled={exitSending} />
                    <button onClick={handleSendExitTurn} disabled={!exitText.trim() || exitSending} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 p-2 rounded-xl transition cursor-pointer"><ArrowRight className="w-4 h-4" /></button>
                  </div>
                )}

                {!exitFinished && exitMessages.length >= 3 && (
                  <button onClick={handleFinishExitInterview} className="w-full text-xs text-zinc-400 hover:text-white underline cursor-pointer">Finish Exit Interview</button>
                )}

                {exitFinished && exitProfile && (
                  <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-xs space-y-2 animate-fade-in">
                    <p className="font-black text-white">📊 Your C1 Learning Profile</p>
                    <div className="space-y-1">
                      <p className="text-zinc-400"><span className="text-white font-bold">Strengths:</span> {exitProfile.strengths?.join(", ")}</p>
                      <p className="text-zinc-400"><span className="text-white font-bold">Next Steps:</span> {exitProfile.areas_for_growth?.join(", ")}</p>
                      <div className="pt-1">
                        <p className="text-zinc-500 font-bold text-[9px] uppercase mb-1">Suggested Paths:</p>
                        <div className="flex flex-wrap gap-1">
                          {exitProfile.suggested_next?.map((path: string) => (
                            <span key={path} className="text-[9px] bg-zinc-900 border border-white/5 px-2 py-0.5 rounded text-zinc-400">{path}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {exitFarewell && <p className="text-yellow-300 font-bold text-[10px] leading-relaxed border-t border-yellow-500/10 pt-2">{exitFarewell}</p>}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Next paths */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-3 text-xs text-zinc-400 space-y-1">
            <p className="font-bold text-white text-[11px]">🚀 Where to go next:</p>
            <p>Korean 6 (C1→C2 refinement) · Business Korean · Academic Korean · Exam Prep Mode</p>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <button onClick={() => setStep(5)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={onComplete} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/20">
              <Trophy className="w-4 h-4" /> Complete Korean 5 Course
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
