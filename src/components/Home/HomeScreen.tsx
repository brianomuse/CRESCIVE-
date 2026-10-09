import React, { useMemo, useState, useEffect } from "react";
import { motion } from "motion/react";
import { UserProfile, MoveItem, CresciveDailyState } from "../../types";
import { CRESCIVE_CATEGORIES } from "../../data/categories";
import { CategoryIcon } from "../CategoryIcon";
import { CresciveDailyCard } from "./CresciveDailyCard";
import { CresciveDailyModal } from "./CresciveDailyModal";
import { HomeLeaderboardCard } from "../Leaderboard/HomeLeaderboardCard";
import { GlobalLeaderboardModal } from "../Leaderboard/GlobalLeaderboardModal";
import { HelpButton } from "../Help/HelpButton";
import { getStoredDailyState } from "../../utils/cresciveDailyStorage";
import { CresciveLogo } from "../CresciveLogo";
import {
  Sparkles,
  Plus,
  ArrowRight,
  CheckCircle2,
  Circle,
  Compass,
  TrendingUp,
  Brain,
  Layers,
  ChevronRight,
  Shield,
  Activity,
  Lightbulb,
  Play,
  Zap,
} from "lucide-react";

interface HomeScreenProps {
  userProfile: UserProfile;
  moves: MoveItem[];
  onOpenCreateMove: (mode?: "create" | "ideas") => void;
  onToggleMove: (id: string) => void;
  onNavigateTab: (tab: "home" | "moves" | "fun" | "categories" | "future" | "navigator" | "chat" | "profile") => void;
  onOpenCreatorStory: () => void;
  onStartFocusSession?: (move: MoveItem | null, customDuration?: number) => void;
  onOpenHelpGuide?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userProfile,
  moves,
  onOpenCreateMove,
  onToggleMove,
  onNavigateTab,
  onOpenCreatorStory,
  onStartFocusSession,
  onOpenHelpGuide,
}) => {
  const preferredName = userProfile.preferredName || "Traveler";

  // CRESCIVE Daily state & modal control
  const [dailyState, setDailyState] = useState<CresciveDailyState>(getStoredDailyState);
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  useEffect(() => {
    // Refresh state when window gains focus or on mount
    const handleFocus = () => {
      setDailyState(getStoredDailyState());
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Dynamic greeting based on current local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return `Good morning, ${preferredName}.`;
    if (hour >= 12 && hour < 17) return `Good afternoon, ${preferredName}.`;
    if (hour >= 17 && hour < 22) return `Good evening, ${preferredName}.`;
    return `Good night, ${preferredName}.`;
  }, [preferredName]);

  const completedMoves = moves.filter((m) => m.completed);
  const pendingMoves = moves.filter((m) => !m.completed);

  // Honest momentum calculation: strictly derived from genuine completed moves!
  const momentumDisplay = useMemo(() => {
    if (moves.length === 0 || completedMoves.length === 0) {
      return {
        score: "—",
        subtitle: "Not enough movement yet.",
        description: "Your momentum will emerge from what you actually do.",
        status: "emerging",
      };
    }
    const ratio = completedMoves.length / moves.length;
    const score = Math.round(ratio * 100);
    return {
      score: `${score}%`,
      subtitle: `${completedMoves.length} of ${moves.length} Moves complete`,
      description: "Compounding consistency in progress.",
      status: "active",
    };
  }, [moves, completedMoves]);

  return (
    <div className="space-y-4 pb-24">
      {/* Top Banner: Creator Brian Story for easy visibility and access */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37]/15 via-[#101025] to-[#7F00FF]/15 border border-[#D4AF37]/40 flex items-center justify-between gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#D4AF37]/50 shadow-[0_0_12px_rgba(212,175,55,0.3)] shrink-0 bg-[#050510] flex items-center justify-center">
            <img
              src="/creator_brian.jpg"
              alt="Creator Brian"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              loading="eager"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-semibold">
                CREATOR &amp; FOUNDER
              </span>
              <span className="text-[10px] text-zinc-400 font-light">· Created 2026 · Malaba, Kenya</span>
            </div>
            <p className="text-xs text-white truncate font-medium">
              Brian Omuse · The vision behind CRESCIVE
            </p>
          </div>
        </div>

        <button
          id="btn-top-banner-creator-story"
          onClick={onOpenCreatorStory}
          className="py-1.5 px-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-md transition-all cursor-pointer whitespace-nowrap shrink-0 hover:scale-105 active:scale-95"
        >
          <span>Creator Story</span>
          <ChevronRight className="w-3 h-3 text-black stroke-[3]" />
        </button>
      </motion.div>

      {/* Top Ambient Glow & Greeting Card */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-[#D4AF37]/30 bg-gradient-to-br from-[#101025] via-[#101025]/90 to-[#050510] shadow-[0_15px_40px_-15px_rgba(212,175,55,0.2)]"
      >
        {/* Subtle auroral backdrop light */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-[radial-gradient(circle,rgba(127,0,255,0.15)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#101025] border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-mono tracking-widest uppercase mb-2">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>THE APP OF BECOMING</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-light font-serif-cresive text-white tracking-wide">
              {greeting}
            </h1>
            <p className="text-[#f5f5f0]/70 text-xs tracking-wider uppercase mt-1 font-light font-serif-cresive">
              &ldquo;The app of becoming.&rdquo;
            </p>
          </div>

          <button
            id="home-top-creator-story"
            onClick={onOpenCreatorStory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#050510] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[11px] text-white shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
            title="Read Creator Brian's Story"
          >
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            <span className="font-serif-cresive text-[#D4AF37] font-semibold">Brian&apos;s Story</span>
            <ChevronRight className="w-3 h-3 text-[#D4AF37]" />
          </button>
        </div>

        {/* Central Invitation / First Action Callout if Zero Moves */}
        {moves.length === 0 ? (
          <div className="relative z-10 mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white font-serif-cresive">
                &ldquo;Nothing moving yet.&rdquo;
              </p>
              <p className="text-xs text-[#D4AF37] font-semibold mt-0.5 font-mono">
                Not sure what to start with?
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-create-first-move"
                onClick={() => onOpenCreateMove("create")}
                className="py-2.5 px-5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs tracking-[0.1em] uppercase flex items-center gap-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-black stroke-[3]" />
                <span>+ Create a Move</span>
              </button>
              <button
                onClick={() => onOpenCreateMove("ideas")}
                className="py-2.5 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:scale-105 transition-all cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>✨ Move Ideas</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative z-10 mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <Activity className="w-4 h-4 text-[#D4AF37]" />
              <span>
                Active focus:{" "}
                <span className="text-[#D4AF37] font-semibold">
                  {pendingMoves.length} Move{pendingMoves.length !== 1 ? "s" : ""} on deck
                </span>
              </span>
            </div>
            <button
              onClick={() => onOpenCreateMove("create")}
              className="py-2 px-4 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 shadow-[0_10px_20px_rgba(0,0,0,0.4)] hover:scale-105 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Move</span>
            </button>
          </div>
        )}
      </motion.section>

      {/* CRESCIVE DAILY CHALLENGE CARD (Exclusive to Home) */}
      <CresciveDailyCard
        dailyState={dailyState}
        onOpenDaily={() => setIsDailyOpen(true)}
      />

      {/* CRESCIVE DAILY CHALLENGE MODAL */}
      <CresciveDailyModal
        isOpen={isDailyOpen}
        onClose={() => setIsDailyOpen(false)}
        dailyState={dailyState}
        onStateChange={setDailyState}
        onNavigateTab={onNavigateTab}
      />

      {/* Grid: MOMENTUM & YOUR TRAJECTORY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MOMENTUM CARD */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="crescive-glass-card rounded-2xl p-5 border border-amber-300/20 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#D4AF37] font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
                MOMENTUM
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {momentumDisplay.status === "emerging" ? "ZERO-STATE" : "ACTIVE"}
              </span>
            </div>

            <div className="my-2">
              <div className="text-4xl sm:text-5xl font-display font-extrabold gold-gradient-text tracking-tight">
                {momentumDisplay.score}
              </div>
              <p className="text-xs font-semibold text-white mt-1">
                {momentumDisplay.subtitle}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                {momentumDisplay.description}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-amber-200/80 italic">
            CRESCIVE measures real progress. Momentum is earned, never fabricated.
          </div>
        </motion.div>

        {/* YOUR TRAJECTORY CARD */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="crescive-glass-card rounded-2xl p-5 border border-amber-300/20 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#D4AF37] font-semibold flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
                YOUR TRAJECTORY
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-mono">
                MODEL v1.0
              </span>
            </div>

            {moves.length === 0 ? (
              <div className="my-2 space-y-1">
                <p className="text-sm font-semibold text-white">
                  Your trajectory hasn&apos;t been defined yet.
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  As you choose a direction and begin taking meaningful action, CRESCIVE will begin mapping your living path.
                </p>
              </div>
            ) : (
              <div className="my-2 space-y-2">
                <div className="text-xs font-mono text-[#F5D77F] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Direction: {userProfile.chapter.join(" / ") || "Growth"}</span>
                </div>
                <p className="text-xs text-zinc-300">
                  Target: <span className="text-white italic">&quot;{userProfile.becoming.slice(0, 60)}...&quot;</span>
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10">
            <button
              onClick={() => onNavigateTab("future")}
              className="text-xs font-semibold text-[#F5D77F] hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>{moves.length === 0 ? "Define your direction" : "Explore trajectory & scenarios"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* 🏆 GLOBAL LEADERBOARD CARD (Prominent on Home) */}
      <HomeLeaderboardCard
        userProfile={userProfile}
        moves={moves}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
      />

      {/* Global Leaderboard Modal accessible directly from Home */}
      <GlobalLeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        userProfile={userProfile}
        moves={moves}
        onOpenCreateMove={() => onOpenCreateMove("create")}
      />

      {/* YOUR MOVES SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="crescive-glass-card rounded-2xl p-5 sm:p-6 border border-amber-300/20"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold font-display text-white tracking-wide flex items-center gap-2">
              <span>YOUR MOVES</span>
              {moves.length > 0 && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F5D77F]">
                  {pendingMoves.length} active
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-400 font-light">
              Meaningful actions that move your future forward.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-home-flow-sanctuary"
              onClick={() => onStartFocusSession?.(null, 15)}
              className="py-1.5 px-3 rounded-lg border border-[#06b6d4]/30 bg-[#06b6d4]/10 hover:bg-[#06b6d4]/20 text-[#06b6d4] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              title="Enter Deep Work Sanctuary"
            >
              <Zap className="w-3.5 h-3.5 text-[#06b6d4]" />
              <span className="hidden sm:inline">Flow Sanctuary</span>
              <span className="sm:hidden">Flow</span>
            </button>

            <button
              onClick={() => onOpenCreateMove("create")}
              className="py-1.5 px-3 rounded-lg border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 text-[#F5D77F] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Move</span>
            </button>
          </div>
        </div>

        {moves.length === 0 ? (
          /* Honest Empty State for Moves */
          <div className="py-10 px-4 rounded-2xl bg-[#101025] border border-[#D4AF37]/25 text-center flex flex-col items-center shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-[#050510] border border-[#D4AF37]/30 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <h3 className="text-base font-light font-serif-cresive text-white tracking-wide">
              &ldquo;Nothing moving yet.&rdquo;
            </h3>
            <p className="text-xs text-[#D4AF37] font-mono font-semibold mt-0.5 mb-5">
              Not sure what to start with?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={() => onOpenCreateMove("create")}
                className="py-2.5 px-5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black stroke-[3]" />
                <span>+ Create a Move</span>
              </button>
              <button
                onClick={() => onOpenCreateMove("ideas")}
                className="py-2.5 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:scale-105 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>✨ Explore Move Ideas</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {moves.slice(0, 5).map((move) => (
              <div
                key={move.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  move.completed
                    ? "bg-white/[0.02] border-white/5 opacity-60"
                    : "bg-white/[0.04] border-white/10 hover:border-amber-300/30"
                }`}
              >
                <button
                  onClick={() => onToggleMove(move.id)}
                  className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                >
                  <div className="shrink-0">
                    {move.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-500 hover:text-amber-400 transition-colors" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium truncate ${
                        move.completed ? "line-through text-zinc-500" : "text-white"
                      }`}
                    >
                      {move.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                      <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-amber-200">
                        {move.domain}
                      </span>
                      <span>·</span>
                      <span>{move.timeCommitment}</span>
                    </div>
                  </div>
                </button>

                {!move.completed && (
                  <button
                    onClick={() => onStartFocusSession?.(move)}
                    className="py-1 px-2.5 rounded-full bg-[#050510] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-semibold text-[11px] flex items-center gap-1 shadow-[0_0_10px_rgba(212,175,55,0.1)] hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                    title="Enter Deep Work Sanctuary for this Move"
                  >
                    <Play className="w-2.5 h-2.5 fill-current text-[#D4AF37]" />
                    <span>Flow</span>
                  </button>
                )}
              </div>
            ))}

            {moves.length > 5 && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => onNavigateTab("moves")}
                  className="text-xs text-[#F5D77F] hover:underline font-semibold"
                >
                  View all {moves.length} Moves →
                </button>
              </div>
            )}
          </div>
        )}
      </motion.section>

      {/* LIFE DOMAINS (THE 15 CATEGORIES PREVIEW) */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="crescive-glass-card rounded-2xl p-5 sm:p-6 border border-amber-300/20"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold font-display text-white tracking-wide">
              YOUR LIFE · 15 DIMENSIONS
            </h2>
            <p className="text-xs text-zinc-400 font-light">
              An interconnected living map, not isolated folders.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab("categories")}
              className="px-2.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[11px] font-mono text-[#D4AF37] font-semibold hover:bg-[#D4AF37]/25 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>3D Constellation</span>
            </button>
            <button
              onClick={() => onNavigateTab("categories")}
              className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Explore</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {CRESCIVE_CATEGORIES.slice(0, 6).map((cat) => {
            const domainMoves = moves.filter((m) => m.domain === cat.title);
            const isDefined = domainMoves.length > 0;
            return (
              <button
                key={cat.id}
                onClick={() => onNavigateTab("categories")}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-400/30 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center border"
                    style={{ backgroundColor: `${cat.color}15`, borderColor: `${cat.color}35` }}
                  >
                    <CategoryIcon name={cat.iconName} className="w-3.5 h-3.5" size={14} />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    0{cat.number}
                  </span>
                </div>
                <div className="text-xs font-semibold text-white group-hover:text-[#F5D77F] transition-colors truncate">
                  {cat.title}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  {isDefined ? (
                    <span className="text-amber-300 font-mono">{domainMoves.length} active move(s)</span>
                  ) : (
                    <span className="text-zinc-500 italic">Not defined yet</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-zinc-400">
            Career ➔ Learning ➔ Money ➔ Health ➔ Time ➔ Meaning
          </span>
          <button
            onClick={() => onNavigateTab("categories")}
            className="text-[#F5D77F] font-semibold hover:underline cursor-pointer"
          >
            See all 15 →
          </button>
        </div>
      </motion.section>

      {/* WHAT IF? SCENARIO SIMULATOR BANNER */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl p-5 border border-purple-400/25 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-black/50 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-1.5 text-purple-300 text-[10px] font-mono tracking-widest uppercase mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-purple-300" />
            <span>SCENARIO SIMULATOR</span>
          </div>
          <h3 className="text-base font-bold text-white">
            WHAT IF?
          </h3>
          <p className="text-xs text-zinc-300 mt-0.5">
            Simulate a pivot, skill commitment, or decision before you make it.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab("future")}
          className="py-2.5 px-5 rounded-xl border border-purple-400/40 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
        >
          <span>Create a scenario</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.section>

      {/* CRESCIVE NAVIGATOR SHORTCUT */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-2xl p-5 border border-amber-300/20 bg-gradient-to-r from-amber-500/10 via-black/40 to-transparent flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#FFF1C5] p-[1.5px] shadow-[0_0_15px_rgba(212,175,55,0.3)] shrink-0">
            <div className="w-full h-full rounded-xl bg-[#0B0C16] flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#F5D77F]" />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-white">CRESCIVE NAVIGATOR</div>
            <p className="text-xs text-zinc-400 font-light">
              Grounded advice based on who you are and where you&apos;re going.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab("navigator")}
          className="py-2 px-4 rounded-xl gold-gradient-bg text-zinc-950 font-bold text-xs shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:brightness-110 cursor-pointer"
        >
          Ask Navigator
        </button>
      </motion.section>

      {/* CRESCIVE FUN ZONE SHORTCUT */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl p-5 border border-[#D4AF37]/35 bg-gradient-to-r from-purple-950/30 via-[#101025] to-[#D4AF37]/10 flex items-center justify-between shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-purple-400 p-[1.5px] shadow-[0_0_15px_rgba(212,175,55,0.25)] shrink-0">
            <div className="w-full h-full rounded-xl bg-[#0B0C16] flex items-center justify-center text-lg">
              🎉
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>FUN ZONE</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                Jokes &amp; Games
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-light">
              Take a short break, discover funny jokes, play mini-games, and earn XP.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab("fun")}
          className="py-2 px-4 rounded-xl border border-[#D4AF37]/40 bg-[#101025] hover:bg-[#D4AF37] text-white hover:text-black font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
        >
          Enter Fun Zone
        </button>
      </motion.section>

      {/* HELP / HOW TO USE THE APP */}
      {onOpenHelpGuide && (
        <div className="pt-3 pb-2 flex justify-center">
          <HelpButton onClick={onOpenHelpGuide} />
        </div>
      )}

      {/* CRESCIVE OFFICIAL ENTITY & DISCOVERABILITY FOOTER */}
      <footer className="mt-8 pt-6 pb-6 border-t border-white/10 text-center space-y-4">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-2.5">
            <CresciveLogo className="w-6 h-6" />
            <span className="font-serif-cresive text-sm font-semibold tracking-[0.25em] text-[#D4AF37] uppercase">
              CRESCIVE
            </span>
          </div>
          <p className="text-xs font-serif-cresive italic text-amber-200/90">
            &ldquo;The app of becoming.&rdquo;
          </p>
        </div>

        <div className="max-w-md mx-auto px-4 text-[11px] text-zinc-400 font-light leading-relaxed space-y-1">
          <p>
            <strong className="text-zinc-200">Creator &amp; Founder:</strong> Brian Omuse · Created 2026 · Malaba, Kenya
          </p>
          <p>
            <strong className="text-zinc-200">Purpose:</strong> A personal growth and self-development platform
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs">
          <button
            onClick={onOpenCreatorStory}
            className="text-zinc-400 hover:text-[#D4AF37] transition-colors cursor-pointer flex items-center gap-1 font-mono text-[11px]"
          >
            <span>Brian&apos;s Story</span>
            <ChevronRight className="w-3 h-3 text-[#D4AF37]" />
          </button>
          <span className="text-zinc-700">·</span>
          {onOpenHelpGuide && (
            <>
              <button
                onClick={onOpenHelpGuide}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer font-mono text-[11px]"
              >
                App Guide
              </button>
              <span className="text-zinc-700">·</span>
            </>
          )}
          <a
            href="https://crescive.ai.studio/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#D4AF37]/80 hover:text-[#D4AF37] transition-colors font-mono text-[11px]"
          >
            crescive.ai.studio
          </a>
        </div>
      </footer>
    </div>
  );
};
