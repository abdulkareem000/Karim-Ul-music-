/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Song, UserRole, SyncPlayRoom, RoomParticipant, UserProfile } from './types/music';
import { INITIAL_SONGS } from './data/defaultSongs';
import { fetchSongs, recordSongPlay, updateRoomPlayback } from './services/api';
import { audioEngine } from './services/audioEngine';
import { SplashView } from './components/SplashView';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { FeaturedBanner } from './components/FeaturedBanner';
import { ContextMoodBar } from './components/ContextMoodBar';
import { SongCard } from './components/SongCard';
import { MainPlayer } from './components/MainPlayer';
import { MiniPlayer } from './components/MiniPlayer';
import { VoiceDJModal } from './components/VoiceDJModal';
import { ListenTogetherModal } from './components/ListenTogetherModal';
import { AdminStudio } from './components/AdminStudio';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Sparkles, Radio, Flame, Shield, Heart } from 'lucide-react';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('karim_ul_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [songs, setSongs] = useState<Song[]>(INITIAL_SONGS);
  const [currentSong, setCurrentSong] = useState<Song>(INITIAL_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(INITIAL_SONGS[0].duration);
  const [isKaraokeActive, setIsKaraokeActive] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState('all');

  // Modals & Panels
  const [isMainPlayerOpen, setIsMainPlayerOpen] = useState(false);
  const [isAIDJOpen, setIsAIDJOpen] = useState(false);
  const [isSyncPlayOpen, setIsSyncPlayOpen] = useState(false);
  const [isAdminStudioOpen, setIsAdminStudioOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // Listen Together
  const [activeRoom, setActiveRoom] = useState<SyncPlayRoom | null>(null);
  const [currentParticipant, setCurrentParticipant] = useState<RoomParticipant | null>(null);

  // Derive current role from authenticated user
  const currentRole: UserRole = loggedInUser?.role || 'user';

  // Handle Login Routing:
  // if Admin (9528004584 & Abdul@1212) -> open Admin Dashboard directly
  // else -> normal user home screen
  const handleLoginSuccess = (user: UserProfile) => {
    setLoggedInUser(user);
    try {
      localStorage.setItem('karim_ul_session', JSON.stringify(user));
    } catch {}

    if (user.role === 'admin') {
      setIsAdminStudioOpen(true);
    } else {
      setIsAdminStudioOpen(false);
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setIsAdminStudioOpen(false);
    setIsMainPlayerOpen(false);
    audioEngine.pause();
    setIsPlaying(false);
    try {
      localStorage.removeItem('karim_ul_session');
    } catch {}
  };

  // Load songs on mount
  useEffect(() => {
    fetchSongs()
      .then((data) => {
        if (data && data.length > 0) {
          setSongs(data);
        }
      })
      .catch(() => {});
  }, []);

  // Subscribe to Audio Engine events
  useEffect(() => {
    const unsubTime = audioEngine.subscribeTimeUpdate((curr, dur) => {
      setCurrentTime(curr);
      setDuration(dur);
    });

    const unsubEnded = audioEngine.subscribeEnded(() => {
      handleNextTrack();
    });

    return () => {
      unsubTime();
      unsubEnded();
    };
  }, [songs, currentSong]);

  // Audio Playback Actions
  const handlePlaySong = useCallback((song: Song) => {
    setCurrentSong(song);
    audioEngine.playSong(song);
    setIsPlaying(true);
    setDuration(song.duration);
    recordSongPlay(song.song_id);

    // If in sync room, broadcast track change
    if (activeRoom) {
      updateRoomPlayback(activeRoom.code, {
        songId: song.song_id,
        isPlaying: true,
        currentTime: 0,
      });
    }
  }, [activeRoom]);

  const handleTogglePlayPause = useCallback(() => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.resume();
      setIsPlaying(true);
    }

    if (activeRoom) {
      updateRoomPlayback(activeRoom.code, {
        isPlaying: !isPlaying,
        currentTime,
      });
    }
  }, [isPlaying, activeRoom, currentTime]);

  const handleNextTrack = useCallback(() => {
    const currentIndex = songs.findIndex((s) => s.song_id === currentSong.song_id);
    const nextIndex = (currentIndex + 1) % songs.length;
    handlePlaySong(songs[nextIndex]);
  }, [songs, currentSong, handlePlaySong]);

  const handlePrevTrack = useCallback(() => {
    const currentIndex = songs.findIndex((s) => s.song_id === currentSong.song_id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    handlePlaySong(songs[prevIndex]);
  }, [songs, currentSong, handlePlaySong]);

  const handleSeek = (seconds: number) => {
    audioEngine.seek(seconds);
    setCurrentTime(seconds);
    if (activeRoom) {
      updateRoomPlayback(activeRoom.code, { currentTime: seconds });
    }
  };

  const handleToggleKaraoke = () => {
    const nextState = !isKaraokeActive;
    setIsKaraokeActive(nextState);
    audioEngine.setKaraokeMode(nextState);
  };

  const handleToggleFavorite = (songId: string) => {
    setSongs((prev) =>
      prev.map((s) => (s.song_id === songId ? { ...s, isFavorite: !s.isFavorite } : s))
    );
  };

  const handleUpdateLyrics = (songId: string, lyrics: Song['lyrics']) => {
    setSongs((prev) =>
      prev.map((s) => (s.song_id === songId ? { ...s, lyrics } : s))
    );
    if (currentSong.song_id === songId) {
      setCurrentSong((prev) => ({ ...prev, lyrics }));
    }
  };

  // Sync room action
  const handleSyncPlaySong = (songId: string, shouldPlay: boolean, time: number) => {
    const target = songs.find((s) => s.song_id === songId);
    if (target) {
      setCurrentSong(target);
      if (shouldPlay) {
        audioEngine.playSong(target, time);
        setIsPlaying(true);
      } else {
        audioEngine.pause();
        setIsPlaying(false);
      }
    }
  };

  // Filtered tracks
  const filteredSongs = useMemo(() => {
    return songs.filter((s) => {
      const matchesSearch =
        searchQuery === '' ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.mood.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.vibes.some((v) => v.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesMood = true;
      if (selectedMood === 'workout') {
        matchesMood = s.bpm >= 125 || s.genre.toLowerCase().includes('workout') || s.genre.toLowerCase().includes('trap');
      } else if (selectedMood === 'drive') {
        matchesMood = s.vibes.some((v) => v.toLowerCase().includes('drive')) || s.genre.toLowerCase().includes('synthwave');
      } else if (selectedMood === 'chill') {
        matchesMood = s.bpm < 100 || s.genre.toLowerCase().includes('chill') || s.genre.toLowerCase().includes('lofi');
      } else if (selectedMood === 'energy') {
        matchesMood = s.bpm >= 130 || s.genre.toLowerCase().includes('trap') || s.genre.toLowerCase().includes('edm');
      } else if (selectedMood === 'romantic') {
        matchesMood = s.genre.toLowerCase().includes('romantic') || s.genre.toLowerCase().includes('acoustic');
      }

      return matchesSearch && matchesMood;
    });
  }, [songs, searchQuery, selectedMood]);

  // Featured Hero Track
  const featuredSong = useMemo(() => {
    return songs.find((s) => s.song_id === 'S201') || songs[0];
  }, [songs]);

  if (isAdminStudioOpen) {
    return (
      <AdminStudio
        songs={songs}
        onSongCreated={(newSong) => {
          setSongs((prev) => [newSong, ...prev]);
        }}
        onSongDeleted={(songId) => {
          setSongs((prev) => prev.filter((s) => s.song_id !== songId));
        }}
        onBackToApp={() => setIsAdminStudioOpen(false)}
        onLogout={handleLogout}
        currentUser={loggedInUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col font-sans pb-28">
      {/* 1. Splash Screen */}
      {showSplash && (
        <SplashView
          onEnter={() => {
            setShowSplash(false);
            // Pre-initialize audio engine
            audioEngine.setVolume(0.85);
          }}
        />
      )}

      {/* 2. Login Screen Gate - If not logged in, display the single Phone & Password login screen */}
      {!showSplash && !loggedInUser && (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}

      {/* 3. Top App Bar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAIDJ={() => setIsAIDJOpen(true)}
        onOpenSyncPlay={() => setIsSyncPlayOpen(true)}
        activeRoom={activeRoom}
        currentRole={currentRole}
        onOpenAdminStudio={() => setIsAdminStudioOpen(true)}
        onLogout={handleLogout}
        currentUser={loggedInUser}
        onShowAdminLogin={() => setIsAdminLoginModalOpen(true)}
      />

      {/* 4. Main Streaming Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Sync Room Banner if active */}
        {activeRoom && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <div>
                <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Live in Sound Lounge: {activeRoom.name}
                </p>
                <p className="text-xs text-slate-400">
                  {activeRoom.participants.length} listeners synced in real time
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSyncPlayOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-colors cursor-pointer"
            >
              Open Room Chat
            </button>
          </div>
        )}

        {/* Hero Spotlight Release */}
        {searchQuery === '' && selectedMood === 'all' && (
          <FeaturedBanner
            song={featuredSong}
            onPlay={handlePlaySong}
            onOpenAIDJ={() => setIsAIDJOpen(true)}
            onOpenLyrics={() => {
              handlePlaySong(featuredSong);
              setIsMainPlayerOpen(true);
            }}
          />
        )}

        {/* Context-Aware Mood & Activity Bar */}
        <ContextMoodBar
          selectedMood={selectedMood}
          onSelectMood={setSelectedMood}
        />

        {/* Trending & Filtered Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold font-display text-white">
              {searchQuery ? `Search Results (${filteredSongs.length})` : 'Trending Soundscapes'}
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>High BPM & Ambient</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-mono">{songs.length} Tracks Live</span>
          </div>
        </div>

        {/* Songs Grid */}
        {filteredSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <p className="text-base font-semibold mb-2">No tracks match your search.</p>
            <p className="text-xs text-slate-500 mb-4">Try searching another genre or ask the AI Voice DJ!</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedMood('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredSongs.map((song) => (
              <SongCard
                key={song.song_id}
                song={song}
                isCurrent={currentSong.song_id === song.song_id}
                isPlaying={isPlaying}
                onPlay={(s) => {
                  if (currentSong.song_id === s.song_id) {
                    handleTogglePlayPause();
                  } else {
                    handlePlaySong(s);
                  }
                }}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </main>

      {/* 4. Mini Player Floating Dock */}
      {currentSong && !isMainPlayerOpen && (
        <MiniPlayer
          song={currentSong}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onPlayPause={handleTogglePlayPause}
          onNext={handleNextTrack}
          onExpand={() => setIsMainPlayerOpen(true)}
          onToggleKaraoke={handleToggleKaraoke}
          isKaraokeActive={isKaraokeActive}
        />
      )}

      {/* 5. Full-Screen Main Player Drawer */}
      {isMainPlayerOpen && currentSong && (
        <MainPlayer
          song={currentSong}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onPlayPause={handleTogglePlayPause}
          onPrev={handlePrevTrack}
          onNext={handleNextTrack}
          onSeek={handleSeek}
          onClose={() => setIsMainPlayerOpen(false)}
          queue={songs}
          onSelectFromQueue={handlePlaySong}
          onUpdateLyrics={handleUpdateLyrics}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* 6. AI Voice DJ Modal */}
      <VoiceDJModal
        isOpen={isAIDJOpen}
        onClose={() => setIsAIDJOpen(false)}
        currentSong={currentSong}
        allSongs={songs}
        onPlayDJMix={(mixSongs) => {
          if (mixSongs.length > 0) {
            handlePlaySong(mixSongs[0]);
          }
        }}
      />

      {/* 7. Listen Together (Sync-Play) Modal */}
      <ListenTogetherModal
        isOpen={isSyncPlayOpen}
        onClose={() => setIsSyncPlayOpen(false)}
        currentSong={currentSong}
        onSyncPlaySong={handleSyncPlaySong}
        activeRoom={activeRoom}
        setActiveRoom={setActiveRoom}
        currentUser={currentParticipant}
        setCurrentUser={setCurrentParticipant}
      />

      {/* 8. Secret Gesture Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
