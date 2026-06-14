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

// Audio recorder hook
function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);

  const start = useCallback(async () => {
    setAudioBlob(null);
    chunks.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => chunks.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone access denied. Please allow microphone permissions and try again.");
    }
  }, []);

  const stop = useCallback(() => {
    mediaRef.current?.stop();
    setRecording(false);
  }, []);

  return { recording, audioBlob, start, stop, setAudioBlob };
}

interface Course2Phase3NumbersWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course2Phase3NumbersWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course2Phase3NumbersWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 6;

  // DB Data States
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);
  const [listeningItems, setListeningItems] = useState<any[]>([]);
  const [timeItems, setTimeItems] = useState<any[]>([]);
  const [factsItems, setFactsItems] = useState<any[]>([]);
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);

  // Flip tracking for number cards
  const [flippedNumDigit, setFlippedNumDigit] = useState<string | null>(null);

  // Activity 1A listening states
  const [listeningIdx, setListeningIdx] = useState(0);
  const [selectedListeningOpt, setSelectedListeningOpt] = useState<string | null>(null);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningCorrect, setListeningCorrect] = useState<boolean | null>(null);

  // Activity 2A Time states
  const [timeIdx, setTimeIdx] = useState(0);
  const [selectedTimeOpt, setSelectedTimeOpt] = useState<string | null>(null);
  const [timeChecked, setTimeChecked] = useState(false);
  const [timeCorrect, setTimeCorrect] = useState<boolean | null>(null);

  // Activity 2B Facts states
  const [factsIdx, setFactsIdx] = useState(0);
  const [selectedFactOpt, setSelectedFactOpt] = useState<string | null>(null);
  const [factsChecked, setFactsChecked] = useState(false);
  const [factsCorrect, setFactsCorrect] = useState<boolean | null>(null);

  // Quiz States
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizWritingAns, setQuizWritingAns] = useState("");
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Speaking Check States
  const rec = useRecorder();
  const [speakingTranscribing, setSpeakingTranscribing] = useState(false);
  const [speakingResult, setSpeakingResult] = useState<any>(null);

  // Homework Checklist States
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Tutor session states
  const [tutorSession, setTutorSession] = useState<any>(null);
  const [loadingTutor, setLoadingTutor] = useState(false);

  // Load backend content
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/lessons/phases/korean1/3/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/lessons/phases/korean1/3/core-data");
          setCoreData(res);
        } else if (step === 3 && listeningItems.length === 0) {
          const res = await apiJson("/lessons/practice/numbers/listening");
          setListeningItems(res.items || []);
        } else if (step === 4 && timeItems.length === 0) {
          const res_t = await apiJson("/lessons/practice/time/basic");
          const res_f = await apiJson("/lessons/practice/facts/basic");
          setTimeItems(res_t.items || []);
          setFactsItems(res_f.items || []);
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/lessons/quiz/korean1/phase-3/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res_h = await apiJson("/lessons/phases/korean1/3/homework");
          setHomeworkItems(res_h || []);
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

  // Activity 1: Listen and choose answer
  const handleCheckListening = async () => {
    const current = listeningItems[listeningIdx];
    if (!current || !selectedListeningOpt) return;

    try {
      const res = await apiJson("/lessons/practice/numbers/listening/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_digit: selectedListeningOpt,
          time_taken_ms: 1000
        })
      });
      setListeningChecked(true);
      setListeningCorrect(res.correct);
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 2A: Time check
  const handleCheckTime = async () => {
    const current = timeItems[timeIdx];
    if (!current || !selectedTimeOpt) return;

    try {
      const res = await apiJson("/lessons/practice/time/basic/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_option_id: selectedTimeOpt,
          time_taken_ms: 1000
        })
      });
      setTimeChecked(true);
      setTimeCorrect(res.correct);
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 2B: Facts check
  const handleCheckFacts = async () => {
    const current = factsItems[factsIdx];
    if (!current || !selectedFactOpt) return;

    const isCorrect = selectedFactOpt === current.correct_answer;
    try {
      await apiJson("/lessons/practice/facts/basic/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_answer: selectedFactOpt,
          is_correct: isCorrect,
          time_taken_ms: 1000
        })
      });
      setFactsChecked(true);
      setFactsCorrect(isCorrect);
    } catch (err) {
      console.error(err);
    }
  };

  // Quiz submission
  const handleCheckQuiz = () => {
    const current = quizBlueprint[quizIdx];
    if (!current) return;

    let isCorrect = false;
    if (current.type === "listening" || current.type === "context") {
      isCorrect = quizSelectedOpt === current.correct_answer;
    } else {
      isCorrect = quizWritingAns.trim().toLowerCase() === current.correct_answer.trim().toLowerCase();
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
      setQuizSelectedOpt(null);
      setQuizWritingAns("");
      setQuizChecked(false);
      setQuizCorrect(null);
      setSpeakingResult(null);
    } else {
      setFinishingQuiz(true);
      try {
        const correctCount = quizBlueprint.length - quizMistakes.length;
        const score = Math.round((correctCount / quizBlueprint.length) * 100);
        await apiJson("/lessons/quiz/korean1/phase-3/finish", {
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

  // Speaking check for Quiz speaking prompt
  const handleSpeechEvaluate = async () => {
    const current = quizBlueprint[quizIdx];
    if (!rec.audioBlob || !current) return;
    setSpeakingTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("target_text", current.correct_answer);
      fd.append("audio_file", rec.audioBlob, "recording.webm");
      const res = await apiForm("/speech/shadow", fd);
      setSpeakingResult(res);
      if (res.similarity_score >= 60) {
        setQuizWritingAns(current.correct_answer);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSpeakingTranscribing(false);
    }
  };

  // Homework check toggler
  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/lessons/phases/korean1/3/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Tutor session starter
  const handleLaunchTutor = async () => {
    setLoadingTutor(true);
    try {
      const res = await apiJson("/lessons/tutor/numbers-practice/start", { method: "POST" });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col justify-between max-w-2xl mx-auto w-full">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-zinc-900 border border-white/10">
            <BookOpen className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg flex items-center gap-2">
              <span>{activeLesson?.title || "Numbers & Everyday Facts"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: Numbers & Time</p>
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
          
          <h2 className="text-4xl font-black text-white">Korean 1.3</h2>
          <h3 className="text-xl font-bold text-brand-400 mt-1">Numbers & Everyday Facts</h3>
          
          <p className="text-zinc-300 text-sm leading-relaxed max-w-md mx-auto">
            {metadata?.description || "Say basic numbers and understand simple time and everyday information."}
          </p>

          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-2 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Read and understand basic numbers in Korean",
                "Recognize simple time and factual information (age, price, phone)",
                "Answer simple 'How old / How much / What time?' questions at A1 level"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 20} minutes</p>
            <p><strong>📋 Prerequisites:</strong> {metadata?.prerequisites || "Korean 1.2 – Introducing Yourself"}</p>
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
              <p>✓ Activity 1 – Sino-Korean Numbers catalog and audio drills</p>
              <p>✓ Activity 2 – Listening & recognition plain and sentence numbers</p>
              <p>✓ Activity 3 – Simple time clock-mapping matches</p>
              <p>✓ Activity 4 – Everyday facts (age, price, phone digits) checks</p>
              <p>✓ Activity 5 – Graduating checkpoint mini-quiz checks</p>
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
              <span>Numbers & Simple Time</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-2 text-xs leading-relaxed text-zinc-300">
            <p><strong>🔢 Sino-Korean Numbers:</strong> Used for phone numbers, prices, dates, and minutes. Combine them logically: 십 (10) + 일 (1) = 십일 (11).</p>
            <p><strong>🕒 Time:</strong> Telling time uses Native numbers for hours (시) and Sino numbers for minutes (분). We will practice simple hours today.</p>
          </div>

          {/* Core Numbers Inventory Grid */}
          <div className="space-y-3">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">1. Sino-Korean Numbers Inventory</span>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {coreData?.numbers?.map((num: any) => {
                const isFlipped = flippedNumDigit === num.digit;
                return (
                  <div
                    key={num.digit}
                    onClick={() => {
                      setFlippedNumDigit(isFlipped ? null : num.digit);
                      playAudio(num.ko);
                    }}
                    className={`glass-panel p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                      isFlipped ? "border-brand-500 bg-brand-500/5" : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800"
                    }`}
                  >
                    {!isFlipped ? (
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-zinc-500">{num.digit}</div>
                        <div className="text-lg font-black text-white font-korean">{num.ko}</div>
                      </div>
                    ) : (
                      <div className="animate-fade-in space-y-0.5">
                        <div className="text-xs font-black text-brand-400">{num.en}</div>
                        <div className="text-[9px] text-zinc-500 font-mono">TTS Spoken</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time samples and facts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">2. Simple Hours Examples</span>
              <div className="space-y-2">
                {coreData?.time_samples?.map((t: any) => (
                  <div key={t.time} className="p-2.5 bg-zinc-950 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white pr-2">{t.time}</span>
                      <span className="font-korean text-zinc-300">{t.ko}</span>
                    </div>
                    <button onClick={() => playAudio(t.ko)} className="p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white"><Volume2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">3. Everyday Sentence Examples</span>
              <div className="space-y-2">
                {coreData?.example_sentences?.map((s: any, idx: number) => (
                  <div key={idx} className="p-2 bg-zinc-950 rounded-xl border border-white/5 text-[10px] text-left">
                    <div className="font-korean font-bold text-brand-300">{s.ko}</div>
                    <div className="text-zinc-400">{s.en}</div>
                    <div className="text-zinc-600 italic">{s.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Listening Comprehension */}
      {step === 3 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Activity 1 – Numbers Listening</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {listeningItems.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6">
              
              <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="text-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">
                    {listeningItems[listeningIdx]?.context_type === "plain number" ? "Drill: Hear and choose the number" : "Drill: Extract number from sentence"}
                  </span>
                  
                  <button
                    onClick={() => playAudio(listeningItems[listeningIdx]?.audio_text)}
                    className="p-5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-full mx-auto transition flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    <Volume2 className="w-8 h-8 animate-pulse" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  {listeningItems[listeningIdx]?.digit_options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !listeningChecked && setSelectedListeningOpt(opt)}
                      disabled={listeningChecked}
                      className={`p-3 rounded-xl border text-xs font-semibold transition ${
                        selectedListeningOpt === opt
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                      } ${listeningChecked && opt === listeningItems[listeningIdx]?.correct_digit ? "border-accent-teal bg-accent-teal/10" : ""}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {listeningChecked && (
                  <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                    listeningCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    <p className="font-extrabold">{listeningCorrect ? "Correct!" : "Incorrect."}</p>
                    <p>Korean: <strong className="text-white">{listeningItems[listeningIdx]?.audio_text}</strong></p>
                  </div>
                )}

                <div className="flex justify-end pt-1">
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
                          setListeningIdx(0);
                        }
                      }}
                      className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Next Audio Item
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(2)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 2: Simple Time & Facts */}
      {step === 4 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Activity 2 – Simple Time & Facts</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          {/* Part A: Time recognition */}
          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="text-left space-y-1">
              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Part A: simple hours matching</span>
              <p className="text-xs text-zinc-300">Listen and select the corresponding clock hours for: <strong className="text-brand-300">"{timeItems[timeIdx]?.ko_phrase}"</strong></p>
            </div>

            <div className="flex justify-center py-1">
              <button
                onClick={() => playAudio(timeItems[timeIdx]?.audio_text)}
                className="p-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full mx-auto transition flex items-center justify-center cursor-pointer animate-pulse"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
              {timeItems[timeIdx]?.options?.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => !timeChecked && setSelectedTimeOpt(opt)}
                  disabled={timeChecked}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                    selectedTimeOpt === opt
                      ? "border-brand-500 bg-brand-500/10 text-white"
                      : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                  } ${timeChecked && opt === timeItems[timeIdx]?.correct_option_id ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {timeChecked && (
              <div className={`p-3 rounded-xl border text-xs text-center ${
                timeCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
              }`}>
                {timeCorrect ? "Correct!" : `Incorrect. Correct time is ${timeItems[timeIdx]?.correct_option_id}.`}
              </div>
            )}

            <div className="flex justify-end pt-1">
              {!timeChecked ? (
                <button
                  onClick={handleCheckTime}
                  disabled={!selectedTimeOpt}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Verify Clock
                </button>
              ) : (
                <button
                  onClick={() => {
                    setTimeChecked(false);
                    setSelectedTimeOpt(null);
                    setTimeCorrect(null);
                    if (timeIdx < timeItems.length - 1) {
                      setTimeIdx(timeIdx + 1);
                    } else {
                      setTimeIdx(0);
                    }
                  }}
                  className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Next clock item
                </button>
              )}
            </div>
          </div>

          {/* Part B: Everyday Facts */}
          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="text-left space-y-1">
              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Part B: Everyday facts (age, price, phone)</span>
              <p className="text-xs text-zinc-300">{factsItems[factsIdx]?.question}</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {factsItems[factsIdx]?.options?.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => !factsChecked && setSelectedFactOpt(opt)}
                  disabled={factsChecked}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                    selectedFactOpt === opt
                      ? "border-brand-500 bg-brand-500/10 text-white"
                      : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                  } ${factsChecked && opt === factsItems[factsIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {factsChecked && (
              <div className={`p-3 rounded-xl border text-xs text-left space-y-1 ${
                factsCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
              }`}>
                <p className="font-bold">{factsCorrect ? "Correct!" : "Incorrect."}</p>
                <p className="text-[11px] text-zinc-400">{factsItems[factsIdx]?.explanation}</p>
              </div>
            )}

            <div className="flex justify-end pt-1">
              {!factsChecked ? (
                <button
                  onClick={handleCheckFacts}
                  disabled={!selectedFactOpt}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Check Fact
                </button>
              ) : (
                <button
                  onClick={() => {
                    setFactsChecked(false);
                    setSelectedFactOpt(null);
                    setFactsCorrect(null);
                    if (factsIdx < factsItems.length - 1) {
                      setFactsIdx(factsIdx + 1);
                    } else {
                      setFactsIdx(0);
                    }
                  }}
                  className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Next Fact Item
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(3)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Mini-Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Mini-Quiz Checkpoint */}
      {step === 5 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-400" />
              <span>Mini-Quiz: Numbers & Facts Check</span>
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
                    onClick={() => playAudio(quizBlueprint[quizIdx]?.audio_url ? quizBlueprint[quizIdx]?.correct_answer : quizBlueprint[quizIdx]?.correct_answer)}
                    className="p-5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full mx-auto transition flex items-center justify-center cursor-pointer"
                  >
                    <Volume2 className="w-8 h-8" />
                  </button>
                  <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                    {quizBlueprint[quizIdx]?.options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                        disabled={quizChecked}
                        className={`p-3 rounded-xl border text-xs font-bold transition ${
                          quizSelectedOpt === opt
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
              )}

              {quizBlueprint[quizIdx]?.type === "writing" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={quizWritingAns}
                    disabled={quizChecked}
                    onChange={(e) => setQuizWritingAns(e.target.value)}
                    placeholder="Type the exact Hangeul block..."
                    className="w-full bg-zinc-950 p-4 rounded-xl border border-white/5 text-center text-lg font-black text-white focus:outline-none focus:border-brand-500 font-sans"
                  />
                  {!quizChecked && (
                    <div className="flex gap-1.5 justify-center flex-wrap pt-2">
                      {["일", "이", "삼", "사", "오", "육", "칠", "팔", "구", "십"].map(ch => (
                        <button
                          key={ch}
                          onClick={() => setQuizWritingAns(v => v + ch)}
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
                  <p className="text-xs text-zinc-400">Bonus: Read the target phrase aloud to practice pronunciation.</p>
                  
                  <div className="flex justify-center items-center gap-3">
                    <button
                      onMouseDown={rec.start}
                      onMouseUp={rec.stop}
                      onTouchStart={rec.start}
                      onTouchEnd={rec.stop}
                      disabled={speakingTranscribing || quizChecked}
                      className={`p-5 rounded-full transition ${
                        rec.recording
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-brand-500/10 text-brand-400 border border-brand-500/25 hover:bg-brand-500/20"
                      }`}
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
                        ? !quizSelectedOpt 
                        : !quizWritingAns.trim()
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

      {/* Screen 6: Homework & Completion */}
      {step === 6 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0 animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Phase 3 Complete! 🔢🕰️</h2>
            <p className="text-zinc-400 text-xs">You scored {quizScore}% on your numbers check! You earned **150 XP**.</p>
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

          {/* AI practice room */}
          <div className="p-5 bg-zinc-900/60 rounded-2xl border border-white/5 space-y-4">
            <div className="text-left space-y-1">
              <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider block">Special AI Practice Mode</span>
              <h4 className="text-xs font-bold text-white">Practice numbers and telling time with Gwan-Sik</h4>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Starts a short, numbers mini-chat session where Gwan-Sik asks for your age, prices, and tells hours in Korean, correcting any pronunciation issues.
              </p>
            </div>

            {tutorSession ? (
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 text-left space-y-2">
                <span className="text-[9px] font-black text-brand-400 uppercase tracking-wider block">Numbers Coach Active Session</span>
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
                <span>Practice numbers with your AI tutor</span>
              </button>
            )}
          </div>

          <button
            onClick={onComplete}
            className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/20 cursor-pointer w-full max-w-xs"
          >
            <span>Finish Phase 3 & Earn XP</span>
            <ChevronRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      )}
      
      {/* Navigation bottom controls for non-quiz screens */}
      {step < 5 && step > 1 && (
        <div className="flex justify-between items-center py-4 border-t border-white/5 mt-6">
          <button 
            onClick={() => setStep(step - 1)} 
            className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button 
            onClick={() => setStep(step + 1)} 
            className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      
    </div>
  );
}
