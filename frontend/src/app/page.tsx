"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  MessageSquare, 
  Award, 
  Play, 
  ChevronRight, 
  Languages, 
  Compass, 
  Activity, 
  ArrowUpRight,
  Shield,
  Volume2
} from "lucide-react";

export default function HomeLandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#070412] text-zinc-100 font-sans relative overflow-hidden selection:bg-purple-500/30 selection:text-white">
      
      {/* Global Custom Animation Styles */}
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(15px) rotate(-3deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }
        @keyframes wave-text {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 8s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 12s ease-in-out infinite;
        }
        .gradient-text-wave {
          background-size: 200% auto;
          animation: wave-text 6s linear infinite;
        }
      `}</style>

      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse-slow" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-[-10%] left-[15%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: "4s" }} />

      {/* Floating Abstract Elements for Playful/Dynamic Vibe */}
      <div className="absolute top-[20%] left-[8%] w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-purple-500/30 flex items-center justify-center opacity-60 animate-float-slow text-[10px] font-black text-purple-300">ㄱ</div>
      <div className="absolute top-[65%] left-[5%] w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center opacity-40 animate-float-medium text-xs font-black text-cyan-300 rotate-12">ㅏ</div>
      <div className="absolute top-[15%] right-[10%] w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-500/20 to-cyan-500/20 border border-pink-500/30 flex items-center justify-center opacity-50 animate-float-medium text-xs font-black text-pink-300 -rotate-12">ㅂ</div>
      <div className="absolute top-[80%] right-[8%] w-10 h-10 rounded-full bg-gradient-to-bl from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center opacity-60 animate-float-slow text-[10px] font-black text-purple-200">ㅎ</div>

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 w-full bg-[#070412]/80 backdrop-blur-xl border-b border-purple-500/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl blur opacity-40 group-hover:opacity-75 transition duration-500" />
              <img 
                src="/LOGO.png" 
                alt="애라.ai Logo" 
                className="relative w-10 h-10 rounded-xl object-contain bg-zinc-900 border border-purple-500/30 p-1"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-purple-200 to-pink-400 bg-clip-text text-transparent">애라.ai</span>
              <span className="text-[8px] text-purple-400/80 uppercase tracking-widest font-bold">Hangeul AI Tutor</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors duration-200">Curated Features</a>
            <a href="#methodology" className="hover:text-white transition-colors duration-200">Our Methodology</a>
            <a href="#tutor" className="hover:text-white transition-colors duration-200">Meet Gwan-Sik</a>
            <a href="#pricing" className="hover:text-white transition-colors duration-200">Start Free</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-xs font-extrabold text-purple-300 hover:text-white px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer"
            >
              Sign In
            </Link>
            <Link 
              href="/login" 
              className="text-xs font-black bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-pink-500/20 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 relative z-10">

        {/* HERO SECTION */}
        <section className="pt-16 pb-24 md:pt-24 md:pb-36 flex flex-col items-center text-center">
          
          {/* Sparkly Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-950/40 border border-purple-500/30 px-3.5 py-1.5 rounded-full text-xs font-black text-purple-300 tracking-wide mb-8 animate-bounce" style={{ animationDuration: "4s" }}>
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Smarter, Faster, Completely Custom Hangeul Curation</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight max-w-4xl leading-[1.1] mb-8">
            Learn Korean Naturally With Your Personal{" "}
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent gradient-text-wave">
              Bilingual AI Buddy
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-base md:text-lg text-zinc-400/80 font-medium max-w-2xl leading-relaxed mb-12">
            No massive boring textbook grids. 애라.ai combines double-LLM Agentic RAG textbook research with syllable-level speech recognition to build a dynamic course exclusively around you.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-5 items-center justify-center">
            <Link 
              href="/login" 
              className="group text-sm font-black bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white px-8 py-4 rounded-2xl shadow-xl shadow-pink-500/20 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Begin Your Custom Path</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <a 
              href="#features" 
              className="text-sm font-extrabold text-zinc-300 hover:text-white px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all flex items-center gap-2"
            >
              <span>Explore Features</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Mockup Dashboard Preview with soft glow */}
          <div className="mt-20 w-full max-w-5xl relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-3xl blur-2xl opacity-15 group-hover:opacity-25 transition duration-1000" />
            <div className="relative bg-zinc-950/60 border border-purple-500/20 rounded-3xl overflow-hidden p-3 backdrop-blur-2xl shadow-[0_0_50px_rgba(139,92,246,0.1)]">
              <div className="bg-[#0b071a] rounded-2xl border border-white/5 overflow-hidden">
                {/* Simulated Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-purple-500/10 bg-zinc-950/40">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500/60" />
                    <div className="w-3 h-3 rounded-full bg-purple-500/60" />
                    <div className="w-3 h-3 rounded-full bg-cyan-500/60" />
                  </div>
                  <span className="text-[10px] font-black text-purple-300/40 uppercase tracking-widest">HangeulAI Laboratory Client v1.2</span>
                  <div className="w-16" />
                </div>
                
                {/* Simulated Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 text-left">
                  {/* Left Box: Progress */}
                  <div className="bg-zinc-950/50 rounded-xl border border-purple-500/10 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400"><Activity className="w-4 h-4" /></div>
                      <div>
                        <h4 className="text-xs font-black text-white">Daily Milestones</h4>
                        <p className="text-[9px] text-zinc-500">Real-time study index</p>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" style={{ width: "75%" }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-purple-300/60 font-semibold">
                      <span>Course Completion</span>
                      <span>75%</span>
                    </div>
                  </div>

                  {/* Middle Box: Current Topic */}
                  <div className="bg-zinc-950/50 rounded-xl border border-purple-500/10 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400"><BookOpen className="w-4 h-4" /></div>
                      <div>
                        <h4 className="text-xs font-black text-white">Double-LLM Curation</h4>
                        <p className="text-[9px] text-zinc-500">Active Syllabus Research</p>
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 bg-zinc-900/60 p-2.5 rounded-lg border border-white/5 space-y-1">
                      <div className="text-cyan-400 font-bold">&gt; researching chapters...</div>
                      <div className="text-purple-400">&gt; querying groq/compound-mini</div>
                      <div className="text-pink-400">&gt; curated with Llama 3.3</div>
                    </div>
                  </div>

                  {/* Right Box: Speak & Grade */}
                  <div className="bg-zinc-950/50 rounded-xl border border-purple-500/10 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400"><MessageSquare className="w-4 h-4" /></div>
                      <div>
                        <h4 className="text-xs font-black text-white">Speak with Gwan-Sik</h4>
                        <p className="text-[9px] text-zinc-500">Pronunciation Feedback</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-zinc-900/40 p-2.5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-zinc-300">안녕하세요!</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">98% Grade</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </section>

        {/* CORE FEATURES SECTION */}
        <section id="features" className="py-24 border-t border-purple-500/10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-extrabold text-pink-400 uppercase tracking-widest mb-3">Engineered for Results</h2>
            <p className="text-3xl md:text-4xl font-black text-white">Four Pillars of Hangeul Curation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-white/[0.02] border border-purple-500/10 hover:border-pink-500/30 p-8 rounded-3xl transition-all duration-300 hover:translate-y-[-4px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-pink-500/10 transition-colors" />
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-6 border border-pink-500/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Double-LLM Agentic RAG</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                Our custom backend pulls direct context from your study materials and uses <code className="text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded font-mono text-xs">groq/compound-mini</code> to formulate an authentic course syllabus tailored to you.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-pink-400 font-extrabold">
                <span>Adaptive textbook mapping</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/[0.02] border border-purple-500/10 hover:border-purple-500/30 p-8 rounded-3xl transition-all duration-300 hover:translate-y-[-4px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 border border-purple-500/20">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Gwan-Sik, Your AI Buddy</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                Skip standard text prompts. Have immersive dialogue practice, speaking exercises, and pronunciation drills with Gwan-Sik, who answers with natural bilingual context and real-time support.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-purple-400 font-extrabold">
                <span>Intelligent speaking lab</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/[0.02] border border-purple-500/10 hover:border-cyan-500/30 p-8 rounded-3xl transition-all duration-300 hover:translate-y-[-4px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6 border border-cyan-500/20">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Neural TTS & Voice Analytics</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                Listen to perfect premium Korean speech with custom neural text-to-speech feedback. Practice reading and speaking while the engine tracks syllable grades to polish your pronunciation.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-extrabold">
                <span>Advanced syllable grading</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/[0.02] border border-purple-500/10 hover:border-purple-500/30 p-8 rounded-3xl transition-all duration-300 hover:translate-y-[-4px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-300 flex items-center justify-center mb-6 border border-purple-500/20">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Smart Learning Benchmarks</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                Stay updated with beautifully plotted graphs tracking your study sequences, vocabulary growth indexes, and total study duration metrics on a modern dashboard.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-purple-300 font-extrabold">
                <span>Detailed metric tracking</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>
        </section>

        {/* CALL TO ACTION SECTION */}
        <section className="py-20 mb-20 bg-gradient-to-br from-purple-950/30 via-purple-900/10 to-pink-950/20 rounded-[2.5rem] border border-purple-500/20 relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="max-w-2xl mx-auto px-6 relative z-10 space-y-6">
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">Ready to Master Hangeul with AI?</h2>
            <p className="text-sm md:text-base text-purple-200/70 font-medium">
              Join today and get access to custom curriculum generations, immersive audio feedback, and dynamic lessons curated purely by Gwan-Sik.
            </p>
            <div className="pt-4 flex justify-center">
              <Link 
                href="/login" 
                className="group text-sm font-black bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white px-8 py-4 rounded-2xl shadow-xl shadow-pink-500/20 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Create Your Account Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-purple-500/10 bg-[#04020a]/80 py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img 
              src="/LOGO.png" 
              className="w-8 h-8 rounded-lg object-contain bg-zinc-900 border border-purple-500/30 p-1" 
              alt="Logo" 
            />
            <span className="text-sm font-black text-white">애라.ai</span>
          </div>
          <p className="text-[10px] text-zinc-600 font-medium">
            &copy; 2026 애라.ai. All rights reserved. Powered by Groq Cloud APIs.
          </p>
        </div>
      </footer>

    </div>
  );
}
