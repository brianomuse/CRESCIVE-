import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MiniGameId,
  MiniGameMeta,
  MiniGameStats,
  GameAchievement,
} from "../../types";
import {
  getStoredGameStats,
  getCalculatedGameAchievements,
} from "../../utils/gamesStorage";
import { Game3DCardPreview } from "./Game3DCardPreview";
import { CresciveRunner3D } from "./CresciveRunner3D";
import { BrainMaze3D } from "./BrainMaze3D";
import { FocusChallenge3D } from "./FocusChallenge3D";
import { XpFeedbackToast } from "./XpFeedbackToast";
import {
  Play,
  Gamepad2,
  Sparkles,
  Trophy,
  Flame,
  Zap,
  CheckCircle2,
  Compass,
  ArrowRight,
  RotateCcw,
  Shield,
  Activity,
  Award,
} from "lucide-react";

interface MiniGamesHubProps {
  onBackToCompanion?: () => void;
}

const GAMES_LIST: MiniGameMeta[] = [
  {
    id: "runner",
    title: "CRESCIVE Runner",
    tagline: "3D Cybernetic Endless Sprint",
    description: "Accelerate down the cyber highway. Dodge energy gates, leap over barriers, and collect gleaming XP tokens as velocity continuously escalates.",
    difficulty: "Intermediate",
    xpReward: "+15 to +40 XP",
    category: "Reflex & Velocity",
    color: "#D4AF37",
    glowColor: "#D4AF37",
  },
  {
    id: "maze",
    title: "Brain Maze",
    tagline: "3D Quantum Neural Labyrinth",
    description: "Navigate atmospheric 3D corridors. Decrypt security keys, unseal quantum portals, and strengthen spatial problem solving.",
    difficulty: "Advanced",
    xpReward: "+25 to +45 XP",
    category: "Logic & Navigation",
    color: "#7F00FF",
    glowColor: "#7F00FF",
  },
  {
    id: "focus",
    title: "Focus Challenge",
    tagline: "3D Reaction & Concentration",
    description: "Test unwavering reaction time through dynamic rotating gates. Dodge false distractions and conquer the course with zero damage for flawless XP.",
    difficulty: "Beginner",
    xpReward: "+30 to +50 XP",
    category: "Concentration & Timing",
    color: "#00E5FF",
    glowColor: "#00E5FF",
  },
];

export const MiniGamesHub: React.FC<MiniGamesHubProps> = ({ onBackToCompanion }) => {
  const [activeGameId, setActiveGameId] = useState<MiniGameId | null>(null);
  const [stats, setStats] = useState<MiniGameStats>(getStoredGameStats);
  const [achievements, setAchievements] = useState<GameAchievement[]>(() =>
    getCalculatedGameAchievements(getStoredGameStats())
  );
  const [activeTab, setActiveTab] = useState<"games" | "stats" | "achievements">("games");

  // Refresh stats when game exits or window regains focus
  const refreshStats = () => {
    const s = getStoredGameStats();
    setStats(s);
    setAchievements(getCalculatedGameAchievements(s));
  };

  useEffect(() => {
    refreshStats();
    const handleXpUpdate = () => refreshStats();
    window.addEventListener("crescive:xp_gained", handleXpUpdate);
    return () => window.removeEventListener("crescive:xp_gained", handleXpUpdate);
  }, []);

  const handleExitGame = () => {
    setActiveGameId(null);
    refreshStats();
  };

  if (activeGameId === "runner") {
    return (
      <div className="w-full">
        <XpFeedbackToast />
        <CresciveRunner3D onExit={handleExitGame} />
      </div>
    );
  }

  if (activeGameId === "maze") {
    return (
      <div className="w-full">
        <XpFeedbackToast />
        <BrainMaze3D onExit={handleExitGame} />
      </div>
    );
  }

  if (activeGameId === "focus") {
    return (
      <div className="w-full">
        <XpFeedbackToast />
        <FocusChallenge3D onExit={handleExitGame} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <XpFeedbackToast />

      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#101025] via-[#08081a] to-[#04040d] border border-[#D4AF37]/35 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-semibold">
                CRESCIVE 3D MINI GAMES
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">·</span>
              <span className="text-[10px] text-zinc-400 font-mono">LEARN → GROW → CREATE → PROGRESS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
              Neural Playground
            </h2>
            <p className="text-xs text-zinc-300 font-light mt-1 max-w-xl">
              Sharpen your focus, test cognitive reaction speeds, and solve spatial labyrinths. Every session builds unified CRESCIVE XP and personal discipline.
            </p>
          </div>

          {/* Quick XP Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-black/60 border border-[#D4AF37]/40 flex items-center gap-2 shadow-inner">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <div>
                <span className="text-[9px] font-mono uppercase text-zinc-400 block leading-none">
                  Games XP
                </span>
                <span className="text-sm font-bold font-mono text-[#D4AF37] leading-tight">
                  {stats.totalGamesXpEarned} XP
                </span>
              </div>
            </div>

            {onBackToCompanion && (
              <button
                onClick={onBackToCompanion}
                className="px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 transition-colors cursor-pointer"
              >
                AI Chat
              </button>
            )}
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveTab("games")}
            className={`py-1.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "games"
                ? "bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37]"
                : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Available Games ({GAMES_LIST.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`py-1.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "stats"
                ? "bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37]"
                : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Progress & Stats</span>
          </button>

          <button
            onClick={() => setActiveTab("achievements")}
            className={`py-1.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "achievements"
                ? "bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37]"
                : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Achievements ({stats.unlockedAchievements.length}/{achievements.length})</span>
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: 3D GAMES CARDS ==================== */}
      {activeTab === "games" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {GAMES_LIST.map((game) => (
            <motion.div
              key={game.id}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="rounded-3xl bg-[#0f0f22] border border-white/10 hover:border-[#D4AF37]/60 p-5 flex flex-col justify-between shadow-lg relative overflow-hidden transition-colors group"
            >
              {/* Card Top Category & Difficulty */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    {game.category}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      game.difficulty === "Beginner"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : game.difficulty === "Intermediate"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                        : "bg-purple-500/10 border-purple-500/30 text-purple-300"
                    }`}
                  >
                    {game.difficulty}
                  </span>
                </div>

                {/* Real-time 3D Card Preview Canvas */}
                <div className="my-2 rounded-2xl bg-black/40 border border-white/5 group-hover:border-[#D4AF37]/30 transition-colors">
                  <Game3DCardPreview gameId={game.id} glowColor={game.glowColor} />
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-bold font-display text-white mt-3 group-hover:text-[#D4AF37] transition-colors">
                  {game.title}
                </h3>
                <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                  {game.tagline}
                </p>
                <p className="text-xs text-zinc-300 font-light mt-2 leading-relaxed">
                  {game.description}
                </p>
              </div>

              {/* Card Bottom: Reward & Play Button */}
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 block">REWARD</span>
                  <span className="text-xs font-bold font-mono text-[#D4AF37] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    {game.xpReward}
                  </span>
                </div>

                <button
                  onClick={() => setActiveGameId(game.id)}
                  className="py-2 px-4 rounded-xl gold-gradient-bg text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.25)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>PLAY NOW</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ==================== TAB 2: PROGRESS & STATS ==================== */}
      {activeTab === "stats" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#0f0f22] border border-white/10">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Total Games XP</span>
              <div className="text-xl font-bold font-mono text-[#D4AF37] mt-1">
                {stats.totalGamesXpEarned} XP
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f0f22] border border-white/10">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Sessions Played</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {stats.gamesPlayed}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f0f22] border border-white/10">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Completed Runs</span>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
                {stats.gamesCompleted}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f0f22] border border-white/10">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Streak (Days)</span>
              <div className="text-xl font-bold font-mono text-amber-300 mt-1 flex items-center gap-1">
                <Flame className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>{stats.consecutivePlayDays}</span>
              </div>
            </div>
          </div>

          {/* Detailed Game Bests */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-[#0f0f22] border border-[#D4AF37]/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">CRESCIVE Runner</span>
                <span className="text-[10px] font-mono text-[#D4AF37]">Personal Record</span>
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-sm font-bold font-mono text-[#D4AF37]">
                  {stats.runnerBestDistance} meters
                </div>
                <div className="text-xs text-zinc-400 font-mono">
                  Best Score: {stats.runnerBestScore.toLocaleString()} pts
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f0f22] border border-purple-400/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Brain Maze</span>
                <span className="text-[10px] font-mono text-purple-300">Level Solved</span>
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-sm font-bold font-mono text-purple-200">
                  Level {stats.mazeLevelsCompleted || 1}
                </div>
                <div className="text-xs text-zinc-400 font-mono">
                  Best Speed: {stats.mazeBestTime > 0 ? `${stats.mazeBestTime}s` : "—"}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f0f22] border border-cyan-400/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Focus Challenge</span>
                <span className="text-[10px] font-mono text-cyan-300">Flawless Runs</span>
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-sm font-bold font-mono text-cyan-200">
                  {stats.focusPerfectRuns} Perfect Runs
                </div>
                <div className="text-xs text-zinc-400 font-mono">
                  Best Score: {stats.focusBestScore.toLocaleString()} pts
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: ACHIEVEMENTS ==================== */}
      {activeTab === "achievements" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-4 rounded-2xl border transition-all ${
                ach.unlocked
                  ? "bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                  : "bg-[#0f0f22] border-white/5 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                    {ach.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{ach.title}</span>
                      {ach.unlocked && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">{ach.description}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-lg shrink-0 ${
                    ach.unlocked
                      ? "bg-[#D4AF37]/20 text-[#D4AF37] font-bold"
                      : "bg-white/5 text-zinc-500"
                  }`}
                >
                  +{ach.xpReward} XP
                </span>
              </div>

              {ach.maxProgress && ach.maxProgress > 1 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                    <span>Progress</span>
                    <span>
                      {ach.progress || 0} / {ach.maxProgress}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (((ach.progress || 0) / ach.maxProgress) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
