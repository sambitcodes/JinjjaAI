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
  Users,
  Briefcase,
  GraduationCap
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

interface Course5Phase4RegisterWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course5Phase4RegisterWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course5Phase4RegisterWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 6;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1 states
  const [activity1Step, setActivity1Step] = useState<"1A" | "1B">("1A");
  const [recognitionItems, setRecognitionItems] = useState<any[]>([]);
  const [recIdx, setRecIdx] = useState(0);
  const [selectedListener, setSelectedListener] = useState<string | null>(null);
  const [selectedApprop, setSelectedApprop] = useState<string | null>(null);
  const [act1Checked, setAct1Checked] = useState(false);
  const [act1Correct, setAct1Correct] = useState<boolean | null>(null);

  // Activity 2 states
  const [activity2SubStep, setActivity2SubStep] = useState<"2A" | "2B" | "2C">("2A");
  
  // Activity 2A transform templates
  const [transformTemplates, setTransformTemplates] = useState<any[]>([]);
  const [activeTransIdx, setActiveTransIdx] = useState(0);
  const [selectedContext, setSelectedContext] = useState<string>("friend");
  const [selectedTransformOption, setSelectedTransformOption] = useState<string | null>(null);
  const [builtTransform, setBuiltTransform] = useState<any>(null);
  const [buildingTransform, setBuildingTransform] = useState(false);

  // Activity 2B Softening Builder
  const [selectedSoftener, setSelectedSoftener] = useState<string | null>(null);
  const [selectedBaseIdea, setSelectedBaseIdea] = useState<string>("그건 틀렸어요 (That is wrong)");
  const [builtSoften, setBuiltSoften] = useState<any>(null);
  const [buildingSoften, setBuildingSoften] = useState(false);

  // Activity 2C AI Context Switch Roleplay
  const [roleplaySessionId, setRoleplaySessionId] = useState<string | null>(null);
  const [roleplayScenario, setRoleplayScenario] = useState<string>("friend"); // friend vs teacher
  const [roleplayMessages, setRoleplayMessages] = useState<any[]>([]);
  const [roleplayText, setRoleplayText] = useState("");
  const [roleplaySending, setRoleplaySending] = useState(false);
  const [roleplayFinished, setRoleplayFinished] = useState(false);
  const [roleplayFeedback, setRoleplayFeedback] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

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

  // Homework AI Politeness Practice Rooms
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [practiceScenario, setPracticeScenario] = useState<string>("friend");
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
          const res = await apiJson("/phases/korean4/4/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean4/4/core-data");
          setCoreData(res);
        } else if (step === 3 && recognitionItems.length === 0) {
          const res = await apiJson("/practice/register/recognition");
          setRecognitionItems(res.items || []);
        } else if (step === 4) {
          if (transformTemplates.length === 0) {
            const res = await apiJson("/practice/register/transform-templates");
            setTransformTemplates(res || []);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean4/phase-4/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean4/4/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading B1 register data:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1 Checks
  const handleCheckActivity1 = async () => {
    const current = recognitionItems[recIdx];
    if (!current) return;

    let isCorrect = false;
    if (activity1Step === "1A") {
      isCorrect = selectedListener === current.listener;
    } else {
      isCorrect = selectedApprop === "OK"; // Simple check
    }

    setAct1Checked(true);
    setAct1Correct(isCorrect);

    try {
      await apiJson("/practice/register/recognition/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: `${current.id}_${activity1Step}`,
          is_correct: isCorrect,
          time_taken_ms: 3000
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextActivity1 = () => {
    setAct1Checked(false);
    setAct1Correct(null);
    if (activity1Step === "1A") {
      setActivity1Step("1B");
    } else {
      setActivity1Step("1A");
      if (recIdx < recognitionItems.length - 1) {
        setRecIdx(recIdx + 1);
      } else {
        setStep(4);
      }
    }
  };

  // Activity 2A transform register
  const handleTransformRegister = async () => {
    const current = transformTemplates[activeTransIdx];
    if (!current || !selectedTransformOption) return;

    setBuildingTransform(true);
    try {
      const res = await apiJson("/practice/register/transform", {
        method: "POST",
        body: JSON.stringify({
          base_sentence: current.base_meaning,
          target_context: selectedContext,
          learner_choice: selectedTransformOption
        })
      });
      setBuiltTransform(res);
      playAudio(res.evaluated_sentence);
    } catch (err) {
      console.error(err);
    } finally {
      setBuildingTransform(false);
    }
  };

  const handleNextTransform = () => {
    setBuiltTransform(null);
    setSelectedTransformOption(null);
    if (activeTransIdx < transformTemplates.length - 1) {
      setActiveTransIdx(activeTransIdx + 1);
    } else {
      setActivity2SubStep("2B");
    }
  };

  // Activity 2B Soften Builder
  const handleSoftenRegister = async () => {
    if (!selectedSoftener) return;
    setBuildingSoften(true);
    try {
      const res = await apiJson("/practice/register/soften", {
        method: "POST",
        body: JSON.stringify({
          softening_phrase: selectedSoftener,
          base_idea: selectedBaseIdea
        })
      });
      setBuiltSoften(res);
      playAudio(res.reply_ko);
    } catch (err) {
      console.error(err);
    } finally {
      setBuildingSoften(false);
    }
  };

  // Activity 2C AI Context Switch Roleplay
  const handleStartRoleplay = async (scen: string) => {
    setRoleplayScenario(scen);
    setRoleplayMessages([]);
    setRoleplayFeedback(null);
    setRoleplayFinished(false);
    try {
      const res = await apiJson("/conversation/b1/register-switch/start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: scen })
      });
      setRoleplaySessionId(res.session_id);
      setRoleplayMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") {
        playAudio(res.opener);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendRoleplayTurn = async () => {
    if (!roleplayText.trim() || !roleplaySessionId) return;
    const textToSend = roleplayText;
    setRoleplayText("");
    setRoleplayMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setRoleplaySending(true);

    try {
      const res = await apiJson("/conversation/b1/register-switch/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setRoleplayMessages((prev) => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") {
        playAudio(res.reply_ko);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRoleplaySending(false);
    }
  };

  const handleFinishRoleplay = async () => {
    if (!roleplaySessionId) return;
    try {
      const res = await apiJson("/conversation/b1/register-switch/finish", { method: "POST" });
      setRoleplayFeedback(res.feedback);
      setRoleplayFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartVoiceRecording = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      if (roleplayScenario === "friend") {
        setRoleplayText("응, 숙제 다 했어. 너는?");
      } else {
        setRoleplayText("교수님, 과제 제출했는데요. 질문이 있습니다.");
      }
    }, 2000);
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
      await apiJson("/quiz/korean4/phase-4/answer", {
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
        const res = await apiJson("/quiz/korean4/phase-4/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Polite Speaker B1");
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
      await apiJson("/phases/korean4/4/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Homework AI Politeness Practice Rooms
  const handleStartHomeworkPractice = async (scen: string) => {
    setPracticeScenario(scen);
    setPracticeMessages([]);
    setPracticeFeedback(null);
    setPracticeFinished(false);
    try {
      const res = await apiJson("/conversation/b1/politeness-practice/start", {
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
      const res = await apiJson("/conversation/b1/politeness-practice/turn", {
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
      const res = await apiJson("/conversation/b1/politeness-practice/finish", { method: "POST" });
      setPracticeFeedback(res.feedback);
      setPracticeFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

    const outlineSteps = [
    { num: 1, label: "Screen 1 – Welcome / Phase Overview" },
    { num: 2, label: "Screen 2 – Register, Politeness & Softening Chunks" },
    { num: 3, label: "Screen 3 – Activity 1: Recognize Appropriate Register" },
    { num: 4, label: "Screen 4 – Activity 2: Adjust & Soften Disagreements" },
    { num: 5, label: "Screen 5 – Mini-Quiz: Polite Interaction Check" },
    { num: 6, label: "Screen 6 – Homework & AI Politeness Practices" }
  ];

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
              <span>{activeLesson?.title || "Korean 4.4 – Politeness & Register in Real Life"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Casual vs Respectful Speech Registers</p>
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
          
          <h2 className="text-5xl font-black text-white tracking-tight font-sans">Korean 4.4</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Politeness & Register in Real Life</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Speak differently with friends, teachers, and staff."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Recognize when speech is casual, polite, or more formal",
                "Adjust your Korean when speaking to friends, older people, and staff",
                "Use softening phrases for polite disagreement and requests"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 30}–35 minutes</p>
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
              <span>Start Phase 4</span>
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
              <span>Register, Politeness & Softening</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">What is “register” and politeness?</p>
            <p className="italic">
              “Register is how you say something, not just what you say. You change your language depending on who you’re talking to and the situation.”
            </p>
          </div>

          {/* Three Context Examples */}
          <div className="space-y-2 text-left text-xs">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Context Examples (Meaning: Can we meet tomorrow?)</span>
            {coreData?.register_examples?.map((ex: any, idx: number) => (
              <div key={idx} className="p-3 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                <span className="text-brand-400 font-bold font-sans">Semantic Intent: "{ex.meaning}"</span>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="bg-zinc-950 p-2 rounded border border-white/5">
                    <span className="text-red-400 font-bold block mb-0.5">Friend (Casual):</span>
                    <span className="font-korean">{ex.friend}</span>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-white/5">
                    <span className="text-green-400 font-bold block mb-0.5">Teacher (Honorific):</span>
                    <span className="font-korean">{ex.teacher}</span>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-white/5">
                    <span className="text-cyan-400 font-bold block mb-0.5">Staff (Polite):</span>
                    <span className="font-korean">{ex.staff}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Softening phrases cards */}
          <div className="space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">B1 Polite Disagreement Softeners</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {coreData?.softening_phrases?.map((sf: any, idx: number) => (
                <div key={idx} className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 flex justify-between items-center text-[10px]">
                  <div>
                    <span className="font-korean font-bold text-white block truncate">{sf.ko}</span>
                    <span className="text-zinc-500 block truncate">{sf.en}</span>
                  </div>
                  <button onClick={() => playAudio(sf.ko)} className="p-1 bg-zinc-950 rounded text-zinc-400 hover:text-white shrink-0 ml-1"><Volume2 className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Recognize Appropriate Register */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>{activity1Step === "1A" ? "Activity 1A – Listener Identification" : "Activity 1B – Appropriateness Rating"}</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {recognitionItems[recIdx] && (
            <div className="space-y-4 text-left">
              {activity1Step === "1A" ? (
                /* 1A: Who is speaker talking to? */
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl text-center space-y-1">
                    <span className="text-[9px] text-zinc-500 uppercase font-mono block">Analyze this Korean response:</span>
                    <p className="font-korean text-xl font-bold text-white">{recognitionItems[recIdx].sentence}</p>
                    <p className="text-xs text-zinc-400 italic font-mono">{recognitionItems[recIdx].gloss}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400 font-bold">Who is the most likely listener?</p>
                    <div className="grid grid-cols-3 gap-2">
                      {recognitionItems[recIdx].choices_listener.map((lst: string) => (
                        <button
                          key={lst}
                          onClick={() => !act1Checked && setSelectedListener(lst)}
                          disabled={act1Checked}
                          className={`p-3 rounded-xl border text-center text-xs font-bold uppercase transition ${
                            selectedListener === lst
                              ? "border-brand-500 bg-brand-500/10 text-white"
                              : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                          } ${act1Checked && recognitionItems[recIdx].listener === lst ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                        >
                          {lst}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* 1B: Appropriateness Rating */
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl text-left space-y-2">
                    <span className="text-[9px] text-zinc-500 uppercase block">Context description:</span>
                    <p className="text-xs text-white font-bold">Speaking to a professor after class.</p>
                    <div className="p-3 bg-zinc-900 rounded-xl border border-white/5">
                      <span className="text-[8px] text-zinc-400 block font-mono">CANDIDATE STATEMENT:</span>
                      <p className="font-korean text-sm font-bold text-zinc-200">{recognitionItems[recIdx].sentence}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400 font-bold">Is this statement appropriate for the context?</p>
                    <div className="grid grid-cols-3 gap-2">
                      {["too casual", "too formal", "OK"].map((appr) => (
                        <button
                          key={appr}
                          onClick={() => !act1Checked && setSelectedApprop(appr)}
                          disabled={act1Checked}
                          className={`p-3 rounded-xl border text-center text-xs font-bold uppercase transition ${
                            selectedApprop === appr
                              ? "border-brand-500 bg-brand-500/10 text-white"
                              : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                          }`}
                        >
                          {appr}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {act1Checked && (
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 text-center max-w-md mx-auto">
                  <p className="font-extrabold text-white">{act1Correct ? "✓ Correct register detection!" : "✗ Mismatch detected."}</p>
                  <p>{recognitionItems[recIdx].appropriateness}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!act1Checked ? (
                  <button
                    onClick={handleCheckActivity1}
                    disabled={activity1Step === "1A" ? !selectedListener : !selectedApprop}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Politeness
                  </button>
                ) : (
                  <button
                    onClick={handleNextActivity1}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {activity1Step === "1A" ? "Move to Activity 1B" : "Go to Register Adjustments"}
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

      {/* Screen 4: Activity 2: Adjust & Soften */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Register Adaptations</span>
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

          {/* Substep 2A: Change for friend vs teacher vs staff */}
          {activity2SubStep === "2A" && transformTemplates[activeTransIdx] && (
            <div className="space-y-4 text-left">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Activity 2A – Adjust register for different people</span>
              
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase block font-bold">Base Meaning:</span>
                <p className="text-xs text-white font-bold">{transformTemplates[activeTransIdx].base_meaning}</p>
                <p className="font-korean text-xs text-zinc-400 italic mt-0.5">Neutral Ko: {transformTemplates[activeTransIdx].neutral_ko}</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold">Select Target Context:</span>
                <div className="flex gap-2">
                  {["friend", "teacher", "staff"].map((ctx) => (
                    <button
                      key={ctx}
                      onClick={() => {
                        setSelectedContext(ctx);
                        setBuiltTransform(null);
                        setSelectedTransformOption(null);
                      }}
                      className={`flex-grow py-1.5 rounded border text-xs font-bold uppercase transition ${
                        selectedContext === ctx
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      {ctx}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold">Choose appropriate variant:</span>
                <div className="flex flex-col gap-2">
                  {[
                    transformTemplates[activeTransIdx].friend_ver,
                    transformTemplates[activeTransIdx].teacher_ver,
                    transformTemplates[activeTransIdx].staff_ver
                  ].map((verOption) => (
                    <button
                      key={verOption}
                      onClick={() => setSelectedTransformOption(verOption)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold font-korean transition ${
                        selectedTransformOption === verOption
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900 text-zinc-300 hover:border-white/10"
                      }`}
                    >
                      {verOption}
                    </button>
                  ))}
                </div>
              </div>

              {builtTransform ? (
                <div className="p-4 bg-zinc-950 border border-accent-teal/20 rounded-2xl space-y-2">
                  <span className="text-[9px] text-accent-teal font-bold block uppercase">Correct transformation result</span>
                  <p className="font-korean text-base font-bold text-white">{builtTransform.evaluated_sentence}</p>
                  <p className="text-[10px] text-zinc-500">Register adapted for: <strong>{selectedContext.toUpperCase()}</strong></p>
                </div>
              ) : (
                <button
                  onClick={handleTransformRegister}
                  disabled={buildingTransform || !selectedTransformOption}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-xs flex justify-center items-center gap-1.5 cursor-pointer"
                >
                  {buildingTransform ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Transform Register</span>
                </button>
              )}

              {builtTransform && (
                <button
                  onClick={handleNextTransform}
                  className="w-full bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 font-bold py-3 rounded-xl transition text-xs flex justify-center items-center gap-1 cursor-pointer"
                >
                  <span>{activeTransIdx < transformTemplates.length - 1 ? "Next Sentence" : "Go to Softening Builder"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Substep 2B: Softening Builder */}
          {activity2SubStep === "2B" && coreData && (
            <div className="space-y-4 text-left">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Activity 2B – Softening disagreement and requests</span>
              
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl">
                <span className="text-[9px] text-red-400 block font-bold uppercase mb-1">Direct / Strong Statement:</span>
                <p className="font-korean text-sm font-bold text-white">{selectedBaseIdea}</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold">Choose a softening phrase starter:</span>
                <div className="flex flex-col gap-1.5">
                  {coreData.softening_phrases.map((sf: any) => (
                    <button
                      key={sf.ko}
                      onClick={() => {
                        setSelectedSoftener(sf.ko);
                        setBuiltSoften(null);
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold font-korean transition ${
                        selectedSoftener === sf.ko
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900 text-zinc-300 hover:border-white/10"
                      }`}
                    >
                      {sf.ko} ({sf.en})
                    </button>
                  ))}
                </div>
              </div>

              {builtSoften ? (
                <div className="p-4 bg-zinc-950 border border-accent-teal/20 rounded-2xl space-y-1 text-xs">
                  <span className="text-[9px] text-accent-teal font-bold block uppercase">Softened Polite output result</span>
                  <p className="font-korean text-base font-bold text-white">{builtSoften.reply_ko}</p>
                  <p className="text-[10px] text-zinc-500">Intent softened. Softer and more polite tone.</p>
                </div>
              ) : (
                <button
                  onClick={handleSoftenRegister}
                  disabled={buildingSoften || !selectedSoftener}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-xs flex justify-center items-center gap-1.5 cursor-pointer"
                >
                  {buildingSoften ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Build Softened Sentence</span>
                </button>
              )}

              {builtSoften && (
                <button
                  onClick={() => setActivity2SubStep("2C")}
                  className="w-full bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 font-bold py-3 rounded-xl transition text-xs flex justify-center items-center gap-1 cursor-pointer"
                >
                  <span>Go to AI Context-Switch Roleplay</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Substep 2C: AI context-switch roleplays */}
          {activity2SubStep === "2C" && (
            <div className="space-y-4 text-left">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Activity 2C – Short AI context‑switch role‑plays</span>
              
              {!roleplaySessionId ? (
                <div className="p-6 bg-zinc-950 border border-white/5 rounded-2xl text-center space-y-4">
                  <div className="p-3 bg-brand-500/10 border border-brand-500/25 rounded-full w-fit mx-auto text-brand-400">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">
                    Compare how you interact differently with a friend versus a teacher about the same homework question scene.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartRoleplay("friend")}
                      className="flex-grow bg-brand-500 hover:bg-brand-600 text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Talk to Friend (Banmal)
                    </button>
                    <button
                      onClick={() => handleStartRoleplay("teacher")}
                      className="flex-grow bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border border-white/5"
                    >
                      Talk to Teacher (Respectful)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-brand-400 font-bold">Active Roleplay: {roleplayScenario.toUpperCase()} context</span>
                    <button onClick={() => setRoleplaySessionId(null)} className="text-zinc-500 hover:text-white underline cursor-pointer">Switch Interlocutor</button>
                  </div>

                  <div className="bg-zinc-950 rounded-2xl border border-white/5 p-4 h-40 overflow-y-auto space-y-2.5 custom-scrollbar">
                    {roleplayMessages.map((msg, idx) => {
                      const isUser = msg.sender === "user";
                      return (
                        <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
                          <div className={`max-w-[80%] rounded-2xl p-2.5 text-xs leading-relaxed ${
                            isUser 
                              ? "bg-brand-500 text-white rounded-tr-none" 
                              : "bg-zinc-900 text-zinc-300 rounded-tl-none border border-white/5"
                          }`}>
                            <p className={!isUser ? "font-korean" : ""}>{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                    {roleplaySending && (
                      <div className="flex justify-start">
                        <div className="bg-zinc-900 p-2 rounded-xl border border-white/5 flex gap-1 items-center">
                          <Loader2 className="w-3 animate-spin text-brand-400" />
                          <span className="text-[9px] text-zinc-500">Partner is typing...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scaffolding chips */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">Suggested chips:</span>
                    <div className="flex gap-1 flex-wrap">
                      {roleplayScenario === "friend" 
                        ? ["응, 숙제 다 했어.", "내일 볼까?", "고마워!"]
                        : ["네, 과제 제출 완료했습니다.", "혹시 시간 괜찮으십니까?", "감사합니다, 교수님."]
                      .map((chip) => (
                        <button
                          key={chip}
                          onClick={() => setRoleplayText((prev) => prev + (prev ? " " : "") + chip)}
                          className="px-2 py-1 bg-zinc-900 border border-white/5 hover:border-brand-500/35 text-[10px] text-zinc-300 rounded-lg font-korean transition cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!roleplayFinished ? (
                    <div className="flex gap-2">
                      {mode === "voice" && (
                        <button 
                          onClick={handleStartVoiceRecording}
                          className={`p-2.5 rounded-xl border transition ${recording ? "bg-red-500 text-white border-red-500 animate-pulse" : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white"}`}
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      )}
                      <input
                        type="text"
                        value={roleplayText}
                        onChange={(e) => setRoleplayText(e.target.value)}
                        placeholder="Respond matching the correct register..."
                        onKeyDown={(e) => e.key === "Enter" && handleSendRoleplayTurn()}
                        className="flex-grow bg-zinc-950 border border-white/5 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-korean"
                      />
                      <button
                        onClick={handleSendRoleplayTurn}
                        disabled={roleplaySending || !roleplayText.trim()}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <span>Send</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={handleFinishRoleplay}
                        className="px-3 bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-300 text-[10px] font-bold rounded-xl transition cursor-pointer"
                      >
                        End Chat
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-zinc-900 rounded-xl border border-brand-500/20 space-y-2 text-xs">
                      <p className="font-extrabold text-white">Pragmatic Assessment Report:</p>
                      <p className="text-zinc-400">{roleplayFeedback}</p>
                      <button
                        onClick={() => setStep(5)}
                        className="w-full mt-2 bg-brand-500 hover:bg-brand-600 text-white py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Proceed to Mini-Quiz
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button 
              onClick={() => {
                if (activity2SubStep === "2C") setActivity2SubStep("2B");
                else if (activity2SubStep === "2B") setActivity2SubStep("2A");
                else setStep(3);
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
              <span>Mini‑Quiz: Register Check</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 5 of {totalSteps}</span>
          </div>

          {quizBlueprint.length > 0 && quizBlueprint[quizIdx] && (
            <div className="space-y-4 text-left">
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-1">
                <div 
                  className="bg-brand-500 h-full transition-all duration-300"
                  style={{ width: `${((quizIdx + 1) / quizBlueprint.length) * 100}%` }}
                />
              </div>

              <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <p className="text-xs text-zinc-300">{quizBlueprint[quizIdx].question}</p>
              </div>

              {quizBlueprint[quizIdx].options && (
                <div className="flex flex-col gap-2">
                  {quizBlueprint[quizIdx].options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                      disabled={quizChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold font-korean transition ${
                        quizSelectedOpt === opt
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                      } ${quizChecked && opt === quizBlueprint[quizIdx].correct_answer ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${
                        quizChecked && quizSelectedOpt === opt && !quizCorrect ? "border-red-500 bg-red-500/15" : ""
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {quizChecked && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-1">
                  <p className="font-extrabold text-white">{quizCorrect ? "✓ Correct!" : "✗ Incorrect."}</p>
                  <p>{quizBlueprint[quizIdx].explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
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
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    {finishingQuiz ? <Loader2 className="w-3 animate-spin" /> : null}
                    <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(4)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(6)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Skip to Homework <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 6: Homework & Politeness Rooms */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Homework & Pragmatics Lab</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of {totalSteps}</span>
          </div>

          {/* Homework checklist */}
          <div className="space-y-2.5 text-left">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Recommended Homework Tasks:</span>
            <div className="space-y-2">
              {homeworkItems.map((item) => {
                const isDone = completedHomework[item.id] || false;
                return (
                  <label key={item.id} className="flex items-start gap-3 p-3 bg-zinc-950/60 border border-white/5 rounded-xl cursor-pointer hover:border-white/10 transition">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => handleToggleHomework(item.id, isDone)}
                      className="mt-0.5 rounded border-zinc-800 text-brand-500 focus:ring-brand-500/20"
                    />
                    <div className="text-xs text-zinc-300">
                      <span className="font-extrabold text-white block mb-0.5">{item.id === "hw_b1_reg_1" ? "Task 1: Register Writing" : item.id === "hw_b1_reg_2" ? "Task 2: Disagreement Softening" : "Task 3: Written Reflection"}</span>
                      {item.text}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Extra AI Politeness Practice Rooms */}
          <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-left space-y-3">
            <span className="text-[10px] text-brand-400 font-mono uppercase tracking-widest block font-bold">AI Politeness Practice Lab</span>
            
            {!practiceSessionId ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleStartHomeworkPractice("friend")}
                  className="flex-grow bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-3 rounded-xl transition text-[10px] cursor-pointer text-center"
                >
                  Banmal Practice Room
                </button>
                <button
                  onClick={() => handleStartHomeworkPractice("teacher")}
                  className="flex-grow bg-zinc-850 hover:bg-zinc-800 border border-white/5 text-white font-bold py-2 px-3 rounded-xl transition text-[10px] cursor-pointer text-center"
                >
                  Nopimmal Practice Room
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-zinc-950 rounded-xl p-3 border border-white/5 max-h-32 overflow-y-auto space-y-2 custom-scrollbar">
                  {practiceMessages.map((msg, idx) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-xl p-2 text-[10px] leading-relaxed ${
                          isUser ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-300 border border-white/5"
                        }`}>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {practiceSending && (
                    <div className="text-[9px] text-zinc-500 italic font-mono">Tutor typing...</div>
                  )}
                </div>

                {!practiceFinished ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={practiceText}
                      onChange={(e) => setPracticeText(e.target.value)}
                      placeholder="Type your polite/casual reply..."
                      onKeyDown={(e) => e.key === "Enter" && handleSendPracticeTurn()}
                      className="flex-grow bg-zinc-950 border border-white/5 rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-brand-500"
                    />
                    <button
                      onClick={handleSendPracticeTurn}
                      disabled={practiceSending || !practiceText.trim()}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-3 rounded-lg text-[10px] font-bold transition"
                    >
                      Send
                    </button>
                    <button
                      onClick={handleFinishPractice}
                      className="bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-300 px-3 rounded-lg text-[10px] font-bold transition"
                    >
                      End
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-950 rounded-xl border border-brand-500/10 text-[10px] text-zinc-400">
                    <p className="font-bold text-white mb-1">Feedback Summary:</p>
                    <p>{practiceFeedback || "Politeness practice successfully complete!"}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Phase completion card */}
          <div className="p-5 bg-gradient-to-r from-brand-500/10 to-accent-teal/10 rounded-2xl border border-brand-500/20 text-center space-y-2">
            <div className="flex justify-center items-center gap-1 text-amber-400 font-extrabold text-sm uppercase">
              <Award className="w-5 h-5" />
              <span>Badge Earned: {quizBadge || "Polite Speaker B1"}</span>
            </div>
            <p className="text-xs text-zinc-300">
              Congratulations on completing Korean 4.4! Next: Phase 5 – Understanding Longer Speech & Note‑Taking.
            </p>
            <div className="flex justify-center gap-4 text-xs font-bold pt-1">
              <span className="text-brand-400">XP +150</span>
              <span className="text-zinc-500">|</span>
              <span className="text-accent-teal">Phase 4 Complete</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(5)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button 
              onClick={onComplete}
              className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-accent-teal/20"
            >
              <span>Complete Phase 4</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
