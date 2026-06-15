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
  ThumbsDown,
  Laptop,
  MapPin,
  Briefcase,
  Smartphone,
  HelpCircle
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

interface Course4Phase4OpinionsWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course4Phase4OpinionsWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course4Phase4OpinionsWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 6;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1 states (Recognize Opinions & Reasons)
  const [recognitionItems, setRecognitionItems] = useState<any[]>([]);
  const [recIdx, setRecIdx] = useState(0);
  const [selectedStanceOpt, setSelectedStanceOpt] = useState<string | null>(null);
  const [recChecked, setRecChecked] = useState(false);
  const [recCorrect, setRecCorrect] = useState<boolean | null>(null);

  // Activity 2 states (Opinions Builder)
  const [builderTopics, setBuilderTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("online_study");
  const [selectedStance, setSelectedStance] = useState("like");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [stanceOptions, setStanceOptions] = useState<any>({});
  const [reasonPhrases, setReasonPhrases] = useState<any>({});

  // Output
  const [builtKo, setBuiltKo] = useState("");
  const [builtEn, setBuiltEn] = useState("");
  const [building, setBuilding] = useState(false);
  const [isParagraph, setIsParagraph] = useState(false);
  const [savedOpinions, setSavedOpinions] = useState<any[]>([]);

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
          const res = await apiJson("/lessons/phases/korean3/4/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/lessons/phases/korean3/4/core-data");
          setCoreData(res);
        } else if (step === 3 && recognitionItems.length === 0) {
          const res = await apiJson("/lessons/practice/opinions/recognition");
          setRecognitionItems(res.items || []);
        } else if (step === 4 && builderTopics.length === 0) {
          const res = await apiJson("/lessons/practice/opinions/templates");
          setBuilderTopics(res.topics || []);
          setStanceOptions(res.stance_options || {});
          setReasonPhrases(res.reason_phrases || {});
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/lessons/quiz/korean3/phase-4/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean3/4/homework");
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

  const handleCheckRec = async (choice: string) => {
    const current = recognitionItems[recIdx];
    if (!current) return;

    let isCorrect = false;
    if (current.type === "opinion_fact") {
      const isChoiceOpinion = choice === "opinion";
      isCorrect = isChoiceOpinion === current.is_opinion;
    } else {
      isCorrect = choice === "reason";
    }

    setSelectedStanceOpt(choice);
    setRecChecked(true);
    setRecCorrect(isCorrect);

    try {
      await apiJson("/lessons/practice/opinions/recognition/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          option_id: choice,
          time_taken_ms: 1000
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextRec = () => {
    setRecChecked(false);
    setSelectedStanceOpt(null);
    setRecCorrect(null);

    if (recIdx < recognitionItems.length - 1) {
      setRecIdx(recIdx + 1);
    } else {
      setRecIdx(0);
    }
  };

  const toggleReasonPhrase = (koPhrase: string) => {
    if (selectedReasons.includes(koPhrase)) {
      setSelectedReasons(selectedReasons.filter(r => r !== koPhrase));
    } else {
      if (selectedReasons.length < 2) {
        setSelectedReasons([...selectedReasons, koPhrase]);
      } else {
        setSelectedReasons([selectedReasons[1], koPhrase]);
      }
    }
  };

  const handleBuildOpinion = async (makeParagraph: boolean) => {
    setBuilding(true);
    setSpeakingChecked(false);
    setSpeakingFeedback("");
    setSpeakingScore(null);
    setIsParagraph(makeParagraph);
    const endpoint = makeParagraph ? "/lessons/practice/opinions/build-paragraph" : "/lessons/practice/opinions/build-sentence";
    try {
      const res = await apiJson(endpoint, {
        method: "POST",
        body: JSON.stringify({
          topic: selectedTopic,
          stance: selectedStance,
          reasons: selectedReasons
        })
      });
      setBuiltKo(res.sentence_ko);
      setBuiltEn(res.sentence_en);
    } catch (err) {
      console.error(err);
    } finally {
      setBuilding(false);
    }
  };

  const handleSaveOpinion = async () => {
    if (!builtKo) return;
    try {
      await apiJson("/lessons/users/opinions/save", {
        method: "POST",
        body: JSON.stringify({ title: `My Opinion on ${selectedTopic}`, content_ko: builtKo, content_en: builtEn })
      });
      setSavedOpinions(prev => [...prev, { ko: builtKo, en: builtEn }]);
      alert("Opinion saved successfully!");
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
      const res = await apiJson("/lessons/practice/opinions/speaking", {
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
      await apiJson("/lessons/quiz/korean3/phase-4/answer", {
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
        await apiJson("/lessons/quiz/korean3/phase-4/finish", {
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
      await apiJson("/lessons/phases/korean3/4/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLaunchB1OpinionsPractice = async () => {
    setLoadingTutor(true);
    setTutorSession(null);
    try {
      const res = await apiJson("/lessons/conversation/b1/opinions-practice/start", {
        method: "POST"
      });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

  const renderTopicIcon = (iconName: string) => {
    switch(iconName) {
      case "laptop": return <Laptop className="w-4 h-4 text-brand-400" />;
      case "map-pin": return <MapPin className="w-4 h-4 text-brand-400" />;
      case "briefcase": return <Briefcase className="w-4 h-4 text-brand-400" />;
      case "smartphone": return <Smartphone className="w-4 h-4 text-brand-400" />;
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
              <span>{activeLesson?.title || "Opinions & Simple Arguments (B1 Core)"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Curated Topic: Opinion Formations</p>
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
          
          <h2 className="text-5xl font-black text-white tracking-tight">Korean 3.4</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Opinions & Simple Arguments</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Say what you think and give short reasons."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Express likes/dislikes and simple opinions about everyday topics",
                "Use 'I think...' patterns with reasons and contrasts",
                "Respond in simple ways when you agree or disagree"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 30} minutes</p>
            <p><strong>📋 Prerequisites:</strong> {metadata?.prerequisites || "Korean 3.3 – Experiences & Simple Anecdotes"}</p>
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => setStep(2)}
              className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 4</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
          </div>

          {showOutline && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-2 animate-fade-in max-w-2xl mx-auto w-full font-mono">
              <p className="font-extrabold text-white text-center pb-2">Phase Activities Outline</p>
              <p>✓ Activity 1 – Opinion Patterns & Agreement Indicators</p>
              <p>✓ Activity 2 – Opinion vs Fact Comprehension drills</p>
              <p>✓ Activity 3 – Custom Opinion Builder with reason appends</p>
              <p>✓ Activity 4 – Grammar check quizzes</p>
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
              <span>Opinion Templates & Attitudes</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">B1 Opinion Goal:</p>
            <p className="italic">
              "At B1, you should be able to say what you think and briefly explain why about familiar topics like school, work, hobbies, and daily life."
            </p>
          </div>

          {/* Opinion patterns */}
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 uppercase tracking-widest block text-left font-black">Core Opinion Patterns:</label>
            <div className="grid grid-cols-2 gap-2">
              {coreData?.opinion_patterns?.map((pattern: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-xl border border-white/5 bg-zinc-900/60 text-left space-y-1">
                  <span className="font-korean font-bold text-xs text-white block">{pattern.ko}</span>
                  <span className="text-[9px] text-brand-400 block font-semibold">{pattern.en}</span>
                  <span className="text-[8px] text-zinc-500 font-mono block">{pattern.rom}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agree / Disagree response cards */}
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 uppercase tracking-widest block text-left font-black">Agreeing & Disagreeing Simply:</label>
            <div className="grid grid-cols-2 gap-2">
              {coreData?.agree_disagree_patterns?.map((pat: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-xl border border-white/5 bg-zinc-900/60 text-left space-y-1">
                  <span className="font-korean font-bold text-xs text-white block">{pat.ko}</span>
                  <span className="text-[9px] text-accent-teal block font-semibold">{pat.en}</span>
                  <span className="text-[8px] text-zinc-500 font-mono block">{pat.rom}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Ideas */}
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block text-left">Typical B1 Opinion Topics:</span>
            <div className="grid grid-cols-4 gap-2">
              {coreData?.topic_ideas?.map((t: any) => (
                <div key={t.id} className="p-2 bg-zinc-950 rounded-lg border border-white/[0.03] text-center flex flex-col items-center gap-1.5 justify-center">
                  {renderTopicIcon(t.icon)}
                  <span className="text-[9px] font-bold text-zinc-300 block leading-tight">{t.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Recognize Opinions & Reasons */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Argument Analysis</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {recognitionItems.length > 0 && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
              
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl text-center space-y-2">
                <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Target Statement</span>
                <p className="font-korean text-sm leading-relaxed text-white font-extrabold">{recognitionItems[recIdx]?.text}</p>
                <p className="text-xs text-zinc-400 italic">{recognitionItems[recIdx]?.en}</p>
              </div>

              {recognitionItems[recIdx]?.type === "opinion_fact" ? (
                <div className="space-y-3">
                  <p className="text-xs text-center text-zinc-400">Is this statement an opinion or a fact?</p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => !recChecked && handleCheckRec("opinion")}
                      disabled={recChecked}
                      className={`px-5 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                        selectedStanceOpt === "opinion"
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Opinion
                    </button>
                    <button
                      onClick={() => !recChecked && handleCheckRec("fact")}
                      disabled={recChecked}
                      className={`px-5 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                        selectedStanceOpt === "fact"
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      }`}
                    >
                      <HelpCircle className="w-4 h-4" />
                      Fact
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-center text-zinc-400">Identify the function of the second clause:</p>
                  <div className="flex flex-col gap-2 max-w-xs mx-auto">
                    <button
                      onClick={() => !recChecked && handleCheckRec("reason")}
                      disabled={recChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                        selectedStanceOpt === "reason"
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300"
                      }`}
                    >
                      It gives a reason ("because...")
                    </button>
                    <button
                      onClick={() => !recChecked && handleCheckRec("contrast")}
                      disabled={recChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                        selectedStanceOpt === "contrast"
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300"
                      }`}
                    >
                      It gives a contrast ("but...")
                    </button>
                  </div>
                </div>
              )}

              {recChecked && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 max-w-sm mx-auto text-left animate-fade-in">
                  <p className="font-extrabold text-white mb-1">{recCorrect ? "✓ Correct Choice!" : "✗ Incorrect Choice."}</p>
                  <p>{recognitionItems[recIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {recChecked && (
                  <button
                    onClick={handleNextRec}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next Question
                  </button>
                )}
              </div>

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(2)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 2: Express Your Opinions with Reasons */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Opinion Builder</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
            {/* Step 1: Choose Topic */}
            <div>
              <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1.5">Step 1: Choose Topic</label>
              <div className="grid grid-cols-2 gap-2">
                {builderTopics.map((topic: any) => (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSelectedTopic(topic.id);
                      setSelectedReasons([]);
                      setBuiltKo("");
                      setBuiltEn("");
                    }}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition flex items-center gap-2 justify-center ${
                      selectedTopic === topic.id 
                        ? "border-brand-500 bg-brand-500/10 text-white" 
                        : "border-white/5 bg-zinc-950 text-zinc-400"
                    }`}
                  >
                    {renderTopicIcon(topic.icon)}
                    <span>{topic.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Choose Stance */}
            <div>
              <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1.5">Step 2: Choose Stance</label>
              <div className="flex gap-2">
                {stanceOptions[selectedTopic]?.map((stance: any) => (
                  <button
                    key={stance.id}
                    onClick={() => {
                      setSelectedStance(stance.id);
                      setBuiltKo("");
                      setBuiltEn("");
                    }}
                    className={`w-full py-2 rounded-lg border text-xs font-semibold text-center transition ${
                      selectedStance === stance.id
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-950 text-zinc-400"
                    }`}
                  >
                    {stance.ko} ({stance.en})
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Choose Reason */}
            <div>
              <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1.5">Step 3: Choose Reasons (Select 1 or 2)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {reasonPhrases[selectedTopic]?.map((phrase: any, idx: number) => {
                  const isChecked = selectedReasons.includes(phrase.ko);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleReasonPhrase(phrase.ko)}
                      className={`p-2 rounded-lg border text-[11px] font-semibold text-left transition ${
                        isChecked
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-400"
                      }`}
                    >
                      <span className="block font-korean">{phrase.ko}</span>
                      <span className="text-[9px] text-zinc-500 font-normal">{phrase.en}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions to build sentence or paragraph */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleBuildOpinion(false)}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer text-center"
              >
                Build Opinion Sentence
              </button>
              <button
                onClick={() => handleBuildOpinion(true)}
                className="bg-gradient-to-r from-brand-500 to-accent-purple text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer text-center"
              >
                Build Paragraph Flow
              </button>
            </div>
          </div>

          {/* Generated Result preview */}
          {builtKo && (
            <div className="p-4 bg-zinc-950 rounded-xl border border-brand-500/20 text-center space-y-3 animate-fade-in">
              <div>
                <span className="text-[9px] text-brand-400 uppercase tracking-wider block font-black mb-1">Generated B1 Argument:</span>
                <p className="font-korean text-sm text-white font-extrabold leading-relaxed">{builtKo}</p>
                <p className="text-xs text-zinc-400 mt-1">{builtEn}</p>
              </div>

              <div className="flex justify-center gap-2 pt-2">
                <button onClick={() => playAudio(builtKo)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold">
                  <Volume2 className="w-4 h-4" />
                  <span>Listen</span>
                </button>
                <button onClick={handleSaveOpinion} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold">
                  <Save className="w-4 h-4" />
                  <span>Save Argument</span>
                </button>
              </div>

              {/* Speaking practice */}
              <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-white/5 space-y-2 mt-2">
                <span className="text-[9px] text-zinc-500 tracking-wider block font-black text-left">Pronunciation Practice:</span>
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
                    <span>{recording ? "Recording..." : "Read Argument Aloud"}</span>
                  </button>
                  {speakingChecked && (
                    <div className="text-right">
                      <span className="text-xs font-bold text-accent-teal block">Accuracy: {speakingScore}%</span>
                      <span className="text-[9px] text-zinc-400 block">{speakingFeedback}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Mini-Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Mini-Quiz */}
      {step === 5 && (
        <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Phase Checkpoint Quiz</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 5 of {totalSteps}</span>
          </div>

          {quizBlueprint.length > 0 && (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>Quiz Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span>Level: B1 Arguments</span>
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
                <button onClick={() => setStep(4)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
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
            <h2 className="text-2xl font-black text-white font-sans">Korean 3.4 Opinions Complete! 🇰🇷✨</h2>
            <p className="text-zinc-400 text-xs mt-1">You can now state simple opinions and reasons at a solid B1 level.</p>
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

          {/* Gwan-Sik Opinions AI Tutor Launcher */}
          <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-brand-400" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Tutor Gwan-Sik Roleplay</span>
                <span className="text-[10px] text-zinc-500 block">Start B1 roleplay dialogue about opinions and reasons</span>
              </div>
            </div>
            {tutorSession ? (
              <div className="bg-zinc-900 p-3.5 rounded-xl border border-brand-500/20 text-left text-xs animate-fade-in">
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
                onClick={handleLaunchB1OpinionsPractice}
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
            <span>Finish Phase 4 & Return to Lessons</span>
            <ChevronRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      )}
    </div>
  );
}
