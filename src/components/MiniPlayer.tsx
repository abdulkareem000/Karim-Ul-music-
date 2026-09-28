import React from 'react';
import { Song } from '../types/music';
import { audioEngine } from '../services/audioEngine';
import { Play, Pause, SkipForward, Mic, Maximize2 } from 'lucide-react';

interface MiniPlayerProps {
  song: Song;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onNext: () => void;
  onExpand: () => void;
  onToggleKaraoke: () => void;
  isKaraokeActive: boolean;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  song,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onNext,
  onExpand,
  onToggleKaraoke,
  isKaraokeActive,
}) => {
  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const themePrimary = song.themeColors?.primary || '#10b981';

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 max-w-4xl mx-auto z-40 select-none">
      <div className="relative overflow-hidden rounded-2xl bg-[#0f1118]/95 border border-white/10 shadow-2xl backdrop-blur-xl">
        {/* Top Progress Line */}
        <div className="w-full h-1 bg-slate-800">
          <div
            className="h-full transition-all duration-200"
            style={{
              width: `${percent}%`,
              background: `linear-gradient(to right, ${themePrimary}, #38bdf8)`,
            }}
          />
        </div>

        <div className="flex items-center justify-between p-3 gap-3">
          {/* Track metadata - Click expands */}
          <div
            onClick={onExpand}
            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
          >
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md flex-shrink-0 group-hover:scale-105 transition-transform border border-white/10">
              <img
                src={song.cover_url}
                alt={song.title}
                className="w-full h-full object-cover"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                {song.title}
              </h4>
              <p className="text-xs text-slate-400 truncate flex items-center gap-2">
                <span>{song.artist}</span>
                <span className="text-[10px] text-slate-500 font-mono">· {song.bpm} BPM</span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Quick Karaoke Toggle */}
            <button
              onClick={onToggleKaraoke}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isKaraokeActive
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={isKaraokeActive ? 'Karaoke Vocal Filter ON' : 'Turn on Karaoke Vocal Remover'}
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={onPlayPause}
              className="w-10 h-10 rounded-full bg-white text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-slate-950" />
              ) : (
                <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={onNext}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Fullscreen Expand */}
            <button
              onClick={onExpand}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer hidden sm:block"
              title="Expand player"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
