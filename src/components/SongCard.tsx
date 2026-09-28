import React from 'react';
import { Song } from '../types/music';
import { Play, Pause, Heart, Zap } from 'lucide-react';

interface SongCardProps {
  song: Song;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  onToggleFavorite: (songId: string) => void;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  isCurrent,
  isPlaying,
  onPlay,
  onToggleFavorite,
}) => {
  const themePrimary = song.themeColors?.primary || '#10b981';

  return (
    <div
      onClick={() => onPlay(song)}
      className={`group relative flex flex-col p-3 rounded-2xl transition-all duration-300 cursor-pointer border select-none ${
        isCurrent
          ? 'bg-slate-900/90 border-emerald-500/50 shadow-xl shadow-emerald-500/10'
          : 'bg-slate-900/40 hover:bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Cover Art Box */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-950 border border-white/5 shadow-md">
        <img
          src={song.cover_url}
          alt={song.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Ambient Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Play/Pause Hover Button */}
        <div
          className={`absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all transform ${
            isCurrent
              ? 'opacity-100 scale-100'
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 scale-95 hover:scale-105'
          }`}
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-5 h-5 fill-slate-950" />
          ) : (
            <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
          )}
        </div>

        {/* Dynamic Equalizer Waves when active */}
        {isCurrent && isPlaying && (
          <div className="absolute top-2.5 left-2.5 flex items-end gap-1 h-4 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md">
            <span className="w-1 bg-emerald-400 rounded-full animate-bounce" style={{ height: '100%' }} />
            <span className="w-1 bg-emerald-400 rounded-full animate-bounce" style={{ height: '60%', animationDelay: '0.15s' }} />
            <span className="w-1 bg-emerald-400 rounded-full animate-bounce" style={{ height: '80%', animationDelay: '0.3s' }} />
          </div>
        )}
      </div>

      {/* Track Details */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-bold truncate transition-colors ${
            isCurrent ? 'text-emerald-400' : 'text-slate-100 group-hover:text-white'
          }`}>
            {song.title}
          </h3>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {song.artist}
          </p>
        </div>

        {/* Favorite Heart */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(song.song_id);
          }}
          className={`p-1 text-slate-500 hover:text-white transition-colors cursor-pointer ${
            song.isFavorite ? 'text-rose-500 hover:text-rose-400' : ''
          }`}
        >
          <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-rose-500' : ''}`} />
        </button>
      </div>

      {/* Metadata Bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-2 pt-2 border-t border-white/5">
        <span className="truncate text-slate-400">{song.genre}</span>
        <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
          <Zap className="w-3 h-3 text-emerald-400" />
          <span>{song.bpm} BPM</span>
        </span>
      </div>
    </div>
  );
};
