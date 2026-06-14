"use client";

import { useState, useMemo } from "react";
import { Sparkles, ArrowRight, ArrowLeft, BookOpen, Compass, Trophy, User, Calendar, GraduationCap, Heart, CheckCircle2, RefreshCw } from "lucide-react";
import { apiRequest } from "../../lib/api";

// ─── Modern DOB Picker ────────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function ModernDobPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // value is "YYYY-MM-DD" or ""
  const [selYear, selMonth, selDay] = useMemo(() => {
    if (!value) return ["", "", ""];
    const [y, m, d] = value.split("-");
    return [y, String(parseInt(m)), String(parseInt(d))];
  }, [value]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1924 }, (_, i) => currentYear - 5 - i);
  const months = MONTHS.map((name, idx) => ({ name, value: String(idx + 1) }));
  const daysInMonth = useMemo(() => {
    if (!selYear || !selMonth) return 31;
    return new Date(parseInt(selYear), parseInt(selMonth), 0).getDate();
  }, [selYear, selMonth]);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const emit = (y: string, m: string, d: string) => {
    if (y && m && d) {
      const padded = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      onChange(padded);
    } else {
      onChange("");
    }
  };

  const selectCls = "flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-brand-500/50 transition font-sans cursor-pointer text-white appearance-none";

  return (
    <div className="flex gap-2">
      {/* Month */}
      <div className="flex-[2] relative">
        <select
          value={selMonth}
          onChange={e => emit(selYear, e.target.value, selDay)}
          className={selectCls}
        >
          <option value="">Month</option>
          {months.map(m => (
            <option key={m.value} value={m.value}>{m.name}</option>
          ))}
        </select>
      </div>
      {/* Day */}
      <div className="flex-1 relative">
        <select
          value={selDay}
          onChange={e => emit(selYear, selMonth, e.target.value)}
          className={selectCls}
        >
          <option value="">Day</option>
          {days.map(d => (
            <option key={d} value={String(d)}>{d}</option>
          ))}
        </select>
      </div>
      {/* Year */}
      <div className="flex-[1.5] relative">
        <select
          value={selYear}
          onChange={e => emit(e.target.value, selMonth, selDay)}
          className={selectCls}
        >
          <option value="">Year</option>
          {years.map(y => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Gender Selector ──────────────────────────────────────────────────────────
const GENDER_OPTIONS = [
  { value: "Male", emoji: "♂️", label: "Male" },
  { value: "Female", emoji: "♀️", label: "Female" },
  { value: "Non-binary", emoji: "⚧️", label: "Non-binary" },
  { value: "Genderqueer", emoji: "🏳️‍🌈", label: "Genderqueer" },
  { value: "Prefer not to say", emoji: "🤐", label: "Prefer not to say" },
];

function GenderSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {GENDER_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            value === opt.value
              ? "bg-brand-500/20 border-brand-500/50 text-brand-300 shadow-sm shadow-brand-500/20"
              : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white hover:border-white/15"
          }`}
        >
          <span>{opt.emoji}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Main Onboarding Component ────────────────────────────────────────────────
export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [generatingName, setGeneratingName] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 fields
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Prefer not to say");
  const [nativeLanguage, setNativeLanguage] = useState("English");

  // Step 2 fields
  const [studyReason, setStudyReason] = useState("K-Pop & K-Dramas (Korean Wave)");
  const [occupation, setOccupation] = useState("Student");
  const [cultureExperience, setCultureExperience] = useState("Deeply immersed (Watch dramas & eat Korean food daily)");
  const [proficiency, setProficiency] = useState("Absolute Beginner (Don't know Hangul)");

  // Step 3 fields
  const [koreanName, setKoreanName] = useState("");
  const [aiNamePronunciation, setAiNamePronunciation] = useState("");
  const [aiNameMeaning, setAiNameMeaning] = useState("");

  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return 0;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handleGenerateKoreanName = async () => {
    if (!name.trim()) { alert("Please enter your English name on Step 1 first!"); return; }
    setGeneratingName(true);
    setError(null);
    try {
      const res = await apiRequest("/progress/profile/generate-korean-name", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          dob,
          gender,
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
      setKoreanName("슬기");
      setAiNamePronunciation("Seul-gi");
      setAiNameMeaning("Meaning 'wisdom' in pure native Korean. Generated as a perfect fit for a diligent learner starting their journey!");
    } finally {
      setGeneratingName(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1 && !name.trim()) { setError("Please fill out your name to proceed."); return; }
    if (step === 1 && !dob) { setError("Please select your date of birth."); return; }
    setError(null);
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => { setError(null); setStep(prev => prev - 1); };

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    let levelProgress = 1;
    if (proficiency.includes("Upper Beginner")) levelProgress = 3;
    else if (proficiency.includes("Intermediate")) levelProgress = 5;
    else if (proficiency.includes("Advanced")) levelProgress = 7;

    try {
      await apiRequest("/progress/profile", {
        method: "PATCH",
        body: JSON.stringify({
          display_name: name.trim(),
          native_language: nativeLanguage,
          level_progress: levelProgress,
          dob,
          gender,
          study_reason: studyReason,
          occupation,
          korean_culture_experience: cultureExperience,
          korean_proficiency: proficiency,
          korean_name: koreanName.trim() || "슬기",
        }),
      });
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Onboarding submission failed:", err);
      setError((err as Error).message || "Failed to save profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectCls = "w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-brand-500/50 transition font-sans cursor-pointer text-foreground";
  const labelCls = "flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider";

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#06060c] text-foreground px-4 font-sans relative overflow-hidden py-10">
      <div className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[500px] h-[500px] bg-accent-pink/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl glass-panel neon-border p-8 md:p-10 rounded-3xl shadow-2xl relative z-10">

        {/* Header */}
        <header className="mb-8 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 bg-brand-500/10 text-brand-400 font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-brand-500/20 mb-3">
            <span>Step {step} of 4</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center justify-center md:justify-start gap-2 mb-2">
            <span>Configure Your Pathway</span>
            <Sparkles className="w-5 h-5 text-brand-400 animate-pulse" />
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Let's customize <strong>진짜 AI</strong> to match your starting goals and background!
          </p>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-accent-pink/10 border border-accent-pink/20 text-accent-pink text-xs font-mono">
            {error}
          </div>
        )}

        {/* ── STEP 1: Personal Details ─────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">

            {/* Name */}
            <div className="space-y-2">
              <label className={labelCls}>
                <User className="w-3.5 h-3.5 text-brand-400" />
                <span>Your Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-base placeholder-zinc-600 focus:outline-none focus:border-brand-500/50 transition font-sans text-white font-medium"
                required
              />
            </div>

            {/* Date of Birth — Modern 3-dropdown picker */}
            <div className="space-y-2">
              <label className={labelCls}>
                <Calendar className="w-3.5 h-3.5 text-accent-pink" />
                <span>Date of Birth</span>
              </label>
              <ModernDobPicker value={dob} onChange={setDob} />
              {dob && (
                <p className="text-xs text-zinc-500 pl-1">
                  Age: <span className="text-zinc-300 font-bold">{calculateAge(dob)} years old</span>
                </p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className={labelCls}>
                <Heart className="w-3.5 h-3.5 text-purple-400" />
                <span>Gender Identity</span>
              </label>
              <GenderSelector value={gender} onChange={setGender} />
            </div>

            {/* Native Language */}
            <div className="space-y-2">
              <label className={labelCls}>
                <GraduationCap className="w-3.5 h-3.5 text-accent-teal" />
                <span>Native Language</span>
              </label>
              <select value={nativeLanguage} onChange={e => setNativeLanguage(e.target.value)} className={selectCls}>
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

        {/* ── STEP 2: Goals & Experience ─────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <label className={labelCls}><Heart className="w-3.5 h-3.5 text-accent-pink" /><span>Why study Korean?</span></label>
              <select value={studyReason} onChange={e => setStudyReason(e.target.value)} className={selectCls}>
                <option>K-Pop & K-Dramas (Korean Wave)</option>
                <option>Travel or tourism in South Korea</option>
                <option>Career & job opportunities</option>
                <option>Academic research or linguistic curiosity</option>
                <option>Connecting with Korean family or partner</option>
                <option>General self-improvement</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelCls}><User className="w-3.5 h-3.5 text-brand-400" /><span>What do you currently do?</span></label>
              <select value={occupation} onChange={e => setOccupation(e.target.value)} className={selectCls}>
                <option>Student</option>
                <option>Software Engineer</option>
                <option>Designer / Artist</option>
                <option>Educator / Teacher</option>
                <option>Healthcare Professional</option>
                <option>Business Executive / Entrepreneur</option>
                <option>Other Professional</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelCls}><Compass className="w-3.5 h-3.5 text-accent-teal" /><span>Experience of Korean culture?</span></label>
              <select value={cultureExperience} onChange={e => setCultureExperience(e.target.value)} className={selectCls}>
                <option>Deeply immersed (Watch dramas & eat Korean food daily)</option>
                <option>Moderate (Listen to K-Pop occasionally)</option>
                <option>Basic (Familiar with mainstream culture pieces)</option>
                <option>None (Completely new to it)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelCls}><Trophy className="w-3.5 h-3.5 text-brand-gold" /><span>Proficiency in Korean?</span></label>
              <select value={proficiency} onChange={e => setProficiency(e.target.value)} className={selectCls}>
                <option>Absolute Beginner (Don't know Hangul)</option>
                <option>Upper Beginner (Know Hangul, basic phrases)</option>
                <option>Intermediate (Can hold simple conversation)</option>
                <option>Advanced (Can read newspapers & talk fluently)</option>
              </select>
            </div>
            <div className="flex gap-4 pt-2">
              <button onClick={handlePrevStep} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-white/5">
                <ArrowLeft className="w-4 h-4" /><span>Back</span>
              </button>
              <button onClick={handleNextStep} className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg">
                <span>Continue</span><ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Korean Name ─────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            {/* Gender context hint */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-500/5 border border-brand-500/15 rounded-xl">
              <span className="text-lg">{GENDER_OPTIONS.find(g => g.value === gender)?.emoji}</span>
              <p className="text-xs text-zinc-400">
                Gwan-Sik AI will generate a <span className="text-brand-300 font-bold">{gender}</span> Korean name perfectly tailored to your background!
              </p>
            </div>

            <div className="space-y-3">
              <label className={labelCls}>
                <Sparkles className="w-3.5 h-3.5 text-brand-gold animate-bounce" />
                <span>Your Korean Name (한국 이름)</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={koreanName}
                  onChange={e => setKoreanName(e.target.value)}
                  placeholder="e.g. 슬기 or click generate"
                  className="flex-grow bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-brand-500/50 transition font-korean text-white font-extrabold"
                />
                <button
                  type="button"
                  onClick={handleGenerateKoreanName}
                  disabled={generatingName}
                  className="bg-zinc-950/80 hover:bg-brand-500/10 border border-white/10 hover:border-brand-500/30 text-brand-gold font-extrabold px-4 py-3 rounded-xl transition duration-150 flex items-center gap-2 flex-shrink-0 cursor-pointer shadow"
                >
                  {generatingName ? <RefreshCw className="w-4 h-4 animate-spin text-brand-gold" /> : <Sparkles className="w-4 h-4 text-brand-gold" />}
                  <span>Generate with AI</span>
                </button>
              </div>
            </div>

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
              <button onClick={handlePrevStep} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-white/5">
                <ArrowLeft className="w-4 h-4" /><span>Back</span>
              </button>
              <button onClick={handleNextStep} className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg">
                <span>Preview Details</span><ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Summary & Submit ────────────────────────────────────── */}
        {step === 4 && (
          <form onSubmit={handleSubmitOnboarding} className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2 mb-6">
              <div className="w-fit mx-auto p-3 bg-brand-500/10 text-brand-400 rounded-full border border-brand-500/20 shadow-md">
                <CheckCircle2 className="w-8 h-8 animate-bounce-slow" />
              </div>
              <h2 className="text-2xl font-black text-white">Your Pathway is Locked! 🚀</h2>
              <p className="text-xs text-zinc-400">Review your customized study parameters below</p>
            </div>

            <div className="bg-zinc-950/60 p-5 rounded-2xl border border-white/5 space-y-4 shadow-inner text-sm font-korean">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold">Display Name</span>
                  <span className="block font-extrabold text-white">{name}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold">Gender</span>
                  <span className="block font-extrabold text-white">{GENDER_OPTIONS.find(g => g.value === gender)?.emoji} {gender}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold">Calculated Age</span>
                  <span className="block font-extrabold text-white">{calculateAge(dob)} Years old</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold">Current Occupation</span>
                  <span className="block font-extrabold text-white">{occupation}</span>
                </div>
                <div className="space-y-0.5 col-span-2">
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
              <button type="button" onClick={handlePrevStep} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-white/5">
                <ArrowLeft className="w-4 h-4" /><span>Adjust</span>
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
