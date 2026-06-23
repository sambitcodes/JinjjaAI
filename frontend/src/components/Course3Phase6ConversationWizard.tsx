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

interface Course3Phase6ConversationWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

interface MicroQuestion {
  question: string;
  options: { id: string; text: string }[];
  correctId: string;
  explanation: string;
}

export default function Course3Phase6ConversationWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course3Phase6ConversationWizardProps) {
  const getStepMaxXP = (sNum: number) => {
    if (sNum === 1) return 0;
    if (sNum === 9) return 200;
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
    const savedStep = localStorage.getItem("hangeulai_c3p6_step");
    const savedMax = localStorage.getItem("hangeulai_c3p6_max_step");
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
      localStorage.setItem("hangeulai_c3p6_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const [useVoiceMode, setUseVoiceMode] = useState(false);
  const totalSteps = 9;

  // Persist progress to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c3p6_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 9) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c3p6_step", String(step));
  }, [step]);

  // DB Data loaded
  const [metadata, setMetadata] = useState<any>(null);
  const [examplesData, setExamplesData] = useState<any>(null);

  // Concept Micro-questions states
  const [cSelected, setCSelected] = useState<string | null>(null);
  const [cChecked, setCChecked] = useState(false);
  const [cCorrect, setCCorrect] = useState<boolean | null>(null);
  const [cIdx, setCIdx] = useState(0);

  // Reset concept states on step change
  useEffect(() => {
    if (step >= 2 && step <= 4) {
      setCSelected(null);
      setCChecked(false);
      setCCorrect(null);
      setCIdx(0);
    }
  }, [step]);

  // Concept questions definition
  const conceptQuestions: Record<number, MicroQuestion[]> = {
    2: [
      {
        question: "Which is more A2-like?",
        options: [
          { id: "A", text: "Only answering questions" },
          { id: "B", text: "Answering and sometimes asking a question back" }
        ],
        correctId: "B",
        explanation: "At the A2 level, you should actively show conversational initiative by asking questions back to keep the dialogue flowing."
      }
    ],
    3: [
      {
        question: "If someone says '저는 영화를 좋아해요', what's a natural follow-up question?",
        options: [
          { id: "A", text: "영화 자주 봐요? (Do you watch movies often?)" },
          { id: "B", text: "어제 책을 읽었어요. (Yesterday I read a book.)" }
        ],
        correctId: "A",
        explanation: "'영화 자주 봐요?' is a logical follow-up question that continues the topic of movies naturally."
      }
    ],
    4: [
      {
        question: "Which topics could naturally appear together in one conversation?",
        options: [
          { id: "A", text: "Yesterday's activities and next week's plans" },
          { id: "B", text: "Only today, never past or future" }
        ],
        correctId: "A",
        explanation: "A2 conversations allow you to transition naturally between tenses, linking yesterday's events to plans for next week."
      }
    ]
  };

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

  // Sounds & XP dispatcher
  const playCorrectSound = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 20, type: 'correct' } }));
    }
  };

  const playWrongSound = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: -10, type: 'wrong' } }));
    }
  };

  // APIs loaders
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/lessons/phases/korean2/6/metadata");
          setMetadata(res);
        } else if (step === 2 && !examplesData) {
          const res = await apiJson("/lessons/phases/korean2/6/examples");
          setExamplesData(res);
        } else if ((step === 5 || step === 6) && guidedItems.length === 0) {
          const res_g = await apiJson("/lessons/practice/a2-dialogues/guided");
          setGuidedItems(res_g.activity_1a || []);
          setReplyItems(res_g.activity_1b || []);
        } else if (step === 7 && scenarios.length === 0) {
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
        } else if (step === 8 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/lessons/quiz/korean2/phase-6/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 9 && homeworkItems.length === 0) {
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

  // Concept Checks
  const handleCheckConcept = (selectedId: string) => {
    if (cChecked) return;
    const currentQ = conceptQuestions[step]?.[cIdx];
    if (!currentQ) return;

    setCSelected(selectedId);
    const isCorrect = selectedId === currentQ.correctId;
    setCChecked(true);
    setCCorrect(isCorrect);
    
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  const handleNextConcept = () => {
    const list = conceptQuestions[step] || [];
    if (cIdx < list.length - 1) {
      setCIdx(cIdx + 1);
      setCSelected(null);
      setCChecked(false);
      setCCorrect(null);
    } else {
      setStep(step + 1);
    }
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
      if (isCorrect) playCorrectSound();
      else playWrongSound();
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
      if (isCorrect) playCorrectSound();
      else playWrongSound();
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
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
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
        setStep(9);
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

    const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "Concept 1 – What you can do at A2" },
    { num: 3, label: "Concept 2 – Asking follow-up questions" },
    { num: 4, label: "Concept 3 – Using all Course 3 skills together" },
    { num: 5, label: "Activity 1A – Guided line completion" },
    { num: 6, label: "Activity 1B – Guided replies" },
    { num: 7, label: "Activity 2 – Semi-free A2 conversation scenarios" },
    { num: 8, label: "Activity 3 – Strategy Checkpoint Quiz" },
    { num: 9, label: "Activity 4 – Homework & Stateful Capstone Practice" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 3,
          phaseNum: 6,
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
      {showOutline && (() => {
        const phaseEarnedXP = outlineSteps.reduce((acc, s) => acc + getStepXP(s.num), 0);
        const phaseMaxXP = outlineSteps.reduce((acc, s) => acc + getStepMaxXP(s.num), 0);
        return (
          <div className="mb-6 p-5 bg-zinc-955/80 rounded-3xl border border-white/5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 relative z-30">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 font-mono">Curriculum Syllabus Map</span>
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">Required: 580 XP</span>
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
                      if (courseXP < 400) {
                        window.dispatchEvent(new CustomEvent("hangeulai-warning", {
                          detail: { message: "To start Phase 6, you need at least 400 XP in this course. You currently have " + courseXP + " XP." }
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
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in max-w-3xl mx-auto">
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
              onClick={() => {
    if (courseXP < 400) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 6, you need at least 400 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/20"
            >
              <Trophy className="w-4 h-4" /> Start Capstone Phase
            </button>
          </div>

          
        </div>
      )}

      {/* Concept Screen C1: What you can do at A2 */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-yellow-400" />
              <span>A2 Conversation Skills</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-yellow-500/5 p-5 rounded-xl border border-yellow-500/15 text-xs leading-relaxed text-zinc-300 text-left space-y-3">
            <p className="font-bold text-white text-sm">Mindset Shift: What you can do at A2</p>
            <p className="italic text-zinc-250">
              "At A2, you can handle simple conversations about daily topics like family, work, hobbies, and plans if the other person helps and speaks slowly. In this phase, you’ll practice exactly that."
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-zinc-950 rounded-lg border border-white/5">
                <span className="text-red-400 block font-bold text-[10px] uppercase">A1 (Basics)</span>
                <span className="text-[11px] text-zinc-450">Short responses, mostly answering, limited tenses.</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-lg border border-yellow-500/10">
                <span className="text-yellow-400 block font-bold text-[10px] uppercase">A2 (Everyday Life)</span>
                <span className="text-[11px] text-zinc-300">Longer conversations, active follow-ups, tenses integration.</span>
              </div>
            </div>
          </div>

          {/* Micro-question */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-4 text-left">
            <h3 className="text-xs text-zinc-500 font-mono uppercase tracking-widest font-black">Micro-Check Question</h3>
            <p className="text-sm font-bold text-white">{conceptQuestions[2][0].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[2][0].options.map((opt) => {
                const isSelected = cSelected === opt.id;
                const isCorrect = opt.id === conceptQuestions[2][0].correctId;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleCheckConcept(opt.id)}
                    disabled={cChecked}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition flex justify-between items-center ${
                      isSelected
                        ? isCorrect
                          ? "border-emerald-500 bg-emerald-500/10 text-white"
                          : "border-red-500 bg-red-500/10 text-white"
                        : cChecked && isCorrect
                        ? "border-emerald-500 bg-emerald-500/10 text-white"
                        : "border-white/5 bg-zinc-900/60 text-zinc-300 hover:border-white/10"
                    }`}
                  >
                    <span>{opt.text}</span>
                    {cChecked && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
            {cChecked && (
              <div className="p-3 bg-zinc-900 rounded-lg text-xs text-zinc-400">
                <p className="font-extrabold text-white mb-1">{cCorrect ? "✓ Correct!" : "✗ Incorrect."}</p>
                <p>{conceptQuestions[2][0].explanation}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            
                  <button
                    type="button"
                    onClick={() => {
                      const qObj = Array.isArray(conceptQuestions[step]) ? conceptQuestions[step][cIdx] : conceptQuestions[step];
                      if (!qObj) return;
                      const selOptText = qObj.options ? (qObj.options.find(o => o.id === cSelected)?.text || qObj.options.find(o => o.text === cSelected)?.text || cSelected) : cSelected;
                      const corrOptText = qObj.options ? (qObj.options.find(o => o.id === qObj.correctId)?.text || qObj.options.find(o => o.text === qObj.correctId)?.text || qObj.correctId) : qObj.correctId;
                      window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                        detail: {
                          question: qObj.question || "Concept Check",
                          selected_answer: String(selOptText || ""),
                          correct_answer: String(corrOptText || ""),
                          is_correct: !!cCorrect,
                          explanation: qObj.explanation || ""
                        }
                      }));
                    }}
                    className="mr-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
                    title="Add this concept summary to your diary notes"
                  >
                    + Add to Notes
                  </button>
                  <button onClick={handleNextConcept} disabled={!cChecked} className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Next Skill <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Concept Screen C2: Asking follow-up questions */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-yellow-400" />
              <span>A2 Conversation Strategy</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          <div className="bg-yellow-500/5 p-5 rounded-xl border border-yellow-500/15 text-xs leading-relaxed text-zinc-300 text-left space-y-3">
            <p className="font-bold text-white text-sm">Asking follow-up questions</p>
            <p className="text-zinc-250">
              In A2, showing conversational interest is key. Try asking a relevant question after providing your answer.
            </p>
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
              <span className="text-[10px] text-zinc-500 font-mono block">Useful Follow-up Patterns:</span>
              <ul className="list-disc list-inside space-y-1.5 text-zinc-350 pl-1 text-[11px]">
                <li><strong className="text-white">“은/는 어때요?”</strong> – How about [noun]?</li>
                <li><strong className="text-white">“주말에 뭐 했어요?”</strong> – What did you do on the weekend?</li>
                <li><strong className="text-white">“다음 주말에 뭐 할 거예요?”</strong> – What will you do next weekend?</li>
              </ul>
            </div>
          </div>

          {/* Micro-question */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-4 text-left">
            <h3 className="text-xs text-zinc-500 font-mono uppercase tracking-widest font-black">Micro-Check Question</h3>
            <p className="text-sm font-bold text-white">{conceptQuestions[3][0].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[3][0].options.map((opt) => {
                const isSelected = cSelected === opt.id;
                const isCorrect = opt.id === conceptQuestions[3][0].correctId;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleCheckConcept(opt.id)}
                    disabled={cChecked}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition flex justify-between items-center ${
                      isSelected
                        ? isCorrect
                          ? "border-emerald-500 bg-emerald-500/10 text-white"
                          : "border-red-500 bg-red-500/10 text-white"
                        : cChecked && isCorrect
                        ? "border-emerald-500 bg-emerald-500/10 text-white"
                        : "border-white/5 bg-zinc-900/60 text-zinc-300 hover:border-white/10"
                    }`}
                  >
                    <span>{opt.text}</span>
                    {cChecked && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
            {cChecked && (
              <div className="p-3 bg-zinc-900 rounded-lg text-xs text-zinc-400">
                <p className="font-extrabold text-white mb-1">{cCorrect ? "✓ Correct!" : "✗ Incorrect."}</p>
                <p>{conceptQuestions[3][0].explanation}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => {
    if (courseXP < 400) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 6, you need at least 400 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            
                  <button
                    type="button"
                    onClick={() => {
                      const qObj = Array.isArray(conceptQuestions[step]) ? conceptQuestions[step][cIdx] : conceptQuestions[step];
                      if (!qObj) return;
                      const selOptText = qObj.options ? (qObj.options.find(o => o.id === cSelected)?.text || qObj.options.find(o => o.text === cSelected)?.text || cSelected) : cSelected;
                      const corrOptText = qObj.options ? (qObj.options.find(o => o.id === qObj.correctId)?.text || qObj.options.find(o => o.text === qObj.correctId)?.text || qObj.correctId) : qObj.correctId;
                      window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                        detail: {
                          question: qObj.question || "Concept Check",
                          selected_answer: String(selOptText || ""),
                          correct_answer: String(corrOptText || ""),
                          is_correct: !!cCorrect,
                          explanation: qObj.explanation || ""
                        }
                      }));
                    }}
                    className="mr-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
                    title="Add this concept summary to your diary notes"
                  >
                    + Add to Notes
                  </button>
                  <button onClick={handleNextConcept} disabled={!cChecked} className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Next Skill <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Concept Screen C3: Using all Course 3 skills together */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-yellow-400" />
              <span>Everyday Life Chats</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          <div className="bg-yellow-500/5 p-5 rounded-xl border border-yellow-500/15 text-xs leading-relaxed text-zinc-300 text-left space-y-3">
            <p className="font-bold text-white text-sm">Putting it all together</p>
            <p className="text-zinc-250">
              This final conversation capstone integrates all components of Course 3:
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10.5px]">
              <div className="p-2.5 bg-zinc-950/80 rounded-lg border border-white/5 text-zinc-300">
                <span className="font-bold text-yellow-400">Routines (3.1 & 3.3)</span>
                <p className="text-zinc-450 mt-0.5">Frequency adverbs + polite past actions (았/었어요).</p>
              </div>
              <div className="p-2.5 bg-zinc-950/80 rounded-lg border border-white/5 text-zinc-300">
                <span className="font-bold text-yellow-400">Preferences (3.2)</span>
                <p className="text-zinc-450 mt-0.5">Likes, dislikes, and expressing reasons (~아서/어서).</p>
              </div>
              <div className="p-2.5 bg-zinc-950/80 rounded-lg border border-white/5 text-zinc-300">
                <span className="font-bold text-yellow-400">Future Plans (3.4)</span>
                <p className="text-zinc-450 mt-0.5">Near future expressions + ~(으)ㄹ 거예요 conjugation.</p>
              </div>
              <div className="p-2.5 bg-zinc-950/80 rounded-lg border border-white/5 text-zinc-300">
                <span className="font-bold text-yellow-400">Stories (3.5)</span>
                <p className="text-zinc-450 mt-0.5">Combining tenses chronologically within a single narrative.</p>
              </div>
            </div>
          </div>

          {/* Micro-question */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-4 text-left">
            <h3 className="text-xs text-zinc-500 font-mono uppercase tracking-widest font-black">Micro-Check Question</h3>
            <p className="text-sm font-bold text-white">{conceptQuestions[4][0].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[4][0].options.map((opt) => {
                const isSelected = cSelected === opt.id;
                const isCorrect = opt.id === conceptQuestions[4][0].correctId;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleCheckConcept(opt.id)}
                    disabled={cChecked}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition flex justify-between items-center ${
                      isSelected
                        ? isCorrect
                          ? "border-emerald-500 bg-emerald-500/10 text-white"
                          : "border-red-500 bg-red-500/10 text-white"
                        : cChecked && isCorrect
                        ? "border-emerald-500 bg-emerald-500/10 text-white"
                        : "border-white/5 bg-zinc-900/60 text-zinc-300 hover:border-white/10"
                    }`}
                  >
                    <span>{opt.text}</span>
                    {cChecked && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
            {cChecked && (
              <div className="p-3 bg-zinc-900 rounded-lg text-xs text-zinc-400">
                <p className="font-extrabold text-white mb-1">{cCorrect ? "✓ Correct!" : "✗ Incorrect."}</p>
                <p>{conceptQuestions[4][0].explanation}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            
                  <button
                    type="button"
                    onClick={() => {
                      const qObj = Array.isArray(conceptQuestions[step]) ? conceptQuestions[step][cIdx] : conceptQuestions[step];
                      if (!qObj) return;
                      const selOptText = qObj.options ? (qObj.options.find(o => o.id === cSelected)?.text || qObj.options.find(o => o.text === cSelected)?.text || cSelected) : cSelected;
                      const corrOptText = qObj.options ? (qObj.options.find(o => o.id === qObj.correctId)?.text || qObj.options.find(o => o.text === qObj.correctId)?.text || qObj.correctId) : qObj.correctId;
                      window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                        detail: {
                          question: qObj.question || "Concept Check",
                          selected_answer: String(selOptText || ""),
                          correct_answer: String(corrOptText || ""),
                          is_correct: !!cCorrect,
                          explanation: qObj.explanation || ""
                        }
                      }));
                    }}
                    className="mr-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
                    title="Add this concept summary to your diary notes"
                  >
                    + Add to Notes
                  </button>
                  <button onClick={handleNextConcept} disabled={!cChecked} className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Activity 1A – Guided Line Completion */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span>Activity 1A – Dialogue Completion</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 5 of {totalSteps}</span>
          </div>

          {guidedItems.length > 0 && (
            <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-5">
              <div className="text-center space-y-1">
                <span className="text-[9px] text-yellow-400 font-black uppercase tracking-wider block">Context Scenario</span>
                <p className="text-xs text-zinc-400 font-medium">{guidedItems[guidedIdx]?.context}</p>
              </div>

              {/* Dialogue flow history */}
              <div className="space-y-2 max-w-md mx-auto text-left">
                {guidedItems[guidedIdx]?.lines.map((line: any, idx: number) => (
                  <div key={idx} className={`flex ${line.speaker === "Learner" ? "justify-end" : "justify-start"}`}>
                    <div className={`p-3 rounded-xl text-xs max-w-[85%] ${
                      line.speaker === "Learner" 
                        ? "bg-yellow-500/10 text-white border border-yellow-500/20 text-right" 
                        : "bg-zinc-950 text-zinc-300 border border-white/5 text-left"
                    }`}>
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block mb-0.5">{line.speaker}</span>
                      <p className="font-korean font-bold text-sm leading-relaxed">{line.ko}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{line.en}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/[0.03] pt-4">
                <p className="text-xs text-center font-bold text-amber-400 mb-3">{guidedItems[guidedIdx]?.prompt}</p>

                <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                  {guidedItems[guidedIdx]?.options.map((opt: any) => {
                    const isSelected = selectedGuidedOptId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => !guidedChecked && setSelectedGuidedOptId(opt.id)}
                        disabled={guidedChecked}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition flex justify-between items-center ${
                          isSelected
                            ? guidedChecked
                              ? opt.correct
                                ? "border-emerald-500 bg-emerald-500/10 text-white"
                                : "border-red-500 bg-red-500/10 text-white"
                              : "border-yellow-500 bg-yellow-500/10 text-white"
                            : guidedChecked && opt.correct
                            ? "border-emerald-500 bg-emerald-500/10 text-white"
                            : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                        }`}
                      >
                        <span>{opt.text}</span>
                        {guidedChecked && opt.correct && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {guidedChecked && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 max-w-md mx-auto text-left space-y-1">
                  <p className="font-extrabold text-white">{guidedCorrect ? "✓ Correct Choice!" : "✗ Incorrect Choice."}</p>
                  <p>{guidedItems[guidedIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1 max-w-md mx-auto">
                {!guidedChecked ? (
                  <button
                    onClick={handleCheckGuided}
                    disabled={!selectedGuidedOptId}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
                        setStep(6); // Move to 1B
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {guidedIdx < guidedItems.length - 1 ? "Next Drills" : "Move to Activity 1B"}
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

      {/* Screen 6: Activity 1B – Guided Dialogue Replies */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span>Activity 1B – Natural Responses</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of {totalSteps}</span>
          </div>

          {replyItems.length > 0 && (
            <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-5">
              <div className="text-center space-y-2">
                <span className="text-[9px] text-yellow-400 font-black uppercase tracking-wider block">Spoken Prompt Question</span>
                <p className="text-sm text-white font-bold font-korean mt-1">"{replyItems[replyIdx]?.question}"</p>
              </div>

              <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                {replyItems[replyIdx]?.options.map((opt: any) => {
                  const isSelected = selectedReplyOptId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => !replyChecked && setSelectedReplyOptId(opt.id)}
                      disabled={replyChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition flex justify-between items-center ${
                        isSelected
                          ? replyChecked
                            ? opt.correct
                              ? "border-emerald-500 bg-emerald-500/10 text-white"
                              : "border-red-500 bg-red-500/10 text-white"
                            : "border-yellow-500 bg-yellow-500/10 text-white"
                          : replyChecked && opt.correct
                          ? "border-emerald-500 bg-emerald-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      }`}
                    >
                      <span>{opt.text}</span>
                      {replyChecked && opt.correct && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>

              {replyChecked && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 max-w-md mx-auto text-left space-y-1">
                  <p className="font-extrabold text-white">{replyCorrect ? "✓ Correct Response!" : "✗ Incorrect Response."}</p>
                  <p>{replyItems[replyIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1 max-w-md mx-auto">
                {!replyChecked ? (
                  <button
                    onClick={handleCheckReply}
                    disabled={!selectedReplyOptId}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
                        setStep(7); // Move to Chat Scenarios
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {replyIdx < replyItems.length - 1 ? "Next Question" : "Move to Activity 2"}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(5)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <div className="h-4" />
          </div>
        </div>
      )}

      {/* Screen 7: Activity 2 – A2 Semi-Free Roleplay */}
      {step === 7 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-yellow-400" />
              <span>Activity 2 – A2 Semi-Free Roleplay</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of {totalSteps}</span>
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
                    className="p-4 rounded-2xl border border-white/5 bg-zinc-950 hover:bg-zinc-900 text-left transition flex justify-between items-center group cursor-pointer"
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
            <div className="space-y-4 max-w-2xl mx-auto w-full flex-grow flex flex-col justify-between">
              
              {/* Scenario description header */}
              <div className="flex justify-between items-center p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-xl text-[11px] text-zinc-300">
                <div className="space-y-0.5 text-left">
                  <span className="font-black text-yellow-400 block">Topic: {scenarios.find(s => s.id === selectedScenarioId)?.name}</span>
                  <p className="text-[10px] text-zinc-455">{scenarios.find(s => s.id === selectedScenarioId)?.description}</p>
                </div>
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-white/5 hover:border-white/10 text-[9px] font-black tracking-wide cursor-pointer transition shrink-0"
                >
                  {showHints ? "Hide Hints" : "Show Hints"}
                </button>
              </div>

              {/* Hints Box */}
              {showHints && (
                <div className="bg-zinc-950 p-3 rounded-xl border border-yellow-500/20 text-xs text-zinc-350 space-y-1 animate-fade-in text-left">
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
              <div className="bg-zinc-950/80 rounded-2xl border border-white/5 p-4 space-y-3 h-72 overflow-y-auto flex flex-col justify-start text-left">
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
                    <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-500 text-[10px] animate-pulse font-mono">
                      Gwan-Sik is typing...
                    </div>
                  </div>
                )}
              </div>

              {/* Scaffold suggestions */}
              {!chatEnded && (
                <div className="space-y-2 text-left">
                  <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Suggested Sentence Chips:</span>
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
                        className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-white/5 text-[10px] font-bold text-zinc-300 cursor-pointer transition"
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
                  <span className="text-[10px] text-yellow-400 font-black uppercase tracking-wider block">Session feedback & Coaching</span>
                  <p className="text-xs text-zinc-350 leading-relaxed font-sans">{chatFeedback}</p>
                  <button
                    onClick={() => {
                      setSelectedScenarioId(null);
                      setChatSessionId(null);
                      setChatMessages([]);
                    }}
                    className="bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-xs text-white font-bold py-2 px-5 rounded-lg cursor-pointer transition"
                  >
                    Select Another Topic
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
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 rounded-xl text-xs font-bold transition cursor-pointer"
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
                  setStep(6);
                }
              }} 
              className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(8)} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Checkpoint Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 8: Mini-Quiz Checkpoint */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in max-w-3xl mx-auto">
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
                <p className="font-extrabold text-white text-base mt-1 leading-relaxed">{quizBlueprint[quizIdx]?.question}</p>
              </div>

              {quizBlueprint[quizIdx]?.type === "listening" && (
                <div className="text-center space-y-4">
                  <button 
                    onClick={() => playAudio(quizBlueprint[quizIdx]?.audio_text || "")}
                    className="p-5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full mx-auto transition flex items-center justify-center cursor-pointer"
                  >
                    <Volume2 className="w-8 h-8" />
                  </button>
                  <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                    {quizBlueprint[quizIdx]?.options.map((opt: string) => {
                      const isSelected = quizSelectedOpt === opt;
                      const isCorrect = opt === quizBlueprint[quizIdx]?.correct_answer;
                      return (
                        <button
                          key={opt}
                          onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                          disabled={quizChecked}
                          className={`p-3 rounded-xl border text-xs font-bold transition text-left flex justify-between items-center ${
                            isSelected
                              ? quizChecked
                                ? isCorrect
                                  ? "border-emerald-500 bg-emerald-500/10 text-white"
                                  : "border-red-500 bg-red-500/10 text-white"
                                : "border-yellow-500 bg-yellow-500/10 text-white"
                              : quizChecked && isCorrect
                              ? "border-emerald-500 bg-emerald-500/10 text-white"
                              : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          <span>{opt}</span>
                          {quizChecked && isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {quizBlueprint[quizIdx]?.type === "context" && (
                <div className="grid grid-cols-1 gap-2">
                  {quizBlueprint[quizIdx]?.options.map((opt: string) => {
                    const isSelected = quizSelectedOpt === opt;
                    const isCorrect = opt === quizBlueprint[quizIdx]?.correct_answer;
                    return (
                      <button
                        key={opt}
                        onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                        disabled={quizChecked}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition flex justify-between items-center ${
                          isSelected
                            ? quizChecked
                              ? isCorrect
                                ? "border-emerald-500 bg-emerald-500/10 text-white"
                                : "border-red-500 bg-red-500/10 text-white"
                              : "border-yellow-500 bg-yellow-500/10 text-white"
                            : quizChecked && isCorrect
                            ? "border-emerald-500 bg-emerald-500/10 text-white"
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        <span>{opt}</span>
                        {quizChecked && isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {quizChecked && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 text-left space-y-1">
                  <p className="font-extrabold text-white">{quizCorrect ? "✓ Answer Correct!" : "✗ Incorrect Answer."}</p>
                  <p>{quizBlueprint[quizIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={!quizSelectedOpt}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer transition"
                  >
                    Verify Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/95 font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer transition flex items-center gap-1.5"
                  >
                    {finishingQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Complete Quiz"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(7)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <div className="h-4" />
          </div>
        </div>
      )}

      {/* Screen 9: Homework & Stateful AI Capstone */}
      {step === 9 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in max-w-3xl mx-auto">
          <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/25 w-fit mx-auto text-yellow-400 shrink-0 animate-bounce">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-4xl font-black text-white tracking-tight">Course 3 Completed! 🎓🎉</h2>
            <p className="text-xs text-zinc-400 font-mono">Badge Earned: A2 Conversationalist (150 XP rewarded)</p>
            {quizScore !== null && (
              <p className="text-xs text-zinc-500">Your Capstone checkpoint score: <strong>{quizScore}%</strong></p>
            )}
          </div>

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
                      className="mt-0.5 h-4 w-4 rounded border-white/10 bg-zinc-950 text-yellow-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
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
              <div className="p-4 bg-zinc-900 border border-yellow-500/20 rounded-xl space-y-2 text-xs animate-fade-in">
                <p className="font-extrabold text-white">Stateful Session Active!</p>
                <p className="font-korean text-zinc-200">Gwan-Sik: "{tutorSession.opener}"</p>
                <a
                  href={`/conversation?session_id=${tutorSession.session_id}`}
                  className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-1.5 px-4 rounded-lg text-[10px] cursor-pointer transition inline-flex items-center gap-1 font-sans"
                >
                  <span>Enter Capstone Practice Room</span>
                  <ArrowRight className="w-3 h-3 text-zinc-950" />
                </a>
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

          <div className="flex justify-between items-center pt-4 border-t border-white/5 max-w-md mx-auto w-full">
            <button 
              onClick={() => {
                setStep(8);
                setQuizIdx(0);
                setQuizSelectedOpt(null);
                setQuizWritingAns("");
                setQuizChecked(false);
                setQuizCorrect(null);
                setQuizMistakes([]);
                setQuizScore(null);
              }}
              className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition cursor-pointer"
            >
              Retake Checkpoint
            </button>
            <button 
              onClick={() => {
    if (courseXP < 580) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To graduate from this course, you need at least 580 XP. You currently have " + courseXP + " XP. Please review earlier steps or re-answer incorrect questions to earn more XP!") } }));
      return;
    }onComplete();
  }}
              className="bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 text-zinc-950 font-black px-6 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow shadow-brand-500/25"
            >
              <span>Complete Course</span>
              <ChevronRight className="w-4 h-4 text-zinc-950" />
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
                if (typeof setQuizWritingAns === "function") setQuizWritingAns("");
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
