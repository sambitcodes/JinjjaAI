"use client";

import { useEffect, useState, useRef } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  Sparkles, 
  BookOpen, 
  Award, 
  Loader2, 
  CheckCircle2, 
  BrainCircuit, 
  BookMarked,
  HelpCircle,
  Eye,
  Speech,
  Headphones
} from "lucide-react";
import { apiRequest } from "../lib/api";
import xpAudit from "../lib/xp-audit.json";

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

interface Phase2ConsonantWizardProps {
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

export default function Phase2ConsonantWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Phase2ConsonantWizardProps) {
  const phaseNum = 2;
  const getStepMaxXP = (sNum: number) => {
    try {
      return (xpAudit as any)["1"]?.[phaseNum.toString()]?.steps?.[sNum.toString()]?.max_xp ?? 35;
    } catch (e) {
      return 35;
    }
  };
  const getStepXP = (sNum: number) => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(`hangeulai_c1p${phaseNum}_s${sNum}_earned_xp`) || "0", 10);
  };

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_phase2_step");
    const savedMax = localStorage.getItem("hangeulai_phase2_max_step");
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
      localStorage.setItem("hangeulai_phase2_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 11;

  // Persist step to localStorage for refresh resilience
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_phase2_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 11) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_phase2_step", String(step));
  }, [step]);

  // DB Data loaded dynamically
  const [metadata, setMetadata] = useState<any>(null);

  // Micro-question states for C1-C5
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
  

  // Concept Micro-questions definitions for Consonants
  const conceptQuestions: Record<number, MicroQuestion> = {
    2: {
      question: "When you say 'n' in English, which part touches the top of your mouth?",
      options: [
        { id: "A", text: "Tongue-front" },
        { id: "B", text: "Lips" },
        { id: "C", text: "Throat" }
      ],
      correctId: "A",
      explanation: "The n-sound (ㄴ) is made with the tongue touching the front roof of the mouth behind the upper teeth. Hangeul consonants trace these speech organ movements!"
    },
    3: {
      question: "Which consonant uses both lips together?",
      options: [
        { id: "A", text: "ㄴ (n)" },
        { id: "B", text: "ㅁ (m)" },
        { id: "C", text: "ㄱ (g/k)" }
      ],
      correctId: "B",
      explanation: "ㅁ (m) is the lips group consonant. Its box shape outline resembles closed lips."
    },
    4: {
      question: "When you say the aspirated version, which has more air puff on your hand?",
      options: [
        { id: "A", text: "The plain version (soft)" },
        { id: "B", text: "The aspirated version (breath puff)" }
      ],
      correctId: "B",
      explanation: "Aspirated consonants like ㅋ are pronounced with a strong puff of air that you can easily feel on your hand."
    },
    5: {
      question: "In the syllable block 아, is the circular placeholder (ㅇ) silent or like 'ng'?",
      options: [
        { id: "A", text: "Silent" },
        { id: "B", text: "Pronounced as 'ng'" }
      ],
      correctId: "A",
      explanation: "At the start of a block (before the vowel), ㅇ is silent. It only sounds like 'ng' at the bottom of the block (받침 position)."
    },
    6: {
      question: "In a horizontal-vowel syllable like 고, where is the consonant placed?",
      options: [
        { id: "A", text: "To the left of the vowel" },
        { id: "B", text: "Above the vowel" },
        { id: "C", text: "Below the vowel" }
      ],
      correctId: "B",
      explanation: "For horizontal/lying vowels like ㅗ, the consonant always sits ABOVE the vowel."
    }
  };

  // Step 7: Activity 1 (Visual Recognition)
  const [visualQuestions, setVisualQuestions] = useState<any[]>([]);
  const [visualIdx, setVisualIdx] = useState(0);
  const [visualChecked, setVisualChecked] = useState(false);
  const [visualCorrect, setVisualCorrect] = useState<boolean | null>(null);
  const [visualSelected, setVisualSelected] = useState<string | null>(null);

  // Step 8: Activity 2 (Ear Training)
  const [listeningQuestions, setListeningQuestions] = useState<any[]>([]);
  const [listeningIdx, setListeningIdx] = useState(0);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningCorrect, setListeningCorrect] = useState<boolean | null>(null);
  const [listeningSelected, setListeningSelected] = useState<string | null>(null);

  const [seriesQuestions, setSeriesQuestions] = useState<any[]>([]);
  const [seriesIdx, setSeriesIdx] = useState(0);
  const [seriesChecked, setSeriesChecked] = useState(false);
  const [seriesCorrect, setSeriesCorrect] = useState<boolean | null>(null);
  const [seriesSelected, setSeriesSelected] = useState<string | null>(null);
  const [hardestSeries, setHardestSeries] = useState<string | null>(null);

  // Step 9: Activity 3 (Syllables)
  const [syllableData, setSyllableData] = useState<any>(null);
  const [syllableBuildIdx, setSyllableBuildIdx] = useState(0);
  const [syllableBuildSelected, setSyllableBuildSelected] = useState<string | null>(null);
  const [syllableBuildChecked, setSyllableBuildChecked] = useState(false);
  const [syllableBuildCorrect, setSyllableBuildCorrect] = useState<boolean | null>(null);

  const [syllableReadIdx, setSyllableReadIdx] = useState(0);
  const [syllableReadPlayed, setSyllableReadPlayed] = useState(false);
  const [syllableReadSelfCheck, setSyllableReadSelfCheck] = useState<string | null>(null);

  // Step 10 (Checkpoint Quiz)
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizWriting, setQuizWriting] = useState("");
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [tutorSummary, setTutorSummary] = useState<string | null>(null);
  const [loadingTutorSummary, setLoadingTutorSummary] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // --- Start Progress State Preservation ---
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hangeulai_c1p2_progress_state");
        if (saved) {
          const state = JSON.parse(saved);
            // Deleted state.step override to allow teleportation
            // Deleted state.maxStep override to allow teleportation
            if (state.cSelected !== undefined) setCSelected(state.cSelected);
            if (state.cChecked !== undefined) setCChecked(state.cChecked);
            if (state.cCorrect !== undefined) setCCorrect(state.cCorrect);
            if (state.answeredConcepts !== undefined) setAnsweredConcepts(state.answeredConcepts);
            if (state.visualIdx !== undefined) setVisualIdx(state.visualIdx);
            if (state.visualChecked !== undefined) setVisualChecked(state.visualChecked);
            if (state.visualCorrect !== undefined) setVisualCorrect(state.visualCorrect);
            if (state.visualSelected !== undefined) setVisualSelected(state.visualSelected);
            if (state.listeningIdx !== undefined) setListeningIdx(state.listeningIdx);
            if (state.listeningChecked !== undefined) setListeningChecked(state.listeningChecked);
            if (state.listeningCorrect !== undefined) setListeningCorrect(state.listeningCorrect);
            if (state.listeningSelected !== undefined) setListeningSelected(state.listeningSelected);
            if (state.seriesIdx !== undefined) setSeriesIdx(state.seriesIdx);
            if (state.seriesChecked !== undefined) setSeriesChecked(state.seriesChecked);
            if (state.seriesCorrect !== undefined) setSeriesCorrect(state.seriesCorrect);
            if (state.seriesSelected !== undefined) setSeriesSelected(state.seriesSelected);
            if (state.syllableBuildIdx !== undefined) setSyllableBuildIdx(state.syllableBuildIdx);
            if (state.syllableBuildSelected !== undefined) setSyllableBuildSelected(state.syllableBuildSelected);
            if (state.syllableBuildChecked !== undefined) setSyllableBuildChecked(state.syllableBuildChecked);
            if (state.syllableBuildCorrect !== undefined) setSyllableBuildCorrect(state.syllableBuildCorrect);
            if (state.syllableReadIdx !== undefined) setSyllableReadIdx(state.syllableReadIdx);
            if (state.syllableReadSelfCheck !== undefined) setSyllableReadSelfCheck(state.syllableReadSelfCheck);
            if (state.quizIdx !== undefined) setQuizIdx(state.quizIdx);
            if (state.quizSelected !== undefined) setQuizSelected(state.quizSelected);
            if (state.quizWriting !== undefined) setQuizWriting(state.quizWriting);
            if (state.quizChecked !== undefined) setQuizChecked(state.quizChecked);
            if (state.quizCorrect !== undefined) setQuizCorrect(state.quizCorrect);
            if (state.quizScore !== undefined) setQuizScore(state.quizScore);
            if (state.quizMistakes !== undefined) setQuizMistakes(state.quizMistakes);
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
            answeredConcepts,
            visualIdx,
            visualChecked,
            visualCorrect,
            visualSelected,
            listeningIdx,
            listeningChecked,
            listeningCorrect,
            listeningSelected,
            seriesIdx,
            seriesChecked,
            seriesCorrect,
            seriesSelected,
            syllableBuildIdx,
            syllableBuildSelected,
            syllableBuildChecked,
            syllableBuildCorrect,
            syllableReadIdx,
            syllableReadSelfCheck,
            quizIdx,
            quizSelected,
            quizWriting,
            quizChecked,
            quizCorrect,
            quizScore,
            quizMistakes
        };
        localStorage.setItem("hangeulai_c1p2_progress_state", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save progress state:", e);
      }
    }
  }, [step, maxStep, cSelected, cChecked, cCorrect, answeredConcepts, visualIdx, visualChecked, visualCorrect, visualSelected, listeningIdx, listeningChecked, listeningCorrect, listeningSelected, seriesIdx, seriesChecked, seriesCorrect, seriesSelected, syllableBuildIdx, syllableBuildSelected, syllableBuildChecked, syllableBuildCorrect, syllableReadIdx, syllableReadSelfCheck, quizIdx, quizSelected, quizWriting, quizChecked, quizCorrect, quizScore, quizMistakes]);
  // --- End Progress State Preservation ---


  // Step 11 (Recommendations)
  const [recommendations, setRecommendations] = useState<any>(null);

  // Fetch Step Data Dynamically
  useEffect(() => {
    const fetchStepData = async () => {
      try {
        if (step === 1 && !metadata) {
          const data = await apiRequest("/lessons/lesson/phase2/metadata");
          setMetadata(data);
        } else if (step === 7 && visualQuestions.length === 0) {
          const data = await apiRequest("/lessons/practice/consonants/visual");
          setVisualQuestions(data || []);
        } else if (step === 8 && listeningQuestions.length === 0) {
          const lData = await apiRequest("/lessons/practice/consonants/listening");
          setListeningQuestions(lData || []);
          const sData = await apiRequest("/lessons/practice/consonants/series");
          setSeriesQuestions(sData || []);
        } else if (step === 9 && !syllableData) {
          const data = await apiRequest("/lessons/practice/syllables/basic");
          setSyllableData(data);
        } else if (step === 11 && !recommendations) {
          const data = await apiRequest("/lessons/recommendations/hangeul/phase2");
          setRecommendations(data);
        }
      } catch (err) {
        console.error("Error loading step data:", err);
      }
    };
    fetchStepData();
  }, [step]);

  const handleCheckConceptQuestion = () => {
    const q = conceptQuestions[step];
    if (!q || !cSelected) return;
    const isCorrect = cSelected === q.correctId;
    setCChecked(true);
    setCCorrect(isCorrect);
    setAnsweredConcepts(prev => ({ ...prev, [step]: { selected: cSelected, correct: isCorrect } }));
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
  };

  const handleCheckVisualAnswer = async () => {
    const q = visualQuestions[visualIdx];
    if (!q || !visualSelected) return;
    const isCorrect = visualSelected === q.correct_answer;
    setVisualChecked(true);
    setVisualCorrect(isCorrect);
    
    if (isCorrect) playCorrectSound();
    else playWrongSound();

    await apiRequest("/lessons/practice/consonants/visual/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: q.id, correct: isCorrect, answer: visualSelected })
    });
  };

  const handleCheckListeningAnswer = async () => {
    const q = listeningQuestions[listeningIdx];
    if (!q || !listeningSelected) return;
    const isCorrect = listeningSelected === q.correct_answer;
    setListeningChecked(true);
    setListeningCorrect(isCorrect);
    
    if (isCorrect) playCorrectSound();
    else playWrongSound();

    await apiRequest("/lessons/practice/consonants/listening/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: q.id, correct: isCorrect, answer: listeningSelected })
    });
  };

  const handleCheckSeriesAnswer = async () => {
    const q = seriesQuestions[seriesIdx];
    if (!q || !seriesSelected) return;
    const isCorrect = seriesSelected === q.correct_answer;
    setSeriesChecked(true);
    setSeriesCorrect(isCorrect);
    
    if (isCorrect) playCorrectSound();
    else playWrongSound();

    await apiRequest("/lessons/practice/consonants/series/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: q.id, correct: isCorrect, answer: seriesSelected })
    });
  };

  const handleCheckSyllableBuildAnswer = async () => {
    const item = syllableData?.build_tasks?.[syllableBuildIdx];
    if (!item || !syllableBuildSelected) return;
    const isCorrect = syllableBuildSelected === item.correct_answer;
    setSyllableBuildChecked(true);
    setSyllableBuildCorrect(isCorrect);

    if (isCorrect) playCorrectSound();
    else playWrongSound();

    await apiRequest("/lessons/practice/syllables/basic/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: item.id, correct: isCorrect, answer: syllableBuildSelected })
    });
  };

  const handleCheckQuiz = () => {
    const currentQuiz = quizQuestions[quizIdx];
    if (!currentQuiz) return;

    let isCorrect = false;
    if (currentQuiz.type === "choice") {
      isCorrect = quizSelected === currentQuiz.correct_answer;
    } else {
      isCorrect = quizWriting.trim().toLowerCase() === currentQuiz.correct_answer.trim().toLowerCase();
    }

    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
      setQuizMistakes((prev) => [...prev, currentQuiz.question]);
    }
  };

  const handleGenerateTutorSummary = async () => {
    setLoadingTutorSummary(true);
    try {
      const data = await apiRequest("/lessons/tutor/phase2/summary", {
        method: "POST",
        body: JSON.stringify({ mistakes: quizMistakes, score: quizScore || 0 }),
      });
      setTutorSummary(data.summary || "Summary generated");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutorSummary(false);
    }
  };

  const outlineSteps = [
    { num: 1, label: "Welcome & Goals" },
    { num: 2, label: "C1: What Consonants Show" },
    { num: 3, label: "C2: Core Consonants" },
    { num: 4, label: "C3: Plain/Aspirated/Tense" },
    { num: 5, label: "C4: Special ㅇ Letter" },
    { num: 6, label: "C5: Consonants in Blocks" },
    { num: 7, label: "Act 1: Visual Recognition" },
    { num: 8, label: "Act 2: Ear Training" },
    { num: 9, label: "Act 3: Syllable Reading" },
    { num: 10, label: "Checkpoint Quiz" },
    { num: 11, label: "Completion & Homework" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 1,
          phaseNum: 2,
          step: step
        }
      }));
    }
  }, [step]);

return (
    <div className="flex-grow flex flex-col justify-between">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center py-5 border-b border-white/5 mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-950 border border-white/10 shadow-lg">
            <BookOpen className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Phase 2</span>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Hangeul Consonants Bootcamp"}</span>
            </h2>
            <p className="text-xs text-zinc-400">Curated Topic: Consonant sounds &amp; symbols</p>
          </div>
        </div>

        {/* Active progress bar */}
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div className="flex-grow md:w-48 h-3 bg-zinc-900/80 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-brand-500 via-orange-500 to-amber-500 rounded-full transition-all duration-500" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-mono font-black text-white">{Math.round((step / totalSteps) * 100)}%</span>
            <span className="text-[10px] text-zinc-500 font-bold block">Step {step} of {totalSteps}</span>
          </div>
          <button 
            onClick={() => setShowOutline(!showOutline)}
            className="text-[10px] bg-zinc-950 border border-white/10 hover:bg-zinc-900 text-zinc-300 px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer uppercase tracking-wider font-bold shrink-0"
          >
            {showOutline ? "Hide Maps" : "View Outline"}
          </button>
        </div>
      </header>

      {/* Expanded Quick Outline Map Panel */}
      {showOutline && (() => {
        const phaseEarnedXP = outlineSteps.reduce((acc, s) => acc + getStepXP(s.num), 0);
        const phaseMaxXP = outlineSteps.reduce((acc, s) => acc + getStepMaxXP(s.num), 0);
        return (
          <div className="mb-6 p-5 bg-zinc-955/80 rounded-3xl border border-white/5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 relative z-30">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 font-mono">Curriculum Syllabus Map</span>
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">Required: 260 XP</span>
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
                      if (courseXP < 80) {
                        window.dispatchEvent(new CustomEvent("hangeulai-warning", {
                          detail: { message: "To start Phase 2, you need at least 80 XP in this course. You currently have " + courseXP + " XP." }
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
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center">
          <div className="p-4 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-12 h-12 animate-pulse shrink-0" />
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-white">Hangeul 0.2</h2>
          <h3 className="text-2xl md:text-3xl font-bold text-brand-400 mt-1">Consonant Bootcamp</h3>
          <p className="text-zinc-200 text-lg leading-relaxed max-w-4xl mx-auto">
            {metadata?.description || "Welcome back to Hangeul Bootcamp! Today you'll meet the 14 basic consonants and their tense/aspirated series. Explore visual mouth mappings, train your ear, and assemble syllable blocks."}
          </p>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-300 space-y-3.5 max-w-4xl mx-auto w-full">
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-2 text-zinc-200 pl-1 text-sm md:text-base">
              {(Array.isArray(metadata?.goals)
                ? metadata.goals
                : typeof metadata?.goals === "string"
                  ? [metadata.goals]
                  : [
                      "Recognise all 14 basic consonant letters: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ",
                      "Understand consonants as stylized mouth & tongue positions",
                      "Differentiate plain vs. aspirated vs. tense consonant series",
                      "Assemble basic CV syllables and master the double role of ㅇ"
                    ]
              ).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2 text-sm md:text-base"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 20} minutes</p>
            <p className="text-sm md:text-base"><strong>📋 Prerequisites:</strong> Phase 1 (Vowel Bootcamp)</p>
          </div>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button 
              onClick={() => {
    if (courseXP < 80) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 2, you need at least 80 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 15, type: 'theory' } }));
              }}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 px-10 rounded-xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 2</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Concept Screen Template (Steps 2 - 6) */}
      {step >= 2 && step <= 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5 font-sans">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>
                {step === 2 && "Screen C1: What do consonants show?"}
                {step === 3 && "Screen C2: Meet the core consonants"}
                {step === 4 && "Screen C3: Plain vs aspirated vs tense"}
                {step === 5 && "Screen C4: Special letter ㅇ: silent / ng"}
                {step === 6 && "Screen C5: Consonants inside syllable blocks"}
              </span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold font-sans">Concept {step - 1} of 5</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start text-left">
            <div className="space-y-5 text-base md:text-lg text-zinc-200 leading-relaxed">
              {step === 2 && (
                <div className="space-y-4">
                  <p>Unlike vowels, which represent open cosmic energies, Hangeul consonants were designed systematically as <strong>stylised diagrams of speech organs</strong>.</p>
                  <p>The symbols trace the shape of the mouth, tongue, teeth, or throat during articulation:</p>
                  <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 text-sm md:text-base">
                    <p className="font-bold text-white">Visual Organ Mappings:</p>
                    <ul className="list-disc list-inside space-y-2 pl-1 text-zinc-300">
                      <li><strong>ㄴ (n-sound)</strong>: traces the front of the tongue touching the roof of the mouth.</li>
                      <li><strong>ㅁ (m-sound)</strong>: resembles the closed box shape of lips.</li>
                      <li><strong>ㅇ (silent/ng)</strong>: represents the round opening of the throat.</li>
                    </ul>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-sm md:text-base">Let's group the 14 basic consonants by their speech organ origins:</p>
                  <div className="space-y-3 pt-2 text-sm md:text-base">
                    <ul className="space-y-2">
                      <li><strong className="text-white">Lips group:</strong> ㅁ (m), ㅂ (b/p), ㅍ (pʰ)</li>
                      <li><strong className="text-white">Tongue-front:</strong> ㄴ (n), ㄷ (d/t), ㅌ (tʰ), ㄹ (r/l)</li>
                      <li><strong className="text-white">Back of tongue:</strong> ㄱ (g/k), ㅋ (kʰ)</li>
                      <li><strong className="text-white">Fricatives & others:</strong> ㅅ (s), ㅈ (j), ㅊ (ch), ㅎ (h)</li>
                    </ul>
                    <p className="text-xs text-zinc-400">Tap the symbols in Activity 1 to hear native audio and read position notes.</p>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <p>Korean consonants are grouped into families defined by vocal tension and air release:</p>
                  <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4 text-sm md:text-base">
                    <p className="font-bold text-white">Three Articulation Levels:</p>
                    <ul className="space-y-2 text-zinc-300">
                      <li>• <strong>Plain:</strong> ㄱ (soft, relaxed sound with minimal air release).</li>
                      <li>• <strong>Aspirated:</strong> ㅋ (pronounced with a strong, conscious puff of air).</li>
                      <li>• <strong>Tense:</strong> ㄲ (doubled symbol, high vocal cord tension, short and tight sound).</li>
                    </ul>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <p>The circular consonant <strong>ㅇ</strong> has a dual, position-dependent personality:</p>
                  <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm md:text-base">
                    <p>• <strong>Syllable Start:</strong> Silent placeholder (아 sounds like ㅏ).</p>
                    <p>• <strong>Syllable Bottom (받침):</strong> Pronounced like the nasal 'ng' in the word "king" (앙 sounds like ang).</p>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <p>Korean syllable blocks combine consonants (C) and vowels (V):</p>
                  <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm md:text-base">
                    <p className="font-extrabold text-white">Placement Rules:</p>
                    <p>• **Vertical Vowels** (ㅣ, ㅏ, ㅓ, ㅑ, ㅕ) sit to the **right** of the consonant (e.g. 나).</p>
                    <p>• **Horizontal Vowels** (ㅡ, ㅗ, ㅜ, ㅛ, ㅠ) sit **below** the consonant (e.g. 고).</p>
                  </div>
                </div>
              )}
            </div>

            {/* Micro-question Section */}
            <div className="bg-zinc-900/40 p-8 rounded-2xl border border-white/5 space-y-6">
              <div className="flex items-center gap-2.5 text-xs text-brand-300 font-extrabold uppercase tracking-wider">
                <HelpCircle className="w-5 h-5" />
                <span>Check Your Understanding</span>
              </div>
              <h4 className="text-base md:text-lg font-bold text-white leading-normal">
                {conceptQuestions[step]?.question}
              </h4>
              <div className="space-y-3">
                {conceptQuestions[step]?.options.map((opt) => (
                  <button
                     key={opt.id}
                     onClick={() => !cChecked && setCSelected(opt.id)}
                     disabled={cChecked}
                     className={`w-full p-5 rounded-xl text-sm md:text-base font-bold border transition text-left ${
                       cSelected === opt.id
                         ? "border-brand-500 bg-brand-500/10 text-white"
                         : "border-white/5 bg-zinc-955/60 hover:bg-zinc-900 text-zinc-400"
                     } ${cChecked && opt.id === conceptQuestions[step]?.correctId ? "border-accent-teal bg-accent-teal/10 text-white" : ""} ${
                       cChecked && cSelected === opt.id && cSelected !== conceptQuestions[step]?.correctId ? "border-red-500 bg-red-500/10 text-red-400" : ""
                     }`}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>

              {cChecked && (
                <div className={`p-4 rounded-xl border text-sm leading-relaxed ${
                  cCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold mb-1 text-base">{cCorrect ? "Correct!" : "Incorrect."}</p>
                  <p>{conceptQuestions[step]?.explanation}</p>
                </div>
              )}

              {!cChecked && (
                <button
                  onClick={handleCheckConceptQuestion}
                  disabled={!cSelected}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-sm md:text-base transition cursor-pointer"
                >
                  Verify Answer
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 1 Phase 2 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 1 Phase 2 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(step - 1)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button 
              onClick={() => {
                setStep(step + 1);
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 15, type: 'theory' } }));
              }}
              disabled={!cChecked}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 7: Activity 1 – Visual Consonant Recognition */}
      {step === 7 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-brand-400" />
              <span>Activity 1: Consonant Gallery & Visual Recognition</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of {totalSteps}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
            {/* Consonant Gallery */}
            <div className="lg:col-span-5 bg-zinc-900/40 p-4 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-300 font-sans">Tap to hear & study</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { char: "ㄱ", label: "g / k" },
                  { char: "ㄴ", label: "n" },
                  { char: "ㄷ", label: "d / t" },
                  { char: "ㄹ", label: "r / l" },
                  { char: "ㅁ", label: "m" },
                  { char: "ㅂ", label: "b / p" },
                  { char: "ㅅ", label: "s" },
                  { char: "ㅇ", label: "silent/ng" },
                  { char: "ㅈ", label: "j" },
                  { char: "ㅊ", label: "ch" },
                  { char: "ㅋ", label: "k" },
                  { char: "ㅌ", label: "t" },
                  { char: "ㅍ", label: "p" },
                  { char: "ㅎ", label: "h" }
                ].map((item) => (
                  <button
                    key={item.char}
                    onClick={() => speakWord(item.char + "아")}
                    className="p-2 bg-zinc-950 border border-white/5 hover:border-brand-500/20 rounded-xl transition text-center group cursor-pointer"
                  >
                    <span className="text-xl font-black text-white block group-hover:scale-110 transition duration-150">{item.char}</span>
                    <span className="text-[9px] text-zinc-500 font-mono tracking-tighter block">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Test Panel */}
            <div className="lg:col-span-7 bg-zinc-900/40 p-5 rounded-2xl border border-white/5 space-y-4 w-full">
              {visualQuestions.length === 0 ? (
                <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
              ) : (
                <div className="space-y-4 w-full">
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                    <span>VISUAL CHECKPOINT</span>
                    <span>Q {visualIdx + 1}/{visualQuestions.length}</span>
                  </div>
                  <h3 className="text-sm font-black text-white leading-normal">
                    {visualQuestions[visualIdx]?.question}
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {visualQuestions[visualIdx]?.options.map((opt: string) => {
                      const isSelected = visualSelected === opt;
                      const isCorrectAnswer = opt === visualQuestions[visualIdx]?.correct_answer;
                      return (
                        <button
                          key={opt}
                          onClick={() => !visualChecked && setVisualSelected(opt)}
                          disabled={visualChecked}
                          className={`p-3.5 rounded-xl font-black text-xl border transition ${
                            isSelected
                              ? "border-brand-500 bg-brand-500/10 text-white"
                              : "border-white/5 bg-zinc-955/60 hover:bg-zinc-900 text-zinc-300"
                          } ${visualChecked && isCorrectAnswer ? "border-accent-teal bg-accent-teal/10 text-white" : ""} ${
                            visualChecked && isSelected && !isCorrectAnswer ? "border-red-500 bg-red-500/10 text-red-400" : ""
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {visualChecked && (
                    <div className={`p-3.5 rounded-xl border text-[11px] space-y-1 ${
                      visualCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                    }`}>
                      <p className="font-extrabold">{visualCorrect ? "맞아요! Correct!" : "Oops! Incorrect."}</p>
                      <p>{visualQuestions[visualIdx]?.explanation}</p>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    {!visualChecked ? (
                      <button
                        onClick={handleCheckVisualAnswer}
                        disabled={!visualSelected}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Check Answer
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setVisualChecked(false);
                          setVisualCorrect(null);
                          setVisualSelected(null);
                          if (visualIdx < visualQuestions.length - 1) {
                            setVisualIdx(visualIdx + 1);
                          } else {
                            setStep(8);
                          }
                        }}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        {visualIdx < visualQuestions.length - 1 ? "Next Question" : "Move to Activity 2"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 1 Phase 2 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 1 Phase 2 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(6)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(8)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Skip to Step 8 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 8: Activity 2 – Listening & Minimal Pairs */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Headphones className="w-6 h-6 text-brand-400" />
              <span>Activity 2: Ear Training & Series Triples</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 8 of {totalSteps}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start text-left">
            {/* 2A: Single Consonant Identification */}
            <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 space-y-5 w-full">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                <span>2A: IDENTIFICATION</span>
                <span>Q {listeningIdx + 1}/{listeningQuestions.length}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => speakWord(listeningQuestions[listeningIdx]?.audio_text)}
                  className="p-5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-full transition flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Volume2 className="w-7 h-7" />
                </button>
                <span className="text-sm text-zinc-400 font-bold">Play sound cue</span>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {listeningQuestions[listeningIdx]?.options.map((opt: string) => {
                  const isSelected = listeningSelected === opt;
                  const isCorrectAnswer = opt === listeningQuestions[listeningIdx]?.correct_answer;
                  return (
                    <button
                      key={opt}
                      onClick={() => !listeningChecked && setListeningSelected(opt)}
                      disabled={listeningChecked}
                      className={`p-4 rounded-xl font-black text-xl border transition ${
                        isSelected
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-955/60 hover:bg-zinc-900 text-zinc-300"
                      } ${listeningChecked && isCorrectAnswer ? "border-accent-teal bg-accent-teal/10 text-white" : ""} ${
                        listeningChecked && isSelected && !isCorrectAnswer ? "border-red-500 bg-red-500/10 text-red-400" : ""
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {listeningChecked && (
                <div className={`p-4 rounded-xl border text-sm space-y-1 ${
                  listeningCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold text-base">{listeningCorrect ? "Correct!" : "Incorrect."}</p>
                  <p>{listeningQuestions[listeningIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end">
                {!listeningChecked ? (
                  <button
                    onClick={handleCheckListeningAnswer}
                    disabled={!listeningSelected}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Answer
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setListeningChecked(false);
                      setListeningCorrect(null);
                      setListeningSelected(null);
                      if (listeningIdx < listeningQuestions.length - 1) {
                        setListeningIdx(listeningIdx + 1);
                      } else {
                        setListeningIdx(0);
                      }
                    }}
                    className="bg-accent-teal text-zinc-955 hover:bg-accent-teal/90 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {listeningIdx < listeningQuestions.length - 1 ? "Next Audio" : "Repeat Identification"}
                  </button>
                )}
              </div>
            </div>

            {/* 2B: Plain-Aspirated-Tense Triples */}
            <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 space-y-5 w-full">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                <span>2B: SERIES CONTRAST</span>
                <span>Group {seriesIdx + 1}/{seriesQuestions.length}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => speakWord(seriesQuestions[seriesIdx]?.correct_syllable)}
                  className="p-5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full transition flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Volume2 className="w-7 h-7" />
                </button>
                <span className="text-sm text-zinc-400 font-bold">Play triple sound</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {seriesQuestions[seriesIdx]?.options.map((opt: any) => {
                  const isSelected = seriesSelected === opt.symbol;
                  const isCorrectAnswer = opt.symbol === seriesQuestions[seriesIdx]?.correct_answer;
                  return (
                    <button
                      key={opt.symbol}
                      onClick={() => !seriesChecked && setSeriesSelected(opt.symbol)}
                      disabled={seriesChecked}
                      className={`p-3 rounded-xl border text-left space-y-1 transition ${
                        isSelected
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-955/60 hover:bg-zinc-900 text-zinc-300"
                      } ${seriesChecked && isCorrectAnswer ? "border-accent-teal bg-accent-teal/10 text-white" : ""} ${
                        seriesChecked && isSelected && !isCorrectAnswer ? "border-red-500 bg-red-500/10 text-red-400" : ""
                      }`}
                    >
                      <span className="text-lg font-black text-white block text-center">{opt.symbol}</span>
                      <span className="text-[9px] text-zinc-400 block text-center line-clamp-1">{opt.label.split(" - ").pop()}</span>
                    </button>
                  );
                })}
              </div>

              {seriesChecked && (
                <div className={`p-4 rounded-xl border text-sm leading-relaxed ${
                  seriesCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold text-base">{seriesCorrect ? "Excellent!" : "Acoustic mismatch."}</p>
                  <p>{seriesQuestions[seriesIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                {seriesIdx === seriesQuestions.length - 1 && seriesChecked && !hardestSeries && (
                  <div className="flex flex-col text-left gap-1.5">
                    <span className="text-[10px] text-zinc-500 font-extrabold uppercase">Which series is hardest?</span>
                    <div className="flex gap-1.5">
                      {["ㄱ/ㅋ/ㄲ", "ㄷ/ㅌ/ㄸ", "ㅂ/ㅍ/ㅃ", "ㅈ/ㅊ/ㅉ"].map(p => (
                        <button key={p} onClick={() => setHardestSeries(p)} className="px-3 py-1.5 bg-zinc-955 hover:bg-zinc-900 border border-white/5 text-[10px] font-extrabold rounded text-zinc-400 hover:text-white cursor-pointer">{p}</button>
                      ))}
                    </div>
                  </div>
                )}
                {hardestSeries && <span className="text-xs text-brand-300 font-bold">Hardest: {hardestSeries} logged!</span>}

                {!seriesChecked ? (
                  <button
                    onClick={handleCheckSeriesAnswer}
                    disabled={!seriesSelected}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Series
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSeriesChecked(false);
                      setSeriesCorrect(null);
                      setSeriesSelected(null);
                      if (seriesIdx < seriesQuestions.length - 1) {
                        setSeriesIdx(seriesIdx + 1);
                      } else {
                        setStep(9);
                      }
                    }}
                    className="bg-accent-teal text-zinc-955 hover:bg-accent-teal/90 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {seriesIdx < seriesQuestions.length - 1 ? "Next Series" : "Move to Activity 3"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 1 Phase 2 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 1 Phase 2 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(7)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(9)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Skip to Step 9 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 9: Activity 3 – Syllables combines & Reading */}
      {step === 9 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-brand-400" />
              <span>Activity 3: Assembling & Reading Syllables</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 9 of {totalSteps}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-left">
            {/* 3A: Syllable building */}
            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 space-y-4 w-full">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                <span>3A: BLOCK ASSEMBLY</span>
                <span>Task {syllableBuildIdx + 1}/{syllableData?.build_tasks?.length || 2}</span>
              </div>

              {syllableData?.build_tasks?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-300">
                    {syllableData.build_tasks[syllableBuildIdx]?.prompt}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {syllableData.build_tasks[syllableBuildIdx]?.options.map((opt: string) => {
                      const isSelected = syllableBuildSelected === opt;
                      const isCorrect = opt === syllableData.build_tasks[syllableBuildIdx]?.correct_answer;
                      return (
                        <button
                          key={opt}
                          onClick={() => !syllableBuildChecked && setSyllableBuildSelected(opt)}
                          disabled={syllableBuildChecked}
                          className={`p-3.5 rounded-xl font-black text-2xl border transition ${
                            isSelected
                              ? "border-brand-500 bg-brand-500/10 text-white"
                              : "border-white/5 bg-zinc-955/60 hover:bg-zinc-900 text-zinc-400"
                          } ${syllableBuildChecked && isCorrect ? "border-accent-teal bg-accent-teal/10 text-accent-teal" : ""} ${
                            syllableBuildChecked && isSelected && !isCorrect ? "border-red-500 bg-red-500/10 text-red-400" : ""
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {syllableBuildChecked && (
                    <div className={`p-3 rounded-xl border text-[11px] ${
                      syllableBuildCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                    }`}>
                      <p className="font-extrabold">{syllableBuildCorrect ? "Correct!" : "Incorrect."}</p>
                      <p>Visual mapping successfully assembled.</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    {!syllableBuildChecked ? (
                      <button
                        onClick={handleCheckSyllableBuildAnswer}
                        disabled={!syllableBuildSelected}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Verify Block
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSyllableBuildChecked(false);
                          setSyllableBuildCorrect(null);
                          setSyllableBuildSelected(null);
                          if (syllableBuildIdx < syllableData.build_tasks.length - 1) {
                            setSyllableBuildIdx(syllableBuildIdx + 1);
                          } else {
                            setSyllableBuildIdx(0);
                          }
                        }}
                        className="bg-accent-teal text-zinc-955 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        {syllableBuildIdx < syllableData.build_tasks.length - 1 ? "Next Block" : "Repeat Assembly"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3B: Read out loud self check */}
            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 space-y-4 w-full">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                <span>3B: READ OUT LOUD</span>
                <span>Syllable {syllableReadIdx + 1}/{syllableData?.grid?.length || 13}</span>
              </div>

              {syllableData?.grid?.length > 0 && (
                <div className="space-y-4 text-center">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block">Read this block:</span>
                  <span className="text-5xl font-black text-white block">{syllableData.grid[syllableReadIdx]?.syllable}</span>
                  
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => {
                        speakWord(syllableData.grid[syllableReadIdx]?.syllable);
                        setSyllableReadPlayed(true);
                      }}
                      className="w-full bg-zinc-955 hover:bg-zinc-900 border border-white/10 text-zinc-300 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4 text-brand-400" />
                      <span>Hear Native Model Accent</span>
                    </button>

                    {syllableReadPlayed && (
                      <div className="space-y-3 pt-2">
                        <p className="text-[10px] text-zinc-400 font-sans">Did your spoken pitch/tone match the native model?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSyllableReadSelfCheck("matched");
                              playCorrectSound();
                            }}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                              syllableReadSelfCheck === "matched" 
                                ? "bg-accent-teal/10 border-accent-teal text-accent-teal" 
                                : "bg-zinc-950 border-white/5 text-zinc-400"
                            }`}
                          >
                            ✓ Matched
                          </button>
                          <button
                            onClick={() => {
                              setSyllableReadSelfCheck("different");
                              playWrongSound();
                            }}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                              syllableReadSelfCheck === "different" 
                                ? "bg-red-500/10 border-red-500 text-red-400" 
                                : "bg-zinc-955 border-white/5 text-zinc-400"
                            }`}
                          >
                            ✗ Different
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        setSyllableReadPlayed(false);
                        setSyllableReadSelfCheck(null);
                        if (syllableReadIdx < syllableData.grid.length - 1) {
                          setSyllableReadIdx(syllableReadIdx + 1);
                        } else {
                          setStep(10);
                        }
                      }}
                      disabled={!syllableReadPlayed}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      {syllableReadIdx < syllableData.grid.length - 1 ? "Next Syllable" : "Move to Checkpoint Quiz"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 1 Phase 2 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 1 Phase 2 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(8)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(10)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Skip to Step 10 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 10: Checkpoint Quiz */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Step 10: Checkpoint Graduation Mini-Quiz</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 10 of {totalSteps}</span>
          </div>

          {quizQuestions.length === 0 ? (
            <div className="text-center py-10 max-w-2xl mx-auto space-y-8">
              <div className="p-4 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400">
                <BrainCircuit className="w-16 h-16 animate-pulse" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white">Generate Phase 2 Checkpoint</h3>
              </div>
              <div className="flex flex-col gap-4 pt-2 w-full max-w-md mx-auto">
                <button
                  onClick={async () => {
                    setLoadingQuiz(true);
                    try {
                      const data = await apiRequest("/lessons/quiz/phase2/generate?use_ai=false", { method: "POST" });
                      setQuizQuestions(data || []);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setLoadingQuiz(false);
                    }
                  }}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-bold py-4 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer"
                  disabled={loadingQuiz}
                >
                  {loadingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load Pre-Authored static Quiz"}
                </button>

                <button
                  onClick={async () => {
                    setLoadingQuiz(true);
                    try {
                      const data = await apiRequest("/lessons/quiz/phase2/generate?use_ai=true", { method: "POST" });
                      setQuizQuestions(data || []);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setLoadingQuiz(false);
                    }
                  }}
                  className="w-full bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-955 font-black py-4 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow shadow-brand-500/20 cursor-pointer"
                  disabled={loadingQuiz}
                >
                  {loadingQuiz ? <Loader2 className="w-4 h-4 animate-spin text-zinc-955" /> : <Sparkles className="w-4 h-4 text-zinc-955" />}
                  <span>Generate dynamic Quiz via Llama AI</span>
                </button>
              </div>
            </div>
          ) : quizScore === null ? (
            <div className="space-y-6 w-full text-left">
              <div className="flex justify-between text-xs text-zinc-500 font-mono">
                <span>Quiz Question {quizIdx + 1} of {quizQuestions.length}</span>
                <span>Level: Beginner</span>
              </div>

              <h3 className="text-xl md:text-2xl font-black text-white text-center leading-relaxed py-4">
                {quizQuestions[quizIdx]?.question}
              </h3>

              {quizQuestions[quizIdx]?.type === "choice" ? (
                <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {quizQuestions[quizIdx]?.options.map((opt: string) => {
                    const isSelected = quizSelected === opt;
                    const isCorrectAnswer = opt === quizQuestions[quizIdx]?.correct_answer;
                    return (
                      <button
                        key={opt}
                        onClick={() => !quizChecked && setQuizSelected(opt)}
                        disabled={quizChecked}
                        className={`p-5 rounded-xl font-black text-lg md:text-xl border transition ${
                          isSelected
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                        } ${quizChecked && isCorrectAnswer ? "border-accent-teal bg-accent-teal/10 text-white" : ""} ${
                          quizChecked && isSelected && !isCorrectAnswer ? "border-red-500 bg-red-500/10 text-red-400" : ""
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4 max-w-xl mx-auto w-full">
                  <input
                    type="text"
                    value={quizWriting}
                    onChange={(e) => setQuizWriting(e.target.value)}
                    placeholder="Type Hangeul consonant here..."
                    className="w-full bg-zinc-900/60 p-5 rounded-xl border border-white/10 outline-none focus:border-brand-500 text-center font-sans text-xl text-white"
                    disabled={quizChecked}
                    onKeyDown={(e) => e.key === "Enter" && !quizChecked && handleCheckQuiz()}
                  />
                  {/* keyboard row */}
                  {!quizChecked && (
                    <div className="flex flex-wrap gap-1.5 justify-center bg-zinc-900/30 p-4 rounded-2xl border border-white/5">
                      {["ㄱ", "ㄲ", "ㅋ", "ㄷ", "ㄸ", "ㅌ", "ㅂ", "ㅃ", "ㅍ", "ㅅ", "ㅆ", "ㅈ", "ㅉ", "ㅊ", "ㅇ", "ㅎ"].map((char) => (
                        <button
                          key={char}
                          onClick={() => setQuizWriting((prev) => prev + char)}
                          className="px-3.5 py-2 bg-zinc-850 hover:bg-zinc-750 text-sm font-bold text-white rounded-lg border border-white/5 cursor-pointer"
                        >
                          {char}
                        </button>
                      ))}
                      <button
                        onClick={() => setQuizWriting((prev) => prev.slice(0, -1))}
                        className="px-3.5 py-2 bg-red-955/20 text-red-400 hover:bg-red-955/40 text-sm font-bold rounded-lg border border-red-500/10 cursor-pointer"
                      >
                        Del
                      </button>
                    </div>
                  )}
                </div>
              )}

              {quizChecked && (
                <div className={`p-5 rounded-xl border text-sm text-left space-y-1.5 max-w-4xl mx-auto w-full ${
                  quizCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold text-base">{quizCorrect ? "Correct! Excellent." : "Incorrect."}</p>
                  <p>{quizQuestions[quizIdx]?.explanation}</p>
                  {!quizCorrect && <p className="font-mono mt-1 text-zinc-300">Correct Answer: {quizQuestions[quizIdx]?.correct_answer}</p>}
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t border-white/5 max-w-4xl mx-auto w-full">
                <button onClick={() => setStep(9)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={quizQuestions[quizIdx]?.type === "choice" ? !quizSelected : !quizWriting.trim()}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Checkpoint
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      setQuizChecked(false);
                      setQuizCorrect(null);
                      setQuizSelected(null);
                      setQuizWriting("");
                      if (quizIdx < quizQuestions.length - 1) {
                        setQuizIdx(quizIdx + 1);
                      } else {
                        const score = Math.round(((quizQuestions.length - quizMistakes.length) / quizQuestions.length) * 100);
                        setQuizScore(score);
                        await apiRequest("/lessons/quiz/phase2/submit", {
                          method: "POST",
                          body: JSON.stringify({ answers: [], score: score })
                        });
                      }
                    }}
                    className="bg-accent-teal text-zinc-955 hover:bg-accent-teal/90 px-6 py-3 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {quizIdx < quizQuestions.length - 1 ? "Next Item" : "See Final Score"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Score Results View */
            <div className="space-y-6 w-full text-center py-6">
              <div className="p-6 bg-zinc-900/60 rounded-3xl border border-white/5 space-y-4 max-w-2xl mx-auto w-full">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Checkpoint Complete</span>
                <h3 className="text-7xl font-black bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent font-mono">{quizScore}%</h3>
                <p className="text-zinc-200 text-sm leading-normal">
                  {quizScore >= 80 ? "Superb! You have mastered Hangeul consonants and CV combining." : "Good attempt! Let's do additional revisions."}
                </p>

                {/* dynamic Gwan-Sik AI report */}
                <div className="pt-2 text-left">
                  {tutorSummary ? (
                    <div className="bg-zinc-955 p-5 rounded-xl border border-brand-500/20 text-left text-sm leading-relaxed text-zinc-300">
                      <span className="text-[10px] font-black text-brand-400 block mb-1 uppercase tracking-widest font-sans">Gwan-Sik AI Feedback</span>
                      <p className="font-serif italic font-medium">"{tutorSummary}"</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerateTutorSummary}
                      className="bg-zinc-950 hover:bg-zinc-900 border border-brand-500/20 text-brand-400 hover:text-brand-300 font-bold px-5 py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
                      disabled={loadingTutorSummary}
                    >
                      {loadingTutorSummary ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating AI report...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Get Gwan-Sik feedback report via Llama AI</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5 max-w-2xl mx-auto w-full">
                <button 
                  onClick={() => {
                    setQuizQuestions([]);
                    setQuizIdx(0);
                    setQuizScore(null);
                    setQuizMistakes([]);
                    setTutorSummary(null);
                  }} 
                  className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition cursor-pointer"
                >
                  Retake Checkpoint
                </button>
                <button 
                  onClick={() => setStep(11)} 
                  className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  Go to homework <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 11: Complete Panel / Recommendations */}
      {step === 11 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center">
          <div className="p-4 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400">
            <Award className="w-12 h-12 animate-bounce" />
          </div>
          
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white font-sans">Consonants Bootcamp Complete! 🇰🇷✨</h2>
            <p className="text-zinc-300 text-sm md:text-base mt-2 font-medium">You are fully equipped to launch into syllable blocks construction next.</p>
          </div>

          {recommendations && (
            <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm space-y-4 font-sans leading-relaxed max-w-4xl mx-auto w-full">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-green-400 block mb-1 font-sans">Strengths</span>
                <p className="text-zinc-200 font-medium text-sm md:text-base">{recommendations.strength}</p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400 block mb-1 font-sans">Focus revisions</span>
                <p className="text-zinc-200 font-medium text-sm md:text-base">
                  {hardestSeries ? `Review series contrasts for ${hardestSeries}. ` : ""}
                  {recommendations.weakness}
                </p>
              </div>
              <div className="bg-zinc-955 p-5 rounded-xl border border-white/[0.03] space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-400 block font-sans">Recommended Practice Tasks:</span>
                <ul className="list-decimal list-inside space-y-2 text-zinc-400 pl-1 text-xs md:text-sm">
                  <li>
                    Search YouTube for: <strong className="text-white select-all">"{recommendations.youtube_search}"</strong> and observe mouth alignments.
                  </li>
                  <li>
                    Ask Gwan-Sik tomorrow: <strong className="text-brand-300">"Give me a 10-item consonants dictation quiz"</strong>.
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => {
    if (courseXP < 260) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To graduate from this course, you need at least 260 XP. You currently have " + courseXP + " XP. Please review earlier steps or re-answer incorrect questions to earn more XP!") } }));
      return;
    }onComplete();
  }}
              className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-955 font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 shadow-lg shadow-brand-500/20 cursor-pointer"
            >
              <span>Mark Phase 2 complete & continue</span>
              <ChevronRight className="w-5 h-5 text-zinc-955" />
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
                const bpIdx = (quizQuestions || []).findIndex((q: any) => q.correct_answer === m || q.question === m || q.correctId === m);
                if (bpIdx !== -1) {
                  if (typeof setQuizIdx === "function") setQuizIdx(bpIdx);
                if (typeof setQuizChecked === "function") setQuizChecked(false);
                if (typeof setQuizCorrect === "function") setQuizCorrect(null);
                if (typeof setQuizScore === "function") setQuizScore(null);
                if (typeof setQuizSelected === "function") setQuizSelected(null);
                if (typeof setQuizWriting === "function") setQuizWriting("");
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
