import React from "react";
import { motion } from "motion/react";
import { Trophy, ChevronRight, TrendingUp, ShieldCheck } from "lucide-react";
import { LeaderboardEntry } from "../../types";

interface LeaderboardCardProps {
  userRank: number | null;
  totalParticipants: number;
  totalXp: number;
  level: number;
  xpToNextRank: number;
  nextRankUsername?: string;
  rankChangeNotification?: string;
  topPeers?: LeaderboardEntry[];
  streakDays?: number;
  achievementsCount?: number;
  completedMovesCount?: number;
  dailyChallengesCount?: number;
  onOpenLeaderboard: () => void;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  userRank,
  totalParticipants,
  totalXp,
  level,
  xpToNextRank,
  nextRankUsername,
  rankChangeNotification,
  streakDays = 0,
  achievementsCount = 0,
  completedMovesCount = 0,
  dailyChallengesCount = 0,
  onOpenLeaderboard,
}) => {
  const isNewUser = totalXp === 0 && completedMovesCount === 0;
  const effectiveRank = userRank ?? (totalParticipants > 0 ? (isNewUser ? totalParticipants : 1) : null);

  return (
    <motion.div
      id="profile-leaderboard-card"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={onOpenLeaderboard}
      className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#121228] via-[#0b0b1a] to-[#18152e] border-2 border-[#D4AF37]/50 shadow-[0_15px_40px_-10px_rgba(212,175,55,0.25)] cursor-pointer group select-none"
    >
      {/* Subtle gold decorative background glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 rounded-full bg-[#D4AF37]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 rounded-full bg-[#7F00FF]/15 blur-2xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D4AF37] via-[#FFF1C5] to-[#B8860B] p-[1.5px] shadow-[0_0_20px_rgba(212,175,55,0.4)]">
            <div className="w-full h-full rounded-[14px] bg-[#090916] flex items-center justify-center text-[#D4AF37]">
              <Trophy className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-bold">
                🏆 LEADERBOARD
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" />
                Verified
              </span>
            </div>
            <h3 className="text-lg font-bold font-serif-cresive text-white tracking-wide">
              Global Leaderboard
            </h3>
          </div>
        </div>

        {/* View button arrow */}
        <div className="flex items-center gap-1 py-1.5 px-3 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold group-hover:bg-[#D4AF37]/25 group-hover:border-[#D4AF37] transition-all">
          <span>View Board</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Main Ranking Display */}
      <div className="mt-4 pt-3 border-t border-white/10 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#D4AF37] tracking-tight">
              {effectiveRank ? `#${effectiveRank}` : "#—"}
            </span>
            <span className="text-sm uppercase font-mono tracking-wider text-zinc-300 font-semibold">
              Global
            </span>
            <span className="text-xs font-mono text-zinc-400">
              {totalParticipants === 0
                ? "· Growing"
                : `· ${totalParticipants} ${totalParticipants === 1 ? "Member" : "Members"}`}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-sm">
            <span className="text-white font-bold">{totalXp.toLocaleString()} XP</span>
            <span className="text-zinc-500">·</span>
            <span className="text-[#F5D77F]">Level {level}</span>
          </div>
        </div>

        {/* Rank change notification */}
        {rankChangeNotification && (
          <div className="mt-2 inline-flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>{rankChangeNotification}</span>
          </div>
        )}
      </div>

      {/* 4 Pillars Grid (Streak, Achievements, Moves, Challenges) */}
      <div className="mt-3.5 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-[#070714] border border-white/5 flex items-center gap-2">
          <span className="text-base">🔥</span>
          <div>
            <span className="text-zinc-400 text-[10px] block">Streak</span>
            <span className="text-white font-bold">{streakDays} Day{streakDays === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#070714] border border-white/5 flex items-center gap-2">
          <span className="text-base">🏆</span>
          <div>
            <span className="text-zinc-400 text-[10px] block">Achievements</span>
            <span className="text-white font-bold">{achievementsCount}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#070714] border border-white/5 flex items-center gap-2">
          <span className="text-base text-emerald-400">✓</span>
          <div>
            <span className="text-zinc-400 text-[10px] block">Completed</span>
            <span className="text-white font-bold">{completedMovesCount} Moves</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#070714] border border-white/5 flex items-center gap-2">
          <span className="text-base text-[#D4AF37]">📅</span>
          <div>
            <span className="text-zinc-400 text-[10px] block">Challenges</span>
            <span className="text-white font-bold">{dailyChallengesCount} Solved</span>
          </div>
        </div>
      </div>

      {/* Next rank target bar */}
      {xpToNextRank > 0 && effectiveRank && effectiveRank > 1 && (
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-mono relative z-10 text-zinc-300">
          <span className="flex items-center gap-1.5 text-[#F5D77F]">
            <span>⬆️</span>
            <span className="font-bold">{xpToNextRank} XP</span>
            <span className="text-zinc-400">to #{effectiveRank - 1}</span>
            {nextRankUsername && <span className="text-zinc-400">({nextRankUsername})</span>}
          </span>
          <span className="text-[11px] text-[#D4AF37] group-hover:underline">
            Tapping opens full leaderboard →
          </span>
        </div>
      )}
    </motion.div>
  );
};
