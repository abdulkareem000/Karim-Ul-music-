import React, { useState, useEffect } from 'react';
import { Song, EqualizerBands } from '../types/music';
import { audioEngine } from '../services/audioEngine';
import { AudioVisualizer } from './AudioVisualizer';
import { SyncedLyricsView } from './SyncedLyricsView';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Mic,
  Sliders,
  FileText,
  ChevronDown,
  Heart,
  Share2,
} from 'lucide-react';

interface MainPlayerProps {
  song: Song;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onClose: () => void;
  queue: Song[];
  onSelectFromQueue: (song: Song) => void;
  onUpdateLyrics: (songId: string, lyrics: Song['lyrics']) => void;
  onToggleFavorite: (songId: string) => void;
}

export const MainPlayer: React.FC<MainPlayerProps> = ({
  song,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
  onClose,
  queue,
  onSelectFromQueue,
  onUpdateLyrics,
  onToggleFavorite,
}) => {
  const [activeTab, setActiveTab] = useState<'visualizer' | 'lyrics' | 'queue' | 'eq'>('visualizer');
  const [volume, setVolume] = useState(audioEngine.getVolume());
  const [isKaraokeActive, setIsKaraokeActive] = useState(audioEngine.getKaraokeMode());
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [eqBands, setEqBands] = useState<EqualizerBands>(audioEngine.getEqualizer());
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    setVolume(audioEngine.getVolume());
    setIsKaraokeActive(audioEngine.getKaraokeMode());
  }, [song]);

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    audioEngine.setVolume(newVol);
  };

  const handleToggleKaraoke = () => {
    const nextState = !isKaraokeActive;
    setIsKaraokeActive(nextState);
    audioEngine.setKaraokeMode(nextState);
    if (nextState && activeTab !== 'lyrics') {
      setActiveTab('lyrics'); // auto switch to lyrics when karaoke is enabled
    }
  };

  const handleEqChange = (key: keyof EqualizerBands, val: number) => {
    const next = { ...eqBands, [key]: val };
    setEqBands(next);
    audioEngine.setEqualizer({ [key]: val });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Swipe gestures to change songs
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;
    if (diff > 60) {
      onPrev();
    } else if (diff < -60) {
      onNext();
    }
    setTouchStartX(null);
  };

  const themePrimary = song.themeColors?.primary || '#10b981';
  const themeAccent = song.themeColors?.accent || '#6366f1';

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 flex flex-col bg-[#08090d] text-slate-100 overflow-y-auto select-none"
      style={{
        background: `radial-gradient(circle at 50% 15%, ${themePrimary}22 0%, #08090d 75%)`,
      }}
    >
      {/* Dynamic atmospheric color mesh glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full blur-[140px] pointer-events-none opacity-30 transition-all duration-1000"
        style={{ background: themePrimary }}
      />

      {/* Top Bar with Glassmorphic pill */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-md">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Minimize player"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
            Playing From Karim Ul
          </span>
          <span className="text-xs font-bold text-white tracking-wide truncate max-w-[200px]">
            {song.mood || song.genre}
          </span>
        </div>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: song.title,
                text: `Listening to ${song.title} by ${song.artist} on Karim Ul`,
                url: window.location.href,
              }).catch(() => {});
            }
          }}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-6 py-4 flex flex-col justify-between">
        {/* Tab Switcher Pills */}
        <div className="flex items-center justify-center gap-1.5 mb-4 bg-slate-900/60 p-1 rounded-2xl border border-white/5 w-fit mx-auto backdrop-blur-md">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'visualizer' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Artwork & Visualizer
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'lyrics' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Synced Lyrics</span>
          </button>
          <button
            onClick={() => setActiveTab('eq')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'eq' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>EQ & 3D Audio</span>
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'queue' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Queue ({queue.length})
          </button>
        </div>

        {/* Tab 1: Visualizer & Artwork */}
        {activeTab === 'visualizer' && (
          <div className="flex flex-col items-center justify-center flex-1 my-2 space-y-6">
            {/* Album Cover Art */}
            <div className="relative group">
              <div
                className="w-56 h-56 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105 border border-white/10 relative"
                style={{
                  boxShadow: `0 20px 50px -10px ${themePrimary}40`,
                }}
              >
                <img
                  src={song.cover_url}
                  alt={song.title}
                  className="w-full h-full object-cover"
                />
                {/* Vinyl spin indicator */}
                <div
                  className={`absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 ${
                    isPlaying ? 'animate-pulse' : ''
                  }`}
                />
              </div>
            </div>

            {/* Live Audio Visualizer */}
            <div className="w-full max-w-md">
              <AudioVisualizer
                primaryColor={themePrimary}
                accentColor={themeAccent}
                height={100}
                showControls={true}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Synced Lyrics */}
        {activeTab === 'lyrics' && (
          <div className="flex-1 h-[340px] sm:h-[420px]">
            <SyncedLyricsView
              song={song}
              currentTime={currentTime}
              onSeek={onSeek}
              onUpdateSongLyrics={onUpdateLyrics}
              isKaraokeActive={isKaraokeActive}
            />
          </div>
        )}

        {/* Tab 3: Equalizer & 3D Spatial Audio */}
        {activeTab === 'eq' && (
          <div className="flex flex-col flex-1 justify-center max-w-md mx-auto w-full space-y-6 p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-center">
              Studio Mastering & Equalizer
            </h3>

            {/* Bass Boost */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Bass Boost (200 Hz)</span>
                <span className="text-emerald-400 font-mono">
                  {eqBands.bass > 0 ? `+${eqBands.bass}` : eqBands.bass} dB
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={eqBands.bass}
                onChange={(e) => handleEqChange('bass', Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>

            {/* Mid Vocal Presence */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Vocal / Mid Presence (1 kHz)</span>
                <span className="text-indigo-400 font-mono">
                  {eqBands.mid > 0 ? `+${eqBands.mid}` : eqBands.mid} dB
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={eqBands.mid}
                onChange={(e) => handleEqChange('mid', Number(e.target.value))}
                className="w-full accent-indigo-400"
              />
            </div>

            {/* Treble Sizzle */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Treble & Air (3.5 kHz)</span>
                <span className="text-cyan-400 font-mono">
                  {eqBands.treble > 0 ? `+${eqBands.treble}` : eqBands.treble} dB
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={eqBands.treble}
                onChange={(e) => handleEqChange('treble', Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* 3D Spatial Stereo Width */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">3D Spatial Stereo Width</span>
                <span className="text-amber-400 font-mono">
                  {Math.round(eqBands.spatialWidth * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={eqBands.spatialWidth}
                onChange={(e) => handleEqChange('spatialWidth', Number(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            <button
              onClick={() => {
                const def: EqualizerBands = { bass: 0, mid: 0, treble: 0, spatialWidth: 0.8 };
                setEqBands(def);
                audioEngine.setEqualizer(def);
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors self-center cursor-pointer"
            >
              Reset to Studio Flat
            </button>
          </div>
        )}

        {/* Tab 4: Queue */}
        {activeTab === 'queue' && (
          <div className="flex-1 max-w-md mx-auto w-full overflow-y-auto space-y-2 p-2 max-h-[380px]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Next Up in Queue
            </h3>
            {queue.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onSelectFromQueue(item)}
                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                  item.song_id === song.song_id
                    ? 'bg-emerald-500/20 border border-emerald-500/30'
                    : 'bg-slate-900/40 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <img
                  src={item.cover_url}
                  alt={item.title}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-100 truncate">{item.title}</p>
                  <p className="text-xs text-slate-400 truncate">{item.artist}</p>
                </div>
                <span className="text-xs text-slate-500 font-mono">{formatTime(item.duration)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Player Controls Section */}
        <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
          {/* Song Info & Favorite / Karaoke */}
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold font-display text-white tracking-tight truncate">
                  {song.title}
                </h2>
                {song.audio_url && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex-shrink-0">
                    HD Stream
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 truncate">{song.artist}</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Karaoke Mic Button */}
              <button
                onClick={handleToggleKaraoke}
                className={`p-2.5 rounded-full transition-all cursor-pointer ${
                  isKaraokeActive
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-400'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={isKaraokeActive ? 'Karaoke Vocal Filter ON' : 'Turn on Karaoke Vocal Remover'}
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Favorite Button */}
              <button
                onClick={() => onToggleFavorite(song.song_id)}
                className={`p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer ${
                  song.isFavorite ? 'text-rose-500' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-rose-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Progress Scrub Bar */}
          <div>
            <div className="relative flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 180}
                value={currentTime}
                onChange={(e) => onSeek(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                style={{
                  background: `linear-gradient(to right, ${themePrimary} ${(currentTime / (duration || 180)) * 100}%, #1e293b ${(currentTime / (duration || 180)) * 100}%)`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-mono mt-1.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Primary Transport Controls */}
          <div className="flex items-center justify-between max-w-sm mx-auto">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isShuffle ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={onPrev}
              className="p-3 rounded-full text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Previous Track"
            >
              <SkipBack className="w-6 h-6" />
            </button>

            <button
              onClick={onPlayPause}
              className="w-14 h-14 rounded-full bg-white text-slate-950 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-xl shadow-white/10 cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-slate-950" />
              ) : (
                <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-3 rounded-full text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Next Track"
            >
              <SkipForward className="w-6 h-6" />
            </button>

            <button
              onClick={() => setIsRepeat(!isRepeat)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isRepeat ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Repeat"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Volume Slider Control */}
          <div className="flex items-center gap-3 max-w-xs mx-auto text-slate-400">
            <button
              onClick={() => handleVolumeChange(volume === 0 ? 0.75 : 0)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-300"
            />
            <span className="text-xs font-mono w-7 text-right">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
