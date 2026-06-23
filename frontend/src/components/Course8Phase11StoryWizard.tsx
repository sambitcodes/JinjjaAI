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
  Image as ImageIcon
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

interface Course8Phase11StoryWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course8Phase11StoryWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course8Phase11StoryWizardProps) {
  const getStepMaxXP = (sNum: number) => {
    if (sNum === 1) return 0;
    if (sNum === 12) return 200;
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
    const savedStep = localStorage.getItem("hangeulai_c8p11_step");
    const savedMax = localStorage.getItem("hangeulai_c8p11_max_step");
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
      localStorage.setItem("hangeulai_c8p11_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);

  // Loaded data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1A: Story Transcript Reorder / Part Labels
  const [structureListenItems, setStructureListenItems] = useState<any[]>([]);
  const [structureIdx, setStructureIdx] = useState(0);
  const [userOrdering, setUserOrdering] = useState<string[]>([]); // holds ids of paragraphs in user order
  const [structureChecked, setStructureChecked] = useState(false);
  const [structureFeedback, setStructureFeedback] = useState("");

  // Activity 1B: Story Connectors Highlight
  const [connectorItems, setConnectorItems] = useState<any[]>([]);
  const [connectorIdx, setConnectorIdx] = useState(0);
  const [selectedConnectors, setSelectedConnectors] = useState<string[]>([]);
  const [connectorsChecked, setConnectorsChecked] = useState(false);

  // Activity 1C: Story Prosody Listen
  const [prosodyItems, setProsodyItems] = useState<any[]>([]);
  const [prosodyIdx, setProsodyIdx] = useState(0);
  const [prosodySelected, setProsodySelected] = useState<Record<string, string>>({}); // { question_id: selected_option }
  const [prosodyChecked, setProsodyChecked] = useState(false);

  // Activity 2A: Guided Story from Prompts
  const [guidedItems, setGuidedItems] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [planningNotes, setPlanningNotes] = useState({ intro: "", event: "", ending: "" });
  const [recordingMode, setRecordingMode] = useState<"none" | "guided" | "picture" | "opinion" | "coach">("none");
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [guidedEvaluation, setGuidedEvaluation] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);

  // Activity 2B: Picture Sequence Description
  const [pictureItems, setPictureItems] = useState<any[]>([]);
  const [pictureIdx, setPictureIdx] = useState(0);
  const [pictureEvaluation, setPictureEvaluation] = useState<any>(null);

  // Activity 2C: Opinion + Example Mini Talk
  const [opinionItems, setOpinionItems] = useState<any[]>([]);
  const [opinionIdx, setOpinionIdx] = useState(0);
  const [opinionEvaluation, setOpinionEvaluation] = useState<any>(null);

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
  const [coachTopic, setCoachTopic] = useState("personal story");
  const [coachEvaluation, setCoachEvaluation] = useState<any>(null);
  const [hwFeedback, setHwFeedback] = useState<any>(null);
  const [submittingHw, setSubmittingHw] = useState(false);
  const [completingLab, setCompletingLab] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/11/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/11/core-data");
          setCoreData(res);
        } else if (step === 3) {
          if (structureListenItems.length === 0) {
            const resS = await apiJson("/phase-11/items/story-structure-listen");
            setStructureListenItems(resS);
            if (resS[0]) {
              // shuffle paragraphs initially
              const shuffled = [...resS[0].paragraphs].sort(() => Math.random() - 0.5);
              setUserOrdering(shuffled.map(p => p.id));
            }
          }
          if (connectorItems.length === 0) {
            const resC = await apiJson("/phase-11/items/story-connectors");
            setConnectorItems(resC);
          }
          if (prosodyItems.length === 0) {
            const resP = await apiJson("/phase-11/items/story-prosody-listen");
            setProsodyItems(resP);
          }
        } else if (step === 4) {
          if (guidedItems.length === 0) {
            const resG = await apiJson("/phase-11/items/guided-story");
            setGuidedItems(resG);
            if (resG[0]) setSelectedTopic(resG[0].topic);
          }
          if (pictureItems.length === 0) {
            const resP = await apiJson("/phase-11/items/picture-description");
            setPictureItems(resP);
          }
          if (opinionItems.length === 0) {
            const resO = await apiJson("/phase-11/items/opinion-talk");
            setOpinionItems(resO);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/phase-11/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-11/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading PLS Lab Phase 11:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Recording Simulation
  const triggerRecording = (mode: "guided" | "picture" | "opinion" | "coach", durationSeconds = 5) => {
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

  const finalizeEvaluation = async (mode: "guided" | "picture" | "opinion" | "coach") => {
    setEvaluating(true);
    try {
      if (mode === "guided") {
        const res = await apiJson("/phase-11/items/guided-story/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: "gs_1", audio_base64: "mock_data" })
        });
        setGuidedEvaluation(res);
      } else if (mode === "picture") {
        const res = await apiJson("/phase-11/items/picture-description/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: "pd_1", audio_base64: "mock_data" })
        });
        setPictureEvaluation(res);
      } else if (mode === "opinion") {
        const res = await apiJson("/phase-11/items/opinion-talk/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: "ot_1", audio_base64: "mock_data" })
        });
        setOpinionEvaluation(res);
      } else if (mode === "coach") {
        const res = await apiJson("/phase-11/homework/submit", {
          method: "POST",
          body: JSON.stringify({ sentences: ["Story narration uploaded"] })
        });
        setCoachEvaluation(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  // Activity 1A: Reordering handlers
  const moveParagraph = (idx: number, direction: "up" | "down") => {
    const nextArr = [...userOrdering];
    if (direction === "up" && idx > 0) {
      const temp = nextArr[idx];
      nextArr[idx] = nextArr[idx - 1];
      nextArr[idx - 1] = temp;
    } else if (direction === "down" && idx < nextArr.length - 1) {
      const temp = nextArr[idx];
      nextArr[idx] = nextArr[idx + 1];
      nextArr[idx + 1] = temp;
    }
    setUserOrdering(nextArr);
  };

  const checkStructureOrder = async () => {
    const current = structureListenItems[structureIdx];
    if (!current) return;
    try {
      const userOrderStr = userOrdering.join(",");
      const res = await apiJson("/phase-11/items/story-structure-listen/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: userOrderStr })
      });
      setStructureChecked(true);
      setStructureFeedback(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 1B: Connector highlight
  const toggleConnectorHighlight = (word: string) => {
    if (connectorsChecked) return;
    setSelectedConnectors(prev => 
      prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
    );
  };

  const checkConnectors = async () => {
    const current = connectorItems[connectorIdx];
    if (!current) return;
    try {
      const res = await apiJson("/phase-11/items/story-connectors/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: selectedConnectors.join(",") })
      });
      setConnectorsChecked(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 1C: Prosody select
  const selectProsodyAnswer = (qId: string, opt: string) => {
    if (prosodyChecked) return;
    setProsodySelected(prev => ({ ...prev, [qId]: opt }));
  };

  const checkProsody = async () => {
    const current = prosodyItems[prosodyIdx];
    if (!current) return;
    try {
      await apiJson("/phase-11/items/story-prosody-listen/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: JSON.stringify(prosodySelected) })
      });
      setProsodyChecked(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Quiz handlers
  const handleCheckQuizAnswer = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelected) return;
    try {
      const res = await apiJson("/phase-11/quiz/answer", {
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
        await apiJson("/phase-11/quiz/finish", {
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
      const res = await apiJson("/phase-11/homework/submit", {
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
      await apiJson("/phase-11/complete", { method: "POST" });
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingLab(false);
    }
  };

    const outlineSteps = [
    { num: 1, label: "= 1 ? \"bg-cyan-500\" : \"bg-slate-700\"}`} /> Screen 1: Welcome & Phase Overview" },
    { num: 2, label: "= 2 ? \"bg-teal-500\" : \"bg-slate-700\"}`} /> Screen 2: B2 Story & Description Skills" },
    { num: 3, label: "= 3 ? \"bg-indigo-500\" : \"bg-slate-700\"}`} /> Screen 3: Activity 1: Listening & Structure Analysis" },
    { num: 4, label: "= 4 ? \"bg-purple-500\" : \"bg-slate-700\"}`} /> Screen 4: Activity 2: Guided Storytelling & Description" },
    { num: 5, label: "= 5 ? \"bg-pink-500\" : \"bg-slate-700\"}`} /> Screen 5: Mini-Quiz: Story Structure & Organisation" },
    { num: 6, label: "= 6 ? \"bg-emerald-500\" : \"bg-slate-700\"}`} /> Screen 6: Homework & AI Storytelling Coach" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 8,
          phaseNum: 11,
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
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="font-black text-xl text-white tracking-tight">Story Lab</h2>
            <p className="text-xs text-zinc-400">Longer Turns & Narratives (B2)</p>
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
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">Required: 980 XP</span>
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
                      if (courseXP < 800) {
                        window.dispatchEvent(new CustomEvent("hangeulai-warning", {
                          detail: { message: "To start Phase 11, you need at least 800 XP in this course. You currently have " + courseXP + " XP." }
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

      {/* Outline panel */}
      

      {/* SCREEN 1: WELCOME */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in relative overflow-hidden">
          <div className="relative mx-auto w-fit">
            <div className="p-4 bg-cyan-500/10 rounded-full border border-cyan-500/25 text-cyan-400">
              <FileText className="w-10 h-10" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-brand-500 rounded-full border-2 border-zinc-950">
              <Sparkles className="w-3 h-3 text-white fill-white" />
            </div>
          </div>

          <div>
            <h2 className="text-5xl font-black text-white tracking-tight font-sans">{metadata?.title || "Story Lab – Longer Turns & Narratives (B2)"}</h2>
            <h3 className="text-2xl font-extrabold text-cyan-400 mt-2">{metadata?.subtitle || "Tell clear, detailed stories and descriptions."}</h3>
          </div>

          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "In this lab, you’ll practise telling short stories and giving detailed descriptions about familiar topics, using clear structure, past tenses, and smooth pronunciation at B2 level."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Focus Milestones:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Organise stories into beginning–middle–end",
                "Describe events and experiences in detail",
                "Keep a 1–3 minute monologue flowing with clear pronunciation and rhythm"
              ]).map((g: string, i: number) => <li key={i}>{g}</li>)}
            </ul>
            <p className="pt-2 text-zinc-400"><strong>⏱️ Est. Lab Time:</strong> 30 minutes</p>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl mx-auto">
            {["B2", "Sustained monologue", "Storytelling", "Speaking"].map(chip => (
              <span key={chip} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] text-cyan-300 font-bold">{chip}</span>
            ))}
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => {
    if (courseXP < 800) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 11, you need at least 800 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} 
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-455 hover:to-cyan-455 text-zinc-955 font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-4 h-4" /> Start Story Lab
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: CONCEPT EXPLANATION */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            B2 Story & Description Skills
          </h2>

          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed max-h-[50vh] overflow-y-auto pr-1">
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1">
              <h3 className="font-bold text-white mb-1">What B2 speaking adds</h3>
              <p className="text-zinc-400">B2 speakers can give clear, detailed descriptions and relate stories about a range of topics, sustaining a monologue for 1–3 minutes with a logical structure and few long pauses.</p>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
              <h3 className="font-bold text-white mb-1">Story structure (simple template)</h3>
              <div className="space-y-1.5 pl-1">
                <p><strong>1. Introduction:</strong> Set the scene (when, where, who).</p>
                <p><strong>2. Main event:</strong> What happened (key actions, past tense flow).</p>
                <p><strong>3. Result / feeling:</strong> How it ended, what you felt or learned.</p>
              </div>
            </div>

            {coreData?.story_templates && (
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-2">
                <h4 className="font-bold text-amber-300">Example Outlines:</h4>
                <div className="space-y-3">
                  {coreData.story_templates.map((tmpl: any) => (
                    <div key={tmpl.id} className="border-l-2 border-cyan-500/50 pl-3">
                      <span className="font-bold text-white block text-[11px]">{tmpl.title}</span>
                      <ul className="list-disc list-inside text-[10px] text-zinc-400 mt-1 space-y-0.5">
                        {tmpl.outline.map((o: string, idx: number) => <li key={idx}>{o}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1">
              <h3 className="font-bold text-white mb-1">Pronunciation & Rhythm Focus</h3>
              <p className="text-zinc-400">Apply connected speech, stop-consonant final sounds (batchim), and prosodic variation to stress key elements. Aim for natural chunks of 3–5 words per breath group to maintain a fluid rhythm.</p>
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
              Proceed to Listening Analysis
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: ACTIVITY 1: LISTENING & STRUCTURE */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 1: Listening to Structured Stories
            </span>
            <h2 className="text-lg font-bold mt-2 text-white">Deconstruct story boundaries, identify connectors, and study phrasing</h2>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 text-xs">
            {/* Activity 1A: Transcript Reordering */}
            {structureListenItems.length > 0 && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="font-bold text-cyan-300 block border-b border-white/5 pb-1">Activity 1A: Reorder the Story Paragraphs</span>
                <p className="text-zinc-400 text-[11px]">Listen to the monologue and arrange the paragraphs chronologically into Introduction, Main Event, and Ending.</p>
                
                <button
                  onClick={() => playAudio(structureListenItems[0].audio_text)}
                  className="py-1.5 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-[10px] font-bold rounded cursor-pointer inline-flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5" /> Play Story Audio
                </button>

                <div className="space-y-2">
                  {userOrdering.map((pId, index) => {
                    const p = structureListenItems[0].paragraphs.find((item: any) => item.id === pId);
                    return (
                      <div key={pId} className="bg-zinc-900 p-3 rounded-lg border border-white/5 flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <span className="text-[10px] text-zinc-500 font-mono block mb-1">Paragraph {index + 1}:</span>
                          <p className="text-white text-[11px]">{p?.text}</p>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            disabled={index === 0}
                            onClick={() => moveParagraph(index, "up")}
                            className="p-1 bg-zinc-850 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-400 cursor-pointer"
                          >
                            ▲
                          </button>
                          <button
                            disabled={index === userOrdering.length - 1}
                            onClick={() => moveParagraph(index, "down")}
                            className="p-1 bg-zinc-850 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-400 cursor-pointer"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!structureChecked ? (
                  <button
                    onClick={checkStructureOrder}
                    className="w-full py-2 bg-cyan-500 text-zinc-950 font-bold rounded-lg hover:bg-cyan-455 transition cursor-pointer mt-2"
                  >
                    Verify Reordering
                  </button>
                ) : (
                  <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 text-cyan-300 rounded-lg text-[11px] leading-relaxed mt-2">
                    <strong>Feedback:</strong> {structureFeedback}
                  </div>
                )}
              </div>
            )}

            {/* Activity 1B: Story Connectors Highlight */}
            {connectorItems.length > 0 && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="font-bold text-teal-300 block border-b border-white/5 pb-1">Activity 1B: Signpost Words & Connectors</span>
                <p className="text-zinc-400 text-[11px]">Click on words in the narrative paragraph that serve as time, contrast, or result connectors.</p>
                
                <div className="bg-zinc-900 p-3 rounded-lg border border-white/5 leading-relaxed text-zinc-200">
                  {connectorItems[0].text.split(" ").map((word: string, wIdx: number) => {
                    const cleanWord = word.replace(/[.,]/g, "");
                    const isSelected = selectedConnectors.includes(cleanWord);
                    const target = connectorItems[0].connectors.find((c: any) => c.word === cleanWord);
                    
                    return (
                      <span
                        key={wIdx}
                        onClick={() => toggleConnectorHighlight(cleanWord)}
                        className={`inline-block mx-0.5 px-1 py-0.5 rounded cursor-pointer transition ${
                          connectorsChecked
                            ? target
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : "opacity-60"
                            : isSelected
                              ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                              : "hover:bg-zinc-800"
                        }`}
                      >
                        {word}
                      </span>
                    );
                  })}
                </div>

                {!connectorsChecked ? (
                  <button
                    onClick={checkConnectors}
                    className="w-full py-2 bg-teal-500 text-zinc-950 font-bold rounded-lg hover:bg-teal-455 transition cursor-pointer mt-2"
                  >
                    Check Connectors Highlighted
                  </button>
                ) : (
                  <div className="p-3 bg-teal-500/5 border border-teal-500/10 text-zinc-400 rounded-lg text-[11px] space-y-1.5 mt-2">
                    <span className="font-bold text-teal-300">Connector Legend:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {connectorItems[0].connectors.map((c: any, i: number) => (
                        <li key={i}><strong>{c.word}</strong>: {c.type} connector</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Activity 1C: Story Prosody Listen */}
            {prosodyItems.length > 0 && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="font-bold text-indigo-300 block border-b border-white/5 pb-1">Activity 1C: Story Prosody & Rhythm</span>
                <p className="text-zinc-400 text-[11px]">Listen to the phrasing and pitch fluctuations. Answer the following questions:</p>
                
                <button
                  onClick={() => playAudio(prosodyItems[0].audio_text)}
                  className="py-1.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold rounded cursor-pointer inline-flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5" /> Play Prosody Audio
                </button>

                <div className="space-y-3 pt-2">
                  {prosodyItems[0].questions.map((q: any) => (
                    <div key={q.id} className="space-y-1.5">
                      <span className="text-white block font-medium">{q.question}</span>
                      <div className="grid grid-cols-1 gap-1.5">
                        {q.options.map((opt: string) => {
                          const isSelected = prosodySelected[q.id] === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => selectProsodyAnswer(q.id, opt)}
                              className={`text-left p-2 rounded border text-[11px] transition ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-500/10 text-white"
                                  : "border-white/5 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                              } ${prosodyChecked && opt === q.correct ? "border-green-500 bg-green-500/10 text-green-300" : ""}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {!prosodyChecked ? (
                  <button
                    onClick={checkProsody}
                    className="w-full py-2 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 transition cursor-pointer mt-2"
                  >
                    Submit Prosody Analysis
                  </button>
                ) : (
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 text-indigo-300 rounded-lg text-[11px] leading-relaxed mt-2">
                    <strong>Prosody Feedback:</strong> Monologue segments require breathing pauses between primary logical boundaries. Emotion/surprise shifts the intonation upward immediately.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => {
    if (courseXP < 800) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 11, you need at least 800 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button 
              onClick={() => setStep(4)}
              className="flex items-center gap-1 py-2.5 px-6 bg-cyan-500 hover:bg-cyan-455 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Speaking Drills
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 4: ACTIVITY 2: GUIDED SPEAKING */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 2: Guided Storytelling & Description
            </span>
            <h2 className="text-lg font-bold mt-2 text-white">Record longer monologues following structured scaffolds</h2>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 text-xs">
            {/* Activity 2A: Personal Story from Prompts */}
            {guidedItems.length > 0 && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="font-bold text-cyan-300 block border-b border-white/5 pb-1">Activity 2A: Personal Story from Prompts</span>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-zinc-900 p-2.5 rounded border border-white/5">
                    <span className="font-bold text-white block mb-1">1. Intro</span>
                    <p className="text-[10px] text-zinc-400">{guidedItems[0].prompts.intro}</p>
                    <textarea
                      value={planningNotes.intro}
                      onChange={(e) => setPlanningNotes(prev => ({ ...prev, intro: e.target.value }))}
                      placeholder="Planning notes..."
                      className="w-full bg-zinc-950 border border-white/10 rounded mt-1.5 p-1 text-[10px] text-white outline-none"
                    />
                  </div>
                  <div className="bg-zinc-900 p-2.5 rounded border border-white/5">
                    <span className="font-bold text-white block mb-1">2. Event</span>
                    <p className="text-[10px] text-zinc-400">{guidedItems[0].prompts.event}</p>
                    <textarea
                      value={planningNotes.event}
                      onChange={(e) => setPlanningNotes(prev => ({ ...prev, event: e.target.value }))}
                      placeholder="Planning notes..."
                      className="w-full bg-zinc-950 border border-white/10 rounded mt-1.5 p-1 text-[10px] text-white outline-none"
                    />
                  </div>
                  <div className="bg-zinc-900 p-2.5 rounded border border-white/5">
                    <span className="font-bold text-white block mb-1">3. Ending</span>
                    <p className="text-[10px] text-zinc-400">{guidedItems[0].prompts.ending}</p>
                    <textarea
                      value={planningNotes.ending}
                      onChange={(e) => setPlanningNotes(prev => ({ ...prev, ending: e.target.value }))}
                      placeholder="Planning notes..."
                      className="w-full bg-zinc-950 border border-white/10 rounded mt-1.5 p-1 text-[10px] text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-white/5">
                  <button
                    disabled={recordingMode !== "none"}
                    onClick={() => triggerRecording("guided")}
                    className="py-1.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Mic className="w-3.5 h-3.5 animate-pulse" /> Record Story (60-90s)
                  </button>

                  {recordingMode === "guided" && (
                    <div className="w-32 bg-zinc-950 h-2 rounded overflow-hidden">
                      <div className="bg-red-500 h-full transition-all duration-100" style={{ width: `${recordingProgress}%` }} />
                    </div>
                  )}
                </div>

                {evaluating && (
                  <div className="text-center py-2 text-zinc-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Analyzing story structure & fluency...</span>
                  </div>
                )}

                {guidedEvaluation && (
                  <div className="p-4 bg-cyan-500/5 border border-cyan-500/15 rounded-xl space-y-3">
                    <div className="flex justify-between text-[11px] font-bold border-b border-white/5 pb-1.5">
                      <span className="text-cyan-300">Structure Evaluation:</span>
                      <span className="text-white">Overall Score: {guidedEvaluation.score}%</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className={`p-1 rounded ${guidedEvaluation.structure.has_intro ? "bg-green-950/20 text-green-400 border border-green-900/40" : "bg-red-950/20 text-red-400"}`}>Introduction</div>
                      <div className={`p-1 rounded ${guidedEvaluation.structure.has_main ? "bg-green-950/20 text-green-400 border border-green-900/40" : "bg-red-950/20 text-red-400"}`}>Main Event</div>
                      <div className={`p-1 rounded ${guidedEvaluation.structure.has_ending ? "bg-green-950/20 text-green-400 border border-green-900/40" : "bg-red-950/20 text-red-400"}`}>Reflective End</div>
                    </div>

                    <div className="text-[10px] text-zinc-400 space-y-1">
                      <p><strong>Connectors identified:</strong> {guidedEvaluation.connectors_used.join(", ")}</p>
                      <p><strong>Speech rate:</strong> {guidedEvaluation.fluency.median_phrase_len} syllables/second</p>
                      <p><strong>Feedback:</strong> {guidedEvaluation.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Activity 2B: Picture sequence description */}
            {pictureItems.length > 0 && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="font-bold text-teal-300 block border-b border-white/5 pb-1">Activity 2B: Picture Description</span>
                
                <div className="flex gap-2">
                  <div className="flex-1 bg-zinc-900 rounded p-2 text-center border border-white/5 flex flex-col items-center justify-center min-h-[80px]">
                    <ImageIcon className="w-6 h-6 text-zinc-500 mb-1" />
                    <span className="text-[10px] text-zinc-400">Scene 1: Preparing to travel</span>
                  </div>
                  <div className="flex-1 bg-zinc-900 rounded p-2 text-center border border-white/5 flex flex-col items-center justify-center min-h-[80px]">
                    <ImageIcon className="w-6 h-6 text-zinc-500 mb-1" />
                    <span className="text-[10px] text-zinc-400">Scene 2: Problem at airport</span>
                  </div>
                </div>

                <div className="bg-zinc-900 p-2.5 rounded border border-white/5 text-[10px] leading-relaxed text-zinc-400">
                  <strong>Micro-prompts:</strong> {pictureItems[pictureIdx].micro_prompts}
                </div>

                <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-white/5">
                  <button
                    disabled={recordingMode !== "none"}
                    onClick={() => triggerRecording("picture")}
                    className="py-1.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Mic className="w-3.5 h-3.5 animate-pulse" /> Describe Scenes (60s)
                  </button>

                  {recordingMode === "picture" && (
                    <div className="w-32 bg-zinc-950 h-2 rounded overflow-hidden">
                      <div className="bg-red-500 h-full transition-all duration-100" style={{ width: `${recordingProgress}%` }} />
                    </div>
                  )}
                </div>

                {pictureEvaluation && (
                  <div className="p-3 bg-teal-500/5 border border-teal-500/15 rounded-xl text-[10px] leading-relaxed text-zinc-400">
                    <p className="text-teal-300 font-bold mb-1">Picture Evaluation (Score: {pictureEvaluation.score}%):</p>
                    <p>{pictureEvaluation.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {/* Activity 2C: Opinion talk */}
            {opinionItems.length > 0 && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="font-bold text-indigo-300 block border-b border-white/5 pb-1">Activity 2C: Opinion + Example mini-talk</span>
                
                <div className="bg-zinc-900 p-3 rounded border border-white/5 text-[11px] text-zinc-350 space-y-1.5">
                  <p><strong>Topic:</strong> {opinionItems[opinionIdx].topic}</p>
                  <div className="space-y-1 pl-1">
                    {opinionItems[opinionIdx].hints.map((h: string, idx: number) => (
                      <p key={idx} className="text-[10px] text-zinc-400">&bull; {h}</p>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-white/5">
                  <button
                    disabled={recordingMode !== "none"}
                    onClick={() => triggerRecording("opinion")}
                    className="py-1.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Mic className="w-3.5 h-3.5 animate-pulse" /> Record Monologue (60-90s)
                  </button>

                  {recordingMode === "opinion" && (
                    <div className="w-32 bg-zinc-950 h-2 rounded overflow-hidden">
                      <div className="bg-red-500 h-full transition-all duration-100" style={{ width: `${recordingProgress}%` }} />
                    </div>
                  )}
                </div>

                {opinionEvaluation && (
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl text-[10px] leading-relaxed text-zinc-400 space-y-1.5">
                    <div className="flex justify-between text-indigo-300 font-bold">
                      <span>Structure Map:</span>
                      <span>Score: {opinionEvaluation.score}%</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[9px] text-center font-mono">
                      <div className="bg-zinc-900 p-1 border border-white/5 rounded text-white">Stance</div>
                      <div className="bg-zinc-900 p-1 border border-white/5 rounded text-white">Reason 1</div>
                      <div className="bg-zinc-900 p-1 border border-white/5 rounded text-white">Reason 2</div>
                      <div className="bg-zinc-900 p-1 border border-white/5 rounded text-white">Example</div>
                    </div>
                    <p>{opinionEvaluation.feedback}</p>
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
              className="flex items-center gap-1 py-2.5 px-6 bg-cyan-500 hover:bg-cyan-455 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Mini-Quiz
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 5: MINI-QUIZ */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Mini-Quiz
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Story Structure & Organisation</h2>
          </div>

          {quizBlueprint.length > 0 && quizScore === null && (
            <div className="space-y-4">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span>Mistakes: {quizMistakes.length}</span>
              </div>

              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-cyan-500 h-full transition-all duration-300"
                  style={{ width: `${((quizIdx + 1) / quizBlueprint.length) * 100}%` }}
                />
              </div>

              <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 space-y-4">
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
                            ? "border-cyan-500 bg-cyan-500/10 text-white"
                            : "border-white/5 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                        } ${quizChecked && isCorrect ? "border-green-500 bg-green-500/10 text-green-300" : ""}`}
                      >
                        <span>{opt}</span>
                        {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                      </button>
                    );
                  })}
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
                      disabled={!quizSelected}
                      onClick={handleCheckQuizAnswer}
                      className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-455 text-zinc-955 text-xs font-black rounded-lg transition cursor-pointer disabled:opacity-50"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuiz}
                      className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-455 text-zinc-955 text-xs font-black rounded-lg transition cursor-pointer"
                    >
                      {quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {quizScore !== null && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-center space-y-6 animate-fade-in max-w-md mx-auto w-full">
              <Award className="w-12 h-12 text-yellow-400 mx-auto" />
              <div>
                <h3 className="text-xl font-bold text-white">Quiz Results</h3>
                <p className="text-xs text-zinc-400 mt-1">Quiz Completed Successfully!</p>
              </div>

              <div className="text-5xl font-black text-white tracking-tight">{quizScore}%</div>

              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                {quizScore >= 80 
                  ? "Outstanding! You demonstrate high awareness of logical paragraph layouts and transition words." 
                  : "Consider repeating Activities 1A and 2A to reinforce chronological signpost structures."}
              </p>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={handleRestartQuiz}
                  className="py-2 px-4 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retake
                </button>
                <button
                  onClick={() => setStep(6)}
                  className="py-2 px-6 bg-cyan-500 hover:bg-cyan-455 text-zinc-955 text-xs font-bold rounded-lg transition cursor-pointer"
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
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full font-bold">
              Homework & AI Storytelling Coach
            </span>
            <h2 className="text-lg font-bold mt-2 text-white">Maintain your narrative portfolio and sync logs to the database</h2>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 text-xs">
            <div className="bg-zinc-955 p-4 rounded-xl border border-white/5 space-y-2">
              <span className="font-bold text-zinc-300">Homework Assignments:</span>
              <ul className="list-disc list-inside text-[11px] text-zinc-400 space-y-1.5 pl-1">
                {homeworkItems.map((hw: any) => <li key={hw.id}>{hw.text}</li>)}
              </ul>
            </div>

            {/* AI storytelling coach simulator */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
              <span className="font-bold text-cyan-300 block border-b border-white/5 pb-1">AI Storytelling Coach Analysis</span>
              
              <div className="space-y-2">
                <label className="text-zinc-400 block text-[10px] font-bold">Choose Topic Category:</label>
                <select 
                  value={coachTopic}
                  onChange={(e) => setCoachTopic(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded p-2 text-white text-[11px] outline-none"
                >
                  <option value="personal story">Personal Story (narrative template)</option>
                  <option value="description">Description (geographic/neighborhood layout)</option>
                  <option value="opinion talk">Opinion Monologue (2 reasons + example)</option>
                </select>
              </div>

              <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-white/5">
                <button
                  disabled={recordingMode !== "none"}
                  onClick={() => triggerRecording("coach", 6)}
                  className="py-1.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <Mic className="w-3.5 h-3.5 animate-pulse" /> Upload Story Monologue
                </button>

                {recordingMode === "coach" && (
                  <div className="w-32 bg-zinc-950 h-2 rounded overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-100" style={{ width: `${recordingProgress}%` }} />
                  </div>
                )}
              </div>

              {coachEvaluation && (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-2">
                  <div className="flex justify-between text-[11px] font-bold border-b border-white/5 pb-1 text-emerald-400">
                    <span>Fluency Coach Report:</span>
                    <span>Score: {coachEvaluation.overall_score}%</span>
                  </div>
                  <p className="text-[10px] text-zinc-350"><strong>Est. Level:</strong> {coachEvaluation.estimated_fluency}</p>
                  <p className="text-[10px] text-zinc-350"><strong>Connectors Count:</strong> {coachEvaluation.connectors_count} detected</p>
                  <div className="text-[9px] space-y-0.5">
                    {coachEvaluation.structure_outline.map((item: string, idx: number) => (
                      <p key={idx} className="text-zinc-400">&bull; {item}</p>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-400"><strong>Advice:</strong> {coachEvaluation.feedback}</p>
                </div>
              )}
            </div>

            {/* Offline homework log entries */}
            <div className="bg-zinc-955 p-4 rounded-xl border border-white/5 space-y-3">
              <span className="font-bold text-zinc-300 block">Record offline story log notes:</span>
              
              <div className="space-y-2">
                <input
                  type="text"
                  value={hwSents[0]}
                  onChange={(e) => handleHwChange(0, e.target.value)}
                  placeholder="Task 1: Enter your story topic description..."
                  className="w-full bg-zinc-900 border border-white/10 rounded p-2.5 text-[11px] text-white outline-none focus:border-cyan-500"
                />
                <input
                  type="text"
                  value={hwSents[1]}
                  onChange={(e) => handleHwChange(1, e.target.value)}
                  placeholder="Task 2: Describe connectors you used (e.g. 그런데, 그래서, 결국)"
                  className="w-full bg-zinc-900 border border-white/10 rounded p-2.5 text-[11px] text-white outline-none focus:border-cyan-500"
                />
                <input
                  type="text"
                  value={hwSents[2]}
                  onChange={(e) => handleHwChange(2, e.target.value)}
                  placeholder="Task 3: Reflection on pauses / rhythm difficulties..."
                  className="w-full bg-zinc-900 border border-white/10 rounded p-2.5 text-[11px] text-white outline-none focus:border-cyan-500"
                />
              </div>

              <button
                disabled={submittingHw}
                onClick={handleSubmitHomework}
                className="w-full py-2 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 font-bold rounded-lg transition cursor-pointer"
              >
                {submittingHw ? "Syncing notes to database..." : "Submit Story Log Reflection"}
              </button>

              {hwFeedback && (
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-300 rounded-lg text-[11px] leading-relaxed">
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
              className="flex items-center gap-1 py-2.5 px-6 bg-gradient-to-r from-emerald-500 to-green-500 text-zinc-955 font-bold rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {completingLab ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Complete Lab
                </>
              )}
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
