"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, ArrowLeft, BookOpen, Compass, Trophy, User, Calendar, GraduationCap, Heart, CheckCircle2, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function OnboardingPage() {
  // Step tracker
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [generatingName, setGeneratingName] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Questionnaire form states
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("English");
  
  const [studyReason, setStudyReason] = useState("K-Pop & K-Dramas (Korean Wave)");
  const [occupation, setOccupation] = useState("Student");
  const [cultureExperience, setCultureExperience] = useState("Deeply immersed (Watch dramas & eat Korean food daily)");
  const [proficiency, setProficiency] = useState("Absolute Beginner (Don't know Hangul)");
  
  const [koreanName, setKoreanName] = useState("");
  const [aiNamePronunciation, setAiNamePronunciation] = useState("");
  const [aiNameMeaning, setAiNameMeaning] = useState("");

  // Helpers
  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return 0;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleGenerateKoreanName = async () => {
    if (!name.trim()) {
      alert("Please enter your English name on Step 1 first!");
      return;
    }
    setGeneratingName(true);
    setError(null);
    try {
      const res = await apiRequest("/progress/profile/generate-korean-name", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          dob,
          study_reason: studyReason,
          occupation,
          korean_culture_experience: cultureExperience,
          korean_proficiency: proficiency,
        })
      });
      setKoreanName(res.korean_name);
      setAiNamePronunciation(res.pronunciation);
      setAiNameMeaning(res.meaning);
    } catch (err) {
      console.error("AI Naming failed:", err);
      // Fallback
      setKoreanName("슬기");
      setAiNamePronunciation("Seul-gi");
      setAiNameMeaning("Meaning 'wisdom' in pure native Korean. Generated as a perfect fit for a diligent learner starting their journey!");
    } finally {
      setGeneratingName(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1 && !name.trim()) {
      setError("Please fill out your name to proceed.");
      return;
    }
    if (step === 1 && !dob) {
      setError("Please select your date of birth.");
      return;
    }
    setError(null);
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Map starting experience level to level_progress sequence offset
    let levelProgress = 1;
    if (proficiency.includes("Upper Beginner")) {
      levelProgress = 3;
    } else if (proficiency.includes("Intermediate")) {
      levelProgress = 5;
    } else if (proficiency.includes("Advanced")) {
      levelProgress = 7;
    }

    try {
      await apiRequest("/progress/profile", {
        method: "PATCH",
        body: JSON.stringify({
          display_name: name.trim(),
          native_language: nativeLanguage,
          level_progress: levelProgress,
          dob,
          study_reason: studyReason,
          occupation,
          korean_culture_experience: cultureExperience,
          korean_proficiency: proficiency,
          korean_name: koreanName.trim() || "슬기",
        }),
      });

      // Redirect to dashboard upon successful profile completion
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Onboarding submission failed:", err);
      setError((err as Error).message || "Failed to save profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#06060c] text-foreground px-4 font-sans relative overflow-hidden">
      
      {/* Background radial highlights representing traditional Obangsaek colors */}
      <div className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[500px] h-[500px] bg-accent-pink/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl glass-panel neon-border p-8 md:p-10 rounded-3xl shadow-2xl relative z-10">
        
        {/* Onboarding Header */}
        <header className="mb-8 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 bg-brand-500/10 text-brand-400 font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-brand-500/20 mb-3">
            <span>Step {step} of 4</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center justify-center md:justify-start gap-2 mb-2">
            <span>Configure Your Pathway</span>
            <Sparkles className="w-5 h-5 text-brand-400 animate-pulse" />
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed font-korean">
            Let's customize **진짜 AI** to match your starting goals and background!
          </p>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-accent-pink/10 border border-accent-pink/20 text-accent-pink text-xs font-mono">
            {error}
          </div>
        )}

        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-brand-400" />
                <span>Your Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-base placeholder-zinc-600 focus:outline-none focus:border-brand-500/50 transition font-sans text-white font-medium"
                required
              />
            </div>

            {/* Date of Birth Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-accent-pink" />
                <span>Date of Birth</span>
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-brand-500/50 transition font-sans text-white font-medium cursor-pointer"
                required
              />
            </div>

            {/* Native Language Selector */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5 text-accent-teal" />
                <span>Native Language</span>
              </label>
              <select
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-brand-500/50 transition font-sans cursor-pointer text-foreground"
              >
                <option value="English">English</option>
                <option value="Spanish">Español (Spanish)</option>
                <option value="French">Français (French)</option>
                <option value="Japanese">日本語 (Japanese)</option>
                <option value="Chinese">中文 (Chinese)</option>
                <option value="Hindi">हिन्दी (Hindi)</option>
                <option value="German">Deutsch (German)</option>
              </select>
            </div>

            <button
              onClick={handleNextStep}
              className="w-full mt-4 bg-brand-500 hover:bg-brand-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-98"
            >
              <span>Continue to Goals</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Goals & Experience */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            {/* Why study Korean */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <Heart className="w-3.5 h-3.5 text-accent-pink" />
                <span>Why do you want to study Korean?</span>
              </label>
              <select
                value={studyReason}
                onChange={(e) => setStudyReason(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-brand-500/50 transition font-sans cursor-pointer text-foreground"
              >
                <option value="K-Pop & K-Dramas (Korean Wave)">K-Pop & K-Dramas (Korean Wave)</option>
                <option value="Travel or tourism in South Korea">Travel or tourism in South Korea</option>
                <option value="Career & job opportunities">Career & job opportunities</option>
                <option value="Academic research or linguistic curiosity">Academic research or linguistic curiosity</option>
                <option value="Connecting with Korean family or partner">Connecting with Korean family or partner</option>
                <option value="General self-improvement">General self-improvement</option>
              </select>
            </div>

            {/* Current Occupation */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-brand-400" />
                <span>What do you currently do?</span>
              </label>
              <select
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-brand-500/50 transition font-sans cursor-pointer text-foreground"
              >
                <option value="Student">Student</option>
                <option value="Software Engineer">Software Engineer</option>
                <option value="Designer / Artist">Designer / Artist</option>
                <option value="Educator / Teacher">Educator / Teacher</option>
                <option value="Healthcare Professional">Healthcare Professional</option>
                <option value="Business Executive / Entrepreneur">Business Executive / Entrepreneur</option>
                <option value="Other Professional">Other Professional</option>
              </select>
            </div>

            {/* Korean Culture Experience */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-accent-teal" />
                <span>Experience of Korean culture?</span>
              </label>
              <select
                value={cultureExperience}
                onChange={(e) => setCultureExperience(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-brand-500/50 transition font-sans cursor-pointer text-foreground"
              >
                <option value="Deeply immersed (Watch dramas & eat Korean food daily)">Deeply immersed (Watch dramas & eat Korean food daily)</option>
                <option value="Moderate (Listen to K-Pop occasionally)">Moderate (Listen to K-Pop occasionally)</option>
                <option value="Basic (Familiar with mainstream culture pieces)">Basic (Familiar with mainstream culture pieces)</option>
                <option value="None (Completely new to it)">None (Completely new to it)</option>
              </select>
            </div>

            {/* Korean Proficiency */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5 text-brand-gold" />
                <span>Proficiency in Korean?</span>
              </label>
              <select
                value={proficiency}
                onChange={(e) => setProficiency(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-brand-500/50 transition font-sans cursor-pointer text-foreground"
              >
                <option value="Absolute Beginner (Don't know Hangul)">Absolute Beginner (Don't know Hangul)</option>
                <option value="Upper Beginner (Know Hangul, basic phrases)">Upper Beginner (Know Hangul, basic phrases)</option>
                <option value="Intermediate (Can hold simple conversation)">Intermediate (Can hold simple conversation)</option>
                <option value="Advanced (Can read newspapers & talk fluently)">Advanced (Can read newspapers & talk fluently)</option>
              </select>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={handlePrevStep}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-white/5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={handleNextStep}
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Identity & Korean Name Selection / AI Generation */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold animate-bounce" />
                <span>Your Korean Name (한국 이름)</span>
              </label>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  value={koreanName}
                  onChange={(e) => setKoreanName(e.target.value)}
                  placeholder="e.g. 슬기 or click generate"
                  className="flex-grow bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-brand-500/50 transition font-korean text-white font-extrabold"
                />
                
                <button
                  type="button"
                  onClick={handleGenerateKoreanName}
                  disabled={generatingName}
                  className="bg-zinc-950/80 hover:bg-brand-500/10 border border-white/10 hover:border-brand-500/30 text-brand-gold font-extrabold px-4 py-3 rounded-xl transition duration-150 flex items-center gap-2 flex-shrink-0 cursor-pointer shadow"
                >
                  {generatingName ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-brand-gold" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-brand-gold" />
                  )}
                  <span>Generate with AI</span>
                </button>
              </div>
            </div>

            {/* Display generated AI description card */}
            {aiNamePronunciation && (
              <div className="p-5 bg-brand-gold/5 rounded-2xl border border-brand-gold/25 space-y-2.5 animate-fade-in shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-white font-korean">{koreanName}</span>
                    <span className="text-xs text-zinc-400 italic">({aiNamePronunciation})</span>
                  </div>
                  <span className="text-[9px] bg-brand-gold/15 text-brand-gold font-extrabold uppercase px-2 py-0.5 rounded border border-brand-gold/30 font-mono tracking-wider animate-pulse">Llama 3.3 Active</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-korean whitespace-pre-line">{aiNameMeaning}</p>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <button
                onClick={handlePrevStep}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-white/5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={handleNextStep}
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
              >
                <span>Preview Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Celebration summary */}
        {step === 4 && (
          <form onSubmit={handleSubmitOnboarding} className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2 mb-6">
              <div className="w-fit mx-auto p-3 bg-brand-500/10 text-brand-400 rounded-full border border-brand-500/20 shadow-md">
                <CheckCircle2 className="w-8 h-8 animate-bounce-slow" />
              </div>
              <h2 className="text-2xl font-black text-white">Your Pathway is Locked! 🚀</h2>
              <p className="text-xs text-zinc-400">Review your customized study parameters below</p>
            </div>

            {/* Summary Details Cards */}
            <div className="bg-zinc-950/60 p-5 rounded-2xl border border-white/5 space-y-4 shadow-inner text-sm font-korean">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold">Display Name</span>
                  <span className="block font-extrabold text-white">{name}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold">Calculated Age</span>
                  <span className="block font-extrabold text-white">{calculateAge(dob)} Years old</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold">Current Occupation</span>
                  <span className="block font-extrabold text-white">{occupation}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold">Proficiency Level</span>
                  <span className="block font-extrabold text-brand-300">{proficiency.split(" (")[0]}</span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3.5 flex items-center justify-between bg-brand-gold/5 -mx-5 -mb-5 p-5 rounded-b-2xl border-b border-brand-gold/10">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-brand-gold uppercase tracking-wider font-extrabold">Your Korean Identity</span>
                  <span className="block text-lg font-black text-white font-korean">{koreanName || "슬기"}</span>
                </div>
                <div className="flex items-center gap-4 text-center">
                  <div className="space-y-0.5">
                    <span className="block text-[10px] text-zinc-500 font-extrabold font-mono">Streak</span>
                    <span className="block text-base font-black text-zinc-300 font-mono">0 Days</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-[10px] text-zinc-500 font-extrabold font-mono">Total XP</span>
                    <span className="block text-base font-black text-zinc-300 font-mono">0 XP</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-white/5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Adjust</span>
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white py-3.5 rounded-xl font-black flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-brand-500/10 active:scale-98"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirm & Launch</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
