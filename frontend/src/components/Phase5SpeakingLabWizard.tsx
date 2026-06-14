"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  BarChart2,
  Award,
  RefreshCw,
  Play,
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

// ---------------------------------------------------------------------------
// Shared: Audio recording hook
// ---------------------------------------------------------------------------
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
      alert("Microphone access denied. Please allow microphone permissions in your browser and try again.");
    }
  }, []);

  const stop = useCallback(() => {
    mediaRef.current?.stop();
    setRecording(false);
  }, []);

  return { recording, audioBlob, start, stop, setAudioBlob };
}

// ---------------------------------------------------------------------------
// Shared: Score bar component
// ---------------------------------------------------------------------------
function ScoreBar({ score, label }: { score: number; label?: string }) {
  const color =
    score >= 80 ? "bg-emerald-500" : score >= 55 ? "bg-amber-400" : "bg-red-500";
  const textColor =
    score >= 80 ? "text-emerald-400" : score >= 55 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-1">
      {label && <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-sans">{label}</span>}
      <div className="flex items-center gap-3">
        <div className="flex-grow h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} rounded-full transition-all duration-700`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
        <span className={`text-sm font-black ${textColor} w-12 text-right`}>{score.toFixed(0)}/100</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared: Word diff display
// ---------------------------------------------------------------------------
function WordDiffRow({ diffs }: { diffs: Array<{ word: string; status: string }> }) {
  if (!diffs?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 justify-center py-2">
      {diffs.map((d, i) => (
        <span
          key={i}
          className={`px-2 py-0.5 rounded text-sm font-bold ${
            d.status === "correct"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {d.word}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared: Record button (push-to-hold or toggle)
// ---------------------------------------------------------------------------
function RecordButton({
  recording,
  onStart,
  onStop,
  disabled,
}: {
  recording: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onMouseDown={onStart}
      onMouseUp={onStop}
      onTouchStart={onStart}
      onTouchEnd={onStop}
      onClick={recording ? onStop : onStart}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition shadow-lg cursor-pointer ${
        recording
          ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-500/30"
          : "bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/20"
      } disabled:opacity-40`}
    >
      {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      <span>{recording ? "Stop Recording" : "Hold to Record"}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main wizard
// ---------------------------------------------------------------------------
interface Phase5SpeakingLabWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Phase5SpeakingLabWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Phase5SpeakingLabWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);

  // Screen 1 — Calibration
  const [metadata, setMetadata] = useState<any>(null);
  const [setupResult, setSetupResult] = useState<any>(null);
  const [testingSetup, setTestingSetup] = useState(false);
  const rec1 = useRecorder();

  // Screen 2 — Shadowing
  const [shadowItems, setShadowItems] = useState<any[]>([]);
  const [shadowIdx, setShadowIdx] = useState(0);
  const [shadowResult, setShadowResult] = useState<any>(null);
  const [submittingShadow, setSubmittingShadow] = useState(false);
  const [shadowScores, setShadowScores] = useState<number[]>([]);
  const [showKorean, setShowKorean] = useState(true);
  const rec2 = useRecorder();

  // Screen 3 — Pronunciation drill
  const [phonemeTargets, setPhonemeTargets] = useState<any[]>([]);
  const [phonemeIdx, setPhonemeIdx] = useState(0);
  const [phonemeExIdx, setPhonemeExIdx] = useState(0);
  const [phonemeResult, setPhonemeResult] = useState<any>(null);
  const [submittingPhoneme, setSubmittingPhoneme] = useState(false);
  const [aiFeedback3, setAiFeedback3] = useState<string | null>(null);
  const [loadingFeedback3, setLoadingFeedback3] = useState(false);
  const rec3 = useRecorder();

  // Screen 4 — Patterns
  const [patterns, setPatterns] = useState<any[]>([]);
  const [patIdx, setPatIdx] = useState(0);
  const [patSlot, setPatSlot] = useState("");
  const [patResult, setPatResult] = useState<any>(null);
  const [submittingPat, setSubmittingPat] = useState(false);
  const [aiFeedback4, setAiFeedback4] = useState<string | null>(null);
  const [loadingFeedback4, setLoadingFeedback4] = useState(false);
  const rec4 = useRecorder();

  // Screen 5 — Free tasks
  const [freeTasks, setFreeTasks] = useState<any[]>([]);
  const [freeIdx, setFreeIdx] = useState(0);
  const [freeResult, setFreeResult] = useState<any>(null);
  const [submittingFree, setSubmittingFree] = useState(false);
  const [freeScores, setFreeScores] = useState<number[]>([]);
  const rec5 = useRecorder();

  // Screen 6 — Assessment
  const [assessmentBlueprint, setAssessmentBlueprint] = useState<any[]>([]);
  const [assessIdx, setAssessIdx] = useState(0);
  const [assessResult, setAssessResult] = useState<any>(null);
  const [submittingAssess, setSubmittingAssess] = useState(false);
  const [assessAttempts, setAssessAttempts] = useState<any[]>([]);
  const [finalAssessment, setFinalAssessment] = useState<any>(null);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const rec6 = useRecorder();

  // Screen 7 — Summary
  const [summary, setSummary] = useState<any>(null);

  // Lazy fetch per step
  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/speaking/phase5/metadata");
          setMetadata(res);
        } else if (step === 2 && shadowItems.length === 0) {
          const res = await apiJson("/speaking/shadowing/items");
          setShadowItems(res || []);
        } else if (step === 3 && phonemeTargets.length === 0) {
          const res = await apiJson("/speaking/pronunciation/targets");
          setPhonemeTargets(res || []);
        } else if (step === 4 && patterns.length === 0) {
          const res = await apiJson("/speaking/patterns");
          setPatterns(res || []);
          if (res?.length) setPatSlot(res[0].slot_options?.[0] || "");
        } else if (step === 5 && freeTasks.length === 0) {
          const res = await apiJson("/speaking/free-tasks");
          setFreeTasks(res || []);
        } else if (step === 6 && assessmentBlueprint.length === 0) {
          const res = await apiJson("/speaking/assessment/start", { method: "POST" });
          setAssessmentBlueprint(res.blueprint || []);
        } else if (step === 7 && !summary) {
          const res = await apiJson("/speaking/phase5/summary");
          setSummary(res);
        }
      } catch (err) {
        console.error(`Failed to load step ${step} data:`, err);
      }
    };
    load();
  }, [step]);

  // --- Screen 2: Submit shadowing attempt ---
  const handleShadowSubmit = async () => {
    const current = shadowItems[shadowIdx];
    if (!rec2.audioBlob || !current) return;
    setSubmittingShadow(true);
    setShadowResult(null);
    try {
      const fd = new FormData();
      fd.append("target_text", current.target_text_ko);
      fd.append("item_id", current.id);
      fd.append("audio_file", rec2.audioBlob, "recording.webm");
      const res = await apiForm("/speaking/shadowing/attempt", fd);
      setShadowResult(res);
      setShadowScores((prev) => [...prev, res.similarity_score]);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingShadow(false);
    }
  };

  // --- Screen 1: Setup check ---
  const handleSetupTest = async () => {
    if (!rec1.audioBlob) return;
    setTestingSetup(true);
    try {
      const fd = new FormData();
      fd.append("audio_file", rec1.audioBlob, "setup.webm");
      const res = await apiForm("/speaking/check-setup", fd);
      setSetupResult(res);
    } catch {
      setSetupResult({ stt_ok: false, hint: "Could not connect to the speech service. Check the backend." });
    } finally {
      setTestingSetup(false);
    }
  };

  // --- Screen 3: Submit phoneme attempt ---
  const handlePhonemeSubmit = async () => {
    const target = phonemeTargets[phonemeIdx];
    if (!rec3.audioBlob || !target) return;
    const example = target.examples[phonemeExIdx];
    setSubmittingPhoneme(true);
    setPhonemeResult(null);
    setAiFeedback3(null);
    try {
      const fd = new FormData();
      fd.append("target_text", example.word);
      fd.append("sound_category", target.sound_category);
      fd.append("audio_file", rec3.audioBlob, "recording.webm");
      const res = await apiForm("/speaking/pronunciation/attempt", fd);
      setPhonemeResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPhoneme(false);
    }
  };

  const handleAiFeedback3 = async () => {
    const target = phonemeTargets[phonemeIdx];
    if (!phonemeResult || !target) return;
    setLoadingFeedback3(true);
    try {
      const res = await apiJson("/speaking/pronunciation/feedback", {
        method: "POST",
        body: JSON.stringify({
          target_text: target.examples[phonemeExIdx].word,
          recognized_text: phonemeResult.recognized_text || "",
          similarity_score: phonemeResult.similarity_score || 0,
          sound_category: target.sound_category,
        }),
      });
      setAiFeedback3(res.feedback);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeedback3(false);
    }
  };

  // --- Screen 4: Submit pattern ---
  const handlePatternSubmit = async () => {
    const pat = patterns[patIdx];
    if (!rec4.audioBlob || !pat) return;
    const expected = pat.example_complete_ko.replace(/_/, patSlot);
    setSubmittingPat(true);
    setPatResult(null);
    setAiFeedback4(null);
    try {
      const fd = new FormData();
      fd.append("pattern_id", pat.id);
      fd.append("expected_text", expected);
      fd.append("audio_file", rec4.audioBlob, "recording.webm");
      const res = await apiForm("/speaking/pattern/attempt", fd);
      setPatResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPat(false);
    }
  };

  const handleAiFeedback4 = async () => {
    const pat = patterns[patIdx];
    if (!patResult || !pat) return;
    setLoadingFeedback4(true);
    try {
      const res = await apiJson("/speaking/pattern/feedback", {
        method: "POST",
        body: JSON.stringify({
          target_text: patResult.expected_text || "",
          recognized_text: patResult.recognized_text || "",
          similarity_score: patResult.similarity_score || 0,
        }),
      });
      setAiFeedback4(res.feedback);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeedback4(false);
    }
  };

  // --- Screen 5: Submit free task ---
  const handleFreeSubmit = async (useAi: boolean) => {
    const task = freeTasks[freeIdx];
    if (!rec5.audioBlob || !task) return;
    setSubmittingFree(true);
    setFreeResult(null);
    try {
      const fd = new FormData();
      fd.append("task_id", task.id);
      fd.append("prompt_text", task.prompt_en);
      fd.append("use_ai", String(useAi));
      fd.append("audio_file", rec5.audioBlob, "recording.webm");
      const res = await apiForm("/speaking/free-tasks/attempt", fd);
      setFreeResult(res);
      setFreeScores((prev) => [...prev, res.fluency_score]);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFree(false);
    }
  };

  // --- Screen 6: Assessment attempt ---
  const handleAssessmentAttempt = async () => {
    const item = assessmentBlueprint[assessIdx];
    if (!rec6.audioBlob || !item) return;
    setSubmittingAssess(true);
    setAssessResult(null);
    try {
      const fd = new FormData();
      fd.append("target_text", item.target);
      fd.append("item_id", item.item_id);
      fd.append("audio_file", rec6.audioBlob, "recording.webm");
      const res = await apiForm("/speaking/shadowing/attempt", fd); // reuse shadowing pipeline
      setAssessResult(res);
      setAssessAttempts((prev) => [
        ...prev,
        {
          target: item.target,
          recognized: res.recognized_text,
          score: res.similarity_score,
          type: item.type,
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAssess(false);
    }
  };

  const handleSubmitFinal = async () => {
    setSubmittingFinal(true);
    try {
      const res = await apiJson("/speaking/assessment/submit", {
        method: "POST",
        body: JSON.stringify({ items: assessAttempts }),
      });
      setFinalAssessment(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFinal(false);
    }
  };

  // ============================================================ UI =========
  const totalSteps = 7;

  return (
    <div className="flex-grow flex flex-col justify-between">
      {/* Header */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-zinc-900 border border-white/10">
            <Mic className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg">{activeLesson?.title || "Phase 5 – Speaking Lab"}</h2>
            <p className="text-xs text-zinc-500">Topic: {activeLesson?.topic || "Listen, Repeat & Speak"}</p>
          </div>
        </div>
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

      {/* ====== Screen 1: Welcome & Calibration ====== */}
      {step === 1 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center max-w-2xl mx-auto">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          <h2 className="text-4xl font-black text-white">Hangeul 0.5</h2>
          <h3 className="text-xl font-bold text-brand-400 mt-1">Speaking Lab – Listen & Repeat</h3>
          <p className="text-zinc-300 text-sm leading-relaxed">
            {metadata?.description ||
              "You'll listen to short Korean sentences, repeat them, and get immediate feedback on accuracy, rhythm, and speed."}
          </p>

          {/* Setup tips */}
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 text-left text-xs text-zinc-400 space-y-1.5">
            <p className="font-black text-zinc-300 text-xs mb-2">Before you start:</p>
            {(metadata?.setup_tips || [
              "Find a quiet environment with minimal background noise.",
              "Position your microphone close to your mouth.",
              "Speak clearly at a natural, relaxed pace.",
              "Use headphones to avoid audio feedback.",
            ]).map((tip: string, i: number) => (
              <p key={i}>✓ {tip}</p>
            ))}
          </div>

          {/* Mic test area */}
          <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 space-y-4">
            <p className="text-xs text-zinc-400 font-bold">Microphone Test:</p>
            <p className="text-sm text-zinc-300">
              Click record, say{" "}
              <strong className="text-white font-black">안녕하세요</strong> (hello), then stop.
            </p>

            <div className="flex items-center justify-center gap-3">
              <RecordButton
                recording={rec1.recording}
                onStart={rec1.start}
                onStop={rec1.stop}
              />
              {rec1.audioBlob && !rec1.recording && (
                <button
                  onClick={handleSetupTest}
                  disabled={testingSetup}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {testingSetup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Check Setup
                </button>
              )}
            </div>

            {setupResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold flex items-start gap-2 ${
                  setupResult.stt_ok
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/5 border-red-500/20 text-red-400"
                }`}
              >
                {setupResult.stt_ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <div>
                  {setupResult.stt_ok ? (
                    <>
                      <p>Microphone & speech recognition working!</p>
                      {setupResult.transcription && (
                        <p className="text-zinc-400 font-normal mt-0.5">Heard: "{setupResult.transcription}"</p>
                      )}
                    </>
                  ) : (
                    <p>{setupResult.hint || "Setup check failed. Please check your microphone."}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setStep(2)}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-xl transition text-sm flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            <span>Start Speaking Lab</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ====== Screen 2: Guided Shadowing ====== */}
      {step === 2 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-brand-400" />
              <span>Screen 2 – Guided Shadowing</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">
              {shadowIdx + 1}/{shadowItems.length}
            </span>
          </div>

          {shadowItems.length === 0 ? (
            <div className="text-center py-10">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" />
            </div>
          ) : (
            <div className="max-w-xl mx-auto w-full space-y-6 text-center">
              {/* Average score so far */}
              {shadowScores.length > 0 && (
                <ScoreBar
                  label={`Session avg (${shadowScores.length} attempts)`}
                  score={Math.round(shadowScores.reduce((a, b) => a + b, 0) / shadowScores.length)}
                />
              )}

              {/* Card */}
              <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-zinc-900/40 space-y-4">
                <div className="flex justify-center gap-2 mb-2">
                  <button
                    onClick={() => setShowKorean((v) => !v)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 border border-white/5 px-2.5 py-1 rounded-lg transition"
                  >
                    {showKorean ? "Hide Korean" : "Show Korean"}
                  </button>
                </div>

                {showKorean && (
                  <div className="text-4xl font-black text-white leading-snug">
                    {shadowItems[shadowIdx].target_text_ko}
                  </div>
                )}
                <p className="text-xs text-zinc-500 font-mono">{shadowItems[shadowIdx].romanization}</p>
                <p className="text-sm text-zinc-400 italic">{shadowItems[shadowIdx].english_gloss}</p>

                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => speakWord(shadowItems[shadowIdx].target_text_ko)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-950 text-brand-400 hover:text-white border border-white/5 transition text-xs font-bold cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    Listen
                  </button>
                </div>
              </div>

              {/* Record & submit */}
              <div className="space-y-3">
                <RecordButton
                  recording={rec2.recording}
                  onStart={rec2.start}
                  onStop={rec2.stop}
                  disabled={submittingShadow}
                />
                {rec2.audioBlob && !rec2.recording && !shadowResult && (
                  <button
                    onClick={handleShadowSubmit}
                    disabled={submittingShadow}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition mx-auto cursor-pointer"
                  >
                    {submittingShadow ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Submit & Score
                  </button>
                )}
              </div>

              {/* Result */}
              {shadowResult && (
                <div className="space-y-3">
                  <ScoreBar score={shadowResult.similarity_score} label="Pronunciation accuracy" />
                  <p
                    className={`text-xs font-bold ${
                      shadowResult.color === "green"
                        ? "text-emerald-400"
                        : shadowResult.color === "yellow"
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {shadowResult.feedback_hint}
                  </p>
                  <WordDiffRow diffs={shadowResult.word_diffs} />
                  {shadowResult.recognized_text && (
                    <p className="text-xs text-zinc-500 italic">Heard: "{shadowResult.recognized_text}"</p>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button
                  onClick={() => setStep(1)}
                  className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>

                {shadowResult ? (
                  <button
                    onClick={() => {
                      setShadowResult(null);
                      rec2.setAudioBlob(null);
                      if (shadowIdx < shadowItems.length - 1) {
                        setShadowIdx((i) => i + 1);
                      } else {
                        setStep(3);
                      }
                    }}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {shadowIdx < shadowItems.length - 1 ? "Next Sentence" : "Go to Drill"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      rec2.setAudioBlob(null);
                      if (shadowIdx < shadowItems.length - 1) setShadowIdx((i) => i + 1);
                      else setStep(3);
                    }}
                    className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition cursor-pointer"
                  >
                    Skip
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====== Screen 3: Pronunciation Feedback Drill ====== */}
      {step === 3 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-brand-400" />
              <span>Screen 3 – Pronunciation Drill</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">
              Sound {phonemeIdx + 1}/{phonemeTargets.length}
            </span>
          </div>

          {phonemeTargets.length === 0 ? (
            <div className="text-center py-10">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" />
            </div>
          ) : (() => {
            const target = phonemeTargets[phonemeIdx];
            const example = target.examples[phonemeExIdx];
            return (
              <div className="max-w-xl mx-auto w-full space-y-5 text-center">
                {/* Sound category label */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-full text-xs font-black text-brand-300">
                  Weak sound: {target.label}
                </div>

                {/* Description */}
                <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 text-left space-y-2">
                  <p className="text-xs text-zinc-300 leading-relaxed">{target.description}</p>
                  <p className="text-xs text-amber-400 italic">💡 Tip: {target.tip}</p>
                </div>

                {/* Example word card */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/40 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                      Example {phonemeExIdx + 1}/{target.examples.length}
                    </span>
                  </div>
                  <div className="text-4xl font-black text-white">{example.word}</div>
                  <p className="text-xs text-zinc-500 font-mono">{example.romanization}</p>
                  <p className="text-sm text-zinc-400 italic">{example.gloss}</p>
                  <button
                    onClick={() => speakWord(example.word)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-950 text-brand-400 hover:text-white border border-white/5 transition text-xs font-bold mx-auto cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" /> Listen & Mimic
                  </button>
                </div>

                {/* Record */}
                <div className="space-y-3">
                  <RecordButton recording={rec3.recording} onStart={rec3.start} onStop={rec3.stop} disabled={submittingPhoneme} />
                  {rec3.audioBlob && !rec3.recording && !phonemeResult && (
                    <button
                      onClick={handlePhonemeSubmit}
                      disabled={submittingPhoneme}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition mx-auto cursor-pointer"
                    >
                      {submittingPhoneme ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Score My Pronunciation
                    </button>
                  )}
                </div>

                {/* Result + AI tip */}
                {phonemeResult && (
                  <div className="space-y-3">
                    <ScoreBar score={phonemeResult.similarity_score} label="Pronunciation accuracy" />
                    <WordDiffRow diffs={phonemeResult.word_diffs} />
                    {phonemeResult.recognized_text && (
                      <p className="text-xs text-zinc-500 italic">Heard: "{phonemeResult.recognized_text}"</p>
                    )}

                    {/* On-demand Llama tip */}
                    {!aiFeedback3 ? (
                      <button
                        onClick={handleAiFeedback3}
                        disabled={loadingFeedback3}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-brand-400 rounded-xl text-xs font-bold transition mx-auto cursor-pointer"
                      >
                        {loadingFeedback3 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Get AI Pronunciation Tip
                      </button>
                    ) : (
                      <div className="bg-zinc-950 p-3.5 rounded-xl border border-white/[0.03] text-left text-xs">
                        <span className="text-[9px] font-black text-brand-400 uppercase tracking-widest block mb-1.5">Gwan-Sik says:</span>
                        <p className="text-zinc-300 leading-relaxed italic">"{aiFeedback3}"</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <button onClick={() => setStep(2)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <div className="flex gap-2">
                    {/* Cycle examples */}
                    <button
                      onClick={() => {
                        setPhonemeExIdx((i) => (i + 1) % target.examples.length);
                        setPhonemeResult(null);
                        setAiFeedback3(null);
                        rec3.setAudioBlob(null);
                      }}
                      className="glass-panel px-3 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition cursor-pointer"
                    >
                      Next Word
                    </button>
                    {/* Advance to next sound or next screen */}
                    <button
                      onClick={() => {
                        if (phonemeIdx < phonemeTargets.length - 1) {
                          setPhonemeIdx((i) => i + 1);
                          setPhonemeExIdx(0);
                          setPhonemeResult(null);
                          setAiFeedback3(null);
                          rec3.setAudioBlob(null);
                        } else {
                          setStep(4);
                        }
                      }}
                      className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      {phonemeIdx < phonemeTargets.length - 1 ? "Next Sound" : "Pattern Tasks"}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ====== Screen 4: Controlled Pattern Tasks ====== */}
      {step === 4 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Screen 4 – Pattern Speaking Tasks</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">
              Pattern {patIdx + 1}/{patterns.length}
            </span>
          </div>

          {patterns.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (() => {
            const pat = patterns[patIdx];
            const expectedSentence = pat.example_complete_ko.replace(/_/, patSlot || pat.slot_options[0]);
            return (
              <div className="max-w-xl mx-auto w-full space-y-5 text-center">
                {/* Pattern display */}
                <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 space-y-3">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Pattern Template</span>
                  <div className="text-2xl font-black text-white">{pat.pattern_ko}</div>
                  <p className="text-xs text-zinc-400 italic">{pat.pattern_en}</p>
                </div>

                {/* Slot selector */}
                <div className="space-y-2">
                  <span className="text-xs text-zinc-400 font-bold">Choose your {pat.slot_label}:</span>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {pat.slot_options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setPatSlot(opt);
                          setPatResult(null);
                          setAiFeedback4(null);
                          rec4.setAudioBlob(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                          patSlot === opt
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Full sentence to say */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">Say this complete sentence:</span>
                  <div className="text-2xl font-black text-white">{expectedSentence}</div>
                  <p className="text-xs text-zinc-400 italic">{pat.example_complete_en.replace(/민수/, patSlot || pat.slot_options[0])}</p>
                  <button
                    onClick={() => speakWord(expectedSentence)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-brand-400 hover:text-white border border-white/5 transition text-xs font-bold mx-auto cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" /> Model Audio
                  </button>
                </div>

                {/* Record */}
                <div className="space-y-3">
                  <RecordButton recording={rec4.recording} onStart={rec4.start} onStop={rec4.stop} disabled={submittingPat} />
                  {rec4.audioBlob && !rec4.recording && !patResult && (
                    <button
                      onClick={handlePatternSubmit}
                      disabled={submittingPat}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition mx-auto cursor-pointer"
                    >
                      {submittingPat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Check My Pattern
                    </button>
                  )}
                </div>

                {/* Result */}
                {patResult && (
                  <div className="space-y-3">
                    <ScoreBar score={patResult.similarity_score} label="Pattern accuracy" />
                    <div className={`text-xs font-bold px-3 py-2 rounded-lg border w-fit mx-auto ${
                      patResult.structure_ok
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/5 border-amber-500/20 text-amber-400"
                    }`}>
                      Structure: {patResult.structure_ok ? "✓ Correct" : "⚠ Double-check particle/ending"}
                    </div>
                    <WordDiffRow diffs={patResult.word_diffs} />
                    {patResult.recognized_text && (
                      <p className="text-xs text-zinc-500 italic">Heard: "{patResult.recognized_text}"</p>
                    )}

                    {/* On-demand AI feedback */}
                    {!aiFeedback4 ? (
                      <button
                        onClick={handleAiFeedback4}
                        disabled={loadingFeedback4}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-brand-400 rounded-xl text-xs font-bold transition mx-auto cursor-pointer"
                      >
                        {loadingFeedback4 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Get AI Grammar Feedback
                      </button>
                    ) : (
                      <div className="bg-zinc-950 p-3.5 rounded-xl border border-white/[0.03] text-left text-xs">
                        <span className="text-[9px] font-black text-brand-400 uppercase tracking-widest block mb-1.5">Gwan-Sik says:</span>
                        <p className="text-zinc-300 leading-relaxed italic">"{aiFeedback4}"</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <button onClick={() => setStep(3)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => {
                      setPatResult(null);
                      setAiFeedback4(null);
                      rec4.setAudioBlob(null);
                      if (patIdx < patterns.length - 1) {
                        setPatIdx((i) => i + 1);
                        setPatSlot(patterns[patIdx + 1]?.slot_options?.[0] || "");
                      } else {
                        setStep(5);
                      }
                    }}
                    className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {patIdx < patterns.length - 1 ? "Next Pattern" : "Free Tasks"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ====== Screen 5: Free Speaking Mini-tasks ====== */}
      {step === 5 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Mic className="w-5 h-5 text-brand-400" />
              <span>Screen 5 – Free Speaking</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">
              Task {freeIdx + 1}/{freeTasks.length}
            </span>
          </div>

          {freeTasks.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (() => {
            const task = freeTasks[freeIdx];
            return (
              <div className="max-w-xl mx-auto w-full space-y-5 text-center">
                {/* Prompt */}
                <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 space-y-3">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Speaking Prompt</span>
                  <p className="text-lg font-black text-white">{task.prompt_en}</p>
                  <p className="text-xs text-zinc-400 italic">Hint: {task.prompt_hint}</p>
                </div>

                {/* Sample structure */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 text-left space-y-1.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">Suggested sentence structure:</span>
                  {task.sample_structure.map((s: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <button
                        onClick={() => speakWord(s)}
                        className="p-1 rounded text-brand-400 hover:text-white transition cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                      <p className="text-xs text-zinc-300 font-mono">{s}</p>
                    </div>
                  ))}
                </div>

                {/* Record */}
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">
                    Speak for ~{task.suggested_length_seconds}s. No pressure — just do your best!
                  </p>
                  <RecordButton recording={rec5.recording} onStart={rec5.start} onStop={rec5.stop} disabled={submittingFree} />
                  {rec5.audioBlob && !rec5.recording && !freeResult && (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleFreeSubmit(false)}
                        disabled={submittingFree}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        {submittingFree ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Submit (Basic Score)
                      </button>
                      <button
                        onClick={() => handleFreeSubmit(true)}
                        disabled={submittingFree}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-brand-400 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Submit + AI Analysis
                      </button>
                    </div>
                  )}
                </div>

                {/* Result */}
                {freeResult && (
                  <div className="space-y-3">
                    <ScoreBar score={freeResult.fluency_score} label="Fluency score" />
                    <p className="text-xs text-zinc-400">
                      Word count: <strong className="text-white">{freeResult.word_count}</strong>
                    </p>
                    {freeResult.recognized_text && (
                      <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 text-left text-xs text-zinc-400">
                        <span className="block font-bold text-zinc-300 mb-1">Transcription:</span>
                        <p className="leading-relaxed">"{freeResult.recognized_text}"</p>
                      </div>
                    )}
                    {freeResult.ai_feedback && (
                      <div className="bg-zinc-950 p-3.5 rounded-xl border border-white/[0.03] text-left text-xs">
                        <span className="text-[9px] font-black text-brand-400 uppercase tracking-widest block mb-1.5">Gwan-Sik says:</span>
                        <p className="text-zinc-300 leading-relaxed italic">"{freeResult.ai_feedback}"</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <button onClick={() => setStep(4)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => {
                      setFreeResult(null);
                      rec5.setAudioBlob(null);
                      if (freeIdx < freeTasks.length - 1) setFreeIdx((i) => i + 1);
                      else setStep(6);
                    }}
                    className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {freeIdx < freeTasks.length - 1 ? "Next Task" : "Assessment"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ====== Screen 6: Phase 5 Assessment ====== */}
      {step === 6 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-400" />
              <span>Screen 6 – Phase 5 Assessment</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">
              {finalAssessment ? "Completed" : `Item ${Math.min(assessIdx + 1, assessmentBlueprint.length)}/${assessmentBlueprint.length}`}
            </span>
          </div>

          {finalAssessment ? (
            /* Final result */
            <div className="max-w-xl mx-auto w-full text-center space-y-6">
              <div className={`p-3 rounded-full border w-fit mx-auto ${finalAssessment.passed ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
                {finalAssessment.passed ? <CheckCircle2 className="w-8 h-8" /> : <RefreshCw className="w-8 h-8" />}
              </div>
              <h3 className="text-2xl font-black text-white">
                {finalAssessment.passed ? "Phase 5 Unlocked!" : "Good Effort!"}
              </h3>
              <ScoreBar score={finalAssessment.total_score} label="Overall speaking score" />
              {finalAssessment.xp_awarded > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-black">
                  <Award className="w-4 h-4" /> +{finalAssessment.xp_awarded} XP awarded
                </div>
              )}
              <p className="text-xs text-zinc-400 leading-relaxed">{finalAssessment.message}</p>
              <button onClick={() => setStep(7)} className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-6 py-3 rounded-xl font-black text-xs transition cursor-pointer">
                View Summary & Recommendations
              </button>
            </div>
          ) : assessmentBlueprint.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : assessIdx >= assessmentBlueprint.length ? (
            /* All items done — submit */
            <div className="max-w-xl mx-auto text-center space-y-4">
              <p className="text-zinc-300 text-sm">All {assessmentBlueprint.length} items completed! Submit to get your final score.</p>
              <div className="space-y-2">
                {assessAttempts.map((a, i) => (
                  <div key={i} className="flex items-center justify-between bg-zinc-900 p-3 rounded-xl border border-white/5 text-xs">
                    <span className="text-zinc-400 truncate max-w-[200px]">{a.target}</span>
                    <span className={`font-black ${a.score >= 75 ? "text-emerald-400" : a.score >= 50 ? "text-amber-400" : "text-red-400"}`}>{a.score.toFixed(0)}/100</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSubmitFinal}
                disabled={submittingFinal}
                className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-black px-6 py-3 rounded-xl text-sm transition mx-auto cursor-pointer"
              >
                {submittingFinal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                Submit & Get Score
              </button>
            </div>
          ) : (() => {
            const item = assessmentBlueprint[assessIdx];
            return (
              <div className="max-w-xl mx-auto w-full space-y-5 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-xs font-bold text-zinc-300">
                  {item.type === "shadowing" ? "Shadowing" : item.type === "pattern" ? "Pattern" : "Free Speech"} •{" "}
                  {item.gloss}
                </div>

                <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 space-y-3">
                  {item.type === "free" ? (
                    <p className="text-sm font-bold text-white">{item.target}</p>
                  ) : (
                    <div className="text-3xl font-black text-white">{item.target}</div>
                  )}
                  <button
                    onClick={() => item.type !== "free" && speakWord(item.target)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 text-brand-400 hover:text-white border border-white/5 transition text-xs font-bold mx-auto cursor-pointer"
                    style={{ display: item.type === "free" ? "none" : "flex" }}
                  >
                    <Volume2 className="w-4 h-4" /> Listen
                  </button>
                </div>

                <div className="space-y-3">
                  <RecordButton recording={rec6.recording} onStart={rec6.start} onStop={rec6.stop} disabled={submittingAssess} />
                  {rec6.audioBlob && !rec6.recording && !assessResult && (
                    <button
                      onClick={handleAssessmentAttempt}
                      disabled={submittingAssess}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition mx-auto cursor-pointer"
                    >
                      {submittingAssess ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Submit Response
                    </button>
                  )}
                </div>

                {assessResult && (
                  <div className="space-y-3">
                    <ScoreBar score={assessResult.similarity_score} label="Accuracy" />
                    <WordDiffRow diffs={assessResult.word_diffs} />
                    <button
                      onClick={() => {
                        setAssessResult(null);
                        rec6.setAudioBlob(null);
                        setAssessIdx((i) => i + 1);
                      }}
                      className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                    >
                      {assessIdx < assessmentBlueprint.length - 1 ? "Next Item" : "Review & Submit"}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <button onClick={() => setStep(5)} className="glass-panel px-4 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <span className="text-xs text-zinc-600">{assessAttempts.length} of {assessmentBlueprint.length} recorded</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ====== Screen 7: Summary & Recommendations ====== */}
      {step === 7 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-brand-400" />
              <span>Screen 7 – Review & Recommendations</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Final</span>
          </div>

          {!summary ? (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" /></div>
          ) : (
            <div className="space-y-6 max-w-2xl mx-auto w-full">
              {/* Score grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Shadowing", value: summary.shadowing_avg },
                  { label: "Pattern Speaking", value: summary.pattern_avg },
                  { label: "Free Speaking", value: summary.free_speaking_avg },
                  { label: "Overall", value: summary.overall_avg },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 space-y-2">
                    <ScoreBar score={value} label={label} />
                  </div>
                ))}
              </div>

              {/* Trend sparkline (text-based) */}
              {summary.trend?.length > 0 && (
                <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 text-xs space-y-2">
                  <span className="text-zinc-500 uppercase tracking-widest font-black text-[9px] block">Pronunciation trend (last shadowing attempts)</span>
                  <div className="flex items-end gap-2 h-10">
                    {summary.trend.map((s: number, i: number) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm ${s >= 80 ? "bg-emerald-500" : s >= 55 ? "bg-amber-400" : "bg-red-500"}`}
                        style={{ height: `${Math.max(10, s)}%` }}
                        title={`${s}%`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Patterns practiced */}
              <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 text-xs space-y-2">
                <span className="text-zinc-500 uppercase tracking-widest font-black text-[9px] block">Patterns mastered:</span>
                <div className="flex flex-wrap gap-2">
                  {summary.patterns_practiced.map((p: string) => (
                    <span key={p} className="px-2.5 py-1 bg-brand-500/10 border border-brand-500/20 text-brand-300 rounded-full font-bold">{p}</span>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 space-y-2.5">
                <span className="text-zinc-500 uppercase tracking-widest font-black text-[9px] block">Recommendations:</span>
                <ul className="space-y-2">
                  {summary.recommendations.map((r: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                      <span className="text-brand-400 mt-0.5 shrink-0">→</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next module */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 text-xs flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-zinc-300">Next recommended module:</p>
                  <p className="text-brand-400 mt-0.5">{summary.next_module}</p>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={onComplete}
                  className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Finish Speaking Lab & Claim XP</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
