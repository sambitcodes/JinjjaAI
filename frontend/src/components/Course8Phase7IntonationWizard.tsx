"use client";

import { useEffect, useState } from "react";
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
  ArrowRight
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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

interface Course8Phase7IntonationWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course8Phase7IntonationWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course8Phase7IntonationWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);

  // Loaded data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1A: Statement vs Yes/no question
  const [sYnItems, setSYnItems] = useState<any[]>([]);
  const [sYnIdx, setSYnIdx] = useState(0);
  const [sYnSelected, setSYnSelected] = useState<string | null>(null); // "Statement" or "Question"
  const [sYnChecked, setSYnChecked] = useState(false);
  const [sYnCorrect, setSYnCorrect] = useState<boolean | null>(null);
  const [sYnExplanation, setSYnExplanation] = useState("");

  // Activity 1B: YN vs WH
  const [ynWhItems, setYnWhItems] = useState<any[]>([]);
  const [ynWhIdx, setYnWhIdx] = useState(0);
  const [ynWhSelectedYn, setYnWhSelectedYn] = useState<string | null>(null);
  const [ynWhSelectedWh, setYnWhSelectedWh] = useState<string | null>(null);
  const [ynWhChecked, setYnWhChecked] = useState(false);
  const [ynWhCorrect, setYnWhCorrect] = useState<boolean | null>(null);
  const [ynWhExplanation, setYnWhExplanation] = useState("");

  // Activity 1C: Emotion Listening
  const [elItems, setElItems] = useState<any[]>([]);
  const [elIdx, setElIdx] = useState(0);
  const [elSelected, setElSelected] = useState<string | null>(null);
  const [elChecked, setElChecked] = useState(false);
  const [elCorrect, setElCorrect] = useState<boolean | null>(null);
  const [elExplanation, setElExplanation] = useState("");

  // Activity 2A: Statement vs Question Speak
  const [sqDrills, setSqDrills] = useState<any[]>([]);
  const [sqIdx, setSqIdx] = useState(0);
  const [sqMode, setSqMode] = useState<"statement" | "question">("statement");
  const [recording, setRecording] = useState(false);
  const [sqEvaluated, setSqEvaluated] = useState(false);
  const [sqScore, setSqScore] = useState<number | null>(null);
  const [sqContour, setSqContour] = useState("");
  const [sqFeedback, setSqFeedback] = useState("");

  // Activity 2B: Wh vs YN Speak
  const [wqDrills, setWqDrills] = useState<any[]>([]);
  const [wqIdx, setWqIdx] = useState(0);
  const [wqEvaluated, setWqEvaluated] = useState(false);
  const [wqScore, setWqScore] = useState<number | null>(null);
  const [wqFeedback, setWqFeedback] = useState("");

  // Activity 2C: Emotion Speak
  const [epItems, setEpItems] = useState<any[]>([]);
  const [epIdx, setEpIdx] = useState(0);
  const [epEvaluated, setEpEvaluated] = useState(false);
  const [epScore, setEpScore] = useState<number | null>(null);
  const [epFeedback, setEpFeedback] = useState("");

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
  const [completionData, setCompletionData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/7/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/7/core-data");
          setCoreData(res);
        } else if (step === 3) {
          if (sYnItems.length === 0) {
            const resSYn = await apiJson("/phase-7/items/statement-vs-yn");
            setSYnItems(resSYn);
          }
          if (ynWhItems.length === 0) {
            const resYnWh = await apiJson("/phase-7/items/yn-vs-wh");
            setYnWhItems(resYnWh);
          }
          if (elItems.length === 0) {
            const resEl = await apiJson("/phase-7/items/emotion-listening");
            setElItems(resEl);
          }
        } else if (step === 4) {
          if (sqDrills.length === 0) {
            const resSq = await apiJson("/phase-7/items/statement-question-speak");
            setSqDrills(resSq);
          }
          if (wqDrills.length === 0) {
            const resWq = await apiJson("/phase-7/items/wh-yn-speak");
            setWqDrills(resWq);
          }
          if (epItems.length === 0) {
            const resEp = await apiJson("/phase-7/items/emotion-speak");
            setEpItems(resEp);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/phase-7/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-7/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading PLS Lab Phase 7:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1A check
  const handleCheckSYn = async () => {
    const current = sYnItems[sYnIdx];
    if (!current || !sYnSelected) return;
    try {
      const res = await apiJson("/phase-7/items/statement-vs-yn/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: sYnSelected })
      });
      setSYnCorrect(res.correct);
      setSYnChecked(true);
      setSYnExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextSYn = () => {
    setSYnSelected(null);
    setSYnChecked(false);
    setSYnCorrect(null);
    setSYnExplanation("");
    if (sYnIdx < sYnItems.length - 1) {
      setSYnIdx(prev => prev + 1);
    }
  };

  // Activity 1B check
  const handleCheckYnWh = async () => {
    const current = ynWhItems[ynWhIdx];
    if (!current || !ynWhSelectedYn || !ynWhSelectedWh) return;
    try {
      const res = await apiJson("/phase-7/items/yn-vs-wh/answer", {
        method: "POST",
        body: JSON.stringify({ 
          item_id: current.id, 
          selected_option: `${ynWhSelectedYn},${ynWhSelectedWh}` 
        })
      });
      setYnWhCorrect(res.correct);
      setYnWhChecked(true);
      setYnWhExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextYnWh = () => {
    setYnWhSelectedYn(null);
    setYnWhSelectedWh(null);
    setYnWhChecked(false);
    setYnWhCorrect(null);
    setYnWhExplanation("");
    if (ynWhIdx < ynWhItems.length - 1) {
      setYnWhIdx(prev => prev + 1);
    }
  };

  // Activity 1C check
  const handleCheckEl = async () => {
    const current = elItems[elIdx];
    if (!current || !elSelected) return;
    try {
      const res = await apiJson("/phase-7/items/emotion-listening/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: elSelected })
      });
      setElCorrect(res.correct);
      setElChecked(true);
      setElExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextEl = () => {
    setElSelected(null);
    setElChecked(false);
    setElCorrect(null);
    setElExplanation("");
    if (elIdx < elItems.length - 1) {
      setElIdx(prev => prev + 1);
    }
  };

  // Activity 2A Speak
  const handleRecordSq = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = sqDrills[sqIdx];
      try {
        const res = await apiJson("/phase-7/items/statement-question-speak/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: `${current.id}_${sqMode}`, audio_base64: "mock_data" })
        });
        setSqScore(res.score);
        setSqContour(res.pitch_contour);
        setSqFeedback(res.feedback);
        setSqEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleNextSq = () => {
    setSqScore(null);
    setSqContour("");
    setSqFeedback("");
    setSqEvaluated(false);
    setSqMode("statement");
    if (sqIdx < sqDrills.length - 1) {
      setSqIdx(prev => prev + 1);
    }
  };

  // Activity 2B Speak
  const handleRecordWq = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = wqDrills[wqIdx];
      try {
        const res = await apiJson("/phase-7/items/wh-yn-speak/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: current.id, audio_base64: "mock_data" })
        });
        setWqScore(res.score);
        setWqFeedback(res.feedback);
        setWqEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleNextWq = () => {
    setWqScore(null);
    setWqFeedback("");
    setWqEvaluated(false);
    if (wqIdx < wqDrills.length - 1) {
      setWqIdx(prev => prev + 1);
    }
  };

  // Activity 2C Speak
  const handleRecordEp = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = epItems[epIdx];
      try {
        const res = await apiJson("/phase-7/items/emotion-speak/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: current.id, audio_base64: "mock_data" })
        });
        setEpScore(res.score);
        setEpFeedback(res.feedback);
        setEpEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleNextEp = () => {
    setEpScore(null);
    setEpFeedback("");
    setEpEvaluated(false);
    if (epIdx < epItems.length - 1) {
      setEpIdx(prev => prev + 1);
    }
  };

  // Quiz flow
  const handleCheckQuizAnswer = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelected) return;
    try {
      const res = await apiJson("/phase-7/quiz/answer", {
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
        await apiJson("/phase-7/quiz/finish", {
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
      const res = await apiJson("/phase-7/homework/submit", {
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
      const res = await apiJson("/phase-7/complete", { method: "POST" });
      setCompletionData(res);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingLab(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col justify-between max-w-2xl mx-auto w-full font-sans">
      {/* Header bar */}
      <header className="border-b border-white/5 bg-zinc-900/60 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="font-extrabold text-lg">Intonation Lab</h2>
            <p className="text-xs text-zinc-400">Questions, Statements & Feelings (B1)</p>
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
            className="text-[10px] bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded transition cursor-pointer"
          >
            {showOutline ? "Hide Outline" : "View Outline"}
          </button>
        </div>
      </header>

      {/* Outline panel */}
      {showOutline && (
        <div className="w-full bg-zinc-900 border border-white/5 rounded-xl p-5 mb-6">
          <h3 className="font-bold text-zinc-200 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Intonation Lab Outline
          </h3>
          <ul className="text-sm text-zinc-300 space-y-2">
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 1 ? "bg-cyan-500" : "bg-slate-700"}`} />
              <span>Screen 1: Welcome & Phase Overview</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 2 ? "bg-teal-500" : "bg-slate-700"}`} />
              <span>Screen 2: Pitch Contours & Emotion Ranges</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 3 ? "bg-indigo-500" : "bg-slate-700"}`} />
              <span>Screen 3: Activity 1: Listen & Discriminate</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 4 ? "bg-purple-500" : "bg-slate-700"}`} />
              <span>Screen 4: Activity 2: Speaking Evaluation</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 5 ? "bg-pink-500" : "bg-slate-700"}`} />
              <span>Screen 5: Mini-Quiz: Intonation Mastery</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 6 ? "bg-emerald-500" : "bg-slate-700"}`} />
              <span>Screen 6: Homework & Final Completion</span>
            </li>
          </ul>
        </div>
      )}

      {/* SCREEN 1: WELCOME */}
      {step === 1 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center relative overflow-hidden">
          <div className="relative mx-auto w-fit">
            <div className="p-4 bg-cyan-500/10 rounded-full border border-cyan-500/25 text-cyan-400">
              <Volume2 className="w-10 h-10" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-brand-500 rounded-full border-2 border-zinc-950">
              <Sparkles className="w-3 h-3 text-white fill-white" />
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-black text-white font-sans">{metadata?.title || "Intonation Lab – Questions, Statements & Feelings (B1)"}</h2>
            <h3 className="text-md font-bold text-cyan-400 mt-1">{metadata?.subtitle || "Use pitch to show meaning and emotion."}</h3>
          </div>

          <p className="text-zinc-300 text-sm leading-relaxed max-w-md mx-auto">
            {metadata?.description || "In this lab, you’ll practise Korean intonation: how pitch rises and falls in statements and questions, and how to sound polite, surprised, or unsure without over‑doing it."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs space-y-2 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Focus Milestones:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Tell questions from statements by sentence‑final pitch",
                "Use a light rise for yes/no questions, and more neutral patterns for wh‑questions",
                "Copy emotional intonation (happy, annoyed, polite) in short sentences"
              ]).map((g: string, i: number) => <li key={i}>{g}</li>)}
            </ul>
            <p className="pt-2 text-zinc-400"><strong>⏱️ Est. Lab Time:</strong> 25 minutes</p>
            <p className="text-zinc-400"><strong>🔗 Prerequisites:</strong> {metadata?.dependencies || "Connected Speech Lab (Completed)"}</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
            {["B1", "Intonation", "Prosody", "Listening", "Speaking"].map(chip => (
              <span key={chip} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] text-cyan-300 font-bold">{chip}</span>
            ))}
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => setStep(2)} 
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-450 hover:to-cyan-450 text-zinc-950 font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 animate-pulse"
            >
              <Volume2 className="w-4 h-4" /> Start Intonation Lab
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: CONCEPT EXPLANATION */}
      {step === 2 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            Pitch Contours & Emotion
          </h2>

          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
              <h3 className="font-bold text-white mb-1">1. Question vs Statement Contours</h3>
              <p className="text-zinc-400">Korean sentences use pitch at the very end to mark grammatical differences:</p>
              <ul className="list-disc list-inside text-zinc-400 pl-1 space-y-1">
                <li><strong>Statements (오늘 바빠요 ↘):</strong> Flat or falling end (`flat-fall`).</li>
                <li><strong>Yes/No Questions (오늘 바빠요? ↗):</strong> Final rising pitch (`flat-rise`).</li>
                <li><strong>Wh-Questions (뭐 좋아해요? ↘):</strong> Since grammatical indicators like '뭐' (what) already show it's a question, the intonation falls like a statement!</li>
              </ul>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
              <h3 className="font-bold text-white">2. Emotional Pitch Ranges</h3>
              <p className="text-zinc-400">The shape and width of your pitch contour express attitude and feelings:</p>
              <ul className="list-disc list-inside text-zinc-400 pl-1 space-y-1">
                <li><strong>Neutral/Polite:</strong> Narrow pitch range, flat and controlled.</li>
                <li><strong>Happy/Excited:</strong> Higher starting pitch, wide rising final shape.</li>
                <li><strong>Annoyed/Irritated:</strong> Low starting pitch, flat and abrupt falling end.</li>
              </ul>
            </div>
          </div>

          {/* Interactive Examples */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200">Listen & Observe Contours:</h3>
            <div className="grid grid-cols-3 gap-2">
              <div 
                onClick={() => playAudio("오늘 바빠요")} 
                className="p-3 bg-zinc-900 border border-white/5 hover:border-cyan-500/30 transition rounded-xl text-center cursor-pointer"
              >
                <span className="block font-semibold text-zinc-300 text-xs">오늘 바빠요</span>
                <span className="text-[9px] text-zinc-500 block mt-1">Statement ↘</span>
              </div>
              <div 
                onClick={() => playAudio("오늘 바빠요?")} 
                className="p-3 bg-zinc-900 border border-white/5 hover:border-cyan-500/30 transition rounded-xl text-center cursor-pointer"
              >
                <span className="block font-semibold text-cyan-300 text-xs">오늘 바빠요?</span>
                <span className="text-[9px] text-cyan-500 block mt-1">Yes/No Q ↗</span>
              </div>
              <div 
                onClick={() => playAudio("뭐 좋아해요?")} 
                className="p-3 bg-zinc-900 border border-white/5 hover:border-cyan-500/30 transition rounded-xl text-center cursor-pointer"
              >
                <span className="block font-semibold text-teal-300 text-xs">뭐 좋아해요?</span>
                <span className="text-[9px] text-teal-500 block mt-1">Wh-Question ↘</span>
              </div>
            </div>

            {/* Emotion example */}
            {coreData?.emotion_examples?.[0] && (
              <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">Expression: "{coreData.emotion_examples[0].text}"</span>
                  <button onClick={() => playAudio(coreData.emotion_examples[0].text)} className="p-1 bg-zinc-950 rounded-full hover:bg-slate-800 text-cyan-400">
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[9px] text-zinc-400">
                  <div className="bg-zinc-950 p-2 rounded">
                    <span className="text-zinc-300 block font-bold">Neutral</span>
                    {coreData.emotion_examples[0].neutral}
                  </div>
                  <div className="bg-zinc-950 p-2 rounded">
                    <span className="text-cyan-300 block font-bold">Excited</span>
                    {coreData.emotion_examples[0].excited}
                  </div>
                  <div className="bg-zinc-950 p-2 rounded">
                    <span className="text-red-300 block font-bold">Annoyed</span>
                    {coreData.emotion_examples[0].annoyed}
                  </div>
                </div>
              </div>
            )}
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
              Proceed to Practice
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: ACTIVITY 1: LISTEN & DISCRIMINATE */}
      {step === 3 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 1: Listening & Discrimination
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Identify contours and emotions</h2>
          </div>

          {/* Activity 1A: Statement vs Yes/no question */}
          {sYnItems.length > 0 && !sYnChecked && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Statement vs Yes/No Question</span>
                <span>Drill {sYnIdx + 1} of {sYnItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-3 text-center">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Target Sentence:</span>
                <span className="text-lg font-extrabold text-white block">{sYnItems[sYnIdx]?.text}</span>

                <button 
                  onClick={() => playAudio(sYnItems[sYnIdx].text + (sYnItems[sYnIdx].type === "question" ? "?" : ""))}
                  className="py-2.5 px-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-xs text-cyan-300 rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Volume2 className="w-4 h-4" /> Listen to Audio
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-zinc-400 block font-bold">Is the final pitch rising (question) or falling (statement)?</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Statement", val: "statement" },
                    { label: "Yes/no question", val: "question" }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setSYnSelected(opt.val)}
                      className={`py-3 rounded-xl text-xs font-semibold border transition text-center ${
                        sYnSelected === opt.val 
                          ? "border-cyan-500 bg-cyan-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCheckSYn}
                  className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                  disabled={!sYnSelected}
                >
                  Verify Pitch Contour
                </button>
              </div>
            </div>
          )}

          {sYnChecked && sYnIdx <= sYnItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Statement vs Yes/No Question</span>
                <span>Drill {sYnIdx + 1} of {sYnItems.length}</span>
              </div>
              <div className={`p-4 rounded-xl border text-xs leading-relaxed ${sYnCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                <strong>{sYnCorrect ? "Correct!" : "Incorrect."}</strong> {sYnExplanation}
              </div>
              <div className="flex justify-end">
                {sYnIdx < sYnItems.length - 1 ? (
                  <button
                    onClick={handleNextSYn}
                    className="py-2 px-4 bg-cyan-505 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Drill
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSYnIdx(sYnItems.length); // trigger finished Part A
                    }}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-405 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                  >
                    Proceed to Part B
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 1B: YN vs WH */}
          {sYnIdx === sYnItems.length && ynWhItems.length > 0 && !ynWhChecked && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Yes/No vs Wh-Question Contours</span>
                <span>Drill {ynWhIdx + 1} of {ynWhItems.length}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-2 text-center">
                  <span className="text-[10px] text-zinc-400 font-bold block">Option 1 (Yes/No)</span>
                  <span className="text-sm font-extrabold text-white block">{ynWhItems[ynWhIdx]?.yn_text}</span>
                  <button 
                    onClick={() => playAudio(ynWhItems[ynWhIdx].yn_text)}
                    className="p-1.5 bg-zinc-950 hover:bg-slate-800 rounded-full text-cyan-400 cursor-pointer inline-flex items-center"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="space-y-1.5 pt-2">
                    {ynWhItems[ynWhIdx].options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => setYnWhSelectedYn(opt)}
                        className={`w-full py-1.5 rounded text-[10px] font-semibold border transition ${
                          ynWhSelectedYn === opt 
                            ? "border-cyan-500 bg-cyan-500/10 text-white" 
                            : "border-white/5 bg-zinc-950 text-zinc-400 hover:bg-slate-800"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-2 text-center">
                  <span className="text-[10px] text-zinc-400 font-bold block">Option 2 (Wh-Question)</span>
                  <span className="text-sm font-extrabold text-white block">{ynWhItems[ynWhIdx]?.wh_text}</span>
                  <button 
                    onClick={() => playAudio(ynWhItems[ynWhIdx].wh_text)}
                    className="p-1.5 bg-zinc-950 hover:bg-slate-800 rounded-full text-teal-400 cursor-pointer inline-flex items-center"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="space-y-1.5 pt-2">
                    {ynWhItems[ynWhIdx].options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => setYnWhSelectedWh(opt)}
                        className={`w-full py-1.5 rounded text-[10px] font-semibold border transition ${
                          ynWhSelectedWh === opt 
                            ? "border-teal-500 bg-teal-500/10 text-white" 
                            : "border-white/5 bg-zinc-950 text-zinc-400 hover:bg-slate-800"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCheckYnWh}
                  className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                  disabled={!ynWhSelectedYn || !ynWhSelectedWh}
                >
                  Verify Classifications
                </button>
              </div>
            </div>
          )}

          {ynWhChecked && ynWhIdx <= ynWhItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Yes/No vs Wh-Question Contours</span>
                <span>Drill {ynWhIdx + 1} of {ynWhItems.length}</span>
              </div>
              <div className="bg-green-950/20 border border-green-900 p-4 rounded-xl text-xs text-green-300 leading-relaxed">
                <strong>Correct!</strong> {ynWhExplanation}
              </div>
              <div className="flex justify-end">
                {ynWhIdx < ynWhItems.length - 1 ? (
                  <button
                    onClick={handleNextYnWh}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Drill
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setYnWhIdx(ynWhItems.length); // trigger finished Part B
                    }}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-405 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                  >
                    Proceed to Part C
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 1C: Emotion Listening */}
          {sYnIdx === sYnItems.length && ynWhIdx === ynWhItems.length && elItems.length > 0 && !elChecked && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Emotion Listening Guess</span>
                <span>Drill {elIdx + 1} of {elItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-3 text-center">
                <span className="text-[10px] text-zinc-550 block uppercase font-bold">Word/Phrase:</span>
                <span className="text-xl font-extrabold text-white block">{elItems[elIdx]?.sentence}</span>

                <button 
                  onClick={() => playAudio(elItems[elIdx].sentence)}
                  className="py-2.5 px-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-xs text-cyan-300 rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Volume2 className="w-4 h-4" /> Listen to Emotion Tone
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-zinc-400 block font-bold">Which emotion is expressed in the contour?</span>
                <div className="grid grid-cols-3 gap-2">
                  {elItems[elIdx].options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => setElSelected(opt)}
                      className={`py-2 px-1 rounded-xl text-[10px] font-semibold border transition text-center ${
                        elSelected === opt 
                          ? "border-cyan-500 bg-cyan-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-450 hover:bg-slate-800"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCheckEl}
                  className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                  disabled={!elSelected}
                >
                  Verify Emotion
                </button>
              </div>
            </div>
          )}

          {elChecked && elIdx <= elItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Emotion Listening Guess</span>
                <span>Drill {elIdx + 1} of {elItems.length}</span>
              </div>
              <div className={`p-4 rounded-xl border text-xs leading-relaxed ${elCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                <strong>{elCorrect ? "Correct!" : "Incorrect."}</strong> {elExplanation}
              </div>
              <div className="flex justify-end">
                {elIdx < elItems.length - 1 ? (
                  <button
                    onClick={handleNextEl}
                    className="py-2 px-4 bg-cyan-505 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Drill
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setStep(4);
                    }}
                    className="py-2.5 px-6 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-450 hover:to-cyan-450 text-zinc-950 font-bold rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    Proceed to Speaking Lab
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => {
                // reset part indicators if moving backwards
                setSYnIdx(0);
                setYnWhIdx(0);
                setElIdx(0);
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

      {/* SCREEN 4: ACTIVITY 2: SPEAKING EVALUATION */}
      {step === 4 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 2: Speaking Evaluation
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Record your voice & evaluate pitch shapes</h2>
          </div>

          {/* Activity 2A: Statement vs Question Mode speaking */}
          {sqDrills.length > 0 && !sqEvaluated && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Statement vs Question Mode Speak</span>
                <span>Drill {sqIdx + 1} of {sqDrills.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-2">
                <span className="text-[10px] text-zinc-500 font-mono block">Speak target sentence:</span>
                <span className="text-lg font-extrabold text-white block">
                  {sqDrills[sqIdx]?.sentence}{sqMode === "question" ? "?" : ""}
                </span>
                <span className="text-xs text-zinc-400 block font-bold">({sqDrills[sqIdx]?.translation})</span>

                <div className="flex justify-center gap-2 pt-2">
                  <button 
                    onClick={() => setSqMode("statement")}
                    className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition ${
                      sqMode === "statement" 
                        ? "bg-cyan-500 text-zinc-950" 
                        : "bg-zinc-950 text-zinc-400 border border-white/5"
                    }`}
                  >
                    Statement Mode (↘ Fall)
                  </button>
                  <button 
                    onClick={() => setSqMode("question")}
                    className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition ${
                      sqMode === "question" 
                        ? "bg-cyan-500 text-zinc-950" 
                        : "bg-zinc-950 text-zinc-400 border border-white/5"
                    }`}
                  >
                    Question Mode (↗ Rise)
                  </button>
                </div>
              </div>

              {/* Record UI */}
              <div className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                <button
                  onClick={handleRecordSq}
                  disabled={recording}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                    recording ? "bg-red-500 animate-pulse" : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <span className="text-[10px] text-zinc-400">
                  {recording ? "Recording... Keep speaking" : "Tap microphone to record & evaluate"}
                </span>
              </div>
            </div>
          )}

          {sqEvaluated && sqIdx <= sqDrills.length - 1 && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Statement vs Question Mode Speak</span>
                <span>Drill {sqIdx + 1} of {sqDrills.length}</span>
              </div>

              <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400 font-bold">Pitch Score:</span>
                  <span className="text-lg font-black text-green-400">{sqScore}%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Detected Contour Shape:</span>
                  <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded font-bold text-cyan-300 font-mono">
                    {sqContour}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-white/5">
                  <strong>Evaluator feedback:</strong> {sqFeedback}
                </p>
              </div>

              <div className="flex justify-end">
                {sqIdx < sqDrills.length - 1 ? (
                  <button
                    onClick={handleNextSq}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next sentence
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSqIdx(sqDrills.length); // trigger finished Part A
                    }}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-405 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                  >
                    Proceed to Part B
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2B: Wh vs YN Speak */}
          {sqIdx === sqDrills.length && wqDrills.length > 0 && !wqEvaluated && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Yes/No vs Wh-Question speaking contours</span>
                <span>Drill {wqIdx + 1} of {wqDrills.length}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-2">
                  <span className="text-[10px] text-zinc-400 font-bold block">1. Yes/No Question (↗ Rise)</span>
                  <span className="text-sm font-extrabold text-white block">{wqDrills[wqIdx]?.yn}</span>
                  <button 
                    onClick={() => playAudio(wqDrills[wqIdx].yn)}
                    className="p-1.5 bg-zinc-950 hover:bg-slate-800 rounded-full text-cyan-400 cursor-pointer inline-flex"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-2">
                  <span className="text-[10px] text-zinc-400 font-bold block">2. Wh-Question (↘ Fall)</span>
                  <span className="text-sm font-extrabold text-white block">{wqDrills[wqIdx]?.wh}</span>
                  <button 
                    onClick={() => playAudio(wqDrills[wqIdx].wh)}
                    className="p-1.5 bg-zinc-950 hover:bg-slate-800 rounded-full text-teal-400 cursor-pointer inline-flex"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Record UI */}
              <div className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                <button
                  onClick={handleRecordWq}
                  disabled={recording}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                    recording ? "bg-red-500 animate-pulse" : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <span className="text-[10px] text-zinc-400">
                  {recording ? "Recording... Keep speaking" : "Tap microphone to record & evaluate both questions"}
                </span>
              </div>
            </div>
          )}

          {wqEvaluated && wqIdx <= wqDrills.length - 1 && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Yes/No vs Wh-Question speaking contours</span>
                <span>Drill {wqIdx + 1} of {wqDrills.length}</span>
              </div>

              <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400 font-bold">Prosody score:</span>
                  <span className="text-lg font-black text-green-400">{wqScore}%</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-white/5">
                  <strong>Evaluator feedback:</strong> {wqFeedback}
                </p>
              </div>

              <div className="flex justify-end">
                {wqIdx < wqDrills.length - 1 ? (
                  <button
                    onClick={handleNextWq}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Pair
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setWqIdx(wqDrills.length); // trigger finished Part B
                    }}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-405 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                  >
                    Proceed to Part C
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2C: Emotion Speak */}
          {sqIdx === sqDrills.length && wqIdx === wqDrills.length && epItems.length > 0 && !epEvaluated && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Emotion copy shadowing</span>
                <span>Word {epIdx + 1} of {epItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-2">
                <span className="text-[10px] text-zinc-500 font-mono block">Shadow native speaker emotion:</span>
                <span className="text-2xl font-extrabold text-white block">"{epItems[epIdx]?.word}"</span>
                <button 
                  onClick={() => playAudio(epItems[epIdx].word)}
                  className="p-2 bg-zinc-950 hover:bg-slate-800 rounded-full text-cyan-450 cursor-pointer inline-flex"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Record UI */}
              <div className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                <button
                  onClick={handleRecordEp}
                  disabled={recording}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                    recording ? "bg-red-500 animate-pulse" : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <span className="text-[10px] text-zinc-400">
                  {recording ? "Recording... Keep speaking" : "Tap microphone to record & copy emotional pitch"}
                </span>
              </div>
            </div>
          )}

          {epEvaluated && epIdx <= epItems.length - 1 && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Emotion copy shadowing</span>
                <span>Word {epIdx + 1} of {epItems.length}</span>
              </div>

              <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400 font-bold">Emotion pitch score:</span>
                  <span className="text-lg font-black text-green-400">{epScore}%</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-white/5">
                  <strong>Evaluator feedback:</strong> {epFeedback}
                </p>
              </div>

              <div className="flex justify-end">
                {epIdx < epItems.length - 1 ? (
                  <button
                    onClick={handleNextEp}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Word
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setStep(5);
                    }}
                    className="py-2.5 px-6 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-450 hover:to-cyan-450 text-zinc-950 font-bold rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    Proceed to Quiz
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => {
                // reset part indicators if moving backwards
                setSqIdx(0);
                setWqIdx(0);
                setEpIdx(0);
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
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Intonation Lab Quiz
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Test your B1 Intonation skills</h2>
          </div>

          {quizScore === null ? (
            quizBlueprint.length > 0 ? (
              <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Question {quizIdx + 1} of {quizBlueprint.length}</span>
                  <span className="text-yellow-400 font-mono">{quizBlueprint[quizIdx]?.type}</span>
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
                    <strong>{quizCorrect ? "Correct!" : "Incorrect."}</strong> {quizExplanation}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  {!quizChecked ? (
                    <button
                      onClick={handleCheckQuizAnswer}
                      className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                      disabled={!quizSelected}
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuiz}
                      className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-405 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
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
                  {quizScore >= 80 ? "🎉 Outstanding! You passed the intonation check." : "Review the lessons and try again to improve your score."}
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
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Homework & Fluency Coach
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Perform routine recordings to log pitch habits</h2>
          </div>

          <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
            <div className="text-xs text-zinc-400 border-b border-white/5 pb-2 uppercase font-bold tracking-wider font-mono">
              Assigned Speaking Exercises
            </div>

            <div className="space-y-3">
              {homeworkItems.map((hw: any, idx: number) => (
                <div key={hw.id} className="bg-zinc-900 p-3.5 rounded-lg border border-white/5 space-y-2">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase font-mono block">Exercise {idx + 1}</span>
                  <span className="text-xs text-zinc-200 block">{hw.text}</span>
                  
                  <textarea
                    rows={2}
                    value={hwSents[idx] || ""}
                    onChange={(e) => handleHwChange(idx, e.target.value)}
                    placeholder="Type confirmation or notes on your voice logs..."
                    className="w-full bg-zinc-950 border border-white/5 focus:border-cyan-500/50 outline-none rounded p-2 text-xs text-zinc-300 resize-none"
                    disabled={hwFeedback !== null}
                  />
                </div>
              ))}
            </div>

            {hwFeedback && (
              <div className="bg-green-950/20 border border-green-900 p-4 rounded-xl text-xs text-green-300 leading-relaxed space-y-1">
                <span className="font-bold block">✓ Homework logged successfully</span>
                <p>{hwFeedback.feedback || "Your voice contour notes have been analyzed and added to your profile."}</p>
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
                    <>Submit Homework Logs</>
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
                    <>Complete Phase 7 & Graduate 🎉</>
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
    </div>
  );
}
