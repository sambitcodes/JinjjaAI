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

interface Course3Phase3PastRoutinesWizardProps {
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

export default function Course3Phase3PastRoutinesWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course3Phase3PastRoutinesWizardProps) {
  const phaseNum = 3;
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
    const savedStep = localStorage.getItem("hangeulai_c3p3_step");
    const savedMax = localStorage.getItem("hangeulai_c3p3_max_step");
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
      localStorage.setItem("hangeulai_c3p3_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 12;

  // Persist progress to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c3p3_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 12) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c3p3_step", String(step));
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
        question: "Which sentence clearly talks about the past?",
        options: [
          { id: "A", text: "학교에 가요. (I go to school.)" },
          { id: "B", text: "어제 학교에 갔어요. (I went to school yesterday.)" }
        ],
        correctId: "B",
        explanation: "갔어요 ends in polite past ~았어요 and 어제 means yesterday, indicating a past routine."
      }
    ],
    3: [
      {
        question: "What is the past form of 먹어요 (eat)?",
        options: [
          { id: "A", text: "먹었어요" },
          { id: "B", text: "먹았어요" }
        ],
        correctId: "A",
        explanation: "먹다 has a stem vowel ㅓ, which does not end in ㅏ or ㅗ. So we add 었어요 to form 먹었어요."
      },
      {
        question: "Which past form comes from 공부하다 (study)?",
        options: [
          { id: "A", text: "공부했어요" },
          { id: "B", text: "공부었어요" }
        ],
        correctId: "A",
        explanation: "Verbs ending in 하다 always change to 했어요 in polite past tense."
      }
    ],
    4: [
      {
        question: "Which phrase means 'last weekend'?",
        options: [
          { id: "A", text: "어제" },
          { id: "B", text: "지난 주말" },
          { id: "C", text: "지난 달" }
        ],
        correctId: "B",
        explanation: "지난 주말 is the combination of 지난 (last) and 주말 (weekend)."
      },
      {
        question: "Which phrase would you use for 'yesterday night'?",
        options: [
          { id: "A", text: "어제 저녁 (yesterday evening)" },
          { id: "B", text: "어젯밤 (last night / yesterday night)" }
        ],
        correctId: "B",
        explanation: "어젯밤 specifically means last night or yesterday night."
      }
    ],
    5: [
      {
        question: "How many past-tense verbs do you see in the paragraph?",
        options: [
          { id: "A", text: "3 past-tense verbs" },
          { id: "B", text: "5 past-tense verbs" }
        ],
        correctId: "B",
        explanation: "The verbs are 일어났어요, 갔어요, 만났어요, 봤어요, and 잤어요. All 5 are conjugated in past tense."
      },
      {
        question: "Which sentence tells you when these actions happened?",
        options: [
          { id: "A", text: "The first sentence (with '어제')" },
          { id: "B", text: "The second sentence (with '그리고')" }
        ],
        correctId: "A",
        explanation: "'어제' (yesterday) sets the time frame for all actions in this narrative."
      }
    ]
  };

  // Card flipping tracking
  const [flippedVerbIdx, setFlippedVerbIdx] = useState<number | null>(null);
  const [flippedTimeIdx, setFlippedTimeIdx] = useState<number | null>(null);

  // Activity 1: Verb MCQ
  const [verbMcqIdx, setVerbMcqIdx] = useState(0);
  const [verbMcqSelected, setVerbMcqSelected] = useState<string | null>(null);
  const [verbMcqChecked, setVerbMcqChecked] = useState(false);
  const [verbMcqCorrect, setVerbMcqCorrect] = useState<boolean | null>(null);

  // Activity 2: Time MCQ
  const [timeMcqIdx, setTimeMcqIdx] = useState(0);
  const [timeMcqSelected, setTimeMcqSelected] = useState<string | null>(null);
  const [timeMcqChecked, setTimeMcqChecked] = useState(false);
  const [timeMcqCorrect, setTimeMcqCorrect] = useState<boolean | null>(null);

  // Activity 3: Listening
  const [listeningItems, setListeningItems] = useState<any[]>([]);
  const [listeningIdx, setListeningIdx] = useState(0);
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(null);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningCorrect, setListeningCorrect] = useState<boolean | null>(null);
  const [detailAnswers, setDetailAnswers] = useState<Record<string, string>>({});
  const [detailChecked, setDetailChecked] = useState(false);
  const [detailCorrect, setDetailCorrect] = useState<Record<string, boolean>>({});

  // Activity 4: Transform drills
  const [transformDrills, setTransformDrills] = useState<any[]>([]);
  const [drillIdx, setDrillIdx] = useState(0);
  const [drillSelectedOpt, setDrillSelectedOpt] = useState<string | null>(null);
  const [drillChecked, setDrillChecked] = useState(false);
  const [drillCorrect, setDrillCorrect] = useState<boolean | null>(null);
  const [drillWritingAns, setDrillWritingAns] = useState("");

  // Activity 5: Timeline Builder & Speaking
  const [builderTemplates, setBuilderTemplates] = useState<any>(null);
  const [dayType, setDayType] = useState<"yesterday" | "weekend">("yesterday");
  const [builderSlots, setBuilderSlots] = useState<any[]>([
    { slot_name: "Morning", past_ko: "" },
    { slot_name: "Daytime", past_ko: "" },
    { slot_name: "Evening", past_ko: "" }
  ]);
  const [builtParagraph, setBuiltParagraph] = useState<any>(null);
  const [building, setBuilding] = useState(false);
  const [savingParagraph, setSavingParagraph] = useState(false);
  const [paragraphSaved, setParagraphSaved] = useState(false);

  // Speaking evaluation states
  const rec = useRecorder();
  const [speakingTranscribing, setSpeakingTranscribing] = useState(false);
  const [speakingResult, setSpeakingResult] = useState<any>(null);
  const [speakingReflectionSelected, setSpeakingReflectionSelected] = useState<string | null>(null);
  const [speakingReflectionChecked, setSpeakingReflectionChecked] = useState(false);

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
        const saved = localStorage.getItem("hangeulai_c3p3_progress_state");
        if (saved) {
          const state = JSON.parse(saved);
            // Deleted state.step override to allow teleportation
            // Deleted state.maxStep override to allow teleportation
            if (state.cSelected !== undefined) setCSelected(state.cSelected);
            if (state.cChecked !== undefined) setCChecked(state.cChecked);
            if (state.cCorrect !== undefined) setCCorrect(state.cCorrect);
            if (state.cIdx !== undefined) setCIdx(state.cIdx);
            if (state.flippedVerbIdx !== undefined) setFlippedVerbIdx(state.flippedVerbIdx);
            if (state.flippedTimeIdx !== undefined) setFlippedTimeIdx(state.flippedTimeIdx);
            if (state.verbMcqIdx !== undefined) setVerbMcqIdx(state.verbMcqIdx);
            if (state.verbMcqSelected !== undefined) setVerbMcqSelected(state.verbMcqSelected);
            if (state.verbMcqChecked !== undefined) setVerbMcqChecked(state.verbMcqChecked);
            if (state.verbMcqCorrect !== undefined) setVerbMcqCorrect(state.verbMcqCorrect);
            if (state.timeMcqIdx !== undefined) setTimeMcqIdx(state.timeMcqIdx);
            if (state.timeMcqSelected !== undefined) setTimeMcqSelected(state.timeMcqSelected);
            if (state.timeMcqChecked !== undefined) setTimeMcqChecked(state.timeMcqChecked);
            if (state.timeMcqCorrect !== undefined) setTimeMcqCorrect(state.timeMcqCorrect);
            if (state.listeningIdx !== undefined) setListeningIdx(state.listeningIdx);
            if (state.selectedSummaryId !== undefined) setSelectedSummaryId(state.selectedSummaryId);
            if (state.listeningChecked !== undefined) setListeningChecked(state.listeningChecked);
            if (state.listeningCorrect !== undefined) setListeningCorrect(state.listeningCorrect);
            if (state.detailAnswers !== undefined) setDetailAnswers(state.detailAnswers);
            if (state.detailChecked !== undefined) setDetailChecked(state.detailChecked);
            if (state.detailCorrect !== undefined) setDetailCorrect(state.detailCorrect);
            if (state.drillIdx !== undefined) setDrillIdx(state.drillIdx);
            if (state.drillSelectedOpt !== undefined) setDrillSelectedOpt(state.drillSelectedOpt);
            if (state.drillChecked !== undefined) setDrillChecked(state.drillChecked);
            if (state.drillCorrect !== undefined) setDrillCorrect(state.drillCorrect);
            if (state.drillWritingAns !== undefined) setDrillWritingAns(state.drillWritingAns);
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
            flippedVerbIdx,
            flippedTimeIdx,
            verbMcqIdx,
            verbMcqSelected,
            verbMcqChecked,
            verbMcqCorrect,
            timeMcqIdx,
            timeMcqSelected,
            timeMcqChecked,
            timeMcqCorrect,
            listeningIdx,
            selectedSummaryId,
            listeningChecked,
            listeningCorrect,
            detailAnswers,
            detailChecked,
            detailCorrect,
            drillIdx,
            drillSelectedOpt,
            drillChecked,
            drillCorrect,
            drillWritingAns,
            quizIdx,
            quizChecked,
            quizCorrect,
            quizSelectedOpt,
            quizWritingAns,
            quizScore,
            quizMistakes,
            completedHomework
        };
        localStorage.setItem("hangeulai_c3p3_progress_state", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save progress state:", e);
      }
    }
  }, [step, maxStep, cSelected, cChecked, cCorrect, cIdx, flippedVerbIdx, flippedTimeIdx, verbMcqIdx, verbMcqSelected, verbMcqChecked, verbMcqCorrect, timeMcqIdx, timeMcqSelected, timeMcqChecked, timeMcqCorrect, listeningIdx, selectedSummaryId, listeningChecked, listeningCorrect, detailAnswers, detailChecked, detailCorrect, drillIdx, drillSelectedOpt, drillChecked, drillCorrect, drillWritingAns, quizIdx, quizChecked, quizCorrect, quizSelectedOpt, quizWritingAns, quizScore, quizMistakes, completedHomework]);
  // --- End Progress State Preservation ---


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

  // APIs pre-loaders
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean2/3/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean2/3/core-data");
          setCoreData(res);
        } else if (step === 8 && listeningItems.length === 0) {
          const res_l = await apiJson("/practice/past-routines/listening");
          setListeningItems(res_l.items || []);
        } else if (step === 9) {
          if (transformDrills.length === 0) {
            const res_d = await apiJson("/practice/past-routines/transform");
            setTransformDrills(res_d || []);
          }
        } else if (step === 10 && !builderTemplates) {
          const res_t = await apiJson("/practice/past-routines/templates");
          setBuilderTemplates(res_t);
          if (res_t.builder_options) {
            const defaults = [
              { slot_name: "Morning", past_ko: res_t.builder_options.morning[0].past_ko },
              { slot_name: "Daytime", past_ko: res_t.builder_options.day[0].past_ko },
              { slot_name: "Evening", past_ko: res_t.builder_options.evening[0].past_ko }
            ];
            setBuilderSlots(defaults);
          }
        } else if (step === 11 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/quiz/korean2/phase-3/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 12 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/phases/korean2/3/homework");
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

  // Concept checks
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

  // Activity 1: Verb card MCQ
  const handleCheckVerbMcq = (opt: string) => {
    if (verbMcqChecked) return;
    setVerbMcqSelected(opt);
    const correctVal = verbMcqIdx === 0 ? "갔어요" : "봤어요";
    const isCorrect = opt === correctVal;
    setVerbMcqChecked(true);
    setVerbMcqCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  // Activity 2: Time card MCQ
  const handleCheckTimeMcq = (opt: string) => {
    if (timeMcqChecked) return;
    setTimeMcqSelected(opt);
    const correctVal = timeMcqIdx === 0 ? "지난 주" : "어제";
    const isCorrect = opt === correctVal;
    setTimeMcqChecked(true);
    setTimeMcqCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  // Activity 3: Listening summaries
  const handleCheckListeningSummary = async () => {
    const current = listeningItems[listeningIdx];
    if (!current || !selectedSummaryId) return;

    try {
      const res = await apiJson("/practice/past-routines/listening/answer", {
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

  // Activity 4: Transform Drills
  const handleCheckDrill = async () => {
    const current = transformDrills[drillIdx];
    if (!current) return;

    const userAns = drillSelectedOpt || drillWritingAns.trim();
    if (!userAns) return;

    const isCorrect = userAns.toLowerCase() === current.correct_answer.toLowerCase();
    setDrillChecked(true);
    setDrillCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();

    try {
      await apiJson("/practice/past-routines/transform/answer", {
        method: "POST",
        body: JSON.stringify({
          question_id: current.id,
          is_correct: isCorrect,
          time_taken_ms: 1500
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 5: Timeline Builder
  const handleUpdateSlot = (index: number, value: string) => {
    const nextSlots = [...builderSlots];
    nextSlots[index] = { ...nextSlots[index], past_ko: value };
    setBuilderSlots(nextSlots);
  };

  const handleBuildParagraph = async () => {
    setBuilding(true);
    setBuiltParagraph(null);
    setParagraphSaved(false);
    try {
      const res = await apiJson("/practice/past-routines/build", {
        method: "POST",
        body: JSON.stringify({ day_type: dayType, slots: builderSlots })
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
      await apiJson("/users/past-routine/save", {
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
    const target = builtParagraph ? builtParagraph.final_korean_text : "어제 일찍 일어났어요.";
    if (!rec.audioBlob) return;
    setSpeakingTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("expected_text", target);
      fd.append("audio_file", rec.audioBlob, "recording.webm");
      const res = await apiForm("/practice/past-routines/speaking", fd);
      setSpeakingResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSpeakingTranscribing(false);
    }
  };

  const handleCheckSpeakingReflection = (opt: string) => {
    if (speakingReflectionChecked) return;
    setSpeakingReflectionSelected(opt);
    setSpeakingReflectionChecked(true);
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
        await apiJson("/quiz/korean2/phase-3/finish", {
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
      await apiJson("/phases/korean2/3/homework/check", {
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
      const res = await apiJson("/conversation/a2/past-routines-practice/start", { method: "POST" });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

    const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "C1 – Past Routines introduction" },
    { num: 3, label: "C2 – Past tense conjugation rules" },
    { num: 4, label: "C3 – Past time expressions" },
    { num: 5, label: "C4 – Example story narrative analysis" },
    { num: 6, label: "Activity 1 – Past tense verb grids & flips" },
    { num: 7, label: "Activity 2 – Past time expressions cards & matching" },
    { num: 8, label: "Activity 3 – Yesterday routine listening summaries & details" },
    { num: 9, label: "Activity 4 – Present-to-past transform drills" },
    { num: 10, label: "Activity 5 – Timeline paragraph builder & speaking practice" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 3,
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
              <span>{activeLesson?.title || "Talking About Yesterday"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: Korean Simple Past Tense Conjugation</p>
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
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">Required: 340 XP</span>
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
                      if (courseXP < 160) {
                        window.dispatchEvent(new CustomEvent("hangeulai-warning", {
                          detail: { message: "To start Phase 3, you need at least 160 XP in this course. You currently have " + courseXP + " XP." }
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
          
          <h2 className="text-5xl font-black text-white tracking-tight">Korean 2.3</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Past Routines</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Describe what you did yesterday and last weekend using simple polite past tense."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Conjugate daily verbs into polite past tense",
                "Use basic past time adverbs (어제, 지난 주말)",
                "Build and read aloud a short yesterday timeline story"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 25} minutes</p>
            <p><strong>📋 Prerequisites:</strong> completed {metadata?.prerequisites || "Korean 2.2"}</p>
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => {
    if (courseXP < 160) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 3, you need at least 160 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
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

      {/* Step 2: Screen C1 – From "I do" to "I did" */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">From Present to Past Routines</h2>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300 text-left">
            <p>So far, you describe regular current habits. To talk about what occurred yesterday or last weekend, you must transition to the past tense.</p>
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 font-mono text-xs text-zinc-400 space-y-2 font-korean">
              <p>• 어제 학교에 <strong className="text-brand-300">갔어요</strong>. (I went to school yesterday.)</p>
              <p>• 지난 주말에 친구를 <strong className="text-brand-300">만났어요</strong>. (I met a friend last weekend.)</p>
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

      {/* Step 3: Screen C2 – Polite past tense: 았어요 / 었어요 / 했어요 */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Polite Past Tense Rules</h2>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300 text-left">
            <p>Take the verb stem (drop 다) and apply the vowel guidelines:</p>
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2 text-xs text-zinc-400 font-korean">
              <p>• <strong>았어요:</strong> last stem vowel is <strong>ㅏ</strong> or <strong>ㅗ</strong> (e.g. 가다 → 가 + 았어요 → <span className="text-brand-300">갔어요</span>)</p>
              <p>• <strong>었어요:</strong> other vowels (e.g. 먹다 → 먹 + 었어요 → <span className="text-brand-300">먹었어요</span>)</p>
              <p>• <strong>했어요:</strong> verbs ending in <strong>하다</strong> (e.g. 공부하다 → <span className="text-brand-300">공부했어요</span>)</p>
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

      {/* Step 4: Screen C3 – Past time expressions */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Past Time Expressions</h2>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm text-zinc-300 text-left">
            <p>Use these keywords to establish when the action occurred, usually at the beginning of the sentence:</p>
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1.5 text-xs text-zinc-400 font-korean">
              <p>• <strong>어제:</strong> yesterday</p>
              <p>• <strong>어젯밤:</strong> last night</p>
              <p>• <strong>지난 주말:</strong> last weekend</p>
              <p>• <strong>지난 주:</strong> last week</p>
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

      {/* Step 5: Screen C4 – Example "yesterday routine" paragraph */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Yesterday Routine Narrative</h2>
          
          <div className="space-y-3 text-left">
            <span className="text-[10px] text-zinc-550 font-black uppercase tracking-wider block">Yesterday Routine Story</span>
            <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
              <p className="font-korean font-bold text-sm leading-relaxed text-zinc-300">
                <span className="bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded border border-amber-500/35" title="Yesterday (Time)">어제</span> 저는 아침 일찍 <span className="bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded border border-cyan-500/35" title="Woke up (Verb)">일어났어요</span>. <span className="bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded border border-purple-500/35" title="And/Then (Connector)">그리고</span> 학교에 <span className="bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded border border-cyan-500/35" title="Went (Verb)">갔어요</span>. 오후에 친구를 <span className="bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded border border-cyan-500/35" title="Met (Verb)">만났어요</span>. 우리는 영화를 <span className="bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded border border-cyan-500/35" title="Watched (Verb)">봤어요</span>. 밤에 일찍 <span className="bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded border border-cyan-500/35" title="Slept (Verb)">잤어요</span>.
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed italic font-sans">
                "Yesterday I woke up early in the morning. And I went to school. In the afternoon I met a friend. We watched a movie. At night I went to sleep early."
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

      {/* Step 6: Activity 1 – Past-tense verb cards & flips */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Past Tense Verbs Grid</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of {totalSteps}</span>
          </div>

          <p className="text-xs text-zinc-400">
            Select a card to play its pronunciation and flip it. Then answer the MCQ drills.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[35vh] overflow-y-auto pr-1">
            {coreData?.past_verbs?.map((v: any, idx: number) => {
              const isFlipped = flippedVerbIdx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setFlippedVerbIdx(isFlipped ? null : idx);
                    playAudio(v.past);
                  }}
                  className={`glass-panel p-3 rounded-xl border text-center transition cursor-pointer flex flex-col justify-between h-24 ${
                    isFlipped ? "border-brand-500 bg-brand-500/5 shadow-md" : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800"
                  }`}
                >
                  {!isFlipped ? (
                    <div className="my-auto space-y-1">
                      <div className="text-sm font-black text-white font-korean">{v.past}</div>
                      <span className="text-[8.5px] text-zinc-500 tracking-wider font-mono">Present: {v.present}</span>
                    </div>
                  ) : (
                    <div className="animate-fade-in text-left my-auto space-y-0.5">
                      <span className="text-xs font-black text-brand-400">{v.english}</span>
                      <p className="text-[8.5px] text-zinc-500 font-mono leading-normal">{v.romanization}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Micro MCQs */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-left">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Conjugation Drill {verbMcqIdx + 1} of 2</h4>
            <p className="text-xs text-zinc-300 font-bold">
              {verbMcqIdx === 0 
                ? "Which is the correct past form of 가요 (go)?" 
                : "Choose the correct past form of 봐요 (watch):"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(verbMcqIdx === 0 ? ["가었어요", "갔어요", "가했어요"] : ["봤어요", "봤었어요", "보았해요"]).map(opt => (
                <button
                  key={opt}
                  onClick={() => handleCheckVerbMcq(opt)}
                  disabled={verbMcqChecked}
                  className={`p-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                    verbMcqSelected === opt
                      ? verbMcqCorrect
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-red-500 bg-red-500/10 text-white"
                      : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                  } ${verbMcqChecked && opt === (verbMcqIdx === 0 ? "갔어요" : "봤어요") ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {verbMcqChecked && (
              <div className="flex justify-between items-center pt-1">
                <p className="text-[10px] text-zinc-450 italic">
                  {verbMcqIdx === 0 
                    ? "가다 contracts with 았어요 to form 갔어요." 
                    : "보다 combines with 았어요 to form 봤어요."}
                </p>
                <button
                  onClick={() => {
                    setVerbMcqChecked(false);
                    setVerbMcqSelected(null);
                    setVerbMcqCorrect(null);
                    if (verbMcqIdx === 0) setVerbMcqIdx(1);
                    else setStep(7);
                  }}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                >
                  {verbMcqIdx === 0 ? "Next MCQ" : "Continue to Time Phrases"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 7: Activity 2 – Past time expressions */}
      {step === 7 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Past Time Expressions</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of {totalSteps}</span>
          </div>

          <p className="text-xs text-zinc-400">
            Select a card to play its pronunciation and flip it. Then answer the matching MCQs.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[35vh] overflow-y-auto pr-1">
            {coreData?.past_time_expressions?.map((t: any, idx: number) => {
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
                    <div className="my-auto space-y-1">
                      <div className="text-sm font-black text-white font-korean">{t.ko}</div>
                      <span className="text-[8px] text-zinc-500 tracking-wider uppercase font-mono">Time Expression</span>
                    </div>
                  ) : (
                    <div className="animate-fade-in text-left my-auto space-y-0.5">
                      <span className="text-xs font-black text-brand-400">{t.en}</span>
                      <p className="text-[8.5px] text-zinc-500 leading-normal">Commonly placed at the beginning of sentences.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Micro MCQs */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-left">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Matching Drill {timeMcqIdx + 1} of 2</h4>
            <p className="text-xs text-zinc-300 font-bold">
              {timeMcqIdx === 0 
                ? "Which phrase matches 'last week'?" 
                : "Which phrase would you use for 'yesterday'?"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(timeMcqIdx === 0 ? ["지난 주말", "지난 주", "지난 달"] : ["어젯밤", "어제 저녁", "어제"]).map(opt => (
                <button
                  key={opt}
                  onClick={() => handleCheckTimeMcq(opt)}
                  disabled={timeMcqChecked}
                  className={`p-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                    timeMcqSelected === opt
                      ? timeMcqCorrect
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-red-500 bg-red-500/10 text-white"
                      : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                  } ${timeMcqChecked && opt === (timeMcqIdx === 0 ? "지난 주" : "어제") ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {timeMcqChecked && (
              <div className="flex justify-between items-center pt-1">
                <p className="text-[10px] text-zinc-450 italic">
                  {timeMcqIdx === 0 
                    ? "지난 주 means last week, whereas 지난 주말 means last weekend." 
                    : "어제 is the direct translation of yesterday."}
                </p>
                <button
                  onClick={() => {
                    setTimeMcqChecked(false);
                    setTimeMcqSelected(null);
                    setTimeMcqCorrect(null);
                    if (timeMcqIdx === 0) setTimeMcqIdx(1);
                    else setStep(8);
                  }}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                >
                  {timeMcqIdx === 0 ? "Next MCQ" : "Continue to Listening"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 8: Activity 3 – Yesterday routine listening summaries */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 3 – Hobbies Listening Checks</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 8 of {totalSteps}</span>
          </div>

          {listeningItems.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              {/* Part A: Main summary */}
              <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="text-center">
                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Part A: Gist Summary</span>
                  <p className="text-xs text-zinc-300 mt-1">Listen to the speaker describe what they did yesterday:</p>
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
                  <div className={`p-3 rounded-xl border text-xs text-left ${
                    listeningCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    <p className="font-extrabold">{listeningCorrect ? "Correct summary!" : "Incorrect."}</p>
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
                    <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-[11px] text-zinc-400 space-y-2">
                      {Object.values(detailCorrect).every(v => v) ? (
                        <p className="text-accent-teal font-extrabold text-center">Excellent! All details are correct.</p>
                      ) : (
                        <p className="text-red-400 font-extrabold text-center">Some answers are incorrect. Review the explanations.</p>
                      )}
                      {listeningItems[listeningIdx]?.detail_questions.map((q: any, idx: number) => (
                        <p key={idx} className="text-[10px] leading-snug">
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
                            setStep(9); // Move to Transform Drills
                          }
                        }}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        {listeningIdx < listeningItems.length - 1 ? "Next Audio" : "Continue to Drills"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 9: Activity 4 – Present-to-past transform drills */}
      {step === 9 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 4 – Present to Past Conjugations</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 9 of {totalSteps}</span>
          </div>

          {transformDrills.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-6 max-w-xl mx-auto w-full text-left">
              <div className="space-y-1">
                <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider block">Transform Sentences</span>
                <p className="text-sm text-zinc-200">
                  Transform this present-tense sentence into the polite past:
                </p>
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-center text-lg font-black text-white font-korean mt-2">
                  "{transformDrills[drillIdx]?.present}"
                </div>
              </div>

              {/* Multiple choice or type options */}
              <div className="space-y-3">
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Choose the correct past sentence</label>
                <div className="grid grid-cols-1 gap-2">
                  {transformDrills[drillIdx]?.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !drillChecked && setDrillSelectedOpt(opt)}
                      disabled={drillChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
                        drillSelectedOpt === opt
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      } ${drillChecked && opt === transformDrills[drillIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${drillChecked && drillSelectedOpt === opt && opt !== transformDrills[drillIdx]?.correct_answer ? "border-red-500 bg-red-500/10 text-white" : ""}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {drillChecked && (
                <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                  drillCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold">{drillCorrect ? "Correct!" : "Incorrect."}</p>
                  <p>{transformDrills[drillIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                {!drillChecked ? (
                  <button
                    onClick={handleCheckDrill}
                    disabled={!drillSelectedOpt}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Submit Conjugation
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setDrillChecked(false);
                      setDrillSelectedOpt(null);
                      setDrillCorrect(null);
                      if (drillIdx < transformDrills.length - 1) {
                        setDrillIdx(drillIdx + 1);
                      } else {
                        setStep(10);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {drillIdx < transformDrills.length - 1 ? "Next Drill" : "Continue to Timeline Builder"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 10: Activity 5 – Yesterday timeline builder & speaking practice */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 5 – Timeline Story & Speaking</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 10 of {totalSteps}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
            {/* Slot selections */}
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
              <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Part A: Select Time Slots</h3>

              <div className="flex justify-center gap-3 pb-2 border-b border-white/5">
                <button
                  onClick={() => setDayType("yesterday")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    dayType === "yesterday" ? "bg-brand-500 text-white border-brand-500" : "bg-zinc-950 text-zinc-400 border-white/5"
                  }`}
                >
                  Yesterday (어제)
                </button>
                <button
                  onClick={() => setDayType("weekend")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    dayType === "weekend" ? "bg-brand-500 text-white border-brand-500" : "bg-zinc-950 text-zinc-400 border-white/5"
                  }`}
                >
                  Last Weekend (지난 주말)
                </button>
              </div>

              <div className="space-y-3">
                {builderSlots.map((slot, idx) => {
                  const optionsList = idx === 0 
                    ? builderTemplates?.builder_options?.morning 
                    : idx === 1 
                      ? builderTemplates?.builder_options?.day 
                      : builderTemplates?.builder_options?.evening;

                  return (
                    <div key={idx} className="p-2.5 bg-zinc-950 rounded-xl border border-white/5 space-y-1 text-xs">
                      <span className="text-[10px] uppercase text-zinc-500 font-black tracking-widest block">{slot.slot_name} Slot</span>
                      <select
                        value={slot.past_ko}
                        onChange={(e) => handleUpdateSlot(idx, e.target.value)}
                        className="w-full bg-zinc-900 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                      >
                        {optionsList?.map((o: any) => (
                          <option key={o.past_ko} value={o.past_ko}>{o.past_ko} ({o.en})</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={handleBuildParagraph}
                  disabled={building}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition cursor-pointer"
                >
                  {building ? "Assembling..." : "Assemble Story Timeline"}
                </button>
              </div>
            </div>

            {/* Paragraph view & speaking check */}
            <div className="space-y-4">
              {builtParagraph ? (
                <div className="bg-zinc-950 p-5 rounded-2xl border border-brand-500/25 space-y-3 text-center animate-fade-in flex-grow flex flex-col justify-between h-full">
                  <div className="space-y-2">
                    <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Assembled Paragraph</span>
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
                        <p className="text-[10px] text-zinc-500">Practice your pronunciation score</p>
                      </div>
                    </div>

                    {rec.audioBlob && !rec.recording && (
                      <button
                        onClick={handleSpeechEvaluate}
                        disabled={speakingTranscribing}
                        className="w-full bg-zinc-900 hover:bg-zinc-850 text-white font-bold py-2 rounded-xl text-xs transition border border-white/5 cursor-pointer"
                      >
                        {speakingTranscribing ? "Evaluating..." : "Check Pronunciation"}
                      </button>
                    )}

                    {speakingResult && (
                      <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 space-y-1 text-xs">
                        <p className="font-black text-white">Score Accuracy: {speakingResult.similarity_score?.toFixed(0) || speakingResult.score || 0}%</p>
                        <p className="text-zinc-500 text-[10px]">Recognized: "{speakingResult.recognized_text || speakingResult.transcription || "..."}"</p>
                        <p className="text-zinc-450 text-[10px] italic">Feedback: {speakingResult.feedback}</p>
                      </div>
                    )}

                    {/* Reflection check */}
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <p className="text-xs text-zinc-300">Did you say the past endings (았어요/었어요/했어요) clearly?</p>
                      <div className="flex gap-2">
                        {["Yes, sounded natural!", "I need to repeat it"].map(opt => (
                          <button
                            key={opt}
                            onClick={() => handleCheckSpeakingReflection(opt)}
                            disabled={speakingReflectionChecked}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                              speakingReflectionSelected === opt
                                ? "border-accent-teal bg-accent-teal/15 text-white"
                                : "border-white/10 bg-zinc-900 text-zinc-450 hover:border-white/20"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      {speakingReflectionChecked && (
                        <p className="text-[10px] text-zinc-500 leading-snug">
                          Great reflection! ASR checks help you align your spoken pitch correctly.
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
                      {paragraphSaved ? "Saved!" : "Save Paragraph"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/10 border border-dashed border-white/10 rounded-2xl h-full flex items-center justify-center text-zinc-500 text-xs">
                  Assemble your story to activate pronunciation checks.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(9)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(11)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Quiz Checkpoint <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 11: Activity 5 – Graduating checkpoint mini-quiz */}
      {step === 11 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Capstone Past Routines Mini-Quiz</span>
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
                      {["갔어요", "먹었어요", "공부했어요", "어제", "지난 주말", "일어났어요"].map(ch => (
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
            <h2 className="text-3xl font-black text-white">Level 3: Phase 3 Completed! 🎓✨</h2>
            <p className="text-zinc-400 text-xs">You scored {quizScore}% on your past routines check! You earned **150 XP**.</p>
          </div>

          {/* Practical Checklist Homework */}
          <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 text-left space-y-3 w-full">
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

          {/* AI practice room */}
          <div className="bg-zinc-950 p-6 rounded-2xl border border-brand-500/10 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] text-brand-400 font-mono font-black uppercase tracking-wider block">Start Speaking Practice with Gwan-Sik</span>
              <p className="text-xs text-zinc-500">Practice describing what you did yesterday with real-time corrections.</p>
            </div>

            {!tutorSession ? (
              <button
                onClick={handleLaunchTutor}
                disabled={loadingTutor}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl text-xs transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                {loadingTutor ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                <span>Practice Past Routines with AI Tutor</span>
              </button>
            ) : (
              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-xs text-center space-y-3 animate-fade-in">
                <p className="text-zinc-300">Room launched! Opener: <strong>"{tutorSession.opener}"</strong></p>
                <a
                  href={`/conversation?session_id=${tutorSession.session_id}`}
                  className="bg-accent-teal hover:bg-accent-teal/90 text-zinc-950 font-black py-2.5 px-6 rounded-lg text-xs transition inline-flex items-center gap-1.5"
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
    if (courseXP < 340) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To graduate from this course, you need at least 340 XP. You currently have " + courseXP + " XP. Please review earlier steps or re-answer incorrect questions to earn more XP!") } }));
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
