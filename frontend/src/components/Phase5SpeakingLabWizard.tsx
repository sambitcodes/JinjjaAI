"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  BarChart2,
  Award,
  RefreshCw,
  Play,
  HelpCircle,
  BookOpen,
  BrainCircuit,
  BookMarked
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function apiJson(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const cleanPath = (path.startsWith("/phases/") || path.startsWith("/quiz/") || path.startsWith("/practice/") || path.startsWith("/speaking/")) ? `/lessons${path}` : path;
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
  const cleanPath = (path.startsWith("/phases/") || path.startsWith("/quiz/") || path.startsWith("/practice/") || path.startsWith("/speaking/")) ? `/lessons${path}` : path;
  const res = await fetch(`${API_BASE}${cleanPath}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

// Web Audio API Sound synthesizers
const playCorrectSound = () => {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
    osc.stop(ctx.currentTime + 0.22);
  } catch (e) {
    console.warn("Audio synthesis error:", e);
  }
};

const playWrongSound = () => {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch (e) {
    console.warn("Audio synthesis error:", e);
  }
};

// Audio recording hook
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
      alert("Microphone access denied. Please allow microphone permissions in your browser and try again.");
    }
  }, []);

  const stop = useCallback(() => {
    mediaRef.current?.stop();
    setRecording(false);
  }, []);

  return { recording, audioBlob, start, stop, setAudioBlob };
}

function ScoreBar({ score, label }: { score: number; label?: string }) {
  const color =
    score >= 80 ? "bg-emerald-500" : score >= 55 ? "bg-amber-400" : "bg-red-500";
  const textColor =
    score >= 80 ? "text-emerald-400" : score >= 55 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-1">
      {label && <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-sans">{label}</span>}
      <div className="flex items-center gap-3">
        <div className="flex-grow h-3 bg-zinc-850 rounded-full overflow-hidden border border-white/5">
          <div
            className={`h-full ${color} rounded-full transition-all duration-700`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
        <span className={`text-xs font-mono font-black ${textColor} w-12 text-right`}>{score.toFixed(0)}/100</span>
      </div>
    </div>
  );
}

function WordDiffRow({ diffs }: { diffs: Array<{ word: string; status: string }> }) {
  if (!diffs?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 justify-center py-2">
      {diffs.map((d, i) => (
        <span
          key={i}
          className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
            d.status === "correct"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {d.word}
        </span>
      ))}
    </div>
  );
}

function RecordButton({
  recording,
  onStart,
  onStop,
  disabled,
}: {
  recording: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onMouseDown={onStart}
      onMouseUp={onStop}
      onTouchStart={onStart}
      onTouchEnd={onStop}
      onClick={recording ? onStop : onStart}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-xs transition uppercase tracking-wider cursor-pointer ${
        recording
          ? "bg-red-500 hover:bg-red-650 text-white animate-pulse shadow-lg shadow-red-500/30"
          : "bg-brand-500 hover:bg-brand-600 text-zinc-950 shadow-lg shadow-brand-500/15"
      } disabled:opacity-40`}
    >
      {recording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-zinc-950" />}
      <span>{recording ? "Recording..." : "Hold to Record"}</span>
    </button>
  );
}

interface Phase5SpeakingLabWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

interface MicroQuestion {
  question: string;
  options: { id: string; text: string }[];
  correctId: string;
  explanation: string;
}

export default function Phase5SpeakingLabWizard({ activeLesson, speakWord, onComplete }: Phase5SpeakingLabWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 12;

  // Screen 1 — Calibration
  const [metadata, setMetadata] = useState<any>(null);
  const [setupResult, setSetupResult] = useState<any>(null);
  const [testingSetup, setTestingSetup] = useState(false);
  const rec1 = useRecorder();

  // Concept Micro-questions definitions
  const conceptQuestions: Record<number, MicroQuestion> = {
    2: {
      question: "What is the primary target of this speaking lab?",
      options: [
        { id: "A", text: "Analyzing grammar particles and word roots" },
        { id: "B", text: "Getting mouth coordination comfortable and making sounds clearly" }
      ],
      correctId: "B",
      explanation: "This lab is focused on oral production, shadowing rhythm, and confidence rather than written grammar analysis."
    },
    3: {
      question: "In shadowing, what should you focus on copying most closely?",
      options: [
        { id: "A", text: "The native rhythm, pitch, and speed" },
        { id: "B", text: "Individual character stroke structures" }
      ],
      correctId: "A",
      explanation: "Shadowing trains your ears and tongue simultaneously by mimicking oral rhythm and pacing."
    },
    4: {
      question: "If speech recognition transcribes one of your syllables incorrectly, what should you do first?",
      options: [
        { id: "A", text: "Slow down, listen again, and repeat the target sound exaggeratedly" },
        { id: "B", text: "Speak as fast as possible to bypass the mic filter" }
      ],
      correctId: "A",
      explanation: "ASR benefits from clear, steady vocalization. Speeding up usually decreases detection accuracy."
    },
    5: {
      question: "Which pattern frame is designed to introduce what you like?",
      options: [
        { id: "A", text: "저는 _ 이에요" },
        { id: "B", text: "저는 _ 좋아해요" }
      ],
      correctId: "B",
      explanation: "좋아해요 is the verb meaning 'like', making this pattern correct for expressing preferences."
    },
    6: {
      question: "What does 'good enough' pronunciation mean at Course 0 beginner level?",
      options: [
        { id: "A", text: "Recognizable syllables spoken with comfortable flow rather than robot pauses" },
        { id: "B", text: "Having a native, flawless accent indistinguishable from a local" }
      ],
      correctId: "A",
      explanation: "At the beginner level, focus on comprehensible sounds and smooth, confident speech. Accents refine naturally over time."
    }
  };

  // Micro-question states for C1-C5
  const [cSelected, setCSelected] = useState<string | null>(null);
  const [cChecked, setCChecked] = useState(false);
  const [cCorrect, setCCorrect] = useState<boolean | null>(null);

  // Reset micro-question state when moving between concept screens
  useEffect(() => {
    if (step >= 2 && step <= 6) {
      setCSelected(null);
      setCChecked(false);
      setCCorrect(null);
    }
  }, [step]);

  // Screen 7 — Shadowing
  const [shadowItems, setShadowItems] = useState<any[]>([]);
  const [shadowIdx, setShadowIdx] = useState(0);
  const [shadowResult, setShadowResult] = useState<any>(null);
  const [submittingShadow, setSubmittingShadow] = useState(false);
  const [shadowScores, setShadowScores] = useState<number[]>([]);
  const [showKorean, setShowKorean] = useState(true);
  const rec2 = useRecorder();

  // Screen 8 — Pronunciation drill
  const [phonemeTargets, setPhonemeTargets] = useState<any[]>([]);
  const [phonemeIdx, setPhonemeIdx] = useState(0);
  const [phonemeExIdx, setPhonemeExIdx] = useState(0);
  const [phonemeResult, setPhonemeResult] = useState<any>(null);
  const [submittingPhoneme, setSubmittingPhoneme] = useState(false);
  const [aiFeedback3, setAiFeedback3] = useState<string | null>(null);
  const [loadingFeedback3, setLoadingFeedback3] = useState(false);
  const rec3 = useRecorder();

  // Screen 9 — Patterns
  const [patterns, setPatterns] = useState<any[]>([]);
  const [patIdx, setPatIdx] = useState(0);
  const [patSlot, setPatSlot] = useState("");
  const [patResult, setPatResult] = useState<any>(null);
  const [submittingPat, setSubmittingPat] = useState(false);
  const [aiFeedback4, setAiFeedback4] = useState<string | null>(null);
  const [loadingFeedback4, setLoadingFeedback4] = useState(false);
  const rec4 = useRecorder();

  // Screen 10 — Free tasks
  const [freeTasks, setFreeTasks] = useState<any[]>([]);
  const [freeIdx, setFreeIdx] = useState(0);
  const [freeResult, setFreeResult] = useState<any>(null);
  const [submittingFree, setSubmittingFree] = useState(false);
  const [freeScores, setFreeScores] = useState<number[]>([]);
  const rec5 = useRecorder();

  // Screen 11 — Assessment
  const [assessmentBlueprint, setAssessmentBlueprint] = useState<any[]>([]);
  const [assessIdx, setAssessIdx] = useState(0);
  const [assessResult, setAssessResult] = useState<any>(null);
  const [submittingAssess, setSubmittingAssess] = useState(false);
  const [assessAttempts, setAssessAttempts] = useState<any[]>([]);
  const [finalAssessment, setFinalAssessment] = useState<any>(null);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const rec6 = useRecorder();

  // Screen 12 — Summary
  const [summary, setSummary] = useState<any>(null);

  // Fetch Step Data Dynamically
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/speaking/phase5/metadata");
          setMetadata(res);
        } else if (step === 7 && shadowItems.length === 0) {
          const res = await apiJson("/speaking/shadowing/items");
          setShadowItems(res || []);
        } else if (step === 8 && phonemeTargets.length === 0) {
          const res = await apiJson("/speaking/pronunciation/targets");
          setPhonemeTargets(res || []);
        } else if (step === 9 && patterns.length === 0) {
          const res = await apiJson("/speaking/patterns");
          setPatterns(res || []);
          if (res?.length) setPatSlot(res[0].slot_options?.[0] || "");
        } else if (step === 10 && freeTasks.length === 0) {
          const res = await apiJson("/speaking/free-tasks");
          setFreeTasks(res || []);
        } else if (step === 11 && assessmentBlueprint.length === 0) {
          const res = await apiJson("/speaking/assessment/start", { method: "POST" });
          setAssessmentBlueprint(res.blueprint || []);
        } else if (step === 12 && !summary) {
          const res = await apiJson("/speaking/phase5/summary");
          setSummary(res);
        }
      } catch (err) {
        console.error(`Failed to load step ${step} data:`, err);
      }
    };
    load();
  }, [step]);

  const handleCheckConceptQuestion = () => {
    const q = conceptQuestions[step];
    if (!q || !cSelected) return;
    const isCorrect = cSelected === q.correctId;
    setCChecked(true);
    setCCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  const handleSetupTest = async () => {
    if (!rec1.audioBlob) return;
    setTestingSetup(true);
    try {
      const fd = new FormData();
      fd.append("audio_file", rec1.audioBlob, "setup.webm");
      const res = await apiForm("/speaking/check-setup", fd);
      setSetupResult(res);
      if (res.stt_ok) playCorrectSound();
      else playWrongSound();
    } catch {
      setSetupResult({ stt_ok: false, hint: "Could not connect to the speech service. Check the backend." });
      playWrongSound();
    } finally {
      setTestingSetup(false);
    }
  };

  const handleShadowSubmit = async () => {
    const current = shadowItems[shadowIdx];
    if (!rec2.audioBlob || !current) return;
    setSubmittingShadow(true);
    setShadowResult(null);
    try {
      const fd = new FormData();
      fd.append("target_text", current.target_text_ko);
      fd.append("item_id", current.id);
      fd.append("audio_file", rec2.audioBlob, "recording.webm");
      const res = await apiForm("/speaking/shadowing/attempt", fd);
      setShadowResult(res);
      setShadowScores((prev) => [...prev, res.similarity_score]);
      if (res.similarity_score >= 60) playCorrectSound();
      else playWrongSound();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingShadow(false);
    }
  };

  const handlePhonemeSubmit = async () => {
    const target = phonemeTargets[phonemeIdx];
    if (!rec3.audioBlob || !target) return;
    const example = target.examples[phonemeExIdx];
    setSubmittingPhoneme(true);
    setPhonemeResult(null);
    setAiFeedback3(null);
    try {
      const fd = new FormData();
      fd.append("target_text", example.word);
      fd.append("sound_category", target.sound_category);
      fd.append("audio_file", rec3.audioBlob, "recording.webm");
      const res = await apiForm("/speaking/pronunciation/attempt", fd);
      setPhonemeResult(res);
      if (res.similarity_score >= 60) playCorrectSound();
      else playWrongSound();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPhoneme(false);
    }
  };

  const handleAiFeedback3 = async () => {
    const target = phonemeTargets[phonemeIdx];
    if (!phonemeResult || !target) return;
    setLoadingFeedback3(true);
    try {
      const res = await apiJson("/speaking/pronunciation/feedback", {
        method: "POST",
        body: JSON.stringify({
          target_text: target.examples[phonemeExIdx].word,
          recognized_text: phonemeResult.recognized_text || "",
          similarity_score: phonemeResult.similarity_score || 0,
          sound_category: target.sound_category,
        }),
      });
      setAiFeedback3(res.feedback);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeedback3(false);
    }
  };

  const handlePatternSubmit = async () => {
    const pat = patterns[patIdx];
    if (!rec4.audioBlob || !pat) return;
    const expected = pat.example_complete_ko.replace(/_/, patSlot || pat.slot_options[0]);
    setSubmittingPat(true);
    setPatResult(null);
    setAiFeedback4(null);
    try {
      const fd = new FormData();
      fd.append("pattern_id", pat.id);
      fd.append("expected_text", expected);
      fd.append("audio_file", rec4.audioBlob, "recording.webm");
      const res = await apiForm("/speaking/pattern/attempt", fd);
      setPatResult(res);
      if (res.similarity_score >= 60) playCorrectSound();
      else playWrongSound();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPat(false);
    }
  };

  const handleAiFeedback4 = async () => {
    const pat = patterns[patIdx];
    if (!patResult || !pat) return;
    setLoadingFeedback4(true);
    try {
      const res = await apiJson("/speaking/pattern/feedback", {
        method: "POST",
        body: JSON.stringify({
          target_text: patResult.expected_text || "",
          recognized_text: patResult.recognized_text || "",
          similarity_score: patResult.similarity_score || 0,
        }),
      });
      setAiFeedback4(res.feedback);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeedback4(false);
    }
  };

  const handleFreeSubmit = async (useAi: boolean) => {
    const task = freeTasks[freeIdx];
    if (!rec5.audioBlob || !task) return;
    setSubmittingFree(true);
    setFreeResult(null);
    try {
      const fd = new FormData();
      fd.append("task_id", task.id);
      fd.append("prompt_text", task.prompt_en);
      fd.append("use_ai", String(useAi));
      fd.append("audio_file", rec5.audioBlob, "recording.webm");
      const res = await apiForm("/speaking/free-tasks/attempt", fd);
      setFreeResult(res);
      setFreeScores((prev) => [...prev, res.fluency_score]);
      if (res.fluency_score >= 60) playCorrectSound();
      else playWrongSound();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFree(false);
    }
  };

  const handleAssessmentAttempt = async () => {
    const item = assessmentBlueprint[assessIdx];
    if (!rec6.audioBlob || !item) return;
    setSubmittingAssess(true);
    setAssessResult(null);
    try {
      const fd = new FormData();
      fd.append("target_text", item.target);
      fd.append("item_id", item.item_id);
      fd.append("audio_file", rec6.audioBlob, "recording.webm");
      const res = await apiForm("/speaking/shadowing/attempt", fd);
      setAssessResult(res);
      setAssessAttempts((prev) => [
        ...prev,
        {
          target: item.target,
          recognized: res.recognized_text,
          score: res.similarity_score,
          type: item.type,
        },
      ]);
      if (res.similarity_score >= 65) playCorrectSound();
      else playWrongSound();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAssess(false);
    }
  };

  const handleSubmitFinal = async () => {
    setSubmittingFinal(true);
    try {
      const res = await apiJson("/speaking/assessment/submit", {
        method: "POST",
        body: JSON.stringify({ items: assessAttempts }),
      });
      setFinalAssessment(res);
      if (res.passed) playCorrectSound();
      else playWrongSound();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFinal(false);
    }
  };

  const outlineSteps = [
    { num: 1, label: "Overview & Mic Check" },
    { num: 2, label: "C1: From Reading to Speaking" },
    { num: 3, label: "C2: What is Shadowing?" },
    { num: 4, label: "C3: Evaluation & ASR" },
    { num: 5, label: "C4: Controlled Patterns" },
    { num: 6, label: "C5: Competency Levels" },
    { num: 7, label: "Act 1: Guided Shadowing" },
    { num: 8, label: "Act 2: Phoneme drills" },
    { num: 9, label: "Act 3: Pattern Slots" },
    { num: 10, label: "Act 4: Free Speaking" },
    { num: 11, label: "Syllable Speech Check" },
    { num: 12, label: "Completion & Summary" }
  ];

  return (
    <div className="flex-grow flex flex-col justify-between max-w-5xl mx-auto w-full px-4">
      {/* Top Header tracking */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center py-5 border-b border-white/5 mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-950 border border-white/10 shadow-lg">
            <BookMarked className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Phase 5</span>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>Speaking & Listening Lab</span>
            </h2>
            <p className="text-xs text-zinc-400">Curated Topic: {activeLesson?.topic || "Listen, Shadow & Speak"}</p>
          </div>
        </div>
        
        {/* Active progress bar */}
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div className="flex-grow md:w-48 h-3 bg-zinc-900/80 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-brand-500 via-orange-500 to-amber-500 rounded-full transition-all duration-500" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-mono font-black text-white">{Math.round((step / totalSteps) * 100)}%</span>
            <span className="text-[10px] text-zinc-500 font-bold block">Step {step} of {totalSteps}</span>
          </div>
          <button 
            onClick={() => setShowOutline(!showOutline)}
            className="text-[10px] bg-zinc-950 border border-white/10 hover:bg-zinc-900 text-zinc-300 px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer uppercase tracking-wider font-bold shrink-0"
          >
            {showOutline ? "Hide Maps" : "View Outline"}
          </button>
        </div>
      </header>

      {/* Expanded Quick Outline Map Panel */}
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
                className={`p-2.5 rounded-xl border text-left transition ${
                  step === s.num
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

      {/* Step 1: Welcome & Calibration */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center max-w-xl mx-auto my-4 transition duration-300">
          <div className="p-4 bg-brand-500/10 rounded-3xl border border-brand-500/25 w-fit mx-auto text-brand-400 shadow-inner animate-pulse">
            <Sparkles className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-5xl font-black text-white tracking-tight">Hangeul 0.5</h2>
            <h3 className="text-2xl font-extrabold text-brand-400">Speaking & Listening Lab</h3>
          </div>
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed font-sans font-medium">
            {metadata?.description || "Move from silent reading to out-loud oral production. Shadow sentences, master phoneme drills, use sentence frames, and complete self-paced free speaking."}
          </p>

          <div className="bg-zinc-950/80 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-2.5 shadow-inner">
            <p className="font-black text-white text-xs border-b border-white/5 pb-1 uppercase tracking-wider">Calibration Steps:</p>
            {(metadata?.setup_tips || [
              "Find a quiet room with minimal background noise",
              "Keep your mic about 2-3 inches away from your mouth",
              "Speak clearly at a relaxed, conversational speed",
              "Use headphones to avoid speaker loopback"
            ]).map((t: string, idx: number) => (
              <p key={idx}>✓ {t}</p>
            ))}
          </div>

          <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 space-y-4">
            <p className="text-xs text-zinc-400 font-bold">Microphone Test Calibration:</p>
            <p className="text-sm text-zinc-300">Say <strong className="text-white">안녕하세요</strong> (hello) below:</p>
            <div className="flex justify-center gap-3">
              <RecordButton recording={rec1.recording} onStart={rec1.start} onStop={rec1.stop} />
              {rec1.audioBlob && !rec1.recording && (
                <button
                  onClick={handleSetupTest}
                  disabled={testingSetup}
                  className="flex items-center gap-1.5 px-4.5 py-3 bg-zinc-950 hover:bg-zinc-900 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider transition duration-200 cursor-pointer"
                >
                  {testingSetup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-brand-400" />}
                  <span>Check Mic</span>
                </button>
              )}
            </div>

            {setupResult && (
              <div className={`p-4 rounded-xl border text-xs text-left flex items-start gap-2.5 ${
                setupResult.stt_ok ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/20 text-red-400"
              }`}>
                {setupResult.stt_ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-bold">{setupResult.stt_ok ? "Microphone & Speech recognition online!" : "Calibration Check Failed"}</p>
                  {setupResult.transcription && <p className="text-zinc-400 mt-0.5">Heard: "{setupResult.transcription}"</p>}
                  {!setupResult.stt_ok && <p className="text-zinc-400 mt-0.5">{setupResult.hint}</p>}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setStep(2)}
            className="bg-brand-500 hover:bg-brand-600 text-zinc-950 font-black py-4 px-10 rounded-2xl transition duration-200 text-sm flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-lg shadow-brand-500/20 active:scale-95 animate-pulse"
          >
            <span>Begin Speaking Lab</span>
            <ChevronRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      )}

      {/* Screen 2-6: Concept Screens (C1-C5) */}
      {step >= 2 && step <= 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center max-w-3xl mx-auto my-4 transition duration-300">
          
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 font-sans tracking-tight">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>
                {step === 2 && "C1: From Reading to Speaking"}
                {step === 3 && "C2: What is Shadowing?"}
                {step === 4 && "C3: Speech Recognition & ASR Feedback"}
                {step === 5 && "C4: Controlled Sentence Frames & Patterns"}
                {step === 6 && "C5: Competency Expectations at Course 0"}
              </span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black uppercase">Theory Screen {step - 1} of 5</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Left Content column */}
            <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
              {step === 2 && (
                <>
                  <p className="font-medium">
                    You've learned Hangeul structures, vowel layouts, and proper nouns. Now we bridge reading skills into oral production:
                  </p>
                  <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
                    <p>• Speak with loud, clear pronunciation.</p>
                    <p>• Avoid speaking like a robot; syllables merge in natural speech.</p>
                    <p>• Don't worry about complex vocabulary or perfect grammar rules yet.</p>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <p className="font-medium">
                    Shadowing is a speech technique that involves listening to a sentence and repeating it immediately:
                  </p>
                  <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
                    <p>• Listen to native rhythm, speed, and pitch contours.</p>
                    <p>• Speak directly along with or immediately after the speaker.</p>
                    <p>• Matches your brain's auditory processing to your tongue's motor output.</p>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <p className="font-medium">
                    This platform uses Automatic Speech Recognition (ASR) to check your pronunciation:
                  </p>
                  <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
                    <p>• **Transcription Check:** Maps your speech to target Hangeul characters.</p>
                    <p>• **Similarity Score:** Measures acoustic similarity to native files.</p>
                    <p>• **Word Difference:** Highlights missed words or skipped syllables.</p>
                  </div>
                </>
              )}

              {step === 5 && (
                <>
                  <p className="font-medium">
                    Guided patterns allow you to convey real meaning by exchanging simple components:
                  </p>
                  <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
                    <p>• **저는 X이에요:** I am X (name, country, or job).</p>
                    <p>• **저는 X 좋아해요:** I like X (beverages, foods, cities).</p>
                    <p>These blocks let you construct hundreds of custom sentences.</p>
                  </div>
                </>
              )}

              {step === 6 && (
                <>
                  <p className="font-medium">
                    At Course 0, you are not expected to sound native. Focus on:
                  </p>
                  <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
                    <p>• **Comprehensibility:** Can a Korean speaker distinguish your vowels and consonants?</p>
                    <p>• **Confidence:** Speaking without heavy pauses between syllables.</p>
                    <p>• **Continuous Flow:** Basic breathing pacing.</p>
                  </div>
                </>
              )}
            </div>

            {/* Right Question column */}
            <div className="bg-zinc-950/80 p-6 rounded-3xl border border-white/5 flex flex-col justify-between shadow-inner">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-zinc-400">
                  <HelpCircle className="w-4 h-4 text-brand-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Concept Checkpoint</span>
                </div>
                
                <h4 className="text-sm font-black text-white leading-snug">
                  {conceptQuestions[step]?.question}
                </h4>

                <div className="space-y-2">
                  {conceptQuestions[step]?.options.map((opt) => (
                    <button
                      key={opt.id}
                      disabled={cChecked}
                      onClick={() => setCSelected(opt.id)}
                      className={`w-full p-3.5 rounded-xl text-left text-xs font-bold border transition duration-200 ${
                        cSelected === opt.id
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-900"
                      } ${
                        cChecked && opt.id === conceptQuestions[step]?.correctId
                          ? "border-accent-teal bg-accent-teal/10 text-white"
                          : ""
                      } ${
                        cChecked && cSelected === opt.id && cSelected !== conceptQuestions[step]?.correctId
                          ? "border-red-500 bg-red-500/10 text-red-400"
                          : ""
                      }`}
                    >
                      <span className="inline-block mr-2 text-brand-400">{opt.id}.</span>
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 space-y-4">
                {!cChecked ? (
                  <button
                    onClick={handleCheckConceptQuestion}
                    disabled={!cSelected}
                    className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-zinc-950 font-black py-3 rounded-xl text-xs transition duration-200 uppercase tracking-widest shadow-md shadow-brand-500/15 cursor-pointer"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <div className={`p-4 rounded-xl border text-xs text-left animate-in slide-in-from-bottom-2 duration-200 ${
                    cCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <span className="uppercase text-[9px] tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-white/5">
                        {cCorrect ? "Correct" : "Incorrect"}
                      </span>
                    </div>
                    <p className="text-zinc-300 leading-normal">{conceptQuestions[step]?.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-white/5">
            <button 
              onClick={() => setStep(step - 1)} 
              className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> 
              <span>Back</span>
            </button>
            <button 
              onClick={() => setStep(step + 1)}
              disabled={!cChecked}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-30 disabled:hover:bg-brand-500 text-zinc-950 px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4 text-zinc-950" />
            </button>
          </div>
        </div>
      )}

      {/* Screen 7: Activity 1 (Guided Shadowing) */}
      {step === 7 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center max-w-3xl mx-auto my-4 transition duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <Volume2 className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Sentence Shadowing Lab</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black">{shadowIdx + 1}/{shadowItems.length}</span>
          </div>

          {shadowItems.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="max-w-xl mx-auto w-full space-y-6 text-center">
              {shadowScores.length > 0 && (
                <ScoreBar
                  label={`Session average (${shadowScores.length} sentences)`}
                  score={Math.round(shadowScores.reduce((a, b) => a + b, 0) / shadowScores.length)}
                />
              )}

              {/* Shadow Card */}
              <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-zinc-900/40 space-y-4 shadow-xl">
                <div className="flex justify-center gap-2 mb-2">
                  <button
                    onClick={() => setShowKorean((v) => !v)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 border border-white/10 px-3 py-1 rounded-lg transition duration-200"
                  >
                    {showKorean ? "Hide Hangeul" : "Show Hangeul"}
                  </button>
                </div>

                {showKorean && (
                  <div className="text-4xl font-black text-white leading-normal filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.05)]">
                    {shadowItems[shadowIdx].target_text_ko}
                  </div>
                )}
                <p className="text-xs text-zinc-500 font-mono">{shadowItems[shadowIdx].romanization}</p>
                <p className="text-sm text-zinc-300 italic">{shadowItems[shadowIdx].english_gloss}</p>

                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => speakWord(shadowItems[shadowIdx].target_text_ko)}
                    className="flex items-center gap-1.5 px-4.5 py-3 rounded-xl bg-zinc-950 text-brand-400 hover:text-white border border-white/10 transition duration-200 text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 animate-bounce" />
                    <span>Play Audio</span>
                  </button>
                </div>
              </div>

              {/* Shadow Controls */}
              <div className="space-y-4">
                <RecordButton
                  recording={rec2.recording}
                  onStart={rec2.start}
                  onStop={rec2.stop}
                  disabled={submittingShadow}
                />
                {rec2.audioBlob && !rec2.recording && !shadowResult && (
                  <button
                    onClick={handleShadowSubmit}
                    disabled={submittingShadow}
                    className="flex items-center gap-1.5 px-6 py-3 bg-zinc-950 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition duration-200 mx-auto cursor-pointer"
                  >
                    {submittingShadow ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />}
                    <span>Submit & Analyze</span>
                  </button>
                )}
              </div>

              {/* Result display */}
              {shadowResult && (
                <div className="space-y-4 bg-zinc-950/80 p-6 rounded-3xl border border-white/5 shadow-inner animate-in slide-in-from-bottom-2 duration-200 text-left">
                  <ScoreBar score={shadowResult.similarity_score} label="Shadowing Accuracy" />
                  <p className={`text-xs font-black uppercase tracking-wider ${
                    shadowResult.color === "green" ? "text-emerald-400" : shadowResult.color === "yellow" ? "text-amber-400" : "text-red-400"
                  }`}>
                    Feedback: {shadowResult.feedback_hint}
                  </p>
                  <WordDiffRow diffs={shadowResult.word_diffs} />
                  {shadowResult.recognized_text && (
                    <p className="text-[11px] text-zinc-500 italic">Heard speech: "{shadowResult.recognized_text}"</p>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t border-white/5">
                <button onClick={() => setStep(6)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                
                {shadowResult ? (
                  <button
                    onClick={() => {
                      setShadowResult(null);
                      rec2.setAudioBlob(null);
                      if (shadowIdx < shadowItems.length - 1) {
                        setShadowIdx(shadowIdx + 1);
                      } else {
                        setStep(8);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                  >
                    {shadowIdx < shadowItems.length - 1 ? "Next Sentence" : "Move to Activity 2"}
                    <ChevronRight className="w-4 h-4 text-zinc-950" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      rec2.setAudioBlob(null);
                      if (shadowIdx < shadowItems.length - 1) setShadowIdx(shadowIdx + 1);
                      else setStep(8);
                    }}
                    className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition cursor-pointer"
                  >
                    Skip
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 8: Activity 2 (Phoneme drills) */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center max-w-3xl mx-auto my-4 transition duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <BarChart2 className="w-6 h-6 text-brand-400 animate-pulse" />
              <span>Activity 2 – Syllable-level Phoneme drills</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black">{phonemeIdx + 1}/{phonemeTargets.length}</span>
          </div>

          {phonemeTargets.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (() => {
            const target = phonemeTargets[phonemeIdx];
            const example = target.examples[phonemeExIdx];
            return (
              <div className="max-w-xl mx-auto w-full space-y-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-full text-xs font-black text-brand-300">
                  Cluster Focus: {target.label}
                </div>

                <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 text-left space-y-2 shadow-inner">
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">{target.description}</p>
                  <p className="text-xs text-amber-400 italic">💡 Articulation Tip: {target.tip}</p>
                </div>

                {/* Example Word Panel */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/40 space-y-3 shadow-md max-w-xs mx-auto">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Word {phonemeExIdx + 1} of {target.examples.length}</span>
                  <div className="text-4xl font-black text-white filter drop-shadow-[0_2px_5px_rgba(255,255,255,0.05)]">{example.word}</div>
                  <p className="text-xs text-zinc-400 font-mono">{example.romanization} &bull; {example.gloss}</p>
                  
                  <button
                    onClick={() => speakWord(example.word)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 text-brand-400 hover:text-white border border-white/10 transition duration-150 text-xs font-bold mx-auto cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" /> Mimic Model
                  </button>
                </div>

                <div className="space-y-4">
                  <RecordButton recording={rec3.recording} onStart={rec3.start} onStop={rec3.stop} disabled={submittingPhoneme} />
                  {rec3.audioBlob && !rec3.recording && !phonemeResult && (
                    <button
                      onClick={handlePhonemeSubmit}
                      disabled={submittingPhoneme}
                      className="flex items-center gap-1.5 px-6 py-3 bg-zinc-950 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition duration-200 mx-auto cursor-pointer"
                    >
                      {submittingPhoneme ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />}
                      <span>Score sound</span>
                    </button>
                  )}
                </div>

                {phonemeResult && (
                  <div className="space-y-4 bg-zinc-950/80 p-6 rounded-3xl border border-white/5 shadow-inner text-left animate-in slide-in-from-bottom-2 duration-200">
                    <ScoreBar score={phonemeResult.similarity_score} label="Syllable accuracy" />
                    <WordDiffRow diffs={phonemeResult.word_diffs} />
                    {phonemeResult.recognized_text && (
                      <p className="text-[11px] text-zinc-500 italic">Recognized phoneme: "{phonemeResult.recognized_text}"</p>
                    )}

                    {/* AI Coach Report */}
                    {!aiFeedback3 ? (
                      <button
                        onClick={handleAiFeedback3}
                        disabled={loadingFeedback3}
                        className="flex items-center gap-1.5 px-4.5 py-2.5 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-brand-400 rounded-xl text-xs font-black transition duration-200 mx-auto cursor-pointer uppercase tracking-widest text-[10px]"
                      >
                        {loadingFeedback3 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>AI pronunciation Advice</span>
                      </button>
                    ) : (
                      <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 text-left text-xs leading-relaxed text-zinc-300 shadow-inner animate-in fade-in duration-350">
                        <span className="text-[9px] font-black text-brand-400 uppercase tracking-widest block mb-1">Gwan-Sik AI Coach Report</span>
                        <p className="font-serif italic">"{aiFeedback3}"</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                  <button onClick={() => setStep(7)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPhonemeExIdx((phonemeExIdx + 1) % target.examples.length);
                        setPhonemeResult(null);
                        setAiFeedback3(null);
                        rec3.setAudioBlob(null);
                      }}
                      className="glass-panel px-4 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-black transition cursor-pointer uppercase tracking-wider text-[10px]"
                    >
                      Next Example
                    </button>
                    <button
                      onClick={() => {
                        if (phonemeIdx < phonemeTargets.length - 1) {
                          setPhonemeIdx(phonemeIdx + 1);
                          setPhonemeExIdx(0);
                          setPhonemeResult(null);
                          setAiFeedback3(null);
                          rec3.setAudioBlob(null);
                        } else {
                          setStep(9);
                        }
                      }}
                      className="bg-brand-500 hover:bg-brand-600 text-zinc-950 px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                    >
                      {phonemeIdx < phonemeTargets.length - 1 ? "Next sound" : "Continue to Patterns"}
                      <ChevronRight className="w-4 h-4 text-zinc-950" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Screen 9: Activity 3 (Controlled patterns speaking) */}
      {step === 9 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center max-w-3xl mx-auto my-4 transition duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <Sparkles className="w-6 h-6 text-brand-400 animate-pulse" />
              <span>Activity 3 – Controlled Pattern Talk</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black">{patIdx + 1}/{patterns.length}</span>
          </div>

          {patterns.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (() => {
            const pat = patterns[patIdx];
            const expectedSentence = pat.example_complete_ko.replace(/_/, patSlot || pat.slot_options[0]);
            return (
              <div className="max-w-xl mx-auto w-full space-y-6 text-center animate-in fade-in duration-200">
                {/* Pattern frame */}
                <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 space-y-2 shadow-inner max-w-md mx-auto">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Pattern Frame Template</span>
                  <div className="text-2xl font-black text-white">{pat.pattern_ko}</div>
                  <p className="text-xs text-zinc-400 italic">{pat.pattern_en}</p>
                </div>

                {/* Slot Selector */}
                <div className="space-y-3">
                  <span className="text-xs text-zinc-400 font-bold block">Select component to fill slot:</span>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {pat.slot_options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setPatSlot(opt);
                          setPatResult(null);
                          setAiFeedback4(null);
                          rec4.setAudioBlob(null);
                        }}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-black transition duration-200 cursor-pointer ${
                          patSlot === opt
                            ? "border-brand-500 bg-brand-500/10 text-white shadow-md shadow-brand-500/10"
                            : "border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expected speech */}
                <div className="bg-zinc-950 p-5 rounded-3xl border border-white/10 space-y-3 max-w-md mx-auto shadow-inner">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Your complete sentence:</span>
                  <div className="text-3xl font-black text-white filter drop-shadow-[0_2px_5px_rgba(255,255,255,0.05)]">{expectedSentence}</div>
                  <p className="text-xs text-zinc-300 italic">{pat.example_complete_en.replace(/민수/, patSlot || pat.slot_options[0])}</p>
                  
                  <button
                    onClick={() => speakWord(expectedSentence)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 border border-white/5 text-brand-400 hover:text-white transition duration-150 text-xs font-bold mx-auto cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" /> Listen Model Speech
                  </button>
                </div>

                {/* Record patterns */}
                <div className="space-y-4">
                  <RecordButton recording={rec4.recording} onStart={rec4.start} onStop={rec4.stop} disabled={submittingPat} />
                  {rec4.audioBlob && !rec4.recording && !patResult && (
                    <button
                      onClick={handlePatternSubmit}
                      disabled={submittingPat}
                      className="flex items-center gap-1.5 px-6 py-3 bg-zinc-950 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition duration-200 mx-auto cursor-pointer"
                    >
                      {submittingPat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />}
                      <span>Check Pattern</span>
                    </button>
                  )}
                </div>

                {patResult && (
                  <div className="space-y-4 bg-zinc-950/80 p-6 rounded-3xl border border-white/5 shadow-inner text-left animate-in slide-in-from-bottom-2 duration-200">
                    <ScoreBar score={patResult.similarity_score} label="Accuracy" />
                    <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border w-fit ${
                      patResult.structure_ok ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-amber-500/5 border-amber-500/20 text-amber-400"
                    }`}>
                      Pattern Structure: {patResult.structure_ok ? "✓ Correct" : "⚠ Particle check required"}
                    </div>
                    <WordDiffRow diffs={patResult.word_diffs} />
                    {patResult.recognized_text && (
                      <p className="text-[11px] text-zinc-500 italic">Transcribed: "{patResult.recognized_text}"</p>
                    )}

                    {/* AI Feedback */}
                    {!aiFeedback4 ? (
                      <button
                        onClick={handleAiFeedback4}
                        disabled={loadingFeedback4}
                        className="flex items-center gap-1.5 px-4.5 py-2.5 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-brand-400 rounded-xl text-xs font-black transition duration-200 mx-auto cursor-pointer uppercase tracking-widest text-[10px]"
                      >
                        {loadingFeedback4 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>AI pattern analysis</span>
                      </button>
                    ) : (
                      <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 text-left text-xs leading-relaxed text-zinc-300 shadow-inner animate-in fade-in duration-300">
                        <span className="text-[9px] font-black text-brand-400 uppercase tracking-widest block mb-1">Gwan-Sik AI Coach Report</span>
                        <p className="font-serif italic">"{aiFeedback4}"</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                  <button onClick={() => setStep(8)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                  <button
                    onClick={() => {
                      setPatResult(null);
                      setAiFeedback4(null);
                      rec4.setAudioBlob(null);
                      if (patIdx < patterns.length - 1) {
                        setPatIdx(patIdx + 1);
                        setPatSlot(patterns[patIdx + 1]?.slot_options?.[0] || "");
                      } else {
                        setStep(10);
                      }
                    }}
                    className="bg-brand-500 hover:bg-brand-600 text-zinc-950 px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                  >
                    {patIdx < patterns.length - 1 ? "Next Pattern" : "Move to Free Tasks"}
                    <ChevronRight className="w-4 h-4 text-zinc-950" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Screen 10: Activity 4 (Free speaking task) */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center max-w-3xl mx-auto my-4 transition duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <Mic className="w-6 h-6 text-brand-400" />
              <span>Activity 4 – Guided Free Speech Lab</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black">{freeIdx + 1}/{freeTasks.length}</span>
          </div>

          {freeTasks.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (() => {
            const task = freeTasks[freeIdx];
            return (
              <div className="max-w-xl mx-auto w-full space-y-6 text-center animate-in fade-in duration-200">
                <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 space-y-2.5 shadow-inner">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold font-mono">Vocal Challenge</span>
                  <p className="text-lg font-black text-white">{task.prompt_en}</p>
                  <p className="text-xs text-brand-400 font-medium font-sans">Required vocab: {task.prompt_hint}</p>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 text-left space-y-2">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Suggested flow structures:</span>
                  {task.sample_structure.map((s: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button onClick={() => speakWord(s)} className="text-brand-400 hover:text-white transition"><Volume2 className="w-4 h-4 cursor-pointer" /></button>
                      <span className="text-xs text-zinc-300 font-mono select-all">{s}</span>
                    </div>
                  ))}
                </div>

                {/* Record Free Speech */}
                <div className="space-y-4">
                  <p className="text-xs text-zinc-500">Record self-intro for about {task.suggested_length_seconds}s. Relax and speak clearly!</p>
                  <RecordButton recording={rec5.recording} onStart={rec5.start} onStop={rec5.stop} disabled={submittingFree} />
                  {rec5.audioBlob && !rec5.recording && !freeResult && (
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleFreeSubmit(false)}
                        disabled={submittingFree}
                        className="px-5 py-3 bg-zinc-950 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider transition duration-200 cursor-pointer shadow"
                      >
                        Check Basic
                      </button>
                      <button
                        onClick={() => handleFreeSubmit(true)}
                        disabled={submittingFree}
                        className="bg-brand-500 hover:bg-brand-600 text-zinc-950 font-black px-5 py-3 rounded-xl text-xs transition duration-200 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-brand-500/10 animate-pulse"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                        <span>AI speech Analysis</span>
                      </button>
                    </div>
                  )}
                </div>

                {freeResult && (
                  <div className="space-y-4 bg-zinc-950/80 p-6 rounded-3xl border border-white/5 shadow-inner text-left animate-in slide-in-from-bottom-2 duration-200">
                    <ScoreBar score={freeResult.fluency_score} label="Fluency score" />
                    <p className="text-[11px] text-zinc-400">Total detected Hangeul words: <strong className="text-white">{freeResult.word_count}</strong></p>
                    {freeResult.recognized_text && (
                      <div className="bg-zinc-900/30 p-3.5 rounded-xl border border-white/5 text-xs text-zinc-400 shadow-inner">
                        <span className="block font-bold text-zinc-300 mb-1">ASR Speech Transcript:</span>
                        <p className="leading-relaxed font-sans font-medium">"{freeResult.recognized_text}"</p>
                      </div>
                    )}
                    {freeResult.ai_feedback && (
                      <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 text-left text-xs leading-relaxed text-zinc-300 shadow-inner">
                        <span className="text-[9px] font-black text-brand-400 uppercase tracking-widest block mb-1">Gwan-Sik AI Coach Feedback</span>
                        <p className="font-serif italic">"{freeResult.ai_feedback}"</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                  <button onClick={() => setStep(9)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                  <button
                    onClick={() => {
                      setFreeResult(null);
                      rec5.setAudioBlob(null);
                      if (freeIdx < freeTasks.length - 1) {
                        setFreeIdx(freeIdx + 1);
                      } else {
                        setStep(11);
                      }
                    }}
                    className="bg-brand-500 hover:bg-brand-600 text-zinc-950 px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                  >
                    {freeIdx < freeTasks.length - 1 ? "Next Task" : "Go to Speech Check"}
                    <ChevronRight className="w-4 h-4 text-zinc-950" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Screen 11: Assessment */}
      {step === 11 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center max-w-3xl mx-auto my-4 transition duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Step 11 – Syllable Speech Assessment</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black">
              {finalAssessment ? "Evaluation Complete" : `Item ${Math.min(assessIdx + 1, assessmentBlueprint.length)} of ${assessmentBlueprint.length}`}
            </span>
          </div>

          {finalAssessment ? (
            <div className="max-w-xl mx-auto w-full text-center space-y-6 animate-in fade-in duration-300">
              <div className={`p-4 rounded-3xl border w-fit mx-auto ${finalAssessment.passed ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
                {finalAssessment.passed ? <CheckCircle2 className="w-10 h-10" /> : <RefreshCw className="w-10 h-10" />}
              </div>
              <h3 className="text-3xl font-black text-white tracking-tight">
                {finalAssessment.passed ? "Bootcamp Oral Capstone Passed!" : "Calibration Recheck Recommended"}
              </h3>
              <ScoreBar score={finalAssessment.total_score} label="Aggregate Oral Score" />
              
              {finalAssessment.xp_awarded > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/15 border border-amber-500/20 text-amber-400 rounded-full text-xs font-black shadow shadow-amber-500/5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>+{finalAssessment.xp_awarded} XP Bootcamp bonus claimed</span>
                </div>
              )}
              <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">{finalAssessment.message}</p>
              
              <button 
                onClick={() => setStep(12)} 
                className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-3.5 rounded-2xl font-black text-xs transition duration-200 cursor-pointer shadow shadow-accent-teal/10"
              >
                View Summary & Recommendations
              </button>
            </div>
          ) : assessmentBlueprint.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : assessIdx >= assessmentBlueprint.length ? (
            <div className="max-w-xl mx-auto text-center space-y-6">
              <p className="text-zinc-300 text-sm">All {assessmentBlueprint.length} oral assessment checks recorded successfully. Submit for evaluation:</p>
              <div className="space-y-2 max-w-md mx-auto">
                {assessAttempts.map((a, i) => (
                  <div key={i} className="flex items-center justify-between bg-zinc-900 p-4 rounded-xl border border-white/5 text-xs shadow-inner">
                    <span className="text-zinc-400 truncate max-w-[200px]">{a.target}</span>
                    <span className={`font-mono font-black ${a.score >= 75 ? "text-emerald-400" : a.score >= 50 ? "text-amber-400" : "text-red-400"}`}>{a.score.toFixed(0)}/100</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSubmitFinal}
                disabled={submittingFinal}
                className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-zinc-950 font-black px-6 py-3.5 rounded-xl text-xs transition duration-200 mx-auto cursor-pointer shadow-lg shadow-brand-500/10"
              >
                {submittingFinal ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Award className="w-4.5 h-4.5 text-zinc-950" />}
                <span>Calculate Final Speaking Score</span>
              </button>
            </div>
          ) : (() => {
            const item = assessmentBlueprint[assessIdx];
            return (
              <div className="max-w-xl mx-auto w-full space-y-6 text-center animate-in fade-in duration-200">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-950 border border-white/10 rounded-full text-xs font-bold text-zinc-300">
                  Assessment Part: {item.type === "shadowing" ? "Shadowing Sentence" : item.type === "pattern" ? "Pattern Building" : "Proper Nouns Dictation"}
                </div>

                <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 space-y-3 shadow-inner max-w-md mx-auto">
                  {item.type === "free" ? (
                    <p className="text-sm font-bold text-white">{item.target}</p>
                  ) : (
                    <div className="text-3xl font-black text-white filter drop-shadow-[0_2px_5px_rgba(255,255,255,0.05)]">{item.target}</div>
                  )}
                  {item.type !== "free" && (
                    <button
                      onClick={() => speakWord(item.target)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 text-brand-400 hover:text-white border border-white/10 transition text-xs font-bold mx-auto cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Model Audio</span>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <RecordButton recording={rec6.recording} onStart={rec6.start} onStop={rec6.stop} disabled={submittingAssess} />
                  {rec6.audioBlob && !rec6.recording && !assessResult && (
                    <button
                      onClick={handleAssessmentAttempt}
                      disabled={submittingAssess}
                      className="flex items-center gap-1.5 px-6 py-3 bg-zinc-950 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition duration-200 mx-auto cursor-pointer"
                    >
                      {submittingAssess ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />}
                      <span>Save Response</span>
                    </button>
                  )}
                </div>

                {assessResult && (
                  <div className="space-y-4 bg-zinc-950/80 p-6 rounded-3xl border border-white/5 shadow-inner text-left animate-in slide-in-from-bottom-2 duration-200 max-w-md mx-auto">
                    <ScoreBar score={assessResult.similarity_score} label="Acoustic Accuracy" />
                    <WordDiffRow diffs={assessResult.word_diffs} />
                    <button
                      onClick={() => {
                        setAssessResult(null);
                        rec6.setAudioBlob(null);
                        setAssessIdx(assessIdx + 1);
                      }}
                      className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-3 rounded-xl text-xs font-black transition duration-200 flex items-center gap-1 mx-auto cursor-pointer"
                    >
                      <span>{assessIdx < assessmentBlueprint.length - 1 ? "Next Assessment Sound" : "Go to Score Summary"}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-950" />
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                  <button onClick={() => setStep(10)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                  <span className="text-xs text-zinc-500 font-mono font-bold">{assessAttempts.length} of {assessmentBlueprint.length} slots calibrated</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Screen 12: Summary & Recommendations */}
      {step === 12 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center max-w-3xl mx-auto my-4 transition duration-300 animate-in fade-in duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <BarChart2 className="w-6 h-6 text-brand-400" />
              <span>Step 12 – Final Speaking summary</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black">Bootcamp Finished</span>
          </div>

          {!summary ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full font-sans">
              {/* Score grids */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Shadowing Avg", value: summary.shadowing_avg },
                  { label: "Pattern Speaking", value: summary.pattern_avg },
                  { label: "Free Speaking", value: summary.free_speaking_avg },
                  { label: "Overall Score", value: summary.overall_avg },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 shadow-inner">
                    <ScoreBar score={value} label={label} />
                  </div>
                ))}
              </div>

              {/* Sparkline trend representation */}
              {summary.trend?.length > 0 && (
                <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-xs space-y-2.5 shadow-inner text-left">
                  <span className="text-zinc-500 uppercase tracking-widest font-black text-[9px] block font-mono">Auditory calibration trend</span>
                  <div className="flex items-end gap-2 h-12 pt-2">
                    {summary.trend.map((s: number, idx: number) => (
                      <div
                        key={idx}
                        className={`flex-1 rounded-sm transition-all duration-300 ${s >= 80 ? "bg-emerald-500" : s >= 55 ? "bg-amber-400" : "bg-red-500"}`}
                        style={{ height: `${Math.max(15, s)}%` }}
                        title={`${s}%`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Mastered patterns */}
              {summary.patterns_practiced?.length > 0 && (
                <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-left text-xs space-y-2 shadow-inner">
                  <span className="text-zinc-500 uppercase tracking-widest font-black text-[9px] block font-mono">Mastered speech patterns:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.patterns_practiced.map((p: string) => (
                      <span key={p} className="px-3 py-1 bg-brand-500/10 border border-brand-500/20 text-brand-300 rounded-full font-bold text-xs">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations list */}
              <div className="bg-zinc-950/80 p-5 rounded-2xl border border-white/5 text-left space-y-3 shadow-inner">
                <span className="text-zinc-500 uppercase tracking-widest font-black text-[9px] block font-mono">Focus areas & homework:</span>
                <ul className="space-y-2 text-xs text-zinc-300 font-sans leading-relaxed">
                  {summary.recommendations.map((r: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-brand-400 shrink-0 mt-0.5">&bull;</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next module CTA block */}
              <div className="bg-zinc-950 p-4.5 rounded-xl border border-brand-500/15 text-left text-xs flex items-start gap-3 shadow-sm">
                <Sparkles className="w-5 h-5 text-brand-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="font-black text-zinc-300 uppercase tracking-wider text-[9px] font-mono">Next Curriculum Unlock:</p>
                  <p className="text-brand-400 font-bold text-sm mt-0.5">{summary.next_module}</p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onComplete}
                  className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4.5 px-10 rounded-2xl transition duration-200 text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/20 cursor-pointer active:scale-95"
                >
                  <Award className="w-5 h-5 text-zinc-950" />
                  <span>Claim Course 0 Bootcamp Badge</span>
                  <ChevronRight className="w-4 h-4 text-zinc-950" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
