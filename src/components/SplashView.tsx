import React, { useEffect, useState } from 'react';
import { Sparkles, Music, Volume2 } from 'lucide-react';

interface SplashViewProps {
  onEnter: () => void;
}

export const SplashView: React.FC<SplashViewProps> = ({ onEnter }) => {
  const [fadedIn, setFadedIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadedIn(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07080c] overflow-hidden select-none">
      {/* Dynamic ambient background glow */}
      <div className="absolute w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -top-20 -left-20 animate-pulse" />
      <div className="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -bottom-20 -right-20 animate-pulse" />

      {/* Center glowing logo card */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-6 transition-all duration-1000 transform ${
          fadedIn ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        }`}
      >
        {/* Animated icon crest */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-slate-800 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/10 backdrop-blur-xl">
            <Music className="w-10 h-10 text-emerald-400 animate-bounce" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full ring-4 ring-[#07080c] animate-ping" />
        </div>

        {/* Brand Text */}
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight font-display text-white mb-3">
          Karim <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">Ul</span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base font-medium max-w-md mb-8">
          Next-Generation AI Audio Streaming · Live Visualizers · Smart Voice DJ · Stem Separation Karaoke
        </p>

        {/* Enter Button */}
        <button
          onClick={onEnter}
          className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-semibold text-sm shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Volume2 className="w-4 h-4 text-slate-950 transition-transform group-hover:scale-110" />
          <span>Launch Audio Player</span>
          <Sparkles className="w-4 h-4 text-slate-950/70" />
        </button>

        <div className="mt-8 flex items-center gap-3 text-xs text-slate-500">
          <span>High-Fidelity Audio</span>
          <span aria-hidden="true">·</span>
          <span>Web Audio DSP</span>
          <span aria-hidden="true">·</span>
          <span>Gemini AI Engine</span>
        </div>
      </div>
    </div>
  );
};
