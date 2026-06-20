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
  Mic,
  MicOff,
  Check,
  MessageSquare,
  ArrowRight,
  RefreshCw
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

interface Course3Phase4PlansWizardProps {
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

export default function Course3Phase4PlansWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course3Phase4PlansWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 12;

  // Persist progress to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c3p4_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 12) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c3p4_step", String(step));
  }, [step]);

  // DB Data loaded
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

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

  // Concept questions
  const conceptQuestions: Record<number, MicroQuestion[]> = {
    2: [
      {
        question: "Which sentence clearly talks about the future?",
        options: [
          { id: "A", text: "어제 영화를 봤어요. (I watched a movie yesterday.)" },
          { id: "B", text: "내일 영화를 볼 거예요. (I will watch a movie tomorrow.)" }
        ],
        correctId: "B",
        explanation: "볼 거예요 is the future/plan tense ending, and 내일 means tomorrow, showing future routine."
      }
    ],
    3: [
      {
        question: "Which is correct for 'I will go' (가다)?",
        options: [
          { id: "A", text: "가을 거예요" },
          { id: "B", text: "갈 거예요" }
        ],
        correctId: "B",
        explanation: "가다 ends in a vowel (ㅏ), so we attach ~ㄹ 거예요 to form 갈 거예요."
      },
      {
        question: "Which form means 'I'm going to meet a friend'?",
        options: [
          { id: "A", text: "친구를 만날 거예요" },
          { id: "B", text: "친구를 만났어요" }
        ],
        correctId: "A",
        explanation: "만날 거예요 is the future plan form of 만나다, whereas 만났어요 is the past tense form."
      }
    ],
    4: [
      {
        question: "Which sounds more like an intentional plan in progress?",
        options: [
          { id: "A", text: "공부할 거예요 (basic future plan)" },
          { id: "B", text: "공부하려고 해요 (active intention / plan in progress)" }
        ],
        correctId: "B",
        explanation: "~(으)려고 해요 expresses a deliberate intention or a plan that you are actively planning to do."
      },
      {
        question: "If you are just about to eat lunch, which fits better?",
        options: [
          { id: "A", text: "점심을 먹을 거예요" },
          { id: "B", text: "점심을 먹으려고 해요" }
        ],
        correctId: "B",
        explanation: "먹으려고 해요 expresses immediate active intention ('I am planning/about to eat lunch')."
      }
    ],
    5: [
      {
        question: "Which phrase means 'next week'?",
        options: [
          { id: "A", text: "내일" },
          { id: "B", text: "다음 주" },
          { id: "C", text: "이번 주말" }
        ],
        correctId: "B",
        explanation: "다음 주 is the combination of 다음 (next) and 주 (week)."
      },
      {
        question: "Which would you use to talk about this coming weekend?",
        options: [
          { id: "A", text: "이번 주말 (this weekend)" },
          { id: "B", text: "다음 주말 (next weekend)" }
        ],
        correctId: "A",
        explanation: "이번 means 'this', so 이번 주말 is 'this weekend'."
      }
    ],
    6: [
      {
        question: "What are they going to do tomorrow?",
        options: [
          { id: "A", text: "Meet a friend (친구를 만날 거예요)" },
          { id: "B", text: "Visit family (가족을 보러 갈 거예요)" }
        ],
        correctId: "A",
        explanation: "The text says '내일 저는 친구를 만날 거예요' (Tomorrow I will meet a friend)."
      },
      {
        question: "Who will they see next weekend?",
        options: [
          { id: "A", text: "Friend" },
          { id: "B", text: "Family" }
        ],
        correctId: "B",
        explanation: "The text says '다음 주말에 가족을 보러 갈 거예요' (Next weekend I will go to see family)."
      }
    ]
  };

  // Card flipping tracking
  const [flippedPatternId, setFlippedPatternId] = useState<string | null>(null);
  const [flippedTimeIdx, setFlippedTimeIdx] = useState<number | null>(null);

  // Activity 1: Future conjugation guides
  const [conjugationIdx, setConjugationIdx] = useState(0);
  const [conjugationSelected, setConjugationSelected] = useState<string | null>(null);
  const [conjugationChecked, setConjugationChecked] = useState(false);
  const [conjugationCorrect, setConjugationCorrect] = useState<boolean | null>(null);

  const conjugationVerbs = [
    { dict: "보다", options: ["볼 거예요", "봤어요", "보려고 했어요"], correct: "볼 거예요", explanation: "보다 ends in vowel ㅗ, so attaching ㄹ 거예요 yields 볼 거예요." },
    { dict: "만나다", options: ["만났어요", "만날 거예요", "만나요"], correct: "만날 거예요", explanation: "만날 거예요 is the neutral future tense statement ('will meet')." }
  ];

  // Activity 2: Near future time expressions
  const [timeIdx, setTimeIdx] = useState(0);
  const [timeSelected, setTimeSelected] = useState<string | null>(null);
  const [timeChecked, setTimeChecked] = useState(false);
  const [timeCorrect, setTimeCorrect] = useState<boolean | null>(null);

  const timeQuestions = [
    {
      question: "Which phrase would you put in the blank: _ 저는 한국어를 공부할 거예요. (I will study Korean next week.)",
      options: ["내일", "다음 주", "지난 주말"],
      correct: "다음 주",
      explanation: "다음 주 means 'next week', which fits the English translation."
    }
  ];

  // Activity 3: Listening
  const [listeningItems, setListeningItems] = useState<any[]>([]);
  const [listeningIdx, setListeningIdx] = useState(0);
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(null);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningCorrect, setListeningCorrect] = useState<boolean | null>(null);
  const [detailAnswers, setDetailAnswers] = useState<Record<string, string>>({});
  const [detailChecked, setDetailChecked] = useState(false);
  const [detailCorrect, setDetailCorrect] = useState<Record<string, boolean>>({});

  // Activity 4: Horizon plan builder & speaking practice
  const [builderTemplates, setBuilderTemplates] = useState<any>(null);
  const [selectedHorizonId, setSelectedHorizonId] = useState<string>("horizon_tomorrow");
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  const [builtParagraph, setBuiltParagraph] = useState<any>(null);
  const [building, setBuilding] = useState(false);
  const [savingParagraph, setSavingParagraph] = useState(false);
  const [paragraphSaved, setParagraphSaved] = useState(false);
  const [builderReflectionSelected, setBuilderReflectionSelected] = useState<string | null>(null);
  const [builderReflectionChecked, setBuilderReflectionChecked] = useState(false);

  // Speaking evaluation states
  const rec = useRecorder();
  const [speakingTranscribing, setSpeakingTranscribing] = useState(false);
  const [speakingResult, setSpeakingResult] = useState<any>(null);

  // Quiz Checkpoint states
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizWritingAns, setQuizWritingAns] = useState("");
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Homework check states
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Tutor session launch states
  const [tutorSession, setTutorSession] = useState<any>(null);
  const [loadingTutor, setLoadingTutor] = useState(false);

  // Sounds & XP dispatchers
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

  // APIs loaders
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean2/4/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean2/4/core-data");
          setCoreData(res);
        } else if (step === 9 && listeningItems.length === 0) {
          const res_l = await apiJson("/practice/plans/listening");
          setListeningItems(res_l.items || []);
        } else if (step === 10 && !builderTemplates) {
          const res_t = await apiJson("/practice/plans/templates");
          setBuilderTemplates(res_t);
        } else if (step === 11 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/quiz/korean2/phase-4/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 12 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/phases/korean2/4/homework");
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

  // Concept Checks
  const handleCheckConcept = (selectedId: string) => {
    if (cChecked) return;
    const currentQ = conceptQuestions[step]?.[cIdx];
    if (!currentQ) return;

    setCSelected(selectedId);
    const isCorrect = selectedId === currentQ.correctId;
    setCChecked(true);
    setCCorrect(isCorrect);
    
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

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

  // Activity 1: Conjugation MCQ
  const handleCheckConjugationMcq = (opt: string) => {
    if (conjugationChecked) return;
    setConjugationSelected(opt);
    const correctVal = conjugationVerbs[conjugationIdx].correct;
    const isCorrect = opt === correctVal;
    setConjugationChecked(true);
    setConjugationCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  // Activity 2: Time MCQ
  const handleCheckTimeMcq = (opt: string) => {
    if (timeChecked) return;
    setTimeSelected(opt);
    const correctVal = timeQuestions[timeIdx].correct;
    const isCorrect = opt === correctVal;
    setTimeChecked(true);
    setTimeCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  // Activity 3: Listening
  const handleCheckListeningSummary = async () => {
    const current = listeningItems[listeningIdx];
    if (!current || !selectedSummaryId) return;

    try {
      const res = await apiJson("/practice/plans/listening/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          summary_option_id: selectedSummaryId,
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

  const handleCheckListeningDetails = () => {
    const current = listeningItems[listeningIdx];
    if (!current) return;

    const results: Record<string, boolean> = {};
    let allCorrect = true;
    current.detail_questions.forEach((q: any) => {
      const userAns = detailAnswers[q.question];
      const isCorrect = userAns === q.correct_answer;
      results[q.question] = isCorrect;
      if (!isCorrect) allCorrect = false;
    });

    setDetailChecked(true);
    setDetailCorrect(results);
    if (allCorrect) playCorrectSound();
    else playWrongSound();
  };

  // Activity 4: Builder selections
  const toggleActivity = (future_ko: string) => {
    setSelectedActivities(prev => 
      prev.includes(future_ko) 
        ? prev.filter(v => v !== future_ko) 
        : [...prev, future_ko]
    );
  };

  const toggleReason = (reason_ko: string) => {
    setSelectedReasons(prev => 
      prev.includes(reason_ko) 
        ? prev.filter(v => v !== reason_ko) 
        : [...prev, reason_ko]
    );
  };

  const handleBuildParagraph = async () => {
    if (selectedActivities.length === 0) {
      alert("Please select at least one activity plan.");
      return;
    }
    setBuilding(true);
    setBuiltParagraph(null);
    setParagraphSaved(false);
    
    const horizon_type = selectedHorizonId === "horizon_tomorrow" 
      ? "tomorrow" 
      : selectedHorizonId === "horizon_weekend" 
        ? "weekend" 
        : "nextweek";

    try {
      const res = await apiJson("/practice/plans/build", {
        method: "POST",
        body: JSON.stringify({ 
          day_type: horizon_type, 
          activities: selectedActivities,
          reasons: selectedReasons
        })
      });
      setBuiltParagraph(res);
    } catch (err) {
      console.error(err);
    } finally {
      setBuilding(false);
    }
  };

  const handleSaveParagraph = async () => {
    if (!builtParagraph) return;
    setSavingParagraph(true);
    try {
      await apiJson("/users/future-plans/save", {
        method: "POST",
        body: JSON.stringify({ routine_text: builtParagraph.final_korean_text })
      });
      setParagraphSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingParagraph(false);
    }
  };

  const handleSpeechEvaluate = async () => {
    const target = builtParagraph ? builtParagraph.final_korean_text : "내일 도서관에 갈 거예요.";
    if (!rec.audioBlob) return;
    setSpeakingTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("expected_text", target);
      fd.append("audio_file", rec.audioBlob, "recording.webm");
      const res = await apiForm("/practice/plans/speaking", fd);
      setSpeakingResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSpeakingTranscribing(false);
    }
  };

  const handleCheckBuilderReflection = (opt: string) => {
    if (builderReflectionChecked) return;
    setBuilderReflectionSelected(opt);
    setBuilderReflectionChecked(true);
    playCorrectSound();
  };

  // Step 11: Quiz Checkpoint
  const handleCheckQuiz = () => {
    const current = quizBlueprint[quizIdx];
    if (!current) return;

    let isCorrect = false;
    if (current.type !== "writing") {
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
    } else {
      setFinishingQuiz(true);
      try {
        const correctCount = quizBlueprint.length - quizMistakes.length;
        const score = Math.round((correctCount / quizBlueprint.length) * 100);
        await apiJson("/quiz/korean2/phase-4/finish", {
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
      await apiJson("/phases/korean2/4/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Tutor session launch
  const handleLaunchTutor = async () => {
    setLoadingTutor(true);
    try {
      const res = await apiJson("/conversation/a2/future-plans-practice/start", { method: "POST" });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

    const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "C1 – Future plans introduction" },
    { num: 3, label: "C2 – Pattern 1 (~ㄹ 거예요)" },
    { num: 4, label: "C3 – Pattern 2 (~려고 해요)" },
    { num: 5, label: "C4 – Near-future time expressions" },
    { num: 6, label: "C5 – Example plan paragraph breakdown" },
    { num: 7, label: "Activity 1 – Future tense conjugation guides" },
    { num: 8, label: "Activity 2 – Near future time expressions & MCQs" },
    { num: 9, label: "Activity 3 – Plans listening summaries & details" },
    { num: 10, label: "Activity 4 – Horizon plan builder & speaking practice" }
  ];

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
              <span>{activeLesson?.title || "Future Plans & Schedules"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: Korean Simple Future Conjugations</p>
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
                className={`p-2.5 rounded-xl border text-left transition ${step === s.num
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

      {/* Step 1: Welcome Overview */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight">Korean 2.4</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Future Plans</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Say what you’re going to do tomorrow, this weekend, and next week."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Use simple future/plan expressions (~ㄹ 거예요)",
                "Express deliberate intentions (~려고 해요)",
                "Describe near-future schedules in 4-6 sentences"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 25} minutes</p>
            <p><strong>📋 Prerequisites:</strong> completed {metadata?.prerequisites || "Korean 2.3"}</p>
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

          
        </div>
      )}

      {/* Step 2: Screen C1 – Talking about the future in Korean */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Talking About the Future</h2>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300 text-left">
            <p>This phase shifts the focus from past routines to future plans and schedules. Standard questions at A2 level include:</p>
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 font-mono text-xs text-zinc-400 space-y-2 font-korean">
              <p>• 내일 뭐 할 거예요? (What will you do tomorrow?)</p>
              <p>• 다음 주말에 뭐 할 거예요? (What will you do next weekend?)</p>
            </div>
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl text-left">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Concept Check</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[2][cIdx].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[2][cIdx].options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleCheckConcept(opt.id)}
                  disabled={cChecked}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
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

      {/* Step 3: Screen C2 – Pattern 1: ~(으)ㄹ 거예요 for simple plans */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Simple Future: ~(으)ㄹ 거예요</h2>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300 text-left">
            <p>Attach **~(으)ㄹ 거예요** directly to the verb stem:</p>
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1.5 text-xs text-zinc-400 font-korean">
              <p>• <strong>Vowel stem:</strong> add ~ㄹ 거예요 (e.g. 가다 → <span className="text-brand-300">갈 거예요</span> - will go)</p>
              <p>• <strong>Consonant stem:</strong> add ~을 거예요 (e.g. 먹다 → <span className="text-brand-300">먹을 거예요</span> - will eat)</p>
              <p>• <strong>Example:</strong> 다음 주말에 만날 거예요 (I will meet them next weekend.)</p>
            </div>
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl text-left">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Concept Check {cIdx + 1} of 2</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[3][cIdx].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[3][cIdx].options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleCheckConcept(opt.id)}
                  disabled={cChecked}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
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

      {/* Step 4: Screen C3 – Pattern 2: ~(으)려고 해요 for intentions */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Active Intentions: ~(으)려고 해요</h2>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300 text-left">
            <p>Use **~(으)려고 해요** to express a deliberate active intention ('I plan/intend to'):</p>
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1.5 text-xs text-zinc-400 font-korean">
              <p>• 공부하려고 해요 (I intend / am planning to study.)</p>
              <p>• 운동하려고 해요 (I intend to exercise.)</p>
              <p>• 점심을 먹으려고 해요 (I plan/am about to eat lunch.)</p>
            </div>
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl text-left">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Concept Check {cIdx + 1} of 2</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[4][cIdx].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[4][cIdx].options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleCheckConcept(opt.id)}
                  disabled={cChecked}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
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

      {/* Step 5: Screen C4 – Future time expressions */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Near-Future Time Expressions</h2>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300 text-left">
            <p>Establish the exact timeframe at the beginning of your sentence:</p>
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1.5 text-xs text-zinc-400 font-korean">
              <p>• 내일 (tomorrow) / 모레 (the day after tomorrow)</p>
              <p>• 이번 주말 (this weekend) / 다음 주말 (next weekend)</p>
              <p>• 다음 주 (next week) / 다음 달 (next month)</p>
            </div>
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl text-left">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Concept Check {cIdx + 1} of 2</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[5][cIdx].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[5][cIdx].options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleCheckConcept(opt.id)}
                  disabled={cChecked}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
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

      {/* Step 6: Screen C5 – Example plan paragraph */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Example Plan Narrative</h2>
          
          <div className="space-y-3 text-left">
            <span className="text-[10px] text-zinc-550 font-black uppercase tracking-wider block">Interactive Highlights</span>
            <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
              <p className="font-korean font-bold text-sm leading-relaxed text-zinc-300">
                <span className="bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded border border-amber-500/35" title="Tomorrow (Time)">내일</span> 저는 친구를 <span className="bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded border border-cyan-500/35" title="Simple plan">만날 거예요</span>. 우리는 같이 점심을 <span className="bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded border border-purple-500/35" title="Active Intention">먹으려고 해요</span>. 그리고 다음 주말에 가족을 보러 <span className="bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded border border-cyan-500/35" title="Simple plan">갈 거예요</span>.
              </p>
              <p className="text-xs text-zinc-550 leading-relaxed font-sans italic">
                "{coreData?.example_plan_paragraphs?.[0]?.en || "Tomorrow I will meet a friend. We plan to eat lunch together. And next weekend I will go to see my family."}"
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl text-left">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Concept Check {cIdx + 1} of 2</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[6][cIdx].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[6][cIdx].options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleCheckConcept(opt.id)}
                  disabled={cChecked}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
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

      {/* Step 7: Activity 1 – Future tense conjugation guides */}
      {step === 7 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Future Conjugation Grid</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of {totalSteps}</span>
          </div>

          <p className="text-xs text-zinc-400">
            Select a card to play its pronunciation and flip it. Then answer the MCQ drills.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {coreData?.plan_patterns?.map((pat: any) => {
              const isFlipped = flippedPatternId === pat.id;
              return (
                <div
                  key={pat.id}
                  onClick={() => {
                    setFlippedPatternId(isFlipped ? null : pat.id);
                    playAudio(pat.korean);
                  }}
                  className={`glass-panel p-3.5 rounded-xl border text-center transition cursor-pointer flex flex-col justify-between h-24 ${
                    isFlipped ? "border-brand-500 bg-brand-500/5 shadow-md" : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800"
                  }`}
                >
                  {!isFlipped ? (
                    <div className="my-auto space-y-1 font-korean">
                      <div className="text-sm font-black text-white">{pat.korean}</div>
                      <span className="text-[8px] text-zinc-500 tracking-wider uppercase font-mono">Future Frame</span>
                    </div>
                  ) : (
                    <div className="animate-fade-in text-left my-auto space-y-0.5">
                      <span className="text-xs font-black text-brand-400">{pat.english}</span>
                      <p className="text-[8px] text-zinc-500 leading-normal">{pat.note}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Micro MCQs */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-left font-sans">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Conjugation Drill {conjugationIdx + 1} of 2</h4>
            <p className="text-xs text-zinc-300 font-bold">
              Choose the correct future form for '{conjugationVerbs[conjugationIdx].dict}':
            </p>
            <div className="grid grid-cols-3 gap-2">
              {conjugationVerbs[conjugationIdx].options.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleCheckConjugationMcq(opt)}
                  disabled={conjugationChecked}
                  className={`p-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                    conjugationSelected === opt
                      ? conjugationCorrect
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-red-500 bg-red-500/10 text-white"
                      : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                  } ${conjugationChecked && opt === conjugationVerbs[conjugationIdx].correct ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {conjugationChecked && (
              <div className="flex justify-between items-center pt-1">
                <p className="text-[10px] text-zinc-450 italic">
                  {conjugationVerbs[conjugationIdx].explanation}
                </p>
                <button
                  onClick={() => {
                    setConjugationChecked(false);
                    setConjugationSelected(null);
                    setConjugationCorrect(null);
                    if (conjugationIdx === 0) setConjugationIdx(1);
                    else setStep(8);
                  }}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {conjugationIdx === 0 ? "Next MCQ" : "Continue to Time Phrases"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 8: Activity 2 – Near future time expressions */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Near-Future Time expressions</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 8 of {totalSteps}</span>
          </div>

          <p className="text-xs text-zinc-400">
            Select a card to play its pronunciation and flip it. Then answer the blank-filling drill.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[30vh] overflow-y-auto pr-1">
            {coreData?.future_time_expressions?.map((t: any, idx: number) => {
              const isFlipped = flippedTimeIdx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setFlippedTimeIdx(isFlipped ? null : idx);
                    playAudio(t.ko);
                  }}
                  className={`glass-panel p-3.5 rounded-xl border text-center transition cursor-pointer flex flex-col justify-between h-24 ${
                    isFlipped ? "border-brand-500 bg-brand-500/5 shadow-md" : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800"
                  }`}
                >
                  {!isFlipped ? (
                    <div className="my-auto space-y-1 font-korean">
                      <div className="text-sm font-black text-white">{t.ko}</div>
                      <span className="text-[8px] text-zinc-500 tracking-wider uppercase font-mono">Future Marker</span>
                    </div>
                  ) : (
                    <div className="animate-fade-in text-left my-auto space-y-0.5">
                      <span className="text-xs font-black text-brand-400">{t.en}</span>
                      <p className="text-[8.5px] text-zinc-500 leading-normal">Sets near-future frame at start of sentences.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Micro MCQ */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-left">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Blank Drill {timeIdx + 1} of 1</h4>
            <p className="text-xs text-zinc-300 font-bold">
              {timeQuestions[timeIdx].question}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {timeQuestions[timeIdx].options.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleCheckTimeMcq(opt)}
                  disabled={timeChecked}
                  className={`p-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                    timeSelected === opt
                      ? timeCorrect
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-red-500 bg-red-500/10 text-white"
                      : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                  } ${timeChecked && opt === timeQuestions[timeIdx].correct ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {timeChecked && (
              <div className="flex justify-between items-center pt-1">
                <p className="text-[10px] text-zinc-455 italic">
                  {timeQuestions[timeIdx].explanation}
                </p>
                <button
                  onClick={() => {
                    setTimeChecked(false);
                    setTimeSelected(null);
                    setTimeCorrect(null);
                    setStep(9);
                  }}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Continue to Listening
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 9: Activity 3 – Tomorrow plans listening summaries */}
      {step === 9 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 3 – Tomorrow Plans Listening</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 9 of {totalSteps}</span>
          </div>

          {listeningItems.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              {/* Part A: Choose correct summary */}
              <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="text-center">
                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Part A: Listen & Choose Plan Summary</span>
                  <p className="text-xs text-zinc-300 mt-1">Listen to this person's plans:</p>
                </div>

                <div className="flex justify-center">
                  <button onClick={() => playAudio(listeningItems[listeningIdx]?.audio_url)} className="p-4 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-brand-400 rounded-full transition flex items-center justify-center cursor-pointer shadow-md"><Volume2 className="w-6 h-6" /></button>
                </div>

                <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                  {listeningItems[listeningIdx]?.options.map((opt: any) => (
                    <button
                      key={opt.id}
                      onClick={() => !listeningChecked && setSelectedSummaryId(opt.id)}
                      disabled={listeningChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
                        selectedSummaryId === opt.id
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      } ${listeningChecked && opt.id === listeningItems[listeningIdx]?.correct_id ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${listeningChecked && selectedSummaryId === opt.id && opt.id !== listeningItems[listeningIdx]?.correct_id ? "border-red-500 bg-red-500/10 text-white" : ""}`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>

                {listeningChecked && (
                  <div className={`p-3 rounded-xl border text-xs text-center ${
                    listeningCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    {listeningCorrect ? "Correct plan matches!" : "Incorrect plan summary."}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  {!listeningChecked && (
                    <button
                      onClick={handleCheckListeningSummary}
                      disabled={!selectedSummaryId}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Verify Summary
                    </button>
                  )}
                </div>
              </div>

              {/* Part B: Detail Questions */}
              {listeningChecked && (
                <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left animate-fade-in">
                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block text-center">Part B: Detail Questions</span>
                  
                  {listeningItems[listeningIdx]?.detail_questions.map((q: any, qidx: number) => (
                    <div key={qidx} className="space-y-2">
                      <p className="text-xs text-white font-bold">{q.question}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {q.options.map((opt: string) => (
                          <button
                            key={opt}
                            onClick={() => !detailChecked && setDetailAnswers(prev => ({ ...prev, [q.question]: opt }))}
                            disabled={detailChecked}
                            className={`p-2 rounded-xl border text-center text-[10px] font-bold transition cursor-pointer ${
                              detailAnswers[q.question] === opt
                                ? "border-brand-500 bg-brand-500/10 text-white"
                                : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                            } ${detailChecked && opt === q.correct_answer ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${
                              detailChecked && detailAnswers[q.question] === opt && !detailCorrect[q.question] ? "border-red-500 bg-red-500/10 text-white" : ""
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {detailChecked && (
                    <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-[11px] text-zinc-450 space-y-2 text-center">
                      {Object.values(detailCorrect).every(v => v) ? (
                        <p className="text-accent-teal font-extrabold">Excellent! All details are correct.</p>
                      ) : (
                        <p className="text-red-400 font-extrabold">Some answers are incorrect. Review the explanations.</p>
                      )}
                      {listeningItems[listeningIdx]?.detail_questions.map((q: any, idx: number) => (
                        <p key={idx} className="text-[10px] text-left">
                          • <strong>Q{idx+1}:</strong> {q.explanation}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    {!detailChecked ? (
                      <button
                        onClick={handleCheckListeningDetails}
                        disabled={Object.keys(detailAnswers).length !== listeningItems[listeningIdx]?.detail_questions.length}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Verify Details
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setListeningChecked(false);
                          setSelectedSummaryId(null);
                          setListeningCorrect(null);
                          setDetailAnswers({});
                          setDetailChecked(false);
                          setDetailCorrect({});
                          if (listeningIdx < listeningItems.length - 1) {
                            setListeningIdx(listeningIdx + 1);
                          } else {
                            setStep(10); // Move to Plan Builder
                          }
                        }}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        {listeningIdx < listeningItems.length - 1 ? "Next Audio" : "Continue to Plan Builder"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 10: Activity 4 – Horizon plan builder & speaking practice */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 4 – Horizon Plan Builder & Speaking</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 10 of {totalSteps}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
            {/* Selections builder */}
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
              <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Part A: Builder Selections</h3>

              {/* Horizon tabs */}
              <div className="flex justify-center gap-3">
                {builderTemplates?.horizons?.map((h: any) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      setSelectedHorizonId(h.id);
                      setSelectedActivities([]);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      selectedHorizonId === h.id ? "bg-brand-500 text-white border-brand-500" : "bg-zinc-950 text-zinc-400 border-white/5"
                    }`}
                  >
                    {h.name}
                  </button>
                ))}
              </div>

              {/* Activities checkboxes */}
              <div className="space-y-1.5 max-h-[25vh] overflow-y-auto pr-1">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Activities Options:</span>
                {builderTemplates?.horizons?.find((h: any) => h.id === selectedHorizonId)?.activities.map((act: any) => {
                  const isSelected = selectedActivities.includes(act.future_ko);
                  return (
                    <div
                      key={act.future_ko}
                      onClick={() => toggleActivity(act.future_ko)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-3 cursor-pointer ${
                        isSelected ? "border-brand-500 bg-brand-500/10 text-white" : "border-white/5 bg-zinc-950 text-zinc-400"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isSelected ? "bg-brand-500 border-brand-500 text-white" : "border-white/10 bg-zinc-900"}`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div>
                        <span className="font-korean block text-white">{act.future_ko}</span>
                        <span className="text-[10px] text-zinc-500">{act.en}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reason selection */}
              <div className="space-y-1.5 border-t border-white/5 pt-3">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Add Reason Clauses (Optional):</span>
                <div className="flex flex-wrap gap-2">
                  {builderTemplates?.reasons?.map((r: any) => {
                    const isSelected = selectedReasons.includes(r.ko);
                    return (
                      <button
                        key={r.ko}
                        onClick={() => toggleReason(r.ko)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                          isSelected ? "bg-purple-500 text-white border-purple-500" : "bg-zinc-950 text-zinc-450 border-white/5"
                        }`}
                      >
                        {r.ko}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={handleBuildParagraph}
                  disabled={building}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition cursor-pointer"
                >
                  {building ? "Assembling plans..." : "Assemble Plans Story"}
                </button>
              </div>
            </div>

            {/* Speaking results */}
            <div className="space-y-4">
              {builtParagraph ? (
                <div className="bg-zinc-950 p-5 rounded-2xl border border-brand-500/25 space-y-3 text-center animate-fade-in flex-grow flex flex-col justify-between h-full">
                  <div className="space-y-2">
                    <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Generated Future Plan</span>
                    <p className="text-sm font-black text-white font-korean leading-relaxed">{builtParagraph.final_korean_text}</p>
                    <button onClick={() => playAudio(builtParagraph.final_korean_text)} className="p-2 bg-brand-500/10 text-brand-400 rounded-full border border-brand-500/20 mx-auto hover:bg-brand-500/20 transition cursor-pointer"><Volume2 className="w-4 h-4" /></button>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-3 text-left">
                    <span className="text-[9px] text-zinc-550 font-mono uppercase tracking-wider block">Part B: Speaking Evaluation</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (rec.recording) rec.stop();
                          else rec.start();
                        }}
                        disabled={speakingTranscribing}
                        className={`p-4 rounded-full transition cursor-pointer ${
                          rec.recording
                            ? "bg-red-500 text-white animate-pulse"
                            : "bg-brand-500/10 text-brand-400 border border-brand-500/25 hover:bg-brand-500/20"
                        }`}
                      >
                        {rec.recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>
                      <div className="text-xs">
                        <p className="font-bold text-white">{rec.recording ? "Recording... Click to Stop" : "Click to Record Speech"}</p>
                        <p className="text-[10px] text-zinc-500 font-sans">Read your assembled plan aloud</p>
                      </div>
                    </div>

                    {rec.audioBlob && !rec.recording && (
                      <button
                        onClick={handleSpeechEvaluate}
                        disabled={speakingTranscribing}
                        className="w-full bg-zinc-900 hover:bg-zinc-850 text-white font-bold py-2 rounded-xl text-xs transition border border-white/5 cursor-pointer font-sans"
                      >
                        {speakingTranscribing ? "Evaluating..." : "Check Pronunciation"}
                      </button>
                    )}

                    {speakingResult && (
                      <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 space-y-1 text-xs font-sans">
                        <p className="font-black text-white">Score Accuracy: {speakingResult.similarity_score?.toFixed(0) || speakingResult.score || 0}%</p>
                        <p className="text-zinc-550 text-[10px]">Recognized: "{speakingResult.recognized_text || speakingResult.transcription || "..."}"</p>
                        <p className="text-zinc-450 text-[10px] italic">Feedback: {speakingResult.feedback}</p>
                      </div>
                    )}

                    {/* Reflection check */}
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <p className="text-xs text-zinc-350 font-sans">How many different time expressions did you use?</p>
                      <div className="flex gap-2">
                        {["1 expression", "2 expressions", "3+ expressions"].map(opt => (
                          <button
                            key={opt}
                            onClick={() => handleCheckBuilderReflection(opt)}
                            disabled={builderReflectionChecked}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                              builderReflectionSelected === opt
                                ? "border-accent-teal bg-accent-teal/15 text-white"
                                : "border-white/10 bg-zinc-900 text-zinc-450 hover:border-white/20"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      {builderReflectionChecked && (
                        <p className="text-[10px] text-zinc-550 leading-snug font-sans">
                          Excellent details! Using a variety of future time bounds enhances conversation flow.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      onClick={handleSaveParagraph}
                      disabled={savingParagraph || paragraphSaved}
                      className="bg-accent-teal text-zinc-950 font-black py-1.5 px-4 rounded-lg text-xs"
                    >
                      {paragraphSaved ? "Saved Plan!" : "Save Plan"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/10 border border-dashed border-white/10 rounded-2xl h-full flex items-center justify-center text-zinc-500 text-xs">
                  Assemble your plan story to activate pronunciation checks.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(9)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(11)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-sans">Start Quiz Checkpoint <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 11: Activity 5 – Checkpoint mini-quiz */}
      {step === 11 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Capstone Future Plans Checkpoint Quiz</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold font-sans">Question {quizIdx + 1} of {quizBlueprint.length}</span>
          </div>

          {quizBlueprint.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full font-sans">
              <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 text-center">
                <span className="text-[10px] text-zinc-550 uppercase font-mono block">Question Prompt</span>
                <p className="font-extrabold text-white text-base mt-2">{quizBlueprint[quizIdx]?.question}</p>
              </div>

              {quizBlueprint[quizIdx]?.type === "listening" && (
                <div className="text-center space-y-4">
                  <button 
                    onClick={() => playAudio(quizBlueprint[quizIdx]?.correct_answer || quizBlueprint[quizIdx]?.audio_text)}
                    className="p-5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full mx-auto transition flex items-center justify-center cursor-pointer shadow-md"
                  >
                    <Volume2 className="w-8 h-8" />
                  </button>
                  <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                    {quizBlueprint[quizIdx]?.options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                        disabled={quizChecked}
                        className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
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

              {quizBlueprint[quizIdx]?.type !== "listening" && quizBlueprint[quizIdx]?.type !== "writing" && (
                <div className="grid grid-cols-1 gap-2">
                  {quizBlueprint[quizIdx]?.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                      disabled={quizChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
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
                      {["갈 거예요", "먹을 거예요", "공부하려고 해요", "내일", "이번 주말", "다음 주"].map(ch => (
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
                      quizBlueprint[quizIdx]?.type !== "writing" 
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

      {/* Step 12: Completion & Homework */}
      {step === 12 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in max-w-2xl mx-auto font-sans">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0 animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white">Level 3: Phase 4 Completed! 🎓✨</h2>
            <p className="text-zinc-400 text-xs mt-1">You scored {quizScore}% on your future plans check! You earned **150 XP**.</p>
          </div>

          {/* Practical Checklist Homework */}
          <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 text-left space-y-3 w-full">
            <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-black block">Homework Checklist Tasks</span>
            <div className="space-y-2">
              {homeworkItems.map((hw) => {
                const isChecked = !!completedHomework[hw.id];
                return (
                  <div 
                    key={hw.id}
                    onClick={() => handleToggleHomework(hw.id, isChecked)}
                    className="flex items-center gap-3 p-3 bg-zinc-950/80 rounded-xl border border-white/5 cursor-pointer hover:bg-zinc-900 transition animate-fade-in"
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
          <div className="bg-zinc-950 p-6 rounded-2xl border border-brand-500/10 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] text-brand-400 font-mono font-black uppercase tracking-wider block">Start Speaking Practice with Gwan-Sik</span>
              <p className="text-xs text-zinc-500">Practice describing your future plans and intentions with live feedback.</p>
            </div>

            {!tutorSession ? (
              <button
                onClick={handleLaunchTutor}
                disabled={loadingTutor}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl text-xs transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                {loadingTutor ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                <span>Practice Future Plans with AI Tutor</span>
              </button>
            ) : (
              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-xs text-center space-y-3 animate-fade-in">
                <p className="text-zinc-300 font-korean">Room launched! Opener: <strong>"{tutorSession.opener}"</strong></p>
                <a
                  href={`/conversation?session_id=${tutorSession.session_id}`}
                  className="bg-accent-teal hover:bg-accent-teal/90 text-zinc-950 font-black py-2.5 px-6 rounded-lg text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Enter AI Chat Room</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button 
              onClick={() => {
                setStep(11);
                setQuizIdx(0);
                setQuizSelectedOpt(null);
                setQuizWritingAns("");
                setQuizChecked(false);
                setQuizCorrect(null);
                setQuizMistakes([]);
                setQuizScore(null);
              }}
              className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition cursor-pointer"
            >
              Retake Checkpoint
            </button>
            <button 
              onClick={onComplete}
              className="bg-gradient-to-r from-brand-500 to-amber-500 text-zinc-950 font-black px-6 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow shadow-brand-500/25"
            >
              <span>Complete & Earn 150 XP</span>
              <ChevronRight className="w-4 h-4 text-zinc-950" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
