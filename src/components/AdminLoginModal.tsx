import React, { useState } from 'react';
import { UserProfile } from '../types/music';
import { loginUser } from '../services/api';
import { Shield, Lock, Phone, Loader2, ArrowRight, X, Sparkles } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    const cleanPassword = password.trim();

    if (!cleanPhone || !cleanPassword) {
      setErrorMessage('Kripya phone number aur password dono bharein.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await loginUser(cleanPhone, cleanPassword);
      if (res.success && res.user) {
        if (res.user.role === 'admin') {
          onLoginSuccess(res.user);
          onClose();
        } else {
          setErrorMessage('Yeh account Admin authenticated nahi hai.');
        }
      } else {
        setErrorMessage('Galat credentials! Admin access denied.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Admin login fail ho gaya.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await loginUser('9528004584', 'Abdul@1212');
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Admin login failed';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-[#0f111a] border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-amber-500/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-3 shadow-lg shadow-amber-500/20">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold font-display text-white mb-1">
            Admin Access Portal
          </h3>
          <p className="text-xs text-slate-400">
            Secret gesture unlocked. Enter Admin credentials or use authorized master key.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Admin Phone
            </label>
            <div className="relative flex items-center">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter admin phone number"
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition-colors font-mono tracking-widest"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In as Admin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-white/5">
          <button
            type="button"
            onClick={handleQuickAdminLogin}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Direct Authenticate (Master Key)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
