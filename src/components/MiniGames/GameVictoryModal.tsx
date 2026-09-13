import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, RotateCcw, LogOut, Sparkles, Trophy, CheckCircle2 } from "lucide-react";

interface GameVictoryModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  statsLabel: string;
  statsValue: string | number;
  xpEarned: number;
  hasNextLevel?: boolean;
  onNextLevel?: () => void;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const GameVictoryModal: React.FC<GameVictoryModalProps> = ({
  isOpen,
  title = "LEVEL COMPLETE!",
  subtitle = "Outstanding focus and problem solving.",
  statsLabel,
  statsValue,
  xpEarned,
  hasNextLevel = false,
  onNextLevel,
  onPlayAgain,
  onExit,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 20 }}
          className="w-full max-w-sm rounded-3xl bg-[#0d0d1e] border border-amber-300/40 p-6 sm:p-7 shadow-[0_0_50px_rgba(212,175,55,0.3)] text-center space-y-6"
        >
          {/* Header */}
          <div>
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              <Trophy className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-semibold">
              CHALLENGE RESOLVED
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-wide mt-1">
              {title}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>
          </div>

          {/* Stats Display */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-zinc-400 font-mono">{statsLabel}</span>
              <span className="text-base font-bold font-mono text-white">{statsValue}</span>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between px-2">
              <span className="text-xs text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>XP Earned:</span>
              </span>
              <span className="text-base font-bold font-mono text-[#D4AF37]">
                +{xpEarned} XP ✨
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-2.5">
            {hasNextLevel && onNextLevel ? (
              <button
                onClick={onNextLevel}
                className="w-full py-3.5 px-4 rounded-2xl gold-gradient-bg text-black font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-98 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>NEXT LEVEL</span>
              </button>
            ) : null}

            <button
              onClick={onPlayAgain}
              className={`w-full py-3 px-4 rounded-2xl font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                hasNextLevel
                  ? "bg-white/10 hover:bg-white/15 text-white"
                  : "gold-gradient-bg text-black font-bold text-sm shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:brightness-110"
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>PLAY AGAIN</span>
            </button>

            <button
              onClick={onExit}
              className="w-full py-2.5 px-4 rounded-2xl hover:bg-white/10 border border-transparent hover:border-white/15 text-zinc-400 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
