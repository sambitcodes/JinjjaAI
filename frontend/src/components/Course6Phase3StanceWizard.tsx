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
  MessageCircle,
  TrendingUp,
  Play,
  Activity,
  CheckSquare,
  Bookmark,
  Layers,
  ArrowRight,
  Sliders
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

interface Course6Phase3StanceWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course6Phase3StanceWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course6Phase3StanceWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 6;

  // Loaded curriculum data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);
  const [sliderVal, setSliderVal] = useState<number>(50); // 0 = strong, 50 = balanced, 100 = tentative

  // Activity 1 states
  const [activity1SubStep, setActivity1SubStep] = useState<"1A" | "1B" | "1C">("1A");
  const [recognitionData, setRecognitionData] = useState<any>(null);
  const [activeRecIdx, setActiveRecIdx] = useState<number>(0);
  const [selectedStanceStrength, setSelectedStanceStrength] = useState<string | null>(null);
  const [recChecked, setRecChecked] = useState(false);
  const [recCorrect, setRecCorrect] = useState<boolean | null>(null);

  // Hedged vs Unhedged
  const [activeHvuIdx, setActiveHvuIdx] = useState<number>(0);
  const [selectedHvuOption, setSelectedHvuOption] = useState<string | null>(null);
  const [hvuChecked, setHvuChecked] = useState(false);
  const [hvuCorrect, setHvuCorrect] = useState<boolean | null>(null);

  // Softening Highlight
  const [activeDsIdx, setActiveDsIdx] = useState<number>(0);
  const [highlightedPhrase, setHighlightedPhrase] = useState<string | null>(null);
  const [dsChecked, setDsChecked] = useState(false);
  const [dsCorrect, setDsCorrect] = useState<boolean | null>(null);

  // Activity 2 states
  const [activity2SubStep, setActivity2SubStep] = useState<"2A" | "2B" | "2C">("2A");
  const [rewriteTemplates, setRewriteTemplates] = useState<any>(null);
  
  // Rewrite Opinion
  const [activeRewriteIdx, setActiveRewriteIdx] = useState<number>(0);
  const [targetStanceLevel, setTargetStanceLevel] = useState<string>("balanced");
  const [selectedRewriteChip, setSelectedRewriteChip] = useState<string | null>(null);
  const [rewriteFeedback, setRewriteFeedback] = useState<any>(null);
  const [submittingRewrite, setSubmittingRewrite] = useState(false);

  // Partial Agreement Builder
  const [activePaIdx, setActivePaIdx] = useState<number>(0);
  const [selectedPaOption, setSelectedPaOption] = useState<string | null>(null);
  const [paFeedback, setPaFeedback] = useState<any>(null);
  const [submittingPa, setSubmittingPa] = useState(false);

  // Nuanced discussion chat
  const [chatTopic, setChatTopic] = useState("Study and work balance");
  const [chatStarted, setChatStarted] = useState(false);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [aiText, setAiText] = useState("");
  const [aiSending, setAiSending] = useState(false);
  const [aiFinished, setAiFinished] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<any>(null);
  const [finishingDiscussion, setFinishingDiscussion] = useState(false);

  // Goals checkpoints
  const [goalSofteningUsed, setGoalSofteningUsed] = useState(false);
  const [goalConcessionUsed, setGoalConcessionUsed] = useState(false);

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

  // Homework AI practice session
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [practiceMessages, setPracticeMessages] = useState<any[]>([]);
  const [practiceText, setPracticeText] = useState("");
  const [practiceSending, setPracticeSending] = useState(false);
  const [practiceFinished, setPracticeFinished] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean5/3/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean5/3/core-data");
          setCoreData(res);
        } else if (step === 3 && !recognitionData) {
          const res = await apiJson("/practice/stance/recognition");
          setRecognitionData(res);
        } else if (step === 4 && !rewriteTemplates) {
          const res = await apiJson("/practice/stance/rewrite-templates");
          setRewriteTemplates(res);
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean5/phase-3/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean5/3/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading C1 stance data:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1A checks
  const handleCheckActivity1A = async () => {
    if (!recognitionData) return;
    const currentItem = recognitionData.recognition_items[activeRecIdx];
    const isCorrect = selectedStanceStrength === currentItem.stance;

    setRecChecked(true);
    setRecCorrect(isCorrect);

    try {
      await apiJson("/practice/stance/recognition/answer", {
        method: "POST",
        body: JSON.stringify({
          question_id: currentItem.id,
          answer: selectedStanceStrength,
          time_taken_ms: 2000
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Activity 1B checks
  const handleCheckActivity1B = () => {
    if (!recognitionData) return;
    const currentHvu = recognitionData.hedged_vs_unhedged[activeHvuIdx];
    const isCorrect = selectedHvuOption === "hedged";

    setHvuChecked(true);
    setHvuCorrect(isCorrect);
  };

  // Activity 1C checks
  const handleCheckActivity1C = () => {
    if (!recognitionData) return;
    const currentDs = recognitionData.dialogues_softening[activeDsIdx];
    const isCorrect = highlightedPhrase === currentDs.softening_marker;

    setDsChecked(true);
    setDsCorrect(isCorrect);
  };

  // Activity 2A Rewrite checks
  const handleCheckActivity2A = async () => {
    if (!rewriteTemplates) return;
    const currentTemp = rewriteTemplates.rewrite_templates[activeRewriteIdx];
    const targetRev = currentTemp.plain_text.replace(currentTemp.underlined, selectedRewriteChip || "");

    setSubmittingRewrite(true);
    try {
      const res = await apiJson("/practice/stance/rewrite/submit", {
        method: "POST",
        body: JSON.stringify({
          item_id: currentTemp.id,
          user_revision: targetRev,
          target_stance: targetStanceLevel
        })
      });
      setRewriteFeedback(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingRewrite(false);
    }
  };

  // Activity 2B Partial Agreement checks
  const handleCheckActivity2B = async () => {
    if (!rewriteTemplates) return;
    const currentPa = rewriteTemplates.partial_agreement_templates[activePaIdx];

    setSubmittingPa(true);
    try {
      const res = await apiJson("/practice/stance/partial-agreement/submit", {
        method: "POST",
        body: JSON.stringify({
          item_id: currentPa.id,
          user_phrase: selectedPaOption || ""
        })
      });
      setPaFeedback(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingPa(false);
    }
  };

  // Activity 2C Live Nuanced Discussion (AI chat)
  const handleStartDiscussion = async () => {
    setAiMessages([]);
    setAiEvaluation(null);
    setAiFinished(false);
    setChatStarted(true);
    try {
      const res = await apiJson("/conversation/c1/stance-discussion/start", {
        method: "POST",
        body: JSON.stringify({ topic: chatTopic })
      });
      setAiSessionId(res.session_id);
      setAiMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") {
        playAudio(res.opener);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendAiTurn = async () => {
    if (!aiText.trim() || !aiSessionId) return;
    const textToSend = aiText;
    setAiText("");
    setAiMessages(prev => [...prev, { sender: "user", text: textToSend }]);
    setAiSending(true);

    // Simple heuristic goals checker
    if (textToSend.includes("것 같") || textToSend.includes("대체로")) {
      setGoalSofteningUsed(true);
    }
    if (textToSend.includes("일리가 있") || textToSend.includes("의견도 맞")) {
      setGoalConcessionUsed(true);
    }

    try {
      const res = await apiJson("/conversation/c1/stance-discussion/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setAiMessages(prev => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") {
        playAudio(res.reply_ko);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiSending(false);
    }
  };

  const handleFinishDiscussion = async () => {
    if (!aiSessionId) return;
    setFinishingDiscussion(true);
    try {
      const res = await apiJson("/conversation/c1/stance-discussion/finish", { method: "POST" });
      setAiEvaluation(res.stance_usage_report);
      setAiFinished(true);
    } catch (err) {
      console.error(err);
    } finally {
      setFinishingDiscussion(false);
    }
  };

  // Quiz Checks
  const handleCheckQuiz = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelectedOpt) return;

    const isCorrect = quizSelectedOpt === current.correct_answer;
    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    if (!isCorrect) {
      setQuizMistakes(prev => [...prev, current.id]);
    }

    try {
      await apiJson("/quiz/korean5/phase-3/answer", {
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
        const res = await apiJson("/quiz/korean5/phase-3/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Nuanced Communicator C1");
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
    setCompletedHomework(prev => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/phases/korean5/3/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Homework AI practice session
  const handleStartStancePractice = async () => {
    setPracticeMessages([]);
    setPracticeFeedback(null);
    setPracticeFinished(false);
    try {
      const res = await apiJson("/conversation/c1/stance-practice/start", {
        method: "POST",
        body: JSON.stringify({})
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
    setPracticeMessages(prev => [...prev, { sender: "user", text: textToSend }]);
    setPracticeSending(true);

    try {
      const res = await apiJson("/conversation/c1/stance-practice/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setPracticeMessages(prev => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
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
      const res = await apiJson("/conversation/c1/stance-practice/finish", { method: "POST" });
      setPracticeFeedback(res.feedback);
      setPracticeFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Stance levels slider text helper
  const getSliderLevelInfo = () => {
    if (sliderVal < 33) {
      return {
        title: "Strong / Direct (확신/직설)",
        desc: "Expresses 100% certainty. Avoids qualifiers.",
        ex: "의심할 여지가 없습니다 (There is no doubt that...)"
      };
    } else if (sliderVal < 66) {
      return {
        title: "Balanced / Cautious (조절/신중)",
        desc: "Presents views with qualification and polite balance.",
        ex: "~인 경향이 있는 것 같습니다 (It seems that there is a tendency to...)"
      };
    } else {
      return {
        title: "Tentative / Exploratory (추측/탐색)",
        desc: "Explores possibilities cautiously, remaining highly respectful.",
        ex: "조심스럽지만 ~일지도 모릅니다 (It's cautious, but it might possibly be...)"
      };
    }
  };

    const outlineSteps = [
    { num: 1, label: "Screen 1 – Welcome / Phase Overview" },
    { num: 2, label: "Screen 2 – C1 Stance & Softening slider" },
    { num: 3, label: "Screen 3 – Activity 1: Recognize Nuanced Stance (Strength, Hedging, Dialogues)" },
    { num: 4, label: "Screen 4 – Activity 2: Production (Hedged rewrites, Agreement builders, Debate chat)" },
    { num: 5, label: "Screen 5 – Mini-Quiz: Stance level checkpoints" },
    { num: 6, label: "Screen 6 – Homework & Review logs" }
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
              <span>{activeLesson?.title || "Korean 5.3 – Nuanced Opinions & Soft Power"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Stance, Hedging & Politeness</p>
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
          
          <h2 className="text-5xl font-black text-white tracking-tight font-sans">Korean 5.3</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Nuanced Opinions & Soft Power</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Express complex opinions gently and precisely in Korean."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Show different levels of certainty: strong, cautious, and unsure",
                "Use hedging and softening phrases to sound balanced and polite",
                "Express partial agreement and subtle disagreement in real discussions"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 35}–45 minutes</p>
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
      {step === 2 && coreData && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-5 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>Stance, Hedging & Softening</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">C1 Stance and Hedging</p>
            <p className="italic font-serif">
              “Stance is how you show your attitude and certainty. Hedging is using cautious qualifying language to present balanced arguments, while softening reduces emotional friction when disagreeing.”
            </p>
          </div>

          {/* Stance Level Slider */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 space-y-3 text-left">
            <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono font-bold uppercase">
              <span>Stance Slider</span>
              <Sliders className="w-3.5 h-3.5 text-brand-400" />
            </div>

            <input 
              type="range" 
              min="0" 
              max="100" 
              value={sliderVal}
              onChange={(e) => setSliderVal(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />

            <div className="flex justify-between text-[9px] text-zinc-500 font-bold font-mono">
              <span className={sliderVal < 33 ? "text-white" : ""}>STRONG</span>
              <span className={sliderVal >= 33 && sliderVal < 66 ? "text-white" : ""}>CAUTIOUS</span>
              <span className={sliderVal >= 66 ? "text-white" : ""}>TENTATIVE</span>
            </div>

            {/* Selected slider details */}
            {(() => {
              const info = getSliderLevelInfo();
              return (
                <div className="p-3 bg-zinc-900 rounded-xl border border-white/[0.03] space-y-1 animate-fade-in">
                  <p className="text-xs font-black text-white">{info.title}</p>
                  <p className="text-[10px] text-zinc-400">{info.desc}</p>
                  <p className="text-[10px] font-korean text-brand-300 pt-1 font-bold">Example: {info.ex}</p>
                </div>
              );
            })()}
          </div>

          {/* Softening Phrase sets */}
          <div className="space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Common Hedging/Softening Markers</span>
            <div className="grid grid-cols-2 gap-2">
              {coreData.softening_phrases.map((phrase: any) => (
                <div 
                  key={phrase.ko}
                  className="p-3 bg-zinc-900 rounded-xl border border-white/5 flex justify-between items-center"
                >
                  <div>
                    <p className="font-korean font-black text-xs text-white">{phrase.ko}</p>
                    <p className="text-[9px] text-zinc-400 font-medium">{phrase.en}</p>
                  </div>
                  <button 
                    onClick={() => playAudio(phrase.ko)}
                    className="p-1.5 bg-zinc-950 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-white border border-white/5 transition cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
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

      {/* Screen 3: Activity 1: Recognize Nuanced Stance */}
      {step === 3 && recognitionData && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>
                {activity1SubStep === "1A" && "1A: Stance Strength"}
                {activity1SubStep === "1B" && "1B: Hedging Suitability"}
                {activity1SubStep === "1C" && "1C: Dialogue Softeners"}
              </span>
            </h2>
            <div className="flex gap-1">
              {["1A", "1B", "1C"].map((sub) => (
                <button 
                  key={sub}
                  onClick={() => setActivity1SubStep(sub as any)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${activity1SubStep === sub ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Activity 1A: Stance Strength */}
          {activity1SubStep === "1A" && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Classify opinion certainty strength:</span>
              
              <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase">Korean Opinion:</span>
                  <button 
                    onClick={() => playAudio(recognitionData.recognition_items[activeRecIdx].sentence)}
                    className="p-1 bg-zinc-900 border border-white/5 rounded text-[9px] text-zinc-300 hover:text-white px-2 flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Listen
                  </button>
                </div>
                <p className="font-korean text-zinc-200 text-sm leading-relaxed">{recognitionData.recognition_items[activeRecIdx].sentence}</p>
                <p className="text-[11px] text-zinc-500 italic">"{recognitionData.recognition_items[activeRecIdx].translation}"</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-white">Select the stance certainty level:</p>
                <div className="grid grid-cols-3 gap-2">
                  {["strong", "balanced", "tentative"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => !recChecked && setSelectedStanceStrength(lvl)}
                      className={`p-3 rounded-xl border text-xs font-bold transition capitalize ${
                        selectedStanceStrength === lvl 
                          ? "border-brand-500 bg-brand-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                      }`}
                      disabled={recChecked}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {recChecked && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${recCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                  <p className="font-black">{recCorrect ? "✓ Correct Level Identification!" : "✗ Mismatch. Review markers:"}</p>
                  <p className="text-zinc-400 leading-normal">
                    {recognitionData.recognition_items[activeRecIdx].explanation}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Stance markers: {recognitionData.recognition_items[activeRecIdx].markers.join(", ")}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                {!recChecked ? (
                  <button
                    onClick={handleCheckActivity1A}
                    disabled={!selectedStanceStrength}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Stance
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (activeRecIdx < recognitionData.recognition_items.length - 1) {
                        setActiveRecIdx(prev => prev + 1);
                        setSelectedStanceStrength(null);
                        setRecChecked(false);
                        setRecCorrect(null);
                      } else {
                        setActivity1SubStep("1B");
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {activeRecIdx < recognitionData.recognition_items.length - 1 ? "Next Sentence" : "Proceed to Hedging Suitability"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 1B: Hedging Suitability */}
          {activity1SubStep === "1B" && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Choose the most polite, balanced option:</span>
              <p className="text-xs text-zinc-400 font-semibold">{recognitionData.hedged_vs_unhedged[activeHvuIdx].context}</p>

              <div className="space-y-3">
                <button
                  onClick={() => !hvuChecked && setSelectedHvuOption("unhedged")}
                  className={`w-full p-4 rounded-2xl border text-left flex flex-col justify-between transition ${
                    selectedHvuOption === "unhedged" 
                      ? "border-brand-500 bg-brand-500/10 text-white" 
                      : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                  }`}
                  disabled={hvuChecked}
                >
                  <div>
                    <span className="text-[8px] uppercase tracking-widest font-mono text-zinc-500">Unhedged / Blunt</span>
                    <p className="font-korean text-zinc-200 text-xs mt-1.5 leading-relaxed">{recognitionData.hedged_vs_unhedged[activeHvuIdx].unhedged}</p>
                  </div>
                </button>

                <button
                  onClick={() => !hvuChecked && setSelectedHvuOption("hedged")}
                  className={`w-full p-4 rounded-2xl border text-left flex flex-col justify-between transition ${
                    selectedHvuOption === "hedged" 
                      ? "border-brand-500 bg-brand-500/10 text-white" 
                      : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                  }`}
                  disabled={hvuChecked}
                >
                  <div>
                    <span className="text-[8px] uppercase tracking-widest font-mono text-brand-400">Hedged / Softened</span>
                    <p className="font-korean text-zinc-200 text-xs mt-1.5 leading-relaxed">{recognitionData.hedged_vs_unhedged[activeHvuIdx].hedged}</p>
                  </div>
                </button>
              </div>

              {hvuChecked && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${hvuCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                  <p className="font-black">{hvuCorrect ? "✓ Correct! Softening makes rejection respectful." : "✗ Mismatch. Plain, blunt claims can sound demanding or aggressive to senior speakers."}</p>
                  <p className="text-zinc-400 leading-normal">
                    {recognitionData.hedged_vs_unhedged[activeHvuIdx].explanation}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                {!hvuChecked ? (
                  <button
                    onClick={handleCheckActivity1B}
                    disabled={!selectedHvuOption}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Selection
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (activeHvuIdx < recognitionData.hedged_vs_unhedged.length - 1) {
                        setActiveHvuIdx(prev => prev + 1);
                        setSelectedHvuOption(null);
                        setHvuChecked(false);
                        setHvuCorrect(null);
                      } else {
                        setActivity1SubStep("1C");
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {activeHvuIdx < recognitionData.hedged_vs_unhedged.length - 1 ? "Next Pair" : "Proceed to Dialogue Softening"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 1C: Dialogue Softeners */}
          {activity1SubStep === "1C" && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Tap the softening phrase in the dialogue response:</span>
              
              <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
                <span className="text-[8px] text-zinc-500 font-mono block">Korean Dialogue:</span>
                <p className="font-korean text-zinc-200 text-sm whitespace-pre-line leading-relaxed">
                  {recognitionData.dialogues_softening[activeDsIdx].dialogue_ko.split("\n").map((line: string, lIdx: number) => {
                    if (line.startsWith("B:")) {
                      const responsePart = line.slice(2).trim();
                      const targetPhrase = recognitionData.dialogues_softening[activeDsIdx].softening_marker;
                      
                      return (
                        <span key={lIdx} className="block mt-1">
                          <strong>B:</strong>{" "}
                          {responsePart.split(targetPhrase).map((chunk: string, cIdx: number) => (
                            <span key={cIdx}>
                              {chunk}
                              {cIdx === 0 && (
                                <button
                                  onClick={() => !dsChecked && setHighlightedPhrase(targetPhrase)}
                                  className={`px-1.5 py-0.5 rounded border transition font-bold font-korean ${
                                    highlightedPhrase === targetPhrase 
                                      ? "border-brand-500 bg-brand-500/10 text-white" 
                                      : "border-white/10 bg-zinc-900 text-zinc-300 hover:border-white/20"
                                  }`}
                                  disabled={dsChecked}
                                >
                                  {targetPhrase}
                                </button>
                              )}
                            </span>
                          ))}
                        </span>
                      );
                    }
                    return <span key={lIdx} className="block">{line}</span>;
                  })}
                </p>
              </div>

              {dsChecked && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${dsCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                  <p className="font-black">{dsCorrect ? "✓ Correct Softening Highlight!" : "✗ Mismatch. Look for the phrase that admits a point."}</p>
                  <p className="text-zinc-400">
                    The phrase <strong>"{recognitionData.dialogues_softening[activeDsIdx].softening_marker}"</strong> is used to acknowledge the other speaker's point (concession) before offering a counterargument.
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                {!dsChecked ? (
                  <button
                    onClick={handleCheckActivity1C}
                    disabled={!highlightedPhrase}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Highlight
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (activeDsIdx < recognitionData.dialogues_softening.length - 1) {
                        setActiveDsIdx(prev => prev + 1);
                        setHighlightedPhrase(null);
                        setDsChecked(false);
                        setDsCorrect(null);
                      } else {
                        setStep(4);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {activeDsIdx < recognitionData.dialogues_softening.length - 1 ? "Next Dialogue" : "Proceed to Production"}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button 
              onClick={() => {
                if (activity1SubStep === "1C") {
                  setActivity1SubStep("1B");
                } else if (activity1SubStep === "1B") {
                  setActivity1SubStep("1A");
                } else {
                  setStep(2);
                }
              }} 
              className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div />
          </div>
        </div>
      )}

      {/* Screen 4: Activity 2: Use Nuanced Stance */}
      {step === 4 && rewriteTemplates && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>
                {activity2SubStep === "2A" && "2A: Stance Rewrite"}
                {activity2SubStep === "2B" && "2B: Partial Agreement"}
                {activity2SubStep === "2C" && "2C: Debate Discussion"}
              </span>
            </h2>
            <div className="flex gap-1">
              {["2A", "2B", "2C"].map((sub) => (
                <button 
                  key={sub}
                  onClick={() => setActivity2SubStep(sub as any)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${activity2SubStep === sub ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Activity 2A: Stance Rewrite */}
          {activity2SubStep === "2A" && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Rewrite strong opinions using target stance level:</span>
              
              <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-2">
                <span className="text-[8px] text-zinc-500 font-mono uppercase">Strong Blunt Opinion:</span>
                <p className="font-korean text-zinc-200 text-sm">
                  {rewriteTemplates.rewrite_templates[activeRewriteIdx].plain_text.split(rewriteTemplates.rewrite_templates[activeRewriteIdx].underlined).map((chunk: string, idx: number) => (
                    <span key={idx}>
                      {chunk}
                      {idx === 0 && <span className="underline decoration-brand-400 font-black text-brand-400">{rewriteTemplates.rewrite_templates[activeRewriteIdx].underlined}</span>}
                    </span>
                  ))}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] gap-2">
                  <span className="text-zinc-400 font-bold uppercase font-mono">Target Stance Level:</span>
                  <div className="flex gap-1.5">
                    {["balanced", "tentative"].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => {
                          setTargetStanceLevel(lvl);
                          setSelectedRewriteChip(null);
                          setRewriteFeedback(null);
                        }}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold transition capitalize border ${
                          targetStanceLevel === lvl 
                            ? "border-brand-500 bg-brand-500/10 text-white" 
                            : "border-white/5 bg-zinc-900 text-zinc-400"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-300">Choose a softening chip replacement:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {rewriteTemplates.rewrite_templates[activeRewriteIdx].options.map((opt: any) => (
                      <button
                        key={opt.text}
                        onClick={() => !rewriteFeedback && setSelectedRewriteChip(opt.text)}
                        className={`p-3 rounded-xl border text-xs font-bold font-korean text-left transition flex justify-between items-center ${
                          selectedRewriteChip === opt.text
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                        }`}
                        disabled={!!rewriteFeedback}
                      >
                        <span>{opt.text}</span>
                        <span className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-500 font-mono">
                          {opt.stance}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {rewriteFeedback && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${rewriteFeedback.is_correct ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                  <p className="font-black">{rewriteFeedback.is_correct ? "✓ Correct Stance Shift!" : "✗ Mismatch. Selected chip does not match target stance level."}</p>
                  <p className="text-zinc-400 leading-normal">{rewriteFeedback.feedback}</p>
                </div>
              )}

              <div className="flex justify-end">
                {!rewriteFeedback ? (
                  <button
                    onClick={handleCheckActivity2A}
                    disabled={!selectedRewriteChip || submittingRewrite}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {submittingRewrite && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Submit Rewrite</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (activeRewriteIdx < rewriteTemplates.rewrite_templates.length - 1) {
                        setActiveRewriteIdx(prev => prev + 1);
                        setSelectedRewriteChip(null);
                        setRewriteFeedback(null);
                      } else {
                        setActivity2SubStep("2B");
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {activeRewriteIdx < rewriteTemplates.rewrite_templates.length - 1 ? "Next Sentence" : "Proceed to Agreement"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2B: Partial Agreement */}
          {activity2SubStep === "2B" && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Respond to statement with partial agreement/soft disagreement:</span>
              
              <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-2">
                <span className="text-[8px] text-zinc-500 font-mono uppercase">Prompt Statement:</span>
                <p className="font-korean text-zinc-200 text-sm font-black">"{rewriteTemplates.partial_agreement_templates[activePaIdx].statement}"</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-300">Choose your response pattern tile:</p>
                <div className="space-y-2">
                  {rewriteTemplates.partial_agreement_templates[activePaIdx].options.map((opt: any) => (
                    <button
                      key={opt.ko_phrase}
                      onClick={() => !paFeedback && setSelectedPaOption(opt.ko_phrase)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs transition flex flex-col justify-between ${
                        selectedPaOption === opt.ko_phrase
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                      }`}
                      disabled={!!paFeedback}
                    >
                      <span className="text-[8px] uppercase tracking-widest font-mono text-brand-400 block mb-1">{opt.label}</span>
                      <span className="font-korean text-zinc-200">{opt.ko_phrase}</span>
                    </button>
                  ))}
                </div>
              </div>

              {paFeedback && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-accent-teal/20 text-accent-teal text-xs space-y-1.5 animate-fade-in">
                  <p className="font-black">✓ Response Registered!</p>
                  <p className="text-zinc-400 leading-normal">{paFeedback.feedback}</p>
                </div>
              )}

              <div className="flex justify-end">
                {!paFeedback ? (
                  <button
                    onClick={handleCheckActivity2B}
                    disabled={!selectedPaOption || submittingPa}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {submittingPa && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Submit Response</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (activePaIdx < rewriteTemplates.partial_agreement_templates.length - 1) {
                        setActivePaIdx(prev => prev + 1);
                        setSelectedPaOption(null);
                        setPaFeedback(null);
                      } else {
                        setActivity2SubStep("2C");
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {activePaIdx < rewriteTemplates.partial_agreement_templates.length - 1 ? "Next Sentence" : "Proceed to Debate Chat"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2C: Debate Discussion */}
          {activity2SubStep === "2C" && (
            <div className="space-y-4 text-left animate-fade-in">
              {!chatStarted ? (
                <div className="space-y-4">
                  <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Start a C1 debate discussion:</span>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300">Choose debate topic:</label>
                    <select
                      value={chatTopic}
                      onChange={(e) => setChatTopic(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 p-3 rounded-xl outline-none text-xs text-white"
                    >
                      <option value="Study and work balance">Study and work balance</option>
                      <option value="Social media and daily life">Social media and daily life</option>
                      <option value="Working in teams vs alone">Working in teams vs alone</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleStartDiscussion}
                      className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" /> Start Debate Discussion
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Goals Checkpoints */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                      goalSofteningUsed ? "bg-accent-teal/10 border-accent-teal/30 text-accent-teal" : "bg-zinc-900 border-white/5 text-zinc-400"
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Used 1 softening / hedging phrase</span>
                    </div>
                    <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                      goalConcessionUsed ? "bg-accent-teal/10 border-accent-teal/30 text-accent-teal" : "bg-zinc-900 border-white/5 text-zinc-400"
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Used 1 concession / partial agreement</span>
                    </div>
                  </div>

                  {/* Message Log */}
                  <div className="bg-zinc-950 rounded-2xl border border-white/5 p-4 h-48 overflow-y-auto space-y-3 pr-1">
                    {aiMessages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`p-3 rounded-2xl max-w-[85%] text-xs ${
                          msg.sender === "user" 
                            ? "bg-brand-500 text-white rounded-br-none" 
                            : "bg-zinc-900 text-zinc-300 rounded-bl-none border border-white/5"
                        }`}>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {aiFinished && aiEvaluation && (
                    <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-xs space-y-2 animate-fade-in">
                      <div className="flex justify-between items-center font-bold text-white mb-1">
                        <span className="flex items-center gap-1"><Award className="w-4 h-4 text-brand-400" /> Stance Quality Summary</span>
                        <span className="text-brand-400">Hedging markers used: {aiEvaluation.hedging_count}</span>
                      </div>
                      <p className="text-zinc-300 leading-normal">{aiEvaluation.feedback}</p>
                      <p className="text-[10px] text-zinc-500">Stance variety level: {aiEvaluation.stance_variety}</p>
                    </div>
                  )}

                  {!aiFinished && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiText}
                        onChange={(e) => setAiText(e.target.value)}
                        placeholder="Type response in Korean..."
                        className="flex-grow bg-zinc-900 border border-white/10 p-3 rounded-xl outline-none focus:border-brand-500 text-xs text-white"
                        onKeyDown={(e) => e.key === "Enter" && handleSendAiTurn()}
                      />
                      {mode === "voice" && (
                        <button 
                          onClick={() => setAiText("제 생각에는 대체로 맞는 말씀이지만, 한편으로는 다른 문제도 있습니다.")}
                          className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-zinc-400 hover:text-white"
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={handleSendAiTurn}
                        disabled={aiSending || !aiText.trim()}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        {aiSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send"}
                      </button>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    {!aiFinished && (
                      <button
                        onClick={handleFinishDiscussion}
                        disabled={finishingDiscussion}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {finishingDiscussion && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Finish & Evaluate Stance</span>
                      </button>
                    )}
                    {aiFinished && (
                      <button
                        onClick={() => setStep(5)}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Proceed to Mini-Quiz
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button 
              onClick={() => {
                if (activity2SubStep === "2C") {
                  setActivity2SubStep("2B");
                  setChatStarted(false);
                  setGoalSofteningUsed(false);
                  setGoalConcessionUsed(false);
                } else if (activity2SubStep === "2B") {
                  setActivity2SubStep("2A");
                  setPaFeedback(null);
                  setSelectedPaOption(null);
                } else {
                  setStep(3);
                }
              }} 
              className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div />
          </div>
        </div>
      )}

      {/* Screen 5: Mini-Quiz Checkpoint */}
      {step === 5 && quizBlueprint.length > 0 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Stance Checkpoint Quiz</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Question {quizIdx + 1}/{quizBlueprint.length}</span>
          </div>

          <div className="space-y-4 text-left">
            <p className="text-sm font-extrabold text-white leading-relaxed">
              {quizBlueprint[quizIdx].question}
            </p>

            <div className="space-y-2">
              {quizBlueprint[quizIdx].options.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                  className={`w-full p-4 rounded-xl text-left text-xs font-medium border transition ${
                    quizSelectedOpt === opt 
                      ? "border-brand-500 bg-brand-500/10 text-white" 
                      : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                  } ${quizChecked && opt === quizBlueprint[quizIdx].correct_answer ? "border-accent-teal bg-accent-teal/10 text-white" : ""}`}
                  disabled={quizChecked}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {quizChecked && (
            <div className={`p-4 rounded-2xl border text-xs space-y-1.5 animate-fade-in ${
              quizCorrect 
                ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" 
                : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"
            }`}>
              <p className="font-black">{quizCorrect ? "✓ Correct!" : `✗ Incorrect (Correct Answer: ${quizBlueprint[quizIdx].correct_answer})`}</p>
              <p className="text-zinc-400 leading-normal">{quizBlueprint[quizIdx].explanation}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <div />
            {!quizChecked ? (
              <button
                onClick={handleCheckQuiz}
                disabled={!quizSelectedOpt}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Verify Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuizOrComplete}
                disabled={finishingQuiz}
                className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {finishingQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Complete & Finish"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Screen 6: Graduation / Homework Checklist */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-accent-teal/10 rounded-full border border-accent-teal/25 w-fit mx-auto text-accent-teal shrink-0">
            <Award className="w-10 h-10 animate-bounce shrink-0" />
          </div>

          <h2 className="text-2xl font-black text-white">Phase 3 Completed!</h2>
          <p className="text-xs text-zinc-400">You have earned the badge & graduation reward:</p>

          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full flex items-center gap-4 text-left">
            <div className="p-2.5 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/25">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white">{quizBadge || "Nuanced Communicator C1"}</p>
              <p className="text-[10px] text-zinc-500">Graduation Score: {quizScore || 100}% | +150 XP rewarded</p>
            </div>
          </div>

          {/* Homework checklist */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Spaced Homework Recommendations:</span>
            
            <div className="space-y-2">
              {homeworkItems.map((item: any) => (
                <div 
                  key={item.id}
                  onClick={() => handleToggleHomework(item.id, !!completedHomework[item.id])}
                  className="flex items-start gap-3 p-2.5 bg-zinc-900 rounded-xl border border-white/[0.03] hover:border-brand-500/20 transition cursor-pointer"
                >
                  <button className="mt-0.5 shrink-0">
                    <CheckSquare className={`w-4 h-4 ${completedHomework[item.id] ? "text-accent-teal" : "text-zinc-600"}`} />
                  </button>
                  <p className="text-[11px] text-zinc-300 leading-normal">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Practice nuanced opinions with AI tutor */}
          {!practiceSessionId ? (
            <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-md mx-auto w-full space-y-2 text-left">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">AI Stance Practice:</span>
              <p className="text-[10px] text-zinc-400">Practice shifting opinions between Strong and Cautious versions in a live tutoring room.</p>
              <div className="flex justify-end">
                <button
                  onClick={handleStartStancePractice}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Practice Nuanced Opinions
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-md mx-auto w-full space-y-3 text-left animate-fade-in">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">AI Stance Coaching Room:</span>
              
              <div className="bg-zinc-900/60 border border-white/[0.04] p-3 rounded-xl h-36 overflow-y-auto space-y-2 pr-1">
                {practiceMessages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`p-2.5 rounded-xl max-w-[85%] text-[10px] ${
                      m.sender === "user" ? "bg-brand-500 text-white" : "bg-zinc-950 text-zinc-300 border border-white/5"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              {practiceFinished && practiceFeedback && (
                <div className="bg-zinc-900 p-3 rounded-xl border border-white/5 text-[10px] text-zinc-300 leading-normal animate-fade-in">
                  <span className="font-bold text-white block mb-0.5">Tutor Stance Summary:</span>
                  {practiceFeedback}
                </div>
              )}

              {!practiceFinished ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={practiceText}
                    onChange={(e) => setPracticeText(e.target.value)}
                    placeholder="Type opinion sentence..."
                    className="flex-grow bg-zinc-900 border border-white/10 p-2.5 rounded-lg outline-none focus:border-brand-500 text-[11px] text-white"
                  />
                  <button
                    onClick={handleSendPracticeTurn}
                    disabled={practiceSending || !practiceText.trim()}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {practiceSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send"}
                  </button>
                  <button
                    onClick={handleFinishPractice}
                    className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border border-white/5"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setPracticeSessionId(null);
                      setPracticeMessages([]);
                      setPracticeFinished(false);
                    }}
                    className="text-[10px] text-zinc-500 underline"
                  >
                    Start another practice
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 max-w-xs mx-auto pt-4 border-t border-white/5 w-full">
            <button 
              onClick={onComplete}
              className="bg-accent-teal hover:bg-accent-teal/90 text-zinc-950 font-black py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-accent-teal/20"
            >
              <span>Graduate Phase 3</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Next: Phase 4 – High‑Level Register & Style (Social / Academic / Professional)</p>
          </div>
        </div>
      )}
    </div>
  );
}
