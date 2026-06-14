"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2, Sparkles, BookOpen, BrainCircuit, Award, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface Phase3SyllableBlocksWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Phase3SyllableBlocksWizard({ activeLesson, speakWord, onComplete }: Phase3SyllableBlocksWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);
  
  // Step 2: Concept Content & Visualizer State
  const [content, setContent] = useState<any>(null);
  const [vizInitial, setVizInitial] = useState("ㄱ");
  const [vizVowel, setVizVowel] = useState("ㅏ");
  const [vizFinal, setVizFinal] = useState("");

  // Step 3: Composition (Build blocks)
  const [composeQuestions, setComposeQuestions] = useState<any[]>([]);
  const [composeIdx, setComposeIdx] = useState(0);
  const [buildSlots, setBuildSlots] = useState({ initial: "", vowel: "", final: "" });
  const [composeChecked, setComposeChecked] = useState(false);
  const [composeCorrect, setComposeCorrect] = useState<boolean | null>(null);

  // Step 4: Decomposition
  const [decomposeQuestions, setDecomposeQuestions] = useState<any[]>([]);
  const [decomposeIdx, setDecomposeIdx] = useState(0);
  const [decSelected, setDecSelected] = useState({ initial: "", vowel: "", final: "" });
  const [decomposeChecked, setDecomposeChecked] = useState(false);
  const [decomposeCorrect, setDecomposeCorrect] = useState<boolean | null>(null);

  // Step 5: Syllables Read & Listen
  const [syllableReadList, setSyllableReadList] = useState<any[]>([]);
  const [readIdx, setReadIdx] = useState(0);
  const [showVowelHint, setShowVowelHint] = useState(false);
  const [listenQuestions, setListenQuestions] = useState<any[]>([]);
  const [listenIdx, setListenIdx] = useState(0);
  const [listenSelected, setListenSelected] = useState<string | null>(null);
  const [listenChecked, setListenChecked] = useState(false);
  const [listenCorrect, setListenCorrect] = useState<boolean | null>(null);
  const [syllableSubMode, setSyllableSubMode] = useState<"read" | "listen">("read");

  // Step 6: Words Reading
  const [wordData, setWordData] = useState<any>(null);
  const [wordIdx, setWordIdx] = useState(0);
  const [showWordMeaning, setShowWordMeaning] = useState(false);
  const [matchingSelections, setMatchingSelections] = useState<Record<string, string>>({});
  const [dictationWriting, setDictationWriting] = useState("");
  const [dictationChecked, setDictationChecked] = useState(false);
  const [dictationCorrect, setDictationCorrect] = useState<boolean | null>(null);
  const [wordSubMode, setWordSubMode] = useState<"cards" | "matching" | "dictation">("cards");

  // Step 7: Mini-Quiz
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

  // Step 8: Recommendations
  const [recommendations, setRecommendations] = useState<any>(null);

  // Fetch Step Data Dynamically
  useEffect(() => {
    const loadStepData = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiRequest("/lessons/lesson/phase3/metadata");
          setMetadata(res);
        } else if (step === 2 && !content) {
          const res = await apiRequest("/lessons/lesson/phase3/content");
          setContent(res);
        } else if (step === 3 && composeQuestions.length === 0) {
          const res = await apiRequest("/lessons/practice/blocks/compose");
          setComposeQuestions(res || []);
        } else if (step === 4 && decomposeQuestions.length === 0) {
          const res = await apiRequest("/lessons/practice/blocks/decompose");
          setDecomposeQuestions(res || []);
        } else if (step === 5) {
          if (syllableReadList.length === 0) {
            const res = await apiRequest("/lessons/practice/syllables/read");
            setSyllableReadList(res || []);
          }
          if (listenQuestions.length === 0) {
            // Reusing visual/listening formats
            const res = await apiRequest("/lessons/practice/consonants/listening");
            setListenQuestions(res || []);
          }
        } else if (step === 6 && !wordData) {
          const res = await apiRequest("/lessons/practice/words/reading-basic");
          setWordData(res);
        } else if (step === 8 && !recommendations) {
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
    // In a fully featured frontend, we would run a layout engine. 
    // Here we can fetch or display a composite representation or standard characters.
    if (initial === "ㄱ" && vowel === "ㅏ" && final === "") return "가";
    if (initial === "ㄱ" && vowel === "ㅗ" && final === "") return "고";
    if (initial === "ㄱ" && vowel === "ㅏ" && final === "ㅁ") return "감";
    if (initial === "ㅅ" && vowel === "ㅗ" && final === "ㄴ") return "손";
    if (initial === "ㅂ" && vowel === "ㅏ" && final === "ㅂ") return "밥";
    if (initial === "ㅈ" && vowel === "ㅣ" && final === "ㅂ") return "집";
    
    // Fallbacks to showing layout
    return `${initial}${vowel}${final}`;
  };

  const handleCheckCompose = async () => {
    const currentQ = composeQuestions[composeIdx];
    if (!currentQ) return;
    const isCorrect = buildSlots.initial === currentQ.target_parts.initial &&
                      buildSlots.vowel === currentQ.target_parts.vowel &&
                      buildSlots.final === currentQ.target_parts.final;
    setComposeChecked(true);
    setComposeCorrect(isCorrect);
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
  };

  const handleCheckDictation = async () => {
    if (!wordData) return;
    const currentQ = wordData.dictation[0]; // test dictation
    if (!currentQ) return;
    const isCorrect = dictationWriting.trim() === currentQ.word.trim();
    setDictationChecked(true);
    setDictationCorrect(isCorrect);
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
    if (!isCorrect) {
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
              <span>{activeLesson?.title || "Hangeul Syllable Blocks & Reading"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: {activeLesson?.topic || "Syllable block structures"}</p>
          </div>
        </div>
        
        {/* Active progress bar */}
        <div className="flex items-center space-x-4">
          <div className="w-32 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 rounded-full transition-all duration-500" 
              style={{ width: `${(step / 8) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 font-bold">{Math.round((step / 8) * 100)}%</span>
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
          <h2 className="text-4xl font-black text-white">Hangeul 0.3</h2>
          <h3 className="text-xl font-bold text-brand-400 mt-1">Syllable Blocks & Reading</h3>
          <p className="text-zinc-300 text-sm leading-relaxed">
            {metadata?.goals || "Now you'll learn how consonants and vowels fit into square blocks, and start reading small Korean words."}
          </p>
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-2">
            <p><strong>🎯 Objectives:</strong> Master visual block structure, assemble and decompose syllables, read native/loanwords.</p>
            <p><strong>📋 Prerequisites:</strong> Phase 1 (vowels) & Phase 2 (consonants) completed.</p>
          </div>
          <button 
            onClick={() => setStep(2)}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            <span>Start Syllable Blocks</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Screen 2: Concept Explanation */}
      {step === 2 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2 font-sans">
              <BookOpen className="w-5 h-5 text-brand-400" />
              <span>Concept: Block Structures & Vowel Placements</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold font-sans">Step 2 of 8</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-4 text-xs md:text-sm text-zinc-300">
              <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 space-y-2">
                <h4 className="font-extrabold text-white text-sm">Where does the vowel go?</h4>
                <ul className="list-disc list-inside space-y-1.5 pl-1 text-zinc-400">
                  <li><strong>Vertical vowels (ㅏ, ㅓ, ㅣ):</strong> placed to the <strong>RIGHT</strong> of the consonant (e.g. 가, 너).</li>
                  <li><strong>Horizontal vowels (ㅗ, ㅜ, ㅡ):</strong> placed <strong>BELOW</strong> the consonant (e.g. 고, 구).</li>
                  <li><strong>Final consonants (받침):</strong> always positioned at the <strong>BOTTOM</strong> (e.g. 감, 밥).</li>
                </ul>
              </div>
              <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 space-y-1.5 text-zinc-400 text-xs leading-relaxed">
                <p><strong>ㅇ Silent placeholder reminder:</strong> When a syllable starts with a vowel sound, the silent <strong>ㅇ</strong> is written in the initial position (e.g. 아, 우).</p>
              </div>
            </div>

            {/* Interactive Assembly Playground */}
            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 space-y-4 text-center">
              <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Visual Block Visualizer</h3>
              
              <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 inline-flex flex-col items-center justify-center min-w-[120px] min-h-[120px] shadow-inner mb-2">
                <span className="text-[10px] text-zinc-600 font-mono block mb-1">Preview</span>
                <span className="text-4xl font-black text-white">{getRenderedBlock(vizInitial, vizVowel, vizFinal)}</span>
              </div>

              <div className="space-y-2.5 text-left text-xs">
                <div>
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Initial (초성)</span>
                  <div className="flex gap-1.5">
                    {["ㄱ", "ㄴ", "ㄷ", "ㅂ", "ㅅ", "ㅈ"].map(c => (
                      <button 
                        key={c} 
                        onClick={() => setVizInitial(c)} 
                        className={`px-2 py-1 rounded border text-[11px] font-bold ${vizInitial === c ? "border-brand-500 bg-brand-500/10 text-white" : "border-white/5 bg-zinc-900 text-zinc-400"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Vowel (중성)</span>
                  <div className="flex gap-1.5">
                    {["ㅏ", "ㅓ", "ㅣ", "ㅗ", "ㅜ", "ㅡ"].map(v => (
                      <button 
                        key={v} 
                        onClick={() => setVizVowel(v)} 
                        className={`px-2 py-1 rounded border text-[11px] font-bold ${vizVowel === v ? "border-brand-500 bg-brand-500/10 text-white" : "border-white/5 bg-zinc-900 text-zinc-400"}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Final/받침 (종성 - Optional)</span>
                  <div className="flex gap-1.5">
                    {["", "ㅁ", "ㅂ", "ㄴ", "ㄹ"].map(f => (
                      <button 
                        key={f} 
                        onClick={() => setVizFinal(f)} 
                        className={`px-2.5 py-1 rounded border text-[11px] font-bold ${vizFinal === f ? "border-brand-500 bg-brand-500/10 text-white" : "border-white/5 bg-zinc-900 text-zinc-400"}`}
                      >
                        {f === "" ? "None" : f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Next Step <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1 (Composition Builder) */}
      {step === 3 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Activity 1 – Assembly / Composition Drill</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of 8 &bull; Item {composeIdx + 1}/{composeQuestions.length}</span>
          </div>

          {composeQuestions.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full text-center">
              <div>
                <span className="text-xs text-zinc-500 block">Assemble the components for the target sound:</span>
                <h3 className="text-2xl font-black text-white mt-1">"{composeQuestions[composeIdx]?.target_syllable}"</h3>
              </div>

              {/* Target Slots */}
              <div className="flex justify-center gap-4 py-4">
                <div className="p-3 bg-zinc-950/80 border border-white/5 rounded-xl text-center min-w-[70px]">
                  <span className="text-[8px] font-mono text-zinc-500 block uppercase mb-1">Initial</span>
                  <span className="text-xl font-black text-white">{buildSlots.initial || "—"}</span>
                </div>
                <div className="p-3 bg-zinc-950/80 border border-white/5 rounded-xl text-center min-w-[70px]">
                  <span className="text-[8px] font-mono text-zinc-500 block uppercase mb-1">Vowel</span>
                  <span className="text-xl font-black text-white">{buildSlots.vowel || "—"}</span>
                </div>
                <div className="p-3 bg-zinc-950/80 border border-white/5 rounded-xl text-center min-w-[70px]">
                  <span className="text-[8px] font-mono text-zinc-500 block uppercase mb-1">Final</span>
                  <span className="text-xl font-black text-white">{buildSlots.final || "None"}</span>
                </div>
              </div>

              {/* Input Choice Pool */}
              <div className="space-y-3">
                <p className="text-[10px] text-zinc-500">Tap tiles to place them into the slots:</p>
                
                {/* Consonant bank */}
                <div className="flex flex-wrap justify-center gap-1.5">
                  {["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅈ"].map(char => (
                    <button
                      key={char}
                      disabled={composeChecked}
                      onClick={() => {
                        if (!buildSlots.initial) setBuildSlots(prev => ({ ...prev, initial: char }));
                        else setBuildSlots(prev => ({ ...prev, final: char }));
                      }}
                      className="w-10 h-10 bg-zinc-900 hover:bg-zinc-800 border border-white/5 font-black text-white rounded-lg flex items-center justify-center text-sm"
                    >
                      {char}
                    </button>
                  ))}
                </div>

                {/* Vowels bank */}
                <div className="flex flex-wrap justify-center gap-1.5">
                  {["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"].map(char => (
                    <button
                      key={char}
                      disabled={composeChecked}
                      onClick={() => setBuildSlots(prev => ({ ...prev, vowel: char }))}
                      className="w-10 h-10 bg-zinc-900 hover:bg-zinc-800 border border-white/5 font-black text-white rounded-lg flex items-center justify-center text-sm"
                    >
                      {char}
                    </button>
                  ))}
                </div>

                {/* Controls */}
                <button 
                  onClick={() => setBuildSlots({ initial: "", vowel: "", final: "" })}
                  disabled={composeChecked}
                  className="px-3 py-1 bg-zinc-950 text-zinc-500 hover:text-white border border-white/5 rounded-md text-[10px] font-bold flex items-center gap-1 mx-auto mt-2 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Slots</span>
                </button>
              </div>

              {composeChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                  composeCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold">{composeCorrect ? "맞아요! Correct!" : "Incorrect."}</p>
                  <p>Correct parts: {composeQuestions[composeIdx]?.target_parts.initial} + {composeQuestions[composeIdx]?.target_parts.vowel} {composeQuestions[composeIdx]?.target_parts.final ? `+ ${composeQuestions[composeIdx]?.target_parts.final}` : ""}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button onClick={() => setStep(2)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                
                {!composeChecked ? (
                  <button
                    onClick={handleCheckCompose}
                    disabled={!buildSlots.initial || !buildSlots.vowel}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
                        setStep(4);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {composeIdx < composeQuestions.length - 1 ? "Next Block" : "Move to Activity 2"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 4: Activity 2 (Decomposition analysis) */}
      {step === 4 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-400" />
              <span>Activity 2 – Syllable Decomposition</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of 8 &bull; Q {decomposeIdx + 1}/{decomposeQuestions.length}</span>
          </div>

          {decomposeQuestions.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full text-center">
              <div>
                <span className="text-xs text-zinc-500 block">Deconstruct this syllable block into its elements:</span>
                <div className="text-5xl font-black text-white py-3">{decomposeQuestions[decomposeIdx]?.syllable}</div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Initial dropdown selection */}
                <div className="space-y-1 text-left">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Initial (초성)</span>
                  <select 
                    value={decSelected.initial} 
                    onChange={e => setDecSelected(prev => ({ ...prev, initial: e.target.value }))}
                    disabled={decomposeChecked}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-brand-500 text-xs font-bold"
                  >
                    <option value="">-- Choose --</option>
                    {decomposeQuestions[decomposeIdx]?.options.initial.map((o: string) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                {/* Vowel dropdown selection */}
                <div className="space-y-1 text-left">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Vowel (중성)</span>
                  <select 
                    value={decSelected.vowel} 
                    onChange={e => setDecSelected(prev => ({ ...prev, vowel: e.target.value }))}
                    disabled={decomposeChecked}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-brand-500 text-xs font-bold"
                  >
                    <option value="">-- Choose --</option>
                    {decomposeQuestions[decomposeIdx]?.options.vowel.map((o: string) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                {/* Final dropdown selection */}
                <div className="space-y-1 text-left">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Final (종성)</span>
                  <select 
                    value={decSelected.final} 
                    onChange={e => setDecSelected(prev => ({ ...prev, final: e.target.value }))}
                    disabled={decomposeChecked}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-brand-500 text-xs font-bold"
                  >
                    <option value="">None</option>
                    {decomposeQuestions[decomposeIdx]?.options.final.filter((o: string) => o !== "").map((o: string) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              {decomposeChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                  decomposeCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold">{decomposeCorrect ? "Correct!" : "Oops! Incorrect."}</p>
                  <p>Elements: {decomposeQuestions[decomposeIdx]?.correct_parts.initial} + {decomposeQuestions[decomposeIdx]?.correct_parts.vowel} {decomposeQuestions[decomposeIdx]?.correct_parts.final ? `+ ${decomposeQuestions[decomposeIdx]?.correct_parts.final}` : ""}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button onClick={() => setStep(3)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                
                {!decomposeChecked ? (
                  <button
                    onClick={handleCheckDecompose}
                    disabled={!decSelected.initial || !decSelected.vowel}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
                        setStep(5);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {decomposeIdx < decomposeQuestions.length - 1 ? "Next Syllable" : "Move to Activity 3"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 5: Activity 3 (Reading CV/CVC) */}
      {step === 5 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-brand-400" />
              <span>Activity 3 – CV & CVC Syllable Decoder</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 5 of 8</span>
          </div>

          <div className="flex justify-center gap-2 border-b border-white/5 pb-4">
            <button 
              onClick={() => setSyllableSubMode("read")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${syllableSubMode === "read" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
            >
              Stage A: Carousel Reader
            </button>
            <button 
              onClick={() => setSyllableSubMode("listen")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${syllableSubMode === "listen" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
            >
              Stage B: Ear Discrimination
            </button>
          </div>

          {syllableSubMode === "read" ? (
            <div className="space-y-6 max-w-xl mx-auto w-full text-center">
              <h3 className="text-sm font-semibold text-zinc-400">Pronounce the syllable block, then check pronunciation:</h3>
              
              <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-zinc-900/40 space-y-4 max-w-xs mx-auto">
                <div className="text-5xl font-black text-white">{syllableReadList[readIdx]?.syllable}</div>
                <div className="flex justify-center gap-2 pt-2">
                  <button 
                    onClick={() => speakWord(syllableReadList[readIdx]?.syllable)}
                    className="p-2.5 rounded-xl bg-zinc-950 text-brand-400 hover:text-white border border-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Listen Sound</span>
                  </button>
                  <button 
                    onClick={() => setShowVowelHint(!showVowelHint)}
                    className="p-2.5 rounded-xl bg-zinc-950 text-zinc-400 hover:text-white border border-white/5 transition text-xs font-bold"
                  >
                    {showVowelHint ? `Hint: ${syllableReadList[readIdx]?.romanization}` : "Reveal Hint"}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button onClick={() => setStep(4)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                
                <button
                  onClick={() => {
                    setShowVowelHint(false);
                    if (readIdx < syllableReadList.length - 1) {
                      setReadIdx(readIdx + 1);
                    } else {
                      setSyllableSubMode("listen");
                    }
                  }}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {readIdx < syllableReadList.length - 1 ? "Next Syllable" : "Continue to Ear Training"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full text-center">
              <h3 className="text-sm font-semibold text-zinc-400">Listen and select the matching syllable block:</h3>

              <button 
                onClick={() => speakWord(listenQuestions[listenIdx]?.audio_text)}
                className="p-5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-full mx-auto transition flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-8 h-8" />
              </button>

              <div className="grid grid-cols-4 gap-3 pt-3">
                {listenQuestions[listenIdx]?.options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !listenChecked && setListenSelected(opt)}
                    disabled={listenChecked}
                    className={`p-4 rounded-xl font-black text-xl border transition ${
                      listenSelected === opt
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                    } ${listenChecked && opt === listenQuestions[listenIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10 text-white" : ""}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {listenChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                  listenCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold">{listenCorrect ? "Correct!" : "Oops! Incorrect."}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button onClick={() => setSyllableSubMode("read")} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                
                {!listenChecked ? (
                  <button
                    onClick={handleCheckListen}
                    disabled={!listenSelected}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
                        setStep(6);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {listenIdx < listenQuestions.length - 1 ? "Next Item" : "Move to Activity 4"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 6: Activity 4 (Simple Words) */}
      {step === 6 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-400" />
              <span>Activity 4 – Simple Word Decoder</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of 8</span>
          </div>

          <div className="flex justify-center gap-2 border-b border-white/5 pb-4">
            <button 
              onClick={() => setWordSubMode("cards")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${wordSubMode === "cards" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
            >
              Native & Loanwords
            </button>
            <button 
              onClick={() => setWordSubMode("matching")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${wordSubMode === "matching" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
            >
              Match Word meanings
            </button>
            <button 
              onClick={() => setWordSubMode("dictation")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${wordSubMode === "dictation" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
            >
              Word dictations
            </button>
          </div>

          {!wordData ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full text-center">
              {/* Stage A: Cards */}
              {wordSubMode === "cards" && (
                <div className="space-y-4">
                  <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-zinc-900/40 space-y-4 max-w-xs mx-auto">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Vocabulary card {wordIdx + 1}</span>
                    <div className="text-4xl font-black text-white">{wordData.words[wordIdx]?.word}</div>
                    
                    <div className="flex justify-center gap-2 pt-2">
                      <button 
                        onClick={() => speakWord(wordData.words[wordIdx]?.word)}
                        className="p-2.5 rounded-xl bg-zinc-950 text-brand-400 hover:text-white border border-white/5 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Speak</span>
                      </button>
                      <button 
                        onClick={() => setShowWordMeaning(!showWordMeaning)}
                        className="p-2.5 rounded-xl bg-zinc-950 text-zinc-400 hover:text-white border border-white/5 transition text-xs font-bold"
                      >
                        {showWordMeaning ? `Glosses: ${wordData.words[wordIdx]?.meaning} (${wordData.words[wordIdx]?.romanization})` : "Reveal Meaning"}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <button onClick={() => setStep(5)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                    
                    <button
                      onClick={() => {
                        setShowWordMeaning(false);
                        if (wordIdx < wordData.words.length - 1) {
                          setWordIdx(wordIdx + 1);
                        } else {
                          setWordSubMode("matching");
                        }
                      }}
                      className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      {wordIdx < wordData.words.length - 1 ? "Next Word" : "Continue to Matching"}
                    </button>
                  </div>
                </div>
              )}

              {/* Stage B: Matching */}
              {wordSubMode === "matching" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-400">Match the following Korean words to their English meaning:</h3>
                  <div className="grid grid-cols-2 gap-4 text-left max-w-sm mx-auto">
                    {wordData.matching.map((item: any) => (
                      <div key={item.ko} className="p-3 bg-zinc-950 rounded-xl border border-white/5 flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{item.ko}</span>
                        <select
                          value={matchingSelections[item.ko] || ""}
                          onChange={e => setMatchingSelections(prev => ({ ...prev, [item.ko]: e.target.value }))}
                          className="bg-zinc-900 border border-white/10 text-xs text-zinc-300 rounded p-1"
                        >
                          <option value="">-- Select --</option>
                          <option value="tree">tree</option>
                          <option value="head">head</option>
                          <option value="bus">bus</option>
                          <option value="friend">friend</option>
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <button onClick={() => setWordSubMode("cards")} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                    
                    <button
                      onClick={() => setWordSubMode("dictation")}
                      className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      Continue to Dictation
                    </button>
                  </div>
                </div>
              )}

              {/* Stage C: Dictation */}
              {wordSubMode === "dictation" && (
                <div className="space-y-5 text-center">
                  <h3 className="text-sm font-semibold text-zinc-400">Listen to the word and type it in Hangeul:</h3>
                  
                  <button 
                    onClick={() => speakWord(wordData.dictation[0]?.audio_text)}
                    className="p-5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-full mx-auto transition flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Volume2 className="w-8 h-8" />
                  </button>

                  <input
                    type="text"
                    value={dictationWriting}
                    onChange={e => setDictationWriting(e.target.value)}
                    placeholder="Type the word (e.g. 버스)"
                    className="w-full bg-zinc-900/60 p-4 rounded-xl border border-white/10 outline-none focus:border-brand-500 text-center font-sans text-lg text-white max-w-xs mx-auto"
                    disabled={dictationChecked}
                    onKeyDown={e => e.key === "Enter" && !dictationChecked && handleCheckDictation()}
                  />

                  {dictationChecked && (
                    <div className={`p-4 rounded-xl border text-xs text-left max-w-xs mx-auto ${
                      dictationCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                    }`}>
                      <p className="font-extrabold">{dictationCorrect ? "Correct!" : "Oops! Incorrect."}</p>
                      <p>Correct word: {wordData.dictation[0]?.word} ({wordData.dictation[0]?.meaning})</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <button onClick={() => setWordSubMode("matching")} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                    
                    {!dictationChecked ? (
                      <button
                        onClick={handleCheckDictation}
                        disabled={!dictationWriting.trim()}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Check Spelling
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setDictationChecked(false);
                          setDictationCorrect(null);
                          setDictationWriting("");
                          setStep(7);
                        }}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        Move to Checkpoint
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Screen 7: Mini-Quiz (Checkpoint) */}
      {step === 7 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-400" />
              <span>Step 7 – Mini‑Quiz (Phase 3 Checkpoint)</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of 8</span>
          </div>

          {quizQuestions.length === 0 ? (
            <div className="text-center py-10 max-w-sm mx-auto space-y-6">
              <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400">
                <BrainCircuit className="w-10 h-10 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Generate Phase 3 Checkpoint</h3>
                <p className="text-xs text-zinc-500 mt-1">Select standard static checkpoint questions, or dynamically generate a custom quiz via Gwan-Sik using Llama AI on demand.</p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
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
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-bold py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer"
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
                  className="w-full bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow shadow-brand-500/20 cursor-pointer"
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
                <span>Level: Syllables & Words</span>
              </div>

              <h3 className="text-lg font-black text-white text-center leading-relaxed">
                {quizQuestions[quizIdx]?.question}
              </h3>

              {quizQuestions[quizIdx]?.type === "choice" ? (
                <div className="grid grid-cols-2 gap-3">
                  {quizQuestions[quizIdx]?.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelected(opt)}
                      disabled={quizChecked}
                      className={`p-4 rounded-xl font-black text-sm border transition ${
                        quizSelected === opt
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                      } ${quizChecked && opt === quizQuestions[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10 text-white" : ""}`}
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
                    className="w-full bg-zinc-900/60 p-4 rounded-xl border border-white/10 outline-none focus:border-brand-500 text-center font-sans text-lg text-white"
                    disabled={quizChecked}
                    onKeyDown={(e) => e.key === "Enter" && !quizChecked && handleCheckQuiz()}
                  />
                  {/* keyboard row */}
                  {!quizChecked && (
                    <div className="flex flex-wrap gap-1.5 justify-center bg-zinc-900/30 p-4 rounded-2xl border border-white/5">
                      {["가", "나", "다", "라", "마", "바", "사", "자", "나무", "머리", "친구", "버스", "택시", "커피"].map(char => (
                        <button
                          key={char}
                          onClick={() => setQuizWriting(prev => prev + char)}
                          className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-750 text-xs font-bold text-white rounded-lg border border-white/5"
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
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                  quizCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold">{quizCorrect ? "Correct! Excellent." : "Incorrect."}</p>
                  <p>{quizQuestions[quizIdx]?.explanation}</p>
                  {!quizCorrect && <p className="font-mono mt-1 text-zinc-300">Correct Answer: {quizQuestions[quizIdx]?.correct_answer}</p>}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div />
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={quizQuestions[quizIdx]?.type === "choice" ? !quizSelected : !quizWriting.trim()}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {quizIdx < quizQuestions.length - 1 ? "Next Item" : "See Final Score"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Results View */
            <div className="space-y-6 max-w-xl mx-auto w-full text-center py-6">
              <div className="p-4 bg-zinc-900/60 rounded-3xl border border-white/5 space-y-4">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Syllables Checkpoint Complete</span>
                <h3 className="text-6xl font-black bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">{quizScore}%</h3>
                <p className="text-zinc-300 text-xs leading-normal">
                  {quizScore >= 80 ? "Superb! You have mastered Hangeul blocks and basic words." : "Good attempt! Let's do additional revisions."}
                </p>

                {/* tutor summaries strictly on-demand */}
                <div className="pt-2">
                  {tutorSummary ? (
                    <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/20 text-left text-xs leading-relaxed text-zinc-300">
                      <span className="text-[9px] font-black text-brand-400 block mb-1 uppercase tracking-widest font-sans">Gwan-Sik AI Feedback</span>
                      <p className="font-serif italic font-medium">"{tutorSummary}"</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleGetTutorFeedback}
                      className="bg-zinc-950 hover:bg-zinc-900 border border-brand-500/20 text-brand-400 hover:text-brand-300 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
                      disabled={loadingTutor}
                    >
                      {loadingTutor ? (
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
                    setQuizQuestions([]);
                    setQuizIdx(0);
                    setQuizScore(null);
                    setQuizMistakes([]);
                    setTutorSummary(null);
                  }} 
                  className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition cursor-pointer"
                >
                  Retake Quiz
                </button>
                <button 
                  onClick={() => setStep(8)} 
                  className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  Go to Homework <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 8: Homework */}
      {step === 8 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center max-w-xl mx-auto">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400">
            <Award className="w-10 h-10 animate-bounce" />
          </div>
          
          <div>
            <h2 className="text-2xl font-black text-white font-sans">Syllable Blocks Complete! 🇰🇷✨</h2>
            <p className="text-zinc-400 text-xs mt-1">You are fully equipped to decode and read basic Hangeul words.</p>
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
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-400 block font-sans">Recommended Tasks:</span>
                <ul className="list-decimal list-inside space-y-1.5 text-zinc-400 pl-1">
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
            className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/20 cursor-pointer"
          >
            <span>Mark Phase 3 complete & continue</span>
            <ChevronRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      )}
    </div>
  );
}
