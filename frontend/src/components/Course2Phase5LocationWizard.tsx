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

interface Course2Phase5LocationWizardProps {
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

export default function Course2Phase5LocationWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course2Phase5LocationWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 12;

  // Persist step to localStorage for refresh resilience
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c1p5_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 12) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c1p5_step", String(step));
  }, [step]);

  // DB Data loaded
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);
  
  // Activity 1 states
  const [practicePlaces, setPracticePlaces] = useState<any[]>([]);
  const [practiceSentences, setPracticeSentences] = useState<any[]>([]);
  const [placeIdx, setPlaceIdx] = useState(0);
  const [selectedPlaceOpt, setSelectedPlaceOpt] = useState<string | null>(null);
  const [placeChecked, setPlaceChecked] = useState(false);
  const [placeCorrect, setPlaceCorrect] = useState<boolean | null>(null);

  const [sentIdx, setSentIdx] = useState(0);
  const [selectedSentOpt, setSelectedSentOpt] = useState<string | null>(null);
  const [sentChecked, setSentChecked] = useState(false);
  const [sentCorrect, setSentCorrect] = useState<boolean | null>(null);

  // Activity 2 states
  const [dialogueItems, setDialogueItems] = useState<any[]>([]);
  const [dialogueIdx, setDialogueIdx] = useState(0);
  const [selectedDialogueOptId, setSelectedDialogueOptId] = useState<string | null>(null);
  const [dialogueChecked, setDialogueChecked] = useState(false);
  const [dialogueCorrect, setDialogueCorrect] = useState<boolean | null>(null);

  // Sentence Builder states
  const [builderPlaces, setBuilderPlaces] = useState<any[]>([]);
  const [selectedBuilderPlace, setSelectedBuilderPlace] = useState("");
  const [selectedBuilderPattern, setSelectedBuilderPattern] = useState("location");
  const [builtSentence, setBuiltSentence] = useState<any>(null);
  const [building, setBuilding] = useState(false);
  const [savingSentence, setSavingSentence] = useState(false);
  const [sentenceSaved, setSentenceSaved] = useState(false);
  const [builderReflectChecked, setBuilderReflectChecked] = useState(false);
  const [builderReflectSelected, setBuilderReflectSelected] = useState<string | null>(null);

  // Quiz states
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizWritingAns, setQuizWritingAns] = useState("");
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Card flipping tracking
  const [flippedPlaceId, setFlippedPlaceId] = useState<string | null>(null);

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
        question: "Which of these are places?",
        options: [
          { id: "A", text: "집, 학교, 카페 (Home, school, café)" },
          { id: "B", text: "먹다, 자다, 공부하다 (To eat, to sleep, to study)" }
        ],
        correctId: "A",
        explanation: "집, 학교, and 카페 are place nouns. The others are verbs."
      }
    ],
    3: [
      {
        question: "Which word means 'school'?",
        options: [
          { id: "A", text: "학교 (Hak-gyo)" },
          { id: "B", text: "공원 (Gong-won)" },
          { id: "C", text: "집 (Jip)" }
        ],
        correctId: "A",
        explanation: "학교 is school. 공원 is park. 집 is home."
      },
      {
        question: "Which word is likely 'park'?",
        options: [
          { id: "A", text: "병원 (Byeong-won)" },
          { id: "B", text: "공원 (Gong-won)" },
          { id: "C", text: "회사 (Hoe-sa)" }
        ],
        correctId: "B",
        explanation: "공원 means park. 병원 means hospital, and 회사 means office/company."
      }
    ],
    4: [
      {
        question: "Which sentence means 'I am at home'?",
        options: [
          { id: "A", text: "집에 있어요." },
          { id: "B", text: "집에 가요." }
        ],
        correctId: "A",
        explanation: "에 있어요 describes static location (being at a place). 집에 있어요 = I am at home."
      },
      {
        question: "Which one is about movement ('go to')?",
        options: [
          { id: "A", text: "학교에 있어요." },
          { id: "B", text: "학교에 가요." }
        ],
        correctId: "B",
        explanation: "에 가요 describes direction and movement. 학교에 가요 = I go to school."
      }
    ],
    5: [
      {
        question: "If someone asks '어디에 있어요?', what are they asking?",
        options: [
          { id: "A", text: "What are you doing?" },
          { id: "B", text: "Where are you?" },
          { id: "C", text: "How old are you?" }
        ],
        correctId: "B",
        explanation: "어디 means 'where' and 에 있어요 means 'are you at'. So '어디에 있어요?' is 'Where are you?'."
      },
      {
        question: "Which would you say if you want to ask 'Where are you going?'?",
        options: [
          { id: "A", text: "어디에 가요?" },
          { id: "B", text: "어디에 있어요?" }
        ],
        correctId: "A",
        explanation: "가요 means 'go', so '어디에 가요?' translates to 'Where are you going?'."
      }
    ],
    6: [
      {
        question: "What is a natural reply to '집에 있어요?' as a confirmation?",
        options: [
          { id: "A", text: "네, 집에 있어요." },
          { id: "B", text: "아니요, 커피에 있어요." }
        ],
        correctId: "A",
        explanation: "네, 집에 있어요 (Yes, I am at home) is the grammatically and contextually correct reply."
      }
    ]
  };

  // Activity 7: Vocab Grid MCQs states
  const [activePlaceCardIdx, setActivePlaceCardIdx] = useState(0);
  const [placeCardSelectedOpt, setPlaceCardSelectedOpt] = useState<string | null>(null);
  const [placeCardChecked, setPlaceCardChecked] = useState(false);
  const [placeCardCorrect, setPlaceCardCorrect] = useState<boolean | null>(null);

  // Speaking check states
  const rec = useRecorder();
  const [speakingTranscribing, setSpeakingTranscribing] = useState(false);
  const [speakingResult, setSpeakingResult] = useState<any>(null);

  // Homework check states
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Tutor session launch states
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
          const res = await apiJson("/lessons/phases/korean1/5/metadata");
          setMetadata(res);
        } else if ((step === 2 || step === 7) && !coreData) {
          const res = await apiJson("/lessons/phases/korean1/5/core-data");
          setCoreData(res);
        } else if (step === 8 && practicePlaces.length === 0) {
          const res_p = await apiJson("/lessons/practice/places/recognition");
          const res_s = await apiJson("/lessons/practice/location-sentences/recognition");
          setPracticePlaces(res_p.items || []);
          setPracticeSentences(res_s.items || []);
        } else if ((step === 9 || step === 10) && dialogueItems.length === 0) {
          const res_d = await apiJson("/lessons/practice/location/qa");
          const res_b = await apiJson("/lessons/practice/location/builder");
          setDialogueItems(res_d.items || []);
          setBuilderPlaces(res_b.places || []);
          if (res_b.places?.length) {
            setSelectedBuilderPlace(res_b.places[0].korean);
          }
        } else if (step === 11 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/lessons/quiz/korean1/phase-5/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 12 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean1/5/homework");
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

  // Activity 1: Place Grid flips MCQ check
  const handleCheckPlaceCard = (opt: string) => {
    if (placeCardChecked) return;
    setPlaceCardSelectedOpt(opt);
    const correctVal = activePlaceCardIdx === 1 ? "B" : "A"; // sample vocabulary matching
    const isCorrect = opt === correctVal;
    setPlaceCardChecked(true);
    setPlaceCardCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  // Activity 2: Place check
  const handleCheckPlace = async () => {
    const current = practicePlaces[placeIdx];
    if (!current || !selectedPlaceOpt) return;

    try {
      const res = await apiJson("/lessons/practice/places/recognition/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_option: selectedPlaceOpt,
          time_taken_ms: 1000
        })
      });
      setPlaceChecked(true);
      setPlaceCorrect(res.correct);
      if (res.correct) playCorrectSound();
      else playWrongSound();
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 3: Sentence check
  const handleCheckSent = async () => {
    const current = practiceSentences[sentIdx];
    if (!current || !selectedSentOpt) return;

    try {
      const res = await apiJson("/lessons/practice/location-sentences/recognition/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_option: selectedSentOpt,
          time_taken_ms: 1000
        })
      });
      setSentChecked(true);
      setSentCorrect(res.correct);
      if (res.correct) playCorrectSound();
      else playWrongSound();
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 4A: Dialogue QA Check
  const handleCheckDialogue = async () => {
    const current = dialogueItems[dialogueIdx];
    if (!current || !selectedDialogueOptId) return;

    try {
      const res = await apiJson("/lessons/practice/location/qa/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_option_id: selectedDialogueOptId,
          time_taken_ms: 1000
        })
      });
      setDialogueChecked(true);
      setDialogueCorrect(res.correct);
      if (res.correct) playCorrectSound();
      else playWrongSound();
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 4B: Sentence Builder
  const handleBuildSentence = async () => {
    if (!selectedBuilderPlace) return;
    setBuilding(true);
    setBuiltSentence(null);
    setSentenceSaved(false);
    try {
      const res = await apiJson("/lessons/practice/location/builder", {
        method: "POST",
        body: JSON.stringify({
          place: selectedBuilderPlace,
          pattern_type: selectedBuilderPattern
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
      await apiJson("/lessons/users/routine/save", {
        method: "POST",
        body: JSON.stringify({
          routine_text: builtSentence.final_korean_text
        })
      });
      setSentenceSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSentence(false);
    }
  };

  const handleCheckBuilderReflect = (opt: string) => {
    setBuilderReflectSelected(opt);
    setBuilderReflectChecked(true);
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
        await apiJson("/lessons/quiz/korean1/phase-5/finish", {
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

  // Speaking check verification
  const handleSpeechEvaluate = async () => {
    const current = quizBlueprint[quizIdx];
    const target = current ? current.correct_answer : (builtSentence ? builtSentence.final_korean_text : "집에 있어요");
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

  // Homework check logging
  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/lessons/phases/korean1/5/homework/check", {
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
      const res = await apiJson("/lessons/tutor/location-practice/start", { method: "POST" });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

    const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "C1 – Talking about places in Korean" },
    { num: 3, label: "C2 – Core place vocabulary (집, 학교, 회사...)" },
    { num: 4, label: "C3 – Particle 에: at/in vs to" },
    { num: 5, label: "C4 – Where-questions with 어디" },
    { num: 6, label: "C5 – Dialogue structures" },
    { num: 7, label: "Activity 1 – Places vocabulary grid & card flips" },
    { num: 8, label: "Activity 2 – Location/Destination particles comparison" },
    { num: 9, label: "Activity 3 – Places listening MCQ & sentence translation" },
    { num: 10, label: "Activity 4 – Dialogue Q&A matching & custom sentence builder" },
    { num: 11, label: "Activity 5 – Graduating checkpoint mini-quiz checks" },
    { num: 12, label: "Activity 6 – Location tutor dialogue practice room" }
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
              <span>{activeLesson?.title || "Places & Location"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: Places & Location Particles</p>
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

      {/* Screen 1: Welcome/Overview */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight">Korean 1.5</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Places & Location</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Say where you are, where you're going, and talk about everyday places."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Learn common place words (home, school, office, café, store, etc.)",
                "Ask and answer 'Where are you?' and 'Where are you going?' in simple polite Korean",
                "Describe basic movements like 'go to school' or 'go to the café'"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 25} minutes</p>
            <p><strong>📋 Prerequisites:</strong> {metadata?.prerequisites || "Korean 1.4 – Daily Activities"}</p>
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => setStep(2)}
              className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 5</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          
        </div>
      )}

      {/* Screen 2: C1 - Talking about places in Korean */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Talking about places in Korean</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            Everyday Korean conversations frequently cover where you are or where you are going. E.g.:
          </p>
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 font-mono text-center text-xs text-zinc-300 space-y-1.5 max-w-sm mx-auto">
            <p>“I'm at home.”</p>
            <p>“I'm going to school.”</p>
            <p>“I'm at the café now.”</p>
          </div>
          <p className="text-zinc-300 text-sm">To construct these expressions, you combine: **place noun + particle + verb**.</p>

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

      {/* Screen 3: C2 - Core place vocabulary */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Core Place Vocabulary</h2>
          
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            {coreData?.places?.slice(0, 6).map((p: any) => (
              <div key={p.id} className="p-3 bg-zinc-900/60 border border-white/5 rounded-xl space-y-1">
                <div className="font-bold text-white font-korean text-base">{p.korean}</div>
                <div className="text-[10px] text-zinc-500 italic">({p.english})</div>
              </div>
            ))}
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

      {/* Screen 4: C3 - Particle 에: "at/in" vs "to" */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Particle 에: “at/in” vs “to”</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            Korean attaches the suffix <strong>에 (e)</strong> after a place noun to establish location or destination:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono max-w-md mx-auto text-zinc-300">
            <div className="p-3 bg-zinc-955 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-brand-400 block font-bold">X에 있어요 (Location)</span>
              <p className="font-bold mt-1 text-white">집에 있어요</p>
              <p className="text-zinc-500">I am at home.</p>
            </div>
            <div className="p-3 bg-zinc-955 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-accent-teal block font-bold">X에 가요 (Destination)</span>
              <p className="font-bold mt-1 text-white">학교에 가요</p>
              <p className="text-zinc-500">I am going to school.</p>
            </div>
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

      {/* Screen 5: C4 - Where-questions with 어디 */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Where-Questions with 어디</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            <strong>어디 (eo-di)</strong> means “where”. Attach it to location particles to query places:
          </p>
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 text-center font-mono max-w-sm mx-auto space-y-1 text-sm text-brand-300 font-korean">
            <p>Q: 어디에 있어요? (Where are you?)</p>
            <p>A: 집에 있어요. (I'm at home.)</p>
            <p>Q: 어디에 가요? (Where are you going?)</p>
            <p>A: 학교에 가요. (I'm going to school.)</p>
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

      {/* Screen 6: C5 - Putting it together in small dialogues */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-white">Small Dialogue Structures</h2>
          <p className="text-zinc-300 text-base leading-relaxed">
            Let's compile small QA conversational threads:
          </p>
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 text-center font-mono max-w-sm mx-auto space-y-2 text-xs text-zinc-300 font-korean">
            <p>A: 어디에 가요?</p>
            <p>B: 학교에 가요.</p>
            <p>A: 지금 어디에 있어요?</p>
            <p>B: 카페에 있어요.</p>
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

      {/* Screen 7: Activity 1 – Places vocabulary grid & card flips */}
      {step === 7 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Place Vocabulary Flips</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of {totalSteps}</span>
          </div>

          <p className="text-xs text-zinc-400">
            Select a card to play its sound and flip. Then complete the mini-question below it.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {coreData?.places?.slice(0, 4).map((p: any, idx: number) => {
              const isActive = activePlaceCardIdx === idx;
              const isFlipped = flippedPlaceId === p.id;
              
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setActivePlaceCardIdx(idx);
                    setFlippedPlaceId(isFlipped ? null : p.id);
                    playAudio(p.korean);
                    // Reset MCQ
                    setPlaceCardChecked(false);
                    setPlaceCardSelectedOpt(null);
                    setPlaceCardCorrect(null);
                  }}
                  className={`glass-panel p-4 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                    isActive ? "border-brand-500 bg-brand-500/5 shadow-md" : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800"
                  }`}
                >
                  {!isFlipped ? (
                    <div className="space-y-1">
                      <div className="text-lg font-black text-white font-korean">{p.korean}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Place Card</div>
                    </div>
                  ) : (
                    <div className="animate-fade-in space-y-0.5">
                      <span className="text-sm font-black text-brand-400">{p.english}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto w-full text-left">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Vocab Drill: {coreData?.places?.[activePlaceCardIdx]?.korean}</h4>
            <p className="text-xs text-zinc-300 font-bold">Where do you go in this scenario?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCheckPlaceCard("A")}
                disabled={placeCardChecked}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                  placeCardSelectedOpt === "A"
                    ? placeCardCorrect
                      ? "border-accent-teal bg-accent-teal/15 text-white"
                      : "border-red-500 bg-red-500/10 text-white"
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                } ${placeCardChecked && (activePlaceCardIdx !== 1 ? "A" === "A" : "B" === "B") ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
              >
                {activePlaceCardIdx === 1 ? "To work" : activePlaceCardIdx === 0 ? "To study" : activePlaceCardIdx === 2 ? "To exercise" : "To travel"}
              </button>

              <button
                onClick={() => handleCheckPlaceCard("B")}
                disabled={placeCardChecked}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                  placeCardSelectedOpt === "B"
                    ? (activePlaceCardIdx === 1 ? placeCardCorrect : false)
                      ? "border-accent-teal bg-accent-teal/15 text-white"
                      : "border-red-500 bg-red-500/10 text-white"
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                } ${placeCardChecked && activePlaceCardIdx === 1 && "B" === "B" ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
              >
                {activePlaceCardIdx === 1 ? "To study" : "To rest"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen 8: Activity 2 – Location/Destination particles comparison */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Particle Matching</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 8 of {totalSteps}</span>
          </div>

          {practicePlaces.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-4 text-center">
                <p className="text-xs text-zinc-450">Which English meaning matches: <strong className="text-brand-300">"{practicePlaces[placeIdx]?.korean}"</strong>?</p>
                
                <div className="grid grid-cols-1 gap-2 pt-2">
                  {practicePlaces[placeIdx]?.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !placeChecked && setSelectedPlaceOpt(opt)}
                      disabled={placeChecked}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                        selectedPlaceOpt === opt
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-955 text-zinc-300 hover:border-white/10"
                      } ${placeChecked && opt === practicePlaces[placeIdx]?.correct ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${placeChecked && selectedPlaceOpt === opt && opt !== practicePlaces[placeIdx]?.correct ? "border-red-500 bg-red-500/10 text-white" : ""}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {placeChecked && (
                  <div className={`p-3 rounded-xl border text-xs text-left ${
                    placeCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    {placeCorrect ? "Correct particle check!" : "Incorrect mapping."}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  {!placeChecked ? (
                    <button
                      onClick={handleCheckPlace}
                      disabled={!selectedPlaceOpt}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setPlaceChecked(false);
                        setSelectedPlaceOpt(null);
                        setPlaceCorrect(null);
                        if (placeIdx < practicePlaces.length - 1) {
                          setPlaceIdx(placeIdx + 1);
                        } else {
                          setPlaceIdx(0);
                        }
                      }}
                      className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Next Place Matching
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 9: Activity 3 – Places listening MCQ & sentence translation */}
      {step === 9 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 3 – Places Sentence Translation</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 9 of {totalSteps}</span>
          </div>

          {practiceSentences.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-4 text-center">
                <p className="text-xs text-zinc-400">Listen to the sentence and select the correct translation:</p>
                
                <div className="py-2">
                  <button onClick={() => playAudio(practiceSentences[sentIdx]?.sentence)} className="p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 rounded-full transition flex items-center justify-center cursor-pointer shadow-md"><Volume2 className="w-6 h-6" /></button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {practiceSentences[sentIdx]?.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !sentChecked && setSelectedSentOpt(opt)}
                      disabled={sentChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                        selectedSentOpt === opt
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      } ${sentChecked && opt === practiceSentences[sentIdx]?.correct ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${sentChecked && selectedSentOpt === opt && opt !== practiceSentences[sentIdx]?.correct ? "border-red-500 bg-red-500/10 text-white" : ""}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {sentChecked && (
                  <div className={`p-3 rounded-xl border text-xs text-left ${
                    sentCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    {sentCorrect ? "Correct translation!" : "Incorrect sentence mapping."}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  {!sentChecked ? (
                    <button
                      onClick={handleCheckSent}
                      disabled={!selectedSentOpt}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Verify Translation
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSentChecked(false);
                        setSelectedSentOpt(null);
                        setSentCorrect(null);
                        if (sentIdx < practiceSentences.length - 1) {
                          setSentIdx(sentIdx + 1);
                        } else {
                          setSentIdx(0);
                        }
                      }}
                      className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Next Sentence
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 10: Activity 4 – Dialogue Q&A matching & custom sentence builder */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 4 – Dialog Match & Custom Builder</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 10 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="space-y-2 text-left">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold">Dialogue Match Check</span>
              <p className="text-xs text-zinc-300">Choose the grammatically appropriate reply to the question: <strong className="text-brand-300 font-korean font-bold">"{dialogueItems[dialogueIdx]?.question}"</strong></p>
              
              <div className="grid grid-cols-1 gap-2">
                {dialogueItems[dialogueIdx]?.options.map((opt: any) => (
                  <button
                    key={opt.id}
                    onClick={() => !dialogueChecked && setSelectedDialogueOptId(opt.id)}
                    disabled={dialogueChecked}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                      selectedDialogueOptId === opt.id
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    } ${dialogueChecked && opt.correct ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${dialogueChecked && selectedDialogueOptId === opt.id && !opt.correct ? "border-red-500 bg-red-500/10 text-white" : ""}`}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>

              {dialogueChecked && (
                <p className="text-[10px] text-zinc-400 leading-snug">{dialogueItems[dialogueIdx]?.explanation}</p>
              )}

              <div className="flex justify-end pt-1">
                {!dialogueChecked ? (
                  <button
                    onClick={handleCheckDialogue}
                    disabled={!selectedDialogueOptId}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check QA Reply
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setDialogueChecked(false);
                      setSelectedDialogueOptId(null);
                      setDialogueCorrect(null);
                      if (dialogueIdx < dialogueItems.length - 1) {
                        setDialogueIdx(dialogueIdx + 1);
                      } else {
                        setDialogueIdx(0);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next QA Pair
                  </button>
                )}
              </div>
            </div>

            {/* Part B: Custom Builder */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 space-y-4">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold">Custom Location Builder</span>
              
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400">Choose Place</label>
                  <select
                    value={selectedBuilderPlace}
                    onChange={(e) => setSelectedBuilderPlace(e.target.value)}
                    className="w-full bg-zinc-900 p-2.5 rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    {builderPlaces.map((p) => (
                      <option key={p.id} value={p.korean}>{p.korean} ({p.english})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400">Choose Pattern</label>
                  <select
                    value={selectedBuilderPattern}
                    onChange={(e) => setSelectedBuilderPattern(e.target.value)}
                    className="w-full bg-zinc-900 p-2.5 rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="location">에 있어요 (am at)</option>
                    <option value="destination">에 가요 (going to)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-center pt-1">
                <button
                  onClick={handleBuildSentence}
                  disabled={building}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-5 rounded-xl text-xs transition cursor-pointer"
                >
                  Assemble Builder
                </button>
              </div>

              {builtSentence && (
                <div className="bg-zinc-900/60 p-4 rounded-xl border border-brand-500/25 space-y-3 animate-fade-in text-center">
                  <p className="text-base font-black text-white font-korean">{builtSentence.final_korean_text}</p>
                  
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => playAudio(builtSentence.final_korean_text)}
                      className="p-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-full border border-brand-500/20 transition cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleSaveSentence}
                      disabled={savingSentence || sentenceSaved}
                      className="bg-accent-teal hover:bg-accent-teal/95 disabled:opacity-50 text-zinc-950 font-black py-1.5 px-4 rounded-lg text-xs transition cursor-pointer"
                    >
                      {savingSentence ? "Saving..." : sentenceSaved ? "Saved Successfully!" : "Save Sentence"}
                    </button>
                  </div>
                </div>
              )}

              {/* Builder Reflection MCQ */}
              <div className="bg-zinc-900/60 p-3 rounded-xl border border-white/5 space-y-2 text-left">
                <p className="text-xs text-zinc-300">Which pattern did you just use in your builder?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCheckBuilderReflect("location")}
                    disabled={builderReflectChecked}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                      builderReflectSelected === "location"
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    Location (에 있어요)
                  </button>
                  <button
                    onClick={() => handleCheckBuilderReflect("destination")}
                    disabled={builderReflectChecked}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                      builderReflectSelected === "destination"
                        ? "border-accent-teal bg-accent-teal/15 text-white"
                        : "border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    Destination (에 가요)
                  </button>
                </div>
                {builderReflectChecked && (
                  <p className="text-[10px] text-zinc-500 leading-snug">
                    Correct! Match the verb structure to determine location presence vs directional movement.
                  </p>
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
              <span>Mini-Quiz: Locations Check</span>
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
                      {["집", "학교", "회사", "카페", "식당", "마트", "공원", "역", "화장실", "에", "있어요", "가요"].map(ch => (
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

      {/* Screen 12: Homework & AI Location Practice */}
      {step === 12 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0 animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Phase 5 Complete! 🇰🇷🏫</h2>
            <p className="text-zinc-400 text-xs">You scored {quizScore}% on your locations check! You earned **150 XP**.</p>
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
              <h4 className="text-xs font-bold text-white">Location dialog coaching with Gwan-Sik</h4>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Starts an interactive roleplay room where Gwan-Sik asks where you are or where you are going, verifying location markers (`에 있어요`, `에 가요`).
              </p>
            </div>

            {tutorSession ? (
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 text-left space-y-2">
                <span className="text-[9px] font-black text-brand-400 uppercase tracking-wider block">Location Coach Active Session</span>
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
                <span>Practice places & directions with your AI tutor</span>
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
            <span>Finish Phase 5 & Earn XP</span>
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
