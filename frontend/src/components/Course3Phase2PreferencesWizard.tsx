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
  const chunks = useRef<BlobPart[]>([]);

  const start = useCallback(async () => {
    setAudioBlob(null);
    chunks.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => chunks.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone access denied. Please allow microphone permissions and try again.");
    }
  }, []);

  const stop = useCallback(() => {
    mediaRef.current?.stop();
    setRecording(false);
  }, []);

  return { recording, audioBlob, start, stop, setAudioBlob };
}

interface Course3Phase2PreferencesWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course3Phase2PreferencesWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course3Phase2PreferencesWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 6;

  // DB Data loaded
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Card flipping tracking
  const [flippedPatternId, setFlippedPatternId] = useState<string | null>(null);

  // Activity 1 states (Comprehension)
  const [listeningItems, setListeningItems] = useState<any[]>([]);
  const [listeningIdx, setListeningIdx] = useState(0);
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningCorrect, setListeningCorrect] = useState<boolean | null>(null);

  // Activity 2 states (Preference Builder)
  const [builderTemplates, setBuilderTemplates] = useState<any>(null);
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState("like");
  const [selectedFrequency, setSelectedFrequency] = useState("자주");
  const [selectedReason, setSelectedReason] = useState("");

  const [builtSentence, setBuiltSentence] = useState<any>(null);
  const [building, setBuilding] = useState(false);
  const [savingSentence, setSavingSentence] = useState(false);
  const [sentenceSaved, setSentenceSaved] = useState(false);

  // Activity 2B: Habit Profile Builder
  const [profileLike, setProfileLike] = useState("김치");
  const [profileOften, setProfileOften] = useState("공부");
  const [profileDislike, setProfileDislike] = useState("축구");
  const [profileWeekend, setProfileWeekend] = useState("책 읽기");
  const [builtProfile, setBuiltProfile] = useState<any>(null);
  const [buildingProfile, setBuildingProfile] = useState(false);

  // Speaking evaluation states
  const rec = useRecorder();
  const [speakingTranscribing, setSpeakingTranscribing] = useState(false);
  const [speakingResult, setSpeakingResult] = useState<any>(null);

  // Quiz Checkpoint states
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizWritingAns, setQuizWritingAns] = useState("");
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Homework check states
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Tutor session launch states
  const [tutorSession, setTutorSession] = useState<any>(null);
  const [loadingTutor, setLoadingTutor] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/phases/korean2/2/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean2/2/core-data");
          setCoreData(res);
        } else if (step === 3 && listeningItems.length === 0) {
          const res_l = await apiJson("/practice/preferences/listening");
          setListeningItems(res_l.items || []);
        } else if (step === 4 && !builderTemplates) {
          const res_t = await apiJson("/practice/preferences/templates");
          setBuilderTemplates(res_t);
          if (res_t.categories?.length) {
            setSelectedActivity(res_t.categories[0].activities[0].ko);
            setProfileLike(res_t.categories[0].activities[0].ko);
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/quiz/korean2/phase-2/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/phases/korean2/2/homework");
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

  // Activity 1 Check
  const handleCheckListening = async () => {
    const current = listeningItems[listeningIdx];
    if (!current || !selectedOptId) return;

    try {
      const res = await apiJson("/practice/preferences/listening/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          summary_option_id: selectedOptId,
          time_taken_ms: 1000
        })
      });
      setListeningChecked(true);
      setListeningCorrect(res.correct);
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 2A Builder
  const handleBuildSentence = async () => {
    setBuilding(true);
    setBuiltSentence(null);
    setSentenceSaved(false);
    try {
      const res = await apiJson("/practice/preferences/build", {
        method: "POST",
        body: JSON.stringify({
          sentiment: selectedSentiment,
          frequency: selectedFrequency,
          activity: selectedActivity,
          reason: selectedReason
        })
      });
      setBuiltSentence(res);
    } catch (err) {
      console.error(err);
    } finally {
      setBuilding(false);
    }
  };

  const handleSaveSentence = async () => {
    if (!builtSentence) return;
    setSavingSentence(true);
    try {
      await apiJson("/users/preferences/save", {
        method: "POST",
        body: JSON.stringify({ routine_text: builtSentence.final_korean_text })
      });
      setSentenceSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSentence(false);
    }
  };

  // Activity 2B Habit profile builder
  const handleBuildHabitProfile = async () => {
    setBuildingProfile(true);
    setBuiltProfile(null);
    try {
      const res = await apiJson("/practice/preferences/profile", {
        method: "POST",
        body: JSON.stringify({
          like_act: profileLike,
          often_act: profileOften,
          dislike_act: profileDislike,
          weekend_act: profileWeekend
        })
      });
      setBuiltProfile(res);
    } catch (err) {
      console.error(err);
    } finally {
      setBuildingProfile(false);
    }
  };

  // Activity 2C: Speaking check
  const handleSpeechEvaluate = async () => {
    const target = builtProfile ? builtProfile.final_korean_text : "좋아해요.";
    if (!rec.audioBlob) return;
    setSpeakingTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("expected_text", target);
      fd.append("audio_file", rec.audioBlob, "recording.webm");
      const res = await apiForm("/practice/preferences/speaking", fd);
      setSpeakingResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSpeakingTranscribing(false);
    }
  };

  // Quiz check
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
    } else {
      setFinishingQuiz(true);
      try {
        const correctCount = quizBlueprint.length - quizMistakes.length;
        const score = Math.round((correctCount / quizBlueprint.length) * 100);
        await apiJson("/quiz/korean2/phase-2/finish", {
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

  // Homework check logging
  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/phases/korean2/2/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Tutor session launch
  const handleLaunchTutor = async () => {
    setLoadingTutor(true);
    try {
      const res = await apiJson("/conversation/a2/preferences-practice/start", { method: "POST" });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col justify-between max-w-2xl mx-auto w-full">
      {/* Top Header tracking */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-zinc-900 border border-white/10">
            <BookOpen className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg flex items-center gap-2">
              <span>{activeLesson?.title || "Habits, Likes & Dislikes"}</span>
            </h2>
            <p className="text-xs text-zinc-500">Curated Topic: Expressing Preferences & Hobbies</p>
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
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-4xl font-black text-white">Korean 2.2</h2>
          <h3 className="text-xl font-bold text-brand-400 mt-1">Habits, Likes & Dislikes</h3>
          
          <p className="text-zinc-300 text-sm leading-relaxed max-w-md mx-auto">
            {metadata?.description || "Talk about what you like doing, how often, and why."}
          </p>

          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-2 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Express likes, dislikes, and simple preferences about daily activities",
                "Combine habits with frequency words from Phase 1",
                "Understand simple conversations about hobbies and interests"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 25} minutes</p>
            <p><strong>📋 Prerequisites:</strong> completed Korean 2.1</p>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button 
              onClick={() => setStep(2)}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 2</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
          </div>

          {showOutline && (
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-1.5 animate-fade-in max-w-md mx-auto w-full font-mono">
              <p className="font-extrabold text-white text-center pb-2">Phase Activities Outline</p>
              <p>✓ Activity 1 – Sentiment pattern flips & grids</p>
              <p>✓ Activity 2 – Hobby lists & reason clauses</p>
              <p>✓ Activity 3 – Hobbies listening MCQs (likes vs dislikes)</p>
              <p>✓ Activity 4 – Sentiment sentence builders & speaking checks</p>
              <p>✓ Activity 5 – Graduating checkpoint mini-quiz checks</p>
            </div>
          )}
        </div>
      )}

      {/* Screen 2: Concept Explanation */}
      {step === 2 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-400" />
              <span>Talking About Preferences & Habits</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-2 text-xs leading-relaxed text-zinc-300 text-left">
            <p><strong>A2 Goal:</strong> At this level, you should be able to say what you like or don't like doing, how often you do it, and give short reasons.</p>
          </div>

          {/* Preference Patterns Flips */}
          <div className="space-y-2 text-left">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">1. Core Preference Patterns (Frames)</span>
            <div className="grid grid-cols-2 gap-3">
              {coreData?.preference_patterns?.map((pp: any) => {
                const isFlipped = flippedPatternId === pp.id;
                return (
                  <div
                    key={pp.id}
                    onClick={() => {
                      setFlippedPatternId(isFlipped ? null : pp.id);
                      playAudio(pp.korean);
                    }}
                    className={`glass-panel p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col justify-between h-24 ${
                      isFlipped ? "border-brand-500 bg-brand-500/5 shadow-[0_0_15px_rgba(79,70,229,0.1)]" : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">A2 Frame</span>
                      <button onClick={(e) => { e.stopPropagation(); playAudio(pp.korean); }} className="p-1 rounded bg-zinc-950/40 text-zinc-400"><Volume2 className="w-3.5 h-3.5" /></button>
                    </div>

                    {!isFlipped ? (
                      <div className="py-1">
                        <div className="text-sm font-black text-white font-korean">{pp.korean}</div>
                        <div className="text-[9px] text-zinc-500">{pp.romanization}</div>
                      </div>
                    ) : (
                      <div className="animate-fade-in text-left space-y-0.5">
                        <div className="text-xs font-black text-white">{pp.english}</div>
                        <p className="text-[8px] text-zinc-500 font-mono leading-tight">{pp.note}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Example Monologue */}
          {coreData?.example_monologues?.[0] && (
            <div className="space-y-2 text-left">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">2. Example Hobbies Monologue</span>
              <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 space-y-3">
                <p className="font-korean font-bold text-sm leading-relaxed text-white">
                  {coreData.example_monologues[0].ko}
                </p>
                <p className="text-xs text-zinc-400">{coreData.example_monologues[0].en}</p>
                <div className="flex justify-end">
                  <button onClick={() => playAudio(coreData.example_monologues[0].ko)} className="p-2 rounded bg-zinc-900 text-zinc-400 hover:text-white"><Volume2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Recognition */}
      {step === 3 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Activity 1 – Likes & Dislikes Recognition</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {listeningItems.length > 0 && (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              {/* Question bubble */}
              <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="text-left space-y-1 text-center">
                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">
                    {listeningItems[listeningIdx]?.type === "like/dislike" 
                      ? "Part A: Identify Sentiment (Likes vs Dislikes)" 
                      : "Part B: Identify Hobby / Activity"}
                  </span>
                  <p className="text-xs text-zinc-300">Listen to the speaker's statement:</p>
                </div>

                <div className="flex justify-center">
                  <button onClick={() => playAudio(listeningItems[listeningIdx]?.audio_url)} className="p-4 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-brand-400 rounded-full transition flex items-center justify-center cursor-pointer shadow-md"><Volume2 className="w-6 h-6" /></button>
                </div>

                <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
                  {listeningItems[listeningIdx]?.options.map((opt: any) => (
                    <button
                      key={opt.id}
                      onClick={() => !listeningChecked && setSelectedOptId(opt.id)}
                      disabled={listeningChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                        selectedOptId === opt.id
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      } ${listeningChecked && opt.id === listeningItems[listeningIdx]?.correct_id ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>

                {listeningChecked && (
                  <div className={`p-3 rounded-xl border text-xs text-center ${
                    listeningCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}>
                    {listeningCorrect ? "Correct!" : "Incorrect."}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  {!listeningChecked ? (
                    <button
                      onClick={handleCheckListening}
                      disabled={!selectedOptId}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setListeningChecked(false);
                        setSelectedOptId(null);
                        setListeningCorrect(null);
                        if (listeningIdx < listeningItems.length - 1) {
                          setListeningIdx(listeningIdx + 1);
                        } else {
                          setListeningIdx(0);
                        }
                      }}
                      className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Next Item
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(2)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 2: Preference Builder & Habit Profile */}
      {step === 4 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Activity 2 – Preference Builder & Habits</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          {/* Part A: Preference sentence builder */}
          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Part A: Preference sentence builder</h3>
            
            <div className="space-y-3">
              {/* Category tabs selection */}
              <div className="space-y-1">
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-black">Choose Thematic Category</span>
                <div className="flex gap-2">
                  {builderTemplates?.categories?.map((cat: any, idx: number) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategoryIdx(idx);
                        if (cat.activities?.length) {
                          setSelectedActivity(cat.activities[0].ko);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition cursor-pointer ${
                        selectedCategoryIdx === idx
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity selection */}
              <div className="space-y-1">
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-black">Choose Activity</span>
                <select
                  value={selectedActivity}
                  onChange={(e) => setSelectedActivity(e.target.value)}
                  className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white focus:outline-none"
                >
                  {builderTemplates?.categories?.[selectedCategoryIdx]?.activities?.map((act: any) => (
                    <option key={act.ko} value={act.ko}>{act.ko} ({act.en})</option>
                  ))}
                </select>
              </div>

              {/* Sentiment sentiment choices */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-500 uppercase">Sentiment</label>
                  <select
                    value={selectedSentiment}
                    onChange={(e) => setSelectedSentiment(e.target.value)}
                    className="w-full bg-zinc-950 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                  >
                    {builderTemplates?.sentiments?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.ko} ({s.en})</option>
                    ))}
                  </select>
                </div>

                {/* Frequency choices */}
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-500 uppercase">Frequency</label>
                  <select
                    value={selectedFrequency}
                    onChange={(e) => setSelectedFrequency(e.target.value)}
                    className="w-full bg-zinc-950 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                  >
                    <option value="">(None)</option>
                    {builderTemplates?.frequencies?.map((f: any) => (
                      <option key={f.ko} value={f.ko}>{f.ko} ({f.en})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reason choices */}
              <div className="space-y-1">
                <label className="text-[8px] text-zinc-500 uppercase tracking-widest block font-black">Add Reason (optional)</label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs text-white focus:outline-none"
                >
                  <option value="">(None)</option>
                  {builderTemplates?.reasons?.map((r: any) => (
                    <option key={r.ko} value={r.ko}>{r.ko} ({r.en})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={handleBuildSentence}
                disabled={building}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-5 rounded-xl text-xs transition cursor-pointer"
              >
                {building ? "Assembling..." : "Assemble Preference"}
              </button>
            </div>

            {builtSentence && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 space-y-3 animate-fade-in text-center">
                <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Generated Sentence</span>
                <p className="text-base font-black text-white font-korean leading-relaxed">{builtSentence.final_korean_text}</p>
                
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => playAudio(builtSentence.final_korean_text)}
                    className="p-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-full border border-brand-500/20 transition cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleSaveSentence}
                    disabled={savingSentence || sentenceSaved}
                    className="bg-accent-teal hover:bg-accent-teal/95 disabled:opacity-50 text-zinc-950 font-black py-1.5 px-4 rounded-lg text-xs transition cursor-pointer"
                  >
                    {savingSentence ? "Saving..." : sentenceSaved ? "Saved Preference!" : "Save Preference"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Part B: Habit Profile builder */}
          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Part B: Habit Profile Paragraph</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-500 uppercase">1. What do you like?</label>
                  <input
                    type="text"
                    value={profileLike}
                    onChange={(e) => setProfileLike(e.target.value)}
                    className="w-full bg-zinc-950 p-2 rounded border border-white/5 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-500 uppercase">2. What do you often do?</label>
                  <input
                    type="text"
                    value={profileOften}
                    onChange={(e) => setProfileOften(e.target.value)}
                    className="w-full bg-zinc-950 p-2 rounded border border-white/5 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-500 uppercase">3. What do you dislike?</label>
                  <input
                    type="text"
                    value={profileDislike}
                    onChange={(e) => setProfileDislike(e.target.value)}
                    className="w-full bg-zinc-950 p-2 rounded border border-white/5 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-500 uppercase">4. Weekend activity?</label>
                  <input
                    type="text"
                    value={profileWeekend}
                    onChange={(e) => setProfileWeekend(e.target.value)}
                    className="w-full bg-zinc-950 p-2 rounded border border-white/5 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-center pt-1">
                <button
                  onClick={handleBuildHabitProfile}
                  disabled={buildingProfile}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-5 rounded-xl text-xs transition cursor-pointer"
                >
                  {buildingProfile ? "Assembling..." : "Assemble Habit Profile Paragraph"}
                </button>
              </div>

              {builtProfile && (
                <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 space-y-3 animate-fade-in text-center">
                  <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Habit Profile Paragraph</span>
                  <p className="text-sm font-black text-white font-korean leading-relaxed">{builtProfile.final_korean_text}</p>
                  
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => playAudio(builtProfile.final_korean_text)}
                      className="p-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-full border border-brand-500/20 transition cursor-pointer"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Part C: Optional speaking practice */}
          {builtProfile && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-center">
              <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Part C: Speaking practice (Read Profile)</h3>
              <p className="text-xs text-zinc-400">Record yourself reading your assembled habit profile aloud:</p>

              <div className="flex justify-center items-center gap-3">
                <button
                  onMouseDown={rec.start}
                  onMouseUp={rec.stop}
                  onTouchStart={rec.start}
                  onTouchEnd={rec.stop}
                  disabled={speakingTranscribing}
                  className={`p-5 rounded-full transition ${
                    rec.recording
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-brand-500/10 text-brand-400 border border-brand-500/25 hover:bg-brand-500/20"
                  }`}
                >
                  {rec.recording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>

                {rec.audioBlob && !rec.recording && (
                  <button
                    onClick={handleSpeechEvaluate}
                    disabled={speakingTranscribing}
                    className="bg-zinc-850 hover:bg-zinc-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition border border-white/5 cursor-pointer"
                  >
                    {speakingTranscribing ? "Evaluating..." : "Verify Pronunciation"}
                  </button>
                )}
              </div>

              {speakingResult && (
                <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 text-left text-xs space-y-1 max-w-sm mx-auto">
                  <p className="font-black text-white">Score Accuracy: {speakingResult.similarity_score.toFixed(0)}%</p>
                  <p className="text-zinc-400 font-mono">Recognized: "{speakingResult.recognized_text || "..."}"</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(3)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Mini-Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Checkpoint Quiz */}
      {step === 5 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-400" />
              <span>Mini-Quiz: Habits & Preferences</span>
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
                  <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
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
                      } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10" : ""}`}
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
                  {!quizChecked && (
                    <div className="flex gap-1.5 justify-center flex-wrap pt-2">
                      {["좋아해요", "안 좋아해요", "정말", "별로", "재미있기", "때문에", "축구", "요리"].map(ch => (
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

      {/* Screen 6: Homework & Gwan-Sik Coaching */}
      {step === 6 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0 animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Phase 2 Complete! 🇰🇷✨</h2>
            <p className="text-zinc-400 text-xs">You scored {quizScore}% on your habits check! You earned **150 XP**.</p>
            <p className="text-accent-teal text-sm font-extrabold mt-1">Level 3: Phase 2 Completed successfully!</p>
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

          {/* AI practice button */}
          <div className="p-5 bg-zinc-900/60 rounded-2xl border border-white/5 space-y-4">
            <div className="text-left space-y-1">
              <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider block">Special AI Practice Mode</span>
              <h4 className="text-xs font-bold text-white">Hobbies roleplay with Gwan-Sik</h4>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Open a dialogue coaching chat where Gwan-Sik asks about your preferences, verifying positive/negative frames and frequency modifiers.
              </p>
            </div>

            {tutorSession ? (
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 text-left space-y-2">
                <span className="text-[9px] font-black text-brand-400 uppercase tracking-wider block">Coach Active Session</span>
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
                <span>Practice hobbies & preferences with Gwan-Sik</span>
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
            className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button 
            onClick={() => setStep(step + 1)} 
            className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
