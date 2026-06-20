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

const playCorrectSound = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 20, type: 'correct' } }));
  }
};

const playWrongSound = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: -10, type: 'wrong' } }));
  }
};

interface ConceptScreen {
  title: string;
  subtitle: string;
  paragraphs: string[];
  bulletPoints: string[];
  question: {
    stem: string;
    options: { id: string; text: string }[];
    correctId: string;
    explanation: string;
  };
}

const CONCEPT_SCREENS: Record<number, ConceptScreen> = {
  2: {
    title: "What This Lab Will Do",
    subtitle: "From Blocks to Out-Loud Korean",
    paragraphs: [
      "Until now, you learned how to read Hangeul. Now we use that knowledge to start saying Korean out loud.",
      "This capstone lab is not about perfect grammar yet. Instead, we want to help you build comfort, mimic natural native rhythm, and make your voice heard clearly."
    ],
    bulletPoints: [
      "Gain confidence speaking out loud",
      "Imitate native rhythm and pacing",
      "Overcome the fear of making mistakes"
    ],
    question: {
      stem: "What makes you most nervous when starting to speak Korean?",
      options: [
        { id: "A", text: "Reading text silently to myself" },
        { id: "B", text: "Speaking out loud and hearing my own pronunciation" },
        { id: "C", text: "Listening to fast native speakers" }
      ],
      correctId: "B",
      explanation: "It is completely normal to feel nervous about speaking out loud! Gwan-Sik is a warm, supportive partner designed to help you practice in a low-stakes environment."
    }
  },
  3: {
    title: "How Shadowing Works",
    subtitle: "Train your ears and mouth simultaneously",
    paragraphs: [
      "Shadowing means: listen to a short sentence, then say it with or right after the native speaker, trying to match rhythm, pitch, and speed as closely as you comfortably can.",
      "This process trains your ears and mouth at the same time, transitioning you from letters/spelling to sound chunks and full phrases."
    ],
    bulletPoints: [
      "Listen and copy sound rhythm, pitch, and speed",
      "Train mouth muscles to adapt to Korean phonology",
      "Develop automatic sound-chunking skills"
    ],
    question: {
      stem: "In shadowing, what matters more at this beginner level?",
      options: [
        { id: "A", text: "Having perfect grammar rules memorized" },
        { id: "B", text: "Copying the physical rhythm and sound flow" }
      ],
      correctId: "B",
      explanation: "At this stage, imitating the rhythm, pitch, and physical sounds is far more important than analyzing grammar rules!"
    }
  },
  4: {
    title: "What Gwan-Sik Listens For",
    subtitle: "Speech Recognition & Alignment",
    paragraphs: [
      "The app uses speech recognition (ASR) to turn your audio into text (transcription).",
      "It checks if key words/syllables appear correctly, if the length of your speech roughly matches the target, and if important sounds (like 받침, vowels) are present.",
      "Do not worry if the transcription is not 100% perfect; focus on speaking clearly and loudly."
    ],
    bulletPoints: [
      "Transcription is powered by speech recognition",
      "Aligned by acoustic match and syllable duration",
      "Acoustic alignment score shown for each turn"
    ],
    question: {
      stem: "If Gwan-Sik hears one syllable wrong in your sentence, what should you do?",
      options: [
        { id: "A", text: "Give up and close the conversation" },
        { id: "B", text: "Slow down, listen again, and repeat the target sound clearly" },
        { id: "C", text: "Speak faster so the app cannot track your syllables" }
      ],
      correctId: "B",
      explanation: "Slowing down and enunciating clearly is the best way to help the ASR recognize your pronunciation."
    }
  },
  5: {
    title: "Speak with Meaning",
    subtitle: "Using sentence frames to express yourself",
    paragraphs: [
      "A pattern is a short sentence frame you can fill with different words. Rather than just repeating sentences blindly, patterns let you construct real meaning.",
      "Using simple patterns, you can introduce yourself, say where you are from, and list things you like using Hangeul words you've learned."
    ],
    bulletPoints: [
      "저는 _이에요/예요. (I am ...)",
      "저는 _ 좋아해요. (I like ...)",
      "여기는 _이에요/예요. (This is ...)"
    ],
    question: {
      stem: "Which pattern is best to talk about your favorite foods or drinks?",
      options: [
        { id: "A", text: "저는 _ 이에요." },
        { id: "B", text: "저는 _ 좋아해요." }
      ],
      correctId: "B",
      explanation: "저는 _ 좋아해요 means 'I like _'. You can fill it with loanwords like coffee, pizza, etc."
    }
  },
  6: {
    title: "What 'Good Enough' Means",
    subtitle: "Aiming for confidence over perfection",
    paragraphs: [
      "At Course 0, 'good enough' means: syllables are recognisable, stress is not on each syllable separately (avoid robot speech), and you are not afraid to say basic sentences out loud.",
      "Perfect accent comes later; now you aim for clear and confident."
    ],
    bulletPoints: [
      "Pronounce syllables recognisably",
      "Speak smoothly rather than syllable-by-syllable",
      "Aim for confidence and volume"
    ],
    question: {
      stem: "What is your main preference after finishing this Capstone Conversation Lab?",
      options: [
        { id: "A", text: "Move into Course 1 (Everyday Basics)" },
        { id: "B", text: "Repeat capstone scenarios to build more speech confidence" }
      ],
      correctId: "A",
      explanation: "Great! Both options are excellent. Repeating helps build automaticity, while Course 1 introduces rich everyday context."
    }
  }
};

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

// Audio Recorder Hook
// ---------------------------------------------------------------------------
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

  // Persist step to localStorage for refresh resilience
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_phase6_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 10) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_phase6_step", String(step));
  }, [step]);

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

  // Concept Micro-questions state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [questionChecked, setQuestionChecked] = useState<boolean>(false);

  // Inline check in Chat
  const [inlineChecked, setInlineChecked] = useState(false);
  const [inlineSelected, setInlineSelected] = useState<string | null>(null);

  // Reset micro-question state when moving between steps
  useEffect(() => {
    setSelectedOption(null);
    setQuestionChecked(false);
  }, [step]);

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
        } else if (step === 7 && scenarios.length === 0) {
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
      setStep(8);
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
    setStep(9);
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
    setStep(10);
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

  const totalSteps = 10;

  const outlineSteps = [
    { num: 1, label: "Welcome & Mode Select" },
    { num: 2, label: "C1: From Blocks to Speaking" },
    { num: 3, label: "C2: Shadowing Works" },
    { num: 4, label: "C3: ASR & Gwan-Sik Listens" },
    { num: 5, label: "C4: Sentence Frames" },
    { num: 6, label: "C5: Good Enough Pronunciation" },
    { num: 7, label: "Scenario Selection" },
    { num: 8, label: "Conversation Chat" },
    { num: 9, label: "Post-Convo Feedback" },
    { num: 10, label: "Transcript & Review" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 1,
          phaseNum: 6,
          step: step
        }
      }));
    }
  }, [step]);

return (
    <div className="flex-grow flex flex-col justify-between">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center py-5 border-b border-white/5 mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Phase 6</span>
            <h2 className="font-black text-xl text-white tracking-tight">{activeLesson?.title || "Phase 6 – Conversation Lab"}</h2>
            <p className="text-xs text-zinc-400">Topic: Guided Interactive Role-Plays</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div className="flex-grow md:w-48 h-3 bg-zinc-900/80 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 via-orange-400 to-amber-500 rounded-full transition-all duration-500" 
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {outlineSteps.map(s => (
              <button
                key={s.num}
                onClick={() => {
                  setStep(s.num);
                  setShowOutline(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition ${step === s.num
                    ? "border-yellow-500 bg-yellow-500/10 text-white"
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

      {/* ====== Screen 1: Welcome & Mode Select ====== */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="relative mx-auto w-fit">
            <div className="p-4 bg-yellow-500/10 rounded-full border border-yellow-500/25 text-yellow-400">
              <Trophy className="w-12 h-12" />
            </div>
            <div className="absolute -top-1 -right-1 p-1.5 bg-brand-500 rounded-full border-2 border-zinc-950">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
          </div>
          <div>
            <h2 className="text-5xl font-black text-white tracking-tight">Hangeul 0.6</h2>
            <h3 className="text-2xl font-extrabold text-yellow-400 mt-2">Conversation Lab – Guided Role‑Plays (Capstone)</h3>
          </div>
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description ||
              "Practice short, realistic Korean conversations (3–8 turns) with an AI partner tuned to your level."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Capstone Goals:</p>
            <ul className="list-disc list-inside space-y-2 text-zinc-300 pl-1">
              <li>Combine greetings, self-intro, numbers, routines, and places</li>
              <li>Practice 3–5-turn conversations on familiar topics (home, daily life, plans)</li>
              <li>Build confidence for your first real conversations in Korean</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl mx-auto">
            {["Scenario-based", "Beginner Speaking", "Basic Dialogues", "Interactive Tutor"].map(chip => (
              <span key={chip} className="px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-xs text-yellow-300 font-bold">{chip}</span>
            ))}
          </div>

          {/* Mode Selection */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 max-w-xl mx-auto w-full space-y-4 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">⏱️ CEFR Level</span>
              <span className="text-sm font-bold text-zinc-300">{metadata?.cefr_band || "A1/A2 (Beginner)"}</span>
            </div>
            <div className="border-t border-white/[0.03] pt-4 space-y-3">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Choose Conversation Mode</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode("text")}
                  className={`p-3.5 rounded-xl border text-sm font-bold transition ${
                    mode === "text"
                      ? "border-yellow-500 bg-yellow-500/10 text-white"
                      : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                  }`}
                >
                  Text only
                </button>
                <button
                  onClick={() => setMode("voice")}
                  className={`p-3.5 rounded-xl border text-sm font-bold transition flex items-center justify-center gap-2 ${
                    mode === "voice"
                      ? "border-yellow-500 bg-yellow-500/10 text-white"
                      : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                  }`}
                >
                  <Mic className="w-4 h-4" /> Voice + Text
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
            <button
              onClick={() => {
                setStep(2);
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 15, type: 'theory' } }));
              }}
              className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-yellow-500/20 animate-pulse"
            >
              <Trophy className="w-5 h-5" /> Start Capstone Phase
            </button>
          </div>
        </div>
      )}

      {/* ====== Concept Screens 2 to 6 ====== */}
      {step >= 2 && step <= 6 && (() => {
        const concept = CONCEPT_SCREENS[step];
        if (!concept) return null;
        return (
          <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-between animate-fade-in text-left">
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-yellow-400">
                <BookOpen className="w-6 h-6" />
                <span className="text-xs font-black uppercase tracking-wider">Concept {step - 1} of 5</span>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight">{concept.title}</h2>
              <p className="text-sm text-yellow-400 font-mono italic">{concept.subtitle}</p>

              <div className="space-y-4 pt-2">
                {concept.paragraphs.map((para, idx) => (
                  <p key={idx} className="text-zinc-300 text-base leading-relaxed">{para}</p>
                ))}
              </div>

              <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Key Highlights:</span>
                <ul className="list-disc list-inside space-y-2 text-sm text-zinc-300 pl-1">
                  {concept.bulletPoints.map((pt, idx) => (
                    <li key={idx}>{pt}</li>
                  ))}
                </ul>
              </div>

              {/* Micro-question Section */}
              <div className="mt-8 border-t border-white/5 pt-8 space-y-5">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-yellow-400 animate-bounce" />
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Concept Check</span>
                </div>
                <p className="text-base font-extrabold text-white leading-snug">{concept.question.stem}</p>

                <div className="grid grid-cols-1 gap-3">
                  {concept.question.options.map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    const isCorrectOption = opt.id === concept.question.correctId;
                    
                    let buttonStyle = "border-white/5 bg-zinc-900/60 hover:border-white/10 text-zinc-300";
                    if (questionChecked) {
                      if (isCorrectOption) {
                        buttonStyle = "border-emerald-500 bg-emerald-500/10 text-white font-bold";
                      } else if (isSelected) {
                        buttonStyle = "border-red-500 bg-red-500/10 text-white font-bold";
                      } else {
                        buttonStyle = "border-white/5 bg-zinc-900/30 text-zinc-500 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={questionChecked}
                        onClick={() => {
                          setSelectedOption(opt.id);
                          setQuestionChecked(true);
                          if (opt.id === concept.question.correctId || step === 2 || step === 6) {
                            playCorrectSound();
                          } else {
                            playWrongSound();
                          }
                        }}
                        className={`p-4 rounded-xl border text-sm font-semibold text-left transition duration-300 flex justify-between items-center ${buttonStyle}`}
                      >
                        <span>{opt.text}</span>
                        {questionChecked && isCorrectOption && <Check className="w-4 h-4 text-emerald-400" />}
                        {questionChecked && isSelected && !isCorrectOption && <XCircle className="w-4 h-4 text-red-400" />}
                      </button>
                    );
                  })}
                </div>

                {questionChecked && (
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/5 text-sm text-zinc-400 leading-relaxed font-sans mt-3">
                    <strong className="text-zinc-200 block mb-1">Tutor Explanation:</strong>
                    {concept.question.explanation}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-white/5">
              <button
                onClick={() => setStep(step - 1)}
                className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm font-bold text-zinc-400 transition"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setStep(step + 1);
                  window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 15, type: 'theory' } }));
                }}
                disabled={!questionChecked}
                className="px-8 py-3 bg-yellow-500 disabled:opacity-40 hover:bg-yellow-400 text-zinc-955 font-black rounded-lg text-sm transition flex items-center gap-2 cursor-pointer shadow shadow-yellow-500/15"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4 text-zinc-950" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* ====== Screen 7: Scenario Selection (Old Screen 2) ====== */}
      {step === 7 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in text-left">
          <div className="border-b border-white/5 pb-5">
            <h2 className="text-4xl font-black text-white tracking-tight">Select a Role-Play Scenario</h2>
            <p className="text-sm text-zinc-400 mt-1">Pick a situation to practice with Gwan-Sik</p>
          </div>

          {/* Recommended scenarios */}
          {recommendedScenarios.length > 0 && (
            <div className="space-y-4">
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Recommended For Your Level</span>
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendedScenarios.map((sc) => (
                  <div
                    key={sc.id}
                    onClick={() => handleStartScenario(sc)}
                    className="glass-panel p-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.02] hover:border-amber-400/50 hover:bg-amber-500/[0.04] transition cursor-pointer text-left space-y-3.5 group animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-white text-lg group-hover:text-amber-300">{sc.title}</h4>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-mono">
                        {sc.cefr_level}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{sc.description}</p>
                    <div className="text-xs font-mono text-zinc-550 pt-2 border-t border-white/5">
                      Focus: {sc.focus_grammar}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Scenarios catalog */}
          <div className="space-y-4">
            <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">All Scenarios</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scenarios
                .filter((s) => !recommendedScenarios.some((r) => r.id === s.id))
                .map((sc) => (
                  <div
                    key={sc.id}
                    onClick={() => handleStartScenario(sc)}
                    className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/30 hover:border-yellow-500/30 hover:bg-zinc-900/60 transition cursor-pointer text-left space-y-3.5 group animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-white text-lg group-hover:text-yellow-400">{sc.title}</h4>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-zinc-800 text-zinc-400 font-mono">
                        {sc.cefr_level}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{sc.description}</p>
                    <div className="text-xs font-mono text-zinc-550 pt-2 border-t border-white/5">
                      Focus: {sc.focus_grammar}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex justify-start pt-4">
            <button
              onClick={() => setStep(6)}
              className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-450 text-sm font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Theory
            </button>
          </div>
        </div>
      )}

      {/* ====== Screen 8: Chat Runtime UI (Old Screen 3) ====== */}
      {step === 8 && (
        <div className="glass-panel neon-border p-8 rounded-[2.5rem] shadow-2xl w-full flex-grow flex flex-col justify-between min-h-[65vh] relative overflow-hidden text-left">
          {/* Convo Header info */}
          <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6 shrink-0">
            <div>
              <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest block font-mono">Role-Play Scenario</span>
              <h3 className="text-xl font-black text-white">{currentScenario?.title}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1 rounded border border-white/5">
                Role: {currentScenario?.role}
              </span>
            </div>
          </div>

          {/* Message Area */}
          <div className="flex-grow overflow-y-auto space-y-6 pr-2 mb-6 max-h-[50vh] min-h-[35vh]">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-4 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-md ${
                    msg.sender === "user"
                      ? "bg-brand-500/10 text-brand-400 border-brand-500/20"
                      : "bg-zinc-800 text-zinc-300 border-white/10"
                  }`}
                >
                  {msg.sender === "user" ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                </div>

                {/* Bubble content */}
                <div className="space-y-2">
                  <div
                    className={`p-4.5 rounded-2xl text-base leading-relaxed relative shadow-md ${
                      msg.sender === "user"
                        ? "bg-brand-500 text-zinc-950 font-semibold rounded-tr-none"
                        : "bg-zinc-900 text-zinc-100 rounded-tl-none border border-white/5"
                    }`}
                  >
                    {/* Speak icon for AI Korean messages */}
                    {msg.sender === "ai" && (
                      <button
                        onClick={() => playAudioUrl(msg.text)}
                        className="absolute right-3 top-3 p-1.5 rounded-lg bg-zinc-950 text-zinc-400 hover:text-white transition opacity-65 hover:opacity-100 cursor-pointer"
                        title="Listen speak audio"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}

                    <p className="pr-6">{msg.text}</p>

                    {/* Word highlight score for voice user attempt */}
                    {msg.sender === "user" && msg.pronScore !== undefined && (
                      <span className="block text-xs text-zinc-950/70 font-mono mt-1.5 font-black">
                        Acoustic alignment: {msg.pronScore.toFixed(0)}%
                      </span>
                    )}

                    {/* Corrections if any */}
                    {msg.correction && (
                      <div className="mt-3 pt-3 border-t border-red-500/20 text-sm text-red-400 font-sans space-y-2">
                        <p className="font-extrabold flex items-center gap-1">⚠️ Correction:</p>
                        <p className="italic bg-red-500/5 p-2 rounded-lg">{msg.correction}</p>
                      </div>
                    )}

                    {/* Grammar note tooltip */}
                    {msg.grammarNotes && !msg.correction && (
                      <div className="mt-3 pt-2 border-t border-yellow-500/10 text-xs text-yellow-300">
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
                        className="text-xs text-zinc-500 hover:text-zinc-300 font-bold transition"
                      >
                        {msg.showTranslation ? "Hide English" : "Translate"}
                      </button>
                      {msg.showTranslation && (
                        <p className="text-sm text-zinc-400 italic mt-1 font-sans leading-relaxed animate-in fade-in duration-200">
                          {msg.englishTranslation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Comprehension check rendered inline in log */}
            {chatMessages.length >= 3 && !inlineChecked && (
              <div className="my-6 p-6 rounded-3xl border border-yellow-500/30 bg-yellow-500/[0.03] space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-yellow-400 animate-bounce" />
                  <span className="text-xs font-black uppercase tracking-widest text-yellow-400">Comprehension Check</span>
                </div>
                <p className="text-base font-extrabold text-white leading-snug">What did Gwan-Sik ask you or say in the dialogue?</p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: "A", text: "To order a beverage or introduce yourself" },
                    { id: "B", text: "What country you are from" },
                    { id: "C", text: "To pay for a hotel room key" }
                  ].map((opt) => {
                    let btnStyle = "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300";
                    if (inlineSelected === opt.id) {
                      btnStyle = opt.id === "A" ? "border-emerald-500 bg-emerald-500/10 text-white font-bold" : "border-red-500 bg-red-500/10 text-white font-bold";
                    } else if (inlineSelected !== null && opt.id === "A") {
                      btnStyle = "border-emerald-500 bg-emerald-500/10 text-white";
                    }
                    return (
                      <button
                        key={opt.id}
                        disabled={inlineSelected !== null}
                        onClick={() => {
                          setInlineSelected(opt.id);
                          if (opt.id === "A") {
                            playCorrectSound();
                          } else {
                            playWrongSound();
                          }
                        }}
                        className={`p-4 rounded-xl border text-sm font-bold text-left transition flex justify-between items-center ${btnStyle}`}
                      >
                        <span>{opt.text}</span>
                        {inlineSelected !== null && opt.id === "A" && <Check className="w-4 h-4 text-emerald-400" />}
                        {inlineSelected === opt.id && opt.id !== "A" && <XCircle className="w-4 h-4 text-red-400" />}
                      </button>
                    );
                  })}
                </div>
                {inlineSelected !== null && (
                  <div className="pt-4 text-sm text-zinc-450 space-y-3 border-t border-white/5 font-sans leading-relaxed">
                    <p className="font-extrabold text-zinc-300">Explanation:</p>
                    <p>Gwan-Sik welcomed you and asked for your order or name depending on the scenario chosen. Always listen carefully to the first turn to respond correctly!</p>
                    <button
                      onClick={() => setInlineChecked(true)}
                      className="mt-3 px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black rounded-lg text-xs transition"
                    >
                      Continue Chat
                    </button>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Interactive hints preview area */}
          {userInput === "" && mode === "text" && (
            <div className="flex gap-2.5 justify-center mb-4 flex-wrap">
              {currentScenario?.key_phrases.slice(0, 2).map((kp: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setUserInput(kp)}
                  className="px-4 py-1.5 bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-yellow-500/20 text-xs rounded-xl text-zinc-400 transition cursor-pointer"
                >
                  💡 Try: "{kp}"
                </button>
              ))}
            </div>
          )}

          {/* Input control tray */}
          <div className="border-t border-white/5 pt-5 shrink-0 flex items-center gap-4">
            {/* Scaffolding Help Button */}
            <button
              onClick={loadHints}
              disabled={loadingHints}
              className="p-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-white/5 transition flex items-center justify-center shrink-0 cursor-pointer shadow-md"
              title="Show scaffolding hints"
            >
              {loadingHints ? <Loader2 className="w-6 h-6 animate-spin" /> : <HelpCircle className="w-6 h-6 text-yellow-400" />}
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
                  disabled={sendingTurn || (chatMessages.length >= 3 && !inlineChecked)}
                  className="w-full bg-zinc-900 border border-white/5 rounded-xl py-4 pl-5 pr-12 text-base focus:outline-none focus:border-yellow-500 transition text-white placeholder-zinc-500"
                />
                <button
                  onClick={handleSendTurn}
                  disabled={sendingTurn || !userInput.trim() || (chatMessages.length >= 3 && !inlineChecked)}
                  className="absolute right-2.5 top-2.5 p-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-30 rounded-lg text-zinc-950 transition cursor-pointer"
                >
                  {sendingTurn ? <Loader2 className="w-5 h-5 animate-spin" /> : <CornerDownLeft className="w-5 h-5" />}
                </button>
              </div>
            ) : (
              // Voice mode click-to-toggle record
              <div className="flex-grow flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (rec.recording) {
                      handleStopRecording();
                    } else {
                      rec.start();
                    }
                  }}
                  disabled={sendingTurn || transcribingVoice || (chatMessages.length >= 3 && !inlineChecked)}
                  className={`flex-grow flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-base transition cursor-pointer ${
                    rec.recording
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-accent-teal hover:bg-accent-teal/90 text-zinc-950 font-black"
                  } disabled:opacity-40 shadow-md`}
                >
                  {rec.recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  <span>{rec.recording ? "Stop Recording" : "Click & Speak"}</span>
                </button>

                {/* Audio preview text input box */}
                {userInput.trim() !== "" && !rec.recording && (
                  <div className="flex items-center gap-3 flex-grow animate-in slide-in-from-right-4 duration-200">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      className="flex-grow bg-zinc-900 border border-white/5 rounded-xl py-4 px-5 text-base text-white focus:outline-none focus:border-yellow-500"
                    />
                    <button
                      onClick={handleSendTurn}
                      className="py-4 px-6 bg-yellow-500 hover:bg-yellow-400 rounded-xl text-zinc-950 font-black text-sm transition flex items-center cursor-pointer shadow-md"
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
                className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black text-sm rounded-xl shadow-lg transition flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <span>End & Score</span>
                <ArrowRight className="w-4 h-4 text-zinc-950" />
              </button>
            )}
          </div>

          {/* ====== Scaffolding Hints Drawer / Modal Overlay ====== */}
          {showHelpDrawer && hints && (
            <div className="absolute inset-0 z-30 bg-zinc-950/90 backdrop-blur-sm p-8 flex flex-col justify-end">
              <div className="bg-zinc-900/90 rounded-t-[2rem] border border-white/10 p-6 space-y-5 max-h-[85%] overflow-y-auto shadow-2xl relative">
                <button
                  onClick={() => setShowHelpDrawer(false)}
                  className="absolute right-5 top-5 text-zinc-550 hover:text-white text-sm font-extrabold cursor-pointer"
                >
                  ✕ Close
                </button>

                <h4 className="text-base font-black text-white flex items-center gap-2.5 border-b border-white/5 pb-3">
                  <HelpCircle className="w-5 h-5 text-brand-400" />
                  <span>Conversation Scaffolding Assistant</span>
                </h4>

                {/* Phrase Hints */}
                <div className="space-y-3">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Recommended Sentences</span>
                  <div className="space-y-2">
                    {hints.phrase_hints?.map((ph: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setUserInput(ph);
                          setShowHelpDrawer(false);
                        }}
                        className="w-full text-left p-3.5 rounded-xl bg-zinc-950/60 hover:bg-zinc-950 border border-white/5 text-sm text-brand-300 font-bold transition flex items-center justify-between cursor-pointer group"
                      >
                        <span>{ph}</span>
                        <Check className="w-4 h-4 text-zinc-550 opacity-0 group-hover:opacity-100 transition" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vocab Hints */}
                <div className="space-y-3">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Useful Vocabulary</span>
                  <div className="grid grid-cols-2 gap-3">
                    {hints.vocab_hints?.map((vc: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setUserInput((v) => (v ? `${v} ${vc.word}` : vc.word));
                        }}
                        className="p-3 bg-zinc-950/40 rounded-xl border border-white/5 hover:border-white/10 text-xs cursor-pointer text-left transition"
                      >
                        <span className="font-extrabold text-white block text-sm">{vc.word}</span>
                        <span className="text-zinc-450 mt-0.5 block">{vc.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grammar Hint */}
                {hints.grammar_hint && (
                  <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 space-y-1.5 text-left text-xs leading-relaxed">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase block">Grammar Scaffolding</span>
                    <p className="font-extrabold text-zinc-300">{hints.grammar_hint.pattern}</p>
                    <p className="text-zinc-450 font-mono italic">E.g., "{hints.grammar_hint.example}"</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====== Screen 9: Post-Conversation Feedback (Old Screen 5) ====== */}
      {step === 9 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          {evaluating ? (
            <div className="space-y-4 py-12">
              <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mx-auto" />
              <p className="text-white font-bold text-base">Gwan-Sik is compiling your conversation feedback report...</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/25 w-fit mx-auto text-emerald-400">
                <Award className="w-10 h-10 animate-bounce" />
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight">Conversation Evaluation Report</h2>

              {/* Overall Score Box */}
              <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-3xl mx-auto w-full">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400 font-black uppercase tracking-wider">Overall Scenario Score</span>
                  <span className="text-2xl font-mono text-emerald-400 font-black bg-emerald-500/10 px-4 py-1.5 rounded-xl">
                    {evalResult?.overall_score}/100
                  </span>
                </div>
                <p className="text-sm text-zinc-300 text-left leading-relaxed">{evalResult?.summary}</p>
              </div>

              {/* Score bars mapping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
                <ScoreBar score={evalResult?.task_completion_score || 80} label="Task Completion" />
                <ScoreBar score={evalResult?.accuracy_score || 75} label="Grammar Accuracy" />
                <ScoreBar score={evalResult?.vocabulary_score || 70} label="Vocab Variety" />
                <ScoreBar score={evalResult?.fluency_score || 80} label="Speech Fluency" />
              </div>

              {/* Coach detailed bullet tips */}
              <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 text-left text-sm space-y-4 max-w-3xl mx-auto w-full leading-relaxed">
                <p className="font-black text-zinc-200 text-base border-b border-white/5 pb-2">💡 Tutor Gwan-Sik's Tips:</p>
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">Strengths:</span>
                  <ul className="list-disc list-inside text-zinc-400 pl-1 space-y-1">
                    {evalResult?.strengths?.map((str: string, i: number) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1">Suggestions for improvement:</span>
                  <ul className="list-disc list-inside text-zinc-400 pl-1 space-y-1">
                    {evalResult?.suggestions?.map((sug: string, i: number) => (
                      <li key={i}>{sug}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Reflective Micro-question */}
              <div className="bg-zinc-950/60 p-6 rounded-2xl border border-white/5 space-y-5 text-left max-w-3xl mx-auto w-full">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-yellow-400 animate-bounce" />
                  <span className="text-xs font-black uppercase tracking-widest text-yellow-400">Reflective Check-in</span>
                </div>
                <p className="text-base font-extrabold text-white leading-snug">Which tip do you want to focus on in your next conversation?</p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: "A", text: "Better endings (이에요/예요)" },
                    { id: "B", text: "Clearer pronunciation of specific words" },
                    { id: "C", text: "Asking more questions back to Gwan-Sik" }
                  ].map((opt) => {
                    let btnStyle = "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300";
                    if (selectedOption === opt.id) {
                      btnStyle = "border-emerald-500 bg-emerald-500/10 text-white font-bold";
                    }
                    return (
                      <button
                        key={opt.id}
                        disabled={questionChecked}
                        onClick={() => {
                          setSelectedOption(opt.id);
                          setQuestionChecked(true);
                          playCorrectSound();
                        }}
                        className={`p-4 rounded-xl border text-sm font-bold text-left transition flex justify-between items-center ${btnStyle}`}
                      >
                        <span>{opt.text}</span>
                        {selectedOption === opt.id && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
                {questionChecked && (
                  <p className="text-sm text-zinc-400 italic font-sans leading-relaxed">
                    Awesome goal! Focusing on this area will help customize your next feedback session.
                  </p>
                )}
              </div>

              <div className="flex gap-4 justify-center pt-2">
                <button
                  onClick={handleLoadReview}
                  disabled={!questionChecked}
                  className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-zinc-950 font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/20"
                >
                  <span>Review Transcript</span>
                  <ChevronRight className="w-4 h-4 text-zinc-950" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====== Screen 10: Transcript & Targeted Review (Old Screen 6) ====== */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="border-b border-white/5 pb-5 text-left">
            <h2 className="text-4xl font-black text-white tracking-tight">Review Transcript & Exercises</h2>
            <p className="text-sm text-zinc-450 mt-1">Correct your sentences and map review redirections</p>
          </div>

          {loadingReview ? (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-yellow-500" />
            </div>
          ) : (
            <div className="space-y-8 max-h-[55vh] overflow-y-auto pr-2 text-left">
              
              {/* Highlighted transcript review */}
              <div className="bg-zinc-950/40 p-6 rounded-2xl border border-white/5 space-y-4">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-mono">Dialogue Log</span>
                <div className="space-y-4">
                  {reviewData?.transcript?.map((m: any) => (
                    <div key={m.id} className="text-sm space-y-1">
                      <span className={`font-mono uppercase font-black tracking-wide text-xs ${m.sender === "user" ? "text-yellow-400" : "text-zinc-500"}`}>
                        {m.sender === "user" ? "You" : "Tutor Gwan-Sik"}:
                      </span>
                      <p className={`text-zinc-200 font-sans leading-relaxed p-3.5 rounded-xl ${
                        m.sender === "user" 
                          ? (m.correction ? "bg-red-500/5 text-red-300 border border-red-500/10" : "bg-emerald-500/5 text-emerald-300 border border-emerald-500/10")
                          : "bg-zinc-900/60"
                      }`}>
                        {m.text}
                      </p>
                      {m.correction && (
                        <p className="text-xs text-emerald-400 font-extrabold pl-2 leading-relaxed">
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
                  <span className="text-[10px] text-amber-400 uppercase tracking-widest font-black block font-mono">💡 Fix My Sentences Exercises</span>
                  <div className="space-y-4">
                    {reviewData.exercises.map((ex: any) => {
                      const isCorrect = reviewChecked[ex.message_id] && (reviewAttempts[ex.message_id] || "").trim().replace(/\s/g, "") === ex.correction.trim().replace(/\s/g, "");
                      return (
                        <div key={ex.message_id} className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5 space-y-4 animate-in fade-in duration-200">
                          <p className="text-sm text-zinc-450 leading-relaxed">
                            Original response: <strong className="text-white">"{ex.original}"</strong>
                          </p>
                          <p className="text-xs text-zinc-500 italic">Hint: {ex.hint}</p>

                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={reviewAttempts[ex.message_id] || ""}
                              onChange={(e) => setReviewAttempts((prev) => ({ ...prev, [ex.message_id]: e.target.value }))}
                              placeholder="Type correct Korean sentence..."
                              className="flex-grow bg-zinc-950 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-yellow-500"
                            />
                            <button
                              onClick={() => checkReviewAnswer(ex.message_id, ex.correction)}
                              className="px-5 bg-yellow-500 hover:bg-yellow-400 rounded-xl text-zinc-950 font-black text-sm transition cursor-pointer"
                            >
                              Check
                            </button>
                          </div>

                          {reviewChecked[ex.message_id] && (
                            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                              isCorrect 
                                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                                : "bg-red-500/5 border-red-500/20 text-red-400"
                            }`}>
                              {isCorrect ? "✓ 맞아요! Correct!" : `✗ Wrong. Expected: "${ex.correction}"`}
                              <p className="text-zinc-550 text-[11px] mt-1.5 font-sans leading-relaxed">Rule: {ex.explanation}</p>
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
                <div className="space-y-4 bg-zinc-900/20 p-5 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block font-mono">Recommended Review Modules</span>
                  <div className="space-y-3">
                    {reviewData.redirects.map((rd: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-zinc-900/60 p-4 rounded-xl border border-white/5 hover:border-yellow-500/10 transition leading-relaxed">
                        <div>
                          <p className="text-sm font-extrabold text-white">{rd.title}</p>
                          <p className="text-xs text-zinc-450 mt-1">{rd.reason}</p>
                        </div>
                        <span className="text-[10px] text-yellow-400 font-bold uppercase font-mono bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">Phase {rd.phase}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Redirection Choice Check */}
              <div className="bg-zinc-950/60 p-6 rounded-2xl border border-white/5 space-y-5">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-yellow-400 animate-bounce" />
                  <span className="text-xs font-black uppercase tracking-widest text-yellow-400">Review Focus Check</span>
                </div>
                <p className="text-base font-extrabold text-white leading-snug">Which recommended review module will you visit first?</p>
                <div className="grid grid-cols-1 gap-3">
                  {(reviewData?.redirects || []).map((rd: any, idx: number) => {
                    const optId = `R_${idx}`;
                    let btnStyle = "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300";
                    if (selectedOption === optId) {
                      btnStyle = "border-emerald-500 bg-emerald-500/10 text-white font-bold";
                    }
                    return (
                      <button
                        key={idx}
                        disabled={questionChecked}
                        onClick={() => {
                          setSelectedOption(optId);
                          setQuestionChecked(true);
                          playCorrectSound();
                        }}
                        className={`p-4 rounded-xl border text-sm font-bold text-left transition flex justify-between items-center ${btnStyle}`}
                      >
                        <span>{rd.title}</span>
                        {selectedOption === optId && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
                {questionChecked && (
                  <p className="text-sm text-zinc-450 italic font-sans leading-relaxed">
                    Excellent choice. Tackling your weak points systematically guarantees rapid fluency progress.
                  </p>
                )}
              </div>

            </div>
          )}

          <div className="pt-5 border-t border-white/5 flex justify-end">
            <button
              onClick={onComplete}
              disabled={!questionChecked}
              className="bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 hover:from-yellow-600 disabled:opacity-40 text-zinc-950 font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2 cursor-pointer shadow shadow-brand-500/10 hover:scale-102"
            >
              <span>Graduate Course & Return</span>
              <CheckCircle2 className="w-5 h-5 text-zinc-950" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
