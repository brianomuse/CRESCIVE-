import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  X,
  ShieldCheck,
  Flame,
  Award,
  CheckCircle2,
  Calendar,
  Sparkles,
  Users,
  Clock,
  TrendingUp,
  Settings,
  Eye,
  EyeOff,
  UserCheck,
  ArrowUpRight,
  Target,
  Crown,
  Medal,
  RefreshCw,
} from "lucide-react";
import {
  UserProfile,
  MoveItem,
  LeaderboardEntry,
  LeaderboardFilter,
  LeaderboardPrivacySettings,
} from "../../types";
import {
  fetchLeaderboardData,
  LeaderboardResponse,
  getLeaderboardPrivacySettings,
  saveLeaderboardPrivacySettings,
  calculateUserStats,
} from "../../utils/leaderboardService";

interface GlobalLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  moves: MoveItem[];
  onOpenCreateMove?: () => void;
}

export const GlobalLeaderboardModal: React.FC<GlobalLeaderboardModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  moves,
  onOpenCreateMove,
}) => {
  const [filter, setFilter] = useState<LeaderboardFilter>("global");
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [privacySettings, setPrivacySettings] = useState<LeaderboardPrivacySettings>(
    getLeaderboardPrivacySettings
  );
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [customNameInput, setCustomNameInput] = useState(privacySettings.displayName || "");

  const loadData = async (activeFilter: LeaderboardFilter) => {
    setIsLoading(true);
    try {
      const data = await fetchLeaderboardData(activeFilter, userProfile, moves);
      setLeaderboardData(data);
    } catch (e) {
      console.error("Failed to load leaderboard data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData(filter);
    }
  }, [isOpen, filter, moves.length]);

  const handleSavePrivacy = () => {
    const updated: LeaderboardPrivacySettings = {
      ...privacySettings,
      displayName: customNameInput.trim(),
    };
    setPrivacySettings(updated);
    saveLeaderboardPrivacySettings(updated);
    setIsPrivacyModalOpen(false);
    // Reload with updated privacy settings
    loadData(filter);
  };

  const handleToggleOptIn = () => {
    const updated: LeaderboardPrivacySettings = {
      ...privacySettings,
      optIn: !privacySettings.optIn,
    };
    setPrivacySettings(updated);
    saveLeaderboardPrivacySettings(updated);
    loadData(filter);
  };

  if (!isOpen) return null;

  const entries = leaderboardData?.entries || [];
  const topThree = entries.slice(0, 3);
  const remainingEntries = entries.slice(3);
  const currentUserEntry = entries.find((e) => e.isCurrentUser);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-2xl bg-[#090918] rounded-3xl border border-[#D4AF37]/40 shadow-[0_25px_60px_-15px_rgba(212,175,55,0.3)] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Top Banner & Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-b from-[#151532] via-[#0d0d22] to-[#090918] border-b border-white/10 relative shrink-0">
            {/* Ambient gold glow */}
            <div className="absolute top-0 right-1/4 w-52 h-52 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D4AF37] via-[#FFF1C5] to-[#B8860B] p-[1.5px] shadow-[0_0_25px_rgba(212,175,55,0.4)] shrink-0">
                  <div className="w-full h-full rounded-[14px] bg-[#070716] flex items-center justify-center text-[#D4AF37]">
                    <Trophy className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-bold">
                      CRESCIVE GLOBAL STANDINGS
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Server Validated XP
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-light font-serif-cresive text-white tracking-wide">
                    The Global Leaderboard
                  </h2>
                  <p className="text-xs text-zinc-400 font-light mt-0.5">
                    LEARN → GROW → CREATE → PROGRESS
                  </p>
                </div>
              </div>

              {/* Action Buttons: Refresh, Privacy Settings, Close */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => loadData(filter)}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Refresh standings"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#D4AF37]" : ""}`} />
                </button>

                <button
                  onClick={() => setIsPrivacyModalOpen(true)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/40 text-zinc-300 hover:text-[#D4AF37] transition-colors cursor-pointer"
                  title="Leaderboard Privacy Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Motivational Banner / Rank Notification */}
            {leaderboardData?.rankChangeNotification && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500/20 via-[#101025] to-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-200"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{leaderboardData.rankChangeNotification}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400/80">Every Move counts</span>
              </motion.div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 pt-4 overflow-x-auto no-scrollbar">
              {[
                { id: "global", label: "Global", icon: Users },
                { id: "weekly", label: "Weekly Momentum", icon: Flame },
                { id: "friends", label: "Peers & Circle", icon: UserCheck },
                { id: "all-time", label: "All Time XP", icon: Award },
              ].map((tab) => {
                const isActive = filter === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as LeaderboardFilter)}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                        : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "stroke-[2.5]" : ""}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Leaderboard Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {entries.length === 0 ? (
              <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37] mb-4">
                  <Sparkles className="w-8 h-8 text-[#D4AF37]" />
                </div>
                <h3 className="text-xl font-light text-white mb-2 font-serif-cresive">
                  You&apos;re early.
                </h3>
                <p className="text-sm text-zinc-300 max-w-sm mb-1 font-light leading-relaxed">
                  The CRESCIVE community is still growing.
                </p>
                <p className="text-xs text-zinc-400 font-mono">
                  Real users will appear here as they join.
                </p>
                {onOpenCreateMove && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCreateMove();
                    }}
                    className="mt-6 py-2.5 px-6 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black text-xs font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Complete a Move to Claim #1
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Top Leading Trajectories Visual Display */}
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#D4AF37] block mb-3 font-semibold">
                    {entries.length === 1 ? "LEADING PIONEER" : "TOP LEADING TRAJECTORIES"}
                  </span>

                  <div
                    className={
                      entries.length === 1
                        ? "max-w-md mx-auto"
                        : entries.length === 2
                        ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
                        : "grid grid-cols-1 sm:grid-cols-3 gap-3"
                    }
                  >
                    {topThree.map((user, idx) => {
                      const isFirst = idx === 0;
                      const isSecond = idx === 1;

                      const medalStyles = isFirst
                        ? "border-[#D4AF37] bg-gradient-to-b from-[#D4AF37]/20 to-[#101025] shadow-[0_0_25px_rgba(212,175,55,0.25)]"
                        : isSecond
                        ? "border-slate-300/60 bg-gradient-to-b from-slate-300/15 to-[#101025] shadow-[0_0_20px_rgba(203,213,225,0.15)]"
                        : "border-amber-600/60 bg-gradient-to-b from-amber-600/15 to-[#101025] shadow-[0_0_20px_rgba(217,119,6,0.15)]";

                      const medalBadge = isFirst
                        ? { icon: Crown, label: "#1", color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/20 border-[#D4AF37]" }
                        : isSecond
                        ? { icon: Medal, label: "#2", color: "text-slate-200", bg: "bg-slate-300/20 border-slate-300" }
                        : { icon: Award, label: "#3", color: "text-amber-400", bg: "bg-amber-600/20 border-amber-600" };

                      const MedalIcon = medalBadge.icon;

                      return (
                        <motion.div
                          key={user.id}
                          whileHover={{ y: -3 }}
                          className={`rounded-2xl p-4 border flex flex-col items-center text-center relative overflow-hidden transition-all ${medalStyles} ${
                            user.isCurrentUser ? "ring-2 ring-[#D4AF37]" : ""
                          }`}
                        >
                          {/* Rank Badge */}
                          <div
                            className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold flex items-center gap-1 ${medalBadge.bg} ${medalBadge.color}`}
                          >
                            <MedalIcon className="w-3 h-3" />
                            <span>{medalBadge.label}</span>
                          </div>

                          {/* Avatar */}
                          <div
                            className={`w-14 h-14 rounded-2xl p-[2px] mt-1 shadow-lg ${
                              isFirst
                                ? "bg-gradient-to-tr from-[#D4AF37] to-[#FFF1C5]"
                                : isSecond
                                ? "bg-gradient-to-tr from-slate-200 to-slate-400"
                                : "bg-gradient-to-tr from-amber-500 to-amber-700"
                            }`}
                          >
                            <div className="w-full h-full rounded-[14px] bg-[#050510] overflow-hidden flex items-center justify-center">
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt={user.username}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span className="text-xl font-bold font-serif-cresive text-[#D4AF37]">
                                  {user.username.charAt(0)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Username & Badge */}
                          <h4 className="text-sm font-semibold text-white mt-2.5 truncate max-w-full flex items-center gap-1">
                            <span>{user.username}</span>
                            {user.isCurrentUser && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#D4AF37] text-black font-bold">
                                YOU
                              </span>
                            )}
                          </h4>

                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            {user.country || "Global"} · {user.chapter || "BUILDING"}
                          </p>

                          {/* XP & Stats */}
                          <div className="mt-3 pt-2.5 border-t border-white/10 w-full flex items-center justify-around text-xs">
                            <div>
                              <span className="text-[9px] font-mono text-zinc-400 uppercase block">Level</span>
                              <span className="font-mono font-bold text-white">Lvl {user.level}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-mono text-zinc-400 uppercase block">XP</span>
                              <span className="font-mono font-bold text-[#D4AF37]">
                                {filter === "weekly" ? user.weeklyXp : user.totalXp}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-mono text-zinc-400 uppercase block">Moves</span>
                              <span className="font-mono font-bold text-zinc-200">{user.completedMoves}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Ranked List Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#D4AF37] font-semibold">
                      FULL STANDINGS ({entries.length} {entries.length === 1 ? "MEMBER" : "MEMBERS"})
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Real-time authenticated
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(entries.length > 3 ? remainingEntries : entries).map((user) => {
                      const isCurrentUser = user.isCurrentUser;
                      return (
                        <div
                          key={user.id}
                          className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isCurrentUser
                              ? "bg-gradient-to-r from-[#D4AF37]/15 via-[#101025] to-[#D4AF37]/10 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)] ring-1 ring-[#D4AF37]/50"
                              : "bg-[#050510]/80 border-white/5 hover:border-white/15"
                          }`}
                        >
                          {/* Left: Rank, Avatar, Details */}
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-7 text-center font-mono text-sm font-bold shrink-0 ${
                                isCurrentUser ? "text-[#D4AF37]" : "text-zinc-400"
                              }`}
                            >
                              #{user.rank}
                            </span>

                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-[#101025] flex items-center justify-center">
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt={user.username}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span className="text-sm font-bold text-[#D4AF37]">
                                  {user.username.charAt(0)}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-sm font-semibold truncate ${
                                    isCurrentUser ? "text-[#D4AF37]" : "text-white"
                                  }`}
                                >
                                  {user.username}
                                </span>
                                {isCurrentUser && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#D4AF37] text-black font-bold">
                                    YOU
                                  </span>
                                )}
                                {user.badge && (
                                  <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-light">
                                    {user.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400 font-mono truncate">
                                {user.country || "Global"} · {user.completedMoves} Moves · {user.dailyChallengesCount} Challenges · {user.achievementsCount} 🏆
                              </p>
                            </div>
                          </div>

                          {/* Right: Level & XP */}
                          <div className="flex items-center gap-3 shrink-0 text-right">
                            <div className="hidden sm:block">
                              <span className="text-[10px] font-mono text-zinc-400 uppercase block">Level</span>
                              <span className="text-xs font-mono font-bold text-zinc-200">Lvl {user.level}</span>
                            </div>
                            <div className="w-16 sm:w-20 text-right">
                              <span className="text-[10px] font-mono text-zinc-400 uppercase block">
                                {filter === "weekly" ? "Weekly" : "Total"} XP
                              </span>
                              <span className="text-sm font-mono font-bold text-[#D4AF37]">
                                {(filter === "weekly" ? user.weeklyXp : user.totalXp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User's Position Sticky Bottom Bar */}
          <div className="p-4 sm:p-5 bg-gradient-to-t from-[#151532] via-[#0d0d22] to-[#090918] border-t border-white/10 shrink-0">
            {currentUserEntry ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] p-[1.5px] shrink-0">
                    <div className="w-full h-full rounded-[10px] bg-[#050510] flex items-center justify-center font-mono font-bold text-[#D4AF37] text-sm">
                      #{currentUserEntry.rank}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Your Current Standing</span>
                      <span className="text-xs font-mono text-[#D4AF37] font-semibold">
                        Lvl {currentUserEntry.level} ({currentUserEntry.totalXp} XP)
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {leaderboardData?.xpToNextRank && leaderboardData.nextRankUsername
                        ? `Only ${leaderboardData.xpToNextRank} XP to pass ${leaderboardData.nextRankUsername}!`
                        : "You're at the very peak of the leaderboard! 🚀"}
                    </p>
                  </div>
                </div>

                {onOpenCreateMove && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCreateMove();
                    }}
                    className="w-full sm:w-auto py-2 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black text-xs font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Complete a Move (+25 XP)</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 text-xs text-zinc-400">
                <span>You are currently unlisted on the global leaderboard.</span>
                <button
                  onClick={handleToggleOptIn}
                  className="py-1.5 px-3 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-bold hover:bg-[#D4AF37]/30 transition-colors"
                >
                  Opt In & Join Standings
                </button>
              </div>
            )}

            {/* Philosophy quote */}
            <p className="text-[10px] text-zinc-500 text-center font-light pt-2">
              &ldquo;{leaderboardData?.motivationalQuote || "Keep going. Every Move counts. 🚀"}&rdquo;
            </p>
          </div>
        </motion.div>

        {/* Privacy & Opt-in Settings Modal */}
        {isPrivacyModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#101025] rounded-3xl p-6 border border-[#D4AF37]/40 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-base font-bold text-white">Leaderboard Privacy</h3>
                </div>
                <button
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                CRESCIVE respects your autonomy. You choose whether you participate in the Global Leaderboard, and what information is visible to other learners.
              </p>

              <div className="space-y-3 pt-1">
                {/* Global Opt-In Toggle */}
                <div className="p-3 rounded-xl bg-[#050510] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Leaderboard Participation</span>
                    <span className="text-[10px] text-zinc-400">Include your progress in global standings</span>
                  </div>
                  <button
                    onClick={() => setPrivacySettings({ ...privacySettings, optIn: !privacySettings.optIn })}
                    className={`py-1 px-3 rounded-full text-xs font-bold transition-all ${
                      privacySettings.optIn
                        ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black"
                        : "bg-white/10 text-zinc-400"
                    }`}
                  >
                    {privacySettings.optIn ? "OPTED IN" : "UNLISTED"}
                  </button>
                </div>

                {/* Custom Display Name */}
                <div className="p-3 rounded-xl bg-[#050510] border border-white/10 space-y-1.5">
                  <label className="text-xs font-semibold text-white block">
                    Public Display Name / Alias
                  </label>
                  <input
                    type="text"
                    value={customNameInput}
                    placeholder={userProfile.preferredName}
                    onChange={(e) => setCustomNameInput(e.target.value)}
                    className="w-full bg-[#101025] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                  <span className="text-[10px] text-zinc-500 block">
                    Leave blank to use your preferred profile name.
                  </span>
                </div>

                {/* Show Avatar Toggle */}
                <div className="p-3 rounded-xl bg-[#050510] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Display Profile Picture</span>
                    <span className="text-[10px] text-zinc-400">Show custom avatar or anonymous initial</span>
                  </div>
                  <button
                    onClick={() => setPrivacySettings({ ...privacySettings, showAvatar: !privacySettings.showAvatar })}
                    className={`py-1 px-3 rounded-full text-xs font-bold transition-all ${
                      privacySettings.showAvatar
                        ? "bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37]"
                        : "bg-white/5 border border-white/10 text-zinc-400"
                    }`}
                  >
                    {privacySettings.showAvatar ? "VISIBLE" : "ANONYMOUS"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="py-1.5 px-4 rounded-xl text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePrivacy}
                  className="py-1.5 px-5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
