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

// Audio recorder utility hook
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

interface Course2Phase1GreetingsWizardProps {
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

export default function Course2Phase1GreetingsWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course2Phase1GreetingsWizardProps) {
  const phaseNum = 1;
  const getStepMaxXP = (sNum: number) => {
    try {
      return (xpAudit as any)["2"]?.[phaseNum.toString()]?.steps?.[sNum.toString()]?.max_xp ?? 35;
    } catch (e) {
      return 35;
    }
  };
  const getStepXP = (sNum: number) => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(`hangeulai_c2p${phaseNum}_s${sNum}_earned_xp`) || "0", 10);
  };

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c2p1_step");
    const savedMax = localStorage.getItem("hangeulai_c2p1_max_step");
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
      localStorage.setItem("hangeulai_c2p1_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 11;

  // Persist step to localStorage for refresh resilience
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c1p1_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 11) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c1p1_step", String(step));
  }, [step]);

  // Data loaded from backend
  const [metadata, setMetadata] = useState<any>(null);
  const [expressions, setExpressions] = useState<any[]>([]);
  const [listeningItems, setListeningItems] = useState<any[]>([]);
  const [gapfillItems, setGapfillItems] = useState<any[]>([]);
  const [contextItems, setContextItems] = useState<any[]>([]);
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);

  // Card flipping tracking
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  // Concept Micro-questions states
  const [cSelected, setCSelected] = useState<string | null>(null);
  const [cChecked, setCChecked] = useState(false);
  const [cCorrect, setCCorrect] = useState<boolean | null>(null);

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
  const conceptQuestions: Record<number, MicroQuestion> = {
    2: {
      question: "If you only know 2–3 Korean phrases, which is more important to learn first?",
      options: [
        { id: "A", text: "Greetings and thanks" },
        { id: "B", text: "Future tense grammar" }
      ],
      correctId: "A",
      explanation: "Greetings are your first impression: even with zero extra grammar, they make you look friendly and respectful."
    },
    3: {
      question: "Which is safer to use with your teacher?",
      options: [
        { id: "A", text: "안녕" },
        { id: "B", text: "안녕하세요" }
      ],
      correctId: "B",
      explanation: "안녕하세요 is standard polite (존댓말), suitable for teachers, strangers, and adults."
    },
    4: {
      question: "You accidentally bump into someone on the street. Which phrase fits best?",
      options: [
        { id: "A", text: "안녕하세요" },
        { id: "B", text: "죄송합니다" },
        { id: "C", text: "안녕히 계세요" }
      ],
      correctId: "B",
      explanation: "죄송합니다 means 'I'm sorry / Excuse me' and is the standard polite way to apologize."
    },
    5: {
      question: "You leave a café while the staff stays inside. Which goodbye is correct?",
      options: [
        { id: "A", text: "안녕히 계세요" },
        { id: "B", text: "안녕히 가세요" }
      ],
      correctId: "A",
      explanation: "Say 안녕히 계세요 ('Please stay well') when you leave and the other person remains."
    },
    6: {
      question: "Your teacher gives you a book. What do you say?",
      options: [
        { id: "A", text: "죄송합니다" },
        { id: "B", text: "감사합니다" }
      ],
      correctId: "B",
      explanation: "감사합니다 is standard polite for 'Thank you'."
    }
  };

  // Activity 7: Listening states
  const [listeningIdx, setListeningIdx] = useState(0);
  const [selectedListeningOpt, setSelectedListeningOpt] = useState<string | null>(null);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningCorrect, setListeningCorrect] = useState<boolean | null>(null);

  // Activity 8: Matching states
  const [matchingPairs, setMatchingPairs] = useState<any[]>([]);
  const [selectedMatchKo, setSelectedMatchKo] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]); // list of matched korean words
  const [matchingFailedId, setMatchingFailedId] = useState<string | null>(null);

  // Activity 9: Gap-fill states
  const [gapfillIdx, setGapfillIdx] = useState(0);
  const [selectedGapfillOpt, setSelectedGapfillOpt] = useState<string | null>(null);
  const [gapfillChecked, setGapfillChecked] = useState(false);
  const [gapfillCorrect, setGapfillCorrect] = useState<boolean | null>(null);

  // Activity 10: Context states
  const [contextIdx, setContextIdx] = useState(0);
  const [selectedContextOpt, setSelectedContextOpt] = useState<string | null>(null);
  const [contextChecked, setContextChecked] = useState(false);
  const [contextCorrect, setContextCorrect] = useState<boolean | null>(null);

  // Quiz states
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<string>("");
  const [quizAnswerSelected, setQuizAnswerSelected] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Bonus speaking quiz state
  const rec = useRecorder();
  const [speakingTranscribing, setSpeakingTranscribing] = useState(false);
  const [speakingResult, setSpeakingResult] = useState<any>(null);

  // Homework check state
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Tutor session mode launch state
  const [tutorSession, setTutorSession] = useState<any>(null);
  const [loadingTutor, setLoadingTutor] = useState(false);

  // --- Start Progress State Preservation ---
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hangeulai_c2p1_progress_state");
        if (saved) {
          const state = JSON.parse(saved);
            if (state.step !== undefined) setStep(state.step);
            if (state.maxStep !== undefined) setMaxStep(state.maxStep);
            if (state.contextItems !== undefined) setContextItems(state.contextItems);
            if (state.cSelected !== undefined) setCSelected(state.cSelected);
            if (state.cChecked !== undefined) setCChecked(state.cChecked);
            if (state.cCorrect !== undefined) setCCorrect(state.cCorrect);
            if (state.answeredConcepts !== undefined) setAnsweredConcepts(state.answeredConcepts);
            if (state.listeningIdx !== undefined) setListeningIdx(state.listeningIdx);
            if (state.selectedListeningOpt !== undefined) setSelectedListeningOpt(state.selectedListeningOpt);
            if (state.listeningChecked !== undefined) setListeningChecked(state.listeningChecked);
            if (state.listeningCorrect !== undefined) setListeningCorrect(state.listeningCorrect);
            if (state.selectedMatchKo !== undefined) setSelectedMatchKo(state.selectedMatchKo);
            if (state.gapfillIdx !== undefined) setGapfillIdx(state.gapfillIdx);
            if (state.selectedGapfillOpt !== undefined) setSelectedGapfillOpt(state.selectedGapfillOpt);
            if (state.gapfillChecked !== undefined) setGapfillChecked(state.gapfillChecked);
            if (state.gapfillCorrect !== undefined) setGapfillCorrect(state.gapfillCorrect);
            if (state.contextIdx !== undefined) setContextIdx(state.contextIdx);
            if (state.selectedContextOpt !== undefined) setSelectedContextOpt(state.selectedContextOpt);
            if (state.contextChecked !== undefined) setContextChecked(state.contextChecked);
            if (state.contextCorrect !== undefined) setContextCorrect(state.contextCorrect);
            if (state.quizIdx !== undefined) setQuizIdx(state.quizIdx);
            if (state.quizAnswer !== undefined) setQuizAnswer(state.quizAnswer);
            if (state.quizAnswerSelected !== undefined) setQuizAnswerSelected(state.quizAnswerSelected);
            if (state.quizChecked !== undefined) setQuizChecked(state.quizChecked);
            if (state.quizCorrect !== undefined) setQuizCorrect(state.quizCorrect);
            if (state.quizMistakes !== undefined) setQuizMistakes(state.quizMistakes);
            if (state.quizScore !== undefined) setQuizScore(state.quizScore);
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
            contextItems,
            cSelected,
            cChecked,
            cCorrect,
            answeredConcepts,
            listeningIdx,
            selectedListeningOpt,
            listeningChecked,
            listeningCorrect,
            selectedMatchKo,
            gapfillIdx,
            selectedGapfillOpt,
            gapfillChecked,
            gapfillCorrect,
            contextIdx,
            selectedContextOpt,
            contextChecked,
            contextCorrect,
            quizIdx,
            quizAnswer,
            quizAnswerSelected,
            quizChecked,
            quizCorrect,
            quizMistakes,
            quizScore,
            completedHomework
        };
        localStorage.setItem("hangeulai_c2p1_progress_state", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save progress state:", e);
      }
    }
  }, [step, maxStep, contextItems, cSelected, cChecked, cCorrect, answeredConcepts, listeningIdx, selectedListeningOpt, listeningChecked, listeningCorrect, selectedMatchKo, gapfillIdx, selectedGapfillOpt, gapfillChecked, gapfillCorrect, contextIdx, selectedContextOpt, contextChecked, contextCorrect, quizIdx, quizAnswer, quizAnswerSelected, quizChecked, quizCorrect, quizMistakes, quizScore, completedHomework]);
  // --- End Progress State Preservation ---


  // Sound triggers
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

  // Lazy load curriculum items based on steps
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/lessons/phases/korean1/1/metadata");
          setMetadata(res);
        } else if (step === 2 && expressions.length === 0) {
          const res = await apiJson("/lessons/phases/korean1/1/expressions");
          setExpressions(res);
        } else if (step === 7 && listeningItems.length === 0) {
          const res_lis = await apiJson("/lessons/practice/greetings/listening");
          setListeningItems(res_lis.items || []);
        } else if (step === 8 && matchingPairs.length === 0) {
          const rawMatching = [
            { ko: "안녕하세요", en: "Hello" },
            { ko: "감사합니다", en: "Thank you" },
            { ko: "죄송합니다", en: "I'm sorry" },
            { ko: "안녕히 계세요", en: "Goodbye (you leave)" },
            { ko: "안녕히 가세요", en: "Goodbye (they leave)" }
          ];
          setMatchingPairs(rawMatching);
        } else if (step === 9 && gapfillItems.length === 0) {
          const res_gf = await apiJson("/lessons/practice/greetings/gapfill");
          setGapfillItems(res_gf || []);
        } else if (step === 10 && contextItems.length === 0) {
          const res_ctx = await apiJson("/lessons/practice/greetings/context");
          setContextItems(res_ctx || []);
        } else if (step === 11 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/lessons/quiz/korean1/phase-1/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean1/1/homework");
          setHomeworkItems(res_hw || []);
        }
      } catch (err) {
        console.error("Failed to load step data:", err);
      }
    };
    load();
  }, [step]);

  // Audio Playback
  const playAudio = (koreanText: string) => {
    speakWord(koreanText);
  };

  // Submit concept micro-question
  const handleCheckConcept = (selectedId: string) => {
    if (cChecked) return;
    const currentQuestion = conceptQuestions[step];
    if (!currentQuestion) return;

    setCSelected(selectedId);
    const isCorrect = selectedId === currentQuestion.correctId;
    setCChecked(true);
    setCCorrect(isCorrect);
    setAnsweredConcepts(prev => ({ ...prev, [step]: { selected: selectedId, correct: isCorrect } }));
    
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
  };

  // Submit listening attempt
  const handleCheckListening = async () => {
    const current = listeningItems[listeningIdx];
    if (!current || !selectedListeningOpt) return;

    try {
      const res = await apiJson("/lessons/practice/greetings/listening/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_option_id: selectedListeningOpt,
          time_taken_ms: 1000,
        }),
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

  // Match columns select handler
  const handleMatchClick = (ko: string, en: string) => {
    if (!selectedMatchKo) {
      setSelectedMatchKo(ko);
    } else {
      const pair = matchingPairs.find(p => p.ko === selectedMatchKo);
      if (pair && pair.en === en) {
        setMatchedPairs(prev => [...prev, selectedMatchKo]);
        playCorrectSound();
        setMatchingFailedId(null);
      } else {
        setMatchingFailedId(en);
        playWrongSound();
        setTimeout(() => setMatchingFailedId(null), 1000);
      }
      setSelectedMatchKo(null);
    }
  };

  // Submit gapfill attempt
  const handleCheckGapfill = async () => {
    const current = gapfillItems[gapfillIdx];
    if (!current || !selectedGapfillOpt) return;

    try {
      const res = await apiJson("/lessons/practice/greetings/gapfill/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_option_id: selectedGapfillOpt,
          time_taken_ms: 1000,
        }),
      });
      setGapfillChecked(true);
      setGapfillCorrect(res.correct);
      if (res.correct) {
        playCorrectSound();
      } else {
        playWrongSound();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit context attempt
  const handleCheckContext = async () => {
    const current = contextItems[contextIdx];
    if (!current || !selectedContextOpt) return;

    try {
      const res = await apiJson("/lessons/practice/greetings/context/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_option_id: selectedContextOpt,
          time_taken_ms: 1000,
        }),
      });
      setContextChecked(true);
      setContextCorrect(res.correct);
      if (res.correct) {
        playCorrectSound();
      } else {
        playWrongSound();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Quiz Question
  const handleCheckQuiz = () => {
    const current = quizBlueprint[quizIdx];
    if (!current) return;

    let isCorrect = false;

    if (current.type === "listening" || current.type === "context") {
      isCorrect = quizAnswerSelected === current.correct_answer;
    } else {
      isCorrect = quizAnswer.trim().toLowerCase() === current.correct_answer.trim().toLowerCase();
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
      setQuizAnswer("");
      setQuizAnswerSelected(null);
      setQuizChecked(false);
      setQuizCorrect(null);
      setSpeakingResult(null);
    } else {
      setFinishingQuiz(true);
      try {
        const correctCount = quizBlueprint.length - quizMistakes.length;
        const score = Math.round((correctCount / quizBlueprint.length) * 100);
        await apiJson("/lessons/quiz/korean1/phase-1/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes,
          }),
        });
        setQuizScore(score);
        setStep(11); // Last slide summary
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  // Speaking Check (Bonus microphone evaluation)
  const handleSpeechEvaluate = async () => {
    if (!rec.audioBlob) return;
    setSpeakingTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("target_text", "안녕하세요");
      fd.append("audio_file", rec.audioBlob, "recording.wav");
      const res = await apiForm("/speech/shadow", fd);
      setSpeakingResult(res);
      
      if (res.similarity_score >= 60) {
        setQuizAnswerSelected("안녕하세요");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSpeakingTranscribing(false);
    }
  };

  // Launch AI tutor greetings mode
  const handleLaunchTutor = async () => {
    setLoadingTutor(true);
    try {
      const res = await apiJson("/lessons/tutor/teach/greetings-mode", { method: "POST" });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

  // Homework check logging
  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/lessons/phases/korean1/1/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

    const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "Screen C1 – Why greetings matter in Korean" },
    { num: 3, label: "Screen C2 – Politeness basics: polite vs casual" },
    { num: 4, label: "Screen C3 – Core greeting set (forms and meanings)" },
    { num: 5, label: "Screen C4 – Goodbye: who is moving where?" },
    { num: 6, label: "Screen C5 – “Thank you” vs “Sorry”" },
    { num: 7, label: "Activity 1 – Listening & sound comprehension drills" },
    { num: 8, label: "Activity 2 – Polite expression matching game" },
    { num: 9, label: "Activity 3 – Gap-fill spelling production drills" },
    { num: 10, label: "Activity 4 – Context-appropriate phrase challenges" },
    { num: 11, label: "Activity 5 – Graduating checkpoint mini-quiz" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 2,
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
              <span>{activeLesson?.title || "Greetings & Polite Basics"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: Polite Language</p>
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

      {/* Screen 1: Welcome/Overview */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight">Korean 1.1</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Greetings & Polite Basics</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Say hello, thank you, and goodbye in natural Korean."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Greet people politely in Korean",
                "Say thank you, sorry, and excuse me",
                "Respond with yes/no in simple daily situations",
                "Choose appropriate goodbye expressions based on context"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 15} minutes</p>
            <p><strong>📋 Prerequisites:</strong> {metadata?.prerequisites || "Hangeul Vowels & Consonants"}</p>
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

      {/* Screen 2: C1 - Why greetings matter in Korean */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Why Greetings Matter in Korean</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            Greetings are your first impression: even with zero extra grammar, you can be polite and friendly.
            Koreans pay close attention to whether you use polite endings (‑요 / 합니다) and how you deliver your basic greetings.
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Concept check</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[2].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[2].options.map(opt => (
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
                  } ${cChecked && opt.id === conceptQuestions[2].correctId ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {cChecked && (
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{conceptQuestions[2].explanation}</p>
            )}
          </div>
        </div>
      )}

      {/* Screen 3: C2 - Politeness basics: polite vs casual */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Politeness Basics: Polite vs Casual</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            Korean has different politeness levels. In this course, you’ll mostly learn standard polite (‑요 / 합니다).
            Always use polite Korean with strangers, teachers, and service staff to ensure you are safe and respectful.
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Concept check</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[3].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[3].options.map(opt => (
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
                  } ${cChecked && opt.id === conceptQuestions[3].correctId ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {cChecked && (
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{conceptQuestions[3].explanation}</p>
            )}
          </div>
        </div>
      )}

      {/* Screen 4: C3 - Core greeting set */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Core Greeting Set</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {expressions.slice(0, 5).map((exp) => (
              <div 
                key={exp.id} 
                onClick={() => playAudio(exp.korean)}
                className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl cursor-pointer hover:bg-zinc-800 transition text-center space-y-2"
              >
                <div className="text-xl font-bold text-white font-korean">{exp.korean}</div>
                <div className="text-xs text-zinc-400">{exp.english}</div>
                <div className="text-[10px] text-zinc-500 font-mono italic">({exp.romanization})</div>
              </div>
            ))}
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Concept check</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[4].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[4].options.map(opt => (
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
                  } ${cChecked && opt.id === conceptQuestions[4].correctId ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {cChecked && (
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{conceptQuestions[4].explanation}</p>
            )}
          </div>
        </div>
      )}

      {/* Screen 5: C4 - Goodbye: who stays, who goes? */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Goodbye: Who stays, who goes?</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            If you are leaving and the other person stays: say **안녕히 계세요** ("Please stay well").<br/>
            If they are leaving and you stay: say **안녕히 가세요** ("Please go well").
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Concept check</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[5].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[5].options.map(opt => (
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
                  } ${cChecked && opt.id === conceptQuestions[5].correctId ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {cChecked && (
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{conceptQuestions[5].explanation}</p>
            )}
          </div>
        </div>
      )}

      {/* Screen 6: C5 - Thank you vs Sorry */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Thank You vs Sorry</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            **감사합니다** is used for expressing gratitude politely.<br/>
            **죄송합니다** is for apologies and saying "sorry/excuse me" in polite situations (like bumping into someone).
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Concept check</h4>
            <p className="text-xs text-zinc-300 font-bold">{conceptQuestions[6].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {conceptQuestions[6].options.map(opt => (
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
                  } ${cChecked && opt.id === conceptQuestions[6].correctId ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {cChecked && (
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{conceptQuestions[6].explanation}</p>
            )}
          </div>
        </div>
      )}

      {/* Screen 7: Activity 1: Listening & Sound Comprehension */}
      {step === 7 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Listening & Sound Comprehension</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of {totalSteps}</span>
          </div>

          <div className="space-y-4 bg-zinc-900/30 p-5 rounded-2xl border border-white/5">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Hear spoken phrase → Choose meaning</h3>
            
            {listeningItems.length === 0 ? (
              <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
            ) : (
              <div className="space-y-4 max-w-md mx-auto w-full text-center">
                <button 
                  onClick={() => playAudio(listeningItems[listeningIdx]?.korean)}
                  className="p-5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-full mx-auto transition flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer animate-pulse"
                >
                  <Volume2 className="w-8 h-8" />
                </button>

                <div className="grid grid-cols-1 gap-2 pt-2">
                  {listeningItems[listeningIdx]?.options.map((opt: any) => (
                    <button
                      key={opt.id}
                      onClick={() => !listeningChecked && setSelectedListeningOpt(opt.id)}
                      disabled={listeningChecked}
                      className={`p-3 rounded-xl font-semibold text-xs border transition ${
                        selectedListeningOpt === opt.id
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                      } ${listeningChecked && opt.id === listeningItems[listeningIdx]?.correct_option_id ? "border-accent-teal bg-accent-teal/10 text-white" : ""}`}
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
                    <p>Korean: <strong className="text-white text-sm font-korean">{listeningItems[listeningIdx]?.korean}</strong> ({listeningItems[listeningIdx]?.romanization})</p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  {!listeningChecked ? (
                    <button
                      onClick={handleCheckListening}
                      disabled={!selectedListeningOpt}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
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
                      className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Next Audio Item
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen 8: Activity 2: Matching game */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Polite expression matching game</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 8 of {totalSteps}</span>
          </div>

          <div className="space-y-4 bg-zinc-900/30 p-5 rounded-2xl border border-white/5">
            <p className="text-[10px] text-zinc-500 font-bold">Tap a Korean word on the left, then its English meaning on the right.</p>

            <div className="grid grid-cols-2 gap-8 pt-2">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Korean</span>
                {matchingPairs.map((pair) => {
                  const isMatched = matchedPairs.includes(pair.ko);
                  const isSelected = selectedMatchKo === pair.ko;
                  return (
                    <button
                      key={pair.ko}
                      disabled={isMatched}
                      onClick={() => setSelectedMatchKo(pair.ko)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold font-korean transition ${
                        isMatched 
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 line-through" 
                          : isSelected 
                            ? "border-brand-500 bg-brand-500/20 text-white font-black"
                            : "border-white/5 bg-zinc-950/60 hover:bg-zinc-900 text-zinc-300"
                      }`}
                    >
                      {pair.ko}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">English Meaning</span>
                {matchingPairs.map((pair) => {
                  const isMatched = matchedPairs.includes(pair.ko);
                  const isFailed = matchingFailedId === pair.en;
                  return (
                    <button
                      key={pair.en}
                      disabled={isMatched || !selectedMatchKo}
                      onClick={() => handleMatchClick(pair.ko, pair.en)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs transition ${
                        isMatched 
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 line-through" 
                          : isFailed
                            ? "border-red-500 bg-red-500/15 text-red-400"
                            : "border-white/5 bg-zinc-950/60 hover:bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      {pair.en}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen 9: Activity 3: Gap-fill spelling drills */}
      {step === 9 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 3 – Gap-fill spelling production drills</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 9 of {totalSteps}</span>
          </div>

          <div className="space-y-4 bg-zinc-900/30 p-5 rounded-2xl border border-white/5">
            {gapfillItems.length === 0 ? (
              <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
            ) : (
              <div className="space-y-4 w-full text-center">
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs">
                  <span className="text-[10px] text-zinc-500 block mb-1">Scenario Description:</span>
                  <p className="font-semibold text-zinc-300">{gapfillItems[gapfillIdx]?.prompt}</p>
                </div>

                <div className="text-2xl font-black text-white tracking-widest font-korean py-2">
                  {gapfillItems[gapfillIdx]?.koreanTemplate.replace("[ ]", selectedGapfillOpt ? gapfillItems[gapfillIdx]?.options.find((o: any) => o.id === selectedGapfillOpt)?.text : "___")}
                </div>

                <div className="flex justify-center gap-2">
                  {gapfillItems[gapfillIdx]?.options.map((opt: any) => (
                    <button
                      key={opt.id}
                      onClick={() => !gapfillChecked && setSelectedGapfillOpt(opt.id)}
                      disabled={gapfillChecked}
                      className={`px-4 py-2 rounded-xl text-sm font-black border transition ${
                        selectedGapfillOpt === opt.id
                          ? "border-brand-500 bg-brand-500/10 text-white font-korean"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10 font-korean"
                      }`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>

                {gapfillChecked && (
                  <div className={`p-4 rounded-xl border text-xs text-left space-y-1.5 ${
                    gapfillCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    <p className="font-extrabold">{gapfillCorrect ? "Correct!" : "Incorrect."}</p>
                    <p><strong>Explanation:</strong> {gapfillItems[gapfillIdx]?.explanation}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  {!gapfillChecked ? (
                    <button
                      onClick={handleCheckGapfill}
                      disabled={!selectedGapfillOpt}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setGapfillChecked(false);
                        setSelectedGapfillOpt(null);
                        setGapfillCorrect(null);
                        if (gapfillIdx < gapfillItems.length - 1) {
                          setGapfillIdx(gapfillIdx + 1);
                        } else {
                          setGapfillIdx(0);
                        }
                      }}
                      className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Next Gap-fill
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen 10: Activity 4: Context-appropriate phrase challenges */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 4 – Context-appropriate phrase challenges</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 10 of {totalSteps}</span>
          </div>

          <div className="space-y-4 bg-zinc-900/30 p-5 rounded-2xl border border-white/5">
            {contextItems.length === 0 ? (
              <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
            ) : (
              <div className="space-y-4 w-full">
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-center">
                  <span className="text-[10px] text-zinc-500 block mb-1">Situation scenario:</span>
                  <p className="font-semibold text-zinc-300">{contextItems[contextIdx]?.scenario}</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {contextItems[contextIdx]?.options.map((opt: any) => (
                    <button
                      key={opt.id}
                      onClick={() => !contextChecked && setSelectedContextOpt(opt.id)}
                      disabled={contextChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold font-korean transition ${
                        selectedContextOpt === opt.id
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      } ${contextChecked && opt.id === contextItems[contextIdx]?.correct_option_id ? "border-accent-teal bg-accent-teal/10" : ""}`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>

                {contextChecked && (
                  <div className={`p-4 rounded-xl border text-xs text-left space-y-1.5 ${
                    contextCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    <p className="font-extrabold">{contextCorrect ? "Correct!" : "Incorrect."}</p>
                    <p><strong>Explanation:</strong> {contextItems[contextIdx]?.explanation}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  {!contextChecked ? (
                    <button
                      onClick={handleCheckContext}
                      disabled={!selectedContextOpt}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setContextChecked(false);
                        setSelectedContextOpt(null);
                        setContextCorrect(null);
                        if (contextIdx < contextItems.length - 1) {
                          setContextIdx(contextIdx + 1);
                        } else {
                          setContextIdx(0);
                        }
                      }}
                      className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Next Scenario
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen 11: Graduating checkpoint quiz */}
      {step === 11 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          {quizScore !== null ? (
            <div className="space-y-6 text-center">
              <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 animate-bounce">
                <Award className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-white">Checkpoint Complete! 🇰🇷✨</h2>
              <p className="text-zinc-400 text-xs">You scored **{quizScore}%** on your A1 Checkpoint Quiz and earned **150 XP**.</p>

              {quizScore < 80 && (
                <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 text-yellow-400 text-xs rounded-xl max-w-md mx-auto text-left">
                  ⚠️ We suggest resetting the lesson and revisiting Activities 1-4 to build core confidence in greetings!
                </div>
              )}

              <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-lg mx-auto">
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

              <div className="p-5 bg-zinc-900/60 rounded-2xl border border-white/5 space-y-4 max-w-lg mx-auto">
                <div className="text-left space-y-1">
                  <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider block">Special AI Practice Mode</span>
                  <h4 className="text-xs font-bold text-white">Greetings Mode dialogue coaching with Gwan-Sik</h4>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Starts a short, greetings-focused chat session where Gwan-Sik greets you and gives corrections on your polite responses.
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
                    <span>Practice with your AI tutor (Greetings Mode)</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => {
    if (courseXP < 180) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To graduate from this course, you need at least 180 XP. You currently have " + courseXP + " XP. Please review earlier steps or re-answer incorrect questions to earn more XP!") } }));
      return;
    }onComplete();
  }}
                className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/20 cursor-pointer w-full max-w-xs"
              >
                <span>Finish Phase 1 & Earn XP</span>
                <ChevronRight className="w-4 h-4 text-zinc-950" />
              </button>
            </div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-xs text-zinc-500 font-bold">Checkpoint Question {quizIdx + 1} of {quizBlueprint.length}</span>
              </div>

              <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Question Prompt</span>
                <p className="font-extrabold text-white text-base mt-1">{quizBlueprint[quizIdx]?.question}</p>
              </div>

              {quizBlueprint[quizIdx]?.type === "listening" && (
                <div className="text-center space-y-4">
                  <button 
                    onClick={() => playAudio(quizBlueprint[quizIdx]?.correct_answer)}
                    className="p-5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full mx-auto transition flex items-center justify-center cursor-pointer"
                  >
                    <Volume2 className="w-8 h-8" />
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    {quizBlueprint[quizIdx]?.options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !quizChecked && setQuizAnswerSelected(opt)}
                        disabled={quizChecked}
                        className={`p-3 rounded-xl border text-xs font-bold transition ${
                          quizAnswerSelected === opt
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                        } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10" : ""}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {quizBlueprint[quizIdx]?.type === "context" && (
                <div className="grid grid-cols-1 gap-2 animate-fade-in">
                  {quizBlueprint[quizIdx]?.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizAnswerSelected(opt)}
                      disabled={quizChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                        quizAnswerSelected === opt
                          ? "border-brand-500 bg-brand-500/10 text-white font-korean"
                          : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-korean"
                      } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10" : ""}`}
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
                    value={quizAnswer}
                    disabled={quizChecked}
                    onChange={(e) => setQuizAnswer(e.target.value)}
                    placeholder="Type the exact Hangeul block..."
                    className="w-full bg-zinc-950 p-4 rounded-xl border border-white/5 text-center text-lg font-black text-white focus:outline-none focus:border-brand-500 font-korean"
                  />
                  {!quizChecked && (
                    <div className="flex gap-1.5 justify-center flex-wrap pt-2">
                      {["네", "아니요", "감사", "합니", "죄송", "안녕", "가세요", "계세요"].map(ch => (
                        <button
                          key={ch}
                          onClick={() => setQuizAnswer(v => v + ch)}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 rounded border border-white/5 text-xs text-white font-korean"
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
                  <p className="text-xs text-zinc-400 font-bold">Speak "안녕하세요" loudly to evaluate your pronunciation.</p>
                  
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
                          ? "bg-red-500 text-white animate-pulse animate-duration-1000"
                          : "bg-brand-500/10 text-brand-400 border border-brand-500/25 hover:bg-brand-500/20"
                      }`}
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
                    <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 text-left text-xs space-y-1 max-w-sm mx-auto">
                      <p className="font-black text-white">Acoustic Score: {speakingResult.similarity_score.toFixed(0)}%</p>
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
                            selected_answer: String(quizAnswerSelected || ""),
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
                        ? !quizAnswerSelected 
                        : !quizAnswer.trim()
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
                        <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Submit Quiz"}</span>
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
      
      {/* Navigation bottom controls for non-quiz screens */}
      {step < 11 && step > 1 && (
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
                if (typeof setQuizAnswer === "function") setQuizAnswer("");
                if (typeof setQuizAnswerSelected === "function") setQuizAnswerSelected(null);
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
