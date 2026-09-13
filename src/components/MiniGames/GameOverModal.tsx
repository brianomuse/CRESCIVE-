import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, LogOut, Sparkles, Trophy } from "lucide-react";

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  xpEarned: number;
  bestScore: number;
  isNewPersonalBest: boolean;
  scoreUnit?: string;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  xpEarned,
  bestScore,
  isNewPersonalBest,
  scoreUnit = "pts",
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
          className="w-full max-w-sm rounded-3xl bg-[#0d0d1e] border border-red-500/30 p-6 sm:p-7 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center space-y-6"
        >
          {/* Header */}
          <div>
            <span className="text-[10px] font-mono tracking-widest text-red-400 uppercase font-semibold">
              RUN FINISHED
            </span>
            <h2 className="text-3xl font-display font-black text-white tracking-wide mt-1">
              GAME OVER
            </h2>
            {isNewPersonalBest ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-2.5 py-1.5 px-3 rounded-full bg-gradient-to-r from-amber-500/20 via-[#D4AF37]/30 to-amber-500/20 border border-[#D4AF37] text-[#D4AF37] text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.4)]"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>🎉 NEW PERSONAL BEST!</span>
              </motion.div>
            ) : (
              <p className="text-xs text-zinc-400 mt-1">Every attempt strengthens your reflexes.</p>
            )}
          </div>

          {/* Stats Display */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-black/40 border border-white/5">
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Score</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5">
                {score.toLocaleString()}{" "}
                <span className="text-xs font-normal text-zinc-400">{scoreUnit}</span>
              </div>
            </div>

            <div className="text-center">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Best Score</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-200 mt-0.5">
                {bestScore.toLocaleString()}{" "}
                <span className="text-xs font-normal text-amber-200/60">{scoreUnit}</span>
              </div>
            </div>

            {/* XP Gained Highlight */}
            <div className="col-span-2 pt-2 border-t border-white/10 flex items-center justify-between px-2">
              <span className="text-xs text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>XP Earned:</span>
              </span>
              <span className="text-sm font-bold font-mono text-[#D4AF37]">
                +{xpEarned} XP ✨
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={onPlayAgain}
              className="w-full py-3.5 px-4 rounded-2xl gold-gradient-bg text-black font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
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
