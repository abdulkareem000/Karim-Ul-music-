import { Song, AIDJResponse, SyncPlayRoom, RoomParticipant, RoomMessage, UserProfile, UserRole } from '../types/music';

export async function loginUser(phone: string, password: string): Promise<{
  success: boolean;
  role: UserRole;
  user: UserProfile;
  message: string;
}> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  return data;
}

export async function fetchAdminUsers(): Promise<UserProfile[]> {
  const res = await fetch('/api/admin/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  const data = await res.json();
  return data.users;
}

export async function deleteAdminUser(phone: string): Promise<void> {
  const res = await fetch(`/api/admin/users/${phone}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete user');
  }
}

export async function fetchSongs(): Promise<Song[]> {
  const res = await fetch('/api/songs');
  if (!res.ok) throw new Error('Failed to fetch songs');
  const data = await res.json();
  return data.songs;
}

export async function fetchTrendingSongs(): Promise<Song[]> {
  const res = await fetch('/api/songs/trending');
  if (!res.ok) throw new Error('Failed to fetch trending songs');
  const data = await res.json();
  return data.songs;
}

export async function searchSongs(query: string): Promise<Song[]> {
  const res = await fetch(`/api/songs/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search songs');
  const data = await res.json();
  return data.songs;
}

export async function createSong(song: Partial<Song>): Promise<Song> {
  const res = await fetch('/api/songs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(song),
  });
  if (!res.ok) throw new Error('Failed to create song');
  const data = await res.json();
  return data.song;
}

export async function updateSong(id: string, updateData: Partial<Song>): Promise<Song> {
  const res = await fetch(`/api/songs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) throw new Error('Failed to update song');
  const data = await res.json();
  return data.song;
}

export async function deleteSong(id: string): Promise<void> {
  const res = await fetch(`/api/songs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete song');
}

export async function recordSongPlay(id: string): Promise<void> {
  await fetch(`/api/songs/${id}/play`, { method: 'POST' }).catch(() => {});
}

export async function requestAIDJ(
  userPrompt: string,
  currentSongId?: string,
  userMood?: string
): Promise<AIDJResponse> {
  const res = await fetch('/api/gemini/dj', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userPrompt, currentSongId, userMood }),
  });
  if (!res.ok) throw new Error('DJ API failed');
  return res.json();
}

export async function generateAutoLyrics(
  title: string,
  artist: string,
  genre: string,
  duration = 180
) {
  const res = await fetch('/api/gemini/lyrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, artist, genre, duration }),
  });
  if (!res.ok) throw new Error('Lyrics generation failed');
  return res.json();
}

export async function enrichUploadedSong(filename: string, titleHint = '', artistHint = '') {
  const res = await fetch('/api/gemini/metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, titleHint, artistHint }),
  });
  if (!res.ok) throw new Error('Metadata enrichment failed');
  return res.json();
}

// Sync Play Rooms
export async function createListenTogetherRoom(hostName: string, initialSongId?: string) {
  const res = await fetch('/api/room/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostName, initialSongId }),
  });
  if (!res.ok) throw new Error('Failed to create room');
  return res.json() as Promise<{ room: SyncPlayRoom; user: RoomParticipant }>;
}

export async function getListenTogetherRoom(code: string) {
  const res = await fetch(`/api/room/${code}`);
  if (!res.ok) throw new Error('Room not found');
  return res.json() as Promise<{ room: SyncPlayRoom }>;
}

export async function joinListenTogetherRoom(code: string, userName: string) {
  const res = await fetch(`/api/room/${code}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName }),
  });
  if (!res.ok) throw new Error('Failed to join room');
  return res.json() as Promise<{ room: SyncPlayRoom; user: RoomParticipant }>;
}

export async function updateRoomPlayback(
  code: string,
  action: { songId?: string; isPlaying?: boolean; currentTime?: number }
) {
  const res = await fetch(`/api/room/${code}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action),
  });
  return res.json();
}

export async function sendRoomMessage(
  code: string,
  payload: { sender: string; text?: string; reaction?: string }
) {
  const res = await fetch(`/api/room/${code}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json() as Promise<{ room: SyncPlayRoom; message: RoomMessage }>;
}
