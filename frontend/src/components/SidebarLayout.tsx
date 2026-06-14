"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, BookOpen, MessageSquare, Headphones, Award, Home, User, LogOut, Library, Globe, Gamepad2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

import FloatingKeyboard from "./FloatingKeyboard";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);


  const [isCollapsed, setIsCollapsed] = useState(true);

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
    loadMetrics();
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  // Hide sidebar on landing page
  if (pathname === "/") {
    return <>{children}</>;
  }

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Lessons Path", href: "/lessons", icon: BookOpen },
    { name: "AI Tutor Chat", href: "/tutor", icon: MessageSquare },
    { name: "Games Arcade", href: "/games", icon: Gamepad2 },
    { name: "Materials", href: "/materials", icon: Library },
    { name: "Online Materials", href: "/online", icon: Globe },
    { name: "AI Benchmarks", href: "/benchmarks", icon: Award },
  ];

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
            <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-2 animate-fade-in">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Total XP</span>
                <span className="font-bold text-accent-teal">{xp}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Streak</span>
                <span className="font-bold text-accent-pink">🔥 {streak} Days</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="text-[10px] font-bold text-accent-teal" title={`Total XP: ${xp}`}>🏆 {xp}</div>
              <div className="text-[10px] font-bold text-accent-pink" title={`Streak: ${streak} Days`}>🔥 {streak}d</div>
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
                      ? "bg-brand-500/10 text-brand-300 border border-brand-500/20"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
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
                  active ? "text-brand-400" : "text-zinc-500"
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
