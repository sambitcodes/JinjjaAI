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
  Send,
  HelpCircle,
  Trophy,
  Star
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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

interface Course2Phase6ConversationWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course2Phase6ConversationWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course2Phase6ConversationWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [useVoiceMode, setUseVoiceMode] = useState(false);
  const totalSteps = 6;

  // DB Data loaded
  const [metadata, setMetadata] = useState<any>(null);
  const [examplesData, setExamplesData] = useState<any>(null);

  // Activity 1A states (Guided choice)
  const [guidedItems, setGuidedItems] = useState<any[]>([]);
  const [guidedIdx, setGuidedIdx] = useState(0);
  const [selectedGuidedOptId, setSelectedGuidedOptId] = useState<string | null>(null);
  const [guidedChecked, setGuidedChecked] = useState(false);
  const [guidedCorrect, setGuidedCorrect] = useState<boolean | null>(null);

  // Activity 1B states (Order Scrambled)
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderIdx, setOrderIdx] = useState(0);
  const [userOrderedIndices, setUserOrderedIndices] = useState<number[]>([]);
  const [orderChecked, setOrderChecked] = useState(false);
  const [orderCorrect, setOrderCorrect] = useState<boolean | null>(null);

  // Activity 2 states (Semi-free Chat)
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatOpener, setChatOpener] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingTurn, setSendingTurn] = useState(false);
  const [chatEnded, setChatEnded] = useState(false);
  const [chatFeedback, setChatFeedback] = useState("");

  // Quiz states
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizWritingAns, setQuizWritingAns] = useState("");
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Homework check states
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Tutor launchers
  const [loadingTutor, setLoadingTutor] = useState(false);
  const [tutorSession, setTutorSession] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/lessons/phases/korean1/6/metadata");
          setMetadata(res);
        } else if (step === 2 && !examplesData) {
          const res = await apiJson("/lessons/phases/korean1/6/examples");
          setExamplesData(res);
        } else if (step === 3 && guidedItems.length === 0) {
          const res_g = await apiJson("/practice/dialogues/guided");
          const res_o = await apiJson("/practice/dialogues/order");
          setGuidedItems(res_g.items || []);
          setOrderItems(res_o.items || []);
        } else if (step === 4 && scenarios.length === 0) {
          // Scenarios fetched dynamically
          const res = await apiJson("/lessons/phases/korean1/6/metadata"); // reuse same config or mock scen
          setScenarios([
            {
              id: "a1_scen_1",
              name: "Meeting for the first time",
              description: "Greet the tutor, introduce your name and origin, and answer one question about your day."
            },
            {
              id: "a1_scen_2",
              name: "Talking about your day",
              description: "Talk about when you wake up, study, or go home today."
            },
            {
              id: "a1_scen_3",
              name: "Talking about where you are/going",
              description: "Say where you are currently located and where you are heading next."
            }
          ]);
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/quiz/korean1/phase-6/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean1/6/homework");
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

  // Activity 1A choice submission
  const handleCheckGuided = async () => {
    const current = guidedItems[guidedIdx];
    if (!current || !selectedGuidedOptId) return;

    try {
      const res = await apiJson("/practice/dialogues/guided/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_option_id: selectedGuidedOptId,
          time_taken_ms: 1000
        })
      });
      setGuidedChecked(true);
      setGuidedCorrect(res.correct);
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 1B Order submission
  const handleToggleOrderSelection = (lineIdx: number) => {
    if (orderChecked) return;
    if (userOrderedIndices.includes(lineIdx)) {
      setUserOrderedIndices(userOrderedIndices.filter(i => i !== lineIdx));
    } else {
      setUserOrderedIndices([...userOrderedIndices, lineIdx]);
    }
  };

  const handleCheckOrder = async () => {
    const current = orderItems[orderIdx];
    if (!current) return;

    // Check if the order matches scrambled_lines indices correctly
    // The correct order is given in correct_order. We check if user indices sequence is [0, 1, 2, 3...]
    let isCorrect = true;
    if (userOrderedIndices.length !== current.scrambled_lines.length) {
      isCorrect = false;
    } else {
      for (let i = 0; i < userOrderedIndices.length; i++) {
        const userLine = current.scrambled_lines[userOrderedIndices[i]];
        const correctLine = current.correct_order[i];
        if (userLine.ko !== correctLine.ko) {
          isCorrect = false;
          break;
        }
      }
    }

    try {
      await apiJson("/practice/dialogues/order/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          correct: isCorrect,
          time_taken_ms: 2000
        })
      });
      setOrderChecked(true);
      setOrderCorrect(isCorrect);
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 2: Launch AI Dialogue Session
  const handleStartChatSession = async (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setLoadingChat(true);
    setChatMessages([]);
    setChatEnded(false);
    setChatFeedback("");
    try {
      const res = await apiJson("/conversation/a1/session/start", {
        method: "POST",
        body: JSON.stringify({
          scenario_id: scenarioId,
          mode: useVoiceMode ? "voice" : "text"
        })
      });
      setChatSessionId(res.session_id);
      setChatOpener(res.opener);
      setChatMessages([{ sender: "assistant", text: res.opener }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSendChatTurn = async () => {
    if (!chatInput.trim() || !chatSessionId) return;
    const userText = chatInput.trim();
    setChatInput("");
    setSendingTurn(true);
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);

    try {
      const res = await apiJson(`/conversation/a1/session/${chatSessionId}/turn`, {
        method: "POST",
        body: JSON.stringify({ user_text: userText })
      });
      setChatMessages(prev => [...prev, { sender: "assistant", text: res.reply }]);
      if (useVoiceMode) {
        playAudio(res.reply);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingTurn(false);
    }
  };

  const handleEndChatSession = async () => {
    if (!chatSessionId) return;
    try {
      const res = await apiJson(`/conversation/a1/session/${chatSessionId}/end`, { method: "POST" });
      setChatFeedback(res.feedback);
      setChatEnded(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Quiz check
  const handleCheckQuiz = () => {
    const current = quizBlueprint[quizIdx];
    if (!current) return;

    let isCorrect = false;
    if (current.type === "listening" || current.type === "context") {
      isCorrect = quizSelectedOpt === current.correct_answer;
    } else {
      isCorrect = quizWritingAns.trim().toLowerCase() === current.correct_answer.trim().toLowerCase();
    }

    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    if (!isCorrect) {
      setQuizMistakes(prev => [...prev, current.correct_answer]);
    }
  };

  const handleNextQuizOrComplete = async () => {
    if (quizIdx < quizBlueprint.length - 1) {
      setQuizIdx(quizIdx + 1);
      setQuizSelectedOpt(null);
      setQuizWritingAns("");
      setQuizChecked(false);
      setQuizCorrect(null);
    } else {
      setFinishingQuiz(true);
      try {
        const correctCount = quizBlueprint.length - quizMistakes.length;
        const score = Math.round((correctCount / quizBlueprint.length) * 100);
        await apiJson("/quiz/korean1/phase-6/finish", {
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
      await apiJson("/lessons/phases/korean1/6/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Launch specialized tutor sessions
  const handleLaunchTutor = async (topic: "selfintro" | "routine") => {
    setLoadingTutor(true);
    setTutorSession(null);
    try {
      const path = topic === "selfintro" 
        ? "/conversation/a1/selfintro-practice/start" 
        : "/conversation/a1/routine-practice/start";
      const res = await apiJson(path, { method: "POST" });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

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
              <span>{activeLesson?.title || "Everyday Conversations"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Integrated Dialogue Checks</p>
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
          
          <div>
            <h2 className="text-5xl font-black text-white tracking-tight">Korean 1.6</h2>
            <h3 className="text-xl font-bold text-yellow-400 mt-1">Everyday Conversations (Capstone)</h3>
          </div>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Use your Korean to handle short, simple conversations about daily life."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Capstone Goals:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Combine greetings, self-intro, numbers, routines, and places",
                "Practice 3–5-turn conversations on familiar topics (home, daily life, plans)",
                "Build confidence for your first real conversations in Korean"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl mx-auto">
            {["Scenario-based", "A1 Fluency", "Roleplay Tasks", "Daily Life"].map(chip => (
              <span key={chip} className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[10px] text-yellow-300 font-bold">{chip}</span>
            ))}
          </div>

          {/* Mode Selector */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full space-y-3 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">⏱️ Estimated Time</span>
              <span className="text-xs font-bold text-zinc-300">{metadata?.estimated_minutes || 25} minutes</span>
            </div>
            <div className="border-t border-white/[0.03] pt-3 space-y-2">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Conversation Mode</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setUseVoiceMode(false)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                    !useVoiceMode 
                      ? "border-yellow-500 bg-yellow-500/10 text-white" 
                      : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                  }`}
                >
                  Text only
                </button>
                <button
                  onClick={() => setUseVoiceMode(true)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    useVoiceMode 
                      ? "border-yellow-500 bg-yellow-500/10 text-white" 
                      : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" /> Voice + Text
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => setStep(2)}
              className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/20"
            >
              <Trophy className="w-4 h-4" /> Start Capstone Phase
            </button>
            
          </div>

          {showOutline && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-2 animate-fade-in max-w-2xl mx-auto w-full font-mono">
              <p className="font-extrabold text-white text-center pb-2">Phase Activities Outline</p>
              <p>✓ Activity 1 – Guided dialogue line completion choices</p>
              <p>✓ Activity 2 – Scrambled dialog sequence solver</p>
              <p>✓ Activity 3 – Semi-free A1 AI roleplay coaching</p>
              <p>✓ Activity 4 – Graduating capstone checkpoints</p>
            </div>
          )}
        </div>
      )}

      {/* Screen 2: Concept Explanation */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-yellow-400" />
              <span>What is an A1 Conversation?</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          {/* Simple English Note */}
          <div className="bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/15 text-xs leading-relaxed text-zinc-300">
            <p className="italic">
              "At A1, you can have short conversations about yourself, your day, and places around you when the other person speaks slowly and helps you. That's what we'll practice here."
            </p>
          </div>

          {/* Blueprint Card */}
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-3">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Conversation Blueprint</span>
            
            <div className="flex items-center justify-between gap-2 text-center text-xs">
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 flex-grow">
                <span className="font-bold text-white block mb-0.5">Start</span>
                <span className="text-[10px] text-zinc-400">Greeting + Identity</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500" />
              <div className="p-3 bg-zinc-950 rounded-xl border border-yellow-500/20 flex-grow">
                <span className="font-bold text-yellow-400 block mb-0.5">Middle</span>
                <span className="text-[10px] text-zinc-400">Routine, Time or Place</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500" />
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 flex-grow">
                <span className="font-bold text-white block mb-0.5">End</span>
                <span className="text-[10px] text-zinc-400">Polite Closing</span>
              </div>
            </div>
          </div>

          {/* Example Dialogue */}
          {examplesData?.examples?.[0] && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Example Mini-Dialogue</span>
                <button 
                  onClick={() => playAudio(examplesData.examples[0].dialogue.map((d: any) => d.ko).join(". "))}
                  className="p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white transition flex items-center gap-1 text-[10px] font-bold px-2.5 py-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen to All</span>
                </button>
              </div>

              <div className="bg-zinc-950/60 p-4 rounded-2xl border border-white/5 space-y-3 max-h-48 overflow-y-auto">
                {examplesData.examples[0].dialogue.map((line: any, idx: number) => (
                  <div key={idx} className={`flex gap-3 text-xs ${line.speaker === "Learner" ? "justify-end" : "justify-start"}`}>
                    <div className={`p-3 rounded-2xl max-w-sm ${
                      line.speaker === "Learner" 
                        ? "bg-yellow-500/10 text-white border border-yellow-500/20 text-right" 
                        : "bg-zinc-900 text-zinc-300 border border-white/5 text-left"
                    }`}>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block mb-0.5">{line.speaker}</span>
                      <p className="font-korean font-extrabold text-sm">{line.ko}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{line.en}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Guided Dialogs */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span>Activity 1 – Guided Dialogues</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {/* Guided Items */}
          {guidedItems.length > 0 && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="text-left space-y-1 text-center">
                <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Part A: Complete Dialogue (Next Line)</span>
                <p className="text-[11px] text-zinc-400">{guidedItems[guidedIdx]?.context}</p>
              </div>

              {/* Dialogue Bubble flow */}
              <div className="space-y-2 max-w-md mx-auto">
                {guidedItems[guidedIdx]?.lines.map((line: any, idx: number) => (
                  <div key={idx} className={`flex ${line.speaker === "Learner" ? "justify-end" : "justify-start"}`}>
                    <div className={`p-2.5 rounded-xl text-xs ${
                      line.speaker === "Learner" 
                        ? "bg-yellow-500/10 text-white border border-yellow-500/10" 
                        : "bg-zinc-950 text-zinc-300 border border-white/5"
                    }`}>
                      <p className="font-korean font-bold">{line.ko}</p>
                      <p className="text-[10px] text-zinc-500">{line.en}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-center font-bold text-amber-400">{guidedItems[guidedIdx]?.prompt}</p>

              <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
                {guidedItems[guidedIdx]?.options.map((opt: any) => (
                  <button
                    key={opt.id}
                    onClick={() => !guidedChecked && setSelectedGuidedOptId(opt.id)}
                    disabled={guidedChecked}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                      selectedGuidedOptId === opt.id
                        ? "border-yellow-500 bg-yellow-500/10 text-white"
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    } ${guidedChecked && opt.correct ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>

              {guidedChecked && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 max-w-sm mx-auto text-left">
                  <p className="font-extrabold text-white mb-1">{guidedCorrect ? "Correct Continuation!" : "Incorrect Continuation."}</p>
                  <p>{guidedItems[guidedIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!guidedChecked ? (
                  <button
                    onClick={handleCheckGuided}
                    disabled={!selectedGuidedOptId}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Line
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setGuidedChecked(false);
                      setSelectedGuidedOptId(null);
                      setGuidedCorrect(null);
                      if (guidedIdx < guidedItems.length - 1) {
                        setGuidedIdx(guidedIdx + 1);
                      } else {
                        setGuidedIdx(0);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next guided item
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Part B: Scrambled solver */}
          {orderItems.length > 0 && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="text-left space-y-1 text-center">
                <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Part B: Dialogue Scramble (Sort Sequence)</span>
                <p className="text-[11px] text-zinc-400">Click lines in order to assemble a natural conversation:</p>
              </div>

              {/* Scrambled selection pool */}
              <div className="space-y-2 max-w-md mx-auto">
                {orderItems[orderIdx]?.scrambled_lines.map((line: any, idx: number) => {
                  const selectionOrder = userOrderedIndices.indexOf(idx);
                  const isSelected = selectionOrder !== -1;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleToggleOrderSelection(idx)}
                      disabled={orderChecked}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                        isSelected 
                          ? "border-yellow-500 bg-yellow-500/10 text-white" 
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="font-korean">{line.ko}</p>
                        <p className="text-[10px] text-zinc-500 font-normal">{line.en}</p>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-yellow-500 text-zinc-950 font-black flex items-center justify-center text-[10px]">
                          {selectionOrder + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* User ordered preview */}
              {userOrderedIndices.length > 0 && (
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1 text-xs text-left max-w-md mx-auto">
                  <span className="text-[8px] text-zinc-500 uppercase block font-black mb-1">Your Ordered dialogue Preview:</span>
                  {userOrderedIndices.map((idx, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-yellow-400 font-bold font-mono">{i + 1}.</span>
                      <span className="text-zinc-300 font-korean">{orderItems[orderIdx]?.scrambled_lines[idx]?.ko}</span>
                    </div>
                  ))}
                </div>
              )}

              {orderChecked && (
                <div className={`p-3 rounded-xl border text-xs text-center max-w-md mx-auto ${
                  orderCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  {orderCorrect ? "Order is perfect!" : "Incorrect order. Read dialogues from greetings to closing statements."}
                </div>
              )}

              <div className="flex justify-between max-w-md mx-auto items-center">
                <button
                  onClick={() => {
                    setUserOrderedIndices([]);
                    setOrderChecked(false);
                    setOrderCorrect(null);
                  }}
                  disabled={orderChecked}
                  className="text-xs text-zinc-500 hover:text-white underline cursor-pointer"
                >
                  Reset Sequence
                </button>

                {!orderChecked ? (
                  <button
                    onClick={handleCheckOrder}
                    disabled={userOrderedIndices.length !== orderItems[orderIdx]?.scrambled_lines.length}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Submit Sequence
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setOrderChecked(false);
                      setOrderCorrect(null);
                      setUserOrderedIndices([]);
                      if (orderIdx < orderItems.length - 1) {
                        setOrderIdx(orderIdx + 1);
                      } else {
                        setOrderIdx(0);
                      }
                    }}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next Scramble item
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(2)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 2: Semi-Free Chat */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-yellow-400" />
              <span>Activity 2 – Semi-Free Roleplay</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          {!selectedScenarioId ? (
            /* Scenario selector view */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-black text-white">Select a Practice Scenario</h3>
                <p className="text-xs text-zinc-500">Practice basic conversations in controlled settings.</p>
              </div>

              <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                {scenarios.map((scen) => (
                  <button
                    key={scen.id}
                    onClick={() => handleStartChatSession(scen.id)}
                    className="p-4 rounded-2xl border border-white/5 bg-zinc-950 hover:bg-zinc-900 text-left transition flex justify-between items-center"
                  >
                    <div className="space-y-1 pr-4">
                      <span className="font-extrabold text-sm text-white">{scen.name}</span>
                      <p className="text-xs text-zinc-400 leading-normal">{scen.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-yellow-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Stateful chat view */
            <div className="space-y-4 max-w-xl mx-auto w-full flex-grow flex flex-col justify-between">
              
              {/* Scenario target description header */}
              <div className="p-3.5 bg-yellow-500/5 border border-yellow-500/15 rounded-xl text-[11px] text-zinc-300">
                <span className="font-black text-yellow-400 block mb-0.5">Active Scenario Target:</span>
                <p>{scenarios.find(s => s.id === selectedScenarioId)?.description}</p>
              </div>

              {/* Chat turns scrollarea */}
              <div className="bg-zinc-950/80 rounded-2xl border border-white/5 p-4 space-y-3 h-64 overflow-y-auto flex flex-col justify-start">
                {loadingChat ? (
                  <div className="text-center py-10 my-auto"><Loader2 className="w-6 h-6 animate-spin mx-auto text-yellow-400" /></div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`p-3 rounded-2xl text-xs max-w-[80%] ${
                        msg.sender === "user" 
                          ? "bg-yellow-500/10 text-white border border-yellow-500/20 text-right" 
                          : "bg-zinc-900 text-zinc-300 border border-white/5 text-left"
                      }`}>
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block mb-0.5">
                          {msg.sender === "user" ? "You" : "Gwan-Sik"}
                        </span>
                        <p className="font-korean font-bold text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}
                {sendingTurn && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-500 text-[10px] animate-pulse">
                      Gwan-Sik is replying...
                    </div>
                  </div>
                )}
              </div>

              {/* Scaffold phrase chips */}
              {!chatEnded && (
                <div className="space-y-2">
                  <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block text-left">Scaffold phrase Suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "안녕하세요, 저는 영우예요.",
                      "미국 사람이에요.",
                      "집에 있어요.",
                      "학교에 가요.",
                      "공부해요."
                    ].map(phrase => (
                      <button
                        key={phrase}
                        onClick={() => setChatInput(phrase)}
                        className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-white/5 text-[10px] font-bold text-zinc-300 cursor-pointer"
                      >
                        {phrase}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat action controls */}
              {chatEnded ? (
                <div className="bg-zinc-950 p-4 rounded-xl border border-yellow-500/25 space-y-3 text-center">
                  <span className="text-[10px] text-yellow-400 font-black uppercase tracking-wider block">Session completed Feedback</span>
                  <p className="text-xs text-zinc-300 leading-normal">{chatFeedback}</p>
                  <button
                    onClick={() => {
                      setSelectedScenarioId(null);
                      setChatSessionId(null);
                      setChatMessages([]);
                    }}
                    className="bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-xs text-white font-bold py-1.5 px-4 rounded-lg cursor-pointer transition"
                  >
                    Select Another Scenario
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your reply in Korean..."
                    className="flex-grow bg-zinc-950 p-3 rounded-xl border border-white/5 text-xs text-white outline-none focus:border-yellow-500 font-sans"
                    onKeyDown={(e) => e.key === "Enter" && handleSendChatTurn()}
                    disabled={sendingTurn || loadingChat}
                  />
                  <button
                    onClick={handleSendChatTurn}
                    disabled={sendingTurn || loadingChat || !chatInput.trim()}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 p-3 rounded-xl transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleEndChatSession}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    End Chat
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button 
              onClick={() => {
                if (selectedScenarioId) {
                  setSelectedScenarioId(null);
                  setChatSessionId(null);
                  setChatMessages([]);
                } else {
                  setStep(3);
                }
              }} 
              className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(5)} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Mini-Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Mini-Quiz Checkpoint */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              <span>Mini-Quiz: A1 Conversations Check</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Question {quizIdx + 1} of {quizBlueprint.length}</span>
          </div>

          {quizBlueprint.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-yellow-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Question Prompt</span>
                <p className="font-extrabold text-white text-base mt-1">{quizBlueprint[quizIdx]?.question}</p>
              </div>

              {quizBlueprint[quizIdx]?.type === "listening" && (
                <div className="text-center space-y-4">
                  <button 
                    onClick={() => playAudio(quizBlueprint[quizIdx]?.correct_answer)}
                    className="p-5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full mx-auto transition flex items-center justify-center cursor-pointer"
                  >
                    <Volume2 className="w-8 h-8" />
                  </button>
                  <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                    {quizBlueprint[quizIdx]?.options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                        disabled={quizChecked}
                        className={`p-3 rounded-xl border text-xs font-bold transition ${
                          quizSelectedOpt === opt
                            ? "border-yellow-500 bg-yellow-500/10 text-white"
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                        } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10" : ""}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {quizBlueprint[quizIdx]?.type === "context" && (
                <div className="grid grid-cols-1 gap-2">
                  {quizBlueprint[quizIdx]?.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                      disabled={quizChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                        quizSelectedOpt === opt
                          ? "border-yellow-500 bg-yellow-500/10 text-white"
                          : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                      } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10 text-white" : ""}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {quizBlueprint[quizIdx]?.type === "writing" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={quizWritingAns}
                    disabled={quizChecked}
                    onChange={(e) => setQuizWritingAns(e.target.value)}
                    placeholder="Type the exact Hangeul block..."
                    className="w-full bg-zinc-950 p-4 rounded-xl border border-white/5 text-center text-lg font-black text-white focus:outline-none focus:border-yellow-500 font-sans"
                  />
                  {!quizChecked && (
                    <div className="flex gap-1.5 justify-center flex-wrap pt-2">
                      {["집", "학교", "회사", "카페", "식당", "안녕하세요", "감사합니다", "어느 나라", "사람"].map(ch => (
                        <button
                          key={ch}
                          onClick={() => setQuizWritingAns(v => v + ch)}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-855 rounded border border-white/5 text-xs text-white"
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {quizChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1.5 ${
                  quizCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold">{quizCorrect ? "Correct!" : "Incorrect."}</p>
                  <p><strong>Explanation:</strong> {quizBlueprint[quizIdx]?.explanation}</p>
                  {!quizCorrect && <p className="font-mono mt-1 text-zinc-400">Correct Answer: {quizBlueprint[quizIdx]?.correct_answer}</p>}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div />
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={
                      (quizBlueprint[quizIdx]?.type === "listening" || quizBlueprint[quizIdx]?.type === "context") 
                        ? !quizSelectedOpt 
                        : !quizWritingAns.trim()
                    }
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Checkpoint
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {finishingQuiz ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Submit Quiz & See Score"}</span>
                        <ChevronRight className="w-4 h-4 text-zinc-950" />
                      </>
                    )}
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
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Course Complete! 🇰🇷🎓🎉</h2>
            <p className="text-zinc-400 text-xs">You scored {quizScore}% on your conversation checks! XP Awarded: **150 XP**.</p>
            <p className="text-yellow-400 text-sm font-extrabold mt-1">Korean 1: Everyday Basics — Completed!</p>
          </div>

          {/* Practical Checklist Homework */}
          <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 text-left space-y-3">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Homework Checklist Tasks</span>
            <div className="space-y-2">
              {homeworkItems.map((hw) => {
                const isChecked = !!completedHomework[hw.id];
                return (
                  <div 
                    key={hw.id}
                    onClick={() => handleToggleHomework(hw.id, isChecked)}
                    className="flex items-center gap-3 p-3 bg-zinc-950/80 rounded-xl border border-white/5 cursor-pointer hover:bg-zinc-900 transition"
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                      isChecked ? "border-emerald-500 bg-emerald-500/15 text-emerald-400" : "border-white/10 bg-zinc-900"
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-xs text-zinc-300 ${isChecked ? "line-through text-zinc-500" : ""}`}>{hw.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI practice modes */}
          <div className="p-5 bg-zinc-900/60 rounded-2xl border border-white/5 space-y-4">
            <div className="text-left space-y-1">
              <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider block">Special AI Practice Rooms</span>
              <h4 className="text-xs font-bold text-white">Refine conversational topics with Gwan-Sik</h4>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Select a topic room to start stateful social exchanges in simple A1 terms.
              </p>
            </div>

            {tutorSession ? (
              <div className="bg-zinc-950 p-4 rounded-xl border border-yellow-500/25 text-left space-y-2">
                <span className="text-[9px] font-black text-yellow-400 uppercase tracking-wider block">Coach Active Session</span>
                <p className="text-xs italic text-zinc-300 font-serif">"{tutorSession.opener}"</p>
                <div className="flex justify-end pt-1">
                  <a 
                    href={`/tutor?session=${tutorSession.session_id}`}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black px-3 py-1.5 rounded-lg text-[10px] transition"
                  >
                    Enter Chat Room
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleLaunchTutor("selfintro")}
                  disabled={loadingTutor}
                  className="bg-zinc-950 hover:bg-zinc-900 border border-yellow-500/20 text-yellow-400 hover:text-yellow-300 font-bold px-3 py-2 rounded-xl text-[10px] transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Start Self-Intro Chat</span>
                </button>
                <button
                  onClick={() => handleLaunchTutor("routine")}
                  disabled={loadingTutor}
                  className="bg-zinc-950 hover:bg-zinc-900 border border-yellow-500/20 text-yellow-400 hover:text-yellow-300 font-bold px-3 py-2 rounded-xl text-[10px] transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Start Routine Chat</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onComplete}
            className="bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 hover:from-yellow-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-yellow-500/20 cursor-pointer w-full max-w-xs"
          >
            <span>Complete Course & Earn XP</span>
            <ChevronRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      )}
      
      {/* Navigation bottom controls for non-quiz screens */}
      {step < 5 && step > 1 && (
        <div className="flex justify-between items-center py-4 border-t border-white/5 mt-6">
          <button 
            onClick={() => setStep(step - 1)} 
            className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button 
            onClick={() => setStep(step + 1)} 
            className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
