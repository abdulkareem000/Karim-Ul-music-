export interface SyncedLyricLine {
  time: number; // in seconds
  text: string;
}

export type SynthPresetType = 
  | 'romantic_night'
  | 'edm_workout'
  | 'lofi_chill'
  | 'desi_trap'
  | 'acoustic_monsoon'
  | 'cyber_synthwave'
  | 'sufi_ambient';

export interface Song {
  song_id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  duration: number; // in seconds
  cover_url: string;
  audio_url: string;
  audio_source_type: 'synth' | 'url' | 'blob';
  synth_preset?: SynthPresetType;
  lyrics: SyncedLyricLine[];
  lyrics_url?: string;
  mood: string;
  vibes: string[];
  playCount: number;
  isFavorite?: boolean;
  themeColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  uploadedAt?: string;
  description?: string;
}

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  favorite_songs: string[];
  joinedAt?: string;
  lastActive?: string;
  avatar?: string;
}

export interface RoomParticipant {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  joinedAt: number;
}

export interface RoomMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  reaction?: string;
}

export interface SyncPlayRoom {
  code: string;
  name: string;
  hostId: string;
  currentSongId: string;
  isPlaying: boolean;
  currentTime: number;
  updatedAt: number;
  participants: RoomParticipant[];
  messages: RoomMessage[];
}

export interface EqualizerBands {
  bass: number; // -12 to +12 dB
  mid: number;  // -12 to +12 dB
  treble: number; // -12 to +12 dB
  spatialWidth: number; // 0 (mono) to 1 (wide stereo)
}

export interface AIDJResponse {
  query: string;
  djCommentary: string;
  voiceAudioBase64?: string; // from Gemini TTS if available
  suggestedSongIds: string[];
  bpmTarget?: number;
  genreFocus?: string;
  moodTag?: string;
}
