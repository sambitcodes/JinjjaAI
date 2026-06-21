"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, ChevronRight, Award, Loader2, BookOpen, Layers, Volume2, Sparkles, BookMarked, BrainCircuit, RefreshCw, Compass } from "lucide-react";
import { apiRequest, ensureAuthenticated } from "../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import Phase1VowelBootcampWizard from "../../components/Phase1VowelBootcampWizard";
import Phase2ConsonantWizard from "../../components/Phase2ConsonantWizard";
import Phase3SyllableBlocksWizard from "../../components/Phase3SyllableBlocksWizard";
import Phase4RealWordsWizard from "../../components/Phase4RealWordsWizard";
import Phase5SpeakingLabWizard from "../../components/Phase5SpeakingLabWizard";
import Phase6ConversationWizard from "../../components/Phase6ConversationWizard";
import Course2Phase1GreetingsWizard from "../../components/Course2Phase1GreetingsWizard";
import Course2Phase2SelfIntroWizard from "../../components/Course2Phase2SelfIntroWizard";
import Course2Phase3NumbersWizard from "../../components/Course2Phase3NumbersWizard";
import Course2Phase4RoutineWizard from "../../components/Course2Phase4RoutineWizard";
import Course2Phase5LocationWizard from "../../components/Course2Phase5LocationWizard";
import Course2Phase6ConversationWizard from "../../components/Course2Phase6ConversationWizard";
import Course3Phase1LongerRoutinesWizard from "../../components/Course3Phase1LongerRoutinesWizard";
import Course3Phase2PreferencesWizard from "../../components/Course3Phase2PreferencesWizard";
import Course3Phase3PastRoutinesWizard from "../../components/Course3Phase3PastRoutinesWizard";
import Course3Phase4PlansWizard from "../../components/Course3Phase4PlansWizard";
import Course3Phase5StoriesWizard from "../../components/Course3Phase5StoriesWizard";
import Course3Phase6ConversationWizard from "../../components/Course3Phase6ConversationWizard";
import Course4Phase1ConnectorsWizard from "../../components/Course4Phase1ConnectorsWizard";
import Course4Phase2DescriptionsWizard from "../../components/Course4Phase2DescriptionsWizard";
import Course4Phase3AnecdotesWizard from "../../components/Course4Phase3AnecdotesWizard";
import Course4Phase4OpinionsWizard from "../../components/Course4Phase4OpinionsWizard";
import Course4Phase5ParagraphsWizard from "../../components/Course4Phase5ParagraphsWizard";
import Course4Phase6CapstoneWizard from "../../components/Course4Phase6CapstoneWizard";
import Course5Phase1FluencyWizard from "../../components/Course5Phase1FluencyWizard";
import Course5Phase2TravelWizard from "../../components/Course5Phase2TravelWizard";
import Course5Phase3SocialWizard from "../../components/Course5Phase3SocialWizard";
import Course5Phase4RegisterWizard from "../../components/Course5Phase4RegisterWizard";
import Course5Phase5ListeningWizard from "../../components/Course5Phase5ListeningWizard";
import Course5Phase6CapstoneWizard from "../../components/Course5Phase6CapstoneWizard";
import Course6Phase1FluencyWizard from "../../components/Course6Phase1FluencyWizard";
import Course6Phase2IdiomsWizard from "../../components/Course6Phase2IdiomsWizard";
import Course6Phase3StanceWizard from "../../components/Course6Phase3StanceWizard";
import Course6Phase4RegisterWizard from "../../components/Course6Phase4RegisterWizard";
import Course6Phase5ImplicitWizard from "../../components/Course6Phase5ImplicitWizard";
import Course6Phase6CapstoneWizard from "../../components/Course6Phase6CapstoneWizard";
import Course7Phase1GrammarLabWizard from "../../components/Course7Phase1GrammarLabWizard";
import Course7Phase2ParticlesWizard from "../../components/Course7Phase2ParticlesWizard";
import Course7Phase3PolitenessWizard from "../../components/Course7Phase3PolitenessWizard";
import Course7Phase4AdjectivesWizard from "../../components/Course7Phase4AdjectivesWizard";
import Course7Phase5ConnectorsWizard from "../../components/Course7Phase5ConnectorsWizard";
import Course7Phase6TenseAspectWizard from "../../components/Course7Phase6TenseAspectWizard";
import Course8Phase1PronunciationWizard from "../../components/Course8Phase1PronunciationWizard";
import Course8Phase2BatchimWizard from "../../components/Course8Phase2BatchimWizard";
import Course8Phase3RhythmWizard from "../../components/Course8Phase3RhythmWizard";
import Course8Phase4ListeningWizard from "../../components/Course8Phase4ListeningWizard";
import Course8Phase5PoliteEndingsWizard from "../../components/Course8Phase5PoliteEndingsWizard";
import Course8Phase6ConnectedSpeechWizard from "../../components/Course8Phase6ConnectedSpeechWizard";
import Course8Phase7IntonationWizard from "../../components/Course8Phase7IntonationWizard";
import Course8Phase8ConversationWizard from "../../components/Course8Phase8ConversationWizard";
import Course8Phase9ListeningGistDetailWizard from "../../components/Course8Phase9ListeningGistDetailWizard";
import Course8Phase10ReactionWizard from "../../components/Course8Phase10ReactionWizard";
import Course8Phase11StoryWizard from "../../components/Course8Phase11StoryWizard";
import Course8Phase12MediaWizard from "../../components/Course8Phase12MediaWizard";













interface Example {
  ko: string;
  en: string;
  note: string;
}

interface Quiz {
  type: "choice" | "writing";
  question: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string;
}

interface CuratedLesson {
  id: string;
  title: string;
  level: number;
  topic: string;
  content_markdown: string;
  examples: Example[];
  quizzes: Quiz[];
}

export default function LessonPlayer() {
  const [lessons, setLessons] = useState<CuratedLesson[]>([]);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState(1); // 1 = explanation, 2 = quizzes
  const [quizIdx, setQuizIdx] = useState(0); // 0 = first quiz, 1 = second quiz
  
  // Choice quiz states
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  // Writing quiz states
  const [writingAnswer, setWritingAnswer] = useState("");
  
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  
  // Floating XP animation states
  const [floatingTexts, setFloatingTexts] = useState<Array<{ id: number; text: string; type: string; x: number; y: number }>>([]);
  
  // Adaptive metrics tracker
  const [mistakesCount, setMistakesCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [showSyllabus, setShowSyllabus] = useState(true);
  const [curatingNext, setCuratingNext] = useState(false);
  const [savingXp, setSavingXp] = useState(false);

  const [generatingOnSpot, setGeneratingOnSpot] = useState(false);
  const [showCourseSelector, setShowCourseSelector] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("Core Path");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Course progress states
  interface CourseState {
    lastPhase: number;
    completedPhases: number[];
    totalXP: number;
    lastVisited: string | null;
  }
  const [courseStates, setCourseStates] = useState<Record<number, CourseState>>({});
  const [profile, setProfile] = useState<any>(null);
  const activeStepRef = useRef<{ courseId: number; phaseNum: number; step: number } | null>(null);

  // Phase 1 Wizard States
  
  const activeLesson = lessons[activeIdx];
  const activeQuiz = activeLesson?.quizzes?.[quizIdx];

  // Clean custom markdown renderer
  const renderMarkdown = (md: string) => {
    if (!md) return null;
    const lines = md.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-3" />;
      }
      
      // Headers
      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-2xl md:text-3xl lg:text-4xl font-black text-white mt-6 mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-400" />
            {trimmed.slice(2)}
          </h1>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-xl md:text-2xl lg:text-3xl font-black text-zinc-100 mt-5 mb-3 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-brand-400" />
            {trimmed.slice(3)}
          </h2>
        );
      }
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-lg md:text-xl lg:text-2xl font-extrabold text-amber-300 mt-5 mb-2.5">
            {trimmed.slice(4)}
          </h3>
        );
      }
      if (trimmed.startsWith("#### ")) {
        return (
          <h4 key={idx} className="text-sm md:text-base lg:text-lg font-black text-purple-400 uppercase tracking-widest mt-4 mb-2">
            {trimmed.slice(5)}
          </h4>
        );
      }
      
      // Bullet lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const content = trimmed.slice(2);
        return (
          <div key={idx} className="flex items-start gap-2.5 pl-4 my-1.5">
            <span className="text-brand-400 select-none mt-1.5">•</span>
            <span className="text-zinc-300 text-sm md:text-base lg:text-lg leading-relaxed">{parseInlineMarkdown(content)}</span>
          </div>
        );
      }
      
      // Ordered lists (numbers)
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-2.5 pl-4 my-1.5">
            <span className="text-brand-400 font-mono font-bold select-none text-sm mt-0.5">{numMatch[1]}.</span>
            <span className="text-zinc-300 text-sm md:text-base lg:text-lg leading-relaxed">{parseInlineMarkdown(numMatch[2])}</span>
          </div>
        );
      }
      
      // Paragraph
      return (
        <p key={idx} className="text-zinc-300 text-sm md:text-base lg:text-lg leading-relaxed my-2">
          {parseInlineMarkdown(trimmed)}
        </p>
      );
    });
  };

  const parseInlineMarkdown = (text: string) => {
    // Parse bold text: **text**
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <strong key={i} className="font-extrabold text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/5 mx-0.5 inline-block">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  async function loadLessons() {
    try {
      const user = await ensureAuthenticated();
      if (!user) return;
      const [data, profileData] = await Promise.all([
        apiRequest("/lessons/curated"),
        apiRequest("/progress/profile")
      ]);
      if (data && data.length > 0) {
        setLessons(data);
      } else {
        setLessons([]);
      }
      if (profileData) {
        setProfile(profileData);
        if (profileData.course_states) {
          setCourseStates(profileData.course_states);
        }
      }
    } catch (err) {
      console.error("Lessons loading failed:", err);
      // Fallback
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("hangeulai_course_state");
          if (saved) setCourseStates(JSON.parse(saved));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }

  const playCentralSound = (type: 'correct' | 'theory' | 'wrong') => {
    if (typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'correct') {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.stop(ctx.currentTime + 0.22);
      } else if (type === 'theory') {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440.00, ctx.currentTime); // A4
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.08); // C#5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.16); // E5
        osc.stop(ctx.currentTime + 0.30);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140.00, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      }
    } catch (e) {
      console.warn("Audio synthesis error:", e);
    }
  };

  useEffect(() => {
    loadLessons();
  }, []);

  // Use a ref so the event handler is always current without re-subscribing
  const xpHandlerRef = useRef<((e: Event) => Promise<void>) | null>(null);

  useEffect(() => {
    xpHandlerRef.current = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { amount, type } = customEvent.detail || { amount: 0, type: 'theory' };
      if (amount === 0) return;

      // For screen change theory XP, check if already rewarded
      if (type === 'theory') {
        // Wait briefly for step changes to commit to ref
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const activeStep = activeStepRef.current;
        if (activeStep) {
          const { courseId, phaseNum, step } = activeStep;
          const courseStateKey = "hangeulai_course_state";
          const stored = localStorage.getItem(courseStateKey);
          const states = stored ? JSON.parse(stored) : {};
          const existing = states[courseId] || { lastPhase: 1, completedPhases: [], totalXP: 0, lastVisited: null, phaseSteps: {}, rewardedSteps: [] };
          existing.rewardedSteps = existing.rewardedSteps || [];
          
          const stepKey = `${phaseNum}_${step}`;
          if (existing.rewardedSteps.includes(stepKey)) {
            console.log(`XP for step ${stepKey} in course ${courseId} already rewarded. Skipping.`);
            return;
          }
          
          existing.rewardedSteps.push(stepKey);
          states[courseId] = existing;
          localStorage.setItem(courseStateKey, JSON.stringify(states));
          setCourseStates(states);

          try {
            await apiRequest("/progress/profile", {
              method: "PATCH",
              body: JSON.stringify({
                course_states: states
              })
            });
          } catch (err) {
            console.error("Failed to sync step change rewardedSteps:", err);
          }
        }
      }
      
      // Play sound
      playCentralSound(type);
      
      // Floating text coords - spread across screen for visibility
      const id = Date.now() + Math.random();
      const x = typeof window !== "undefined" ? window.innerWidth / 2 + (Math.random() - 0.5) * 200 : 300;
      const y = typeof window !== "undefined" ? window.innerHeight * 0.4 + (Math.random() - 0.5) * 100 : 300;
      setFloatingTexts(prev => [...prev, { id, text: amount > 0 ? `+${amount} XP` : `${amount} XP`, type, x, y }]);
      setTimeout(() => {
        setFloatingTexts(prev => prev.filter(item => item.id !== id));
      }, 2000);
      
      // Update local state
      setProfile((prev: any) => {
        if (!prev) return prev;
        return { ...prev, total_xp: Math.max(0, (prev.total_xp || 0) + amount) };
      });
      
      // Update local storage course states if it is positive XP
      if (amount > 0) {
        try {
          const courseStateKey = "hangeulai_course_state";
          const stored = localStorage.getItem(courseStateKey);
          const states = stored ? JSON.parse(stored) : {};
          const courseId = activeLesson?.level ?? 1;
          const existing = states[courseId] || { lastPhase: 0, completedPhases: [], totalXP: 0, lastVisited: null };
          existing.totalXP = Math.max(0, (existing.totalXP || 0) + amount);
          existing.lastVisited = new Date().toISOString();
          states[courseId] = existing;
          localStorage.setItem(courseStateKey, JSON.stringify(states));
          setCourseStates(states);
        } catch {}
      }
      
      // Send to backend
      try {
        await apiRequest(`/progress/xp/add?amount=${amount}`, { method: "POST" });
      } catch (err) {
        console.error("Failed to add XP on event:", err);
      }
    };
  });

  useEffect(() => {
    const stableHandler = (e: Event) => {
      if (xpHandlerRef.current) xpHandlerRef.current(e);
    };
    
    const handleStepChange = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { courseId, phaseNum, step } = customEvent.detail || {};
      if (!courseId || !phaseNum || !step) return;

      activeStepRef.current = { courseId, phaseNum, step };

      try {
        const courseStateKey = "hangeulai_course_state";
        const stored = localStorage.getItem(courseStateKey);
        const states = stored ? JSON.parse(stored) : {};
        const existing = states[courseId] || { lastPhase: 0, completedPhases: [], totalXP: 0, lastVisited: null, phaseSteps: {}, rewardedSteps: [] };
        existing.lastPhase = phaseNum;
        existing.lastVisited = new Date().toISOString();
        existing.phaseSteps = existing.phaseSteps || {};
        existing.phaseSteps[phaseNum] = step;
        states[courseId] = existing;
        
        localStorage.setItem(courseStateKey, JSON.stringify(states));
        setCourseStates(states);

        await apiRequest("/progress/profile", {
          method: "PATCH",
          body: JSON.stringify({
            course_states: states
          })
        });
      } catch (err) {
        console.error("Failed to sync step change progress:", err);
      }
    };

    window.addEventListener("hangeulai-xp", stableHandler);
    window.addEventListener("hangeulai-step-change", handleStepChange);
    return () => {
      window.removeEventListener("hangeulai-xp", stableHandler);
      window.removeEventListener("hangeulai-step-change", handleStepChange);
    };
  }, []); // Only mount/unmount once

  const handleResetLessons = async () => {
    const courseId = activeLesson?.level ?? 1;
    const ok = window.confirm(`Are you absolutely sure you want to reset your curriculum path and progress for Course ID ${courseId}?`);
    if (!ok) return;

    setLoading(true);
    try {
      const courseStateKey = "hangeulai_course_state";
      const stored = localStorage.getItem(courseStateKey);
      const states = stored ? JSON.parse(stored) : {};
      states[courseId] = {
        lastPhase: 1,
        completedPhases: [],
        totalXP: 0,
        lastVisited: new Date().toISOString(),
        phaseSteps: { "1": 1 },
        rewardedSteps: []
      };
      
      localStorage.setItem(courseStateKey, JSON.stringify(states));
      setCourseStates(states);

      await apiRequest("/progress/profile", {
        method: "PATCH",
        body: JSON.stringify({
          course_states: states
        })
      });

      // Clear wizard step keys for this course
      if (courseId === 1) {
        for (let p = 1; p <= 6; p++) {
          localStorage.removeItem(`hangeulai_phase${p}_step`);
        }
      } else {
        for (let p = 1; p <= 12; p++) {
          localStorage.removeItem(`hangeulai_c${courseId}p${p}_step`);
          localStorage.removeItem(`hangeulai_c${courseId - 1}p${p}_step`);
        }
      }

      setLessons([]);
      setActiveIdx(0);
      setCurrentStep(1);
      setQuizIdx(0);
      setSelectedAnswer(null);
      setWritingAnswer("");
      setQuizChecked(false);
      setQuizCorrect(null);
      
      await loadLessons();
    } catch (err) {
      console.error("Reset failed:", err);
    } finally {
      setLoading(false);
    }
  };


  const handleCheckAnswer = () => {
    if (!activeQuiz) return;

    let isCorrect = false;
    if (activeQuiz.type === "choice") {
      if (selectedAnswer === null) return;
      isCorrect = selectedAnswer === activeQuiz.correct_answer;
    } else {
      if (!writingAnswer.trim()) return;
      isCorrect = writingAnswer.trim().toLowerCase() === activeQuiz.correct_answer.trim().toLowerCase();
    }

    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    if (!isCorrect) {
      setMistakesCount((prev) => prev + 1);
      // Dispatch negative XP event
      window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: -10, type: 'wrong' } }));
    } else {
      // Dispatch positive XP event for correct answer
      window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 20, type: 'correct' } }));
    }

    // ── Write quiz accuracy to localStorage for Dashboard Mastery Goals ──
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("hangeulai_quiz_accuracy");
        const qa = stored ? JSON.parse(stored) : { correct: 0, total: 0 };
        qa.total += 1;
        if (isCorrect) qa.correct += 1;
        localStorage.setItem("hangeulai_quiz_accuracy", JSON.stringify(qa));
      } catch {}
    }
  };

  const handleNextQuizOrComplete = () => {
    if (!activeLesson) return;

    if (quizIdx < activeLesson.quizzes.length - 1) {
      // Go to next quiz in this lesson
      setQuizIdx(quizIdx + 1);
      setSelectedAnswer(null);
      setWritingAnswer("");
      setQuizChecked(false);
      setQuizCorrect(null);
    } else {
      // Completed all quizzes! Claim XP and dynamically compile the next slide
      handleEarnXp();
    }
  };

  const handleEarnXp = async () => {
    setSavingXp(true);
    try {
      await apiRequest("/progress/xp/add?amount=100", { method: "POST" });
      const nextLesson = await apiRequest(`/lessons/curated/next?mistakes=${mistakesCount}`, { method: "POST" });

      // ── Write activity log entry to localStorage and sync to backend ──
      if (typeof window !== "undefined") {
        let finalLog: { date: string; lesson: string; xp: number }[] = [];
        let finalStates: Record<number, CourseState> = {};
        
        try {
          const logKey = "hangeulai_activity_log";
          const stored = localStorage.getItem(logKey);
          const log: { date: string; lesson: string; xp: number }[] = stored ? JSON.parse(stored) : [];
          log.push({
            date: new Date().toISOString(),
            lesson: activeLesson?.title || "Lesson",
            xp: 100,
          });
          // Keep last 50 entries
          if (log.length > 50) log.splice(0, log.length - 50);
          localStorage.setItem(logKey, JSON.stringify(log));
          finalLog = log;
        } catch {}

        // ── Update course state in localStorage and sync to backend ──
        try {
          const courseStateKey = "hangeulai_course_state";
          const stored = localStorage.getItem(courseStateKey);
          const states: Record<number, { lastPhase: number; completedPhases: number[]; totalXP: number; lastVisited: string | null }> = stored ? JSON.parse(stored) : {};
          // Derive course id from lesson level
          const courseId = activeLesson?.level ?? 1;
          const existing = states[courseId] || { lastPhase: 0, completedPhases: [], totalXP: 0, lastVisited: null };
          // Derive phase number from lesson title (e.g. "Phase 2" → 2)
          const phaseMatch = activeLesson?.title?.match(/(Phase|phase)\s*(\d+)/) ||
            activeLesson?.title?.match(/\.([1-6])(?:\s|$)/);
          const phaseNum = phaseMatch ? parseInt(phaseMatch[2] || phaseMatch[1]) : (existing.lastPhase || 1);
          if (!existing.completedPhases.includes(phaseNum)) {
            existing.completedPhases.push(phaseNum);
          }
          existing.lastPhase = phaseNum;
          existing.totalXP = (existing.totalXP || 0) + 100;
          existing.lastVisited = new Date().toISOString();
          states[courseId] = existing;
          localStorage.setItem(courseStateKey, JSON.stringify(states));
          finalStates = states;
        } catch {}

        // ── PATCH updated state to backend profile ──
        try {
          await apiRequest("/progress/profile", {
            method: "PATCH",
            body: JSON.stringify({
              course_states: finalStates,
              activity_log: finalLog
            })
          });
        } catch (err) {
          console.error("Failed to sync progress to backend:", err);
        }
      }

      setLessons((prev) => [...prev, nextLesson]);
      setActiveIdx(lessons.length);
      setCurrentStep(1);
      setQuizIdx(0);
      setSelectedAnswer(null);
      setWritingAnswer("");
      setQuizChecked(false);
      setQuizCorrect(null);
      setMistakesCount(0);
    } catch (err) {
      console.error("Failed to load next progressive roadmap lesson:", err);
      window.location.href = "/dashboard";
    } finally {
      setSavingXp(false);
    }
  };

  const speakWord = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      window.speechSynthesis.speak(utterance);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-foreground bg-zinc-950">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto" />
          <p className="text-zinc-500 text-sm">Loading your course curriculum roadmap...</p>
        </div>
      </div>
    );
  }

  const courses = [
    {
      id: 1,
      title: "Korean 0: Hangeul & Sound System Bootcamp",
      goal: "Take an absolute beginner from zero to confidently reading and writing Hangeul with basic pronunciation control.",
      levelBand: "True beginner → very early A1",
      duration: "⏱️ 2–4 Weeks",
      focus: "Hangeul vowels, consonants, syllable blocks, vowel harmony, and syllable types. Reading simple words, loanwords, country/city names, basic counters and numbers. Ear training: minimal pairs, final consonant (받침) patterns, and drills.",
      primaryRefs: "Basic Korean Unit 1, Beginning Korean 1 Hangeul section.",
      level: 1,
      icon: "BookMarked",
      accentBorder: "border-t-4 border-t-[#818cf8]",
      gradient: "from-[#2e0854]/40 via-[#4f46e5]/10 to-[#05020c]/90",
      borderGlow: "hover:border-[#818cf8]/50 hover:shadow-[0_0_35px_rgba(79,70,229,0.3)]",
      badgeColor: "bg-[#4f46e5]/20 text-[#818cf8] border-[#4f46e5]/30",
      titleFont: "font-serif",
      focusFont: "font-mono",
      category: "Core Path"
    },
    {
      id: 2,
      title: "Korean 1: Everyday Basics (A1 Core)",
      goal: "Build survival Korean for daily life: greetings, self‑intro, simple Q&A, and basic sentence patterns.",
      levelBand: "A1 complete",
      duration: "⏱️ 4–6 Weeks",
      focus: "Basic word order (SOV), topic vs subject, copula \"이다\", existence \"있다/없다\". Core particles, present tense polite endings, basic greetings, major/schedule, simple likes/dislikes.",
      primaryRefs: "Basic Korean Units 2–5, 8–11; Beginning Korean 1 Lessons 1–4; TTMIK Level 1.",
      level: 2,
      icon: "BookOpen",
      accentBorder: "border-t-4 border-t-[#2dd4bf]",
      gradient: "from-[#042d29]/40 via-[#0d9488]/10 to-[#020c0b]/90",
      borderGlow: "hover:border-[#2dd4bf]/50 hover:shadow-[0_0_35px_rgba(13,148,136,0.3)]",
      badgeColor: "bg-[#0d9488]/20 text-[#2dd4bf] border-[#0d9488]/30",
      titleFont: "font-sans font-black",
      focusFont: "font-sans",
      category: "Core Path"
    },
    {
      id: 3,
      title: "Korean 2: Daily Life & Routines (A2 Core)",
      goal: "Move from isolated sentences to short exchanges about daily life, schedules, and simple past events.",
      levelBand: "A2 core",
      duration: "⏱️ 6–8 Weeks",
      focus: "Numbers (native + Sino), counters, dates, times, durations; past tense, progressive, \"want to\" forms, basic negation (\"안/못\", \"-지 않다\"). Location and movement (에/에서, 가다/오다). Daily schedule, food, hobbies.",
      primaryRefs: "Basic Korean Units 9–10, 17–20; Beginning Korean 1 Lessons 3–6; TTMIK Levels 1–2.",
      level: 3,
      icon: "Volume2",
      accentBorder: "border-t-4 border-t-[#f472b6]",
      gradient: "from-[#3a0321]/40 via-[#db2777]/10 to-[#0c0207]/90",
      borderGlow: "hover:border-[#f472b6]/50 hover:shadow-[0_0_35px_rgba(219,39,119,0.3)]",
      badgeColor: "bg-[#db2777]/20 text-[#f472b6] border-[#db2777]/30",
      titleFont: "font-mono font-black",
      focusFont: "font-mono",
      category: "Core Path"
    },
    {
      id: 4,
      title: "Korean 3: Building Sentences & Stories (Lower‑Intermediate B1)",
      goal: "Enable learners to narrate events, connect ideas, and handle more complex grammar in speech and writing.",
      levelBand: "B1 intermediate",
      duration: "⏱️ 8–10 Weeks",
      focus: "Conjunctions and clause linking (\"-아서/어서\", \"-(으)니까\", \"-지만\", \"-고\", \"-다가\", \"-자마자\"). Reported speech (\"-대요/-래요\"). Comparisons, degree, guessing/assumptions (\"-나 보다\"). Nuanced particles and honorifics.",
      primaryRefs: "TTMIK Levels 3–5; Basic Korean Units 14–16, 21–25.",
      level: 4,
      icon: "Layers",
      accentBorder: "border-t-4 border-t-[#60a5fa]",
      gradient: "from-[#031d44]/40 via-[#2563eb]/10 to-[#010610]/90",
      borderGlow: "hover:border-[#60a5fa]/50 hover:shadow-[0_0_35px_rgba(37,99,235,0.3)]",
      badgeColor: "bg-[#2563eb]/20 text-[#60a5fa] border-[#2563eb]/30",
      titleFont: "font-serif tracking-tight",
      focusFont: "font-sans",
      category: "Core Path"
    },
    {
      id: 5,
      title: "Korean 4: Fluent Communication in Real Contexts (Upper‑Intermediate B2)",
      goal: "Develop comfortable, natural conversation across familiar and some abstract topics with good control of endings and nuance.",
      levelBand: "B2 fluent",
      duration: "⏱️ 10–12 Weeks",
      focus: "Resultative & passive structures (\"-어/아 있다\"). Advanced connectors (\"-느라고\", \"-기는 하지만\", \"-더라도\"). \"No matter…\" and concessive forms. Nuanced evaluation and stance expressions.",
      primaryRefs: "TTMIK Levels 5–7; Basic Korean higher units.",
      level: 5,
      icon: "BrainCircuit",
      accentBorder: "border-t-4 border-t-[#fbbf24]",
      gradient: "from-[#381c02]/40 via-[#d97706]/10 to-[#0e0802]/90",
      borderGlow: "hover:border-[#fbbf24]/50 hover:shadow-[0_0_35px_rgba(217,119,6,0.3)]",
      badgeColor: "bg-[#d97706]/20 text-[#fbbf24] border-[#d97706]/30",
      titleFont: "font-sans font-black tracking-widest",
      focusFont: "font-mono",
      category: "Core Path"
    },
    {
      id: 6,
      title: "Korean 5: Advanced Korean, Idioms & Nuance (C1)",
      goal: "Approach near‑native reading and speaking on everyday and semi‑specialized topics, with idiomatic control.",
      levelBand: "C1 advanced",
      duration: "⏱️ 12–16 Weeks",
      focus: "Advanced endings and modality (\"-지\", \"-지 뭐\", \"-잖아(요)\", \"-더라고(요)\"). Idioms (일, 마음, 손, 눈). Hypotheticality, regret, stance expressions (\"-기 마련이다\"). Written essay/email styles.",
      primaryRefs: "TTMIK Levels 8–10; Basic Korean advanced units.",
      level: 6,
      icon: "Award",
      accentBorder: "border-t-4 border-t-[#a78bfa]",
      gradient: "from-[#22033a]/40 via-[#7c3aed]/10 to-[#0b0214]/90",
      borderGlow: "hover:border-[#a78bfa]/50 hover:shadow-[0_0_35px_rgba(124,58,237,0.3)]",
      badgeColor: "bg-[#7c3aed]/20 text-[#a78bfa] border-[#7c3aed]/30",
      titleFont: "font-serif italic font-bold",
      focusFont: "font-mono",
      category: "Core Path"
    },
    {
      id: 7,
      title: "Korean Grammar Lab (A1–B2, Parallel Track)",
      goal: "Provide a dedicated, exercise‑heavy grammar course for learners who want explicit form‑focused practice alongside the core communication courses.",
      levelBand: "A1–B2 lab",
      duration: "⏱️ Parallel Track",
      focus: "Systematic coverage of grammatical categories: nouns, particles, case, tense, speech levels, special particles, irregular verbs. Dense drill‑style exercises, built-in self-tests.",
      primaryRefs: "Basic Korean Workbook; TTMIK Workbooks Levels 1–5.",
      level: 7,
      icon: "RefreshCw",
      accentBorder: "border-t-4 border-t-[#a5b4fc]",
      gradient: "from-[#1d0e51]/40 via-[#6366f1]/10 to-[#06041c]/90",
      borderGlow: "hover:border-[#a5b4fc]/50 hover:shadow-[0_0_35px_rgba(99,102,241,0.3)]",
      badgeColor: "bg-[#6366f1]/20 text-[#a5b4fc] border-[#6366f1]/30",
      titleFont: "font-mono font-semibold",
      focusFont: "font-sans",
      category: "Practice Labs"
    },
    {
      id: 8,
      title: "Pronunciation, Listening & Speaking Lab",
      goal: "Train accurate pronunciation, rhythm, and listening skills, integrated with controlled speaking tasks at each level.",
      levelBand: "A1–B2 speaking",
      duration: "⏱️ Practice Lab",
      focus: "Hangeul‑based phonology (batchim rules, assimilation, tensification), listening tasks (syllable discrimination, short dialogues), speaking prompts using pronunciation feedback.",
      primaryRefs: "Basic Korean Units 1, 9–11; Beginning Korean 1 listening tasks.",
      level: 8,
      icon: "Volume2",
      accentBorder: "border-t-4 border-t-[#22d3ee]",
      gradient: "from-[#02232b]/40 via-[#0891b2]/10 to-[#010a0c]/90",
      borderGlow: "hover:border-[#22d3ee]/50 hover:shadow-[0_0_35px_rgba(8,145,178,0.3)]",
      badgeColor: "bg-[#0891b2]/20 text-[#22d3ee] border-[#0891b2]/30",
      titleFont: "font-sans font-black",
      focusFont: "font-mono",
      category: "Practice Labs"
    },
    {
      id: 9,
      title: "Reading & Writing Workshop (from Syllables to Short Texts)",
      goal: "Build literacy and writing skills: from reading syllables and words to paragraphs, with guided composition.",
      levelBand: "A1–B1 literacy",
      duration: "⏱️ Writing Lab",
      focus: "Script speed drills, reading dialogues/paragraphs from Beginning Korean 1, spacing, number spelling orthography, and writing tasks (diary, email, social posts).",
      primaryRefs: "Beginning Korean 1; Basic Korean units on date/time & counters.",
      level: 2,
      icon: "BookMarked",
      accentBorder: "border-t-4 border-t-[#ff7849]",
      gradient: "from-[#361103]/40 via-[#ea580c]/10 to-[#0f0501]/90",
      borderGlow: "hover:border-[#ff7849]/50 hover:shadow-[0_0_35px_rgba(234,88,12,0.3)]",
      badgeColor: "bg-[#ea580c]/20 text-[#ff7849] border-[#ea580c]/30",
      titleFont: "font-serif font-black tracking-wide",
      focusFont: "font-sans",
      category: "Workshops"
    },
    {
      id: 10,
      title: "TTMIK‑Inspired Practice & Review Courses (Per Level)",
      goal: "Provide structured practice tracks roughly aligned with TTMIK Levels 1–5, but with your own content and adaptive engine.",
      levelBand: "A1–B2 review",
      duration: "⏱️ Review Drills",
      focus: "Spaced review exercises (MCQ, fill-in-the-blank, translation, listening), custom rewritten items to avoid copyright, mini mock CEFR tests.",
      primaryRefs: "TTMIK Levels 1–10; TTMIK Workbooks 1–5.",
      level: 3,
      icon: "CheckCircle2",
      accentBorder: "border-t-4 border-t-[#a3e635]",
      gradient: "from-[#152a04]/40 via-[#65a30d]/10 to-[#060d02]/90",
      borderGlow: "hover:border-[#a3e635]/50 hover:shadow-[0_0_35px_rgba(101,163,13,0.3)]",
      badgeColor: "bg-[#65a30d]/20 text-[#a3e635] border-[#65a30d]/30",
      titleFont: "font-mono font-bold tracking-tight",
      focusFont: "font-mono",
      category: "Workshops"
    }
  ];

  const handleSelectCourse = async (level: number, title: string) => {
    setGeneratingOnSpot(true);
    try {
      localStorage.setItem("learning_track", "pre_curated");
      const onSpotLessons = await apiRequest(`/lessons/curated/generate-on-spot?level=${level}`, { 
        method: "POST" 
      });
      
      if (onSpotLessons && onSpotLessons.length > 0) {
        setLessons(onSpotLessons);
      } else {
        setLessons([]);
      }
      
      setActiveIdx(0);
      setCurrentStep(1);
      setQuizIdx(0);
      setShowCourseSelector(false);
      setShowSyllabus(true);

      // Initialize course progress state live
      try {
        const courseStateKey = "hangeulai_course_state";
        const stored = localStorage.getItem(courseStateKey);
        const states = stored ? JSON.parse(stored) : {};
        const courseId = level;
        const existing = states[courseId] || { lastPhase: 1, completedPhases: [], totalXP: 0, lastVisited: null, phaseSteps: {} };
        existing.lastVisited = new Date().toISOString();
        existing.phaseSteps = existing.phaseSteps || {};
        if (!existing.phaseSteps[existing.lastPhase]) {
          existing.phaseSteps[existing.lastPhase] = 1;
        }
        states[courseId] = existing;
        localStorage.setItem(courseStateKey, JSON.stringify(states));
        setCourseStates(states);

        await apiRequest("/progress/profile", {
          method: "PATCH",
          body: JSON.stringify({
            course_states: states
          })
        });
      } catch (e) {
        console.error("Failed to initialize course launch state:", e);
      }
    } catch (err) {
      console.error("Course load failed:", err);
    } finally {
      setGeneratingOnSpot(false);
    }
  };

  // Helper to render dynamic icons for each course
  const renderCourseIcon = (iconName: string, colorClass: string) => {
    const props = { className: `w-5 h-5 ${colorClass}` };
    switch (iconName) {
      case "BookMarked": return <BookMarked {...props} />;
      case "BookOpen": return <BookOpen {...props} />;
      case "Volume2": return <Volume2 {...props} />;
      case "Layers": return <Layers {...props} />;
      case "BrainCircuit": return <BrainCircuit {...props} />;
      case "Award": return <Award {...props} />;
      case "RefreshCw": return <RefreshCw {...props} />;
      case "CheckCircle2": return <CheckCircle2 {...props} />;
      default: return <BookOpen {...props} />;
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesCategory = course.category === activeCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.focus.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (lessons.length === 0 || showCourseSelector) {
    return (
      <div className="min-h-screen text-foreground w-full max-w-[98%] mx-auto p-4 md:p-8 flex flex-col justify-center items-center relative overflow-hidden font-sans">
        
        {/* Background glowing decorations */}
        <div className="absolute -top-10 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-purple-500/10 to-indigo-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse duration-10000" />
        <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-cyan-500/10 to-blue-500/5 rounded-full blur-[160px] pointer-events-none animate-pulse duration-8000" />

        {lessons.length > 0 && (
          <button 
            onClick={() => setShowCourseSelector(false)}
            className="self-start inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-white/10 text-xs font-bold transition mb-6 cursor-pointer relative z-10"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Current Lesson ({lessons[activeIdx]?.title || "Active Course"})</span>
          </button>
        )}

        {/* Hero Header */}
        <div className="w-full relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-950/20 via-zinc-900/60 to-zinc-950 p-6 md:p-8 mb-10 shadow-2xl transition-all hover:border-purple-500/20 duration-500 group relative z-10">
          {/* Glow orb */}
          <div className="absolute -right-10 -top-10 w-44 h-44 bg-purple-500/15 rounded-full blur-3xl group-hover:scale-125 transition duration-700" />
          <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl group-hover:scale-125 transition duration-700" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3 max-w-xl text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-[10px] text-purple-300 font-extrabold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                <span>Vault Repository</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 font-black">Pathways</span>
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Select one of our pre-generated curriculum paths to launch your interactive study slides.
              </p>
            </div>
            
            <div className="flex gap-4 bg-zinc-950/60 p-4.5 rounded-2xl border border-white/5 shrink-0 w-full lg:w-auto justify-around shadow-inner backdrop-blur-sm">
              <div className="text-center px-4">
                <div className="text-3xl font-black text-white font-mono">{courses.length}</div>
                <div className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">Total Routes</div>
              </div>
              <div className="w-px bg-white/5" />
              <div className="text-center px-4">
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 font-mono">10</div>
                <div className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">Levels Active</div>
              </div>
            </div>
          </div>
        </div>

        {generatingOnSpot && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center">
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center max-w-xs space-y-4">
              <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto" />
              <p className="text-white font-bold text-sm">Gwan-Sik is loading your pre-generated course curriculum...</p>
            </div>
          </div>
        )}

        {/* Controls: Category Selection & Search */}
        <div className="w-full flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8 bg-zinc-900/20 p-4 rounded-3xl border border-white/5 backdrop-blur-sm relative z-10">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5">
            {["Core Path", "Practice Labs", "Workshops"].map(cat => {
              const count = courses.filter(c => c.category === cat).length;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/25 scale-105"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${isActive ? "bg-white/20 text-white" : "bg-zinc-850 text-zinc-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative md:max-w-xs w-full">
            <input
              type="text"
              placeholder="Search pathways..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 transition placeholder-zinc-600"
            />
            <div className="absolute left-3 top-3 text-zinc-500 pointer-events-none">
              🔍
            </div>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 top-3 text-zinc-500 hover:text-white text-xs font-bold cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Playlists Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full z-10 max-w-none"
        >
          <AnimatePresence>
            {filteredCourses.map((course) => {
              const isStarted = courseStates[course.id] && courseStates[course.id].completedPhases && courseStates[course.id].completedPhases.length > 0;
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  key={course.id}
                  className={`border border-white/10 rounded-[2.2rem] shadow-2xl flex flex-col md:flex-row justify-between transition-all duration-300 transform hover:-translate-y-1.5 bg-gradient-to-b ${course.accentBorder} ${course.gradient} ${course.borderGlow} overflow-hidden`}
                >
                  {/* Decorative mini top bar overlay */}
                  <div className="p-8 space-y-4 text-left flex-grow">
                    <div className="flex justify-between items-center gap-2">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${course.badgeColor}`}>
                        {course.levelBand}
                      </span>
                      <span className="text-[10px] font-extrabold text-zinc-400 bg-zinc-950/60 px-2 py-0.5 rounded-md border border-white/5">
                        {course.duration}
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-3 pt-2">
                      <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/10 shrink-0">
                        {renderCourseIcon(course.icon, course.badgeColor.split(" ").pop() || "text-white")}
                      </div>
                      <h3 className="text-xl leading-snug text-white font-sans font-black tracking-tight">
                        {course.title}
                      </h3>
                    </div>
                    
                    <div className="space-y-3 pt-2">
                      <div className="text-xs font-medium text-zinc-300 bg-zinc-950/30 p-4 rounded-xl border border-white/[0.04]">
                        <span className="text-[9px] font-sans font-black uppercase tracking-wider text-purple-400 block mb-1">Course Goal</span>
                        <p className="font-serif italic leading-relaxed text-zinc-200 text-[13px] md:text-sm">{course.goal}</p>
                      </div>
                      
                      <div className="text-[11px] leading-relaxed text-zinc-300 space-y-2">
                        <div>
                          <span className="text-[9px] font-sans font-black uppercase tracking-wider text-cyan-400 block">Focus Syllabus</span>
                          <p className="font-mono text-zinc-300 opacity-90 pl-1 text-[11px] leading-relaxed">{course.focus}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-sans font-black uppercase tracking-wider text-zinc-500 block">Course Materials</span>
                          <p className="font-mono opacity-75 italic pl-1 text-[10px] text-zinc-400">{course.primaryRefs}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    disabled={generatingOnSpot}
                    onClick={() => !generatingOnSpot && handleSelectCourse(course.level, course.title)}
                    className="p-8 bg-zinc-950/60 hover:bg-zinc-900 border-t md:border-t-0 md:border-l border-white/[0.05] flex flex-col justify-center items-center text-center gap-3 text-xs font-black text-white hover:text-brand-300 transition-colors shrink-0 w-full md:w-56 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span className="tracking-wide uppercase text-[9px] font-sans font-black text-zinc-500 block">Course Status</span>
                    <span className="text-sm font-black text-white font-sans max-w-[150px] leading-tight">
                      {isStarted ? "Continue Course" : "Launch Course"}
                    </span>
                    <div className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition mt-2">
                      <ChevronRight className="w-4.5 h-4.5" />
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  console.log("LessonPlayer Render: activeIdx =", activeIdx, "lessons length =", lessons.length, "active title =", activeLesson?.title);

  return (
    <div className="min-h-screen text-foreground p-6 flex flex-col relative overflow-hidden transition-all duration-300 w-full max-w-[98%] mx-auto">
      
      {/* Background glowing decorations */}
      <div className="absolute -top-10 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-purple-500/10 to-indigo-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-cyan-500/10 to-blue-500/5 rounded-full blur-[160px] pointer-events-none animate-pulse duration-8000" />

      {/* Top Controls Bar containing the Curriculum Toggle and Back selection */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5 flex-shrink-0 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSyllabus(!showSyllabus)}
            className="p-3 bg-zinc-900 border border-white/10 rounded-xl hover:bg-zinc-800 text-brand-400 hover:text-white transition shadow-lg flex items-center justify-center cursor-pointer gap-2"
            title="Toggle Course Syllabus"
          >
            <Layers className="w-5 h-5" />
            <span className="text-xs font-bold hidden sm:inline">Curriculum</span>
          </button>

          <button 
            onClick={() => setShowCourseSelector(true)}
            className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 hover:from-purple-800/60 hover:to-indigo-800/60 text-zinc-100 hover:text-white rounded-xl border border-white/10 hover:border-purple-500/30 text-xs font-black transition cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.05)]"
          >
            <ChevronLeft className="w-4 h-4 text-purple-400" />
            <span>Courses Selection</span>
          </button>
        </div>

        <div className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider bg-zinc-950/40 px-3 py-1.5 rounded-lg border border-white/5">
          Active: {activeLesson?.title || "Course"}
        </div>
      </div>

      <div className="flex gap-8 flex-grow relative items-start w-full">
        {/* Course Curriculum Sidebar */}
        {showSyllabus && (
          <aside className="w-80 shrink-0 sticky top-6 z-30 max-h-[80vh] overflow-y-auto glass-panel border border-white/10 p-5 rounded-2xl shadow-2xl flex flex-col justify-between bg-zinc-950/95">
            <div className="space-y-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2 text-white">
                <Layers className="w-5 h-5 text-brand-400" />
                <span>Curriculum</span>
              </h3>
              <p className="text-[11px] text-zinc-500">Your progressive learning slides and checkpoints:</p>
              <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                {lessons.map((lesson, idx) => (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setActiveIdx(idx);
                      setCurrentStep(1);
                      setQuizIdx(0);
                      setSelectedAnswer(null);
                      setWritingAnswer("");
                      setQuizChecked(false);
                      setQuizCorrect(null);
                      setMistakesCount(0);
                    }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition border ${
                      activeIdx === idx
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    <div className="truncate flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                      <span>{lesson.title}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1 font-normal">Level {lesson.level} &bull; {lesson.topic}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <button
                onClick={() => setShowCourseSelector(true)}
                className="w-full flex items-center justify-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold py-3 px-4 rounded-xl border border-white/5 hover:border-white/10 transition text-xs cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-brand-400" />
                <span>Switch / Browse Courses</span>
              </button>

              <button
                onClick={handleResetLessons}
                className="w-full flex items-center justify-center gap-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 font-semibold py-3 px-4 rounded-xl border border-red-500/10 hover:border-red-500/30 transition text-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Path</span>
              </button>
            </div>
          </aside>
        )}

        {/* Main Learning Slide Area - Takes full remaining screen width */}
        <main className="flex-grow w-full flex flex-col justify-between min-h-[70vh]">

        {activeLesson?.title?.includes("Phase 1") ? (
          <Phase1VowelBootcampWizard
            activeLesson={activeLesson}
            speakWord={speakWord}
            onComplete={handleEarnXp}
          />
        ) : activeLesson?.title?.includes("Phase 2") ? (
          <Phase2ConsonantWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Phase 3") ? (
          <Phase3SyllableBlocksWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Phase 4") ? (
          <Phase4RealWordsWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Phase 5") ? (
          <Phase5SpeakingLabWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Phase 6") ? (
          <Phase6ConversationWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 1.1") ? (
          <Course2Phase1GreetingsWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 1.2") ? (
          <Course2Phase2SelfIntroWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 1.3") ? (
          <Course2Phase3NumbersWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 1.4") ? (
          <Course2Phase4RoutineWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 1.5") ? (
          <Course2Phase5LocationWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 1.6") ? (
          <Course2Phase6ConversationWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 2.1") ? (
          <Course3Phase1LongerRoutinesWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 2.2") ? (
          <Course3Phase2PreferencesWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 2.3") ? (
          <Course3Phase3PastRoutinesWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 2.4") ? (
          <Course3Phase4PlansWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 2.5") ? (
          <Course3Phase5StoriesWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 2.6") ? (
          <Course3Phase6ConversationWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 3.1") ? (
          <Course4Phase1ConnectorsWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 3.2") ? (
          <Course4Phase2DescriptionsWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 3.3") ? (
          <Course4Phase3AnecdotesWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 3.4") ? (
          <Course4Phase4OpinionsWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 3.5") ? (
          <Course4Phase5ParagraphsWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 3.6") ? (
          <Course4Phase6CapstoneWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 4.1") ? (
          <Course5Phase1FluencyWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 4.2") ? (
          <Course5Phase2TravelWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 4.3") ? (
          <Course5Phase3SocialWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 4.4") ? (
          <Course5Phase4RegisterWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 4.5") ? (
          <Course5Phase5ListeningWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 4.6") ? (
          <Course5Phase6CapstoneWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 5.1") ? (
          <Course6Phase1FluencyWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 5.2") ? (
          <Course6Phase2IdiomsWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 5.3") ? (
          <Course6Phase3StanceWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 5.4") ? (
          <Course6Phase4RegisterWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 5.5") ? (
          <Course6Phase5ImplicitWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Korean 5.6") ? (
          <Course6Phase6CapstoneWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Grammar Lab 1") ? (
          <Course7Phase1GrammarLabWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Grammar Lab 2") ? (
          <Course7Phase2ParticlesWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Grammar Lab 3") ? (
          <Course7Phase3PolitenessWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Grammar Lab 4") ? (
          <Course7Phase4AdjectivesWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Grammar Lab 5") ? (
          <Course7Phase5ConnectorsWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Grammar Lab 6") ? (
          <Course7Phase6TenseAspectWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Pronunciation Lab 1") ? (
          <Course8Phase1PronunciationWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Pronunciation Lab 2") ? (
          <Course8Phase2BatchimWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Pronunciation Lab 3") ? (
          <Course8Phase3RhythmWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Listening Lab 1") ? (
          <Course8Phase4ListeningWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Pronunciation Lab 5") ? (
          <Course8Phase5PoliteEndingsWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Fluency Lab 1") ? (
          <Course8Phase6ConnectedSpeechWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Intonation Lab") ? (
          <Course8Phase7IntonationWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Conversation Lab") ? (
          <Course8Phase8ConversationWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Listening Lab – Gist") ? (
          <Course8Phase9ListeningGistDetailWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Reaction Lab") ? (
          <Course8Phase10ReactionWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Story Lab") ? (
          <Course8Phase11StoryWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : activeLesson?.title?.includes("Media Lab") ? (
          <Course8Phase12MediaWizard 
            activeLesson={activeLesson} 
            speakWord={speakWord} 
            onComplete={handleEarnXp} 
          />
        ) : (
          /* Standard 2-step Curated Lesson Player */
          <div className="flex-grow flex flex-col justify-between">
            {/* Top Header tracking */}
            <header className="flex justify-between items-center py-4 border-b border-white/5 mb-6">
              <div className="flex items-center space-x-3">
                <Link href="/dashboard" className="glass-panel p-2 rounded-xl hover:bg-white/5 transition">
                  <ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h2 className="font-extrabold text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-brand-400" />
                    <span>{activeLesson?.title}</span>
                  </h2>
                  <p className="text-xs text-zinc-500">Curated Topic: {activeLesson?.topic}</p>
                </div>
              </div>
              
              {/* Active progress bar */}
              <div className="flex items-center space-x-4">
                <div className="w-32 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-indigo-500 rounded-full transition-all duration-500" 
                    style={{ width: currentStep === 1 ? "33%" : (quizIdx === 0 ? "66%" : "100%") }}
                  />
                </div>
                <span className="text-xs text-zinc-400 font-bold">{Math.round((currentStep === 1 ? 0.33 : (quizIdx === 0 ? 0.66 : 1)) * 100)}%</span>
              </div>
            </header>

            {currentStep === 1 ? (
              /* Step 1: Highly organized curriculum content formatted beautifully in Markdown */
              <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
                <div className="inline-flex items-center gap-1.5 bg-brand-500/10 text-brand-300 font-bold text-xs py-1.5 px-3 rounded-full border border-brand-500/20 w-fit">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Course Lesson Explanation</span>
                </div>
                
                <div className="prose prose-invert max-w-none bg-zinc-900/60 p-6 rounded-2xl border border-white/5 leading-relaxed font-sans text-zinc-300">
                  {renderMarkdown(activeLesson?.content_markdown)}
                </div>

                {/* Dynamic Examples Section */}
                {activeLesson?.examples && activeLesson.examples.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-black text-sm text-zinc-400 tracking-wide uppercase">Interactive Examples:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeLesson.examples.map((ex, eIdx) => (
                        <div key={eIdx} className="glass-panel p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:border-brand-500/30 transition">
                          <div className="space-y-1">
                            <div className="text-lg font-extrabold text-white flex items-center gap-2">
                              <span>{ex.ko}</span>
                              <button 
                                onClick={() => speakWord(ex.ko)}
                                className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white transition opacity-0 group-hover:opacity-100 cursor-pointer"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-xs text-zinc-400 font-semibold">{ex.en}</div>
                            <div className="text-[10px] text-zinc-500 italic">{ex.note}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Step 2: Blended Option A / Option B interactive quizzes */
              <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
                <div className="inline-block bg-accent-purple/10 text-accent-purple font-bold text-xs py-1.5 px-3 rounded-full border border-accent-purple/20 w-fit">
                  Lesson Mastery Checkpoint
                </div>
                
                <h2 className="text-2xl font-extrabold text-white leading-snug">
                  {activeQuiz?.question}
                </h2>

                {activeQuiz?.type === "choice" ? (
                  /* Option A: Multiple choice questions */
                  <div className="space-y-3">
                    {activeQuiz.options?.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => !quizChecked && setSelectedAnswer(option)}
                        className={`w-full text-left p-4 rounded-xl font-medium transition flex items-center justify-between border ${
                          selectedAnswer === option 
                            ? "border-brand-500 bg-brand-500/10 text-white" 
                            : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                        } ${quizChecked && option === activeQuiz.correct_answer ? "border-accent-teal bg-accent-teal/10 text-white" : ""}`}
                        disabled={quizChecked}
                      >
                        <span>{option}</span>
                        {selectedAnswer === option && <CheckCircle2 className="w-5 h-5 text-brand-400" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Option B: Interactive text-input writing questions */
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      value={writingAnswer}
                      onChange={(e) => setWritingAnswer(e.target.value)}
                      placeholder="Type Hangeul translation here..."
                      className="w-full bg-zinc-900/60 p-4 rounded-xl border border-white/10 outline-none focus:border-brand-500 font-sans text-lg text-white"
                      disabled={quizChecked}
                      onKeyDown={(e) => e.key === "Enter" && !quizChecked && handleCheckAnswer()}
                    />
                    
                    {/* Hangeul Keyboard Pop Component */}
                    {!quizChecked && (
                      <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-zinc-900/40 space-y-3">
                        <div className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">Hangeul Keyboard:</div>
                        
                        {/* Consonants Row */}
                        <div className="flex flex-wrap gap-1.5">
                          {["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"].map((char) => (
                            <button
                              key={char}
                              onClick={() => setWritingAnswer((prev) => prev + char)}
                              className="px-3 py-2 bg-zinc-855 hover:bg-zinc-750 active:bg-brand-500 active:text-white rounded-lg text-sm font-extrabold text-zinc-300 border border-white/5 transition duration-150 cursor-pointer"
                            >
                              {char}
                            </button>
                          ))}
                        </div>
                        
                        {/* Vowels Row */}
                        <div className="flex flex-wrap gap-1.5">
                          {["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "요", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"].map((char) => (
                            <button
                              key={char}
                              onClick={() => setWritingAnswer((prev) => prev + char)}
                              className="px-3 py-2 bg-zinc-855 hover:bg-zinc-750 active:bg-brand-500 active:text-white rounded-lg text-sm font-extrabold text-zinc-300 border border-white/5 transition duration-150 cursor-pointer"
                            >
                              {char}
                            </button>
                          ))}
                        </div>

                        {/* Controls Row */}
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setWritingAnswer((prev) => prev + " ")}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold text-zinc-400 border border-white/5 transition cursor-pointer"
                          >
                            Space
                          </button>
                          <button
                            onClick={() => setWritingAnswer((prev) => prev.slice(0, -1))}
                            className="px-4 py-2 bg-zinc-800 hover:bg-accent-pink/20 hover:text-accent-pink rounded-lg text-xs font-bold text-zinc-400 border border-white/5 transition cursor-pointer"
                          >
                            Backspace
                          </button>
                          <button
                            onClick={() => setWritingAnswer("")}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-755 rounded-lg text-xs font-bold text-zinc-400 border border-white/5 transition cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-[10px] text-zinc-500">Hint: Pay attention to spelling and politeness conjugations taught in the slide.</p>
                  </div>
                )}

                {/* Verification Feedback alerts */}
                {quizChecked && (
                  <div className={`p-5 rounded-2xl border text-sm space-y-2 ${
                    quizCorrect 
                      ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal" 
                      : "bg-accent-pink/5 border-accent-pink/20 text-accent-pink"
                  }`}>
                    <div className="font-extrabold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{quizCorrect ? "Correct! Brilliant understanding." : "Incorrect. Let's study the context rules."}</span>
                    </div>
                    <div className="text-xs text-zinc-400 leading-relaxed font-sans mt-1">
                      <strong>Explanation:</strong> {activeQuiz?.explanation}
                    </div>
                    {!quizCorrect && (
                      <div className="text-xs text-zinc-300 font-mono mt-1">
                        Correct Answer: <span className="underline decoration-accent-pink">{activeQuiz?.correct_answer}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Footer controls bar */}
            <footer className="flex justify-between items-center py-4 border-t border-white/5 mt-6">
              {currentStep > 1 ? (
                <button 
                  onClick={() => { setCurrentStep(1); setQuizChecked(false); setSelectedAnswer(null); setWritingAnswer(""); }}
                  className="glass-panel py-3 px-6 rounded-xl hover:bg-white/5 transition text-sm font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Content
                </button>
              ) : (
                <div />
              )}

              {currentStep === 1 ? (
                <button 
                  onClick={() => {
                    setCurrentStep(2);
                    window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount: 15, type: 'theory' } }));
                  }}
                  className="bg-brand-500 hover:bg-brand-600 text-white py-3 px-6 rounded-xl transition text-sm font-semibold flex items-center gap-2 cursor-pointer"
                >
                  Go to Checkpoint <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                !quizChecked ? (
                  <button 
                    onClick={handleCheckAnswer}
                    className="bg-brand-500 hover:bg-brand-600 text-white py-3 px-6 rounded-xl transition text-sm font-semibold flex items-center gap-2 cursor-pointer"
                    disabled={activeQuiz?.type === "choice" ? selectedAnswer === null : !writingAnswer.trim()}
                  >
                    Check Answer
                  </button>
                ) : (
                  <button 
                    onClick={handleNextQuizOrComplete}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 py-3 px-6 rounded-xl transition text-sm font-semibold flex items-center gap-2 shadow-lg shadow-accent-teal/20 cursor-pointer"
                    disabled={savingXp}
                  >
                    {savingXp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving & Curating...
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" /> 
                        <span>
                          {quizIdx < activeLesson.quizzes.length - 1 ? "Next Question" : "Complete & Earn XP"}
                        </span>
                      </>
                    )}
                  </button>
                )
              )}
            </footer>
          </div>
        )}
      </main>
      </div>
      {/* Floating XP animations */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingTexts.map(t => (
          <div
            key={t.id}
            className={`absolute font-black text-4xl select-none ${
              t.type === 'correct' ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
              t.type === 'theory' ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]' :
              'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]'
            }`}
            style={{
              left: `${t.x}px`,
              top: `${t.y}px`,
              transform: 'translate(-50%, -50%)',
              animation: 'floatUp 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards',
            }}
          >
            {t.text}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0% {
            transform: translate(-50%, -50%) translateY(0) scale(0.6);
            opacity: 0;
          }
          15% {
            transform: translate(-50%, -50%) translateY(-30px) scale(1.3);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translateY(-140px) scale(0.85);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// Arrow Right SVG component locally since Lucide is missing it sometimes or to keep it clean
function ArrowRight({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
