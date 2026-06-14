"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, Languages, Mail, Lock, User as UserIcon, Globe } from "lucide-react";
import { apiRequest } from "../../lib/api";

declare global {
  interface Window {
    google: any;
  }
}

export default function UnifiedAuthLandingPage() {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  
  // Credentials Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("English");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load Google Identity Services script
    const existingScript = document.getElementById("google-gsi-script");
    if (existingScript) {
      initGoogleGSI();
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initGoogleGSI();
    };
    document.body.appendChild(script);
  }, [activeTab]); // Re-init on tab changes to bind to the active tab's button container

  const initGoogleGSI = () => {
    if (window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "523932271425-0m4bk0528jml3lu278tmk9cmfia6uvm6.apps.googleusercontent.com",
          callback: handleGoogleCredentialResponse,
        });
        
        // Render button in whichever tab is active
        const parentId = activeTab === "signin" ? "googleBtnParentSignin" : "googleBtnParentSignup";
        const parent = document.getElementById(parentId);
        if (parent) {
          parent.innerHTML = ""; // Clear old rendering
          window.google.accounts.id.renderButton(parent, {
            theme: "filled_blue",
            size: "large",
            width: "340",
            shape: "pill",
          });
        }
      } catch (err) {
        console.error("GSI Init error:", err);
      }
    }
  };

  // Re-run GSI binding with a small delay to ensure elements are mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      initGoogleGSI();
    }, 400);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleGoogleCredentialResponse = async (response: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest("/auth/google", {
        method: "POST",
        body: JSON.stringify({ id_token: response.credential }),
      });

      localStorage.setItem("token", data.access_token);

      if (data.is_new_signup) {
        window.location.href = "/onboarding";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("Google Auth failed:", err);
      setError((err as Error).message || "Google authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === "signup") {
        // 1. Register User
        await apiRequest("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
            display_name: displayName || email.split("@")[0],
            native_language: nativeLanguage,
          }),
        });

        // 2. Automatically Login after registration
        const loginData = await apiRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        localStorage.setItem("token", loginData.access_token);
        window.location.href = "/onboarding"; // Force survey onboarding for new signups
      } else {
        // Login User
        const data = await apiRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        localStorage.setItem("token", data.access_token);
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("Credentials Authentication failed:", err);
      setError((err as Error).message || "Authentication failed. Please verify your fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#090514] text-foreground px-4 py-8 font-sans relative overflow-hidden">
      
      {/* SVG wind-waving displacement filter */}
      {/* Inline styles for organic float keyframe animations */}
      <style jsx global>{`
        @keyframes float-slow {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(3deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-slower {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(18px) rotate(-4deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-medium {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-22px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float-slow {
          animation: float-slow 9s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 12s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 10s ease-in-out infinite;
        }
      `}</style>

      {/* Multiple glowing wind-waving floating Korean flags on the sides of the viewport */}
      
      {/* Top Left Flag */}
      <div className="absolute top-[10%] left-[4%] w-24 h-16 md:w-32 md:h-22 opacity-[0.22] pointer-events-none z-0 animate-float-slow">
        <svg viewBox="0 0 300 200" className="w-full h-full" style={{ filter: "url(#wind-waving)" }}>
          <rect x="2" y="2" width="296" height="196" rx="10" fill="none" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2.5" />
          <g transform="translate(150, 100)">
            <path d="M 0,-40 A 40,40 0 0,1 0,40 A 20,20 0 0,1 0,0 A 20,20 0 0,0 0,-40" fill="#ec4899" />
            <path d="M 0,40 A 40,40 0 0,1 0,-40 A 20,20 0 0,0 0,0 A 20,20 0 0,1 0,40" fill="#06b6d4" />
          </g>
          <g transform="translate(60, 45) rotate(33.7)" fill="rgba(168, 85, 247, 0.5)"><rect x="-15" y="-12" width="30" height="4" rx="1.5" /><rect x="-15" y="-4" width="30" height="4" rx="1.5" /><rect x="-15" y="4" width="30" height="4" rx="1.5" /></g>
          <g transform="translate(240, 155) rotate(33.7)" fill="rgba(168, 85, 247, 0.5)"><rect x="-15" y="-12" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="-12" width="13.5" height="4" rx="1.5" /><rect x="-15" y="-4" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="-4" width="13.5" height="4" rx="1.5" /><rect x="-15" y="4" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="4" width="13.5" height="4" rx="1.5" /></g>
          <g transform="translate(240, 45) rotate(-33.7)" fill="rgba(168, 85, 247, 0.5)"><rect x="-15" y="-12" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="-12" width="13.5" height="4" rx="1.5" /><rect x="-15" y="-4" width="30" height="4" rx="1.5" /><rect x="-15" y="4" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="4" width="13.5" height="4" rx="1.5" /></g>
          <g transform="translate(60, 155) rotate(-33.7)" fill="rgba(168, 85, 247, 0.5)"><rect x="-15" y="-12" width="30" height="4" rx="1.5" /><rect x="-15" y="-4" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="-4" width="13.5" height="4" rx="1.5" /><rect x="-15" y="4" width="30" height="4" rx="1.5" /></g>
        </svg>
      </div>

      {/* Bottom Left Flag */}
      <div className="absolute bottom-[12%] left-[3%] w-20 h-14 md:w-28 md:h-20 opacity-[0.16] pointer-events-none z-0 animate-float-medium">
        <svg viewBox="0 0 300 200" className="w-full h-full" style={{ filter: "url(#wind-waving)" }}>
          <rect x="2" y="2" width="296" height="196" rx="10" fill="none" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2.5" />
          <g transform="translate(150, 100)">
            <path d="M 0,-40 A 40,40 0 0,1 0,40 A 20,20 0 0,1 0,0 A 20,20 0 0,0 0,-40" fill="#ec4899" />
            <path d="M 0,40 A 40,40 0 0,1 0,-40 A 20,20 0 0,0 0,0 A 20,20 0 0,1 0,40" fill="#06b6d4" />
          </g>
          <g transform="translate(60, 45) rotate(33.7)" fill="rgba(168, 85, 247, 0.5)"><rect x="-15" y="-12" width="30" height="4" rx="1.5" /><rect x="-15" y="-4" width="30" height="4" rx="1.5" /><rect x="-15" y="4" width="30" height="4" rx="1.5" /></g>
          <g transform="translate(240, 155) rotate(33.7)" fill="rgba(168, 85, 247, 0.5)"><rect x="-15" y="-12" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="-12" width="13.5" height="4" rx="1.5" /><rect x="-15" y="-4" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="-4" width="13.5" height="4" rx="1.5" /><rect x="-15" y="4" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="4" width="13.5" height="4" rx="1.5" /></g>
          <g transform="translate(240, 45) rotate(-33.7)" fill="rgba(168, 85, 247, 0.5)"><rect x="-15" y="-12" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="-12" width="13.5" height="4" rx="1.5" /><rect x="-15" y="-4" width="30" height="4" rx="1.5" /><rect x="-15" y="4" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="4" width="13.5" height="4" rx="1.5" /></g>
          <g transform="translate(60, 155) rotate(-33.7)" fill="rgba(168, 85, 247, 0.5)"><rect x="-15" y="-12" width="30" height="4" rx="1.5" /><rect x="-15" y="-4" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="-4" width="13.5" height="4" rx="1.5" /><rect x="-15" y="4" width="30" height="4" rx="1.5" /></g>
        </svg>
      </div>

      {/* Top Right Flag */}
      <div className="absolute top-[14%] right-[5%] w-24 h-16 md:w-32 md:h-22 opacity-[0.20] pointer-events-none z-0 animate-float-slower">
        <svg viewBox="0 0 300 200" className="w-full h-full" style={{ filter: "url(#wind-waving)" }}>
          <rect x="2" y="2" width="296" height="196" rx="10" fill="none" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2.5" />
          <g transform="translate(150, 100)">
            <path d="M 0,-40 A 40,40 0 0,1 0,40 A 20,20 0 0,1 0,0 A 20,20 0 0,0 0,-40" fill="#ec4899" />
            <path d="M 0,40 A 40,40 0 0,1 0,-40 A 20,20 0 0,0 0,0 A 20,20 0 0,1 0,40" fill="#06b6d4" />
          </g>
          <g transform="translate(60, 45) rotate(33.7)" fill="rgba(168, 85, 247, 0.5)"><rect x="-15" y="-12" width="30" height="4" rx="1.5" /><rect x="-15" y="-4" width="30" height="4" rx="1.5" /><rect x="-15" y="4" width="30" height="4" rx="1.5" /></g>
          <g transform="translate(240, 155) rotate(33.7)" fill="rgba(168, 85, 247, 0.5)"><rect x="-15" y="-12" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="-12" width="13.5" height="4" rx="1.5" /><rect x="-15" y="-4" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="-4" width="13.5" height="4" rx="1.5" /><rect x="-15" y="4" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="4" width="13.5" height="4" rx="1.5" /></g>
          <g transform="translate(240, 45) rotate(-33.7)" fill="rgba(168, 85, 247, 0.5)"><rect x="-15" y="-12" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="-12" width="13.5" height="4" rx="1.5" /><rect x="-15" y="-4" width="30" height="4" rx="1.5" /><rect x="-15" y="4" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="4" width="13.5" height="4" rx="1.5" /></g>
          <g transform="translate(60, 155) rotate(-33.7)" fill="rgba(168, 85, 247, 0.5)"><rect x="-15" y="-12" width="30" height="4" rx="1.5" /><rect x="-15" y="-4" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="-4" width="13.5" height="4" rx="1.5" /><rect x="-15" y="4" width="30" height="4" rx="1.5" /></g>
        </svg>
      </div>

      {/* Bottom Right Flag */}
      <div className="absolute bottom-[10%] right-[3%] w-20 h-14 md:w-28 md:h-20 opacity-[0.22] pointer-events-none z-0 animate-float-slow">
        <svg viewBox="0 0 300 200" className="w-full h-full" style={{ filter: "url(#wind-waving)" }}>
          <rect x="2" y="2" width="296" height="196" rx="10" fill="none" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2.5" />
          <g transform="translate(150, 100)">
            <path d="M 0,-40 A 40,40 0 0,1 0,40 A 20,20 0 0,1 0,0 A 20,20 0 0,0 0,-40" fill="#ec4899" />
            <path d="M 0,40 A 40,40 0 0,1 0,-40 A 20,20 0 0,0 0,0 A 20,20 0 0,1 0,40" fill="#06b6d4" />
          </g>
          <g transform="translate(60, 45) rotate(33.7)" fill="rgba(168, 85, 247, 0.5)"><rect x="-15" y="-12" width="30" height="4" rx="1.5" /><rect x="-15" y="-4" width="30" height="4" rx="1.5" /><rect x="-15" y="4" width="30" height="4" rx="1.5" /></g>
          <g transform="translate(240, 155) rotate(33.7)" fill="rgba(168, 85, 247, 0.5)"><rect x="-15" y="-12" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="-12" width="13.5" height="4" rx="1.5" /><rect x="-15" y="-4" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="-4" width="13.5" height="4" rx="1.5" /><rect x="-15" y="4" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="4" width="13.5" height="4" rx="1.5" /></g>
          <g transform="translate(240, 45) rotate(-33.7)" fill="rgba(168, 85, 247, 0.5)"><rect x="-15" y="-12" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="-12" width="13.5" height="4" rx="1.5" /><rect x="-15" y="-4" width="30" height="4" rx="1.5" /><rect x="-15" y="4" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="4" width="13.5" height="4" rx="1.5" /></g>
          <g transform="translate(60, 155) rotate(-33.7)" fill="rgba(168, 85, 247, 0.5)"><rect x="-15" y="-12" width="30" height="4" rx="1.5" /><rect x="-15" y="-4" width="13.5" height="4" rx="1.5" /><rect x="1.5" y="-4" width="13.5" height="4" rx="1.5" /><rect x="-15" y="4" width="30" height="4" rx="1.5" /></g>
        </svg>
      </div>

      {/* Floating low-opacity Korean cultural GIFs */}
      {/* BBQ GIF (Left Side, Upper-Middle) */}
      <div className="absolute top-[28%] left-[2%] w-24 h-24 md:w-32 md:h-32 opacity-[0.14] pointer-events-none z-0 animate-float-medium rounded-2xl overflow-hidden border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
        <img src="/kore-gifs/bbq.gif" alt="Korean BBQ" className="w-full h-full object-cover grayscale brightness-125" />
      </div>

      {/* Makeup GIF (Right Side, Upper-Middle) */}
      <div className="absolute top-[32%] right-[4%] w-24 h-24 md:w-32 md:h-32 opacity-[0.12] pointer-events-none z-0 animate-float-slow rounded-2xl overflow-hidden border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
        <img src="/kore-gifs/makeup.gif" alt="Korean Makeup" className="w-full h-full object-cover grayscale brightness-125" />
      </div>

      {/* WLGYT GIF (Left Side, Lower-Middle) */}
      <div className="absolute bottom-[28%] left-[3%] w-24 h-24 md:w-32 md:h-32 opacity-[0.13] pointer-events-none z-0 animate-float-slower rounded-2xl overflow-hidden border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
        <img src="/kore-gifs/wlgyt.gif" alt="Korean Culture" className="w-full h-full object-cover grayscale brightness-125" />
      </div>

      {/* BTS GIF (Right Side, Lower-Middle) */}
      <div className="absolute bottom-[24%] right-[2%] w-24 h-24 md:w-32 md:h-32 opacity-[0.15] pointer-events-none z-0 animate-float-medium rounded-2xl overflow-hidden border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
        <img src="/kore-gifs/bts.gif" alt="BTS" className="w-full h-full object-cover grayscale brightness-125" />
      </div>

      {/* Background neon blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-500/15 rounded-full blur-[130px] pointer-events-none animate-pulse-slow animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[130px] pointer-events-none animate-pulse-slow animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Main squarer centralized card container */}
      <div className="w-full max-w-4xl bg-zinc-950/40 border border-purple-500/20 p-6 md:p-10 rounded-[2.5rem] shadow-[0_0_50px_rgba(139,92,246,0.15)] relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[600px] backdrop-blur-3xl">
        
        {/* Left Branding Column */}
        <div className="flex flex-col items-center justify-between text-center p-6 md:p-8 bg-gradient-to-br from-purple-950/40 via-purple-900/10 to-pink-950/20 rounded-[2rem] border border-purple-500/15 h-full min-h-[460px] relative overflow-hidden shadow-inner">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4">
            {/* Logo with cyber glow */}
            <div className="flex items-center justify-center transition-all duration-300 hover:scale-105">
              <img 
                src="/LOGO.png" 
                className="w-36 h-36 md:w-40 md:h-40 rounded-[2rem] object-contain bg-zinc-900/80 p-4 border border-purple-500/30 shadow-2xl shadow-pink-500/20" 
                alt="진짜 AI Logo" 
              />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
                <span>진짜 AI</span>
                <Sparkles className="w-5 h-5 text-pink-400 animate-bounce" style={{ animationDuration: "3s" }} />
              </h1>
              <p className="text-purple-300/70 text-xs font-semibold uppercase tracking-wider">Your Bilingual Korean AI Buddy</p>
            </div>
          </div>

          {/* Key premium details */}
          <div className="space-y-3 text-left w-full max-w-xs pt-4 border-t border-purple-500/10">
            <div className="flex items-center gap-3 text-xs font-extrabold text-purple-200">
              <span className="p-1 rounded bg-pink-500/20 text-pink-400 text-[10px] font-black">✓</span>
              <span>Premium Neural TTS Voices</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-extrabold text-purple-200">
              <span className="p-1 rounded bg-purple-500/20 text-purple-400 text-[10px] font-black">✓</span>
              <span>Double-LLM Agentic RAG Curation</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-extrabold text-purple-200">
              <span className="p-1 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-black">✓</span>
              <span>Syllable-Level Speech Grading</span>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500 leading-normal max-w-xs mt-6 font-medium">
            Join thousands of active learners studying Hangeul naturally with adaptive textbooks generated by Gwan-Sik.
          </p>
        </div>

        {/* Right Form Column */}
        <div className="w-full flex flex-col justify-center space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">{activeTab === "signin" ? "Welcome Back!" : "Let's Get Started!"}</h2>
            <p className="text-xs text-purple-300/50 font-bold uppercase tracking-wider">Authentication Portal</p>
          </div>

          {/* Tab Controls */}
          <div className="grid w-full grid-cols-2 bg-purple-950/25 p-1 rounded-2xl border border-purple-500/20">
            <button
              onClick={() => { setActiveTab("signin"); setError(null); }}
              className={`py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                activeTab === "signin" 
                  ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30" 
                  : "text-purple-300 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab("signup"); setError(null); }}
              className={`py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                activeTab === "signup" 
                  ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30" 
                  : "text-purple-300 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Display Error Message */}
          {error && (
            <div className="w-full p-4 rounded-xl bg-pink-950/30 border border-pink-500/25 text-pink-400 text-[11px] leading-relaxed font-mono">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleCredentialsSubmit} className="w-full space-y-4">
            
            {activeTab === "signup" && (
              <>
                {/* Display Name Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-purple-300/60 uppercase tracking-wider">Display Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/50" />
                    <input
                      type="text"
                      required
                      placeholder="Gwan-Sik Fan"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-purple-950/15 border border-purple-500/25 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-purple-400/30 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
                    />
                  </div>
                </div>

                {/* Native Language Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-purple-300/60 uppercase tracking-wider">Native Language</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/50" />
                    <select
                      value={nativeLanguage}
                      onChange={(e) => setNativeLanguage(e.target.value)}
                      className="w-full bg-zinc-950 border border-purple-500/25 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-pink-500 transition appearance-none cursor-pointer"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Chinese">Chinese</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-purple-300/60 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/50" />
                <input
                  type="email"
                  required
                  placeholder="your.email@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-purple-950/15 border border-purple-500/25 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-purple-400/30 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-purple-300/60 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/50" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-purple-950/15 border border-purple-500/25 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-purple-400/30 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-xl shadow-pink-500/20 transition-all transform active:scale-95 duration-150 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>{activeTab === "signin" ? "Sign In to Dashboard" : "Create Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="w-full flex items-center gap-4 py-2">
            <div className="flex-1 h-[1px] bg-purple-500/10" />
            <span className="text-[9px] text-zinc-500 font-extrabold tracking-widest uppercase">Or Continue With</span>
            <div className="flex-1 h-[1px] bg-purple-500/10" />
          </div>

          {/* Google OAuth buttons */}
          <div className="w-full flex justify-center min-h-[50px]">
            {activeTab === "signin" ? (
              <div id="googleBtnParentSignin" className="transition transform hover:scale-[1.02] cursor-pointer" />
            ) : (
              <div id="googleBtnParentSignup" className="transition transform hover:scale-[1.02] cursor-pointer" />
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

