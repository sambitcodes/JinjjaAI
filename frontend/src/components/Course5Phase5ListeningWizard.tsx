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
  MessageSquare,
  ArrowRight,
  HelpCircle,
  MessageCircle,
  FileText,
  Bookmark,
  CheckSquare,
  Info,
  Edit3
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

interface Course5Phase5ListeningWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course5Phase5ListeningWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course5Phase5ListeningWizardProps) {
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
    const savedStep = localStorage.getItem("hangeulai_c5p5_step");
    const savedMax = localStorage.getItem("hangeulai_c5p5_max_step");
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
      localStorage.setItem("hangeulai_c5p5_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 9;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Concept C1 micro checkpoint
  const [c1Selected, setC1Selected] = useState<string | null>(null);
  const [c1Checked, setC1Checked] = useState(false);

  // Activity A states (Main idea & details extraction)
  const [listeningItems, setListeningItems] = useState<any[]>([]);
  const [listIdx, setListIdx] = useState(0);
  const [selectedMainIdea, setSelectedMainIdea] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<Record<number, string>>({});
  const [act1Checked, setAct1Checked] = useState(false);
  const [act1Correct, setAct1Correct] = useState<boolean | null>(null);
  const [revealTranscript, setRevealTranscript] = useState(false);

  // Activity B states (Note-taking & model notes comparison)
  const [noteTemplates, setNoteTemplates] = useState<any[]>([]);
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>("story");
  const [notesData, setNotesData] = useState<Record<string, string>>({});
  const [noteTakingSaved, setNoteTakingSaved] = useState(false);
  const [modelNotes, setModelNotes] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);

  // Activity C states (Written summary evaluation)
  const [learnerSummaryText, setLearnerSummaryText] = useState("");
  const [summaryFeedback, setSummaryFeedback] = useState<any>(null);
  const [submittingSummary, setSubmittingSummary] = useState(false);

  // Activity D states (Spoken summary coaching)
  const [recording, setRecording] = useState(false);
  const [spokenFeedback, setSpokenFeedback] = useState<any>(null);
  const [submittingSpoken, setSubmittingSpoken] = useState(false);

  // Activity E states (Quiz)
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);
  const [quizBadge, setQuizBadge] = useState<string | null>(null);

  // Activity F states (Extra practice chat & report)
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [practiceMessages, setPracticeMessages] = useState<any[]>([]);
  const [practiceText, setPracticeText] = useState("");
  const [practiceSending, setPracticeSending] = useState(false);
  const [practiceFinished, setPracticeFinished] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);

  // Step 9 states (Graduation / Homework checklist)
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Restore step from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c5p5_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 9) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c5p5_step", String(step));
  }, [step]);

  // Load API Data per Step
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean4/5/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean4/5/core-data");
          setCoreData(res);
        } else if (step === 3 && listeningItems.length === 0) {
          const res = await apiJson("/practice/listening/long-b1");
          setListeningItems(res.items || []);
        } else if (step === 4 && noteTemplates.length === 0) {
          const res = await apiJson("/practice/listening/notes-templates");
          setNoteTemplates(res || []);
        } else if (step === 7 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean4/phase-5/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 9 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean4/5/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading B1 listening data:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Micro reflection check
  const handleC1Check = () => {
    if (!c1Selected) return;
    setC1Checked(true);
    playSFX("correct");
  };

  // Activity A (Comprehension checks)
  const handleCheckActivity1 = async () => {
    const current = listeningItems[listIdx];
    if (!current) return;

    // Check main idea
    const correctMain = selectedMainIdea === current.main_idea_options[0];
    
    // Check detail questions
    const currentDetails = current.detail_questions || [];
    const correctDetails = currentDetails.every((dq: any, dIdx: number) => {
      return selectedDetails[dIdx] === dq.correct;
    });

    const isCorrect = correctMain && correctDetails;
    setAct1Checked(true);
    setAct1Correct(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");

    try {
      await apiJson("/practice/listening/long-b1/answer", {
        method: "POST",
        body: JSON.stringify({
          question_id: `${current.id}_comprehension`,
          answer: JSON.stringify({
            main_idea: selectedMainIdea,
            details: selectedDetails
          }),
          time_taken_ms: 6000
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextActivity1 = () => {
    setAct1Checked(false);
    setAct1Correct(null);
    setRevealTranscript(false);
    
    if (listIdx < listeningItems.length - 1) {
      setListIdx(listIdx + 1);
      setSelectedMainIdea(null);
      setSelectedDetails({});
    } else {
      setStep(4); // Move to note-taking comparison
    }
  };

  // Activity B: Note-taking submit
  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await apiJson("/practice/listening/take-notes", {
        method: "POST",
        body: JSON.stringify({
          listening_id: "long_b1_1",
          notes: notesData
        })
      });
      setModelNotes(res.model_notes);
      setNoteTakingSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  // Activity C: Summary writing evaluation
  const handleSubmitSummaryText = async () => {
    if (!learnerSummaryText.trim()) return;
    setSubmittingSummary(true);
    try {
      const res = await apiJson("/practice/listening/summary-text", {
        method: "POST",
        body: JSON.stringify({
          notes: notesData,
          learner_summary: learnerSummaryText
        })
      });
      setSummaryFeedback(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingSummary(false);
    }
  };

  // Activity D: Mock recording spoken summary
  const handleRecordSpokenSummary = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      setSubmittingSpoken(true);
      try {
        const res = await apiJson("/practice/listening/summary-speaking", {
          method: "POST",
          body: JSON.stringify({
            target_text: "어제 회사에서 중요한 회의를 했습니다. 결과가 좋아서 기뻤습니다.",
            user_audio_base64: "mock_base64"
          })
        });
        setSpokenFeedback(res);
      } catch (err) {
        console.error(err);
      } finally {
        setSubmittingSpoken(false);
      }
    }, 2500);
  };

  // Activity E: Quiz check
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
      await apiJson("/quiz/korean4/phase-5/answer", {
        method: "POST",
        body: JSON.stringify({
          question_id: current.id,
          answer: quizSelectedOpt,
          time_taken_ms: 3000
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
        const res = await apiJson("/quiz/korean4/phase-5/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Active Listener B1");
        setStep(8); // Go to Activity F (Extra practice)
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  // Activity F: Practice Chat with AI
  const handleStartPractice = async (scen: string) => {
    setPracticeMessages([]);
    setPracticeFeedback(null);
    setPracticeFinished(false);
    try {
      const res = await apiJson("/conversation/b1/listening-summary-practice/start", {
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
      const res = await apiJson("/conversation/b1/listening-summary-practice/turn", {
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
      const res = await apiJson("/conversation/b1/listening-summary-practice/finish", { method: "POST" });
      setPracticeFeedback(res.feedback);
      setPracticeFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Homework check logging
  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework((prev) => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/phases/korean4/5/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const outlineSteps = [
    { num: 1, label: "Welcome & Goals" },
    { num: 2, label: "Concept: B1 Listener Model" },
    { num: 3, label: "Activity A: Comprehension" },
    { num: 4, label: "Activity B: Note-Taking" },
    { num: 5, label: "Activity C: Written Summary" },
    { num: 6, label: "Activity D: Spoken Coaching" },
    { num: 7, label: "Activity E: Strategy Quiz" },
    { num: 8, label: "Activity F: Practice Lab" },
    { num: 9, label: "Phase Graduation" }
  ];

  return (
    <div className="flex-grow flex flex-col justify-between min-h-[75vh] text-zinc-100 font-sans">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Korean 4.5 – Longer Listening & Note‑Taking"}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-md uppercase tracking-wider">B1 Listening</span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium">Course 5 &bull; Phase 5</p>
          </div>
        </div>
        
        {/* Active progress bar */}
        <div className="flex items-center space-x-4">
          <div className="w-40 h-3 bg-zinc-950 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-teal-500 rounded-full transition-all duration-500" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 font-bold">{Math.round((step / totalSteps) * 100)}%</span>
          <button 
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

      {/* Step 1: Welcome/Goals */}
      {step === 1 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/25 w-fit mx-auto text-indigo-400 shrink-0">
            <BookOpen className="w-10 h-10 animate-pulse shrink-0" />
          </div>
          
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Longer Speech &amp; Simple Notes</h2>
            <h3 className="text-xl font-extrabold text-indigo-450 mt-2">Active Listening Strategy</h3>
          </div>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Understand longer Korean and keep simple notes."}
          </p>

          <div className="bg-zinc-950/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1 font-sans">
              {(metadata?.goals || [
                "Understand main points of clear, standard Korean speech on familiar topics",
                "Pick out several specific details (who, where, when, activities, simple reasons)",
                "Take simple notes while listening and compare them to a model set",
                "Write a short 2–4 sentence Korean summary of what they heard",
                "Give a brief spoken summary and receive feedback"
              ]).map((g: string, idx: number) => (
                <li key={idx} className="text-zinc-300">{g}</li>
              ))}
            </ul>
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs border-t border-white/5 mt-4 font-sans">
              <p><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 35} minutes</p>
              <p><strong>📋 Level:</strong> Intermediate B1 (Korean 4.5)</p>
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
                    ? "border-indigo-500 bg-indigo-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                Text input
              </button>
              <button
                onClick={() => setMode("voice")}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === "voice" 
                    ? "border-indigo-500 bg-indigo-500/10 text-white" 
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
              onClick={() => {
    if (courseXP < 320) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 5, you need at least 320 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <span>Start Phase 5</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Concept/Model Example */}
      {step === 2 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen: Model of a Good B1 Listener</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 2 of {totalSteps}</span>
          </div>

          <p className="text-zinc-300 text-xs text-left max-w-2xl mx-auto font-sans leading-relaxed">
            Effective listening in a foreign language requires a mental pipeline: <strong>Listen &rarr; Find Main Point &rarr; Capture Key Details &rarr; Jot Brief Notes &rarr; Formulate Summary</strong>. Look at this model example:
          </p>

          {coreData?.example_listenings?.[0] && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 text-left max-w-3xl mx-auto w-full font-sans">
              <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-white/5">
                <div>
                  <span className="text-[9px] text-zinc-500 font-mono uppercase block">Example Audio (Weekend Plans):</span>
                  <p className="font-korean text-base font-bold text-white mt-1">{coreData.example_listenings[0].ko}</p>
                </div>
                <button
                  onClick={() => playAudio(coreData.example_listenings[0].ko)}
                  className="p-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-400 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs shrink-0"
                >
                  <Volume2 className="w-4 h-4" /> Listen
                </button>
              </div>

              {coreData?.notes_summary_examples?.[0] && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Labelled Analysis */}
                  <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block">Explicit Analysis:</span>
                    <p className="text-xs text-zinc-200">
                      <strong className="text-emerald-450 block">🎯 Main Point:</strong> 
                      Going to Hangang Park with friends on weekends.
                    </p>
                    <p className="text-xs text-zinc-200">
                      <strong className="text-amber-450 block">📌 Bullet Details:</strong> 
                      Ride bikes, eat delicious food, good weather, lots of people, hiking next week.
                    </p>
                  </div>

                  {/* Right Column: Notes & Summary */}
                  <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-3">
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block font-sans">Structured Output:</span>
                    <div>
                      <strong className="text-xs text-white block mb-0.5">Notes Taken (Keywords):</strong>
                      <p className="text-[11px] text-zinc-400 italic bg-zinc-950 p-2 rounded border border-white/5">{coreData.notes_summary_examples[0].notes}</p>
                    </div>
                    <div>
                      <strong className="text-xs text-white block mb-0.5">Korean Summary &amp; Gloss:</strong>
                      <p className="font-korean text-xs text-white font-bold bg-zinc-950 p-2 rounded border border-white/5 mb-1">{coreData.notes_summary_examples[0].summary_ko}</p>
                      <p className="text-[10px] text-zinc-400 italic">"{coreData.notes_summary_examples[0].summary_en}"</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Micro-reflection Question */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl mx-auto w-full text-left">
            <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest block font-mono">Micro Checkpoint C1</span>
            <p className="text-sm font-bold text-white">When you listen in any language, do you usually write full sentences or short keywords? Which seems better after seeing these model notes?</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: "A", text: "I try to write full sentences (often causes me to fall behind)." },
                { id: "B", text: "I capture short keywords/fragments (much faster and easier to follow)." }
              ].map((opt) => {
                let borderStyle = "border-white/5 bg-zinc-900/60 text-zinc-300";
                if (c1Selected === opt.id) {
                  borderStyle = "border-indigo-500 bg-indigo-500/10 text-white";
                }
                if (c1Checked) {
                  if (opt.id === "B") {
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
                <p>Exactly! Capturing core keywords (noun fragments, numbers, emotions) allows your brain to focus on processing the incoming audio instead of frantically writing down grammatical particles.</p>
              </div>
            )}

            {!c1Checked && (
              <button
                onClick={handleC1Check}
                disabled={!c1Selected}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition cursor-pointer"
              >
                Submit Response
              </button>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 3: Activity A: Main-idea & detail comprehension */}
      {step === 3 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4 font-sans">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity A – Listen, Analyze & Extract Details</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 3 of {totalSteps}</span>
          </div>

          {listeningItems.length > 0 && listeningItems[listIdx] && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6 text-left max-w-3xl mx-auto w-full animate-fade-in font-sans">
              
              {/* Playback Box */}
              <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl flex flex-col items-center gap-3">
                <span className="text-[9px] text-zinc-500 font-mono uppercase">Play B1 Monologue:</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => playAudio(listeningItems[listIdx].ko)}
                    className="p-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold rounded-xl border border-indigo-500/25 flex items-center gap-2 text-xs transition cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 animate-bounce" /> Play Audio (Work Story)
                  </button>
                  <button 
                    onClick={() => setRevealTranscript(!revealTranscript)}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-xl border border-white/5 transition cursor-pointer"
                  >
                    {revealTranscript ? "Hide Transcript" : "Show Transcript Support"}
                  </button>
                </div>
                {revealTranscript && (
                  <p className="font-korean text-xs text-zinc-300 mt-2 bg-zinc-950 p-3.5 rounded-lg border border-white/5 leading-relaxed">{listeningItems[listIdx].ko}</p>
                )}
              </div>

              {/* Q1: Main Point */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-white block">Q1: What is the main point of this speech?</span>
                <div className="flex flex-col gap-2">
                  {listeningItems[listIdx].main_idea_options.map((opt: string) => {
                    let btnStyle = "border-white/5 bg-zinc-900 text-zinc-350";
                    if (selectedMainIdea === opt) {
                      btnStyle = "border-indigo-500 bg-indigo-500/10 text-white";
                    }
                    if (act1Checked) {
                      if (opt === listeningItems[listIdx].main_idea_options[0]) {
                        btnStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                      } else if (selectedMainIdea === opt) {
                        btnStyle = "border-red-500 bg-red-500/10 text-red-300";
                      }
                    }
                    return (
                      <button
                        key={opt}
                        disabled={act1Checked}
                        onClick={() => setSelectedMainIdea(opt)}
                        className={`p-3 rounded-xl border text-left text-xs font-medium transition cursor-pointer ${btnStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q2: Specific Details */}
              <div className="space-y-4 border-t border-white/5 pt-4">
                <span className="text-xs font-bold text-white block">Q2: Identify specific details from the speech:</span>
                
                {listeningItems[listIdx].detail_questions.map((dq: any, dIdx: number) => (
                  <div key={dIdx} className="p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-2.5">
                    <p className="text-xs font-bold text-zinc-200">{dq.question}</p>
                    <div className="flex gap-2">
                      {dq.options.map((opt: string) => {
                        let btnStyle = "border-white/5 bg-zinc-950 text-zinc-400";
                        if (selectedDetails[dIdx] === opt) {
                          btnStyle = "border-indigo-500 bg-indigo-500/10 text-white font-bold";
                        }
                        if (act1Checked) {
                          if (opt === dq.correct) {
                            btnStyle = "border-green-500 bg-green-500/10 text-green-300 font-extrabold";
                          } else if (selectedDetails[dIdx] === opt) {
                            btnStyle = "border-red-500 bg-red-500/10 text-red-300";
                          }
                        }
                        return (
                          <button
                            key={opt}
                            disabled={act1Checked}
                            onClick={() => setSelectedDetails(prev => ({ ...prev, [dIdx]: opt }))}
                            className={`flex-grow py-2 rounded-lg border text-center text-xs font-semibold transition cursor-pointer ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {act1Checked && (
                <div className={`p-4 rounded-xl text-xs text-left animate-fade-in border ${
                  act1Correct ? "bg-green-500/5 border-green-500/20 text-green-300" : "bg-red-500/5 border-red-500/20 text-red-400"
                }`}>
                  <p className="font-extrabold text-sm">{act1Correct ? "✓ Excellent comprehension!" : "✗ Some details incorrect."}</p>
                  <p className="text-zinc-350 mt-1">Main points represent standard B1 milestones for active listener checkmarks.</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!act1Checked ? (
                  <button
                    onClick={handleCheckActivity1}
                    disabled={!selectedMainIdea || Object.keys(selectedDetails).length < listeningItems[listIdx].detail_questions.length}
                    className="bg-indigo-500 hover:bg-indigo-650 disabled:opacity-40 text-white px-6 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Comprehension
                  </button>
                ) : (
                  <button
                    onClick={handleNextActivity1}
                    className="bg-emerald-500 hover:bg-emerald-450 text-zinc-950 px-5 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {listIdx < listeningItems.length - 1 ? "Next Audio Dialogue" : "Continue to Note-Taking"}
                  </button>
                )}
              </div>

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => {
    if (courseXP < 320) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 5, you need at least 320 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-indigo-650 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-bold">Move to Notes <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 4: Activity B: Note-taking and model comparison */}
      {step === 4 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4 font-sans">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity B – Keywords Note-Taking</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 4 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6 text-left max-w-3xl mx-auto w-full animate-fade-in font-sans">
            
            {/* Audio Refresher */}
            <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[9px] text-zinc-500 uppercase block font-mono">Audio Reference:</span>
                <span className="text-xs text-white font-medium">Important Work Meeting Scene</span>
              </div>
              <button 
                onClick={() => playAudio("어제는 회사에서 중요한 회의가 있었어요. 회의는 오후 두 시에 시작해서 네 시에 끝났어요. 조금 힘들었지만 결과가 좋아서 기뻤어요.")}
                className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/25 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              >
                <Volume2 className="w-4 h-4" /> Re-play Passage
              </button>
            </div>

            {/* Template Selector */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white block">Choose your Note-Taking Template style:</span>
              <div className="flex gap-2">
                {noteTemplates.map((t: any) => (
                  <button
                    key={t.type}
                    onClick={() => {
                      setSelectedTemplateType(t.type);
                      setNotesData({});
                      setNoteTakingSaved(false);
                      setModelNotes(null);
                    }}
                    className={`flex-grow py-2.5 rounded-xl border text-xs font-bold uppercase transition cursor-pointer ${
                      selectedTemplateType === t.type
                        ? "border-indigo-500 bg-indigo-500/10 text-white"
                        : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                    }`}
                  >
                    {t.type} Style
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5 border-t border-white/5 pt-4">
              <span className="text-xs font-bold text-white block">Write keywords or details for each box:</span>
              
              {noteTemplates.find(t => t.type === selectedTemplateType)?.fields.map((field: string) => (
                <div key={field} className="flex items-center gap-3">
                  <span className="w-28 text-zinc-400 text-xs font-bold uppercase font-mono">{field}:</span>
                  <input
                    type="text"
                    placeholder={`e.g. Keywords for ${field}`}
                    value={notesData[field] || ""}
                    onChange={(e) => setNotesData(prev => ({ ...prev, [field]: e.target.value }))}
                    disabled={noteTakingSaved}
                    className="flex-grow bg-zinc-900 border border-white/5 focus:border-indigo-500 outline-none p-3 rounded-xl text-xs text-white"
                  />
                </div>
              ))}
            </div>

            {/* Model Notes Comparison */}
            {modelNotes && (
              <div className="p-4 bg-zinc-900 border border-indigo-500/20 rounded-xl space-y-3 animate-fade-in">
                <span className="text-[10px] text-indigo-400 font-black block uppercase tracking-wider font-mono">Model Notes Comparison:</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
                  <div className="bg-zinc-950 p-3 rounded border border-white/5">
                    <span className="text-zinc-500 block font-bold text-[9px] uppercase">Your Notes:</span>
                    {Object.entries(notesData).map(([k, v]) => (
                      <p key={k} className="text-zinc-300 font-mono"><strong>{k}:</strong> {v || "Empty"}</p>
                    ))}
                  </div>
                  <div className="bg-zinc-950 p-3 rounded border border-white/5">
                    <span className="text-zinc-500 block font-bold text-[9px] uppercase">Model B1 Notes:</span>
                    <p className="text-zinc-300 font-mono">
                      <strong>Main point:</strong> work meeting yesterday 2-4 PM.<br/>
                      <strong>Outcome:</strong> tough but result happy, dinner after.<br/>
                      <strong>Keywords:</strong> 회의 (meeting), 결과 좋음 (good result), 기쁨 (happy).
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 italic mt-1 font-sans">Verify if you captured the main points and simple timings/feelings.</p>
              </div>
            )}

            <div className="flex justify-end pt-1">
              {!noteTakingSaved ? (
                <button
                  onClick={handleSaveNotes}
                  disabled={Object.keys(notesData).length === 0 || savingNotes}
                  className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white px-5 py-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  {savingNotes && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                  <span>Compare to Model Notes</span>
                </button>
              ) : (
                <button
                  onClick={() => setStep(5)}
                  className="bg-emerald-500 text-zinc-950 hover:bg-emerald-450 px-5 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Proceed to Written Summary
                </button>
              )}
            </div>

          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-indigo-500 hover:bg-indigo-650 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-bold">Move to Summary <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 5: Activity C: Written Korean summary */}
      {step === 5 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4 font-sans">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity C – Written Korean Summary</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 5 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6 text-left max-w-2xl mx-auto w-full animate-fade-in font-sans">
            
            <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-[10px] text-zinc-400 font-mono">
              <span className="text-white font-bold block mb-1">Your Keynotes:</span>
              {Object.entries(notesData).map(([k, v]) => (
                <p key={k}>{k}: {v}</p>
              ))}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-white block">Write a 2-4 sentence summary of what you heard in Korean:</span>
              <textarea
                rows={4}
                value={learnerSummaryText}
                onChange={(e) => setLearnerSummaryText(e.target.value)}
                disabled={summaryFeedback !== null}
                placeholder="예: 어제 회사에서 중요한 회의를 했습니다. 회의가 조금 힘들었지만 결과가 좋아서 기뻤습니다..."
                className="w-full bg-zinc-900 border border-white/5 focus:border-indigo-500 outline-none p-4 rounded-xl text-xs text-white resize-none font-korean leading-relaxed"
              />
            </div>

            {summaryFeedback && (
              <div className="p-4 bg-zinc-900 border border-indigo-500/20 rounded-xl space-y-2 text-xs">
                <div className="text-emerald-450 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Writing Analysis Complete
                </div>
                <p className="text-zinc-300"><strong>Feedback:</strong> {summaryFeedback.feedback}</p>
                <p className="text-zinc-450 italic"><strong>Suggestion:</strong> {summaryFeedback.suggestion}</p>
              </div>
            )}

            <div className="flex justify-end pt-1">
              {!summaryFeedback ? (
                <button
                  onClick={handleSubmitSummaryText}
                  disabled={!learnerSummaryText.trim() || submittingSummary}
                  className="bg-indigo-500 hover:bg-indigo-650 disabled:opacity-40 text-white px-5 py-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  {submittingSummary && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                  <span>Evaluate Summary</span>
                </button>
              ) : (
                <button
                  onClick={() => setStep(6)}
                  className="bg-emerald-500 text-zinc-950 hover:bg-emerald-450 px-5 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Proceed to Speaking Coach
                </button>
              )}
            </div>

          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(4)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(6)} className="bg-indigo-500 hover:bg-indigo-650 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-bold">Move to Speaking <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 6: Activity D: Spoken summary coaching */}
      {step === 6 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity D – Spoken Summary Coaching</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 6 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-6 text-left max-w-2xl mx-auto w-full animate-fade-in font-sans">
            
            <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl text-center space-y-3">
              <p className="text-xs text-zinc-350">
                Use your notes or written summary to record a 15–30 second spoken summary in Korean. Talk about the work meeting and the outcome.
              </p>
              
              <button
                onClick={handleRecordSpokenSummary}
                disabled={recording || submittingSpoken}
                className={`py-3.5 px-6 rounded-xl border transition flex items-center justify-center gap-2.5 font-bold text-xs mx-auto cursor-pointer ${
                  recording 
                    ? "border-red-500 bg-red-500/10 text-white animate-pulse" 
                    : "border-indigo-500 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{recording ? "Recording... (Speak now)" : "Record Spoken Summary"}</span>
              </button>
            </div>

            {submittingSpoken && (
              <div className="flex items-center gap-2 justify-center text-xs text-zinc-500">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Transcribing & analyzing speech...</span>
              </div>
            )}

            {spokenFeedback && (
              <div className="p-4 bg-zinc-905 border border-indigo-500/20 rounded-xl space-y-3.5 animate-fade-in">
                <div className="text-emerald-450 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Spoken Summary Scored
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 font-mono uppercase block">Transcribed Text:</span>
                  <p className="font-korean text-xs text-zinc-250 italic bg-zinc-950 p-2.5 rounded border border-white/5 mt-1">"{spokenFeedback.transcribed_text}"</p>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 font-mono uppercase block">Pronunciation &amp; Fluency Coach:</span>
                  <p className="text-xs text-zinc-300 leading-relaxed mt-1">{spokenFeedback.feedback}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setStep(7)}
                className="bg-indigo-500 hover:bg-indigo-650 text-white px-6 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Proceed to Strategy Quiz
              </button>
            </div>

          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(5)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(7)} className="bg-indigo-500 hover:bg-indigo-650 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-bold">Move to Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 7: Activity E: Strategy Quiz */}
      {step === 7 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-400" />
              <span>Mini-Quiz: Strategy &amp; Notes Check</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 7 of {totalSteps}</span>
          </div>

          {quizBlueprint.length > 0 && quizBlueprint[quizIdx] && (
            <div className="space-y-6 max-w-xl mx-auto w-full text-left animate-fade-in">
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>Quiz Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span>Type: {quizBlueprint[quizIdx].type}</span>
              </div>

              <h3 className="text-sm md:text-base font-bold text-white text-center leading-relaxed whitespace-pre-line bg-zinc-950 p-5 rounded-2xl border border-white/5">
                {quizBlueprint[quizIdx].question}
              </h3>

              <div className="grid grid-cols-1 gap-2.5 max-w-md mx-auto w-full font-sans">
                {quizBlueprint[quizIdx].options?.map((opt: string) => {
                  let borderStyle = "border-white/5 bg-zinc-900 text-zinc-300 hover:bg-zinc-800";
                  if (quizSelectedOpt === opt) {
                    borderStyle = "border-indigo-500 bg-indigo-500/10 text-white";
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
                <button onClick={() => setStep(6)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={!quizSelectedOpt}
                    className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-indigo-600 text-white hover:bg-indigo-500 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {finishingQuiz ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : (quizIdx < quizBlueprint.length - 1 ? "Next Question" : "See Capstone Results")}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 8: Activity F: Extra listening practice & feedback */}
      {step === 8 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-indigo-400" />
              <span>Activity F – AI Tutor Listening &amp; Summary Practice</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Step 8 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 space-y-4 text-left max-w-2xl mx-auto w-full font-sans">
            <div className="space-y-1">
              <span className="text-[9px] text-indigo-400 font-mono uppercase tracking-widest block font-bold">Extra AI Practice Lab:</span>
              <p className="text-xs text-zinc-400 leading-normal font-sans">
                Review your listening skills by reacting and summarizing a new scenario on the fly with Gwan-Sik.
              </p>
            </div>

            {!practiceSessionId ? (
              <button
                onClick={() => handleStartPractice("work_meeting")}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl transition text-xs cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Launch AI Listening Summary Lab</span>
              </button>
            ) : (
              <div className="space-y-3 w-full animate-fade-in font-sans">
                <div className="bg-zinc-900 rounded-xl p-4 border border-white/5 h-44 overflow-y-auto space-y-2.5 custom-scrollbar">
                  {practiceMessages.map((msg, idx) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
                        <div className={`max-w-[80%] rounded-xl p-2.5 text-xs leading-relaxed ${
                          isUser ? "bg-indigo-500 text-white" : "bg-zinc-950 text-zinc-300 border border-white/5"
                        }`}>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {practiceSending && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 italic">
                      <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                      <span>Gwan-Sik is typing...</span>
                    </div>
                  )}
                </div>

                {!practiceFinished ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={practiceText}
                      onChange={(e) => setPracticeText(e.target.value)}
                      placeholder="Type summary or response in Korean..."
                      onKeyDown={(e) => e.key === "Enter" && handleSendPracticeTurn()}
                      className="flex-grow bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-korean"
                    />
                    <button
                      onClick={handleSendPracticeTurn}
                      disabled={practiceSending || !practiceText.trim()}
                      className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-4 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Send
                    </button>
                    <button
                      onClick={handleFinishPractice}
                      className="bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-300 px-4 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Finish
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-900 rounded-xl border border-indigo-500/20 text-xs text-zinc-405 animate-fade-in">
                    <p className="font-bold text-white mb-1">Practice Feedback Report:</p>
                    <p>{practiceFeedback || "Listening practice successfully complete!"}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 font-sans">
            <button onClick={() => setStep(7)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(9)} className="bg-indigo-500 hover:bg-indigo-650 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-bold">Proceed to Graduation <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 9: Phase Graduation & Completion */}
      {step === 9 && (
        <div className="glass-panel p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in max-w-3xl mx-auto">
          <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/25 w-fit mx-auto text-indigo-400">
            <Award className="w-10 h-10 animate-bounce" />
          </div>
          
          <div>
            <h2 className="text-3xl font-black text-white font-sans">Korean 4.5 Listening Graduated! 🎓📖</h2>
            <p className="text-zinc-400 text-sm mt-1.5 font-sans">Congratulations on completing Korean 4.5! Excellent B1 listening comprehension &amp; summary skills.</p>
            <p className="text-xs text-zinc-550 mt-1 font-sans">Next: Phase 6 – Real‑Context Fluency Capstone (combining all B1 skills).</p>
          </div>

          {/* Homework checklist */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-left text-xs space-y-3 font-sans leading-relaxed">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block font-sans">Interactive Homework List:</span>
            <div className="space-y-2">
              {homeworkItems.map((item: any) => {
                const isChecked = !!completedHomework[item.id];
                return (
                  <label key={item.id} className="flex items-start gap-3 p-3 bg-zinc-900/45 rounded-lg border border-white/[0.03] cursor-pointer hover:bg-zinc-900 transition">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleHomework(item.id, isChecked)}
                      className="mt-0.5 rounded border-white/10 text-indigo-500 focus:ring-0 focus:ring-offset-0 bg-zinc-950"
                    />
                    <div className="text-zinc-300">
                      <span className="font-bold text-white block mb-0.5 font-sans">
                        {item.id === "hw_b1_list_1" ? "Task 1: Structured Listening" : item.id === "hw_b1_list_2" ? "Task 2: Summary Refinement" : "Task 3: Reflection Essay"}
                      </span>
                      <span className={isChecked ? "line-through text-zinc-500" : ""}>{item.text}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Graduation rewards block */}
          <div className="p-5 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 rounded-2xl border border-indigo-500/20 text-center space-y-1">
            <div className="flex justify-center items-center gap-1 text-indigo-400 font-extrabold text-sm uppercase">
              <Award className="w-5 h-5" />
              <span>Badge Earned: {quizBadge || "Active Listener B1"}</span>
            </div>
            <div className="flex justify-center gap-4 text-xs font-bold pt-1">
              <span className="text-indigo-450 font-sans">XP +150 Completion Bonus</span>
              <span className="text-zinc-700">|</span>
              <span className="text-cyan-400 font-sans">Phase 5 Complete</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 150, type: "correct" } }));
              }onComplete();
            }}
            className="bg-gradient-to-r from-indigo-650 to-cyan-500 hover:from-indigo-600 text-white font-black py-4 px-10 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <span>Complete Phase 5 &amp; Continue</span>
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
