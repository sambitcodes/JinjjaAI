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
  Activity,
  MessageCircle,
  Timer,
  Navigation,
  Coffee,
  Home
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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

interface Course5Phase2TravelWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course5Phase2TravelWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course5Phase2TravelWizardProps) {
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
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedKeyInfo, setSelectedKeyInfo] = useState<string | null>(null);
  const [act1Checked, setAct1Checked] = useState(false);
  const [act1Correct, setAct1Correct] = useState<boolean | null>(null);

  // Activity 2 states
  const [activity2SubStep, setActivity2SubStep] = useState<"2A" | "2B" | "2C">("2A");
  
  // Activity 2A Dialogue Builder
  const [taskTemplates, setTaskTemplates] = useState<any>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>("buy_ticket");
  const [slotValues, setSlotValues] = useState<Record<string, string>>({
    destination: "부산",
    quantity: "한",
    name: "김민수",
    nights: "2"
  });
  const [chosenPhrases, setChosenPhrases] = useState<string[]>([]);
  const [builtDialogue, setBuiltDialogue] = useState<any>(null);
  const [buildingDialogue, setBuildingDialogue] = useState(false);

  // Activity 2B Single Context Roleplay
  const [roleplaySessionId, setRoleplaySessionId] = useState<string | null>(null);
  const [roleplayScenario, setRoleplayScenario] = useState<string>("hotel_checkin");
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

  // Homework AI Travel Day Simulation
  const [travelDaySessionId, setTravelDaySessionId] = useState<string | null>(null);
  const [travelDayMessages, setTravelDayMessages] = useState<any[]>([]);
  const [travelDayText, setTravelDayText] = useState("");
  const [travelDaySending, setTravelDaySending] = useState(false);
  const [travelDayFinished, setTravelDayFinished] = useState(false);
  const [travelDayFeedback, setTravelDayFeedback] = useState<string | null>(null);

  // Load API Data per Step
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean4/2/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean4/2/core-data");
          setCoreData(res);
        } else if (step === 3 && dialogueItems.length === 0) {
          const res = await apiJson("/practice/travel/dialogues");
          setDialogueItems(res.dialogues || []);
        } else if (step === 4) {
          if (!taskTemplates) {
            const res = await apiJson("/practice/travel/task-templates");
            setTaskTemplates(res);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean4/phase-2/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean4/2/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading B1 travel data:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1 Checks
  const handleCheckActivity1 = async () => {
    const current = dialogueItems[dialIdx];
    if (!current) return;

    let isCorrect = false;
    if (activity1Step === "1A") {
      isCorrect = selectedContext === current.questions.where && selectedTask === current.questions.task;
    } else {
      isCorrect = selectedKeyInfo === current.questions.key_info;
    }

    setAct1Checked(true);
    setAct1Correct(isCorrect);

    try {
      await apiJson("/practice/travel/dialogues/answer", {
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
  const handleBuildDialogue = async () => {
    setBuildingDialogue(true);
    try {
      const res = await apiJson("/practice/travel/build-dialogue", {
        method: "POST",
        body: JSON.stringify({
          scenario: selectedScenario,
          chosen_phrases: chosenPhrases,
          slot_values: slotValues
        })
      });
      setBuiltDialogue(res);
      playAudio(res.reply_ko);
    } catch (err) {
      console.error(err);
    } finally {
      setBuildingDialogue(false);
    }
  };

  // Activity 2B Single Context Roleplay
  const handleStartRoleplay = async () => {
    setRoleplayMessages([]);
    setRoleplayFeedback(null);
    setRoleplayFinished(false);
    try {
      const res = await apiJson("/conversation/b1/travel-roleplay/start", {
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
      const res = await apiJson("/conversation/b1/travel-roleplay/turn", {
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
      const res = await apiJson("/conversation/b1/travel-roleplay/finish", { method: "POST" });
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
      if (roleplayScenario === "buy_ticket") {
        setRoleplayText("부산행 기차표 한 장 주세요. 얼마예요?");
      } else {
        setRoleplayText("체크인하고 싶은데요. 김민수입니다.");
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
      await apiJson("/quiz/korean4/phase-2/answer", {
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
        const res = await apiJson("/quiz/korean4/phase-2/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Travel Survivor B1");
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
      await apiJson("/phases/korean4/2/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Homework AI Travel Day Simulation
  const handleStartTravelDay = async () => {
    setTravelDayMessages([]);
    setTravelDayFeedback(null);
    setTravelDayFinished(false);
    try {
      const res = await apiJson("/conversation/b1/travel-day/start", { method: "POST" });
      setTravelDaySessionId(res.session_id);
      setTravelDayMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") {
        playAudio(res.opener);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTravelDayTurn = async () => {
    if (!travelDayText.trim() || !travelDaySessionId) return;
    const textToSend = travelDayText;
    setTravelDayText("");
    setTravelDayMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setTravelDaySending(true);

    try {
      const res = await apiJson("/conversation/b1/travel-day/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setTravelDayMessages((prev) => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") {
        playAudio(res.reply_ko);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTravelDaySending(false);
    }
  };

  const handleFinishTravelDay = async () => {
    if (!travelDaySessionId) return;
    try {
      const res = await apiJson("/conversation/b1/travel-day/finish", { method: "POST" });
      setTravelDayFeedback(res.feedback);
      setTravelDayFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  const renderContextIcon = (ctx: string) => {
    switch (ctx) {
      case "transport": return <Navigation className="w-4 h-4 text-brand-400" />;
      case "hotel": return <Home className="w-4 h-4 text-brand-400" />;
      case "shop": return <Coffee className="w-4 h-4 text-brand-400" />;
      default: return <HelpCircle className="w-4 h-4 text-brand-400" />;
    }
  };

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
              <span>{activeLesson?.title || "Korean 4.2 – Real‑World Korean: Travel & Errands"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Travel & Service Survival Dialogues</p>
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

      {/* Screen 1: Welcome/Overview */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight font-sans">Korean 4.2</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Real‑World Korean: Travel & Errands</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Handle basic situations in transport, shops, and hotels."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Ask for and understand information in stations, shops, and hotels",
                "Make simple but polite requests and check details (time, price, place)",
                "Solve small problems when things go wrong while travelling"
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
              <span>Start Phase 2</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
          </div>

          {showOutline && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-2 animate-fade-in max-w-2xl mx-auto w-full font-mono">
              <p className="font-extrabold text-white text-center pb-2">Course syllabus activities:</p>
              <p>✓ Screen 1 – Welcome / Phase Overview</p>
              <p>✓ Screen 2 – Functional Phrase Bank Concept</p>
              <p>✓ Screen 3 – Activity 1: Understand Service Dialogues</p>
              <p>✓ Screen 4 – Activity 2: Interactive Travel Scenarios</p>
              <p>✓ Screen 5 – Mini-Quiz: Travel Survival Check</p>
              <p>✓ Screen 6 – Homework & AI Travel Day Simulation</p>
            </div>
          )}
        </div>
      )}

      {/* Screen 2: Concept Explanation */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>Functional Travel Language</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">B1 Travel & Errands Goal:</p>
            <p className="italic">
              “At B1, you should be able to deal with most situations when travelling—buying tickets, booking rooms, ordering food, asking for help, and clarifying information.”
            </p>
          </div>

          {/* Interactive filter and cards */}
          <div className="space-y-3">
            <div className="flex gap-1.5 justify-center flex-wrap">
              {["all", "transport", "hotel", "shop", "help"].map((category) => (
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

          {/* Trip Snapshot story outline */}
          {coreData?.trip_snapshot && (
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2.5 text-xs text-left">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Real-World Trip Timeline Snapshot</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {coreData.trip_snapshot.map((stepItem: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-zinc-900/60 border border-white/5 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] bg-brand-500/10 text-brand-400 px-1 py-0.5 rounded font-bold">{stepItem.step}</span>
                      <span className="text-[10px] font-bold text-white">{stepItem.title}</span>
                    </div>
                    <p className="text-[9px] text-zinc-400">{stepItem.desc}</p>
                    <p className="text-[9px] text-accent-teal font-korean truncate pt-1">{stepItem.phrases[0]}</p>
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

      {/* Screen 3: Activity 1: Understand Dialogues */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>{activity1Step === "1A" ? "Activity 1A – Dialogue Context" : "Activity 1B – Key Details Extraction"}</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {dialogueItems[dialIdx] && (
            <div className="space-y-4 text-left">
              {/* Dialogue Transcript */}
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-2.5">
                <div className="flex justify-between items-center text-[9px] text-zinc-500 uppercase font-mono">
                  <span>Dialogue Excerpt ({dialogueItems[dialIdx].context})</span>
                  <button onClick={() => playAudio(dialogueItems[dialIdx].turns[0].ko)} className="flex items-center gap-1 text-brand-400 hover:underline">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Play Audio</span>
                  </button>
                </div>
                
                <div className="space-y-2 font-korean max-h-36 overflow-y-auto custom-scrollbar text-[11px] pr-1">
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
                /* 1A: Where & What task */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400 font-bold">1. Where are they located?</p>
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
                    <p className="text-xs text-zinc-400 font-bold">2. What is the primary task?</p>
                    <div className="flex flex-col gap-1.5">
                      {dialogueItems[dialIdx].questions.choices_task.map((taskOpt: string) => (
                        <button
                          key={taskOpt}
                          onClick={() => !act1Checked && setSelectedTask(taskOpt)}
                          disabled={act1Checked}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition ${
                            selectedTask === taskOpt
                              ? "border-brand-500 bg-brand-500/10 text-white"
                              : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                          }`}
                        >
                          {taskOpt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* 1B: Key detail matching */
                <div className="space-y-2 max-w-sm mx-auto">
                  <p className="text-xs text-zinc-400 font-bold">Identify the transaction/booking detail details:</p>
                  <div className="flex flex-col gap-1.5">
                    {dialogueItems[dialIdx].questions.choices_key_info.map((infoOpt: string) => (
                      <button
                        key={infoOpt}
                        onClick={() => !act1Checked && setSelectedKeyInfo(infoOpt)}
                        disabled={act1Checked}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                          selectedKeyInfo === infoOpt
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                        }`}
                      >
                        {infoOpt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {act1Checked && (
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 text-center max-w-md mx-auto">
                  <p className="font-extrabold text-white">{act1Correct ? "✓ Correct! Good comprehension." : "✗ Incorrect."}</p>
                  <p>Successfully parsed the service dialogue details.</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!act1Checked ? (
                  <button
                    onClick={handleCheckActivity1}
                    disabled={activity1Step === "1A" ? (!selectedContext || !selectedTask) : !selectedKeyInfo}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Answers
                  </button>
                ) : (
                  <button
                    onClick={handleNextActivity1}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {activity1Step === "1A" ? "Move to Activity 1B" : "Go to Scenario Builder"}
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

      {/* Screen 4: Activity 2: Travel Tasks */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Role-Plays & Transactions</span>
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

          {/* Activity 2A: Dialogue Builder */}
          {activity2SubStep === "2A" && taskTemplates && (
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Activity 2A – dialogue builder: "Complete the task"</span>
                <select
                  value={selectedScenario}
                  onChange={(e) => {
                    setSelectedScenario(e.target.value);
                    setBuiltDialogue(null);
                  }}
                  className="bg-zinc-900 border border-white/5 p-1 rounded text-xs text-white"
                >
                  {taskTemplates.scenarios.map((sc: any) => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-3 text-xs">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold">Fill Custom Details Slots:</span>
                
                {selectedScenario === "buy_ticket" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-400 block">Destination:</label>
                      <input
                        type="text"
                        value={slotValues.destination}
                        onChange={(e) => setSlotValues({ ...slotValues, destination: e.target.value })}
                        className="bg-zinc-900 border border-white/5 p-2 rounded text-white w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-400 block">Quantity (in Korean, e.g. 한/두/세):</label>
                      <input
                        type="text"
                        value={slotValues.quantity}
                        onChange={(e) => setSlotValues({ ...slotValues, quantity: e.target.value })}
                        className="bg-zinc-900 border border-white/5 p-2 rounded text-white w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-400 block">Reservation Name:</label>
                      <input
                        type="text"
                        value={slotValues.name}
                        onChange={(e) => setSlotValues({ ...slotValues, name: e.target.value })}
                        className="bg-zinc-900 border border-white/5 p-2 rounded text-white w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-400 block">Number of Nights:</label>
                      <input
                        type="text"
                        value={slotValues.nights}
                        onChange={(e) => setSlotValues({ ...slotValues, nights: e.target.value })}
                        className="bg-zinc-900 border border-white/5 p-2 rounded text-white w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {builtDialogue ? (
                <div className="bg-zinc-950 p-4 border border-brand-500/20 rounded-2xl space-y-3">
                  <span className="text-[9px] text-brand-400 font-bold block uppercase">Constructed dialogue result</span>
                  <div className="space-y-2 text-xs">
                    {builtDialogue.dialogue_preview.map((line: any, index: number) => (
                      <div key={index} className="flex gap-2">
                        <span className="font-bold text-accent-teal">{line.speaker}:</span>
                        <div>
                          <p className="font-korean text-zinc-200">{line.ko}</p>
                          <p className="text-[10px] text-zinc-500">{line.en}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-accent-teal/5 border border-accent-teal/20 text-[10px] text-accent-teal rounded-xl">
                    ✓ Task Complete Check: Stated transaction requirements successfully.
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleBuildDialogue}
                  disabled={buildingDialogue}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-xs flex justify-center items-center gap-1.5 cursor-pointer"
                >
                  {buildingDialogue ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Verify and Construct Dialogue</span>
                </button>
              )}

              {builtDialogue && (
                <button
                  onClick={() => setActivity2SubStep("2B")}
                  className="w-full bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 font-bold py-3 rounded-xl transition text-xs flex justify-center items-center gap-1 cursor-pointer"
                >
                  <span>Go to AI Role-Play Room</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Activity 2B: Semi-free role-play with AI */}
          {activity2SubStep === "2B" && (
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Activity 2B – Semi‑free role‑play with AI</span>
                <select
                  value={roleplayScenario}
                  onChange={(e) => {
                    setRoleplayScenario(e.target.value);
                    setRoleplaySessionId(null);
                  }}
                  disabled={!!roleplaySessionId}
                  className="bg-zinc-900 border border-white/5 p-1 rounded text-xs text-white"
                >
                  <option value="hotel_checkin">Hotel Desk Checkin</option>
                  <option value="buy_ticket">Station Ticket Counter</option>
                </select>
              </div>

              {!roleplaySessionId ? (
                <div className="p-6 bg-zinc-950 border border-white/5 rounded-2xl text-center space-y-4">
                  <div className="p-3 bg-brand-500/10 border border-brand-500/25 rounded-full w-fit mx-auto text-brand-400">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">
                    Start a stateful role-play session. You must state what you want (ticket or booking), reply to name/date queries, and complete transaction.
                  </p>
                  <button
                    onClick={handleStartRoleplay}
                    className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Launch Roleplay Counter
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
                          <span className="text-[9px] text-zinc-500">Clerk is typing...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scaffolding suggested chips */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">Suggested phrases:</span>
                    <div className="flex gap-1 flex-wrap">
                      {["체크인하고 싶은데요.", "부산행 기차표 한 장 주세요.", "얼마예요?", "카드로 할게요.", "감사합니다."].map((chip) => (
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
                        placeholder="Respond politely to the service clerk..."
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
                        Finish & Score
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-zinc-900 rounded-xl border border-brand-500/20 space-y-2 text-xs">
                      <p className="font-extrabold text-white">Service Assessment Result:</p>
                      <p className="text-zinc-400">{roleplayFeedback}</p>
                      <button
                        onClick={() => setStep(5)}
                        className="w-full mt-2 bg-brand-500 hover:bg-brand-600 text-white py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Proceed to Mini-Quiz Checkpoint
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
              <span>Mini‑Quiz: Travel Check</span>
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

      {/* Screen 6: Homework & Travel Day */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Homework & Real-World Lab</span>
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
                      <span className="font-extrabold text-white block mb-0.5">{item.id === "hw_b1_trav_1" ? "Task 1: Custom Dialogue Scripts" : item.id === "hw_b1_trav_2" ? "Task 2: Dual Role Shadowing" : "Task 3: Resolve Travel Issue"}</span>
                      {item.text}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Travel Day simulation chat */}
          <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-left space-y-3">
            <span className="text-[10px] text-brand-400 font-mono uppercase tracking-widest block font-bold">AI Travel Day Roleplay Simulator</span>
            
            {!travelDaySessionId ? (
              <div className="flex justify-between items-center">
                <p className="text-[11px] text-zinc-400 leading-normal max-w-sm">
                  Simulate a complete travel chain: Buy tickets, check in at a guesthouse, order food, and handle inquiries.
                </p>
                <button
                  onClick={handleStartTravelDay}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-4 rounded-xl transition text-[10px] cursor-pointer"
                >
                  Start Trip
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-zinc-950 rounded-xl p-3 border border-white/5 max-h-32 overflow-y-auto space-y-2 custom-scrollbar">
                  {travelDayMessages.map((msg, idx) => {
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
                  {travelDaySending && (
                    <div className="text-[9px] text-zinc-500 italic">Clerk is typing...</div>
                  )}
                </div>

                {!travelDayFinished ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={travelDayText}
                      onChange={(e) => setTravelDayText(e.target.value)}
                      placeholder="Talk to the helper (e.g. 부산행 표 한 장 주세요)..."
                      onKeyDown={(e) => e.key === "Enter" && handleSendTravelDayTurn()}
                      className="flex-grow bg-zinc-950 border border-white/5 rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-brand-500"
                    />
                    <button
                      onClick={handleSendTravelDayTurn}
                      disabled={travelDaySending || !travelDayText.trim()}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-3 rounded-lg text-[10px] font-bold transition"
                    >
                      Send
                    </button>
                    <button
                      onClick={handleFinishTravelDay}
                      className="bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-300 px-3 rounded-lg text-[10px] font-bold transition"
                    >
                      End Trip
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-950 rounded-xl border border-brand-500/10 text-[10px] text-zinc-400">
                    <p className="font-bold text-white mb-1">Feedback Summary:</p>
                    <p>{travelDayFeedback || "Completed travel day transactions!"}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Phase completion card */}
          <div className="p-5 bg-gradient-to-r from-brand-500/10 to-accent-teal/10 rounded-2xl border border-brand-500/20 text-center space-y-2">
            <div className="flex justify-center items-center gap-1 text-amber-400 font-extrabold text-sm uppercase">
              <Award className="w-5 h-5" />
              <span>Badge Earned: {quizBadge || "Travel Survivor B1"}</span>
            </div>
            <p className="text-xs text-zinc-300">
              Congratulations on completing Korean 4.2! Next: Phase 3 – Real‑World Social & Work/Study Conversations.
            </p>
            <div className="flex justify-center gap-4 text-xs font-bold pt-1">
              <span className="text-brand-400">XP +150</span>
              <span className="text-zinc-500">|</span>
              <span className="text-accent-teal">Phase 2 Complete</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(5)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button 
              onClick={onComplete}
              className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-accent-teal/20"
            >
              <span>Complete Phase 2</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
