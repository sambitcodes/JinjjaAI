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

interface Course2Phase2SelfIntroWizardProps {
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

export default function Course2Phase2SelfIntroWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course2Phase2SelfIntroWizardProps) {
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c2p2_step");
    const savedMax = localStorage.getItem("hangeulai_c2p2_max_step");
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
      localStorage.setItem("hangeulai_c2p2_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 12;

  // Persist step to localStorage for refresh resilience
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c1p2_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 12) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c1p2_step", String(step));
  }, [step]);

  // Loaded DB data
  const [metadata, setMetadata] = useState<any>(null);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [listeningItems, setListeningItems] = useState<any[]>([]);
  const [allowedPatterns, setAllowedPatterns] = useState<any>(null);
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);

  // Card flipping tracking
  const [flippedPatternId, setFlippedPatternId] = useState<string | null>(null);

  // Concept Micro-questions states
  const [cSelected, setCSelected] = useState<string | null>(null);
  const [cChecked, setCChecked] = useState(false);
  const [cCorrect, setCCorrect] = useState<boolean | null>(null);
  const [cIdx, setCIdx] = useState(0);

  /// Persist answered concepts state
  const [answeredConcepts, setAnsweredConcepts] = useState<Record<number, { selected: string, correct: boolean }>>({});

  // Reset/Restore micro-question state when moving between concept screens
  useEffect(() => {
    if (step >= 2 && step <= 6) {
      const answered = answeredConcepts[step];
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
  }, [step, answeredConcepts]);

  // Automatically save answered concept states when checked
  

  // Concept Micro-questions definitions
  const conceptQuestions: Record<number, MicroQuestion[]> = {
    2: [
      {
        question: "Which 3 things do you think are most important in a first intro?",
        options: [
          { id: "A", text: "Name, country, and job/status" },
          { id: "B", text: "Favorite music, age, and blood type" }
        ],
        correctId: "A",
        explanation: "At A1, standard self-introductions focus on greeting, name, country, and optional job status."
      }
    ],
    3: [
      {
        question: "If your name is 민수, which name pattern feels most natural for a friendly conversation?",
        options: [
          { id: "A", text: "저는 민수예요." },
          { id: "B", text: "저는 민수입니다." }
        ],
        correctId: "A",
        explanation: "Both are polite, but -예요 is the friendly polite copula (since 민수 ends in a vowel)."
      },
      {
        question: "If your name ends with a consonant (e.g. 박), which ending do you expect?",
        options: [
          { id: "A", text: "이에요" },
          { id: "B", text: "예요" }
        ],
        correctId: "A",
        explanation: "Use 이에요 after consonants (e.g. 박이에요) to bridge pronunciation naturally."
      }
    ],
    4: [
      {
        question: "Which pattern means 'I am a _ person (nationality)'?",
        options: [
          { id: "A", text: "저는 _ 사람입니다." },
          { id: "B", text: "저는 _ 좋아해요." }
        ],
        correctId: "A",
        explanation: "_ 사람입니다 literally means 'am a _ person'."
      },
      {
        question: "If you are from Japan, which fits your self-introduction?",
        options: [
          { id: "A", text: "저는 일본 사람입니다." },
          { id: "B", text: "저는 일본 감사합니다." }
        ],
        correctId: "A",
        explanation: "감사합니다 is thank you. 사람입니다 specifies nationality/origin."
      }
    ],
    5: [
      {
        question: "Which of these sentences means 'I am a student'?",
        options: [
          { id: "A", text: "저는 학생입니다." },
          { id: "B", text: "저는 학생 감사합니다." }
        ],
        correctId: "A",
        explanation: "학생 is student. 입니다 represents the formal copula."
      },
      {
        question: "If you are not working, which option describes your status?",
        options: [
          { id: "A", text: "저는 학생입니다." },
          { id: "B", text: "저는 회사원입니다." }
        ],
        correctId: "A",
        explanation: "학생입니다 (I am a student) is ideal for non-workers/students."
      }
    ],
    6: [
      {
        question: "In which order would you put these lines to structure a mini self-introduction?",
        options: [
          { id: "A", text: "Greeting → Name → Country → Closing" },
          { id: "B", text: "Country → Greeting → Closing → Name" }
        ],
        correctId: "A",
        explanation: "Start with a greeting (안녕하세요), introduce name/country, and close with 반갑습니다."
      }
    ]
  };

  // Activity 7: Pattern Flips MCQ states
  const [activePatIdx, setActivePatIdx] = useState(0);
  const [patSelectedOpt, setPatSelectedOpt] = useState<string | null>(null);
  const [patChecked, setPatChecked] = useState(false);
  const [patCorrect, setPatCorrect] = useState<boolean | null>(null);

  // Activity 8: Listening states
  const [listeningIdx, setListeningIdx] = useState(0);
  const [selectedListeningOpt, setSelectedListeningOpt] = useState<string | null>(null);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningCorrect, setListeningCorrect] = useState<boolean | null>(null);

  // Activity 9: Personal detail pattern fill forms states
  const [userName, setUserName] = useState("지우");
  const [nameEndsConsonant, setNameEndsConsonant] = useState<string | null>(null); // "yes", "no"
  const [selectedCountry, setSelectedCountry] = useState("미국");
  const [selectedOccupation, setSelectedOccupation] = useState("학생");
  const [hasCheckedNameConsonant, setHasCheckedNameConsonant] = useState(false);
  const [nameConsonantCorrect, setNameConsonantCorrect] = useState<boolean | null>(null);

  // Activity 10: Custom intro build builder lines
  const [greetLine, setGreetLine] = useState("안녕하세요.");
  const [nameLine, setNameLine] = useState("저는 지우입니다.");
  const [originLine, setOriginLine] = useState("저는 미국 사람입니다.");
  const [closingLine, setClosingLine] = useState("반갑습니다.");
  const [builtIntro, setBuiltIntro] = useState<any>(null);
  const [building, setBuilding] = useState(false);
  const [savingIntro, setSavingIntro] = useState(false);
  const [introSaved, setIntroSaved] = useState(false);
  const [introChecked, setIntroChecked] = useState(false);
  const [introCorrect, setIntroCorrect] = useState<boolean | null>(null);
  const [introSelectedOpt, setIntroSelectedOpt] = useState<string | null>(null);

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

  // Homework checklist states
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Tutor Launcher states
  const [tutorSession, setTutorSession] = useState<any>(null);
  const [loadingTutor, setLoadingTutor] = useState(false);

  // Sound and XP helpers
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
          const res = await apiJson("/lessons/phases/korean1/2/metadata");
          setMetadata(res);
        } else if ((step === 2 || step === 7) && patterns.length === 0) {
          const res = await apiJson("/lessons/phases/korean1/2/patterns");
          setPatterns(res);
        } else if (step === 8 && listeningItems.length === 0) {
          const res_lis = await apiJson("/lessons/practice/selfintro/listening");
          setListeningItems(res_lis.items || []);
        } else if (step === 9 && !allowedPatterns) {
          const res_p = await apiJson("/lessons/practice/selfintro/patterns");
          setAllowedPatterns(res_p);
          
          try {
            const profile = await apiJson("/progress/profile");
            if (profile.korean_name) {
              setUserName(profile.korean_name);
              setNameLine(`저는 ${profile.korean_name}입니다.`);
            }
          } catch (e) {
            // Safe fallback
          }
        } else if (step === 11 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/lessons/quiz/korean1/phase-2/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 12 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean1/2/homework");
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
    const conceptKey = `${step}_${cIdx}`;
    setAnsweredConcepts(prev => ({ ...prev, [conceptKey]: { selected: selectedId, correct: isCorrect } }));
    
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
  };

  // Concept Screen next subquestion or next step helper
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

  // Activity 1 Pattern card MCQ
  const handleCheckPatternCard = (opt: string) => {
    if (patChecked) return;
    setPatSelectedOpt(opt);
    const isCorrect = opt === "A";
    setPatChecked(true);
    setPatCorrect(isCorrect);
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
  };

  // Activity 2 Listening MCQ submission
  const handleCheckListening = async () => {
    const current = listeningItems[listeningIdx];
    if (!current || !selectedListeningOpt) return;

    try {
      const res = await apiJson("/lessons/practice/selfintro/listening/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_option_id: selectedListeningOpt,
          time_taken_ms: 1000
        })
      });
      setListeningChecked(true);
      setListeningCorrect(res.correct);
      if (res.correct) {
        playCorrectSound();
      } else {
        playWrongSound();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 3 Name consonant/vowel check MCQ
  const handleCheckNameConsonant = (answer: string) => {
    if (hasCheckedNameConsonant) return;
    setNameEndsConsonant(answer);
    
    // Auto check logic: last character of name
    const lastChar = userName.charAt(userName.length - 1);
    const code = lastChar.charCodeAt(0);
    let hasConsonant = false;
    if (code >= 0xac00 && code <= 0xd7a3) {
      const jong = (code - 0xac00) % 28;
      hasConsonant = jong > 0;
    }
    const correctVal = hasConsonant ? "yes" : "no";
    const isCorrect = answer === correctVal;
    
    setHasCheckedNameConsonant(true);
    setNameConsonantCorrect(isCorrect);
    
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
  };

  // Activity 4 Custom Builder generator
  const handleBuildIntro = async () => {
    setBuilding(true);
    setBuiltIntro(null);
    try {
      const res = await apiJson("/lessons/practice/selfintro/build", {
        method: "POST",
        body: JSON.stringify({
          lines: [greetLine, nameLine, originLine, closingLine]
        })
      });
      setBuiltIntro(res);
    } catch (err) {
      console.error(err);
    } finally {
      setBuilding(false);
    }
  };

  const handleCheckIntroFormality = (opt: string) => {
    if (introChecked) return;
    setIntroSelectedOpt(opt);
    const isCorrect = opt === "A";
    setIntroChecked(true);
    setIntroCorrect(isCorrect);
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
  };

  // Saves self intro to profile
  const handleSaveIntro = async () => {
    if (!builtIntro) return;
    setSavingIntro(true);
    try {
      await apiJson("/lessons/users/selfintro/save", {
        method: "POST",
        body: JSON.stringify({
          intro_text: builtIntro.final_korean_text
        })
      });
      setIntroSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingIntro(false);
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
        await apiJson("/lessons/quiz/korean1/phase-2/finish", {
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

  // Speaking check for Saved self-intro
  const handleSpeechEvaluate = async () => {
    const targetText = builtIntro?.final_korean_text || "저는 미국 사람입니다";
    if (!rec.audioBlob) return;
    setSpeakingTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("target_text", targetText);
      fd.append("audio_file", rec.audioBlob, "recording.wav");
      const res = await apiForm("/speech/shadow", fd);
      setSpeakingResult(res);
      if (res.similarity_score >= 60) {
        setQuizWritingAns(targetText);
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
      await apiJson("/lessons/phases/korean1/2/homework/check", {
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
      const res = await apiJson("/lessons/tutor/selfintro-practice/start", { method: "POST" });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

    const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "C1 – What goes into a basic Korean self-intro?" },
    { num: 3, label: "C2 – Pattern 1: saying your name politely" },
    { num: 4, label: "C3 – Pattern 2: saying your nationality / origin" },
    { num: 5, label: "C4 – Pattern 3: job / student status" },
    { num: 6, label: "C5 – Stitching lines into a mini-intro" },
    { num: 7, label: "Activity 1 – Identity pattern charts & card flips" },
    { num: 8, label: "Activity 2 – Listening: self-intro comprehension MCQ" },
    { num: 9, label: "Activity 3 – Personal detail pattern fill forms" },
    { num: 10, label: "Activity 4 – Guided multi-line intro builder" },
    { num: 11, label: "Activity 5 – Graduating checkpoint mini-quiz" },
    { num: 12, label: "Short self-intro chat with Gwan-Sik" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 2,
          phaseNum: 2,
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
              <span>{activeLesson?.title || "Introducing Yourself"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: Self-Introductions</p>
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
    if (courseXP < 260) {
      alert("To graduate from this course, you need at least 260 XP. You currently have " + courseXP + " XP. Please review earlier steps or re-answer incorrect questions to earn more XP!");
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
          
          <h2 className="text-5xl font-black text-white tracking-tight">Korean 1.2</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Introducing Yourself</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Say your name, where you're from, and ask others about themselves."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Introduce yourself with name and country",
                "Ask and answer simple 'Where are you from?' questions",
                "Build a short A1-level self-introduction"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 20} minutes</p>
            <p><strong>📋 Prerequisites:</strong> {metadata?.prerequisites || "Greetings & Polite Basics"}</p>
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => {
    if (courseXP < 80) {
      alert("To start Phase 2, you need at least 80 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!");
      return;
    }
    setStep(2);
  }}
              className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 2</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          
        </div>
      )}

      {/* Screen 2: C1 - What goes into a basic Korean self-intro */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">What goes into a basic Korean self-intro?</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            A simple A1 self-introduction usually includes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-300 pl-4 text-sm">
            <li><strong>Greeting</strong> (안녕하세요)</li>
            <li><strong>Name</strong> (저는 이에요 / 입니다)</li>
            <li><strong>Country/nationality</strong> (저는 _ 사람입니다 / _에서 왔어요)</li>
            <li><strong>Optional:</strong> job or student status (저는 학생입니다 / 회사원입니다)</li>
          </ul>
          <p className="text-zinc-400 text-xs italic">
            You don’t need long stories yet—just short, clear lines.
          </p>

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

      {/* Screen 3: C2 - Pattern 1: saying your name politely */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Pattern 1: Saying Your Name Politely</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl text-center space-y-2">
              <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">Name ending with Consonant</span>
              <div className="text-xl font-bold text-white font-korean">저는 [이름]이에요.</div>
              <div className="text-xs text-zinc-400">e.g. 저는 준석이에요.</div>
            </div>
            
            <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl text-center space-y-2">
              <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">Name ending with Vowel</span>
              <div className="text-xl font-bold text-white font-korean">저는 [이름]예요.</div>
              <div className="text-xs text-zinc-400">e.g. 저는 민수예요.</div>
            </div>

            <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl text-center space-y-2">
              <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">More Formal polite</span>
              <div className="text-xl font-bold text-white font-korean">저는 [이름]입니다.</div>
              <div className="text-xs text-zinc-400">Common in self-introductions</div>
            </div>
          </div>

          <p className="text-zinc-300 text-sm leading-relaxed">
            <strong>저는</strong> means “I” (topic) in polite form.<br/>
            <strong>(이)예요</strong> is the polite friendly copula (“am/is/are”), whereas <strong>입니다</strong> is more formal.
          </p>

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

      {/* Screen 4: C3 - Pattern 2: saying nationality / origin */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Pattern 2: Saying your nationality / origin</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl space-y-1 text-left">
              <div className="text-lg font-bold text-white font-korean">저는 [나라] 사람입니다.</div>
              <p className="text-xs text-zinc-400">“I am a [Country] person.” (e.g. 저는 한국 사람입니다 - I am Korean)</p>
            </div>
            <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl space-y-1 text-left">
              <div className="text-lg font-bold text-white font-korean">저는 [나라]에서 왔어요.</div>
              <p className="text-xs text-zinc-400">“I came from [Country].” (More conversational polite)</p>
            </div>
          </div>

          <p className="text-zinc-300 text-sm leading-relaxed">
            <strong>_ 사람</strong> means a person from that country. <strong>사람입니다</strong> fits self-introductions perfectly, whereas <strong>_에서 왔어요</strong> is commonly used in friendly discussions.
          </p>

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

      {/* Screen 5: C4 - Pattern 3: job / student status */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Pattern 3: Job / Student Status (Optional Line)</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            At A1, keep it minimal:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl text-center">
              <div className="text-lg font-bold text-white font-korean">저는 학생입니다.</div>
              <div className="text-xs text-zinc-400">“I am a student.”</div>
            </div>
            <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl text-center">
              <div className="text-lg font-bold text-white font-korean">저는 회사원입니다.</div>
              <div className="text-xs text-zinc-400">“I am an office worker.”</div>
            </div>
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

      {/* Screen 6: C5 - Stitching lines into a mini-intro */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Stitching Lines into a Mini-Intro</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            A simple self-intro script looks like this:
          </p>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-center font-mono max-w-sm mx-auto space-y-2">
            <p className="text-lg font-bold text-white">안녕하세요. (Greeting)</p>
            <p className="text-lg font-bold text-white">저는 [이름]입니다. (Name)</p>
            <p className="text-lg font-bold text-white">저는 [나라] 사람입니다. (Nationality)</p>
            <p className="text-lg font-bold text-white">반갑습니다. (Closing)</p>
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

      {/* Screen 7: Activity 1 – Identity pattern charts & card flips */}
      {step === 7 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Identity Pattern Flips</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of {totalSteps}</span>
          </div>

          <p className="text-xs text-zinc-400">
            Select a card to play its sound and flip. Then complete the mini-question below it.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {patterns.slice(0, 4).map((pat, idx) => {
              const isActive = activePatIdx === idx;
              const isFlipped = flippedPatternId === pat.id;
              
              return (
                <div
                  key={pat.id}
                  onClick={() => {
                    setActivePatIdx(idx);
                    setFlippedPatternId(isFlipped ? null : pat.id);
                    playAudio(pat.korean.replace("[이름]", userName).replace("[나라]", selectedCountry).replace("[직업]", selectedOccupation));
                    // Reset MCQ status on card change
                    setPatChecked(false);
                    setPatSelectedOpt(null);
                    setPatCorrect(null);
                  }}
                  className={`glass-panel p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                    isActive ? "border-brand-500 bg-brand-500/5 shadow-lg shadow-brand-500/10" : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded border border-brand-500/20">
                      {pat.type}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudio(pat.korean.replace("[이름]", userName).replace("[나라]", selectedCountry).replace("[직업]", selectedOccupation));
                      }}
                      className="p-1 rounded bg-zinc-950/60 text-zinc-400 hover:text-white"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {!isFlipped ? (
                    <div className="py-4 text-center">
                      <div className="text-2xl font-black text-white font-korean">
                        {pat.korean}
                      </div>
                      <div className="text-[9px] text-zinc-500 font-mono mt-2 uppercase tracking-widest font-black">Tap to flip details</div>
                    </div>
                  ) : (
                    <div className="py-4 text-left space-y-1.5 animate-fade-in">
                      <div className="text-xs font-mono text-zinc-300">{pat.romanization}</div>
                      <div className="text-base font-black text-white">{pat.english}</div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{pat.usage}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Card MCQ */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Pattern Drill: {patterns[activePatIdx]?.korean}</h4>
            <p className="text-xs text-zinc-300 font-bold">This pattern is best for:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleCheckPatternCard("A")}
                disabled={patChecked}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                  patSelectedOpt === "A"
                    ? patCorrect
                      ? "border-accent-teal bg-accent-teal/15 text-white"
                      : "border-red-500 bg-red-500/10 text-white"
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                } ${patChecked && "A" === "A" ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
              >
                {activePatIdx === 0 ? "Saying your name" : activePatIdx === 1 ? "Saying your nationality" : activePatIdx === 2 ? "Saying where you came from" : "Saying your job"}
              </button>
              
              <button
                onClick={() => handleCheckPatternCard("B")}
                disabled={patChecked}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                  patSelectedOpt === "B"
                    ? "border-red-500 bg-red-500/10 text-white"
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                }`}
              >
                Saying thank you
              </button>

              <button
                onClick={() => handleCheckPatternCard("C")}
                disabled={patChecked}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                  patSelectedOpt === "C"
                    ? "border-red-500 bg-red-500/10 text-white"
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                }`}
              >
                Saying sorry
              </button>
            </div>
            {patChecked && (
              <div className="p-3 bg-zinc-950/60 rounded-xl border border-white/5 text-xs text-left animate-fade-in text-zinc-300">
                {patCorrect ? "Correct! Well done." : "Incorrect. Try again."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen 8: Activity 2 – Listening: self-intro comprehension MCQ */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Listening Comprehension</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 8 of {totalSteps}</span>
          </div>

          {listeningItems.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-4 text-center">
                <p className="text-xs text-zinc-400">
                  {listeningIdx === 0 
                    ? "Listen and identify the speaker's name:" 
                    : listeningIdx === 1 
                    ? "Listen and identify the speaker's country/nationality:" 
                    : "Listen and identify the speaker's job/status:"}
                </p>

                <div className="py-4">
                  <button
                    onClick={() => playAudio(listeningItems[listeningIdx]?.korean)}
                    className="p-5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-full mx-auto transition flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    <Volume2 className="w-8 h-8 animate-pulse" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {listeningIdx === 0 && [
                    { id: "opt_1", text: "김민수" },
                    { id: "opt_2", text: "지우" },
                    { id: "opt_3", text: "박수민" }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => !listeningChecked && setSelectedListeningOpt(opt.id)}
                      disabled={listeningChecked}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                        selectedListeningOpt === opt.id
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                      } ${listeningChecked && opt.id === "opt_1" ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${listeningChecked && selectedListeningOpt === opt.id && opt.id !== "opt_1" ? "border-red-500 bg-red-500/10 text-white" : ""}`}
                    >
                      {opt.text}
                    </button>
                  ))}

                  {listeningIdx === 1 && [
                    { id: "opt_a", text: "미국 (USA)" },
                    { id: "opt_b", text: "한국 (Korea)" },
                    { id: "opt_c", text: "프랑스 (France)" }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => !listeningChecked && setSelectedListeningOpt(opt.id)}
                      disabled={listeningChecked}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                        selectedListeningOpt === opt.id
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                      } ${listeningChecked && opt.id === "opt_a" ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${listeningChecked && selectedListeningOpt === opt.id && opt.id !== "opt_a" ? "border-red-500 bg-red-500/10 text-white" : ""}`}
                    >
                      {opt.text}
                    </button>
                  ))}

                  {listeningIdx === 2 && [
                    { id: "opt_x", text: "학생 (Student)" },
                    { id: "opt_y", text: "회사원 (Office Worker)" },
                    { id: "opt_z", text: "선생님 (Teacher)" }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => !listeningChecked && setSelectedListeningOpt(opt.id)}
                      disabled={listeningChecked}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                        selectedListeningOpt === opt.id
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                      } ${listeningChecked && opt.id === "opt_x" ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${listeningChecked && selectedListeningOpt === opt.id && opt.id !== "opt_x" ? "border-red-500 bg-red-500/10 text-white" : ""}`}
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
                    <p>Sentence: <span className="text-white font-korean">{listeningItems[listeningIdx]?.korean}</span> ({listeningItems[listeningIdx]?.romanization})</p>
                    <p className="text-zinc-400 italic">Means: "{listeningItems[listeningIdx]?.korean.includes("민수") ? "My name is Kim Minsu." : listeningItems[listeningIdx]?.korean.includes("미국") ? "I am American." : "I am a student."}"</p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  {!listeningChecked ? (
                    <button
                      onClick={async () => {
                        const correctId = listeningIdx === 0 ? "opt_1" : listeningIdx === 1 ? "opt_a" : "opt_x";
                        const isCorrect = selectedListeningOpt === correctId;
                        setListeningChecked(true);
                        setListeningCorrect(isCorrect);
                        if (isCorrect) playCorrectSound();
                        else playWrongSound();
                      }}
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

      {/* Screen 9: Activity 3 – Personal detail pattern fill forms */}
      {step === 9 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 3 – Detail Fill Forms</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 9 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-zinc-400 block">Name Input (Korean or Romanized)</label>
                <input 
                  type="text"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    setHasCheckedNameConsonant(false);
                    setNameEndsConsonant(null);
                    setNameConsonantCorrect(null);
                  }}
                  className="w-full bg-zinc-950 p-3 rounded-xl border border-white/5 text-sm text-white focus:outline-none focus:border-brand-500 font-korean"
                  placeholder="Enter name (e.g. 민수 or 박)"
                />
              </div>

              {/* Consonant/Vowel check micro-question */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2 text-left">
                <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold">Grammar Match Checklist</span>
                <p className="text-xs text-zinc-300">Does your name end with a consonant or a vowel?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCheckNameConsonant("yes")}
                    disabled={hasCheckedNameConsonant}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                      nameEndsConsonant === "yes"
                        ? nameConsonantCorrect
                          ? "border-accent-teal bg-accent-teal/15 text-white"
                          : "border-red-500 bg-red-500/10 text-white"
                        : "border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20"
                    } ${hasCheckedNameConsonant && nameConsonantCorrect === null ? "opacity-50" : ""}`}
                  >
                    Consonant (e.g. 준, 박)
                  </button>
                  <button
                    onClick={() => handleCheckNameConsonant("no")}
                    disabled={hasCheckedNameConsonant}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                      nameEndsConsonant === "no"
                        ? nameConsonantCorrect
                          ? "border-accent-teal bg-accent-teal/15 text-white"
                          : "border-red-500 bg-red-500/10 text-white"
                        : "border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    Vowel (e.g. 민수, 지우)
                  </button>
                </div>
                {hasCheckedNameConsonant && (
                  <p className="text-[10px] text-zinc-500 leading-snug">
                    {nameConsonantCorrect 
                      ? "Great detection! This correctly affects whether we plug in 이에요 or 예요 later." 
                      : "Check the final letter again. Remember that final consonants form syllable batches at the bottom."}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400">Select Country</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full bg-zinc-950 p-3 rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    {allowedPatterns?.countries?.map((c: any) => (
                      <option key={c.ko} value={c.ko}>{c.ko} ({c.en})</option>
                    )) || (
                      <>
                        <option value="미국">미국 (USA)</option>
                        <option value="한국">한국 (Korea)</option>
                        <option value="인도">인도 (India)</option>
                        <option value="일본">일본 (Japan)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400">Select Occupation / Job</label>
                  <select
                    value={selectedOccupation}
                    onChange={(e) => setSelectedOccupation(e.target.value)}
                    className="w-full bg-zinc-950 p-3 rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    {allowedPatterns?.occupations?.map((o: any) => (
                      <option key={o.ko} value={o.ko}>{o.ko} ({o.en})</option>
                    )) || (
                      <>
                        <option value="학생">학생 (Student)</option>
                        <option value="회사원">회사원 (Office Worker)</option>
                        <option value="선생님">선생님 (Teacher)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Live generation view */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 text-center space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Preview lines:</span>
              <p className="text-sm font-semibold text-brand-400">저는 {userName}입니다 / 저는 {userName}예요.</p>
              <p className="text-sm font-semibold text-brand-400">저는 {selectedCountry} 사람입니다.</p>
              <p className="text-sm font-semibold text-brand-400">저는 {selectedOccupation}입니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* Screen 10: Activity 4 – Guided multi-line intro builder */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 4 – Guided Intro Builder</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 10 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-4 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400">Line 1: Greeting style</label>
                <select
                  value={greetLine}
                  onChange={(e) => setGreetLine(e.target.value)}
                  className="w-full bg-zinc-950 p-3 rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="안녕하세요.">안녕하세요 (Standard polite)</option>
                  <option value="안녕하십니까.">안녕하십니까 (Formal polite)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400">Line 2: Name pattern</label>
                <select
                  value={nameLine}
                  onChange={(e) => setNameLine(e.target.value)}
                  className="w-full bg-zinc-950 p-3 rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value={`저는 ${userName}입니다.`}>저는 {userName}입니다 (Formal)</option>
                  <option value={`저는 ${userName}${(userName.charCodeAt(userName.length - 1) - 0xac00) % 28 > 0 ? "이에요." : "예요."}`}>
                    저는 {userName}{(userName.charCodeAt(userName.length - 1) - 0xac00) % 28 > 0 ? "이에요" : "예요"} (Conversational)
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400">Line 3: Country pattern</label>
                <select
                  value={originLine}
                  onChange={(e) => setOriginLine(e.target.value)}
                  className="w-full bg-zinc-950 p-3 rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value={`저는 ${selectedCountry} 사람입니다.`}>저는 {selectedCountry} 사람입니다 (Formal)</option>
                  <option value={`저는 ${selectedCountry}에서 왔어요.`}>저는 {selectedCountry}에서 왔어요 (Friendly)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400">Line 4: Closing phrase</label>
                <select
                  value={closingLine}
                  onChange={(e) => setClosingLine(e.target.value)}
                  className="w-full bg-zinc-950 p-3 rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="반갑습니다.">반갑습니다 (Nice to meet you)</option>
                  <option value="처음 뵙겠습니다.">처음 뵙겠습니다 (First time meeting)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleBuildIntro}
              disabled={building}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition cursor-pointer"
            >
              {building ? "Assembling..." : "Generate Intro Script"}
            </button>

            {builtIntro && (
              <div className="bg-zinc-950 p-6 rounded-2xl border border-brand-500/20 space-y-4 animate-fade-in text-center">
                <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider block">Your Final stitched Intro:</span>
                <p className="text-xl font-black text-white font-korean">{builtIntro.final_korean_text}</p>
                
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => playAudio(builtIntro.final_korean_text)}
                    className="p-3 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-full border border-brand-500/25 transition cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleSaveIntro}
                    disabled={savingIntro || introSaved}
                    className="bg-accent-teal hover:bg-accent-teal/95 disabled:opacity-50 text-zinc-950 font-black py-2 px-5 rounded-xl text-xs transition cursor-pointer"
                  >
                    {savingIntro ? "Saving..." : introSaved ? "Saved Successfully!" : "Save Intro to Profile"}
                  </button>
                </div>
              </div>
            )}

            {/* Formal vs Conversational Micro-question */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold">Stitching Reflection Check</span>
              <p className="text-xs text-zinc-300">Which intro pattern feels more formal to you?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCheckIntroFormality("A")}
                  disabled={introChecked}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                    introSelectedOpt === "A"
                      ? introCorrect
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-red-500 bg-red-500/10 text-white"
                      : "border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20"
                  } ${introChecked && "A" === "A" ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  One using 입니다 (Im-ni-da)
                </button>
                <button
                  onClick={() => handleCheckIntroFormality("B")}
                  disabled={introChecked}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                    introSelectedOpt === "B"
                      ? "border-red-500 bg-red-500/10 text-white"
                      : "border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20"
                  }`}
                >
                  One using 이에요 (I-e-yo)
                </button>
              </div>
              {introChecked && (
                <p className="text-[10px] text-zinc-500 leading-snug">
                  Correct! 입니다 represents the formal polite copula, whereas 이에요 / 예요 represents the friendly polite copula. Both are very common.
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
              <span>Mini-Quiz: Self-Intro Checkpoint</span>
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
                  <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
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
                      {["학생", "미국", "한국", "회사원", "교수", "선생님"].map(ch => (
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

      {/* Screen 12: Homework & AI Self-Intro practice */}
      {step === 12 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0 animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Phase 2 Complete! 🇰🇷✨</h2>
            <p className="text-zinc-400 text-xs">You scored {quizScore}% on your identity check! You earned **150 XP**.</p>
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

          {/* AI tutor self intro practice launcher */}
          <div className="p-5 bg-zinc-900/60 rounded-2xl border border-white/5 space-y-4">
            <div className="text-left space-y-1">
              <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider block">Special AI Practice Mode</span>
              <h4 className="text-xs font-bold text-white">Self-Introduction dialog coaching with Gwan-Sik</h4>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Starts a short, personal details chat session where Gwan-Sik asks for your name and origin, responding with polite greetings and corrections.
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
                <span>Practice your self-intro with your AI tutor</span>
              </button>
            )}
          </div>

          <button
            onClick={() => {
              // Dispatch completion XP reward
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 150, type: 'correct' } }));
              }onComplete();
            }}
            className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/20 cursor-pointer w-full max-w-xs"
          >
            <span>Finish Phase 2 & Earn XP</span>
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
