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
  Sliders,
  Play,
  RotateCcw,
  CheckSquare,
  Trophy,
  Star
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

interface Course5Phase6CapstoneWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course5Phase6CapstoneWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course5Phase6CapstoneWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 6;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1 Guided Scenario Walkthrough
  const [guidedScenarios, setGuidedScenarios] = useState<any>(null);
  const [selectedScenarioType, setSelectedScenarioType] = useState<string>("scenario_a");
  const [snapIdx, setSnapIdx] = useState(0);
  const [selectedTaskAns, setSelectedTaskAns] = useState<string | null>(null);
  const [selectedProbAns, setSelectedProbAns] = useState<string | null>(null);
  const [guidedChecked, setGuidedChecked] = useState(false);
  const [guidedCorrect, setGuidedCorrect] = useState<boolean | null>(null);
  const [learnerPlanningNotes, setLearnerPlanningNotes] = useState("");
  const [planningSuggestion, setPlanningSuggestion] = useState<string | null>(null);
  const [gettingPlanningSuggestion, setGettingPlanningSuggestion] = useState(false);

  // Activity 2 Live AI Capstone
  const [capstoneScenario, setCapstoneScenario] = useState<string>("scenario_a");
  const [capstoneSessionId, setCapstoneSessionId] = useState<string | null>(null);
  const [capstoneMessages, setCapstoneMessages] = useState<any[]>([]);
  const [capstoneText, setCapstoneText] = useState("");
  const [capstoneSending, setCapstoneSending] = useState(false);
  const [capstoneStage, setCapstoneStage] = useState(1); // 1 to 4 stages
  const [capstoneFinished, setCapstoneFinished] = useState(false);
  const [capstoneEvaluation, setCapstoneEvaluation] = useState<any>(null);
  const [finishingCapstone, setFinishingCapstone] = useState(false);
  const [recording, setRecording] = useState(false);

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

  // Exit Interview states
  const [exitSessionId, setExitSessionId] = useState<string | null>(null);
  const [exitMessages, setExitMessages] = useState<any[]>([]);
  const [exitText, setExitText] = useState("");
  const [exitSending, setExitSending] = useState(false);
  const [exitFinished, setExitFinished] = useState(false);
  const [exitFeedback, setExitFeedback] = useState<string | null>(null);

  // Load API Data per Step
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean4/6/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean4/6/core-data");
          setCoreData(res);
        } else if (step === 3 && !guidedScenarios) {
          const res = await apiJson("/practice/capstone/guided-scenarios");
          setGuidedScenarios(res || {});
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean4/phase-6/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean4/6/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading B1 capstone data:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1 Checks
  const handleCheckGuided = () => {
    const snapshots = guidedScenarios?.[selectedScenarioType] || [];
    const current = snapshots[snapIdx];
    if (!current) return;

    const correctTask = current.correct === selectedTaskAns;
    const correctProb = current.correct_problem === selectedProbAns;

    setGuidedChecked(true);
    setGuidedCorrect(correctTask && correctProb);
  };

  const handlePlanResponse = async () => {
    if (!learnerPlanningNotes.trim()) return;
    setGettingPlanningSuggestion(true);
    try {
      const res = await apiJson("/practice/capstone/plan-response", {
        method: "POST",
        body: JSON.stringify({
          snapshot_id: `${selectedScenarioType}_snap_${snapIdx}`,
          learner_notes: learnerPlanningNotes
        })
      });
      setPlanningSuggestion(res.suggestion);
    } catch (e) {
      console.error(e);
    } finally {
      setGettingPlanningSuggestion(false);
    }
  };

  const handleNextGuided = () => {
    setGuidedChecked(false);
    setGuidedCorrect(null);
    setSelectedTaskAns(null);
    setSelectedProbAns(null);
    setLearnerPlanningNotes("");
    setPlanningSuggestion(null);

    const snapshots = guidedScenarios?.[selectedScenarioType] || [];
    if (snapIdx < snapshots.length - 1) {
      setSnapIdx(snapIdx + 1);
    } else {
      setStep(4);
    }
  };

  // Activity 2: Live AI Capstone
  const handleStartCapstoneFull = async () => {
    setCapstoneMessages([]);
    setCapstoneEvaluation(null);
    setCapstoneFinished(false);
    setCapstoneStage(1);
    try {
      const res = await apiJson("/conversation/b1/capstone-full/start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: capstoneScenario })
      });
      setCapstoneSessionId(res.session_id);
      setCapstoneMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") {
        playAudio(res.opener);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendCapstoneTurn = async () => {
    if (!capstoneText.trim() || !capstoneSessionId) return;
    const textToSend = capstoneText;
    setCapstoneText("");
    setCapstoneMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setCapstoneSending(true);

    try {
      const res = await apiJson("/conversation/b1/capstone-full/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setCapstoneMessages((prev) => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") {
        playAudio(res.reply_ko);
      }
      // Increment stage after a couple turns
      if (capstoneStage < 4) {
        setCapstoneStage(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCapstoneSending(false);
    }
  };

  const handleFinishCapstone = async () => {
    if (!capstoneSessionId) return;
    setFinishingCapstone(true);
    try {
      const res = await apiJson("/conversation/b1/capstone-full/finish", { method: "POST" });
      setCapstoneEvaluation(res);
      setCapstoneFinished(true);
    } catch (err) {
      console.error(err);
    } finally {
      setFinishingCapstone(false);
    }
  };

  const handleRecordCapstoneVoice = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      if (capstoneScenario === "scenario_a") {
        setCapstoneText("네, 부산행 기차표 두 장 주세요.");
      } else if (capstoneScenario === "scenario_b") {
        setCapstoneText("내일 오후 세 시에 만날까요?");
      } else {
        setCapstoneText("주말에 한강 공원에 친구랑 가려고 해요.");
      }
    }, 2000);
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
      await apiJson("/quiz/korean4/phase-6/answer", {
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
        const res = await apiJson("/quiz/korean4/phase-6/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Real-Life B1 Communicator");
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
      await apiJson("/phases/korean4/6/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Exit Interview AI Conversation
  const handleStartExitInterview = async () => {
    setExitMessages([]);
    setExitFeedback(null);
    setExitFinished(false);
    try {
      const res = await apiJson("/conversation/b1/exit-interview/start", { method: "POST" });
      setExitSessionId(res.session_id);
      setExitMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") {
        playAudio(res.opener);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendExitTurn = async () => {
    if (!exitText.trim() || !exitSessionId) return;
    const textToSend = exitText;
    setExitText("");
    setExitMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setExitSending(true);

    try {
      const res = await apiJson("/conversation/b1/exit-interview/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setExitMessages((prev) => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") {
        playAudio(res.reply_ko);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExitSending(false);
    }
  };

  const handleFinishExit = async () => {
    if (!exitSessionId) return;
    try {
      const res = await apiJson("/conversation/b1/exit-interview/finish", { method: "POST" });
      setExitFeedback(res.feedback);
      setExitFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

    const outlineSteps = [
    { num: 1, label: "Screen 1 – Welcome / Phase Overview" },
    { num: 2, label: "Screen 2 – Scenario-based Foundations" },
    { num: 3, label: "Screen 3 – Activity 1: Read/Listen & Plan" },
    { num: 4, label: "Screen 4 – Activity 2: Live AI Integrated Scenario" },
    { num: 5, label: "Screen 5 – Mini-Quiz: Fluency Strategy Checks" },
    { num: 6, label: "Screen 6 – Homework & Exit reflections" }
  ];

  return (
    <div className="flex-grow flex flex-col justify-between">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Korean 4.6 – Real‑Life B1 Fluency (Capstone)"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Integrated Situational Competence</p>
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
          <div className="relative mx-auto w-fit">
            <div className="p-4 bg-yellow-500/10 rounded-full border border-yellow-500/25 text-yellow-400">
              <Trophy className="w-10 h-10" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-brand-500 rounded-full border-2 border-zinc-950">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight font-sans">Korean 4.6</h2>
          <h3 className="text-xl font-bold text-yellow-400 mt-1">Real‑Life B1 Fluency (Capstone)</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Travel, daily life, and opinions in one integrated journey."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Handle a chain of real‑life situations in Korean (travel, social, study/work)",
                "Combine stories, opinions, and problem‑solving in one conversation",
                "Show you can communicate independently on familiar topics at B1 level"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 40}–45 minutes</p>
          </div>

          {/* Chips */}
          <div className="space-y-2 max-w-md mx-auto w-full text-left">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">What you'll practise:</span>
            <div className="flex flex-wrap gap-1.5">
              {["Conversation fluency", "Travel/service tasks", "Social/work talk", "Politeness & register", "Listening & summary"].map(chip => (
                <span key={chip} className="px-2.5 py-1 bg-zinc-900 text-zinc-300 rounded-full border border-white/5 text-[10px] font-bold">{chip}</span>
              ))}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Conversation Mode</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("text")}
                className={`p-3 rounded-xl border text-xs font-bold transition ${
                  mode === "text" 
                    ? "border-yellow-500 bg-yellow-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                Text Input
              </button>
              <button
                onClick={() => setMode("voice")}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  mode === "voice" 
                    ? "border-yellow-500 bg-yellow-500/10 text-white" 
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
              className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/20"
            >
              <span>Start Capstone Phase</span>
              <ChevronRight className="w-4 h-4 text-zinc-950" />
            </button>
            
          </div>

          
        </div>
      )}

      {/* Screen 2: Concept Explanation */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-yellow-400" />
              <span>Integrated Real‑Life Scenarios</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/15 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">B1 “independent user” goal</p>
            <p className="italic">
              “At B1, you can handle most everyday situations, discuss familiar topics, express opinions, and describe experiences with simple reasons. This capstone lets you try that in realistic Korean scenarios.”
            </p>
          </div>

          {/* Scenario Preview Carousel */}
          <div className="space-y-2 text-left text-xs">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Integrated Days Configs:</span>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              {coreData?.scenarios?.map((sc: any) => (
                <div key={sc.id} className="p-3 bg-zinc-900 border border-white/5 rounded-xl space-y-1.5 flex flex-col justify-between">
                  <div>
                    <span className="text-yellow-400 font-bold block mb-0.5">{sc.name}</span>
                    <ul className="list-disc list-inside space-y-0.5 text-zinc-400 text-[9px]">
                      {sc.goals.map((g: string) => (
                        <li key={g} className="truncate">{g}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Success markers */}
          <div className="bg-zinc-950 p-4.5 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-2">
            <span className="text-[9px] text-zinc-500 font-bold uppercase block font-mono">B1 Success Criteria Checkpoints:</span>
            <p><strong>Fluency:</strong> Keep the interaction going without long silence gaps.</p>
            <p><strong>Politeness:</strong> Adjust registers appropriately for friends vs service staff.</p>
            <p><strong>Content:</strong> Provide a clean narrative of what happened and express opinions with simple reasons.</p>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Guided Scenario Walkthrough */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span>Activity 1 – Guided Scenario Walkthrough</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {/* Scenario selector */}
          <div className="flex gap-2">
            {["scenario_a", "scenario_b", "scenario_c"].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedScenarioType(type);
                  setSnapIdx(0);
                  setGuidedChecked(false);
                  setGuidedCorrect(null);
                  setSelectedTaskAns(null);
                  setSelectedProbAns(null);
                  setLearnerPlanningNotes("");
                  setPlanningSuggestion(null);
                }}
                className={`flex-grow py-2 rounded-xl border text-xs font-bold uppercase transition ${
                  selectedScenarioType === type
                    ? "border-yellow-500 bg-yellow-500/10 text-white"
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                }`}
              >
                {type === "scenario_a" ? "Travel Day" : type === "scenario_b" ? "Campus Day" : "Social Day"}
              </button>
            ))}
          </div>

          {guidedScenarios?.[selectedScenarioType]?.[snapIdx] && (
            <div className="space-y-4 text-left">
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono block">Snapshot: {guidedScenarios[selectedScenarioType][snapIdx].title}</span>
                  <button 
                    onClick={() => playAudio(guidedScenarios[selectedScenarioType][snapIdx].dialogue[0].text)}
                    className="p-1 bg-yellow-500/10 text-yellow-400 text-[9px] font-bold rounded flex items-center gap-1 px-2 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" /> Listen snapshot
                  </button>
                </div>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {guidedScenarios[selectedScenarioType][snapIdx].dialogue.map((line: any, lIdx: number) => (
                    <p key={lIdx} className="text-xs font-korean">
                      <strong className="text-yellow-400">{line.speaker}:</strong> <span className="text-zinc-200">{line.text}</span>
                    </p>
                  ))}
                </div>
              </div>

              {/* Snapshot questions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 space-y-1.5">
                  <p className="text-[10px] text-zinc-400 font-bold">{guidedScenarios[selectedScenarioType][snapIdx].question}</p>
                  {guidedScenarios[selectedScenarioType][snapIdx].options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !guidedChecked && setSelectedTaskAns(opt)}
                      disabled={guidedChecked}
                      className={`w-full p-2 text-left rounded border text-[9px] font-bold transition ${
                        selectedTaskAns === opt
                          ? "border-yellow-500 bg-yellow-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 space-y-1.5">
                  <p className="text-[10px] text-zinc-400 font-bold">{guidedScenarios[selectedScenarioType][snapIdx].problem_question}</p>
                  {guidedScenarios[selectedScenarioType][snapIdx].problem_options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !guidedChecked && setSelectedProbAns(opt)}
                      disabled={guidedChecked}
                      className={`w-full p-2 text-left rounded border text-[9px] font-bold transition ${
                        selectedProbAns === opt
                          ? "border-yellow-500 bg-yellow-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {guidedChecked && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-center text-xs">
                  <p className="font-bold text-white">{guidedCorrect ? "✓ Gist correct!" : "✗ Gist mismatch."}</p>
                </div>
              )}

              {/* Planning form */}
              <div className="p-3.5 bg-zinc-950 rounded-2xl border border-white/5 space-y-3 text-xs">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Response planner:</span>
                <p className="text-zinc-400">How would you respond in Korean to continue the dialogue?</p>
                <textarea
                  rows={2}
                  value={learnerPlanningNotes}
                  onChange={(e) => setLearnerPlanningNotes(e.target.value)}
                  placeholder="Write draft sentence keywords..."
                  className="w-full bg-zinc-900 border border-white/5 outline-none focus:border-yellow-500 p-2.5 rounded-xl text-xs text-white resize-none"
                />

                {planningSuggestion && (
                  <div className="p-2.5 bg-yellow-500/5 rounded-xl border border-yellow-500/15 text-[10px] text-zinc-300">
                    <strong>Tutor B1 suggestion:</strong> "{planningSuggestion}"
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={handlePlanResponse}
                    disabled={!learnerPlanningNotes.trim() || gettingPlanningSuggestion}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-bold border border-white/5 flex items-center gap-1 cursor-pointer"
                  >
                    {gettingPlanningSuggestion && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Get B1 Suggestion</span>
                  </button>

                  {!guidedChecked ? (
                    <button
                      onClick={handleCheckGuided}
                      disabled={!selectedTaskAns || !selectedProbAns}
                      className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Verify Answers
                    </button>
                  ) : (
                    <button
                      onClick={handleNextGuided}
                      className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Continue
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 4: Live AI Integrated Scenario */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-yellow-400" />
              <span>Activity 2 – Live AI Scenario</span>
            </h2>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div 
                  key={s} 
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-bold ${
                    capstoneStage === s 
                      ? "bg-yellow-500 border-yellow-500 text-zinc-950 animate-pulse" 
                      : capstoneStage > s 
                        ? "bg-emerald-500 border-emerald-500 text-zinc-950" 
                        : "bg-zinc-950 border-white/5 text-zinc-500"
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {!capstoneSessionId ? (
            <div className="space-y-4 text-left">
              <p className="text-xs text-zinc-400 font-bold">Select Scenario Day Route to test drive your B1 Fluency:</p>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "scenario_a", name: "Travel & Lodge Day" },
                  { id: "scenario_b", name: "Campus & Meeting Day" },
                  { id: "scenario_c", name: "Weekend & Small Talk" }
                ].map(sc => (
                  <button
                    key={sc.id}
                    onClick={() => setCapstoneScenario(sc.id)}
                    className={`p-4 rounded-xl border text-center text-xs font-bold transition ${
                      capstoneScenario === sc.id
                        ? "border-yellow-500 bg-yellow-500/10 text-white"
                        : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                    }`}
                  >
                    {sc.name}
                  </button>
                ))}
              </div>
              <button
                onClick={handleStartCapstoneFull}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-yellow-500/20"
              >
                <Play className="w-4 h-4 text-zinc-950" /> Start Live Integrated Capstone Dialogue
              </button>
            </div>
          ) : (
            /* Dialogue Room */
            <div className="space-y-4 text-left">
              {/* Stages checklist visual indicator */}
              <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl grid grid-cols-4 gap-2 text-[8px] font-bold uppercase tracking-wider text-center">
                <span className={capstoneStage >= 1 ? "text-yellow-400" : "text-zinc-500"}>1. Task</span>
                <span className={capstoneStage >= 2 ? "text-yellow-400" : "text-zinc-500"}>2. Story</span>
                <span className={capstoneStage >= 3 ? "text-yellow-400" : "text-zinc-500"}>3. Opinion</span>
                <span className={capstoneStage >= 4 ? "text-yellow-400" : "text-zinc-500"}>4. Summary</span>
              </div>

              <div className="max-h-[160px] overflow-y-auto space-y-2 p-3 bg-zinc-900 rounded-xl border border-white/5">
                {capstoneMessages.map((msg, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl text-xs leading-relaxed max-w-[85%] ${
                    msg.sender === "user" 
                      ? "bg-yellow-500/10 border border-yellow-500/20 text-white ml-auto" 
                      : "bg-zinc-950 border border-white/5 text-zinc-300 mr-auto"
                  }`}>
                    {msg.text}
                  </div>
                ))}
              </div>

              {/* Scaffolding Hints */}
              <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" />
                  <span className="text-zinc-400">💡 Recommended B1 Connector hint: <strong>~(으)ㄹ까요</strong> / <strong>~기 때문에</strong></span>
                </div>
              </div>

              {!capstoneFinished ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleRecordCapstoneVoice}
                    disabled={recording || capstoneSending}
                    className={`p-3 rounded-xl border ${
                      recording ? "bg-red-500/20 border-red-500 text-white animate-pulse" : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white"
                    } transition cursor-pointer`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    placeholder="Speak or type your B1 Korean reply here..."
                    value={capstoneText}
                    onChange={(e) => setCapstoneText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendCapstoneTurn()}
                    className="flex-grow bg-zinc-900 border border-white/5 outline-none focus:border-yellow-500 p-2.5 rounded-xl text-xs text-white"
                  />
                  <button
                    onClick={handleSendCapstoneTurn}
                    disabled={capstoneSending || !capstoneText.trim()}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {capstoneSending && <Loader2 className="w-3 animate-spin" />}
                    <span>Send</span>
                  </button>
                  <button
                    onClick={handleFinishCapstone}
                    disabled={finishingCapstone}
                    className="bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/10 px-3 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {finishingCapstone && <Loader2 className="w-3 animate-spin" />}
                    <span>Finish</span>
                  </button>
                </div>
              ) : (
                /* Radar scorecard evaluation report dashboard */
                <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-4 animate-fade-in text-xs">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4.5 h-4.5" /> B1 Fluency Capstone Evaluated successfully
                  </div>

                  {capstoneEvaluation && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-5 gap-2 text-center text-[9px] uppercase font-mono">
                        <div className="bg-zinc-900 p-2 rounded border border-white/5">
                          <span className="text-zinc-500 block mb-1">Task</span>
                          <span className="text-white font-bold">{capstoneEvaluation.task_completion}%</span>
                        </div>
                        <div className="bg-zinc-900 p-2 rounded border border-white/5">
                          <span className="text-zinc-500 block mb-1">Interact</span>
                          <span className="text-white font-bold">{capstoneEvaluation.interaction_skills}%</span>
                        </div>
                        <div className="bg-zinc-900 p-2 rounded border border-white/5">
                          <span className="text-zinc-500 block mb-1">Register</span>
                          <span className="text-white font-bold">{capstoneEvaluation.politeness_register}%</span>
                        </div>
                        <div className="bg-zinc-900 p-2 rounded border border-white/5">
                          <span className="text-zinc-500 block mb-1">Fluency</span>
                          <span className="text-white font-bold">{capstoneEvaluation.content_fluency}%</span>
                        </div>
                        <div className="bg-zinc-900 p-2 rounded border border-white/5">
                          <span className="text-zinc-500 block mb-1">Coherent</span>
                          <span className="text-white font-bold">{capstoneEvaluation.coherence}%</span>
                        </div>
                      </div>

                      <p className="text-zinc-300 leading-relaxed font-sans mt-1 p-3 bg-zinc-900 rounded-xl border border-white/5">{capstoneEvaluation.feedback}</p>
                      
                      <button 
                        onClick={() => setCapstoneSessionId(null)}
                        className="text-[10px] text-yellow-400 hover:underline block mt-1 cursor-pointer"
                      >
                        Try another capstone route
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Screen 5: Mini-Quiz */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span>Mini‑Quiz: Strategy & Fluency Check</span>
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full transition-all duration-300"
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
                        ? "border-yellow-500 bg-yellow-500/10 text-white"
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
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
          <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/25 w-fit mx-auto text-yellow-400 shrink-0 animate-bounce">
            <Trophy className="w-10 h-10 animate-bounce" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">Course 4 Complete!</h2>
            <p className="text-xs text-zinc-400 mt-1">You are now an Independent B1 User of Korean.</p>
          </div>

          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full flex items-center justify-between text-left">
            <div>
              <span className="text-[9px] text-zinc-500 uppercase font-mono block">Accuracy Metrics:</span>
              <span className="text-lg font-black text-white">{quizScore !== null ? `${quizScore}% Quiz Score` : "Completed"}</span>
            </div>
            <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/25 rounded-lg text-yellow-400 text-xs font-bold">
              🏆 {quizBadge || "B1 Communicator"} Badge Earned!
            </div>
          </div>

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

          {/* AI exit interview */}
          <div className="bg-zinc-950 p-4.5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">🤖 Course exit interview with AI Tutor:</span>
            
            {!exitSessionId ? (
              <button
                onClick={handleStartExitInterview}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-yellow-500/20"
              >
                <MessageCircle className="w-4 h-4 text-zinc-950" />
                <span>Start Exit Interview</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="max-h-[150px] overflow-y-auto space-y-2 p-2 bg-zinc-900 rounded-lg border border-white/5">
                  {exitMessages.map((msg, idx) => (
                    <div key={idx} className={`p-2 rounded-lg text-xs leading-relaxed max-w-[85%] ${
                      msg.sender === "user" 
                        ? "bg-yellow-500/10 border border-yellow-500/20 text-white ml-auto" 
                        : "bg-zinc-950 border border-white/5 text-zinc-300 mr-auto"
                    }`}>
                      {msg.text}
                    </div>
                  ))}
                </div>

                {!exitFinished ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Write your response in Korean/English..."
                      value={exitText}
                      onChange={(e) => setExitText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendExitTurn()}
                      className="flex-grow bg-zinc-900 border border-white/5 focus:border-yellow-500 outline-none p-2 rounded-xl text-xs text-white"
                    />
                    <button
                      onClick={handleSendExitTurn}
                      disabled={exitSending || !exitText.trim()}
                      className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      {exitSending && <Loader2 className="w-3 animate-spin" />}
                      <span>Send</span>
                    </button>
                    <button
                      onClick={handleFinishExit}
                      className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 px-3 rounded-xl text-xs font-bold text-red-400 cursor-pointer"
                    >
                      End
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 text-[11px] text-zinc-400 space-y-1.5 animate-fade-in">
                    <p className="font-bold text-white">Exit Interview Feedback:</p>
                    <p>{exitFeedback}</p>
                    <button 
                      onClick={() => setExitSessionId(null)}
                      className="text-[10px] text-yellow-400 hover:underline block mt-1 cursor-pointer"
                    >
                      Start exit reflection again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 max-w-xs mx-auto pt-2">
            <button 
              onClick={onComplete}
              className="bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 hover:from-yellow-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-yellow-500/20 cursor-pointer w-full max-w-xs animate-pulse"
            >
              <span>Graduate Course 4</span>
              <ChevronRight className="w-4 h-4 text-zinc-950" />
            </button>
            <p className="text-[10px] text-zinc-500">Congratulations! Move next to Korean 5 (B1→B2) or review Course 4.</p>
          </div>
        </div>
      )}
    </div>
  );
}
