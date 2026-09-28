import React, { useState, useRef } from 'react';
import { UserProfile } from '../types/music';
import { loginUser } from '../services/api';
import { Music, Lock, Phone, Loader2, ArrowRight, Shield, X, Sparkles } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Secret 5-Tap Gesture on "Karim Ul" branding for Admin Quick Access
  const [tapCount, setTapCount] = useState(0);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const lastTapTimeRef = useRef<number>(0);

  const handleBrandTap = () => {
    const now = Date.now();
    // If consecutive taps within 1.5 seconds, increment tapCount, else reset to 1
    if (now - lastTapTimeRef.current < 1500) {
      const nextCount = tapCount + 1;
      setTapCount(nextCount);
      if (nextCount >= 5) {
        setShowSecretModal(true);
        setTapCount(0);
      }
    } else {
      setTapCount(1);
    }
    lastTapTimeRef.current = now;
  };

  const handleSecretAdminLogin = async () => {
    try {
      setLoading(true);
      setShowSecretModal(false);
      setErrorMessage(null);
      const res = await loginUser('9528004584', 'Abdul@1212');
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Admin login failed';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

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
        onLoginSuccess(res.user);
      } else {
        setErrorMessage('Login me samasya aayi. Kripya punah prayas karein.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login fail ho gaya.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07080c] overflow-y-auto px-4 py-8 select-none">
      {/* Dynamic ambient background glow */}
      <div className="absolute w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -top-20 -left-20 animate-pulse" />
      <div className="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -bottom-20 -right-20 animate-pulse" />

      {/* Secret Admin Modal (Triggered ONLY by tapping the logo 5 times) */}
      {showSecretModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#12141f] border border-amber-500/40 rounded-3xl p-6 shadow-2xl shadow-amber-500/10 text-center">
            <button
              onClick={() => setShowSecretModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>

            <h3 className="text-lg font-bold font-display text-white mb-1">
              Admin Access Detected
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Secret gesture recognized. Click below to instantly log in to your private Admin Studio.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleSecretAdminLogin}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Enter Admin Dashboard</span>
              </button>

              <button
                onClick={() => setShowSecretModal(false)}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Glassmorphic Login Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0f111a]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
        {/* Crest & Branding (With hidden 5-tap gesture) */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            onClick={handleBrandTap}
            className="relative mb-3 cursor-pointer active:scale-95 transition-transform"
            title="Karim Ul"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-slate-800 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center shadow-xl shadow-emerald-500/10">
              <Music className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full ring-4 ring-[#0f111a]" />
          </div>

          <h1
            onClick={handleBrandTap}
            className="text-3xl font-extrabold font-display tracking-tight text-white mb-1 cursor-pointer select-none"
          >
            Karim <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">Ul</span>
          </h1>
          <p className="text-xs text-slate-400">
            Sign in with your phone number & password
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* Single Phone & Obscured Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Phone Number
            </label>
            <div className="relative flex items-center">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="tel"
                required
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit phone number"
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors tracking-widest font-mono"
              />
            </div>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
