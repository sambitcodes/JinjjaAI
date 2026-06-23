"use client";

import { useEffect, useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  BookOpen, 
  Award, 
  Loader2, 
  CheckCircle2, 
  Check, 
  RotateCcw
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
  const cleanPath = (path.startsWith("/phases/") || path.startsWith("/phase-5/")) ? `/grammar-lab${path}` : path;
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

interface Course7Phase5ConnectorsWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course7Phase5ConnectorsWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course7Phase5ConnectorsWizardProps) {
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c7p5_step");
    const savedMax = localStorage.getItem("hangeulai_c7p5_max_step");
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
      localStorage.setItem("hangeulai_c7p5_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);

  // Data states
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1A: Relation Type
  const [relationItems, setRelationItems] = useState<any[]>([]);
  const [relationIdx, setRelationIdx] = useState(0);
  const [relationSelected, setRelationSelected] = useState<string | null>(null);
  const [relationChecked, setRelationChecked] = useState(false);
  const [relationCorrect, setRelationCorrect] = useState<boolean | null>(null);
  const [relationExplanation, setRelationExplanation] = useState("");

  // Activity 1B: Connector Choice
  const [choiceItems, setChoiceItems] = useState<any[]>([]);
  const [choiceIdx, setChoiceIdx] = useState(0);
  const [choiceSelected, setChoiceSelected] = useState<string | null>(null);
  const [choiceChecked, setChoiceChecked] = useState(false);
  const [choiceCorrect, setChoiceCorrect] = useState<boolean | null>(null);
  const [choiceExplanation, setChoiceExplanation] = useState("");

  // Activity 1C: Highlight Connectors in mini text
  const [highlightItems, setHighlightItems] = useState<any[]>([]);
  const [hlSelectedWord, setHlSelectedWord] = useState<string | null>(null);
  const [hlSelectedRelation, setHlSelectedRelation] = useState<string>("");
  const [hlChecked, setHlChecked] = useState(false);
  const [hlCorrect, setHlCorrect] = useState<boolean | null>(null);
  const [hlExplanation, setHlExplanation] = useState("");

  // Activity 2A: Join Sentences
  const [joinItems, setJoinItems] = useState<any[]>([]);
  const [joinIdx, setJoinIdx] = useState(0);
  const [joinInput, setJoinInput] = useState("");
  const [joinChecked, setJoinChecked] = useState(false);
  const [joinCorrect, setJoinCorrect] = useState<boolean | null>(null);
  const [joinExplanation, setJoinExplanation] = useState("");

  // Activity 2B: Reason Result Expansion
  const [rrItems, setRrItems] = useState<any[]>([]);
  const [rrIdx, setRrIdx] = useState(0);
  const [rrInput, setRrInput] = useState("");
  const [rrChecked, setRrChecked] = useState(false);
  const [rrCorrect, setRrCorrect] = useState<boolean | null>(null);
  const [rrExplanation, setRrExplanation] = useState("");

  // Activity 2C: When / If conditional builder
  const [wiItems, setWiItems] = useState<any[]>([]);
  const [wiIdx, setWiIdx] = useState(0);
  const [wiInput, setWiInput] = useState("");
  const [wiChecked, setWiChecked] = useState(false);
  const [wiCorrect, setWiCorrect] = useState<boolean | null>(null);
  const [wiExplanation, setWiExplanation] = useState("");

  // Sandbox State (Screen 2)
  const [sandboxVerb1, setSandboxVerb1] = useState("먹다");
  const [sandboxConnector, setSandboxConnector] = useState("-고");
  const [sandboxVerb2, setSandboxVerb2] = useState("자다");

  // Quiz State
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizExplanation, setQuizExplanation] = useState("");
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Homework State
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [hwSents, setHwSents] = useState<string[]>(["", "", ""]);
  const [hwFeedback, setHwFeedback] = useState<any[]>([]);
  const [submittingHw, setSubmittingHw] = useState(false);
  const [completingLab, setCompletingLab] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/5/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/5/core-data");
          setCoreData(res);
        } else if (step === 3) {
          if (relationItems.length === 0) {
            const resR = await apiJson("/phase-5/items/relation-type");
            setRelationItems(resR);
          }
          if (choiceItems.length === 0) {
            const resC = await apiJson("/phase-5/items/connector-choice");
            setChoiceItems(resC);
          }
          if (highlightItems.length === 0) {
            const resH = await apiJson("/phase-5/items/connector-highlight");
            setHighlightItems(resH);
          }
        } else if (step === 4) {
          if (joinItems.length === 0) {
            const resJ = await apiJson("/phase-5/items/join");
            setJoinItems(resJ);
          }
          if (rrItems.length === 0) {
            const resRr = await apiJson("/phase-5/items/reason-result");
            setRrItems(resRr);
          }
          if (wiItems.length === 0) {
            const resWi = await apiJson("/phase-5/items/when-if");
            setWiItems(resWi);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/phase-5/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-5/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading Grammar Lab Phase 5:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Sandbox Clause Builder Helper
  const getSandboxCombinedText = () => {
    // Basic root stem conjugation parser
    let v1Stem = sandboxVerb1.slice(0, -1); // remove 다
    let combined = "";
    let grammarRule = "";

    if (sandboxConnector === "-고") {
      combined = `${v1Stem}고 ${sandboxVerb2.slice(0, -1)}어요.`;
      grammarRule = "Attach -고 directly to the verb stem of Verb 1 to express addition ('and').";
    } else if (sandboxConnector === "-지만") {
      combined = `${v1Stem}지만 ${sandboxVerb2.slice(0, -1)}어요.`;
      grammarRule = "Attach -지만 directly to the verb stem of Verb 1 to express contrast ('but').";
    } else if (sandboxConnector === "-어서/아서") {
      // Very basic rule: if stem contains ㅏ or ㅗ, attach 아서, else 어서
      const lastChar = v1Stem.slice(-1);
      const isAorO = /[아오야와]/.test(lastChar);
      if (sandboxVerb1 === "하다") {
        combined = `해서 ${sandboxVerb2.slice(0, -1)}어요.`;
      } else {
        combined = `${v1Stem}${isAorO ? "아서" : "어서"} ${sandboxVerb2.slice(0, -1)}어요.`;
      }
      grammarRule = "Attach -아서/어서 depending on Verb 1 stem vowels to express cause/effect ('so / because').";
    } else if (sandboxConnector === "-(으)면") {
      // If stem ends in consonant, attach 으면, else 면
      // Very simple batchim check: check if last character has a batchim (approximated)
      const hasBatchim = sandboxVerb1 === "먹다" || sandboxVerb1 === "듣다";
      combined = `${v1Stem}${hasBatchim ? "으면" : "면"} ${sandboxVerb2.slice(0, -1)}어요.`;
      grammarRule = "Attach -(으)면 to Verb 1 stem to express a conditional condition ('if / when').";
    } else if (sandboxConnector === "-(으)ㄹ 때") {
      const hasBatchim = sandboxVerb1 === "먹다" || sandboxVerb1 === "듣다";
      combined = `${v1Stem}${hasBatchim ? "을 때" : "ㄹ 때"} ${sandboxVerb2.slice(0, -1)}어요.`;
      grammarRule = "Attach -(으)ㄹ 때 to Verb 1 stem to express temporal action ('when / during').";
    }

    return {
      combined,
      grammarRule
    };
  };

  // Activity 1A check
  const handleCheckRelation = async () => {
    const current = relationItems[relationIdx];
    if (!current || !relationSelected) return;
    try {
      const res = await apiJson("/phase-5/items/relation-type/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: relationSelected })
      });
      setRelationCorrect(res.correct);
      setRelationChecked(true);
      setRelationExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextRelation = () => {
    setRelationSelected(null);
    setRelationChecked(false);
    setRelationCorrect(null);
    setRelationExplanation("");
    if (relationIdx < relationItems.length - 1) {
      setRelationIdx(prev => prev + 1);
    }
  };

  // Activity 1B check
  const handleCheckChoice = async () => {
    const current = choiceItems[choiceIdx];
    if (!current || !choiceSelected) return;
    try {
      const res = await apiJson("/phase-5/items/connector-choice/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: choiceSelected })
      });
      setChoiceCorrect(res.correct);
      setChoiceChecked(true);
      setChoiceExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextChoice = () => {
    setChoiceSelected(null);
    setChoiceChecked(false);
    setChoiceCorrect(null);
    setChoiceExplanation("");
    if (choiceIdx < choiceItems.length - 1) {
      setChoiceIdx(prev => prev + 1);
    }
  };

  // Activity 1C check
  const handleCheckHighlight = async () => {
    const current = highlightItems[0];
    if (!current || !hlSelectedWord || !hlSelectedRelation) return;
    try {
      const res = await apiJson("/phase-5/items/connector-highlight/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_text: hlSelectedWord, relation: hlSelectedRelation })
      });
      setHlCorrect(res.correct);
      setHlChecked(true);
      setHlExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 2A check
  const handleCheckJoin = async () => {
    const current = joinItems[joinIdx];
    if (!current || !joinInput) return;
    try {
      const res = await apiJson("/phase-5/items/join/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, user_input: joinInput })
      });
      setJoinCorrect(res.correct);
      setJoinChecked(true);
      setJoinExplanation(res.explanation);
      if (res.correct) {
        playAudio(res.correct_sentence);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextJoin = () => {
    setJoinInput("");
    setJoinChecked(false);
    setJoinCorrect(null);
    setJoinExplanation("");
    if (joinIdx < joinItems.length - 1) {
      setJoinIdx(prev => prev + 1);
    }
  };

  // Activity 2B check
  const handleCheckRr = async () => {
    const current = rrItems[rrIdx];
    if (!current || !rrInput) return;
    try {
      const res = await apiJson("/phase-5/items/reason-result/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, user_input: rrInput })
      });
      setRrCorrect(res.correct);
      setRrChecked(true);
      setRrExplanation(res.explanation);
      if (res.correct) {
        playAudio(res.correct_sentence);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextRr = () => {
    setRrInput("");
    setRrChecked(false);
    setRrCorrect(null);
    setRrExplanation("");
    if (rrIdx < rrItems.length - 1) {
      setRrIdx(prev => prev + 1);
    }
  };

  // Activity 2C check
  const handleCheckWi = async () => {
    const current = wiItems[wiIdx];
    if (!current || !wiInput) return;
    try {
      const res = await apiJson("/phase-5/items/when-if/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, user_input: wiInput })
      });
      setWiCorrect(res.correct);
      setWiChecked(true);
      setWiExplanation(res.explanation);
      if (res.correct) {
        playAudio(res.correct_sentence);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextWi = () => {
    setWiInput("");
    setWiChecked(false);
    setWiCorrect(null);
    setWiExplanation("");
    if (wiIdx < wiItems.length - 1) {
      setWiIdx(prev => prev + 1);
    }
  };

  // Quiz flow
  const handleCheckQuizAnswer = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelected) return;
    try {
      const res = await apiJson("/phase-5/quiz/answer", {
        method: "POST",
        body: JSON.stringify({ question_id: current.id, selected_option: quizSelected })
      });
      setQuizCorrect(res.correct);
      setQuizChecked(true);
      setQuizExplanation(res.explanation);
      if (!res.correct) {
        setQuizMistakes(prev => [...prev, current.id]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextQuiz = async () => {
    setQuizSelected(null);
    setQuizChecked(false);
    setQuizCorrect(null);
    setQuizExplanation("");
    if (quizIdx < quizBlueprint.length - 1) {
      setQuizIdx(prev => prev + 1);
    } else {
      setFinishingQuiz(true);
      try {
        const correctCount = quizBlueprint.length - quizMistakes.length;
        const finalScore = Math.round((correctCount / quizBlueprint.length) * 100);
        await apiJson("/phase-5/quiz/finish", {
          method: "POST",
          body: JSON.stringify({ score: finalScore, mistakes: quizMistakes })
        });
        setQuizScore(finalScore);
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  const handleRestartQuiz = () => {
    setQuizIdx(0);
    setQuizSelected(null);
    setQuizChecked(false);
    setQuizCorrect(null);
    setQuizExplanation("");
    setQuizMistakes([]);
    setQuizScore(null);
  };

  // Homework check
  const handleHwChange = (index: number, val: string) => {
    const updated = [...hwSents];
    updated[index] = val;
    setHwSents(updated);
  };

  const handleSubmitHomework = async () => {
    setSubmittingHw(true);
    try {
      const res = await apiJson("/phase-5/homework/submit", {
        method: "POST",
        body: JSON.stringify({ sentences: hwSents })
      });
      setHwFeedback(res.feedback || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingHw(false);
    }
  };

  const handleCompleteLab = async () => {
    setCompletingLab(true);
    try {
      const res = await apiJson("/phase-5/complete", { method: "POST" });
      setCompletionData(res);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingLab(false);
    }
  };

  const sandboxRes = getSandboxCombinedText();

    const outlineSteps = [
    { num: 1, label: "Screen 1 – Welcome / Phase Overview" },
    { num: 2, label: "Screen 2 – Clause Connectors Explanations & Sandbox" },
    { num: 3, label: "Screen 3 – Activity 1: Connector Recognition" },
    { num: 4, label: "Screen 4 – Activity 2: Sentence Production" },
    { num: 5, label: "Screen 5 – Mini-Quiz: Sentence Linking Mastery" },
    { num: 6, label: "Screen 6 – Homework & AI Verification" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 7,
          phaseNum: 5,
          step: step
        }
      }));
    }
  }, [step]);

return (
    <div className="flex-grow flex flex-col justify-between">
      {/* Top Header */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{metadata?.title || "Grammar Lab 5"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Connectors & Sentence Linking</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center space-x-4">
          <div className="w-40 h-3 bg-zinc-900/80 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 rounded-full transition-all duration-500" 
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 font-bold">{Math.round((step / 6) * 100)}%</span>
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

      {/* SCREEN 1: WELCOME */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in relative overflow-hidden">
          <div className="absolute -top-1/4 -right-1/4 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="p-3 bg-indigo-500/10 rounded-full border border-indigo-500/25 w-fit mx-auto text-indigo-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <h2 className="text-5xl font-black text-white tracking-tight font-sans">{metadata?.title}</h2>
            <h3 className="text-md font-bold text-indigo-400 mt-1">{metadata?.subtitle}</h3>
          </div>

          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || []).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Est. Lab Time:</strong> {metadata?.estimated_minutes || "20"} minutes</p>
            <p><strong>🔗 Recommended Parallel Units:</strong> {metadata?.parallel_units}</p>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => {
    if (courseXP < 320) {
      alert("To start Phase 5, you need at least 320 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!");
      return;
    }
    setStep(2);
  }}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              <span>Start Connectors Lab</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
          </div>

          
        </div>
      )}

      {/* SCREEN 2: CONCEPT EXPLANATION */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>Conjunctions & Connective Endings</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of 6</span>
          </div>

            {coreData ? (
              <div className="space-y-6">
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
                  <h3 className="text-sm font-bold text-zinc-200 mb-2">Why Connectors Matter</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Instead of speaking in disconnected simple sentences, Korean uses connective endings attached to verb stems to express logical relationships like addition, contrast, reason, conditions, and sequence.
                  </p>
                </div>

                {/* Connector mapping list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coreData.connectors?.map((conn: any, idx: number) => (
                    <div key={idx} className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-indigo-300 block mb-1">{conn.relation} ({conn.english})</span>
                        <p className="text-[11px] text-zinc-400 leading-normal">{conn.usage}</p>
                      </div>
                      <span className="text-lg font-black text-indigo-400 bg-indigo-500/10/40 border border-indigo-500/25/40 px-2 py-0.5 rounded ml-2">
                        {conn.korean}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Clause Connector sandbox */}
                <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-5 rounded-2xl border border-white/5">
                  <h3 className="text-sm font-bold text-zinc-200 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Interactive Connector Sandbox</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mb-4">
                    Select a first verb, a connector pattern, and a second verb to visualize the resulting linked sentence structure!
                  </p>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase mb-1">Verb 1 (Action/State)</label>
                      <select 
                        value={sandboxVerb1}
                        onChange={(e) => setSandboxVerb1(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 text-xs text-zinc-200 rounded p-1.5 focus:outline-none"
                      >
                        <option value="먹다">먹다 (to eat)</option>
                        <option value="가다">가다 (to go)</option>
                        <option value="피곤하다">피곤하다 (to be tired)</option>
                        <option value="춥다">춥다 (to be cold)</option>
                        <option value="공부하다">공부하다 (to study)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase mb-1">Connector / Relation</label>
                      <select 
                        value={sandboxConnector}
                        onChange={(e) => setSandboxConnector(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 text-xs text-zinc-200 rounded p-1.5 focus:outline-none"
                      >
                        <option value="-고">-고 (And)</option>
                        <option value="-지만">-지만 (But)</option>
                        <option value="-어서/아서">-어서/아서 (So / Because)</option>
                        <option value="-(으)면">-(으)면 (If)</option>
                        <option value="-(으)ㄹ 때">-(으)ㄹ 때 (When)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase mb-1">Verb 2 (Ending Clause)</label>
                      <select 
                        value={sandboxVerb2}
                        onChange={(e) => setSandboxVerb2(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 text-xs text-zinc-200 rounded p-1.5 focus:outline-none"
                      >
                        <option value="자다">자다 (to sleep)</option>
                        <option value="마시다">마시다 (to drink)</option>
                        <option value="공부하다">공부하다 (to study)</option>
                        <option value="쉬다">쉬다 (to rest)</option>
                        <option value="가다">가다 (to go)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-lg border border-white/5 space-y-2">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Generated Linked Clause:</span>
                    <div className="text-base font-black text-indigo-400 flex items-center gap-2">
                      <span className="hover:underline cursor-pointer" onClick={() => playAudio(sandboxRes.combined)}>
                        {sandboxRes.combined}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 italic mt-1">{sandboxRes.grammarRule}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
            )}

            <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
              <button 
                onClick={() => setStep(1)}
                className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                Proceed to Drills
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3: RECOGNITION DRILLS */}
        {step === 3 && (
          <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
            <div>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded-full font-bold">
                Activity 1: Connector Recognition
              </span>
              <h2 className="text-xl font-bold mt-2 text-white">Relationship Classification & Gap Fill</h2>
              <p className="text-xs text-zinc-400">Identify clause relationships and choose appropriate connector formats.</p>
            </div>

            {/* A: Relationship classification */}
            {relationItems.length > 0 && (
              <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Part A: What is the relationship?</span>
                  <span>Item {relationIdx + 1} of {relationItems.length}</span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-zinc-500 uppercase font-semibold">Sentence 1:</div>
                  <div className="text-base font-bold text-zinc-200">{relationItems[relationIdx]?.sentence_1}</div>
                  <div className="text-xs text-zinc-500 uppercase font-semibold mt-2">Sentence 2:</div>
                  <div className="text-base font-bold text-zinc-200">{relationItems[relationIdx]?.sentence_2}</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                  {relationItems[relationIdx]?.options?.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !relationChecked && setRelationSelected(opt)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                        relationSelected === opt 
                          ? "border-indigo-500 bg-indigo-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-300 hover:bg-slate-800"
                      } ${relationChecked && opt === relationItems[relationIdx].correct ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                      disabled={relationChecked}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {relationChecked && (
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${relationCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                    <strong>{relationCorrect ? "Correct!" : "Incorrect."}</strong> {relationExplanation}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  {!relationChecked ? (
                    <button
                      onClick={handleCheckRelation}
                      className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-zinc-200 transition"
                      disabled={!relationSelected}
                    >
                      Check Answer
                    </button>
                  ) : (
                    relationIdx < relationItems.length - 1 && (
                      <button
                        onClick={handleNextRelation}
                        className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg text-white transition"
                      >
                        Next Item
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* B: Gap-fill connector choices */}
            {choiceItems.length > 0 && (
              <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Part B: Choose the best connector suffix</span>
                  <span>Item {choiceIdx + 1} of {choiceItems.length}</span>
                </div>

                <div>
                  <div className="text-xs text-slate-450 italic mb-2">{choiceItems[choiceIdx]?.english_context}</div>
                  <div className="text-lg font-black text-zinc-200 tracking-wide">{choiceItems[choiceIdx]?.sentence_with_blank}</div>
                </div>

                <div className="flex gap-3 pt-2">
                  {choiceItems[choiceIdx]?.options?.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !choiceChecked && setChoiceSelected(opt)}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border transition ${
                        choiceSelected === opt 
                          ? "border-indigo-500 bg-indigo-500/15 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-300 hover:bg-slate-800"
                      } ${choiceChecked && opt === choiceItems[choiceIdx].correct ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                      disabled={choiceChecked}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {choiceChecked && (
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${choiceCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                    <strong>{choiceCorrect ? "Correct!" : "Incorrect."}</strong> {choiceExplanation}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  {!choiceChecked ? (
                    <button
                      onClick={handleCheckChoice}
                      className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-zinc-200 transition"
                      disabled={!choiceSelected}
                    >
                      Check Answer
                    </button>
                  ) : (
                    choiceIdx < choiceItems.length - 1 && (
                      <button
                        onClick={handleNextChoice}
                        className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg text-white transition"
                      >
                        Next Item
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* C: Connector Highlight mini text */}
            {highlightItems.length > 0 && (
              <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Part C: Interactive text analysis</span>
                  <span>Highlight & Identify relation type</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-black">Interactive Reading Text (Click target connectors):</span>
                  <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 flex flex-wrap gap-2 text-base font-medium">
                    {highlightItems[0].text.split(" ").map((word: string, wIdx: number) => {
                      const cleanWord = word.replace(/[.,]/g, "");
                      const isTarget = ["와서", "갔지만", "있었고"].includes(cleanWord);
                      return (
                        <span 
                          key={wIdx}
                          onClick={() => {
                            if (!hlChecked && isTarget) {
                              setHlSelectedWord(cleanWord);
                              setHlChecked(false);
                              setHlCorrect(null);
                              setHlExplanation("");
                            }
                          }}
                          className={`px-1 py-0.5 rounded cursor-pointer transition ${
                            isTarget 
                              ? hlSelectedWord === cleanWord 
                                ? "bg-indigo-600/30 text-indigo-400 border border-indigo-500"
                                : "underline decoration-dotted decoration-indigo-400 text-indigo-300 hover:bg-slate-800"
                              : "text-slate-350"
                          }`}
                        >
                          {word}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-zinc-500 italic mt-1">Translation: {highlightItems[0].translation}</p>
                </div>

                {hlSelectedWord && (
                  <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 space-y-3">
                    <span className="text-xs text-zinc-300 font-bold">Identify relation type for connector '{hlSelectedWord}':</span>
                    <div className="flex gap-2">
                      {["Reason", "Contrast", "Addition"].map((rel) => (
                        <button
                          key={rel}
                          onClick={() => !hlChecked && setHlSelectedRelation(rel)}
                          className={`py-1.5 px-3 rounded text-xs font-semibold transition ${
                            hlSelectedRelation === rel 
                              ? "bg-indigo-600 text-white" 
                              : "bg-zinc-950 text-zinc-300 border border-white/5 hover:bg-slate-800"
                          }`}
                          disabled={hlChecked}
                        >
                          {rel}
                        </button>
                      ))}
                    </div>

                    {hlChecked && (
                      <div className={`p-3 rounded border text-xs ${hlCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                        {hlExplanation}
                      </div>
                    )}

                    <div className="flex justify-end">
                      {!hlChecked && (
                        <button
                          onClick={handleCheckHighlight}
                          className="py-1.5 px-4 bg-indigo-500 hover:bg-indigo-600 text-xs font-bold rounded text-white transition"
                          disabled={!hlSelectedRelation}
                        >
                          Verify Suffix Relation
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
              <button 
                onClick={() => {
    if (courseXP < 320) {
      alert("To start Phase 5, you need at least 320 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!");
      return;
    }
    setStep(2);
  }}
                className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button 
                onClick={() => setStep(4)}
                className="flex items-center gap-1 py-2.5 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Proceed to Production
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4: PRODUCTION DRILLS */}
        {step === 4 && (
          <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
            <div>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded-full font-bold">
                Activity 2: Sentence Production & Linking
              </span>
              <h2 className="text-xl font-bold mt-2 text-white">Join and expand clauses into complex sentences</h2>
              <p className="text-xs text-zinc-400">Write linked sentences matching temporal, causal, and contrastive constraints.</p>
            </div>

            {/* A: Join sentences */}
            {joinItems.length > 0 && (
              <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Part A: Combine Clause A & Clause B</span>
                  <span>Item {joinIdx + 1} of {joinItems.length}</span>
                </div>

                <div className="space-y-3">
                  <div className="text-xs text-zinc-500 uppercase font-black">English Context: '{joinItems[joinIdx]?.english}'</div>
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold bg-zinc-900 p-3 rounded-lg border border-white/5">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Clause A</span>
                      <span className="text-slate-205 font-bold text-sm">{joinItems[joinIdx]?.sentence_1}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Clause B</span>
                      <span className="text-slate-205 font-bold text-sm">{joinItems[joinIdx]?.sentence_2}</span>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-400">Relationship constraint: <span className="font-bold text-indigo-400">{joinItems[joinIdx]?.relation}</span></div>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value)}
                    placeholder="Type combined Korean sentence..."
                    className="w-full bg-zinc-900 border border-white/5 p-3.5 rounded-xl text-white placeholder-slate-500 outline-none focus:border-indigo-500 text-sm font-medium"
                    disabled={joinChecked}
                  />

                  {joinChecked && (
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed ${joinCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                      <strong>{joinCorrect ? "Correct!" : "Incorrect."}</strong> {joinExplanation}
                      <div className="mt-1 font-mono text-zinc-300">Model Answer: <span className="underline decoration-indigo-400">{joinItems[joinIdx]?.correct_patterns[0]}</span></div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  {!joinChecked ? (
                    <button
                      onClick={handleCheckJoin}
                      className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-zinc-200 transition"
                      disabled={!joinInput.trim()}
                    >
                      Check Combination
                    </button>
                  ) : (
                    joinIdx < joinItems.length - 1 && (
                      <button
                        onClick={handleNextJoin}
                        className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg text-white transition"
                      >
                        Next Item
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* B: Reason/Result expansion */}
            {rrItems.length > 0 && (
              <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Part B: Expand base sentence with causal clause</span>
                  <span>Item {rrIdx + 1} of {rrItems.length}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-black">Base Sentence:</span>
                  <div className="text-base font-extrabold text-zinc-200">{rrItems[rrIdx]?.base_sentence}</div>
                  <div className="text-xs text-slate-450 italic">{rrItems[rrIdx]?.prompt}</div>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={rrInput}
                    onChange={(e) => setRrInput(e.target.value)}
                    placeholder="Type expanded sentence here..."
                    className="w-full bg-zinc-900 border border-white/5 p-3.5 rounded-xl text-white placeholder-slate-500 outline-none focus:border-indigo-500 text-sm font-medium"
                    disabled={rrChecked}
                  />

                  {rrChecked && (
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed ${rrCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                      <strong>{rrCorrect ? "Correct!" : "Incorrect."}</strong> {rrExplanation}
                      <div className="mt-1 font-mono text-zinc-300">Model Answer: <span className="underline decoration-indigo-400">{rrItems[rrIdx]?.correct_patterns[0]}</span></div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  {!rrChecked ? (
                    <button
                      onClick={handleCheckRr}
                      className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-zinc-200 transition"
                      disabled={!rrInput.trim()}
                    >
                      Verify Clause Extension
                    </button>
                  ) : (
                    rrIdx < rrItems.length - 1 && (
                      <button
                        onClick={handleNextRr}
                        className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg text-white transition"
                      >
                        Next Item
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* C: When/If conditional builder */}
            {wiItems.length > 0 && (
              <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Part C: Temporal & Conditional clauses</span>
                  <span>Item {wiIdx + 1} of {wiItems.length}</span>
                </div>

                <div className="space-y-3">
                  <div className="text-xs text-zinc-500 uppercase font-black">English constraint: '{wiItems[wiIdx]?.english}'</div>
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold bg-zinc-900 p-3 rounded-lg border border-white/5">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Condition / Time Root</span>
                      <span className="text-slate-205 font-bold text-sm">{wiItems[wiIdx]?.sentence_1}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Result Root</span>
                      <span className="text-slate-205 font-bold text-sm">{wiItems[wiIdx]?.sentence_2}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={wiInput}
                    onChange={(e) => setWiInput(e.target.value)}
                    placeholder="Type conditional/when sentence..."
                    className="w-full bg-zinc-900 border border-white/5 p-3.5 rounded-xl text-white placeholder-slate-500 outline-none focus:border-indigo-500 text-sm font-medium"
                    disabled={wiChecked}
                  />

                  {wiChecked && (
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed ${wiCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                      <strong>{wiCorrect ? "Correct!" : "Incorrect."}</strong> {wiExplanation}
                      <div className="mt-1 font-mono text-zinc-300">Model Answer: <span className="underline decoration-indigo-400">{wiItems[wiIdx]?.correct_patterns[0]}</span></div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  {!wiChecked ? (
                    <button
                      onClick={handleCheckWi}
                      className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-zinc-200 transition"
                      disabled={!wiInput.trim()}
                    >
                      Check Conditional
                    </button>
                  ) : (
                    wiIdx < wiItems.length - 1 && (
                      <button
                        onClick={handleNextWi}
                        className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg text-white transition"
                      >
                        Next Item
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
              <button 
                onClick={() => setStep(3)}
                className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button 
                onClick={() => setStep(5)}
                className="flex items-center gap-1 py-2.5 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Proceed to Quiz
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 5: MINI-QUIZ */}
        {step === 5 && (
          <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-indigo-400 flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" />
              Sentence Linking Proficiency Quiz
            </h2>

            {quizBlueprint.length > 0 && quizScore === null && (
              <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Question {quizIdx + 1} of {quizBlueprint.length}</span>
                  <span>Mistakes: {quizMistakes.length}</span>
                </div>

                <div className="text-base font-extrabold text-zinc-200">
                  {quizBlueprint[quizIdx]?.question}
                </div>

                <div className="space-y-2 pt-2">
                  {quizBlueprint[quizIdx]?.options?.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelected(opt)}
                      className={`w-full text-left p-3.5 rounded-xl text-xs font-semibold border transition flex justify-between items-center ${
                        quizSelected === opt 
                          ? "border-indigo-500 bg-indigo-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-slate-350 hover:bg-slate-800"
                      } ${quizChecked && opt === quizBlueprint[quizIdx].correct_answer ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                      disabled={quizChecked}
                    >
                      <span>{opt}</span>
                      {quizSelected === opt && quizChecked && (
                        <Check className={`w-4 h-4 ${quizCorrect ? "text-green-500" : "text-red-500"}`} />
                      )}
                    </button>
                  ))}
                </div>

                {quizChecked && (
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${quizCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                    <strong>{quizCorrect ? "Correct!" : "Incorrect."}</strong> {quizExplanation}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  {!quizChecked ? (
                    <button
                      onClick={handleCheckQuizAnswer}
                      className="py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-xs font-bold rounded-lg text-white transition"
                      disabled={!quizSelected}
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuiz}
                      className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg text-white transition flex items-center gap-1"
                      disabled={finishingQuiz}
                    >
                      {finishingQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {quizScore !== null && (
              <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-center space-y-4">
                <Award className="w-16 h-16 text-yellow-500 mx-auto animate-bounce" />
                <h3 className="text-2xl font-black text-white">Quiz Completed!</h3>
                <p className="text-sm text-zinc-400">
                  You scored a <span className="font-extrabold text-yellow-400">{quizScore}%</span> on Sentence Linking proficiency.
                </p>

                <div className="flex justify-center gap-3">
                  <button 
                    onClick={handleRestartQuiz}
                    className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-zinc-200 transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Retry Quiz
                  </button>
                  <button 
                    onClick={() => setStep(6)}
                    className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-xl text-white transition"
                  >
                    Go to Homework
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
              <button 
                onClick={() => setStep(4)}
                className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
                disabled={quizScore === null}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <div />
            </div>
          </div>
        )}

        {/* SCREEN 6: HOMEWORK & INTEGRATION */}
        {step === 6 && (
          <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
            <div>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                Screen 6: Homework & Lab Summary
              </span>
              <h2 className="text-xl font-bold mt-2 text-white">AI-Assisted Connector Verification Workspace</h2>
              <p className="text-xs text-zinc-400">Test your original linked Korean sentences using target connectors.</p>
            </div>

            {homeworkItems.length > 0 && (
              <div className="space-y-4">
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Homework Prompts:</h4>
                  <ul className="space-y-2 text-xs text-slate-350">
                    {homeworkItems.map((hw: any) => (
                      <li key={hw.id} className="flex gap-2">
                        <span className="text-indigo-400">•</span>
                        <span>{hw.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-zinc-400">Write 3 connected sentences using different connectors:</span>
                  {hwSents.map((sent, sIdx) => (
                    <div key={sIdx} className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase font-semibold">Sentence {sIdx + 1}:</label>
                      <input
                        type="text"
                        value={sent}
                        onChange={(e) => handleHwChange(sIdx, e.target.value)}
                        placeholder={`Type Korean sentence containing e.g. -고, -지만, -아서/어서...`}
                        className="w-full bg-zinc-950 border border-white/5 p-3 rounded-lg text-xs outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>
                  ))}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSubmitHomework}
                      className="py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-zinc-200 transition flex items-center gap-1 cursor-pointer"
                      disabled={submittingHw || hwSents.every(s => !s.trim())}
                    >
                      {submittingHw && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Verify Clauses with AI Tutor</span>
                    </button>
                  </div>
                </div>

                {hwFeedback.length > 0 && (
                  <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
                    <span className="text-xs font-bold text-slate-350 block">AI Homework Analysis Summary:</span>
                    {hwFeedback.map((fb, fIdx) => (
                      <div key={fIdx} className="p-3 bg-zinc-900 rounded border border-white/5 text-xs space-y-1">
                        <div className="font-bold text-zinc-200">Sentence: "{fb.original}"</div>
                        <div className={`font-semibold ${fb.is_correct ? "text-green-400" : "text-red-400"}`}>
                          Status: {fb.is_correct ? "Valid descriptive linking" : "Needs descriptive linking"}
                        </div>
                        <div className="text-zinc-400 leading-normal">{fb.why}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="bg-gradient-to-r from-slate-950 via-[#6366f1]/5 to-slate-950 p-6 rounded-2xl border border-white/5/80 text-center space-y-4">
              <Award className="w-12 h-12 text-indigo-400 mx-auto" />
              <h3 className="text-lg font-extrabold text-white">Lab Completion Checkpoint</h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                Once satisfied with your writing exercises, submit to complete Grammar Lab 5, earn XP, and register your mastery.
              </p>

              {completionData && (
                <div className="text-xs text-green-400 font-semibold bg-green-950/20 border border-green-900 py-2.5 rounded-lg max-w-xs mx-auto">
                  Status: Completed! Badge earned: {completionData.badge}
                </div>
              )}

              <button
                onClick={handleCompleteLab}
                className="py-3 px-8 bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 hover:from-[#5053e3] hover:to-cyan-400 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-950 cursor-pointer flex items-center gap-1.5 mx-auto"
                disabled={completingLab}
              >
                {completingLab && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Complete Lab & Claim Badge</span>
              </button>
            </div>

            <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
              <button 
                onClick={() => setStep(5)}
                className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <div />
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
