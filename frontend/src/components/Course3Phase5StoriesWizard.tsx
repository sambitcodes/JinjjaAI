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
  MessageSquare,
  ArrowRight
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

interface Course3Phase5StoriesWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course3Phase5StoriesWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course3Phase5StoriesWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 6;

  // Data loaded
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Concept interaction
  const [selectedAnchorType, setSelectedAnchorType] = useState<string | null>(null);

  // Activity 1: Listening
  const [listeningItems, setListeningItems] = useState<any[]>([]);
  const [listeningIdx, setListeningIdx] = useState(0);
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(null);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningCorrect, setListeningCorrect] = useState<boolean | null>(null);
  
  // Timeline questions
  const [timelineAnswers, setTimelineAnswers] = useState<Record<string, string>>({});
  const [timelineChecked, setTimelineChecked] = useState(false);
  const [timelineCorrect, setTimelineCorrect] = useState<Record<string, boolean>>({});

  // Activity 2: Builder
  const [builderTemplates, setBuilderTemplates] = useState<any>(null);
  const [pastAnchor, setPastAnchor] = useState<string>("");
  const [pastActivity, setPastActivity] = useState<string>("");
  const [presentAnchor, setPresentAnchor] = useState<string>("");
  const [presentActivity, setPresentActivity] = useState<string>("");
  const [futureAnchor, setFutureAnchor] = useState<string>("");
  const [futureActivity, setFutureActivity] = useState<string>("");

  const [builtParagraph, setBuiltParagraph] = useState<any>(null);
  const [building, setBuilding] = useState(false);
  const [savingParagraph, setSavingParagraph] = useState(false);
  const [paragraphSaved, setParagraphSaved] = useState(false);

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
          const res = await apiJson("/phases/korean2/5/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean2/5/core-data");
          setCoreData(res);
        } else if (step === 3 && listeningItems.length === 0) {
          const res_l = await apiJson("/practice/daily-stories/listening");
          setListeningItems(res_l.items || []);
        } else if (step === 4) {
          if (!builderTemplates) {
            const res_t = await apiJson("/practice/daily-stories/templates");
            setBuilderTemplates(res_t);
            // set defaults
            if (res_t.anchors && res_t.activities) {
              setPastAnchor(res_t.anchors.past[0]);
              setPresentAnchor(res_t.anchors.present[0]);
              setFutureAnchor(res_t.anchors.future[0]);
              
              setPastActivity(res_t.activities.past[0].past_ko);
              setPresentActivity(res_t.activities.present[0].present_ko);
              setFutureActivity(res_t.activities.future[0].future_ko);
            }
          }
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res_q = await apiJson("/quiz/korean2/phase-5/start", { method: "POST" });
          setQuizBlueprint(res_q.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/phases/korean2/5/homework");
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

  // Activity 1A listening check
  const handleCheckListeningSummary = async () => {
    const current = listeningItems[listeningIdx];
    if (!current || !selectedSummaryId) return;

    try {
      const res = await apiJson("/practice/daily-stories/listening/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          summary_option_id: selectedSummaryId,
          time_taken_ms: 1000
        })
      });
      setListeningChecked(true);
      setListeningCorrect(res.correct);
    } catch (err) {
      console.error(err);
    }
  };

  // Activity 1B listening details check
  const handleCheckListeningDetails = () => {
    const current = listeningItems[listeningIdx];
    if (!current) return;

    const results: Record<string, boolean> = {};
    current.timeline_questions.forEach((q: any) => {
      const userAns = timelineAnswers[q.question];
      const isCorrect = userAns === q.correct_answer;
      results[q.question] = isCorrect;
    });

    setTimelineChecked(true);
    setTimelineCorrect(results);
  };

  // Build connected paragraph
  const handleBuildParagraph = async () => {
    setBuilding(true);
    setBuiltParagraph(null);
    setParagraphSaved(false);
    try {
      const res = await apiJson("/practice/daily-stories/build", {
        method: "POST",
        body: JSON.stringify({ 
          past_anchor: pastAnchor, 
          past_activity: pastActivity,
          present_anchor: presentAnchor,
          present_activity: presentActivity,
          future_anchor: futureAnchor,
          future_activity: futureActivity
        })
      });
      setBuiltParagraph(res);
    } catch (err) {
      console.error(err);
    } finally {
      setBuilding(false);
    }
  };

  const handleSaveParagraph = async () => {
    if (!builtParagraph) return;
    setSavingParagraph(true);
    try {
      await apiJson("/users/week-story/save", {
        method: "POST",
        body: JSON.stringify({ routine_text: builtParagraph.final_korean_text })
      });
      setParagraphSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingParagraph(false);
    }
  };

  // Speaking evaluation
  const handleSpeechEvaluate = async () => {
    const target = builtParagraph ? builtParagraph.final_korean_text : "어제 친구를 만났어요. 오늘 일해요. 내일 청소할 거예요.";
    if (!rec.audioBlob) return;
    setSpeakingTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("expected_text", target);
      fd.append("audio_file", rec.audioBlob, "recording.webm");
      const res = await apiForm("/practice/daily-stories/speaking", fd);
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
    if (current.type !== "writing") {
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
        await apiJson("/quiz/korean2/phase-5/finish", {
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
      await apiJson("/phases/korean2/5/homework/check", {
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
      const res = await apiJson("/conversation/a2/daily-story-practice/start", { method: "POST" });
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
              <span>{activeLesson?.title || "Daily Life Stories (Past-Present-Future)"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Curated Topic: Korean Multi-Tense Synthesis</p>
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
          
          <h2 className="text-4xl font-black text-white">Korean 2.5</h2>
          <h3 className="text-xl font-bold text-brand-400 mt-1 font-serif">Daily Life Stories (Past–Present–Future)</h3>
          
          <p className="text-zinc-300 text-sm leading-relaxed max-w-md mx-auto">
            {metadata?.description || "Tell short stories about your life across yesterday, today, and tomorrow in simple connected sentences."}
          </p>

          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-2 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Combine past, present, and future sentences about daily life",
                "Describe your week in simple, connected sentences",
                "Understand short stories about someone’s past, present, and future plans"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 25} minutes</p>
            <p><strong>📋 Prerequisites:</strong> completed {metadata?.prerequisites || "Korean 2.4"}</p>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button 
              onClick={() => setStep(2)}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 5</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
          </div>

          {showOutline && (
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-1.5 animate-fade-in max-w-md mx-auto w-full font-mono">
              <p className="font-extrabold text-white text-center pb-2">Phase Activities Outline</p>
              <p>✓ Activity 1 – Past, present, future time anchors</p>
              <p>✓ Activity 2 – 3-part timeline story frames</p>
              <p>✓ Activity 3 – Daily life stories listening summaries</p>
              <p>✓ Activity 4 – Multi-tense story paragraph builder</p>
              <p>✓ Activity 5 – Speaking voice checkpoint check feedback</p>
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
              <span>Linking Yesterday–Today–Tomorrow</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-2 text-xs leading-relaxed text-zinc-300 text-left">
            <p><strong>Connecting Tenses:</strong> To create cohesive stories about your daily life, anchor your descriptions with timeline markers. Follow the structure of combining past activities, present habits, and future plans in sequence.</p>
          </div>

          {/* Time Anchors Grid */}
          <div className="space-y-2 text-left">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">1. Time Anchors (Tense Markers)</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {coreData?.time_anchors?.map((t: any, idx: number) => {
                const isSelected = selectedAnchorType === t.type;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedAnchorType(isSelected ? null : t.type);
                      playAudio(t.ko);
                    }}
                    className={`glass-panel p-2.5 rounded-2xl border text-center transition cursor-pointer flex flex-col justify-between h-20 ${
                      isSelected ? "border-brand-500 bg-brand-500/5" : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest">{t.type}</span>
                      <button onClick={(e) => { e.stopPropagation(); playAudio(t.ko); }} className="p-1 rounded bg-zinc-950/40 text-zinc-400"><Volume2 className="w-3 h-3" /></button>
                    </div>
                    <div className="py-0.5">
                      <div className="text-sm font-black text-white font-korean">{t.ko}</div>
                      <div className="text-[9px] text-zinc-400">{t.en}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Timeline */}
          <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 text-left space-y-3">
            <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest block font-bold">2. Story Timeline Structure</span>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="p-2.5 bg-zinc-900 border border-red-500/25 rounded-xl w-full text-center">
                <span className="text-red-400 font-bold block">Past (어제)</span>
                <span className="text-[10px] text-zinc-400">...했지 / ...했어요</span>
              </div>
              <div className="text-zinc-500">→</div>
              <div className="p-2.5 bg-zinc-900 border border-green-500/25 rounded-xl w-full text-center">
                <span className="text-green-400 font-bold block">Present (오늘)</span>
                <span className="text-[10px] text-zinc-400">...해요 / ...하고 있어요</span>
              </div>
              <div className="text-zinc-500">→</div>
              <div className="p-2.5 bg-zinc-900 border border-cyan-500/25 rounded-xl w-full text-center">
                <span className="text-cyan-400 font-bold block">Future (내일)</span>
                <span className="text-[10px] text-zinc-400">...할 거예요 / ...려고 해요</span>
              </div>
            </div>
          </div>

          {/* Example Stories */}
          {coreData?.story_examples?.[0] && (
            <div className="space-y-2 text-left">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">3. Multi-Tense Connected Story</span>
              <div className="p-4 bg-zinc-950 rounded-xl border border-white/5 space-y-3">
                <p className="font-korean font-bold text-sm leading-relaxed text-white">
                  <span className="text-red-400">지난 주말에</span> 저는 집에서 푹 <span className="text-red-400">쉬었어요</span>. <span className="text-green-400">오늘</span> 바빠요. 회사에서 <span className="text-green-400">일해요</span>. <span className="text-cyan-400">다음 주에</span> 친구랑 여행을 <span className="text-cyan-400">갈 거예요</span>.
                </p>
                <p className="text-xs text-zinc-400">{coreData.story_examples[0].en}</p>
                <div className="flex justify-end">
                  <button onClick={() => playAudio(coreData.story_examples[0].ko)} className="p-2 rounded bg-zinc-900 text-zinc-400 hover:text-white"><Volume2 className="w-4 h-4" /></button>
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

      {/* Screen 3: Activity 1: Listening */}
      {step === 3 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Activity 1 – Timeline Story Comprehension</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {listeningItems.length > 0 && (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              {/* Part A: Choose correct summary */}
              <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="text-left text-center">
                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Part A: Listen & Choose Overall Summary</span>
                  <p className="text-xs text-zinc-300 mt-1">Listen to the chronological life story:</p>
                </div>

                <div className="flex justify-center">
                  <button onClick={() => playAudio(listeningItems[listeningIdx]?.audio_url)} className="p-4 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-brand-400 rounded-full transition flex items-center justify-center cursor-pointer shadow-md"><Volume2 className="w-6 h-6" /></button>
                </div>

                <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                  {listeningItems[listeningIdx]?.options.map((opt: any) => (
                    <button
                      key={opt.id}
                      onClick={() => !listeningChecked && setSelectedSummaryId(opt.id)}
                      disabled={listeningChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                        selectedSummaryId === opt.id
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
                    {listeningCorrect ? "Correct! Timeline summary is valid." : "Incorrect summary match."}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  {!listeningChecked && (
                    <button
                      onClick={handleCheckListeningSummary}
                      disabled={!selectedSummaryId}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Verify Summary
                    </button>
                  )}
                </div>
              </div>

              {/* Part B: Timeline Questions */}
              {listeningChecked && (
                <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block text-center">Part B: Timeline Detail Questions</span>
                  
                  {listeningItems[listeningIdx]?.timeline_questions.map((q: any, qidx: number) => (
                    <div key={qidx} className="space-y-2">
                      <p className="text-xs text-white font-bold">{q.question}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {q.options.map((opt: string) => (
                          <button
                            key={opt}
                            onClick={() => !timelineChecked && setTimelineAnswers(prev => ({ ...prev, [q.question]: opt }))}
                            disabled={timelineChecked}
                            className={`p-2 rounded-xl border text-xs font-bold transition ${
                              timelineAnswers[q.question] === opt
                                ? "border-brand-500 bg-brand-500/10 text-white"
                                : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                            } ${timelineChecked && opt === q.correct_answer ? "border-accent-teal bg-accent-teal/15 text-white" : ""} ${
                              timelineChecked && timelineAnswers[q.question] === opt && !timelineCorrect[q.question] ? "border-red-500 bg-red-500/15" : ""
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {timelineChecked && (
                    <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-center text-zinc-400 space-y-1">
                      {Object.values(timelineCorrect).every(v => v) ? (
                        <p className="text-accent-teal font-bold">Excellent! All details are correct.</p>
                      ) : (
                        <p className="text-red-400">Some answers are incorrect. Review the explanations.</p>
                      )}
                      {listeningItems[listeningIdx]?.timeline_questions.map((q: any, idx: number) => (
                        <p key={idx} className="text-[10px] text-left text-zinc-500 mt-1">
                          <strong>Q{idx+1}:</strong> {q.explanation}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    {!timelineChecked ? (
                      <button
                        onClick={handleCheckListeningDetails}
                        disabled={Object.keys(timelineAnswers).length !== listeningItems[listeningIdx]?.timeline_questions.length}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Verify Details
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setListeningChecked(false);
                          setSelectedSummaryId(null);
                          setListeningCorrect(null);
                          setTimelineAnswers({});
                          setTimelineChecked(false);
                          setTimelineCorrect({});
                          if (listeningIdx < listeningItems.length - 1) {
                            setListeningIdx(listeningIdx + 1);
                          } else {
                            setListeningIdx(0);
                          }
                        }}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Reset / Next
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(2)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 2: Build & Tell My Week Story */}
      {step === 4 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Activity 2 – My Week Story Builder</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider text-left">Part A: Select Anchors & Activities</h3>

            {builderTemplates && (
              <div className="space-y-4">
                {/* Past Tense Row */}
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/5 text-left space-y-3">
                  <span className="text-xs font-extrabold text-white block">1. Past Routine:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={pastAnchor}
                      onChange={(e) => setPastAnchor(e.target.value)}
                      className="bg-zinc-900 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                    >
                      {builderTemplates.anchors.past.map((a: string) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>

                    <select
                      value={pastActivity}
                      onChange={(e) => setPastActivity(e.target.value)}
                      className="bg-zinc-900 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                    >
                      {builderTemplates.activities.past.map((act: any) => (
                        <option key={act.past_ko} value={act.past_ko}>{act.past_ko} ({act.en})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Present Tense Row */}
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/5 text-left space-y-3">
                  <span className="text-xs font-extrabold text-white block">2. Present Routine:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={presentAnchor}
                      onChange={(e) => setPresentAnchor(e.target.value)}
                      className="bg-zinc-900 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                    >
                      {builderTemplates.anchors.present.map((a: string) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>

                    <select
                      value={presentActivity}
                      onChange={(e) => setPresentActivity(e.target.value)}
                      className="bg-zinc-900 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                    >
                      {builderTemplates.activities.present.map((act: any) => (
                        <option key={act.present_ko} value={act.present_ko}>{act.present_ko} ({act.en})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Future Tense Row */}
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/5 text-left space-y-3">
                  <span className="text-xs font-extrabold text-white block">3. Future Intent:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={futureAnchor}
                      onChange={(e) => setFutureAnchor(e.target.value)}
                      className="bg-zinc-900 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                    >
                      {builderTemplates.anchors.future.map((a: string) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>

                    <select
                      value={futureActivity}
                      onChange={(e) => setFutureActivity(e.target.value)}
                      className="bg-zinc-900 p-2 rounded border border-white/5 text-xs text-white focus:outline-none"
                    >
                      {builderTemplates.activities.future.map((act: any) => (
                        <option key={act.future_ko} value={act.future_ko}>{act.future_ko} ({act.en})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-1">
              <button
                onClick={handleBuildParagraph}
                disabled={building}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition cursor-pointer"
              >
                {building ? "Compiling Story..." : "Compile Story"}
              </button>
            </div>

            {builtParagraph && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/25 space-y-3 animate-fade-in text-center">
                <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Compiled A2 Story</span>
                <p className="text-base font-black text-white font-korean leading-relaxed">{builtParagraph.final_korean_text}</p>
                
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => playAudio(builtParagraph.final_korean_text)}
                    className="p-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-full border border-brand-500/20 transition cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleSaveParagraph}
                    disabled={savingParagraph || paragraphSaved}
                    className="bg-accent-teal hover:bg-accent-teal/95 disabled:opacity-50 text-zinc-950 font-black py-1.5 px-4 rounded-lg text-xs transition cursor-pointer"
                  >
                    {savingParagraph ? "Saving..." : paragraphSaved ? "Saved Story!" : "Save Story to Profile"}
                  </button>
                </div>

                {/* Speak story */}
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Part B: Speak & Verify Story</span>
                  <div className="flex justify-center items-center gap-3">
                    <button
                      onMouseDown={rec.start}
                      onMouseUp={rec.stop}
                      onTouchStart={rec.start}
                      onTouchEnd={rec.stop}
                      disabled={speakingTranscribing}
                      className={`p-4 rounded-full transition ${
                        rec.recording
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-brand-500/10 text-brand-400 border border-brand-500/25 hover:bg-brand-500/20"
                      }`}
                    >
                      {rec.recording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    <div className="text-left text-xs">
                      <p className="font-bold text-white">{rec.recording ? "Recording... Release to submit" : "Hold to Record Story"}</p>
                      <p className="text-[10px] text-zinc-500">Read your multi-tense story aloud</p>
                    </div>
                  </div>

                  {rec.audioBlob && !speakingTranscribing && !speakingResult && (
                    <button
                      onClick={handleSpeechEvaluate}
                      className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition mx-auto block cursor-pointer"
                    >
                      Evaluate Recording
                    </button>
                  )}

                  {speakingTranscribing && (
                    <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                      <span>Transcribing your week story...</span>
                    </div>
                  )}

                  {speakingResult && (
                    <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 text-left text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 font-bold">Accuracy Score:</span>
                        <span className="text-accent-teal font-black">{speakingResult.similarity_score}%</span>
                      </div>
                      <p className="text-zinc-500 text-[10px]">Recognized: "{speakingResult.recognized_text}"</p>
                      <p className="text-zinc-400 italic text-[10px]">Feedback: {speakingResult.feedback}</p>
                      <button onClick={() => setSpeakingResult(null)} className="text-[9px] text-brand-400 hover:underline">Re-record</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(3)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">Start Checkpoint Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Mini-Quiz Checkpoint */}
      {step === 5 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-400" />
              <span>Step 5 – Mini-Quiz (Phase 5 Checkpoint)</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Q {quizIdx + 1}/{quizBlueprint.length}</span>
          </div>

          {quizBlueprint.length > 0 && (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>Quiz Question</span>
                <span>Type: {quizBlueprint[quizIdx]?.type}</span>
              </div>

              <h3 className="text-base font-extrabold text-white text-center leading-relaxed">
                {quizBlueprint[quizIdx]?.question}
              </h3>

              {quizBlueprint[quizIdx]?.type === "listening" && (
                <div className="flex justify-center py-2">
                  <button onClick={() => playAudio(quizBlueprint[quizIdx]?.audio_url)} className="p-3 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-full transition cursor-pointer"><Volume2 className="w-5 h-5" /></button>
                </div>
              )}

              {quizBlueprint[quizIdx]?.type !== "writing" ? (
                <div className="grid grid-cols-1 gap-2.5 max-w-md mx-auto">
                  {quizBlueprint[quizIdx]?.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                      disabled={quizChecked}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                        quizSelectedOpt === opt
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/15 text-white" : ""}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 max-w-md mx-auto">
                  <input
                    type="text"
                    value={quizWritingAns}
                    onChange={(e) => setQuizWritingAns(e.target.value)}
                    placeholder="Type Korean spelling here..."
                    className="w-full bg-zinc-950 p-3 rounded-xl border border-white/10 outline-none focus:border-brand-500 text-center font-sans text-sm text-white"
                    disabled={quizChecked}
                    onKeyDown={(e) => e.key === "Enter" && !quizChecked && handleCheckQuiz()}
                  />
                </div>
              )}

              {quizChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                  quizCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}>
                  <p className="font-extrabold">{quizCorrect ? "Correct!" : "Incorrect."}</p>
                  <p>{quizBlueprint[quizIdx]?.explanation}</p>
                  {!quizCorrect && <p className="font-mono mt-1 text-zinc-400">Correct Answer: {quizBlueprint[quizIdx]?.correct_answer}</p>}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div />
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={quizBlueprint[quizIdx]?.type !== "writing" ? !quizSelectedOpt : !quizWritingAns.trim()}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {finishingQuiz ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Graduating...</span>
                      </>
                    ) : (
                      <>
                        <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "See Final Score"}</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 6: Complete & Homework Panel */}
      {step === 6 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center max-w-xl mx-auto">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400">
            <Award className="w-10 h-10 animate-bounce" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white font-sans font-serif">A2 Course Synthesis Graduated! 🇰🇷✨</h2>
            <p className="text-zinc-400 text-xs mt-1">You scored {quizScore}% on the daily life stories checkpoint.</p>
          </div>

          {/* Homework checklist */}
          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs space-y-3 w-full">
            <span className="text-[9px] text-zinc-500 font-mono font-black uppercase tracking-wider block">Practical A2 Capstone Homework</span>
            
            <div className="space-y-2">
              {homeworkItems.map((item) => {
                const isChecked = !!completedHomework[item.id];
                return (
                  <div key={item.id} className="flex items-start gap-3 p-2 bg-zinc-950/40 rounded-xl border border-white/[0.02] hover:border-white/5 transition">
                    <button
                      onClick={() => handleToggleHomework(item.id, isChecked)}
                      className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center transition cursor-pointer ${
                        isChecked ? "bg-accent-teal border-accent-teal text-zinc-950" : "border-white/10 bg-zinc-900"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <span className={`text-zinc-300 text-xs leading-normal ${isChecked ? "line-through text-zinc-500" : ""}`}>{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI practice button */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-brand-500/10 space-y-3">
            <div className="text-left space-y-1 text-center">
              <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block font-sans">Start Capstone Speaking Practice</span>
              <p className="text-[11px] text-zinc-500">Engage in a multi-turn RAG discussion telling Gwan-Sik your week story.</p>
            </div>

            {!tutorSession ? (
              <button
                onClick={handleLaunchTutor}
                disabled={loadingTutor}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                {loadingTutor ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                <span>Practice Storytelling with AI Tutor</span>
              </button>
            ) : (
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/5 text-xs text-center space-y-3 animate-fade-in">
                <p className="text-zinc-300 font-medium">Room launched! Opener: <strong>"{tutorSession.opener}"</strong></p>
                <a
                  href={`/conversation?session_id=${tutorSession.session_id}`}
                  className="bg-accent-teal hover:bg-accent-teal/90 text-zinc-950 font-black py-2 px-6 rounded-lg text-xs transition inline-flex items-center gap-1"
                >
                  <span>Enter AI Chat Room</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button 
              onClick={() => {
                setStep(5);
                setQuizIdx(0);
                setQuizSelectedOpt(null);
                setQuizWritingAns("");
                setQuizChecked(false);
                setQuizCorrect(null);
                setQuizMistakes([]);
                setQuizScore(null);
              }}
              className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition cursor-pointer"
            >
              Retake Checkpoint
            </button>
            <button 
              onClick={onComplete}
              className="bg-gradient-to-r from-brand-500 to-amber-500 text-zinc-950 font-black px-6 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow shadow-brand-500/25"
            >
              <span>Complete & Graduate Course!</span>
              <ChevronRight className="w-4 h-4 text-zinc-950" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
