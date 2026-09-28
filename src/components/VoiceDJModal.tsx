import React, { useState, useEffect, useRef } from 'react';
import { Song, AIDJResponse } from '../types/music';
import { requestAIDJ } from '../services/api';
import { Mic, MicOff, Sparkles, X, Play, Loader2, Volume2 } from 'lucide-react';

interface VoiceDJModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: Song | null;
  allSongs: Song[];
  onPlayDJMix: (songs: Song[]) => void;
}

export const VoiceDJModal: React.FC<VoiceDJModalProps> = ({
  isOpen,
  onClose,
  currentSong,
  allSongs,
  onPlayDJMix,
}) => {
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [djResult, setDjResult] = useState<AIDJResponse | null>(null);
  const [isPlayingDJVoice, setIsPlayingDJVoice] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const samplePrompts = [
    'Karim Ul, workout wale gaane chalao',
    'Late night drive lo-fi chill',
    'Romantic acoustic guitar with rain vibes',
    'Heavy 808 bass & desi trap energy',
  ];

  // Speech Recognition setup (Web Speech API)
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new (SpeechRecognition as new () => {
          continuous: boolean;
          lang: string;
          interimResults: boolean;
          onresult: (e: { results: Array<Array<{ transcript: string }>> }) => void;
          onerror: () => void;
          onend: () => void;
          start: () => void;
          stop: () => void;
        })();
        recognition.continuous = false;
        recognition.lang = 'hi-IN'; // accepts Hinglish & English
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setPromptText(transcript);
          setIsListening(false);
          handleTriggerDJ(transcript);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      } catch {
        recognitionRef.current = null;
      }
    }
  }, []);

  const toggleMicListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        (recognitionRef.current as { stop: () => void }).stop();
      }
      setIsListening(false);
    } else {
      setIsListening(true);
      if (recognitionRef.current) {
        (recognitionRef.current as { start: () => void }).start();
      } else {
        // Fallback simulate voice input after 2 seconds
        setTimeout(() => {
          setIsListening(false);
          const randomSample = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
          setPromptText(randomSample);
          handleTriggerDJ(randomSample);
        }, 1500);
      }
    }
  };

  const handleTriggerDJ = async (queryToUse?: string) => {
    const query = queryToUse || promptText;
    if (!query.trim()) return;

    setIsLoading(true);
    setDjResult(null);

    try {
      const res = await requestAIDJ(query, currentSong?.song_id);
      setDjResult(res);

      // If DJ voice TTS audio returned from backend, play it!
      if (res.voiceAudioBase64) {
        const audioSrc = `data:audio/mp3;base64,${res.voiceAudioBase64}`;
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        audioRef.current.src = audioSrc;
        setIsPlayingDJVoice(true);
        audioRef.current.play().catch(() => {});
        audioRef.current.onended = () => setIsPlayingDJVoice(false);
      } else if ('speechSynthesis' in window && res.djCommentary) {
        // Fallback to browser Web Speech API
        const utter = new SpeechSynthesisUtterance(res.djCommentary);
        utter.rate = 1.05;
        utter.pitch = 0.95;
        setIsPlayingDJVoice(true);
        utter.onend = () => setIsPlayingDJVoice(false);
        window.speechSynthesis.speak(utter);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySet = () => {
    if (!djResult) return;
    const matchedSongs = djResult.suggestedSongIds
      .map((id) => allSongs.find((s) => s.song_id === id))
      .filter((s): s is Song => Boolean(s));

    if (matchedSongs.length > 0) {
      onPlayDJMix(matchedSongs);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <div className="relative w-full max-w-lg bg-[#0e1017] border border-white/10 rounded-3xl p-6 shadow-2xl shadow-emerald-500/10 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white">Karim Ul AI Voice DJ</h2>
            <p className="text-xs text-slate-400">Ask your personal AI radio host to curate beats</p>
          </div>
        </div>

        {/* Voice & Text Input */}
        <div className="relative flex items-center mb-4">
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTriggerDJ()}
            placeholder="e.g. 'Karim Ul, workout wale gaane chalao'..."
            className="w-full bg-slate-900/80 border border-slate-700/60 rounded-2xl py-3.5 pl-4 pr-24 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            <button
              onClick={toggleMicListening}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title={isListening ? 'Listening... click to stop' : 'Speak to Karim Ul'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={() => handleTriggerDJ()}
              disabled={isLoading || !promptText.trim()}
              className="p-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Suggested Quick Prompts */}
        <div className="mb-5">
          <span className="text-xs font-semibold text-slate-400 block mb-2">Try asking:</span>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((sp, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPromptText(sp);
                  handleTriggerDJ(sp);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 transition-colors cursor-pointer"
              >
                "{sp}"
              </button>
            ))}
          </div>
        </div>

        {/* DJ Response / Commentary */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <div className="relative mb-3">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <Sparkles className="w-5 h-5 text-emerald-400 absolute inset-0 m-auto" />
            </div>
            <p className="text-sm font-medium text-slate-300">DJ Karim Ul is mixing your tracklist...</p>
            <p className="text-xs text-slate-500 mt-1">Analyzing BPM, key, and vibe</p>
          </div>
        )}

        {djResult && (
          <div className="space-y-4 pt-2 border-t border-white/5 animate-fade-in">
            {/* DJ Host Voiceover Box */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-indigo-950/40 border border-emerald-500/30 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    DJ Karim Ul on Air
                  </span>
                </div>

                {isPlayingDJVoice && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                    <span>Speaking</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-200 italic leading-relaxed">
                "{djResult.djCommentary}"
              </p>

              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                <span>Vibe: <strong className="text-slate-200">{djResult.moodTag}</strong></span>
                <span>·</span>
                <span>Target: <strong className="text-slate-200">{djResult.bpmTarget} BPM</strong></span>
              </div>
            </div>

            {/* Curated Playlist Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Curated DJ Setlist ({djResult.suggestedSongIds.length} Tracks)
                </span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {djResult.suggestedSongIds.map((songId, idx) => {
                  const s = allSongs.find((item) => item.song_id === songId);
                  if (!s) return null;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/50 border border-slate-800/60"
                    >
                      <span className="text-xs text-slate-500 font-mono w-4">{idx + 1}</span>
                      <img
                        src={s.cover_url}
                        alt={s.title}
                        className="w-9 h-9 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{s.title}</p>
                        <p className="text-xs text-slate-400 truncate">{s.artist}</p>
                      </div>
                      <span className="text-xs font-mono text-emerald-400/80">{s.bpm} BPM</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Play Button */}
            <button
              onClick={handleApplySet}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Drop the Needle & Play DJ Mix</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
