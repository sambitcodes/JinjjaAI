"use client";

import { useEffect, useState, useRef } from "react";
import { 
  BookOpen, Folder, ZoomIn, ZoomOut, Maximize, Minimize, 
  ChevronLeft, ChevronRight, Layout, BookOpenCheck, Loader2, ArrowLeft, Download
} from "lucide-react";
import { apiRequest, ensureAuthenticated } from "../../lib/api";

interface BookMaterial {
  name: string;
  size_bytes: number;
  category: string;
  url: string;
}

export default function MaterialsWarehouse() {
  const [materials, setMaterials] = useState<BookMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // PDF Viewer Modal States
  const [selectedPdf, setSelectedPdf] = useState<BookMaterial | null>(null);
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [readMode, setReadMode] = useState<"scroll" | "book">("scroll");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pageTurning, setPageTurning] = useState(false);
  const [turnDirection, setTurnDirection] = useState<"next" | "prev">("next");

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewerModalRef = useRef<HTMLDivElement>(null);

  // Load PDF.js library dynamically from CDN
  useEffect(() => {
    if (typeof window !== "undefined") {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.async = true;
      script.onload = () => {
        const win = window as any;
        win.pdfjsLib = win["pdfjs-dist/build/pdf"];
        win.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        setPdfJsLoaded(true);
      };
      document.body.appendChild(script);
    }
  }, []);

  const loadMaterials = async () => {
    try {
      const user = await ensureAuthenticated();
      if (!user) return;
      const data = await apiRequest("/lessons/materials");
      setMaterials(data);
    } catch (err) {
      console.error("Failed to load materials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Materials Warehouse - Jinjja AI";
    loadMaterials();
  }, []);

  // Load PDF Document when selectedPdf changes
  useEffect(() => {
    if (!selectedPdf) return;
    setReadMode("scroll"); // Reset readMode to scroll whenever selectedPdf changes
    setCurrentPage(1);

    if (!pdfJsLoaded) return;

    const loadPdfDoc = async () => {
      setPdfLoading(true);
      setPdfDocument(null);
      setNumPages(0);
      
      try {
        const win = window as any;
        const pdfjsLib = win.pdfjsLib;
        let apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        if (apiBase && !apiBase.includes("/api/v1")) {
          apiBase = apiBase.replace(/\/$/, "") + "/api/v1";
        }
        const cleanBaseUrl = apiBase.replace("/api/v1", "").replace(/\/$/, "");
        const docUrl = `${cleanBaseUrl}${selectedPdf.url}`;
        
        const loadingTask = pdfjsLib.getDocument({
          url: docUrl,
          withCredentials: false
        });
        
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
      } catch (err) {
        console.error("Failed to parse PDF document:", err);
      } finally {
        setPdfLoading(false);
      }
    };

    loadPdfDoc();
  }, [selectedPdf, pdfJsLoaded]);

  // Keyboard arrow keys navigation helper
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPdf || pdfLoading || !pdfDocument) return;
      if (e.key === "ArrowRight") {
        handleNextPage();
      } else if (e.key === "ArrowLeft") {
        handlePrevPage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPdf, pdfLoading, pdfDocument, readMode, currentPage, numPages]);

  // Render book canvases
  useEffect(() => {
    if (!pdfDocument || !pdfJsLoaded || readMode !== "book") return;
    
    let isMounted = true;
    
    const drawBook = async () => {
      // Draw Left Page
      try {
        const page = await pdfDocument.getPage(currentPage);
        const viewport = page.getViewport({ scale: zoomScale * 1.15 });
        if (leftCanvasRef.current && isMounted) {
          const canvas = leftCanvasRef.current;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          const context = canvas.getContext("2d");
          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
          }
        }
      } catch (err) {
        console.error(err);
      }

      // Draw Right Page
      if (currentPage + 1 <= numPages) {
        try {
          const page = await pdfDocument.getPage(currentPage + 1);
          const viewport = page.getViewport({ scale: zoomScale * 1.15 });
          if (rightCanvasRef.current && isMounted) {
            const canvas = rightCanvasRef.current;
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            const context = canvas.getContext("2d");
            if (context) {
              await page.render({ canvasContext: context, viewport }).promise;
            }
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        // Clear right canvas if empty
        if (rightCanvasRef.current) {
          const canvas = rightCanvasRef.current;
          const context = canvas.getContext("2d");
          context?.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };

    drawBook();
    
    return () => {
      isMounted = false;
    };
  }, [pdfDocument, currentPage, zoomScale, readMode]);

  const handleNextPage = () => {
    if (readMode === "scroll") {
      // In scroll mode, let's just scroll down to the next page smoothly
      const nextPage = currentPage + 1;
      if (nextPage <= numPages) {
        setCurrentPage(nextPage);
        const nextEl = document.getElementById(`pdf-page-${nextPage}`);
        if (nextEl) {
          nextEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      return;
    }

    if (currentPage + 2 <= numPages) {
      setTurnDirection("next");
      setPageTurning(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev + 2);
        setPageTurning(false);
      }, 900); // 900ms page turn transition time
    }
  };

  const handlePrevPage = () => {
    if (readMode === "scroll") {
      const prevPage = currentPage - 1;
      if (prevPage >= 1) {
        setCurrentPage(prevPage);
        const prevEl = document.getElementById(`pdf-page-${prevPage}`);
        if (prevEl) {
          prevEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      return;
    }

    if (currentPage - 2 >= 1) {
      setTurnDirection("prev");
      setPageTurning(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev - 2);
        setPageTurning(false);
      }, 900); // 900ms page turn transition time
    }
  };

  const toggleFullscreen = () => {
    if (!viewerModalRef.current) return;
    const elem = viewerModalRef.current;
    
    if (!document.fullscreenElement) {
      elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.error(err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  // Sync fullscreen state if changed externally (e.g. Esc key)
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const categories = ["All", "Core Textbooks", "TTMIK Textbooks", "TTMIK Workbooks", "Korean101 Workbooks"];

  // Search and Category filtering
  const filteredMaterials = materials.filter(m => {
    const matchesCategory = activeCategory === "All" || m.category === activeCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (catName: string) => {
    if (catName === "All") return materials.length;
    return materials.filter(m => m.category === catName).length;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
          <p className="text-zinc-500 text-sm font-bold animate-pulse font-mono uppercase tracking-widest">Unlocking materials vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground relative p-1 md:p-4">
      {/* Background glowing decorations */}
      <div className="absolute -top-10 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-purple-500/10 to-indigo-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-cyan-500/10 to-blue-500/5 rounded-full blur-[160px] pointer-events-none animate-pulse duration-8000" />

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-950/20 via-zinc-900/60 to-zinc-950 p-6 md:p-8 mb-10 shadow-2xl transition-all hover:border-purple-500/20 duration-500 group">
        {/* Glow orb */}
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-purple-500/15 rounded-full blur-3xl group-hover:scale-125 transition duration-700" />
        <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl group-hover:scale-125 transition duration-700" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-[10px] text-purple-300 font-extrabold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
              <span>Vault Repository</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
              Materials <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">Warehouse</span>
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Explore your collection of textbooks, workbooks, and interactive grammar guides. Expand any file to read in scroll mode or realistic 3D book mode.
            </p>
          </div>
          
          <div className="flex gap-4 bg-zinc-950/60 p-4.5 rounded-2xl border border-white/5 shrink-0 w-full lg:w-auto justify-around shadow-inner backdrop-blur-sm">
            <div className="text-center px-4">
              <div className="text-3xl font-black text-white font-mono">{materials.length}</div>
              <div className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">Total Files</div>
            </div>
            <div className="w-px bg-white/5" />
            <div className="text-center px-4">
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 font-mono">3D</div>
              <div className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">Reading Modality</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls: Category Selection & Search */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8 bg-zinc-900/20 p-4 rounded-3xl border border-white/5 backdrop-blur-sm">
        
        {/* Category tabs */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => {
            const count = getCategoryCount(cat);
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/25 scale-105"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{cat.replace(" Textbooks", "").replace(" Workbooks", "")}</span>
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
            placeholder="Search textbook or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 transition placeholder-zinc-600"
          />
          <div className="absolute left-3 top-3 text-zinc-500 pointer-events-none">
            🔍
          </div>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="absolute right-3 top-3 text-zinc-500 hover:text-white text-xs font-bold"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
          {filteredMaterials.map((material, idx) => {
            // Find accent styles based on category
            let borderGlow = "hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.18)]";
            let badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
            let accent = "border-t-4 border-t-purple-500";
            let folderEmoji = "📘";

            if (material.category === "TTMIK Textbooks") {
              borderGlow = "hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.18)]";
              badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
              accent = "border-t-4 border-t-amber-500";
              folderEmoji = "📙";
            } else if (material.category === "TTMIK Workbooks") {
              borderGlow = "hover:border-pink-500/30 hover:shadow-[0_0_30px_rgba(236,72,153,0.18)]";
              badgeColor = "bg-pink-500/10 text-pink-400 border-pink-500/20";
              accent = "border-t-4 border-t-pink-500";
              folderEmoji = "📕";
            } else if (material.category === "Core Textbooks") {
              borderGlow = "hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.18)]";
              badgeColor = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
              accent = "border-t-4 border-t-cyan-500";
              folderEmoji = "📗";
            }

            return (
              <div
                key={idx}
                onClick={() => setSelectedPdf(material)}
                className={`glass-panel p-5 rounded-3xl border border-white/5 bg-zinc-900/10 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer overflow-hidden ${accent} ${borderGlow} group/card`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${badgeColor}`}>
                      {material.category.split(" ")[0]}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono font-bold">{formatSize(material.size_bytes)}</span>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="p-3 bg-zinc-950 border border-white/5 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl group-hover/card:scale-110 transition duration-300">
                      {folderEmoji}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-zinc-100 leading-snug line-clamp-2 group-hover/card:text-white transition" title={material.name}>
                        {material.name.replace(".pdf", "")}
                      </h3>
                      <p className="text-[10px] text-zinc-500 mt-1 font-extrabold uppercase tracking-wide">Interactive Guide</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/[0.03] flex items-center justify-between text-[11px] font-black text-zinc-400 group-hover/card:text-white transition duration-300">
                  <span>Open Document</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono text-zinc-600 group-hover/card:text-purple-400 group-hover/card:translate-x-[-2px] transition duration-300 font-black">READ</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover/card:translate-x-1 transition duration-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-zinc-900/10 border border-dashed border-white/10 rounded-3xl">
          <p className="text-zinc-500 text-sm">No textbook resources match your current query or category.</p>
          <button 
            onClick={() => { setActiveCategory("All"); setSearchQuery(""); }}
            className="mt-4 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-black transition border border-white/5 cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Custom Styles for turnover flipping animation */}
      <style jsx global>{`
        .book-container {
          perspective: 2000px;
          display: flex;
          position: relative;
          transform-style: preserve-3d;
        }
        .book-page {
          transition: transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1);
          transform-style: preserve-3d;
          backface-visibility: hidden;
          position: relative;
        }
        .left-page {
          transform-origin: right center;
          z-index: 2;
        }
        .right-page {
          transform-origin: left center;
          z-index: 2;
        }
        @keyframes page-flip-next {
          0% {
            transform: rotateY(0deg);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          50% {
            box-shadow: 0 40px 80px -12px rgba(0, 0, 0, 0.8);
          }
          100% {
            transform: rotateY(-180deg);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
        }
        @keyframes page-flip-prev {
          0% {
            transform: rotateY(0deg);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          50% {
            box-shadow: 0 40px 80px -12px rgba(0, 0, 0, 0.8);
          }
          100% {
            transform: rotateY(180deg);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
        }
        .animate-page-flip-next {
          animation: page-flip-next 0.9s cubic-bezier(0.645, 0.045, 0.355, 1) forwards;
        }
        .animate-page-flip-prev {
          animation: page-flip-prev 0.9s cubic-bezier(0.645, 0.045, 0.355, 1) forwards;
        }
      `}</style>

      {/* FULLSCREEN PDF VIEWER MODAL */}
      {selectedPdf && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-950/95 backdrop-blur-md animate-fade-in">
          
          {/* Modal Header */}
          <header className="flex justify-between items-center bg-zinc-900 border-b border-white/5 px-6 py-4 flex-shrink-0 z-10">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedPdf(null)}
                className="p-2 bg-zinc-950 border border-white/10 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-black text-white line-clamp-1">{selectedPdf.name.replace(".pdf", "")}</h2>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{selectedPdf.category}</span>
              </div>
            </div>

            {/* Viewer Controls */}
            <div className="flex items-center gap-2">
              
              {/* Zoom Controls */}
              <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-white/10">
                <button 
                  onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.15))}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-black font-mono text-zinc-300 w-12 text-center select-none">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button 
                  onClick={() => setZoomScale(prev => Math.min(2.0, prev + 0.15))}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Read Mode Controls */}
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setReadMode("scroll")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                    readMode === "scroll" 
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>Scroll</span>
                </button>
                <button
                  onClick={() => {
                    setReadMode("book");
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                    readMode === "book" 
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <BookOpenCheck className="w-3.5 h-3.5" />
                  <span>Book</span>
                </button>
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-white/10 transition cursor-pointer"
                title="Fullscreen Toggle"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>

              {/* Download Button */}
              <a
                href={(() => {
                  let apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
                  if (apiBase && !apiBase.includes("/api/v1")) {
                    apiBase = apiBase.replace(/\/$/, "") + "/api/v1";
                  }
                  const cleanBaseUrl = apiBase.replace("/api/v1", "").replace(/\/$/, "");
                  return `${cleanBaseUrl}${selectedPdf.url}`;
                })()}
                download
                className="p-2.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-white/10 transition flex items-center justify-center"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
              </a>

            </div>
          </header>

          {/* Modal Content / Canvas Viewport */}
          <div 
            ref={viewerModalRef} 
            className="flex-grow overflow-auto p-6 flex flex-col items-center justify-start bg-zinc-900/60 relative"
          >
            {pdfLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 gap-3">
                <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                <span className="text-zinc-500 text-xs font-bold font-mono uppercase tracking-widest">Parsing Chapter Pages...</span>
              </div>
            )}

            {/* Render view based on mode */}
            {readMode === "scroll" ? (
              <div className="w-full h-full flex-grow rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 mt-2">
                <iframe
                  src={(() => {
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
                    const cleanBaseUrl = API_URL.replace("/api/v1", "");
                    return `${cleanBaseUrl}${selectedPdf.url}#toolbar=1&navpanes=0`;
                  })()}
                  title={selectedPdf.name}
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              /* Custom Render Canvas Container for Book Mode */
              <div className="book-container flex flex-row items-center justify-center max-w-full min-h-[500px] gap-2 select-none relative pb-16 mt-4">
                {/* Left Page */}
                <div className={`book-page left-page flex flex-col items-center p-4 bg-zinc-950/70 border border-white/10 border-r-0 rounded-l-2xl shadow-2xl relative ${pageTurning && turnDirection === "prev" ? "animate-page-flip-prev animate-page-turn-prev" : ""}`}>
                  <canvas ref={leftCanvasRef} className="rounded-lg max-w-full shadow-inner" />
                  <span className="text-[10px] text-zinc-500 font-mono mt-2 font-bold">PAGE {currentPage} of {numPages}</span>
                </div>
                {/* Right Page */}
                <div className={`book-page right-page flex flex-col items-center p-4 bg-zinc-950/70 border border-white/10 border-l-0 rounded-r-2xl shadow-2xl relative ${pageTurning && turnDirection === "next" ? "animate-page-flip-next animate-page-turn-next" : ""}`}>
                  <canvas ref={rightCanvasRef} className="rounded-lg max-w-full shadow-inner" />
                  <span className="text-[10px] text-zinc-500 font-mono mt-2 font-bold">
                    PAGE {currentPage + 1 <= numPages ? currentPage + 1 : numPages} of {numPages}
                  </span>
                </div>
              </div>
            )}
            
            {/* Pagination Footer (Only for Book Mode) */}
            {readMode === "book" && !pdfLoading && pdfDocument && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-zinc-950/95 border border-white/10 p-2.5 rounded-2xl shadow-2xl backdrop-blur-md z-[60]">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-900 rounded-xl transition cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-black text-zinc-300 font-mono min-w-[130px] text-center">
                  PAGES {currentPage}-${Math.min(currentPage + 1, numPages)} of {numPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage + 2 > numPages}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-900 rounded-xl transition cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
