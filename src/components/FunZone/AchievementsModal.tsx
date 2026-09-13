import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trophy, Sparkles, CheckCircle2 } from "lucide-react";
import { FunZoneState } from "../../types";
import { FUN_ACHIEVEMENTS } from "../../data/funZoneData";

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: FunZoneState;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  state,
}) => {
  if (!isOpen) return null;

  const unlockedSet = new Set(state.unlockedAchievementIds);
  const unlockedCount = unlockedSet.size;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-[#101025] border border-[#D4AF37]/35 rounded-3xl p-6 text-[#f5f5f0] shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-h-[85vh] flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] p-[1px] shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              <div className="w-full h-full rounded-[11px] bg-[#050510] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[#D4AF37]" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif-cresive text-white">
                Fun Achievements
              </h2>
              <p className="text-xs text-[#D4AF37] font-mono font-medium">
                {unlockedCount} of {FUN_ACHIEVEMENTS.length} Unlocked
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-400 mt-2 mb-4 leading-relaxed font-light">
            Stay active, laugh, play mini-games, and collect XP badges to celebrate your breaks.
          </p>

          {/* Achievement List */}
          <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
            {FUN_ACHIEVEMENTS.map((ach) => {
              const isUnlocked = unlockedSet.has(ach.id);

              // Calculate current metric
              let current = 0;
              if (ach.id === "joke-explorer" || ach.id === "laugh-master") {
                current = state.jokesViewedCount;
              } else if (ach.id === "game-starter" || ach.id === "mini-gamer") {
                current = state.gamesPlayedCount;
              } else if (ach.id === "brain-power") {
                current = state.quizCorrectCount;
              } else if (ach.id === "fun-streak") {
                current = state.streak;
              } else if (ach.id === "speed-tapper") {
                current = state.bestTapScore;
              } else if (ach.id === "riddle-master") {
                current = state.riddlesSolvedCount;
              } else if (ach.id === "fun-legend") {
                current = state.xp;
              }

              const progressPct = Math.min(100, Math.round((current / ach.targetCount) * 100));

              return (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isUnlocked
                      ? "bg-gradient-to-r from-[#D4AF37]/15 to-[#101025] border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                      : "bg-[#070716] border-white/5 opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{ach.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white">
                            {ach.title}
                          </h4>
                          {isUnlocked && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 font-light mt-0.5">
                          {ach.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-[#D4AF37]">
                        +{ach.xpReward} XP
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {!isUnlocked && (
                    <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                      <span>Progress</span>
                      <span>
                        {current} / {ach.targetCount} ({progressPct}%)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-center">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              Continue Having Fun
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
