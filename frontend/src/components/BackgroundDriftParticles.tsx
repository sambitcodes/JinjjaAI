"use client";

import { useEffect, useState } from "react";

interface Particle {
  char: string;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

export default function BackgroundDriftParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate drift background particles
    const chars = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ", "한", "글", "대", "박", "선", "생"];
    const generated = Array.from({ length: 18 }).map(() => ({
      char: chars[Math.floor(Math.random() * chars.length)],
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 26 + 14,
      delay: Math.random() * -20, // Start immediately mid-animation
      duration: Math.random() * 20 + 20,
    }));
    setParticles(generated);
  }, []);

  return (
    <>
      {/* Left Margin Animations (Locked to far left 12% of screen) */}
      <div className="fixed left-0 top-0 bottom-0 w-[12vw] pointer-events-none overflow-hidden z-30 select-none">
        {particles.filter((_, idx) => idx % 2 === 0).map((p, i) => (
          <div
            key={`left-${i}`}
            className="absolute pointer-events-none select-none text-white font-extrabold animate-float-drifting"
            style={{
              left: `${p.left * 0.8}%`,
              top: `${p.top}%`,
              fontSize: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          >
            {p.char}
          </div>
        ))}
      </div>

      {/* Right Margin Animations (Locked to far right 12% of screen) */}
      <div className="fixed right-0 top-0 bottom-0 w-[12vw] pointer-events-none overflow-hidden z-30 select-none">
        {particles.filter((_, idx) => idx % 2 !== 0).map((p, i) => (
          <div
            key={`right-${i}`}
            className="absolute pointer-events-none select-none text-white font-extrabold animate-float-drifting"
            style={{
              left: `${p.left * 0.8}%`,
              top: `${p.top}%`,
              fontSize: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          >
            {p.char}
          </div>
        ))}
      </div>
    </>
  );
}
