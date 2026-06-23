"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import xpAudit from "../lib/xp-audit.json";
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
  RefreshCw,
  Trophy,
  Star
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
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("Microphone access denied. Please allow microphone permissions and try again.") } }));
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

interface Course3Phase1LongerRoutinesWizardProps {
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

export default function Course3Phase1LongerRoutinesWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course3Phase1LongerRoutinesWizardProps) {
  const phaseNum = 1;
  const getStepMaxXP = (sNum: number) => {
    try {
      return (xpAudit as any)["3"]?.[phaseNum.toString()]?.steps?.[sNum.toString()]?.max_xp ?? 35;
    } catch (e) {
      return 35;
    }
  };
  const getStepXP = (sNum: number) => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(`hangeulai_c3p${phaseNum}_s${sNum}_earned_xp`) || "0", 10);
  };

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c3p1_step");
    const savedMax = localStorage.getItem("hangeulai_c3p1_max_step");
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
      localStorage.setItem("hangeulai_c3p1_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 12;

  // Persist step to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c3p1_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 12) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c3p1_step", String(step));
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

  // Concept Questions definition matching requirements
  const conceptQuestions: Record<number, MicroQuestion[]> = {
    2: [
      {
        question: "Which sounds more like an A2 routine?",
        options: [
          { id: "A", text: "“I wake up. I eat. I go.”" },
          { id: "B", text: "“I usually wake up at 7, then eat breakfast, and go to school.”" }
        ],
        correctId: "B",
        explanation: "A2 routines incorporate adverbs of frequency ('usually') and sequence connectors ('then', 'and') to form linked mini-stories."
      }
    ],
    3: [
      {
        question: "Which word means 'often' in Korean?",
        options: [
          { id: "A", text: "항상 (hang-sang)" },
          { id: "B", text: "자주 (ja-ju)" },
          { id: "C", text: "전혀 안 (jeon-hyeo an)" }
        ],
        correctId: "B",
        explanation: "자주 means often. 항상 means always, and 전혀 안 means never."
      },
      {
        question: "If you almost never eat breakfast, which frequency adverb fits best?",
        options: [
          { id: "A", text: "항상" },
          { id: "B", text: "자주" },
          { id: "C", text: "거의 안" }
        ],
        correctId: "C",
        explanation: "거의 안 represents rarely/hardly ever, matching the 'almost never' description."
      }
    ],
    4: [
      {
        question: "Which word introduces the first action of a timeline?",
        options: [
          { id: "A", text: "먼저 (meon-jeo)" },
          { id: "B", text: "그 다음에 (geu da-eum-e)" },
          { id: "C", text: "마지막으로 (ma-ji-mak-eu-ro)" }
        ],
        correctId: "A",
        explanation: "먼저 means 'first' and initiates the chronological sequence of routine lines."
      },
      {
        question: "Which connector means 'then / and then' in the middle of a routine?",
        options: [
          { id: "A", text: "그리고 (geu-ri-go)" },
          { id: "B", text: "먼저 (meon-jeo)" },
          { id: "C", text: "마지막으로" }
        ],
        correctId: "A",
        explanation: "그리고 functions as 'and / and then' to chain related subsequent events."
      }
    ],
    5: [
      {
        question: "In the example routine, which word shows something happens 'usually'?",
        options: [
          { id: "A", text: "보통" },
          { id: "B", text: "항상" },
          { id: "C", text: "가끔" }
        ],
        correctId: "A",
        explanation: "보통 translates to 'usually' or 'normally'."
      },
      {
        question: "Which word marks the final action of the day?",
        options: [
          { id: "A", text: "마지막으로" },
          { id: "B", text: "먼저" },
          { id: "C", text: "그리고" }
        ],
        correctId: "A",
        explanation: "마지막으로 translates to 'lastly' or 'finally' to conclude a sequence."
      }
    ]
  };

  // Card flipping tracking
  const [flippedWordId, setFlippedWordId] = useState<string | null>(null);

  // Activity 1A states (Frequency MCQs)
  const [freqIdx, setFreqIdx] = useState(0);
  const [freqSelectedOpt, setFreqSelectedOpt] = useState<string | null>(null);
  const [freqChecked, setFreqChecked] = useState(false);
  const [freqCorrect, setFreqCorrect] = useState<boolean | null>(null);

  // Activity 2B states (Sequence Tagging)
  const [tagPositions, setTagPositions] = useState<Record<number, string>>({
    0: "",
    1: "",
    2: "",
    3: ""
  });
  const [tagChecked, setTagChecked] = useState(false);
  const [tagCorrect, setTagCorrect] = useState<boolean | null>(null);
  const [tagReflectionSelected, setTagReflectionSelected] = useState<string | null>(null);
  const [tagReflectionChecked, setTagReflectionChecked] = useState(false);

  // Activity 3: Listening summaries
  const [listeningItems, setListeningItems] = useState<any[]>([]);
  const [listeningIdx, setListeningIdx] = useState(0);
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(null);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningCorrect, setListeningCorrect] = useState<boolean | null>(null);

  const [detailAnswers, setDetailAnswers] = useState<Record<string, string>>({});
  const [detailChecked, setDetailChecked] = useState(false);
  const [detailCorrect, setDetailCorrect] = useState<Record<string, boolean>>({});

  // Activity 4: Builder & speaking
  const [builderTemplates, setBuilderTemplates] = useState<any>(null);
  const [builderSlots, setBuilderSlots] = useState<any[]>([
    { slot_name: "Morning", frequency: "항상", verb: "일어나요", connector: "먼저" },
    { slot_name: "Daytime", frequency: "자주", verb: "공부해요", connector: "그리고" },
    { slot_name: "Evening", frequency: "가끔", verb: "운동해요", connector: "그 다음에" },
    { slot_name: "Late at night", frequency: "전혀", verb: "자요", connector: "마지막으로" }
  ]);
  const [builtParagraph, setBuiltParagraph] = useState<any>(null);
  const [building, setBuilding] = useState(false);
  const [savingParagraph, setSavingParagraph] = useState(false);
  const [paragraphSaved, setParagraphSaved] = useState(false);
  const [speakReflectionSelected, setSpeakReflectionSelected] = useState<string | null>(null);
  const [speakReflectionChecked, setSpeakReflectionChecked] = useState(false);

  // Audio speaking evaluation
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

  // --- Start Progress State Preservation ---
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hangeulai_c3p1_progress_state");
        if (saved) {
          const state = JSON.parse(saved);
            if (state.step !== undefined) setStep(state.step);
            if (state.maxStep !== undefined) setMaxStep(state.maxStep);
            if (state.cSelected !== undefined) setCSelected(state.cSelected);
            if (state.cChecked !== undefined) setCChecked(state.cChecked);
            if (state.cCorrect !== undefined) setCCorrect(state.cCorrect);
            if (state.cIdx !== undefined) setCIdx(state.cIdx);
            if (state.freqIdx !== undefined) setFreqIdx(state.freqIdx);
            if (state.freqSelectedOpt !== undefined) setFreqSelectedOpt(state.freqSelectedOpt);
            if (state.freqChecked !== undefined) setFreqChecked(state.freqChecked);
            if (state.freqCorrect !== undefined) setFreqCorrect(state.freqCorrect);
            if (state.tagChecked !== undefined) setTagChecked(state.tagChecked);
            if (state.tagCorrect !== undefined) setTagCorrect(state.tagCorrect);
            if (state.tagReflectionSelected !== undefined) setTagReflectionSelected(state.tagReflectionSelected);
            if (state.tagReflectionChecked !== undefined) setTagReflectionChecked(state.tagReflectionChecked);
            if (state.listeningIdx !== undefined) setListeningIdx(state.listeningIdx);
            if (state.selectedSummaryId !== undefined) setSelectedSummaryId(state.selectedSummaryId);
            if (state.listeningChecked !== undefined) setListeningChecked(state.listeningChecked);
            if (state.listeningCorrect !== undefined) setListeningCorrect(state.listeningCorrect);
            if (state.detailAnswers !== undefined) setDetailAnswers(state.detailAnswers);
            if (state.detailChecked !== undefined) setDetailChecked(state.detailChecked);
            if (state.detailCorrect !== undefined) setDetailCorrect(state.detailCorrect);
            if (state.quizIdx !== undefined) setQuizIdx(state.quizIdx);
            if (state.quizChecked !== undefined) setQuizChecked(state.quizChecked);
            if (state.quizCorrect !== undefined) setQuizCorrect(state.quizCorrect);
            if (state.quizSelectedOpt !== undefined) setQuizSelectedOpt(state.quizSelectedOpt);
            if (state.quizWritingAns !== undefined) setQuizWritingAns(state.quizWritingAns);
            if (state.quizScore !== undefined) setQuizScore(state.quizScore);
            if (state.quizMistakes !== undefined) setQuizMistakes(state.quizMistakes);
            if (state.completedHomework !== undefined) setCompletedHomework(state.completedHomework);
        }
      } catch (e) {
        console.error("Failed to restore progress state:", e);
      }
      isLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    if (typeof window !== "undefined") {
      try {
        const state = {
            step,
            maxStep,
            cSelected,
            cChecked,
            cCorrect,
            cIdx,
            freqIdx,
            freqSelectedOpt,
            freqChecked,
            freqCorrect,
            tagChecked,
            tagCorrect,
            tagReflectionSelected,
            tagReflectionChecked,
            listeningIdx,
            selectedSummaryId,
            listeningChecked,
            listeningCorrect,
            detailAnswers,
            detailChecked,
            detailCorrect,
            quizIdx,
            quizChecked,
            quizCorrect,
            quizSelectedOpt,
            quizWritingAns,
            quizScore,
            quizMistakes,
            completedHomework
        };
        localStorage.setItem("hangeulai_c3p1_progress_state", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save progress state:", e);
      }
    }
  }, [step, maxStep, cSelected, cChecked, cCorrect, cIdx, freqIdx, freqSelectedOpt, freqChecked, freqCorrect, tagChecked, tagCorrect, tagReflectionSelected, tagReflectionChecked, listeningIdx, selectedSummaryId, listeningChecked, listeningCorrect, detailAnswers, detailChecked, detailCorrect, quizIdx, quizChecked, quizCorrect, quizSelectedOpt, quizWritingAns, quizScore, quizMistakes, completedHomework]);
  // --- End Progress State Preservation ---


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
          const res = await apiJson("/phases/korean2/1/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean2/1/core-data");
          setCoreData(res);
        } else if (step === 9 && listeningItems.length === 0) {
          const res_l = await apiJson("/practice/routines2/listening");
          setListeningItems(res_l.items || []);
        } else if (step === 10 && !builderTemplates) {
          const res_t = await apiJson("/practice/routines2/templates");
          setBuilderTemplates(res_t);
        } else if (step === 11 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/quiz/korean2/phase-1/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 12 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/phases/korean2/1/homework");
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

  // Activity 1A: Frequency Card MCQ check
  const handleCheckFreqMCQ = (opt: string) => {
    if (freqChecked) return;
    setFreqSelectedOpt(opt);
    const correctVal = freqIdx === 0 ? "always" : "rarely";
    const isCorrect = opt === correctVal;
    setFreqChecked(true);
    setFreqCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  // Activity 2B: Tagging sequence order check
  const handleSelectTag = (positionIndex: number, tag: string) => {
    setTagPositions(prev => ({ ...prev, [positionIndex]: tag }));
  };

  const handleCheckTagging = () => {
    // Correct logic order: index 0 -> 먼저, index 1 -> 그리고, index 2 -> 그 다음에, index 3 -> 마지막으로
    const isCorrect = 
      tagPositions[0] === "먼저" && 
      (tagPositions[1] === "그리고" || tagPositions[1] === "그 다음에") &&
      (tagPositions[2] === "그리고" || tagPositions[2] === "그 다음에") &&
      tagPositions[3] === "마지막으로";

    setTagChecked(true);
    setTagCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  const handleCheckTagReflection = (opt: string) => {
    if (tagReflectionChecked) return;
    setTagReflectionSelected(opt);
    setTagReflectionChecked(true);
    playCorrectSound();
  };

  // Activity 3: Listening summaries check
  const handleCheckListeningSummary = async () => {
    const current = listeningItems[listeningIdx];
    if (!current || !selectedSummaryId) return;

    try {
      const res = await apiJson("/practice/routines2/listening/answer", {
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
      const userAns = detailAnswers[q.id];
      const isCorrect = userAns === q.correct;
      results[q.id] = isCorrect;
      if (!isCorrect) allCorrect = false;
    });

    setDetailChecked(true);
    setDetailCorrect(results);
    if (allCorrect) playCorrectSound();
    else playWrongSound();
  };

  // Activity 4: Timeline dropdown builder
  const handleUpdateSlot = (index: number, key: string, value: string) => {
    const nextSlots = [...builderSlots];
    nextSlots[index] = { ...nextSlots[index], [key]: value };
    setBuilderSlots(nextSlots);
  };

  const handleBuildParagraph = async () => {
    setBuilding(true);
    setBuiltParagraph(null);
    setParagraphSaved(false);
    try {
      const res = await apiJson("/practice/routines2/build", {
        method: "POST",
        body: JSON.stringify({ slots: builderSlots })
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
      await apiJson("/users/routineA2/save", {
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

  // Activity 4B: Speaking check
  const handleSpeechEvaluate = async () => {
    const target = builtParagraph ? builtParagraph.final_korean_text : "아침에 항상 일어나요.";
    if (!rec.audioBlob) return;
    setSpeakingTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("expected_text", target);
      fd.append("audio_file", rec.audioBlob, "recording.webm");
      const res = await apiForm("/practice/routines2/speaking", fd);
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
      setSpeakingResult(null);
    } else {
      setFinishingQuiz(true);
      try {
        const correctCount = quizBlueprint.length - quizMistakes.length;
        const score = Math.round((correctCount / quizBlueprint.length) * 100);
        await apiJson("/quiz/korean2/phase-1/finish", {
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
      await apiJson("/phases/korean2/1/homework/check", {
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
      const res = await apiJson("/conversation/a2/routine-extended/start", { method: "POST" });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

    const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "C1 – From single sentences to longer routines" },
    { num: 3, label: "C2 – Frequency adverbs (how often)" },
    { num: 4, label: "C3 – Timeline & sequence words" },
    { num: 5, label: "C4 – Example longer routines analysis" },
    { num: 6, label: "Activity 1 – Frequency words grids & card flips" },
    { num: 7, label: "Activity 2 – Sequence tags ordering solver" },
    { num: 8, label: "Activity 3 – Routine paragraphs listening summaries" },
    { num: 9, label: "Activity 4 – Extended routines timeline builder & speaking practice" },
    { num: 10, label: "Activity 5 – Graduating checkpoint mini-quiz checks" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 3,
          phaseNum: 1,
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
              <span>{activeLesson?.title || "Longer Routines"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: A2 Frequency & Sequence Connectors</p>
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
      {showOutline && (() => {
        const phaseEarnedXP = outlineSteps.reduce((acc, s) => acc + getStepXP(s.num), 0);
        const phaseMaxXP = outlineSteps.reduce((acc, s) => acc + getStepMaxXP(s.num), 0);
        return (
          <div className="mb-6 p-5 bg-zinc-955/80 rounded-3xl border border-white/5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 relative z-30">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 font-mono">Curriculum Syllabus Map</span>
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">Required: 180 XP</span>
            </div>
            
            {/* Phase Level Progress Bar */}
            <div className="mb-4 p-3 bg-zinc-900/60 rounded-2xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-zinc-400">
                <span>Phase XP Progress</span>
                <span className="text-brand-400">{phaseEarnedXP} / {phaseMaxXP} XP</span>
              </div>
              <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${(phaseEarnedXP / (phaseMaxXP || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {outlineSteps.map(s => {
                const isCurrent = step === s.num;
                const isCompleted = s.num < step;
                return (
                  <button
                    key={s.num}
                    disabled={!isCompleted && !isCurrent}
                    onClick={() => {
                      if (courseXP < 0) {
                        window.dispatchEvent(new CustomEvent("hangeulai-warning", {
                          detail: { message: "To start Phase 1, you need at least 0 XP in this course. You currently have " + courseXP + " XP." }
                        }));
                        return;
                      }
                      setStep(s.num);
                      setShowOutline(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between h-20 ${
                      isCurrent
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : isCompleted
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/50"
                        : "border-red-500/20 bg-red-950/20 text-red-400/40 cursor-not-allowed opacity-50"
                    }`}
                  >
                    <div>
                      <div className="text-[9px] font-black font-mono text-zinc-500">STEP {s.num}</div>
                      <div className="text-[11px] font-bold truncate w-full">{s.label}</div>
                    </div>
                    {/* Step level mini progress / XP potential */}
                    <div className="w-full mt-1">
                      <div className="flex justify-between text-[7px] font-black text-zinc-500">
                        <span>Potential</span>
                        <span className={isCompleted ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                          {getStepXP(s.num)}/{getStepMaxXP(s.num)} XP
                        </span>
                      </div>
                      <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden mt-0.5">
                        <div 
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${(getStepXP(s.num) / (getStepMaxXP(s.num) || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Step 1: Welcome Overview */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight">Korean 2.1</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Longer Routines & Time Expressions</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Describe your day in more detail using time and frequency words."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Use time expressions like 'always', 'often', 'sometimes', 'never'",
                "Tell a longer daily routine (4–6 sentences) in Korean",
                "Understand spoken descriptions of someone's day"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 25} minutes</p>
            <p><strong>📋 Prerequisites:</strong> completed Korean 1</p>
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => {
    if (courseXP < 0) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 1, you need at least 0 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 1</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          
        </div>
      )}

      {/* Step 2: Screen C1 – From single sentences to longer routines */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white font-korean">From Single Sentences to Longer Routines</h2>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300 text-left">
            <p>In Korean 1, you learned to construct isolated routine sentences:</p>
            <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 font-mono text-xs text-zinc-400 space-y-1">
              <p>“학교에 가요.” (I go to school.)</p>
              <p>“한국어를 공부해요.” (I study Korean.)</p>
            </div>
            <p>At the A2 level, you start stringing these together into connected daily mini-stories:</p>
            <p className="italic text-brand-300">“Usually I wake up at 7, then I eat breakfast, and after that I go to school.”</p>
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

      {/* Step 3: Screen C2 – Frequency adverbs */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white font-korean font-extrabold">Frequency Adverbs (빈도 부사)</h2>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300 text-left">
            <p>Frequency adverbs indicate how often you complete actions. They typically go directly **before the verb phrase**:</p>
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-white/5 font-mono text-xs text-zinc-400 space-y-1.5">
              <p>• 저는 <strong className="text-brand-300">보통</strong> 7시에 일어나요. (I usually wake up at 7.)</p>
              <p>• 저는 아침에 <strong className="text-brand-300">가끔</strong> 운동해요. (I sometimes exercise in the morning.)</p>
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

      {/* Step 4: Screen C3 – Timeline / sequence words */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Timeline / Sequence Words</h2>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300 text-left">
            <p>Chronological sequence connectors help organize timeline paragraphs:</p>
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2 text-xs text-zinc-400 font-korean">
              <p><strong className="text-yellow-400">먼저</strong> 일어나요. (First, I wake up.)</p>
              <p><strong className="text-yellow-400">그 다음에</strong> 커피를 마셔요. (After that, I drink coffee.)</p>
              <p><strong className="text-yellow-400">그리고</strong> 학교에 가요. (And then I go to school.)</p>
              <p><strong className="text-yellow-400">마지막으로</strong> 숙제를 해요. (Lastly, I do homework.)</p>
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
                      : "border-white/5 bg-zinc-955 text-zinc-300 hover:border-white/10"
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

      {/* Step 5: Screen C4 – Example longer routine paragraphs */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Interactive Routine Analysis</h2>
          
          {coreData?.example_routines?.[0] && (
            <div className="space-y-3 text-left">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Interactive Color-Coded Timeline</span>
              <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
                {/* Paragraph segments split to highlight */}
                <p className="font-korean font-bold text-sm leading-relaxed text-zinc-300">
                  <span className="bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded cursor-help border border-purple-500/30" title="First (connector)">먼저</span> 아침에 <span className="bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded cursor-help border border-blue-500/30" title="Always (frequency)">항상</span> 일찍 일어나요. <span className="bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded cursor-help border border-purple-500/30" title="And then (connector)">그리고</span> 학교에 가요. <span className="bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded cursor-help border border-purple-500/30" title="After that (connector)">그 다음에</span> 오후에 <span className="bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded cursor-help border border-blue-500/30" title="Often (frequency)">자주</span> 친구를 만나요. <span className="bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded cursor-help border border-purple-500/30" title="Finally (connector)">마지막으로</span> 저녁에 <span className="bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded cursor-help border border-blue-500/30" title="Sometimes (frequency)">가끔</span> 운동해요.
                </p>
                <p className="text-xs text-zinc-400 leading-normal font-sans italic">"{coreData.example_routines[0].en}"</p>
              </div>
            </div>
          )}

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

      {/* Step 6: Activity 1A – Frequency cards & micro-MCQs */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Frequency Card Flips</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of {totalSteps}</span>
          </div>

          <p className="text-xs text-zinc-400">
            Select a card to play its pronunciation and flip it. Then answer the MCQ drills.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {coreData?.frequency_words?.map((fw: any) => {
              const isFlipped = flippedWordId === fw.id;
              return (
                <div
                  key={fw.id}
                  onClick={() => {
                    setFlippedWordId(isFlipped ? null : fw.id);
                    playAudio(fw.korean);
                  }}
                  className={`glass-panel p-3.5 rounded-xl border text-center transition cursor-pointer flex flex-col justify-between h-24 ${
                    isFlipped ? "border-brand-500 bg-brand-500/5 shadow-md" : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800"
                  }`}
                >
                  {!isFlipped ? (
                    <div className="my-auto space-y-1">
                      <div className="text-base font-black text-white font-korean">{fw.korean}</div>
                      <div className="text-[9px] text-zinc-500 font-mono">({fw.romanization})</div>
                    </div>
                  ) : (
                    <div className="animate-fade-in text-left my-auto space-y-0.5">
                      <span className="text-xs font-black text-brand-400 capitalize">{fw.english}</span>
                      <p className="text-[8px] text-zinc-500 leading-normal">{fw.note}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Micro MCQs */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-left">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Frequency Drill {freqIdx + 1} of 2</h4>
            <p className="text-xs text-zinc-300 font-bold">
              {freqIdx === 0 
                ? "You always drink coffee in the morning. Which Korean word fits?" 
                : "Which Korean word would you use if you 'rarely' go to the gym?"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {["always", "often", "sometimes", "rarely", "never"].slice(freqIdx === 0 ? 0 : 2, freqIdx === 0 ? 3 : 5).map(opt => {
                const buttonLabel = opt === "always" ? "항상" : opt === "often" ? "자주" : opt === "sometimes" ? "가끔" : opt === "rarely" ? "별로" : "전혀";
                return (
                  <button
                    key={opt}
                    onClick={() => handleCheckFreqMCQ(opt)}
                    disabled={freqChecked}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                      freqSelectedOpt === opt
                        ? freqCorrect
                          ? "border-accent-teal bg-accent-teal/15 text-white"
                          : "border-red-500 bg-red-500/10 text-white"
                        : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                    } ${freqChecked && opt === (freqIdx === 0 ? "always" : "rarely") ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                  >
                    {buttonLabel} ({opt})
                  </button>
                );
              })}
            </div>

            {freqChecked && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setFreqChecked(false);
                    setFreqSelectedOpt(null);
                    setFreqCorrect(null);
                    if (freqIdx === 0) setFreqIdx(1);
                    else setStep(7);
                  }}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {freqIdx === 0 ? "Next MCQ" : "Continue to Sequence Connectors"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 7: Activity 2A – Sequence word cards */}
      {step === 7 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2A – Sequence Connectors</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of {totalSteps}</span>
          </div>

          <p className="text-xs text-zinc-400">
            Select a card to play its pronunciation and flip it to check its position note.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto w-full">
            {coreData?.sequence_words?.map((sw: any) => {
              const isFlipped = flippedWordId === sw.id;
              return (
                <div
                  key={sw.id}
                  onClick={() => {
                    setFlippedWordId(isFlipped ? null : sw.id);
                    playAudio(sw.korean);
                  }}
                  className={`glass-panel p-4 rounded-xl border text-center transition cursor-pointer flex flex-col justify-between h-28 ${
                    isFlipped ? "border-brand-500 bg-brand-500/5 shadow-md" : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800"
                  }`}
                >
                  {!isFlipped ? (
                    <div className="my-auto space-y-1">
                      <div className="text-base font-black text-white font-korean">{sw.korean}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Connector</div>
                    </div>
                  ) : (
                    <div className="animate-fade-in text-left my-auto space-y-0.5">
                      <span className="text-xs font-black text-brand-400 capitalize">{sw.english}</span>
                      <p className="text-[8px] text-zinc-500 leading-normal">{sw.note}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 8: Activity 2B – Tagging sequence order */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2B – Sequence Tagging</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 8 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-left">
            <span className="text-[9px] text-zinc-550 uppercase tracking-widest font-black block text-center">Drag / Select connectors to match chronological steps</span>
            
            <div className="space-y-3 font-korean">
              {[
                { ko: "아침에 일찍 일어나요. (Wake up early.)", idx: 0 },
                { ko: "학교에 가요. (Go to school.)", idx: 1 },
                { ko: "오후에 친구를 만나요. (Meet friends.)", idx: 2 },
                { ko: "저녁에 운동해요. (Exercise at night.)", idx: 3 }
              ].map(item => (
                <div key={item.idx} className="flex items-center gap-3 p-3 bg-zinc-950 rounded-xl border border-white/5">
                  <select
                    value={tagPositions[item.idx]}
                    disabled={tagChecked}
                    onChange={(e) => handleSelectTag(item.idx, e.target.value)}
                    className="bg-zinc-900 text-xs p-2 rounded border border-white/10 text-white font-sans focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Choose Tag --</option>
                    <option value="먼저">먼저 (First)</option>
                    <option value="그리고">그리고 (And then)</option>
                    <option value="그 다음에">그 다음에 (After that)</option>
                    <option value="마지막으로">마지막으로 (Finally)</option>
                  </select>
                  <span className="text-xs text-zinc-300 font-extrabold">{item.ko}</span>
                </div>
              ))}
            </div>

            {tagChecked && (
              <div className={`p-3 rounded-xl border text-xs text-left leading-normal ${
                tagCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
              }`}>
                <p className="font-extrabold">{tagCorrect ? "Sequence Tagging correct!" : "Incorrect order."}</p>
                <p className="text-[10px] mt-0.5 text-zinc-400">Remember: 먼저 starts the sequence, 그리고/그 다음에 handle middle connectors, and 마지막으로 concludes it.</p>
              </div>
            )}

            <div className="flex justify-end pt-1">
              {!tagChecked ? (
                <button
                  onClick={handleCheckTagging}
                  disabled={Object.values(tagPositions).some(v => v === "")}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Verify Tags Order
                </button>
              ) : (
                <button
                  onClick={() => {
                    setTagChecked(false);
                    setTagPositions({ 0: "", 1: "", 2: "", 3: "" });
                    setTagCorrect(null);
                  }}
                  className="bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Reset Tagging Solver
                </button>
              )}
            </div>
          </div>

          {/* Reflection MCQ */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-left">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Sequence Reflection</h4>
            <p className="text-xs text-zinc-300 font-bold">Which connector marks the final action of a daily routine?</p>
            <div className="grid grid-cols-3 gap-2">
              {["먼저", "그리고", "마지막으로"].map(opt => (
                <button
                  key={opt}
                  onClick={() => handleCheckTagReflection(opt)}
                  disabled={tagReflectionChecked}
                  className={`p-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                    tagReflectionSelected === opt
                      ? opt === "마지막으로"
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-red-500 bg-red-500/10 text-white"
                      : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                  } ${tagReflectionChecked && opt === "마지막으로" ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {tagReflectionChecked && (
              <p className="text-[10px] text-zinc-550 leading-snug">
                Correct! 마지막으로 translates to 'lastly' or 'finally' to conclude a sequence.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 9: Activity 3A – Routine paragraphs listening summaries */}
      {step === 9 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 3 – Routine Comprehension</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 9 of {totalSteps}</span>
          </div>

          {listeningItems.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-4 text-center">
                <p className="text-xs text-zinc-300">Listen to the spoken daily routine:</p>
                
                <div className="flex justify-center">
                  <button onClick={() => playAudio(listeningItems[listeningIdx]?.audio_text)} className="p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 rounded-full transition flex items-center justify-center cursor-pointer shadow-md"><Volume2 className="w-6 h-6" /></button>
                </div>

                <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                  {listeningItems[listeningIdx]?.summary_options.map((opt: any) => (
                    <button
                      key={opt.id}
                      onClick={() => !listeningChecked && setSelectedSummaryId(opt.id)}
                      disabled={listeningChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
                        selectedSummaryId === opt.id
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      } ${listeningChecked && opt.id === listeningItems[listeningIdx]?.correct_summary_id ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${listeningChecked && selectedSummaryId === opt.id && opt.id !== listeningItems[listeningIdx]?.correct_summary_id ? "border-red-500 bg-red-500/10 text-white" : ""}`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>

                {listeningChecked && (
                  <div className={`p-3 rounded-xl border text-xs text-left ${
                    listeningCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    {listeningCorrect ? "Correct summary match!" : "Incorrect summary option chosen."}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  {!listeningChecked ? (
                    <button
                      onClick={handleCheckListeningSummary}
                      disabled={!selectedSummaryId}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Verify Summary Choice
                    </button>
                  ) : (
                    <p className="text-[10px] text-zinc-500">Summary verified. Complete the details questions below.</p>
                  )}
                </div>
              </div>

              {/* Part B: Detail questions */}
              {listeningChecked && (
                <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-4 text-left animate-fade-in">
                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block text-center">Part B: Detail Checks</span>
                  
                  {listeningItems[listeningIdx]?.detail_questions.map((q: any) => (
                    <div key={q.id} className="space-y-2">
                      <p className="text-xs text-white font-bold">{q.question}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {q.options.map((opt: string) => (
                          <button
                            key={opt}
                            onClick={() => !detailChecked && setDetailAnswers(prev => ({ ...prev, [q.id]: opt }))}
                            disabled={detailChecked}
                            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                              detailAnswers[q.id] === opt
                                ? "border-brand-500 bg-brand-500/10 text-white"
                                : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                            } ${detailChecked && opt === q.correct ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${
                              detailChecked && detailAnswers[q.id] === opt && !detailCorrect[q.id] ? "border-red-500 bg-red-500/10 text-white" : ""
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {detailChecked && (
                    <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-center text-zinc-400">
                      All details matches validated.
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
                            setStep(10); // Move to builder step
                          }
                        }}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        {listeningIdx < listeningItems.length - 1 ? "Next Audio Dialogue" : "Continue to Routine Builder"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 10: Activity 4A/4B – Extended routines timeline builder & speaking practice */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 4 – Build & Record Timeline</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 10 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-left">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">A2 Chronological Routine Builder</h3>

            <div className="space-y-3">
              {builderSlots.map((slot, idx) => (
                <div key={slot.slot_name} className="p-3.5 bg-zinc-950 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">{slot.slot_name} Slot</span>
                    {idx > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] text-zinc-500 uppercase">Connector</span>
                        <select
                          value={slot.connector}
                          onChange={(e) => handleUpdateSlot(idx, "connector", e.target.value)}
                          className="bg-zinc-900 p-1 rounded border border-white/10 text-[10px] text-white focus:outline-none"
                        >
                          <option value="그리고">그리고 (and/then)</option>
                          <option value="그 다음에">그 다음에 (then/after that)</option>
                          <option value="마지막으로">마지막으로 (lastly)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-550 uppercase font-black block">Frequency</label>
                      <select
                        value={slot.frequency}
                        onChange={(e) => handleUpdateSlot(idx, "frequency", e.target.value)}
                        className="w-full bg-zinc-900 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                      >
                        <option value="항상">항상 (always)</option>
                        <option value="자주">자주 (often)</option>
                        <option value="보통">보통 (usually)</option>
                        <option value="가끔">가끔 (sometimes)</option>
                        <option value="전혀">전혀 (never)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-550 uppercase font-black block">Verb Action</label>
                      <select
                        value={slot.verb}
                        onChange={(e) => handleUpdateSlot(idx, "verb", e.target.value)}
                        className="w-full bg-zinc-900 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                      >
                        {builderTemplates?.verbs?.map((v: any) => (
                          <option key={v.ko} value={v.ko}>{v.ko} ({v.en})</option>
                        )) || (
                          <>
                            <option value="일어나요">일어나요 (wake up)</option>
                            <option value="공부해요">공부해요 (study)</option>
                            <option value="운동해요">운동해요 (exercise)</option>
                            <option value="자요">자요 (sleep)</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-1">
              <button
                onClick={handleBuildParagraph}
                disabled={building}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition cursor-pointer"
              >
                {building ? "Assembling Paragraph..." : "Assemble A2 Routine"}
              </button>
            </div>

            {builtParagraph && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 space-y-3 animate-fade-in text-center">
                <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Generated Timeline Paragraph</span>
                <p className="text-base font-black text-white font-korean leading-relaxed">{builtParagraph.final_korean_text}</p>
                
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => playAudio(builtParagraph.final_korean_text)}
                    className="p-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-full border border-brand-500/20 transition cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleSaveParagraph}
                    disabled={savingParagraph || paragraphSaved}
                    className="bg-accent-teal hover:bg-accent-teal/95 disabled:opacity-50 text-zinc-950 font-black py-1.5 px-4 rounded-lg text-xs transition cursor-pointer"
                  >
                    {savingParagraph ? "Saving..." : paragraphSaved ? "Saved A2 Routine!" : "Save Paragraph"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Part B: Read Aloud ASR Speaking Evaluation */}
          {builtParagraph && (
            <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-center animate-fade-in">
              <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">A2 Speaking Pronunciation Verification</h3>
              <p className="text-xs text-zinc-400">Record yourself reading your longer routine paragraph:</p>

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
                  title={rec.recording ? "Stop Recording" : "Click to Record"}
                >
                  {rec.recording ? <MicOff className="w-8 h-8 animate-pulse" /> : <Mic className="w-8 h-8" />}
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
                <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 text-left text-xs space-y-1.5 animate-fade-in">
                  <p className="font-black text-white">Score: {speakingResult.similarity_score?.toFixed(0) || speakingResult.score || 0}%</p>
                  <p className="text-zinc-350">Heard: "{speakingResult.recognized_text || speakingResult.transcription || "..."}"</p>
                  {speakingResult.feedback && <p className="text-zinc-500">{speakingResult.feedback}</p>}
                </div>
              )}

              {/* Reflection MCQ */}
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 space-y-3 text-left">
                <p className="text-xs text-zinc-300">Which parts of longer routines did you find hardest to pronounce?</p>
                <div className="flex gap-2">
                  {["the times", "the verbs", "the connectors"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleCheckSpeakReflection(opt)}
                      disabled={speakReflectionChecked}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
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
                    Understood! Practice makes perfect. Keep repeating sequences like "그 다음에" to smooth out transitions.
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
              <span>Mini-Quiz: A2 Routines Check</span>
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
                      {["항상", "자주", "보통", "가끔", "별로", "전혀", "먼저", "그리고", "그 다음에", "마지막으로", "일어나요", "공부해요", "운동해요", "자요"].map(ch => (
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

      {/* Step 12: Homework & completion summary */}
      {step === 12 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0 animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Level 3: Phase 1 Completed successfully! 🎓✨</h2>
            <p className="text-zinc-400 text-xs">You scored {quizScore}% on your longer routines check! You earned **150 XP**.</p>
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
              <h4 className="text-xs font-bold text-white">Extended routine discussion with Gwan-Sik</h4>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Starts an interactive chat room where Gwan-Sik asks about your daily timeline sequence in detail, highlighting and summarizing frequency adverbs you use.
              </p>
            </div>

            {tutorSession ? (
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 text-left space-y-2">
                <span className="text-[9px] font-black text-brand-400 uppercase tracking-wider block">Extended Routine Session Active</span>
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
                <span>Practice longer routines with your AI tutor</span>
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
            <span>Finish Phase 1 & Earn XP</span>
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
                
                // Find matching blueprint question index
                const bpIdx = (quizBlueprint || []).findIndex((q: any) => q.correct_answer === m || q.question === m || q.correctId === m);
                if (bpIdx !== -1) {
                  if (typeof setQuizIdx === "function") setQuizIdx(bpIdx);
                if (typeof setQuizChecked === "function") setQuizChecked(false);
                if (typeof setQuizCorrect === "function") setQuizCorrect(null);
                if (typeof setQuizScore === "function") setQuizScore(null);
                if (typeof setQuizSelectedOpt === "function") setQuizSelectedOpt(null);
                if (typeof setQuizWritingAns === "function") setQuizWritingAns("");
                }

                // Remove from mistakes list
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
