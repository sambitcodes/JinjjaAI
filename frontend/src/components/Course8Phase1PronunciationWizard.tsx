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
  Play
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

interface Course8Phase1PronunciationWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course8Phase1PronunciationWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course8Phase1PronunciationWizardProps) {
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c8p1_step");
    const savedMax = localStorage.getItem("hangeulai_c8p1_max_step");
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
      localStorage.setItem("hangeulai_c8p1_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);

  // Loaded data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1A: Syllable Discrim
  const [sdItems, setSdItems] = useState<any[]>([]);
  const [sdIdx, setSdIdx] = useState(0);
  const [sdSelected, setSdSelected] = useState<string | null>(null);
  const [sdChecked, setSdChecked] = useState(false);
  const [sdCorrect, setSdCorrect] = useState<boolean | null>(null);
  const [sdExplanation, setSdExplanation] = useState("");

  // Activity 1B: Minimal Pairs
  const [mpItems, setMpItems] = useState<any[]>([]);
  const [mpIdx, setMpIdx] = useState(0);
  const [mpSelected, setMpSelected] = useState<string | null>(null);
  const [mpChecked, setMpChecked] = useState(false);
  const [mpCorrect, setMpCorrect] = useState<boolean | null>(null);
  const [mpExplanation, setMpExplanation] = useState("");

  // Activity 1C: CV Build
  const [cvItems, setCvItems] = useState<any[]>([]);
  const [cvIdx, setCvIdx] = useState(0);
  const [selectedC, setSelectedC] = useState<string | null>(null);
  const [selectedV, setSelectedV] = useState<string | null>(null);
  const [cvChecked, setCvChecked] = useState(false);
  const [cvCorrect, setCvCorrect] = useState<boolean | null>(null);

  // Activity 2A: Word Recognition
  const [wrItems, setWrItems] = useState<any[]>([]);
  const [wrIdx, setWrIdx] = useState(0);
  const [wrSelected, setWrSelected] = useState<string | null>(null);
  const [wrChecked, setWrChecked] = useState(false);
  const [wrCorrect, setWrCorrect] = useState<boolean | null>(null);
  const [wrGloss, setWrGloss] = useState("");

  // Activity 2B: Listen, Read, Repeat
  const [wpItems, setWpItems] = useState<any[]>([]);
  const [wpIdx, setWpIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [wpEvaluated, setWpEvaluated] = useState(false);
  const [wpScore, setWpScore] = useState<number | null>(null);
  const [wpSyllableScores, setWpSyllableScores] = useState<Record<string, string>>({});
  const [wpTip, setWpTip] = useState("");

  // Activity 2C: Beat the metronome
  const [rhythmItems, setRhythmItems] = useState<any[]>([]);
  const [rhythmIdx, setRhythmIdx] = useState(0);
  const [metronomePlaying, setMetronomePlaying] = useState(false);
  const [rhythmEvaluated, setRhythmEvaluated] = useState(false);
  const [rhythmScore, setRhythmScore] = useState<number | null>(null);
  const [rhythmFeedback, setRhythmFeedback] = useState("");

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
  const [completionData, setCompletionData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/1/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/1/core-data");
          setCoreData(res);
        } else if (step === 3) {
          if (sdItems.length === 0) {
            const resSd = await apiJson("/phase-1/items/syllable-discrim");
            setSdItems(resSd);
          }
          if (mpItems.length === 0) {
            const resMp = await apiJson("/phase-1/items/minimal-pairs");
            setMpItems(resMp);
          }
          if (cvItems.length === 0) {
            const resCv = await apiJson("/phase-1/items/cv-build");
            setCvItems(resCv);
          }
        } else if (step === 4) {
          if (wrItems.length === 0) {
            const resWr = await apiJson("/phase-1/items/word-recognition");
            setWrItems(resWr);
          }
          if (wpItems.length === 0) {
            const resWp = await apiJson("/phase-1/items/word-pronounce");
            setWpItems(resWp);
          }
          if (rhythmItems.length === 0) {
            const resRh = await apiJson("/phase-1/items/rhythm");
            setRhythmItems(resRh);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-1/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading PLS Lab Phase 1:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Activity 1A check
  const handleCheckSd = async () => {
    const current = sdItems[sdIdx];
    if (!current || !sdSelected) return;
    try {
      const res = await apiJson("/phase-1/items/syllable-discrim/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: sdSelected })
      });
      setSdCorrect(res.correct);
      setSdChecked(true);
      setSdExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextSd = () => {
    setSdSelected(null);
    setSdChecked(false);
    setSdCorrect(null);
    setSdExplanation("");
    if (sdIdx < sdItems.length - 1) {
      setSdIdx(prev => prev + 1);
    }
  };

  // Activity 1B check
  const handleCheckMp = async () => {
    const current = mpItems[mpIdx];
    if (!current || !mpSelected) return;
    try {
      const res = await apiJson("/phase-1/items/minimal-pairs/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: mpSelected })
      });
      setMpCorrect(res.correct);
      setMpChecked(true);
      setMpExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextMp = () => {
    setMpSelected(null);
    setMpChecked(false);
    setMpCorrect(null);
    setMpExplanation("");
    if (mpIdx < mpItems.length - 1) {
      setMpIdx(prev => prev + 1);
    }
  };

  // Activity 1C check
  const handleCheckCv = async () => {
    const current = cvItems[cvIdx];
    if (!current || !selectedC || !selectedV) return;
    try {
      const res = await apiJson("/phase-1/items/cv-build/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, consonant: selectedC, vowel: selectedV })
      });
      setCvCorrect(res.correct);
      setCvChecked(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextCv = () => {
    setSelectedC(null);
    setSelectedV(null);
    setCvChecked(false);
    setCvCorrect(null);
    if (cvIdx < cvItems.length - 1) {
      setCvIdx(prev => prev + 1);
    }
  };

  // Activity 2A check
  const handleCheckWr = async () => {
    const current = wrItems[wrIdx];
    if (!current || !wrSelected) return;
    try {
      const res = await apiJson("/phase-1/items/word-recognition/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: wrSelected })
      });
      setWrCorrect(res.correct);
      setWrChecked(true);
      setWrGloss(res.gloss);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextWr = () => {
    setWrSelected(null);
    setWrChecked(false);
    setWrCorrect(null);
    setWrGloss("");
    if (wrIdx < wrItems.length - 1) {
      setWrIdx(prev => prev + 1);
    }
  };

  // Activity 2B Record & Evaluate Simulation
  const handleRecordWp = () => {
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const current = wpItems[wpIdx];
      try {
        const res = await apiJson("/phase-1/items/word-pronounce/evaluate", {
          method: "POST",
          body: JSON.stringify({ item_id: current.id, audio_base64: "mock_data" })
        });
        setWpScore(res.overall_score);
        setWpSyllableScores(res.syllable_scores);
        setWpTip(res.feedback_tip);
        setWpEvaluated(true);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleNextWp = () => {
    setWpScore(null);
    setWpSyllableScores({});
    setWpTip("");
    setWpEvaluated(false);
    if (wpIdx < wpItems.length - 1) {
      setWpIdx(prev => prev + 1);
    }
  };

  // Activity 2C Record & Rhythm Metronome
  const handleRecordRhythm = () => {
    setMetronomePlaying(true);
    // Simulate beats blinking/ticking
    setTimeout(() => {
      setMetronomePlaying(false);
      setRecording(true);
      setTimeout(async () => {
        setRecording(false);
        const current = rhythmItems[rhythmIdx];
        try {
          const res = await apiJson("/phase-1/items/rhythm/evaluate", {
            method: "POST",
            body: JSON.stringify({ item_id: current.id, audio_base64: "mock_data" })
          });
          setRhythmScore(res.timing_score);
          setRhythmFeedback(res.feedback);
          setRhythmEvaluated(true);
        } catch (err) {
          console.error(err);
        }
      }, 2500);
    }, 2000);
  };

  const handleNextRhythm = () => {
    setRhythmScore(null);
    setRhythmFeedback("");
    setRhythmEvaluated(false);
    if (rhythmIdx < rhythmItems.length - 1) {
      setRhythmIdx(prev => prev + 1);
    }
  };

  // Quiz flow
  const handleCheckQuizAnswer = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelected) return;
    try {
      const res = await apiJson("/quiz/answer", {
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
        await apiJson("/quiz/finish", {
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

  // Homework flow
  const handleHwChange = (index: number, val: string) => {
    const updated = [...hwSents];
    updated[index] = val;
    setHwSents(updated);
  };

  const handleSubmitHomework = async () => {
    setSubmittingHw(true);
    try {
      const res = await apiJson("/phase-1/homework/submit", {
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
      const res = await apiJson("/complete", { method: "POST" });
      setCompletionData(res);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingLab(false);
    }
  };

    const outlineSteps = [
    { num: 1, label: "= 1 ? \"bg-cyan-500\" : \"bg-slate-700\"}`} /> Screen 1: Welcome & Goals Overview" },
    { num: 2, label: "= 2 ? \"bg-teal-500\" : \"bg-slate-700\"}`} /> Screen 2: Concept Explanation: Hangeul → Sound" },
    { num: 3, label: "= 3 ? \"bg-indigo-500\" : \"bg-slate-700\"}`} /> Screen 3: Activity 1: Listen & Match Basic Sounds" },
    { num: 4, label: "= 4 ? \"bg-purple-500\" : \"bg-slate-700\"}`} /> Screen 4: Activity 2: Read & Repeat Simple Words" },
    { num: 5, label: "= 5 ? \"bg-pink-500\" : \"bg-slate-700\"}`} /> Screen 5: Mini-Quiz: Sound Foundations Check" },
    { num: 6, label: "= 6 ? \"bg-emerald-500\" : \"bg-slate-700\"}`} /> Screen 6: Homework & AI Coach" }
  ];

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 8,
          phaseNum: 1,
          step: step
        }
      }));
    }
  }, [step]);

return (
    <div className="flex-grow flex flex-col justify-between">
      {/* Header bar */}
      <header className="border-b border-white/5 bg-zinc-900/60 backdrop-blur px-8 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="font-black text-xl text-white tracking-tight">Pronunciation Lab 1</h2>
            <p className="text-xs text-zinc-400">Sound Foundations</p>
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
              className="bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 h-full transition-all duration-300"
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
            <h2 className="text-5xl font-black text-white tracking-tight font-sans">{metadata?.title || "Pronunciation Lab 1 – Sound Foundations (A1)"}</h2>
            <h3 className="text-2xl font-extrabold text-cyan-400 mt-2">{metadata?.subtitle || "From Hangeul letters to clear Korean sounds."}</h3>
          </div>

          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "In this lab, you’ll connect Hangeul to real pronunciation: consonants, vowels, and simple syllables, so you can say beginner words from Korean 1 with confidence."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Focus Milestones:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Hear and distinguish basic consonants and vowels",
                "Practise simple CV/CVC syllables and word reading",
                "Build stable, even rhythm for short words"
              ]).map((g: string, i: number) => <li key={i}>{g}</li>)}
            </ul>
            <p className="pt-2 text-zinc-400"><strong>⏱️ Est. Lab Time:</strong> 25 minutes</p>
            <p className="text-zinc-400"><strong>🔗 Prerequisites:</strong> {metadata?.dependencies || "Course 0 (Hangeul Bootcamp) & Level 1 materials"}</p>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl mx-auto">
            {["A1", "Pronunciation", "Listening", "Speaking", "Parallel to Korean 1"].map(chip => (
              <span key={chip} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] text-cyan-300 font-bold">{chip}</span>
            ))}
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => {
    if (courseXP < 0) {
      alert("To start Phase 1, you need at least 0 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!");
      return;
    }
    setStep(2);
  }} 
              className="bg-cyan-500 hover:bg-cyan-450 text-zinc-950 font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Volume2 className="w-4 h-4" /> Start Sound Lab 1
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: CONCEPT EXPLANATION */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            Hangeul → Sound Explanation
          </h2>

          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
              <h3 className="font-bold text-white mb-1">1. Hangeul is Sound-Friendly</h3>
              <p className="text-zinc-400">Korean letters represent sounds fairly consistently. Each syllable block is usually one beat. We focus on basic consonants (ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ) and core vowels (ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ) first.</p>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
              <h3 className="font-bold text-white mb-1">2. From Letters to Syllables</h3>
              <p className="text-zinc-400">We take high-frequency vocabulary from Korean 1 (like 가다, 먹다, 보다) and practice reading them: first as isolated syllable beats, then as combined natural words.</p>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
              <h3 className="font-bold text-white mb-1">3. Clear Timing & Rhythm</h3>
              <p className="text-zinc-400">Good pronunciation at A1 is all about *recognizability* and *timing*. One syllable ≈ one beat, without heavy English-style stress/weak vowel reduction.</p>
            </div>
          </div>

          {/* Interactive key sounds grid */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200">Key Sounds Interactive Grid</h3>
            <div className="grid grid-cols-5 gap-2">
              {(coreData?.key_consonants || []).map((cons: string) => (
                <button
                  key={cons}
                  onClick={() => playAudio(cons)}
                  className="p-2 bg-zinc-900 border border-white/5 rounded-lg text-center hover:bg-slate-800 transition text-sm font-semibold text-cyan-300 cursor-pointer"
                >
                  {cons}
                </button>
              ))}
              {(coreData?.key_vowels || []).map((vow: string) => (
                <button
                  key={vow}
                  onClick={() => playAudio(vow)}
                  className="p-2 bg-zinc-900 border border-white/5 rounded-lg text-center hover:bg-slate-800 transition text-sm font-semibold text-teal-300 cursor-pointer"
                >
                  {vow}
                </button>
              ))}
            </div>
          </div>

          {/* Example word strip */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
            <h3 className="text-xs font-bold text-zinc-200">Example Words</h3>
            <div className="flex flex-wrap gap-2">
              {(coreData?.example_words || []).slice(0, 4).map((wd: any) => (
                <button
                  key={wd.ko}
                  onClick={() => playAudio(wd.ko)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-xl text-xs hover:bg-slate-800 transition cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold text-zinc-100">{wd.ko}</span>
                  <span className="text-[10px] text-zinc-400">({wd.en})</span>
                </button>
              ))}
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
              className="flex items-center gap-1 py-2.5 px-6 bg-cyan-500 hover:bg-cyan-450 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Drills
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: ACTIVITY 1: LISTEN & MATCH BASIC SOUNDS */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 1: Perception & Discrimination
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Identify Sounds, Minimal Pairs, and CV Blocks</h2>
          </div>

          {/* Activity 1A: Syllable Discrimination */}
          {sdItems.length > 0 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Which syllable did you hear?</span>
                <span>Syllable {sdIdx + 1} of {sdItems.length}</span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => playAudio(sdItems[sdIdx]?.syllable)}
                  className="p-4 bg-cyan-500/20 text-cyan-300 rounded-full hover:bg-cyan-500/30 transition border border-cyan-500/30 cursor-pointer"
                >
                  <Play className="w-6 h-6 fill-current" />
                </button>
                <span className="text-xs text-zinc-400">Tapping will play the sound. Click Hangeul block below:</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {sdItems[sdIdx]?.options?.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !sdChecked && setSdSelected(opt)}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold border transition text-center ${
                      sdSelected === opt 
                        ? "border-cyan-500 bg-cyan-500/10 text-white" 
                        : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                    } ${sdChecked && opt === sdItems[sdIdx].correct ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                    disabled={sdChecked}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {sdChecked && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${sdCorrect ? "bg-green-950/20 border-green-900 text-green-350" : "bg-red-950/20 border-red-900 text-red-350"}`}>
                  <strong>{sdCorrect ? "Correct!" : "Incorrect."}</strong> {sdExplanation}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!sdChecked ? (
                  <button
                    onClick={handleCheckSd}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-750 text-xs font-bold rounded-lg text-zinc-200 transition"
                    disabled={!sdSelected}
                  >
                    Check Syllable
                  </button>
                ) : (
                  sdIdx < sdItems.length - 1 && (
                    <button
                      onClick={handleNextSd}
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition"
                    >
                      Next Syllable
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Activity 1B: Minimal Pairs */}
          {mpItems.length > 0 && sdChecked && sdIdx === sdItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Consonant or Vowel Shift?</span>
                <span>Pair {mpIdx + 1} of {mpItems.length}</span>
              </div>

              <div className="flex gap-2 items-center">
                <button
                  onClick={() => {
                    playAudio(mpItems[mpIdx]?.word1);
                    setTimeout(() => playAudio(mpItems[mpIdx]?.word2), 800);
                  }}
                  className="p-3 bg-teal-500/20 text-teal-350 rounded-full hover:bg-teal-500/30 transition border border-teal-500/30 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                </button>
                <span className="text-xs text-zinc-450">Listen to the syllable pair. What changed?</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {mpItems[mpIdx]?.options?.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !mpChecked && setMpSelected(opt)}
                    className={`py-3 px-4 rounded-xl text-xs font-semibold border transition text-left ${
                      mpSelected === opt 
                        ? "border-teal-500 bg-teal-500/10 text-white" 
                        : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                    } ${mpChecked && opt === mpItems[mpIdx].correct ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                    disabled={mpChecked}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {mpChecked && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${mpCorrect ? "bg-green-950/20 border-green-900 text-green-350" : "bg-red-950/20 border-red-900 text-red-350"}`}>
                  <strong>{mpCorrect ? "Correct!" : "Incorrect."}</strong> {mpExplanation}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!mpChecked ? (
                  <button
                    onClick={handleCheckMp}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-750 text-xs font-bold rounded-lg text-zinc-200 transition"
                    disabled={!mpSelected}
                  >
                    Check Pair
                  </button>
                ) : (
                  mpIdx < mpItems.length - 1 && (
                    <button
                      onClick={handleNextMp}
                      className="py-2 px-4 bg-teal-500 hover:bg-teal-450 text-xs font-bold rounded-lg text-white transition"
                    >
                      Next Pair
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Activity 1C: Build the Block */}
          {cvItems.length > 0 && mpChecked && mpIdx === mpItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Build the Block</span>
                <span>Block {cvIdx + 1} of {cvItems.length}</span>
              </div>

              <div className="flex gap-2 items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => playAudio(cvItems[cvIdx]?.syllable)}
                    className="p-3 bg-indigo-500/20 text-indigo-300 rounded-full hover:bg-indigo-500/30 transition border border-indigo-500/30 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                  </button>
                  <span className="text-xs text-zinc-455">Listen and pick the correct letters below:</span>
                </div>
                <div className="bg-zinc-900 px-4 py-2.5 rounded-xl border border-white/10 text-xl font-black text-center min-w-16">
                  {selectedC || "C"} + {selectedV || "V"} → <span className="text-indigo-400">{cvChecked ? cvItems[cvIdx].syllable : "?"}</span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Consonants */}
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold mb-1">Pick Consonant:</span>
                  <div className="flex flex-wrap gap-1">
                    {["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ"].map(c => (
                      <button
                        key={c}
                        onClick={() => !cvChecked && setSelectedC(c)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                          selectedC === c ? "border-indigo-400 bg-indigo-500/10 text-white" : "border-white/5 bg-zinc-900 text-zinc-400 hover:bg-slate-800"
                        }`}
                        disabled={cvChecked}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vowels */}
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold mb-1">Pick Vowel:</span>
                  <div className="flex flex-wrap gap-1">
                    {["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"].map(v => (
                      <button
                        key={v}
                        onClick={() => !cvChecked && setSelectedV(v)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                          selectedV === v ? "border-indigo-400 bg-indigo-500/10 text-white" : "border-white/5 bg-zinc-900 text-zinc-400 hover:bg-slate-800"
                        }`}
                        disabled={cvChecked}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {cvChecked && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${cvCorrect ? "bg-green-950/20 border-green-900 text-green-300" : "bg-red-950/20 border-red-900 text-red-300"}`}>
                  <strong>{cvCorrect ? "Block Matched!" : "Letters do not match."}</strong> ㄴ + ㅓ makes {cvItems[cvIdx].syllable}.
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!cvChecked ? (
                  <button
                    onClick={handleCheckCv}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-755 text-xs font-bold rounded-lg text-zinc-200 transition"
                    disabled={!selectedC || !selectedV}
                  >
                    Build Block
                  </button>
                ) : (
                  cvIdx < cvItems.length - 1 && (
                    <button
                      onClick={handleNextCv}
                      className="py-2 px-4 bg-indigo-500 hover:bg-indigo-450 text-xs font-bold rounded-lg text-white transition"
                    >
                      Next Block
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => {
    if (courseXP < 0) {
      alert("To start Phase 1, you need at least 0 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!");
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
              className="flex items-center gap-1 py-2.5 px-6 bg-cyan-500 hover:bg-cyan-450 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Production
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 4: ACTIVITY 2: READ & REPEAT SIMPLE WORDS */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Activity 2: Production & rhythm timing
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Repeat Words, Verify Phoneme Scores, and Rhythm</h2>
          </div>

          {/* Activity 2A: Word Recognition */}
          {wrItems.length > 0 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part A: Match audio to word</span>
                <span>Word {wrIdx + 1} of {wrItems.length}</span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => playAudio(wrItems[wrIdx]?.word)}
                  className="p-3 bg-cyan-500/20 text-cyan-300 rounded-full hover:bg-cyan-500/30 transition border border-cyan-500/30 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                </button>
                <span className="text-xs text-zinc-400">Listen to the word, select Hangeul match below:</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {wrItems[wrIdx]?.options?.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !wrChecked && setWrSelected(opt)}
                    className={`py-3 px-4 rounded-xl text-xs font-semibold border transition text-left ${
                      wrSelected === opt 
                        ? "border-cyan-500 bg-cyan-500/10 text-white" 
                        : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
                    } ${wrChecked && opt === wrItems[wrIdx].correct ? "border-green-500 bg-green-500/10 text-white" : ""}`}
                    disabled={wrChecked}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {wrChecked && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${wrCorrect ? "bg-green-950/20 border-green-900 text-green-350" : "bg-red-950/20 border-red-900 text-red-350"}`}>
                  <strong>{wrCorrect ? "Correct!" : "Incorrect."}</strong> {wrGloss}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!wrChecked ? (
                  <button
                    onClick={handleCheckWr}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-750 text-xs font-bold rounded-lg text-zinc-200 transition"
                    disabled={!wrSelected}
                  >
                    Check Word
                  </button>
                ) : (
                  wrIdx < wrItems.length - 1 && (
                    <button
                      onClick={handleNextWr}
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition"
                    >
                      Next Word
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Activity 2B: Listen, Read, Repeat */}
          {wpItems.length > 0 && wrChecked && wrIdx === wrItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part B: Repeat and Get Syllable Score</span>
                <span>Card {wpIdx + 1} of {wpItems.length}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Target Word:</span>
                <span className="text-xl font-extrabold text-cyan-400 tracking-wider hover:underline cursor-pointer" onClick={() => playAudio(wpItems[wpIdx].word)}>
                  {wpItems[wpIdx].word}
                </span>
              </div>

              <div className="flex justify-center gap-4 py-2 border-y border-white/5">
                {wpItems[wpIdx].syllables.map((syl: string) => {
                  const status = wpSyllableScores[syl];
                  let color = "bg-zinc-800 text-zinc-400";
                  if (wpEvaluated) {
                    color = status === "OK" ? "bg-green-500/20 text-green-300 border-green-500/50" : "bg-orange-500/20 text-orange-300 border-orange-500/50";
                  }
                  return (
                    <div key={syl} className={`px-4 py-2 rounded-xl border font-bold text-center text-sm ${color}`}>
                      <div>{syl}</div>
                      {wpEvaluated && <div className="text-[9px] mt-0.5 uppercase tracking-wider">{status === "OK" ? "✓ OK" : "⚠ Lip Round"}</div>}
                    </div>
                  );
                })}
              </div>

              {wpEvaluated && (
                <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Segmental Accuracy Score:</span>
                    <span className="font-bold text-cyan-400 text-sm">{wpScore}%</span>
                  </div>
                  <p className="text-[11px] text-zinc-350">{wpTip}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  onClick={handleRecordWp}
                  className={`flex items-center gap-1.5 py-2.5 px-6 rounded-xl font-bold transition text-xs cursor-pointer ${
                    recording 
                      ? "bg-red-500 text-white animate-pulse" 
                      : "bg-cyan-500 text-zinc-950 hover:bg-cyan-450"
                  }`}
                  disabled={recording}
                >
                  <Mic className="w-3.5 h-3.5" />
                  {recording ? "Recording (Speak)..." : "Listen & Record"}
                </button>
                {wpEvaluated && wpIdx < wpItems.length - 1 && (
                  <button
                    onClick={handleNextWp}
                    className="py-2.5 px-5 bg-teal-500 text-white font-bold rounded-xl text-xs hover:bg-teal-450 transition cursor-pointer"
                  >
                    Next Word
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity 2C: Metronome Timing */}
          {rhythmItems.length > 0 && wpEvaluated && wpIdx === wpItems.length - 1 && (
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                <span>Part C: Beat the Metronome</span>
                <span>Phrase {rhythmIdx + 1} of {rhythmItems.length}</span>
              </div>

              <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-white/5">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold mb-1">Rhythm Target ({rhythmItems[rhythmIdx].beats} beats):</span>
                  <span className="text-lg font-black text-cyan-300">{rhythmItems[rhythmIdx].phrase}</span>
                </div>
                <div className={`p-3 rounded-full border transition ${metronomePlaying ? "bg-indigo-500/20 text-indigo-300 border-indigo-400 animate-ping" : "bg-zinc-800 text-zinc-500 border-zinc-700"}`}>
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              {rhythmEvaluated && (
                <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Rhythm & Tempo Match:</span>
                    <span className="font-bold text-teal-400 text-sm">{rhythmScore}%</span>
                  </div>
                  <p className="text-[11px] text-zinc-350">{rhythmFeedback}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  onClick={handleRecordRhythm}
                  className={`flex items-center gap-1.5 py-2.5 px-6 rounded-xl font-bold transition text-xs cursor-pointer ${
                    metronomePlaying 
                      ? "bg-indigo-600 text-white animate-pulse" 
                      : recording 
                        ? "bg-red-500 text-white animate-pulse" 
                        : "bg-cyan-500 text-zinc-950 hover:bg-cyan-450"
                  }`}
                  disabled={metronomePlaying || recording}
                >
                  <Activity className="w-3.5 h-3.5" />
                  {metronomePlaying ? "Listen to Metronome Beats..." : recording ? "Speaking (Follow tempo)..." : "Start timed recording"}
                </button>
                {rhythmEvaluated && rhythmIdx < rhythmItems.length - 1 && (
                  <button
                    onClick={handleNextRhythm}
                    className="py-2.5 px-5 bg-teal-500 text-white font-bold rounded-xl text-xs hover:bg-teal-450 transition cursor-pointer"
                  >
                    Next Phrase
                  </button>
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
              className="flex items-center gap-1 py-2.5 px-6 bg-cyan-500 hover:bg-cyan-450 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Quiz
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 5: MINI QUIZ */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Mini-Quiz: Sound Foundations Check
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Test your A1 Listening & rhythm skills</h2>
          </div>

          {quizScore === null ? (
            quizBlueprint.length > 0 ? (
              <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Question {quizIdx + 1} of {quizBlueprint.length}</span>
                  <span className="text-cyan-400 font-bold">{Math.round((quizIdx / quizBlueprint.length) * 100)}% Complete</span>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-bold text-zinc-250 leading-relaxed">
                    {quizBlueprint[quizIdx]?.question}
                  </p>
                  
                  {/* Option Grid */}
                  <div className="grid grid-cols-1 gap-2 pt-2">
                    {quizBlueprint[quizIdx]?.options?.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !quizChecked && setQuizSelected(opt)}
                        className={`py-3.5 px-4 rounded-xl text-xs font-semibold border transition text-left ${
                          quizSelected === opt 
                            ? "border-cyan-500 bg-cyan-500/10 text-white" 
                            : "border-white/5 bg-zinc-900 text-zinc-350 hover:bg-slate-800"
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

                  <div className="flex justify-end gap-2">
                    {!quizChecked ? (
                      <button
                        onClick={handleCheckQuizAnswer}
                        className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-200 transition"
                        disabled={!quizSelected}
                      >
                        Check Answer
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuiz}
                        className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-450 text-xs font-bold rounded-lg text-white transition"
                      >
                        {quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Finish Quiz"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-cyan-450 animate-spin" />
              </div>
            )
          ) : (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-4 text-center">
              <Award className="w-12 h-12 text-cyan-450 mx-auto" />
              <div>
                <h3 className="font-extrabold text-lg text-white">Quiz Completed!</h3>
                <p className="text-xs text-zinc-400 mt-1">Final Score: <span className="text-cyan-400 font-bold text-sm">{quizScore}%</span></p>
              </div>

              {quizScore >= 80 ? (
                <div className="bg-green-950/20 border border-green-900/50 p-4 rounded-xl text-xs text-green-300 leading-relaxed max-w-sm mx-auto">
                  🎉 Fantastic! You achieved A1 Pronunciation & Sound recognition mastery. Continue to Homework for final coach evaluation.
                </div>
              ) : (
                <div className="bg-orange-950/20 border border-orange-900/50 p-4 rounded-xl text-xs text-orange-300 leading-relaxed max-w-sm mx-auto">
                  Needs review. Try aiming for 80% score to gain sound foundations certificate. You can retry anytime.
                </div>
              )}

              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={handleRestartQuiz}
                  className="flex items-center gap-1 px-4 py-2 bg-zinc-900 border border-white/5 hover:bg-slate-800 rounded-lg text-xs font-bold text-zinc-300 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retry Quiz
                </button>
                <button
                  onClick={() => setStep(6)}
                  className="px-5 py-2 bg-cyan-500 text-zinc-950 hover:bg-cyan-450 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Proceed to Homework
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(4)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button 
              onClick={() => setStep(6)}
              className="flex items-center gap-1 py-2.5 px-6 bg-cyan-500 hover:bg-cyan-450 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Proceed to Homework
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 6: HOMEWORK & COACH */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
              Homework & AI Pronunciation Coach
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">Record Reading Checklist & Submit for Coach Heatmap</h2>
          </div>

          <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4 text-xs">
            <h3 className="font-bold text-zinc-200 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Homework Task Lists
            </h3>
            <ul className="space-y-2 text-zinc-350 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="p-0.5 bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 rounded mt-0.5">1</span>
                <span>Word list reading: Record reading A1 terms (물, 학교, 친구, 한국, 이름, 커피, 사과, 책, 시간, 영화).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="p-0.5 bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 rounded mt-0.5">2</span>
                <span>Self-introduction preparation: Record 8-10 keywords you will use in self-introduction (name, age, country, hobbies).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="p-0.5 bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 rounded mt-0.5">3</span>
                <span>Mini phrase reading: Record 3 short greeting phrases (안녕하세요, 감사합니다, 이거 뭐예요?).</span>
              </li>
            </ul>

            <div className="border-t border-white/5 pt-4 space-y-3">
              <p className="text-zinc-400 font-semibold">Type target sentences below for AI phonetic Coach evaluation:</p>
              <div className="space-y-2">
                {hwSents.map((s, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={s}
                    onChange={(e) => handleHwChange(idx, e.target.value)}
                    placeholder={`Phrase ${idx + 1} (e.g. 안녕하세요, 감사합니다, 학교예요...)`}
                    className="w-full bg-zinc-900 border border-white/5 p-2.5 rounded-xl text-white placeholder-slate-500 text-xs focus:border-cyan-500 outline-none"
                    disabled={submittingHw || !!hwFeedback}
                  />
                ))}
              </div>
            </div>

            {hwFeedback && (
              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-3 animate-fade-in">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">AI Coach Phone Alignment Score:</span>
                  <span className="font-bold text-cyan-400">{hwFeedback.overall_score}%</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-bold">Phonetic Heatmap:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(hwFeedback.feedback_heatmap).map(([wd, color]) => {
                      const colorClass = color === "green" ? "bg-green-500/10 text-green-300 border-green-500/20" : "bg-amber-500/10 text-amber-300 border-amber-500/20";
                      return (
                        <span key={wd} className={`px-2 py-1 border text-xs font-mono rounded ${colorClass}`}>{wd}</span>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[11px] text-zinc-350 space-y-1">
                  <span className="font-bold text-zinc-200">🔍 Suggested Focus Sounds:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                    {hwFeedback.focus_sounds.map((sound: string, i: number) => <li key={i}>{sound}</li>)}
                  </ul>
                  <p className="mt-1 font-mono text-[10px] text-zinc-450">{hwFeedback.recommendation}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              {!hwFeedback ? (
                <button
                  onClick={handleSubmitHomework}
                  className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-450 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  disabled={submittingHw || hwSents.every(s => !s.trim())}
                >
                  {submittingHw ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
                  Check My Pronunciation
                </button>
              ) : (
                <button
                  onClick={() => setHwFeedback(null)}
                  className="py-2 px-4 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 rounded-lg transition cursor-pointer"
                >
                  Reset Coach Input
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => setStep(5)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button 
              onClick={handleCompleteLab}
              className="flex items-center gap-1 py-2.5 px-6 bg-green-500 hover:bg-green-450 text-white font-bold rounded-xl transition cursor-pointer shadow-lg shadow-green-500/20"
              disabled={completingLab}
            >
              {completingLab ? "Completing..." : "Complete Sound Lab 1"}
              <Check className="w-4 h-4" />
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
