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
  MessageSquare,
  ArrowRight,
  HelpCircle,
  Activity,
  MessageCircle,
  Timer
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

interface Course5Phase1FluencyWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course5Phase1FluencyWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course5Phase1FluencyWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 6;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);
  
  // Concept Explanation Step
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Activity 1 states
  const [activity1Step, setActivity1Step] = useState<"1A" | "1B">("1A");
  const [act1aItems, setAct1aItems] = useState<any[]>([]);
  const [act1aIdx, setAct1aIdx] = useState(0);
  const [act1aSelected, setAct1aSelected] = useState<string | null>(null);
  const [act1aChecked, setAct1aChecked] = useState(false);
  const [act1aCorrect, setAct1aCorrect] = useState<boolean | null>(null);

  const [act1bMovePhrases, setAct1bMovePhrases] = useState<any[]>([]);
  const [act1bIdx, setAct1bIdx] = useState(0);
  const [act1bSelectedTag, setAct1bSelectedTag] = useState<string | null>(null);
  const [act1bChecked, setAct1bChecked] = useState(false);
  const [act1bCorrect, setAct1bCorrect] = useState<boolean | null>(null);

  // Activity 2 states
  const [activity2SubStep, setActivity2SubStep] = useState<"2A" | "2B" | "2C">("2A");
  
  // Activity 2A templates
  const [templatesData, setTemplatesData] = useState<any>(null);
  const [activePartnerLineIdx, setActivePartnerLineIdx] = useState(0);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [selectedFollowup, setSelectedFollowup] = useState<string | null>(null);
  const [typedFollowup, setTypedFollowup] = useState("");
  const [useCustomFollowup, setUseCustomFollowup] = useState(false);
  const [builtReply, setBuiltReply] = useState<any>(null);
  const [buildingReply, setBuildingReply] = useState(false);

  // Activity 2B Quick-fire
  const [quickfireItems, setQuickfireItems] = useState<any[]>([]);
  const [quickfireIdx, setQuickfireIdx] = useState(0);
  const [quickfireSelected, setQuickfireSelected] = useState<string | null>(null);
  const [quickfireChecked, setQuickfireChecked] = useState(false);
  const [quickfireCorrect, setQuickfireCorrect] = useState<boolean | null>(null);
  const [quickfireTimeLeft, setQuickfireTimeLeft] = useState(25);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Activity 2C Chat states
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [sendingTurn, setSendingTurn] = useState(false);
  const [finishingChat, setFinishingChat] = useState(false);
  const [chatResult, setChatResult] = useState<any>(null);
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

  // Homework Fluency Practice AI Room
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [practiceMessages, setPracticeMessages] = useState<any[]>([]);
  const [practiceText, setPracticeText] = useState("");
  const [practiceSending, setPracticeSending] = useState(false);
  const [practiceFinished, setPracticeFinished] = useState(false);
  const [practiceResult, setPracticeResult] = useState<any>(null);

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
        } else if (step === 3 && act1aItems.length === 0) {
          const res = await apiJson("/practice/fluency/move-recognition");
          setAct1aItems(res.items || []);
          setAct1bMovePhrases(res.move_phrases || []);
        } else if (step === 4) {
          if (!templatesData) {
            const res = await apiJson("/practice/fluency/build-templates");
            setTemplatesData(res);
          }
          if (quickfireItems.length === 0) {
            const resQ = await apiJson("/practice/fluency/quickfire");
            setQuickfireItems(resQ.items || []);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean4/phase-1/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean4/1/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading B1 fluency data:", err);
      }
    };
    load();
  }, [step]);

  // Quick-fire timer handling
  useEffect(() => {
    if (step === 4 && activity2SubStep === "2B" && !quickfireChecked) {
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
  }, [step, activity2SubStep, quickfireIdx, quickfireChecked]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1A choice check
  const handleCheckAct1a = async () => {
    const current = act1aItems[act1aIdx];
    if (!current || !act1aSelected) return;

    const isCorrect = act1aSelected === "B";
    setAct1aChecked(true);
    setAct1aCorrect(isCorrect);

    try {
      await apiJson("/practice/fluency/move-recognition/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          is_correct: isCorrect,
          time_taken_ms: 2000
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
      setActivity1Step("1B");
    }
  };

  // Activity 1B type check
  const handleCheckAct1b = async () => {
    const current = act1bMovePhrases[act1bIdx];
    if (!current || !act1bSelectedTag) return;

    const isCorrect = act1bSelectedTag === current.tag;
    setAct1bChecked(true);
    setAct1bCorrect(isCorrect);

    try {
      await apiJson("/practice/fluency/move-recognition/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: `move_tag_${act1bIdx}`,
          is_correct: isCorrect,
          time_taken_ms: 1500
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
      setStep(4);
    }
  };

  // Activity 2A builder
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
      setActivity2SubStep("2B");
    }
  };

  // Activity 2B Quickfire Check
  const handleCheckQuickfire = async (timedOut: boolean = false) => {
    const current = quickfireItems[quickfireIdx];
    if (!current) return;

    const isCorrect = !timedOut && quickfireSelected === current.correct;
    setQuickfireChecked(true);
    setQuickfireCorrect(isCorrect);

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
      setActivity2SubStep("2C");
    }
  };

  // Activity 2C: Fluency Drill Chat Room
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
      // Simulate input text transcription
      setChatText("진짜요? 대단하네요! 어땠어요?");
    }, 2000);
  };

  // Quiz checks
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
        setQuizBadge(res.badge || "Conversation Keeper");
        setStep(6);
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  // Homework checks
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

  // Homework AI Fluency Practice
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
    { num: 1, label: "Screen 1 – Welcome / Phase Overview" },
    { num: 2, label: "Screen 2 – Conversation Moves & Fillers Concept" },
    { num: 3, label: "Screen 3 – Activity 1: Recognize Good Conversation Moves" },
    { num: 4, label: "Screen 4 – Activity 2: Controlled → Semi-Free Drill Room" },
    { num: 5, label: "Screen 5 – Mini-Quiz: Interactive Skills Check" },
    { num: 6, label: "Screen 6 – Homework & Final Evaluation" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 5,
          phaseNum: 1,
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
            <BookOpen className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Korean 4.1 – Keeping the Conversation Going"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Reactions & Follow-up Questions</p>
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
          
          <h2 className="text-5xl font-black text-white tracking-tight font-sans">Korean 4.1</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Keeping the Conversation Going</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Ask follow‑up questions, react naturally, and speak more fluently."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Use reaction phrases and conversation fillers to sound more natural",
                "Ask follow‑up questions instead of stopping after one answer",
                "Use simple repair phrases when you don’t understand"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 30}–35 minutes</p>
          </div>

          {/* Mode Selector */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Conversation Practice Mode</span>
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
              <span>Conversation Moves & Fillers</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">B1 Fluency Goal:</p>
            <p className="italic">
              “At this level, you shouldn’t only answer questions—you should react, ask questions back, and keep the conversation alive.”
            </p>
          </div>

          {/* Interactive filter and cards */}
          <div className="space-y-3">
            <div className="flex gap-1.5 justify-center">
              {["all", "reaction", "follow-up", "repair"].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedFilter(category)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${
                    selectedFilter === category 
                      ? "border-brand-500 bg-brand-500/10 text-white" 
                      : "border-white/5 bg-zinc-950 text-zinc-400"
                  }`}
                >
                  {category.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar p-1">
              {coreData?.conversation_moves
                ?.filter((m: any) => selectedFilter === "all" || m.tag === selectedFilter)
                ?.map((m: any, idx: number) => (
                  <div key={idx} className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-korean font-bold text-white text-sm">{m.ko}</span>
                        <span className="text-[8px] bg-zinc-950 text-zinc-400 px-1 py-0.5 rounded font-mono uppercase">{m.tag}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{m.rom}</p>
                      <p className="text-[11px] text-zinc-500">{m.en}</p>
                    </div>
                    <button 
                      onClick={() => playAudio(m.ko)} 
                      className="p-1.5 bg-zinc-950/40 border border-white/5 hover:border-white/10 hover:text-white rounded-lg text-zinc-400 transition cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
              ))}
            </div>
          </div>

          {/* Short vs Flowing Timeline */}
          {coreData?.short_vs_flowing_examples && (
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3 text-xs text-left">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Flowing Conversations Timeline Comparison</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-red-950/5 border border-red-500/10 rounded-xl space-y-1.5">
                  <span className="text-red-400 font-extrabold text-[10px] block">⚠️ Short (Dead End)</span>
                  <p className="text-zinc-400 font-korean font-semibold">{coreData.short_vs_flowing_examples.short.a}</p>
                  <p className="text-zinc-200 font-korean font-bold pl-2 border-l border-red-500/30">{coreData.short_vs_flowing_examples.short.b}</p>
                  <div className="text-[9px] text-zinc-500 italic mt-1 font-mono">End of talk. Dead end timeline.</div>
                </div>

                <div className="p-3 bg-accent-teal/5 border border-accent-teal/10 rounded-xl space-y-1.5">
                  <span className="text-accent-teal font-extrabold text-[10px] block">✓ Flowing (Continued)</span>
                  <p className="text-zinc-400 font-korean font-semibold">{coreData.short_vs_flowing_examples.flowing.a}</p>
                  <p className="text-zinc-200 font-korean font-bold pl-2 border-l border-accent-teal/30">{coreData.short_vs_flowing_examples.flowing.b}</p>
                  <div className="text-[9px] text-zinc-500 italic mt-1 font-mono">Reacts + details + asks back. Flow goes on.</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Recognize Moves */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Move Recognition</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {activity1Step === "1A" ? (
            /* Activity 1A: Which answer keeps conversation going */
            <div className="space-y-4 text-left">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Activity 1A: Which answer keeps the conversation going?</span>
              {act1aItems[act1aIdx] && (
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-2">
                    <span className="text-[9px] text-brand-400 font-mono block">PARTNER SAYS:</span>
                    <p className="font-korean text-base font-bold text-white">{act1aItems[act1aIdx].question}</p>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => !act1aChecked && setAct1aSelected("A")}
                      disabled={act1aChecked}
                      className={`p-3.5 rounded-2xl border text-left text-xs font-semibold transition ${
                        act1aSelected === "A" 
                          ? "border-brand-500 bg-brand-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-300 hover:border-white/10"
                      } ${act1aChecked && act1aItems[act1aIdx].correct_option === "A" ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                    >
                      <span className="font-bold text-[10px] text-zinc-500 block mb-1">Answer A:</span>
                      {act1aItems[act1aIdx].opt_a}
                    </button>

                    <button
                      onClick={() => !act1aChecked && setAct1aSelected("B")}
                      disabled={act1aChecked}
                      className={`p-3.5 rounded-2xl border text-left text-xs font-semibold transition ${
                        act1aSelected === "B" 
                          ? "border-brand-500 bg-brand-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-300 hover:border-white/10"
                      } ${act1aChecked && act1aItems[act1aIdx].correct_option === "B" ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                    >
                      <span className="font-bold text-[10px] text-zinc-500 block mb-1">Answer B:</span>
                      {act1aItems[act1aIdx].opt_b}
                    </button>
                  </div>

                  {act1aChecked && (
                    <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-1.5">
                      <p className="font-extrabold text-white">{act1aCorrect ? "✓ Correct Choice!" : "✗ Incorrect."}</p>
                      <p>{act1aItems[act1aIdx].explanation}</p>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    {!act1aChecked ? (
                      <button
                        onClick={handleCheckAct1a}
                        disabled={!act1aSelected}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Check Selection
                      </button>
                    ) : (
                      <button
                        onClick={handleNextAct1a}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Next Challenge
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Activity 1B: Identify the conversation move type */
            <div className="space-y-4 text-left">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Activity 1B: Identify the conversation move type</span>
              {act1bMovePhrases[act1bIdx] && (
                <div className="space-y-4">
                  <div className="p-5 bg-zinc-950 border border-white/5 rounded-2xl text-center space-y-2">
                    <span className="text-[9px] text-brand-400 font-mono block">IDENTIFY THIS PHRASE:</span>
                    <p className="font-korean text-2xl font-bold text-white">{act1bMovePhrases[act1bIdx].ko}</p>
                    <p className="text-xs text-zinc-400">{act1bMovePhrases[act1bIdx].en}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {["reaction", "follow-up", "repair"].map((tagOption) => (
                      <button
                        key={tagOption}
                        onClick={() => !act1bChecked && setAct1bSelectedTag(tagOption)}
                        disabled={act1bChecked}
                        className={`p-3.5 rounded-xl border text-center text-xs font-bold uppercase transition ${
                          act1bSelectedTag === tagOption 
                            ? "border-brand-500 bg-brand-500/10 text-white" 
                            : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                        } ${act1bChecked && act1bMovePhrases[act1bIdx].tag === tagOption ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                      >
                        {tagOption}
                      </button>
                    ))}
                  </div>

                  {act1bChecked && (
                    <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 text-center">
                      <p className="font-bold text-white mb-1">{act1bCorrect ? "✓ Well Done!" : "✗ Not quite."}</p>
                      <p>"{act1bMovePhrases[act1bIdx].ko}" is used as a <strong>{act1bMovePhrases[act1bIdx].tag}</strong> phrase.</p>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    {!act1bChecked ? (
                      <button
                        onClick={handleCheckAct1b}
                        disabled={!act1bSelectedTag}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Submit Move Type
                      </button>
                    ) : (
                      <button
                        onClick={handleNextAct1b}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        {act1bIdx < act1bMovePhrases.length - 1 ? "Next Move" : "Go to Activity 2"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button 
              onClick={() => {
                if (activity1Step === "1B") {
                  setActivity1Step("1A");
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

      {/* Screen 4: Activity 2: Use Reactions & Follow-ups */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Controlled to Free Practice</span>
            </h2>
            <div className="flex gap-1">
              {["2A", "2B", "2C"].map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActivity2SubStep(sub as any)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    activity2SubStep === sub 
                      ? "bg-brand-500 text-white" 
                      : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Substep 2A: Build reaction + follow-up reply */}
          {activity2SubStep === "2A" && templatesData && (
            <div className="space-y-4 text-left">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Activity 2A – Add a reaction & follow‑up</span>
              
              {templatesData.partner_lines[activePartnerLineIdx] && (
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl">
                    <span className="text-[9px] text-zinc-500 block mb-1 uppercase">Partner Line:</span>
                    <p className="font-korean text-sm font-semibold text-zinc-200">{templatesData.partner_lines[activePartnerLineIdx].text}</p>
                  </div>

                  {/* Step 1: Choose reaction */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-zinc-500 block uppercase font-bold">Step 1: Choose a Reaction Phrase</span>
                    <div className="flex gap-2 flex-wrap">
                      {templatesData.partner_lines[activePartnerLineIdx].suggested_reactions.map((react: string) => (
                        <button
                          key={react}
                          onClick={() => setSelectedReaction(react)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold font-korean transition ${
                            selectedReaction === react
                              ? "border-brand-500 bg-brand-500/10 text-white"
                              : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                          }`}
                        >
                          {react}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Choose/Type follow-up */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[9px] text-zinc-500 uppercase font-bold">
                      <span>Step 2: Choose or write a Follow-up Question</span>
                      <button 
                        onClick={() => setUseCustomFollowup(!useCustomFollowup)} 
                        className="text-brand-400 hover:underline cursor-pointer"
                      >
                        {useCustomFollowup ? "Select Options" : "Write Custom"}
                      </button>
                    </div>

                    {!useCustomFollowup ? (
                      <div className="flex flex-col gap-2">
                        {templatesData.partner_lines[activePartnerLineIdx].suggested_followups.map((fo: string) => (
                          <button
                            key={fo}
                            onClick={() => setSelectedFollowup(fo)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-semibold font-korean transition ${
                              selectedFollowup === fo
                                ? "border-brand-500 bg-brand-500/10 text-white"
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
                        onChange={(e) => setTypedFollowup(e.target.value)}
                        placeholder="Type a custom follow-up (e.g. 어땠어요?)..."
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500 font-korean"
                      />
                    )}
                  </div>

                  {/* Combined reply visualization */}
                  {builtReply ? (
                    <div className="p-4 bg-zinc-950 rounded-2xl border border-accent-teal/20 text-xs text-left space-y-2">
                      <span className="text-[9px] text-accent-teal font-bold block uppercase">Your Output Reply Block</span>
                      <p className="font-korean text-base font-bold text-white">{builtReply.reply_ko}</p>
                      <div className="flex gap-2 items-center text-zinc-500 text-[10px]">
                        <span className="bg-brand-500/10 text-brand-400 px-1.5 py-0.5 rounded font-bold">{selectedReaction}</span>
                        <span>+</span>
                        <span className="bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold">{useCustomFollowup ? typedFollowup : selectedFollowup}</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleBuildReply}
                      disabled={buildingReply || !selectedReaction || (!useCustomFollowup ? !selectedFollowup : !typedFollowup.trim())}
                      className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-xs flex justify-center items-center gap-1.5 cursor-pointer"
                    >
                      {buildingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Combine Reaction & Follow-up</span>
                    </button>
                  )}

                  {builtReply && (
                    <button
                      onClick={handleNextPartnerLine}
                      className="w-full bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 font-bold py-3 rounded-xl transition text-xs flex justify-center items-center gap-1 cursor-pointer"
                    >
                      <span>{activePartnerLineIdx < templatesData.partner_lines.length - 1 ? "Next Partner Line" : "Go to Quick-fire Mode"}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Substep 2B: Quick-fire follow-up practice */}
          {activity2SubStep === "2B" && quickfireItems.length > 0 && (
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-black uppercase tracking-wider">
                <span>Activity 2B – Quick‑fire follow‑up practice</span>
                <div className="flex items-center gap-1 text-amber-400">
                  <Timer className="w-3.5 h-3.5" />
                  <span className="font-mono">{quickfireTimeLeft}s</span>
                </div>
              </div>

              {quickfireItems[quickfireIdx] && (
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl">
                    <span className="text-[9px] text-zinc-500 block mb-1 uppercase">Partner Line:</span>
                    <p className="font-korean text-sm font-semibold text-zinc-200">{quickfireItems[quickfireIdx].partner_line}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {quickfireItems[quickfireIdx].options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !quickfireChecked && setQuickfireSelected(opt)}
                        disabled={quickfireChecked}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold font-korean transition ${
                          quickfireSelected === opt
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900 text-zinc-300 hover:border-white/10"
                        } ${quickfireChecked && opt === quickfireItems[quickfireIdx].correct ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {quickfireChecked && (
                    <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-1">
                      <p className="font-bold text-white">{quickfireCorrect ? "✓ Fast & Correct!" : "✗ Time Up / Incorrect."}</p>
                      <p>{quickfireItems[quickfireIdx].explanation}</p>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    {!quickfireChecked ? (
                      <button
                        onClick={() => handleCheckQuickfire(false)}
                        disabled={!quickfireSelected}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Submit Reply
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuickfire}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        {quickfireIdx < quickfireItems.length - 1 ? "Next Slide" : "Go to AI Conversation Drill"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Substep 2C: AI conversation drill */}
          {activity2SubStep === "2C" && (
            <div className="space-y-4 text-left">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Activity 2C – Short semi‑free chat with AI</span>
              
              {!chatSessionId ? (
                <div className="p-6 bg-zinc-950 border border-white/5 rounded-2xl text-center space-y-4">
                  <div className="p-3 bg-brand-500/10 border border-brand-500/25 rounded-full w-fit mx-auto text-brand-400">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">
                    Start a 3-minute mini-chat with Gwan-Sik. Try to use at least <strong>3 reaction phrases</strong> and <strong>3 follow-up questions</strong>!
                  </p>
                  <button
                    onClick={handleStartDrillChat}
                    className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Start Chat Drill
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-zinc-950 rounded-2xl border border-white/5 p-4 h-48 overflow-y-auto space-y-2.5 custom-scrollbar">
                    {chatMessages.map((msg, idx) => {
                      const isUser = msg.sender === "user";
                      return (
                        <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
                          <div className={`max-w-[80%] rounded-2xl p-2.5 text-xs leading-relaxed ${
                            isUser 
                              ? "bg-brand-500 text-white rounded-tr-none" 
                              : "bg-zinc-900 text-zinc-300 rounded-tl-none border border-white/5"
                          }`}>
                            <p className={!isUser ? "font-korean" : ""}>{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                    {sendingTurn && (
                      <div className="flex justify-start">
                        <div className="bg-zinc-900 p-2 rounded-xl border border-white/5 flex gap-1 items-center">
                          <Loader2 className="w-3 animate-spin text-brand-400" />
                          <span className="text-[9px] text-zinc-500">Gwan-Sik is thinking...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scaffolding Reaction/Follow-up chips */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">Suggested chips (click to insert):</span>
                    <div className="flex gap-1 flex-wrap">
                      {["진짜요?", "대단하네요!", "아쉽네요.", "어땠어요?", "그 다음에는 뭐 했어요?", "무슨 뜻이에요?"].map((chip) => (
                        <button
                          key={chip}
                          onClick={() => setChatText((prev) => prev + (prev ? " " : "") + chip)}
                          className="px-2 py-1 bg-zinc-900 border border-white/5 hover:border-brand-500/35 text-[10px] text-zinc-300 rounded-lg font-korean transition cursor-pointer"
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
                          className={`p-2.5 rounded-xl border transition ${recording ? "bg-red-500 text-white border-red-500 animate-pulse" : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white"}`}
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      )}
                      <input
                        type="text"
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        placeholder="Type response with reaction & follow-up..."
                        onKeyDown={(e) => e.key === "Enter" && handleSendDrillTurn()}
                        className="flex-grow bg-zinc-950 border border-white/5 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-korean"
                      />
                      <button
                        onClick={handleSendDrillTurn}
                        disabled={sendingTurn || !chatText.trim()}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <span>Send</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={handleFinishDrillChat}
                        disabled={finishingChat}
                        className="px-3 bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-300 text-[10px] font-bold rounded-xl transition cursor-pointer"
                      >
                        End Chat
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-zinc-900 rounded-xl border border-brand-500/20 space-y-2 text-xs">
                      <p className="font-extrabold text-white">Assessment Metrics Check:</p>
                      <div className="grid grid-cols-2 gap-2 text-center text-[10px] py-1">
                        <div className="bg-zinc-950 p-2 rounded-lg border border-white/5">
                          <span className="text-zinc-500 block">Reactions Used</span>
                          <span className="text-brand-400 font-bold text-sm">{chatResult.reactions_count} / 3</span>
                        </div>
                        <div className="bg-zinc-950 p-2 rounded-lg border border-white/5">
                          <span className="text-zinc-500 block">Follow-ups Used</span>
                          <span className="text-accent-teal font-bold text-sm">{chatResult.followups_count} / 3</span>
                        </div>
                      </div>
                      <p className="text-zinc-400">{chatResult.summary}</p>
                      <button
                        onClick={() => setStep(5)}
                        className="w-full mt-2 bg-brand-500 hover:bg-brand-600 text-white py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Proceed to Mini-Quiz
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button 
              onClick={() => {
                if (activity2SubStep === "2C") setActivity2SubStep("2B");
                else if (activity2SubStep === "2B") setActivity2SubStep("2A");
                else setStep(3);
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
              <span>Mini‑Quiz: Interaction Check</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 5 of {totalSteps}</span>
          </div>

          {quizBlueprint.length > 0 && quizBlueprint[quizIdx] && (
            <div className="space-y-4 text-left">
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-1">
                <div 
                  className="bg-brand-500 h-full transition-all duration-300"
                  style={{ width: `${((quizIdx + 1) / quizBlueprint.length) * 100}%` }}
                />
              </div>

              <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <p className="text-xs text-zinc-300">{quizBlueprint[quizIdx].question}</p>
              </div>

              {quizBlueprint[quizIdx].options && (
                <div className="flex flex-col gap-2">
                  {quizBlueprint[quizIdx].options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                      disabled={quizChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold font-korean transition ${
                        quizSelectedOpt === opt
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                      } ${quizChecked && opt === quizBlueprint[quizIdx].correct_answer ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${
                        quizChecked && quizSelectedOpt === opt && !quizCorrect ? "border-red-500 bg-red-500/15" : ""
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {quizChecked && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-1">
                  <p className="font-extrabold text-white">{quizCorrect ? "✓ Correct!" : "✗ Incorrect."}</p>
                  <p>{quizBlueprint[quizIdx].explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
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
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    {finishingQuiz ? <Loader2 className="w-3 animate-spin" /> : null}
                    <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(4)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(6)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Skip to Homework <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 6: Homework & Practice */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Homework & Fluency Room</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of {totalSteps}</span>
          </div>

          {/* Homework checklist */}
          <div className="space-y-2.5 text-left">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Recommended Homework Tasks:</span>
            <div className="space-y-2">
              {homeworkItems.map((item) => {
                const isDone = completedHomework[item.id] || false;
                return (
                  <label key={item.id} className="flex items-start gap-3 p-3 bg-zinc-950/60 border border-white/5 rounded-xl cursor-pointer hover:border-white/10 transition">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => handleToggleHomework(item.id, isDone)}
                      className="mt-0.5 rounded border-zinc-800 text-brand-500 focus:ring-brand-500/20"
                    />
                    <div className="text-xs text-zinc-300">
                      <span className="font-extrabold text-white block mb-0.5">{item.id === "hw_b1_flu_1" ? "Task 1: Writing Drill" : item.id === "hw_b1_flu_2" ? "Task 2: Speaking Monologue" : "Task 3: Reflection"}</span>
                      {item.text}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* AI practice button room */}
          <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-left space-y-3">
            <span className="text-[10px] text-brand-400 font-mono uppercase tracking-widest block font-bold">Extra AI Practice Lab</span>
            
            {!practiceSessionId ? (
              <div className="flex justify-between items-center">
                <p className="text-[11px] text-zinc-400 leading-normal max-w-sm">
                  Practice keeping a conversation going with Gwan-Sik. He will chat about his life and evaluate your reactions.
                </p>
                <button
                  onClick={handleStartHomeworkPractice}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-4 rounded-xl transition text-[10px] cursor-pointer"
                >
                  Start Practice Room
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-zinc-950 rounded-xl p-3 border border-white/5 max-h-36 overflow-y-auto space-y-2 custom-scrollbar">
                  {practiceMessages.map((msg, idx) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-xl p-2 text-[10px] leading-relaxed ${
                          isUser ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-300 border border-white/5"
                        }`}>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {practiceSending && (
                    <div className="text-[9px] text-zinc-500 italic">Gwan-Sik is typing...</div>
                  )}
                </div>

                {!practiceFinished ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={practiceText}
                      onChange={(e) => setPracticeText(e.target.value)}
                      placeholder="Respond with reaction & follow-up..."
                      onKeyDown={(e) => e.key === "Enter" && handleSendPracticeTurn()}
                      className="flex-grow bg-zinc-950 border border-white/5 rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-brand-500"
                    />
                    <button
                      onClick={handleSendPracticeTurn}
                      disabled={practiceSending || !practiceText.trim()}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-3 rounded-lg text-[10px] font-bold transition"
                    >
                      Send
                    </button>
                    <button
                      onClick={handleFinishPractice}
                      className="bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-300 px-3 rounded-lg text-[10px] font-bold transition"
                    >
                      End
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-950 rounded-xl border border-brand-500/10 text-[10px] text-zinc-400">
                    <p className="font-bold text-white mb-1">Session Feedback Summary:</p>
                    <p>{practiceResult?.feedback || "Great practice session completed!"}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Phase completion card */}
          <div className="p-5 bg-gradient-to-r from-brand-500/10 to-accent-teal/10 rounded-2xl border border-brand-500/20 text-center space-y-2">
            <div className="flex justify-center items-center gap-1 text-amber-400 font-extrabold text-sm uppercase">
              <Award className="w-5 h-5" />
              <span>Badge Earned: {quizBadge || "Conversation Keeper"}</span>
            </div>
            <p className="text-xs text-zinc-300">
              Congratulations on completing Korean 4.1! Next: Phase 2 – Real‑World Situations (Travel & Errands).
            </p>
            <div className="flex justify-center gap-4 text-xs font-bold pt-1">
              <span className="text-brand-400">XP +150</span>
              <span className="text-zinc-500">|</span>
              <span className="text-accent-teal">Phase 1 Complete</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(5)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button 
              onClick={onComplete}
              className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-accent-teal/20"
            >
              <span>Complete Phase 1</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
