import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share, PlusSquare, Check, X } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstalled, isIOS, canPromptDirectly, installApp } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already installed or dismissed, do not show banner
  if (isInstalled || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (canPromptDirectly) {
      await installApp();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {/* Floating Mobile App Install Pill / Banner */}
      <aside aria-label="Install Karim Ul Mobile App" className="sticky top-16 z-25 max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-1">
        <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-indigo-950/60 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
              <Smartphone className="w-5 h-5 text-slate-950" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
                <span>Karim Ul Mobile App</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  PWA
                </span>
              </p>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Apne phone ki home screen par install karein aur bina browser direct chalayein
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Guided Step-by-Step Instructions Modal (For iOS Safari or manual install) */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#0e1017] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/10">
              <Smartphone className="w-6 h-6 text-emerald-400" />
            </div>

            <h3 className="text-lg font-bold font-display text-white text-center mb-1">
              Phone Mein App Install Karein
            </h3>
            <p className="text-xs text-slate-400 text-center mb-5">
              Karim Ul ko full-screen mobile app ki tarah use karne ke liye neeche diye gaye steps follow karein:
            </p>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  1
                </span>
                <div>
                  <p className="font-semibold text-white">Browser Menu Open Karein</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Safari mein neeche <Share className="w-3.5 h-3.5 inline mx-1 text-emerald-400" /> Share button dabayein, ya Chrome mein top-right 3 dots par click karein.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  2
                </span>
                <div>
                  <p className="font-semibold text-white">"Add to Home Screen" Chunein</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    List mein scroll karke <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" /> <strong>Add to Home Screen</strong> (Home Screen Par Jodein) par tap karein.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  3
                </span>
                <div>
                  <p className="font-semibold text-white">Done! Karim Ul App Icon Ban Jayega</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Aapke phone ke apps ke sath Karim Ul ka official icon aa jayega aur yeh bina browser full screen chalega!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Samajh Gaya (Close)
            </button>
          </div>
        </div>
      )}
    </>
  );
};
