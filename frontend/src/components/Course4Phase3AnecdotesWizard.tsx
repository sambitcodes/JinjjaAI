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
  MessageSquare
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

interface Course4Phase3AnecdotesWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course4Phase3AnecdotesWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course4Phase3AnecdotesWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 6;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1 states (Reading & Listening)
  const [understandingItems, setUnderstandingItems] = useState<any[]>([]);
  const [undIdx, setUndIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [undChecked, setUndChecked] = useState(false);
  const [undCorrect, setUndCorrect] = useState<boolean | null>(null);

  // Activity 2 states (Anecdote Builder)
  const [selectedStoryType, setSelectedStoryType] = useState("fun_day");
  const [timeExpr, setTimeExpr] = useState("지난 주말에");
  const [placeExpr, setPlaceExpr] = useState("공원에");
  const [whoExpr, setWhoExpr] = useState("친구랑");
  const [events, setEvents] = useState<string[]>([
    "자전거를 탔어요.",
    "김밥을 먹었어요.",
    "이야기를 나눴어요."
  ]);
  const [feelingExpr, setFeelingExpr] = useState("조금 피곤했지만 아주 재미있었어요");

  // Output
  const [builtKo, setBuiltKo] = useState("");
  const [builtEn, setBuiltEn] = useState("");
  const [building, setBuilding] = useState(false);
  const [savedStories, setSavedStories] = useState<any[]>([]);

  // Speaking evaluation states
  const [recording, setRecording] = useState(false);
  const [speakingChecked, setSpeakingChecked] = useState(false);
  const [speakingFeedback, setSpeakingFeedback] = useState("");
  const [speakingScore, setSpeakingScore] = useState<number | null>(null);

  // Quiz states
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Homework check states
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Tutor session states
  const [loadingTutor, setLoadingTutor] = useState(false);
  const [tutorSession, setTutorSession] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/lessons/phases/korean3/3/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/lessons/phases/korean3/3/core-data");
          setCoreData(res);
        } else if (step === 3 && understandingItems.length === 0) {
          const res = await apiJson("/lessons/practice/anecdotes/listening-reading");
          setUnderstandingItems(res.items || []);
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/lessons/quiz/korean3/phase-3/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean3/3/homework");
          setHomeworkItems(res_hw || []);
        }
      } catch (err) {
        console.error("Error loading step data: ", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  const handleCheckUnd = async () => {
    const current = understandingItems[undIdx];
    if (!current) return;
    const activeQ = current.questions[qIdx];
    if (!activeQ || !selectedOpt) return;

    const isCorrect = selectedOpt === activeQ.correct_answer;
    setUndChecked(true);
    setUndCorrect(isCorrect);

    try {
      await apiJson("/lessons/practice/anecdotes/listening-reading/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id + "_" + qIdx,
          option_id: selectedOpt,
          time_taken_ms: 1200
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextQuestionOrDescription = () => {
    const current = understandingItems[undIdx];
    if (!current) return;

    setUndChecked(false);
    setSelectedOpt(null);
    setUndCorrect(null);

    if (qIdx < current.questions.length - 1) {
      setQIdx(qIdx + 1);
    } else {
      setQIdx(0);
      if (undIdx < understandingItems.length - 1) {
        setUndIdx(undIdx + 1);
      } else {
        setUndIdx(0);
      }
    }
  };

  const handleBuildAnecdote = async () => {
    setBuilding(true);
    setSpeakingChecked(false);
    setSpeakingFeedback("");
    setSpeakingScore(null);
    try {
      const res = await apiJson("/lessons/practice/anecdotes/build", {
        method: "POST",
        body: JSON.stringify({
          story_type: selectedStoryType,
          time_expr: timeExpr,
          place_expr: placeExpr,
          who_expr: whoExpr,
          events: events.filter(e => e.trim().length > 0),
          feeling_expr: feelingExpr
        })
      });
      setBuiltKo(res.sentence_ko);
      setBuiltEn(res.sentence_en);
    } catch (err) {
      console.error("Error building anecdote: ", err);
    } finally {
      setBuilding(false);
    }
  };

  const handleSaveAnecdote = async () => {
    if (!builtKo) return;
    try {
      await apiJson("/lessons/users/anecdotes/save", {
        method: "POST",
        body: JSON.stringify({ title: `My Anecdote`, content_ko: builtKo, content_en: builtEn })
      });
      setSavedStories(prev => [...prev, { ko: builtKo, en: builtEn }]);
      alert("Story saved successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartRecording = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      handleCheckSpeaking();
    }, 2000);
  };

  const handleCheckSpeaking = async () => {
    try {
      const res = await apiJson("/lessons/practice/anecdotes/speaking", {
        method: "POST",
        body: JSON.stringify({ target_text: builtKo })
      });
      setSpeakingChecked(true);
      setSpeakingFeedback(res.feedback);
      setSpeakingScore(res.accuracy_score);
    } catch (err) {
      console.error(err);
    }
  };

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
      await apiJson("/lessons/quiz/korean3/phase-3/answer", {
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
        await apiJson("/lessons/quiz/korean3/phase-3/finish", {
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

  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/lessons/phases/korean3/3/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLaunchB1AnecdotesPractice = async () => {
    setLoadingTutor(true);
    setTutorSession(null);
    try {
      const res = await apiJson("/lessons/conversation/b1/anecdotes-practice/start", {
        method: "POST"
      });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

  const updateEventValue = (idx: number, val: string) => {
    const nextEvents = [...events];
    nextEvents[idx] = val;
    setEvents(nextEvents);
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
              <span>{activeLesson?.title || "Experiences & Simple Anecdotes (B1 Core)"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Curated Topic: Storytelling Structure</p>
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
          
          <h2 className="text-4xl font-black text-white">Korean 3.3</h2>
          <h3 className="text-xl font-bold text-brand-400 mt-1">Experiences & Simple Anecdotes</h3>
          
          <p className="text-zinc-300 text-sm leading-relaxed max-w-md mx-auto">
            {metadata?.description || "Describe what you did yesterday and last weekend."}
          </p>

          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-2 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Describe past experiences in 6–8 connected sentences",
                "Use sequence words (first, then, after that, finally) to structure stories",
                "Say how you felt and give simple comments on events"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 30} minutes</p>
            <p><strong>📋 Prerequisites:</strong> {metadata?.prerequisites || "Korean 3.2 – Describing People & Places"}</p>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button 
              onClick={() => setStep(2)}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 3</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
          </div>

          {showOutline && (
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-1.5 animate-fade-in max-w-md mx-auto w-full font-mono">
              <p className="font-extrabold text-white text-center pb-2">Phase Activities Outline</p>
              <p>✓ Activity 1 – Beginning-Middle-End Story Framing Grid</p>
              <p>✓ Activity 2 – Reading/listening narrative comprehension</p>
              <p>✓ Activity 3 – Custom Story builder with sequence flow mapping</p>
              <p>✓ Activity 4 – Grammar check quizzes</p>
            </div>
          )}
        </div>
      )}

      {/* Screen 2: Concept Explanation */}
      {step === 2 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-400" />
              <span>B1 Storytelling Frames</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">B1 Storytelling Goal:</p>
            <p className="italic">
              "At B1, you should be able to organize a story logically with a clear chronological timeline and wrap up with your personal evaluations."
            </p>
          </div>

          {/* Interactive B-M-E Diagram Flow */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-center space-y-1">
              <span className="text-[10px] text-brand-400 font-bold block uppercase tracking-wider">1. Beginning</span>
              <p className="text-xs text-white font-extrabold">{coreData?.story_frames?.beginning || "Time, Place, Who"}</p>
            </div>
            <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-center space-y-1">
              <span className="text-[10px] text-brand-400 font-bold block uppercase tracking-wider">2. Middle</span>
              <p className="text-xs text-white font-extrabold">{coreData?.story_frames?.middle || "Chronological Events"}</p>
            </div>
            <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-center space-y-1">
              <span className="text-[10px] text-brand-400 font-bold block uppercase tracking-wider">3. End</span>
              <p className="text-xs text-white font-extrabold">{coreData?.story_frames?.end || "Result & Feelings"}</p>
            </div>
          </div>

          {/* Sequence Words Grid */}
          <div className="space-y-3">
            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Chaining Connectors:</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {coreData?.sequence_words?.map((word: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-xl border border-white/5 bg-zinc-900/60 text-center space-y-0.5">
                  <span className="font-korean font-bold text-sm text-white">{word.ko}</span>
                  <span className="text-[10px] text-zinc-500 block">{word.en}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Example Anecdote with highlights */}
          {coreData?.example_anecdotes?.[0] && (
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block text-left">Color-Coded Narrative Blueprint:</span>
              <p className="font-korean text-sm leading-relaxed text-zinc-200 text-left">
                지난달에 저는 친구랑 부산으로 여행을 갔어요. <span className="text-blue-400 font-extrabold">먼저</span> 아침에 KTX 열차를 탔어요. <span className="text-blue-400 font-extrabold">그 다음에</span> 부산역 근처 식당에서 맛있는 해물 밀면을 먹었어요. <span className="text-blue-400 font-extrabold">그리고</span> 바다를 구경하고 사진을 많이 찍었어요. <span className="text-blue-400 font-extrabold">마지막으로</span> 저녁에 호텔에 돌아와서 쉬었어요. 조금 <span className="text-emerald-400 font-extrabold">피곤했지만</span> 아주 <span className="text-emerald-400 font-extrabold">행복했어요</span>.
              </p>
              
              <div className="flex gap-4 text-[9px] font-bold border-t border-white/5 pt-2 justify-center">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-400 rounded-sm" /> Chaining Connectors</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm" /> Feelings & Evaluations</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Understanding Narrative Flow */}
      {step === 3 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Activity 1 – Anecdote Analysis</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {understandingItems.length > 0 && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
              
              {/* Anecdote block */}
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl text-center space-y-2">
                <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">B1 Anecdote Text</span>
                <p className="font-korean text-sm leading-relaxed text-white font-extrabold">{understandingItems[undIdx]?.text}</p>
                <div className="flex justify-center pt-1">
                  <button onClick={() => playAudio(understandingItems[undIdx]?.text)} className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg border border-white/5 transition flex items-center gap-1 text-[10px] font-bold">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen</span>
                  </button>
                </div>
              </div>

              {/* Comprehension Questions */}
              <div className="space-y-3">
                <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 text-center text-xs">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono block">Question {qIdx + 1}:</span>
                  <p className="font-bold text-white mt-0.5">{understandingItems[undIdx]?.questions[qIdx]?.question}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
                  {understandingItems[undIdx]?.questions[qIdx]?.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !undChecked && setSelectedOpt(opt)}
                      disabled={undChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                        selectedOpt === opt
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      } ${undChecked && opt === understandingItems[undIdx]?.questions[qIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {undChecked && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 max-w-sm mx-auto text-left animate-fade-in">
                  <p className="font-extrabold text-white mb-1">{undCorrect ? "✓ Correct!" : "✗ Incorrect."}</p>
                  <p>{understandingItems[undIdx]?.questions[qIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!undChecked ? (
                  <button
                    onClick={handleCheckUnd}
                    disabled={!selectedOpt}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestionOrDescription}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next Question
                  </button>
                )}
              </div>

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(2)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 2: Anecdote Builder */}
      {step === 4 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Activity 2 – Anecdote Builder</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
            {/* Story Type Selector */}
            <div className="grid grid-cols-2 gap-2">
              {coreData?.story_types?.map((type: any) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedStoryType(type.id);
                    if (type.id === "trip_visit") {
                      setTimeExpr("지난달에");
                      setPlaceExpr("부산으로");
                      setWhoExpr("친구랑");
                      setEvents([
                        "KTX 열차를 탔어요.",
                        "해물 밀면을 먹었어요.",
                        "바다 구경을 했어요."
                      ]);
                      setFeelingExpr("조금 피곤했지만 아주 행복했어요");
                    } else {
                      setTimeExpr("지난 주말에");
                      setPlaceExpr("공원에");
                      setWhoExpr("동생하고");
                      setEvents([
                        "자전거를 탔어요.",
                        "김밥을 맛있게 먹었어요.",
                        "이야기를 많이 나눴어요."
                      ]);
                      setFeelingExpr("조금 힘들었지만 아주 보람 있었어요");
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition flex flex-col items-center justify-center ${
                    selectedStoryType === type.id 
                      ? "border-brand-500 bg-brand-500/10 text-white" 
                      : "border-white/5 bg-zinc-950 text-zinc-400"
                  }`}
                >
                  <span>{type.name}</span>
                  <span className="text-[9px] font-normal text-zinc-500 block mt-0.5">{type.description}</span>
                </button>
              ))}
            </div>

            {/* Inputs grid */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Time Expression</label>
                <input
                  type="text"
                  value={timeExpr}
                  onChange={(e) => setTimeExpr(e.target.value)}
                  className="w-full bg-zinc-950 p-2 rounded-xl border border-white/5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Place (with particles)</label>
                <input
                  type="text"
                  value={placeExpr}
                  onChange={(e) => setPlaceExpr(e.target.value)}
                  className="w-full bg-zinc-950 p-2 rounded-xl border border-white/5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Who with</label>
                <input
                  type="text"
                  value={whoExpr}
                  onChange={(e) => setWhoExpr(e.target.value)}
                  className="w-full bg-zinc-950 p-2 rounded-xl border border-white/5 text-xs text-white"
                />
              </div>
            </div>

            {/* Ordered Events list */}
            <div className="space-y-2">
              <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Middle Chronological Events (in order):</label>
              {events.map((evt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-bold w-4">#{idx+1}</span>
                  <input
                    type="text"
                    value={evt}
                    onChange={(e) => updateEventValue(idx, e.target.value)}
                    className="w-full bg-zinc-950 p-2 rounded-xl border border-white/5 text-xs text-white"
                  />
                </div>
              ))}
            </div>

            {/* Feeling Expression */}
            <div>
              <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Ending Result / Final Feeling</label>
              <input
                type="text"
                value={feelingExpr}
                onChange={(e) => setFeelingExpr(e.target.value)}
                className="w-full bg-zinc-950 p-2 rounded-xl border border-white/5 text-xs text-white"
              />
            </div>

            <button
              onClick={handleBuildAnecdote}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center"
            >
              Generate Story Flow
            </button>
          </div>

          {/* Generated Result preview */}
          {builtKo && (
            <div className="p-4 bg-zinc-950 rounded-xl border border-brand-500/20 text-center space-y-3 animate-fade-in">
              <div>
                <span className="text-[9px] text-brand-400 uppercase tracking-wider block font-black mb-1">Generated B1 Anecdote:</span>
                <p className="font-korean text-sm text-white font-extrabold leading-relaxed">{builtKo}</p>
                <p className="text-xs text-zinc-400 mt-1">{builtEn}</p>
              </div>

              <div className="flex justify-center gap-2 pt-2">
                <button onClick={() => playAudio(builtKo)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold">
                  <Volume2 className="w-4 h-4" />
                  <span>Listen</span>
                </button>
                <button onClick={handleSaveAnecdote} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold">
                  <Save className="w-4 h-4" />
                  <span>Save Story</span>
                </button>
              </div>

              {/* Speaking practice */}
              <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-white/5 space-y-2 mt-2">
                <span className="text-[9px] text-zinc-500 tracking-wider block font-black text-left">Narration Pronunciation Check:</span>
                <div className="flex justify-between items-center gap-3">
                  <button
                    onClick={handleStartRecording}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      recording 
                        ? "bg-red-500 text-white animate-pulse" 
                        : "bg-brand-500 hover:bg-brand-600 text-white"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>{recording ? "Recording..." : "Hold & Narrate Story"}</span>
                  </button>
                  {speakingChecked && (
                    <div className="text-right">
                      <span className="text-xs font-bold text-accent-teal block">Score: {speakingScore}%</span>
                      <span className="text-[9px] text-zinc-400 block">{speakingFeedback}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(3)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Mini-Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Mini-Quiz */}
      {step === 5 && (
        <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Phase Checkpoint Quiz</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 5 of {totalSteps}</span>
          </div>

          {quizBlueprint.length > 0 && (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>Quiz Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span>Level: B1 Storytelling</span>
              </div>

              <h3 className="text-base font-black text-white text-center leading-relaxed whitespace-pre-line">
                {quizBlueprint[quizIdx]?.question}
              </h3>

              <div className="grid grid-cols-1 gap-2.5 max-w-sm mx-auto">
                {quizBlueprint[quizIdx]?.options?.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                    disabled={quizChecked}
                    className={`p-3.5 rounded-xl border text-left text-xs font-bold transition ${
                      quizSelectedOpt === opt
                        ? "border-brand-500 bg-brand-500/10 text-white"
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
                <button onClick={() => setStep(4)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={!quizSelectedOpt}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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

      {/* Screen 6: Complete Panel */}
      {step === 6 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center max-w-xl mx-auto">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400">
            <Award className="w-10 h-10 animate-bounce" />
          </div>
          
          <div>
            <h2 className="text-2xl font-black text-white font-sans">Korean 3.3 Storytelling Complete! 🇰🇷✨</h2>
            <p className="text-zinc-400 text-xs mt-1">You are fully capable of drafting logical anecdotes and yesterday's events.</p>
          </div>

          {/* Homework checklist */}
          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs space-y-3 font-sans leading-relaxed">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-400 block font-sans">Interactive Homework List:</span>
            <div className="space-y-2">
              {homeworkItems.map((item: any) => {
                const checked = !!completedHomework[item.id];
                return (
                  <label key={item.id} className="flex items-start gap-3 p-2 bg-zinc-950/45 rounded-lg border border-white/[0.03] cursor-pointer hover:bg-zinc-950 transition">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleHomework(item.id, checked)}
                      className="mt-0.5 rounded border-white/10 text-brand-500 focus:ring-0 focus:ring-offset-0 bg-zinc-900"
                    />
                    <span className={`text-zinc-300 font-medium ${checked ? "line-through text-zinc-500" : ""}`}>{item.text}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Gwan-Sik Anecdotes AI Tutor Launcher */}
          <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-400" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Tutor Gwan-Sik Roleplay</span>
                <span className="text-[10px] text-zinc-500 block">Start B1 roleplay dialogue about trip memories</span>
              </div>
            </div>
            {tutorSession ? (
              <div className="bg-zinc-900 p-3.5 rounded-xl border border-brand-500/20 text-left text-xs">
                <span className="text-[9px] font-bold text-brand-400 block mb-1">Gwan-Sik:</span>
                <p className="font-korean text-white leading-relaxed">{tutorSession.opener}</p>
                <div className="mt-3 flex justify-end">
                  <a href={`/conversation/chat?session_id=${tutorSession.session_id}`} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-1.5 px-4 rounded-xl text-[10px] transition cursor-pointer">
                    Join Full Chat Room
                  </a>
                </div>
              </div>
            ) : (
              <button
                onClick={handleLaunchB1AnecdotesPractice}
                disabled={loadingTutor}
                className="w-full bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-brand-400 hover:text-brand-300 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingTutor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Initiate AI Roleplay session"}
              </button>
            )}
          </div>

          <button
            onClick={() => {
              onComplete();
            }}
            className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/20 cursor-pointer"
          >
            <span>Finish Phase 3 & Return to Lessons</span>
            <ChevronRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      )}
    </div>
  );
}
