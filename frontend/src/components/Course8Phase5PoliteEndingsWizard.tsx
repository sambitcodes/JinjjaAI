"use client";

import { useEffect, useState } from "react";
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

interface Course8Phase5PoliteEndingsWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course8Phase5PoliteEndingsWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course8Phase5PoliteEndingsWizardProps) {
  const getStepMaxXP = (sNum: number) => {
    if (sNum === 1) return 0;
    if (sNum === 12) return 200;
    const sObj = outlineSteps.find(os => os.num === sNum);
    const label = sObj ? sObj.label.toLowerCase() : "";
    if (label.includes("activity") || label.includes("game") || label.includes("drill") || label.includes("practice")) return 60;
    return 35;
  };
  const getStepXP = (sNum: number) => {
    return (sNum < step || sNum <= maxStep) ? getStepMaxXP(sNum) : 0;
  };

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c8p5_step");
    const savedMax = localStorage.getItem("hangeulai_c8p5_max_step");
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
      localStorage.setItem("hangeulai_c8p5_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);

  // Loaded data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1A: Verb endings identify
  const [eiItems, setEiItems] = useState<any[]>([]);
  const [eiIdx, setEiIdx] = useState(0);
  const [eiSelected, setEiSelected] = useState<string | null>(null);
  const [eiChecked, setEiChecked] = useState(false);
  const [eiCorrect, setEiCorrect] = useState<boolean | null>(null);
  const [eiExplanation, setEiExplanation] = useState("");

  // Activity 1B: Question or Statement
  const [qsItems, setQsItems] = useState<any[]>([]);
  const [qsIdx, setQsIdx] = useState(0);
  const [qsSelected, setQsSelected] = useState<string | null>(null);
  const [qsChecked, setQsChecked] = useState(false);
  const [qsCorrect, setQsCorrect] = useState<boolean | null>(null);
  const [qsExplanation, setQsExplanation] = useState("");

  // Activity 1C: Register choice
  const [rlItems, setRlItems] = useState<any[]>([]);
  const [rlIdx, setRlIdx] = useState(0);
  const [rlSelected, setRlSelected] = useState<string | null>(null);
  const [rlChecked, setRlChecked] = useState(false);
  const [rlCorrect, setRlCorrect] = useState<boolean | null>(null);
  const [rlExplanation, setRlExplanation] = useState("");

  // Activity 2A: Polite ending drill
  const [pdItems, setPdItems] = useState<any[]>([]);
  const [pdIdx, setPdIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [pdEvaluated, setPdEvaluated] = useState(false);
  const [pdScore, setPdScore] = useState<number | null>(null);
  const [pdFeedback, setPdFeedback] = useState("");

  // Activity 2B: Sentence-final 요 statement vs question
  const [fyItems, setFyItems] = useState<any[]>([]);
  const [fyIdx, setFyIdx] = useState(0);
  const [fyMode, setFyMode] = useState<"statement" | "question">("statement");
  const [fyEvaluated, setFyEvaluated] = useState(false);
  const [fyScore, setFyScore] = useState<number | null>(null);
  const [fyFeedback, setFyFeedback] = useState("");

  // Activity 2C: Register switch speak
  const [rsItems, setRsItems] = useState<any[]>([]);
  const [rsIdx, setRsIdx] = useState(0);
  const [rsActiveTarget, setRsActiveTarget] = useState<"polite_yo" | "casual" | "formal">("polite_yo");
  const [rsEvaluated, setRsEvaluated] = useState(false);
  const [rsScore, setRsScore] = useState<number | null>(null);
  const [rsFeedback, setRsFeedback] = useState("");

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
  const [completionData, setCompletionData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/5/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/5/core-data");
          setCoreData(res);
        } else if (step === 3) {
          if (eiItems.length === 0) {
            const resEi = await apiJson("/phase-5/items/ending-identify");
            setEiItems(resEi);
          }
          if (qsItems.length === 0) {
            const resQs = await apiJson("/phase-5/items/question-vs-statement");
            setQsItems(resQs);
          }
          if (rlItems.length === 0) {
            const resRl = await apiJson("/phase-5/items/register-listening");
            setRlItems(resRl);
          }
        } else if (step === 4) {
          if (pdItems.length === 0) {
            const resPd = await apiJson("/phase-5/items/polite-verb-drill");
            setPdItems(resPd);
          }
          if (fyItems.length === 0) {
            const resFy = await apiJson("/phase-5/items/final-yo");
            setFyItems(resFy);
          }
          if (rsItems.length === 0) {
            const resRs = await apiJson("/phase-5/items/register-speak");
            setRsItems(resRs);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/phase-5/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-5/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading PLS Lab Phase 5:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1A ending identify
  const handleCheckEi = async () => {
    const current = eiItems[eiIdx];
    if (!current || !eiSelected) return;
    try {
      const res = await apiJson("/phase-5/items/ending-identify/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: eiSelected })
      });
      setEiCorrect(res.correct);
      setEiChecked(true);
      setEiExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextEi = () => {
    setEiSelected(null);
    setEiChecked(false);
    setEiCorrect(null);
    setEiExplanation("");
    if (eiIdx < eiItems.length - 1) {
      setEiIdx(prev => prev + 1);
    }
  };

  // Activity 1B Question vs statement
  const handleCheckQs = async () => {
    const current = qsItems[qsIdx];
    if (!current || !qsSelected) return;
    try {
      const res = await apiJson("/phase-5/items/question-vs-statement/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: qsSelected })
      });
      setQsCorrect(res.correct);
      setQsChecked(true);
      setQsExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextQs = () => {
    setQsSelected(null);
    setQsChecked(false);
    setQsCorrect(null);
    setQsExplanation("");
    if (qsIdx < qsItems.length - 1) {
      setQsIdx(prev => prev + 1);
    }
  };

  // Activity 1C Register identify
  const handleCheckRl = async () => {
    const current = rlItems[rlIdx];
    if (!current || !rlSelected) return;
    try {
      const res = await apiJson("/phase-5/items/register-listening/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: rlSelected })
      });
      setRlCorrect(res.correct);
      setRlChecked(true);
      setRlExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextRl = () => {
    setRlSelected(null);
    setRlChecked(false);
    setRlCorrect(null);
    setRlExplanation("");
    if (rlIdx < rlItems.length - 1) {
      setRlIdx(prev => prev + 1);
    }
  };

  // Activity 2A Speak polite ending
  const handleRecordPd = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = pdItems[pdIdx];
      try {
        const res = await apiJson("/phase-5/items/polite-verb-drill/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: current.id, audio_base64: "mock_speech" })
        });
        setPdScore(res.score);
        setPdFeedback(res.feedback);
        setPdEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleNextPd = () => {
    setPdScore(null);
    setPdFeedback("");
    setPdEvaluated(false);
    if (pdIdx < pdItems.length - 1) {
      setPdIdx(prev => prev + 1);
    }
  };

  // Activity 2B Statement vs Question speaking
  const handleRecordFy = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = fyItems[fyIdx];
      try {
        const res = await apiJson("/phase-5/items/final-yo/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: `${current.id}_${fyMode}`, audio_base64: "mock_speech" })
        });
        setFyScore(res.score);
        setFyFeedback(res.feedback);
        setFyEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleNextFy = () => {
    setFyScore(null);
    setFyFeedback("");
    setFyEvaluated(false);
    setFyMode("statement");
    if (fyIdx < fyItems.length - 1) {
      setFyIdx(prev => prev + 1);
    }
  };

  // Activity 2C Register switch speak
  const handleRecordRs = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = rsItems[rsIdx];
      try {
        const res = await apiJson("/phase-5/items/register-speak/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: `${current.id}_${rsActiveTarget}`, audio_base64: "mock_speech" })
        });
        setRsScore(res.score);
        setRsFeedback(res.feedback);
        setRsEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleNextRs = () => {
    setRsScore(null);
    setRsFeedback("");
    setRsEvaluated(false);
    setRsActiveTarget("polite_yo");
    if (rsIdx < rsItems.length - 1) {
      setRsIdx(prev => prev + 1);
    }
  };

  // Quiz flow
  const handleCheckQuizAnswer = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelected) return;
    try {
      const res = await apiJson("/phase-5/quiz/answer", {
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
        await apiJson("/phase-5/quiz/finish", {
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
      const res = await apiJson("/phase-5/homework/submit", {
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
      const res = await apiJson("/phase-5/complete", { method: "POST" });
      setCompletionData(res);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingLab(false);
    }
  };

    const outlineSteps = [
    { num: 1, label: "= 1 ? \"bg-cyan-500\" : \"bg-slate-700\"}`} /> Screen 1: Welcome & Phase Overview" },
    { num: 2, label: "= 2 ? \"bg-teal-500\" : \"bg-slate-700\"}`} /> Screen 2: Concept Explanation: Polite Endings" },
    { num: 3, label: "= 3 ? \"bg-indigo-500\" : \"bg-slate-700\"}`} /> Screen 3: Activity 1: Differentiate Endings, Intonations & Registers" },
    { num: 4, label: "= 4 ? \"bg-purple-500\" : \"bg-slate-700\"}`} /> Screen 4: Activity 2: Speak Verb Drills, Intonation & Register Switches" },
    { num: 5, label: "= 5 ? \"bg-pink-500\" : \"bg-slate-700\"}`} /> Screen 5: Mini-Quiz: Politeness Intonation Check" },
    { num: 6, label: "= 6 ? \"bg-emerald-500\" : \"bg-slate-700\"}`} /> Screen 6: Homework & AI polite‑speech coach" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 8,
          phaseNum: 5,
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
            <h2 className="font-black text-xl text-white tracking-tight">Pronunciation Lab 5</h2>
            <p className="text-xs text-zinc-400">Polite Endings & 요</p>
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
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">Required: 500 XP</span>
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
                const isCompleted = s.num < step || s.num <= maxStep;
                return (
                  <button
                    key={s.num}
                    disabled={!isCompleted && !isCurrent}
                    onClick={() => {
                      if (courseXP < 320) {
                        window.dispatchEvent(new CustomEvent("hangeulai-warning", {
                          detail: { message: "To start Phase 5, you need at least 320 XP in this course. You currently have " + courseXP + " XP." }
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
                          className={`h-full rounded-full ${isCompleted ? "bg-emerald-400" : "bg-zinc-800"}`}
                          style={{ width: isCompleted ? "100%" : "0%" }}
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
            <h2 className="text-5xl font-black text-white tracking-tight font-sans">{metadata?.title || "Pronunciation Lab 5 – Polite Endings & 요 (A2)"}</h2>
            <h3 className="text-2xl font-extrabold text-cyan-400 mt-2">{metadata?.subtitle || "Say everyday polite endings clearly and naturally."}</h3>
          </div>

          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "In this lab, you’ll practise A2‑level polite endings like ‑아요/‑어요/‑여요 and 요 sentence‑finals, so your questions and statements sound polite, clear, and easy to understand."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Focus Milestones:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Hear how ‑아요/‑어요/‑여요 and 요 endings sound in real speech",
                "Distinguish questions vs statements by sentence‑final intonation",
                "Practise reading and speaking polite sentences from Courses 1–2"
              ]).map((g: string, i: number) => <li key={i}>{g}</li>)}
            </ul>
            <p className="pt-2 text-zinc-400"><strong>⏱️ Est. Lab Time:</strong> 25 minutes</p>
            <p className="text-zinc-400"><strong>🔗 Prerequisites:</strong> {metadata?.dependencies || "Listening Lab 1 (Completed)"}</p>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl mx-auto">
            {["A2", "Politeness", "Pronunciation", "Listening", "Speaking"].map(chip => (
              <span key={chip} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] text-cyan-300 font-bold">{chip}</span>
            ))}
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => {
    if (courseXP < 320) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 5, you need at least 320 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} 
              className="bg-cyan-500 hover:bg-cyan-450 text-zinc-950 font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Volume2 className="w-4 h-4" /> Start Polite Endings Lab
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: CONCEPT EXPLANATION */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            Polite Endings Conjugation & Pitch
          </h2>

          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
              <h3 className="font-bold text-white mb-1">1. Everyday Polite Verb Endings</h3>
              <p className="text-zinc-400">Standard friendly polite speech uses -아요/-어요/-여요 endings. These combine verb stems with polite endings (e.g. 가요, 먹어요, 해요, 있어요).</p>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
              <h3 className="font-bold text-white mb-1">2. Contractions & Reduced Sounds</h3>
              <p className="text-zinc-400">
                In real spoken speech, endings contract: <strong>갔어요</strong> sounds like [가써요] and <strong>앉으세요</strong> links to [안즈세요]. Ensure stem-to-ending transition is smooth.
              </p>
            </div>
          </div>

          {/* Interactive Examples EndingExamplesList */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200">Ending Examples & Contractions</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(coreData?.ending_examples || []).map((ex: any) => (
                <div key={ex.polite} className="p-3 bg-zinc-900 border border-white/5 rounded-xl space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-cyan-400">{ex.base}</span>
                    <button
                      onClick={() => playAudio(ex.polite)}
                      className="px-2 py-1 bg-zinc-955 border border-white/5 hover:bg-slate-800 transition rounded text-[10px] font-semibold text-zinc-350 cursor-pointer"
                    >
                      {ex.polite}
                    </button>
                  </div>
                  <div className="text-[10px] text-zinc-500 italic mt-0.5">{ex.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* QuestionStatementCompare */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
            <h3 className="text-xs font-bold text-zinc-200">Question vs Statement Intonation Contour</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div 
                onClick={() => playAudio("오늘 바빠요")}
                className="p-3 bg-zinc-900 border border-white/5 hover:border-indigo-500/30 transition rounded-xl text-center cursor-pointer"
              >
                <div className="font-bold text-zinc-200">오늘 바빠요 (Statement)</div>
                <div className="text-[10px] text-indigo-400 mt-1">Flat / Falling pitch contours</div>
              </div>
              <div 
                onClick={() => playAudio("오늘 바빠요?")}
                className="p-3 bg-zinc-900 border border-white/5 hover:border-teal-500/30 transition rounded-xl text-center cursor-pointer"
              >
                <div className="font-bold text-zinc-200">오늘 바빠요? (Question)</div>
                <div className="text-[10px] text-teal-400 mt-1">Slight rising pitch at final 요</div>
              </div>
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

      {/* SCREEN 3: ACTIVITY 1: HEAR POLITE ENDINGS IN REAL SPEECH */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 1: Listening Discrimination
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Identify polite ending forms, intonations, and registers</h2>
          </div>

          {/* Activity 1A: Ending Identify */}
          {eiItems.length > 0 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Which polite ending do you hear?</span>
                <span>Sentence {eiIdx + 1} of {eiItems.length}</span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => playAudio(eiItems[eiIdx]?.word)}
                  className="p-3 bg-cyan-500/20 text-cyan-300 rounded-full hover:bg-cyan-500/30 transition border border-cyan-500/30 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                </button>
                <span className="text-xs text-zinc-400">Listen, select which ending is used:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {eiItems[eiIdx]?.options?.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !eiChecked && setEiSelected(opt)}
                    className={`py-3 px-2 rounded-xl text-xs font-semibold border transition text-center ${
                      eiSelected === opt 
                        ? "border-cyan-500 bg-cyan-500/10 text-white" 
                        : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                    } ${eiChecked && opt === eiItems[eiIdx].correct ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                    disabled={eiChecked}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {eiChecked && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${eiCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                  <strong>{eiCorrect ? "Correct!" : "Incorrect."}</strong> {eiExplanation}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!eiChecked ? (
                  <button
                    onClick={handleCheckEi}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-750 text-xs font-bold rounded-lg text-zinc-200 transition"
                    disabled={!eiSelected}
                  >
                    Check Sound
                  </button>
                ) : (
                  eiIdx < eiItems.length - 1 && (
                    <button
                      onClick={handleNextEi}
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition"
                    >
                      Next Sentence
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Activity 1B: Question or Statement */}
          {qsItems.length > 0 && eiChecked && eiIdx === eiItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Question or Statement Pitch?</span>
                <span>Item {qsIdx + 1} of {qsItems.length}</span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => playAudio(qsItems[qsIdx].type === "question" ? `${qsItems[qsIdx].text}?` : qsItems[qsIdx].text)}
                  className="p-3 bg-zinc-900 border border-white/5 rounded-full hover:bg-slate-800 text-cyan-400 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                </button>
                <span className="text-xs text-zinc-400">Listen to final 요 intonation. Is it a question or statement?</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {["Statement", "Question"].map(type => (
                  <button
                    key={type}
                    onClick={() => !qsChecked && setQsSelected(type)}
                    className={`py-3 px-4 rounded-xl text-xs font-semibold border transition text-center ${
                      qsSelected === type 
                        ? "border-teal-500 bg-teal-500/10 text-white" 
                        : "border-white/5 bg-zinc-900 text-zinc-355 hover:bg-slate-800"
                    } ${qsChecked && type.toLowerCase() === qsItems[qsIdx].type ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                    disabled={qsChecked}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {qsChecked && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${qsCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                  <strong>{qsCorrect ? "Correct!" : "Incorrect."}</strong> {qsExplanation}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!qsChecked ? (
                  <button
                    onClick={handleCheckQs}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-750 text-xs font-bold rounded-lg text-zinc-200 transition"
                    disabled={!qsSelected}
                  >
                    Check Intonation
                  </button>
                ) : (
                  qsIdx < qsItems.length - 1 && (
                    <button
                      onClick={handleNextQs}
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition"
                    >
                      Next Item
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Activity 1C: Polite vs Casual vs Formal */}
          {rlItems.length > 0 && qsChecked && qsIdx === qsItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Politeness Register Listening</span>
                <span>Sentence {rlIdx + 1} of {rlItems.length}</span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => playAudio(rlItems[rlIdx]?.phrase)}
                  className="p-3 bg-zinc-900 border border-white/5 rounded-full hover:bg-slate-800 text-cyan-400 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                </button>
                <span className="text-xs text-zinc-400">Identify speech register:</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {["Everyday polite", "Formal polite", "Casual"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => !rlChecked && setRlSelected(opt)}
                    className={`py-3 px-2 rounded-xl text-xs font-semibold border transition text-center ${
                      rlSelected === opt 
                        ? "border-indigo-500 bg-indigo-500/10 text-white" 
                        : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                    } ${rlChecked && opt === rlItems[rlIdx].correct ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                    disabled={rlChecked}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {rlChecked && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${rlCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                  <strong>{rlCorrect ? "Correct!" : "Incorrect."}</strong> {rlExplanation}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!rlChecked ? (
                  <button
                    onClick={handleCheckRl}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-750 text-xs font-bold rounded-lg text-zinc-200 transition"
                    disabled={!rlSelected}
                  >
                    Check Register
                  </button>
                ) : (
                  rlIdx < rlItems.length - 1 ? (
                    <button
                      onClick={handleNextRl}
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition"
                    >
                      Next Sentence
                    </button>
                  ) : (
                    <button
                      onClick={() => setStep(4)}
                      className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold text-white rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      Proceed to Speaking Lab <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <button 
              onClick={() => {
    if (courseXP < 320) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 5, you need at least 320 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 4: ACTIVITY 2: SPEAK WITH CLEAR POLITE ENDINGS */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 2: Speaking & Tones
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Speak everyday polite verb endings clearly and change register</h2>
          </div>

          {/* Activity 2A: Verb ending drill */}
          {pdItems.length > 0 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Verb Ending Drill (-아요/-어요/-여요)</span>
                <span>Verb {pdIdx + 1} of {pdItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-3">
                <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-bold">Conjugate Infinitves:</span>
                <div className="flex justify-center items-center gap-4 text-zinc-400 text-sm">
                  <span>{pdItems[pdIdx]?.infinitive} (Dictionary)</span>
                  <span className="text-white">→</span>
                  <span className="text-xl font-extrabold text-cyan-400">{pdItems[pdIdx]?.polite}</span>
                </div>
                <span className="text-[10px] text-zinc-500 block italic">Rule: {pdItems[pdIdx]?.rule}</span>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => playAudio(pdItems[pdIdx]?.polite)}
                    className="p-3 bg-zinc-950 border border-white/10 hover:border-cyan-400/30 text-cyan-400 hover:text-cyan-300 rounded-full transition cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleRecordPd}
                    disabled={recording}
                    className={`p-3 rounded-full transition border cursor-pointer ${
                      recording 
                        ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse" 
                        : "bg-cyan-500 hover:bg-cyan-450 border-cyan-450 text-zinc-950 font-bold"
                    }`}
                  >
                    {recording ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {pdEvaluated && (
                <div className="bg-emerald-950/20 border border-emerald-900 p-4 rounded-xl text-xs space-y-1 text-emerald-300">
                  <div className="font-bold">Pronunciation Score: {pdScore}%</div>
                  <p className="text-zinc-450 leading-relaxed">{pdFeedback}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {pdEvaluated && (
                  <button
                    onClick={handleNextPd}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition"
                  >
                    Next Verb
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2B: Sentence-final 요: statement vs question */}
          {fyItems.length > 0 && pdEvaluated && pdIdx === pdItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Sentence-final 요 statement vs question</span>
                <span>Sentence {fyIdx + 1} of {fyItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Sentence:</span>
                <span className="text-base font-bold text-white block">{fyItems[fyIdx]?.sentence}</span>
                <span className="text-xs text-zinc-400 block">{fyItems[fyIdx]?.translation}</span>

                <div className="flex justify-center gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => setFyMode("statement")}
                    className={`py-1.5 px-3 rounded-lg border text-xs transition ${
                      fyMode === "statement" ? "border-indigo-400 bg-indigo-500/10 text-indigo-300" : "border-white/5 bg-zinc-950 text-zinc-450"
                    }`}
                  >
                    Statement Mode (↘)
                  </button>
                  <button
                    onClick={() => setFyMode("question")}
                    className={`py-1.5 px-3 rounded-lg border text-xs transition ${
                      fyMode === "question" ? "border-teal-400 bg-teal-500/10 text-teal-300" : "border-white/5 bg-zinc-950 text-zinc-450"
                    }`}
                  >
                    Question Mode (↗)
                  </button>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => playAudio(fyMode === "question" ? `${fyItems[fyIdx]?.sentence}?` : fyItems[fyIdx]?.sentence)}
                    className="p-2.5 bg-zinc-950 border border-white/10 hover:border-cyan-400/30 text-cyan-400 hover:text-cyan-300 rounded-full transition cursor-pointer"
                  >
                    <Volume2 className="w-4.5 h-4.5" />
                  </button>

                  <button
                    onClick={handleRecordFy}
                    disabled={recording}
                    className={`py-2 px-4 rounded-xl transition border text-xs font-bold flex items-center gap-2 cursor-pointer ${
                      recording 
                        ? "bg-red-500/20 border-red-500 text-red-400" 
                        : "bg-cyan-500 hover:bg-cyan-450 text-zinc-950 font-bold"
                    }`}
                  >
                    {recording ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                    <span>Record {fyMode}</span>
                  </button>
                </div>
              </div>

              {fyEvaluated && (
                <div className="bg-indigo-950/20 border border-indigo-900 p-4 rounded-xl text-xs space-y-1 text-indigo-300">
                  <div className="font-bold">Yo Intonation Alignment: {fyScore}%</div>
                  <p className="text-zinc-450 leading-relaxed">{fyFeedback}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {fyEvaluated && (
                  <button
                    onClick={handleNextFy}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Sentence
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2C: Register switch polite ↔ casual ↔ formal */}
          {rsItems.length > 0 && fyEvaluated && fyIdx === fyItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Register Switch Speak</span>
                <span>Scenario {rsIdx + 1} of {rsItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="text-[10px] text-zinc-550 block uppercase font-bold">Content: {rsItems[rsIdx]?.base_sentence}</span>
                
                <div className="grid grid-cols-3 gap-2 py-2 border-b border-white/5">
                  <button
                    onClick={() => setRsActiveTarget("polite_yo")}
                    className={`py-2 px-3 border text-xs font-semibold rounded-lg transition text-left ${
                      rsActiveTarget === "polite_yo" ? "border-cyan-450 bg-cyan-500/10 text-white" : "border-white/5 bg-zinc-950 text-zinc-400"
                    }`}
                  >
                    Polite 요: <span className="block font-bold mt-1 text-zinc-200">{rsItems[rsIdx]?.polite_yo}</span>
                  </button>
                  <button
                    onClick={() => setRsActiveTarget("casual")}
                    className={`py-2 px-3 border text-xs font-semibold rounded-lg transition text-left ${
                      rsActiveTarget === "casual" ? "border-cyan-450 bg-cyan-500/10 text-white" : "border-white/5 bg-zinc-950 text-zinc-400"
                    }`}
                  >
                    Casual 반말: <span className="block font-bold mt-1 text-zinc-200">{rsItems[rsIdx]?.casual}</span>
                  </button>
                  <button
                    onClick={() => setRsActiveTarget("formal")}
                    className={`py-2 px-3 border text-xs font-semibold rounded-lg transition text-left ${
                      rsActiveTarget === "formal" ? "border-cyan-450 bg-cyan-500/10 text-white" : "border-white/5 bg-zinc-950 text-zinc-400"
                    }`}
                  >
                    Formal 니다: <span className="block font-bold mt-1 text-zinc-200">{rsItems[rsIdx]?.formal}</span>
                  </button>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => playAudio(rsItems[rsIdx][rsActiveTarget])}
                    className="p-3 bg-zinc-950 border border-white/10 hover:border-cyan-400/30 text-cyan-400 hover:text-cyan-300 rounded-full transition cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleRecordRs}
                    disabled={recording}
                    className={`py-2 px-5 rounded-xl transition border text-xs font-bold flex items-center gap-2 cursor-pointer ${
                      recording 
                        ? "bg-red-500/20 border-red-500 text-red-400" 
                        : "bg-cyan-500 hover:bg-cyan-450 text-zinc-950 font-bold"
                    }`}
                  >
                    {recording ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                    <span>Record Register</span>
                  </button>
                </div>
              </div>

              {rsEvaluated && (
                <div className="bg-indigo-950/20 border border-indigo-900 p-4 rounded-xl text-xs space-y-1 text-indigo-300">
                  <div className="font-bold">Register Switch Accuracy: {rsScore}%</div>
                  <p className="text-zinc-450 leading-relaxed">{rsFeedback}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {rsEvaluated && (
                  rsIdx < rsItems.length - 1 ? (
                    <button
                      onClick={handleNextRs}
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                    >
                      Next Scenario
                    </button>
                  ) : (
                    <button
                      onClick={() => setStep(5)}
                      className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold text-white rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      Proceed to Mini-Quiz <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(3)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 5: MINI-QUIZ */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/25 px-2 py-0.5 rounded-full font-bold">
              Mini-Quiz: Polite Check
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Everyday Politeness & Final Tones</h2>
          </div>

          {quizBlueprint.length > 0 && quizScore === null && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Quiz Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-900 px-1.5 py-0.5 rounded uppercase font-bold font-mono">
                  {quizBlueprint[quizIdx].type}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => playAudio(quizBlueprint[quizIdx].question)}
                    className="p-2 bg-zinc-900 border border-white/5 text-purple-400 rounded-full hover:bg-slate-800 transition"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <p className="text-xs font-semibold text-zinc-250">{quizBlueprint[quizIdx].question}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs">
                  {quizBlueprint[quizIdx].options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelected(opt)}
                      className={`py-3 px-4 rounded-xl text-left border transition ${
                        quizSelected === opt 
                          ? "border-purple-500 bg-purple-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                      } ${quizChecked && opt === quizBlueprint[quizIdx].correct_answer ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                      disabled={quizChecked}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
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

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuizAnswer}
                    className="py-2 px-4 bg-purple-900 hover:bg-purple-800 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                    disabled={!quizSelected}
                  >
                    Check Choice
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuiz}
                    className="py-2 px-4 bg-purple-500 hover:bg-purple-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    {quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quiz Score Summary Card */}
          {quizScore !== null && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-center space-y-5">
              <Award className="w-12 h-12 text-yellow-500 mx-auto" />
              <div>
                <h3 className="font-black text-xl text-white tracking-tight">Politeness Lab completed</h3>
                <span className="text-4xl font-black text-white block mt-1">{quizScore}%</span>
                <p className="text-xs text-zinc-400 mt-2">
                  {quizScore >= 80 ? "Pass! You understand linking contractions and final 요 statement/question pitch contours." : "Did not pass. We recommend reviewing Activity 1A/1B and retaking this check."}
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={handleRestartQuiz}
                  className="py-2 px-4 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-xs font-semibold rounded-lg text-zinc-300 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restart Quiz
                </button>

                <button
                  onClick={() => setStep(6)}
                  className="py-2 px-5 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                >
                  Proceed to Homework
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(4)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 6: HOMEWORK */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-emerald-500/10 text-emerald-450 border border-emerald-500/25 px-2 py-0.5 rounded-full font-bold">
              Homework & Speech Coach
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Record everyday polite speech and switch register</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
              <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-bold block">Assigned Tasks:</span>
              <ul className="space-y-2.5 text-zinc-350 pl-1 divide-y divide-white/5">
                {homeworkItems.map((item, idx) => (
                  <div key={item.id} className="pt-2.5 first:pt-0">
                    <p className="font-semibold text-white">Task {idx + 1}: {item.text.split(":")[0]}</p>
                    <p className="text-zinc-450 leading-relaxed mt-0.5">{item.text.split(":")[1]}</p>
                  </div>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
              <span className="text-[10px] text-zinc-500 uppercase block font-bold">Upload Speech Log Entries:</span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Task Type (diary/verbs)"
                  value={hwSents[0]}
                  onChange={(e) => handleHwChange(0, e.target.value)}
                  className="bg-zinc-900 border border-white/5 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="Sentence/Phrases written"
                  value={hwSents[1]}
                  onChange={(e) => handleHwChange(1, e.target.value)}
                  className="bg-zinc-900 border border-white/5 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-655 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="Speech feedback notes"
                  value={hwSents[2]}
                  onChange={(e) => handleHwChange(2, e.target.value)}
                  className="bg-zinc-900 border border-white/5 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-655 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSubmitHomework}
                  disabled={submittingHw || !hwSents[0] || !hwSents[1]}
                  className="py-2 px-4 bg-emerald-500 hover:bg-emerald-450 text-zinc-950 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {submittingHw ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Log Speech Homework</span>
                </button>
              </div>
            </div>

            {hwFeedback && (
              <div className="bg-emerald-950/20 border border-emerald-900 p-4 rounded-xl space-y-1 text-emerald-300">
                <div className="font-bold">AI Coach Pronunciation Feedback:</div>
                <p className="text-zinc-450 leading-relaxed">{hwFeedback.feedback}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(5)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleCompleteLab}
              disabled={completingLab}
              className="py-2.5 px-6 bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 hover:brightness-110 text-white font-extrabold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg"
            >
              {completingLab ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Award className="w-4 h-4 text-yellow-300" />
              )}
              <span>Complete Phase 5 Lab</span>
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
