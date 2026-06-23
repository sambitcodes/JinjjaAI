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

interface Course5Phase4RegisterWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course5Phase4RegisterWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course5Phase4RegisterWizardProps) {
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
    const savedStep = localStorage.getItem("hangeulai_c5p4_step");
    const savedMax = localStorage.getItem("hangeulai_c5p4_max_step");
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
      localStorage.setItem("hangeulai_c5p4_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 9;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Micro-check C1
  const [c1Selected, setC1Selected] = useState<string | null>(null);
  const [c1Checked, setC1Checked] = useState(false);
  const [c1Correct, setC1Correct] = useState<boolean | null>(null);

  // Activity 1 states (Register Recognition)
  const [recognitionItems, setRecognitionItems] = useState<any[]>([]);
  const [recIdx, setRecIdx] = useState(0);
  const [selectedListener, setSelectedListener] = useState<string | null>(null);
  const [selectedApprop, setSelectedApprop] = useState<string | null>(null);
  const [act1Checked, setAct1Checked] = useState(false);
  const [act1Correct, setAct1Correct] = useState<boolean | null>(null);

  // Activity 2 states (Transform adapts)
  const [transformTemplates, setTransformTemplates] = useState<any[]>([]);
  const [activeTransIdx, setActiveTransIdx] = useState(0);
  const [selectedContext, setSelectedContext] = useState<string>("friend");
  const [selectedTransformOption, setSelectedTransformOption] = useState<string | null>(null);
  const [builtTransform, setBuiltTransform] = useState<any>(null);
  const [buildingTransform, setBuildingTransform] = useState(false);

  // Activity 3 states (Softening Builder)
  const [selectedSoftener, setSelectedSoftener] = useState<string | null>(null);
  const [selectedBaseIdea, setSelectedBaseIdea] = useState<string>("그건 틀렸어요 (That is wrong)");
  const [builtSoften, setBuiltSoften] = useState<any>(null);
  const [buildingSoften, setBuildingSoften] = useState(false);

  // Activity 4 states (Contrastive role-play: friend vs teacher)
  const [roleplaySessionId, setRoleplaySessionId] = useState<string | null>(null);
  const [roleplayScenario, setRoleplayScenario] = useState<string>("friend"); // friend vs teacher
  const [roleplayMessages, setRoleplayMessages] = useState<any[]>([]);
  const [roleplayText, setRoleplayText] = useState("");
  const [roleplaySending, setRoleplaySending] = useState(false);
  const [roleplayFinished, setRoleplayFinished] = useState(false);
  const [roleplayFeedback, setRoleplayFeedback] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  // Quiz states (Activity 5)
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);
  const [quizBadge, setQuizBadge] = useState<string | null>(null);

  // Activity 6 states (Politeness practice chat)
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [practiceScenario, setPracticeScenario] = useState<string>("friend");
  const [practiceMessages, setPracticeMessages] = useState<any[]>([]);
  const [practiceText, setPracticeText] = useState("");
  const [practiceSending, setPracticeSending] = useState(false);
  const [practiceFinished, setPracticeFinished] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);

  // Homework check lists (Step 9)
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Persist progress to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c5p4_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 9) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c5p4_step", String(step));
  }, [step]);

  // Load API Data per Step
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean4/4/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean4/4/core-data");
          setCoreData(res);
        } else if (step === 3 && recognitionItems.length === 0) {
          const res = await apiJson("/practice/register/recognition");
          setRecognitionItems(res.items || []);
        } else if (step === 4 && transformTemplates.length === 0) {
          const res = await apiJson("/practice/register/transform-templates");
          setTransformTemplates(res || []);
        } else if (step === 7 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean4/phase-4/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 9 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean4/4/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading B1 register data:", err);
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

  // Activity 1 check
  const handleCheckActivity1 = () => {
    const current = recognitionItems[recIdx];
    if (!current) return;

    const correctListener = selectedListener === current.listener;
    const correctApprop = selectedApprop === "OK"; // Simple mapping for OK check
    const isCorrect = correctListener && correctApprop;

    setAct1Checked(true);
    setAct1Correct(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  const handleNextActivity1 = () => {
    setAct1Checked(false);
    setAct1Correct(null);
    setSelectedListener(null);
    setSelectedApprop(null);

    if (recIdx < recognitionItems.length - 1) {
      setRecIdx(recIdx + 1);
    } else {
      setStep(4); // Go to Transform activity
    }
  };

  // Activity 2 Adapt transform
  const handleTransformRegister = async () => {
    const current = transformTemplates[activeTransIdx];
    if (!current || !selectedTransformOption) return;

    setBuildingTransform(true);
    try {
      const res = await apiJson("/practice/register/transform", {
        method: "POST",
        body: JSON.stringify({
          base_sentence: current.base_meaning,
          target_context: selectedContext,
          learner_choice: selectedTransformOption
        })
      });
      setBuiltTransform(res);
      playAudio(res.evaluated_sentence);
    } catch (err) {
      console.error(err);
    } finally {
      setBuildingTransform(false);
    }
  };

  const handleNextTransform = () => {
    setBuiltTransform(null);
    setSelectedTransformOption(null);
    if (activeTransIdx < transformTemplates.length - 1) {
      setActiveTransIdx(activeTransIdx + 1);
    } else {
      setStep(5); // Move to Softening
    }
  };

  // Activity 3 Softening
  const handleSoftenRegister = async () => {
    if (!selectedSoftener) return;
    setBuildingSoften(true);
    try {
      const res = await apiJson("/practice/register/soften", {
        method: "POST",
        body: JSON.stringify({
          softening_phrase: selectedSoftener,
          base_idea: selectedBaseIdea
        })
      });
      setBuiltSoften(res);
      playAudio(res.reply_ko);
    } catch (err) {
      console.error(err);
    } finally {
      setBuildingSoften(false);
    }
  };

  // Activity 4 Contrastive Roleplay
  const handleStartRoleplay = async (scen: string) => {
    setRoleplayScenario(scen);
    setRoleplayMessages([]);
    setRoleplayFeedback(null);
    setRoleplayFinished(false);
    try {
      const res = await apiJson("/conversation/b1/register-switch/start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: scen })
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
      const res = await apiJson("/conversation/b1/register-switch/turn", {
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
      const res = await apiJson("/conversation/b1/register-switch/finish", { method: "POST" });
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
      if (roleplayScenario === "friend") {
        setRoleplayText("응, 숙제 다 했어. 너는?");
      } else {
        setRoleplayText("교수님, 과제 제출했는데요. 질문이 있습니다.");
      }
    }, 2000);
  };

  // Activity 5 Quiz check
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
      await apiJson("/quiz/korean4/phase-4/answer", {
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
        const res = await apiJson("/quiz/korean4/phase-4/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Polite Speaker B1");
        setStep(8); // Go to Activity 6
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  // Activity 6 Politeness Practice
  const handleStartPractice = async (scen: string) => {
    setPracticeScenario(scen);
    setPracticeMessages([]);
    setPracticeFeedback(null);
    setPracticeFinished(false);
    try {
      const res = await apiJson("/conversation/b1/politeness-practice/start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: scen })
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
      const res = await apiJson("/conversation/b1/politeness-practice/turn", {
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
      const res = await apiJson("/conversation/b1/politeness-practice/finish", { method: "POST" });
      setPracticeFeedback(res.feedback);
      setPracticeFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework((prev) => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/phases/korean4/4/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const outlineSteps = [
    { num: 1, label: "Welcome & Goals" },
    { num: 2, label: "Concept 1: Definition" },
    { num: 3, label: "Activity 1: Recognition" },
    { num: 4, label: "Activity 2: Transforms" },
    { num: 5, label: "Activity 3: Softenings" },
    { num: 6, label: "Activity 4: Peer/Teacher Chat" },
    { num: 7, label: "Activity 5: Strategy Quiz" },
    { num: 8, label: "Activity 6: Practice Lab" },
    { num: 9, label: "Phase Graduation" }
  ];

  return (
    <div className="flex-grow flex flex-col justify-between min-h-[75vh] text-zinc-100 font-sans">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <GraduationCap className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Korean 4.4 – Register & Politeness"}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-brand-500/10 text-brand-300 border border-brand-500/20 rounded-md uppercase tracking-wider font-sans">B1 Register</span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium">Course 5 &bull; Phase 4</p>
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
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">Required: 420 XP</span>
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
                      if (courseXP < 240) {
                        window.dispatchEvent(new CustomEvent("hangeulai-warning", {
                          detail: { message: "To start Phase 4, you need at least 240 XP in this course. You currently have " + courseXP + " XP." }
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
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-4 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <GraduationCap className="w-10 h-10 animate-bounce shrink-0" />
          </div>
          
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Register &amp; Politeness</h2>
            <h3 className="text-xl font-extrabold text-brand-400 mt-2">Friends vs Teachers vs Staff</h3>
          </div>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto font-sans">
            {metadata?.description || "Speak differently with friends, teachers, and staff."}
          </p>

          <div className="bg-zinc-950/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1 font-sans">
              {(metadata?.goals || [
                "Understand register rules and why politeness varies with listener and context",
                "Recognize appropriate register forms for friends vs teachers vs strangers",
                "Transform sentences appropriately matching listener constraints",
                "Soften direct speech, commands, or complaints"
              ]).map((g: string, idx: number) => (
                <li key={idx} className="text-zinc-300">{g}</li>
              ))}
            </ul>
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs border-t border-white/5 mt-4">
              <p><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 35} minutes</p>
              <p><strong>📋 Level:</strong> Intermediate B1 (Korean 4.4)</p>
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
    if (courseXP < 240) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 4, you need at least 240 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="bg-brand-600 hover:bg-brand-500 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-600/20"
            >
              <span>Start Phase 4</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Screen 2: Concept 1 - Register Definition */}
      {step === 2 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>Concept Screen 1: Definition of Register</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 2 of {totalSteps}</span>
          </div>

          {/* Goal Callout */}
          <div className="bg-brand-950/30 p-5 rounded-2xl border border-brand-500/20 text-sm leading-relaxed text-zinc-300 text-left">
            <div className="flex items-center gap-2 mb-2 font-sans">
              <Info className="w-4 h-4 text-brand-400" />
              <span className="font-bold text-white uppercase tracking-wider text-xs font-sans">Pragmatic Definition:</span>
            </div>
            <p className="italic text-zinc-200">
              "Register is how you say something, not just what you say. You change your language depending on who you’re talking to and the situation."
            </p>
          </div>

          {/* Register Examples */}
          <div className="space-y-3.5 text-left text-xs">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-sans">Korean Register Spectrum</span>
            {coreData?.register_examples?.map((ex: any, idx: number) => (
              <div key={idx} className="p-4 bg-zinc-900 border border-white/5 rounded-2xl space-y-3">
                <span className="text-brand-400 font-bold">Semantic Intent: "{ex.meaning}"</span>
                <div className="grid grid-cols-3 gap-2.5 text-[10px]">
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-white/5">
                    <span className="text-red-400 font-bold block mb-1">Friend (반말):</span>
                    <span className="font-korean">{ex.friend}</span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-white/5">
                    <span className="text-green-400 font-bold block mb-1">Teacher (존댓말):</span>
                    <span className="font-korean">{ex.teacher}</span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-white/5">
                    <span className="text-cyan-400 font-bold block mb-1">Staff (공손함):</span>
                    <span className="font-korean">{ex.staff}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Micro-question C1 */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl mx-auto w-full text-left">
            <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest block font-mono">Micro Checkpoint C1</span>
            <p className="text-sm font-bold text-white">Can you think of one phrase you’d say differently to a close friend versus a professor in English?</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: "A", text: "Yes. Say 'Hey, what's up?' to friend vs 'Good morning, Professor' to teacher." },
                { id: "B", text: "No, they would sound exactly identical in English." }
              ].map((opt) => {
                let borderStyle = "border-white/5 bg-zinc-900/60 text-zinc-300";
                if (c1Selected === opt.id) {
                  borderStyle = "border-brand-500 bg-brand-500/10 text-white";
                }
                if (c1Checked) {
                  if (opt.id === "A") {
                    borderStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                  } else if (c1Selected === opt.id) {
                    borderStyle = "border-red-500 bg-red-500/10 text-red-300 font-extrabold";
                  }
                }
                return (
                  <button
                    key={opt.id}
                    disabled={c1Checked}
                    onClick={() => setC1Selected(opt.id)}
                    className={`py-3 px-4 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${borderStyle}`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {c1Checked && (
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl text-xs text-left animate-fade-in text-green-300">
                <p className="font-extrabold mb-1">✓ Correct!</p>
                <p>Same concept in Korean! We choose between casual banmal (반말) and polite jondetmal (존댓말) depending on hierarchy and intimacy.</p>
              </div>
            )}

            {!c1Checked && (
              <button
                onClick={handleC1Check}
                disabled={!c1Selected}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition cursor-pointer"
              >
                Submit Response
              </button>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Next Screen <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1 - Register Recognition */}
      {step === 3 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Register Recognition &amp; Appropriateness</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 3 of {totalSteps}</span>
          </div>

          {recognitionItems.length > 0 && recognitionItems[recIdx] && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6 text-left max-w-3xl mx-auto w-full animate-fade-in">
              
              {/* Context prompt */}
              <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                <span className="text-[9px] text-brand-400 font-mono block">ANALYZE SENTENCE:</span>
                <p className="font-korean text-lg font-bold text-white">{recognitionItems[recIdx].sentence}</p>
                <p className="text-zinc-500 text-xs italic">{recognitionItems[recIdx].gloss}</p>
              </div>

              {/* Questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Q1 Listener */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-white">Q1: Who is the most likely listener?</span>
                  <div className="flex flex-col gap-1.5 font-sans">
                    {recognitionItems[recIdx].choices_listener.map((lstOpt: string) => {
                      let btnStyle = "border-white/5 bg-zinc-900 text-zinc-300";
                      if (selectedListener === lstOpt) {
                        btnStyle = "border-brand-500 bg-brand-500/10 text-white";
                      }
                      if (act1Checked) {
                        if (lstOpt === recognitionItems[recIdx].listener) {
                          btnStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                        } else if (selectedListener === lstOpt) {
                          btnStyle = "border-red-500 bg-red-500/10 text-red-300";
                        }
                      }
                      return (
                        <button
                          key={lstOpt}
                          disabled={act1Checked}
                          onClick={() => setSelectedListener(lstOpt)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${btnStyle}`}
                        >
                          {lstOpt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q2 Appropriateness */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-white">Q2: Speaking to a professor after class: is this statement appropriate?</span>
                  <div className="flex flex-col gap-1.5 font-sans">
                    {["too casual", "too formal", "OK"].map((apprOpt) => {
                      let btnStyle = "border-white/5 bg-zinc-900 text-zinc-300";
                      if (selectedApprop === apprOpt) {
                        btnStyle = "border-brand-500 bg-brand-500/10 text-white";
                      }
                      if (act1Checked) {
                        if (apprOpt === "OK") {
                          btnStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                        } else if (selectedApprop === apprOpt) {
                          btnStyle = "border-red-500 bg-red-500/10 text-red-300";
                        }
                      }
                      return (
                        <button
                          key={apprOpt}
                          disabled={act1Checked}
                          onClick={() => setSelectedApprop(apprOpt)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${btnStyle}`}
                        >
                          {apprOpt}
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
                  <p className="font-extrabold text-sm">{act1Correct ? "✓ Correct register detection!" : "✗ Mismatch detected."}</p>
                  <p className="text-zinc-350 mt-1">{recognitionItems[recIdx].appropriateness}</p>
                </div>
              )}

              <div className="flex justify-end pt-1 font-sans">
                {!act1Checked ? (
                  <button
                    onClick={handleCheckActivity1}
                    disabled={!selectedListener || !selectedApprop}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-6 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Appropriateness
                  </button>
                ) : (
                  <button
                    onClick={handleNextActivity1}
                    className="bg-purple-600 text-white hover:bg-purple-500 px-5 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {recIdx < recognitionItems.length - 1 ? "Next Challenge" : "Continue to Transforms"}
                  </button>
                )}
              </div>

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => {
    if (courseXP < 240) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 4, you need at least 240 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Transforms <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 2 - Adapting Transforms */}
      {step === 4 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Register Adaptation Transforms</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 4 of {totalSteps}</span>
          </div>

          {transformTemplates.length > 0 && transformTemplates[activeTransIdx] && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6 text-left max-w-3xl mx-auto w-full animate-fade-in">
              <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl">
                <span className="text-[9px] text-zinc-500 block uppercase font-mono mb-0.5">Base Intent Meaning:</span>
                <p className="text-sm font-bold text-white">{transformTemplates[activeTransIdx].base_meaning}</p>
                <p className="font-korean text-xs text-zinc-400 italic mt-0.5">Neutral form: {transformTemplates[activeTransIdx].neutral_ko}</p>
              </div>

              {/* Context Selector */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-white">Select Target Context Listener:</span>
                <div className="flex gap-2">
                  {["friend", "teacher", "staff"].map((ctx) => (
                    <button
                      key={ctx}
                      onClick={() => {
                        setSelectedContext(ctx);
                        setBuiltTransform(null);
                        setSelectedTransformOption(null);
                      }}
                      className={`flex-grow py-2 rounded-xl border text-xs font-bold uppercase transition cursor-pointer ${
                        selectedContext === ctx
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                      }`}
                    >
                      {ctx}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select transforms option */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-white">Choose the context-appropriate variant:</span>
                <div className="flex flex-col gap-2 font-korean">
                  {[
                    transformTemplates[activeTransIdx].friend_ver,
                    transformTemplates[activeTransIdx].teacher_ver,
                    transformTemplates[activeTransIdx].staff_ver
                  ].map((verOption) => (
                    <button
                      key={verOption}
                      onClick={() => setSelectedTransformOption(verOption)}
                      className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                        selectedTransformOption === verOption
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900 text-zinc-300 hover:border-white/10"
                      }`}
                    >
                      {verOption}
                    </button>
                  ))}
                </div>
              </div>

              {builtTransform ? (
                <div className="p-4 bg-zinc-900 rounded-xl border border-brand-500/20 text-xs space-y-2 animate-fade-in font-korean">
                  <span className="text-[9px] text-brand-400 font-black block uppercase font-mono">Adapted Sentence:</span>
                  <p className="text-base font-extrabold text-white bg-zinc-950 p-3 rounded-lg border border-white/5 leading-relaxed">{builtTransform.evaluated_sentence}</p>
                  <p className="text-[10px] text-zinc-450 font-sans">Register adapted for: <strong>{selectedContext.toUpperCase()}</strong></p>
                </div>
              ) : (
                <button
                  onClick={handleTransformRegister}
                  disabled={buildingTransform || !selectedTransformOption}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl text-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  {buildingTransform ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Transform Register</span>
                </button>
              )}

              {builtTransform && (
                <button
                  onClick={handleNextTransform}
                  className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-450 font-bold py-3 rounded-xl transition text-xs flex justify-center items-center gap-1 cursor-pointer"
                >
                  <span>{activeTransIdx < transformTemplates.length - 1 ? "Next Sentence" : "Proceed to Softening Builders"}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-950" />
                </button>
              )}

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-bold">Move to Softening <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Activity 3 - Softening directness requests */}
      {step === 5 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 3 – Softening Directness</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 5 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6 text-left max-w-2xl mx-auto w-full animate-fade-in font-sans">
            <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl">
              <span className="text-[9px] text-red-400 block font-bold uppercase mb-1 font-mono">Direct/Strong Complaint statement:</span>
              <p className="font-korean text-base font-bold text-white">{selectedBaseIdea}</p>
            </div>

            <div className="space-y-1.5 font-sans">
              <span className="text-[10px] font-bold text-white">Choose a softening phrase mitigator:</span>
              <div className="flex flex-col gap-2">
                {[
                  { ko: "혹시 괜찮으시면", en: "If it's okay with you..." },
                  { ko: "실례지만 혹시", en: "Excuse me, but..." },
                  { ko: "죄송하지만 좀", en: "I'm sorry, but would you mind..." }
                ].map((sf) => (
                  <button
                    key={sf.ko}
                    onClick={() => {
                      setSelectedSoftener(sf.ko);
                      setBuiltSoften(null);
                    }}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold font-korean transition cursor-pointer ${
                      selectedSoftener === sf.ko
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-900 text-zinc-300 hover:border-white/10"
                    }`}
                  >
                    {sf.ko} ({sf.en})
                  </button>
                ))}
              </div>
            </div>

            {builtSoften ? (
              <div className="p-4 bg-zinc-900 rounded-xl border border-brand-500/20 text-xs space-y-2 animate-fade-in font-korean">
                <span className="text-[9px] text-brand-400 font-black block uppercase font-mono">Softened variant statement:</span>
                <p className="text-base font-extrabold text-white bg-zinc-950 p-3 rounded-lg border border-white/5 leading-relaxed">{builtSoften.reply_ko}</p>
                <p className="text-[10px] text-zinc-500 font-sans">Intent softened. Softer and more polite tone.</p>
              </div>
            ) : (
              <button
                onClick={handleSoftenRegister}
                disabled={buildingSoften || !selectedSoftener}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl text-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                {buildingSoften ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Assemble Softened Request</span>
              </button>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(4)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(6)} className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-bold">Move to Peer/Teacher Chat <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 6: Activity 4 - Friend vs Teacher Homework Chat */}
      {step === 6 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-brand-400" />
              <span>Activity 4 – Contrastive homework scene: friend vs teacher</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 6 of {totalSteps}</span>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto w-full text-left">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-brand-400">Context shift: homework question</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStartRoleplay("friend")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${roleplayScenario === "friend" && roleplaySessionId ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
                >
                  Friend (Banmal)
                </button>
                <button
                  onClick={() => handleStartRoleplay("teacher")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${roleplayScenario === "teacher" && roleplaySessionId ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
                >
                  Teacher (Nopimmal)
                </button>
              </div>
            </div>

            {!roleplaySessionId ? (
              <div className="p-8 bg-zinc-950 border border-white/10 rounded-[2rem] text-center space-y-5 w-full">
                <div className="p-4 bg-brand-500/10 border border-brand-500/25 rounded-full w-fit mx-auto text-brand-400">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed max-w-md mx-auto">
                  Compare how you interact differently with a friend versus a teacher about the same homework question scene.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => handleStartRoleplay("friend")}
                    className="bg-brand-600 hover:bg-brand-500 text-white font-black py-3 px-6 rounded-xl text-xs transition cursor-pointer"
                  >
                    Start Friend Chat
                  </button>
                  <button
                    onClick={() => handleStartRoleplay("teacher")}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-white/5 text-zinc-300 font-black py-3 px-6 rounded-xl text-xs transition cursor-pointer"
                  >
                    Start Teacher Chat
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 w-full animate-fade-in">
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
                        <span className="text-[10px] text-zinc-550">Interlocutor typing...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scaffolding chips */}
                <div className="space-y-2">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block font-mono">Suggested phrases:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {roleplayScenario === "friend" 
                      ? ["이거 어떻게 풀어?", "고마워, 역시 최고야!", "내일 빌려줘."] 
                      : ["이 문제 좀 여쭤봐도 되겠습니까?", "혹시 시간 괜찮으실 때 봐 주실 수 있습니까?", "감사합니다, 선생님."]
                    .map((chip) => (
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
                      placeholder={roleplayScenario === "friend" ? "Chat casually (반말)..." : "Chat respectfully (존댓말)..."}
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
                      Finish Both
                    </button>
                  </div>
                ) : (
                  <div className="p-5 bg-zinc-900 rounded-xl border border-brand-500/20 space-y-3 animate-fade-in">
                    <p className="font-extrabold text-white">Pragmatic Assessment Report:</p>
                    <p className="text-xs text-zinc-350 leading-relaxed bg-zinc-950 p-3.5 rounded-lg border border-white/5 italic">
                      {roleplayFeedback}
                    </p>
                    <button
                      onClick={() => setStep(7)}
                      className="w-full mt-2 bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Proceed to Quiz
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

      {/* Screen 7: Activity 5 - Register Strategy Quiz */}
      {step === 7 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Mini-Quiz: Pragmatics &amp; Register Check</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 7 of {totalSteps}</span>
          </div>

          {quizBlueprint.length > 0 && quizBlueprint[quizIdx] && (
            <div className="space-y-6 max-w-xl mx-auto w-full text-left animate-fade-in">
              <div className="flex justify-between text-[10px] text-zinc-450 font-mono">
                <span>Quiz Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span>Type: B1 Register Strategy</span>
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

      {/* Screen 8: Activity 6 - Politeness Free Practice Chat */}
      {step === 8 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-brand-400" />
              <span>Activity 6 – Free Practice Register Switching</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 8 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 text-left max-w-2xl mx-auto w-full font-sans">
            <div className="space-y-1">
              <span className="text-[9px] text-brand-400 font-mono uppercase tracking-widest block font-bold">Extra AI Register Lab</span>
              <p className="text-xs text-zinc-400 leading-normal font-sans">
                Practice adjusting your register on the fly. Switch between friends, colleagues, and seniors.
              </p>
            </div>

            {!practiceSessionId ? (
              <div className="flex gap-2 font-sans">
                <button
                  onClick={() => handleStartPractice("friend")}
                  className="flex-grow bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-4 rounded-xl transition text-xs cursor-pointer text-center"
                >
                  Start Casual Practice
                </button>
                <button
                  onClick={() => handleStartPractice("teacher")}
                  className="flex-grow bg-zinc-805 hover:bg-zinc-800 border border-white/5 text-white font-bold py-2.5 px-4 rounded-xl transition text-xs cursor-pointer text-center"
                >
                  Start Honorific Practice
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
                          isUser ? "bg-brand-500 text-white" : "bg-zinc-950 text-zinc-300 border border-white/5"
                        }`}>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {practiceSending && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 italic">
                      <Loader2 className="w-3 h-3 animate-spin text-brand-400" />
                      <span>Partner is typing...</span>
                    </div>
                  )}
                </div>

                {!practiceFinished ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={practiceText}
                      onChange={(e) => setPracticeText(e.target.value)}
                      placeholder="Input casual or honorific variant matching context..."
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
                    <p>{practiceFeedback || "Politeness practice successfully complete!"}</p>
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
            <h2 className="text-3xl font-black text-white font-sans">Korean 4.4 Register Graduated! 🎓🤵</h2>
            <p className="text-zinc-400 text-sm mt-1.5 font-sans">Congratulations on completing Korean 4.4! Next: Phase 5 – Understanding Longer Speech & Note‑Taking.</p>
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
                        {item.id === "hw_b1_reg_1" ? "Task 1: Register Writing" : item.id === "hw_b1_reg_2" ? "Task 2: Disagreement Softening" : "Task 3: Written Reflection"}
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
              <span>Badge Earned: {quizBadge || "Polite Speaker B1"}</span>
            </div>
            <div className="flex justify-center gap-4 text-xs font-bold pt-1">
              <span className="text-brand-400 font-sans">XP +150 Completion Bonus</span>
              <span className="text-zinc-655">|</span>
              <span className="text-yellow-400 font-sans">Phase 4 Complete</span>
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
            <span>Complete Phase 4 &amp; Continue</span>
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
