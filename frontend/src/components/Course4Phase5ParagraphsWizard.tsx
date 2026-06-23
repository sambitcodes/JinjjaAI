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
  Calendar,
  Activity,
  MapPin,
  RefreshCw,
  Info
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
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.stop(ctx.currentTime + 0.4);
      window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 20, type: "correct" } }));
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(180.0, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.frequency.exponentialRampToValueAtTime(90.0, ctx.currentTime + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.stop(ctx.currentTime + 0.4);
      window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: -10, type: "wrong" } }));
    }
  } catch (e) {
    console.error("AudioContext not supported or blocked", e);
  }
};

interface Course4Phase5ParagraphsWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course4Phase5ParagraphsWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course4Phase5ParagraphsWizardProps) {
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
    const savedStep = localStorage.getItem("hangeulai_c4p5_step");
    const savedMax = localStorage.getItem("hangeulai_c4p5_max_step");
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
      localStorage.setItem("hangeulai_c4p5_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 8;

  // Persist progress to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c4p5_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 8) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c4p5_step", String(step));
  }, [step]);

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Concept C1 states
  const [c1Selected, setC1Selected] = useState<string | null>(null);
  const [c1Checked, setC1Checked] = useState(false);
  const [c1Correct, setC1Correct] = useState<boolean | null>(null);

  // Concept C2 states
  const [c2Selected, setC2Selected] = useState<string | null>(null);
  const [c2Checked, setC2Checked] = useState(false);
  const [c2Correct, setC2Correct] = useState<boolean | null>(null);

  // Activity 1 states (Reading Comprehension / Structure check)
  const [readingItems, setReadingItems] = useState<any[]>([]);
  const [readIdx, setReadIdx] = useState(0);
  const [selectedTopicOption, setSelectedTopicOption] = useState<string | null>(null);
  const [selectedTopicSentence, setSelectedTopicSentence] = useState<string | null>(null);
  const [activity1Checked, setActivity1Checked] = useState(false);
  const [activity1Correct, setActivity1Correct] = useState<boolean | null>(null);

  // Activity 2 states (Paragraph Planner)
  const [plannerTopics, setPlannerTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("daily_routine");
  
  // Custom draft components
  const [beginningText, setBeginningText] = useState("");
  const [details, setDetails] = useState<any[]>([
    { connector: "먼저", text: "" },
    { connector: "그 다음에", text: "" },
    { connector: "마지막으로", text: "" }
  ]);
  const [endText, setEndText] = useState("");
  const [linkingWords, setLinkingWords] = useState<any[]>([]);

  // Composed results
  const [composedKo, setComposedKo] = useState("");
  const [composedEn, setComposedEn] = useState("");
  const [building, setBuilding] = useState(false);
  
  // Improvement states
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [improvedParagraphKo, setImprovedParagraphKo] = useState("");
  const [improving, setImproving] = useState(false);
  const [savedParagraphs, setSavedParagraphs] = useState<any[]>([]);

  // Reflection state
  const [reflectionAnswer, setReflectionAnswer] = useState("");
  const [reflectionSaved, setReflectionSaved] = useState(false);

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
        if (step === 1 && !metadata) {
          const res = await apiJson("/lessons/phases/korean3/5/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/lessons/phases/korean3/5/core-data");
          setCoreData(res);
        } else if (step === 4 && readingItems.length === 0) {
          const res = await apiJson("/lessons/practice/paragraphs/reading");
          setReadingItems(res.items || []);
        } else if (step === 5 && plannerTopics.length === 0) {
          const res = await apiJson("/lessons/practice/paragraphs/templates");
          setPlannerTopics(res.topics || []);
          setLinkingWords(res.linking_words || []);
        } else if (step === 7 && quizBlueprint.length === 0) {
          const res = await apiJson("/lessons/quiz/korean3/phase-5/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 8 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean3/5/homework");
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

  const handleC1Check = () => {
    if (!c1Selected) return;
    const isCorrect = c1Selected === "beginning";
    setC1Checked(true);
    setC1Correct(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  const handleC2Check = () => {
    if (!c2Selected) return;
    const isCorrect = c2Selected === "A weekend trip to Busan";
    setC2Checked(true);
    setC2Correct(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  const handleCheckActivity1 = async () => {
    const current = readingItems[readIdx];
    if (!current) return;

    const topicCorrect = selectedTopicOption === current.correct_topic;
    const topicSentCorrect = selectedTopicSentence === current.correct_topic_sentence;
    const isCorrect = topicCorrect && topicSentCorrect;

    setActivity1Checked(true);
    setActivity1Correct(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");

    try {
      await apiJson("/lessons/practice/paragraphs/reading/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          is_correct: isCorrect,
          time_taken_ms: 2500
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextActivity1 = () => {
    setActivity1Checked(false);
    setSelectedTopicOption(null);
    setSelectedTopicSentence(null);
    setActivity1Correct(null);

    if (readIdx < readingItems.length - 1) {
      setReadIdx(readIdx + 1);
    } else {
      setReadIdx(0);
    }
  };

  const handleUpdateDetail = (index: number, field: string, value: string) => {
    const nextDetails = [...details];
    nextDetails[index] = { ...nextDetails[index], [field]: value };
    setDetails(nextDetails);
  };

  const handleAddDetailRow = () => {
    if (details.length < 5) {
      setDetails([...details, { connector: "그리고", text: "" }]);
    }
  };

  const handleRemoveDetailRow = (index: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
    }
  };

  const handleBuildParagraph = async () => {
    setBuilding(true);
    setSpeakingChecked(false);
    setSpeakingFeedback("");
    setSpeakingScore(null);
    try {
      const res = await apiJson("/lessons/practice/paragraphs/build", {
        method: "POST",
        body: JSON.stringify({
          topic: selectedTopic,
          beginning: beginningText,
          details: details.filter(d => d.text.trim() !== ""),
          end: endText
        })
      });
      setComposedKo(res.paragraph_ko);
      setComposedEn(res.paragraph_en);
      setStep(6); // Automatically advance to Step 6: Improve Draft
    } catch (err) {
      console.error(err);
    } finally {
      setBuilding(false);
    }
  };

  const handleImproveParagraph = async () => {
    if (!composedKo) return;
    setImproving(true);
    try {
      const res = await apiJson("/lessons/practice/paragraphs/improve", {
        method: "POST",
        body: JSON.stringify({ paragraph_ko: composedKo })
      });
      setAiSuggestions(res.suggestions || []);
      setImprovedParagraphKo(res.improved_ko || "");
    } catch (err) {
      console.error(err);
    } finally {
      setImproving(false);
    }
  };

  const handleSaveParagraph = async () => {
    const textToSave = improvedParagraphKo || composedKo;
    if (!textToSave) return;
    try {
      await apiJson("/lessons/users/paragraphs/save", {
        method: "POST",
        body: JSON.stringify({ title: `My Story: ${selectedTopic}`, content_ko: textToSave })
      });
      setSavedParagraphs(prev => [...prev, textToSave]);
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("Paragraph saved successfully!") } }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartRecording = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      handleCheckSpeaking();
    }, 2500);
  };

  const handleCheckSpeaking = async () => {
    const targetText = improvedParagraphKo || composedKo;
    try {
      const res = await apiJson("/lessons/practice/paragraphs/speaking", {
        method: "POST",
        body: JSON.stringify({ target_text: targetText })
      });
      setSpeakingChecked(true);
      setSpeakingFeedback(res.feedback);
      setSpeakingScore(res.accuracy_score);
    } catch (err) {
      console.error(err);
    }
  };

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
      await apiJson("/lessons/quiz/korean3/phase-5/answer", {
        method: "POST",
        body: JSON.stringify({
          question_id: current.id,
          answer: quizSelectedOpt || "",
          time_taken_ms: 2000
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
        await apiJson("/lessons/quiz/korean3/phase-5/finish", {
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
      await apiJson("/lessons/phases/korean3/5/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLaunchB1ParagraphsPractice = async () => {
    setLoadingTutor(true);
    setTutorSession(null);
    try {
      const res = await apiJson("/lessons/conversation/b1/paragraphs-practice/start", {
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
      case "calendar": return <Calendar className="w-5 h-5 text-indigo-400" />;
      case "activity": return <Activity className="w-5 h-5 text-indigo-400" />;
      case "map-pin": return <MapPin className="w-5 h-5 text-indigo-400" />;
      case "refresh-cw": return <RefreshCw className="w-5 h-5 text-indigo-400" />;
      default: return <BookOpen className="w-5 h-5 text-indigo-400" />;
    }
  };

  const outlineSteps = [
    { num: 1, label: "Welcome" },
    { num: 2, label: "Concept 1: B1 Goal & Structure" },
    { num: 3, label: "Concept 2: Highlighted Example" },
    { num: 4, label: "Activity A: Paragraph Analysis" },
    { num: 5, label: "Activity B1: Paragraph Composer" },
    { num: 6, label: "Activity B2: Draft Improvement" },
    { num: 7, label: "Activity C: Strategy Quiz" },
    { num: 8, label: "Activity D: Tutor Chat Capstone" }
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 4,
          phaseNum: 5,
          step: step
        }
      }));
    }
  }, [step]);

  return (
    <div className="flex-grow flex flex-col justify-between min-h-[75vh] text-zinc-100 font-sans">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Paragraphs: Connected Texts"}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-md uppercase tracking-wider">B1 Writing</span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium">Course 4 &bull; Phase 5</p>
          </div>
        </div>
        
        {/* Active progress bar */}
        <div className="flex items-center space-x-4">
          <div className="w-40 h-3 bg-zinc-950 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 rounded-full transition-all duration-500" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 font-bold">{Math.round((step / totalSteps) * 100)}%</span>
          <button 
            id="toggle-outline-btn"
            onClick={() => setShowOutline(!showOutline)}
            className="text-[10px] bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg transition duration-205 cursor-pointer uppercase tracking-wider font-extrabold"
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

      {/* Screen 1: Welcome/Overview */}
      {step === 1 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/25 w-fit mx-auto text-indigo-400 shrink-0">
            <Sparkles className="w-10 h-10 animate-pulse shrink-0" />
          </div>
          
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Connected Texts &amp; Paragraphs</h2>
            <h3 className="text-xl font-extrabold text-indigo-400 mt-2">B1 Writing Goal Masterclass</h3>
          </div>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Learn to write simple connected texts on familiar topics such as daily routines, memorable trips, or engaging hobbies using a series of linked sentences."}
          </p>

          <div className="bg-zinc-950/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives for this Phase:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Understand the core 3-part paragraph structure: beginning, middle, and end",
                "Read B1 paragraphs and identify main topic and topic sentence",
                "Compose a guided 5–9 sentence paragraph on a selected theme",
                "Apply smoother transitions and refine sentences during an improvement pass"
              ]).map((g: string, idx: number) => (
                <li key={idx} className="text-zinc-300">{g}</li>
              ))}
            </ul>
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs border-t border-white/5 mt-4">
              <p><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 35} minutes</p>
              <p><strong>📋 Prerequisites:</strong> {metadata?.prerequisites || "Korean 3.4 – Opinions"}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-4">
            <button 
              id="start-phase-btn"
              onClick={() => {
    if (courseXP < 320) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 5, you need at least 320 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <span>Begin Lesson</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Screen 2: Concept 1 - B1 Writing Goal & 3-Part Structure */}
      {step === 2 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen 1: B1 Paragraph Structure</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 2 of {totalSteps}</span>
          </div>

          {/* Goal Callout */}
          <div className="bg-indigo-950/30 p-5 rounded-2xl border border-indigo-500/20 text-sm leading-relaxed text-zinc-300">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-white uppercase tracking-wider text-xs">Official B1 Writing Goal:</span>
            </div>
            <p className="italic text-zinc-200">
              "At B1, you must be able to write simple connected texts on familiar topics... using a series of linked sentences."
            </p>
          </div>

          {/* 3-Part Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition duration-200 text-left">
              <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 block w-fit mb-3">Beginning</span>
              <h4 className="font-bold text-white text-sm mb-1.5">Topic Sentence</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {coreData?.paragraph_structure_info?.beginning || "Topic sentence or introduction (who, what, where, when)."}
              </p>
            </div>

            <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 hover:border-purple-500/30 transition duration-200 text-left">
              <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 block w-fit mb-3">Middle</span>
              <h4 className="font-bold text-white text-sm mb-1.5">Detail Sentences</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {coreData?.paragraph_structure_info?.middle || "4–7 sentences with events, details, and examples (body)."}
              </p>
            </div>

            <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 hover:border-violet-500/30 transition duration-200 text-left">
              <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 block w-fit mb-3">End</span>
              <h4 className="font-bold text-white text-sm mb-1.5">Concluding Sentence</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {coreData?.paragraph_structure_info?.end || "1–2 sentences with results, personal feelings, or a conclusion."}
              </p>
            </div>
          </div>

          {/* Concept 1 MCQ Check */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl mx-auto w-full">
            <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest block font-mono">Micro Checkpoint C1</span>
            <p className="text-sm font-bold text-white text-left">Where does the topic sentence usually go in a short paragraph?</p>
            
            <div className="grid grid-cols-3 gap-2">
              {["beginning", "middle", "end"].map((opt) => {
                let borderStyle = "border-white/5 bg-zinc-900/60 text-zinc-300";
                if (c1Selected === opt) {
                  borderStyle = "border-indigo-500 bg-indigo-500/10 text-white";
                }
                if (c1Checked) {
                  if (opt === "beginning") {
                    borderStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                  } else if (c1Selected === opt) {
                    borderStyle = "border-red-500 bg-red-500/10 text-red-300 font-extrabold";
                  }
                }
                return (
                  <button
                    key={opt}
                    id={`c1-opt-${opt}`}
                    disabled={c1Checked}
                    onClick={() => setC1Selected(opt)}
                    className={`py-3.5 px-4 rounded-xl border text-center text-xs font-bold transition capitalize cursor-pointer ${borderStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {c1Checked && (
              <div className={`p-4 rounded-xl text-xs text-left animate-fade-in border ${
                c1Correct ? "bg-green-500/5 border-green-500/20 text-green-300" : "bg-red-500/5 border-red-500/20 text-red-400"
              }`}>
                <p className="font-extrabold mb-1">{c1Correct ? "✓ Correct! Brilliant." : "✗ Incorrect."}</p>
                <p>The topic sentence sets the stage and introduces the main idea, so it typically goes at the very beginning of the paragraph.</p>
              </div>
            )}

            {!c1Checked && (
              <button
                id="check-c1-btn"
                onClick={handleC1Check}
                disabled={!c1Selected}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition cursor-pointer"
              >
                Submit Check
              </button>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button id="prev-btn-2" onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button id="next-btn-2" onClick={() => setStep(3)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Next Screen <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Concept 2 - Highlighted Example Paragraph */}
      {step === 3 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen 2: Model Paragraph Highlights</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 3 of {totalSteps}</span>
          </div>

          {/* Highlight Key */}
          <div className="flex justify-center gap-4 text-xs font-bold flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-indigo-500/25 border border-indigo-500/50"></span> Topic Sentence (Beginning)</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-zinc-900 border border-white/10 text-indigo-400 font-mono flex items-center justify-center text-[10px]">들</span> Linking Words</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-violet-500/25 border border-violet-500/50"></span> Concluding Sentence (End)</span>
          </div>

          {/* Model Paragraph Card */}
          {coreData?.example_paragraphs && coreData.example_paragraphs.length > 0 && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 text-left max-w-3xl mx-auto w-full">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-wider block font-mono">MODEL DRAFT &bull; {coreData.example_paragraphs[0].topic}</span>
                <button
                  id="speak-model-btn"
                  onClick={() => playAudio(coreData.example_paragraphs[0].ko)}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Listen</span>
                </button>
              </div>

              {/* Text highlighting layout */}
              <div className="font-korean text-base md:text-lg leading-relaxed text-zinc-200 bg-zinc-900/40 p-5 rounded-xl border border-white/5">
                <span className="bg-indigo-500/20 border-b border-indigo-500/40 pb-0.5 font-bold text-white px-1 rounded">
                  {coreData.example_paragraphs[0].highlights.topic_sentence}
                </span>{" "}
                
                {/* Body paragraph content with highlighted linking words */}
                {(() => {
                  let bodyStr = coreData.example_paragraphs[0].ko
                    .replace(coreData.example_paragraphs[0].highlights.topic_sentence, "")
                    .replace(coreData.example_paragraphs[0].highlights.concluding_sentence, "");
                  
                  // Split bodyStr by the linking words to highlight them
                  let wordsToHighlight = coreData.example_paragraphs[0].highlights.linking_words;
                  let regex = new RegExp(`(${wordsToHighlight.join("|")})`, "g");
                  let parts = bodyStr.split(regex);
                  
                  return parts.map((part: string, idx: number) => {
                    if (wordsToHighlight.includes(part)) {
                      return (
                        <span key={idx} className="font-extrabold text-indigo-400 bg-indigo-500/5 px-1 py-0.5 rounded border border-indigo-500/10 mx-0.5">
                          {part}
                        </span>
                      );
                    }
                    return <span key={idx}>{part}</span>;
                  });
                })()}{" "}

                <span className="bg-violet-500/20 border-b border-violet-500/40 pb-0.5 font-bold text-white px-1 rounded">
                  {coreData.example_paragraphs[0].highlights.concluding_sentence}
                </span>
              </div>

              {/* English translation panel */}
              <div className="p-4 bg-zinc-900/60 rounded-xl border border-white/5 space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase font-black font-mono">English Gloss:</span>
                <p className="text-xs text-zinc-400 leading-relaxed italic">{coreData.example_paragraphs[0].en}</p>
              </div>
            </div>
          )}

          {/* Concept 2 MCQ Check */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl mx-auto w-full">
            <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest block font-mono">Micro Checkpoint C2</span>
            <p className="text-sm font-bold text-white text-left">What is the main topic of this paragraph in one simple English phrase?</p>
            
            <div className="flex flex-col gap-2">
              {[
                "Learning to cook Korean food as a new hobby",
                "A weekend trip to Busan",
                "My typical weekday routine"
              ].map((opt) => {
                let borderStyle = "border-white/5 bg-zinc-900/60 text-zinc-300";
                if (c2Selected === opt) {
                  borderStyle = "border-indigo-500 bg-indigo-500/10 text-white";
                }
                if (c2Checked) {
                  if (opt === "A weekend trip to Busan") {
                    borderStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                  } else if (c2Selected === opt) {
                    borderStyle = "border-red-500 bg-red-500/10 text-red-300 font-extrabold";
                  }
                }
                return (
                  <button
                    key={opt}
                    id={`c2-opt-${opt.replace(/\s+/g, "-").toLowerCase()}`}
                    disabled={c2Checked}
                    onClick={() => setC2Selected(opt)}
                    className={`py-3 px-4 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${borderStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {c2Checked && (
              <div className={`p-4 rounded-xl text-xs text-left animate-fade-in border ${
                c2Correct ? "bg-green-500/5 border-green-500/20 text-green-300" : "bg-red-500/5 border-red-500/20 text-red-400"
              }`}>
                <p className="font-extrabold mb-1">{c2Correct ? "✓ Correct! Brilliant." : "✗ Incorrect."}</p>
                <p>The model paragraph explicitly introduces a short trip to Busan (부산으로 짧은 여행) in the topic sentence and outlines activities during that weekend trip.</p>
              </div>
            )}

            {!c2Checked && (
              <button
                id="check-c2-btn"
                onClick={handleC2Check}
                disabled={!c2Selected}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition cursor-pointer"
              >
                Submit Check
              </button>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button id="prev-btn-3" onClick={() => {
    if (courseXP < 320) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 5, you need at least 320 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button id="next-btn-3" onClick={() => setStep(4)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity A: Reading & Paragraph Analysis */}
      {step === 4 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity A – Reading &amp; Paragraph Analysis</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 4 of {totalSteps}</span>
          </div>

          {readingItems.length > 0 && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6 text-left max-w-3xl mx-auto w-full">
              
              {/* Target Korean paragraph */}
              <div className="p-5 bg-zinc-900 border border-white/5 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider block font-mono">Korean Reading Text</span>
                  <button
                    id="speak-activity-text"
                    onClick={() => playAudio(readingItems[readIdx]?.text)}
                    className="p-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded border border-white/5 transition flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen</span>
                  </button>
                </div>
                <p className="font-korean text-base md:text-lg leading-relaxed text-white font-medium">{readingItems[readIdx]?.text}</p>
              </div>

              {/* MCQ 1: Main Topic */}
              <div className="space-y-2">
                <p className="text-xs text-zinc-400 font-black uppercase font-mono">Q1: What is the main topic of this paragraph?</p>
                <div className="flex flex-col gap-1.5">
                  {readingItems[readIdx]?.topic_options.map((opt: string) => {
                    let borderStyle = "border-white/5 bg-zinc-900/60 text-zinc-300";
                    if (selectedTopicOption === opt) {
                      borderStyle = "border-indigo-500 bg-indigo-500/10 text-white";
                    }
                    if (activity1Checked) {
                      if (opt === readingItems[readIdx]?.correct_topic) {
                        borderStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                      } else if (selectedTopicOption === opt) {
                        borderStyle = "border-red-500 bg-red-500/10 text-red-300 font-extrabold";
                      }
                    }
                    return (
                      <button
                        key={opt}
                        id={`topic-opt-${opt.replace(/\s+/g, "-").toLowerCase()}`}
                        disabled={activity1Checked}
                        onClick={() => setSelectedTopicOption(opt)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${borderStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MCQ 2: Topic Sentence */}
              <div className="space-y-2">
                <p className="text-xs text-zinc-400 font-black uppercase font-mono">Q2: Which sentence is the topic sentence?</p>
                <div className="flex flex-col gap-1.5">
                  {readingItems[readIdx]?.topic_sentence_candidates.map((sent: string) => {
                    let borderStyle = "border-white/5 bg-zinc-900/60 text-zinc-300";
                    if (selectedTopicSentence === sent) {
                      borderStyle = "border-indigo-500 bg-indigo-500/10 text-white";
                    }
                    if (activity1Checked) {
                      if (sent === readingItems[readIdx]?.correct_topic_sentence) {
                        borderStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                      } else if (selectedTopicSentence === sent) {
                        borderStyle = "border-red-500 bg-red-500/10 text-red-300 font-extrabold";
                      }
                    }
                    return (
                      <button
                        key={sent}
                        id={`topic-sentence-opt-${sent.substring(0, 10).replace(/\s+/g, "-").toLowerCase()}`}
                        disabled={activity1Checked}
                        onClick={() => setSelectedTopicSentence(sent)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold font-korean transition cursor-pointer ${borderStyle}`}
                      >
                        {sent}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activity1Checked && (
                <div className={`p-4 rounded-xl text-xs text-left animate-fade-in border space-y-1.5 ${
                  activity1Correct ? "bg-green-500/5 border-green-500/20 text-green-300" : "bg-red-500/5 border-red-500/20 text-red-400"
                }`}>
                  <p className="font-extrabold text-sm">
                    {activity1Correct ? "✓ Analysis Completed Correctly!" : "✗ Some choices were incorrect."}
                  </p>
                  <p className="text-zinc-300">{readingItems[readIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!activity1Checked ? (
                  <button
                    id="submit-analysis-btn"
                    onClick={handleCheckActivity1}
                    disabled={!selectedTopicOption || !selectedTopicSentence}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-6 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Analysis
                  </button>
                ) : (
                  <button
                    id="next-analysis-btn"
                    onClick={handleNextActivity1}
                    className="bg-purple-600 text-white hover:bg-purple-500 px-5 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next Paragraph
                  </button>
                )}
              </div>

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button id="prev-btn-4" onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button id="next-btn-4" onClick={() => setStep(5)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Activity B1 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Activity B1: Paragraph Composer */}
      {step === 5 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity B1 – Paragraph Composer</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 5 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6 text-left max-w-3xl mx-auto w-full">
            {/* Topic selection */}
            <div>
              <label className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block mb-2 font-mono">Step 1: Choose Story Topic</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {plannerTopics.map((topic: any) => (
                  <button
                    key={topic.id}
                    id={`topic-select-${topic.id}`}
                    onClick={() => {
                      setSelectedTopic(topic.id);
                      setComposedKo("");
                      setComposedEn("");
                      setImprovedParagraphKo("");
                      setAiSuggestions([]);
                    }}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition flex items-center gap-2 justify-center cursor-pointer ${
                      selectedTopic === topic.id 
                        ? "border-indigo-500 bg-indigo-500/10 text-white" 
                        : "border-white/5 bg-zinc-900/40 text-zinc-400 hover:border-white/10"
                    }`}
                  >
                    {renderTopicIcon(topic.icon)}
                    <span>{topic.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Guided Writing Form */}
            <div className="space-y-4">
              {/* Beginning */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-indigo-400 uppercase font-black tracking-widest block font-mono">Step 2: Beginning (Topic Sentence - Who/What/Where/When)</label>
                <textarea
                  id="composer-beginning"
                  value={beginningText}
                  onChange={(e) => setBeginningText(e.target.value)}
                  placeholder="지난주에 저는 부산으로 짧은 여행을 갔습니다. (Write your introductory sentence...)"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-korean"
                  rows={2}
                />
              </div>

              {/* Middle */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-purple-400 uppercase font-black tracking-widest block font-mono">Step 3: Middle (Detail Sentences - 4-7 sentences with events)</label>
                  {details.length < 5 && (
                    <button id="add-detail-row-btn" onClick={handleAddDetailRow} className="text-[9px] text-indigo-400 font-extrabold hover:underline cursor-pointer">+ Add Detail Row</button>
                  )}
                </div>
                <div className="space-y-2">
                  {details.map((detail, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        id={`composer-connector-${idx}`}
                        value={detail.connector}
                        onChange={(e) => handleUpdateDetail(idx, "connector", e.target.value)}
                        className="bg-zinc-900 border border-white/10 rounded-lg text-zinc-300 text-[11px] p-2.5 focus:outline-none focus:border-indigo-500 font-korean"
                      >
                        <option value="">(No Connector)</option>
                        {linkingWords.map((w: any) => (
                          <option key={w.ko} value={w.ko}>{w.ko}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        id={`composer-detail-text-${idx}`}
                        value={detail.text}
                        onChange={(e) => handleUpdateDetail(idx, "text", e.target.value)}
                        placeholder="아침 일찍 기차를 탔습니다."
                        className="flex-grow bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-korean"
                      />
                      {details.length > 1 && (
                        <button id={`composer-remove-btn-${idx}`} onClick={() => handleRemoveDetailRow(idx)} className="text-red-500 hover:text-red-400 font-extrabold text-sm p-1.5">×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* End */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-violet-400 uppercase font-black tracking-widest block font-mono">Step 4: End (Concluding Sentence - Feeling or outcome)</label>
                <textarea
                  id="composer-end"
                  value={endText}
                  onChange={(e) => setEndText(e.target.value)}
                  placeholder="조금 피곤했지만 아주 행복한 하루였습니다. (Summarize your feeling or outcome...)"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-korean"
                  rows={2}
                />
              </div>
            </div>

            {/* Actions to build */}
            <button
              id="build-paragraph-btn"
              onClick={handleBuildParagraph}
              disabled={building || !beginningText || !endText}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer text-center flex items-center justify-center gap-2"
            >
              {building ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Assemble Paragraph &amp; Continue</span>
            </button>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button id="prev-btn-5" onClick={() => setStep(4)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button id="next-btn-5" onClick={() => setStep(6)} disabled={!composedKo} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Activity B2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 6: Activity B2: Improve the Draft */}
      {step === 6 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity B2 – Paragraph Improvement Pass</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 6 of {totalSteps}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
            {/* Left side: Original Draft */}
            <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 text-left flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-zinc-400 font-black uppercase tracking-wider block font-mono mb-2">Original Draft</span>
                <p className="font-korean text-sm text-zinc-200 leading-relaxed font-semibold">{composedKo || "Please compose a paragraph on Step 5 first."}</p>
                {composedEn && <p className="text-[11px] text-zinc-500 leading-relaxed italic mt-2 border-t border-white/5 pt-2">{composedEn}</p>}
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  id="speak-original-btn"
                  onClick={() => playAudio(composedKo)}
                  disabled={!composedKo}
                  className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Listen</span>
                </button>
                <button
                  id="improve-draft-btn"
                  onClick={handleImproveParagraph}
                  disabled={improving || !composedKo}
                  className="px-3 py-2 bg-indigo-900/60 hover:bg-indigo-900 disabled:opacity-40 text-indigo-300 hover:text-white rounded-lg border border-indigo-500/20 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  {improving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Refine draft with AI</span>
                </button>
              </div>
            </div>

            {/* Right side: Refined AI draft */}
            <div className="bg-zinc-950 p-5 rounded-2xl border border-indigo-500/20 text-left flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider block font-mono mb-2">Refined B1 Version</span>
                {improvedParagraphKo ? (
                  <div className="space-y-3 animate-fade-in">
                    <p className="font-korean text-sm text-white font-extrabold leading-relaxed bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10">{improvedParagraphKo}</p>
                    {aiSuggestions.length > 0 && (
                      <div className="p-3 bg-zinc-900 rounded-xl border border-white/5">
                        <span className="text-[8px] text-zinc-500 uppercase font-black font-mono block mb-1">Key revisions applied:</span>
                        <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[10px]">
                          {aiSuggestions.map((s, idx) => <li key={idx}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-zinc-500 text-xs italic flex flex-col items-center justify-center h-32">
                    <Sparkles className="w-8 h-8 text-zinc-600 mb-2" />
                    <p>Click "Refine draft with AI" to generate improvements like smoother connectors, better endings, and clearer ordering.</p>
                  </div>
                )}
              </div>

              {improvedParagraphKo && (
                <div className="mt-4 flex gap-2">
                  <button
                    id="speak-refined-btn"
                    onClick={() => playAudio(improvedParagraphKo)}
                    className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Listen</span>
                  </button>
                  <button
                    id="save-refined-btn"
                    onClick={handleSaveParagraph}
                    className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Story</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Micro-reflection & Speaking */}
          {(improvedParagraphKo || composedKo) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full pt-4 border-t border-white/5">
              
              {/* Optional Micro-reflection */}
              <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 text-left space-y-3">
                <span className="text-[9px] text-zinc-400 font-black uppercase tracking-wider block font-mono">Micro-reflection</span>
                <p className="text-xs text-zinc-300">What changed between your original and the improved paragraph (topic clarity, ordering, connectors, conclusion)?</p>
                <textarea
                  id="reflection-input"
                  value={reflectionAnswer}
                  onChange={(e) => setReflectionAnswer(e.target.value)}
                  placeholder="I noticed the connectors made the transitions between sentences feel much more natural..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  rows={2}
                />
                <button
                  id="save-reflection-btn"
                  onClick={() => setReflectionSaved(true)}
                  disabled={!reflectionAnswer || reflectionSaved}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold disabled:opacity-40 transition cursor-pointer"
                >
                  {reflectionSaved ? "Saved ✓" : "Save reflection"}
                </button>
              </div>

              {/* Pronunciation check */}
              <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 text-left space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] text-zinc-400 font-black uppercase tracking-wider block font-mono">Speaking Practice</span>
                  <p className="text-xs text-zinc-300">Read your completed paragraph aloud to verify your speech delivery and pacing.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    id="read-aloud-btn"
                    onClick={handleStartRecording}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      recording 
                        ? "bg-red-500 text-white animate-pulse" 
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>{recording ? "Recording..." : "Read Aloud"}</span>
                  </button>
                  {speakingChecked && (
                    <div className="text-left">
                      <span className="text-xs font-bold text-green-400 block">Accuracy: {speakingScore}%</span>
                      <span className="text-[9px] text-zinc-400 block leading-tight">{speakingFeedback}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button id="prev-btn-6" onClick={() => setStep(5)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button id="next-btn-6" onClick={() => setStep(7)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 7: Activity C: Strategy quiz */}
      {step === 7 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Phase Checkpoint Quiz: Writing Strategies</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 7 of {totalSteps}</span>
          </div>

          {quizBlueprint.length > 0 && (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>Quiz Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span>Type: B1 Writing Mechanics</span>
              </div>

              <h3 className="text-base md:text-lg font-black text-white text-center leading-relaxed whitespace-pre-line bg-zinc-950 p-5 rounded-2xl border border-white/5">
                {quizBlueprint[quizIdx]?.question}
              </h3>

              <div className="grid grid-cols-1 gap-2.5 max-w-md mx-auto">
                {quizBlueprint[quizIdx]?.options?.map((opt: string) => {
                  let borderStyle = "border-white/5 bg-zinc-900/60 text-zinc-300";
                  if (quizSelectedOpt === opt) {
                    borderStyle = "border-indigo-500 bg-indigo-500/10 text-white";
                  }
                  if (quizChecked) {
                    if (opt === quizBlueprint[quizIdx]?.correct_answer) {
                      borderStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                    } else if (quizSelectedOpt === opt) {
                      borderStyle = "border-red-500 bg-red-500/10 text-red-300 font-extrabold";
                    }
                  }
                  return (
                    <button
                      key={opt}
                      id={`quiz-opt-${opt.substring(0, 15).replace(/\s+/g, "-").toLowerCase()}`}
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
                  <p className="font-extrabold text-sm">{quizCorrect ? "✓ Correct! Brilliant." : "✗ Incorrect."}</p>
                  <p className="text-zinc-300">{quizBlueprint[quizIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button id="prev-btn-7" onClick={() => setStep(6)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                {!quizChecked ? (
                  <button
                    id="submit-quiz-btn"
                    onClick={handleCheckQuiz}
                    disabled={!quizSelectedOpt}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    id="next-quiz-btn"
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-purple-600 text-white hover:bg-purple-500 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {finishingQuiz ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : (quizIdx < quizBlueprint.length - 1 ? "Next Question" : "View Capstone")}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 8: Activity D: Tutor Session Capstone */}
      {step === 8 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in max-w-3xl mx-auto">
          <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/25 w-fit mx-auto text-indigo-400">
            <Award className="w-10 h-10 animate-bounce" />
          </div>
          
          <div>
            <h2 className="text-3xl font-black text-white font-sans">Korean B1 Writing Complete! 🇰🇷✨</h2>
            <p className="text-zinc-400 text-sm mt-1.5">You can now construct fully-fledged paragraphs and stories using intermediate B1 grammar.</p>
          </div>

          {/* Homework checklist */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-left text-xs space-y-3 font-sans leading-relaxed">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block font-sans">Interactive Homework List:</span>
            <div className="space-y-2">
              {homeworkItems.map((item: any) => {
                const checked = !!completedHomework[item.id];
                return (
                  <label key={item.id} className="flex items-start gap-3 p-3 bg-zinc-900/45 rounded-lg border border-white/[0.03] cursor-pointer hover:bg-zinc-900 transition">
                    <input
                      type="checkbox"
                      id={`hw-checkbox-${item.id}`}
                      checked={checked}
                      onChange={() => handleToggleHomework(item.id, checked)}
                      className="mt-0.5 rounded border-white/10 text-indigo-500 focus:ring-0 focus:ring-offset-0 bg-zinc-950"
                    />
                    <span className={`text-zinc-300 font-medium ${checked ? "line-through text-zinc-500" : ""}`}>{item.text}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Gwan-Sik Paragraphs AI Tutor Launcher */}
          <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-indigo-400" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Tutor Gwan-Sik Capstone Chat</span>
                <span className="text-[10px] text-zinc-500 block">Practise telling or walking through your paragraph in Korean.</span>
              </div>
            </div>
            {tutorSession ? (
              <div className="bg-zinc-900 p-4 rounded-xl border border-indigo-500/20 text-left text-xs animate-fade-in">
                <span className="text-[9px] font-bold text-indigo-400 block mb-1">Gwan-Sik:</span>
                <p className="font-korean text-white leading-relaxed">{tutorSession.opener}</p>
                <div className="mt-3 flex justify-end">
                  <a href={`/conversation/chat?session_id=${tutorSession.session_id}`} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-4 rounded-xl text-[10px] transition cursor-pointer">
                    Join Conversation Room
                  </a>
                </div>
              </div>
            ) : (
              <button
                id="launch-tutor-btn"
                onClick={handleLaunchB1ParagraphsPractice}
                disabled={loadingTutor}
                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-indigo-400 hover:text-indigo-300 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingTutor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Initiate live conversation with Gwan-Sik"}
              </button>
            )}
          </div>

          <button
            id="finish-phase-btn"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 150, type: "correct" } }));
              }onComplete();
            }}
            className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 text-white font-black py-4 px-10 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <span>Finish Phase 5 &amp; Return to Lessons</span>
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
