import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Flame,
  Trophy,
  Star,
  Smile,
  Gamepad2,
  ChevronRight,
  Gift,
  Award,
} from "lucide-react";
import { FunZoneState } from "../../types";
import {
  getStoredFunZoneState,
  getTodayDateString,
  getYesterdayDateString,
} from "../../utils/funZoneStorage";
import { FunnyJokes } from "./FunnyJokes";
import { MiniGames } from "./MiniGames";
import { AchievementsModal } from "./AchievementsModal";
import { MiniGamesHub } from "../MiniGames/MiniGamesHub";
import { FUN_ACHIEVEMENTS } from "../../data/funZoneData";

interface FunZoneScreenProps {
  onOpenCreateMove?: () => void;
}

export const FunZoneScreen: React.FC<FunZoneScreenProps> = () => {
  const [funState, setFunState] = useState<FunZoneState>(() => getStoredFunZoneState());
  const [currentView, setCurrentView] = useState<"hub" | "jokes" | "games" | "3d-games">("hub");
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state if changes occur
  useEffect(() => {
    const saved = getStoredFunZoneState();
    setFunState(saved);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleUpdateFunState = (newState: FunZoneState) => {
    setFunState(newState);
  };

  // Find most recent unlocked achievement (if any)
  const recentAchievement = FUN_ACHIEVEMENTS.find((a) =>
    funState.unlockedAchievementIds.includes(a.id)
  ) || FUN_ACHIEVEMENTS[0];

  const unlockedCount = funState.unlockedAchievementIds.length;
  const today = getTodayDateString();
  const isFirstActivityTodayDone = funState.firstDailyActivityDate === today;

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-[#D4AF37] text-black font-bold text-xs shadow-[0_10px_30px_rgba(212,175,55,0.5)] border border-amber-300 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-Views: Jokes, 2D Games, or 3D Games */}
      {currentView === "jokes" && (
        <FunnyJokes
          funState={funState}
          onUpdateFunState={handleUpdateFunState}
          onToast={showToast}
          onBack={() => setCurrentView("hub")}
        />
      )}

      {currentView === "games" && (
        <MiniGames
          funState={funState}
          onUpdateFunState={handleUpdateFunState}
          onToast={showToast}
          onBack={() => setCurrentView("hub")}
        />
      )}

      {currentView === "3d-games" && (
        <MiniGamesHub onBackToCompanion={() => setCurrentView("hub")} />
      )}

      {/* Main Fun Zone Hub */}
      {currentView === "hub" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#D4AF37] text-[10px] font-mono tracking-widest uppercase mb-2">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>CRESCIVE RECHARGE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-light font-serif-cresive text-white tracking-wide">
              🎉 FUN ZONE
            </h1>
            <p className="text-xs sm:text-sm text-[#f5f5f0]/65 mt-1 font-light tracking-wide">
              Take a break. Have fun. Earn XP!
            </p>
          </div>

          {/* FEATURED: 3D MINI GAMES HERO CARD */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setCurrentView("3d-games")}
            className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#12102e] via-[#090918] to-[#04040c] border border-[#D4AF37]/50 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.18)] cursor-pointer relative overflow-hidden group"
          >
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.2)_0%,transparent_70%)] pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#D4AF37]/30 to-amber-500/20 border border-[#D4AF37]/50 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                  🕹️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                      NEW 3D GAMES
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">WEBGL ACCELERATED</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-serif-cresive text-white tracking-wide mt-1">
                    3D MINI GAMES SYSTEM
                  </h2>
                  <p className="text-xs text-zinc-300 font-light mt-1 max-w-lg">
                    Play <span className="text-[#D4AF37] font-semibold">CRESCIVE Runner</span>,{" "}
                    <span className="text-purple-300 font-semibold">Brain Maze</span>, and{" "}
                    <span className="text-cyan-300 font-semibold">Focus Challenge</span>. Earn real XP & unlock achievements.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentView("3d-games");
                  }}
                  className="py-2.5 px-5 rounded-2xl gold-gradient-bg text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)] group-hover:brightness-110 transition-all cursor-pointer"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>LAUNCH 3D ARENA</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Daily First Activity Bonus Callout */}
          {!isFirstActivityTodayDone && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#101025] to-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#050510] border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#D4AF37] uppercase font-bold tracking-wider">
                    Daily Bonus Available
                  </span>
                  <p className="text-xs text-white font-medium">
                    First activity today awards <span className="text-[#D4AF37] font-bold">+10 Bonus XP</span>!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TWO MAIN CATEGORIES (As Specified) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category 1: FUNNY JOKES */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentView("jokes")}
              className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#101025] via-[#121230] to-[#050510] border border-[#D4AF37]/40 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.12)] cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)] pointer-events-none" />

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-700/20 border border-amber-500/30 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                😂
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-serif-cresive text-white tracking-wide">
                    FUNNY JOKES
                  </h2>
                  <p className="text-xs text-[#D4AF37] font-medium mt-1 font-serif-cresive italic">
                    &ldquo;Need a laugh?&rdquo;
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#D4AF37] group-hover:text-black flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <p className="text-xs text-zinc-400 mt-3 font-light leading-relaxed">
                Explore 60+ clean jokes across School, Dad Jokes, Tech, and Student Life. Copy, share, and favorite!
              </p>
            </motion.div>

            {/* Category 2: MINI GAMES */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentView("games")}
              className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#101025] via-[#121230] to-[#050510] border border-[#D4AF37]/40 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.12)] cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[radial-gradient(circle,rgba(127,0,255,0.15)_0%,transparent_70%)] pointer-events-none" />

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-purple-700/20 border border-purple-500/30 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                🎮
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-serif-cresive text-white tracking-wide">
                    MINI GAMES
                  </h2>
                  <p className="text-xs text-[#D4AF37] font-medium mt-1 font-serif-cresive italic">
                    &ldquo;Play quick mini-games&rdquo;
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#D4AF37] group-hover:text-black flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <p className="text-xs text-zinc-400 mt-3 font-light leading-relaxed">
                Play Quick Quiz, Number Guess, Word Scramble, Riddle Rush, and the 10-Second Tap Challenge!
              </p>
            </motion.div>
          </div>

          {/* STATS SECTION (Below the two cards as specified) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
            {/* 1. Current Fun Streak */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#101025] border border-white/10 flex flex-col items-center justify-center text-center shadow-md">
              <div className="flex items-center gap-1 text-amber-400 mb-1">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span className="text-xs font-mono font-bold">Streak</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-white font-mono">
                {funState.streak} Day{funState.streak === 1 ? "" : "s"}
              </div>
              <span className="text-[9px] text-zinc-400 font-light mt-0.5">
                Fun Streak
              </span>
            </div>

            {/* 2. Fun XP */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#101025] border border-[#D4AF37]/35 flex flex-col items-center justify-center text-center shadow-md">
              <div className="flex items-center gap-1 text-[#D4AF37] mb-1">
                <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                <span className="text-xs font-mono font-bold">Score</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-[#D4AF37] font-mono">
                {funState.xp} XP
              </div>
              <span className="text-[9px] text-zinc-400 font-light mt-0.5">
                Fun XP Earned
              </span>
            </div>

            {/* 3. Recent Achievement */}
            <div
              onClick={() => setIsAchievementsOpen(true)}
              className="p-3.5 sm:p-4 rounded-2xl bg-[#101025] border border-white/10 hover:border-[#D4AF37]/40 flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-1 text-purple-400 mb-1">
                <Trophy className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono font-bold">Badges</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-white font-mono flex items-center gap-1">
                <span>{unlockedCount}/9</span>
              </div>
              <span className="text-[9px] text-[#D4AF37] font-medium mt-0.5 group-hover:underline">
                View Badges
              </span>
            </div>
          </div>

          {/* Quick Recent Achievement Card */}
          <div
            onClick={() => setIsAchievementsOpen(true)}
            className="p-3.5 rounded-2xl bg-[#070716] border border-white/5 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{recentAchievement.icon}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-[#D4AF37] tracking-wider font-semibold">
                    {funState.unlockedAchievementIds.includes(recentAchievement.id)
                      ? "Unlocked Achievement"
                      : "Next Goal"}
                  </span>
                </div>
                <p className="text-xs text-white font-semibold">
                  {recentAchievement.title} ·{" "}
                  <span className="text-zinc-400 font-normal">
                    {recentAchievement.description}
                  </span>
                </p>
              </div>
            </div>

            <button className="text-xs text-[#D4AF37] font-semibold whitespace-nowrap hover:underline flex items-center gap-0.5">
              <span>All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Achievements Modal */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        state={funState}
      />
    </div>
  );
};
