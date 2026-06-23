"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  MicOff,
  Check,
  MessageSquare,
  ArrowRight,
  HelpCircle,
  Undo
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
  const cleanPath = (path.startsWith("/phases/") || path.startsWith("/phase-1/")) ? `/grammar-lab${path}` : path;
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

async function apiForm(path: string, formData: FormData) {
  const token = getToken();
  const cleanPath = (path.startsWith("/phases/") || path.startsWith("/phase-1/")) ? `/grammar-lab${path}` : path;
  const res = await fetch(`${API_BASE}${cleanPath}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

// Audio recorder utility hook
function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);

  const start = useCallback(async () => {
    setAudioBlob(null);
    chunks.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => chunks.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("Microphone access denied. Please allow microphone permissions and try again.") } }));
    }
  }, []);

  const stop = useCallback(() => {
    mediaRef.current?.stop();
    setRecording(false);
  }, []);

  return { recording, audioBlob, start, stop, setAudioBlob };
}

interface Course7Phase1GrammarLabWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course7Phase1GrammarLabWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course7Phase1GrammarLabWizardProps) {
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
    const savedStep = localStorage.getItem("hangeulai_c7p1_step");
    const savedMax = localStorage.getItem("hangeulai_c7p1_max_step");
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
      localStorage.setItem("hangeulai_c7p1_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);

  // Loaded data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1A: Build
  const [buildItems, setBuildItems] = useState<any[]>([]);
  const [buildIdx, setBuildIdx] = useState(0);
  const [buildWorkspace, setBuildWorkspace] = useState<any[]>([]);
  const [buildCorrect, setBuildCorrect] = useState<boolean | null>(null);
  const [buildChecked, setBuildChecked] = useState(false);
  const [buildExplanation, setBuildExplanation] = useState("");

  // Activity 1B: Repair
  const [repairItems, setRepairItems] = useState<any[]>([]);
  const [repairIdx, setRepairIdx] = useState(0);
  const [repairWorkspace, setRepairWorkspace] = useState<any[]>([]);
  const [repairCorrect, setRepairCorrect] = useState<boolean | null>(null);
  const [repairChecked, setRepairChecked] = useState(false);
  const [repairExplanation, setRepairExplanation] = useState("");

  // Activity 2A: Phrase to Sentence
  const [ptsItems, setPtsItems] = useState<any[]>([]);
  const [ptsIdx, setPtsIdx] = useState(0);
  const [ptsInput, setPtsInput] = useState("");
  const [ptsChecked, setPtsChecked] = useState(false);
  const [ptsCorrect, setPtsCorrect] = useState<boolean | null>(null);
  const [ptsExplanation, setPtsExplanation] = useState("");
  const [ptsModel, setPtsModel] = useState("");

  // Activity 2B: Transform
  const [transformItems, setTransformItems] = useState<any[]>([]);
  const [transformIdx, setTransformIdx] = useState(0);
  const [transformMode, setTransformMode] = useState<"question" | "negation">("question");
  const [transformInput, setTransformInput] = useState("");
  const [transformChecked, setTransformChecked] = useState(false);
  const [transformCorrect, setTransformCorrect] = useState<boolean | null>(null);
  const [transformExplanation, setTransformExplanation] = useState("");

  // Activity 2C: Speaking
  const rec = useRecorder();
  const [speakingChecking, setSpeakingChecking] = useState(false);
  const [speakingFeedback, setSpeakingFeedback] = useState("");

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
          const res = await apiJson("/phases/1/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/1/core-data");
          setCoreData(res);
        } else if (step === 3) {
          if (buildItems.length === 0) {
            const resB = await apiJson("/phase-1/items/build");
            setBuildItems(resB);
            setBuildWorkspace([]);
          }
          if (repairItems.length === 0) {
            const resR = await apiJson("/phase-1/items/repair");
            setRepairItems(resR);
            setRepairWorkspace([]);
          }
        } else if (step === 4) {
          if (ptsItems.length === 0) {
            const resPts = await apiJson("/phase-1/items/phrase-to-sentence");
            setPtsItems(resPts);
          }
          if (transformItems.length === 0) {
            const resTr = await apiJson("/phase-1/items/transform");
            setTransformItems(resTr);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/phase-1/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-1/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading Grammar Lab Phase 1:", err);
      }
    };
    load();
  }, [step]);

  // Audio Playback helper
  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1A functions
  const handleChunkClick = (chunk: any) => {
    if (buildWorkspace.some((c: any) => c.id === chunk.id)) {
      setBuildWorkspace(prev => prev.filter((c: any) => c.id !== chunk.id));
    } else {
      setBuildWorkspace(prev => [...prev, chunk]);
    }
  };

  const handleCheckBuild = async () => {
    const current = buildItems[buildIdx];
    if (!current) return;
    try {
      const order = buildWorkspace.map(c => c.id);
      const res = await apiJson("/phase-1/items/build/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, answer_order: order })
      });
      setBuildCorrect(res.correct);
      setBuildChecked(true);
      setBuildExplanation(res.explanation);
      if (res.correct) {
        playAudio(res.correct_sentence);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextBuild = () => {
    setBuildWorkspace([]);
    setBuildCorrect(null);
    setBuildChecked(false);
    setBuildExplanation("");
    if (buildIdx < buildItems.length - 1) {
      setBuildIdx(buildIdx + 1);
    } else {
      setBuildIdx(0);
    }
  };

  // Activity 1B functions
  const handleRepairChunkClick = (chunk: any) => {
    if (repairWorkspace.some((c: any) => c.id === chunk.id)) {
      setRepairWorkspace(prev => prev.filter((c: any) => c.id !== chunk.id));
    } else {
      setRepairWorkspace(prev => [...prev, chunk]);
    }
  };

  const handleCheckRepair = async () => {
    const current = repairItems[repairIdx];
    if (!current) return;
    try {
      const order = repairWorkspace.map(c => c.id);
      const res = await apiJson("/phase-1/items/repair/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, answer_order: order })
      });
      setRepairCorrect(res.correct);
      setRepairChecked(true);
      setRepairExplanation(res.explanation);
      if (res.correct) {
        playAudio(res.correct_sentence);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextRepair = () => {
    setRepairWorkspace([]);
    setRepairCorrect(null);
    setRepairChecked(false);
    setRepairExplanation("");
    if (repairIdx < repairItems.length - 1) {
      setRepairIdx(repairIdx + 1);
    } else {
      setRepairIdx(0);
    }
  };

  // Activity 2A functions
  const handleCheckPts = async () => {
    const current = ptsItems[ptsIdx];
    if (!current || !ptsInput.trim()) return;
    try {
      const res = await apiJson("/phase-1/items/phrase-to-sentence/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, typed_sentence: ptsInput })
      });
      setPtsCorrect(res.correct);
      setPtsChecked(true);
      setPtsExplanation(res.explanation);
      setPtsModel(res.model_sentence);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextPts = () => {
    setPtsInput("");
    setPtsChecked(false);
    setPtsCorrect(null);
    setPtsExplanation("");
    setPtsModel("");
    if (ptsIdx < ptsItems.length - 1) {
      setPtsIdx(ptsIdx + 1);
    } else {
      setPtsIdx(0);
    }
  };

  // Activity 2B functions
  const handleCheckTransform = async () => {
    const current = transformItems[transformIdx];
    if (!current || !transformInput.trim()) return;
    try {
      const res = await apiJson("/phase-1/items/transform/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, action_type: transformMode, user_input: transformInput })
      });
      setTransformCorrect(res.correct);
      setTransformChecked(true);
      setTransformExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextTransform = () => {
    setTransformInput("");
    setTransformChecked(false);
    setTransformCorrect(null);
    setTransformExplanation("");
    if (transformIdx < transformItems.length - 1) {
      setTransformIdx(transformIdx + 1);
    } else {
      setTransformIdx(0);
    }
  };

  // Activity 2C functions
  const handleSpeechCheck = async () => {
    const currentText = ptsItems[ptsIdx]?.correctKoreanPatterns[0] || "저는 밥을 먹어요.";
    setSpeakingChecking(true);
    try {
      const res = await apiJson("/phase-1/speaking-check", {
        method: "POST",
        body: JSON.stringify({ target_text: currentText })
      });
      setSpeakingFeedback(`${res.feedback} (Match Score: ${res.similarity_score}%)`);
    } catch (err) {
      console.error(err);
    } finally {
      setSpeakingChecking(false);
    }
  };

  // Quiz functions
  const handleCheckQuiz = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelected) return;
    try {
      const res = await apiJson("/phase-1/quiz/answer", {
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

  const handleNextQuizOrComplete = async () => {
    if (quizIdx < quizBlueprint.length - 1) {
      setQuizIdx(quizIdx + 1);
      setQuizSelected(null);
      setQuizChecked(false);
      setQuizCorrect(null);
      setQuizExplanation("");
    } else {
      setFinishingQuiz(true);
      try {
        const score = Math.round(((quizBlueprint.length - quizMistakes.length) / quizBlueprint.length) * 100);
        const res = await apiJson("/phase-1/quiz/finish", {
          method: "POST",
          body: JSON.stringify({ score, mistakes: quizMistakes })
        });
        setQuizScore(score);
        setStep(6);
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  // Homework submit
  const handleHwSubmit = async () => {
    setSubmittingHw(true);
    try {
      const res = await apiJson("/phase-1/homework/submit", {
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
      const res = await apiJson("/phase-1/complete", { method: "POST" });
      setCompletionData(res);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingLab(false);
    }
  };

    const outlineSteps = [
    { num: 1, label: "Screen 1 – Welcome / Phase Overview" },
    { num: 2, label: "Screen 2 – SOV & \"Verb at the End\" Concept" },
    { num: 3, label: "Screen 3 – Activity 1: Build & Repair Sentences (Drag/Drop)" },
    { num: 4, label: "Screen 4 – Activity 2: Typing & Transformations" },
    { num: 5, label: "Screen 5 – Mini-Quiz: Core Sentence Foundations" },
    { num: 6, label: "Screen 6 – Homework & Main Course Integration" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 7,
          phaseNum: 1,
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
              <span>{metadata?.title || "Grammar Lab 1"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: SOV Sentence Structure Foundations</p>
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
                const isCompleted = s.num < step || s.num <= maxStep;
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
    if (courseXP < 0) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 1, you need at least 0 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              <span>Start Grammar Lab</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
          </div>

          
        </div>
      )}

      {/* Screen 2: Concept Explanation */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>SOV & "Verb at the End"</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of 6</span>
          </div>

          {/* Skeleton Diagram */}
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Korean Sentence Skeleton:</span>
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 flex gap-2 justify-center text-center font-mono text-xs">
              <div className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg font-bold">Subject</div>
              <div className="text-zinc-500 flex items-center">+</div>
              <div className="px-3 py-1.5 bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-lg font-bold">Object</div>
              <div className="text-zinc-500 flex items-center">+</div>
              <div className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg font-bold">Verb (End)</div>
            </div>
            <p className="text-[11px] text-zinc-400 text-left leading-relaxed">
              {coreData?.skeleton?.explanation}
            </p>
          </div>

          {/* Comparison Cards */}
          <div className="space-y-2 text-left">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">English (SVO) vs Korean (SOV):</span>
            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
              {coreData?.comparison_examples?.map((ex: any) => (
                <div key={ex.id} className="p-3 bg-zinc-900 border border-white/5 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">English: <strong className="text-zinc-300">{ex.english}</strong></span>
                    <span className="text-[9px] font-mono text-zinc-500">{ex.english_structure}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Korean: <strong className="text-indigo-400 font-korean">{ex.korean}</strong></span>
                    <span className="text-[9px] font-mono text-indigo-400">{ex.korean_structure}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[9px] text-zinc-500 pt-1.5 border-t border-white/[0.04]">
                    <span>S: <strong className="text-zinc-300">{ex.sov_tags.S}</strong></span>
                    <span>O: <strong className="text-zinc-300">{ex.sov_tags.O}</strong></span>
                    <span>V: <strong className="text-zinc-300">{ex.sov_tags.V}</strong></span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 italic mt-1">"Meaning is similar, but word order and particles differ."</p>
          </div>

          {/* Basic Sentence Types */}
          <div className="space-y-2 text-left text-xs bg-zinc-900/40 p-4 rounded-xl border border-white/5">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Sentence Types In This Lab:</span>
            <div className="space-y-2">
              {coreData?.sentence_types?.map((type: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-0.5">
                  <span className="font-bold text-indigo-300">{type.type}:</span>
                  <p className="text-zinc-400 text-[10px]">{type.explanation}</p>
                  <p className="text-zinc-300 font-korean text-[10px] italic">Example: {type.example}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mindset */}
          <p className="text-xs text-zinc-500 border-t border-white/5 pt-2 text-center">
            💡 {coreData?.mindset}
          </p>

          <div className="flex justify-between items-center pt-2">
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Building <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Build & Repair */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Activity 1 - Build & Repair</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of 6</span>
          </div>

          {/* 1A: Build Sentence */}
          {buildItems.length > 0 && (
            <div className="space-y-4 bg-zinc-900/30 p-5 rounded-2xl border border-white/5">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-black block">Part A: Drag chunks to match English</span>
              
              <div className="text-center py-2">
                <span className="text-[10px] text-zinc-500 uppercase block font-mono">English Prompt</span>
                <p className="font-extrabold text-white text-md">"{buildItems[buildIdx]?.englishPrompt}"</p>
              </div>

              {/* Workspace sentence bar */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 min-h-[50px] flex items-center justify-center gap-2 flex-wrap">
                {buildWorkspace.length === 0 ? (
                  <span className="text-zinc-600 text-xs italic">Tap tiles below in correct SOV order...</span>
                ) : (
                  buildWorkspace.map((chunk) => (
                    <span 
                      key={chunk.id}
                      onClick={() => handleChunkClick(chunk)}
                      className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold cursor-pointer transition select-none"
                    >
                      {chunk.text}
                    </span>
                  ))
                )}
              </div>

              {/* Draggable (clickable) tiles */}
              <div className="flex justify-center gap-2.5 flex-wrap">
                {buildItems[buildIdx]?.chunks.filter((c: any) => !buildWorkspace.some((w: any) => w.id === c.id)).map((chunk: any) => (
                  <button
                    key={chunk.id}
                    onClick={() => handleChunkClick(chunk)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/5 rounded-xl text-xs font-bold transition select-none"
                  >
                    {chunk.text}
                    <span className="text-[8px] text-zinc-500 font-mono block font-normal">{chunk.type}</span>
                  </button>
                ))}
              </div>

              {buildChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                  buildCorrect ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-pink-500/5 border-pink-500/20 text-pink-400"
                }`}>
                  <p className="font-extrabold">{buildCorrect ? "Correct!" : "Order Mismatch!"}</p>
                  <p>{buildExplanation}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setBuildWorkspace([])}
                  className="text-zinc-500 hover:text-zinc-300 text-xs flex items-center gap-1 cursor-pointer"
                  disabled={buildChecked}
                >
                  <Undo className="w-3.5 h-3.5" /> Clear order
                </button>
                {!buildChecked ? (
                  <button
                    onClick={handleCheckBuild}
                    disabled={buildWorkspace.length === 0}
                    className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Order
                  </button>
                ) : (
                  <button
                    onClick={handleNextBuild}
                    className="bg-emerald-500 text-zinc-950 hover:bg-emerald-500/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next Prompt
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 1B: Repair broken sentence */}
          {repairItems.length > 0 && (
            <div className="space-y-4 bg-zinc-900/30 p-5 rounded-2xl border border-white/5 pt-4">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-black block">Part B: Repair the scrambled sentence</span>
              
              <div className="text-center py-2">
                <span className="text-[10px] text-zinc-500 uppercase block font-mono">English meaning</span>
                <p className="font-extrabold text-white text-md">"{repairItems[repairIdx]?.englishPrompt}"</p>
                <div className="flex justify-center gap-1.5 mt-2 flex-wrap">
                  {repairItems[repairIdx]?.scrambledChunks.map((c: any) => (
                    <span key={c.id} className="px-2 py-0.5 bg-zinc-950 text-zinc-500 border border-white/5 rounded text-[10px] font-mono">
                      {c.text}
                    </span>
                  ))}
                  <span className="text-[9px] text-zinc-500 italic block w-full mt-1">(Scrambled order above)</span>
                </div>
              </div>

              {/* Workspace */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 min-h-[50px] flex items-center justify-center gap-2 flex-wrap">
                {repairWorkspace.length === 0 ? (
                  <span className="text-zinc-600 text-xs italic">Build correct sentence structure below...</span>
                ) : (
                  repairWorkspace.map((chunk) => (
                    <span 
                      key={chunk.id}
                      onClick={() => handleRepairChunkClick(chunk)}
                      className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold cursor-pointer transition select-none"
                    >
                      {chunk.text}
                    </span>
                  ))
                )}
              </div>

              {/* Chunks selection */}
              <div className="flex justify-center gap-2 flex-wrap">
                {repairItems[repairIdx]?.scrambledChunks.filter((c: any) => !repairWorkspace.some((w: any) => w.id === c.id)).map((chunk: any) => (
                  <button
                    key={chunk.id}
                    onClick={() => handleRepairChunkClick(chunk)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/5 rounded-xl text-xs font-bold transition select-none"
                  >
                    {chunk.text}
                  </button>
                ))}
              </div>

              {repairChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                  repairCorrect ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-pink-500/5 border-pink-500/20 text-pink-400"
                }`}>
                  <p className="font-extrabold">{repairCorrect ? "Before vs After Corrected!" : "Wrong word order!"}</p>
                  <p>{repairExplanation}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setRepairWorkspace([])}
                  className="text-zinc-500 hover:text-zinc-300 text-xs flex items-center gap-1 cursor-pointer"
                  disabled={repairChecked}
                >
                  <Undo className="w-3.5 h-3.5" /> Reset chunks
                </button>
                {!repairChecked ? (
                  <button
                    onClick={handleCheckRepair}
                    disabled={repairWorkspace.length === 0}
                    className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Repair Order
                  </button>
                ) : (
                  <button
                    onClick={handleNextRepair}
                    className="bg-emerald-500 text-zinc-950 hover:bg-emerald-500/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next Prompt
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => {
    if (courseXP < 0) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 1, you need at least 0 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Production <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 2: Typing & Transformations */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Activity 2 - Typing & Forms</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of 6</span>
          </div>

          {/* 2A: Phrase to Sentence */}
          {ptsItems.length > 0 && (
            <div className="space-y-4 bg-zinc-900/30 p-5 rounded-2xl border border-white/5">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-black block">Part A: Form full Korean sentence from bits</span>
              
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-zinc-400 mb-2">
                <div className="bg-zinc-950 p-2 rounded-lg border border-white/5">
                  <span className="text-zinc-600 block mb-0.5">Subject</span>
                  <strong>{ptsItems[ptsIdx]?.subject}</strong>
                </div>
                <div className="bg-zinc-950 p-2 rounded-lg border border-white/5">
                  <span className="text-zinc-600 block mb-0.5">Object</span>
                  <strong>{ptsItems[ptsIdx]?.object}</strong>
                </div>
                <div className="bg-zinc-950 p-2 rounded-lg border border-white/5">
                  <span className="text-zinc-600 block mb-0.5">Verb Stem</span>
                  <strong>{ptsItems[ptsIdx]?.verb}</strong>
                </div>
              </div>
              <p className="text-[10px] text-indigo-300 italic mb-2">💡 Hint: {ptsItems[ptsIdx]?.hint}</p>

              <input 
                type="text"
                placeholder="Type the full Korean sentence..."
                value={ptsInput}
                onChange={(e) => setPtsInput(e.target.value)}
                disabled={ptsChecked}
                className="w-full bg-zinc-950 p-3 rounded-xl border border-white/10 outline-none focus:border-indigo-500 font-sans text-sm text-white"
              />

              {ptsChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                  ptsCorrect ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-pink-500/5 border-pink-500/20 text-pink-400"
                }`}>
                  <p className="font-extrabold">{ptsCorrect ? "✓ Correct!" : "✗ Conjugation/Order mismatch"}</p>
                  <p>{ptsExplanation}</p>
                  {!ptsCorrect && <p>Correct sentence: <strong className="text-white font-korean">{ptsModel}</strong></p>}
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!ptsChecked ? (
                  <button
                    onClick={handleCheckPts}
                    disabled={!ptsInput.trim()}
                    className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Submit Sentence
                  </button>
                ) : (
                  <button
                    onClick={handleNextPts}
                    className="bg-emerald-500 text-zinc-950 hover:bg-emerald-500/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next Prompt
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2B: Transformations */}
          {transformItems.length > 0 && (
            <div className="space-y-4 bg-zinc-900/30 p-5 rounded-2xl border border-white/5 pt-4">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-black block">Part B: Sentence transformations</span>
              
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-center">
                <span className="text-[10px] text-zinc-500 block mb-0.5">Base Statement:</span>
                <p className="font-extrabold text-white">{transformItems[transformIdx]?.statement}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setTransformMode("question"); setTransformChecked(false); setTransformInput(""); }}
                  className={`flex-grow p-2.5 rounded-xl border text-xs font-bold transition ${
                    transformMode === "question"
                      ? "border-indigo-500 bg-indigo-500/10 text-white"
                      : "border-white/5 bg-zinc-950 text-zinc-400"
                  }`}
                >
                  Make a Question
                </button>
                <button
                  onClick={() => { setTransformMode("negation"); setTransformChecked(false); setTransformInput(""); }}
                  className={`flex-grow p-2.5 rounded-xl border text-xs font-bold transition ${
                    transformMode === "negation"
                      ? "border-indigo-500 bg-indigo-500/10 text-white"
                      : "border-white/5 bg-zinc-950 text-zinc-400"
                  }`}
                >
                  Make a Negation
                </button>
              </div>

              <div className="text-xs text-zinc-400 italic">
                {transformMode === "question" ? transformItems[transformIdx]?.questionPrompt : transformItems[transformIdx]?.negationPrompt}
              </div>

              <input 
                type="text"
                placeholder="Type transformed sentence..."
                value={transformInput}
                onChange={(e) => setTransformInput(e.target.value)}
                disabled={transformChecked}
                className="w-full bg-zinc-950 p-3 rounded-xl border border-white/10 outline-none focus:border-indigo-500 font-sans text-sm text-white"
              />

              {transformChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                  transformCorrect ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-pink-500/5 border-pink-500/20 text-pink-400"
                }`}>
                  <p className="font-extrabold">{transformCorrect ? "✓ Form matches correctly!" : "✗ Transformation mismatch"}</p>
                  <p>{transformExplanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!transformChecked ? (
                  <button
                    onClick={handleCheckTransform}
                    disabled={!transformInput.trim()}
                    className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Submit Transform
                  </button>
                ) : (
                  <button
                    onClick={handleNextTransform}
                    className="bg-emerald-500 text-zinc-950 hover:bg-emerald-500/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next Prompt
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2C: Quick spoken drill */}
          <div className="space-y-4 bg-zinc-900/30 p-5 rounded-2xl border border-white/5 pt-4 flex flex-col items-center">
            <span className="text-[10px] text-amber-400 uppercase tracking-wider font-black block w-full text-left">Part C: Quick oral check (optional)</span>
            <p className="text-[11px] text-zinc-400 text-center">Tap mic and read the model sentence aloud: <strong className="text-white">{ptsItems[ptsIdx]?.correctKoreanPatterns[0] || "저는 사과를 먹어요."}</strong></p>
            
            <button
              onClick={handleSpeechCheck}
              disabled={speakingChecking}
              className={`p-3 rounded-full border transition flex items-center justify-center gap-1.5 font-bold text-xs ${
                speakingChecking 
                  ? "border-red-500 bg-red-500/10 text-white animate-pulse" 
                  : "border-indigo-500 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
              } cursor-pointer`}
            >
              <Mic className="w-4 h-4" />
              <span>{speakingChecking ? "Checking Audio..." : "Read Aloud"}</span>
            </button>

            {speakingFeedback && (
              <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl text-[10px] text-center w-full text-zinc-300">
                📢 {speakingFeedback}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Mini‑Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Mini-Quiz */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <span>Checkpoint Mini-Quiz</span>
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${((quizIdx + 1) / quizBlueprint.length) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 font-bold">Q {quizIdx + 1}/{quizBlueprint.length}</span>
            </div>
          </div>

          {quizBlueprint[quizIdx] && (
            <div className="space-y-4 text-left">
              <span className="text-[9px] text-zinc-500 uppercase font-mono block">Category: {quizBlueprint[quizIdx].type}</span>
              <h3 className="text-sm font-bold text-white leading-relaxed">{quizBlueprint[quizIdx].question}</h3>

              <div className="space-y-2">
                {quizBlueprint[quizIdx].options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !quizChecked && setQuizSelected(opt)}
                    disabled={quizChecked}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition ${
                      quizSelected === opt
                        ? "border-indigo-500 bg-indigo-500/10 text-white font-black"
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    } ${quizChecked && quizBlueprint[quizIdx].correct_answer === opt ? "border-emerald-500 bg-emerald-500/10 text-white" : ""}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {quizChecked && (
                <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                  quizCorrect ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-pink-500/20 bg-pink-500/5 text-pink-400"
                }`}>
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
                  <p className="font-bold">{quizCorrect ? "✓ Correct! Brilliant." : "✗ Incorrect."}</p>
                  <p className="text-zinc-400 font-sans mt-0.5">{quizExplanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={!quizSelected}
                    className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-emerald-500 text-zinc-950 hover:bg-emerald-500/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {finishingQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 6: Homework & Completion */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in relative overflow-hidden">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/25 w-fit mx-auto text-emerald-400 shrink-0">
            <Award className="w-10 h-10 animate-bounce" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">Grammar Lab 1 Complete!</h2>
            <p className="text-xs text-zinc-400 mt-1">You've mastered Korean SOV word order and basic sentence forms.</p>
          </div>

          {quizScore !== null && (
            <div className="bg-zinc-900/60 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full flex items-center justify-between text-left">
              <div>
                <span className="text-[9px] text-zinc-500 uppercase font-mono block">Performance metrics:</span>
                <span className="text-sm font-black text-white">{quizScore}% quiz accuracy</span>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-black">A1 Mastered</span>
            </div>
          )}

          {/* Homework checklist */}
          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 text-left text-xs max-w-md mx-auto w-full space-y-3">
            <span className="text-[9px] text-zinc-500 uppercase font-mono block">Homework Tasks & Parallel Practice:</span>
            {homeworkItems.map((hw: any, idx: number) => (
              <div key={idx} className="flex gap-2.5 items-start">
                <div className="mt-0.5 p-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Check className="w-3 h-3" />
                </div>
                <p className="text-zinc-300 leading-snug">{hw.text}</p>
              </div>
            ))}

            {/* AI assisted check */}
            <div className="pt-2 border-t border-white/[0.04] space-y-2">
              <span className="text-[9px] text-indigo-400 uppercase font-mono block">Run AI Grammar Check on your sentences:</span>
              <div className="space-y-1.5">
                {hwSents.map((val, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`Sentence ${idx + 1} (Korean)`}
                    value={val}
                    onChange={(e) => {
                      const copy = [...hwSents];
                      copy[idx] = e.target.value;
                      setHwSents(copy);
                    }}
                    className="w-full bg-zinc-950 border border-white/5 p-2 rounded-lg text-xs text-white outline-none focus:border-indigo-500"
                  />
                ))}
              </div>
              <button
                onClick={handleHwSubmit}
                disabled={submittingHw || hwSents.every(s => !s.trim())}
                className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submittingHw && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Check My A1 Sentences</span>
              </button>

              {hwFeedback.length > 0 && (
                <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {hwFeedback.map((f, i) => (
                    <div key={i} className="text-[10px] space-y-0.5 border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                      <p className="text-zinc-500 font-mono">Input: "{f.original}"</p>
                      <p className={f.is_correct ? "text-emerald-400" : "text-pink-400"}>
                        {f.is_correct ? "✓ Correct Structure" : `Suggested: "${f.corrected}"`}
                      </p>
                      <p className="text-zinc-400 italic">"{f.why}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {completionData ? (
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl max-w-sm mx-auto w-full text-xs text-emerald-400 animate-fade-in space-y-1">
              <p className="font-extrabold">🏆 Badge Earned: {completionData.badge}</p>
              <p className="text-zinc-400">Estimated SOV Accuracy: {completionData.sov_accuracy_est}</p>
              <p className="text-zinc-500 pt-1">Recommended Next Labs: {completionData.next_recommended.join(", ")}</p>
            </div>
          ) : (
            <button
              onClick={handleCompleteLab}
              disabled={completingLab}
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-500/90 font-black py-4 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 max-w-xs mx-auto w-full"
            >
              {completingLab && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Complete Grammar Lab & Earn XP</span>
            </button>
          )}
        </div>
      )}

      {/* Footer Controls */}
      <footer className="flex justify-between items-center py-4 border-t border-white/5 mt-6">
        {step > 1 && step < 6 ? (
          <button 
            onClick={() => setStep(step - 1)}
            className="glass-panel py-3 px-6 rounded-xl hover:bg-white/5 transition text-sm font-semibold flex items-center gap-2 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Slide {step - 1}
          </button>
        ) : (
          <div />
        )}

        {step < 5 ? (
          <button 
            onClick={() => setStep(step + 1)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-6 rounded-xl transition text-sm font-semibold flex items-center gap-2 cursor-pointer"
          >
            Go to Slide {step + 1} <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div />
        )}
      </footer>
    
  
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
