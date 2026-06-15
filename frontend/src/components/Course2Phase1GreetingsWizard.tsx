"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  Sparkles, 
  BookOpen, 
  Award, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Play, 
  RotateCcw,
  Mic,
  MicOff,
  Check,
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

async function apiForm(path: string, formData: FormData) {
  const token = getToken();
  const cleanPath = (path.startsWith("/phases/") || path.startsWith("/quiz/") || path.startsWith("/practice/")) ? `/lessons${path}` : path;
  const res = await fetch(`${API_BASE}${cleanPath}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

// Audio recorder utility hook
function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunks = useRef<BlobPart[]>([]);

  const start = useCallback(async () => {
    setAudioBlob(null);
    chunks.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone access denied. Please allow microphone permissions and try again.");
    }
  }, []);

  const stop = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setRecording(false);
  }, []);

  return { recording, audioBlob, start, stop, setAudioBlob };
}

interface Course2Phase1GreetingsWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course2Phase1GreetingsWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course2Phase1GreetingsWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);

  // Data loaded from backend
  const [metadata, setMetadata] = useState<any>(null);
  const [expressions, setExpressions] = useState<any[]>([]);
  const [listeningItems, setListeningItems] = useState<any[]>([]);
  const [gapfillItems, setGapfillItems] = useState<any[]>([]);
  const [contextItems, setContextItems] = useState<any[]>([]);
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);

  // Card flipping tracking
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  // Activity 1A: Listening states
  const [listeningIdx, setListeningIdx] = useState(0);
  const [selectedListeningOpt, setSelectedListeningOpt] = useState<string | null>(null);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningCorrect, setListeningCorrect] = useState<boolean | null>(null);

  // Activity 1B: Matching states
  const [matchingPairs, setMatchingPairs] = useState<any[]>([]);
  const [selectedMatchKo, setSelectedMatchKo] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]); // list of matched korean words

  // Activity 2A: Gap-fill states
  const [gapfillIdx, setGapfillIdx] = useState(0);
  const [selectedGapfillOpt, setSelectedGapfillOpt] = useState<string | null>(null);
  const [gapfillChecked, setGapfillChecked] = useState(false);
  const [gapfillCorrect, setGapfillCorrect] = useState<boolean | null>(null);

  // Activity 2B: Context states
  const [contextIdx, setContextIdx] = useState(0);
  const [selectedContextOpt, setSelectedContextOpt] = useState<string | null>(null);
  const [contextChecked, setContextChecked] = useState(false);
  const [contextCorrect, setContextCorrect] = useState<boolean | null>(null);

  // Quiz states
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<string>("");
  const [quizAnswerSelected, setQuizAnswerSelected] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Bonus speaking quiz state
  const rec = useRecorder();
  const [speakingTranscribing, setSpeakingTranscribing] = useState(false);
  const [speakingResult, setSpeakingResult] = useState<any>(null);

  // Homework check state
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Tutor session mode launch state
  const [tutorSession, setTutorSession] = useState<any>(null);
  const [loadingTutor, setLoadingTutor] = useState(false);

  // Lazy load curriculum items based on steps
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/lessons/phases/korean1/1/metadata");
          setMetadata(res);
        } else if (step === 2 && expressions.length === 0) {
          const res = await apiJson("/lessons/phases/korean1/1/expressions");
          setExpressions(res);
        } else if (step === 3 && listeningItems.length === 0) {
          const res_lis = await apiJson("/lessons/practice/greetings/listening");
          setListeningItems(res_lis.items || []);
          
          // Match pairs layout
          const rawMatching = [
            { ko: "안녕하세요", en: "Hello" },
            { ko: "감사합니다", en: "Thank you" },
            { ko: "죄송합니다", en: "I'm sorry" },
            { ko: "네", en: "Yes" },
            { ko: "아니요", en: "No" }
          ];
          setMatchingPairs(rawMatching);
        } else if (step === 4 && gapfillItems.length === 0) {
          const res_gf = await apiJson("/lessons/practice/greetings/gapfill");
          setGapfillItems(res_gf || []);
          const res_ctx = await apiJson("/lessons/practice/greetings/context");
          setContextItems(res_ctx || []);
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/lessons/quiz/korean1/phase-1/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean1/1/homework");
          setHomeworkItems(res_hw || []);
        }
      } catch (err) {
        console.error("Failed to load step data:", err);
      }
    };
    load();
  }, [step]);

  // Audio Playback
  const playAudio = (koreanText: string) => {
    speakWord(koreanText);
  };

  // Submit listening attempt
  const handleCheckListening = async () => {
    const current = listeningItems[listeningIdx];
    if (!current || !selectedListeningOpt) return;

    try {
      const res = await apiJson("/lessons/practice/greetings/listening/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_option_id: selectedListeningOpt,
          time_taken_ms: 1000,
        }),
      });
      setListeningChecked(true);
      setListeningCorrect(res.correct);
    } catch (err) {
      console.error(err);
    }
  };

  // Match columns select handler
  const handleMatchClick = (ko: string, en: string) => {
    if (!selectedMatchKo) {
      setSelectedMatchKo(ko);
    } else {
      // Find pair
      const pair = matchingPairs.find(p => p.ko === selectedMatchKo);
      if (pair && pair.en === en) {
        setMatchedPairs(prev => [...prev, selectedMatchKo]);
      } else {
        alert("Incorrect match, try again!");
      }
      setSelectedMatchKo(null);
    }
  };

  // Submit gapfill attempt
  const handleCheckGapfill = async () => {
    const current = gapfillItems[gapfillIdx];
    if (!current || !selectedGapfillOpt) return;

    try {
      const res = await apiJson("/lessons/practice/greetings/gapfill/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_option_id: selectedGapfillOpt,
          time_taken_ms: 1000,
        }),
      });
      setGapfillChecked(true);
      setGapfillCorrect(res.correct);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit context attempt
  const handleCheckContext = async () => {
    const current = contextItems[contextIdx];
    if (!current || !selectedContextOpt) return;

    try {
      const res = await apiJson("/lessons/practice/greetings/context/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_option_id: selectedContextOpt,
          time_taken_ms: 1000,
        }),
      });
      setContextChecked(true);
      setContextCorrect(res.correct);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Quiz Question
  const handleCheckQuiz = () => {
    const current = quizBlueprint[quizIdx];
    if (!current) return;

    let isCorrect = false;
    let answerText = quizAnswer;

    if (current.type === "listening" || current.type === "context") {
      isCorrect = quizAnswerSelected === current.correct_answer;
      answerText = quizAnswerSelected || "";
    } else {
      isCorrect = quizAnswer.trim().toLowerCase() === current.correct_answer.trim().toLowerCase();
    }

    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    if (!isCorrect) {
      setQuizMistakes(prev => [...prev, current.correct_answer]);
    }
  };

  const handleNextQuizOrComplete = async () => {
    if (quizIdx < quizBlueprint.length - 1) {
      setQuizIdx(quizIdx + 1);
      setQuizAnswer("");
      setQuizAnswerSelected(null);
      setQuizChecked(false);
      setQuizCorrect(null);
      setSpeakingResult(null);
    } else {
      // Completed, submit finish request
      setFinishingQuiz(true);
      try {
        const correctCount = quizBlueprint.length - quizMistakes.length;
        const score = Math.round((correctCount / quizBlueprint.length) * 100);
        await apiJson("/lessons/quiz/korean1/phase-1/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes,
          }),
        });
        setQuizScore(score);
        setStep(6); // Go to homework/extension
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  // Speaking Check (Bonus microphone evaluation)
  const handleSpeechEvaluate = async () => {
    if (!rec.audioBlob) return;
    setSpeakingTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("target_text", "안녕하세요");
      fd.append("audio_file", rec.audioBlob, "recording.webm");
      const res = await apiForm("/speech/shadow", fd);
      setSpeakingResult(res);
      
      // Select the correct option implicitly if similarity is above 60%
      if (res.similarity_score >= 60) {
        setQuizAnswerSelected("안녕하세요");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSpeakingTranscribing(false);
    }
  };

  // Launch AI tutor greetings mode
  const handleLaunchTutor = async () => {
    setLoadingTutor(true);
    try {
      const res = await apiJson("/lessons/tutor/teach/greetings-mode", { method: "POST" });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

  // Homework check logging
  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/lessons/phases/korean1/1/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const totalSteps = 6;

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
              <span>{activeLesson?.title || "Greetings & Polite Basics"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: Polite Language</p>
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
          
          <h2 className="text-5xl font-black text-white tracking-tight">Korean 1.1</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Greetings & Polite Basics</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Say hello, thank you, and goodbye in natural Korean."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Greet people politely in Korean",
                "Say thank you, sorry, and excuse me",
                "Respond with yes/no in simple daily situations"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 15} minutes</p>
            <p><strong>📋 Prerequisites:</strong> {metadata?.prerequisites || "Hangeul Vowels & Consonants"}</p>
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
              <p>✓ Activity 1 – Listening & sound comprehension drills</p>
              <p>✓ Activity 2 – Polite expression matching game</p>
              <p>✓ Activity 3 – Gap-fill spelling production drills</p>
              <p>✓ Activity 4 – Context-appropriate phrase challenges</p>
              <p>✓ Activity 5 – Graduating checkpoint mini-quiz</p>
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
              <span>Core Polite Expressions</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="prose prose-invert text-xs text-zinc-400 space-y-1 max-w-none">
            <p><strong>Politeness Concept:</strong> In Korean, politeness is built directly into the language. Default safe speech to strangers/adults is polite. Informal forms will come later. Tap cards below to play audio and reveal descriptions.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {expressions.map((exp) => {
              const isFlipped = flippedCardId === exp.id;
              return (
                <div 
                  key={exp.id}
                  onClick={() => {
                    setFlippedCardId(isFlipped ? null : exp.id);
                    playAudio(exp.korean);
                  }}
                  className={`glass-panel p-5 rounded-2xl border transition duration-300 cursor-pointer flex flex-col justify-between h-36 ${
                    isFlipped 
                      ? "border-brand-500 bg-brand-500/5 shadow-[0_0_20px_rgba(79,70,229,0.15)]" 
                      : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">Polite</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudio(exp.korean);
                      }}
                      className="p-1 rounded bg-zinc-950/60 text-zinc-400 hover:text-white"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!isFlipped ? (
                    <div className="space-y-1 py-2 text-center">
                      <div className="text-2xl font-black text-white font-korean">{exp.korean}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">Tap card to see details</div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-left py-1 animate-fade-in">
                      <div className="text-xs font-mono font-bold text-zinc-300">{exp.romanization}</div>
                      <div className="text-sm font-black text-white">{exp.english}</div>
                      <p className="text-[10px] text-zinc-400 leading-snug">{exp.usage}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Listening Drills <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Listening & Matching */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Listening & Matching</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {/* Activity 1A: Hear it -> Choose meaning */}
          <div className="space-y-4 bg-zinc-900/30 p-5 rounded-2xl border border-white/5">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Part A: Hear spoken phrase → Choose meaning</h3>
            
            {listeningItems.length === 0 ? (
              <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
            ) : (
              <div className="space-y-4 max-w-md mx-auto w-full text-center">
                <button 
                  onClick={() => playAudio(listeningItems[listeningIdx]?.korean)}
                  className="p-5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-full mx-auto transition flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Volume2 className="w-8 h-8 animate-pulse" />
                </button>

                <div className="grid grid-cols-1 gap-2 pt-2">
                  {listeningItems[listeningIdx]?.options.map((opt: any) => (
                    <button
                      key={opt.id}
                      onClick={() => !listeningChecked && setSelectedListeningOpt(opt.id)}
                      disabled={listeningChecked}
                      className={`p-3 rounded-xl font-semibold text-xs border transition ${
                        selectedListeningOpt === opt.id
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                      } ${listeningChecked && opt.id === listeningItems[listeningIdx]?.correct_option_id ? "border-accent-teal bg-accent-teal/10 text-white" : ""}`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>

                {listeningChecked && (
                  <div className={`p-4 rounded-xl border text-xs text-left space-y-1.5 ${
                    listeningCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    <p className="font-extrabold">{listeningCorrect ? "Correct!" : "Incorrect."}</p>
                    <p>Korean: <strong className="text-white text-sm">{listeningItems[listeningIdx]?.korean}</strong> ({listeningItems[listeningIdx]?.romanization})</p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  {!listeningChecked ? (
                    <button
                      onClick={handleCheckListening}
                      disabled={!selectedListeningOpt}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setListeningChecked(false);
                        setSelectedListeningOpt(null);
                        setListeningCorrect(null);
                        if (listeningIdx < listeningItems.length - 1) {
                          setListeningIdx(listeningIdx + 1);
                        } else {
                          setListeningIdx(0); // Wrap around or keep
                        }
                      }}
                      className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Next Audio Item
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Activity 1B: Match Korean to English */}
          <div className="space-y-4 bg-zinc-900/30 p-5 rounded-2xl border border-white/5">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Part B: Match columns</h3>
            <p className="text-[10px] text-zinc-500">Tap a Korean word on the left, then its English meaning on the right.</p>

            <div className="grid grid-cols-2 gap-8 pt-2">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Korean</span>
                {matchingPairs.map((pair) => {
                  const isMatched = matchedPairs.includes(pair.ko);
                  const isSelected = selectedMatchKo === pair.ko;
                  return (
                    <button
                      key={pair.ko}
                      disabled={isMatched}
                      onClick={() => setSelectedMatchKo(pair.ko)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition ${
                        isMatched 
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 line-through" 
                          : isSelected 
                            ? "border-brand-500 bg-brand-500/20 text-white font-black"
                            : "border-white/5 bg-zinc-950/60 hover:bg-zinc-900 text-zinc-300"
                      }`}
                    >
                      {pair.ko}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">English Meaning</span>
                {matchingPairs.map((pair) => {
                  const isMatched = matchedPairs.includes(pair.ko);
                  return (
                    <button
                      key={pair.en}
                      disabled={isMatched || !selectedMatchKo}
                      onClick={() => handleMatchClick(pair.ko, pair.en)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs transition ${
                        isMatched 
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 line-through" 
                          : "border-white/5 bg-zinc-950/60 hover:bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      {pair.en}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(2)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 2: Controlled Production */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Controlled Production</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          {/* Activity 2A: Gap-fill */}
          <div className="space-y-4 bg-zinc-900/30 p-5 rounded-2xl border border-white/5">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Part A: Fill-in-the-blank greetings</h3>
            
            {gapfillItems.length === 0 ? (
              <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
            ) : (
              <div className="space-y-4 w-full text-center">
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs">
                  <span className="text-[10px] text-zinc-500 block mb-1">Scenario Description:</span>
                  <p className="font-semibold text-zinc-300">{gapfillItems[gapfillIdx]?.prompt}</p>
                </div>

                <div className="text-2xl font-black text-white tracking-widest font-mono py-2">
                  {gapfillItems[gapfillIdx]?.koreanTemplate.replace("[ ]", selectedGapfillOpt ? gapfillItems[gapfillIdx]?.options.find((o: any) => o.id === selectedGapfillOpt)?.text : "___")}
                </div>

                <div className="flex justify-center gap-2">
                  {gapfillItems[gapfillIdx]?.options.map((opt: any) => (
                    <button
                      key={opt.id}
                      onClick={() => !gapfillChecked && setSelectedGapfillOpt(opt.id)}
                      disabled={gapfillChecked}
                      className={`px-4 py-2 rounded-xl text-sm font-black border transition ${
                        selectedGapfillOpt === opt.id
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      }`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>

                {gapfillChecked && (
                  <div className={`p-4 rounded-xl border text-xs text-left space-y-1.5 ${
                    gapfillCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    <p className="font-extrabold">{gapfillCorrect ? "Correct!" : "Incorrect."}</p>
                    <p><strong>Explanation:</strong> {gapfillItems[gapfillIdx]?.explanation}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  {!gapfillChecked ? (
                    <button
                      onClick={handleCheckGapfill}
                      disabled={!selectedGapfillOpt}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setGapfillChecked(false);
                        setSelectedGapfillOpt(null);
                        setGapfillCorrect(null);
                        if (gapfillIdx < gapfillItems.length - 1) {
                          setGapfillIdx(gapfillIdx + 1);
                        } else {
                          setGapfillIdx(0);
                        }
                      }}
                      className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Next Gap-fill
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Activity 2B: Context Appropriate response */}
          <div className="space-y-4 bg-zinc-900/30 p-5 rounded-2xl border border-white/5">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Part B: Choose appropriate expression</h3>
            
            {contextItems.length === 0 ? (
              <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
            ) : (
              <div className="space-y-4 w-full">
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-center">
                  <span className="text-[10px] text-zinc-500 block mb-1">English Situation Scenario:</span>
                  <p className="font-semibold text-zinc-300">{contextItems[contextIdx]?.scenario}</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {contextItems[contextIdx]?.options.map((opt: any) => (
                    <button
                      key={opt.id}
                      onClick={() => !contextChecked && setSelectedContextOpt(opt.id)}
                      disabled={contextChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                        selectedContextOpt === opt.id
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      } ${contextChecked && opt.id === contextItems[contextIdx]?.correct_option_id ? "border-accent-teal bg-accent-teal/10" : ""}`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>

                {contextChecked && (
                  <div className={`p-4 rounded-xl border text-xs text-left space-y-1.5 ${
                    contextCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    <p className="font-extrabold">{contextCorrect ? "Correct!" : "Incorrect."}</p>
                    <p><strong>Explanation:</strong> {contextItems[contextIdx]?.explanation}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  {!contextChecked ? (
                    <button
                      onClick={handleCheckContext}
                      disabled={!selectedContextOpt}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setContextChecked(false);
                        setSelectedContextOpt(null);
                        setContextCorrect(null);
                        if (contextIdx < contextItems.length - 1) {
                          setContextIdx(contextIdx + 1);
                        } else {
                          setContextIdx(0);
                        }
                      }}
                      className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Next Scenario
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Mini-Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Mini-quiz Checkpoint */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Mini-Quiz: A1 Polite Checkpoint</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Question {quizIdx + 1} of {quizBlueprint.length}</span>
          </div>

          {quizBlueprint.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Question Prompt</span>
                <p className="font-extrabold text-white text-base mt-1">{quizBlueprint[quizIdx]?.question}</p>
              </div>

              {quizBlueprint[quizIdx]?.type === "listening" && (
                <div className="text-center space-y-4">
                  <button 
                    onClick={() => playAudio(quizBlueprint[quizIdx]?.correct_answer)}
                    className="p-5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full mx-auto transition flex items-center justify-center cursor-pointer"
                  >
                    <Volume2 className="w-8 h-8" />
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    {quizBlueprint[quizIdx]?.options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !quizChecked && setQuizAnswerSelected(opt)}
                        disabled={quizChecked}
                        className={`p-3 rounded-xl border text-xs font-bold transition ${
                          quizAnswerSelected === opt
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                        } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10" : ""}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {quizBlueprint[quizIdx]?.type === "context" && (
                <div className="grid grid-cols-1 gap-2">
                  {quizBlueprint[quizIdx]?.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizAnswerSelected(opt)}
                      disabled={quizChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                        quizAnswerSelected === opt
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                      } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10" : ""}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {quizBlueprint[quizIdx]?.type === "writing" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={quizAnswer}
                    disabled={quizChecked}
                    onChange={(e) => setQuizAnswer(e.target.value)}
                    placeholder="Type the exact Hangeul block..."
                    className="w-full bg-zinc-950 p-4 rounded-xl border border-white/5 text-center text-lg font-black text-white focus:outline-none focus:border-brand-500 font-sans"
                  />
                  {/* Keyboard help key */}
                  {!quizChecked && (
                    <div className="flex gap-1.5 justify-center flex-wrap pt-2">
                      {["네", "아니요", "감사", "합니", "죄송", "안녕"].map(ch => (
                        <button
                          key={ch}
                          onClick={() => setQuizAnswer(v => v + ch)}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 rounded border border-white/5 text-xs text-white"
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {quizBlueprint[quizIdx]?.type === "speaking" && (
                <div className="space-y-4 text-center">
                  <p className="text-xs text-zinc-400">Bonus: Speak "안녕하세요" to check pronunciation.</p>
                  
                  <div className="flex justify-center items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (rec.recording) {
                          rec.stop();
                        } else {
                          rec.start();
                        }
                      }}
                      disabled={speakingTranscribing || quizChecked}
                      className={`p-5 rounded-full transition ${
                        rec.recording
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-brand-500/10 text-brand-400 border border-brand-500/25 hover:bg-brand-500/20"
                      }`}
                      title={rec.recording ? "Stop Recording" : "Click to Record"}
                    >
                      {rec.recording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                    </button>

                    {rec.audioBlob && !rec.recording && !quizChecked && (
                      <button
                        onClick={handleSpeechEvaluate}
                        disabled={speakingTranscribing}
                        className="bg-zinc-850 hover:bg-zinc-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition border border-white/5 cursor-pointer"
                      >
                        {speakingTranscribing ? "Evaluating..." : "Evaluate Pronunciation"}
                      </button>
                    )}
                  </div>

                  {speakingResult && (
                    <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 text-left text-xs space-y-1">
                      <p className="font-black text-white">Score: {speakingResult.similarity_score.toFixed(0)}%</p>
                      <p className="text-zinc-400">Heard: "{speakingResult.transcription || "..."}"</p>
                    </div>
                  )}
                </div>
              )}

              {quizChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1.5 ${
                  quizCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold">{quizCorrect ? "Correct!" : "Incorrect."}</p>
                  <p><strong>Explanation:</strong> {quizBlueprint[quizIdx]?.explanation}</p>
                  {!quizCorrect && <p className="font-mono mt-1 text-zinc-400">Correct Answer: {quizBlueprint[quizIdx]?.correct_answer}</p>}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div />
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={
                      (quizBlueprint[quizIdx]?.type === "listening" || quizBlueprint[quizIdx]?.type === "context") 
                        ? !quizAnswerSelected 
                        : !quizAnswer.trim()
                    }
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Checkpoint
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {finishingQuiz ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Submit Quiz & See Score"}</span>
                        <ChevronRight className="w-4 h-4 text-zinc-950" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 6: Homework & AI Extension suggestions */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0 animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Phase 1 Complete! 🇰🇷✨</h2>
            <p className="text-zinc-400 text-xs">You scored {quizScore}% on your checkpoint test! You earned **150 XP**.</p>
          </div>

          {/* Practical Checklist Homework */}
          <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 text-left space-y-3">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Homework Checklist Tasks</span>
            <div className="space-y-2">
              {homeworkItems.map((hw) => {
                const isChecked = !!completedHomework[hw.id];
                return (
                  <div 
                    key={hw.id}
                    onClick={() => handleToggleHomework(hw.id, isChecked)}
                    className="flex items-center gap-3 p-3 bg-zinc-950/80 rounded-xl border border-white/5 cursor-pointer hover:bg-zinc-900 transition"
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                      isChecked ? "border-emerald-500 bg-emerald-500/15 text-emerald-400" : "border-white/10 bg-zinc-900"
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-xs text-zinc-300 ${isChecked ? "line-through text-zinc-500" : ""}`}>{hw.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI tutor mode portal launcher */}
          <div className="p-5 bg-zinc-900/60 rounded-2xl border border-white/5 space-y-4">
            <div className="text-left space-y-1">
              <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider block">Special AI Practice Mode</span>
              <h4 className="text-xs font-bold text-white">Greetings Mode dialogue coaching with Gwan-Sik</h4>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Starts a short, greetings-focused chat session where Gwan-Sik greets you and gives corrections on your polite responses.
              </p>
            </div>

            {tutorSession ? (
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 text-left space-y-2">
                <span className="text-[9px] font-black text-brand-400 uppercase tracking-wider block">Greetings Coach Active Session</span>
                <p className="text-xs italic text-zinc-300 font-serif">"{tutorSession.opener}"</p>
                <div className="flex justify-end pt-1">
                  <a 
                    href={`/tutor?session=${tutorSession.session_id}`}
                    className="bg-brand-500 text-zinc-950 font-black px-3 py-1.5 rounded-lg text-[10px] hover:bg-brand-400 transition"
                  >
                    Enter Chat Room
                  </a>
                </div>
              </div>
            ) : (
              <button
                onClick={handleLaunchTutor}
                disabled={loadingTutor}
                className="w-full bg-zinc-950 hover:bg-zinc-900 text-brand-400 hover:text-brand-300 border border-brand-500/20 font-bold px-4 py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingTutor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                <span>Practice with your AI tutor (Greetings Mode)</span>
              </button>
            )}
          </div>

          <button
            onClick={onComplete}
            className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/20 cursor-pointer w-full max-w-xs"
          >
            <span>Finish Phase 1 & Earn XP</span>
            <ChevronRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      )}
      
      {/* Navigation bottom controls for non-quiz screens */}
      {step < 5 && step > 1 && (
        <div className="flex justify-between items-center py-4 border-t border-white/5 mt-6">
          <button 
            onClick={() => setStep(step - 1)} 
            className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button 
            onClick={() => setStep(step + 1)} 
            className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      
    </div>
  );
}
