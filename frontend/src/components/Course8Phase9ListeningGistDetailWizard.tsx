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
  RotateCcw,
  Volume2,
  Mic,
  Activity,
  Play,
  ArrowRight,
  HelpCircle,
  Clock,
  MapPin,
  User,
  Coffee,
  Trees,
  Briefcase
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
  const cleanPath = path.startsWith("/pls-lab") ? path : `/pls-lab${path}`;
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

interface Course8Phase9ListeningGistDetailWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course8Phase9ListeningGistDetailWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course8Phase9ListeningGistDetailWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);

  // Loaded data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1A: Choose the best title
  const [titleItems, setTitleItems] = useState<any[]>([]);
  const [titleIdx, setTitleIdx] = useState(0);
  const [titleSelected, setTitleSelected] = useState<string | null>(null);
  const [titleChecked, setTitleChecked] = useState(false);
  const [titleCorrect, setTitleCorrect] = useState<boolean | null>(null);
  const [titleExplanation, setTitleExplanation] = useState("");

  // Activity 1B: Main idea MCQ
  const [mainIdeaItems, setMainIdeaItems] = useState<any[]>([]);
  const [mainIdeaIdx, setMainIdeaIdx] = useState(0);
  const [mainIdeaSelected, setMainIdeaSelected] = useState<string | null>(null);
  const [mainIdeaChecked, setMainIdeaChecked] = useState(false);
  const [mainIdeaCorrect, setMainIdeaCorrect] = useState<boolean | null>(null);
  const [mainIdeaExplanation, setMainIdeaExplanation] = useState("");

  // Activity 1C: Image / topic match
  const [imageItems, setImageItems] = useState<any[]>([]);
  const [imageIdx, setImageIdx] = useState(0);
  const [imageSelected, setImageSelected] = useState<string | null>(null);
  const [imageChecked, setImageChecked] = useState(false);
  const [imageCorrect, setImageCorrect] = useState<boolean | null>(null);
  const [imageExplanation, setImageExplanation] = useState("");

  // Activity 2A: Detail who, where, when
  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [detailIdx, setDetailIdx] = useState(0);
  const [detailAnswers, setDetailAnswers] = useState<Record<string, string>>({}); // questionId -> answer
  const [detailChecked, setDetailChecked] = useState(false);
  const [detailExplanation, setDetailExplanation] = useState("");

  // Activity 2B: Numbers and quantities
  const [numberItems, setNumberItems] = useState<any[]>([]);
  const [numberIdx, setNumberIdx] = useState(0);
  const [numberAnswers, setNumberAnswers] = useState<Record<string, string>>({});
  const [numberChecked, setNumberChecked] = useState(false);
  const [numberExplanation, setNumberExplanation] = useState("");

  // Activity 2C: Micro dictation
  const [dictItems, setDictItems] = useState<any[]>([]);
  const [dictIdx, setDictIdx] = useState(0);
  const [dictInput, setDictInput] = useState("");
  const [dictChecked, setDictChecked] = useState(false);
  const [dictCorrect, setDictCorrect] = useState<boolean | null>(null);
  const [dictExplanation, setDictExplanation] = useState("");

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
  const [hwFeedback, setHwFeedback] = useState<any>(null);
  const [submittingHw, setSubmittingHw] = useState(false);
  const [completingLab, setCompletingLab] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/9/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/9/core-data");
          setCoreData(res);
        } else if (step === 3) {
          if (titleItems.length === 0) {
            const resTitle = await apiJson("/phase-9/items/gist-title");
            setTitleItems(resTitle);
          }
          if (mainIdeaItems.length === 0) {
            const resMi = await apiJson("/phase-9/items/gist-main-idea");
            setMainIdeaItems(resMi);
          }
          if (imageItems.length === 0) {
            const resImg = await apiJson("/phase-9/items/gist-image-match");
            setImageItems(resImg);
          }
        } else if (step === 4) {
          if (detailItems.length === 0) {
            const resDet = await apiJson("/phase-9/items/detail-who-where-when");
            setDetailItems(resDet);
          }
          if (numberItems.length === 0) {
            const resNum = await apiJson("/phase-9/items/detail-numbers");
            setNumberItems(resNum);
          }
          if (dictItems.length === 0) {
            const resDict = await apiJson("/phase-9/items/dictation");
            setDictItems(resDict);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/phase-9/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-9/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading PLS Lab Phase 9:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1A check
  const handleCheckTitle = async () => {
    const current = titleItems[titleIdx];
    if (!current || !titleSelected) return;
    try {
      const res = await apiJson("/phase-9/items/gist-title/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: titleSelected })
      });
      setTitleCorrect(res.correct);
      setTitleChecked(true);
      setTitleExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextTitle = () => {
    setTitleSelected(null);
    setTitleChecked(false);
    setTitleCorrect(null);
    setTitleExplanation("");
    if (titleIdx < titleItems.length - 1) {
      setTitleIdx(prev => prev + 1);
    }
  };

  // Activity 1B check
  const handleCheckMainIdea = async () => {
    const current = mainIdeaItems[mainIdeaIdx];
    if (!current || !mainIdeaSelected) return;
    try {
      const res = await apiJson("/phase-9/items/gist-main-idea/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: mainIdeaSelected })
      });
      setMainIdeaCorrect(res.correct);
      setMainIdeaChecked(true);
      setMainIdeaExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextMainIdea = () => {
    setMainIdeaSelected(null);
    setMainIdeaChecked(false);
    setMainIdeaCorrect(null);
    setMainIdeaExplanation("");
    if (mainIdeaIdx < mainIdeaItems.length - 1) {
      setMainIdeaIdx(prev => prev + 1);
    }
  };

  // Activity 1C check
  const handleCheckImage = async () => {
    const current = imageItems[imageIdx];
    if (!current || !imageSelected) return;
    try {
      const res = await apiJson("/phase-9/items/gist-image-match/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: imageSelected })
      });
      setImageCorrect(res.correct);
      setImageChecked(true);
      setImageExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextImage = () => {
    setImageSelected(null);
    setImageChecked(false);
    setImageCorrect(null);
    setImageExplanation("");
    if (imageIdx < imageItems.length - 1) {
      setImageIdx(prev => prev + 1);
    }
  };

  // Activity 2A check
  const handleSelectDetailAnswer = (qId: string, opt: string) => {
    if (detailChecked) return;
    setDetailAnswers(prev => ({
      ...prev,
      [qId]: opt
    }));
  };

  const handleCheckDetail = async () => {
    const current = detailItems[detailIdx];
    if (!current) return;
    try {
      const res = await apiJson("/phase-9/items/detail-who-where-when/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: JSON.stringify(detailAnswers) })
      });
      setDetailChecked(true);
      setDetailExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextDetail = () => {
    setDetailAnswers({});
    setDetailChecked(false);
    setDetailExplanation("");
    if (detailIdx < detailItems.length - 1) {
      setDetailIdx(prev => prev + 1);
    }
  };

  // Activity 2B check
  const handleSelectNumberAnswer = (qId: string, opt: string) => {
    if (numberChecked) return;
    setNumberAnswers(prev => ({
      ...prev,
      [qId]: opt
    }));
  };

  const handleCheckNumber = async () => {
    const current = numberItems[numberIdx];
    if (!current) return;
    try {
      const res = await apiJson("/phase-9/items/detail-numbers/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: JSON.stringify(numberAnswers) })
      });
      setNumberChecked(true);
      setNumberExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextNumber = () => {
    setNumberAnswers({});
    setNumberChecked(false);
    setNumberExplanation("");
    if (numberIdx < numberItems.length - 1) {
      setNumberIdx(prev => prev + 1);
    }
  };

  // Activity 2C check
  const handleCheckDictation = async () => {
    const current = dictItems[dictIdx];
    if (!current || !dictInput.trim()) return;
    try {
      const res = await apiJson("/phase-9/items/dictation/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: dictInput })
      });
      setDictCorrect(res.correct);
      setDictChecked(true);
      setDictExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextDictation = () => {
    setDictInput("");
    setDictChecked(false);
    setDictCorrect(null);
    setDictExplanation("");
    if (dictIdx < dictItems.length - 1) {
      setDictIdx(prev => prev + 1);
    }
  };

  // Quiz flow
  const handleCheckQuizAnswer = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelected) return;
    try {
      const res = await apiJson("/phase-9/quiz/answer", {
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
        await apiJson("/phase-9/quiz/finish", {
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
      const res = await apiJson("/phase-9/homework/submit", {
        method: "POST",
        body: JSON.stringify({ sentences: hwSents })
      });
      setHwFeedback(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingHw(false);
    }
  };

  const handleCompleteLab = async () => {
    setCompletingLab(true);
    try {
      await apiJson("/phase-9/complete", { method: "POST" });
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingLab(false);
    }
  };

    const outlineSteps = [
    { num: 1, label: "= 1 ? \"bg-cyan-500\" : \"bg-slate-700\"}`} /> Screen 1: Welcome & Phase Overview" },
    { num: 2, label: "= 2 ? \"bg-teal-500\" : \"bg-slate-700\"}`} /> Screen 2: Gist vs Detail Concepts & Strategies" },
    { num: 3, label: "= 3 ? \"bg-indigo-500\" : \"bg-slate-700\"}`} /> Screen 3: Activity 1: Gist Listening Drills" },
    { num: 4, label: "= 4 ? \"bg-purple-500\" : \"bg-slate-700\"}`} /> Screen 4: Activity 2: Detailed Fact Drills" },
    { num: 5, label: "= 5 ? \"bg-pink-500\" : \"bg-slate-700\"}`} /> Screen 5: Mini-Quiz: Integrated Listening Exam" },
    { num: 6, label: "= 6 ? \"bg-emerald-500\" : \"bg-slate-700\"}`} /> Screen 6: Homework & Listening Coach logs" }
  ];

  return (
    <div className="flex-grow flex flex-col justify-between">
      {/* Header bar */}
      <header className="border-b border-white/5 bg-zinc-900/60 backdrop-blur px-8 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="font-black text-xl text-white tracking-tight">Listening Lab</h2>
            <p className="text-xs text-zinc-400">Gist & Detail (A2→B1)</p>
          </div>
        </div>

        {/* Dynamic progress bar */}
        <div className="flex-1 max-w-md mx-8 hidden sm:block">
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>Progress</span>
            <span>{Math.round((step / 6) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-500 h-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Outline panel */}
      

      {/* SCREEN 1: WELCOME */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in relative overflow-hidden">
          <div className="relative mx-auto w-fit">
            <div className="p-4 bg-cyan-500/10 rounded-full border border-cyan-500/25 text-cyan-400">
              <Volume2 className="w-10 h-10" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-brand-500 rounded-full border-2 border-zinc-950">
              <Sparkles className="w-3 h-3 text-white fill-white" />
            </div>
          </div>

          <div>
            <h2 className="text-5xl font-black text-white tracking-tight font-sans">{metadata?.title || "Listening Lab – Gist & Detail (A2→B1)"}</h2>
            <h3 className="text-2xl font-extrabold text-cyan-400 mt-2">{metadata?.subtitle || "Catch the big picture and the important facts."}</h3>
          </div>

          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "In this lab, you’ll practise two key listening skills: understanding the main idea (gist) and picking out important details like who, where, when, and how often."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Focus Milestones:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Use first listen for main idea",
                "Use second listen for key details (numbers, times, places)",
                "Work with short monologues and dialogues from everyday topics"
              ]).map((g: string, i: number) => <li key={i}>{g}</li>)}
            </ul>
            <p className="pt-2 text-zinc-400"><strong>⏱️ Est. Lab Time:</strong> 25 minutes</p>
            <p className="text-zinc-400"><strong>🔗 Prerequisites:</strong> {metadata?.dependencies || "Conversation Lab (Completed)"}</p>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl mx-auto">
            {["A2→B1", "Listening", "Gist", "Detail"].map(chip => (
              <span key={chip} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] text-cyan-300 font-bold">{chip}</span>
            ))}
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => setStep(2)} 
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-450 hover:to-cyan-455 text-zinc-955 font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-4 h-4" /> Start Gist & Detail Lab
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: CONCEPT EXPLANATION */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            Gist vs Detail Strategies
          </h2>

          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
            {/* Gist Block */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1">
              <h3 className="font-bold text-white mb-1">1. Gist = Main Idea</h3>
              <p className="text-zinc-400">Gist listening means capturing the general topic, theme, or mood of the speaker. Do NOT focus on individual words or try to translate in your head.</p>
              <p className="text-[10px] text-zinc-500 italic">Examples: "Are they talking about travel?", "Is the speaker excited or disappointed?"</p>
            </div>

            {/* Detail Block */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1">
              <h3 className="font-bold text-white mb-1">2. Detail = Specific Facts</h3>
              <p className="text-zinc-400">Detail listening involves scanning the speech actively to pluck out specific information: names, places, numbers, dates, costs, or reasons.</p>
              <p className="text-[10px] text-zinc-500 italic">Examples: "At what time? (3시)", "How much? (오천 원)", "How many? (두 명)"</p>
            </div>

            {/* Strategy Block */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
              <h3 className="font-bold text-white mb-1">3. Three-Pass Strategy</h3>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="bg-zinc-900 border border-white/5 p-2 rounded">
                  <span className="font-bold text-cyan-300 block mb-1">Pass 1: Gist</span>
                  Listen once for context & mood. Ignore spelling.
                </div>
                <div className="bg-zinc-900 border border-white/5 p-2 rounded">
                  <span className="font-bold text-teal-300 block mb-1">Pass 2: Detail</span>
                  Look at questions first, scan for numbers/facts.
                </div>
                <div className="bg-zinc-900 border border-white/5 p-2 rounded">
                  <span className="font-bold text-indigo-300 block mb-1">Pass 3: Check</span>
                  Compare with transcripts & do micro-dictation.
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button 
              onClick={() => setStep(3)}
              className="flex items-center gap-1 py-2.5 px-6 bg-cyan-500 hover:bg-cyan-455 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Gist Drills
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: ACTIVITY 1: LISTENING FOR GIST */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 1: Listening for Gist (First Pass)
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Capture the main idea and general topics</h2>
          </div>

          {/* Activity 1A: Choose the best title */}
          {titleItems.length > 0 && !titleChecked && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Choose the Best Title</span>
                <span>Audio {titleIdx + 1} of {titleItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-3">
                <span className="text-[10px] text-zinc-550 block uppercase font-bold">Listen once without transcripts:</span>
                <button
                  onClick={() => playAudio(titleItems[titleIdx].audio_text)}
                  className="py-2.5 px-5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs rounded-lg cursor-pointer inline-flex items-center gap-2"
                >
                  <Volume2 className="w-4.5 h-4.5" /> Play Gist Audio
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-zinc-400 block font-bold">Which title best summarises the general topic?</span>
                <div className="grid grid-cols-3 gap-2">
                  {titleItems[titleIdx].options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => setTitleSelected(opt)}
                      className={`py-3 px-1 rounded-xl text-[10px] font-semibold border transition text-center ${
                        titleSelected === opt 
                          ? "border-cyan-500 bg-cyan-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-400 hover:bg-slate-800"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCheckTitle}
                  className="py-2 px-5 bg-cyan-500 hover:bg-cyan-455 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer"
                  disabled={!titleSelected}
                >
                  Submit Guess
                </button>
              </div>
            </div>
          )}

          {titleChecked && titleIdx <= titleItems.length - 1 && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Choose the Best Title</span>
                <span>Audio {titleIdx + 1} of {titleItems.length}</span>
              </div>
              <div className={`p-4 rounded-xl border text-xs leading-relaxed ${titleCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                <strong>{titleCorrect ? "Correct!" : "Incorrect."}</strong> {titleExplanation}
              </div>
              <div className="flex justify-end">
                {titleIdx < titleItems.length - 1 ? (
                  <button
                    onClick={handleNextTitle}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Title Audio
                  </button>
                ) : (
                  <button
                    onClick={() => setTitleIdx(titleItems.length)} // Move past Part A
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-405 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                  >
                    Proceed to Part B
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 1B: Main idea MCQ */}
          {titleIdx === titleItems.length && mainIdeaItems.length > 0 && !mainIdeaChecked && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Main Idea Selection (MCQ)</span>
                <span>Passage {mainIdeaIdx + 1} of {mainIdeaItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-3">
                <button
                  onClick={() => playAudio(mainIdeaItems[mainIdeaIdx].audio_text)}
                  className="py-2.5 px-5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs rounded-lg cursor-pointer inline-flex items-center gap-2"
                >
                  <Volume2 className="w-4.5 h-4.5" /> Play Main Idea Audio
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-zinc-400 block font-bold">What is the speaker mainly talking about?</span>
                <div className="space-y-2">
                  {mainIdeaItems[mainIdeaIdx].options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => setMainIdeaSelected(opt)}
                      className={`w-full text-left p-3.5 rounded-xl text-xs border transition ${
                        mainIdeaSelected === opt 
                          ? "border-cyan-500 bg-cyan-500/10 text-white font-bold" 
                          : "border-white/5 bg-zinc-900 text-zinc-400 hover:bg-slate-800"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCheckMainIdea}
                  className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-455 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer"
                  disabled={!mainIdeaSelected}
                >
                  Verify Main Idea
                </button>
              </div>
            </div>
          )}

          {mainIdeaChecked && mainIdeaIdx <= mainIdeaItems.length - 1 && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Main Idea Selection (MCQ)</span>
                <span>Passage {mainIdeaIdx + 1} of {mainIdeaItems.length}</span>
              </div>
              <div className={`p-4 rounded-xl border text-xs leading-relaxed ${mainIdeaCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                <strong>{mainIdeaCorrect ? "Correct!" : "Incorrect."}</strong> {mainIdeaExplanation}
              </div>
              <div className="flex justify-end">
                {mainIdeaIdx < mainIdeaItems.length - 1 ? (
                  <button
                    onClick={handleNextMainIdea}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Passage
                  </button>
                ) : (
                  <button
                    onClick={() => setMainIdeaIdx(mainIdeaItems.length)} // Move past Part B
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-405 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                  >
                    Proceed to Part C
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 1C: Image / topic match */}
          {titleIdx === titleItems.length && mainIdeaIdx === mainIdeaItems.length && imageItems.length > 0 && !imageChecked && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Category / Topic Icon Match</span>
                <span>Audio {imageIdx + 1} of {imageItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-3">
                <button
                  onClick={() => playAudio(imageItems[imageIdx].audio_text)}
                  className="py-2.5 px-5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs rounded-lg cursor-pointer inline-flex items-center gap-2"
                >
                  <Volume2 className="w-4.5 h-4.5" /> Play Audio
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-zinc-400 block font-bold">Which category best matches the context?</span>
                <div className="grid grid-cols-3 gap-3">
                  {imageItems[imageIdx].options.map((opt: string) => {
                    const isSelected = imageSelected === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setImageSelected(opt)}
                        className={`p-4 rounded-2xl border transition flex flex-col items-center justify-center gap-2 ${
                          isSelected 
                            ? "border-cyan-500 bg-cyan-500/10 text-white font-bold" 
                            : "border-white/5 bg-zinc-900 text-zinc-400 hover:bg-slate-800"
                        }`}
                      >
                        {opt.includes("Café") && <Coffee className="w-6 h-6 text-cyan-400" />}
                        {opt.includes("Park") && <Trees className="w-6 h-6 text-emerald-400" />}
                        {opt.includes("Office") && <Briefcase className="w-6 h-6 text-indigo-400" />}
                        <span className="text-[10px]">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCheckImage}
                  className="py-2 px-5 bg-cyan-500 hover:bg-cyan-455 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer"
                  disabled={!imageSelected}
                >
                  Verify Category
                </button>
              </div>
            </div>
          )}

          {imageChecked && imageIdx <= imageItems.length - 1 && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Category / Topic Icon Match</span>
                <span>Audio {imageIdx + 1} of {imageItems.length}</span>
              </div>
              <div className={`p-4 rounded-xl border text-xs leading-relaxed ${imageCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                <strong>{imageCorrect ? "Correct!" : "Incorrect."}</strong> {imageExplanation}
              </div>
              <div className="flex justify-end">
                {imageIdx < imageItems.length - 1 ? (
                  <button
                    onClick={handleNextImage}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Audio
                  </button>
                ) : (
                  <button
                    onClick={() => setStep(4)} // Move to Step 4 detailed listening
                    className="py-2.5 px-6 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-450 hover:to-cyan-450 text-zinc-950 font-bold rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    Proceed to Detail Listening
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => {
                setTitleIdx(0);
                setMainIdeaIdx(0);
                setImageIdx(0);
                setStep(2);
              }}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 4: ACTIVITY 2: LISTENING FOR DETAIL */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 2: Detailed Fact Extraction (Second Pass)
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Focus on specific character, location, time & spelling details</h2>
          </div>

          {/* Activity 2A: Key facts who where when */}
          {detailItems.length > 0 && !detailChecked && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Who, Where, When Details</span>
                <span>Dialogue {detailIdx + 1} of {detailItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-3">
                <span className="text-[10px] text-zinc-500 font-mono block">Read the questions below, then listen carefully:</span>
                <button
                  onClick={() => playAudio(detailItems[detailIdx].audio_text)}
                  className="py-2 px-5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs rounded-lg cursor-pointer inline-flex items-center gap-2"
                >
                  <Volume2 className="w-4 h-4" /> Play Detail Audio
                </button>
              </div>

              <div className="space-y-3">
                {detailItems[detailIdx].questions.map((q: any) => (
                  <div key={q.id} className="space-y-1.5">
                    <span className="text-xs text-zinc-350 block font-bold">{q.question}</span>
                    <div className="grid grid-cols-3 gap-2">
                      {q.options.map((opt: string) => {
                        const isSelected = detailAnswers[q.id] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleSelectDetailAnswer(q.id, opt)}
                            className={`py-2 rounded-lg text-[10px] font-semibold border transition text-center ${
                              isSelected 
                                ? "border-cyan-500 bg-cyan-500/10 text-white" 
                                : "border-white/5 bg-zinc-900 text-zinc-400 hover:bg-slate-800"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCheckDetail}
                  className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-455 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer"
                  disabled={Object.keys(detailAnswers).length < detailItems[detailIdx].questions.length}
                >
                  Verify Answers
                </button>
              </div>
            </div>
          )}

          {detailChecked && detailIdx <= detailItems.length - 1 && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Who, Where, When Details</span>
                <span>Dialogue {detailIdx + 1} of {detailItems.length}</span>
              </div>
              <div className="bg-green-950/20 border border-green-900 p-4 rounded-xl text-xs text-green-300 leading-relaxed">
                <strong>Correct!</strong> {detailExplanation}
              </div>
              <div className="flex justify-end">
                {detailIdx < detailItems.length - 1 ? (
                  <button
                    onClick={handleNextDetail}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Dialogue
                  </button>
                ) : (
                  <button
                    onClick={() => setDetailIdx(detailItems.length)} // Move past Part A
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-405 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                  >
                    Proceed to Part B
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2B: Numbers and quantities */}
          {detailIdx === detailItems.length && numberItems.length > 0 && !numberChecked && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Numbers, Times, and Quantities</span>
                <span>Dialogue {numberIdx + 1} of {numberItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-3">
                <button
                  onClick={() => playAudio(numberItems[numberIdx].audio_text)}
                  className="py-2 px-5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs rounded-lg cursor-pointer inline-flex items-center gap-2"
                >
                  <Volume2 className="w-4.5 h-4.5" /> Play Numeric Audio
                </button>
              </div>

              <div className="space-y-3">
                {numberItems[numberIdx].questions.map((q: any) => (
                  <div key={q.id} className="space-y-1.5">
                    <span className="text-xs text-zinc-350 block font-bold">{q.question}</span>
                    <div className="grid grid-cols-3 gap-2">
                      {q.options.map((opt: string) => {
                        const isSelected = numberAnswers[q.id] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleSelectNumberAnswer(q.id, opt)}
                            className={`py-2 rounded-lg text-[10px] font-semibold border transition text-center ${
                              isSelected 
                                ? "border-cyan-500 bg-cyan-500/10 text-white font-bold" 
                                : "border-white/5 bg-zinc-900 text-zinc-450 hover:bg-slate-800"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCheckNumber}
                  className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-455 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer"
                  disabled={Object.keys(numberAnswers).length < numberItems[numberIdx].questions.length}
                >
                  Verify Numbers
                </button>
              </div>
            </div>
          )}

          {numberChecked && numberIdx <= numberItems.length - 1 && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Numbers, Times, and Quantities</span>
                <span>Dialogue {numberIdx + 1} of {numberItems.length}</span>
              </div>
              <div className="bg-green-950/20 border border-green-900 p-4 rounded-xl text-xs text-green-300 leading-relaxed">
                <strong>Correct!</strong> {numberExplanation}
              </div>
              <div className="flex justify-end">
                {numberIdx < numberItems.length - 1 ? (
                  <button
                    onClick={handleNextNumber}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Dialogue
                  </button>
                ) : (
                  <button
                    onClick={() => setNumberIdx(numberItems.length)} // Move past Part B
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-405 text-xs font-bold rounded-lg text-zinc-950 transition cursor-pointer"
                  >
                    Proceed to Part C
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2C: Micro dictation */}
          {detailIdx === detailItems.length && numberIdx === numberItems.length && dictItems.length > 0 && !dictChecked && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Micro Dictation (Close Listening)</span>
                <span>Sentence {dictIdx + 1} of {dictItems.length}</span>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center space-y-3">
                <span className="text-[10px] text-zinc-550 block uppercase font-bold">Listen and type the missing word:</span>
                <button
                  onClick={() => playAudio(dictItems[dictIdx].audio_text)}
                  className="py-2 px-5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs rounded-lg cursor-pointer inline-flex items-center gap-2"
                >
                  <Volume2 className="w-4.5 h-4.5" /> Play Sentence
                </button>
              </div>

              <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 text-center text-sm font-extrabold text-white">
                {dictItems[dictIdx].partial}
              </div>

              <div className="space-y-1.5">
                <input
                  type="text"
                  value={dictInput}
                  onChange={(e) => setDictInput(e.target.value)}
                  placeholder="Type missing Hangeul letters here..."
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 outline-none focus:border-cyan-500 text-xs text-white text-center font-sans font-bold"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCheckDictation}
                  className="py-2 px-5 bg-cyan-500 hover:bg-cyan-455 text-zinc-955 text-xs font-bold rounded-lg transition cursor-pointer"
                  disabled={!dictInput.trim()}
                >
                  Verify Spelling
                </button>
              </div>
            </div>
          )}

          {dictChecked && dictIdx <= dictItems.length - 1 && (
            <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Micro Dictation (Close Listening)</span>
                <span>Sentence {dictIdx + 1} of {dictItems.length}</span>
              </div>
              <div className={`p-4 rounded-xl border text-xs leading-relaxed ${dictCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                <strong>{dictCorrect ? "Correct!" : "Incorrect."}</strong> {dictExplanation}
              </div>
              <div className="bg-zinc-900 p-3 rounded-lg border border-white/5 text-xs text-center text-zinc-350">
                <strong>Full Translation:</strong> {dictItems[dictIdx].translation}
              </div>
              <div className="flex justify-end">
                {dictIdx < dictItems.length - 1 ? (
                  <button
                    onClick={handleNextDictation}
                    className="py-2 px-4 bg-cyan-500 hover:bg-cyan-455 text-xs font-bold rounded-lg text-white transition cursor-pointer"
                  >
                    Next Sentence
                  </button>
                ) : (
                  <button
                    onClick={() => setStep(5)} // Move to quiz
                    className="py-2.5 px-6 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-450 hover:to-cyan-450 text-zinc-950 font-bold rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    Proceed to Quiz
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => {
                setDetailIdx(0);
                setNumberIdx(0);
                setDictIdx(0);
                setStep(3);
              }}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 5: QUIZ */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Integrated Gist & Detail Quiz
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Test both gist and detail listening skills</h2>
          </div>

          {quizScore === null ? (
            quizBlueprint.length > 0 ? (
              <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Question {quizIdx + 1} of {quizBlueprint.length}</span>
                </div>

                <div className="text-sm font-extrabold text-white min-h-[50px]">
                  {quizBlueprint[quizIdx]?.question}
                </div>

                <div className="space-y-2">
                  {quizBlueprint[quizIdx]?.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelected(opt)}
                      className={`w-full text-left p-3.5 rounded-xl text-xs border transition ${
                        quizSelected === opt 
                          ? "border-cyan-500 bg-cyan-500/10 text-white font-bold" 
                          : "border-white/5 bg-zinc-900 text-zinc-405 hover:bg-slate-800"
                      } ${quizChecked && opt === quizBlueprint[quizIdx].correct_answer ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                      disabled={quizChecked}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {quizChecked && (
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${quizCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                    <strong>{quizCorrect ? "Correct!" : "Incorrect."}</strong> {quizExplanation}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  {!quizChecked ? (
                    <button
                      onClick={handleCheckQuizAnswer}
                      className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-455 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer"
                      disabled={!quizSelected}
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuiz}
                      className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-405 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      {quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            )
          ) : (
            <div className="bg-zinc-955 p-6 rounded-2xl border border-white/5 text-center space-y-5">
              <Award className="w-12 h-12 text-yellow-400 mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-white">Quiz Completed!</h3>
                <p className="text-2xl font-black text-cyan-400 mt-1">{quizScore}% Score</p>
                <p className="text-xs text-zinc-400 mt-1">
                  {quizScore >= 80 ? "🎉 Amazing! You passed the gist and details checkpoint." : "Review the lessons and try again to improve your score."}
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleRestartQuiz}
                  className="py-2 px-4 border border-white/10 hover:bg-zinc-800 text-xs font-bold rounded-lg text-zinc-350 transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz
                </button>

                {quizScore >= 80 && (
                  <button
                    onClick={() => setStep(6)}
                    className="py-2 px-5 bg-cyan-500 hover:bg-cyan-455 text-zinc-955 text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Proceed to Homework
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => {
                setQuizScore(null);
                setQuizIdx(0);
                setStep(4);
              }}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 6: HOMEWORK */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Homework & Listening Plan Coach
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Log your multi-pass listening practice habits</h2>
          </div>

          <div className="bg-zinc-955 p-5 rounded-xl border border-white/5 space-y-4">
            <div className="text-xs text-zinc-400 border-b border-white/5 pb-2 uppercase font-bold tracking-wider font-mono">
              Assigned Listening Exercises
            </div>

            <div className="space-y-3">
              {homeworkItems.map((hw: any, idx: number) => (
                <div key={hw.id} className="bg-zinc-900 p-3.5 rounded-lg border border-white/5 space-y-2">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase font-mono block">Exercise {idx + 1}</span>
                  <span className="text-xs text-zinc-250 block">{hw.text}</span>
                  
                  <textarea
                    rows={2}
                    value={hwSents[idx] || ""}
                    onChange={(e) => handleHwChange(idx, e.target.value)}
                    placeholder="Enter details of your listening log reflections..."
                    className="w-full bg-zinc-955 border border-white/5 focus:border-cyan-500/50 outline-none rounded p-2 text-xs text-zinc-300 resize-none font-sans"
                    disabled={hwFeedback !== null}
                  />
                </div>
              ))}
            </div>

            {hwFeedback && (
              <div className="bg-green-950/20 border border-green-900 p-4 rounded-xl text-xs text-green-300 leading-relaxed space-y-1">
                <span className="font-bold block">✓ Habit check complete</span>
                <p>{hwFeedback.feedback || "Your listening plan logs have been successfully logged."}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              {!hwFeedback ? (
                <button
                  onClick={handleSubmitHomework}
                  disabled={submittingHw}
                  className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-455 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/25"
                >
                  {submittingHw ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>Submit Listening Log</>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleCompleteLab}
                  disabled={completingLab}
                  className="py-2.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-450 text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/25"
                >
                  {completingLab ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Finalizing...
                    </>
                  ) : (
                    <>Complete Phase 9 & Graduate 🎉</>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => {
                setHwFeedback(null);
                setStep(5);
              }}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
