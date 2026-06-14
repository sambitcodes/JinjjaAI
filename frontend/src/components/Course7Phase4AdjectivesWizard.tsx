"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function apiJson(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const cleanPath = (path.startsWith("/phases/") || path.startsWith("/phase-4/")) ? `/grammar-lab${path}` : path;
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

interface Course7Phase4AdjectivesWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course7Phase4AdjectivesWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course7Phase4AdjectivesWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);

  // Loaded data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1A: Sentence Noun Phrase Match
  const [matchItems, setMatchItems] = useState<any[]>([]);
  const [matchAnswers, setMatchAnswers] = useState<Record<string, string>>({}); // sentence_id -> np
  const [matchChecked, setMatchChecked] = useState(false);
  const [matchCorrect, setMatchCorrect] = useState<boolean | null>(null);
  const [matchFeedback, setMatchFeedback] = useState<string>("");

  // Activity 1B: Position Highlight
  const [posItems, setPosItems] = useState<any[]>([]);
  const [posIdx, setPosIdx] = useState(0);
  const [posSelected, setPosSelected] = useState<string | null>(null);
  const [posChecked, setPosChecked] = useState(false);
  const [posCorrect, setPosCorrect] = useState<boolean | null>(null);
  const [posExplanation, setPosExplanation] = useState("");

  // Activity 1C: Adjective Choice (context)
  const [choiceItems, setChoiceItems] = useState<any[]>([]);
  const [choiceIdx, setChoiceIdx] = useState(0);
  const [choiceSelected, setChoiceSelected] = useState<string | null>(null);
  const [choiceChecked, setChoiceChecked] = useState(false);
  const [choiceCorrect, setChoiceCorrect] = useState<boolean | null>(null);
  const [choiceExplanation, setChoiceExplanation] = useState("");

  // Activity 2A: Predicate to NP
  const [p2npItems, setP2npItems] = useState<any[]>([]);
  const [p2npIdx, setP2npIdx] = useState(0);
  const [p2npInput, setP2npInput] = useState("");
  const [p2npChecked, setP2npChecked] = useState(false);
  const [p2npCorrect, setP2npCorrect] = useState<boolean | null>(null);
  const [p2npExplanation, setP2npExplanation] = useState("");

  // Activity 2B: NP to Predicate
  const [np2pItems, setNp2pItems] = useState<any[]>([]);
  const [np2pIdx, setNp2pIdx] = useState(0);
  const [np2pInput, setNp2pInput] = useState("");
  const [np2pChecked, setNp2pChecked] = useState(false);
  const [np2pCorrect, setNp2pCorrect] = useState<boolean | null>(null);
  const [np2pExplanation, setNp2pExplanation] = useState("");

  // Activity 2C: Extended NP builder
  const [extendedItems, setExtendedItems] = useState<any[]>([]);
  const [extendedIdx, setExtendedIdx] = useState(0);
  const [extendedInput, setExtendedInput] = useState("");
  const [extendedChecked, setExtendedChecked] = useState(false);
  const [extendedCorrect, setExtendedCorrect] = useState<boolean | null>(null);
  const [extendedExplanation, setExtendedExplanation] = useState("");

  // Sandbox State (Screen 2)
  const [sandboxAdj, setSandboxAdj] = useState("크다");
  const [sandboxNoun, setSandboxNoun] = useState("집"); // 집 (house), 음식 (food), 도시 (city), 사람 (person), 개 (dog)

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
          const res = await apiJson("/phases/4/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/4/core-data");
          setCoreData(res);
        } else if (step === 3) {
          if (matchItems.length === 0) {
            const resM = await apiJson("/phase-4/items/match");
            setMatchItems(resM);
          }
          if (posItems.length === 0) {
            const resP = await apiJson("/phase-4/items/position-identify");
            setPosItems(resP);
          }
          if (choiceItems.length === 0) {
            const resC = await apiJson("/phase-4/items/adjective-image");
            setChoiceItems(resC);
          }
        } else if (step === 4) {
          if (p2npItems.length === 0) {
            const resP2 = await apiJson("/phase-4/items/predicate-to-np");
            setP2npItems(resP2);
          }
          if (np2pItems.length === 0) {
            const resNp = await apiJson("/phase-4/items/np-to-predicate");
            setNp2pItems(resNp);
          }
          if (extendedItems.length === 0) {
            const resExt = await apiJson("/phase-4/items/extended-np");
            setExtendedItems(resExt);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const resQ = await apiJson("/phase-4/quiz/start", { method: "POST" });
          setQuizBlueprint(resQ.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const resHw = await apiJson("/phase-4/homework");
          setHomeworkItems(resHw);
        }
      } catch (err) {
        console.error("Error loading Grammar Lab Phase 4:", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  const getSandboxConjugation = () => {
    const adjInfo = coreData?.adjectives?.find((a: any) => a.dictionary === sandboxAdj);
    if (!adjInfo) return null;

    let predicateSentence = "";
    let attributiveNP = "";

    const subjectMarker = ["집", "음식"].includes(sandboxNoun) ? "이" : "가";
    predicateSentence = `${sandboxNoun}${subjectMarker} ${adjInfo.predicate_polite}.`;
    attributiveNP = `${adjInfo.modifier_form} ${sandboxNoun}`;

    return {
      adj: sandboxAdj,
      noun: sandboxNoun,
      predicate: predicateSentence,
      modifier: attributiveNP,
      stem: adjInfo.stem,
      ending: adjInfo.modifier_form
    };
  };

  const handleSelectMatch = (sentenceId: string, npValue: string) => {
    if (matchChecked) return;
    setMatchAnswers(prev => ({ ...prev, [sentenceId]: npValue }));
  };

  const handleCheckMatch = () => {
    let allCorrect = true;
    matchItems.forEach((item: any) => {
      if (matchAnswers[item.id] !== item.np) {
        allCorrect = false;
      }
    });

    setMatchCorrect(allCorrect);
    setMatchChecked(true);
    setMatchFeedback(allCorrect ? "Perfect! All predicate sentences match their modifier noun phrases correctly." : "Some matches are incorrect. Look at the adjectives closely.");
  };

  const handleCheckPosition = async () => {
    const current = posItems[posIdx];
    if (!current || !posSelected) return;
    try {
      const res = await apiJson("/phase-4/items/position-identify/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: posSelected })
      });
      setPosCorrect(res.correct);
      setPosChecked(true);
      setPosExplanation(res.explanation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextPosition = () => {
    setPosSelected(null);
    setPosChecked(false);
    setPosCorrect(null);
    setPosExplanation("");
    if (posIdx < posItems.length - 1) {
      setPosIdx(prev => prev + 1);
    }
  };

  const handleCheckChoice = async () => {
    const current = choiceItems[choiceIdx];
    if (!current || !choiceSelected) return;
    try {
      const res = await apiJson("/phase-4/items/adjective-image/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, selected_option: choiceSelected })
      });
      setChoiceCorrect(res.correct);
      setChoiceChecked(true);
      setChoiceExplanation(res.explanation);
      if (res.correct) {
        playAudio(current.correct);
      }
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

  const handleCheckP2np = async () => {
    const current = p2npItems[p2npIdx];
    if (!current || !p2npInput) return;
    try {
      const res = await apiJson("/phase-4/items/predicate-to-np/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, user_input: p2npInput })
      });
      setP2npCorrect(res.correct);
      setP2npChecked(true);
      setP2npExplanation(res.explanation);
      if (res.correct) {
        playAudio(res.correct_np);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextP2np = () => {
    setP2npInput("");
    setP2npChecked(false);
    setP2npCorrect(null);
    setP2npExplanation("");
    if (p2npIdx < p2npItems.length - 1) {
      setP2npIdx(prev => prev + 1);
    }
  };

  const handleCheckNp2p = async () => {
    const current = np2pItems[np2pIdx];
    if (!current || !np2pInput) return;
    try {
      const res = await apiJson("/phase-4/items/np-to-predicate/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, user_input: np2pInput })
      });
      setNp2pCorrect(res.correct);
      setNp2pChecked(true);
      setNp2pExplanation(res.explanation);
      if (res.correct) {
        playAudio(res.correct_sentence);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextNp2p = () => {
    setNp2pInput("");
    setNp2pChecked(false);
    setNp2pCorrect(null);
    setNp2pExplanation("");
    if (np2pIdx < np2pItems.length - 1) {
      setNp2pIdx(prev => prev + 1);
    }
  };

  const handleCheckExtended = async () => {
    const current = extendedItems[extendedIdx];
    if (!current || !extendedInput) return;
    try {
      const res = await apiJson("/phase-4/items/extended-np/answer", {
        method: "POST",
        body: JSON.stringify({ item_id: current.id, user_input: extendedInput })
      });
      setExtendedCorrect(res.correct);
      setExtendedChecked(true);
      setExtendedExplanation(res.explanation);
      if (res.correct) {
        playAudio(res.correct_np);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextExtended = () => {
    setExtendedInput("");
    setExtendedChecked(false);
    setExtendedCorrect(null);
    setExtendedExplanation("");
    if (extendedIdx < extendedItems.length - 1) {
      setExtendedIdx(prev => prev + 1);
    }
  };

  const handleCheckQuizAnswer = async () => {
    const q = quizBlueprint[quizIdx];
    if (!q || !quizSelected) return;
    try {
      const res = await apiJson("/phase-4/quiz/answer", {
        method: "POST",
        body: JSON.stringify({ question_id: q.id, selected_option: quizSelected })
      });
      setQuizCorrect(res.correct);
      setQuizExplanation(res.explanation);
      setQuizChecked(true);
      if (!res.correct) {
        setQuizMistakes(prev => [...prev, q.id]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextQuiz = async () => {
    if (quizIdx < quizBlueprint.length - 1) {
      setQuizIdx(prev => prev + 1);
      setQuizSelected(null);
      setQuizChecked(false);
      setQuizCorrect(null);
      setQuizExplanation("");
    } else {
      setFinishingQuiz(true);
      try {
        const correctCount = quizBlueprint.length - quizMistakes.length;
        const finalScore = Math.round((correctCount / quizBlueprint.length) * 100);
        await apiJson("/phase-4/quiz/finish", {
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

  const handleHwChange = (index: number, val: string) => {
    const updated = [...hwSents];
    updated[index] = val;
    setHwSents(updated);
  };

  const handleSubmitHomework = async () => {
    setSubmittingHw(true);
    try {
      const res = await apiJson("/phase-4/homework/submit", {
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
      const res = await apiJson("/phase-4/complete", { method: "POST" });
      setCompletionData(res);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingLab(false);
    }
  };

  const sandboxRes = getSandboxConjugation();

  return (
    <div className="flex-grow flex flex-col justify-between max-w-2xl mx-auto w-full font-sans">
      
      {/* Top Header */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-zinc-900 border border-white/10">
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg flex items-center gap-2">
              <span>{metadata?.title || "Grammar Lab 4"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Descriptive Sentences & Adjectives</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center space-x-4">
          <div className="w-32 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 rounded-full transition-all duration-500" 
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 font-bold">{Math.round((step / 6) * 100)}%</span>
          <button 
            onClick={() => setShowOutline(!showOutline)}
            className="text-[10px] bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded transition cursor-pointer"
          >
            {showOutline ? "Hide Outline" : "View Outline"}
          </button>
        </div>
      </header>

      {/* Screen 1: Welcome */}
      {step === 1 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center relative overflow-hidden">
          <div className="absolute -top-1/4 -right-1/4 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="p-3 bg-indigo-500/10 rounded-full border border-indigo-500/25 w-fit mx-auto text-indigo-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          
          <div>
            <h2 className="text-3xl font-black text-white font-sans">{metadata?.title}</h2>
            <h3 className="text-md font-bold text-indigo-400 mt-1">{metadata?.subtitle}</h3>
          </div>
          
          <p className="text-zinc-300 text-sm leading-relaxed max-w-md mx-auto">
            {metadata?.description}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || []).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Est. Lab Time:</strong> {metadata?.estimated_minutes} minutes</p>
            <p><strong>🔗 Recommended Parallel Units:</strong> {metadata?.parallel_units}</p>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => setStep(2)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              <span>Start Adjective Lab</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
          </div>
        </div>
      )}

      {/* Screen 2: Explanation */}
      {step === 2 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Korean Adjectives & Modifiers</span>
          </h2>

          {coreData ? (
            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-1">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Interactive Sandbox</span>
                <div className="grid grid-cols-2 gap-2">
                  <select value={sandboxAdj} onChange={e => setSandboxAdj(e.target.value)} className="bg-zinc-950 border border-white/10 text-xs p-2 rounded text-white">
                    {coreData.adjectives?.map((a: any) => <option key={a.dictionary} value={a.dictionary}>{a.dictionary} ({a.meaning})</option>)}
                  </select>
                  <select value={sandboxNoun} onChange={e => setSandboxNoun(e.target.value)} className="bg-zinc-950 border border-white/10 text-xs p-2 rounded text-white">
                    <option value="집">집 (house)</option>
                    <option value="음식">음식 (food)</option>
                    <option value="도시">도시 (city)</option>
                    <option value="사람">사람 (person)</option>
                    <option value="개">개 (dog)</option>
                  </select>
                </div>
                {sandboxRes && (
                  <div className="bg-zinc-950 p-4 rounded border border-white/5 space-y-2 text-center">
                    <div className="text-xs text-zinc-400">Predicate: <span onClick={() => playAudio(sandboxRes.predicate)} className="text-indigo-400 font-bold hover:underline cursor-pointer">{sandboxRes.predicate}</span></div>
                    <div className="text-xs text-zinc-400">Modifier: <span onClick={() => playAudio(sandboxRes.modifier)} className="text-indigo-400 font-bold hover:underline cursor-pointer">{sandboxRes.modifier}</span></div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Drills */}
      {step === 3 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Activity 1 – Attributive Modifiers</span>
            </h2>
            <span className="text-xs text-zinc-550 font-bold">Step 3/6</span>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {matchItems.length > 0 && (
              <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider block">Part A: Match predicate meaning to noun phrase</span>
                <div className="space-y-3">
                  {matchItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-zinc-300 font-korean">{item.sentence}</span>
                      <select
                        value={matchAnswers[item.id] || ""}
                        onChange={(e) => handleSelectMatch(item.id, e.target.value)}
                        className="bg-zinc-950 border border-white/10 text-xs p-1.5 rounded text-white"
                        disabled={matchChecked}
                      >
                        <option value="">Choose...</option>
                        {matchItems.map((m: any) => <option key={m.id} value={m.np}>{m.np}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                {matchChecked && (
                  <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 text-center">
                    <p className="font-extrabold text-white">{matchCorrect ? "✓ Correct!" : "✗ Some matches are incorrect."}</p>
                    <p className="mt-1">{matchFeedback}</p>
                  </div>
                )}
                <div className="flex justify-end pt-1">
                  {!matchChecked && (
                    <button onClick={handleCheckMatch} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition">Verify Matches</button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(2)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Transform */}
      {step === 4 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Activity 2 – Transformation drills</span>
            </h2>
            <span className="text-xs text-zinc-550 font-bold">Step 4/6</span>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {p2npItems.length > 0 && (
              <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider block">Part A: Conjugate predicate to noun phrase</span>
                <div className="py-2">
                  <p className="text-xs text-zinc-450">Predicate Sentence: <strong>{p2npItems[p2npIdx].predicate_sentence}</strong></p>
                  <p className="text-xs text-zinc-450">English Goal: <strong>{p2npItems[p2npIdx].english}</strong></p>
                </div>
                <input
                  type="text"
                  value={p2npInput}
                  onChange={(e) => setP2npInput(e.target.value)}
                  placeholder="Type noun phrase (e.g. 큰 집)..."
                  className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500 text-sm font-medium"
                  disabled={p2npChecked}
                />
                {p2npChecked && (
                  <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400">
                    <p className="font-extrabold text-white">{p2npCorrect ? "✓ Correct!" : `✗ Incorrect.`}</p>
                    <p className="mt-1">{p2npExplanation}</p>
                  </div>
                )}
                <div className="flex justify-end pt-1">
                  {!p2npChecked ? (
                    <button onClick={handleCheckP2np} disabled={!p2npInput.trim()} className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition">Check</button>
                  ) : (
                    p2npIdx < p2npItems.length - 1 && <button onClick={handleNextP2np} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition">Next Item</button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(3)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Quiz */}
      {step === 5 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-400" />
            <span>Adjective Proficiency Quiz</span>
          </h2>

          {quizBlueprint.length > 0 && quizScore === null && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="flex justify-between text-xs text-zinc-450 border-b border-white/5 pb-2">
                <span>Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span>Mistakes: {quizMistakes.length}</span>
              </div>
              <p className="text-sm font-extrabold text-white">{quizBlueprint[quizIdx]?.question}</p>
              <div className="grid grid-cols-1 gap-2 pt-2">
                {quizBlueprint[quizIdx]?.options?.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => setQuizSelected(opt)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                      quizSelected === opt 
                        ? "border-indigo-500 bg-indigo-500/10 text-white" 
                        : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                    } ${quizChecked && opt === quizBlueprint[quizIdx].correct_answer ? "border-green-500 bg-green-500/10" : ""}`}
                    disabled={quizChecked}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {quizChecked && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400">
                  <p className="font-extrabold text-white">{quizCorrect ? "✓ Correct!" : "✗ Incorrect."}</p>
                  <p className="mt-1">{quizExplanation}</p>
                </div>
              )}
              <div className="flex justify-end pt-2">
                {!quizChecked ? (
                  <button onClick={handleCheckQuizAnswer} disabled={!quizSelected} className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition">Submit</button>
                ) : (
                  <button onClick={handleNextQuiz} className="bg-indigo-550 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition">Next</button>
                )}
              </div>
            </div>
          )}

          {quizScore !== null && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-center space-y-4 max-w-sm mx-auto">
              <Award className="w-12 h-12 text-yellow-500 mx-auto" />
              <h3 className="text-xl font-extrabold text-white font-sans">Quiz Completed!</h3>
              <p className="text-xs text-zinc-400">Score: <strong className="text-white text-base">{quizScore}%</strong></p>
              <div className="flex justify-center gap-2">
                <button onClick={handleRestartQuiz} className="py-2 px-4 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold rounded-xl text-zinc-350 border border-white/5 transition flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> Retry</button>
                <button onClick={() => setStep(6)} className="py-2 px-5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition">Homework</button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-white/5">
            <button onClick={() => setStep(4)} className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm font-medium transition cursor-pointer" disabled={quizScore === null}><ChevronLeft className="w-4 h-4" /> Back</button>
            <div />
          </div>
        </div>
      )}

      {/* Screen 6: Homework */}
      {step === 6 && (
        <div className="glass-panel border border-white/10 p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Homework & Verification</span>
          </h2>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 space-y-2">
              <p className="font-extrabold text-white">Homework Prompts:</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                {homeworkItems.map((hw: any) => (
                  <li key={hw.id}>{hw.text}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5">
              {hwSents.map((sent, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-mono block">SENTENCE {idx + 1}:</label>
                  <input
                    type="text"
                    value={sent}
                    onChange={(e) => handleHwChange(idx, e.target.value)}
                    placeholder="Type Korean sentence..."
                    className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500 text-xs font-medium"
                  />
                </div>
              ))}
              <div className="flex justify-end pt-1">
                <button onClick={handleSubmitHomework} disabled={submittingHw || hwSents.every(s => !s.trim())} className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                  {submittingHw && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Check with AI Tutor
                </button>
              </div>
            </div>

            {hwFeedback.length > 0 && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
                <p className="font-extrabold text-white">Feedback Analysis:</p>
                {hwFeedback.map((fb, fIdx) => (
                  <div key={fIdx} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <p className="text-zinc-350">"{fb.original}"</p>
                    <p className={fb.is_correct ? "text-green-400" : "text-red-400"}>{fb.why}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-gradient-to-r from-zinc-950 via-indigo-500/5 to-zinc-950 p-6 rounded-2xl border border-white/5 text-center space-y-3">
              <Award className="w-8 h-8 text-indigo-400 mx-auto" />
              <h3 className="text-sm font-extrabold text-white">Complete Phase 4</h3>
              {completionData && (
                <p className="text-xs text-green-400">Badge Earned: {completionData.badge}</p>
              )}
              <button onClick={handleCompleteLab} className="py-2.5 px-6 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 mx-auto">
                {completingLab && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Complete Lab & Claim Badge
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 border-t border-white/5">
            <button onClick={() => setStep(5)} className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm font-medium transition cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <div />
          </div>
        </div>
      )}
    </div>
  );
}
