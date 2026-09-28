import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_SONGS } from './src/data/defaultSongs.js';
import { Song, SyncPlayRoom, RoomParticipant, RoomMessage, UserProfile } from './src/types/music.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory persistent database for songs and active rooms
let songsDatabase: Song[] = [...INITIAL_SONGS];
const syncRooms: Map<string, SyncPlayRoom> = new Map();

// Users Database with default Admin and initial active listeners
const usersDatabase: Map<string, { profile: UserProfile; passwordHash: string }> = new Map([
  [
    '9528004584',
    {
      profile: {
        user_id: 'ADMIN_001',
        name: 'Karim Ul (Admin)',
        phone: '9528004584',
        email: 'admin@karim-ul.app',
        role: 'admin',
        favorite_songs: ['S201', 'S205'],
        joinedAt: '2026-01-01T00:00:00.000Z',
        lastActive: new Date().toISOString(),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      },
      passwordHash: 'Abdul@1212',
    },
  ],
  [
    '9876543210',
    {
      profile: {
        user_id: 'U101',
        name: 'Rahul Sharma',
        phone: '9876543210',
        email: 'rahul@example.com',
        role: 'user',
        favorite_songs: ['S201', 'S202'],
        joinedAt: '2026-02-15T00:00:00.000Z',
        lastActive: new Date().toISOString(),
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      },
      passwordHash: 'User@123',
    },
  ],
  [
    '9811223344',
    {
      profile: {
        user_id: 'U102',
        name: 'Aanya Verma',
        phone: '9811223344',
        email: 'aanya@example.com',
        role: 'user',
        favorite_songs: ['S203', 'S204'],
        joinedAt: '2026-03-01T00:00:00.000Z',
        lastActive: new Date().toISOString(),
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
      },
      passwordHash: 'Pass@123',
    },
  ],
]);

// Initialize shared Google GenAI instance
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ==========================================
  // 1. Songs API
  // ==========================================

  // Trending / All songs
  app.get('/api/songs', (_req, res) => {
    res.json({ songs: songsDatabase });
  });

  app.get('/api/songs/trending', (_req, res) => {
    const trending = [...songsDatabase].sort((a, b) => b.playCount - a.playCount);
    res.json({ songs: trending });
  });

  // Search songs
  app.get('/api/songs/search', (req, res) => {
    const query = String(req.query.q || '').toLowerCase().trim();
    if (!query) {
      return res.json({ songs: songsDatabase });
    }

    const filtered = songsDatabase.filter(
      (song) =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.genre.toLowerCase().includes(query) ||
        song.mood.toLowerCase().includes(query) ||
        song.vibes.some((v) => v.toLowerCase().includes(query))
    );
    res.json({ songs: filtered });
  });

  // Create new song (Admin / Studio upload)
  app.post('/api/songs', (req, res) => {
    try {
      const newSong: Song = {
        ...req.body,
        song_id: req.body.song_id || `S_${Date.now()}`,
        playCount: req.body.playCount || 0,
        uploadedAt: new Date().toISOString(),
      };
      songsDatabase.unshift(newSong);
      res.status(201).json({ song: newSong, success: true });
    } catch {
      res.status(400).json({ error: 'Failed to create song' });
    }
  });

  // Update song
  app.put('/api/songs/:id', (req, res) => {
    const { id } = req.params;
    const index = songsDatabase.findIndex((s) => s.song_id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Song not found' });
    }

    songsDatabase[index] = { ...songsDatabase[index], ...req.body };
    res.json({ song: songsDatabase[index], success: true });
  });

  // Delete song
  app.delete('/api/songs/:id', (req, res) => {
    const { id } = req.params;
    songsDatabase = songsDatabase.filter((s) => s.song_id !== id);
    res.json({ success: true, message: `Song ${id} deleted` });
  });

  // Increment play count
  app.post('/api/songs/:id/play', (req, res) => {
    const { id } = req.params;
    const song = songsDatabase.find((s) => s.song_id === id);
    if (song) {
      song.playCount = (song.playCount || 0) + 1;
    }
    res.json({ success: true, playCount: song?.playCount });
  });

  // ==========================================
  // Auth & User Management Endpoints
  // ==========================================

  // Login handler
  app.post('/api/auth/login', (req, res) => {
    const { phone, password } = req.body;
    const cleanPhone = String(phone || '').trim().replace(/[\s-]/g, '');
    const cleanPass = String(password || '').trim();

    if (!cleanPhone || !cleanPass) {
      return res.status(400).json({ error: 'Phone number and password are required.' });
    }

    // 1. Check exact Admin Credentials
    if (cleanPhone === '9528004584' && cleanPass === 'Abdul@1212') {
      const adminEntry = usersDatabase.get('9528004584');
      if (adminEntry) {
        adminEntry.profile.lastActive = new Date().toISOString();
        return res.json({
          success: true,
          role: 'admin',
          user: adminEntry.profile,
          message: 'Welcome Boss! Admin access granted.',
        });
      }
    }

    // 2. Normal User Authentication
    const existing = usersDatabase.get(cleanPhone);
    if (existing) {
      if (existing.passwordHash === cleanPass) {
        existing.profile.lastActive = new Date().toISOString();
        return res.json({
          success: true,
          role: existing.profile.role,
          user: existing.profile,
          message: `Welcome back, ${existing.profile.name}!`,
        });
      } else {
        return res.status(401).json({ error: 'Galat password! Please check your password.' });
      }
    }

    // If new phone number with valid credentials format, auto-register as Normal User
    if (cleanPhone.length >= 10 && cleanPass.length >= 4) {
      const newUserId = `U${100 + usersDatabase.size + 1}`;
      const newUserProfile: UserProfile = {
        user_id: newUserId,
        name: `Listener ${cleanPhone.slice(-4)}`,
        phone: cleanPhone,
        email: `${cleanPhone}@karim-ul.app`,
        role: 'user',
        favorite_songs: ['S201'],
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      };
      usersDatabase.set(cleanPhone, {
        profile: newUserProfile,
        passwordHash: cleanPass,
      });

      return res.json({
        success: true,
        role: 'user',
        user: newUserProfile,
        message: 'Account created! Welcome to Karim Ul music.',
      });
    }

    return res.status(401).json({ error: 'Phone number ya password sahi nahi hai.' });
  });

  // Get all registered users (for Admin Panel)
  app.get('/api/admin/users', (_req, res) => {
    const list = Array.from(usersDatabase.values()).map((u) => u.profile);
    res.json({ users: list });
  });

  // Delete/Deactivate user (Admin operation)
  app.delete('/api/admin/users/:phone', (req, res) => {
    const { phone } = req.params;
    if (phone === '9528004584') {
      return res.status(403).json({ error: 'Cannot delete master Admin account.' });
    }
    const existed = usersDatabase.delete(phone);
    if (!existed) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, message: `User ${phone} removed.` });
  });

  // ==========================================
  // 2. AI Voice DJ & Intelligent Music Curation
  // ==========================================

  app.post('/api/gemini/dj', async (req, res) => {
    try {
      const { userPrompt, currentSongId, userMood } = req.body;

      // Extract song catalog summary for Gemini prompt
      const catalogSummary = songsDatabase.map((s) => ({
        id: s.song_id,
        title: s.title,
        artist: s.artist,
        genre: s.genre,
        bpm: s.bpm,
        mood: s.mood,
        vibes: s.vibes,
      }));

      const systemInstruction = `
You are "DJ Karim Ul", the signature, ultra-stylish AI Voice DJ of the premium "Karim Ul" music app.
Your tone: Charismatic, warm, energetic, and culturally fluent (effortlessly mixing English with authentic Hindi/Hinglish vibes like "Aapka host DJ Karim Ul", "Crank up the volume", "Vibe check", "Ye track seedha dil ko chhu lega").
Your job:
1. Interpret the user's voice/text command (e.g. "Karim Ul, workout wale gaane chalao", "late night drive lo-fi chill", "I am feeling heartbroken").
2. Write a short, punchy 2-3 sentence DJ radio spoken voiceover intro introducing the upcoming playlist in that charismatic radio host style.
3. Select and order the most appropriate song IDs from the provided catalog that match the energy, BPM, and mood.
4. Output in clean JSON format matching the schema.
`;

      const prompt = `
Listener's Request: "${userPrompt || 'Surprise me with a great vibe'}"
Current playing song ID: "${currentSongId || 'none'}"
Listener context: "${userMood || 'Unspecified'}"

Available song catalog:
${JSON.stringify(catalogSummary, null, 2)}
`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              djCommentary: {
                type: Type.STRING,
                description: 'The spoken charismatic radio DJ voiceover intro text in English/Hinglish.',
              },
              suggestedSongIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of matching song IDs ordered for the ideal DJ set transition.',
              },
              bpmTarget: {
                type: Type.NUMBER,
                description: 'The average target BPM for this set.',
              },
              genreFocus: {
                type: Type.STRING,
                description: 'Main genre focus label.',
              },
              moodTag: {
                type: Type.STRING,
                description: 'Short aesthetic mood label, e.g. "138 BPM High Voltage Workout" or "Late Night Acoustic Rain".',
              },
            },
            required: ['djCommentary', 'suggestedSongIds', 'moodTag'],
          },
        },
      });

      const parsedData = JSON.parse(aiResponse.text || '{}');

      // Attempt TTS voice generation for DJ commentary using gemini-3.8-flash-lite-tts
      let voiceAudioBase64: string | undefined = undefined;
      try {
        if (parsedData.djCommentary && process.env.GEMINI_API_KEY) {
          const ttsResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: parsedData.djCommentary,
                    speechMetadata: {
                      style: 'Charismatic, smooth, energetic late-night radio and club DJ host',
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Puck' },
                },
              },
            },
          });
          voiceAudioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        }
      } catch (ttsError) {
        // Fallback gracefully without blocking response
        console.warn('TTS generation fallback:', ttsError);
      }

      res.json({
        query: userPrompt,
        djCommentary: parsedData.djCommentary || 'Aapka DJ Karim Ul here! Let the beats take control.',
        voiceAudioBase64,
        suggestedSongIds: parsedData.suggestedSongIds && parsedData.suggestedSongIds.length > 0 
          ? parsedData.suggestedSongIds 
          : songsDatabase.map((s) => s.song_id).slice(0, 4),
        bpmTarget: parsedData.bpmTarget || 120,
        genreFocus: parsedData.genreFocus || 'Curated Mix',
        moodTag: parsedData.moodTag || 'Karim Ul Curated Session',
      });
    } catch (err: unknown) {
      console.error('DJ API error:', err);
      // Fallback response so user always gets an awesome experience
      res.json({
        query: req.body.userPrompt || 'Trending Beats',
        djCommentary: "Aapka host DJ Karim Ul here! Crank up the volume, we've loaded up the absolute hottest soundscapes for your session right now. Turn it up!",
        suggestedSongIds: songsDatabase.map((s) => s.song_id).slice(0, 4),
        bpmTarget: 125,
        genreFocus: 'All-Star Beats',
        moodTag: 'Karim Ul Fresh Session',
      });
    }
  });

  // ==========================================
  // 3. Auto-Lyrics Generator (Whisper / Sync Simulator)
  // ==========================================

  app.post('/api/gemini/lyrics', async (req, res) => {
    try {
      const { title, artist, genre, duration } = req.body;

      const prompt = `
Generate time-synchronized lyrics in LRC style for the song:
Title: "${title || 'Untitled Track'}"
Artist: "${artist || 'Karim Ul'}"
Genre: "${genre || 'Pop'}"
Duration: ${duration || 180} seconds

Generate 10 to 18 lines of evocative, poetic lyrics (mix of Hindi/Urdu and English where appropriate, or pure Hindi/English depending on genre).
Each line must have an accurate timestamp in seconds (from 0 to ${Math.floor((duration || 180) - 10)}) where it should be sung.
`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert audio lyrics transcriber and songwriter. Generate realistic synchronized lyrics with line timestamps in seconds.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lyrics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.NUMBER, description: 'Timestamp in seconds' },
                    text: { type: Type.STRING, description: 'Lyric text line' },
                  },
                  required: ['time', 'text'],
                },
              },
            },
            required: ['lyrics'],
          },
        },
      });

      const data = JSON.parse(aiResponse.text || '{"lyrics":[]}');
      res.json({ lyrics: data.lyrics, success: true });
    } catch (err) {
      console.error('Lyrics generation error:', err);
      res.status(500).json({ error: 'Failed to generate synced lyrics' });
    }
  });

  // ==========================================
  // 4. AI Metadata Enrichment for Audio Uploads
  // ==========================================

  app.post('/api/gemini/metadata', async (req, res) => {
    try {
      const { filename, titleHint, artistHint } = req.body;

      const prompt = `
Analyze this audio file metadata and generate complete music tags:
Filename: "${filename}"
Title hint: "${titleHint || ''}"
Artist hint: "${artistHint || ''}"

Infer or generate:
- Clean Song Title
- Artist Name
- Genre (e.g. Romantic, EDM / Workout, Indie Acoustic, Chillhop, Desi Trap, Sufi, Synthwave)
- Estimated BPM (number)
- Estimated Duration (number between 150 and 240 seconds)
- Aesthetic Mood
- 4 Vibe tags
- Poetic track description
- Hex color palette (primary, secondary, accent) suited to the music mood
- Suggested Synth preset if procedural: one of ['romantic_night', 'edm_workout', 'lofi_chill', 'desi_trap', 'acoustic_monsoon', 'cyber_synthwave', 'sufi_ambient']
`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite music studio executive and sonic archivist for Karim Ul.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              genre: { type: Type.STRING },
              bpm: { type: Type.NUMBER },
              duration: { type: Type.NUMBER },
              mood: { type: Type.STRING },
              vibes: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING },
              synth_preset: { type: Type.STRING },
              themeColors: {
                type: Type.OBJECT,
                properties: {
                  primary: { type: Type.STRING },
                  secondary: { type: Type.STRING },
                  accent: { type: Type.STRING },
                },
                required: ['primary', 'secondary', 'accent'],
              },
            },
            required: ['title', 'artist', 'genre', 'bpm', 'mood', 'vibes', 'themeColors'],
          },
        },
      });

      const enriched = JSON.parse(aiResponse.text || '{}');
      res.json({ enriched, success: true });
    } catch (err) {
      console.error('Metadata enrichment error:', err);
      res.status(500).json({ error: 'Failed to enrich audio metadata' });
    }
  });

  // ==========================================
  // 5. Listen Together (Sync-Play Real-Time Rooms)
  // ==========================================

  // Create room
  app.post('/api/room/create', (req, res) => {
    const { hostName, initialSongId } = req.body;
    const roomCode = `KARIM-${Math.floor(100 + Math.random() * 900)}`;

    const hostParticipant: RoomParticipant = {
      id: `user_${Date.now()}`,
      name: hostName || 'Music Fan',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      isHost: true,
      joinedAt: Date.now(),
    };

    const newRoom: SyncPlayRoom = {
      code: roomCode,
      name: `${hostParticipant.name}'s Sound Lounge`,
      hostId: hostParticipant.id,
      currentSongId: initialSongId || songsDatabase[0]?.song_id || 'S201',
      isPlaying: true,
      currentTime: 0,
      updatedAt: Date.now(),
      participants: [hostParticipant],
      messages: [
        {
          id: `msg_${Date.now()}`,
          sender: 'Karim Ul Bot',
          text: `Welcome to Listen Together! Room ${roomCode} is live. Any track played is synchronized for all listeners.`,
          timestamp: Date.now(),
        },
      ],
    };

    syncRooms.set(roomCode, newRoom);
    res.json({ room: newRoom, user: hostParticipant });
  });

  // Get room state
  app.get('/api/room/:code', (req, res) => {
    const { code } = req.params;
    const room = syncRooms.get(code.toUpperCase());
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ room });
  });

  // Join room
  app.post('/api/room/:code/join', (req, res) => {
    const { code } = req.params;
    const { userName } = req.body;
    const room = syncRooms.get(code.toUpperCase());

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const newParticipant: RoomParticipant = {
      id: `user_${Date.now()}`,
      name: userName || `Listener ${room.participants.length + 1}`,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      isHost: false,
      joinedAt: Date.now(),
    };

    room.participants.push(newParticipant);
    room.messages.push({
      id: `msg_${Date.now()}`,
      sender: 'System',
      text: `${newParticipant.name} joined the sync session!`,
      timestamp: Date.now(),
    });

    res.json({ room, user: newParticipant });
  });

  // Update room playback state (Sync play/pause/seek/song)
  app.post('/api/room/:code/action', (req, res) => {
    const { code } = req.params;
    const { songId, isPlaying, currentTime } = req.body;
    const room = syncRooms.get(code.toUpperCase());

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (songId) room.currentSongId = songId;
    if (isPlaying !== undefined) room.isPlaying = isPlaying;
    if (currentTime !== undefined) room.currentTime = currentTime;
    room.updatedAt = Date.now();

    res.json({ room, success: true });
  });

  // Send message / reaction in room
  app.post('/api/room/:code/chat', (req, res) => {
    const { code } = req.params;
    const { sender, text, reaction } = req.body;
    const room = syncRooms.get(code.toUpperCase());

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const newMessage: RoomMessage = {
      id: `msg_${Date.now()}`,
      sender: sender || 'Anonymous',
      text: text || '',
      reaction,
      timestamp: Date.now(),
    };

    room.messages.push(newMessage);
    if (room.messages.length > 50) {
      room.messages.shift();
    }

    res.json({ room, message: newMessage });
  });

  // ==========================================
  // 6. Vite Middleware or Static Serves
  // ==========================================

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Karim Ul Server active on http://0.0.0.0:${port}`);
  });
}

startServer();
