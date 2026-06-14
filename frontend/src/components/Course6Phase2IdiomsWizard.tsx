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
  ArrowRight
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

interface Course6Phase2IdiomsWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course6Phase2IdiomsWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course6Phase2IdiomsWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 6;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string>("theme_emotions");

  // Activity 1 states
  const [activity1SubStep, setActivity1SubStep] = useState<"1A" | "1B" | "1C">("1A");
  const [contextData, setContextData] = useState<any>(null);
  const [activeDialogueIdx, setActiveDialogueIdx] = useState<number>(0);
  const [selectedComprehensionAns, setSelectedComprehensionAns] = useState<string | null>(null);
  const [compChecked, setCompChecked] = useState(false);
  const [compCorrect, setCompCorrect] = useState<boolean | null>(null);

  // Literal vs Idiomatic
  const [activeLviIdx, setActiveLviIdx] = useState<number>(0);
  const [selectedLviChoice, setSelectedLviChoice] = useState<string | null>(null);
  const [lviChecked, setLviChecked] = useState(false);
  const [lviCorrect, setLviCorrect] = useState<boolean | null>(null);
  const [lviFollowUpRegister, setLviFollowUpRegister] = useState<string | null>(null);
  const [lviFollowUpStrength, setLviFollowUpStrength] = useState<string | null>(null);

  // Collocations
  const [activeCollocationIdx, setActiveCollocationIdx] = useState<number>(0);
  const [selectedCollocationVerb, setSelectedCollocationVerb] = useState<string | null>(null);
  const [collChecked, setCollChecked] = useState(false);
  const [collCorrect, setCollCorrect] = useState<boolean | null>(null);

  // Activity 2 states
  const [activity2SubStep, setActivity2SubStep] = useState<"2A" | "2B" | "2C">("2A");
  const [productionData, setProductionData] = useState<any>(null);
  
  // Gap Fill
  const [selectedProdTheme, setSelectedProdTheme] = useState<string>("theme_emotions");
  const [gapFillAnswers, setGapFillAnswers] = useState<Record<string, string>>({});
  const [gapFillFeedback, setGapFillFeedback] = useState<any>(null);
  const [submittingGapFill, setSubmittingGapFill] = useState(false);

  // Rewrite
  const [activeRewriteIdx, setActiveRewriteIdx] = useState<number>(0);
  const [rewriteInput, setRewriteInput] = useState<string>("");
  const [rewriteFeedback, setRewriteFeedback] = useState<any>(null);
  const [submittingRewrite, setSubmittingRewrite] = useState(false);

  // Speak with Idioms (AI chat)
  const [availableIdiomsForTheme, setAvailableIdiomsForTheme] = useState<string[]>([]);
  const [targetIdioms, setTargetIdioms] = useState<string[]>([]);
  const [chatStarted, setChatStarted] = useState(false);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [aiText, setAiText] = useState("");
  const [aiSending, setAiSending] = useState(false);
  const [aiFinished, setAiFinished] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<any>(null);
  const [finishingPractice, setFinishingPractice] = useState(false);

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

  // Homework AI review focus session
  const [reviewSelectedIdioms, setReviewSelectedIdioms] = useState<string[]>([]);
  const [reviewChatStarted, setReviewChatStarted] = useState(false);
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
          const res = await apiJson("/phases/korean5/2/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean5/2/core-data");
          setCoreData(res);
        } else if (step === 3 && !contextData) {
          const res = await apiJson("/practice/idioms/context-comprehension");
          setContextData(res);
        } else if (step === 4 && !productionData) {
          const res = await apiJson("/practice/idioms/production-templates");
          setProductionData(res);
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean5/phase-2/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean5/2/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading C1 idioms data:", err);
      }
    };
    load();
  }, [step]);

  // Sync available idioms when theme changes in step 4
  useEffect(() => {
    if (coreData?.themes) {
      const activeTheme = coreData.themes.find((t: any) => t.id === selectedProdTheme);
      if (activeTheme) {
        setAvailableIdiomsForTheme(activeTheme.items.map((i: any) => i.korean));
      }
    }
  }, [selectedProdTheme, coreData]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1A Context dialogue answer verification
  const handleCheckActivity1A = async () => {
    if (!contextData) return;
    const currentDiag = contextData.context_dialogues[activeDialogueIdx];
    const isCorrect = selectedComprehensionAns === currentDiag.options.find((o: any) => o.is_correct)?.text;

    setCompChecked(true);
    setCompCorrect(isCorrect);

    try {
      await apiJson("/practice/idioms/context-comprehension/answer", {
        method: "POST",
        body: JSON.stringify({
          question_id: currentDiag.id,
          answer: selectedComprehensionAns,
          time_taken_ms: 2000
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Activity 1B Literal vs Idiomatic verification
  const handleCheckActivity1B = () => {
    if (!contextData) return;
    const currentLvi = contextData.literal_vs_idiomatic[activeLviIdx];
    const isCorrect = selectedLviChoice === currentLvi.correct;

    setLviChecked(true);
    setLviCorrect(isCorrect);
  };

  // Activity 1C Collocation check
  const handleCheckActivity1C = () => {
    if (!contextData) return;
    const currentColl = contextData.collocations[activeCollocationIdx];
    const isCorrect = selectedCollocationVerb === currentColl.options.find((o: any) => o.is_correct)?.text;

    setCollChecked(true);
    setCollCorrect(isCorrect);
  };

  // Activity 2A Gap Fill submission
  const handleCheckActivity2A = async () => {
    if (!productionData) return;
    const currentTemplate = productionData.production_templates.find((t: any) => t.theme === selectedProdTheme);
    if (!currentTemplate) return;

    setSubmittingGapFill(true);
    try {
      const res = await apiJson("/practice/idioms/gapfill/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: currentTemplate.id,
          answers: gapFillAnswers
        })
      });
      setGapFillFeedback(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingGapFill(false);
    }
  };

  // Activity 2B Rewrite submission
  const handleCheckActivity2B = async () => {
    if (!productionData) return;
    const currentRewrite = productionData.rewrites[activeRewriteIdx];

    setSubmittingRewrite(true);
    try {
      const res = await apiJson("/practice/idioms/rewrite/submit", {
        method: "POST",
        body: JSON.stringify({
          item_id: currentRewrite.id,
          user_rewrite: rewriteInput
        })
      });
      setRewriteFeedback(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingRewrite(false);
    }
  };

  // Activity 2C Speak with Idioms (AI Dialogue Chat)
  const toggleTargetIdiom = (idiom: string) => {
    setTargetIdioms(prev => 
      prev.includes(idiom) ? prev.filter(i => i !== idiom) : [...prev, idiom]
    );
  };

  const handleStartAiChat = async () => {
    setAiMessages([]);
    setAiEvaluation(null);
    setAiFinished(false);
    setChatStarted(true);
    try {
      const res = await apiJson("/conversation/c1/idiom-practice/start", {
        method: "POST",
        body: JSON.stringify({
          theme_id: selectedProdTheme,
          target_idioms: targetIdioms
        })
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

    try {
      const res = await apiJson("/conversation/c1/idiom-practice/turn", {
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

  const handleFinishAiChat = async () => {
    if (!aiSessionId) return;
    setFinishingPractice(true);
    try {
      const res = await apiJson("/conversation/c1/idiom-practice/finish", { method: "POST" });
      setAiEvaluation(res);
      setAiFinished(true);
    } catch (err) {
      console.error(err);
    } finally {
      setFinishingPractice(false);
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
      await apiJson("/quiz/korean5/phase-2/answer", {
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
        const res = await apiJson("/quiz/korean5/phase-2/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Idiomatic Speaker C1");
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
      await apiJson("/phases/korean5/2/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Homework AI practice session
  const toggleReviewIdiom = (idiom: string) => {
    setReviewSelectedIdioms(prev => 
      prev.includes(idiom) ? prev.filter(i => i !== idiom) : [...prev, idiom]
    );
  };

  const handleStartPracticeReview = async () => {
    setPracticeMessages([]);
    setPracticeFeedback(null);
    setPracticeFinished(false);
    setReviewChatStarted(true);
    try {
      const res = await apiJson("/conversation/c1/idiom-review/start", {
        method: "POST",
        body: JSON.stringify({ selected_idioms: reviewSelectedIdioms })
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
      const res = await apiJson("/conversation/c1/idiom-review/turn", {
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
      const res = await apiJson("/conversation/c1/idiom-review/finish", { method: "POST" });
      setPracticeFeedback(res.feedback);
      setPracticeFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-grow flex flex-col justify-between max-w-2xl mx-auto w-full font-sans">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-zinc-900 border border-white/10">
            <BookOpen className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg flex items-center gap-2">
              <span>{activeLesson?.title || "Korean 5.2 – Idioms & Natural Expressions"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Advanced Idioms & Collocations</p>
          </div>
        </div>
        
        {/* Active progress bar */}
        <div className="flex items-center space-x-4">
          <div className="w-32 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 rounded-full transition-all duration-500" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 font-bold">{Math.round((step / totalSteps) * 100)}%</span>
          <button 
            onClick={() => setShowOutline(!showOutline)}
            className="text-[10px] bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded transition cursor-pointer"
          >
            {showOutline ? "Hide Outline" : "View Outline"}
          </button>
        </div>
      </header>

      {/* Screen 1: Welcome/Overview */}
      {step === 1 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-3xl font-black text-white font-sans">Korean 5.2</h2>
          <h3 className="text-xl font-bold text-brand-400 mt-1">Idioms & Natural Expressions</h3>
          
          <p className="text-zinc-300 text-sm leading-relaxed max-w-md mx-auto">
            {metadata?.description || "Use advanced idioms and fixed phrases naturally in Korean."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Learn topic‑based idioms and fixed expressions for everyday life",
                "Understand connotations, register, and when NOT to use them",
                "Use idioms naturally in stories and conversations at C1 level"
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
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 2</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
          </div>

          {showOutline && (
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-1.5 animate-fade-in max-w-md mx-auto w-full font-mono">
              <p className="font-extrabold text-white text-center pb-2">Course syllabus activities:</p>
              <p>✓ Screen 1 – Welcome / Phase Overview</p>
              <p>✓ Screen 2 – C1 Idioms & Chunk categories</p>
              <p>✓ Screen 3 – Activity 1: Understand Idioms in Context (Dialogues, Collocations)</p>
              <p>✓ Screen 4 – Activity 2: Production (Gap-fill, Rewrites, AI chat)</p>
              <p>✓ Screen 5 – Mini-Quiz: Scenarios & Register checkpoints</p>
              <p>✓ Screen 6 – Homework & Review logs</p>
            </div>
          )}
        </div>
      )}

      {/* Screen 2: Concept Explanation */}
      {step === 2 && coreData && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-5 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-400" />
              <span>Idioms & Natural Expressions</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">Advanced Language Chunks</p>
            <p className="italic font-serif">
              “At C1, fluent speakers use many idioms, fixed expressions, and collocations. These are ready‑made language chunks that make your speech sound natural and nuanced.”
            </p>
          </div>

          {/* Theme Selector */}
          <div className="space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">1. Select a Topic Theme</span>
            <div className="grid grid-cols-3 gap-2">
              {coreData.themes.map((theme: any) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                    selectedThemeId === theme.id 
                      ? "border-brand-500 bg-brand-500/10 text-white" 
                      : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                  }`}
                >
                  <p>{theme.name}</p>
                  <p className="text-[9px] opacity-60 font-korean mt-0.5">{theme.korean}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Cards for selected theme items */}
          <div className="space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">2. Target Vocabulary Deck</span>
            <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
              {coreData.themes.find((t: any) => t.id === selectedThemeId)?.items.map((item: any) => (
                <div 
                  key={item.korean}
                  className="p-3 bg-zinc-900/80 rounded-xl border border-white/5 hover:border-brand-500/20 transition flex justify-between items-start gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-korean font-black text-white text-sm">{item.korean}</span>
                      <span className="text-[8px] uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono border border-white/5">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-[11px] leading-normal">{item.meaning} &bull; <span className="italic text-zinc-500 font-korean">{item.definition}</span></p>
                    <p className="text-[10px] text-zinc-400 font-korean mt-1 bg-zinc-950/40 p-1.5 rounded border border-white/[0.02]">
                      예문: {item.example_ko} <span className="text-zinc-500 font-sans block text-[9px]">{item.example_en}</span>
                    </p>
                  </div>

                  <button 
                    onClick={() => playAudio(item.korean)}
                    className="p-2 bg-zinc-950 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-white border border-white/5 transition shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Register and Connotation Warning */}
          <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 text-[10px] text-zinc-400 leading-relaxed text-left flex gap-2.5 items-start">
            <span className="p-1 bg-amber-500/10 text-amber-400 rounded border border-amber-500/25 uppercase text-[8px] font-black tracking-wider shrink-0 mt-0.5">Note</span>
            <p>
              <strong>Not every idiom is okay in every situation.</strong> C1 is not about using idioms everywhere—it’s about using them at the right time. Pay attention to registers (informal vs. formal) and connotations.
            </p>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Understand Idioms in Context */}
      {step === 3 && contextData && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>
                {activity1SubStep === "1A" && "1A: Context Guessing"}
                {activity1SubStep === "1B" && "1B: Literal vs Idiomatic"}
                {activity1SubStep === "1C" && "1C: Collocation Check"}
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

          {/* Activity 1A: Guess meaning from context */}
          {activity1SubStep === "1A" && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Guess idiom meaning from dialogue:</span>
              
              <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase">Korean Dialogue:</span>
                  <button 
                    onClick={() => playAudio(contextData.context_dialogues[activeDialogueIdx].dialogue_ko)}
                    className="p-1 bg-zinc-900 border border-white/5 rounded text-[9px] text-zinc-300 hover:text-white px-2 flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Listen
                  </button>
                </div>
                <p className="font-korean text-zinc-200 text-sm whitespace-pre-line leading-relaxed">{contextData.context_dialogues[activeDialogueIdx].dialogue_ko}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-white">
                  What does <span className="text-brand-400 font-korean">"{contextData.context_dialogues[activeDialogueIdx].target_idiom}"</span> mean in this context?
                </p>
                <div className="space-y-2">
                  {contextData.context_dialogues[activeDialogueIdx].options.map((opt: any) => (
                    <button
                      key={opt.text}
                      onClick={() => !compChecked && setSelectedComprehensionAns(opt.text)}
                      className={`w-full p-3 rounded-xl text-left text-xs border transition ${
                        selectedComprehensionAns === opt.text 
                          ? "border-brand-500 bg-brand-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                      }`}
                      disabled={compChecked}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>

              {compChecked && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${compCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                  <p className="font-black">{compCorrect ? "✓ Correct! Great job parsing context." : "✗ Mismatch. Review details below:"}</p>
                  <p className="text-zinc-400 leading-normal">
                    <strong>Explanation:</strong> {contextData.context_dialogues[activeDialogueIdx].explanation}
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase font-mono">
                    Register: {contextData.context_dialogues[activeDialogueIdx].register} | Connotation: {contextData.context_dialogues[activeDialogueIdx].connotation}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                {!compChecked ? (
                  <button
                    onClick={handleCheckActivity1A}
                    disabled={!selectedComprehensionAns}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Meaning
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (activeDialogueIdx < contextData.context_dialogues.length - 1) {
                        setActiveDialogueIdx(prev => prev + 1);
                        setSelectedComprehensionAns(null);
                        setCompChecked(false);
                        setCompCorrect(null);
                      } else {
                        setActivity1SubStep("1B");
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {activeDialogueIdx < contextData.context_dialogues.length - 1 ? "Next Dialogue" : "Proceed to Literal vs Idiomatic"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 1B: Literal vs Idiomatic */}
          {activity1SubStep === "1B" && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Contrast plain vs idiomatic styles:</span>
              <p className="text-xs text-zinc-400 font-semibold">{contextData.literal_vs_idiomatic[activeLviIdx].context_desc}</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => !lviChecked && setSelectedLviChoice("literal")}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition ${
                    selectedLviChoice === "literal" 
                      ? "border-brand-500 bg-brand-500/10 text-white" 
                      : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                  }`}
                  disabled={lviChecked}
                >
                  <div>
                    <span className="text-[8px] uppercase tracking-widest font-mono text-zinc-500">Literal Plain</span>
                    <p className="font-korean text-zinc-200 text-xs mt-1.5 leading-relaxed">{contextData.literal_vs_idiomatic[activeLviIdx].literal_sentence}</p>
                  </div>
                </button>

                <button
                  onClick={() => !lviChecked && setSelectedLviChoice("idiomatic")}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition ${
                    selectedLviChoice === "idiomatic" 
                      ? "border-brand-500 bg-brand-500/10 text-white" 
                      : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                  }`}
                  disabled={lviChecked}
                >
                  <div>
                    <span className="text-[8px] uppercase tracking-widest font-mono text-brand-400">C1 Idiomatic</span>
                    <p className="font-korean text-zinc-200 text-xs mt-1.5 leading-relaxed">{contextData.literal_vs_idiomatic[activeLviIdx].idiomatic_sentence}</p>
                  </div>
                </button>
              </div>

              {selectedLviChoice && (
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3 animate-fade-in">
                  <p className="text-xs font-bold text-white">Nuance & Register Checks:</p>
                  
                  <div className="flex items-center justify-between text-[10px] gap-2">
                    <span className="text-zinc-400 font-bold">Register type?</span>
                    <div className="flex gap-1.5">
                      {["Casual", "Neutral/Formal"].map((r) => (
                        <button
                          key={r}
                          onClick={() => !lviChecked && setLviFollowUpRegister(r)}
                          className={`px-2 py-1 rounded border transition ${
                            lviFollowUpRegister === r 
                              ? "border-brand-500 bg-brand-500/10 text-white" 
                              : "border-white/5 bg-zinc-900 text-zinc-400"
                          }`}
                          disabled={lviChecked}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] gap-2">
                    <span className="text-zinc-400 font-bold">Expression strength?</span>
                    <div className="flex gap-1.5">
                      {["Mild", "Strong"].map((s) => (
                        <button
                          key={s}
                          onClick={() => !lviChecked && setLviFollowUpStrength(s)}
                          className={`px-2 py-1 rounded border transition ${
                            lviFollowUpStrength === s 
                              ? "border-brand-500 bg-brand-500/10 text-white" 
                              : "border-white/5 bg-zinc-900 text-zinc-400"
                          }`}
                          disabled={lviChecked}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {lviChecked && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${lviCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                  <p className="font-black">{lviCorrect ? "✓ Correct Choice!" : "✗ Plain Korean is okay, but C1 expressions add richness."}</p>
                  <p className="text-zinc-400 leading-normal">
                    {contextData.literal_vs_idiomatic[activeLviIdx].explanation}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                {!lviChecked ? (
                  <button
                    onClick={handleCheckActivity1B}
                    disabled={!selectedLviChoice}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Nuance
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (activeLviIdx < contextData.literal_vs_idiomatic.length - 1) {
                        setActiveLviIdx(prev => prev + 1);
                        setSelectedLviChoice(null);
                        setLviFollowUpRegister(null);
                        setLviFollowUpStrength(null);
                        setLviChecked(false);
                        setLviCorrect(null);
                      } else {
                        setActivity1SubStep("1C");
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {activeLviIdx < contextData.literal_vs_idiomatic.length - 1 ? "Next Pair" : "Proceed to Collocations"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 1C: Collocations check */}
          {activity1SubStep === "1C" && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Match natural collocations:</span>
              
              <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 space-y-3">
                <span className="text-[9px] text-zinc-500 font-mono block">Target Noun:</span>
                <p className="text-xl font-extrabold text-white font-korean">{contextData.collocations[activeCollocationIdx].noun}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-white">Which verb naturally collocates with this noun?</p>
                <div className="grid grid-cols-3 gap-2">
                  {contextData.collocations[activeCollocationIdx].options.map((opt: any) => (
                    <button
                      key={opt.text}
                      onClick={() => !collChecked && setSelectedCollocationVerb(opt.text)}
                      className={`p-3 rounded-xl border text-xs font-bold font-korean transition ${
                        selectedCollocationVerb === opt.text 
                          ? "border-brand-500 bg-brand-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                      }`}
                      disabled={collChecked}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>

              {collChecked && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${collCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                  <p className="font-black">{collCorrect ? "✓ Correct Collocation!" : "✗ Mismatch. In Korean, these terms do not connect naturally."}</p>
                  <p className="text-zinc-400 leading-normal">
                    {contextData.collocations[activeCollocationIdx].explanation}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-korean">
                    Example: {contextData.collocations[activeCollocationIdx].example_sentence}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                {!collChecked ? (
                  <button
                    onClick={handleCheckActivity1C}
                    disabled={!selectedCollocationVerb}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Collocation
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (activeCollocationIdx < contextData.collocations.length - 1) {
                        setActiveCollocationIdx(prev => prev + 1);
                        setSelectedCollocationVerb(null);
                        setCollChecked(false);
                        setCollCorrect(null);
                      } else {
                        setStep(4);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {activeCollocationIdx < contextData.collocations.length - 1 ? "Next Collocation" : "Proceed to Production"}
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

      {/* Screen 4: Activity 2: Use Idioms Productively */}
      {step === 4 && productionData && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>
                {activity2SubStep === "2A" && "2A: Text Gap-Fill"}
                {activity2SubStep === "2B" && "2B: Idiomatic Rewrite"}
                {activity2SubStep === "2C" && "2C: Conversation Chat"}
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

          {/* Activity 2A: Gap Fill */}
          {activity2SubStep === "2A" && (
            <div className="space-y-4 text-left animate-fade-in">
              <div className="flex justify-between items-center text-[10px] gap-2">
                <span className="text-zinc-500 font-bold uppercase font-mono">Select Theme:</span>
                <div className="flex gap-1.5">
                  {productionData.themes.map((themeName: string, idx: number) => {
                    const mappedId = idx === 0 ? "theme_emotions" : (idx === 1 ? "theme_work_effort" : "theme_success_failure");
                    return (
                      <button
                        key={themeName}
                        onClick={() => {
                          setSelectedProdTheme(mappedId);
                          setGapFillAnswers({});
                          setGapFillFeedback(null);
                        }}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold transition border ${
                          selectedProdTheme === mappedId 
                            ? "border-brand-500 bg-brand-500/10 text-white" 
                            : "border-white/5 bg-zinc-900 text-zinc-400"
                        }`}
                      >
                        {themeName.split(" & ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Show Paragraph with inputs */}
              {(() => {
                const currentTemplate = productionData.production_templates.find((t: any) => t.theme === selectedProdTheme);
                if (!currentTemplate) return null;
                
                // Segment the text by gaps
                let text = currentTemplate.text_ko;
                return (
                  <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 space-y-4">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">Theme Paragraph Gap-fill:</span>
                    <p className="font-korean text-zinc-200 text-sm leading-loose whitespace-pre-line">
                      {text.split(/\[GAP\d+\]/g).map((chunk: string, idx: number) => {
                        const gapId = `GAP${idx + 1}`;
                        const gap = currentTemplate.gaps.find((g: any) => g.id === gapId);
                        
                        return (
                          <span key={idx}>
                            {chunk}
                            {gap && (
                              <span className="inline-block mx-1">
                                <input
                                  type="text"
                                  placeholder={`(${gap.hint})`}
                                  value={gapFillAnswers[gapId] || ""}
                                  onChange={(e) => setGapFillAnswers(prev => ({ ...prev, [gapId]: e.target.value }))}
                                  className={`bg-zinc-900 border ${gapFillFeedback?.feedback?.[gapId]?.is_correct === false ? "border-accent-pink" : "border-white/10"} text-white rounded px-2.5 py-1 text-xs outline-none focus:border-brand-500 w-36 font-korean`}
                                  disabled={!!gapFillFeedback}
                                />
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </p>
                    <p className="text-[10px] text-zinc-500 italic mt-2">"{currentTemplate.text_en}"</p>
                  </div>
                );
              })()}

              {gapFillFeedback && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs space-y-2">
                  <p className="font-bold text-white">Score: {gapFillFeedback.score}%</p>
                  <div className="space-y-1.5 font-mono text-[10px]">
                    {Object.entries(gapFillFeedback.feedback).map(([gapId, detail]: any) => (
                      <p key={gapId} className={detail.is_correct ? "text-accent-teal" : "text-accent-pink"}>
                        {gapId}: {detail.is_correct ? "✓ Correct" : `✗ Incorrect (Correct: ${detail.correct}, Typed: ${detail.user_answer})`}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                {!gapFillFeedback ? (
                  <button
                    onClick={handleCheckActivity2A}
                    disabled={submittingGapFill}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {submittingGapFill && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Submit Paragraph</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActivity2SubStep("2B")}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Proceed to Rewrite
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2B: Rewrite */}
          {activity2SubStep === "2B" && (
            <div className="space-y-4 text-left animate-fade-in">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Replace literal phrasing with C1 idioms:</span>
              
              <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-2">
                <span className="text-[8px] text-zinc-500 font-mono uppercase">Plain Korean Sentence:</span>
                <p className="font-korean text-zinc-200 text-sm">
                  {productionData.rewrites[activeRewriteIdx].plain_text.split(productionData.rewrites[activeRewriteIdx].underlined).map((chunk: string, idx: number) => (
                    <span key={idx}>
                      {chunk}
                      {idx === 0 && <span className="underline decoration-brand-400 font-black text-brand-400">{productionData.rewrites[activeRewriteIdx].underlined}</span>}
                    </span>
                  ))}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300">
                  Rewrite the underlined segment using the idiom for <span className="text-brand-400">"{productionData.rewrites[activeRewriteIdx].hint}"</span>:
                </label>
                <input
                  type="text"
                  value={rewriteInput}
                  onChange={(e) => setRewriteInput(e.target.value)}
                  placeholder="Type Hangeul idiom conjugation..."
                  className="w-full bg-zinc-900 border border-white/10 p-3 rounded-xl outline-none focus:border-brand-500 text-sm font-korean text-white"
                  disabled={!!rewriteFeedback}
                />
              </div>

              {rewriteFeedback && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${rewriteFeedback.is_correct ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                  <p className="font-black">{rewriteFeedback.is_correct ? "✓ Perfect rewrite!" : `✗ Mismatch. Expected conjugation: ${rewriteFeedback.target_answer}`}</p>
                  <p className="text-zinc-400 leading-normal">{rewriteFeedback.explanation}</p>
                </div>
              )}

              <div className="flex justify-end">
                {!rewriteFeedback ? (
                  <button
                    onClick={handleCheckActivity2B}
                    disabled={!rewriteInput.trim() || submittingRewrite}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {submittingRewrite && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Submit Rewrite</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (activeRewriteIdx < productionData.rewrites.length - 1) {
                        setActiveRewriteIdx(prev => prev + 1);
                        setRewriteInput("");
                        setRewriteFeedback(null);
                      } else {
                        setActivity2SubStep("2C");
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {activeRewriteIdx < productionData.rewrites.length - 1 ? "Next Sentence" : "Proceed to Speak Chat"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2C: Speak / Chat with Idioms */}
          {activity2SubStep === "2C" && (
            <div className="space-y-4 text-left animate-fade-in">
              {!chatStarted ? (
                <div className="space-y-4">
                  <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Set your conversation targets:</span>
                  <p className="text-xs text-zinc-400">Choose 2–3 idioms to try and use naturally in your dialogue with Gwan-Sik:</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {availableIdiomsForTheme.map((idiom) => (
                      <button
                        key={idiom}
                        onClick={() => toggleTargetIdiom(idiom)}
                        className={`p-3 rounded-xl border text-xs font-bold font-korean text-left transition flex items-center justify-between ${
                          targetIdioms.includes(idiom)
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                        }`}
                      >
                        <span>{idiom}</span>
                        {targetIdioms.includes(idiom) && <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleStartAiChat}
                      disabled={targetIdioms.length === 0}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" /> Start AI Chat Room
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase">Targets selected:</span>
                    <div className="flex gap-1 flex-wrap">
                      {targetIdioms.map(ti => {
                        const used = aiEvaluation?.used_idioms?.includes(ti);
                        return (
                          <span 
                            key={ti} 
                            className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                              used 
                                ? "bg-accent-teal/10 border-accent-teal/30 text-accent-teal" 
                                : "bg-zinc-800 border-white/5 text-zinc-400"
                            }`}
                          >
                            {ti} {used ? "✓" : ""}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chat Message Window */}
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
                        <span className="flex items-center gap-1"><Award className="w-4 h-4 text-brand-400" /> Session Feedback Summary</span>
                        <span className="text-brand-400">Naturalness: {aiEvaluation.naturalness_rating}</span>
                      </div>
                      <p className="text-zinc-300 leading-normal">{aiEvaluation.feedback}</p>
                      <p className="text-[10px] text-zinc-500">Idioms successfully used: {aiEvaluation.used_idioms?.join(", ") || "None"}</p>
                    </div>
                  )}

                  {/* Text/Voice inputs */}
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
                          onClick={() => setAiText("발을 동동 구르며 결과를 기다렸습니다.")}
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
                        onClick={handleFinishAiChat}
                        disabled={finishingPractice}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {finishingPractice && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Finish & Grade Chat</span>
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
                  setTargetIdioms([]);
                } else if (activity2SubStep === "2B") {
                  setActivity2SubStep("2A");
                  setRewriteFeedback(null);
                  setRewriteInput("");
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
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-400" />
              <span>Idiom Checkpoint Quiz</span>
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
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center">
          <div className="p-3 bg-accent-teal/10 rounded-full border border-accent-teal/25 w-fit mx-auto text-accent-teal shrink-0">
            <Award className="w-10 h-10 animate-bounce shrink-0" />
          </div>

          <h2 className="text-2xl font-black text-white">Phase 2 Completed!</h2>
          <p className="text-xs text-zinc-400">You have earned the badge & graduation reward:</p>

          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full flex items-center gap-4 text-left">
            <div className="p-2.5 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/25">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white">{quizBadge || "Idiomatic Speaker C1"}</p>
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

          {/* Spaced Review AI session */}
          {!reviewChatStarted ? (
            <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Review target idioms with AI:</span>
              <p className="text-[11px] text-zinc-400">Select idioms you want to review in an interactive dialog room:</p>
              
              <div className="flex flex-wrap gap-1.5">
                {["발을 동동 구르다", "가슴이 미어지다", "스트레스를 풀다", "뼈를 깎는 노력", "물거품이 되다"].map((idiom) => (
                  <button
                    key={idiom}
                    onClick={() => toggleReviewIdiom(idiom)}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold font-korean transition ${
                      reviewSelectedIdioms.includes(idiom)
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                    }`}
                  >
                    {idiom}
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleStartPracticeReview}
                  disabled={reviewSelectedIdioms.length === 0}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  Start AI Review Session
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase">Review room dialogue:</span>
                <span className="text-[9px] text-zinc-400 font-mono">Targets: {reviewSelectedIdioms.join(", ")}</span>
              </div>

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
                  <span className="font-bold text-white block mb-0.5">Tutor Summary Feedback:</span>
                  {practiceFeedback}
                </div>
              )}

              {!practiceFinished ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={practiceText}
                    onChange={(e) => setPracticeText(e.target.value)}
                    placeholder="Type review text..."
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
                      setReviewChatStarted(false);
                      setReviewSelectedIdioms([]);
                      setPracticeMessages([]);
                      setPracticeFinished(false);
                    }}
                    className="text-[10px] text-zinc-500 underline"
                  >
                    Start another review
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
              <span>Graduate Phase 2</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Next: Phase 3 – Nuance in Opinions, Stance & Soft Power</p>
          </div>
        </div>
      )}
    </div>
  );
}
