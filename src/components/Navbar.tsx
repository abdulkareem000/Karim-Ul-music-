import React, { useRef, useState } from 'react';
import { UserRole, SyncPlayRoom, UserProfile } from '../types/music';
import { Search, Sparkles, Radio, Shield, Music, User, LogOut } from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAIDJ: () => void;
  onOpenSyncPlay: () => void;
  activeRoom: SyncPlayRoom | null;
  currentRole: UserRole;
  onOpenAdminStudio: () => void;
  onLogout: () => void;
  currentUser?: UserProfile | null;
  onShowAdminLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenAIDJ,
  onOpenSyncPlay,
  activeRoom,
  currentRole,
  onOpenAdminStudio,
  onLogout,
  currentUser,
  onShowAdminLogin,
}) => {
  // Hidden gesture: Click 'Karim Ul' logo 5 times within 3 seconds
  // Triggers admin studio if already admin, or opens admin login form
  const clickTimestampsRef = useRef<number[]>([]);
  const [gestureFlash, setGestureFlash] = useState(false);

  const handleLogoClick = () => {
    const now = Date.now();
    // Filter timestamps to only keep clicks within the last 3000ms (3 seconds)
    const recentClicks = [...clickTimestampsRef.current.filter((ts) => now - ts < 3000), now];
    clickTimestampsRef.current = recentClicks;

    if (recentClicks.length >= 5) {
      // Trigger subtle visual feedback
      setGestureFlash(true);
      setTimeout(() => setGestureFlash(false), 800);
      clickTimestampsRef.current = [];

      // Check role
      if (currentRole === 'admin') {
        onOpenAdminStudio();
      } else if (onShowAdminLogin) {
        onShowAdminLogin();
      } else {
        onOpenAdminStudio();
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-[#08090d]/80 border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo with Glow & Hidden 5-Click Admin Gesture */}
        <div
          onClick={handleLogoClick}
          className={`flex items-center gap-2.5 flex-shrink-0 cursor-pointer select-none transition-transform active:scale-95 ${
            gestureFlash ? 'ring-2 ring-amber-400/80 rounded-2xl p-1 bg-amber-500/10' : ''
          }`}
          title="Karim Ul"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-slate-800 to-indigo-600 p-[1px] shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#08090d] rounded-xl flex items-center justify-center">
              <Music className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight font-display text-white">
              Karim <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">Ul</span>
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-2 sm:mx-6">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tracks, artists, genres, or vibes..."
              className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl py-2 pl-9 pr-4 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* AI Voice DJ Trigger */}
          <button
            onClick={onOpenAIDJ}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 hover:from-emerald-500/30 hover:to-indigo-500/30 text-emerald-300 border border-emerald-500/30 transition-all text-xs font-semibold shadow-md shadow-emerald-500/10 cursor-pointer"
            title="Ask AI DJ Karim Ul"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="hidden md:inline">AI Voice DJ</span>
          </button>

          {/* Listen Together Trigger */}
          <button
            onClick={onOpenSyncPlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-xs font-semibold cursor-pointer border ${
              activeRoom
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-md shadow-cyan-500/15'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/60'
            }`}
            title="Listen Together Sync-Play"
          >
            <Radio className={`w-3.5 h-3.5 ${activeRoom ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="hidden lg:inline">{activeRoom ? activeRoom.code : 'Sync-Play'}</span>
          </button>

          {/* ONLY Admin sees Admin Studio Button */}
          {currentRole === 'admin' && (
            <button
              onClick={onOpenAdminStudio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-bold transition-all cursor-pointer"
              title="Open Admin Studio"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Admin Studio</span>
            </button>
          )}

          {/* User Profile / Logout Button */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-white/10">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/60 border border-slate-700/40 text-xs text-slate-300"
              title={`Logged in as ${currentUser?.name || 'Listener'}`}
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline font-medium">
                {currentUser?.role === 'admin' ? 'Admin' : currentUser?.name || 'Listener'}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
