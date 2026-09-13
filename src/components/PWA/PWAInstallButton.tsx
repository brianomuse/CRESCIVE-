import React, { useState } from "react";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import { Download, CheckCircle2, Smartphone } from "lucide-react";

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { isInstallable, hasNativePrompt, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (isInstalled) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Installed on Device</span>
      </div>
    );
  }

  if (!isInstallable) {
    return null;
  }

  const handleClick = async () => {
    if (hasNativePrompt) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isInstalling}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#D4AF37] font-semibold text-xs transition-all cursor-pointer shadow-sm ${className}`}
        title="Install CRESCIVE to your home screen"
      >
        <Smartphone className="w-3.5 h-3.5 text-[#D4AF37]" />
        <span>{isInstalling ? "Installing..." : "Install App"}</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-[#090918] border border-[#D4AF37]/40 p-6 shadow-2xl text-white space-y-4">
            <h3 className="text-base font-bold font-display text-white">
              Install CRESCIVE on iOS
            </h3>
            <p className="text-xs text-zinc-300">
              1. Tap the <strong>Share</strong> button in Safari toolbar.<br />
              2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
              3. Tap <strong>Add</strong> in the top right.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
