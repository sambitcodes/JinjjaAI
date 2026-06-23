"use client";

import { useEffect, useState, useRef } from "react";
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
  MessageSquare,
  ArrowRight,
  HelpCircle,
  MessageCircle,
  Users,
  Briefcase,
  GraduationCap,
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

interface Course5Phase3SocialWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course5Phase3SocialWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course5Phase3SocialWizardProps) {
  const phaseNum = 3;
  const getStepMaxXP = (sNum: number) => {
    try {
      return (xpAudit as any)["5"]?.[phaseNum.toString()]?.steps?.[sNum.toString()]?.max_xp ?? 35;
    } catch (e) {
      return 35;
    }
  };
  const getStepXP = (sNum: number) => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(`hangeulai_c5p${phaseNum}_s${sNum}_earned_xp`) || "0", 10);
  };

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c5p3_step");
    const savedMax = localStorage.getItem("hangeulai_c5p3_max_step");
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
      localStorage.setItem("hangeulai_c5p3_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 9;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Concept Explanation Filters
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Micro-check C1
  const [c1Selected, setC1Selected] = useState<string | null>(null);
  const [c1Checked, setC1Checked] = useState(false);
  const [c1Correct, setC1Correct] = useState<boolean | null>(null);

  // Micro-check C2
  const [c2Selected, setC2Selected] = useState<string | null>(null);
  const [c2Checked, setC2Checked] = useState(false);
  const [c2Correct, setC2Correct] = useState<boolean | null>(null);

  // Activity 1 states (Dialog Analysis)
  const [dialogueItems, setDialogueItems] = useState<any[]>([]);
  const [dialIdx, setDialIdx] = useState(0);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [selectedAgreeLine, setSelectedAgreeLine] = useState<string | null>(null);
  const [act1Checked, setAct1Checked] = useState(false);
  const [act1Correct, setAct1Correct] = useState<boolean | null>(null);

  // Activity 2 states (Builders)
  const [taskTemplates, setTaskTemplates] = useState<any>(null);
  const [selectedContext2A, setSelectedContext2A] = useState<string>("social");
  const [typedAction, setTypedAction] = useState("도서관에서 공부");
  const [selectedPattern, setSelectedPattern] = useState("shall_we");
  const [selectedStance, setSelectedStance] = useState("agree");
  const [selectedResponsePattern, setSelectedResponsePattern] = useState("agree");
  const [builtSuggestion, setBuiltSuggestion] = useState<any>(null);
  const [builtResponse, setBuiltResponse] = useState<any>(null);
  const [buildingSuggestion, setBuildingSuggestion] = useState(false);
  const [buildingResponse, setBuildingResponse] = useState(false);

  // Activity 3 states (Live role-play)
  const [roleplaySessionId, setRoleplaySessionId] = useState<string | null>(null);
  const [roleplayScenario, setRoleplayScenario] = useState<string>("social");
  const [roleplayMessages, setRoleplayMessages] = useState<any[]>([]);
  const [roleplayText, setRoleplayText] = useState("");
  const [roleplaySending, setRoleplaySending] = useState(false);
  const [roleplayFinished, setRoleplayFinished] = useState(false);
  const [roleplayFeedback, setRoleplayFeedback] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  // Quiz states (Activity 4)
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);
  const [quizBadge, setQuizBadge] = useState<string | null>(null);

  // Activity 5 states (Extra social practice chat)
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [practiceMessages, setPracticeMessages] = useState<any[]>([]);
  const [practiceText, setPracticeText] = useState("");
  const [practiceSending, setPracticeSending] = useState(false);
  const [practiceFinished, setPracticeFinished] = useState(false);

  
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});
// --- Start Progress State Preservation ---
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hangeulai_c5p3_progress_state");
        if (saved) {
          const state = JSON.parse(saved);
            if (state.step !== undefined) setStep(state.step);
            if (state.maxStep !== undefined) setMaxStep(state.maxStep);
            if (state.selectedFilter !== undefined) setSelectedFilter(state.selectedFilter);
            if (state.c1Selected !== undefined) setC1Selected(state.c1Selected);
            if (state.c1Checked !== undefined) setC1Checked(state.c1Checked);
            if (state.c1Correct !== undefined) setC1Correct(state.c1Correct);
            if (state.c2Selected !== undefined) setC2Selected(state.c2Selected);
            if (state.c2Checked !== undefined) setC2Checked(state.c2Checked);
            if (state.c2Correct !== undefined) setC2Correct(state.c2Correct);
            if (state.dialIdx !== undefined) setDialIdx(state.dialIdx);
            if (state.selectedContext !== undefined) setSelectedContext(state.selectedContext);
            if (state.selectedTopic !== undefined) setSelectedTopic(state.selectedTopic);
            if (state.selectedSpeaker !== undefined) setSelectedSpeaker(state.selectedSpeaker);
            if (state.selectedAgreeLine !== undefined) setSelectedAgreeLine(state.selectedAgreeLine);
            if (state.act1Checked !== undefined) setAct1Checked(state.act1Checked);
            if (state.act1Correct !== undefined) setAct1Correct(state.act1Correct);
            if (state.selectedContext2A !== undefined) setSelectedContext2A(state.selectedContext2A);
            if (state.selectedPattern !== undefined) setSelectedPattern(state.selectedPattern);
            if (state.selectedStance !== undefined) setSelectedStance(state.selectedStance);
            if (state.selectedResponsePattern !== undefined) setSelectedResponsePattern(state.selectedResponsePattern);
            if (state.roleplayText !== undefined) setRoleplayText(state.roleplayText);
            if (state.roleplayFinished !== undefined) setRoleplayFinished(state.roleplayFinished);
            if (state.quizIdx !== undefined) setQuizIdx(state.quizIdx);
            if (state.quizChecked !== undefined) setQuizChecked(state.quizChecked);
            if (state.quizCorrect !== undefined) setQuizCorrect(state.quizCorrect);
            if (state.quizSelectedOpt !== undefined) setQuizSelectedOpt(state.quizSelectedOpt);
            if (state.quizMistakes !== undefined) setQuizMistakes(state.quizMistakes);
            if (state.quizScore !== undefined) setQuizScore(state.quizScore);
            if (state.practiceText !== undefined) setPracticeText(state.practiceText);
            if (state.practiceFinished !== undefined) setPracticeFinished(state.practiceFinished);
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
            selectedFilter,
            c1Selected,
            c1Checked,
            c1Correct,
            c2Selected,
            c2Checked,
            c2Correct,
            dialIdx,
            selectedContext,
            selectedTopic,
            selectedSpeaker,
            selectedAgreeLine,
            act1Checked,
            act1Correct,
            selectedContext2A,
            selectedPattern,
            selectedStance,
            selectedResponsePattern,
            roleplayText,
            roleplayFinished,
            quizIdx,
            quizChecked,
            quizCorrect,
            quizSelectedOpt,
            quizMistakes,
            quizScore,
            practiceText,
            practiceFinished,
            completedHomework
        };
        localStorage.setItem("hangeulai_c5p3_progress_state", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save progress state:", e);
      }
    }
  }, [step, maxStep, selectedFilter, c1Selected, c1Checked, c1Correct, c2Selected, c2Checked, c2Correct, dialIdx, selectedContext, selectedTopic, selectedSpeaker, selectedAgreeLine, act1Checked, act1Correct, selectedContext2A, selectedPattern, selectedStance, selectedResponsePattern, roleplayText, roleplayFinished, quizIdx, quizChecked, quizCorrect, quizSelectedOpt, quizMistakes, quizScore, practiceText, practiceFinished, completedHomework]);
  // --- End Progress State Preservation ---

  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);

  // Homework check lists (Step 9)
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  

  // Persist progress to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c5p3_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 9) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c5p3_step", String(step));
  }, [step]);

  // Load API Data per Step
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean4/3/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean4/3/core-data");
          setCoreData(res);
        } else if (step === 4 && dialogueItems.length === 0) {
          const res = await apiJson("/practice/social-work/dialogues");
          setDialogueItems(res.dialogues || []);
        } else if (step === 5 && !taskTemplates) {
          const res = await apiJson("/practice/social-work/templates");
          setTaskTemplates(res);
        } else if (step === 7 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean4/phase-3/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 9 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean4/3/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading B1 social data:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  const handleC1Check = () => {
    if (!c1Selected) return;
    setC1Checked(true);
    setC1Correct(true);
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

    const isCorrect = 
      selectedContext === current.questions.where && 
      selectedTopic === current.questions.topic &&
      selectedSpeaker === current.questions.suggestion_speaker &&
      selectedAgreeLine === current.questions.agreement_line;

    setAct1Checked(true);
    setAct1Correct(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  const handleNextActivity1 = () => {
    setAct1Checked(false);
    setAct1Correct(null);
    setSelectedContext(null);
    setSelectedTopic(null);
    setSelectedSpeaker(null);
    setSelectedAgreeLine(null);

    if (dialIdx < dialogueItems.length - 1) {
      setDialIdx(dialIdx + 1);
    } else {
      setStep(5); // Go to Builders
    }
  };

  // Activity 2 builders
  const handleBuildSuggestion = async () => {
    setBuildingSuggestion(true);
    try {
      const res = await apiJson("/practice/social-work/build-suggestion", {
        method: "POST",
        body: JSON.stringify({
          action: typedAction,
          pattern_id: selectedPattern
        })
      });
      setBuiltSuggestion(res);
      playAudio(res.reply_ko);
    } catch (err) {
      console.error(err);
    } finally {
      setBuildingSuggestion(false);
    }
  };

  const handleBuildResponse = async () => {
    setBuildingResponse(true);
    try {
      const res = await apiJson("/practice/social-work/build-response", {
        method: "POST",
        body: JSON.stringify({
          stance: selectedStance,
          pattern_id: selectedResponsePattern
        })
      });
      setBuiltResponse(res);
      playAudio(res.reply_ko);
    } catch (err) {
      console.error(err);
    } finally {
      setBuildingResponse(false);
    }
  };

  // Activity 3: Live Roleplay
  const handleStartRoleplay = async () => {
    setRoleplayMessages([]);
    setRoleplayFeedback(null);
    setRoleplayFinished(false);
    try {
      const res = await apiJson("/conversation/b1/social-work/start", {
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
      const res = await apiJson("/conversation/b1/social-work/turn", {
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
      const res = await apiJson("/conversation/b1/social-work/finish", { method: "POST" });
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
      setRoleplayText("오늘 우리 같이 공부할까요? 도서관에서요.");
    }, 2000);
  };

  // Activity 4: Quiz check
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
      await apiJson("/quiz/korean4/phase-3/answer", {
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
        const res = await apiJson("/quiz/korean4/phase-3/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Social Communicator B1");
        setStep(8); // Go to Activity 5 (practice chat)
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  // Activity 5: Open Practice Chat
  const handleStartPractice = async () => {
    setPracticeMessages([]);
    setPracticeFeedback(null);
    setPracticeFinished(false);
    try {
      const res = await apiJson("/conversation/b1/social-practice/start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: "social" })
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
      const res = await apiJson("/conversation/b1/social-practice/turn", {
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
      const res = await apiJson("/conversation/b1/social-practice/finish", { method: "POST" });
      setPracticeFeedback(res.feedback);
      setPracticeFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework((prev) => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/phases/korean4/3/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const outlineSteps = [
    { num: 1, label: "Welcome & Goals" },
    { num: 2, label: "Concept 1: Social Contexts" },
    { num: 3, label: "Concept 2: Suggest & Reply" },
    { num: 4, label: "Activity 1: Dialog MCQs" },
    { num: 5, label: "Activity 2: Builder Lab" },
    { num: 6, label: "Activity 3: AI Peer Role-Play" },
    { num: 7, label: "Activity 4: Strategy Quiz" },
    { num: 8, label: "Activity 5: Open Practice Chat" },
    { num: 9, label: "Phase Graduation" }
  ];

  return (
    <div className="flex-grow flex flex-col justify-between min-h-[75vh] text-zinc-100 font-sans">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <Users className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Korean 4.3 – Social & Work/Study Conversations"}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-brand-500/10 text-brand-300 border border-brand-500/20 rounded-md uppercase tracking-wider">B1 Interaction</span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium">Course 5 &bull; Phase 3</p>
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

      {showOutline && (() => {
        const phaseEarnedXP = outlineSteps.reduce((acc, s) => acc + getStepXP(s.num), 0);
        const phaseMaxXP = outlineSteps.reduce((acc, s) => acc + getStepMaxXP(s.num), 0);
        return (
          <div className="mb-6 p-5 bg-zinc-955/80 rounded-3xl border border-white/5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 relative z-30">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 font-mono">Curriculum Syllabus Map</span>
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">Required: 340 XP</span>
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
                      if (courseXP < 160) {
                        window.dispatchEvent(new CustomEvent("hangeulai-warning", {
                          detail: { message: "To start Phase 3, you need at least 160 XP in this course. You currently have " + courseXP + " XP." }
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

      {/* Screen 1: Welcome/Overview */}
      {step === 1 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-4 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Users className="w-10 h-10 animate-bounce shrink-0" />
          </div>
          
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Social &amp; Work/Study</h2>
            <h3 className="text-xl font-extrabold text-brand-400 mt-2">Classmates, Colleagues, Friends</h3>
          </div>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Use Korean naturally with classmates, colleagues, and friends."}
          </p>

          <div className="bg-zinc-950/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Talk about school, work, and plans with classmates and colleagues",
                "Understand small talk discussions and extract location/topics",
                "Formulate and respond to suggestions politely (shall we, how about...)",
                "Agree or disagree softly while explaining reasons"
              ]).map((g: string, idx: number) => (
                <li key={idx} className="text-zinc-300">{g}</li>
              ))}
            </ul>
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs border-t border-white/5 mt-4">
              <p><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 35} minutes</p>
              <p><strong>📋 Level:</strong> Intermediate B1 (Korean 4.3)</p>
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
                    ? "border-brand-500 bg-brand-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                Text input
              </button>
              <button
                onClick={() => setMode("voice")}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === "voice" 
                    ? "border-brand-500 bg-brand-500/10 text-white" 
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
    if (courseXP < 160) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 3, you need at least 160 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="bg-brand-600 hover:bg-brand-500 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-600/20"
            >
              <span>Start Phase 3</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Screen 2: Concept 1 - Contexts */}
      {step === 2 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>Concept Screen 1: Interaction Contexts</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 2 of {totalSteps}</span>
          </div>

          <p className="text-xs text-zinc-400 max-w-xl mx-auto">
            At B1, learners should talk about school, work, and free time with classmates, colleagues, and friends.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto w-full">
            <div className="p-4 bg-zinc-950 rounded-xl border border-white/5">
              <div className="p-2.5 bg-brand-500/10 border border-brand-500/20 rounded-xl w-fit text-brand-400 mb-2">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-xs mb-1">Classroom / Study Groups</h4>
              <p className="text-[10px] text-zinc-400 leading-normal">Asking peers about tests, coordinating library study, sharing notes.</p>
            </div>
            <div className="p-4 bg-zinc-950 rounded-xl border border-white/5">
              <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl w-fit text-yellow-400 mb-2">
                <Briefcase className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-xs mb-1">Office / Part-Time Job</h4>
              <p className="text-[10px] text-zinc-400 leading-normal">Coordinating shifts, asking colleagues about meeting times, task sharing.</p>
            </div>
            <div className="p-4 bg-zinc-950 rounded-xl border border-white/5">
              <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl w-fit text-orange-400 mb-2">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-xs mb-1">Café / Casual Friends</h4>
              <p className="text-[10px] text-zinc-400 leading-normal">Suggesting weekend plans, eating out together, chatting about hobbies.</p>
            </div>
          </div>

          {/* Micro-question C1 */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl mx-auto w-full">
            <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest block font-mono">Micro Checkpoint C1</span>
            <p className="text-sm font-bold text-white text-left">Which of these contexts do you personally expect to use Korean in most: school/class, work, or friends/free time?</p>
            
            <div className="grid grid-cols-3 gap-2">
              {["school", "work", "friends"].map((opt) => {
                let borderStyle = "border-white/5 bg-zinc-900/60 text-zinc-300";
                if (c1Selected === opt) {
                  borderStyle = "border-brand-500 bg-brand-500/10 text-white";
                }
                if (c1Checked) {
                  borderStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                }
                return (
                  <button
                    key={opt}
                    disabled={c1Checked}
                    onClick={() => setC1Selected(opt)}
                    className={`py-3 px-2 rounded-xl border text-center text-xs font-bold transition capitalize cursor-pointer ${borderStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {c1Checked && (
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl text-xs text-left animate-fade-in text-green-300">
                <p className="font-extrabold mb-1">✓ Setting Saved!</p>
                <p>Excellent. We will customize our conversation prompts to ensure you gain experience discussing topics relevant to your selection.</p>
              </div>
            )}

            {!c1Checked && (
              <button
                onClick={handleC1Check}
                disabled={!c1Selected}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition cursor-pointer"
              >
                Submit Choice
              </button>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 5 Phase 3 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 5 Phase 3 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Next Screen <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Concept 2 - Moves */}
      {step === 3 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>Concept Screen 2: Suggesting &amp; Replying</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 3 of {totalSteps}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto w-full">
            <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 space-y-2">
              <span className="text-[10px] text-brand-400 font-bold block uppercase">1. Making Suggestions</span>
              <p className="text-xs text-zinc-300">Propose time, location, or ideas using polite endings:</p>
              <ul className="list-disc list-inside text-[11px] text-zinc-400 space-y-1">
                <li>~할까요? (Shall we do...?)</li>
                <li>~어때요? (How about...?)</li>
              </ul>
            </div>
            <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 space-y-2">
              <span className="text-[10px] text-yellow-400 font-bold block uppercase">2. Reacting / Agreement</span>
              <p className="text-xs text-zinc-300">Agree or politely decline with soft explanations:</p>
              <ul className="list-disc list-inside text-[11px] text-zinc-400 space-y-1">
                <li>좋아요. 같이 해요! (Great. Let's do it together!)</li>
                <li>그 시간은 좀 어려워요... (That time is a bit difficult...)</li>
              </ul>
            </div>
          </div>

          {/* Micro-question C2 */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl mx-auto w-full text-left">
            <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest block font-mono">Micro Checkpoint C2</span>
            <p className="text-sm font-bold text-white">Which phrase is a polite suggestion pattern to invite a peer to grab food?</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: "A", text: "오늘 점심 같이 먹을까요?" },
                { id: "B", text: "점심 먹었어요." },
                { id: "C", text: "그건 맛없어요." }
              ].map((opt) => {
                let borderStyle = "border-white/5 bg-zinc-900/60 text-zinc-300";
                if (c2Selected === opt.id) {
                  borderStyle = "border-brand-500 bg-brand-500/10 text-white";
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
                <p>~을까요? is the standard polite suggestion structure used to propose shared activities.</p>
              </div>
            )}

            {!c2Checked && (
              <button
                onClick={handleC2Check}
                disabled={!c2Selected}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition cursor-pointer"
              >
                Submit Check
              </button>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 5 Phase 3 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 5 Phase 3 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => {
    if (courseXP < 160) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 3, you need at least 160 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 1 - Dialogue Analysis */}
      {step === 4 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Understand Social/Work Dialogue Structure</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 4 of {totalSteps}</span>
          </div>

          {dialogueItems.length > 0 && dialogueItems[dialIdx] && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6 text-left max-w-3xl mx-auto w-full animate-fade-in">
              
              {/* Dialogue Box */}
              <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-3 max-h-40 overflow-y-auto custom-scrollbar">
                <span className="text-[9px] text-brand-400 font-mono block">READ / LISTEN TO SOCIAL DIALOGUE:</span>
                {dialogueItems[dialIdx].turns.map((turn: any, idx: number) => (
                  <div key={idx} className="space-y-0.5 text-xs">
                    <p className="text-white font-korean"><strong className="text-brand-400">{turn.speaker}:</strong> {turn.ko}</p>
                    <p className="text-zinc-500">{turn.en}</p>
                  </div>
                ))}
              </div>

              {/* MCQs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Q1 Context location */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-white">Q1: What is the context location?</span>
                  <div className="flex flex-col gap-1">
                    {dialogueItems[dialIdx].questions.choices_where.map((whereOpt: string) => {
                      let btnStyle = "border-white/5 bg-zinc-900 text-zinc-300";
                      if (selectedContext === whereOpt) btnStyle = "border-brand-500 bg-brand-500/10 text-white";
                      if (act1Checked) {
                        if (whereOpt === dialogueItems[dialIdx].questions.where) btnStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                        else if (selectedContext === whereOpt) btnStyle = "border-red-500 bg-red-500/10 text-red-300";
                      }
                      return (
                        <button
                          key={whereOpt}
                          disabled={act1Checked}
                          onClick={() => setSelectedContext(whereOpt)}
                          className={`p-2 rounded-lg border text-left text-[11px] font-medium transition cursor-pointer ${btnStyle}`}
                        >
                          {whereOpt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q2 Topic */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-white">Q2: What is the main conversation topic?</span>
                  <div className="flex flex-col gap-1">
                    {dialogueItems[dialIdx].questions.choices_topic.map((topicOpt: string) => {
                      let btnStyle = "border-white/5 bg-zinc-900 text-zinc-300";
                      if (selectedTopic === topicOpt) btnStyle = "border-brand-500 bg-brand-500/10 text-white";
                      if (act1Checked) {
                        if (topicOpt === dialogueItems[dialIdx].questions.topic) btnStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                        else if (selectedTopic === topicOpt) btnStyle = "border-red-500 bg-red-500/10 text-red-300";
                      }
                      return (
                        <button
                          key={topicOpt}
                          disabled={act1Checked}
                          onClick={() => setSelectedTopic(topicOpt)}
                          className={`p-2 rounded-lg border text-left text-[11px] font-medium transition cursor-pointer ${btnStyle}`}
                        >
                          {topicOpt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q3 Suggestion speaker */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-white">Q3: Who makes the suggestion?</span>
                  <div className="flex flex-col gap-1">
                    {["Ji-Won", "Min-Su"].map((sp) => {
                      let btnStyle = "border-white/5 bg-zinc-900 text-zinc-300";
                      if (selectedSpeaker === sp) btnStyle = "border-brand-500 bg-brand-500/10 text-white";
                      if (act1Checked) {
                        if (sp === dialogueItems[dialIdx].questions.suggestion_speaker) btnStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                        else if (selectedSpeaker === sp) btnStyle = "border-red-500 bg-red-500/10 text-red-300";
                      }
                      return (
                        <button
                          key={sp}
                          disabled={act1Checked}
                          onClick={() => setSelectedSpeaker(sp)}
                          className={`p-2 rounded-lg border text-left text-[11px] font-medium transition cursor-pointer ${btnStyle}`}
                        >
                          {sp}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q4 Agreement Sentence */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-white">Q4: Choose the sentence expressing Agreement:</span>
                  <div className="flex flex-col gap-1">
                    {dialogueItems[dialIdx].turns.slice(2).map((t: any, i: number) => {
                      let btnStyle = "border-white/5 bg-zinc-900 text-zinc-300";
                      if (selectedAgreeLine === t.ko) btnStyle = "border-brand-500 bg-brand-500/10 text-white";
                      if (act1Checked) {
                        if (t.ko === dialogueItems[dialIdx].questions.agreement_line) btnStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                        else if (selectedAgreeLine === t.ko) btnStyle = "border-red-500 bg-red-500/10 text-red-300";
                      }
                      return (
                        <button
                          key={i}
                          disabled={act1Checked}
                          onClick={() => setSelectedAgreeLine(t.ko)}
                          className={`p-2 rounded-lg border text-left text-[11px] font-korean transition cursor-pointer ${btnStyle}`}
                        >
                          {t.ko}
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
                  <p className="font-extrabold text-sm">{act1Correct ? "✓ Correct! Excellent analysis." : "✗ Incorrect."}</p>
                  <p className="text-zinc-350 mt-1">Analyzed arguments and opinions successfully.</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!act1Checked ? (
                  <button
                    onClick={handleCheckActivity1}
                    disabled={!selectedContext || !selectedTopic || !selectedSpeaker || !selectedAgreeLine}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-6 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Analysis
                  </button>
                ) : (
                  <button
                    onClick={handleNextActivity1}
                    className="bg-purple-600 text-white hover:bg-purple-500 px-5 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {dialIdx < dialogueItems.length - 1 ? "Next Dialogue" : "Continue to Suggestion Builders"}
                  </button>
                )}
              </div>

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Builders <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Activity 2 - Suggestion & Response Builders */}
      {step === 5 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Suggestion &amp; Response Builders</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 5 of {totalSteps}</span>
          </div>

          {taskTemplates && (
            <div className="space-y-6 max-w-3xl mx-auto w-full text-left">
              {/* Context Selector */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-brand-400">Interaction Builder Context</span>
                <select
                  value={selectedContext2A}
                  onChange={(e) => {
                    setSelectedContext2A(e.target.value);
                    setBuiltSuggestion(null);
                    setBuiltResponse(null);
                  }}
                  className="bg-zinc-900 border border-white/10 p-1.5 rounded-lg text-xs text-white"
                >
                  <option value="social">Social Plan</option>
                  <option value="study">Group study</option>
                  <option value="work">Work schedule</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Builder A - Suggestion */}
                <div className="p-5 bg-zinc-950 border border-white/5 rounded-2xl space-y-3.5 text-xs w-full">
                  <span className="text-[10px] text-brand-400 font-bold uppercase block tracking-wider">Step 1: Suggestion Builder</span>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-400">Action Activity Description:</label>
                    <input
                      type="text"
                      value={typedAction}
                      onChange={(e) => setTypedAction(e.target.value)}
                      placeholder="e.g. 같이 공부 or 영화 보기"
                      className="w-full bg-zinc-900 border border-white/5 p-2.5 rounded-lg text-white font-korean"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-400">Invite Ending Style:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {taskTemplates.suggestion_patterns?.map((pat: any) => (
                        <button
                          key={pat.id}
                          onClick={() => setSelectedPattern(pat.id)}
                          className={`p-2 rounded-lg border text-left font-semibold transition ${
                            selectedPattern === pat.id
                              ? "border-brand-500 bg-brand-500/10 text-white"
                              : "border-white/5 bg-zinc-900 text-zinc-400"
                          }`}
                        >
                          {pat.desc}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleBuildSuggestion}
                    disabled={buildingSuggestion || !typedAction.trim()}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-black py-2.5 px-4 rounded-xl text-xs w-full transition cursor-pointer"
                  >
                    Assemble Suggestion
                  </button>

                  {builtSuggestion && (
                    <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 animate-fade-in">
                      <p className="font-korean font-bold text-white text-sm">{builtSuggestion.reply_ko}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{builtSuggestion.reply_en}</p>
                    </div>
                  )}
                </div>

                {/* Builder B - Response */}
                <div className="p-5 bg-zinc-950 border border-white/5 rounded-2xl space-y-3.5 text-xs w-full">
                  <span className="text-[10px] text-yellow-400 font-bold uppercase block tracking-wider">Step 2: Response Builder</span>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-400 font-bold">Stance Opinion:</label>
                    <div className="grid grid-cols-2 gap-2 font-sans">
                      <button
                        onClick={() => {
                          setSelectedStance("agree");
                          setSelectedResponsePattern("agree");
                        }}
                        className={`p-2 rounded-lg border font-semibold transition ${
                          selectedStance === "agree"
                            ? "border-yellow-500 bg-yellow-500/10 text-white"
                            : "border-white/5 bg-zinc-900 text-zinc-400"
                        }`}
                      >
                        Polite Agree
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStance("disagree");
                          setSelectedResponsePattern("disagree");
                        }}
                        className={`p-2 rounded-lg border font-semibold transition ${
                          selectedStance === "disagree"
                            ? "border-yellow-500 bg-yellow-500/10 text-white"
                            : "border-white/5 bg-zinc-900 text-zinc-400"
                        }`}
                      >
                        Soft Disagree
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleBuildResponse}
                    disabled={buildingResponse || !builtSuggestion}
                    className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white font-black py-2.5 px-4 rounded-xl text-xs w-full transition cursor-pointer"
                  >
                    Assemble Reply
                  </button>

                  {builtResponse && (
                    <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 animate-fade-in font-korean">
                      <p className="font-bold text-white text-sm">{builtResponse.reply_ko}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-sans">{builtResponse.reply_en}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(4)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(6)} className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-bold">Move to AI Role-Play <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 6: Activity 3 - Live Roleplay with colleague */}
      {step === 6 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-brand-400" />
              <span>Activity 3 – Live Conversation Peer Roleplay</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 6 of {totalSteps}</span>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto w-full text-left">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-brand-400">Classmate/Colleague Scenario</span>
              <select
                value={roleplayScenario}
                onChange={(e) => {
                  setRoleplayScenario(e.target.value);
                  setRoleplaySessionId(null);
                }}
                disabled={!!roleplaySessionId}
                className="bg-zinc-900 border border-white/10 p-1.5 rounded-lg text-xs text-white"
              >
                <option value="social">Casual Meetup</option>
                <option value="study">Study coordination</option>
                <option value="work">Office assignment task</option>
              </select>
            </div>

            {!roleplaySessionId ? (
              <div className="p-8 bg-zinc-950 border border-white/10 rounded-[2rem] text-center space-y-5 w-full">
                <div className="p-4 bg-brand-500/10 border border-brand-500/25 rounded-full w-fit mx-auto text-brand-400">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed max-w-md mx-auto">
                  Start a dialog with your classmate/colleague. Suggest a time/place or project plans and express simple agreement/disagreement!
                </p>
                <button
                  onClick={handleStartRoleplay}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-black py-3 px-8 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-brand-500/25 animate-pulse"
                >
                  Initiate Roleplay
                </button>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {/* Chat window */}
                <div className="bg-zinc-950 rounded-2xl border border-white/10 p-4 h-60 overflow-y-auto space-y-3.5 custom-scrollbar">
                  {roleplayMessages.map((msg, idx) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
                        <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                          isUser 
                            ? "bg-brand-500 text-white rounded-tr-none" 
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
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                        <span className="text-[10px] text-zinc-550">Colleague typing...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scaffolding chips */}
                <div className="space-y-2">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block font-mono">Conversation helper templates:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {["내일 같이 공부할까요?", "몇 시에 만날까요?", "좋아요. 그때 봐요.", "내일은 좀 바빠서 안 돼요."].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => setRoleplayText((prev) => prev + (prev ? " " : "") + chip)}
                        className="px-2.5 py-1 bg-zinc-900 border border-white/5 hover:border-brand-500/35 text-[10px] text-zinc-300 rounded-lg font-korean transition cursor-pointer"
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
                      placeholder="Make a plan proposal or agree/disagree politely..."
                      onKeyDown={(e) => e.key === "Enter" && handleSendRoleplayTurn()}
                      className="flex-grow bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500 font-korean"
                    />
                    <button
                      onClick={handleSendRoleplayTurn}
                      disabled={roleplaySending || !roleplayText.trim()}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>Send</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleFinishRoleplay}
                      className="px-4 bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Finish Chat
                    </button>
                  </div>
                ) : (
                  <div className="p-5 bg-zinc-900 rounded-xl border border-brand-500/20 space-y-3 animate-fade-in">
                    <p className="font-extrabold text-white">Evaluation Report:</p>
                    <p className="text-xs text-zinc-350 leading-relaxed bg-zinc-950 p-3.5 rounded-lg border border-white/5 italic">
                      {roleplayFeedback}
                    </p>
                    <button
                      onClick={() => setStep(7)}
                      className="w-full mt-2 bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Proceed to Strategy Quiz
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(5)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(7)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-bold">Move to Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 7: Activity 4 - Social strategy quiz */}
      {step === 7 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Mini-Quiz: Interaction Check</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 7 of {totalSteps}</span>
          </div>

          {quizBlueprint.length > 0 && quizBlueprint[quizIdx] && (
            <div className="space-y-6 max-w-xl mx-auto w-full text-left animate-fade-in">
              <div className="flex justify-between text-[10px] text-zinc-450 font-mono">
                <span>Quiz Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span>Type: B1 Social Strategy</span>
              </div>

              <h3 className="text-base md:text-lg font-black text-white text-center leading-relaxed whitespace-pre-line bg-zinc-950 p-5 rounded-2xl border border-white/5">
                {quizBlueprint[quizIdx].question}
              </h3>

              <div className="grid grid-cols-1 gap-2.5 max-w-md mx-auto w-full font-sans">
                {quizBlueprint[quizIdx].options?.map((opt: string) => {
                  let borderStyle = "border-white/5 bg-zinc-900 text-zinc-300 hover:bg-zinc-800";
                  if (quizSelectedOpt === opt) {
                    borderStyle = "border-brand-500 bg-brand-500/10 text-white";
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
                <button id="prev-btn-6" onClick={() => setStep(6)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                {!quizChecked ? (
                  <button
                    id="submit-quiz-btn"
                    onClick={handleCheckQuiz}
                    disabled={!quizSelectedOpt}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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

      {/* Screen 8: Activity 5 - Open Social practice chat */}
      {step === 8 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-brand-400" />
              <span>Activity 5 – Extended Open practice chat</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 8 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 text-left max-w-2xl mx-auto w-full font-sans">
            <div className="space-y-1">
              <span className="text-[9px] text-brand-400 font-mono uppercase tracking-widest block font-bold">Extra Peer practice Chat</span>
              <p className="text-xs text-zinc-400 leading-normal">
                Chat openly with Gwan-Sik. Ask him about study/work routines, weekend plans, or project tasks.
              </p>
            </div>

            {!practiceSessionId ? (
              <div className="flex justify-center pt-2">
                <button
                  id="start-practice-btn"
                  onClick={handleStartPractice}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-black py-3 px-8 rounded-xl text-xs transition cursor-pointer"
                >
                  Start Open Conversation Practice
                </button>
              </div>
            ) : (
              <div className="space-y-3 w-full animate-fade-in">
                <div className="bg-zinc-900 rounded-xl p-4 border border-white/5 h-44 overflow-y-auto space-y-2.5 custom-scrollbar">
                  {practiceMessages.map((msg, idx) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
                        <div className={`max-w-[80%] rounded-xl p-2.5 text-xs leading-relaxed ${
                          isUser ? "bg-brand-500 text-white border-t-none" : "bg-zinc-950 text-zinc-300 border border-white/5"
                        }`}>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {practiceSending && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 italic">
                      <Loader2 className="w-3 h-3 animate-spin text-brand-400" />
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
                      placeholder="Discuss routines, opinions, plans, school or work..."
                      onKeyDown={(e) => e.key === "Enter" && handleSendPracticeTurn()}
                      className="flex-grow bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-korean"
                    />
                    <button
                      onClick={handleSendPracticeTurn}
                      disabled={practiceSending || !practiceText.trim()}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 rounded-lg text-xs font-bold transition cursor-pointer"
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
                    <p className="font-bold text-white mb-1">Feedback Summary:</p>
                    <p>{practiceFeedback || "Completed social interaction practice!"}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(7)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(9)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-bold">Proceed to Graduation <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 9: Graduation & Completion */}
      {step === 9 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in max-w-3xl mx-auto">
          <div className="p-4 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400">
            <Award className="w-10 h-10 animate-bounce" />
          </div>
          
          <div>
            <h2 className="text-3xl font-black text-white font-sans">Korean 4.3 Social Graduated! 🎓👥</h2>
            <p className="text-zinc-400 text-sm mt-1.5 font-sans">Congratulations on completing Korean 4.3! Next: Phase 4 – Politeness, Register & Nuance in Real Contexts.</p>
          </div>

          {/* Homework list */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-left text-xs space-y-3 font-sans leading-relaxed">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-400 block font-sans">Interactive Homework List:</span>
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
                        {item.id === "hw_b1_soc_1" ? "Task 1: Script Writing" : item.id === "hw_b1_soc_2" ? "Task 2: Spoken Practice" : "Task 3: Reflection"}
                      </span>
                      <span className={isChecked ? "line-through text-zinc-500" : ""}>{item.text}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* completion path details */}
          <div className="p-5 bg-gradient-to-r from-brand-500/10 to-yellow-500/10 rounded-2xl border border-brand-500/20 text-center space-y-1">
            <div className="flex justify-center items-center gap-1 text-brand-400 font-extrabold text-sm uppercase">
              <Award className="w-5 h-5" />
              <span>Badge Earned: {quizBadge || "Social Communicator B1"}</span>
            </div>
            <div className="flex justify-center gap-4 text-xs font-bold pt-1">
              <span className="text-brand-400 font-sans">XP +150 Completion Bonus</span>
              <span className="text-zinc-655">|</span>
              <span className="text-yellow-400 font-sans">Phase 3 Complete</span>
            </div>
          </div>

          <button
            id="finish-phase-btn"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 150, type: "correct" } }));
              }onComplete();
            }}
            className="bg-gradient-to-r from-brand-500 to-yellow-500 hover:from-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/20 cursor-pointer"
          >
            <span>Complete Phase 3 &amp; Continue</span>
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
                
                // Find matching blueprint question index
                const bpIdx = (quizBlueprint || []).findIndex((q: any) => q.correct_answer === m || q.question === m || q.correctId === m);
                if (bpIdx !== -1) {
                  if (typeof setQuizIdx === "function") setQuizIdx(bpIdx);
                if (typeof setQuizChecked === "function") setQuizChecked(false);
                if (typeof setQuizCorrect === "function") setQuizCorrect(null);
                if (typeof setQuizScore === "function") setQuizScore(null);
                if (typeof setQuizSelectedOpt === "function") setQuizSelectedOpt(null);
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
