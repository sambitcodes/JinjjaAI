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
  Volume1,
  Mic,
  Activity,
  Play,
  ArrowRight,
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

interface Course8Phase4ListeningWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course8Phase4ListeningWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course8Phase4ListeningWizardProps) {
  const phaseNum = 4;
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
    const savedStep = localStorage.getItem("hangeulai_c8p4_step");
    const savedMax = localStorage.getItem("hangeulai_c8p4_max_step");
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
      localStorage.setItem("hangeulai_c8p4_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);

  // Loaded data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Audio playing speed state
  const [speedMode, setSpeedMode] = useState<"slow" | "normal">("slow");

  // Activity 1A: Gist
  const [gistItems, setGistItems] = useState<any[]>([]);
  const [gistIdx, setGistIdx] = useState(0);
  const [gistSelected, setGistSelected] = useState<string | null>(null);
  const [gistChecked, setGistChecked] = useState(false);
  const [gistCorrect, setGistCorrect] = useState<boolean | null>(null);
  const [gistExplanation, setGistExplanation] = useState("");

  // Activity 1B: Keywords
  const [kwItems, setKwItems] = useState<any[]>([]);
  const [kwIdx, setKwIdx] = useState(0);
  const [kwSelectedWords, setKwSelectedWords] = useState<string[]>([]);
  const [kwChecked, setKwChecked] = useState(false);
  const [kwScore, setKwScore] = useState<number | null>(null);
  const [kwFeedback, setKwFeedback] = useState("");

  // Activity 1C: Detail
  const [dtItems, setDtItems] = useState<any[]>([]);
  const [dtIdx, setDtIdx] = useState(0);
  const [dtSelected, setDtSelected] = useState<string | null>(null);
  const [dtChecked, setDtChecked] = useState(false);
  const [dtCorrect, setDtCorrect] = useState<boolean | null>(null);
  const [dtExplanation, setDtExplanation] = useState("");

  // Activity 2A: Echo speaking
  const [echoItems, setEchoItems] = useState<any[]>([]);
  const [echoIdx, setEchoIdx] = useState(0);
  const [echoLineIdx, setEchoLineIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [echoEvaluated, setEchoEvaluated] = useState(false);
  const [echoClarityScore, setEchoClarityScore] = useState<number | null>(null);
  const [echoRhythmScore, setEchoRhythmScore] = useState<number | null>(null);
  const [echoFeedback, setEchoFeedback] = useState("");
  const [echoNeedsWork, setEchoNeedsWork] = useState<string[]>([]);

  // Activity 2B: Pattern speak substitutions
  const [patItems, setPatItems] = useState<any[]>([]);
  const [patIdx, setPatIdx] = useState(0);
  const [patSelectedSlot, setPatSelectedSlot] = useState<string | null>(null);
  const [patEvaluated, setPatEvaluated] = useState(false);
  const [patScore, setPatScore] = useState<number | null>(null);
  const [patFeedback, setPatFeedback] = useState("");

  // Activity 2C: Short QA
  const [qaItems, setQaItems] = useState<any[]>([]);
  const [qaIdx, setQaIdx] = useState(0);
  const [qaSelectedChoice, setQaSelectedChoice] = useState<string | null>(null);
  const [qaEvaluated, setQaEvaluated] = useState(false);
  const [qaScore, setQaScore] = useState<number | null>(null);
  const [qaFeedback, setQaFeedback] = useState("");

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
  const [hwStreak, setHwStreak] = useState<number | null>(null);
  const [hwFeedbackText, setHwFeedbackText] = useState("");
  const [submittingHw, setSubmittingHw] = useState(false);
  const [completingLab, setCompletingLab] = useState(false);

  // --- Start Progress State Preservation ---
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hangeulai_c8p4_progress_state");
        if (saved) {
          const state = JSON.parse(saved);
            if (state.step !== undefined) setStep(state.step);
            if (state.maxStep !== undefined) setMaxStep(state.maxStep);
            if (state.gistIdx !== undefined) setGistIdx(state.gistIdx);
            if (state.gistSelected !== undefined) setGistSelected(state.gistSelected);
            if (state.gistChecked !== undefined) setGistChecked(state.gistChecked);
            if (state.gistCorrect !== undefined) setGistCorrect(state.gistCorrect);
            if (state.kwIdx !== undefined) setKwIdx(state.kwIdx);
            if (state.kwSelectedWords !== undefined) setKwSelectedWords(state.kwSelectedWords);
            if (state.kwChecked !== undefined) setKwChecked(state.kwChecked);
            if (state.kwScore !== undefined) setKwScore(state.kwScore);
            if (state.dtIdx !== undefined) setDtIdx(state.dtIdx);
            if (state.dtSelected !== undefined) setDtSelected(state.dtSelected);
            if (state.dtChecked !== undefined) setDtChecked(state.dtChecked);
            if (state.dtCorrect !== undefined) setDtCorrect(state.dtCorrect);
            if (state.echoIdx !== undefined) setEchoIdx(state.echoIdx);
            if (state.echoLineIdx !== undefined) setEchoLineIdx(state.echoLineIdx);
            if (state.echoClarityScore !== undefined) setEchoClarityScore(state.echoClarityScore);
            if (state.echoRhythmScore !== undefined) setEchoRhythmScore(state.echoRhythmScore);
            if (state.patIdx !== undefined) setPatIdx(state.patIdx);
            if (state.patSelectedSlot !== undefined) setPatSelectedSlot(state.patSelectedSlot);
            if (state.patScore !== undefined) setPatScore(state.patScore);
            if (state.qaIdx !== undefined) setQaIdx(state.qaIdx);
            if (state.qaSelectedChoice !== undefined) setQaSelectedChoice(state.qaSelectedChoice);
            if (state.qaScore !== undefined) setQaScore(state.qaScore);
            if (state.quizIdx !== undefined) setQuizIdx(state.quizIdx);
            if (state.quizSelected !== undefined) setQuizSelected(state.quizSelected);
            if (state.quizChecked !== undefined) setQuizChecked(state.quizChecked);
            if (state.quizCorrect !== undefined) setQuizCorrect(state.quizCorrect);
            if (state.quizMistakes !== undefined) setQuizMistakes(state.quizMistakes);
            if (state.quizScore !== undefined) setQuizScore(state.quizScore);
            if (state.hwFeedbackText !== undefined) setHwFeedbackText(state.hwFeedbackText);
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
            gistIdx,
            gistSelected,
            gistChecked,
            gistCorrect,
            kwIdx,
            kwSelectedWords,
            kwChecked,
            kwScore,
            dtIdx,
            dtSelected,
            dtChecked,
            dtCorrect,
            echoIdx,
            echoLineIdx,
            echoClarityScore,
            echoRhythmScore,
            patIdx,
            patSelectedSlot,
            patScore,
            qaIdx,
            qaSelectedChoice,
            qaScore,
            quizIdx,
            quizSelected,
            quizChecked,
            quizCorrect,
            quizMistakes,
            quizScore,
            hwFeedbackText
        };
        localStorage.setItem("hangeulai_c8p4_progress_state", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save progress state:", e);
      }
    }
  }, [step, maxStep, gistIdx, gistSelected, gistChecked, gistCorrect, kwIdx, kwSelectedWords, kwChecked, kwScore, dtIdx, dtSelected, dtChecked, dtCorrect, echoIdx, echoLineIdx, echoClarityScore, echoRhythmScore, patIdx, patSelectedSlot, patScore, qaIdx, qaSelectedChoice, qaScore, quizIdx, quizSelected, quizChecked, quizCorrect, quizMistakes, quizScore, hwFeedbackText]);
  // --- End Progress State Preservation ---

  const [completionData, setCompletionData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/4/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/4/core-data");
          setCoreData(res);
        } else if (step === 3) {
          if (gistItems.length === 0) {
            const resGist = await apiJson("/phase-4/dialogues/gist");
            setGistItems(resGist);
          }
          if (kwItems.length === 0) {
            const resKw = await apiJson("/phase-4/dialogues/keywords");
            setKwItems(resKw);
          }
          if (dtItems.length === 0) {
            const resDt = await apiJson("/phase-4/dialogues/detail");
            setDtItems(resDt);
          }
        } else if (step === 4) {
          if (echoItems.length === 0) {
            const resEcho = await apiJson("/phase-4/dialogues/echo-lines");
            setEchoItems(resEcho);
          }
          if (patItems.length === 0) {
            const resPat = await apiJson("/phase-4/dialogues/pattern-speak");
            setPatItems(resPat);
          }
          if (qaItems.length === 0) {
            const resQa = await apiJson("/phase-4/dialogues/qa");
            setQaItems(resQa);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/phase-4/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-4/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading PLS Lab Phase 4:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Dialogue Full Player Simulation
  const playDialogueAudio = (dialogueId: string, speed: "slow" | "normal") => {
    const dialogue = coreData?.dialogue_list?.find((d: any) => d.id === dialogueId);
    if (!dialogue) return;
    // Speak full script
    const fullText = dialogue.script.map((s: any) => s.ko).join(" ... ");
    speakWord(fullText);
  };

  // Activity 1A Gist check
  const handleCheckGist = async () => {
    const current = gistItems[gistIdx];
    if (!current || !gistSelected) return;
    try {
      const res = await apiJson("/phase-4/dialogues/gist/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: gistSelected })
      });
      setGistCorrect(res.correct);
      setGistChecked(true);
      setGistExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextGist = () => {
    setGistSelected(null);
    setGistChecked(false);
    setGistCorrect(null);
    setGistExplanation("");
    if (gistIdx < gistItems.length - 1) {
      setGistIdx(prev => prev + 1);
    }
  };

  // Activity 1B Keyword check
  const handleToggleKeyword = (word: string) => {
    if (kwChecked) return;
    setKwSelectedWords(prev =>
      prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
    );
  };

  const handleCheckKeywords = async () => {
    const current = kwItems[kwIdx];
    if (!current) return;
    try {
      const res = await apiJson("/phase-4/dialogues/keywords/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: kwSelectedWords.join(",") })
      });
      setKwScore(res.score);
      setKwFeedback(res.feedback);
      setKwChecked(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextKw = () => {
    setKwSelectedWords([]);
    setKwChecked(false);
    setKwScore(null);
    setKwFeedback("");
    if (kwIdx < kwItems.length - 1) {
      setKwIdx(prev => prev + 1);
    }
  };

  // Activity 1C Detail check
  const handleCheckDetail = async () => {
    const current = dtItems[dtIdx];
    if (!current || !dtSelected) return;
    try {
      const res = await apiJson("/phase-4/dialogues/detail/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: dtSelected })
      });
      setDtCorrect(res.correct);
      setDtChecked(true);
      setDtExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextDetail = () => {
    setDtSelected(null);
    setDtChecked(false);
    setDtCorrect(null);
    setDtExplanation("");
    if (dtIdx < dtItems.length - 1) {
      setDtIdx(prev => prev + 1);
    }
  };

  // Activity 2A Echo recording
  const handleRecordEcho = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = echoItems[echoIdx];
      const currentLine = current.lines[echoLineIdx];
      try {
        const res = await apiJson("/phase-4/dialogues/echo-lines/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: currentLine.id, audio_base64: "mock_speech_data" })
        });
        setEchoClarityScore(res.clarity_score);
        setEchoRhythmScore(res.rhythm_score);
        setEchoFeedback(res.feedback);
        setEchoNeedsWork(res.needs_work_words || []);
        setEchoEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleNextEchoLine = () => {
    setEchoClarityScore(null);
    setEchoRhythmScore(null);
    setEchoFeedback("");
    setEchoNeedsWork([]);
    setEchoEvaluated(false);

    const current = echoItems[echoIdx];
    if (echoLineIdx < current.lines.length - 1) {
      setEchoLineIdx(prev => prev + 1);
    } else {
      setEchoLineIdx(0);
      if (echoIdx < echoItems.length - 1) {
        setEchoIdx(prev => prev + 1);
      }
    }
  };

  // Activity 2B Pattern substitution speak
  const handleRecordPattern = () => {
    if (!patSelectedSlot) return;
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = patItems[patIdx];
      try {
        const res = await apiJson("/phase-4/dialogues/pattern-speak/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: current.id, audio_base64: "mock_speech_data" })
        });
        setPatScore(res.score);
        setPatFeedback(res.feedback);
        setPatEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleNextPat = () => {
    setPatSelectedSlot(null);
    setPatScore(null);
    setPatFeedback("");
    setPatEvaluated(false);
    if (patIdx < patItems.length - 1) {
      setPatIdx(prev => prev + 1);
    }
  };

  // Activity 2C Short QA
  const handleRecordQA = () => {
    if (!qaSelectedChoice) return;
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = qaItems[qaIdx];
      try {
        const res = await apiJson("/phase-4/dialogues/qa/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: current.id, audio_base64: "mock_speech_data" })
        });
        setQaScore(res.score);
        setQaFeedback(res.feedback);
        setQaEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleNextQA = () => {
    setQaSelectedChoice(null);
    setQaScore(null);
    setQaFeedback("");
    setQaEvaluated(false);
    if (qaIdx < qaItems.length - 1) {
      setQaIdx(prev => prev + 1);
    }
  };

  // Quiz flow
  const handleCheckQuizAnswer = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelected) return;
    try {
      const res = await apiJson("/phase-4/quiz/answer", {
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
        await apiJson("/phase-4/quiz/finish", {
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
      const res = await apiJson("/phase-4/homework/submit", {
        method: "POST",
        body: JSON.stringify({ sentences: hwSents })
      });
      setHwStreak(res.streak_days);
      setHwFeedbackText(res.feedback);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingHw(false);
    }
  };

  const handleCompleteLab = async () => {
    setCompletingLab(true);
    try {
      const res = await apiJson("/phase-4/complete", { method: "POST" });
      setCompletionData(res);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingLab(false);
    }
  };

    const outlineSteps = [
    { num: 1, label: "= 1 ? \"bg-cyan-500\" : \"bg-slate-700\"}`} /> Screen 1: Welcome & Phase Overview" },
    { num: 2, label: "= 2 ? \"bg-teal-500\" : \"bg-slate-700\"}`} /> Screen 2: Listening Strategies: Multi-Pass & Echoing" },
    { num: 3, label: "= 3 ? \"bg-indigo-500\" : \"bg-slate-700\"}`} /> Screen 3: Activity 1: Listen for Gist, Keywords & Details" },
    { num: 4, label: "= 4 ? \"bg-purple-500\" : \"bg-slate-700\"}`} /> Screen 4: Activity 2: Echo Speaking, Pattern Substitutions & QA" },
    { num: 5, label: "= 5 ? \"bg-pink-500\" : \"bg-slate-700\"}`} /> Screen 5: Mini-Quiz: Listening Check" },
    { num: 6, label: "= 6 ? \"bg-emerald-500\" : \"bg-slate-700\"}`} /> Screen 6: Homework Habit & Routine Builder" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 8,
          phaseNum: 4,
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
          <Volume2 className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h2 className="font-black text-xl text-white tracking-tight">Listening Lab 1</h2>
            <p className="text-xs text-zinc-400">Everyday Dialogues (A1–A2)</p>
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
              className="bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 h-full transition-all duration-300"
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
                const isCompleted = s.num < step;
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
              <Volume2 className="w-10 h-10 animate-bounce" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-brand-500 rounded-full border-2 border-zinc-950">
              <Sparkles className="w-3 h-3 text-white fill-white" />
            </div>
          </div>

          <div>
            <h2 className="text-5xl font-black text-white tracking-tight font-sans">{metadata?.title || "Listening Lab 1 – Everyday Dialogues (A1–A2)"}</h2>
            <h3 className="text-2xl font-extrabold text-cyan-400 mt-2">{metadata?.subtitle || "Understand and echo short daily conversations."}</h3>
          </div>

          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "In this lab, you’ll practise understanding slow, clear Korean dialogues about everyday topics, and echo them aloud to build listening and speaking together."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Focus Milestones:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Hear A1–A2 dialogues at slow and normal speed",
                "Catch key information without understanding every word",
                "Echo short turns to build automatic speaking patterns"
              ]).map((g: string, i: number) => <li key={i}>{g}</li>)}
            </ul>
            <p className="pt-2 text-zinc-400"><strong>⏱️ Est. Lab Time:</strong> 25 minutes</p>
            <p className="text-zinc-400"><strong>🔗 Prerequisites:</strong> {metadata?.dependencies || "Pronunciation Lab 3 (Completed)"}</p>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl mx-auto">
            {["A1–A2", "Listening", "Speaking", "Dialogues"].map(chip => (
              <span key={chip} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] text-cyan-300 font-bold">{chip}</span>
            ))}
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => {
    if (courseXP < 240) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 4, you need at least 240 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} 
              className="bg-cyan-500 hover:bg-cyan-450 text-zinc-950 font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Volume2 className="w-4 h-4" /> Start Everyday Listening Lab
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: STRATEGY EXPLANATION */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            How This Listening Lab Works
          </h2>

          {/* ListeningStrategyCard */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
            <h3 className="text-sm font-bold text-white">Listening Strategy: Multiple Passes</h3>
            <div className="text-xs text-zinc-400 space-y-2 leading-relaxed">
              <p>To acquire authentic spoken Korean patterns without feeling overwhelmed, we divide listening tasks into three consecutive stages (passes).</p>
            </div>
          </div>

          {/* MultiPassDiagram */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Pass 1: Gist</span>
              <p className="text-xs text-white font-bold">Audio only</p>
              <p className="text-[10px] text-zinc-500 leading-normal">Ignore written script. Just listen to catch context, location, and the general topic.</p>
            </div>
            <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-teal-400 uppercase font-bold">Pass 2: Keywords</span>
              <p className="text-xs text-white font-bold">Audio + Hangeul</p>
              <p className="text-[10px] text-zinc-500 leading-normal">Scan the Korean text and tap words that carry primary meanings (nouns, verbs).</p>
            </div>
            <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">Pass 3: Translation</span>
              <p className="text-xs text-white font-bold">Audio + Translation</p>
              <p className="text-[10px] text-zinc-500 leading-normal">Verify and align line-by-line meanings. Fill in gaps and study sentence flow.</p>
            </div>
          </div>

          {/* EchoSpeakingIntro */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1.5">
            <h4 className="text-xs font-bold text-zinc-200">Echo Speaking (Shadowing) Light</h4>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Once you understand the context, listen to short audio phrases and repeat them immediately.
              At the A1–A2 level, the goal is clarity and keeping a stable rhythm block, rather than perfect prosody.
            </p>
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
              className="flex items-center gap-1 py-2.5 px-6 bg-cyan-500 hover:bg-cyan-450 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Drills
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: ACTIVITY 1: LISTEN FOR GIST & DETAIL */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 1: Gist & Detail check
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Interactive multi-pass listening exercises</h2>
          </div>

          {/* Speed Toggle Controller */}
          <div className="flex justify-end gap-2 text-xs">
            <span className="text-zinc-500 self-center">Playback Speed:</span>
            <button 
              onClick={() => setSpeedMode("slow")}
              className={`px-3 py-1 rounded-lg border font-mono transition ${speedMode === "slow" ? "border-cyan-400 bg-cyan-500/10 text-cyan-300" : "border-white/5 bg-zinc-950 text-zinc-400"}`}
            >
              0.8x (Slow)
            </button>
            <button 
              onClick={() => setSpeedMode("normal")}
              className={`px-3 py-1 rounded-lg border font-mono transition ${speedMode === "normal" ? "border-cyan-400 bg-cyan-500/10 text-cyan-300" : "border-white/5 bg-zinc-950 text-zinc-400"}`}
            >
              1.0x (Normal)
            </button>
          </div>

          {/* Activity 1A: Gist Questions */}
          {gistItems.length > 0 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Pass 1: Listen for Gist (Audio only)</span>
                <span>Dialogue {gistIdx + 1} of {gistItems.length}</span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => playDialogueAudio(gistItems[gistIdx]?.dialogue_id, speedMode)}
                  className="p-3 bg-cyan-500/20 text-cyan-300 rounded-full hover:bg-cyan-500/30 transition border border-cyan-500/30 cursor-pointer animate-pulse"
                >
                  <Play className="w-5 h-5 fill-current" />
                </button>
                <span className="text-xs text-zinc-450 leading-relaxed">
                  Listen to the dialog (no script visible yet), and answer the question:
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-zinc-200">{gistItems[gistIdx]?.question}</p>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  {gistItems[gistIdx]?.options?.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !gistChecked && setGistSelected(opt)}
                      className={`py-3 px-4 rounded-xl text-left border transition ${
                        gistSelected === opt 
                          ? "border-cyan-500 bg-cyan-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                      } ${gistChecked && opt === gistItems[gistIdx].correct ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                      disabled={gistChecked}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {gistChecked && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${gistCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                  <strong>{gistCorrect ? "Correct!" : "Incorrect."}</strong> {gistExplanation}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!gistChecked ? (
                  <button
                    onClick={handleCheckGist}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-750 text-xs font-bold rounded-lg text-zinc-200 transition cursor-pointer"
                    disabled={!gistSelected}
                  >
                    Check Answer
                  </button>
                ) : (
                  gistIdx < gistItems.length - 1 && (
                    <button
                      onClick={handleNextGist}
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                    >
                      Next Dialogue
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Activity 1B: Keywords */}
          {kwItems.length > 0 && gistChecked && gistIdx === gistItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Pass 2: Identify Keywords (Script + Audio)</span>
                <span>Dialogue {kwIdx + 1} of {kwItems.length}</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => playDialogueAudio(kwItems[kwIdx]?.dialogue_id, speedMode)}
                    className="p-2.5 bg-zinc-900 border border-white/5 rounded-full hover:bg-slate-800 text-cyan-400 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-zinc-400">Tap words that carry the primary meaning (nouns/verbs):</span>
                </div>

                <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 flex flex-wrap gap-2 leading-loose">
                  {coreData?.dialogue_list?.find((d: any) => d.id === kwItems[kwIdx]?.dialogue_id)?.script?.map((line: any, idx: number) => {
                    const tokens = line.ko.split(" ");
                    return (
                      <div key={idx} className="w-full flex flex-wrap gap-1.5 items-center py-1">
                        <span className="text-[10px] text-zinc-550 mr-2 font-mono uppercase">{line.speaker}:</span>
                        {tokens.map((tok: string, tIdx: number) => {
                          const isSelected = kwSelectedWords.includes(tok);
                          const isKeyword = kwItems[kwIdx]?.keywords?.includes(tok);
                          return (
                            <button
                              key={tIdx}
                              onClick={() => handleToggleKeyword(tok)}
                              disabled={kwChecked}
                              className={`px-2.5 py-1 rounded text-xs transition cursor-pointer border ${
                                isSelected 
                                  ? "bg-cyan-500/20 border-cyan-400 text-white" 
                                  : "bg-zinc-950 border-white/5 text-zinc-400 hover:bg-zinc-800"
                              } ${kwChecked && isKeyword ? "border-green-500 text-green-300 bg-green-500/10" : ""}`}
                            >
                              {tok}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {kwChecked && (
                <div className="bg-indigo-950/20 border border-indigo-900/50 p-4 rounded-xl text-xs space-y-1 text-indigo-300">
                  <div className="flex justify-between font-bold">
                    <span>Keyword Match Score: {kwScore}%</span>
                    <span>Note</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">{kwFeedback}</p>
                  <p className="text-[10px] text-zinc-500">Correct Keywords: {kwItems[kwIdx]?.keywords?.join(", ")}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!kwChecked ? (
                  <button
                    onClick={handleCheckKeywords}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-750 text-xs font-bold rounded-lg text-zinc-200 transition cursor-pointer"
                  >
                    Confirm Keywords
                  </button>
                ) : (
                  kwIdx < kwItems.length - 1 && (
                    <button
                      onClick={handleNextKw}
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                    >
                      Next Dialogue
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Activity 1C: Detail */}
          {dtItems.length > 0 && kwChecked && kwIdx === kwItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Pass 3: Detailed Translation & Comprehension</span>
                <span>Question {dtIdx + 1} of {dtItems.length}</span>
              </div>

              {/* Side-by-Side script translations */}
              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-2.5">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Dialogue Gloss Translation:</span>
                <div className="space-y-2 divide-y divide-white/5">
                  {coreData?.dialogue_list?.find((d: any) => d.id === dtItems[dtIdx]?.dialogue_id)?.script?.map((line: any, idx: number) => (
                    <div key={idx} className="pt-2 flex flex-col gap-1 text-xs">
                      <div className="flex gap-2">
                        <strong className="text-cyan-400 font-mono">{line.speaker}:</strong>
                        <span className="text-white font-medium">{line.ko}</span>
                      </div>
                      <span className="text-zinc-500 pl-5">{line.en}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs text-zinc-400 font-bold block">{dtItems[dtIdx]?.question}</span>
                <div className="grid grid-cols-1 gap-2">
                  {dtItems[dtIdx]?.options?.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !dtChecked && setDtSelected(opt)}
                      className={`py-3 px-4 rounded-xl text-xs text-left border transition ${
                        dtSelected === opt 
                          ? "border-cyan-500 bg-cyan-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                      } ${dtChecked && opt === dtItems[dtIdx].correct ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                      disabled={dtChecked}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {dtChecked && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${dtCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                  <strong>{dtCorrect ? "Correct!" : "Incorrect."}</strong> {dtExplanation}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!dtChecked ? (
                  <button
                    onClick={handleCheckDetail}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-750 text-xs font-bold rounded-lg text-zinc-200 transition cursor-pointer"
                    disabled={!dtSelected}
                  >
                    Check Detail
                  </button>
                ) : (
                  dtIdx < dtItems.length - 1 ? (
                    <button
                      onClick={handleNextDetail}
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      onClick={() => setStep(4)}
                      className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold text-white rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      Proceed to Speaking Lab <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <button 
              onClick={() => {
    if (courseXP < 240) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 4, you need at least 240 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
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

      {/* SCREEN 4: ACTIVITY 2: ECHO SPEAKING & SHORT RESPONSES */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 2: Speaking & Substitutions
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Echo short sentences and build substitute responses</h2>
          </div>

          {/* Activity 2A: Echo each line */}
          {echoItems.length > 0 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Echo Speaking (Line by Line)</span>
                <span>Dialogue {echoIdx + 1} of {echoItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-3">
                <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-bold">Listen then Echo:</span>
                <span className="text-lg font-black text-white block">
                  {echoItems[echoIdx]?.lines[echoLineIdx]?.text}
                </span>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => playAudio(echoItems[echoIdx]?.lines[echoLineIdx]?.text)}
                    className="p-3 bg-zinc-950 border border-white/10 hover:border-cyan-400/30 text-cyan-400 hover:text-cyan-300 rounded-full transition cursor-pointer"
                    title="Play Audio"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleRecordEcho}
                    disabled={recording}
                    className={`p-3 rounded-full transition border cursor-pointer ${
                      recording 
                        ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse" 
                        : "bg-cyan-500 hover:bg-cyan-450 border-cyan-450 text-zinc-950 font-bold"
                    }`}
                  >
                    {recording ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {echoEvaluated && (
                <div className="bg-emerald-950/20 border border-emerald-900 p-4 rounded-xl text-xs space-y-2 text-emerald-300">
                  <div className="grid grid-cols-2 gap-2 font-bold text-center border-b border-white/5 pb-2 mb-2">
                    <div>Clarity Score: {echoClarityScore}%</div>
                    <div>Rhythm Alignment: {echoRhythmScore}%</div>
                  </div>
                  <p className="text-zinc-450 text-[11px] leading-relaxed">{echoFeedback}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {echoEvaluated && (
                  <button
                    onClick={handleNextEchoLine}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Line
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2B: Pattern substitutions */}
          {patItems.length > 0 && echoEvaluated && echoIdx === echoItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Pattern Substitution Slot Picker</span>
                <span>Sentence {patIdx + 1} of {patItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="text-[10px] text-zinc-550 block uppercase font-bold">Replace the slot, then read:</span>
                <span className="text-md font-bold text-white block">
                  {patItems[patIdx]?.pattern.replace("[이름]", patSelectedSlot || "[이름]").replace("[수량]", patSelectedSlot || "[수량]").replace("[시간]", patSelectedSlot || "[시간]")}
                </span>

                <div className="flex gap-2 flex-wrap pt-2 border-t border-white/5">
                  {patItems[patIdx]?.slots?.map((slot: string) => (
                    <button
                      key={slot}
                      onClick={() => !patEvaluated && setPatSelectedSlot(slot)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                        patSelectedSlot === slot 
                          ? "border-teal-400 bg-teal-500/10 text-white" 
                          : "border-white/5 bg-zinc-950 text-zinc-450 hover:bg-slate-800"
                      }`}
                      disabled={patEvaluated}
                    >
                      {slot}
                    </button>
                  ))}
                </div>

                {patSelectedSlot && (
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={handleRecordPattern}
                      disabled={recording}
                      className={`py-2 px-5 rounded-xl transition border text-xs font-bold flex items-center gap-2 cursor-pointer ${
                        recording 
                          ? "bg-red-500/20 border-red-500 text-red-400" 
                          : "bg-cyan-500 hover:bg-cyan-450 text-zinc-950"
                      }`}
                    >
                      {recording ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                      <span>{recording ? "Recording..." : "Record substitution"}</span>
                    </button>
                  </div>
                )}
              </div>

              {patEvaluated && (
                <div className="bg-cyan-950/20 border border-cyan-900 p-4 rounded-xl text-xs space-y-1 text-cyan-300">
                  <div className="font-bold">Speech Match Score: {patScore}%</div>
                  <p className="text-zinc-450 leading-relaxed">{patFeedback}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {patEvaluated && patIdx < patItems.length - 1 && (
                  <button
                    onClick={handleNextPat}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Pattern
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2C: Short QA response */}
          {qaItems.length > 0 && patEvaluated && patIdx === patItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Short Answer to Question</span>
                <span>Question {qaIdx + 1} of {qaItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => playAudio(qaItems[qaIdx]?.question)}
                    className="p-3 bg-zinc-950 border border-white/10 hover:border-cyan-400/30 text-cyan-400 hover:text-cyan-300 rounded-full transition cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Listen to the question:</span>
                    <span className="text-base font-bold text-white block">{qaItems[qaIdx]?.question}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] text-zinc-500 uppercase block font-bold">Select and record your answer:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {qaItems[qaIdx]?.choices?.map((c: string) => (
                      <button
                        key={c}
                        onClick={() => !qaEvaluated && setQaSelectedChoice(c)}
                        className={`py-2.5 px-3 border text-xs font-semibold rounded-lg transition text-left ${
                          qaSelectedChoice === c ? "border-indigo-400 bg-indigo-500/10 text-white" : "border-white/5 bg-zinc-950 text-zinc-400 hover:bg-slate-800"
                        }`}
                        disabled={qaEvaluated}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {qaSelectedChoice && (
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={handleRecordQA}
                      disabled={recording}
                      className={`py-2 px-5 rounded-xl transition border text-xs font-bold flex items-center gap-2 cursor-pointer ${
                        recording 
                          ? "bg-red-500/20 border-red-500 text-red-400" 
                          : "bg-cyan-500 hover:bg-cyan-450 text-zinc-950"
                      }`}
                    >
                      {recording ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                      <span>{recording ? "Recording answer..." : "Record Answer"}</span>
                    </button>
                  </div>
                )}
              </div>

              {qaEvaluated && (
                <div className="bg-indigo-950/20 border border-indigo-900 p-4 rounded-xl text-xs space-y-2 text-indigo-300">
                  <div className="font-bold">Answer Acceptability Score: {qaScore}%</div>
                  <p className="text-zinc-450 leading-relaxed">{qaFeedback}</p>
                  <p className="text-[10px] text-zinc-500">Suggested Model Answer: {qaItems[qaIdx]?.model_answer}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {qaEvaluated && (
                  qaIdx < qaItems.length - 1 ? (
                    <button
                      onClick={handleNextQA}
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      onClick={() => setStep(5)}
                      className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold text-white rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      Proceed to Mini-Quiz <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(3)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 5: MINI-QUIZ */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/25 px-2 py-0.5 rounded-full font-bold">
              Mini-Quiz: Listening Check
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Everyday Listening Competency</h2>
          </div>

          {quizBlueprint.length > 0 && quizScore === null && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Quiz Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-900 px-1.5 py-0.5 rounded uppercase font-bold">
                  {quizBlueprint[quizIdx].type}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => playAudio(quizBlueprint[quizIdx].question)}
                    className="p-2 bg-zinc-900 border border-white/5 text-purple-400 rounded-full hover:bg-slate-800 transition"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <p className="text-xs font-semibold text-zinc-250">{quizBlueprint[quizIdx].question}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs">
                  {quizBlueprint[quizIdx].options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelected(opt)}
                      className={`py-3 px-4 rounded-xl text-left border transition ${
                        quizSelected === opt 
                          ? "border-purple-500 bg-purple-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                      } ${quizChecked && opt === quizBlueprint[quizIdx].correct_answer ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                      disabled={quizChecked}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
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

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuizAnswer}
                    className="py-2 px-4 bg-purple-900 hover:bg-purple-800 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                    disabled={!quizSelected}
                  >
                    Check Choice
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuiz}
                    className="py-2 px-4 bg-purple-500 hover:bg-purple-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    {quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quiz Score Summary Card */}
          {quizScore !== null && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-center space-y-5">
              <Award className="w-12 h-12 text-yellow-500 mx-auto animate-bounce" />
              <div>
                <h3 className="font-black text-xl text-white tracking-tight">Listening Quiz Completed</h3>
                <span className="text-4xl font-black text-white block mt-1">{quizScore}%</span>
                <p className="text-xs text-zinc-400 mt-2">
                  {quizScore >= 80 ? "Pass! You have achieved listening competency for standard daily conversations." : "Did not pass. We recommend reviewing the dialogues inside Screen 3 and repeating speech checks."}
                </p>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl text-xs text-left border border-white/5 space-y-1">
                <p className="font-semibold text-zinc-350">Recommendations:</p>
                <ul className="list-disc list-inside text-zinc-400 space-y-1">
                  <li>Keep practicing Pass 1 (Gist listening) without scripts.</li>
                  <li>Re-study keyword structures inside Activity 1B if dictation fields were difficult.</li>
                </ul>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={handleRestartQuiz}
                  className="py-2 px-4 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-xs font-semibold rounded-lg text-zinc-300 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restart Quiz
                </button>

                <button
                  onClick={() => setStep(6)}
                  className="py-2 px-5 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                >
                  Proceed to Homework
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(4)}
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
            <span className="text-xs bg-emerald-500/10 text-emerald-450 border border-emerald-500/25 px-2 py-0.5 rounded-full font-bold">
              Homework & Listening Habits
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Consolidate daily dialogue speech routines</h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Homework instruction log list */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
              <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-bold block">Assigned Routine logs:</span>
              <ul className="space-y-2.5 text-zinc-300 pl-1 divide-y divide-white/5">
                {homeworkItems.map((item, idx) => (
                  <div key={item.id} className="pt-2.5 first:pt-0">
                    <p className="font-semibold text-white">Task {idx + 1}: {item.text.split(":")[0]}</p>
                    <p className="text-zinc-450 leading-relaxed mt-0.5">{item.text.split(":")[1]}</p>
                  </div>
                ))}
              </ul>
            </div>

            {/* Daily log log form */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
              <span className="text-[10px] text-zinc-500 uppercase block font-bold">AI Listening Coach Habit Entry Form:</span>
              
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Source Type (e.g. course)"
                  value={hwSents[0]}
                  onChange={(e) => handleHwChange(0, e.target.value)}
                  className="bg-zinc-900 border border-white/5 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="Topic (e.g. café order)"
                  value={hwSents[1]}
                  onChange={(e) => handleHwChange(1, e.target.value)}
                  className="bg-zinc-900 border border-white/5 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="Notes/Brief Summary"
                  value={hwSents[2]}
                  onChange={(e) => handleHwChange(2, e.target.value)}
                  className="bg-zinc-900 border border-white/5 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSubmitHomework}
                  disabled={submittingHw || !hwSents[0] || !hwSents[1]}
                  className="py-2 px-4 bg-emerald-500 hover:bg-emerald-450 text-zinc-950 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {submittingHw ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Log Habit Entry</span>
                </button>
              </div>
            </div>

            {hwStreak !== null && (
              <div className="bg-emerald-950/20 border border-emerald-900 p-4 rounded-xl space-y-1 text-emerald-300">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔥</span>
                  <strong className="text-xs">Logged streak: {hwStreak} days!</strong>
                </div>
                <p className="text-[11px] text-zinc-450 leading-relaxed">{hwFeedbackText}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(5)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleCompleteLab}
              disabled={completingLab}
              className="py-2.5 px-6 bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 hover:brightness-110 text-white font-extrabold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg"
            >
              {completingLab ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Award className="w-4 h-4 text-yellow-300" />
              )}
              <span>Complete Phase 4 Lab</span>
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
