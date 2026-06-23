"use client";

import { useEffect, useState, useRef } from "react";
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
  ArrowRight,
  Info,
  Save,
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

const playSFX = (type: "correct" | "wrong") => {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "correct") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.stop(ctx.currentTime + 0.4);
      window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 20, type: "correct" } }));
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150.0, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.frequency.exponentialRampToValueAtTime(80.0, ctx.currentTime + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.stop(ctx.currentTime + 0.4);
      window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: -10, type: "wrong" } }));
    }
  } catch (e) {
    console.error("AudioContext not supported or blocked", e);
  }
};

interface Course4Phase1ConnectorsWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course4Phase1ConnectorsWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course4Phase1ConnectorsWizardProps) {
  const phaseNum = 1;
  const getStepMaxXP = (sNum: number) => {
    try {
      return (xpAudit as any)["4"]?.[phaseNum.toString()]?.steps?.[sNum.toString()]?.max_xp ?? 35;
    } catch (e) {
      return 35;
    }
  };
  const getStepXP = (sNum: number) => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(`hangeulai_c4p${phaseNum}_s${sNum}_earned_xp`) || "0", 10);
  };

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c4p1_step");
    const savedMax = localStorage.getItem("hangeulai_c4p1_max_step");
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
      localStorage.setItem("hangeulai_c4p1_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 11;

  // Persist progress to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hangeulai_c4p1_step");
    if (saved) {
      const parsedStep = parseInt(saved, 10);
      if (parsedStep >= 1 && parsedStep <= 11) setStep(parsedStep);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hangeulai_c4p1_step", String(step));
  }, [step]);

  // DB Data loaded
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Concept Explanation Flip States
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  // Concept Micro-questions state
  const [c1Answer, setC1Answer] = useState<string | null>(null);
  const [c1Checked, setC1Checked] = useState(false);
  const [c1Correct, setC1Correct] = useState<boolean | null>(null);

  const [c2Answer, setC2Answer] = useState<string | null>(null);
  const [c2Checked, setC2Checked] = useState(false);
  const [c2Correct, setC2Correct] = useState<boolean | null>(null);

  const [c3Answer, setC3Answer] = useState<string | null>(null);
  const [c3Checked, setC3Checked] = useState(false);
  const [c3Correct, setC3Correct] = useState<boolean | null>(null);

  const [c4Answer, setC4Answer] = useState<string | null>(null);
  const [c4Checked, setC4Checked] = useState(false);
  const [c4Correct, setC4Correct] = useState<boolean | null>(null);

  // Activity 1B (Merger Check)
  const [activeMergerCheck, setActiveMergerCheck] = useState<Record<string, { answer: string | null, checked: boolean, correct: boolean | null }>>({});

  // Activity 2A states (Choose Connector - recognitionItems)
  const [recognitionItems, setRecognitionItems] = useState<any[]>([]);
  const [recIdx, setRecIdx] = useState(0);
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [recChecked, setRecChecked] = useState(false);
  const [recCorrect, setRecCorrect] = useState<boolean | null>(null);

  // Activity 2B states (Relationship Type Classifier)
  const [relIdx, setRelIdx] = useState(0);
  const [selectedRel, setSelectedRel] = useState<string | null>(null);
  const [relChecked, setRelChecked] = useState(false);
  const [relCorrect, setRelCorrect] = useState<boolean | null>(null);

  // Activity 3A states (Sentence Expansion)
  const [expansionTemplates, setExpansionTemplates] = useState<any>(null);
  const [selectedBaseId, setSelectedBaseId] = useState<string>("base_1");
  const [activeTab, setActiveTab] = useState<"but" | "because" | "so">("but");
  const [selectedTilePhrase, setSelectedTilePhrase] = useState<string | null>(null);
  const [expandedKo, setExpandedKo] = useState("");
  const [expandedEn, setExpandedEn] = useState("");
  const [isExpanding, setIsExpanding] = useState(false);
  
  // Speaking practice
  const [recording, setRecording] = useState(false);
  const [speakingChecked, setSpeakingChecked] = useState(false);
  const [speakingFeedback, setSpeakingFeedback] = useState("");
  const [speakingScore, setSpeakingScore] = useState<number | null>(null);

  // Activity 3C states (Personal Builder)
  const [selectedTopic, setSelectedTopic] = useState<string>("topic_habits");
  const [personalClause1, setPersonalClause1] = useState("");
  const [personalClause2, setPersonalClause2] = useState("");
  const [personalConnector, setPersonalConnector] = useState("-아서/어서");
  const [personalResult, setPersonalResult] = useState("");
  const [savedSentences, setSavedSentences] = useState<any[]>([]);

  // Quiz states
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Homework check states
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Tutor launchers
  const [loadingTutor, setLoadingTutor] = useState(false);

  // --- Start Progress State Preservation ---
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hangeulai_c4p1_progress_state");
        if (saved) {
          const state = JSON.parse(saved);
            // Deleted state.step override to allow teleportation
            // Deleted state.maxStep override to allow teleportation
            if (state.c1Answer !== undefined) setC1Answer(state.c1Answer);
            if (state.c1Checked !== undefined) setC1Checked(state.c1Checked);
            if (state.c1Correct !== undefined) setC1Correct(state.c1Correct);
            if (state.c2Answer !== undefined) setC2Answer(state.c2Answer);
            if (state.c2Checked !== undefined) setC2Checked(state.c2Checked);
            if (state.c2Correct !== undefined) setC2Correct(state.c2Correct);
            if (state.c3Answer !== undefined) setC3Answer(state.c3Answer);
            if (state.c3Checked !== undefined) setC3Checked(state.c3Checked);
            if (state.c3Correct !== undefined) setC3Correct(state.c3Correct);
            if (state.c4Answer !== undefined) setC4Answer(state.c4Answer);
            if (state.c4Checked !== undefined) setC4Checked(state.c4Checked);
            if (state.c4Correct !== undefined) setC4Correct(state.c4Correct);
            if (state.activeMergerCheck !== undefined) setActiveMergerCheck(state.activeMergerCheck);
            if (state.recIdx !== undefined) setRecIdx(state.recIdx);
            if (state.selectedOptId !== undefined) setSelectedOptId(state.selectedOptId);
            if (state.recChecked !== undefined) setRecChecked(state.recChecked);
            if (state.recCorrect !== undefined) setRecCorrect(state.recCorrect);
            if (state.relIdx !== undefined) setRelIdx(state.relIdx);
            if (state.selectedRel !== undefined) setSelectedRel(state.selectedRel);
            if (state.relChecked !== undefined) setRelChecked(state.relChecked);
            if (state.relCorrect !== undefined) setRelCorrect(state.relCorrect);
            if (state.selectedBaseId !== undefined) setSelectedBaseId(state.selectedBaseId);
            if (state.activeTab !== undefined) setActiveTab(state.activeTab);
            if (state.selectedTilePhrase !== undefined) setSelectedTilePhrase(state.selectedTilePhrase);
            if (state.selectedTopic !== undefined) setSelectedTopic(state.selectedTopic);
            if (state.personalResult !== undefined) setPersonalResult(state.personalResult);
            if (state.quizIdx !== undefined) setQuizIdx(state.quizIdx);
            if (state.quizChecked !== undefined) setQuizChecked(state.quizChecked);
            if (state.quizCorrect !== undefined) setQuizCorrect(state.quizCorrect);
            if (state.quizSelectedOpt !== undefined) setQuizSelectedOpt(state.quizSelectedOpt);
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
            c1Answer,
            c1Checked,
            c1Correct,
            c2Answer,
            c2Checked,
            c2Correct,
            c3Answer,
            c3Checked,
            c3Correct,
            c4Answer,
            c4Checked,
            c4Correct,
            activeMergerCheck,
            recIdx,
            selectedOptId,
            recChecked,
            recCorrect,
            relIdx,
            selectedRel,
            relChecked,
            relCorrect,
            selectedBaseId,
            activeTab,
            selectedTilePhrase,
            selectedTopic,
            personalResult,
            quizIdx,
            quizChecked,
            quizCorrect,
            quizSelectedOpt,
            quizMistakes,
            quizScore,
            completedHomework
        };
        localStorage.setItem("hangeulai_c4p1_progress_state", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save progress state:", e);
      }
    }
  }, [step, maxStep, c1Answer, c1Checked, c1Correct, c2Answer, c2Checked, c2Correct, c3Answer, c3Checked, c3Correct, c4Answer, c4Checked, c4Correct, activeMergerCheck, recIdx, selectedOptId, recChecked, recCorrect, relIdx, selectedRel, relChecked, relCorrect, selectedBaseId, activeTab, selectedTilePhrase, selectedTopic, personalResult, quizIdx, quizChecked, quizCorrect, quizSelectedOpt, quizMistakes, quizScore, completedHomework]);
  // --- End Progress State Preservation ---

  const [tutorSession, setTutorSession] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!metadata) {
          const res = await apiJson("/lessons/phases/korean3/1/metadata");
          setMetadata(res);
        }
        if (step >= 6 && !coreData) {
          const res = await apiJson("/lessons/phases/korean3/1/core-data");
          setCoreData(res);
        }
        if (step >= 7 && recognitionItems.length === 0) {
          const res = await apiJson("/lessons/practice/connectors/recognition");
          setRecognitionItems(res.items || []);
        }
        if (step >= 9 && !expansionTemplates) {
          const res = await apiJson("/lessons/practice/connectors/expansion-templates");
          setExpansionTemplates(res);
        }
        if (step >= 10 && quizBlueprint.length === 0) {
          const res = await apiJson("/lessons/quiz/korean3/phase-1/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        }
        if (step >= 11 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean3/1/homework");
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

  // Concept MCQ Verifiers
  const handleCheckC1 = () => {
    if (!c1Answer) return;
    const correct = c1Answer === "B";
    setC1Correct(correct);
    setC1Checked(true);
    playSFX(correct ? "correct" : "wrong");
  };

  const handleCheckC2 = () => {
    if (!c2Answer) return;
    const correct = c2Answer === "A";
    setC2Correct(correct);
    setC2Checked(true);
    playSFX(correct ? "correct" : "wrong");
  };

  const handleCheckC3 = () => {
    if (!c3Answer) return;
    const correct = c3Answer === "C";
    setC3Correct(correct);
    setC3Checked(true);
    playSFX(correct ? "correct" : "wrong");
  };

  const handleCheckC4 = () => {
    if (!c4Answer) return;
    const correct = c4Answer === "B";
    setC4Correct(correct);
    setC4Checked(true);
    playSFX(correct ? "correct" : "wrong");
  };

  // Activity 1B Before/After Merger Check
  const handleCheckMerger = (id: string, selected: string, correct: string) => {
    const isCorrect = selected === correct;
    setActiveMergerCheck(prev => ({
      ...prev,
      [id]: { answer: selected, checked: true, correct: isCorrect }
    }));
    playSFX(isCorrect ? "correct" : "wrong");
  };

  // Activity 2A Connector Check
  const handleCheckRec = async () => {
    const current = recognitionItems[recIdx];
    if (!current || !selectedOptId) return;

    try {
      const correctOpt = current.options.find((o: any) => o.id === selectedOptId);
      const isCorrect = correctOpt ? correctOpt.correct : false;

      await apiJson("/lessons/practice/connectors/recognition/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          option_id: selectedOptId,
          time_taken_ms: 1200
        })
      });

      setRecChecked(true);
      setRecCorrect(isCorrect);
      playSFX(isCorrect ? "correct" : "wrong");
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 2B Relationship Check
  const handleCheckRel = () => {
    const current = recognitionItems[relIdx];
    if (!current || !selectedRel) return;

    const isCorrect = selectedRel.toLowerCase() === current.relationship_type.toLowerCase();
    setRelChecked(true);
    setRelCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  // Activity 3A Expansion Check
  const handleExpandSentence = async (phraseKo: string) => {
    setSelectedTilePhrase(phraseKo);
    setIsExpanding(true);
    setSpeakingChecked(false);
    setSpeakingFeedback("");
    setSpeakingScore(null);
    try {
      const res = await apiJson("/lessons/practice/connectors/expand", {
        method: "POST",
        body: JSON.stringify({
          base_clause_id: selectedBaseId,
          connector: activeTab,
          clause_content: phraseKo
        })
      });
      setExpandedKo(res.sentence_ko);
      setExpandedEn(res.sentence_en);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleSaveExpanded = async () => {
    if (!expandedKo) return;
    try {
      await apiJson("/lessons/users/connector-sentences/save", {
        method: "POST",
        body: JSON.stringify({ sentence_ko: expandedKo, sentence_en: expandedEn })
      });
      setSavedSentences(prev => [...prev, { ko: expandedKo, en: expandedEn }]);
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("Sentence saved successfully!") } }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartRecording = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      handleCheckSpeaking();
    }, 2000);
  };

  const handleCheckSpeaking = async () => {
    try {
      const res = await apiJson("/lessons/practice/connectors/speaking", {
        method: "POST",
        body: JSON.stringify({ target_text: expandedKo })
      });
      setSpeakingChecked(true);
      setSpeakingFeedback(res.feedback);
      setSpeakingScore(res.accuracy_score);
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 3C Personal Builder
  const handleBuildPersonal = () => {
    if (!personalClause1.trim() || !personalClause2.trim()) return;
    
    let combined = "";
    let english = "";
    if (personalConnector === "-고") {
      combined = `${personalClause1}고 ${personalClause2}`;
      english = `${personalClause1} and ${personalClause2}`;
    } else if (personalConnector === "-지만") {
      combined = `${personalClause1}지만 ${personalClause2}`;
      english = `${personalClause1} but ${personalClause2}`;
    } else {
      combined = `${personalClause1}어서 ${personalClause2}`;
      english = `Because ${personalClause1}, ${personalClause2}`;
    }
    
    setPersonalResult(combined);
    setSavedSentences(prev => [...prev, { ko: combined, en: english }]);
  };

  // Quiz
  const handleCheckQuiz = () => {
    const current = quizBlueprint[quizIdx];
    if (!current) return;

    const isCorrect = quizSelectedOpt === current.correct_answer;
    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
    if (!isCorrect) {
      setQuizMistakes(prev => [...prev, current.id]);
    }
  };

  const handleNextQuizOrComplete = async () => {
    if (quizIdx < quizBlueprint.length - 1) {
      setQuizIdx(quizIdx + 1);
      setQuizSelectedOpt(null);
      setQuizChecked(false);
      setQuizCorrect(null);
    } else {
      setFinishingQuiz(true);
      try {
        const correctCount = quizBlueprint.length - quizMistakes.length;
        const score = Math.round((correctCount / quizBlueprint.length) * 100);
        await apiJson("/lessons/quiz/korean3/phase-1/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setStep(11); // Proceed to Homework/Tutor-Chat screen
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
      await apiJson("/lessons/phases/korean3/1/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Launch AI Connector practice
  const handleLaunchB1Tutor = async () => {
    setLoadingTutor(true);
    setTutorSession(null);
    try {
      const res = await apiJson("/lessons/conversation/b1/connectors-practice/start", { method: "POST" });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

  const outlineSteps = [
    { num: 1, label: "Welcome & Overview" },
    { num: 2, label: "Concept 1 – Connecting Ideas Goal" },
    { num: 3, label: "Concept 2 – Clause Merger Pattern" },
    { num: 4, label: "Concept 3 – Core Relationships" },
    { num: 5, label: "Concept 4 – Example Merger Case" },
    { num: 6, label: "Activity 1 – Core Connectors & Mergers" },
    { num: 7, label: "Activity 2A – Connector Selection" },
    { num: 8, label: "Activity 2B – Relationship Classifiers" },
    { num: 9, label: "Activity 3 – Expansions & Speaking" },
    { num: 10, label: "Activity 4 – Strategy Check Quiz" },
    { num: 11, label: "Tutor Chat & Practice Session" }
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 4,
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
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Connecting Ideas (B1 Core)"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Level B1 - Phase 1</p>
          </div>
        </div>
        
        {/* Active progress bar */}
        <div className="flex items-center space-x-4">
          <div className="w-40 h-3 bg-zinc-900/80 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full transition-all duration-500" 
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
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="p-3 bg-indigo-500/10 rounded-full border border-indigo-500/25 w-fit mx-auto text-indigo-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight">Connectors – “Because, So, But”</h2>
          <h3 className="text-2xl font-extrabold text-indigo-400 mt-2">Level B1 - Phase 1</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Link your sentences to explain reasons, results, and contrasts."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Learning Goals:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Understand and use clause connectors: -아서/-어서, 그래서, 하지만/그런데",
                "Merge two simple sentences into one connected sentence showing reason or contrast",
                "Recognise semantic relationships in sentences and expand clauses dynamically"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 30} minutes</p>
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <span>Start Phase 1</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Screen 2: Concept 1 - B1 connecting ideas goal */}
      {step === 2 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen C1 – Connecting Ideas Goal</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="space-y-4 text-left max-w-2xl mx-auto">
            <p className="text-lg text-zinc-200 italic font-medium leading-relaxed border-l-4 border-indigo-500 pl-4 py-1 bg-indigo-500/5 rounded-r-xl">
              "At B1, you should be able to connect phrases and sentences to describe experiences and give reasons. In this phase, you’ll learn to join your sentences with words like ‘because’, ‘so’ and ‘but’."
            </p>
            <p className="text-zinc-400 text-sm">
              Instead of producing many short, simple, choppy sentences (A2 level), you will learn to structure fewer, more connected sentences showing logical relationships like cause, contrast, and result (B1 level).
            </p>
          </div>

          {/* Micro MCQ Check */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 max-w-xl mx-auto w-full space-y-4 text-left">
            <p className="text-xs text-indigo-400 font-black uppercase tracking-wider font-mono">💡 Micro-Question Check:</p>
            <p className="text-sm font-bold text-white">Which sounds more natural?</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: "A", text: "A) “I like this cafe. It's quiet.”" },
                { id: "B", text: "B) “Because it's quiet, I like this cafe.”" }
              ].map((opt) => {
                const isSelected = c1Answer === opt.id;
                const isCorrectOpt = opt.id === "B";
                return (
                  <button
                    key={opt.id}
                    disabled={c1Checked}
                    onClick={() => setC1Answer(opt.id)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all duration-200 ${
                      isSelected 
                        ? "border-indigo-500 bg-indigo-500/10 text-white" 
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    } ${c1Checked && isCorrectOpt ? "border-emerald-500 bg-emerald-500/10 text-white" : ""} ${
                      c1Checked && isSelected && !isCorrectOpt ? "border-red-500 bg-red-500/10 text-white" : ""
                    }`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {c1Checked && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 animate-fade-in">
                <p className="font-extrabold text-white mb-1">
                  {c1Correct ? "✓ Correct!" : "✗ Incorrect."}
                </p>
                <p>At Level B1, expressing logical connections in a single coherent sentence (Option B) sounds much more natural and mature than using isolated, choppy sentences (Option A).</p>
              </div>
            )}

            {!c1Checked && (
              <button
                disabled={!c1Answer}
                onClick={handleCheckC1}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
              >
                Check Answer
              </button>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 4 Phase 1 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 4 Phase 1 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Continue <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Concept 2 - From two sentences to one connected sentence */}
      {step === 3 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen C2 – From Two Sentences to One Connected Sentence</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          <div className="space-y-4 text-left max-w-2xl mx-auto text-sm text-zinc-300">
            <p>
              Two separate facts or concepts can be merged together seamlessly. The syntax rule uses:
            </p>
            <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl font-mono text-center text-white">
              [Reason Clause] + <span className="text-indigo-400 font-bold">-아서/-어서</span> + [Result Clause]
            </div>
            <p>
              Example:
              <br />
              Separate: <span className="text-zinc-400">이 카페를 좋아해요. 조용해요.</span> (I like this cafe. It's quiet.)
              <br />
              Merged: <span className="text-white font-bold font-korean">이 카페는 조용해서 좋아해요.</span> ("Because it's quiet, I like this cafe.")
            </p>
          </div>

          {/* Micro MCQ Check */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 max-w-xl mx-auto w-full space-y-4 text-left">
            <p className="text-xs text-indigo-400 font-black uppercase tracking-wider font-mono">💡 Micro-Question Check:</p>
            <p className="text-sm font-bold text-white">In “이 카페는 조용해서 좋아해요”, which part is the reason and which is the result?</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: "A", text: "A) “이 카페는 조용해서” is the reason, “좋아해요” is the result." },
                { id: "B", text: "B) “좋아해요” is the reason, “이 카페는 조용해서” is the result." }
              ].map((opt) => {
                const isSelected = c2Answer === opt.id;
                const isCorrectOpt = opt.id === "A";
                return (
                  <button
                    key={opt.id}
                    disabled={c2Checked}
                    onClick={() => setC2Answer(opt.id)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all duration-200 ${
                      isSelected 
                        ? "border-indigo-500 bg-indigo-500/10 text-white" 
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    } ${c2Checked && isCorrectOpt ? "border-emerald-500 bg-emerald-500/10 text-white" : ""} ${
                      c2Checked && isSelected && !isCorrectOpt ? "border-red-500 bg-red-500/10 text-white" : ""
                    }`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {c2Checked && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 animate-fade-in">
                <p className="font-extrabold text-white mb-1">
                  {c2Correct ? "✓ Correct!" : "✗ Incorrect."}
                </p>
                <p>The connector suffix <span className="text-indigo-400 font-bold">-아서/-어서</span> attaches to the cause/reason verb/adjective (조용하다 &rarr; 조용해서), while the independent main clause specifies the result (좋아해요).</p>
              </div>
            )}

            {!c2Checked && (
              <button
                disabled={!c2Answer}
                onClick={handleCheckC2}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
              >
                Check Answer
              </button>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 4 Phase 1 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 4 Phase 1 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => {
    if (courseXP < 0) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 1, you need at least 0 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Continue <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Concept 3 - Three core relationships */}
      {step === 4 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen C3 – Three Core Relationships: because, so, but</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          <div className="space-y-4 text-left max-w-2xl mx-auto text-xs text-zinc-300">
            <p className="text-sm">We focus on three primary semantic relationships:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl">
                <span className="text-indigo-400 font-extrabold text-sm block">1. Reason (Why?)</span>
                <p className="font-bold text-white mt-1">-아서/-어서</p>
                <p className="text-[10px] text-zinc-500">"because..." (attached to verbs)</p>
                <p className="font-korean text-zinc-300 mt-2 text-[11px]">피곤해서 일찍 잘 거예요.</p>
                <p className="text-[10px] text-zinc-500">"Because I'm tired, I'll sleep early."</p>
              </div>
              <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl">
                <span className="text-indigo-400 font-extrabold text-sm block">2. Result (So what?)</span>
                <p className="font-bold text-white mt-1">그래서</p>
                <p className="text-[10px] text-zinc-500">"so / therefore..." (starts sentences)</p>
                <p className="font-korean text-zinc-300 mt-2 text-[11px]">피곤해요. 그래서 일찍 잘 거예요.</p>
                <p className="text-[10px] text-zinc-500">"I'm tired. So I'll sleep early."</p>
              </div>
              <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl">
                <span className="text-indigo-400 font-extrabold text-sm block">3. Contrast (Opposing)</span>
                <p className="font-bold text-white mt-1">하지만 / 그런데</p>
                <p className="text-[10px] text-zinc-500">"but / however..."</p>
                <p className="font-korean text-zinc-300 mt-2 text-[11px]">공부하지만 아직 한국어가 어려워요.</p>
                <p className="text-[10px] text-zinc-500">"I study, but Korean is still difficult."</p>
              </div>
            </div>
          </div>

          {/* Micro MCQ Check */}
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 max-w-xl mx-auto w-full space-y-4 text-left">
            <p className="text-xs text-indigo-400 font-black uppercase tracking-wider font-mono">💡 Micro-Question Check:</p>
            <p className="text-sm font-bold text-white">Which connector shows contrast: 해서 / 그래서 / 하지만?</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: "A", text: "해서 (because / so)" },
                { id: "B", text: "그래서 (therefore)" },
                { id: "C", text: "하지만 (but / however)" }
              ].map((opt) => {
                const isSelected = c3Answer === opt.id;
                const isCorrectOpt = opt.id === "C";
                return (
                  <button
                    key={opt.id}
                    disabled={c3Checked}
                    onClick={() => setC3Answer(opt.id)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all duration-200 ${
                      isSelected 
                        ? "border-indigo-500 bg-indigo-500/10 text-white" 
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    } ${c3Checked && isCorrectOpt ? "border-emerald-500 bg-emerald-500/10 text-white" : ""} ${
                      c3Checked && isSelected && !isCorrectOpt ? "border-red-500 bg-red-500/10 text-white" : ""
                    }`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {c3Checked && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 animate-fade-in">
                <p className="font-extrabold text-white mb-1">
                  {c3Correct ? "✓ Correct!" : "✗ Incorrect."}
                </p>
                <p><strong>하지만</strong> (and <strong>그런데</strong>) introduce a contrast or opposition between two clauses, acting like the English "but".</p>
              </div>
            )}

            {!c3Checked && (
              <button
                disabled={!c3Answer}
                onClick={handleCheckC3}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
              >
                Check Answer
              </button>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 4 Phase 1 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 4 Phase 1 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Continue <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Concept 4 - Example merger (cafe sentence) */}
      {step === 5 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Concept Screen C4 – Example Merger Case</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 5 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 max-w-xl mx-auto w-full space-y-4 text-left">
            <p className="text-xs text-indigo-400 font-black uppercase tracking-wider font-mono">💡 Interactive Sentence Choice:</p>
            <p className="text-sm font-bold text-white">Which version sounds more connected?</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: "A", text: "이 카페를 좋아해요. 조용해요. (Separate facts)" },
                { id: "B", text: "이 카페는 조용해서 좋아해요. (Connected clause)" }
              ].map((opt) => {
                const isSelected = c4Answer === opt.id;
                const isCorrectOpt = opt.id === "B";
                return (
                  <button
                    key={opt.id}
                    disabled={c4Checked}
                    onClick={() => setC4Answer(opt.id)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all duration-200 ${
                      isSelected 
                        ? "border-indigo-500 bg-indigo-500/10 text-white" 
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    } ${c4Checked && isCorrectOpt ? "border-emerald-500 bg-emerald-500/10 text-white" : ""} ${
                      c4Checked && isSelected && !isCorrectOpt ? "border-red-500 bg-red-500/10 text-white" : ""
                    }`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {c4Checked && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 animate-fade-in">
                <p className="font-extrabold text-white mb-1">
                  {c4Correct ? "✓ Correct!" : "✗ Incorrect."}
                </p>
                <p>Merging separate clauses using the suffix <span className="text-indigo-400 font-bold">-아서/어서</span> creates a cohesive B1 statement that demonstrates fluency.</p>
              </div>
            )}

            {!c4Checked && (
              <button
                disabled={!c4Answer}
                onClick={handleCheckC4}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
              >
                Check Answer
              </button>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 4 Phase 1 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 4 Phase 1 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(4)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(6)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Begin Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 6: Activity 1 – Core connectors cards & before/after sentence mergers */}
      {step === 6 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity 1 – Connector Cards & Merger Checks</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of {totalSteps}</span>
          </div>

          {/* Part A: Connector Cards */}
          <div className="space-y-2.5">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block text-left">Activity 1A: Tap to Flip Connector Cards</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {coreData?.connectors?.map((conn: any) => {
                const isFlipped = flippedCardId === conn.id;
                return (
                  <div 
                    key={conn.id}
                    onClick={() => setFlippedCardId(isFlipped ? null : conn.id)}
                    className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer text-center flex flex-col justify-center min-h-[100px] relative overflow-hidden ${
                      isFlipped 
                        ? "border-indigo-500 bg-indigo-500/10 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    }`}
                  >
                    {!isFlipped ? (
                      <div>
                        <span className="text-lg font-korean font-extrabold block text-white">{conn.korean_label}</span>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400">{conn.english_function}</span>
                      </div>
                    ) : (
                      <div className="space-y-1 animate-fade-in text-left">
                        <span className="text-[9px] text-zinc-500 uppercase block font-black">{conn.description}</span>
                        <p className="font-korean font-bold text-xs text-indigo-300">{conn.example_ko}</p>
                        <p className="text-[10px] text-zinc-400 leading-tight">{conn.example_en}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Part B: Before/After Merger Checks */}
          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Activity 1B: Before/After Merger Checks</span>
            
            {coreData?.connectors?.slice(0, 2).map((conn: any) => {
              const checkState = activeMergerCheck[conn.id] || { answer: null, checked: false, correct: null };
              return (
                <div key={conn.id} className="p-4 bg-zinc-950 rounded-xl border border-white/5 space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center justify-between">
                    <div>
                      <span className="text-[8px] text-zinc-500 font-mono block">Before (Separate Clauses)</span>
                      <p className="font-korean font-bold text-zinc-300 mt-1">{conn.example_ko.split(" → ")[0] || conn.example_ko}</p>
                    </div>
                    <div>
                      <span className="text-[8px] text-indigo-400 font-mono block">After (Connected B1)</span>
                      <p className="font-korean font-bold text-white mt-1">{conn.example_ko.split(" → ")[1] || conn.example_ko}</p>
                      <p className="text-[10px] text-zinc-500 italic mt-0.5">{conn.example_en}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-indigo-300">Which version sounds more connected?</p>
                    <div className="flex gap-2">
                      {["A", "B"].map(opt => {
                        const isSelected = checkState.answer === opt;
                        const isCorrectOpt = opt === "B";
                        return (
                          <button
                            key={opt}
                            disabled={checkState.checked}
                            onClick={() => handleCheckMerger(conn.id, opt, "B")}
                            className={`px-4 py-1.5 rounded-lg border text-xs font-bold transition-all duration-200 ${
                              isSelected 
                                ? "border-indigo-500 bg-indigo-500/10 text-white" 
                                : "border-white/5 bg-zinc-900 hover:border-white/10 text-zinc-300"
                            } ${checkState.checked && isCorrectOpt ? "border-emerald-500 bg-emerald-500/10 text-white" : ""} ${
                              checkState.checked && isSelected && !isCorrectOpt ? "border-red-500 bg-red-500/10 text-white" : ""
                            }`}
                          >
                            Option {opt}
                          </button>
                        );
                      })}
                    </div>
                    {checkState.checked && (
                      <p className="text-[9px] text-zinc-400 mt-1">
                        {checkState.correct ? "✓ Correct Choice! The merged sentence expresses the context much more naturally." : "✗ Incorrect. The connected sentence (Option B) is better structure."}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 4 Phase 1 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 4 Phase 1 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(5)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(7)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Continue to Activity 2A <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 7: Activity 2A – Select the correct connector (recognitionItems) */}
      {step === 7 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity 2A – Connector Selection</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of {totalSteps}</span>
          </div>

          {recognitionItems.length > 0 && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider block font-mono">Select the correct connector to merge these sentences:</span>
              </div>

              {/* Sentences block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto text-xs">
                <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl text-center">
                  <span className="text-[8px] text-zinc-500 block">Clause 1</span>
                  <p className="font-korean font-bold text-zinc-200 mt-1">{recognitionItems[recIdx]?.sentence1.split(" (")[0]}</p>
                  <p className="text-[10px] text-zinc-500">{recognitionItems[recIdx]?.sentence1.split(" (")[1]?.replace(")", "")}</p>
                </div>
                <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl text-center">
                  <span className="text-[8px] text-zinc-500 block">Clause 2</span>
                  <p className="font-korean font-bold text-zinc-200 mt-1">{recognitionItems[recIdx]?.sentence2.split(" (")[0]}</p>
                  <p className="text-[10px] text-zinc-500">{recognitionItems[recIdx]?.sentence2.split(" (")[1]?.replace(")", "")}</p>
                </div>
              </div>

              <p className="text-xs text-center font-bold text-indigo-300">{recognitionItems[recIdx]?.prompt || "Select the correct connector to merge these sentences."}</p>

              <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
                {recognitionItems[recIdx]?.options.map((opt: any) => {
                  const isSelected = selectedOptId === opt.id;
                  const isCorrect = opt.correct;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => !recChecked && setSelectedOptId(opt.id)}
                      disabled={recChecked}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition flex flex-col justify-center items-center ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      } ${recChecked && isCorrect ? "border-emerald-500 bg-emerald-500/10 text-white font-black" : ""} ${
                        recChecked && isSelected && !isCorrect ? "border-red-500 bg-red-500/10 text-white font-black" : ""
                      }`}
                    >
                      <span>{opt.text.split(" (")[0]}</span>
                      <span className="text-[9px] text-zinc-500 font-normal">{opt.text.split(" (")[1]?.replace(")", "")}</span>
                    </button>
                  );
                })}
              </div>

              {recChecked && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 max-w-md mx-auto text-left animate-fade-in">
                  <p className="font-extrabold text-white mb-1">{recCorrect ? "✓ Correct Choice!" : "✗ Incorrect Choice."}</p>
                  <p>{recognitionItems[recIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!recChecked ? (
                  <button
                    onClick={handleCheckRec}
                    disabled={!selectedOptId}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Option
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setRecChecked(false);
                      setSelectedOptId(null);
                      setRecCorrect(null);
                      if (recIdx < recognitionItems.length - 1) {
                        setRecIdx(recIdx + 1);
                      } else {
                        setRecIdx(0);
                      }
                    }}
                    className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next Item
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 4 Phase 1 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 4 Phase 1 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(6)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(8)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Continue to Activity 2B <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 8: Activity 2B – Relationship classifiers (reason vs contrast) */}
      {step === 8 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity 2B – Relationship Classifiers</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 8 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs text-zinc-400">What semantic relationship is expressed by the connector in this sentence?</p>
              
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl mt-2 max-w-md mx-auto text-center font-bold">
                <p className="font-korean text-base text-white">
                  {relIdx === 0 
                    ? "피곤해서 일찍 잘 거예요." 
                    : "공부하지만 아직 한국어가 어려워요."}
                </p>
                <p className="text-xs text-zinc-500 font-normal mt-1">
                  {relIdx === 0 
                    ? "Because I am tired, I will sleep early." 
                    : "I study, but Korean is still difficult."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
              {["Reason", "Result", "Contrast"].map((type) => {
                const isSelected = selectedRel === type;
                const correctType = relIdx === 0 ? "Reason" : "Contrast";
                const isCorrectOpt = type === correctType;
                return (
                  <button
                    key={type}
                    onClick={() => !relChecked && setSelectedRel(type)}
                    disabled={relChecked}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition-all duration-200 ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/10 text-white"
                        : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                    } ${relChecked && isCorrectOpt ? "border-emerald-500 bg-emerald-500/10 text-white font-black" : ""} ${
                      relChecked && isSelected && !isCorrectOpt ? "border-red-500 bg-red-500/10 text-white font-black" : ""
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            {relChecked && (
              <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 max-w-sm mx-auto text-left animate-fade-in">
                <p className="font-extrabold text-white mb-1">{relCorrect ? "✓ Correct Relationship!" : "✗ Incorrect Relationship."}</p>
                <p>
                  {relIdx === 0 
                    ? "-아서 shows a cause/reason for sleeping early." 
                    : "-지만 shows contrast between studying and Korean being difficult."}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-1">
              {!relChecked ? (
                <button
                  onClick={handleCheckRel}
                  disabled={!selectedRel}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Verify Relationship
                </button>
              ) : (
                <button
                  onClick={() => {
                    setRelChecked(false);
                    setSelectedRel(null);
                    setRelCorrect(null);
                    setRelIdx(relIdx === 0 ? 1 : 0);
                  }}
                  className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Next Item
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 4 Phase 1 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 4 Phase 1 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(7)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(9)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Continue to Activity 3 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 9: Activity 3 – Expansions & Speaking practice */}
      {step === 9 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Activity 3 – Clause Expansion & Speaking Practice</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 9 of {totalSteps}</span>
          </div>

          {/* Activity 3A: Sentence Expansion */}
          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider block">Part 3A: Expand Base Sentences</span>
              <p className="text-xs text-zinc-400">Expand the base sentence: <strong className="text-white">"{expansionTemplates?.base_clauses[0]?.ko || "한국어를 공부하다"}"</strong></p>
            </div>

            {/* Tabs */}
            <div className="bg-zinc-950 p-1 rounded-xl border border-white/5 flex">
              {(["but", "because", "so"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedTilePhrase(null);
                    setExpandedKo("");
                    setExpandedEn("");
                  }}
                  className={`w-full py-2 text-center text-xs font-bold capitalize rounded-lg transition ${
                    activeTab === tab 
                      ? "bg-indigo-600 text-white shadow" 
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {tab === "but" ? "But (-지만)" : tab === "because" ? "Because (-아서/어서)" : "So (-(으)니까)"}
                </button>
              ))}
            </div>

            {/* Phrase Tiles selection */}
            <div className="space-y-2 text-left">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Choose an expanding clause:</span>
              <div className="flex flex-wrap gap-2">
                {expansionTemplates?.base_clauses[0]?.suggestions[activeTab]?.map((s: any) => (
                  <button
                    key={s.ko}
                    onClick={() => handleExpandSentence(s.ko)}
                    className={`px-3 py-2 bg-zinc-950 hover:bg-zinc-900 border text-xs font-bold rounded-xl transition ${
                      selectedTilePhrase === s.ko 
                        ? "border-indigo-500 text-indigo-400" 
                        : "border-white/5 text-zinc-300"
                    }`}
                  >
                    {s.ko}
                  </button>
                ))}
              </div>
            </div>

            {/* Expanded Sentence preview */}
            {expandedKo && (
              <div className="p-4 bg-zinc-950 rounded-xl border border-indigo-500/20 text-center space-y-3 animate-fade-in">
                <div>
                  <span className="text-[9px] text-indigo-400 uppercase tracking-wider block font-black mb-1">Merged B1 Connected Sentence:</span>
                  <p className="font-korean text-lg text-white font-extrabold">{expandedKo}</p>
                  <p className="text-xs text-zinc-400 mt-1">{expandedEn}</p>
                </div>

                <div className="flex justify-center gap-2 pt-2">
                  <button onClick={() => playAudio(expandedKo)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                    <Volume2 className="w-4 h-4" />
                    <span>Listen</span>
                  </button>
                  <button onClick={handleSaveExpanded} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                    <Save className="w-4 h-4" />
                    <span>Save Example</span>
                  </button>
                </div>

                {/* Activity 3B: Speaking practice */}
                <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-white/5 space-y-2 mt-2">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-black text-left">Part 3B: Voice Practice (Pronunciation Feedback)</span>
                  <div className="flex justify-between items-center gap-3">
                    <button
                      onClick={handleStartRecording}
                      disabled={recording}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        recording ? "bg-red-500 text-white animate-pulse" : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                      <span>{recording ? "Recording..." : "Hold to Record"}</span>
                    </button>
                    
                    {speakingChecked && (
                      <div className="text-right space-y-0.5 text-xs">
                        <p className="font-bold text-white">Score: {speakingScore}%</p>
                        <p className="text-[10px] text-zinc-400 font-medium">{speakingFeedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity 3C: Personal Builder */}
          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
            <div className="text-center space-y-1">
              <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider block">Part 3C: Personal Clause Combination</span>
              <p className="text-xs text-zinc-400">Select a topic and construct a personal clause combination:</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {/* Topic Selector */}
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Select Topic</label>
                  <select 
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white"
                  >
                    {expansionTemplates?.topics?.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    )) || (
                      <>
                        <option value="topic_habits">Habits & Routine</option>
                        <option value="topic_study">Korean Study</option>
                        <option value="topic_exercise">Exercise</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Connector Selector */}
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Select Connector</label>
                  <select 
                    value={personalConnector}
                    onChange={(e) => setPersonalConnector(e.target.value)}
                    className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white font-korean font-bold"
                  >
                    <option value="-고">-고 (And)</option>
                    <option value="-지만">-지만 (But)</option>
                    <option value="-어서/어서">-아서/어서 (Because)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {/* Clause 1 inputs */}
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">First Clause (Korean)</label>
                  <input
                    type="text"
                    value={personalClause1}
                    onChange={(e) => setPersonalClause1(e.target.value)}
                    placeholder="e.g. 한국어를 공부하다"
                    className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white"
                  />
                </div>

                {/* Clause 2 inputs */}
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Second Clause (Korean)</label>
                  <input
                    type="text"
                    value={personalClause2}
                    onChange={(e) => setPersonalClause2(e.target.value)}
                    placeholder="e.g. 재미있다"
                    className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleBuildPersonal}
              disabled={!personalClause1.trim() || !personalClause2.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center"
            >
              Build Connector Sentence
            </button>

            {personalResult && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-center animate-fade-in">
                <span className="text-[8px] text-zinc-500 uppercase font-black block mb-0.5">Your Custom sentence:</span>
                <p className="font-korean font-bold text-white text-sm">{personalResult}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 4 Phase 1 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 4 Phase 1 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(8)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(10)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Continue to Mini-Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 10: Mini-Quiz: Connector Usage Check */}
      {step === 10 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-400" />
              <span>Mini-Quiz: Connector Usage Check</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Question {quizIdx + 1} of {quizBlueprint.length || 3}</span>
          </div>

          {quizBlueprint.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Question Prompt</span>
                <p className="font-extrabold text-white text-base mt-1 whitespace-pre-line">{quizBlueprint[quizIdx]?.question}</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {quizBlueprint[quizIdx]?.options.map((opt: string) => {
                  const isSelected = quizSelectedOpt === opt;
                  const isCorrect = opt === quizBlueprint[quizIdx]?.correct_answer;
                  return (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                      disabled={quizChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition-all duration-200 ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500/10 text-white"
                          : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                      } ${quizChecked && isCorrect ? "border-emerald-500 bg-emerald-500/10 text-white font-black" : ""} ${
                        quizChecked && isSelected && !isCorrect ? "border-red-500 bg-red-500/10 text-white font-black" : ""
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {quizChecked && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 text-left animate-fade-in">
                  <p className="font-extrabold text-white mb-1">{quizCorrect ? "✓ Answer Correct!" : "✗ Incorrect Answer."}</p>
                  <p>{quizBlueprint[quizIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end">
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={!quizSelectedOpt}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl text-xs cursor-pointer transition"
                  >
                    Verify Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold px-6 py-2 rounded-xl text-xs cursor-pointer transition flex items-center gap-1.5"
                  >
                    {finishingQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Complete Quiz"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Badge indicator when finished */}
          {quizChecked && quizIdx === quizBlueprint.length - 1 && quizCorrect && (
            <div className="mt-4 p-4 bg-zinc-900 border border-emerald-500/20 rounded-2xl max-w-sm mx-auto text-center space-y-1.5 animate-bounce">
              <Award className="w-8 h-8 text-yellow-500 mx-auto" />
              <p className="font-bold text-white text-sm">Badge Earned: Connector Starter</p>
              <p className="text-[10px] text-zinc-400">150 XP rewarded for successfully demonstrating connector strategy!</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 4 Phase 1 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 4 Phase 1 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(9)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <div className="h-4" />
          </div>
        </div>
      )}

      {/* Screen 11: Tutor session & Homework Practice */}
      {step === 11 && (
        <div className="glass-panel border border-indigo-500/20 p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/25 w-fit mx-auto text-emerald-400 shrink-0">
            <Award className="w-8 h-8 animate-bounce shrink-0" />
          </div>

          <h2 className="text-5xl font-black text-white tracking-tight">Course 4 Started!</h2>
          <p className="text-xs text-zinc-400 font-mono">Badge Earned: Connector Starter (150 XP rewarded)</p>

          <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">B1 Connector Homework Checklist:</span>
            <div className="space-y-2.5">
              {homeworkItems.map((item) => {
                const isChecked = !!completedHomework[item.id];
                return (
                  <label key={item.id} className="flex items-start gap-3 cursor-pointer group text-xs text-zinc-300 select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleHomework(item.id, isChecked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/10 bg-zinc-950 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className={`group-hover:text-white transition ${isChecked ? "line-through text-zinc-500" : ""}`}>{item.text}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* AI practice launcher */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <div className="space-y-0.5">
              <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider block font-mono">AI Conversation Practice:</span>
              <p className="text-[11px] text-zinc-400 leading-normal">Practice explaining your reasons, likes, and plans directly to your AI tutor using the new connector patterns.</p>
            </div>

            {tutorSession ? (
              <div className="p-4 bg-zinc-900 border border-indigo-500/20 rounded-xl space-y-2 text-xs animate-fade-in">
                <p className="font-extrabold text-white">Stateful Session Active!</p>
                <p className="font-korean text-zinc-200">Gwan-Sik: "{tutorSession.opener}"</p>
                <button
                  onClick={() => window.location.href = `/tutor?session_id=${tutorSession.session_id}`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded-lg text-[10px] cursor-pointer transition flex items-center gap-1"
                >
                  <span>Enter B1 Practice Room</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLaunchB1Tutor}
                disabled={loadingTutor}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition flex items-center justify-center gap-2"
              >
                {loadingTutor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                <span>Explain your reasons to your AI tutor</span>
              </button>
            )}
          </div>

          <div className="pt-2 flex justify-between items-center max-w-md mx-auto w-full">
            <button onClick={() => setStep(10)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button 
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 150, type: "correct" } }));
                }onComplete();
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3.5 px-8 rounded-xl transition text-sm shadow-lg shadow-emerald-500/15 cursor-pointer"
            >
              Finish B1 Phase 1
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
