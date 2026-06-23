"use client";

import { useEffect, useState, useRef } from "react";
import xpAudit from "../lib/xp-audit.json";
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  BookOpen, 
  Award, 
  Loader2, 
  CheckCircle2, 
  Check, 
  RotateCcw,
  Volume2,
  Mic,
  Activity,
  Play,
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
  const cleanPath = path.startsWith("/pls-lab") ? path : `/pls-lab${path}`;
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

interface Course8Phase2BatchimWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course8Phase2BatchimWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course8Phase2BatchimWizardProps) {
  const phaseNum = 2;
  const getStepMaxXP = (sNum: number) => {
    try {
      return (xpAudit as any)["8"]?.[phaseNum.toString()]?.steps?.[sNum.toString()]?.max_xp ?? 35;
    } catch (e) {
      return 35;
    }
  };
  const getStepXP = (sNum: number) => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(`hangeulai_c8p${phaseNum}_s${sNum}_earned_xp`) || "0", 10);
  };

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c8p2_step");
    const savedMax = localStorage.getItem("hangeulai_c8p2_max_step");
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
      localStorage.setItem("hangeulai_c8p2_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);

  // Loaded data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1A: Batchim Identify
  const [biItems, setBiItems] = useState<any[]>([]);
  const [biIdx, setBiIdx] = useState(0);
  const [biSelected, setBiSelected] = useState<string | null>(null);
  const [biChecked, setBiChecked] = useState(false);
  const [biCorrect, setBiCorrect] = useState<boolean | null>(null);
  const [biExplanation, setBiExplanation] = useState("");

  // Activity 1B: Stop vs Link
  const [slItems, setSlItems] = useState<any[]>([]);
  const [slIdx, setSlIdx] = useState(0);
  const [slSelected, setSlSelected] = useState<string | null>(null);
  const [slChecked, setSlChecked] = useState(false);
  const [slCorrect, setSlCorrect] = useState<boolean | null>(null);
  const [slExplanation, setSlExplanation] = useState("");

  // Activity 1C: Connected speech
  const [csItems, setCsItems] = useState<any[]>([]);
  const [csIdx, setCsIdx] = useState(0);
  const [csSelected, setCsSelected] = useState<string | null>(null);
  const [csChecked, setCsChecked] = useState(false);
  const [csCorrect, setCsCorrect] = useState<boolean | null>(null);
  const [csExplanation, setCsExplanation] = useState("");

  // Activity 2A: Word batchim pronounce
  const [bpItems, setBpItems] = useState<any[]>([]);
  const [bpIdx, setBpIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [bpEvaluated, setBpEvaluated] = useState(false);
  const [bpScore, setBpScore] = useState<number | null>(null);
  const [bpStatus, setBpStatus] = useState("");
  const [bpFeedback, setBpFeedback] = useState("");

  // Activity 2B: Link next syllable
  const [lpItems, setLpItems] = useState<any[]>([]);
  const [lpIdx, setLpIdx] = useState(0);
  const [lpEvaluated, setLpEvaluated] = useState(false);
  const [lpScore, setLpScore] = useState<number | null>(null);
  const [lpStatus, setLpStatus] = useState("");
  const [lpFeedback, setLpFeedback] = useState("");

  // Activity 2C: Careful vs Natural
  const [sfItems, setSfItems] = useState<any[]>([]);
  const [sfIdx, setSfIdx] = useState(0);
  const [sfMode, setSfMode] = useState<"careful" | "natural">("careful");
  const [sfEvaluated, setSfEvaluated] = useState(false);
  const [sfScore, setSfScore] = useState<number | null>(null);
  const [sfBatchim, setSfBatchim] = useState("");
  const [sfLinking, setSfLinking] = useState("");
  const [sfFeedback, setSfFeedback] = useState("");

  // Quiz State
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizExplanation, setQuizExplanation] = useState("");
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Homework State
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [hwSents, setHwSents] = useState<string[]>(["", "", ""]);
  const [hwFeedback, setHwFeedback] = useState<any>(null);
  const [submittingHw, setSubmittingHw] = useState(false);
  const [completingLab, setCompletingLab] = useState(false);

  // --- Start Progress State Preservation ---
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hangeulai_c8p2_progress_state");
        if (saved) {
          const state = JSON.parse(saved);
            if (state.step !== undefined) setStep(state.step);
            if (state.maxStep !== undefined) setMaxStep(state.maxStep);
            if (state.biIdx !== undefined) setBiIdx(state.biIdx);
            if (state.biSelected !== undefined) setBiSelected(state.biSelected);
            if (state.biChecked !== undefined) setBiChecked(state.biChecked);
            if (state.biCorrect !== undefined) setBiCorrect(state.biCorrect);
            if (state.slIdx !== undefined) setSlIdx(state.slIdx);
            if (state.slSelected !== undefined) setSlSelected(state.slSelected);
            if (state.slChecked !== undefined) setSlChecked(state.slChecked);
            if (state.slCorrect !== undefined) setSlCorrect(state.slCorrect);
            if (state.csIdx !== undefined) setCsIdx(state.csIdx);
            if (state.csSelected !== undefined) setCsSelected(state.csSelected);
            if (state.csChecked !== undefined) setCsChecked(state.csChecked);
            if (state.csCorrect !== undefined) setCsCorrect(state.csCorrect);
            if (state.bpIdx !== undefined) setBpIdx(state.bpIdx);
            if (state.bpScore !== undefined) setBpScore(state.bpScore);
            if (state.bpStatus !== undefined) setBpStatus(state.bpStatus);
            if (state.lpIdx !== undefined) setLpIdx(state.lpIdx);
            if (state.lpScore !== undefined) setLpScore(state.lpScore);
            if (state.lpStatus !== undefined) setLpStatus(state.lpStatus);
            if (state.sfIdx !== undefined) setSfIdx(state.sfIdx);
            if (state.sfScore !== undefined) setSfScore(state.sfScore);
            if (state.quizIdx !== undefined) setQuizIdx(state.quizIdx);
            if (state.quizSelected !== undefined) setQuizSelected(state.quizSelected);
            if (state.quizChecked !== undefined) setQuizChecked(state.quizChecked);
            if (state.quizCorrect !== undefined) setQuizCorrect(state.quizCorrect);
            if (state.quizMistakes !== undefined) setQuizMistakes(state.quizMistakes);
            if (state.quizScore !== undefined) setQuizScore(state.quizScore);
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
            biIdx,
            biSelected,
            biChecked,
            biCorrect,
            slIdx,
            slSelected,
            slChecked,
            slCorrect,
            csIdx,
            csSelected,
            csChecked,
            csCorrect,
            bpIdx,
            bpScore,
            bpStatus,
            lpIdx,
            lpScore,
            lpStatus,
            sfIdx,
            sfScore,
            quizIdx,
            quizSelected,
            quizChecked,
            quizCorrect,
            quizMistakes,
            quizScore
        };
        localStorage.setItem("hangeulai_c8p2_progress_state", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save progress state:", e);
      }
    }
  }, [step, maxStep, biIdx, biSelected, biChecked, biCorrect, slIdx, slSelected, slChecked, slCorrect, csIdx, csSelected, csChecked, csCorrect, bpIdx, bpScore, bpStatus, lpIdx, lpScore, lpStatus, sfIdx, sfScore, quizIdx, quizSelected, quizChecked, quizCorrect, quizMistakes, quizScore]);
  // --- End Progress State Preservation ---

  const [completionData, setCompletionData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/2/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/2/core-data");
          setCoreData(res);
        } else if (step === 3) {
          if (biItems.length === 0) {
            const resBi = await apiJson("/phase-2/items/batchim-identify");
            setBiItems(resBi);
          }
          if (slItems.length === 0) {
            const resSl = await apiJson("/phase-2/items/stop-vs-link");
            setSlItems(resSl);
          }
          if (csItems.length === 0) {
            const resCs = await apiJson("/phase-2/items/connected-speech");
            setCsItems(resCs);
          }
        } else if (step === 4) {
          if (bpItems.length === 0) {
            const resBp = await apiJson("/phase-2/items/batchim-pronounce");
            setBpItems(resBp);
          }
          if (lpItems.length === 0) {
            const resLp = await apiJson("/phase-2/items/linking-pronounce");
            setLpItems(resLp);
          }
          if (sfItems.length === 0) {
            const resSf = await apiJson("/phase-2/items/sentence-flow");
            setSfItems(resSf);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/phase-2/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-2/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading PLS Lab Phase 2:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1A check
  const handleCheckBi = async () => {
    const current = biItems[biIdx];
    if (!current || !biSelected) return;
    try {
      const res = await apiJson("/phase-2/items/batchim-identify/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: biSelected })
      });
      setBiCorrect(res.correct);
      setBiChecked(true);
      setBiExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextBi = () => {
    setBiSelected(null);
    setBiChecked(false);
    setBiCorrect(null);
    setBiExplanation("");
    if (biIdx < biItems.length - 1) {
      setBiIdx(prev => prev + 1);
    }
  };

  // Activity 1B check
  const handleCheckSl = async () => {
    const current = slItems[slIdx];
    if (!current || !slSelected) return;
    try {
      const res = await apiJson("/phase-2/items/stop-vs-link/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: slSelected })
      });
      setSlCorrect(res.correct);
      setSlChecked(true);
      setSlExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextSl = () => {
    setSlSelected(null);
    setSlChecked(false);
    setSlCorrect(null);
    setSlExplanation("");
    if (slIdx < slItems.length - 1) {
      setSlIdx(prev => prev + 1);
    }
  };

  // Activity 1C check
  const handleCheckCs = async () => {
    const current = csItems[csIdx];
    if (!current || !csSelected) return;
    try {
      const res = await apiJson("/phase-2/items/connected-speech/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: csSelected })
      });
      setCsCorrect(res.correct);
      setCsChecked(true);
      setCsExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextCs = () => {
    setCsSelected(null);
    setCsChecked(false);
    setCsCorrect(null);
    setCsExplanation("");
    if (csIdx < csItems.length - 1) {
      setCsIdx(prev => prev + 1);
    }
  };

  // Activity 2A Record & Evaluate Simulation
  const handleRecordBp = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = bpItems[bpIdx];
      try {
        const res = await apiJson("/phase-2/items/batchim-pronounce/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: current.id, audio_base64: "mock_data" })
        });
        setBpScore(res.score);
        setBpStatus(res.status);
        setBpFeedback(res.feedback);
        setBpEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleNextBp = () => {
    setBpScore(null);
    setBpStatus("");
    setBpFeedback("");
    setBpEvaluated(false);
    if (bpIdx < bpItems.length - 1) {
      setBpIdx(prev => prev + 1);
    }
  };

  // Activity 2B Record & Evaluate Linking
  const handleRecordLp = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = lpItems[lpIdx];
      try {
        const res = await apiJson("/phase-2/items/linking-pronounce/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: current.id, audio_base64: "mock_data" })
        });
        setLpScore(res.score);
        setLpStatus(res.linking_status);
        setLpFeedback(res.feedback);
        setLpEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleNextLp = () => {
    setLpScore(null);
    setLpStatus("");
    setLpFeedback("");
    setLpEvaluated(false);
    if (lpIdx < lpItems.length - 1) {
      setLpIdx(prev => prev + 1);
    }
  };

  // Activity 2C Record Careful vs Natural
  const handleRecordSf = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = sfItems[sfIdx];
      try {
        const res = await apiJson("/phase-2/items/sentence-flow/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: current.id, audio_base64: "mock_data" })
        });
        setSfScore(res.score);
        setSfBatchim(res.batchim_accuracy);
        setSfLinking(res.linking_rate);
        setSfFeedback(res.feedback);
        setSfEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2500);
  };

  const handleNextSf = () => {
    setSfScore(null);
    setSfBatchim("");
    setSfLinking("");
    setSfFeedback("");
    setSfEvaluated(false);
    setSfMode("careful");
    if (sfIdx < sfItems.length - 1) {
      setSfIdx(prev => prev + 1);
    }
  };

  // Quiz flow
  const handleCheckQuizAnswer = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelected) return;
    try {
      const res = await apiJson("/phase-2/quiz/answer", {
        method: "POST",
        body: JSON.stringify({ question_id: current.id, selected_option: quizSelected })
      });
      setQuizCorrect(res.correct);
      setQuizChecked(true);
      setQuizExplanation(res.explanation);
      if (!res.correct) {
        setQuizMistakes(prev => [...prev, current.id]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextQuiz = async () => {
    setQuizSelected(null);
    setQuizChecked(false);
    setQuizCorrect(null);
    setQuizExplanation("");
    if (quizIdx < quizBlueprint.length - 1) {
      setQuizIdx(prev => prev + 1);
    } else {
      setFinishingQuiz(true);
      try {
        const correctCount = quizBlueprint.length - quizMistakes.length;
        const finalScore = Math.round((correctCount / quizBlueprint.length) * 100);
        await apiJson("/phase-2/quiz/finish", {
          method: "POST",
          body: JSON.stringify({ score: finalScore, mistakes: quizMistakes })
        });
        setQuizScore(finalScore);
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  const handleRestartQuiz = () => {
    setQuizIdx(0);
    setQuizSelected(null);
    setQuizChecked(false);
    setQuizCorrect(null);
    setQuizExplanation("");
    setQuizMistakes([]);
    setQuizScore(null);
  };

  // Homework check
  const handleHwChange = (index: number, val: string) => {
    const updated = [...hwSents];
    updated[index] = val;
    setHwSents(updated);
  };

  const handleSubmitHomework = async () => {
    setSubmittingHw(true);
    try {
      const res = await apiJson("/phase-2/homework/submit", {
        method: "POST",
        body: JSON.stringify({ sentences: hwSents })
      });
      setHwFeedback(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingHw(false);
    }
  };

  const handleCompleteLab = async () => {
    setCompletingLab(true);
    try {
      const res = await apiJson("/phase-2/complete", { method: "POST" });
      setCompletionData(res);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingLab(false);
    }
  };

    const outlineSteps = [
    { num: 1, label: "= 1 ? \"bg-cyan-500\" : \"bg-slate-700\"}`} /> Screen 1: Welcome & Goals Overview" },
    { num: 2, label: "= 2 ? \"bg-teal-500\" : \"bg-slate-700\"}`} /> Screen 2: Concept Explanation: What is Batchim?" },
    { num: 3, label: "= 3 ? \"bg-indigo-500\" : \"bg-slate-700\"}`} /> Screen 3: Activity 1: Hear & Notice Batchim + Linking" },
    { num: 4, label: "= 4 ? \"bg-purple-500\" : \"bg-slate-700\"}`} /> Screen 4: Activity 2: Read & Speak Batchim Words" },
    { num: 5, label: "= 5 ? \"bg-pink-500\" : \"bg-slate-700\"}`} /> Screen 5: Mini-Quiz: Batchim & Linking Check" },
    { num: 6, label: "= 6 ? \"bg-emerald-500\" : \"bg-slate-700\"}`} /> Screen 6: Homework & AI Coach" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 8,
          phaseNum: 2,
          step: step
        }
      }));
    }
  }, [step]);

return (
    <div className="flex-grow flex flex-col justify-between">
      {/* Header bar */}
      <header className="border-b border-white/5 bg-zinc-900/60 backdrop-blur px-8 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="font-black text-xl text-white tracking-tight">Pronunciation Lab 2</h2>
            <p className="text-xs text-zinc-400">Batchim & Linking</p>
          </div>
        </div>

        {/* Dynamic progress bar */}
        <div className="flex-1 max-w-md mx-8 hidden sm:block">
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>Progress</span>
            <span>{Math.round((step / 6) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 h-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
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
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">Required: 260 XP</span>
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
                      if (courseXP < 80) {
                        window.dispatchEvent(new CustomEvent("hangeulai-warning", {
                          detail: { message: "To start Phase 2, you need at least 80 XP in this course. You currently have " + courseXP + " XP." }
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

      {/* Outline panel */}
      

      {/* SCREEN 1: WELCOME */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in relative overflow-hidden">
          <div className="relative mx-auto w-fit">
            <div className="p-4 bg-cyan-500/10 rounded-full border border-cyan-500/25 text-cyan-400">
              <Volume2 className="w-10 h-10" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-brand-500 rounded-full border-2 border-zinc-950">
              <Sparkles className="w-3 h-3 text-white fill-white" />
            </div>
          </div>

          <div>
            <h2 className="text-5xl font-black text-white tracking-tight font-sans">{metadata?.title || "Pronunciation Lab 2 – Batchim & Linking (A1→A2)"}</h2>
            <h3 className="text-2xl font-extrabold text-cyan-400 mt-2">{metadata?.subtitle || "Master final consonants and smooth syllables."}</h3>
          </div>

          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "In this lab, you’ll practise Korean final consonants (받침) and how they link to the next syllable, so listening and speaking feel smoother and more natural."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Focus Milestones:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Hear and pronounce basic batchim sounds clearly",
                "Notice how final consonants link to the next vowel (연음)",
                "Read and say simple batchim words from Korean 1–2 with confidence"
              ]).map((g: string, i: number) => <li key={i}>{g}</li>)}
            </ul>
            <p className="pt-2 text-zinc-400"><strong>⏱️ Est. Lab Time:</strong> 25 minutes</p>
            <p className="text-zinc-400"><strong>🔗 Prerequisites:</strong> {metadata?.dependencies || "Pronunciation Lab 1 (Completed)"}</p>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl mx-auto">
            {["A1→A2", "Batchim", "Listening", "Speaking"].map(chip => (
              <span key={chip} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] text-cyan-300 font-bold">{chip}</span>
            ))}
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => {
    if (courseXP < 80) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 2, you need at least 80 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} 
              className="bg-cyan-500 hover:bg-cyan-450 text-zinc-950 font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Volume2 className="w-4 h-4" /> Start Batchim Lab
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: CONCEPT EXPLANATION */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            What is 받침 & Linking?
          </h2>

          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
              <h3 className="font-bold text-white mb-1">1. Batchim = Final Consonant</h3>
              <p className="text-zinc-400">Batchim is the consonant written at the bottom of a block (like 책 or 밥). In Korean, there are 7 base final sounds: [k], [n], [t], [l], [m], [p], [ng].</p>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
              <h3 className="font-bold text-white mb-1">2. Two Key Behaviors: Stop vs Link</h3>
              <p className="text-zinc-400">
                <strong>Stop:</strong> If isolated or before a consonant, the final consonant is closed and held (e.g. 밥 is [bap]).
                <br />
                <strong>Link (연음):</strong> If followed by a vowel placeholder ㅇ, the consonant links smoothly (e.g. 밥이 is pronounced as 바비 [ba-bi]).
              </p>
            </div>
          </div>

          {/* Interactive Batchim Examples */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200">Interactive Batchim Examples</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(coreData?.batchim_examples || {}).map(([key, data]: any) => (
                <div key={key} className="p-3 bg-zinc-900 border border-white/5 rounded-xl space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-cyan-400">{key}</span>
                    <span className="text-zinc-500 font-mono">{data.sound}</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {data.words.map((w: string) => (
                      <button
                        key={w}
                        onClick={() => playAudio(w)}
                        className="px-2 py-1 bg-zinc-950 border border-white/5 hover:bg-slate-800 transition rounded text-[10px] font-semibold text-zinc-350 cursor-pointer"
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Linking pairs list */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
            <h3 className="text-xs font-bold text-zinc-200">Linking Pairs & Liaisons</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(coreData?.linking_pairs || []).map((pair: any) => (
                <div 
                  key={pair.base}
                  onClick={() => playAudio(pair.linked)}
                  className="p-2.5 bg-zinc-900 border border-white/5 hover:border-teal-500/30 transition rounded-xl text-center cursor-pointer"
                >
                  <div className="font-semibold text-[11px] text-zinc-400">{pair.base}</div>
                  <div className="text-sm font-bold text-teal-300 flex items-center justify-center gap-1 mt-0.5">
                    <span>{pair.linked}</span>
                    <Volume2 className="w-3 h-3 text-cyan-400 shrink-0" />
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{pair.meaning}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button 
              onClick={() => setStep(3)}
              className="flex items-center gap-1 py-2.5 px-6 bg-cyan-500 hover:bg-cyan-450 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Drills
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: ACTIVITY 1: LISTEN & NOTICE BATCHIM + LINKING */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 1: Perception & Liaisons
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Identify final consonants and liaison connectors</h2>
          </div>

          {/* Activity 1A: Batchim Identify */}
          {biItems.length > 0 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Which batchim do you hear?</span>
                <span>Word {biIdx + 1} of {biItems.length}</span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => playAudio(biItems[biIdx]?.word)}
                  className="p-3 bg-cyan-500/20 text-cyan-300 rounded-full hover:bg-cyan-500/30 transition border border-cyan-500/30 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                </button>
                <span className="text-xs text-zinc-400">Listen to word, choose correct spelling:</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {biItems[biIdx]?.options?.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !biChecked && setBiSelected(opt)}
                    className={`py-3 px-2 rounded-xl text-sm font-semibold border transition text-center ${
                      biSelected === opt 
                        ? "border-cyan-500 bg-cyan-500/10 text-white" 
                        : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                    } ${biChecked && opt === biItems[biIdx].correct ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                    disabled={biChecked}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {biChecked && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${biCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                  <strong>{biCorrect ? "Correct!" : "Incorrect."}</strong> {biExplanation}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!biChecked ? (
                  <button
                    onClick={handleCheckBi}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-750 text-xs font-bold rounded-lg text-zinc-200 transition"
                    disabled={!biSelected}
                  >
                    Check Sound
                  </button>
                ) : (
                  biIdx < biItems.length - 1 && (
                    <button
                      onClick={handleNextBi}
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition"
                    >
                      Next Word
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Activity 1B: Stop vs Link */}
          {slItems.length > 0 && biChecked && biIdx === biItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Stop vs Link</span>
                <span>Pair {slIdx + 1} of {slItems.length}</span>
              </div>

              <div className="space-y-3">
                <span className="text-xs text-zinc-450 block">Target batchim base: <strong className="text-cyan-400 text-sm font-bold">{slItems[slIdx].word}</strong></span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => playAudio(slItems[slIdx].phrase_stop)}
                    className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-left hover:bg-slate-800 transition"
                  >
                    <div className="font-bold text-zinc-200 text-xs flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{slItems[slIdx].phrase_stop}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">Wait / Stop sound</span>
                  </button>
                  <button
                    onClick={() => playAudio(slItems[slIdx].phrase_link)}
                    className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-left hover:bg-slate-800 transition"
                  >
                    <div className="font-bold text-zinc-200 text-xs flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                      <span>{slItems[slIdx].phrase_link}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">Links smoothly</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Which sentence contains the linking sound?</span>
                <div className="grid grid-cols-1 gap-2">
                  {[slItems[slIdx].phrase_stop, slItems[slIdx].phrase_link].map(p => (
                    <button
                      key={p}
                      onClick={() => !slChecked && setSlSelected(p)}
                      className={`py-3 px-4 rounded-xl text-xs font-semibold border transition text-left ${
                        slSelected === p 
                          ? "border-teal-500 bg-teal-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                      } ${slChecked && p === slItems[slIdx].correct_link ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                      disabled={slChecked}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {slChecked && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${slCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                  <strong>{slCorrect ? "Correct!" : "Incorrect."}</strong> {slExplanation}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!slChecked ? (
                  <button
                    onClick={handleCheckSl}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-750 text-xs font-bold rounded-lg text-zinc-200 transition"
                    disabled={!slSelected}
                  >
                    Check linking
                  </button>
                ) : (
                  slIdx < slItems.length - 1 && (
                    <button
                      onClick={handleNextSl}
                      className="py-2 px-4 bg-teal-500 hover:bg-teal-450 text-xs font-bold rounded-lg text-white transition"
                    >
                      Next Pair
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Activity 1C: Connected speech */}
          {csItems.length > 0 && slChecked && slIdx === slItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Which sounds connected?</span>
                <span>Phrase {csIdx + 1} of {csItems.length}</span>
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-xs text-zinc-400">Target Phrase:</span>
                <span className="text-base font-bold text-indigo-400">{csItems[csIdx].phrase}</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {csItems[csIdx].options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !csChecked && setCsSelected(opt)}
                    className={`py-3.5 px-4 rounded-xl text-xs font-semibold border transition text-left ${
                      csSelected === opt 
                        ? "border-indigo-500 bg-indigo-500/10 text-white" 
                        : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                    } ${csChecked && opt === csItems[csIdx].correct ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                    disabled={csChecked}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {csChecked && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${csCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                  <strong>{csCorrect ? "Correct!" : "Incorrect."}</strong> {csExplanation}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!csChecked ? (
                  <button
                    onClick={handleCheckCs}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-750 text-xs font-bold rounded-lg text-zinc-200 transition"
                    disabled={!csSelected}
                  >
                    Check Version
                  </button>
                ) : (
                  csIdx < csItems.length - 1 && (
                    <button
                      onClick={handleNextCs}
                      className="py-2 px-4 bg-indigo-500 hover:bg-indigo-450 text-xs font-bold rounded-lg text-white transition"
                    >
                      Next Phrase
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => {
    if (courseXP < 80) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 2, you need at least 80 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button 
              onClick={() => setStep(4)}
              className="flex items-center gap-1 py-2.5 px-6 bg-cyan-500 hover:bg-cyan-450 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Production
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 4: ACTIVITY 2: READ & SPEAK BATCHIM WORDS */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 2: Production & smooth liaisons
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Speak stopped consonants, link words, and control flow</h2>
          </div>

          {/* Activity 2A: Word Batchim Pronounce */}
          {bpItems.length > 0 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Word-level batchim practice</span>
                <span>Word {bpIdx + 1} of {bpItems.length}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Say this word:</span>
                <span className="text-2xl font-black text-cyan-400 hover:underline cursor-pointer" onClick={() => playAudio(bpItems[bpIdx].word)}>
                  {bpItems[bpIdx].word}
                </span>
              </div>

              <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-1.5">
                <p>💡 <span className="font-bold text-zinc-200">Batchim ({bpItems[bpIdx].batchim}):</span> {bpItems[bpIdx].hint}</p>
              </div>

              {bpEvaluated && (
                <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Speech Scorer Status:</span>
                    <span className="font-bold text-cyan-300">{bpStatus} (Score: {bpScore}%)</span>
                  </div>
                  <p className="text-zinc-350 text-[11px] leading-relaxed">{bpFeedback}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  onClick={handleRecordBp}
                  className={`flex items-center gap-1.5 py-2.5 px-6 rounded-xl font-bold transition text-xs cursor-pointer ${
                    recording 
                      ? "bg-red-500 text-white animate-pulse" 
                      : "bg-cyan-500 text-zinc-950 hover:bg-cyan-450"
                  }`}
                  disabled={recording}
                >
                  <Mic className="w-3.5 h-3.5" />
                  {recording ? "Speaking (Hold sound)..." : "Listen & Record"}
                </button>
                {bpEvaluated && bpIdx < bpItems.length - 1 && (
                  <button
                    onClick={handleNextBp}
                    className="py-2 px-4 bg-teal-500 hover:bg-teal-450 text-xs text-white font-bold rounded-lg transition"
                  >
                    Next Word
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2B: Link next syllable */}
          {lpItems.length > 0 && bpEvaluated && bpIdx === bpItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Link to the next syllable</span>
                <span>Phrase {lpIdx + 1} of {lpItems.length}</span>
              </div>

              <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-white/5">
                <div>
                  <span className="text-[10px] text-zinc-550 block uppercase font-bold">Liaison Target:</span>
                  <span className="text-xl font-black text-cyan-300 hover:underline cursor-pointer" onClick={() => playAudio(lpItems[lpIdx].phrase)}>{lpItems[lpIdx].phrase}</span>
                </div>
                <div className="text-[10px] bg-cyan-950/20 text-cyan-400 border border-cyan-500/25 py-1.5 px-3 rounded-lg font-mono">
                  Pronounced: {lpItems[lpIdx].pronounced}
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed pl-1">{lpItems[lpIdx].hint}</p>

              {lpEvaluated && (
                <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Smooth Liaison Rating:</span>
                    <span className="font-bold text-teal-400 uppercase">{lpStatus} ({lpScore}%)</span>
                  </div>
                  <p className="text-[11px] text-zinc-350">{lpFeedback}</p>
                  
                  {/* Liaison Connection Bar Graphic */}
                  <div className="flex items-center gap-2 pt-2 text-[10px] font-mono text-zinc-500">
                    <span>{lpItems[lpIdx].phrase[0]}</span>
                    <span className="flex-1 border-t-2 border-dashed border-teal-500 text-center text-teal-400 font-bold">linked</span>
                    <span>{lpItems[lpIdx].phrase.slice(1)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  onClick={handleRecordLp}
                  className={`flex items-center gap-1.5 py-2.5 px-6 rounded-xl font-bold transition text-xs cursor-pointer ${
                    recording 
                      ? "bg-red-500 text-white animate-pulse" 
                      : "bg-cyan-500 text-zinc-950 hover:bg-cyan-450"
                  }`}
                  disabled={recording}
                >
                  <Mic className="w-3.5 h-3.5" />
                  {recording ? "Speaking (Link smoothly)..." : "Listen & Record"}
                </button>
                {lpEvaluated && lpIdx < lpItems.length - 1 && (
                  <button
                    onClick={handleNextLp}
                    className="py-2.5 px-5 bg-teal-500 text-white font-bold rounded-xl text-xs hover:bg-teal-450 transition cursor-pointer"
                  >
                    Next Phrase
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2C: Careful vs Natural */}
          {sfItems.length > 0 && lpEvaluated && lpIdx === lpItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: From careful to natural flow</span>
                <span>Sentence {sfIdx + 1} of {sfItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Target Sentence:</span>
                  <span className="text-sm font-bold text-white hover:underline cursor-pointer" onClick={() => playAudio(sfItems[sfIdx].sentence)}>{sfItems[sfIdx].sentence}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSfMode("careful")}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
                      sfMode === "careful" ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-white/5 bg-zinc-950 text-zinc-550"
                    }`}
                  >
                    Careful (articulated)
                  </button>
                  <button
                    onClick={() => setSfMode("natural")}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
                      sfMode === "natural" ? "border-teal-500 bg-teal-500/10 text-white" : "border-white/5 bg-zinc-950 text-zinc-550"
                    }`}
                  >
                    Natural (linked)
                  </button>
                </div>

                <p className="text-[11px] text-zinc-400 text-center font-mono">
                  {sfMode === "careful" ? sfItems[sfIdx].careful : sfItems[sfIdx].natural}
                </p>
              </div>

              {sfEvaluated && (
                <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Speech Flow Score:</span>
                    <span className="font-bold text-teal-400">{sfScore}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 bg-zinc-950 border border-white/5 rounded">
                      <span className="text-zinc-500 block uppercase font-bold">Batchim:</span>
                      <span className="text-zinc-350">{sfBatchim}</span>
                    </div>
                    <div className="p-2 bg-zinc-950 border border-white/5 rounded">
                      <span className="text-zinc-500 block uppercase font-bold">Liaisons:</span>
                      <span className="text-zinc-350">{sfLinking}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-350 font-mono mt-1">{sfFeedback}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  onClick={handleRecordSf}
                  className={`flex items-center gap-1.5 py-2.5 px-6 rounded-xl font-bold transition text-xs cursor-pointer ${
                    recording 
                      ? "bg-red-500 text-white animate-pulse" 
                      : "bg-cyan-500 text-zinc-950 hover:bg-cyan-450"
                  }`}
                  disabled={recording}
                >
                  <Mic className="w-3.5 h-3.5" />
                  {recording ? `Recording ${sfMode} mode...` : `Record ${sfMode} mode`}
                </button>
                {sfEvaluated && sfIdx < sfItems.length - 1 && (
                  <button
                    onClick={handleNextSf}
                    className="py-2.5 px-5 bg-teal-500 text-white font-bold rounded-xl text-xs hover:bg-teal-450 transition cursor-pointer"
                  >
                    Next Sentence
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(3)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button 
              onClick={() => setStep(5)}
              className="flex items-center gap-1 py-2.5 px-6 bg-cyan-500 hover:bg-cyan-450 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Quiz
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 5: MINI QUIZ */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Mini-Quiz: Batchim & Linking Check
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Confirm your batchim and linking sound skills</h2>
          </div>

          {quizScore === null ? (
            quizBlueprint.length > 0 ? (
              <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Question {quizIdx + 1} of {quizBlueprint.length}</span>
                  <span className="text-cyan-400 font-bold">{Math.round((quizIdx / quizBlueprint.length) * 100)}% Complete</span>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-bold text-zinc-250 leading-relaxed">
                    {quizBlueprint[quizIdx]?.question}
                  </p>
                  
                  {/* Option list */}
                  <div className="grid grid-cols-1 gap-2 pt-2">
                    {quizBlueprint[quizIdx]?.options?.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !quizChecked && setQuizSelected(opt)}
                        className={`py-3.5 px-4 rounded-xl text-xs font-semibold border transition text-left ${
                          quizSelected === opt 
                            ? "border-cyan-500 bg-cyan-500/10 text-white" 
                            : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                        } ${quizChecked && opt === quizBlueprint[quizIdx].correct_answer ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                        disabled={quizChecked}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {quizChecked && (
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed ${quizCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                    <span className="font-extrabold text-[10px] uppercase tracking-wider">Checkpoint Feedback</span>
                    <button
                      type="button"
                      onClick={() => {
                        const qObj = quizBlueprint[quizIdx];
                        if (!qObj) return;
                        window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                          detail: {
                            question: qObj.question || "Quiz Checkpoint Question",
                            selected_answer: String(quizSelected || ""),
                            correct_answer: String(qObj.correct_answer || ""),
                            is_correct: !!quizCorrect,
                            explanation: qObj.explanation || ""
                          }
                        }));
                      }}
                      className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-white/5 transition cursor-pointer"
                      title="Add this attempt summary to your diary notes"
                    >
                      + Add to Notes
                    </button>
                  </div>
                      <strong>{quizCorrect ? "Correct!" : "Incorrect."}</strong> {quizExplanation}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    {!quizChecked ? (
                      <button
                        onClick={handleCheckQuizAnswer}
                        className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-200 transition"
                        disabled={!quizSelected}
                      >
                        Check Answer
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuiz}
                        className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition"
                      >
                        {quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-cyan-450 animate-spin" />
              </div>
            )
          ) : (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-4 text-center">
              <Award className="w-12 h-12 text-cyan-450 mx-auto" />
              <div>
                <h3 className="font-extrabold text-lg text-white">Quiz Completed!</h3>
                <p className="text-xs text-zinc-400 mt-1">Final Score: <span className="text-cyan-400 font-bold text-sm">{quizScore}%</span></p>
              </div>

              {quizScore >= 80 ? (
                <div className="bg-green-950/20 border border-green-900/50 p-4 rounded-xl text-xs text-green-300 leading-relaxed max-w-sm mx-auto">
                  🎉 Excellent job! You've mastered batchim stops and linking rules. Proceed to homework to record linked phrase submissions.
                </div>
              ) : (
                <div className="bg-orange-950/20 border border-orange-900/50 p-4 rounded-xl text-xs text-orange-300 leading-relaxed max-w-sm mx-auto">
                  Aim for 80% to certify liaison accuracy. You can restart to try again.
                </div>
              )}

              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={handleRestartQuiz}
                  className="flex items-center gap-1 px-4 py-2 bg-zinc-900 border border-white/5 hover:bg-slate-800 rounded-lg text-xs font-bold text-zinc-300 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retry Quiz
                </button>
                <button
                  onClick={() => setStep(6)}
                  className="px-5 py-2 bg-cyan-500 text-zinc-950 hover:bg-cyan-450 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Proceed to Homework
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(4)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button 
              onClick={() => setStep(6)}
              className="flex items-center gap-1 py-2.5 px-6 bg-cyan-500 hover:bg-cyan-450 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Homework
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 6: HOMEWORK & COACH */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Homework & AI Batchim Coach
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Submit linked speech recordings for AI phone analyzer</h2>
          </div>

          <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 text-xs">
            <h3 className="font-bold text-zinc-200 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Liaison Checklist tasks
            </h3>
            <ul className="space-y-2 text-zinc-350 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="p-0.5 bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 rounded mt-0.5">1</span>
                <span>Batchim lists: Read words (밥, 집, 책, 물, 말, 밤, 밖, 공, 한국, 이름, 학생, 책상, 음식).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="p-0.5 bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 rounded mt-0.5">2</span>
                <span>Linked phrases: Record liaisons (한국어, 밥을 먹어요, 물이 있어요).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="p-0.5 bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 rounded mt-0.5">3</span>
                <span>Mini self-intro: Write 3-4 lines with at least 5 batchim words.</span>
              </li>
            </ul>

            <div className="border-t border-white/5 pt-4 space-y-3">
              <p className="text-zinc-400 font-semibold">Type your sentences containing batchim to check linking:</p>
              <div className="space-y-2">
                {hwSents.map((s, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={s}
                    onChange={(e) => handleHwChange(idx, e.target.value)}
                    placeholder={`Sentence ${idx + 1} (e.g., 한국어 공부해요, 밥을 먹어요...)`}
                    className="w-full bg-zinc-900 border border-white/5 p-2.5 rounded-xl text-white placeholder-slate-500 text-xs focus:border-cyan-500 outline-none"
                    disabled={submittingHw || !!hwFeedback}
                  />
                ))}
              </div>
            </div>

            {hwFeedback && (
              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-3 animate-fade-in">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">AI liaison alignment check:</span>
                  <span className="font-bold text-cyan-400">{hwFeedback.overall_score}%</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-bold">Liaison Heatmap:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(hwFeedback.feedback_heatmap).map(([wd, color]) => {
                      const colorClass = color === "green" ? "bg-green-500/10 text-green-300 border-green-500/20" : "bg-amber-500/10 text-amber-300 border-amber-500/20";
                      return (
                        <span key={wd} className={`px-2 py-1 border text-xs font-mono rounded ${colorClass}`}>{wd}</span>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[11px] text-zinc-350 space-y-1">
                  <span className="font-bold text-zinc-200">🔍 Suggested Focus Sounds:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                    {hwFeedback.focus_sounds.map((sound: string, i: number) => <li key={i}>{sound}</li>)}
                  </ul>
                  <p className="mt-1 font-mono text-[10px] text-zinc-450">{hwFeedback.recommendation}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              {!hwFeedback ? (
                <button
                  onClick={handleSubmitHomework}
                  className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-455 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  disabled={submittingHw || hwSents.every(s => !s.trim())}
                >
                  {submittingHw ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
                  Check My Batchim & Linking
                </button>
              ) : (
                <button
                  onClick={() => setHwFeedback(null)}
                  className="py-2 px-4 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 rounded-lg transition cursor-pointer"
                >
                  Reset Coach Input
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(5)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button 
              onClick={handleCompleteLab}
              className="flex items-center gap-1 py-2.5 px-6 bg-green-500 hover:bg-green-450 text-white font-bold rounded-xl transition cursor-pointer shadow-lg shadow-green-500/20"
              disabled={completingLab}
            >
              {completingLab ? "Completing..." : "Complete Batchim Lab"}
              <Check className="w-4 h-4" />
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
                if (typeof setQuizSelected === "function") setQuizSelected(null);
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
