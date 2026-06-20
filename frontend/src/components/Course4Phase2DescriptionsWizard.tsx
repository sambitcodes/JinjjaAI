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
  ArrowRight,
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

interface Course4Phase2DescriptionsWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course4Phase2DescriptionsWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course4Phase2DescriptionsWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 6;

  // DB Data loaded
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Active filters on Adjective banks
  const [activeFilter, setActiveFilter] = useState<"all" | "appearance" | "personality" | "place" | "object">("all");
  const [flippedAdjKo, setFlippedAdjKo] = useState<string | null>(null);

  // Activity 1 states (Reading & Listening)
  const [understandingItems, setUnderstandingItems] = useState<any[]>([]);
  const [undIdx, setUndIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [undChecked, setUndChecked] = useState(false);
  const [undCorrect, setUndCorrect] = useState<boolean | null>(null);

  // Activity 2 states (Custom Builders)
  const [builderTemplates, setBuilderTemplates] = useState<any>(null);
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
        if (step === 1 && !metadata) {
          const res = await apiJson("/lessons/phases/korean3/2/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/lessons/phases/korean3/2/core-data");
          setCoreData(res);
        } else if (step === 3 && understandingItems.length === 0) {
          const res = await apiJson("/lessons/practice/descriptions/listening-reading");
          setUnderstandingItems(res.items || []);
        } else if (step === 4 && !builderTemplates) {
          const res = await apiJson("/lessons/practice/descriptions/templates");
          setBuilderTemplates(res);
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/lessons/quiz/korean3/phase-2/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
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

  // Activity 1 Check
  const handleCheckUnd = () => {
    const current = understandingItems[undIdx];
    if (!current) return;
    const activeQ = current.questions[qIdx];
    if (!activeQ || !selectedOpt) return;

    const isCorrect = selectedOpt === activeQ.correct_answer;
    setUndChecked(true);
    setUndCorrect(isCorrect);
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
      alert("Description saved successfully!");
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
        setStep(6);
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
    { num: 2, label: "Activity 1 – Filterable adjective inventories & B1 templates" },
    { num: 3, label: "Activity 2 – Reading/listening descriptive comprehension" },
    { num: 4, label: "Activity 3 – Custom Person & Place builders with speech validation" },
    { num: 5, label: "Activity 4 – Grammar check quizzes" }
  ];

  return (
    <div className="flex-grow flex flex-col justify-between">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <BookOpen className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Describing People & Places (B1 Core)"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: Descriptive Modifiers</p>
          </div>
        </div>
        
        {/* Active progress bar */}
        <div className="flex items-center space-x-4">
          <div className="w-40 h-3 bg-zinc-900/80 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 rounded-full transition-all duration-500" 
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
      {showOutline && (
        <div className="mb-6 p-5 bg-zinc-950/80 rounded-3xl border border-white/5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 font-mono">Curriculum Syllabus Map</span>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {outlineSteps.map(s => (
              <button
                key={s.num}
                onClick={() => {
                  setStep(s.num);
                  setShowOutline(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition ${step === s.num
                    ? "border-brand-500 bg-brand-500/10 text-white"
                    : "border-white/5 bg-zinc-900/40 text-zinc-400 hover:border-white/10 hover:text-white"
                  }`}
              >
                <div className="text-[9px] font-black font-mono text-zinc-500">STEP {s.num}</div>
                <div className="text-xs font-bold truncate">{s.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Screen 1: Welcome/Overview */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight">Korean 3.2</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Describing People & Places</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Talk about people, places, and things in more detail."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Use more adjectives for appearance, personality, and places",
                "Build 4–6 sentence descriptions of people and places",
                "Understand detailed descriptions in short texts or dialogues"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 30} minutes</p>
            <p><strong>📋 Prerequisites:</strong> {metadata?.prerequisites || "Korean 3.1 – Connecting Ideas"}</p>
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => setStep(2)}
              className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 2</span>
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
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>Description Templates</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">B1 Description Goal:</p>
            <p className="italic">
              "At B1, you should be able to describe people, places, and things in some detail, not just with one or two words. You’ll learn how to build longer descriptions step by step."
            </p>
          </div>

          {/* Adjective Filters */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1 bg-zinc-950 p-1 rounded-xl border border-white/5">
              {(["all", "appearance", "personality", "place", "object"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setActiveFilter(filter);
                    setFlippedAdjKo(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex-grow ${
                    activeFilter === filter 
                      ? "bg-brand-500 text-white" 
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Adjective grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
              {coreData?.adjectives
                ?.filter((adj: any) => activeFilter === "all" || adj.tag === activeFilter)
                ?.map((adj: any) => {
                  const isFlipped = flippedAdjKo === adj.ko;
                  return (
                    <button
                      key={adj.ko}
                      onClick={() => setFlippedAdjKo(isFlipped ? null : adj.ko)}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col justify-center items-center min-h-[50px] cursor-pointer ${
                        isFlipped 
                          ? "border-brand-500 bg-brand-500/10 text-white animate-fade-in" 
                          : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {!isFlipped ? (
                        <span className="font-korean font-bold text-xs">{adj.ko}</span>
                      ) : (
                        <div className="text-[10px] leading-tight">
                          <span className="block font-semibold text-brand-400">{adj.en}</span>
                          <span className="text-[8px] text-zinc-500 font-mono block">{adj.rom}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Color Highlight Example description */}
          {coreData?.example_descriptions?.[0] && (
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block text-left">Detailed Example Description:</span>
              <p className="font-korean text-sm leading-relaxed text-zinc-200 text-left">
                제 친구 민우는 <span className="text-blue-400 font-extrabold">키가 크고</span> <span className="text-emerald-400 font-extrabold">활발해요</span>. 항상 <span className="text-emerald-400 font-extrabold">친절해서</span> 친구들이 아주 많아요. 보통 주말에 <span className="text-amber-400 font-extrabold">축구하는 것을 좋아해요</span>.
              </p>
              
              <div className="flex gap-4 text-[9px] font-bold border-t border-white/5 pt-2 justify-center">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-400 rounded-sm" /> Appearance</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm" /> Personality</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400 rounded-sm" /> Extra Detail</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Understanding Descriptions */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Understanding Descriptions</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {understandingItems.length > 0 && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
              
              {/* Short paragraph prompt */}
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl text-center space-y-2">
                <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Description Paragraph</span>
                <p className="font-korean text-sm leading-relaxed text-white font-extrabold">{understandingItems[undIdx]?.text}</p>
                <div className="flex justify-center pt-1">
                  <button onClick={() => playAudio(understandingItems[undIdx]?.text)} className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg border border-white/5 transition flex items-center gap-1 text-[10px] font-bold">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen</span>
                  </button>
                </div>
              </div>

              {/* Questions check */}
              <div className="space-y-3">
                <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 text-center text-xs">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono block">Question {qIdx + 1}:</span>
                  <p className="font-bold text-white mt-0.5">{understandingItems[undIdx]?.questions[qIdx]?.question}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
                  {understandingItems[undIdx]?.questions[qIdx]?.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !undChecked && setSelectedOpt(opt)}
                      disabled={undChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                        selectedOpt === opt
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      } ${undChecked && opt === understandingItems[undIdx]?.questions[qIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {undChecked && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 max-w-sm mx-auto text-left">
                  <p className="font-extrabold text-white mb-1">{undCorrect ? "✓ Correct Choice!" : "✗ Incorrect Choice."}</p>
                  <p>{understandingItems[undIdx]?.questions[qIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!undChecked ? (
                  <button
                    onClick={handleCheckUnd}
                    disabled={!selectedOpt}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestionOrDescription}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next Question
                  </button>
                )}
              </div>

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(2)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 2: Build Your Own Description */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Description Builder</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          {/* Builder Tabs */}
          <div className="bg-zinc-950 p-1 rounded-xl border border-white/5 flex">
            <button
              onClick={() => {
                setActiveBuilderTab("person");
                setBuiltKo("");
                setBuiltEn("");
              }}
              className={`w-full py-2 text-center text-xs font-bold rounded-lg transition ${
                activeBuilderTab === "person" 
                  ? "bg-brand-500 text-white shadow" 
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
                  ? "bg-brand-500 text-white shadow" 
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              Describe a Place
            </button>
          </div>

          {/* Person Builder inputs */}
          {activeBuilderTab === "person" && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
              {/* Appearance pick */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Pick Appearance Adjectives (Pick up to 2)</label>
                <div className="flex flex-wrap gap-1.5">
                  {coreData?.adjectives?.filter((a: any) => a.tag === "appearance")?.map((a: any) => (
                    <button
                      key={a.ko}
                      onClick={() => toggleAppearance(a.ko)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                        selectedAppearance.includes(a.ko) 
                          ? "border-brand-500 bg-brand-500/10 text-white" 
                          : "border-white/5 bg-zinc-950 text-zinc-400"
                      }`}
                    >
                      {a.ko} ({a.en})
                    </button>
                  ))}
                </div>
              </div>

              {/* Personality pick */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Pick Personality Adjectives (Pick up to 2)</label>
                <div className="flex flex-wrap gap-1.5">
                  {coreData?.adjectives?.filter((a: any) => a.tag === "personality")?.map((a: any) => (
                    <button
                      key={a.ko}
                      onClick={() => togglePersonality(a.ko)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                        selectedPersonality.includes(a.ko) 
                          ? "border-brand-500 bg-brand-500/10 text-white" 
                          : "border-white/5 bg-zinc-950 text-zinc-400"
                      }`}
                    >
                      {a.ko} ({a.en})
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom hobby */}
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
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center"
              >
                Generate Person Description
              </button>
            </div>
          )}

          {/* Place Builder inputs */}
          {activeBuilderTab === "place" && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                {/* Size select */}
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

                {/* Atmosphere select */}
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

              {/* Location input */}
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
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center"
              >
                Generate Place Description
              </button>
            </div>
          )}

          {/* Generated Result preview */}
          {builtKo && (
            <div className="p-4 bg-zinc-950 rounded-xl border border-brand-500/20 text-center space-y-3 animate-fade-in">
              <div>
                <span className="text-[9px] text-brand-400 uppercase tracking-wider block font-black mb-1">Generated B1 Description:</span>
                <p className="font-korean text-base text-white font-extrabold leading-relaxed">{builtKo}</p>
                <p className="text-xs text-zinc-400 mt-1">{builtEn}</p>
              </div>

              <div className="flex justify-center gap-2 pt-2">
                <button onClick={() => playAudio(builtKo)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold">
                  <Volume2 className="w-4 h-4" />
                  <span>Listen</span>
                </button>
                <button onClick={() => handleSaveDescription(activeBuilderTab)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold">
                  <Save className="w-4 h-4" />
                  <span>Save Description</span>
                </button>
              </div>

              {/* Speaking practice */}
              <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-white/5 space-y-2 mt-2">
                <span className="text-[9px] text-zinc-500 tracking-wider block font-black text-left">Pronunciation Practice:</span>
                <div className="flex justify-between items-center gap-3">
                  <button
                    onClick={handleStartRecording}
                    disabled={recording}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      recording ? "bg-red-500 text-white animate-pulse" : "bg-brand-500 text-white hover:bg-brand-600"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>{recording ? "Recording..." : "Hold to Record"}</span>
                  </button>
                  
                  {speakingChecked && (
                    <div className="text-right space-y-0.5 text-xs">
                      <p className="font-bold text-white">Accuracy: {speakingScore}%</p>
                      <p className="text-[10px] text-zinc-500 font-medium">{speakingFeedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Mini-Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Mini-Quiz */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Mini-Quiz: Description Check</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Question {quizIdx + 1} of {quizBlueprint.length}</span>
          </div>

          {quizBlueprint.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Question Prompt</span>
                <p className="font-extrabold text-white text-base mt-1 whitespace-pre-line">{quizBlueprint[quizIdx]?.question}</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {quizBlueprint[quizIdx]?.options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                    disabled={quizChecked}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                      quizSelectedOpt === opt
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                    } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10 text-white" : ""}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {quizChecked && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 text-left">
                  <p className="font-extrabold text-white mb-1">{quizCorrect ? "✓ Answer Correct!" : "✗ Incorrect Answer."}</p>
                  <p>{quizBlueprint[quizIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end">
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={!quizSelectedOpt}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl text-xs cursor-pointer transition"
                  >
                    Verify Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/95 font-bold px-6 py-2 rounded-xl text-xs cursor-pointer transition flex items-center gap-1.5"
                  >
                    {finishingQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Complete Quiz"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(4)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <div className="h-4" />
          </div>
        </div>
      )}

      {/* Screen 6: Homework & AI practice launcher */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-accent-teal/10 rounded-full border border-accent-teal/25 w-fit mx-auto text-accent-teal shrink-0">
            <Award className="w-8 h-8 animate-bounce shrink-0" />
          </div>

          <h2 className="text-5xl font-black text-white tracking-tight">Course 4 Phase 2 Completed!</h2>
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
                      className="mt-0.5 h-4 w-4 rounded border-white/10 bg-zinc-950 text-brand-500 focus:ring-0 focus:ring-offset-0"
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
              <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">AI Description Dialogue CAPSTONE:</span>
              <p className="text-[11px] text-zinc-400 leading-normal">Practice describing a friend or place in an interactive conversation session with Gwan-Sik.</p>
            </div>

            {tutorSession ? (
              <div className="p-4 bg-zinc-900 border border-brand-500/20 rounded-xl space-y-2 text-xs animate-fade-in">
                <p className="font-extrabold text-white">Stateful Session Active!</p>
                <p className="font-korean text-zinc-200">Gwan-Sik: "{tutorSession.opener}"</p>
                <button
                  onClick={() => window.location.href = `/tutor?session_id=${tutorSession.session_id}`}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-1.5 px-4 rounded-lg text-[10px] cursor-pointer transition flex items-center gap-1"
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
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Describe a Person</span>
                </button>
                <button
                  onClick={() => handleLaunchB1DescriptionPractice("place")}
                  disabled={loadingTutor}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Describe a Place</span>
                </button>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button 
              onClick={onComplete}
              className="bg-accent-teal hover:bg-accent-teal/90 text-zinc-950 font-black py-3.5 px-10 rounded-xl transition text-sm shadow-lg shadow-accent-teal/15 cursor-pointer"
            >
              Finish B1 Phase 2
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
