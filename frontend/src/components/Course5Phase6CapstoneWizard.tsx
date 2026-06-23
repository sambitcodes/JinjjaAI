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
  MessageCircle,
  Trophy,
  Star,
  Info,
  Layers,
  ArrowRight,
  TrendingUp,
  Play
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

interface Course5Phase6CapstoneWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course5Phase6CapstoneWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course5Phase6CapstoneWizardProps) {
  const phaseNum = 6;
  const getStepMaxXP = (sNum: number) => {
    try {
      return (xpAudit as any)["5"]?.[phaseNum.toString()]?.steps?.[sNum.toString()]?.max_xp ?? 35;
    } catch (e) {
      return 35;
    }
  };
  const getStepXP = (sNum: number) => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(`hangeulai_c5p${phaseNum}_s${sNum}_earned_xp`) || "0", 10);
  };

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c5p6_step");
    const savedMax = localStorage.getItem("hangeulai_c5p6_max_step");
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
      localStorage.setItem("hangeulai_c5p6_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 7;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Concept C1 micro checkpoint
  const [c1Selected, setC1Selected] = useState<string | null>(null);
  const [c1Checked, setC1Checked] = useState(false);

  // Activity 1 Guided Scenario snapshots
  const [guidedScenarios, setGuidedScenarios] = useState<any>(null);
  const [selectedScenarioType, setSelectedScenarioType] = useState<string>("scenario_a");
  const [snapIdx, setSnapIdx] = useState(0);
  const [selectedTaskAns, setSelectedTaskAns] = useState<string | null>(null);
  const [selectedProbAns, setSelectedProbAns] = useState<string | null>(null);
  const [guidedChecked, setGuidedChecked] = useState(false);
  const [guidedCorrect, setGuidedCorrect] = useState<boolean | null>(null);
  const [learnerPlanningNotes, setLearnerPlanningNotes] = useState("");
  const [planningSuggestion, setPlanningSuggestion] = useState<string | null>(null);
  const [gettingPlanningSuggestion, setGettingPlanningSuggestion] = useState(false);

  // Activity 2: Scenario Day Route
  const [capstoneScenario, setCapstoneScenario] = useState<string>("scenario_a");
  const [capstoneSessionId, setCapstoneSessionId] = useState<string | null>(null);
  const [capstoneMessages, setCapstoneMessages] = useState<any[]>([]);
  const [capstoneText, setCapstoneText] = useState("");
  const [capstoneSending, setCapstoneSending] = useState(false);
  const [capstoneStage, setCapstoneStage] = useState(1);
  const [capstoneFinished, setCapstoneFinished] = useState(false);
  const [capstoneEvaluation, setCapstoneEvaluation] = useState<any>(null);
  const [finishingCapstone, setFinishingCapstone] = useState(false);
  const [recording, setRecording] = useState(false);

  // Activity 3: Strategy Quiz
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);
  const [quizBadge, setQuizBadge] = useState<string | null>(null);

  // Activity 4: Exit Interview
  const [exitSessionId, setExitSessionId] = useState<string | null>(null);
  const [exitMessages, setExitMessages] = useState<any[]>([]);
  const [exitText, setExitText] = useState("");
  const [exitSending, setExitSending] = useState(false);
  const [exitFinished, setExitFinished] = useState(false);

  
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});
// --- Start Progress State Preservation ---
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hangeulai_c5p6_progress_state");
        if (saved) {
          const state = JSON.parse(saved);
            // Deleted state.step override to allow teleportation
            // Deleted state.maxStep override to allow teleportation
            if (state.c1Selected !== undefined) setC1Selected(state.c1Selected);
            if (state.c1Checked !== undefined) setC1Checked(state.c1Checked);
            if (state.selectedScenarioType !== undefined) setSelectedScenarioType(state.selectedScenarioType);
            if (state.snapIdx !== undefined) setSnapIdx(state.snapIdx);
            if (state.selectedTaskAns !== undefined) setSelectedTaskAns(state.selectedTaskAns);
            if (state.selectedProbAns !== undefined) setSelectedProbAns(state.selectedProbAns);
            if (state.guidedChecked !== undefined) setGuidedChecked(state.guidedChecked);
            if (state.guidedCorrect !== undefined) setGuidedCorrect(state.guidedCorrect);
            if (state.capstoneText !== undefined) setCapstoneText(state.capstoneText);
            if (state.capstoneFinished !== undefined) setCapstoneFinished(state.capstoneFinished);
            if (state.quizIdx !== undefined) setQuizIdx(state.quizIdx);
            if (state.quizChecked !== undefined) setQuizChecked(state.quizChecked);
            if (state.quizCorrect !== undefined) setQuizCorrect(state.quizCorrect);
            if (state.quizSelectedOpt !== undefined) setQuizSelectedOpt(state.quizSelectedOpt);
            if (state.quizMistakes !== undefined) setQuizMistakes(state.quizMistakes);
            if (state.quizScore !== undefined) setQuizScore(state.quizScore);
            if (state.exitText !== undefined) setExitText(state.exitText);
            if (state.exitFinished !== undefined) setExitFinished(state.exitFinished);
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
            c1Selected,
            c1Checked,
            selectedScenarioType,
            snapIdx,
            selectedTaskAns,
            selectedProbAns,
            guidedChecked,
            guidedCorrect,
            capstoneText,
            capstoneFinished,
            quizIdx,
            quizChecked,
            quizCorrect,
            quizSelectedOpt,
            quizMistakes,
            quizScore,
            exitText,
            exitFinished,
            completedHomework
        };
        localStorage.setItem("hangeulai_c5p6_progress_state", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save progress state:", e);
      }
    }
  }, [step, maxStep, c1Selected, c1Checked, selectedScenarioType, snapIdx, selectedTaskAns, selectedProbAns, guidedChecked, guidedCorrect, capstoneText, capstoneFinished, quizIdx, quizChecked, quizCorrect, quizSelectedOpt, quizMistakes, quizScore, exitText, exitFinished, completedHomework]);
  // --- End Progress State Preservation ---

  const [exitFeedback, setExitFeedback] = useState<string | null>(null);

  // Step 7: Graduation / Homework checklist
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  

  // Restore step from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c5p6_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 7) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c5p6_step", String(step));
  }, [step]);

  // Load API Data per Step
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean4/6/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean4/6/core-data");
          setCoreData(res);
        } else if (step === 3 && !guidedScenarios) {
          const res = await apiJson("/practice/capstone/guided-scenarios");
          setGuidedScenarios(res || {});
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean4/phase-6/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 7 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean4/6/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading B1 capstone data:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // C1 Micro reflection check
  const handleC1Check = () => {
    if (!c1Selected) return;
    setC1Checked(true);
    playSFX("correct");
  };

  // Activity 1 checks
  const handleCheckGuided = () => {
    const snapshots = guidedScenarios?.[selectedScenarioType] || [];
    const current = snapshots[snapIdx];
    if (!current) return;

    const correctTask = selectedTaskAns === current.correct;
    const correctProb = selectedProbAns === current.correct_problem;

    const isCorrect = correctTask && correctProb;
    setGuidedChecked(true);
    setGuidedCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  const handlePlanResponse = async () => {
    if (!learnerPlanningNotes.trim()) return;
    setGettingPlanningSuggestion(true);
    try {
      const res = await apiJson("/practice/capstone/plan-response", {
        method: "POST",
        body: JSON.stringify({
          snapshot_id: `${selectedScenarioType}_snap_${snapIdx}`,
          learner_notes: learnerPlanningNotes
        })
      });
      setPlanningSuggestion(res.suggestion);
    } catch (e) {
      console.error(e);
    } finally {
      setGettingPlanningSuggestion(false);
    }
  };

  const handleNextGuided = () => {
    setGuidedChecked(false);
    setGuidedCorrect(null);
    setSelectedTaskAns(null);
    setSelectedProbAns(null);
    setLearnerPlanningNotes("");
    setPlanningSuggestion(null);

    const snapshots = guidedScenarios?.[selectedScenarioType] || [];
    if (snapIdx < snapshots.length - 1) {
      setSnapIdx(snapIdx + 1);
    } else {
      setStep(4); // Proceed to Scenario Day Route
    }
  };

  // Activity 2: Live AI Capstone Route
  const handleStartCapstoneFull = async () => {
    setCapstoneMessages([]);
    setCapstoneEvaluation(null);
    setCapstoneFinished(false);
    setCapstoneStage(1);
    try {
      const res = await apiJson("/conversation/b1/capstone-full/start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: capstoneScenario })
      });
      setCapstoneSessionId(res.session_id);
      setCapstoneMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") {
        playAudio(res.opener);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendCapstoneTurn = async () => {
    if (!capstoneText.trim() || !capstoneSessionId) return;
    const textToSend = capstoneText;
    setCapstoneText("");
    setCapstoneMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setCapstoneSending(true);

    try {
      const res = await apiJson("/conversation/b1/capstone-full/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setCapstoneMessages((prev) => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") {
        playAudio(res.reply_ko);
      }
      if (capstoneStage < 4) {
        setCapstoneStage(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCapstoneSending(false);
    }
  };

  const handleFinishCapstone = async () => {
    if (!capstoneSessionId) return;
    setFinishingCapstone(true);
    try {
      const res = await apiJson("/conversation/b1/capstone-full/finish", { method: "POST" });
      setCapstoneEvaluation(res);
      setCapstoneFinished(true);
    } catch (err) {
      console.error(err);
    } finally {
      setFinishingCapstone(false);
    }
  };

  const handleRecordCapstoneVoice = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      if (capstoneScenario === "scenario_a") {
        setCapstoneText("네, 부산행 기차표 두 장 주세요.");
      } else if (capstoneScenario === "scenario_b") {
        setCapstoneText("내일 오후 세 시에 만날까요?");
      } else {
        setCapstoneText("주말에 한강 공원에 친구랑 가려고 해요.");
      }
    }, 2000);
  };

  // Activity 3: Strategy Quiz Checks
  const handleCheckQuiz = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelectedOpt) return;

    const isCorrect = quizSelectedOpt === current.correct_answer;
    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");

    if (!isCorrect) {
      setQuizMistakes((prev) => [...prev, current.id]);
    }

    try {
      await apiJson("/quiz/korean4/phase-6/answer", {
        method: "POST",
        body: JSON.stringify({
          question_id: current.id,
          answer: quizSelectedOpt,
          time_taken_ms: 3000
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
        const res = await apiJson("/quiz/korean4/phase-6/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Real-Life B1 Communicator");
        setStep(6); // Go to exit interview
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  // Activity 4: Exit Interview AI Conversation
  const handleStartExitInterview = async () => {
    setExitMessages([]);
    setExitFeedback(null);
    setExitFinished(false);
    try {
      const res = await apiJson("/conversation/b1/exit-interview/start", { method: "POST" });
      setExitSessionId(res.session_id);
      setExitMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") {
        playAudio(res.opener);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendExitTurn = async () => {
    if (!exitText.trim() || !exitSessionId) return;
    const textToSend = exitText;
    setExitText("");
    setExitMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setExitSending(true);

    try {
      const res = await apiJson("/conversation/b1/exit-interview/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setExitMessages((prev) => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") {
        playAudio(res.reply_ko);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExitSending(false);
    }
  };

  const handleFinishExit = async () => {
    if (!exitSessionId) return;
    try {
      const res = await apiJson("/conversation/b1/exit-interview/finish", { method: "POST" });
      setExitFeedback(res.feedback);
      setExitFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Homework check logging
  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework((prev) => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/phases/korean4/6/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "Concept: B1 Independent Criteria" },
    { num: 3, label: "Activity 1: Guided Snapshots" },
    { num: 4, label: "Activity 2: Scenario Day Route" },
    { num: 5, label: "Activity 3: Strategy Quiz" },
    { num: 6, label: "Activity 4: Exit Interview" },
    { num: 7, label: "Course Graduation" }
  ];

  return (
    <div className="flex-grow flex flex-col justify-between min-h-[75vh] text-zinc-100 font-sans">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg animate-pulse">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Korean 4.6 – B1 Fluency Capstone"}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-md uppercase tracking-wider">Capstone</span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium">Course 5 &bull; Phase 6</p>
          </div>
        </div>
        
        {/* Active progress bar */}
        <div className="flex items-center space-x-4">
          <div className="w-40 h-3 bg-zinc-950 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-500 rounded-full transition-all duration-500" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 font-bold">{Math.round((step / totalSteps) * 100)}%</span>
          <button 
            onClick={() => setShowOutline(!showOutline)}
            className="text-[10px] bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer uppercase tracking-wider font-extrabold"
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
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">Required: 580 XP</span>
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
                      if (courseXP < 400) {
                        window.dispatchEvent(new CustomEvent("hangeulai-warning", {
                          detail: { message: "To start Phase 6, you need at least 400 XP in this course. You currently have " + courseXP + " XP." }
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

      {/* Step 1: Welcome/Goals */}
      {step === 1 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="relative mx-auto w-fit shrink-0">
            <div className="p-4 bg-yellow-500/10 rounded-full border border-yellow-500/25 text-yellow-400">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>
            <div className="absolute -top-1 -right-1 p-1.5 bg-brand-500 rounded-full border-2 border-zinc-950">
              <Star className="w-3.5 h-3.5 text-white fill-white" />
            </div>
          </div>
          
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Real‑Life B1 Fluency</h2>
            <h3 className="text-xl font-extrabold text-yellow-400 mt-2">Integrated Capstone Journey</h3>
          </div>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Travel, daily life, and opinions in one integrated journey."}
          </p>

          <div className="bg-zinc-950/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full font-sans">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Capstone Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Handle most everyday situations around travel and daily life in Korean",
                "Discuss familiar topics, tell short narratives, and express opinions with simple reasons",
                "Maintain fluency, adjust register for friends vs staff, and keep conversations coherent",
                "Navigate multi-step scenarios with basic problem-solving actions"
              ]).map((g: string, idx: number) => (
                <li key={idx} className="text-zinc-300">{g}</li>
              ))}
            </ul>
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs border-t border-white/5 mt-4">
              <p><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 45} minutes</p>
              <p><strong>📋 Level:</strong> Intermediate B1 Capstone (Korean 4.6)</p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-xs mx-auto w-full space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Conversation Mode</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("text")}
                className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  mode === "text" 
                    ? "border-yellow-500 bg-yellow-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                Text input
              </button>
              <button
                onClick={() => setMode("voice")}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === "voice" 
                    ? "border-yellow-500 bg-yellow-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice input</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-4">
            <button 
              onClick={() => {
    if (courseXP < 400) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 6, you need at least 400 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-yellow-500/20"
            >
              <span>Begin Capstone</span>
              <ChevronRight className="w-5 h-5 text-zinc-950" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Concept (B1 Criteria) */}
      {step === 2 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-yellow-400" />
              <span>B1 Independent User Criteria</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-yellow-500/5 p-5 rounded-2xl border border-yellow-500/15 text-sm leading-relaxed text-zinc-300 text-left max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4.5 h-4.5 text-yellow-400" />
              <span className="font-bold text-white uppercase tracking-wider text-xs">Standard B1 Level Milestone:</span>
            </div>
            <p className="italic text-zinc-200">
              "At B1, you can handle most everyday situations, discuss familiar topics, express opinions, and describe experiences with simple reasons. This capstone integrates travel, daily schedules, social registers, and listening."
            </p>
          </div>

          {/* Three Evaluation Lenses */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto w-full text-left">
            <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-yellow-400">
                <Star className="w-4.5 h-4.5 fill-yellow-400" />
                <strong className="text-xs uppercase tracking-wider">1. Fluency</strong>
              </div>
              <p className="text-[11px] text-zinc-450 leading-relaxed font-sans">
                Keep the interaction going without long freezing silence gaps. Use pause fillers and connectors naturally.
              </p>
            </div>
            <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4.5 h-4.5" />
                <strong className="text-xs uppercase tracking-wider">2. Politeness</strong>
              </div>
              <p className="text-[11px] text-zinc-450 leading-relaxed font-sans">
                Shift register formats (casual 반말 vs polite/honorific 존댓말) matching your conversation partner's status.
              </p>
            </div>
            <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-400">
                <Layers className="w-4.5 h-4.5" />
                <strong className="text-xs uppercase tracking-wider">3. Content</strong>
              </div>
              <p className="text-[11px] text-zinc-450 leading-relaxed font-sans">
                Construct logical narratives of past events and clearly support your statements/opinions with reasons.
              </p>
            </div>
          </div>

          {/* Micro checkpoint C1 */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl mx-auto w-full text-left font-sans">
            <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest block font-mono">Micro Checkpoint C1</span>
            <p className="text-sm font-bold text-white">Which of these three do you feel is your strongest right now: Fluency, Politeness, or Content?</p>
            
            <div className="flex flex-col gap-2">
              {["Fluency (keeping dialogue going)", "Politeness (register switching)", "Content (opinions and logic)"].map((opt) => {
                let borderStyle = "border-white/5 bg-zinc-900/60 text-zinc-300";
                if (c1Selected === opt) {
                  borderStyle = "border-yellow-500 bg-yellow-500/10 text-white";
                }
                if (c1Checked) {
                  borderStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                }
                return (
                  <button
                    key={opt}
                    disabled={c1Checked}
                    onClick={() => setC1Selected(opt)}
                    className={`py-3 px-4 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${borderStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {c1Checked && (
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl text-xs text-left animate-fade-in text-green-300 font-sans">
                <p className="font-extrabold mb-1">✓ Acknowledged!</p>
                <p>Awesome! In this capstone, Gwan-Sik will holistically monitor and evaluate all three lenses to provide your final B1 evaluation report.</p>
              </div>
            )}

            {!c1Checked && (
              <button
                onClick={handleC1Check}
                disabled={!c1Selected}
                className="w-full py-2.5 bg-yellow-500 text-zinc-950 text-xs font-bold rounded-xl disabled:opacity-40 transition cursor-pointer"
              >
                Submit Response
              </button>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 5 Phase 6 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 5 Phase 6 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Snapshots <ChevronRight className="w-4 h-4 text-zinc-955" /></button>
          </div>
        </div>
      )}

      {/* Step 3: Activity 1: Guided Scenario snapshots */}
      {step === 3 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4 font-sans">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              <span>Activity 1 – Guided Scenario Snapshots</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 3 of {totalSteps}</span>
          </div>

          {/* Scenario toggle selectors */}
          <div className="flex gap-2 font-sans">
            {["scenario_a", "scenario_b", "scenario_c"].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedScenarioType(type);
                  setSnapIdx(0);
                  setGuidedChecked(false);
                  setGuidedCorrect(null);
                  setSelectedTaskAns(null);
                  setSelectedProbAns(null);
                  setLearnerPlanningNotes("");
                  setPlanningSuggestion(null);
                }}
                className={`flex-grow py-2.5 rounded-xl border text-xs font-bold uppercase transition cursor-pointer ${
                  selectedScenarioType === type
                    ? "border-yellow-500 bg-yellow-500/10 text-white"
                    : "border-white/5 bg-zinc-900 text-zinc-450 hover:border-white/10"
                }`}
              >
                {type === "scenario_a" ? "Travel" : type === "scenario_b" ? "Work/Campus" : "Weekend/Social"}
              </button>
            ))}
          </div>

          {guidedScenarios?.[selectedScenarioType]?.[snapIdx] && (
            <div className="space-y-5 text-left font-sans">
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-3">
                <span className="text-[9px] text-zinc-550 uppercase tracking-widest font-black block font-mono">Dialogue Snippet:</span>
                <div className="space-y-2">
                  {guidedScenarios[selectedScenarioType][snapIdx].dialogue.map((line: any, idx: number) => (
                    <div key={idx} className="text-xs font-korean">
                      <strong className="text-yellow-400">{line.speaker}:</strong> <span className="text-zinc-200">{line.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Q1: Gist */}
                <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-white block">{guidedScenarios[selectedScenarioType][snapIdx].question}</span>
                  <div className="flex flex-col gap-1.5">
                    {guidedScenarios[selectedScenarioType][snapIdx].options.map((opt: string) => {
                      let btnStyle = "border-white/5 bg-zinc-950 text-zinc-400";
                      if (selectedTaskAns === opt) {
                        btnStyle = "border-yellow-500 bg-yellow-500/10 text-white";
                      }
                      if (guidedChecked) {
                        if (opt === guidedScenarios[selectedScenarioType][snapIdx].correct) {
                          btnStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                        } else if (selectedTaskAns === opt) {
                          btnStyle = "border-red-500 bg-red-500/10 text-red-300";
                        }
                      }
                      return (
                        <button
                          key={opt}
                          disabled={guidedChecked}
                          onClick={() => setSelectedTaskAns(opt)}
                          className={`p-2 rounded-lg border text-left text-[11px] font-semibold transition cursor-pointer ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q2: Problem */}
                <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-white block">{guidedScenarios[selectedScenarioType][snapIdx].problem_question}</span>
                  <div className="flex flex-col gap-1.5">
                    {guidedScenarios[selectedScenarioType][snapIdx].problem_options.map((opt: string) => {
                      let btnStyle = "border-white/5 bg-zinc-950 text-zinc-400";
                      if (selectedProbAns === opt) {
                        btnStyle = "border-yellow-500 bg-yellow-500/10 text-white";
                      }
                      if (guidedChecked) {
                        if (opt === guidedScenarios[selectedScenarioType][snapIdx].correct_problem) {
                          btnStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                        } else if (selectedProbAns === opt) {
                          btnStyle = "border-red-500 bg-red-500/10 text-red-300";
                        }
                      }
                      return (
                        <button
                          key={opt}
                          disabled={guidedChecked}
                          onClick={() => setSelectedProbAns(opt)}
                          className={`p-2 rounded-lg border text-left text-[11px] font-semibold transition cursor-pointer ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {guidedChecked && (
                <div className={`p-4 rounded-xl text-xs text-left animate-fade-in border ${
                  guidedCorrect ? "bg-green-500/5 border-green-500/20 text-green-300" : "bg-red-500/5 border-red-500/20 text-red-400"
                }`}>
                  <p className="font-extrabold text-sm">{guidedCorrect ? "✓ Gist correct!" : "✗ Gist mismatch."}</p>
                </div>
              )}

              {/* Free response planner */}
              <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-3 text-xs">
                <span className="text-[9px] text-zinc-550 uppercase tracking-widest font-black block font-mono">Response Builder:</span>
                <p className="text-zinc-400">How would you respond in Korean to continue the dialogue?</p>
                <textarea
                  rows={2}
                  value={learnerPlanningNotes}
                  onChange={(e) => setLearnerPlanningNotes(e.target.value)}
                  placeholder="Draft your reply in Korean..."
                  className="w-full bg-zinc-900 border border-white/5 outline-none focus:border-yellow-500 p-3 rounded-xl text-xs text-white resize-none font-korean"
                />

                {planningSuggestion && (
                  <div className="p-3 bg-yellow-500/5 rounded-xl border border-yellow-500/15 text-[11px] text-zinc-350 italic">
                    <strong>Model response suggestion:</strong> "{planningSuggestion}"
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1 font-sans">
                  <button
                    onClick={handlePlanResponse}
                    disabled={!learnerPlanningNotes.trim() || gettingPlanningSuggestion}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold border border-white/5 flex items-center gap-1.5 cursor-pointer"
                  >
                    {gettingPlanningSuggestion && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Get B1 Suggestion</span>
                  </button>

                  {!guidedChecked ? (
                    <button
                      onClick={handleCheckGuided}
                      disabled={!selectedTaskAns || !selectedProbAns}
                      className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Verify Snapshot Gist
                    </button>
                  ) : (
                    <button
                      onClick={handleNextGuided}
                      className="bg-emerald-500 text-zinc-950 hover:bg-emerald-450 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      {snapIdx < guidedScenarios[selectedScenarioType].length - 1 ? "Next Snapshot" : "Continue to Day Route"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 5 Phase 6 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 5 Phase 6 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => {
    if (courseXP < 400) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 6, you need at least 400 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-955 px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-bold">Move to Scenario Day <ChevronRight className="w-4 h-4 text-zinc-955" /></button>
          </div>
        </div>
      )}

      {/* Step 4: Activity 2: Scenario Day Route */}
      {step === 4 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-yellow-400" />
              <span>Activity 2 – Scenario Day Route &amp; Evaluation</span>
            </h2>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div 
                  key={s} 
                  className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                    capstoneStage === s 
                      ? "bg-yellow-500 border-yellow-500 text-zinc-955 animate-pulse" 
                      : capstoneStage > s 
                        ? "bg-emerald-500 border-emerald-500 text-zinc-955" 
                        : "bg-zinc-950 border-white/5 text-zinc-600"
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {!capstoneSessionId ? (
            <div className="space-y-5 text-left max-w-xl mx-auto w-full">
              <p className="text-xs text-zinc-400 font-bold">Select Scenario Day Route to test drive your B1 Fluency:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: "scenario_a", name: "Travel & Lodge Day", icon: "✈️" },
                  { id: "scenario_b", name: "Campus & Schedule Day", icon: "🏫" },
                  { id: "scenario_c", name: "Weekend & Small Talk", icon: "☕" }
                ].map(sc => (
                  <button
                    key={sc.id}
                    onClick={() => setCapstoneScenario(sc.id)}
                    className={`p-5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      capstoneScenario === sc.id
                        ? "border-yellow-500 bg-yellow-500/10 text-white"
                        : "border-white/5 bg-zinc-950 text-zinc-450 hover:border-white/10"
                    }`}
                  >
                    <span className="text-2xl">{sc.icon}</span>
                    <span className="text-xs font-bold">{sc.name}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleStartCapstoneFull}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-955 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-yellow-500/20"
              >
                <Play className="w-4 h-4 text-zinc-955 fill-zinc-955" /> 
                <span>Start Live Integrated Capstone Dialogue</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-left max-w-2xl mx-auto w-full animate-fade-in">
              
              {/* Stages Indicator */}
              <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl grid grid-cols-4 gap-2 text-[9px] font-black uppercase tracking-widest text-center">
                <span className={capstoneStage >= 1 ? "text-yellow-400 font-bold" : "text-zinc-650"}>1. Task</span>
                <span className={capstoneStage >= 2 ? "text-yellow-400 font-bold" : "text-zinc-650"}>2. Story</span>
                <span className={capstoneStage >= 3 ? "text-yellow-400 font-bold" : "text-zinc-650"}>3. Opinion</span>
                <span className={capstoneStage >= 4 ? "text-yellow-400 font-bold" : "text-zinc-650"}>4. Summary</span>
              </div>

              {/* Chat Log */}
              <div className="bg-zinc-950 rounded-2xl border border-white/10 p-4 h-56 overflow-y-auto space-y-3.5 custom-scrollbar">
                {capstoneMessages.map((msg, idx) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
                      <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                        isUser 
                          ? "bg-yellow-500/10 border border-yellow-500/20 text-white rounded-tr-none" 
                          : "bg-zinc-900 text-zinc-200 rounded-tl-none border border-white/5 font-korean"
                      }`}>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
                {capstoneSending && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/5 flex gap-1.5 items-center">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-500" />
                      <span className="text-[10px] text-zinc-550">Tutor typing...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Connector Hint */}
              <div className="p-3.5 bg-zinc-900 border border-white/5 rounded-xl flex items-center gap-2 text-[10px] text-zinc-400">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping shrink-0" />
                <span>Recommended Connector hint: <strong>~(으)ㄹ까요</strong> (shall we/let's) / <strong>~기 때문에</strong> (because)</span>
              </div>

              {!capstoneFinished ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleRecordCapstoneVoice}
                    disabled={recording || capstoneSending}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      recording ? "bg-red-500/20 border-red-500 text-white animate-pulse" : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    placeholder="Speak or type your B1 Korean reply here..."
                    value={capstoneText}
                    onChange={(e) => setCapstoneText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendCapstoneTurn()}
                    className="flex-grow bg-zinc-900 border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-yellow-500 font-korean"
                  />
                  <button
                    onClick={handleSendCapstoneTurn}
                    disabled={capstoneSending || !capstoneText.trim()}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-955 px-5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {capstoneSending && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-955" />}
                    <span>Send</span>
                  </button>
                  <button
                    onClick={handleFinishCapstone}
                    disabled={finishingCapstone}
                    className="bg-red-950/20 hover:bg-red-900 border border-red-500/20 px-4 rounded-xl text-xs font-bold text-red-400 cursor-pointer"
                  >
                    {finishingCapstone && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Finish</span>
                  </button>
                </div>
              ) : (
                /* holistic score review */
                <div className="p-5 bg-zinc-900 border border-yellow-500/20 rounded-2xl space-y-4 animate-fade-in">
                  <div className="text-emerald-450 font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4.5 h-4.5" /> B1 Fluency Capstone Completed Holistically
                  </div>

                  {capstoneEvaluation && (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-[9px] uppercase font-mono">
                        <div className="bg-zinc-950 p-2.5 rounded border border-white/5">
                          <span className="text-zinc-550 block mb-1">Task</span>
                          <span className="text-white font-black">{capstoneEvaluation.task_completion}%</span>
                        </div>
                        <div className="bg-zinc-950 p-2.5 rounded border border-white/5">
                          <span className="text-zinc-550 block mb-1">Interaction</span>
                          <span className="text-white font-black">{capstoneEvaluation.interaction_skills}%</span>
                        </div>
                        <div className="bg-zinc-950 p-2.5 rounded border border-white/5">
                          <span className="text-zinc-550 block mb-1">Politeness</span>
                          <span className="text-white font-black">{capstoneEvaluation.politeness_register}%</span>
                        </div>
                        <div className="bg-zinc-950 p-2.5 rounded border border-white/5">
                          <span className="text-zinc-550 block mb-1">Fluency</span>
                          <span className="text-white font-black">{capstoneEvaluation.content_fluency}%</span>
                        </div>
                        <div className="bg-zinc-950 p-2.5 rounded border border-white/5 col-span-2 md:col-span-1">
                          <span className="text-zinc-550 block mb-1">Coherence</span>
                          <span className="text-white font-black">{capstoneEvaluation.coherence}%</span>
                        </div>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
                        <p className="text-zinc-400 block font-mono font-bold uppercase tracking-wider text-[9px]">Holistic Evaluation:</p>
                        <p className="text-zinc-300 leading-relaxed italic">{capstoneEvaluation.feedback}</p>
                      </div>
                      
                      <button 
                        onClick={() => setCapstoneSessionId(null)}
                        className="text-[10px] text-yellow-400 hover:underline block mt-1 cursor-pointer font-bold uppercase tracking-wider"
                      >
                        Try another Scenario Route
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 5 Phase 6 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 5 Phase 6 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-955 px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-bold">Move to Quiz <ChevronRight className="w-4 h-4 text-zinc-955" /></button>
          </div>
        </div>
      )}

      {/* Step 5: Activity 3: Strategy Quiz */}
      {step === 5 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span>Mini‑Quiz: Strategy &amp; Fluency Check</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 5 of {totalSteps}</span>
          </div>

          {quizBlueprint.length > 0 && quizBlueprint[quizIdx] && (
            <div className="space-y-6 max-w-xl mx-auto w-full text-left animate-fade-in">
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>Quiz Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span>Type: {quizBlueprint[quizIdx].type}</span>
              </div>

              <h3 className="text-sm md:text-base font-bold text-white text-center leading-relaxed whitespace-pre-line bg-zinc-950 p-5 rounded-2xl border border-white/5">
                {quizBlueprint[quizIdx].question}
              </h3>

              <div className="grid grid-cols-1 gap-2.5 max-w-md mx-auto w-full font-sans">
                {quizBlueprint[quizIdx].options?.map((opt: string) => {
                  let borderStyle = "border-white/5 bg-zinc-900 text-zinc-300 hover:bg-zinc-800";
                  if (quizSelectedOpt === opt) {
                    borderStyle = "border-yellow-500 bg-yellow-500/10 text-white";
                  }
                  if (quizChecked) {
                    if (opt === quizBlueprint[quizIdx].correct_answer) {
                      borderStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                    } else if (quizSelectedOpt === opt) {
                      borderStyle = "border-red-500 bg-red-500/10 text-red-300 font-extrabold";
                    }
                  }
                  return (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                      disabled={quizChecked}
                      className={`p-3.5 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${borderStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {quizChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1.5 animate-fade-in ${
                  quizCorrect ? "bg-green-500/5 border-green-500/20 text-green-300" : "bg-red-500/5 border-red-500/20 text-red-400"
                }`}>
                  
                  <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2 w-full">
                    <p className="font-extrabold text-sm">{quizCorrect ? "✓ Correct!" : "✗ Incorrect."}</p>
                    <button
                      type="button"
                      onClick={() => {
                        const q = quizBlueprint[quizIdx];
                        window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                          detail: {
                            question: q?.question || "Quiz Question",
                            selected_answer: String(quizSelectedOpt || ""),
                            correct_answer: String(q?.correct_answer || q?.correctId || ""),
                            is_correct: !!quizCorrect,
                            explanation: q?.explanation || ""
                          }
                        }));
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-white/5 transition"
                      title="Add to Notes"
                    >
                      + Add to Notes
                    </button>
                  </div>
                  <p className="text-zinc-300">{quizBlueprint[quizIdx].explanation}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 5 Phase 6 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 5 Phase 6 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
                <button onClick={() => setStep(4)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={!quizSelectedOpt}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-955 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-indigo-650 text-white hover:bg-indigo-600 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {finishingQuiz ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : (quizIdx < quizBlueprint.length - 1 ? "Next Question" : "See Capstone Results")}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 6: Activity 4: Exit Interview */}
      {step === 6 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-yellow-400" />
              <span>Activity 4 – Exit Interview with AI Tutor</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 6 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 text-left max-w-2xl mx-auto w-full font-sans">
            <div className="space-y-1">
              <span className="text-[9px] text-yellow-400 font-mono uppercase tracking-widest block font-bold">Course Exit Reflection Room:</span>
              <p className="text-xs text-zinc-400 leading-normal">
                Reflect on your B1 intermediate communicative level. Gwan-Sik will interview you about your strengths and next objectives.
              </p>
            </div>

            {!exitSessionId ? (
              <button
                onClick={handleStartExitInterview}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-955 font-bold py-3 px-4 rounded-xl transition text-xs cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-zinc-955" />
                <span>Begin Exit Interview Session</span>
              </button>
            ) : (
              <div className="space-y-3 w-full animate-fade-in">
                <div className="bg-zinc-900 rounded-xl p-4 border border-white/5 h-44 overflow-y-auto space-y-2.5 custom-scrollbar">
                  {exitMessages.map((msg, idx) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
                        <div className={`max-w-[80%] rounded-xl p-2.5 text-xs leading-relaxed ${
                          isUser ? "bg-yellow-500/10 border border-yellow-500/20 text-white" : "bg-zinc-950 text-zinc-300 border border-white/5"
                        }`}>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {exitSending && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 italic">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-500" />
                      <span>Gwan-Sik is typing...</span>
                    </div>
                  )}
                </div>

                {!exitFinished ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={exitText}
                      onChange={(e) => setExitText(e.target.value)}
                      placeholder="Discuss experience in Korean/English..."
                      onKeyDown={(e) => e.key === "Enter" && handleSendExitTurn()}
                      className="flex-grow bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 font-korean"
                    />
                    <button
                      onClick={handleSendExitTurn}
                      disabled={exitSending || !exitText.trim()}
                      className="bg-yellow-500 hover:bg-yellow-400 text-zinc-955 px-4 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Send
                    </button>
                    <button
                      onClick={handleFinishExit}
                      className="bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-300 px-4 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Finish
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-900 rounded-xl border border-yellow-500/20 text-xs text-zinc-400 animate-fade-in space-y-2">
                    <p className="font-bold text-white">Exit Interview Feedback Report:</p>
                    <p className="leading-relaxed italic">{exitFeedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 5 Phase 6 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 5 Phase 6 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(5)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(7)} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-955 px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-bold">Proceed to Graduation <ChevronRight className="w-4 h-4 text-zinc-955" /></button>
          </div>
        </div>
      )}

      {/* Step 7: Graduation / Completion */}
      {step === 7 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in max-w-3xl mx-auto">
          <div className="p-4 bg-yellow-500/10 rounded-full border border-yellow-500/25 w-fit mx-auto text-yellow-400">
            <Award className="w-10 h-10 animate-bounce" />
          </div>
          
          <div>
            <h2 className="text-3xl font-black text-white font-sans">You are now an Independent B1 User of Korean! 🎓🏆</h2>
            <p className="text-zinc-400 text-sm mt-1.5 font-sans">Congratulations! Move next to Korean 5 (B1&rarr;B2) or review Course 4.</p>
          </div>

          {/* Homework checklist */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-left text-xs space-y-3 font-sans leading-relaxed">
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 block font-sans">Interactive Homework List:</span>
            <div className="space-y-2">
              {homeworkItems.map((item: any) => {
                const isChecked = !!completedHomework[item.id];
                return (
                  <label key={item.id} className="flex items-start gap-3 p-3 bg-zinc-900/45 rounded-lg border border-white/[0.03] cursor-pointer hover:bg-zinc-900 transition">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleHomework(item.id, isChecked)}
                      className="mt-0.5 rounded border-white/10 text-yellow-500 focus:ring-0 focus:ring-offset-0 bg-zinc-950"
                    />
                    <div className="text-zinc-300">
                      <span className="font-bold text-white block mb-0.5 font-sans">
                        {item.id === "hw_b1_cap_1" ? "Task 1: Scenario Writing" : item.id === "hw_b1_cap_2" ? "Task 2: Speech Recording" : "Task 3: Exit Essay"}
                      </span>
                      <span className={isChecked ? "line-through text-zinc-550" : ""}>{item.text}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Badge */}
          <div className="p-5 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-2xl border border-yellow-500/20 text-center space-y-1">
            <div className="flex justify-center items-center gap-1 text-yellow-450 font-extrabold text-sm uppercase">
              <Award className="w-5 h-5" />
              <span>Badge Earned: {quizBadge || "B1 Communicator"}</span>
            </div>
            <div className="flex justify-center gap-4 text-xs font-bold pt-1">
              <span className="text-yellow-450 font-sans">XP +150 Completion Bonus</span>
              <span className="text-zinc-700">|</span>
              <span className="text-amber-400 font-sans">Course 4 Graduate</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 150, type: "correct" } }));
              }onComplete();
            }}
            className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 text-zinc-955 font-black py-4 px-10 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-yellow-500/20 cursor-pointer"
          >
            <span>Complete Capstone &amp; Graduate Course</span>
            <ChevronRight className="w-4 h-4 text-zinc-955" />
          </button>
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
