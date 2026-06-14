"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  BarChart2,
  Award,
  Play,
  HelpCircle,
  CornerDownLeft,
  BookOpen,
  ArrowRight,
  User,
  Check,
  RefreshCw,
  Mic,
  MicOff,
  Trophy,
  Star,
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

// ---------------------------------------------------------------------------
// Audio Recorder Hook
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Score Bar
// ---------------------------------------------------------------------------
function ScoreBar({ score, label }: { score: number; label?: string }) {
  const color =
    score >= 80 ? "bg-emerald-500" : score >= 55 ? "bg-amber-400" : "bg-red-500";
  const textColor =
    score >= 80 ? "text-emerald-400" : score >= 55 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-1">
      {label && <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{label}</span>}
      <div className="flex items-center gap-3">
        <div className="flex-grow h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} rounded-full transition-all duration-700`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
        <span className={`text-sm font-black ${textColor} w-12 text-right`}>{score.toFixed(0)}/100</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
interface Phase6ConversationWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Phase6ConversationWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Phase6ConversationWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");

  // DB States
  const [metadata, setMetadata] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [recommendedScenarios, setRecommendedScenarios] = useState<any[]>([]);
  const [currentScenario, setCurrentScenario] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Chat States
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [userInput, setUserInput] = useState("");
  const [sendingTurn, setSendingTurn] = useState(false);
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);
  const [hints, setHints] = useState<any>(null);
  const [loadingHints, setLoadingHints] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const rec = useRecorder();
  const [transcribingVoice, setTranscribingVoice] = useState(false);

  // Evaluation States
  const [evalResult, setEvalResult] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);

  // Review States
  const [reviewData, setReviewData] = useState<any>(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewAttempts, setReviewAttempts] = useState<Record<string, string>>({});
  const [reviewChecked, setReviewChecked] = useState<Record<string, boolean>>({});

  // TTS audio playback
  const playAudioUrl = (text: string) => {
    const speakUrl = `${API_BASE}/speech/tts?text=${encodeURIComponent(text)}&lang=ko`;
    const audio = new Audio(speakUrl);
    audio.play().catch((err) => console.error("Audio play failed:", err));
  };

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Lazy load steps metadata
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/conversation/phase6/metadata");
          setMetadata(res);
        } else if (step === 2 && scenarios.length === 0) {
          const res = await apiJson("/conversation/scenarios");
          setScenarios(res.scenarios || []);
          setRecommendedScenarios(res.recommended || []);
        }
      } catch (err) {
        console.error("Step metadata loading failed:", err);
      }
    };
    load();
  }, [step]);

  // Load hints dynamically during chat
  const loadHints = async () => {
    if (!sessionId) return;
    setLoadingHints(true);
    try {
      const res = await apiJson(`/conversation/session/${sessionId}/hints`);
      setHints(res);
      setShowHelpDrawer(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHints(false);
    }
  };

  // Start Scenario
  const handleStartScenario = async (sc: any) => {
    setCurrentScenario(sc);
    setSendingTurn(true);
    try {
      const fd = new FormData();
      fd.append("scenario_id", sc.id);
      fd.append("mode", mode);
      const res = await apiForm("/conversation/session/start", fd);
      setSessionId(res.session_id);
      setChatMessages([
        {
          sender: "ai",
          text: res.opener,
          englishTranslation: res.opener_translation,
          showTranslation: false,
          grammarNotes: sc.rag_notes,
        },
      ]);
      setStep(3);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingTurn(false);
    }
  };

  // Submit Convo Turn
  const handleSendTurn = async () => {
    if (!sessionId || (!userInput.trim() && !rec.audioBlob)) return;
    setSendingTurn(true);

    // If voice mode, record text locally temporarily
    const currentInput = userInput;
    setUserInput("");

    try {
      const fd = new FormData();
      if (currentInput) fd.append("user_text", currentInput);
      if (rec.audioBlob) {
        fd.append("audio_file", rec.audioBlob, "recording.webm");
      }

      // Add local message temporarily
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "user",
          text: currentInput || "🎙️ Transcribing Audio...",
        },
      ]);

      const res = await apiForm(`/conversation/session/${sessionId}/turn`, fd);
      
      // Update last user message with Whisper transcript
      setChatMessages((prev) => {
        const copy = [...prev];
        const lastUser = copy.filter((m) => m.sender === "user").pop();
        if (lastUser) {
          lastUser.text = res.recognized_text;
          lastUser.pronScore = res.pron_score;
        }
        return [
          ...copy,
          {
            sender: "ai",
            text: res.reply,
            englishTranslation: res.english_translation,
            correction: res.correction,
            grammarNotes: res.grammar_notes,
            showTranslation: false,
          },
        ];
      });

      // Clear audio details
      rec.setAudioBlob(null);

      // Play audio automatically if voice mode
      if (mode === "voice" && res.reply) {
        playAudioUrl(res.reply);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingTurn(false);
    }
  };

  // Voice mode auto-transcriber preview
  const handleStopRecording = () => {
    rec.stop();
  };

  useEffect(() => {
    const transcribe = async () => {
      if (!rec.audioBlob) return;
      setTranscribingVoice(true);
      try {
        const fd = new FormData();
        fd.append("audio_file", rec.audioBlob, "recording.webm");
        const res = await apiForm("/speech/stt", fd);
        setUserInput(res.transcription || "");
      } catch (err) {
        console.error(err);
      } finally {
        setTranscribingVoice(false);
      }
    };
    transcribe();
  }, [rec.audioBlob]);

  // Evaluate Role-play
  const handleEvaluateSession = async () => {
    if (!sessionId) return;
    setEvaluating(true);
    setStep(5);
    try {
      const res = await apiJson(`/conversation/session/${sessionId}/evaluate`, {
        method: "POST",
      });
      setEvalResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  // Review & Annotation Lesson Page
  const handleLoadReview = async () => {
    if (!sessionId) return;
    setLoadingReview(true);
    setStep(6);
    try {
      const res = await apiJson(`/conversation/session/${sessionId}/review`);
      setReviewData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReview(false);
    }
  };

  const checkReviewAnswer = (exId: string, correctAns: string) => {
    const typed = reviewAttempts[exId] || "";
    const isCorrect = typed.trim().replace(/\s/g, "") === correctAns.trim().replace(/\s/g, "");
    setReviewChecked((prev) => ({ ...prev, [exId]: true }));
  };

  const totalSteps = 6;

  return (
    <div className="flex-grow flex flex-col justify-between max-w-2xl mx-auto w-full font-sans">
      {/* Header */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-zinc-900 border border-white/10">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg">{activeLesson?.title || "Phase 6 – Conversation Lab"}</h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Guided Interactive Role-Plays</p>
          </div>
        </div>
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

      {/* ====== Screen 1: Welcome & Mode Select ====== */}
      {step === 1 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center">
          <div className="relative mx-auto w-fit">
            <div className="p-4 bg-yellow-500/10 rounded-full border border-yellow-500/25 text-yellow-400">
              <Trophy className="w-10 h-10" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-brand-500 rounded-full border-2 border-zinc-950">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">Hangeul 0.6</h2>
            <h3 className="text-xl font-bold text-yellow-400 mt-1">Conversation Lab – Guided Role‑Plays (Capstone)</h3>
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed max-w-md mx-auto">
            {metadata?.description ||
              "Practice short, realistic Korean conversations (3–8 turns) with an AI partner tuned to your level."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs space-y-2 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Capstone Goals:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              <li>Combine greetings, self-intro, numbers, routines, and places</li>
              <li>Practice 3–5-turn conversations on familiar topics (home, daily life, plans)</li>
              <li>Build confidence for your first real conversations in Korean</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
            {["Scenario-based", "Beginner Speaking", "Basic Dialogues", "Interactive Tutor"].map(chip => (
              <span key={chip} className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[10px] text-yellow-300 font-bold">{chip}</span>
            ))}
          </div>

          {/* Mode Selection */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full space-y-3 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">⏱️ CEFR Level</span>
              <span className="text-xs font-bold text-zinc-300">{metadata?.cefr_band || "A1/A2 (Beginner)"}</span>
            </div>
            <div className="border-t border-white/[0.03] pt-3 space-y-2">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Choose Conversation Mode</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode("text")}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                    mode === "text"
                      ? "border-yellow-500 bg-yellow-500/10 text-white"
                      : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                  }`}
                >
                  Text only
                </button>
                <button
                  onClick={() => setMode("voice")}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    mode === "voice"
                      ? "border-yellow-500 bg-yellow-500/10 text-white"
                      : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" /> Voice + Text
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button
              onClick={() => setStep(2)}
              className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/20"
            >
              <Trophy className="w-4 h-4" /> Start Capstone Phase
            </button>
            
          </div>

          {showOutline && (
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-1.5 animate-fade-in max-w-md mx-auto w-full font-mono">
              <p className="font-extrabold text-white text-center pb-2">Capstone Activities:</p>
              <p>✓ Screen 1 – Welcome / Phase Overview</p>
              <p>✓ Screen 2 – Scenario Selection</p>
              <p>✓ Screen 3 – Chat Runtime UI</p>
              <p>✓ Screen 5 – Post-Conversation Feedback</p>
              <p>✓ Screen 6 – Transcript & Targeted Review</p>
            </div>
          )}
        </div>
      )}

      {/* ====== Screen 2: Scenario Selection ====== */}
      {step === 2 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white">Select a Role-Play Scenario</h2>
            <p className="text-xs text-zinc-500">Pick a situation to practice with Gwan-Sik</p>
          </div>

          {/* Recommended scenarios */}
          {recommendedScenarios.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recommended For Your Level</span>
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedScenarios.map((sc) => (
                  <div
                    key={sc.id}
                    onClick={() => handleStartScenario(sc)}
                    className="glass-panel p-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.02] hover:border-amber-400/50 hover:bg-amber-500/[0.04] transition cursor-pointer text-left space-y-3 group"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-white text-base group-hover:text-amber-300">{sc.title}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        {sc.cefr_level}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{sc.description}</p>
                    <div className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/5">
                      Focus: {sc.focus_grammar}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Scenarios catalog */}
          <div className="space-y-3">
            <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">All Scenarios</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarios
                .filter((s) => !recommendedScenarios.some((r) => r.id === s.id))
                .map((sc) => (
                  <div
                    key={sc.id}
                    onClick={() => handleStartScenario(sc)}
                    className="glass-panel p-5 rounded-2xl border border-white/5 bg-zinc-900/30 hover:border-yellow-500/30 hover:bg-zinc-900/60 transition cursor-pointer text-left space-y-3 group"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-white text-base group-hover:text-yellow-400">{sc.title}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {sc.cefr_level}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{sc.description}</p>
                    <div className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/5">
                      Focus: {sc.focus_grammar}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex justify-start">
            <button
              onClick={() => setStep(1)}
              className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Mode
            </button>
          </div>
        </div>
      )}

      {/* ====== Screen 3: Chat Runtime UI ====== */}
      {step === 3 && (
        <div className="glass-panel neon-border p-6 rounded-3xl shadow-2xl w-full flex-grow flex flex-col justify-between min-h-[60vh] max-w-3xl mx-auto relative overflow-hidden">
          {/* Convo Header info */}
          <div className="flex justify-between items-center border-b border-white/5 pb-3.5 mb-4 shrink-0">
            <div>
              <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest block">Role-Play Scenario</span>
              <h3 className="text-base font-extrabold text-white">{currentScenario?.title}</h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-white/5">
                Role: {currentScenario?.role}
              </span>
            </div>
          </div>

          {/* Message Area */}
          <div className="flex-grow overflow-y-auto space-y-4 pr-1 mb-4 max-h-[45vh] min-h-[30vh]">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    msg.sender === "user"
                      ? "bg-brand-500/10 text-brand-400 border-brand-500/20"
                      : "bg-zinc-800 text-zinc-300 border-white/10"
                  }`}
                >
                  {msg.sender === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                {/* Bubble content */}
                <div className="space-y-1.5">
                  <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed relative ${
                      msg.sender === "user"
                        ? "bg-brand-500 text-zinc-950 font-semibold rounded-tr-none"
                        : "bg-zinc-900 text-zinc-100 rounded-tl-none border border-white/5"
                    }`}
                  >
                    {/* Speak icon for AI Korean messages */}
                    {msg.sender === "ai" && (
                      <button
                        onClick={() => playAudioUrl(msg.text)}
                        className="absolute right-2 top-2 p-1 rounded bg-zinc-950 text-zinc-500 hover:text-white transition opacity-60 hover:opacity-100 cursor-pointer"
                        title="Listen speak audio"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <p>{msg.text}</p>

                    {/* Word highlight score for voice user attempt */}
                    {msg.sender === "user" && msg.pronScore !== undefined && (
                      <span className="block text-[9px] text-zinc-950/70 font-mono mt-1 font-bold">
                        Acoustic alignment: {msg.pronScore.toFixed(0)}%
                      </span>
                    )}

                    {/* Corrections if any */}
                    {msg.correction && (
                      <div className="mt-2 pt-2 border-t border-red-500/20 text-xs text-red-400 font-sans space-y-1.5">
                        <p className="font-extrabold flex items-center gap-1">⚠️ Correction:</p>
                        <p className="italic bg-red-500/5 p-1.5 rounded">{msg.correction}</p>
                      </div>
                    )}

                    {/* Grammar note tooltip */}
                    {msg.grammarNotes && !msg.correction && (
                      <div className="mt-2 pt-1 border-t border-yellow-500/10 text-[10px] text-yellow-300">
                        💡 Tip: {msg.grammarNotes}
                      </div>
                    )}
                  </div>

                  {/* Translation Toggle */}
                  {msg.englishTranslation && (
                    <div className="text-left pl-1">
                      <button
                        onClick={() => {
                          setChatMessages((prev) => {
                            const next = [...prev];
                            next[i].showTranslation = !next[i].showTranslation;
                            return next;
                          });
                        }}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 font-bold transition"
                      >
                        {msg.showTranslation ? "Hide English" : "Translate"}
                      </button>
                      {msg.showTranslation && (
                        <p className="text-xs text-zinc-400 italic mt-0.5 font-sans">
                          {msg.englishTranslation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Interactive hints preview area */}
          {userInput === "" && mode === "text" && (
            <div className="flex gap-2 justify-center mb-3 flex-wrap">
              {currentScenario?.key_phrases.slice(0, 2).map((kp: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setUserInput(kp)}
                  className="px-3 py-1 bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-yellow-500/20 text-[11px] rounded-lg text-zinc-400 transition cursor-pointer"
                >
                  💡 Try: "{kp}"
                </button>
              ))}
            </div>
          )}

          {/* Input control tray */}
          <div className="border-t border-white/5 pt-4 shrink-0 flex items-center gap-3">
            {/* Scaffolding Help Button */}
            <button
              onClick={loadHints}
              disabled={loadingHints}
              className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-white/5 transition flex items-center justify-center shrink-0 cursor-pointer"
              title="Show scaffolding hints"
            >
              {loadingHints ? <Loader2 className="w-5 h-5 animate-spin" /> : <HelpCircle className="w-5 h-5 text-yellow-400" />}
            </button>

            {mode === "text" ? (
              // Text mode typebox
              <div className="flex-grow relative flex">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !sendingTurn && handleSendTurn()}
                  placeholder="Type Korean reply..."
                  disabled={sendingTurn}
                  className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3 pl-4 pr-10 text-sm focus:outline-none focus:border-yellow-500 transition text-white"
                />
                <button
                  onClick={handleSendTurn}
                  disabled={sendingTurn || !userInput.trim()}
                  className="absolute right-2 top-2 p-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-30 rounded-lg text-zinc-950 transition cursor-pointer"
                >
                  {sendingTurn ? <Loader2 className="w-4 h-4 animate-spin" /> : <CornerDownLeft className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              // Voice mode hold-to-record
              <div className="flex-grow flex items-center gap-3">
                <button
                  onMouseDown={rec.start}
                  onMouseUp={handleStopRecording}
                  onTouchStart={rec.start}
                  onTouchEnd={handleStopRecording}
                  disabled={sendingTurn || transcribingVoice}
                  className={`flex-grow flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition cursor-pointer ${
                    rec.recording
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-accent-teal hover:bg-accent-teal/90 text-zinc-950 font-black"
                  } disabled:opacity-40`}
                >
                  {rec.recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{rec.recording ? "Recording... Release to Stop" : "Hold & Speak"}</span>
                </button>

                {/* Audio preview text input box */}
                {userInput.trim() !== "" && !rec.recording && (
                  <div className="flex items-center gap-2 flex-grow">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      className="flex-grow bg-zinc-900 border border-white/5 rounded-xl py-3 px-4 text-sm text-white"
                    />
                    <button
                      onClick={handleSendTurn}
                      className="p-3 bg-yellow-500 hover:bg-yellow-400 rounded-xl text-zinc-950 font-bold transition flex items-center cursor-pointer"
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Finish Convo Evaluation button */}
            {chatMessages.length >= 4 && (
              <button
                onClick={handleEvaluateSession}
                className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>End & Score</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ====== Scaffolding Hints Drawer / Modal Overlay ====== */}
          {showHelpDrawer && hints && (
            <div className="absolute inset-0 z-30 bg-zinc-950/90 backdrop-blur-sm p-6 flex flex-col justify-end">
              <div className="bg-zinc-900/90 rounded-t-3xl border border-white/10 p-5 space-y-4 max-h-[80%] overflow-y-auto shadow-2xl relative">
                <button
                  onClick={() => setShowHelpDrawer(false)}
                  className="absolute right-4 top-4 text-zinc-500 hover:text-white text-xs font-bold cursor-pointer"
                >
                  ✕ Close
                </button>

                <h4 className="text-sm font-black text-white flex items-center gap-2 border-b border-white/5 pb-2">
                  <HelpCircle className="w-4 h-4 text-brand-400" />
                  <span>Conversation Scaffolding Assistant</span>
                </h4>

                {/* Phrase Hints */}
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Recommended Sentences</span>
                  <div className="space-y-1.5">
                    {hints.phrase_hints?.map((ph: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setUserInput(ph);
                          setShowHelpDrawer(false);
                        }}
                        className="w-full text-left p-2.5 rounded-lg bg-zinc-950/60 hover:bg-zinc-950 border border-white/5 text-xs text-brand-300 font-bold transition flex items-center justify-between cursor-pointer group"
                      >
                        <span>{ph}</span>
                        <Check className="w-3.5 h-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 transition" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vocab Hints */}
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Useful Vocabulary</span>
                  <div className="grid grid-cols-2 gap-2">
                    {hints.vocab_hints?.map((vc: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setUserInput((v) => (v ? `${v} ${vc.word}` : vc.word));
                        }}
                        className="p-2 bg-zinc-950/40 rounded-lg border border-white/5 hover:border-white/10 text-[11px] cursor-pointer text-left transition"
                      >
                        <span className="font-extrabold text-white block">{vc.word}</span>
                        <span className="text-zinc-500">{vc.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grammar Hint */}
                {hints.grammar_hint && (
                  <div className="bg-zinc-950/60 p-3 rounded-lg border border-white/5 space-y-1 text-left text-xs">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase block">Grammar Scaffolding</span>
                    <p className="font-extrabold text-zinc-300">{hints.grammar_hint.pattern}</p>
                    <p className="text-zinc-500 font-mono italic">E.g., "{hints.grammar_hint.example}"</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====== Screen 5: Post-Conversation Feedback ====== */}
      {step === 5 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center max-w-2xl mx-auto">
          {evaluating ? (
            <div className="space-y-4 py-10">
              <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto" />
              <p className="text-white font-bold text-sm">Gwan-Sik is compiling your conversation feedback report...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/25 w-fit mx-auto text-emerald-400">
                <Award className="w-8 h-8 animate-bounce" />
              </div>
              <h2 className="text-3xl font-black text-white">Conversation Evaluation Report</h2>

              {/* Overall Score Box */}
              <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400 font-black uppercase tracking-wider">Overall Scenario Score</span>
                  <span className="text-xl font-mono text-emerald-400 font-black bg-emerald-500/10 px-3 py-1 rounded-lg">
                    {evalResult?.overall_score}/100
                  </span>
                </div>
                <p className="text-xs text-zinc-300 text-left leading-relaxed">{evalResult?.summary}</p>
              </div>

              {/* Score bars mapping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ScoreBar score={evalResult?.task_completion_score || 80} label="Task Completion" />
                <ScoreBar score={evalResult?.accuracy_score || 75} label="Grammar Accuracy" />
                <ScoreBar score={evalResult?.vocabulary_score || 70} label="Vocab Variety" />
                <ScoreBar score={evalResult?.fluency_score || 80} label="Speech Fluency" />
              </div>

              {/* Coach detailed bullet tips */}
              <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 text-left text-xs space-y-3">
                <p className="font-black text-zinc-200 text-sm border-b border-white/5 pb-1.5">💡 Tutor Gwan-Sik's Tips:</p>
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-0.5">Strengths:</span>
                  <ul className="list-disc list-inside text-zinc-400 pl-1 space-y-1">
                    {evalResult?.strengths?.map((str: string, i: number) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-0.5">Suggestions for improvement:</span>
                  <ul className="list-disc list-inside text-zinc-400 pl-1 space-y-1">
                    {evalResult?.suggestions?.map((sug: string, i: number) => (
                      <li key={i}>{sug}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleLoadReview}
                  className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-yellow-500/20"
                >
                  <span>Review Transcript</span>
                  <ChevronRight className="w-4 h-4 text-zinc-950" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====== Screen 6: Transcript & Targeted Review ====== */}
      {step === 6 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center max-w-2xl mx-auto">
          <div className="border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white">Review Transcript & Exercises</h2>
            <p className="text-xs text-zinc-500">Correct your sentences and map review redirections</p>
          </div>

          {loadingReview ? (
            <div className="text-center py-10">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-yellow-500" />
            </div>
          ) : (
            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-1 text-left">
              
              {/* Highlighted transcript review */}
              <div className="bg-zinc-950/40 p-5 rounded-2xl border border-white/5 space-y-3.5">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Dialogue Log</span>
                <div className="space-y-3">
                  {reviewData?.transcript?.map((m: any) => (
                    <div key={m.id} className="text-xs space-y-0.5">
                      <span className={`font-mono uppercase font-black tracking-wide ${m.sender === "user" ? "text-yellow-400" : "text-zinc-500"}`}>
                        {m.sender === "user" ? "You" : "Barista Gwan-Sik"}:
                      </span>
                      <p className={`text-zinc-300 font-sans leading-relaxed p-2 rounded ${
                        m.sender === "user" 
                          ? (m.correction ? "bg-red-500/5 text-red-300 border border-red-500/10" : "bg-emerald-500/5 text-emerald-300 border border-emerald-500/10")
                          : "bg-zinc-900/60"
                      }`}>
                        {m.text}
                      </p>
                      {m.correction && (
                        <p className="text-[11px] text-emerald-400 font-bold pl-2">
                          ✓ Correct: "{m.correction}" ({m.grammar_notes})
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Fix My Sentence quiz blocks */}
              {reviewData?.exercises?.length > 0 && (
                <div className="space-y-4">
                  <span className="text-[10px] text-amber-400 uppercase tracking-widest font-black block">💡 Fix My Sentences Exercises</span>
                  <div className="space-y-3">
                    {reviewData.exercises.map((ex: any) => {
                      const isCorrect = reviewChecked[ex.message_id] && (reviewAttempts[ex.message_id] || "").trim().replace(/\s/g, "") === ex.correction.trim().replace(/\s/g, "");
                      return (
                        <div key={ex.message_id} className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 space-y-3">
                          <p className="text-xs text-zinc-400">
                            Original response: <strong className="text-white">"{ex.original}"</strong>
                          </p>
                          <p className="text-[11px] text-zinc-500 italic">Hint: {ex.hint}</p>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={reviewAttempts[ex.message_id] || ""}
                              onChange={(e) => setReviewAttempts((prev) => ({ ...prev, [ex.message_id]: e.target.value }))}
                              placeholder="Type correct Korean sentence..."
                              className="flex-grow bg-zinc-950 border border-white/5 rounded-lg py-2 px-3 text-xs text-white"
                            />
                            <button
                              onClick={() => checkReviewAnswer(ex.message_id, ex.correction)}
                              className="px-3 bg-yellow-500 hover:bg-yellow-400 rounded-lg text-zinc-950 font-black text-xs transition cursor-pointer"
                            >
                              Check
                            </button>
                          </div>

                          {reviewChecked[ex.message_id] && (
                            <div className={`p-2.5 rounded border text-[11px] ${
                              isCorrect 
                                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                                : "bg-red-500/5 border-red-500/20 text-red-400"
                            }`}>
                              {isCorrect ? "✓ 맞아요! Correct!" : `✗ Wrong. Expected: "${ex.correction}"`}
                              <p className="text-zinc-400 text-[10px] mt-1">Rule: {ex.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Target review recommendations redirects */}
              {reviewData?.redirects?.length > 0 && (
                <div className="space-y-3 bg-zinc-900/20 p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Recommended Review Modules</span>
                  <div className="space-y-2">
                    {reviewData.redirects.map((rd: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-zinc-900/60 p-3 rounded-lg border border-white/5 hover:border-yellow-500/10 transition">
                        <div>
                          <p className="text-xs font-extrabold text-white">{rd.title}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{rd.reason}</p>
                        </div>
                        <span className="text-[10px] text-yellow-400 font-bold uppercase">Phase {rd.phase}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button
              onClick={onComplete}
              className="bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 hover:from-yellow-600 text-zinc-950 font-black py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow shadow-brand-500/10 hover:scale-102"
            >
              <span>Graduate Course & Return</span>
              <CheckCircle2 className="w-4 h-4 text-zinc-950" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
