"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Sparkles,
  BookOpen,
  Award,
  Loader2,
  CheckCircle2,
  RotateCcw,
  HelpCircle,
  BrainCircuit,
  BookMarked
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

interface Phase4RealWordsWizardProps {
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

export default function Phase4RealWordsWizard({ activeLesson, speakWord, onComplete,
  courseXP }: Phase4RealWordsWizardProps) {
  const getStepMaxXP = (sNum: number) => {
    if (sNum === 1) return 0;
    if (sNum === 13) return 200;
    const sObj = outlineSteps.find(os => os.num === sNum);
    const label = sObj ? sObj.label.toLowerCase() : "";
    if (label.includes("activity") || label.includes("game") || label.includes("drill") || label.includes("practice")) return 60;
    return 35;
  };
  const getStepXP = (sNum: number) => {
    return (sNum < step || sNum <= maxStep) ? getStepMaxXP(sNum) : 0;
  };

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_phase4_step");
    const savedMax = localStorage.getItem("hangeulai_phase4_max_step");
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
      localStorage.setItem("hangeulai_phase4_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 13;

  // Persist step to localStorage for refresh resilience
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_phase4_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 13) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_phase4_step", String(step));
  }, [step]);

  const [metadata, setMetadata] = useState<any>(null);
  const [content, setContent] = useState<any>(null);

  // Micro-question states for C1-C6
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
      question: "Which category does the word 버스 (bus) belong to?",
      options: [
        { id: "A", text: "Native Korean" },
        { id: "B", text: "Sino-Korean" },
        { id: "C", text: "Foreign loanword" }
      ],
      correctId: "C",
      explanation: "버스 (beo-seu) is borrowed directly from English 'bus' phonetically, making it a foreign loanword (외래어)."
    },
    3: {
      question: "Which of these Hangeul words phonetically represents 'bus'?",
      options: [
        { id: "A", text: "버스" },
        { id: "B", text: "포스" },
        { id: "C", text: "비스" }
      ],
      correctId: "A",
      explanation: "버스 is read as beo-seu, which is the standard Hangeul transliteration for English 'bus'."
    },
    4: {
      question: "Which of these cities means 'New York' in Hangeul?",
      options: [
        { id: "A", text: "서울" },
        { id: "B", text: "도쿄" },
        { id: "C", text: "뉴욕" }
      ],
      correctId: "C",
      explanation: "뉴욕 represents 'New York' phonetically (뉴 = New, 역 = York)."
    },
    5: {
      question: "In the Korean personal name 박지민 (Park Jimin), which syllable represents the family name?",
      options: [
        { id: "A", text: "박 (Park)" },
        { id: "B", text: "지 (Ji)" },
        { id: "C", text: "민 (Min)" }
      ],
      correctId: "A",
      explanation: "Korean personal names put the family name first. In 박지민, 박 is the surname and 지민 is the given name."
    },
    6: {
      question: "Which Hangeul transliteration sounds phonetically identical to the name 'Lisa'?",
      options: [
        { id: "A", text: "리사" },
        { id: "B", text: "라이스" },
        { id: "C", text: "리즈" }
      ],
      correctId: "A",
      explanation: "리사 is pronounced 'ri-sa', representing 'Lisa'."
    },
    7: {
      question: "Which greeting phrase do you use when you are leaving a place and other people are staying?",
      options: [
        { id: "A", text: "안녕히 계세요 (Stay peacefully)" },
        { id: "B", text: "안녕히 가세요 (Go peacefully)" }
      ],
      correctId: "A",
      explanation: "Use '안녕히 계세요' (Stay peacefully) when leaving others behind. Use '안녕히 가세요' (Go peacefully) when they are leaving."
    }
  };

  // Step 8 (Activity 1 - Loanwords)
  const [loanwordList, setLoanwordList] = useState<any[]>([]);
  const [loanwordIdx, setLoanwordIdx] = useState(0);
  const [loanwordSelected, setLoanwordSelected] = useState<string | null>(null);
  const [loanwordChecked, setLoanwordChecked] = useState(false);
  const [loanwordCorrect, setLoanwordCorrect] = useState<boolean | null>(null);
  const [loanwordsMatched, setLoanwordsMatched] = useState<Record<string, string>>({});
  const [selectedLeftLoanword, setSelectedLeftLoanword] = useState<string | null>(null);
  const [loanwordsSubMode, setLoanwordsSubMode] = useState<"guess" | "match" | "speed">("guess");

  // Speed check timer & reflection
  const [speedTimer, setSpeedTimer] = useState<number | null>(null);
  const [speedFinished, setSpeedFinished] = useState(false);
  const [hardestWordSelection, setHardestWordSelection] = useState<string | null>(null);

  // Step 9 (Activity 2 - Countries & Cities)
  const [ccData, setCcData] = useState<any>(null);
  const [countryIdx, setCountryIdx] = useState(0);
  const [countrySelected, setCountrySelected] = useState<string | null>(null);
  const [countryChecked, setCountryChecked] = useState(false);
  const [countryCorrect, setCountryCorrect] = useState<boolean | null>(null);
  const [ccMatched, setCcMatched] = useState<Record<string, string>>({});
  const [selectedLeftCc, setSelectedLeftCc] = useState<string | null>(null);
  const [ccSubMode, setCcSubMode] = useState<"guess" | "match">("guess");

  // Step 10 (Activity 3 - Names & Transliteration)
  const [namesData, setNamesData] = useState<any>(null);
  const [nameIdx, setNameIdx] = useState(0);
  const [nameSelected, setNameSelected] = useState<string | null>(null);
  const [nameChecked, setNameChecked] = useState(false);
  const [nameCorrect, setNameCorrect] = useState<boolean | null>(null);
  const [namesMatched, setNamesMatched] = useState<Record<string, string>>({});
  const [selectedLeftName, setSelectedLeftName] = useState<string | null>(null);
  const [transInput, setTransInput] = useState("");
  const [transResults, setTransResults] = useState<string[]>([]);
  const [transExplanation, setTransExplanation] = useState("");
  const [loadingTrans, setLoadingTrans] = useState(false);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [namesSubMode, setNamesSubMode] = useState<"guess" | "match" | "transliterate">("match");

  // Step 11 (Activity 4 - Phrases)
  const [phrasesData, setPhrasesData] = useState<any>(null);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [showPhraseGloss, setShowPhraseGloss] = useState(false);
  const [phraseSelfChecks, setPhraseSelfChecks] = useState<Record<number, string>>({});
  const [phrasesMatched, setPhrasesMatched] = useState<Record<string, string>>({});
  const [selectedLeftPhrase, setSelectedLeftPhrase] = useState<string | null>(null);
  const [clozeIdx, setClozeIdx] = useState(0);
  const [clozeSelected, setClozeSelected] = useState<string | null>(null);
  const [clozeChecked, setClozeChecked] = useState(false);
  const [clozeCorrect, setClozeCorrect] = useState<boolean | null>(null);
  const [phrasesSubMode, setPhrasesSubMode] = useState<"read" | "match" | "cloze">("read");

  // Step 12 (Mini-Quiz)
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [tutorSummary, setTutorSummary] = useState<string | null>(null);
  const [loadingTutor, setLoadingTutor] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Step 13 (Recommendations)
  const [recommendations, setRecommendations] = useState<any>(null);

  // Fetch Step Data Dynamically
  useEffect(() => {
    const loadStepData = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiRequest("/lessons/lesson/phase4/metadata");
          setMetadata(res);
        } else if (step >= 2 && step <= 7 && !content) {
          const res = await apiRequest("/lessons/lesson/phase4/content");
          setContent(res);
        } else if (step === 8 && loanwordList.length === 0) {
          const res = await apiRequest("/lessons/practice/loanwords/basic");
          setLoanwordList(res || []);
        } else if (step === 9 && !ccData) {
          const res = await apiRequest("/lessons/practice/countries-cities/basic");
          setCcData(res);
        } else if (step === 10 && !namesData) {
          const res = await apiRequest("/lessons/practice/names/basic");
          setNamesData(res);
        } else if (step === 11 && !phrasesData) {
          const res = await apiRequest("/lessons/practice/phrases/basic");
          setPhrasesData(res);
        } else if (step === 13 && !recommendations) {
          const res = await apiRequest("/lessons/recommendations/hangeul/phase4");
          setRecommendations(res);
        }
      } catch (err) {
        console.error("Failed to load Phase 4 step data:", err);
      }
    };
    loadStepData();
  }, [step]);

  // Audio reflection timer
  useEffect(() => {
    let interval: any;
    if (step === 8 && loanwordsSubMode === "speed" && speedTimer !== null && speedTimer > 0) {
      interval = setInterval(() => {
        setSpeedTimer(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (speedTimer === 0) {
      setSpeedFinished(true);
      setSpeedTimer(null);
    }
    return () => clearInterval(interval);
  }, [step, loanwordsSubMode, speedTimer]);

  const handleCheckConceptQuestion = () => {
    const q = conceptQuestions[step];
    if (!q || !cSelected) return;
    const isCorrect = cSelected === q.correctId;
    setCChecked(true);
    setCCorrect(isCorrect);
    setAnsweredConcepts(prev => ({ ...prev, [step]: { selected: cSelected, correct: isCorrect } }));
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  const handleCheckLoanword = async () => {
    const current = loanwordList[loanwordIdx];
    if (!current) return;
    const correct = loanwordSelected === current.correct;
    setLoanwordChecked(true);
    setLoanwordCorrect(correct);
    if (correct) playCorrectSound();
    else playWrongSound();

    await apiRequest("/lessons/practice/loanwords/basic/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: current.id, correct, answer: loanwordSelected || "" })
    });
  };

  const handleMatchLoanword = (left: string, right: string) => {
    setLoanwordsMatched(prev => ({ ...prev, [left]: right }));
    setSelectedLeftLoanword(null);
  };

  const handleCheckCountry = async () => {
    if (!ccData) return;
    const current = ccData.countries[countryIdx];
    if (!current) return;
    const correct = countrySelected === current.correct;
    setCountryChecked(true);
    setCountryCorrect(correct);
    if (correct) playCorrectSound();
    else playWrongSound();

    await apiRequest("/lessons/practice/countries-cities/basic/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: current.id, correct, answer: countrySelected || "" })
    });
  };

  const handleMatchCc = (left: string, right: string) => {
    setCcMatched(prev => ({ ...prev, [left]: right }));
    setSelectedLeftCc(null);
  };

  const handleCheckName = async () => {
    if (!namesData) return;
    const current = namesData.mcq[nameIdx];
    if (!current) return;
    const correct = nameSelected === current.correct;
    setNameChecked(true);
    setNameCorrect(correct);
    if (correct) playCorrectSound();
    else playWrongSound();

    await apiRequest("/lessons/practice/names/basic/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: current.id, correct, answer: nameSelected || "" })
    });
  };

  const handleMatchName = (left: string, right: string) => {
    setNamesMatched(prev => ({ ...prev, [left]: right }));
    setSelectedLeftName(null);
  };

  const handleTransliterate = async () => {
    if (!transInput.trim()) return;
    setLoadingTrans(true);
    try {
      const res = await apiRequest("/lessons/tutor/transliterate-name", {
        method: "POST",
        body: JSON.stringify({ name: transInput })
      });
      setTransResults(res.suggestions || []);
      setTransExplanation(res.explanation || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTrans(false);
    }
  };

  const handleMatchPhrase = (left: string, right: string) => {
    setPhrasesMatched(prev => ({ ...prev, [left]: right }));
    setSelectedLeftPhrase(null);
  };

  const handleCheckCloze = async () => {
    if (!phrasesData) return;
    const current = phrasesData.cloze[clozeIdx];
    if (!current) return;
    const correct = clozeSelected === current.correct;
    setClozeChecked(true);
    setClozeCorrect(correct);
    if (correct) playCorrectSound();
    else playWrongSound();

    await apiRequest("/lessons/practice/phrases/basic/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: current.id, correct, answer: clozeSelected || "" })
    });
  };

  const handleGenerateQuiz = async (useAi: boolean) => {
    setLoadingQuiz(true);
    setTutorSummary(null);
    setQuizScore(null);
    setQuizMistakes([]);
    setQuizIdx(0);
    try {
      const res = await apiRequest(`/lessons/quiz/phase4/generate?use_ai=${useAi}`, { method: "POST" });
      setQuizQuestions(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleCheckQuiz = () => {
    const current = quizQuestions[quizIdx];
    if (!current) return;
    const correct = quizSelected === current.correct_answer;
    setQuizChecked(true);
    setQuizCorrect(correct);
    if (correct) {
      playCorrectSound();
    } else {
      playWrongSound();
      setQuizMistakes(prev => [...prev, current.question]);
    }
  };

  const handleSubmitQuiz = async () => {
    const correctCount = quizQuestions.length - quizMistakes.length;
    const score = Math.round((correctCount / quizQuestions.length) * 100);
    setQuizScore(score);
    await apiRequest("/lessons/quiz/phase4/submit", {
      method: "POST",
      body: JSON.stringify({ answers: [], score })
    });
  };

  const handleGetTutorFeedback = async () => {
    setLoadingTutor(true);
    try {
      const res = await apiRequest("/lessons/tutor/phase4/summary", {
        method: "POST",
        body: JSON.stringify({ mistakes: quizMistakes, score: quizScore || 0 })
      });
      setTutorSummary(res.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

  const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "C1: Word Types" },
    { num: 3, label: "C2: Writing Loanwords" },
    { num: 4, label: "C3: Geography & Places" },
    { num: 5, label: "C4: Personal Names" },
    { num: 6, label: "C5: Transliterating Names" },
    { num: 7, label: "C6: Greeting Units" },
    { num: 8, label: "Act 1: Loanword Reading" },
    { num: 9, label: "Act 2: Places Match" },
    { num: 10, label: "Act 3: Names Match" },
    { num: 11, label: "Act 4: Phrases Cloze" },
    { num: 12, label: "Checkpoint Quiz" },
    { num: 13, label: "Badge Claim & Homework" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 1,
          phaseNum: 4,
          step: step
        }
      }));
    }
  }, [step]);

return (
    <div className="flex-grow flex flex-col justify-between">
      {/* Top Header tracking */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center py-5 border-b border-white/5 mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-950 border border-white/10 shadow-lg">
            <BookMarked className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Phase 4</span>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>Real Words Reading Bootcamp</span>
            </h2>
            <p className="text-xs text-zinc-400">Curated Topic: {activeLesson?.topic || "Vocabulary & Phrases"}</p>
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
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">Required: 420 XP</span>
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
                const isCompleted = s.num < step || s.num <= maxStep;
                return (
                  <button
                    key={s.num}
                    disabled={!isCompleted && !isCurrent}
                    onClick={() => {
                      if (courseXP < 240) {
                        window.dispatchEvent(new CustomEvent("hangeulai-warning", {
                          detail: { message: "To start Phase 4, you need at least 240 XP in this course. You currently have " + courseXP + " XP." }
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
                          className={`h-full rounded-full ${isCompleted ? "bg-emerald-400" : "bg-zinc-800"}`}
                          style={{ width: isCompleted ? "100%" : "0%" }}
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

      {/* Step 1: Welcome/Overview */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center transition duration-300">
          <div className="p-4 bg-brand-500/10 rounded-3xl border border-brand-500/25 w-fit mx-auto text-brand-400 shadow-inner animate-pulse">
            <Sparkles className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-5xl font-black text-white tracking-tight">Hangeul 0.4</h2>
            <h3 className="text-2xl font-extrabold text-brand-400">Real Words Reading Bootcamp</h3>
          </div>
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed font-sans">
            {metadata?.goals || "Transition from letters to real-world context. Practice decoding loanwords, geography, names, and greetings smoothly."}
          </p>
          <div className="bg-zinc-950/80 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 shadow-inner">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-white font-bold">
              <BookOpen className="w-4 h-4 text-brand-400" />
              <span>Syllabus Objectives</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Read core loanwords written in Hangeul</li>
              <li>Recognise world country and city names</li>
              <li>Understand the 3-syllable Korean name structure</li>
              <li>Transliterate foreign names to Hangeul</li>
              <li>Read standard classroom and greeting phrases</li>
            </ul>
          </div>
          <button
            onClick={() => {
    if (courseXP < 240) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 4, you need at least 240 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
            className="bg-brand-500 hover:bg-brand-600 text-zinc-950 font-black py-4 px-10 rounded-2xl transition duration-200 text-sm flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-lg shadow-brand-500/20 active:scale-95"
          >
            <span>Begin Proper Noun Bootcamp</span>
            <ChevronRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      )}

      {/* Concept Screens C1-C6 Template with Embedded Micro-questions */}
      {step >= 2 && step <= 7 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center transition duration-300">

          {/* Concept Header */}
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 font-sans tracking-tight">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>
                {step === 2 && "C1: Three Categories of Korean Words"}
                {step === 3 && "C2: Transcribing Loanwords Phonetically"}
                {step === 4 && "C3: Countries & Cities in Hangeul"}
                {step === 5 && "C4: Korean Personal Name Structure"}
                {step === 6 && "C5: Foreign Names in Hangeul"}
                {step === 7 && "C6: Whole Phrases as Reading Units"}
              </span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black uppercase">Theory Screen {step - 1} of 6</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Concept Content Column */}
            <div className="space-y-5 text-sm leading-relaxed text-zinc-300 flex flex-col justify-between">
              <div className="space-y-4">
                {step === 2 && (
                  <>
                    <p className="font-medium">
                      Korean vocabulary comes from three distinct lexical classes:
                    </p>
                    <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
                      <p>• <strong>고유어 (Native Korean):</strong> Core concepts (e.g. <strong>사람</strong> person, <strong>집</strong> house, <strong>하늘</strong> sky).</p>
                      <p>• <strong>한자어 (Sino-Korean):</strong> Words rooted in Chinese characters (e.g. <strong>학교</strong> school, <strong>전화</strong> telephone).</p>
                      <p>• <strong>외래어 (Foreign Loanwords):</strong> Mostly from English (e.g. <strong>콜라</strong> cola, <strong>컴퓨터</strong> computer).</p>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <p className="font-medium">
                      Foreign words are adapted phonetically to Korean sounds. They do not follow the exact Roman spelling:
                    </p>
                    <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
                      <p>• <strong>/f/ sounds</strong> map to <strong>ㅍ</strong> (e.g., coffee → <strong>커피</strong>).</p>
                      <p>• <strong>/v/ sounds</strong> map to <strong>ㅂ</strong> (e.g., video → <strong>비디오</strong>).</p>
                      <p>• Consonant clusters are broken into individual syllables (e.g. chocolate → <strong>초콜릿</strong>).</p>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <p className="font-medium">
                      Countries and cities are written either as older Sino-Korean terms or phonetic modern loanwords:
                    </p>
                    <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
                      <p>• <strong>Countries:</strong> <strong>한국</strong> (Korea), <strong>미국</strong> (USA), <strong>영국</strong> (UK), <strong>일본</strong> (Japan), <strong>중국</strong> (China).</p>
                      <p>• <strong>Cities:</strong> <strong>서울</strong> (Seoul), <strong>도쿄</strong> (Tokyo), <strong>뉴욕</strong> (New York), <strong>런던</strong> (London).</p>
                    </div>
                  </>
                )}

                {step === 5 && (
                  <>
                    <p className="font-medium">
                      Most Korean personal names follow a very strict 3-syllable pattern:
                    </p>
                    <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
                      <p>• <strong>Family Name (1 syllable)</strong> + <strong>Given Name (2 syllables)</strong>.</p>
                      <p>• Example: <strong>김민수</strong> (Kim Minsu) → <strong>김</strong> (family name) + <strong>민수</strong> (given name).</p>
                      <p>• Common family names: <strong>김</strong> (Kim), <strong>이</strong> (Lee), <strong>박</strong> (Park), <strong>최</strong> (Choi).</p>
                    </div>
                  </>
                )}

                {step === 6 && (
                  <>
                    <p className="font-medium">
                      Western names are transcribed phonetically to preserve their original sound:
                    </p>
                    <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
                      <p>• Lisa maps to <strong>리사</strong>.</p>
                      <p>• James maps to <strong>제임스</strong>.</p>
                      <p>• Michael maps to <strong>마이클</strong>.</p>
                      <p>Later in this phase, you can type your own name to see its custom Hangeul mapping!</p>
                    </div>
                  </>
                )}

                {step === 7 && (
                  <>
                    <p className="font-medium">
                      Some highly repetitive phrases are best learned as whole visual reading units:
                    </p>
                    <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
                      <p>• <strong>안녕하세요</strong> (Hello)</p>
                      <p>• <strong>감사합니다</strong> (Thank you)</p>
                      <p>• <strong>죄송합니다</strong> (I'm sorry)</p>
                      <p>• <strong>처음 뵙겠습니다</strong> (Nice to meet you)</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Embedded Micro-Question Column */}
            <div className="bg-zinc-950/80 p-6 rounded-3xl border border-white/5 flex flex-col justify-between shadow-inner">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-zinc-400">
                  <HelpCircle className="w-4 h-4 text-brand-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Concept Checkpoint</span>
                </div>

                <h4 className="text-sm font-black text-white leading-snug">
                  {conceptQuestions[step]?.question}
                </h4>

                <div className="space-y-2">
                  {conceptQuestions[step]?.options.map((opt) => (
                    <button
                      key={opt.id}
                      disabled={cChecked}
                      onClick={() => setCSelected(opt.id)}
                      className={`w-full p-5 rounded-xl text-left text-sm md:text-base font-bold border transition duration-200 ${cSelected === opt.id
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-900"
                        } ${cChecked && opt.id === conceptQuestions[step]?.correctId
                          ? "border-accent-teal bg-accent-teal/10 text-white"
                          : ""
                        } ${cChecked && cSelected === opt.id && cSelected !== conceptQuestions[step]?.correctId
                          ? "border-red-500 bg-red-500/10 text-red-400"
                          : ""
                        }`}
                    >
                      <span className="inline-block mr-3 text-brand-400">{opt.id}.</span>
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 space-y-4">
                {!cChecked ? (
                  <button
                    onClick={handleCheckConceptQuestion}
                    disabled={!cSelected}
                    className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-zinc-950 font-black py-4 rounded-xl text-base transition duration-200 uppercase tracking-widest shadow-md shadow-brand-500/15 cursor-pointer"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <div className={`p-4 rounded-xl border text-xs text-left animate-in slide-in-from-bottom-2 duration-200 ${cCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                    }`}>
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <span className="uppercase text-[9px] tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-white/5">
                        {cCorrect ? "맞아요 (Correct)" : "틀렸어요 (Incorrect)"}
                      </span>
                    </div>
                    <p className="text-zinc-300 leading-normal">{conceptQuestions[step]?.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-white/5">
            <button
              onClick={() => setStep(step - 1)}
              className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => {
                setStep(step + 1);
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 15, type: 'theory' } }));
              }}
              disabled={!cChecked}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-30 disabled:hover:bg-brand-500 text-zinc-955 px-6 py-3.5 rounded-xl text-sm font-black transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4 text-zinc-950" />
            </button>
          </div>
        </div>
      )}

      {/* Screen 8: Activity 1 (Loanwords drills + Speed Check) */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center transition duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <Sparkles className="w-6 h-6 text-brand-400 animate-pulse" />
              <span>Activity 1 – Loanword Reading Drills</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black">Step 8 of 13</span>
          </div>

          {/* Submode select */}
          <div className="flex justify-center gap-2 bg-zinc-950/80 p-2 rounded-2xl border border-white/5 max-w-md mx-auto shadow-inner">
            {["guess", "match", "speed"].map((mode) => (
              <button
                key={mode}
                onClick={() => setLoanwordsSubMode(mode as any)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 capitalize ${loanwordsSubMode === mode ? "bg-brand-500 text-zinc-950 font-black shadow-md shadow-brand-500/10" : "text-zinc-400 hover:text-white bg-transparent"}`}
              >
                {mode === "guess" && "Stage A: Guess"}
                {mode === "match" && "Stage B: Match"}
                {mode === "speed" && "Stage C: Speed"}
              </button>
            ))}
          </div>

          {loanwordList.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="w-full text-center">
              {loanwordsSubMode === "guess" && (
                <div className="space-y-6 max-w-xl mx-auto w-full animate-in fade-in duration-200">
                  <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-zinc-900/40 space-y-4 max-w-xs mx-auto shadow-xl">
                    <span className="text-xs text-zinc-500 block">Read and guess the English equivalent:</span>
                    <div className="text-5xl font-black text-white">{loanwordList[loanwordIdx]?.korean}</div>

                    <button
                      onClick={() => speakWord(loanwordList[loanwordIdx]?.korean)}
                      className="mx-auto p-2.5 rounded-xl bg-zinc-950 text-brand-400 hover:text-white border border-white/10 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4 animate-bounce" />
                      <span>Play Audio</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {loanwordList[loanwordIdx]?.english_options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !loanwordChecked && setLoanwordSelected(opt)}
                        disabled={loanwordChecked}
                        className={`p-4 rounded-xl border font-bold transition duration-150 ${loanwordSelected === opt
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                          } ${loanwordChecked && opt === loanwordList[loanwordIdx]?.correct
                            ? "border-accent-teal bg-accent-teal/10 text-white"
                            : ""
                          } ${loanwordChecked && loanwordSelected === opt && loanwordSelected !== loanwordList[loanwordIdx]?.correct
                            ? "border-red-500 bg-red-500/10 text-red-400"
                            : ""
                          }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {loanwordChecked && (
                    <div className={`p-4 rounded-xl border text-xs text-left space-y-1 animate-in slide-in-from-bottom-2 duration-200 ${loanwordCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                      }`}>
                      <p className="font-extrabold">{loanwordCorrect ? `맞아요! ${loanwordList[loanwordIdx]?.korean} = ${loanwordList[loanwordIdx]?.correct}.` : `거의 맞았어요. Listen again: ${loanwordList[loanwordIdx]?.korean}. It's closer to '${loanwordList[loanwordIdx]?.correct}'.`}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <button onClick={() => setStep(7)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>

                    {!loanwordChecked ? (
                      <button
                        onClick={handleCheckLoanword}
                        disabled={!loanwordSelected}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs transition duration-200 cursor-pointer"
                      >
                        Check Answer
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setLoanwordChecked(false);
                          setLoanwordCorrect(null);
                          setLoanwordSelected(null);
                          if (loanwordIdx < loanwordList.length - 1) {
                            setLoanwordIdx(loanwordIdx + 1);
                          } else {
                            setLoanwordsSubMode("match");
                          }
                        }}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                      >
                        {loanwordIdx < loanwordList.length - 1 ? "Next Word" : "Go to Stage B"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {loanwordsSubMode === "match" && (
                <div className="space-y-6 max-w-xl mx-auto w-full animate-in fade-in duration-200">
                  <p className="text-xs text-zinc-400">Match the Korean loanwords to their English meaning:</p>

                  <div className="grid grid-cols-2 gap-8 items-start">
                    {/* Left Hangeul Column */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Hangeul Loanwords</span>
                      {loanwordList.slice(0, 5).map(item => {
                        const isMatched = loanwordsMatched[item.korean] !== undefined;
                        return (
                          <button
                            key={item.korean}
                            disabled={isMatched}
                            onClick={() => setSelectedLeftLoanword(item.korean)}
                            className={`w-full p-3.5 rounded-xl border text-sm font-black transition text-center ${isMatched
                                ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal/40 line-through"
                                : selectedLeftLoanword === item.korean
                                  ? "border-brand-500 bg-brand-500/10 text-white shadow-[0_0_15px_rgba(79,70,229,0.2)]"
                                  : "border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                              }`}
                          >
                            {item.korean}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right English Column */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">English Meaning</span>
                      {["coffee", "bus", "taxi", "camera", "pizza"].map(englishOpt => {
                        const matches = Object.entries(loanwordsMatched).find(([_, enVal]) => enVal === englishOpt);
                        const isMatched = matches !== undefined;

                        return (
                          <button
                            key={englishOpt}
                            disabled={isMatched || !selectedLeftLoanword}
                            onClick={() => {
                              const mappedObject = loanwordList.find(i => i.korean === selectedLeftLoanword);
                              if (mappedObject && mappedObject.correct === englishOpt) {
                                handleMatchLoanword(selectedLeftLoanword!, englishOpt);
                                playCorrectSound();
                              } else {
                                playWrongSound();
                              }
                            }}
                            className={`w-full p-3.5 rounded-xl border text-sm font-bold transition text-center ${isMatched
                                ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal/40 line-through"
                                : selectedLeftLoanword
                                  ? "border-white/20 bg-zinc-900 hover:bg-brand-500/10 text-white cursor-pointer"
                                  : "border-white/5 bg-zinc-900 text-zinc-500 cursor-not-allowed"
                              }`}
                          >
                            {englishOpt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <button onClick={() => setLoanwordsSubMode("guess")} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Stage A</button>

                    <button
                      onClick={() => {
                        setLoanwordsSubMode("speed");
                        setSpeedTimer(8);
                        setSpeedFinished(false);
                      }}
                      disabled={Object.keys(loanwordsMatched).length < 4}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Stage C: Speed Check</span>
                      <ChevronRight className="w-4 h-4 text-zinc-950" />
                    </button>
                  </div>
                </div>
              )}

              {loanwordsSubMode === "speed" && (
                <div className="space-y-6 max-w-xl mx-auto w-full animate-in fade-in duration-200">
                  <h3 className="text-sm font-semibold text-zinc-400">Quick Speed Check: Read all 5 words before the timer runs out!</h3>

                  {speedTimer !== null && (
                    <div className="text-4xl font-black text-amber-500 font-mono animate-pulse">{speedTimer}s</div>
                  )}

                  <div className="flex flex-wrap justify-center gap-3 py-4">
                    {["커피", "피자", "택시", "콜라", "호텔"].map((w, idx) => (
                      <button
                        key={idx}
                        onClick={() => speakWord(w)}
                        className="px-5 py-3 bg-zinc-950 border border-white/10 text-sm font-bold text-white rounded-xl hover:bg-zinc-900 flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{w}</span>
                      </button>
                    ))}
                  </div>

                  {speedFinished && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
                      <p className="text-xs text-zinc-400">Reflective Check: Which word felt hardest to read smoothly?</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {["커피", "택시", "호텔", "none"].map(w => (
                          <button
                            key={w}
                            onClick={() => setHardestWordSelection(w)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition duration-150 capitalize ${hardestWordSelection === w
                                ? "bg-brand-500 border-brand-500 text-zinc-950 font-black"
                                : "bg-zinc-900 border-white/5 text-zinc-300"
                              }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <button onClick={() => setLoanwordsSubMode("match")} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Stage B</button>

                    <button
                      onClick={() => setStep(9)}
                      disabled={speedTimer !== null && !speedFinished}
                      className="bg-brand-500 hover:bg-brand-600 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Move to Activity 2</span>
                      <ChevronRight className="w-4 h-4 text-zinc-950" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Screen 9: Activity 2 (Countries & Cities) */}
      {step === 9 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center transition duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Geography (Countries & Cities)</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black">Step 9 of 13</span>
          </div>

          {/* Submode toggle */}
          <div className="flex justify-center gap-2 bg-zinc-950/80 p-2 rounded-2xl border border-white/5 max-w-md mx-auto shadow-inner">
            <button
              onClick={() => setCcSubMode("guess")}
              className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${ccSubMode === "guess" ? "bg-brand-500 text-zinc-950 font-black shadow-md shadow-brand-500/10" : "text-zinc-400 hover:text-white bg-transparent"}`}
            >
              Stage A: Guess
            </button>
            <button
              onClick={() => setCcSubMode("match")}
              className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${ccSubMode === "match" ? "bg-brand-500 text-zinc-950 font-black shadow-md shadow-brand-500/10" : "text-zinc-400 hover:text-white bg-transparent"}`}
            >
              Stage B: Match Columns
            </button>
          </div>

          {!ccData ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="w-full text-center">
              {ccSubMode === "guess" ? (
                <div className="space-y-6 max-w-xl mx-auto w-full animate-in fade-in duration-200">
                  <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-zinc-900/40 space-y-4 max-w-xs mx-auto shadow-xl">
                    <span className="text-xs text-zinc-500 block">Read and guess the country:</span>
                    <div className="text-5xl font-black text-white">{ccData.countries[countryIdx]?.korean}</div>

                    <button
                      onClick={() => speakWord(ccData.countries[countryIdx]?.korean)}
                      className="mx-auto p-2.5 rounded-xl bg-zinc-950 text-brand-400 hover:text-white border border-white/10 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4 animate-bounce" />
                      <span>Play Audio</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {ccData.countries[countryIdx]?.english_options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !countryChecked && setCountrySelected(opt)}
                        disabled={countryChecked}
                        className={`p-4 rounded-xl border font-bold transition duration-150 ${countrySelected === opt
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                          } ${countryChecked && opt === ccData.countries[countryIdx]?.correct
                            ? "border-accent-teal bg-accent-teal/10 text-white"
                            : ""
                          } ${countryChecked && countrySelected === opt && countrySelected !== ccData.countries[countryIdx]?.correct
                            ? "border-red-500 bg-red-500/10 text-red-400"
                            : ""
                          }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {countryChecked && (
                    <div className={`p-4 rounded-xl border text-xs text-left space-y-1 animate-in slide-in-from-bottom-2 duration-200 ${countryCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                      }`}>
                      <p className="font-extrabold">{countryCorrect ? `맞아요! Correct! ${ccData.countries[countryIdx]?.korean} = ${ccData.countries[countryIdx]?.correct}` : `Oops! Incorrect.`}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <button onClick={() => setStep(8)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>

                    {!countryChecked ? (
                      <button
                        onClick={handleCheckCountry}
                        disabled={!countrySelected}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs transition duration-200 cursor-pointer"
                      >
                        Check Country
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setCountryChecked(false);
                          setCountryCorrect(null);
                          setCountrySelected(null);
                          if (countryIdx < ccData.countries.length - 1) {
                            setCountryIdx(countryIdx + 1);
                          } else {
                            setCcSubMode("match");
                          }
                        }}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                      >
                        {countryIdx < ccData.countries.length - 1 ? "Next Country" : "Go to Stage B"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Matching exercise for countries */
                <div className="space-y-6 max-w-xl mx-auto w-full animate-in fade-in duration-200">
                  <p className="text-xs text-zinc-400">Match the country/city name to its English value:</p>

                  <div className="grid grid-cols-2 gap-8 items-start">
                    {/* Left Hangeul Column */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Hangeul Name</span>
                      {ccData.matching.map((item: any) => {
                        const isMatched = ccMatched[item.ko] !== undefined;
                        return (
                          <button
                            key={item.ko}
                            disabled={isMatched}
                            onClick={() => setSelectedLeftCc(item.ko)}
                            className={`w-full p-3.5 rounded-xl border text-sm font-black transition text-center ${isMatched
                                ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal/40 line-through"
                                : selectedLeftCc === item.ko
                                  ? "border-brand-500 bg-brand-500/10 text-white shadow-[0_0_15px_rgba(79,70,229,0.2)]"
                                  : "border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                              }`}
                          >
                            {item.ko}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right English Column */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">English Meaning</span>
                      {ccData.matching.map((item: any) => {
                        const matches = Object.entries(ccMatched).find(([_, enVal]) => enVal === item.en);
                        const isMatched = matches !== undefined;

                        return (
                          <button
                            key={item.en}
                            disabled={isMatched || !selectedLeftCc}
                            onClick={() => {
                              const correctVal = ccData.matching.find((i: any) => i.ko === selectedLeftCc);
                              if (correctVal && correctVal.en === item.en) {
                                handleMatchCc(selectedLeftCc!, item.en);
                                playCorrectSound();
                              } else {
                                playWrongSound();
                              }
                            }}
                            className={`w-full p-3.5 rounded-xl border text-sm font-bold transition text-center ${isMatched
                                ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal/40 line-through"
                                : selectedLeftCc
                                  ? "border-white/20 bg-zinc-900 hover:bg-brand-500/10 text-white cursor-pointer"
                                  : "border-white/5 bg-zinc-900 text-zinc-500 cursor-not-allowed"
                              }`}
                          >
                            {item.en}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <button onClick={() => setCcSubMode("guess")} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Stage A</button>

                    <button
                      onClick={() => setStep(10)}
                      disabled={Object.keys(ccMatched).length < 4}
                      className="bg-brand-500 hover:bg-brand-600 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Move to Activity 3</span>
                      <ChevronRight className="w-4 h-4 text-zinc-950" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Screen 10: Activity 3 (Names & Transliteration) */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center transition duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <Award className="w-6 h-6 text-brand-400 animate-bounce" />
              <span>Activity 3 – Names & Transliteration drills</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black">Step 10 of 13</span>
          </div>

          {/* Submode tabs */}
          <div className="flex justify-center gap-2 bg-zinc-950/80 p-2 rounded-2xl border border-white/5 max-w-md mx-auto shadow-inner">
            {["match", "guess", "transliterate"].map((mode) => (
              <button
                key={mode}
                onClick={() => setNamesSubMode(mode as any)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 capitalize ${namesSubMode === mode ? "bg-brand-500 text-zinc-950 font-black shadow-md shadow-brand-500/10" : "text-zinc-400 hover:text-white bg-transparent"}`}
              >
                {mode === "match" && "Stage A: Match"}
                {mode === "guess" && "Stage B: Guess"}
                {mode === "transliterate" && "Stage C: Transliterate"}
              </button>
            ))}
          </div>

          {!namesData ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="w-full text-center">
              {/* Stage A: Name matching */}
              {namesSubMode === "match" && (
                <div className="space-y-6 max-w-xl mx-auto w-full animate-in fade-in duration-200">
                  <p className="text-xs text-zinc-400 font-sans">Match Hangeul names to their English equivalent:</p>

                  <div className="grid grid-cols-2 gap-8 items-start">
                    {/* Left Column */}
                    <div className="space-y-2">
                      {namesData.matching.map((item: any) => {
                        const isMatched = namesMatched[item.ko] !== undefined;
                        return (
                          <button
                            key={item.ko}
                            disabled={isMatched}
                            onClick={() => setSelectedLeftName(item.ko)}
                            className={`w-full p-3.5 rounded-xl border text-sm font-black transition text-center ${isMatched
                                ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal/40 line-through"
                                : selectedLeftName === item.ko
                                  ? "border-brand-500 bg-brand-500/10 text-white shadow-[0_0_15px_rgba(79,70,229,0.2)]"
                                  : "border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                              }`}
                          >
                            {item.ko}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-2">
                      {namesData.matching.map((item: any) => {
                        const matches = Object.entries(namesMatched).find(([_, enVal]) => enVal === item.en);
                        const isMatched = matches !== undefined;

                        return (
                          <button
                            key={item.en}
                            disabled={isMatched || !selectedLeftName}
                            onClick={() => {
                              const correctVal = namesData.matching.find((i: any) => i.ko === selectedLeftName);
                              if (correctVal && correctVal.en === item.en) {
                                handleMatchName(selectedLeftName!, item.en);
                                playCorrectSound();
                              } else {
                                playWrongSound();
                              }
                            }}
                            className={`w-full p-3.5 rounded-xl border text-sm font-bold transition text-center ${isMatched
                                ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal/40 line-through"
                                : selectedLeftName
                                  ? "border-white/20 bg-zinc-900 hover:bg-brand-500/10 text-white cursor-pointer"
                                  : "border-white/5 bg-zinc-900 text-zinc-500 cursor-not-allowed"
                              }`}
                          >
                            {item.en}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <button onClick={() => setStep(9)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>

                    <button
                      onClick={() => setNamesSubMode("guess")}
                      disabled={Object.keys(namesMatched).length < 3}
                      className="bg-brand-500 hover:bg-brand-600 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Stage B: Guess</span>
                      <ChevronRight className="w-4 h-4 text-zinc-950" />
                    </button>
                  </div>
                </div>
              )}

              {/* Stage B: MCQ names */}
              {namesSubMode === "guess" && (
                <div className="space-y-6 max-w-xl mx-auto w-full animate-in fade-in duration-200">
                  <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-zinc-900/40 space-y-4 max-w-xs mx-auto shadow-xl">
                    <span className="text-xs text-zinc-500 block">Read and guess the romanization:</span>
                    <div className="text-4xl font-black text-white">{namesData.mcq[nameIdx]?.korean}</div>

                    <button
                      onClick={() => speakWord(namesData.mcq[nameIdx]?.korean)}
                      className="mx-auto p-2.5 rounded-xl bg-zinc-950 text-brand-400 hover:text-white border border-white/10 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4 animate-bounce" />
                      <span>Play Audio</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {namesData.mcq[nameIdx]?.english_options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !nameChecked && setNameSelected(opt)}
                        disabled={nameChecked}
                        className={`p-4 rounded-xl border font-bold transition duration-150 ${nameSelected === opt
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                          } ${nameChecked && opt === namesData.mcq[nameIdx]?.correct
                            ? "border-accent-teal bg-accent-teal/10 text-white"
                            : ""
                          } ${nameChecked && nameSelected === opt && nameSelected !== namesData.mcq[nameIdx]?.correct
                            ? "border-red-500 bg-red-500/10 text-red-400"
                            : ""
                          }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {nameChecked && (
                    <div className={`p-4 rounded-xl border text-xs text-left space-y-1 animate-in slide-in-from-bottom-2 duration-200 ${nameCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                      }`}>
                      <p className="font-extrabold">{nameCorrect ? `Correct! Match found.` : `Incorrect.`}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <button onClick={() => setNamesSubMode("match")} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Stage A</button>

                    {!nameChecked ? (
                      <button
                        onClick={handleCheckName}
                        disabled={!nameSelected}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs transition duration-200 cursor-pointer"
                      >
                        Check Answer
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setNameChecked(false);
                          setNameCorrect(null);
                          setNameSelected(null);
                          if (nameIdx < namesData.mcq.length - 1) {
                            setNameIdx(nameIdx + 1);
                          } else {
                            setNamesSubMode("transliterate");
                          }
                        }}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                      >
                        {nameIdx < namesData.mcq.length - 1 ? "Next Name" : "Go to Stage C"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Stage C: Custom Transliterate */}
              {namesSubMode === "transliterate" && (
                <div className="space-y-6 text-left max-w-xl mx-auto animate-in fade-in duration-200">
                  <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 space-y-2.5">
                    <h4 className="font-black text-white text-sm">Hangeulize Your Name!</h4>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Korean writes names phonetically. Enter your English name below, and our system will map it to Hangeul syllables with Gwan-Sik's advice:
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={transInput}
                      onChange={e => setTransInput(e.target.value)}
                      placeholder="Type your name (e.g. Liam, Arya, Jin)..."
                      className="flex-grow bg-zinc-950 p-4 rounded-xl border border-white/10 outline-none focus:border-brand-500 font-sans text-sm text-white"
                      disabled={loadingTrans}
                    />
                    <button
                      onClick={handleTransliterate}
                      disabled={loadingTrans || !transInput.trim()}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-zinc-950 font-black px-5 py-4 rounded-xl transition duration-200 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loadingTrans ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <span>Hangeulize</span>
                      )}
                    </button>
                  </div>

                  {transResults.length > 0 && (
                    <div className="bg-zinc-950 p-6 rounded-3xl border border-white/5 space-y-4 shadow-inner">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Hangeul Suggestions:</span>

                      <div className="flex flex-wrap gap-2">
                        {transResults.map((sug, sIdx) => (
                          <div
                            key={sIdx}
                            className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 flex items-center justify-between gap-4 flex-grow"
                          >
                            <div>
                              <div className="text-3xl font-black text-white">{sug}</div>
                              <button
                                onClick={() => speakWord(sug)}
                                className="mt-1.5 text-[10px] text-brand-400 hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>Pronounce suggestion</span>
                              </button>
                            </div>
                            <button
                              onClick={() => setSavedName(sug)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer ${savedName === sug
                                  ? "bg-accent-teal text-zinc-950"
                                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                                }`}
                            >
                              {savedName === sug ? "Saved" : "Save Name"}
                            </button>
                          </div>
                        ))}
                      </div>

                      {transExplanation && (
                        <p className="text-zinc-400 text-xs italic bg-zinc-900/20 p-3 rounded-xl border border-white/[0.03] mt-2 leading-relaxed">
                          <strong>Why?</strong> {transExplanation}
                        </p>
                      )}

                      <div className="pt-2 text-center">
                        <p className="text-[10px] text-zinc-500 italic">Practice speaking your name out loud 3 times!</p>
                      </div>
                    </div>
                  )}

                  {savedName && (
                    <div className="bg-accent-teal/5 border border-accent-teal/20 text-accent-teal p-4 rounded-xl text-xs font-bold text-center">
                      Saved "{savedName}" as your profile Hangeul name!
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <button onClick={() => setNamesSubMode("guess")} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Stage B</button>

                    <button
                      onClick={() => setStep(11)}
                      className="bg-brand-500 hover:bg-brand-600 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Move to Activity 4</span>
                      <ChevronRight className="w-4 h-4 text-zinc-950" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Screen 11: Activity 4 (Phrases & Cloze) */}
      {step === 11 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center transition duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <Sparkles className="w-6 h-6 text-brand-400 animate-pulse" />
              <span>Activity 4 – Whole Phrase Reading drills</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black">Step 11 of 13</span>
          </div>

          {/* Submode Selection */}
          <div className="flex justify-center gap-2 bg-zinc-950/80 p-2 rounded-2xl border border-white/5 max-w-md mx-auto shadow-inner">
            {["read", "match", "cloze"].map(mode => (
              <button
                key={mode}
                onClick={() => setPhrasesSubMode(mode as any)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 capitalize ${phrasesSubMode === mode ? "bg-brand-500 text-zinc-950 font-black shadow-md shadow-brand-500/10" : "text-zinc-400 hover:text-white bg-transparent"}`}
              >
                {mode === "read" && "Stage A: Read"}
                {mode === "match" && "Stage B: Match"}
                {mode === "cloze" && "Stage C: Cloze"}
              </button>
            ))}
          </div>

          {!phrasesData ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="w-full text-center">
              {/* Stage A: Card reading & self-assessments */}
              {phrasesSubMode === "read" && (
                <div className="space-y-6 max-w-xl mx-auto w-full animate-in fade-in duration-200">
                  <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-zinc-900/40 space-y-4 max-w-xs mx-auto shadow-xl">
                    <span className="text-xs text-zinc-500 block">Classroom / Greeting Phrase {phraseIdx + 1}:</span>
                    <div className="text-3xl font-black text-white">{phrasesData.phrases[phraseIdx]?.korean}</div>

                    <div className="flex justify-center gap-2 pt-2">
                      <button
                        onClick={() => speakWord(phrasesData.phrases[phraseIdx]?.korean)}
                        className="p-3 rounded-xl bg-zinc-950 text-brand-400 hover:text-white border border-white/10 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer font-mono uppercase tracking-wider"
                      >
                        <Volume2 className="w-4 h-4 animate-bounce" />
                        <span>Speak</span>
                      </button>
                      <button
                        onClick={() => setShowPhraseGloss(!showPhraseGloss)}
                        className="p-3 rounded-xl bg-zinc-950 text-zinc-400 hover:text-white border border-white/10 transition text-xs font-bold uppercase tracking-wider"
                      >
                        {showPhraseGloss ? `Gloss: ${phrasesData.phrases[phraseIdx]?.english}` : "Reveal Meaning"}
                      </button>
                    </div>
                  </div>

                  {showPhraseGloss && (
                    <div className="text-xs text-zinc-400 bg-zinc-900/30 p-3.5 rounded-xl border border-white/5 max-w-xs mx-auto animate-in slide-in-from-bottom-2 duration-150">
                      <span className="font-semibold block text-zinc-300">Literal Translation:</span>
                      "{phrasesData.phrases[phraseIdx]?.literal}"
                    </div>
                  )}

                  <div className="space-y-2 max-w-xs mx-auto">
                    <p className="text-xs text-zinc-500">Self Assessment: How smoothly did you read this phrase?</p>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setPhraseSelfChecks(prev => ({ ...prev, [phraseIdx]: "smooth" }))}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border transition ${phraseSelfChecks[phraseIdx] === "smooth"
                            ? "bg-accent-teal text-zinc-950 border-accent-teal"
                            : "border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                          }`}
                      >
                        Smoothly
                      </button>
                      <button
                        onClick={() => setPhraseSelfChecks(prev => ({ ...prev, [phraseIdx]: "struggled" }))}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border transition ${phraseSelfChecks[phraseIdx] === "struggled"
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                          }`}
                      >
                        Struggled
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <button onClick={() => setStep(10)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>

                    <button
                      onClick={() => {
                        setShowPhraseGloss(false);
                        if (phraseIdx < phrasesData.phrases.length - 1) {
                          setPhraseIdx(phraseIdx + 1);
                        } else {
                          setPhrasesSubMode("match");
                        }
                      }}
                      className="bg-brand-500 hover:bg-brand-600 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      {phraseIdx < phrasesData.phrases.length - 1 ? "Next Phrase" : "Go to Stage B"}
                    </button>
                  </div>
                </div>
              )}

              {/* Stage B: Meaning matching */}
              {phrasesSubMode === "match" && (
                <div className="space-y-6 max-w-xl mx-auto w-full animate-in fade-in duration-200">
                  <p className="text-xs text-zinc-400">Match the phrases to their standard English meanings:</p>

                  <div className="grid grid-cols-2 gap-8 items-start font-sans">
                    {/* Left Column */}
                    <div className="space-y-2">
                      {phrasesData.matching.map((item: any) => {
                        const isMatched = phrasesMatched[item.ko] !== undefined;
                        return (
                          <button
                            key={item.ko}
                            disabled={isMatched}
                            onClick={() => setSelectedLeftPhrase(item.ko)}
                            className={`w-full p-3 rounded-xl border text-sm font-black transition text-center ${isMatched
                                ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal/40 line-through"
                                : selectedLeftPhrase === item.ko
                                  ? "border-brand-500 bg-brand-500/10 text-white shadow-[0_0_15px_rgba(79,70,229,0.2)]"
                                  : "border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                              }`}
                          >
                            {item.ko}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-2">
                      {phrasesData.matching.map((item: any) => {
                        const matches = Object.entries(phrasesMatched).find(([_, enVal]) => enVal === item.en);
                        const isMatched = matches !== undefined;

                        return (
                          <button
                            key={item.en}
                            disabled={isMatched || !selectedLeftPhrase}
                            onClick={() => {
                              const correctVal = phrasesData.matching.find((i: any) => i.ko === selectedLeftPhrase);
                              if (correctVal && correctVal.en === item.en) {
                                handleMatchPhrase(selectedLeftPhrase!, item.en);
                                playCorrectSound();
                              } else {
                                playWrongSound();
                              }
                            }}
                            className={`w-full p-3 rounded-xl border text-sm font-bold transition text-center ${isMatched
                                ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal/40 line-through"
                                : selectedLeftPhrase
                                  ? "border-white/20 bg-zinc-900 hover:bg-brand-500/10 text-white cursor-pointer"
                                  : "border-white/5 bg-zinc-900 text-zinc-500 cursor-not-allowed"
                              }`}
                          >
                            {item.en}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <button onClick={() => setPhrasesSubMode("read")} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Stage A</button>

                    <button
                      onClick={() => setPhrasesSubMode("cloze")}
                      disabled={Object.keys(phrasesMatched).length < 3}
                      className="bg-brand-500 hover:bg-brand-600 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Stage C: Cloze</span>
                      <ChevronRight className="w-4 h-4 text-zinc-950" />
                    </button>
                  </div>
                </div>
              )}

              {/* Stage C: Cloze test */}
              {phrasesSubMode === "cloze" && (
                <div className="space-y-6 max-w-xl mx-auto w-full animate-in fade-in duration-200">
                  <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-zinc-900/40 space-y-4 max-w-xs mx-auto shadow-xl">
                    <span className="text-xs text-zinc-500 block">Fill in the missing block to complete:</span>
                    <div className="text-3xl font-black text-white">{phrasesData.cloze[clozeIdx]?.question}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {phrasesData.cloze[clozeIdx]?.options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !clozeChecked && setClozeSelected(opt)}
                        disabled={clozeChecked}
                        className={`p-4 rounded-2xl border font-black text-2xl transition duration-150 ${clozeSelected === opt
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                          } ${clozeChecked && opt === phrasesData.cloze[clozeIdx]?.correct
                            ? "border-accent-teal bg-accent-teal/10 text-white"
                            : ""
                          } ${clozeChecked && clozeSelected === opt && clozeSelected !== phrasesData.cloze[clozeIdx]?.correct
                            ? "border-red-500 bg-red-500/10 text-red-400"
                            : ""
                          }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {clozeChecked && (
                    <div className={`p-4 rounded-xl border text-xs text-left space-y-1 animate-in slide-in-from-bottom-2 duration-200 ${clozeCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                      }`}>
                      <p className="font-extrabold">{clozeCorrect ? `Correct!` : `Incorrect.`}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <button onClick={() => setPhrasesSubMode("match")} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Stage B</button>

                    {!clozeChecked ? (
                      <button
                        onClick={handleCheckCloze}
                        disabled={!clozeSelected}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs transition duration-200 cursor-pointer"
                      >
                        Verify Block
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setClozeChecked(false);
                          setClozeCorrect(null);
                          setClozeSelected(null);
                          if (clozeIdx < phrasesData.cloze.length - 1) {
                            setClozeIdx(clozeIdx + 1);
                          } else {
                            setStep(12);
                          }
                        }}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                      >
                        {clozeIdx < phrasesData.cloze.length - 1 ? "Next Cloze" : "Go to mini-quiz"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Screen 12: Mini Quiz Checkpoint */}
      {step === 12 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center transition duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <Award className="w-6 h-6 text-brand-400 animate-pulse" />
              <span>Step 12 – Real Words Mastery checkpoint</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black">Step 12 of {totalSteps}</span>
          </div>

          {quizQuestions.length === 0 ? (
            <div className="text-center py-10 max-w-md mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="p-4 bg-brand-500/10 rounded-3xl border border-brand-500/25 w-fit mx-auto text-brand-400">
                <BrainCircuit className="w-12 h-12 animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Generate Checkpoint Quiz</h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">Complete proper nouns and phrases check using pre-authored static items or dynamic Llama AI generation on-demand.</p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={() => handleGenerateQuiz(false)}
                  disabled={loadingQuiz}
                  className="w-full bg-zinc-950 hover:bg-zinc-900 border border-white/10 text-zinc-300 font-bold py-4 rounded-2xl transition duration-200 text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  Load Pre-Authored static Quiz
                </button>
                <button
                  onClick={() => handleGenerateQuiz(true)}
                  disabled={loadingQuiz}
                  className="w-full bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4 rounded-2xl transition duration-200 text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-500/15 cursor-pointer"
                >
                  {loadingQuiz ? <Loader2 className="w-4 h-4 animate-spin text-zinc-950" /> : <Sparkles className="w-4 h-4 text-zinc-950 animate-pulse" />}
                  <span>Generate dynamic Quiz via Llama AI</span>
                </button>
              </div>
            </div>
          ) : quizScore !== null ? (
            /* Results View */
            <div className="max-w-xl mx-auto w-full text-center space-y-6 animate-in fade-in duration-300">
              <div className="p-6 bg-zinc-950/80 rounded-3xl border border-white/5 space-y-5 shadow-inner">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block font-mono">Proper Nouns Quiz Complete</span>
                <h3 className="text-7xl font-black bg-gradient-to-r from-brand-500 to-amber-500 bg-clip-text text-transparent filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.1)]">{quizScore}%</h3>

                <p className="text-zinc-300 text-xs md:text-sm leading-relaxed max-w-sm mx-auto">
                  {quizScore >= 80 ? "Superb work! You can comfortably read Hangeul proper nouns, foreign names, and core greeting phrases." : "Good try! We suggest reviewing loanword adaptations and proper noun spelling components."}
                </p>

                {/* Tutor feedback summary */}
                <div className="pt-3">
                  {tutorSummary ? (
                    <div className="bg-zinc-900/60 p-5 rounded-2xl border border-brand-500/20 text-left text-xs leading-relaxed text-zinc-300 max-w-md mx-auto shadow-inner animate-in fade-in duration-300">
                      <span className="text-[9px] font-black text-brand-400 block mb-1.5 uppercase tracking-widest font-mono">Gwan-Sik AI Coach Report</span>
                      <p className="font-serif italic font-medium">"{tutorSummary}"</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleGetTutorFeedback}
                      className="bg-zinc-900 hover:bg-zinc-850 border border-brand-500/20 text-brand-400 hover:text-brand-300 font-bold px-5 py-3 rounded-xl text-xs transition duration-200 flex items-center justify-center gap-2 mx-auto cursor-pointer"
                      disabled={loadingTutor}
                    >
                      {loadingTutor ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating AI advice...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                          <span>Get Tutor Advice Report via Llama AI</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-white/5">
                <button
                  onClick={() => {
                    setQuizQuestions([]);
                    setQuizIdx(0);
                    setQuizSelected(null);
                    setQuizChecked(false);
                    setQuizCorrect(null);
                    setQuizScore(null);
                    setQuizMistakes([]);
                    setTutorSummary(null);
                  }}
                  className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition cursor-pointer"
                >
                  Retake Quiz
                </button>
                <button
                  onClick={() => setStep(13)}
                  className="bg-brand-500 hover:bg-brand-600 text-zinc-950 px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                >
                  View Homework <ChevronRight className="w-4 h-4 text-zinc-950" />
                </button>
              </div>
            </div>
          ) : (
            /* Quiz Active Question */
            <div className="max-w-xl mx-auto w-full text-center space-y-6">
              <div>
                <span className="text-xs text-zinc-500 block">Question {quizIdx + 1} of {quizQuestions.length}</span>
                <h3 className="text-xl font-black text-white mt-1 leading-snug">{quizQuestions[quizIdx]?.question}</h3>
              </div>

              <div className="space-y-3">
                {quizQuestions[quizIdx]?.options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !quizChecked && setQuizSelected(opt)}
                    disabled={quizChecked}
                    className={`w-full p-4 rounded-xl font-bold transition flex items-center justify-between border ${quizSelected === opt
                        ? "border-brand-500 bg-brand-500/10 text-white shadow-inner"
                        : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                      } ${quizChecked && opt === quizQuestions[quizIdx]?.correct_answer
                        ? "border-accent-teal bg-accent-teal/10 text-white"
                        : ""
                      } ${quizChecked && quizSelected === opt && quizSelected !== quizQuestions[quizIdx]?.correct_answer
                        ? "border-red-500 bg-red-500/10 text-red-400"
                        : ""
                      }`}
                  >
                    <span>{opt}</span>
                  </button>
                ))}
              </div>

              {quizChecked && (
                <div className={`p-5 rounded-2xl border text-xs text-left space-y-2 animate-in slide-in-from-bottom-2 duration-200 ${quizCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                  <p className="font-black text-sm">{quizCorrect ? "Correct!" : "Incorrect."}</p>
                  <p className="text-zinc-300">{quizQuestions[quizIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t border-white/5">
                <button
                  onClick={() => {
                    setQuizQuestions([]);
                    setQuizIdx(0);
                    setQuizSelected(null);
                    setQuizChecked(false);
                    setQuizCorrect(null);
                  }}
                  className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition cursor-pointer"
                >
                  Reset Quiz
                </button>

                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={!quizSelected}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs transition duration-200 cursor-pointer"
                  >
                    Check Quiz Answer
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setQuizChecked(false);
                      setQuizCorrect(null);
                      setQuizSelected(null);
                      if (quizIdx < quizQuestions.length - 1) {
                        setQuizIdx(quizIdx + 1);
                      } else {
                        handleSubmitQuiz();
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-3 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {quizIdx < quizQuestions.length - 1 ? "Next Question" : "Submit & Score Quiz"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 13: Homework & Badge Completion */}
      {step === 13 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center transition duration-300">
          <div className="p-4 bg-brand-500/10 rounded-3xl border border-brand-500/25 w-fit mx-auto text-brand-400 animate-bounce">
            <Award className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tight">Hangeul Bootcamp Complete! 🇰🇷✨</h2>
            <p className="text-zinc-400 text-xs font-sans">You have finished all 4 phases of Course 0! You are ready to start Everyday Basics.</p>
          </div>

          {recommendations && (
            <div className="bg-zinc-950/80 p-6 rounded-2xl border border-white/5 text-left text-xs space-y-4 font-sans leading-relaxed shadow-inner">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-green-400 block mb-0.5 font-mono">Strengths</span>
                <p className="text-zinc-300 font-medium">{recommendations.strength}</p>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-yellow-400 block mb-0.5 font-mono">Revision Focus</span>
                <p className="text-zinc-300 font-medium">{recommendations.weakness}</p>
              </div>
              <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/[0.03] space-y-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-400 block font-mono">Homework Routine:</span>
                <ul className="list-decimal list-inside space-y-2 text-zinc-400 pl-1">
                  <li>Read all Phase 4 Hangeul loanwords aloud once/day.</li>
                  <li>Read proper noun country list (한국, 일본, 미국, 영국).</li>
                  <li>Write your custom Hangeulized name 5 times.</li>
                  <li>
                    Search YouTube for: <strong className="text-white select-all">"{recommendations.youtube_search}"</strong>.
                  </li>
                </ul>
              </div>
            </div>
          )}

          <button
            onClick={() => {
    if (courseXP < 420) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To graduate from this course, you need at least 420 XP. You currently have " + courseXP + " XP. Please review earlier steps or re-answer incorrect questions to earn more XP!") } }));
      return;
    }onComplete();
  }}
            className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4.5 px-10 rounded-2xl transition duration-200 text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/20 cursor-pointer active:scale-95"
          >
            <span>Finish Phase 4 &amp; Continue</span>
            <ChevronRight className="w-4 h-4 text-zinc-950" />
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
                const bpIdx = (quizQuestions || []).findIndex((q: any) => q.correct_answer === m || q.question === m || q.correctId === m);
                if (bpIdx !== -1) {
                  if (typeof setQuizIdx === "function") setQuizIdx(bpIdx);
                if (typeof setQuizChecked === "function") setQuizChecked(false);
                if (typeof setQuizCorrect === "function") setQuizCorrect(null);
                if (typeof setQuizScore === "function") setQuizScore(null);
                if (typeof setQuizSelected === "function") setQuizSelected(null);
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
