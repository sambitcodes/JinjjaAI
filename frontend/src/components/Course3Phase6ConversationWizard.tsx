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

interface Course3Phase6ConversationWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course3Phase6ConversationWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course3Phase6ConversationWizardProps) {
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

  // Activity 1B states (Choose reply)
  const [replyItems, setReplyItems] = useState<any[]>([]);
  const [replyIdx, setReplyIdx] = useState(0);
  const [selectedReplyOptId, setSelectedReplyOptId] = useState<string | null>(null);
  const [replyChecked, setReplyChecked] = useState(false);
  const [replyCorrect, setReplyCorrect] = useState<boolean | null>(null);

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
  const [showHints, setShowHints] = useState(false);

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
          const res = await apiJson("/lessons/phases/korean2/6/metadata");
          setMetadata(res);
        } else if (step === 2 && !examplesData) {
          const res = await apiJson("/lessons/phases/korean2/6/examples");
          setExamplesData(res);
        } else if (step === 3 && guidedItems.length === 0) {
          const res_g = await apiJson("/lessons/practice/a2-dialogues/guided");
          setGuidedItems(res_g.activity_1a || []);
          setReplyItems(res_g.activity_1b || []);
        } else if (step === 4 && scenarios.length === 0) {
          setScenarios([
            {
              id: "a2_scen_1",
              name: "Talking about your weekday routine",
              description: "Discuss your daily schedule, work/study routines, and habits.",
              turns: "6–10 turns",
              time: "⏱️ ~5 mins"
            },
            {
              id: "a2_scen_2",
              name: "Talking about hobbies and likes",
              description: "Talk about weekend hobbies, preferences, food, and sports.",
              turns: "6–10 turns",
              time: "⏱️ ~5 mins"
            },
            {
              id: "a2_scen_3",
              name: "Talking about last weekend",
              description: "Describe what you did yesterday or last weekend in detail.",
              turns: "6–10 turns",
              time: "⏱️ ~5 mins"
            },
            {
              id: "a2_scen_4",
              name: "Talking about plans for this weekend",
              description: "Describe future plans, schedule times, and destinations.",
              turns: "6–10 turns",
              time: "⏱️ ~5 mins"
            }
          ]);
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/lessons/quiz/korean2/phase-6/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean2/6/homework");
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
      const correctOpt = current.options.find((o: any) => o.id === selectedGuidedOptId);
      const isCorrect = correctOpt ? correctOpt.correct : false;
      await apiJson("/lessons/practice/a2-dialogues/guided/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          option_id: selectedGuidedOptId,
          time_taken_ms: 1000
        })
      });
      setGuidedChecked(true);
      setGuidedCorrect(isCorrect);
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 1B reply selection
  const handleCheckReply = async () => {
    const current = replyItems[replyIdx];
    if (!current || !selectedReplyOptId) return;

    try {
      const correctOpt = current.options.find((o: any) => o.id === selectedReplyOptId);
      const isCorrect = correctOpt ? correctOpt.correct : false;
      await apiJson("/lessons/practice/a2-dialogues/guided/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          option_id: selectedReplyOptId,
          time_taken_ms: 1000
        })
      });
      setReplyChecked(true);
      setReplyCorrect(isCorrect);
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
      const res = await apiJson("/lessons/conversation/a2/session/start", {
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
      const res = await apiJson(`/lessons/conversation/a2/session/${chatSessionId}/turn`, {
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
      const res = await apiJson(`/lessons/conversation/a2/session/${chatSessionId}/end`, { method: "POST" });
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
      setQuizMistakes(prev => [...prev, current.id]);
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
        await apiJson("/lessons/quiz/korean2/phase-6/finish", {
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
      await apiJson("/lessons/phases/korean2/6/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Launch specialized tutor sessions
  const handleLaunchCapstoneTutor = async () => {
    setLoadingTutor(true);
    setTutorSession(null);
    try {
      const res = await apiJson("/lessons/conversation/a2/daily-life-capstone/start", { method: "POST" });
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
              <span>{activeLesson?.title || "Everyday Conversations (A2 Capstone)"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: A2 Capstone Roleplays</p>
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
            <h2 className="text-5xl font-black text-white tracking-tight">Korean 2.6</h2>
            <h3 className="text-xl font-bold text-yellow-400 mt-1">Everyday Conversations (A2 Capstone)</h3>
          </div>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Have longer simple conversations about your daily life, past, and future."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Capstone Goals:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Talk about your daily routines, habits, past activities, and future plans",
                "Ask and answer questions in short social exchanges on familiar topics",
                "Build confidence for real-world conversations at A2"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl mx-auto">
            {["Scenario-based", "A2 Fluency", "Interactive Tutor", "Daily Life"].map(chip => (
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
              <p>✓ Activity 1 – Guided dialogue line completion and replies</p>
              <p>✓ Activity 2 – Semi-free A2 conversation scenarios with Gwan-Sik</p>
              <p>✓ Activity 3 – Conversation Strategy Quiz</p>
              <p>✓ Activity 4 – Homework & AI capstone practice</p>
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
              <span>A2 Conversation Skills</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          {/* Simple English Note */}
          <div className="bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/15 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">What you can do at A2:</p>
            <p className="italic">
              "At A2, you can handle simple conversations about daily topics like family, work, hobbies, and plans if the other person helps and speaks slowly. In this phase, you’ll practice exactly that."
            </p>
          </div>

          {/* Blueprint Card */}
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-3">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Conversation Blueprint (A2)</span>
            
            <div className="flex items-center justify-between gap-2 text-center text-xs">
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 flex-grow">
                <span className="font-bold text-white block mb-0.5">Start</span>
                <span className="text-[9px] text-zinc-400">Greeting & Check-in</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500" />
              <div className="p-3 bg-zinc-950 rounded-xl border border-yellow-500/20 flex-grow">
                <span className="font-bold text-yellow-400 block mb-0.5">Middle (6-10 turns)</span>
                <span className="text-[9px] text-zinc-400">Routines, Hobbies, Past/Future</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500" />
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 flex-grow">
                <span className="font-bold text-white block mb-0.5">End</span>
                <span className="text-[9px] text-zinc-400">Polite Farewell</span>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal pl-1">
              * Unlike A1, at A2 you should actively ask follow-up questions back!
            </p>
          </div>

          {/* Example Dialogue */}
          {examplesData?.examples?.[0] && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Example A2 Dialogue</span>
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
              <span>Activity 1 – Guided Dialogue Drills</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {/* Part A: Complete the conversation */}
          {guidedItems.length > 0 && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="text-left space-y-1 text-center">
                <span className="text-[9px] text-yellow-400 font-black uppercase tracking-wider block">Part 1A: Complete the Conversation</span>
                <p className="text-[11px] text-zinc-400">{guidedItems[guidedIdx]?.context}</p>
              </div>

              {/* Dialogue flow */}
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
                  <p className="font-extrabold text-white mb-1">{guidedCorrect ? "✓ Correct Choice!" : "✗ Incorrect Choice."}</p>
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
                    Next Question
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Part B: Choose learner reply */}
          {replyItems.length > 0 && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="text-left space-y-1 text-center">
                <span className="text-[9px] text-yellow-400 font-black uppercase tracking-wider block">Part 1B: Choose the Learner's Reply</span>
                <p className="text-xs text-white font-bold font-korean mt-1">"{replyItems[replyIdx]?.question}"</p>
              </div>

              <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
                {replyItems[replyIdx]?.options.map((opt: any) => (
                  <button
                    key={opt.id}
                    onClick={() => !replyChecked && setSelectedReplyOptId(opt.id)}
                    disabled={replyChecked}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                      selectedReplyOptId === opt.id
                        ? "border-yellow-500 bg-yellow-500/10 text-white"
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    } ${replyChecked && opt.correct ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>

              {replyChecked && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 max-w-sm mx-auto text-left">
                  <p className="font-extrabold text-white mb-1">{replyCorrect ? "✓ Correct Response!" : "✗ Incorrect Response."}</p>
                  <p>{replyItems[replyIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!replyChecked ? (
                  <button
                    onClick={handleCheckReply}
                    disabled={!selectedReplyOptId}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Reply
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setReplyChecked(false);
                      setSelectedReplyOptId(null);
                      setReplyCorrect(null);
                      if (replyIdx < replyItems.length - 1) {
                        setReplyIdx(replyIdx + 1);
                      } else {
                        setReplyIdx(0);
                      }
                    }}
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
              <span>Activity 2 – A2 Semi-Free Roleplay</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          {!selectedScenarioId ? (
            /* Scenario selector view */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-black text-white">Select an A2 Conversation Topic</h3>
                <p className="text-xs text-zinc-500">Engage in a structured 6–10 turn conversation with tutor Gwan-Sik.</p>
              </div>

              <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                {scenarios.map((scen) => (
                  <button
                    key={scen.id}
                    onClick={() => handleStartChatSession(scen.id)}
                    className="p-4 rounded-2xl border border-white/5 bg-zinc-950 hover:bg-zinc-900 text-left transition flex justify-between items-center group"
                  >
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white group-hover:text-yellow-400 transition">{scen.name}</span>
                        <span className="text-[9px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/20 font-mono">A2</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-normal">{scen.description}</p>
                      <div className="flex gap-3 text-[10px] text-zinc-500 pt-1 font-mono">
                        <span>{scen.turns}</span>
                        <span>{scen.time}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-yellow-400 shrink-0 transition" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Stateful chat view */
            <div className="space-y-4 max-w-xl mx-auto w-full flex-grow flex flex-col justify-between">
              
              {/* Scenario description header */}
              <div className="flex justify-between items-center p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-xl text-[11px] text-zinc-300">
                <div className="space-y-0.5">
                  <span className="font-black text-yellow-400 block">Topic: {scenarios.find(s => s.id === selectedScenarioId)?.name}</span>
                  <p className="text-[10px] text-zinc-400">{scenarios.find(s => s.id === selectedScenarioId)?.description}</p>
                </div>
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-white/5 hover:border-white/10 text-[9px] font-black tracking-wide cursor-pointer transition shrink-0"
                >
                  {showHints ? "Hide Hints" : "Show Hints"}
                </button>
              </div>

              {/* Hints Box */}
              {showHints && (
                <div className="bg-zinc-950 p-3 rounded-xl border border-yellow-500/20 text-xs text-zinc-300 space-y-1 animate-fade-in text-left">
                  <p className="font-bold text-yellow-400">💡 Useful Patterns to Try:</p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1 text-[11px]">
                    <li>Routines: <span className="text-zinc-200">보통 평일에... ~(으)러 가요</span></li>
                    <li>Hobbies: <span className="text-zinc-200">~는 것을 좋아해요 / ~을 잘해요</span></li>
                    <li>Past: <span className="text-zinc-200">어제/지난 주말에 ~았/었어요</span></li>
                    <li>Future: <span className="text-zinc-200">내일/이번 주말에 ~(으)ㄹ 거예요</span></li>
                    <li>Asking back: <span className="text-zinc-200">선생님은요? / 관식 씨는 주말에 뭐 해요?</span></li>
                  </ul>
                </div>
              )}

              {/* Chat messages box */}
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
                        <div className="flex justify-between items-center gap-4 mb-0.5">
                          <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">
                            {msg.sender === "user" ? "You" : "Gwan-Sik"}
                          </span>
                          {msg.sender === "assistant" && (
                            <button onClick={() => playAudio(msg.text)} className="text-zinc-500 hover:text-white transition">
                              <Volume2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="font-korean font-bold text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}
                {sendingTurn && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-500 text-[10px] animate-pulse">
                      Gwan-Sik is typing...
                    </div>
                  </div>
                )}
              </div>

              {/* Scaffold suggestions */}
              {!chatEnded && (
                <div className="space-y-2">
                  <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block text-left">Suggested Sentence Chips:</span>
                  <div className="flex flex-wrap gap-1.5 justify-start">
                    {[
                      "지난 주말에 친구를 만났어요.",
                      "보통 아침 일곱 시에 일어나요.",
                      "주말에 등산을 갈 거예요.",
                      "저는 음악 듣는 것을 좋아해요.",
                      "선생님은 주말에 뭐 해요?"
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
              <span>Mini-Quiz: A2 Capstone Strategy</span>
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
                      {["집", "학교", "회사", "카페", "주말", "어제", "내일", "보통"].map(ch => (
                        <button
                          key={ch}
                          onClick={() => setQuizWritingAns(v => v + ch)}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded border border-white/5 text-xs text-white"
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
                    disabled={quizBlueprint[quizIdx]?.type === "writing" ? !quizWritingAns.trim() : !quizSelectedOpt}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 font-bold px-6 py-2 rounded-xl text-xs cursor-pointer transition"
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

      {/* Screen 6: Homework & Extra capstone rooms */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/25 w-fit mx-auto text-yellow-400 shrink-0 animate-bounce">
            <Trophy className="w-10 h-10" />
          </div>

          <h2 className="text-5xl font-black text-white tracking-tight">Course 3 Completed!</h2>
          <p className="text-xs text-zinc-400 font-mono">Badge Earned: A2 Conversationalist (150 XP rewarded)</p>

          <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Capstone Homework Checklist:</span>
            <div className="space-y-2.5">
              {homeworkItems.map((item) => {
                const isChecked = !!completedHomework[item.id];
                return (
                  <label key={item.id} className="flex items-start gap-3 cursor-pointer group text-xs text-zinc-300 select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleHomework(item.id, isChecked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/10 bg-zinc-950 text-yellow-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className={`group-hover:text-white transition ${isChecked ? "line-through text-zinc-500" : ""}`}>{item.text}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* AI Capstone Room launcher */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <div className="space-y-0.5">
              <span className="text-[9px] text-yellow-400 font-black uppercase tracking-wider block">AI Conversation Capstone Playground:</span>
              <p className="text-[11px] text-zinc-400 leading-normal">Challenge yourself by discussing past weekend activities and future plans in a single integrated practice session.</p>
            </div>
            
            {tutorSession ? (
              <div className="p-4 bg-zinc-900 border border-yellow-500/20 rounded-xl space-y-2 text-xs">
                <p className="font-extrabold text-white">Stateful Session Active!</p>
                <p className="font-korean text-zinc-200">Gwan-Sik: "{tutorSession.opener}"</p>
                <button
                  onClick={() => window.location.href = `/tutor?session_id=${tutorSession.session_id}`}
                  className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-1.5 px-4 rounded-lg text-[10px] cursor-pointer transition flex items-center gap-1"
                >
                  <span>Enter Capstone Practice Room</span>
                  <ArrowRight className="w-3 h-3 text-zinc-950" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLaunchCapstoneTutor}
                disabled={loadingTutor}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition flex items-center justify-center gap-2"
              >
                {loadingTutor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                <span>Practice Daily Life Capstone with AI</span>
              </button>
            )}
          </div>

          <div className="pt-2">
            <button 
              onClick={onComplete}
              className="bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 hover:from-yellow-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-yellow-500/20 cursor-pointer w-full max-w-xs"
            >
              <span>Continue to Korean 3 (A2→B1)</span>
              <ChevronRight className="w-4 h-4 text-zinc-950" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
