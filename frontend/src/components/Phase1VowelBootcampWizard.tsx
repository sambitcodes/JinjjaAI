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
  BrainCircuit, 
  BookMarked 
} from "lucide-react";
import { apiRequest } from "../lib/api";

interface Phase1VowelBootcampWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Phase1VowelBootcampWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Phase1VowelBootcampWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 8;

  // DB Data loaded dynamically
  const [metadata, setMetadata] = useState<any>(null);

  // Step 3 (Activity 1 - Visual)
  const [visualQuestions, setVisualQuestions] = useState<any[]>([]);
  const [visualIdx, setVisualIdx] = useState(0);
  const [visualChecked, setVisualChecked] = useState(false);
  const [visualCorrect, setVisualCorrect] = useState<boolean | null>(null);
  const [visualSelected, setVisualSelected] = useState<string | null>(null);

  // Step 4 (Activity 2 - Listening)
  const [listeningQuestions, setListeningQuestions] = useState<any[]>([]);
  const [listeningIdx, setListeningIdx] = useState(0);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningCorrect, setListeningCorrect] = useState<boolean | null>(null);
  const [listeningSelected, setListeningSelected] = useState<string | null>(null);

  // Step 5 (Activity 3 - Minimal Pairs)
  const [minPairs, setMinPairs] = useState<any[]>([]);
  const [minPairsIdx, setMinPairsIdx] = useState(0);
  const [minPairsChecked, setMinPairsChecked] = useState(false);
  const [minPairsCorrect, setMinPairsCorrect] = useState<boolean | null>(null);
  const [minPairsSelected, setMinPairsSelected] = useState<string | null>(null);
  const [extraPairsCount, setExtraPairsCount] = useState(0);

  // Step 6 (Activity 4 - Words)
  const [anchorWords, setAnchorWords] = useState<any[]>([]);
  const [anchorIdx, setAnchorIdx] = useState(0);
  const [highlightedVowels, setHighlightedVowels] = useState<string[]>([]);

  // Step 7 (Checkpoint Quiz)
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

  // Step 8 (Recommendations)
  const [recommendations, setRecommendations] = useState<any>(null);

  // Fetch Step Data Dynamically
  useEffect(() => {
    const fetchStepData = async () => {
      try {
        if (step === 1 && !metadata) {
          const data = await apiRequest("/lessons/lesson/phase1/metadata");
          setMetadata(data);
        } else if (step === 3 && visualQuestions.length === 0) {
          const data = await apiRequest("/lessons/practice/vowels/visual");
          setVisualQuestions(data || []);
        } else if (step === 4 && listeningQuestions.length === 0) {
          const data = await apiRequest("/lessons/practice/vowels/listening");
          setListeningQuestions(data || []);
        } else if (step === 5 && minPairs.length === 0) {
          const data = await apiRequest("/lessons/practice/vowels/minimal-pairs");
          setMinPairs(data || []);
        } else if (step === 6 && anchorWords.length === 0) {
          const data = await apiRequest("/lessons/lesson/phase1/anchor-words");
          setAnchorWords(data || []);
        } else if (step === 8 && !recommendations) {
          const data = await apiRequest("/lessons/recommendations/hangeul/phase1");
          setRecommendations(data);
        }
      } catch (err) {
        console.error("Error loading step data:", err);
      }
    };
    fetchStepData();
  }, [step]);

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
    if (!isCorrect) {
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

  return (
    <div className="flex-grow flex flex-col justify-between">
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-zinc-900 border border-white/10">
            <BookOpen className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg flex items-center gap-2">
              <span>{activeLesson?.title || "Hangeul Vowels Bootcamp"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Curated Topic: Vowel sounds & symbols</p>
          </div>
        </div>

        {/* Active progress bar */}
        <div className="flex items-center space-x-4">
          <div className="w-32 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 rounded-full transition-all duration-500" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 font-bold">{Math.round((step / totalSteps) * 100)}%</span>
          <button 
            onClick={() => setShowOutline(!showOutline)}
            className="text-[10px] bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded transition cursor-pointer"
          >
            {showOutline ? "Hide Outline" : "View Outline"}
          </button>
        </div>
      </header>

      {/* Screen 1: Welcome/Overview */}
      {step === 1 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center max-w-xl mx-auto">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          <h2 className="text-4xl font-black text-white">Hangeul 0.1</h2>
          <h3 className="text-xl font-bold text-brand-400 mt-1">Vowel Bootcamp</h3>
          <p className="text-zinc-300 text-sm leading-relaxed">
            {metadata?.description || "Today you'll learn Korean vowels: how they look, how they sound, and how to hear the difference. We will go through concept explanations, visual drills, listening challenges, minimal pair ear training, and real word vowel mapping."}
          </p>
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-2">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Recognize 11 simple vowels & double vowels",
                "Master mouth alignments and pronunciation nuances"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 20} minutes</p>
            <p><strong>📋 Prerequisites:</strong> {metadata?.prerequisites || "None (True Beginner)"}</p>
          </div>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button 
              onClick={() => setStep(2)}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 1</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
          </div>

          {showOutline && (
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-1.5 animate-fade-in max-w-md mx-auto w-full font-mono">
              <p className="font-extrabold text-white text-center pb-2">Phase Activities Outline</p>
              <p>✓ Activity 1 – Vowels Sound & Mouth Shapes Charts</p>
              <p>✓ Activity 2 – Visual Symbol Recognition Checks</p>
              <p>✓ Activity 3 – Ear Training Sound Recognition</p>
              <p>✓ Activity 4 – Minimal Pairs Acoustic Alignments</p>
              <p>✓ Activity 5 – Vowels Mapping in Real Words</p>
              <p>✓ Activity 6 – Phase Graduation Checkpoint Quiz</p>
            </div>
          )}
        </div>
      )}

      {/* Screen 2: Concept Explanation */}
      {step === 2 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2 font-sans">
              <BookOpen className="w-5 h-5 text-brand-400" />
              <span>Concept Explanation</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold font-sans">Step 2 of {totalSteps}</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-4 text-xs md:text-sm text-zinc-300">
              <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 space-y-2">
                <h4 className="font-extrabold text-white text-sm">What is Hangeul?</h4>
                <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-400">
                  <li>Scientific phonetic script invented in 1443 by King Sejong.</li>
                  <li>Symbols represent speech organ positions and sky/earth/humanity.</li>
                  <li>Syllables form blocks combining consonants and vowels.</li>
                </ul>
              </div>

              <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 space-y-2">
                <h4 className="font-extrabold text-white text-sm">Tricky Pairs & Double Vowels</h4>
                <p className="text-zinc-400">
                  <strong>ㅐ (ae) vs ㅔ (e)</strong> sound almost identical in modern spoken Korean. Focus on memorizing the orthographic spelling differences.
                </p>
                <p className="text-zinc-400">
                  Adding a small stroke adds a <strong>y-glide</strong> (e.g. ㅑ [ya], ㅕ [yeo], ㅛ [yo], ㅠ [yu]).
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Vowel Pronunciation Chart</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { s: "ㅏ", h: "a as in father" },
                  { s: "ㅓ", h: "eo as in mother" },
                  { s: "ㅗ", h: "o as in home" },
                  { s: "ㅜ", h: "u as in boot" },
                  { s: "ㅡ", h: "eu (flat throat)" },
                  { s: "ㅣ", h: "i as in meet" },
                  { s: "ㅐ", h: "ae as in care" },
                  { s: "ㅔ", h: "e as in wet" },
                ].map((item) => (
                  <div key={item.s} className="bg-zinc-955 p-3 rounded-xl border border-white/5 flex items-center justify-between group hover:border-brand-500/20 transition">
                    <div>
                      <span className="text-lg font-black text-white block">{item.s}</span>
                      <span className="text-[10px] text-zinc-500 font-semibold">{item.h}</span>
                    </div>
                    <button 
                      onClick={() => speakWord(item.s)}
                      className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Next Step <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1 – Visual Recognition */}
      {step === 3 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Activity 1 – Visual Recognition</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps} &bull; Q {visualIdx + 1}/{visualQuestions.length || 6}</span>
          </div>

          {visualQuestions.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <h3 className="text-lg font-extrabold text-white text-center">
                {visualQuestions[visualIdx]?.question}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {visualQuestions[visualIdx]?.options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !visualChecked && setVisualSelected(opt)}
                    disabled={visualChecked}
                    className={`p-4 rounded-xl font-black text-lg border transition ${
                      visualSelected === opt
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                    } ${visualChecked && opt === visualQuestions[visualIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10 text-white" : ""}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {visualChecked && (
                <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                  visualCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold">{visualCorrect ? "맞아요! Correct!" : "Oops! Incorrect."}</p>
                  <p>{visualQuestions[visualIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button onClick={() => setStep(2)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                
                {!visualChecked ? (
                  <button
                    onClick={async () => {
                      if (!visualSelected) return;
                      const isCorrect = visualSelected === visualQuestions[visualIdx]?.correct_answer;
                      setVisualChecked(true);
                      setVisualCorrect(isCorrect);
                      await apiRequest("/lessons/practice/vowels/visual/answer", {
                        method: "POST",
                        body: JSON.stringify({ question_id: visualQuestions[visualIdx]?.id, correct: isCorrect, answer: visualSelected })
                      });
                    }}
                    disabled={!visualSelected}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
                        setStep(4);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {visualIdx < visualQuestions.length - 1 ? "Next Question" : "Move to Activity 2"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 4: Activity 2 – Listening Recognition */}
      {step === 4 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-brand-400" />
              <span>Activity 2 – Listening Recognition</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps} &bull; Q {listeningIdx + 1}/{listeningQuestions.length || 6}</span>
          </div>

          {listeningQuestions.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full text-center">
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Listen and choose the matching symbol</h3>
              
              <button 
                onClick={() => speakWord(listeningQuestions[listeningIdx]?.sound_text)}
                className="p-6 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-full mx-auto transition flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-10 h-10" />
              </button>

              <div className="grid grid-cols-3 gap-3 pt-4">
                {listeningQuestions[listeningIdx]?.options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !listeningChecked && setListeningSelected(opt)}
                    disabled={listeningChecked}
                    className={`p-4 rounded-xl font-black text-xl border transition ${
                      listeningSelected === opt
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                    } ${listeningChecked && opt === listeningQuestions[listeningIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10 text-white" : ""}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {listeningChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                  listeningCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold">{listeningCorrect ? "Correct!" : "Incorrect."}</p>
                  <p>{listeningQuestions[listeningIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button onClick={() => setStep(3)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                
                {!listeningChecked ? (
                  <button
                    onClick={async () => {
                      if (!listeningSelected) return;
                      const isCorrect = listeningSelected === listeningQuestions[listeningIdx]?.correct_answer;
                      setListeningChecked(true);
                      setListeningCorrect(isCorrect);
                      await apiRequest("/lessons/practice/vowels/listening/answer", {
                        method: "POST",
                        body: JSON.stringify({ question_id: listeningQuestions[listeningIdx]?.id, correct: isCorrect, answer: listeningSelected })
                      });
                    }}
                    disabled={!listeningSelected}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Answer
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
                        setStep(5);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {listeningIdx < listeningQuestions.length - 1 ? "Next Question" : "Move to Activity 3"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 5: Activity 3 – Minimal Pairs Ear Training */}
      {step === 5 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-brand-400" />
              <span>Activity 3 – Minimal Pairs Ear Training</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 5 of {totalSteps} &bull; Pair {minPairsIdx + 1}/{minPairs.length || 3}</span>
          </div>

          {minPairs.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full text-center">
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Listen and select which sound you heard</h3>
              
              <button 
                onClick={() => speakWord(minPairs[minPairsIdx]?.audio_text)}
                className="p-6 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full mx-auto transition flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer animate-bounce"
                style={{ animationDuration: "3s" }}
              >
                <Volume2 className="w-10 h-10" />
              </button>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  onClick={() => !minPairsChecked && setMinPairsSelected("left")}
                  disabled={minPairsChecked}
                  className={`p-5 rounded-2xl border text-left space-y-2 transition ${
                    minPairsSelected === "left"
                      ? "border-brand-500 bg-brand-500/10 text-white"
                      : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                  } ${minPairsChecked && minPairs[minPairsIdx]?.correct_side === "left" ? "border-accent-teal bg-accent-teal/10" : ""}`}
                >
                  <span className="text-xs font-mono font-bold text-zinc-500 uppercase">Option A</span>
                  <div className="text-2xl font-black text-white">{minPairs[minPairsIdx]?.pair[0]}</div>
                  <div className="text-[10px] text-zinc-400">{minPairs[minPairsIdx]?.left_hint}</div>
                </button>

                <button
                  onClick={() => !minPairsChecked && setMinPairsSelected("right")}
                  disabled={minPairsChecked}
                  className={`p-5 rounded-2xl border text-left space-y-2 transition ${
                    minPairsSelected === "right"
                      ? "border-brand-500 bg-brand-500/10 text-white"
                      : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                  } ${minPairsChecked && minPairs[minPairsIdx]?.correct_side === "right" ? "border-accent-teal bg-accent-teal/10" : ""}`}
                >
                  <span className="text-xs font-mono font-bold text-zinc-500 uppercase">Option B</span>
                  <div className="text-2xl font-black text-white">{minPairs[minPairsIdx]?.pair[1]}</div>
                  <div className="text-[10px] text-zinc-400">{minPairs[minPairsIdx]?.right_hint}</div>
                </button>
              </div>

              {minPairsChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                  minPairsCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold">{minPairsCorrect ? "Excellent ear alignment!" : "Oops! Keep practicing the phonetic differences."}</p>
                  <p>You heard: <strong>{minPairs[minPairsIdx]?.correct_sound}</strong></p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button onClick={() => setStep(4)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                
                {!minPairsChecked ? (
                  <button
                    onClick={async () => {
                      if (!minPairsSelected) return;
                      const isCorrect = minPairsSelected === minPairs[minPairsIdx]?.correct_side;
                      setMinPairsChecked(true);
                      setMinPairsCorrect(isCorrect);
                      if (!isCorrect) {
                        setExtraPairsCount((prev) => prev + 1);
                      }
                      await apiRequest("/lessons/practice/vowels/minimal-pairs/answer", {
                        method: "POST",
                        body: JSON.stringify({ question_id: minPairs[minPairsIdx]?.id, correct: isCorrect, answer: minPairsSelected })
                      });
                    }}
                    disabled={!minPairsSelected}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Answer
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
                        setStep(6);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {minPairsIdx < minPairs.length - 1 ? "Next Pair" : "Move to Activity 4"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 6: Activity 4 – Vowels in Real Words */}
      {step === 6 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-brand-400" />
              <span>Activity 4 – Vowels in Real Words</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of {totalSteps} &bull; Word {anchorIdx + 1}/{anchorWords.length || 6}</span>
          </div>

          {anchorWords.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full text-center">
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Identify Vowels Inside Anchor Words</h3>
              
              <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/40 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="text-left">
                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Anchor Word</span>
                    <span className="text-3xl font-black text-white">{anchorWords[anchorIdx]?.word}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => speakWord(anchorWords[anchorIdx]?.word)}
                      className="p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-brand-400 hover:text-white transition border border-white/5 cursor-pointer"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                    <div className="text-right">
                      <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Meaning</span>
                      <span className="text-sm font-extrabold text-brand-400">{anchorWords[anchorIdx]?.meaning}</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Task */}
                <div className="space-y-3">
                  <p className="text-xs text-zinc-400">Select the vowels present in this word:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ", "ㅠ"].map((vowel) => {
                      const isPresent = anchorWords[anchorIdx]?.vowels.includes(vowel);
                      const isHighlighted = highlightedVowels.includes(vowel);
                      return (
                        <button
                          key={vowel}
                          onClick={() => {
                            if (isHighlighted) {
                              setHighlightedVowels((prev) => prev.filter((v) => v !== vowel));
                            } else {
                              setHighlightedVowels((prev) => [...prev, vowel]);
                            }
                          }}
                          className={`w-12 h-12 rounded-xl text-lg font-black border transition flex items-center justify-center cursor-pointer ${
                            isHighlighted 
                              ? (isPresent ? "bg-accent-teal/10 border-accent-teal text-accent-teal" : "bg-red-500/10 border-red-500 text-red-400")
                              : "bg-zinc-955 border-white/5 hover:border-white/15 text-zinc-300"
                          }`}
                        >
                          {vowel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button onClick={() => setStep(5)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                
                <button
                  onClick={async () => {
                    setHighlightedVowels([]);
                    if (anchorIdx < anchorWords.length - 1) {
                      setAnchorIdx(anchorIdx + 1);
                    } else {
                      setStep(7);
                    }
                    await apiRequest("/lessons/practice/vowels/words/answer", {
                      method: "POST",
                      body: JSON.stringify({ question_id: `word_${anchorIdx}`, correct: true, answer: "ok" })
                    });
                  }}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {anchorIdx < anchorWords.length - 1 ? "Next Word" : "Move to Mini-Quiz"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 7: Mini‑Quiz (Phase 1 Checkpoint) */}
      {step === 7 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-400" />
              <span>Step 7 – Mini‑Quiz (Phase 1 Checkpoint)</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of {totalSteps}</span>
          </div>

          {phase1Quiz.length === 0 ? (
            <div className="text-center py-10 max-w-sm mx-auto space-y-6">
              <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400">
                <BrainCircuit className="w-10 h-10 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Generate Phase 1 Checkpoint</h3>
                <p className="text-xs text-zinc-500 mt-1">Select standard static checkpoint questions, or dynamically generate a custom quiz via Gwan-Sik using Llama AI on demand.</p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
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
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-bold py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer"
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
                  className="w-full bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow shadow-brand-500/20 cursor-pointer"
                  disabled={loadingQuiz}
                >
                  {loadingQuiz ? <Loader2 className="w-4 h-4 animate-spin text-zinc-950" /> : <Sparkles className="w-4 h-4 text-zinc-950" />}
                  <span>Generate dynamic Quiz via Llama AI</span>
                </button>
              </div>
            </div>
          ) : p1QuizScore === null ? (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="flex justify-between text-xs text-zinc-500 font-mono">
                <span>Quiz Question {p1QuizIdx + 1} of {phase1Quiz.length}</span>
                <span>Level: Beginner</span>
              </div>

              <h3 className="text-lg font-black text-white text-center leading-relaxed">
                {phase1Quiz[p1QuizIdx]?.question}
              </h3>

              {phase1Quiz[p1QuizIdx]?.type === "choice" ? (
                <div className="grid grid-cols-2 gap-3">
                  {phase1Quiz[p1QuizIdx]?.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !p1QuizChecked && setP1QuizSelected(opt)}
                      disabled={p1QuizChecked}
                      className={`p-4 rounded-xl font-black text-base border transition ${
                        p1QuizSelected === opt
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                      } ${p1QuizChecked && opt === phase1Quiz[p1QuizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10 text-white" : ""}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={p1QuizWriting}
                    onChange={(e) => setP1QuizWriting(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full bg-zinc-900/60 p-4 rounded-xl border border-white/10 outline-none focus:border-brand-500 text-center font-sans text-lg text-white"
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
                          className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-750 text-xs font-bold text-white rounded-lg border border-white/5 cursor-pointer"
                        >
                          {char}
                        </button>
                      ))}
                      <button
                        onClick={() => setP1QuizWriting((prev) => prev.slice(0, -1))}
                        className="px-3 py-1.5 bg-red-950/20 text-red-400 hover:bg-red-950/40 text-xs font-bold rounded-lg border border-red-500/10 cursor-pointer"
                      >
                        Del
                      </button>
                    </div>
                  )}
                </div>
              )}

              {p1QuizChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                  p1QuizCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold">{p1QuizCorrect ? "Correct! Excellent." : "Incorrect."}</p>
                  <p>{phase1Quiz[p1QuizIdx]?.explanation}</p>
                  {!p1QuizCorrect && <p className="font-mono mt-1 text-zinc-300">Correct Answer: {phase1Quiz[p1QuizIdx]?.correct_answer}</p>}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button onClick={() => setStep(6)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                {!p1QuizChecked ? (
                  <button
                    onClick={handleCheckP1Quiz}
                    disabled={phase1Quiz[p1QuizIdx]?.type === "choice" ? !p1QuizSelected : !p1QuizWriting.trim()}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {p1QuizIdx < phase1Quiz.length - 1 ? "Next Item" : "See Final Score"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Score Results View */
            <div className="space-y-6 max-w-xl mx-auto w-full text-center py-6">
              <div className="p-4 bg-zinc-900/60 rounded-3xl border border-white/5 space-y-4">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Checkpoint Complete</span>
                <h3 className="text-6xl font-black bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">{p1QuizScore}%</h3>
                <p className="text-zinc-300 text-xs leading-normal">
                  {p1QuizScore >= 80 ? "Superb! You have mastered Hangeul vowels and simple syllables." : "Good attempt! Let's do additional revisions."}
                </p>

                {/* demand trigger Llama tutor feedback summary */}
                <div className="pt-2">
                  {tutorSummary ? (
                    <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/20 text-left text-xs leading-relaxed text-zinc-300">
                      <span className="text-[9px] font-black text-brand-400 block mb-1 uppercase tracking-widest font-sans">Gwan-Sik AI Feedback</span>
                      <p className="font-serif italic font-medium">"{tutorSummary}"</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerateTutorSummary}
                      className="bg-zinc-950 hover:bg-zinc-900 border border-brand-500/20 text-brand-400 hover:text-brand-300 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
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

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button 
                  onClick={() => {
                    setPhase1Quiz([]);
                    setP1QuizIdx(0);
                    setP1QuizScore(null);
                    setP1QuizMistakes([]);
                    setTutorSummary(null);
                  }} 
                  className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition cursor-pointer"
                >
                  Retake Checkpoint
                </button>
                <button 
                  onClick={() => setStep(8)} 
                  className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  Go to homework <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 8: Complete Panel / Recommendations */}
      {step === 8 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center max-w-xl mx-auto">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400">
            <Award className="w-10 h-10 animate-bounce" />
          </div>
          
          <div>
            <h2 className="text-2xl font-black text-white font-sans">Vowels Bootcamp Complete! 🇰🇷✨</h2>
            <p className="text-zinc-400 text-xs mt-1">You are fully equipped to launch your consonant mapping drills next.</p>
          </div>

          {recommendations && (
            <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs space-y-3.5 font-sans leading-relaxed">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-green-400 block mb-0.5 font-sans">Strengths</span>
                <p className="text-zinc-300 font-medium">{recommendations.strength}</p>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-yellow-400 block mb-0.5 font-sans">Focus revisions</span>
                <p className="text-zinc-300 font-medium">{recommendations.weakness}</p>
              </div>
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/[0.03] space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-400 block font-sans">Recommended Practice Tasks:</span>
                <ul className="list-decimal list-inside space-y-1.5 text-zinc-400 pl-1">
                  <li>
                    Search YouTube for: <strong className="text-white select-all">"{recommendations.youtube_search}"</strong> and observe lip alignments.
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
              className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 cursor-pointer"
            >
              <span>Mark Phase 1 complete & continue</span>
              <ChevronRight className="w-4 h-4 text-zinc-950" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
