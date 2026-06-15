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

interface Course2Phase4RoutineWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course2Phase4RoutineWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course2Phase4RoutineWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 6;

  // DB Data loaded
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);
  const [practiceVerbs, setPracticeVerbs] = useState<any[]>([]);
  const [practiceSentences, setPracticeSentences] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any>(null);
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);

  // Card flipping tracking
  const [flippedVerbId, setFlippedVerbId] = useState<string | null>(null);

  // Activity 1A verb matching states
  const [verbIdx, setVerbIdx] = useState(0);
  const [selectedVerbOpt, setSelectedVerbOpt] = useState<string | null>(null);
  const [verbChecked, setVerbChecked] = useState(false);
  const [verbCorrect, setVerbCorrect] = useState<boolean | null>(null);

  // Activity 1B sentence states
  const [sentIdx, setSentIdx] = useState(0);
  const [selectedSentOpt, setSelectedSentOpt] = useState<string | null>(null);
  const [sentChecked, setSentChecked] = useState(false);
  const [sentCorrect, setSentCorrect] = useState<boolean | null>(null);

  // Activity 2A Routine builder states
  const [morningChoice, setMorningChoice] = useState("일어나요");
  const [dayChoice, setDayChoice] = useState("학교에 가요");
  const [eveningChoice, setEveningChoice] = useState("자요");
  const [builtRoutine, setBuiltRoutine] = useState<any>(null);
  const [building, setBuilding] = useState(false);
  const [savingRoutine, setSavingRoutine] = useState(false);
  const [routineSaved, setRoutineSaved] = useState(false);

  // Quiz states
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizWritingAns, setQuizWritingAns] = useState("");
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Speaking check states
  const rec = useRecorder();
  const [speakingTranscribing, setSpeakingTranscribing] = useState(false);
  const [speakingResult, setSpeakingResult] = useState<any>(null);

  // Homework check states
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Tutor session launch states
  const [tutorSession, setTutorSession] = useState<any>(null);
  const [loadingTutor, setLoadingTutor] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/lessons/phases/korean1/4/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/lessons/phases/korean1/4/core-data");
          setCoreData(res);
        } else if (step === 3 && practiceVerbs.length === 0) {
          const res_v = await apiJson("/lessons/practice/daily-verbs/recognition");
          const res_s = await apiJson("/lessons/practice/daily-sentences/recognition");
          setPracticeVerbs(res_v.items || []);
          setPracticeSentences(res_s.items || []);
        } else if (step === 4 && !templates) {
          const res_t = await apiJson("/lessons/practice/routine/templates");
          setTemplates(res_t);
          if (res_t.morning?.length) setMorningChoice(res_t.morning[0].ko);
          if (res_t.daytime?.length) setDayChoice(res_t.daytime[0].ko);
          if (res_t.evening?.length) setEveningChoice(res_t.evening[0].ko);
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/lessons/quiz/korean1/phase-4/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean1/4/homework");
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

  // Activity 1A check
  const handleCheckVerb = async () => {
    const current = practiceVerbs[verbIdx];
    if (!current || !selectedVerbOpt) return;

    try {
      const res = await apiJson("/lessons/practice/daily-verbs/recognition/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_option: selectedVerbOpt,
          time_taken_ms: 1000
        })
      });
      setVerbChecked(true);
      setVerbCorrect(res.correct);
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 1B check
  const handleCheckSent = async () => {
    const current = practiceSentences[sentIdx];
    if (!current || !selectedSentOpt) return;

    try {
      const res = await apiJson("/lessons/practice/daily-sentences/recognition/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_option: selectedSentOpt,
          time_taken_ms: 1000
        })
      });
      setSentChecked(true);
      setSentCorrect(res.correct);
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 2A Routine Build
  const handleBuildRoutine = async () => {
    setBuilding(true);
    setBuiltRoutine(null);
    try {
      const lines = [
        `아침에 ${morningChoice}.`,
        `낮에 ${dayChoice}.`,
        `저녁에 ${eveningChoice}.`
      ];
      const res = await apiJson("/lessons/practice/routine/build", {
        method: "POST",
        body: JSON.stringify({ lines })
      });
      setBuiltRoutine(res);
    } catch (err) {
      console.error(err);
    } finally {
      setBuilding(false);
    }
  };

  const handleSaveRoutine = async () => {
    if (!builtRoutine) return;
    setSavingRoutine(true);
    try {
      await apiJson("/lessons/users/routine/save", {
        method: "POST",
        body: JSON.stringify({
          routine_text: builtRoutine.final_korean_text
        })
      });
      setRoutineSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRoutine(false);
    }
  };

  // Quiz check
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
        await apiJson("/lessons/quiz/korean1/phase-4/finish", {
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

  // Speaking voice verification
  const handleSpeechEvaluate = async () => {
    const current = quizBlueprint[quizIdx];
    const target = current ? current.correct_answer : (builtRoutine ? builtRoutine.final_korean_text : "일어나요");
    if (!rec.audioBlob) return;
    setSpeakingTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("target_text", target);
      fd.append("audio_file", rec.audioBlob, "recording.webm");
      const res = await apiForm("/speech/shadow", fd);
      setSpeakingResult(res);
      if (res.similarity_score >= 60) {
        setQuizWritingAns(target);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSpeakingTranscribing(false);
    }
  };

  // Homework check logging
  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/lessons/phases/korean1/4/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Tutor launcher
  const handleLaunchTutor = async () => {
    setLoadingTutor(true);
    try {
      const res = await apiJson("/lessons/tutor/routine-practice/start", { method: "POST" });
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
              <span>{activeLesson?.title || "Daily Activities"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: Everyday Verbs & Habit Conjugations</p>
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
          
          <h2 className="text-5xl font-black text-white tracking-tight">Korean 1.4</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Daily Activities</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Talk about what you do every day using simple present-tense sentences."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Learn high-frequency verbs for daily life (wake up, eat, go, study, etc.)",
                "Use polite present-tense patterns to talk about routines",
                "Describe a simple 'day in your life' at A1 level"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 25} minutes</p>
            <p><strong>📋 Prerequisites:</strong> {metadata?.prerequisites || "Korean 1.3 – Numbers & Everyday Facts"}</p>
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
              <p>✓ Activity 1 – Daily activities verb grids & card flips</p>
              <p>✓ Activity 2 – Present tense verb conjugation matches</p>
              <p>✓ Activity 3 – Multi-line routine builder paragraph assembler</p>
              <p>✓ Activity 4 – Spoken routine read-aloud assessment</p>
              <p>✓ Activity 5 – Graduating checkpoint mini-quiz checks</p>
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
              <span>Daily Verbs & Habit Patterns</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-2 text-xs leading-relaxed text-zinc-300">
            <p>To describe routines, Korean verbs are conjugated from their dictionary form (ends in -다) to the polite present form (ends in -요). 하다 verbs always conjugate to 해요.</p>
          </div>

          {/* Verbs Grid */}
          <div className="space-y-3">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">1. Core Daily Verbs Subset</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {coreData?.verbs?.map((v: any) => {
                const isFlipped = flippedVerbId === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => {
                      setFlippedVerbId(isFlipped ? null : v.id);
                      playAudio(v.polite);
                    }}
                    className={`glass-panel p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col justify-between h-28 ${
                      isFlipped ? "border-brand-500 bg-brand-500/5 shadow-[0_0_15px_rgba(79,70,229,0.1)]" : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-black uppercase text-zinc-500 font-mono tracking-widest">{v.tag}</span>
                      <button onClick={(e) => { e.stopPropagation(); playAudio(v.polite); }} className="p-1 rounded bg-zinc-950/40 text-zinc-400"><Volume2 className="w-3.5 h-3.5" /></button>
                    </div>

                    {!isFlipped ? (
                      <div className="py-1">
                        <div className="text-lg font-black text-white font-korean">{v.korean}</div>
                        <div className="text-[9px] text-brand-300">Conjugated: {v.polite}</div>
                      </div>
                    ) : (
                      <div className="animate-fade-in text-left space-y-0.5">
                        <div className="text-xs font-black text-white">{v.english}</div>
                        <div className="text-[9px] text-zinc-500 font-mono">Pron: {v.romanization}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pattern Card examples */}
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">2. Polite Routine Sentence Examples</span>
            <div className="grid grid-cols-1 gap-2">
              {coreData?.pattern_examples?.map((s: any, idx: number) => (
                <div key={idx} className="p-3 bg-zinc-950 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                  <div className="text-left">
                    <div className="font-korean font-bold text-white text-sm">{s.ko}</div>
                    <div className="text-zinc-400 mt-0.5">{s.en}</div>
                  </div>
                  <button onClick={() => playAudio(s.ko)} className="p-1.5 rounded bg-zinc-900 text-zinc-400 hover:text-white"><Volume2 className="w-4 h-4" /></button>
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

      {/* Screen 3: Activity 1: Recognition */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Verb & Sentence Recognition</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {/* Activity 1A: Match verb meaning */}
          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="text-left space-y-1 text-center">
              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Part A: Match verb meaning</span>
              <h4 className="text-lg font-black text-white font-korean">{practiceVerbs[verbIdx]?.korean}</h4>
            </div>

            <div className="flex justify-center">
              <button onClick={() => playAudio(practiceVerbs[verbIdx]?.korean)} className="p-4 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-brand-400 rounded-full transition flex items-center justify-center cursor-pointer shadow-md"><Volume2 className="w-6 h-6" /></button>
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
              {practiceVerbs[verbIdx]?.options.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => !verbChecked && setSelectedVerbOpt(opt)}
                  disabled={verbChecked}
                  className={`p-2 rounded-xl border text-xs font-bold transition ${
                    selectedVerbOpt === opt
                      ? "border-brand-500 bg-brand-500/10 text-white"
                      : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                  } ${verbChecked && opt === practiceVerbs[verbIdx]?.correct ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {verbChecked && (
              <div className={`p-3 rounded-xl border text-xs text-center ${
                verbCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
              }`}>
                {verbCorrect ? "Correct!" : "Incorrect."}
              </div>
            )}

            <div className="flex justify-end pt-1">
              {!verbChecked ? (
                <button
                  onClick={handleCheckVerb}
                  disabled={!selectedVerbOpt}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Check Verb
                </button>
              ) : (
                <button
                  onClick={() => {
                    setVerbChecked(false);
                    setSelectedVerbOpt(null);
                    setVerbCorrect(null);
                    if (verbIdx < practiceVerbs.length - 1) {
                      setVerbIdx(verbIdx + 1);
                    } else {
                      setVerbIdx(0);
                    }
                  }}
                  className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Next Verb Item
                </button>
              )}
            </div>
          </div>

          {/* Activity 1B: Identify activity from sentence */}
          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="text-left space-y-1 text-center">
              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Part B: Identify daily activity from sentence</span>
              <p className="text-xs text-zinc-300">Listen to the sentence and select the correct translation:</p>
            </div>

            <div className="flex justify-center">
              <button onClick={() => playAudio(practiceSentences[sentIdx]?.sentence)} className="p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 rounded-full transition flex items-center justify-center cursor-pointer shadow-md"><Volume2 className="w-6 h-6" /></button>
            </div>

            <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
              {practiceSentences[sentIdx]?.options.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => !sentChecked && setSelectedSentOpt(opt)}
                  disabled={sentChecked}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                    selectedSentOpt === opt
                      ? "border-brand-500 bg-brand-500/10 text-white"
                      : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                  } ${sentChecked && opt === practiceSentences[sentIdx]?.correct ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {sentChecked && (
              <div className={`p-3 rounded-xl border text-xs text-center ${
                sentCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
              }`}>
                {sentCorrect ? "Correct!" : "Incorrect."}
              </div>
            )}

            <div className="flex justify-end pt-1">
              {!sentChecked ? (
                <button
                  onClick={handleCheckSent}
                  disabled={!selectedSentOpt}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Verify Sentence
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSentChecked(false);
                    setSelectedSentOpt(null);
                    setSentCorrect(null);
                    if (sentIdx < practiceSentences.length - 1) {
                      setSentIdx(sentIdx + 1);
                    } else {
                      setSentIdx(0);
                    }
                  }}
                  className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Next Sentence Item
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(2)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 2: Routine Builder */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Build & Speak Routine</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          {/* Part A: Sentence Builder */}
          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Part A: Sentence Builder (Daily templates)</h3>
            
            <div className="space-y-3">
              <div className="space-y-1 text-left">
                <label className="text-[8px] text-zinc-500 uppercase font-black tracking-widest block">Morning Routine</label>
                <select
                  value={morningChoice}
                  onChange={(e) => setMorningChoice(e.target.value)}
                  className="w-full bg-zinc-950 p-2 rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  {templates?.morning?.map((t: any) => (
                    <option key={t.ko} value={t.ko}>In the morning, I {t.en} ({t.ko})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[8px] text-zinc-500 uppercase font-black tracking-widest block">Daytime Routine</label>
                <select
                  value={dayChoice}
                  onChange={(e) => setDayChoice(e.target.value)}
                  className="w-full bg-zinc-950 p-2 rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  {templates?.daytime?.map((t: any) => (
                    <option key={t.ko} value={t.ko}>During the day, I {t.en} ({t.ko})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[8px] text-zinc-500 uppercase font-black tracking-widest block">Evening Routine</label>
                <select
                  value={eveningChoice}
                  onChange={(e) => setEveningChoice(e.target.value)}
                  className="w-full bg-zinc-950 p-2 rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  {templates?.evening?.map((t: any) => (
                    <option key={t.ko} value={t.ko}>In the evening, I {t.en} ({t.ko})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={handleBuildRoutine}
                disabled={building}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-5 rounded-xl text-xs transition cursor-pointer"
              >
                {building ? "Building..." : "Assemble Routine Paragraph"}
              </button>
            </div>

            {builtRoutine && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 space-y-3 animate-fade-in text-center">
                <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Daily Routine Paragraph</span>
                <p className="text-base font-black text-white font-korean leading-relaxed">{builtRoutine.final_korean_text}</p>
                
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => playAudio(builtRoutine.final_korean_text)}
                    className="p-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-full border border-brand-500/20 transition cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleSaveRoutine}
                    disabled={savingRoutine || routineSaved}
                    className="bg-accent-teal hover:bg-accent-teal/95 disabled:opacity-50 text-zinc-950 font-black py-1.5 px-4 rounded-lg text-xs transition cursor-pointer"
                  >
                    {savingRoutine ? "Saving..." : routineSaved ? "Saved Successfully!" : "Save Routine to Profile"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Part B: Speaking Practice */}
          {builtRoutine && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-center">
              <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Part B: Speaking practice (Read routine aloud)</h3>
              <p className="text-xs text-zinc-400">Tap mic and read your assembled daily routine out loud:</p>

              <div className="flex justify-center items-center gap-3">
                <button
                  onMouseDown={rec.start}
                  onMouseUp={rec.stop}
                  onTouchStart={rec.start}
                  onTouchEnd={rec.stop}
                  disabled={speakingTranscribing}
                  className={`p-5 rounded-full transition ${
                    rec.recording
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-brand-500/10 text-brand-400 border border-brand-500/25 hover:bg-brand-500/20"
                  }`}
                >
                  {rec.recording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>

                {rec.audioBlob && !rec.recording && (
                  <button
                    onClick={handleSpeechEvaluate}
                    disabled={speakingTranscribing}
                    className="bg-zinc-850 hover:bg-zinc-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition border border-white/5 cursor-pointer"
                  >
                    {speakingTranscribing ? "Evaluating..." : "Verify Pronunciation"}
                  </button>
                )}
              </div>

              {speakingResult && (
                <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 text-left text-xs space-y-1.5 max-w-sm mx-auto">
                  <p className="font-black text-white">Match Accuracy: {speakingResult.similarity_score.toFixed(0)}%</p>
                  <p className="text-zinc-400">STT Transcription: "{speakingResult.recognized_text || "..."}"</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Mini-Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Mini-Quiz Checkpoint */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Mini-Quiz: Daily Routine Check</span>
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
                      {["자요", "일어나요", "먹어요", "마셔요", "일해요", "공부해요"].map(ch => (
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
                  <p className="text-xs text-zinc-400">Bonus: Read the routine sentence aloud for evaluation.</p>
                  
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
                      <p className="text-zinc-400">Heard: "{speakingResult.transcription || speakingResult.recognized_text || "..."}"</p>
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

      {/* Screen 6: Homework & AI Routine Practice */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0 animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Phase 4 Complete! 🇰🇷🏃‍♂️</h2>
            <p className="text-zinc-400 text-xs">You scored {quizScore}% on your routines check! You earned **150 XP**.</p>
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

          {/* AI practice button */}
          <div className="p-5 bg-zinc-900/60 rounded-2xl border border-white/5 space-y-4">
            <div className="text-left space-y-1">
              <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider block">Special AI Practice Mode</span>
              <h4 className="text-xs font-bold text-white">Routine dialog coaching with Gwan-Sik</h4>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Starts a short routine conversation room where Gwan-Sik asks what you do during mornings/evenings, correcting verb conjugation endings.
              </p>
            </div>

            {tutorSession ? (
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 text-left space-y-2">
                <span className="text-[9px] font-black text-brand-400 uppercase tracking-wider block">Routine Coach Active Session</span>
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
                <span>Practice your daily routine with your AI tutor</span>
              </button>
            )}
          </div>

          <button
            onClick={onComplete}
            className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/20 cursor-pointer w-full max-w-xs"
          >
            <span>Finish Phase 4 & Earn XP</span>
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
