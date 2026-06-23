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

interface Course3Phase5StoriesWizardProps {
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

export default function Course3Phase5StoriesWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course3Phase5StoriesWizardProps) {
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c3p5_step");
    const savedMax = localStorage.getItem("hangeulai_c3p5_max_step");
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
      localStorage.setItem("hangeulai_c3p5_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 12;

  // Persist progress to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c3p5_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 12) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c3p5_step", String(step));
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
    if (step >= 2 && step <= 5) {
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
        question: "Which chronological order feels more natural for a life story?",
        options: [
          { id: "A", text: "future → present → past" },
          { id: "B", text: "past → present → future" }
        ],
        correctId: "B",
        explanation: "Chronological narrative flow usually moves from what already happened (past), to current situation (present), then to plans (future)."
      }
    ],
    3: [
      {
        question: "Which word signals the present tense in the example?",
        options: [
          { id: "A", text: "지난 주말에 (last weekend)" },
          { id: "B", text: "오늘 (today)" },
          { id: "C", text: "다음 주에 (next week)" }
        ],
        correctId: "B",
        explanation: "오늘 means 'today' and is the standard anchor for present-tense situations."
      }
    ],
    4: [
      {
        question: "In '다음 주에 여행을 갈 거예요', which part shows it is future?",
        options: [
          { id: "A", text: "다음 주에 (time anchor)" },
          { id: "B", text: "갈 거예요 (verb ending)" },
          { id: "C", text: "both the time anchor and the verb ending" }
        ],
        correctId: "C",
        explanation: "Both the time adverb (다음 주에 - next week) and the conjugation suffix (갈 거예요 - will go) explicitly mark the sentence as future tense."
      }
    ],
    5: [
      {
        question: "What did the speaker do last weekend?",
        options: [
          { id: "A", text: "Rested well at home (집에서 푹 쉬었어요)" },
          { id: "B", text: "Worked at the office (회사에서 일해요)" }
        ],
        correctId: "A",
        explanation: "The text says '지난 주말에 저는 집에서 푹 쉬었어요' which means they rested well at home last weekend."
      },
      {
        question: "What will they do next week?",
        options: [
          { id: "A", text: "Rest at home" },
          { id: "B", text: "Go on a trip with a friend (친구랑 여행을 갈 거예요)" }
        ],
        correctId: "B",
        explanation: "The text says '다음 주에 친구랑 여행을 갈 거예요' (Next week I will go on a trip with a friend)."
      }
    ]
  };

  // Card flipping tracking
  const [flippedAnchorIdx, setFlippedAnchorIdx] = useState<number | null>(null);

  // Activity 1: Time anchors MCQ
  const [anchorMcqIdx, setAnchorMcqIdx] = useState(0);
  const [anchorMcqSelected, setAnchorMcqSelected] = useState<string | null>(null);
  const [anchorMcqChecked, setAnchorMcqChecked] = useState(false);
  const [anchorMcqCorrect, setAnchorMcqCorrect] = useState<boolean | null>(null);

  const anchorMcqs = [
    { question: "Which anchor matches 'these days'?", options: ["어제", "요즘", "내일"], correct: "요즘", explanation: "요즘 means 'these days' or 'nowadays' representing present context." },
    { question: "Which anchor goes with a past-tense verb?", options: ["오늘", "지난 주말에", "다음 주에"], correct: "지난 주말에", explanation: "지난 주말에 means 'last weekend' and requires polite past endings." }
  ];

  // Activity 2: 3-part timeline story frames
  const [framePast, setFramePast] = useState("쉬었어요");
  const [framePresent, setFramePresent] = useState("일해요");
  const [frameFuture, setFrameFuture] = useState("갈 거예요");
  const [frameReflectionSelected, setFrameReflectionSelected] = useState<string | null>(null);
  const [frameReflectionChecked, setFrameReflectionChecked] = useState(false);

  // Activity 3: Listening
  const [listeningItems, setListeningItems] = useState<any[]>([]);
  const [listeningIdx, setListeningIdx] = useState(0);
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(null);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningCorrect, setListeningCorrect] = useState<boolean | null>(null);
  const [timelineAnswers, setTimelineAnswers] = useState<Record<string, string>>({});
  const [timelineChecked, setTimelineChecked] = useState(false);
  const [timelineCorrect, setTimelineCorrect] = useState<Record<string, boolean>>({});

  // Activity 4: Builder
  const [builderTemplates, setBuilderTemplates] = useState<any>(null);
  const [pastAnchor, setPastAnchor] = useState<string>("지난 주말에");
  const [pastActivity, setPastActivity] = useState<string>("집에서 푹 쉬었어요");
  const [presentAnchor, setPresentAnchor] = useState<string>("오늘");
  const [presentActivity, setPresentActivity] = useState<string>("회사에서 일해요");
  const [futureAnchor, setFutureAnchor] = useState<string>("다음 주에");
  const [futureActivity, setFutureActivity] = useState<string>("여행을 갈 거예요");

  const [builtParagraph, setBuiltParagraph] = useState<any>(null);
  const [building, setBuilding] = useState(false);
  const [savingParagraph, setSavingParagraph] = useState(false);
  const [paragraphSaved, setParagraphSaved] = useState(false);

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

  // Sounds & XP dispatcher
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

  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/phases/korean2/5/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLaunchTutor = async () => {
    setLoadingTutor(true);
    setTutorSession(null);
    try {
      const res = await apiJson("/lessons/conversation/a2/daily-story-practice/start", { method: "POST" });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

  // APIs loaders
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean2/5/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean2/5/core-data");
          setCoreData(res);
        } else if (step === 8 && listeningItems.length === 0) {
          const res_l = await apiJson("/practice/daily-stories/listening");
          setListeningItems(res_l.items || []);
        } else if (step === 9 && !builderTemplates) {
          const res_t = await apiJson("/practice/daily-stories/templates");
          setBuilderTemplates(res_t);
          if (res_t.anchors && res_t.activities) {
            setPastAnchor(res_t.anchors.past[0]);
            setPresentAnchor(res_t.anchors.present[0]);
            setFutureAnchor(res_t.anchors.future[0]);
            
            setPastActivity(res_t.activities.past[0].past_ko);
            setPresentActivity(res_t.activities.present[0].present_ko);
            setFutureActivity(res_t.activities.future[0].future_ko);
          }
        } else if (step === 11 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/quiz/korean2/phase-5/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 12 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/phases/korean2/5/homework");
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

  // Activity 1: Time Anchors MCQ
  const handleCheckAnchorMcq = (opt: string) => {
    if (anchorMcqChecked) return;
    setAnchorMcqSelected(opt);
    const correctVal = anchorMcqs[anchorMcqIdx].correct;
    const isCorrect = opt === correctVal;
    setAnchorMcqChecked(true);
    setAnchorMcqCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  // Activity 2: 3-part timeline frames
  const handleCheckFrameReflection = (opt: string) => {
    if (frameReflectionChecked) return;
    setFrameReflectionSelected(opt);
    setFrameReflectionChecked(true);
    playCorrectSound();
  };

  // Activity 3: Listening summaries
  const handleCheckListeningSummary = async () => {
    const current = listeningItems[listeningIdx];
    if (!current || !selectedSummaryId) return;

    try {
      const res = await apiJson("/practice/daily-stories/listening/answer", {
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
    current.timeline_questions.forEach((q: any) => {
      const userAns = timelineAnswers[q.question];
      const isCorrect = userAns === q.correct_answer;
      results[q.question] = isCorrect;
      if (!isCorrect) allCorrect = false;
    });

    setTimelineChecked(true);
    setTimelineCorrect(results);
    if (allCorrect) playCorrectSound();
    else playWrongSound();
  };

  // Activity 4: Paragraph builder
  const handleBuildParagraph = async () => {
    setBuilding(true);
    setBuiltParagraph(null);
    setParagraphSaved(false);
    try {
      const res = await apiJson("/practice/daily-stories/build", {
        method: "POST",
        body: JSON.stringify({ 
          past_anchor: pastAnchor, 
          past_activity: pastActivity,
          present_anchor: presentAnchor,
          present_activity: presentActivity,
          future_anchor: futureAnchor,
          future_activity: futureActivity
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
      await apiJson("/users/week-story/save", {
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

  // Activity 5: Speaking Evaluation
  const handleSpeechEvaluate = async () => {
    const target = builtParagraph ? builtParagraph.final_korean_text : "어제 친구를 만났어요. 오늘 일해요. 내일 청소할 거예요.";
    if (!rec.audioBlob) return;
    setSpeakingTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("expected_text", target);
      fd.append("audio_file", rec.audioBlob, "recording.webm");
      const res = await apiForm("/practice/daily-stories/speaking", fd);
      setSpeakingResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSpeakingTranscribing(false);
    }
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
        await apiJson("/quiz/korean2/phase-5/finish", {
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

    const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "C1 – Daily life stories structure" },
    { num: 3, label: "C2 – Past, present, and future time anchors" },
    { num: 4, label: "C3 – Tense selection rules per time anchors" },
    { num: 5, label: "C4 – Narrative paragraph example breakdown" },
    { num: 6, label: "Activity 1 – Past, present, future time anchors cards & MCQs" },
    { num: 7, label: "Activity 2 – 3-part timeline story frames template" },
    { num: 8, label: "Activity 3 – Daily life stories listening summaries & timeline checks" },
    { num: 9, label: "Activity 4 – Multi-tense story paragraph builder" },
    { num: 10, label: "Activity 5 – Story read-aloud voice check" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 3,
          phaseNum: 5,
          step: step
        }
      }));
    }
  }, [step]);

return (
    <div className="flex-grow flex flex-col justify-between font-sans">
      
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <BookOpen className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Daily Life Stories (Past-Present-Future)"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Curated Topic: Korean Multi-Tense Synthesis</p>
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
    if (courseXP < 500) {
      alert("To graduate from this course, you need at least 500 XP. You currently have " + courseXP + " XP. Please review earlier steps or re-answer incorrect questions to earn more XP!");
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
          
          <h2 className="text-5xl font-black text-white tracking-tight">Korean 2.5</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Daily Life Stories</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Tell short stories about your life across yesterday, today, and tomorrow in simple connected sentences."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full font-sans">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Combine past, present, and future forms in one short story",
                "Anchor each part of your story with clear time markers",
                "Read your multi-tense story aloud and pass a checkpoint quiz"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 25} minutes</p>
            <p><strong>📋 Prerequisites:</strong> completed {metadata?.prerequisites || "Korean 2.4"}</p>
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => {
    if (courseXP < 320) {
      alert("To start Phase 5, you need at least 320 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!");
      return;
    }
    setStep(2);
  }}
              className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 5</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          
        </div>
      )}

      {/* Step 2: Screen C1 – What is a “daily life story”? */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">What is a Daily Life Story?</h2>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300 text-left">
            <p>A daily life story connects what you did, what your life is like now, and what you will do. Stringing these three frames together builds narrative competency at A2 level.</p>
            <p>We follow the chronological order: **Past (e.g. last weekend) → Present (today) → Future (next week / tomorrow)**.</p>
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

      {/* Step 3: Screen C2 – Time anchors: past, present, future */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Time Anchors (Tense Markers)</h2>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300 text-left font-korean">
            <p>Establish when the action happened using distinct anchors:</p>
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2 text-xs text-zinc-400">
              <p>• <strong>Past:</strong> 지난 주말에 (last weekend), 어제 (yesterday), 어젯밤에 (last night)</p>
              <p>• <strong>Present:</strong> 오늘 (today), 요즘 (these days), 지금 (now)</p>
              <p>• <strong>Future:</strong> 내일 (tomorrow), 다음 주에 (next week), 다음 주말에 (next weekend)</p>
            </div>
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl text-left">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Concept Check {cIdx + 1} of 1</h4>
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

      {/* Step 4: Screen C3 – Using the right tense for each anchor */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <h2 className="text-3xl font-black text-white">Matching Anchors with Tenses</h2>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300 text-left">
            <p>Ensure that the verb ending matches your chosen time anchor:</p>
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1.5 text-xs text-zinc-400 font-korean">
              <p>• 지난 주말에 ... <strong className="text-brand-300">쉬었어요</strong> (polite past)</p>
              <p>• 오늘 ... 바빠요 / <strong className="text-brand-300">일해요</strong> (present)</p>
              <p>• 다음 주에 ... <strong className="text-brand-300">갈 거예요</strong> (future plan)</p>
            </div>
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl text-left">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Concept Check {cIdx + 1} of 1</h4>
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

      {/* Step 5: Screen C4 – Example story paragraph */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Example Story Breakdown</h2>
          
          <div className="space-y-3 text-left">
            <span className="text-[10px] text-zinc-550 font-black uppercase tracking-wider block">Yesterday-Today-Tomorrow Story</span>
            <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
              <p className="font-korean font-bold text-sm leading-relaxed text-zinc-300">
                <span className="bg-red-500/20 text-red-300 px-1 py-0.5 rounded border border-red-500/35" title="Past Anchor">지난 주말에</span> 저는 집에서 푹 쉬었어요. <span className="bg-green-500/20 text-green-300 px-1 py-0.5 rounded border border-green-500/35" title="Present Anchor">오늘</span> 바빠요. 회사에서 일해요. <span className="bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded border border-cyan-500/35" title="Future Anchor">다음 주에</span> 친구랑 여행을 갈 거예요.
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed font-sans italic">
                "{coreData?.story_examples?.[0]?.en || "Last weekend I rested well at home. Today I am busy. I work at the office. Next week I will go on a trip with a friend."}"
              </p>
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

      {/* Step 6: Activity 1 – Past, present, future time anchors */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Time Anchors Cards</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of {totalSteps}</span>
          </div>

          <p className="text-xs text-zinc-400">
            Select a card to play its pronunciation and flip it. Then answer the matching MCQs.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[30vh] overflow-y-auto pr-1">
            {coreData?.time_anchors?.map((t: any, idx: number) => {
              const isFlipped = flippedAnchorIdx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setFlippedAnchorIdx(isFlipped ? null : idx);
                    playAudio(t.ko);
                  }}
                  className={`glass-panel p-3.5 rounded-xl border text-center transition cursor-pointer flex flex-col justify-between h-24 ${
                    isFlipped ? "border-brand-500 bg-brand-500/5 shadow-md" : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800"
                  }`}
                >
                  {!isFlipped ? (
                    <div className="my-auto space-y-1 font-korean">
                      <div className="text-sm font-black text-white">{t.ko}</div>
                      <span className="text-[7.5px] text-zinc-500 tracking-wider uppercase font-mono">{t.type} Anchor</span>
                    </div>
                  ) : (
                    <div className="animate-fade-in text-left my-auto space-y-0.5">
                      <span className="text-xs font-black text-brand-400">{t.en}</span>
                      <p className="text-[8.5px] text-zinc-500 leading-normal">Requires a matching {t.type} tense verb ending.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Micro MCQs */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-left">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Anchor Drill {anchorMcqIdx + 1} of 2</h4>
            <p className="text-xs text-zinc-300 font-bold">
              {anchorMcqs[anchorMcqIdx].question}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {anchorMcqs[anchorMcqIdx].options.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleCheckAnchorMcq(opt)}
                  disabled={anchorMcqChecked}
                  className={`p-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                    anchorMcqSelected === opt
                      ? anchorMcqCorrect
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-red-500 bg-red-500/10 text-white"
                      : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                  } ${anchorMcqChecked && opt === anchorMcqs[anchorMcqIdx].correct ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {anchorMcqChecked && (
              <div className="flex justify-between items-center pt-1">
                <p className="text-[10px] text-zinc-455 italic">
                  {anchorMcqs[anchorMcqIdx].explanation}
                </p>
                <button
                  onClick={() => {
                    setAnchorMcqChecked(false);
                    setAnchorMcqSelected(null);
                    setAnchorMcqCorrect(null);
                    if (anchorMcqIdx === 0) setAnchorMcqIdx(1);
                    else setStep(7);
                  }}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                >
                  {anchorMcqIdx === 0 ? "Next MCQ" : "Continue to Story Frames"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 7: Activity 2 – 3‑part timeline story frames */}
      {step === 7 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – 3-Part Story Frame template</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-left">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">3-Part Chronological Frame</h3>
            
            <div className="space-y-3">
              {/* Past Frame */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 space-y-1.5 text-xs">
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">1. Past Block (e.g. 지난 주말에)</span>
                <div className="flex gap-2">
                  {["쉬었어요", "일했어요", "만났어요"].map(o => (
                    <button
                      key={o}
                      onClick={() => setFramePast(o)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        framePast === o ? "bg-red-500/20 text-red-300 border-red-500/35" : "bg-zinc-900 text-zinc-400 border-white/5"
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              {/* Present Frame */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 space-y-1.5 text-xs">
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">2. Present Block (e.g. 오늘)</span>
                <div className="flex gap-2">
                  {["일해요", "바빠요", "공부해요"].map(o => (
                    <button
                      key={o}
                      onClick={() => setFramePresent(o)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        framePresent === o ? "bg-green-500/20 text-green-300 border-green-500/35" : "bg-zinc-900 text-zinc-400 border-white/5"
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              {/* Future Frame */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 space-y-1.5 text-xs">
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">3. Future Block (e.g. 내일 / 다음 주에)</span>
                <div className="flex gap-2">
                  {["갈 거예요", "쉴 거예요", "볼 거예요"].map(o => (
                    <button
                      key={o}
                      onClick={() => setFrameFuture(o)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        frameFuture === o ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/35" : "bg-zinc-900 text-zinc-400 border-white/5"
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Compiled Preview */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-brand-500/20 text-center space-y-1.5">
              <span className="text-[9px] text-brand-400 uppercase tracking-widest block">Frame Preview Narrative</span>
              <p className="font-korean font-bold text-white text-sm">
                지난 주말에 {framePast}. 오늘 {framePresent}. 내일 {frameFuture}.
              </p>
            </div>

            {/* Reflection question */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <p className="text-xs text-zinc-350">Which block describes your current situation?</p>
              <div className="flex gap-2">
                {["Past Block", "Present Block", "Future Block"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleCheckFrameReflection(opt)}
                    disabled={frameReflectionChecked}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      frameReflectionSelected === opt
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-white/10 bg-zinc-900 text-zinc-450 hover:border-white/20"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {frameReflectionChecked && (
                <p className="text-[10px] text-zinc-550 leading-snug">
                  Feedback logged. The present block matches the today situation.
                </p>
              )}
            </div>

            {frameReflectionChecked && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setStep(8)}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Continue to Listening
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 8: Activity 3 – Daily life stories listening summaries */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 3 – Life Stories Listening</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 8 of {totalSteps}</span>
          </div>

          {listeningItems.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              {/* Part A: Choose correct summary */}
              <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="text-center">
                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Part A: Listen & Choose Plan Summary</span>
                  <p className="text-xs text-zinc-300 mt-1">Listen to the chronological life story:</p>
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
                    {listeningCorrect ? "Correct timeline summary!" : "Incorrect summary option."}
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

              {/* Part B: Timeline Questions */}
              {listeningChecked && (
                <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left animate-fade-in font-sans">
                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block text-center">Part B: Timeline detail questions</span>
                  
                  {listeningItems[listeningIdx]?.timeline_questions.map((q: any, qidx: number) => (
                    <div key={qidx} className="space-y-2">
                      <p className="text-xs text-white font-bold">{q.question}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {q.options.map((opt: string) => (
                          <button
                            key={opt}
                            onClick={() => !timelineChecked && setTimelineAnswers(prev => ({ ...prev, [q.question]: opt }))}
                            disabled={timelineChecked}
                            className={`p-2 rounded-xl border text-center text-[10px] font-bold transition cursor-pointer ${
                              timelineAnswers[q.question] === opt
                                ? "border-brand-500 bg-brand-500/10 text-white"
                                : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                            } ${timelineChecked && opt === q.correct_answer ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${
                              timelineChecked && timelineAnswers[q.question] === opt && !timelineCorrect[q.question] ? "border-red-500 bg-red-500/10 text-white" : ""
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {timelineChecked && (
                    <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-[11px] text-zinc-450 space-y-2 text-center">
                      {Object.values(timelineCorrect).every(v => v) ? (
                        <p className="text-accent-teal font-extrabold">Excellent! All details are correct.</p>
                      ) : (
                        <p className="text-red-400 font-extrabold">Some answers are incorrect. Review the explanations.</p>
                      )}
                      {listeningItems[listeningIdx]?.timeline_questions.map((q: any, idx: number) => (
                        <p key={idx} className="text-[10px] text-left">
                          • <strong>Q{idx+1}:</strong> {q.explanation}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    {!timelineChecked ? (
                      <button
                        onClick={handleCheckListeningDetails}
                        disabled={Object.keys(timelineAnswers).length !== listeningItems[listeningIdx]?.timeline_questions.length}
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
                          setTimelineAnswers({});
                          setTimelineChecked(false);
                          setTimelineCorrect({});
                          if (listeningIdx < listeningItems.length - 1) {
                            setListeningIdx(listeningIdx + 1);
                          } else {
                            setStep(9); // Move to paragraph builder
                          }
                        }}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        {listeningIdx < listeningItems.length - 1 ? "Next Audio" : "Continue to Story Builder"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 9: Activity 4 – Multi‑tense story paragraph builder */}
      {step === 9 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 4 – Multi-Tense Story Builder</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 9 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-left">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Multi-Tense Narrative Builder</h3>

            {builderTemplates && (
              <div className="space-y-3 text-xs">
                {/* Past Panel */}
                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 space-y-2">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-black block">1. Past segment</span>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={pastAnchor}
                      onChange={(e) => setPastAnchor(e.target.value)}
                      className="bg-zinc-900 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                    >
                      {builderTemplates.anchors.past.map((a: string) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                    <select
                      value={pastActivity}
                      onChange={(e) => setPastActivity(e.target.value)}
                      className="bg-zinc-900 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                    >
                      {builderTemplates.activities.past.map((act: any) => (
                        <option key={act.past_ko} value={act.past_ko}>{act.past_ko}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Present Panel */}
                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 space-y-2">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-black block">2. Present segment</span>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={presentAnchor}
                      onChange={(e) => setPresentAnchor(e.target.value)}
                      className="bg-zinc-900 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                    >
                      {builderTemplates.anchors.present.map((a: string) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                    <select
                      value={presentActivity}
                      onChange={(e) => setPresentActivity(e.target.value)}
                      className="bg-zinc-900 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                    >
                      {builderTemplates.activities.present.map((act: any) => (
                        <option key={act.present_ko} value={act.present_ko}>{act.present_ko}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Future Panel */}
                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 space-y-2">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-black block">3. Future segment</span>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={futureAnchor}
                      onChange={(e) => setFutureAnchor(e.target.value)}
                      className="bg-zinc-900 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                    >
                      {builderTemplates.anchors.future.map((a: string) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                    <select
                      value={futureActivity}
                      onChange={(e) => setFutureActivity(e.target.value)}
                      className="bg-zinc-900 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                    >
                      {builderTemplates.activities.future.map((act: any) => (
                        <option key={act.future_ko} value={act.future_ko}>{act.future_ko}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button
                onClick={handleBuildParagraph}
                disabled={building}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition cursor-pointer"
              >
                {building ? "Assembling story..." : "Assemble Story Paragraph"}
              </button>
            </div>

            {builtParagraph && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 space-y-3 animate-fade-in text-center">
                <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Generated Life Story</span>
                <p className="text-sm font-black text-white font-korean leading-relaxed">{builtParagraph.final_korean_text}</p>
                
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => playAudio(builtParagraph.final_korean_text)} className="p-2 bg-brand-500/10 text-brand-400 rounded-full border border-brand-500/20 hover:bg-brand-500/20 transition cursor-pointer"><Volume2 className="w-4 h-4" /></button>
                  <button onClick={handleSaveParagraph} disabled={savingParagraph || paragraphSaved} className="bg-accent-teal text-zinc-950 font-black py-1 px-4 rounded text-xs">{paragraphSaved ? "Saved!" : "Save Story"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 10: Activity 5 – Story speaking voice check */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 5 – Voice Recording Practice</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 10 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-center">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Read your multi-tense story aloud</h3>
            <p className="text-base font-black text-white font-korean leading-relaxed mt-2">
              {builtParagraph ? builtParagraph.final_korean_text : "어제 친구를 만났어요. 오늘 일해요. 내일 청소할 거예요."}
            </p>

            <div className="flex justify-center items-center gap-4 pt-4">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (rec.recording) rec.stop();
                  else rec.start();
                }}
                disabled={speakingTranscribing}
                className={`p-5 rounded-full transition cursor-pointer ${
                  rec.recording
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-brand-500/10 text-brand-400 border border-brand-500/25 hover:bg-brand-500/20"
                }`}
              >
                {rec.recording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <div className="text-left text-xs">
                <p className="font-bold text-white">{rec.recording ? "Recording... Click to Stop" : "Click to Record Story"}</p>
                <p className="text-[10px] text-zinc-500">ASR spoken evaluation check</p>
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
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-left text-xs space-y-1 mt-2">
                <p className="font-black text-white">Score Accuracy: {speakingResult.similarity_score?.toFixed(0) || speakingResult.score || 0}%</p>
                <p className="text-zinc-500 text-[10px]">Recognized: "{speakingResult.recognized_text || speakingResult.transcription || "..."}"</p>
                <p className="text-zinc-450 text-[10px] italic">Feedback: {speakingResult.feedback}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(9)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(11)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer font-sans">Start Checkpoint Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 11: Activity 5 – Graduating checkpoint mini-quiz */}
      {step === 11 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Capstone Daily Stories Quiz</span>
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
                      {["어제", "오늘", "내일", "쉬었어요", "일해요", "갈 거예요"].map(ch => (
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
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in max-w-2xl mx-auto">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0 animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white">Level 3: Phase 5 Completed! 🎓✨</h2>
            <p className="text-zinc-400 text-xs">You scored {quizScore}% on your daily life stories check! You earned **150 XP**.</p>
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
              <p className="text-xs text-zinc-500">Practice describing your daily life story spanning tenses with live corrections.</p>
            </div>

            {!tutorSession ? (
              <button
                onClick={handleLaunchTutor}
                disabled={loadingTutor}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl text-xs transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                {loadingTutor ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                <span>Practice Daily Stories with AI Tutor</span>
              </button>
            ) : (
              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-xs text-center space-y-3 animate-fade-in font-sans">
                <p className="text-zinc-300">Room launched! Opener: <strong>"{tutorSession.opener}"</strong></p>
                <a
                  href={`/conversation?session_id=${tutorSession.session_id}`}
                  className="bg-accent-teal hover:bg-accent-teal/90 text-zinc-950 font-black py-2.5 px-6 rounded-lg text-xs transition inline-flex items-center gap-1.5 cursor-pointer font-sans"
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
              onClick={() => {
    if (courseXP < 500) {
      alert("To graduate from this course, you need at least 500 XP. You currently have " + courseXP + " XP. Please review earlier steps or re-answer incorrect questions to earn more XP!");
      return;
    }onComplete();
  }}
              className="bg-gradient-to-r from-brand-500 to-amber-500 text-zinc-950 font-black px-6 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow shadow-brand-500/25"
            >
              <span>Complete & Earn 150 XP</span>
              <ChevronRight className="w-4 h-4 text-zinc-950" />
            </button>
          </div>
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
