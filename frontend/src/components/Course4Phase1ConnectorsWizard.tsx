"use client";

import { useEffect, useState, useRef } from "react";
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
  MicOff,
  Check,
  ArrowRight,
  Info,
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

interface Course4Phase1ConnectorsWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course4Phase1ConnectorsWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course4Phase1ConnectorsWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 6;

  // DB Data loaded
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Concept Explanation Flip States
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  // Activity 1A states (Choose Connector)
  const [recognitionItems, setRecognitionItems] = useState<any[]>([]);
  const [recIdx, setRecIdx] = useState(0);
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [recChecked, setRecChecked] = useState(false);
  const [recCorrect, setRecCorrect] = useState<boolean | null>(null);

  // Activity 1B states (Relationship Type Classifier)
  const [relIdx, setRelIdx] = useState(0);
  const [selectedRel, setSelectedRel] = useState<string | null>(null);
  const [relChecked, setRelChecked] = useState(false);
  const [relCorrect, setRelCorrect] = useState<boolean | null>(null);

  // Activity 2A states (Sentence Expansion)
  const [expansionTemplates, setExpansionTemplates] = useState<any>(null);
  const [selectedBaseId, setSelectedBaseId] = useState<string>("base_1");
  const [activeTab, setActiveTab] = useState<"but" | "because" | "so">("but");
  const [selectedTilePhrase, setSelectedTilePhrase] = useState<string | null>(null);
  const [expandedKo, setExpandedKo] = useState("");
  const [expandedEn, setExpandedEn] = useState("");
  const [isExpanding, setIsExpanding] = useState(false);
  
  // Speaking practice
  const [recording, setRecording] = useState(false);
  const [speakingChecked, setSpeakingChecked] = useState(false);
  const [speakingFeedback, setSpeakingFeedback] = useState("");
  const [speakingScore, setSpeakingScore] = useState<number | null>(null);

  // Activity 2B states (Personal Builder)
  const [selectedTopic, setSelectedTopic] = useState<string>("topic_habits");
  const [personalClause1, setPersonalClause1] = useState("");
  const [personalClause2, setPersonalClause2] = useState("");
  const [personalConnector, setPersonalConnector] = useState("-아서/어서");
  const [personalResult, setPersonalResult] = useState("");
  const [savedSentences, setSavedSentences] = useState<any[]>([]);

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

  // Tutor launchers
  const [loadingTutor, setLoadingTutor] = useState(false);
  const [tutorSession, setTutorSession] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/lessons/phases/korean3/1/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/lessons/phases/korean3/1/core-data");
          setCoreData(res);
        } else if (step === 3 && recognitionItems.length === 0) {
          const res = await apiJson("/lessons/practice/connectors/recognition");
          setRecognitionItems(res.items || []);
        } else if (step === 4 && !expansionTemplates) {
          const res = await apiJson("/lessons/practice/connectors/expansion-templates");
          setExpansionTemplates(res);
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/lessons/quiz/korean3/phase-1/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean3/1/homework");
          setHomeworkItems(res_hw || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1A Connector Check
  const handleCheckRec = async () => {
    const current = recognitionItems[recIdx];
    if (!current || !selectedOptId) return;

    try {
      const correctOpt = current.options.find((o: any) => o.id === selectedOptId);
      const isCorrect = correctOpt ? correctOpt.correct : false;

      await apiJson("/lessons/practice/connectors/recognition/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          option_id: selectedOptId,
          time_taken_ms: 1200
        })
      });

      setRecChecked(true);
      setRecCorrect(isCorrect);
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 1B Relationship Check
  const handleCheckRel = () => {
    const current = recognitionItems[relIdx];
    if (!current || !selectedRel) return;

    const isCorrect = selectedRel.toLowerCase() === current.relationship_type.toLowerCase();
    setRelChecked(true);
    setRelCorrect(isCorrect);
  };

  // Activity 2A Expansion Check
  const handleExpandSentence = async (phraseKo: string) => {
    setSelectedTilePhrase(phraseKo);
    setIsExpanding(true);
    setSpeakingChecked(false);
    setSpeakingFeedback("");
    setSpeakingScore(null);
    try {
      const res = await apiJson("/lessons/practice/connectors/expand", {
        method: "POST",
        body: JSON.stringify({
          base_clause_id: selectedBaseId,
          connector: activeTab,
          clause_content: phraseKo
        })
      });
      setExpandedKo(res.sentence_ko);
      setExpandedEn(res.sentence_en);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleSaveExpanded = async () => {
    if (!expandedKo) return;
    try {
      await apiJson("/lessons/users/connector-sentences/save", {
        method: "POST",
        body: JSON.stringify({ sentence_ko: expandedKo, sentence_en: expandedEn })
      });
      setSavedSentences(prev => [...prev, { ko: expandedKo, en: expandedEn }]);
      alert("Sentence saved successfully!");
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
      const res = await apiJson("/lessons/practice/connectors/speaking", {
        method: "POST",
        body: JSON.stringify({ target_text: expandedKo })
      });
      setSpeakingChecked(true);
      setSpeakingFeedback(res.feedback);
      setSpeakingScore(res.accuracy_score);
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 2B Personal Builder
  const handleBuildPersonal = () => {
    if (!personalClause1.trim() || !personalClause2.trim()) return;
    
    // Simple combining simulation
    let combined = "";
    let english = "";
    if (personalConnector === "-고") {
      combined = `${personalClause1}고 ${personalClause2}`;
      english = `${personalClause1} and ${personalClause2}`;
    } else if (personalConnector === "-지만") {
      combined = `${personalClause1}지만 ${personalClause2}`;
      english = `${personalClause1} but ${personalClause2}`;
    } else {
      combined = `${personalClause1}어서 ${personalClause2}`;
      english = `Because ${personalClause1}, ${personalClause2}`;
    }
    
    setPersonalResult(combined);
    setSavedSentences(prev => [...prev, { ko: combined, en: english }]);
  };

  // Quiz
  const handleCheckQuiz = () => {
    const current = quizBlueprint[quizIdx];
    if (!current) return;

    const isCorrect = quizSelectedOpt === current.correct_answer;
    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    if (!isCorrect) {
      setQuizMistakes(prev => [...prev, current.id]);
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
        await apiJson("/lessons/quiz/korean3/phase-1/finish", {
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

  // Homework check logging
  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/lessons/phases/korean3/1/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Launch AI Connector practice
  const handleLaunchB1Tutor = async () => {
    setLoadingTutor(true);
    setTutorSession(null);
    try {
      const res = await apiJson("/lessons/conversation/b1/connectors-practice/start", { method: "POST" });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
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
              <span>{activeLesson?.title || "Connecting Ideas (B1 Core)"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: Clause Linking Connectors</p>
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
          
          <h2 className="text-5xl font-black text-white tracking-tight">Korean 3.1</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Connecting Ideas: Because, So & But</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Link your sentences to explain reasons, results, and contrasts."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Join two ideas with connectors (and, but, because, so, when)",
                "Explain reasons for your habits, likes, and plans",
                "Tell more connected mini-stories instead of single sentences"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 30} minutes</p>
            <p><strong>📋 Prerequisites:</strong> {metadata?.prerequisites || "Korean 2.6 – Everyday Conversations"}</p>
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => setStep(2)}
              className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 1</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
          </div>

          {showOutline && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-2 animate-fade-in max-w-2xl mx-auto w-full font-mono">
              <p className="font-extrabold text-white text-center pb-2">Phase Activities Outline</p>
              <p>✓ Activity 1 – Core connectors cards & before/after sentence mergers</p>
              <p>✓ Activity 2 – Connector matching & relationship classifiers</p>
              <p>✓ Activity 3 – "But, Because, So" sentence expansions & voice practice</p>
              <p>✓ Activity 4 – Strategy check quizzes</p>
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
              <span>Clauses & Connectors (B1)</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">B1 Connecting Ideas Goal:</p>
            <p className="italic">
              "At B1, you should be able to connect phrases and sentences to describe experiences and give reasons. In this phase, you’ll learn to join your sentences with words like ‘because’, ‘so’ and ‘but’."
            </p>
          </div>

          {/* Connector Cards Grid */}
          <div className="space-y-2.5">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block text-left">Core Connectors:</span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {coreData?.connectors?.map((conn: any) => {
                const isFlipped = flippedCardId === conn.id;
                return (
                  <div 
                    key={conn.id}
                    onClick={() => setFlippedCardId(isFlipped ? null : conn.id)}
                    className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer text-center flex flex-col justify-center min-h-[90px] relative overflow-hidden ${
                      isFlipped 
                        ? "border-brand-500 bg-brand-500/10 text-white" 
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    }`}
                  >
                    {!isFlipped ? (
                      <div>
                        <span className="text-lg font-korean font-extrabold block text-white">{conn.korean_label}</span>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-brand-400">{conn.english_function}</span>
                      </div>
                    ) : (
                      <div className="space-y-1 animate-fade-in text-left">
                        <span className="text-[9px] text-zinc-500 uppercase block font-black">{conn.description}</span>
                        <p className="font-korean font-bold text-xs text-brand-300">{conn.example_ko}</p>
                        <p className="text-[10px] text-zinc-400 leading-tight">{conn.example_en}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Before/After sentence merger */}
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-3 text-xs">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block text-left">From Two Sentences to One:</span>
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              
              {/* Before */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 w-full text-center">
                <span className="text-[9px] text-zinc-500 font-mono block">Separate Clauses (A2)</span>
                <p className="font-korean font-bold text-zinc-300 mt-1">이 카페를 좋아해요. 조용해요.</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">I like this cafe. It's quiet.</p>
              </div>

              <div className="flex flex-col items-center justify-center shrink-0">
                <ArrowRight className="w-6 h-6 text-brand-400" />
                <span className="text-[9px] text-brand-400 font-bold">Merge</span>
              </div>

              {/* After */}
              <div className="p-3 bg-brand-500/10 rounded-xl border border-brand-500/20 w-full text-center">
                <span className="text-[9px] text-brand-400 font-mono block">Connected Clause (B1)</span>
                <p className="font-korean font-bold text-white mt-1">이 카페는 <span className="text-brand-400 font-extrabold underline">조용해서</span> 좋아해요.</p>
                <p className="text-[10px] text-zinc-300 mt-0.5">Because it's quiet, I like this cafe.</p>
              </div>

            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Recognize & Choose */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Connector Recognition</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {/* Part A: Choose best connector */}
          {recognitionItems.length > 0 && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Part 1A: Choose the Connector</span>
                <p className="text-[11px] text-zinc-500">Select the correct connector to merge these sentences:</p>
              </div>

              {/* Sentences block */}
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-xs">
                <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl text-center">
                  <span className="text-[8px] text-zinc-500 block">Clause 1</span>
                  <p className="font-korean font-bold text-zinc-200 mt-1">{recognitionItems[recIdx]?.sentence1.split(" (")[0]}</p>
                  <p className="text-[10px] text-zinc-500">{recognitionItems[recIdx]?.sentence1.split(" (")[1]?.replace(")", "")}</p>
                </div>
                <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl text-center">
                  <span className="text-[8px] text-zinc-500 block">Clause 2</span>
                  <p className="font-korean font-bold text-zinc-200 mt-1">{recognitionItems[recIdx]?.sentence2.split(" (")[0]}</p>
                  <p className="text-[10px] text-zinc-500">{recognitionItems[recIdx]?.sentence2.split(" (")[1]?.replace(")", "")}</p>
                </div>
              </div>

              <p className="text-xs text-center font-bold text-amber-400">{recognitionItems[recIdx]?.prompt}</p>

              <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
                {recognitionItems[recIdx]?.options.map((opt: any) => (
                  <button
                    key={opt.id}
                    onClick={() => !recChecked && setSelectedOptId(opt.id)}
                    disabled={recChecked}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition flex flex-col justify-center items-center ${
                      selectedOptId === opt.id
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    } ${recChecked && opt.correct ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                  >
                    <span>{opt.text.split(" (")[0]}</span>
                    <span className="text-[9px] text-zinc-500 font-normal">{opt.text.split(" (")[1]?.replace(")", "")}</span>
                  </button>
                ))}
              </div>

              {recChecked && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 max-w-sm mx-auto text-left">
                  <p className="font-extrabold text-white mb-1">{recCorrect ? "✓ Correct Choice!" : "✗ Incorrect Choice."}</p>
                  <p>{recognitionItems[recIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!recChecked ? (
                  <button
                    onClick={handleCheckRec}
                    disabled={!selectedOptId}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Connector
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setRecChecked(false);
                      setSelectedOptId(null);
                      setRecCorrect(null);
                      if (recIdx < recognitionItems.length - 1) {
                        setRecIdx(recIdx + 1);
                      } else {
                        setRecIdx(0);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next Item
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Part B: Relationship Classifier */}
          {recognitionItems.length > 0 && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Part 1B: Relationship Classifier</span>
                <p className="text-[11px] text-zinc-500">What semantic relationship is expressed by the connector in this sentence?</p>
                
                {/* Sentence review */}
                <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl mt-2 max-w-md mx-auto text-center font-bold">
                  <p className="font-korean text-base text-white">
                    {relIdx === 0 
                      ? "피곤해서 일찍 잘 거예요." 
                      : "공부하지만 아직 한국어가 어려워요."}
                  </p>
                  <p className="text-xs text-zinc-500 font-normal mt-1">
                    {relIdx === 0 
                      ? "Because I am tired, I will sleep early." 
                      : "I study, but Korean is still difficult."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-md mx-auto">
                {["Reason", "Result", "Contrast", "Time"].map((type) => (
                  <button
                    key={type}
                    onClick={() => !relChecked && setSelectedRel(type)}
                    disabled={relChecked}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                      selectedRel === type
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    } ${relChecked && type.toLowerCase() === recognitionItems[relIdx]?.relationship_type.toLowerCase() ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {relChecked && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 max-w-sm mx-auto text-center">
                  <p className="font-extrabold text-white mb-1">{relCorrect ? "✓ Correct Relationship!" : "✗ Incorrect Relationship."}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!relChecked ? (
                  <button
                    onClick={handleCheckRel}
                    disabled={!selectedRel}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Relationship
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setRelChecked(false);
                      setSelectedRel(null);
                      setRelCorrect(null);
                      if (relIdx < recognitionItems.length - 1) {
                        setRelIdx(relIdx + 1);
                      } else {
                        setRelIdx(0);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next Item
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

      {/* Screen 4: Activity 2: Build & Expand */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Clause Expansion Builder</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          {/* Activity 2A: Expansion tabs */}
          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Part 2A: Sentence Expansion</span>
              <p className="text-xs text-zinc-400">Expand the base sentence: <strong className="text-white">"{expansionTemplates?.base_clauses[0]?.ko}"</strong></p>
            </div>

            {/* Tabs */}
            <div className="bg-zinc-950 p-1 rounded-xl border border-white/5 flex">
              {(["but", "because", "so"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedTilePhrase(null);
                    setExpandedKo("");
                    setExpandedEn("");
                  }}
                  className={`w-full py-2 text-center text-xs font-bold capitalize rounded-lg transition ${
                    activeTab === tab 
                      ? "bg-brand-500 text-white shadow" 
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {tab === "but" ? "But (-지만)" : tab === "because" ? "Because (-아서/어서)" : "So (-(으)니까)"}
                </button>
              ))}
            </div>

            {/* Phrase Tiles selection */}
            <div className="space-y-2 text-left">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Choose an expanding clause:</span>
              <div className="flex flex-wrap gap-2">
                {expansionTemplates?.base_clauses[0]?.suggestions[activeTab]?.map((s: any) => (
                  <button
                    key={s.ko}
                    onClick={() => handleExpandSentence(s.ko)}
                    className={`px-3 py-2 bg-zinc-950 hover:bg-zinc-900 border text-xs font-bold rounded-xl transition ${
                      selectedTilePhrase === s.ko 
                        ? "border-brand-500 text-brand-400" 
                        : "border-white/5 text-zinc-300"
                    }`}
                  >
                    {s.ko}
                  </button>
                ))}
              </div>
            </div>

            {/* Expanded Sentence preview */}
            {expandedKo && (
              <div className="p-4 bg-zinc-950 rounded-xl border border-brand-500/20 text-center space-y-3 animate-fade-in">
                <div>
                  <span className="text-[9px] text-brand-400 uppercase tracking-wider block font-black mb-1">Merged B1 Connected Sentence:</span>
                  <p className="font-korean text-lg text-white font-extrabold">{expandedKo}</p>
                  <p className="text-xs text-zinc-400 mt-1">{expandedEn}</p>
                </div>

                <div className="flex justify-center gap-2 pt-2">
                  <button onClick={() => playAudio(expandedKo)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold">
                    <Volume2 className="w-4 h-4" />
                    <span>Listen</span>
                  </button>
                  <button onClick={handleSaveExpanded} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold">
                    <Save className="w-4 h-4" />
                    <span>Save Example</span>
                  </button>
                </div>

                {/* Optional Speaking calibration */}
                <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-white/5 space-y-2 mt-2">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-black text-left">Pronunciation Practice:</span>
                  <div className="flex justify-between items-center gap-3">
                    <button
                      onClick={handleStartRecording}
                      disabled={recording}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        recording ? "bg-red-500 text-white animate-pulse" : "bg-brand-500 text-white hover:bg-brand-600"
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                      <span>{recording ? "Recording..." : "Hold to Record"}</span>
                    </button>
                    
                    {speakingChecked && (
                      <div className="text-right space-y-0.5 text-xs">
                        <p className="font-bold text-white">Score: {speakingScore}%</p>
                        <p className="text-[10px] text-zinc-500 font-medium">{speakingFeedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity 2B: Personal Builder */}
          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
            <div className="text-center space-y-1">
              <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Part 2B: Personal Reason Builder</span>
              <p className="text-xs text-zinc-400">Select a topic and construct a personal clause combination:</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {/* Topic Selector */}
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Select Topic</label>
                  <select 
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white"
                  >
                    {expansionTemplates?.topics.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Connector Selector */}
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Select Connector</label>
                  <select 
                    value={personalConnector}
                    onChange={(e) => setPersonalConnector(e.target.value)}
                    className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white font-korean font-bold"
                  >
                    <option value="-고">-고 (And)</option>
                    <option value="-지만">-지만 (But)</option>
                    <option value="-어서/어서">-아서/어서 (Because)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {/* Clause 1 inputs */}
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">First Clause (Korean)</label>
                  <input
                    type="text"
                    value={personalClause1}
                    onChange={(e) => setPersonalClause1(e.target.value)}
                    placeholder="e.g. 한국어를 공부하다"
                    className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white"
                  />
                </div>

                {/* Clause 2 inputs */}
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Second Clause (Korean)</label>
                  <input
                    type="text"
                    value={personalClause2}
                    onChange={(e) => setPersonalClause2(e.target.value)}
                    placeholder="e.g. 재미있다"
                    className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleBuildPersonal}
              disabled={!personalClause1.trim() || !personalClause2.trim()}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center"
            >
              Build Connector Sentence
            </button>

            {personalResult && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-center">
                <span className="text-[8px] text-zinc-500 uppercase font-black block mb-0.5">Your Custom sentence:</span>
                <p className="font-korean font-bold text-white text-sm">{personalResult}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Mini-Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Mini-Quiz */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Mini-Quiz: Connector Usage Check</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Question {quizIdx + 1} of {quizBlueprint.length}</span>
          </div>

          {quizBlueprint.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Question Prompt</span>
                <p className="font-extrabold text-white text-base mt-1 whitespace-pre-line">{quizBlueprint[quizIdx]?.question}</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {quizBlueprint[quizIdx]?.options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                    disabled={quizChecked}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
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
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 text-left">
                  <p className="font-extrabold text-white mb-1">{quizCorrect ? "✓ Answer Correct!" : "✗ Incorrect Answer."}</p>
                  <p>{quizBlueprint[quizIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end">
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={!quizSelectedOpt}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl text-xs cursor-pointer transition"
                  >
                    Verify Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/95 font-bold px-6 py-2 rounded-xl text-xs cursor-pointer transition flex items-center gap-1.5"
                  >
                    {finishingQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Complete Quiz"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(4)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <div className="h-4" />
          </div>
        </div>
      )}

      {/* Screen 6: Homework & AI practice launcher */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-accent-teal/10 rounded-full border border-accent-teal/25 w-fit mx-auto text-accent-teal shrink-0">
            <Award className="w-8 h-8 animate-bounce shrink-0" />
          </div>

          <h2 className="text-5xl font-black text-white tracking-tight">Course 4 Started!</h2>
          <p className="text-xs text-zinc-400 font-mono">Badge Earned: Connector Starter (150 XP rewarded)</p>

          <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">B1 Connector Homework Checklist:</span>
            <div className="space-y-2.5">
              {homeworkItems.map((item) => {
                const isChecked = !!completedHomework[item.id];
                return (
                  <label key={item.id} className="flex items-start gap-3 cursor-pointer group text-xs text-zinc-300 select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleHomework(item.id, isChecked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/10 bg-zinc-950 text-brand-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className={`group-hover:text-white transition ${isChecked ? "line-through text-zinc-500" : ""}`}>{item.text}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* AI practice launcher */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <div className="space-y-0.5">
              <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">AI Conversation Practice:</span>
              <p className="text-[11px] text-zinc-400 leading-normal">Practice explaining your reasons, likes, and plans directly to your AI tutor using the new connector patterns.</p>
            </div>

            {tutorSession ? (
              <div className="p-4 bg-zinc-900 border border-brand-500/20 rounded-xl space-y-2 text-xs animate-fade-in">
                <p className="font-extrabold text-white">Stateful Session Active!</p>
                <p className="font-korean text-zinc-200">Gwan-Sik: "{tutorSession.opener}"</p>
                <button
                  onClick={() => window.location.href = `/tutor?session_id=${tutorSession.session_id}`}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-1.5 px-4 rounded-lg text-[10px] cursor-pointer transition flex items-center gap-1"
                >
                  <span>Enter B1 Practice Room</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLaunchB1Tutor}
                disabled={loadingTutor}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition flex items-center justify-center gap-2"
              >
                {loadingTutor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                <span>Explain your reasons to your AI tutor</span>
              </button>
            )}
          </div>

          <div className="pt-2">
            <button 
              onClick={onComplete}
              className="bg-accent-teal hover:bg-accent-teal/90 text-zinc-950 font-black py-3.5 px-10 rounded-xl transition text-sm shadow-lg shadow-accent-teal/15 cursor-pointer"
            >
              Finish B1 Phase 1
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
