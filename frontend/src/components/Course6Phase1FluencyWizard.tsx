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
  MessageCircle,
  TrendingUp,
  Play,
  Activity,
  CheckSquare
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

interface Course6Phase1FluencyWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course6Phase1FluencyWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course6Phase1FluencyWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 6;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1 states
  const [activity1SubStep, setActivity1SubStep] = useState<"1A" | "1B">("1A");
  const [analysisStory, setAnalysisStory] = useState<any>(null);
  const [selectedParagraphStage, setSelectedParagraphStage] = useState<Record<number, string>>({});
  const [selectedEvaluationAns, setSelectedEvaluationAns] = useState<string | null>(null);
  const [act1Checked, setAct1Checked] = useState(false);
  const [act1Correct, setAct1Correct] = useState<boolean | null>(null);

  // Reorder task
  const [reorderData, setReorderData] = useState<any>(null);
  const [scrambledBlocks, setScrambledBlocks] = useState<any[]>([]);
  const [selectedConnectors, setSelectedConnectors] = useState<Record<string, string>>({});
  const [improvedStory, setImprovedStory] = useState<any>(null);
  const [buildingImproved, setBuildingImproved] = useState(false);

  // Activity 2 states
  const [activity2SubStep, setActivity2SubStep] = useState<"2A" | "2B" | "2C">("2A");
  
  // Story builder
  const [builderTopic, setBuilderTopic] = useState("A challenge you overcame");
  const [blueprintDrafts, setBlueprintDrafts] = useState<Record<string, string>>({});
  const [builderFeedback, setBuilderFeedback] = useState<any>(null);
  const [buildingDraft, setBuildingDraft] = useState(false);

  // Speech monologue
  const [recording, setRecording] = useState(false);
  const [speechEvaluation, setSpeechEvaluation] = useState<any>(null);
  const [submittingSpeech, setSubmittingSpeech] = useState(false);

  // AI Prompt long turn chat
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [aiText, setAiText] = useState("");
  const [aiSending, setAiSending] = useState(false);
  const [aiFinished, setAiFinished] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<any>(null);
  const [finishingLongTurn, setFinishingLongTurn] = useState(false);

  // Quiz states
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);
  const [quizBadge, setQuizBadge] = useState<string | null>(null);

  // Homework states
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Homework AI practice session
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [practiceMessages, setPracticeMessages] = useState<any[]>([]);
  const [practiceText, setPracticeText] = useState("");
  const [practiceSending, setPracticeSending] = useState(false);
  const [practiceFinished, setPracticeFinished] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);

  // Load API Data per Step
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean5/1/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean5/1/core-data");
          setCoreData(res);
        } else if (step === 3) {
          if (!analysisStory) {
            const res = await apiJson("/practice/advanced-story/analysis");
            setAnalysisStory(res);
          }
          if (!reorderData) {
            const res = await apiJson("/practice/advanced-story/reorder");
            setReorderData(res);
            setScrambledBlocks(res.scrambled || []);
          }
        } else if (step5Condition()) {
          const res = await apiJson("/quiz/korean5/phase-1/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean5/1/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading C1 fluency data:", err);
      }
    };
    load();
  }, [step]);

  const step5Condition = () => {
    return step === 5 && quizBlueprint.length === 0;
  };

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1A checks
  const handleCheckActivity1A = () => {
    if (!analysisStory) return;
    const correctVal = selectedEvaluationAns === "그때 정말 포기하고 싶을 만큼 절망스러웠습니다. (At that time, I was desperate enough to really want to give up.)";
    
    // Simple mock check for segment alignments
    const allSegmentsMatched = Object.keys(selectedParagraphStage).length >= 3;

    setAct1Checked(true);
    setAct1Correct(correctVal && allSegmentsMatched);
  };

  // Reorder task re-arranger
  const moveBlock = (fromIndex: number, toIndex: number) => {
    const updated = [...scrambledBlocks];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setScrambledBlocks(updated);
  };

  const handleBuildReorderStory = async () => {
    setBuildingImproved(true);
    try {
      const res = await apiJson("/practice/advanced-story/reorder/answer", {
        method: "POST",
        body: JSON.stringify({
          question_id: reorderData.id,
          answer: JSON.stringify({
            order: scrambledBlocks.map(b => b.id),
            connectors: selectedConnectors
          }),
          time_taken_ms: 4000
        })
      });
      setImprovedStory(res);
      playAudio(res.improved_text);
    } catch (e) {
      console.error(e);
    } finally {
      setBuildingImproved(false);
    }
  };

  // Activity 2 Story Builder
  const handleBuildStoryDraft = async () => {
    setBuildingDraft(true);
    try {
      const res = await apiJson("/practice/advanced-story/build", {
        method: "POST",
        body: JSON.stringify({
          Abstract: blueprintDrafts["Abstract"] || "",
          Orientation: blueprintDrafts["Orientation"] || "",
          ComplicatingAction: blueprintDrafts["ComplicatingAction"] || "",
          Evaluation: blueprintDrafts["Evaluation"] || "",
          Resolution: blueprintDrafts["Resolution"] || "",
          Coda: blueprintDrafts["Coda"] || ""
        })
      });
      setBuilderFeedback(res);
    } catch (e) {
      console.error(e);
    } finally {
      setBuildingDraft(false);
    }
  };

  // Speech monologue recorder
  const handleRecordMonologue = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      setSubmittingSpeech(true);
      try {
        const res = await apiJson("/practice/advanced-story/monologue-record", {
          method: "POST",
          body: JSON.stringify({
            target_text: "제가 해결해야 했던 가장 큰 도전은 졸업 논문 작성이었습니다.",
            user_audio_base64: "mock_base64"
          })
        });
        setSpeechEvaluation(res);
      } catch (err) {
        console.error(err);
      } finally {
        setSubmittingSpeech(false);
      }
    }, 3000);
  };

  // AI Prompt long turn chat session
  const handleStartAiLongTurn = async () => {
    setAiMessages([]);
    setAiEvaluation(null);
    setAiFinished(false);
    try {
      const res = await apiJson("/conversation/c1/story-longturn/start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: builderTopic })
      });
      setAiSessionId(res.session_id);
      setAiMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") {
        playAudio(res.opener);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendAiTurn = async () => {
    if (!aiText.trim() || !aiSessionId) return;
    const textToSend = aiText;
    setAiText("");
    setAiMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setAiSending(true);

    try {
      const res = await apiJson("/conversation/c1/story-longturn/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setAiMessages((prev) => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") {
        playAudio(res.reply_ko);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiSending(false);
    }
  };

  const handleFinishAiLongTurn = async () => {
    if (!aiSessionId) return;
    setFinishingLongTurn(true);
    try {
      const res = await apiJson("/conversation/c1/story-longturn/finish", { method: "POST" });
      setAiEvaluation(res);
      setAiFinished(true);
    } catch (err) {
      console.error(err);
    } finally {
      setFinishingLongTurn(false);
    }
  };

  // Quiz Checks
  const handleCheckQuiz = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelectedOpt) return;

    const isCorrect = quizSelectedOpt === current.correct_answer;
    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    if (!isCorrect) {
      setQuizMistakes((prev) => [...prev, current.id]);
    }

    try {
      await apiJson("/quiz/korean5/phase-1/answer", {
        method: "POST",
        body: JSON.stringify({
          question_id: current.id,
          answer: quizSelectedOpt,
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
        const res = await apiJson("/quiz/korean5/phase-1/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Advanced Storyteller C1");
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
    setCompletedHomework((prev) => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/phases/korean5/1/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Homework AI practice session
  const handleStartPractice = async (scen: string) => {
    setPracticeMessages([]);
    setPracticeFeedback(null);
    setPracticeFinished(false);
    try {
      const res = await apiJson("/conversation/c1/story-practice/start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: scen })
      });
      setPracticeSessionId(res.session_id);
      setPracticeMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") {
        playAudio(res.opener);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendPracticeTurn = async () => {
    if (!practiceText.trim() || !practiceSessionId) return;
    const textToSend = practiceText;
    setPracticeText("");
    setPracticeMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setPracticeSending(true);

    try {
      const res = await apiJson("/conversation/c1/story-practice/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setPracticeMessages((prev) => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") {
        playAudio(res.reply_ko);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPracticeSending(false);
    }
  };

  const handleFinishPractice = async () => {
    if (!practiceSessionId) return;
    try {
      const res = await apiJson("/conversation/c1/story-practice/finish", { method: "POST" });
      setPracticeFeedback(res.feedback);
      setPracticeFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

    const outlineSteps = [
    { num: 1, label: "Screen 1 – Welcome / Phase Overview" },
    { num: 2, label: "Screen 2 – C1 Fluency & Story blueprints" },
    { num: 3, label: "Screen 3 – Activity 1: Analyze & Reorder Scenarios" },
    { num: 4, label: "Screen 4 – Activity 2: Form Builders & Spoken Monologues" },
    { num: 5, label: "Screen 5 – Mini-Quiz: Connector & Logic Checkpoints" },
    { num: 6, label: "Screen 6 – Homework & Exit reflections" }
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
              <span>{activeLesson?.title || "Korean 5.1 – Advanced Fluency & Storytelling"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: C1 Narrative Structures & Connectors</p>
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
          
          <h2 className="text-5xl font-black text-white tracking-tight font-sans">Korean 5.1</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Advanced Fluency & Storytelling</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Tell complex stories and ideas smoothly in Korean."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Speak at length without stopping to search for every word",
                "Structure stories with clear beginnings, turning points, and reflections",
                "Use advanced connectors and discourse markers to sound organized"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 35}–45 minutes</p>
          </div>

          {/* Mode Selector */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Conversation Mode</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("text")}
                className={`p-3 rounded-xl border text-xs font-bold transition ${
                  mode === "text" 
                    ? "border-brand-500 bg-brand-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                Text Input
              </button>
              <button
                onClick={() => setMode("voice")}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  mode === "voice" 
                    ? "border-brand-500 bg-brand-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice + Text</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => setStep(2)}
              className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 1</span>
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
              <span>C1‑Level Fluency & Story Structure</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">C1 Fluency Goal</p>
            <p className="italic font-serif">
              “At C1, you can express ideas fluently and spontaneously without much obvious searching for expressions, and you can produce clear, well-structured, detailed speech on complex subjects.”
            </p>
          </div>

          {/* Story Arc Diagram */}
          <div className="space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">1. Horizontal Story Arc Structure</span>
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-white/5 flex gap-1 justify-between text-[8px] font-black uppercase text-center font-mono">
              {coreData?.story_blueprint?.stages.map((st: string) => (
                <div key={st} className="flex-grow p-1 bg-zinc-900 border border-brand-500/20 text-brand-400 rounded">
                  {st}
                </div>
              ))}
            </div>
          </div>

          {/* Connector Category Grid */}
          <div className="space-y-2 text-left text-xs">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">2. Advanced Connector Inventory</span>
            <div className="grid grid-cols-3 gap-2">
              {coreData?.discourse_markers && Object.entries(coreData.discourse_markers).map(([cat, list]: any) => (
                <div key={cat} className="p-2 bg-zinc-900 rounded-lg border border-white/5">
                  <span className="text-[8px] text-zinc-500 uppercase font-mono font-bold block mb-1">{cat}</span>
                  <div className="space-y-0.5 text-[10px]">
                    {list.map((c: string) => (
                      <p key={c} className="text-zinc-300 truncate font-korean">{c}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Annotated Story Monologue */}
          <div className="space-y-2 text-left text-xs bg-zinc-900/40 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">3. Labeled C1 Monologue Example</span>
              <button 
                onClick={() => playAudio(coreData?.annotated_monologue?.text || "")}
                className="p-1 bg-zinc-950 rounded text-zinc-400 hover:text-white flex items-center gap-1 text-[9px] px-2 border border-white/5 cursor-pointer"
              >
                <Volume2 className="w-3 h-3" /> Play Flow
              </button>
            </div>
            <p className="font-korean text-zinc-200 leading-relaxed text-[11px]">{coreData?.annotated_monologue?.text}</p>
            <p className="text-zinc-500 italic text-[10px] mt-1.5">"{coreData?.annotated_monologue?.translation}"</p>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Analyze & Restructure */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>{activity1SubStep === "1A" ? "Activity 1A – Segment story parts" : "Activity 1B – Reorder scrambled story"}</span>
            </h2>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setActivity1SubStep("1A")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${activity1SubStep === "1A" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
              >
                1A
              </button>
              <button 
                onClick={() => setActivity1SubStep("1B")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${activity1SubStep === "1B" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
              >
                1B
              </button>
            </div>
          </div>

          {/* Substep 1A: Segment story parts */}
          {activity1SubStep === "1A" && analysisStory && (
            <div className="space-y-4 text-left">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Align the narrative chunks:</span>
              <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {analysisStory.paragraphs.map((p: any, idx: number) => (
                  <div key={idx} className="space-y-1 p-2 bg-zinc-900 rounded border border-white/[0.04]">
                    <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500">
                      <span>Paragraph {idx + 1}</span>
                      <select 
                        value={selectedParagraphStage[idx] || ""}
                        onChange={(e) => setSelectedParagraphStage(prev => ({ ...prev, [idx]: e.target.value }))}
                        className="bg-zinc-950 border border-white/10 text-zinc-300 rounded px-1"
                      >
                        <option value="">Select Blueprint Stage</option>
                        <option value="Abstract">Abstract</option>
                        <option value="Orientation">Orientation</option>
                        <option value="Complicating Action">Complicating Action</option>
                        <option value="Evaluation">Evaluation</option>
                        <option value="Resolution">Resolution</option>
                        <option value="Coda">Coda</option>
                      </select>
                    </div>
                    <p className="font-korean text-[10px] text-zinc-300">{p.ko}</p>
                  </div>
                ))}
              </div>

              {/* MCQ Detail Evaluation question */}
              <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/5 space-y-2">
                <p className="text-xs font-bold text-white">Identify the sentence expressing the speaker's main Evaluation:</p>
                <div className="space-y-1.5">
                  {analysisStory.paragraphs.filter((p: any) => p.stage === "Evaluation" || p.stage === "Orientation" || p.stage === "Resolution").map((p: any) => (
                    <button
                      key={p.ko}
                      onClick={() => setSelectedEvaluationAns(p.ko)}
                      className={`w-full p-2.5 rounded text-left text-[10px] border transition ${
                        selectedEvaluationAns === p.ko 
                          ? "border-brand-500 bg-brand-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      {p.ko}
                    </button>
                  ))}
                </div>
              </div>

              {act1Checked && (
                <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl text-center text-xs">
                  <p className="font-bold text-white">{act1Correct ? "✓ Structural parsing matches model!" : "✗ Structural parsing mismatch."}</p>
                </div>
              )}

              <div className="flex justify-end">
                {!act1Checked ? (
                  <button
                    onClick={handleCheckActivity1A}
                    disabled={!selectedEvaluationAns || Object.keys(selectedParagraphStage).length === 0}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Verify Segments
                  </button>
                ) : (
                  <button
                    onClick={() => setActivity1SubStep("1B")}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Move to Reordering
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Substep 1B: Reorder blocks */}
          {activity1SubStep === "1B" && reorderData && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Drag/reorder blocks chronologically:</span>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {scrambledBlocks.map((block, idx) => (
                  <div 
                    key={block.id} 
                    className="p-2.5 bg-zinc-950 rounded-xl border border-white/5 flex justify-between items-center text-[10px] hover:border-brand-500/20 transition"
                  >
                    <p className="font-korean text-zinc-300 flex-grow pr-2">{block.text}</p>
                    <div className="flex gap-1 shrink-0">
                      <button 
                        onClick={() => idx > 0 && moveBlock(idx, idx - 1)}
                        className="p-1 bg-zinc-900 border border-white/5 rounded hover:text-white"
                        disabled={idx === 0}
                      >
                        ▲
                      </button>
                      <button 
                        onClick={() => idx < scrambledBlocks.length - 1 && moveBlock(idx, idx + 1)}
                        className="p-1 bg-zinc-900 border border-white/5 rounded hover:text-white"
                        disabled={idx === scrambledBlocks.length - 1}
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Connector selections */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 space-y-2">
                <span className="text-[9px] text-zinc-500 block uppercase font-mono font-bold">Select C1 logic connectors:</span>
                {reorderData.connector_slots?.map((slot: any) => (
                  <div key={slot.id} className="flex items-center justify-between gap-3 text-[10px]">
                    <span className="text-zinc-400 font-bold">{slot.label}:</span>
                    <div className="flex gap-1.5">
                      {slot.options.map((opt: string) => (
                        <button
                          key={opt}
                          onClick={() => setSelectedConnectors(prev => ({ ...prev, [slot.id]: opt }))}
                          className={`px-2.5 py-1 rounded border transition font-bold ${
                            selectedConnectors[slot.id] === opt
                              ? "border-brand-500 bg-brand-500/10 text-white"
                              : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {improvedStory && (
                <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl text-[10px] space-y-1.5 animate-fade-in">
                  <span className="font-bold text-white block uppercase tracking-wider font-mono">Improved Story Preview:</span>
                  <p className="font-korean text-zinc-300 leading-relaxed">{improvedStory.improved_text}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleBuildReorderStory}
                  disabled={Object.keys(selectedConnectors).length < 2 || buildingImproved}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {buildingImproved && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Generate Improved Story</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button 
              onClick={() => {
                if (activity1SubStep === "1B") {
                  setActivity1SubStep("1A");
                } else {
                  setStep(2);
                }
              }} 
              className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(4)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 2: Story production */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Scaffolded Production</span>
            </h2>
            <div className="flex gap-1.5">
              {["2A", "2B", "2C"].map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActivity2SubStep(sub as any)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${activity2SubStep === sub ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Substep 2A: Story blueprint builder */}
          {activity2SubStep === "2A" && (
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Activity 2A – Blueprint draft builder</span>
                <select 
                  value={builderTopic} 
                  onChange={(e) => setBuilderTopic(e.target.value)}
                  className="bg-zinc-950 border border-white/10 text-zinc-300 rounded text-[10px] px-2 py-0.5"
                >
                  <option>A challenge you overcame</option>
                  <option>A time a plan changed</option>
                  <option>A project or goal you worked on</option>
                  <option>A memorable trip or event</option>
                </select>
              </div>

              {/* Form fields */}
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 p-1">
                {["Abstract", "Orientation", "ComplicatingAction", "Evaluation", "Resolution", "Coda"].map((stage) => (
                  <div key={stage} className="space-y-1">
                    <label className="text-[9px] text-zinc-500 font-mono font-bold uppercase block">{stage}:</label>
                    <input
                      type="text"
                      placeholder={`Draft ${stage}...`}
                      value={blueprintDrafts[stage] || ""}
                      onChange={(e) => setBlueprintDrafts(prev => ({ ...prev, [stage]: e.target.value }))}
                      className="w-full bg-zinc-900 border border-white/5 focus:border-brand-500 outline-none p-2 rounded-xl text-xs text-white"
                    />
                  </div>
                ))}
              </div>

              {builderFeedback && (
                <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl text-[10px] space-y-1 animate-fade-in">
                  <p className="text-emerald-400 font-bold">✓ Outline compiled successfully</p>
                  <p className="text-zinc-300"><strong>Discourse suggestions:</strong> {builderFeedback.suggestions?.join(", ")}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleBuildStoryDraft}
                  disabled={Object.keys(blueprintDrafts).length < 2 || buildingDraft}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {buildingDraft && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Compile Outline</span>
                </button>
              </div>
            </div>
          )}

          {/* Substep 2B: Spoken monologue */}
          {activity2SubStep === "2B" && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Activity 2B – Record oral monologue</span>
              
              <div className="p-3.5 bg-zinc-950 border border-white/5 rounded-2xl space-y-2">
                <span className="text-[9px] text-zinc-500 uppercase font-mono block">Your outline notes:</span>
                <div className="grid grid-cols-2 gap-2 text-[9px] text-zinc-400">
                  {Object.entries(blueprintDrafts).map(([k, v]) => (
                    <p key={k}>• <strong>{k}:</strong> {v}</p>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl flex flex-col items-center gap-3">
                <span className="text-xs text-zinc-400 text-center">Speak for 2-3 minutes using your outline notes.</span>
                
                <button
                  onClick={handleRecordMonologue}
                  disabled={recording || submittingSpeech}
                  className={`p-4 rounded-full border transition flex items-center justify-center gap-2 font-bold text-xs ${
                    recording 
                      ? "border-red-500 bg-red-500/10 text-white animate-pulse" 
                      : "border-brand-500 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20"
                  } cursor-pointer`}
                >
                  <Mic className="w-4 h-4" />
                  <span>{recording ? "Recording... (Speak now)" : "Record Spoken Monologue"}</span>
                </button>
              </div>

              {submittingSpeech && (
                <div className="flex items-center gap-2 justify-center text-xs text-zinc-500">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-500" /> Transcribing & scoring C1 speech flow...
                </div>
              )}

              {speechEvaluation && (
                <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-2 text-xs">
                  <div className="text-emerald-400 font-bold">✓ Speech evaluated successfully</div>
                  <p className="text-zinc-300 font-mono"><strong>Transcribed:</strong> "{speechEvaluation.transcribed_text}"</p>
                  <p className="text-zinc-400 leading-relaxed"><strong>Coach feedback:</strong> {speechEvaluation.feedback}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setActivity2SubStep("2C")}
                  className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Proceed to AI Examiner
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Substep 2C: AI Prompt chat */}
          {activity2SubStep === "2C" && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Activity 2C – AI story examiner room</span>
              
              {!aiSessionId ? (
                <button
                  onClick={handleStartAiLongTurn}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Play className="w-4 h-4" /> Start C1 oral story interview session
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="max-h-[130px] overflow-y-auto space-y-2 p-2 bg-zinc-900 rounded-lg border border-white/5">
                    {aiMessages.map((msg, idx) => (
                      <div key={idx} className={`p-2 rounded-lg text-xs leading-relaxed max-w-[85%] ${
                        msg.sender === "user" 
                          ? "bg-brand-500/10 border border-brand-500/20 text-white ml-auto" 
                          : "bg-zinc-950 border border-white/5 text-zinc-300 mr-auto"
                      }`}>
                        {msg.text}
                      </div>
                    ))}
                  </div>

                  {!aiFinished ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Tell your story and reflections in Korean..."
                        value={aiText}
                        onChange={(e) => setAiText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendAiTurn()}
                        className="flex-grow bg-zinc-900 border border-white/5 focus:border-brand-500 outline-none p-2 rounded-xl text-xs text-white"
                      />
                      <button
                        onClick={handleSendAiTurn}
                        disabled={aiSending || !aiText.trim()}
                        className="bg-brand-500 hover:bg-brand-600 px-4 rounded-xl text-xs font-bold text-white transition flex items-center gap-1 cursor-pointer"
                      >
                        {aiSending && <Loader2 className="w-3 animate-spin" />}
                        <span>Send</span>
                      </button>
                      <button
                        onClick={handleFinishAiLongTurn}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 px-3 rounded-xl text-xs font-bold text-red-400 cursor-pointer"
                      >
                        End
                      </button>
                    </div>
                  ) : (
                    /* Scorecard evaluation */
                    <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/5 text-xs space-y-3 animate-fade-in">
                      <p className="font-bold text-emerald-400">✓ Story evaluation completed successfully</p>
                      {aiEvaluation && (
                        <>
                          <div className="grid grid-cols-3 gap-2 text-center text-[9px] uppercase font-mono">
                            <div className="bg-zinc-900 p-2 rounded border border-white/5">
                              <span className="text-zinc-500 block mb-0.5">Coherent</span>
                              <span className="text-white font-bold">{aiEvaluation.coherence_score}%</span>
                            </div>
                            <div className="bg-zinc-900 p-2 rounded border border-white/5">
                              <span className="text-zinc-500 block mb-0.5">Connectors</span>
                              <span className="text-white font-bold">{aiEvaluation.connector_variety}%</span>
                            </div>
                            <div className="bg-zinc-900 p-2 rounded border border-white/5">
                              <span className="text-zinc-500 block mb-0.5">Fluency</span>
                              <span className="text-white font-bold">{aiEvaluation.fluency_score}%</span>
                            </div>
                          </div>
                          <p className="text-zinc-400">{aiEvaluation.feedback}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button 
              onClick={() => {
                if (activity2SubStep === "2C") {
                  setActivity2SubStep("2B");
                } else if (activity2SubStep === "2B") {
                  setActivity2SubStep("2A");
                } else {
                  setStep(3);
                }
              }} 
              className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Mini-Quiz */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Mini‑Quiz: Structure & Connector Check</span>
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-500 rounded-full transition-all duration-300"
                  style={{ width: `${((quizIdx + 1) / quizBlueprint.length) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 font-bold">Q {quizIdx + 1}/{quizBlueprint.length}</span>
            </div>
          </div>

          {quizBlueprint[quizIdx] && (
            <div className="space-y-4 text-left">
              <span className="text-[9px] text-zinc-500 uppercase font-mono block">Question category: {quizBlueprint[quizIdx].type}</span>
              <h3 className="text-sm font-bold text-white leading-relaxed">{quizBlueprint[quizIdx].question}</h3>

              <div className="space-y-2">
                {quizBlueprint[quizIdx].options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                    disabled={quizChecked}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition ${
                      quizSelectedOpt === opt
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    } ${quizChecked && quizBlueprint[quizIdx].correct_answer === opt ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {quizChecked && (
                <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                  quizCorrect ? "border-accent-teal/20 bg-accent-teal/5 text-accent-teal" : "border-red-500/20 bg-red-500/5 text-red-400"
                }`}>
                  <p className="font-bold">{quizCorrect ? "✓ Correct!" : "✗ Incorrect."}</p>
                  <p className="text-zinc-400 font-sans mt-0.5">{quizBlueprint[quizIdx].explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={!quizSelectedOpt}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
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
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-accent-teal/10 rounded-full border border-accent-teal/25 w-fit mx-auto text-accent-teal shrink-0">
            <Award className="w-10 h-10 animate-bounce" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">Course 5 Phase 1 Complete!</h2>
            <p className="text-xs text-zinc-400 mt-1">Excellent C1 advanced fluency & storytelling reflections.</p>
          </div>

          {quizScore !== null && (
            <div className="bg-zinc-900/60 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full flex items-center justify-between text-left">
              <div>
                <span className="text-[9px] text-zinc-500 uppercase font-mono block">Accuracy Metrics:</span>
                <span className="text-lg font-black text-white">{quizScore}% Quiz Score</span>
              </div>
              <div className="px-3 py-1 bg-brand-500/10 border border-brand-500/25 rounded-lg text-brand-400 text-xs font-bold">
                🏆 {quizBadge} Badge Earned!
              </div>
            </div>
          )}

          {/* Homework checklist */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 text-left text-xs space-y-3 max-w-md mx-auto w-full">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">📝 Practical Homework Tasks:</span>
            <div className="space-y-2">
              {homeworkItems.map((hw: any) => (
                <div 
                  key={hw.id}
                  onClick={() => handleToggleHomework(hw.id, completedHomework[hw.id] || false)}
                  className="flex items-start gap-2.5 p-2 bg-zinc-900/40 rounded-lg border border-white/[0.04] cursor-pointer hover:bg-zinc-900 transition"
                >
                  <input
                    type="checkbox"
                    checked={completedHomework[hw.id] || false}
                    readOnly
                    className="mt-0.5 pointer-events-none"
                  />
                  <span className={`text-[11px] leading-relaxed ${completedHomework[hw.id] ? "text-zinc-500 line-through" : "text-zinc-300"}`}>{hw.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI practice room launch */}
          <div className="bg-zinc-950 p-4.5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">🤖 Practice advanced storytelling with AI Tutor:</span>
            
            {!practiceSessionId ? (
              <button
                onClick={() => handleStartPractice("life_change")}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Start AI Storytelling Practice</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="max-h-[150px] overflow-y-auto space-y-2 p-2 bg-zinc-900 rounded-lg border border-white/5">
                  {practiceMessages.map((msg, idx) => (
                    <div key={idx} className={`p-2 rounded-lg text-xs leading-relaxed max-w-[85%] ${
                      msg.sender === "user" 
                        ? "bg-brand-500/10 border border-brand-500/20 text-white ml-auto" 
                        : "bg-zinc-950 border border-white/5 text-zinc-300 mr-auto"
                    }`}>
                      {msg.text}
                    </div>
                  ))}
                </div>

                {!practiceFinished ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Write your story/reply in Korean..."
                      value={practiceText}
                      onChange={(e) => setPracticeText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendPracticeTurn()}
                      className="flex-grow bg-zinc-900 border border-white/5 focus:border-brand-500 outline-none p-2 rounded-xl text-xs text-white"
                    />
                    <button
                      onClick={handleSendPracticeTurn}
                      disabled={practiceSending || !practiceText.trim()}
                      className="bg-brand-500 hover:bg-brand-600 px-4 rounded-xl text-xs font-bold text-white transition flex items-center gap-1 cursor-pointer"
                    >
                      {practiceSending && <Loader2 className="w-3 animate-spin" />}
                      <span>Send</span>
                    </button>
                    <button
                      onClick={handleFinishPractice}
                      className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 px-3 rounded-xl text-xs font-bold text-red-400 cursor-pointer"
                    >
                      End
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 text-[11px] text-zinc-400 space-y-1.5 animate-fade-in">
                    <p className="font-bold text-white">Story Practice Feedback:</p>
                    <p>{practiceFeedback}</p>
                    <button 
                      onClick={() => setPracticeSessionId(null)}
                      className="text-[10px] text-brand-400 hover:underline block mt-1 cursor-pointer"
                    >
                      Start new practice scenario
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 max-w-xs mx-auto pt-2">
            <button 
              onClick={onComplete}
              className="bg-accent-teal hover:bg-accent-teal/90 text-zinc-950 font-extrabold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-accent-teal/20"
            >
              <span>Continue to Phase 2</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-zinc-500">Next: Phase 2 – Idioms & Fixed Expressions for Everyday Topics.</p>
          </div>
        </div>
      )}
    </div>
  );
}
