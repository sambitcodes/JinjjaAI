"use client";

import { useEffect, useState, useRef } from "react";
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
  Zap,
  Timer,
  Grid
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

interface Course8Phase10ReactionWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course8Phase10ReactionWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course8Phase10ReactionWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);

  // Loaded data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1A: Quick yes/no
  const [ynItems, setYnItems] = useState<any[]>([]);
  const [ynIdx, setYnIdx] = useState(0);
  const [ynCountdown, setYnCountdown] = useState(5);
  const [ynSelected, setYnSelected] = useState<string | null>(null);
  const [ynChecked, setYnChecked] = useState(false);
  const [ynCorrect, setYnCorrect] = useState<boolean | null>(null);
  const [ynExplanation, setYnExplanation] = useState("");
  const [ynResponseTime, setYnResponseTime] = useState<number>(0);
  const ynTimerRef = useRef<any>(null);
  const ynStartTimeRef = useRef<number>(0);

  // Activity 1B: Choose the best response
  const [brItems, setBrItems] = useState<any[]>([]);
  const [brIdx, setBrIdx] = useState(0);
  const [brSelected, setBrSelected] = useState<string | null>(null);
  const [brChecked, setBrChecked] = useState(false);
  const [brCorrect, setBrCorrect] = useState<boolean | null>(null);
  const [brExplanation, setBrExplanation] = useState("");

  // Activity 1C: Reaction bingo
  const [bingoItems, setBingoItems] = useState<any[]>([]);
  const [bingoIdx, setBingoIdx] = useState(0);
  const [bingoPromptIdx, setBingoPromptIdx] = useState(0);
  const [bingoChecked, setBingoChecked] = useState(false);
  const [bingoScore, setBingoScore] = useState<number>(0);
  const [bingoReactionTimes, setBingoReactionTimes] = useState<number[]>([]);
  const bingoGrid = ["네, 좋아요", "글쎄요…", "잘 모르겠어요", "괜찮아요"];
  const bingoStartTimeRef = useRef<number>(0);

  // Activity 2A: 1-second prep answers
  const [faItems, setFaItems] = useState<any[]>([]);
  const [faIdx, setFaIdx] = useState(0);
  const [faPrepCountdown, setFaPrepCountdown] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [faEvaluated, setFaEvaluated] = useState(false);
  const [faScore, setFaScore] = useState<number | null>(null);
  const [faLatency, setFaLatency] = useState("");
  const [faFeedback, setFaFeedback] = useState("");

  // Activity 2B: Speed conversation rounds
  const [speedRoundData, setSpeedRoundData] = useState<any>(null);
  const [speedRoundTurns, setSpeedRoundTurns] = useState<any[]>([]);
  const [speedRoundFinished, setSpeedRoundFinished] = useState(false);
  const [speedRoundLoading, setSpeedRoundLoading] = useState(false);
  const [speedRoundSummary, setSpeedRoundSummary] = useState<any>(null);

  // Activity 2C: Quick rephrasing / clarification
  const [clItems, setClItems] = useState<any[]>([]);
  const [clIdx, setClIdx] = useState(0);
  const [clEvaluated, setClEvaluated] = useState(false);
  const [clScore, setClScore] = useState<number | null>(null);
  const [clFeedback, setClFeedback] = useState("");

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

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/10/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/10/core-data");
          setCoreData(res);
        } else if (step === 3) {
          if (ynItems.length === 0) {
            const resYn = await apiJson("/phase-10/items/quick-yesno");
            setYnItems(resYn);
          }
          if (brItems.length === 0) {
            const resBr = await apiJson("/phase-10/items/best-response");
            setBrItems(resBr);
          }
          if (bingoItems.length === 0) {
            const resBingo = await apiJson("/phase-10/items/reaction-bingo");
            setBingoItems(resBingo);
          }
        } else if (step === 4) {
          if (faItems.length === 0) {
            const resFa = await apiJson("/phase-10/items/fast-answers");
            setFaItems(resFa);
          }
          if (clItems.length === 0) {
            const resCl = await apiJson("/phase-10/items/clarification");
            setClItems(resCl);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/phase-10/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-10/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading PLS Lab Phase 10:", err);
      }
    };
    load();
  }, [step]);

  // Clean timer refs
  useEffect(() => {
    return () => {
      if (ynTimerRef.current) clearInterval(ynTimerRef.current);
    };
  }, []);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1A start timer
  const handleStartYnPrompt = () => {
    const current = ynItems[ynIdx];
    if (!current) return;
    playAudio(current.prompt);
    setYnSelected(null);
    setYnChecked(false);
    setYnCountdown(5);
    ynStartTimeRef.current = Date.now();
    
    if (ynTimerRef.current) clearInterval(ynTimerRef.current);
    ynTimerRef.current = setInterval(() => {
      setYnCountdown(prev => {
        if (prev <= 1) {
          clearInterval(ynTimerRef.current);
          handleCheckYn(true); // timed out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCheckYn = async (timedOut = false, opt: string | null = null) => {
    clearInterval(ynTimerRef.current);
    const endTime = Date.now();
    const latency = timedOut ? 5000 : endTime - ynStartTimeRef.current;
    setYnResponseTime(latency);

    const current = ynItems[ynIdx];
    if (!current) return;

    const selected = opt || "timeout";
    setYnSelected(selected);

    try {
      const res = await apiJson("/phase-10/items/quick-yesno/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: selected })
      });
      setYnCorrect(res.correct);
      setYnChecked(true);
      setYnExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextYn = () => {
    setYnChecked(false);
    setYnSelected(null);
    setYnExplanation("");
    if (ynIdx < ynItems.length - 1) {
      setYnIdx(prev => prev + 1);
    }
  };

  // Activity 1B check
  const handleCheckBr = async () => {
    const current = brItems[brIdx];
    if (!current || !brSelected) return;
    try {
      const res = await apiJson("/phase-10/items/best-response/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: brSelected })
      });
      setBrCorrect(res.correct);
      setBrChecked(true);
      setBrExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextBr = () => {
    setBrSelected(null);
    setBrChecked(false);
    setBrExplanation("");
    if (brIdx < brItems.length - 1) {
      setBrIdx(prev => prev + 1);
    }
  };

  // Activity 1C Bingo click
  const handleStartBingo = () => {
    setBingoPromptIdx(0);
    setBingoScore(0);
    setBingoReactionTimes([]);
    setBingoChecked(false);
    playBingoPrompt(0);
  };

  const playBingoPrompt = (idx: number) => {
    const seq = bingoItems[bingoIdx]?.prompts_sequence;
    if (!seq || !seq[idx]) return;
    playAudio(seq[idx].prompt);
    bingoStartTimeRef.current = Date.now();
  };

  const handleSelectBingoGrid = async (cell: string) => {
    const seq = bingoItems[bingoIdx]?.prompts_sequence;
    if (!seq || !seq[bingoPromptIdx] || bingoChecked) return;

    const latency = Date.now() - bingoStartTimeRef.current;
    setBingoReactionTimes(prev => [...prev, latency]);

    const isCorrect = cell === seq[bingoPromptIdx].correct_grid_answer;
    if (isCorrect) {
      setBingoScore(prev => prev + 1);
    }

    if (bingoPromptIdx < seq.length - 1) {
      const nextIdx = bingoPromptIdx + 1;
      setBingoPromptIdx(nextIdx);
      playBingoPrompt(nextIdx);
    } else {
      try {
        await apiJson("/phase-10/items/reaction-bingo/answer", {
          method: "POST",
          body: JSON.stringify({ item_id: bingoItems[bingoIdx].id, selected_option: "completed" })
        });
        setBingoChecked(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Activity 2A Spoken countdown
  const handleStartFaDrill = () => {
    const current = faItems[faIdx];
    if (!current) return;
    playAudio(current.question);
    
    // start 2s countdown before recording
    setFaPrepCountdown(2);
    const interval = setInterval(() => {
      setFaPrepCountdown(prev => {
        if (prev !== null && prev <= 1) {
          clearInterval(interval);
          setFaPrepCountdown(null);
          handleRecordFa();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const handleRecordFa = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = faItems[faIdx];
      try {
        const res = await apiJson("/phase-10/items/fast-answers/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: current.id, audio_base64: "mock_data" })
        });
        setFaScore(res.score);
        setFaLatency(res.latency);
        setFaFeedback(res.feedback);
        setFaEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 4500);
  };

  const handleNextFa = () => {
    setFaScore(null);
    setFaLatency("");
    setFaFeedback("");
    setFaEvaluated(false);
    if (faIdx < faItems.length - 1) {
      setFaIdx(prev => prev + 1);
    }
  };

  // Activity 2B Speed conversation
  const handleStartSpeedRound = async () => {
    setSpeedRoundLoading(true);
    try {
      const res = await apiJson("/phase-10/speed-round/start", { method: "POST" });
      setSpeedRoundData(res);
      setSpeedRoundTurns([{ speaker: "partner", text: res.partner_line, prompt: res.prompt }]);
      setSpeedRoundFinished(false);
      setSpeedRoundSummary(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSpeedRoundLoading(false);
    }
  };

  const handleRecordSpeedTurn = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      try {
        const res = await apiJson("/phase-10/speed-round/turn", {
          method: "POST",
          body: JSON.stringify({ item_id: speedRoundData?.round_id, audio_base64: "mock_data" })
        });
        setSpeedRoundTurns(prev => [
          ...prev,
          { speaker: "user", text: "(Quick response recorded)" },
          { speaker: "partner", text: res.partner_line, prompt: res.prompt }
        ]);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleFinishSpeedRound = async () => {
    setSpeedRoundLoading(true);
    try {
      const res = await apiJson("/phase-10/speed-round/finish", { method: "POST" });
      setSpeedRoundSummary(res);
      setSpeedRoundFinished(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSpeedRoundLoading(false);
    }
  };

  // Activity 2C clarification check
  const handleRecordCl = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = clItems[clIdx];
      try {
        const res = await apiJson("/phase-10/items/clarification/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: current.id, audio_base64: "mock_data" })
        });
        setClScore(res.score);
        setClFeedback(res.feedback);
        setClEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 3000);
  };

  const handleNextCl = () => {
    setClScore(null);
    setClFeedback("");
    setClEvaluated(false);
    if (clIdx < clItems.length - 1) {
      setClIdx(prev => prev + 1);
    }
  };

  // Quiz flow
  const handleCheckQuizAnswer = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelected) return;
    try {
      const res = await apiJson("/phase-10/quiz/answer", {
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
        await apiJson("/phase-10/quiz/finish", {
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
      const res = await apiJson("/phase-10/homework/submit", {
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
      await apiJson("/phase-10/complete", { method: "POST" });
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
            <h2 className="font-extrabold text-lg">Reaction Lab</h2>
            <p className="text-xs text-zinc-400">Listen & Respond Fast (B1)</p>
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
        <div className="w-full bg-zinc-900 border border-white/5 rounded-xl p-5 mb-6 animate-fade-in">
          <h3 className="font-bold text-zinc-200 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Reaction Lab Outline
          </h3>
          <ul className="text-sm text-zinc-300 space-y-2">
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 1 ? "bg-cyan-500" : "bg-slate-700"}`} />
              <span>Screen 1: Welcome & Phase Overview</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 2 ? "bg-teal-500" : "bg-slate-700"}`} />
              <span>Screen 2: Immediate Response Skills</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 3 ? "bg-indigo-500" : "bg-slate-700"}`} />
              <span>Screen 3: Activity 1: Click Reactions & Bingo</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 4 ? "bg-purple-500" : "bg-slate-700"}`} />
              <span>Screen 4: Activity 2: Fast Spoken Drills</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 5 ? "bg-pink-500" : "bg-slate-700"}`} />
              <span>Screen 5: Mini-Quiz: Speed & Pragmatics</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 6 ? "bg-emerald-500" : "bg-slate-700"}`} />
              <span>Screen 6: Homework & Response Latency Coach</span>
            </li>
          </ul>
        </div>
      )}

      {/* SCREEN 1: WELCOME */}
      {step === 1 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center relative overflow-hidden">
          <div className="relative mx-auto w-fit">
            <div className="p-4 bg-cyan-500/10 rounded-full border border-cyan-500/25 text-cyan-400">
              <Zap className="w-10 h-10" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-brand-500 rounded-full border-2 border-zinc-950">
              <Sparkles className="w-3 h-3 text-white fill-white" />
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-black text-white font-sans">{metadata?.title || "Reaction Lab – Listen & Respond Fast (B1)"}</h2>
            <h3 className="text-md font-bold text-cyan-400 mt-1">{metadata?.subtitle || "Answer quickly and naturally."}</h3>
          </div>

          <p className="text-zinc-300 text-sm leading-relaxed max-w-md mx-auto">
            {metadata?.description || "In this lab, you’ll practise listening to short prompts and responding quickly with simple, clear Korean—just like in real conversations at B1 level."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs space-y-2 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Focus Milestones:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Hear short questions and statements on familiar topics",
                "Choose or say a quick, appropriate response",
                "Build automaticity so you don’t translate in your head"
              ]).map((g: string, i: number) => <li key={i}>{g}</li>)}
            </ul>
            <p className="pt-2 text-zinc-400"><strong>⏱️ Est. Lab Time:</strong> 25 minutes</p>
            <p className="text-zinc-400"><strong>🔗 Prerequisites:</strong> {metadata?.dependencies || "Gist & Detail Lab (Completed)"}</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
            {["B1", "Listening", "Speaking", "Fast reaction"].map(chip => (
              <span key={chip} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] text-cyan-300 font-bold">{chip}</span>
            ))}
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => setStep(2)} 
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-450 hover:to-cyan-455 text-zinc-955 font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-4 h-4" /> Start Reaction Lab
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: CONCEPT EXPLANATION */}
      {step === 2 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            Immediate Response Skills
          </h2>

          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
            {/* Speed block */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1">
              <h3 className="font-bold text-white mb-1">1. B1 Interaction = Fast Enough</h3>
              <p className="text-zinc-400">Conversing without long pauses (ideally under 2 seconds latency) keeps conversations active. This requires mapping questions directly into response gambits without translating into your native language first.</p>
            </div>

            {/* Prompt types list */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
              <h3 className="font-bold text-white mb-1">2. Types of Prompts</h3>
              <ul className="list-disc list-inside text-zinc-400 pl-1 space-y-1">
                <li><strong>Yes/No checks (지금 가요?):</strong> Agree or deny instantly (네, 가요 / 아니요).</li>
                <li><strong>Choice prompts (커피? 차?):</strong> Select one (커피 주세요).</li>
                <li><strong>Open questions (주말에 뭐 해요?):</strong> Add one details block (등산 갈 거예요).</li>
                <li><strong>Requests (도와줄래요?):</strong> Acknowledge and accept (네, 도와줄게요).</li>
              </ul>
            </div>

            {/* Response diagram */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
              <h3 className="font-bold text-white mb-1">3. Listen → Decide → Respond</h3>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                <div className="bg-zinc-900 border border-white/5 p-2 rounded text-cyan-300">
                  Step 1: Classify
                  <span className="block font-normal text-zinc-400 mt-1">Recognize question vs request type</span>
                </div>
                <div className="bg-zinc-900 border border-white/5 p-2 rounded text-teal-300">
                  Step 2: Gambit
                  <span className="block font-normal text-zinc-400 mt-1">Pick quick prefix (네 / 글쎄요)</span>
                </div>
                <div className="bg-zinc-900 border border-white/5 p-2 rounded text-indigo-300">
                  Step 3: Detail
                  <span className="block font-normal text-zinc-400 mt-1">Formulate one simple clause</span>
                </div>
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
              Proceed to Click Drills
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: ACTIVITY 1: CLICK REACTIONS */}
      {step === 3 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 1: Fast Listening & Click Responses
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Answer immediately under ticking countdown limits</h2>
          </div>

          {/* Activity 1A: Quick yes/no */}
          {ynItems.length > 0 && !ynChecked && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Quick Yes/No Reaction</span>
                <span>Drill {ynIdx + 1} of {ynItems.length}</span>
              </div>

              <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-xl border border-white/5">
                <button
                  onClick={handleStartYnPrompt}
                  className="py-2 px-4 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4" /> Play & Start Timer
                </button>

                <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-400 font-mono bg-zinc-950 px-3 py-1.5 rounded-lg border border-white/5">
                  <Timer className="w-4 h-4" />
                  <span>{ynCountdown}s Remaining</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-zinc-400 block font-bold">Select your immediate reaction:</span>
                <div className="grid grid-cols-2 gap-2">
                  {ynItems[ynIdx].options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => handleCheckYn(false, opt)}
                      className={`py-3.5 rounded-xl text-xs font-semibold border transition text-center ${
                        ynSelected === opt 
                          ? "border-cyan-500 bg-cyan-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {ynChecked && ynIdx <= ynItems.length - 1 && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Quick Yes/No Reaction</span>
                <span>Drill {ynIdx + 1} of {ynItems.length}</span>
              </div>
              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 flex items-center justify-between text-xs font-bold font-mono">
                <span className="text-zinc-455">Your Reaction Speed:</span>
                <span className="text-cyan-300">{(ynResponseTime / 1000).toFixed(2)} seconds</span>
              </div>
              <div className={`p-4 rounded-xl border text-xs leading-relaxed ${ynCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                <strong>{ynCorrect ? "Correct!" : "Incorrect."}</strong> {ynExplanation}
              </div>
              <div className="flex justify-end">
                {ynIdx < ynItems.length - 1 ? (
                  <button
                    onClick={handleNextYn}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Drill
                  </button>
                ) : (
                  <button
                    onClick={() => setYnIdx(ynItems.length)} // Move past Part A
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-405 text-xs font-bold rounded-lg text-zinc-955 transition cursor-pointer"
                  >
                    Proceed to Part B
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 1B: Choose the best response */}
          {ynIdx === ynItems.length && brItems.length > 0 && !brChecked && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Choose the Best Pragmatic Response</span>
                <span>Drill {brIdx + 1} of {brItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-3">
                <button
                  onClick={() => playAudio(brItems[brIdx].prompt)}
                  className="py-2.5 px-5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs rounded-lg cursor-pointer inline-flex items-center gap-2"
                >
                  <Volume2 className="w-4.5 h-4.5" /> Play Prompt Audio
                </button>
              </div>

              <div className="space-y-2">
                {brItems[brIdx].options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => setBrSelected(opt)}
                    className={`w-full text-left p-3.5 rounded-xl text-xs border transition ${
                      brSelected === opt 
                        ? "border-cyan-500 bg-cyan-500/10 text-white font-bold" 
                        : "border-white/5 bg-zinc-900 text-zinc-400 hover:bg-slate-800"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCheckBr}
                  className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-455 text-zinc-955 text-xs font-bold rounded-lg transition cursor-pointer"
                  disabled={!brSelected}
                >
                  Verify Response
                </button>
              </div>
            </div>
          )}

          {brChecked && brIdx <= brItems.length - 1 && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Choose the Best Pragmatic Response</span>
                <span>Drill {brIdx + 1} of {brItems.length}</span>
              </div>
              <div className={`p-4 rounded-xl border text-xs leading-relaxed ${brCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                <strong>{brCorrect ? "Correct!" : "Incorrect."}</strong> {brExplanation}
              </div>
              <div className="flex justify-end">
                {brIdx < brItems.length - 1 ? (
                  <button
                    onClick={handleNextBr}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Prompt
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setBrIdx(brItems.length); // Move past Part B
                      handleStartBingo(); // Initialize Part C
                    }}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-405 text-xs font-bold rounded-lg text-zinc-955 transition cursor-pointer"
                  >
                    Proceed to Part C
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 1C: Reaction Bingo */}
          {ynIdx === ynItems.length && brIdx === brItems.length && bingoItems.length > 0 && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Reaction Bingo Speed Grid</span>
                <span>Bingo {bingoIdx + 1} of {bingoItems.length}</span>
              </div>

              {!bingoChecked ? (
                <div className="space-y-4">
                  <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-2">
                    <span className="text-[10px] text-zinc-550 block font-bold uppercase">Bingo Prompt {bingoPromptIdx + 1} of 3:</span>
                    <button
                      onClick={() => playBingoPrompt(bingoPromptIdx)}
                      className="py-1 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-[10px] font-bold text-cyan-300 rounded cursor-pointer"
                    >
                      Replay Prompt Audio
                    </button>
                  </div>

                  <span className="text-xs text-zinc-400 block font-bold text-center">Click the most appropriate grid cell instantly:</span>
                  <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                    {bingoGrid.map((cell) => (
                      <button
                        key={cell}
                        onClick={() => handleSelectBingoGrid(cell)}
                        className="p-5 bg-zinc-900 hover:bg-slate-800 active:bg-cyan-500/20 border border-white/5 hover:border-cyan-500/30 text-xs font-bold rounded-2xl text-zinc-200 transition text-center cursor-pointer min-h-[70px]"
                      >
                        {cell}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold font-mono">
                      <span className="text-zinc-450">Grid Accuracy:</span>
                      <span className="text-green-400">{bingoScore} / 3 Correct</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold font-mono">
                      <span className="text-zinc-455">Avg Reaction Latency:</span>
                      <span className="text-cyan-300">
                        {(bingoReactionTimes.reduce((a, b) => a + b, 0) / bingoReactionTimes.length / 1000).toFixed(2)}s
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    {bingoIdx < bingoItems.length - 1 ? (
                      <button
                        onClick={() => {
                          setBingoIdx(prev => prev + 1);
                          handleStartBingo();
                        }}
                        className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                      >
                        Next Bingo Grid
                      </button>
                    ) : (
                      <button
                        onClick={() => setStep(4)} // Proceed to speaking drills
                        className="py-2.5 px-6 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-450 hover:to-cyan-450 text-zinc-955 font-bold rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/20"
                      >
                        Proceed to Spoken Reactions
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => {
                setYnIdx(0);
                setBrIdx(0);
                setBingoIdx(0);
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

      {/* SCREEN 4: ACTIVITY 2: SPOKEN REACTIONS */}
      {step === 4 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 2: Fast Spoken Response Lab
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Record answers on the fly with minimal preparation</h2>
          </div>

          {/* Part A: 1-second prep answers */}
          {faItems.length > 0 && !faEvaluated && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: 1-Second Prep answers</span>
                <span>Drill {faIdx + 1} of {faItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-2 relative overflow-hidden min-h-[120px] flex flex-col justify-center">
                {faPrepCountdown === null ? (
                  <>
                    <span className="text-[10px] text-zinc-555 font-mono block">Speak your answer:</span>
                    <span className="text-xl font-extrabold text-white block">"{faItems[faIdx].question}"</span>
                    <span className="text-xs text-zinc-400 block font-semibold">({faItems[faIdx].translation})</span>
                    
                    <button 
                      onClick={handleStartFaDrill}
                      className="py-1.5 px-4 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5 w-fit mx-auto mt-2"
                    >
                      <Zap className="w-3.5 h-3.5" /> Start Countdown & Answer
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase">Preparation Time:</span>
                    <span className="text-3xl font-black text-yellow-400 animate-pulse">{faPrepCountdown}s</span>
                  </div>
                )}
              </div>

              {recording && (
                <div className="flex flex-col items-center justify-center p-3 bg-zinc-900 border border-white/5 rounded-xl space-y-1.5">
                  <Mic className="w-6 h-6 text-red-500 animate-pulse" />
                  <span className="text-[10px] text-zinc-400">Recording... Speak your answer now!</span>
                </div>
              )}
            </div>
          )}

          {faEvaluated && faIdx <= faItems.length - 1 && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: 1-Second Prep answers</span>
                <span>Drill {faIdx + 1} of {faItems.length}</span>
              </div>

              <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-450 font-bold">Speech Clarity:</span>
                  <span className="text-green-400 font-bold">{faScore}%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-455 font-mono">Response Speed:</span>
                  <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-300 font-bold">{faLatency}</span>
                </div>
                <p className="text-xs text-zinc-350 bg-zinc-950 p-3 rounded-lg border border-white/5 leading-relaxed">
                  <strong>Coach feedback:</strong> {faFeedback}
                </p>
              </div>

              <div className="flex justify-end">
                {faIdx < faItems.length - 1 ? (
                  <button
                    onClick={handleNextFa}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setFaIdx(faItems.length); // Move past Part A
                      handleStartSpeedRound(); // Preload Part B
                    }}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-405 text-xs font-bold rounded-lg text-zinc-955 transition cursor-pointer"
                  >
                    Proceed to Part B
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Part B: Speed conversation rounds */}
          {faIdx === faItems.length && (clItems.length > 0 && !clEvaluated) && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Speed Conversation Rounds</span>
                <span>Topic Interaction</span>
              </div>

              {speedRoundLoading && speedRoundTurns.length === 0 ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Chat interface */}
                  <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-3 max-h-[180px] overflow-y-auto">
                    {speedRoundTurns.map((turn, tIdx) => (
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
                          {turn.prompt && <p className="text-[9px] text-cyan-300 font-semibold mt-1">⚡ Speed goal: {turn.prompt}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!speedRoundFinished ? (
                    <div className="space-y-3">
                      <div className="flex flex-col items-center justify-center p-3 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                        <button
                          onClick={handleRecordSpeedTurn}
                          disabled={recording || speedRoundLoading}
                          className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
                            recording ? "bg-red-500 animate-pulse" : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                          }`}
                        >
                          <Mic className="w-4.5 h-4.5" />
                        </button>
                        <span className="text-[9px] text-zinc-450">
                          {recording ? "Recording..." : "Tap mic to reply within 20s"}
                        </span>
                      </div>

                      {speedRoundTurns.length >= 3 && (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={handleFinishSpeedRound}
                            disabled={speedRoundLoading}
                            className="py-2 px-5 bg-cyan-500 hover:bg-cyan-455 text-zinc-955 text-xs font-bold rounded-lg transition cursor-pointer"
                          >
                            Finish & Evaluate speed
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 animate-fade-in">
                      <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold font-mono">
                          <span className="text-zinc-450">Speed Interaction Score:</span>
                          <span className="text-green-400">{speedRoundSummary?.overall_score}%</span>
                        </div>
                        <p className="text-xs text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-white/5 leading-relaxed">
                          <strong>ASR Speed Coach:</strong> {speedRoundSummary?.feedback}
                        </p>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleStartSpeedRound}
                          className="py-2 px-4 border border-white/10 hover:bg-zinc-800 text-xs font-bold rounded-lg text-zinc-350 transition cursor-pointer"
                        >
                          Restart speed round
                        </button>
                        <button
                          onClick={() => setClIdx(0)} // Trigger Part C rephrasing
                          className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-405 text-zinc-955 font-bold rounded-xl transition cursor-pointer"
                        >
                          Proceed to Part C
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Part C: Quick rephrasing / clarification */}
          {faIdx === faItems.length && clItems.length > 0 && !clEvaluated && speedRoundFinished && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Quick rephrasing & clarification</span>
                <span>Utterance {clIdx + 1} of {clItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="text-[10px] text-zinc-550 block font-bold uppercase text-center">Listen to longer prompt:</span>
                <p className="text-xs text-white font-extrabold text-center leading-relaxed font-mono">"{clItems[clIdx].utterance}"</p>
                <div className="flex justify-center">
                  <button 
                    onClick={() => playAudio(clItems[clIdx].utterance)}
                    className="p-1.5 bg-zinc-950 hover:bg-slate-800 rounded-full text-cyan-400 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded text-[10px] text-cyan-300 leading-normal font-sans">
                  💡 <strong>Goal:</strong> {clItems[clIdx].instruction}
                </div>
              </div>

              {/* Record UI */}
              <div className="flex flex-col items-center justify-center p-3 bg-zinc-900 border border-white/5 rounded-xl space-y-1.5">
                <button
                  onClick={handleRecordCl}
                  disabled={recording}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
                    recording ? "bg-red-500 animate-pulse" : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  }`}
                >
                  <Mic className="w-4.5 h-4.5" />
                </button>
                <span className="text-[9px] text-zinc-400">
                  {recording ? "Recording response..." : "Tap mic to record rephrasing / clarification"}
                </span>
              </div>
            </div>
          )}

          {clEvaluated && clIdx <= clItems.length - 1 && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Quick rephrasing & clarification</span>
                <span>Utterance {clIdx + 1} of {clItems.length}</span>
              </div>

              <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-zinc-450">Clarification Score:</span>
                  <span className="text-green-400">{clScore}%</span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded text-[10px] text-zinc-400 leading-normal space-y-1">
                  <strong>Suggested rephrasing:</strong>
                  <p className="font-bold text-white font-mono">{clItems[clIdx].model_clarification}</p>
                </div>
                <p className="text-xs text-zinc-350 bg-zinc-950 p-3 rounded-lg border border-white/5 leading-relaxed font-sans">
                  <strong>ASR check feedback:</strong> {clFeedback}
                </p>
              </div>

              <div className="flex justify-end">
                {clIdx < clItems.length - 1 ? (
                  <button
                    onClick={handleNextCl}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Prompt
                  </button>
                ) : (
                  <button
                    onClick={() => setStep(5)} // Move to quiz
                    className="py-2.5 px-6 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-450 hover:to-cyan-455 text-zinc-955 font-bold rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/20"
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
                setFaIdx(0);
                setSpeedRoundTurns([]);
                setSpeedRoundFinished(false);
                setClIdx(0);
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
              Reaction Speed Mini-Quiz
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Evaluate B1 pragmatic reaction speed</h2>
          </div>

          {quizScore === null ? (
            quizBlueprint.length > 0 ? (
              <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4">
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
                          : "border-white/5 bg-zinc-900 text-zinc-450 hover:bg-slate-800"
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
                      className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-455 text-zinc-955 text-xs font-bold rounded-lg transition cursor-pointer"
                      disabled={!quizSelected}
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuiz}
                      className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-405 text-zinc-955 text-xs font-bold rounded-lg transition cursor-pointer"
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
                  {quizScore >= 80 ? "🎉 Superb! You have high conversational response speed." : "Review response triggers and try again to reduce pause latency."}
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
                    className="py-2 px-5 bg-cyan-500 hover:bg-cyan-455 text-zinc-955 text-xs font-bold rounded-lg transition cursor-pointer"
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
              Homework & Response Speed Coach
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Log your speed-reaction drills and logs</h2>
          </div>

          <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4">
            <div className="text-xs text-zinc-400 border-b border-white/5 pb-2 uppercase font-bold tracking-wider font-mono">
              Assigned Speaking Drills
            </div>

            <div className="space-y-3">
              {homeworkItems.map((hw: any, idx: number) => (
                <div key={hw.id} className="bg-zinc-900 p-3.5 rounded-lg border border-white/5 space-y-2">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase font-mono block">Exercise {idx + 1}</span>
                  <span className="text-xs text-zinc-250 block">{hw.text}</span>
                  
                  <textarea
                    rows={2}
                    value={hwSents[idx] || ""}
                    onChange={(e) => handleHwChange(idx, e.target.value)}
                    placeholder="Enter details of your speed reflection log..."
                    className="w-full bg-zinc-955 border border-white/5 focus:border-cyan-500/50 outline-none rounded p-2 text-xs text-zinc-300 resize-none font-sans"
                    disabled={hwFeedback !== null}
                  />
                </div>
              ))}
            </div>

            {hwFeedback && (
              <div className="bg-green-950/20 border border-green-900 p-4 rounded-xl text-xs text-green-300 leading-relaxed space-y-2">
                <span className="font-bold block">✓ Response latency check complete</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-center bg-zinc-950/60 p-2 rounded">
                  <div>
                    <span className="text-zinc-550 block">Status</span>
                    {hwFeedback.latency_status}
                  </div>
                  <div>
                    <span className="text-zinc-550 block">Average Latency</span>
                    {hwFeedback.overall_latency_sec}s
                  </div>
                </div>
                <p>{hwFeedback.feedback || "Your reaction drill logs have been successfully logged."}</p>
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
                    <>Complete Phase 10 & Graduate 🎉</>
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
