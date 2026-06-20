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
  CheckSquare
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

interface Course5Phase5ListeningWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course5Phase5ListeningWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course5Phase5ListeningWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 6;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1 states
  const [activity1Step, setActivity1Step] = useState<"1A" | "1B">("1A");
  const [listeningItems, setListeningItems] = useState<any[]>([]);
  const [listIdx, setListIdx] = useState(0);
  const [selectedMainIdea, setSelectedMainIdea] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<Record<number, string>>({});
  const [act1Checked, setAct1Checked] = useState(false);
  const [act1Correct, setAct1Correct] = useState<boolean | null>(null);
  const [revealTranscript, setRevealTranscript] = useState(false);

  // Activity 2 states
  const [activity2SubStep, setActivity2SubStep] = useState<"2A" | "2B" | "2C">("2A");
  
  // Note taking templates
  const [noteTemplates, setNoteTemplates] = useState<any[]>([]);
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>("story");
  const [notesData, setNotesData] = useState<Record<string, string>>({});
  const [noteTakingSaved, setNoteTakingSaved] = useState(false);
  const [modelNotes, setModelNotes] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);

  // Text summary
  const [learnerSummaryText, setLearnerSummaryText] = useState("");
  const [summaryFeedback, setSummaryFeedback] = useState<any>(null);
  const [submittingSummary, setSubmittingSummary] = useState(false);

  // Spoken summary
  const [recording, setRecording] = useState(false);
  const [spokenFeedback, setSpokenFeedback] = useState<any>(null);
  const [submittingSpoken, setSubmittingSpoken] = useState(false);

  // Quiz states
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);
  const [quizBadge, setQuizBadge] = useState<string | null>(null);

  // Homework states
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Homework AI Listening Summary Practice
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [practiceMessages, setPracticeMessages] = useState<any[]>([]);
  const [practiceText, setPracticeText] = useState("");
  const [practiceSending, setPracticeSending] = useState(false);
  const [practiceFinished, setPracticeFinished] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);

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
        } else if (step === 4) {
          if (noteTemplates.length === 0) {
            const res = await apiJson("/practice/listening/notes-templates");
            setNoteTemplates(res || []);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean4/phase-5/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
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

  // Activity 1 checks
  const handleCheckActivity1 = async () => {
    const current = listeningItems[listIdx];
    if (!current) return;

    let isCorrect = false;
    if (activity1Step === "1A") {
      isCorrect = selectedMainIdea === current.main_idea_options[0]; // First option represents the correct main idea in curriculum data
    } else {
      // Check if all details selected match the correct answers
      const currentDetails = current.detail_questions || [];
      isCorrect = currentDetails.every((dq: any, dIdx: number) => {
        return selectedDetails[dIdx] === dq.correct;
      });
    }

    setAct1Checked(true);
    setAct1Correct(isCorrect);

    try {
      await apiJson("/practice/listening/long-b1/answer", {
        method: "POST",
        body: JSON.stringify({
          question_id: `${current.id}_${activity1Step}`,
          answer: activity1Step === "1A" ? selectedMainIdea : JSON.stringify(selectedDetails),
          time_taken_ms: 5000
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
    if (activity1Step === "1A") {
      setActivity1Step("1B");
    } else {
      setActivity1Step("1A");
      if (listIdx < listeningItems.length - 1) {
        setListIdx(listIdx + 1);
        setSelectedMainIdea(null);
        setSelectedDetails({});
      } else {
        setStep(4);
      }
    }
  };

  // Note-taking submit
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

  // Text Summary evaluation
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

  // Spoken summary mock recorder
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
    }, 3000);
  };

  // Quiz checks
  const handleCheckQuiz = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelectedOpt) return;

    const isCorrect = quizSelectedOpt === current.correct_answer;
    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    if (!isCorrect) {
      setQuizMistakes((prev) => [...prev, current.id]);
    }

    try {
      await apiJson("/quiz/korean4/phase-5/answer", {
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
        const res = await apiJson("/quiz/korean4/phase-5/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Active Listener B1");
        setStep(6);
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
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

  // Homework AI Practice Session
  const handleStartHomeworkPractice = async (scen: string) => {
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

    const outlineSteps = [
    { num: 1, label: "Screen 1 – Welcome / Phase Overview" },
    { num: 2, label: "Screen 2 – Listening & Note-Taking Foundations" },
    { num: 3, label: "Screen 3 – Activity 1: Main Points & Details Extraction" },
    { num: 4, label: "Screen 4 – Activity 2: Note Templates & Summaries" },
    { num: 5, label: "Screen 5 – Mini-Quiz: Listening Checkpoint" },
    { num: 6, label: "Screen 6 – Homework & AI Summaries" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 5,
          phaseNum: 5,
          step: step
        }
      }));
    }
  }, [step]);

return (
    <div className="flex-grow flex flex-col justify-between">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <BookOpen className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Korean 4.5 – Longer Listening & Note‑Taking"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: B1 Listening & Keywords Synthesis</p>
          </div>
        </div>
        
        {/* Active progress bar */}
        <div className="flex items-center space-x-4">
          <div className="w-40 h-3 bg-zinc-900/80 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 rounded-full transition-all duration-500" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 font-bold">{Math.round((step / totalSteps) * 100)}%</span>
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

      {/* Screen 1: Welcome/Overview */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight font-sans">Korean 4.5</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Longer Listening & Note‑Taking</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Understand longer Korean and keep simple notes."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Follow longer speech about familiar topics (school, work, hobbies, travel)",
                "Catch the main points and important details",
                "Take simple notes and use them to summarize what you heard"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 35}–40 minutes</p>
          </div>

          {/* Mode Selector */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Conversation Mode</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("text")}
                className={`p-3 rounded-xl border text-xs font-bold transition ${
                  mode === "text" 
                    ? "border-brand-500 bg-brand-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                Text Input
              </button>
              <button
                onClick={() => setMode("voice")}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  mode === "voice" 
                    ? "border-brand-500 bg-brand-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice + Text</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => setStep(2)}
              className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 5</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
          </div>

          
        </div>
      )}

      {/* Screen 2: Concept Explanation */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>Main Points, Details & Simple Notes</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">B1 Listening Goal</p>
            <p className="italic">
              “At B1, you should understand the main points of clear, standard speech on familiar matters, including short narratives and explanations.”
            </p>
          </div>

          {/* Main Points vs Details Example */}
          <div className="space-y-2 text-left text-xs">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">1. Main Points vs Details</span>
            {coreData?.example_listenings?.map((ex: any, idx: number) => (
              <div key={idx} className="p-3 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-brand-400 font-bold font-sans">Topic: "{ex.topic}"</span>
                  <button 
                    onClick={() => playAudio(ex.ko)}
                    className="p-1 bg-zinc-950 rounded text-zinc-400 hover:text-white flex items-center gap-1 text-[9px] px-2 border border-white/5 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" /> Listen Audio
                  </button>
                </div>
                <p className="font-korean text-zinc-200">{ex.ko}</p>
                <div className="bg-zinc-950 p-2.5 rounded border border-white/5 text-[10px] text-zinc-400 space-y-1">
                  <p><strong className="text-emerald-400">Main Point:</strong> Going to Hangang Park with friends on weekends.</p>
                  <p><strong className="text-amber-400">Details:</strong> Ride bikes, eat delicious food, good weather, lots of people, hiking next week.</p>
                </div>
              </div>
            ))}
          </div>

          {/* Note Templates */}
          <div className="space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">2. Simple B1 Note-Taking Templates</span>
            <div className="grid grid-cols-2 gap-2.5">
              {coreData?.note_templates?.map((t: any, idx: number) => (
                <div key={idx} className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 text-[10px] space-y-1.5">
                  <span className="font-bold text-white uppercase tracking-wider block">{t.type} template</span>
                  <div className="flex flex-wrap gap-1">
                    {t.fields.map((f: string) => (
                      <span key={f} className="px-1.5 py-0.5 bg-zinc-950 text-zinc-400 rounded border border-white/5 text-[8px]">{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes to summary */}
          <div className="space-y-2 text-left text-xs bg-zinc-900/40 p-4 rounded-xl border border-white/5">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">3. Notes to Summary Example</span>
            {coreData?.notes_summary_examples?.map((ex: any, idx: number) => (
              <div key={idx} className="space-y-1.5">
                <p className="text-[10px] text-zinc-400 font-mono"><strong>Notes Taken:</strong> {ex.notes}</p>
                <p className="font-korean text-white"><strong>Korean Summary:</strong> {ex.summary_ko}</p>
                <p className="text-zinc-400 italic text-[11px]">"{ex.summary_en}"</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Identify Main Points & Details */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>{activity1Step === "1A" ? "Activity 1A – What's the main point?" : "Activity 1B – Pick the key details"}</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {listeningItems[listIdx] && (
            <div className="space-y-4 text-left">
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl flex flex-col items-center gap-3">
                <span className="text-[9px] text-zinc-500 uppercase font-mono block">Play B1 Korean Monologue:</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => playAudio(listeningItems[listIdx].ko)}
                    className="p-3 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 font-bold rounded-xl border border-brand-500/25 flex items-center gap-2 text-xs transition duration-150 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 animate-bounce" /> Play Korean Audio (60s)
                  </button>
                  <button 
                    onClick={() => setRevealTranscript(!revealTranscript)}
                    className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs rounded-xl border border-white/5 transition cursor-pointer"
                  >
                    {revealTranscript ? "Hide Script" : "Show Script (Help)"}
                  </button>
                </div>
                {revealTranscript && (
                  <p className="font-korean text-xs text-zinc-300 mt-2 bg-zinc-900 p-3 rounded-lg border border-white/5 leading-relaxed">{listeningItems[listIdx].ko}</p>
                )}
              </div>

              {activity1Step === "1A" ? (
                /* 1A: Main Point */
                <div className="space-y-2.5">
                  <p className="text-xs text-zinc-400 font-bold">What is the main point of this speech?</p>
                  <div className="space-y-2">
                    {listeningItems[listIdx].main_idea_options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !act1Checked && setSelectedMainIdea(opt)}
                        disabled={act1Checked}
                        className={`w-full p-3.5 rounded-xl border text-left text-xs font-medium transition ${
                          selectedMainIdea === opt
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                        } ${act1Checked && listeningItems[listIdx].correct_main_idea === opt ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* 1B: Key Details */
                <div className="space-y-4">
                  <p className="text-xs text-zinc-400 font-bold">Identify specific details from the speech:</p>
                  {listeningItems[listIdx].detail_questions.map((dq: any, dIdx: number) => (
                    <div key={dIdx} className="space-y-1.5 p-3.5 bg-zinc-950/60 rounded-xl border border-white/5">
                      <p className="text-xs font-semibold text-white">{dq.question}</p>
                      <div className="flex gap-2">
                        {dq.options.map((opt: string) => (
                          <button
                            key={opt}
                            onClick={() => !act1Checked && setSelectedDetails(prev => ({ ...prev, [dIdx]: opt }))}
                            disabled={act1Checked}
                            className={`flex-grow p-2 rounded-lg border text-center text-xs font-bold transition ${
                              selectedDetails[dIdx] === opt
                                ? "border-brand-500 bg-brand-500/10 text-white"
                                : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                            } ${act1Checked && dq.correct === opt ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {act1Checked && (
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 text-center max-w-md mx-auto">
                  <p className="font-extrabold text-white">{act1Correct ? "✓ Excellent comprehension!" : "✗ Some details incorrect."}</p>
                  <p className="text-[10px] text-zinc-500 mt-1">Main points represent standard B1 milestones for active listener checkmarks.</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!act1Checked ? (
                  <button
                    onClick={handleCheckActivity1}
                    disabled={activity1Step === "1A" ? !selectedMainIdea : Object.keys(selectedDetails).length < listeningItems[listIdx].detail_questions.length}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Confirm Answers
                  </button>
                ) : (
                  <button
                    onClick={handleNextActivity1}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {activity1Step === "1A" ? "Move to Details" : "Go to Note-Taking"}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button 
              onClick={() => {
                if (activity1Step === "1B") {
                  setActivity1Step("1A");
                } else {
                  setStep(2);
                }
              }} 
              className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(4)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 2: Note-Taking & Summaries */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Notes & Summaries</span>
            </h2>
            <div className="flex gap-1">
              {["2A", "2B", "2C"].map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActivity2SubStep(sub as any)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    activity2SubStep === sub 
                      ? "bg-brand-500 text-white" 
                      : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Substep 2A: Guided note-taking */}
          {activity2SubStep === "2A" && (
            <div className="space-y-4 text-left">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Activity 2A – Guided note-taking</span>
              
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
                    className={`flex-grow py-2 rounded-xl border text-xs font-bold uppercase transition ${
                      selectedTemplateType === t.type
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                    }`}
                  >
                    {t.type} Template
                  </button>
                ))}
              </div>

              <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl flex flex-col items-center gap-2">
                <span className="text-[9px] text-zinc-500 uppercase font-mono">1. Play speech to take notes:</span>
                <button 
                  onClick={() => playAudio("어제는 회사에서 중요한 회의가 있었어요. 회의는 오후 두 시에 시작해서 네 시에 끝났어요.")}
                  className="p-2.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 font-bold rounded-xl border border-brand-500/25 flex items-center gap-1.5 text-xs transition cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Play Work Story (60s)
                </button>
              </div>

              {/* Note input fields */}
              <div className="space-y-2">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold">2. Fill keywords in fields:</span>
                {noteTemplates.find(t => t.type === selectedTemplateType)?.fields.map((field: string) => (
                  <div key={field} className="flex items-center gap-3">
                    <span className="w-24 text-zinc-400 text-xs font-bold uppercase font-mono">{field}:</span>
                    <input
                      type="text"
                      placeholder={`Key words for ${field}`}
                      value={notesData[field] || ""}
                      onChange={(e) => setNotesData(prev => ({ ...prev, [field]: e.target.value }))}
                      disabled={noteTakingSaved}
                      className="flex-grow bg-zinc-900 border border-white/5 focus:border-brand-500 outline-none p-2 rounded-xl text-xs text-white"
                    />
                  </div>
                ))}
              </div>

              {modelNotes && (
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/5 text-xs space-y-1">
                  <p className="font-bold text-white text-[10px] uppercase font-mono tracking-wider">Model Notes Comparison:</p>
                  <p className="text-zinc-300 italic">{modelNotes}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!noteTakingSaved ? (
                  <button
                    onClick={handleSaveNotes}
                    disabled={Object.keys(notesData).length === 0 || savingNotes}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {savingNotes && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Notes</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActivity2SubStep("2B")}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Proceed to Text Summary
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Substep 2B: Text Summary */}
          {activity2SubStep === "2B" && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Activity 2B – Write summary (Korean)</span>
              
              <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl text-[10px] text-zinc-400 font-mono">
                <span className="text-white font-bold block mb-1">Your Notes:</span>
                {Object.entries(notesData).map(([k, v]) => (
                  <p key={k}>{k}: {v}</p>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-zinc-400 font-bold">Write a 2-4 sentence summary of what you heard in Korean:</p>
                <textarea
                  rows={3}
                  value={learnerSummaryText}
                  onChange={(e) => setLearnerSummaryText(e.target.value)}
                  disabled={summaryFeedback !== null}
                  placeholder="예: 어제 회사에서 중요한 회의가 있었습니다..."
                  className="w-full bg-zinc-900 border border-white/5 focus:border-brand-500 outline-none p-3.5 rounded-xl text-xs text-white resize-none"
                />
              </div>

              {summaryFeedback && (
                <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-2 text-xs">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Assessment Complete
                  </div>
                  <p className="text-zinc-300"><strong>Feedback:</strong> {summaryFeedback.feedback}</p>
                  <p className="text-zinc-400 italic"><strong>Suggestion:</strong> {summaryFeedback.suggestion}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!summaryFeedback ? (
                  <button
                    onClick={handleSubmitSummaryText}
                    disabled={!learnerSummaryText.trim() || submittingSummary}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {submittingSummary && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Submit Summary</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActivity2SubStep("2C")}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Go to Spoken Summary
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Substep 2C: Spoken summary */}
          {activity2SubStep === "2C" && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Activity 2C – Record spoken summary</span>
              
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl flex flex-col items-center gap-3">
                <span className="text-xs text-zinc-400 text-center">Use your notes to record a 15-30 second spoken summary in Korean.</span>
                
                <button
                  onClick={handleRecordSpokenSummary}
                  disabled={recording || submittingSpoken}
                  className={`p-4 rounded-full border transition flex items-center justify-center gap-2 font-bold text-xs ${
                    recording 
                      ? "border-red-500 bg-red-500/10 text-white animate-pulse" 
                      : "border-brand-500 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20"
                  } cursor-pointer`}
                >
                  <Mic className="w-4 h-4" />
                  <span>{recording ? "Recording... (Speak now)" : "Record Spoken Summary"}</span>
                </button>
              </div>

              {submittingSpoken && (
                <div className="flex items-center gap-2 justify-center text-xs text-zinc-500">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-500" /> Transcribing & scoring speech...
                </div>
              )}

              {spokenFeedback && (
                <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-2 text-xs">
                  <div className="text-emerald-400 font-bold">✓ Spoken Speech Scored</div>
                  <p className="text-zinc-300 font-mono"><strong>Transcribed:</strong> "{spokenFeedback.transcribed_text}"</p>
                  <p className="text-zinc-400 leading-relaxed"><strong>Coach:</strong> {spokenFeedback.feedback}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setStep(5)}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Proceed to mini-quiz
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button 
              onClick={() => {
                if (activity2SubStep === "2C") {
                  setActivity2SubStep("2B");
                } else if (activity2SubStep === "2B") {
                  setActivity2SubStep("2A");
                } else {
                  setStep(3);
                }
              }} 
              className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Mini-Quiz */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Mini‑Quiz: Register & Note Check</span>
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-500 rounded-full transition-all duration-300"
                  style={{ width: `${((quizIdx + 1) / quizBlueprint.length) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 font-bold">Q {quizIdx + 1}/{quizBlueprint.length}</span>
            </div>
          </div>

          {quizBlueprint[quizIdx] && (
            <div className="space-y-4 text-left">
              <span className="text-[9px] text-zinc-500 uppercase font-mono block">Question category: {quizBlueprint[quizIdx].type}</span>
              <h3 className="text-sm font-bold text-white leading-relaxed">{quizBlueprint[quizIdx].question}</h3>

              <div className="space-y-2">
                {quizBlueprint[quizIdx].options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                    disabled={quizChecked}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition ${
                      quizSelectedOpt === opt
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    } ${quizChecked && quizBlueprint[quizIdx].correct_answer === opt ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {quizChecked && (
                <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                  quizCorrect ? "border-accent-teal/20 bg-accent-teal/5 text-accent-teal" : "border-red-500/20 bg-red-500/5 text-red-400"
                }`}>
                  <p className="font-bold">{quizCorrect ? "✓ Correct!" : "✗ Incorrect."}</p>
                  <p className="text-zinc-400 font-sans mt-0.5">{quizBlueprint[quizIdx].explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={!quizSelectedOpt}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {finishingQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 6: Homework & Completion */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-accent-teal/10 rounded-full border border-accent-teal/25 w-fit mx-auto text-accent-teal shrink-0">
            <Award className="w-10 h-10 animate-bounce" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">Phase 5 Complete!</h2>
            <p className="text-xs text-zinc-400 mt-1">Excellent B1 listening comprehension & summary skills.</p>
          </div>

          {quizScore !== null && (
            <div className="bg-zinc-900/60 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full flex items-center justify-between text-left">
              <div>
                <span className="text-[9px] text-zinc-500 uppercase font-mono block">Accuracy Metrics:</span>
                <span className="text-lg font-black text-white">{quizScore}% Quiz Score</span>
              </div>
              <div className="px-3 py-1 bg-brand-500/10 border border-brand-500/25 rounded-lg text-brand-400 text-xs font-bold">
                🏆 {quizBadge} Badge Earned!
              </div>
            </div>
          )}

          {/* Homework checklist */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 text-left text-xs space-y-3 max-w-md mx-auto w-full">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">📝 Practical Homework Tasks:</span>
            <div className="space-y-2">
              {homeworkItems.map((hw: any) => (
                <div 
                  key={hw.id}
                  onClick={() => handleToggleHomework(hw.id, completedHomework[hw.id] || false)}
                  className="flex items-start gap-2.5 p-2 bg-zinc-900/40 rounded-lg border border-white/[0.04] cursor-pointer hover:bg-zinc-900 transition"
                >
                  <input
                    type="checkbox"
                    checked={completedHomework[hw.id] || false}
                    readOnly
                    className="mt-0.5 pointer-events-none"
                  />
                  <span className={`text-[11px] leading-relaxed ${completedHomework[hw.id] ? "text-zinc-500 line-through" : "text-zinc-300"}`}>{hw.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI practice room launch */}
          <div className="bg-zinc-950 p-4.5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">🤖 Practice listening & summarizing with AI Tutor:</span>
            
            {!practiceSessionId ? (
              <button
                onClick={() => handleStartHomeworkPractice("work_meeting")}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Start AI Listening & Summary Practice</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="max-h-[150px] overflow-y-auto space-y-2 p-2 bg-zinc-900 rounded-lg border border-white/5">
                  {practiceMessages.map((msg, idx) => (
                    <div key={idx} className={`p-2 rounded-lg text-xs leading-relaxed max-w-[85%] ${
                      msg.sender === "user" 
                        ? "bg-brand-500/10 border border-brand-500/20 text-white ml-auto" 
                        : "bg-zinc-950 border border-white/5 text-zinc-300 mr-auto"
                    }`}>
                      {msg.text}
                    </div>
                  ))}
                </div>

                {!practiceFinished ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Write your summary/reply in Korean..."
                      value={practiceText}
                      onChange={(e) => setPracticeText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendPracticeTurn()}
                      className="flex-grow bg-zinc-900 border border-white/5 focus:border-brand-500 outline-none p-2 rounded-xl text-xs text-white"
                    />
                    <button
                      onClick={handleSendPracticeTurn}
                      disabled={practiceSending || !practiceText.trim()}
                      className="bg-brand-500 hover:bg-brand-600 px-4 rounded-xl text-xs font-bold text-white transition flex items-center gap-1 cursor-pointer"
                    >
                      {practiceSending && <Loader2 className="w-3 animate-spin" />}
                      <span>Send</span>
                    </button>
                    <button
                      onClick={handleFinishPractice}
                      className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 px-3 rounded-xl text-xs font-bold text-red-400 cursor-pointer"
                    >
                      End
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 text-[11px] text-zinc-400 space-y-1.5 animate-fade-in">
                    <p className="font-bold text-white">Practice Feedback Report:</p>
                    <p>{practiceFeedback}</p>
                    <button 
                      onClick={() => setPracticeSessionId(null)}
                      className="text-[10px] text-brand-400 hover:underline block mt-1 cursor-pointer"
                    >
                      Start new practice scenario
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 max-w-xs mx-auto pt-2">
            <button 
              onClick={onComplete}
              className="bg-accent-teal hover:bg-accent-teal/90 text-zinc-950 font-extrabold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-accent-teal/20"
            >
              <span>Graduate to Phase 6</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-zinc-500">Next: Phase 6 – Real‑Context Fluency Capstone (combining all B1 skills).</p>
          </div>
        </div>
      )}
    </div>
  );
}
