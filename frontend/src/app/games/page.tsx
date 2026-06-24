"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { 
  Gamepad2, Award, Sparkles, ChevronLeft, Play, RefreshCw, BrainCircuit, Target,
  Layers, Swords, Heart, Plus, Trophy, Trash2, CheckCircle2, ChevronRight, Zap, Loader2, Volume2
} from "lucide-react";
import { apiRequest, ensureAuthenticated } from "../../lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// DATA SETS
// ─────────────────────────────────────────────────────────────────────────────

interface Word {
  ko: string;
  en: string;
  options: string[];
}

const BASIC_WORDS: Word[] = [
  { ko: "사과", en: "Apple", options: ["Apple", "Banana", "Grape", "Watermelon"] },
  { ko: "바나나", en: "Banana", options: ["Apple", "Banana", "Orange", "Peach"] },
  { ko: "포도", en: "Grape", options: ["Grape", "Strawberry", "Watermelon", "Banana"] },
  { ko: "딸기", en: "Strawberry", options: ["Grape", "Strawberry", "Peach", "Apple"] },
  { ko: "수박", en: "Watermelon", options: ["Banana", "Grape", "Watermelon", "Orange"] },
  { ko: "오렌지", en: "Orange", options: ["Orange", "Peach", "Apple", "Grape"] },
  { ko: "배", en: "Pear", options: ["Pear", "Peach", "Banana", "Strawberry"] },
  { ko: "복숭아", en: "Peach", options: ["Pear", "Peach", "Apple", "Orange"] },
  { ko: "개", en: "Dog", options: ["Dog", "Cat", "Cow", "Pig"] },
  { ko: "고양이", en: "Cat", options: ["Dog", "Cat", "Bird", "Rabbit"] },
  { ko: "학교", en: "School", options: ["School", "Home", "Library", "Office"] },
  { ko: "친구", en: "Friend", options: ["Friend", "Teacher", "Student", "Mother"] },
  { ko: "책", en: "Book", options: ["Book", "Pen", "Notebook", "Desk"] },
  { ko: "물", en: "Water", options: ["Water", "Milk", "Juice", "Coffee"] },
  { ko: "우유", en: "Milk", options: ["Milk", "Water", "Tea", "Soda"] }
];

const GOLDEN_WORDS: Word[] = [
  { ko: "도서관", en: "Library", options: ["Library", "School", "Office", "Market"] },
  { ko: "컴퓨터", en: "Computer", options: ["Computer", "Television", "Phone", "Radio"] },
  { ko: "대한민국", en: "Republic of Korea", options: ["Republic of Korea", "Japan", "China", "United States"] },
  { ko: "선생님", en: "Teacher", options: ["Teacher", "Doctor", "Lawyer", "Officer"] },
  { ko: "대박", en: "Awesome / Jackpot", options: ["Awesome / Jackpot", "Unfortunate", "Sad", "Boring"] },
  { ko: "사랑", en: "Love", options: ["Love", "Hate", "Anger", "Jealousy"] },
  { ko: "행복", en: "Happiness", options: ["Happiness", "Sadness", "Fear", "Surprise"] },
  { ko: "한국어", en: "Korean Language", options: ["Korean Language", "English", "Japanese", "Chinese"] }
];

interface Sentence {
  english: string;
  blocks: string[];
  correctOrder: string[];
  explanation: string;
}

const SENTENCES: Sentence[] = [
  {
    english: "I go to school today.",
    blocks: ["갑니다", "오늘", "학교에"],
    correctOrder: ["오늘", "학교에", "갑니다"],
    explanation: "Korean follows Subject-Object-Verb (SOV). In this sentence, the time marker '오늘' (today) comes first, followed by the destination '학교에' (to school), and finally the verb '갑니다' (go) sits at the end."
  },
  {
    english: "Yesterday I watched a movie with a friend.",
    blocks: ["친구와", "봤어요", "영화를", "어제"],
    correctOrder: ["어제", "친구와", "영화를", "봤어요"],
    explanation: "Time marker '어제' (yesterday) starts the clause, '친구와' (with friend) describes companionship, '영화를' (movie + object particle) acts as the direct object, and '봤어요' (watched) is the final past tense verb."
  },
  {
    english: "I eat delicious bibimbap.",
    blocks: ["맛있는", "먹습니다", "저는", "비빔밥을"],
    correctOrder: ["저는", "맛있는", "비빔밥을", "먹습니다"],
    explanation: "Subject '저는' (I + topic marker) is placed first. The modifier '맛있는' (delicious) describes the noun '비빔밥을' (bibimbap + object marker), which is completed by the action verb '먹습니다' (eat)."
  },
  {
    english: "Tomorrow I will study at the library.",
    blocks: ["공부할 것입니다", "도서관에서", "내일"],
    correctOrder: ["내일", "도서관에서", "공부할 것입니다"],
    explanation: "Time marker '내일' (tomorrow) precedes the location '도서관에서' (at/in the library), concluding with the future tense auxiliary structure '공부할 것입니다' (will study)."
  }
];

interface BossQuestion {
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

const BOSS_QUESTIONS: BossQuestion[] = [
  {
    question: "Fill the blank: '저는 학생___ 의사입니다.' (I am a student AND a doctor.)",
    options: ["이고", "이지만", "은", "이"],
    correct: "이고",
    explanation: "'-고' is the conjunctive ending meaning 'and'. So '학생이고' means 'being a student and...'."
  },
  {
    question: "Fill the blank: '어제___ 날씨가 추웠지만 오늘은 따뜻합니다.' (Yesterday, the weather was cold but today it is warm.)",
    options: ["에는", "은", "이", "가"],
    correct: "에는",
    explanation: "'어제' (yesterday) is combined with '에' (time particle) and '는' (contrast/topic particle) to highlight the contrast between yesterday's and today's weather."
  },
  {
    question: "Choose the correct object particle: '사과___ 먹습니다.' (I eat an apple.)",
    options: ["를", "을", "가", "이"],
    correct: "를",
    explanation: "'사과' ends in a vowel, so it takes the object particle '를' instead of '을'."
  },
  {
    question: "Choose the correct subject particle: '책___ 있습니다.' (There is a book.)",
    options: ["이", "가", "을", "를"],
    correct: "이",
    explanation: "'책' ends in a final consonant (batchim), so it takes the subject particle '이'."
  },
  {
    question: "Choose the correct topic particle: '이것___ 연필입니다.' (This is a pencil.)",
    options: ["은", "는", "이", "가"],
    correct: "은",
    explanation: "'이것' ends in a consonant (ㅅ), so the topic marker '은' is used."
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT MAIN
// ─────────────────────────────────────────────────────────────────────────────

type GameTab = "arcade" | "orchard" | "sniper" | "sentence" | "boss" | "forge";

export default function GamesArcade() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GameTab>("arcade");

  // Reward analytics stored locally
  const [tangerinesCount, setTangerinesCount] = useState(0);
  const [sniperHighScore, setSniperHighScore] = useState(0);
  const [bossWins, setBossWins] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [earnedXpTotal, setEarnedXpTotal] = useState(0);

  // Sync profile metrics on mount
  useEffect(() => {
    async function init() {
      const user = await ensureAuthenticated();
      if (!user) return;

      if (typeof window !== "undefined") {
        try {
          setTangerinesCount(parseInt(localStorage.getItem("hangeulai_tangerines") || "0"));
          setSniperHighScore(parseInt(localStorage.getItem("hangeulai_sniper_high") || "0"));
          setBossWins(parseInt(localStorage.getItem("hangeulai_boss_wins") || "0"));
          setGamesPlayed(parseInt(localStorage.getItem("hangeulai_games_played") || "0"));
          setEarnedXpTotal(parseInt(localStorage.getItem("hangeulai_games_xp") || "0"));
        } catch {}
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleEarnXp = async (amount: number) => {
    try {
      // API request to add backend XP
      await apiRequest(`/progress/xp/add?amount=${amount}`, { method: "POST" });
      
      // Update local storage analytics
      if (typeof window !== "undefined") {
        const nextXp = earnedXpTotal + amount;
        const nextPlayed = gamesPlayed + 1;
        localStorage.setItem("hangeulai_games_xp", nextXp.toString());
        localStorage.setItem("hangeulai_games_played", nextPlayed.toString());
        setEarnedXpTotal(nextXp);
        setGamesPlayed(nextPlayed);
        
        // Dispatch live XP update to SidebarLayout
        window.dispatchEvent(new CustomEvent("hangeulai-xp", { detail: { amount } }));
      }
    } catch (err) {
      console.error("Failed to sync game XP rewards:", err);
    }
  };

  const incrementTangerines = () => {
    const nextCount = tangerinesCount + 1;
    localStorage.setItem("hangeulai_tangerines", nextCount.toString());
    setTangerinesCount(nextCount);
  };

  const updateSniperHighScore = (score: number) => {
    if (score > sniperHighScore) {
      localStorage.setItem("hangeulai_sniper_high", score.toString());
      setSniperHighScore(score);
    }
  };

  const incrementBossWins = () => {
    const nextWins = bossWins + 1;
    localStorage.setItem("hangeulai_boss_wins", nextWins.toString());
    setBossWins(nextWins);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
          <p className="text-zinc-500 text-sm font-bold">Powering up Hangeul AI Arcade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground relative pb-16 overflow-hidden w-full max-w-[98%] mx-auto px-4 md:px-6">
      
      {/* Background ambient depth glows */}
      <div className="absolute -top-10 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-orange-500/10 to-red-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-red-500/10 to-orange-500/5 rounded-full blur-[160px] pointer-events-none animate-pulse duration-8000" />

      {activeTab !== "arcade" && (
        <button
          onClick={() => setActiveTab("arcade")}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-white/10 text-xs font-black transition mb-6 cursor-pointer relative z-10"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Arcade Dashboard</span>
        </button>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          ARCADE DASHBOARD HUB
          ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "arcade" && (
        <div className="space-y-10 relative z-10 w-full max-w-none">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-orange-950/20 via-zinc-900/60 to-zinc-950 p-6 md:p-8 shadow-2xl transition-all hover:border-orange-500/20 duration-500 group">
            {/* Glow orbs */}
            <div className="absolute -right-10 -top-10 w-44 h-44 bg-orange-500/15 rounded-full blur-3xl group-hover:scale-125 transition duration-700" />
            <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-red-500/15 rounded-full blur-3xl group-hover:scale-125 transition duration-700" />
            
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-3 max-w-xl text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/25 text-[10px] text-orange-300 font-extrabold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping" />
                  <span>Arcade Arena</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                  Games <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-400 to-red-500 font-black animate-gradient-x">Universe</span>
                </h1>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Step into the AI-powered Korean gaming zone! Play scientifically useful lessons wrapped in rich arcade gameplay to level up your language intuition.
                </p>
              </div>
              
              {/* Analytics Box */}
              <div className="grid grid-cols-3 gap-4 bg-zinc-950/60 p-4.5 rounded-2xl border border-white/5 shrink-0 w-full lg:w-auto shadow-inner backdrop-blur-sm">
                <div className="text-center px-2">
                  <div className="text-2xl font-black text-white font-mono">🍊 {tangerinesCount}</div>
                  <div className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">Harvested</div>
                </div>
                <div className="w-px bg-white/5" />
                <div className="text-center px-2">
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 font-mono">⚡ {earnedXpTotal}</div>
                  <div className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">Arcade XP</div>
                </div>
                <div className="w-px bg-white/5" />
                <div className="text-center px-2">
                  <div className="text-2xl font-black text-zinc-300 font-mono">{bossWins}🏆</div>
                  <div className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">Boss Kills</div>
                </div>
              </div>
            </div>
          </div>

          {/* Game Catalog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            
            {/* Tangerine Orchard Card */}
            <div 
              className="glass-panel p-6 rounded-[2.2rem] border border-white/10 bg-gradient-to-br from-orange-950/10 to-zinc-900/10 hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.35)] transition duration-300 group flex flex-col justify-between"
            >
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-3xl p-3 bg-zinc-950 rounded-2xl border border-white/5 group-hover:scale-110 transition duration-300">🍊</span>
                  <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    Vocabulary
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">Tangerine Orchard</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Grow and harvest delicious tangerines by matching Korean vocabulary definitions. Collect rare golden fruits and build your orchard rank!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("orchard")}
                className="w-full pt-6 mt-6 border-t border-white/[0.04] flex items-center justify-between text-xs font-black text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <span>Play Orchard Harvest</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition duration-300" />
              </button>
            </div>

            {/* Korean Sniper Card */}
            <div 
              className="glass-panel p-6 rounded-[2.2rem] border border-white/10 bg-gradient-to-br from-cyan-950/10 to-zinc-900/10 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.35)] transition duration-300 group flex flex-col justify-between"
            >
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-3xl p-3 bg-zinc-950 rounded-2xl border border-white/5 group-hover:scale-110 transition duration-300">🎯</span>
                  <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Recall Speed
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">Korean Sniper</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Shoot down the correct Korean translations as targets drift down the screen. Test your fast recall and vocabulary recognition speeds.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("sniper")}
                className="w-full pt-6 mt-6 border-t border-white/[0.04] flex items-center justify-between text-xs font-black text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <span>Play Sniper Gallery</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition duration-300" />
              </button>
            </div>

            {/* Sentence Builder Card */}
            <div 
              className="glass-panel p-6 rounded-[2.2rem] border border-white/10 bg-gradient-to-br from-indigo-950/10 to-zinc-900/10 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.35)] transition duration-300 group flex flex-col justify-between"
            >
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-3xl p-3 bg-zinc-950 rounded-2xl border border-white/5 group-hover:scale-110 transition duration-300">🧩</span>
                  <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Syntax
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">Sentence Builder</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Drag and re-order word pieces to construct grammatically correct Korean clauses. Master SOV word ordering rules and conjugation patterns.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("sentence")}
                className="w-full pt-6 mt-6 border-t border-white/[0.04] flex items-center justify-between text-xs font-black text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <span>Play Word Builder</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition duration-300" />
              </button>
            </div>

            {/* Boss Battles Card */}
            <div 
              className="glass-panel p-6 rounded-[2.2rem] border border-white/10 bg-gradient-to-br from-red-950/10 to-zinc-900/10 hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.35)] transition duration-300 group flex flex-col justify-between"
            >
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-3xl p-3 bg-zinc-950 rounded-2xl border border-white/5 group-hover:scale-110 transition duration-300">⚔️</span>
                  <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    Grammar RPG
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">Grammar Boss Battles</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Equip magic spells and fight the Particle King in turn-based combat! Solve grammar and particle conjugation challenges to deal massive spell damage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("boss")}
                className="w-full pt-6 mt-6 border-t border-white/[0.04] flex items-center justify-between text-xs font-black text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <span>Launch Boss Battle</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition duration-300" />
              </button>
            </div>

            {/* Hangeul Forge Card */}
            <div 
              className="glass-panel p-6 rounded-[2.2rem] border border-white/10 bg-gradient-to-br from-amber-950/10 to-zinc-900/10 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.35)] transition duration-300 group flex flex-col justify-between"
            >
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-3xl p-3 bg-zinc-950 rounded-2xl border border-white/5 group-hover:scale-110 transition duration-300">🔨</span>
                  <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Phonology
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">Hangeul Forge</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Forge glowing Hangeul tiles by assembling syllable blocks before they cool. Master consonants, vowels, and batchim at speed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("forge")}
                className="w-full pt-6 mt-6 border-t border-white/[0.04] flex items-center justify-between text-xs font-black text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <span>Enter Forge</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition duration-300" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          GAME: TANGERINE ORCHARD
          ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "orchard" && (
        <OrchardGameView 
          onEarnXp={handleEarnXp} 
          tangerines={tangerinesCount} 
          onIncrementTangerine={incrementTangerines} 
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          GAME: KOREAN SNIPER
          ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "sniper" && (
        <SniperGameView 
          onEarnXp={handleEarnXp}
          highScore={sniperHighScore}
          onUpdateHighScore={updateSniperHighScore}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          GAME: SENTENCE BUILDER
          ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "sentence" && (
        <SentenceBuilderView 
          onEarnXp={handleEarnXp}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          GAME: GRAMMAR BOSS BATTLES
          ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "boss" && (
        <BossBattleView 
          onEarnXp={handleEarnXp}
          onWin={incrementBossWins}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          GAME: HANGEUL FORGE
          ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "forge" && (
        <ForgeGameView 
          onEarnXp={handleEarnXp}
        />
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME VIEWS
// ─────────────────────────────────────────────────────────────────────────────

// 1. Orchard Game View
function OrchardGameView({ 
  onEarnXp, 
  tangerines, 
  onIncrementTangerine 
}: { 
  onEarnXp: (amount: number) => void;
  tangerines: number;
  onIncrementTangerine: () => void;
}) {
  const [activeWord, setActiveWord] = useState<Word | null>(null);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  
  // Orchard layout setup: 8 trees
  const trees = [
    { id: 1, name: "Tree A", level: "Basic" },
    { id: 2, name: "Tree B", level: "Basic" },
    { id: 3, name: "Tree C", level: "Basic" },
    { id: 4, name: "Tree D", level: "Basic" },
    { id: 5, name: "Tree E", level: "Basic" },
    { id: 6, name: "Tree F", level: "Basic" },
    { id: 7, name: "Tree G", level: "Golden (Rare)", gold: true },
    { id: 8, name: "Tree H", level: "Golden (Rare)", gold: true }
  ];

  const handlePickFruit = (isGold: boolean) => {
    const wordList = isGold ? GOLDEN_WORDS : BASIC_WORDS;
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    
    // Scramble options
    const scrambledOptions = [...randomWord.options].sort(() => Math.random() - 0.5);

    setActiveWord({
      ...randomWord,
      options: scrambledOptions
    });
    setSelectedOpt(null);
    setChecked(false);
  };

  const handleVerify = async () => {
    if (!activeWord || !selectedOpt) return;
    const isCorrect = selectedOpt === activeWord.en;
    setCorrect(isCorrect);
    setChecked(true);

    try {
      await apiRequest("/progress/mastery/record", {
        method: "POST",
        body: JSON.stringify({
          item_type: "vocabulary",
          item_string: activeWord.ko,
          is_correct: isCorrect
        })
      });
    } catch {}

    if (isCorrect) {
      onIncrementTangerine();
      onEarnXp(15);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-center z-10 relative">
      <div className="glass-panel p-6 rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-950/10 via-zinc-900/40 to-zinc-950 shadow-xl flex justify-between items-center">
        <div className="text-left">
          <h2 className="text-2xl font-black text-orange-400">🍊 Tangerine Orchard</h2>
          <p className="text-xs text-zinc-400">Pick fruit from trees and translate definitions to grow your orchard!</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl text-orange-300 font-extrabold text-sm font-mono">
          Harvested: {tangerines} Tangerines
        </div>
      </div>

      {/* Grid of Orchard Trees */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-4">
        {trees.map((t) => (
          <div 
            key={t.id}
            onClick={() => handlePickFruit(!!t.gold)}
            className={`glass-panel p-5 rounded-3xl border transition-all duration-300 hover:-translate-y-1.5 cursor-pointer text-center group flex flex-col items-center justify-between ${
              t.gold 
                ? "border-yellow-500/10 bg-yellow-950/10 hover:border-yellow-500/35 hover:shadow-[0_0_25px_rgba(234,179,8,0.1)]" 
                : "border-white/5 bg-zinc-900/10 hover:border-orange-500/25 hover:shadow-[0_0_25px_rgba(249,115,22,0.1)]"
            }`}
          >
            <div className="space-y-2">
              <div className="text-5xl group-hover:animate-bounce transition duration-300">
                {t.gold ? "🌳✨" : "🌳"}
              </div>
              <h4 className="text-sm font-black text-zinc-100">{t.name}</h4>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                t.gold ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25" : "bg-orange-500/10 text-orange-400 border border-orange-500/25"
              }`}>
                {t.level}
              </span>
            </div>
            
            {/* Visual fruits on tree */}
            <div className="flex gap-1 mt-4">
              <span className="text-sm">🍊</span>
              <span className="text-sm">🍊</span>
              {t.gold && <span className="text-sm">⭐</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Pop-up Translation Modal */}
      {activeWord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center max-w-sm w-full space-y-6 bg-zinc-950 shadow-2xl relative animate-fade-in">
            <button 
              onClick={() => setActiveWord(null)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-white text-base cursor-pointer"
            >
              &times;
            </button>

            <div className="space-y-2">
              <span className="text-5xl block animate-pulse">🍊</span>
              <span className="text-xs text-zinc-500 font-extrabold uppercase tracking-widest font-mono">Harvest Challenge</span>
              <h3 className="text-3xl font-black text-white leading-tight font-korean">{activeWord.ko}</h3>
            </div>

            <div className="space-y-2.5">
              {activeWord.options.map((opt) => {
                const isSelected = selectedOpt === opt;
                let btnStyle = "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300";
                
                if (checked) {
                  if (opt === activeWord.en) {
                    btnStyle = "border-green-500/30 bg-green-500/10 text-green-400 font-bold";
                  } else if (isSelected) {
                    btnStyle = "border-red-500/30 bg-red-500/10 text-red-400 font-bold";
                  } else {
                    btnStyle = "border-white/5 bg-zinc-950/40 text-zinc-600 opacity-60";
                  }
                } else if (isSelected) {
                  btnStyle = "border-orange-500/30 bg-orange-500/10 text-orange-400 font-bold scale-[1.02]";
                }

                return (
                  <button
                    key={opt}
                    disabled={checked}
                    onClick={() => setSelectedOpt(opt)}
                    className={`w-full p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {checked ? (
              <div className="space-y-4">
                <div className={`p-3 rounded-xl text-xs font-bold leading-relaxed border ${
                  correct ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  {correct ? "Correct! +15 XP earned." : `Oops! Correct answer was: ${activeWord.en}`}
                </div>
                <button
                  onClick={() => setActiveWord(null)}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-extrabold py-3 px-4 rounded-xl text-xs cursor-pointer transition"
                >
                  Return to Orchard
                </button>
              </div>
            ) : (
              <button
                disabled={!selectedOpt}
                onClick={handleVerify}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-zinc-950 font-black py-3 px-4 rounded-xl text-xs cursor-pointer transition shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm Translation
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 2. Sniper Game View
interface SniperBubble {
  id: number;
  word: Word;
  option: string;
  x: number;
  y: number;
  speed: number;
}

function SniperGameView({ 
  onEarnXp,
  highScore,
  onUpdateHighScore
}: { 
  onEarnXp: (amount: number) => void;
  highScore: number;
  onUpdateHighScore: (score: number) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [targetWord, setTargetWord] = useState<Word | null>(null);
  const [bubbles, setBubbles] = useState<SniperBubble[]>([]);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);

  const initGame = () => {
    setScore(0);
    setCombo(0);
    setBubbles([]);
    setPlaying(true);
    pickNewTarget();
  };

  const pickNewTarget = () => {
    const randomWord = BASIC_WORDS[Math.floor(Math.random() * BASIC_WORDS.length)];
    setTargetWord(randomWord);
  };

  // Main game loop
  const updateGame = (time: number) => {
    if (!playing) return;

    // Spawn new bubbles every 2.5 seconds
    if (time - lastSpawnRef.current > 2500) {
      spawnBubbles();
      lastSpawnRef.current = time;
    }

    // Move bubbles down
    setBubbles((prev) => {
      let isGameOver = false;
      const updated = prev.map((b) => {
        const nextY = b.y + b.speed;
        if (nextY > 380 && b.option === targetWord?.en) {
          // If correct word drops below screen, lose combo
          isGameOver = true;
        }
        return { ...b, y: nextY };
      }).filter((b) => b.y <= 400);

      if (isGameOver) {
        setCombo(0);
      }
      return updated;
    });

    requestRef.current = requestAnimationFrame(updateGame);
  };

  useEffect(() => {
    if (playing) {
      requestRef.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [playing, targetWord]);

  const spawnBubbles = () => {
    if (!targetWord) return;
    
    // Spawn 3 bubbles: one correct, two distractors
    const correctOpt = targetWord.en;
    const distractors = targetWord.options.filter(o => o !== correctOpt);
    const chosenOptions = [correctOpt, distractors[0], distractors[1]].sort(() => Math.random() - 0.5);

    const newBubbles: SniperBubble[] = chosenOptions.map((opt, index) => {
      const segmentWidth = 100 / 3;
      const xOffset = index * segmentWidth + Math.random() * 10;
      return {
        id: Date.now() + index,
        word: targetWord,
        option: opt,
        x: xOffset,
        y: 0,
        speed: 1.0 + Math.random() * 0.8 + (score / 150) // speed scales slightly with score
      };
    });

    setBubbles(prev => [...prev, ...newBubbles]);
  };

  const handleShoot = async (bubble: SniperBubble) => {
    if (!targetWord) return;
    
    const isCorrect = bubble.option === targetWord.en;
    
    try {
      await apiRequest("/progress/mastery/record", {
        method: "POST",
        body: JSON.stringify({
          item_type: "vocabulary",
          item_string: targetWord.ko,
          is_correct: isCorrect
        })
      });
    } catch {}

    if (isCorrect) {
      // Correct!
      const points = 10 + combo * 2;
      const newScore = score + points;
      setScore(newScore);
      setCombo(prev => prev + 1);
      onUpdateHighScore(newScore);
      onEarnXp(5);
      
      // Remove all current bubbles and pick new target
      setBubbles([]);
      pickNewTarget();
    } else {
      // Wrong bubble hit
      setCombo(0);
      setBubbles(prev => prev.filter(b => b.id !== bubble.id));
    }
  };

  const stopGame = () => {
    setPlaying(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-center z-10 relative">
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/10 via-zinc-900/40 to-zinc-950 shadow-xl flex justify-between items-center">
        <div className="text-left">
          <h2 className="text-2xl font-black text-cyan-400">🎯 Korean Sniper</h2>
          <p className="text-xs text-zinc-400">Shoot bubbles that match the English target word before they hit the ground!</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-zinc-950/60 border border-white/5 px-4 py-2 rounded-xl text-zinc-300 font-extrabold text-xs font-mono">
            High Score: {highScore} pts
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-xl text-cyan-300 font-extrabold text-xs font-mono">
            Current: {score} pts
          </div>
        </div>
      </div>

      {playing ? (
        <div className="space-y-4">
          {/* Dashboard HUD */}
          <div className="flex justify-between items-center max-w-xl mx-auto bg-zinc-950/60 p-3.5 rounded-2xl border border-white/5">
            <div className="text-left">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Target English Word</span>
              <span className="text-lg font-black text-white tracking-wide">{targetWord?.ko}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Combo</span>
              <span className="text-sm font-black text-accent-pink font-mono">🔥 x{combo}</span>
            </div>
          </div>

          {/* Shooting Gallery Canvas Area */}
          <div 
            ref={gameAreaRef}
            className="w-full max-w-xl mx-auto h-[400px] bg-zinc-950/80 rounded-3xl border border-white/10 relative overflow-hidden shadow-inner flex items-center justify-center"
          >
            {bubbles.length === 0 && (
              <p className="text-zinc-600 text-xs font-bold font-mono">Waiting for targets...</p>
            )}

            {bubbles.map((b) => (
              <button
                key={b.id}
                onClick={() => handleShoot(b)}
                style={{ 
                  left: `${b.x}%`, 
                  top: `${b.y}px`,
                  transform: 'translateX(-50%)'
                }}
                className="absolute px-4 py-2 rounded-full border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-500/20 hover:scale-105 transition-all text-xs font-bold text-cyan-300 shadow-md cursor-pointer animate-pulse-slow"
              >
                {b.option}
              </button>
            ))}
          </div>

          <button
            onClick={stopGame}
            className="px-6 py-2.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 font-semibold rounded-xl border border-red-500/20 transition text-xs cursor-pointer"
          >
            Abort Gallery Mode
          </button>
        </div>
      ) : (
        <div className="py-16 bg-zinc-900/10 border border-dashed border-white/10 rounded-3xl max-w-xl mx-auto space-y-6">
          <div className="space-y-2">
            <Target className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
            <h3 className="text-lg font-black text-white">Target Shooting Gallery Ready</h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">Click correct Korean bubbles before they fall off the screen to grow points and multipliers!</p>
          </div>
          <button
            onClick={initGame}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-zinc-950 font-black py-3 px-8 rounded-xl text-xs cursor-pointer transition shadow-lg shadow-cyan-500/20"
          >
            Launch Gallery
          </button>
        </div>
      )}
    </div>
  );
}

// 3. Sentence Builder View
function SentenceBuilderView({ 
  onEarnXp 
}: { 
  onEarnXp: (amount: number) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [assembled, setAssembled] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);

  const sentence = SENTENCES[activeIdx];

  const initSentence = () => {
    if (!sentence) return;
    setScrambled([...sentence.blocks].sort(() => Math.random() - 0.5));
    setAssembled([]);
    setChecked(false);
  };

  useEffect(() => {
    initSentence();
  }, [activeIdx]);

  const handleSelectBlock = (block: string) => {
    setScrambled(prev => prev.filter(b => b !== block));
    setAssembled(prev => [...prev, block]);
  };

  const handleRemoveBlock = (block: string) => {
    setAssembled(prev => prev.filter(b => b !== block));
    setScrambled(prev => [...prev, block]);
  };

  const handleCheckOrder = async () => {
    if (!sentence) return;
    const isCorrect = JSON.stringify(assembled) === JSON.stringify(sentence.correctOrder);
    setCorrect(isCorrect);
    setChecked(true);

    try {
      await apiRequest("/progress/mastery/record", {
        method: "POST",
        body: JSON.stringify({
          item_type: "grammar",
          item_string: sentence.correctOrder.join(" "),
          is_correct: isCorrect
        })
      });
    } catch {}

    if (isCorrect) {
      onEarnXp(25);
    }
  };

  const handleNext = () => {
    setActiveIdx(prev => (prev + 1) % SENTENCES.length);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-center z-10 relative">
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/10 via-zinc-900/40 to-zinc-950 shadow-xl flex justify-between items-center">
        <div className="text-left">
          <h2 className="text-2xl font-black text-indigo-400">🧩 Sentence Builder</h2>
          <p className="text-xs text-zinc-400">Construct grammatically correct Korean structures by clicking the word blocks in order!</p>
        </div>
        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-extrabold px-3 py-1 rounded border border-indigo-500/20 font-mono">
          Puzzle: {activeIdx + 1} / {SENTENCES.length}
        </span>
      </div>

      {sentence && (
        <div className="w-full max-w-xl mx-auto space-y-8 bg-zinc-950/60 p-6 rounded-3xl border border-white/5 shadow-inner">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest font-mono">Target English Structure</span>
            <h3 className="text-xl font-bold text-white font-serif italic">"{sentence.english}"</h3>
          </div>

          {/* Assembled Area */}
          <div className="space-y-2 text-left">
            <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">Assembled Korean Sentence (SOV Order):</span>
            <div className="min-h-[60px] p-3 rounded-2xl bg-zinc-900/40 border border-dashed border-white/10 flex flex-wrap gap-2.5 items-center justify-center">
              {assembled.map((block) => (
                <button
                  key={block}
                  disabled={checked}
                  onClick={() => handleRemoveBlock(block)}
                  className="px-4 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-950/30 text-indigo-300 text-xs font-bold hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition cursor-pointer select-none"
                >
                  {block}
                </button>
              ))}
              {assembled.length === 0 && (
                <span className="text-zinc-600 text-xs font-semibold select-none">Click blocks below to build sentence...</span>
              )}
            </div>
          </div>

          {/* Scrambled Pool Area */}
          {!checked && (
            <div className="space-y-2 text-left">
              <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">Word Blocks Pool:</span>
              <div className="flex flex-wrap gap-2.5 justify-center py-2">
                {scrambled.map((block) => (
                  <button
                    key={block}
                    onClick={() => handleSelectBlock(block)}
                    className="px-4 py-2.5 rounded-xl border border-white/5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black transition cursor-pointer select-none"
                  >
                    {block}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Verify button or feedback result */}
          {checked ? (
            <div className="space-y-5 animate-fade-in">
              <div className={`p-5 rounded-2xl border text-sm text-left space-y-2.5 ${
                correct ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                <h4 className="font-extrabold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{correct ? "Brilliant syntax ordering!" : "Incorrect order."}</span>
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">{sentence.explanation}</p>
              </div>

              <button
                onClick={handleNext}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs cursor-pointer transition shadow-lg shadow-indigo-500/20"
              >
                Next Puzzle Challenge
              </button>
            </div>
          ) : (
            <button
              disabled={scrambled.length > 0}
              onClick={handleCheckOrder}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-black py-3.5 px-4 rounded-xl text-xs cursor-pointer transition shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Verify Sentence Order
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// 4. Boss Battles View
function BossBattleView({ 
  onEarnXp,
  onWin 
}: { 
  onEarnXp: (amount: number) => void;
  onWin: () => void;
}) {
  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [combatChecked, setCombatChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [combatLogs, setCombatLogs] = useState<string[]>(["Battle Commenced! Equip your grammar spells."]);
  const [gameResult, setGameResult] = useState<"won" | "lost" | null>(null);

  const activeQuestion = BOSS_QUESTIONS[questionIdx];

  const handleCastSpell = async () => {
    if (!activeQuestion || !selectedOpt) return;
    const isCorrect = selectedOpt === activeQuestion.correct;
    setCorrect(isCorrect);
    setCombatChecked(true);

    try {
      await apiRequest("/progress/mastery/record", {
        method: "POST",
        body: JSON.stringify({
          item_type: "grammar",
          // Use the clean fill-in-the-blank question text or pattern
          item_string: activeQuestion.question,
          is_correct: isCorrect
        })
      });
    } catch {}

    if (isCorrect) {
      // Hit Boss
      const newBossHp = Math.max(0, bossHp - 25);
      setBossHp(newBossHp);
      
      const spellNames = ["Fireball", "Lightning Bolt", "Ice Spear", "Earth Shatter"];
      const spell = spellNames[Math.floor(Math.random() * spellNames.length)];
      
      setCombatLogs((prev) => [
        `✨ Correct! You cast ${spell} dealing 25 damage!`,
        ...prev
      ]);

      if (newBossHp === 0) {
        setGameResult("won");
        onWin();
        onEarnXp(100); // 100 XP for defeating boss!
      }
    } else {
      // Boss attacks Player
      const newPlayerHp = Math.max(0, playerHp - 20);
      setPlayerHp(newPlayerHp);
      
      setCombatLogs((prev) => [
        `❌ Incorrect! The Particle King counter-attacked dealing 20 damage!`,
        ...prev
      ]);

      if (newPlayerHp === 0) {
        setGameResult("lost");
      }
    }
  };

  const handleNextTurn = () => {
    setQuestionIdx(prev => (prev + 1) % BOSS_QUESTIONS.length);
    setSelectedOpt(null);
    setCombatChecked(false);
  };

  const handleRestart = () => {
    setBossHp(100);
    setPlayerHp(100);
    setQuestionIdx(0);
    setSelectedOpt(null);
    setCombatChecked(false);
    setGameResult(null);
    setCombatLogs(["Equip your grammar spells and face the Particle King!"]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-center z-10 relative">
      <div className="glass-panel p-6 rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-950/10 via-zinc-900/40 to-zinc-950 shadow-xl flex justify-between items-center">
        <div className="text-left">
          <h2 className="text-2xl font-black text-red-400">⚔️ Grammar Boss Battles</h2>
          <p className="text-xs text-zinc-400">Fight the Particle King by solving particle conjugations correctly!</p>
        </div>
        <span className="text-[10px] bg-red-500/10 text-red-400 font-extrabold px-3 py-1 rounded border border-red-500/20 font-mono">
          Boss: Particle King (HP 100)
        </span>
      </div>

      {gameResult ? (
        <div className="w-full max-w-xl mx-auto p-8 bg-zinc-950/60 rounded-3xl border border-white/5 space-y-6 animate-fade-in">
          {gameResult === "won" ? (
            <div className="space-y-4">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
              <h3 className="text-2xl font-black text-white">VICTORY!</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">You successfully defeated the Particle King! Earned 100 XP and added 1 Boss Kill to your analytics profile!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Swords className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
              <h3 className="text-2xl font-black text-red-400">DEFEATED</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">Your HP dropped to 0! Study particles and conjugation rules, and try again to exact your revenge.</p>
            </div>
          )}
          
          <button
            onClick={handleRestart}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-black py-3 px-8 rounded-xl text-xs cursor-pointer transition"
          >
            Play Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-4xl mx-auto">
          
          {/* Left Side: Battle Arena HP bars */}
          <div className="lg:col-span-4 space-y-6 bg-zinc-950/60 p-5 rounded-3xl border border-white/5">
            {/* Particle King HUD */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                <span>👑 Particle King</span>
                <span className="font-mono text-[11px] text-red-400">{bossHp} / 100 HP</span>
              </div>
              <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                <div 
                  style={{ width: `${bossHp}%` }} 
                  className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
                />
              </div>
            </div>

            {/* Vs divider */}
            <div className="text-center font-black text-zinc-600 text-sm py-2">VS</div>

            {/* Player HUD */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                <span>🛡️ Language Warrior</span>
                <span className="font-mono text-[11px] text-green-400">{playerHp} / 100 HP</span>
              </div>
              <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                <div 
                  style={{ width: `${playerHp}%` }} 
                  className="h-full bg-gradient-to-r from-green-600 to-green-500 transition-all duration-300"
                />
              </div>
            </div>

            {/* Combat Log Box */}
            <div className="border-t border-white/5 pt-4 text-left">
              <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest block mb-2 font-mono">Combat Logs</span>
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                {combatLogs.map((log, idx) => (
                  <div key={idx} className="text-[10px] text-zinc-400 leading-relaxed pl-2 border-l border-white/10 font-mono">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Spell Selection (Quiz Question) */}
          <div className="lg:col-span-8 bg-zinc-950/60 p-6 rounded-3xl border border-white/5 space-y-6">
            <div className="space-y-1.5 text-left">
              <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block font-mono">Cast Spell Trigger Challenge</span>
              <h3 className="text-base font-bold text-white leading-relaxed">{activeQuestion?.question}</h3>
            </div>

            {/* Answer select buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {activeQuestion?.options.map((opt) => {
                const isSelected = selectedOpt === opt;
                let btnStyle = "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300";

                if (combatChecked) {
                  if (opt === activeQuestion.correct) {
                    btnStyle = "border-green-500/30 bg-green-500/10 text-green-400 font-bold";
                  } else if (isSelected) {
                    btnStyle = "border-red-500/30 bg-red-500/10 text-red-400 font-bold";
                  } else {
                    btnStyle = "border-white/5 bg-zinc-950/40 text-zinc-600 opacity-60";
                  }
                } else if (isSelected) {
                  btnStyle = "border-red-500/30 bg-red-500/10 text-red-400 font-bold scale-[1.02]";
                }

                return (
                  <button
                    key={opt}
                    disabled={combatChecked}
                    onClick={() => setSelectedOpt(opt)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition cursor-pointer select-none ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {combatChecked ? (
              <div className="space-y-4 animate-fade-in">
                <div className={`p-4 rounded-xl text-xs text-left leading-relaxed border ${
                  correct ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  <strong className="block mb-1">{correct ? "Success!" : "Spell Failed!"}</strong>
                  {activeQuestion.explanation}
                </div>

                <button
                  onClick={handleNextTurn}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs cursor-pointer transition shadow-lg shadow-red-500/20"
                >
                  Continue Combat Turn
                </button>
              </div>
            ) : (
              <button
                disabled={!selectedOpt}
                onClick={handleCastSpell}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-black py-3.5 px-4 rounded-xl text-xs cursor-pointer transition shadow-lg shadow-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cast Spell
              </button>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Hangeul Forge Game View
// ─────────────────────────────────────────────────────────────────────────────
interface ForgeItem {
  ko: string;
  romanization: string;
  english: string;
  components?: string[]; // For single syllables: e.g. ["ㄱ", "ㅏ", "ㄱ"]
  syllables?: { ko: string; components: string[] }[]; // For multi-syllables: e.g. [{ko: "사", components: ["ㅅ", "ㅏ"]}, {ko: "과", components: ["ㄱ", "ㅘ"]}]
  explanation?: string;
}

const FORGE_TIER_1: ForgeItem[] = [
  { ko: "가", romanization: "ga", english: "Go", components: ["ㄱ", "ㅏ"], explanation: "ㄱ (g) + ㅏ (a) makes 'ga'." },
  { ko: "나", romanization: "na", english: "I / Me", components: ["ㄴ", "ㅏ"], explanation: "ㄴ (n) + ㅏ (a) makes 'na'." },
  { ko: "다", romanization: "da", english: "All", components: ["ㄷ", "ㅏ"], explanation: "ㄷ (d) + ㅏ (a) makes 'da'." },
  { ko: "머", romanization: "meo", english: "Head / Mind", components: ["ㅁ", "ㅓ"], explanation: "ㅁ (m) + ㅓ (eo) makes 'meo'." },
  { ko: "모", romanization: "mo", english: "Corner / Parent", components: ["ㅁ", "ㅗ"], explanation: "ㅁ (m) + ㅗ (o) makes 'mo'." },
  { ko: "비", romanization: "bi", english: "Rain", components: ["ㅂ", "ㅣ"], explanation: "ㅂ (b) + ㅣ (i) makes 'bi'." },
  { ko: "우", romanization: "u", english: "Right", components: ["ㅇ", "ㅜ"], explanation: "ㅇ (silent placeholder) + ㅜ (u) makes 'u'." },
  { ko: "하", romanization: "ha", english: "Bottom / Under", components: ["ㅎ", "ㅏ"], explanation: "ㅎ (h) + ㅏ (a) makes 'ha'." },
  { ko: "서", romanization: "seo", english: "West", components: ["ㅅ", "ㅓ"], explanation: "ㅅ (s) + ㅓ (eo) makes 'seo'." },
  { ko: "초", romanization: "cho", english: "Candle / Beginning", components: ["ㅊ", "ㅗ"], explanation: "ㅊ (ch) + ㅗ (o) makes 'cho'." }
];

const FORGE_TIER_2: ForgeItem[] = [
  { ko: "각", romanization: "gak", english: "Each / Angle", components: ["ㄱ", "ㅏ", "ㄱ"], explanation: "ㄱ (g) + ㅏ (a) + ㄱ (k) makes 'gak'." },
  { ko: "집", romanization: "jip", english: "House", components: ["ㅈ", "ㅣ", "ㅂ"], explanation: "ㅈ (j) + ㅣ (i) + ㅂ (p) makes 'jip'." },
  { ko: "몸", romanization: "mom", english: "Body", components: ["ㅁ", "ㅗ", "ㅁ"], explanation: "ㅁ (m) + ㅗ (o) + ㅁ (m) makes 'mom'." },
  { ko: "눈", romanization: "nun", english: "Eye / Snow", components: ["ㄴ", "ㅜ", "ㄴ"], explanation: "ㄴ (n) + ㅜ (u) + ㄴ (n) makes 'nun'." },
  { ko: "밥", romanization: "bap", english: "Rice / Food", components: ["ㅂ", "ㅏ", "ㅂ"], explanation: "ㅂ (b) + ㅏ (a) + ㅂ (p) makes 'bap'." },
  { ko: "물", romanization: "mul", english: "Water", components: ["ㅁ", "ㅜ", "ㄹ"], explanation: "ㅁ (m) + ㅜ (u) + ㄹ (l) makes 'mul'." },
  { ko: "국", romanization: "guk", english: "Soup", components: ["ㄱ", "ㅜ", "ㄱ"], explanation: "ㄱ (g) + ㅜ (u) + ㄱ (k) makes 'guk'." },
  { ko: "밤", romanization: "bam", english: "Night / Chestnut", components: ["ㅂ", "ㅏ", "ㅁ"], explanation: "ㅂ (b) + ㅏ (a) + ㅁ (m) makes 'bam'." }
];

const FORGE_TIER_3: ForgeItem[] = [
  { ko: "배", romanization: "bae", english: "Pear / Boat", components: ["ㅂ", "ㅐ"], explanation: "배 ends with ㅐ (ae) which sounds like 'e' in 'pen' with a wider open mouth compared to ㅔ (e)." },
  { ko: "베", romanization: "be", english: "Hemp / To cut", components: ["ㅂ", "ㅔ"], explanation: "베 ends with ㅔ (e) which sounds like 'e' in 'pet' with a slightly less open mouth compared to ㅐ (ae)." },
  { ko: "오", romanization: "o", english: "Five", components: ["ㅇ", "ㅗ"], explanation: "오 uses ㅗ (o) which is a bright vertical sound made with rounded protruded lips." },
  { ko: "어", romanization: "eo", english: "Prefix", components: ["ㅇ", "ㅓ"], explanation: "어 uses ㅓ (eo) which is a dark vertical sound made with an open mouth and relaxed lips." },
  { ko: "사", romanization: "sa", english: "Four / To buy", components: ["ㅅ", "ㅏ"], explanation: "사 uses the standard lax consonant ㅅ (s), pronounced softly without excessive airflow." },
  { ko: "싸", romanization: "ssa", english: "To wrap / Cheap", components: ["ㅆ", "ㅏ"], explanation: "싸 uses the tense consonant ㅆ (ss), pronounced with extra vocal cord tension." },
  { ko: "자", romanization: "ja", english: "Ruler", components: ["ㅈ", "ㅏ"], explanation: "자 uses standard lax ㅈ (j)." },
  { ko: "짜", romanization: "jja", english: "Salty / To squeeze", components: ["ㅉ", "ㅏ"], explanation: "짜 uses tense consonant ㅉ (jj), forced with extra vocal tension." }
];

const FORGE_TIER_4: ForgeItem[] = [
  { ko: "사과", romanization: "sa-gwa", english: "Apple", syllables: [{ ko: "사", components: ["ㅅ", "ㅏ"] }, { ko: "과", components: ["ㄱ", "ㅘ"] }] },
  { ko: "아기", romanization: "a-gi", english: "Baby", syllables: [{ ko: "아", components: ["ㅇ", "ㅏ"] }, { ko: "기", components: ["ㄱ", "ㅣ"] }] },
  { ko: "우유", romanization: "u-yu", english: "Milk", syllables: [{ ko: "우", components: ["ㅇ", "ㅜ"] }, { ko: "유", components: ["ㅇ", "ㅠ"] }] },
  { ko: "나라", romanization: "na-ra", english: "Country", syllables: [{ ko: "나", components: ["ㄴ", "ㅏ"] }, { ko: "라", components: ["ㄹ", "ㅏ"] }] },
  { ko: "구름", romanization: "gu-reum", english: "Cloud", syllables: [{ ko: "구", components: ["ㄱ", "ㅜ"] }, { ko: "름", components: ["ㄹ", "ㅡ", "ㅁ"] }] }
];

const ALL_JAMO = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ", "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];

function ForgeGameView({ onEarnXp }: { onEarnXp: (amount: number) => void }) {
  const [gameState, setGameState] = useState<"lobby" | "playing" | "summary">("lobby");
  const [mode, setMode] = useState<"learn" | "arcade">("arcade");
  const [tier, setTier] = useState<number>(1);
  const [rounds, setRounds] = useState<ForgeItem[]>([]);
  const [roundIdx, setRoundIdx] = useState<number>(0);
  
  // Game session states
  const [slots, setSlots] = useState<string[]>([]);
  const [activeCandidateTiles, setActiveCandidateTiles] = useState<string[]>([]);
  const [currentSyllableIdx, setCurrentSyllableIdx] = useState<number>(0); // For Tier 4 multi-syllable tracking
  
  // Multi-syllable word states
  const [multiSyllableSlots, setMultiSyllableSlots] = useState<string[][]>([]); // Array of character slots
  
  const [timer, setTimer] = useState<number>(100);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [correctForges, setCorrectForges] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  
  // Feedback effects
  const [shakeMold, setShakeMold] = useState<boolean>(false);
  const [glowMold, setGlowMold] = useState<boolean>(false);
  const [forgeSuccessMsg, setForgeSuccessMsg] = useState<string | null>(null);
  const [tileHighlight, setTileHighlight] = useState<number | null>(null); // Index of correct tile to highlight in learn mode
  const [ingotCracked, setIngotCracked] = useState<boolean>(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Play audio helper using TTS
  const playTtsAudio = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  // Start game session
  const startGame = (selectedTier: number, selectedMode: "learn" | "arcade") => {
    setTier(selectedTier);
    setMode(selectedMode);
    
    // Choose dataset based on Tier
    let dataset: ForgeItem[] = [];
    if (selectedTier === 1) dataset = [...FORGE_TIER_1];
    else if (selectedTier === 2) dataset = [...FORGE_TIER_2];
    else if (selectedTier === 3) dataset = [...FORGE_TIER_3];
    else dataset = [...FORGE_TIER_4];
    
    // Shuffle and pick 10 items
    const selectedRounds = dataset.sort(() => Math.random() - 0.5).slice(0, 10);
    setRounds(selectedRounds);
    setRoundIdx(0);
    setGameState("playing");
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setMistakes(0);
    setCorrectForges(0);
    setReactionTimes([]);
    
    initIngot(selectedRounds[0], 0, selectedTier, selectedMode);
  };

  // Initialize a new ingot
  const initIngot = (item: ForgeItem, index: number, currentTier: number, activeMode: "learn" | "arcade") => {
    setGlowMold(false);
    setShakeMold(false);
    setIngotCracked(false);
    setForgeSuccessMsg(null);
    setTileHighlight(null);
    setStartTime(Date.now());
    
    if (currentTier === 4 && item.syllables) {
      // Multi-syllable word
      setCurrentSyllableIdx(0);
      const initialSyllableSlots = item.syllables.map(s => Array(s.components.length).fill(""));
      setMultiSyllableSlots(initialSyllableSlots);
      setSlots(Array(item.syllables[0].components.length).fill(""));
      generateTilesForSyllable(item.syllables[0].components, currentTier, item);
    } else if (item.components) {
      // Single syllable
      setSlots(Array(item.components.length).fill(""));
      generateTilesForSyllable(item.components, currentTier, item);
    }
    
    // Play sound prompt
    setTimeout(() => playTtsAudio(item.ko), 200);
    
    // Restart timer
    if (timerRef.current) clearInterval(timerRef.current);
    if (activeMode === "arcade") {
      setTimer(100);
      const duration = 6000; // 6 seconds per ingot
      const interval = 60; // Tick every 60ms
      let remaining = 100;
      timerRef.current = setInterval(() => {
        remaining -= (interval / duration) * 100;
        if (remaining <= 0) {
          setTimer(0);
          clearInterval(timerRef.current!);
          handleTimeOut();
        } else {
          setTimer(remaining);
        }
      }, interval);
    }
  };

  // Generate candidate tray tiles
  const generateTilesForSyllable = (correctComponents: string[], currentTier: number, activeItem: ForgeItem) => {
    const list = [...correctComponents];
    
    // Distractor vowels or consonants based on active components
    const distractorCount = currentTier === 3 ? 3 : 4;
    let pool = [...ALL_JAMO];
    
    if (currentTier === 3) {
      // Contrast confusable vowels
      if (activeItem.ko.includes("배")) pool = ["ㅔ", "ㅐ", "ㅔ", "ㅏ", "ㅓ"];
      else if (activeItem.ko.includes("베")) pool = ["ㅐ", "ㅔ", "ㅐ", "ㅓ", "ㅏ"];
      else if (activeItem.ko.includes("오")) pool = ["ㅓ", "ㅗ", "ㅜ", "ㅡ"];
      else if (activeItem.ko.includes("어")) pool = ["ㅗ", "ㅓ", "ㅡ", "ㅜ"];
      else if (activeItem.ko.includes("사")) pool = ["ㅆ", "ㅅ", "ㅈ", "ㅉ"];
      else if (activeItem.ko.includes("싸")) pool = ["ㅅ", "ㅆ", "ㅉ", "ㅈ"];
    }

    const uniqueDistractors = pool.filter(j => !list.includes(j));
    const distractors = uniqueDistractors.sort(() => Math.random() - 0.5).slice(0, distractorCount);
    
    const combined = [...list, ...distractors].sort(() => Math.random() - 0.5);
    setActiveCandidateTiles(combined);
  };

  // Tap a candidate tile
  const handleTapTile = (tile: string, tileIndex: number) => {
    if (glowMold || ingotCracked) return;
    
    const activeItem = rounds[roundIdx];
    
    if (tier === 4 && activeItem.syllables) {
      // Multi-syllable logic
      const targetSyllable = activeItem.syllables[currentSyllableIdx];
      const emptyIdx = slots.indexOf("");
      if (emptyIdx === -1) return;
      
      const expectedChar = targetSyllable.components[emptyIdx];
      if (tile === expectedChar) {
        // Correct slot fill
        const nextSlots = [...slots];
        nextSlots[emptyIdx] = tile;
        setSlots(nextSlots);
        
        // Update multi-syllable visual matrix
        const nextMulti = [...multiSyllableSlots];
        nextMulti[currentSyllableIdx] = nextSlots;
        setMultiSyllableSlots(nextMulti);
        
        // Verify if active syllable is fully forged
        if (nextSlots.indexOf("") === -1) {
          if (currentSyllableIdx < activeItem.syllables.length - 1) {
            // Move to next syllable in the same word
            const nextIdx = currentSyllableIdx + 1;
            setCurrentSyllableIdx(nextIdx);
            setSlots(Array(activeItem.syllables[nextIdx].components.length).fill(""));
            generateTilesForSyllable(activeItem.syllables[nextIdx].components, tier, activeItem);
          } else {
            // Entire word fully forged successfully!
            handleForgingCompleted();
          }
        }
      } else {
        // Wrong tile placed
        handleMistake(tileIndex, expectedChar);
      }
    } else if (activeItem.components) {
      // Single syllable logic
      const emptyIdx = slots.indexOf("");
      if (emptyIdx === -1) return;
      
      const expectedChar = activeItem.components[emptyIdx];
      if (tile === expectedChar) {
        // Correct slot fill
        const nextSlots = [...slots];
        nextSlots[emptyIdx] = tile;
        setSlots(nextSlots);
        
        if (nextSlots.indexOf("") === -1) {
          handleForgingCompleted();
        }
      } else {
        handleMistake(tileIndex, expectedChar);
      }
    }
  };

  // Action on mistake
  const handleMistake = (tileIndex: number, expected: string) => {
    setShakeMold(true);
    setTimeout(() => setShakeMold(false), 400);
    setMistakes(prev => prev + 1);
    setCombo(0);
    
    if (mode === "learn") {
      // Highlight correct candidate tile index in Learn mode
      const correctIdx = activeCandidateTiles.indexOf(expected);
      if (correctIdx !== -1) {
        setTileHighlight(correctIdx);
      }
    } else {
      // Time penalty in Arcade Mode
      setTimer(prev => Math.max(0, prev - 15));
    }
  };

  // Successful forge completion
  const handleForgingCompleted = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    setGlowMold(true);
    setCorrectForges(prev => prev + 1);
    
    // Calculate combo and points
    const nextCombo = combo + 1;
    setCombo(nextCombo);
    if (nextCombo > maxCombo) setMaxCombo(nextCombo);
    
    let basePts = tier === 1 ? 10 : tier === 4 ? 25 : 15;
    let multiplier = 1;
    if (nextCombo >= 8) multiplier = 2.0;
    else if (nextCombo >= 4) multiplier = 1.5;
    
    // Time bonus: answered within first half of the countdown
    let timeBonus = 0;
    if (mode === "arcade" && timer >= 50) {
      timeBonus = Math.round(basePts * 0.2);
    }
    
    const earned = Math.round(basePts * multiplier) + timeBonus;
    setScore(prev => prev + earned);
    setForgeSuccessMsg(`FORGED! +${earned} Pts${multiplier > 1 ? ` (${multiplier}x Combo!)` : ""}${timeBonus > 0 ? " [Speed Bonus!]" : ""}`);
    
    // Log reaction time
    const reaction = Date.now() - startTime;
    setReactionTimes(prev => [...prev, reaction]);
    
    // Move to next ingot after delay
    setTimeout(() => {
      handleNextIngot();
    }, 1200);
  };

  // Timer runout
  const handleTimeOut = () => {
    setIngotCracked(true);
    setCombo(0);
    setMistakes(prev => prev + 1);
    
    setTimeout(() => {
      handleNextIngot();
    }, 1500);
  };

  const handleNextIngot = () => {
    if (roundIdx < rounds.length - 1) {
      const nextIdx = roundIdx + 1;
      setRoundIdx(nextIdx);
      initIngot(rounds[nextIdx], nextIdx, tier, mode);
    } else {
      // Completed all rounds
      handleEndRound();
    }
  };

  const handleEndRound = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState("summary");
    
    // Base XP rewards: 10 XP per correct forge
    let totalXp = correctForges * 10;
    
    // Perfect forge bonus (0 mistakes)
    const isPerfect = mistakes === 0 && correctForges === rounds.length;
    if (isPerfect) {
      totalXp += 100;
    }
    
    if (totalXp > 0) {
      onEarnXp(totalXp);
      
      // Log perfect forge milestone inside local storage
      if (isPerfect && typeof window !== "undefined") {
        try {
          const milestones = JSON.parse(localStorage.getItem("hangeulai_milestones") || "[]");
          if (!milestones.includes("perfect_hangeul_forge_round")) {
            milestones.push("perfect_hangeul_forge_round");
            localStorage.setItem("hangeulai_milestones", JSON.stringify(milestones));
          }
        } catch {}
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 relative z-10 animate-fade-in text-left">
      
      {/* 1. LOBBY VIEW */}
      {gameState === "lobby" && (
        <div className="bg-zinc-950/60 p-6 md:p-8 rounded-3xl border border-white/5 space-y-8 shadow-2xl relative backdrop-blur-xl">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
              <span>🔨 Hangeul Forge</span>
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Blacksmith, assemble the glowing Hangeul tiles before the ingots cool down and crack. Perfect your sound association, character construction, and speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Mode selection */}
            <div className="space-y-3">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-black font-mono">Select Training Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode("learn")}
                  className={`p-4 rounded-2xl border text-center transition cursor-pointer ${
                    mode === "learn" 
                      ? "border-amber-500/40 bg-amber-500/10 text-white font-extrabold" 
                      : "border-white/5 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400"
                  }`}
                >
                  <div className="text-sm">📚 Learn Mode</div>
                  <div className="text-[9px] text-zinc-500 mt-1">Untimed, explains confusable vowels</div>
                </button>
                <button
                  onClick={() => setMode("arcade")}
                  className={`p-4 rounded-2xl border text-center transition cursor-pointer ${
                    mode === "arcade" 
                      ? "border-orange-500/40 bg-orange-500/10 text-white font-extrabold" 
                      : "border-white/5 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400"
                  }`}
                >
                  <div className="text-sm">⚡ Arcade Mode</div>
                  <div className="text-[9px] text-zinc-500 mt-1">6s timer, streak combos, high XP</div>
                </button>
              </div>
            </div>

            {/* Tier selection */}
            <div className="space-y-3">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-black font-mono">Forge Difficulty Tiers</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 1, name: "Tier 1: Basic Syllables", desc: "No batchim (e.g. 가, 다)" },
                  { id: 2, name: "Tier 2: With Batchim", desc: "Final consonants (e.g. 집, 몸)" },
                  { id: 3, name: "Tier 3: Confusables", desc: "ㅐ vs ㅔ, ㅗ vs ㅓ pairs" },
                  { id: 4, name: "Tier 4: Multi-Syllables", desc: "2-syllable word construction" }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTier(t.id)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between min-h-[70px] ${
                      tier === t.id 
                        ? "border-amber-500/30 bg-amber-500/5 text-amber-300 font-extrabold" 
                        : "border-white/5 bg-zinc-900/40 hover:bg-zinc-900/60 text-zinc-400"
                    }`}
                  >
                    <span className="font-bold text-xs">{t.name}</span>
                    <span className="text-[9px] text-zinc-500 font-semibold mt-1">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          <button
            onClick={() => startGame(tier, mode)}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-4 px-6 rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/10 uppercase tracking-wider text-center"
          >
            Start Forging Session
          </button>
        </div>
      )}

      {/* 2. GAMEPLAY VIEW */}
      {gameState === "playing" && rounds.length > 0 && (
        <div className="bg-zinc-950/60 p-6 md:p-8 rounded-3xl border border-white/5 space-y-6 shadow-2xl relative backdrop-blur-xl flex flex-col items-center">
          
          {/* Top Bar Stats */}
          <div className="w-full flex justify-between items-center bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-4 text-xs font-black text-zinc-400">
              <span>Ingot: <strong className="text-white font-mono">{roundIdx + 1} / 10</strong></span>
              <span className="w-px h-4 bg-white/10" />
              <span>Score: <strong className="text-amber-400 font-mono">{score}</strong></span>
              {combo > 0 && (
                <>
                  <span className="w-px h-4 bg-white/10" />
                  <span className="flex items-center gap-1 text-orange-400 animate-bounce">
                    🔥 Combo: {combo}
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => playTtsAudio(rounds[roundIdx].ko)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg border border-white/10 transition cursor-pointer"
                title="Replay Prompt Audio"
              >
                <Volume2 className="w-4 h-4 text-amber-400" />
              </button>
              <button
                onClick={() => setGameState("lobby")}
                className="text-xs text-zinc-500 hover:text-white font-bold cursor-pointer"
              >
                Quit
              </button>
            </div>
          </div>

          {/* Arcade Timer Bar */}
          {mode === "arcade" && (
            <div className="w-full space-y-1">
              <div className="flex justify-between items-center text-[9px] text-zinc-500 uppercase tracking-widest font-mono">
                <span>Cooling Meter</span>
                <span className={timer < 30 ? "text-red-400 animate-pulse font-bold" : "text-zinc-400"}>
                  {timer < 30 ? "CRITICAL CRACK RISK!" : "Ingot Cooling"}
                </span>
              </div>
              <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                <div 
                  style={{ width: `${timer}%` }} 
                  className={`h-full transition-all duration-75 rounded-full ${
                    timer < 30 
                      ? "bg-gradient-to-r from-red-600 to-red-500" 
                      : "bg-gradient-to-r from-orange-500 to-amber-400"
                  }`}
                />
              </div>
            </div>
          )}

          {/* Prompt cues */}
          <div className="w-full text-center space-y-2 py-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black font-mono block">English Clue</span>
            <h3 className="text-xl font-bold text-white tracking-wide">
              {rounds[roundIdx].english}
            </h3>
            {rounds[roundIdx].romanization && (
              <p className="text-xs text-zinc-400 font-mono font-bold">
                Pronunciation: {rounds[roundIdx].romanization}
              </p>
            )}
          </div>

          {/* Central Syllable Mold Slots Area */}
          <div className={`my-8 flex justify-center gap-6 p-8 rounded-3xl border transition-all duration-300 relative min-w-[280px] max-w-[500px] ${
            shakeMold ? "shake-effect border-red-500/40 bg-red-500/5 shadow-[0_0_25px_rgba(239,68,68,0.1)]" :
            glowMold ? "border-amber-500/50 bg-amber-500/10 shadow-[0_0_35px_rgba(245,158,11,0.25)] scale-102" :
            ingotCracked ? "border-zinc-800 bg-zinc-900/20 grayscale opacity-60" :
            "border-white/5 bg-zinc-950/80 shadow-inner"
          }`}>
            
            {/* Visual crack effect */}
            {ingotCracked && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 bg-black/40 rounded-3xl animate-fade-in">
                <span className="text-red-500 font-black text-xl tracking-widest uppercase rotate-12 bg-zinc-950/90 border border-red-500/20 px-4 py-2 rounded-xl">
                  INGOT CRACKED 💥
                </span>
              </div>
            )}

            {/* Glowing mold notification */}
            {forgeSuccessMsg && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 bg-amber-500/5 rounded-3xl animate-bounce">
                <span className="text-amber-300 font-black text-lg tracking-wider bg-zinc-950/95 border border-amber-500/30 px-5 py-2.5 rounded-2xl shadow-xl">
                  {forgeSuccessMsg}
                </span>
              </div>
            )}

            {/* Syllable Slots Molds */}
            {tier === 4 && rounds[roundIdx].syllables ? (
              // Multi-syllable word slot layouts
              <div className="flex gap-10 items-center">
                {rounds[roundIdx].syllables.map((syl, sIdx) => {
                  const isCurrent = currentSyllableIdx === sIdx;
                  return (
                    <div 
                      key={sIdx} 
                      className={`flex flex-col gap-2 p-3 rounded-2xl border transition ${
                        isCurrent 
                          ? "border-amber-500/20 bg-amber-500/[0.02]" 
                          : "border-white/5 bg-transparent opacity-60"
                      }`}
                    >
                      <div className="text-[9px] text-zinc-500 text-center font-bold tracking-widest uppercase">Syllable {sIdx + 1}</div>
                      <div className="flex gap-3">
                        {multiSyllableSlots[sIdx]?.map((val, cIdx) => (
                          <div
                            key={cIdx}
                            className={`w-14 h-14 rounded-xl border flex items-center justify-center font-black text-lg transition select-none ${
                              val 
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse" 
                                : "border-dashed border-white/10 bg-zinc-900/60 text-zinc-700"
                            }`}
                          >
                            {val || "?"}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Single syllable slots layout
              <div className="flex gap-4">
                {slots.map((val, idx) => {
                  const label = idx === 0 ? "Initial" : idx === 1 ? "Vowel" : "Final (Batchim)";
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">{label}</div>
                      <div
                        className={`w-16 h-16 rounded-xl border flex items-center justify-center font-black text-xl transition select-none ${
                          val 
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse" 
                            : "border-dashed border-white/10 bg-zinc-900/60 text-zinc-700 animate-pulse"
                        }`}
                      >
                        {val || "?"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Candidate Tile Tray */}
          <div className="w-full space-y-3">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black font-mono block">Ingot Forge Tray</span>
            
            <div className="flex flex-wrap gap-2.5 justify-center p-4 bg-zinc-900/30 border border-white/5 rounded-2xl">
              {activeCandidateTiles.map((tile, idx) => {
                const isHighlighted = tileHighlight === idx;
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleTapTile(tile, idx)}
                    className={`w-14 h-14 rounded-xl border text-lg font-black transition cursor-pointer active:scale-95 flex items-center justify-center shadow ${
                      isHighlighted 
                        ? "border-green-500 bg-green-500/20 text-green-300 animate-pulse scale-105" 
                        : "border-white/10 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:border-white/20"
                    }`}
                  >
                    {tile}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Learn Mode helper hints */}
          {mode === "learn" && rounds[roundIdx].explanation && (
            <div className="w-full mt-4 p-4 rounded-2xl bg-zinc-900/60 border border-white/5 text-xs text-zinc-300 leading-relaxed font-semibold">
              <strong className="block text-amber-400 font-extrabold mb-1">Blacksmith Grammar Tip:</strong>
              {rounds[roundIdx].explanation}
            </div>
          )}

        </div>
      )}

      {/* 3. ROUND SUMMARY VIEW */}
      {gameState === "summary" && (
        <div className="bg-zinc-950/60 p-6 md:p-8 rounded-3xl border border-white/5 space-y-6 text-center shadow-2xl relative backdrop-blur-xl max-w-xl mx-auto">
          <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
          
          <div className="space-y-1.5">
            <h3 className="text-2xl font-black text-white">FORGING ROUND COMPLETED</h3>
            <p className="text-zinc-400 text-xs font-semibold">Round stats compiled successfully</p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-zinc-900/40 p-5 rounded-2xl border border-white/5 text-xs font-bold">
            <div className="text-left space-y-1.5">
              <span className="text-zinc-500 uppercase tracking-widest text-[9px] block">Forged Syllables</span>
              <span className="text-lg text-white font-mono">{correctForges} / {rounds.length}</span>
            </div>
            <div className="text-left space-y-1.5">
              <span className="text-zinc-500 uppercase tracking-widest text-[9px] block">Longest Combo</span>
              <span className="text-lg text-orange-400 font-mono">🔥 {maxCombo}</span>
            </div>
            <div className="text-left space-y-1.5">
              <span className="text-zinc-500 uppercase tracking-widest text-[9px] block">Total Mistakes</span>
              <span className="text-lg text-red-400 font-mono">❌ {mistakes}</span>
            </div>
            <div className="text-left space-y-1.5">
              <span className="text-zinc-500 uppercase tracking-widest text-[9px] block">Arcade XP Gained</span>
              <span className="text-lg text-green-400 font-mono">⚡ {correctForges * 10 + (mistakes === 0 && correctForges === rounds.length ? 100 : 0)} XP</span>
            </div>
          </div>

          {mistakes === 0 && correctForges === rounds.length && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-bold">
              ✨ PERFECT FORGE ROUND BONUS! +100 XP awarded to your journey tracker.
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={() => startGame(tier, mode)}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black py-3 px-6 rounded-xl text-xs cursor-pointer transition"
            >
              Replay Tier {tier}
            </button>
            <button
              onClick={() => {
                if (tier < 4) {
                  startGame(tier + 1, mode);
                } else {
                  setGameState("lobby");
                }
              }}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold py-3 px-6 rounded-xl border border-white/5 transition text-xs cursor-pointer"
            >
              {tier < 4 ? `Next Tier: Tier ${tier + 1}` : "Back to Lobby"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
