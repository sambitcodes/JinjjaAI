"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, BookOpen, MessageSquare, Headphones, Award, Home, User, LogOut, Library, Globe, Gamepad2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { apiRequest } from "../lib/api";

import FloatingKeyboard from "./FloatingKeyboard";
import xpAudit from "../lib/xp-audit.json";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const auditData = xpAudit as any;
  const pathname = usePathname();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeCourseId, setActiveCourseId] = useState<number>(1);

  // Universal Diary & Warning States
  const [notes, setNotes] = useState<any[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [generatingAiNote, setGeneratingAiNote] = useState(false);
  const [warningPopup, setWarningPopup] = useState<{ show: boolean; message: string } | null>(null);

  // Filters & Tabs for Advanced Diary
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [stepFilter, setStepFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai");

  const handleCourseChange = (val: string) => {
    setCourseFilter(val);
    setPhaseFilter("all");
    setStepFilter("all");
  };

  const handlePhaseChange = (val: string) => {
    setPhaseFilter(val);
    setStepFilter("all");
  };

  const getActiveLocation = () => {
    if (typeof window === "undefined") return { courseId: 1, phaseNum: 1, step: 1 };
    const courseId = parseInt(localStorage.getItem("hangeulai_active_course_id") || "1", 10);
    const phaseNum = parseInt(localStorage.getItem("hangeulai_active_phase_num") || "1", 10);
    const stepKey = courseId === 1 
      ? `hangeulai_phase${phaseNum}_step` 
      : `hangeulai_c${courseId}p${phaseNum}_step`;
    const step = parseInt(localStorage.getItem(stepKey) || "1", 10);
    return { courseId, phaseNum, step };
  };

  const loadNotes = async () => {
    try {
      const data = await apiRequest("/notes");
      setNotes(data || []);
    } catch (err) {
      console.error("Failed to load notes:", err);
    }
  };

  const playWarningSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(120, audioCtx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.3);
      
      osc2.type = "square";
      osc2.frequency.setValueAtTime(123, audioCtx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(83, audioCtx.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.3);
      osc2.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn("AudioContext warning sound failed", e);
    }
  };

  const navigateToLocation = async (courseId: number, phaseNum: number, step: number) => {
    if (pathname === "/lessons") {
      window.dispatchEvent(new CustomEvent("hangeulai-teleport", {
        detail: { courseId, phaseNum, step }
      }));
      setNotesOpen(false);
    } else {
      localStorage.setItem("hangeulai_teleport_pending", JSON.stringify({ courseId, phaseNum, step }));
      window.location.href = "/lessons";
    }
  };

  const handleSaveManualNote = async () => {
    if (!newNoteText.trim() || savingNote) return;
    setSavingNote(true);
    try {
      const { courseId, phaseNum, step } = getActiveLocation();

      const res = await apiRequest("/notes", {
        method: "POST",
        body: JSON.stringify({
          course_id: courseId,
          phase_num: phaseNum,
          step: step,
          content: newNoteText.trim(),
          is_ai: false
        })
      });
      setNotes(prev => [res, ...prev]);
      setNewNoteText("");
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await apiRequest(`/notes/${noteId}`, { method: "DELETE" });
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  useEffect(() => {
    loadNotes();
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("hangeulai_active_course_id");
      if (stored) setActiveCourseId(parseInt(stored, 10));
    }
  }, []);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const profile = await apiRequest("/progress/profile");
        setXp(profile.total_xp);
        setStreak(profile.current_streak);
      } catch (err) {
        // Fallback for offline mode
      }
    }
    
    const handleXpEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.amount === "number") {
        setXp(prev => Math.max(0, prev + customEvent.detail.amount));
      }
      loadMetrics();
    };

    const handleAddNoteEvent = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { question, selected_answer, correct_answer, is_correct, explanation } = customEvent.detail || {};
      if (!question) return;

      const userNote = window.prompt("Add your personal note/reflection to save with this content (optional):");
      if (userNote === null) return; // User cancelled

      setGeneratingAiNote(true);
      try {
        const { courseId, phaseNum, step } = getActiveLocation();
        const contentType = question.includes("Study Concept") ? "theory" : "question";
        const contentStr = JSON.stringify({
          contentType,
          originalContent: {
            question,
            selected_answer: selected_answer || "None",
            correct_answer: correct_answer || "None",
            is_correct: is_correct !== undefined ? is_correct : true,
            explanation: explanation || ""
          },
          userNote
        });

        const res = await apiRequest("/notes", {
          method: "POST",
          body: JSON.stringify({
            course_id: courseId,
            phase_num: phaseNum,
            step: step,
            content: contentStr,
            is_ai: false
          })
        });
        setNotes(prev => [res, ...prev]);
        setWarningPopup({ show: true, message: "✨ Note saved to your Diary successfully!" });
      } catch (err) {
        console.error("Failed to save note:", err);
      } finally {
        setGeneratingAiNote(false);
      }
    };

    const handleWarning = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.message) {
        setWarningPopup({ show: true, message: customEvent.detail.message });
        playWarningSound();
      }
    };

    const handleStepChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.courseId === "number") {
        setActiveCourseId(customEvent.detail.courseId);
      }
    };

    window.addEventListener("hangeulai-xp-net" as any, handleXpEvent);
    window.addEventListener("hangeulai-add-note", handleAddNoteEvent);
    window.addEventListener("hangeulai-warning" as any, handleWarning);
    window.addEventListener("hangeulai-step-change" as any, handleStepChange);
    loadMetrics();

    return () => {
      window.removeEventListener("hangeulai-xp-net" as any, handleXpEvent);
      window.removeEventListener("hangeulai-add-note", handleAddNoteEvent);
      window.removeEventListener("hangeulai-warning" as any, handleWarning);
      window.removeEventListener("hangeulai-step-change" as any, handleStepChange);
    };
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const filteredNotes = notes.filter(note => {
    // 1. Tab filter
    if (activeTab === "ai" && !note.is_ai) return false;
    if (activeTab === "manual" && note.is_ai) return false;

    // 2. Dropdown filters
    if (courseFilter !== "all" && String(note.course_id) !== courseFilter) return false;
    if (phaseFilter !== "all" && String(note.phase_num) !== phaseFilter) return false;
    if (stepFilter !== "all" && String(note.step) !== stepFilter) return false;

    // 3. Search query filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      let noteText = "";
      let questionText = "";
      let explanationText = "";
      
      if (!note.is_ai) {
        try {
          const parsed = JSON.parse(note.content);
          noteText = (parsed.userNote || "").toLowerCase();
          questionText = (parsed.originalContent?.question || "").toLowerCase();
          explanationText = (parsed.originalContent?.explanation || "").toLowerCase();
        } catch (e) {
          noteText = note.content.toLowerCase();
        }
      } else {
        noteText = note.content.toLowerCase();
      }

      const matchesSearch = 
        noteText.includes(q) || 
        questionText.includes(q) || 
        explanationText.includes(q);
      
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Hide sidebar on landing page, login/signup page, and onboarding questionnaire
  if (pathname === "/" || pathname === "/login" || pathname === "/onboarding") {
    return <>{children}</>;
  }

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home, colorClass: "text-amber-500 hover:text-amber-400", activeBg: "bg-amber-500/10 text-amber-300 border border-amber-500/25 shadow-[0_0_15px_rgba(245,158,11,0.15)]" },
    { name: "Lessons Path", href: "/lessons", icon: BookOpen, colorClass: "text-indigo-400 hover:text-indigo-300", activeBg: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 shadow-[0_0_15px_rgba(99,102,241,0.15)]" },
    { name: "Materials Warehouse", href: "/materials", icon: Library, colorClass: "text-pink-500 hover:text-pink-400", activeBg: "bg-pink-500/10 text-pink-300 border border-pink-500/25 shadow-[0_0_15px_rgba(236,72,153,0.15)]" },
    { name: "Online Hub", href: "/online", icon: Globe, colorClass: "text-cyan-400 hover:text-cyan-300", activeBg: "bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 shadow-[0_0_15px_rgba(6,182,212,0.15)]" },
    { name: "AI Tutor Chat", href: "/tutor", icon: MessageSquare, colorClass: "text-emerald-400 hover:text-emerald-300", activeBg: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.15)]" },
    { name: "Games Arcade", href: "/games", icon: Gamepad2, colorClass: "text-orange-500 hover:text-orange-400", activeBg: "bg-orange-500/10 text-orange-300 border border-orange-500/25 shadow-[0_0_15px_rgba(249,115,22,0.15)]" },
    { name: "AI Benchmarks", href: "/benchmarks", icon: Award, colorClass: "text-fuchsia-400 hover:text-fuchsia-300", activeBg: "bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/25 shadow-[0_0_15px_rgba(217,70,239,0.15)]" },
  ];

  const getCourseXPDetails = (cId: number) => {
    if (typeof window === "undefined") return { earned: 0, max: 0, pct: 0 };
    let earned = 0;
    let max = 0;
    const courseData = auditData[cId.toString()];
    if (courseData) {
      for (const phaseNum of Object.keys(courseData)) {
        const stepsData = courseData[phaseNum]?.steps;
        if (!stepsData) continue;
        for (const stepNum of Object.keys(stepsData)) {
          const key = `hangeulai_c${cId}p${phaseNum}_s${stepNum}_earned_xp`;
          earned += parseInt(localStorage.getItem(key) || "0", 10);
          max += stepsData[stepNum]?.max_xp || 35;
        }
      }
    }
    const pct = max > 0 ? Math.round((earned / max) * 100) : 0;
    return { earned, max, pct };
  };

  const getAllCoursesXP = () => {
    let total = 0;
    for (let c = 1; c <= 8; c++) {
      const { earned } = getCourseXPDetails(c);
      total += earned;
    }
    return total;
  };

  const activeCourseXP = getCourseXPDetails(activeCourseId);
  const allCoursesXP = getAllCoursesXP();
  const gameXP = Math.max(0, xp - allCoursesXP);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#09090b] text-foreground">
      
      {/* Sidebar Desktop Navigation (Collapsible by default: isCollapsed = true) */}
      <aside className={`hidden md:flex flex-col justify-between glass-panel border-r border-white/5 h-screen sticky top-0 transition-all duration-300 ease-in-out ${isCollapsed ? "w-20 px-2.5 py-4" : "w-64 p-5"}`}>
        
        <div className="space-y-6">
          {/* Logo Header - Displays name only when expanded */}
          <div 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex ${isCollapsed ? "flex-col items-center justify-center" : "flex-col items-center space-y-3"} p-2 rounded-2xl cursor-pointer hover:bg-white/5 transition duration-200`}
            title={isCollapsed ? "Click to Expand 진짜 AI" : "Click to Collapse"}
          >
            <img 
              src="/LOGO.png" 
              className={`rounded-2xl object-contain bg-white/5 p-1.5 border border-white/10 shadow-lg shadow-brand-500/10 transition-all duration-300 ${
                isCollapsed ? "w-14 h-14" : "w-36 h-36"
              }`} 
              alt="진짜 AI Logo" 
            />
            {!isCollapsed && (
              <span className="font-black text-2xl tracking-wider bg-gradient-to-r from-amber-400 via-red-400 to-blue-400 bg-clip-text text-transparent animate-fade-in truncate">
                진짜 AI
              </span>
            )}
          </div>

          {/* Quick Metrics */}
          {!isCollapsed ? (
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-2.5 animate-fade-in text-left">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-300">Course {activeCourseId} XP</span>
                  <span className="font-bold text-brand-400">{activeCourseXP.earned} / {activeCourseXP.max} XP</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${activeCourseXP.pct}%` }}
                  />
                </div>
                <span className="text-[9px] text-zinc-500 block text-right font-medium">{activeCourseXP.pct}% Completed</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Game XP</span>
                <span className="font-bold text-amber-400">{gameXP} XP</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Total XP</span>
                <span className="font-bold text-accent-teal">{xp} XP</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Streak</span>
                <span className="font-bold text-accent-pink">🔥 {streak} Days</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5 py-3 border-y border-white/5 my-2">
              <div className="text-[10px] font-bold text-brand-400" title={`Active Course XP: ${activeCourseXP.earned} (${activeCourseXP.pct}%)`}>
                📚 {activeCourseXP.earned}
              </div>
              <div className="text-[10px] font-bold text-amber-400" title={`Game XP: ${gameXP}`}>
                🎮 {gameXP}
              </div>
              <div className="text-[10px] font-bold text-accent-teal" title={`Total XP: ${xp}`}>
                🏆 {xp}
              </div>
              <div className="text-[10px] font-bold text-accent-pink" title={`Streak: ${streak} Days`}>
                🔥 {streak}d
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-xl transition font-medium ${
                    isCollapsed ? "justify-center p-3" : "space-x-3 px-4 py-3"
                  } ${
                    active
                      ? `${item.activeBg}`
                      : `${item.colorClass} hover:bg-white/5`
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer controls: Logout and Toggle button */}
        <div className="space-y-4 border-t border-white/5 pt-4">
          
          {/* Working Logout button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition font-semibold ${
              isCollapsed ? "justify-center p-3" : "space-x-3 px-4 py-3"
            }`}
            title="Logout from 진짜 AI"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="truncate">Sign Out</span>}
          </button>

          {/* Sidebar Toggle Chevron */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex justify-center text-zinc-500 hover:text-white py-1.5 rounded-lg hover:bg-white/5 transition"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? "" : "rotate-180"}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <header className="md:hidden flex justify-between items-center px-6 py-4 glass-panel border-b border-white/5">
        <div className="flex items-center space-x-2">
          <img src="/LOGO.png" className="w-6 h-6 rounded-md object-contain bg-white/5 p-0.5 border border-white/10" alt="진짜 AI Logo" />
          <span className="font-black text-md bg-gradient-to-r from-brand-400 to-accent-pink bg-clip-text text-transparent">
            진짜 AI
          </span>
        </div>
        <div className="flex items-center space-x-4 text-xs font-bold">
          <span className="text-accent-teal">🏆 {xp} XP</span>
          <span className="text-accent-pink">🔥 {streak}d</span>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 font-bold ml-2">Sign Out</button>
        </div>
      </header>

      {/* Main Page Area */}
      <div className="flex-grow flex flex-col min-h-screen">
        <main className="flex-grow p-6">
          {children}
          <FloatingKeyboard />
          
          {/* Universal Floating Warning Modal */}
          {warningPopup?.show && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
              <div className="w-full max-w-sm bg-zinc-950/90 border border-white/10 rounded-3xl p-6 text-center space-y-4 shadow-2xl relative backdrop-blur-xl animate-slide-in">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6 animate-bounce">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="text-md font-black uppercase tracking-wider text-red-400">Alert Notification</h3>
                <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                  {warningPopup.message}
                </p>
                <button
                  onClick={() => setWarningPopup(null)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-red-500/15 border border-white/10"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          )}

          {/* Floating Diary Button */}
          <button 
            onClick={() => setNotesOpen(!notesOpen)}
            className="fixed bottom-24 right-6 z-[9999] p-4 bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white rounded-full shadow-2xl shadow-brand-500/25 border border-white/10 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            title="Open Course Diary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 animate-pulse">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </button>

          {/* Floating Diary Drawer */}
          {notesOpen && (
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in">
              <div className="w-full max-w-xl bg-zinc-950/95 border-l border-white/10 h-full p-6 flex flex-col justify-between shadow-2xl backdrop-blur-xl animate-slide-in">
                <div className="space-y-6 flex-grow overflow-y-auto pr-1">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2 font-black text-sm text-zinc-300">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-brand-400">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      <span>Universal Course Diary</span>
                    </div>
                    <button 
                      onClick={() => setNotesOpen(false)}
                      className="text-zinc-500 hover:text-white text-xs font-bold cursor-pointer border border-white/5 bg-zinc-900/60 px-2 py-1 rounded"
                    >
                      ✕ Close
                    </button>
                  </div>

                  {/* Tabs: Summaries (Type A) vs Saved Notes (Type B) */}
                  <div className="flex border-b border-white/5">
                    <button
                      onClick={() => setActiveTab("ai")}
                      className={`flex-1 pb-2.5 text-xs font-bold transition-all ${activeTab === "ai" ? "text-brand-400 border-b-2 border-brand-500 font-black" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                      🤖 Screen Summaries
                    </button>
                    <button
                      onClick={() => setActiveTab("manual")}
                      className={`flex-1 pb-2.5 text-xs font-bold transition-all ${activeTab === "manual" ? "text-indigo-400 border-b-2 border-indigo-500 font-black" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                      ✍️ Saved Notes
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search note details or questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-3 pr-10 text-xs text-white placeholder-zinc-500 outline-none focus:border-brand-500 transition"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-2.5 text-zinc-500 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Dropdown Filters (Course, Phase, Step) */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Course Filter */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Course</label>
                      <select
                        value={courseFilter}
                        onChange={(e) => handleCourseChange(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-[10px] text-white outline-none"
                      >
                        <option value="all">All</option>
                        {Object.keys(auditData).sort((a,b) => parseInt(a) - parseInt(b)).map(c => (
                          <option key={c} value={c}>C{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Phase Filter */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Phase</label>
                      <select
                        value={phaseFilter}
                        onChange={(e) => handlePhaseChange(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-[10px] text-white outline-none"
                        disabled={courseFilter === "all"}
                      >
                        <option value="all">All</option>
                        {courseFilter !== "all" && auditData[courseFilter] &&
                          Object.keys(auditData[courseFilter]).sort((a,b) => parseInt(a) - parseInt(b)).map(p => (
                            <option key={p} value={p}>P{p}</option>
                          ))
                        }
                      </select>
                    </div>

                    {/* Step Filter */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Step</label>
                      <select
                        value={stepFilter}
                        onChange={(e) => setStepFilter(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-[10px] text-white outline-none"
                        disabled={courseFilter === "all" || phaseFilter === "all"}
                      >
                        <option value="all">All</option>
                        {courseFilter !== "all" && phaseFilter !== "all" && auditData[courseFilter]?.[phaseFilter]?.steps &&
                          Object.keys(auditData[courseFilter][phaseFilter].steps).sort((a,b) => parseInt(a) - parseInt(b)).map(s => (
                            <option key={s} value={s}>S{s}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  {/* Current tag indicator */}
                  {(() => {
                    const loc = getActiveLocation();
                    return (
                      <div className="p-3 bg-brand-500/5 border border-brand-500/10 rounded-xl text-left text-xs space-y-3">
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Current Tagged Location</span>
                          <div className="font-extrabold text-white flex items-center justify-between">
                            <span>
                              Course {loc.courseId} · Phase {loc.phaseNum} · Step {loc.step}
                            </span>
                            <span className="text-[9px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded border border-brand-500/20 font-mono">
                              Auto-tagged
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            if (generatingAiNote) return;
                            setGeneratingAiNote(true);
                            try {
                              const res = await apiRequest("/notes/generate-ai-summary", {
                                method: "POST",
                                body: JSON.stringify({
                                  course_id: loc.courseId,
                                  phase_num: loc.phaseNum,
                                  step: loc.step,
                                  question: "Active Study Slide",
                                  selected_answer: "Interactive Study Materials",
                                  correct_answer: "Verified Korean Curriculum",
                                  is_correct: true,
                                  explanation: `The student requested an AI summary of this Korean lesson slide. Focus on key grammar particles, vowels, consonants, vocabulary examples, and conversational nuances covered in this phase.`
                                })
                              });
                              setNotes(prev => [res, ...prev]);
                              setWarningPopup({ show: true, message: "✨ Note generated and saved to your Diary successfully!" });
                            } catch (err) {
                              console.error("Failed to generate AI note summary:", err);
                            } finally {
                              setGeneratingAiNote(false);
                            }
                          }}
                          disabled={generatingAiNote}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 animate-pulse">
                            <path d="m12 3-1.912 5.886L4.202 9.075 9.07 13.56 7.158 19.44 12 15.83l4.842 3.61-1.911-5.88 4.867-4.485-5.886-.189z" />
                          </svg>
                          <span>{generatingAiNote ? "Summarizing..." : "AI Summarize Current Screen"}</span>
                        </button>
                      </div>
                    );
                  })()}

                  {/* Write manual note */}
                  <div className="space-y-2 text-left">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold">Write New Note</span>
                    <textarea
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Type your study notes, vocabulary references, or remarks here..."
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-brand-500 transition h-24 resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveManualNote}
                        disabled={savingNote || !newNoteText.trim()}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                      >
                        {savingNote ? "Saving..." : "Save Note"}
                      </button>
                    </div>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-3 text-left">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold block">Diary Entries ({filteredNotes.length})</span>
                    <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                      {filteredNotes.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500 text-xs font-medium">
                          No diary entries match the filters.
                        </div>
                      ) : (
                        filteredNotes.map((note) => {
                          let displayContent = note.content;
                          let parsedJson: any = null;
                          if (!note.is_ai) {
                            try {
                              parsedJson = JSON.parse(note.content);
                            } catch (e) {
                              // Legacy manual note
                            }
                          }

                          return (
                            <div key={note.id} className="p-4 bg-zinc-900/60 rounded-2xl border border-white/5 space-y-2.5 relative group">
                              <div className="flex justify-between items-start gap-2">
                                <button
                                  onClick={() => navigateToLocation(note.course_id, note.phase_num, note.step)}
                                  className="text-[9px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 px-2.5 py-0.5 rounded-full font-mono transition cursor-pointer font-bold"
                                  title="Click to Teleport back to this Screen"
                                >
                                  📍 Course {note.course_id} · Phase {note.phase_num} · Step {note.step}
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-white/5 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                                  title="Delete Note"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                              
                              {parsedJson ? (
                                <div className="space-y-2 text-xs">
                                  {parsedJson.userNote && (
                                    <p className="text-zinc-100 font-bold italic leading-relaxed whitespace-pre-wrap bg-zinc-950/40 p-2.5 rounded-xl border border-white/[0.02]">
                                      "{parsedJson.userNote}"
                                    </p>
                                  )}
                                  <details className="text-[11px] text-zinc-400 bg-zinc-955/80 p-3 rounded-xl border border-white/5 cursor-pointer select-none">
                                    <summary className="font-extrabold text-[9px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300">
                                      {parsedJson.contentType === "theory" ? "📖 Reference Concept details" : "❓ Reference Question details"}
                                    </summary>
                                    <div className="mt-3.5 space-y-2 text-zinc-400 select-text cursor-auto border-t border-white/5 pt-3">
                                      <p><strong>Content:</strong> {parsedJson.originalContent.question}</p>
                                      {parsedJson.contentType === "question" && (
                                        <>
                                          <p className={parsedJson.originalContent.is_correct ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                                            <strong>Status:</strong> {parsedJson.originalContent.is_correct ? "Correct Answer" : "Incorrect Answer"}
                                          </p>
                                          <p><strong>Your Answer:</strong> {parsedJson.originalContent.selected_answer}</p>
                                          <p><strong>Expected:</strong> {parsedJson.originalContent.correct_answer}</p>
                                        </>
                                      )}
                                      {parsedJson.originalContent.explanation && (
                                        <p><strong>Explanation:</strong> {parsedJson.originalContent.explanation}</p>
                                      )}
                                    </div>
                                  </details>
                                </div>
                              ) : (
                                <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                                  {displayContent}
                                </p>
                              )}
                              
                              <div className="flex justify-between items-center text-[8px] text-zinc-500 font-mono">
                                <span>{note.is_ai ? "🤖 AI Generated Summary" : "✍️ Student Note"}</span>
                                <span>{new Date(note.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
        
        {/* Mobile Navigation bar at the bottom */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-white/5 px-6 py-2.5 flex justify-around items-center z-50">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center space-y-1 ${
                  active ? `${item.colorClass.split(" ")[0]} font-black scale-105 transition` : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
