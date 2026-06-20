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
  Grid,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Trophy,
  Star
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

interface Course8Phase12MediaWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course8Phase12MediaWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course8Phase12MediaWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);

  // Loaded data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1A: Media Gist
  const [gistItems, setGistItems] = useState<any[]>([]);
  const [gistIdx, setGistIdx] = useState(0);
  const [gistSelected, setGistSelected] = useState<string | null>(null);
  const [gistChecked, setGistChecked] = useState(false);
  const [gistCorrect, setGistCorrect] = useState<boolean | null>(null);
  const [gistFeedbackStr, setGistFeedbackStr] = useState("");

  // Activity 1B: Speaker's opinion
  const [opinionItems, setOpinionItems] = useState<any[]>([]);
  const [opinionIdx, setOpinionIdx] = useState(0);
  const [opinionSelected, setOpinionSelected] = useState<string | null>(null);
  const [opinionChecked, setOpinionChecked] = useState(false);
  const [opinionCorrect, setOpinionCorrect] = useState<boolean | null>(null);
  const [opinionFeedbackStr, setOpinionFeedbackStr] = useState("");

  // Activity 1C: Key arguments or reasons
  const [reasonsItems, setReasonsItems] = useState<any[]>([]);
  const [reasonsIdx, setReasonsIdx] = useState(0);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [reasonsChecked, setReasonsChecked] = useState(false);
  const [reasonsFeedbackStr, setReasonsFeedbackStr] = useState("");

  // Activity 2A: Oral Summary
  const [oralSummaryItems, setOralSummaryItems] = useState<any[]>([]);
  const [summaryIdx, setSummaryIdx] = useState(0);
  const [summaryNotes, setSummaryNotes] = useState("");
  const [recordingMode, setRecordingMode] = useState<"none" | "summary" | "react" | "retell" | "coach">("none");
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [summaryEvaluation, setSummaryEvaluation] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);

  // Activity 2B: Opinion Reaction
  const [opinionReactItems, setOpinionReactItems] = useState<any[]>([]);
  const [opinionReactIdx, setOpinionReactIdx] = useState(0);
  const [opinionReactEvaluation, setOpinionReactEvaluation] = useState<any>(null);

  // Activity 2C: Retell to friend
  const [retellItems, setRetellItems] = useState<any[]>([]);
  const [retellIdx, setRetellIdx] = useState(0);
  const [retellEvaluation, setRetellEvaluation] = useState<any>(null);

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
  const [coachTopic, setCoachTopic] = useState("news report");
  const [coachEvaluation, setCoachEvaluation] = useState<any>(null);
  const [hwFeedback, setHwFeedback] = useState<any>(null);
  const [submittingHw, setSubmittingHw] = useState(false);
  const [completingLab, setCompletingLab] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/12/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/12/core-data");
          setCoreData(res);
        } else if (step === 3) {
          if (gistItems.length === 0) {
            const resG = await apiJson("/phase-12/items/media-gist");
            setGistItems(resG);
          }
          if (opinionItems.length === 0) {
            const resO = await apiJson("/phase-12/items/media-opinion");
            setOpinionItems(resO);
          }
          if (reasonsItems.length === 0) {
            const resR = await apiJson("/phase-12/items/media-reasons");
            setReasonsItems(resR);
          }
        } else if (step === 4) {
          if (oralSummaryItems.length === 0) {
            const resS = await apiJson("/phase-12/items/oral-summary");
            setOralSummaryItems(resS);
          }
          if (opinionReactItems.length === 0) {
            const resR = await apiJson("/phase-12/items/media-opinion-react");
            setOpinionReactItems(resR);
          }
          if (retellItems.length === 0) {
            const resT = await apiJson("/phase-12/items/media-retell");
            setRetellItems(resT);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/phase-12/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-12/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading PLS Lab Phase 12:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Recording Simulation
  const triggerRecording = (mode: "summary" | "react" | "retell" | "coach", durationSeconds = 5) => {
    setRecordingMode(mode);
    setRecordingProgress(100);
    const interval = setInterval(() => {
      setRecordingProgress(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          setRecordingMode("none");
          finalizeEvaluation(mode);
          return 0;
        }
        return prev - (100 / (durationSeconds * 10));
      });
    }, 100);
  };

  const finalizeEvaluation = async (mode: "summary" | "react" | "retell" | "coach") => {
    setEvaluating(true);
    try {
      if (mode === "summary") {
        const res = await apiJson("/phase-12/items/oral-summary/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: "os_1", audio_base64: "mock_data" })
        });
        setSummaryEvaluation(res);
      } else if (mode === "react") {
        const res = await apiJson("/phase-12/items/media-opinion-react/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: "mor_1", audio_base64: "mock_data" })
        });
        setOpinionReactEvaluation(res);
      } else if (mode === "retell") {
        const res = await apiJson("/phase-12/items/media-retell/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: "mrt_1", audio_base64: "mock_data" })
        });
        setRetellEvaluation(res);
      } else if (mode === "coach") {
        const res = await apiJson("/phase-12/homework/submit", {
          method: "POST",
          body: JSON.stringify({ sentences: ["Media summary uploaded"] })
        });
        setCoachEvaluation(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  // Activity 1A check
  const handleCheckGist = async () => {
    const current = gistItems[gistIdx];
    if (!current || !gistSelected) return;
    try {
      const res = await apiJson("/phase-12/items/media-gist/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: gistSelected })
      });
      setGistCorrect(res.correct);
      setGistChecked(true);
      setGistFeedbackStr(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 1B check
  const handleCheckOpinion = async () => {
    const current = opinionItems[opinionIdx];
    if (!current || !opinionSelected) return;
    try {
      const res = await apiJson("/phase-12/items/media-opinion/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: opinionSelected })
      });
      setOpinionCorrect(res.correct);
      setOpinionChecked(true);
      setOpinionFeedbackStr(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 1C checkbox toggle
  const toggleReasonsCheckbox = (opt: string) => {
    if (reasonsChecked) return;
    setSelectedReasons(prev => 
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    );
  };

  const handleCheckReasons = async () => {
    const current = reasonsItems[reasonsIdx];
    if (!current) return;
    try {
      const res = await apiJson("/phase-12/items/media-reasons/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: selectedReasons.join(",") })
      });
      setReasonsChecked(true);
      setReasonsFeedbackStr(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  // Quiz handlers
  const handleCheckQuizAnswer = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelected) return;
    try {
      const res = await apiJson("/phase-12/quiz/answer", {
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
        await apiJson("/phase-12/quiz/finish", {
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
      const res = await apiJson("/phase-12/homework/submit", {
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
      await apiJson("/phase-12/complete", { method: "POST" });
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingLab(false);
    }
  };

    const outlineSteps = [
    { num: 1, label: "= 1 ? \"bg-yellow-500\" : \"bg-slate-700\"}`} /> Screen 1: Welcome Overview (Capstone)" },
    { num: 2, label: "= 2 ? \"bg-orange-500\" : \"bg-slate-700\"}`} /> Screen 2: B2 Media Listening & Integrated Tasks" },
    { num: 3, label: "= 3 ? \"bg-amber-500\" : \"bg-slate-700\"}`} /> Screen 3: Activity 1: Real-World Gist, Opinions & Reasons" },
    { num: 4, label: "= 4 ? \"bg-yellow-600\" : \"bg-slate-700\"}`} /> Screen 4: Activity 2: Summarise & React (Spoken monologues)" },
    { num: 5, label: "= 5 ? \"bg-orange-600\" : \"bg-slate-700\"}`} /> Screen 5: Mini-Quiz: B2 Media Listening Check" },
    { num: 6, label: "= 6 ? \"bg-yellow-500\" : \"bg-slate-700\"}`} /> Screen 6: Homework & Real-World Media Coach" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 8,
          phaseNum: 12,
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
          <Trophy className="w-5 h-5 text-yellow-400" />
          <div>
            <h2 className="font-extrabold text-lg flex items-center gap-1.5">
              <span>Media Lab</span>
              <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Capstone</span>
            </h2>
            <p className="text-xs text-zinc-400">Real‑World Listening & Reaction (B2)</p>
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
        <div className="glass-panel border border-yellow-500/20 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center relative overflow-hidden">
          <div className="relative mx-auto w-fit">
            <div className="p-4 bg-yellow-500/10 rounded-full border border-yellow-500/25 text-yellow-400">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-brand-500 rounded-full border-2 border-zinc-950">
              <Star className="w-3 h-3 text-white fill-white animate-spin-slow" />
            </div>
          </div>

          <div>
            <h2 className="text-5xl font-black text-white tracking-tight font-sans">{metadata?.title || "Media Lab – Real‑World Listening & Reaction (B2)"}</h2>
            <h3 className="text-md font-bold text-yellow-400 mt-1">{metadata?.subtitle || "Understand real audio and respond naturally."}</h3>
          </div>

          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "In this lab, you’ll practise listening to real‑world Korean audio like news bites, mini podcasts, and interviews, and then summarising and reacting to what you heard at B2 level."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Focus Milestones:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Work with authentic or semi‑authentic B2 audio",
                "Catch main ideas and key opinions",
                "Summarise in your own words and respond with your view"
              ]).map((g: string, i: number) => <li key={i}>{g}</li>)}
            </ul>
            <p className="pt-2 text-zinc-400"><strong>⏱️ Est. Lab Time:</strong> 35 minutes</p>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl mx-auto">
            {["B2 Capstone", "Authentic listening", "Integrated skills", "Final Rewards"].map(chip => (
              <span key={chip} className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[10px] text-yellow-300 font-bold">{chip}</span>
            ))}
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => setStep(2)} 
              className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-zinc-955 font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/20"
            >
              <Trophy className="w-4 h-4 text-zinc-950" /> Start Media Lab Capstone
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: CONCEPT EXPLANATION */}
      {step === 2 && (
        <div className="glass-panel border border-yellow-500/20 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-450 to-orange-450 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            B2 Media Listening & Integrated Tasks
          </h2>

          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed max-h-[50vh] overflow-y-auto pr-1">
            <div className="bg-zinc-950 p-4 rounded-xl border border-yellow-500/10 space-y-1">
              <h3 className="font-bold text-yellow-400 mb-1">What B2 listening targets</h3>
              <p className="text-zinc-400">Understand extended standard speech on familiar or general topics even when ideas and arguments are complex. Focus on following lifestyle commentaries, podcasts, and mini news segments.</p>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-yellow-500/10 space-y-1">
              <h3 className="font-bold text-yellow-400 mb-1">Integrated Tasks (Input → Process → Output)</h3>
              <p className="text-zinc-400">At B2 level, listening is rarely isolated. This lab trains the full integrated chain: listen to media clips, classify arguments and attitudes, draft brief notes, and then produce spoken summaries or reaction monologues.</p>
            </div>

            {coreData?.media_clips && (
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-2">
                <h4 className="font-bold text-yellow-400">Available In-App Clips:</h4>
                <div className="space-y-3">
                  {coreData.media_clips.map((clip: any) => (
                    <div key={clip.id} className="border-l-2 border-yellow-500/50 pl-3 flex justify-between items-start gap-2">
                      <div>
                        <span className="font-bold text-white block text-[11px]">{clip.title} ({clip.topic})</span>
                        <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">Type: {clip.type} | Duration: {clip.length}</p>
                      </div>
                      <button
                        onClick={() => playAudio(clip.audio_text)}
                        className="py-1 px-2.5 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-[10px] font-bold rounded cursor-pointer shrink-0 inline-flex items-center gap-1 transition"
                      >
                        <Play className="w-3 h-3 text-zinc-955" /> Play
                      </button>
                    </div>
                  ))}
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
              className="flex items-center gap-1 py-2.5 px-6 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Media Comprehension
              <ChevronRight className="w-4 h-4 text-zinc-950" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: ACTIVITY 1: MEDIA COMPREHENSION */}
      {step === 3 && (
        <div className="glass-panel border border-yellow-500/20 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div>
            <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 1: Real‑World Gist & Opinion
            </span>
            <h2 className="text-lg font-bold mt-2 text-white">Extract main themes, speaker attitudes, and factual claims</h2>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 text-xs">
            {/* Activity 1A: Media Gist */}
            {gistItems.length > 0 && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="font-bold text-yellow-400 block border-b border-white/5 pb-1">Activity 1A: What is this about?</span>
                
                <button
                  onClick={() => playAudio(gistItems[gistIdx].audio_text)}
                  className="py-1.5 px-3 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 text-[10px] font-bold rounded cursor-pointer inline-flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5 text-yellow-400" /> Listen to Audio
                </button>

                <div className="space-y-2">
                  {gistItems[gistIdx].options.map((opt: string) => {
                    const isSelected = gistSelected === opt;
                    return (
                      <button
                        key={opt}
                        disabled={gistChecked}
                        onClick={() => setGistSelected(opt)}
                        className={`w-full text-left p-3 rounded border text-[11px] transition flex justify-between items-center ${
                          isSelected
                            ? "border-yellow-500 bg-yellow-500/10 text-white"
                            : "border-white/5 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                        } ${gistChecked && opt === gistItems[gistIdx].correct ? "border-green-500 bg-green-500/10 text-green-300" : ""}`}
                      >
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {!gistChecked ? (
                  <button
                    disabled={!gistSelected}
                    onClick={handleCheckGist}
                    className="w-full py-2 bg-yellow-500 text-zinc-950 font-bold rounded-lg hover:bg-yellow-400 transition cursor-pointer mt-1 disabled:opacity-50"
                  >
                    Check Gist Answer
                  </button>
                ) : (
                  <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 text-yellow-400 rounded-lg text-[10px] leading-relaxed">
                    <strong>Gist Explanation:</strong> {gistFeedbackStr}
                  </div>
                )}
              </div>
            )}

            {/* Activity 1B: Speaker's opinion */}
            {opinionItems.length > 0 && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="font-bold text-orange-400 block border-b border-white/5 pb-1">Activity 1B: Speaker's opinion / attitude</span>
                
                <div className="space-y-2">
                  {opinionItems[opinionIdx].options.map((opt: string) => {
                    const isSelected = opinionSelected === opt;
                    return (
                      <button
                        key={opt}
                        disabled={opinionChecked}
                        onClick={() => setOpinionSelected(opt)}
                        className={`w-full text-left p-3 rounded border text-[11px] transition flex justify-between items-center ${
                          isSelected
                            ? "border-orange-500 bg-orange-500/10 text-white"
                            : "border-white/5 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                        } ${opinionChecked && opt === opinionItems[opinionIdx].correct ? "border-green-500 bg-green-500/10 text-green-300" : ""}`}
                      >
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {!opinionChecked ? (
                  <button
                    disabled={!opinionSelected}
                    onClick={handleCheckOpinion}
                    className="w-full py-2 bg-orange-500 text-zinc-955 font-bold rounded-lg hover:bg-orange-400 transition cursor-pointer mt-1 disabled:opacity-50"
                  >
                    Check Opinion Answer
                  </button>
                ) : (
                  <div className="p-3 bg-orange-500/5 border border-orange-500/10 text-orange-400 rounded-lg text-[10px] leading-relaxed">
                    <strong>Opinion Explanation:</strong> {opinionFeedbackStr}
                  </div>
                )}
              </div>
            )}

            {/* Activity 1C: Key arguments checklist */}
            {reasonsItems.length > 0 && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="font-bold text-amber-400 block border-b border-white/5 pb-1">Activity 1C: Key arguments or reasons</span>
                <p className="text-zinc-400 text-[10px]">Select all claims that were explicitly stated in the media segment:</p>

                <div className="space-y-1.5">
                  {reasonsItems[reasonsIdx].options.map((opt: string) => {
                    const isChecked = selectedReasons.includes(opt);
                    const isCorrectChoice = reasonsItems[reasonsIdx].correct_choices.includes(opt);
                    
                    return (
                      <div
                        key={opt}
                        onClick={() => toggleReasonsCheckbox(opt)}
                        className={`flex items-center gap-2.5 p-3 rounded border text-[11px] transition cursor-pointer ${
                          isChecked
                            ? "border-amber-500 bg-amber-500/10 text-white"
                            : "border-white/5 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                        } ${reasonsChecked && isCorrectChoice ? "border-green-500 bg-green-500/10 text-green-300" : ""}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isChecked ? "bg-amber-500 border-amber-500 text-zinc-950" : "border-zinc-700"}`}>
                          {isChecked && <Check className="w-3 h-3 text-zinc-950" />}
                        </div>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {!reasonsChecked ? (
                  <button
                    onClick={handleCheckReasons}
                    className="w-full py-2 bg-amber-500 text-zinc-955 font-bold rounded-lg hover:bg-amber-400 transition cursor-pointer mt-1"
                  >
                    Verify Claims Checklist
                  </button>
                ) : (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 text-amber-400 rounded-lg text-[10px] leading-relaxed">
                    <strong>Feedback:</strong> {reasonsFeedbackStr}
                  </div>
                )}
              </div>
            )}
          </div>

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
              className="flex items-center gap-1 py-2.5 px-6 bg-yellow-500 hover:bg-yellow-400 text-zinc-955 font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Integrated Speaking
              <ChevronRight className="w-4 h-4 text-zinc-955" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 4: ACTIVITY 2: INTEGRATED SPEAKING */}
      {step === 4 && (
        <div className="glass-panel border border-yellow-500/20 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div>
            <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 2: Summarise & React
            </span>
            <h2 className="text-lg font-bold mt-2 text-white">Convert media comprehension into cohesive spoken output</h2>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 text-xs">
            {/* Activity 2A: Oral Summary */}
            {oralSummaryItems.length > 0 && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="font-bold text-yellow-400 block border-b border-white/5 pb-1">Activity 2A: 30‑second oral summary</span>
                
                <div className="bg-zinc-900 p-3 rounded border border-white/5 space-y-1.5 leading-relaxed text-zinc-400 text-[10px]">
                  <span className="font-bold text-white block">Summary Scaffolds:</span>
                  <p>&bull; <strong>Topic:</strong> {oralSummaryItems[summaryIdx].hints.topic}</p>
                  <p>&bull; <strong>Main Point:</strong> {oralSummaryItems[summaryIdx].hints.main_point}</p>
                  <p>&bull; <strong>Key Detail:</strong> {oralSummaryItems[summaryIdx].hints.detail}</p>
                </div>

                <textarea
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                  placeholder="Optional: Jot down 3 quick notes before recording..."
                  className="w-full bg-zinc-900 border border-white/10 rounded p-2 text-white text-[10px] outline-none"
                />

                <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-white/5">
                  <button
                    disabled={recordingMode !== "none"}
                    onClick={() => triggerRecording("summary", 4)}
                    className="py-1.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Mic className="w-3.5 h-3.5 animate-pulse" /> Record Summary (30-45s)
                  </button>

                  {recordingMode === "summary" && (
                    <div className="w-32 bg-zinc-950 h-2 rounded overflow-hidden">
                      <div className="bg-red-500 h-full transition-all duration-100" style={{ width: `${recordingProgress}%` }} />
                    </div>
                  )}
                </div>

                {evaluating && (
                  <div className="text-center py-2 text-zinc-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                    <span>Analyzing summary content coverage...</span>
                  </div>
                )}

                {summaryEvaluation && (
                  <div className="p-4 bg-yellow-500/5 border border-yellow-500/15 rounded-xl space-y-3">
                    <div className="flex justify-between text-[11px] font-bold border-b border-white/5 pb-1.5">
                      <span className="text-yellow-400">Summary Coverage checklist:</span>
                      <span className="text-white">Overall: {summaryEvaluation.score}%</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[9px] text-center">
                      <div className={`p-1 rounded ${summaryEvaluation.checklist.main_point ? "bg-green-950/20 text-green-450 border border-green-900/40" : "bg-zinc-900"}`}>Main Point</div>
                      <div className={`p-1 rounded ${summaryEvaluation.checklist.detail_1 ? "bg-green-950/20 text-green-450 border border-green-900/40" : "bg-zinc-900"}`}>Detail 1</div>
                      <div className={`p-1 rounded ${summaryEvaluation.checklist.detail_2 ? "bg-green-950/20 text-green-450 border border-green-900/40" : "bg-zinc-900"}`}>Detail 2</div>
                    </div>
                    <p className="text-[10px] text-zinc-455 leading-relaxed"><strong>Fluency Advice:</strong> {summaryEvaluation.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {/* Activity 2B: Opinion Reaction */}
            {opinionReactItems.length > 0 && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="font-bold text-orange-400 block border-b border-white/5 pb-1">Activity 2B: Give your opinion about what you heard</span>
                <p className="text-white font-medium text-[11px]">{opinionReactItems[opinionReactIdx].prompt}</p>

                <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-white/5">
                  <button
                    disabled={recordingMode !== "none"}
                    onClick={() => triggerRecording("react", 6)}
                    className="py-1.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Mic className="w-3.5 h-3.5 animate-pulse" /> Record Opinion (60-90s)
                  </button>

                  {recordingMode === "react" && (
                    <div className="w-32 bg-zinc-950 h-2 rounded overflow-hidden">
                      <div className="bg-red-500 h-full transition-all duration-100" style={{ width: `${recordingProgress}%` }} />
                    </div>
                  )}
                </div>

                {opinionReactEvaluation && (
                  <div className="p-3 bg-orange-500/5 border border-orange-500/15 rounded-xl space-y-2 text-[10px] text-zinc-400">
                    <div className="flex justify-between text-orange-400 font-bold">
                      <span>Integrated Opinion Map:</span>
                      <span>Score: {opinionReactEvaluation.score}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[9px] text-center font-mono">
                      <div className={`p-1 rounded ${opinionReactEvaluation.checklist.opinion ? "bg-green-950/20 text-green-450" : "bg-zinc-900"}`}>Opinion Stance</div>
                      <div className={`p-1 rounded ${opinionReactEvaluation.checklist.reason ? "bg-green-950/20 text-green-450" : "bg-zinc-900"}`}>Reasoning</div>
                      <div className={`p-1 rounded ${opinionReactEvaluation.checklist.example ? "bg-green-950/20 text-green-450" : "bg-zinc-900"}`}>Example</div>
                    </div>
                    <p>{opinionReactEvaluation.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {/* Activity 2C: retell to friend */}
            {retellItems.length > 0 && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="font-bold text-amber-400 block border-b border-white/5 pb-1">Activity 2C: Explain it to a friend (re‑telling)</span>
                <p className="text-zinc-400 text-[10px]"><strong>Instruction:</strong> {retellItems[retellIdx].instruction}</p>

                <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-white/5">
                  <button
                    disabled={recordingMode !== "none"}
                    onClick={() => triggerRecording("retell", 7)}
                    className="py-1.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Mic className="w-3.5 h-3.5 animate-pulse" /> retell Monologue (1-2m)
                  </button>

                  {recordingMode === "retell" && (
                    <div className="w-32 bg-zinc-950 h-2 rounded overflow-hidden">
                      <div className="bg-red-500 h-full transition-all duration-100" style={{ width: `${recordingProgress}%` }} />
                    </div>
                  )}
                </div>

                {retellEvaluation && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl space-y-2 text-[10px] text-zinc-400">
                    <div className="flex justify-between text-amber-400 font-bold">
                      <span>Rubric Analysis:</span>
                      <span>Overall: {retellEvaluation.score}%</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[8px] text-center font-mono">
                      <div className="bg-zinc-900 p-1 border border-white/5 rounded text-white">Clarity: {retellEvaluation.rubric.clarity}</div>
                      <div className="bg-zinc-900 p-1 border border-white/5 rounded text-white">Order: {retellEvaluation.rubric.organization}</div>
                      <div className="bg-zinc-900 p-1 border border-white/5 rounded text-white">Relevance: {retellEvaluation.rubric.relevance}</div>
                      <div className="bg-zinc-900 p-1 border border-white/5 rounded text-white">Pron: {retellEvaluation.rubric.pronunciation}</div>
                    </div>
                    <p>{retellEvaluation.feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>

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
              className="flex items-center gap-1 py-2.5 px-6 bg-yellow-500 hover:bg-yellow-400 text-zinc-955 font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Capstone Quiz
              <ChevronRight className="w-4 h-4 text-zinc-955" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 5: MINI-QUIZ */}
      {step === 5 && (
        <div className="glass-panel border border-yellow-500/20 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div>
            <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 px-2 py-0.5 rounded-full font-bold">
              Capstone Mini-Quiz
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">B2 Media Listening Check</h2>
          </div>

          {quizBlueprint.length > 0 && quizScore === null && (
            <div className="space-y-4">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span>Mistakes: {quizMistakes.length}</span>
              </div>

              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-yellow-500 h-full transition-all duration-300"
                  style={{ width: `${((quizIdx + 1) / quizBlueprint.length) * 100}%` }}
                />
              </div>

              <div className="bg-zinc-955 p-5 rounded-2xl border border-yellow-500/20 space-y-4">
                <p className="text-white font-bold text-sm leading-relaxed">{quizBlueprint[quizIdx].question}</p>
                
                <div className="space-y-2">
                  {quizBlueprint[quizIdx].options.map((opt: string) => {
                    const isSelected = quizSelected === opt;
                    const isCorrect = opt === quizBlueprint[quizIdx].correct_answer;
                    
                    return (
                      <button
                        key={opt}
                        disabled={quizChecked}
                        onClick={() => setQuizSelected(opt)}
                        className={`w-full text-left p-3.5 rounded-xl text-xs font-semibold border transition flex items-center justify-between ${
                          isSelected
                            ? "border-yellow-500 bg-yellow-500/10 text-white"
                            : "border-yellow-500/10 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                        } ${quizChecked && isCorrect ? "border-green-500 bg-green-500/10 text-green-300" : ""}`}
                      >
                        <span>{opt}</span>
                        {isSelected && <Check className="w-4 h-4 text-yellow-400" />}
                      </button>
                    );
                  })}
                </div>

                {quizChecked && (
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${quizCorrect ? "bg-green-955/20 border-green-900 text-green-300" : "bg-red-955/20 border-red-900 text-red-300"}`}>
                    <strong>{quizCorrect ? "Correct!" : "Incorrect."}</strong> {quizExplanation}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  {!quizChecked ? (
                    <button
                      disabled={!quizSelected}
                      onClick={handleCheckQuizAnswer}
                      className="py-2.5 px-6 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-xs font-black rounded-lg transition cursor-pointer disabled:opacity-50"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuiz}
                      className="py-2.5 px-6 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-xs font-black rounded-lg transition cursor-pointer"
                    >
                      {quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {quizScore !== null && (
            <div className="bg-zinc-955 p-6 rounded-2xl border border-yellow-500/20 text-center space-y-6 animate-fade-in max-w-md mx-auto w-full">
              <Award className="w-12 h-12 text-yellow-400 mx-auto animate-bounce" />
              <div>
                <h3 className="text-xl font-bold text-white">Media Lab Quiz Results</h3>
                <p className="text-xs text-zinc-400 mt-1">Capstone Quiz Completed Successfully!</p>
              </div>

              <div className="text-5xl font-black text-white tracking-tight">{quizScore}%</div>

              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                {quizScore >= 80 
                  ? "Outstanding Capstone performance! You have successfully mastered integrated B2 listening & speaking skills." 
                  : "If real-world listening feels challenging, repeat Activity 1 and choose simpler topic fields first."}
              </p>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={handleRestartQuiz}
                  className="py-2 px-4 bg-zinc-900 border border-yellow-500/20 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retake
                </button>
                <button
                  onClick={() => setStep(6)}
                  className="py-2 px-6 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Go to Homework
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCREEN 6: HOMEWORK & COACH */}
      {step === 6 && (
        <div className="glass-panel border border-yellow-500/20 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div>
            <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 px-2 py-0.5 rounded-full font-bold">
              Homework & Real-World Media Coach
            </span>
            <h2 className="text-lg font-bold mt-2 text-white">Maintain your real-world listening habit logs</h2>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 text-xs">
            <div className="bg-zinc-955 p-4 rounded-xl border border-yellow-500/20 space-y-2">
              <span className="font-bold text-zinc-300">Homework Guidelines:</span>
              <ul className="list-disc list-inside text-[11px] text-zinc-400 space-y-1.5 pl-1">
                {homeworkItems.map((hw: any) => <li key={hw.id}>{hw.text}</li>)}
              </ul>
            </div>

            {/* AI media coach simulator */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-yellow-500/20 space-y-3">
              <span className="font-bold text-yellow-400 block border-b border-yellow-500/20 pb-1">Log Real-World Media Practice</span>
              
              <div className="space-y-2">
                <label className="text-zinc-400 block text-[10px] font-bold font-mono">Topic Category:</label>
                <select 
                  value={coachTopic}
                  onChange={(e) => setCoachTopic(e.target.value)}
                  className="w-full bg-zinc-900 border border-yellow-500/20 rounded p-2 text-white text-[11px] outline-none"
                >
                  <option value="news report">News Report (일회용 컵 보증금제)</option>
                  <option value="podcast topic">Lifestyle Podcast (미니멀 라이프)</option>
                  <option value="interview clip">Interview Dialogue (work/study habits)</option>
                </select>
              </div>

              <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-yellow-500/20">
                <button
                  disabled={recordingMode !== "none"}
                  onClick={() => triggerRecording("coach", 6)}
                  className="py-1.5 px-4 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 font-bold rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <Mic className="w-3.5 h-3.5 animate-pulse" /> Upload Oral Summary
                </button>

                {recordingMode === "coach" && (
                  <div className="w-32 bg-zinc-950 h-2 rounded overflow-hidden">
                    <div className="bg-yellow-500 h-full transition-all duration-100" style={{ width: `${recordingProgress}%` }} />
                  </div>
                )}
              </div>

              {coachEvaluation && (
                <div className="p-4 bg-yellow-500/5 border border-yellow-500/15 rounded-xl space-y-2 text-[10px]">
                  <div className="flex justify-between font-bold border-b border-yellow-500/20 pb-1 text-yellow-400">
                    <span>Habit Tracker Sync:</span>
                    <span>Status: Synced</span>
                  </div>
                  <p className="text-zinc-350"><strong>Practice overall score:</strong> {coachEvaluation.overall_score}%</p>
                  <p className="text-zinc-450"><strong>Habit recommendation:</strong> {coachEvaluation.feedback}</p>
                </div>
              )}
            </div>

            {/* Offline homework log entries */}
            <div className="bg-zinc-955 p-4 rounded-xl border border-yellow-500/20 space-y-3">
              <span className="font-bold text-zinc-300 block">Record offline media summary notes:</span>
              
              <div className="space-y-2">
                <input
                  type="text"
                  value={hwSents[0]}
                  onChange={(e) => handleHwChange(0, e.target.value)}
                  placeholder="Task 1: Log media source / link (e.g. KBS News, YouTube)..."
                  className="w-full bg-zinc-900 border border-yellow-500/20 rounded p-2.5 text-[11px] text-white outline-none focus:border-yellow-500"
                />
                <input
                  type="text"
                  value={hwSents[1]}
                  onChange={(e) => handleHwChange(1, e.target.value)}
                  placeholder="Task 2: Jot down 3 detail facts from the media clip..."
                  className="w-full bg-zinc-900 border border-yellow-500/20 rounded p-2.5 text-[11px] text-white outline-none focus:border-yellow-500"
                />
                <input
                  type="text"
                  value={hwSents[2]}
                  onChange={(e) => handleHwChange(2, e.target.value)}
                  placeholder="Task 3: Enter your 2-sentence written response / reaction..."
                  className="w-full bg-zinc-900 border border-yellow-500/20 rounded p-2.5 text-[11px] text-white outline-none focus:border-yellow-500"
                />
              </div>

              <button
                disabled={submittingHw}
                onClick={handleSubmitHomework}
                className="w-full py-2 bg-zinc-900 border border-yellow-500/20 hover:bg-zinc-800 text-zinc-300 font-bold rounded-lg transition cursor-pointer"
              >
                {submittingHw ? "Syncing logs to database..." : "Submit Media Log Entry"}
              </button>

              {hwFeedback && (
                <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 text-yellow-400 rounded-lg text-[11px] leading-relaxed">
                  <strong>Database response:</strong> {hwFeedback.feedback}
                </div>
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
              disabled={completingLab}
              onClick={handleCompleteLab}
              className="flex items-center gap-1 py-2.5 px-6 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-zinc-955 font-bold rounded-xl transition cursor-pointer shadow-lg shadow-yellow-500/20 disabled:opacity-50"
            >
              {completingLab ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-zinc-955" /> Complete Lab
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
