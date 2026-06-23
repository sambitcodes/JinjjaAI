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
  Trophy,
  Star,
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

interface Course3Phase2PreferencesWizardProps {
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

export default function Course3Phase2PreferencesWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course3Phase2PreferencesWizardProps) {
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c3p2_step");
    const savedMax = localStorage.getItem("hangeulai_c3p2_max_step");
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
      localStorage.setItem("hangeulai_c3p2_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 12;

  // Persist step to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c3p2_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 12) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c3p2_step", String(step));
  }, [step]);

  // DB Data loaded
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

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
  useEffect(() => {
    if (cChecked && cSelected !== null && cCorrect !== null && step >= 2 && step <= 6) {
      const key = `${step}_${cIdx}`;
      if (!answeredConcepts[key]) {
        setAnsweredConcepts(prev => ({
          ...prev,
          [key]: { selected: cSelected, correct: cCorrect }
        }));
      }
    }
  }, [cChecked, cSelected, cCorrect, step, cIdx, answeredConcepts]);

  // Concept Questions definition matching requirements
  const conceptQuestions: Record<number, MicroQuestion[]> = {
    2: [
      {
        question: "Which sentence type talks about preferences?",
        options: [
          { id: "A", text: "“I’m 25 years old.”" },
          { id: "B", text: "“I like watching movies.”" }
        ],
        correctId: "B",
        explanation: "Preferences deal with hobbies, interests, and likes/dislikes rather than general biographical facts."
      }
    ],
    3: [
      {
        question: "Which pattern means 'I don't like _'?",
        options: [
          { id: "A", text: "저는 _을/를 좋아해요." },
          { id: "B", text: "저는 _을/를 싫어해요." }
        ],
        correctId: "B",
        explanation: "싫어해요 is the negative sentiment verb meaning 'don't like / hate'."
      },
      {
        question: "If you 'generally' like something but not always, which sentiment frame fits better?",
        options: [
          { id: "A", text: "좋아해요" },
          { id: "B", text: "좋아하는 편이에요" }
        ],
        correctId: "B",
        explanation: "좋아하는 편이에요 represents a softened, generally positive sentiment ('kind of like / generally like')."
      }
    ],
    4: [
      {
        question: "Which word expresses 'rarely'?",
        options: [
          { id: "A", text: "자주 (often)" },
          { id: "B", text: "가끔 (sometimes)" },
          { id: "C", text: "거의 안 (rarely)" }
        ],
        correctId: "C",
        explanation: "거의 안 represents rarely/hardly ever."
      },
      {
        question: "Which sentence sounds like a stronger positive preference?",
        options: [
          { id: "A", text: "저는 가끔 영화를 봐요." },
          { id: "B", text: "저는 자주 영화를 봐요." }
        ],
        correctId: "B",
        explanation: "Doing an activity frequently ('자주') usually implies a stronger preference."
      }
    ],
    5: [
      {
        question: "If you like coffee because it is tasty, which reason statement is correct?",
        options: [
          { id: "A", text: "맛있어서 좋아해요." },
          { id: "B", text: "비싸서 좋아해요." }
        ],
        correctId: "A",
        explanation: "맛있어서 means 'because it is tasty/delicious'."
      },
      {
        question: "Which suffix/connector means 'because' in these conversational forms?",
        options: [
          { id: "A", text: "서 (-seo)" },
          { id: "B", text: "이다 (ida)" },
          { id: "C", text: "에 (e)" }
        ],
        correctId: "A",
        explanation: "-아서/-어서 is the default connector used to express cause or reason."
      }
    ],
    6: [
      {
        question: "In this monologue, which activity does the speaker like the most?",
        options: [
          { id: "A", text: "Korean dramas (한국 드라마)" },
          { id: "B", text: "Soccer (축구)" }
        ],
        correctId: "A",
        explanation: "The speaker states they 'really like Korean dramas' but 'don't like soccer much'."
      },
      {
        question: "Which word shows how often they do that favorite activity?",
        options: [
          { id: "A", text: "자주 (often)" },
          { id: "B", text: "별로 (not much)" }
        ],
        correctId: "A",
        explanation: "The speaker says '자주 봐요' (I watch them often)."
      }
    ]
  };

  // Card flipping tracking
  const [flippedPatternId, setFlippedPatternId] = useState<string | null>(null);

  // Activity 1: Sentiment Pattern MCQs
  const [patIdx, setPatIdx] = useState(0);
  const [patSelectedOpt, setPatSelectedOpt] = useState<string | null>(null);
  const [patChecked, setPatChecked] = useState(false);
  const [patCorrect, setPatCorrect] = useState<boolean | null>(null);

  // Activity 2: Hobby builder states
  const [builderTemplates, setBuilderTemplates] = useState<any>(null);
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState("like");
  const [selectedFrequency, setSelectedFrequency] = useState("자주");
  const [selectedReason, setSelectedReason] = useState("");

  const [builtSentence, setBuiltSentence] = useState<any>(null);
  const [building, setBuilding] = useState(false);
  const [savingSentence, setSavingSentence] = useState(false);
  const [sentenceSaved, setSentenceSaved] = useState(false);
  const [builderReflectSelected, setBuilderReflectSelected] = useState<string | null>(null);
  const [builderReflectChecked, setBuilderReflectChecked] = useState(false);

  // Activity 3: Hobbies listening states
  const [listeningItems, setListeningItems] = useState<any[]>([]);
  const [listeningIdx, setListeningIdx] = useState(0);
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningCorrect, setListeningCorrect] = useState<boolean | null>(null);

  // Activity 4: Habit Profile Builder
  const [profileLike, setProfileLike] = useState("김치");
  const [profileOften, setProfileOften] = useState("공부");
  const [profileDislike, setProfileDislike] = useState("축구");
  const [profileWeekend, setProfileWeekend] = useState("책 읽기");
  const [builtProfile, setBuiltProfile] = useState<any>(null);
  const [buildingProfile, setBuildingProfile] = useState(false);
  const [speakReflectionSelected, setSpeakReflectionSelected] = useState<string | null>(null);
  const [speakReflectionChecked, setSpeakReflectionChecked] = useState(false);

  // Speaking check hook
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
          const res = await apiJson("/phases/korean2/2/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean2/2/core-data");
          setCoreData(res);
        } else if (step === 8 && !builderTemplates) {
          const res_t = await apiJson("/practice/preferences/templates");
          setBuilderTemplates(res_t);
          if (res_t.categories?.length) {
            setSelectedActivity(res_t.categories[0].activities[0].ko);
            setProfileLike(res_t.categories[0].activities[0].ko);
          }
        } else if (step === 9 && listeningItems.length === 0) {
          const res_l = await apiJson("/practice/preferences/listening");
          setListeningItems(res_l.items || []);
        } else if (step === 11 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/quiz/korean2/phase-2/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 12 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/phases/korean2/2/homework");
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

  // Activity 1: Pattern Drill MCQs
  const handleCheckPatternMCQ = (opt: string) => {
    if (patChecked) return;
    setPatSelectedOpt(opt);
    const correctVal = patIdx === 0 ? "like" : "soft";
    const isCorrect = opt === correctVal;
    setPatChecked(true);
    setPatCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  // Activity 2: Preference Builder
  const handleBuildSentence = async () => {
    setBuilding(true);
    setBuiltSentence(null);
    setSentenceSaved(false);
    try {
      const res = await apiJson("/practice/preferences/build", {
        method: "POST",
        body: JSON.stringify({
          sentiment: selectedSentiment,
          frequency: selectedFrequency,
          activity: selectedActivity,
          reason: selectedReason
        })
      });
      setBuiltSentence(res);
    } catch (err) {
      console.error(err);
    } finally {
      setBuilding(false);
    }
  };

  const handleSaveSentence = async () => {
    if (!builtSentence) return;
    setSavingSentence(true);
    try {
      await apiJson("/users/preferences/save", {
        method: "POST",
        body: JSON.stringify({ routine_text: builtSentence.final_korean_text })
      });
      setSentenceSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSentence(false);
    }
  };

  const handleCheckBuilderReflect = (opt: string) => {
    if (builderReflectChecked) return;
    setBuilderReflectSelected(opt);
    setBuilderReflectChecked(true);
    playCorrectSound();
  };

  // Activity 3: Listening summaries check
  const handleCheckListening = async () => {
    const current = listeningItems[listeningIdx];
    if (!current || !selectedOptId) return;

    try {
      const res = await apiJson("/practice/preferences/listening/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          summary_option_id: selectedOptId,
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

  // Activity 4: Habit profile builder
  const handleBuildHabitProfile = async () => {
    setBuildingProfile(true);
    setBuiltProfile(null);
    try {
      const res = await apiJson("/practice/preferences/profile", {
        method: "POST",
        body: JSON.stringify({
          like_act: profileLike,
          often_act: profileOften,
          dislike_act: profileDislike,
          weekend_act: profileWeekend
        })
      });
      setBuiltProfile(res);
    } catch (err) {
      console.error(err);
    } finally {
      setBuildingProfile(false);
    }
  };

  // Activity 4C: Speaking check
  const handleSpeechEvaluate = async () => {
    const target = builtProfile ? builtProfile.final_korean_text : "좋아해요.";
    if (!rec.audioBlob) return;
    setSpeakingTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("expected_text", target);
      fd.append("audio_file", rec.audioBlob, "recording.webm");
      const res = await apiForm("/practice/preferences/speaking", fd);
      setSpeakingResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSpeakingTranscribing(false);
    }
  };

  const handleCheckSpeakReflection = (opt: string) => {
    if (speakReflectionChecked) return;
    setSpeakReflectionSelected(opt);
    setSpeakReflectionChecked(true);
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
    } else {
      setFinishingQuiz(true);
      try {
        const correctCount = quizBlueprint.length - quizMistakes.length;
        const score = Math.round((correctCount / quizBlueprint.length) * 100);
        await apiJson("/quiz/korean2/phase-2/finish", {
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
      await apiJson("/phases/korean2/2/homework/check", {
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
      const res = await apiJson("/lessons/conversation/a2/preferences-practice/start", { method: "POST" });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

    const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "C1 – Preferences at A2 level" },
    { num: 3, label: "C2 – Core sentiment frames (좋아해요/싫어해요)" },
    { num: 4, label: "C3 – Combining frequency + preferences" },
    { num: 5, label: "C4 – Giving short reasons with 서 / 그래서" },
    { num: 6, label: "C5 – Example preference monologues analysis" },
    { num: 7, label: "Activity 1 – Sentiment pattern flips & grids" },
    { num: 8, label: "Activity 2 – Hobby lists & reason builders" },
    { num: 9, label: "Activity 3 – Hobbies listening MCQs (likes vs dislikes)" },
    { num: 10, label: "Activity 4 – Sentiment sentence builders & speaking checks" },
    { num: 11, label: "Activity 5 – Graduating checkpoint mini-quiz checks" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 3,
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
              <span>{activeLesson?.title || "Preferences & Habits"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: Expressing Preferences & Hobbies</p>
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

      {/* Step 1: Welcome Overview */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight">Korean 2.2</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Preferences & Habits</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Talk about what you like doing, how often, and why."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Express likes, dislikes, and simple preferences about daily activities",
                "Combine habits with frequency words from Phase 1",
                "Understand simple conversations about hobbies and interests"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 25} minutes</p>
            <p><strong>📋 Prerequisites:</strong> completed Korean 2.1</p>
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

      {/* Step 2: Screen C1 – What "preferences" mean in Korean */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">What Preferences Mean in Korean</h2>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300 text-left">
            <p>Preferences define what activities you enjoy or dislike, and how often you do them. Standard topics include sports, music, hobbies, and food.</p>
            <p>Korean uses specific descriptive verbs or adjectives to outline preferences directly:</p>
            <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 font-mono text-xs text-zinc-400 space-y-1">
              <p>• 좋아하다 / 싫어하다 (to like / to dislike)</p>
              <p>• 재미있다 / 재미없다 (to be fun / to not be fun)</p>
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

      {/* Step 3: Screen C2 – Core sentiment patterns (positive/negative) */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Core Sentiment Patterns</h2>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300 text-left font-korean">
            <p>Apply these frames to state likes, dislikes, or softer assessments:</p>
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1.5 text-xs text-zinc-400">
              <p>• 저는 [Noun]을/를 <strong className="text-brand-300">좋아해요</strong>. (I like [noun].)</p>
              <p>• 저는 [Noun]을/를 <strong className="text-brand-300">싫어해요</strong>. (I don't like [noun].)</p>
              <p>• [Noun]은/는 <strong className="text-brand-300">재미있어요</strong>. ([Noun] is fun.)</p>
              <p>• 저는 [Noun]을/를 <strong className="text-brand-300">좋아하는 편이에요</strong>. (I generally / kind of like [noun].)</p>
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

      {/* Step 4: Screen C3 – Combining frequency + preference */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white font-korean">Combining Frequency & Preferences</h2>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300 text-left font-korean">
            <p>Combine frequency adverbs from earlier lessons to show habits detail:</p>
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1.5 text-xs text-zinc-450">
              <p>• 저는 보통 주말에 영화를 봐요. (I usually watch movies on weekends.)</p>
              <p>• 저는 음악을 자주 들어요. (I often listen to music.)</p>
              <p>• 저는 운동을 거의 안 해요. (I rarely exercise.)</p>
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

      {/* Step 5: Screen C4 – Giving short reasons (because) */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Giving Short Reasons (Because)</h2>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300 text-left font-korean">
            <p>Chain a reason using cause suffixes or sequence connectors:</p>
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2 text-xs text-zinc-450">
              <p>Q: 왜 영화를 좋아해요? (Why do you like movies?)</p>
              <p>A: <strong className="text-brand-300">재미있어서</strong> 좋아해요. (Because it is fun, I like it.)</p>
              <p>A: <strong className="text-brand-300">건강에 좋아서</strong> 자주 운동해요. (Because it is good for health, I often exercise.)</p>
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

      {/* Step 6: Screen C5 – Example monologues about preferences */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Example Preference Analysis</h2>
          
          {coreData?.example_monologues?.[0] && (
            <div className="space-y-3 text-left">
              <span className="text-[10px] text-zinc-550 font-black uppercase tracking-wider block">Interactive Highlights</span>
              <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
                <p className="font-korean font-bold text-sm leading-relaxed text-zinc-300">
                  저는 한국 드라마를 <span className="bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded border border-blue-500/35" title="Really like (Sentiment)">정말 좋아해요</span>. <span className="bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded border border-purple-500/35" title="So/Therefore (Reason connector)">그래서</span> <span className="bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded border border-amber-500/35" title="Often (Frequency)">자주</span> 봐요. 하지만 축구는 <span className="bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded border border-blue-500/35" title="Don't like much (Sentiment)">별로 안 좋아해요</span>. <span className="bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded border border-purple-500/35" title="Because there is no fun (Reason phrase)">재미가 없기 때문이에요</span>.
                </p>
                <p className="text-xs text-zinc-555 leading-relaxed font-sans italic">"{coreData.example_monologues[0].en}"</p>
              </div>
            </div>
          )}

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

      {/* Step 7: Activity 1 – Sentiment pattern flips & grids */}
      {step === 7 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Sentiment Patterns Grid</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of {totalSteps}</span>
          </div>

          <p className="text-xs text-zinc-400">
            Select a card to play its pronunciation and flip it. Then answer the MCQ drills.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {coreData?.preference_patterns?.map((pp: any) => {
              const isFlipped = flippedPatternId === pp.id;
              return (
                <div
                  key={pp.id}
                  onClick={() => {
                    setFlippedPatternId(isFlipped ? null : pp.id);
                    playAudio(pp.korean);
                  }}
                  className={`glass-panel p-3.5 rounded-xl border text-center transition cursor-pointer flex flex-col justify-between h-24 ${
                    isFlipped ? "border-brand-500 bg-brand-500/5 shadow-md" : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800"
                  }`}
                >
                  {!isFlipped ? (
                    <div className="my-auto space-y-1">
                      <div className="text-sm font-black text-white font-korean">{pp.korean}</div>
                      <span className="text-[8px] text-zinc-500 tracking-wider uppercase font-mono">Pattern Card</span>
                    </div>
                  ) : (
                    <div className="animate-fade-in text-left my-auto space-y-0.5">
                      <span className="text-xs font-black text-brand-400">{pp.english}</span>
                      <p className="text-[8px] text-zinc-500 leading-normal">{pp.note}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Micro MCQs */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-left">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Pattern Drill {patIdx + 1} of 2</h4>
            <p className="text-xs text-zinc-300 font-bold">
              {patIdx === 0 
                ? "Which pattern is best for a polite direct 'I like _'?" 
                : "Which pattern is softer and more neutral ('generally like / kind of like')?"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCheckPatternMCQ(patIdx === 0 ? "like" : "hard")}
                disabled={patChecked}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                  patSelectedOpt === (patIdx === 0 ? "like" : "hard")
                    ? patCorrect
                      ? "border-accent-teal bg-accent-teal/15 text-white"
                      : "border-red-500 bg-red-500/10 text-white"
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                } ${patChecked && patIdx === 0 && "like" === "like" ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
              >
                {patIdx === 0 ? "을/를 좋아해요" : "을/를 싫어해요"}
              </button>

              <button
                onClick={() => handleCheckPatternMCQ(patIdx === 0 ? "soft" : "soft")}
                disabled={patChecked}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                  patSelectedOpt === "soft"
                    ? patCorrect
                      ? "border-accent-teal bg-accent-teal/15 text-white"
                      : "border-red-500 bg-red-500/10 text-white"
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                } ${patChecked && (patIdx === 0 ? "soft" !== "soft" : "soft" === "soft") ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
              >
                좋아하는 편이에요
              </button>
            </div>

            {patChecked && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    setPatChecked(false);
                    setPatSelectedOpt(null);
                    setPatCorrect(null);
                    if (patIdx === 0) setPatIdx(1);
                    else setStep(8);
                  }}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {patIdx === 0 ? "Next MCQ" : "Continue to Hobby Builder"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 8: Activity 2 – Hobby lists & reason clauses */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Hobby & Reason Builder</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 8 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left max-w-xl mx-auto w-full">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Hobby & Reason Mini-Builder</h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">Choose Category</label>
                  <select
                    value={selectedCategoryIdx}
                    onChange={(e) => {
                      const idx = parseInt(e.target.value, 10);
                      setSelectedCategoryIdx(idx);
                      const cat = builderTemplates?.categories?.[idx];
                      if (cat?.activities?.length) {
                        setSelectedActivity(cat.activities[0].ko);
                      }
                    }}
                    className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white focus:outline-none"
                  >
                    {builderTemplates?.categories?.map((cat: any, idx: number) => (
                      <option key={cat.id} value={idx}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">Choose Activity</label>
                  <select
                    value={selectedActivity}
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white focus:outline-none"
                  >
                    {builderTemplates?.categories?.[selectedCategoryIdx]?.activities?.map((act: any) => (
                      <option key={act.ko} value={act.ko}>{act.ko} ({act.en})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-550 uppercase font-black block">Sentiment Frame</label>
                  <select
                    value={selectedSentiment}
                    onChange={(e) => setSelectedSentiment(e.target.value)}
                    className="w-full bg-zinc-950 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                  >
                    <option value="like">좋아해요 (I like)</option>
                    <option value="dislike">안 좋아해요 (I don't like)</option>
                    <option value="really_like">정말 좋아해요 (I really like)</option>
                    <option value="not_much">별로 안 좋아해요 (I don't like much)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-550 uppercase font-black block">Reason Suffix (Optional)</label>
                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-full bg-zinc-955 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                  >
                    <option value="">(None)</option>
                    <option value="재미있어서">재미있어서 (because it's fun)</option>
                    <option value="편해서">편해서 (because it's convenient)</option>
                    <option value="건강에 좋아서">건강에 좋아서 (because it's healthy)</option>
                    <option value="스트레스가 풀려서">스트레스가 풀려서 (because it relieves stress)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={handleBuildSentence}
                disabled={building}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition cursor-pointer"
              >
                {building ? "Assembling..." : "Assemble Preferences"}
              </button>
            </div>

            {builtSentence && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 space-y-3 animate-fade-in text-center">
                <p className="text-base font-black text-white font-korean leading-relaxed">{builtSentence.final_korean_text}</p>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => playAudio(builtSentence.final_korean_text)} className="p-2 bg-brand-500/10 text-brand-400 rounded-full border border-brand-500/20"><Volume2 className="w-4 h-4" /></button>
                  <button onClick={handleSaveSentence} disabled={savingSentence || sentenceSaved} className="bg-accent-teal text-zinc-950 font-black py-1 px-3 rounded text-xs">{sentenceSaved ? "Saved!" : "Save Sentence"}</button>
                </div>
              </div>
            )}

            {/* Builder Reflection MCQ */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold">Builder Sentiment Check</span>
              <p className="text-xs text-zinc-300">Is the overall sentence you just built positive or negative?</p>
              <div className="flex gap-2">
                {["Positive", "Negative"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleCheckBuilderReflect(opt)}
                    disabled={builderReflectChecked}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                      builderReflectSelected === opt
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {builderReflectChecked && (
                <p className="text-[10px] text-zinc-550 leading-snug">
                  Feedback logged. Understanding whether sentiment is positive or negative helps Gwan-Sik guide your chats correctly!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 9: Activity 3 – Hobbies listening MCQs */}
      {step === 9 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 3 – Hobbies Listening</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 9 of {totalSteps}</span>
          </div>

          {listeningItems.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-4 text-center">
                <p className="text-xs text-zinc-300">Listen to the speaker's statement:</p>
                
                <div className="flex justify-center">
                  <button onClick={() => playAudio(listeningItems[listeningIdx]?.audio_text)} className="p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 rounded-full transition flex items-center justify-center cursor-pointer shadow-md"><Volume2 className="w-6 h-6" /></button>
                </div>

                <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                  {listeningItems[listeningIdx]?.options.map((opt: any) => (
                    <button
                      key={opt.id}
                      onClick={() => !listeningChecked && setSelectedOptId(opt.id)}
                      disabled={listeningChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
                        selectedOptId === opt.id
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      } ${listeningChecked && opt.id === listeningItems[listeningIdx]?.correct_id ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${listeningChecked && selectedOptId === opt.id && opt.id !== listeningItems[listeningIdx]?.correct_id ? "border-red-500 bg-red-500/10 text-white" : ""}`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>

                {listeningChecked && (
                  <div className={`p-3 rounded-xl border text-xs text-left ${
                    listeningCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    <p className="font-extrabold">{listeningCorrect ? "Correct summary!" : "Incorrect."}</p>
                    <p className="text-[10px] mt-0.5 text-zinc-400 font-mono">Statement: "{listeningItems[listeningIdx]?.audio_text}"</p>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  {!listeningChecked ? (
                    <button
                      onClick={handleCheckListening}
                      disabled={!selectedOptId}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Verify Answer
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setListeningChecked(false);
                        setSelectedOptId(null);
                        setListeningCorrect(null);
                        if (listeningIdx < listeningItems.length - 1) {
                          setListeningIdx(listeningIdx + 1);
                        } else {
                          setStep(10); // Move to profile builder step
                        }
                      }}
                      className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      {listeningIdx < listeningItems.length - 1 ? "Next Audio" : "Continue to Habit Profile"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 10: Activity 4 – Sentiment sentence builders & speaking checks */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 4 – Habit Profile & Speaking</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 10 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left max-w-xl mx-auto w-full">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Habit Profile Paragraph Builder</h3>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[8px] text-zinc-500 uppercase">1. What do you like?</label>
                <input
                  type="text"
                  value={profileLike}
                  onChange={(e) => setProfileLike(e.target.value)}
                  className="w-full bg-zinc-950 p-2 rounded border border-white/5 text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] text-zinc-500 uppercase">2. What do you often do?</label>
                <input
                  type="text"
                  value={profileOften}
                  onChange={(e) => setProfileOften(e.target.value)}
                  className="w-full bg-zinc-955 p-2 rounded border border-white/5 text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] text-zinc-500 uppercase">3. What do you dislike?</label>
                <input
                  type="text"
                  value={profileDislike}
                  onChange={(e) => setProfileDislike(e.target.value)}
                  className="w-full bg-zinc-955 p-2 rounded border border-white/5 text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] text-zinc-500 uppercase">4. Weekend activity?</label>
                <input
                  type="text"
                  value={profileWeekend}
                  onChange={(e) => setProfileWeekend(e.target.value)}
                  className="w-full bg-zinc-955 p-2 rounded border border-white/5 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={handleBuildHabitProfile}
                disabled={buildingProfile}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-5 rounded-xl text-xs transition cursor-pointer"
              >
                {buildingProfile ? "Assembling..." : "Assemble Habit Profile"}
              </button>
            </div>

            {builtProfile && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 space-y-3 animate-fade-in text-center">
                <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Habit Profile Paragraph</span>
                <p className="text-sm font-black text-white font-korean leading-relaxed">{builtProfile.final_korean_text}</p>
                <button onClick={() => playAudio(builtProfile.final_korean_text)} className="p-2 bg-brand-500/10 text-brand-400 rounded-full border border-brand-500/20 mx-auto transition"><Volume2 className="w-4 h-4" /></button>
              </div>
            )}
          </div>

          {/* Speaking check */}
          {builtProfile && (
            <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-center animate-fade-in">
              <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">A2 Hobbies Speaking Check</h3>
              <p className="text-xs text-zinc-400">Record yourself reading your habit profile aloud:</p>

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
                  className={`p-5 rounded-full transition cursor-pointer ${
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
                    className="bg-zinc-950 hover:bg-zinc-900 text-white font-bold py-2 px-4 rounded-xl text-xs transition border border-white/5 cursor-pointer"
                  >
                    {speakingTranscribing ? "Evaluating..." : "Check Pronunciation"}
                  </button>
                )}
              </div>

              {speakingResult && (
                <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 text-left text-xs space-y-1 animate-fade-in">
                  <p className="font-black text-white">Score Accuracy: {speakingResult.similarity_score?.toFixed(0) || speakingResult.score || 0}%</p>
                  <p className="text-zinc-450">Recognized: "{speakingResult.recognized_text || speakingResult.transcription || "..."}"</p>
                </div>
              )}

              {/* Reflection question */}
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 space-y-3 text-left">
                <p className="text-xs text-zinc-300">Did you use at least one reason word (-서 or 그래서) in your profile?</p>
                <div className="flex gap-2">
                  {["Yes, I did!", "No, I'll add one next time"].map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleCheckSpeakReflection(opt)}
                      disabled={speakReflectionChecked}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        speakReflectionSelected === opt
                          ? "border-accent-teal bg-accent-teal/15 text-white"
                          : "border-white/10 bg-zinc-900 text-zinc-450 hover:border-white/20"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {speakReflectionChecked && (
                  <p className="text-[10px] text-zinc-500 leading-snug">
                    Excellent! Reason clauses give depth to your profile.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 11: Activity 5 – Graduating checkpoint mini-quiz */}
      {step === 11 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Capstone Preferences Mini-Quiz</span>
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

              {quizBlueprint[quizIdx]?.type === "context" && (
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
                      {["좋아해요", "안 좋아해요", "정말", "별로", "재미있기", "때문에", "축구", "요리"].map(ch => (
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

      {/* Step 12: Completion & Homework */}
      {step === 12 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0 animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white">Level 3: Phase 2 Completed successfully! 🎓✨</h2>
            <p className="text-zinc-400 text-xs">You scored {quizScore}% on your habits check! You earned **150 XP**.</p>
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

          {/* AI practice button */}
          <div className="p-5 bg-zinc-900/60 rounded-2xl border border-white/5 space-y-4">
            <div className="text-left space-y-1">
              <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider block">Special AI Practice Mode</span>
              <h4 className="text-xs font-bold text-white">Preferences roleplay discussion with Gwan-Sik</h4>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Starts an interactive chat room where Gwan-Sik asks about your preferences, verifying positive/negative frames and frequency modifiers.
              </p>
            </div>

            {tutorSession ? (
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 text-left space-y-2">
                <span className="text-[9px] font-black text-brand-400 uppercase tracking-wider block">Preferences Coach Active Session</span>
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
                className="w-full bg-zinc-955 hover:bg-zinc-900 border border-brand-500/20 text-brand-400 hover:text-brand-300 font-bold px-4 py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingTutor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                <span>Practice preferences with Gwan-Sik</span>
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
