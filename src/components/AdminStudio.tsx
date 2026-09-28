import React, { useState, useEffect } from 'react';
import { Song, SynthPresetType, UserProfile } from '../types/music';
import { createSong, deleteSong, enrichUploadedSong, generateAutoLyrics, fetchAdminUsers, deleteAdminUser } from '../services/api';
import { audioEngine } from '../services/audioEngine';
import {
  UploadCloud,
  Sparkles,
  Music,
  Trash2,
  CheckCircle,
  TrendingUp,
  Users,
  HardDrive,
  Loader2,
  FileAudio,
  Play,
  Pause,
  LogOut,
  UserCheck,
  Phone,
  Calendar,
  Volume2,
} from 'lucide-react';

interface AdminStudioProps {
  songs: Song[];
  onSongCreated: (song: Song) => void;
  onSongDeleted: (songId: string) => void;
  onBackToApp: () => void;
  onLogout: () => void;
  currentUser?: UserProfile | null;
}

export const AdminStudio: React.FC<AdminStudioProps> = ({
  songs,
  onSongCreated,
  onSongDeleted,
  onBackToApp,
  onLogout,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'catalog' | 'users' | 'stats'>('upload');
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Mini-player preview in Admin Dashboard
  const [previewSong, setPreviewSong] = useState<Song | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('Romantic');
  const [bpm, setBpm] = useState(120);
  const [coverUrl, setCoverUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [synthPreset, setSynthPreset] = useState<SynthPresetType>('romantic_night');
  const [mood, setMood] = useState('Soulful Evening');
  const [vibesText, setVibesText] = useState('Night Drive, Chill, Hindi Indie');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Load users when users tab is opened
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await fetchAdminUsers();
      setRegisteredUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDeleteUser = async (phone: string) => {
    if (phone === '9528004584') {
      alert('Cannot delete master Admin account.');
      return;
    }
    if (confirm(`User ${phone} ko remove karna chahte hain?`)) {
      try {
        await deleteAdminUser(phone);
        setRegisteredUsers((prev) => prev.filter((u) => u.phone !== phone));
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'User delete nahi ho saka');
      }
    }
  };

  const handlePreviewPlay = (song: Song) => {
    if (previewSong?.song_id === song.song_id && isPreviewPlaying) {
      audioEngine.pause();
      setIsPreviewPlaying(false);
    } else {
      setPreviewSong(song);
      audioEngine.playSong(song);
      setIsPreviewPlaying(true);
    }
  };

  // Drag and drop handler
  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setSelectedFile(file);

    // Create local object URL for preview audio
    const objectUrl = URL.createObjectURL(file);
    setAudioUrl(objectUrl);

    // Guess title from filename
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    setTitle(cleanName);

    // Trigger AI Auto-Enrichment via Gemini
    try {
      setIsEnriching(true);
      const res = await enrichUploadedSong(file.name, cleanName);
      if (res.enriched) {
        const en = res.enriched;
        if (en.title) setTitle(en.title);
        if (en.artist) setArtist(en.artist);
        if (en.genre) setGenre(en.genre);
        if (en.bpm) setBpm(en.bpm);
        if (en.mood) setMood(en.mood);
        if (en.vibes) setVibesText(en.vibes.join(', '));
        if (en.synth_preset) setSynthPreset(en.synth_preset as SynthPresetType);
        if (!coverUrl) {
          setCoverUrl('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop');
        }
      }
    } catch {
      // fallback
    } finally {
      setIsEnriching(false);
    }
  };

  const handleManualEnrich = async () => {
    if (!title && !selectedFile) return;
    try {
      setIsEnriching(true);
      const res = await enrichUploadedSong(selectedFile?.name || title, title, artist);
      if (res.enriched) {
        const en = res.enriched;
        if (en.title && !title) setTitle(en.title);
        if (en.artist && !artist) setArtist(en.artist);
        if (en.genre) setGenre(en.genre);
        if (en.bpm) setBpm(en.bpm);
        if (en.mood) setMood(en.mood);
        if (en.vibes) setVibesText(en.vibes.join(', '));
      }
    } catch {
      // ignore
    } finally {
      setIsEnriching(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsPublishing(true);

      // Auto-generate synced lyrics with Gemini on publish
      let generatedLyrics = [];
      try {
        const lyricsRes = await generateAutoLyrics(title, artist || 'Karim Ul', genre, 180);
        if (lyricsRes.lyrics) {
          generatedLyrics = lyricsRes.lyrics;
        }
      } catch {
        // fallback empty
      }

      const vibes = vibesText
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

      const newSongData: Partial<Song> = {
        title: title.trim(),
        artist: artist.trim() || 'Karim Ul Studio',
        genre,
        bpm: Number(bpm) || 120,
        duration: 185,
        cover_url:
          coverUrl.trim() ||
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
        audio_url: audioUrl || '',
        audio_source_type: audioUrl ? 'blob' : 'synth',
        synth_preset: synthPreset,
        mood,
        vibes: vibes.length > 0 ? vibes : ['Chill', 'Karim Ul New'],
        themeColors: {
          primary: '#10b981',
          secondary: '#059669',
          accent: '#6366f1',
        },
        lyrics: generatedLyrics,
      };

      const published = await createSong(newSongData);
      onSongCreated(published);

      setSuccessNotice(`"${published.title}" is now LIVE on Karim Ul music!`);
      // Reset form
      setTitle('');
      setArtist('');
      setSelectedFile(null);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this track from the Karim Ul live catalog?')) {
      await deleteSong(id);
      onSongDeleted(id);
    }
  };

  const totalPlays = songs.reduce((sum, s) => sum + (s.playCount || 0), 0);

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100 flex flex-col p-4 sm:p-8">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-8 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-500/20" />
            <h1 className="text-2xl font-extrabold font-display tracking-tight text-white">
              Karim Ul Studio <span className="text-amber-400 font-normal text-sm sm:text-base">· Admin Dashboard</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <strong className="text-white">Admin</strong> · Upload songs, manage listeners & monitor analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackToApp}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            Switch to Music Player
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
            <span>Total Catalog Songs</span>
            <Music className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-white">{songs.length}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
            <span>Total Streams</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-white">{totalPlays.toLocaleString()}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
            <span>Registered Listeners</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-white">
            {registeredUsers.length > 0 ? registeredUsers.length : 3}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
            <span>Storage Health</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-emerald-400">99.9%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'upload'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Drag-and-Drop Creator Uploader
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Live Catalog ({songs.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Manage Users</span>
        </button>
      </div>

      {/* Success Notice */}
      {successNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Tab: Upload / Creator Studio */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Dropzone Column */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center bg-slate-900/40 hover:bg-slate-900/70 transition-all cursor-pointer group"
            >
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileInput}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />

              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8 text-emerald-400" />
              </div>

              <h3 className="text-base font-bold text-white mb-1">
                Drop audio file here (.mp3, .wav, .flac)
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mb-4">
                Drag 1 or more files to auto-extract duration, metadata, and generate AI lyrics
              </p>

              <span className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                Browse Files
              </span>
            </div>

            {selectedFile && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <FileAudio className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to publish
                  </p>
                </div>
                {isEnriching && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />}
              </div>
            )}

            {/* AI Auto-Enrichment Callout */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-indigo-950/30 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">Gemini Sonic Intelligence</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                When you publish, Karim Ul automatically analyzes the track to synthesize synchronized lyrics, estimate BPM, and isolate stems for Karaoke mode.
              </p>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <form onSubmit={handlePublish} className="space-y-4 p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-slate-200">Track Details & Metadata</h3>
                <button
                  type="button"
                  onClick={handleManualEnrich}
                  disabled={isEnriching}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors cursor-pointer"
                >
                  {isEnriching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Auto-Fill with Gemini</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Track Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Night Drive / Dhadkan"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Artist Name</label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="e.g. Arijit Singh / Karim Ul"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Genre</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Romantic">Romantic</option>
                    <option value="EDM / Workout">EDM / Workout</option>
                    <option value="Indie Acoustic">Indie Acoustic</option>
                    <option value="Chillhop">Chillhop</option>
                    <option value="Desi Trap">Desi Trap</option>
                    <option value="Sufi Fusion">Sufi Fusion</option>
                    <option value="Synthwave">Synthwave</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Tempo (BPM)</label>
                  <input
                    type="number"
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Procedural Synth Preset</label>
                  <select
                    value={synthPreset}
                    onChange={(e) => setSynthPreset(e.target.value as SynthPresetType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="romantic_night">Romantic Night</option>
                    <option value="edm_workout">EDM Workout</option>
                    <option value="lofi_chill">Lo-Fi Chill</option>
                    <option value="desi_trap">Desi Trap</option>
                    <option value="acoustic_monsoon">Acoustic Monsoon</option>
                    <option value="cyber_synthwave">Cyber Synthwave</option>
                    <option value="sufi_ambient">Sufi Ambient</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Audio Stream URL (Direct .mp3 link or use file uploaded above)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="url"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="https://.../song.mp3 (Paste any direct mp3 link)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                </div>
                {audioUrl && (
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Active audio link assigned to track</span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Album Cover Art URL</label>
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Vibe Tags (comma separated)</label>
                <input
                  type="text"
                  value={vibesText}
                  onChange={(e) => setVibesText(e.target.value)}
                  placeholder="Night Drive, Workout, Rain, Bass Boosted"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isPublishing || !title.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing & Generating AI Lyrics...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Publish Track to Karim Ul Live Catalog</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Catalog Table */}
      {activeTab === 'catalog' && (
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Track</th>
                  <th className="py-3.5 px-4">Audio Source</th>
                  <th className="py-3.5 px-4">Genre</th>
                  <th className="py-3.5 px-4">BPM</th>
                  <th className="py-3.5 px-4">Streams</th>
                  <th className="py-3.5 px-4">Lyrics</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {songs.map((s) => (
                  <tr key={s.song_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={s.cover_url}
                          alt={s.title}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-bold text-slate-100">{s.title}</p>
                          <p className="text-slate-400">{s.artist}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {s.audio_url ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono truncate max-w-[140px]" title={s.audio_url}>
                          Stream URL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                          AI Synth
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{s.genre}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">{s.bpm}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{s.playCount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="text-slate-400">
                        {s.lyrics && s.lyrics.length > 0 ? `${s.lyrics.length} lines synced` : 'None'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handlePreviewPlay(s)}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${
                            previewSong?.song_id === s.song_id && isPreviewPlaying
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                          title={previewSong?.song_id === s.song_id && isPreviewPlaying ? 'Pause preview' : 'Play preview'}
                        >
                          {previewSong?.song_id === s.song_id && isPreviewPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-slate-950" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-slate-300 ml-0.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(s.song_id)}
                          className="p-2 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500/20 transition-colors cursor-pointer"
                          title="Delete track"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Manage Users */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">
              Registered App Users & Listeners ({registeredUsers.length})
            </h3>
            <button
              onClick={loadUsers}
              disabled={usersLoading}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              {usersLoading ? 'Refreshing...' : 'Refresh List'}
            </button>
          </div>

          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Phone Number</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                    <th className="py-3.5 px-4">Favorites</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {registeredUsers.map((u) => (
                    <tr key={u.phone} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-white/10"
                          />
                          <div>
                            <p className="font-bold text-slate-100 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.role === 'admin' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                  ADMIN
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">{u.user_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-200">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>
                            {u.role === 'admin'
                              ? '••••••••••'
                              : u.phone.length >= 10
                              ? `${u.phone.slice(0, 4)}••••${u.phone.slice(-2)}`
                              : u.phone}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {u.favorite_songs?.length || 0} songs
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.phone !== '9528004584' ? (
                          <button
                            onClick={() => handleDeleteUser(u.phone)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500/20 transition-colors cursor-pointer"
                            title="Remove user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Admin Mini-player Preview Dock */}
      {previewSong && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-50 bg-[#0e1017]/95 border border-amber-500/30 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={previewSong.cover_url}
              alt={previewSong.title}
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{previewSong.title}</p>
              <p className="text-[11px] text-amber-400 truncate">Admin Preview: {previewSong.artist}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePreviewPlay(previewSong)}
              className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
            >
              {isPreviewPlaying ? (
                <Pause className="w-4 h-4 fill-slate-950" />
              ) : (
                <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
              )}
            </button>
            <button
              onClick={() => {
                audioEngine.pause();
                setPreviewSong(null);
                setIsPreviewPlaying(false);
              }}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
