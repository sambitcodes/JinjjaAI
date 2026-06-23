"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  const cleanPath = (path.startsWith("/phases/") || path.startsWith("/phase-2/")) ? `/grammar-lab${path}` : path;
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

interface Course7Phase2ParticlesWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course7Phase2ParticlesWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course7Phase2ParticlesWizardProps) {
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c7p2_step");
    const savedMax = localStorage.getItem("hangeulai_c7p2_max_step");
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
      localStorage.setItem("hangeulai_c7p2_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);

  // Loaded data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1: Particle Choice
  const [choiceItems, setChoiceItems] = useState<any[]>([]);
  const [choiceIdx, setChoiceIdx] = useState(0);
  const [choiceSelected, setChoiceSelected] = useState<string | null>(null);
  const [choiceChecked, setChoiceChecked] = useState(false);
  const [choiceCorrect, setChoiceCorrect] = useState<boolean | null>(null);
  const [choiceExplanation, setChoiceExplanation] = useState("");

  // Activity 2: Topic vs Subject
  const [tvsItems, setTvsItems] = useState<any[]>([]);
  const [tvsIdx, setTvsIdx] = useState(0);
  const [tvsSelected, setTvsSelected] = useState<string | null>(null);
  const [tvsChecked, setTvsChecked] = useState(false);
  const [tvsCorrect, setTvsCorrect] = useState<boolean | null>(null);
  const [tvsExplanation, setTvsExplanation] = useState("");

  // Activity 3: Object vs Subject
  const [ovsItems, setOvsItems] = useState<any[]>([]);
  const [ovsIdx, setOvsIdx] = useState(0);
  const [ovsAns1, setOvsAns1] = useState<string>("");
  const [ovsAns2, setOvsAns2] = useState<string>("");
  const [ovsChecked, setOvsChecked] = useState(false);
  const [ovsCorrect, setOvsCorrect] = useState<boolean | null>(null);
  const [ovsExplanation, setOvsExplanation] = useState("");

  // Activity 4: Insert Particles (typing)
  const [insertItems, setInsertItems] = useState<any[]>([]);
  const [insertIdx, setInsertIdx] = useState(0);
  const [insertInput, setInsertInput] = useState("");
  const [insertChecked, setInsertChecked] = useState(false);
  const [insertCorrect, setInsertCorrect] = useState<boolean | null>(null);
  const [insertExplanation, setInsertExplanation] = useState("");

  // Activity 5: Topic Rewrite (typing)
  const [rewriteItems, setRewriteItems] = useState<any[]>([]);
  const [rewriteIdx, setRewriteIdx] = useState(0);
  const [rewriteInput, setRewriteInput] = useState("");
  const [rewriteChecked, setRewriteChecked] = useState(false);
  const [rewriteCorrect, setRewriteCorrect] = useState<boolean | null>(null);
  const [rewriteExplanation, setRewriteExplanation] = useState("");

  // Activity 6: Location 에 vs 에서
  const [locItems, setLocItems] = useState<any[]>([]);
  const [locIdx, setLocIdx] = useState(0);
  const [locSelected, setLocSelected] = useState<string | null>(null);
  const [locChecked, setLocChecked] = useState(false);
  const [locCorrect, setLocCorrect] = useState<boolean | null>(null);
  const [locExplanation, setLocExplanation] = useState("");

  // Interactive Particle Calculator (Tool on Screen 2)
  const [calcWord, setCalcWord] = useState("");
  const [calcResult, setCalcResult] = useState<any>(null);

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
          if (choiceItems.length === 0) {
            const resC = await apiJson("/phase-2/items/particle-choice");
            setChoiceItems(resC);
          }
          if (tvsItems.length === 0) {
            const resT = await apiJson("/phase-2/items/topic-vs-subject");
            setTvsItems(resT);
          }
          if (ovsItems.length === 0) {
            const resO = await apiJson("/phase-2/items/object-vs-subject");
            setOvsItems(resO);
          }
        } else if (step === 4) {
          if (insertItems.length === 0) {
            const resIns = await apiJson("/phase-2/items/insert-particles");
            setInsertItems(resIns);
          }
          if (rewriteItems.length === 0) {
            const resRew = await apiJson("/phase-2/items/topic-rewrite");
            setRewriteItems(resRew);
          }
          if (locItems.length === 0) {
            const resLoc = await apiJson("/phase-2/items/location");
            setLocItems(resLoc);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/phase-2/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-2/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading Grammar Lab Phase 2:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  const checkBatchim = (word: string) => {
    if (!word) return null;
    const cleanWord = word.trim();
    if (cleanWord.length === 0) return null;
    const lastChar = cleanWord[cleanWord.length - 1];
    const code = lastChar.charCodeAt(0);
    let hasBatchim = false;
    if (code >= 0xAC00 && code <= 0xD7A3) {
      hasBatchim = (code - 0xAC00) % 28 !== 0;
    }
    return {
      char: lastChar,
      hasBatchim,
      particles: {
        topic: hasBatchim ? "은" : "는",
        subject: hasBatchim ? "이" : "가",
        object: hasBatchim ? "을" : "를"
      }
    };
  };

  const handleCalcChange = (val: string) => {
    setCalcWord(val);
    const result = checkBatchim(val);
    setCalcResult(result);
  };

  const handleCheckChoice = async () => {
    const current = choiceItems[choiceIdx];
    if (!current || !choiceSelected) return;
    try {
      const res = await apiJson("/phase-2/items/particle-choice/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: choiceSelected })
      });
      setChoiceCorrect(res.correct);
      setChoiceChecked(true);
      setChoiceExplanation(res.explanation);
      if (res.correct) {
        playAudio(current.sentence_blank.replace("___", current.correct));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextChoice = () => {
    setChoiceSelected(null);
    setChoiceChecked(false);
    setChoiceCorrect(null);
    setChoiceExplanation("");
    if (choiceIdx < choiceItems.length - 1) {
      setChoiceIdx(prev => prev + 1);
    }
  };

  const handleCheckTvs = async () => {
    const current = tvsItems[tvsIdx];
    if (!current || !tvsSelected) return;
    try {
      const res = await apiJson("/phase-2/items/topic-vs-subject/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: tvsSelected })
      });
      setTvsCorrect(res.correct);
      setTvsChecked(true);
      setTvsExplanation(res.explanation);
      if (res.correct) {
        playAudio(current.sentence_blank.replace("___", current.correct));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextTvs = () => {
    setTvsSelected(null);
    setTvsChecked(false);
    setTvsCorrect(null);
    setTvsExplanation("");
    if (tvsIdx < tvsItems.length - 1) {
      setTvsIdx(prev => prev + 1);
    }
  };

  const handleCheckOvs = async () => {
    const current = ovsItems[ovsIdx];
    if (!current || !ovsAns1 || !ovsAns2) return;
    try {
      const res = await apiJson("/phase-2/items/object-vs-subject/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, ans_1: ovsAns1, ans_2: ovsAns2 })
      });
      setOvsCorrect(res.correct);
      setOvsChecked(true);
      setOvsExplanation(res.explanation);
      if (res.correct) {
        playAudio("개가 밥을 먹어요.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextOvs = () => {
    setOvsAns1("");
    setOvsAns2("");
    setOvsChecked(false);
    setOvsCorrect(null);
    setOvsExplanation("");
    if (ovsIdx < ovsItems.length - 1) {
      setOvsIdx(prev => prev + 1);
    }
  };

  const handleCheckInsert = async () => {
    const current = insertItems[insertIdx];
    if (!current || !insertInput) return;
    try {
      const res = await apiJson("/phase-2/items/insert-particles/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, user_input: insertInput })
      });
      setInsertCorrect(res.correct);
      setInsertChecked(true);
      setInsertExplanation(res.explanation);
      if (res.correct) {
        playAudio(current.sentence_missing.replace("[ ]", current.correct));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextInsert = () => {
    setInsertInput("");
    setInsertChecked(false);
    setInsertCorrect(null);
    setInsertExplanation("");
    if (insertIdx < insertItems.length - 1) {
      setInsertIdx(prev => prev + 1);
    }
  };

  const handleCheckRewrite = async () => {
    const current = rewriteItems[rewriteIdx];
    if (!current || !rewriteInput) return;
    try {
      const res = await apiJson("/phase-2/items/topic-rewrite/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, user_input: rewriteInput })
      });
      setRewriteCorrect(res.correct);
      setRewriteChecked(true);
      setRewriteExplanation(res.explanation);
      if (res.correct) {
        playAudio(res.correct_pattern);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextRewrite = () => {
    setRewriteInput("");
    setRewriteChecked(false);
    setRewriteCorrect(null);
    setRewriteExplanation("");
    if (rewriteIdx < rewriteItems.length - 1) {
      setRewriteIdx(prev => prev + 1);
    }
  };

  const handleCheckLoc = async () => {
    const current = locItems[locIdx];
    if (!current || !locSelected) return;
    try {
      const res = await apiJson("/phase-2/items/location/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: locSelected })
      });
      setLocCorrect(res.correct);
      setLocChecked(true);
      setLocExplanation(res.explanation);
      if (res.correct) {
        playAudio(current.sentence_blank.replace("___", current.correct));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextLoc = () => {
    setLocSelected(null);
    setLocChecked(false);
    setLocCorrect(null);
    setLocExplanation("");
    if (locIdx < locItems.length - 1) {
      setLocIdx(prev => prev + 1);
    }
  };

  const handleCheckQuizAnswer = async () => {
    const q = quizBlueprint[quizIdx];
    if (!q || !quizSelected) return;
    try {
      const res = await apiJson("/phase-2/quiz/answer", {
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
          phaseNum: 2,
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
              <span>{metadata?.title || "Grammar Lab 2"}</span>
            </h2>
            <p className="text-xs text-zinc-550 font-medium">Topic: Particles & Case Marking</p>
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

      {/* Screen 1: Welcome/Overview */}
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
    if (courseXP < 80) {
      alert("To start Phase 2, you need at least 80 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!");
      return;
    }
    setStep(2);
  }}
              className="bg-indigo-500 hover:bg-indigo-650 text-white font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              <span>Start Particle Lab</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
          </div>
        </div>
      )}

      {/* Screen 2: Concept Explanation */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Mastering Korean Particles</span>
          </h2>

          {coreData ? (
            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-4">
                {coreData.definitions?.map((def: any, idx: number) => (
                  <div key={idx} className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-indigo-400 text-base block mb-1">{def.particle}</span>
                      <p className="text-xs text-slate-300 leading-relaxed mb-3">{def.usage}</p>
                    </div>
                    <div className="space-y-1.5 bg-zinc-950 p-3 rounded border border-white/5">
                      {def.examples?.map((ex: any, eIdx: number) => (
                        <div key={eIdx} className="text-xs flex justify-between items-center">
                          <span 
                            onClick={() => playAudio(ex.korean)}
                            className="text-cyan-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            {ex.korean}
                          </span>
                          <span className="text-slate-400">{ex.english}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculator tool */}
              <div className="bg-zinc-900/40 p-5 rounded-xl border border-white/5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Particle Calculator
                </h3>
                <input 
                  type="text"
                  value={calcWord}
                  onChange={(e) => handleCalcChange(e.target.value)}
                  placeholder="Type a Korean word..."
                  className="w-full bg-zinc-950 border border-white/10 px-4 py-2.5 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
                {calcResult && (
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="p-2 bg-zinc-950 rounded border border-white/5">
                      <span className="text-[10px] text-zinc-500 block uppercase">Topic</span>
                      <span className="font-bold text-indigo-400">{calcResult.particles.topic}</span>
                    </div>
                    <div className="p-2 bg-zinc-950 rounded border border-white/5">
                      <span className="text-[10px] text-zinc-500 block uppercase">Subject</span>
                      <span className="font-bold text-indigo-400">{calcResult.particles.subject}</span>
                    </div>
                    <div className="p-2 bg-zinc-950 rounded border border-white/5">
                      <span className="text-[10px] text-zinc-500 block uppercase">Object</span>
                      <span className="font-bold text-indigo-400">{calcResult.particles.object}</span>
                    </div>
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

      {/* Screen 3: Guided Choice Drills */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Activity 1 – Particle Drills</span>
            </h2>
            <span className="text-xs text-zinc-550 font-bold">Step 3/6</span>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {/* Particle choice */}
            {choiceItems.length > 0 && (
              <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider block">Part A: Choose the particle</span>
                <div className="text-center py-4">
                  <h3 className="text-2xl font-black text-white">{choiceItems[choiceIdx].sentence_blank}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{choiceItems[choiceIdx].english}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                  {choiceItems[choiceIdx].options?.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !choiceChecked && setChoiceSelected(opt)}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                        choiceSelected === opt 
                          ? "border-indigo-500 bg-indigo-500/15 text-white" 
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      }`}
                      disabled={choiceChecked}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {choiceChecked && (
                  <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 max-w-sm mx-auto">
                    <p className="font-extrabold text-white">{choiceCorrect ? "✓ Correct!" : `✗ Incorrect. Answer: ${choiceItems[choiceIdx].correct}`}</p>
                    <p className="mt-1">{choiceExplanation}</p>
                  </div>
                )}
                <div className="flex justify-end pt-1">
                  {!choiceChecked ? (
                    <button onClick={handleCheckChoice} disabled={!choiceSelected} className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition">Check</button>
                  ) : (
                    choiceIdx < choiceItems.length - 1 && <button onClick={handleNextChoice} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition">Next Item</button>
                  )}
                </div>
              </div>
            )}

            {/* Topic vs Subject */}
            {tvsItems.length > 0 && (
              <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider block">Part B: Topic vs Subject Marker</span>
                <div className="text-center py-4">
                  <h3 className="text-2xl font-black text-white">{tvsItems[tvsIdx].sentence_blank}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{tvsItems[tvsIdx].english}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                  {tvsItems[tvsIdx].options?.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !tvsChecked && setTvsSelected(opt)}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                        tvsSelected === opt 
                          ? "border-indigo-500 bg-indigo-500/15 text-white" 
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      }`}
                      disabled={tvsChecked}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {tvsChecked && (
                  <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 max-w-sm mx-auto">
                    <p className="font-extrabold text-white">{tvsCorrect ? "✓ Correct!" : `✗ Incorrect.`}</p>
                    <p className="mt-1">{tvsExplanation}</p>
                  </div>
                )}
                <div className="flex justify-end pt-1">
                  {!tvsChecked ? (
                    <button onClick={handleCheckTvs} disabled={!tvsSelected} className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition">Check</button>
                  ) : (
                    tvsIdx < tvsItems.length - 1 && <button onClick={handleNextTvs} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition">Next Item</button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => {
    if (courseXP < 80) {
      alert("To start Phase 2, you need at least 80 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!");
      return;
    }
    setStep(2);
  }} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Writing drills */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Activity 2 – Production Drills</span>
            </h2>
            <span className="text-xs text-zinc-550 font-bold">Step 4/6</span>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {/* Insert particles */}
            {insertItems.length > 0 && (
              <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider block">Part A: Type the particle</span>
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 mb-1">{insertItems[insertIdx].prompt}</h4>
                  <p className="text-lg font-black text-white font-korean">{insertItems[insertIdx].sentence_missing}</p>
                </div>
                <input
                  type="text"
                  value={insertInput}
                  onChange={(e) => setInsertInput(e.target.value)}
                  placeholder="Type particle..."
                  className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500 text-sm font-medium"
                  disabled={insertChecked}
                />
                {insertChecked && (
                  <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400">
                    <p className="font-extrabold text-white">{insertCorrect ? "✓ Correct!" : `✗ Incorrect.`}</p>
                    <p className="mt-1">{insertExplanation}</p>
                  </div>
                )}
                <div className="flex justify-end pt-1">
                  {!insertChecked ? (
                    <button onClick={handleCheckInsert} disabled={!insertInput.trim()} className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition">Check</button>
                  ) : (
                    insertIdx < insertItems.length - 1 && <button onClick={handleNextInsert} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition">Next Item</button>
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
            <span>Particle Proficiency Quiz</span>
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
                    onClick={() => !quizChecked && setQuizSelected(opt)}
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
              <h3 className="text-sm font-extrabold text-white">Complete Phase 2</h3>
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
