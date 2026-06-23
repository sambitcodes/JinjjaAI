"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import xpAudit from "../lib/xp-audit.json";
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
  Star,
  RefreshCw
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

interface Course2Phase6ConversationWizardProps {
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

export default function Course2Phase6ConversationWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course2Phase6ConversationWizardProps) {
  const phaseNum = 6;
  const getStepMaxXP = (sNum: number) => {
    try {
      return (xpAudit as any)["2"]?.[phaseNum.toString()]?.steps?.[sNum.toString()]?.max_xp ?? 35;
    } catch (e) {
      return 35;
    }
  };
  const getStepXP = (sNum: number) => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(`hangeulai_c2p${phaseNum}_s${sNum}_earned_xp`) || "0", 10);
  };

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c2p6_step");
    const savedMax = localStorage.getItem("hangeulai_c2p6_max_step");
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
      localStorage.setItem("hangeulai_c2p6_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const [useVoiceMode, setUseVoiceMode] = useState(false);
  const totalSteps = 12;

  // Persist step to localStorage for refresh resilience
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c1p6_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 12) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c1p6_step", String(step));
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
    if (step >= 2 && step <= 5) {
      setCSelected(null);
      setCChecked(false);
      setCCorrect(null);
      setCIdx(0);
    }
  }, [step]);

  // Concept questions definition matching requirements
  const conceptQuestions: Record<number, MicroQuestion[]> = {
    2: [
      {
        question: "Which of these fits an A1 conversation best?",
        options: [
          { id: "A", text: "talking about your daily schedule" },
          { id: "B", text: "debating politics" },
          { id: "C", text: "explaining technical work problems" }
        ],
        correctId: "A",
        explanation: "A1 conversations focus on familiar, personal topics like routines, locations, and identity."
      }
    ],
    3: [
      {
        question: "If someone says '안녕하세요?', which is a more natural next line at A1?",
        options: [
          { id: "A", text: "안녕하세요." },
          { id: "B", text: "저는 한국 사람이에요?" },
          { id: "C", text: "어디에 있어요?" }
        ],
        correctId: "A",
        explanation: "Responding to a greeting with a polite '안녕하세요' is the most natural and expected response."
      }
    ],
    4: [
      {
        question: "Which pattern would you use to answer '어디에 있어요?'?",
        options: [
          { id: "A", text: "저는 _입니다." },
          { id: "B", text: "_에 있어요." },
          { id: "C", text: "_에 가요?" }
        ],
        correctId: "B",
        explanation: "Use '[Place]에 있어요' to answer static location questions."
      }
    ],
    5: [
      {
        question: "During a conversation, what is better at A1?",
        options: [
          { id: "A", text: "never speaking until you know the perfect sentence" },
          { id: "B", text: "trying simple sentences, even with mistakes" }
        ],
        correctId: "B",
        explanation: "At A1, interaction and flow are key. Mistakes are a natural part of practice!"
      }
    ]
  };

  // Step 8: Post scramble dialogue question
  const [reflectionSelected, setReflectionSelected] = useState<string | null>(null);
  const [reflectionChecked, setReflectionChecked] = useState(false);
  const [reflectionCorrect, setReflectionCorrect] = useState<boolean | null>(null);

  // Activity 1A states (Guided choice)
  const [guidedItems, setGuidedItems] = useState<any[]>([]);
  const [guidedIdx, setGuidedIdx] = useState(0);
  const [selectedGuidedOptId, setSelectedGuidedOptId] = useState<string | null>(null);
  const [guidedChecked, setGuidedChecked] = useState(false);
  const [guidedCorrect, setGuidedCorrect] = useState<boolean | null>(null);

  // Activity 2A states (Order Scrambled)
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderIdx, setOrderIdx] = useState(0);
  const [userOrderedIndices, setUserOrderedIndices] = useState<number[]>([]);
  const [orderChecked, setOrderChecked] = useState(false);
  const [orderCorrect, setOrderCorrect] = useState<boolean | null>(null);

  // Activity 3 states (Semi-free Chat)
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

  // --- Start Progress State Preservation ---
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hangeulai_c2p6_progress_state");
        if (saved) {
          const state = JSON.parse(saved);
            if (state.step !== undefined) setStep(state.step);
            if (state.maxStep !== undefined) setMaxStep(state.maxStep);
            if (state.cSelected !== undefined) setCSelected(state.cSelected);
            if (state.cChecked !== undefined) setCChecked(state.cChecked);
            if (state.cCorrect !== undefined) setCCorrect(state.cCorrect);
            if (state.cIdx !== undefined) setCIdx(state.cIdx);
            if (state.reflectionSelected !== undefined) setReflectionSelected(state.reflectionSelected);
            if (state.reflectionChecked !== undefined) setReflectionChecked(state.reflectionChecked);
            if (state.reflectionCorrect !== undefined) setReflectionCorrect(state.reflectionCorrect);
            if (state.guidedIdx !== undefined) setGuidedIdx(state.guidedIdx);
            if (state.selectedGuidedOptId !== undefined) setSelectedGuidedOptId(state.selectedGuidedOptId);
            if (state.guidedChecked !== undefined) setGuidedChecked(state.guidedChecked);
            if (state.guidedCorrect !== undefined) setGuidedCorrect(state.guidedCorrect);
            if (state.orderIdx !== undefined) setOrderIdx(state.orderIdx);
            if (state.orderChecked !== undefined) setOrderChecked(state.orderChecked);
            if (state.orderCorrect !== undefined) setOrderCorrect(state.orderCorrect);
            if (state.selectedScenarioId !== undefined) setSelectedScenarioId(state.selectedScenarioId);
            if (state.chatInput !== undefined) setChatInput(state.chatInput);
            if (state.quizIdx !== undefined) setQuizIdx(state.quizIdx);
            if (state.quizChecked !== undefined) setQuizChecked(state.quizChecked);
            if (state.quizCorrect !== undefined) setQuizCorrect(state.quizCorrect);
            if (state.quizSelectedOpt !== undefined) setQuizSelectedOpt(state.quizSelectedOpt);
            if (state.quizWritingAns !== undefined) setQuizWritingAns(state.quizWritingAns);
            if (state.quizScore !== undefined) setQuizScore(state.quizScore);
            if (state.quizMistakes !== undefined) setQuizMistakes(state.quizMistakes);
            if (state.completedHomework !== undefined) setCompletedHomework(state.completedHomework);
        }
      } catch (e) {
        console.error("Failed to restore progress state:", e);
      }
      isLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    if (typeof window !== "undefined") {
      try {
        const state = {
            step,
            maxStep,
            cSelected,
            cChecked,
            cCorrect,
            cIdx,
            reflectionSelected,
            reflectionChecked,
            reflectionCorrect,
            guidedIdx,
            selectedGuidedOptId,
            guidedChecked,
            guidedCorrect,
            orderIdx,
            orderChecked,
            orderCorrect,
            selectedScenarioId,
            chatInput,
            quizIdx,
            quizChecked,
            quizCorrect,
            quizSelectedOpt,
            quizWritingAns,
            quizScore,
            quizMistakes,
            completedHomework
        };
        localStorage.setItem("hangeulai_c2p6_progress_state", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save progress state:", e);
      }
    }
  }, [step, maxStep, cSelected, cChecked, cCorrect, cIdx, reflectionSelected, reflectionChecked, reflectionCorrect, guidedIdx, selectedGuidedOptId, guidedChecked, guidedCorrect, orderIdx, orderChecked, orderCorrect, selectedScenarioId, chatInput, quizIdx, quizChecked, quizCorrect, quizSelectedOpt, quizWritingAns, quizScore, quizMistakes, completedHomework]);
  // --- End Progress State Preservation ---

  const [tutorSession, setTutorSession] = useState<any>(null);

  // Sound and XP helpers
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

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/lessons/phases/korean1/6/metadata");
          setMetadata(res);
        } else if (step === 2 && !examplesData) {
          const res = await apiJson("/lessons/phases/korean1/6/examples");
          setExamplesData(res);
        } else if ((step === 6 || step === 7) && guidedItems.length === 0) {
          const res_g = await apiJson("/lessons/practice/dialogues/guided");
          const res_o = await apiJson("/lessons/practice/dialogues/order");
          setGuidedItems(res_g.items || []);
          setOrderItems(res_o.items || []);
        } else if (step === 9 && scenarios.length === 0) {
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
        } else if (step === 11 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/lessons/quiz/korean1/phase-6/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 12 && homeworkItems.length === 0) {
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

  // Concept Screen checking handler
  const handleCheckConcept = (selectedId: string) => {
    if (cChecked) return;
    const currentQ = conceptQuestions[step]?.[cIdx];
    if (!currentQ) return;

    setCSelected(selectedId);
    const isCorrect = selectedId === currentQ.correctId;
    setCChecked(true);
    setCCorrect(isCorrect);
    
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
  };

  // Concept Screen next helper
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
      const res = await apiJson("/lessons/practice/dialogues/guided/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_option_id: selectedGuidedOptId,
          time_taken_ms: 1000
        })
      });
      setGuidedChecked(true);
      setGuidedCorrect(res.correct);
      if (res.correct) {
        playCorrectSound();
      } else {
        playWrongSound();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 2A Order submission
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
      await apiJson("/lessons/practice/dialogues/order/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          correct: isCorrect,
          time_taken_ms: 2000
        })
      });
      setOrderChecked(true);
      setOrderCorrect(isCorrect);
      if (isCorrect) {
        playCorrectSound();
      } else {
        playWrongSound();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Step 8: Post-scramble Reflection MCQ
  const handleCheckReflection = (opt: string) => {
    if (reflectionChecked) return;
    setReflectionSelected(opt);
    const isCorrect = opt === "greeting";
    setReflectionChecked(true);
    setReflectionCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  // Activity 3: Launch AI Dialogue Session
  const handleStartChatSession = async (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setLoadingChat(true);
    setChatMessages([]);
    setChatEnded(false);
    setChatFeedback("");
    try {
      const res = await apiJson("/lessons/conversation/a1/session/start", {
        method: "POST",
        body: JSON.stringify({
          scenario_id: scenarioId,
          mode: useVoiceMode ? "voice" : "text"
        })
      });
      setChatSessionId(res.session_id);
      setChatOpener(res.opener);
      setChatMessages([{ sender: "assistant", text: res.opener }]);
      setStep(10); // Move directly to step 10 (Chat Runtime)
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
      const res = await apiJson(`/lessons/conversation/a1/session/${chatSessionId}/turn`, {
        method: "POST",
        body: JSON.stringify({ user_text: userText })
      });
      setChatMessages(prev => [...prev, { sender: "assistant", text: res.reply }]);
      if (res.feedback) {
        setChatFeedback(res.feedback);
      }
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
      const res = await apiJson(`/lessons/conversation/a1/session/${chatSessionId}/end`, { method: "POST" });
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
        await apiJson("/lessons/quiz/korean1/phase-6/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setStep(12);
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
        ? "/lessons/conversation/a1/selfintro-practice/start" 
        : "/lessons/conversation/a1/routine-practice/start";
      const res = await apiJson(path, { method: "POST" });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

    const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "C1 – What \"A1 conversation\" means" },
    { num: 3, label: "C2 – Conversations as \"lines\" (turns)" },
    { num: 4, label: "C3 – Using patterns you already know" },
    { num: 5, label: "C4 – How Gwan-Sik helps you in chats" },
    { num: 6, label: "Activity 1A – Choose the next line" },
    { num: 7, label: "Activity 2A – Scrambled dialogue solver" },
    { num: 8, label: "Activity 2B – Scramble review check" },
    { num: 9, label: "Activity 3A – AI Scenario selection" },
    { num: 10, label: "Activity 3B – ASR Chat Room Practice" },
    { num: 11, label: "Activity 4 – Graduating capstone quiz checks" },
    { num: 12, label: "Activity 5 – Course 1 Everyday Basics graduation" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 2,
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
              <span>{activeLesson?.title || "Conversation Capstone"}</span>
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
                const isCompleted = s.num < step;
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
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${(getStepXP(s.num) / (getStepMaxXP(s.num) || 1)) * 100}%` }}
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

      {/* Step 1: Welcome Overview */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="relative mx-auto w-fit">
            <div className="p-4 bg-yellow-500/10 rounded-full border border-yellow-500/25 text-yellow-400">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-brand-500 rounded-full border-2 border-zinc-950">
              <Star className="w-3 h-3 text-white fill-white animate-pulse" />
            </div>
          </div>
          
          <div>
            <h2 className="text-5xl font-black text-white tracking-tight">Korean 1.6</h2>
            <h3 className="text-2xl font-black text-yellow-400 mt-1">Conversation Lab</h3>
            <p className="text-zinc-550 text-xs mt-0.5">Everyday Basics in Real Chats (A1 Capstone)</p>
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
                "Choose natural next lines and reorder scrambled statements",
                "Handle a semi-free AI roleplay and complete the Capstone Quiz"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
          </div>

          {/* Mode Selector */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full space-y-3 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">⏱️ Estimated Time</span>
              <span className="text-xs font-bold text-zinc-300">{metadata?.estimated_minutes || 25} minutes</span>
            </div>
            <div className="border-t border-white/[0.03] pt-3 space-y-2">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Conversation Input Mode</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setUseVoiceMode(false)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    !useVoiceMode 
                      ? "border-yellow-500 bg-yellow-500/10 text-white" 
                      : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                  }`}
                >
                  Text only
                </button>
                <button
                  onClick={() => setUseVoiceMode(true)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
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
              className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3.5 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/20"
            >
              <Trophy className="w-4 h-4 text-zinc-950" />
              <span>Start Capstone Phase</span>
            </button>
          </div>

          
        </div>
      )}

      {/* Step 2: Screen C1 – What "A1 conversation" means */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">What "A1 Conversation" Means</h2>
          
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 text-sm text-zinc-300">
            <p className="leading-relaxed">At A1 level, conversation means:</p>
            <ul className="list-disc list-inside space-y-2 text-zinc-400 pl-2">
              <li>Short exchanges, typically lasting between <strong className="text-white">3 to 8 turns</strong>.</li>
              <li>Focusing on topics you know well: <strong className="text-white">yourself, your day, places, numbers</strong>.</li>
              <li>The other person speaks slowly, repeats their words, and helps you along.</li>
            </ul>
            <p className="text-zinc-500 italic mt-2">You are not expected to express complex opinions yet; the focus is entirely on basic question and answer sequences.</p>
          </div>

          {/* Micro-question 1 */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl">
            <h4 className="text-xs font-black uppercase text-yellow-400 tracking-wider">Concept Check</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[2][0].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[2][0].options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleCheckConcept(opt.id)}
                  disabled={cChecked}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                    cSelected === opt.id
                      ? cCorrect
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-red-500 bg-red-500/10 text-white"
                      : "border-white/5 bg-zinc-900 text-zinc-300 hover:border-white/10"
                  } ${cChecked && opt.id === conceptQuestions[2][0].correctId ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {cChecked && (
              <div className="animate-fade-in space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">{conceptQuestions[2][0].explanation}</p>
                
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
                  <button
                  onClick={handleNextConcept}
                  className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Screen C2 – Conversations as "lines" (turns) */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Conversations as "Lines" (Turns)</h2>
          
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300">
            <p>A conversation is made of lines: each time someone speaks is one line (or turn).</p>
            <p className="text-zinc-400">In this phase, you will practice dialogue completion and arrangement by:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
              <li>Reading short dialogue lines in Korean and reviewing their English support translations.</li>
              <li>Deciding which line comes next logically.</li>
              <li>Putting scrambled lines in order to form a natural exchange.</li>
            </ul>
          </div>

          {/* Micro-question 2 */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl">
            <h4 className="text-xs font-black uppercase text-yellow-400 tracking-wider">Concept Check</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[3][0].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[3][0].options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleCheckConcept(opt.id)}
                  disabled={cChecked}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                    cSelected === opt.id
                      ? cCorrect
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-red-500 bg-red-500/10 text-white"
                      : "border-white/5 bg-zinc-900 text-zinc-300 hover:border-white/10"
                  } ${cChecked && opt.id === conceptQuestions[3][0].correctId ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {cChecked && (
              <div className="animate-fade-in space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">{conceptQuestions[3][0].explanation}</p>
                
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
                  <button
                  onClick={handleNextConcept}
                  className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Screen C3 – Using patterns you already know */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Using Patterns You Already Know</h2>
          
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300">
            <p>All conversations here reuse patterns from your earlier phases. You do not need to learn new grammar, just learn to recombine what you know:</p>
            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-white/5">
                <strong className="text-yellow-400 block mb-0.5">Greetings & Thanks</strong>
                안녕하세요, 반갑습니다, 감사합니다.
              </div>
              <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-white/5">
                <strong className="text-yellow-400 block mb-0.5">Self-Introduction</strong>
                저는 (이)예요, 저는 [Country] 사람이에요.
              </div>
              <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-white/5">
                <strong className="text-yellow-400 block mb-0.5">Numbers & Age</strong>
                몇 살이에요?, [Age]살이에요.
              </div>
              <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-white/5">
                <strong className="text-yellow-400 block mb-0.5">Routines & Places</strong>
                일어나요, 공부해요, 집에 있어요, 학교에 가요.
              </div>
            </div>
          </div>

          {/* Micro-question 3 */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl">
            <h4 className="text-xs font-black uppercase text-yellow-400 tracking-wider">Concept Check</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[4][0].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[4][0].options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleCheckConcept(opt.id)}
                  disabled={cChecked}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                    cSelected === opt.id
                      ? cCorrect
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-red-500 bg-red-500/10 text-white"
                      : "border-white/5 bg-zinc-900 text-zinc-300 hover:border-white/10"
                  } ${cChecked && opt.id === conceptQuestions[4][0].correctId ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {cChecked && (
              <div className="animate-fade-in space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">{conceptQuestions[4][0].explanation}</p>
                
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
                  <button
                  onClick={handleNextConcept}
                  className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 5: Screen C4 – Getting help from the AI tutor */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">How Gwan-Sik Helps You</h2>
          
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300">
            <p>During the semi-free roleplay tasks, Gwan-Sik is built to assist A1 learners:</p>
            <ul className="list-disc list-inside space-y-2 text-zinc-455 pl-2">
              <li>He stays exactly at your level, avoiding complicated sentences.</li>
              <li>He repeats or rephrases questions if you get stuck.</li>
              <li>He provides helpful, lightweight feedback tips at the end of the chat session.</li>
            </ul>
            <p className="text-xs text-zinc-500 italic">Do not worry about making mistakes; the main goal is simply keeping the communication flowing!</p>
          </div>

          {/* Micro-question 4 */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl">
            <h4 className="text-xs font-black uppercase text-yellow-400 tracking-wider">Concept Check</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[5][0].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[5][0].options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleCheckConcept(opt.id)}
                  disabled={cChecked}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                    cSelected === opt.id
                      ? cCorrect
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-red-500 bg-red-500/10 text-white"
                      : "border-white/5 bg-zinc-900 text-zinc-300 hover:border-white/10"
                  } ${cChecked && opt.id === conceptQuestions[5][0].correctId ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {cChecked && (
              <div className="animate-fade-in space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">{conceptQuestions[5][0].explanation}</p>
                
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
                  <button
                  onClick={handleNextConcept}
                  className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 6: Activity 1A – Choose the next line */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span>Activity 1A – Choose Next Line</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of {totalSteps}</span>
          </div>

          {guidedItems.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-yellow-400" /></div>
          ) : (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="text-left text-center">
                <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Dialogue Context</span>
                <p className="text-xs font-bold text-zinc-300 mt-1">"{guidedItems[guidedIdx]?.context}"</p>
              </div>

              {/* Chat turns leading up to question */}
              <div className="space-y-2.5 max-w-md mx-auto">
                {guidedItems[guidedIdx]?.lines.map((line: any, idx: number) => (
                  <div key={idx} className={`flex ${line.speaker === "Learner" ? "justify-end" : "justify-start"}`}>
                    <div className={`p-3 rounded-2xl text-xs ${
                      line.speaker === "Learner" 
                        ? "bg-yellow-500/10 text-white border border-yellow-500/15 text-right" 
                        : "bg-zinc-950 text-zinc-300 border border-white/5 text-left"
                    }`}>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block mb-0.5">{line.speaker}</span>
                      <p className="font-korean font-extrabold text-sm">{line.ko}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{line.en}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-yellow-400">{guidedItems[guidedIdx]?.prompt}</p>
              </div>

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
                    } ${guidedChecked && opt.correct ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${guidedChecked && selectedGuidedOptId === opt.id && !opt.correct ? "border-red-500 bg-red-500/10 text-white" : ""}`}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>

              {guidedChecked && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-450 max-w-sm mx-auto text-left space-y-1">
                  <p className="font-extrabold text-white">{guidedCorrect ? "Correct Continuation!" : "Incorrect Continuation."}</p>
                  <p>{guidedItems[guidedIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!guidedChecked ? (
                  <button
                    onClick={handleCheckGuided}
                    disabled={!selectedGuidedOptId}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    Verify Line Choice
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
                        setStep(7); // Move to scrambled solver step
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    {guidedIdx < guidedItems.length - 1 ? "Next Dialogue Challenge" : "Continue to Dialogue Scramble"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 7: Activity 2A – Unscramble the dialogue */}
      {step === 7 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span>Activity 2A – Unscramble Dialogue</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of {totalSteps}</span>
          </div>

          {orderItems.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-yellow-400" /></div>
          ) : (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Dialogue Scramble solver</span>
                <p className="text-xs text-zinc-300 font-extrabold">Click lines in order to assemble a natural conversation.</p>
              </div>

              {/* Scrambled lines pool */}
              <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                {orderItems[orderIdx]?.scrambled_lines.map((line: any, idx: number) => {
                  const selectionOrder = userOrderedIndices.indexOf(idx);
                  const isSelected = selectionOrder !== -1;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleToggleOrderSelection(idx)}
                      disabled={orderChecked}
                      className={`text-left p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? "border-yellow-500 bg-yellow-500/10 text-white" 
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="font-korean font-extrabold text-sm">{line.ko}</p>
                        <p className="text-[10px] text-zinc-500 font-normal">{line.en}</p>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-yellow-500 text-zinc-950 font-black flex items-center justify-center text-[10px] shrink-0">
                          {selectionOrder + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Live ordering preview */}
              {userOrderedIndices.length > 0 && (
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2 text-xs text-left max-w-md mx-auto animate-fade-in">
                  <span className="text-[8px] text-zinc-500 uppercase block font-black">Ordered dialogue Preview:</span>
                  {userOrderedIndices.map((idx, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-yellow-400 font-bold">{i + 1}.</span>
                      <span className="text-zinc-300 font-korean">{orderItems[orderIdx]?.scrambled_lines[idx]?.ko}</span>
                    </div>
                  ))}
                </div>
              )}

              {orderChecked && (
                <div className={`p-3 rounded-xl border text-xs text-center max-w-md mx-auto ${
                  orderCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  {orderCorrect ? "Order is perfect!" : "Incorrect order. Hint: Start with a greeting line like '안녕하세요?' first."}
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
                  className="text-xs text-zinc-550 hover:text-white underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Sequence</span>
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
                        setStep(8); // Move to scramble reflection step
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {orderIdx < orderItems.length - 1 ? "Next Scramble Solver" : "Continue to Dialogue Reflection"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 8: Activity 2B – Dialogue reflection micro-question */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-yellow-400" />
              <span>Dialogue Structure Reflection</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 8 of {totalSteps}</span>
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed max-w-xl mx-auto text-center">
            You successfully sorted conversation sequences. Let's analyze how standard Korean dialogue blocks operate:
          </p>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full">
            <h4 className="text-xs font-black uppercase text-yellow-400 tracking-wider">Concept Check</h4>
            <p className="text-xs text-zinc-300 font-bold">Which line starts the conversation (greeting, question, or answer)?</p>
            
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: "greeting", text: "Greeting (e.g. 안녕하세요!)" },
                { id: "question", text: "Question (e.g. 이름이 뭐예요?)" },
                { id: "answer", text: "Answer (e.g. 저는 지수예요.)" }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleCheckReflection(opt.id)}
                  disabled={reflectionChecked}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                    reflectionSelected === opt.id
                      ? reflectionCorrect
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-red-500 bg-red-500/10 text-white"
                      : "border-white/5 bg-zinc-900 text-zinc-300 hover:border-white/10"
                  } ${reflectionChecked && opt.id === "greeting" ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt.text}
                </button>
              ))}
            </div>

            {reflectionChecked && (
              <div className="animate-fade-in space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Correct! Standard A1 conversations always initiate with a polite greeting turn to establish the conversation flow.
                </p>
                <button
                  onClick={() => setStep(9)}
                  className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Go to AI Scenario Selection
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 9: Activity 3A – Scenario selection */}
      {step === 9 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-yellow-400" />
              <span>Activity 3A – Scenario Selection</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 9 of {totalSteps}</span>
          </div>

          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-black text-white">Select a Practice Dialogue Scenario</h3>
              <p className="text-xs text-zinc-500">Practice custom chats in simple A1 terms. Gwan-Sik will stay at your pace.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
              {scenarios.map((scen) => (
                <button
                  key={scen.id}
                  onClick={() => handleStartChatSession(scen.id)}
                  className="p-4 rounded-2xl border border-white/5 bg-zinc-950 hover:bg-zinc-900 text-left transition flex justify-between items-center cursor-pointer hover:border-yellow-500/30"
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
        </div>
      )}

      {/* Step 10: Activity 3B – Chat runtime */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-yellow-400" />
              <span>Activity 3B – Roleplay Practice</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 10 of {totalSteps}</span>
          </div>

          <div className="space-y-4 max-w-xl mx-auto w-full flex-grow flex flex-col justify-between">
            {/* Active Scenario Details */}
            <div className="p-3.5 bg-yellow-500/5 border border-yellow-500/15 rounded-xl text-[11px] text-zinc-300 text-left">
              <span className="font-black text-yellow-400 block mb-0.5">Active Scenario Objective:</span>
              <p>{scenarios.find(s => s.id === selectedScenarioId)?.description}</p>
            </div>

            {/* Chat message threads */}
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
                    Gwan-Sik is typing a reply...
                  </div>
                </div>
              )}
            </div>

            {/* Scaffold chips to assist */}
            {!chatEnded && (
              <div className="space-y-2">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block text-left">Suggested Korean Statements:</span>
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

            {/* Feedback box */}
            {chatFeedback && (
              <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-left text-xs">
                <span className="text-[8px] text-blue-400 font-bold uppercase block tracking-wider mb-1">Gwan-Sik's Feedback Tip</span>
                <p className="text-zinc-300 leading-normal">{chatFeedback}</p>
              </div>
            )}

            {/* Input actions */}
            {chatEnded ? (
              <div className="bg-zinc-950 p-4 rounded-xl border border-yellow-500/25 space-y-3 text-center animate-fade-in">
                <span className="text-[10px] text-yellow-400 font-black uppercase tracking-wider block">Session Completed Feedback</span>
                <p className="text-xs text-zinc-350 leading-normal">{chatFeedback || "Great job! You navigated this Capstone dialog smoothly."}</p>
                <button
                  onClick={() => setStep(11)}
                  className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-2 px-6 rounded-xl text-xs transition cursor-pointer"
                >
                  Continue to Mini-Quiz
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
                  Finish
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 11: Activity 4 – Graduating capstone checkpoints */}
      {step === 11 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              <span>Capstone Mini-Quiz</span>
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
                        } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${quizChecked && quizSelectedOpt === opt && opt !== quizBlueprint[quizIdx]?.correct_answer ? "border-red-500 bg-red-500/10 text-white" : ""}`}
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
                      } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${quizChecked && quizSelectedOpt === opt && opt !== quizBlueprint[quizIdx]?.correct_answer ? "border-red-500 bg-red-500/10 text-white" : ""}`}
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
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 rounded border border-white/5 text-xs text-white"
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
                  <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                    <span className="font-extrabold text-[10px] uppercase tracking-wider">Checkpoint Feedback</span>
                    <button
                      type="button"
                      onClick={() => {
                        const qObj = quizBlueprint[quizIdx];
                        if (!qObj) return;
                        window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                          detail: {
                            question: qObj.question || "Quiz Checkpoint Question",
                            selected_answer: String(quizBlueprint[quizIdx]?.type === "writing" ? quizWritingAns : quizSelectedOpt || ""),
                            correct_answer: String(qObj.correct_answer || ""),
                            is_correct: !!quizCorrect,
                            explanation: qObj.explanation || ""
                          }
                        }));
                      }}
                      className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-white/5 transition cursor-pointer"
                      title="Add this attempt summary to your diary notes"
                    >
                      + Add to Notes
                    </button>
                  </div>
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

      {/* Step 12: Homework & Completion */}
      {step === 12 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/25 w-fit mx-auto text-yellow-400 shrink-0 animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white">Course Complete! 🇰🇷🎓🎉</h2>
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
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 150, type: 'correct' } }));
              }onComplete();
            }}
            className="bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 hover:from-yellow-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-yellow-500/20 cursor-pointer w-full max-w-xs"
          >
            <span>Complete Course & Earn XP</span>
            <ChevronRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      )}
      
      {/* Navigation bottom controls for non-quiz screens */}
      {step !== 11 && step !== 12 && step > 1 && (
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
