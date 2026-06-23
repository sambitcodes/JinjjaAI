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
  Eye,
  ArrowRight,
  CheckSquare,
  Bookmark,
  Brain,
  AlertCircle,
  HelpCircle
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

interface Course6Phase5ImplicitWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  refusal: "Polite Refusal",
  hint: "Indirect Hint",
  criticism: "Soft Criticism",
  emotional_subtext: "Emotional Subtext"
};

export default function Course6Phase5ImplicitWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course6Phase5ImplicitWizardProps) {
  const getStepMaxXP = (sNum: number) => {
    if (sNum === 1) return 0;
    if (sNum === 10) return 200;
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
    const savedStep = localStorage.getItem("hangeulai_c6p5_step");
    const savedMax = localStorage.getItem("hangeulai_c6p5_max_step");
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
      localStorage.setItem("hangeulai_c6p5_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 10;

  // Data loaded
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);
  const [recognitionData, setRecognitionData] = useState<any>(null);
  const [responseTemplates, setResponseTemplates] = useState<any>(null);
  const [softenTemplates, setSoftenTemplates] = useState<any>(null);

  // Concept check (Step 2 check)
  const [conceptCheckAnswer, setConceptCheckAnswer] = useState<string | null>(null);
  const [conceptCheckChecked, setConceptCheckChecked] = useState(false);
  const [conceptCheckCorrect, setConceptCheckCorrect] = useState<boolean | null>(null);

  // Activity 1: Dialogue Inference (Step 3)
  const [activeDialogueIdx, setActiveDialogueIdx] = useState(0);
  const [selectedDialogueOpt, setSelectedDialogueOpt] = useState<number | null>(null);
  const [dialogueChecked, setDialogueChecked] = useState(false);
  const [dialogueCorrect, setDialogueCorrect] = useState<boolean | null>(null);

  // Activity 2: Yes/No/Maybe (Step 4)
  const [activeYnmIdx, setActiveYnmIdx] = useState(0);
  const [selectedYnm, setSelectedYnm] = useState<string | null>(null);
  const [ynmChecked, setYnmChecked] = useState(false);
  const [ynmCorrect, setYnmCorrect] = useState<boolean | null>(null);

  // Activity 3: Emotion Inference (Step 5)
  const [activeEiIdx, setActiveEiIdx] = useState(0);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [eiChecked, setEiChecked] = useState(false);
  const [eiCorrect, setEiCorrect] = useState<boolean | null>(null);

  // Pattern card expand (Step 2)
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  // Activity 4: Response Templates (Step 6)
  const [activeRtIdx, setActiveRtIdx] = useState(0);
  const [rtStep, setRtStep] = useState<"pick_meaning" | "write_response">("pick_meaning");
  const [selectedRealMeaning, setSelectedRealMeaning] = useState<string | null>(null);
  const [userResponse, setUserResponse] = useState("");
  const [rtFeedback, setRtFeedback] = useState<any>(null);
  const [submittingRt, setSubmittingRt] = useState(false);

  // Activity 5: Softening Choice (Step 7)
  const [activeSoftenIdx, setActiveSoftenIdx] = useState(0);
  const [selectedSoftenOpt, setSelectedSoftenOpt] = useState<number | null>(null);
  const [softenFeedback, setSoftenFeedback] = useState<any>(null);
  const [submittingSoften, setSubmittingSoften] = useState(false);

  // Activity 6: Live Implicit Coach Room (Step 8)
  const [chatContext, setChatContext] = useState<"social" | "academic" | "work">("social");
  const [chatStarted, setChatStarted] = useState(false);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [aiText, setAiText] = useState("");
  const [aiSending, setAiSending] = useState(false);
  const [aiFinished, setAiFinished] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [finishingChat, setFinishingChat] = useState(false);

  // Activity 7: Quiz (Step 9)
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);
  const [quizBadge, setQuizBadge] = useState<string | null>(null);

  // Completion / Homework (Step 10)
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Homework coaching room
  const [coachSessionId, setCoachSessionId] = useState<string | null>(null);
  const [coachMessages, setCoachMessages] = useState<any[]>([]);
  const [coachText, setCoachText] = useState("");
  const [coachSending, setCoachSending] = useState(false);
  const [coachFinished, setCoachFinished] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState<string | null>(null);

  // Restore step from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hangeulai_c6p5_step");
      if (saved) {
        setStep(parseInt(saved, 10));
      }
    }
  }, []);

  // Save step to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hangeulai_c6p5_step", step.toString());
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 6,
          phaseNum: 5,
          step: step
        }
      }));
    }
  }, [step]);

  // Load API resources
  useEffect(() => {
    const load = async () => {
      try {
        if ((step === 1 || step === 10) && !metadata) {
          const res = await apiJson("/phases/korean5/5/metadata");
          setMetadata(res);
        }
        if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean5/5/core-data");
          setCoreData(res);
        }
        if ((step === 3 || step === 4 || step === 5) && !recognitionData) {
          const res = await apiJson("/practice/implicit/recognition");
          setRecognitionData(res);
        }
        if ((step === 6 || step === 7) && !responseTemplates) {
          const [rtRes, stRes] = await Promise.all([
            apiJson("/practice/implicit/response-templates"),
            apiJson("/practice/implicit/soften-templates")
          ]);
          setResponseTemplates(rtRes);
          setSoftenTemplates(stRes);
        }
        if (step === 9 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean5/phase-5/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        }
        if (step === 10 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean5/5/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading Implicit Meaning data:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => speakWord(text);

  // Concept check (Step 2)
  const handleCheckConcept = () => {
    if (conceptCheckChecked) return;
    const isCorrect = conceptCheckAnswer === "B";
    setConceptCheckChecked(true);
    setConceptCheckCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  // Step 3 (Activity 1) Dialogue inference
  const handleCheckDialogue = async () => {
    if (!recognitionData || selectedDialogueOpt === null || dialogueChecked) return;
    const item = recognitionData.recognition_dialogues[activeDialogueIdx];
    const isCorrect = selectedDialogueOpt === item.correct_idx;
    setDialogueChecked(true);
    setDialogueCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");

    try {
      await apiJson("/practice/implicit/recognition/answer", {
        method: "POST",
        body: JSON.stringify({ dialogue_id: item.id, selected_idx: selectedDialogueOpt, time_taken_ms: 2000 })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Step 4 (Activity 2) Yes/No/Maybe
  const handleCheckYnm = () => {
    if (!recognitionData || !selectedYnm || ynmChecked) return;
    const item = recognitionData.yes_no_maybe_items[activeYnmIdx];
    const isCorrect = selectedYnm === item.answer;
    setYnmChecked(true);
    setYnmCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  // Step 5 (Activity 3) Emotion guessing
  const handleCheckEmotion = () => {
    if (!recognitionData || !selectedEmotion || eiChecked) return;
    const item = recognitionData.emotion_inference_items[activeEiIdx];
    const isCorrect = selectedEmotion === item.correct;
    setEiChecked(true);
    setEiCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  // Step 6 (Activity 4) Response builder templates
  const handleSubmitResponse = async () => {
    if (!responseTemplates || !userResponse.trim() || submittingRt || rtFeedback) return;
    const template = responseTemplates.response_templates[activeRtIdx];
    setSubmittingRt(true);
    try {
      const res = await apiJson("/practice/implicit/response/submit", {
        method: "POST",
        body: JSON.stringify({
          template_id: template.id,
          user_response: userResponse,
          real_meaning: template.real_meaning
        })
      });
      setRtFeedback(res);
      playSFX(true ? "correct" : "wrong");
    } catch (e) {
      setRtFeedback({ feedback_en: "Good effort! Compare your response to the model answer below.", feedback_ko: "잘 하셨어요!" });
      playSFX("correct");
    } finally {
      setSubmittingRt(false);
    }
  };

  // Step 7 (Activity 5) Face-saving softening choice
  const handleSubmitSoften = async () => {
    if (!softenTemplates || selectedSoftenOpt === null || submittingSoften || softenFeedback) return;
    const template = softenTemplates.soften_templates[activeSoftenIdx];
    setSubmittingSoften(true);
    try {
      const res = await apiJson("/practice/implicit/soften/submit", {
        method: "POST",
        body: JSON.stringify({ template_id: template.id, selected_option_idx: selectedSoftenOpt })
      });
      setSoftenFeedback(res);
      const isCorrect = selectedSoftenOpt === 0; // Assuming first option is the intended indirect one
      playSFX(isCorrect ? "correct" : "wrong");
    } catch (e) {
      setSoftenFeedback({ feedback_en: "Good choice! That softens the message effectively." });
      playSFX("correct");
    } finally {
      setSubmittingSoften(false);
    }
  };

  // Step 8 (Activity 6) Live coaching session
  const handleStartChat = async () => {
    setAiMessages([]);
    setAiFinished(false);
    setAiReport(null);
    setChatStarted(true);
    try {
      const res = await apiJson("/conversation/c1/implicit-practice/start", { method: "POST" });
      setAiSessionId(res.session_id);
      setAiMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") playAudio(res.opener);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendAiTurn = async () => {
    if (!aiText.trim() || !aiSessionId || aiSending) return;
    const textToSend = aiText;
    setAiText("");
    setAiMessages(prev => [...prev, { sender: "user", text: textToSend }]);
    setAiSending(true);
    try {
      const res = await apiJson("/conversation/c1/implicit-practice/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend, context: chatContext })
      });
      setAiMessages(prev => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") playAudio(res.reply_ko);
    } catch (err) {
      console.error(err);
    } finally {
      setAiSending(false);
    }
  };

  const handleFinishChat = async () => {
    if (!aiSessionId || finishingChat) return;
    setFinishingChat(true);
    try {
      const res = await apiJson("/conversation/c1/implicit-practice/finish", { method: "POST" });
      setAiReport(res.implicit_understanding_report);
      setAiFinished(true);
    } catch (err) {
      console.error(err);
    } finally {
      setFinishingChat(false);
    }
  };

  // Step 9 (Activity 7) Quiz
  const handleCheckQuiz = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelectedOpt || quizChecked) return;

    const isCorrect = quizSelectedOpt === current.correct_answer;
    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");

    if (!isCorrect) {
      setQuizMistakes(prev => [...prev, current.id]);
    }

    try {
      await apiJson("/quiz/korean5/phase-5/answer", {
        method: "POST",
        body: JSON.stringify({ question_id: current.id, answer: quizSelectedOpt, time_taken_ms: 2000 })
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
        const res = await apiJson("/quiz/korean5/phase-5/finish", {
          method: "POST",
          body: JSON.stringify({ score, mistakes: quizMistakes })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Subtext Reader C1");
        setStep(10);
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  // Step 10: Toggle homework logs
  const handleToggleHomework = async (id: string, current: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !current }));
    try {
      await apiJson("/phases/korean5/5/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !current })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Step 10: Homework coaching room
  const handleStartCoaching = async () => {
    setCoachMessages([]);
    setCoachFeedback(null);
    setCoachFinished(false);
    try {
      const res = await apiJson("/conversation/c1/subtext-coaching/start", { method: "POST" });
      setCoachSessionId(res.session_id);
      setCoachMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") playAudio(res.opener);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendCoachTurn = async () => {
    if (!coachText.trim() || !coachSessionId || coachSending) return;
    const textToSend = coachText;
    setCoachText("");
    setCoachMessages(prev => [...prev, { sender: "user", text: textToSend }]);
    setCoachSending(true);
    try {
      const res = await apiJson("/conversation/c1/subtext-coaching/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setCoachMessages(prev => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") playAudio(res.reply_ko);
    } catch (err) {
      console.error(err);
    } finally {
      setCoachSending(false);
    }
  };

  const handleFinishCoaching = async () => {
    if (!coachSessionId) return;
    try {
      const res = await apiJson("/conversation/c1/subtext-coaching/finish", { method: "POST" });
      setCoachFeedback(res.feedback);
      setCoachFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  const outlineSteps = [
    { num: 1, label: "Welcome & Goals" },
    { num: 2, label: "Patterns of Subtext" },
    { num: 3, label: "Act 1: Spot Meaning" },
    { num: 4, label: "Act 2: Yes/No/Maybe" },
    { num: 5, label: "Act 3: Emotion inference" },
    { num: 6, label: "Act 4: Controlled response" },
    { num: 7, label: "Act 5: Indirect choice" },
    { num: 8, label: "Act 6: Live Coaching" },
    { num: 9, label: "Act 7: Subtext Quiz" },
    { num: 10, label: "Graduation & Wrap-up" }
  ];

  return (
    <div className="flex-grow flex flex-col justify-between">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <Eye className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Korean 6.5 – Implicit Meaning & Subtext"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Subtext, Indirectness & Inference</p>
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
            className="text-[10px] bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer uppercase tracking-wider font-bold"
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
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">Required: 500 XP</span>
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
                      if (courseXP < 320) {
                        window.dispatchEvent(new CustomEvent("hangeulai-warning", {
                          detail: { message: "To start Phase 5, you need at least 320 XP in this course. You currently have " + courseXP + " XP." }
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

      {/* Step 1: Welcome & Goals */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Eye className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight font-sans">Korean 6.5</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Implicit Meaning & Subtext</h3>
          <p className="text-zinc-400 text-sm italic">“Reading Between the Lines”</p>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Understand hints, indirectness, and subtext in Korean."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Explain implicit meaning and why it matters at C1 level",
                "Recognise hints, indirect refusals, and hidden negative reactions",
                "Evaluate if a response means yes, no, or maybe based on subtext",
                "Infer emotional dynamics from subtle cues in sentences"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 40}–45 minutes</p>
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
              onClick={() => {
    if (courseXP < 320) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 5, you need at least 320 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 5</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Concept Screen */}
      {step === 2 && coreData && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-5 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>Patterns of Implicit Speech</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">C1 Goal: Reading Between the Lines</p>
            <p className="italic font-serif">
              “At C1, you can recognise implicit meaning — what people suggest without saying it directly. Use clues (words, tone, context, relationship) to reconstruct the real intent.”
            </p>
          </div>

          {/* Patterns table */}
          <div className="space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">5 Core Implicit Patterns in Korean</span>
            <div className="space-y-2">
              {(coreData.implicit_patterns || []).map((pattern: any) => {
                const isExpanded = expandedPattern === pattern.id;
                return (
                  <div
                    key={pattern.id}
                    className="bg-zinc-900 rounded-xl border border-white/5 overflow-hidden cursor-pointer"
                    onClick={() => setExpandedPattern(isExpanded ? null : pattern.id)}
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] uppercase font-mono font-black px-2 py-0.5 rounded-full ${
                          pattern.category === "refusal" ? "bg-accent-pink/15 text-accent-pink" :
                          pattern.category === "hint" ? "bg-brand-500/15 text-brand-400" :
                          pattern.category === "criticism" ? "bg-yellow-500/15 text-yellow-400" :
                          "bg-accent-teal/15 text-accent-teal"
                        }`}>{CATEGORY_LABELS[pattern.category] || pattern.category}</span>
                        <p className="text-xs font-bold text-white">{pattern.pattern_en}</p>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </div>

                    {isExpanded && (
                      <div className="border-t border-white/[0.03] p-3 space-y-2 animate-fade-in">
                        <div className="flex items-start gap-2">
                          <p className="font-korean text-sm text-zinc-200 leading-relaxed flex-1 font-black">{pattern.korean_example}</p>
                          <button onClick={(e) => { e.stopPropagation(); playAudio(pattern.korean_example); }} className="text-zinc-500 hover:text-brand-400 transition shrink-0 cursor-pointer">
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="p-2 bg-zinc-950 rounded-lg border border-white/[0.03]">
                            <p className="text-zinc-500 font-mono uppercase text-[8px] mb-1">Literal Version:</p>
                            <p className="text-zinc-300 italic">{pattern.literal_en}</p>
                          </div>
                          <div className="p-2 bg-accent-teal/5 rounded-lg border border-accent-teal/15">
                            <p className="text-zinc-500 font-mono uppercase text-[8px] mb-1">Real Meaning:</p>
                            <p className="text-accent-teal font-medium">{pattern.real_meaning_en}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {pattern.clues.map((clue: string, i: number) => (
                            <span key={i} className="text-[9px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-white/5">🔍 clue: {clue}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Micro-reflection Concept Check */}
          <div className="p-4 bg-zinc-900/60 rounded-xl border border-white/5 text-left space-y-3">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-brand-400" />
              <span>Concept Check: Which of the following shows an indirect refusal (a polite "no")?</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <button
                onClick={() => !conceptCheckChecked && setConceptCheckAnswer("A")}
                disabled={conceptCheckChecked}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                  conceptCheckAnswer === "A" 
                    ? "border-brand-500 bg-brand-500/10 text-white" 
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                } ${conceptCheckChecked && conceptCheckAnswer === "A" && !conceptCheckCorrect ? "border-accent-pink bg-accent-pink/5" : ""}`}
              >
                <span className="block text-[8px] text-zinc-500 mb-1">Option A:</span>
                <span className="font-korean">안 됩니다. (Cannot do.)</span>
              </button>
              <button
                onClick={() => !conceptCheckChecked && setConceptCheckAnswer("B")}
                disabled={conceptCheckChecked}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                  conceptCheckAnswer === "B" 
                    ? "border-brand-500 bg-brand-500/10 text-white" 
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                } ${conceptCheckChecked && conceptCheckAnswer === "B" && conceptCheckCorrect ? "border-accent-teal bg-accent-teal/5 text-white" : ""}`}
              >
                <span className="block text-[8px] text-brand-400 mb-1">Option B (Softened Refusal):</span>
                <span className="font-korean">조금 어려울 것 같습니다. (It seems difficult.)</span>
              </button>
              <button
                onClick={() => !conceptCheckChecked && setConceptCheckAnswer("C")}
                disabled={conceptCheckChecked}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                  conceptCheckAnswer === "C" 
                    ? "border-brand-500 bg-brand-500/10 text-white" 
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                } ${conceptCheckChecked && conceptCheckAnswer === "C" && !conceptCheckCorrect ? "border-accent-pink bg-accent-pink/5" : ""}`}
              >
                <span className="block text-[8px] text-zinc-500 mb-1">Option C:</span>
                <span className="font-korean">하고 싶지 않습니다. (Do not want.)</span>
              </button>
            </div>

            {conceptCheckChecked && (
              <div className={`p-3 rounded-lg border text-[11px] ${conceptCheckCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                {conceptCheckCorrect 
                  ? "✓ Correct! Option B utilizes cautious hedging ('~것 같습니다') to soften refusal respectfully." 
                  : "✗ Incorrect. Option B is correct because it uses indirect markers to preserve face."}
              </div>
            )}

            {!conceptCheckChecked && conceptCheckAnswer && (
              <div className="flex justify-end">
                <button
                  onClick={handleCheckConcept}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Verify Concept
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button 
              onClick={() => setStep(3)} 
              disabled={!conceptCheckChecked}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              Start Activity 1 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Activity 1 – Dialogue Inference */}
      {step === 3 && recognitionData && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Brain className="w-6 h-6 text-brand-400" />
              <span>Activity A: Spot the hidden message</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Dialogue {activeDialogueIdx + 1}/{recognitionData.recognition_dialogues.length}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            <div className="p-2 bg-zinc-900/60 rounded-xl text-[10px] text-zinc-500 flex items-center gap-1.5 px-3">
              <AlertCircle className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span>Scenario Context: <span className="text-zinc-300 font-bold">{recognitionData.recognition_dialogues[activeDialogueIdx].scenario}</span></span>
            </div>

            <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-[8px] uppercase font-mono font-black px-2.5 py-0.5 rounded-full ${
                  recognitionData.recognition_dialogues[activeDialogueIdx].category === "refusal" ? "bg-accent-pink/15 text-accent-pink" :
                  recognitionData.recognition_dialogues[activeDialogueIdx].category === "hint" ? "bg-brand-500/15 text-brand-400" :
                  "bg-yellow-500/15 text-yellow-400"
                }`}>{CATEGORY_LABELS[recognitionData.recognition_dialogues[activeDialogueIdx].category] || recognitionData.recognition_dialogues[activeDialogueIdx].category}</span>
                
                <button onClick={() => playAudio(recognitionData.recognition_dialogues[activeDialogueIdx].dialogue_ko)} className="p-1 bg-zinc-900 border border-white/5 rounded text-[9px] text-zinc-300 hover:text-white px-2 flex items-center gap-1 cursor-pointer">
                  <Volume2 className="w-3.5 h-3.5" /> Listen Dialogue
                </button>
              </div>
              <div className="space-y-1.5">
                {recognitionData.recognition_dialogues[activeDialogueIdx].dialogue_ko.split("\n").map((line: string, i: number) => (
                  <p key={i} className="font-korean text-zinc-150 text-sm leading-relaxed font-black">{line}</p>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 italic border-t border-white/[0.03] pt-2 whitespace-pre-line">
                {recognitionData.recognition_dialogues[activeDialogueIdx].dialogue_en}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-white">{recognitionData.recognition_dialogues[activeDialogueIdx].question}</p>
              {recognitionData.recognition_dialogues[activeDialogueIdx].options.map((opt: string, idx: number) => {
                let cls = "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10";
                if (dialogueChecked) {
                  if (idx === recognitionData.recognition_dialogues[activeDialogueIdx].correct_idx) {
                    cls = "border-accent-teal bg-accent-teal/5 text-accent-teal font-black";
                  } else if (idx === selectedDialogueOpt) {
                    cls = "border-accent-pink bg-accent-pink/5 text-accent-pink";
                  }
                } else if (selectedDialogueOpt === idx) {
                  cls = "border-brand-500 bg-brand-500/10 text-white";
                }
                return (
                  <button key={idx} onClick={() => !dialogueChecked && setSelectedDialogueOpt(idx)} disabled={dialogueChecked} className={`w-full p-3.5 rounded-xl border text-xs font-medium text-left transition ${cls}`}>
                    {idx === 0 ? "A" : idx === 1 ? "B" : "C"}. {opt}
                  </button>
                );
              })}
            </div>

            {dialogueChecked && (
              <div className={`p-4 rounded-xl border text-xs space-y-2 animate-fade-in ${dialogueCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                <p className="font-black">{dialogueCorrect ? "✓ Correct! You spotted the real meaning." : "✗ Not quite. Here's what to look for:"}</p>
                <p className="text-zinc-355 leading-normal">{recognitionData.recognition_dialogues[activeDialogueIdx].explanation}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {recognitionData.recognition_dialogues[activeDialogueIdx].clue_phrases.map((clue: string, i: number) => (
                    <span key={i} className="text-[9px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded-full border border-white/5">🔍 clue phrase: {clue}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <button onClick={() => {
    if (courseXP < 320) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 5, you need at least 320 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
              {!dialogueChecked ? (
                <button onClick={handleCheckDialogue} disabled={selectedDialogueOpt === null} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer">Verify Meaning</button>
              ) : (
                <button
                  onClick={() => {
                    if (activeDialogueIdx < recognitionData.recognition_dialogues.length - 1) {
                      setActiveDialogueIdx(prev => prev + 1);
                      setSelectedDialogueOpt(null);
                      setDialogueChecked(false);
                      setDialogueCorrect(null);
                    } else {
                      setStep(4);
                    }
                  }}
                  className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {activeDialogueIdx < recognitionData.recognition_dialogues.length - 1 ? "Next Dialogue" : "Proceed to Activity 2"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Activity 2 – Yes / No / Maybe readings */}
      {step === 4 && recognitionData && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Brain className="w-6 h-6 text-brand-400" />
              <span>Activity B: Hidden “no” or “maybe”</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Scenario {activeYnmIdx + 1}/{recognitionData.yes_no_maybe_items.length}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
              <p className="text-[10px] text-zinc-500 font-mono">📋 Context: {recognitionData.yes_no_maybe_items[activeYnmIdx].context}</p>
              <div className="flex items-start gap-2">
                <p className="font-korean text-zinc-200 text-base leading-relaxed flex-1 font-black">"{recognitionData.yes_no_maybe_items[activeYnmIdx].reply_ko}"</p>
                <button onClick={() => playAudio(recognitionData.yes_no_maybe_items[activeYnmIdx].reply_ko)} className="text-zinc-500 hover:text-brand-400 transition cursor-pointer shrink-0">
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 italic">Translation: "{recognitionData.yes_no_maybe_items[activeYnmIdx].reply_en}"</p>
            </div>

            <p className="text-xs font-bold text-white">Is this effectively a YES, NO, or MAYBE?</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: "yes", label: "✅ YES" },
                { val: "polite_no", label: "🚫 NO" },
                { val: "unsure", label: "🤔 MAYBE" }
              ].map(opt => {
                let cls = "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10";
                if (ynmChecked) {
                  if (opt.val === recognitionData.yes_no_maybe_items[activeYnmIdx].answer) {
                    cls = "border-accent-teal bg-accent-teal/5 text-accent-teal font-black";
                  } else if (opt.val === selectedYnm) {
                    cls = "border-accent-pink bg-accent-pink/5 text-accent-pink";
                  }
                } else if (selectedYnm === opt.val) {
                  cls = "border-brand-500 bg-brand-500/10 text-white";
                }
                return (
                  <button key={opt.val} onClick={() => !ynmChecked && setSelectedYnm(opt.val)} disabled={ynmChecked} className={`p-4 rounded-xl border text-xs font-bold transition text-center ${cls}`}>
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {ynmChecked && (
              <div className={`p-4 rounded-xl border text-xs space-y-1.5 animate-fade-in ${ynmCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                <p className="font-black">{ynmCorrect ? "✓ Correct reading!" : "✗ Not quite — here's the key:"}</p>
                <p className="text-zinc-355 leading-relaxed">{recognitionData.yes_no_maybe_items[activeYnmIdx].explanation}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <button onClick={() => setStep(3)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
              {!ynmChecked ? (
                <button onClick={handleCheckYnm} disabled={!selectedYnm} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer">Verify Reading</button>
              ) : (
                <button
                  onClick={() => {
                    if (activeYnmIdx < recognitionData.yes_no_maybe_items.length - 1) {
                      setActiveYnmIdx(prev => prev + 1);
                      setSelectedYnm(null);
                      setYnmChecked(false);
                      setYnmCorrect(null);
                    } else {
                      setStep(5);
                    }
                  }}
                  className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {activeYnmIdx < recognitionData.yes_no_maybe_items.length - 1 ? "Next Scenario" : "Proceed to Activity 3"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Activity 3 – Emotion inference */}
      {step === 5 && recognitionData && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Brain className="w-6 h-6 text-brand-400" />
              <span>Activity C: Guess the feeling behind the words</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Snippet {activeEiIdx + 1}/{recognitionData.emotion_inference_items.length}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-start gap-2">
                <p className="font-korean text-zinc-200 text-sm leading-relaxed flex-1 font-black">"{recognitionData.emotion_inference_items[activeEiIdx].snippet_ko}"</p>
                <button onClick={() => playAudio(recognitionData.emotion_inference_items[activeEiIdx].snippet_ko)} className="text-zinc-500 hover:text-brand-400 transition cursor-pointer shrink-0">
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 italic">Translation: "{recognitionData.emotion_inference_items[activeEiIdx].snippet_en}"</p>
            </div>

            <p className="text-xs font-bold text-white">Select the best emotional label:</p>
            <div className="grid grid-cols-2 gap-2">
              {recognitionData.emotion_inference_items[activeEiIdx].options.map((opt: string) => {
                let cls = "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10";
                if (eiChecked) {
                  if (opt === recognitionData.emotion_inference_items[activeEiIdx].correct) {
                    cls = "border-accent-teal bg-accent-teal/5 text-accent-teal font-black";
                  } else if (opt === selectedEmotion) {
                    cls = "border-accent-pink bg-accent-pink/5 text-accent-pink";
                  }
                } else if (selectedEmotion === opt) {
                  cls = "border-brand-500 bg-brand-500/10 text-white";
                }
                return (
                  <button key={opt} onClick={() => !eiChecked && setSelectedEmotion(opt)} disabled={eiChecked} className={`p-4 rounded-xl border text-xs font-bold transition text-center ${cls}`}>
                    {opt}
                  </button>
                );
              })}
            </div>

            {eiChecked && (
              <div className={`p-4 rounded-xl border text-xs space-y-1.5 animate-fade-in ${eiCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                <p className="font-black">{eiCorrect ? "✓ Correct emotional reading!" : "✗ Good try — here's what signals the emotion:"}</p>
                <p className="text-zinc-355 leading-relaxed">{recognitionData.emotion_inference_items[activeEiIdx].explanation}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <button onClick={() => setStep(4)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
              {!eiChecked ? (
                <button onClick={handleCheckEmotion} disabled={!selectedEmotion} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer">Verify Emotion</button>
              ) : (
                <button
                  onClick={() => {
                    if (activeEiIdx < recognitionData.emotion_inference_items.length - 1) {
                      setActiveEiIdx(prev => prev + 1);
                      setSelectedEmotion(null);
                      setEiChecked(false);
                      setEiCorrect(null);
                    } else {
                      setStep(6);
                    }
                  }}
                  className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {activeEiIdx < recognitionData.emotion_inference_items.length - 1 ? "Next Snippet" : "Proceed to Activity 4"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 6: Activity 4 – Response builder templates */}
      {step === 6 && responseTemplates && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-brand-400" />
              <span>Activity D: Show you understood the hint</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Template {activeRtIdx + 1}/{responseTemplates.response_templates.length}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            {responseTemplates.response_templates[activeRtIdx] && (() => {
              const template = responseTemplates.response_templates[activeRtIdx];
              return (
                <>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-[10px] text-zinc-400">
                    📋 Context Scenario: <span className="text-zinc-200 font-bold">{template.scenario}</span>
                  </div>

                  <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-[8px] uppercase tracking-widest font-mono text-zinc-500 font-bold">Subtle Hint Line:</span>
                    <div className="flex items-start gap-2">
                      <p className="font-korean text-zinc-200 text-sm leading-relaxed flex-1 font-black">"{template.implicit_line_ko}"</p>
                      <button onClick={() => playAudio(template.implicit_line_ko)} className="text-zinc-500 hover:text-brand-400 transition cursor-pointer shrink-0">
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-500 italic">"{template.implicit_line_en}"</p>
                  </div>

                  {rtStep === "pick_meaning" && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-white">Step 1: What do they really mean?</p>
                      <div className="space-y-2">
                        {["They prefer somewhere else or want to reject politely.", template.real_meaning, "They are just expressing general uncertainty."].map((opt, idx) => (
                          <button key={idx} onClick={() => setSelectedRealMeaning(opt)} className={`w-full p-3 rounded-xl border text-xs font-medium text-left transition ${selectedRealMeaning === opt ? "border-brand-500 bg-brand-500/10 text-white" : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <button onClick={() => selectedRealMeaning && setRtStep("write_response")} disabled={!selectedRealMeaning} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">
                          Next: Write Response →
                        </button>
                      </div>
                    </div>
                  )}

                  {rtStep === "write_response" && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-white">Step 2: Write a natural Korean response that responds to the hint:</p>
                      
                      <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 space-y-1">
                        <p className="text-[9px] text-zinc-500 uppercase font-mono font-black">💡 Key Skill:</p>
                        <p className="text-[10px] text-zinc-450 leading-relaxed">{template.key_skill}</p>
                      </div>

                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-white/5 space-y-1">
                        <p className="text-[9px] text-zinc-500 uppercase font-mono font-black">Compare to Direct Version:</p>
                        <p className="font-korean text-xs text-zinc-350">{template.direct_ko || "직접적인 표현..."}</p>
                        <p className="text-[9px] text-zinc-500 italic">"{template.direct_en || "Direct english..."}"</p>
                      </div>

                      <textarea
                        value={userResponse}
                        onChange={e => setUserResponse(e.target.value)}
                        rows={3}
                        disabled={!!rtFeedback}
                        placeholder="Write your Korean response here..."
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-brand-500/50 resize-none font-korean font-black"
                      />

                      {rtFeedback && (
                        <div className="p-4 bg-brand-500/5 border border-brand-500/15 rounded-xl space-y-3 text-xs animate-fade-in">
                          <p className="font-black text-white">✓ Feedback</p>
                          <p className="text-zinc-300 leading-normal">{rtFeedback.feedback_en}</p>
                          <div className="border-t border-white/5 pt-2.5 space-y-1">
                            <p className="text-[9px] text-zinc-500 uppercase font-mono font-black">Model Response:</p>
                            <p className="font-korean text-accent-teal font-black text-sm">{template.model_response_ko}</p>
                            <p className="text-zinc-500 italic text-[10px]">"{template.model_response_en}"</p>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <button onClick={() => setStep(5)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
                        {!rtFeedback ? (
                          <button onClick={handleSubmitResponse} disabled={!userResponse.trim() || submittingRt} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                            {submittingRt && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Submit Response</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (activeRtIdx < responseTemplates.response_templates.length - 1) {
                                setActiveRtIdx(prev => prev + 1);
                                setRtStep("pick_meaning");
                                setSelectedRealMeaning(null);
                                setUserResponse("");
                                setRtFeedback(null);
                              } else {
                                setStep(7);
                              }
                            }}
                            className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            {activeRtIdx < responseTemplates.response_templates.length - 1 ? "Next Template" : "Proceed to Activity 5"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Step 7: Activity 5 – Softening directness choice (preserving face) */}
      {step === 7 && softenTemplates && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-brand-400" />
              <span>Activity E: Which reply preserves face?</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Item {activeSoftenIdx + 1}/{softenTemplates.soften_templates.length}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            {softenTemplates.soften_templates[activeSoftenIdx] && (() => {
              const template = softenTemplates.soften_templates[activeSoftenIdx];
              return (
                <>
                  <div className="p-4 bg-accent-pink/5 border border-accent-pink/15 rounded-2xl space-y-2">
                    <span className="text-[8px] uppercase tracking-widest font-mono text-accent-pink font-bold">Too Direct / Blunt Version:</span>
                    <p className="font-korean text-zinc-200 text-sm font-black">{template.direct_ko}</p>
                    <p className="text-[10px] text-zinc-500 italic">Translation: "{template.direct_en}"</p>
                  </div>

                  <p className="text-xs font-bold text-white">Select the more indirect, face-saving version:</p>
                  <div className="space-y-2">
                    {template.indirect_options.map((opt: any, idx: number) => {
                      let cls = "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10";
                      if (softenFeedback) {
                        cls = idx === 0 ? "border-accent-teal bg-accent-teal/5 text-accent-teal font-black" : "border-white/5 bg-zinc-900/30 text-zinc-500";
                      } else if (selectedSoftenOpt === idx) {
                        cls = "border-brand-500 bg-brand-500/10 text-white";
                      }
                      return (
                        <button key={idx} onClick={() => !softenFeedback && setSelectedSoftenOpt(idx)} disabled={!!softenFeedback} className={`w-full p-4 rounded-2xl border text-left flex flex-col gap-1.5 transition ${cls}`}>
                          <span className="text-[8px] uppercase tracking-widest font-mono font-black text-zinc-500">{opt.label}</span>
                          <p className="font-korean text-sm font-black leading-snug">{opt.ko}</p>
                          <p className="text-[10px] italic text-zinc-400">"{opt.en}"</p>
                        </button>
                      );
                    })}
                  </div>

                  {softenFeedback && (
                    <div className="p-4 bg-accent-teal/5 border border-accent-teal/20 rounded-xl text-xs space-y-1 animate-fade-in">
                      <p className="font-black text-accent-teal">✓ Good choice!</p>
                      <p className="text-zinc-350 leading-relaxed">{softenFeedback.feedback_en}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <button onClick={() => setStep(6)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
                    {!softenFeedback ? (
                      <button onClick={handleSubmitSoften} disabled={selectedSoftenOpt === null || submittingSoften} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                        {submittingSoften && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Submit Choice</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (activeSoftenIdx < softenTemplates.soften_templates.length - 1) {
                            setActiveSoftenIdx(prev => prev + 1);
                            setSelectedSoftenOpt(null);
                            setSoftenFeedback(null);
                          } else {
                            setStep(8);
                          }
                        }}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        {activeSoftenIdx < softenTemplates.soften_templates.length - 1 ? "Next Item" : "Proceed to Activity 6"}
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Step 8: Activity 6 – Live AI coaching room */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity F: Implicit Listening Room</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 8 of {totalSteps}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
              <p className="text-xs font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-400" /> Live Reading Between the Lines</p>
              <p className="text-[10px] text-zinc-400 leading-relaxed">The AI coach will use indirect Korean speech. Your job: figure out the real meaning and respond appropriately!</p>
            </div>

            {!chatStarted ? (
              <div className="space-y-3 max-w-sm mx-auto w-full">
                <p className="text-xs font-bold text-white">Select conversation context:</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["social", "academic", "work"] as const).map(ctx => (
                    <button key={ctx} onClick={() => setChatContext(ctx)} className={`p-3 rounded-xl border text-xs font-bold capitalize transition ${chatContext === ctx ? "border-brand-500 bg-brand-500/10 text-white" : "border-white/5 bg-zinc-900 text-zinc-400"}`}>
                      {ctx === "social" ? "👥 Social" : ctx === "academic" ? "📚 Academic" : "💼 Work"}
                    </button>
                  ))}
                </div>
                <button onClick={handleStartChat} className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg">
                  <Eye className="w-4 h-4" /> Start Dialogue Session
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {aiMessages.map((msg, idx) => (
                    <div key={idx} className={`p-3.5 rounded-xl text-xs leading-relaxed ${msg.sender === "assistant" ? "bg-brand-500/10 border border-brand-500/15 text-zinc-200" : "bg-zinc-900 border border-white/5 text-zinc-300 ml-4 font-korean"}`}>
                      <span className="text-[8px] uppercase font-mono text-zinc-550 block mb-1">{msg.sender === "assistant" ? "AI Coach" : "You"}</span>
                      {msg.text}
                    </div>
                  ))}
                  {aiSending && <div className="flex items-center gap-2 text-zinc-500 text-xs pl-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Coach is hints drafting...</div>}
                </div>

                {!aiFinished && (
                  <div className="flex gap-2">
                    <input value={aiText} onChange={e => setAiText(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendAiTurn()} placeholder="Interpret their hint and respond..." className="flex-grow bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-brand-500/50 font-korean" disabled={aiSending} />
                    <button onClick={handleSendAiTurn} disabled={!aiText.trim() || aiSending} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl transition cursor-pointer text-xs font-bold">Send</button>
                  </div>
                )}

                {aiFinished && aiReport && (
                  <div className="p-4 bg-brand-500/5 border border-brand-500/15 rounded-xl text-xs space-y-2 animate-fade-in">
                    <p className="font-black text-white">📊 Implicit Understanding Report</p>
                    <div className="space-y-1">
                      {(aiReport.successes || ["Spotted the polite refusal markers."]).map((s: string, i: number) => <p key={i} className="text-accent-teal">✓ {s}</p>)}
                      {(aiReport.missed_hints || ["Slightly missed the emotional subtext in the second line."]).map((m: string, i: number) => <p key={i} className="text-yellow-400">⚠ {m}</p>)}
                      {(aiReport.suggestions || ["Practice reading '조금 어려울 것 같다' as direct refusal."]).map((s: string, i: number) => <p key={i} className="text-zinc-400 font-semibold">💡 suggestion: {s}</p>)}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button onClick={() => setChatStarted(false)} className="text-xs text-zinc-500 hover:underline">Reset Room</button>
                  <div className="flex gap-2">
                    {!aiFinished && aiMessages.length >= 3 && (
                      <button
                        onClick={handleFinishChat}
                        disabled={finishingChat}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {finishingChat && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Finish Dialogue</span>
                      </button>
                    )}
                    {aiFinished && (
                      <button
                        onClick={() => setStep(9)}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Proceed to Quiz
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 9: Activity 7 – Implicit strategy quiz */}
      {step === 9 && quizBlueprint.length > 0 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Activity G: Final check on subtext skills</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Question {quizIdx + 1}/{quizBlueprint.length}</span>
          </div>

          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2">
              <span className="text-[8px] uppercase font-mono font-black px-2.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-400">
                {quizBlueprint[quizIdx].type.replace(/_/g, " ")}
              </span>
            </div>

            <p className="text-sm font-extrabold text-white leading-relaxed">
              {quizBlueprint[quizIdx].question}
            </p>

            <div className="space-y-2">
              {quizBlueprint[quizIdx].options.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                  className={`w-full p-4 rounded-xl text-left text-xs font-medium border transition ${
                    quizSelectedOpt === opt 
                      ? "border-brand-500 bg-brand-500/10 text-white" 
                      : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                  } ${quizChecked && opt === quizBlueprint[quizIdx].correct_answer ? "border-accent-teal bg-accent-teal/10 text-white font-bold" : ""}`}
                  disabled={quizChecked}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {quizChecked && (
            <div className={`p-4 rounded-2xl border text-xs space-y-1.5 animate-fade-in ${
              quizCorrect 
                ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" 
                : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"
            }`}>
              <p className="font-black">{quizCorrect ? "✓ Correct!" : "✗ Not quite."}</p>
              <p className="text-zinc-350 leading-normal">{quizBlueprint[quizIdx].explanation}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(8)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
            {!quizChecked ? (
              <button
                onClick={handleCheckQuiz}
                disabled={!quizSelectedOpt}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Verify Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuizOrComplete}
                disabled={finishingQuiz}
                className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {finishingQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Complete & Receive Badge"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 10: Completion / Graduation */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-4 bg-accent-teal/10 rounded-full border border-accent-teal/25 w-fit mx-auto text-accent-teal shrink-0">
            <Award className="w-12 h-12 animate-bounce shrink-0" />
          </div>

          <h2 className="text-3xl font-black text-white">Implicit Meaning Completed</h2>
          <p className="text-xs text-zinc-400">Congratulations! You have completed Phase 5 and earned your subtext credentials:</p>

          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full flex items-center gap-4 text-left shadow-lg">
            <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/25">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white">Badge Earned: {quizBadge || "Subtext Reader C1"}</p>
              <p className="text-[10px] text-zinc-400">Graduation Score: {quizScore || 100}% | +150 XP rewarded</p>
            </div>
          </div>

          {coachFeedback && (
            <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 text-left text-xs max-w-md mx-auto w-full">
              <p className="font-black text-white mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-accent-teal" />
                <span>✓ Coaching Complete!</span>
              </p>
              <p className="text-zinc-350 leading-relaxed">{coachFeedback}</p>
            </div>
          )}

          {/* Spaced Homework Recommendations */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Spaced Homework Recommendations:</span>
            
            <div className="space-y-2">
              {(homeworkItems.length > 0 ? homeworkItems : [
                { id: "hw1", text: "Identify hidden 'no' in 3 indirect Korean replies." },
                { id: "hw2", text: "Write softened face-saving versions for 3 direct claims." }
              ]).map((item: any) => (
                <div 
                  key={item.id}
                  onClick={() => handleToggleHomework(item.id, !!completedHomework[item.id])}
                  className="flex items-start gap-3 p-2.5 bg-zinc-900 rounded-xl border border-white/[0.03] hover:border-brand-500/20 transition cursor-pointer"
                >
                  <button className="mt-0.5 shrink-0">
                    <CheckSquare className={`w-4 h-4 ${completedHomework[item.id] ? "text-accent-teal" : "text-zinc-600"}`} />
                  </button>
                  <p className="text-[11px] text-zinc-300 leading-normal">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI subtext coaching practice room */}
          <div className="border-t border-white/5 pt-4 max-w-md mx-auto w-full text-left space-y-3">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">🤖 Spaced AI coaching:</span>
            {!coachSessionId ? (
              <button
                onClick={handleStartCoaching}
                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-white py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-brand-400" /> Start Coaching Practice
              </button>
            ) : (
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3 animate-fade-in">
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {coachMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl text-[10px] leading-relaxed whitespace-pre-line ${
                        msg.sender === "assistant"
                          ? "bg-brand-500/10 border border-brand-500/15 text-zinc-200"
                          : "bg-zinc-900 border border-white/5 text-zinc-300 ml-4 font-korean"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {coachSending && (
                    <div className="flex items-center gap-2 text-zinc-500 text-xs pl-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
                    </div>
                  )}
                </div>

                {!coachFinished && (
                  <div className="flex gap-2">
                    <input
                      value={coachText}
                      onChange={e => setCoachText(e.target.value)}
                      placeholder="Write Korean..."
                      className="flex-grow bg-zinc-900 border border-white/10 p-2 rounded-lg outline-none focus:border-brand-500 text-[10px] text-white font-korean"
                    />
                    <button
                      onClick={handleSendCoachTurn}
                      disabled={coachSending || !coachText.trim()}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Send
                    </button>
                    <button
                      onClick={handleFinishCoaching}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border border-white/5"
                    >
                      Done
                    </button>
                  </div>
                )}

                {coachFinished && coachFeedback && (
                  <div className="p-2.5 bg-accent-teal/5 border border-accent-teal/20 text-accent-teal text-[10px] rounded-lg animate-fade-in leading-relaxed">
                    {coachFeedback}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-3 text-xs text-zinc-400 space-y-1 text-left max-w-md mx-auto w-full">
            <p className="font-bold text-white text-[11px]">🚀 Up Next:</p>
            <p>Phase 6 – C1 Advanced Communication Capstone (combining all skills)</p>
          </div>

          <div className="flex flex-col gap-2 max-w-xs mx-auto pt-4 border-t border-white/5 w-full">
            <button 
              onClick={() => {
                // Dispatch completion bonus XP
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 150, type: "correct" } }));onComplete();
              }}
              className="bg-accent-teal hover:bg-accent-teal/90 text-zinc-950 font-black py-4 px-8 rounded-xl transition text-base flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-accent-teal/20"
            >
              <span>Graduate Phase 5</span>
              <ArrowRight className="w-4 h-4" />
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
