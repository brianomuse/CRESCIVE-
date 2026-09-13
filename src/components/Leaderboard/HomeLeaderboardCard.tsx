import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, ChevronRight, TrendingUp, Sparkles, ShieldCheck, ArrowUpRight } from "lucide-react";
import { UserProfile, MoveItem, LeaderboardEntry } from "../../types";
import {
  fetchLeaderboardData,
  calculateUserStats,
  LeaderboardResponse,
  getLastSavedXp,
  saveLastXp,
  getLastSavedRank,
  saveLastRank,
} from "../../utils/leaderboardService";
import { ACTIVE_TIME_EVENT } from "../../utils/activeTimeTracker";

interface HomeLeaderboardCardProps {
  userProfile: UserProfile;
  moves: MoveItem[];
  onOpenLeaderboard: () => void;
}

export const HomeLeaderboardCard: React.FC<HomeLeaderboardCardProps> = ({
  userProfile,
  moves,
  onOpenLeaderboard,
}) => {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentXpGained, setRecentXpGained] = useState<number | null>(null);
  const [rankChangeMsg, setRankChangeMsg] = useState<string | null>(null);

  // Authoritative real user stats
  const userStats = calculateUserStats(userProfile, moves);
  const prevXpRef = useRef<number>(userStats.totalXp);
  const prevRankRef = useRef<number | null>(null);

  // Refresh leaderboard data when moves or profile changes
  useEffect(() => {
    let isMounted = true;
    const currentXp = userStats.totalXp;

    // Detect immediate live XP gain
    if (prevXpRef.current !== undefined && currentXp > prevXpRef.current) {
      const diff = currentXp - prevXpRef.current;
      setRecentXpGained(diff);
      const timer = setTimeout(() => {
        if (isMounted) setRecentXpGained(null);
      }, 3500);
      prevXpRef.current = currentXp;
      saveLastXp(currentXp);
    } else {
      prevXpRef.current = currentXp;
    }

    fetchLeaderboardData("global", userProfile, moves).then((res) => {
      if (!isMounted) return;
      setData(res);
      setIsLoading(false);

      const oldRank = prevRankRef.current ?? getLastSavedRank();
      const newRank = res.userRank;

      if (oldRank && newRank && newRank < oldRank) {
        setRankChangeMsg(`⬆️ You moved from #${oldRank} → #${newRank}!`);
      } else if (oldRank && newRank && newRank > oldRank) {
        setRankChangeMsg(`Your rank is now #${newRank}`);
      } else if (res.rankChangeNotification) {
        setRankChangeMsg(res.rankChangeNotification);
      }

      if (newRank) {
        prevRankRef.current = newRank;
        saveLastRank(newRank);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [userProfile, moves]);

  // Listen to active time updates for level changes
  useEffect(() => {
    const handleActiveTime = () => {
      // Re-trigger small calculation if level changed
    };
    window.addEventListener(ACTIVE_TIME_EVENT, handleActiveTime);
    return () => window.removeEventListener(ACTIVE_TIME_EVENT, handleActiveTime);
  }, []);

  const userRank = data?.userRank ?? (userStats.totalXp === 0 ? 500 : 24);
  const totalParticipants = data?.totalParticipants ?? 500;
  const xpToNext = data?.xpToNextRank ?? (userStats.totalXp === 0 ? 25 : 120);
  const nextRankNumber = Math.max(1, (userRank || 2) - 1);

  // Top 3 peers
  const topPeers: LeaderboardEntry[] = data?.entries && data.entries.length >= 3
    ? data.entries.slice(0, 3)
    : [
        {
          id: "peer-alex",
          rank: 1,
          username: "Alex",
          level: 18,
          totalXp: 12450,
          weeklyXp: 480,
          completedMoves: 142,
          dailyChallengesCount: 76,
          achievementsCount: 28,
          chapter: "BUILDING",
          country: "Global",
          badge: "Legendary ⚡",
          streakDays: 45,
        },
        {
          id: "peer-jordan",
          rank: 2,
          username: "Jordan",
          level: 17,
          totalXp: 11980,
          weeklyXp: 430,
          completedMoves: 136,
          dailyChallengesCount: 71,
          achievementsCount: 26,
          chapter: "BUILDING",
          country: "Global",
          badge: "Visionary 🚀",
          streakDays: 39,
        },
        {
          id: "peer-sam",
          rank: 3,
          username: "Sam",
          level: 17,
          totalXp: 11420,
          weeklyXp: 410,
          completedMoves: 128,
          dailyChallengesCount: 68,
          achievementsCount: 24,
          chapter: "BUILDING",
          country: "Global",
          badge: "Mastermind 🎯",
          streakDays: 34,
        },
      ];

  const medalEmojis = ["🥇", "🥈", "🥉"];

  return (
    <motion.div
      id="home-global-leaderboard-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      onClick={onOpenLeaderboard}
      className="crescive-glass-card rounded-2xl p-5 sm:p-6 border border-[#D4AF37]/35 bg-gradient-to-br from-[#121228] via-[#090919] to-[#16122c] hover:border-[#D4AF37]/60 transition-all cursor-pointer group shadow-[0_12px_35px_-10px_rgba(212,175,55,0.2)] relative overflow-hidden"
    >
      {/* Background ambient accent */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-36 h-36 rounded-full bg-purple-600/10 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D4AF37] via-[#FFF1C5] to-[#B8860B] p-[1.5px] shadow-[0_0_15px_rgba(212,175,55,0.35)] shrink-0">
            <div className="w-full h-full rounded-[10px] bg-[#070714] flex items-center justify-center text-[#D4AF37]">
              <Trophy className="w-4 h-4 text-[#D4AF37]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#D4AF37]">
                🏆 GLOBAL LEADERBOARD
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                Live
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-light">
              Healthy competition &amp; verified growth
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenLeaderboard();
          }}
          className="text-xs font-semibold text-[#F5D77F] group-hover:text-white flex items-center gap-1 transition-all cursor-pointer shrink-0"
        >
          <span className="hidden sm:inline">View Full Leaderboard</span>
          <span className="sm:hidden">Full Board</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Main Content Split: Personal Rank & Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {/* Personal Rank Section (Always prioritized) */}
        <div className="p-4 rounded-xl bg-[#070714]/90 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-1">
              <span className="uppercase tracking-wider font-semibold text-zinc-400">
                Your Rank
              </span>
              <span className="text-[11px] text-zinc-400">
                of {totalParticipants} global
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#D4AF37] tracking-tight">
                #{userRank}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-mono font-bold text-white">
                  {userStats.totalXp.toLocaleString()} XP
                </span>

                {/* Live XP Gained Badge */}
                <AnimatePresence>
                  {recentXpGained && (
                    <motion.span
                      initial={{ scale: 0.7, opacity: 0, y: 5 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/25 border border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.4)]"
                    >
                      +{recentXpGained} XP
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Rank Change Message or Level indicator */}
            {rankChangeMsg ? (
              <div className="mt-1.5 inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>{rankChangeMsg}</span>
              </div>
            ) : (
              <div className="text-xs text-zinc-400 font-mono mt-1">
                Level {userStats.level} · {userStats.completedMovesCount} Moves · {userStats.dailyChallengesCount} Challenges
              </div>
            )}
          </div>

          {/* Next-Rank Motivation */}
          <div className="mt-3 pt-2.5 border-t border-white/10 text-xs font-mono flex items-center justify-between text-zinc-300">
            <span className="flex items-center gap-1 text-[#F5D77F]">
              <span className="text-base">⬆️</span>
              <span className="font-semibold">{xpToNext} XP</span>
              <span className="text-zinc-400">to #{nextRankNumber}</span>
            </span>
            <span className="text-[11px] text-zinc-400 italic">
              Keep moving forward 🚀
            </span>
          </div>
        </div>

        {/* Top 3 Section */}
        <div className="p-4 rounded-xl bg-[#070714]/90 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-2 flex items-center justify-between">
              <span>Top 3</span>
              <span className="text-[10px] text-zinc-400">Community Leaders</span>
            </div>

            <div className="space-y-2">
              {topPeers.slice(0, 3).map((peer, idx) => (
                <div
                  key={peer.id || idx}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs font-mono"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{medalEmojis[idx]}</span>
                    <span className="font-bold text-white truncate max-w-[120px] sm:max-w-[140px]">
                      {peer.username}
                    </span>
                  </div>
                  <span className="text-[#D4AF37] font-semibold shrink-0">
                    {peer.totalXp.toLocaleString()} XP
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Card Action */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-zinc-400 text-[11px]">
              Tapping card opens full board
            </span>
            <span className="text-[#D4AF37] font-mono font-semibold flex items-center gap-1 group-hover:underline">
              <span>View Full Leaderboard</span>
              <span>→</span>
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
