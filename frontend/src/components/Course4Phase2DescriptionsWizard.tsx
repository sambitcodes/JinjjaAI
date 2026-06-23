"use client";

import { useEffect, useState, useRef } from "react";
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
  ArrowRight,
  Info,
  Save,
  MessageSquare
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

interface Course4Phase2DescriptionsWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course4Phase2DescriptionsWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course4Phase2DescriptionsWizardProps) {
  const getStepMaxXP = (sNum: number) => {
    if (sNum === 1) return 0;
    if (sNum === 8) return 200;
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
    const savedStep = localStorage.getItem("hangeulai_c4p2_step");
    const savedMax = localStorage.getItem("hangeulai_c4p2_max_step");
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
      localStorage.setItem("hangeulai_c4p2_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 8;

  // Persist progress to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c4p2_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 8) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c4p2_step", String(step));
  }, [step]);

  // DB Data loaded
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

  // Activity 2 states (Custom Builders)
  const [activeBuilderTab, setActiveBuilderTab] = useState<"person" | "place">("person");
  
  // Custom Person Builder Choices
  const [selectedAppearance, setSelectedAppearance] = useState<string[]>([]);
  const [selectedPersonality, setSelectedPersonality] = useState<string[]>([]);
  const [customHobby, setCustomHobby] = useState("공부하기");
  
  // Custom Place Builder Choices
  const [selectedSize, setSelectedSize] = useState("크다");
  const [selectedAtmosphere, setSelectedAtmosphere] = useState("조용하다");
  const [customLocation, setCustomLocation] = useState("서울");

  // Output
  const [builtKo, setBuiltKo] = useState("");
  const [builtEn, setBuiltEn] = useState("");
  const [building, setBuilding] = useState(false);
  const [savedSentences, setSavedSentences] = useState<any[]>([]);

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

  // Tutor sessions
  const [loadingTutor, setLoadingTutor] = useState(false);
  const [tutorSession, setTutorSession] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!metadata) {
          const res = await apiJson("/lessons/phases/korean3/2/metadata");
          setMetadata(res);
        }
        if (step >= 2 && !coreData) {
          const res = await apiJson("/lessons/phases/korean3/2/core-data");
          setCoreData(res);
        }
        if (step >= 5 && understandingItems.length === 0) {
          const res = await apiJson("/lessons/practice/descriptions/listening-reading");
          setUnderstandingItems(res.items || []);
        }
        if (step >= 7 && quizBlueprint.length === 0) {
          const res = await apiJson("/lessons/quiz/korean3/phase-2/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        }
        if (step >= 8 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean3/2/homework");
          setHomeworkItems(res_hw || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  const toggleAppearance = (adjKo: string) => {
    if (selectedAppearance.includes(adjKo)) {
      setSelectedAppearance(selectedAppearance.filter(a => a !== adjKo));
    } else {
      setSelectedAppearance([...selectedAppearance, adjKo]);
    }
  };

  const togglePersonality = (adjKo: string) => {
    if (selectedPersonality.includes(adjKo)) {
      setSelectedPersonality(selectedPersonality.filter(p => p !== adjKo));
    } else {
      setSelectedPersonality([...selectedPersonality, adjKo]);
    }
  };

  // Concept Checks
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

  // Activity 1 Check (understandingItems)
  const handleCheckUnd = () => {
    const current = understandingItems[undIdx];
    if (!current) return;
    const activeQ = current.questions[qIdx];
    if (!activeQ || !selectedOpt) return;

    const isCorrect = selectedOpt === activeQ.correct_answer;
    setUndChecked(true);
    setUndCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
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

  // Activity 2: Build Person
  const handleBuildPerson = async () => {
    setBuilding(true);
    setSpeakingChecked(false);
    setSpeakingFeedback("");
    setSpeakingScore(null);
    try {
      const res = await apiJson("/lessons/practice/descriptions/build-person", {
        method: "POST",
        body: JSON.stringify({
          appearance_adjs: selectedAppearance,
          personality_adjs: selectedPersonality,
          hobby: customHobby
        })
      });
      setBuiltKo(res.sentence_ko);
      setBuiltEn(res.sentence_en);
    } catch (err) {
      console.error(err);
    } finally {
      setBuilding(false);
    }
  };

  // Activity 2: Build Place
  const handleBuildPlace = async () => {
    setBuilding(true);
    setSpeakingChecked(false);
    setSpeakingFeedback("");
    setSpeakingScore(null);
    try {
      const res = await apiJson("/lessons/practice/descriptions/build-place", {
        method: "POST",
        body: JSON.stringify({
          size_adj: selectedSize,
          atmosphere_adj: selectedAtmosphere,
          location: customLocation
        })
      });
      setBuiltKo(res.sentence_ko);
      setBuiltEn(res.sentence_en);
    } catch (err) {
      console.error(err);
    } finally {
      setBuilding(false);
    }
  };

  const handleSaveDescription = async (type: "person" | "place") => {
    if (!builtKo) return;
    try {
      await apiJson(`/lessons/users/descriptions/${type}/save`, {
        method: "POST",
        body: JSON.stringify({ title: `Custom ${type}`, content_ko: builtKo, content_en: builtEn })
      });
      setSavedSentences(prev => [...prev, { type, ko: builtKo, en: builtEn }]);
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("Description saved successfully!") } }));
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
      const res = await apiJson("/lessons/practice/descriptions/speaking", {
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
  const handleCheckQuiz = () => {
    const current = quizBlueprint[quizIdx];
    if (!current) return;

    const isCorrect = quizSelectedOpt === current.correct_answer;
    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
    if (!isCorrect) {
      setQuizMistakes(prev => [...prev, current.id]);
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
        await apiJson("/lessons/quiz/korean3/phase-2/finish", {
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

  // Homework check logging
  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/lessons/phases/korean3/2/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // AI Practice scenario launcher
  const handleLaunchB1DescriptionPractice = async (type: "person" | "place") => {
    setLoadingTutor(true);
    setTutorSession(null);
    try {
      const res = await apiJson("/lessons/conversation/b1/descriptions-practice/start", {
        method: "POST",
        body: JSON.stringify({ type })
      });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

  const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "Concept 1 – B1 Description Goal" },
    { num: 3, label: "Concept 2 – Example Description" },
    { num: 4, label: "Concept 3 – Description Dimensions" },
    { num: 5, label: "Activity A – Understanding Checks" },
    { num: 6, label: "Activity B – Builder & Speaking" },
    { num: 7, label: "Quiz – Description Strategies" },
    { num: 8, label: "Tutor Chat Capstone Practice" }
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 4,
          phaseNum: 2,
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
              <span>{activeLesson?.title || "Describing People & Places (B1 Core)"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Level B1 - Phase 2</p>
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
                const isCompleted = s.num < step || s.num <= maxStep;
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
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="p-3 bg-indigo-500/10 rounded-full border border-indigo-500/25 w-fit mx-auto text-indigo-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight">Descriptions – “People, Places, and Things”</h2>
          <h3 className="text-2xl font-extrabold text-indigo-400 mt-2">Level B1 - Phase 2</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Talk about people, places, and things in more detail."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Learning Goals:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Describe people combining appearance, personality, and habits",
                "Describe places and things with multiple details (looks, atmosphere, uses)",
                "Understand descriptive paragraphs and answer detailed questions on them",
                "Build custom descriptions and test them with live speech recognition"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 30} minutes</p>
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => {
    if (courseXP < 80) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 2, you need at least 80 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <span>Start Phase 2</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Screen 2: Concept C1 – B1 description goal */}
      {step === 2 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen C1 – B1 Description Goal</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="space-y-4 text-left max-w-2xl mx-auto text-sm text-zinc-300">
            <p className="text-lg text-zinc-200 italic font-medium leading-relaxed border-l-4 border-indigo-500 pl-4 py-1 bg-indigo-500/5 rounded-r-xl">
              "At B1, you should be able to describe people, places, and things in some detail, not just with one or two words. You’ll learn how to build longer descriptions step by step."
            </p>
            <p>
              Rather than using single adjective statements, B1 descriptions synthesize layers:
              <br />
              - <strong>For People</strong>: Combine appearance + personality + habits.
              <br />
              - <strong>For Places</strong>: Mention atmosphere + location + activities.
            </p>
          </div>

          {/* Micro MCQ Check */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 max-w-xl mx-auto w-full space-y-4 text-left">
            <p className="text-xs text-indigo-400 font-black uppercase tracking-wider font-mono">💡 Micro-Question Check:</p>
            <p className="text-sm font-bold text-white">Which sounds more B1-like?</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: "A", text: "A) “제 친구는 착해요.” (My friend is nice.)" },
                { id: "B", text: "B) “제 친구는 키가 크고 활발해요. 항상 친절해서 친구가 많아요.” (My friend is tall and active. Because they are always kind, they have many friends.)" }
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
                <p>Option B combines appearance (키가 크고), personality (활발해요, 친절해서), and an extra social consequence (친구가 많아요), representing a detailed B1 description.</p>
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
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Continue <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Concept C2 – Example person description */}
      {step === 3 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen C2 – Example Person Description</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 max-w-xl mx-auto w-full text-left space-y-3 text-xs">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Model Paragraph:</span>
            <p className="font-korean text-base leading-relaxed text-white font-extrabold">
              제 친구 민우는 <span className="text-indigo-400 underline">키가 크고</span>(appearance) <span className="text-indigo-400 underline">활발해요</span>(personality). 항상 <span className="text-indigo-400 underline">친절해서</span>(personality) 친구들이 아주 많아요. 보통 주말에 <span className="text-indigo-400 underline">축구하는 것을 좋아해요</span>(habit).
            </p>
            <p className="text-zinc-400">
              "My friend Minu is tall and active. Because he is always kind, he has many friends. On weekends, he usually likes to play soccer."
            </p>
          </div>

          {/* Micro MCQ Check */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 max-w-xl mx-auto w-full space-y-4 text-left">
            <p className="text-xs text-indigo-400 font-black uppercase tracking-wider font-mono">💡 Micro-Question Check:</p>
            <p className="text-sm font-bold text-white">From this description, what can you say about Minu’s weekends?</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: "A", text: "He likes to read books all day." },
                { id: "B", text: "He usually likes to play soccer." }
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
                <p>The sentence explicitly lists Minu's weekend habit: "보통 주말에 축구하는 것을 좋아해요" (usually likes to play soccer on weekends).</p>
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
            <button onClick={() => {
    if (courseXP < 80) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 2, you need at least 80 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Continue <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Concept C3 – Dimensions of description */}
      {step === 4 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen C3 – Dimensions of Description</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          <div className="space-y-4 text-left max-w-2xl mx-auto text-xs text-zinc-300">
            <p className="text-sm">To construct premium B1 descriptions, remember the target dimensions:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl space-y-2">
                <span className="text-indigo-400 font-extrabold text-sm block">🧑 For People:</span>
                <p>• <strong>Who they are</strong>: Friend, family, coworker</p>
                <p>• <strong>Appearance</strong>: 키가 크다 (tall), 머리가 길다 (long hair)</p>
                <p>• <strong>Personality</strong>: 친절하다 (kind), 활발하다 (outgoing)</p>
                <p>• <strong>Habit/Activity</strong>: What they often do on weekends or free time</p>
              </div>
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl space-y-2">
                <span className="text-indigo-400 font-extrabold text-sm block">🏢 For Places:</span>
                <p>• <strong>Where it is</strong>: Subway near, downtown, school</p>
                <p>• <strong>Looks/Atmosphere</strong>: 조용하다 (quiet), 예쁘다 (pretty)</p>
                <p>• <strong>Activities</strong>: What you usually do there</p>
                <p>• <strong>Feeling</strong>: Why you like it</p>
              </div>
            </div>
          </div>

          {/* Micro MCQ Check */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 max-w-xl mx-auto w-full space-y-4 text-left">
            <p className="text-xs text-indigo-400 font-black uppercase tracking-wider font-mono">💡 Micro-Question Check:</p>
            <p className="text-sm font-bold text-white">If you describe a cafe, which details help more?</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: "A", text: "A) just “좋아요” (it is good)" },
                { id: "B", text: "B) location, atmosphere, and what you usually do there" }
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
                <p>Listing specific attributes like location, look, and your activities gives the listener a clear, comprehensive mental picture.</p>
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
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Activity A – Description understanding checks */}
      {step === 5 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity A – Reading & Listening Comprehension</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 5 of {totalSteps}</span>
          </div>

          {understandingItems.length > 0 && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
              {/* Descriptive text paragraph */}
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl text-center space-y-2">
                <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider block font-mono">Descriptive Paragraph</span>
                <p className="font-korean text-sm leading-relaxed text-white font-extrabold">{understandingItems[undIdx]?.text}</p>
                <div className="flex justify-center pt-1">
                  <button onClick={() => playAudio(understandingItems[undIdx]?.text)} className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                    <Volume2 className="w-4 h-4" />
                    <span>Listen</span>
                  </button>
                </div>
              </div>

              {/* MCQ question check */}
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
                  <p className="font-extrabold text-white mb-1">{undCorrect ? "✓ Correct Choice!" : "✗ Incorrect Choice."}</p>
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
            <button onClick={() => setStep(4)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(6)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Continue to Activity B <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 6: Activity B – Description builder & speaking */}
      {step === 6 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity B – Guided Builder & Speaking Practice</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-950 p-1 rounded-xl border border-white/5 flex">
            <button
              onClick={() => {
                setActiveBuilderTab("person");
                setBuiltKo("");
                setBuiltEn("");
              }}
              className={`w-full py-2 text-center text-xs font-bold rounded-lg transition ${
                activeBuilderTab === "person" 
                  ? "bg-indigo-600 text-white shadow" 
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              Describe a Person
            </button>
            <button
              onClick={() => {
                setActiveBuilderTab("place");
                setBuiltKo("");
                setBuiltEn("");
              }}
              className={`w-full py-2 text-center text-xs font-bold rounded-lg transition ${
                activeBuilderTab === "place" 
                  ? "bg-indigo-600 text-white shadow" 
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              Describe a Place
            </button>
          </div>

          {/* Person Builder options */}
          {activeBuilderTab === "person" && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
              <div>
                <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Pick Appearance Adjectives (Select up to 2)</label>
                <div className="flex flex-wrap gap-1.5">
                  {coreData?.adjectives?.filter((a: any) => a.tag === "appearance")?.map((a: any) => (
                    <button
                      key={a.ko}
                      onClick={() => toggleAppearance(a.ko)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                        selectedAppearance.includes(a.ko) 
                          ? "border-indigo-500 bg-indigo-500/10 text-white" 
                          : "border-white/5 bg-zinc-950 text-zinc-400"
                      }`}
                    >
                      {a.ko} ({a.en})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Pick Personality Adjectives (Select up to 2)</label>
                <div className="flex flex-wrap gap-1.5">
                  {coreData?.adjectives?.filter((a: any) => a.tag === "personality")?.map((a: any) => (
                    <button
                      key={a.ko}
                      onClick={() => togglePersonality(a.ko)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                        selectedPersonality.includes(a.ko) 
                          ? "border-indigo-500 bg-indigo-500/10 text-white" 
                          : "border-white/5 bg-zinc-950 text-zinc-400"
                      }`}
                    >
                      {a.ko} ({a.en})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Favorite activity/hobby (Noun/Verb stem)</label>
                <input
                  type="text"
                  value={customHobby}
                  onChange={(e) => setCustomHobby(e.target.value)}
                  placeholder="e.g. 독서 (reading) / 운동 (exercise)"
                  className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white"
                />
              </div>

              <button
                onClick={handleBuildPerson}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center"
              >
                Generate Person Description
              </button>
            </div>
          )}

          {/* Place Builder options */}
          {activeBuilderTab === "place" && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Size Modifier</label>
                  <select 
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white"
                  >
                    <option value="크다">크다 (big)</option>
                    <option value="작다">작다 (small)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Atmosphere Modifier</label>
                  <select 
                    value={selectedAtmosphere}
                    onChange={(e) => setSelectedAtmosphere(e.target.value)}
                    className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white"
                  >
                    <option value="조용하다">조용하다 (quiet)</option>
                    <option value="시끄럽다">시끄럽다 (noisy)</option>
                    <option value="아름답다">아름답다 (beautiful)</option>
                    <option value="편안하다">편안하다 (comfortable)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Location / Vicinity Detail</label>
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="e.g. 지하철역 근처 (near subway station) / 도시 중심 (city center)"
                  className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white"
                />
              </div>

              <button
                onClick={handleBuildPlace}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center"
              >
                Generate Place Description
              </button>
            </div>
          )}

          {/* Built paragraph + speaking verification */}
          {builtKo && (
            <div className="p-4 bg-zinc-950 rounded-xl border border-indigo-500/20 text-center space-y-3 animate-fade-in">
              <div>
                <span className="text-[9px] text-indigo-400 uppercase tracking-wider block font-black mb-1">Generated B1 Description Paragraph:</span>
                <p className="font-korean text-lg text-white font-extrabold leading-relaxed">{builtKo}</p>
                <p className="text-xs text-zinc-400 mt-1">{builtEn}</p>
              </div>

              <div className="flex justify-center gap-2 pt-2">
                <button onClick={() => playAudio(builtKo)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <Volume2 className="w-4 h-4" />
                  <span>Listen</span>
                </button>
                <button onClick={() => handleSaveDescription(activeBuilderTab)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <Save className="w-4 h-4" />
                  <span>Save Description</span>
                </button>
              </div>

              {/* Pronunciation evaluation */}
              <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-white/5 space-y-2 mt-2">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-black text-left">Activity B2: Pronunciation Feedback Practice</span>
                <div className="flex justify-between items-center gap-3">
                  <button
                    onClick={handleStartRecording}
                    disabled={recording}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      recording ? "bg-red-500 text-white animate-pulse" : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>{recording ? "Recording..." : "Hold to Record"}</span>
                  </button>
                  
                  {speakingChecked && (
                    <div className="text-right space-y-0.5 text-xs">
                      <p className="font-bold text-white">Accuracy: {speakingScore}%</p>
                      <p className="text-[10px] text-zinc-400 font-medium">{speakingFeedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(5)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(7)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Continue to Mini-Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 7: Quiz – Description strategies & comprehension */}
      {step === 7 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-400" />
              <span>Mini-Quiz: Description Check</span>
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
                  <p className="font-extrabold text-white mb-1">{quizCorrect ? "✓ Answer Correct!" : "✗ Incorrect Answer."}</p>
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

          {/* Badge indicator when finished */}
          {quizChecked && quizIdx === quizBlueprint.length - 1 && quizCorrect && (
            <div className="mt-4 p-4 bg-zinc-900 border border-emerald-500/20 rounded-2xl max-w-sm mx-auto text-center space-y-1.5 animate-bounce">
              <Award className="w-8 h-8 text-yellow-500 mx-auto" />
              <p className="font-bold text-white text-sm">Badge Earned: Descriptor B1</p>
              <p className="text-[10px] text-zinc-400">150 XP rewarded for successfully demonstrating description strategy!</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
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

          <h2 className="text-5xl font-black text-white tracking-tight">Course 4 Phase 2 Started!</h2>
          <p className="text-xs text-zinc-400 font-mono">Badge Earned: Descriptor B1 (150 XP rewarded)</p>

          <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">B1 Description Homework Checklist:</span>
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
              <p className="text-[11px] text-zinc-400 leading-normal">Practice describing a friend or place in an interactive conversation session with Gwan-Sik.</p>
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleLaunchB1DescriptionPractice("person")}
                  disabled={loadingTutor}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  {loadingTutor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                  <span>Describe a Person</span>
                </button>
                <button
                  onClick={() => handleLaunchB1DescriptionPractice("place")}
                  disabled={loadingTutor}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  {loadingTutor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                  <span>Describe a Place</span>
                </button>
              </div>
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
              Finish B1 Phase 2
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
