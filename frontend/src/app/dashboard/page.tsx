"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Sparkles, BookOpen, MessageSquare, Award, PlayCircle, Flame, Target, Loader2,
  Trash2, RotateCcw, Scroll, ShieldAlert, Crop, X, ChevronRight, CheckCircle2,
  Trophy, Calendar, Briefcase, Volume2, BarChart3, BrainCircuit, Zap,
  Mic, GraduationCap, BookMarked, Layers, RefreshCw, Compass,
  Activity, Clock, Lock, Heart, Medal, Map
} from "lucide-react";
import { ensureAuthenticated, apiRequest } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileData {
  display_name: string | null;
  level_progress: number;
  total_xp: number;
  current_streak: number;
  native_language: string;
  dob?: string;
  study_reason?: string;
  occupation?: string;
  korean_culture_experience?: string;
  korean_proficiency?: string;
  korean_name?: string;
  avatar_base64?: string;
}

interface StatsData {
  vocab_mastery: number;
  grammar_mastery: number;
  pronunciation_average: number;
  lessons_completed: number;
}

interface CourseState {
  lastPhase: number;
  completedPhases: number[];
  totalXP: number;
  lastVisited: string | null;
}

type DashTab = "overview" | "journey" | "achievements" | "activity" | "calendar";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS — All 7 courses matching the lessons page
// ─────────────────────────────────────────────────────────────────────────────

const ALL_COURSES = [
  {
    id: 1, level: 1, phases: 6,
    title: "Hangeul & Sound System Bootcamp",
    subtitle: "Korean 0",
    cefr: "Pre-A1", duration: "2–4 Weeks",
    icon: "BookMarked",
    accent: "#818cf8", glow: "rgba(79,70,229,0.4)",
    gradient: "from-indigo-950/60 via-indigo-900/20 to-zinc-950",
    borderColor: "border-indigo-500/30",
    xpPerPhase: 150,
    description: "Master reading and writing Hangeul. Vowels, consonants, syllable blocks, and pronunciation.",
    phaseNames: ["Vowels", "Consonants", "Syllable Blocks", "Real Words", "Speaking Lab", "Conversation"],
    badge: "🌱",
  },
  {
    id: 2, level: 2, phases: 6,
    title: "Everyday Basics (A1 Core)",
    subtitle: "Korean 1",
    cefr: "A1", duration: "4–6 Weeks",
    icon: "BookOpen",
    accent: "#2dd4bf", glow: "rgba(13,148,136,0.4)",
    gradient: "from-teal-950/60 via-teal-900/20 to-zinc-950",
    borderColor: "border-teal-500/30",
    xpPerPhase: 200,
    description: "Survival Korean: greetings, self-intro, numbers, locations, and basic sentence structures.",
    phaseNames: ["Greetings", "Self-Intro", "Numbers", "Routines", "Locations", "Conversation"],
    badge: "📖",
  },
  {
    id: 3, level: 3, phases: 6,
    title: "Daily Life & Routines (A2 Core)",
    subtitle: "Korean 2",
    cefr: "A2", duration: "6–8 Weeks",
    icon: "Volume2",
    accent: "#f472b6", glow: "rgba(219,39,119,0.4)",
    gradient: "from-pink-950/60 via-pink-900/20 to-zinc-950",
    borderColor: "border-pink-500/30",
    xpPerPhase: 250,
    description: "Counters, dates, past tense, negation, food, hobbies, and short exchanges.",
    phaseNames: ["Longer Routines", "Preferences", "Past Routines", "Future Plans", "Stories", "Conversation"],
    badge: "⭐",
  },
  {
    id: 4, level: 4, phases: 6,
    title: "Building Sentences & Stories (B1)",
    subtitle: "Korean 3",
    cefr: "B1", duration: "8–10 Weeks",
    icon: "Layers",
    accent: "#60a5fa", glow: "rgba(37,99,235,0.4)",
    gradient: "from-blue-950/60 via-blue-900/20 to-zinc-950",
    borderColor: "border-blue-500/30",
    xpPerPhase: 300,
    description: "Conjunctions, clause linking, reported speech, comparisons, and nuanced particles.",
    phaseNames: ["Connectors", "Descriptions", "Anecdotes", "Opinions", "Paragraphs", "Capstone"],
    badge: "🔥",
  },
  {
    id: 5, level: 5, phases: 6,
    title: "Fluent Communication (B2)",
    subtitle: "Korean 4",
    cefr: "B2", duration: "10–12 Weeks",
    icon: "BrainCircuit",
    accent: "#fbbf24", glow: "rgba(217,119,6,0.4)",
    gradient: "from-amber-950/60 via-amber-900/20 to-zinc-950",
    borderColor: "border-amber-500/30",
    xpPerPhase: 400,
    description: "Natural conversation, resultative/passive structures, advanced connectors, nuanced expressions.",
    phaseNames: ["Fluency", "Travel", "Social", "Register", "Listening", "Capstone"],
    badge: "🏅",
  },
  {
    id: 6, level: 6, phases: 6,
    title: "Advanced Korean, Idioms & Nuance (C1)",
    subtitle: "Korean 5",
    cefr: "C1", duration: "12–16 Weeks",
    icon: "Award",
    accent: "#a78bfa", glow: "rgba(124,58,237,0.4)",
    gradient: "from-violet-950/60 via-violet-900/20 to-zinc-950",
    borderColor: "border-violet-500/30",
    xpPerPhase: 500,
    description: "Near-native idioms, hypotheticality, stance expressions, written essay and email styles.",
    phaseNames: ["Fluency", "Idioms", "Stance", "Register", "Implicit", "Capstone"],
    badge: "💎",
  },
  {
    id: 7, level: 7, phases: 6,
    title: "Grammar Lab (A1–B2 Parallel)",
    subtitle: "Grammar Lab",
    cefr: "A1–B2", duration: "Parallel Track",
    icon: "RefreshCw",
    accent: "#a5b4fc", glow: "rgba(99,102,241,0.4)",
    gradient: "from-violet-950/60 via-indigo-900/20 to-zinc-950",
    borderColor: "border-violet-400/30",
    xpPerPhase: 200,
    description: "Systematic form-focused grammar: particles, tense, speech levels, irregulars, dense drills.",
    phaseNames: ["Grammar Lab", "Particles", "Politeness", "Adjectives", "Connectors", "Tense & Aspect"],
    badge: "👑",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// XP TIER SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

const XP_TIERS = [
  { name: "Seedling",        emoji: "🌱", min: 0,     color: "text-emerald-400",  bg: "bg-emerald-500/10 border-emerald-500/20" },
  { name: "Scholar",         emoji: "📖", min: 500,   color: "text-blue-400",     bg: "bg-blue-500/10 border-blue-500/20" },
  { name: "Rising Star",     emoji: "⭐", min: 1500,  color: "text-yellow-400",   bg: "bg-yellow-500/10 border-yellow-500/20" },
  { name: "Flame Bearer",    emoji: "🔥", min: 3000,  color: "text-orange-400",   bg: "bg-orange-500/10 border-orange-500/20" },
  { name: "Gold Learner",    emoji: "🏅", min: 6000,  color: "text-amber-400",    bg: "bg-amber-500/10 border-amber-500/20" },
  { name: "Diamond Mind",    emoji: "💎", min: 10000, color: "text-cyan-400",     bg: "bg-cyan-500/10 border-cyan-500/20" },
  { name: "Master",          emoji: "👑", min: 20000, color: "text-purple-400",   bg: "bg-purple-500/10 border-purple-500/20" },
  { name: "Hangeul Legend",  emoji: "🌸", min: 50000, color: "text-pink-400",     bg: "bg-pink-500/10 border-pink-500/20" },
];

function getXpTier(xp: number) {
  let tier = XP_TIERS[0];
  for (const t of XP_TIERS) { if (xp >= t.min) tier = t; }
  return tier;
}

function getNextTier(xp: number) {
  const next = XP_TIERS.find(t => t.min > xp);
  return next;
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGE SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

function buildBadges(xp: number, streak: number, lessonsCompleted: number, completedCourses: number, grammarAcc: number, pronunciationAvg: number) {
  return [
    {
      id: "first_lesson",   icon: "📚", name: "First Step",       desc: "Complete your first lesson",
      earned: lessonsCompleted >= 1,   condition: "Complete 1 lesson",
    },
    {
      id: "lesson_5",       icon: "🎒", name: "Committed Learner", desc: "Complete 5 lessons",
      earned: lessonsCompleted >= 5,   condition: "Complete 5 lessons",
    },
    {
      id: "lesson_20",      icon: "🏆", name: "Dedicated Scholar", desc: "Complete 20 lessons",
      earned: lessonsCompleted >= 20,  condition: "Complete 20 lessons",
    },
    {
      id: "lesson_50",      icon: "🎓", name: "Academic Master",   desc: "Complete 50 lessons",
      earned: lessonsCompleted >= 50,  condition: "Complete 50 lessons",
    },
    {
      id: "streak_3",       icon: "🔥", name: "On Fire",           desc: "Maintain a 3-day streak",
      earned: streak >= 3,             condition: "3-day streak",
    },
    {
      id: "streak_7",       icon: "⚡", name: "Week Warrior",      desc: "Maintain a 7-day streak",
      earned: streak >= 7,             condition: "7-day streak",
    },
    {
      id: "streak_30",      icon: "💪", name: "Iron Will",         desc: "Maintain a 30-day streak",
      earned: streak >= 30,            condition: "30-day streak",
    },
    {
      id: "streak_100",     icon: "🌟", name: "Unstoppable",       desc: "100-day learning streak!",
      earned: streak >= 100,           condition: "100-day streak",
    },
    {
      id: "xp_500",         icon: "⭐", name: "XP Pioneer",        desc: "Earn 500 XP",
      earned: xp >= 500,               condition: "500 XP earned",
    },
    {
      id: "xp_5000",        icon: "💎", name: "XP Diamond",        desc: "Earn 5,000 XP",
      earned: xp >= 5000,              condition: "5000 XP earned",
    },
    {
      id: "grammar_ace",    icon: "📝", name: "Grammar Ace",        desc: "Achieve 80%+ grammar mastery",
      earned: grammarAcc >= 80,        condition: "80% grammar accuracy",
    },
    {
      id: "pronunciation",  icon: "🎤", name: "Pronunciation Pro",  desc: "Score 85%+ in speech lab",
      earned: pronunciationAvg >= 85,  condition: "85% pronunciation avg",
    },
    {
      id: "course_1",       icon: "🏅", name: "Bootcamp Graduate",  desc: "Complete Hangeul Bootcamp",
      earned: completedCourses >= 1,   condition: "Finish Course 0",
    },
    {
      id: "polyglot",       icon: "🌍", name: "Polyglot Path",      desc: "Start 3 different courses",
      earned: completedCourses >= 3,   condition: "Start 3 courses",
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// APP FEATURES for Overview
// ─────────────────────────────────────────────────────────────────────────────

const APP_FEATURES = [
  {
    icon: <BookMarked className="w-6 h-6 text-indigo-400" />, bg: "bg-indigo-500/10 border-indigo-500/20",
    title: "7 Structured Courses",
    desc: "From Hangeul Bootcamp (Pre-A1) to Advanced C1 Korean. 42+ phases of progressive, curriculum-backed lessons built from TTMIK and Basic Korean materials.",
    link: "/lessons", cta: "Browse Courses",
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-teal-400" />, bg: "bg-teal-500/10 border-teal-500/20",
    title: "Gwan-Sik AI Tutor",
    desc: "Practice bilingual Korean-English dialogue with AI tutor Gwan-Sik. Powered by cloud Groq APIs. Real-time grammar corrections, translations, and insights.",
    link: "/tutor", cta: "Start Chat",
  },
  {
    icon: <Volume2 className="w-6 h-6 text-pink-400" />, bg: "bg-pink-500/10 border-pink-500/20",
    title: "Neural TTS Voice Engine",
    desc: "Premium Microsoft Edge Neural TTS with bilingual auto-segmentation. 3 Korean voices + 5 English voices. Adjustable playback speed, word-by-word karaoke highlighting.",
    link: "/tutor", cta: "Try TTS",
  },
  {
    icon: <Mic className="w-6 h-6 text-red-400" />, bg: "bg-red-500/10 border-red-500/20",
    title: "Speech Lab & Pronunciation",
    desc: "Record your Korean pronunciation, get phoneme-level accuracy scores powered by Faster Whisper. See syllable-by-syllable color feedback and track your improvement over time.",
    link: "/lessons", cta: "Practice Speaking",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-blue-400" />, bg: "bg-blue-500/10 border-blue-500/20",
    title: "AI Benchmarks Dashboard",
    desc: "Compare all 9 brain models and all TTS voices with interactive heatmaps, per-dimension breakdowns, and ranked leaderboards. See which model gives the best Korean tutor responses.",
    link: "/benchmarks", cta: "View Benchmarks",
  },
  {
    icon: <BrainCircuit className="w-6 h-6 text-purple-400" />, bg: "bg-purple-500/10 border-purple-500/20",
    title: "Adaptive RAG Curriculum",
    desc: "Retrieval-Augmented Generation engine creates context-aware lessons from uploaded Korean textbook PDFs. Each lesson adapts to your mistakes — more mistakes = more scaffolding.",
    link: "/lessons", cta: "Launch Lessons",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER COMPONENT: Animated Progress Bar
// ─────────────────────────────────────────────────────────────────────────────

function MasteryBar({ label, value, color, emoji, sublabel }: { label: string; value: number; color: string; emoji: string; sublabel?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{emoji}</span>
          <div>
            <span className="text-sm font-bold text-zinc-200">{label}</span>
            {sublabel && <span className="text-[10px] text-zinc-500 ml-2">{sublabel}</span>}
          </div>
        </div>
        <span className="text-sm font-black text-white font-mono">{value}%</span>
      </div>
      <div className="h-3 w-full bg-zinc-900/80 rounded-full overflow-hidden border border-white/5 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${Math.max(2, value)}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
        <span>Beginner</span>
        <span className={value >= 50 ? "text-zinc-400" : ""}>
          {value < 20 ? "Just Started" : value < 40 ? "Learning" : value < 60 ? "Developing" : value < 80 ? "Proficient" : "Mastered"}
        </span>
        <span>Expert</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashTab>("overview");

  // Course progress from localStorage
  const [courseStates, setCourseStates] = useState<Record<number, CourseState>>({});

  // Quiz accuracy from localStorage (written by lessons page)
  const [quizAccuracy, setQuizAccuracy] = useState({ correct: 0, total: 0 });

  // Crop/avatar states
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Reset/delete modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState("");
  const [resetting, setResetting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Calendar Scheduler states
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedCourseId, setSelectedCourseId] = useState(1);
  const [selectedStartDate, setSelectedStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedPace, setSelectedPace] = useState(3); // default Balanced: 3 days per phase
  
  interface ScheduledCourse {
    id: string;
    courseId: number;
    startDate: string;
    endDate: string;
    pace: number;
    paceLabel: string;
  }
  const [scheduledCourses, setScheduledCourses] = useState<ScheduledCourse[]>([]);

  // Load scheduled courses from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hangeulai_scheduled_courses");
        if (saved) {
          setScheduledCourses(JSON.parse(saved));
        } else {
          // Pre-populate with Course 1 starting today at Balanced pace (3 days per phase)
          const start = new Date();
          const end = new Date(start);
          end.setDate(start.getDate() + (6 * 3 - 1)); // Course 1 has 6 phases
          const initialSchedule: ScheduledCourse = {
            id: "initial-bootcamp-schedule",
            courseId: 1,
            startDate: start.toISOString().split("T")[0],
            endDate: end.toISOString().split("T")[0],
            pace: 3,
            paceLabel: "Balanced (3d/phase)"
          };
          setScheduledCourses([initialSchedule]);
          localStorage.setItem("hangeulai_scheduled_courses", JSON.stringify([initialSchedule]));
        }
      } catch {}
    }
  }, []);

  const saveScheduledCoursesToBackend = async (schedules: ScheduledCourse[]) => {
    try {
      await apiRequest("/progress/profile", {
        method: "PATCH",
        body: JSON.stringify({ scheduled_courses: schedules })
      });
    } catch (err) {
      console.error("Failed to sync schedules to backend:", err);
    }
  };

  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return null;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const loadDashboardData = async () => {
    try {
      const user = await ensureAuthenticated();
      if (!user) return;
      const [profileData, statsData] = await Promise.all([
        apiRequest("/progress/profile"),
        apiRequest("/progress/stats"),
      ]);
      setProfile(profileData);
      setStats(statsData);
      
      if (profileData.avatar_base64) {
        setUserAvatar(profileData.avatar_base64);
      } else if (typeof window !== "undefined") {
        setUserAvatar(localStorage.getItem("user_avatar"));
      }

      // Sync backend states to frontend states and localStorage
      if (profileData.course_states) {
        setCourseStates(profileData.course_states);
        if (typeof window !== "undefined") {
          localStorage.setItem("hangeulai_course_state", JSON.stringify(profileData.course_states));
        }
      }
      if (profileData.activity_log) {
        setActivityLog(profileData.activity_log);
        if (typeof window !== "undefined") {
          localStorage.setItem("hangeulai_activity_log", JSON.stringify(profileData.activity_log));
        }
      }
      if (profileData.scheduled_courses && profileData.scheduled_courses.length > 0) {
        setScheduledCourses(profileData.scheduled_courses);
        if (typeof window !== "undefined") {
          localStorage.setItem("hangeulai_scheduled_courses", JSON.stringify(profileData.scheduled_courses));
        }
      }
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Fallbacks from localStorage if network is delayed or cached
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hangeulai_course_state");
        if (saved) setCourseStates(JSON.parse(saved));
      } catch {}

      try {
        const qa = localStorage.getItem("hangeulai_quiz_accuracy");
        if (qa) setQuizAccuracy(JSON.parse(qa));
      } catch {}
    }
  }, []);

  // ── Mastery Goal calculations ──────────────────────────────────────────────
  const grammarMastery = stats?.grammar_mastery ?? 0;
  const vocabMastery = stats?.vocab_mastery ?? 0;
  const pronunciationAvg = stats?.pronunciation_average ?? 0;
  // Blend quiz accuracy into grammar mastery if we have data
  const quizAccuracyPct = quizAccuracy.total > 0
    ? Math.round((quizAccuracy.correct / quizAccuracy.total) * 100)
    : 0;
  const blendedGrammar = quizAccuracy.total > 0
    ? Math.round(grammarMastery * 0.5 + quizAccuracyPct * 0.5)
    : grammarMastery;
  const overallFluency = Math.round(
    blendedGrammar * 0.35 + vocabMastery * 0.35 + pronunciationAvg * 0.30
  );

  // ── XP & Tier ──────────────────────────────────────────────────────────────
  const totalXP = profile?.total_xp ?? 0;
  const currentTier = getXpTier(totalXP);
  const nextTier = getNextTier(totalXP);
  const xpToNext = nextTier ? nextTier.min - totalXP : 0;
  const xpProgress = nextTier
    ? Math.round(((totalXP - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
    : 100;

  // ── Badges ────────────────────────────────────────────────────────────────
  const lessonsCompleted = stats?.lessons_completed ?? 0;
  const streak = profile?.current_streak ?? 0;
  const completedCourseCount = Object.values(courseStates).filter(
    (cs, idx) => cs.completedPhases.length >= ALL_COURSES[idx]?.phases
  ).length;
  const badges = buildBadges(totalXP, streak, lessonsCompleted, completedCourseCount, blendedGrammar, pronunciationAvg);
  const earnedBadges = badges.filter(b => b.earned).length;

  // ── Activity log from localStorage ────────────────────────────────────────
  const [activityLog, setActivityLog] = useState<{ date: string; lesson: string; xp: number }[]>([]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const log = localStorage.getItem("hangeulai_activity_log");
        if (log) setActivityLog(JSON.parse(log));
      } catch {}
    }
  }, []);

  // ── Avatar handlers ────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setCropSrc(reader.result as string); setZoom(1); setPanX(0); setPanY(0); setShowCropModal(true); };
      reader.readAsDataURL(file);
    }
  };
  const handleMouseDown = (e: React.MouseEvent) => { setIsDragging(true); dragStart.current = { x: e.clientX - panX, y: e.clientY - panY }; };
  const handleMouseMove = (e: React.MouseEvent) => { if (!isDragging) return; setPanX(e.clientX - dragStart.current.x); setPanY(e.clientY - dragStart.current.y); };
  const handleMouseUp = () => setIsDragging(false);
  const handleSaveCrop = async () => {
    if (!cropSrc) return;
    const img = new Image(); img.src = cropSrc;
    img.onload = async () => {
      const canvas = document.createElement("canvas"); canvas.width = 300; canvas.height = 300;
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      ctx.fillStyle = "#09090b"; ctx.fillRect(0, 0, 300, 300);
      const containerSize = 288, cropCircleSize = 192, wsToCanvas = 300 / cropCircleSize;
      ctx.translate(150, 150); ctx.translate(panX * wsToCanvas, panY * wsToCanvas); ctx.scale(zoom * wsToCanvas, zoom * wsToCanvas);
      let rw = img.width, rh = img.height; const ratio = img.width / img.height;
      if (rw > containerSize) { rw = containerSize; rh = containerSize / ratio; }
      if (rh > containerSize) { rh = containerSize; rw = containerSize * ratio; }
      ctx.drawImage(img, -rw / 2, -rh / 2, rw, rh);
      const croppedBase64 = canvas.toDataURL("image/jpeg", 0.85);
      setUserAvatar(croppedBase64);
      if (typeof window !== "undefined") localStorage.setItem("user_avatar", croppedBase64);
      try { await apiRequest("/progress/profile", { method: "PATCH", body: JSON.stringify({ avatar_base64: croppedBase64 }) }); } catch {}
      setShowCropModal(false); setCropSrc(null);
    };
  };

  const handleResetProgress = async () => {
    if (resetConfirmInput !== "RESET") return;
    setResetting(true);
    try {
      await apiRequest("/progress/reset", { method: "POST" });
      if (typeof window !== "undefined") {
        localStorage.removeItem("hangeulai_activity_log");
        localStorage.removeItem("hangeulai_quiz_accuracy");
        localStorage.removeItem("hangeulai_course_state");
        localStorage.removeItem("hangeulai_scheduled_courses");
      }
      window.location.reload();
    }
    catch { alert("Failed to reset progress. Please try again."); }
    finally { setResetting(false); setShowResetModal(false); }
  };
  const handleDeleteAccount = async () => {
    if (deleteConfirmInput !== "DELETE") return;
    setDeleting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const response = await fetch(`${API_BASE_URL}/auth/delete-account`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) throw new Error("Delete account failed");
      localStorage.clear(); window.location.href = "/login";
    } catch { alert("Failed to delete account. Please try again."); }
    finally { setDeleting(false); setShowDeleteModal(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto" />
          <p className="text-zinc-500 text-sm font-bold">Loading your HangeulAI command center...</p>
        </div>
      </div>
    );
  }

  const TABS: { id: DashTab; label: string; emoji: string }[] = [
    { id: "overview",      label: "Overview",      emoji: "🏠" },
    { id: "journey",       label: "My Journey",    emoji: "📚" },
    { id: "achievements",  label: "Achievements",  emoji: "🏆" },
    { id: "activity",      label: "Activity",      emoji: "📅" },
    { id: "calendar",      label: "Study Calendar", emoji: "🗓️" },
  ];

  return (
    <div className="min-h-screen text-foreground bg-zinc-950 relative font-sans">
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/3 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-600/3 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6 relative z-10">

        {/* ═══════════════════════════════════════════════════════
            LEFT SIDEBAR — Profile + Stats
        ═══════════════════════════════════════════════════════ */}
        <aside className="w-full lg:w-80 flex flex-col gap-5 flex-shrink-0">

          {/* User Card */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-zinc-900/30 space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 via-amber-400 to-red-600 p-1 shadow-xl cursor-pointer relative group"
                title="Click to upload photo"
              >
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center text-3xl overflow-hidden relative">
                  {userAvatar ? <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" /> : <span>🇰🇷</span>}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] font-black uppercase text-white tracking-widest">Edit</div>
                </div>
              </div>

              <div>
                <h2 className="font-extrabold text-2xl text-white">{profile?.display_name || "Learner"}</h2>
                {profile?.korean_name && <p className="text-brand-gold font-korean font-extrabold text-base">한국명: {profile.korean_name}</p>}
                <p className="text-zinc-500 text-xs mt-0.5">Native: {profile?.native_language || "English"}</p>
              </div>

              {/* XP Tier Badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black ${currentTier.bg} ${currentTier.color}`}>
                <span className="text-base">{currentTier.emoji}</span>
                <span>{currentTier.name}</span>
              </div>

              {/* Profile details */}
              <div className="w-full space-y-2">
                {profile?.dob && (
                  <div className="flex items-center gap-3 bg-zinc-950/60 p-2.5 rounded-xl border border-white/5">
                    <div className="p-1.5 bg-pink-500/10 text-pink-400 rounded-lg border border-pink-500/20"><Calendar className="w-3.5 h-3.5" /></div>
                    <div className="text-left">
                      <span className="block text-[8px] text-zinc-500 uppercase tracking-widest font-black">Age</span>
                      <span className="block text-xs font-extrabold text-zinc-200">{calculateAge(profile.dob)} Years Old</span>
                    </div>
                  </div>
                )}
                {profile?.occupation && (
                  <div className="flex items-center gap-3 bg-zinc-950/60 p-2.5 rounded-xl border border-white/5">
                    <div className="p-1.5 bg-brand-400/10 text-brand-400 rounded-lg border border-brand-400/20"><Briefcase className="w-3.5 h-3.5" /></div>
                    <div className="text-left truncate max-w-[190px]">
                      <span className="block text-[8px] text-zinc-500 uppercase tracking-widest font-black">Occupation</span>
                      <span className="block text-xs font-extrabold text-zinc-200 truncate">{profile.occupation}</span>
                    </div>
                  </div>
                )}
                {profile?.korean_proficiency && (
                  <div className="flex items-center gap-3 bg-zinc-950/60 p-2.5 rounded-xl border border-white/5">
                    <div className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/20"><Trophy className="w-3.5 h-3.5" /></div>
                    <div className="text-left truncate max-w-[190px]">
                      <span className="block text-[8px] text-zinc-500 uppercase tracking-widest font-black">Proficiency</span>
                      <span className="block text-xs font-extrabold text-teal-400 truncate">{profile.korean_proficiency.split(" (")[0]}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Reset / Delete */}
              <div className="flex gap-2 w-full pt-1">
                <button onClick={() => { setResetConfirmInput(""); setShowResetModal(true); }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-zinc-950 hover:bg-red-500/10 border border-white/5 text-zinc-500 hover:text-red-400 hover:border-red-500/20 text-xs font-semibold transition cursor-pointer">
                  <RotateCcw className="w-3 h-3" /><span>Reset</span>
                </button>
                <button onClick={() => { setDeleteConfirmInput(""); setShowDeleteModal(true); }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-red-950/20 hover:bg-red-500/20 border border-red-500/10 text-red-500/70 hover:text-red-400 text-xs font-semibold transition cursor-pointer">
                  <Trash2 className="w-3 h-3" /><span>Delete</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Daily Streak", val: `${streak}`, unit: "days", icon: <Flame className="w-5 h-5 text-orange-400 animate-pulse" />, color: "border-orange-500/20 bg-orange-500/5" },
              { label: "Total XP", val: totalXP.toLocaleString(), unit: "xp", icon: <Zap className="w-5 h-5 text-amber-400" />, color: "border-amber-500/20 bg-amber-500/5" },
              { label: "Lessons Done", val: `${lessonsCompleted}`, unit: "lessons", icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, color: "border-emerald-500/20 bg-emerald-500/5" },
              { label: "Badges Earned", val: `${earnedBadges}`, unit: `/ ${badges.length}`, icon: <Medal className="w-5 h-5 text-blue-400" />, color: "border-blue-500/20 bg-blue-500/5" },
            ].map(c => (
              <div key={c.label} className={`glass-panel p-4 rounded-2xl border ${c.color} text-center space-y-1`}>
                <div className="flex justify-center">{c.icon}</div>
                <div className="text-xl font-black text-white">{c.val}</div>
                <div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">{c.label}</div>
              </div>
            ))}
          </div>

          {/* XP Tier Progress */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-zinc-900/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">XP Tier</span>
                <div className={`text-base font-black flex items-center gap-1.5 ${currentTier.color}`}>
                  <span>{currentTier.emoji}</span> {currentTier.name}
                </div>
              </div>
              {nextTier && (
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">Next</span>
                  <span className="text-xs font-black text-zinc-400">{nextTier.emoji} {nextTier.name}</span>
                </div>
              )}
            </div>
            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-1000" style={{ width: `${xpProgress}%` }} />
            </div>
            {nextTier && <p className="text-[10px] text-zinc-500 text-center">{xpToNext.toLocaleString()} XP to {nextTier.name}</p>}
          </div>

          {/* Quick Navigation */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5 space-y-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block mb-3">Quick Access</span>
            {[
              { href: "/lessons", label: "Open Lessons", icon: <BookOpen className="w-4 h-4 text-teal-400" /> },
              { href: "/tutor", label: "Chat with Gwan-Sik", icon: <MessageSquare className="w-4 h-4 text-blue-400" /> },
              { href: "/benchmarks", label: "AI Benchmarks", icon: <BarChart3 className="w-4 h-4 text-purple-400" /> },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/40 border border-white/5 hover:bg-white/5 hover:border-white/10 transition text-sm font-bold text-zinc-300 hover:text-white group cursor-pointer">
                {l.icon}
                <span className="flex-1">{l.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition" />
              </Link>
            ))}
          </div>

        </aside>

        {/* ═══════════════════════════════════════════════════════
            MAIN CONTENT — Tabbed
        ═══════════════════════════════════════════════════════ */}
        <main className="flex-grow min-w-0 space-y-6">

          {/* Welcome Banner */}
          <section className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-gradient-to-r from-zinc-950 via-zinc-900/80 to-amber-950/10 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 text-[140px] font-black text-white/3 select-none font-korean">한</div>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-5 relative z-10">
              <img src="/LOGO.png" className="w-20 h-20 rounded-2xl object-contain bg-zinc-950/80 p-2.5 border border-white/10 shadow-xl shadow-amber-500/10 flex-shrink-0" alt="HangeulAI" />
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 font-extrabold text-xs py-1 px-3 rounded-full border border-amber-500/20">
                  <Sparkles className="w-3.5 h-3.5" /> <span>진짜 AI (Jinjja AI)</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                  Annyeong, <span className="bg-gradient-to-r from-amber-400 via-red-400 to-blue-400 bg-clip-text text-transparent">{profile?.display_name || "Learner"}</span>! 🌸
                </h1>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
                  Your scientific Korean learning command center. Track your progress, practice with AI, and master Hangeul one phase at a time.
                </p>
                <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start">
                  <Link href="/lessons" className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-black py-2.5 px-5 rounded-xl shadow-lg shadow-amber-500/20 transition text-sm cursor-pointer">
                    <PlayCircle className="w-4 h-4" /> Continue Learning
                  </Link>
                  <Link href="/tutor" className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold py-2.5 px-5 rounded-xl border border-white/10 hover:border-blue-500/30 transition text-sm cursor-pointer">
                    <MessageSquare className="w-4 h-4 text-blue-400" /> Chat with Gwan-Sik
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Tab Bar */}
          <div className="flex gap-1.5 bg-zinc-900/60 p-1.5 rounded-2xl border border-white/5 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ─────────────────────────────────────────────────────
              TAB: OVERVIEW
          ───────────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-6">

              {/* Mastery Goals */}
              <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-400" />
                    <h2 className="text-xl font-bold text-white">Mastery Goals</h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="font-mono bg-zinc-900 px-2 py-0.5 rounded border border-white/5">
                      {quizAccuracy.total > 0 ? `${quizAccuracy.correct}/${quizAccuracy.total} quiz correct` : "No quiz data yet"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <MasteryBar
                    label="Vocabulary" emoji="📖"
                    value={vocabMastery}
                    color="bg-gradient-to-r from-amber-600 to-yellow-400"
                    sublabel="from lesson history"
                  />
                  <MasteryBar
                    label="Grammar Accuracy" emoji="📝"
                    value={blendedGrammar}
                    color="bg-gradient-to-r from-blue-700 to-blue-400"
                    sublabel={quizAccuracy.total > 0 ? `blended with ${quizAccuracyPct}% quiz score` : "from API stats"}
                  />
                  <MasteryBar
                    label="Pronunciation / Speech Lab" emoji="🎤"
                    value={pronunciationAvg}
                    color="bg-gradient-to-r from-red-700 to-red-400"
                    sublabel="from recording sessions"
                  />
                  <MasteryBar
                    label="Overall Fluency" emoji="🌸"
                    value={overallFluency}
                    color="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400"
                    sublabel="weighted average"
                  />
                </div>
                <div className="bg-zinc-950/40 p-4 rounded-2xl border border-white/5 text-xs text-zinc-400 flex items-start gap-2">
                  <span className="text-blue-400 font-black mt-0.5">ℹ</span>
                  <span>Grammar Accuracy blends API lesson stats with your live quiz correct-answer rate as you complete lessons and checkpoints.</span>
                </div>
              </section>

              {/* Hangeul History */}
              <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4 bg-zinc-900/10 relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 text-[110px] font-black text-white/4 select-none font-korean">訓民正音</div>
                <div className="flex items-center gap-2 text-amber-400 font-extrabold">
                  <Scroll className="w-5 h-5" />
                  <h2 className="text-lg font-bold">The Story of Hangeul (한글의 역사)</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                  {[
                    { dot: "bg-blue-500", title: "King Sejong's Vision", content: "In 1443, King Sejong the Great created Hangeul specifically to increase literacy for all Korean citizens — before this, only nobles who learned Chinese Hanja could read and write." },
                    { dot: "bg-amber-400", title: "Scientifically Designed", content: "Linguists call Hangeul the most scientific writing system in the world. Consonants are modeled after the mouth and tongue positions when making each sound, while vowels represent Sky, Earth, and Humanity." },
                    { dot: "bg-red-500", title: "\"A Morning's Study\"", content: "From the 1446 Hunminjeongeum manual: 'A wise man can acquaint himself before the morning is over; a stupid man can learn them in ten days.' Still the world's most accessible alphabet." },
                  ].map(c => (
                    <div key={c.title} className="bg-zinc-950/50 p-4 rounded-2xl border border-white/5 hover:border-zinc-700 transition space-y-2">
                      <h4 className="font-bold text-zinc-200 text-sm flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${c.dot}`} />{c.title}
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* App Features Grid */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-blue-400" />
                  Everything in HangeulAI
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {APP_FEATURES.map(f => (
                    <div key={f.title} className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-zinc-600 transition space-y-3 group">
                      <div className={`inline-flex p-2.5 rounded-xl border ${f.bg}`}>{f.icon}</div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{f.title}</h3>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{f.desc}</p>
                      </div>
                      <Link href={f.link} className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition group-hover:text-zinc-200 cursor-pointer">
                        {f.cta} <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────
              TAB: MY JOURNEY (Course Progress Hub)
          ───────────────────────────────────────────────────── */}
          {activeTab === "journey" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Map className="w-6 h-6 text-teal-400" /> My Learning Journey
                  </h2>
                  <p className="text-zinc-400 text-sm mt-0.5">All 7 courses — track your phases, XP earned, and last visited state.</p>
                </div>
                <Link href="/lessons" className="inline-flex items-center gap-2 bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 font-bold px-4 py-2 rounded-xl text-sm transition cursor-pointer">
                  <PlayCircle className="w-4 h-4" /> Open Lessons
                </Link>
              </div>

              <div className="space-y-4">
                {ALL_COURSES.map(course => {
                  const state: CourseState = courseStates[course.id] || { lastPhase: 0, completedPhases: [], totalXP: 0, lastVisited: null };
                  const completedCount = state.completedPhases.length;
                  const progressPct = Math.round((completedCount / course.phases) * 100);
                  const xpEarned = state.totalXP || completedCount * course.xpPerPhase;
                  const maxXP = course.phases * course.xpPerPhase;
                  const isStarted = completedCount > 0 || state.lastPhase > 0;

                  return (
                    <div key={course.id} className={`glass-panel rounded-3xl border overflow-hidden transition hover:border-opacity-60 ${course.borderColor} bg-gradient-to-r ${course.gradient}`}>
                      <div className="p-5 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex-1 min-w-0 space-y-3">
                            {/* Course header */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-2xl">{course.badge}</span>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{course.subtitle}</span>
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full border" style={{ color: course.accent, borderColor: course.accent + "40", background: course.accent + "15" }}>{course.cefr}</span>
                                  <span className="text-[9px] font-bold text-zinc-500 bg-zinc-950/60 px-2 py-0.5 rounded border border-white/5">{course.duration}</span>
                                  {isStarted && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">In Progress</span>}
                                </div>
                                <h3 className="text-lg font-black text-white mt-0.5">{course.title}</h3>
                              </div>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">{course.description}</p>

                            {/* Phase tracker dots */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {course.phaseNames.map((phaseName, phaseIdx) => {
                                  const phaseNum = phaseIdx + 1;
                                  const isDone = state.completedPhases.includes(phaseNum);
                                  const isCurrent = state.lastPhase === phaseNum && !isDone;
                                  return (
                                    <div key={phaseNum} className="flex flex-col items-center gap-1" title={phaseName}>
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition ${
                                        isDone ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                                          : isCurrent ? "border-amber-400 bg-amber-500/20 text-amber-400 animate-pulse"
                                          : "border-zinc-700 bg-zinc-900/60 text-zinc-600"
                                      }`}>
                                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : phaseNum}
                                      </div>
                                      <span className="text-[8px] text-zinc-600 text-center w-12 truncate">{phaseName}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-zinc-500">
                                <span className="font-bold">{completedCount}/{course.phases} phases complete</span>
                                <span className="font-mono font-bold">{progressPct}%</span>
                              </div>
                              <div className="h-2 w-full bg-zinc-900/80 rounded-full overflow-hidden border border-white/5">
                                <div
                                  className="h-full rounded-full transition-all duration-1000"
                                  style={{ width: `${Math.max(progressPct > 0 ? 2 : 0, progressPct)}%`, background: `linear-gradient(90deg, ${course.accent}cc, ${course.accent})` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Right stats column */}
                          <div className="flex md:flex-col gap-3 md:gap-2 flex-shrink-0 md:text-right items-center md:items-end">
                            <div className="bg-zinc-950/40 px-4 py-3 rounded-2xl border border-white/5 text-center min-w-[90px]">
                              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-black">XP Earned</div>
                              <div className="text-xl font-black text-white">{xpEarned.toLocaleString()}</div>
                              <div className="text-[9px] text-zinc-600">of {maxXP.toLocaleString()}</div>
                            </div>
                            {state.lastVisited && (
                              <div className="bg-zinc-950/40 px-4 py-3 rounded-2xl border border-white/5 text-center min-w-[90px]">
                                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-black">Last Visit</div>
                                <div className="text-xs font-bold text-zinc-300">{new Date(state.lastVisited).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                              </div>
                            )}
                            <Link href="/lessons"
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer"
                              style={{ background: course.accent + "20", color: course.accent, border: `1px solid ${course.accent}40` }}
                            >
                              {isStarted ? "Resume" : "Start"}
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────
              TAB: ACHIEVEMENTS
          ───────────────────────────────────────────────────── */}
          {activeTab === "achievements" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-400" /> Achievements & Rewards
                </h2>
                <p className="text-zinc-400 text-sm mt-0.5">{earnedBadges} of {badges.length} badges earned · XP Tier: {currentTier.emoji} {currentTier.name}</p>
              </div>

              {/* XP Tier Ladder */}
              <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400" /> XP Tier Ladder</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {XP_TIERS.map(tier => {
                    const isReached = totalXP >= tier.min;
                    const isCurrent = currentTier.name === tier.name;
                    return (
                      <div key={tier.name} className={`p-4 rounded-2xl border text-center space-y-1 transition ${
                        isCurrent ? `${tier.bg} ring-2 ring-offset-1 ring-offset-zinc-950` :
                        isReached ? "bg-zinc-900/40 border-white/10" :
                        "bg-zinc-950/40 border-white/5 opacity-50"
                      }`}>
                        <div className="text-2xl">{tier.emoji}</div>
                        <div className={`text-xs font-black ${isReached ? tier.color : "text-zinc-600"}`}>{tier.name}</div>
                        <div className="text-[9px] text-zinc-500 font-mono">{tier.min.toLocaleString()} XP</div>
                        {isCurrent && <div className="text-[8px] font-black text-white bg-brand-500/30 px-2 py-0.5 rounded-full border border-brand-500/30">CURRENT</div>}
                        {isReached && !isCurrent && <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />}
                        {!isReached && <Lock className="w-3.5 h-3.5 text-zinc-700 mx-auto" />}
                      </div>
                    );
                  })}
                </div>
                {nextTier && (
                  <div className="bg-zinc-950/60 p-4 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-zinc-300">Progress to {nextTier.emoji} {nextTier.name}</span>
                      <span className="font-black text-white font-mono">{xpProgress}%</span>
                    </div>
                    <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5 p-0.5">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-1000" style={{ width: `${xpProgress}%` }} />
                    </div>
                    <p className="text-xs text-zinc-500">{xpToNext.toLocaleString()} more XP needed</p>
                  </div>
                )}
              </section>

              {/* Badges Grid */}
              <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2"><Medal className="w-5 h-5 text-blue-400" /> Badge Collection</h3>
                  <span className="text-xs font-black text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded-full border border-white/5">
                    {earnedBadges}/{badges.length} unlocked
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {badges.map(badge => (
                    <div key={badge.id} className={`p-4 rounded-2xl border text-center space-y-2 transition ${
                      badge.earned
                        ? "bg-gradient-to-br from-zinc-900/80 to-zinc-950 border-amber-500/20 hover:border-amber-500/40"
                        : "bg-zinc-950/30 border-white/5 opacity-50 grayscale"
                    }`}>
                      <div className="text-3xl">{badge.icon}</div>
                      <div className="space-y-0.5">
                        <div className={`text-xs font-black ${badge.earned ? "text-white" : "text-zinc-600"}`}>{badge.name}</div>
                        <div className="text-[9px] text-zinc-500 leading-tight">{badge.desc}</div>
                      </div>
                      {badge.earned ? (
                        <div className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">✓ EARNED</div>
                      ) : (
                        <div className="text-[8px] font-mono text-zinc-600">{badge.condition}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Streak Milestone Rewards */}
              <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2"><Flame className="w-5 h-5 text-orange-400" /> Streak Milestones</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { days: 3,   reward: "Extra XP Boost",     emoji: "🔥", xp: 100  },
                    { days: 7,   reward: "Week Champion Badge", emoji: "⚡", xp: 250  },
                    { days: 30,  reward: "Iron Will Trophy",    emoji: "🏆", xp: 1000 },
                    { days: 100, reward: "Unstoppable Legend",  emoji: "👑", xp: 5000 },
                  ].map(m => {
                    const reached = streak >= m.days;
                    return (
                      <div key={m.days} className={`p-4 rounded-2xl border text-center space-y-2 ${reached ? "bg-orange-950/30 border-orange-500/30" : "bg-zinc-950/30 border-white/5 opacity-60"}`}>
                        <div className="text-2xl">{m.emoji}</div>
                        <div className={`text-xs font-black ${reached ? "text-white" : "text-zinc-500"}`}>{m.days}-Day Streak</div>
                        <div className="text-[9px] text-zinc-400">{m.reward}</div>
                        <div className="text-[9px] font-black text-amber-400">+{m.xp.toLocaleString()} XP</div>
                        {reached ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <Lock className="w-3 h-3 text-zinc-700 mx-auto" />}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────
              TAB: ACTIVITY
          ───────────────────────────────────────────────────── */}
          {activeTab === "activity" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-6 h-6 text-teal-400" /> Recent Activity
                </h2>
                <p className="text-zinc-400 text-sm mt-0.5">Your learning history, streak calendar, and XP earned.</p>
              </div>

              {/* Current Streak + Daily Goal */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-5 rounded-2xl border border-orange-500/20 bg-orange-950/10 text-center space-y-2">
                  <Flame className="w-8 h-8 text-orange-400 mx-auto animate-pulse" />
                  <div className="text-4xl font-black text-white">{streak}</div>
                  <div className="text-sm font-bold text-zinc-400">Day Streak 🔥</div>
                  {streak === 0 && <p className="text-xs text-zinc-500">Complete a lesson to start your streak!</p>}
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10 text-center space-y-2">
                  <Zap className="w-8 h-8 text-amber-400 mx-auto" />
                  <div className="text-4xl font-black text-white">{totalXP.toLocaleString()}</div>
                  <div className="text-sm font-bold text-zinc-400">Total XP Earned</div>
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 text-center space-y-2">
                  <GraduationCap className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="text-4xl font-black text-white">{lessonsCompleted}</div>
                  <div className="text-sm font-bold text-zinc-400">Lessons Completed</div>
                </div>
              </div>

              {/* 7-day streak calendar */}
              <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-400" /> 7-Day Streak Calendar</h3>
                <div className="flex gap-3 justify-center">
                  {Array.from({ length: 7 }, (_, i) => {
                    const dayLabel = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i];
                    const active = i < streak && streak > 0;
                    return (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg ${
                          active ? "bg-orange-500 border-orange-400 shadow-lg shadow-orange-500/30" : "bg-zinc-900 border-zinc-700"
                        }`}>
                          {active ? "🔥" : "⬜"}
                        </div>
                        <span className="text-[9px] text-zinc-500 font-bold">{dayLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Recent Activity Timeline */}
              <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2"><Clock className="w-5 h-5 text-purple-400" /> Activity Timeline</h3>
                {activityLog.length > 0 ? (
                  <div className="relative border-l border-zinc-800 pl-5 space-y-5">
                    {activityLog.slice(0, 8).reverse().map((entry, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 bg-brand-500 rounded-full border-2 border-zinc-950" />
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-zinc-200">{entry.lesson}</p>
                            <p className="text-xs text-zinc-500">{new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex-shrink-0">+{entry.xp} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 space-y-3">
                    <div className="text-6xl">📚</div>
                    <p className="text-zinc-400 text-sm font-bold">No activity logged yet</p>
                    <p className="text-zinc-600 text-xs">Complete lessons to see your activity timeline here!</p>
                    <Link href="/lessons" className="inline-flex items-center gap-2 bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 font-bold px-4 py-2 rounded-xl text-sm transition cursor-pointer">
                      <PlayCircle className="w-4 h-4" /> Start a Lesson
                    </Link>
                  </div>
                )}
              </section>

              {/* Daily study tips */}
              <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2"><Heart className="w-5 h-5 text-pink-400" /> Daily Tips for Korean Success</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { emoji: "⏰", tip: "Study 20–30 minutes daily consistently for best retention." },
                    { emoji: "🗣️", tip: "After every lesson, open the AI Tutor and practice the topic in conversation." },
                    { emoji: "👂", tip: "Use the TTS voice buttons to listen to Korean pronunciation every session." },
                    { emoji: "✍️", tip: "Write out key vocab by hand — muscle memory reinforces Korean characters." },
                    { emoji: "🔄", tip: "Review the previous lesson's grammar notes before starting new content." },
                    { emoji: "🎯", tip: "Set a small daily XP goal (e.g. 200 XP) to maintain your streak." },
                  ].map(t => (
                    <div key={t.tip} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/40 border border-white/5">
                      <span className="text-xl flex-shrink-0">{t.emoji}</span>
                      <p className="text-xs text-zinc-400 leading-relaxed">{t.tip}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────
              TAB: CALENDAR
          ───────────────────────────────────────────────────── */}
          {activeTab === "calendar" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-indigo-400" /> Course Study Scheduler
                </h2>
                <p className="text-zinc-400 text-sm mt-0.5">
                  Plan your courses, set your personal learning pace, and visually track your daily study calendar.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT COLUMN: Scheduler Controls */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Schedule Course Card */}
                  <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-zinc-900/20 space-y-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Plan New Course
                    </h3>
                    
                    {/* Course Selection */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Select Course</label>
                      <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-200 focus:outline-none focus:border-indigo-500 transition"
                      >
                        {ALL_COURSES.map(course => (
                          <option key={course.id} value={course.id} className="bg-zinc-950 font-sans">
                            {course.badge} {course.title} ({course.phases} phases)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Start Date</label>
                      <input
                        type="date"
                        value={selectedStartDate}
                        onChange={(e) => setSelectedStartDate(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-200 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    {/* Study Pace */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Study Pace</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: 5, label: "Casual", sub: "5 days/phase" },
                          { val: 3, label: "Balanced", sub: "3 days/phase" },
                          { val: 1, label: "Intensive", sub: "1 day/phase" },
                        ].map(paceOption => (
                          <button
                            key={paceOption.val}
                            type="button"
                            onClick={() => setSelectedPace(paceOption.val)}
                            className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                              selectedPace === paceOption.val
                                ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 font-extrabold"
                                : "bg-zinc-950 border-white/5 hover:border-white/20 text-zinc-400"
                            }`}
                          >
                            <span className="text-xs">{paceOption.label}</span>
                            <span className="text-[9px] opacity-75 mt-0.5">{paceOption.sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Completion Estimate Info */}
                    {(() => {
                      const course = ALL_COURSES.find(c => c.id === selectedCourseId);
                      if (!course) return null;
                      const totalDays = course.phases * selectedPace;
                      const start = new Date(selectedStartDate);
                      const end = new Date(start);
                      end.setDate(start.getDate() + (totalDays - 1));
                      return (
                        <div className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-2xl space-y-2 text-xs">
                          <div className="flex justify-between font-bold text-zinc-300">
                            <span>Duration Required:</span>
                            <span className="text-indigo-400 font-black">{totalDays} Days ({Math.ceil(totalDays / 7)} Weeks)</span>
                          </div>
                          <div className="flex justify-between font-bold text-zinc-300">
                            <span>Target Completion:</span>
                            <span className="text-emerald-400 font-black">
                              {end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Schedule Button */}
                    <button
                      onClick={() => {
                        const course = ALL_COURSES.find(c => c.id === selectedCourseId);
                        if (!course) return;
                        const totalDays = course.phases * selectedPace;
                        const start = new Date(selectedStartDate);
                        const end = new Date(start);
                        end.setDate(start.getDate() + (totalDays - 1));
                        
                        const paceLabel = selectedPace === 5 ? "Casual" : selectedPace === 3 ? "Balanced" : "Intensive";
                        
                        const newSchedule: ScheduledCourse = {
                          id: `${selectedCourseId}-${Date.now()}`,
                          courseId: selectedCourseId,
                          startDate: selectedStartDate,
                          endDate: end.toISOString().split("T")[0],
                          pace: selectedPace,
                          paceLabel: `${paceLabel} (${selectedPace}d/phase)`
                        };
                        
                        const updated = [...scheduledCourses.filter(s => s.courseId !== selectedCourseId), newSchedule];
                        setScheduledCourses(updated);
                        localStorage.setItem("hangeulai_scheduled_courses", JSON.stringify(updated));
                        saveScheduledCoursesToBackend(updated);
                      }}
                      className="w-full bg-gradient-to-r from-indigo-500 to-brand-500 text-white font-black py-2.5 rounded-xl text-xs hover:scale-[1.02] shadow shadow-indigo-500/20 transition cursor-pointer"
                    >
                      Schedule Course
                    </button>

                  </div>

                  {/* Scheduled Courses List */}
                  <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-zinc-900/10 space-y-4">
                    <h3 className="font-bold text-white flex items-center justify-between">
                      <span>Active Schedules</span>
                      <span className="text-[10px] bg-zinc-850 px-2 py-0.5 border border-white/5 rounded text-zinc-500 font-mono">
                        {scheduledCourses.length} total
                      </span>
                    </h3>

                    {scheduledCourses.length > 0 ? (
                      <div className="space-y-3">
                        {scheduledCourses.map(schedule => {
                          const course = ALL_COURSES.find(c => c.id === schedule.courseId);
                          if (!course) return null;
                          return (
                            <div key={schedule.id} className="p-3 bg-zinc-950/60 border border-white/5 rounded-2xl flex items-center justify-between gap-3 hover:border-zinc-800 transition">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-xl flex-shrink-0">{course.badge}</span>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-zinc-200 text-xs truncate">{course.title}</h4>
                                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-0.5">
                                    <span>{new Date(schedule.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                    <span>➔</span>
                                    <span>{new Date(schedule.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                    <span className="text-[9px] px-1 bg-white/5 border border-white/5 rounded text-zinc-400">{schedule.paceLabel.split(" ")[0]}</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const updated = scheduledCourses.filter(s => s.id !== schedule.id);
                                  setScheduledCourses(updated);
                                  localStorage.setItem("hangeulai_scheduled_courses", JSON.stringify(updated));
                                  saveScheduledCoursesToBackend(updated);
                                }}
                                className="p-1 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition flex-shrink-0 cursor-pointer"
                                title="Remove schedule"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-600 text-center py-4">No scheduled courses. Add one above!</p>
                    )}
                  </div>

                </div>

                {/* RIGHT COLUMN: Interactive Calendar Grid */}
                <div className="lg:col-span-7 space-y-6">
                  
                  <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-zinc-900/20 space-y-4">
                    
                    {/* Calendar Month Header */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h3 className="text-lg font-black text-white">
                          {new Date(currentYear, currentMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Click any date to set as Start Date</p>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-white/5">
                        <button
                          onClick={() => {
                            if (currentMonth === 0) {
                              setCurrentMonth(11);
                              setCurrentYear(currentYear - 1);
                            } else {
                              setCurrentMonth(currentMonth - 1);
                            }
                          }}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition cursor-pointer"
                        >
                          ◀
                        </button>
                        <button
                          onClick={() => {
                            setCurrentMonth(new Date().getMonth());
                            setCurrentYear(new Date().getFullYear());
                          }}
                          className="px-2 py-1 text-[10px] font-black uppercase text-zinc-500 hover:text-white hover:bg-white/5 rounded transition cursor-pointer"
                        >
                          Today
                        </button>
                        <button
                          onClick={() => {
                            if (currentMonth === 11) {
                              setCurrentMonth(0);
                              setCurrentYear(currentYear + 1);
                            } else {
                              setCurrentMonth(currentMonth + 1);
                            }
                          }}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition cursor-pointer"
                        >
                          ▶
                        </button>
                      </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1.5 text-center">
                      
                      {/* Weekday headers */}
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day} className="text-[10px] font-black text-zinc-600 uppercase tracking-widest py-1">
                          {day}
                        </div>
                      ))}

                      {/* Day cells */}
                      {(() => {
                        const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
                        const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
                        const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

                        const cells = [];

                        // 1. Previous month blank/disabled cells
                        for (let i = firstDayIndex - 1; i >= 0; i--) {
                          const prevDayNum = prevMonthTotalDays - i;
                          const prevMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
                          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                          const dateStr = `${prevYear}-${String(prevMonthIndex + 1).padStart(2, "0")}-${String(prevDayNum).padStart(2, "0")}`;
                          cells.push({ dayNum: prevDayNum, dateStr, isCurrentMonth: false });
                        }

                        // 2. Current month cells
                        for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
                          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                          cells.push({ dayNum, dateStr, isCurrentMonth: true });
                        }

                        // 3. Next month cells to fill grid up to multiple of 7
                        const remaining = 42 - cells.length; // standard 6-week layout
                        for (let dayNum = 1; dayNum <= remaining; dayNum++) {
                          const nextMonthIndex = currentMonth === 11 ? 0 : currentMonth + 1;
                          const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
                          const dateStr = `${nextYear}-${String(nextMonthIndex + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                          cells.push({ dayNum, dateStr, isCurrentMonth: false });
                        }

                        return cells.map((cell, idx) => {
                          const isToday = cell.dateStr === new Date().toISOString().split("T")[0];
                          const isSelectedStart = cell.dateStr === selectedStartDate;
                          
                          // Find scheduled courses active on this day
                          const activeSchedules = scheduledCourses.filter(s => cell.dateStr >= s.startDate && cell.dateStr <= s.endDate);
                          const isScheduled = activeSchedules.length > 0;
                          
                          // Custom style mapping based on the active scheduled courses
                          let cellBackground = "bg-zinc-950/40 hover:bg-zinc-900/80";
                          let cellBorder = "border-white/5";
                          let cellTextColor = cell.isCurrentMonth ? "text-zinc-300" : "text-zinc-700";
                          
                          if (isScheduled) {
                            const primarySchedule = activeSchedules[0];
                            const course = ALL_COURSES.find(c => c.id === primarySchedule.courseId);
                            if (course) {
                              cellBackground = "";
                              cellBorder = `border-${course.accent}`; // will apply custom styling inline
                              cellTextColor = "text-white font-extrabold";
                            }
                          }

                          if (isSelectedStart) {
                            cellBorder = "border-indigo-500 ring-2 ring-indigo-500/20";
                          }

                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                if (cell.isCurrentMonth) {
                                  setSelectedStartDate(cell.dateStr);
                                }
                              }}
                              style={{
                                border: isSelectedStart ? "1px solid #6366f1" : isScheduled ? `1px solid ${ALL_COURSES.find(c => c.id === activeSchedules[0].courseId)?.accent}40` : undefined,
                                backgroundColor: isScheduled ? `${ALL_COURSES.find(c => c.id === activeSchedules[0].courseId)?.accent}15` : undefined
                              }}
                              className={`aspect-square p-1.5 rounded-xl border relative flex flex-col items-center justify-between group transition cursor-pointer select-none ${cellBackground} ${cellBorder}`}
                              title={isScheduled ? activeSchedules.map(s => ALL_COURSES.find(c => c.id === s.courseId)?.title).join(", ") : undefined}
                            >
                              
                              {/* Date number */}
                              <span className={`text-xs ${cellTextColor} ${isToday ? "bg-amber-500 text-zinc-950 font-black w-5 h-5 flex items-center justify-center rounded-full" : ""}`}>
                                {cell.dayNum}
                              </span>

                              {/* Multi-course indicator dots/bars */}
                              <div className="flex gap-1 justify-center w-full mt-1">
                                {activeSchedules.map(s => {
                                  const course = ALL_COURSES.find(c => c.id === s.courseId);
                                  if (!course) return null;
                                  return (
                                    <span
                                      key={s.id}
                                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: course.accent }}
                                      title={course.title}
                                    />
                                  );
                                })}
                              </div>

                              {/* Hover info tooltip */}
                              {isScheduled && (
                                <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 bg-zinc-950 border border-white/10 p-2.5 rounded-xl shadow-2xl text-left w-48 text-[10px] space-y-1">
                                  <p className="font-bold text-zinc-400">Scheduled Studies:</p>
                                  {activeSchedules.map(s => {
                                    const course = ALL_COURSES.find(c => c.id === s.courseId);
                                    if (!course) return null;
                                    return (
                                      <div key={s.id} className="flex items-center gap-1.5 text-white font-bold">
                                        <span>{course.badge}</span>
                                        <span className="truncate">{course.title}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                            </div>
                          );
                        });
                      })()}

                    </div>

                    {/* Color Legend */}
                    <div className="border-t border-white/5 pt-4">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block mb-3.5">Color Legend</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {ALL_COURSES.map(course => (
                          <div key={course.id} className="flex items-center gap-2 p-1 bg-zinc-950/40 border border-white/5 rounded-xl px-2.5 py-2">
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: course.accent }} />
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-zinc-300 block truncate leading-none">{course.badge} {course.title}</span>
                              <span className="text-[8px] text-zinc-500 font-mono">{course.subtitle}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* ═══ CROP MODAL ═══════════════════════════════════════════════════════ */}
      {showCropModal && cropSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-white/10 space-y-5 bg-zinc-950 flex flex-col items-center">
            <div className="flex items-center justify-between w-full border-b border-white/5 pb-3">
              <h3 className="font-black text-sm text-zinc-300 flex items-center gap-2"><Crop className="w-4 h-4 text-brand-gold" />Crop Profile Picture</h3>
              <button onClick={() => { setShowCropModal(false); setCropSrc(null); }} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
              className="relative w-72 h-72 overflow-hidden bg-zinc-900 rounded-2xl border border-white/5 cursor-move flex items-center justify-center select-none">
              <img src={cropSrc} alt="Crop preview" draggable={false} style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }} className="origin-center max-w-full max-h-full transition-transform duration-75 select-none pointer-events-none" />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border-2 border-dashed border-brand-gold/60 shadow-[0_0_0_9999px_rgba(9,9,11,0.7)]" />
              </div>
            </div>
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs text-zinc-400 font-extrabold font-mono"><span>Zoom</span><span>{Math.round(zoom * 100)}%</span></div>
              <input type="range" min="0.5" max="3.0" step="0.05" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-gold" />
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => { setShowCropModal(false); setCropSrc(null); }} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border border-white/5">Cancel</button>
              <button onClick={handleSaveCrop} className="flex-1 bg-gradient-to-r from-brand-gold to-amber-500 text-zinc-950 font-black py-2.5 rounded-xl text-xs transition cursor-pointer shadow shadow-brand-gold/10 hover:scale-[1.02]">Crop & Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ RESET MODAL ══════════════════════════════════════════════════════ */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-white/5 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 w-fit mx-auto text-red-400 animate-pulse-slow"><Trash2 className="w-6 h-6" /></div>
              <h3 className="text-xl font-extrabold text-white">Reset Course Progression</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">This will delete your entire dynamic textbook path, XP totals, streaks, and all phoneme attempts.</p>
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center font-mono">Type <span className="text-red-400 select-all font-black">RESET</span> to confirm</label>
              <input type="text" value={resetConfirmInput} onChange={e => setResetConfirmInput(e.target.value)} placeholder="RESET"
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-center text-sm font-mono focus:outline-none focus:border-red-500/40 transition text-red-400 uppercase" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowResetModal(false)} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer" disabled={resetting}>Cancel</button>
              <button onClick={handleResetProgress} disabled={resetConfirmInput !== "RESET" || resetting}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5 ${resetConfirmInput === "RESET" && !resetting ? "bg-red-500 hover:bg-red-600 text-white cursor-pointer" : "bg-zinc-900 text-zinc-600 border border-white/5 cursor-not-allowed"}`}>
                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RotateCcw className="w-4 h-4" /><span>Reset Path</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE MODAL ═════════════════════════════════════════════════════ */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-red-500/20 shadow-2xl space-y-5 bg-zinc-950">
            <div className="text-center space-y-2">
              <div className="p-3 bg-red-500/20 rounded-full border border-red-500/40 w-fit mx-auto text-red-400 animate-pulse-slow"><ShieldAlert className="w-7 h-7" /></div>
              <h3 className="text-xl font-extrabold text-red-400 uppercase tracking-wide">Danger Zone: Delete Account</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">This permanently deletes your profile, all dialogue sessions, curriculum mastery, XP, streaks, and database records.</p>
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center font-mono">Type <span className="text-red-500 font-black select-all">DELETE</span> to confirm</label>
              <input type="text" value={deleteConfirmInput} onChange={e => setDeleteConfirmInput(e.target.value)} placeholder="DELETE"
                className="w-full bg-zinc-900 border border-red-500/30 rounded-xl px-4 py-2.5 text-center text-sm font-mono focus:outline-none focus:border-red-500 transition text-red-400 uppercase font-bold" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer border border-white/5" disabled={deleting}>Keep Account</button>
              <button onClick={handleDeleteAccount} disabled={deleteConfirmInput !== "DELETE" || deleting}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black transition flex items-center justify-center gap-1.5 ${deleteConfirmInput === "DELETE" && !deleting ? "bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-lg shadow-red-600/30" : "bg-zinc-900 text-zinc-600 border border-white/5 cursor-not-allowed"}`}>
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /><span>Delete Permanently</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
