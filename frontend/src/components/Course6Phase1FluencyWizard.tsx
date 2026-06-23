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
  MessageSquare,
  ArrowRight,
  HelpCircle,
  MessageCircle,
  FileText,
  Bookmark,
  CheckSquare,
  Info,
  TrendingUp,
  Activity,
  Layers,
  List
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

interface Course6Phase1FluencyWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course6Phase1FluencyWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course6Phase1FluencyWizardProps) {
  const phaseNum = 1;
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
    const savedStep = localStorage.getItem("hangeulai_c6p1_step");
    const savedMax = localStorage.getItem("hangeulai_c6p1_max_step");
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
      localStorage.setItem("hangeulai_c6p1_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 8;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Concept C1 micro checkpoint
  const [c1Selected, setC1Selected] = useState<string | null>(null);
  const [c1Checked, setC1Checked] = useState(false);

  // Activity A (Structural parsing)
  const [analysisStory, setAnalysisStory] = useState<any>(null);
  const [selectedEvaluationAns, setSelectedEvaluationAns] = useState<string | null>(null);
  const [act1Checked, setAct1Checked] = useState(false);
  const [act1Correct, setAct1Correct] = useState<boolean | null>(null);

  // Activity B (Story Outline & Improvement)
  const [builderTopic, setBuilderTopic] = useState("A challenge you overcame");
  const [blueprintDrafts, setBlueprintDrafts] = useState<Record<string, string>>({});
  const [builderFeedback, setBuilderFeedback] = useState<any>(null);
  const [buildingDraft, setBuildingDraft] = useState(false);

  // Activity C (Spoken performance & evaluation)
  const [recording, setRecording] = useState(false);
  const [speechEvaluation, setSpeechEvaluation] = useState<any>(null);
  const [submittingSpeech, setSubmittingSpeech] = useState(false);
  
  // AI reflection/examination session
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [aiText, setAiText] = useState("");
  const [aiSending, setAiSending] = useState(false);
  const [aiFinished, setAiFinished] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<any>(null);
  const [finishingLongTurn, setFinishingLongTurn] = useState(false);

  // Activity D (Quiz)
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);
  const [quizBadge, setQuizBadge] = useState<string | null>(null);

  // Activity E (Free practice chat)
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [practiceMessages, setPracticeMessages] = useState<any[]>([]);
  const [practiceText, setPracticeText] = useState("");
  const [practiceSending, setPracticeSending] = useState(false);
  const [practiceFinished, setPracticeFinished] = useState(false);

  
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});
// --- Start Progress State Preservation ---
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hangeulai_c6p1_progress_state");
        if (saved) {
          const state = JSON.parse(saved);
            if (state.step !== undefined) setStep(state.step);
            if (state.maxStep !== undefined) setMaxStep(state.maxStep);
            if (state.c1Selected !== undefined) setC1Selected(state.c1Selected);
            if (state.c1Checked !== undefined) setC1Checked(state.c1Checked);
            if (state.selectedEvaluationAns !== undefined) setSelectedEvaluationAns(state.selectedEvaluationAns);
            if (state.act1Checked !== undefined) setAct1Checked(state.act1Checked);
            if (state.act1Correct !== undefined) setAct1Correct(state.act1Correct);
            if (state.aiText !== undefined) setAiText(state.aiText);
            if (state.aiFinished !== undefined) setAiFinished(state.aiFinished);
            if (state.quizIdx !== undefined) setQuizIdx(state.quizIdx);
            if (state.quizChecked !== undefined) setQuizChecked(state.quizChecked);
            if (state.quizCorrect !== undefined) setQuizCorrect(state.quizCorrect);
            if (state.quizSelectedOpt !== undefined) setQuizSelectedOpt(state.quizSelectedOpt);
            if (state.quizMistakes !== undefined) setQuizMistakes(state.quizMistakes);
            if (state.quizScore !== undefined) setQuizScore(state.quizScore);
            if (state.practiceText !== undefined) setPracticeText(state.practiceText);
            if (state.practiceFinished !== undefined) setPracticeFinished(state.practiceFinished);
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
            selectedEvaluationAns,
            act1Checked,
            act1Correct,
            aiText,
            aiFinished,
            quizIdx,
            quizChecked,
            quizCorrect,
            quizSelectedOpt,
            quizMistakes,
            quizScore,
            practiceText,
            practiceFinished,
            completedHomework
        };
        localStorage.setItem("hangeulai_c6p1_progress_state", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save progress state:", e);
      }
    }
  }, [step, maxStep, c1Selected, c1Checked, selectedEvaluationAns, act1Checked, act1Correct, aiText, aiFinished, quizIdx, quizChecked, quizCorrect, quizSelectedOpt, quizMistakes, quizScore, practiceText, practiceFinished, completedHomework]);
  // --- End Progress State Preservation ---

  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);

  // Graduation Checklist (Step 8)
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  

  // Restore step from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c6p1_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 8) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c6p1_step", String(step));
  }, [step]);

  // Load API Data per Step
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean5/1/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean5/1/core-data");
          setCoreData(res);
        } else if (step === 3 && !analysisStory) {
          const res = await apiJson("/practice/advanced-story/analysis");
          setAnalysisStory(res);
        } else if (step === 6 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean5/phase-1/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 8 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean5/1/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading C1 fluency data:", err);
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

  // Activity A (Structural parsing check)
  const handleCheckActivity1 = () => {
    if (!analysisStory) return;
    // Model correct evaluation sentence target
    const modelTarget = "그때 정말 포기하고 싶을 만큼 절망스러웠습니다. (At that time, I was desperate enough to really want to give up.)";
    const isCorrect = selectedEvaluationAns === modelTarget;

    setAct1Checked(true);
    setAct1Correct(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  // Activity B (Outline & improve draft compilation)
  const handleBuildStoryDraft = async () => {
    setBuildingDraft(true);
    try {
      const res = await apiJson("/practice/advanced-story/build", {
        method: "POST",
        body: JSON.stringify({
          Abstract: blueprintDrafts["Abstract"] || "",
          Orientation: blueprintDrafts["Orientation"] || "",
          ComplicatingAction: blueprintDrafts["ComplicatingAction"] || "",
          Evaluation: blueprintDrafts["Evaluation"] || "",
          Resolution: blueprintDrafts["Resolution"] || "",
          Coda: blueprintDrafts["Coda"] || ""
        })
      });
      setBuilderFeedback(res);
    } catch (e) {
      console.error(e);
    } finally {
      setBuildingDraft(false);
    }
  };

  // Activity C (Continuous monologue spoken coaching)
  const handleRecordMonologue = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      setSubmittingSpeech(true);
      try {
        const res = await apiJson("/practice/advanced-story/monologue-record", {
          method: "POST",
          body: JSON.stringify({
            target_text: "제가 해결해야 했던 가장 큰 도전은 졸업 논문 작성이었습니다.",
            user_audio_base64: "mock_base64"
          })
        });
        setSpeechEvaluation(res);
      } catch (err) {
        console.error(err);
      } finally {
        setSubmittingSpeech(false);
      }
    }, 2500);
  };

  // AI reflection examiner room triggers
  const handleStartAiLongTurn = async () => {
    setAiMessages([]);
    setAiEvaluation(null);
    setAiFinished(false);
    try {
      const res = await apiJson("/conversation/c1/story-longturn/start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: builderTopic })
      });
      setAiSessionId(res.session_id);
      setAiMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") {
        playAudio(res.opener);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendAiTurn = async () => {
    if (!aiText.trim() || !aiSessionId) return;
    const textToSend = aiText;
    setAiText("");
    setAiMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setAiSending(true);

    try {
      const res = await apiJson("/conversation/c1/story-longturn/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setAiMessages((prev) => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") {
        playAudio(res.reply_ko);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiSending(false);
    }
  };

  const handleFinishAiLongTurn = async () => {
    if (!aiSessionId) return;
    setFinishingLongTurn(true);
    try {
      const res = await apiJson("/conversation/c1/story-longturn/finish", { method: "POST" });
      setAiEvaluation(res);
      setAiFinished(true);
    } catch (err) {
      console.error(err);
    } finally {
      setFinishingLongTurn(false);
    }
  };

  // Activity D: Quiz Check
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
      await apiJson("/quiz/korean5/phase-1/answer", {
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
        const res = await apiJson("/quiz/korean5/phase-1/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Advanced Storyteller C1");
        setStep(7); // Proceed to Activity E (Free practice chat)
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  // Activity E: Free practice chat
  const handleStartPractice = async (scen: string) => {
    setPracticeMessages([]);
    setPracticeFeedback(null);
    setPracticeFinished(false);
    try {
      const res = await apiJson("/conversation/c1/story-practice/start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: scen })
      });
      setPracticeSessionId(res.session_id);
      setPracticeMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") {
        playAudio(res.opener);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendPracticeTurn = async () => {
    if (!practiceText.trim() || !practiceSessionId) return;
    const textToSend = practiceText;
    setPracticeText("");
    setPracticeMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setPracticeSending(true);

    try {
      const res = await apiJson("/conversation/c1/story-practice/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setPracticeMessages((prev) => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") {
        playAudio(res.reply_ko);
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
      const res = await apiJson("/conversation/c1/story-practice/finish", { method: "POST" });
      setPracticeFeedback(res.feedback);
      setPracticeFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Step 8: Homework toggle
  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework((prev) => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/phases/korean5/1/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const outlineSteps = [
    { num: 1, label: "Welcome & Goals" },
    { num: 2, label: "Concept: Annotated Monologue" },
    { num: 3, label: "Activity A: Structural Parsing" },
    { num: 4, label: "Activity B: Story Outline Compiler" },
    { num: 5, label: "Activity C: Spoken Monologue Coach" },
    { num: 6, label: "Activity D: Strategy Quiz" },
    { num: 7, label: "Activity E: Story Practice Chat" },
    { num: 8, label: "Phase Graduation" }
  ];

  return (
    <div className="flex-grow flex flex-col justify-between min-h-[75vh] text-zinc-100 font-sans">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <TrendingUp className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Korean 6.1 – Advanced Fluency & Storytelling"}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-brand-500/10 text-brand-300 border border-brand-500/20 rounded-md uppercase tracking-wider">C1 Fluency</span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium">Course 6 &bull; Phase 1</p>
          </div>
        </div>
        
        {/* Active progress bar */}
        <div className="flex items-center space-x-4">
          <div className="w-40 h-3 bg-zinc-950 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 rounded-full transition-all duration-500" 
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
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">Required: 180 XP</span>
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
                      if (courseXP < 0) {
                        window.dispatchEvent(new CustomEvent("hangeulai-warning", {
                          detail: { message: "To start Phase 1, you need at least 0 XP in this course. You currently have " + courseXP + " XP." }
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
          <div className="p-4 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <TrendingUp className="w-10 h-10 animate-pulse shrink-0" />
          </div>
          
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Complex Stories &amp; Ideas</h2>
            <h3 className="text-xl font-extrabold text-brand-450 mt-2">Advanced C1 Fluency</h3>
          </div>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Tell complex stories and ideas smoothly in Korean."}
          </p>

          <div className="bg-zinc-950/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full font-sans">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 C1 Fluency Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Express ideas fluently and spontaneously, with little searching for expressions",
                "Produce clear, well-structured, detailed speech on complex topics (challenges, personal growth)",
                "Analyze an advanced Korean monologue for structure and evaluation",
                "Draft and refine your own C1-level story outline and full text",
                "Perform a spoken version and receive multi-dimensional feedback"
              ]).map((g: string, idx: number) => (
                <li key={idx} className="text-zinc-300">{g}</li>
              ))}
            </ul>
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs border-t border-white/5 mt-4">
              <p><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 45} minutes</p>
              <p><strong>📋 Level:</strong> Advanced C1 (Korean 6.1)</p>
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
                    ? "border-brand-500 bg-brand-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                Text input
              </button>
              <button
                onClick={() => setMode("voice")}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === "voice" 
                    ? "border-brand-500 bg-brand-500/10 text-white" 
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
    if (courseXP < 0) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 1, you need at least 0 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="bg-brand-600 hover:bg-brand-500 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-600/20"
            >
              <span>Start Phase 1</span>
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Concept: Annotated Monologue */}
      {step === 2 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>Concept Screen: Advanced Monologue &amp; Story Arc</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 2 of {totalSteps}</span>
          </div>

          <p className="text-zinc-300 text-xs text-left max-w-2xl mx-auto leading-relaxed">
            Advanced C1 storytelling revolves around structural storytelling models. A complete story arc usually contains: <strong>Orientation (Background context)</strong>, a **Sequence of Events (Complicating Action)**, a core **Evaluation (reflection/feeling)**, and a **Coda (lesson/wrap-up)**.
          </p>

          {coreData?.annotated_monologue && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 text-left max-w-3xl mx-auto w-full">
              <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-white/5">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-zinc-550 uppercase tracking-wider block font-mono">C1 Story Monologue:</span>
                  <p className="font-korean text-base font-bold text-white mt-1">{coreData.annotated_monologue.text}</p>
                </div>
                <button
                  onClick={() => playAudio(coreData.annotated_monologue.text)}
                  className="p-3 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/25 text-brand-400 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs shrink-0"
                >
                  <Volume2 className="w-4 h-4" /> Listen
                </button>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-mono">English Translation:</span>
                <p className="text-zinc-300 text-xs leading-relaxed italic">"{coreData.annotated_monologue.translation}"</p>
              </div>
            </div>
          )}

          {/* Micro-reflection Question */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl mx-auto w-full text-left font-sans">
            <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest block font-mono">Micro Checkpoint C1</span>
            <p className="text-sm font-bold text-white">From the English translation, which sentence sounds like the main evaluation or lesson of the story?</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: "A", text: "At that time, I was desperate enough to really want to give up." },
                { id: "B", text: "But I studied every day and successfully passed the examination." },
                { id: "C", text: "Next week, I am going to celebrate with my family." }
              ].map((opt) => {
                let borderStyle = "border-white/5 bg-zinc-900/60 text-zinc-300";
                if (c1Selected === opt.id) {
                  borderStyle = "border-brand-500 bg-brand-500/10 text-white";
                }
                if (c1Checked) {
                  if (opt.id === "A") {
                    borderStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                  } else if (c1Selected === opt.id) {
                    borderStyle = "border-red-500 bg-red-500/10 text-red-300 font-extrabold";
                  }
                }
                return (
                  <button
                    key={opt.id}
                    disabled={c1Checked}
                    onClick={() => setC1Selected(opt.id)}
                    className={`py-3 px-4 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${borderStyle}`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {c1Checked && (
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl text-xs text-left animate-fade-in text-green-300 font-sans">
                <p className="font-extrabold mb-1">✓ Correct!</p>
                <p>The sentence expressing feeling, desperation, or meaning ("절망스러웠습니다") represents the **Evaluation** stage of the story. C1 learners must clearly label their subjective evaluations to differentiate their speaking from simple factual B1 descriptions.</p>
              </div>
            )}

            {!c1Checked && (
              <button
                onClick={handleC1Check}
                disabled={!c1Selected}
                className="w-full py-2.5 bg-brand-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition cursor-pointer"
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
                    question: `Course 6 Phase 1 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 1 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-650 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4 text-white" /></button>
          </div>
        </div>
      )}

      {/* Step 3: Activity A: Structural parsing */}
      {step === 3 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity A – Structural Parsing Challenge</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 3 of {totalSteps}</span>
          </div>

          {analysisStory && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6 text-left max-w-3xl mx-auto w-full animate-fade-in font-sans">
              
              <div className="space-y-3">
                <span className="text-xs font-bold text-white block">Click or select the sentence expressing the speaker's main Evaluation:</span>
                
                <div className="flex flex-col gap-2">
                  {analysisStory.paragraphs?.map((p: any) => {
                    let borderStyle = "border-white/5 bg-zinc-900 text-zinc-300 hover:border-brand-500/20";
                    if (selectedEvaluationAns === p.ko) {
                      borderStyle = "border-brand-500 bg-brand-500/10 text-white font-bold";
                    }
                    if (act1Checked) {
                      if (p.ko.includes("절망스러웠습니다")) {
                        borderStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                      } else if (selectedEvaluationAns === p.ko) {
                        borderStyle = "border-red-500 bg-red-500/10 text-red-300";
                      }
                    }
                    return (
                      <button
                        key={p.ko}
                        disabled={act1Checked}
                        onClick={() => setSelectedEvaluationAns(p.ko)}
                        className={`p-3.5 rounded-xl border text-left text-xs transition cursor-pointer font-korean ${borderStyle}`}
                      >
                        {p.ko}
                      </button>
                    );
                  })}
                </div>
              </div>

              {act1Checked && (
                <div className={`p-4 rounded-xl text-xs text-left animate-fade-in border ${
                  act1Correct ? "bg-green-500/5 border-green-500/20 text-green-300" : "bg-red-500/5 border-red-500/20 text-red-400"
                }`}>
                  <p className="font-extrabold text-sm">{act1Correct ? "✓ Structural parsing matches model!" : "✗ Structural parsing mismatch."}</p>
                  <p className="text-zinc-300 mt-1">Reflecting on emotional and cognitive weight is the signature of high-level discourse parsing.</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!act1Checked ? (
                  <button
                    onClick={handleCheckActivity1}
                    disabled={!selectedEvaluationAns}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-6 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Evaluation
                  </button>
                ) : (
                  <button
                    onClick={() => setStep(4)}
                    className="bg-emerald-500 text-zinc-955 hover:bg-emerald-450 px-5 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Proceed to Story Builder
                  </button>
                )}
              </div>

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 6 Phase 1 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 1 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => {
    if (courseXP < 0) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 1, you need at least 0 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-bold">Move to Builder <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 4: Activity B: Story Outline Compiler */}
      {step === 4 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity B – Outline and Improve Story</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 4 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-5 text-left max-w-3xl mx-auto w-full animate-fade-in font-sans">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white block">Select your Narrative Topic:</span>
              <select 
                value={builderTopic} 
                onChange={(e) => setBuilderTopic(e.target.value)}
                className="bg-zinc-900 border border-white/10 text-zinc-300 rounded-lg text-xs px-3 py-1.5 focus:outline-none"
              >
                <option>A challenge you overcame</option>
                <option>A time a plan changed</option>
                <option>A project or goal you worked on</option>
                <option>A memorable trip or event</option>
              </select>
            </div>

            {/* Input stages */}
            <div className="space-y-3.5 max-h-[170px] overflow-y-auto pr-1">
              {[
                { stage: "Abstract", hint: "Summary of story" },
                { stage: "Orientation", hint: "Background (who, when, where)" },
                { stage: "ComplicatingAction", hint: "Main turning point / conflict" },
                { stage: "Evaluation", hint: "Subjective meaning & feelings" },
                { stage: "Resolution", hint: "Outcome / final result" },
                { stage: "Coda", hint: "Lesson for the future" }
              ].map((item) => (
                <div key={item.stage} className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider font-mono">{item.stage} ({item.hint}):</span>
                  <input
                    type="text"
                    placeholder={`e.g. Write details for ${item.stage}`}
                    value={blueprintDrafts[item.stage] || ""}
                    onChange={(e) => setBlueprintDrafts(prev => ({ ...prev, [item.stage]: e.target.value }))}
                    className="w-full bg-zinc-900 border border-white/5 focus:border-brand-500 outline-none p-2.5 rounded-xl text-xs text-white"
                  />
                </div>
              ))}
            </div>

            {builderFeedback && (
              <div className="p-4 bg-zinc-900 border border-indigo-500/20 rounded-xl space-y-3.5 text-xs animate-fade-in leading-relaxed">
                <p className="text-emerald-450 font-bold">✓ Outline compiled successfully</p>
                <div>
                  <strong className="text-white block mb-0.5">Discourse suggestions:</strong>
                  <ul className="list-disc list-inside space-y-1 text-zinc-300 font-sans pl-1">
                    {builderFeedback.suggestions?.map((sug: string, idx: number) => (
                      <li key={idx}>{sug}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                onClick={handleBuildStoryDraft}
                disabled={Object.keys(blueprintDrafts).length < 2 || buildingDraft}
                className="bg-brand-500 hover:bg-brand-650 disabled:opacity-40 text-white px-5 py-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                {buildingDraft && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                <span>Compile Outline</span>
              </button>
            </div>

          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 6 Phase 1 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 1 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-bold">Move to Speaking <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 5: Activity C: Spoken performance & evaluation */}
      {step === 5 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Mic className="w-6 h-6 text-brand-400" />
              <span>Activity C – Continuous Monologue Coach</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 5 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6 text-left max-w-2xl mx-auto w-full animate-fade-in font-sans">
            
            <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl text-center space-y-3">
              <span className="text-xs text-zinc-350 block">
                Record your C1 story continuous monologue. Use advanced logical connectors (예: 그럼에도 불구하고, 그렇기 때문에) and elaborate on orientation, complications, and evaluation.
              </span>
              <button
                onClick={handleRecordMonologue}
                disabled={recording || submittingSpeech}
                className={`py-3.5 px-6 rounded-xl border transition flex items-center justify-center gap-2.5 font-bold text-xs mx-auto cursor-pointer ${
                  recording 
                    ? "border-red-500 bg-red-500/10 text-white animate-pulse" 
                    : "border-brand-500 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{recording ? "Recording... (Speak now)" : "Record Spoken Monologue"}</span>
              </button>
            </div>

            {submittingSpeech && (
              <div className="flex items-center gap-2 justify-center text-xs text-zinc-500 font-sans">
                <Loader2 className="w-4 h-4 animate-spin text-brand-500" /> Analyzing discourse coherence metrics...
              </div>
            )}

            {speechEvaluation && (
              <div className="p-4 bg-zinc-900 border border-brand-500/20 rounded-xl space-y-3 animate-fade-in">
                <span className="text-emerald-450 font-bold block text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4.5 h-4.5" /> Story evaluation completed successfully
                </span>
                <div>
                  <span className="text-[9px] text-zinc-550 uppercase tracking-widest font-mono block">ASR Transcribed Text:</span>
                  <p className="font-korean text-xs text-white bg-zinc-950 p-2.5 rounded border border-white/5 mt-1 leading-relaxed">"{speechEvaluation.transcribed_text}"</p>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-550 uppercase tracking-widest font-mono block">Speech Coach comments:</span>
                  <p className="text-xs text-zinc-300 leading-relaxed mt-1">{speechEvaluation.feedback}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setStep(6)}
                className="bg-brand-500 hover:bg-brand-655 text-white px-6 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Proceed to Strategy Quiz
              </button>
            </div>

          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 6 Phase 1 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 1 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(4)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(6)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-bold">Move to Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 6: Activity D: Strategy quiz */}
      {step === 6 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Mini-Quiz: C1 Strategy &amp; Discourse Logic</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 6 of {totalSteps}</span>
          </div>

          {quizBlueprint.length > 0 && quizBlueprint[quizIdx] && (
            <div className="space-y-6 max-w-xl mx-auto w-full text-left animate-fade-in">
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>Quiz Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span>Type: C1 Discourse Strategy</span>
              </div>

              <h3 className="text-sm md:text-base font-bold text-white text-center leading-relaxed whitespace-pre-line bg-zinc-950 p-5 rounded-2xl border border-white/5">
                {quizBlueprint[quizIdx].question}
              </h3>

              <div className="grid grid-cols-1 gap-2.5 max-w-md mx-auto w-full font-sans">
                {quizBlueprint[quizIdx].options?.map((opt: string) => {
                  let borderStyle = "border-white/5 bg-zinc-900 text-zinc-300 hover:bg-zinc-800";
                  if (quizSelectedOpt === opt) {
                    borderStyle = "border-brand-500 bg-brand-500/10 text-white";
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
                    question: `Course 6 Phase 1 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 1 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
                <button onClick={() => setStep(5)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={!quizSelectedOpt}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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

      {/* Step 7: Activity E: Free story practice & feedback */}
      {step === 7 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-brand-400" />
              <span>Activity E – AI Story Practice Room</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 7 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 text-left max-w-2xl mx-auto w-full font-sans">
            <div className="space-y-1">
              <span className="text-[9px] text-brand-400 font-mono uppercase tracking-widest block font-bold">Extra AI Discourse Lab:</span>
              <p className="text-xs text-zinc-400 leading-normal">
                Exercise your storytelling and logic-building on the fly. Elaborate on complex life experiences or values.
              </p>
            </div>

            {!practiceSessionId ? (
              <button
                onClick={() => handleStartPractice("life_change")}
                className="w-full bg-brand-500 hover:bg-brand-655 text-white font-bold py-3 px-4 rounded-xl transition text-xs cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-white" />
                <span>Launch Storytelling Practice Session</span>
              </button>
            ) : (
              <div className="space-y-3 w-full animate-fade-in">
                <div className="bg-zinc-900 rounded-xl p-4 border border-white/5 h-44 overflow-y-auto space-y-2.5 custom-scrollbar">
                  {practiceMessages.map((msg, idx) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
                        <div className={`max-w-[80%] rounded-xl p-2.5 text-xs leading-relaxed ${
                          isUser ? "bg-brand-500 text-white" : "bg-zinc-950 text-zinc-300 border border-white/5"
                        }`}>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {practiceSending && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 italic">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                      <span>Gwan-Sik is typing...</span>
                    </div>
                  )}
                </div>

                {!practiceFinished ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={practiceText}
                      onChange={(e) => setPracticeText(e.target.value)}
                      placeholder="Type your story block or reply in Korean..."
                      onKeyDown={(e) => e.key === "Enter" && handleSendPracticeTurn()}
                      className="flex-grow bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-korean"
                    />
                    <button
                      onClick={handleSendPracticeTurn}
                      disabled={practiceSending || !practiceText.trim()}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Send
                    </button>
                    <button
                      onClick={handleFinishPractice}
                      className="bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-300 px-4 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Finish
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-900 rounded-xl border border-brand-500/20 text-xs text-zinc-400 animate-fade-in space-y-1">
                    <p className="font-bold text-white mb-1">Story Practice Feedback:</p>
                    <p className="leading-relaxed italic">{practiceFeedback || "Excellent C1 advanced fluency & storytelling reflections."}</p>
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
                    question: `Course 6 Phase 1 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 1 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(6)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(8)} className="bg-brand-500 hover:bg-brand-655 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-bold">Proceed to Graduation <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 8: Completion / Graduation */}
      {step === 8 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in max-w-3xl mx-auto">
          <div className="p-4 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400">
            <Award className="w-10 h-10 animate-bounce" />
          </div>
          
          <div>
            <h2 className="text-3xl font-black text-white font-sans">Korean 5.1 Narrative Complete! 🎓🔥</h2>
            <p className="text-zinc-400 text-sm mt-1.5 font-sans">Congratulations on completing Korean 5.1! Excellent C1 advanced fluency &amp; storytelling reflections.</p>
            <p className="text-xs text-zinc-550 mt-1 font-sans">Next: Phase 2 – Idioms &amp; Fixed Expressions for Everyday Topics.</p>
          </div>

          {/* Homework checklist */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-left text-xs space-y-3 font-sans leading-relaxed">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-400 block font-sans">Interactive Homework List:</span>
            <div className="space-y-2">
              {homeworkItems.map((item: any) => {
                const isChecked = !!completedHomework[item.id];
                return (
                  <label key={item.id} className="flex items-start gap-3 p-3 bg-zinc-900/45 rounded-lg border border-white/[0.03] cursor-pointer hover:bg-zinc-900 transition">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleHomework(item.id, isChecked)}
                      className="mt-0.5 rounded border-white/10 text-brand-500 focus:ring-0 focus:ring-offset-0 bg-zinc-950"
                    />
                    <div className="text-zinc-300">
                      <span className="font-bold text-white block mb-0.5 font-sans">
                        {item.id === "hw_c1_fl_1" ? "Task 1: Written Narrative" : item.id === "hw_c1_fl_2" ? "Task 2: Speech Recording" : "Task 3: Narrative Reflection"}
                      </span>
                      <span className={isChecked ? "line-through text-zinc-500" : ""}>{item.text}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Rewards */}
          <div className="p-5 bg-gradient-to-r from-brand-500/10 to-emerald-500/10 rounded-2xl border border-brand-500/20 text-center space-y-1">
            <div className="flex justify-center items-center gap-1 text-brand-400 font-extrabold text-sm uppercase">
              <Award className="w-5 h-5" />
              <span>Badge Earned: {quizBadge || "Advanced Storyteller C1"}</span>
            </div>
            <div className="flex justify-center gap-4 text-xs font-bold pt-1">
              <span className="text-brand-450 font-sans">XP +150 Completion Bonus</span>
              <span className="text-zinc-700">|</span>
              <span className="text-emerald-400 font-sans">Phase 1 Complete</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 150, type: "correct" } }));
              }onComplete();
            }}
            className="bg-gradient-to-r from-brand-500 to-emerald-500 hover:from-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/20 cursor-pointer"
          >
            <span>Complete Phase 1 &amp; Continue</span>
            <ChevronRight className="w-4 h-4 text-white" />
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
