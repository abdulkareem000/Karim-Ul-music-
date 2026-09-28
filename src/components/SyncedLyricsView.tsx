import React, { useEffect, useRef, useState } from 'react';
import { Song, SyncedLyricLine } from '../types/music';
import { generateAutoLyrics } from '../services/api';
import { Sparkles, Mic, Loader2 } from 'lucide-react';

interface SyncedLyricsViewProps {
  song: Song;
  currentTime: number;
  onSeek: (seconds: number) => void;
  onUpdateSongLyrics: (songId: string, lyrics: SyncedLyricLine[]) => void;
  isKaraokeActive?: boolean;
}

export const SyncedLyricsView: React.FC<SyncedLyricsViewProps> = ({
  song,
  currentTime,
  onSeek,
  onUpdateSongLyrics,
  isKaraokeActive = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const lyrics = song.lyrics || [];

  // Determine current active lyric index
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Smoothly scroll active line to center
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  const handleGenerateLyrics = async () => {
    try {
      setIsGenerating(true);
      setErrorMsg(null);
      const res = await generateAutoLyrics(song.title, song.artist, song.genre, song.duration);
      if (res.lyrics && res.lyrics.length > 0) {
        onUpdateSongLyrics(song.song_id, res.lyrics);
      }
    } catch {
      setErrorMsg('Could not auto-generate lyrics right now. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full w-full select-none">
      {/* Top Banner with Karaoke Mode Indicator */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5 text-xs">
        <div className="flex items-center gap-2">
          <Mic className={`w-3.5 h-3.5 ${isKaraokeActive ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="font-medium text-slate-300">
            {isKaraokeActive ? 'Karaoke Vocal Filter Active' : 'Synchronized Lyrics'}
          </span>
        </div>

        {lyrics.length === 0 && (
          <button
            onClick={handleGenerateLyrics}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors text-xs cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 text-emerald-400" />
            )}
            <span>AI Auto-Generate Lyrics</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-2 mb-2 rounded bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Lyrics container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-5 py-8 px-2 scroll-smooth text-center"
      >
        {lyrics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <p className="text-sm mb-3">No synchronized lyrics available for this track.</p>
            <button
              onClick={handleGenerateLyrics}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 text-white font-medium text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini Transcribing Lyrics...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Time-Coded Lyrics with Gemini</span>
                </>
              )}
            </button>
          </div>
        ) : (
          lyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex;

            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek(line.time)}
                className={`transition-all duration-300 cursor-pointer rounded-xl px-4 py-2 ${
                  isActive
                    ? 'text-white text-xl sm:text-2xl font-bold scale-105 bg-white/10 shadow-lg backdrop-blur-sm'
                    : isPast
                    ? 'text-slate-500 text-base sm:text-lg hover:text-slate-300'
                    : 'text-slate-400 text-base sm:text-lg hover:text-slate-200'
                }`}
                style={{
                  color: isActive ? song.themeColors?.accent || '#10b981' : undefined,
                  textShadow: isActive ? `0 0 25px ${song.themeColors?.accent || '#10b981'}80` : undefined,
                }}
              >
                {line.text}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
