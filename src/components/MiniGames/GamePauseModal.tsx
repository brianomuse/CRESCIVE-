import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, RotateCcw, LogOut, Volume2, VolumeX } from "lucide-react";

interface GamePauseModalProps {
  isOpen: boolean;
  isMusicOn: boolean;
  isSfxOn: boolean;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
}

export const GamePauseModal: React.FC<GamePauseModalProps> = ({
  isOpen,
  isMusicOn,
  isSfxOn,
  onResume,
  onRestart,
  onExit,
  onToggleMusic,
  onToggleSfx,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          className="w-full max-w-sm rounded-3xl bg-[#0d0d1e] border border-[#D4AF37]/50 p-6 sm:p-7 shadow-[0_0_50px_rgba(212,175,55,0.25)] text-center space-y-6"
        >
          {/* Header */}
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-semibold">
              GAMEPLAY SUSPENDED
            </span>
            <h2 className="text-2xl font-display font-bold text-white tracking-wider mt-1">
              PAUSED
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Take a breath. Your progress is saved.
            </p>
          </div>

          {/* Audio Controls */}
          <div className="grid grid-cols-2 gap-3 py-1">
            <button
              onClick={onToggleMusic}
              className={`p-3 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isMusicOn
                  ? "bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]"
                  : "bg-white/5 border-white/10 text-zinc-500 hover:text-white"
              }`}
            >
              {isMusicOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-xs font-semibold">{isMusicOn ? "Music ON" : "Music OFF"}</span>
            </button>

            <button
              onClick={onToggleSfx}
              className={`p-3 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSfxOn
                  ? "bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]"
                  : "bg-white/5 border-white/10 text-zinc-500 hover:text-white"
              }`}
            >
              {isSfxOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-xs font-semibold">{isSfxOn ? "SFX ON" : "SFX OFF"}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            {/* Resume Button */}
            <button
              onClick={onResume}
              className="w-full py-3.5 px-4 rounded-2xl gold-gradient-bg text-black font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Resume</span>
            </button>

            {/* Restart Button */}
            <button
              onClick={onRestart}
              className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>

            {/* Exit Button */}
            <button
              onClick={onExit}
              className="w-full py-2.5 px-4 rounded-2xl hover:bg-rose-500/10 border border-transparent hover:border-rose-400/30 text-zinc-400 hover:text-rose-300 font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Game</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
