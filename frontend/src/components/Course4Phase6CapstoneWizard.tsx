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
  Save,
  MessageSquare,
  ThumbsUp,
  HelpCircle,
  Activity,
  Calendar,
  Briefcase,
  MapPin,
  MessageCircle,
  Languages,
  Check,
  Flame,
  ArrowRight,
  Trophy,
  Star
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

interface Course4Phase6CapstoneWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course4Phase6CapstoneWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course4Phase6CapstoneWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 6;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [examplesData, setExamplesData] = useState<any>(null);
  const [guidedData, setGuidedData] = useState<any>(null);

  // Activity 1 states
  const [activity1Step, setActivity1Step] = useState<"1A" | "1B">("1A");
  const [q1Selected, setQ1Selected] = useState<string | null>(null);
  const [q2Selected, setQ2Selected] = useState<string | null>(null);
  const [q3Selected, setQ3Selected] = useState<string | null>(null);
  const [activity1Checked, setActivity1Checked] = useState(false);
  const [activity1Correct, setActivity1Correct] = useState<boolean | null>(null);

  // Activity 2 states (AI Chat)
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [userText, setUserText] = useState("");
  const [sendingTurn, setSendingTurn] = useState(false);
  const [evaluatingSession, setEvaluatingSession] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [recording, setRecording] = useState(false);

  // Chat Scaffolding Hints
  const [showHint, setShowHint] = useState(false);
  const [scaffoldingChips, setScaffoldingChips] = useState<string[]>([
    "제 생각에는...", "왜냐하면...", "그 다음에...", "하지만...", "그리고..."
  ]);

  // Quiz states
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Homework states
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/lessons/phases/korean3/6/metadata");
          setMetadata(res);
        } else if (step === 2 && !examplesData) {
          const res = await apiJson("/lessons/phases/korean3/6/examples");
          setExamplesData(res);
        } else if (step === 3 && !guidedData) {
          const res = await apiJson("/lessons/practice/b1-conversations/guided");
          setGuidedData(res);
        } else if (step === 4 && scenarios.length === 0) {
          // Scenarios are part of the curriculum
          const res = await apiJson("/lessons/phases/korean3/6/metadata");
          // Scenarios will be defined locally or loaded
          setScenarios([
            { id: "daily_recent", name: "Your daily life now + a recent event", icon: "calendar", description: "Talk about what you do these days, share a recent story, and give reasons for your habits.", tags: ["daily life", "story", "opinion"] },
            { id: "hobbies_story", name: "Your hobbies + a story about one hobby", icon: "activity", description: "Discuss your favorite hobbies, recount a memorable hobby experience, and argue why hobbies are important.", tags: ["hobbies", "anecdote", "reasons"] },
            { id: "study_work_opinion", name: "Study/work life + your opinion about it", icon: "briefcase", description: "Describe your work or study routine, tell a story about a busy day, and share your opinion on work-life balance.", tags: ["study", "work", "opinion"] },
            { id: "travel_plans_opinion", name: "Travel/outing + your plans and opinions", icon: "map-pin", description: "Share your favorite travel destinations, recall a memorable trip, and outline your future travel plans with reasons.", tags: ["travel", "plans", "trip"] }
          ]);
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/lessons/quiz/korean3/phase-6/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean3/6/homework");
          setHomeworkItems(res_hw || []);
        }
      } catch (err) {
        console.error("Error loading capstone step: ", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1 Check
  const handleCheckActivity1 = async () => {
    if (!guidedData) return;
    const q1Correct = q1Selected === guidedData.questions[0].correct_answer;
    const q2Correct = q2Selected === guidedData.questions[1].correct_answer;
    
    let isCorrect = q1Correct && q2Correct;
    if (activity1Step === "1B") {
      isCorrect = q3Selected === guidedData.questions[2].correct_answer;
    }

    setActivity1Checked(true);
    setActivity1Correct(isCorrect);

    try {
      await apiJson("/lessons/practice/b1-conversations/guided/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: activity1Step === "1A" ? "guided_analysis_1" : "guided_sentence_1",
          is_correct: isCorrect,
          time_taken_ms: 3000
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextActivity1 = () => {
    if (activity1Step === "1A") {
      setActivity1Step("1B");
      setActivity1Checked(false);
      setActivity1Correct(null);
    } else {
      setStep(4);
    }
  };

  // Activity 2: Chat functions
  const handleStartChat = async (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    setChatMessages([]);
    setEvaluationResult(null);
    try {
      const res = await apiJson("/lessons/conversation/b1/capstone/session/start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: scenarioId, mode })
      });
      setChatSessionId(res.session_id);
      setChatMessages([{ sender: "assistant", text: res.opener }]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTurn = async () => {
    if (!userText.trim() || !chatSessionId) return;
    const userMsg = userText;
    setUserText("");
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setSendingTurn(true);

    try {
      const res = await apiJson(`/lessons/conversation/b1/capstone/session/${chatSessionId}/turn`, {
        method: "POST",
        body: JSON.stringify({ user_text: userMsg })
      });
      setChatMessages(prev => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") {
        playAudio(res.reply_ko);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingTurn(false);
    }
  };

  const handleEndChat = async () => {
    if (!chatSessionId) return;
    setEvaluatingSession(true);
    try {
      const res = await apiJson(`/lessons/conversation/b1/capstone/session/${chatSessionId}/end`, {
        method: "POST"
      });
      setEvaluationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluatingSession(false);
    }
  };

  const handleStartVoiceRecording = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      // Mocking voice transcription for capstone
      setUserText("오늘 날씨가 좋아서 친구와 공원에서 산책했어요. 그리고 커피를 마셨어요.");
    }, 2000);
  };

  // Quiz checks
  const handleCheckQuiz = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current) return;

    const isCorrect = quizSelectedOpt === current.correct_answer;
    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    if (!isCorrect) {
      setQuizMistakes(prev => [...prev, current.id]);
    }

    try {
      await apiJson("/lessons/quiz/korean3/phase-6/answer", {
        method: "POST",
        body: JSON.stringify({
          question_id: current.id,
          answer: quizSelectedOpt || "",
          time_taken_ms: 1500
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
        await apiJson("/lessons/quiz/korean3/phase-6/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setStep(6);
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  // Homework check
  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/lessons/phases/korean3/6/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "calendar": return <Calendar className="w-5 h-5 text-yellow-400" />;
      case "activity": return <Activity className="w-5 h-5 text-yellow-400" />;
      case "briefcase": return <Briefcase className="w-5 h-5 text-yellow-400" />;
      case "map-pin": return <MapPin className="w-5 h-5 text-yellow-400" />;
      default: return <MessageSquare className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="flex-grow flex flex-col justify-between">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "B1 Conversations & Stories (Capstone)"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Curated Topic: Capstone Dialogues & Storytelling</p>
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
          <div className="relative mx-auto w-fit">
            <div className="p-4 bg-yellow-500/10 rounded-full border border-yellow-500/25 text-yellow-400">
              <Trophy className="w-10 h-10" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-brand-500 rounded-full border-2 border-zinc-950">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          </div>
          
          <h2 className="text-4xl font-black text-white font-sans">Korean 3.6</h2>
          <h3 className="text-xl font-bold text-yellow-400 mt-1">B1 Conversations & Stories (Capstone)</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Have real conversations and tell stories about your life."}
          </p>

          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Talk for longer about your daily life, experiences, and plans",
                "Tell short stories and give your opinions with reasons",
                "Practice handling everyday situations in Korean at B1 level"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 40} minutes</p>
            <p><strong>📋 Prerequisites:</strong> {metadata?.prerequisites || "Korean 3.5 – Longer Stories & Paragraphs"}</p>
          </div>

          {/* Mode Selector */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Conversation Mode</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("text")}
                className={`p-3.5 rounded-xl border text-xs font-bold transition ${
                  mode === "text" 
                    ? "border-yellow-500 bg-yellow-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                Text Conversations
              </button>
              <button
                onClick={() => setMode("voice")}
                className={`p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  mode === "voice" 
                    ? "border-yellow-500 bg-yellow-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice + Text</span>
              </button>
            </div>
          </div>


          <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => setStep(2)}
              className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3.5 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/20"
            >
              <span>Start Phase 6</span>
              <ChevronRight className="w-4 h-4 text-zinc-950" />
            </button>
            
          </div>

          {showOutline && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-2 animate-fade-in max-w-2xl mx-auto w-full font-mono">
              <p className="font-extrabold text-white text-center pb-2">Phase Activities Outline</p>
              <p>✓ Activity 1 – Guided Conversational Analysis & missing lines</p>
              <p>✓ Activity 2 – Live AI Conversation Tutor (Text/Voice) Simulation</p>
              <p>✓ Activity 3 – Conversational coherence checkpoint quiz</p>
              <p>✓ Activity 4 – Homework & course graduation checklist</p>
            </div>
          )}
        </div>
      )}

      {/* Screen 2: Concept Explanation */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-yellow-400" />
              <span>What B1 Conversations Look Like</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/15 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">B1 Conversation Goal:</p>
            <p className="italic">
              "At B1, you should be able to talk about familiar topics (work, school, leisure), tell short stories about your experiences, and explain your opinions with simple reasons."
            </p>
          </div>

          {/* Conversation Blueprint Card */}
          <div className="space-y-2 text-left">
            <label className="text-[10px] text-zinc-500 uppercase tracking-widest block font-black">B1 Conversation Blueprint (10–15 turns):</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5">
                <span className="text-yellow-400 font-bold text-xs block mb-1">1. Warm-up & Routine</span>
                <p className="text-[10px] text-zinc-400">Greeting, small talk, and daily schedule updates.</p>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5">
                <span className="text-accent-teal font-bold text-xs block mb-1">2. Experience Story</span>
                <p className="text-[10px] text-zinc-400">Chronological detail story about a recent outing or event.</p>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5">
                <span className="text-amber-400 font-bold text-xs block mb-1">3. Opinion & Reasons</span>
                <p className="text-[10px] text-zinc-400">State what you think and back it up with reason clauses (-아서, 왜냐하면).</p>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5">
                <span className="text-purple-400 font-bold text-xs block mb-1">4. Closing Plans</span>
                <p className="text-[10px] text-zinc-400">Conclude with near-future intentions and friendly warm-down.</p>
              </div>
            </div>
          </div>

          {/* Example Dialogue Segment */}
          {examplesData?.example_dialogue && (
            <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 space-y-2 text-xs text-left max-h-[200px] overflow-y-auto custom-scrollbar">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Dialogue Excerpt: {examplesData.example_dialogue.title}</span>
              <div className="space-y-2 font-korean text-[11px]">
                {examplesData.example_dialogue.turns.slice(0, 4).map((t: any, i: number) => (
                  <div key={i} className="flex gap-2">
                    <span className="font-extrabold text-yellow-400 shrink-0">{t.speaker}:</span>
                    <div className="flex-grow">
                      <p className="text-zinc-200">{t.ko}</p>
                      <p className="text-zinc-500 text-[10px] font-sans">{t.en}</p>
                      <span className="text-[8px] bg-zinc-950 px-1 py-0.5 rounded text-zinc-400 inline-block mt-0.5 font-sans font-mono uppercase">{t.annotation}</span>
                    </div>
                    <button onClick={() => playAudio(t.ko)} className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white shrink-0 h-fit">
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Guided Dialogue Analysis */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span>{activity1Step === "1A" ? "Activity 1A – Conversation Analysis" : "Activity 1B – Choose Next Line"}</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {guidedData && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left max-h-[380px] overflow-y-auto custom-scrollbar">
              
              {/* Target dialogue block */}
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl space-y-3">
                <span className="text-[9px] text-yellow-400 font-black uppercase tracking-wider block">Dialogue Context</span>
                <div className="space-y-2.5 text-[11px] font-korean">
                  {guidedData.dialogue.map((t: any, i: number) => {
                    const isHidden = t.ko === "[HIDDEN_LINE]";
                    return (
                      <div key={i} className={`flex gap-2 p-1.5 rounded ${activity1Step === "1A" && i === 3 ? "bg-accent-teal/10 border border-accent-teal/20" : ""}`}>
                        <span className="font-extrabold text-yellow-400 shrink-0">{t.speaker}:</span>
                        <div className="flex-grow">
                          {isHidden ? (
                            <span className="text-yellow-400 italic font-mono font-bold">[Choose next reply below]</span>
                          ) : (
                            <>
                              <p className="text-zinc-200">{t.ko}</p>
                              <p className="text-zinc-500 text-[10px] font-sans">{t.en}</p>
                            </>
                          )}
                        </div>
                        {!isHidden && (
                          <button onClick={() => playAudio(t.ko)} className="p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white shrink-0 h-fit">
                            <Volume2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {activity1Step === "1A" ? (
                <>
                  {/* Task 1 */}
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400 font-bold">1. What are sujin and yeongho mainly discussing?</p>
                    <div className="flex flex-col gap-1.5">
                      {guidedData.questions[0].options.map((opt: string) => (
                        <button
                          key={opt}
                          onClick={() => !activity1Checked && setQ1Selected(opt)}
                          disabled={activity1Checked}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition ${
                            q1Selected === opt
                              ? "border-yellow-500 bg-yellow-500/10 text-white"
                              : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Task 2 */}
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400 font-bold">2. Which turn corresponds to Yeongho's past experience story?</p>
                    <div className="flex flex-col gap-1.5">
                      {guidedData.questions[1].options.map((opt: string) => (
                        <button
                          key={opt}
                          onClick={() => !activity1Checked && setQ2Selected(opt)}
                          disabled={activity1Checked}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition ${
                            q2Selected === opt
                              ? "border-yellow-500 bg-yellow-500/10 text-white"
                              : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Task 3: Choose best next line */
                <div className="space-y-2">
                  <p className="text-xs text-zinc-400 font-bold">Fill in the missing line for 영호 (Turn 6):</p>
                  <div className="flex flex-col gap-1.5">
                    {guidedData.questions[2].options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !activity1Checked && setQ3Selected(opt)}
                        disabled={activity1Checked}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                          q3Selected === opt
                            ? "border-yellow-500 bg-yellow-500/10 text-white"
                            : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activity1Checked && (
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 max-w-sm mx-auto text-left animate-fade-in space-y-1">
                  <p className="font-extrabold text-white">{activity1Correct ? "✓ Excellent analysis!" : "✗ Some responses were incorrect."}</p>
                  <p>{activity1Step === "1A" ? guidedData.questions[0].explanation : guidedData.questions[2].explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!activity1Checked ? (
                  <button
                    onClick={handleCheckActivity1}
                    disabled={activity1Step === "1A" ? (!q1Selected || !q2Selected) : !q3Selected}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextActivity1}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {activity1Step === "1A" ? "Move to Activity 1B" : "Go to Scenario Chat"}
                  </button>
                )}
              </div>

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(2)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 2: Semi-Free Conversations */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-yellow-400" />
              <span>Activity 2 – B1 Scenario Roleplay</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          {!selectedScenario ? (
            /* Scenario Selection */
            <div className="space-y-4 text-left">
              <p className="text-xs text-zinc-400">Select one multi-topic intermediate B1 scenario to chat with Gwan-Sik:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scenarios.map((scen) => (
                  <button
                    key={scen.id}
                    onClick={() => handleStartChat(scen.id)}
                    className="p-4 rounded-2xl border border-white/5 bg-zinc-950 hover:bg-zinc-900/60 text-left transition flex flex-col justify-between h-36"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {renderIcon(scen.icon)}
                        <span className="font-bold text-xs text-white block">{scen.name}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-normal">{scen.description}</p>
                    </div>
                    <div className="flex gap-1.5 pt-2 flex-wrap">
                      {scen.tags.map((tag: string) => (
                        <span key={tag} className="text-[8px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded font-mono border border-white/[0.03]">{tag}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Interface */
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-yellow-400">Active Room: {scenarios.find(s => s.id === selectedScenario)?.name}</span>
                <button 
                  onClick={() => setSelectedScenario(null)}
                  className="text-[10px] text-zinc-500 hover:text-white underline cursor-pointer"
                >
                  Change Scenario
                </button>
              </div>

              {/* Chat Log */}
              <div className="bg-zinc-950 rounded-2xl border border-white/5 p-4 h-64 overflow-y-auto space-y-3 custom-scrollbar">
                {chatMessages.map((msg, idx) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
                      <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                        isUser 
                          ? "bg-yellow-500/10 text-white border border-yellow-500/20 rounded-tr-none" 
                          : "bg-zinc-900 text-zinc-300 rounded-tl-none border border-white/5"
                      }`}>
                        <p className={!isUser ? "font-korean font-bold" : ""}>{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
                {sendingTurn && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-900 p-3 rounded-2xl border border-white/5 flex gap-1 items-center">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-400" />
                      <span className="text-[10px] text-zinc-500">Gwan-Sik is typing...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Scaffolding suggested chips */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[9px] text-zinc-500">
                  <span>Suggested chips (click to insert):</span>
                  <button onClick={() => setShowHint(!showHint)} className="text-yellow-400 hover:underline">
                    {showHint ? "Hide Hint" : "Get Hint"}
                  </button>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {scaffoldingChips.map(chip => (
                    <button 
                      key={chip}
                      onClick={() => setUserText(prev => prev + " " + chip)}
                      className="px-2 py-1 bg-zinc-900 border border-white/5 hover:border-yellow-500/35 text-[10px] text-zinc-300 rounded-lg font-korean transition cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                {showHint && (
                  <div className="p-2.5 bg-zinc-900/60 rounded-xl border border-yellow-500/15 text-[10px] text-zinc-400 italic">
                    💡 Sample B1 response structure: "제 생각에는 취미가 필요해요. 왜냐하면 스트레스가 풀리기 때문이에요." (I think hobbies are necessary. Because they release stress.)
                  </div>
                )}
              </div>

              {/* Chat Form */}
              {!evaluationResult ? (
                <div className="flex gap-2">
                  {mode === "voice" && (
                    <button 
                      onClick={handleStartVoiceRecording}
                      className={`p-3 rounded-xl border transition ${recording ? "bg-red-500 text-white border-red-500 animate-pulse" : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white"}`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}
                  <input
                    type="text"
                    value={userText}
                    onChange={(e) => setUserText(e.target.value)}
                    placeholder="Type your Korean response..."
                    onKeyDown={(e) => e.key === "Enter" && handleSendTurn()}
                    className="flex-grow bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs text-white outline-none focus:border-yellow-500 font-korean font-sans"
                  />
                  <button
                    onClick={handleSendTurn}
                    disabled={sendingTurn || !userText.trim()}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Send</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-950" />
                  </button>
                  <button 
                    onClick={handleEndChat}
                    className="px-3 bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-300 text-[10px] font-bold rounded-xl transition"
                  >
                    End & Evaluate
                  </button>
                </div>
              ) : (
                /* Dialogue Assessment Dashboard */
                <div className="p-4 bg-zinc-900 rounded-2xl border border-yellow-500/20 space-y-3 animate-fade-in text-xs max-h-[200px] overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="font-extrabold text-white">B1 Conversation Diagnostics</span>
                    <span className="font-black text-yellow-400 text-base">Score: {evaluationResult.score}%</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed italic">{evaluationResult.overall_feedback}</p>
                  
                  {evaluationResult.corrections && evaluationResult.corrections.length > 0 && (
                    <div className="space-y-1 pt-2">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Suggested Sentence Corrections:</span>
                      {evaluationResult.corrections.map((corr: string, i: number) => (
                        <div key={i} className="p-2 bg-zinc-950 rounded border border-white/5 text-[10px] text-yellow-400 font-korean">{corr}</div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={() => setStep(5)}
                      className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold transition"
                    >
                      Proceed to Quiz
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Mini-Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Mini-Quiz */}
      {step === 5 && (
        <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span>Phase Checkpoint Quiz</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 5 of {totalSteps}</span>
          </div>

          {quizBlueprint.length > 0 && (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>Quiz Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span>Level: B1 Conversations</span>
              </div>

              <h3 className="text-sm font-black text-white text-center leading-relaxed whitespace-pre-line">
                {quizBlueprint[quizIdx]?.question}
              </h3>

              <div className="grid grid-cols-1 gap-2.5 max-w-sm mx-auto">
                {quizBlueprint[quizIdx]?.options?.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                    disabled={quizChecked}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                      quizSelectedOpt === opt
                        ? "border-yellow-500 bg-yellow-500/10 text-white"
                        : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                    } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10 text-white" : ""}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {quizChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                  quizCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal animate-fade-in" : "bg-red-500/5 border-red-500/10 text-red-400 animate-fade-in"
                }`}>
                  <p className="font-extrabold">{quizCorrect ? "✓ Correct! Brilliant." : "✗ Incorrect."}</p>
                  <p>{quizBlueprint[quizIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button onClick={() => setStep(4)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={!quizSelectedOpt}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {finishingQuiz ? <Loader2 className="w-4 h-4 animate-spin text-zinc-950" /> : (quizIdx < quizBlueprint.length - 1 ? "Next Item" : "See Final Score")}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 6: Complete Panel / Capstone Complete */}
      {step === 6 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center max-w-xl mx-auto">
          <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/25 w-fit mx-auto text-yellow-400 animate-bounce">
            <Trophy className="w-10 h-10" />
          </div>
          
          <div>
            <h2 className="text-2xl font-black text-white font-sans">Korean 3.6 Capstone Complete! 🇰🇷🎓</h2>
            <p className="text-zinc-400 text-xs mt-1">You have completed all requirements for intermediate B1 conversation & story linking.</p>
          </div>

          {/* Stats card */}
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <div className="bg-zinc-950/60 p-3 rounded-xl border border-white/5">
              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wide block">Dialogue Time</span>
              <span className="text-base font-black text-accent-teal">15+ Mins</span>
            </div>
            <div className="bg-zinc-950/60 p-3 rounded-xl border border-white/5">
              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wide block">Stories Created</span>
              <span className="text-base font-black text-yellow-400">8 Stories</span>
            </div>
          </div>

          {/* Homework checklist */}
          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs space-y-3 font-sans leading-relaxed">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 block font-sans">Capstone Interactive Assignment:</span>
              <span className="text-[8px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 rounded px-1.5 py-0.5 uppercase tracking-wide font-black">B1 Capstone</span>
            </div>
            <div className="space-y-2">
              {homeworkItems.map((item: any) => {
                const checked = !!completedHomework[item.id];
                return (
                  <label key={item.id} className="flex items-start gap-3 p-2 bg-zinc-950/45 rounded-lg border border-white/[0.03] cursor-pointer hover:bg-zinc-950 transition">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleHomework(item.id, checked)}
                      className="mt-0.5 rounded border-white/10 text-yellow-500 focus:ring-0 focus:ring-offset-0 bg-zinc-900"
                    />
                    <span className={`text-zinc-300 font-medium ${checked ? "line-through text-zinc-500" : ""}`}>{item.text}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Full Capstone Simulation buttons */}
          <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-yellow-400" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Full Capstone Dialogue Simulation</span>
                <span className="text-[10px] text-zinc-500 block">Initiate a stateful full-story assessment simulation</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  alert("Initiating Full Capstone: Hobbies & Opinions");
                  handleStartChat("hobbies_story");
                  setStep(4);
                }}
                className="w-1/2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[11px] text-zinc-300 font-bold py-2 rounded-xl transition"
              >
                Hobbies & Opinions
              </button>
              <button 
                onClick={() => {
                  alert("Initiating Full Capstone: Daily Life & Story");
                  handleStartChat("daily_recent");
                  setStep(4);
                }}
                className="w-1/2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[11px] text-zinc-300 font-bold py-2 rounded-xl transition"
              >
                Daily Life & Story
              </button>
            </div>
          </div>

          {/* Completion pathway link */}
          <div className="p-4 bg-yellow-500/5 rounded-2xl border border-yellow-500/10 text-center">
            <span className="text-xs font-bold text-white block mb-1">🎉 Level 4: Building Sentences & Stories Completed!</span>
            <p className="text-[10px] text-zinc-400">Continue to Level 5: Korean 4 (B1→B2 Upper Intermediate), or review any phase to refine your storytelling skills.</p>
          </div>

          <button
            onClick={() => {
              onComplete();
            }}
            className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-yellow-500/20 cursor-pointer w-full max-w-xs"
          >
            <span>Finish Course 4 Capstone & Return</span>
            <ChevronRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      )}
    </div>
  );
}
