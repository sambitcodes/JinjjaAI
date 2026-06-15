"use client";

import { useEffect, useState } from "react";
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
  Save,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Laptop,
  MapPin,
  Briefcase,
  Smartphone,
  HelpCircle,
  Activity,
  Calendar,
  RefreshCw
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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

interface Course4Phase5ParagraphsWizardProps {
  activeLesson: any;
  speakWord: (text: string) => void;
  onComplete: () => void;
}

export default function Course4Phase5ParagraphsWizard({
  activeLesson,
  speakWord,
  onComplete,
}: Course4Phase5ParagraphsWizardProps) {
  const [step, setStep] = useState(1);
  const [showOutline, setShowOutline] = useState(false);
  const totalSteps = 6;

  // Data loaded from Backend
  const [metadata, setMetadata] = useState<any>(null);
  const [coreData, setCoreData] = useState<any>(null);

  // Activity 1 states (Reading Comprehension / Structure check)
  const [readingItems, setReadingItems] = useState<any[]>([]);
  const [readIdx, setReadIdx] = useState(0);
  const [selectedTopicOption, setSelectedTopicOption] = useState<string | null>(null);
  const [selectedTopicSentence, setSelectedTopicSentence] = useState<string | null>(null);
  const [selectedLinkingWord, setSelectedLinkingWord] = useState<string | null>(null);
  const [activity1Checked, setActivity1Checked] = useState(false);
  const [activity1Correct, setActivity1Correct] = useState<boolean | null>(null);

  // Activity 2 states (Paragraph Planner)
  const [plannerTopics, setPlannerTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("daily_routine");
  
  // Custom draft components
  const [beginningText, setBeginningText] = useState("");
  const [details, setDetails] = useState<any[]>([
    { connector: "먼저", text: "" },
    { connector: "그 다음에", text: "" },
    { connector: "마지막으로", text: "" }
  ]);
  const [endText, setEndText] = useState("");
  const [linkingWords, setLinkingWords] = useState<any[]>([]);

  // Composed results
  const [composedKo, setComposedKo] = useState("");
  const [composedEn, setComposedEn] = useState("");
  const [building, setBuilding] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [improvedParagraphKo, setImprovedParagraphKo] = useState("");
  const [improving, setImproving] = useState(false);
  const [savedParagraphs, setSavedParagraphs] = useState<any[]>([]);

  // Speaking evaluation states
  const [recording, setRecording] = useState(false);
  const [speakingChecked, setSpeakingChecked] = useState(false);
  const [speakingFeedback, setSpeakingFeedback] = useState("");
  const [speakingScore, setSpeakingScore] = useState<number | null>(null);

  // Quiz states
  const [quizBlueprint, setQuizBlueprint] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<string | null>(null);
  const [quizMistakes, setQuizMistakes] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [finishingQuiz, setFinishingQuiz] = useState(false);

  // Homework check states
  const [homeworkItems, setHomeworkItems] = useState<any[]>([]);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  // Tutor session states
  const [loadingTutor, setLoadingTutor] = useState(false);
  const [tutorSession, setTutorSession] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (step === 1 && !metadata) {
          const res = await apiJson("/lessons/phases/korean3/5/metadata");
          setMetadata(res);
        } else if (step === 2 && !coreData) {
          const res = await apiJson("/lessons/phases/korean3/5/core-data");
          setCoreData(res);
        } else if (step === 3 && readingItems.length === 0) {
          const res = await apiJson("/lessons/practice/paragraphs/reading");
          setReadingItems(res.items || []);
        } else if (step === 4 && plannerTopics.length === 0) {
          const res = await apiJson("/lessons/practice/paragraphs/templates");
          setPlannerTopics(res.topics || []);
          setLinkingWords(res.linking_words || []);
        } else if (step === 5 && quizBlueprint.length === 0) {
          const res = await apiJson("/lessons/quiz/korean3/phase-5/start", { method: "POST" });
          setQuizBlueprint(res.blueprint || []);
        } else if (step === 6 && homeworkItems.length === 0) {
          const res_hw = await apiJson("/lessons/phases/korean3/5/homework");
          setHomeworkItems(res_hw || []);
        }
      } catch (err) {
        console.error("Error loading step data: ", err);
      }
    };
    load();
  }, [step]);

  const playAudio = (text: string) => {
    speakWord(text);
  };

  const handleCheckActivity1 = async () => {
    const current = readingItems[readIdx];
    if (!current) return;

    const topicCorrect = selectedTopicOption === current.correct_topic;
    const topicSentCorrect = selectedTopicSentence === current.correct_topic_sentence;
    const isCorrect = topicCorrect && topicSentCorrect;

    setActivity1Checked(true);
    setActivity1Correct(isCorrect);

    try {
      await apiJson("/lessons/practice/paragraphs/reading/answer", {
        method: "POST",
        body: JSON.stringify({
          item_id: current.id,
          is_correct: isCorrect,
          time_taken_ms: 2000
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextActivity1 = () => {
    setActivity1Checked(false);
    setSelectedTopicOption(null);
    setSelectedTopicSentence(null);
    setSelectedLinkingWord(null);
    setActivity1Correct(null);

    if (readIdx < readingItems.length - 1) {
      setReadIdx(readIdx + 1);
    } else {
      setReadIdx(0);
    }
  };

  const handleUpdateDetail = (index: number, field: string, value: string) => {
    const nextDetails = [...details];
    nextDetails[index] = { ...nextDetails[index], [field]: value };
    setDetails(nextDetails);
  };

  const handleAddDetailRow = () => {
    if (details.length < 5) {
      setDetails([...details, { connector: "그리고", text: "" }]);
    }
  };

  const handleRemoveDetailRow = (index: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
    }
  };

  const handleBuildParagraph = async () => {
    setBuilding(true);
    setSpeakingChecked(false);
    setSpeakingFeedback("");
    setSpeakingScore(null);
    try {
      const res = await apiJson("/lessons/practice/paragraphs/build", {
        method: "POST",
        body: JSON.stringify({
          topic: selectedTopic,
          beginning: beginningText,
          details: details.filter(d => d.text.trim() !== ""),
          end: endText
        })
      });
      setComposedKo(res.paragraph_ko);
      setComposedEn(res.paragraph_en);
    } catch (err) {
      console.error(err);
    } finally {
      setBuilding(false);
    }
  };

  const handleImproveParagraph = async () => {
    if (!composedKo) return;
    setImproving(true);
    try {
      const res = await apiJson("/lessons/practice/paragraphs/improve", {
        method: "POST",
        body: JSON.stringify({ paragraph_ko: composedKo })
      });
      setAiSuggestions(res.suggestions || []);
      setImprovedParagraphKo(res.improved_ko || "");
    } catch (err) {
      console.error(err);
    } finally {
      setImproving(false);
    }
  };

  const handleSaveParagraph = async () => {
    if (!composedKo) return;
    try {
      await apiJson("/lessons/users/paragraphs/save", {
        method: "POST",
        body: JSON.stringify({ title: `My Story: ${selectedTopic}`, content_ko: composedKo })
      });
      setSavedParagraphs(prev => [...prev, composedKo]);
      alert("Paragraph saved successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartRecording = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      handleCheckSpeaking();
    }, 2500);
  };

  const handleCheckSpeaking = async () => {
    try {
      const res = await apiJson("/lessons/practice/paragraphs/speaking", {
        method: "POST",
        body: JSON.stringify({ target_text: composedKo })
      });
      setSpeakingChecked(true);
      setSpeakingFeedback(res.feedback);
      setSpeakingScore(res.accuracy_score);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckQuiz = async () => {
    const current = quizBlueprint[quizIdx];
    if (!current) return;

    const isCorrect = quizSelectedOpt === current.correct_answer;
    setQuizChecked(true);
    setQuizCorrect(isCorrect);
    if (!isCorrect) {
      setQuizMistakes(prev => [...prev, current.id]);
    }

    try {
      await apiJson("/lessons/quiz/korean3/phase-5/answer", {
        method: "POST",
        body: JSON.stringify({
          question_id: current.id,
          answer: quizSelectedOpt || "",
          time_taken_ms: 1500
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
        await apiJson("/lessons/quiz/korean3/phase-5/finish", {
          method: "POST",
          body: JSON.stringify({
            score,
            mistakes: quizMistakes
          })
        });
        setQuizScore(score);
        setStep(6);
      } catch (err) {
        console.error(err);
      } finally {
        setFinishingQuiz(false);
      }
    }
  };

  const handleToggleHomework = async (id: string, currentStatus: boolean) => {
    setCompletedHomework(prev => ({ ...prev, [id]: !currentStatus }));
    try {
      await apiJson("/lessons/phases/korean3/5/homework/check", {
        method: "POST",
        body: JSON.stringify({ homework_id: id, checked: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLaunchB1ParagraphsPractice = async () => {
    setLoadingTutor(true);
    setTutorSession(null);
    try {
      const res = await apiJson("/lessons/conversation/b1/paragraphs-practice/start", {
        method: "POST"
      });
      setTutorSession(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTutor(false);
    }
  };

  const renderTopicIcon = (iconName: string) => {
    switch(iconName) {
      case "calendar": return <Calendar className="w-4 h-4 text-brand-400" />;
      case "activity": return <Activity className="w-4 h-4 text-brand-400" />;
      case "map-pin": return <MapPin className="w-4 h-4 text-brand-400" />;
      case "refresh-cw": return <RefreshCw className="w-4 h-4 text-brand-400" />;
      default: return <BookOpen className="w-4 h-4 text-brand-400" />;
    }
  };

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
              <span>{activeLesson?.title || "Longer Stories & Paragraphs (B1 Core)"}</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Curated Topic: Structural Paragraph Building</p>
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
            className="text-[10px] bg-zinc-900 border border-white/10 hover:bg-zinc-900 text-zinc-300 px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer uppercase tracking-wider font-bold"
          >
            {showOutline ? "Hide Outline" : "View Outline"}
          </button>
        </div>
      </header>

      {/* Screen 1: Welcome/Overview */}
      {step === 1 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center text-center animate-fade-in">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400 shrink-0">
            <Sparkles className="w-8 h-8 animate-pulse shrink-0" />
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight">Korean 3.5</h2>
          <h3 className="text-2xl font-extrabold text-brand-400 mt-2">Longer Stories & Paragraphs</h3>
          
          <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
            {metadata?.description || "Write and tell connected stories about familiar topics."}
          </p>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-white/5 text-left text-sm text-zinc-400 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-black">🎯 Objectives:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {(metadata?.goals || [
                "Organize your ideas into a beginning, middle, and end",
                "Write 8–10 sentence paragraphs on everyday topics",
                "Use linking words to make your stories clear and connected"
              ]).map((g: string, idx: number) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
            <p className="pt-2"><strong>⏱️ Estimated Time:</strong> {metadata?.estimated_minutes || 35} minutes</p>
            <p><strong>📋 Prerequisites:</strong> {metadata?.prerequisites || "Korean 3.4 – Opinions & Simple Arguments"}</p>
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
            <button 
              onClick={() => setStep(2)}
              className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl transition text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <span>Start Phase 5</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            
          </div>

          {showOutline && (
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 text-left text-xs text-zinc-400 space-y-2 animate-fade-in max-w-2xl mx-auto w-full font-mono">
              <p className="font-extrabold text-white text-center pb-2">Phase Activities Outline</p>
              <p>✓ Activity 1 – Paragraph & Story Structure Concepts</p>
              <p>✓ Activity 2 – Reading Comprehension & Sentence Highlighting</p>
              <p>✓ Activity 3 – Custom Paragraph Planner & AI feedback</p>
              <p>✓ Activity 4 – Structuring checkpoint quiz</p>
            </div>
          )}
        </div>
      )}

      {/* Screen 2: Concept Explanation */}
      {step === 2 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>Paragraph & Story Structure</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 2 of {totalSteps}</span>
          </div>

          <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/10 text-xs leading-relaxed text-zinc-300">
            <p className="font-bold text-white mb-1">B1 Writing Goal:</p>
            <p className="italic">
              "At B1, you should be able to write simple connected texts on familiar topics—like your daily life, a trip, or a hobby—using a series of linked sentences."
            </p>
          </div>

          {/* Paragraph structural info */}
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 uppercase tracking-widest block text-left font-black">The Three-Part Structure:</label>
            <div className="space-y-1.5">
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 text-left text-xs">
                <span className="text-brand-400 font-bold block mb-1">1. Beginning (Topic Sentence)</span>
                <p className="text-zinc-400 text-[11px]">{coreData?.paragraph_structure_info?.beginning || "Topic sentence or introduction (who, what, where, when)."}</p>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 text-left text-xs">
                <span className="text-accent-teal font-bold block mb-1">2. Middle (Detail Sentences)</span>
                <p className="text-zinc-400 text-[11px]">{coreData?.paragraph_structure_info?.middle || "4–7 sentences with events, details, and examples (body)."}</p>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 text-left text-xs">
                <span className="text-amber-400 font-bold block mb-1">3. End (Conclusion)</span>
                <p className="text-zinc-400 text-[11px]">{coreData?.paragraph_structure_info?.end || "1–2 sentences with results, personal feelings, or a conclusion."}</p>
              </div>
            </div>
          </div>

          {/* Linking Words Grid */}
          <div className="space-y-2 text-left">
            <label className="text-[10px] text-zinc-500 uppercase tracking-widest block font-black">Linking Words & Categories:</label>
            <div className="grid grid-cols-3 gap-2">
              {coreData?.linking_words?.map((word: any, idx: number) => (
                <div key={idx} className="p-2 rounded-lg border border-white/5 bg-zinc-950 flex flex-col justify-between">
                  <span className="font-korean font-bold text-xs text-white">{word.ko}</span>
                  <span className="text-[9px] text-zinc-400 font-semibold">{word.en}</span>
                  <span className="text-[8px] text-zinc-600 block mt-1 font-mono uppercase">{word.category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Example Paragraph card */}
          {coreData?.example_paragraphs && coreData.example_paragraphs.length > 0 && (
            <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 space-y-2 text-xs text-left">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Example: {coreData.example_paragraphs[0].topic}</span>
              <p className="font-korean text-[11px] leading-relaxed text-zinc-200">
                <span className="border-b border-brand-400/50 pb-0.5 font-bold text-white">{coreData.example_paragraphs[0].highlights.topic_sentence}</span>{" "}
                {coreData.example_paragraphs[0].ko.replace(coreData.example_paragraphs[0].highlights.topic_sentence, "").replace(coreData.example_paragraphs[0].highlights.concluding_sentence, "")}
                <span className="border-b border-amber-400/50 pb-0.5 font-bold text-white">{coreData.example_paragraphs[0].highlights.concluding_sentence}</span>
              </p>
              <div className="mt-2 pt-2 border-t border-white/5 flex gap-2 flex-wrap">
                <span className="text-[9px] text-zinc-500">Highlighted Linking Words:</span>
                {coreData.example_paragraphs[0].highlights.linking_words.map((w: string, i: number) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/10 text-brand-400 font-mono text-[9px]">{w}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(1)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Start Activities <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 3: Activity 1: Reading & Structure check */}
      {step === 3 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 1 – Paragraph Analysis</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 3 of {totalSteps}</span>
          </div>

          {readingItems.length > 0 && (
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
              
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl space-y-2">
                <span className="text-[9px] text-brand-400 font-black uppercase tracking-wider block">Reading Paragraph</span>
                <p className="font-korean text-[13px] leading-relaxed text-white font-medium">{readingItems[readIdx]?.text}</p>
              </div>

              {/* Task 1: Identify Topic */}
              <div className="space-y-2">
                <p className="text-xs text-zinc-400 font-bold">1. What is the main topic of this paragraph?</p>
                <div className="flex flex-col gap-1.5">
                  {readingItems[readIdx]?.topic_options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => !activity1Checked && setSelectedTopicOption(opt)}
                      disabled={activity1Checked}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition ${
                        selectedTopicOption === opt
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task 2: Identify Topic Sentence */}
              <div className="space-y-2">
                <p className="text-xs text-zinc-400 font-bold">2. Which is the starting topic sentence?</p>
                <div className="flex flex-col gap-1.5">
                  {readingItems[readIdx]?.topic_sentence_candidates.map((sent: string) => (
                    <button
                      key={sent}
                      onClick={() => !activity1Checked && setSelectedTopicSentence(sent)}
                      disabled={activity1Checked}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold font-korean transition ${
                        selectedTopicSentence === sent
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/5 bg-zinc-950 text-zinc-300 hover:border-white/10"
                      }`}
                    >
                      {sent}
                    </button>
                  ))}
                </div>
              </div>

              {activity1Checked && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-xs text-zinc-400 max-w-sm mx-auto text-left animate-fade-in space-y-1">
                  <p className="font-extrabold text-white">{activity1Correct ? "✓ Analysis Completed Correctly!" : "✗ Some choices were incorrect."}</p>
                  <p>{readingItems[readIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {!activity1Checked ? (
                  <button
                    onClick={handleCheckActivity1}
                    disabled={!selectedTopicOption || !selectedTopicSentence}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Analysis
                  </button>
                ) : (
                  <button
                    onClick={handleNextActivity1}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next Paragraph
                  </button>
                )}
              </div>

            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(2)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(4)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Activity 2 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 4: Activity 2: Paragraph Planner */}
      {step === 4 && (
        <div className="glass-panel neon-border p-12 rounded-[2.5rem] shadow-2xl w-full space-y-8 flex-grow flex flex-col justify-center animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Activity 2 – Paragraph Planner</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 4 of {totalSteps}</span>
          </div>

          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left overflow-y-auto max-h-[350px] custom-scrollbar">
            {/* Step 1: Choose Topic */}
            <div>
              <label className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1.5">Step 1: Choose Story Topic</label>
              <div className="grid grid-cols-2 gap-2">
                {plannerTopics.map((topic: any) => (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSelectedTopic(topic.id);
                      setComposedKo("");
                      setComposedEn("");
                      setAiSuggestions([]);
                      setImprovedParagraphKo("");
                    }}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition flex items-center gap-2 justify-center ${
                      selectedTopic === topic.id 
                        ? "border-brand-500 bg-brand-500/10 text-white" 
                        : "border-white/5 bg-zinc-950 text-zinc-400"
                    }`}
                  >
                    {renderTopicIcon(topic.icon)}
                    <span>{topic.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Beginning (Topic Sentence) */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-brand-400 uppercase font-black tracking-wider block">Step 2: Beginning (Topic Sentence)</label>
              <textarea
                value={beginningText}
                onChange={(e) => setBeginningText(e.target.value)}
                placeholder="지난주에 저는 부산으로 짧은 여행을 갔습니다. (Write your introducing sentence...)"
                className="w-full bg-zinc-950/60 border border-white/5 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-korean"
                rows={2}
              />
            </div>

            {/* Step 3: Detail rows with connectors */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[9px] text-accent-teal uppercase font-black tracking-wider block">Step 3: Middle (Detail Sentences)</label>
                {details.length < 5 && (
                  <button onClick={handleAddDetailRow} className="text-[9px] text-brand-400 font-bold hover:underline cursor-pointer">+ Add Detail Row</button>
                )}
              </div>
              <div className="space-y-2">
                {details.map((detail, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={detail.connector}
                      onChange={(e) => handleUpdateDetail(idx, "connector", e.target.value)}
                      className="bg-zinc-950 border border-white/5 rounded-lg text-zinc-300 text-[11px] p-2 focus:outline-none focus:border-brand-500 font-korean"
                    >
                      <option value="">(No Connector)</option>
                      {linkingWords.map((w: any) => (
                        <option key={w.ko} value={w.ko}>{w.ko}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={detail.text}
                      onChange={(e) => handleUpdateDetail(idx, "text", e.target.value)}
                      placeholder="아침 일찍 기차를 탔습니다."
                      className="flex-grow bg-zinc-950/60 border border-white/5 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-brand-500 font-korean"
                    />
                    {details.length > 1 && (
                      <button onClick={() => handleRemoveDetailRow(idx)} className="text-red-500 hover:text-red-400 font-bold text-xs p-1">×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 4: End (Concluding Sentence) */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-amber-400 uppercase font-black tracking-wider block">Step 4: End (Concluding Sentence)</label>
              <textarea
                value={endText}
                onChange={(e) => setEndText(e.target.value)}
                placeholder="조금 피곤했지만 아주 행복한 하루였습니다. (Summarize your feeling or outcome...)"
                className="w-full bg-zinc-950/60 border border-white/5 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-korean"
                rows={2}
              />
            </div>

            {/* Actions to build paragraph */}
            <button
              onClick={handleBuildParagraph}
              disabled={building || !beginningText || !endText}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5"
            >
              {building ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Build Paragraph Flow"}
            </button>
          </div>

          {/* Composed Result & AI Suggestions */}
          {composedKo && (
            <div className="p-4 bg-zinc-950 rounded-xl border border-brand-500/20 text-center space-y-3 animate-fade-in overflow-y-auto max-h-[300px] custom-scrollbar">
              <div>
                <span className="text-[9px] text-brand-400 uppercase tracking-wider block font-black mb-1">Your Composed Paragraph:</span>
                <p className="font-korean text-sm text-white font-extrabold leading-relaxed">{composedKo}</p>
                <p className="text-xs text-zinc-400 mt-1">{composedEn}</p>
              </div>

              <div className="flex justify-center gap-2 pt-2 border-t border-white/5">
                <button onClick={() => playAudio(composedKo)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <Volume2 className="w-4 h-4" />
                  <span>Listen</span>
                </button>
                <button onClick={handleImproveParagraph} disabled={improving} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-brand-400 hover:text-brand-300 rounded-lg border border-brand-500/20 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  {improving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Improve with AI</span>
                </button>
                <button onClick={handleSaveParagraph} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <Save className="w-4 h-4" />
                  <span>Save story</span>
                </button>
              </div>

              {/* AI Improvement Result */}
              {improvedParagraphKo && (
                <div className="p-3.5 bg-zinc-900 rounded-xl border border-brand-500/15 text-left text-xs space-y-2 animate-fade-in">
                  <span className="text-[9px] text-brand-400 uppercase tracking-wider font-black block">AI Tutor Suggestions:</span>
                  <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1 text-[11px]">
                    {aiSuggestions.map((s, idx) => <li key={idx}>{s}</li>)}
                  </ul>
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <span className="text-[9px] text-zinc-500 font-black block uppercase mb-1">Recommended draft:</span>
                    <p className="font-korean text-white font-semibold leading-relaxed">{improvedParagraphKo}</p>
                  </div>
                </div>
              )}

              {/* Speaking practice */}
              <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-white/5 space-y-2 mt-2">
                <span className="text-[9px] text-zinc-500 tracking-wider block font-black text-left">Pronunciation Practice:</span>
                <div className="flex justify-between items-center gap-3">
                  <button
                    onClick={handleStartRecording}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      recording 
                        ? "bg-red-500 text-white animate-pulse" 
                        : "bg-brand-500 hover:bg-brand-600 text-white"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>{recording ? "Recording..." : "Read Paragraph Aloud"}</span>
                  </button>
                  {speakingChecked && (
                    <div className="text-right">
                      <span className="text-xs font-bold text-accent-teal block">Accuracy: {speakingScore}%</span>
                      <span className="text-[9px] text-zinc-400 block leading-tight">{speakingFeedback}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setStep(3)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(5)} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer">Move to Mini-Quiz <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Screen 5: Mini-Quiz */}
      {step === 5 && (
        <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span>Phase Checkpoint Quiz</span>
            </h2>
            <span className="text-xs text-zinc-500 font-bold">Step 5 of {totalSteps}</span>
          </div>

          {quizBlueprint.length > 0 && (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>Quiz Question {quizIdx + 1} of {quizBlueprint.length}</span>
                <span>Level: B1 Paragraphs</span>
              </div>

              <h3 className="text-base font-black text-white text-center leading-relaxed whitespace-pre-line">
                {quizBlueprint[quizIdx]?.question}
              </h3>

              <div className="grid grid-cols-1 gap-2.5 max-w-sm mx-auto">
                {quizBlueprint[quizIdx]?.options?.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => !quizChecked && setQuizSelectedOpt(opt)}
                    disabled={quizChecked}
                    className={`p-3.5 rounded-xl border text-left text-xs font-bold transition ${
                      quizSelectedOpt === opt
                        ? "border-brand-500 bg-brand-500/10 text-white"
                        : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                    } ${quizChecked && opt === quizBlueprint[quizIdx]?.correct_answer ? "border-accent-teal bg-accent-teal/10 text-white" : ""}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {quizChecked && (
                <div className={`p-4 rounded-xl border text-xs text-left space-y-1 ${
                  quizCorrect ? "bg-accent-teal/5 border-accent-teal/20 text-accent-teal animate-fade-in" : "bg-red-500/5 border-red-500/10 text-red-400 animate-fade-in"
                }`}>
                  <p className="font-extrabold">{quizCorrect ? "✓ Correct! Brilliant." : "✗ Incorrect."}</p>
                  <p>{quizBlueprint[quizIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button onClick={() => setStep(4)} className="glass-panel px-5 py-3 rounded-xl hover:bg-white/5 text-zinc-400 text-sm font-bold transition flex items-center gap-2 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                {!quizChecked ? (
                  <button
                    onClick={handleCheckQuiz}
                    disabled={!quizSelectedOpt}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizOrComplete}
                    disabled={finishingQuiz}
                    className="bg-accent-teal text-zinc-950 hover:bg-accent-teal/90 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {finishingQuiz ? <Loader2 className="w-4 h-4 animate-spin text-zinc-950" /> : (quizIdx < quizBlueprint.length - 1 ? "Next Item" : "See Final Score")}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 6: Complete Panel */}
      {step === 6 && (
        <div className="glass-panel neon-border p-8 rounded-3xl shadow-2xl w-full space-y-6 flex-grow flex flex-col justify-center text-center max-w-xl mx-auto">
          <div className="p-3 bg-brand-500/10 rounded-full border border-brand-500/25 w-fit mx-auto text-brand-400">
            <Award className="w-10 h-10 animate-bounce" />
          </div>
          
          <div>
            <h2 className="text-2xl font-black text-white font-sans">Korean 3.5 Writing Complete! 🇰🇷✨</h2>
            <p className="text-zinc-400 text-xs mt-1">You can now construct fully-fledged paragraphs and stories using intermediate B1 grammar.</p>
          </div>

          {/* Homework checklist */}
          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-white/5 text-left text-xs space-y-3 font-sans leading-relaxed">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-400 block font-sans">Interactive Homework List:</span>
            <div className="space-y-2">
              {homeworkItems.map((item: any) => {
                const checked = !!completedHomework[item.id];
                return (
                  <label key={item.id} className="flex items-start gap-3 p-2 bg-zinc-950/45 rounded-lg border border-white/[0.03] cursor-pointer hover:bg-zinc-950 transition">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleHomework(item.id, checked)}
                      className="mt-0.5 rounded border-white/10 text-brand-500 focus:ring-0 focus:ring-offset-0 bg-zinc-900"
                    />
                    <span className={`text-zinc-300 font-medium ${checked ? "line-through text-zinc-500" : ""}`}>{item.text}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Gwan-Sik Paragraphs AI Tutor Launcher */}
          <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-brand-400" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Tutor Gwan-Sik Roleplay</span>
                <span className="text-[10px] text-zinc-500 block">Start B1 roleplay dialogue about paragraphs and stories</span>
              </div>
            </div>
            {tutorSession ? (
              <div className="bg-zinc-900 p-3.5 rounded-xl border border-brand-500/20 text-left text-xs animate-fade-in">
                <span className="text-[9px] font-bold text-brand-400 block mb-1">Gwan-Sik:</span>
                <p className="font-korean text-white leading-relaxed">{tutorSession.opener}</p>
                <div className="mt-3 flex justify-end">
                  <a href={`/conversation/chat?session_id=${tutorSession.session_id}`} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-1.5 px-4 rounded-xl text-[10px] transition cursor-pointer">
                    Join Full Chat Room
                  </a>
                </div>
              </div>
            ) : (
              <button
                onClick={handleLaunchB1ParagraphsPractice}
                disabled={loadingTutor}
                className="w-full bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-brand-400 hover:text-brand-300 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingTutor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Initiate AI Roleplay session"}
              </button>
            )}
          </div>

          <button
            onClick={() => {
              onComplete();
            }}
            className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-zinc-950 font-black py-4 px-8 rounded-2xl transition text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/20 cursor-pointer"
          >
            <span>Finish Phase 5 & Return to Lessons</span>
            <ChevronRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      )}
    </div>
  );
}
