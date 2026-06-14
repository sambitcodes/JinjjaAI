"use client";
 
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Send, Sparkles, ChevronLeft, ChevronRight, Mic, Loader2, Headphones, Volume2, Languages, Pause, BookOpen, Trash2, Sliders, Settings } from "lucide-react";
import { apiRequest, ensureAuthenticated, API_BASE_URL } from "../../lib/api";
 
interface Syllable {
  char: string;
  score: number;
  status: "correct" | "warning" | "incorrect";
}
 
interface Message {
  sender: "user" | "ai";
  text: string;
  displayedText?: string;
  correction?: string;
  grammarNotes?: string;
  englishTranslation?: string;
  showTranslation?: boolean;
  pronunciation?: {
    accuracy_score: number;
    syllables: Syllable[];
  };
}

export default function TutorChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("llama-3.3-70b-versatile");
  const [introOpen, setIntroOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [koVoices, setKoVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [enVoices, setEnVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedKoVoiceName, setSelectedKoVoiceName] = useState<string>("ko-KR-SunHiNeural");
  const [selectedEnVoiceName, setSelectedEnVoiceName] = useState<string>("en-US-AriaNeural");
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [currentSpeakingMsgIndex, setCurrentSpeakingMsgIndex] = useState<number | null>(null);
  const [currentSpeakingType, setCurrentSpeakingType] = useState<"reply" | "translation" | null>(null);
  const [isSpeakingActive, setIsSpeakingActive] = useState<boolean>(false);
  const [highlightCharRange, setHighlightCharRange] = useState<{ start: number; end: number } | null>(null);
  const [currentSpeakingWord, setCurrentSpeakingWord] = useState<string>("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [expandedFeedback, setExpandedFeedback] = useState<Record<number, boolean>>({});
  const [baseLanguage, setBaseLanguage] = useState<"korean" | "english">("korean");
  const [activePhraseIndex, setActivePhraseIndex] = useState(0);

  const loaderPhrases = [
    "가위 (Ga-wi) ✌️",
    "바위 (Ba-wi) ✊",
    "보 (Bo) ✋"
  ];

  useEffect(() => {
    if (!sending) return;
    const interval = setInterval(() => {
      setActivePhraseIndex((prev) => (prev + 1) % 3);
    }, 600);
    return () => clearInterval(interval);
  }, [sending]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserAvatar(localStorage.getItem("user_avatar"));
    }
  }, []);

  useEffect(() => {
    const loadSpeechVoices = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const allVoices = window.speechSynthesis.getVoices();
        
        // Filter Korean voices
        const filteredKo = allVoices.filter(
          (v) => v.lang.includes("ko-KR") || v.lang.includes("ko_KR")
        );
        setKoVoices(filteredKo);
        
        // Filter English voices
        const filteredEn = allVoices.filter(
          (v) => v.lang.includes("en-") || v.lang.includes("en_")
        );
        setEnVoices(filteredEn);

        // Pick default Korean voice
        if (filteredKo.length > 0) {
          const defaultMale = filteredKo.find((v) => {
            const name = v.name.toLowerCase();
            return (
              name.includes("minsu") ||
              name.includes("jinho") ||
              name.includes("minjun") ||
              name.includes("male") ||
              name.includes("남자")
            );
          }) || filteredKo[0];
          setSelectedKoVoiceName(prev => prev || defaultMale.name);
        }

        // Pick default English voice
        if (filteredEn.length > 0) {
          const defaultEn = filteredEn.find((v) => {
            const name = v.name.toLowerCase();
            return (
              name.includes("david") ||
              name.includes("google") ||
              name.includes("zira") ||
              name.includes("natural")
            );
          }) || filteredEn[0];
          setSelectedEnVoiceName(prev => prev || defaultEn.name);
        }
      }
    };

    loadSpeechVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadSpeechVoices;
    }
  }, []);

  // Microphone recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const toggleTranslation = (index: number) => {
    setMessages((prev) =>
      prev.map((msg, idx) =>
        idx === index ? { ...msg, showTranslation: !msg.showTranslation } : msg
      )
    );
  };

  const [conversations, setConversations] = useState<any[]>([]);

  const loadConversations = async (autoSelectLatest = true) => {
    try {
      const list = await apiRequest("/tutor/conversations");
      setConversations(list);
      
      if (list.length > 0 && autoSelectLatest && !convId) {
        await selectConversation(list[0].id);
      } else {
        if (list.length === 0) {
          handleNewConversation();
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setLoading(false);
    }
  };

  const selectConversation = async (id: string) => {
    try {
      setConvId(id);
      setLoading(true);
      const history = await apiRequest(`/tutor/conversations/${id}/messages`);
      setMessages(history);
    } catch (err) {
      console.error("Failed to load conversation history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setConvId(null);
    setMessages([]);
  };

  useEffect(() => {
    async function init() {
      const user = await ensureAuthenticated();
      if (!user) return;
      await loadConversations(true);
      try {
        const profile = await apiRequest("/progress/profile");
        if (profile && profile.avatar_base64) {
          setUserAvatar(profile.avatar_base64);
        }
      } catch (err) {
        console.error("Failed to load user avatar in tutor chat:", err);
      }
    }
    init();
  }, []);

  const handleSendMessage = async (textToSend: string = inputValue) => {
    const cleanedText = textToSend.trim();
    if (!cleanedText || sending) return;

    let activeConvId = convId;
    setSending(true);

    // Add User text message locally so it displays instantly!
    const userMessage: Message = { sender: "user", text: cleanedText };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    try {
      // Create dialogue session in DB only when there has been a real conversation!
      if (!activeConvId) {
        const topic = cleanedText.length > 25 ? cleanedText.slice(0, 25) + "..." : cleanedText;
        const conv = await apiRequest(`/tutor/conversations?topic=${encodeURIComponent(topic)}`, { method: "POST" });
        activeConvId = conv.id;
        setConvId(conv.id);
      }

      const res = await apiRequest(`/tutor/conversations/${activeConvId}/chat`, {
        method: "POST",
        body: JSON.stringify({
          message: cleanedText,
          model: selectedModel,
          base_language: baseLanguage
        }),
      });

      const aiReply: Message = {
        sender: "ai",
        text: res.reply,
        displayedText: "", // starts empty for typewriter streaming effect
        correction: res.correction || undefined,
        grammarNotes: res.grammar_notes || undefined,
        englishTranslation: res.english_translation || undefined,
        showTranslation: false,
      };
      setMessages((prev) => [...prev, aiReply]);

      // Progressive typewriter streaming simulator
      let currentText = "";
      let charIndex = 0;
      const textToType = res.reply;
      const interval = setInterval(() => {
        if (charIndex < textToType.length) {
          currentText += textToType[charIndex];
          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.sender === "ai") {
              lastMsg.displayedText = currentText;
            }
            return updated;
          });
          charIndex++;
        } else {
          clearInterval(interval);
        }
      }, 12);

      await loadConversations(false);
    } catch (err) {
      console.error("Chat message failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "죄송합니다. 서버 통신에 오류가 발생했습니다. 다시 시도해 주세요.",
          grammarNotes: `Error details: ${(err as Error).message}`
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  // Start HTML5 MediaRecorder recording from system mic
  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Build raw audio wav/webm blob from recorded frame chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await handleUploadAndTranscribeSpeech(audioBlob);
        
        // Stop all mic tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Could not access microphone. Please grant permission in browser settings.");
      console.error("Microphone access failed:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Upload audio file and transcribe conversational speech (English/Korean)
  const handleUploadAndTranscribeSpeech = async (audioBlob: Blob) => {
    setSending(true);
    
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "recording.webm");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/speech/stt`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData,
      });

      if (!response.ok) throw new Error("STT Transcription failed");
      const res = await response.json();
      const transcription = res.transcription;

      if (!transcription || !transcription.trim()) {
        alert("Could not hear anything clearly. Please try speaking again.");
        return;
      }

      // Automatically send the transcribed speech text to the AI Chatbot!
      await handleSendMessage(transcription);

    } catch (err) {
      console.error("Speech transcription error:", err);
      alert("Speech transcription failed. Backend models offline.");
    } finally {
      setSending(false);
    }
  };

  // Clean special characters and markdown punctuation from the spoken utterance text
  const cleanTextForSpeech = (text: string): string => {
    let cleaned = text.replace(/[*#`_\-\[\]()]/g, " ");
    cleaned = cleaned.replace(/[^가-힣a-zA-Z0-9\s.,?!]/g, " ");
    return cleaned.replace(/\s+/g, " ").trim();
  };

  // Segment text into Korean and English chunks to speak each segment with its respective native TTS engine!
  const segmentText = (text: string) => {
    const koreanRegex = /([\uac00-\ud7a3\u3130-\u318f]+[^ㄱ-ㅎㅏ-ㅣ가-힣]*)/g;
    
    interface SpeechSegment {
      text: string;
      lang: "ko-KR" | "en-US";
    }
    
    const segments: SpeechSegment[] = [];
    let lastIndex = 0;
    
    text.replace(koreanRegex, (match, offset) => {
      if (offset > lastIndex) {
        const engText = text.substring(lastIndex, offset).trim();
        if (engText) {
          segments.push({ text: engText, lang: "en-US" });
        }
      }
      segments.push({ text: match.trim(), lang: "ko-KR" });
      lastIndex = offset + match.length;
      return match;
    });
    
    if (lastIndex < text.length) {
      const remaining = text.substring(lastIndex).trim();
      if (remaining) {
        segments.push({ text: remaining, lang: "en-US" });
      }
    }
    
    return segments;
  };

  // Speak chatbot text using a bilingual segmented voice engine with Play/Pause snappiness, Speed Slider integration, and dynamic highlighting!
  const speakText = (text: string, index: number, type: "reply" | "translation", rateOverride?: number) => {
    if (typeof window !== "undefined") {
      // Toggle Play/Pause: if clicked while actively speaking this exact index & type, cancel and clean state snappily
      if (currentSpeakingMsgIndex === index && currentSpeakingType === type && isSpeakingActive && rateOverride === undefined) {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        if (activeAudioRef.current) {
          activeAudioRef.current.pause();
          activeAudioRef.current = null;
        }
        setIsSpeakingActive(false);
        setHighlightCharRange(null);
        setCurrentSpeakingWord("");
        setCurrentSpeakingMsgIndex(null);
        setCurrentSpeakingType(null);
        return;
      }

      const activeRate = rateOverride !== undefined ? rateOverride : speechSpeed;

      // Reset any active speech and initialize speaking state
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      setCurrentSpeakingMsgIndex(index);
      setCurrentSpeakingType(type);
      setIsSpeakingActive(true);
      setCurrentSpeakingWord("");
      
      const cleanedText = cleanTextForSpeech(text);

      const selectedVoiceName = type === "reply" 
        ? (baseLanguage === "english" ? selectedEnVoiceName : selectedKoVoiceName)
        : (baseLanguage === "english" ? selectedKoVoiceName : selectedEnVoiceName);

      // --- BYPASS BRANCH FOR GOOGLE ONLINE HIGH-FIDELITY TTS ---
      if (selectedVoiceName === "google-online" || !selectedVoiceName || selectedVoiceName.includes("Neural")) {
        const langCode = type === "reply"
          ? (baseLanguage === "english" ? "en" : "ko")
          : (baseLanguage === "english" ? "ko" : "en");

        const audioUrl = `${API_BASE_URL}/speech/tts?text=${encodeURIComponent(cleanedText)}&lang=${langCode}&voice=${encodeURIComponent(selectedVoiceName || "")}`;

        
        const audio = new Audio(audioUrl);
        audio.playbackRate = activeRate;
        activeAudioRef.current = audio;
        
        const words = cleanedText.split(/[\s.,?!]+/);
        
        audio.onplaying = () => {
          setIsSpeakingActive(true);
        };
        
        audio.ontimeupdate = () => {
          if (activeAudioRef.current !== audio || !audio.duration) return;
          
          const progress = audio.currentTime / audio.duration;
          const wordIdx = Math.min(
            Math.floor(progress * words.length),
            words.length - 1
          );
          
          let currentOffset = 0;
          for (let i = 0; i < wordIdx; i++) {
            currentOffset += words[i].length + 1;
          }
          
          const word = words[wordIdx];
          if (word) {
            setCurrentSpeakingWord(word);
            setHighlightCharRange({ start: currentOffset, end: currentOffset + word.length });
          }
        };
        
        const handleEnded = () => {
          if (activeAudioRef.current === audio) {
            activeAudioRef.current = null;
          }
          setIsSpeakingActive(false);
          setHighlightCharRange(null);
          setCurrentSpeakingWord("");
          setCurrentSpeakingMsgIndex(null);
          setCurrentSpeakingType(null);
        };
        
        audio.onended = handleEnded;
        audio.onerror = handleEnded;
        
        audio.play().catch(e => {
          console.error("Audio playback error:", e);
          handleEnded();
        });
        return;
      }

      if ("speechSynthesis" in window) {
        const segments = segmentText(cleanedText);
        const allVoices = window.speechSynthesis.getVoices();
        let accumLength = 0;
      
      segments.forEach((seg, segIdx) => {
        const utterance = new SpeechSynthesisUtterance(seg.text);
        utterance.lang = seg.lang;
        
        // Track offset boundaries relative to the original cleaned message string
        const segmentOffset = accumLength;
        accumLength += seg.text.length + 1; // +1 account for space/join gaps
        
        if (seg.lang === "ko-KR") {
          const activeVoice = allVoices.find((v) => v.name === selectedKoVoiceName);
          if (activeVoice) {
            utterance.voice = activeVoice;
          }
          utterance.rate = activeRate * 0.85;
        } else {
          const activeVoice = allVoices.find((v) => v.name === selectedEnVoiceName);
          if (activeVoice) {
            utterance.voice = activeVoice;
          } else {
            const engVoices = allVoices.filter((v) => v.lang.includes("en-") || v.lang.includes("en_"));
            if (engVoices.length > 0) {
              utterance.voice = engVoices[0];
            }
          }
          utterance.rate = activeRate * 0.9;
        }
        
        // Dynamic Word Highlight tracking
        utterance.onboundary = (event) => {
          if (event.name === "word") {
            const word = seg.text.substring(event.charIndex).split(/[\s.,?!]+/)[0];
            if (word) {
              setCurrentSpeakingWord(word);
            }
            const start = segmentOffset + event.charIndex;
            const length = event.charLength || 5;
            setHighlightCharRange({ start, end: start + length });
          }
        };
        
        if (segIdx === 0) {
          utterance.onstart = () => {
            setIsSpeakingActive(true);
          };
        }
        
        if (segIdx === segments.length - 1) {
          const cleanupSpeakState = () => {
            setIsSpeakingActive(false);
            setHighlightCharRange(null);
            setCurrentSpeakingWord("");
            setCurrentSpeakingMsgIndex(null);
            setCurrentSpeakingType(null);
          };
          utterance.onend = cleanupSpeakState;
          utterance.onerror = cleanupSpeakState;
        }
        
        window.speechSynthesis.speak(utterance);
      });
    }
  }
};

  const handleSpeedChange = (newSpeed: number) => {
    setSpeechSpeed(newSpeed);
    if (isSpeakingActive && currentSpeakingMsgIndex !== null && currentSpeakingType !== null) {
      const msg = messages[currentSpeakingMsgIndex];
      if (msg) {
        const text = currentSpeakingType === "translation" ? msg.englishTranslation! : msg.text;
        speakText(text, currentSpeakingMsgIndex, currentSpeakingType, newSpeed);
      }
    }
  };

  const renderHighlightedText = (text: string, isSpeakingThis: boolean) => {
    if (!text) return null;
    if (!isSpeakingThis || !currentSpeakingWord) {
      return <span className="font-korean leading-relaxed tracking-wide">{text}</span>;
    }
    
    // Split the text around the spoken word, ignoring punctuation/casing
    const escapedWord = currentSpeakingWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    let regex: RegExp;
    try {
      regex = new RegExp(`(?<=^|[^a-zA-Z0-9_가-힣])(${escapedWord})(?=[^a-zA-Z0-9_가-힣]|$)`, 'i');
    } catch (e) {
      regex = new RegExp(`(${escapedWord})`, 'i');
    }
    
    // Fallback if no exact regex match exists
    if (!regex.test(text)) {
      const simpleRegex = new RegExp(`(${escapedWord})`, 'i');
      if (!simpleRegex.test(text)) {
        return <span className="font-korean leading-relaxed tracking-wide">{text}</span>;
      }
      const parts = text.split(simpleRegex);
      return (
        <span className="font-korean leading-relaxed tracking-wide">
          {parts.map((part, i) => 
            simpleRegex.test(part) ? (
              <span key={i} className="bg-brand-gold/30 text-yellow-200 font-extrabold px-1.5 py-0.5 rounded shadow-lg border border-brand-gold/40 animate-pulse transition duration-150">
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </span>
      );
    }
    
    const parts = text.split(regex);
    
    return (
      <span className="font-korean leading-relaxed tracking-wide">
        {parts.map((part, i) => 
          regex.test(part) ? (
            <span key={i} className="bg-brand-gold/30 text-yellow-200 font-extrabold px-1.5 py-0.5 rounded shadow-lg border border-brand-gold/40 animate-pulse transition duration-150">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  // Custom Dropdown Select Component
  const CustomSelect = ({ 
    label, 
    value, 
    onChange, 
    options, 
    accentClass = "text-brand-300"
  }: { 
    label: string; 
    value: string; 
    onChange: (val: string) => void; 
    options: { value: string; label: string }[];
    accentClass?: string;
  }) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      const clickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", clickOutside);
      return () => document.removeEventListener("mousedown", clickOutside);
    }, []);

    const currentOpt = options.find(o => o.value === value) || options.find(o => o.value === parseFloat(value).toString());

    return (
      <div className="relative flex-1 min-w-[185px]" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full bg-zinc-950/80 border border-white/10 hover:border-brand-500/40 px-3.5 py-2 rounded-xl transition duration-150 text-xs font-bold text-zinc-400 hover:text-white cursor-pointer select-none shadow-md"
        >
          <div className="flex items-center space-x-2 truncate">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold">{label}:</span>
            <span className={`font-black truncate max-w-[125px] ${accentClass}`}>{currentOpt?.label || value}</span>
          </div>
          <span className={`transition-transform duration-200 text-[10px] opacity-70 ${open ? 'rotate-180' : 'rotate-0'} ml-1`}>▼</span>
        </button>
        
        {open && (
          <div className="absolute left-0 mt-2 z-[99] w-full min-w-[200px] bg-zinc-950/95 border border-white/10 p-2 rounded-2xl shadow-2xl backdrop-blur-xl animate-fade-in flex flex-col gap-1">
            {options.map((opt) => {
              const isSelected = opt.value === value || parseFloat(opt.value) === parseFloat(value);
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-center px-4 py-2.5 text-xs font-black rounded-xl transition-all duration-150 cursor-pointer ${
                    isSelected 
                      ? "bg-brand-500/25 text-white border border-brand-500/30" 
                      : "text-zinc-400 hover:text-white hover:bg-white/5 hover:scale-[1.02]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-foreground bg-zinc-950">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground w-full flex bg-transparent relative overflow-hidden">

      {/* Background glowing decorations */}
      <div className="absolute -top-10 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-purple-500/10 to-indigo-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-cyan-500/10 to-blue-500/5 rounded-full blur-[160px] pointer-events-none animate-pulse duration-8000" />

      {/* Dialogue Session Library Sidebar */}
      {sidebarOpen && (
        <aside className="w-80 border-r border-white/5 bg-zinc-950/80 p-5 flex flex-col justify-between hidden lg:flex flex-shrink-0 h-screen sticky top-0 transition-all duration-300 animate-fade-in z-10">
          <div className="space-y-6 flex-grow overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2 font-black text-sm text-zinc-300">
                <BookOpen className="w-4 h-4 text-brand-400" />
                <span>Dialogue Sessions (관식 대화)</span>
              </div>
              <span className="text-[10px] bg-brand-500/10 text-brand-400 font-extrabold px-2 py-0.5 rounded border border-brand-500/20 font-mono">
                {conversations.length} Active
              </span>
            </div>

            <button
              onClick={handleNewConversation}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-extrabold py-3 px-4 rounded-xl transition duration-200 shadow-md shadow-brand-500/10 active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>New Dialogue Session</span>
            </button>

            <div className="space-y-2.5">
              {!convId && (
                <div className="p-3.5 rounded-xl border bg-brand-500/10 border-brand-500/30 text-white font-bold animate-pulse flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs tracking-wide">New Dialogue (새 대화)</span>
                    <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">Unsaved (Draft)</span>
                </div>
              )}
              {conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col gap-1.5 ${
                    c.id === convId
                      ? "bg-brand-500/10 border-brand-500/30 text-white font-bold"
                      : "bg-zinc-900/40 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs tracking-wide flex-grow">{c.topic}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this dialogue session?")) {
                            try {
                              const token = localStorage.getItem("token");
                              const response = await fetch(`${API_BASE_URL}/tutor/conversations/${c.id}`, {
                                method: "DELETE",
                                headers: {
                                  ...(token ? { Authorization: `Bearer ${token}` } : {})
                                }
                              });
                              if (!response.ok) throw new Error("Failed to delete conversation");
                              
                              if (c.id === convId) {
                                setConvId(null);
                                setMessages([]);
                              }
                              await loadConversations(true);
                            } catch (err) {
                              console.error("Delete conversation failed:", err);
                              alert("Could not delete dialogue session.");
                            }
                          }
                        }}
                        className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-white/10 transition cursor-pointer"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(c.started_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </aside>
      )}

      {/* Main Active Chat Area */}
      <div className="flex-grow flex flex-col justify-between max-w-5xl mx-auto p-4 lg:p-8 bg-zinc-950/80 border-x border-white/5 backdrop-blur-3xl shadow-2xl h-screen overflow-y-auto z-10 relative">
        <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-950/20 via-zinc-900/60 to-zinc-950 p-6 shadow-2xl mb-6 flex flex-col gap-4 group">
          {/* Glow orbs */}
          <div className="absolute -right-10 -top-10 w-44 h-44 bg-purple-500/15 rounded-full blur-3xl group-hover:scale-125 transition duration-700" />
          <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl group-hover:scale-125 transition duration-700" />

          {/* Top Line: Back, Toggle, Gwan-Sik metadata */}
          <div className="relative z-10 flex justify-between items-center w-full">
            <div className="flex items-center space-x-3 flex-shrink-0">
              <Link href="/dashboard" className="glass-panel p-2.5 rounded-xl hover:bg-white/5 transition flex items-center justify-center" title="Back to Dashboard">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="glass-panel p-2.5 rounded-xl hover:bg-white/5 transition text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                title={sidebarOpen ? "Collapse Sessions Library" : "Expand Sessions Library"}
              >
                <BookOpen className="w-5 h-5 text-brand-400" />
              </button>
              {/* Circular Avatar */}
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-brand-500/30 flex-shrink-0 shadow-lg">
                <img src="/parkbogum.jpg" alt="Gwan-Sik" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="font-extrabold text-xl flex items-center gap-2">
                  <span className="text-white">Gwan-Sik (관식)</span>
                  <Sparkles className="w-4 h-4 text-brand-400 animate-pulse-slow" />
                  {/* Audio active equalizer visualizer */}
                  {isSpeakingActive && (
                    <div className="flex items-center gap-0.5 ml-2 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-[9px] text-brand-400 font-extrabold uppercase animate-pulse">
                      <div className="w-0.5 h-2.5 bg-brand-400 animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-0.5 h-3.5 bg-brand-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <div className="w-0.5 h-2 bg-brand-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
                      <span className="ml-1.5 tracking-wider text-[8px]">Speaking</span>
                    </div>
                  )}
                </h2>
                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Bilingual Korean Tutor</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-zinc-950/60 px-3 py-1.5 rounded-lg border border-white/5">
                <span className={`h-2.5 w-2.5 rounded-full bg-brand-500 animate-pulse`} />
                <span className="text-xs text-zinc-400 font-bold font-mono tracking-wider">
                  Groq API
                </span>
              </div>
              
              <button 
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                className={`glass-panel p-2.5 rounded-xl transition flex items-center justify-center cursor-pointer ${
                  rightSidebarOpen ? 'bg-brand-500/15 border-brand-500/40 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title={rightSidebarOpen ? "Collapse Tutor Settings" : "Expand Tutor Settings"}
              >
                <Sliders className="w-5 h-5 text-brand-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Collapsible Tutor Intro Section */}
        <div className="mt-4 transition-all duration-300">
          {introOpen ? (
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-950/20 via-zinc-900/60 to-zinc-950 p-6 shadow-2xl transition-all duration-300 group animate-fade-in">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-125 transition duration-700 pointer-events-none" />
              <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-125 transition duration-700 pointer-events-none" />
              
              <div className="relative z-10 flex justify-between items-start gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-brand-gold font-extrabold text-sm">
                    <Sparkles className="w-4 h-4 animate-pulse-slow" />
                    <span>진짜 AI Tutor: Meet Gwan-Sik! 🇰🇷✨</span>
                  </div>
                  <h3 className="font-extrabold text-base md:text-lg text-white leading-tight font-korean">
                    안녕하세요! Welcome, dynamic language explorer! Let's study together! 같이 공부해요! 🤝
                  </h3>
                  <p className="text-zinc-300 text-xs md:text-sm leading-relaxed max-w-3xl font-korean">
                    I am **Gwan-Sik (관식)**, your personal bilingual buddy. 
                    Whether you want to refine your vocabulary, master daily conjugations, or level up your speech alignment, I am here to make your journey absolutely **대박 (awesome)**! Let's chat! 🚀
                  </p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1.5 pt-1 text-[11px] text-zinc-400 font-bold font-korean">
                    <div className="flex items-center gap-1.5">
                      <span className="text-accent-teal font-extrabold">✓</span>
                      <span>Hold Mic to talk naturally (말해보세요)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-accent-pink font-extrabold">✓</span>
                      <span>Get instant syntax breakdowns (문법 피드백)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-brand-gold font-extrabold">✓</span>
                      <span>Compare speech alignment (발음 분석)</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIntroOpen(false)}
                  className="text-zinc-500 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition flex-shrink-0 border border-white/5 bg-zinc-900/50 cursor-pointer"
                  title="Collapse Intro"
                >
                  <ChevronLeft className="w-4.5 h-4.5 rotate-90" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button 
                onClick={() => setIntroOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/90 border border-white/5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition shadow-md cursor-pointer"
                title="Expand Gwan-Sik Intro"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span className="font-korean">Show Tutor Introduction (관식 소개)</span>
                <ChevronLeft className="w-4 h-4 -rotate-90 ml-1 text-zinc-500" />
              </button>
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <main className="flex-grow my-6 overflow-y-auto space-y-6 max-h-[55vh] pr-2 select-text">
          {messages.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} animate-fade-in`}>
              <div className="flex items-start gap-3 max-w-xl group">
                
                {/* Avatar next to AI bubble */}
                {msg.sender === "ai" && (
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-brand-500/20 flex-shrink-0 mt-1 shadow-md hover:scale-105 transition-all">
                    <img src="/parkbogum.jpg" alt="Gwan-Sik" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* User Avatar next to user bubble */}
                {msg.sender === "user" && (
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-brand-500/30 flex-shrink-0 mt-1 shadow-md order-last ml-2 hover:scale-105 transition-all">
                    {userAvatar ? (
                      <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 flex items-center justify-center font-bold text-xs">
                        🇰🇷
                      </div>
                    )}
                  </div>
                )}

                 {/* Voice speak and Translate buttons for AI replies */}
                {msg.sender === "ai" && (
                  <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                    {/* Primary Reply Speaker Button */}
                    <button
                      onClick={() => speakText(msg.text, index, "reply")}
                      className={`p-2 rounded-lg border transition cursor-pointer flex flex-col items-center justify-center relative ${
                        currentSpeakingMsgIndex === index &&
                        currentSpeakingType === "reply" &&
                        isSpeakingActive
                          ? "bg-brand-gold/20 border-brand-gold/30 text-yellow-300 animate-pulse animate-float"
                          : "bg-zinc-900 border-white/5 text-zinc-500 hover:text-white hover:border-white/10"
                      }`}
                      title={
                        currentSpeakingMsgIndex === index &&
                        currentSpeakingType === "reply" &&
                        isSpeakingActive
                          ? `Pause ${baseLanguage === "english" ? "English" : "Korean"} Speech`
                          : `Speak ${baseLanguage === "english" ? "English" : "Korean"} Reply`
                      }
                    >
                      {currentSpeakingMsgIndex === index &&
                      currentSpeakingType === "reply" &&
                      isSpeakingActive ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-brand-400" />
                      )}
                      <span className="text-[8px] font-mono mt-0.5 text-zinc-500 font-bold uppercase">
                        {baseLanguage === "english" ? "EN" : "KO"}
                      </span>
                    </button>

                    {/* Translation Speaker Button */}
                    {msg.englishTranslation && (
                      <button
                        onClick={() => speakText(msg.englishTranslation!, index, "translation")}
                        className={`p-2 rounded-lg border transition cursor-pointer flex flex-col items-center justify-center relative ${
                          currentSpeakingMsgIndex === index &&
                          currentSpeakingType === "translation" &&
                          isSpeakingActive
                            ? "bg-brand-gold/20 border-brand-gold/30 text-yellow-300 animate-pulse animate-float"
                            : "bg-zinc-900 border-white/5 text-zinc-500 hover:text-white hover:border-white/10"
                        }`}
                        title={
                          currentSpeakingMsgIndex === index &&
                          currentSpeakingType === "translation" &&
                          isSpeakingActive
                            ? `Pause ${baseLanguage === "english" ? "Korean" : "English"} Speech`
                            : `Speak ${baseLanguage === "english" ? "Korean" : "English"} Translation`
                        }
                      >
                        {currentSpeakingMsgIndex === index &&
                        currentSpeakingType === "translation" &&
                        isSpeakingActive ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-accent-teal" />
                        )}
                        <span className="text-[8px] font-mono mt-0.5 text-zinc-500 font-bold uppercase">
                          {baseLanguage === "english" ? "KO" : "EN"}
                        </span>
                      </button>
                    )}

                    {msg.englishTranslation && (
                      <button
                        onClick={() => toggleTranslation(index)}
                        className={`p-2 rounded-lg border transition cursor-pointer ${
                          msg.showTranslation 
                            ? "bg-accent-teal/20 border-accent-teal/30 text-accent-teal" 
                            : "bg-zinc-900 border-white/5 text-zinc-500 hover:text-white hover:border-white/10"
                        }`}
                        title={baseLanguage === "english" ? "Translate to Korean" : "Translate to English"}
                      >
                        <Languages className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* Stylish Premium Chat Bubbles */}
                <div className={`rounded-2xl p-4.5 shadow-xl transition-all duration-300 hover:shadow-2xl ${
                  msg.sender === "user" 
                    ? "bg-gradient-to-r from-brand-gold to-amber-500 text-zinc-950 rounded-tr-none shadow-brand-gold/25 border border-brand-gold/30 font-extrabold scale-98 hover:scale-100" 
                    : "glass-panel border border-white/10 text-zinc-100 rounded-tl-none hover:bg-zinc-900/80 scale-98 hover:scale-100"
                }`}>
                  <p className="text-base leading-relaxed font-korean font-medium tracking-wide">
                    {renderHighlightedText(
                      msg.displayedText !== undefined ? msg.displayedText : msg.text,
                      currentSpeakingMsgIndex === index && currentSpeakingType === "reply"
                    )}
                  </p>
                  {msg.sender === "ai" && msg.englishTranslation && msg.showTranslation && (
                    <div className="mt-3.5 pt-3.5 border-t border-white/10 text-sm text-zinc-400 font-sans italic leading-relaxed animate-fade-in">
                      <span className="block text-[10px] text-accent-teal uppercase tracking-wider font-extrabold not-italic mb-1 font-mono">
                        {baseLanguage === "english" ? "Korean Translation" : "English Translation"}
                      </span>
                      {renderHighlightedText(
                        msg.englishTranslation,
                        currentSpeakingMsgIndex === index && currentSpeakingType === "translation"
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Show tutor helper notes inside an expandable/collapsible drawer nested below */}
              {msg.sender === "ai" && (msg.correction || msg.grammarNotes) && (
                <div className="ml-12 mt-2 flex flex-col items-start gap-1">
                  <button
                    onClick={() => setExpandedFeedback(prev => ({ ...prev, [index]: !prev[index] }))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-900 border border-white/10 text-[9px] font-black uppercase tracking-wider text-zinc-400 hover:text-white transition cursor-pointer shadow hover:scale-102"
                  >
                    <span>{expandedFeedback[index] ? "Hide" : "Show"} Corrections & Grammar Hub</span>
                    <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${expandedFeedback[index] ? "rotate-90" : "rotate-0"}`} />
                  </button>
                  
                  {expandedFeedback[index] && (
                    <div className="max-w-xl p-4.5 bg-zinc-950/90 rounded-2xl border border-white/10 space-y-3 text-xs text-zinc-300 animate-fade-in shadow-inner font-korean">
                      {msg.correction && (
                        <div className="flex items-start gap-2.5">
                          <span className="text-accent-pink font-extrabold bg-accent-pink/15 px-2 py-0.5 rounded-lg border border-accent-pink/20 uppercase tracking-wide text-[10px]">Tutor Correction</span>
                          <span className="leading-relaxed tracking-wide">{msg.correction}</span>
                        </div>
                      )}
                      {msg.grammarNotes && (
                        <div className="flex items-start gap-2.5">
                          <span className="text-accent-teal font-extrabold bg-accent-teal/15 px-2 py-0.5 rounded-lg border border-accent-teal/20 uppercase tracking-wide text-[10px]">Grammar Hub</span>
                          <span className="leading-relaxed tracking-wide whitespace-pre-line">{msg.grammarNotes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {sending && (
            <div className="flex justify-start">
              <div className="glass-panel border border-white/10 bg-zinc-950/60 p-4.5 rounded-2xl rounded-tl-none flex items-center space-x-3.5 shadow-xl shadow-brand-500/5 animate-pulse-slow">
                <Loader2 className="w-5 h-5 text-brand-400 animate-spin flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Gwan-Sik is choosing</span>
                  <span className="text-sm text-brand-gold font-black font-korean transition-all duration-300 animate-fade-in inline-block min-w-[120px] tracking-wide">
                    {loaderPhrases[activePhraseIndex]}
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Input controls */}
        <footer className="glass-panel neon-border p-4 rounded-2xl shadow-2xl flex items-center space-x-4">
          <button 
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`p-3.5 rounded-full transition flex items-center justify-center cursor-pointer ${
              isRecording 
                ? "bg-accent-pink text-white animate-pulse scale-110 shadow-lg shadow-accent-pink/40" 
                : "bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white"
            }`}
            title="Hold to Speak English/Korean, Release to Submit"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isRecording ? "Listening carefully... release button to submit" : "Type in English or Korean, or hold Mic to talk..."}
            className="flex-grow bg-transparent border-0 outline-none text-base placeholder-zinc-500 font-korean font-semibold text-white"
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={sending}
          />

          <button 
            onClick={() => handleSendMessage()}
            className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white p-3.5 rounded-full transition cursor-pointer shadow-lg shadow-brand-500/25 active:scale-95"
            disabled={sending}
          >
            <Send className="w-5 h-5" />
          </button>
        </footer>
      </div>

      {/* Right Sidebar: Tutor Configuration Panel */}
      {rightSidebarOpen && (
        <aside className="w-80 border-l border-white/5 bg-zinc-950/90 p-5 flex flex-col gap-6 h-screen sticky top-0 transition-all duration-300 animate-fade-in z-20 overflow-y-auto max-xl:fixed max-xl:right-0 max-xl:top-0 max-xl:h-screen max-xl:z-50 max-xl:border-l max-xl:border-white/10 max-xl:backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2 font-black text-sm text-zinc-300">
              <Settings className="w-4 h-4 text-brand-400 animate-pulse-slow" />
              <span>Tutor Settings (설정)</span>
            </div>
            <button
              onClick={() => setRightSidebarOpen(false)}
              className="text-zinc-500 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition flex items-center justify-center border border-white/5 bg-zinc-900/50 cursor-pointer"
              title="Close Settings"
            >
              ✕
            </button>
          </div>

          <div className="space-y-5 flex-grow">
            
            {/* Brain Model Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold block">LLM Tutor Brain</label>
              <CustomSelect
                label="Brain Model"
                value={selectedModel}
                onChange={(val) => setSelectedModel(val)}
                accentClass="text-brand-300"
                options={[
                  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq)" },
                  { value: "qwen-2.5-32b", label: "Qwen 2.5 32B (Groq)" },
                  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Groq)" },
                  { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
                  { value: "openai/gpt-oss-20b", label: "GPT-OSS 20B" },
                  { value: "groq/compound", label: "Groq Agentic Compound" },
                  { value: "groq/compound-mini", label: "Groq Agentic Mini" },
                ]}
              />
            </div>

            {/* Base Language Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold block">Tutor Response Language</label>
              <CustomSelect
                label="Tutor Base"
                value={baseLanguage}
                onChange={(val) => setBaseLanguage(val as "korean" | "english")}
                accentClass="text-brand-400"
                options={[
                  { value: "korean", label: "Korean (Challenge)" },
                  { value: "english", label: "English (Bilingual)" },
                ]}
              />
            </div>

            {/* KO Voice Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold block">Korean Voice (TTS)</label>
              <CustomSelect
                label="KO Voice"
                value={selectedKoVoiceName || "google-online"}
                onChange={(val) => setSelectedKoVoiceName(val)}
                accentClass="text-accent-pink"
                options={[
                  { value: "google-online", label: "Google Online (Premium)" },
                  { value: "ko-KR-SunHiNeural", label: "Microsoft SunHi (Premium Neural)" },
                  { value: "ko-KR-InJoonNeural", label: "Microsoft InJoon (Premium Neural)" },
                  ...koVoices.map(v => ({
                    value: v.name,
                    label: v.name.replace("Microsoft", "").replace("Google", "").replace("Desktop", "").trim()
                  }))
                ]}
              />
            </div>

            {/* EN Voice Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold block">English Voice (TTS)</label>
              <CustomSelect
                label="EN Voice"
                value={selectedEnVoiceName || "google-online"}
                onChange={(val) => setSelectedEnVoiceName(val)}
                accentClass="text-accent-teal"
                options={[
                  { value: "google-online", label: "Google Online (Premium)" },
                  { value: "en-US-AriaNeural", label: "Microsoft Aria (Premium Neural)" },
                  { value: "en-US-GuyNeural", label: "Microsoft Guy (Premium Neural)" },
                  { value: "en-GB-SoniaNeural", label: "Microsoft Sonia (Premium Neural)" },
                  { value: "en-GB-RyanNeural", label: "Microsoft Ryan (Premium Neural)" },
                  ...enVoices.map(v => ({
                    value: v.name,
                    label: v.name.replace("Microsoft", "").replace("Google", "").replace("Desktop", "").trim()
                  }))
                ]}
              />
            </div>

            {/* Playback Speed Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold block">Audio Playback Speed</label>
              <CustomSelect
                label="Speed"
                value={speechSpeed.toString()}
                onChange={(val) => handleSpeedChange(parseFloat(val))}
                accentClass="text-brand-gold"
                options={[
                  { value: "0.5", label: "0.5x Speed" },
                  { value: "0.75", label: "0.75x Speed" },
                  { value: "1", label: "1.0x Speed (Default)" },
                  { value: "1.25", label: "1.25x Speed" },
                  { value: "1.5", label: "1.5x Speed" }
                ]}
              />
            </div>

          </div>
        </aside>
      )}
    </div>
  );
}
