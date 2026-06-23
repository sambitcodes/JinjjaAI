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

let API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
if (API_BASE && !API_BASE.includes("/api/v1")) {
  API_BASE = API_BASE.replace(/\/$/, "") + "/api/v1";
}

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

interface Course2Phase3NumbersWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

interface MicroQuestion {
  question: string;
  options: { id: string; text: string }[];
  correctId: string;
  explanation: string;
}

export default function Course2Phase3NumbersWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course2Phase3NumbersWizardProps) {
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c2p3_step");
    const savedMax = localStorage.getItem("hangeulai_c2p3_max_step");
    let currentParsed = 1;
    if (savedStep) {
      currentParsed = parseInt(savedStep, 10);
    }
    if (savedMax) {
      const parsedMax = parseInt(savedMax, 10);
      setMaxStep(Math.max(parsedMax, currentParsed));
    } else {
      setMaxStep(currentParsed);
    }
  }, []);

  useEffect(() => {
    if (step > maxStep) {
      setMaxStep(step);
      localStorage.setItem("hangeulai_c2p3_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 12;

  // Persist step to localStorage for refresh resilience
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c1p3_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 12) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c1p3_step", String(step));
  }, [step]);

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

  // Concept Micro-questions states
  const [cSelected, setCSelected] = useState<string | null>(null);
  const [cChecked, setCChecked] = useState(false);
  const [cCorrect, setCCorrect] = useState<boolean | null>(null);
  const [cIdx, setCIdx] = useState(0);

  // Persist answered concepts state
  const [answeredConcepts, setAnsweredConcepts] = useState<Record<string, { selected: string, correct: boolean }>>({});

  // Reset/Restore micro-question state when moving between concept screens
  useEffect(() => {
    if (step >= 2 && step <= 6) {
      const key = `${step}_${cIdx}`;
      const answered = answeredConcepts[key];
      if (answered) {
        setCSelected(answered.selected);
        setCChecked(true);
        setCCorrect(answered.correct);
      } else {
        setCSelected(null);
        setCChecked(false);
        setCCorrect(null);
      }
    }
  }, [step, cIdx, answeredConcepts]);

  // Automatically save answered concept states when checked
  

  // Concept Micro-questions definitions
  const conceptQuestions: Record<number, MicroQuestion[]> = {
    2: [
      {
        question: "Which system do we usually use for minutes, prices, and phone numbers?",
        options: [
          { id: "A", text: "Sino-Korean" },
          { id: "B", text: "Native Korean" }
        ],
        correctId: "A",
        explanation: "Sino-Korean numbers are used for math-like units (minutes, prices, phone numbers, dates)."
      },
      {
        question: "Which system is used for hours (시) when telling time?",
        options: [
          { id: "A", text: "Sino-Korean" },
          { id: "B", text: "Native Korean" }
        ],
        correctId: "B",
        explanation: "Hours use the Native Korean system (한 시, 두 시, 세 시...)."
      }
    ],
    3: [
      {
        question: "How would you build 13 using 십 (10) and 삼 (3)?",
        options: [
          { id: "A", text: "삼십" },
          { id: "B", text: "십삼" }
        ],
        correctId: "B",
        explanation: "10 (십) + 3 (삼) = 13 (십삼). Tens digit goes first, then unit."
      },
      {
        question: "Which of these represents 11?",
        options: [
          { id: "A", text: "십일" },
          { id: "B", text: "십이" },
          { id: "C", text: "이십" }
        ],
        correctId: "A",
        explanation: "십일 (10 + 1) is 11. 이십 is 20 (2 * 10)."
      }
    ],
    4: [
      {
        question: "Which number corresponds to 삼십?",
        options: [
          { id: "A", text: "20" },
          { id: "B", text: "30" },
          { id: "C", text: "40" }
        ],
        correctId: "B",
        explanation: "삼 (3) + 십 (10) = 삼십 (30)."
      },
      {
        question: "How do you say '50' with Sino-Korean tens?",
        options: [
          { id: "A", text: "오십" },
          { id: "B", text: "사십" }
        ],
        correctId: "A",
        explanation: "오 (5) + 십 (10) = 오십 (50)."
      }
    ],
    5: [
      {
        question: "Which is correct for 3 o'clock?",
        options: [
          { id: "A", text: "삼 시" },
          { id: "B", text: "세 시" }
        ],
        correctId: "B",
        explanation: "Hours use the Native Korean hour words (한, 두, 세, 네...). So 3 o'clock is 세 시."
      },
      {
        question: "If you hear '다섯 시', what hour is it?",
        options: [
          { id: "A", text: "3 o'clock" },
          { id: "B", text: "5 o'clock" },
          { id: "C", text: "7 o'clock" }
        ],
        correctId: "B",
        explanation: "다섯 is the Native Korean word for 5. So 다섯 시 is 5 o'clock."
      }
    ],
    6: [
      {
        question: "Which number system is easier to start with for prices and phone digits?",
        options: [
          { id: "A", text: "Sino-Korean numbers" },
          { id: "B", text: "Native Korean numbers" }
        ],
        correctId: "A",
        explanation: "Sino-Korean numbers are purely decimal and much simpler to build for large digits."
      },
      {
        question: "Which one sounds more natural for 10,000 won price?",
        options: [
          { id: "A", text: "Native Korean numbers" },
          { id: "B", text: "Sino-Korean numbers" }
        ],
        correctId: "B",
        explanation: "Prices are always calculated using Sino-Korean numbers (e.g. 만 원)."
      }
    ]
  };

  // Activity 7: Catalog MCQ states
  const [activeCatalogIdx, setActiveCatalogIdx] = useState(0);
  const [catalogSelectedOpt, setCatalogSelectedOpt] = useState<string | null>(null);
  const [catalogChecked, setCatalogChecked] = useState(false);
  const [catalogCorrect, setCatalogCorrect] = useState<boolean | null>(null);

  // Activity 8: Listening states
  const [listeningIdx, setListeningIdx] = useState(0);
  const [selectedListeningOpt, setSelectedListeningOpt] = useState<string | null>(null);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningCorrect, setListeningCorrect] = useState<boolean | null>(null);

  // Activity 9: Time states
  const [timeIdx, setTimeIdx] = useState(0);
  const [selectedTimeOpt, setSelectedTimeOpt] = useState<string | null>(null);
  const [timeChecked, setTimeChecked] = useState(false);
  const [timeCorrect, setTimeCorrect] = useState<boolean | null>(null);

  // Activity 10: Facts states
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

  // Load backend content
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/lessons/phases/korean1/3/metadata");
          setMetadata(res);
        } else if ((step === 2 || step === 7) && !coreData) {
          const res = await apiJson("/lessons/phases/korean1/3/core-data");
          setCoreData(res);
        } else if (step === 8 && listeningItems.length === 0) {
          const res = await apiJson("/lessons/practice/numbers/listening");
          setListeningItems(res.items || []);
        } else if ((step === 9 || step === 10) && timeItems.length === 0) {
          const res_t = await apiJson("/lessons/practice/time/basic");
          const res_f = await apiJson("/lessons/practice/facts/basic");
          setTimeItems(res_t.items || []);
          setFactsItems(res_f.items || []);
        } else if (step === 11 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/lessons/quiz/korean1/phase-3/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 12 && homeworkItems.length === 0) {
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

  // Concept Screen checking handler
  const handleCheckConcept = (selectedId: string) => {
    if (cChecked) return;
    const currentQ = conceptQuestions[step]?.[cIdx];
    if (!currentQ) return;

    setCSelected(selectedId);
    const isCorrect = selectedId === currentQ.correctId;
    setCChecked(true);
    setCCorrect(isCorrect);
    const conceptKey = `${step}_${cIdx}`;
    setAnsweredConcepts(prev => ({ ...prev, [conceptKey]: { selected: selectedId, correct: isCorrect } }));
    
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

  // Activity 1: Catalog MCQ check
  const handleCheckCatalogCard = (opt: string) => {
    if (catalogChecked) return;
    setCatalogSelectedOpt(opt);
    const correctVal = activeCatalogIdx === 5 ? "B" : "A"; // sample logic for different cards
    const isCorrect = opt === correctVal;
    setCatalogChecked(true);
    setCatalogCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  // Activity 2: Listen and choose answer
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
      if (res.correct) playCorrectSound();
      else playWrongSound();
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 3: Time check
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
      if (res.correct) playCorrectSound();
      else playWrongSound();
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 4: Facts check
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
      if (isCorrect) playCorrectSound();
      else playWrongSound();
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
        await apiJson("/lessons/quiz/korean1/phase-3/finish", {
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

  // Speaking check for Quiz speaking prompt
  const handleSpeechEvaluate = async () => {
    const current = quizBlueprint[quizIdx];
    if (!rec.audioBlob || !current) return;
    setSpeakingTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("target_text", current.correct_answer);
      fd.append("audio_file", rec.audioBlob, "recording.wav");
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

    const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "C1 – Two number systems: Sino vs Native" },
    { num: 3, label: "C2 – Sino numbers 1–10 and building 11–19" },
    { num: 4, label: "C3 – Tens: 20, 30, 40, 50, 60" },
    { num: 5, label: "C4 – Time: Native hours and Sino minutes" },
    { num: 6, label: "C5 – Everyday uses: age, price, phone digits" },
    { num: 7, label: "Activity 1 – Sino-Korean Numbers catalog and audio drills" },
    { num: 8, label: "Activity 2 – Listening & recognition plain and sentence numbers" },
    { num: 9, label: "Activity 3 – Simple time clock-mapping matches" },
    { num: 10, label: "Activity 4 – Everyday facts (age, price, phone digits) checks" },
    { num: 11, label: "Activity 5 – Graduating checkpoint mini-quiz checks" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 2,
          phaseNum: 3,
          step: step
        }
      }));
    }
  }, [step]);

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
              <span>{activeLesson?.title || "Numbers & Everyday Facts"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: Numbers & Time</p>
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
      {showOutline && (
        <div className="mb-6 p-5 bg-zinc-955/80 rounded-3xl border border-white/5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 relative z-30">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 font-mono">Curriculum Syllabus Map</span>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {outlineSteps.map(s => {
              const isCurrent = step === s.num;
              const isCompleted = s.num < step || s.num <= maxStep;
              return (
                <button
                  key={s.num}
                  disabled={!isCompleted && !isCurrent}
                  onClick={() => {
    if (courseXP < 340) {
      alert("To graduate from this course, you need at least 340 XP. You currently have " + courseXP + " XP. Please review earlier steps or re-answer incorrect questions to earn more XP!");
      return;
    }
    setStep(s.num);
                    setShowOutline(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    isCurrent
                      ? "border-brand-500 bg-brand-500/10 text-white"
                      : isCompleted
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/50"
                      : "border-red-500/20 bg-red-950/20 text-red-400/40 cursor-not-allowed opacity-50"
                  }`}
                >
                  <div className="text-[9px] font-black font-mono text-zinc-500">STEP {s.num}</div>
                  <div className="text-xs font-bold truncate">{s.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Screen 1: Welcome/Overview */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight">Korean 1.3</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Numbers & Simple Time</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Say basic numbers and understand simple time and everyday information."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
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

          <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => {
    if (courseXP < 160) {
      alert("To start Phase 3, you need at least 160 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!");
      return;
    }
    setStep(2);
  }}
              className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 3</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          
        </div>
      )}

      {/* Screen 2: C1 - Two number systems: Sino vs Native */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Two Number Systems in Korean</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            Korean has two distinct sets of numbers:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl space-y-2">
              <h4 className="font-black text-white text-sm">Sino-Korean System</h4>
              <p className="text-xs font-korean text-brand-300">일, 이, 삼, 사, 오, 육, 칠, 팔, 구, 십...</p>
              <p className="text-[11px] text-zinc-400">Used for minutes, prices, phone numbers, dates, and addresses.</p>
            </div>
            <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl space-y-2">
              <h4 className="font-black text-white text-sm">Native Korean System</h4>
              <p className="text-xs font-korean text-brand-300">하나, 둘, 셋, 넷, 다섯...</p>
              <p className="text-[11px] text-zinc-400">Used for hours (when telling time), counting items, and expressing age.</p>
            </div>
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
                    type="button"
                    onClick={() => {
                      const qObj = Array.isArray(conceptQuestions[step]) ? conceptQuestions[step][cIdx] : conceptQuestions[step];
                      if (!qObj) return;
                      const selOptText = qObj.options ? (qObj.options.find(o => o.id === cSelected)?.text || qObj.options.find(o => o.text === cSelected)?.text || cSelected) : cSelected;
                      const corrOptText = qObj.options ? (qObj.options.find(o => o.id === qObj.correctId)?.text || qObj.options.find(o => o.text === qObj.correctId)?.text || qObj.correctId) : qObj.correctId;
                      window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                        detail: {
                          question: qObj.question || "Concept Check",
                          selected_answer: String(selOptText || ""),
                          correct_answer: String(corrOptText || ""),
                          is_correct: !!cCorrect,
                          explanation: qObj.explanation || ""
                        }
                      }));
                    }}
                    className="mr-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
                    title="Add this concept summary to your diary notes"
                  >
                    + Add to Notes
                  </button>
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

      {/* Screen 3: C2 - Sino numbers 1–10 and building 11–19 */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Sino Numbers 1–10 and 11–19</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            Sino-Korean numbers form using a simple block logic:
          </p>
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 text-center font-mono space-y-1 max-w-sm mx-auto text-xs text-zinc-300">
            <p>십 (10) + 일 (1) = <strong>십일 (11)</strong></p>
            <p>십 (10) + 이 (2) = <strong>십이 (12)</strong></p>
            <p>십 (10) + 구 (9) = <strong>십구 (19)</strong></p>
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
                    type="button"
                    onClick={() => {
                      const qObj = Array.isArray(conceptQuestions[step]) ? conceptQuestions[step][cIdx] : conceptQuestions[step];
                      if (!qObj) return;
                      const selOptText = qObj.options ? (qObj.options.find(o => o.id === cSelected)?.text || qObj.options.find(o => o.text === cSelected)?.text || cSelected) : cSelected;
                      const corrOptText = qObj.options ? (qObj.options.find(o => o.id === qObj.correctId)?.text || qObj.options.find(o => o.text === qObj.correctId)?.text || qObj.correctId) : qObj.correctId;
                      window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                        detail: {
                          question: qObj.question || "Concept Check",
                          selected_answer: String(selOptText || ""),
                          correct_answer: String(corrOptText || ""),
                          is_correct: !!cCorrect,
                          explanation: qObj.explanation || ""
                        }
                      }));
                    }}
                    className="mr-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
                    title="Add this concept summary to your diary notes"
                  >
                    + Add to Notes
                  </button>
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

      {/* Screen 4: C3 - Tens: 20, 30, 40, 50, 60 */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Tens: 20, 30, 40, 50, 60</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            Multiples of ten follow a logical formula: <strong>[digit] + 십</strong>
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 font-mono text-center text-xs text-zinc-300">
            <div className="p-3 bg-zinc-950 rounded-xl border border-white/5">이십 (20)</div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-white/5">삼십 (30)</div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-white/5">사십 (40)</div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-white/5">오십 (50)</div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-white/5">육십 (60)</div>
          </div>

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
                    type="button"
                    onClick={() => {
                      const qObj = Array.isArray(conceptQuestions[step]) ? conceptQuestions[step][cIdx] : conceptQuestions[step];
                      if (!qObj) return;
                      const selOptText = qObj.options ? (qObj.options.find(o => o.id === cSelected)?.text || qObj.options.find(o => o.text === cSelected)?.text || cSelected) : cSelected;
                      const corrOptText = qObj.options ? (qObj.options.find(o => o.id === qObj.correctId)?.text || qObj.options.find(o => o.text === qObj.correctId)?.text || qObj.correctId) : qObj.correctId;
                      window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                        detail: {
                          question: qObj.question || "Concept Check",
                          selected_answer: String(selOptText || ""),
                          correct_answer: String(corrOptText || ""),
                          is_correct: !!cCorrect,
                          explanation: qObj.explanation || ""
                        }
                      }));
                    }}
                    className="mr-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
                    title="Add this concept summary to your diary notes"
                  >
                    + Add to Notes
                  </button>
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

      {/* Screen 5: C4 - Time: Native hours (시) */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Time: Native Hours (시)</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            Telling time in Korean uses Native hours followed by the counter word <strong>시 (si)</strong>:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left text-xs text-zinc-300 font-mono">
            <div className="p-3 bg-zinc-950 rounded-xl border border-white/5">1 o'clock: 한 시</div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-white/5">2 o'clock: 두 시</div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-white/5">3 o'clock: 세 시</div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-white/5">4 o'clock: 네 시</div>
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
                    type="button"
                    onClick={() => {
                      const qObj = Array.isArray(conceptQuestions[step]) ? conceptQuestions[step][cIdx] : conceptQuestions[step];
                      if (!qObj) return;
                      const selOptText = qObj.options ? (qObj.options.find(o => o.id === cSelected)?.text || qObj.options.find(o => o.text === cSelected)?.text || cSelected) : cSelected;
                      const corrOptText = qObj.options ? (qObj.options.find(o => o.id === qObj.correctId)?.text || qObj.options.find(o => o.text === qObj.correctId)?.text || qObj.correctId) : qObj.correctId;
                      window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                        detail: {
                          question: qObj.question || "Concept Check",
                          selected_answer: String(selOptText || ""),
                          correct_answer: String(corrOptText || ""),
                          is_correct: !!cCorrect,
                          explanation: qObj.explanation || ""
                        }
                      }));
                    }}
                    className="mr-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
                    title="Add this concept summary to your diary notes"
                  >
                    + Add to Notes
                  </button>
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

      {/* Screen 6: C5 - Everyday uses: age, price, phone digits */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Everyday Uses: Age, Price, Phone Digits</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            Understanding prices, ages, and phone numbers:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-300 pl-4 text-xs">
            <li><strong>Prices:</strong> Always spoken in Sino-Korean (e.g. 5,000 Won = 오천 원).</li>
            <li><strong>Phone Numbers:</strong> Delivered as individual Sino digits (e.g. 010 = 영일공).</li>
            <li><strong>Age:</strong> Usually counted in Native Korean (e.g. 20 years old = 스무 살).</li>
          </ul>

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
                    type="button"
                    onClick={() => {
                      const qObj = Array.isArray(conceptQuestions[step]) ? conceptQuestions[step][cIdx] : conceptQuestions[step];
                      if (!qObj) return;
                      const selOptText = qObj.options ? (qObj.options.find(o => o.id === cSelected)?.text || qObj.options.find(o => o.text === cSelected)?.text || cSelected) : cSelected;
                      const corrOptText = qObj.options ? (qObj.options.find(o => o.id === qObj.correctId)?.text || qObj.options.find(o => o.text === qObj.correctId)?.text || qObj.correctId) : qObj.correctId;
                      window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                        detail: {
                          question: qObj.question || "Concept Check",
                          selected_answer: String(selOptText || ""),
                          correct_answer: String(corrOptText || ""),
                          is_correct: !!cCorrect,
                          explanation: qObj.explanation || ""
                        }
                      }));
                    }}
                    className="mr-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
                    title="Add this concept summary to your diary notes"
                  >
                    + Add to Notes
                  </button>
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

      {/* Screen 7: Activity 1 – Sino-Korean numbers catalog & audio drills */}
      {step === 7 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Sino-Korean Numbers Catalog</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of {totalSteps}</span>
          </div>

          <p className="text-xs text-zinc-400">
            Tap the cards to listen to audio. Complete the matching quiz for the active card below.
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {coreData?.numbers?.slice(0, 6).map((num: any, idx: number) => {
              const isActive = activeCatalogIdx === idx;
              const isFlipped = flippedNumDigit === num.digit;
              return (
                <div
                  key={num.digit}
                  onClick={() => {
                    setActiveCatalogIdx(idx);
                    setFlippedNumDigit(isFlipped ? null : num.digit);
                    playAudio(num.ko);
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
                      <div className="text-lg font-black text-white font-korean">{num.ko}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">({num.digit})</div>
                    </div>
                  ) : (
                    <div className="animate-fade-in">
                      <span className="text-xs font-bold text-brand-400 block">{num.en}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Catalog active drill */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-left">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Number Match: {coreData?.numbers?.[activeCatalogIdx]?.ko}</h4>
            <p className="text-xs text-zinc-300 font-bold">Select the correct English translation mapping:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleCheckCatalogCard("A")}
                disabled={catalogChecked}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                  catalogSelectedOpt === "A"
                    ? catalogCorrect
                      ? "border-accent-teal bg-accent-teal/15 text-white"
                      : "border-red-500 bg-red-500/10 text-white"
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                } ${catalogChecked && (activeCatalogIdx !== 5 ? "A" === "A" : "B" === "B") ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
              >
                {activeCatalogIdx === 5 ? "Six" : activeCatalogIdx === 0 ? "Zero" : activeCatalogIdx === 1 ? "One" : activeCatalogIdx === 2 ? "Two" : activeCatalogIdx === 3 ? "Three" : "Four"}
              </button>

              <button
                onClick={() => handleCheckCatalogCard("B")}
                disabled={catalogChecked}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                  catalogSelectedOpt === "B"
                    ? (activeCatalogIdx === 5 ? catalogCorrect : false)
                      ? "border-accent-teal bg-accent-teal/15 text-white"
                      : "border-red-500 bg-red-500/10 text-white"
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                } ${catalogChecked && activeCatalogIdx === 5 && "B" === "B" ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
              >
                {activeCatalogIdx === 5 ? "Five" : "Ten"}
              </button>

              <button
                onClick={() => handleCheckCatalogCard("C")}
                disabled={catalogChecked}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                  catalogSelectedOpt === "C"
                    ? "border-red-500 bg-red-500/10 text-white"
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                }`}
              >
                Eight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen 8: Activity 2 – Listening & recognition in simple sentences */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Audio Number Recognition</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 8 of {totalSteps}</span>
          </div>

          {listeningItems.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-4 text-center">
                <p className="text-xs text-zinc-400">What digits did you hear?</p>
                <div className="py-2">
                  <button
                    onClick={() => playAudio(listeningItems[listeningIdx]?.audio_text)}
                    className="p-5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-full mx-auto transition flex items-center justify-center cursor-pointer"
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
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                        selectedListeningOpt === opt
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      } ${listeningChecked && opt === listeningItems[listeningIdx]?.correct_digit ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${listeningChecked && selectedListeningOpt === opt && opt !== listeningItems[listeningIdx]?.correct_digit ? "border-red-500 bg-red-500/10 text-white" : ""}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {listeningChecked && (
                  <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                    listeningCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    <p className="font-extrabold">{listeningCorrect ? "Correct!" : "Incorrect."}</p>
                    <p>Korean script: <span className="text-white font-korean">{listeningItems[listeningIdx]?.audio_text}</span></p>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  {!listeningChecked ? (
                    <button
                      onClick={handleCheckListening}
                      disabled={!selectedListeningOpt}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
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
                      className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Next Audio Item
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 9: Activity 3 – Simple time clock-mapping */}
      {step === 9 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 3 – Simple Time Mapping</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 9 of {totalSteps}</span>
          </div>

          <div className="space-y-6 max-w-xl mx-auto w-full">
            <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-4 text-center">
              <p className="text-xs text-zinc-300">Listen and select the corresponding clock hours for: <strong className="text-brand-300">"{timeItems[timeIdx]?.ko_phrase}"</strong></p>
              
              <div className="flex justify-center">
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
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                      selectedTimeOpt === opt
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                    } ${timeChecked && opt === timeItems[timeIdx]?.correct_option_id ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${timeChecked && selectedTimeOpt === opt && opt !== timeItems[timeIdx]?.correct_option_id ? "border-red-500 bg-red-500/10 text-white" : ""}`}
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
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">Native numbers are used for clock hours.</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!timeChecked ? (
                  <button
                    onClick={handleCheckTime}
                    disabled={!selectedTimeOpt}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
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
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next clock item
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen 10: Activity 4 – Everyday facts: age, price, phone digits */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 4 – Everyday Facts Scenarios</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 10 of {totalSteps}</span>
          </div>

          <div className="space-y-6 max-w-xl mx-auto w-full">
            <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-4 text-left">
              <p className="text-xs text-zinc-300 font-bold">{factsItems[factsIdx]?.question}</p>

              <div className="grid grid-cols-1 gap-2">
                {factsItems[factsIdx]?.options?.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !factsChecked && setSelectedFactOpt(opt)}
                    disabled={factsChecked}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                      selectedFactOpt === opt
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                    } ${factsChecked && opt === factsItems[factsIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${factsChecked && selectedFactOpt === opt && opt !== factsItems[factsIdx]?.correct_answer ? "border-red-500 bg-red-500/10 text-white" : ""}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {factsChecked && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  factsCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-bold">{factsCorrect ? "Correct!" : "Incorrect."}</p>
                  <p className="text-zinc-400 leading-normal">{factsItems[factsIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!factsChecked ? (
                  <button
                    onClick={handleCheckFacts}
                    disabled={!selectedFactOpt}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
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
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next Fact Item
                  </button>
                )}
              </div>
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
              <span>Mini-Quiz: Numbers & Facts Check</span>
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
                    onClick={() => playAudio(quizBlueprint[quizIdx]?.audio_text)}
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
                      } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/15 text-white animate-fade-in" : ""} ${quizChecked && quizSelectedOpt === opt && opt !== quizBlueprint[quizIdx]?.correct_answer ? "border-red-500 bg-red-500/10 text-white" : ""}`}
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
                  <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                    <span className="font-extrabold text-[10px] uppercase tracking-wider">Checkpoint Feedback</span>
                    <button
                      type="button"
                      onClick={() => {
                        const qObj = quizBlueprint[quizIdx];
                        if (!qObj) return;
                        window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                          detail: {
                            question: qObj.question || "Quiz Checkpoint Question",
                            selected_answer: String(quizBlueprint[quizIdx]?.type === "writing" ? quizWritingAns : quizSelectedOpt || ""),
                            correct_answer: String(qObj.correct_answer || ""),
                            is_correct: !!quizCorrect,
                            explanation: qObj.explanation || ""
                          }
                        }));
                      }}
                      className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-white/5 transition cursor-pointer"
                      title="Add this attempt summary to your diary notes"
                    >
                      + Add to Notes
                    </button>
                  </div>
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

      {/* Screen 12: Homework & Completion */}
      {step === 12 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
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
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 150, type: 'correct' } }));
              }onComplete();
            }}
            className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/20 cursor-pointer w-full max-w-xs"
          >
            <span>Finish Phase 3 & Earn XP</span>
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
      
    
  {/* Re-Answer panel for mistakes */}
  {step === outlineSteps.length && (  quizMistakes.length > 0) && (
    <div className="bg-zinc-900/60 p-6 rounded-2xl border border-red-500/20 text-left space-y-4 max-w-4xl mx-auto w-full mt-6 relative z-10">
      <span className="text-[10px] font-black uppercase tracking-widest text-red-400 block font-sans">
        ⚠️ Review & Re-Answer Incorrect Questions to Gain XP
      </span>
      <div className="space-y-3">
        
        {(quizMistakes || []).map((m: any, idx: number) => (
          <div key={idx} className="p-4 bg-zinc-955/80 rounded-xl border border-white/5 flex justify-between items-center text-left">
            <div className="text-xs text-zinc-300 pr-4">
              <strong>Question:</strong> {String(m)}
            </div>
            <button
              onClick={() => {
                const targetQStep = outlineSteps.length - 1;
                setStep(targetQStep);
                if (typeof setQuizChecked === "function") setQuizChecked(false);
                if (typeof setQuizMistakes === "function") setQuizMistakes((prev: any) => prev.filter((item: any) => item !== m));
              }}
              className="bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
            >
              Re-Answer
            </button>
          </div>
        ))}
      </div>
    </div>
  )}
      </div>
  );
}
