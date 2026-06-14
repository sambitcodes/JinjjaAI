"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Play, Video, Youtube, ListVideo, Sparkles, 
  ExternalLink, Compass, Star, ChevronLeft, ChevronRight, CheckCircle2, Loader2,
  BookOpen, BrainCircuit, HelpCircle, ArrowRight, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ensureAuthenticated, apiRequest } from "@/lib/api";

interface PlaylistItem {
  title: string;
  videoId: string;
  duration: string;
}

interface OnlineResource {
  id: string;
  title: string;
  channel: string;
  category: "Beginner Path" | "Grammar Focus" | "Listening & Speak" | "Vocabulary Hacks";
  description: string;
  avatar: string;
  bannerImage: string;
  playlist: PlaylistItem[];
}

interface TranscriptLine {
  text: string;
  start: number; // in seconds
  duration: number;
}

export default function OnlineMaterials() {
  const [resources, setResources] = useState<OnlineResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [featuredSummaries, setFeaturedSummaries] = useState<Record<string, string>>({});
  const [featuredSummaryLoading, setFeaturedSummaryLoading] = useState(false);
  
  // Page state: showCards matches user request to show cards first
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [selectedResource, setSelectedResource] = useState<OnlineResource | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string>("");
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>("");

  // Youtube Player & Teleprompter Sync
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const playerRef = useRef<any>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<any>(null);

  // Groq AI Help States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [selectedAiTab, setSelectedAiTab] = useState<"summary" | "explain" | "quiz">("summary");

  const categories = ["All", "Beginner Path", "Grammar Focus", "Listening & Speak", "Vocabulary Hacks"];

  const fetchOnlineMaterials = async () => {
    try {
      const user = await ensureAuthenticated();
      if (!user) return;
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/lessons/online`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const rawVideos = await response.json();
        
        // Group raw videos by playlist (or unique source_seed_id)
        const groups: Record<string, OnlineResource> = {};
        
        rawVideos.forEach((video: any, index: number) => {
          const seedId = video.source_seed_id || `seed_${index}`;
          const isPlaylist = !!video.yt_playlist_id;
          
          if (!groups[seedId]) {
            const banners = [
              "from-blue-600/20 via-zinc-900/90 to-zinc-950 hover:border-blue-500/40 hover:shadow-[0_0_35px_rgba(59,130,246,0.15)]",
              "from-amber-600/20 via-zinc-900/90 to-zinc-950 hover:border-amber-500/40 hover:shadow-[0_0_35px_rgba(245,158,11,0.15)]",
              "from-purple-600/20 via-zinc-900/90 to-zinc-950 hover:border-purple-500/40 hover:shadow-[0_0_35px_rgba(168,85,247,0.15)]",
              "from-teal-600/20 via-zinc-900/90 to-zinc-950 hover:border-teal-500/40 hover:shadow-[0_0_35px_rgba(20,184,166,0.15)]"
            ];
            const bannerImage = banners[Object.keys(groups).length % banners.length];
            
            let category: "Beginner Path" | "Grammar Focus" | "Listening & Speak" | "Vocabulary Hacks" = "Beginner Path";
            const topicsStr = (video.topics || []).join(" ").toLowerCase();
            if (topicsStr.includes("grammar")) {
              category = "Grammar Focus";
            } else if (topicsStr.includes("listen") || topicsStr.includes("speaking") || topicsStr.includes("pronunciation")) {
              category = "Listening & Speak";
            } else if (topicsStr.includes("vocab") || topicsStr.includes("words")) {
              category = "Vocabulary Hacks";
            }
            
            let groupTitle = video.channel_title;
            if (isPlaylist) {
              if (seedId.includes("grammar")) groupTitle = "Core Korean Grammar Masterclass";
              else if (seedId.includes("alphabet")) groupTitle = "Ultimate Hangeul Alphabet Course";
              else if (seedId.includes("vocabulary")) groupTitle = "Everyday Essential Korean Words";
              else if (seedId.includes("beginner")) groupTitle = "Go! Billy's Complete Beginner Path";
            } else {
              groupTitle = video.title;
            }
 
            groups[seedId] = {
              id: seedId,
              title: groupTitle,
              channel: video.channel_title,
              category,
              description: video.description || `Highly recommended study video series provided by ${video.channel_title} for practicing pronunciation, spacing, and sentence building structure.`,
              avatar: isPlaylist ? "📚" : "🎥",
              bannerImage,
              playlist: []
            };
          }
          
          groups[seedId].playlist.push({
            title: video.title,
            videoId: video.yt_video_id,
            duration: video.duration || "05:00"
          });
        });

        const groupedResources = Object.values(groups);
        
        // Add 3 more high-quality curated virtual playlists to expand resources
        groupedResources.push({
          id: "yt_ttmik_real_life_convos",
          title: "TTMIK Real Life Korean Conversations",
          channel: "Talk To Me In Korean",
          category: "Listening & Speak",
          description: "Learn natural everyday Korean conversations, common vocabulary, and sentence structures with native speakers.",
          avatar: "🗣️",
          bannerImage: "from-indigo-600/20 via-zinc-900/90 to-zinc-950 hover:border-indigo-500/40 hover:shadow-[0_0_35px_rgba(99,102,241,0.15)]",
          playlist: [
            { title: "Ordering Coffee & Customizing Drinks", videoId: "fS_a-R6pW_M", duration: "15:40" },
            { title: "Shopping in Myeongdong & Asking for Prices", videoId: "UaO77_3b7g8", duration: "18:25" },
            { title: "Getting a Taxi & Directions in Seoul", videoId: "zIwLPeRuQkM", duration: "14:45" },
            { title: "Conversing with Friends at a Café", videoId: "iYsq-Vij48Q", duration: "07:19" }
          ]
        });

        groupedResources.push({
          id: "yt_koreanclass101_vocab_hacks",
          title: "KoreanClass101 Weekly Vocabulary Hacks",
          channel: "KoreanClass101.com",
          category: "Vocabulary Hacks",
          description: "Supercharge your vocabulary retention with weekly high-yield words, essential verbs, and daily conversation patterns.",
          avatar: "💡",
          bannerImage: "from-pink-600/20 via-zinc-900/90 to-zinc-950 hover:border-pink-500/40 hover:shadow-[0_0_35px_rgba(236,72,153,0.15)]",
          playlist: [
            { title: "Top 25 Essential Korean Verbs", videoId: "WCmh1zWUXdE", duration: "29:38" },
            { title: "Must-Know Expressions for Beginners", videoId: "Cmvk3E3NThI", duration: "11:53" },
            { title: "Native vs. Sino Korean Numbers Hack", videoId: "UaO77_3b7g8", duration: "18:25" }
          ]
        });

        groupedResources.push({
          id: "yt_gobilly_pronunciation_clinic",
          title: "Go! Billy's Korean Pronunciation Clinic",
          channel: "Go! Billy Korean",
          category: "Listening & Speak",
          description: "Learn how to sound natural, Master Hangul pronunciation rules, double batchim, and sound assimilation rules.",
          avatar: "🎙️",
          bannerImage: "from-emerald-600/20 via-zinc-900/90 to-zinc-950 hover:border-emerald-500/40 hover:shadow-[0_0_35px_rgba(16,185,129,0.15)]",
          playlist: [
            { title: "Learn Hangul Sound Mechanics", videoId: "0ZhOeA0RD9o", duration: "1:03:22" },
            { title: "Conjugating Verbs and Sound Flow", videoId: "fKk4x856v1k", duration: "12:15" },
            { title: "Essential Particles Pronunciation Rules", videoId: "fS_a-R6pW_M", duration: "15:40" }
          ]
        });

        setResources(groupedResources);
      }
    } catch (err) {
      console.error("Failed to load online materials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineMaterials();
  }, []);

  // Fetch summary for featured course using llama AI model of groq
  useEffect(() => {
    const featuredResource = resources[featuredIndex];
    if (!featuredResource) return;
    
    // If summary is already cached in state, don't refetch
    if (featuredSummaries[featuredResource.id]) return;

    let isMounted = true;
    const fetchSummary = async () => {
      setFeaturedSummaryLoading(true);
      try {
        const response = await apiRequest("/lessons/online/ai-help", {
          method: "POST",
          body: JSON.stringify({
            video_title: featuredResource.title,
            studied_text: "",
            full_transcript: featuredResource.description,
            query_type: "featured_summary"
          })
        });
        if (response && response.result && isMounted) {
          setFeaturedSummaries(prev => ({
            ...prev,
            [featuredResource.id]: response.result
          }));
        }
      } catch (err) {
        console.error("Failed to generate featured course summary:", err);
      } finally {
        if (isMounted) {
          setFeaturedSummaryLoading(false);
        }
      }
    };

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [featuredIndex, resources]);

  // Generate simulated transcript lines based on videoId to run the highlights without heavy external APIs
  useEffect(() => {
    if (!activeVideoTitle) return;
    
    // Simulate interactive transcript teleprompter content with timed cues
    const mockPhrases = [
      "안녕하세요! (Hello!) Welcome back to HangeulAI study clinic.",
      "Today we are going to dive deep into conversational Korean structures.",
      "Pay attention to the spacing and particles (은/는 and 이/가) highlighted on screen.",
      "Let's repeat after Gwan-Sik to train the vowel mouth alignments.",
      "Keep practicing: practice makes perfect pronunciation control.",
      "Remember that native Sino-Korean numbers change based on counting units.",
      "Watch the video closely and take note of conversational honorific markers.",
      "Now, try to repeat the sentence structure: Subject + Object + Verb (SOV).",
      "Confidently apply these grammar hacks in the AI Tutor chats!",
      "Great job study partners! Keep up the amazing work."
    ];

    const lines: TranscriptLine[] = Array.from({ length: 40 }).map((_, idx) => {
      const phraseIdx = idx % mockPhrases.length;
      return {
        text: `${mockPhrases[phraseIdx]} [Marker: ${idx + 1}]`,
        start: idx * 8,
        duration: 7
      };
    });
    setTranscript(lines);
    setCurrentTime(0);
    setAiResponse("");
  }, [activeVideoId, activeVideoTitle]);

  // Handle YouTube iframe script integration for time tracking (Initialize player once)
  useEffect(() => {
    if (!showWorkspace || !activeVideoId) return;

    const win = window as any;
    if (!win.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }

    win.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    if (win.YT && win.YT.Player) {
      initPlayer();
    }

    function initPlayer() {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
      }
      playerRef.current = new win.YT.Player("youtube-iframe-player", {
        videoId: activeVideoId,
        playerVars: {
          autoplay: 0,
          rel: 0,
          enablejsapi: 1
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === win.YT.PlayerState.PLAYING) {
              startTrackingTime();
            } else {
              stopTrackingTime();
            }
          }
        }
      });
    }

    return () => {
      stopTrackingTime();
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [showWorkspace]);

  // Load new video when activeVideoId changes
  useEffect(() => {
    if (!showWorkspace || !activeVideoId) return;
    if (playerRef.current && typeof playerRef.current.loadVideoById === "function") {
      try {
        playerRef.current.loadVideoById(activeVideoId);
      } catch (err) {
        console.warn("Failed to load video via loadVideoById:", err);
      }
    }
  }, [activeVideoId]);

  const startTrackingTime = () => {
    stopTrackingTime();
    timerIntervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        
        // Auto scroll active teleprompter line into center
        const activeIdx = Math.floor(time / 8);
        const activeLineEl = document.getElementById(`line-${activeIdx}`);
        if (activeLineEl && transcriptContainerRef.current) {
          transcriptContainerRef.current.scrollTo({
            top: activeLineEl.offsetTop - (transcriptContainerRef.current.clientHeight / 2) + 20,
            behavior: "smooth"
          });
        }
      }
    }, 500);
  };

  const stopTrackingTime = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  // Request Groq AI Summary/Explanation/Quiz
  const handleRequestAiHelp = async (type: "summary" | "explain" | "quiz") => {
    setSelectedAiTab(type);
    setAiLoading(true);
    setAiResponse("");

    const studiedText = transcript
      .filter(line => line.start <= currentTime)
      .map(line => line.text)
      .join("\n");

    const fullTranscript = transcript.map(line => line.text).join("\n");

    try {
      const response = await apiRequest("/lessons/online/ai-help", {
        method: "POST",
        body: JSON.stringify({
          video_title: activeVideoTitle,
          studied_text: studiedText,
          full_transcript: fullTranscript,
          query_type: type
        })
      });

      if (response && response.result) {
        setAiResponse(response.result);
      } else if (response && response.error) {
        setAiResponse(`Failed: ${response.error}`);
      } else {
        setAiResponse("No response received from Gwan-Sik.");
      }
    } catch (err) {
      console.error(err);
      setAiResponse("Network error generating study help.");
    } finally {
      setAiLoading(false);
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesTab = activeTab === "All" || resource.category === activeTab;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          resource.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleSelectPlaylistCard = (resource: OnlineResource) => {
    setSelectedResource(resource);
    if (resource.playlist.length > 0) {
      setActiveVideoId(resource.playlist[0].videoId);
      setActiveVideoTitle(resource.playlist[0].title);
    }
    setShowWorkspace(true);
  };

  const handleSelectVideo = (resource: OnlineResource, videoId: string, videoTitle: string) => {
    setSelectedResource(resource);
    setActiveVideoId(videoId);
    setActiveVideoTitle(videoTitle);
  };

  const handleSeekToLine = (seconds: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    }
  };

  const parseInlineMarkdown = (text: string) => {
    if (!text) return "";
    const boldParts = text.split(/\*\*([^*]+)\*\*/g);
    return boldParts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <strong key={`b-${i}`} className="font-extrabold text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/5 mx-0.5 inline-block">
            {part}
          </strong>
        );
      }
      const italicParts = part.split(/\*([^*]+)\*/g);
      return italicParts.map((subPart, j) => {
        if (j % 2 === 1) {
          return (
            <em key={`i-${j}`} className="italic text-zinc-200 font-medium">
              {subPart}
            </em>
          );
        }
        return subPart;
      });
    });
  };

  const renderMarkdown = (md: string) => {
    if (!md) return null;
    const lines = md.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }
      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-sm md:text-base font-black text-white mt-4 mb-2 border-b border-white/10 pb-1.5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {trimmed.slice(2)}
          </h1>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-xs md:text-sm font-black text-zinc-100 mt-3 mb-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded bg-amber-500" />
            {trimmed.slice(3)}
          </h2>
        );
      }
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-xs md:text-sm font-extrabold text-amber-400 mt-2.5 mb-1.5">
            {trimmed.slice(4)}
          </h3>
        );
      }
      if (trimmed.startsWith("#### ")) {
        return (
          <h4 key={idx} className="text-[10px] md:text-xs font-black text-purple-400 uppercase tracking-widest mt-2 mb-1">
            {trimmed.slice(5)}
          </h4>
        );
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const content = trimmed.slice(2);
        return (
          <div key={idx} className="flex items-start gap-1.5 pl-3 my-1">
            <span className="text-amber-500 select-none mt-1">•</span>
            <span className="text-zinc-300 text-xs leading-relaxed">{parseInlineMarkdown(content)}</span>
          </div>
        );
      }
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-1.5 pl-3 my-1">
            <span className="text-amber-500 font-mono font-bold select-none text-[10px] mt-0.5">{numMatch[1]}.</span>
            <span className="text-zinc-300 text-xs leading-relaxed">{parseInlineMarkdown(numMatch[2])}</span>
          </div>
        );
      }
      return (
        <p key={idx} className="text-zinc-300 text-xs leading-relaxed my-1">
          {parseInlineMarkdown(trimmed)}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto" />
          <p className="text-zinc-500 text-sm font-bold">Connecting Online Study Hub...</p>
        </div>
      </div>
    );
  }

  // --- CARDS SELECTION VIEW ---
  if (!showWorkspace) {
    const featuredResource = resources[featuredIndex] || resources[0];

    return (
      <div className="min-h-screen text-foreground relative pb-16">
        {/* Background glowing decorations */}
        <div className="absolute -top-10 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-purple-500/10 to-indigo-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse duration-10000" />
        <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-cyan-500/10 to-blue-500/5 rounded-full blur-[160px] pointer-events-none animate-pulse duration-8000" />

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-red-950/20 via-zinc-900/60 to-zinc-950 p-6 md:p-8 mb-10 shadow-2xl transition-all hover:border-red-500/20 duration-500 group">
          {/* Glow orb */}
          <div className="absolute -right-10 -top-10 w-44 h-44 bg-red-500/15 rounded-full blur-3xl group-hover:scale-125 transition duration-700" />
          <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl group-hover:scale-125 transition duration-700" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3 max-w-xl text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-[10px] text-red-300 font-extrabold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                <span>Vault Repository</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                Online <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-400 to-red-500 font-black">Materials</span>
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Explore handpicked playlists, sync live transcripts, and query Gwan-Sik's Groq AI Helper for custom summaries and quizzes.
              </p>
            </div>
            
            <div className="flex gap-4 bg-zinc-950/60 p-4.5 rounded-2xl border border-white/5 shrink-0 w-full lg:w-auto justify-around shadow-inner backdrop-blur-sm">
              <div className="text-center px-4">
                <div className="text-3xl font-black text-white font-mono">{resources.length}</div>
                <div className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">Total Playlists</div>
              </div>
              <div className="w-px bg-white/5" />
              <div className="text-center px-4">
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400 font-mono">Live</div>
                <div className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">Transcription</div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Curated Playlists Carousel */}
        {featuredResource && (
          <div className="mb-10 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-zinc-950 via-zinc-900/50 to-zinc-950 p-6 md:p-8">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-red-500/10 to-transparent blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-4 max-w-2xl text-left">
                <div className="flex items-center gap-2">
                  <span className="bg-red-500/20 text-red-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-red-500/30">
                    Featured Course
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono font-bold">
                    {featuredResource.channel}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                  {featuredResource.title}
                </h2>
                {featuredSummaryLoading ? (
                  <div className="space-y-2 py-1 max-w-xl">
                    <div className="h-4 bg-zinc-800 rounded w-5/6 animate-pulse" />
                    <div className="h-4 bg-zinc-800 rounded w-4/5 animate-pulse" />
                    <div className="h-4 bg-zinc-800 rounded w-2/3 animate-pulse" />
                  </div>
                ) : (
                  <p className="text-zinc-300 text-xs md:text-sm leading-relaxed font-sans italic border-l-2 border-red-500/50 pl-3 max-w-2xl">
                    {featuredSummaries[featuredResource.id] || featuredResource.description}
                  </p>
                )}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleSelectPlaylistCard(featuredResource)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black py-2.5 px-6 rounded-xl shadow-lg shadow-red-600/20 transition cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Watch & Study Now</span>
                  </button>
                  <span className="text-xs text-zinc-500 font-bold">
                    Contains {featuredResource.playlist.length} curated lessons
                  </span>
                </div>
              </div>

              {/* Navigation Arrows for Carousel */}
              <div className="flex gap-2 self-end md:self-auto">
                <button
                  onClick={() => setFeaturedIndex(prev => (prev - 1 + resources.length) % resources.length)}
                  className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setFeaturedIndex(prev => (prev + 1) % resources.length)}
                  className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slides Indicator dots */}
            <div className="flex gap-1.5 justify-center mt-6">
              {resources.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFeaturedIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === featuredIndex ? "w-6 bg-red-500" : "w-1.5 bg-zinc-800 hover:bg-zinc-700"}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Controls: Category Selection & Search */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8 bg-zinc-900/20 p-4 rounded-3xl border border-white/5 backdrop-blur-sm">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => {
              const count = cat === "All" ? resources.length : resources.filter(r => r.category === cat).length;
              const isActive = activeTab === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? "bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-lg shadow-red-500/25 scale-105"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{cat.replace(" Path", "").replace(" Focus", "").replace(" Hacks", "")}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${isActive ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-500"}`}>
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
              placeholder="Search playlist or channel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-xs text-zinc-200 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/25 transition placeholder-zinc-600"
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
        >
          <AnimatePresence>
            {filteredResources.map((resource) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                key={resource.id}
                onClick={() => handleSelectPlaylistCard(resource)}
                className={`glass-panel rounded-3xl border border-white/5 overflow-hidden transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer bg-gradient-to-b ${resource.bannerImage}`}
              >
                <div className="p-6 flex flex-col justify-between h-full min-h-[220px]">
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-2xl p-2 bg-zinc-950/80 rounded-2xl border border-white/5">{resource.avatar}</span>
                      <span className="text-[9px] bg-zinc-950/60 border border-white/5 px-2.5 py-1 rounded-full text-zinc-400 font-black uppercase">
                        {resource.category}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white tracking-tight leading-snug">{resource.title}</h3>
                      <p className="text-[10px] text-zinc-500 font-semibold">{resource.channel}</p>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">{resource.description}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-black text-zinc-400">
                    <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {resource.playlist.length} lessons
                    </span>
                    <span className="flex items-center gap-1 text-zinc-400 hover:text-white transition">
                      Launch Playlist <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // --- PLAYER & TRANSLATION WORKSPACE VIEW ---
  return (
    <div className="min-h-screen text-foreground relative pb-16">
      {/* Background glowing decorations */}
      <div className="absolute -top-10 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-purple-500/10 to-indigo-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-cyan-500/10 to-blue-500/5 rounded-full blur-[160px] pointer-events-none animate-pulse duration-8000" />
      
      {/* Top Header Controls */}
      <header className="flex justify-between items-center pb-4 mb-6 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowWorkspace(false)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-white/10 text-xs font-black transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Playlists Selection</span>
          </button>
          <div className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider bg-zinc-950/40 px-3 py-1.5 rounded-lg border border-white/5">
            Active Course: {selectedResource?.title}
          </div>
        </div>
      </header>

      {selectedResource && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
          
          {/* Left Column: Embed Player + Live Transcript Teleprompter */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-video w-full rounded-3xl border border-white/10 overflow-hidden bg-black shadow-2xl">
              <div
                id="youtube-iframe-player"
                className="w-full h-full border-0"
              />
            </div>
            
            <div className="glass-panel p-5 rounded-3xl border border-white/5 bg-zinc-900/20 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Now Playing
                </span>
                <span className="text-xs text-zinc-500 font-mono font-bold">
                  Source: {selectedResource.channel}
                </span>
              </div>
              <h2 className="text-lg font-black text-white leading-snug text-left">{activeVideoTitle}</h2>
              <p className="text-zinc-400 text-xs leading-relaxed text-left">{selectedResource.description}</p>
            </div>

            {/* Live Transcript Teleprompter Block */}
            <div className="glass-panel p-5 rounded-3xl border border-white/5 bg-zinc-900/20 space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Live Study Transcript Teleprompter</h3>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Click line to seek video</span>
              </div>
              
              {/* Fade masks for visual polish */}
              <div className="absolute left-0 right-0 top-[52px] h-8 bg-gradient-to-b from-zinc-950/40 to-transparent pointer-events-none z-10" />
              <div className="absolute left-0 right-0 bottom-4 h-8 bg-gradient-to-t from-zinc-950/40 to-transparent pointer-events-none z-10" />

              <div 
                ref={transcriptContainerRef}
                className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 flex flex-col justify-start relative pt-4 pb-4"
              >
                {transcript.map((line, idx) => {
                  const isActive = currentTime >= line.start && currentTime < line.start + 8;
                  return (
                    <div
                      key={idx}
                      id={`line-${idx}`}
                      onClick={() => handleSeekToLine(line.start)}
                      className={`p-3 rounded-2xl border text-xs font-semibold leading-relaxed transition-all duration-300 cursor-pointer flex justify-between items-center gap-4 ${
                        isActive 
                          ? "border-red-500 bg-gradient-to-r from-red-950/30 to-zinc-900/30 text-white font-extrabold scale-[1.01] shadow-lg shadow-red-500/10" 
                          : "border-white/5 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 text-left">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? "bg-red-500 animate-pulse" : "bg-zinc-700"}`} />
                        <span>{line.text}</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold shrink-0 px-2 py-0.5 rounded-md ${isActive ? "bg-red-500/20 text-red-400" : "bg-zinc-900 text-zinc-500"}`}>
                        {Math.floor(line.start / 60)}:{(line.start % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Playlist Navigation + Groq AI Help Clinic */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Playlist Chapter Tracks */}
            <div className="glass-panel p-5 rounded-3xl border border-white/5 bg-zinc-900/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedResource.avatar}</span>
                  <div className="min-w-0 text-left">
                    <h3 className="font-black text-sm text-white truncate">{selectedResource.title}</h3>
                    <p className="text-[10px] text-zinc-500 font-semibold">{selectedResource.channel}</p>
                  </div>
                </div>
                <span className="text-[9px] bg-white/5 border border-white/5 px-2.5 py-1 rounded-full text-zinc-400 font-black uppercase shrink-0">
                  {selectedResource.category}
                </span>
              </div>
              
              <div className="border-t border-white/5 pt-3">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block mb-2 text-left">Playlist Chapters</span>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {selectedResource.playlist.map((video) => {
                    const isActive = video.videoId === activeVideoId;
                    return (
                      <button
                        key={video.videoId}
                        onClick={() => handleSelectVideo(selectedResource, video.videoId, video.title)}
                        className={`w-full p-3 rounded-2xl border text-left text-xs transition flex items-center justify-between gap-3 cursor-pointer ${
                          isActive 
                            ? "border-red-500/40 bg-red-500/5 text-white font-extrabold" 
                            : "border-white/5 bg-zinc-950/40 hover:bg-white/5 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isActive ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-zinc-900 text-zinc-500"}`}>
                            {isActive ? <Play className="w-3 h-3 fill-current" /> : <Video className="w-3 h-3" />}
                          </div>
                          <span className="truncate pr-2">{video.title}</span>
                        </div>
                        <span className="text-[9px] text-zinc-600 font-mono font-bold flex-shrink-0">{video.duration}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Groq AI Help Clinic */}
            <div className="glass-panel p-5 rounded-3xl border border-white/5 bg-zinc-900/10 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-black">
                  <BrainCircuit className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-widest">Gwan-Sik's Groq AI Helper</span>
                </div>
              </div>

              {/* AI Help Navigation Options */}
              <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => handleRequestAiHelp("summary")}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-[10px] font-black transition cursor-pointer ${
                    selectedAiTab === "summary" 
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Study Summary</span>
                </button>

                <button
                  onClick={() => handleRequestAiHelp("explain")}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-[10px] font-black transition cursor-pointer ${
                    selectedAiTab === "explain" 
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>Explain Topic</span>
                </button>

                <button
                  onClick={() => handleRequestAiHelp("quiz")}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-[10px] font-black transition cursor-pointer ${
                    selectedAiTab === "quiz" 
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Study Quiz</span>
                </button>
              </div>

              {/* Response Block */}
              <div className="bg-zinc-950/80 rounded-2xl border border-white/5 p-4 min-h-[140px] max-h-[240px] overflow-y-auto relative text-left">
                {aiLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/60 gap-2">
                    <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                    <span className="text-[10px] text-zinc-500 font-bold font-mono tracking-widest uppercase">Gwan-Sik is thinking...</span>
                  </div>
                ) : aiResponse ? (
                  <div className="prose prose-invert max-w-none text-xs text-zinc-300 leading-relaxed font-sans space-y-2">
                    {renderMarkdown(aiResponse)}
                  </div>
                ) : (
                  <div className="text-zinc-500 text-xs text-center py-10 font-bold">
                    Select one of the help tools above to get instant study summaries, detailed explanations, or custom grammar quizzes generated using Groq!
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

