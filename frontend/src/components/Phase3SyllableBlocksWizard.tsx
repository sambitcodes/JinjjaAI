"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Sparkles,
  BookOpen,
  BrainCircuit,
  Award,
  Loader2,
  CheckCircle2,
  RotateCcw,
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

interface Phase3SyllableBlocksWizardProps {
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

export default function Phase3SyllableBlocksWizard({ activeLesson, speakWord, onComplete }: Phase3SyllableBlocksWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 11;

  // Persist step to localStorage for refresh resilience
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_phase3_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 11) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_phase3_step", String(step));
  }, [step]);

  const [metadata, setMetadata] = useState<any>(null);

  // Step 2-6: Concept Content & Visualizer State
  const [content, setContent] = useState<any>(null);
  const [vizInitial, setVizInitial] = useState("ㄱ");
  const [vizVowel, setVizVowel] = useState("ㅏ");
  const [vizFinal, setVizFinal] = useState("");

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
      question: "In the word 학교 (school), how many syllable blocks do you see?",
      options: [
        { id: "A", text: "1 block" },
        { id: "B", text: "2 blocks" },
        { id: "C", text: "5 blocks" }
      ],
      correctId: "B",
      explanation: "학교 has two syllable blocks: 학 (hak) and 교 (gyo). Each block represents a single syllable."
    },
    3: {
      question: "Is the syllable block 가 a CV or CVC pattern?",
      options: [
        { id: "A", text: "CV (Consonant + Vowel)" },
        { id: "B", text: "CVC (Consonant + Vowel + Final Consonant)" }
      ],
      correctId: "A",
      explanation: "가 has only an initial consonant (ㄱ) and a middle vowel (ㅏ), making it a CV pattern with no final consonant."
    },
    4: {
      question: "If the vowel symbol is ㅏ, where should it be positioned relative to the initial consonant?",
      options: [
        { id: "A", text: "To the right of the consonant" },
        { id: "B", text: "Under the consonant" }
      ],
      correctId: "A",
      explanation: "Vertical vowels (like ㅏ) go to the right of the initial consonant, while horizontal vowels (like ㅗ) go under it."
    },
    5: {
      question: "Which letter functions as the final consonant (받침) in the syllable block 살?",
      options: [
        { id: "A", text: "ㅅ (s)" },
        { id: "B", text: "ㅏ (a)" },
        { id: "C", text: "ㄹ (l)" }
      ],
      correctId: "C",
      explanation: "ㄹ is written at the very bottom of the syllable block, which is the final consonant (받침) position."
    },
    6: {
      question: "In the syllable block 아, what sound does the circle (ㅇ) make?",
      options: [
        { id: "A", text: "It is a silent placeholder" },
        { id: "B", text: "It makes a nasal 'ng' sound" }
      ],
      correctId: "A",
      explanation: "At the start of a block, ㅇ is silent. At the bottom (받침 position), it makes the 'ng' sound."
    }
  };

  // Step 7: Composition (Build blocks)
  const [composeQuestions, setComposeQuestions] = useState<any[]>([]);
  const [composeIdx, setComposeIdx] = useState(0);
  const [buildSlots, setBuildSlots] = useState({ initial: "", vowel: "", final: "" });
  const [composeChecked, setComposeChecked] = useState(false);
  const [composeCorrect, setComposeCorrect] = useState<boolean | null>(null);

  // Step 8: Decomposition
  const [decomposeQuestions, setDecomposeQuestions] = useState<any[]>([]);
  const [decomposeIdx, setDecomposeIdx] = useState(0);
  const [decSelected, setDecSelected] = useState({ initial: "", vowel: "", final: "" });
  const [decomposeChecked, setDecomposeChecked] = useState(false);
  const [decomposeCorrect, setDecomposeCorrect] = useState<boolean | null>(null);

  // Step 9: Syllables Read & Listen
  const [syllableReadList, setSyllableReadList] = useState<any[]>([]);
  const [readIdx, setReadIdx] = useState(0);
  const [showVowelHint, setShowVowelHint] = useState(false);
  const [listenQuestions, setListenQuestions] = useState<any[]>([]);
  const [listenIdx, setListenIdx] = useState(0);
  const [listenSelected, setListenSelected] = useState<string | null>(null);
  const [listenChecked, setListenChecked] = useState(false);
  const [listenCorrect, setListenCorrect] = useState<boolean | null>(null);
  const [syllableSubMode, setSyllableSubMode] = useState<"read" | "listen">("read");

  // Step 9 Part 2: Words Reading
  const [wordData, setWordData] = useState<any>(null);
  const [wordIdx, setWordIdx] = useState(0);
  const [showWordMeaning, setShowWordMeaning] = useState(false);
  const [matchingSelections, setMatchingSelections] = useState<Record<string, string>>({});
  const [dictationWriting, setDictationWriting] = useState("");
  const [dictationChecked, setDictationChecked] = useState(false);
  const [dictationCorrect, setDictationCorrect] = useState<boolean | null>(null);
  const [wordSubMode, setWordSubMode] = useState<"cards" | "matching" | "dictation">("cards");

  // Step 10: Mini-Quiz
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizWriting, setQuizWriting] = useState("");
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [tutorSummary, setTutorSummary] = useState<string | null>(null);
  const [loadingTutor, setLoadingTutor] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Step 11: Recommendations
  const [recommendations, setRecommendations] = useState<any>(null);

  // Fetch Step Data Dynamically
  useEffect(() => {
    const loadStepData = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiRequest("/lessons/lesson/phase3/metadata");
          setMetadata(res);
        } else if (step >= 2 && step <= 6 && !content) {
          const res = await apiRequest("/lessons/lesson/phase3/content");
          setContent(res);
        } else if (step === 7 && composeQuestions.length === 0) {
          const res = await apiRequest("/lessons/practice/blocks/compose");
          setComposeQuestions(res || []);
        } else if (step === 8 && decomposeQuestions.length === 0) {
          const res = await apiRequest("/lessons/practice/blocks/decompose");
          setDecomposeQuestions(res || []);
        } else if (step === 9) {
          if (syllableReadList.length === 0) {
            const res = await apiRequest("/lessons/practice/syllables/read");
            setSyllableReadList(res || []);
          }
          if (listenQuestions.length === 0) {
            const res = await apiRequest("/lessons/practice/consonants/listening");
            setListenQuestions(res || []);
          }
          if (!wordData) {
            const res = await apiRequest("/lessons/practice/words/reading-basic");
            setWordData(res);
          }
        } else if (step === 11 && !recommendations) {
          const res = await apiRequest("/lessons/recommendations/hangeul/phase3");
          setRecommendations(res);
        }
      } catch (err) {
        console.error("Failed to load step data:", err);
      }
    };
    loadStepData();
  }, [step]);

  // Helper to render final block combined dynamically
  const getRenderedBlock = (initial: string, vowel: string, final: string) => {
    if (initial === "ㄱ" && vowel === "ㅏ" && final === "") return "가";
    if (initial === "ㄱ" && vowel === "ㅗ" && final === "") return "고";
    if (initial === "ㄱ" && vowel === "ㅏ" && final === "ㅁ") return "감";
    if (initial === "ㅅ" && vowel === "ㅗ" && final === "ㄴ") return "손";
    if (initial === "ㅂ" && vowel === "ㅏ" && final === "ㅂ") return "밥";
    if (initial === "ㅈ" && vowel === "ㅣ" && final === "ㅂ") return "집";
    if (initial === "ㅁ" && vowel === "ㅜ" && final === "ㄴ") return "문";
    if (initial === "ㅂ" && vowel === "ㅏ" && final === "") return "바";
    if (initial === "ㄱ" && vowel === "ㅣ" && final === "ㅁ") return "김";
    if (initial === "ㄷ" && vowel === "ㅗ" && final === "ㅇ") return "동";

    return `${initial}${vowel}${final}`;
  };

  const handleCheckConceptQuestion = () => {
    const q = conceptQuestions[step];
    if (!q || !cSelected) return;
    const isCorrect = cSelected === q.correctId;
    setCChecked(true);
    setCCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  const handleCheckCompose = async () => {
    const currentQ = composeQuestions[composeIdx];
    if (!currentQ) return;
    const isCorrect = buildSlots.initial === currentQ.target_parts.initial &&
      buildSlots.vowel === currentQ.target_parts.vowel &&
      buildSlots.final === currentQ.target_parts.final;
    setComposeChecked(true);
    setComposeCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();

    await apiRequest("/lessons/practice/blocks/compose/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: currentQ.id, correct: isCorrect, answer: "composition_checked" })
    });
  };

  const handleCheckDecompose = async () => {
    const currentQ = decomposeQuestions[decomposeIdx];
    if (!currentQ) return;
    const isCorrect = decSelected.initial === currentQ.correct_parts.initial &&
      decSelected.vowel === currentQ.correct_parts.vowel &&
      decSelected.final === currentQ.correct_parts.final;
    setDecomposeChecked(true);
    setDecomposeCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();

    await apiRequest("/lessons/practice/blocks/decompose/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: currentQ.id, correct: isCorrect, answer: "decomposition_checked" })
    });
  };

  const handleCheckListen = async () => {
    const currentQ = listenQuestions[listenIdx];
    if (!currentQ) return;
    const isCorrect = listenSelected === currentQ.correct_answer;
    setListenChecked(true);
    setListenCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  const handleCheckDictation = async () => {
    if (!wordData) return;
    const currentQ = wordData.dictation[0]; // test dictation
    if (!currentQ) return;
    const isCorrect = dictationWriting.trim() === currentQ.word.trim();
    setDictationChecked(true);
    setDictationCorrect(isCorrect);
    if (isCorrect) playCorrectSound();
    else playWrongSound();

    await apiRequest("/lessons/practice/words/reading-basic/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: currentQ.id, correct: isCorrect, answer: dictationWriting })
    });
  };

  const handleCheckQuiz = () => {
    const currentQ = quizQuestions[quizIdx];
    if (!currentQ) return;
    let isCorrect = false;
    if (currentQ.type === "choice") {
      isCorrect = quizSelected === currentQ.correct_answer;
    } else {
      isCorrect = quizWriting.trim() === currentQ.correct_answer.trim();
    }
    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
      setQuizMistakes(prev => [...prev, currentQ.question]);
    }
  };

  const handleGetTutorFeedback = async () => {
    setLoadingTutor(true);
    try {
      const res = await apiRequest("/lessons/tutor/phase3/summary", {
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
    { num: 1, label: "Welcome & Goals" },
    { num: 2, label: "C1: One Syllable = One Block" },
    { num: 3, label: "C2: CV vs CVC Patterns" },
    { num: 4, label: "C3: Layout Rules & Vowels" },
    { num: 5, label: "C4: 받침 (Final Consonants)" },
    { num: 6, label: "C5: Special ㅇ Inside Blocks" },
    { num: 7, label: "Act 1: Compose Syllables" },
    { num: 8, label: "Act 2: Decompose Syllables" },
    { num: 9, label: "Act 3: Listening & Dictation" },
    { num: 10, label: "Checkpoint Quiz" },
    { num: 11, label: "Completion & Homework" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 1,
          phaseNum: 3,
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
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Phase 3</span>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>Syllable Blocks Bootcamp</span>
            </h2>
            <p className="text-xs text-zinc-400">Curated Topic: {activeLesson?.topic || "Hangeul Structure"}</p>
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
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center transition duration-300">
          <div className="p-4 bg-brand-500/10 rounded-3xl border border-brand-500/25 w-fit mx-auto text-brand-400 shadow-inner animate-pulse">
            <Sparkles className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-5xl font-black text-white tracking-tight">Hangeul 0.3</h2>
            <h3 className="text-2xl font-extrabold text-brand-400">Syllable Blocks Bootcamp</h3>
          </div>
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed font-sans">
            {metadata?.goals || "Master visual block structures, assemble consonants and vowels into squares, compose & decompose characters, and read your first real Korean words."}
          </p>
          <div className="bg-zinc-950/80 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 shadow-inner">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-white font-bold">
              <BookOpen className="w-4 h-4 text-brand-400" />
              <span>Syllabus Objectives</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Understand the visual placement of consonants and vowels</li>
              <li>Learn CV and CVC syllable patterns</li>
              <li>Build blocks given individual letters (초성, 중성, 종성)</li>
              <li>Decompose whole syllable blocks into component letters</li>
              <li>Read native vocabulary and English loanwords</li>
            </ul>
          </div>
          <button
            onClick={() => setStep(2)}
            className="bg-brand-500 hover:bg-brand-600 text-zinc-950 font-black py-4 px-10 rounded-2xl transition duration-200 text-sm flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-lg shadow-brand-500/20 active:scale-95"
          >
            <span>Begin Bootcamp</span>
            <ChevronRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      )}

      {/* Concept Screens C1-C5 Template with Embedded Micro-questions */}
      {step >= 2 && step <= 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center transition duration-300">

          {/* Concept Header */}
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 font-sans tracking-tight">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>
                {step === 2 && "C1: One Syllable = One Block"}
                {step === 3 && "C2: CV vs CVC Block Patterns"}
                {step === 4 && "C3: Layout Rules & Vowel Placements"}
                {step === 5 && "C4: 받침 (Final Consonants)"}
                {step === 6 && "C5: Silent vs Ringing 'ㅇ' inside blocks"}
              </span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black uppercase">Theory Screen {step - 1} of 5</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Concept Content Column */}
            <div className="space-y-5 text-sm leading-relaxed text-zinc-300 flex flex-col justify-between">
              <div className="space-y-4">
                {step === 2 && (
                  <>
                    <p className="font-medium">
                      In English, letters flow horizontally one after another. In Korean, letters are packed together into visual <strong>2D square blocks</strong>.
                    </p>
                    <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
                      <p>• <strong>One block = One syllable.</strong></p>
                      <p>• Blocks can stand alone (e.g. <strong>아</strong>) or join to form words (e.g. <strong>학교</strong> = 학 + 교).</p>
                      <p>• Each block holds an initial consonant, middle vowel, and optional final consonant.</p>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <p className="font-medium">
                      Korean syllable blocks have two major structural layouts depending on how many consonants they contain:
                    </p>
                    <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
                      <p>• <strong>CV (Consonant + Vowel):</strong> Tall or wide shapes. No final consonant (e.g., <strong>가</strong>, <strong>너</strong>, <strong>모</strong>, <strong>수</strong>).</p>
                      <p>• <strong>CVC (Consonant + Vowel + Consonant):</strong> Heavier blocks with a consonant stacked at the bottom (e.g., <strong>값</strong>, <strong>삶</strong>, <strong>밥</strong>).</p>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <p className="font-medium">
                      The position of the vowel in a block is dictated entirely by its primary stroke shape:
                    </p>
                    <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
                      <p>• <strong>Vertical vowels (ㅏ ㅑ ㅓ ㅕ ㅣ):</strong> Placed to the <strong>RIGHT</strong> of the consonant (e.g., ㄱ + ㅏ → <strong>가</strong>).</p>
                      <p>• <strong>Horizontal vowels (ㅗ ㅛ ㅜ ㅠ ㅡ):</strong> Placed <strong>UNDER</strong> the consonant (e.g., ㄱ + ㅗ → <strong>고</strong>).</p>
                      <p>• <strong>받침 (Final Consonant):</strong> Always sits at the bottom, under everything else.</p>
                    </div>
                  </>
                )}

                {step === 5 && (
                  <>
                    <p className="font-medium">
                      The bottom consonant in a CVC block is called the <strong>받침 (Batchim)</strong>, meaning "supporting floor" or "support".
                    </p>
                    <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
                      <p>• Only consonants can occupy the 받침 position.</p>
                      <p>• Common single-letter final consonants at this stage: <strong>ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅅ, ㅇ</strong>.</p>
                      <p>• Pronunciation of 받침 can be simplified compared to initial consonants (e.g. ㄷ, ㅅ, ㅈ all sound like 't' at the bottom).</p>
                    </div>
                  </>
                )}

                {step === 6 && (
                  <>
                    <p className="font-medium">
                      The circle consonant <strong>ㅇ</strong> plays two opposite roles depending on its location inside the block:
                    </p>
                    <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
                      <p>• <strong>At the Top (Initial):</strong> Completely silent. It serves as a placeholder when a syllable starts with a vowel sound (e.g. <strong>아</strong>, <strong>오</strong>).</p>
                      <p>• <strong>At the Bottom (Final/받침):</strong> Makes the nasal "ng" sound, as in "sing" or "ring" (e.g., <strong>방</strong>, <strong>강</strong>).</p>
                    </div>
                  </>
                )}
              </div>

              {/* Dynamic Playground Visualizer Embedded on step 4 for layout practice */}
              {step === 4 && (
                <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-brand-400">Playground</span>
                    <span className="text-lg font-black text-white">{getRenderedBlock(vizInitial, vizVowel, vizFinal)}</span>
                  </div>
                  <div className="flex gap-1 justify-center">
                    {["ㄱ", "ㄴ", "ㄷ"].map(c => (
                      <button key={c} onClick={() => setVizInitial(c)} className={`px-2 py-0.5 rounded text-[10px] font-bold ${vizInitial === c ? "bg-brand-500 text-zinc-950" : "bg-zinc-900 text-zinc-400"}`}>{c}</button>
                    ))}
                    <span className="text-zinc-600">|</span>
                    {["ㅏ", "ㅗ", "ㅡ"].map(v => (
                      <button key={v} onClick={() => setVizVowel(v)} className={`px-2 py-0.5 rounded text-[10px] font-bold ${vizVowel === v ? "bg-brand-500 text-zinc-950" : "bg-zinc-900 text-zinc-400"}`}>{v}</button>
                    ))}
                    <span className="text-zinc-600">|</span>
                    {["", "ㅁ", "ㅇ"].map(f => (
                      <button key={f} onClick={() => setVizFinal(f)} className={`px-2 py-0.5 rounded text-[10px] font-bold ${vizFinal === f ? "bg-brand-500 text-zinc-950" : "bg-zinc-900 text-zinc-400"}`}>{f === "" ? "None" : f}</button>
                    ))}
                  </div>
                </div>
              )}
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
                      <span className="inline-block mr-2 text-brand-400">{opt.id}.</span>
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 space-y-4">
                {!cChecked ? (
                  <button
                    onClick={handleCheckConceptQuestion}
                    disabled={!cSelected}
                    className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-zinc-950 font-black py-4 rounded-xl text-sm transition duration-200 uppercase tracking-widest shadow-md shadow-brand-500/15 cursor-pointer"
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

      {/* Screen 7: Activity 1 (Composition Builder) */}
      {step === 7 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center transition duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Syllable Assembly Bootcamp</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black">Item {composeIdx + 1} of {composeQuestions.length}</span>
          </div>

          {composeQuestions.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Build Target on the left */}
              <div className="space-y-6 text-center">
                <div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Composition Challenge</span>
                  <h3 className="text-sm font-semibold text-zinc-400 mt-1">Assemble the syllable block that makes the sound:</h3>
                  <h4 className="text-3xl font-black text-white tracking-tight mt-1">"{composeQuestions[composeIdx]?.target_syllable}"</h4>
                </div>

                {/* Target Slots Frame */}
                <div className="bg-zinc-950/80 border border-white/5 rounded-3xl p-6 shadow-inner space-y-4 max-w-xs mx-auto">
                  <div className="flex justify-center gap-3">
                    <div className="p-3 bg-zinc-900 border border-white/10 rounded-xl text-center min-w-[70px] shadow-sm">
                      <span className="text-[8px] font-mono text-zinc-500 block uppercase mb-1 font-bold">Initial</span>
                      <span className="text-2xl font-black text-white">{buildSlots.initial || "—"}</span>
                    </div>
                    <div className="p-3 bg-zinc-900 border border-white/10 rounded-xl text-center min-w-[70px] shadow-sm">
                      <span className="text-[8px] font-mono text-zinc-500 block uppercase mb-1 font-bold">Vowel</span>
                      <span className="text-2xl font-black text-white">{buildSlots.vowel || "—"}</span>
                    </div>
                    <div className="p-3 bg-zinc-900 border border-white/10 rounded-xl text-center min-w-[70px] shadow-sm">
                      <span className="text-[8px] font-mono text-zinc-500 block uppercase mb-1 font-bold">Final (받침)</span>
                      <span className="text-2xl font-black text-brand-400">{buildSlots.final || "None"}</span>
                    </div>
                  </div>

                  {/* Dynamic composite block preview inside composed panel */}
                  {buildSlots.initial && buildSlots.vowel && (
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Composite Result</span>
                      <span className="text-4xl font-black text-white">{getRenderedBlock(buildSlots.initial, buildSlots.vowel, buildSlots.final)}</span>
                    </div>
                  )}
                </div>

                {/* Reset button */}
                <button
                  onClick={() => setBuildSlots({ initial: "", vowel: "", final: "" })}
                  disabled={composeChecked}
                  className="px-3.5 py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mx-auto transition duration-200 cursor-pointer disabled:opacity-30"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Slots</span>
                </button>
              </div>

              {/* Letter Tiles pool on the right */}
              <div className="space-y-6">
                <div className="bg-zinc-950/80 p-6 rounded-3xl border border-white/5 shadow-inner space-y-4">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Letter Tile Bank</span>

                  {/* Consonants */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block font-sans">Consonants</span>
                    <div className="grid grid-cols-4 gap-2">
                      {["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅈ"].map(char => (
                        <button
                          key={char}
                          disabled={composeChecked}
                          onClick={() => {
                            if (!buildSlots.initial) setBuildSlots(prev => ({ ...prev, initial: char }));
                            else setBuildSlots(prev => ({ ...prev, final: char }));
                          }}
                          className="p-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 border border-white/10 font-black text-white rounded-xl flex items-center justify-center text-lg transition duration-150 hover:scale-105 active:scale-95"
                        >
                          {char}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vowels */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block font-sans">Vowels</span>
                    <div className="grid grid-cols-3 gap-2">
                      {["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"].map(char => (
                        <button
                          key={char}
                          disabled={composeChecked}
                          onClick={() => setBuildSlots(prev => ({ ...prev, vowel: char }))}
                          className="p-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 border border-white/10 font-black text-white rounded-xl flex items-center justify-center text-lg transition duration-150 hover:scale-105 active:scale-95"
                        >
                          {char}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {composeChecked && (
                  <div className={`p-5 rounded-2xl border text-xs text-left space-y-2 animate-in slide-in-from-bottom-2 duration-200 ${composeCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                    }`}>
                    <p className="font-black text-sm">{composeCorrect ? "맞아요! Correct!" : "틀렸어요! Incorrect."}</p>
                    <p className="text-zinc-300">
                      Target parts: <strong className="text-white">{composeQuestions[composeIdx]?.target_parts.initial}</strong> + <strong className="text-white">{composeQuestions[composeIdx]?.target_parts.vowel}</strong> {composeQuestions[composeIdx]?.target_parts.final ? `+ final ${composeQuestions[composeIdx]?.target_parts.final}` : ""}
                    </p>
                    <p className="text-zinc-400 text-[11px]">Explanation: The target syllable is assembled into the square block "{composeQuestions[composeIdx]?.target_syllable}".</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-white/5">
            <button onClick={() => setStep(6)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>

            {!composeChecked ? (
              <button
                onClick={handleCheckCompose}
                disabled={!buildSlots.initial || !buildSlots.vowel}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs transition duration-200 cursor-pointer"
              >
                Assemble & Check
              </button>
            ) : (
              <button
                onClick={() => {
                  setComposeChecked(false);
                  setComposeCorrect(null);
                  setBuildSlots({ initial: "", vowel: "", final: "" });
                  if (composeIdx < composeQuestions.length - 1) {
                    setComposeIdx(composeIdx + 1);
                  } else {
                    setStep(8);
                  }
                }}
                className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
              >
                {composeIdx < composeQuestions.length - 1 ? "Next Challenge" : "Continue to Activity 2"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Screen 8: Activity 2 (Decomposition Analysis) */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center transition duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Syllable Deconstruction</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black">Item {decomposeIdx + 1} of {decomposeQuestions.length}</span>
          </div>

          {decomposeQuestions.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-8 max-w-xl mx-auto w-full text-center">
              <div>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Target block</span>
                <div className="text-7xl font-black text-white tracking-tight py-4 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  {decomposeQuestions[decomposeIdx]?.syllable}
                </div>
                <p className="text-xs text-zinc-400 font-sans">Deconstruct this syllable block into its 3 constituent Hangeul letters:</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Initial Selection */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Initial (초성)</label>
                  <select
                    value={decSelected.initial}
                    onChange={e => setDecSelected(prev => ({ ...prev, initial: e.target.value }))}
                    disabled={decomposeChecked}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-brand-500 text-sm font-bold shadow-inner"
                  >
                    <option value="">-- Select --</option>
                    {decomposeQuestions[decomposeIdx]?.options.initial.map((o: string) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                {/* Vowel Selection */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Vowel (중성)</label>
                  <select
                    value={decSelected.vowel}
                    onChange={e => setDecSelected(prev => ({ ...prev, vowel: e.target.value }))}
                    disabled={decomposeChecked}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-brand-500 text-sm font-bold shadow-inner"
                  >
                    <option value="">-- Select --</option>
                    {decomposeQuestions[decomposeIdx]?.options.vowel.map((o: string) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                {/* Final Selection */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Final (종성/받침)</label>
                  <select
                    value={decSelected.final}
                    onChange={e => setDecSelected(prev => ({ ...prev, final: e.target.value }))}
                    disabled={decomposeChecked}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-brand-500 text-sm font-bold shadow-inner"
                  >
                    <option value="">None (CV only)</option>
                    {decomposeQuestions[decomposeIdx]?.options.final.filter((o: string) => o !== "").map((o: string) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              {decomposeChecked && (
                <div className={`p-5 rounded-2xl border text-xs text-left space-y-2 animate-in slide-in-from-bottom-2 duration-200 ${decomposeCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                  <p className="font-black text-sm">{decomposeCorrect ? "Correct!" : "Oops! Incorrect."}</p>
                  <p className="text-zinc-300">
                    Correct elements for {decomposeQuestions[decomposeIdx]?.syllable}: <strong className="text-white">{decomposeQuestions[decomposeIdx]?.correct_parts.initial}</strong> (initial) + <strong className="text-white">{decomposeQuestions[decomposeIdx]?.correct_parts.vowel}</strong> (vowel) {decomposeQuestions[decomposeIdx]?.correct_parts.final ? `+ <strong className="text-white">${decomposeQuestions[decomposeIdx]?.correct_parts.final}</strong> (final/받침)` : ""}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t border-white/5">
                <button onClick={() => setStep(7)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>

                {!decomposeChecked ? (
                  <button
                    onClick={handleCheckDecompose}
                    disabled={!decSelected.initial || !decSelected.vowel}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs transition duration-200 cursor-pointer"
                  >
                    Deconstruct & Check
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setDecomposeChecked(false);
                      setDecomposeCorrect(null);
                      setDecSelected({ initial: "", vowel: "", final: "" });
                      if (decomposeIdx < decomposeQuestions.length - 1) {
                        setDecomposeIdx(decomposeIdx + 1);
                      } else {
                        setStep(9);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                  >
                    {decomposeIdx < decomposeQuestions.length - 1 ? "Next Block" : "Move to Activity 3"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 9: Activity 3 (Listening and dictation with blocks) */}
      {step === 9 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center transition duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <Volume2 className="w-6 h-6 text-brand-400 animate-pulse" />
              <span>Activity 3 – Ear Training & Dictation drills</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black">Step 9 of 11</span>
          </div>

          {/* Submode Selection */}
          <div className="flex justify-center gap-2 bg-zinc-950/80 p-2 rounded-2xl border border-white/5 max-w-md mx-auto shadow-inner">
            <button
              onClick={() => setSyllableSubMode("read")}
              className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${syllableSubMode === "read" ? "bg-brand-500 text-zinc-950 font-black shadow-md shadow-brand-500/10" : "text-zinc-400 hover:text-white bg-transparent"}`}
            >
              Stage A: Reader Carousel
            </button>
            <button
              onClick={() => setSyllableSubMode("listen")}
              className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${syllableSubMode === "listen" ? "bg-brand-500 text-zinc-950 font-black shadow-md shadow-brand-500/10" : "text-zinc-400 hover:text-white bg-transparent"}`}
            >
              Stage B: listening Choose
            </button>
          </div>

          {/* Stage A: Carousel Reader */}
          {syllableSubMode === "read" && (
            <div className="space-y-8 max-w-xl mx-auto w-full text-center animate-in fade-in duration-200">
              <h3 className="text-sm font-semibold text-zinc-400">Pronounce the syllable block out loud, then listen to verify:</h3>

              <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-zinc-900/40 space-y-6 max-w-xs mx-auto shadow-xl">
                <div className="text-6xl font-black text-white filter drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                  {syllableReadList[readIdx]?.syllable}
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => speakWord(syllableReadList[readIdx]?.syllable)}
                    className="flex-1 p-3 rounded-xl bg-zinc-950 text-brand-400 hover:text-white border border-white/10 hover:border-brand-500/30 transition duration-200 flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 animate-bounce" />
                    <span>Speak</span>
                  </button>
                  <button
                    onClick={() => setShowVowelHint(!showVowelHint)}
                    className="flex-1 p-3 rounded-xl bg-zinc-950 text-zinc-400 hover:text-white border border-white/10 transition duration-200 text-xs font-black uppercase tracking-wider"
                  >
                    {showVowelHint ? `Hint: ${syllableReadList[readIdx]?.romanization}` : "Reveal Hint"}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-white/5">
                <button onClick={() => setStep(8)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>

                <button
                  onClick={() => {
                    setShowVowelHint(false);
                    if (readIdx < syllableReadList.length - 1) {
                      setReadIdx(readIdx + 1);
                    } else {
                      setSyllableSubMode("listen");
                    }
                  }}
                  className="bg-brand-500 hover:bg-brand-600 text-zinc-950 px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                >
                  {readIdx < syllableReadList.length - 1 ? "Next Syllable" : "Continue to Ear Training"}
                </button>
              </div>
            </div>
          )}

          {/* Stage B: Ear Discrimination */}
          {syllableSubMode === "listen" && (
            <div className="space-y-8 max-w-xl mx-auto w-full text-center animate-in fade-in duration-200">
              <h3 className="text-sm font-semibold text-zinc-400">Click to listen to the syllable, then choose the correct block:</h3>

              <button
                onClick={() => speakWord(listenQuestions[listenIdx]?.audio_text)}
                className="p-6 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-full mx-auto transition duration-250 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-10 h-10 animate-pulse" />
              </button>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                {listenQuestions[listenIdx]?.options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !listenChecked && setListenSelected(opt)}
                    disabled={listenChecked}
                    className={`p-5 rounded-2xl font-black text-2xl border transition duration-150 ${listenSelected === opt
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                      } ${listenChecked && opt === listenQuestions[listenIdx]?.correct_answer
                        ? "border-accent-teal bg-accent-teal/10 text-white"
                        : ""
                      } ${listenChecked && listenSelected === opt && listenSelected !== listenQuestions[listenIdx]?.correct_answer
                        ? "border-red-500 bg-red-500/10 text-red-400"
                        : ""
                      }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {listenChecked && (
                <div className={`p-5 rounded-2xl border text-xs text-left space-y-1 animate-in slide-in-from-bottom-2 duration-200 ${listenCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                  <p className="font-black text-sm">{listenCorrect ? "Correct!" : "Oops! Incorrect."}</p>
                  <p className="text-zinc-300">You heard the syllable: <strong className="text-white select-all">{listenQuestions[listenIdx]?.correct_answer}</strong>.</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t border-white/5">
                <button onClick={() => setSyllableSubMode("read")} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>

                {!listenChecked ? (
                  <button
                    onClick={handleCheckListen}
                    disabled={!listenSelected}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs transition duration-200 cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setListenChecked(false);
                      setListenCorrect(null);
                      setListenSelected(null);
                      if (listenIdx < listenQuestions.length - 1) {
                        setListenIdx(listenIdx + 1);
                      } else {
                        // Switch to word dictation mode
                        setWordSubMode("cards");
                        setStep(10); // Checkpoint mini-quiz is next
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                  >
                    {listenIdx < listenQuestions.length - 1 ? "Next Ear Training" : "Move to Quiz"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 10: Mini-Quiz (Checkpoint) */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center transition duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <Award className="w-6 h-6 text-brand-400 animate-bounce" />
              <span>Step 10 – Syllables Checkpoint mini-quiz</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-black">Step 10 of {totalSteps}</span>
          </div>

          {quizQuestions.length === 0 ? (
            <div className="text-center py-10 max-w-md mx-auto space-y-6">
              <div className="p-4 bg-brand-500/10 rounded-3xl border border-brand-500/25 w-fit mx-auto text-brand-400">
                <BrainCircuit className="w-12 h-12 animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Generate Checkpoint Mini-Quiz</h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">Choose pre-authored static questions from syllabus guidelines or generate an interactive dynamic set via Gwan-Sik using Llama AI.</p>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={async () => {
                    setLoadingQuiz(true);
                    try {
                      const data = await apiRequest("/lessons/quiz/phase3/generate?use_ai=false", { method: "POST" });
                      setQuizQuestions(data || []);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setLoadingQuiz(false);
                    }
                  }}
                  className="w-full bg-zinc-950 hover:bg-zinc-900 border border-white/10 text-zinc-300 font-bold py-4 rounded-2xl transition duration-200 text-xs flex items-center justify-center gap-2 cursor-pointer"
                  disabled={loadingQuiz}
                >
                  {loadingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load Pre-Authored static Quiz"}
                </button>

                <button
                  onClick={async () => {
                    setLoadingQuiz(true);
                    try {
                      const data = await apiRequest("/lessons/quiz/phase3/generate?use_ai=true", { method: "POST" });
                      setQuizQuestions(data || []);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setLoadingQuiz(false);
                    }
                  }}
                  className="w-full bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4 rounded-2xl transition duration-200 text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-500/15 cursor-pointer"
                  disabled={loadingQuiz}
                >
                  {loadingQuiz ? <Loader2 className="w-4 h-4 animate-spin text-zinc-950" /> : <Sparkles className="w-4 h-4 text-zinc-950" />}
                  <span>Generate dynamic Quiz via Llama AI</span>
                </button>
              </div>
            </div>
          ) : quizScore === null ? (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="flex justify-between text-xs text-zinc-500 font-mono">
                <span>Quiz Question {quizIdx + 1} of {quizQuestions.length}</span>
                <span>Type: {quizQuestions[quizIdx]?.type === "choice" ? "Multiple Choice" : "Keyboard Input"}</span>
              </div>

              <h3 className="text-xl font-black text-white text-center leading-relaxed">
                {quizQuestions[quizIdx]?.question}
              </h3>

              {quizQuestions[quizIdx]?.type === "choice" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                  {quizQuestions[quizIdx]?.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelected(opt)}
                      disabled={quizChecked}
                      className={`p-4 rounded-xl font-black text-sm border transition duration-200 text-left ${quizSelected === opt
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300"
                        } ${quizChecked && opt === quizQuestions[quizIdx]?.correct_answer
                          ? "border-accent-teal bg-accent-teal/10 text-white"
                          : ""
                        } ${quizChecked && quizSelected === opt && quizSelected !== quizQuestions[quizIdx]?.correct_answer
                          ? "border-red-500 bg-red-500/10 text-red-400"
                          : ""
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={quizWriting}
                    onChange={(e) => setQuizWriting(e.target.value)}
                    placeholder="Type Hangeul block here..."
                    className="w-full bg-zinc-950 border border-white/10 p-4 rounded-xl outline-none focus:border-brand-500 text-center font-sans text-lg text-white shadow-inner"
                    disabled={quizChecked}
                    onKeyDown={(e) => e.key === "Enter" && !quizChecked && handleCheckQuiz()}
                  />
                  {/* Keyboard helpers */}
                  {!quizChecked && (
                    <div className="flex flex-wrap gap-1.5 justify-center bg-zinc-900/30 p-4 rounded-2xl border border-white/5">
                      {["가", "나", "다", "라", "마", "바", "사", "자", "나무", "머리", "친구", "버스", "택시", "커피"].map(char => (
                        <button
                          key={char}
                          onClick={() => setQuizWriting(prev => prev + char)}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-xs font-bold text-white rounded-lg border border-white/5"
                        >
                          {char}
                        </button>
                      ))}
                      <button
                        onClick={() => setQuizWriting(prev => prev.slice(0, -1))}
                        className="px-3 py-1.5 bg-red-950/20 text-red-400 hover:bg-red-950/40 text-xs font-bold rounded-lg border border-red-500/10"
                      >
                        Del
                      </button>
                    </div>
                  )}
                </div>
              )}

              {quizChecked && (
                <div className={`p-5 rounded-2xl border text-xs text-left space-y-2 animate-in slide-in-from-bottom-2 duration-200 ${quizCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                  <p className="font-black text-sm">{quizCorrect ? "Correct! Excellent." : "Incorrect."}</p>
                  <p className="text-zinc-300">{quizQuestions[quizIdx]?.explanation}</p>
                  {!quizCorrect && <p className="font-mono text-zinc-400 mt-1">Correct Answer: {quizQuestions[quizIdx]?.correct_answer}</p>}
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t border-white/5">
                <div />
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={quizQuestions[quizIdx]?.type === "choice" ? !quizSelected : !quizWriting.trim()}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs transition duration-200 cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setQuizChecked(false);
                      setQuizCorrect(null);
                      setQuizSelected(null);
                      setQuizWriting("");
                      if (quizIdx < quizQuestions.length - 1) {
                        setQuizIdx(quizIdx + 1);
                      } else {
                        const score = Math.round(((quizQuestions.length - quizMistakes.length) / quizQuestions.length) * 100);
                        setQuizScore(score);
                        apiRequest("/lessons/quiz/phase3/submit", {
                          method: "POST",
                          body: JSON.stringify({ answers: [], score: score })
                        });
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                  >
                    {quizIdx < quizQuestions.length - 1 ? "Next Item" : "See Final Score"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Results View */
            <div className="space-y-6 max-w-xl mx-auto w-full text-center py-4">
              <div className="p-6 bg-zinc-950/80 rounded-3xl border border-white/5 space-y-5 shadow-inner">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Bootcamp Checkpoint Completed</span>
                <h3 className="text-7xl font-black bg-gradient-to-r from-brand-500 to-amber-500 bg-clip-text text-transparent filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.1)]">{quizScore}%</h3>
                <p className="text-zinc-300 text-xs md:text-sm leading-relaxed max-w-sm mx-auto">
                  {quizScore >= 80 ? "Fantastic job! You've mastered Korean syllable block assembly, vowel placements, and initial vocabulary." : "Good attempt! We recommend reviewing the vowel shapes and practicing the 받침 bottom consonant rules."}
                </p>

                {/* tutor summaries strictly on-demand */}
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
                          <span>Generating AI report...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                          <span>Get Tutor Feedback Report via Llama AI</span>
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
                    setQuizScore(null);
                    setQuizMistakes([]);
                    setTutorSummary(null);
                  }}
                  className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition cursor-pointer"
                >
                  Retake Quiz
                </button>
                <button
                  onClick={() => setStep(11)}
                  className="bg-brand-500 hover:bg-brand-600 text-zinc-950 px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                >
                  View Homework <ChevronRight className="w-4 h-4 text-zinc-950" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 11: Homework */}
      {step === 11 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center transition duration-300">
          <div className="p-4 bg-brand-500/10 rounded-3xl border border-brand-500/25 w-fit mx-auto text-brand-400 animate-bounce">
            <Award className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tight">Syllable blocks Complete! 🇰🇷✨</h2>
            <p className="text-zinc-400 text-xs font-sans">You are now equipped to read CV/CVC block patterns and initial native/loanwords.</p>
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
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-400 block font-mono">Recommended Tasks:</span>
                <ul className="list-decimal list-inside space-y-2 text-zinc-400 pl-1">
                  <li>
                    Search YouTube for: <strong className="text-white select-all">"{recommendations.youtube_search}"</strong> and practice parsing complex structures.
                  </li>
                  <li>
                    Ask Gwan-Sik tomorrow: <strong className="text-brand-300">"Give me a 10-item dictation with 2-syllable words only"</strong>.
                  </li>
                </ul>
              </div>
            </div>
          )}

          <button
            onClick={onComplete}
            className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4.5 px-10 rounded-2xl transition duration-200 text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/20 cursor-pointer active:scale-95"
          >
            <span>Finish Phase 3</span>
            <ChevronRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      )}
    </div>
  );
}
