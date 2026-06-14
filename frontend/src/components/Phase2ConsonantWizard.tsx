"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2, Sparkles, BookOpen, BrainCircuit, Award, Loader2, CheckCircle2, Play, HelpCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface Phase2ConsonantWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Phase2ConsonantWizard({ activeLesson, speakWord, onComplete }: Phase2ConsonantWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);
  
  // Step 2: Content
  const [content, setContent] = useState<any>(null);
  
  // Step 3: Visual
  const [visualQuestions, setVisualQuestions] = useState<any[]>([]);
  const [visualIdx, setVisualIdx] = useState(0);
  const [visualSelected, setVisualSelected] = useState<string | null>(null);
  const [visualChecked, setVisualChecked] = useState(false);
  const [visualCorrect, setVisualCorrect] = useState<boolean | null>(null);
  
  // Step 4: Listening
  const [listeningQuestions, setListeningQuestions] = useState<any[]>([]);
  const [listeningIdx, setListeningIdx] = useState(0);
  const [listeningSelected, setListeningSelected] = useState<string | null>(null);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningCorrect, setListeningCorrect] = useState<boolean | null>(null);

  // Step 5: Series (triples)
  const [seriesQuestions, setSeriesQuestions] = useState<any[]>([]);
  const [seriesIdx, setSeriesIdx] = useState(0);
  const [seriesSelected, setSeriesSelected] = useState<string | null>(null);
  const [seriesChecked, setSeriesChecked] = useState(false);
  const [seriesCorrect, setSeriesCorrect] = useState<boolean | null>(null);

  // Step 6: Syllables Grid & Identification
  const [syllableData, setSyllableData] = useState<any>(null);
  const [showRomanizations, setShowRomanizations] = useState(false);
  const [syllableTaskIdx, setSyllableTaskIdx] = useState(0);
  const [syllableSelected, setSyllableSelected] = useState<string | null>(null);
  const [syllableChecked, setSyllableChecked] = useState(false);
  const [syllableCorrect, setSyllableCorrect] = useState<boolean | null>(null);
  const [syllableMode, setSyllableMode] = useState<"grid" | "identify" | "build">("grid");

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
          const res = await apiRequest("/lessons/lesson/phase2/metadata");
          setMetadata(res);
        } else if (step === 2 && !content) {
          const res = await apiRequest("/lessons/lesson/phase2/content");
          setContent(res);
        } else if (step === 3 && visualQuestions.length === 0) {
          const res = await apiRequest("/lessons/practice/consonants/visual");
          setVisualQuestions(res || []);
        } else if (step === 4 && listeningQuestions.length === 0) {
          const res = await apiRequest("/lessons/practice/consonants/listening");
          setListeningQuestions(res || []);
        } else if (step === 5 && seriesQuestions.length === 0) {
          const res = await apiRequest("/lessons/practice/consonants/series");
          setSeriesQuestions(res || []);
        } else if (step === 6 && !syllableData) {
          const res = await apiRequest("/lessons/practice/syllables/basic");
          setSyllableData(res);
        } else if (step === 8 && !recommendations) {
          const res = await apiRequest("/lessons/recommendations/hangeul/phase2");
          setRecommendations(res);
        }
      } catch (err) {
        console.error("Failed to load step data:", err);
      }
    };
    loadStepData();
  }, [step]);

  const handleCheckVisual = async () => {
    const currentQ = visualQuestions[visualIdx];
    if (!currentQ) return;
    const isCorrect = visualSelected === currentQ.correct_answer;
    setVisualChecked(true);
    setVisualCorrect(isCorrect);
    await apiRequest("/lessons/practice/consonants/visual/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: currentQ.id, correct: isCorrect, answer: visualSelected })
    });
  };

  const handleCheckListening = async () => {
    const currentQ = listeningQuestions[listeningIdx];
    if (!currentQ) return;
    const isCorrect = listeningSelected === currentQ.correct_answer;
    setListeningChecked(true);
    setListeningCorrect(isCorrect);
    await apiRequest("/lessons/practice/consonants/listening/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: currentQ.id, correct: isCorrect, answer: listeningSelected })
    });
  };

  const handleCheckSeries = async () => {
    const currentQ = seriesQuestions[seriesIdx];
    if (!currentQ) return;
    const isCorrect = seriesSelected === currentQ.correct_answer;
    setSeriesChecked(true);
    setSeriesCorrect(isCorrect);
    await apiRequest("/lessons/practice/consonants/series/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: currentQ.id, correct: isCorrect, answer: seriesSelected })
    });
  };

  const handleCheckSyllable = async () => {
    if (!syllableData) return;
    const currentQ = syllableMode === "identify" 
      ? syllableData.identification_tasks[syllableTaskIdx]
      : syllableData.build_tasks[syllableTaskIdx];
    if (!currentQ) return;
    const isCorrect = syllableSelected === currentQ.correct_answer;
    setSyllableChecked(true);
    setSyllableCorrect(isCorrect);
    await apiRequest("/lessons/practice/syllables/basic/answer", {
      method: "POST",
      body: JSON.stringify({ question_id: currentQ.id, correct: isCorrect, answer: syllableSelected })
    });
  };

  const handleCheckQuiz = () => {
    const currentQ = quizQuestions[quizIdx];
    if (!currentQ) return;
    let isCorrect = false;
    if (currentQ.type === "choice") {
      isCorrect = quizSelected === currentQ.correct_answer;
    } else {
      isCorrect = quizWriting.trim().toLowerCase() === currentQ.correct_answer.trim().toLowerCase();
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
      const res = await apiRequest("/lessons/tutor/phase2/summary", {
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
              <span>{activeLesson?.title || "Hangeul Consonants Bootcamp"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: {activeLesson?.topic || "Consonant foundations"}</p>
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
          <h2 className="text-4xl font-black text-white">Hangeul 0.2</h2>
          <h3 className="text-xl font-bold text-brand-400 mt-1">Consonant Bootcamp</h3>
          <p className="text-zinc-300 text-sm leading-relaxed">
            {metadata?.goals || "Learn Korean consonants, including plain, aspirated, and tense sounds, and start reading real syllables."}
          </p>
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-2">
            <p><strong>🎯 Objectives:</strong> Recognize 19 basic consonants, master plain vs. aspirated vs. tense series contrast, and build CV syllables.</p>
            <p><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_time || "20-25 minutes"}</p>
          </div>
          <button 
            onClick={() => setStep(2)}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            <span>Start Consonants</span>
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
              <span>Consonant Classification Chart</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold font-sans">Step 2 of 8</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-4 text-xs md:text-sm text-zinc-300">
              <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 space-y-2">
                <h4 className="font-extrabold text-white text-sm">Consonant Types</h4>
                <p className="text-zinc-400 leading-relaxed">
                  Hangeul consonants represent the speech organs (tongue, lips, throat) used to pronounce them.
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-zinc-400">
                  <li><strong>Plain:</strong> Normal, relaxed pronunciation.</li>
                  <li><strong>Aspirated:</strong> Pronounced with an energetic burst of air.</li>
                  <li><strong>Tense:</strong> Tense vocal cords, high pitched with no breath.</li>
                </ul>
              </div>

              <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 space-y-2">
                <h4 className="font-extrabold text-white text-sm">The placeholder 'ㅇ'</h4>
                <p className="text-zinc-400 leading-relaxed">
                  At the beginning of a block, <strong>ㅇ</strong> acts as a silent placeholder for vowels. At the end of a block (final position / batchim), it sounds like the <strong>ng</strong> in "king".
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Interactive Consonant Inventory</h3>
              {content ? (
                <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                  {content.groups.map((group: any) => (
                    <div key={group.name} className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{group.name}</span>
                      <div className="grid grid-cols-2 gap-2">
                        {group.consonants.map((con: any) => (
                          <div key={con.symbol} className="bg-zinc-950/80 p-2.5 rounded-xl border border-white/5 flex items-center justify-between group hover:border-brand-500/20 transition">
                            <div>
                              <span className="text-base font-black text-white block">{con.symbol}</span>
                              <span className="text-[10px] text-zinc-400">{con.hint}</span>
                            </div>
                            <button 
                              onClick={() => speakWord(con.symbol + "아")}
                              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition"
                              title="Play sample sound (with 아)"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-400" /></div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Next Step <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1 (Visual) */}
      {step === 3 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Activity 1 – Visual Recognition</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of 8 &bull; Q {visualIdx + 1}/{visualQuestions.length}</span>
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
                    className={`p-4 rounded-xl font-black text-sm border transition ${
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
                  <p>Correct answer is: {visualQuestions[visualIdx]?.correct_answer}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button onClick={() => setStep(2)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                
                {!visualChecked ? (
                  <button
                    onClick={handleCheckVisual}
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

      {/* Screen 4: Activity 2 (Listening) */}
      {step === 4 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-brand-400" />
              <span>Activity 2 – Listening Recognition</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of 8 &bull; Q {listeningIdx + 1}/{listeningQuestions.length}</span>
          </div>

          {listeningQuestions.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full text-center">
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Listen to the syllable and choose its starting consonant</h3>
              
              <button 
                onClick={() => speakWord(listeningQuestions[listeningIdx]?.audio_text)}
                className="p-6 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-full mx-auto transition flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-10 h-10" />
              </button>

              <div className="grid grid-cols-4 gap-3 pt-4">
                {listeningQuestions[listeningIdx]?.options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !listeningChecked && setListeningSelected(opt)}
                    disabled={listeningChecked}
                    className={`p-4 rounded-xl font-black text-2xl border transition ${
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
                  <p className="font-extrabold">{listeningCorrect ? "Excellent ear! Correct!" : "Incorrect."}</p>
                  <p>{listeningQuestions[listeningIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button onClick={() => setStep(3)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                
                {!listeningChecked ? (
                  <button
                    onClick={handleCheckListening}
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

      {/* Screen 5: Activity 3 (Series plain-aspirated-tense triples) */}
      {step === 5 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-brand-400" />
              <span>Activity 3 – Plain vs Aspirated vs Tense Triples</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 5 of 8 &bull; Q {seriesIdx + 1}/{seriesQuestions.length}</span>
          </div>

          {seriesQuestions.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-2xl mx-auto w-full text-center">
              <div className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 max-w-sm mx-auto text-xs text-zinc-400">
                💡 <strong>Aspiration Tip:</strong> Place your hand or a clean tissue in front of your mouth; you should feel a distinct puff of air with aspirated consonants (like ㅋ, ㅌ) but almost none with plain (ㄱ, ㄷ) or tense (ㄲ, ㄸ).
              </div>

              <div className="py-4">
                <button 
                  onClick={() => speakWord(seriesQuestions[seriesIdx]?.correct_syllable)}
                  className="p-6 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full mx-auto transition flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer animate-bounce"
                  style={{ animationDuration: "4s" }}
                >
                  <Volume2 className="w-10 h-10" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {seriesQuestions[seriesIdx]?.options.map((opt: any) => (
                  <button
                    key={opt.symbol}
                    onClick={() => !seriesChecked && setSeriesSelected(opt.symbol)}
                    disabled={seriesChecked}
                    className={`p-4 rounded-2xl border text-left space-y-1 transition ${
                      seriesSelected === opt.symbol
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                    } ${seriesChecked && opt.symbol === seriesQuestions[seriesIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10" : ""}`}
                  >
                    <div className="text-2xl font-black text-white text-center">{opt.symbol}</div>
                    <div className="text-[10px] text-zinc-400 text-center">{opt.label.split(" - ").pop()}</div>
                  </button>
                ))}
              </div>

              {seriesChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                  seriesCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold">{seriesCorrect ? "Fantastic! You captured the tension and air differences." : "Oops!"}</p>
                  <p>{seriesQuestions[seriesIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button onClick={() => setStep(4)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                
                {!seriesChecked ? (
                  <button
                    onClick={handleCheckSeries}
                    disabled={!seriesSelected}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSeriesChecked(false);
                      setSeriesCorrect(null);
                      setSeriesSelected(null);
                      if (seriesIdx < seriesQuestions.length - 1) {
                        setSeriesIdx(seriesIdx + 1);
                      } else {
                        setStep(6);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {seriesIdx < seriesQuestions.length - 1 ? "Next Pair" : "Move to Activity 4"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 6: Activity 4 (Syllable Reading) */}
      {step === 6 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-400" />
              <span>Activity 4 – Syllable Combining & Reading</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 6 of 8</span>
          </div>

          {!syllableData ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-2xl mx-auto w-full">
              {/* Mode switch */}
              <div className="flex justify-center gap-2 border-b border-white/5 pb-4">
                <button 
                  onClick={() => { setSyllableMode("grid"); setSyllableChecked(false); setSyllableSelected(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${syllableMode === "grid" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
                >
                  CV Grid Reader
                </button>
                <button 
                  onClick={() => { setSyllableMode("identify"); setSyllableTaskIdx(0); setSyllableChecked(false); setSyllableSelected(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${syllableMode === "identify" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
                >
                  Identify Starts
                </button>
                <button 
                  onClick={() => { setSyllableMode("build"); setSyllableTaskIdx(0); setSyllableChecked(false); setSyllableSelected(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${syllableMode === "build" ? "bg-brand-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
                >
                  Build Syllables
                </button>
              </div>

              {/* Grid Mode */}
              {syllableMode === "grid" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400">Click any syllable to hear its pronunciation and verify layout combining rules.</span>
                    <button 
                      onClick={() => setShowRomanizations(!showRomanizations)}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 rounded-md text-[10px] font-bold"
                    >
                      {showRomanizations ? "Hide Romanization Hints" : "Show Romanization Hints"}
                    </button>
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                    {syllableData.grid.map((item: any) => (
                      <div 
                        key={item.syllable}
                        onClick={() => speakWord(item.syllable)}
                        className="bg-zinc-950 border border-white/5 hover:border-brand-500/30 p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer group transition transform hover:-translate-y-0.5 active:scale-95"
                      >
                        <span className="text-2xl font-black text-white group-hover:text-brand-300 transition">{item.syllable}</span>
                        {showRomanizations && (
                          <span className="text-[10px] text-zinc-500 font-mono mt-1 font-semibold">{item.romanization}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Identify Mode */}
              {syllableMode === "identify" && (
                <div className="space-y-5 text-center py-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Syllable Start Challenge ({syllableTaskIdx + 1}/{syllableData.identification_tasks.length})</span>
                  <div className="text-5xl font-black text-white py-2">{syllableData.identification_tasks[syllableTaskIdx]?.syllable}</div>
                  
                  <h3 className="text-sm font-semibold text-zinc-300">
                    {syllableData.identification_tasks[syllableTaskIdx]?.question}
                  </h3>

                  <div className="grid grid-cols-4 gap-2 pt-2 max-w-sm mx-auto">
                    {syllableData.identification_tasks[syllableTaskIdx]?.options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !syllableChecked && setSyllableSelected(opt)}
                        disabled={syllableChecked}
                        className={`p-3 rounded-xl font-black text-lg border transition ${
                          syllableSelected === opt
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                        } ${syllableChecked && opt === syllableData.identification_tasks[syllableTaskIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10 text-white" : ""}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {syllableChecked && (
                    <div className={`p-4 rounded-xl border text-xs text-left max-w-sm mx-auto ${
                      syllableCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                    }`}>
                      <p className="font-extrabold">{syllableCorrect ? "Correct!" : "Oops! Incorrect."}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Build Mode */}
              {syllableMode === "build" && (
                <div className="space-y-5 text-center py-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Block Assembly Challenge ({syllableTaskIdx + 1}/{syllableData.build_tasks.length})</span>
                  
                  <h3 className="text-sm font-semibold text-zinc-300 py-3">
                    {syllableData.build_tasks[syllableTaskIdx]?.prompt}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 pt-2 max-w-xs mx-auto">
                    {syllableData.build_tasks[syllableTaskIdx]?.options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !syllableChecked && setSyllableSelected(opt)}
                        disabled={syllableChecked}
                        className={`p-4 rounded-xl font-black text-2xl border transition ${
                          syllableSelected === opt
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                        } ${syllableChecked && opt === syllableData.build_tasks[syllableTaskIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10 text-white" : ""}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {syllableChecked && (
                    <div className={`p-4 rounded-xl border text-xs text-left max-w-xs mx-auto ${
                      syllableCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                    }`}>
                      <p className="font-extrabold">{syllableCorrect ? "Correct!" : "Oops! Incorrect."}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button onClick={() => setStep(5)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                
                {syllableMode === "grid" ? (
                  <button onClick={() => setStep(7)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer">Move to Mini-Quiz <ChevronRight className="w-4 h-4" /></button>
                ) : !syllableChecked ? (
                  <button
                    onClick={handleCheckSyllable}
                    disabled={!syllableSelected}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSyllableChecked(false);
                      setSyllableCorrect(null);
                      setSyllableSelected(null);
                      const maxIdx = syllableMode === "identify" ? syllableData.identification_tasks.length : syllableData.build_tasks.length;
                      if (syllableTaskIdx < maxIdx - 1) {
                        setSyllableTaskIdx(syllableTaskIdx + 1);
                      } else {
                        // Switch modes or progress
                        if (syllableMode === "identify") {
                          setSyllableMode("build");
                          setSyllableTaskIdx(0);
                        } else {
                          setStep(7);
                        }
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    Continue
                  </button>
                )}
              </div>
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
              <span>Step 7 – Mini‑Quiz (Phase 2 Checkpoint)</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 7 of 8</span>
          </div>

          {quizQuestions.length === 0 ? (
            <div className="text-center py-10 max-w-sm mx-auto space-y-6">
              <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400">
                <BrainCircuit className="w-10 h-10 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Generate Phase 2 Checkpoint</h3>
                <p className="text-xs text-zinc-500 mt-1">Select standard static checkpoint questions, or dynamically generate a custom quiz via Gwan-Sik using Llama AI on demand.</p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={async () => {
                    setLoadingQuiz(true);
                    try {
                      const data = await apiRequest("/lessons/quiz/phase2/generate?use_ai=false", { method: "POST" });
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
                      const data = await apiRequest("/lessons/quiz/phase2/generate?use_ai=true", { method: "POST" });
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
                <span>Level: Consonant Bootcamp</span>
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
                    placeholder="Type your answer here..."
                    className="w-full bg-zinc-900/60 p-4 rounded-xl border border-white/10 outline-none focus:border-brand-500 text-center font-sans text-lg text-white"
                    disabled={quizChecked}
                    onKeyDown={(e) => e.key === "Enter" && !quizChecked && handleCheckQuiz()}
                  />
                  {/* keyboard row */}
                  {!quizChecked && (
                    <div className="flex flex-wrap gap-1.5 justify-center bg-zinc-900/30 p-4 rounded-2xl border border-white/5">
                      {["ㄱ", "ㄲ", "ㅋ", "ㄷ", "ㄸ", "ㅌ", "ㅂ", "ㅃ", "ㅍ", "ㅈ", "ㅉ", "ㅊ", "ㅅ", "ㅆ", "ㅇ", "ㅎ"].map(char => (
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
                        apiRequest("/lessons/quiz/phase2/submit", {
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
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Consonants Checkpoint Complete</span>
                <h3 className="text-6xl font-black bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">{quizScore}%</h3>
                <p className="text-zinc-300 text-xs leading-normal">
                  {quizScore >= 80 ? "Superb! You have mastered Hangeul basic and complex consonants." : "Good attempt! Let's do additional reviews."}
                </p>

                {/* Llama feedback summaries called strictly on-demand */}
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
            <h2 className="text-2xl font-black text-white font-sans">Consonant Bootcamp Complete! 🇰🇷✨</h2>
            <p className="text-zinc-400 text-xs mt-1">You are now ready to start assembling consonants and vowels into blocks.</p>
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
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-400 block font-sans">Recommended Study Tasks:</span>
                <ul className="list-decimal list-inside space-y-1.5 text-zinc-400 pl-1">
                  <li>
                    Search YouTube for: <strong className="text-white select-all">"{recommendations.youtube_search}"</strong> and practice plain-aspirated-tense breath release.
                  </li>
                  <li>
                    Self-test dialogue request: Ask Gwan-Sik tomorrow: <strong className="text-brand-300">"Give me a 10-question minimal-pair quiz for ㄱ–ㅋ–ㄲ and ㄷ–ㅌ–ㄸ"</strong>.
                  </li>
                </ul>
              </div>
            </div>
          )}

          <button
            onClick={onComplete}
            className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/20 cursor-pointer"
          >
            <span>Mark Phase 2 complete & continue</span>
            <ChevronRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      )}
    </div>
  );
}
