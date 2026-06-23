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
  Trophy,
  Star,
  Volume2
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
  const cleanPath = (path.startsWith("/phases/") || path.startsWith("/phase-6/")) ? `/grammar-lab${path}` : path;
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

interface Course7Phase6TenseAspectWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course7Phase6TenseAspectWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course7Phase6TenseAspectWizardProps) {
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c7p6_step");
    const savedMax = localStorage.getItem("hangeulai_c7p6_max_step");
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
      localStorage.setItem("hangeulai_c7p6_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);

  // Loaded data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1: Recognition items
  const [recItems, setRecItems] = useState<any[]>([]);
  const [recIdx, setRecIdx] = useState(0);
  const [recSelected, setRecSelected] = useState<string | null>(null);
  const [recChecked, setRecChecked] = useState(false);
  const [recCorrect, setRecCorrect] = useState<boolean | null>(null);
  const [recExplanation, setRecExplanation] = useState("");

  // Activity 2A: Habit vs Single Production
  const [hvsItems, setHvsItems] = useState<any[]>([]);
  const [hvsIdx, setHvsIdx] = useState(0);
  const [hvsInput, setHvsInput] = useState("");
  const [hvsChecked, setHvsChecked] = useState(false);
  const [hvsCorrect, setHvsCorrect] = useState<boolean | null>(null);
  const [hvsExplanation, setHvsExplanation] = useState("");

  // Activity 2B: Background Event Builder
  const [bgeItems, setBgeItems] = useState<any[]>([]);
  const [bgeIdx, setBgeIdx] = useState(0);
  const [bgeInput, setBgeInput] = useState("");
  const [bgeChecked, setBgeChecked] = useState(false);
  const [bgeCorrect, setBgeCorrect] = useState<boolean | null>(null);
  const [bgeExplanation, setBgeExplanation] = useState("");

  // Activity 2C: Time Status Rewrite
  const [tsItems, setTsItems] = useState<any[]>([]);
  const [tsIdx, setTsIdx] = useState(0);
  const [tsInput, setTsInput] = useState("");
  const [tsChecked, setTsChecked] = useState(false);
  const [tsCorrect, setTsCorrect] = useState<boolean | null>(null);
  const [tsExplanation, setTsExplanation] = useState("");

  // Sandbox State (Screen 2)
  const [sandboxVerb, setSandboxVerb] = useState("공부하다");
  const [sandboxAspect, setSandboxAspect] = useState("Single Event (Past)");

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
  const [hwFeedback, setHwFeedback] = useState<any[]>([]);
  const [submittingHw, setSubmittingHw] = useState(false);
  const [completingLab, setCompletingLab] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/6/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/6/core-data");
          setCoreData(res);
        } else if (step === 3 && recItems.length === 0) {
          const resR = await apiJson("/phase-6/items/recognition");
          setRecItems(resR);
        } else if (step === 4) {
          if (hvsItems.length === 0) {
            const resH = await apiJson("/phase-6/items/habit-vs-single");
            setHvsItems(resH);
          }
          if (bgeItems.length === 0) {
            const resB = await apiJson("/phase-6/items/background-event");
            setBgeItems(resB);
          }
          if (tsItems.length === 0) {
            const resT = await apiJson("/phase-6/items/time-status");
            setTsItems(resT);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/phase-6/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-6/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading Grammar Lab Phase 6:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Sandbox Aspect Shifter Helper
  const getSandboxAspectConjugation = () => {
    let stem = sandboxVerb.slice(0, -1); // remove 다
    let sentence = "";
    let grammarRule = "";

    if (sandboxAspect === "Single Event (Past)") {
      const pastSuffix = sandboxVerb === "공부하다" ? "공부했어요" : (sandboxVerb === "먹다" ? "먹었어요" : (sandboxVerb === "자다" ? "잤어요" : "갔어요"));
      sentence = `어제 ${pastSuffix}.`;
      grammarRule = "Use simple past tense ending -았/었어요 to describe a completed one-time past event.";
    } else if (sandboxAspect === "Habitual (Used to)") {
      const pastSuffix = sandboxVerb === "공부하다" ? "공부했어요" : (sandboxVerb === "먹다" ? "먹었어요" : (sandboxVerb === "자다" ? "잤어요" : "갔어요"));
      sentence = `예전에 자주 ${pastSuffix}.`;
      grammarRule = "Combine past tense with frequency adverbs like '자주' (often) to express past habit.";
    } else if (sandboxAspect === "Ongoing (Progressive)") {
      sentence = `${stem}고 있었어요.`;
      grammarRule = "Attach -고 있었어요 to the verb stem to express that an action was ongoing in the past.";
    } else if (sandboxAspect === "Already (Completed state)") {
      const pastSuffix = sandboxVerb === "공부하다" ? "공부했어요" : (sandboxVerb === "먹다" ? "먹었어요" : (sandboxVerb === "자다" ? "잤어요" : "갔어요"));
      sentence = `이미 ${pastSuffix}.`;
      grammarRule = "Use adverb '이미' (already) with past tense to show that the action is completed.";
    } else if (sandboxAspect === "Still (Continuing present)") {
      const presSuffix = sandboxVerb === "공부하다" ? "공부하고 있어요" : (sandboxVerb === "먹다" ? "먹고 있어요" : (sandboxVerb === "자다" ? "자고 있어요" : "가고 있어요"));
      sentence = `아직도 ${presSuffix}.`;
      grammarRule = "Combine adverb '아직도' (still) with present progressive -고 있어요 to show continuing state.";
    } else if (sandboxAspect === "Not Yet (Expected future)") {
      const negSuffix = sandboxVerb === "공부하다" ? "안 공부했어요" : (sandboxVerb === "먹다" ? "안 먹었어요" : (sandboxVerb === "자다" ? "안 잤어요" : "안 갔어요"));
      sentence = `아직 ${negSuffix}.`;
      grammarRule = "Combine adverb '아직' (yet) with negative past tense to express 'not yet done'.";
    }

    return {
      sentence,
      grammarRule
    };
  };

  // Activity 1 check
  const handleCheckRec = async () => {
    const current = recItems[recIdx];
    if (!current || !recSelected) return;
    try {
      const res = await apiJson("/phase-6/items/recognition/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: recSelected })
      });
      setRecCorrect(res.correct);
      setRecChecked(true);
      setRecExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextRec = () => {
    setRecSelected(null);
    setRecChecked(false);
    setRecCorrect(null);
    setRecExplanation("");
    if (recIdx < recItems.length - 1) {
      setRecIdx(prev => prev + 1);
    }
  };

  // Activity 2A check
  const handleCheckHvs = async () => {
    const current = hvsItems[hvsIdx];
    if (!current || !hvsInput) return;
    try {
      const res = await apiJson("/phase-6/items/habit-vs-single/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, user_input: hvsInput })
      });
      setHvsCorrect(res.correct);
      setHvsChecked(true);
      setHvsExplanation(res.explanation);
      if (res.correct) {
        playAudio(res.correct_sentence);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextHvs = () => {
    setHvsInput("");
    setHvsChecked(false);
    setHvsCorrect(null);
    setHvsExplanation("");
    if (hvsIdx < hvsItems.length - 1) {
      setHvsIdx(prev => prev + 1);
    }
  };

  // Activity 2B check
  const handleCheckBge = async () => {
    const current = bgeItems[bgeIdx];
    if (!current || !bgeInput) return;
    try {
      const res = await apiJson("/phase-6/items/background-event/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, user_input: bgeInput })
      });
      setBgeCorrect(res.correct);
      setBgeChecked(true);
      setBgeExplanation(res.explanation);
      if (res.correct) {
        playAudio(res.correct_sentence);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextBge = () => {
    setBgeInput("");
    setBgeChecked(false);
    setBgeCorrect(null);
    setBgeExplanation("");
    if (bgeIdx < bgeItems.length - 1) {
      setBgeIdx(prev => prev + 1);
    }
  };

  // Activity 2C check
  const handleCheckTs = async () => {
    const current = tsItems[tsIdx];
    if (!current || !tsInput) return;
    try {
      const res = await apiJson("/phase-6/items/time-status/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, user_input: tsInput })
      });
      setTsCorrect(res.correct);
      setTsChecked(true);
      setTsExplanation(res.explanation);
      if (res.correct) {
        playAudio(res.correct_sentence);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextTs = () => {
    setTsInput("");
    setTsChecked(false);
    setTsCorrect(null);
    setTsExplanation("");
    if (tsIdx < tsItems.length - 1) {
      setTsIdx(prev => prev + 1);
    }
  };

  // Quiz flow
  const handleCheckQuizAnswer = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelected) return;
    try {
      const res = await apiJson("/phase-6/quiz/answer", {
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
        await apiJson("/phase-6/quiz/finish", {
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
      const res = await apiJson("/phase-6/homework/submit", {
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
      const res = await apiJson("/phase-6/complete", { method: "POST" });
      setCompletionData(res);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingLab(false);
    }
  };

  const sandboxRes = getSandboxAspectConjugation();

    const outlineSteps = [
    { num: 1, label: "= 1 ? \"bg-amber-500\" : \"bg-slate-700\"}`} /> Screen 1: Welcome & Goals Overview" },
    { num: 2, label: "= 2 ? \"bg-orange-500\" : \"bg-slate-700\"}`} /> Screen 2: Aspect Explanations & Sandbox" },
    { num: 3, label: "= 3 ? \"bg-blue-500\" : \"bg-slate-700\"}`} /> Screen 3: Aspect Recognition (Habit, Progressive, Time Status)" },
    { num: 4, label: "= 4 ? \"bg-green-500\" : \"bg-slate-700\"}`} /> Screen 4: Aspect Production (Habitual, Background Event, adverbs)" },
    { num: 5, label: "= 5 ? \"bg-purple-500\" : \"bg-slate-700\"}`} /> Screen 5: Aspect Mastery Quiz (5 Questions)" },
    { num: 6, label: "= 6 ? \"bg-pink-500\" : \"bg-slate-700\"}`} /> Screen 6: Homework & AI Aspect Verification" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 7,
          phaseNum: 6,
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
          <Trophy className="w-5 h-5 text-yellow-400" />
          <div>
            <h2 className="font-black text-xl text-white tracking-tight">Grammar Lab 6</h2>
            <p className="text-xs text-zinc-400">Tense & Aspect Nuance</p>
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
      {showOutline && (
        <div className="mb-6 p-5 bg-zinc-955/80 rounded-3xl border border-white/5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 relative z-30">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 font-mono">Curriculum Syllabus Map</span>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {outlineSteps.map(s => {
              const isCurrent = step === s.num;
              const isCompleted = s.num < step || s.num <= maxStep;
              return (
                <button
                  key={s.num}
                  disabled={!isCompleted && !isCurrent}
                  onClick={() => {
                    setStep(s.num);
                    setShowOutline(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    isCurrent
                      ? "border-brand-500 bg-brand-500/10 text-white"
                      : isCompleted
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/50"
                      : "border-red-500/20 bg-red-950/20 text-red-400/40 cursor-not-allowed opacity-50"
                  }`}
                >
                  <div className="text-[9px] font-black font-mono text-zinc-500">STEP {s.num}</div>
                  <div className="text-xs font-bold truncate">{s.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Container */}
      
        

        {/* SCREEN 1: WELCOME */}
        {step === 1 && (
          <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center relative overflow-hidden">
            <div className="relative mx-auto w-fit">
              <div className="p-4 bg-yellow-500/10 rounded-full border border-yellow-500/25 text-yellow-400">
                <Trophy className="w-10 h-10" />
              </div>
              <div className="absolute -top-1 -right-1 p-1 bg-brand-500 rounded-full border-2 border-zinc-950">
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
            </div>

            <div>
              <h2 className="text-5xl font-black text-white tracking-tight font-sans">{metadata?.title || "Grammar Lab 6"}</h2>
              <h3 className="text-xl font-bold text-yellow-400 mt-1">{metadata?.subtitle || "Tense & Aspect Nuance (B1)"}</h3>
            </div>

            <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
              {metadata?.description}
            </p>

            <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm space-y-3 max-w-2xl mx-auto w-full">
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Capstone Goals:</p>
              <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
                {(metadata?.goals || []).map((g: string, i: number) => <li key={i}>{g}</li>)}
              </ul>
              <p className="pt-2 text-zinc-400"><strong>⏱️ Est. Lab Time:</strong> {metadata?.estimated_minutes || "25"} minutes</p>
              <p className="text-zinc-400"><strong>🔗 Recommended Parallel Units:</strong> {metadata?.parallel_units}</p>
            </div>

            {/* Skill chips */}
            <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl mx-auto">
              {["Tense & Aspect", "B1 Nuance", "Verb Aspect Sandbox", "Writing & Editing"].map(chip => (
                <span key={chip} className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[10px] text-yellow-300 font-bold">{chip}</span>
              ))}
            </div>

            <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
              <button 
                onClick={() => {
    if (courseXP < 400) {
      alert("To start Phase 6, you need at least 400 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!");
      return;
    }
    setStep(2);
  }} 
                className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/20"
              >
                <Trophy className="w-4 h-4" /> Start Tense & Aspect Lab
              </button>
              
            </div>

            {showOutline && (
              <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-2 animate-fade-in max-w-2xl mx-auto w-full font-mono">
                <p className="font-extrabold text-white text-center pb-2">Lab Activities Outline:</p>
                <p>✓ Screen 1 – Welcome / Phase Overview</p>
                <p>✓ Screen 2 – Aspect Explanations & Sandbox</p>
                <p>✓ Screen 3 – Activity 1: Aspect Nuance Recognition</p>
                <p>✓ Screen 4 – Activity 2: Aspect Expression & Writing</p>
                <p>✓ Screen 5 – Mini-Quiz: Aspect Mastery</p>
                <p>✓ Screen 6 – Homework & AI Verification</p>
              </div>
            )}
          </div>
        )}

        {/* SCREEN 2: CONCEPT EXPLANATION */}
        {step === 2 && (
          <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-400 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-500" />
              Beyond Basic Past, Present & Future
            </h2>

            {coreData ? (
              <div className="space-y-6">
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
                  <h3 className="text-sm font-bold text-zinc-200 mb-2">Tense vs Aspect Nuances</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    While *tense* specifies the time vector, *aspect* handles internal duration or frequency. Korean leverages specific suffixes like **-고 있다** (progressive) and adverbs like **이미** (already) or **아직** (yet) to define aspectual status.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {coreData.aspect_types?.map((asp: any, idx: number) => (
                    <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1.5">
                      <span className="text-xs font-bold text-yellow-400 block">{asp.type}</span>
                      <p className="text-[11px] text-zinc-400 leading-normal">{asp.description}</p>
                      <div className="text-xs font-semibold text-zinc-200 bg-zinc-900 p-2 rounded border border-white/5">
                        {asp.example}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Verb Aspect Sandbox */}
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 rounded-xl border border-white/5/85">
                  <h3 className="text-sm font-bold text-zinc-200 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    Interactive Verb Aspect Sandbox
                  </h3>
                  <p className="text-xs text-zinc-400 mb-4">
                    Choose a verb and a target aspect to see how the markers and suffixes dynamically morph the sentence meaning!
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase mb-1">Root Verb</label>
                      <select 
                        value={sandboxVerb}
                        onChange={(e) => setSandboxVerb(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/5 text-xs text-zinc-200 rounded p-1.5 focus:outline-none"
                      >
                        <option value="공부하다">공부하다 (to study)</option>
                        <option value="먹다">먹다 (to eat)</option>
                        <option value="자다">자다 (to sleep)</option>
                        <option value="가다">가다 (to go)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase mb-1">Target Aspect / Nuance</label>
                      <select 
                        value={sandboxAspect}
                        onChange={(e) => setSandboxAspect(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/5 text-xs text-zinc-200 rounded p-1.5 focus:outline-none"
                      >
                        <option value="Single Event (Past)">Single Event (Past)</option>
                        <option value="Habitual (Used to)">Habitual (Used to)</option>
                        <option value="Ongoing (Progressive)">Ongoing (Progressive)</option>
                        <option value="Already (Completed state)">Already (Completed)</option>
                        <option value="Still (Continuing present)">Still (Continuing)</option>
                        <option value="Not Yet (Expected future)">Not Yet (Expected)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-lg border border-white/5 space-y-2">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Generated Nuance:</span>
                    <div className="text-base font-black text-yellow-400 flex items-center gap-2">
                      <span className="hover:underline cursor-pointer" onClick={() => playAudio(sandboxRes.sentence)}>
                        {sandboxRes.sentence}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 italic mt-1">{sandboxRes.grammarRule}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
            )}

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
                className="flex items-center gap-1 py-2.5 px-6 bg-yellow-500 hover:bg-yellow-400 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Proceed to Drills
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3: RECOGNITION DRILLS */}
        {step === 3 && (
          <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
            <div>
              <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 px-2 py-0.5 rounded-full font-bold">
                Activity 1: Nuance Recognition
              </span>
              <h2 className="text-xl font-bold mt-2 text-white">Distinguish Habits, Progress & Time status</h2>
              <p className="text-xs text-zinc-400">Classify aspectual states and identify markers in sentences.</p>
            </div>

            {recItems.length > 0 && (
              <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Part A: What nuance is expressed?</span>
                  <span>Item {recIdx + 1} of {recItems.length}</span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-zinc-500 uppercase font-black">Korean Target:</div>
                  <div className="text-lg font-black text-zinc-200 flex items-center gap-2">
                    <span className="hover:underline cursor-pointer" onClick={() => playAudio(recItems[recIdx]?.korean)}>
                      {recItems[recIdx]?.korean}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 italic">Gloss: {recItems[recIdx]?.english}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {recItems[recIdx]?.options?.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !recChecked && setRecSelected(opt)}
                      className={`py-3 px-4 rounded-xl text-xs font-semibold border transition text-left ${
                        recSelected === opt 
                          ? "border-yellow-500 bg-amber-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-300 hover:bg-slate-800"
                      } ${recChecked && opt === recItems[recIdx].correct ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                      disabled={recChecked}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {recChecked && (
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${recCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                    <strong>{recCorrect ? "Correct!" : "Incorrect."}</strong> {recExplanation}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  {!recChecked ? (
                    <button
                      onClick={handleCheckRec}
                      className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-250 transition"
                      disabled={!recSelected}
                    >
                      Check Aspect Nuance
                    </button>
                  ) : (
                    recIdx < recItems.length - 1 && (
                      <button
                        onClick={handleNextRec}
                        className="py-2.5 px-5 bg-yellow-500 hover:bg-yellow-400 text-xs font-bold rounded-lg text-white transition"
                      >
                        Next Item
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
              <button 
                onClick={() => {
    if (courseXP < 400) {
      alert("To start Phase 6, you need at least 400 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!");
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
                className="flex items-center gap-1 py-2.5 px-6 bg-yellow-500 hover:bg-yellow-400 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Proceed to Production
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4: PRODUCTION DRILLS */}
        {step === 4 && (
          <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
            <div>
              <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 px-2 py-0.5 rounded-full font-bold">
                Activity 2: Aspect Expression & Writing
              </span>
              <h2 className="text-xl font-bold mt-2 text-white">Write aspect-sensitive Korean clauses</h2>
              <p className="text-xs text-zinc-400">Generate narratives specifying progressive, habitual, or time-status nuances.</p>
            </div>

            {/* A: Habit vs Single */}
            {hvsItems.length > 0 && (
              <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Part A: Habitual childhood expression</span>
                  <span>Item {hvsIdx + 1} of {hvsItems.length}</span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-zinc-500 uppercase font-black">Prompt scenario:</div>
                  <div className="text-sm font-bold text-zinc-200">{hvsItems[hvsIdx]?.context}</div>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={hvsInput}
                    onChange={(e) => setHvsInput(e.target.value)}
                    placeholder="Type Korean sentence containing habitual cues..."
                    className="w-full bg-zinc-900 border border-white/5 p-3.5 rounded-xl text-white placeholder-slate-500 outline-none focus:border-yellow-500 text-sm font-medium"
                    disabled={hvsChecked}
                  />

                  {hvsChecked && (
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed ${hvsCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                      <strong>{hvsCorrect ? "Correct!" : "Incorrect."}</strong> {hvsExplanation}
                      <div className="mt-1 font-mono text-zinc-300">Model Answer: <span className="underline decoration-amber-400">{hvsItems[hvsIdx]?.correct_patterns[0]}</span></div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  {!hvsChecked ? (
                    <button
                      onClick={handleCheckHvs}
                      className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-zinc-200 transition"
                      disabled={!hvsInput.trim()}
                    >
                      Check Habit Aspect
                    </button>
                  ) : (
                    hvsIdx < hvsItems.length - 1 && (
                      <button
                        onClick={handleNextHvs}
                        className="py-2.5 px-5 bg-yellow-500 hover:bg-yellow-400 text-xs font-bold rounded-lg text-white transition"
                      >
                        Next Item
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* B: Background Event */}
            {bgeItems.length > 0 && (
              <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Part B: Progressive background vs Single past event</span>
                  <span>Item {bgeIdx + 1} of {bgeItems.length}</span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-zinc-500 uppercase font-black">English Goal:</div>
                  <div className="text-sm font-bold text-zinc-200">{bgeItems[bgeIdx]?.english}</div>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={bgeInput}
                    onChange={(e) => setBgeInput(e.target.value)}
                    placeholder="Type background clause (~고 있었을 때) + event..."
                    className="w-full bg-zinc-900 border border-white/5 p-3.5 rounded-xl text-white placeholder-slate-500 outline-none focus:border-yellow-500 text-sm font-medium"
                    disabled={bgeChecked}
                  />

                  {bgeChecked && (
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed ${bgeCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                      <strong>{bgeCorrect ? "Correct!" : "Incorrect."}</strong> {bgeExplanation}
                      <div className="mt-1 font-mono text-zinc-300">Model Answer: <span className="underline decoration-amber-400">{bgeItems[bgeIdx]?.correct_patterns[0]}</span></div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  {!bgeChecked ? (
                    <button
                      onClick={handleCheckBge}
                      className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-zinc-200 transition"
                      disabled={!bgeInput.trim()}
                    >
                      Verify Background Clause
                    </button>
                  ) : (
                    bgeIdx < bgeItems.length - 1 && (
                      <button
                        onClick={handleNextBge}
                        className="py-2.5 px-5 bg-yellow-500 hover:bg-yellow-400 text-xs font-bold rounded-lg text-white transition"
                      >
                        Next Item
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* C: Time status rewrite */}
            {tsItems.length > 0 && (
              <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Part C: Already / Still / Not yet rewriting</span>
                  <span>Item {tsIdx + 1} of {tsItems.length}</span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-zinc-500 uppercase font-black">English Constraint:</div>
                  <div className="text-sm font-bold text-zinc-200">{tsItems[tsIdx]?.english}</div>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={tsInput}
                    onChange={(e) => setTsInput(e.target.value)}
                    placeholder="Type status rewrite (e.g. 아직...안...)"
                    className="w-full bg-zinc-900 border border-white/5 p-3.5 rounded-xl text-white placeholder-slate-500 outline-none focus:border-yellow-500 text-sm font-medium"
                    disabled={tsChecked}
                  />

                  {tsChecked && (
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed ${tsCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                      <strong>{tsCorrect ? "Correct!" : "Incorrect."}</strong> {tsExplanation}
                      <div className="mt-1 font-mono text-zinc-300">Model Answer: <span className="underline decoration-amber-400">{tsItems[tsIdx]?.correct_patterns[0]}</span></div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  {!tsChecked ? (
                    <button
                      onClick={handleCheckTs}
                      className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-zinc-200 transition"
                      disabled={!tsInput.trim()}
                    >
                      Verify Time Suffix
                    </button>
                  ) : (
                    tsIdx < tsItems.length - 1 && (
                      <button
                        onClick={handleNextTs}
                        className="py-2.5 px-5 bg-yellow-500 hover:bg-yellow-400 text-xs font-bold rounded-lg text-white transition"
                      >
                        Next Item
                      </button>
                    )
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
                className="flex items-center gap-1 py-2.5 px-6 bg-yellow-500 hover:bg-yellow-400 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Proceed to Quiz
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 5: MINI-QUIZ */}
        {step === 5 && (
          <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-brand-500 flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" />
              Tense & Aspect Mastery Quiz
            </h2>

            {quizBlueprint.length > 0 && quizScore === null && (
              <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Question {quizIdx + 1} of {quizBlueprint.length}</span>
                  <span>Mistakes: {quizMistakes.length}</span>
                </div>

                <div className="text-base font-extrabold text-zinc-200">
                  {quizBlueprint[quizIdx]?.question}
                </div>

                <div className="space-y-2 pt-2">
                  {quizBlueprint[quizIdx]?.options?.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelected(opt)}
                      className={`w-full text-left p-3.5 rounded-xl text-xs font-semibold border transition flex justify-between items-center ${
                        quizSelected === opt 
                          ? "border-yellow-500 bg-amber-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-slate-350 hover:bg-slate-800"
                      } ${quizChecked && opt === quizBlueprint[quizIdx].correct_answer ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                      disabled={quizChecked}
                    >
                      <span>{opt}</span>
                      {quizSelected === opt && quizChecked && (
                        <Check className={`w-4 h-4 ${quizCorrect ? "text-green-500" : "text-red-500"}`} />
                      )}
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
                      className="py-2 px-4 bg-yellow-500 hover:bg-yellow-400 text-xs font-bold rounded-lg text-white transition"
                      disabled={!quizSelected}
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuiz}
                      className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg text-white transition flex items-center gap-1"
                      disabled={finishingQuiz}
                    >
                      {finishingQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {quizScore !== null && (
              <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-center space-y-4">
                <Award className="w-16 h-16 text-yellow-500 mx-auto animate-bounce" />
                <h3 className="text-2xl font-black text-white">Quiz Completed!</h3>
                <p className="text-sm text-zinc-400">
                  You scored a <span className="font-extrabold text-yellow-400">{quizScore}%</span> on Tense & Aspect proficiency.
                </p>

                <div className="flex justify-center gap-3">
                  <button 
                    onClick={handleRestartQuiz}
                    className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-zinc-200 transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Retry Quiz
                  </button>
                  <button 
                    onClick={() => setStep(6)}
                    className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-xl text-white transition"
                  >
                    Go to Homework
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
              <button 
                onClick={() => setStep(4)}
                className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
                disabled={quizScore === null}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <div />
            </div>
          </div>
        )}

        {/* SCREEN 6: HOMEWORK & INTEGRATION */}
        {step === 6 && (
          <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
            
            {/* Badge award */}
            {quizScore !== null && (
              <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-2xl p-5 text-center space-y-2 animate-fade-in">
                <Trophy className="w-9 h-9 text-yellow-400 mx-auto" />
                <p className="text-white font-black">🎉 Course Completion Badge!</p>
                <p className="text-yellow-300 font-bold text-sm">Grammar Lab Graduate</p>
                <p className="text-zinc-400 text-xs">Quiz Score: <span className="text-white font-bold">{quizScore}%</span> · XP: <span className="text-yellow-400 font-bold">+200</span></p>
              </div>
            )}

            {/* Course completion card */}
            <div className="p-4 bg-gradient-to-br from-yellow-500/5 via-brand-500/5 to-accent-teal/5 border border-yellow-500/20 rounded-2xl text-center space-y-1">
              <p className="font-black text-white text-sm">🏆 Course 7: Grammar Lab (Advanced Syntax)</p>
              <p className="text-zinc-400 text-xs">You've completed the entire Grammar Lab course!</p>
            </div>

            <div>
              <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 px-2 py-0.5 rounded-full font-bold">
                Screen 6: Homework & Lab Summary
              </span>
              <h2 className="text-xl font-bold mt-2 text-white font-sans">AI-Assisted Aspect Validation Workspace</h2>
              <p className="text-xs text-zinc-400">Compose and verify original sentences representing different aspect states.</p>
            </div>

            {homeworkItems.length > 0 && (
              <div className="space-y-4">
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Homework Prompts:</h4>
                  <ul className="space-y-2 text-xs text-slate-350">
                    {homeworkItems.map((hw: any) => (
                      <li key={hw.id} className="flex gap-2">
                        <span className="text-yellow-400">•</span>
                        <span>{hw.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-zinc-400">Write 3 Korean sentences using target aspect adverbs/suffixes:</span>
                  {hwSents.map((sent, sIdx) => (
                    <div key={sIdx} className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase font-semibold">Sentence {sIdx + 1}:</label>
                      <input
                        type="text"
                        value={sent}
                        onChange={(e) => handleHwChange(sIdx, e.target.value)}
                        placeholder="Type Korean sentence (e.g. 공부하고 있었어요, 아직 안 먹었어요...)"
                        className="w-full bg-zinc-950 border border-white/10 p-3 rounded-lg text-xs outline-none focus:border-yellow-500 font-medium"
                      />
                    </div>
                  ))}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSubmitHomework}
                      className="py-2.5 px-6 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold rounded-xl text-zinc-200 transition flex items-center gap-1 cursor-pointer"
                      disabled={submittingHw || hwSents.every(s => !s.trim())}
                    >
                      {submittingHw && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Verify Aspect with AI Tutor</span>
                    </button>
                  </div>
                </div>

                {hwFeedback.length > 0 && (
                  <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
                    <span className="text-xs font-bold text-slate-350 block">AI Homework Analysis Summary:</span>
                    {hwFeedback.map((fb, fIdx) => (
                      <div key={fIdx} className="p-3 bg-zinc-900 rounded border border-white/5 text-xs space-y-1">
                        <div className="font-bold text-zinc-200">Sentence: "{fb.original}"</div>
                        <div className={`font-semibold ${fb.is_correct ? "text-green-400" : "text-red-400"}`}>
                          Status: {fb.is_correct ? "Valid narrative aspect" : "Needs aspect markers"}
                        </div>
                        <div className="text-zinc-400 leading-normal">{fb.why}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="bg-gradient-to-br from-yellow-500/5 via-brand-500/5 to-accent-teal/5 border border-yellow-500/20 p-6 rounded-2xl text-center space-y-4">
              <Trophy className="w-12 h-12 text-yellow-400 mx-auto animate-bounce" />
              <h3 className="text-lg font-extrabold text-white">Lab Completion Checkpoint</h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                Once satisfied with your writing drills, complete the lab, earn XP, and register your B1 aspect mastery badge.
              </p>

              {completionData && (
                <div className="text-xs text-green-400 font-semibold bg-green-950/20 border border-green-900 py-2.5 rounded-lg max-w-xs mx-auto">
                  Status: Completed! Badge earned: {completionData.badge}
                </div>
              )}

              <button
                onClick={handleCompleteLab}
                className="py-3 px-8 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold rounded-xl text-sm transition shadow-lg shadow-yellow-500/20 cursor-pointer flex items-center gap-1.5 mx-auto"
                disabled={completingLab}
              >
                {completingLab && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Complete Lab & Claim Badge</span>
              </button>
            </div>

            <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
              <button 
                onClick={() => setStep(5)}
                className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
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
                if (typeof setQuizChecked === "function") setQuizChecked(false);
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
