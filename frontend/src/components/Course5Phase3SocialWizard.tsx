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

interface Course5Phase3SocialWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course5Phase3SocialWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course5Phase3SocialWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 6;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Concept Explanation Step
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Activity 1 states
  const [activity1Step, setActivity1Step] = useState<"1A" | "1B">("1A");
  const [dialogueItems, setDialogueItems] = useState<any[]>([]);
  const [dialIdx, setDialIdx] = useState(0);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [selectedAgreeLine, setSelectedAgreeLine] = useState<string | null>(null);
  const [act1Checked, setAct1Checked] = useState(false);
  const [act1Correct, setAct1Correct] = useState<boolean | null>(null);

  // Activity 2 states
  const [activity2SubStep, setActivity2SubStep] = useState<"2A" | "2B">("2A");
  
  // Activity 2A templates
  const [taskTemplates, setTaskTemplates] = useState<any>(null);
  const [selectedContext2A, setSelectedContext2A] = useState<string>("social");
  const [typedAction, setTypedAction] = useState("도서관에서 공부");
  const [selectedPattern, setSelectedPattern] = useState("shall_we");
  const [selectedStance, setSelectedStance] = useState("agree");
  const [selectedResponsePattern, setSelectedResponsePattern] = useState("agree");
  const [builtSuggestion, setBuiltSuggestion] = useState<any>(null);
  const [builtResponse, setBuiltResponse] = useState<any>(null);
  const [buildingSuggestion, setBuildingSuggestion] = useState(false);
  const [buildingResponse, setBuildingResponse] = useState(false);

  // Activity 2B AI Chat Roleplay
  const [roleplaySessionId, setRoleplaySessionId] = useState<string | null>(null);
  const [roleplayScenario, setRoleplayScenario] = useState<string>("social");
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

  // Homework AI practice sessions
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [practiceScenario, setPracticeScenario] = useState<string>("social");
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
          const res = await apiJson("/phases/korean4/3/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean4/3/core-data");
          setCoreData(res);
        } else if (step === 3 && dialogueItems.length === 0) {
          const res = await apiJson("/practice/social-work/dialogues");
          setDialogueItems(res.dialogues || []);
        } else if (step === 4) {
          if (!taskTemplates) {
            const res = await apiJson("/practice/social-work/templates");
            setTaskTemplates(res);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean4/phase-3/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean4/3/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading B1 social/work data:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1 checks
  const handleCheckActivity1 = async () => {
    const current = dialogueItems[dialIdx];
    if (!current) return;

    let isCorrect = false;
    if (activity1Step === "1A") {
      isCorrect = selectedContext === current.questions.where && selectedTopic === current.questions.topic;
    } else {
      isCorrect = selectedSpeaker === current.questions.suggestion_speaker && selectedAgreeLine === current.questions.agreement_line;
    }

    setAct1Checked(true);
    setAct1Correct(isCorrect);

    try {
      await apiJson("/practice/social-work/dialogues/answer", {
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
      if (dialIdx < dialogueItems.length - 1) {
        setDialIdx(dialIdx + 1);
      } else {
        setStep(4);
      }
    }
  };

  // Activity 2A dialogue builder
  const handleBuildSuggestion = async () => {
    setBuildingSuggestion(true);
    try {
      const res = await apiJson("/practice/social-work/build-suggestion", {
        method: "POST",
        body: JSON.stringify({
          action: typedAction,
          pattern_id: selectedPattern
        })
      });
      setBuiltSuggestion(res);
      playAudio(res.reply_ko);
    } catch (err) {
      console.error(err);
    } finally {
      setBuildingSuggestion(false);
    }
  };

  const handleBuildResponse = async () => {
    setBuildingResponse(true);
    try {
      const res = await apiJson("/practice/social-work/build-response", {
        method: "POST",
        body: JSON.stringify({
          stance: selectedStance,
          pattern_id: selectedResponsePattern
        })
      });
      setBuiltResponse(res);
      playAudio(res.reply_ko);
    } catch (err) {
      console.error(err);
    } finally {
      setBuildingResponse(false);
    }
  };

  // Activity 2B AI role-plays
  const handleStartRoleplay = async () => {
    setRoleplayMessages([]);
    setRoleplayFeedback(null);
    setRoleplayFinished(false);
    try {
      const res = await apiJson("/conversation/b1/social-work/start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: roleplayScenario })
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
      const res = await apiJson("/conversation/b1/social-work/turn", {
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
      const res = await apiJson("/conversation/b1/social-work/finish", { method: "POST" });
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
      setRoleplayText("오늘 우리 같이 공부할까요? 도서관에서요.");
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
      await apiJson("/quiz/korean4/phase-3/answer", {
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
        const res = await apiJson("/quiz/korean4/phase-3/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Social Communicator B1");
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
      await apiJson("/phases/korean4/3/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Homework AI Practice rooms
  const handleStartHomeworkPractice = async (scen: string) => {
    setPracticeScenario(scen);
    setPracticeMessages([]);
    setPracticeFeedback(null);
    setPracticeFinished(false);
    try {
      const res = await apiJson("/conversation/b1/social-practice/start", {
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
      const res = await apiJson("/conversation/b1/social-practice/turn", {
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
      const res = await apiJson("/conversation/b1/social-practice/finish", { method: "POST" });
      setPracticeFeedback(res.feedback);
      setPracticeFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  const renderContextIcon = (ctx: string) => {
    switch (ctx) {
      case "social": return <Users className="w-4 h-4 text-brand-400" />;
      case "study": return <GraduationCap className="w-4 h-4 text-brand-400" />;
      default: return <Briefcase className="w-4 h-4 text-brand-400" />;
    }
  };

    const outlineSteps = [
    { num: 1, label: "Screen 1 – Welcome / Phase Overview" },
    { num: 2, label: "Screen 2 – Social & Work/Study Moves Chunks" },
    { num: 3, label: "Screen 3 – Activity 1: Dialogue Arguments Comprehension" },
    { num: 4, label: "Screen 4 – Activity 2: Suggestions & AI Small Talk Planning" },
    { num: 5, label: "Screen 5 – Mini-Quiz: Interaction Check" },
    { num: 6, label: "Screen 6 – Homework & AI Practice Rooms" }
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
              <span>{activeLesson?.title || "Korean 4.3 – Social & Study/Work Conversations"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Suggestions & Polite Agrees/Disagrees</p>
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
          
          <h2 className="text-5xl font-black text-white tracking-tight font-sans">Korean 4.3</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Social & Study/Work Conversations</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Use Korean naturally with classmates, colleagues, and friends."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Start and join small talk in social/study/work settings",
                "Make simple suggestions, invitations, and plans",
                "Agree and disagree politely about familiar topics"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 30}–40 minutes</p>
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
              <span>Start Phase 3</span>
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
              <span>Social & Study/Work Moves</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">B1 Social/Work Goal:</p>
            <p className="italic">
              “At B1, you should be able to talk about work, school and free time, express your opinions, and take part in simple discussions with friends or classmates.”
            </p>
          </div>

          {/* Filters and phrase list */}
          <div className="space-y-3">
            <div className="flex gap-1.5 justify-center flex-wrap">
              {["all", "social", "study", "work"].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedFilter(category)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${
                    selectedFilter === category 
                      ? "border-brand-500 bg-brand-500/10 text-white" 
                      : "border-white/5 bg-zinc-950 text-zinc-400"
                  }`}
                >
                  {category.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-40 overflow-y-auto custom-scrollbar p-1">
              {coreData?.functional_phrases
                ?.filter((m: any) => selectedFilter === "all" || m.context === selectedFilter)
                ?.map((m: any, idx: number) => (
                  <div key={idx} className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 flex justify-between items-center text-xs text-left">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-korean font-bold text-white text-xs leading-normal">{m.ko}</span>
                        <span className="text-[7px] bg-zinc-950 text-zinc-400 px-1 py-0.5 rounded font-mono uppercase">{m.tag}</span>
                      </div>
                      <p className="text-[9px] text-zinc-500 mt-0.5">{m.en}</p>
                    </div>
                    <button 
                      onClick={() => playAudio(m.ko)} 
                      className="p-1.5 bg-zinc-950/40 border border-white/5 hover:border-white/10 hover:text-white rounded-lg text-zinc-400 transition cursor-pointer shrink-0 ml-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
              ))}
            </div>
          </div>

          {/* Model Dialogue Preview */}
          {coreData?.example_dialogues?.[0] && (
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2 text-xs text-left">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Model Group Study Planning Exchange</span>
              <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                {coreData.example_dialogues[0].turns.map((line: any, idx: number) => (
                  <div key={idx} className="text-[11px] leading-relaxed">
                    <span className="font-bold text-brand-400 font-korean">{line.speaker}: </span>
                    <span className="font-korean text-zinc-200">{line.ko} </span>
                    <span className="text-[8px] bg-zinc-900 px-1 rounded text-zinc-400 inline-block font-sans font-mono uppercase">{line.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Dialogue Comprehension */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>{activity1Step === "1A" ? "Activity 1A – Conversation Analysis" : "Activity 1B – Argument Highlighting"}</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {dialogueItems[dialIdx] && (
            <div className="space-y-4 text-left">
              {/* Dialogue Transcript */}
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center text-[9px] text-zinc-500 uppercase font-mono">
                  <span>Dialogue Excerpt</span>
                  <button onClick={() => playAudio(dialogueItems[dialIdx].turns[0].ko)} className="flex items-center gap-1 text-brand-400 hover:underline">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Play Audio</span>
                  </button>
                </div>
                
                <div className="space-y-1.5 font-korean max-h-36 overflow-y-auto custom-scrollbar text-[11px] pr-1">
                  {dialogueItems[dialIdx].turns.map((t: any, i: number) => (
                    <div key={i} className="flex gap-1.5 items-start">
                      <span className="font-extrabold text-brand-400 shrink-0">{t.speaker}:</span>
                      <div className="flex-grow">
                        <p className="text-zinc-200">{t.ko}</p>
                        <p className="text-zinc-500 text-[10px] font-sans">{t.en}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {activity1Step === "1A" ? (
                /* 1A: Where & What topic */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400 font-bold">1. What is the context location?</p>
                    <div className="flex flex-col gap-1.5">
                      {dialogueItems[dialIdx].questions.choices_where.map((whereOpt: string) => (
                        <button
                          key={whereOpt}
                          onClick={() => !act1Checked && setSelectedContext(whereOpt)}
                          disabled={act1Checked}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition ${
                            selectedContext === whereOpt
                              ? "border-brand-500 bg-brand-500/10 text-white"
                              : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                          }`}
                        >
                          {whereOpt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400 font-bold">2. What is the main conversation topic?</p>
                    <div className="flex flex-col gap-1.5">
                      {dialogueItems[dialIdx].questions.choices_topic.map((topicOpt: string) => (
                        <button
                          key={topicOpt}
                          onClick={() => !act1Checked && setSelectedTopic(topicOpt)}
                          disabled={act1Checked}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition ${
                            selectedTopic === topicOpt
                              ? "border-brand-500 bg-brand-500/10 text-white"
                              : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                          }`}
                        >
                          {topicOpt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* 1B: Argument identification */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400 font-bold">1. Who makes the suggestion?</p>
                    <div className="flex gap-2">
                      {["Ji-Won", "Min-Su"].map((sp) => (
                        <button
                          key={sp}
                          onClick={() => !act1Checked && setSelectedSpeaker(sp)}
                          disabled={act1Checked}
                          className={`flex-grow p-2.5 rounded-xl border text-center text-xs font-bold transition ${
                            selectedSpeaker === sp
                              ? "border-brand-500 bg-brand-500/10 text-white"
                              : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                          }`}
                        >
                          {sp}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400 font-bold">2. Choose the sentence expressing Agreement:</p>
                    <div className="flex flex-col gap-2">
                      {dialogueItems[dialIdx].turns.slice(2).map((t: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => !act1Checked && setSelectedAgreeLine(t.ko)}
                          disabled={act1Checked}
                          className={`p-3 rounded-xl border text-left text-xs font-semibold font-korean transition ${
                            selectedAgreeLine === t.ko
                              ? "border-brand-500 bg-brand-500/10 text-white"
                              : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                          }`}
                        >
                          {t.ko}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {act1Checked && (
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 text-center max-w-md mx-auto">
                  <p className="font-extrabold text-white">{act1Correct ? "✓ Correct! Excellent analysis." : "✗ Incorrect."}</p>
                  <p>Analyzed arguments and opinions successfully.</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!act1Checked ? (
                  <button
                    onClick={handleCheckActivity1}
                    disabled={activity1Step === "1A" ? (!selectedContext || !selectedTopic) : (!selectedSpeaker || !selectedAgreeLine)}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Analysis
                  </button>
                ) : (
                  <button
                    onClick={handleNextActivity1}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {activity1Step === "1A" ? "Move to Activity 1B" : "Go to Practice Lab"}
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

      {/* Screen 4: Activity 2: Practice Conversations */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Suggestion & Responses</span>
            </h2>
            <div className="flex gap-1">
              {["2A", "2B"].map((sub) => (
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

          {/* Substep 2A: Suggestion Builder */}
          {activity2SubStep === "2A" && taskTemplates && (
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Activity 2A – Suggestion & Response Builder</span>
                <select
                  value={selectedContext2A}
                  onChange={(e) => {
                    setSelectedContext2A(e.target.value);
                    setBuiltSuggestion(null);
                    setBuiltResponse(null);
                  }}
                  className="bg-zinc-900 border border-white/5 p-1 rounded text-xs text-white"
                >
                  <option value="social">Social café/club</option>
                  <option value="study">Group study/homework</option>
                  <option value="work">Work task schedule</option>
                </select>
              </div>

              {/* Step 1: Suggestion */}
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-3 text-xs">
                <span className="text-[9px] text-brand-400 font-bold block uppercase">Step 1: Build a Suggestion</span>
                
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400">Action Activity (e.g. 커피 마시기 / 같이 공부):</label>
                  <input
                    type="text"
                    value={typedAction}
                    onChange={(e) => setTypedAction(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/5 p-2 rounded text-white font-korean"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400">Suggestion Pattern:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {taskTemplates.suggestion_patterns.map((pat: any) => (
                      <button
                        key={pat.id}
                        onClick={() => setSelectedPattern(pat.id)}
                        className={`p-2 rounded border text-xs font-semibold transition ${
                          selectedPattern === pat.id
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900 text-zinc-400"
                        }`}
                      >
                        {pat.desc}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleBuildSuggestion}
                  disabled={buildingSuggestion || !typedAction.trim()}
                  className="bg-brand-500 hover:bg-brand-600 text-white py-1.5 px-4 rounded text-xs font-bold w-full transition cursor-pointer"
                >
                  Build Suggestion Sentence
                </button>

                {builtSuggestion && (
                  <div className="p-2.5 bg-zinc-900 rounded-xl border border-white/5 font-korean text-zinc-200">
                    <p className="font-bold">{builtSuggestion.reply_ko}</p>
                    <p className="text-[10px] text-zinc-500 font-sans">{builtSuggestion.reply_en}</p>
                  </div>
                )}
              </div>

              {/* Step 2: Response */}
              {builtSuggestion && (
                <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-3 text-xs">
                  <span className="text-[9px] text-accent-teal font-bold block uppercase">Step 2: Build a Response</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSelectedStance("agree");
                        setSelectedResponsePattern("agree");
                      }}
                      className={`p-2 rounded border text-xs font-bold transition ${
                        selectedStance === "agree"
                          ? "border-accent-teal bg-accent-teal/10 text-white"
                          : "border-white/5 bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      Polite Agreement
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStance("disagree");
                        setSelectedResponsePattern("disagree");
                      }}
                      className={`p-2 rounded border text-xs font-bold transition ${
                        selectedStance === "disagree"
                          ? "border-accent-teal bg-accent-teal/10 text-white"
                          : "border-white/5 bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      Soft Disagreement
                    </button>
                  </div>

                  <button
                    onClick={handleBuildResponse}
                    disabled={buildingResponse}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 py-1.5 px-4 rounded text-xs font-bold w-full transition cursor-pointer"
                  >
                    Build Response Sentence
                  </button>

                  {builtResponse && (
                    <div className="p-2.5 bg-zinc-900 rounded-xl border border-white/5 font-korean text-zinc-200">
                      <p className="font-bold">{builtResponse.reply_ko}</p>
                      <p className="text-[10px] text-zinc-500 font-sans">{builtResponse.reply_en}</p>
                    </div>
                  )}
                </div>
              )}

              {builtResponse && (
                <button
                  onClick={() => setActivity2SubStep("2B")}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-xl transition text-xs font-bold flex justify-center items-center gap-1 cursor-pointer"
                >
                  <span>Go to AI Small Talk Roleplay</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Substep 2B: AI Role-plays */}
          {activity2SubStep === "2B" && (
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Activity 2B – Social & study/work "mini‑rounds" with AI</span>
                <select
                  value={roleplayScenario}
                  onChange={(e) => {
                    setRoleplayScenario(e.target.value);
                    setRoleplaySessionId(null);
                  }}
                  disabled={!!roleplaySessionId}
                  className="bg-zinc-900 border border-white/5 p-1 rounded text-xs text-white"
                >
                  <option value="social">Social small talk</option>
                  <option value="study">Study planning</option>
                  <option value="work">Work tasks</option>
                </select>
              </div>

              {!roleplaySessionId ? (
                <div className="p-6 bg-zinc-950 border border-white/5 rounded-2xl text-center space-y-4">
                  <div className="p-3 bg-brand-500/10 border border-brand-500/25 rounded-full w-fit mx-auto text-brand-400">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">
                    Start a dialog with your classmate/colleague. Suggest a time/place or project plans and express simple agreement/disagreement!
                  </p>
                  <button
                    onClick={handleStartRoleplay}
                    className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Start AI Interaction
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-zinc-950 rounded-2xl border border-white/5 p-4 h-44 overflow-y-auto space-y-2.5 custom-scrollbar">
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
                          <span className="text-[9px] text-zinc-500">Friend is typing...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scaffolding chips */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">Suggested chips:</span>
                    <div className="flex gap-1 flex-wrap">
                      {["오늘 공부 같이 할래요?", "커피 한 잔 마실래요?", "좋아요. 같이 해요.", "그건 잘 모르겠어요."].map((chip) => (
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
                        placeholder="Discuss plans or small talk politely..."
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
                      <p className="font-extrabold text-white">Evaluation Report:</p>
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
                if (activity2SubStep === "2B") setActivity2SubStep("2A");
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
              <span>Mini‑Quiz: Interaction Check</span>
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

      {/* Screen 6: Homework & Practice Rooms */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Homework & Practice Rooms</span>
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
                      <span className="font-extrabold text-white block mb-0.5">{item.id === "hw_b1_soc_1" ? "Task 1: Script Writing" : item.id === "hw_b1_soc_2" ? "Task 2: Spoken Practice" : "Task 3: Reflection"}</span>
                      {item.text}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* AI practice buttons and box */}
          <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-left space-y-3">
            <span className="text-[10px] text-brand-400 font-mono uppercase tracking-widest block font-bold">AI Practice Labs</span>
            
            {!practiceSessionId ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleStartHomeworkPractice("social")}
                  className="flex-grow bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-3 rounded-xl transition text-[10px] cursor-pointer text-center"
                >
                  Social Conversation Practice
                </button>
                <button
                  onClick={() => handleStartHomeworkPractice("study")}
                  className="flex-grow bg-zinc-850 hover:bg-zinc-800 border border-white/5 text-white font-bold py-2 px-3 rounded-xl transition text-[10px] cursor-pointer text-center"
                >
                  Study/Work Planning Practice
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
                      placeholder="Type your suggestion/response..."
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
                    <p>{practiceFeedback || "Completed social interaction practice!"}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Phase completion card */}
          <div className="p-5 bg-gradient-to-r from-brand-500/10 to-accent-teal/10 rounded-2xl border border-brand-500/20 text-center space-y-2">
            <div className="flex justify-center items-center gap-1 text-amber-400 font-extrabold text-sm uppercase">
              <Award className="w-5 h-5" />
              <span>Badge Earned: {quizBadge || "Social Communicator B1"}</span>
            </div>
            <p className="text-xs text-zinc-300">
              Congratulations on completing Korean 4.3! Next: Phase 4 – Politeness, Register & Nuance in Real Contexts.
            </p>
            <div className="flex justify-center gap-4 text-xs font-bold pt-1">
              <span className="text-brand-400">XP +150</span>
              <span className="text-zinc-500">|</span>
              <span className="text-accent-teal">Phase 3 Complete</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(5)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button 
              onClick={onComplete}
              className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-accent-teal/20"
            >
              <span>Complete Phase 3</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
