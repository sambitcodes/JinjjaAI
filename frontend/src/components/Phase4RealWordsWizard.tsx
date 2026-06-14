"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2, Sparkles, BookOpen, Award, Loader2, CheckCircle2, RotateCcw, HelpCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface Phase4RealWordsWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Phase4RealWordsWizard({ activeLesson, speakWord, onComplete }: Phase4RealWordsWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);
  const [content, setContent] = useState<any>(null);

  // Step 3 (Activity 1 - Loanwords)
  const [loanwordList, setLoanwordList] = useState<any[]>([]);
  const [loanwordIdx, setLoanwordIdx] = useState(0);
  const [loanwordSelected, setLoanwordSelected] = useState<string | null>(null);
  const [loanwordChecked, setLoanwordChecked] = useState(false);
  const [loanwordCorrect, setLoanwordCorrect] = useState<boolean | null>(null);
  const [loanwordsMatched, setLoanwordsMatched] = useState<Record<string, string>>({});
  const [selectedLeftLoanword, setSelectedLeftLoanword] = useState<string | null>(null);
  const [loanwordsSubMode, setLoanwordsSubMode] = useState<"guess" | "match">("guess");

  // Step 4 (Activity 2 - Countries & Cities)
  const [ccData, setCcData] = useState<any>(null);
  const [countryIdx, setCountryIdx] = useState(0);
  const [countrySelected, setCountrySelected] = useState<string | null>(null);
  const [countryChecked, setCountryChecked] = useState(false);
  const [countryCorrect, setCountryCorrect] = useState<boolean | null>(null);
  const [ccMatched, setCcMatched] = useState<Record<string, string>>({});
  const [selectedLeftCc, setSelectedLeftCc] = useState<string | null>(null);
  const [ccSubMode, setCcSubMode] = useState<"guess" | "match">("guess");

  // Step 5 (Activity 3 - Names & Transliteration)
  const [namesData, setNamesData] = useState<any>(null);
  const [nameIdx, setNameIdx] = useState(0);
  const [nameSelected, setNameSelected] = useState<string | null>(null);
  const [nameChecked, setNameChecked] = useState(false);
  const [nameCorrect, setNameCorrect] = useState<boolean | null>(null);
  const [namesMatched, setNamesMatched] = useState<Record<string, string>>({});
  const [selectedLeftName, setSelectedLeftName] = useState<string | null>(null);
  
  // Transliteration states
  const [transInput, setTransInput] = useState("");
  const [transResults, setTransResults] = useState<string[]>([]);
  const [transExplanation, setTransExplanation] = useState("");
  const [loadingTrans, setLoadingTrans] = useState(false);
  const [savedName, setSavedName] = useState<string | null>(null);
  
  const [namesSubMode, setNamesSubMode] = useState<"match" | "guess" | "transliterate">("match");

  // Step 6 (Activity 4 - Phrases)
  const [phrasesData, setPhrasesData] = useState<any>(null);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [showPhraseGloss, setShowPhraseGloss] = useState(false);
  const [phraseSelfChecks, setPhraseSelfChecks] = useState<Record<number, string>>({});
  const [phrasesMatched, setPhrasesMatched] = useState<Record<string, string>>({});
  const [selectedLeftPhrase, setSelectedLeftPhrase] = useState<string | null>(null);
  
  // Cloze states
  const [clozeIdx, setClozeIdx] = useState(0);
  const [clozeSelected, setClozeSelected] = useState<string | null>(null);
  const [clozeChecked, setClozeChecked] = useState(false);
  const [clozeCorrect, setClozeCorrect] = useState<boolean | null>(null);
  
  const [phrasesSubMode, setPhrasesSubMode] = useState<"read" | "match" | "cloze">("read");

  // Step 7 (Mini-Quiz)
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

  // Step 8 (Recommendations)
  const [recommendations, setRecommendations] = useState<any>(null);

  // Fetch Step Data Dynamically
  useEffect(() => {
    const loadStepData = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiRequest("/lessons/lesson/phase4/metadata");
          setMetadata(res);
        } else if (step === 2 && !content) {
          const res = await apiRequest("/lessons/lesson/phase4/content");
          setContent(res);
        } else if (step === 3 && loanwordList.length === 0) {
          const res = await apiRequest("/lessons/practice/loanwords/basic");
          setLoanwordList(res || []);
        } else if (step === 4 && !ccData) {
          const res = await apiRequest("/lessons/practice/countries-cities/basic");
          setCcData(res);
        } else if (step === 5 && !namesData) {
          const res = await apiRequest("/lessons/practice/names/basic");
          setNamesData(res);
        } else if (step === 6 && !phrasesData) {
          const res = await apiRequest("/lessons/practice/phrases/basic");
          setPhrasesData(res);
        } else if (step === 8 && !recommendations) {
          const res = await apiRequest("/lessons/recommendations/hangeul/phase4");
          setRecommendations(res);
        }
      } catch (err) {
        console.error("Failed to load Phase 4 step data:", err);
      }
    };
    loadStepData();
  }, [step]);

  // Activity 1 Handlers
  const handleCheckLoanword = async () => {
    const current = loanwordList[loanwordIdx];
    if (!current) return;
    const correct = loanwordSelected === current.correct;
    setLoanwordChecked(true);
    setLoanwordCorrect(correct);
    await apiRequest("/lessons/practice/loanwords/basic/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: current.id, correct, answer: loanwordSelected || "" })
    });
  };

  const handleMatchLoanword = (left: string, right: string) => {
    setLoanwordsMatched(prev => ({
      ...prev,
      [left]: right
    }));
    setSelectedLeftLoanword(null);
  };

  // Activity 2 Handlers
  const handleCheckCountry = async () => {
    if (!ccData) return;
    const current = ccData.countries[countryIdx];
    if (!current) return;
    const correct = countrySelected === current.correct;
    setCountryChecked(true);
    setCountryCorrect(correct);
    await apiRequest("/lessons/practice/countries-cities/basic/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: current.id, correct, answer: countrySelected || "" })
    });
  };

  const handleMatchCc = (left: string, right: string) => {
    setCcMatched(prev => ({
      ...prev,
      [left]: right
    }));
    setSelectedLeftCc(null);
  };

  // Activity 3 Handlers
  const handleCheckName = async () => {
    if (!namesData) return;
    const current = namesData.mcq[nameIdx];
    if (!current) return;
    const correct = nameSelected === current.correct;
    setNameChecked(true);
    setNameCorrect(correct);
    await apiRequest("/lessons/practice/names/basic/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: current.id, correct, answer: nameSelected || "" })
    });
  };

  const handleMatchName = (left: string, right: string) => {
    setNamesMatched(prev => ({
      ...prev,
      [left]: right
    }));
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

  // Activity 4 Handlers
  const handleMatchPhrase = (left: string, right: string) => {
    setPhrasesMatched(prev => ({
      ...prev,
      [left]: right
    }));
    setSelectedLeftPhrase(null);
  };

  const handleCheckCloze = async () => {
    if (!phrasesData) return;
    const current = phrasesData.cloze[clozeIdx];
    if (!current) return;
    const correct = clozeSelected === current.correct;
    setClozeChecked(true);
    setClozeCorrect(correct);
    await apiRequest("/lessons/practice/phrases/basic/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: current.id, correct, answer: clozeSelected || "" })
    });
  };

  // Quiz Handlers
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
    if (!correct) {
      setQuizMistakes(prev => [...prev, current.question]);
    }
  };

  const handleSubmitQuiz = async () => {
    // Calculate score
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
              <span>{activeLesson?.title || "Hangeul Real-Word Reading & Names"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: {activeLesson?.topic || "Real-world Practice"}</p>
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
          <h2 className="text-4xl font-black text-white">Hangeul 0.4</h2>
          <h3 className="text-xl font-bold text-brand-400 mt-1">Real‑Word Reading Bootcamp</h3>
          <p className="text-zinc-300 text-sm leading-relaxed">
            {metadata?.goals || "Practice reading real Korean words: loanwords, countries, cities, and names. Build reading fluency before grammar."}
          </p>
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-2">
            <p><strong>🎯 Objectives:</strong> Recognize common loanwords, identify country and city names, transliterate foreign names, read classroom greetings.</p>
            <p><strong>📋 Prerequisites:</strong> Completion of phases 1–3 is highly recommended.</p>
          </div>
          <button 
            onClick={() => setStep(2)}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            <span>Start Real‑Word Reading</span>
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
              <span>Concept: Sino-Korean, Native & Loanwords</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold font-sans">Step 2 of 8</span>
          </div>

          {!content ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="space-y-4 text-xs md:text-sm text-zinc-300">
                <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 space-y-2">
                  <h4 className="font-extrabold text-white text-sm">Understanding Korean Words Categories</h4>
                  <p className="text-zinc-400 leading-relaxed">
                    Korean vocabulary consists of native Korean words, Sino-Korean words (derived from Chinese characters), and foreign loanwords (mainly English, known as Konglish).
                  </p>
                  <p className="text-zinc-400 leading-relaxed">
                    Reading foreign loanwords (외래어) is a fun way to gain fluency, because when you read them phonetically, you instantly understand the meaning!
                  </p>
                </div>
                <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 space-y-2 text-zinc-400">
                  <h4 className="font-extrabold text-white text-sm">Korean Name Patterns</h4>
                  <p className="leading-relaxed">
                    Korean names usually consist of 3 syllables: Family Name (1 syllable) + Given Name (2 syllables). e.g., <strong>김민수</strong> (Kim Min-su), where <strong>김</strong> is the surname.
                  </p>
                </div>
              </div>

              {/* Sample Cards Playground */}
              <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Example Gloss Cards (Click to Pronounce)</h3>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {content.loanwords.slice(0, 2).map((item: any, idx: number) => (
                    <div 
                      key={idx} 
                      onClick={() => speakWord(item.korean)}
                      className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-xl text-center cursor-pointer transition"
                    >
                      <div className="text-xs text-brand-400 font-mono">Loanword</div>
                      <div className="text-xl font-bold text-white my-1">{item.korean}</div>
                      <div className="text-xs text-zinc-400">&rarr; {item.english}</div>
                    </div>
                  ))}
                  {content.countries.slice(0, 2).map((item: any, idx: number) => (
                    <div 
                      key={idx} 
                      onClick={() => speakWord(item.korean)}
                      className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-xl text-center cursor-pointer transition"
                    >
                      <div className="text-xs text-accent-teal font-mono">Country</div>
                      <div className="text-xl font-bold text-white my-1">{item.korean}</div>
                      <div className="text-xs text-zinc-400">&rarr; {item.english}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Next Step <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1 (Loanwords guessing & matching) */}
      {step === 3 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Activity 1 – Loanword Reading & Guessing</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of 8</span>
          </div>

          <div className="flex justify-center gap-2 border-b border-white/5 pb-4">
            <button 
              onClick={() => setLoanwordsSubMode("guess")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${loanwordsSubMode === "guess" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
            >
              Stage A: Guess The Word
            </button>
            <button 
              onClick={() => setLoanwordsSubMode("match")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${loanwordsSubMode === "match" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
            >
              Stage B: Match Columns
            </button>
          </div>

          {loanwordList.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full text-center">
              {loanwordsSubMode === "guess" ? (
                <div className="space-y-4">
                  <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-zinc-900/40 space-y-4 max-w-xs mx-auto">
                    <span className="text-xs text-zinc-500 block">Read and guess the English equivalent:</span>
                    <div className="text-5xl font-black text-white">{loanwordList[loanwordIdx]?.korean}</div>
                    
                    <button 
                      onClick={() => speakWord(loanwordList[loanwordIdx]?.korean)}
                      className="mx-auto p-2.5 rounded-xl bg-zinc-950 text-brand-400 hover:text-white border border-white/5 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Play Audio</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {loanwordList[loanwordIdx]?.english_options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !loanwordChecked && setLoanwordSelected(opt)}
                        disabled={loanwordChecked}
                        className={`p-3 rounded-xl border text-xs font-bold transition ${
                          loanwordSelected === opt 
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {loanwordChecked && (
                    <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                      loanwordCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                    }`}>
                      <p className="font-extrabold">{loanwordCorrect ? `맞아요! ${loanwordList[loanwordIdx]?.korean} = ${loanwordList[loanwordIdx]?.correct}.` : `거의 맞았어요. Listen again: ${loanwordList[loanwordIdx]?.korean}. It's closer to '${loanwordList[loanwordIdx]?.correct}'.`}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <button onClick={() => setStep(2)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                    
                    {!loanwordChecked ? (
                      <button
                        onClick={handleCheckLoanword}
                        disabled={!loanwordSelected}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        {loanwordIdx < loanwordList.length - 1 ? "Next Word" : "Go to Stage B"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Matching Column Game */
                <div className="space-y-4">
                  <p className="text-xs text-zinc-400">Match the Korean loanword to its English meaning:</p>
                  
                  <div className="grid grid-cols-2 gap-8 items-start">
                    {/* Left Hangeul Column */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Hangeul Loanwords</span>
                      {loanwordList.slice(0, 4).map(item => {
                        const isMatched = loanwordsMatched[item.korean] !== undefined;
                        return (
                          <button
                            key={item.korean}
                            disabled={isMatched}
                            onClick={() => setSelectedLeftLoanword(item.korean)}
                            className={`w-full p-3 rounded-xl border text-sm font-black transition text-center ${
                              isMatched 
                                ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal/40 line-through" 
                                : selectedLeftLoanword === item.korean 
                                ? "border-brand-500 bg-brand-500/10 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]" 
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
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">English Original</span>
                      {["pizza", "bus", "taxi", "camera"].map(englishOpt => {
                        // Check if any left element has matched to this englishOpt
                        const matches = Object.entries(loanwordsMatched).find(([_, enVal]) => enVal === englishOpt);
                        const isMatched = matches !== undefined;
                        
                        return (
                          <button
                            key={englishOpt}
                            disabled={isMatched || !selectedLeftLoanword}
                            onClick={() => {
                              // Verify if matches correctly
                              const mappedObject = loanwordList.find(i => i.korean === selectedLeftLoanword);
                              if (mappedObject && mappedObject.correct === englishOpt) {
                                handleMatchLoanword(selectedLeftLoanword!, englishOpt);
                              } else {
                                alert("Not a match! Try again.");
                              }
                            }}
                            className={`w-full p-3 rounded-xl border text-sm font-bold transition text-center ${
                              isMatched 
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
                    <button onClick={() => setLoanwordsSubMode("guess")} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Stage A</button>
                    
                    <button
                      onClick={() => setStep(4)}
                      disabled={Object.keys(loanwordsMatched).length < 4}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Move to Activity 2</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Screen 4: Activity 2 (Country & City names) */}
      {step === 4 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-400" />
              <span>Activity 2 – Countries & City Names</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of 8</span>
          </div>

          <div className="flex justify-center gap-2 border-b border-white/5 pb-4">
            <button 
              onClick={() => setCcSubMode("guess")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${ccSubMode === "guess" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
            >
              Stage A: Guess The Country
            </button>
            <button 
              onClick={() => setCcSubMode("match")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${ccSubMode === "match" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
            >
              Stage B: Match Columns
            </button>
          </div>

          {!ccData ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full text-center">
              {ccSubMode === "guess" ? (
                <div className="space-y-4">
                  <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-zinc-900/40 space-y-4 max-w-xs mx-auto">
                    <span className="text-xs text-zinc-500 block">Read and guess the country name:</span>
                    <div className="text-5xl font-black text-white">{ccData.countries[countryIdx]?.korean}</div>
                    
                    <button 
                      onClick={() => speakWord(ccData.countries[countryIdx]?.korean)}
                      className="mx-auto p-2.5 rounded-xl bg-zinc-950 text-brand-400 hover:text-white border border-white/5 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Play Audio</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {ccData.countries[countryIdx]?.english_options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !countryChecked && setCountrySelected(opt)}
                        disabled={countryChecked}
                        className={`p-3 rounded-xl border text-xs font-bold transition ${
                          countrySelected === opt 
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {countryChecked && (
                    <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                      countryCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                    }`}>
                      <p className="font-extrabold">{countryCorrect ? `맞아요! Correct!` : `Oops! Incorrect.`}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <button onClick={() => setStep(3)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                    
                    {!countryChecked ? (
                      <button
                        onClick={handleCheckCountry}
                        disabled={!countrySelected}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        {countryIdx < ccData.countries.length - 1 ? "Next Country" : "Go to Stage B"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Matching exercise for countries */
                <div className="space-y-4">
                  <p className="text-xs text-zinc-400">Match the country/city name to its English value:</p>

                  <div className="grid grid-cols-2 gap-8 items-start">
                    {/* Left column Hangeul */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Hangeul Name</span>
                      {ccData.matching.map((item: any) => {
                        const isMatched = ccMatched[item.ko] !== undefined;
                        return (
                          <button
                            key={item.ko}
                            disabled={isMatched}
                            onClick={() => setSelectedLeftCc(item.ko)}
                            className={`w-full p-2.5 rounded-xl border text-sm font-black transition text-center ${
                              isMatched 
                                ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal/40 line-through" 
                                : selectedLeftCc === item.ko 
                                ? "border-brand-500 bg-brand-500/10 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]" 
                                : "border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                            }`}
                          >
                            {item.ko}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right column English */}
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
                              // Verify if matches correctly
                              const correctVal = ccData.matching.find((i: any) => i.ko === selectedLeftCc);
                              if (correctVal && correctVal.en === item.en) {
                                handleMatchCc(selectedLeftCc!, item.en);
                              } else {
                                alert("Not a match! Try again.");
                              }
                            }}
                            className={`w-full p-2.5 rounded-xl border text-sm font-bold transition text-center ${
                              isMatched 
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
                    <button onClick={() => setCcSubMode("guess")} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Stage A</button>
                    
                    <button
                      onClick={() => setStep(5)}
                      disabled={Object.keys(ccMatched).length < 4}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Move to Activity 3</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Screen 5: Activity 3 (Korean and foreign names & transliteration) */}
      {step === 5 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-400" />
              <span>Activity 3 – Names & Transliteration</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 5 of 8</span>
          </div>

          <div className="flex justify-center gap-2 border-b border-white/5 pb-4">
            <button 
              onClick={() => setNamesSubMode("match")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${namesSubMode === "match" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
            >
              Stage A: Name Match
            </button>
            <button 
              onClick={() => setNamesSubMode("guess")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${namesSubMode === "guess" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
            >
              Stage B: Guess Name Sound
            </button>
            <button 
              onClick={() => setNamesSubMode("transliterate")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${namesSubMode === "transliterate" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
            >
              Stage C: Hangeulize My Name
            </button>
          </div>

          {!namesData ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full text-center">
              {/* Stage A: Name matching */}
              {namesSubMode === "match" && (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-400">Match transliterated Hangeul names to Romanization:</p>
                  
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
                            className={`w-full p-2.5 rounded-xl border text-sm font-black transition text-center ${
                              isMatched 
                                ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal/40 line-through" 
                                : selectedLeftName === item.ko 
                                ? "border-brand-500 bg-brand-500/10 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]" 
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
                              } else {
                                alert("Not a match! Try again.");
                              }
                            }}
                            className={`w-full p-2.5 rounded-xl border text-sm font-bold transition text-center ${
                              isMatched 
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
                    <button onClick={() => setStep(4)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                    
                    <button
                      onClick={() => setNamesSubMode("guess")}
                      disabled={Object.keys(namesMatched).length < 4}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Next Stage</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Stage B: MCQ names */}
              {namesSubMode === "guess" && (
                <div className="space-y-4">
                  <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-zinc-900/40 space-y-4 max-w-xs mx-auto">
                    <span className="text-xs text-zinc-500 block">Read and guess the romanization:</span>
                    <div className="text-4xl font-black text-white">{namesData.mcq[nameIdx]?.korean}</div>
                    
                    <button 
                      onClick={() => speakWord(namesData.mcq[nameIdx]?.korean)}
                      className="mx-auto p-2.5 rounded-xl bg-zinc-950 text-brand-400 hover:text-white border border-white/5 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Play Audio</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {namesData.mcq[nameIdx]?.english_options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !nameChecked && setNameSelected(opt)}
                        disabled={nameChecked}
                        className={`p-3 rounded-xl border text-xs font-bold transition ${
                          nameSelected === opt 
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {nameChecked && (
                    <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                      nameCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                    }`}>
                      <p className="font-extrabold">{nameCorrect ? `Correct!` : `Incorrect.`}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <button onClick={() => setNamesSubMode("match")} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                    
                    {!nameChecked ? (
                      <button
                        onClick={handleCheckName}
                        disabled={!nameSelected}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        {nameIdx < namesData.mcq.length - 1 ? "Next Name" : "Go to Stage C"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Stage C: Custom Transliterate (Calling Groq/Llama on demand ONLY when button clicked) */}
              {namesSubMode === "transliterate" && (
                <div className="space-y-4 text-left">
                  <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 space-y-2">
                    <h4 className="font-extrabold text-white text-xs">How do you write your name in Hangeul?</h4>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Korean writes names phonetically. For example, Lisa becomes <strong>리사</strong> and James becomes <strong>제임스</strong>.
                      Type your name below to get a custom Hangeul version!
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={transInput}
                      onChange={e => setTransInput(e.target.value)}
                      placeholder="Enter your name (e.g. Aditi, Rahul, John)..."
                      className="flex-grow bg-zinc-950 p-3 rounded-xl border border-white/10 outline-none focus:border-brand-500 font-sans text-sm text-white"
                      disabled={loadingTrans}
                    />
                    <button
                      onClick={handleTransliterate}
                      disabled={loadingTrans || !transInput.trim()}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold px-4 py-3 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
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
                    <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 space-y-3">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Hangeul Suggestions:</div>
                      
                      <div className="flex flex-wrap gap-2">
                        {transResults.map((sug, sIdx) => (
                          <div 
                            key={sIdx}
                            className="bg-zinc-950 p-3.5 rounded-xl border border-white/5 flex items-center justify-between gap-4 flex-grow max-w-xs"
                          >
                            <div>
                              <div className="text-2xl font-black text-white">{sug}</div>
                              <button 
                                onClick={() => speakWord(sug)}
                                className="mt-1 text-[10px] text-brand-400 hover:text-white flex items-center gap-1 cursor-pointer"
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>Pronounce</span>
                              </button>
                            </div>
                            <button
                              onClick={() => setSavedName(sug)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                savedName === sug 
                                  ? "bg-accent-teal text-zinc-950" 
                                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                              }`}
                            >
                              {savedName === sug ? "My saved name" : "Save Name"}
                            </button>
                          </div>
                        ))}
                      </div>

                      {transExplanation && (
                        <p className="text-zinc-400 text-xs italic bg-zinc-950 p-2.5 rounded-lg border border-white/[0.03] mt-2">
                          <strong>Why?</strong> {transExplanation}
                        </p>
                      )}
                    </div>
                  )}

                  {savedName && (
                    <div className="bg-accent-teal/5 border border-accent-teal/20 text-accent-teal p-3.5 rounded-xl text-xs font-bold text-center">
                      Saved "{savedName}" as your official bootcamp Korean name!
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <button onClick={() => setNamesSubMode("guess")} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                    
                    <button
                      onClick={() => setStep(6)}
                      className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Move to Activity 4</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Screen 6: Activity 4 (Short phrases) */}
      {step === 6 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Activity 4 – Short Phrase Reading</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of 8</span>
          </div>

          <div className="flex justify-center gap-2 border-b border-white/5 pb-4">
            <button 
              onClick={() => setPhrasesSubMode("read")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${phrasesSubMode === "read" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
            >
              Stage A: Card Reader
            </button>
            <button 
              onClick={() => setPhrasesSubMode("match")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${phrasesSubMode === "match" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
            >
              Stage B: Match Meanings
            </button>
            <button 
              onClick={() => setPhrasesSubMode("cloze")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${phrasesSubMode === "cloze" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
            >
              Stage C: Missing Block Cloze
            </button>
          </div>

          {!phrasesData ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full text-center">
              {/* Stage A: Card reading & self-assessments */}
              {phrasesSubMode === "read" && (
                <div className="space-y-4">
                  <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-zinc-900/40 space-y-4 max-w-xs mx-auto">
                    <span className="text-xs text-zinc-500 block">Classroom / Greeting Phrase {phraseIdx + 1}:</span>
                    <div className="text-3xl font-black text-white">{phrasesData.phrases[phraseIdx]?.korean}</div>
                    
                    <div className="flex justify-center gap-2 pt-2">
                      <button 
                        onClick={() => speakWord(phrasesData.phrases[phraseIdx]?.korean)}
                        className="p-2.5 rounded-xl bg-zinc-950 text-brand-400 hover:text-white border border-white/5 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Speak</span>
                      </button>
                      <button 
                        onClick={() => setShowPhraseGloss(!showPhraseGloss)}
                        className="p-2.5 rounded-xl bg-zinc-950 text-zinc-400 hover:text-white border border-white/5 transition text-xs font-bold"
                      >
                        {showPhraseGloss ? `Gloss: ${phrasesData.phrases[phraseIdx]?.english} (Literal: ${phrasesData.phrases[phraseIdx]?.literal})` : "Reveal Meaning"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500">How smoothly did you read this phrase?</p>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setPhraseSelfChecks(prev => ({ ...prev, [phraseIdx]: "smooth" }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                          phraseSelfChecks[phraseIdx] === "smooth" 
                            ? "bg-accent-teal text-zinc-950 border-accent-teal" 
                            : "border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        I could read it smoothly
                      </button>
                      <button
                        onClick={() => setPhraseSelfChecks(prev => ({ ...prev, [phraseIdx]: "struggled" }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                          phraseSelfChecks[phraseIdx] === "struggled" 
                            ? "bg-red-500/10 border-red-500/30 text-red-400" 
                            : "border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        I struggled
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <button onClick={() => setStep(5)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                    
                    <button
                      onClick={() => {
                        setShowPhraseGloss(false);
                        if (phraseIdx < phrasesData.phrases.length - 1) {
                          setPhraseIdx(phraseIdx + 1);
                        } else {
                          setPhrasesSubMode("match");
                        }
                      }}
                      className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      {phraseIdx < phrasesData.phrases.length - 1 ? "Next Phrase" : "Go to Stage B"}
                    </button>
                  </div>
                </div>
              )}

              {/* Stage B: Meaning matching */}
              {phrasesSubMode === "match" && (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-400">Match the phrases to their standard English meanings:</p>
                  
                  <div className="grid grid-cols-2 gap-8 items-start font-sans">
                    {/* Left Column */}
                    <div className="space-y-2 font-sans">
                      {phrasesData.matching.map((item: any) => {
                        const isMatched = phrasesMatched[item.ko] !== undefined;
                        return (
                          <button
                            key={item.ko}
                            disabled={isMatched}
                            onClick={() => setSelectedLeftPhrase(item.ko)}
                            className={`w-full p-2.5 rounded-xl border text-sm font-black transition text-center ${
                              isMatched 
                                ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal/40 line-through" 
                                : selectedLeftPhrase === item.ko 
                                ? "border-brand-500 bg-brand-500/10 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]" 
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
                              } else {
                                alert("Not a match! Try again.");
                              }
                            }}
                            className={`w-full p-2.5 rounded-xl border text-sm font-bold transition text-center ${
                              isMatched 
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
                    <button onClick={() => setPhrasesSubMode("read")} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Stage A</button>
                    
                    <button
                      onClick={() => setPhrasesSubMode("cloze")}
                      disabled={Object.keys(phrasesMatched).length < 3}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Next Stage</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Stage C: Cloze test */}
              {phrasesSubMode === "cloze" && (
                <div className="space-y-4">
                  <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-zinc-900/40 space-y-4 max-w-xs mx-auto">
                    <span className="text-xs text-zinc-500 block">Fill in the missing block to complete the greeting/phrase:</span>
                    <div className="text-3xl font-black text-white">{phrasesData.cloze[clozeIdx]?.question}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {phrasesData.cloze[clozeIdx]?.options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !clozeChecked && setClozeSelected(opt)}
                        disabled={clozeChecked}
                        className={`p-3 rounded-xl border text-sm font-black transition ${
                          clozeSelected === opt 
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {clozeChecked && (
                    <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                      clozeCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                    }`}>
                      <p className="font-extrabold">{clozeCorrect ? `Correct!` : `Incorrect.`}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <button onClick={() => setPhrasesSubMode("match")} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                    
                    {!clozeChecked ? (
                      <button
                        onClick={handleCheckCloze}
                        disabled={!clozeSelected}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
                            setStep(7);
                          }
                        }}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        {clozeIdx < phrasesData.cloze.length - 1 ? "Next Phrase" : "Go to mini-quiz"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Screen 7: Mini Quiz (Choice of static or AI generation button) */}
      {step === 7 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand-400" />
              <span>Phase 4 Mini‑Quiz Mastery Checkpoint</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of 8</span>
          </div>

          {quizQuestions.length === 0 ? (
            <div className="space-y-4 max-w-md mx-auto text-center py-6">
              <p className="text-zinc-300 text-xs">
                To prevent unnecessary API usage, you can choose to generate a standardized quiz or run a dynamic AI quiz generated on-demand by Llama!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => handleGenerateQuiz(false)}
                  disabled={loadingQuiz}
                  className="bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white font-bold py-3 px-6 rounded-xl transition text-xs cursor-pointer"
                >
                  Standard Quiz (No API call)
                </button>
                <button
                  onClick={() => handleGenerateQuiz(true)}
                  disabled={loadingQuiz}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-6 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loadingQuiz ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Sparkles className="w-4.5 h-4.5" />}
                  <span>Generate AI Quiz</span>
                </button>
              </div>
            </div>
          ) : quizScore !== null ? (
            /* Quiz Score Screen & Tutor feedback option */
            <div className="max-w-xl mx-auto w-full text-center space-y-6">
              <div className="inline-flex p-3 bg-brand-500/10 rounded-full border border-brand-500/20 text-brand-400 animate-bounce mb-2">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white">Mastery Checkpoint Result</h3>
              <p className="text-zinc-400 text-xs">
                You successfully completed the Phase 4 real-word reading quiz!
              </p>
              <div className="text-5xl font-black text-brand-400 py-2">{quizScore}%</div>

              {quizMistakes.length > 0 && (
                <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 text-left text-xs space-y-1 max-w-sm mx-auto text-zinc-400">
                  <p className="font-extrabold text-white text-xs mb-1">Topics needing focus:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {quizMistakes.slice(0, 3).map((m, idx) => (
                      <li key={idx} className="truncate">{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* On-demand tutor feedback generation button */}
              {!tutorSummary ? (
                <button
                  onClick={handleGetTutorFeedback}
                  disabled={loadingTutor}
                  className="bg-brand-500/10 hover:bg-brand-500/25 border border-brand-500/20 text-brand-400 font-bold py-2.5 px-6 rounded-xl transition text-xs flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  {loadingTutor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Ask Tutor Gwan-Sik for Advice</span>
                </button>
              ) : (
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/[0.03] text-left text-xs max-w-md mx-auto space-y-2">
                  <span className="text-[9px] font-black text-brand-400 uppercase tracking-widest block font-sans">Tutor Gwan-Sik says:</span>
                  <p className="text-zinc-300 leading-relaxed font-sans select-none">&ldquo;{tutorSummary}&rdquo;</p>
                </div>
              )}

              <div className="flex justify-center pt-4 border-t border-white/5">
                <button onClick={() => setStep(8)} className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-3 rounded-xl text-xs font-bold transition cursor-pointer">Continue to Homework &amp; Summary</button>
              </div>
            </div>
          ) : (
            /* Quiz Active Question */
            <div className="max-w-xl mx-auto w-full text-center space-y-6">
              <div>
                <span className="text-xs text-zinc-500 block">Question {quizIdx + 1} of {quizQuestions.length}</span>
                <h3 className="text-xl font-bold text-white mt-1 leading-snug">{quizQuestions[quizIdx]?.question}</h3>
              </div>

              <div className="space-y-2.5">
                {quizQuestions[quizIdx]?.options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !quizChecked && setQuizSelected(opt)}
                    disabled={quizChecked}
                    className={`w-full text-left p-3.5 rounded-xl font-medium transition flex items-center justify-between border ${
                      quizSelected === opt 
                        ? "border-brand-500 bg-brand-500/10 text-white shadow-inner" 
                        : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                    } ${quizChecked && opt === quizQuestions[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10 text-white" : ""}`}
                  >
                    <span>{opt}</span>
                    {quizSelected === opt && <CheckCircle2 className="w-4 h-4 text-brand-400" />}
                  </button>
                ))}
              </div>

              {quizChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                  quizCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold">{quizCorrect ? "Correct!" : "Incorrect."}</p>
                  <p>{quizQuestions[quizIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button 
                  onClick={() => {
                    setQuizQuestions([]);
                    setQuizIdx(0);
                    setQuizSelected(null);
                    setQuizChecked(false);
                    setQuizCorrect(null);
                  }} 
                  className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition cursor-pointer"
                >
                  Reset Quiz
                </button>
                
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={!quizSelected}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {quizIdx < quizQuestions.length - 1 ? "Next Question" : "Submit & Score Quiz"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 8: Homework & Recommendations (Finish Bootcamp CTA) */}
      {step === 8 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-400" />
              <span>Bootcamp Complete – Phase 4 Homework & Recommendations</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 8 of 8</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start text-xs md:text-sm text-zinc-300">
            <div className="space-y-4">
              <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 space-y-2">
                <h4 className="font-extrabold text-white text-xs">Bootcamp Reading Complete!</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Congratulations! You've learned how vowels and consonants combine, decoded syllable structures, and practiced reading real Korean names, loanwords, and greeting phrases.
                </p>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  You are now fully prepared for **Korean 1: Everyday Basics (A1)**!
                </p>
              </div>

              <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 space-y-2 text-zinc-400 text-xs leading-relaxed">
                <h4 className="font-extrabold text-white text-xs">Self-paced Challenge Tasks:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Find 5 items in your house and try spelling them phonetically in Hangeul!</li>
                  <li>Search YouTube for basic Korean road signs or brand logos to practice reading.</li>
                </ul>
              </div>
            </div>

            {recommendations && (
              <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 space-y-3.5">
                <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Your Mastery Profile:</h3>
                
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-green-400 block mb-0.5 font-sans">Strengths</span>
                  <p className="text-zinc-300 font-medium text-xs">{recommendations.strength}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-yellow-400 block mb-0.5 font-sans">Focus revisions</span>
                  <p className="text-zinc-300 font-medium text-xs">{recommendations.weakness}</p>
                </div>
                
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/[0.03] space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand-400 block font-sans">Recommended Search Query:</span>
                  <p className="text-white text-xs select-all bg-zinc-900 p-2 rounded border border-white/5 font-mono">"{recommendations.youtube_search}"</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center pt-6 border-t border-white/5">
            <button
              onClick={onComplete}
              className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 cursor-pointer"
            >
              <span>Finish Bootcamp &amp; Claim Badge</span>
              <ChevronRight className="w-4 h-4 text-zinc-950" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
