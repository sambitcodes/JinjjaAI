"use client";

import { useEffect, useState, useRef } from "react";
import xpAudit from "../lib/xp-audit.json";
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
  MessageCircle,
  TrendingUp,
  Play,
  Activity,
  CheckSquare,
  Bookmark,
  Layers,
  ArrowRight,
  Sliders,
  HelpCircle
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

const playSFX = (type: "correct" | "wrong") => {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "correct") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.stop(ctx.currentTime + 0.4);
      window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 20, type: "correct" } }));
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150.0, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.frequency.exponentialRampToValueAtTime(80.0, ctx.currentTime + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.stop(ctx.currentTime + 0.4);
      window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: -10, type: "wrong" } }));
    }
  } catch (e) {
    console.error("AudioContext not supported or blocked", e);
  }
};

interface Course6Phase3StanceWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
  courseXP: number;
}

export default function Course6Phase3StanceWizard({
  activeLesson,
  speakWord,
  onComplete,
  courseXP
}: Course6Phase3StanceWizardProps) {
  const phaseNum = 3;
  const getStepMaxXP = (sNum: number) => {
    try {
      return (xpAudit as any)["6"]?.[phaseNum.toString()]?.steps?.[sNum.toString()]?.max_xp ?? 35;
    } catch (e) {
      return 35;
    }
  };
  const getStepXP = (sNum: number) => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(`hangeulai_c6p${phaseNum}_s${sNum}_earned_xp`) || "0", 10);
  };

  const [step, setStep] = useState<number>(1);
  const [maxStep, setMaxStep] = useState(1);
  useEffect(() => {
    const savedStep = localStorage.getItem("hangeulai_c6p3_step");
    const savedMax = localStorage.getItem("hangeulai_c6p3_max_step");
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
      localStorage.setItem("hangeulai_c6p3_max_step", String(step));
    }
  }, [step, maxStep]);
  const [showOutline, setShowOutline] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const totalSteps = 10;

  // Loaded curriculum data
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);
  const [sliderVal, setSliderVal] = useState<number>(50); // 0 = strong, 50 = balanced, 100 = tentative

  // Concept check (Step 2 check)
  const [conceptAnswer, setConceptAnswer] = useState<string | null>(null);
  const [conceptChecked, setConceptChecked] = useState(false);
  const [conceptCorrect, setConceptCorrect] = useState<boolean | null>(null);

  // Activity 1: Stance certainty level (Step 3)
  const [recognitionData, setRecognitionData] = useState<any>(null);
  const [activeRecIdx, setActiveRecIdx] = useState<number>(0);
  const [selectedStanceStrength, setSelectedStanceStrength] = useState<string | null>(null);
  const [recChecked, setRecChecked] = useState(false);
  const [recCorrect, setRecCorrect] = useState<boolean | null>(null);

  // Activity 2: Hedged vs Unhedged (Step 4)
  const [activeHvuIdx, setActiveHvuIdx] = useState<number>(0);
  const [selectedHvuOption, setSelectedHvuOption] = useState<string | null>(null);
  const [hvuChecked, setHvuChecked] = useState(false);
  const [hvuCorrect, setHvuCorrect] = useState<boolean | null>(null);

  // Activity 3: Softening dialogue highlight (Step 5)
  const [activeDsIdx, setActiveDsIdx] = useState<number>(0);
  const [highlightedPhrase, setHighlightedPhrase] = useState<string | null>(null);
  const [dsChecked, setDsChecked] = useState(false);
  const [dsCorrect, setDsCorrect] = useState<boolean | null>(null);

  // Activity 4: Rewrite Opinion Segment (Step 6)
  const [rewriteTemplates, setRewriteTemplates] = useState<any>(null);
  const [activeRewriteIdx, setActiveRewriteIdx] = useState<number>(0);
  const [targetStanceLevel, setTargetStanceLevel] = useState<string>("balanced");
  const [selectedRewriteChip, setSelectedRewriteChip] = useState<string | null>(null);
  const [rewriteFeedback, setRewriteFeedback] = useState<any>(null);
  const [submittingRewrite, setSubmittingRewrite] = useState(false);

  // Activity 5: Partial Agreement Response Pattern (Step 7)
  const [activePaIdx, setActivePaIdx] = useState<number>(0);
  const [selectedPaOption, setSelectedPaOption] = useState<string | null>(null);
  const [paFeedback, setPaFeedback] = useState<any>(null);
  const [submittingPa, setSubmittingPa] = useState(false);

  // Activity 6: Live debate dialogue (Step 8)
  const [chatTopic, setChatTopic] = useState("Study and work balance");
  const [chatStarted, setChatStarted] = useState(false);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [aiText, setAiText] = useState("");
  const [aiSending, setAiSending] = useState(false);
  const [aiFinished, setAiFinished] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<any>(null);
  const [finishingDiscussion, setFinishingDiscussion] = useState(false);

  // Live debate goals
  const [goalSofteningUsed, setGoalSofteningUsed] = useState(false);
  const [goalConcessionUsed, setGoalConcessionUsed] = useState(false);

  // Activity 7: Stance Strategy Quiz (Step 9)
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);
  const [quizBadge, setQuizBadge] = useState<string | null>(null);

  // Step 10: Graduation & Homework
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Homework Stance Practice Room
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [practiceMessages, setPracticeMessages] = useState<any[]>([]);
  const [practiceText, setPracticeText] = useState("");
  const [practiceSending, setPracticeSending] = useState(false);
  const [practiceFinished, setPracticeFinished] = useState(false);

  // --- Start Progress State Preservation ---
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hangeulai_c6p3_progress_state");
        if (saved) {
          const state = JSON.parse(saved);
            // Deleted state.step override to allow teleportation
            // Deleted state.maxStep override to allow teleportation
            if (state.conceptAnswer !== undefined) setConceptAnswer(state.conceptAnswer);
            if (state.conceptChecked !== undefined) setConceptChecked(state.conceptChecked);
            if (state.conceptCorrect !== undefined) setConceptCorrect(state.conceptCorrect);
            if (state.activeRecIdx !== undefined) setActiveRecIdx(state.activeRecIdx);
            if (state.selectedStanceStrength !== undefined) setSelectedStanceStrength(state.selectedStanceStrength);
            if (state.recChecked !== undefined) setRecChecked(state.recChecked);
            if (state.recCorrect !== undefined) setRecCorrect(state.recCorrect);
            if (state.activeHvuIdx !== undefined) setActiveHvuIdx(state.activeHvuIdx);
            if (state.selectedHvuOption !== undefined) setSelectedHvuOption(state.selectedHvuOption);
            if (state.hvuChecked !== undefined) setHvuChecked(state.hvuChecked);
            if (state.hvuCorrect !== undefined) setHvuCorrect(state.hvuCorrect);
            if (state.activeDsIdx !== undefined) setActiveDsIdx(state.activeDsIdx);
            if (state.dsChecked !== undefined) setDsChecked(state.dsChecked);
            if (state.dsCorrect !== undefined) setDsCorrect(state.dsCorrect);
            if (state.activeRewriteIdx !== undefined) setActiveRewriteIdx(state.activeRewriteIdx);
            if (state.selectedRewriteChip !== undefined) setSelectedRewriteChip(state.selectedRewriteChip);
            if (state.activePaIdx !== undefined) setActivePaIdx(state.activePaIdx);
            if (state.selectedPaOption !== undefined) setSelectedPaOption(state.selectedPaOption);
            if (state.aiText !== undefined) setAiText(state.aiText);
            if (state.aiFinished !== undefined) setAiFinished(state.aiFinished);
            if (state.quizIdx !== undefined) setQuizIdx(state.quizIdx);
            if (state.quizChecked !== undefined) setQuizChecked(state.quizChecked);
            if (state.quizCorrect !== undefined) setQuizCorrect(state.quizCorrect);
            if (state.quizSelectedOpt !== undefined) setQuizSelectedOpt(state.quizSelectedOpt);
            if (state.quizMistakes !== undefined) setQuizMistakes(state.quizMistakes);
            if (state.quizScore !== undefined) setQuizScore(state.quizScore);
            if (state.completedHomework !== undefined) setCompletedHomework(state.completedHomework);
            if (state.practiceText !== undefined) setPracticeText(state.practiceText);
            if (state.practiceFinished !== undefined) setPracticeFinished(state.practiceFinished);
        }
      } catch (e) {
        console.error("Failed to restore progress state:", e);
      }
      isLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    if (typeof window !== "undefined") {
      try {
        const state = {
            step,
            maxStep,
            conceptAnswer,
            conceptChecked,
            conceptCorrect,
            activeRecIdx,
            selectedStanceStrength,
            recChecked,
            recCorrect,
            activeHvuIdx,
            selectedHvuOption,
            hvuChecked,
            hvuCorrect,
            activeDsIdx,
            dsChecked,
            dsCorrect,
            activeRewriteIdx,
            selectedRewriteChip,
            activePaIdx,
            selectedPaOption,
            aiText,
            aiFinished,
            quizIdx,
            quizChecked,
            quizCorrect,
            quizSelectedOpt,
            quizMistakes,
            quizScore,
            completedHomework,
            practiceText,
            practiceFinished
        };
        localStorage.setItem("hangeulai_c6p3_progress_state", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save progress state:", e);
      }
    }
  }, [step, maxStep, conceptAnswer, conceptChecked, conceptCorrect, activeRecIdx, selectedStanceStrength, recChecked, recCorrect, activeHvuIdx, selectedHvuOption, hvuChecked, hvuCorrect, activeDsIdx, dsChecked, dsCorrect, activeRewriteIdx, selectedRewriteChip, activePaIdx, selectedPaOption, aiText, aiFinished, quizIdx, quizChecked, quizCorrect, quizSelectedOpt, quizMistakes, quizScore, completedHomework, practiceText, practiceFinished]);
  // --- End Progress State Preservation ---

  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);

  // Restore step from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hangeulai_c6p3_step");
      if (saved) {
        setStep(parseInt(saved, 10));
      }
    }
  }, []);

  // Save step to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hangeulai_c6p3_step", step.toString());
      window.dispatchEvent(new CustomEvent("hangeulai-step-change", {
        detail: {
          courseId: 6,
          phaseNum: 3,
          step: step
        }
      }));
    }
  }, [step]);

  // Load backend details per step
  useEffect(() => {
    const loadData = async () => {
      try {
        if ((step === 1 || step === 10) && !metadata) {
          const res = await apiJson("/phases/korean5/3/metadata");
          setMetadata(res);
        }
        if (step === 2 && !coreData) {
          const res = await apiJson("/phases/korean5/3/core-data");
          setCoreData(res);
        }
        if ((step === 3 || step === 4 || step === 5) && !recognitionData) {
          const res = await apiJson("/practice/stance/recognition");
          setRecognitionData(res);
        }
        if ((step === 6 || step === 7) && !rewriteTemplates) {
          const res = await apiJson("/practice/stance/rewrite-templates");
          setRewriteTemplates(res);
        }
        if (step === 9 && quizBlueprint.length === 0) {
          const res = await apiJson("/quiz/korean5/phase-3/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        }
        if (step === 10 && homeworkItems.length === 0) {
          const res = await apiJson("/phases/korean5/3/homework");
          setHomeworkItems(res || []);
        }
      } catch (err) {
        console.error("Error loading C6 Phase 3 data:", err);
      }
    };
    loadData();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  // Step 2 concept verification
  const handleCheckConcept = () => {
    if (conceptChecked) return;
    const isCorrect = conceptAnswer === "B";
    setConceptChecked(true);
    setConceptCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  // Step 3 (Activity 1) Verify certainty
  const handleCheckActivity1 = async () => {
    if (!recognitionData || recChecked) return;
    const currentItem = recognitionData.recognition_items[activeRecIdx];
    const isCorrect = selectedStanceStrength === currentItem.stance;

    setRecChecked(true);
    setRecCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");

    try {
      await apiJson("/practice/stance/recognition/answer", {
        method: "POST",
        body: JSON.stringify({
          question_id: currentItem.id,
          answer: selectedStanceStrength,
          time_taken_ms: 2000
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Step 4 (Activity 2) Verify Hedged vs Blunt
  const handleCheckActivity2 = () => {
    if (!recognitionData || hvuChecked) return;
    const isCorrect = selectedHvuOption === "hedged";

    setHvuChecked(true);
    setHvuCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  // Step 5 (Activity 3) Verify softening highlight in dialogues
  const handleCheckActivity3 = () => {
    if (!recognitionData || dsChecked) return;
    const currentDs = recognitionData.dialogues_softening[activeDsIdx];
    const isCorrect = highlightedPhrase === currentDs.softening_marker;

    setDsChecked(true);
    setDsCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");
  };

  // Step 6 (Activity 4) Verify rewrite chip
  const handleCheckActivity4 = async () => {
    if (!rewriteTemplates || submittingRewrite || rewriteFeedback) return;
    const currentTemp = rewriteTemplates.rewrite_templates[activeRewriteIdx];
    const targetRev = currentTemp.plain_text.replace(currentTemp.underlined, selectedRewriteChip || "");

    setSubmittingRewrite(true);
    try {
      const res = await apiJson("/practice/stance/rewrite/submit", {
        method: "POST",
        body: JSON.stringify({
          item_id: currentTemp.id,
          user_revision: targetRev,
          target_stance: targetStanceLevel
        })
      });
      setRewriteFeedback(res);
      playSFX(res.is_correct ? "correct" : "wrong");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingRewrite(false);
    }
  };

  // Step 7 (Activity 5) Verify partial agreement
  const handleCheckActivity5 = async () => {
    if (!rewriteTemplates || submittingPa || paFeedback) return;
    const currentPa = rewriteTemplates.partial_agreement_templates[activePaIdx];

    setSubmittingPa(true);
    try {
      const res = await apiJson("/practice/stance/partial-agreement/submit", {
        method: "POST",
        body: JSON.stringify({
          item_id: currentPa.id,
          user_phrase: selectedPaOption || ""
        })
      });
      setPaFeedback(res);
      playSFX(true ? "correct" : "wrong"); // Always count as registered/correct pattern
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingPa(false);
    }
  };

  // Step 8 (Activity 6) Live debate discussion chat
  const handleStartDiscussion = async () => {
    setAiMessages([]);
    setAiEvaluation(null);
    setAiFinished(false);
    setChatStarted(true);
    try {
      const res = await apiJson("/conversation/c1/stance-discussion/start", {
        method: "POST",
        body: JSON.stringify({ topic: chatTopic })
      });
      setAiSessionId(res.session_id);
      setAiMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") {
        playAudio(res.opener);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendAiTurn = async () => {
    if (!aiText.trim() || !aiSessionId || aiSending) return;
    const textToSend = aiText;
    setAiText("");
    setAiMessages(prev => [...prev, { sender: "user", text: textToSend }]);
    setAiSending(true);

    if (textToSend.includes("것 같") || textToSend.includes("대체로")) {
      setGoalSofteningUsed(true);
    }
    if (textToSend.includes("일리가 있") || textToSend.includes("의견도 맞")) {
      setGoalConcessionUsed(true);
    }

    try {
      const res = await apiJson("/conversation/c1/stance-discussion/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setAiMessages(prev => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") {
        playAudio(res.reply_ko);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiSending(false);
    }
  };

  const handleFinishDiscussion = async () => {
    if (!aiSessionId || finishingDiscussion) return;
    setFinishingDiscussion(true);
    try {
      const res = await apiJson("/conversation/c1/stance-discussion/finish", { method: "POST" });
      setAiEvaluation(res.stance_usage_report);
      setAiFinished(true);
    } catch (err) {
      console.error(err);
    } finally {
      setFinishingDiscussion(false);
    }
  };

  // Step 9 (Activity 7) Verify quiz answer
  const handleCheckQuiz = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current || !quizSelectedOpt || quizChecked) return;

    const isCorrect = quizSelectedOpt === current.correct_answer;
    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    playSFX(isCorrect ? "correct" : "wrong");

    if (!isCorrect) {
      setQuizMistakes(prev => [...prev, current.id]);
    }

    try {
      await apiJson("/quiz/korean5/phase-3/answer", {
        method: "POST",
        body: JSON.stringify({
          question_id: current.id,
          answer: quizSelectedOpt,
          time_taken_ms: 2000
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextQuizOrComplete = async () => {
    if (quizIdx < quizBlueprint.length - 1) {
      setQuizIdx(quizIdx + 1);
      setQuizSelectedOpt(null);
      setQuizChecked(false);
      setQuizCorrect(null);
    } else {
      setFinishingQuiz(true);
      try {
        const correctCount = quizBlueprint.length - quizMistakes.length;
        const score = Math.round((correctCount / quizBlueprint.length) * 100);
        const res = await apiJson("/quiz/korean5/phase-3/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setQuizBadge(res.badge || "Nuanced Communicator C1");
        setStep(10);
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  // Step 10: Toggle homework logs
  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/phases/korean5/3/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Step 10: Homework stance practice room
  const handleStartStancePractice = async () => {
    setPracticeMessages([]);
    setPracticeFeedback(null);
    setPracticeFinished(false);
    try {
      const res = await apiJson("/conversation/c1/stance-practice/start", {
        method: "POST",
        body: JSON.stringify({})
      });
      setPracticeSessionId(res.session_id);
      setPracticeMessages([{ sender: "assistant", text: res.opener }]);
      if (mode === "voice") {
        playAudio(res.opener);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendPracticeTurn = async () => {
    if (!practiceText.trim() || !practiceSessionId || practiceSending) return;
    const textToSend = practiceText;
    setPracticeText("");
    setPracticeMessages(prev => [...prev, { sender: "user", text: textToSend }]);
    setPracticeSending(true);

    try {
      const res = await apiJson("/conversation/c1/stance-practice/turn", {
        method: "POST",
        body: JSON.stringify({ user_text: textToSend })
      });
      setPracticeMessages(prev => [...prev, { sender: "assistant", text: `${res.reply_ko} (${res.reply_en})` }]);
      if (mode === "voice") {
        playAudio(res.reply_ko);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPracticeSending(false);
    }
  };

  const handleFinishPractice = async () => {
    if (!practiceSessionId) return;
    try {
      const res = await apiJson("/conversation/c1/stance-practice/finish", { method: "POST" });
      setPracticeFeedback(res.feedback);
      setPracticeFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getSliderLevelInfo = () => {
    if (sliderVal < 33) {
      return {
        title: "Strong / Direct (확신/직설)",
        desc: "Expresses 100% certainty. Avoids qualifiers.",
        ex: "의심할 여지가 없습니다 (There is no doubt that...)"
      };
    } else if (sliderVal < 66) {
      return {
        title: "Balanced / Cautious (조절/신중)",
        desc: "Presents views with qualification and polite balance.",
        ex: "~인 경향이 있는 것 같습니다 (It seems that there is a tendency to...)"
      };
    } else {
      return {
        title: "Tentative / Exploratory (추측/탐색)",
        desc: "Explores possibilities cautiously, remaining highly respectful.",
        ex: "조심스럽지만 ~일지도 모릅니다 (It's cautious, but it might possibly be...)"
      };
    }
  };

  const outlineSteps = [
    { num: 1, label: "Welcome & Goals" },
    { num: 2, label: "Stance & Softening Toolbox" },
    { num: 3, label: "Act 1: Label Certainty" },
    { num: 4, label: "Act 2: Hedged vs Blunt" },
    { num: 5, label: "Act 3: Dialogue Softeners" },
    { num: 6, label: "Act 4: Rewrite Opinion Segment" },
    { num: 7, label: "Act 5: Partial Agreement Builder" },
    { num: 8, label: "Act 6: Live Debate Discussion" },
    { num: 9, label: "Act 7: Strategy Mini-Quiz" },
    { num: 10, label: "Graduation & Completion" }
  ];

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
              <span>{activeLesson?.title || "Korean 6.3 – Nuance in Opinions & Soft Power"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Topic: Stance, Hedging & Politeness</p>
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
            className="text-[10px] bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer uppercase tracking-wider font-bold"
          >
            {showOutline ? "Hide Outline" : "View Outline"}
          </button>
        </div>
      </header>

      {showOutline && (() => {
        const phaseEarnedXP = outlineSteps.reduce((acc, s) => acc + getStepXP(s.num), 0);
        const phaseMaxXP = outlineSteps.reduce((acc, s) => acc + getStepMaxXP(s.num), 0);
        return (
          <div className="mb-6 p-5 bg-zinc-955/80 rounded-3xl border border-white/5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 relative z-30">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 font-mono">Curriculum Syllabus Map</span>
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">Required: 340 XP</span>
            </div>
            
            {/* Phase Level Progress Bar */}
            <div className="mb-4 p-3 bg-zinc-900/60 rounded-2xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-zinc-400">
                <span>Phase XP Progress</span>
                <span className="text-brand-400">{phaseEarnedXP} / {phaseMaxXP} XP</span>
              </div>
              <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${(phaseEarnedXP / (phaseMaxXP || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {outlineSteps.map(s => {
                const isCurrent = step === s.num;
                const isCompleted = s.num < step;
                return (
                  <button
                    key={s.num}
                    disabled={!isCompleted && !isCurrent}
                    onClick={() => {
                      if (courseXP < 160) {
                        window.dispatchEvent(new CustomEvent("hangeulai-warning", {
                          detail: { message: "To start Phase 3, you need at least 160 XP in this course. You currently have " + courseXP + " XP." }
                        }));
                        return;
                      }
                      setStep(s.num);
                      setShowOutline(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between h-20 ${
                      isCurrent
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : isCompleted
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/50"
                        : "border-red-500/20 bg-red-950/20 text-red-400/40 cursor-not-allowed opacity-50"
                    }`}
                  >
                    <div>
                      <div className="text-[9px] font-black font-mono text-zinc-500">STEP {s.num}</div>
                      <div className="text-[11px] font-bold truncate w-full">{s.label}</div>
                    </div>
                    {/* Step level mini progress / XP potential */}
                    <div className="w-full mt-1">
                      <div className="flex justify-between text-[7px] font-black text-zinc-500">
                        <span>Potential</span>
                        <span className={isCompleted ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                          {getStepXP(s.num)}/{getStepMaxXP(s.num)} XP
                        </span>
                      </div>
                      <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden mt-0.5">
                        <div 
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${(getStepXP(s.num) / (getStepMaxXP(s.num) || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Step 1: Welcome & Overview */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight font-sans">Korean 6.3</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Stance & Soft Power</h3>
          <p className="text-zinc-400 text-sm italic">“Strong Ideas, Soft Delivery”</p>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Express complex opinions gently and precisely in Korean."}
          </p>

          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-3 max-w-md mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Understand stance (attitude + certainty), hedging, and softening",
                "Identify stance certainty levels and markers in Korean sentences",
                "Select and build hedged, softened arguments for sensitive situations",
                "Utilize concessions and partial agreement response structures"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 35}–45 minutes</p>
          </div>

          {/* Mode Selector */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Conversation Mode</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("text")}
                className={`p-3 rounded-xl border text-xs font-bold transition ${
                  mode === "text" 
                    ? "border-brand-500 bg-brand-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                Text Input
              </button>
              <button
                onClick={() => setMode("voice")}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  mode === "voice" 
                    ? "border-brand-500 bg-brand-500/10 text-white" 
                    : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice + Text</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <button 
              onClick={() => {
    if (courseXP < 160) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 3, you need at least 160 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }}
              className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 3</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Concept Screen */}
      {step === 2 && coreData && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-5 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>Stance, Hedging & Softening Toolbox</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">C1 Stance and Hedging Definition</p>
            <p className="italic font-serif">
              “Stance is how you show your attitude and certainty. Hedging is using cautious qualifying language to present balanced arguments, while softening reduces emotional friction when disagreeing.”
            </p>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
            <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-white/5">
              <h4 className="text-xs font-black text-brand-400">Strong Stance</h4>
              <p className="text-[10px] text-zinc-400 mt-1">Expresses 100% certainty without concession markers.</p>
            </div>
            <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-white/5">
              <h4 className="text-xs font-black text-brand-400">Cautious Stance</h4>
              <p className="text-[10px] text-zinc-400 mt-1">Qualifies claims using probability or opinion particles.</p>
            </div>
            <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-white/5">
              <h4 className="text-xs font-black text-brand-400">Hedging</h4>
              <p className="text-[10px] text-zinc-400 mt-1">Presents suggestions and claims moderately to avoid rigidity.</p>
            </div>
            <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-white/5">
              <h4 className="text-xs font-black text-brand-400">Softening & Concession</h4>
              <p className="text-[10px] text-zinc-400 mt-1">Acknowledges the other side first before expressing disagreement.</p>
            </div>
          </div>

          {/* Stance Slider */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 space-y-3 text-left">
            <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono font-bold uppercase">
              <span>Interactive Stance Slider</span>
              <Sliders className="w-3.5 h-3.5 text-brand-400" />
            </div>

            <input 
              type="range" 
              min="0" 
              max="100" 
              value={sliderVal}
              onChange={(e) => setSliderVal(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />

            <div className="flex justify-between text-[9px] text-zinc-500 font-bold font-mono">
              <span className={sliderVal < 33 ? "text-white" : ""}>STRONG</span>
              <span className={sliderVal >= 33 && sliderVal < 66 ? "text-white" : ""}>CAUTIOUS</span>
              <span className={sliderVal >= 66 ? "text-white" : ""}>TENTATIVE</span>
            </div>

            {(() => {
              const info = getSliderLevelInfo();
              return (
                <div className="p-3 bg-zinc-900 rounded-xl border border-white/[0.03] space-y-1 animate-fade-in">
                  <p className="text-xs font-black text-white">{info.title}</p>
                  <p className="text-[10px] text-zinc-400">{info.desc}</p>
                  <p className="text-[10px] font-korean text-brand-300 pt-1 font-bold">Example: {info.ex}</p>
                </div>
              );
            })()}
          </div>

          {/* Softening phrase list */}
          <div className="space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">High-Value Stance Markers (phrase toolbox)</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(coreData.softening_phrases || []).map((phrase: any) => (
                <div 
                  key={phrase.ko}
                  className="p-3 bg-zinc-900 rounded-xl border border-white/5 flex justify-between items-center"
                >
                  <div>
                    <p className="font-korean font-black text-xs text-white">{phrase.ko}</p>
                    <p className="text-[9px] text-zinc-400 font-medium">{phrase.en}</p>
                  </div>
                  <button 
                    onClick={() => playAudio(phrase.ko)}
                    className="p-1.5 bg-zinc-950 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white border border-white/5 transition cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Micro-reflection concept check */}
          <div className="p-4 bg-zinc-900/60 rounded-xl border border-white/5 text-left space-y-3">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-brand-400" />
              <span>Concept Check: Which of the following sentences uses softening to respectfully disagree?</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <button
                onClick={() => !conceptChecked && setConceptAnswer("A")}
                disabled={conceptChecked}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                  conceptAnswer === "A" 
                    ? "border-brand-500 bg-brand-500/10 text-white" 
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                } ${conceptChecked && conceptAnswer === "A" && !conceptCorrect ? "border-accent-pink bg-accent-pink/5" : ""}`}
              >
                <span className="block text-[9px] text-zinc-500 mb-1">Option A:</span>
                <span className="font-korean">그 의견은 틀렸습니다.</span>
              </button>
              <button
                onClick={() => !conceptChecked && setConceptAnswer("B")}
                disabled={conceptChecked}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                  conceptAnswer === "B" 
                    ? "border-brand-500 bg-brand-500/10 text-white" 
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                } ${conceptChecked && conceptAnswer === "B" && conceptCorrect ? "border-accent-teal bg-accent-teal/5" : ""}`}
              >
                <span className="block text-[9px] text-brand-400 mb-1">Option B (Softened):</span>
                <span className="font-korean">그 의견도 이해하지만, 다르게 볼 수도 있습니다.</span>
              </button>
              <button
                onClick={() => !conceptChecked && setConceptAnswer("C")}
                disabled={conceptChecked}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                  conceptAnswer === "C" 
                    ? "border-brand-500 bg-brand-500/10 text-white" 
                    : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10"
                } ${conceptChecked && conceptAnswer === "C" && !conceptCorrect ? "border-accent-pink bg-accent-pink/5" : ""}`}
              >
                <span className="block text-[9px] text-zinc-500 mb-1">Option C:</span>
                <span className="font-korean">저는 전혀 동의하지 않습니다.</span>
              </button>
            </div>

            {conceptChecked && (
              <div className={`p-3 rounded-lg border text-[11px] ${conceptCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                {conceptCorrect 
                  ? "✓ Correct! Option B concedes/acknowledges the opinion ('그 의견도 이해하지만...') before introducing a soft counterargument." 
                  : "✗ Incorrect. Option B is correct because it uses softening and concession. Direct rejection sounds blunt in professional or sensitive Korean contexts."}
              </div>
            )}

            {!conceptChecked && conceptAnswer && (
              <div className="flex justify-end">
                <button
                  onClick={handleCheckConcept}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Verify Concept
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 6 Phase 3 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 3 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(1)} className="glass-panel px-4 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button 
              onClick={() => setStep(3)} 
              disabled={!conceptChecked}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              Start Activity 1 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Activity 1 – Label the certainty */}
      {step === 3 && recognitionData && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity A: Label the certainty</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Item {activeRecIdx + 1}/{recognitionData.recognition_items.length}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Analyze the stance in the following sentence:</p>
            
            <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase">Korean Sentence:</span>
                <button 
                  onClick={() => playAudio(recognitionData.recognition_items[activeRecIdx].sentence)}
                  className="p-1 bg-zinc-900 border border-white/5 rounded text-[9px] text-zinc-300 hover:text-white px-2 flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Listen
                </button>
              </div>
              <p className="font-korean text-zinc-100 text-lg leading-relaxed font-black">{recognitionData.recognition_items[activeRecIdx].sentence}</p>
              <p className="text-xs text-zinc-400 italic">Translation: "{recognitionData.recognition_items[activeRecIdx].translation}"</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-white">Select the stance certainty level:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {["strong", "balanced", "tentative"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => !recChecked && setSelectedStanceStrength(lvl)}
                    className={`p-4 rounded-xl border text-xs font-bold transition capitalize ${
                      selectedStanceStrength === lvl 
                        ? "border-brand-500 bg-brand-500/10 text-white" 
                        : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                    } ${recChecked && lvl === recognitionData.recognition_items[activeRecIdx].stance ? "border-accent-teal bg-accent-teal/5 text-white" : ""}`}
                    disabled={recChecked}
                  >
                    {lvl === "strong" ? "Strong / Certain" : lvl === "balanced" ? "Balanced / Cautious" : "Tentative / Hedged"}
                  </button>
                ))}
              </div>
            </div>

            {recChecked && (
              <div className={`p-4 rounded-xl border text-xs space-y-1.5 animate-fade-in ${recCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                <p className="font-black">{recCorrect ? "✓ Correct Level Identification!" : "✗ Mismatch. Review markers:"}</p>
                <p className="text-zinc-300 leading-normal">
                  {recognitionData.recognition_items[activeRecIdx].explanation}
                </p>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Stance markers: {recognitionData.recognition_items[activeRecIdx].markers.join(", ")}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 6 Phase 3 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 3 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
              <button onClick={() => {
    if (courseXP < 160) {
      window.dispatchEvent(new CustomEvent("hangeulai-warning", { detail: { message: String("To start Phase 3, you need at least 160 XP in this course. You currently have " + courseXP + " XP. Please complete earlier steps/phases to earn more XP!") } }));
      return;
    }
    setStep(2);
  }} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
              {!recChecked ? (
                <button
                  onClick={handleCheckActivity1}
                  disabled={!selectedStanceStrength}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Verify Stance
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (activeRecIdx < recognitionData.recognition_items.length - 1) {
                      setActiveRecIdx(prev => prev + 1);
                      setSelectedStanceStrength(null);
                      setRecChecked(false);
                      setRecCorrect(null);
                    } else {
                      setStep(4);
                    }
                  }}
                  className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {activeRecIdx < recognitionData.recognition_items.length - 1 ? "Next Sentence" : "Proceed to Activity 2"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Activity 2 – Hedged vs unhedged rejections */}
      {step === 4 && recognitionData && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity B: Which version is appropriate?</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Scenario {activeHvuIdx + 1}/{recognitionData.hedged_vs_unhedged.length}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            <p className="text-xs text-zinc-400 font-black uppercase tracking-wider block">Context Description:</p>
            <div className="p-4 bg-zinc-950/60 rounded-xl border border-white/5">
              <p className="text-xs text-zinc-300 font-bold">{recognitionData.hedged_vs_unhedged[activeHvuIdx].context}</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-white">Select the most appropriate rejection/claim version:</p>
              
              <button
                onClick={() => !hvuChecked && setSelectedHvuOption("unhedged")}
                className={`w-full p-4 rounded-2xl border text-left flex flex-col justify-between transition ${
                  selectedHvuOption === "unhedged" 
                    ? "border-brand-500 bg-brand-500/10 text-white" 
                    : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                } ${hvuChecked && selectedHvuOption === "unhedged" && !hvuCorrect ? "border-accent-pink bg-accent-pink/5" : ""}`}
                disabled={hvuChecked}
              >
                <div>
                  <span className="text-[8px] uppercase tracking-widest font-mono text-zinc-500 font-black">Plain / Blunt Claim</span>
                  <p className="font-korean text-zinc-200 text-sm mt-1.5 leading-relaxed font-black">{recognitionData.hedged_vs_unhedged[activeHvuIdx].unhedged}</p>
                </div>
              </button>

              <button
                onClick={() => !hvuChecked && setSelectedHvuOption("hedged")}
                className={`w-full p-4 rounded-2xl border text-left flex flex-col justify-between transition ${
                  selectedHvuOption === "hedged" 
                    ? "border-brand-500 bg-brand-500/10 text-white" 
                    : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                } ${hvuChecked && hvuCorrect ? "border-accent-teal bg-accent-teal/5 text-white" : ""}`}
                disabled={hvuChecked}
              >
                <div>
                  <span className="text-[8px] uppercase tracking-widest font-mono text-brand-450 font-black">Hedged / Softened Version</span>
                  <p className="font-korean text-zinc-200 text-sm mt-1.5 leading-relaxed font-black">{recognitionData.hedged_vs_unhedged[activeHvuIdx].hedged}</p>
                </div>
              </button>
            </div>

            {hvuChecked && (
              <div className={`p-4 rounded-xl border text-xs space-y-1.5 animate-fade-in ${hvuCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                <p className="font-black">{hvuCorrect ? "✓ Correct! Softening makes rejection respectful." : "✗ Mismatch. Plain, blunt claims can sound demanding or aggressive to senior speakers."}</p>
                <p className="text-zinc-300 leading-normal">
                  {recognitionData.hedged_vs_unhedged[activeHvuIdx].explanation}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 6 Phase 3 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 3 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
              <button onClick={() => setStep(3)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
              {!hvuChecked ? (
                <button
                  onClick={handleCheckActivity2}
                  disabled={!selectedHvuOption}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Verify Selection
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (activeHvuIdx < recognitionData.hedged_vs_unhedged.length - 1) {
                      setActiveHvuIdx(prev => prev + 1);
                      setSelectedHvuOption(null);
                      setHvuChecked(false);
                      setHvuCorrect(null);
                    } else {
                      setStep(5);
                    }
                  }}
                  className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {activeHvuIdx < recognitionData.hedged_vs_unhedged.length - 1 ? "Next Scenario" : "Proceed to Activity 3"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Activity 3 – Highlight the softening marker in dialogues */}
      {step === 5 && recognitionData && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity C: Find the concession phrase</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Dialogue {activeDsIdx + 1}/{recognitionData.dialogues_softening.length}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            <p className="text-xs text-zinc-400 font-black uppercase tracking-wider block">Dialogue Context:</p>
            
            <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 space-y-4">
              <p className="font-korean text-zinc-200 text-sm whitespace-pre-line leading-relaxed font-black">
                {recognitionData.dialogues_softening[activeDsIdx].dialogue_ko.split("\n").map((line: string, lIdx: number) => {
                  if (line.startsWith("B:")) {
                    const responsePart = line.slice(2).trim();
                    const targetPhrase = recognitionData.dialogues_softening[activeDsIdx].softening_marker;
                    
                    return (
                      <span key={lIdx} className="block mt-1">
                        <strong className="text-brand-400 font-mono">B:</strong>{" "}
                        {responsePart.split(targetPhrase).map((chunk: string, cIdx: number) => (
                          <span key={cIdx}>
                            {chunk}
                            {cIdx === 0 && (
                              <button
                                onClick={() => !dsChecked && setHighlightedPhrase(targetPhrase)}
                                className={`px-2 py-1 rounded border transition font-bold font-korean ${
                                  highlightedPhrase === targetPhrase 
                                    ? "border-brand-500 bg-brand-500/20 text-white shadow-lg" 
                                    : "border-white/10 bg-zinc-900 text-zinc-300 hover:border-white/20"
                                }`}
                                disabled={dsChecked}
                              >
                                {targetPhrase}
                              </button>
                            )}
                          </span>
                        ))}
                      </span>
                    );
                  }
                  return <span key={lIdx} className="block text-zinc-400"><strong className="text-zinc-500 font-mono">A:</strong> {line.slice(2).trim()}</span>;
                })}
              </p>
            </div>

            {dsChecked && (
              <div className={`p-4 rounded-xl border text-xs space-y-1.5 animate-fade-in ${dsCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                <p className="font-black">{dsCorrect ? "✓ Correct Softening Highlight!" : "✗ Mismatch. Look for the phrase that admits a point."}</p>
                <p className="text-zinc-300 leading-normal">
                  The phrase <strong className="font-korean">"{recognitionData.dialogues_softening[activeDsIdx].softening_marker}"</strong> is used to acknowledge the other speaker's point (concession) before offering a counterargument.
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 6 Phase 3 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 3 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
              <button onClick={() => setStep(4)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
              {!dsChecked ? (
                <button
                  onClick={handleCheckActivity3}
                  disabled={!highlightedPhrase}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Verify Softener Highlight
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (activeDsIdx < recognitionData.dialogues_softening.length - 1) {
                      setActiveDsIdx(prev => prev + 1);
                      setHighlightedPhrase(null);
                      setDsChecked(false);
                      setDsCorrect(null);
                    } else {
                      setStep(6);
                    }
                  }}
                  className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {activeDsIdx < recognitionData.dialogues_softening.length - 1 ? "Next Dialogue" : "Proceed to Activity 4"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 6: Activity 4 – Rewrite stance with chips */}
      {step === 6 && rewriteTemplates && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity D: Change the stance without changing content</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Template {activeRewriteIdx + 1}/{rewriteTemplates.rewrite_templates.length}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Base Opinion with Target Segment:</span>
            
            <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 space-y-2">
              <span className="text-[8px] text-zinc-500 font-mono uppercase">Strong Sentence:</span>
              <p className="font-korean text-zinc-100 text-base leading-relaxed">
                {rewriteTemplates.rewrite_templates[activeRewriteIdx].plain_text.split(rewriteTemplates.rewrite_templates[activeRewriteIdx].underlined).map((chunk: string, idx: number) => (
                  <span key={idx}>
                    {chunk}
                    {idx === 0 && <span className="underline decoration-brand-450 decoration-2 font-black text-brand-400 bg-brand-500/5 px-1 rounded">{rewriteTemplates.rewrite_templates[activeRewriteIdx].underlined}</span>}
                  </span>
                ))}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] gap-2">
                <span className="text-zinc-400 font-bold uppercase font-mono">Target Stance Level:</span>
                <div className="flex gap-1.5">
                  {["balanced", "tentative"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => {
                        setTargetStanceLevel(lvl);
                        setSelectedRewriteChip(null);
                        setRewriteFeedback(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition capitalize border ${
                        targetStanceLevel === lvl 
                          ? "border-brand-500 bg-brand-500/10 text-white" 
                          : "border-white/5 bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-300">Choose alternative stance marker chip:</p>
                <div className="grid grid-cols-2 gap-2">
                  {rewriteTemplates.rewrite_templates[activeRewriteIdx].options.map((opt: any) => (
                    <button
                      key={opt.text}
                      onClick={() => !rewriteFeedback && setSelectedRewriteChip(opt.text)}
                      className={`p-3.5 rounded-xl border text-xs font-bold font-korean text-left transition flex justify-between items-center ${
                        selectedRewriteChip === opt.text
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                      } ${rewriteFeedback && opt.stance === targetStanceLevel ? "border-accent-teal bg-accent-teal/5 text-white" : ""}`}
                      disabled={!!rewriteFeedback}
                    >
                      <span>{opt.text}</span>
                      <span className="text-[8px] uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-950 text-zinc-500 font-mono">
                        {opt.stance}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {rewriteFeedback && (
              <div className={`p-4 rounded-xl border text-xs space-y-1.5 animate-fade-in ${rewriteFeedback.is_correct ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"}`}>
                <p className="font-black">{rewriteFeedback.is_correct ? "✓ Correct Stance Shift!" : "✗ Mismatch. Selected chip does not match target stance level."}</p>
                <p className="text-zinc-350 leading-normal">{rewriteFeedback.feedback}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 6 Phase 3 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 3 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
              <button onClick={() => setStep(5)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
              {!rewriteFeedback ? (
                <button
                  onClick={handleCheckActivity4}
                  disabled={!selectedRewriteChip || submittingRewrite}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingRewrite && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Rewrite</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (activeRewriteIdx < rewriteTemplates.rewrite_templates.length - 1) {
                      setActiveRewriteIdx(prev => prev + 1);
                      setSelectedRewriteChip(null);
                      setRewriteFeedback(null);
                    } else {
                      setStep(7);
                    }
                  }}
                  className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {activeRewriteIdx < rewriteTemplates.rewrite_templates.length - 1 ? "Next Sentence" : "Proceed to Activity 5"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 7: Activity 5 – Partial agreement patterns */}
      {step === 7 && rewriteTemplates && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity E: Agree, disagree, or partially agree</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Template {activePaIdx + 1}/{rewriteTemplates.partial_agreement_templates.length}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Prompt Claim Statement:</span>
            
            <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 space-y-2">
              <span className="text-[8px] text-zinc-500 font-mono uppercase">Original Argument:</span>
              <p className="font-korean text-zinc-100 text-base font-black">"{rewriteTemplates.partial_agreement_templates[activePaIdx].statement}"</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-300">Select response pattern tile option:</p>
              <div className="space-y-2">
                {rewriteTemplates.partial_agreement_templates[activePaIdx].options.map((opt: any) => (
                  <button
                    key={opt.ko_phrase}
                    onClick={() => !paFeedback && setSelectedPaOption(opt.ko_phrase)}
                    className={`w-full p-4 rounded-xl border text-left text-xs transition flex flex-col justify-between ${
                      selectedPaOption === opt.ko_phrase
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/10"
                    }`}
                    disabled={!!paFeedback}
                  >
                    <span className="text-[8px] uppercase tracking-widest font-mono text-brand-400 block mb-1 font-black">{opt.label}</span>
                    <span className="font-korean text-zinc-200 font-black">{opt.ko_phrase}</span>
                  </button>
                ))}
              </div>
            </div>

            {paFeedback && (
              <div className="p-4 bg-zinc-950 rounded-xl border border-accent-teal/20 text-accent-teal text-xs space-y-1.5 animate-fade-in">
                <p className="font-black">✓ Response Registered!</p>
                <p className="text-zinc-350 leading-normal">{paFeedback.feedback}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 6 Phase 3 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 3 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
              <button onClick={() => setStep(6)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
              {!paFeedback ? (
                <button
                  onClick={handleCheckActivity5}
                  disabled={!selectedPaOption || submittingPa}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingPa && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Register Response Pattern</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (activePaIdx < rewriteTemplates.partial_agreement_templates.length - 1) {
                      setActivePaIdx(prev => prev + 1);
                      setSelectedPaOption(null);
                      setPaFeedback(null);
                    } else {
                      setStep(8);
                    }
                  }}
                  className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {activePaIdx < rewriteTemplates.partial_agreement_templates.length - 1 ? "Next Statement" : "Proceed to Activity 6"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 8: Activity 6 – Live dialogue with stance variety */}
      {step === 8 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity F: Apply stance in conversation</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 8 of {totalSteps}</span>
          </div>

          <div className="space-y-4 text-left animate-fade-in">
            {!chatStarted ? (
              <div className="space-y-4 max-w-md mx-auto w-full">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Select a debatable topic to discuss with Gwan-Sik:</span>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">Debatable Topic:</label>
                  <select
                    value={chatTopic}
                    onChange={(e) => setChatTopic(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 p-3.5 rounded-xl outline-none text-xs text-white"
                  >
                    <option value="Study and work balance">Study and work balance (학업과 일의 균형)</option>
                    <option value="Social media and daily life">Social media and daily life (소셜 미디어와 일상)</option>
                    <option value="Working in teams vs alone">Working in teams vs alone (협동 업무와 개인 업무)</option>
                  </select>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleStartDiscussion}
                    className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" /> Start Debate Room
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {/* Live debate goals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-bold">
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    goalSofteningUsed ? "bg-accent-teal/10 border-accent-teal/30 text-accent-teal" : "bg-zinc-900 border-white/5 text-zinc-500"
                  }`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Used softening/hedging marker (e.g. 것 같다, 대체로)</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    goalConcessionUsed ? "bg-accent-teal/10 border-accent-teal/30 text-accent-teal" : "bg-zinc-900 border-white/5 text-zinc-500"
                  }`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Used concession/partial agreement (e.g. 일리가 있다)</span>
                  </div>
                </div>

                {/* Message logs */}
                <div className="bg-zinc-950 rounded-2xl border border-white/5 p-4 h-48 overflow-y-auto space-y-3 pr-1">
                  {aiMessages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs ${
                        msg.sender === "user" 
                          ? "bg-brand-500 text-white rounded-br-none" 
                          : "bg-zinc-900 text-zinc-300 rounded-bl-none border border-white/5"
                      }`}>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {aiFinished && aiEvaluation && (
                  <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-xs space-y-2 animate-fade-in">
                    <div className="flex justify-between items-center font-bold text-white mb-1">
                      <span className="flex items-center gap-1"><Award className="w-4 h-4 text-brand-400" /> Stance Quality Summary</span>
                      <span className="text-brand-400">Hedging markers used: {aiEvaluation.hedging_count}</span>
                    </div>
                    <p className="text-zinc-300 leading-normal">{aiEvaluation.feedback}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Stance variety level: {aiEvaluation.stance_variety || "Medium"}</p>
                  </div>
                )}

                {!aiFinished && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                      placeholder="Type your response in Korean using softening markers..."
                      className="flex-grow bg-zinc-900 border border-white/10 p-3 rounded-xl outline-none focus:border-brand-500 text-xs text-white"
                      onKeyDown={(e) => e.key === "Enter" && handleSendAiTurn()}
                    />
                    {mode === "voice" && (
                      <button 
                        onClick={() => setAiText("제 생각에는 대체로 맞는 말씀이지만, 한편으로는 다른 문제도 있습니다.")}
                        className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-zinc-400 hover:text-white"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={handleSendAiTurn}
                      disabled={aiSending || !aiText.trim()}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {aiSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send"}
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button 
                    onClick={() => {
                      setChatStarted(false);
                      setGoalSofteningUsed(false);
                      setGoalConcessionUsed(false);
                    }} 
                    className="text-xs text-zinc-500 hover:underline"
                  >
                    Reset debate topic
                  </button>
                  <div className="flex gap-2">
                    {!aiFinished && (
                      <button
                        onClick={handleFinishDiscussion}
                        disabled={finishingDiscussion}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {finishingDiscussion && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Finish & Evaluate Stance</span>
                      </button>
                    )}
                    {aiFinished && (
                      <button
                        onClick={() => setStep(9)}
                        className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Proceed to Stance Quiz
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 9: Activity 7 – Stance strategy quiz */}
      {step === 9 && quizBlueprint.length > 0 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" />
              <span>Activity G: Final stance quiz</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Question {quizIdx + 1}/{quizBlueprint.length}</span>
          </div>

          <div className="space-y-4 text-left">
            <p className="text-sm font-extrabold text-white leading-relaxed">
              {quizBlueprint[quizIdx].question}
            </p>

            <div className="space-y-2">
              {quizBlueprint[quizIdx].options.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                  className={`w-full p-4 rounded-xl text-left text-xs font-medium border transition ${
                    quizSelectedOpt === opt 
                      ? "border-brand-500 bg-brand-500/10 text-white" 
                      : "border-white/5 bg-zinc-900/60 text-zinc-400 hover:border-white/10"
                  } ${quizChecked && opt === quizBlueprint[quizIdx].correct_answer ? "border-accent-teal bg-accent-teal/10 text-white font-bold" : ""}`}
                  disabled={quizChecked}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {quizChecked && (
            <div className={`p-4 rounded-2xl border text-xs space-y-1.5 animate-fade-in ${
              quizCorrect 
                ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" 
                : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"
            }`}>
              <p className="font-black">{quizCorrect ? "✓ Correct!" : `✗ Incorrect (Correct Answer: ${quizBlueprint[quizIdx].correct_answer})`}</p>
              <p className="text-zinc-350 leading-normal">{quizBlueprint[quizIdx].explanation}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("hangeulai-add-note", {
                  detail: {
                    question: `Course 6 Phase 3 Step ${step} - Study Concept`,
                    selected_answer: "Interactive Study Materials",
                    correct_answer: "Verified Korean Curriculum",
                    is_correct: true,
                    explanation: `Study notes for Course 6 Phase 3 Step ${step}.`
                  }
                }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
              title="Add this theory summary to your diary notes"
            >
              + Add to Notes
            </button>
  
            <button onClick={() => setStep(8)} className="glass-panel px-4 py-2 rounded-xl text-zinc-400 text-xs font-bold flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
            {!quizChecked ? (
              <button
                onClick={handleCheckQuiz}
                disabled={!quizSelectedOpt}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Verify Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuizOrComplete}
                disabled={finishingQuiz}
                className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {finishingQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{quizIdx < quizBlueprint.length - 1 ? "Next Question" : "Complete & Receive Badge"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 10: Completion / Graduation */}
      {step === 10 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-4 bg-accent-teal/10 rounded-full border border-accent-teal/25 w-fit mx-auto text-accent-teal shrink-0">
            <Award className="w-12 h-12 animate-bounce shrink-0" />
          </div>

          <h2 className="text-3xl font-black text-white">Stance & Soft Power Completion</h2>
          <p className="text-xs text-zinc-400">Congratulations! You have completed Phase 3 and earned your graduation credentials:</p>

          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-white/5 max-w-sm mx-auto w-full flex items-center gap-4 text-left shadow-lg">
            <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/25">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white">{quizBadge || "Nuanced Communicator C1"}</p>
              <p className="text-[10px] text-zinc-400">Graduation Score: {quizScore || 100}% | +150 XP rewarded</p>
            </div>
          </div>

          {/* Homework recommended lists */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 text-left space-y-3 max-w-md mx-auto w-full">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Spaced Homework Recommendations:</span>
            
            <div className="space-y-2">
              {(homeworkItems.length > 0 ? homeworkItems : [
                { id: "hw1", text: "Identify stance markers in a Korean newspaper editorial." },
                { id: "hw2", text: "Practice softening three blunt disagreements with classmates." }
              ]).map((item: any) => (
                <div 
                  key={item.id}
                  onClick={() => handleToggleHomework(item.id, !!completedHomework[item.id])}
                  className="flex items-start gap-3 p-2.5 bg-zinc-900 rounded-xl border border-white/[0.03] hover:border-brand-500/20 transition cursor-pointer"
                >
                  <button className="mt-0.5 shrink-0">
                    <CheckSquare className={`w-4 h-4 ${completedHomework[item.id] ? "text-accent-teal" : "text-zinc-600"}`} />
                  </button>
                  <p className="text-[11px] text-zinc-350 leading-normal">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Practice nuanced opinions with AI tutor */}
          {!practiceSessionId ? (
            <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-md mx-auto w-full space-y-2 text-left">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Optional AI Stance Room:</span>
              <p className="text-[10px] text-zinc-400">Practice shifting opinions between Strong and Cautious versions in a live tutoring room.</p>
              <div className="flex justify-end">
                <button
                  onClick={handleStartStancePractice}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Practice Nuanced Opinions
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 max-w-md mx-auto w-full space-y-3 text-left animate-fade-in">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">AI Stance Coaching Room:</span>
              
              <div className="bg-zinc-900/60 border border-white/[0.04] p-3 rounded-xl h-36 overflow-y-auto space-y-2 pr-1">
                {practiceMessages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`p-2.5 rounded-xl max-w-[85%] text-[10px] ${
                      m.sender === "user" ? "bg-brand-500 text-white" : "bg-zinc-950 text-zinc-300 border border-white/5"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              {practiceFinished && practiceFeedback && (
                <div className="bg-zinc-900 p-3 rounded-xl border border-white/5 text-[10px] text-zinc-300 leading-normal animate-fade-in">
                  <span className="font-bold text-white block mb-0.5">Tutor Stance Summary:</span>
                  {practiceFeedback}
                </div>
              )}

              {!practiceFinished ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={practiceText}
                    onChange={(e) => setPracticeText(e.target.value)}
                    placeholder="Type opinion sentence..."
                    className="flex-grow bg-zinc-900 border border-white/10 p-2.5 rounded-lg outline-none focus:border-brand-500 text-[11px] text-white"
                  />
                  <button
                    onClick={handleSendPracticeTurn}
                    disabled={practiceSending || !practiceText.trim()}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {practiceSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send"}
                  </button>
                  <button
                    onClick={handleFinishPractice}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border border-white/5"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setPracticeSessionId(null);
                      setPracticeMessages([]);
                      setPracticeFinished(false);
                    }}
                    className="text-[10px] text-zinc-500 underline"
                  >
                    Start another practice
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 max-w-xs mx-auto pt-4 border-t border-white/5 w-full">
            <button 
              onClick={() => {
                // Dispatch completion bonus XP
                window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 150, type: "correct" } }));onComplete();
              }}
              className="bg-accent-teal hover:bg-accent-teal/90 text-zinc-950 font-black py-4 px-8 rounded-xl transition text-base flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-accent-teal/20"
            >
              <span>Graduate Phase 3</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Next: Phase 4 – High‑Level Register & Style (Social / Academic / Professional)</p>
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
                
                // Find matching blueprint question index
                const bpIdx = (quizBlueprint || []).findIndex((q: any) => q.correct_answer === m || q.question === m || q.correctId === m);
                if (bpIdx !== -1) {
                  if (typeof setQuizIdx === "function") setQuizIdx(bpIdx);
                if (typeof setQuizChecked === "function") setQuizChecked(false);
                if (typeof setQuizCorrect === "function") setQuizCorrect(null);
                if (typeof setQuizScore === "function") setQuizScore(null);
                if (typeof setQuizSelectedOpt === "function") setQuizSelectedOpt(null);
                }

                // Remove from mistakes list
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
