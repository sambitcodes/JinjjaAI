"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  RotateCcw
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
  const cleanPath = (path.startsWith("/phases/") || path.startsWith("/phase-3/")) ? `/grammar-lab${path}` : path;
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

interface Course7Phase3PolitenessWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course7Phase3PolitenessWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course7Phase3PolitenessWizardProps) {
  const phaseNum = 3;
  const getStepMaxXP = (sNum: number) => {
    try {
      return (xpAudit as any)["7"]?.[phaseNum.toString()]?.steps?.[sNum.toString()]?.max_xp ?? 35;
    } catch (e) {
      return 35;
    }
  };
  const getStepXP = (sNum: number) => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(`hangeulai_c7p${phaseNum}_s${sNum}_earned_xp`) || "0", 10);
  };

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c7p3_step");
    const savedMax = localStorage.getItem("hangeulai_c7p3_max_step");
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
      localStorage.setItem("hangeulai_c7p3_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);

  // Loaded data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1: Conjugation
  const [conjItems, setConjItems] = useState<any[]>([]);
  const [conjIdx, setConjIdx] = useState(0);
  const [conjInput, setConjInput] = useState("");
  const [conjChecked, setConjChecked] = useState(false);
  const [conjCorrect, setConjCorrect] = useState<boolean | null>(null);
  const [conjExplanation, setConjExplanation] = useState("");

  // Activity 2: Politeness Transform
  const [transItems, setTransItems] = useState<any[]>([]);
  const [transIdx, setTransIdx] = useState(0);
  const [transInput, setTransInput] = useState("");
  const [transChecked, setTransChecked] = useState(false);
  const [transCorrect, setTransCorrect] = useState<boolean | null>(null);
  const [transExplanation, setTransExplanation] = useState("");

  // Activity 3: Context Choice
  const [contextItems, setContextItems] = useState<any[]>([]);
  const [contextIdx, setContextIdx] = useState(0);
  const [contextSelected, setContextSelected] = useState<string | null>(null);
  const [contextChecked, setContextChecked] = useState(false);
  const [contextCorrect, setContextCorrect] = useState<boolean | null>(null);
  const [contextExplanation, setContextExplanation] = useState("");

  // Activity 4: Dialogue Fix
  const [dialogueItems, setDialogueItems] = useState<any[]>([]);
  const [dialogueIdx, setDialogueIdx] = useState(0);
  const [dialogueInput, setDialogueInput] = useState("");
  const [dialogueChecked, setDialogueChecked] = useState(false);
  const [dialogueCorrect, setDialogueCorrect] = useState<boolean | null>(null);
  const [dialogueExplanation, setDialogueExplanation] = useState("");

  // Interactive Sandbox (Screen 2)
  const [sandboxVerb, setSandboxVerb] = useState("먹다");
  const [sandboxTense, setSandboxTense] = useState("Present");
  const [sandboxLevel, setSandboxLevel] = useState("Polite");

  // Quiz
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizExplanation, setQuizExplanation] = useState("");
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Homework
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [hwSents, setHwSents] = useState<string[]>(["", "", ""]);
  const [hwFeedback, setHwFeedback] = useState<any[]>([]);
  const [submittingHw, setSubmittingHw] = useState(false);
  const [completingLab, setCompletingLab] = useState(false);

  // --- Start Progress State Preservation ---
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hangeulai_c7p3_progress_state");
        if (saved) {
          const state = JSON.parse(saved);
            // Deleted state.step override to allow teleportation
            // Deleted state.maxStep override to allow teleportation
            if (state.conjIdx !== undefined) setConjIdx(state.conjIdx);
            if (state.conjInput !== undefined) setConjInput(state.conjInput);
            if (state.conjChecked !== undefined) setConjChecked(state.conjChecked);
            if (state.conjCorrect !== undefined) setConjCorrect(state.conjCorrect);
            if (state.transIdx !== undefined) setTransIdx(state.transIdx);
            if (state.transInput !== undefined) setTransInput(state.transInput);
            if (state.transChecked !== undefined) setTransChecked(state.transChecked);
            if (state.transCorrect !== undefined) setTransCorrect(state.transCorrect);
            if (state.contextItems !== undefined) setContextItems(state.contextItems);
            if (state.contextIdx !== undefined) setContextIdx(state.contextIdx);
            if (state.contextSelected !== undefined) setContextSelected(state.contextSelected);
            if (state.contextChecked !== undefined) setContextChecked(state.contextChecked);
            if (state.contextCorrect !== undefined) setContextCorrect(state.contextCorrect);
            if (state.contextExplanation !== undefined) setContextExplanation(state.contextExplanation);
            if (state.dialogueIdx !== undefined) setDialogueIdx(state.dialogueIdx);
            if (state.dialogueInput !== undefined) setDialogueInput(state.dialogueInput);
            if (state.dialogueChecked !== undefined) setDialogueChecked(state.dialogueChecked);
            if (state.dialogueCorrect !== undefined) setDialogueCorrect(state.dialogueCorrect);
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
            conjIdx,
            conjInput,
            conjChecked,
            conjCorrect,
            transIdx,
            transInput,
            transChecked,
            transCorrect,
            contextItems,
            contextIdx,
            contextSelected,
            contextChecked,
            contextCorrect,
            contextExplanation,
            dialogueIdx,
            dialogueInput,
            dialogueChecked,
            dialogueCorrect,
            quizIdx,
            quizSelected,
            quizChecked,
            quizCorrect,
            quizMistakes,
            quizScore
        };
        localStorage.setItem("hangeulai_c7p3_progress_state", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save progress state:", e);
      }
    }
  }, [step, maxStep, conjIdx, conjInput, conjChecked, conjCorrect, transIdx, transInput, transChecked, transCorrect, contextItems, contextIdx, contextSelected, contextChecked, contextCorrect, contextExplanation, dialogueIdx, dialogueInput, dialogueChecked, dialogueCorrect, quizIdx, quizSelected, quizChecked, quizCorrect, quizMistakes, quizScore]);
  // --- End Progress State Preservation ---

  const [completionData, setCompletionData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/3/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/3/core-data");
          setCoreData(res);
        } else if (step === 3) {
          if (conjItems.length === 0) {
            const resC = await apiJson("/phase-3/items/conjugation");
            setConjItems(resC);
          }
          if (transItems.length === 0) {
            const resT = await apiJson("/phase-3/items/politeness-transform");
            setTransItems(resT);
          }
        } else if (step === 4) {
          if (contextItems.length === 0) {
            const resCtx = await apiJson("/phase-3/items/context-choice");
            setContextItems(resCtx);
          }
          if (dialogueItems.length === 0) {
            const resD = await apiJson("/phase-3/items/dialogue-fix");
            setDialogueItems(resD);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/phase-3/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-3/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading Grammar Lab Phase 3:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  const getSandboxConjugation = () => {
    const verbInfo = coreData?.verbs?.find((v: any) => v.dictionary === sandboxVerb);
    if (!verbInfo) return null;

    let resVal = "";
    if (sandboxLevel === "Polite") {
      if (sandboxTense === "Present") resVal = verbInfo.present_polite;
      else if (sandboxTense === "Past") resVal = verbInfo.past_polite;
      else resVal = verbInfo.future_polite;
    } else {
      if (sandboxTense === "Present") resVal = verbInfo.present_casual;
      else if (sandboxTense === "Past") resVal = verbInfo.past_casual;
      else resVal = verbInfo.future_casual;
    }

    return {
      result: resVal,
      stem: verbInfo.stem,
      type: verbInfo.type
    };
  };

  const handleCheckConj = async () => {
    const current = conjItems[conjIdx];
    if (!current || !conjInput) return;
    try {
      const res = await apiJson("/phase-3/items/conjugation/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, user_input: conjInput })
      });
      setConjCorrect(res.correct);
      setConjChecked(true);
      setConjExplanation(res.explanation);
      if (res.correct) {
        playAudio(conjInput);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextConj = () => {
    setConjInput("");
    setConjChecked(false);
    setConjCorrect(null);
    setConjExplanation("");
    if (conjIdx < conjItems.length - 1) {
      setConjIdx(prev => prev + 1);
    }
  };

  const handleCheckTrans = async () => {
    const current = transItems[transIdx];
    if (!current || !transInput) return;
    try {
      const res = await apiJson("/phase-3/items/politeness-transform/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, user_input: transInput })
      });
      setTransCorrect(res.correct);
      setTransChecked(true);
      setTransExplanation(res.explanation);
      if (res.correct) {
        playAudio(transInput);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextTrans = () => {
    setTransInput("");
    setTransChecked(false);
    setTransCorrect(null);
    setTransExplanation("");
    if (transIdx < transItems.length - 1) {
      setTransIdx(prev => prev + 1);
    }
  };

  const handleCheckContext = async () => {
    const current = contextItems[contextIdx];
    if (!current || !contextSelected) return;
    try {
      const res = await apiJson("/phase-3/items/context-choice/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: contextSelected })
      });
      setContextCorrect(res.correct);
      setContextChecked(true);
      setContextExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextContext = () => {
    setContextSelected(null);
    setContextChecked(false);
    setContextCorrect(null);
    setContextExplanation("");
    if (contextIdx < contextItems.length - 1) {
      setContextIdx(prev => prev + 1);
    }
  };

  const handleCheckDialogue = async () => {
    const current = dialogueItems[dialogueIdx];
    if (!current || !dialogueInput) return;
    try {
      const res = await apiJson("/phase-3/items/dialogue-fix/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, user_input: dialogueInput })
      });
      setDialogueCorrect(res.correct);
      setDialogueChecked(true);
      setDialogueExplanation(res.explanation);
      if (res.correct) {
        playAudio(dialogueInput);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextDialogue = () => {
    setDialogueInput("");
    setDialogueChecked(false);
    setDialogueCorrect(null);
    setDialogueExplanation("");
    if (dialogueIdx < dialogueItems.length - 1) {
      setDialogueIdx(prev => prev + 1);
    }
  };

  const handleCheckQuizAnswer = async () => {
    const q = quizBlueprint[quizIdx];
    if (!q || !quizSelected) return;
    try {
      const res = await apiJson("/phase-3/quiz/answer", {
        method: "POST",
        body: JSON.stringify({ question_id: q.id, selected_option: quizSelected })
      });
      setQuizCorrect(res.correct);
      setQuizExplanation(res.explanation);
      setQuizChecked(true);
      if (!res.correct) {
        setQuizMistakes(prev => [...prev, q.id]);
      }
      playAudio(q.correct_answer.split(" (")[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextQuiz = async () => {
    if (quizIdx < quizBlueprint.length - 1) {
      setQuizIdx(prev => prev + 1);
      setQuizSelected(null);
      setQuizChecked(false);
      setQuizCorrect(null);
      setQuizExplanation("");
    } else {
      setFinishingQuiz(true);
      try {
        const correctCount = quizBlueprint.length - quizMistakes.length;
        const finalScore = Math.round((correctCount / quizBlueprint.length) * 100);
        await apiJson("/phase-3/quiz/finish", {
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

  const handleHwChange = (index: number, val: string) => {
    const updated = [...hwSents];
    updated[index] = val;
    setHwSents(updated);
  };

  const handleSubmitHomework = async () => {
    setSubmittingHw(true);
    try {
      const res = await apiJson("/phase-3/homework/submit", {
        method: "POST",
        body: JSON.stringify({ sentences: hwSents })
      });
      setHwFeedback(res.feedback || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingHw(false);
    }
  };

  const handleCompleteLab = async () => {
    setCompletingLab(true);
    try {
      const res = await apiJson("/phase-3/complete", { method: "POST" });
      setCompletionData(res);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingLab(false);
    }
  };

  const sandboxRes = getSandboxConjugation();

    const outlineSteps = [
    { num: 1, label: "Welcome & Goals" },
    { num: 2, label: "Concept Explanation" },
    { num: 3, label: "Activity 1: Practice Drills" },
    { num: 4, label: "Activity 2: Production Tasks" },
    { num: 5, label: "Checkpoint Quiz" },
    { num: 6, label: "Homework & Completion" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 7,
          phaseNum: 3,
          step: step
        }
      }));
    }
  }, [step]);

return (
    <div className="flex-grow flex flex-col justify-between">
      
      {/* Top Header */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{metadata?.title || "Grammar Lab 3"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Politeness & Verb Endings</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center space-x-4">
          <div className="w-40 h-3 bg-zinc-900/80 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 rounded-full transition-all duration-500" 
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 font-bold">{Math.round((step / 6) * 100)}%</span>
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

      {/* Screen 1: Welcome */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in relative overflow-hidden">
          <div className="absolute -top-1/4 -right-1/4 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="p-3 bg-indigo-500/10 rounded-full border border-indigo-500/25 w-fit mx-auto text-indigo-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          
          <div>
            <h2 className="text-5xl font-black text-white tracking-tight font-sans">{metadata?.title}</h2>
            <h3 className="text-md font-bold text-indigo-400 mt-1">{metadata?.subtitle}</h3>
          </div>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || []).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Est. Lab Time:</strong> {metadata?.estimated_minutes} minutes</p>
            <p><strong>🔗 Recommended Parallel Units:</strong> {metadata?.parallel_units}</p>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => {
    if (courseXP < 160) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 3, you need at least 160 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              <span>Start Politeness Lab</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
          </div>
        </div>
      )}

      {/* Screen 2: Explanation */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Politeness & Speech Levels</span>
          </h2>

          {coreData ? (
            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-1">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Interactive Sandbox</span>
                <div className="grid grid-cols-3 gap-2">
                  <select value={sandboxVerb} onChange={e => setSandboxVerb(e.target.value)} className="bg-zinc-950 border border-white/10 text-xs p-2 rounded text-white">
                    {coreData.verbs?.map((v: any) => <option key={v.dictionary} value={v.dictionary}>{v.dictionary}</option>)}
                  </select>
                  <select value={sandboxTense} onChange={e => setSandboxTense(e.target.value)} className="bg-zinc-950 border border-white/10 text-xs p-2 rounded text-white">
                    <option value="Present">Present</option>
                    <option value="Past">Past</option>
                    <option value="Future">Future</option>
                  </select>
                  <select value={sandboxLevel} onChange={e => setSandboxLevel(e.target.value)} className="bg-zinc-950 border border-white/10 text-xs p-2 rounded text-white">
                    <option value="Polite">Polite</option>
                    <option value="Casual">Casual</option>
                  </select>
                </div>
                {sandboxRes && (
                  <div className="bg-zinc-950 p-3 rounded text-center border border-white/5">
                    <span onClick={() => playAudio(sandboxRes.result)} className="text-xl font-black text-indigo-400 hover:underline cursor-pointer">{sandboxRes.result}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Drills */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Activity 1 – Conjugation Drills</span>
            </h2>
            <span className="text-xs text-zinc-550 font-bold">Step 3/6</span>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {conjItems.length > 0 && (
              <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider block">Part A: Conjugate the verb</span>
                <div className="py-2">
                  <p className="text-xs text-zinc-400">Verb: <strong>{conjItems[conjIdx].verb}</strong> ({conjItems[conjIdx].meaning})</p>
                  <p className="text-xs text-zinc-400">Target Tense/Speech Level: <strong>{conjItems[conjIdx].tense} / {conjItems[conjIdx].level}</strong></p>
                </div>
                <input
                  type="text"
                  value={conjInput}
                  onChange={(e) => setConjInput(e.target.value)}
                  placeholder="Type conjugated form..."
                  className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500 text-sm font-medium"
                  disabled={conjChecked}
                />
                {conjChecked && (
                  <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400">
                    <p className="font-extrabold text-white">{conjCorrect ? "✓ Correct!" : `✗ Incorrect.`}</p>
                    <p className="mt-1">{conjExplanation}</p>
                  </div>
                )}
                <div className="flex justify-end pt-1">
                  {!conjChecked ? (
                    <button onClick={handleCheckConj} disabled={!conjInput.trim()} className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition">Check</button>
                  ) : (
                    conjIdx < conjItems.length - 1 && <button onClick={handleNextConj} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition">Next Item</button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => {
    if (courseXP < 160) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 3, you need at least 160 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Transform */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Activity 2 – Speech Switching</span>
            </h2>
            <span className="text-xs text-zinc-550 font-bold">Step 4/6</span>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {transItems.length > 0 && (
              <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider block">Part A: Switch politeness level</span>
                <div className="py-2">
                  <p className="text-xs text-zinc-400">Original Sentence ({transItems[transIdx].level_from}):</p>
                  <p className="text-lg font-black text-white">{transItems[transIdx].sentence_from}</p>
                  <p className="text-xs text-zinc-400 mt-1">Target Speech Level: <strong>{transItems[transIdx].level_to}</strong></p>
                </div>
                <input
                  type="text"
                  value={transInput}
                  onChange={(e) => setTransInput(e.target.value)}
                  placeholder="Type transformed sentence..."
                  className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500 text-sm font-medium"
                  disabled={transChecked}
                />
                {transChecked && (
                  <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400">
                    <p className="font-extrabold text-white">{transCorrect ? "✓ Correct!" : `✗ Incorrect.`}</p>
                    <p className="mt-1">{transExplanation}</p>
                  </div>
                )}
                <div className="flex justify-end pt-1">
                  {!transChecked ? (
                    <button onClick={handleCheckTrans} disabled={!transInput.trim()} className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition">Check</button>
                  ) : (
                    transIdx < transItems.length - 1 && <button onClick={handleNextTrans} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition">Next Item</button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Quiz */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-400" />
            <span>Speech Level Proficiency Quiz</span>
          </h2>

          {quizBlueprint.length > 0 && quizScore === null && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-450 border-b border-white/5 pb-2">
                <span>Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span>Mistakes: {quizMistakes.length}</span>
              </div>
              <p className="text-sm font-extrabold text-white">{quizBlueprint[quizIdx]?.question}</p>
              <div className="grid grid-cols-1 gap-2 pt-2">
                {quizBlueprint[quizIdx]?.options?.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => setQuizSelected(opt)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                      quizSelected === opt 
                        ? "border-indigo-500 bg-indigo-500/10 text-white" 
                        : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                    } ${quizChecked && opt === quizBlueprint[quizIdx].correct_answer ? "border-green-500 bg-green-500/10" : ""}`}
                    disabled={quizChecked}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {quizChecked && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400">
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
                  <p className="font-extrabold text-white">{quizCorrect ? "✓ Correct!" : "✗ Incorrect."}</p>
                  <p className="mt-1">{quizExplanation}</p>
                </div>
              )}
              <div className="flex justify-end pt-2">
                {!quizChecked ? (
                  <button onClick={handleCheckQuizAnswer} disabled={!quizSelected} className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition">Submit</button>
                ) : (
                  <button onClick={handleNextQuiz} className="bg-indigo-550 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition">Next</button>
                )}
              </div>
            </div>
          )}

          {quizScore !== null && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-center space-y-4 max-w-sm mx-auto">
              <Award className="w-12 h-12 text-yellow-500 mx-auto" />
              <h3 className="text-xl font-extrabold text-white font-sans">Quiz Completed!</h3>
              <p className="text-xs text-zinc-400">Score: <strong className="text-white text-base">{quizScore}%</strong></p>
              <div className="flex justify-center gap-2">
                <button onClick={handleRestartQuiz} className="py-2 px-4 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold rounded-xl text-zinc-350 border border-white/5 transition flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> Retry</button>
                <button onClick={() => setStep(6)} className="py-2 px-5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition">Homework</button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5">
            <button onClick={() => setStep(4)} className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm font-medium transition cursor-pointer" disabled={quizScore === null}><ChevronLeft className="w-4 h-4" /> Back</button>
            <div />
          </div>
        </div>
      )}

      {/* Screen 6: Homework */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Homework & Verification</span>
          </h2>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
              <p className="font-extrabold text-white">Homework Prompts:</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                {homeworkItems.map((hw: any) => (
                  <li key={hw.id}>{hw.text}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5">
              {hwSents.map((sent, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-mono block">SENTENCE {idx + 1}:</label>
                  <input
                    type="text"
                    value={sent}
                    onChange={(e) => handleHwChange(idx, e.target.value)}
                    placeholder="Type Korean sentence..."
                    className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500 text-xs font-medium"
                  />
                </div>
              ))}
              <div className="flex justify-end pt-1">
                <button onClick={handleSubmitHomework} disabled={submittingHw || hwSents.every(s => !s.trim())} className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                  {submittingHw && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Check with AI Tutor
                </button>
              </div>
            </div>

            {hwFeedback.length > 0 && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
                <p className="font-extrabold text-white">Feedback Analysis:</p>
                {hwFeedback.map((fb, fIdx) => (
                  <div key={fIdx} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <p className="text-zinc-350">"{fb.original}"</p>
                    <p className={fb.is_correct ? "text-green-400" : "text-red-400"}>{fb.why}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-gradient-to-r from-zinc-950 via-indigo-500/5 to-zinc-950 p-6 rounded-2xl border border-white/5 text-center space-y-3">
              <Award className="w-8 h-8 text-indigo-400 mx-auto" />
              <h3 className="text-sm font-extrabold text-white">Complete Phase 3</h3>
              {completionData && (
                <p className="text-xs text-green-400">Badge Earned: {completionData.badge}</p>
              )}
              <button onClick={handleCompleteLab} className="py-2.5 px-6 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 mx-auto">
                {completingLab && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Complete Lab & Claim Badge
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 border-t border-white/5">
            <button onClick={() => setStep(5)} className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm font-medium transition cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <div />
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
