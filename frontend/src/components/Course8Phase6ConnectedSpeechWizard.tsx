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

interface Course8Phase6ConnectedSpeechWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course8Phase6ConnectedSpeechWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course8Phase6ConnectedSpeechWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);

  // Loaded data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1A: Careful vs Connected
  const [ccItems, setCcItems] = useState<any[]>([]);
  const [ccIdx, setCcIdx] = useState(0);
  const [ccSelected, setCcSelected] = useState<string | null>(null);
  const [ccChecked, setCcChecked] = useState(false);
  const [ccCorrect, setCcCorrect] = useState<boolean | null>(null);

  // Activity 1B: Where does it link?
  const [llItems, setLlItems] = useState<any[]>([]);
  const [llIdx, setLlIdx] = useState(0);
  const [llSelectedIndices, setLlSelectedIndices] = useState<number[]>([]);
  const [llChecked, setLlChecked] = useState(false);

  // Activity 1C: Spot the reduction
  const [rdItems, setRdItems] = useState<any[]>([]);
  const [rdIdx, setRdIdx] = useState(0);
  const [rdSelectedWords, setRdSelectedWords] = useState<string[]>([]);
  const [rdChecked, setRdChecked] = useState(false);

  // Activity 2A: Shadowing careful → connected
  const [shadowItems, setShadowItems] = useState<any[]>([]);
  const [shadowIdx, setShadowIdx] = useState(0);
  const [shadowMode, setShadowMode] = useState<"careful" | "connected">("careful");
  const [recording, setRecording] = useState(false);
  const [shadowEvaluated, setShadowEvaluated] = useState(false);
  const [shadowPauses, setShadowPauses] = useState<number | null>(null);
  const [shadowLinkScore, setShadowLinkScore] = useState<number | null>(null);
  const [shadowFeedback, setShadowFeedback] = useState("");

  // Activity 2B: Link the chain
  const [chainItems, setChainItems] = useState<any[]>([]);
  const [chainIdx, setChainIdx] = useState(0);
  const [chainEvaluated, setChainEvaluated] = useState(false);
  const [chainScore, setChainScore] = useState<number | null>(null);
  const [chainStatuses, setChainStatuses] = useState<Record<string, string>>({});
  const [chainFeedback, setChainFeedback] = useState("");

  // Activity 2C: Describe with flow B1 speaking
  const [guidedItems, setGuidedItems] = useState<any[]>([]);
  const [guidedIdx, setGuidedIdx] = useState(0);
  const [guidedSelectedScaffolds, setGuidedSelectedScaffolds] = useState<string[]>([]);
  const [guidedEvaluated, setGuidedEvaluated] = useState(false);
  const [guidedRate, setGuidedRate] = useState<number | null>(null);
  const [guidedPauses, setGuidedPauses] = useState<number | null>(null);
  const [guidedPauseSec, setGuidedPauseSec] = useState<number | null>(null);
  const [guidedChoppiness, setGuidedChoppiness] = useState("");
  const [guidedFeedback, setGuidedFeedback] = useState("");

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
          const res = await apiJson("/phases/6/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/6/core-data");
          setCoreData(res);
        } else if (step === 3) {
          if (ccItems.length === 0) {
            const resCc = await apiJson("/phase-6/items/careful-vs-connected");
            setCcItems(resCc);
          }
          if (llItems.length === 0) {
            const resLl = await apiJson("/phase-6/items/link-locations");
            setLlItems(resLl);
          }
          if (rdItems.length === 0) {
            const resRd = await apiJson("/phase-6/items/reduction-spot");
            setRdItems(resRd);
          }
        } else if (step === 4) {
          if (shadowItems.length === 0) {
            const resSh = await apiJson("/phase-6/items/shadowing-sentences");
            setShadowItems(resSh);
          }
          if (chainItems.length === 0) {
            const resCh = await apiJson("/phase-6/items/chain-phrases");
            setChainItems(resCh);
          }
          if (guidedItems.length === 0) {
            const resGs = await apiJson("/phase-6/items/guided-speaking");
            setGuidedItems(resGs);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/phase-6/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-6/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading PLS Lab Phase 6:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1A Careful vs connected
  const handleCheckCc = async () => {
    const current = ccItems[ccIdx];
    if (!current || !ccSelected) return;
    try {
      const res = await apiJson("/phase-6/items/careful-vs-connected/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: ccSelected })
      });
      setCcCorrect(res.correct);
      setCcChecked(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextCc = () => {
    setCcSelected(null);
    setCcChecked(false);
    setCcCorrect(null);
    if (ccIdx < ccItems.length - 1) {
      setCcIdx(prev => prev + 1);
    }
  };

  // Activity 1B Link index select
  const handleToggleLinkIndex = (idx: number) => {
    if (llChecked) return;
    setLlSelectedIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleCheckLl = async () => {
    const current = llItems[llIdx];
    if (!current) return;
    try {
      await apiJson("/phase-6/items/link-locations/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: llSelectedIndices.join(",") })
      });
      setLlChecked(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextLl = () => {
    setLlSelectedIndices([]);
    setLlChecked(false);
    if (llIdx < llItems.length - 1) {
      setLlIdx(prev => prev + 1);
    }
  };

  // Activity 1C Reduction spots
  const handleToggleReductionWord = (word: string) => {
    if (rdChecked) return;
    setRdSelectedWords(prev =>
      prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
    );
  };

  const handleCheckRd = async () => {
    const current = rdItems[rdIdx];
    if (!current) return;
    try {
      await apiJson("/phase-6/items/reduction-spot/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: rdSelectedWords.join(",") })
      });
      setRdChecked(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextRd = () => {
    setRdSelectedWords([]);
    setRdChecked(false);
    if (rdIdx < rdItems.length - 1) {
      setRdIdx(prev => prev + 1);
    }
  };

  // Activity 2A Shadowing speak
  const handleRecordShadow = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = shadowItems[shadowIdx];
      try {
        const res = await apiJson("/phase-6/items/shadowing-sentences/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: `${current.id}_${shadowMode}`, audio_base64: "mock_data" })
        });
        setShadowPauses(res.pauses_count);
        setShadowLinkScore(res.linking_score);
        setShadowFeedback(res.feedback);
        setShadowEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2500);
  };

  const handleNextShadow = () => {
    setShadowPauses(null);
    setShadowLinkScore(null);
    setShadowFeedback("");
    setShadowEvaluated(false);
    setShadowMode("careful");
    if (shadowIdx < shadowItems.length - 1) {
      setShadowIdx(prev => prev + 1);
    }
  };

  // Activity 2B Link the chain
  const handleRecordChain = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = chainItems[chainIdx];
      try {
        const res = await apiJson("/phase-6/items/chain-phrases/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: current.id, audio_base64: "mock_data" })
        });
        setChainScore(res.score);
        setChainStatuses(res.chain_statuses);
        setChainFeedback(res.feedback);
        setChainEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2500);
  };

  const handleNextChain = () => {
    setChainScore(null);
    setChainStatuses({});
    setChainFeedback("");
    setChainEvaluated(false);
    if (chainIdx < chainItems.length - 1) {
      setChainIdx(prev => prev + 1);
    }
  };

  // Activity 2C Guided B1 speaking
  const handleToggleScaffold = (sent: string) => {
    setGuidedSelectedScaffolds(prev =>
      prev.includes(sent) ? prev.filter(s => s !== sent) : [...prev, sent]
    );
  };

  const handleRecordGuided = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = guidedItems[guidedIdx];
      try {
        const res = await apiJson("/phase-6/items/guided-speaking/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: current.id, audio_base64: "mock_data" })
        });
        setGuidedRate(res.speech_rate);
        setGuidedPauses(res.pauses_count);
        setGuidedPauseSec(res.average_pause_sec);
        setGuidedChoppiness(res.choppiness_index);
        setGuidedFeedback(res.feedback);
        setGuidedEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 3000);
  };

  const handleNextGuided = () => {
    setGuidedSelectedScaffolds([]);
    setGuidedRate(null);
    setGuidedPauses(null);
    setGuidedPauseSec(null);
    setGuidedChoppiness("");
    setGuidedFeedback("");
    setGuidedEvaluated(false);
    if (guidedIdx < guidedItems.length - 1) {
      setGuidedIdx(prev => prev + 1);
    }
  };

  // Quiz flow
  const handleCheckQuizAnswer = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelected) return;
    try {
      const res = await apiJson("/phase-6/quiz/answer", {
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
        await apiJson("/phase-6/quiz/finish", {
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
      const res = await apiJson("/phase-6/homework/submit", {
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
      const res = await apiJson("/phase-6/complete", { method: "POST" });
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
    { num: 2, label: "= 2 ? \"bg-teal-500\" : \"bg-slate-700\"}`} /> Screen 2: Concept Explanation: Connected Speech" },
    { num: 3, label: "= 3 ? \"bg-indigo-500\" : \"bg-slate-700\"}`} /> Screen 3: Activity 1: Hear Linking & reduction" },
    { num: 4, label: "= 4 ? \"bg-purple-500\" : \"bg-slate-700\"}`} /> Screen 4: Activity 2: Speak Chains & Scaffolded Monologues" },
    { num: 5, label: "= 5 ? \"bg-pink-500\" : \"bg-slate-700\"}`} /> Screen 5: Mini-Quiz: connected Speech listening check" },
    { num: 6, label: "= 6 ? \"bg-emerald-500\" : \"bg-slate-700\"}`} /> Screen 6: Homework & Fluency Coach" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 8,
          phaseNum: 6,
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
            <h2 className="font-black text-xl text-white tracking-tight">Fluency Lab 1</h2>
            <p className="text-xs text-zinc-400">Connected Speech (B1)</p>
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
      {showOutline && (
        <div className="mb-6 p-5 bg-zinc-950/80 rounded-3xl border border-white/5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 font-mono">Curriculum Syllabus Map</span>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {outlineSteps.map(s => (
              <button
                key={s.num}
                onClick={() => {
                  setStep(s.num);
                  setShowOutline(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition ${step === s.num
                    ? "border-brand-500 bg-brand-500/10 text-white"
                    : "border-white/5 bg-zinc-900/40 text-zinc-400 hover:border-white/10 hover:text-white"
                  }`}
              >
                <div className="text-[9px] font-black font-mono text-zinc-500">STEP {s.num}</div>
                <div className="text-xs font-bold truncate">{s.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Outline panel */}
      

      {/* SCREEN 1: WELCOME */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in relative overflow-hidden">
          <div className="relative mx-auto w-fit">
            <div className="p-4 bg-cyan-500/10 rounded-full border border-cyan-500/25 text-cyan-400">
              <Volume2 className="w-10 h-10" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-brand-500 rounded-full border-2 border-zinc-950">
              <Sparkles className="w-3 h-3 text-white fill-white" />
            </div>
          </div>

          <div>
            <h2 className="text-5xl font-black text-white tracking-tight font-sans">{metadata?.title || "Fluency Lab 1 – Connected Speech (B1)"}</h2>
            <h3 className="text-2xl font-extrabold text-cyan-400 mt-2">{metadata?.subtitle || "Link words and speak more smoothly."}</h3>
          </div>

          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "In this lab, you’ll practise linking words, reducing small function words, and keeping your sentences flowing, so your Korean sounds more natural and fluent."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Focus Milestones:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Hear how words blend together in natural Korean",
                "Practise reading and speaking sentences without choppy pauses",
                "Build B1‑level fluency on familiar topics"
              ]).map((g: string, i: number) => <li key={i}>{g}</li>)}
            </ul>
            <p className="pt-2 text-zinc-400"><strong>⏱️ Est. Lab Time:</strong> 25 minutes</p>
            <p className="text-zinc-400"><strong>🔗 Prerequisites:</strong> {metadata?.dependencies || "Pronunciation Lab 5 (Completed)"}</p>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl mx-auto">
            {["B1", "Connected speech", "Fluency", "Listening", "Speaking"].map(chip => (
              <span key={chip} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] text-cyan-300 font-bold">{chip}</span>
            ))}
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => setStep(2)} 
              className="bg-cyan-500 hover:bg-cyan-450 text-zinc-950 font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Volume2 className="w-4 h-4" /> Start Connected Speech Lab
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: CONCEPT EXPLANATION */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            What is Connected Speech?
          </h2>

          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
              <h3 className="font-bold text-white mb-1">1. Words Don't Live Alone</h3>
              <p className="text-zinc-400">In real conversation, words are spoken smoothly in phrase blocks rather than one-by-one. This causes boundaries to blend and function particles to reduce.</p>
            </div>

            {/* PatternList */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1.5">
              <h3 className="font-bold text-white">2. Connected Speech Patterns</h3>
              <ul className="list-disc list-inside text-zinc-400 space-y-1 pl-1">
                <li><strong>Consonant-to-vowel links:</strong> final batchim links forward to vowel placeholders (e.g. 밥을 is [바블]).</li>
                <li><strong>Fewer pauses:</strong> brief pauses only at chunk margins, not between single words.</li>
                <li><strong>Mild reductions:</strong> particles 은/는/이/가/을/를 sound lighter in quick speech.</li>
              </ul>
            </div>
          </div>

          {/* BeforeAfterExample */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200">Before & After connected example:</h3>
            {(coreData?.pattern_examples || []).map((ex: any) => (
              <div key={ex.sentence} className="space-y-2">
                <p className="font-extrabold text-sm text-center text-white">{ex.sentence}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div 
                    onClick={() => playAudio(ex.sentence)} 
                    className="p-3 bg-zinc-900 border border-white/5 hover:border-indigo-500/30 transition rounded-xl text-center cursor-pointer"
                  >
                    <span className="block font-semibold text-zinc-400">Careful styling:</span>
                    <span className="text-[10px] text-zinc-500 block mt-1">{ex.careful_notes}</span>
                  </div>
                  <div 
                    onClick={() => playAudio(ex.sentence)} 
                    className="p-3 bg-zinc-900 border border-white/5 hover:border-teal-500/30 transition rounded-xl text-center cursor-pointer"
                  >
                    <span className="block font-semibold text-teal-300">Connected speech:</span>
                    <span className="text-[10px] text-zinc-550 block mt-1">{ex.connected_notes}</span>
                  </div>
                </div>
              </div>
            ))}
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

      {/* SCREEN 3: ACTIVITY 1: HEAR LINKING & REDUCTION */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 1: Hear Blends & Reductions
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Identify careful vs connected versions, links, and particles</h2>
          </div>

          {/* Activity 1A: Careful vs Connected */}
          {ccItems.length > 0 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Careful vs Connected Speech</span>
                <span>Sentence {ccIdx + 1} of {ccItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-2">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold text-center">Compare target sentence:</span>
                <span className="text-base font-extrabold text-white block text-center">{ccItems[ccIdx]?.sentence}</span>
                
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button 
                    onClick={() => playAudio(ccItems[ccIdx].sentence)}
                    className="py-2.5 px-3 bg-zinc-955 hover:bg-slate-800 border border-white/5 text-xs text-zinc-350 rounded-lg cursor-pointer"
                  >
                    Play Version A (Careful)
                  </button>
                  <button 
                    onClick={() => playAudio(ccItems[ccIdx].sentence)}
                    className="py-2.5 px-3 bg-zinc-955 hover:bg-slate-800 border border-white/5 text-xs text-cyan-300 rounded-lg cursor-pointer"
                  >
                    Play Version B (Connected)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-zinc-400 block font-bold">Which version sounds more natural in daily speech?</span>
                <div className="grid grid-cols-2 gap-2">
                  {["Version A", "Version B"].map(opt => (
                    <button
                      key={opt}
                      onClick={() => !ccChecked && setCcSelected(opt)}
                      className={`py-3 rounded-xl text-xs font-semibold border transition text-center ${
                        ccSelected === opt 
                          ? "border-cyan-500 bg-cyan-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                      } ${ccChecked && opt === ccItems[ccIdx].correct ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                      disabled={ccChecked}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {ccChecked && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${ccCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                  <strong>{ccCorrect ? "Correct!" : "Incorrect."}</strong> {ccItems[ccIdx].note}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!ccChecked ? (
                  <button
                    onClick={handleCheckCc}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-750 text-xs font-bold rounded-lg text-zinc-200 transition cursor-pointer"
                    disabled={!ccSelected}
                  >
                    Check Naturalness
                  </button>
                ) : (
                  ccIdx < ccItems.length - 1 && (
                    <button
                      onClick={handleNextCc}
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                    >
                      Next Sentence
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Activity 1B: Where does it link? */}
          {llItems.length > 0 && ccChecked && ccIdx === ccItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Consonant-to-Vowel Link points</span>
                <span>Sentence {llIdx + 1} of {llItems.length}</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => playAudio(llItems[llIdx].sentence.replace(/ \/ /g, " "))}
                    className="p-2.5 bg-zinc-900 border border-white/5 rounded-full hover:bg-slate-800 text-cyan-400 cursor-pointer"
                  >
                    <Volume2 className="w-4.5 h-4.5" />
                  </button>
                  <span className="text-xs text-zinc-400">Tap between word divisions where linking occurs in connected audio:</span>
                </div>

                <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 flex flex-wrap gap-2 items-center justify-center">
                  {llItems[llIdx].sentence.split(" / ").map((word: string, wIdx: number, arr: string[]) => (
                    <div key={wIdx} className="flex items-center gap-1">
                      <span className="text-sm font-bold text-white">{word}</span>
                      {wIdx < arr.length - 1 && (
                        <button
                          onClick={() => handleToggleLinkIndex(wIdx)}
                          disabled={llChecked}
                          className={`w-6 h-6 rounded-full border text-[10px] font-mono flex items-center justify-center transition cursor-pointer ${
                            llSelectedIndices.includes(wIdx) 
                              ? "bg-teal-500 border-teal-400 text-white font-bold" 
                              : "border-white/10 bg-zinc-950 text-zinc-500 hover:border-teal-400"
                          } ${llChecked && llItems[llIdx].linkable_indices.includes(wIdx) ? "border-green-500 bg-green-500/10 text-green-300" : ""}`}
                        >
                          🔗
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {llChecked && (
                <div className="bg-indigo-950/20 border border-indigo-900 p-4 rounded-xl text-xs text-indigo-300">
                  <strong>Notice:</strong> {llItems[llIdx].explanation}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!llChecked ? (
                  <button
                    onClick={handleCheckLl}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-750 text-xs font-bold rounded-lg text-zinc-200 transition cursor-pointer"
                  >
                    Verify Links
                  </button>
                ) : (
                  llIdx < llItems.length - 1 && (
                    <button
                      onClick={handleNextLl}
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                    >
                      Next Sentence
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Activity 1C: Spot the reduction */}
          {rdItems.length > 0 && llChecked && llIdx === llItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Spot the Particle Reduction</span>
                <span>Sentence {rdIdx + 1} of {rdItems.length}</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => playAudio(rdItems[rdIdx].sentence)}
                    className="py-2 px-4 bg-zinc-900 border border-white/5 rounded-xl text-xs text-zinc-350 cursor-pointer"
                  >
                    Citation Audio
                  </button>
                  <button
                    onClick={() => playAudio(rdItems[rdIdx].sentence)}
                    className="py-2 px-4 bg-zinc-900 border border-white/5 rounded-xl text-xs text-cyan-300 cursor-pointer"
                  >
                    Connected Speech
                  </button>
                </div>

                <p className="text-xs text-zinc-400">Select which particles or endings sounded reduced (lighter/shorter):</p>
                
                <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 flex flex-wrap gap-1.5 items-center justify-center leading-loose">
                  {rdItems[rdIdx].sentence.split(" ").map((tok: string, tIdx: number) => {
                    const isSelectable = rdItems[rdIdx].reducible_words.some((rw: string) => tok.endsWith(rw));
                    const isSelected = rdSelectedWords.includes(tok);
                    return (
                      <button
                        key={tIdx}
                        onClick={() => isSelectable && handleToggleReductionWord(tok)}
                        disabled={rdChecked || !isSelectable}
                        className={`px-3 py-1 rounded-lg text-xs transition border ${
                          !isSelectable 
                            ? "bg-transparent border-transparent text-white font-bold" 
                            : isSelected 
                              ? "bg-cyan-500/20 border-cyan-400 text-white font-bold cursor-pointer" 
                              : "bg-zinc-950 border-white/5 text-zinc-400 hover:border-cyan-400 cursor-pointer"
                        }`}
                      >
                        {tok}
                      </button>
                    );
                  })}
                </div>
              </div>

              {rdChecked && (
                <div className="bg-indigo-950/20 border border-indigo-900 p-4 rounded-xl text-xs text-indigo-300">
                  <strong>Analysis:</strong> {rdItems[rdIdx].note}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!rdChecked ? (
                  <button
                    onClick={handleCheckRd}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-750 text-xs font-bold rounded-lg text-zinc-200 transition cursor-pointer"
                  >
                    Confirm Reductions
                  </button>
                ) : (
                  rdIdx < rdItems.length - 1 ? (
                    <button
                      onClick={handleNextRd}
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                    >
                      Next Sentence
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
              onClick={() => setStep(2)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 4: ACTIVITY 2: SPEAK CONNECTED SENTENCES */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 2: Fluency Speaking
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Speak in connected blocks and keep a steady speech rate</h2>
          </div>

          {/* Activity 2A: Shadowing careful → connected */}
          {shadowItems.length > 0 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Shadowing (Careful vs Connected)</span>
                <span>Sentence {shadowIdx + 1} of {shadowItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-3">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Target Sentence:</span>
                <span className="text-lg font-black text-white block">{shadowItems[shadowIdx]?.sentence}</span>

                <div className="flex justify-center gap-2 pt-1">
                  <button
                    onClick={() => setShadowMode("careful")}
                    className={`py-1 px-2.5 rounded-lg border text-[10px] font-mono transition ${
                      shadowMode === "careful" ? "border-indigo-400 bg-indigo-500/10 text-indigo-300" : "border-white/5 bg-zinc-950 text-zinc-450"
                    }`}
                  >
                    Careful Tempo (80 BPM)
                  </button>
                  <button
                    onClick={() => setShadowMode("connected")}
                    className={`py-1 px-2.5 rounded-lg border text-[10px] font-mono transition ${
                      shadowMode === "connected" ? "border-teal-400 bg-teal-500/10 text-teal-300" : "border-white/5 bg-zinc-950 text-zinc-450"
                    }`}
                  >
                    Connected Tempo (115 BPM)
                  </button>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => playAudio(shadowItems[shadowIdx]?.sentence)}
                    className="p-3 bg-zinc-955 border border-white/10 hover:border-cyan-400/30 text-cyan-400 hover:text-cyan-300 rounded-full transition cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleRecordShadow}
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

              {shadowEvaluated && (
                <div className="bg-emerald-950/20 border border-emerald-900 p-4 rounded-xl text-xs space-y-2 text-emerald-300">
                  <div className="grid grid-cols-2 gap-2 text-center border-b border-white/5 pb-2 font-bold mb-2">
                    <div>Micro-Pauses: {shadowPauses} detected</div>
                    <div>Link Success: {shadowLinkScore}%</div>
                  </div>
                  <p className="text-zinc-450 text-[11px] leading-relaxed">{shadowFeedback}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {shadowEvaluated && (
                  <button
                    onClick={handleNextShadow}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Sentence
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2B: Link the chain */}
          {chainItems.length > 0 && shadowEvaluated && shadowIdx === shadowItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Link the Chain Phrases</span>
                <span>Chain {chainIdx + 1} of {chainItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="text-[10px] text-zinc-550 block uppercase font-bold">Speak each breath group as a single block:</span>
                
                <div className="flex justify-center gap-3 items-center py-2">
                  {chainItems[chainIdx]?.chains?.map((ch: string, idx: number) => {
                    const status = chainStatuses[`chain_${idx}`];
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-lg border text-sm font-bold ${
                          status === "green" 
                            ? "bg-green-500/10 border-green-400 text-green-300" 
                            : "bg-zinc-950 border-white/5 text-white"
                        }`}>
                          {ch}
                        </span>
                        {idx < chainItems[chainIdx].chains.length - 1 && <span className="text-zinc-600">/</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => playAudio(chainItems[chainIdx]?.text)}
                    className="p-2.5 bg-zinc-950 border border-white/10 hover:border-cyan-400/30 text-cyan-400 hover:text-cyan-300 rounded-full transition cursor-pointer"
                  >
                    <Volume2 className="w-4.5 h-4.5" />
                  </button>

                  <button
                    onClick={handleRecordChain}
                    disabled={recording}
                    className={`py-2 px-5 rounded-xl transition border text-xs font-bold flex items-center gap-2 cursor-pointer ${
                      recording 
                        ? "bg-red-500/20 border-red-500 text-red-400" 
                        : "bg-cyan-500 hover:bg-cyan-450 text-zinc-950 font-bold"
                    }`}
                  >
                    {recording ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                    <span>Record Chain</span>
                  </button>
                </div>
              </div>

              {chainEvaluated && (
                <div className="bg-indigo-950/20 border border-indigo-900 p-4 rounded-xl text-xs space-y-1 text-indigo-300">
                  <div className="font-bold">Chain Phrasing Accuracy: {chainScore}%</div>
                  <p className="text-zinc-455 leading-relaxed">{chainFeedback}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {chainEvaluated && (
                  <button
                    onClick={handleNextChain}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Chain
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2C: Describe with flow B1 guided monologue */}
          {guidedItems.length > 0 && chainEvaluated && chainIdx === chainItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: B1 guided speaking routine description</span>
                <span>Topic {guidedIdx + 1} of {guidedItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="text-[10px] text-zinc-550 block uppercase font-bold">Spoken Prompt:</span>
                <span className="text-sm font-extrabold text-white block">{guidedItems[guidedIdx]?.prompt}</span>
                <span className="text-[10px] text-zinc-500 block italic">Tip: {guidedItems[guidedIdx]?.tips}</span>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] text-zinc-500 uppercase block font-bold">Select scaffolds to include:</span>
                  <div className="flex flex-col gap-2">
                    {guidedItems[guidedIdx]?.scaffolds?.map((sc: string) => {
                      const isSelected = guidedSelectedScaffolds.includes(sc);
                      return (
                        <button
                          key={sc}
                          onClick={() => handleToggleScaffold(sc)}
                          className={`py-2 px-3 border text-xs font-semibold rounded-lg transition text-left ${
                            isSelected ? "border-cyan-450 bg-cyan-500/10 text-white" : "border-white/5 bg-zinc-950 text-zinc-400"
                          }`}
                        >
                          {sc}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={handleRecordGuided}
                    disabled={recording || guidedSelectedScaffolds.length === 0}
                    className={`py-2.5 px-6 rounded-xl transition border text-xs font-bold flex items-center gap-2 cursor-pointer ${
                      recording 
                        ? "bg-red-500/20 border-red-500 text-red-400" 
                        : "bg-cyan-500 hover:bg-cyan-450 text-zinc-950 font-bold"
                    }`}
                  >
                    {recording ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                    <span>Record Monologue</span>
                  </button>
                </div>
              </div>

              {guidedEvaluated && (
                <div className="bg-indigo-950/20 border border-indigo-900 p-4 rounded-xl text-xs space-y-2 text-indigo-300">
                  <div className="grid grid-cols-3 gap-2 text-center border-b border-white/5 pb-2 font-bold mb-2">
                    <div>Speech Rate: {guidedRate} syl/sec</div>
                    <div>Pauses: {guidedPauses}</div>
                    <div>Choppiness: {guidedChoppiness}</div>
                  </div>
                  <p className="text-zinc-450 text-[11px] leading-relaxed">{guidedFeedback}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {guidedEvaluated && (
                  guidedIdx < guidedItems.length - 1 ? (
                    <button
                      onClick={handleNextGuided}
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                    >
                      Next Topic
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
              Mini-Quiz: Connected Speech Check
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Connected Speech Recognition Checks</h2>
          </div>

          {quizBlueprint.length > 0 && quizScore === null && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Quiz Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-900 px-1.5 py-0.5 rounded uppercase font-bold font-mono">
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
              <Award className="w-12 h-12 text-yellow-500 mx-auto" />
              <div>
                <h3 className="font-black text-xl text-white tracking-tight">Connected Speech Check Completed</h3>
                <span className="text-4xl font-black text-white block mt-1">{quizScore}%</span>
                <p className="text-xs text-zinc-400 mt-2">
                  {quizScore >= 80 ? "Pass! You understand liaison link indices, particle reductions, and speech boundaries." : "Did not pass. We recommend reviewing Activity 1B/1C and retaking this check."}
                </p>
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
              Homework & Fluency Coach
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Consolidate connected speech with daily routines</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
              <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-bold block">Assigned Tasks:</span>
              <ul className="space-y-2.5 text-zinc-350 pl-1 divide-y divide-white/5">
                {homeworkItems.map((item, idx) => (
                  <div key={item.id} className="pt-2.5 first:pt-0">
                    <p className="font-semibold text-white">Task {idx + 1}: {item.text.split(":")[0]}</p>
                    <p className="text-zinc-450 leading-relaxed mt-0.5">{item.text.split(":")[1]}</p>
                  </div>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
              <span className="text-[10px] text-zinc-500 uppercase block font-bold">Upload monologues & reflections:</span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Task Type (shadow/talk)"
                  value={hwSents[0]}
                  onChange={(e) => handleHwChange(0, e.target.value)}
                  className="bg-zinc-900 border border-white/5 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="Topic/Reflection"
                  value={hwSents[1]}
                  onChange={(e) => handleHwChange(1, e.target.value)}
                  className="bg-zinc-900 border border-white/5 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-655 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="Calculated speech rate Notes"
                  value={hwSents[2]}
                  onChange={(e) => handleHwChange(2, e.target.value)}
                  className="bg-zinc-900 border border-white/5 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-655 focus:outline-none focus:border-cyan-400"
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
                  <span>Log Fluency Homework</span>
                </button>
              </div>
            </div>

            {hwFeedback && (
              <div className="bg-emerald-950/20 border border-emerald-900 p-4 rounded-xl space-y-1 text-emerald-300">
                <div className="font-bold">AI Coach Fluency Feedback:</div>
                <p className="text-zinc-450 leading-relaxed">{hwFeedback.feedback}</p>
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] mt-1 pt-1 border-t border-white/5">
                  <div>Speech rate: {hwFeedback.speech_rate} syl/sec</div>
                  <div>Average pause: {hwFeedback.average_pause_sec}s</div>
                </div>
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
              <span>Complete Phase 6 Lab</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
