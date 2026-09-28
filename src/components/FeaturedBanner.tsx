import React from 'react';
import { Song } from '../types/music';
import { Play, Sparkles, Mic, Activity } from 'lucide-react';

interface FeaturedBannerProps {
  song: Song;
  onPlay: (song: Song) => void;
  onOpenAIDJ: () => void;
  onOpenLyrics: () => void;
}

export const FeaturedBanner: React.FC<FeaturedBannerProps> = ({
  song,
  onPlay,
  onOpenAIDJ,
  onOpenLyrics,
}) => {
  const themePrimary = song.themeColors?.primary || '#10b981';

  return (
    <div className="relative w-full rounded-3xl overflow-hidden mb-8 border border-white/10 shadow-2xl bg-gradient-to-r from-slate-950 via-[#0e1017] to-slate-950 select-none">
      {/* Background Cover Image with atmospheric gradient blur */}
      <div className="absolute inset-0 opacity-20 filter blur-xl scale-110 pointer-events-none">
        <img
          src={song.cover_url}
          alt={song.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 sm:p-8 gap-6">
        <div className="flex-1 max-w-xl text-center md:text-left">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Featured Spotlight Track</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-white tracking-tight leading-tight mb-2">
            {song.title}
          </h2>

          <p className="text-slate-300 text-sm sm:text-base font-medium mb-3">
            {song.artist}
          </p>

          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6 line-clamp-2">
            {song.description || 'Experience immersive soundscapes with AI voice mixing, real-time beat analysis, and center-channel vocal isolation.'}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <button
              onClick={() => onPlay(song)}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Play Now</span>
            </button>

            <button
              onClick={onOpenAIDJ}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs sm:text-sm font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Ask Karim Ul DJ</span>
            </button>

            <button
              onClick={onOpenLyrics}
              className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <Mic className="w-4 h-4 text-rose-400" />
              <span>Karaoke View</span>
            </button>
          </div>
        </div>

        {/* Featured Artwork Display */}
        <div className="relative flex-shrink-0 group">
          <div
            className="w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border border-white/15 relative"
            style={{
              boxShadow: `0 20px 40px -10px ${themePrimary}35`,
            }}
          >
            <img
              src={song.cover_url}
              alt={song.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          <div className="absolute -bottom-3 -right-3 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-700 text-[11px] font-mono text-emerald-400 font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-md">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>{song.bpm} BPM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
