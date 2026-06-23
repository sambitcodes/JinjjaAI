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
  MessageSquare,
  ArrowRight,
  HelpCircle,
  Activity,
  MessageCircle,
  Timer,
  Navigation,
  Coffee,
  Home,
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

interface Course5Phase2TravelWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course5Phase2TravelWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course5Phase2TravelWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 8;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Concept Explanation Filter
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Micro-check C1
  const [c1Selected, setC1Selected] = useState<string | null>(null);
  const [c1Checked, setC1Checked] = useState(false);
  const [c1Correct, setC1Correct] = useState<boolean | null>(null);

  // Micro-check C2
  const [c2Selected, setC2Selected] = useState<string | null>(null);
  const [c2Checked, setC2Checked] = useState(false);
  const [c2Correct, setC2Correct] = useState<boolean | null>(null);

  // Activity 1 states (Service dialogues comprehension)
  const [dialogueItems, setDialogueItems] = useState<any[]>([]);
  const [dialIdx, setDialIdx] = useState(0);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedKeyInfo, setSelectedKeyInfo] = useState<string | null>(null);
  const [act1Checked, setAct1Checked] = useState(false);
  const [act1Correct, setAct1Correct] = useState<boolean | null>(null);

  // Activity 2 states (Single transactional roleplay)
  const [roleplaySessionId, setRoleplaySessionId] = useState<string | null>(null);
  const [roleplayScenario, setRoleplayScenario] = useState<string>("hotel_checkin");
  const [roleplayMessages, setRoleplayMessages] = useState<any[]>([]);
  const [roleplayText, setRoleplayText] = useState("");
  const [roleplaySending, setRoleplaySending] = useState(false);
  const [roleplayFinished, setRoleplayFinished] = useState(false);
  const [roleplayFeedback, setRoleplayFeedback] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  // Quiz states (Activity 3)
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);
  const [quizBadge, setQuizBadge] = useState<string | null>(null);

  // Activity 4 states (Multi-step travel day simulation)
  const [travelDaySessionId, setTravelDaySessionId] = useState<string | null>(null);
  const [travelDayMessages, setTravelDayMessages] = useState<any[]>([]);
  const [travelDayText, setTravelDayText] = useState("");
  const [travelDaySending, setTravelDaySending] = useState(false);
  const [travelDayFinished, setTravelDayFinished] = useState(false);
  const [travelDayFeedback, setTravelDayFeedback] = useState<string | null>(null);

  // Homework completion states (Step 8)
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Persist progress to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c5p2_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 8) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c5p2_step", String(step));
  }, [step]);

  // Load API Data per Step
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean4/2/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean4/2/core-data");
          setCoreData(res);
        } else if (step === 4 && dialogueItems.length === 0) {
          const res = await apiJson("/practice/travel/dialogues");
          setDialogueItems(res.dialogues || []);
        } else if (step === 6 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean4/phase-2/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 8 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean4/2/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading B1 travel data:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  const handleC1Check = () => {
    if (!c1Selected) return;
    const isCorrect = c1Selected !== "hardest"; // qualitative check helper
    setC1Checked(true);
    setC1Correct(isCorrect);
    playSFX("correct");
  };

  const handleC2Check = () => {
    if (!c2Selected) return;
    const isCorrect = c2Selected === "A";
    setC2Checked(true);
    setC2Correct(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  // Activity 1 Check
  const handleCheckActivity1 = () => {
    const current = dialogueItems[dialIdx];
    if (!current) return;

    const correctWhere = selectedContext === current.questions.where;
    const correctTask = selectedTask === current.questions.task;
    const correctInfo = selectedKeyInfo === current.questions.key_info;
    const isCorrect = correctWhere && correctTask && correctInfo;

    setAct1Checked(true);
    setAct1Correct(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  const handleNextActivity1 = () => {
    setAct1Checked(false);
    setAct1Correct(null);
    setSelectedContext(null);
    setSelectedTask(null);
    setSelectedKeyInfo(null);

    if (dialIdx < dialogueItems.length - 1) {
      setDialIdx(dialIdx + 1);
    } else {
      setStep(5); // Go to Activity 2 (roleplay)
    }
  };

  // Activity 2: Single roleplay
  const handleStartRoleplay = async () => {
    setRoleplayMessages([]);
    setRoleplayFeedback(null);
    setRoleplayFinished(false);
    try {
      const res = await apiJson("/conversation/b1/travel-roleplay/start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: roleplayScenario })
      });
      setRoleplaySessionId(res.session_id);
      setRoleplayMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") {
        playAudio(res.opener);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendRoleplayTurn = async () => {
    if (!roleplayText.trim() || !roleplaySessionId) return;
    const textToSend = roleplayText;
    setRoleplayText("");
    setRoleplayMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setRoleplaySending(true);

    try {
      const res = await apiJson("/conversation/b1/travel-roleplay/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setRoleplayMessages((prev) => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") {
        playAudio(res.reply_ko);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRoleplaySending(false);
    }
  };

  const handleFinishRoleplay = async () => {
    if (!roleplaySessionId) return;
    try {
      const res = await apiJson("/conversation/b1/travel-roleplay/finish", { method: "POST" });
      setRoleplayFeedback(res.feedback);
      setRoleplayFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartVoiceRecording = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      if (roleplayScenario === "buy_ticket") {
        setRoleplayText("부산행 KTX 표 한 장 주세요.");
      } else {
        setRoleplayText("안녕하세요. 예약한 김민수입니다.");
      }
    }, 2000);
  };

  // Activity 3: Quiz check
  const handleCheckQuiz = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelectedOpt) return;

    const isCorrect = quizSelectedOpt === current.correct_answer;
    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
    if (!isCorrect) {
      setQuizMistakes((prev) => [...prev, current.id]);
    }

    try {
      await apiJson("/quiz/korean4/phase-2/answer", {
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
        const res = await apiJson("/quiz/korean4/phase-2/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Travel Master B1");
        setStep(7); // Proceed to Activity 4: Multi-step travel simulation
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  // Activity 4: Multi-step travel simulation
  const handleStartTravelDay = async () => {
    setTravelDayMessages([]);
    setTravelDayFeedback(null);
    setTravelDayFinished(false);
    try {
      const res = await apiJson("/conversation/b1/travel-day/start", { method: "POST" });
      setTravelDaySessionId(res.session_id);
      setTravelDayMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") {
        playAudio(res.opener);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTravelDayTurn = async () => {
    if (!travelDayText.trim() || !travelDaySessionId) return;
    const textToSend = travelDayText;
    setTravelDayText("");
    setTravelDayMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setTravelDaySending(true);

    try {
      const res = await apiJson("/conversation/b1/travel-day/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setTravelDayMessages((prev) => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") {
        playAudio(res.reply_ko);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTravelDaySending(false);
    }
  };

  const handleFinishTravelDay = async () => {
    if (!travelDaySessionId) return;
    try {
      const res = await apiJson("/conversation/b1/travel-day/finish", { method: "POST" });
      setTravelDayFeedback(res.feedback);
      setTravelDayFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework((prev) => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/phases/korean4/2/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "Concept 1: Goals & Tasks" },
    { num: 3, label: "Concept 2: Phrase Walkthrough" },
    { num: 4, label: "Activity 1: Dialogue Extraction" },
    { num: 5, label: "Activity 2: Single Transaction" },
    { num: 6, label: "Activity 3: Travel Strategy Quiz" },
    { num: 7, label: "Activity 4: Travel Day Chain" },
    { num: 8, label: "Phase Graduation" }
  ];

  return (
    <div className="flex-grow flex flex-col justify-between min-h-[75vh] text-zinc-100 font-sans">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <Navigation className="w-6 h-6 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Korean 4.2 – Travel & Errands"}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md uppercase tracking-wider">B1 Survival</span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium">Course 5 &bull; Phase 2</p>
          </div>
        </div>
        
        {/* Active progress bar */}
        <div className="flex items-center space-x-4">
          <div className="w-40 h-3 bg-zinc-950 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-full transition-all duration-500" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 font-bold">{Math.round((step / totalSteps) * 100)}%</span>
          <button 
            id="toggle-outline-btn"
            onClick={() => setShowOutline(!showOutline)}
            className="text-[10px] bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer uppercase tracking-wider font-extrabold"
          >
            {showOutline ? "Hide Outline" : "View Outline"}
          </button>
        </div>
      </header>

      {showOutline && (
        <div className="mb-6 p-5 bg-zinc-950/80 rounded-3xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 font-mono">Curriculum Roadmap</span>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {outlineSteps.map(s => (
              <button
                key={s.num}
                id={`outline-step-${s.num}`}
                onClick={() => {
                  setStep(s.num);
                  setShowOutline(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition ${step === s.num
                    ? "border-amber-500 bg-amber-500/10 text-white"
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
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/25 w-fit mx-auto text-amber-400 shrink-0">
            <Navigation className="w-10 h-10 animate-bounce shrink-0" />
          </div>
          
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Travel &amp; Errands</h2>
            <h3 className="text-xl font-extrabold text-amber-400 mt-2">Tickets, Rooms, Food, Help</h3>
          </div>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Handle basic situations in transport, shops, and hotels."}
          </p>

          <div className="bg-zinc-950/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Handle core service situations when travelling: buy tickets, book rooms, order food, and ask for information",
                "Understand short transactional dialogues and identify key details",
                "Perform customer role-plays responding to clerk questions",
                "Complete a full travel-day chain linking transport, rooms, food, and inquiries"
              ]).map((g: string, idx: number) => (
                <li key={idx} className="text-zinc-300">{g}</li>
              ))}
            </ul>
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs border-t border-white/5 mt-4">
              <p><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 35} minutes</p>
              <p><strong>📋 Level:</strong> Intermediate B1 (Korean 4.2)</p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-xs mx-auto w-full space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Conversation Mode</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("text")}
                className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  mode === "text" 
                    ? "border-amber-500 bg-amber-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                Text input
              </button>
              <button
                onClick={() => setMode("voice")}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === "voice" 
                    ? "border-amber-500 bg-amber-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice input</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-4">
            <button 
              id="start-phase-btn"
              onClick={() => setStep(2)}
              className="bg-amber-600 hover:bg-amber-500 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-amber-600/20"
            >
              <span>Start Phase 2</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Screen 2: Concept 1 - Travel Goals & Main Tasks */}
      {step === 2 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-400" />
              <span>Concept Screen 1: Travel &amp; Errands Goals</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 2 of {totalSteps}</span>
          </div>

          {/* Goal Callout */}
          <div className="bg-amber-950/30 p-5 rounded-2xl border border-amber-500/20 text-sm leading-relaxed text-zinc-300 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white uppercase tracking-wider text-xs">Official B1 Travel Goal:</span>
            </div>
            <p className="italic text-zinc-200">
              "Handle core service situations when travelling: buying tickets, booking/checking into rooms, ordering food, and asking for or clarifying information."
            </p>
          </div>

          {/* Core Tasks Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl w-fit text-amber-400 mb-2">
                <Navigation className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-xs mb-1">1. Buying Tickets</h4>
              <p className="text-[10px] text-zinc-400 leading-normal">Train, bus, subway ticket kiosks and reservation counters.</p>
            </div>
            <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5">
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl w-fit text-yellow-400 mb-2">
                <Home className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-xs mb-1">2. Checking Rooms</h4>
              <p className="text-[10px] text-zinc-400 leading-normal">Guesthouse or hotel front reception checks, name and nights info.</p>
            </div>
            <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5">
              <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-xl w-fit text-orange-400 mb-2">
                <Coffee className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-xs mb-1">3. Ordering Food</h4>
              <p className="text-[10px] text-zinc-400 leading-normal">Restaurant menus, coffee/meal orders, and billing requests.</p>
            </div>
            <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl w-fit text-indigo-400 mb-2">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-xs mb-1">4. Clarifying Info</h4>
              <p className="text-[10px] text-zinc-400 leading-normal">Asking about times, seat numbers, gate details, and departures.</p>
            </div>
          </div>

          {/* Micro-question C1 */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl mx-auto w-full font-sans">
            <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest block font-mono">Micro Checkpoint C1</span>
            <p className="text-sm font-bold text-white text-left">Which of these travel scenarios do you feel most confident with already, and which do you find hardest?</p>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "confident", label: "Confident with buying/ordering" },
                { id: "hardest", label: "Find hotel/help room check hardest" }
              ].map((opt) => {
                let borderStyle = "border-white/5 bg-zinc-900/60 text-zinc-300";
                if (c1Selected === opt.id) {
                  borderStyle = "border-amber-500 bg-amber-500/10 text-white";
                }
                if (c1Checked) {
                  borderStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                }
                return (
                  <button
                    key={opt.id}
                    id={`c1-opt-${opt.id}`}
                    disabled={c1Checked}
                    onClick={() => setC1Selected(opt.id)}
                    className={`py-3.5 px-4 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${borderStyle}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {c1Checked && (
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl text-xs text-left animate-fade-in text-green-300">
                <p className="font-extrabold mb-1">✓ Choice Recorded!</p>
                <p>Recognizing your current comfort areas is a great way to prioritize practice. We will practice both in roleplays shortly!</p>
              </div>
            )}

            {!c1Checked && (
              <button
                id="check-c1-btn"
                onClick={handleC1Check}
                disabled={!c1Selected}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition cursor-pointer"
              >
                Submit Response
              </button>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Next Screen <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Concept 2 - Step-wise Travel Phrases */}
      {step === 3 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-400" />
              <span>Concept Screen 2: Travel Phrase Bank</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 3 of {totalSteps}</span>
          </div>

          <p className="text-xs text-zinc-400 max-w-xl mx-auto">
            Explore intermediate travel expressions. Use filters to review phrases by location or scenario.
          </p>

          <div className="space-y-4 text-left">
            <div className="flex gap-2 justify-center flex-wrap">
              {["all", "transport", "hotel", "shop", "help"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition capitalize cursor-pointer ${
                    selectedFilter === cat 
                      ? "border-amber-500 bg-amber-500/10 text-white" 
                      : "border-white/5 bg-zinc-950 text-zinc-450 hover:border-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[250px] overflow-y-auto custom-scrollbar p-1 animate-fade-in">
              {coreData?.functional_phrases
                ?.filter((m: any) => selectedFilter === "all" || m.context === selectedFilter)
                ?.map((m: any, idx: number) => (
                  <div key={idx} className="p-4 bg-zinc-950 rounded-xl border border-white/5 flex justify-between items-center text-left hover:border-amber-500/25 transition duration-200">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-korean font-black text-white text-base leading-normal">{m.ko}</span>
                        <span className="text-[8px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1 py-0.5 rounded uppercase font-mono">{m.context}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-tight mt-1">{m.en}</p>
                    </div>
                    <button 
                      onClick={() => playAudio(m.ko)} 
                      className="p-2 bg-zinc-900 border border-white/5 hover:border-white/10 hover:text-white rounded-lg text-zinc-400 transition cursor-pointer shrink-0"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Concept Check MCQ C2 */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl mx-auto w-full text-left font-sans">
            <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest block font-mono">Micro Checkpoint C2</span>
            <p className="text-sm font-bold text-white">How do you say "Please give me one ticket to Busan" in Korean?</p>
            
            <div className="flex flex-col gap-2 font-sans">
              {[
                { id: "A", text: "부산행 표 한 장 주세요." },
                { id: "B", text: "방을 예약하고 싶어요." },
                { id: "C", text: "메뉴판 좀 보여 주세요." }
              ].map((opt) => {
                let borderStyle = "border-white/5 bg-zinc-900/60 text-zinc-300";
                if (c2Selected === opt.id) {
                  borderStyle = "border-amber-500 bg-amber-500/10 text-white";
                }
                if (c2Checked) {
                  if (opt.id === "A") {
                    borderStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                  } else if (c2Selected === opt.id) {
                    borderStyle = "border-red-500 bg-red-500/10 text-red-300 font-extrabold";
                  }
                }
                return (
                  <button
                    key={opt.id}
                    disabled={c2Checked}
                    onClick={() => setC2Selected(opt.id)}
                    className={`py-3 px-4 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${borderStyle}`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {c2Checked && (
              <div className={`p-4 rounded-xl text-xs border ${
                c2Correct ? "bg-green-500/5 border-green-500/20 text-green-300" : "bg-red-500/5 border-red-500/20 text-red-450"
              }`}>
                <p className="font-extrabold mb-1">{c2Correct ? "✓ Correct!" : "✗ Incorrect."}</p>
                <p>부산행 (bound for Busan) + 표 (ticket) + 한 장 (one sheet/counter) + 주세요 (please give).</p>
              </div>
            )}

            {!c2Checked && (
              <button
                onClick={handleC2Check}
                disabled={!c2Selected}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition cursor-pointer"
              >
                Submit Check
              </button>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(2)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 1 - Dialogue Comprehension */}
      {step === 4 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <span>Activity 1 – Service Dialogue Comprehension</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 4 of {totalSteps}</span>
          </div>

          {dialogueItems.length > 0 && dialogueItems[dialIdx] && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6 text-left max-w-3xl mx-auto w-full animate-fade-in">
              
              {/* Turn dialogue text */}
              <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-3 max-h-40 overflow-y-auto custom-scrollbar">
                <span className="text-[9px] text-amber-400 font-mono block">READ / LISTEN TO DIALOGUE:</span>
                {dialogueItems[dialIdx].turns.map((turn: any, idx: number) => (
                  <div key={idx} className="space-y-0.5 text-xs">
                    <p className="text-white font-korean"><strong className="text-amber-400">{turn.speaker}:</strong> {turn.ko}</p>
                    <p className="text-zinc-500">{turn.en}</p>
                  </div>
                ))}
              </div>

              {/* Comprehension Questions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Q1 Location */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-white">Q1: Where are they located?</span>
                  <div className="flex flex-col gap-1.5 font-sans">
                    {dialogueItems[dialIdx].questions.choices_where.map((whereOpt: string) => {
                      let btnStyle = "border-white/5 bg-zinc-900 text-zinc-300";
                      if (selectedContext === whereOpt) {
                        btnStyle = "border-amber-500 bg-amber-500/10 text-white";
                      }
                      if (act1Checked) {
                        if (whereOpt === dialogueItems[dialIdx].questions.where) {
                          btnStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                        } else if (selectedContext === whereOpt) {
                          btnStyle = "border-red-500 bg-red-500/10 text-red-300";
                        }
                      }
                      return (
                        <button
                          key={whereOpt}
                          disabled={act1Checked}
                          onClick={() => setSelectedContext(whereOpt)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-medium transition cursor-pointer ${btnStyle}`}
                        >
                          {whereOpt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q2 Primary Task */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-white">Q2: What is the primary task?</span>
                  <div className="flex flex-col gap-1.5 font-sans">
                    {dialogueItems[dialIdx].questions.choices_task.map((taskOpt: string) => {
                      let btnStyle = "border-white/5 bg-zinc-900 text-zinc-300";
                      if (selectedTask === taskOpt) {
                        btnStyle = "border-amber-500 bg-amber-500/10 text-white";
                      }
                      if (act1Checked) {
                        if (taskOpt === dialogueItems[dialIdx].questions.task) {
                          btnStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                        } else if (selectedTask === taskOpt) {
                          btnStyle = "border-red-500 bg-red-500/10 text-red-300";
                        }
                      }
                      return (
                        <button
                          key={taskOpt}
                          disabled={act1Checked}
                          onClick={() => setSelectedTask(taskOpt)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-medium transition cursor-pointer ${btnStyle}`}
                        >
                          {taskOpt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q3 Details check */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-white">Q3: Identify key detail details:</span>
                  <div className="flex flex-col gap-1.5 font-sans">
                    {dialogueItems[dialIdx].questions.choices_key_info.map((infoOpt: string) => {
                      let btnStyle = "border-white/5 bg-zinc-900 text-zinc-300";
                      if (selectedKeyInfo === infoOpt) {
                        btnStyle = "border-amber-500 bg-amber-500/10 text-white";
                      }
                      if (act1Checked) {
                        if (infoOpt === dialogueItems[dialIdx].questions.key_info) {
                          btnStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                        } else if (selectedKeyInfo === infoOpt) {
                          btnStyle = "border-red-500 bg-red-500/10 text-red-300";
                        }
                      }
                      return (
                        <button
                          key={infoOpt}
                          disabled={act1Checked}
                          onClick={() => setSelectedKeyInfo(infoOpt)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-medium transition cursor-pointer ${btnStyle}`}
                        >
                          {infoOpt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {act1Checked && (
                <div className={`p-4 rounded-xl text-xs text-left animate-fade-in border ${
                  act1Correct ? "bg-green-500/5 border-green-500/20 text-green-300" : "bg-red-500/5 border-red-500/20 text-red-400"
                }`}>
                  <p className="font-extrabold text-sm">{act1Correct ? "✓ Correct! Good comprehension." : "✗ Incorrect."}</p>
                  <p className="text-zinc-350 mt-1">Successfully parsed the service dialogue details.</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!act1Checked ? (
                  <button
                    onClick={handleCheckActivity1}
                    disabled={!selectedContext || !selectedTask || !selectedKeyInfo}
                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white px-6 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Answers
                  </button>
                ) : (
                  <button
                    onClick={handleNextActivity1}
                    className="bg-purple-600 text-white hover:bg-purple-500 px-5 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {dialIdx < dialogueItems.length - 1 ? "Next Dialogue" : "Continue to Transaction Role-Play"}
                  </button>
                )}
              </div>

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Role-Play <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Activity 2 - Customer Transaction Roleplay */}
      {step === 5 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-amber-400" />
              <span>Activity 2 – Transaction Role-Play Counter</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 5 of {totalSteps}</span>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto w-full text-left">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-amber-400">Perform Transactions with Clerk</span>
              <select
                value={roleplayScenario}
                onChange={(e) => {
                  setRoleplayScenario(e.target.value);
                  setRoleplaySessionId(null);
                }}
                disabled={!!roleplaySessionId}
                className="bg-zinc-900 border border-white/10 p-1.5 rounded-lg text-xs text-white"
              >
                <option value="hotel_checkin">Hotel Desk Check-in</option>
                <option value="buy_ticket">Train Station Tickets</option>
              </select>
            </div>

            {!roleplaySessionId ? (
              <div className="p-8 bg-zinc-950 border border-white/10 rounded-[2rem] text-center space-y-5 w-full">
                <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-full w-fit mx-auto text-amber-400">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed max-w-md mx-auto">
                  Start a stateful role-play session. You must state what you want (ticket or booking), reply to name/date queries, and complete transaction.
                </p>
                <button
                  onClick={handleStartRoleplay}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-black py-3 px-8 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-600/25 animate-pulse"
                >
                  Start Role-Play Session
                </button>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {/* Chat transcript window */}
                <div className="bg-zinc-950 rounded-2xl border border-white/10 p-4 h-60 overflow-y-auto space-y-3.5 custom-scrollbar">
                  {roleplayMessages.map((msg, idx) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
                        <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                          isUser 
                            ? "bg-amber-600 text-white rounded-tr-none" 
                            : "bg-zinc-900 text-zinc-200 rounded-tl-none border border-white/5"
                        }`}>
                          <p className={!isUser ? "font-korean font-semibold" : ""}>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {roleplaySending && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/5 flex gap-1.5 items-center">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span className="text-[10px] text-zinc-500">Clerk is typing...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scaffolding helper chips */}
                <div className="space-y-2">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block font-mono">Suggested Transaction Starter/Response phrases:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {["체크인하고 싶은데요.", "부산행 기차표 한 장 주세요.", "얼마예요?", "카드로 결제할게요.", "오늘 출발하는 표 있어요?"].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => setRoleplayText((prev) => prev + (prev ? " " : "") + chip)}
                        className="px-2.5 py-1 bg-zinc-900 border border-white/5 hover:border-amber-500/35 text-[10px] text-zinc-300 rounded-lg font-korean transition cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {!roleplayFeedback ? (
                  <div className="flex gap-2">
                    {mode === "voice" && (
                      <button 
                        onClick={handleStartVoiceRecording}
                        className={`p-3 rounded-xl border transition cursor-pointer ${recording ? "bg-red-500 text-white border-red-500 animate-pulse" : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white"}`}
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    )}
                    <input
                      type="text"
                      value={roleplayText}
                      onChange={(e) => setRoleplayText(e.target.value)}
                      placeholder="Order tickets/food or provide room details..."
                      onKeyDown={(e) => e.key === "Enter" && handleSendRoleplayTurn()}
                      className="flex-grow bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-korean"
                    />
                    <button
                      onClick={handleSendRoleplayTurn}
                      disabled={roleplaySending || !roleplayText.trim()}
                      className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white px-5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>Send</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleFinishRoleplay}
                      className="px-4 bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      End Service
                    </button>
                  </div>
                ) : (
                  <div className="p-5 bg-zinc-900 rounded-xl border border-amber-500/20 space-y-3 animate-fade-in">
                    <p className="font-extrabold text-white">Service Assessment Result:</p>
                    <p className="text-xs text-zinc-350 leading-relaxed bg-zinc-950 p-3.5 rounded-lg border border-white/5 italic">
                      {roleplayFeedback}
                    </p>
                    <button
                      onClick={() => setStep(6)}
                      className="w-full mt-2 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Proceed to Strategy Quiz
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(4)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(6)} className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 6: Activity 3 - Travel Strategy Quiz */}
      {step === 6 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-400" />
              <span>Mini-Quiz: Travel Strategy Check</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 6 of {totalSteps}</span>
          </div>

          {quizBlueprint.length > 0 && quizBlueprint[quizIdx] && (
            <div className="space-y-6 max-w-xl mx-auto w-full text-left animate-fade-in">
              <div className="flex justify-between text-[10px] text-zinc-450 font-mono">
                <span>Quiz Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span>Type: B1 Travel Strategy</span>
              </div>

              <h3 className="text-base md:text-lg font-black text-white text-center leading-relaxed whitespace-pre-line bg-zinc-950 p-5 rounded-2xl border border-white/5">
                {quizBlueprint[quizIdx].question}
              </h3>

              <div className="grid grid-cols-1 gap-2.5 max-w-md mx-auto w-full font-sans">
                {quizBlueprint[quizIdx].options?.map((opt: string) => {
                  let borderStyle = "border-white/5 bg-zinc-900 text-zinc-300 hover:bg-zinc-800";
                  if (quizSelectedOpt === opt) {
                    borderStyle = "border-amber-500 bg-amber-500/10 text-white";
                  }
                  if (quizChecked) {
                    if (opt === quizBlueprint[quizIdx].correct_answer) {
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
                  <p className="font-extrabold text-sm">{quizCorrect ? "✓ Correct!" : "✗ Incorrect."}</p>
                  <p className="text-zinc-300">{quizBlueprint[quizIdx].explanation}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
                <button id="prev-btn-6" onClick={() => setStep(5)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                {!quizChecked ? (
                  <button
                    id="submit-quiz-btn"
                    onClick={handleCheckQuiz}
                    disabled={!quizSelectedOpt}
                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
                    {finishingQuiz ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : (quizIdx < quizBlueprint.length - 1 ? "Next Question" : "See Capstone Results")}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 7: Activity 4 - Full Travel-Day Simulation */}
      {step === 7 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-amber-400" />
              <span>Activity 4 – Multi‑step "travel day" role‑play</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 7 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 text-left max-w-2xl mx-auto w-full font-sans">
            <div className="space-y-1">
              <span className="text-[9px] text-amber-400 font-mono uppercase tracking-widest block font-bold">Linked Travel Simulation</span>
              <p className="text-xs text-zinc-400 leading-normal">
                Simulate a complete travel chain: Buy tickets, check in at a guesthouse, order food, and handle inquiries.
              </p>
            </div>

            {!travelDaySessionId ? (
              <div className="flex justify-center pt-2">
                <button
                  id="start-travelday-btn"
                  onClick={handleStartTravelDay}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-black py-3 px-8 rounded-xl text-xs transition cursor-pointer"
                >
                  Start Travel Day Simulation
                </button>
              </div>
            ) : (
              <div className="space-y-3 w-full">
                <div className="bg-zinc-900 rounded-xl p-4 border border-white/5 h-44 overflow-y-auto space-y-2.5 custom-scrollbar">
                  {travelDayMessages.map((msg, idx) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
                        <div className={`max-w-[80%] rounded-xl p-2.5 text-xs leading-relaxed ${
                          isUser ? "bg-amber-600 text-white rounded-tr-none" : "bg-zinc-950 text-zinc-300 border border-white/5 rounded-tl-none"
                        }`}>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {travelDaySending && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 italic animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Clerk is updating context...</span>
                    </div>
                  )}
                </div>

                {!travelDayFinished ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={travelDayText}
                      onChange={(e) => setTravelDayText(e.target.value)}
                      placeholder="Say what you need (e.g. 부산행 표 한 장 주세요 or 체크인할게요)..."
                      onKeyDown={(e) => e.key === "Enter" && handleSendTravelDayTurn()}
                      className="flex-grow bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-korean"
                    />
                    <button
                      onClick={handleSendTravelDayTurn}
                      disabled={travelDaySending || !travelDayText.trim()}
                      className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-4 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Send
                    </button>
                    <button
                      onClick={handleFinishTravelDay}
                      className="bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-300 px-4 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      End Trip
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-900 rounded-xl border border-brand-500/10 text-xs text-zinc-400 animate-fade-in">
                    <p className="font-extrabold text-white mb-1">Feedback Summary:</p>
                    <p>{travelDayFeedback || "Completed travel day transactions!"}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(6)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(8)} className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Proceed to Graduation <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 8: Graduation & Completion */}
      {step === 8 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in max-w-3xl mx-auto">
          <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/25 w-fit mx-auto text-amber-400">
            <Award className="w-10 h-10 animate-bounce" />
          </div>
          
          <div>
            <h2 className="text-3xl font-black text-white font-sans">Korean 4.2 Travel Graduated! 🎓✈️</h2>
            <p className="text-zinc-400 text-sm mt-1.5 font-sans">Congratulations on completing Korean 4.2! Next: Phase 3 – Real‑World Social & Work/Study Conversations.</p>
          </div>

          {/* Homework list */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-left text-xs space-y-3 font-sans leading-relaxed">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block font-sans">Interactive Homework List:</span>
            <div className="space-y-2">
              {homeworkItems.map((item: any) => {
                const isChecked = !!completedHomework[item.id];
                return (
                  <label key={item.id} className="flex items-start gap-3 p-3 bg-zinc-900/45 rounded-lg border border-white/[0.03] cursor-pointer hover:bg-zinc-900 transition">
                    <input
                      type="checkbox"
                      id={`hw-checkbox-${item.id}`}
                      checked={isChecked}
                      onChange={() => handleToggleHomework(item.id, isChecked)}
                      className="mt-0.5 rounded border-white/10 text-amber-500 focus:ring-0 focus:ring-offset-0 bg-zinc-950"
                    />
                    <div className="text-zinc-300">
                      <span className="font-bold text-white block mb-0.5 font-sans">
                        {item.id === "hw_b1_trav_1" ? "Task 1: Custom Dialogue Scripts" : item.id === "hw_b1_trav_2" ? "Task 2: Dual Role Shadowing" : "Task 3: Resolve Travel Issue"}
                      </span>
                      <span className={isChecked ? "line-through text-zinc-500" : ""}>{item.text}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* completion path details */}
          <div className="p-5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-2xl border border-amber-500/20 text-center space-y-1">
            <div className="flex justify-center items-center gap-1 text-amber-400 font-extrabold text-sm uppercase">
              <Award className="w-5 h-5" />
              <span>Badge Earned: {quizBadge || "Travel Survivor B1"}</span>
            </div>
            <div className="flex justify-center gap-4 text-xs font-bold pt-1">
              <span className="text-amber-400">XP +150 Completion Bonus</span>
              <span className="text-zinc-650">|</span>
              <span className="text-yellow-400">Phase 2 Complete</span>
            </div>
          </div>

          <button
            id="finish-phase-btn"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 150, type: "correct" } }));
              }
              onComplete();
            }}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 text-white font-black py-4 px-10 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <span>Complete Phase 2 &amp; Continue</span>
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
