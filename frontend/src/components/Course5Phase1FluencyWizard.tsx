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

interface Course5Phase1FluencyWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course5Phase1FluencyWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course5Phase1FluencyWizardProps) {
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c5p1_step");
    const savedMax = localStorage.getItem("hangeulai_c5p1_max_step");
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
      localStorage.setItem("hangeulai_c5p1_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 12;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);
  
  // Concept Explanation Step Filters
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Concept checks states
  const [c1Selected, setC1Selected] = useState<string | null>(null);
  const [c1Checked, setC1Checked] = useState(false);
  const [c1Correct, setC1Correct] = useState<boolean | null>(null);

  const [c2Selected, setC2Selected] = useState<string | null>(null);
  const [c2Checked, setC2Checked] = useState(false);
  const [c2Correct, setC2Correct] = useState<boolean | null>(null);

  // Activity 1A states (Short vs flowing replies recognition)
  const [act1aItems, setAct1aItems] = useState<any[]>([]);
  const [act1aIdx, setAct1aIdx] = useState(0);
  const [act1aSelected, setAct1aSelected] = useState<string | null>(null);
  const [act1aChecked, setAct1aChecked] = useState(false);
  const [act1aCorrect, setAct1aCorrect] = useState<boolean | null>(null);

  // Activity 1B states (Move phrase classification)
  const [act1bMovePhrases, setAct1bMovePhrases] = useState<any[]>([]);
  const [act1bIdx, setAct1bIdx] = useState(0);
  const [act1bSelectedTag, setAct1bSelectedTag] = useState<string | null>(null);
  const [act1bChecked, setAct1bChecked] = useState(false);
  const [act1bCorrect, setAct1bCorrect] = useState<boolean | null>(null);

  // Activity 2 states (Build replying templates)
  const [templatesData, setTemplatesData] = useState<any>(null);
  const [activePartnerLineIdx, setActivePartnerLineIdx] = useState(0);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [selectedFollowup, setSelectedFollowup] = useState<string | null>(null);
  const [typedFollowup, setTypedFollowup] = useState("");
  const [useCustomFollowup, setUseCustomFollowup] = useState(false);
  const [builtReply, setBuiltReply] = useState<any>(null);
  const [buildingReply, setBuildingReply] = useState(false);

  // Activity 3 states (Timed quick-fire Turn-taking responses)
  const [quickfireItems, setQuickfireItems] = useState<any[]>([]);
  const [quickfireIdx, setQuickfireIdx] = useState(0);
  const [quickfireSelected, setQuickfireSelected] = useState<string | null>(null);
  const [quickfireChecked, setQuickfireChecked] = useState(false);
  const [quickfireCorrect, setQuickfireCorrect] = useState<boolean | null>(null);
  const [quickfireTimeLeft, setQuickfireTimeLeft] = useState(25);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Activity 4 states (3-minute timed chat drill)
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [sendingTurn, setSendingTurn] = useState(false);
  const [finishingChat, setFinishingChat] = useState(false);
  const [chatResult, setChatResult] = useState<any>(null);
  const [recording, setRecording] = useState(false);

  // Activity 5 states (Strategy quiz check)
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);
  const [quizBadge, setQuizBadge] = useState<string | null>(null);

  // Homework check states
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Homework Fluency open practice chat
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [practiceMessages, setPracticeMessages] = useState<any[]>([]);
  const [practiceText, setPracticeText] = useState("");
  const [practiceSending, setPracticeSending] = useState(false);
  const [practiceFinished, setPracticeFinished] = useState(false);
  const [practiceResult, setPracticeResult] = useState<any>(null);

  // Persist progress to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c5p1_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 12) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c5p1_step", String(step));
  }, [step]);

  // Load API Data per Step
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean4/1/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean4/1/core-data");
          setCoreData(res);
        } else if (step === 5 && act1aItems.length === 0) {
          const res = await apiJson("/practice/fluency/move-recognition");
          setAct1aItems(res.items || []);
          setAct1bMovePhrases(res.move_phrases || []);
        } else if (step === 7 && !templatesData) {
          const res = await apiJson("/practice/fluency/build-templates");
          setTemplatesData(res);
        } else if (step === 8 && quickfireItems.length === 0) {
          const resQ = await apiJson("/practice/fluency/quickfire");
          setQuickfireItems(resQ.items || []);
        } else if (step === 10 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean4/phase-1/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 12 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean4/1/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading B1 fluency data:", err);
      }
    };
    load();
  }, [step]);

  // Quick-fire timer loop
  useEffect(() => {
    if (step === 8 && !quickfireChecked) {
      setQuickfireTimeLeft(25);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setQuickfireTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleCheckQuickfire(true); // timed out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, quickfireIdx, quickfireChecked]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  const handleC1Check = () => {
    if (!c1Selected) return;
    const isCorrect = c1Selected === "flowing";
    setC1Checked(true);
    setC1Correct(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  const handleC2Check = () => {
    if (!c2Selected) return;
    const isCorrect = c2Selected === "A";
    setC2Checked(true);
    setC2Correct(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  const handleCheckAct1a = async () => {
    const current = act1aItems[act1aIdx];
    if (!current || !act1aSelected) return;

    const isCorrect = act1aSelected === "B";
    setAct1aChecked(true);
    setAct1aCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");

    try {
      await apiJson("/practice/fluency/move-recognition/answer", {
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

  const handleNextAct1a = () => {
    setAct1aChecked(false);
    setAct1aSelected(null);
    setAct1aCorrect(null);

    if (act1aIdx < act1aItems.length - 1) {
      setAct1aIdx(act1aIdx + 1);
    } else {
      setStep(6); // Go to Activity 1B
    }
  };

  const handleCheckAct1b = async () => {
    const current = act1bMovePhrases[act1bIdx];
    if (!current || !act1bSelectedTag) return;

    const isCorrect = act1bSelectedTag === current.tag;
    setAct1bChecked(true);
    setAct1bCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");

    try {
      await apiJson("/practice/fluency/move-recognition/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: `move_tag_${act1bIdx}`,
          is_correct: isCorrect,
          time_taken_ms: 2000
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextAct1b = () => {
    setAct1bChecked(false);
    setAct1bSelectedTag(null);
    setAct1bCorrect(null);

    if (act1bIdx < act1bMovePhrases.length - 1) {
      setAct1bIdx(act1bIdx + 1);
    } else {
      setStep(7); // Go to templates
    }
  };

  const handleBuildReply = async () => {
    if (!templatesData || !selectedReaction) return;
    const currentLine = templatesData.partner_lines[activePartnerLineIdx];
    if (!currentLine) return;

    const followupText = useCustomFollowup ? typedFollowup : selectedFollowup;
    if (!followupText) return;

    setBuildingReply(true);
    try {
      const res = await apiJson("/practice/fluency/build-reply", {
        method: "POST",
        body: JSON.stringify({
          partner_line_id: currentLine.id,
          reaction: selectedReaction,
          followup: followupText
        })
      });
      setBuiltReply(res);
      playAudio(res.reply_ko);
    } catch (err) {
      console.error(err);
    } finally {
      setBuildingReply(false);
    }
  };

  const handleNextPartnerLine = () => {
    setBuiltReply(null);
    setSelectedReaction(null);
    setSelectedFollowup(null);
    setTypedFollowup("");
    setUseCustomFollowup(false);
    
    if (activePartnerLineIdx < templatesData.partner_lines.length - 1) {
      setActivePartnerLineIdx(activePartnerLineIdx + 1);
    } else {
      setStep(8); // Move to quickfire
    }
  };

  const handleCheckQuickfire = async (timedOut: boolean = false) => {
    const current = quickfireItems[quickfireIdx];
    if (!current) return;

    const isCorrect = !timedOut && quickfireSelected === current.correct;
    setQuickfireChecked(true);
    setQuickfireCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");

    try {
      await apiJson("/practice/fluency/quickfire/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          is_correct: isCorrect,
          time_taken_ms: (25 - quickfireTimeLeft) * 1000
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextQuickfire = () => {
    setQuickfireChecked(false);
    setQuickfireSelected(null);
    setQuickfireCorrect(null);

    if (quickfireIdx < quickfireItems.length - 1) {
      setQuickfireIdx(quickfireIdx + 1);
    } else {
      setStep(9); // Move to Mini-chat
    }
  };

  const handleStartDrillChat = async () => {
    setChatMessages([]);
    setChatResult(null);
    try {
      const res = await apiJson("/conversation/b1/fluency-drill/start", { method: "POST" });
      setChatSessionId(res.session_id);
      setChatMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") {
        playAudio(res.opener);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendDrillTurn = async () => {
    if (!chatText.trim() || !chatSessionId) return;
    const textToSend = chatText;
    setChatText("");
    setChatMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setSendingTurn(true);

    try {
      const res = await apiJson("/conversation/b1/fluency-drill/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setChatMessages((prev) => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") {
        playAudio(res.reply_ko);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingTurn(false);
    }
  };

  const handleFinishDrillChat = async () => {
    if (!chatSessionId) return;
    setFinishingChat(true);
    try {
      const res = await apiJson("/conversation/b1/fluency-drill/finish", { method: "POST" });
      setChatResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setFinishingChat(false);
    }
  };

  const handleStartVoiceRecording = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setChatText("진짜요? 대단하네요! 어땠어요?");
    }, 2000);
  };

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
      await apiJson("/quiz/korean4/phase-1/answer", {
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
        const res = await apiJson("/quiz/korean4/phase-1/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Fluency Champion");
        setStep(11); // Proceed to Activity 6: Extra open practice chat
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework((prev) => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/phases/korean4/1/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartHomeworkPractice = async () => {
    setPracticeMessages([]);
    setPracticeResult(null);
    setPracticeFinished(false);
    try {
      const res = await apiJson("/conversation/b1/fluency-practice/start", { method: "POST" });
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
      const res = await apiJson("/conversation/b1/fluency-practice/turn", {
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
      const res = await apiJson("/conversation/b1/fluency-practice/finish", { method: "POST" });
      setPracticeResult(res);
      setPracticeFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  const outlineSteps = [
    { num: 1, label: "Welcome & Goals" },
    { num: 2, label: "Concept 1: Fluency Goals" },
    { num: 3, label: "Concept 2: Short vs Flowing" },
    { num: 4, label: "Concept 3: Move Phrases" },
    { num: 5, label: "Activity 1A: Flowing Recognition" },
    { num: 6, label: "Activity 1B: Move Classifier" },
    { num: 7, label: "Activity 2: Templates Builder" },
    { num: 8, label: "Activity 3: Quick-Fire response" },
    { num: 9, label: "Activity 4: 3-Minute Mini-Chat" },
    { num: 10, label: "Activity 5: Best-Practice Quiz" },
    { num: 11, label: "Activity 6: Extra Free Practice" },
    { num: 12, label: "Phase Completion" }
  ];

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
              <span>{activeLesson?.title || "Korean 4.1 – Keep the Conversation Alive"}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-md uppercase tracking-wider">B1 Fluency</span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium">Course 5 &bull; Phase 1</p>
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
    if (courseXP < 180) {
      alert("To graduate from this course, you need at least 180 XP. You currently have " + courseXP + " XP. Please review earlier steps or re-answer incorrect questions to earn more XP!");
      return;
    }
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
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/25 w-fit mx-auto text-indigo-400 shrink-0">
            <Sparkles className="w-10 h-10 animate-pulse shrink-0" />
          </div>
          
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Keep the Conversation Alive</h2>
            <h3 className="text-xl font-extrabold text-indigo-400 mt-2">B1 Fluency Training</h3>
          </div>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Master the art of natural conversation. Move past basic one-clause answers and learn to react, expand, and ask follow-up questions to maintain flow."}
          </p>

          <div className="bg-zinc-950/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Understand the difference between a dead-end response and a flowing response",
                "Learn core conversational move phrases (surprise, filler, ask-back)",
                "Build templated replies combining reactions and questions",
                "Converse live under a 3-minute timed scenario with metrics tracking"
              ]).map((g: string, idx: number) => (
                <li key={idx} className="text-zinc-300">{g}</li>
              ))}
            </ul>
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs border-t border-white/5 mt-4">
              <p><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 30} minutes</p>
              <p><strong>📋 Level:</strong> Intermediate B1 (Korean 4.1)</p>
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
                    ? "border-indigo-500 bg-indigo-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                Text input
              </button>
              <button
                onClick={() => setMode("voice")}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === "voice" 
                    ? "border-indigo-500 bg-indigo-500/10 text-white" 
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
              onClick={() => {
    if (courseXP < 0) {
      alert("To start Phase 1, you need at least 0 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!");
      return;
    }
    setStep(2);
  }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <span>Start Phase 1</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Screen 2: Concept C1 - B1 Fluency Goal */}
      {step === 2 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen 1: B1 Fluency Objective</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 2 of {totalSteps}</span>
          </div>

          {/* Goal Callout */}
          <div className="bg-indigo-950/30 p-5 rounded-2xl border border-indigo-500/20 text-sm leading-relaxed text-zinc-300">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-white uppercase tracking-wider text-xs">The Core Fluency Goal:</span>
            </div>
            <p className="italic text-zinc-200">
              "At B1, you shouldn't only answer questions. You must react to the speaker's statement, offer a short description/detail, and ask a follow-up question to keep the timeline flow going."
            </p>
          </div>

          {/* Flow Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto w-full">
            <div className="p-4 bg-zinc-950 rounded-xl border border-white/5">
              <span className="text-indigo-400 font-black text-xs block mb-1">1. REACT</span>
              <p className="text-xs text-zinc-400">Show surprise, empathy, or agreement (e.g. 진짜요?, 아 그래요?).</p>
            </div>
            <div className="p-4 bg-zinc-950 rounded-xl border border-white/5">
              <span className="text-purple-400 font-black text-xs block mb-1">2. ANSWER / ADD</span>
              <p className="text-xs text-zinc-400">Give your details or complete answer using appropriate grammar.</p>
            </div>
            <div className="p-4 bg-zinc-950 rounded-xl border border-white/5">
              <span className="text-violet-400 font-black text-xs block mb-1">3. ASK BACK</span>
              <p className="text-xs text-zinc-400">Use a follow-up question (e.g. 요즘도 해요?, 어땠어요?).</p>
            </div>
          </div>

          {/* Concept Check MCQ */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl mx-auto w-full">
            <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest block font-mono">Micro Checkpoint C1</span>
            <p className="text-sm font-bold text-white text-left">Which reply keeps the conversation going more: the short one or the flowing one?</p>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "short", label: "The Short One" },
                { id: "flowing", label: "The Flowing One" }
              ].map((opt) => {
                let borderStyle = "border-white/5 bg-zinc-900/60 text-zinc-300";
                if (c1Selected === opt.id) {
                  borderStyle = "border-indigo-500 bg-indigo-500/10 text-white";
                }
                if (c1Checked) {
                  if (opt.id === "flowing") {
                    borderStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                  } else if (c1Selected === opt.id) {
                    borderStyle = "border-red-500 bg-red-500/10 text-red-300 font-extrabold";
                  }
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
              <div className={`p-4 rounded-xl text-xs text-left animate-fade-in border ${
                c1Correct ? "bg-green-500/5 border-green-500/20 text-green-300" : "bg-red-500/5 border-red-500/20 text-red-400"
              }`}>
                <p className="font-extrabold mb-1">{c1Correct ? "✓ Correct! Brilliant." : "✗ Incorrect."}</p>
                <p>Flowing replies add reaction phrases, detail context, and ask questions back, encouraging the conversation to continue.</p>
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
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Next Screen <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Concept C2 - Short vs Flowing Comparison */}
      {step === 3 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen 2: Model Comparison</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 3 of {totalSteps}</span>
          </div>

          {coreData?.short_vs_flowing_examples && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 text-left max-w-3xl mx-auto w-full">
              <span className="text-[10px] text-zinc-400 font-black uppercase tracking-wider block font-mono">COMPARING DIALOGUE TIMELINES</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Short example card */}
                <div className="p-4 bg-red-950/10 border border-red-500/20 rounded-xl space-y-2">
                  <span className="text-red-400 font-black text-[10px] uppercase">Short Response (Dead End)</span>
                  <div className="space-y-1 text-xs">
                    <p className="text-zinc-500">Partner: "{coreData.short_vs_flowing_examples.short.a}"</p>
                    <p className="text-white font-korean font-bold">Learner: "{coreData.short_vs_flowing_examples.short.b}"</p>
                  </div>
                  <p className="text-[10px] text-zinc-500 italic mt-2">Provides minimal details. Conversation stops immediately.</p>
                </div>

                {/* Flowing example card */}
                <div className="p-4 bg-emerald-950/10 border border-emerald-500/20 rounded-xl space-y-2">
                  <span className="text-emerald-400 font-black text-[10px] uppercase">Flowing Response (Keep Alive)</span>
                  <div className="space-y-1 text-xs">
                    <p className="text-zinc-500">Partner: "{coreData.short_vs_flowing_examples.flowing.a}"</p>
                    <p className="text-white font-korean font-bold">Learner: "{coreData.short_vs_flowing_examples.flowing.b}"</p>
                  </div>
                  <p className="text-[10px] text-zinc-400 italic mt-2">Employs reaction phrase + descriptive answer + follow-up question.</p>
                </div>
              </div>
            </div>
          )}

          {/* Concept Check MCQ */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl mx-auto w-full">
            <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest block font-mono">Micro Checkpoint C2</span>
            <p className="text-sm font-bold text-white text-left">What is the difference between a reaction phrase and a follow-up question?</p>
            
            <div className="flex flex-col gap-2 text-left">
              {[
                { id: "A", text: "A reaction phrase shows interest or agreement, while a follow-up question asks for more details." },
                { id: "B", text: "A reaction phrase is for ending the talk, while a follow-up question is only for grammar corrections." },
                { id: "C", text: "They perform the exact same dialogue role." }
              ].map((opt) => {
                let borderStyle = "border-white/5 bg-zinc-900/60 text-zinc-300";
                if (c2Selected === opt.id) {
                  borderStyle = "border-indigo-500 bg-indigo-500/10 text-white";
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
                    id={`c2-opt-${opt.id}`}
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
              <div className={`p-4 rounded-xl text-xs text-left animate-fade-in border ${
                c2Correct ? "bg-green-500/5 border-green-500/20 text-green-300" : "bg-red-500/5 border-red-500/20 text-red-400"
              }`}>
                <p className="font-extrabold mb-1">{c2Correct ? "✓ Correct! Brilliant." : "✗ Incorrect."}</p>
                <p>Reaction phrases (진짜요?, 대단하네요!) show active listening and emotion, whereas follow-up questions (어땠어요?, 요즘도 해요?) gather additional information.</p>
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
            <button onClick={() => {
    if (courseXP < 0) {
      alert("To start Phase 1, you need at least 0 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!");
      return;
    }
    setStep(2);
  }} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Next Screen <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Concept C3 - Move Phrases categories */}
      {step === 4 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen 3: Key Conversation Moves</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 4 of {totalSteps}</span>
          </div>

          <p className="text-xs text-zinc-400 max-w-xl mx-auto">
            Review key intermediate move expressions. Reacting, filling pauses, and asking back are critical tools to maintain conversational flow.
          </p>

          <div className="space-y-4">
            {/* Filter buttons */}
            <div className="flex gap-2 justify-center flex-wrap">
              {["all", "reaction", "follow-up", "repair"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition capitalize cursor-pointer ${
                    selectedFilter === cat 
                      ? "border-indigo-500 bg-indigo-500/10 text-white" 
                      : "border-white/5 bg-zinc-950 text-zinc-450 hover:border-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Phrase list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
              {coreData?.conversation_moves
                ?.filter((m: any) => selectedFilter === "all" || m.tag.toLowerCase() === selectedFilter.toLowerCase())
                ?.map((m: any, idx: number) => (
                  <div key={idx} className="p-4 bg-zinc-950 rounded-xl border border-white/5 flex justify-between items-center text-left hover:border-indigo-500/25 transition duration-200">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-korean font-black text-white text-base">{m.ko}</span>
                        <span className="text-[8px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1 py-0.5 rounded uppercase font-mono">{m.tag}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{m.rom}</p>
                      <p className="text-[11px] text-zinc-400 leading-tight mt-1">{m.en}</p>
                    </div>
                    <button 
                      onClick={() => playAudio(m.ko)} 
                      className="p-2 bg-zinc-900 border border-white/5 hover:border-white/10 hover:text-white rounded-lg text-zinc-400 transition cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Activity 1A - Flowing Response Recognition */}
      {step === 5 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity 1A – Choose Flowing Reply</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 5 of {totalSteps}</span>
          </div>

          {act1aItems.length > 0 && act1aItems[act1aIdx] && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6 text-left max-w-3xl mx-auto w-full">
              
              {/* Partner prompt line */}
              <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-1.5">
                <span className="text-[9px] text-indigo-400 font-mono block">PARTNER SAYS:</span>
                <p className="font-korean text-base font-bold text-white">{act1aItems[act1aIdx].question}</p>
              </div>

              {/* Multi Choice Answers */}
              <div className="flex flex-col gap-3">
                {[
                  { id: "A", text: act1aItems[act1aIdx].opt_a, label: "Answer Option A" },
                  { id: "B", text: act1aItems[act1aIdx].opt_b, label: "Answer Option B (Flowing)" }
                ].map((opt) => {
                  let borderStyle = "border-white/5 bg-zinc-900 text-zinc-300 hover:border-white/10";
                  if (act1aSelected === opt.id) {
                    borderStyle = "border-indigo-500 bg-indigo-500/10 text-white";
                  }
                  if (act1aChecked) {
                    if (opt.id === act1aItems[act1aIdx].correct_option) {
                      borderStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                    } else if (act1aSelected === opt.id) {
                      borderStyle = "border-red-500 bg-red-500/10 text-red-300 font-extrabold";
                    }
                  }
                  return (
                    <button
                      key={opt.id}
                      id={`act1a-opt-${opt.id}`}
                      disabled={act1aChecked}
                      onClick={() => setAct1aSelected(opt.id)}
                      className={`p-4 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${borderStyle}`}
                    >
                      <span className="font-mono text-[9px] text-zinc-500 block mb-1 uppercase">{opt.label}</span>
                      <span className="font-korean text-sm">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {act1aChecked && (
                <div className={`p-4 rounded-xl text-xs text-left animate-fade-in border ${
                  act1aCorrect ? "bg-green-500/5 border-green-500/20 text-green-300" : "bg-red-500/5 border-red-500/20 text-red-400"
                }`}>
                  <p className="font-extrabold text-sm">{act1aCorrect ? "✓ Correct Choice!" : "✗ Incorrect."}</p>
                  <p className="text-zinc-300 mt-1">{act1aItems[act1aIdx].explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!act1aChecked ? (
                  <button
                    id="submit-act1a-btn"
                    onClick={handleCheckAct1a}
                    disabled={!act1aSelected}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-6 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Selection
                  </button>
                ) : (
                  <button
                    id="next-act1a-btn"
                    onClick={handleNextAct1a}
                    className="bg-purple-600 text-white hover:bg-purple-500 px-5 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {act1aIdx < act1aItems.length - 1 ? "Next Challenge" : "Continue to moves classification"}
                  </button>
                )}
              </div>

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button id="prev-btn-5" onClick={() => setStep(4)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button id="next-btn-5" onClick={() => setStep(6)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Activity 1B <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 6: Activity 1B - Move Phrase Classification */}
      {step === 6 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity 1B – Conversation Move Classification</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 6 of {totalSteps}</span>
          </div>

          {act1bMovePhrases.length > 0 && act1bMovePhrases[act1bIdx] && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6 text-left max-w-3xl mx-auto w-full">
              
              <div className="p-5 bg-zinc-900 border border-white/5 rounded-xl text-center space-y-2">
                <span className="text-[9px] text-indigo-400 font-mono block">IDENTIFY THE DIALOGUE MOVE:</span>
                <p className="font-korean text-2xl font-bold text-white">{act1bMovePhrases[act1bIdx].ko}</p>
                <p className="text-xs text-zinc-400">Meaning: "{act1bMovePhrases[act1bIdx].en}"</p>
              </div>

              {/* Classifier options */}
              <div className="grid grid-cols-3 gap-2.5 max-w-lg mx-auto w-full">
                {["reaction", "follow-up", "repair"].map((tagOption) => {
                  let borderStyle = "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10";
                  if (act1bSelectedTag === tagOption) {
                    borderStyle = "border-indigo-500 bg-indigo-500/10 text-white";
                  }
                  if (act1bChecked) {
                    if (tagOption === act1bMovePhrases[act1bIdx].tag) {
                      borderStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                    } else if (act1bSelectedTag === tagOption) {
                      borderStyle = "border-red-500 bg-red-500/10 text-red-300 font-extrabold";
                    }
                  }
                  return (
                    <button
                      key={tagOption}
                      id={`act1b-tag-${tagOption}`}
                      disabled={act1bChecked}
                      onClick={() => setAct1bSelectedTag(tagOption)}
                      className={`p-3.5 rounded-xl border text-center text-xs font-bold uppercase transition cursor-pointer ${borderStyle}`}
                    >
                      {tagOption}
                    </button>
                  );
                })}
              </div>

              {act1bChecked && (
                <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 text-xs text-zinc-400 text-center animate-fade-in">
                  <p className="font-bold text-white mb-1">{act1bCorrect ? "✓ Well Done!" : "✗ Not quite."}</p>
                  <p>"{act1bMovePhrases[act1bIdx].ko}" is used as a <strong>{act1bMovePhrases[act1bIdx].tag}</strong> phrase.</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!act1bChecked ? (
                  <button
                    id="submit-act1b-btn"
                    onClick={handleCheckAct1b}
                    disabled={!act1bSelectedTag}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-6 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Submit Move Type
                  </button>
                ) : (
                  <button
                    id="next-act1b-btn"
                    onClick={handleNextAct1b}
                    className="bg-purple-600 text-white hover:bg-purple-500 px-5 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {act1bIdx < act1bMovePhrases.length - 1 ? "Next Move" : "Move to templates builder"}
                  </button>
                )}
              </div>

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button id="prev-btn-6" onClick={() => setStep(5)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button id="next-btn-6" onClick={() => setStep(7)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 7: Activity 2 - Reply Builder from Templates */}
      {step === 7 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity 2 – Templated Flowing Replies</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 7 of {totalSteps}</span>
          </div>

          {templatesData && templatesData.partner_lines[activePartnerLineIdx] && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6 text-left max-w-3xl mx-auto w-full">
              
              <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase font-mono">Partner Line:</span>
                <p className="font-korean text-base font-bold text-zinc-200">{templatesData.partner_lines[activePartnerLineIdx].text}</p>
              </div>

              {/* Slot 1: Reaction selection */}
              <div className="space-y-2">
                <label className="text-[9px] text-indigo-400 uppercase font-black tracking-widest block font-mono">Slot 1: Choose a Reaction Phrase</label>
                <div className="flex gap-2 flex-wrap">
                  {templatesData.partner_lines[activePartnerLineIdx].suggested_reactions.map((react: string) => (
                    <button
                      key={react}
                      onClick={() => {
                        setSelectedReaction(react);
                        setBuiltReply(null);
                      }}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold font-korean transition cursor-pointer ${
                        selectedReaction === react
                          ? "border-indigo-500 bg-indigo-500/10 text-white"
                          : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                      }`}
                    >
                      {react}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slot 2: Follow-up question selection/entry */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[9px] text-purple-400 uppercase font-black font-mono tracking-wider">
                  <span>Slot 2: Choose/Write a Follow-up Question</span>
                  <button 
                    onClick={() => {
                      setUseCustomFollowup(!useCustomFollowup);
                      setSelectedFollowup(null);
                      setTypedFollowup("");
                      setBuiltReply(null);
                    }} 
                    className="text-indigo-400 hover:underline cursor-pointer"
                  >
                    {useCustomFollowup ? "Suggested Options" : "Type Custom Question"}
                  </button>
                </div>

                {!useCustomFollowup ? (
                  <div className="flex flex-col gap-2">
                    {templatesData.partner_lines[activePartnerLineIdx].suggested_followups.map((fo: string) => (
                      <button
                        key={fo}
                        onClick={() => {
                          setSelectedFollowup(fo);
                          setBuiltReply(null);
                        }}
                        className={`p-3 rounded-xl border text-left text-xs font-bold font-korean transition cursor-pointer ${
                          selectedFollowup === fo
                            ? "border-indigo-500 bg-indigo-500/10 text-white"
                            : "border-white/5 bg-zinc-900 text-zinc-300 hover:border-white/10"
                        }`}
                      >
                        {fo}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={typedFollowup}
                    onChange={(e) => {
                      setTypedFollowup(e.target.value);
                      setBuiltReply(null);
                    }}
                    placeholder="Type a natural follow-up (e.g. 요즘도 한국어 공부해요?)..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-korean"
                  />
                )}
              </div>

              {/* Reply compilation block */}
              {builtReply ? (
                <div className="p-4 bg-zinc-900 rounded-xl border border-indigo-500/20 text-xs space-y-2 animate-fade-in">
                  <span className="text-[9px] text-indigo-400 font-black block uppercase font-mono">Assembled Flowing Reply:</span>
                  <p className="font-korean text-base font-extrabold text-white bg-zinc-950 p-3 rounded-lg border border-white/5 leading-relaxed">{builtReply.reply_ko}</p>
                  
                  {/* Self-check prompt */}
                  <div className="bg-indigo-950/20 p-3.5 rounded-lg border border-indigo-500/10 space-y-1 mt-2 text-[10px] text-zinc-400">
                    <span className="text-[8px] text-indigo-300 font-black uppercase font-mono block">Fluency Checkpoint Checklist:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>React to the partner (used: "{selectedReaction}")</li>
                      <li>Include an answer details/follow-up question (used: "{useCustomFollowup ? typedFollowup : selectedFollowup}")</li>
                      <li>Creates a flowing dialogue connection</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <button
                  id="assemble-reply-btn"
                  onClick={handleBuildReply}
                  disabled={buildingReply || !selectedReaction || (!useCustomFollowup ? !selectedFollowup : !typedFollowup.trim())}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl text-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  {buildingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Combine Reaction &amp; Question</span>
                </button>
              )}

              {builtReply && (
                <button
                  id="next-partner-btn"
                  onClick={handleNextPartnerLine}
                  className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-450 font-bold py-3 rounded-xl transition text-xs flex justify-center items-center gap-1 cursor-pointer"
                >
                  <span>{activePartnerLineIdx < templatesData.partner_lines.length - 1 ? "Next Partner Line" : "Proceed to Quick-fire Mode"}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-950" />
                </button>
              )}

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button id="prev-btn-7" onClick={() => setStep(6)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button id="next-btn-7" onClick={() => setStep(8)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Quick-Fire <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 8: Activity 3 - Timed response quick-fire */}
      {step === 8 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity 3 – Quick-Fire response drills</span>
            </h2>
            <div className="flex items-center gap-1.5 text-amber-400 font-mono text-sm bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
              <Timer className="w-4 h-4" />
              <span>{quickfireTimeLeft}s</span>
            </div>
          </div>

          {quickfireItems.length > 0 && quickfireItems[quickfireIdx] && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6 text-left max-w-3xl mx-auto w-full">
              
              <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl">
                <span className="text-[9px] text-zinc-550 block mb-1 uppercase font-mono">React Fast to Partner:</span>
                <p className="font-korean text-base font-bold text-white">{quickfireItems[quickfireIdx].partner_line}</p>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2.5">
                {quickfireItems[quickfireIdx].options.map((opt: string) => {
                  let borderStyle = "border-white/5 bg-zinc-900 text-zinc-300 hover:border-white/10";
                  if (quickfireSelected === opt) {
                    borderStyle = "border-indigo-500 bg-indigo-500/10 text-white";
                  }
                  if (quickfireChecked) {
                    if (opt === quickfireItems[quickfireIdx].correct) {
                      borderStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                    } else if (quickfireSelected === opt) {
                      borderStyle = "border-red-500 bg-red-500/10 text-red-300 font-extrabold";
                    }
                  }
                  return (
                    <button
                      key={opt}
                      id={`quickfire-opt-${opt.substring(0, 15).replace(/\s+/g, "-").toLowerCase()}`}
                      disabled={quickfireChecked}
                      onClick={() => setQuickfireSelected(opt)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold font-korean transition cursor-pointer ${borderStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {quickfireChecked && (
                <div className={`p-4 rounded-xl text-xs text-left animate-fade-in border ${
                  quickfireCorrect ? "bg-green-500/5 border-green-500/20 text-green-300" : "bg-red-500/5 border-red-500/20 text-red-400"
                }`}>
                  <p className="font-extrabold text-sm">{quickfireCorrect ? "✓ Fast & Correct!" : "✗ Time Up / Incorrect."}</p>
                  <p className="text-zinc-350 mt-1">{quickfireItems[quickfireIdx].explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!quickfireChecked ? (
                  <button
                    id="submit-quickfire-btn"
                    onClick={() => handleCheckQuickfire(false)}
                    disabled={!quickfireSelected}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-6 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Submit response
                  </button>
                ) : (
                  <button
                    id="next-quickfire-btn"
                    onClick={handleNextQuickfire}
                    className="bg-purple-600 text-white hover:bg-purple-500 px-5 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {quickfireIdx < quickfireItems.length - 1 ? "Next Slide" : "Go to AI Conversation Drill"}
                  </button>
                )}
              </div>

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button id="prev-btn-8" onClick={() => setStep(7)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button id="next-btn-8" onClick={() => setStep(9)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Mini-Chat <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 9: Activity 4 - Timed 3-minute mini-chat with metrics */}
      {step === 9 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-indigo-400" />
              <span>Activity 4 – Timed Mini-Chat Strategy Check</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 9 of {totalSteps}</span>
          </div>

          {!chatSessionId ? (
            <div className="p-8 bg-zinc-950 border border-white/10 rounded-[2rem] text-center space-y-5 max-w-md mx-auto w-full">
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/25 rounded-full w-fit mx-auto text-indigo-400">
                <MessageCircle className="w-8 h-8" />
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Start a timed conversation with Gwan-Sik. Try to keep the conversation flowing for 3 minutes by actively reacting and asking questions back!
              </p>
              <button
                id="start-chat-drill-btn"
                onClick={handleStartDrillChat}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 px-8 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-indigo-600/25"
              >
                Initiate Chat Drill
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl mx-auto w-full text-left">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-400">Live Conversation with Gwan-Sik</span>
                <span className="text-[10px] text-zinc-500">Timed metrics evaluation active</span>
              </div>

              {/* Chat log window */}
              <div className="bg-zinc-950 rounded-2xl border border-white/10 p-4 h-64 overflow-y-auto space-y-3.5 custom-scrollbar">
                {chatMessages.map((msg, idx) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
                      <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                        isUser 
                          ? "bg-indigo-600 text-white rounded-tr-none" 
                          : "bg-zinc-900 text-zinc-200 rounded-tl-none border border-white/5"
                      }`}>
                        <p className={!isUser ? "font-korean font-semibold" : ""}>{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
                {sendingTurn && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/5 flex gap-1.5 items-center">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      <span className="text-[10px] text-zinc-500">Gwan-Sik is typing...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* suggested scaffolding chips */}
              <div className="space-y-2">
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block font-mono">Suggested reaction/repair expressions:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {["진짜요?", "대단하네요!", "아쉽네요.", "어땠어요?", "그 다음에는 뭐 했어요?", "무슨 뜻이에요?"].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setChatText((prev) => prev + (prev ? " " : "") + chip)}
                      className="px-2.5 py-1 bg-zinc-900 border border-white/5 hover:border-indigo-500/35 text-[10px] text-zinc-300 rounded-lg font-korean transition cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {!chatResult ? (
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
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="Type your response (react, describe, ask)..."
                    onKeyDown={(e) => e.key === "Enter" && handleSendDrillTurn()}
                    className="flex-grow bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-korean"
                  />
                  <button
                    onClick={handleSendDrillTurn}
                    disabled={sendingTurn || !chatText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Send</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleFinishDrillChat}
                    disabled={finishingChat}
                    className="px-4 bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    End Chat
                  </button>
                </div>
              ) : (
                <div className="p-5 bg-zinc-900 rounded-xl border border-indigo-500/20 space-y-3 animate-fade-in">
                  <p className="font-extrabold text-white">Assessment Metrics Check:</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-center py-1">
                    <div className="bg-zinc-950 p-3 rounded-xl border border-white/5">
                      <span className="text-zinc-500 block text-[10px] font-mono">Reactions Used</span>
                      <span className="text-indigo-400 font-black text-lg">{chatResult.reactions_count || 0} / 3</span>
                    </div>
                    <div className="bg-zinc-950 p-3 rounded-xl border border-white/5">
                      <span className="text-zinc-500 block text-[10px] font-mono">Follow-ups Used</span>
                      <span className="text-violet-400 font-black text-lg">{chatResult.followups_count || 0} / 3</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-3.5 rounded-lg border border-white/5">{chatResult.summary}</p>
                  
                  <button
                    onClick={() => setStep(10)}
                    className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Proceed to Strategy Quiz
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(8)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(10)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 10: Activity 5 - Fluency Strategy quiz */}
      {step === 10 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-400" />
              <span>Mini-Quiz: Fluency Strategy check</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 10 of {totalSteps}</span>
          </div>

          {quizBlueprint.length > 0 && quizBlueprint[quizIdx] && (
            <div className="space-y-6 max-w-xl mx-auto w-full text-left">
              <div className="flex justify-between text-[10px] text-zinc-450 font-mono">
                <span>Quiz Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span>Type: B1 Conversation Strategy</span>
              </div>

              <h3 className="text-base md:text-lg font-black text-white text-center leading-relaxed whitespace-pre-line bg-zinc-950 p-5 rounded-2xl border border-white/5">
                {quizBlueprint[quizIdx].question}
              </h3>

              <div className="grid grid-cols-1 gap-2.5 max-w-md mx-auto w-full">
                {quizBlueprint[quizIdx].options?.map((opt: string) => {
                  let borderStyle = "border-white/5 bg-zinc-900 text-zinc-300 hover:bg-zinc-800";
                  if (quizSelectedOpt === opt) {
                    borderStyle = "border-indigo-500 bg-indigo-500/10 text-white";
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

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button id="prev-btn-10" onClick={() => setStep(9)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
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
                    {finishingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : (quizIdx < quizBlueprint.length - 1 ? "Next Question" : "See Capstone Results")}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 11: Activity 6 - Extra open practice chat */}
      {step === 11 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-indigo-400" />
              <span>Activity 6 – Ongoing open practice chat</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 11 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 text-left max-w-2xl mx-auto w-full">
            <div className="space-y-1">
              <span className="text-[9px] text-indigo-400 font-mono uppercase tracking-widest block font-bold">Extra AI Practice Lab</span>
              <p className="text-xs text-zinc-400 leading-normal">
                Practice keeping a conversation going with Gwan-Sik. He will chat about his life and evaluate your reactions.
              </p>
            </div>

            {!practiceSessionId ? (
              <div className="flex justify-center pt-2">
                <button
                  id="start-practice-btn"
                  onClick={handleStartHomeworkPractice}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 px-8 rounded-xl text-xs transition cursor-pointer"
                >
                  Start Practice Session
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-zinc-900 rounded-xl p-4 border border-white/5 h-44 overflow-y-auto space-y-2.5 custom-scrollbar">
                  {practiceMessages.map((msg, idx) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
                        <div className={`max-w-[80%] rounded-xl p-2.5 text-xs leading-relaxed ${
                          isUser ? "bg-indigo-600 text-white rounded-tr-none" : "bg-zinc-950 text-zinc-300 border border-white/5 rounded-tl-none"
                        }`}>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {practiceSending && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 italic">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Gwan-Sik is typing...</span>
                    </div>
                  )}
                </div>

                {!practiceFinished ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={practiceText}
                      onChange={(e) => setPracticeText(e.target.value)}
                      placeholder="React and ask back to Gwan-Sik..."
                      onKeyDown={(e) => e.key === "Enter" && handleSendPracticeTurn()}
                      className="flex-grow bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-korean"
                    />
                    <button
                      onClick={handleSendPracticeTurn}
                      disabled={practiceSending || !practiceText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Send
                    </button>
                    <button
                      onClick={handleFinishPractice}
                      className="bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-300 px-4 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      End
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-900 rounded-xl border border-brand-500/10 text-xs text-zinc-400 animate-fade-in">
                    <p className="font-extrabold text-white mb-1">Session Feedback Summary:</p>
                    <p>{practiceResult?.feedback || "Great practice session completed!"}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(10)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(12)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Proceed to Graduation <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 12: Homework and Completion Screen */}
      {step === 12 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in max-w-3xl mx-auto">
          <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/25 w-fit mx-auto text-indigo-400">
            <Award className="w-10 h-10 animate-bounce" />
          </div>
          
          <div>
            <h2 className="text-3xl font-black text-white font-sans">Korean 4.1 B1 Fluency Graduated! 🎓✨</h2>
            <p className="text-zinc-400 text-sm mt-1.5">Congratulations on completing Korean 4.1! Next: Phase 2 – Real‑World Situations (Travel & Errands).</p>
          </div>

          {/* Homework checklist */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-left text-xs space-y-3 font-sans leading-relaxed">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block font-sans">Interactive Homework List:</span>
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
                      className="mt-0.5 rounded border-white/10 text-indigo-500 focus:ring-0 focus:ring-offset-0 bg-zinc-950"
                    />
                    <div className="text-zinc-300">
                      <span className="font-bold text-white block mb-0.5">
                        {item.id === "hw_b1_flu_1" ? "Task 1: Writing Drill" : item.id === "hw_b1_flu_2" ? "Task 2: Speaking Monologue" : "Task 3: Reflection"}
                      </span>
                      <span className={isChecked ? "line-through text-zinc-500" : ""}>{item.text}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* completion path details */}
          <div className="p-5 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-2xl border border-indigo-500/20 text-center space-y-1">
            <div className="flex justify-center items-center gap-1 text-indigo-400 font-extrabold text-sm uppercase">
              <Award className="w-5 h-5" />
              <span>Badge Earned: {quizBadge || "Fluency Champion"}</span>
            </div>
            <div className="flex justify-center gap-4 text-xs font-bold pt-1">
              <span className="text-indigo-400">XP +150 Completion Bonus</span>
              <span className="text-zinc-600">|</span>
              <span className="text-violet-400">Phase 1 Complete</span>
            </div>
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
            <span>Complete Phase 1 &amp; Continue</span>
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
