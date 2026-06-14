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
  Clock
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

interface Course8Phase3RhythmWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course8Phase3RhythmWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course8Phase3RhythmWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);

  // Loaded data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1A: Rhythm compare
  const [rcItems, setRcItems] = useState<any[]>([]);
  const [rcIdx, setRcIdx] = useState(0);
  const [rcSelected, setRcSelected] = useState<string | null>(null);
  const [rcChecked, setRcChecked] = useState(false);
  const [rcCorrect, setRcCorrect] = useState<boolean | null>(null);
  const [rcExplanation, setRcExplanation] = useState("");

  // Activity 1B: Beat Tapper
  const [btItems, setBtItems] = useState<any[]>([]);
  const [btIdx, setBtIdx] = useState(0);
  const [taps, setTaps] = useState<number[]>([]);
  const [tappingActive, setTappingActive] = useState(false);
  const [btEvaluated, setBtEvaluated] = useState(false);
  const [btScore, setBtScore] = useState<number | null>(null);
  const [btFeedback, setBtFeedback] = useState("");
  const startTimeRef = useRef<number | null>(null);

  // Activity 1C: Find Chunk Breaks
  const [ckItems, setCkItems] = useState<any[]>([]);
  const [ckIdx, setCkIdx] = useState(0);
  const [ckSelected, setCkSelected] = useState<string | null>(null);
  const [ckChecked, setCkChecked] = useState(false);
  const [ckCorrect, setCkCorrect] = useState<boolean | null>(null);
  const [ckRecommendation, setCkRecommendation] = useState("");

  // Activity 2A: Metronome Words
  const [mwItems, setMwItems] = useState<any[]>([]);
  const [mwIdx, setMwIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [metronomePlaying, setMetronomePlaying] = useState(false);
  const [mwEvaluated, setMwEvaluated] = useState(false);
  const [mwScore, setMwScore] = useState<number | null>(null);
  const [mwSyllables, setMwSyllables] = useState<Record<string, string>>({});
  const [mwFeedback, setMwFeedback] = useState("");

  // Activity 2B: Shadowing
  const [spItems, setSpItems] = useState<any[]>([]);
  const [spIdx, setSpIdx] = useState(0);
  const [spEvaluated, setSpEvaluated] = useState(false);
  const [spScore, setSpScore] = useState<number | null>(null);
  const [spDiff, setSpDiff] = useState<number | null>(null);
  const [spFeedback, setSpFeedback] = useState("");

  // Activity 2C: Chunk and say
  const [csyItems, setCsyItems] = useState<any[]>([]);
  const [csyIdx, setCsyIdx] = useState(0);
  const [csyPlannerChecked, setCsyPlannerChecked] = useState(false);
  const [csySelectedChunk, setCsySelectedChunk] = useState<string | null>(null);
  const [csyEvaluated, setCsyEvaluated] = useState(false);
  const [csyScore, setCsyScore] = useState<number | null>(null);
  const [csyFeedback, setCsyFeedback] = useState("");

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
          const res = await apiJson("/phases/3/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/3/core-data");
          setCoreData(res);
        } else if (step === 3) {
          if (rcItems.length === 0) {
            const resRc = await apiJson("/phase-3/items/rhythm-compare");
            setRcItems(resRc);
          }
          if (btItems.length === 0) {
            const resBt = await apiJson("/phase-3/items/beat-tap");
            setBtItems(resBt);
          }
          if (ckItems.length === 0) {
            const resCk = await apiJson("/phase-3/items/chunking");
            setCkItems(resCk);
          }
        } else if (step === 4) {
          if (mwItems.length === 0) {
            const resMw = await apiJson("/phase-3/items/metronome-words");
            setMwItems(resMw);
          }
          if (spItems.length === 0) {
            const resSp = await apiJson("/phase-3/items/shadowing-phrases");
            setSpItems(resSp);
          }
          if (csyItems.length === 0) {
            const resCsy = await apiJson("/phase-3/items/chunk-say");
            setCsyItems(resCsy);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/phase-3/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-3/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading PLS Lab Phase 3:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1A check
  const handleCheckRc = async () => {
    const current = rcItems[rcIdx];
    if (!current || !rcSelected) return;
    try {
      const res = await apiJson("/phase-3/items/rhythm-compare/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: rcSelected })
      });
      setRcCorrect(res.correct);
      setRcChecked(true);
      setRcExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextRc = () => {
    setRcSelected(null);
    setRcChecked(false);
    setRcCorrect(null);
    setRcExplanation("");
    if (rcIdx < rcItems.length - 1) {
      setRcIdx(prev => prev + 1);
    }
  };

  // Activity 1B Beat Tapper
  const startTapping = () => {
    setTaps([]);
    setTappingActive(true);
    setBtEvaluated(false);
    startTimeRef.current = Date.now();
    playAudio(btItems[btIdx].phrase);
  };

  const registerTap = () => {
    if (!tappingActive || startTimeRef.current === null) return;
    const offset = (Date.now() - startTimeRef.current) / 1000;
    setTaps(prev => [...prev, offset]);
  };

  const stopTappingAndCheck = async () => {
    setTappingActive(false);
    const current = btItems[btIdx];
    try {
      const res = await apiJson("/phase-3/items/beat-tap/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, taps: taps })
      });
      setBtScore(res.score);
      setBtFeedback(res.feedback);
      setBtEvaluated(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextBt = () => {
    setTaps([]);
    setBtEvaluated(false);
    setBtScore(null);
    setBtFeedback("");
    if (btIdx < btItems.length - 1) {
      setBtIdx(prev => prev + 1);
    }
  };

  // Activity 1C check
  const handleCheckCk = async () => {
    const current = ckItems[ckIdx];
    if (!current || !ckSelected) return;
    try {
      const res = await apiJson("/phase-3/items/chunking/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: ckSelected })
      });
      setCkCorrect(res.correct);
      setCkChecked(true);
      setCkRecommendation(res.recommendation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextCk = () => {
    setCkSelected(null);
    setCkChecked(false);
    setCkCorrect(null);
    setCkRecommendation("");
    if (ckIdx < ckItems.length - 1) {
      setCkIdx(prev => prev + 1);
    }
  };

  // Activity 2A Record Metronome Words
  const handleRecordMw = () => {
    setMetronomePlaying(true);
    // Simulate beats ticking
    setTimeout(() => {
      setMetronomePlaying(false);
      setRecording(true);
      setTimeout(async () => {
        setRecording(false);
        const current = mwItems[mwIdx];
        try {
          const res = await apiJson("/phase-3/items/metronome-words/evaluate", {
            method: "POST",
            body: JSON.stringify({ item_id: current.id, audio_base64: "mock_data" })
          });
          setMwScore(res.overall_score);
          setMwSyllables(res.timing_scores);
          setMwFeedback(res.feedback);
          setMwEvaluated(true);
        } catch (err) {
          console.error(err);
        }
      }, 2000);
    }, 1500);
  };

  const handleNextMw = () => {
    setMwScore(null);
    setMwSyllables({});
    setMwFeedback("");
    setMwEvaluated(false);
    if (mwIdx < mwItems.length - 1) {
      setMwIdx(prev => prev + 1);
    }
  };

  // Activity 2B Shadowing Recorder
  const handleRecordSp = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = spItems[spIdx];
      try {
        const res = await apiJson("/phase-3/items/shadowing-phrases/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: current.id, audio_base64: "mock_data" })
        });
        setSpScore(res.score);
        setSpDiff(res.tempo_difference_percent);
        setSpFeedback(res.feedback);
        setSpEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2500);
  };

  const handleNextSp = () => {
    setSpScore(null);
    setSpDiff(null);
    setSpFeedback("");
    setSpEvaluated(false);
    if (spIdx < spItems.length - 1) {
      setSpIdx(prev => prev + 1);
    }
  };

  // Activity 2C: Chunk and say check
  const handleCheckCsyPlanner = () => {
    setCsyPlannerChecked(true);
  };

  const handleRecordCsy = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = csyItems[csyIdx];
      try {
        const res = await apiJson("/phase-3/items/chunk-say/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: current.id, audio_base64: "mock_data" })
        });
        setCsyScore(res.score);
        setCsyFeedback(res.feedback);
        setCsyEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2500);
  };

  const handleNextCsy = () => {
    setCsyScore(null);
    setCsyFeedback("");
    setCsyEvaluated(false);
    setCsyPlannerChecked(false);
    setCsySelectedChunk(null);
    if (csyIdx < csyItems.length - 1) {
      setCsyIdx(prev => prev + 1);
    }
  };

  // Quiz flow
  const handleCheckQuizAnswer = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelected) return;
    try {
      const res = await apiJson("/phase-3/quiz/answer", {
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
        await apiJson("/phase-3/quiz/finish", {
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
      const res = await apiJson("/phase-3/homework/submit", {
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
      const res = await apiJson("/phase-3/complete", { method: "POST" });
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
            <h2 className="font-extrabold text-lg">Pronunciation Lab 3</h2>
            <p className="text-xs text-zinc-400">Rhythm & Word Flow</p>
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
            Rhythm Phase Outline
          </h3>
          <ul className="text-sm text-zinc-300 space-y-2">
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 1 ? "bg-cyan-500" : "bg-slate-700"}`} />
              <span>Screen 1: Welcome & Goals Overview</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 2 ? "bg-teal-500" : "bg-slate-700"}`} />
              <span>Screen 2: Concept Explanation: Korean Rhythm</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 3 ? "bg-indigo-500" : "bg-slate-700"}`} />
              <span>Screen 3: Activity 1: Hear Rhythm & Chunking</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 4 ? "bg-purple-500" : "bg-slate-700"}`} />
              <span>Screen 4: Activity 2: Speak with Even Rhythm</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 5 ? "bg-pink-500" : "bg-slate-700"}`} />
              <span>Screen 5: Mini-Quiz: Rhythm & Flow Check</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step >= 6 ? "bg-emerald-500" : "bg-slate-700"}`} />
              <span>Screen 6: Homework & Rhythm Coach</span>
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
            <h2 className="text-3xl font-black text-white font-sans">{metadata?.title || "Pronunciation Lab 3 – Rhythm & Word Flow (A2)"}</h2>
            <h3 className="text-md font-bold text-cyan-400 mt-1">{metadata?.subtitle || "Even syllables, smoother words."}</h3>
          </div>

          <p className="text-zinc-300 text-sm leading-relaxed max-w-md mx-auto">
            {metadata?.description || "In this lab, you’ll practise Korean rhythm: keeping syllables even, grouping words into natural chunks, and avoiding English‑style stress patterns."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs space-y-2 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Focus Milestones:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Keep syllable length more even in short words and phrases",
                "Hear and imitate natural Korean word rhythm",
                "Read and say common A2 phrases without ‘robotic’ pauses"
              ]).map((g: string, i: number) => <li key={i}>{g}</li>)}
            </ul>
            <p className="pt-2 text-zinc-400"><strong>⏱️ Est. Lab Time:</strong> 25 minutes</p>
            <p className="text-zinc-400"><strong>🔗 Prerequisites:</strong> {metadata?.dependencies || "Pronunciation Lab 2 (Completed)"}</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
            {["A2", "Rhythm", "Listening", "Speaking"].map(chip => (
              <span key={chip} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] text-cyan-300 font-bold">{chip}</span>
            ))}
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => setStep(2)} 
              className="bg-cyan-500 hover:bg-cyan-455 text-zinc-950 font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Volume2 className="w-4 h-4" /> Start Rhythm Lab
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: CONCEPT EXPLANATION */}
      {step === 2 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            Korean Rhythm Basics
          </h2>

          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
              <h3 className="font-bold text-white mb-1">1. Syllable-Based \"Beats\"</h3>
              <p className="text-zinc-400">Unlike English (which stretches stressed syllables and shrinks unstressed ones), Korean is syllable-timed. Each syllable receives relatively equal length and duration.</p>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
              <h3 className="font-bold text-white mb-1">2. Words as \"Rhythm Blocks\"</h3>
              <p className="text-zinc-400">Korean words are spoken together in small, smooth breath blocks. Pausing after every single word makes speech sound choppy and robotic.</p>
            </div>
          </div>

          {/* Interactive Rhythm Examples */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200">Rhythm Pairs: Even vs Stressed</h3>
            <div className="space-y-2 text-xs">
              {(coreData?.rhythm_pairs || []).map((pair: any) => (
                <div key={pair.phrase} className="p-3 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-cyan-300 text-sm">{pair.phrase}</span>
                    <button 
                      onClick={() => playAudio(pair.phrase)}
                      className="p-1.5 bg-zinc-950 border border-white/5 hover:bg-slate-800 transition rounded-lg cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="text-green-300 bg-green-500/5 p-1.5 rounded border border-green-500/10">✓ {pair.even_desc}</div>
                    <div className="text-red-350 bg-red-500/5 p-1.5 rounded border border-red-500/10">✗ {pair.stressed_desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chunking Visual Diagram */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
            <h3 className="text-xs font-bold text-zinc-200">Chunking & Breath Blocks</h3>
            <div className="space-y-1.5 text-xs">
              {(coreData?.chunk_examples || []).map((ex: any) => (
                <div key={ex.text} className="flex justify-between items-center p-2 bg-zinc-900 border border-white/5 rounded-lg">
                  <span className="font-mono text-teal-300 font-bold">{ex.text}</span>
                  <span className="text-zinc-400 text-[10px]">{ex.translation}</span>
                </div>
              ))}
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
              Proceed to Drills
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: ACTIVITY 1: HEAR RHYTHM & CHUNKING */}
      {step === 3 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 1: Perception & Beat matching
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Identify Even Beats, Tap tempos, and place Chunks</h2>
          </div>

          {/* Activity 1A: Even or Stressed */}
          {rcItems.length > 0 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Even or Stressed?</span>
                <span>Phrase {rcIdx + 1} of {rcItems.length}</span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => playAudio(rcItems[rcIdx]?.phrase)}
                  className="p-3 bg-cyan-500/20 text-cyan-300 rounded-full hover:bg-cyan-500/30 transition border border-cyan-500/30 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                </button>
                <span className="text-xs text-zinc-400">Listen, select which one has natural even rhythm:</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {rcItems[rcIdx]?.options?.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !rcChecked && setRcSelected(opt)}
                    className={`py-3 px-4 rounded-xl text-xs font-semibold border transition text-left ${
                      rcSelected === opt 
                        ? "border-cyan-500 bg-cyan-500/10 text-white" 
                        : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                    } ${rcChecked && opt === rcItems[rcIdx].correct ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                    disabled={rcChecked}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {rcChecked && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${rcCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                  <strong>{rcCorrect ? "Correct!" : "Incorrect."}</strong> {rcExplanation}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!rcChecked ? (
                  <button
                    onClick={handleCheckRc}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-750 text-xs font-bold rounded-lg text-zinc-200 transition"
                    disabled={!rcSelected}
                  >
                    Check Rhythm
                  </button>
                ) : (
                  rcIdx < rcItems.length - 1 && (
                    <button
                      onClick={handleNextRc}
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition"
                    >
                      Next Phrase
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Activity 1B: Tap the beats */}
          {btItems.length > 0 && rcChecked && rcIdx === rcItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Tap the beats along with syllables</span>
                <span>Phrase {btIdx + 1} of {btItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-3">
                <span className="text-[10px] text-zinc-550 block uppercase font-bold">Rhythm Phrase:</span>
                <span className="text-xl font-extrabold text-cyan-400 tracking-widest">{btItems[btIdx].phrase}</span>
                <div className="text-[10px] text-zinc-400">Total beats to tap: {btItems[btIdx].beats}</div>
              </div>

              <div className="flex justify-center gap-4 py-2 border-y border-white/5">
                <button
                  onClick={startTapping}
                  className="px-5 py-2.5 bg-cyan-500 text-zinc-950 font-bold rounded-xl text-xs hover:bg-cyan-450 transition cursor-pointer"
                  disabled={tappingActive}
                >
                  Start Audio & Tap
                </button>
                <button
                  onClick={registerTap}
                  className={`px-8 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    tappingActive 
                      ? "bg-indigo-500 border-indigo-400 text-white animate-pulse" 
                      : "bg-zinc-800 border-zinc-700 text-zinc-500"
                  }`}
                  disabled={!tappingActive}
                >
                  TAP BEAT! ({taps.length})
                </button>
              </div>

              {taps.length >= btItems[btIdx].beats && tappingActive && (
                <div className="flex justify-end">
                  <button
                    onClick={stopTappingAndCheck}
                    className="py-2 px-4 bg-teal-500 text-white font-bold rounded-lg text-xs hover:bg-teal-450 transition cursor-pointer"
                  >
                    Calculate Taps
                  </button>
                </div>
              )}

              {btEvaluated && (
                <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-1 text-xs animate-fade-in">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Tap Alignment Accuracy:</span>
                    <span className="font-bold text-teal-400">{btScore}%</span>
                  </div>
                  <p className="text-[11px] text-zinc-350">{btFeedback}</p>
                </div>
              )}

              <div className="flex justify-end">
                {btEvaluated && btIdx < btItems.length - 1 && (
                  <button
                    onClick={handleNextBt}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold text-white rounded-lg transition"
                  >
                    Next Tapper
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 1C: Find natural chunk breaks */}
          {ckItems.length > 0 && btEvaluated && btIdx === btItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Find the chunk breaks</span>
                <span>Sentence {ckIdx + 1} of {ckItems.length}</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-450">Sentence:</span>
                  <span className="text-base font-bold text-indigo-400">{ckItems[ckIdx].phrase}</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {ckItems[ckIdx].choices.map((c: string) => (
                    <button
                      key={c}
                      onClick={() => !ckChecked && setCkSelected(c)}
                      className={`py-3 px-4 rounded-xl text-xs font-semibold border transition text-left ${
                        ckSelected === c 
                          ? "border-indigo-500 bg-indigo-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                      } ${ckChecked && c === ckItems[ckIdx].correct ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                      disabled={ckChecked}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {ckChecked && (
                <div className="p-4 rounded-xl border border-green-900 bg-green-950/20 text-xs text-green-300 leading-relaxed">
                  <strong>{ckCorrect ? "Good chunk choice!" : "Incorrect break placement."}</strong> Recommended chunking: {ckRecommendation}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!ckChecked ? (
                  <button
                    onClick={handleCheckCk}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-750 text-xs font-bold rounded-lg text-zinc-200 transition"
                    disabled={!ckSelected}
                  >
                    Check Chunk Break
                  </button>
                ) : (
                  ckIdx < ckItems.length - 1 && (
                    <button
                      onClick={handleNextCk}
                      className="py-2 px-4 bg-indigo-500 hover:bg-indigo-450 text-xs font-bold rounded-lg text-white transition"
                    >
                      Next Sentence
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(2)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button 
              onClick={() => setStep(4)}
              className="flex items-center gap-1 py-2.5 px-6 bg-cyan-500 hover:bg-cyan-455 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Production
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 4: ACTIVITY 2: SPEAK WITH EVEN RHYTHM */}
      {step === 4 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 2: Production & rhythm timing
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Speak to metronome beats, shadow phrases, and plan chunks</h2>
          </div>

          {/* Activity 2A: Metronome Word Practice */}
          {mwItems.length > 0 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Metronome word timing</span>
                <span>Word {mwIdx + 1} of {mwItems.length}</span>
              </div>

              <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-white/5">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold mb-1">Target Word ({mwItems[mwIdx].beats} beats):</span>
                  <span className="text-2xl font-black text-cyan-400 hover:underline cursor-pointer" onClick={() => playAudio(mwItems[mwIdx].word)}>{mwItems[mwIdx].word}</span>
                </div>
                <div className={`p-3 rounded-full border transition ${metronomePlaying ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-ping" : "bg-zinc-800 text-zinc-500 border-zinc-700"}`}>
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              {mwEvaluated && (
                <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Even Beats Score:</span>
                    <span className="font-bold text-cyan-400">{mwScore}%</span>
                  </div>
                  <div className="flex gap-2 justify-center py-1">
                    {Object.entries(mwSyllables).map(([syl, color]) => (
                      <span key={syl} className="flex items-center gap-1 bg-zinc-950 px-3 py-1 rounded border border-white/5 text-[10px] font-mono text-zinc-400">
                        <span className={`w-2 h-2 rounded-full ${color === "green" ? "bg-green-500" : "bg-amber-500"}`} />
                        <span>{syl}</span>
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-350 leading-relaxed font-mono">{mwFeedback}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  onClick={handleRecordMw}
                  className={`flex items-center gap-1.5 py-2.5 px-6 rounded-xl font-bold transition text-xs cursor-pointer ${
                    metronomePlaying 
                      ? "bg-cyan-600 text-white animate-pulse" 
                      : recording 
                        ? "bg-red-500 text-white animate-pulse" 
                        : "bg-cyan-500 text-zinc-950 hover:bg-cyan-455"
                  }`}
                  disabled={metronomePlaying || recording}
                >
                  <Mic className="w-3.5 h-3.5" />
                  {metronomePlaying ? "Listen to metronome..." : recording ? "Speaking (Match beats)..." : "Start timed recording"}
                </button>
                {mwEvaluated && mwIdx < mwItems.length - 1 && (
                  <button
                    onClick={handleNextMw}
                    className="py-2 px-4 bg-teal-500 hover:bg-teal-450 text-xs text-white font-bold rounded-lg transition"
                  >
                    Next Word
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2B: Shadowing */}
          {spItems.length > 0 && mwEvaluated && mwIdx === mwItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Phrase rhythm shadowing</span>
                <span>Phrase {spIdx + 1} of {spItems.length}</span>
              </div>

              <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-white/5">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold mb-1">Shadow Phrase:</span>
                  <span className="text-xl font-black text-cyan-300 hover:underline cursor-pointer" onClick={() => playAudio(spItems[spIdx].phrase)}>{spItems[spIdx].phrase}</span>
                </div>
                <div className="text-[10px] bg-teal-950/20 text-teal-450 border border-teal-500/25 py-1 px-2.5 rounded font-mono">
                  Syllables: {spItems[spIdx].beats}
                </div>
              </div>

              {spEvaluated && (
                <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-1.5 text-xs animate-fade-in">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Tempo Match Accuracy:</span>
                    <span className="font-bold text-teal-400">{spScore}%</span>
                  </div>
                  <div className="text-[10px] text-zinc-500">Speed variance: +{spDiff}% vs native model speaker.</div>
                  <p className="text-[11px] text-zinc-350 leading-relaxed font-mono mt-1">{spFeedback}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  onClick={handleRecordSp}
                  className={`flex items-center gap-1.5 py-2.5 px-6 rounded-xl font-bold transition text-xs cursor-pointer ${
                    recording 
                      ? "bg-red-500 text-white animate-pulse" 
                      : "bg-cyan-500 text-zinc-950 hover:bg-cyan-455"
                  }`}
                  disabled={recording}
                >
                  <Mic className="w-3.5 h-3.5" />
                  {recording ? "Speaking (Shadow native speaker)..." : "Listen & Record"}
                </button>
                {spEvaluated && spIdx < spItems.length - 1 && (
                  <button
                    onClick={handleNextSp}
                    className="py-2.5 px-5 bg-teal-500 text-white font-bold rounded-xl text-xs hover:bg-teal-450 transition cursor-pointer"
                  >
                    Next Phrase
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2C: Chunk and say */}
          {csyItems.length > 0 && spEvaluated && spIdx === spItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Chunk and say</span>
                <span>Sentence {csyIdx + 1} of {csyItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold mb-1">Planner Sentence:</span>
                <span className="text-base font-bold text-white block">{csyItems[csyIdx].sentence}</span>
                
                {!csyPlannerChecked ? (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] text-zinc-500 uppercase block font-bold">Select natural chunk break:</span>
                    <div className="grid grid-cols-1 gap-2">
                      {csyItems[csyIdx].chunks.map((ch: string) => (
                        <button
                          key={ch}
                          onClick={() => setCsySelectedChunk(ch)}
                          className={`py-2 px-3 border text-xs font-mono rounded-lg transition text-left ${
                            csySelectedChunk === ch ? "border-indigo-400 bg-indigo-500/10 text-white" : "border-white/5 bg-zinc-950 text-zinc-400 hover:bg-slate-800"
                          }`}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-950 border border-white/5 rounded text-xs text-zinc-350">
                    Planned Chunk Break: <strong className="text-teal-300 font-mono">{csySelectedChunk}</strong>. Read the sentence with a pause only at this boundary.
                  </div>
                )}
              </div>

              {csyEvaluated && (
                <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Chunk Pause Scorer:</span>
                    <span className="font-bold text-teal-400">{csyScore}%</span>
                  </div>
                  <p className="text-[11px] text-zinc-350 leading-relaxed font-mono">{csyFeedback}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                {!csyPlannerChecked ? (
                  <button
                    onClick={handleCheckCsyPlanner}
                    className="py-2.5 px-6 bg-cyan-505 text-zinc-950 font-bold rounded-xl text-xs hover:bg-cyan-450 transition cursor-pointer"
                    disabled={!csySelectedChunk}
                  >
                    Confirm Chunk Plan
                  </button>
                ) : (
                  <button
                    onClick={handleRecordCsy}
                    className={`flex items-center gap-1.5 py-2.5 px-6 rounded-xl font-bold transition text-xs cursor-pointer ${
                      recording 
                        ? "bg-red-500 text-white animate-pulse" 
                        : "bg-cyan-500 text-zinc-950 hover:bg-cyan-455"
                    }`}
                    disabled={recording}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    {recording ? "Speaking (Follow planned breaks)..." : "Record Sentence"}
                  </button>
                )}
                {csyEvaluated && csyIdx < csyItems.length - 1 && (
                  <button
                    onClick={handleNextCsy}
                    className="py-2.5 px-5 bg-teal-500 text-white font-bold rounded-xl text-xs hover:bg-teal-450 transition cursor-pointer"
                  >
                    Next Sentence
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(3)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button 
              onClick={() => setStep(5)}
              className="flex items-center gap-1 py-2.5 px-6 bg-cyan-500 hover:bg-cyan-455 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Quiz
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 5: MINI QUIZ */}
      {step === 5 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Mini-Quiz: Rhythm & Flow Check
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Confirm your syllable beats and chunk pacing skills</h2>
          </div>

          {quizScore === null ? (
            quizBlueprint.length > 0 ? (
              <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Question {quizIdx + 1} of {quizBlueprint.length}</span>
                  <span className="text-cyan-400 font-bold">{Math.round((quizIdx / quizBlueprint.length) * 100)}% Complete</span>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-bold text-zinc-250 leading-relaxed">
                    {quizBlueprint[quizIdx]?.question}
                  </p>
                  
                  {/* Option list */}
                  <div className="grid grid-cols-1 gap-2 pt-2">
                    {quizBlueprint[quizIdx]?.options?.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !quizChecked && setQuizSelected(opt)}
                        className={`py-3.5 px-4 rounded-xl text-xs font-semibold border transition text-left ${
                          quizSelected === opt 
                            ? "border-cyan-500 bg-cyan-500/10 text-white" 
                            : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
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

                  <div className="flex justify-end gap-2">
                    {!quizChecked ? (
                      <button
                        onClick={handleCheckQuizAnswer}
                        className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-200 transition"
                        disabled={!quizSelected}
                      >
                        Check Answer
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuiz}
                        className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition"
                      >
                        {quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-cyan-450 animate-spin" />
              </div>
            )
          ) : (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-4 text-center">
              <Award className="w-12 h-12 text-cyan-450 mx-auto" />
              <div>
                <h3 className="font-extrabold text-lg text-white">Quiz Completed!</h3>
                <p className="text-xs text-zinc-400 mt-1">Final Score: <span className="text-cyan-400 font-bold text-sm">{quizScore}%</span></p>
              </div>

              {quizScore >= 80 ? (
                <div className="bg-green-950/20 border border-green-900/50 p-4 rounded-xl text-xs text-green-300 leading-relaxed max-w-sm mx-auto">
                  🎉 Outstanding! You have acquired robust A2 Korean Rhythm and Chunk pacing skills. Continue to Homework for final coach evaluation.
                </div>
              ) : (
                <div className="bg-orange-950/20 border border-orange-900/50 p-4 rounded-xl text-xs text-orange-300 leading-relaxed max-w-sm mx-auto">
                  Rhythm is tricky. Retry to target 80% and secure your pacing certificate. You can retry anytime.
                </div>
              )}

              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={handleRestartQuiz}
                  className="flex items-center gap-1 px-4 py-2 bg-zinc-900 border border-white/5 hover:bg-slate-800 rounded-lg text-xs font-bold text-zinc-300 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retry Quiz
                </button>
                <button
                  onClick={() => setStep(6)}
                  className="px-5 py-2 bg-cyan-500 text-zinc-950 hover:bg-cyan-450 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Proceed to Homework
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(4)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button 
              onClick={() => setStep(6)}
              className="flex items-center gap-1 py-2.5 px-6 bg-cyan-500 hover:bg-cyan-455 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Homework
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 6: HOMEWORK & COACH */}
      {step === 6 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Homework & AI Rhythm Coach
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Record dialogue shadowing and check your rhythm heatmap</h2>
          </div>

          <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 text-xs">
            <h3 className="font-bold text-zinc-200 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Rhythm & Pacing tasks
            </h3>
            <ul className="space-y-2 text-zinc-350 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="p-0.5 bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 rounded mt-0.5">1</span>
                <span>Word rhythms: Record 10 words (친구, 학교, 이름, 영화, 공부, 오늘, 내일, 사과, 커피, 시간).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="p-0.5 bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 rounded mt-0.5">2</span>
                <span>Routine sentences: Record 3 daily schedules from Korean 2 with natural breaks.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="p-0.5 bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 rounded mt-0.5">3</span>
                <span>Dialogue shadowing: Shadow a short conversational dialogue.</span>
              </li>
            </ul>

            <div className="border-t border-white/5 pt-4 space-y-3">
              <p className="text-zinc-400 font-semibold">Type your sentences below to run AI rhythm spacing check:</p>
              <div className="space-y-2">
                {hwSents.map((s, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={s}
                    onChange={(e) => handleHwChange(idx, e.target.value)}
                    placeholder={`Routine Sentence ${idx + 1} (e.g., 매일 아침 커피를 마셔요...)`}
                    className="w-full bg-zinc-900 border border-white/5 p-2.5 rounded-xl text-white placeholder-slate-500 text-xs focus:border-cyan-500 outline-none"
                    disabled={submittingHw || !!hwFeedback}
                  />
                ))}
              </div>
            </div>

            {hwFeedback && (
              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-3 animate-fade-in">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">AI rhythm variance score:</span>
                  <span className="font-bold text-cyan-400">{hwFeedback.overall_score}%</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-bold">Rhythm Heatmap:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(hwFeedback.feedback_heatmap).map(([wd, color]) => {
                      const colorClass = color === "green" ? "bg-green-500/10 text-green-300 border-green-500/20" : "bg-amber-500/10 text-amber-300 border-amber-500/20";
                      return (
                        <span key={wd} className={`px-2 py-1 border text-xs font-mono rounded ${colorClass}`}>{wd}</span>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[11px] text-zinc-350 space-y-1">
                  <span className="font-bold text-zinc-200">🔍 Suggested Focus Sounds:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                    {hwFeedback.focus_sounds.map((sound: string, i: number) => <li key={i}>{sound}</li>)}
                  </ul>
                  <p className="mt-1 font-mono text-[10px] text-zinc-450">{hwFeedback.recommendation}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              {!hwFeedback ? (
                <button
                  onClick={handleSubmitHomework}
                  className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-455 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  disabled={submittingHw || hwSents.every(s => !s.trim())}
                >
                  {submittingHw ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
                  Check My Rhythm
                </button>
              ) : (
                <button
                  onClick={() => setHwFeedback(null)}
                  className="py-2 px-4 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 rounded-lg transition cursor-pointer"
                >
                  Reset Coach Input
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(5)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button 
              onClick={handleCompleteLab}
              className="flex items-center gap-1 py-2.5 px-6 bg-green-500 hover:bg-green-450 text-white font-bold rounded-xl transition cursor-pointer shadow-lg shadow-green-500/20"
              disabled={completingLab}
            >
              {completingLab ? "Completing..." : "Complete Rhythm Lab"}
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
