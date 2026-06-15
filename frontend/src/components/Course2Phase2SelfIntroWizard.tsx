"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  Sparkles, 
  BookOpen, 
  Award, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Play, 
  RotateCcw,
  Mic,
  MicOff,
  Check,
  MessageSquare
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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

async function apiForm(path: string, formData: FormData) {
  const token = getToken();
  const cleanPath = (path.startsWith("/phases/") || path.startsWith("/quiz/") || path.startsWith("/practice/")) ? `/lessons${path}` : path;
  const res = await fetch(`${API_BASE}${cleanPath}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

// Audio recorder hook
function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunks = useRef<BlobPart[]>([]);

  const start = useCallback(async () => {
    setAudioBlob(null);
    chunks.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone access denied. Please allow microphone permissions and try again.");
    }
  }, []);

  const stop = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setRecording(false);
  }, []);

  return { recording, audioBlob, start, stop, setAudioBlob };
}

interface Course2Phase2SelfIntroWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course2Phase2SelfIntroWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course2Phase2SelfIntroWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 6;

  // Loaded DB data
  const [metadata, setMetadata] = useState<any>(null);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [listeningItems, setListeningItems] = useState<any[]>([]);
  const [allowedPatterns, setAllowedPatterns] = useState<any>(null);
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);

  // Flip tracking
  const [flippedPatternId, setFlippedPatternId] = useState<string | null>(null);

  // Activity 1A listening states
  const [listeningIdx, setListeningIdx] = useState(0);
  const [selectedListeningOpt, setSelectedListeningOpt] = useState<string | null>(null);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningCorrect, setListeningCorrect] = useState<boolean | null>(null);

  // Activity 1B listening states
  const [lisInfoIdx, setLisInfoIdx] = useState(0);
  const [lisInfoSelected, setLisInfoSelected] = useState<string | null>(null);
  const [lisInfoChecked, setLisInfoChecked] = useState(false);
  const [lisInfoCorrect, setLisInfoCorrect] = useState<boolean | null>(null);

  // Activity 2A pattern filling states
  const [userName, setUserName] = useState("지우"); // fallback name
  const [selectedCountry, setSelectedCountry] = useState("미국");
  const [selectedOccupation, setSelectedOccupation] = useState("학생");
  
  // Custom intro build builder lines
  const [greetLine, setGreetLine] = useState("안녕하세요.");
  const [nameLine, setNameLine] = useState("제 이름은 지우입니다.");
  const [originLine, setOriginLine] = useState("저는 미국 사람입니다.");
  const [closingLine, setClosingLine] = useState("반갑습니다.");
  const [builtIntro, setBuiltIntro] = useState<any>(null);
  const [building, setBuilding] = useState(false);
  const [savingIntro, setSavingIntro] = useState(false);
  const [introSaved, setIntroSaved] = useState(false);

  // Quiz states
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizWritingAns, setQuizWritingAns] = useState("");
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Speaking check states
  const rec = useRecorder();
  const [speakingTranscribing, setSpeakingTranscribing] = useState(false);
  const [speakingResult, setSpeakingResult] = useState<any>(null);

  // Homework checklist states
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Tutor Launcher states
  const [tutorSession, setTutorSession] = useState<any>(null);
  const [loadingTutor, setLoadingTutor] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/lessons/phases/korean1/2/metadata");
          setMetadata(res);
        } else if (step === 2 && patterns.length === 0) {
          const res = await apiJson("/lessons/phases/korean1/2/patterns");
          setPatterns(res);
        } else if (step === 3 && listeningItems.length === 0) {
          const res_lis = await apiJson("/lessons/practice/selfintro/listening");
          setListeningItems(res_lis.items || []);
        } else if (step === 4 && !allowedPatterns) {
          const res_p = await apiJson("/lessons/practice/selfintro/patterns");
          setAllowedPatterns(res_p);
          
          // Load username from profile if available
          try {
            const profile = await apiJson("/progress/profile");
            if (profile.korean_name) {
              setUserName(profile.korean_name);
              setNameLine(`제 이름은 ${profile.korean_name}입니다.`);
            }
          } catch (e) {
            // Safe fallback
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/lessons/quiz/korean1/phase-2/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean1/2/homework");
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

  // Activity 1A submission
  const handleCheckListening = async () => {
    const current = listeningItems[listeningIdx];
    if (!current || !selectedListeningOpt) return;

    try {
      const res = await apiJson("/lessons/practice/selfintro/listening/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          selected_option_id: selectedListeningOpt,
          time_taken_ms: 1000
        })
      });
      setListeningChecked(true);
      setListeningCorrect(res.correct);
    } catch (err) {
      console.error(err);
    }
  };

  // Stitches self introduction lines and previews
  const handleBuildIntro = async () => {
    setBuilding(true);
    setBuiltIntro(null);
    try {
      const res = await apiJson("/lessons/practice/selfintro/build", {
        method: "POST",
        body: JSON.stringify({
          lines: [greetLine, nameLine, originLine, closingLine]
        })
      });
      setBuiltIntro(res);
    } catch (err) {
      console.error(err);
    } finally {
      setBuilding(false);
    }
  };

  // Saves self intro to profile
  const handleSaveIntro = async () => {
    if (!builtIntro) return;
    setSavingIntro(true);
    try {
      await apiJson("/lessons/users/selfintro/save", {
        method: "POST",
        body: JSON.stringify({
          intro_text: builtIntro.final_korean_text
        })
      });
      setIntroSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingIntro(false);
    }
  };

  // Quiz submission
  const handleCheckQuiz = () => {
    const current = quizBlueprint[quizIdx];
    if (!current) return;

    let isCorrect = false;
    if (current.type === "listening" || current.type === "context") {
      isCorrect = quizSelectedOpt === current.correct_answer;
    } else {
      isCorrect = quizWritingAns.trim().toLowerCase() === current.correct_answer.trim().toLowerCase();
    }

    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    if (!isCorrect) {
      setQuizMistakes(prev => [...prev, current.correct_answer]);
    }
  };

  const handleNextQuizOrComplete = async () => {
    if (quizIdx < quizBlueprint.length - 1) {
      setQuizIdx(quizIdx + 1);
      setQuizSelectedOpt(null);
      setQuizWritingAns("");
      setQuizChecked(false);
      setQuizCorrect(null);
      setSpeakingResult(null);
    } else {
      setFinishingQuiz(true);
      try {
        const correctCount = quizBlueprint.length - quizMistakes.length;
        const score = Math.round((correctCount / quizBlueprint.length) * 100);
        await apiJson("/lessons/quiz/korean1/phase-2/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setStep(6);
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  // Speaking check for Saved self-intro
  const handleSpeechEvaluate = async () => {
    if (!rec.audioBlob || !builtIntro) return;
    setSpeakingTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("target_text", builtIntro.final_korean_text);
      fd.append("audio_file", rec.audioBlob, "recording.webm");
      const res = await apiForm("/speech/shadow", fd);
      setSpeakingResult(res);
      if (res.similarity_score >= 60) {
        setQuizWritingAns(builtIntro.final_korean_text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSpeakingTranscribing(false);
    }
  };

  // Homework check toggler
  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/lessons/phases/korean1/2/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Tutor session starter
  const handleLaunchTutor = async () => {
    setLoadingTutor(true);
    try {
      const res = await apiJson("/lessons/tutor/selfintro-practice/start", { method: "POST" });
      setTutorSession(res);
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
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
            <BookOpen className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <span>{activeLesson?.title || "Introducing Yourself"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: Self-Introductions</p>
          </div>
        </div>
        
        {/* Active progress bar */}
        <div className="flex items-center space-x-4">
          <div className="w-40 h-3 bg-zinc-900/80 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 rounded-full transition-all duration-500" 
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

      {/* Screen 1: Welcome/Overview */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight">Korean 1.2</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Introducing Yourself</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Say your name, where you're from, and ask others about themselves."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Introduce yourself with name and country",
                "Ask and answer simple 'Where are you from?' questions",
                "Build a short A1-level self-introduction"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 20} minutes</p>
            <p><strong>📋 Prerequisites:</strong> {metadata?.prerequisites || "Greetings & Polite Basics"}</p>
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => setStep(2)}
              className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 2</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
          </div>

          {showOutline && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-2 animate-fade-in max-w-2xl mx-auto w-full font-mono">
              <p className="font-extrabold text-white text-center pb-2">Phase Activities Outline</p>
              <p>✓ Activity 1 – Identity pattern charts & card flips</p>
              <p>✓ Activity 2 – Self-introduction spoken listening MCQ challenges</p>
              <p>✓ Activity 3 – Personal detail pattern fill forms</p>
              <p>✓ Activity 4 – Guided multi-line intro stitching builder</p>
              <p>✓ Activity 5 – Graduating checkpoint mini-quiz checks</p>
            </div>
          )}
        </div>
      )}

      {/* Screen 2: Concept Explanation */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>Self-Introduction Patterns</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <p className="text-xs text-zinc-400">
            A1 self-introductions usually cover name, nationality, and sometimes job status. Tap cards below to play TTS sounds and reveal grammar explanations.
          </p>

          <div className="space-y-3">
            {patterns.map((pat) => {
              const isFlipped = flippedPatternId === pat.id;
              return (
                <div
                  key={pat.id}
                  onClick={() => {
                    setFlippedPatternId(isFlipped ? null : pat.id);
                    playAudio(pat.korean.replace("[이름]", userName).replace("[나라]", selectedCountry).replace("[직업]", selectedOccupation));
                  }}
                  className={`glass-panel p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isFlipped ? "border-brand-500 bg-brand-500/5" : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                      {pat.type}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudio(pat.korean.replace("[이름]", userName).replace("[나라]", selectedCountry).replace("[직업]", selectedOccupation));
                      }}
                      className="p-1 rounded bg-zinc-950/60 text-zinc-400 hover:text-white"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!isFlipped ? (
                    <div className="py-2">
                      <div className="text-xl font-black text-white font-korean">
                        {pat.korean}
                      </div>
                      <div className="text-[9px] text-zinc-500 font-mono mt-0.5">Click to flip explanations</div>
                    </div>
                  ) : (
                    <div className="py-2 text-left space-y-1 animate-fade-in">
                      <div className="text-xs font-mono text-zinc-300">{pat.romanization}</div>
                      <div className="text-sm font-black text-white">{pat.english}</div>
                      <p className="text-[10px] text-zinc-400 leading-snug">{pat.usage}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Listening Comprehension */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Listening & Recognition</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {listeningItems.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6">
              
              {/* Part A: Hear self-intro -> Choose meaning */}
              <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider text-center">Part A: Hear self-intro → Choose meaning</h3>
                
                <div className="text-center">
                  <button
                    onClick={() => playAudio(listeningItems[listeningIdx]?.korean)}
                    className="p-5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-full mx-auto transition flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    <Volume2 className="w-8 h-8 animate-pulse" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2">
                  {listeningItems[listeningIdx]?.english_options.map((opt: any) => (
                    <button
                      key={opt.id}
                      onClick={() => !listeningChecked && setSelectedListeningOpt(opt.id)}
                      disabled={listeningChecked}
                      className={`p-3 rounded-xl border text-xs font-semibold transition ${
                        selectedListeningOpt === opt.id
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                      } ${listeningChecked && opt.id === listeningItems[listeningIdx]?.correct_option_id ? "border-accent-teal bg-accent-teal/10" : ""}`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>

                {listeningChecked && (
                  <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                    listeningCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    <p className="font-extrabold">{listeningCorrect ? "Correct!" : "Incorrect."}</p>
                    <p>Sentence: <strong className="text-white">{listeningItems[listeningIdx]?.korean}</strong> ({listeningItems[listeningIdx]?.romanization})</p>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  {!listeningChecked ? (
                    <button
                      onClick={handleCheckListening}
                      disabled={!selectedListeningOpt}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setListeningChecked(false);
                        setSelectedListeningOpt(null);
                        setListeningCorrect(null);
                        if (listeningIdx < listeningItems.length - 1) {
                          setListeningIdx(listeningIdx + 1);
                        } else {
                          setListeningIdx(0);
                        }
                      }}
                      className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Next Audio Item
                    </button>
                  )}
                </div>
              </div>

              {/* Part B: Match identity country */}
              <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider text-center">Part B: Identify personal origin</h3>
                
                <div className="text-center space-y-2">
                  <p className="text-xs text-zinc-400">Listen and select which country the speaker is from:</p>
                  <button
                    onClick={() => playAudio("저는 프랑스 사람입니다")}
                    className="p-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full mx-auto transition flex items-center justify-center cursor-pointer"
                  >
                    <Volume2 className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                  {["미국", "한국", "프랑스", "독일"].map((c) => (
                    <button
                      key={c}
                      onClick={() => !lisInfoChecked && setLisInfoSelected(c)}
                      disabled={lisInfoChecked}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                        lisInfoSelected === c
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                      } ${lisInfoChecked && c === "프랑스" ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {lisInfoChecked && (
                  <div className={`p-3 rounded-xl border text-xs text-center ${
                    lisInfoCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    {lisInfoCorrect ? "Correct! They said 프랑스 (France)." : "Incorrect. Try again."}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  {!lisInfoChecked ? (
                    <button
                      onClick={() => {
                        setLisInfoChecked(true);
                        setLisInfoCorrect(lisInfoSelected === "프랑스");
                      }}
                      disabled={!lisInfoSelected}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Verify Match
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setLisInfoChecked(false);
                        setLisInfoSelected(null);
                        setLisInfoCorrect(null);
                      }}
                      className="bg-zinc-800 text-zinc-400 hover:bg-zinc-700 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Replay Drill
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(2)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 2: Pattern Filling & Self-Intro Builder */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Self-Intro Builder</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          {/* Activity 2A: Pattern Filling Form */}
          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Part A: Fill-in-the-pattern forms</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] text-zinc-500 font-bold uppercase block">1. Your Name (Hangeul/Romanized)</label>
                <input 
                  type="text"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    setNameLine(`제 이름은 ${e.target.value}입니다.`);
                  }}
                  className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] text-zinc-500 font-bold uppercase block">2. Select Country</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setOriginLine(`저는 ${e.target.value} 사람입니다.`);
                  }}
                  className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  {allowedPatterns?.countries?.map((c: any) => (
                    <option key={c.ko} value={c.ko}>{c.ko} ({c.en})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1 text-left max-w-sm mx-auto">
              <label className="text-[10px] text-zinc-500 font-bold uppercase block">3. Select Occupation / Job</label>
              <select
                value={selectedOccupation}
                onChange={(e) => setSelectedOccupation(e.target.value)}
                className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                {allowedPatterns?.occupations?.map((o: any) => (
                  <option key={o.ko} value={o.ko}>{o.ko} ({o.en})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Activity 2B: Stitcher preview */}
          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Part B: Build your 3-sentence self-intro</h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 flex justify-between items-center">
                <div className="text-left">
                  <span className="text-[8px] text-zinc-500 font-bold uppercase block">Line 1: Greeting</span>
                  <input 
                    type="text"
                    value={greetLine}
                    onChange={(e) => setGreetLine(e.target.value)}
                    className="bg-transparent text-xs text-white border-none outline-none font-bold w-full"
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 flex justify-between items-center">
                <div className="text-left">
                  <span className="text-[8px] text-zinc-500 font-bold uppercase block">Line 2: Name Intro</span>
                  <input 
                    type="text"
                    value={nameLine}
                    onChange={(e) => setNameLine(e.target.value)}
                    className="bg-transparent text-xs text-white border-none outline-none font-bold w-full"
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 flex justify-between items-center">
                <div className="text-left">
                  <span className="text-[8px] text-zinc-500 font-bold uppercase block">Line 3: Origin Intro</span>
                  <input 
                    type="text"
                    value={originLine}
                    onChange={(e) => setOriginLine(e.target.value)}
                    className="bg-transparent text-xs text-white border-none outline-none font-bold w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={handleBuildIntro}
                disabled={building}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-5 rounded-xl text-xs transition cursor-pointer"
              >
                {building ? "Building..." : "Generate Intro Preview"}
              </button>
            </div>

            {builtIntro && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 space-y-3 animate-fade-in text-center">
                <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Stitched Self-Introduction Preview</span>
                <p className="text-lg font-black text-white font-korean">{builtIntro.final_korean_text}</p>
                
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => playAudio(builtIntro.final_korean_text)}
                    className="p-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-full border border-brand-500/20 transition cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleSaveIntro}
                    disabled={savingIntro || introSaved}
                    className="bg-accent-teal hover:bg-accent-teal/95 disabled:opacity-50 text-zinc-950 font-black py-1.5 px-4 rounded-lg text-xs transition cursor-pointer"
                  >
                    {savingIntro ? "Saving..." : introSaved ? "Saved Successfully!" : "Save Intro to Profile"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Mini-Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Mini-Quiz Checkpoint */}
      {step === 5 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Mini-Quiz: Self-Intro Checkpoint</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Question {quizIdx + 1} of {quizBlueprint.length}</span>
          </div>

          {quizBlueprint.length === 0 ? (
            <div className="text-center py-6"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 text-xs text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Question Prompt</span>
                <p className="font-extrabold text-white text-base mt-1">{quizBlueprint[quizIdx]?.question}</p>
              </div>

              {quizBlueprint[quizIdx]?.type === "listening" && (
                <div className="text-center space-y-4">
                  <button 
                    onClick={() => playAudio(quizBlueprint[quizIdx]?.correct_answer)}
                    className="p-5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full mx-auto transition flex items-center justify-center cursor-pointer"
                  >
                    <Volume2 className="w-8 h-8" />
                  </button>
                  <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                    {quizBlueprint[quizIdx]?.options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                        disabled={quizChecked}
                        className={`p-3 rounded-xl border text-xs font-bold transition ${
                          quizSelectedOpt === opt
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                        } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10" : ""}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {quizBlueprint[quizIdx]?.type === "context" && (
                <div className="grid grid-cols-1 gap-2">
                  {quizBlueprint[quizIdx]?.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                      disabled={quizChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                        quizSelectedOpt === opt
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                      } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10 text-white" : ""}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {quizBlueprint[quizIdx]?.type === "writing" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={quizWritingAns}
                    disabled={quizChecked}
                    onChange={(e) => setQuizWritingAns(e.target.value)}
                    placeholder="Type the exact Hangeul block..."
                    className="w-full bg-zinc-950 p-4 rounded-xl border border-white/5 text-center text-lg font-black text-white focus:outline-none focus:border-brand-500 font-sans"
                  />
                  {/* Keyboard help key */}
                  {!quizChecked && (
                    <div className="flex gap-1.5 justify-center flex-wrap pt-2">
                      {["학생", "미국", "한국", "회사원", "교수", "선생님"].map(ch => (
                        <button
                          key={ch}
                          onClick={() => setQuizWritingAns(v => v + ch)}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 rounded border border-white/5 text-xs text-white"
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {quizBlueprint[quizIdx]?.type === "speaking" && (
                <div className="space-y-4 text-center">
                  <p className="text-xs text-zinc-400">Bonus: Read your self-intro or say '저는 미국 사람입니다' aloud.</p>
                  
                  <div className="flex justify-center items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (rec.recording) {
                          rec.stop();
                        } else {
                          rec.start();
                        }
                      }}
                      disabled={speakingTranscribing || quizChecked}
                      className={`p-5 rounded-full transition ${
                        rec.recording
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-brand-500/10 text-brand-400 border border-brand-500/25 hover:bg-brand-500/20"
                      }`}
                      title={rec.recording ? "Stop Recording" : "Click to Record"}
                    >
                      {rec.recording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                    </button>

                    {rec.audioBlob && !rec.recording && !quizChecked && (
                      <button
                        onClick={handleSpeechEvaluate}
                        disabled={speakingTranscribing}
                        className="bg-zinc-850 hover:bg-zinc-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition border border-white/5 cursor-pointer"
                      >
                        {speakingTranscribing ? "Evaluating..." : "Evaluate Pronunciation"}
                      </button>
                    )}
                  </div>

                  {speakingResult && (
                    <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 text-left text-xs space-y-1">
                      <p className="font-black text-white">Score: {speakingResult.similarity_score.toFixed(0)}%</p>
                      <p className="text-zinc-400">Heard: "{speakingResult.transcription || "..."}"</p>
                    </div>
                  )}
                </div>
              )}

              {quizChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1.5 ${
                  quizCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold">{quizCorrect ? "Correct!" : "Incorrect."}</p>
                  <p><strong>Explanation:</strong> {quizBlueprint[quizIdx]?.explanation}</p>
                  {!quizCorrect && <p className="font-mono mt-1 text-zinc-400">Correct Answer: {quizBlueprint[quizIdx]?.correct_answer}</p>}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div />
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={
                      (quizBlueprint[quizIdx]?.type === "listening" || quizBlueprint[quizIdx]?.type === "context") 
                        ? !quizSelectedOpt 
                        : !quizWritingAns.trim()
                    }
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Checkpoint
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {finishingQuiz ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Submit Quiz & See Score"}</span>
                        <ChevronRight className="w-4 h-4 text-zinc-950" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 6: Homework & AI Self-Intro practice */}
      {step === 6 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0 animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Phase 2 Complete! 🇰🇷✨</h2>
            <p className="text-zinc-400 text-xs">You scored {quizScore}% on your identity check! You earned **150 XP**.</p>
          </div>

          {/* Practical Checklist Homework */}
          <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 text-left space-y-3">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Homework Checklist Tasks</span>
            <div className="space-y-2">
              {homeworkItems.map((hw) => {
                const isChecked = !!completedHomework[hw.id];
                return (
                  <div 
                    key={hw.id}
                    onClick={() => handleToggleHomework(hw.id, isChecked)}
                    className="flex items-center gap-3 p-3 bg-zinc-950/80 rounded-xl border border-white/5 cursor-pointer hover:bg-zinc-900 transition"
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                      isChecked ? "border-emerald-500 bg-emerald-500/15 text-emerald-400" : "border-white/10 bg-zinc-900"
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-xs text-zinc-300 ${isChecked ? "line-through text-zinc-500" : ""}`}>{hw.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI tutor self intro practice launcher */}
          <div className="p-5 bg-zinc-900/60 rounded-2xl border border-white/5 space-y-4">
            <div className="text-left space-y-1">
              <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider block">Special AI Practice Mode</span>
              <h4 className="text-xs font-bold text-white">Self-Introduction dialog coaching with Gwan-Sik</h4>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Starts a short, personal details chat session where Gwan-Sik asks for your name and origin, responding with polite greetings and corrections.
              </p>
            </div>

            {tutorSession ? (
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 text-left space-y-2">
                <span className="text-[9px] font-black text-brand-400 uppercase tracking-wider block">Greetings Coach Active Session</span>
                <p className="text-xs italic text-zinc-300 font-serif">"{tutorSession.opener}"</p>
                <div className="flex justify-end pt-1">
                  <a 
                    href={`/tutor?session=${tutorSession.session_id}`}
                    className="bg-brand-500 text-zinc-950 font-black px-3 py-1.5 rounded-lg text-[10px] hover:bg-brand-400 transition"
                  >
                    Enter Chat Room
                  </a>
                </div>
              </div>
            ) : (
              <button
                onClick={handleLaunchTutor}
                disabled={loadingTutor}
                className="w-full bg-zinc-950 hover:bg-zinc-900 text-brand-400 hover:text-brand-300 border border-brand-500/20 font-bold px-4 py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingTutor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                <span>Practice your self-intro with your AI tutor</span>
              </button>
            )}
          </div>

          <button
            onClick={onComplete}
            className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/20 cursor-pointer w-full max-w-xs"
          >
            <span>Finish Phase 2 & Earn XP</span>
            <ChevronRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      )}
      
      {/* Navigation bottom controls for non-quiz screens */}
      {step < 5 && step > 1 && (
        <div className="flex justify-between items-center py-4 border-t border-white/5 mt-6">
          <button 
            onClick={() => setStep(step - 1)} 
            className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button 
            onClick={() => setStep(step + 1)} 
            className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      
    </div>
  );
}
