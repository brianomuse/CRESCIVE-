import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Plus,
  ArrowRight,
  Compass,
  CheckCircle2,
  TrendingUp,
  Zap,
} from "lucide-react";

interface FirstMoveWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMove: () => void;
}

export const FirstMoveWelcomeModal: React.FC<FirstMoveWelcomeModalProps> = ({
  isOpen,
  onClose,
  onAddMove,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Blur & Ambient Lighting */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#050510]/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            id="first-move-welcome-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="first-move-title"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative z-10 w-full max-w-md bg-gradient-to-b from-[#12152e]/95 via-[#0e1024]/95 to-[#070914]/98 border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 text-[#f5f5f0] shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_50px_rgba(212,175,55,0.18)] my-auto max-h-[92vh] overflow-y-auto"
          >
            {/* Top Micro Eyebrow */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#D4AF37] font-semibold">
                Welcome to CRESCIVE
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            </div>

            {/* Main Title */}
            <h2
              id="first-move-title"
              className="text-2xl sm:text-3xl font-light font-serif-cresive text-center text-white tracking-[0.15em] uppercase"
            >
              ADD A MOVE
            </h2>

            {/* Core Definition of a Move */}
            <p className="text-center text-zinc-200 text-sm sm:text-base font-medium mt-2 leading-relaxed">
              Moves are small actions that help you grow.
            </p>

            {/* Interactive Visual Element: The Animated Growth Trajectory & Glowing Move Card */}
            <div className="my-5 relative rounded-2xl bg-[#060816]/90 border border-white/10 p-4 overflow-hidden shadow-inner">
              {/* Subtle background glow */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12)_0%,rgba(16,185,129,0.08)_50%,transparent_75%)]" />

              {/* Trajectory Ascent Graphic */}
              <div className="relative z-10 flex items-center justify-between mb-3 px-1 text-[10px] font-mono text-zinc-400">
                <span className="flex items-center gap-1 text-[#D4AF37]">
                  <TrendingUp className="w-3 h-3 text-[#D4AF37]" /> Ascent
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <Zap className="w-3 h-3 text-emerald-400" /> Daily Action
                </span>
              </div>

              {/* Glowing Interactive Move Card (Ascent Path Animation) */}
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: [0, -4, 0], opacity: 1 }}
                transition={{
                  y: { repeat: Infinity, duration: 3.5, ease: "easeInOut" },
                  opacity: { duration: 0.4 },
                }}
                className="relative z-10 rounded-xl bg-gradient-to-r from-[#141738]/90 via-[#0d1028]/95 to-[#121f2f]/90 border border-[#D4AF37]/50 p-3.5 shadow-[0_8px_25px_rgba(0,0,0,0.6),0_0_20px_rgba(212,175,55,0.15)] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-mono block font-semibold">
                      Your First Move
                    </span>
                    <span className="text-xs sm:text-sm text-white font-medium truncate block">
                      Pick 1 simple intentional action
                    </span>
                  </div>
                </div>

                {/* Progress point indicator */}
                <div className="shrink-0 px-2 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>+1</span>
                </div>
              </motion.div>

              {/* Progress trajectory line */}
              <div className="relative mt-3 pt-2 flex items-center justify-between px-2 text-[10px] text-zinc-400 font-light border-t border-white/5">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Today
                </span>
                <span className="text-zinc-500">┈┈┈┈┈┈┈┈</span>
                <span className="flex items-center gap-1 text-[#D4AF37]">
                  <Compass className="w-3 h-3 text-[#D4AF37]" /> Compounding Progress
                </span>
              </div>
            </div>

            {/* Clear, Simple Explanatory Text */}
            <div className="text-center space-y-1.5 mb-6">
              <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                Pick something simple to do today — for your mind, health, creativity, focus, or life.
              </p>
              <p className="text-xs sm:text-sm text-[#D4AF37] font-semibold tracking-wider uppercase">
                Small steps. Real progress.
              </p>
            </div>

            {/* Action Buttons: Red SKIP on Left, Green ADD MOVE on Right */}
            <div className="flex items-center gap-3 pt-1">
              {/* Left Side: SKIP (Red button) */}
              <motion.button
                id="first-move-skip-btn"
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={onClose}
                className="w-28 sm:w-32 py-3.5 px-4 rounded-2xl bg-red-950/30 hover:bg-red-900/40 active:bg-red-900/60 border border-red-500/35 hover:border-red-500/60 text-red-400 hover:text-red-300 text-xs uppercase tracking-wider font-bold shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>SKIP</span>
              </motion.button>

              {/* Right Side: ADD MOVE (Green button, visually more prominent) */}
              <motion.button
                id="first-move-add-btn"
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={onAddMove}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-500 hover:from-emerald-400 hover:to-green-400 active:from-emerald-600 active:to-green-600 text-black text-xs uppercase tracking-widest font-extrabold shadow-[0_0_30px_rgba(16,185,129,0.45)] hover:shadow-[0_0_40px_rgba(16,185,129,0.65)] transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-300/50"
              >
                <Plus className="w-4 h-4 text-black stroke-[3]" />
                <span>ADD MOVE</span>
                <ArrowRight className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
