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

interface Phase1VowelBootcampWizardProps {
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

export default function Phase1VowelBootcampWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Phase1VowelBootcampWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 11;

  // Persist step to localStorage for refresh resilience
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_phase1_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 11) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_phase1_step", String(step));
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
  useEffect(() => {
    if (cChecked && cSelected !== null && cCorrect !== null && step >= 2 && step <= 6) {
      if (!answeredConcepts[step]) {
        setAnsweredConcepts(prev => ({
          ...prev,
          [step]: { selected: cSelected, correct: cCorrect }
        }));
      }
    }
  }, [cChecked, cSelected, cCorrect, step, answeredConcepts]);

  // Concept Micro-questions definitions
  const conceptQuestions: Record<number, MicroQuestion> = {
    2: {
      question: "What do you think a vowel is?",
      options: [
        { id: "A", text: "A sound made with an open mouth and free airflow" },
        { id: "B", text: "A sound made only by stopping air with your lips" },
        { id: "C", text: "A completely silent structural marker" }
      ],
      correctId: "A",
      explanation: "Vowels are voiced sounds created by changing your mouth shape without restricting the airflow. Consonants, on the other hand, build physical barriers."
    },
    3: {
      question: "On which side of the vertical line is the short stroke placed in the bright 'ah' vowel (ㅏ)?",
      options: [
        { id: "A", text: "Right side" },
        { id: "B", text: "Left side" },
        { id: "C", text: "Top side" },
        { id: "D", text: "Bottom side" }
      ],
      correctId: "A",
      explanation: "In ㅏ (ah), the stroke points to the right. In ㅓ (eo), it points to the left. Direction matters!"
    },
    4: {
      question: "Try saying 'ee' as in 'see' - which Hangeul vowel shape represents this tongue position?",
      options: [
        { id: "A", text: "ㅣ" },
        { id: "B", text: "ㅡ" },
        { id: "C", text: "ㅏ" },
        { id: "D", text: "ㅗ" }
      ],
      correctId: "A",
      explanation: "ㅣ is the vertical 'standing energy' vowel and sounds exactly like 'ee'. ㅡ is flat, and ㅏ is open."
    },
    5: {
      question: "Starting from the rounded lips 'o' vowel (ㅗ), what symbol is created when you add a second short stroke?",
      options: [
        { id: "A", text: "요 (yo)" },
        { id: "B", text: "야 (ya)" },
        { id: "C", text: "유 (yu)" }
      ],
      correctId: "A",
      explanation: "Adding a second stroke to ㅗ (o) gives you ㅛ (yo) or double-stroke version. Note: We use ㅛ (yo) to introduce the 'y' sound prefix."
    },
    6: {
      question: "In the syllable block 아, which part is silent?",
      options: [
        { id: "A", text: "The circular placeholder on the left (ㅇ)" },
        { id: "B", text: "The vertical vowel line on the right (ㅏ)" }
      ],
      correctId: "A",
      explanation: "ㅇ is a silent zero-consonant placeholder when placed at the start of a syllable. The syllable sounds just like ㅏ (ah)."
    }
  };

  // Step 7: Activity 1 (Visual Recognition - 1A Gallery & 1B Quiz)
  const [visualQuestions, setVisualQuestions] = useState<any[]>([]);
  const [visualIdx, setVisualIdx] = useState(0);
  const [visualChecked, setVisualChecked] = useState(false);
  const [visualCorrect, setVisualCorrect] = useState<boolean | null>(null);
  const [visualSelected, setVisualSelected] = useState<string | null>(null);

  // Step 8: Activity 2 (Ear Training - 2A Single & 2B Minimal Pairs)
  const [listeningQuestions, setListeningQuestions] = useState<any[]>([]);
  const [listeningIdx, setListeningIdx] = useState(0);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningCorrect, setListeningCorrect] = useState<boolean | null>(null);
  const [listeningSelected, setListeningSelected] = useState<string | null>(null);

  const [minPairs, setMinPairs] = useState<any[]>([]);
  const [minPairsIdx, setMinPairsIdx] = useState(0);
  const [minPairsChecked, setMinPairsChecked] = useState(false);
  const [minPairsCorrect, setMinPairsCorrect] = useState<boolean | null>(null);
  const [minPairsSelected, setMinPairsSelected] = useState<string | null>(null);
  const [hardestPair, setHardestPair] = useState<string | null>(null);

  // Step 9: Activity 3 (Syllables - 3A Hear & Pick, 3B See & Say)
  const [syllableHearIdx, setSyllableHearIdx] = useState(0);
  const [syllableHearSelected, setSyllableHearSelected] = useState<string | null>(null);
  const [syllableHearChecked, setSyllableHearChecked] = useState(false);
  const [syllableHearCorrect, setSyllableHearCorrect] = useState<boolean | null>(null);

  const [syllableSeeIdx, setSyllableSeeIdx] = useState(0);
  const [syllableSeePlayed, setSyllableSeePlayed] = useState(false);
  const [syllableSeeSelfCheck, setSyllableSeeSelfCheck] = useState<string | null>(null);

  const syllablesCV = [
    { syllable: "아", vowel: "ㅏ", description: "ㅇ + ㅏ (ah)" },
    { syllable: "어", vowel: "ㅓ", description: "ㅇ + ㅓ (eo)" },
    { syllable: "오", vowel: "ㅗ", description: "ㅇ + ㅗ (o)" },
    { syllable: "우", vowel: "ㅜ", description: "ㅇ + ㅜ (u)" },
    { syllable: "으", vowel: "ㅡ", description: "ㅇ + ㅡ (eu)" },
    { syllable: "이", vowel: "ㅣ", description: "ㅇ + ㅣ (i)" },
    { syllable: "야", vowel: "ㅑ", description: "ㅇ + ㅑ (ya)" },
    { syllable: "여", vowel: "ㅕ", description: "ㅇ + ㅕ (yeo)" },
    { syllable: "요", vowel: "요", description: "ㅇ + ㅛ (yo)" },
    { syllable: "유", vowel: "ㅠ", description: "ㅇ + ㅠ (yu)" }
  ];

  // Step 10 (Checkpoint Quiz)
  const [phase1Quiz, setPhase1Quiz] = useState<any[]>([]);
  const [p1QuizIdx, setP1QuizIdx] = useState(0);
  const [p1QuizSelected, setP1QuizSelected] = useState<string | null>(null);
  const [p1QuizWriting, setP1QuizWriting] = useState("");
  const [p1QuizChecked, setP1QuizChecked] = useState(false);
  const [p1QuizCorrect, setP1QuizCorrect] = useState<boolean | null>(null);
  const [p1QuizScore, setP1QuizScore] = useState<number | null>(null);
  const [p1QuizMistakes, setP1QuizMistakes] = useState<string[]>([]);
  const [tutorSummary, setTutorSummary] = useState<string | null>(null);
  const [loadingTutorSummary, setLoadingTutorSummary] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Step 11 (Recommendations)
  const [recommendations, setRecommendations] = useState<any>(null);

  // Fetch Step Data Dynamically
  useEffect(() => {
    const fetchStepData = async () => {
      try {
        if (step === 1 && !metadata) {
          const data = await apiRequest("/lessons/lesson/phase1/metadata");
          setMetadata(data);
        } else if (step === 7 && visualQuestions.length === 0) {
          const data = await apiRequest("/lessons/practice/vowels/visual");
          setVisualQuestions(data || []);
        } else if (step === 8 && listeningQuestions.length === 0) {
          const data = await apiRequest("/lessons/practice/vowels/listening");
          setListeningQuestions(data || []);
          const pairsData = await apiRequest("/lessons/practice/vowels/minimal-pairs");
          setMinPairs(pairsData || []);
        } else if (step === 11 && !recommendations) {
          const data = await apiRequest("/lessons/recommendations/hangeul/phase1");
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

    await apiRequest("/lessons/practice/vowels/visual/answer", {
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

    await apiRequest("/lessons/practice/vowels/listening/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: q.id, correct: isCorrect, answer: listeningSelected })
    });
  };

  const handleCheckMinPairAnswer = async () => {
    const q = minPairs[minPairsIdx];
    if (!q || !minPairsSelected) return;
    const isCorrect = minPairsSelected === q.correct_side;
    setMinPairsChecked(true);
    setMinPairsCorrect(isCorrect);
    
    if (isCorrect) playCorrectSound();
    else playWrongSound();

    await apiRequest("/lessons/practice/vowels/minimal-pairs/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: q.id, correct: isCorrect, answer: minPairsSelected })
    });
  };

  const handleCheckSyllableHearAnswer = async () => {
    const item = syllablesCV[syllableHearIdx];
    if (!item || !syllableHearSelected) return;
    const isCorrect = syllableHearSelected === item.vowel;
    setSyllableHearChecked(true);
    setSyllableHearCorrect(isCorrect);

    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  const handleCheckP1Quiz = () => {
    const currentQuiz = phase1Quiz[p1QuizIdx];
    if (!currentQuiz) return;

    let isCorrect = false;
    if (currentQuiz.type === "choice") {
      isCorrect = p1QuizSelected === currentQuiz.correct_answer;
    } else {
      isCorrect = p1QuizWriting.trim().toLowerCase() === currentQuiz.correct_answer.trim().toLowerCase();
    }

    setP1QuizChecked(true);
    setP1QuizCorrect(isCorrect);
    
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
      setP1QuizMistakes((prev) => [...prev, currentQuiz.question]);
    }
  };

  const handleGenerateTutorSummary = async () => {
    setLoadingTutorSummary(true);
    try {
      const data = await apiRequest("/lessons/tutor/phase1/summary", {
        method: "POST",
        body: JSON.stringify({ mistakes: p1QuizMistakes, score: p1QuizScore || 0 }),
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
    { num: 2, label: "C1: What are Vowels?" },
    { num: 3, label: "C2: 6 Basic Vowel Shapes" },
    { num: 4, label: "C3: Mouth & Tongue" },
    { num: 5, label: "C4: Y-Glide Vowels" },
    { num: 6, label: "C5: Syllables with ㅇ" },
    { num: 7, label: "Act 1: Visual Recognition" },
    { num: 8, label: "Act 2: Ear Training" },
    { num: 9, label: "Act 3: Simple Syllables" },
    { num: 10, label: "Checkpoint Quiz" },
    { num: 11, label: "Completion & Homework" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 1,
          phaseNum: 1,
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
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Phase 1</span>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Hangeul Vowels Bootcamp"}</span>
            </h2>
            <p className="text-xs text-zinc-400">Curated Topic: Vowel sounds &amp; symbols</p>
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
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center">
          <div className="p-4 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-12 h-12 animate-pulse shrink-0" />
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-white">Hangeul 0.1</h2>
          <h3 className="text-2xl md:text-3xl font-bold text-brand-400 mt-1">Vowel Bootcamp</h3>
          <p className="text-zinc-200 text-lg leading-relaxed max-w-4xl mx-auto">
            {metadata?.description || "Welcome to Hangeul! Today you'll learn Korean vowels: how they look, how they sound, and how they shape. Explore vertical and horizontal shapes, play audios, and graduation checks."}
          </p>
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-300 space-y-3.5 max-w-4xl mx-auto w-full">
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-2 text-zinc-200 pl-1 text-sm md:text-base">
              {(metadata?.goals || [
                "Recognize all 10 simple vowels visually",
                "Master mouth alignments and pronunciation nuances",
                "Identify syllables with silent placeholders"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2 text-sm md:text-base"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 20} minutes</p>
            <p className="text-sm md:text-base"><strong>📋 Prerequisites:</strong> {metadata?.prerequisites || "None (True Beginner)"}</p>
          </div>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button 
              onClick={() => {
                setStep(2);
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 15, type: 'theory' } }));
              }}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 px-10 rounded-xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 1</span>
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
                {step === 2 && "Screen C1: What are Korean vowels?"}
                {step === 3 && "Screen C2: The 6 Basic Vowel Shapes"}
                {step === 4 && "Screen C3: Mouth and Tongue Shapes"}
                {step === 5 && "Screen C4: Y-Glide Vowels"}
                {step === 6 && "Screen C5: Syllables with ㅇ + Vowels"}
              </span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold font-sans">Concept {step - 1} of 5</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start text-left">
            <div className="space-y-5 text-base md:text-lg text-zinc-200 leading-relaxed">
              {step === 2 && (
                <div className="space-y-4">
                  <p>Korean Hangeul splits letters into distinct consonants and vowels.</p>
                  <p>Unlike English where vowels change based on vocabulary rules, Korean vowels are highly logical, showing <strong>where your tongue and lips are positioned</strong>, and whether the sound is <strong>"bright" or "dark"</strong>.</p>
                  <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-4">
                    <p className="font-bold text-white text-base">Vowels are drawn from 3 elements representing cosmic elements:</p>
                    <ul className="list-disc list-inside space-y-2 pl-1 text-zinc-300 text-sm md:text-base">
                      <li><strong>ㅣ (standing line)</strong> represents Human (Standing energy)</li>
                      <li><strong>ㅡ (flat line)</strong> represents Earth</li>
                      <li><strong>• (dot / stroke)</strong> represents Sun (Heaven)</li>
                    </ul>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-black text-white text-base uppercase tracking-wide text-brand-300">Group 1 – "Standing" Vowels (Vertical base)</h4>
                    <ul className="space-y-2 text-sm md:text-base">
                      <li><strong className="text-white">ㅏ</strong>: stroke on the right (bright "ah" sound as in father)</li>
                      <li><strong className="text-white">ㅓ</strong>: stroke on the left (darker "eo", midway between aw and uh)</li>
                      <li><strong className="text-white">ㅣ</strong>: standing line only (close "ee" sound)</li>
                    </ul>
                  </div>
                  <div className="space-y-3 pt-2">
                    <h4 className="font-black text-white text-base uppercase tracking-wide text-amber-400">Group 2 – "Lying down" Vowels (Horizontal base)</h4>
                    <ul className="space-y-2 text-sm md:text-base">
                      <li><strong className="text-white">ㅗ</strong>: stroke above the line (rounded lips "o" as in home)</li>
                      <li><strong className="text-white">ㅜ</strong>: stroke below the line (rounded lips "u" as in food)</li>
                      <li><strong className="text-white">ㅡ</strong>: horizontal line only (flat tongue "eu" sound)</li>
                    </ul>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <p className="text-sm md:text-base">Observe how mouth positions align with Hangeul symbols:</p>
                  <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
                    <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5">
                      <strong className="text-white block text-sm md:text-base">ㅏ (ah)</strong> Open wide, tongue low.
                    </div>
                    <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5">
                      <strong className="text-white block text-sm md:text-base">ㅓ (eo)</strong> Relaxed, tongue lower-back.
                    </div>
                    <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5">
                      <strong className="text-white block text-sm md:text-base">ㅗ (o)</strong> Lips rounded tight, tongue mid-back.
                    </div>
                    <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5">
                      <strong className="text-white block text-sm md:text-base">ㅜ (u)</strong> Lips protruded, tongue high-back.
                    </div>
                    <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5">
                      <strong className="text-white block text-sm md:text-base">ㅡ (eu)</strong> Tongue flat, grin lips sideways.
                    </div>
                    <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5">
                      <strong className="text-white block text-sm md:text-base">ㅣ (i)</strong> Lips spread wide, tongue high-front.
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <p>In Hangeul, adding a small second stroke to any basic vowel introduces a <strong>"y-" glide sound prefix</strong>.</p>
                  <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-3 text-sm md:text-base">
                    <p className="font-extrabold text-white">The Glide Vowel Pairs:</p>
                    <div className="grid grid-cols-2 gap-3 font-mono text-base">
                      <div>ㅏ (ah) ➔ <strong>야 (ya)</strong></div>
                      <div>ㅓ (eo) ➔ <strong>여 (yeo)</strong></div>
                      <div>ㅗ (o) ➔ <strong>요 (yo)</strong></div>
                      <div>ㅜ (u) ➔ <strong>유 (yu)</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <p>Korean syllables are structured into rectangular blocks. Every block <strong>must start with a consonant</strong>.</p>
                  <p>When a syllable begins with a vowel sound (with no initial consonant sound), we use the circular symbol <strong>ㅇ as a silent placeholder</strong>.</p>
                  <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 space-y-2 text-sm md:text-base">
                    <p className="font-extrabold text-white">Examples:</p>
                    <p>• ㅇ + ㅏ = <strong>아</strong> (sounds like 'ah')</p>
                    <p>• ㅇ + ㅗ = <strong>오</strong> (sounds like 'o')</p>
                    <p>• ㅇ + ㅣ = <strong>이</strong> (sounds like 'ee')</p>
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

      {/* Step 7: Activity 1 – Visual Recognition */}
      {step === 7 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-brand-400" />
              <span>Activity 1: Vowel Gallery & Visual Recognition</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of {totalSteps}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
            {/* Gallery Panel */}
            <div className="lg:col-span-5 bg-zinc-900/40 p-4 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-300">Tap to hear & study</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { char: "ㅏ", label: "a / ah" },
                  { char: "ㅓ", label: "eo / uh" },
                  { char: "ㅗ", label: "o" },
                  { char: "ㅜ", label: "u / oo" },
                  { char: "ㅡ", label: "eu" },
                  { char: "ㅣ", label: "i / ee" },
                  { char: "양", label: "ya" }, // mapping helper
                  { char: "여", label: "yeo" },
                  { char: "요", label: "yo" },
                  { char: "유", label: "yu" }
                ].map((item) => {
                  const speakChar = item.char === "양" ? "야" : item.char;
                  const displayChar = item.char === "양" ? "야" : item.char;
                  return (
                    <button
                      key={item.char}
                      onClick={() => speakWord(speakChar)}
                      className="p-2.5 bg-zinc-950 border border-white/5 hover:border-brand-500/20 rounded-xl transition text-center group cursor-pointer"
                    >
                      <span className="text-2xl font-black text-white block group-hover:scale-110 transition duration-150">{displayChar}</span>
                      <span className="text-[9px] text-zinc-500 font-mono tracking-tighter block">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Test Panel */}
            <div className="lg:col-span-7 bg-zinc-900/40 p-5 rounded-2xl border border-white/5 space-y-4">
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
                              : "border-white/5 bg-zinc-950/60 hover:bg-zinc-900 text-zinc-300"
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
            <button onClick={() => setStep(6)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(8)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Skip to Step 8 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 8: Activity 2 – Ear Training & Minimal Pairs */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Headphones className="w-6 h-6 text-brand-400" />
              <span>Activity 2: Ear Training & Minimal Pairs</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 8 of {totalSteps}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start text-left">
            {/* 2A: Single Vowel Identification */}
            <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 space-y-5">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                <span>2A: IDENTIFICATION</span>
                <span>Q {listeningIdx + 1}/{listeningQuestions.length || 6}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => speakWord(listeningQuestions[listeningIdx]?.sound_text)}
                  className="p-5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-full transition flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Volume2 className="w-7 h-7" />
                </button>
                <span className="text-sm text-zinc-400 font-bold">Play the audio cue</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {listeningIdx < listeningQuestions.length - 1 ? "Next Audio" : "Repeat Identification"}
                  </button>
                )}
              </div>
            </div>

            {/* 2B: Minimal Pairs Ear Training */}
            <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 space-y-5">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                <span>2B: MINIMAL PAIRS</span>
                <span>Pair {minPairsIdx + 1}/{minPairs.length || 3}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => speakWord(minPairs[minPairsIdx]?.audio_text)}
                  className="p-5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full transition flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Volume2 className="w-7 h-7" />
                </button>
                <span className="text-sm text-zinc-400 font-bold">Play minimal pair sound</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => !minPairsChecked && setMinPairsSelected("left")}
                  disabled={minPairsChecked}
                  className={`p-4 rounded-xl border text-left space-y-2 transition ${
                    minPairsSelected === "left"
                      ? "border-brand-500 bg-brand-500/10 text-white"
                      : "border-white/5 bg-zinc-955/60 hover:bg-zinc-900 text-zinc-300"
                  } ${minPairsChecked && minPairs[minPairsIdx]?.correct_side === "left" ? "border-accent-teal bg-accent-teal/10" : ""}`}
                >
                  <span className="text-[10px] font-bold text-zinc-500 block">LEFT</span>
                  <div className="text-3xl font-black text-white">{minPairs[minPairsIdx]?.pair[0]}</div>
                  <div className="text-xs text-zinc-400 line-clamp-1">{minPairs[minPairsIdx]?.left_hint}</div>
                </button>

                <button
                  onClick={() => !minPairsChecked && setMinPairsSelected("right")}
                  disabled={minPairsChecked}
                  className={`p-4 rounded-xl border text-left space-y-2 transition ${
                    minPairsSelected === "right"
                      ? "border-brand-500 bg-brand-500/10 text-white"
                      : "border-white/5 bg-zinc-955/60 hover:bg-zinc-900 text-zinc-300"
                  } ${minPairsChecked && minPairs[minPairsIdx]?.correct_side === "right" ? "border-accent-teal bg-accent-teal/10" : ""}`}
                >
                  <span className="text-[10px] font-bold text-zinc-500 block">RIGHT</span>
                  <div className="text-3xl font-black text-white">{minPairs[minPairsIdx]?.pair[1]}</div>
                  <div className="text-xs text-zinc-400 line-clamp-1">{minPairs[minPairsIdx]?.right_hint}</div>
                </button>
              </div>

              {minPairsChecked && (
                <div className={`p-4 rounded-xl border text-sm leading-relaxed ${
                  minPairsCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold text-base">{minPairsCorrect ? "Excellent!" : "Acoustic mismatch."}</p>
                  <p>You heard: <strong>{minPairs[minPairsIdx]?.correct_sound}</strong></p>
                </div>
              )}

              <div className="flex justify-between items-center">
                {minPairsIdx === minPairs.length - 1 && minPairsChecked && !hardestPair && (
                  <div className="flex flex-col text-left gap-1.5">
                    <span className="text-[10px] text-zinc-500 font-extrabold uppercase">Which pair is hardest?</span>
                    <div className="flex gap-1.5">
                      {["ㅏ/ㅓ", "ㅗ/ㅜ", "ㅡ/ㅣ"].map(p => (
                        <button key={p} onClick={() => setHardestPair(p)} className="px-3 py-1.5 bg-zinc-955 hover:bg-zinc-900 border border-white/5 text-[10px] font-extrabold rounded text-zinc-400 hover:text-white cursor-pointer">{p}</button>
                      ))}
                    </div>
                  </div>
                )}
                {hardestPair && <span className="text-xs text-brand-300 font-bold">Hardest pair: {hardestPair} logged!</span>}

                {!minPairsChecked ? (
                  <button
                    onClick={handleCheckMinPairAnswer}
                    disabled={!minPairsSelected}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Pair
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMinPairsChecked(false);
                      setMinPairsCorrect(null);
                      setMinPairsSelected(null);
                      if (minPairsIdx < minPairs.length - 1) {
                        setMinPairsIdx(minPairsIdx + 1);
                      } else {
                        setStep(9);
                      }
                    }}
                    className="bg-accent-teal text-zinc-955 hover:bg-accent-teal/90 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {minPairsIdx < minPairs.length - 1 ? "Next Pair" : "Move to Activity 3"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(7)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(9)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Skip to Step 9 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 9: Activity 3 – Vowels inside Simple Syllables */}
      {step === 9 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-brand-400" />
              <span>Activity 3: Vowels inside Simple Syllables</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 9 of {totalSteps}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-left">
            {/* 3A: Hear Syllable -> Pick Vowel */}
            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                <span>3A: HEAR & EXTRACT VOWEL</span>
                <span>Syllable {syllableHearIdx + 1}/{syllablesCV.length}</span>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => speakWord(syllablesCV[syllableHearIdx]?.syllable)}
                  className="p-4 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-full transition flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
                <div className="text-left">
                  <span className="text-2xl font-black text-white">{syllablesCV[syllableHearIdx]?.syllable}</span>
                  <span className="text-[10px] text-zinc-500 block">Hear and extract the core vowel shape</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ", "ㅑ", "ㅕ", "ㅛ", "ㅠ"].map((v) => {
                  const isSelected = syllableHearSelected === v;
                  const isCorrect = v === syllablesCV[syllableHearIdx]?.vowel;
                  return (
                    <button
                      key={v}
                      onClick={() => !syllableHearChecked && setSyllableHearSelected(v)}
                      disabled={syllableHearChecked}
                      className={`w-10 h-10 rounded-lg font-black text-sm border transition flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-955/60 hover:bg-zinc-900 text-zinc-400"
                      } ${syllableHearChecked && isCorrect ? "border-accent-teal bg-accent-teal/10 text-accent-teal" : ""} ${
                        syllableHearChecked && isSelected && !isCorrect ? "border-red-500 bg-red-500/10 text-red-400" : ""
                      }`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>

              {syllableHearChecked && (
                <div className={`p-3 rounded-xl border text-[11px] ${
                  syllableHearCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold">{syllableHearCorrect ? "Correct!" : "Incorrect."}</p>
                  <p>The syllable <strong>{syllablesCV[syllableHearIdx]?.syllable}</strong> uses the vowel <strong>{syllablesCV[syllableHearIdx]?.vowel}</strong>.</p>
                </div>
              )}

              <div className="flex justify-end">
                {!syllableHearChecked ? (
                  <button
                    onClick={handleCheckSyllableHearAnswer}
                    disabled={!syllableHearSelected}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Extract
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSyllableHearChecked(false);
                      setSyllableHearCorrect(null);
                      setSyllableHearSelected(null);
                      if (syllableHearIdx < syllablesCV.length - 1) {
                        setSyllableHearIdx(syllableHearIdx + 1);
                      } else {
                        setSyllableHearIdx(0);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {syllableHearIdx < syllablesCV.length - 1 ? "Next Syllable" : "Repeat Mapping"}
                  </button>
                )}
              </div>
            </div>

            {/* 3B: See Syllable -> Say and Self-Check */}
            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                <span>3B: READ OUT LOUD</span>
                <span>Syllable {syllableSeeIdx + 1}/{syllablesCV.length}</span>
              </div>

              <div className="text-center py-4 space-y-2">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block">Read this block:</span>
                <span className="text-5xl font-black text-white block">{syllablesCV[syllableSeeIdx]?.syllable}</span>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    speakWord(syllablesCV[syllableSeeIdx]?.syllable);
                    setSyllableSeePlayed(true);
                  }}
                  className="w-full bg-zinc-955 hover:bg-zinc-900 border border-white/10 text-zinc-300 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-brand-400" />
                  <span>Hear Native Model Accent</span>
                </button>

                {syllableSeePlayed && (
                  <div className="space-y-3 pt-2 text-center">
                    <p className="text-[10px] text-zinc-400 font-sans">Did your spoken pitch/tone match the native model?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSyllableSeeSelfCheck("matched");
                          playCorrectSound();
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                          syllableSeeSelfCheck === "matched" 
                            ? "bg-accent-teal/10 border-accent-teal text-accent-teal" 
                            : "bg-zinc-950 border-white/5 text-zinc-400"
                        }`}
                      >
                        ✓ Matched
                      </button>
                      <button
                        onClick={() => {
                          setSyllableSeeSelfCheck("different");
                          playWrongSound();
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                          syllableSeeSelfCheck === "different" 
                            ? "bg-red-500/10 border-red-500 text-red-400" 
                            : "bg-zinc-950 border-white/5 text-zinc-400"
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
                    setSyllableSeePlayed(false);
                    setSyllableSeeSelfCheck(null);
                    if (syllableSeeIdx < syllablesCV.length - 1) {
                      setSyllableSeeIdx(syllableSeeIdx + 1);
                    } else {
                      setStep(10);
                    }
                  }}
                  disabled={!syllableSeePlayed}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {syllableSeeIdx < syllablesCV.length - 1 ? "Next Syllable" : "Move to Checkpoint Quiz"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
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

          {phase1Quiz.length === 0 ? (
            <div className="text-center py-10 max-w-2xl mx-auto space-y-8">
              <div className="p-4 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400">
                <BrainCircuit className="w-16 h-16 animate-pulse" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white">Generate Phase 1 Checkpoint</h3>
              </div>
              <div className="flex flex-col gap-4 pt-2 w-full max-w-md mx-auto">
                <button
                  onClick={async () => {
                    setLoadingQuiz(true);
                    try {
                      const data = await apiRequest("/lessons/quiz/phase1/generate?use_ai=false", { method: "POST" });
                      setPhase1Quiz(data || []);
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
                      const data = await apiRequest("/lessons/quiz/phase1/generate?use_ai=true", { method: "POST" });
                      setPhase1Quiz(data || []);
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
          ) : p1QuizScore === null ? (
            <div className="space-y-6 w-full text-left">
              <div className="flex justify-between text-xs text-zinc-500 font-mono">
                <span>Quiz Question {p1QuizIdx + 1} of {phase1Quiz.length}</span>
                <span>Level: Beginner</span>
              </div>

              <h3 className="text-xl md:text-2xl font-black text-white text-center leading-relaxed py-4">
                {phase1Quiz[p1QuizIdx]?.question}
              </h3>

              {phase1Quiz[p1QuizIdx]?.type === "choice" ? (
                <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {phase1Quiz[p1QuizIdx]?.options.map((opt: string) => {
                    const isSelected = p1QuizSelected === opt;
                    const isCorrectAnswer = opt === phase1Quiz[p1QuizIdx]?.correct_answer;
                    return (
                      <button
                        key={opt}
                        onClick={() => !p1QuizChecked && setP1QuizSelected(opt)}
                        disabled={p1QuizChecked}
                        className={`p-5 rounded-xl font-black text-lg md:text-xl border transition ${
                          isSelected
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                        } ${p1QuizChecked && isCorrectAnswer ? "border-accent-teal bg-accent-teal/10 text-white" : ""} ${
                          p1QuizChecked && isSelected && !isCorrectAnswer ? "border-red-500 bg-red-500/10 text-red-400" : ""
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
                    value={p1QuizWriting}
                    onChange={(e) => setP1QuizWriting(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full bg-zinc-900/60 p-5 rounded-xl border border-white/10 outline-none focus:border-brand-500 text-center font-sans text-xl text-white"
                    disabled={p1QuizChecked}
                    onKeyDown={(e) => e.key === "Enter" && !p1QuizChecked && handleCheckP1Quiz()}
                  />
                  {/* keyboard row */}
                  {!p1QuizChecked && (
                    <div className="flex flex-wrap gap-1.5 justify-center bg-zinc-900/30 p-4 rounded-2xl border border-white/5">
                      {["아", "어", "오", "우", "으", "이", "아기", "어머니", "오이", "우유"].map((char) => (
                        <button
                          key={char}
                          onClick={() => setP1QuizWriting((prev) => prev + char)}
                          className="px-3.5 py-2 bg-zinc-850 hover:bg-zinc-750 text-sm font-bold text-white rounded-lg border border-white/5 cursor-pointer"
                        >
                          {char}
                        </button>
                      ))}
                      <button
                        onClick={() => setP1QuizWriting((prev) => prev.slice(0, -1))}
                        className="px-3.5 py-2 bg-red-950/20 text-red-400 hover:bg-red-950/40 text-sm font-bold rounded-lg border border-red-500/10 cursor-pointer"
                      >
                        Del
                      </button>
                    </div>
                  )}
                </div>
              )}

              {p1QuizChecked && (
                <div className={`p-5 rounded-xl border text-sm text-left space-y-1.5 max-w-4xl mx-auto w-full ${
                  p1QuizCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold text-base">{p1QuizCorrect ? "Correct! Excellent." : "Incorrect."}</p>
                  <p>{phase1Quiz[p1QuizIdx]?.explanation}</p>
                  {!p1QuizCorrect && <p className="font-mono mt-1 text-zinc-300">Correct Answer: {phase1Quiz[p1QuizIdx]?.correct_answer}</p>}
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t border-white/5 max-w-4xl mx-auto w-full">
                <button onClick={() => setStep(9)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                {!p1QuizChecked ? (
                  <button
                    onClick={handleCheckP1Quiz}
                    disabled={phase1Quiz[p1QuizIdx]?.type === "choice" ? !p1QuizSelected : !p1QuizWriting.trim()}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Checkpoint
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      setP1QuizChecked(false);
                      setP1QuizCorrect(null);
                      setP1QuizSelected(null);
                      setP1QuizWriting("");
                      if (p1QuizIdx < phase1Quiz.length - 1) {
                        setP1QuizIdx(p1QuizIdx + 1);
                      } else {
                        const score = Math.round(((phase1Quiz.length - p1QuizMistakes.length) / phase1Quiz.length) * 100);
                        setP1QuizScore(score);
                        await apiRequest("/lessons/quiz/phase1/submit", {
                          method: "POST",
                          body: JSON.stringify({ answers: [], score: score })
                        });
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-3 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {p1QuizIdx < phase1Quiz.length - 1 ? "Next Item" : "See Final Score"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Score Results View */
            <div className="space-y-6 w-full text-center py-6">
              <div className="p-6 bg-zinc-900/60 rounded-3xl border border-white/5 space-y-4 max-w-2xl mx-auto w-full">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Checkpoint Complete</span>
                <h3 className="text-7xl font-black bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent font-mono">{p1QuizScore}%</h3>
                <p className="text-zinc-200 text-sm leading-normal">
                  {p1QuizScore >= 80 ? "Superb! You have mastered Hangeul vowels and simple syllables." : "Good attempt! Let's do additional revisions."}
                </p>

                {/* demand trigger Llama tutor feedback summary */}
                <div className="pt-2 text-left">
                  {tutorSummary ? (
                    <div className="bg-zinc-955 p-5 rounded-xl border border-brand-500/20 text-left text-sm leading-relaxed text-zinc-300">
                      <span className="text-[10px] font-black text-brand-400 block mb-1 uppercase tracking-widest font-sans animate-fade-in">Gwan-Sik AI Feedback</span>
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
                    setPhase1Quiz([]);
                    setP1QuizIdx(0);
                    setP1QuizScore(null);
                    setP1QuizMistakes([]);
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
            <h2 className="text-3xl md:text-4xl font-black text-white font-sans">Vowels Bootcamp Complete! 🇰🇷✨</h2>
            <p className="text-zinc-300 text-sm md:text-base mt-2 font-medium">You are fully equipped to launch your consonant mapping drills next.</p>
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
                  {hardestPair ? `Review sound contrasts for ${hardestPair}. ` : ""}
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
                    Ask Gwan-Sik tomorrow: <strong className="text-brand-300">"Give me a 10-item vowel dictation quiz"</strong>.
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={onComplete}
              className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-955 font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 shadow-lg shadow-brand-500/20 cursor-pointer"
            >
              <span>Mark Phase 1 complete & continue</span>
              <ChevronRight className="w-5 h-5 text-zinc-955" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
