"use client";

import { useState, useEffect, useRef } from "react";
import { Keyboard, X, ArrowDownRight, Sparkles, Delete } from "lucide-react";
import { assembleHangeul } from "@/lib/hangul";

export default function FloatingKeyboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 80 }); // Position offset from bottom-right
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);

  // Composition buffers
  const [jamoBuffer, setJamoBuffer] = useState<string[]>([]);
  const [composedText, setComposedText] = useState("");

  // Keep track of the last focused input element globally
  const lastFocusedInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // Globally track focused input elements
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        lastFocusedInputRef.current = target as HTMLInputElement | HTMLTextAreaElement;
      }
    };
    window.addEventListener("focusin", handleFocus);
    return () => window.removeEventListener("focusin", handleFocus);
  }, []);

  useEffect(() => {
    // Run Hangeul composition on buffer change
    setComposedText(assembleHangeul(jamoBuffer));
  }, [jamoBuffer]);

  // Handle keys click
  const handleKeyClick = (char: string) => {
    setJamoBuffer((prev) => [...prev, char]);
  };

  const handleBackspace = () => {
    setJamoBuffer((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setJamoBuffer([]);
    setComposedText("");
  };

  const handleSpace = () => {
    setJamoBuffer((prev) => [...prev, " "]);
  };

  // Insert composed text into the currently active/focused input box
  const handleInsertText = () => {
    const input = lastFocusedInputRef.current;
    if (input && composedText) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const val = input.value;
      
      const newVal = val.slice(0, start) + composedText + val.slice(end);
      input.value = newVal;

      // Trigger input event so React state registers the change
      const event = new Event("input", { bubbles: true });
      input.dispatchEvent(event);

      // Restore focus and selection
      input.focus();
      const newCursorPos = start + composedText.length;
      input.setSelectionRange(newCursorPos, newCursorPos);

      // Clear keyboard buffer after successful insertion
      handleClear();
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(composedText);
      alert(`Copied to clipboard: "${composedText}"\n(Tip: Focus any text box first, then click Insert!)`);
    }
  };

  // Draggability helpers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragRef.current) {
        const deltaX = dragRef.current.startX - e.clientX;
        const deltaY = dragRef.current.startY - e.clientY;
        setPosition({
          x: Math.max(10, dragRef.current.posX + deltaX),
          y: Math.max(10, dragRef.current.posY + deltaY),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const consonants = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"];
  const vowels = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] bg-gradient-to-tr from-brand-500 to-accent-pink hover:scale-105 active:scale-95 text-white p-4 rounded-full shadow-2xl transition duration-200 cursor-pointer flex items-center justify-center border border-white/10"
        title="Open Floating Hangeul Keyboard"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Keyboard className="w-6 h-6" />}
      </button>

      {/* Floating Keyboard Board Panel */}
      {isOpen && (
        <div
          style={{ bottom: `${position.y}px`, right: `${position.x}px` }}
          className="fixed z-[9998] w-96 glass-panel border border-white/10 rounded-2xl shadow-2xl p-4 bg-zinc-950/90 select-none flex flex-col space-y-3"
        >
          {/* Header Dragger */}
          <div
            onMouseDown={handleMouseDown}
            className="flex justify-between items-center pb-2 border-b border-white/5 cursor-move active:bg-white/5 p-1 rounded-lg transition"
            title="Drag to reposition keyboard"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-black tracking-wide text-zinc-400 uppercase">Hangeul Composer</span>
            </div>
            <ArrowDownRight className="w-3.5 h-3.5 text-zinc-600" />
          </div>

          {/* Text Output display */}
          <div className="p-3 bg-zinc-900/80 rounded-xl border border-white/5 flex items-center justify-between min-h-[50px]">
            <span className="text-lg font-black text-white font-sans tracking-wide">
              {composedText || <span className="text-zinc-600 text-sm font-normal">Typing conjugations...</span>}
            </span>
            {composedText && (
              <button
                onClick={handleInsertText}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow transition cursor-pointer"
              >
                Insert
              </button>
            )}
          </div>

          {/* Consonants */}
          <div className="space-y-1">
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Consonants:</div>
            <div className="flex flex-wrap gap-1">
              {consonants.map((char) => (
                <button
                  key={char}
                  onClick={() => handleKeyClick(char)}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 active:bg-brand-500 rounded text-xs font-bold border border-white/5 cursor-pointer transition"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>

          {/* Vowels */}
          <div className="space-y-1">
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Vowels:</div>
            <div className="flex flex-wrap gap-1">
              {vowels.map((char) => (
                <button
                  key={char}
                  onClick={() => handleKeyClick(char)}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 active:bg-brand-500 rounded text-xs font-bold border border-white/5 cursor-pointer transition"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 justify-between pt-2 border-t border-white/5">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 text-xs font-bold rounded border border-white/5 cursor-pointer"
            >
              Clear
            </button>
            <div className="flex gap-1.5">
              <button
                onClick={handleSpace}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded border border-white/5 cursor-pointer"
              >
                Space
              </button>
              <button
                onClick={handleBackspace}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-accent-pink/20 hover:text-accent-pink text-zinc-400 text-xs font-bold rounded border border-white/5 flex items-center gap-1 cursor-pointer"
              >
                <Delete className="w-3.5 h-3.5" /> Del
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
