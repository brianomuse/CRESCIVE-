import React from "react";
import { motion } from "motion/react";
import {
  Check,
  Trophy,
  Activity,
  Droplets,
  Moon,
  Zap,
  BookOpen,
  Wind,
  Heart,
  Sparkles,
} from "lucide-react";
import { DailyMovesState } from "../../types";

interface DayCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: DailyMovesState;
}

export const DayCompleteModal: React.FC<DayCompleteModalProps> = ({
  isOpen,
  onClose,
  state,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-lg bg-[#0b0c1e] border-2 border-[#D4AF37] rounded-3xl p-6 sm:p-8 text-center text-white shadow-[0_0_60px_rgba(212,175,55,0.35)] space-y-6 relative overflow-hidden"
      >
        {/* Subtle Ambient Gold Particle Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#D4AF37]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Trophy Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center text-black shadow-[0_0_30px_rgba(212,175,55,0.5)]">
          <Trophy className="w-8 h-8 stroke-[2.2]" />
        </div>

        {/* Title & Tagline */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#D4AF37] font-semibold">
            ALL DAILY ESSENTIALS FULFILLED
          </span>
          <h2 className="text-2xl sm:text-3xl font-light font-serif-cresive tracking-wide text-white">
            DAY COMPLETE
          </h2>
          <p className="text-xs text-zinc-300 font-light mt-1">
            &ldquo;You showed up today. Progress is built one move at a time.&rdquo;
          </p>
        </div>

        {/* Summary Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-left pt-2">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-mono font-semibold uppercase">
              <Activity className="w-3.5 h-3.5" />
              <span>WORKOUT</span>
            </div>
            <div className="text-xs font-bold text-white">
              {state.workout.completed ? "Workout Done" : "Active Movement"}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-mono font-semibold uppercase">
              <Droplets className="w-3.5 h-3.5" />
              <span>HYDRATION</span>
            </div>
            <div className="text-xs font-bold text-white">
              {state.hydrationBreaksCount} Breaks Logged
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] font-mono font-semibold uppercase">
              <Moon className="w-3.5 h-3.5" />
              <span>RECOVERY</span>
            </div>
            <div className="text-xs font-bold text-white">
              {state.recoveryCompleted ? "Prioritized" : "Noted"}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-mono font-semibold uppercase">
              <Zap className="w-3.5 h-3.5" />
              <span>FOCUS</span>
            </div>
            <div className="text-xs font-bold text-white">
              {state.focusMinutesCompleted > 0
                ? `${state.focusMinutesCompleted} Min Deep Work`
                : "Flow Completed"}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono font-semibold uppercase">
              <BookOpen className="w-3.5 h-3.5" />
              <span>LEARNING</span>
            </div>
            <div className="text-xs font-bold text-white">Knowledge Compounded</div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-[#D4AF37] text-[10px] font-mono font-semibold uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TOTAL XP TODAY</span>
            </div>
            <div className="text-xs font-bold text-[#D4AF37]">
              +{state.xpEarnedToday + 50} XP
            </div>
          </div>
        </div>

        {/* Streak and Completion Notice */}
        <div className="p-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs text-[#D4AF37] font-mono">
          STREAK REINFORCED: {state.streakDays + 1} CONSECUTIVE DAYS
        </div>

        {/* Continue Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#e5c158] hover:to-[#c99718] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(212,175,55,0.4)] transition-all cursor-pointer active:scale-98"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>CONTINUE TO DASHBOARD</span>
        </button>
      </motion.div>
    </div>
  );
};
