"use client";

import { useEffect, useState, useRef } from "react";
import xpAudit from "../lib/xp-audit.json";
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  BookOpen, 
  Award, 
  Loader2, 
  CheckCircle2, 
  Check, 
  RotateCcw,
  Volume2,
  Mic,
  Activity,
  Play,
  ArrowRight,
  User,
  MessageSquare
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
  const cleanPath = path.startsWith("/pls-lab") ? path : `/pls-lab${path}`;
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

interface Course8Phase8ConversationWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course8Phase8ConversationWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course8Phase8ConversationWizardProps) {
  const phaseNum = 8;
  const getStepMaxXP = (sNum: number) => {
    try {
      return (xpAudit as any)["8"]?.[phaseNum.toString()]?.steps?.[sNum.toString()]?.max_xp ?? 35;
    } catch (e) {
      return 35;
    }
  };
  const getStepXP = (sNum: number) => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(`hangeulai_c8p${phaseNum}_s${sNum}_earned_xp`) || "0", 10);
  };

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c8p8_step");
    const savedMax = localStorage.getItem("hangeulai_c8p8_max_step");
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
      localStorage.setItem("hangeulai_c8p8_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);

  // Loaded data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1A: Find the backchannels
  const [detItems, setDetItems] = useState<any[]>([]);
  const [detIdx, setDetIdx] = useState(0);
  const [detSelectedTokens, setDetSelectedTokens] = useState<string[]>([]);
  const [detChecked, setDetChecked] = useState(false);
  const [detExplanation, setDetExplanation] = useState("");

  // Activity 1B: Agree, Disagree, React
  const [clsItems, setClsItems] = useState<any[]>([]);
  const [clsIdx, setClsIdx] = useState(0);
  const [clsMappings, setClsMappings] = useState<Record<string, string>>({}); // response -> type selected
  const [clsChecked, setClsChecked] = useState(false);
  const [clsExplanation, setClsExplanation] = useState("");

  // Activity 1C: Turn Taking Listen
  const [ttItems, setTtItems] = useState<any[]>([]);
  const [ttIdx, setTtIdx] = useState(0);
  const [ttAnswers, setTtAnswers] = useState<Record<string, string>>({}); // questionId -> answer
  const [ttChecked, setTtChecked] = useState(false);
  const [ttExplanation, setTtExplanation] = useState("");

  // Activity 2A: Backchannel Shadowing
  const [shItems, setShItems] = useState<any[]>([]);
  const [shIdx, setShIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [shEvaluated, setShEvaluated] = useState(false);
  const [shScore, setShScore] = useState<number | null>(null);
  const [shFeedback, setShFeedback] = useState("");

  // Activity 2B: Agree/Disagree + Reason
  const [adItems, setAdItems] = useState<any[]>([]);
  const [adIdx, setAdIdx] = useState(0);
  const [adEvaluated, setAdEvaluated] = useState(false);
  const [adScore, setAdScore] = useState<number | null>(null);
  const [adFeedback, setAdFeedback] = useState("");

  // Activity 2C: Mini Dialog Turn-Taking
  const [dialogSession, setDialogSession] = useState<any>(null);
  const [dialogTurns, setDialogTurns] = useState<any[]>([]); // list of partner/user lines
  const [dialogFinished, setDialogFinished] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogSummary, setDialogSummary] = useState<any>(null);

  // Quiz State
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizExplanation, setQuizExplanation] = useState("");
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Homework State
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [hwSents, setHwSents] = useState<string[]>(["", "", ""]);
  const [hwFeedback, setHwFeedback] = useState<any>(null);
  const [submittingHw, setSubmittingHw] = useState(false);
  const [completingLab, setCompletingLab] = useState(false);

  // --- Start Progress State Preservation ---
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hangeulai_c8p8_progress_state");
        if (saved) {
          const state = JSON.parse(saved);
            if (state.step !== undefined) setStep(state.step);
            if (state.maxStep !== undefined) setMaxStep(state.maxStep);
            if (state.detIdx !== undefined) setDetIdx(state.detIdx);
            if (state.detSelectedTokens !== undefined) setDetSelectedTokens(state.detSelectedTokens);
            if (state.detChecked !== undefined) setDetChecked(state.detChecked);
            if (state.clsIdx !== undefined) setClsIdx(state.clsIdx);
            if (state.clsChecked !== undefined) setClsChecked(state.clsChecked);
            if (state.ttIdx !== undefined) setTtIdx(state.ttIdx);
            if (state.ttAnswers !== undefined) setTtAnswers(state.ttAnswers);
            if (state.ttChecked !== undefined) setTtChecked(state.ttChecked);
            if (state.shIdx !== undefined) setShIdx(state.shIdx);
            if (state.shScore !== undefined) setShScore(state.shScore);
            if (state.adIdx !== undefined) setAdIdx(state.adIdx);
            if (state.adScore !== undefined) setAdScore(state.adScore);
            if (state.dialogFinished !== undefined) setDialogFinished(state.dialogFinished);
            if (state.quizIdx !== undefined) setQuizIdx(state.quizIdx);
            if (state.quizSelected !== undefined) setQuizSelected(state.quizSelected);
            if (state.quizChecked !== undefined) setQuizChecked(state.quizChecked);
            if (state.quizCorrect !== undefined) setQuizCorrect(state.quizCorrect);
            if (state.quizMistakes !== undefined) setQuizMistakes(state.quizMistakes);
            if (state.quizScore !== undefined) setQuizScore(state.quizScore);
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
            detIdx,
            detSelectedTokens,
            detChecked,
            clsIdx,
            clsChecked,
            ttIdx,
            ttAnswers,
            ttChecked,
            shIdx,
            shScore,
            adIdx,
            adScore,
            dialogFinished,
            quizIdx,
            quizSelected,
            quizChecked,
            quizCorrect,
            quizMistakes,
            quizScore
        };
        localStorage.setItem("hangeulai_c8p8_progress_state", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save progress state:", e);
      }
    }
  }, [step, maxStep, detIdx, detSelectedTokens, detChecked, clsIdx, clsChecked, ttIdx, ttAnswers, ttChecked, shIdx, shScore, adIdx, adScore, dialogFinished, quizIdx, quizSelected, quizChecked, quizCorrect, quizMistakes, quizScore]);
  // --- End Progress State Preservation ---


  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/8/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/8/core-data");
          setCoreData(res);
        } else if (step === 3) {
          if (detItems.length === 0) {
            const resDet = await apiJson("/phase-8/items/backchannel-detect");
            setDetItems(resDet);
          }
          if (clsItems.length === 0) {
            const resCls = await apiJson("/phase-8/items/routine-classify");
            setClsItems(resCls);
          }
          if (ttItems.length === 0) {
            const resTt = await apiJson("/phase-8/items/turn-taking-listen");
            setTtItems(resTt);
          }
        } else if (step === 4) {
          if (shItems.length === 0) {
            const resSh = await apiJson("/phase-8/items/backchannel-shadow");
            setShItems(resSh);
          }
          if (adItems.length === 0) {
            const resAd = await apiJson("/phase-8/items/agree-disagree");
            setAdItems(resAd);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/phase-8/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-8/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading PLS Lab Phase 8:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1A Check
  const handleToggleToken = (tok: string) => {
    if (detChecked) return;
    setDetSelectedTokens(prev =>
      prev.includes(tok) ? prev.filter(t => t !== tok) : [...prev, tok]
    );
  };

  const handleCheckDet = async () => {
    const current = detItems[detIdx];
    if (!current) return;
    try {
      const res = await apiJson("/phase-8/items/backchannel-detect/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: detSelectedTokens.join(",") })
      });
      setDetChecked(true);
      setDetExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextDet = () => {
    setDetSelectedTokens([]);
    setDetChecked(false);
    setDetExplanation("");
    if (detIdx < detItems.length - 1) {
      setDetIdx(prev => prev + 1);
    }
  };

  // Activity 1B Check
  const handleSelectMapping = (response: string, type: string) => {
    if (clsChecked) return;
    setClsMappings(prev => ({
      ...prev,
      [response]: type
    }));
  };

  const handleCheckCls = async () => {
    const current = clsItems[clsIdx];
    if (!current) return;
    try {
      const res = await apiJson("/phase-8/items/routine-classify/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: JSON.stringify(clsMappings) })
      });
      setClsChecked(true);
      setClsExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextCls = () => {
    setClsMappings({});
    setClsChecked(false);
    setClsExplanation("");
    if (clsIdx < clsItems.length - 1) {
      setClsIdx(prev => prev + 1);
    }
  };

  // Activity 1C Check
  const handleSelectTtAnswer = (qId: string, opt: string) => {
    if (ttChecked) return;
    setTtAnswers(prev => ({
      ...prev,
      [qId]: opt
    }));
  };

  const handleCheckTt = async () => {
    const current = ttItems[ttIdx];
    if (!current) return;
    try {
      const res = await apiJson("/phase-8/items/turn-taking-listen/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: JSON.stringify(ttAnswers) })
      });
      setTtChecked(true);
      setTtExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextTt = () => {
    setTtAnswers({});
    setTtChecked(false);
    setTtExplanation("");
    if (ttIdx < ttItems.length - 1) {
      setTtIdx(prev => prev + 1);
    }
  };

  // Activity 2A Shadowing Speak
  const handleRecordSh = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = shItems[shIdx];
      try {
        const res = await apiJson("/phase-8/items/backchannel-shadow/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: current.id, audio_base64: "mock_data" })
        });
        setShScore(res.score);
        setShFeedback(res.feedback);
        setShEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleNextSh = () => {
    setShScore(null);
    setShFeedback("");
    setShEvaluated(false);
    if (shIdx < shItems.length - 1) {
      setShIdx(prev => prev + 1);
    }
  };

  // Activity 2B Agree/Disagree Speak
  const handleRecordAd = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = adItems[adIdx];
      try {
        const res = await apiJson("/phase-8/items/agree-disagree/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: current.id, audio_base64: "mock_data" })
        });
        setAdScore(res.score);
        setAdFeedback(res.feedback);
        setAdEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleNextAd = () => {
    setAdScore(null);
    setAdFeedback("");
    setAdEvaluated(false);
    if (adIdx < adItems.length - 1) {
      setAdIdx(prev => prev + 1);
    }
  };

  // Activity 2C Dialog simulator
  const handleStartDialog = async () => {
    setDialogLoading(true);
    try {
      const res = await apiJson("/phase-8/dialog/start", { method: "POST" });
      setDialogSession(res);
      setDialogTurns([{ speaker: "partner", text: res.partner_next_line, prompt: res.prompt }]);
      setDialogFinished(false);
      setDialogSummary(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleRecordDialogTurn = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      try {
        const res = await apiJson("/phase-8/dialog/turn", {
          method: "POST",
          body: JSON.stringify({ item_id: dialogSession?.session_id, audio_base64: "mock_data" })
        });
        setDialogTurns(prev => [
          ...prev,
          { speaker: "user", text: "(Your Recorded Reaction & Follow-up)" },
          { speaker: "partner", text: res.partner_next_line, prompt: res.prompt }
        ]);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleFinishDialog = async () => {
    setDialogLoading(true);
    try {
      const res = await apiJson("/phase-8/dialog/finish", { method: "POST" });
      setDialogSummary(res);
      setDialogFinished(true);
    } catch (err) {
      console.error(err);
    } finally {
      setDialogLoading(false);
    }
  };

  // Quiz flow
  const handleCheckQuizAnswer = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelected) return;
    try {
      const res = await apiJson("/phase-8/quiz/answer", {
        method: "POST",
        body: JSON.stringify({ question_id: current.id, selected_option: quizSelected })
      });
      setQuizCorrect(res.correct);
      setQuizChecked(true);
      setQuizExplanation(res.explanation);
      if (!res.correct) {
        setQuizMistakes(prev => [...prev, current.id]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextQuiz = async () => {
    setQuizSelected(null);
    setQuizChecked(false);
    setQuizCorrect(null);
    setQuizExplanation("");
    if (quizIdx < quizBlueprint.length - 1) {
      setQuizIdx(prev => prev + 1);
    } else {
      setFinishingQuiz(true);
      try {
        const correctCount = quizBlueprint.length - quizMistakes.length;
        const finalScore = Math.round((correctCount / quizBlueprint.length) * 100);
        await apiJson("/phase-8/quiz/finish", {
          method: "POST",
          body: JSON.stringify({ score: finalScore, mistakes: quizMistakes })
        });
        setQuizScore(finalScore);
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  const handleRestartQuiz = () => {
    setQuizIdx(0);
    setQuizSelected(null);
    setQuizChecked(false);
    setQuizCorrect(null);
    setQuizExplanation("");
    setQuizMistakes([]);
    setQuizScore(null);
  };

  // Homework check
  const handleHwChange = (index: number, val: string) => {
    const updated = [...hwSents];
    updated[index] = val;
    setHwSents(updated);
  };

  const handleSubmitHomework = async () => {
    setSubmittingHw(true);
    try {
      const res = await apiJson("/phase-8/homework/submit", {
        method: "POST",
        body: JSON.stringify({ sentences: hwSents })
      });
      setHwFeedback(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingHw(false);
    }
  };

  const handleCompleteLab = async () => {
    setCompletingLab(true);
    try {
      await apiJson("/phase-8/complete", { method: "POST" });
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingLab(false);
    }
  };

    const outlineSteps = [
    { num: 1, label: "= 1 ? \"bg-cyan-500\" : \"bg-slate-700\"}`} /> Screen 1: Welcome & Phase Overview" },
    { num: 2, label: "= 2 ? \"bg-teal-500\" : \"bg-slate-700\"}`} /> Screen 2: Backchannels & Routines Basics" },
    { num: 3, label: "= 3 ? \"bg-indigo-500\" : \"bg-slate-700\"}`} /> Screen 3: Activity 1: Listening & Classifying" },
    { num: 4, label: "= 4 ? \"bg-purple-500\" : \"bg-slate-700\"}`} /> Screen 4: Activity 2: Speaking Interaction & Shadows" },
    { num: 5, label: "= 5 ? \"bg-pink-500\" : \"bg-slate-700\"}`} /> Screen 5: Mini-Quiz: Conversational Flow" },
    { num: 6, label: "= 6 ? \"bg-emerald-500\" : \"bg-slate-700\"}`} /> Screen 6: Homework & Fluency Coach" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 8,
          phaseNum: 8,
          step: step
        }
      }));
    }
  }, [step]);

return (
    <div className="flex-grow flex flex-col justify-between">
      {/* Header bar */}
      <header className="border-b border-white/5 bg-zinc-900/60 backdrop-blur px-8 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="font-black text-xl text-white tracking-tight">Conversation Lab</h2>
            <p className="text-xs text-zinc-400">Routines & Turn‑Taking (B1)</p>
          </div>
        </div>

        {/* Dynamic progress bar */}
        <div className="flex-1 max-w-md mx-8 hidden sm:block">
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>Progress</span>
            <span>{Math.round((step / 6) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-500 h-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
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
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">Required: 740 XP</span>
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
                      if (courseXP < 560) {
                        window.dispatchEvent(new CustomEvent("hangeulai-warning", {
                          detail: { message: "To start Phase 8, you need at least 560 XP in this course. You currently have " + courseXP + " XP." }
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

      {/* Outline panel */}
      

      {/* SCREEN 1: WELCOME */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in relative overflow-hidden">
          <div className="relative mx-auto w-fit">
            <div className="p-4 bg-cyan-500/10 rounded-full border border-cyan-500/25 text-cyan-400">
              <MessageSquare className="w-10 h-10" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-brand-500 rounded-full border-2 border-zinc-950">
              <Sparkles className="w-3 h-3 text-white fill-white" />
            </div>
          </div>

          <div>
            <h2 className="text-5xl font-black text-white tracking-tight font-sans">{metadata?.title || "Conversation Lab – Routines & Turn‑Taking (B1)"}</h2>
            <h3 className="text-2xl font-extrabold text-cyan-400 mt-2">{metadata?.subtitle || "React naturally and share the floor."}</h3>
          </div>

          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "In this lab, you’ll practise Korean conversation routines: backchannel reactions, agreeing and disagreeing, asking follow‑up questions, and taking turns smoothly at B1 level."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Focus Milestones:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Use short reactions (“네”, “그래요?”, “진짜요?”) while listening",
                "Agree and disagree politely with simple gambits",
                "Ask follow‑up questions and share turns in short B1 dialogues"
              ]).map((g: string, i: number) => <li key={i}>{g}</li>)}
            </ul>
            <p className="pt-2 text-zinc-400"><strong>⏱️ Est. Lab Time:</strong> 25 minutes</p>
            <p className="text-zinc-400"><strong>🔗 Prerequisites:</strong> {metadata?.dependencies || "Intonation Lab (Completed)"}</p>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl mx-auto">
            {["B1", "Speaking interaction", "Conversation", "Turn‑taking"].map(chip => (
              <span key={chip} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] text-cyan-300 font-bold">{chip}</span>
            ))}
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => {
    if (courseXP < 560) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 8, you need at least 560 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} 
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-450 hover:to-cyan-450 text-zinc-950 font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-4 h-4" /> Start Conversation Lab
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: CONCEPT EXPLANATION */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            Conversation Routines & Backchannels
          </h2>

          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
            {/* Backchannels card */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1">
              <h3 className="font-bold text-white mb-1">1. Backchannels = "I'm listening" Signals</h3>
              <p className="text-zinc-400">Listeners show engagement using short, reactive sounds or tokens. They prevent you from sounding like a robot and co-build conversational flow.</p>
              <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-center font-mono">
                <div className="p-1.5 bg-zinc-900 border border-white/5 rounded text-zinc-350">Neutral: 네, 예, 응</div>
                <div className="p-1.5 bg-zinc-900 border border-white/5 rounded text-cyan-300">Agree: 맞아요, 그렇군요</div>
                <div className="p-1.5 bg-zinc-900 border border-white/5 rounded text-teal-300">Surprise: 진짜요?, 대박!</div>
              </div>
            </div>

            {/* Routines B1 card */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1">
              <h3 className="font-bold text-white mb-1">2. Agreeing & Disagreeing politely</h3>
              <p className="text-zinc-400">Avoid saying flat rejections like "아니요" (No). Instead, use B1 routines:</p>
              <ul className="list-disc list-inside text-zinc-400 pl-1 space-y-0.5">
                <li><strong>Agreement:</strong> 저도 그래요 (Me too), 맞아요 (Exactly).</li>
                <li><strong>Soft Disagreement:</strong> 글쎄요... (Well...), 그건 잘 모르겠어요 (I don't know about that...).</li>
              </ul>
            </div>

            {/* Turn Taking diagram simulator */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
              <h3 className="font-bold text-white mb-1">3. Turn-Taking Basics</h3>
              <p className="text-zinc-400">Hand the turn back and forth smoothly. Yield the floor with questions or conversational sentence hooks (e.g. <strong>~는데요</strong> or <strong>A 씨는요?</strong>).</p>
              
              <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-between text-xs text-center font-bold">
                <div className="text-cyan-400">Speaker A<br/><span className="text-[9px] text-zinc-500 font-normal">Expresses opinion</span></div>
                <div className="text-zinc-500 flex flex-col items-center">
                  <span>→ (Reacts) →</span>
                  <span>← (Asks "...는요?") ←</span>
                </div>
                <div className="text-teal-400">Speaker B<br/><span className="text-[9px] text-zinc-500 font-normal">Backchannels & yields</span></div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button 
              onClick={() => setStep(3)}
              className="flex items-center gap-1 py-2.5 px-6 bg-cyan-500 hover:bg-cyan-455 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Practice
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: ACTIVITY 1: LISTENING & DISCRIMINATION */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 1: Listening & Interaction Analysis
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Identify backchannels, classifications, and turn handovers</h2>
          </div>

          {/* Part A: Find backchannels */}
          {detItems.length > 0 && !detChecked && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Find the Backchannels</span>
                <span>Dialogue {detIdx + 1} of {detItems.length}</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => playAudio(detItems[detIdx].sentence)}
                    className="p-2 bg-zinc-900 border border-white/5 hover:bg-slate-800 rounded-full text-cyan-400 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-zinc-400">Listen and tap all backchannel tokens in the transcript:</span>
                </div>

                <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 flex flex-wrap gap-2 justify-center leading-relaxed">
                  {detItems[detIdx].sentence.split(" ").map((word: string, wIdx: number) => {
                    const cleanWord = word.replace(/[^\uAC00-\uD7A3a-zA-Z\s?,]/g, "");
                    const isSelected = detSelectedTokens.includes(cleanWord);
                    return (
                      <button
                        key={wIdx}
                        onClick={() => handleToggleToken(cleanWord)}
                        className={`px-2 py-1 rounded text-xs font-semibold border transition ${
                          isSelected 
                            ? "bg-cyan-500/20 border-cyan-400 text-white" 
                            : "bg-zinc-950 border-white/5 text-zinc-300 hover:border-cyan-500/30"
                        }`}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCheckDet}
                  className="py-2 px-5 bg-cyan-500 hover:bg-cyan-455 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer"
                  disabled={detSelectedTokens.length === 0}
                >
                  Verify Backchannels
                </button>
              </div>
            </div>
          )}

          {detChecked && detIdx <= detItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Find the Backchannels</span>
                <span>Dialogue {detIdx + 1} of {detItems.length}</span>
              </div>
              <div className="bg-green-950/20 border border-green-900 p-4 rounded-xl text-xs text-green-300 leading-relaxed">
                <strong>Correct!</strong> {detExplanation}
              </div>
              <div className="flex justify-end">
                {detIdx < detItems.length - 1 ? (
                  <button
                    onClick={handleNextDet}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Dialogue
                  </button>
                ) : (
                  <button
                    onClick={() => setDetIdx(detItems.length)} // Move past Part A
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-405 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                  >
                    Proceed to Part B
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Part B: Agree, Disagree, React */}
          {detIdx === detItems.length && clsItems.length > 0 && !clsChecked && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Agree, Disagree, React Classification</span>
                <span>Opinion {clsIdx + 1} of {clsItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-2">
                <span className="text-[10px] text-zinc-550 block font-bold uppercase">Prompt opinion:</span>
                <span className="text-base font-extrabold text-white block">"{clsItems[clsIdx].prompt}"</span>
                <button 
                  onClick={() => playAudio(clsItems[clsIdx].prompt)}
                  className="p-1 bg-zinc-950 hover:bg-slate-800 rounded-full text-cyan-400 cursor-pointer inline-flex"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                <span className="text-xs text-zinc-400 block font-bold">Classify responses into their categories:</span>
                
                {clsItems[clsIdx].mappings.map((m: any) => (
                  <div key={m.response} className="p-3 bg-zinc-900 rounded-lg border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{m.response}</span>
                    
                    <div className="flex gap-1">
                      {clsItems[clsIdx].options.map((opt: string) => {
                        const isSelected = clsMappings[m.response] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleSelectMapping(m.response, opt)}
                            className={`py-1 px-2.5 rounded text-[9px] font-semibold border transition ${
                              isSelected 
                                ? "bg-cyan-500 border-cyan-400 text-zinc-950 font-bold" 
                                : "bg-zinc-950 border-white/5 text-zinc-400 hover:bg-slate-800"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCheckCls}
                  className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-455 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer"
                  disabled={Object.keys(clsMappings).length < clsItems[clsIdx].mappings.length}
                >
                  Verify Classifications
                </button>
              </div>
            </div>
          )}

          {clsChecked && clsIdx <= clsItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Agree, Disagree, React Classification</span>
                <span>Opinion {clsIdx + 1} of {clsItems.length}</span>
              </div>
              <div className="bg-green-950/20 border border-green-900 p-4 rounded-xl text-xs text-green-300 leading-relaxed">
                <strong>Correct!</strong> {clsExplanation}
              </div>
              <div className="flex justify-end">
                {clsIdx < clsItems.length - 1 ? (
                  <button
                    onClick={handleNextCls}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Opinion
                  </button>
                ) : (
                  <button
                    onClick={() => setClsIdx(clsItems.length)} // Move past Part B
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-405 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                  >
                    Proceed to Part C
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Part C: Who takes the turn */}
          {detIdx === detItems.length && clsIdx === clsItems.length && ttItems.length > 0 && !ttChecked && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Turn-Taking Listen Questions</span>
                <span>Drill {ttIdx + 1} of {ttItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-2">
                <span className="text-[10px] text-zinc-550 uppercase font-bold block">Listen to dialogue flow:</span>
                <p className="text-xs font-bold text-white text-center leading-relaxed">{ttItems[ttIdx].dialogue}</p>
                <div className="flex justify-center pt-1">
                  <button 
                    onClick={() => playAudio(ttItems[ttIdx].dialogue.replace(/ \/ /g, " "))}
                    className="p-1.5 bg-zinc-950 hover:bg-slate-800 rounded-full text-cyan-400 cursor-pointer inline-flex"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {ttItems[ttIdx].questions.map((q: any) => (
                  <div key={q.id} className="space-y-1.5">
                    <span className="text-xs text-zinc-350 block font-bold">{q.question}</span>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt: string) => {
                        const isSelected = ttAnswers[q.id] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleSelectTtAnswer(q.id, opt)}
                            className={`py-2 rounded-lg text-[10px] font-semibold border transition text-center ${
                              isSelected 
                                ? "border-cyan-500 bg-cyan-500/10 text-white" 
                                : "border-white/5 bg-zinc-900 text-zinc-400 hover:bg-slate-800"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCheckTt}
                  className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-455 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer"
                  disabled={Object.keys(ttAnswers).length < ttItems[ttIdx].questions.length}
                >
                  Verify Answers
                </button>
              </div>
            </div>
          )}

          {ttChecked && ttIdx <= ttItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Turn-Taking Listen Questions</span>
                <span>Drill {ttIdx + 1} of {ttItems.length}</span>
              </div>
              <div className="bg-green-950/20 border border-green-900 p-4 rounded-xl text-xs text-green-300 leading-relaxed">
                <strong>Correct!</strong> {ttExplanation}
              </div>
              <div className="flex justify-end">
                {ttIdx < ttItems.length - 1 ? (
                  <button
                    onClick={handleNextTt}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Drill
                  </button>
                ) : (
                  <button
                    onClick={() => setStep(4)} // Move to Step 4 speaking wizard
                    className="py-2.5 px-6 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-450 hover:to-cyan-450 text-zinc-950 font-bold rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    Proceed to Speaking Interaction
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => {
                setDetIdx(0);
                setClsIdx(0);
                setTtIdx(0);
                setStep(2);
              }}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 4: ACTIVITY 2: SPEAKING INTERACTION */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 2: Speaking Interaction Lab
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Record backchannels, opinion routines, and mini dialogues</h2>
          </div>

          {/* Part A: Backchannel shadowing */}
          {shItems.length > 0 && !shEvaluated && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Backchannel Shadowing</span>
                <span>Snippet {shIdx + 1} of {shItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="text-[10px] text-zinc-550 block font-bold uppercase text-center">Shadow dialogue text:</span>
                
                <div className="space-y-2 text-xs">
                  {shItems[shIdx].dialogue.map((line: any, lIdx: number) => (
                    <div key={lIdx} className="flex gap-2 items-start">
                      <span className="font-bold text-cyan-300 w-16">{line.speaker}:</span>
                      <span className={line.speaker.includes("User") ? "text-yellow-400 italic" : "text-white"}>{line.text}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-950 p-2.5 rounded text-[10px] text-zinc-400 leading-normal">
                  <strong>Suggested listener tokens:</strong> {shItems[shIdx].suggested_reactions.join(", ")}
                </div>
              </div>

              {/* Record UI */}
              <div className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                <button
                  onClick={handleRecordSh}
                  disabled={recording}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                    recording ? "bg-red-500 animate-pulse" : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <span className="text-[10px] text-zinc-400">
                  {recording ? "Recording shadows..." : "Tap mic, listen to Partner, and say backchannels in reaction slots"}
                </span>
              </div>
            </div>
          )}

          {shEvaluated && shIdx <= shItems.length - 1 && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Backchannel Shadowing</span>
                <span>Snippet {shIdx + 1} of {shItems.length}</span>
              </div>

              <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400 font-bold">Timing Accuracy Score:</span>
                  <span className="text-lg font-black text-green-400">{shScore}%</span>
                </div>
                <p className="text-xs text-zinc-350 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-white/5">
                  <strong>Evaluator feedback:</strong> {shFeedback}
                </p>
              </div>

              <div className="flex justify-end">
                {shIdx < shItems.length - 1 ? (
                  <button
                    onClick={handleNextSh}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Dialogue
                  </button>
                ) : (
                  <button
                    onClick={() => setShIdx(shItems.length)} // Move past Part A
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-405 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                  >
                    Proceed to Part B
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Part B: Agree / Disagree + Reason */}
          {shIdx === shItems.length && adItems.length > 0 && !adEvaluated && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Agree / Disagree + Reason</span>
                <span>Drill {adIdx + 1} of {adItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-2">
                <span className="text-[10px] text-zinc-550 block font-bold uppercase">React and give a short reason:</span>
                <span className="text-lg font-extrabold text-white block">"{adItems[adIdx].prompt}"</span>
                <span className="text-xs text-zinc-400 block font-semibold">({adItems[adIdx].translation})</span>

                <button 
                  onClick={() => playAudio(adItems[adIdx].prompt)}
                  className="py-2 px-4 bg-cyan-500/10 hover:bg-cyan-500/20 text-xs text-cyan-300 rounded border border-cyan-500/20 inline-flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Listen Prompt
                </button>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 text-[10px] text-zinc-400 space-y-1">
                <strong>Speech instructions:</strong>
                <p>1. Start with an agreeing/disagreeing routine (e.g., '맞아요', '글쎄요...').</p>
                <p>2. Add one brief supporting clause or sentence.</p>
              </div>

              {/* Record UI */}
              <div className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                <button
                  onClick={handleRecordAd}
                  disabled={recording}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                    recording ? "bg-red-500 animate-pulse" : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <span className="text-[10px] text-zinc-400">
                  {recording ? "Recording response..." : "Tap mic to record stance + reason"}
                </span>
              </div>
            </div>
          )}

          {adEvaluated && adIdx <= adItems.length - 1 && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Agree / Disagree + Reason</span>
                <span>Drill {adIdx + 1} of {adItems.length}</span>
              </div>

              <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400 font-bold">Routines / Grammar Score:</span>
                  <span className="text-lg font-black text-green-400">{adScore}%</span>
                </div>
                <p className="text-xs text-zinc-350 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-white/5">
                  <strong>Evaluator feedback:</strong> {adFeedback}
                </p>
              </div>

              <div className="flex justify-end">
                {adIdx < adItems.length - 1 ? (
                  <button
                    onClick={handleNextAd}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Prompt
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAdIdx(adItems.length); // Move past Part B
                      handleStartDialog(); // pre-initialize part C dialog
                    }}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-405 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                  >
                    Proceed to Part C
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Part C: Mini Dialogue Turn-taking */}
          {shIdx === shItems.length && adIdx === adItems.length && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Mini Dialog with Turn-Taking</span>
                <span>Multi-turn Simulator</span>
              </div>

              {dialogLoading && dialogTurns.length === 0 ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Chat interface */}
                  <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-3 max-h-[200px] overflow-y-auto">
                    {dialogTurns.map((turn, tIdx) => (
                      <div key={tIdx} className={`flex gap-2 items-start ${turn.speaker === "user" ? "justify-end" : ""}`}>
                        {turn.speaker === "partner" && (
                          <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-[10px] text-cyan-400 font-bold">P</div>
                        )}
                        <div className={`p-2.5 rounded-xl text-xs max-w-[80%] ${
                          turn.speaker === "user" 
                            ? "bg-cyan-500 text-zinc-950 font-bold" 
                            : "bg-zinc-950 text-white border border-white/5"
                        }`}>
                          <p>{turn.text}</p>
                          {turn.prompt && <p className="text-[9px] text-cyan-300 font-semibold mt-1 font-sans">💡 Task: {turn.prompt}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!dialogFinished ? (
                    <div className="space-y-3">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => playAudio(dialogTurns[dialogTurns.length - 1]?.text || "")}
                          className="py-1.5 px-3 bg-zinc-900 hover:bg-slate-800 border border-white/5 text-[10px] font-bold text-zinc-350 rounded-lg cursor-pointer inline-flex items-center gap-1"
                        >
                          <Volume2 className="w-3.5 h-3.5" /> Replay Partner Audio
                        </button>
                      </div>

                      <div className="flex flex-col items-center justify-center p-3 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                        <button
                          onClick={handleRecordDialogTurn}
                          disabled={recording || dialogLoading}
                          className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
                            recording ? "bg-red-500 animate-pulse" : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                          }`}
                        >
                          <Mic className="w-4.5 h-4.5" />
                        </button>
                        <span className="text-[9px] text-zinc-400">
                          {recording ? "Recording..." : "Tap mic to reply and complete the task"}
                        </span>
                      </div>

                      {dialogTurns.length >= 3 && (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={handleFinishDialog}
                            disabled={dialogLoading}
                            className="py-2 px-5 bg-cyan-500 hover:bg-cyan-455 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                          >
                            {dialogLoading ? <Loader2 className="w-3 animate-spin" /> : "Finish & Evaluate Dialogue"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 animate-fade-in">
                      <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-450 font-bold">Dialog Turn-taking Score:</span>
                          <span className="text-base font-black text-green-400">{dialogSummary?.score}%</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-[9px] text-center text-zinc-400 font-mono">
                          <div className="bg-zinc-950 p-2 rounded">
                            <span className="text-zinc-550 block">Backchannels</span>
                            {dialogSummary?.backchannels_count}
                          </div>
                          <div className="bg-zinc-950 p-2 rounded">
                            <span className="text-zinc-550 block">Questions</span>
                            {dialogSummary?.questions_count}
                          </div>
                          <div className="bg-zinc-950 p-2 rounded">
                            <span className="text-zinc-550 block">Avg Turn Length</span>
                            {dialogSummary?.average_turn_length} syl
                          </div>
                        </div>

                        <p className="text-xs text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-white/5 leading-relaxed">
                          <strong>Coach advice:</strong> {dialogSummary?.feedback}
                        </p>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleStartDialog}
                          className="py-2 px-4 border border-white/10 hover:bg-zinc-800 text-xs font-bold rounded-lg text-zinc-350 transition cursor-pointer"
                        >
                          Restart Dialog
                        </button>
                        <button
                          onClick={() => setStep(5)}
                          className="py-2.5 px-6 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-450 hover:to-cyan-450 text-zinc-950 font-bold rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/20"
                        >
                          Proceed to Quiz
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => {
                setShIdx(0);
                setAdIdx(0);
                setDialogTurns([]);
                setDialogSession(null);
                setDialogFinished(false);
                setStep(3);
              }}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 5: QUIZ */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Conversation Routine Quiz
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Test your B1 Conversation Routines</h2>
          </div>

          {quizScore === null ? (
            quizBlueprint.length > 0 ? (
              <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Question {quizIdx + 1} of {quizBlueprint.length}</span>
                </div>

                <div className="text-sm font-extrabold text-white min-h-[50px]">
                  {quizBlueprint[quizIdx]?.question}
                </div>

                <div className="space-y-2">
                  {quizBlueprint[quizIdx]?.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelected(opt)}
                      className={`w-full text-left p-3.5 rounded-xl text-xs border transition ${
                        quizSelected === opt 
                          ? "border-cyan-500 bg-cyan-500/10 text-white font-bold" 
                          : "border-white/5 bg-zinc-900 text-zinc-400 hover:bg-slate-800"
                      } ${quizChecked && opt === quizBlueprint[quizIdx].correct_answer ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                      disabled={quizChecked}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {quizChecked && (
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${quizCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
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
                            selected_answer: String(quizSelected || ""),
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
                    <strong>{quizCorrect ? "Correct!" : "Incorrect."}</strong> {quizExplanation}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  {!quizChecked ? (
                    <button
                      onClick={handleCheckQuizAnswer}
                      className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-455 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer"
                      disabled={!quizSelected}
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuiz}
                      className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-405 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      {quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            )
          ) : (
            <div className="bg-zinc-955 p-6 rounded-2xl border border-white/5 text-center space-y-5">
              <Award className="w-12 h-12 text-yellow-400 mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-white">Quiz Completed!</h3>
                <p className="text-2xl font-black text-cyan-400 mt-1">{quizScore}% Score</p>
                <p className="text-xs text-zinc-400 mt-1">
                  {quizScore >= 80 ? "🎉 Amazing! You mastered B1 conversation turn-taking rules." : "Review backchannels and routines then re-test to pass."}
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleRestartQuiz}
                  className="py-2 px-4 border border-white/10 hover:bg-zinc-800 text-xs font-bold rounded-lg text-zinc-350 transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz
                </button>

                {quizScore >= 80 && (
                  <button
                    onClick={() => setStep(6)}
                    className="py-2 px-5 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                  >
                    Proceed to Homework
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => {
                setQuizScore(null);
                setQuizIdx(0);
                setStep(4);
              }}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 6: HOMEWORK */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Homework & Fluency Coach
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Perform reflections and analyze dialogue logs</h2>
          </div>

          <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
            <div className="text-xs text-zinc-400 border-b border-white/5 pb-2 uppercase font-bold tracking-wider font-mono">
              Assigned Conversation Tasks
            </div>

            <div className="space-y-3">
              {homeworkItems.map((hw: any, idx: number) => (
                <div key={hw.id} className="bg-zinc-900 p-3.5 rounded-lg border border-white/5 space-y-2">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase font-mono block">Task {idx + 1}</span>
                  <span className="text-xs text-zinc-200 block">{hw.text}</span>
                  
                  <textarea
                    rows={2}
                    value={hwSents[idx] || ""}
                    onChange={(e) => handleHwChange(idx, e.target.value)}
                    placeholder="Type confirmation or logs of your exchange reflections..."
                    className="w-full bg-zinc-955 border border-white/5 focus:border-cyan-500/50 outline-none rounded p-2 text-xs text-zinc-300 resize-none font-sans"
                    disabled={hwFeedback !== null}
                  />
                </div>
              ))}
            </div>

            {hwFeedback && (
              <div className="bg-green-950/20 border border-green-900 p-4 rounded-xl text-xs text-green-300 leading-relaxed space-y-2">
                <span className="font-bold block">✓ Interaction Metrics Analyzed:</span>
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-center bg-zinc-950/60 p-2 rounded">
                  <div>
                    <span className="text-zinc-500 block">Backchannels</span>
                    {hwFeedback.total_backchannels}
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Questions</span>
                    {hwFeedback.questions_count}
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Avg Turn</span>
                    {hwFeedback.average_turn_length} sentences
                  </div>
                </div>
                <p>{hwFeedback.feedback || "Your voice conversation logs have been added to your fluency profile."}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              {!hwFeedback ? (
                <button
                  onClick={handleSubmitHomework}
                  disabled={submittingHw}
                  className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-455 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/25"
                >
                  {submittingHw ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>Submit Reflection Logs</>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleCompleteLab}
                  disabled={completingLab}
                  className="py-2.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-450 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/25"
                >
                  {completingLab ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Finalizing...
                    </>
                  ) : (
                    <>Complete Phase 8 & Graduate 🎉</>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => {
                setHwFeedback(null);
                setStep(5);
              }}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
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
                if (typeof setQuizSelected === "function") setQuizSelected(null);
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
