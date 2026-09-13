import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import { Download, X, Share2, PlusSquare, Sparkles } from "lucide-react";

interface PWAInstallPromptProps {
  isOnboarding?: boolean;
  isFocusSessionActive?: boolean;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  isOnboarding = false,
  isFocusSessionActive = false,
}) => {
  const { isInstallable, hasNativePrompt, isInstalled, isIOS, canPrompt, install, dismiss } =
    usePWAInstall();

  // Smart delay: do not interrupt initial load, wait 4.5 seconds
  const [hasDelayedEntry, setHasDelayedEntry] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasDelayedEntry(true);
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  // Suppress during critical flows (onboarding, deep work focus, already installed)
  const shouldRender =
    canPrompt &&
    hasDelayedEntry &&
    !isOnboarding &&
    !isFocusSessionActive &&
    !isInstalled;

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <AnimatePresence>
        {shouldRender && !showIOSModal && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:w-[420px] z-50 p-5 rounded-3xl bg-[#090918]/95 border border-[#D4AF37]/35 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(212,175,55,0.12)] text-white"
          >
            {/* Close / Dismiss button */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5 pr-6">
              {/* App Icon */}
              <div className="w-12 h-12 rounded-2xl bg-[#121028] border border-[#D4AF37]/40 flex items-center justify-center shrink-0 p-1 shadow-inner">
                <img
                  src="/crescive_logo.png"
                  alt="CRESCIVE"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              {/* Text Information */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#D4AF37] font-semibold block">
                  STANDALONE EXPERIENCE
                </span>
                <h3 className="text-base font-bold font-display text-white tracking-wide leading-tight">
                  Install CRESCIVE
                </h3>
                <p className="text-xs text-zinc-300 font-light leading-relaxed pt-0.5">
                  Access CRESCIVE faster and keep selected experiences available even when your connection is limited.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
              <button
                id="btn-pwa-dismiss"
                onClick={dismiss}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                Not now
              </button>
              <button
                id="btn-pwa-install"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#FFF1C5] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_4px_16px_rgba(212,175,55,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isInstalling ? "Installing..." : "Install CRESCIVE"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Safari Step-by-Step Instructions Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-[#090918] border border-[#D4AF37]/40 p-6 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
                    <Download className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <h3 className="text-base font-bold font-display text-white">
                    Install on iOS
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowIOSModal(false);
                    dismiss();
                  }}
                  className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                To install CRESCIVE to your iPhone or iPad home screen:
              </p>

              <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#050510] border border-white/10 text-xs text-zinc-200">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono text-[#D4AF37] shrink-0 mt-0.5">
                    1
                  </div>
                  <span>
                    Tap the <strong className="text-[#D4AF37]">Share</strong> icon in the Safari bottom toolbar.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono text-[#D4AF37] shrink-0 mt-0.5">
                    2
                  </div>
                  <span>
                    Scroll down and select <strong className="text-[#D4AF37]">Add to Home Screen</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono text-[#D4AF37] shrink-0 mt-0.5">
                    3
                  </div>
                  <span>
                    Tap <strong className="text-[#D4AF37]">Add</strong> in the top right corner.
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowIOSModal(false);
                  dismiss();
                }}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
