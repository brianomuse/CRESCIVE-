import React from "react";
import { motion } from "motion/react";
import { CresciveDailyState } from "../../types";
import { Sparkles, Flame, CheckCircle2, ChevronRight, Zap } from "lucide-react";

interface CresciveDailyCardProps {
  dailyState: CresciveDailyState;
  onOpenDaily: () => void;
}

export const CresciveDailyCard: React.FC<CresciveDailyCardProps> = ({
  dailyState,
  onOpenDaily,
}) => {
  const completedCount = Object.values(dailyState.completed).filter(Boolean).length;
  const isAllComplete = completedCount === 4;
  const isStarted = completedCount > 0 && !isAllComplete;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 border transition-all ${
        isAllComplete
          ? "bg-gradient-to-br from-[#101025] via-[#050510] to-[#1a1235] border-emerald-500/40 shadow-[0_10px_35px_rgba(16,185,129,0.12)]"
          : isStarted
          ? "bg-gradient-to-br from-[#121025] via-[#101025] to-[#1e1338] border-[#D4AF37]/50 shadow-[0_10px_35px_rgba(212,175,55,0.15)]"
          : "bg-gradient-to-br from-[#101025] via-[#080816] to-[#150f28] border-[#D4AF37]/35 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
      }`}
    >
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.12)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[radial-gradient(circle,rgba(127,0,255,0.15)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left column: Text, status & progress */}
        <div className="space-y-2.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#101025]/90 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-mono font-semibold tracking-widest uppercase shadow-sm">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>CRESCIVE DAILY</span>
            </div>

            {dailyState.streak > 0 && (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>{dailyState.streak} DAY STREAK</span>
              </div>
            )}
          </div>

          <div>
            {isAllComplete ? (
              <>
                <h3 className="text-xl sm:text-2xl font-bold font-serif-cresive text-white flex items-center gap-2">
                  <span>Today&apos;s Moves Complete! 🎉</span>
                </h3>
                <p className="text-xs text-zinc-300 mt-1">
                  Great job! You earned <span className="text-[#F5D77F] font-bold">+50 XP</span> today. Come back tomorrow for a new challenge!
                </p>
              </>
            ) : isStarted ? (
              <>
                <h3 className="text-xl sm:text-2xl font-bold font-serif-cresive text-white flex items-center gap-2">
                  <span>You&apos;re on a roll! 🔥</span>
                </h3>
                <p className="text-xs text-zinc-300 mt-1">
                  Complete today&apos;s moves and keep your progress going!
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xl sm:text-2xl font-bold font-serif-cresive text-white flex items-center gap-2">
                  <span>Do Your Daily Moves 🚀</span>
                </h3>
                <p className="text-xs text-zinc-300 mt-1">
                  4 quick moves are waiting for you. Complete today&apos;s moves and keep your progress going!
                </p>
              </>
            )}
          </div>

          {/* Progress Tracker Bar */}
          <div className="pt-1 max-w-sm">
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-zinc-400 font-medium">
                {isAllComplete ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 4/4 Complete
                  </span>
                ) : (
                  <span>{completedCount}/4 Moves Complete</span>
                )}
              </span>
              <span className="text-[#D4AF37] font-semibold">
                {isAllComplete ? "50 XP Earned" : "+50 XP Total"}
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden border border-white/5">
              <motion.div
                className={`h-full rounded-full ${
                  isAllComplete
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : "bg-gradient-to-r from-[#D4AF37] to-[#FFF1C5]"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / 4) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Right column: Action button */}
        <div className="shrink-0 flex items-center">
          <button
            id="btn-crescive-daily-main"
            onClick={onOpenDaily}
            className={`w-full md:w-auto py-3 px-6 rounded-2xl font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap ${
              isAllComplete
                ? "bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300"
                : isStarted
                ? "bg-gradient-to-r from-[#D4AF37] via-[#FFF1C5] to-[#B8860B] text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                : "bg-gradient-to-r from-[#D4AF37] via-[#FFF1C5] to-[#B8860B] text-black shadow-[0_0_25px_rgba(212,175,55,0.35)]"
            }`}
          >
            {isAllComplete ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>VIEW TODAY&apos;S RESULTS</span>
              </>
            ) : isStarted ? (
              <>
                <Zap className="w-4 h-4 fill-black" />
                <span>CONTINUE DAILY MOVES</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-black" />
                <span>DO YOUR DAILY MOVES</span>
              </>
            )}
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
