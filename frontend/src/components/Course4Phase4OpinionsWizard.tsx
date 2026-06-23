"use client";

import { useEffect, useState } from "react";
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
  Save,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Laptop,
  MapPin,
  Briefcase,
  Smartphone,
  HelpCircle,
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

interface Course4Phase4OpinionsWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course4Phase4OpinionsWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course4Phase4OpinionsWizardProps) {
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
    const savedStep = localStorage.getItem("hangeulai_c4p4_step");
    const savedMax = localStorage.getItem("hangeulai_c4p4_max_step");
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
      localStorage.setItem("hangeulai_c4p4_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 8;

  // Persist progress to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c4p4_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 8) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c4p4_step", String(step));
  }, [step]);

  // Data loaded from Backend
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

  // Activity 1 states (Recognize Opinions & Reasons - recognitionItems)
  const [recognitionItems, setRecognitionItems] = useState<any[]>([]);
  const [recIdx, setRecIdx] = useState(0);
  const [selectedStanceOpt, setSelectedStanceOpt] = useState<string | null>(null);
  const [recChecked, setRecChecked] = useState(false);
  const [recCorrect, setRecCorrect] = useState<boolean | null>(null);

  // Activity 2 states (Opinions Builder)
  const [builderTopics, setBuilderTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("online_study");
  const [selectedStance, setSelectedStance] = useState("like");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [stanceOptions, setStanceOptions] = useState<any>({});
  const [reasonPhrases, setReasonPhrases] = useState<any>({});

  // Output
  const [builtKo, setBuiltKo] = useState("");
  const [builtEn, setBuiltEn] = useState("");
  const [building, setBuilding] = useState(false);
  const [isParagraph, setIsParagraph] = useState(false);
  const [savedOpinions, setSavedOpinions] = useState<any[]>([]);

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

  // Tutor session states
  const [loadingTutor, setLoadingTutor] = useState(false);
  const [tutorSession, setTutorSession] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!metadata) {
          const res = await apiJson("/lessons/phases/korean3/4/metadata");
          setMetadata(res);
        }
        if (step >= 2 && !coreData) {
          const res = await apiJson("/lessons/phases/korean3/4/core-data");
          setCoreData(res);
        }
        if (step >= 5 && recognitionItems.length === 0) {
          const res = await apiJson("/lessons/practice/opinions/recognition");
          setRecognitionItems(res.items || []);
        }
        if (step >= 6 && builderTopics.length === 0) {
          const res = await apiJson("/lessons/practice/opinions/templates");
          setBuilderTopics(res.topics || []);
          setStanceOptions(res.stance_options || {});
          setReasonPhrases(res.reason_phrases || {});
        }
        if (step >= 7 && quizBlueprint.length === 0) {
          const res = await apiJson("/lessons/quiz/korean3/phase-4/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        }
        if (step >= 8 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean3/4/homework");
          setHomeworkItems(res_hw || []);
        }
      } catch (err) {
        console.error("Error loading step data: ", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
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

  // Activity 1 Check
  const handleCheckRec = async (choice: string) => {
    const current = recognitionItems[recIdx];
    if (!current) return;

    let isCorrect = false;
    if (current.type === "opinion_fact") {
      const isChoiceOpinion = choice === "opinion";
      isCorrect = isChoiceOpinion === current.is_opinion;
    } else {
      isCorrect = choice === "reason";
    }

    setSelectedStanceOpt(choice);
    setRecChecked(true);
    setRecCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");

    try {
      await apiJson("/lessons/practice/opinions/recognition/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          option_id: choice,
          time_taken_ms: 1000
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextRec = () => {
    setRecChecked(false);
    setSelectedStanceOpt(null);
    setRecCorrect(null);

    if (recIdx < recognitionItems.length - 1) {
      setRecIdx(recIdx + 1);
    } else {
      setRecIdx(0);
    }
  };

  const toggleReasonPhrase = (koPhrase: string) => {
    if (selectedReasons.includes(koPhrase)) {
      setSelectedReasons(selectedReasons.filter(r => r !== koPhrase));
    } else {
      if (selectedReasons.length < 2) {
        setSelectedReasons([...selectedReasons, koPhrase]);
      } else {
        setSelectedReasons([selectedReasons[1], koPhrase]);
      }
    }
  };

  const handleBuildOpinion = async (makeParagraph: boolean) => {
    setBuilding(true);
    setSpeakingChecked(false);
    setSpeakingFeedback("");
    setSpeakingScore(null);
    setIsParagraph(makeParagraph);
    const endpoint = makeParagraph ? "/lessons/practice/opinions/build-paragraph" : "/lessons/practice/opinions/build-sentence";
    try {
      const res = await apiJson(endpoint, {
        method: "POST",
        body: JSON.stringify({
          topic: selectedTopic,
          stance: selectedStance,
          reasons: selectedReasons
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

  const handleSaveOpinion = async () => {
    if (!builtKo) return;
    try {
      await apiJson("/lessons/users/opinions/save", {
        method: "POST",
        body: JSON.stringify({ title: `My Opinion on ${selectedTopic}`, content_ko: builtKo, content_en: builtEn })
      });
      setSavedOpinions(prev => [...prev, { ko: builtKo, en: builtEn }]);
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("Opinion saved successfully!") } }));
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
      const res = await apiJson("/lessons/practice/opinions/speaking", {
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
  const handleCheckQuiz = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current) return;

    const isCorrect = quizSelectedOpt === current.correct_answer;
    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
    if (!isCorrect) {
      setQuizMistakes(prev => [...prev, current.id]);
    }

    try {
      await apiJson("/lessons/quiz/korean3/phase-4/answer", {
        method: "POST",
        body: JSON.stringify({
          question_id: current.id,
          answer: quizSelectedOpt || "",
          time_taken_ms: 1500
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
        await apiJson("/lessons/quiz/korean3/phase-4/finish", {
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

  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/lessons/phases/korean3/4/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLaunchB1OpinionsPractice = async () => {
    setLoadingTutor(true);
    setTutorSession(null);
    try {
      const res = await apiJson("/lessons/conversation/b1/opinions-practice/start", {
        method: "POST"
      });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

  const renderTopicIcon = (iconName: string) => {
    switch(iconName) {
      case "laptop": return <Laptop className="w-4 h-4 text-indigo-400" />;
      case "map-pin": return <MapPin className="w-4 h-4 text-indigo-400" />;
      case "briefcase": return <Briefcase className="w-4 h-4 text-indigo-400" />;
      case "smartphone": return <Smartphone className="w-4 h-4 text-indigo-400" />;
      default: return <HelpCircle className="w-4 h-4 text-indigo-400" />;
    }
  };

  const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "Concept 1 – B1 Opinion Goal" },
    { num: 3, label: "Concept 2 – Fact vs Opinion" },
    { num: 4, label: "Concept 3 – Opinion Reason Suffixes" },
    { num: 5, label: "Activity A – Facts & Clause Roles" },
    { num: 6, label: "Activity B – Opinion Builder" },
    { num: 7, label: "Quiz – Opinion Strategies" },
    { num: 8, label: "Tutor Live Opinion Session" }
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 4,
          phaseNum: 4,
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
              <span>{activeLesson?.title || "Opinions & Simple Arguments (B1 Core)"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Level B1 - Phase 4</p>
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
                const isCompleted = s.num < step || s.num <= maxStep;
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
          
          <h2 className="text-5xl font-black text-white tracking-tight">Opinions – “What You Think and Why”</h2>
          <h3 className="text-2xl font-extrabold text-indigo-400 mt-2">Level B1 - Phase 4</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Say what you think and give short reasons."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Learning Goals:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Recognise the difference between a fact and an opinion in simple Korean statements",
                "State simple opinions about everyday topics (school, hobbies) and append short reasons",
                "Identify logical functions of second clauses (reason, result, contrast)"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 30} minutes</p>
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => {
    if (courseXP < 240) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 4, you need at least 240 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <span>Start Phase 4</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Screen 2: Concept C1 – B1 opinion goal */}
      {step === 2 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen C1 – B1 Opinion Goal</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="space-y-4 text-left max-w-2xl mx-auto text-sm text-zinc-300">
            <p className="text-lg text-zinc-200 italic font-medium leading-relaxed border-l-4 border-indigo-500 pl-4 py-1 bg-indigo-500/5 rounded-r-xl">
              "At B1, you should be able to say what you think and briefly explain why about everyday topics."
            </p>
            <p>
              An opinion expresses a personal viewpoint, feeling, or evaluation. A fact lists verifiable objective realities.
            </p>
          </div>

          {/* Micro MCQ Check */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 max-w-xl mx-auto w-full space-y-4 text-left">
            <p className="text-xs text-indigo-400 font-black uppercase tracking-wider font-mono">💡 Micro-Question Check:</p>
            <p className="text-sm font-bold text-white">Which is closer to an opinion?</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: "A", text: "A) “학교는 8시에 시작해요.” (School starts at 8.)" },
                { id: "B", text: "B) “학교는 너무 일찍 시작해요.” (School starts too early.)" }
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
                <p>Option B contains the subjective modifier "너무 일찍" (too early), expressing a personal opinion. Option A is a verifiable scheduling fact.</p>
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

      {/* Screen 3: Concept C2 – Fact vs opinion */}
      {step === 3 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen C2 – Fact vs Opinion Definitions</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          <div className="space-y-4 text-left max-w-2xl mx-auto text-xs text-zinc-300 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl">
                <span className="text-indigo-400 font-extrabold text-sm block">📊 Fact (사실)</span>
                <p className="mt-1">Reality that can be checked objectively.</p>
                <p className="italic text-zinc-500 mt-2">Example: "이 카페는 커피를 팔아요." (This cafe sells coffee.)</p>
              </div>
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl">
                <span className="text-indigo-400 font-extrabold text-sm block">💡 Opinion (의견)</span>
                <p className="mt-1">A viewpoint showing what someone thinks or feels.</p>
                <p className="italic text-zinc-500 mt-2">Example: "이 카페 커피가 제일 맛있어요." (This cafe's coffee is the best.)</p>
              </div>
            </div>
          </div>

          {/* Micro MCQ Check */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 max-w-xl mx-auto w-full space-y-4 text-left">
            <p className="text-xs text-indigo-400 font-black uppercase tracking-wider font-mono">💡 Micro-Question Check:</p>
            <p className="text-sm font-bold text-white">Which of these is a fact?</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: "A", text: "A) “이 책은 아주 재미있어요.” (This book is very interesting.)" },
                { id: "B", text: "B) “이 책은 200페이지예요.” (This book is 200 pages.)" }
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
                <p>The page count (Option B) is a verifiable fact, whereas how interesting the book is (Option A) represents a subjective opinion.</p>
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
    if (courseXP < 240) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 4, you need at least 240 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Continue <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Concept C3 – Opinion + reason structure */}
      {step === 4 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen C3 – Opinion + Reason Structure</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          <div className="space-y-4 text-left max-w-2xl mx-auto text-sm text-zinc-300">
            <p>
              B1 opinion construction uses structural connectors to add supporting clauses:
            </p>
            <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl font-mono text-center text-white">
              [Stance Statement] + 왜냐하면 [Supporting Reason Clause] -아서/어서
            </div>
            <p>
              Example: "저는 축구를 좋아해요. <strong className="text-indigo-400">재미있어서</strong> 자주 해요."
              <br />
              The second clause here functions explicitly as the **reason/cause** backing up the first stance.
            </p>
          </div>

          {/* Micro MCQ Check */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 max-w-xl mx-auto w-full space-y-4 text-left">
            <p className="text-xs text-indigo-400 font-black uppercase tracking-wider font-mono">💡 Micro-Question Check:</p>
            <p className="text-sm font-bold text-white">In “저는 축구를 좋아해요. 재미있어서 자주 해요.”, what is the function of the second clause?</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: "A", text: "A) It states a contrast (but...)." },
                { id: "B", text: "B) It states a reason (because it's fun...)." }
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
                <p>The suffix -아서/어서 in "재미있어서" translates directly to a cause or reason (because it is fun, I play often).</p>
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

      {/* Screen 5: Activity A – Facts & Clause Roles */}
      {step === 5 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity A – Fact/Opinion & Clause Function Checks</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 5 of {totalSteps}</span>
          </div>

          {recognitionItems.length > 0 && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
              
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl text-center space-y-2">
                <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider block font-mono">Target Statement</span>
                <p className="font-korean text-sm leading-relaxed text-white font-extrabold">{recognitionItems[recIdx]?.text}</p>
                <p className="text-xs text-zinc-400 italic">{recognitionItems[recIdx]?.en}</p>
              </div>

              {recognitionItems[recIdx]?.type === "opinion_fact" ? (
                <div className="space-y-3">
                  <p className="text-xs text-center text-zinc-400">Is this statement an opinion or a fact?</p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => !recChecked && handleCheckRec("opinion")}
                      disabled={recChecked}
                      className={`px-5 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 ${
                        selectedStanceOpt === "opinion"
                          ? "border-indigo-500 bg-indigo-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      } ${recChecked && recognitionItems[recIdx]?.is_opinion ? "border-emerald-500 bg-emerald-500/15 text-white" : ""} ${
                        recChecked && selectedStanceOpt === "opinion" && !recognitionItems[recIdx]?.is_opinion ? "border-red-500 bg-red-500/15 text-white" : ""
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Opinion
                    </button>
                    <button
                      onClick={() => !recChecked && handleCheckRec("fact")}
                      disabled={recChecked}
                      className={`px-5 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 ${
                        selectedStanceOpt === "fact"
                          ? "border-indigo-500 bg-indigo-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      } ${recChecked && !recognitionItems[recIdx]?.is_opinion ? "border-emerald-500 bg-emerald-500/15 text-white" : ""} ${
                        recChecked && selectedStanceOpt === "fact" && recognitionItems[recIdx]?.is_opinion ? "border-red-500 bg-red-500/15 text-white" : ""
                      }`}
                    >
                      <HelpCircle className="w-4 h-4" />
                      Fact
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-center text-zinc-400">Identify the function of the second clause:</p>
                  <div className="flex flex-col gap-2 max-w-xs mx-auto">
                    {["reason", "contrast"].map((optType) => {
                      const isSelected = selectedStanceOpt === optType;
                      const isCorrect = optType === "reason"; // standard fallback in mock data
                      return (
                        <button
                          key={optType}
                          onClick={() => !recChecked && handleCheckRec(optType)}
                          disabled={recChecked}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition-all duration-200 ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-500/10 text-white"
                              : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                          } ${recChecked && isCorrect ? "border-emerald-500 bg-emerald-500/15 text-white font-black" : ""} ${
                            recChecked && isSelected && !isCorrect ? "border-red-500 bg-red-500/15 text-white font-black" : ""
                          }`}
                        >
                          {optType === "reason" ? "It gives a reason (\"because...\")" : "It gives a contrast (\"but...\")"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {recChecked && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 max-w-sm mx-auto text-left animate-fade-in">
                  <p className="font-extrabold text-white mb-1">{recCorrect ? "✓ Correct Choice!" : "✗ Incorrect Choice."}</p>
                  <p>{recognitionItems[recIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {recChecked && (
                  <button
                    onClick={handleNextRec}
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

      {/* Screen 6: Activity B – Opinion Builder */}
      {step === 6 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity B – Opinion & Reason Builder</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
            {/* Step 1: Topic */}
            <div>
              <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1.5 font-mono">Step 1: Choose Topic</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {builderTopics.map((topic: any) => (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSelectedTopic(topic.id);
                      setSelectedReasons([]);
                      setBuiltKo("");
                      setBuiltEn("");
                    }}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition flex items-center gap-2 justify-center ${
                      selectedTopic === topic.id 
                        ? "border-indigo-500 bg-indigo-500/10 text-white" 
                        : "border-white/5 bg-zinc-950 text-zinc-400"
                    }`}
                  >
                    {renderTopicIcon(topic.icon)}
                    <span>{topic.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Stance */}
            <div>
              <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1.5 font-mono">Step 2: Choose Opinion Frame</label>
              <div className="flex flex-col md:flex-row gap-2">
                {stanceOptions[selectedTopic]?.map((stance: any) => (
                  <button
                    key={stance.id}
                    onClick={() => {
                      setSelectedStance(stance.id);
                      setBuiltKo("");
                      setBuiltEn("");
                    }}
                    className={`w-full py-2 rounded-lg border text-xs font-semibold text-center transition ${
                      selectedStance === stance.id
                        ? "border-indigo-500 bg-indigo-500/10 text-white"
                        : "border-white/5 bg-zinc-950 text-zinc-400"
                    }`}
                  >
                    {stance.ko} ({stance.en})
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Reasons */}
            <div>
              <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1.5 font-mono">Step 3: Choose Reason Pattern (Select up to 2)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {reasonPhrases[selectedTopic]?.map((phrase: any, idx: number) => {
                  const isChecked = selectedReasons.includes(phrase.ko);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleReasonPhrase(phrase.ko)}
                      className={`p-2.5 rounded-xl border text-[11px] font-semibold text-left transition ${
                        isChecked
                          ? "border-indigo-500 bg-indigo-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-400"
                      }`}
                    >
                      <span className="block font-korean font-extrabold">{phrase.ko}</span>
                      <span className="text-[9px] text-zinc-500 font-normal">{phrase.en}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleBuildOpinion(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center"
              >
                Build Opinion Sentence
              </button>
              <button
                onClick={() => handleBuildOpinion(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center"
              >
                Build Paragraph Flow
              </button>
            </div>
          </div>

          {/* Generated Result preview */}
          {builtKo && (
            <div className="p-4 bg-zinc-950 rounded-xl border border-indigo-500/20 text-center space-y-3 animate-fade-in">
              <div>
                <span className="text-[9px] text-indigo-400 uppercase tracking-wider block font-black mb-1">Generated B1 Opinion Paragraph:</span>
                <p className="font-korean text-lg text-white font-extrabold leading-relaxed">{builtKo}</p>
                <p className="text-xs text-zinc-400 mt-1">{builtEn}</p>
              </div>

              <div className="flex justify-center gap-2 pt-2">
                <button onClick={() => playAudio(builtKo)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <Volume2 className="w-4 h-4" />
                  <span>Listen</span>
                </button>
                <button onClick={handleSaveOpinion} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <Save className="w-4 h-4" />
                  <span>Save Opinion</span>
                </button>
              </div>

              {/* Recitation */}
              <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-white/5 space-y-2 mt-2">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-black text-left">Opinion Pronunciation Check:</span>
                <div className="flex justify-between items-center gap-3">
                  <button
                    onClick={handleStartRecording}
                    disabled={recording}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      recording ? "bg-red-500 text-white animate-pulse" : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>{recording ? "Recording..." : "Read Opinion"}</span>
                  </button>
                  
                  {speakingChecked && (
                    <div className="text-right space-y-0.5 text-xs">
                      <p className="font-bold text-white">Score: {speakingScore}%</p>
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

      {/* Screen 7: Quiz – Opinion strategies & comprehension */}
      {step === 7 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-400" />
              <span>Mini-Quiz: Opinion Strategies Check</span>
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
                  <p className="font-extrabold text-white mb-1">{quizCorrect ? "✓ Correct! Brilliant." : "✗ Incorrect."}</p>
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

          {/* Encouragement wrap-up when finished */}
          {quizChecked && quizIdx === quizBlueprint.length - 1 && quizCorrect && (
            <div className="mt-4 p-4 bg-zinc-900 border border-emerald-500/20 rounded-2xl max-w-sm mx-auto text-center space-y-1.5 animate-bounce">
              <Award className="w-8 h-8 text-yellow-500 mx-auto" />
              <p className="font-bold text-white text-sm">Opinions Checkpoint Complete</p>
              <p className="text-[10px] text-zinc-400">“You can now state simple opinions and reasons at a solid B1 level.”</p>
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

          <h2 className="text-5xl font-black text-white tracking-tight">Course 4 Phase 4 Completed!</h2>
          <p className="text-xs text-zinc-400 font-mono">“You can now state simple opinions and reasons at a solid B1 level.”</p>

          <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">B1 Opinions Homework Checklist:</span>
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
              <p className="text-[11px] text-zinc-400 leading-normal">Practice sharing your viewpoints and opinions in an interactive conversation session with Gwan-Sik.</p>
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
              <button
                onClick={handleLaunchB1OpinionsPractice}
                disabled={loadingTutor}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition flex items-center justify-center gap-2"
              >
                {loadingTutor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                <span>Initiate AI Opinion Conversation</span>
              </button>
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
              Finish B1 Phase 4
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
