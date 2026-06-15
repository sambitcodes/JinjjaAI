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
        const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/wav" });
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

interface Course2Phase4RoutineWizardProps {
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

export default function Course2Phase4RoutineWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course2Phase4RoutineWizardProps) {
  const rec = useRecorder();
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 12;

  // Persist step to localStorage for refresh resilience
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c1p4_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 12) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c1p4_step", String(step));
  }, [step]);

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

  // Concept Micro-questions states
  const [cSelected, setCSelected] = useState<string | null>(null);
  const [cChecked, setCChecked] = useState(false);
  const [cCorrect, setCCorrect] = useState<boolean | null>(null);
  const [cIdx, setCIdx] = useState(0);

  // Reset concept states on step change
  useEffect(() => {
    if (step >= 2 && step <= 6) {
      setCSelected(null);
      setCChecked(false);
      setCCorrect(null);
      setCIdx(0);
    }
  }, [step]);

  // Concept Micro-questions definitions
  const conceptQuestions: Record<number, MicroQuestion[]> = {
    2: [
      {
        question: "Which of these count as routine actions?",
        options: [
          { id: "A", text: "Wake up, eat breakfast, go to work" },
          { id: "B", text: "Go on vacation once a year" }
        ],
        correctId: "A",
        explanation: "Routines represent high-frequency actions that happen regularly (daily or weekly)."
      }
    ],
    3: [
      {
        question: "Which one represents a dictionary form verb?",
        options: [
          { id: "A", text: "가다 (Ga-da)" },
          { id: "B", text: "가요 (Ga-yo)" }
        ],
        correctId: "A",
        explanation: "Dictionary forms in Korean always end in -다."
      },
      {
        question: "Which one would you say to describe your daily routine?",
        options: [
          { id: "A", text: "먹다 (Meok-da)" },
          { id: "B", text: "먹어요 (Meok-eo-yo)" }
        ],
        correctId: "B",
        explanation: "Polite present tense forms ending in -요 are used to describe habits or daily activities."
      }
    ],
    4: [
      {
        question: "Which polite form matches the verb 먹다?",
        options: [
          { id: "A", text: "먹아요" },
          { id: "B", text: "먹어요" }
        ],
        correctId: "B",
        explanation: "The vowel in 먹 is ㅓ (not ㅏ or ㅗ), so it takes -어요 to form 먹어요."
      },
      {
        question: "Which polite form matches 공부하다?",
        options: [
          { id: "A", text: "공부해요" },
          { id: "B", text: "공부해요요" }
        ],
        correctId: "A",
        explanation: "하다 verbs always simplify to 해요 (공부하다 -> 공부해요)."
      }
    ],
    5: [
      {
        question: "Which verb means 'to sleep'?",
        options: [
          { id: "A", text: "자다" },
          { id: "B", text: "가다" }
        ],
        correctId: "A",
        explanation: "자다 means to sleep, whereas 가다 means to go."
      },
      {
        question: "Which polite form fits 'I study'?",
        options: [
          { id: "A", text: "공부해요" },
          { id: "B", text: "공부가요" }
        ],
        correctId: "A",
        explanation: "공부해요 is 'I study' (from 공부하다)."
      }
    ],
    6: [
      {
        question: "Which sentence could come first in a morning routine?",
        options: [
          { id: "A", text: "저는 열한 시에 자요." },
          { id: "B", text: "저는 일곱 시에 일어나요." }
        ],
        correctId: "B",
        explanation: "Waking up (일어나요) logically starts the morning routine."
      }
    ]
  };

  // Activity 7: Grid & flips MCQ states
  const [activeCatalogIdx, setActiveCatalogIdx] = useState(0);
  const [catalogSelectedOpt, setCatalogSelectedOpt] = useState<string | null>(null);
  const [catalogChecked, setCatalogChecked] = useState(false);
  const [catalogCorrect, setCatalogCorrect] = useState<boolean | null>(null);

  // Activity 8: Conjugation Match states
  const [conjugationIdx, setConjugationIdx] = useState(0);
  const [selectedConjOpt, setSelectedConjOpt] = useState<string | null>(null);
  const [conjChecked, setConjChecked] = useState(false);
  const [conjCorrect, setConjCorrect] = useState<boolean | null>(null);

  // Activity 9: Routine builder states
  const [morningChoice, setMorningChoice] = useState("일어나요");
  const [dayChoice, setDayChoice] = useState("학교에 가요");
  const [eveningChoice, setEveningChoice] = useState("자요");
  const [builtRoutine, setBuiltRoutine] = useState<any>(null);
  const [building, setBuilding] = useState(false);
  const [savingRoutine, setSavingRoutine] = useState(false);
  const [routineSaved, setRoutineSaved] = useState(false);
  const [routineReflectChecked, setRoutineReflectChecked] = useState(false);
  const [routineReflectSelected, setRoutineReflectSelected] = useState<string | null>(null);

  // Activity 10: Speaking reflection states
  const [speakReflectChecked, setSpeakReflectChecked] = useState(false);
  const [speakReflectSelected, setSpeakReflectSelected] = useState<string | null>(null);

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
  const [speakingTranscribing, setSpeakingTranscribing] = useState(false);
  const [speakingResult, setSpeakingResult] = useState<any>(null);

  // Homework check states
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Tutor session launch states
  const [tutorSession, setTutorSession] = useState<any>(null);
  const [loadingTutor, setLoadingTutor] = useState(false);

  // Sound and XP dispatches
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

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/lessons/phases/korean1/4/metadata");
          setMetadata(res);
        } else if ((step === 2 || step === 7 || step === 8) && !coreData) {
          const res = await apiJson("/lessons/phases/korean1/4/core-data");
          setCoreData(res);
        } else if (step === 8 && practiceVerbs.length === 0) {
          const res_v = await apiJson("/lessons/practice/daily-verbs/recognition");
          const res_s = await apiJson("/lessons/practice/daily-sentences/recognition");
          setPracticeVerbs(res_v.items || []);
          setPracticeSentences(res_s.items || []);
        } else if (step === 9 && !templates) {
          const res_t = await apiJson("/lessons/practice/routine/templates");
          setTemplates(res_t);
          if (res_t.morning?.length) setMorningChoice(res_t.morning[0].ko);
          if (res_t.daytime?.length) setDayChoice(res_t.daytime[0].ko);
          if (res_t.evening?.length) setEveningChoice(res_t.evening[0].ko);
        } else if (step === 11 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/lessons/quiz/korean1/phase-4/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 12 && homeworkItems.length === 0) {
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

  // Concept Screen checking handler
  const handleCheckConcept = (selectedId: string) => {
    if (cChecked) return;
    const currentQ = conceptQuestions[step]?.[cIdx];
    if (!currentQ) return;

    setCSelected(selectedId);
    const isCorrect = selectedId === currentQ.correctId;
    setCChecked(true);
    setCCorrect(isCorrect);
    
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
  };

  // Concept Screen next helper
  const handleNextConcept = () => {
    const list = conceptQuestions[step] || [];
    if (cIdx < list.length - 1) {
      setCIdx(cIdx + 1);
      setCSelected(null);
      setCChecked(false);
      setCCorrect(null);
    } else {
      setStep(step + 1);
    }
  };

  // Activity 1: Verb Grid Flip MCQ
  const handleCheckCatalogCard = (opt: string) => {
    if (catalogChecked) return;
    setCatalogSelectedOpt(opt);
    const correctVal = activeCatalogIdx === 0 ? "A" : "B"; // sample conjugation matching test
    const isCorrect = opt === correctVal;
    setCatalogChecked(true);
    setCatalogCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  // Activity 2: Conjugation match
  const handleCheckConjugation = () => {
    const item = practiceVerbs[conjugationIdx];
    if (!item || !selectedConjOpt) return;

    const isCorrect = selectedConjOpt === item.correct;
    setConjChecked(true);
    setConjCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  // Activity 3: Paragraph builder
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

  const handleCheckRoutineReflect = (opt: string) => {
    setRoutineReflectSelected(opt);
    setRoutineReflectChecked(true);
    playCorrectSound();
  };

  // Activity 4: Speaking check
  const handleSpeechEvaluate = async () => {
    const target = builtRoutine?.final_korean_text || "저는 아침에 일어나요";
    if (!rec.audioBlob) return;
    setSpeakingTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("target_text", target);
      fd.append("audio_file", rec.audioBlob, "recording.wav");
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

  const handleCheckSpeakReflect = (opt: string) => {
    setSpeakReflectSelected(opt);
    setSpeakReflectChecked(true);
    playCorrectSound();
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
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
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
        setStep(12);
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
            <p className="text-xs text-zinc-500">Curated Topic: Daily Routines</p>
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
              <p>✓ C1 – What is a routine in Korean?</p>
              <p>✓ C2 – Dictionary vs polite present (‑다 → ‑요)</p>
              <p>✓ C3 – Basic present tense pattern (‑아요/‑어요)</p>
              <p>✓ C4 – Core daily verbs subset catalog</p>
              <p>✓ C5 – Assembling routine sentences into paragraphs</p>
              <p>✓ Activity 1 – Daily activities verb grids & card flips</p>
              <p>✓ Activity 2 – Present tense verb conjugation matches</p>
              <p>✓ Activity 3 – Multi-line routine builder assembler</p>
              <p>✓ Activity 4 – Spoken routine read-aloud assessment</p>
              <p>✓ Activity 5 – Graduating checkpoint mini-quiz checks</p>
            </div>
          )}
        </div>
      )}

      {/* Screen 2: C1 - What is a routine in Korean */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">What is a routine in Korean?</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            A routine describes what you do regularly—every morning, afternoon, or night. 
            In Korean, daily routines are expressed in present tense polite forms (해요체):
          </p>
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 font-mono text-center text-xs text-zinc-300 space-y-1.5 max-w-sm mx-auto">
            <p>“I wake up at 7.”</p>
            <p>“I go to school.”</p>
            <p>“I study Korean.”</p>
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Concept Check</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[2][cIdx].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[2][cIdx].options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleCheckConcept(opt.id)}
                  disabled={cChecked}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                    cSelected === opt.id
                      ? cCorrect
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-red-500 bg-red-500/10 text-white"
                      : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                  } ${cChecked && opt.id === conceptQuestions[2][cIdx].correctId ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {cChecked && (
              <div className="animate-fade-in space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">{conceptQuestions[2][cIdx].explanation}</p>
                <button
                  onClick={handleNextConcept}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen 3: C2 - Verb dictionary form vs polite present */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Dictionary Form vs Polite Present</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            Korean verbs end in <strong>-다</strong> in the dictionary, but change to <strong>-요</strong> when spoken politely.
          </p>
          <div className="grid grid-cols-2 gap-4 text-xs font-mono max-w-md mx-auto text-zinc-300">
            <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-zinc-500 block">Dictionary (-다)</span>
              <p className="font-bold mt-1 text-white">가다 (to go)</p>
              <p className="font-bold text-white">먹다 (to eat)</p>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-zinc-500 block">Polite present (-요)</span>
              <p className="font-bold mt-1 text-brand-400">가요 (go)</p>
              <p className="font-bold text-brand-400">먹어요 (eat)</p>
            </div>
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Concept Check</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[3][cIdx].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[3][cIdx].options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleCheckConcept(opt.id)}
                  disabled={cChecked}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                    cSelected === opt.id
                      ? cCorrect
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-red-500 bg-red-500/10 text-white"
                      : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                  } ${cChecked && opt.id === conceptQuestions[3][cIdx].correctId ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {cChecked && (
              <div className="animate-fade-in space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">{conceptQuestions[3][cIdx].explanation}</p>
                <button
                  onClick={handleNextConcept}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen 4: C3 - Basic present tense pattern */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Basic Present Tense Conjugation</h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Drop the ending <strong>-다</strong> from the verb to get its stem:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-300 text-xs pl-4">
            <li>If the stem vowel is <strong>ㅏ</strong> or <strong>ㅗ</strong> → add <strong>-아요</strong> (e.g. 가다 → 가요)</li>
            <li>Otherwise → add <strong>-어요</strong> (e.g. 먹다 → 먹어요)</li>
            <li><strong>하다</strong> verbs always conjugate directly to <strong>해요</strong> (e.g. 공부하다 → 공부해요)</li>
          </ul>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Concept Check</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[4][cIdx].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[4][cIdx].options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleCheckConcept(opt.id)}
                  disabled={cChecked}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                    cSelected === opt.id
                      ? cCorrect
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-red-500 bg-red-500/10 text-white"
                      : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                  } ${cChecked && opt.id === conceptQuestions[4][cIdx].correctId ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {cChecked && (
              <div className="animate-fade-in space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">{conceptQuestions[4][cIdx].explanation}</p>
                <button
                  onClick={handleNextConcept}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen 5: C4 - Core daily verbs */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Core Daily Verbs</h2>
          <p className="text-zinc-300 text-base leading-relaxed font-sans">
            Here are high-frequency verbs to build your schedule:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            {coreData?.verbs?.slice(0, 4).map((v: any) => (
              <div key={v.id} className="p-3 bg-zinc-900/60 border border-white/5 rounded-xl space-y-1">
                <div className="font-bold text-white font-korean">{v.korean}</div>
                <div className="text-[10px] text-brand-400 font-mono">Present: {v.polite}</div>
                <div className="text-[10px] text-zinc-500 italic">({v.english})</div>
              </div>
            ))}
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Concept Check</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[5][cIdx].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[5][cIdx].options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleCheckConcept(opt.id)}
                  disabled={cChecked}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                    cSelected === opt.id
                      ? cCorrect
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-red-500 bg-red-500/10 text-white"
                      : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                  } ${cChecked && opt.id === conceptQuestions[5][cIdx].correctId ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {cChecked && (
              <div className="animate-fade-in space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">{conceptQuestions[5][cIdx].explanation}</p>
                <button
                  onClick={handleNextConcept}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen 6: C5 - From single sentences to a routine paragraph */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Stitching Routine Paragraphs</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            By compiling time descriptions with action verbs, you create a routine:
          </p>
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 text-center font-mono max-w-sm mx-auto space-y-1 text-sm text-brand-300 font-korean">
            <p>저는 일곱 시에 일어나요. (Wake up at 7)</p>
            <p>학교에 가요. (Go to school)</p>
            <p>한국어를 공부해요. (Study Korean)</p>
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Concept Check</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[6][cIdx].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[6][cIdx].options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleCheckConcept(opt.id)}
                  disabled={cChecked}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                    cSelected === opt.id
                      ? cCorrect
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-red-500 bg-red-500/10 text-white"
                      : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                  } ${cChecked && opt.id === conceptQuestions[6][cIdx].correctId ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {cChecked && (
              <div className="animate-fade-in space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">{conceptQuestions[6][cIdx].explanation}</p>
                <button
                  onClick={handleNextConcept}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen 7: Activity 1 – Daily activities verb grids & card flips */}
      {step === 7 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Verb Flip Grid</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of {totalSteps}</span>
          </div>

          <p className="text-xs text-zinc-400">
            Tap cards to flip from Dictionary (-다) to Polite present (-요). Complete the active match below.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {coreData?.verbs?.slice(0, 4).map((v: any, idx: number) => {
              const isActive = activeCatalogIdx === idx;
              const isFlipped = flippedVerbId === v.id;
              
              return (
                <div
                  key={v.id}
                  onClick={() => {
                    setActiveCatalogIdx(idx);
                    setFlippedVerbId(isFlipped ? null : v.id);
                    playAudio(v.polite);
                    // Reset MCQ
                    setCatalogChecked(false);
                    setCatalogSelectedOpt(null);
                    setCatalogCorrect(null);
                  }}
                  className={`glass-panel p-4 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                    isActive ? "border-brand-500 bg-brand-500/5 shadow-md" : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800"
                  }`}
                >
                  {!isFlipped ? (
                    <div className="space-y-1">
                      <div className="text-lg font-black text-white font-korean">{v.korean}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Dictionary Form</div>
                    </div>
                  ) : (
                    <div className="animate-fade-in space-y-0.5">
                      <span className="text-sm font-black text-brand-400 font-korean">{v.polite}</span>
                      <p className="text-[9px] text-zinc-500 italic">"{v.english}"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-left">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Conjugation drill: {coreData?.verbs?.[activeCatalogIdx]?.korean}</h4>
            <p className="text-xs text-zinc-300 font-bold">Which polite form is built from this verb?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCheckCatalogCard("A")}
                disabled={catalogChecked}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                  catalogSelectedOpt === "A"
                    ? catalogCorrect
                      ? "border-accent-teal bg-accent-teal/15 text-white"
                      : "border-red-500 bg-red-500/10 text-white"
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                } ${catalogChecked && (activeCatalogIdx === 0 ? "A" === "A" : "B" === "B") ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
              >
                {activeCatalogIdx === 0 ? "자요" : "먹어요"}
              </button>

              <button
                onClick={() => handleCheckCatalogCard("B")}
                disabled={catalogChecked}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                  catalogSelectedOpt === "B"
                    ? (activeCatalogIdx === 0 ? false : catalogCorrect)
                      ? "border-accent-teal bg-accent-teal/15 text-white"
                      : "border-red-500 bg-red-500/10 text-white"
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                } ${catalogChecked && activeCatalogIdx !== 0 && "B" === "B" ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
              >
                {activeCatalogIdx === 0 ? "자해요" : "먹아요"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen 8: Activity 2 – Present tense verb conjugation matches */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Conjugation Match Drills</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 8 of {totalSteps}</span>
          </div>

          {practiceVerbs.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-4 text-center">
                <p className="text-xs text-zinc-400">Which polite present form matches: <strong className="text-brand-300 text-sm">"{practiceVerbs[conjugationIdx]?.korean}"</strong>?</p>
                
                <div className="grid grid-cols-1 gap-2 pt-2">
                  {practiceVerbs[conjugationIdx]?.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !conjChecked && setSelectedConjOpt(opt)}
                      disabled={conjChecked}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                        selectedConjOpt === opt
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      } ${conjChecked && opt === practiceVerbs[conjugationIdx]?.correct ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${conjChecked && selectedConjOpt === opt && opt !== practiceVerbs[conjugationIdx]?.correct ? "border-red-500 bg-red-500/10 text-white" : ""}`}
                    >
                      {opt === "to study" ? "공부해요" : opt === "to eat" ? "먹어요" : opt === "to wake up" ? "일어나요" : "자요"}
                    </button>
                  ))}
                </div>

                {conjChecked && (
                  <div className={`p-3 rounded-xl border text-xs text-left ${
                    conjCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    {conjCorrect ? "Correct conjugation mapping!" : "Incorrect conjugation match."}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  {!conjChecked ? (
                    <button
                      onClick={handleCheckConjugation}
                      disabled={!selectedConjOpt}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Check Match
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setConjChecked(false);
                        setSelectedConjOpt(null);
                        setConjCorrect(null);
                        if (conjugationIdx < practiceVerbs.length - 1) {
                          setConjugationIdx(conjugationIdx + 1);
                        } else {
                          setConjugationIdx(0);
                        }
                      }}
                      className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Next Conjugation
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 9: Activity 3 – Multi-line routine builder */}
      {step === 9 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 3 – Routine Paragraph Builder</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 9 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-zinc-400 block">Morning Action</label>
                <select
                  value={morningChoice}
                  onChange={(e) => setMorningChoice(e.target.value)}
                  className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  {templates?.morning?.map((t: any) => (
                    <option key={t.ko} value={t.ko}>{t.label} ({t.ko})</option>
                  )) || (
                    <>
                      <option value="일어나요">일어나요 (Wake up)</option>
                      <option value="물을 마셔요">물을 마셔요 (Drink water)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-zinc-400 block">Daytime Action</label>
                <select
                  value={dayChoice}
                  onChange={(e) => setDayChoice(e.target.value)}
                  className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  {templates?.daytime?.map((t: any) => (
                    <option key={t.ko} value={t.ko}>{t.label} ({t.ko})</option>
                  )) || (
                    <>
                      <option value="학교에 가요">학교에 가요 (Go to school)</option>
                      <option value="한국어를 공부해요">한국어를 공부해요 (Study Korean)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-zinc-400 block">Evening Action</label>
                <select
                  value={eveningChoice}
                  onChange={(e) => setEveningChoice(e.target.value)}
                  className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  {templates?.evening?.map((t: any) => (
                    <option key={t.ko} value={t.ko}>{t.label} ({t.ko})</option>
                  )) || (
                    <>
                      <option value="자요">자요 (Sleep)</option>
                      <option value="저녁을 먹어요">저녁을 먹어요 (Eat dinner)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <button
              onClick={handleBuildRoutine}
              disabled={building}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-5 rounded-xl text-xs transition cursor-pointer"
            >
              {building ? "Building..." : "Build Routine"}
            </button>

            {builtRoutine && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 space-y-3 animate-fade-in text-center">
                <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Assembled Paragraph</span>
                <p className="text-sm font-black text-white font-korean leading-relaxed">{builtRoutine.final_korean_text}</p>
                
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
                    {savingRoutine ? "Saving..." : routineSaved ? "Saved Successfully!" : "Save Routine"}
                  </button>
                </div>
              </div>
            )}

            {/* Reflection question */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold">Reflection check</span>
              <p className="text-xs text-zinc-300">How many different verbs did you use in your routine?</p>
              <div className="flex gap-2">
                {["1-2", "3-4", "5 or more"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleCheckRoutineReflect(opt)}
                    disabled={routineReflectChecked}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                      routineReflectSelected === opt
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {routineReflectChecked && (
                <p className="text-[10px] text-zinc-500 leading-snug">
                  Nice! Using a variety of verbs makes your routine descriptions more expressive.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screen 10: Activity 4 – Spoken routine read-aloud assessment */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 4 – Spoken Routine Assessment</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 10 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-4 text-center">
            <span className="text-[10px] text-zinc-500 uppercase font-mono block">Read your paragraph:</span>
            <p className="text-lg font-black text-white font-korean">{builtRoutine?.final_korean_text || "저는 아침에 일어나요. 낮에 공부해요."}</p>

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
                disabled={speakingTranscribing}
                className={`p-5 rounded-full transition ${
                  rec.recording
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-brand-500/10 text-brand-400 border border-brand-500/25 hover:bg-brand-500/20"
                }`}
                title={rec.recording ? "Stop Recording" : "Click to Record"}
              >
                {rec.recording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>

              {rec.audioBlob && !rec.recording && (
                <button
                  onClick={handleSpeechEvaluate}
                  disabled={speakingTranscribing}
                  className="bg-zinc-855 hover:bg-zinc-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition border border-white/5 cursor-pointer"
                >
                  {speakingTranscribing ? "Evaluating..." : "Check Pronunciation"}
                </button>
              )}
            </div>

            {speakingResult && (
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 text-left text-xs space-y-1 max-w-sm mx-auto">
                <p className="font-black text-white">Match Accuracy: {speakingResult.similarity_score.toFixed(0)}%</p>
                <p className="text-zinc-400">STT Transcription: "{speakingResult.recognized_text || speakingResult.transcription || "..."}"</p>
              </div>
            )}

            {/* Speaking reflection question */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3 text-left">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold">Speaking reflection</span>
              <p className="text-xs text-zinc-300">Which part was hardest to say?</p>
              <div className="flex flex-col sm:flex-row gap-2">
                {["The verb conjugations", "The times (numbers + 시)", "Connecting sentences"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleCheckSpeakReflect(opt)}
                    disabled={speakReflectChecked}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                      speakReflectSelected === opt
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {speakReflectChecked && (
                <p className="text-[10px] text-zinc-500 leading-snug mt-1">
                  Thank you for reflecting. Focusing on that area during tutor chats will help build speed and fluency.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screen 11: Activity 5 – Graduating checkpoint mini-quiz */}
      {step === 11 && (
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
              <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Question Prompt</span>
                <p className="font-extrabold text-white text-base mt-2">{quizBlueprint[quizIdx]?.question}</p>
              </div>

              {quizBlueprint[quizIdx]?.type === "listening" && (
                <div className="text-center space-y-4">
                  <button 
                    onClick={() => playAudio(quizBlueprint[quizIdx]?.correct_answer || quizBlueprint[quizIdx]?.audio_text)}
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
                        } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${quizChecked && quizSelectedOpt === opt && opt !== quizBlueprint[quizIdx]?.correct_answer ? "border-red-500 bg-red-500/10 text-white" : ""}`}
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
                      } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${quizChecked && quizSelectedOpt === opt && opt !== quizBlueprint[quizIdx]?.correct_answer ? "border-red-500 bg-red-500/10 text-white" : ""}`}
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
                        : (quizBlueprint[quizIdx]?.type === "speaking" ? !speakingResult : !quizWritingAns.trim())
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

      {/* Screen 12: Homework & AI Routine Practice */}
      {step === 12 && (
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
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 150, type: 'correct' } }));
              }
              onComplete();
            }}
            className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/20 cursor-pointer w-full max-w-xs"
          >
            <span>Finish Phase 4 & Earn XP</span>
            <ChevronRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      )}
      
      {/* Navigation bottom controls for non-quiz screens */}
      {step !== 11 && step !== 12 && step > 1 && (
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
