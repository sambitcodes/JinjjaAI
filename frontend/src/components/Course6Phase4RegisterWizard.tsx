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
  Layers,
  ArrowRight,
  RefreshCw,
  CheckSquare,
  Bookmark,
  BarChart2,
  HelpCircle
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

interface Course6Phase4RegisterWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course6Phase4RegisterWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course6Phase4RegisterWizardProps) {
  const phaseNum = 4;
  const getStepMaxXP = (sNum: number) => {
    try {
      return (xpAudit as any)["6"]?.[phaseNum.toString()]?.steps?.[sNum.toString()]?.max_xp ?? 35;
    } catch (e) {
      return 35;
    }
  };
  const getStepXP = (sNum: number) => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(`hangeulai_c6p${phaseNum}_s${sNum}_earned_xp`) || "0", 10);
  };

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c6p4_step");
    const savedMax = localStorage.getItem("hangeulai_c6p4_max_step");
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
      localStorage.setItem("hangeulai_c6p4_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 8;

  // Data loaded
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);
  const [recognitionData, setRecognitionData] = useState<any>(null);
  const [rewriteData, setRewriteData] = useState<any>(null);

  // Concept Check Reflection (Step 2)
  const [conceptCheckAnswer, setConceptCheckAnswer] = useState<string | null>(null);
  const [conceptCheckChecked, setConceptCheckChecked] = useState(false);

  // Activity 1: Recognition (Step 3)
  const [activeRecIdx, setActiveRecIdx] = useState(0);
  const [selectedRegister, setSelectedRegister] = useState<string | null>(null);
  const [recChecked, setRecChecked] = useState(false);
  const [recCorrect, setRecCorrect] = useState<boolean | null>(null);

  // Activity 2: Context Match (Step 4)
  const [activeCmIdx, setActiveCmIdx] = useState(0);
  const [selectedCmOption, setSelectedCmOption] = useState<string | null>(null);
  const [cmChecked, setCmChecked] = useState(false);
  const [cmCorrect, setCmCorrect] = useState<boolean | null>(null);
  const [cmExplanation, setCmExplanation] = useState<string | null>(null);

  // Activity 3: Guided Rewrite (Step 5)
  const [activeRwIdx, setActiveRwIdx] = useState(0);
  const [rewriteText, setRewriteText] = useState("");
  const [rwFeedback, setRwFeedback] = useState<any>(null);
  const [submittingRw, setSubmittingRw] = useState(false);

  // Activity 4: Open Coaching (Step 6)
  const [chatStarted, setChatStarted] = useState(false);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [aiText, setAiText] = useState("");
  const [aiSending, setAiSending] = useState(false);
  const [aiFinished, setAiFinished] = useState(false);
  const [aiFinishMsg, setAiFinishMsg] = useState<string | null>(null);
  const [finishingChat, setFinishingChat] = useState(false);

  // Register contrast tab (Step 2)
  const [contrastIdx, setContrastIdx] = useState(0);

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
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Homework AI Coaching practice
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [practiceMessages, setPracticeMessages] = useState<any[]>([]);
  const [practiceText, setPracticeText] = useState("");
  const [practiceSending, setPracticeSending] = useState(false);
  const [practiceFinished, setPracticeFinished] = useState(false);

  // --- Start Progress State Preservation ---
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hangeulai_c6p4_progress_state");
        if (saved) {
          const state = JSON.parse(saved);
            if (state.step !== undefined) setStep(state.step);
            if (state.maxStep !== undefined) setMaxStep(state.maxStep);
            if (state.conceptCheckAnswer !== undefined) setConceptCheckAnswer(state.conceptCheckAnswer);
            if (state.conceptCheckChecked !== undefined) setConceptCheckChecked(state.conceptCheckChecked);
            if (state.activeRecIdx !== undefined) setActiveRecIdx(state.activeRecIdx);
            if (state.selectedRegister !== undefined) setSelectedRegister(state.selectedRegister);
            if (state.recChecked !== undefined) setRecChecked(state.recChecked);
            if (state.recCorrect !== undefined) setRecCorrect(state.recCorrect);
            if (state.activeCmIdx !== undefined) setActiveCmIdx(state.activeCmIdx);
            if (state.selectedCmOption !== undefined) setSelectedCmOption(state.selectedCmOption);
            if (state.cmChecked !== undefined) setCmChecked(state.cmChecked);
            if (state.cmCorrect !== undefined) setCmCorrect(state.cmCorrect);
            if (state.activeRwIdx !== undefined) setActiveRwIdx(state.activeRwIdx);
            if (state.rewriteText !== undefined) setRewriteText(state.rewriteText);
            if (state.aiText !== undefined) setAiText(state.aiText);
            if (state.aiFinished !== undefined) setAiFinished(state.aiFinished);
            if (state.contrastIdx !== undefined) setContrastIdx(state.contrastIdx);
            if (state.quizIdx !== undefined) setQuizIdx(state.quizIdx);
            if (state.quizChecked !== undefined) setQuizChecked(state.quizChecked);
            if (state.quizCorrect !== undefined) setQuizCorrect(state.quizCorrect);
            if (state.quizSelectedOpt !== undefined) setQuizSelectedOpt(state.quizSelectedOpt);
            if (state.quizMistakes !== undefined) setQuizMistakes(state.quizMistakes);
            if (state.quizScore !== undefined) setQuizScore(state.quizScore);
            if (state.completedHomework !== undefined) setCompletedHomework(state.completedHomework);
            if (state.practiceText !== undefined) setPracticeText(state.practiceText);
            if (state.practiceFinished !== undefined) setPracticeFinished(state.practiceFinished);
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
            conceptCheckAnswer,
            conceptCheckChecked,
            activeRecIdx,
            selectedRegister,
            recChecked,
            recCorrect,
            activeCmIdx,
            selectedCmOption,
            cmChecked,
            cmCorrect,
            activeRwIdx,
            rewriteText,
            aiText,
            aiFinished,
            contrastIdx,
            quizIdx,
            quizChecked,
            quizCorrect,
            quizSelectedOpt,
            quizMistakes,
            quizScore,
            completedHomework,
            practiceText,
            practiceFinished
        };
        localStorage.setItem("hangeulai_c6p4_progress_state", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save progress state:", e);
      }
    }
  }, [step, maxStep, conceptCheckAnswer, conceptCheckChecked, activeRecIdx, selectedRegister, recChecked, recCorrect, activeCmIdx, selectedCmOption, cmChecked, cmCorrect, activeRwIdx, rewriteText, aiText, aiFinished, contrastIdx, quizIdx, quizChecked, quizCorrect, quizSelectedOpt, quizMistakes, quizScore, completedHomework, practiceText, practiceFinished]);
  // --- End Progress State Preservation ---

  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);

  // Restore step on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hangeulai_c6p4_step");
      if (saved) {
        setStep(parseInt(saved, 10));
      }
    }
  }, []);

  // Save step on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hangeulai_c6p4_step", step.toString());
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 6,
          phaseNum: 4,
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
          const res = await apiJson("/phases/korean5/4/metadata");
          setMetadata(res);
        }
        if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean5/4/core-data");
          setCoreData(res);
        }
        if ((step === 3 || step === 4) && !recognitionData) {
          const res = await apiJson("/practice/register-style/recognition");
          setRecognitionData(res);
        }
        if (step === 5 && !rewriteData) {
          const res = await apiJson("/practice/register-style/rewrite");
          setRewriteData(res);
        }
        if (step === 7 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean5/phase-4/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        }
        if (step === 8 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean5/4/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading register phase data:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => speakWord(text);

  // Step 2 Concept Check Submission
  const handleCheckConcept = () => {
    if (conceptCheckChecked) return;
    setConceptCheckChecked(true);
    playSFX("correct");
  };

  // Step 3 (Activity 1) Verify Register Recognition
  const handleCheckRec = async () => {
    if (!recognitionData || recChecked) return;
    const item = recognitionData.recognition_items[activeRecIdx];
    const isCorrect = selectedRegister === item.register;

    setRecChecked(true);
    setRecCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");

    try {
      await apiJson("/practice/register-style/recognition/answer", {
        method: "POST",
        body: JSON.stringify({ question_id: item.id, answer: selectedRegister, time_taken_ms: 2000 })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Step 4 (Activity 2) Verify Context Matching
  const handleCheckCm = async () => {
    if (!recognitionData || cmChecked) return;
    const item = recognitionData.context_matching[activeCmIdx];
    setCmChecked(true);

    try {
      const res = await apiJson("/practice/register-style/context-match/submit", {
        method: "POST",
        body: JSON.stringify({ item_id: item.id, selected_option_id: selectedCmOption })
      });
      setCmCorrect(res.is_correct);
      setCmExplanation(res.explanation);
      playSFX(res.is_correct ? "correct" : "wrong");
    } catch (e) {
      console.error(e);
      const isCorrect = selectedCmOption === item.correct_id;
      setCmCorrect(isCorrect);
      setCmExplanation(item.explanation);
      playSFX(isCorrect ? "correct" : "wrong");
    }
  };

  // Step 5 (Activity 3) Verify Guided Rewrite
  const handleSubmitRewrite = async () => {
    if (!rewriteData || !rewriteText.trim() || submittingRw || rwFeedback) return;
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
      playSFX(true ? "correct" : "wrong"); // Counts rewrite feedback as correct registration
    } catch (e) {
      console.error(e);
      setRwFeedback({
        feedback_ko: "제출이 완료되었습니다.",
        feedback_en: "Submission received.",
        model_answer_ko: task.model_answer_ko,
        model_answer_en: task.model_answer_en
      });
      playSFX("correct");
    } finally {
      setSubmittingRw(false);
    }
  };

  // Step 6 (Activity 4) Open coaching AI session
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendAiTurn = async () => {
    if (!aiText.trim() || !aiSessionId || aiSending) return;
    const textToSend = aiText;
    setAiText("");
    setAiMessages(prev => [...prev, { sender: "user", text: textToSend }]);
    setAiSending(true);

    try {
      const res = await apiJson("/conversation/c1/style-switch/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      // The response payload explains the detected register, comment, and one-level-higher version
      const replyFormatted = `Identified: ${res.detected_register || "Casual"}\nComment: ${res.comment || ""}\n\nOne level higher expression:\n${res.higher_version_ko} (${res.higher_version_en})`;
      setAiMessages(prev => [...prev, { sender: "assistant", text: replyFormatted }]);
      if (mode === "voice" && res.higher_version_ko) {
        playAudio(res.higher_version_ko);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiSending(false);
    }
  };

  const handleFinishChat = async () => {
    if (!aiSessionId || finishingChat) return;
    setFinishingChat(true);
    try {
      const res = await apiJson("/conversation/c1/style-switch/finish", { method: "POST" });
      setAiFinishMsg(res.feedback);
      setAiFinished(true);
    } catch (err) {
      console.error(err);
    } finally {
      setFinishingChat(false);
    }
  };

  // Step 7 (Activity 5) Strategy Quiz Verify
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
      await apiJson("/quiz/korean5/phase-4/answer", {
        method: "POST",
        body: JSON.stringify({ question_id: current.id, answer: quizSelectedOpt, time_taken_ms: 2000 })
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
        const res = await apiJson("/quiz/korean5/phase-4/finish", {
          method: "POST",
          body: JSON.stringify({ score, mistakes: quizMistakes })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Style-Smart C1 Communicator");
        setPracticeFeedback(res.coaching_feedback || "Excellent grasp of high-level social codes.");
        setStep(8);
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  // Step 8 Completion: Homework checkbox logs
  const handleToggleHomework = async (id: string, current: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !current }));
    try {
      await apiJson("/phases/korean5/4/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !current })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Step 8 Completion: Homework coaching room
  const handleStartPractice = async () => {
    setPracticeMessages([]);
    setPracticeFeedback(null);
    setPracticeFinished(false);
    try {
      const res = await apiJson("/conversation/c1/style-switch/start", { method: "POST" });
      setPracticeSessionId(res.session_id);
      setPracticeMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") playAudio(res.opener);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendPracticeTurn = async () => {
    if (!practiceText.trim() || !practiceSessionId || practiceSending) return;
    const textToSend = practiceText;
    setPracticeText("");
    setPracticeMessages(prev => [...prev, { sender: "user", text: textToSend }]);
    setPracticeSending(true);

    try {
      const res = await apiJson("/conversation/c1/style-switch/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      const formatStr = `Identified: ${res.detected_register || "Neutral"}\nComment: ${res.comment || ""}\n\nOne level higher:\n${res.higher_version_ko} (${res.higher_version_en})`;
      setPracticeMessages(prev => [...prev, { sender: "assistant", text: formatStr }]);
      if (mode === "voice" && res.higher_version_ko) {
        playAudio(res.higher_version_ko);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPracticeSending(false);
    }
  };

  const handleFinishPractice = async () => {
    if (!practiceSessionId) return;
    try {
      const res = await apiJson("/conversation/c1/style-switch/finish", { method: "POST" });
      setPracticeFeedback(res.feedback);
      setPracticeFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  const outlineSteps = [
    { num: 1, label: "Welcome & Goals" },
    { num: 2, label: "Register & Style Concept" },
    { num: 3, label: "Act 1: Label Register" },
    { num: 4, label: "Act 2: Context Match" },
    { num: 5, label: "Act 3: Guided Rewrite" },
    { num: 6, label: "Act 4: Style Coach" },
    { num: 7, label: "Act 5: Register Quiz" },
    { num: 8, label: "Graduation & Wrap-up" }
  ];

  return (
    <div className="flex-grow flex flex-col justify-between">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <Layers className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Korean 6.4 – High-Level Register & Style"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Register, Style & Social Switching</p>
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

      {showOutline && (() => {
        const phaseEarnedXP = outlineSteps.reduce((acc, s) => acc + getStepXP(s.num), 0);
        const phaseMaxXP = outlineSteps.reduce((acc, s) => acc + getStepMaxXP(s.num), 0);
        return (
          <div className="mb-6 p-5 bg-zinc-955/80 rounded-3xl border border-white/5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 relative z-30">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 font-mono">Curriculum Syllabus Map</span>
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">Required: 420 XP</span>
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
                      if (courseXP < 240) {
                        window.dispatchEvent(new CustomEvent("hangeulai-warning", {
                          detail: { message: "To start Phase 4, you need at least 240 XP in this course. You currently have " + courseXP + " XP." }
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

      {/* Step 1: Welcome & Goals */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Layers className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight font-sans">Korean 6.4</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Register & Style</h3>
          <p className="text-zinc-400 text-sm italic">“Switching Social Gears”</p>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Switch between casual, neutral, and formal Korean with confidence."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Distinguish register (social level) from style (vocabulary choices)",
                "Recognise casual, neutral, and formal Korean in sentences and short texts",
                "Match Korean sentences to appropriate situational contexts",
                "Rewrite claims into target registers using guidance and model answers"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 40}–45 minutes</p>
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
              onClick={() => {
    if (courseXP < 240) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 4, you need at least 240 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 4</span>
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
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>Register & Style Toolbox</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">Register vs Style definition</p>
            <p className="italic font-serif">
              “Register is who you're talking to and in what context — it sets the social appropriateness level.
               Style is the specific vocabulary and structural choices you make within that register.”
            </p>
          </div>

          {/* Level Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
            {(coreData.register_levels || []).map((lvl: any) => (
              <div key={lvl.id} className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 space-y-2">
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
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[9px] text-zinc-500 italic">"{lvl.example_en}"</p>
                </div>
              </div>
            ))}
          </div>

          {/* Style Contrast */}
          <div className="space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block font-mono">Contrastive Phrase Examples:</span>
            <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
              {(coreData.style_contrast_phrases || []).map((phrase: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setContrastIdx(idx)}
                  className={`text-[10px] px-3 py-1.5 rounded-lg font-bold border transition ${
                    contrastIdx === idx ? "bg-brand-500/20 border-brand-500/40 text-white" : "bg-zinc-900 border-white/5 text-zinc-400"
                  }`}
                >
                  {phrase.concept}
                </button>
              ))}
            </div>
            {coreData.style_contrast_phrases && coreData.style_contrast_phrases[contrastIdx] && (() => {
              const phrase = coreData.style_contrast_phrases[contrastIdx];
              return (
                <div className="space-y-2 animate-fade-in bg-zinc-950 p-4 rounded-2xl border border-white/5">
                  {(["informal", "neutral", "formal"] as const).map((level) => (
                    <div key={level} className="flex items-start gap-3 p-2 bg-zinc-900/40 rounded-xl">
                      <span className={`text-[8px] uppercase font-mono font-black shrink-0 mt-0.5 ${
                        level === "informal" ? "text-accent-pink" : level === "neutral" ? "text-brand-400" : "text-accent-teal"
                      }`}>{level}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-korean text-xs text-zinc-200 font-black leading-snug">{phrase[level]?.ko}</p>
                          <button onClick={() => playAudio(phrase[level]?.ko)} className="text-zinc-500 hover:text-brand-400 transition cursor-pointer shrink-0">
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[9px] text-zinc-500 italic">"{phrase[level]?.en}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Micro-reflection check */}
          <div className="p-4 bg-zinc-900/60 rounded-xl border border-white/5 text-left space-y-3">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-brand-400" />
              <span>Micro-reflection: In your daily life, which register do you use most in Korean?</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {["casual", "neutral", "formal"].map((option) => (
                <button
                  key={option}
                  onClick={() => !conceptCheckChecked && setConceptCheckAnswer(option)}
                  disabled={conceptCheckChecked}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                    conceptCheckAnswer === option 
                      ? "border-brand-500 bg-brand-500/10 text-white" 
                      : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                  }`}
                >
                  <span className="block text-[8px] text-zinc-500 uppercase tracking-widest mb-1 font-mono">{option} Level</span>
                  <span className="font-korean">
                    {option === "casual" && "반말 (Casual / Friends)"}
                    {option === "neutral" && "존댓말 (Neutral / Senior)"}
                    {option === "formal" && "격식체 (Formal / Academic)"}
                  </span>
                </button>
              ))}
            </div>

            {conceptCheckChecked && (
              <div className="p-3 bg-accent-teal/5 border border-accent-teal/20 text-accent-teal text-[11px] rounded-lg animate-fade-in">
                ✓ Preference Registered! As a C1 speaker, you will learn to transition seamlessly between all three depending on the social gear context.
              </div>
            )}

            {!conceptCheckChecked && conceptCheckAnswer && (
              <div className="flex justify-end">
                <button
                  onClick={handleCheckConcept}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Save Reflection
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 6 Phase 4 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 4 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button 
              onClick={() => setStep(3)} 
              disabled={!conceptCheckChecked}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              Start Activity 1 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 3: Activity 1 – Register recognition in sentences */}
      {step === 3 && recognitionData && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-brand-400" />
              <span>Activity A: Label the register</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Sentence {activeRecIdx + 1}/{recognitionData.recognition_items.length}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Analyze target endings and markers:</span>

            <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase">Korean Sentence:</span>
                <button
                  onClick={() => playAudio(recognitionData.recognition_items[activeRecIdx].sentence)}
                  className="p-1 bg-zinc-900 border border-white/5 rounded text-[9px] text-zinc-300 hover:text-white px-2 flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Listen
                </button>
              </div>
              <p className="font-korean text-zinc-100 text-lg leading-relaxed font-black">
                {recognitionData.recognition_items[activeRecIdx].sentence}
              </p>
              <p className="text-xs text-zinc-400 italic">Translation: "{recognitionData.recognition_items[activeRecIdx].translation}"</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-white">Select the register level:</p>
              <div className="grid grid-cols-3 gap-2">
                {["informal", "neutral", "formal"].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => !recChecked && setSelectedRegister(lvl)}
                    disabled={recChecked}
                    className={`p-4 rounded-xl border text-xs font-bold transition capitalize ${
                      selectedRegister === lvl
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                    } ${recChecked && lvl === recognitionData.recognition_items[activeRecIdx].register ? "border-accent-teal bg-accent-teal/5 text-white" : ""}`}
                  >
                    {lvl === "informal" && "Casual / Informal"}
                    {lvl === "neutral" && "Neutral / Polite"}
                    {lvl === "formal" && "Formal / Academic"}
                  </button>
                ))}
              </div>
            </div>

            {recChecked && (
              <div className={`p-4 rounded-xl border text-xs space-y-1.5 animate-fade-in ${recCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                <p className="font-black">{recCorrect ? "✓ Correct Register!" : "✗ Not quite. Review the markers:"}</p>
                <p className="text-zinc-305 leading-normal">{recognitionData.recognition_items[activeRecIdx].explanation}</p>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Key markers: {recognitionData.recognition_items[activeRecIdx].markers.join(", ")}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 6 Phase 4 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 4 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
              <button onClick={() => {
    if (courseXP < 240) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 4, you need at least 240 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
              {!recChecked ? (
                <button
                  onClick={handleCheckRec}
                  disabled={!selectedRegister}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
                      setStep(4);
                    }
                  }}
                  className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {activeRecIdx < recognitionData.recognition_items.length - 1 ? "Next Sentence" : "Proceed to Activity 2"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Activity 2 – Context-register matching */}
      {step === 4 && recognitionData && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-brand-400" />
              <span>Activity B: Which register fits this situation?</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Scenario {activeCmIdx + 1}/{recognitionData.context_matching.length}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Context Scenario:</span>

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
                    borderClass = "border-accent-teal bg-accent-teal/5 text-accent-teal font-black";
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
                    <p className="font-korean text-sm font-black leading-snug">{opt.text}</p>
                  </button>
                );
              })}
            </div>

            {cmChecked && cmExplanation && (
              <div className={`p-4 rounded-xl border text-xs space-y-1 animate-fade-in ${cmCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                <p className="font-black">{cmCorrect ? "✓ Right Context Match!" : "✗ Not the best fit. See why:"}</p>
                <p className="text-zinc-305 leading-normal">{cmExplanation}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 6 Phase 4 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 4 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
              <button onClick={() => setStep(3)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
              {!cmChecked ? (
                <button
                  onClick={handleCheckCm}
                  disabled={!selectedCmOption}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Verify Context Match
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (activeCmIdx < recognitionData.context_matching.length - 1) {
                      setActiveCmIdx(prev => prev + 1);
                      setSelectedCmOption(null);
                      setCmChecked(false);
                      setCmCorrect(null);
                      setCmExplanation(null);
                    } else {
                      setStep(5);
                    }
                  }}
                  className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {activeCmIdx < recognitionData.context_matching.length - 1 ? "Next Context Match" : "Proceed to Activity 3"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Activity 3 – Guided register rewrites */}
      {step === 5 && rewriteData && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-brand-400" />
              <span>Activity C: Rewrite into a target register</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Rewrite {activeRwIdx + 1}/{rewriteData.rewrite_tasks.length}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            {rewriteData.rewrite_tasks[activeRwIdx] && (() => {
              const task = rewriteData.rewrite_tasks[activeRwIdx];
              return (
                <>
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] uppercase tracking-widest font-mono font-bold text-accent-pink">
                        Original Ko ({task.source_register})
                      </span>
                      <button onClick={() => playAudio(task.original_ko)} className="text-zinc-500 hover:text-brand-400 cursor-pointer transition">
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="font-korean text-zinc-200 text-sm font-black leading-relaxed">{task.original_ko}</p>
                    <p className="text-[10px] text-zinc-500 italic">"{task.original_en}"</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase font-black">Target Register:</span>
                    <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest bg-brand-500/10 px-2.5 py-1 rounded border border-brand-500/20">{task.target_register}</span>
                  </div>

                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-white/[0.03] space-y-1">
                    <p className="text-[9px] text-zinc-500 uppercase font-mono font-black">💡 Hints:</p>
                    {task.hints.map((hint: string, i: number) => (
                      <p key={i} className="text-[10px] text-zinc-400">• {hint}</p>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white">Your rewritten response:</label>
                    <textarea
                      value={rewriteText}
                      onChange={e => setRewriteText(e.target.value)}
                      rows={3}
                      placeholder="Type rewritten Korean sentence here..."
                      disabled={!!rwFeedback}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-brand-500/50 resize-none font-korean"
                    />
                  </div>

                  {rwFeedback && (
                    <div className="p-4 bg-brand-500/5 border border-brand-500/15 rounded-xl space-y-3 text-xs animate-fade-in">
                      <p className="font-black text-white">✓ Feedback</p>
                      <p className="text-zinc-300 leading-normal">{rwFeedback.feedback_en}</p>
                      <div className="border-t border-white/5 pt-2.5 space-y-1">
                        <p className="text-[9px] text-zinc-500 uppercase font-mono font-black">Model Answer:</p>
                        <p className="font-korean text-accent-teal font-black text-sm">{rwFeedback.model_answer_ko}</p>
                        <p className="text-zinc-500 italic text-[10px]">"{rwFeedback.model_answer_en}"</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 6 Phase 4 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 4 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
                    <button onClick={() => setStep(4)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
                    {!rwFeedback ? (
                      <button
                        onClick={handleSubmitRewrite}
                        disabled={!rewriteText.trim() || submittingRw}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {submittingRw && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Submit Rewrite</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (activeRwIdx < rewriteData.rewrite_tasks.length - 1) {
                            setActiveRwIdx(prev => prev + 1);
                            setRewriteText("");
                            setRwFeedback(null);
                          } else {
                            setStep(6);
                          }
                        }}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        {activeRwIdx < rewriteData.rewrite_tasks.length - 1 ? "Next Rewrite" : "Proceed to Activity 4"}
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Step 6: Activity 4 – Open register coaching */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity D: Move your sentence “one level up”</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of {totalSteps}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
              <p className="text-xs font-bold text-white flex items-center gap-2"><MessageCircle className="w-4 h-4 text-brand-400" /> Style-Switch AI Coach</p>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Write a Korean sentence at any register level, and the AI coach will identify it, give feedback,
                and show you how to express the same idea one register level higher.
              </p>
            </div>

            {!chatStarted ? (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleStartChat}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-500/20"
                >
                  <Sparkles className="w-4 h-4" /> Start Style-Switch Room
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {aiMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl text-xs leading-relaxed whitespace-pre-line ${
                        msg.sender === "assistant"
                          ? "bg-brand-500/10 border border-brand-500/15 text-zinc-200"
                          : "bg-zinc-900 border border-white/5 text-zinc-300 ml-4 font-korean"
                      }`}
                    >
                      <span className="text-[8px] uppercase font-mono text-zinc-550 block mb-1">
                        {msg.sender === "assistant" ? "AI Coach" : "You"}
                      </span>
                      {msg.text}
                    </div>
                  ))}
                  {aiSending && (
                    <div className="flex items-center gap-2 text-zinc-500 text-xs pl-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Coach is analyzing registers...
                    </div>
                  )}
                </div>

                {!aiFinished && (
                  <div className="flex gap-2">
                    <input
                      value={aiText}
                      onChange={e => setAiText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSendAiTurn()}
                      placeholder="Type in any register level Korean..."
                      className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-brand-500/50 font-korean"
                      disabled={aiSending}
                    />
                    <button
                      onClick={handleSendAiTurn}
                      disabled={!aiText.trim() || aiSending}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl transition cursor-pointer font-bold text-xs"
                    >
                      Analyze
                    </button>
                  </div>
                )}

                {aiFinished && aiFinishMsg && (
                  <div className="p-4 bg-accent-teal/5 border border-accent-teal/20 rounded-xl text-xs text-accent-teal space-y-1.5 animate-fade-in">
                    <p className="font-black">✓ Session Complete!</p>
                    <p className="text-zinc-305 leading-relaxed">{aiFinishMsg}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <div />
                  <div className="flex gap-2">
                    {!aiFinished && aiMessages.length >= 3 && (
                      <button
                        onClick={handleFinishChat}
                        disabled={finishingChat}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {finishingChat && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Finish Coaching</span>
                      </button>
                    )}
                    {aiFinished && (
                      <button
                        onClick={() => setStep(7)}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Proceed to strategy quiz
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 7: Activity 5 – Register strategy quiz */}
      {step === 7 && quizBlueprint.length > 0 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Activity E: Register strategy quiz</span>
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
                      ? "border-brand-500 bg-brand-500/10 text-white" 
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
              <p className="text-zinc-305 leading-normal">{quizBlueprint[quizIdx].explanation}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 6 Phase 4 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 4 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(6)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
            {!quizChecked ? (
              <button
                onClick={handleCheckQuiz}
                disabled={!quizSelectedOpt}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Verify Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuizOrComplete}
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

      {/* Step 8: Completion */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-4 bg-accent-teal/10 rounded-full border border-accent-teal/25 w-fit mx-auto text-accent-teal shrink-0">
            <Award className="w-12 h-12 animate-bounce shrink-0" />
          </div>

          <h2 className="text-3xl font-black text-white">Register & Style Completion</h2>
          <p className="text-xs text-zinc-400">Congratulations! You have completed Phase 4 and earned your style credentials:</p>

          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full flex items-center gap-4 text-left shadow-lg">
            <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/25">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white">Badge Earned: {quizBadge || "Style-Smart C1 Communicator"}</p>
              <p className="text-[10px] text-zinc-400">Graduation Score: {quizScore || 100}% | +150 XP rewarded</p>
            </div>
          </div>

          {practiceFeedback && (
            <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 text-left text-xs max-w-md mx-auto w-full">
              <p className="font-black text-white mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-accent-teal" />
                <span>✓ Coaching Complete!</span>
              </p>
              <p className="text-zinc-350 leading-relaxed">{practiceFeedback}</p>
            </div>
          )}

          {/* Spaced Homework Assignments */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Spaced Homework Recommendations:</span>
            
            <div className="space-y-2">
              {(homeworkItems.length > 0 ? homeworkItems : [
                { id: "hw1", text: "Draft a formal email greeting to a workplace senior speaker." },
                { id: "hw2", text: "Find register differences in casual vs formal Korean news summaries." }
              ]).map((item: any) => (
                <div 
                  key={item.id}
                  onClick={() => handleToggleHomework(item.id, !!completedHomework[item.id])}
                  className="flex items-start gap-3 p-2.5 bg-zinc-900 rounded-xl border border-white/[0.03] hover:border-brand-500/20 transition cursor-pointer"
                >
                  <button className="mt-0.5 shrink-0">
                    <CheckSquare className={`w-4 h-4 ${completedHomework[item.id] ? "text-accent-teal" : "text-zinc-600"}`} />
                  </button>
                  <p className="text-[11px] text-zinc-300 leading-normal">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Coaching practice room */}
          <div className="border-t border-white/5 pt-4 max-w-md mx-auto w-full text-left space-y-3">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">🤖 Spaced AI coaching:</span>
            {!practiceSessionId ? (
              <button
                onClick={handleStartPractice}
                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-white py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-brand-400" /> Start Coaching Practice
              </button>
            ) : (
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3 animate-fade-in">
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {practiceMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl text-[10px] leading-relaxed whitespace-pre-line ${
                        msg.sender === "assistant"
                          ? "bg-brand-500/10 border border-brand-500/15 text-zinc-200"
                          : "bg-zinc-900 border border-white/5 text-zinc-300 ml-4 font-korean"
                      }`}
                    >
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
                      placeholder="Write Korean..."
                      className="flex-grow bg-zinc-900 border border-white/10 p-2 rounded-lg outline-none focus:border-brand-500 text-[10px] text-white font-korean"
                    />
                    <button
                      onClick={handleSendPracticeTurn}
                      disabled={practiceSending || !practiceText.trim()}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Send
                    </button>
                    <button
                      onClick={handleFinishPractice}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border border-white/5"
                    >
                      Done
                    </button>
                  </div>
                )}

                {practiceFinished && practiceFeedback && (
                  <div className="p-2.5 bg-accent-teal/5 border border-accent-teal/20 text-accent-teal text-[10px] rounded-lg animate-fade-in leading-relaxed">
                    {practiceFeedback}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 max-w-xs mx-auto pt-4 border-t border-white/5 w-full">
            <button 
              onClick={() => {
                // Dispatch completion bonus XP
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 150, type: "correct" } }));onComplete();
              }}
              className="bg-accent-teal hover:bg-accent-teal/90 text-zinc-950 font-black py-4 px-8 rounded-xl transition text-base flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-accent-teal/20"
            >
              <span>Graduate Phase 4</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Next: Phase 5 – High‑Speed Listening & Note‑Taking (C1)</p>
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
