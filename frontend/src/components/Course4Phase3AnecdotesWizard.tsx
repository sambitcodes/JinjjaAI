"use client";

import { useEffect, useState, useRef } from "react";
import xpAudit from "../lib/xp-audit.json";
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
  Save,
  MessageSquare,
  ArrowRight
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

interface Course4Phase3AnecdotesWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course4Phase3AnecdotesWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course4Phase3AnecdotesWizardProps) {
  const phaseNum = 3;
  const getStepMaxXP = (sNum: number) => {
    try {
      return (xpAudit as any)["4"]?.[phaseNum.toString()]?.steps?.[sNum.toString()]?.max_xp ?? 35;
    } catch (e) {
      return 35;
    }
  };
  const getStepXP = (sNum: number) => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(`hangeulai_c4p${phaseNum}_s${sNum}_earned_xp`) || "0", 10);
  };

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c4p3_step");
    const savedMax = localStorage.getItem("hangeulai_c4p3_max_step");
    let currentParsed = 1;
    if (savedStep) {
      currentParsed = parseInt(savedStep, 10);
    }
    if (savedMax) {
      const parsedMax = parseInt(savedMax, 10);
      setMaxStep(Math.max(parsedMax, currentParsed));
    } else {
      setMaxStep(currentParsed);
    }
  }, []);

  useEffect(() => {
    if (step > maxStep) {
      setMaxStep(step);
      localStorage.setItem("hangeulai_c4p3_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 8;

  // Persist progress to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c4p3_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 8) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c4p3_step", String(step));
  }, [step]);

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Concept Micro-questions state
  const [c1Answer, setC1Answer] = useState<string | null>(null);
  const [c1Checked, setC1Checked] = useState(false);
  const [c1Correct, setC1Correct] = useState<boolean | null>(null);

  const [c2Answer, setC2Answer] = useState<string | null>(null);
  const [c2Checked, setC2Checked] = useState(false);
  const [c2Correct, setC2Correct] = useState<boolean | null>(null);

  const [c3Answer, setC3Answer] = useState<string | null>(null);
  const [c3Checked, setC3Checked] = useState(false);
  const [c3Correct, setC3Correct] = useState<boolean | null>(null);

  // Activity 1 states (Reading & Listening - understandingItems)
  const [understandingItems, setUnderstandingItems] = useState<any[]>([]);
  const [undIdx, setUndIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [undChecked, setUndChecked] = useState(false);
  const [undCorrect, setUndCorrect] = useState<boolean | null>(null);

  // Activity 2 states (Anecdote Builder)
  const [selectedStoryType, setSelectedStoryType] = useState("fun_day");
  const [timeExpr, setTimeExpr] = useState("지난 주말에");
  const [placeExpr, setPlaceExpr] = useState("공원에");
  const [whoExpr, setWhoExpr] = useState("친구랑");
  const [events, setEvents] = useState<string[]>([
    "자전거를 탔어요.",
    "김밥을 먹었어요.",
    "이야기를 나눴어요."
  ]);
  const [feelingExpr, setFeelingExpr] = useState("조금 피곤했지만 아주 재미있었어요");

  // Output
  const [builtKo, setBuiltKo] = useState("");
  const [builtEn, setBuiltEn] = useState("");
  const [building, setBuilding] = useState(false);
  const [savedStories, setSavedStories] = useState<any[]>([]);

  // Speaking evaluation states
  const [recording, setRecording] = useState(false);
  const [speakingChecked, setSpeakingChecked] = useState(false);
  const [speakingFeedback, setSpeakingFeedback] = useState("");
  const [speakingScore, setSpeakingScore] = useState<number | null>(null);

  // Quiz states
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Homework check states
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Tutor session states
  const [loadingTutor, setLoadingTutor] = useState(false);

  // --- Start Progress State Preservation ---
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hangeulai_c4p3_progress_state");
        if (saved) {
          const state = JSON.parse(saved);
            // Deleted state.step override to allow teleportation
            // Deleted state.maxStep override to allow teleportation
            if (state.c1Answer !== undefined) setC1Answer(state.c1Answer);
            if (state.c1Checked !== undefined) setC1Checked(state.c1Checked);
            if (state.c1Correct !== undefined) setC1Correct(state.c1Correct);
            if (state.c2Answer !== undefined) setC2Answer(state.c2Answer);
            if (state.c2Checked !== undefined) setC2Checked(state.c2Checked);
            if (state.c2Correct !== undefined) setC2Correct(state.c2Correct);
            if (state.c3Answer !== undefined) setC3Answer(state.c3Answer);
            if (state.c3Checked !== undefined) setC3Checked(state.c3Checked);
            if (state.c3Correct !== undefined) setC3Correct(state.c3Correct);
            if (state.undIdx !== undefined) setUndIdx(state.undIdx);
            if (state.qIdx !== undefined) setQIdx(state.qIdx);
            if (state.selectedOpt !== undefined) setSelectedOpt(state.selectedOpt);
            if (state.undChecked !== undefined) setUndChecked(state.undChecked);
            if (state.undCorrect !== undefined) setUndCorrect(state.undCorrect);
            if (state.selectedStoryType !== undefined) setSelectedStoryType(state.selectedStoryType);
            if (state.quizIdx !== undefined) setQuizIdx(state.quizIdx);
            if (state.quizChecked !== undefined) setQuizChecked(state.quizChecked);
            if (state.quizCorrect !== undefined) setQuizCorrect(state.quizCorrect);
            if (state.quizSelectedOpt !== undefined) setQuizSelectedOpt(state.quizSelectedOpt);
            if (state.quizMistakes !== undefined) setQuizMistakes(state.quizMistakes);
            if (state.quizScore !== undefined) setQuizScore(state.quizScore);
            if (state.completedHomework !== undefined) setCompletedHomework(state.completedHomework);
        }
      } catch (e) {
        console.error("Failed to restore progress state:", e);
      }
      isLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    if (typeof window !== "undefined") {
      try {
        const state = {
            step,
            maxStep,
            c1Answer,
            c1Checked,
            c1Correct,
            c2Answer,
            c2Checked,
            c2Correct,
            c3Answer,
            c3Checked,
            c3Correct,
            undIdx,
            qIdx,
            selectedOpt,
            undChecked,
            undCorrect,
            selectedStoryType,
            quizIdx,
            quizChecked,
            quizCorrect,
            quizSelectedOpt,
            quizMistakes,
            quizScore,
            completedHomework
        };
        localStorage.setItem("hangeulai_c4p3_progress_state", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save progress state:", e);
      }
    }
  }, [step, maxStep, c1Answer, c1Checked, c1Correct, c2Answer, c2Checked, c2Correct, c3Answer, c3Checked, c3Correct, undIdx, qIdx, selectedOpt, undChecked, undCorrect, selectedStoryType, quizIdx, quizChecked, quizCorrect, quizSelectedOpt, quizMistakes, quizScore, completedHomework]);
  // --- End Progress State Preservation ---

  const [tutorSession, setTutorSession] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!metadata) {
          const res = await apiJson("/lessons/phases/korean3/3/metadata");
          setMetadata(res);
        }
        if (step >= 2 && !coreData) {
          const res = await apiJson("/lessons/phases/korean3/3/core-data");
          setCoreData(res);
        }
        if (step >= 5 && understandingItems.length === 0) {
          const res = await apiJson("/lessons/practice/anecdotes/listening-reading");
          setUnderstandingItems(res.items || []);
        }
        if (step >= 7 && quizBlueprint.length === 0) {
          const res = await apiJson("/lessons/quiz/korean3/phase-3/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        }
        if (step >= 8 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean3/3/homework");
          setHomeworkItems(res_hw || []);
        }
      } catch (err) {
        console.error("Error loading step data: ", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Concept checks
  const handleCheckC1 = () => {
    if (!c1Answer) return;
    const correct = c1Answer === "B";
    setC1Correct(correct);
    setC1Checked(true);
    playSFX(correct ? "correct" : "wrong");
  };

  const handleCheckC2 = () => {
    if (!c2Answer) return;
    const correct = c2Answer === "B";
    setC2Correct(correct);
    setC2Checked(true);
    playSFX(correct ? "correct" : "wrong");
  };

  const handleCheckC3 = () => {
    if (!c3Answer) return;
    const correct = c3Answer === "B";
    setC3Correct(correct);
    setC3Checked(true);
    playSFX(correct ? "correct" : "wrong");
  };

  // Activity 1 Check
  const handleCheckUnd = async () => {
    const current = understandingItems[undIdx];
    if (!current) return;
    const activeQ = current.questions[qIdx];
    if (!activeQ || !selectedOpt) return;

    const isCorrect = selectedOpt === activeQ.correct_answer;
    setUndChecked(true);
    setUndCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");

    try {
      await apiJson("/lessons/practice/anecdotes/listening-reading/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id + "_" + qIdx,
          option_id: selectedOpt,
          time_taken_ms: 1200
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextQuestionOrDescription = () => {
    const current = understandingItems[undIdx];
    if (!current) return;

    setUndChecked(false);
    setSelectedOpt(null);
    setUndCorrect(null);

    if (qIdx < current.questions.length - 1) {
      setQIdx(qIdx + 1);
    } else {
      setQIdx(0);
      if (undIdx < understandingItems.length - 1) {
        setUndIdx(undIdx + 1);
      } else {
        setUndIdx(0);
      }
    }
  };

  // Activity 2: Builder
  const handleBuildAnecdote = async () => {
    setBuilding(true);
    setSpeakingChecked(false);
    setSpeakingFeedback("");
    setSpeakingScore(null);
    try {
      const res = await apiJson("/lessons/practice/anecdotes/build", {
        method: "POST",
        body: JSON.stringify({
          story_type: selectedStoryType,
          time_expr: timeExpr,
          place_expr: placeExpr,
          who_expr: whoExpr,
          events: events.filter(e => e.trim().length > 0),
          feeling_expr: feelingExpr
        })
      });
      setBuiltKo(res.sentence_ko);
      setBuiltEn(res.sentence_en);
    } catch (err) {
      console.error("Error building anecdote: ", err);
    } finally {
      setBuilding(false);
    }
  };

  const handleSaveAnecdote = async () => {
    if (!builtKo) return;
    try {
      await apiJson("/lessons/users/anecdotes/save", {
        method: "POST",
        body: JSON.stringify({ title: `My Anecdote`, content_ko: builtKo, content_en: builtEn })
      });
      setSavedStories(prev => [...prev, { ko: builtKo, en: builtEn }]);
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("Story saved successfully!") } }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartRecording = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      handleCheckSpeaking();
    }, 2000);
  };

  const handleCheckSpeaking = async () => {
    try {
      const res = await apiJson("/lessons/practice/anecdotes/speaking", {
        method: "POST",
        body: JSON.stringify({ target_text: builtKo })
      });
      setSpeakingChecked(true);
      setSpeakingFeedback(res.feedback);
      setSpeakingScore(res.accuracy_score);
    } catch (err) {
      console.error(err);
    }
  };

  // Quiz
  const handleCheckQuiz = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current) return;

    const isCorrect = quizSelectedOpt === current.correct_answer;
    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
    if (!isCorrect) {
      setQuizMistakes(prev => [...prev, current.id]);
    }

    try {
      await apiJson("/lessons/quiz/korean3/phase-3/answer", {
        method: "POST",
        body: JSON.stringify({
          question_id: current.id,
          answer: quizSelectedOpt || "",
          time_taken_ms: 1500
        })
      });
    } catch (e) {
      console.error(e);
    }
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
        await apiJson("/lessons/quiz/korean3/phase-3/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setStep(8);
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/lessons/phases/korean3/3/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLaunchB1AnecdotesPractice = async () => {
    setLoadingTutor(true);
    setTutorSession(null);
    try {
      const res = await apiJson("/lessons/conversation/b1/anecdotes-practice/start", {
        method: "POST"
      });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

  const updateEventValue = (idx: number, val: string) => {
    const nextEvents = [...events];
    nextEvents[idx] = val;
    setEvents(nextEvents);
  };

  const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "Concept 1 – B1 Storytelling Goal" },
    { num: 3, label: "Concept 2 – Story Framing Structure" },
    { num: 4, label: "Concept 3 – Example Anecdote Analysis" },
    { num: 5, label: "Activity A – Understanding Checks" },
    { num: 6, label: "Activity B – Chronicle Story Builder" },
    { num: 7, label: "Quiz – Story Organisation Checks" },
    { num: 8, label: "Tutor Live Story Session" }
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 4,
          phaseNum: 3,
          step: step
        }
      }));
    }
  }, [step]);

  return (
    <div className="flex-grow flex flex-col justify-between">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Experiences & Simple Anecdotes (B1 Core)"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Level B1 - Phase 3</p>
          </div>
        </div>
        
        {/* Active progress bar */}
        <div className="flex items-center space-x-4">
          <div className="w-40 h-3 bg-zinc-900/80 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full transition-all duration-500" 
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

      {showOutline && (() => {
        const phaseEarnedXP = outlineSteps.reduce((acc, s) => acc + getStepXP(s.num), 0);
        const phaseMaxXP = outlineSteps.reduce((acc, s) => acc + getStepMaxXP(s.num), 0);
        return (
          <div className="mb-6 p-5 bg-zinc-955/80 rounded-3xl border border-white/5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 relative z-30">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 font-mono">Curriculum Syllabus Map</span>
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">Required: 340 XP</span>
            </div>
            
            {/* Phase Level Progress Bar */}
            <div className="mb-4 p-3 bg-zinc-900/60 rounded-2xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-zinc-400">
                <span>Phase XP Progress</span>
                <span className="text-brand-400">{phaseEarnedXP} / {phaseMaxXP} XP</span>
              </div>
              <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${(phaseEarnedXP / (phaseMaxXP || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {outlineSteps.map(s => {
                const isCurrent = step === s.num;
                const isCompleted = s.num < step;
                return (
                  <button
                    key={s.num}
                    disabled={!isCompleted && !isCurrent}
                    onClick={() => {
                      if (courseXP < 160) {
                        window.dispatchEvent(new CustomEvent("hangeulai-warning", {
                          detail: { message: "To start Phase 3, you need at least 160 XP in this course. You currently have " + courseXP + " XP." }
                        }));
                        return;
                      }
                      setStep(s.num);
                      setShowOutline(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between h-20 ${
                      isCurrent
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : isCompleted
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/50"
                        : "border-red-500/20 bg-red-950/20 text-red-400/40 cursor-not-allowed opacity-50"
                    }`}
                  >
                    <div>
                      <div className="text-[9px] font-black font-mono text-zinc-500">STEP {s.num}</div>
                      <div className="text-[11px] font-bold truncate w-full">{s.label}</div>
                    </div>
                    {/* Step level mini progress / XP potential */}
                    <div className="w-full mt-1">
                      <div className="flex justify-between text-[7px] font-black text-zinc-500">
                        <span>Potential</span>
                        <span className={isCompleted ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                          {getStepXP(s.num)}/{getStepMaxXP(s.num)} XP
                        </span>
                      </div>
                      <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden mt-0.5">
                        <div 
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${(getStepXP(s.num) / (getStepMaxXP(s.num) || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Screen 1: Welcome/Overview */}
      {step === 1 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="p-3 bg-indigo-500/10 rounded-full border border-indigo-500/25 w-fit mx-auto text-indigo-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight">Anecdotes – “Yesterday & Last Weekend”</h2>
          <h3 className="text-2xl font-extrabold text-indigo-400 mt-2">Level B1 - Phase 3</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Describe what you did yesterday and last weekend."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Learning Goals:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Tell a short logical anecdote about a past event with beginning-middle-end layout",
                "Utilize chronological sequence words (먼저, 그 다음에, 그리고, 마지막으로)",
                "Synthesize results and emotional evaluations to close narratives"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 30} minutes</p>
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => {
    if (courseXP < 160) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 3, you need at least 160 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <span>Start Phase 3</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Screen 2: Concept C1 – B1 storytelling goal */}
      {step === 2 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen C1 – B1 Storytelling Goal</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="space-y-4 text-left max-w-2xl mx-auto text-sm text-zinc-300">
            <p className="text-lg text-zinc-200 italic font-medium leading-relaxed border-l-4 border-indigo-500 pl-4 py-1 bg-indigo-500/5 rounded-r-xl">
              "At B1, you should be able to organize a story logically with a clear chronological timeline and wrap up with your personal evaluations."
            </p>
            <p>
              Rather than list unlinked actions in the past tense (A2 level), B1 narrative layout establishes:
              <br />
              - <strong>A Clear Stage Setting</strong> (Beginning: Time, Place, Who).
              <br />
              - <strong>Logical Chronology</strong> (Middle: sequence connectors).
              <br />
              - <strong>Evaluative Reflection</strong> (End: feeling or final state).
            </p>
          </div>

          {/* Micro MCQ Check */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 max-w-xl mx-auto w-full space-y-4 text-left">
            <p className="text-xs text-indigo-400 font-black uppercase tracking-wider font-mono">💡 Micro-Question Check:</p>
            <p className="text-sm font-bold text-white">What information usually belongs in the beginning of an anecdote?</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: "A", text: "A) your feelings at the end" },
                { id: "B", text: "B) time, place, and who you were with" }
              ].map((opt) => {
                const isSelected = c1Answer === opt.id;
                const isCorrectOpt = opt.id === "B";
                return (
                  <button
                    key={opt.id}
                    disabled={c1Checked}
                    onClick={() => setC1Answer(opt.id)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all duration-200 ${
                      isSelected 
                        ? "border-indigo-500 bg-indigo-500/10 text-white" 
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    } ${c1Checked && isCorrectOpt ? "border-emerald-500 bg-emerald-500/10 text-white" : ""} ${
                      c1Checked && isSelected && !isCorrectOpt ? "border-red-500 bg-red-500/10 text-white" : ""
                    }`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {c1Checked && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 animate-fade-in">
                <p className="font-extrabold text-white mb-1">
                  {c1Correct ? "✓ Correct!" : "✗ Incorrect."}
                </p>
                <p>Setting the scene (when, where, and with whom) is crucial to give the listener context before detailing sequential events.</p>
              </div>
            )}

            {!c1Checked && (
              <button
                disabled={!c1Answer}
                onClick={handleCheckC1}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
              >
                Check Answer
              </button>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 4 Phase 3 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 4 Phase 3 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Continue <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Concept C2 – Story frames: beginning / middle / end */}
      {step === 3 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen C2 – Story Frames Structure</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          <div className="space-y-4 text-left max-w-2xl mx-auto text-xs text-zinc-300">
            <p className="text-sm">B1 narratives partition details across three major frames:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-zinc-950 border border-white/5 rounded-xl space-y-1">
                <span className="text-indigo-400 font-extrabold text-sm block">🎬 Beginning</span>
                <p className="font-bold text-white text-xs">{coreData?.story_frames?.beginning || "Time, Place, Who"}</p>
                <p className="text-[10px] text-zinc-500">Sets the baseline coordinates of the story memory.</p>
              </div>
              <div className="p-3.5 bg-zinc-950 border border-white/5 rounded-xl space-y-1">
                <span className="text-indigo-400 font-extrabold text-sm block">🔄 Middle</span>
                <p className="font-bold text-white text-xs">{coreData?.story_frames?.middle || "Chronological Events"}</p>
                <p className="text-[10px] text-zinc-500">Uses sequence links: 먼저, 그 다음에, 그리고, 마지막으로.</p>
              </div>
              <div className="p-3.5 bg-zinc-950 border border-white/5 rounded-xl space-y-1">
                <span className="text-indigo-400 font-extrabold text-sm block">🏁 End</span>
                <p className="font-bold text-white text-xs">{coreData?.story_frames?.end || "Result & Feelings"}</p>
                <p className="text-[10px] text-zinc-500">Includes final consequence and personal emotional assessment.</p>
              </div>
            </div>
          </div>

          {/* Micro MCQ Check */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 max-w-xl mx-auto w-full space-y-4 text-left">
            <p className="text-xs text-indigo-400 font-black uppercase tracking-wider font-mono">💡 Micro-Question Check:</p>
            <p className="text-sm font-bold text-white">Which words show the chronological order in a story?</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: "A", text: "A) KTX, 해물 밀면, 사진" },
                { id: "B", text: "B) 먼저, 그 다음에, 그리고, 마지막으로" }
              ].map((opt) => {
                const isSelected = c2Answer === opt.id;
                const isCorrectOpt = opt.id === "B";
                return (
                  <button
                    key={opt.id}
                    disabled={c2Checked}
                    onClick={() => setC2Answer(opt.id)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all duration-200 ${
                      isSelected 
                        ? "border-indigo-500 bg-indigo-500/10 text-white" 
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    } ${c2Checked && isCorrectOpt ? "border-emerald-500 bg-emerald-500/10 text-white" : ""} ${
                      c2Checked && isSelected && !isCorrectOpt ? "border-red-500 bg-red-500/10 text-white" : ""
                    }`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {c2Checked && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 animate-fade-in">
                <p className="font-extrabold text-white mb-1">
                  {c2Correct ? "✓ Correct!" : "✗ Incorrect."}
                </p>
                <p>Sequence markers (first, next, and, finally) form the backbone of chronological narrative timelines.</p>
              </div>
            )}

            {!c2Checked && (
              <button
                disabled={!c2Answer}
                onClick={handleCheckC2}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
              >
                Check Answer
              </button>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 4 Phase 3 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 4 Phase 3 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => {
    if (courseXP < 160) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 3, you need at least 160 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Continue <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Concept C3 – Busan Trip Example / Routine vs Anecdote */}
      {step === 4 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen C3 – Busan Trip Anecdote</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 max-w-xl mx-auto w-full text-left space-y-3 text-xs leading-normal">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Example Story:</span>
            <p className="font-korean text-sm leading-relaxed text-zinc-200">
              지난달에 저는 친구랑 부산으로 여행을 갔어요. <strong className="text-indigo-400">먼저</strong> 아침에 KTX 열차를 탔어요. <strong className="text-indigo-400">그 다음에</strong> 부산역 근처 식당에서 맛있는 해물 밀면을 먹었어요. <strong className="text-indigo-400">그리고</strong> 바다를 구경하고 사진을 많이 찍었어요. <strong className="text-indigo-400">마지막으로</strong> 저녁에 호텔에 돌아와서 쉬었어요. 조금 피곤했지만 아주 <strong className="text-emerald-400">행복했어요</strong>.
            </p>
            <p className="text-zinc-500 italic">
              "Last month, I went on a trip to Busan with a friend. First, in the morning, I took the KTX. Next, I ate seafood noodles near Busan Station. Then, we saw the sea and took pictures. Finally, we returned to the hotel and rested. I was tired, but very happy."
            </p>
          </div>

          {/* Micro MCQ Check */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 max-w-xl mx-auto w-full space-y-4 text-left">
            <p className="text-xs text-indigo-400 font-black uppercase tracking-wider font-mono">💡 Micro-Question Check:</p>
            <p className="text-sm font-bold text-white">What is new at B1 compared to simple past routines?</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: "A", text: "A) only listing past tense actions in chronological order" },
                { id: "B", text: "B) organizing actions into beginning-middle-end with evaluations" }
              ].map((opt) => {
                const isSelected = c3Answer === opt.id;
                const isCorrectOpt = opt.id === "B";
                return (
                  <button
                    key={opt.id}
                    disabled={c3Checked}
                    onClick={() => setC3Answer(opt.id)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all duration-200 ${
                      isSelected 
                        ? "border-indigo-500 bg-indigo-500/10 text-white" 
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    } ${c3Checked && isCorrectOpt ? "border-emerald-500 bg-emerald-500/10 text-white" : ""} ${
                      c3Checked && isSelected && !isCorrectOpt ? "border-red-500 bg-red-500/10 text-white" : ""
                    }`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {c3Checked && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 animate-fade-in">
                <p className="font-extrabold text-white mb-1">
                  {c3Correct ? "✓ Correct!" : "✗ Incorrect."}
                </p>
                <p>Instead of merely cataloging daily actions, B1 storytelling builds a narrative flow by packaging sequences with scene setups and final personal opinions.</p>
              </div>
            )}

            {!c3Checked && (
              <button
                disabled={!c3Answer}
                onClick={handleCheckC3}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
              >
                Check Answer
              </button>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 4 Phase 3 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 4 Phase 3 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Activity A – Anecdote understanding checks */}
      {step === 5 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity A – Anecdote Understanding Checks</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 5 of {totalSteps}</span>
          </div>

          {understandingItems.length > 0 && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
              {/* Story prompt */}
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl text-center space-y-2">
                <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider block font-mono">B1 Anecdote Paragraph</span>
                <p className="font-korean text-sm leading-relaxed text-white font-extrabold">{understandingItems[undIdx]?.text}</p>
                <div className="flex justify-center pt-1">
                  <button onClick={() => playAudio(understandingItems[undIdx]?.text)} className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                    <Volume2 className="w-4 h-4" />
                    <span>Listen</span>
                  </button>
                </div>
              </div>

              {/* Comprehension check questions */}
              <div className="space-y-3">
                <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 text-center text-xs">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono block">Question {qIdx + 1}:</span>
                  <p className="font-bold text-white mt-0.5">{understandingItems[undIdx]?.questions[qIdx]?.question}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
                  {understandingItems[undIdx]?.questions[qIdx]?.options.map((opt: string) => {
                    const isSelected = selectedOpt === opt;
                    const isCorrect = opt === understandingItems[undIdx]?.questions[qIdx]?.correct_answer;
                    return (
                      <button
                        key={opt}
                        onClick={() => !undChecked && setSelectedOpt(opt)}
                        disabled={undChecked}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all duration-200 ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-500/10 text-white"
                            : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                        } ${undChecked && isCorrect ? "border-emerald-500 bg-emerald-500/10 text-white font-black" : ""} ${
                          undChecked && isSelected && !isCorrect ? "border-red-500 bg-red-500/10 text-white font-black" : ""
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {undChecked && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 max-w-sm mx-auto text-left animate-fade-in">
                  <p className="font-extrabold text-white mb-1">{undCorrect ? "✓ Correct!" : "✗ Incorrect."}</p>
                  <p>{understandingItems[undIdx]?.questions[qIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!undChecked ? (
                  <button
                    onClick={handleCheckUnd}
                    disabled={!selectedOpt}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestionOrDescription}
                    className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next Question
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 4 Phase 3 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 4 Phase 3 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(4)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(6)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Continue to Activity B <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 6: Activity B – Anecdote builder (yesterday/last weekend) */}
      {step === 6 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity B – Anecdote builder</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
            <div className="grid grid-cols-2 gap-3">
              {/* Story type selection */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Story Topic</label>
                <select
                  value={selectedStoryType}
                  onChange={(e) => {
                    const typeId = e.target.value;
                    setSelectedStoryType(typeId);
                    if (typeId === "trip_visit") {
                      setTimeExpr("지난달에");
                      setPlaceExpr("부산으로");
                      setWhoExpr("친구랑");
                      setEvents([
                        "KTX 열차를 탔어요.",
                        "해물 밀면을 먹었어요.",
                        "바다 구경을 했어요."
                      ]);
                      setFeelingExpr("조금 피곤했지만 아주 행복했어요");
                    } else {
                      setTimeExpr("지난 주말에");
                      setPlaceExpr("공원에");
                      setWhoExpr("동생하고");
                      setEvents([
                        "자전거를 탔어요.",
                        "김밥을 맛있게 먹었어요.",
                        "이야기를 많이 나눴어요."
                      ]);
                      setFeelingExpr("조금 힘들었지만 아주 보람 있었어요");
                    }
                  }}
                  className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white"
                >
                  <option value="fun_day">Fun Day out at Park</option>
                  <option value="trip_visit">Weekend Trip to Busan</option>
                </select>
              </div>

              {/* Time Expressions */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Time (어제 / 지난 주말에...)</label>
                <input
                  type="text"
                  value={timeExpr}
                  onChange={(e) => setTimeExpr(e.target.value)}
                  className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Place Expression */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Place (with particle)</label>
                <input
                  type="text"
                  value={placeExpr}
                  onChange={(e) => setPlaceExpr(e.target.value)}
                  className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white"
                />
              </div>

              {/* Who you were with */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">With whom</label>
                <input
                  type="text"
                  value={whoExpr}
                  onChange={(e) => setWhoExpr(e.target.value)}
                  className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white"
                />
              </div>
            </div>

            {/* Chaining Events */}
            <div className="space-y-2">
              <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Middle Chronological Events (먼저, 그 다음에...):</label>
              {events.map((evt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-bold w-4">#{idx+1}</span>
                  <input
                    type="text"
                    value={evt}
                    onChange={(e) => updateEventValue(idx, e.target.value)}
                    className="w-full bg-zinc-950 p-2 rounded-xl border border-white/5 text-xs text-white"
                  />
                </div>
              ))}
            </div>

            {/* Ending emotion */}
            <div>
              <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Ending Result & Final Feelings</label>
              <input
                type="text"
                value={feelingExpr}
                onChange={(e) => setFeelingExpr(e.target.value)}
                className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white"
              />
            </div>

            <button
              onClick={handleBuildAnecdote}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center"
            >
              Generate Anecdote Story
            </button>
          </div>

          {/* Result preview */}
          {builtKo && (
            <div className="p-4 bg-zinc-950 rounded-xl border border-indigo-500/20 text-center space-y-3 animate-fade-in">
              <div>
                <span className="text-[9px] text-indigo-400 uppercase tracking-wider block font-black mb-1">Generated Chronological Narrative:</span>
                <p className="font-korean text-lg text-white font-extrabold leading-relaxed">{builtKo}</p>
                <p className="text-xs text-zinc-400 mt-1">{builtEn}</p>
              </div>

              <div className="flex justify-center gap-2 pt-2">
                <button onClick={() => playAudio(builtKo)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <Volume2 className="w-4 h-4" />
                  <span>Listen</span>
                </button>
                <button onClick={handleSaveAnecdote} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <Save className="w-4 h-4" />
                  <span>Save Story</span>
                </button>
              </div>

              {/* Story recitation */}
              <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-white/5 space-y-2 mt-2">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-black text-left">Narrate Your Story:</span>
                <div className="flex justify-between items-center gap-3">
                  <button
                    onClick={handleStartRecording}
                    disabled={recording}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      recording ? "bg-red-500 text-white animate-pulse" : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>{recording ? "Recording..." : "Read Aloud"}</span>
                  </button>
                  
                  {speakingChecked && (
                    <div className="text-right space-y-0.5 text-xs">
                      <p className="font-bold text-white">Score: {speakingScore}%</p>
                      <p className="text-[10px] text-zinc-400 font-medium">{speakingFeedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 4 Phase 3 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 4 Phase 3 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(5)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(7)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Continue to Mini-Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 7: Quiz – Story organisation & evaluation */}
      {step === 7 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-400" />
              <span>Mini-Quiz: Story Organisation Checks</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Question {quizIdx + 1} of {quizBlueprint.length || 3}</span>
          </div>

          {quizBlueprint.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Question Prompt</span>
                <p className="font-extrabold text-white text-base mt-1 whitespace-pre-line">{quizBlueprint[quizIdx]?.question}</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {quizBlueprint[quizIdx]?.options.map((opt: string) => {
                  const isSelected = quizSelectedOpt === opt;
                  const isCorrect = opt === quizBlueprint[quizIdx]?.correct_answer;
                  return (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                      disabled={quizChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition-all duration-200 ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500/10 text-white"
                          : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                      } ${quizChecked && isCorrect ? "border-emerald-500 bg-emerald-500/10 text-white font-black" : ""} ${
                        quizChecked && isSelected && !isCorrect ? "border-red-500 bg-red-500/10 text-white font-black" : ""
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {quizChecked && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 text-left animate-fade-in">
                  <p className="font-extrabold text-white mb-1">{quizCorrect ? "✓ Correct! Brilliant." : "✗ Incorrect."}</p>
                  <p>{quizBlueprint[quizIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end">
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={!quizSelectedOpt}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl text-xs cursor-pointer transition"
                  >
                    Verify Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold px-6 py-2 rounded-xl text-xs cursor-pointer transition flex items-center gap-1.5"
                  >
                    {finishingQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Complete Quiz"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Motivational line wrap-up when finished */}
          {quizChecked && quizIdx === quizBlueprint.length - 1 && quizCorrect && (
            <div className="mt-4 p-4 bg-zinc-900 border border-emerald-500/20 rounded-2xl max-w-sm mx-auto text-center space-y-1.5 animate-bounce">
              <Award className="w-8 h-8 text-yellow-500 mx-auto" />
              <p className="font-bold text-white text-sm">Anecdote Checkpoint Complete</p>
              <p className="text-[10px] text-zinc-400">“You are fully capable of drafting logical anecdotes and yesterday's events.”</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 4 Phase 3 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 4 Phase 3 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(6)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <div className="h-4" />
          </div>
        </div>
      )}

      {/* Screen 8: Tutor session – Describe a friend or place */}
      {step === 8 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/25 w-fit mx-auto text-emerald-400 shrink-0">
            <Award className="w-8 h-8 animate-bounce shrink-0" />
          </div>

          <h2 className="text-5xl font-black text-white tracking-tight">Course 4 Phase 3 Completed!</h2>
          <p className="text-xs text-zinc-400 font-mono">“You are fully capable of drafting logical anecdotes and yesterday’s events.”</p>

          <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">B1 Anecdote Homework Checklist:</span>
            <div className="space-y-2.5">
              {homeworkItems.map((item) => {
                const isChecked = !!completedHomework[item.id];
                return (
                  <label key={item.id} className="flex items-start gap-3 cursor-pointer group text-xs text-zinc-300 select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleHomework(item.id, isChecked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/10 bg-zinc-950 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className={`group-hover:text-white transition ${isChecked ? "line-through text-zinc-500" : ""}`}>{item.text}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* AI practice launcher */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <div className="space-y-0.5">
              <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider block font-mono">AI Conversation Practice:</span>
              <p className="text-[11px] text-zinc-400 leading-normal">Practice telling your story/anecdote in an interactive conversation session with Gwan-Sik.</p>
            </div>

            {tutorSession ? (
              <div className="p-4 bg-zinc-900 border border-indigo-500/20 rounded-xl space-y-2 text-xs animate-fade-in">
                <p className="font-extrabold text-white">Stateful Session Active!</p>
                <p className="font-korean text-zinc-200">Gwan-Sik: "{tutorSession.opener}"</p>
                <button
                  onClick={() => window.location.href = `/tutor?session_id=${tutorSession.session_id}`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded-lg text-[10px] cursor-pointer transition flex items-center gap-1"
                >
                  <span>Enter B1 Practice Room</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLaunchB1AnecdotesPractice}
                disabled={loadingTutor}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition flex items-center justify-center gap-2"
              >
                {loadingTutor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                <span>Initiate AI Roleplay Session</span>
              </button>
            )}
          </div>

          <div className="pt-2 flex justify-between items-center max-w-md mx-auto w-full">
            <button onClick={() => setStep(7)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button 
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 150, type: "correct" } }));
                }onComplete();
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3.5 px-8 rounded-xl transition text-sm shadow-lg shadow-emerald-500/15 cursor-pointer"
            >
              Finish B1 Phase 3
            </button>
          </div>
        </div>
      )}
    
  
  {/* Re-Answer panel for mistakes */}
  {step === outlineSteps.length && (  quizMistakes.length > 0) && (
    <div className="bg-zinc-900/60 p-6 rounded-2xl border border-red-500/20 text-left space-y-4 max-w-4xl mx-auto w-full mt-6 relative z-10">
      <span className="text-[10px] font-black uppercase tracking-widest text-red-400 block font-sans">
        ⚠️ Review & Re-Answer Incorrect Questions to Gain XP
      </span>
      <div className="space-y-3">
        
        {(quizMistakes || []).map((m: any, idx: number) => (
          <div key={idx} className="p-4 bg-zinc-955/80 rounded-xl border border-white/5 flex justify-between items-center text-left">
            <div className="text-xs text-zinc-300 pr-4">
              <strong>Question:</strong> {String(m)}
            </div>
            <button
              onClick={() => {
                const targetQStep = outlineSteps.length - 1;
                setStep(targetQStep);
                
                // Find matching blueprint question index
                const bpIdx = (quizBlueprint || []).findIndex((q: any) => q.correct_answer === m || q.question === m || q.correctId === m);
                if (bpIdx !== -1) {
                  if (typeof setQuizIdx === "function") setQuizIdx(bpIdx);
                if (typeof setQuizChecked === "function") setQuizChecked(false);
                if (typeof setQuizCorrect === "function") setQuizCorrect(null);
                if (typeof setQuizScore === "function") setQuizScore(null);
                if (typeof setQuizSelectedOpt === "function") setQuizSelectedOpt(null);
                }

                // Remove from mistakes list
                if (typeof setQuizMistakes === "function") setQuizMistakes((prev: any) => prev.filter((item: any) => item !== m));
              }}
              className="bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
            >
              Re-Answer
            </button>
          </div>
        ))}
      </div>
    </div>
  )}
      </div>
  );
}
