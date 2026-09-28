import React, { useState, useEffect, useRef } from 'react';
import { SyncPlayRoom, RoomParticipant, Song } from '../types/music';
import {
  createListenTogetherRoom,
  joinListenTogetherRoom,
  getListenTogetherRoom,
  updateRoomPlayback,
  sendRoomMessage,
} from '../services/api';
import { Users, X, Copy, Check, Send, Sparkles, Radio, Loader2 } from 'lucide-react';

interface ListenTogetherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: Song | null;
  onSyncPlaySong: (songId: string, isPlaying: boolean, currentTime: number) => void;
  activeRoom: SyncPlayRoom | null;
  setActiveRoom: (room: SyncPlayRoom | null) => void;
  currentUser: RoomParticipant | null;
  setCurrentUser: (user: RoomParticipant | null) => void;
}

export const ListenTogetherModal: React.FC<ListenTogetherModalProps> = ({
  isOpen,
  onClose,
  currentSong,
  onSyncPlaySong,
  activeRoom,
  setActiveRoom,
  currentUser,
  setCurrentUser,
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [userNameInput, setUserNameInput] = useState('Rahul');
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [floatingReaction, setFloatingReaction] = useState<string | null>(null);

  const pollIntervalRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Poll room updates if in room
  useEffect(() => {
    if (activeRoom) {
      pollIntervalRef.current = window.setInterval(async () => {
        try {
          const res = await getListenTogetherRoom(activeRoom.code);
          if (res.room) {
            // Check if song or play state changed from remote host
            if (
              res.room.currentSongId !== activeRoom.currentSongId ||
              res.room.isPlaying !== activeRoom.isPlaying
            ) {
              onSyncPlaySong(res.room.currentSongId, res.room.isPlaying, res.room.currentTime);
            }
            setActiveRoom(res.room);
          }
        } catch {
          // ignore transient poll errors
        }
      }, 3000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [activeRoom, onSyncPlaySong, setActiveRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeRoom?.messages]);

  const handleCreateRoom = async () => {
    try {
      setLoading(true);
      const { room, user } = await createListenTogetherRoom(
        userNameInput.trim() || 'Host',
        currentSong?.song_id
      );
      setActiveRoom(room);
      setCurrentUser(user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) return;
    try {
      setLoading(true);
      const { room, user } = await joinListenTogetherRoom(
        roomCodeInput.trim().toUpperCase(),
        userNameInput.trim() || 'Guest'
      );
      setActiveRoom(room);
      setCurrentUser(user);
      onSyncPlaySong(room.currentSongId, room.isPlaying, room.currentTime);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (activeRoom) {
      navigator.clipboard.writeText(activeRoom.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeRoom || !currentUser) return;
    try {
      const text = chatInput;
      setChatInput('');
      const res = await sendRoomMessage(activeRoom.code, {
        sender: currentUser.name,
        text,
      });
      setActiveRoom(res.room);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReaction = async (emoji: string) => {
    if (!activeRoom || !currentUser) return;
    setFloatingReaction(emoji);
    setTimeout(() => setFloatingReaction(null), 1500);

    try {
      const res = await sendRoomMessage(activeRoom.code, {
        sender: currentUser.name,
        reaction: emoji,
      });
      setActiveRoom(res.room);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl select-none">
      <div className="relative w-full max-w-lg bg-[#0e1017] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Floating emoji animation */}
        {floatingReaction && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl animate-bounce pointer-events-none z-50">
            {floatingReaction}
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white">Listen Together (Sync-Play)</h2>
            <p className="text-xs text-slate-400">Stream in perfect real-time sync with friends</p>
          </div>
        </div>

        {!activeRoom ? (
          /* Join or Create Screen */
          <div className="space-y-5 my-auto py-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Your Display Name
              </label>
              <input
                type="text"
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                placeholder="e.g. Rahul / Sara"
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Create a New Room
              </span>
              <p className="text-xs text-slate-400 mb-3">
                Start a lounge and share your code so friends listen in real-time.
              </p>
              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Start New Sound Lounge</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-[#0e1017] px-3 text-xs text-slate-500 font-mono">OR</span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Join with Room Code
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value)}
                  placeholder="e.g. KARIM-842"
                  className="flex-1 uppercase font-mono tracking-wider bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={loading || !roomCodeInput.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs border border-cyan-500/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Active Room Screen */
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            {/* Room Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-indigo-950/40 border border-cyan-500/30 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    {activeRoom.name}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Code: <strong className="font-mono text-white">{activeRoom.code}</strong>
                </p>
              </div>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-medium border border-cyan-500/30 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Invite'}</span>
              </button>
            </div>

            {/* Participants Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-400 flex-shrink-0">
                Listeners ({activeRoom.participants.length}):
              </span>
              <div className="flex items-center gap-1.5">
                {activeRoom.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200"
                    title={p.isHost ? 'Host' : 'Listener'}
                  >
                    <span className="font-medium">{p.name}</span>
                    {p.isHost && <span className="text-[10px] text-amber-400">👑</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Live Emoji Reactions Bar */}
            <div className="flex items-center justify-center gap-3 py-1">
              {['🔥', '💃', '🎧', '❤️', '⚡', '🙌'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="text-xl p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/60 hover:scale-125 transition-transform active:scale-95 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Room Chat Log */}
            <div className="flex-1 overflow-y-auto space-y-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 max-h-48 text-xs">
              {activeRoom.messages.map((m) => (
                <div key={m.id} className="flex flex-col">
                  {m.reaction ? (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <strong className="text-slate-300">{m.sender}</strong>
                      <span>reacted</span>
                      <span className="text-base">{m.reaction}</span>
                    </div>
                  ) : (
                    <div>
                      <strong className="text-cyan-400 mr-1.5">{m.sender}:</strong>
                      <span className="text-slate-200">{m.text}</span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Say something to the lounge..."
                className="flex-1 bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleSendMessage}
                className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Leave Room */}
            <button
              onClick={() => {
                setActiveRoom(null);
                setCurrentUser(null);
              }}
              className="text-xs text-rose-400 hover:text-rose-300 py-1 transition-colors text-center cursor-pointer"
            >
              Leave Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
