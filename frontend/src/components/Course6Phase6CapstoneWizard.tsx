"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft, ChevronRight, Volume2, Sparkles, BookOpen, Award,
  Loader2, CheckCircle2, Mic, MessageCircle, Eye, ArrowRight,
  CheckSquare, Bookmark, Brain, Trophy, Star, Target, Layers,
  Activity, BarChart2, Users, GraduationCap, Briefcase, HelpCircle
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

const playSFX = (type: "correct" | "wrong") => {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "correct") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.stop(ctx.currentTime + 0.4);
      window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 20, type: "correct" } }));
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150.0, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.frequency.exponentialRampToValueAtTime(80.0, ctx.currentTime + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.stop(ctx.currentTime + 0.4);
      window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: -10, type: "wrong" } }));
    }
  } catch (e) {
    console.error("AudioContext not supported or blocked", e);
  }
};

const SCENARIO_TYPE_CONFIG: Record<string, { icon: any; color: string; badge: string; trackColor: string }> = {
  social: { icon: Users, color: "accent-teal", badge: "bg-accent-teal/15 text-accent-teal", trackColor: "from-accent-teal/30 to-accent-teal/5" },
  academic: { icon: GraduationCap, color: "brand-400", badge: "bg-brand-500/15 text-brand-400", trackColor: "from-brand-500/30 to-brand-500/5" },
  professional: { icon: Briefcase, color: "yellow-400", badge: "bg-yellow-500/15 text-yellow-400", trackColor: "from-yellow-500/30 to-yellow-500/5" }
};

const SKILL_ICON_MAP: Record<string, any> = {
  idioms: Sparkles, stance: BarChart2, register: Layers, subtext: Eye, fluency: Activity
};

interface Course6Phase6CapstoneWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course6Phase6CapstoneWizard({
  activeLesson, speakWord, onComplete
}: Course6Phase6CapstoneWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 8;

  // Data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [capstoneScenarios, setCapstoneScenarios] = useState<any[]>([]);

  // Concept check reflection (Step 2)
  const [conceptCheckAnswer, setConceptCheckAnswer] = useState<string | null>(null);
  const [conceptCheckChecked, setConceptCheckChecked] = useState(false);

  // Screen 2 Scenario accordion
  const [expandedScenario, setExpandedScenario] = useState<string | null>("scenario_a");

  // Activity 1: Scenario Snapshots & challenge MCQs (Step 3)
  const [selectedPreviewType, setSelectedPreviewType] = useState<"social" | "academic" | "professional">("social");
  const [previewSnapshotIdx, setPreviewSnapshotIdx] = useState(0);
  const [challengeSelected, setChallengeSelected] = useState<number | null>(null);
  const [challengeChecked, setChallengeChecked] = useState(false);
  const [challengeCorrect, setChallengeCorrect] = useState<boolean | null>(null);

  // Activity 2: Pre-capstone strategy planner (Step 4)
  const [strategyScenario, setStrategyScenario] = useState<"social" | "academic" | "professional">("social");
  const [selectedIdioms, setSelectedIdioms] = useState<string[]>([]);
  const [strategyStance, setStrategyStance] = useState("");
  const [strategyRegister, setStrategyRegister] = useState("");
  const [strategyListening, setStrategyListening] = useState("");
  const [strategySaved, setStrategySaved] = useState(false);
  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [savingStrategy, setSavingStrategy] = useState(false);
  const [suggestedPhrases, setSuggestedPhrases] = useState<string[]>([]);

  // Activity 3: Live Capstone Session (Step 5)
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

  // Activity 5: Strategy Quiz (Step 7)
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);
  const [quizBadge, setQuizBadge] = useState<string | null>(null);

  // Completion / Homework (Step 8)
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

  // Restore step from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hangeulai_c6p6_step");
      if (saved) {
        setStep(parseInt(saved, 10));
      }
    }
  }, []);

  // Save step to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hangeulai_c6p6_step", step.toString());
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 6,
          phaseNum: 6,
          step: step
        }
      }));
    }
  }, [step]);

  // Load API resources
  useEffect(() => {
    const load = async () => {
      try {
        if ((step === 1 || step === 8) && !metadata) {
          const res = await apiJson("/phases/korean5/6/metadata");
          setMetadata(res);
        }
        if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean5/6/core-data");
          setCoreData(res);
        }
        if (step === 3 && !previewData) {
          const res = await apiJson("/practice/c1-capstone/preview-scenarios");
          setPreviewData(res);
        }
        if (step === 4 && capstoneScenarios.length === 0) {
          const res = await apiJson("/practice/c1-capstone/scenarios");
          setCapstoneScenarios(res.capstone_scenarios || []);
        }
        if (step === 7 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean5/phase-6/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        }
        if (step === 8 && !homeworkData) {
          const res = await apiJson("/phases/korean5/6/homework");
          setHomeworkData(res);
        }
      } catch (err) {
        console.error("Error loading Capstone data:", err);
      }
    };
    load();
  }, [step]);

  const selectedPreviewScenario = previewData?.preview_scenarios?.find((s: any) => s.type === selectedPreviewType);
  const currentSnapshot = selectedPreviewScenario?.snapshots?.[previewSnapshotIdx];

  // Save strategy (Step 4)
  const handleSaveStrategy = async () => {
    if (!strategyStance || savingStrategy) return;
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
      playSFX("correct");
    } catch (err) {
      setSuggestedPhrases(["솔직히 말씀드리면", "최선을 다해 보겠습니다", "충분히 이해합니다"]);
      setStrategySaved(true);
      playSFX("correct");
    } finally {
      setSavingStrategy(false);
    }
  };

  // Start Capstone (Step 4 scenario selection -> Step 5 runner)
  const handleStartCapstone = async (scenarioId: string) => {
    setSelectedCapstoneId(scenarioId);
    setStep(5);
    setCapstoneStage("input");
    setCapstoneMessages([]);
    setCapstoneReport(null);
    setCapstoneStarting(true);
    setComprehensionAnswer(null);
    setComprehensionChecked(false);
    setComprehensionCorrect(null);
    try {
      const res = await apiJson("/conversation/c1/full-capstone/start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: scenarioId, strategy_id: strategyId || "" })
      });
      setCapstoneSession(res);
      setCapstoneMessages([{ sender: "system", text: res.opener, en: res.opener_en }]);
    } catch (err) {
      console.error(err);
    } finally {
      setCapstoneStarting(false);
    }
  };

  // Step 2 concept reflection check
  const handleCheckConcept = () => {
    if (conceptCheckChecked) return;
    setConceptCheckChecked(true);
    playSFX("correct");
  };

  // Step 5 Comprehension check
  const handleCheckComprehension = () => {
    if (!capstoneSession || comprehensionAnswer === null || comprehensionChecked) return;
    const q = capstoneSession.comprehension_questions[0];
    const isCorrect = comprehensionAnswer === q.correct;
    setComprehensionChecked(true);
    setComprehensionCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  // Step 5 Dialogue turn
  const handleCapstoneTurn = async () => {
    if (!capstoneInput.trim() || capstoneSending) return;
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
    } catch (err) {
      console.error(err);
    } finally {
      setCapstoneSending(false);
    }
  };

  // Step 5 Writing submit
  const handleSubmitWriting = async () => {
    if (!capstoneWriting.trim() || !selectedCapstoneId || submittingWriting || capstoneWritingFeedback) return;
    setSubmittingWriting(true);
    try {
      const res = await apiJson("/conversation/c1/full-capstone/submit-writing", {
        method: "POST",
        body: JSON.stringify({ scenario_id: selectedCapstoneId, stage: "writing", text: capstoneWriting })
      });
      setCapstoneWritingFeedback(res);
      playSFX("correct");
    } catch (err) {
      setCapstoneWritingFeedback({ feedback_en: "Good writing!", feedback_ko: "잘 쓰셨어요!" });
      playSFX("correct");
    } finally {
      setSubmittingWriting(false);
    }
  };

  // Step 5 Speaking submit
  const handleSubmitSpeaking = async () => {
    if (!capstoneSpeaking.trim() || !selectedCapstoneId || submittingSpeaking || capstoneSpeakingFeedback) return;
    setSubmittingSpeaking(true);
    try {
      const res = await apiJson("/conversation/c1/full-capstone/submit-speaking", {
        method: "POST",
        body: JSON.stringify({ scenario_id: selectedCapstoneId, stage: "speaking", transcript: capstoneSpeaking })
      });
      setCapstoneSpeakingFeedback(res);
      playSFX("correct");
    } catch (err) {
      setCapstoneSpeakingFeedback({ feedback_en: "Good summary!", feedback_ko: "잘 하셨어요!" });
      playSFX("correct");
    } finally {
      setSubmittingSpeaking(false);
    }
  };

  // Step 5 Finish live capstone -> step 6 report
  const handleFinishCapstone = async () => {
    if (finishingCapstone) return;
    setFinishingCapstone(true);
    try {
      const res = await apiJson("/conversation/c1/full-capstone/finish", { method: "POST" });
      setCapstoneReport(res.c1_capstone_report);
      setCapstoneStage("report");
      setStep(6);
    } catch (err) {
      console.error(err);
    } finally {
      setFinishingCapstone(false);
    }
  };

  // Step 7 Strategy Quiz verify
  const handleCheckQuiz = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelectedOpt || quizChecked) return;

    const isCorrect = quizSelectedOpt === current.correct_answer;
    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");

    if (!isCorrect) {
      setQuizMistakes(prev => [...prev, current.id]);
    }

    try {
      await apiJson("/quiz/korean5/phase-6/answer", {
        method: "POST",
        body: JSON.stringify({ question_id: current.id, answer: quizSelectedOpt, time_taken_ms: 2000 })
      });
    } catch (e) {
      console.error(e);
    }
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
        setStep(8);
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  // Step 8 Completion: homework checkboxes
  const handleToggleHomework = async (id: string, current: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !current }));
    try {
      await apiJson("/phases/korean5/6/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !current })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Step 8 Completion: AI Exit Interview
  const handleStartExitInterview = async () => {
    setExitMessages([]);
    setExitFinished(false);
    setExitProfile(null);
    try {
      const res = await apiJson("/conversation/c1/exit-interview/start", { method: "POST" });
      setExitSessionId(res.session_id);
      setExitMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") playAudio(res.opener);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendExitTurn = async () => {
    if (!exitText.trim() || !exitSessionId || exitSending) return;
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
    } catch (err) {
      console.error(err);
    } finally {
      setExitSending(false);
    }
  };

  const handleFinishExitInterview = async () => {
    if (!exitSessionId) return;
    try {
      const res = await apiJson("/conversation/c1/exit-interview/finish", { method: "POST" });
      setExitProfile(res.c1_profile_snapshot);
      setExitFarewell(res.farewell);
      setExitFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  const outlineSteps = [
    { num: 1, label: "Welcome & Goals" },
    { num: 2, label: "Scenario Core Concepts" },
    { num: 3, label: "Act 1: Snapshots Challenge" },
    { num: 4, label: "Act 2: Pre-Capstone Planner" },
    { num: 5, label: "Act 3: Live Capstone Session" },
    { num: 6, label: "Act 4: Capstone C1 Report" },
    { num: 7, label: "Act 5: Capstone Strategy Quiz" },
    { num: 8, label: "Graduation & Exit Profile" }
  ];

  return (
    <div className="flex-grow flex flex-col justify-between">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Korean 6.6 – C1 Advanced Capstone"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Integrated C1 Communication</p>
          </div>
        </div>
        
        {/* Active progress bar */}
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
            className="text-[10px] bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer uppercase tracking-wider font-bold"
          >
            {showOutline ? "Hide Outline" : "View Outline"}
          </button>
        </div>
      </header>

      {showOutline && (
        <div className="mb-6 p-5 bg-zinc-950/85 rounded-3xl border border-white/5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 font-mono">Curriculum Syllabus Map</span>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {outlineSteps.map(s => (
              <button
                key={s.num}
                onClick={() => {
                  setStep(s.num);
                  setShowOutline(false);
                }}
                className={`p-2 border text-left transition ${step === s.num
                    ? "border-brand-500 bg-brand-500/10 text-white"
                    : "border-white/5 bg-zinc-900/40 text-zinc-400 hover:border-white/10 hover:text-white"
                  }`}
              >
                <div className="text-[8px] font-black font-mono text-zinc-500">STEP {s.num}</div>
                <div className="text-[10px] font-bold truncate">{s.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Welcome & Goals */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="relative mx-auto w-fit">
            <div className="p-4 bg-yellow-500/10 rounded-full border border-yellow-500/25 text-yellow-400">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-brand-500 rounded-full border-2 border-zinc-950">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight font-sans">Korean 6.6</h2>
          <h3 className="text-2xl font-extrabold text-yellow-400 mt-2">C1 Advanced Capstone</h3>
          <p className="text-zinc-450 text-sm italic">“Handle Complex Situations with Nuance”</p>
          
          <p className="text-zinc-350 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Handle complex situations in Korean with nuance and confidence."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-405 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Capstone Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Operate at a C1 real‑world communicative level in social, academic, and professional scenarios",
                "Integrate multiple skills: listening, speaking, reading, writing, inference, and stance",
                "Plan strategies before a high‑stakes interaction and then execute them in real time",
                "Receive a holistic C1 profile and suggestions for further learning"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_time || "45–60 minutes"}</p>
          </div>

          {/* Mode Selector */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Conversation Mode</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("text")}
                className={`p-3 rounded-xl border text-xs font-bold transition ${
                  mode === "text" 
                    ? "border-yellow-500 bg-yellow-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400"
                }`}
              >
                Text Input
              </button>
              <button
                onClick={() => setMode("voice")}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  mode === "voice" 
                    ? "border-yellow-500 bg-yellow-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400"
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
              className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg"
            >
              <span>Start Capstone</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Concept Screen */}
      {step === 2 && coreData && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-5 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-yellow-400" />
              <span>C1 Capstone Overview</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-2xl p-4 space-y-2 text-left">
            <p className="text-[9px] text-yellow-400 font-mono uppercase font-black">C1 Real‑World Communicative Goal</p>
            <p className="text-xs text-zinc-300 italic leading-relaxed font-serif">
              "At C1, you can use language flexibly and effectively for social, academic and professional purposes and understand implicit meaning in demanding situations."
            </p>
            <div className="border-t border-white/[0.03] pt-2 space-y-1 text-[10px] text-zinc-400">
              <p className="font-bold text-white text-[11px]">Multiple skills at once:</p>
              <p>Listening · Speaking · Reading · Writing · Inference · Stance — all in one scenario.</p>
            </div>
          </div>

          {/* Scenario previews accordion */}
          <div className="space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Three Scenario Tracks</span>
            <div className="grid grid-cols-3 gap-2">
              {(coreData.preview_scenarios || []).map((sc: any) => {
                const cfg = SCENARIO_TYPE_CONFIG[sc.type] || SCENARIO_TYPE_CONFIG.social;
                const IconComp = cfg.icon;
                return (
                  <div key={sc.id} onClick={() => setExpandedScenario(expandedScenario === sc.id ? null : sc.id)} className={`p-3 rounded-xl border cursor-pointer transition ${expandedScenario === sc.id ? `border-${cfg.color}/40 bg-${cfg.color}/5` : "border-white/5 bg-zinc-900/60 hover:border-white/10"}`}>
                    <IconComp className={`w-5 h-5 text-${cfg.color} mb-2`} />
                    <p className="text-[10px] font-bold text-white leading-tight font-black">{sc.label.replace("Scenario ", "")}</p>
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
                  <p className="text-zinc-300 leading-relaxed font-black">{sc.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {sc.skills.map((s: string) => (
                      <span key={s} className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-white/5 capitalize font-bold">{s}</span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Reflection Concept Question */}
          <div className="p-4 bg-zinc-900/60 rounded-xl border border-white/5 text-left space-y-3">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-yellow-400" />
              <span>Which type of scenario feels most important for you right now?</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {["social", "academic", "professional"].map((option) => (
                <button
                  key={option}
                  onClick={() => !conceptCheckChecked && setConceptCheckAnswer(option)}
                  disabled={conceptCheckChecked}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                    conceptCheckAnswer === option 
                      ? "border-yellow-500 bg-yellow-500/10 text-white" 
                      : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                  }`}
                >
                  <span className="block text-[8px] text-zinc-500 uppercase tracking-widest mb-1 font-mono">{option} Target</span>
                  <span className="font-korean">
                    {option === "social" && "👥 Social Relations"}
                    {option === "academic" && "📚 Academic Discussion"}
                    {option === "professional" && "💼 Professional Work"}
                  </span>
                </button>
              ))}
            </div>

            {conceptCheckChecked && (
              <div className="p-3 bg-accent-teal/5 border border-accent-teal/20 text-accent-teal text-[11px] rounded-lg animate-fade-in">
                ✓ Strategy Selected! Your preference has been registered to help customize the pre-capstone planner steps.
              </div>
            )}

            {!conceptCheckChecked && conceptCheckAnswer && (
              <div className="flex justify-end">
                <button
                  onClick={handleCheckConcept}
                  className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Save Strategy Choice
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button 
              onClick={() => setStep(3)} 
              disabled={!conceptCheckChecked}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-zinc-950 px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              Start Snapshot challenges <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Activity 1 – Snapshot challenges */}
      {step === 3 && previewData && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-yellow-400" />
              <span>Activity A: Understand and decide in a snapshot</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Snapshot {previewSnapshotIdx + 1}/{selectedPreviewScenario?.snapshots.length || 3}</span>
          </div>

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
                <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-[8px] uppercase font-mono font-black px-2.5 py-0.5 rounded-full ${SCENARIO_TYPE_CONFIG[selectedPreviewType].badge}`}>
                      {currentSnapshot.label}
                    </span>
                    <button onClick={() => playAudio(currentSnapshot.ko)} className="flex items-center gap-1 text-[9px] text-zinc-400 hover:text-white border border-white/5 px-2 py-0.5 rounded cursor-pointer">
                      <Volume2 className="w-3.5 h-3.5" /> Listen
                    </button>
                  </div>
                  <p className="font-korean text-zinc-150 text-base leading-relaxed font-black">{currentSnapshot.ko}</p>
                  <p className="text-xs text-zinc-500 italic">"{currentSnapshot.en}"</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-white">{currentSnapshot.challenge_question}</p>
                  {currentSnapshot.challenge_options.map((opt: string, idx: number) => {
                    let cls = "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10";
                    if (challengeChecked) {
                      if (idx === currentSnapshot.challenge_correct) {
                        cls = "border-accent-teal bg-accent-teal/5 text-accent-teal font-bold";
                      } else if (idx === challengeSelected) {
                        cls = "border-accent-pink bg-accent-pink/5 text-accent-pink";
                      }
                    } else if (challengeSelected === idx) {
                      cls = "border-yellow-500 bg-yellow-500/10 text-white font-bold";
                    }
                    return (
                      <button key={idx} onClick={() => !challengeChecked && setChallengeSelected(idx)} disabled={challengeChecked} className={`w-full p-3.5 rounded-xl border text-xs font-medium text-left transition ${cls}`}>
                        {String.fromCharCode(65 + idx)}. {opt}
                      </button>
                    );
                  })}
                </div>

                {challengeChecked && (
                  <div className={`p-4 rounded-xl border text-xs space-y-1.5 animate-fade-in ${challengeCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                    <p className="font-black">{challengeCorrect ? "✓ Correct!" : "✗ Not quite."}</p>
                    <p className="text-zinc-350 leading-normal">
                      {challengeCorrect ? "Good situational awareness! Your strategic decision was optimal for C1 communicative goals." : "Think about the social rules of the situation and target C1 level registers."}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <button onClick={() => setStep(2)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
                  {!challengeChecked ? (
                    <button onClick={() => challengeSelected !== null && setChallengeChecked(true) && setChallengeCorrect(challengeSelected === currentSnapshot.challenge_correct) && playSFX(challengeSelected === currentSnapshot.challenge_correct ? "correct" : "wrong")} disabled={challengeSelected === null} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer">Check Snapshot</button>
                  ) : (
                    <button
                      onClick={() => {
                        if (previewSnapshotIdx < selectedPreviewScenario.snapshots.length - 1) {
                          setPreviewSnapshotIdx(prev => prev + 1);
                          setChallengeSelected(null);
                          setChallengeChecked(false);
                          setChallengeCorrect(null);
                        } else {
                          setStep(4);
                        }
                      }}
                      className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      {previewSnapshotIdx < selectedPreviewScenario.snapshots.length - 1 ? "Next Snapshot" : "Proceed to Strategy Planner"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Activity 2 – Pre-capstone strategy planner */}
      {step === 4 && previewData && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-yellow-400" />
              <span>Activity B: Plan your approach (C1‑style)</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            <p className="text-xs text-zinc-400">Choose your scenario type and configure your target strategies:</p>

            <div className="grid grid-cols-3 gap-2">
              {(["social", "academic", "professional"] as const).map(type => (
                <button key={type} onClick={() => { setStrategyScenario(type); setSelectedIdioms([]); setStrategySaved(false); }} className={`p-3 rounded-xl border text-[10px] font-bold capitalize transition ${strategyScenario === type ? "border-yellow-500 bg-yellow-500/10 text-white" : "border-white/5 bg-zinc-900 text-zinc-400"}`}>{type}</button>
              ))}
            </div>

            <div className="space-y-2">
              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Target Idioms to incorporate:</span>
              <div className="flex flex-wrap gap-1.5">
                {(previewData.strategy_idiom_options?.[strategyScenario] || []).map((idiom: string) => (
                  <button key={idiom} onClick={() => setSelectedIdioms(prev => prev.includes(idiom) ? prev.filter(i => i !== idiom) : [...prev, idiom])} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${selectedIdioms.includes(idiom) ? "border-yellow-500 bg-yellow-500/10 text-yellow-350" : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"}`}>
                    {idiom}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block font-mono">Stance Goal:</label>
                <select value={strategyStance} onChange={e => setStrategyStance(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/50">
                  <option value="">Select Stance Level...</option>
                  <option value="strong">Strong / Direct (확신)</option>
                  <option value="balanced">Balanced / Nuanced (신중)</option>
                  <option value="cautious">Cautious / Hedged (추측)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block font-mono">Register form:</label>
                <select value={strategyRegister} onChange={e => setStrategyRegister(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/50">
                  <option value="">Select Register Level...</option>
                  <option value="informal">Informal (반말)</option>
                  <option value="neutral">Neutral (존댓말)</option>
                  <option value="formal">Formal (격식체)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block font-mono">Describe how you will handle implicit refrains or misunderstandings:</label>
              <input value={strategyListening} onChange={e => setStrategyListening(e.target.value)} placeholder="e.g. check subtext, use softening markers, request clarification..." className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-3 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-yellow-500/50" />
            </div>

            {strategySaved && suggestedPhrases.length > 0 && (
              <div className="p-4 bg-brand-500/5 border border-brand-500/15 rounded-xl text-xs space-y-1.5 animate-fade-in">
                <p className="font-black text-white">✓ Strategy Saved! Suggested bonus phrases:</p>
                {suggestedPhrases.map((phrase, idx) => <p key={idx} className="text-zinc-450 font-bold font-korean">• {phrase}</p>)}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <button onClick={() => setStep(3)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
              {!strategySaved ? (
                <button onClick={handleSaveStrategy} disabled={!strategyStance || savingStrategy} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                  {savingStrategy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Approach Strategy</span>
                </button>
              ) : (
                <button onClick={() => setStep(5)} className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                  <span>Proceed to Scenario Selection</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Live Capstone Session */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              <span>Activity C: Real‑time interaction & comprehension</span>
            </h2>
            {capstoneSession && (
              <div className="flex gap-1 text-[8px] font-mono font-black uppercase">
                {["Input", "Dialog", "Writing", "Speaking"].map((stage, idx) => {
                  const stageKeys = ["input", "dialog", "writing", "speaking"];
                  const isActive = capstoneStage === stageKeys[idx];
                  const isDone = ["input", "dialog", "writing", "speaking"].indexOf(capstoneStage) > idx;
                  return (
                    <span key={stage} className={`px-2 py-0.5 rounded ${isActive ? "bg-yellow-500 text-zinc-950 font-black" : isDone ? "bg-accent-teal/20 text-accent-teal" : "bg-zinc-900 text-zinc-500"}`}>
                      {isDone ? "✓ " : ""}{stage}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            {/* Scenario selector */}
            {!capstoneSession && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-xs text-zinc-400">Choose your capstone scenario:</p>
                {capstoneScenarios.map(sc => {
                  const cfg = SCENARIO_TYPE_CONFIG[sc.type] || SCENARIO_TYPE_CONFIG.social;
                  const IconComp = cfg.icon;
                  return (
                    <button key={sc.id} onClick={() => handleStartCapstone(sc.id)} disabled={capstoneStarting} className={`w-full p-4 rounded-2xl border border-white/5 bg-gradient-to-br ${cfg.trackColor} hover:border-${cfg.color}/30 text-left flex items-start gap-3 transition group cursor-pointer`}>
                      <div className={`p-2.5 rounded-xl bg-${cfg.color}/10 border border-${cfg.color}/15 shrink-0 mt-0.5`}>
                        <IconComp className={`w-4.5 h-4.5 text-${cfg.color}`} />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-bold text-white">{sc.title}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">{sc.intro_en}</p>
                        <div className="flex gap-1 mt-2">
                          {sc.stages.map((st: string) => (
                            <span key={st} className="text-[8px] bg-zinc-950 border border-white/5 px-2 py-0.5 rounded text-zinc-550 font-bold uppercase">{st}</span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-650 group-hover:text-white transition shrink-0 mt-2" />
                    </button>
                  );
                })}
              </div>
            )}

            {capstoneStarting && (
              <div className="flex items-center gap-2 text-zinc-400 text-sm justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" /> Starting scenario details...
              </div>
            )}

            {/* Stage: Input & Comprehension MCQ */}
            {capstoneSession && capstoneStage === "input" && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-2">
                  <span className="text-[8px] uppercase tracking-widest font-mono text-zinc-500 font-bold">Incoming Interlocutor Prompt:</span>
                  <div className="flex items-start gap-2">
                    <p className="font-korean text-zinc-200 text-sm leading-relaxed flex-1 font-black">{capstoneSession.input_message_ko}</p>
                    <button onClick={() => playAudio(capstoneSession.input_message_ko)} className="text-zinc-500 hover:text-yellow-400 transition cursor-pointer shrink-0"><Volume2 className="w-4 h-4" /></button>
                  </div>
                  <p className="text-[10px] text-zinc-500 italic">"{capstoneSession.input_message_en}"</p>
                </div>

                {capstoneSession.comprehension_questions[0] && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-white">{capstoneSession.comprehension_questions[0].q}</p>
                    {capstoneSession.comprehension_questions[0].options.map((opt: string, idx: number) => {
                      let cls = "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10";
                      if (comprehensionChecked) {
                        if (idx === capstoneSession.comprehension_questions[0].correct) {
                          cls = "border-accent-teal bg-accent-teal/5 text-accent-teal font-bold";
                        } else if (idx === comprehensionAnswer) {
                          cls = "border-accent-pink bg-accent-pink/5 text-accent-pink";
                        }
                      } else if (comprehensionAnswer === idx) {
                        cls = "border-yellow-500 bg-yellow-500/10 text-white font-bold";
                      }
                      return (
                        <button key={idx} onClick={() => !comprehensionChecked && setComprehensionAnswer(idx)} disabled={comprehensionChecked} className={`w-full p-3 rounded-xl border text-xs font-medium text-left transition ${cls}`}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <button onClick={() => setCapstoneSession(null)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Reselect</button>
                  {!comprehensionChecked ? (
                    <button onClick={handleCheckComprehension} disabled={comprehensionAnswer === null} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer">Verify Comprehension</button>
                  ) : (
                    <button onClick={() => setCapstoneStage("dialog")} className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer">Proceed to Dialog</button>
                  )}
                </div>
              </div>
            )}

            {/* Stage: Dialog */}
            {capstoneSession && capstoneStage === "dialog" && (
              <div className="space-y-3 animate-fade-in">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 bg-zinc-950 p-4 rounded-xl border border-white/5">
                  {capstoneMessages.map((msg, idx) => (
                    <div key={idx} className={`p-3 rounded-xl text-xs leading-relaxed ${msg.sender === "assistant" || msg.sender === "system" ? "bg-yellow-500/10 border border-yellow-500/15 text-zinc-200" : "bg-zinc-900 border border-white/5 text-zinc-300 ml-4"}`}>
                      <span className="text-[8px] uppercase font-mono text-zinc-550 block mb-1">{msg.sender === "user" ? "You" : "AI Interlocutor"}</span>
                      {msg.text}
                      {msg.en && <p className="text-[9px] text-zinc-500 italic mt-1">"{msg.en}"</p>}
                    </div>
                  ))}
                  {capstoneSending && <div className="flex items-center gap-2 text-zinc-500 text-xs pl-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...</div>}
                </div>

                <div className="flex gap-2">
                  <input value={capstoneInput} onChange={e => setCapstoneInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCapstoneTurn()} placeholder="Reply in Korean using stance guidelines..." className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 font-korean" disabled={capstoneSending} />
                  <button onClick={handleCapstoneTurn} disabled={!capstoneInput.trim() || capstoneSending} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-4 py-2.5 rounded-xl transition cursor-pointer font-bold text-xs">Send</button>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button onClick={() => setCapstoneStage("input")} className="text-xs text-zinc-500 hover:underline">Back to Prompt</button>
                  {capstoneMessages.length >= 3 && (
                    <button onClick={() => setCapstoneStage("writing")} className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer">Move to Writing Stage →</button>
                  )}
                </div>
              </div>
            )}

            {/* Stage: Writing */}
            {capstoneSession && capstoneStage === "writing" && (
              <div className="space-y-3 animate-fade-in">
                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-[10px] text-zinc-400">
                  📝 <span className="text-zinc-200 font-bold">Writing Task:</span> Write a short Korean message or summary (8–10 sentences) relating to this scenario. Use appropriate register and stance.
                </div>
                <textarea value={capstoneWriting} onChange={e => setCapstoneWriting(e.target.value)} rows={6} disabled={!!capstoneWritingFeedback} placeholder="Write your Korean message or summary here..." className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-yellow-500/50 resize-none font-korean" />

                {capstoneWritingFeedback && (
                  <div className="p-4 bg-brand-500/5 border border-brand-500/15 rounded-xl text-xs space-y-2 animate-fade-in">
                    <p className="font-black text-white">✓ Writing Feedback</p>
                    <p className="text-zinc-300 leading-normal">{capstoneWritingFeedback.feedback_en}</p>
                    <p className="text-zinc-500 italic">{capstoneWritingFeedback.feedback_ko}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <button onClick={() => setCapstoneStage("dialog")} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back to Dialog</button>
                  {!capstoneWritingFeedback ? (
                    <button onClick={handleSubmitWriting} disabled={!capstoneWriting.trim() || submittingWriting} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                      {submittingWriting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Submit Writing
                    </button>
                  ) : (
                    <button onClick={() => setCapstoneStage("speaking")} className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer">Proceed to Speaking Stage →</button>
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
                <textarea value={capstoneSpeaking} onChange={e => setCapstoneSpeaking(e.target.value)} rows={5} disabled={!!capstoneSpeakingFeedback} placeholder="Type or paste spoken summary transcript here..." className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-yellow-500/50 resize-none font-korean" />

                {capstoneSpeakingFeedback && (
                  <div className="p-4 bg-brand-500/5 border border-brand-500/15 rounded-xl text-xs space-y-2 animate-fade-in">
                    <p className="font-black text-white">✓ Speaking Feedback</p>
                    <p className="text-zinc-300 leading-normal">{capstoneSpeakingFeedback.feedback_en}</p>
                    <p className="text-zinc-500 italic">{capstoneSpeakingFeedback.feedback_ko}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <button onClick={() => setCapstoneStage("writing")} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back to Writing</button>
                  {!capstoneSpeakingFeedback ? (
                    <button onClick={handleSubmitSpeaking} disabled={!capstoneSpeaking.trim() || submittingSpeaking} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                      {submittingSpeaking && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Submit Speaking
                    </button>
                  ) : (
                    <button onClick={handleFinishCapstone} disabled={finishingCapstone} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                      {finishingCapstone && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Proceed to Capstone Report
                    </button>
                  )}
                </div>
              </div>
            )}

            {capstoneSession && capstoneStage !== "report" && (
              <div className="flex justify-end pt-2">
                <button onClick={() => setStep(6)} className="text-xs text-zinc-500 hover:text-white underline cursor-pointer">Skip scenario steps</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 6: Activity 4 – C1 Capstone Report */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span>C1 Capstone Report & profile</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of {totalSteps}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            <p className="text-xs text-zinc-400">Holistic overview of your communicative performance across core C1 dimensions:</p>

            <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 space-y-4">
              <span className="text-[10px] text-zinc-500 font-mono font-bold block uppercase tracking-wider">📊 C1 Competency Dimensions</span>
              
              <div className="space-y-3">
                {[
                  { skill: "Idioms & Chunks", descriptor: "Uses idiomatic expressions and figurative language naturally in social and professional contexts." },
                  { skill: "Stance & Softening", descriptor: "Qualifies arguments cautiously (hedging) and softens direct rejections politely." },
                  { skill: "Register & Style", descriptor: "Transitions smoothly between formal, neutral, and casual Korean levels." },
                  { skill: "Implicit Meaning & Subtext", descriptor: "Infers indirect requests, emotional codes, and subtext hints efficiently." },
                  { skill: "Coherence & Fluency", descriptor: "Structures complex spoken narratives and written messages logically." }
                ].map((d) => (
                  <div key={d.skill} className="p-3 bg-zinc-900/60 rounded-xl border border-white/[0.03] space-y-1">
                    <p className="text-xs font-black text-white">{d.skill}</p>
                    <p className="text-[10px] text-zinc-400 leading-normal">{d.descriptor}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <button onClick={() => setStep(5)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back to Session</button>
              <button onClick={() => setStep(7)} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                <span>Proceed to Capstone Quiz</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 7: Activity 5 – Quiz */}
      {step === 7 && quizBlueprint.length > 0 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-400" />
              <span>Activity E: Final quiz and graduation</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Question {quizIdx + 1}/{quizBlueprint.length}</span>
          </div>

          <div className="space-y-4 text-left">
            <p className="text-sm font-extrabold text-white leading-relaxed">
              {quizBlueprint[quizIdx].question}
            </p>

            <div className="space-y-2">
              {quizBlueprint[quizIdx].options.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                  className={`w-full p-4 rounded-xl text-left text-xs font-medium border transition ${
                    quizSelectedOpt === opt 
                      ? "border-yellow-500 bg-yellow-500/10 text-white" 
                      : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                  } ${quizChecked && opt === quizBlueprint[quizIdx].correct_answer ? "border-accent-teal bg-accent-teal/10 text-white font-bold" : ""}`}
                  disabled={quizChecked}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {quizChecked && (
            <div className={`p-4 rounded-2xl border text-xs space-y-1.5 animate-fade-in ${
              quizCorrect 
                ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" 
                : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"
            }`}>
              <p className="font-black">{quizCorrect ? "✓ Correct!" : "✗ Not quite."}</p>
              <p className="text-zinc-350 leading-normal">{quizBlueprint[quizIdx].explanation}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(6)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
            {!quizChecked ? (
              <button
                onClick={handleCheckQuiz}
                disabled={!quizSelectedOpt}
                className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Verify Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuizOrFinish}
                disabled={finishingQuiz}
                className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {finishingQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Complete & Receive Badge"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 8: Completion / Profile */}
      {step === 8 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-5 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-4 bg-yellow-500/10 rounded-full border border-yellow-500/25 w-fit mx-auto text-yellow-400 shrink-0">
            <Trophy className="w-12 h-12 animate-bounce" />
          </div>

          <h2 className="text-3xl font-black text-white">Course Graduation Profile</h2>
          <p className="text-xs text-zinc-400">Congratulations! You have completed the entire C1 Advanced Capstone course:</p>

          {/* Badge award */}
          {quizBadge && (
            <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-2xl p-4 max-w-sm mx-auto w-full flex items-center gap-4 text-left shadow-lg">
              <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/25">
                <Trophy className="w-7 h-7 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">🎉 Course Completion Badge!</p>
                <p className="text-yellow-300 font-bold text-sm leading-tight">{quizBadge}</p>
                <p className="text-[10px] text-zinc-400">Quiz Score: {quizScore || 100}% · XP: +200 rewarded</p>
              </div>
            </div>
          )}

          {/* Course completion line */}
          <div className="p-4 bg-gradient-to-br from-yellow-500/5 via-brand-500/5 to-accent-teal/5 border border-yellow-500/20 rounded-2xl max-w-md mx-auto w-full text-center space-y-1 shadow">
            <p className="font-black text-white text-sm">🏆 Korean 6: Advanced Korean, Idioms & Nuance (C1)</p>
            <p className="text-zinc-450 text-xs font-semibold">You've completed the entire Korean 6 course!</p>
          </div>

          {/* Spaced Homework recommendations */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Spaced Homework Recommendations:</span>
            
            <div className="space-y-2">
              {(homeworkData?.homework || [
                { id: "hw1", text: "Reflect on how your pre-capstone strategy planning affected your conversational fluency." },
                { id: "hw2", text: "Identify subtext and registers in a real-world Korean workplace conversation." }
              ]).map((item: any) => (
                <div 
                  key={item.id}
                  onClick={() => handleToggleHomework(item.id, !!completedHomework[item.id])}
                  className="flex items-start gap-3 p-2.5 bg-zinc-900 rounded-xl border border-white/[0.03] hover:border-brand-500/20 transition cursor-pointer"
                >
                  <button className="mt-0.5 shrink-0">
                    <CheckSquare className={`w-4 h-4 ${completedHomework[item.id] ? "text-accent-teal" : "text-zinc-600"}`} />
                  </button>
                  <p className="text-[11px] text-zinc-350 leading-normal">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Self-Rating C1 Descriptors */}
          {homeworkData?.c1_descriptors && (
            <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 text-left space-y-2 max-w-md mx-auto w-full">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Self-Rate Against C1 Descriptors:</span>
              {homeworkData.c1_descriptors.map((d: any) => (
                <div key={d.id} className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 space-y-1.5">
                  <p className="text-[10px] font-bold text-white font-mono">{d.skill}</p>
                  <p className="text-[9px] text-zinc-400 leading-relaxed italic">{d.descriptor}</p>
                  <div className="flex gap-1 pt-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setSelfRatings(prev => ({ ...prev, [d.id]: n }))} className={`w-6 h-6 rounded-lg text-[10px] font-bold border transition cursor-pointer ${selfRatings[d.id] >= n ? "bg-yellow-500 border-yellow-500 text-zinc-950" : "bg-zinc-800 border-white/5 text-zinc-500"}`}>{n}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Exit Interview */}
          <div className="border-t border-white/5 pt-4 max-w-md mx-auto w-full text-left space-y-3">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">🤖 C1 Exit Interview with AI Tutor</span>
            {!exitSessionId ? (
              <button onClick={handleStartExitInterview} className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-white py-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
                <GraduationCap className="w-4 h-4 text-yellow-400" /> Start C1 Exit Interview
              </button>
            ) : (
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3 animate-fade-in">
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {exitMessages.map((msg, idx) => (
                    <div key={idx} className={`p-2.5 rounded-xl text-[10px] leading-relaxed ${msg.sender === "assistant" ? "bg-yellow-500/10 border border-yellow-500/15 text-zinc-200" : "bg-zinc-900 border border-white/5 text-zinc-300 ml-4 font-korean"}`}>
                      {msg.text}
                    </div>
                  ))}
                  {exitSending && <div className="flex items-center gap-2 text-zinc-500 text-xs pl-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...</div>}
                </div>

                {!exitFinished && (
                  <div className="flex gap-2">
                    <input value={exitText} onChange={e => setExitText(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendExitTurn()} placeholder="Share your experience..." className="flex-grow bg-zinc-900 border border-white/10 p-2 rounded-lg outline-none focus:border-yellow-500 text-[10px] text-white font-korean" disabled={exitSending} />
                    <button onClick={handleSendExitTurn} disabled={!exitText.trim() || exitSending} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer">Send</button>
                    <button onClick={handleFinishExitInterview} className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border border-white/5">Done</button>
                  </div>
                )}

                {exitFinished && exitProfile && (
                  <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-xs space-y-2 animate-fade-in leading-relaxed">
                    <p className="font-black text-white">📊 Your C1 Learning Profile</p>
                    <div className="space-y-1 text-zinc-350">
                      <p><span className="text-white font-bold">Strengths:</span> {exitProfile.strengths?.join(", ") || "Integrated situational adaptation."}</p>
                      <p><span className="text-white font-bold">Next Steps:</span> {exitProfile.areas_for_growth?.join(", ") || "Refine high-speed indirect processing."}</p>
                      <div className="pt-1">
                        <p className="text-zinc-550 font-bold text-[9px] uppercase mb-1">Suggested Paths:</p>
                        <div className="flex flex-wrap gap-1">
                          {(exitProfile.suggested_next || ["Korean 6 (C1→C2 refinement)", "Business Korean"]).map((path: string) => (
                            <span key={path} className="text-[9px] bg-zinc-900 border border-white/5 px-2 py-0.5 rounded text-zinc-400">{path}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {exitFarewell && <p className="text-yellow-300 font-bold text-[10px] leading-relaxed border-t border-yellow-500/10 pt-2">{exitFarewell}</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Suggested Paths */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-3.5 text-xs text-zinc-400 space-y-1 text-left max-w-md mx-auto w-full">
            <p className="font-bold text-white text-[11px]">🚀 Where to go next:</p>
            <p className="font-bold">Korean 6 (C1→C2 refinement) · Business Korean · Academic Korean · Exam Prep Mode</p>
          </div>

          <div className="flex flex-col gap-2 max-w-xs mx-auto pt-4 border-t border-white/5 w-full">
            <button 
              onClick={() => {
                // Dispatch completion bonus XP
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 200, type: "correct" } }));
                onComplete();
              }}
              className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black py-4 px-8 rounded-xl transition text-base flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-yellow-500/20 animate-pulse"
            >
              <span>Complete Korean Capstone</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
