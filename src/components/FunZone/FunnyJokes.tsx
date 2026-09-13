import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Heart,
  Copy,
  Check,
  Share2,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Smile,
  Calendar,
  Layers,
  ArrowLeft,
} from "lucide-react";
import { Joke, JokeCategory, FunZoneState } from "../../types";
import { FUN_JOKES, JOKE_CATEGORIES } from "../../data/funZoneData";
import {
  recordFunActivity,
  toggleFavoriteJokeInStorage,
  claimDailyJokeXp,
  getTodayDateString,
} from "../../utils/funZoneStorage";
import { playCresciveChime } from "../../utils/reminderEngine";

interface FunnyJokesProps {
  funState: FunZoneState;
  onUpdateFunState: (newState: FunZoneState) => void;
  onToast: (msg: string) => void;
  onBack: () => void;
}

export const FunnyJokes: React.FC<FunnyJokesProps> = ({
  funState,
  onUpdateFunState,
  onToast,
  onBack,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<JokeCategory | "All" | "Favorites">("All");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPunchline, setShowPunchline] = useState(true);
  const [copied, setCopied] = useState(false);

  // Filtered joke pool
  const filteredJokes = useMemo(() => {
    if (selectedCategory === "Favorites") {
      const favs = FUN_JOKES.filter((j) => funState.favoritedJokeIds.includes(j.id));
      return favs.length > 0 ? favs : FUN_JOKES;
    }
    if (selectedCategory === "All" || selectedCategory === "Random") {
      return FUN_JOKES;
    }
    return FUN_JOKES.filter((j) => j.category === selectedCategory);
  }, [selectedCategory, funState.favoritedJokeIds]);

  // Daily joke (deterministic based on current day of the year)
  const dailyJoke = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    const index = Math.abs(dayOfYear) % FUN_JOKES.length;
    return FUN_JOKES[index];
  }, []);

  const currentJoke = filteredJokes[currentIndex] || filteredJokes[0] || FUN_JOKES[0];
  const isFavorite = funState.favoritedJokeIds.includes(currentJoke.id);

  // Reset index when category changes
  useEffect(() => {
    setCurrentIndex(0);
    setShowPunchline(true);
  }, [selectedCategory]);

  const handleNext = () => {
    if (filteredJokes.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredJokes.length);
    setShowPunchline(true);
    // Track joke view
    const res = recordFunActivity(funState, 0, "joke");
    onUpdateFunState(res.updatedState);
  };

  const handlePrevious = () => {
    if (filteredJokes.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredJokes.length) % filteredJokes.length);
    setShowPunchline(true);
  };

  const handleRandom = () => {
    if (filteredJokes.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * filteredJokes.length);
    if (nextIdx === currentIndex) {
      nextIdx = (nextIdx + 1) % filteredJokes.length;
    }
    setCurrentIndex(nextIdx);
    setShowPunchline(true);

    // Track activity
    const res = recordFunActivity(funState, 0, "joke");
    onUpdateFunState(res.updatedState);
  };

  const handleToggleFavorite = () => {
    const res = toggleFavoriteJokeInStorage(funState, currentJoke.id);
    onUpdateFunState(res.updatedState);
    if (res.isFavorited) {
      playCresciveChime();
      onToast("❤️ Added to Favorites! +2 XP");
    } else {
      onToast("Removed from Favorites");
    }
  };

  const handleCopy = async () => {
    const textToCopy = currentJoke.punchline
      ? `${currentJoke.text}\n${currentJoke.punchline} ${currentJoke.emoji || ""}\n— via CRESCIVE Fun Zone`
      : `${currentJoke.text} ${currentJoke.emoji || ""}\n— via CRESCIVE Fun Zone`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      onToast("📋 Joke copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast("Failed to copy joke");
    }
  };

  const handleShare = async () => {
    const textToShare = currentJoke.punchline
      ? `${currentJoke.text}\n${currentJoke.punchline} ${currentJoke.emoji || ""}\n— via CRESCIVE Fun Zone`
      : `${currentJoke.text} ${currentJoke.emoji || ""}\n— via CRESCIVE Fun Zone`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "A laugh from CRESCIVE",
          text: textToShare,
        });
      } catch {
        // Share cancelled or unavailable, fall back to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleClaimDailyJoke = () => {
    const res = claimDailyJokeXp(funState);
    if (res.claimed) {
      playCresciveChime();
      onToast("🎉 Daily Joke Claimed! +2 XP");
      onUpdateFunState(res.updatedState);
    } else {
      onToast("You already claimed today's joke bonus!");
    }
  };

  const isDailyClaimed = funState.dailyJokeClaimedDate === getTodayDateString();

  return (
    <div className="space-y-5 pb-16">
      {/* Header with Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#101025] hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Fun Zone</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37]">
          <span>
            {currentIndex + 1} / {filteredJokes.length}
          </span>
        </div>
      </div>

      {/* Daily Joke Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#101025] via-[#151535] to-[#050510] border border-[#D4AF37]/35 shadow-[0_10px_30px_rgba(0,0,0,0.6)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.12)_0%,transparent_70%)] pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-mono uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Daily Joke
            </span>
            <span className="text-[11px] text-zinc-400 font-light">Fresh every day</span>
          </div>

          <button
            onClick={handleClaimDailyJoke}
            disabled={isDailyClaimed}
            className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
              isDailyClaimed
                ? "bg-white/5 text-zinc-400 border border-white/10 opacity-70"
                : "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95"
            }`}
          >
            {isDailyClaimed ? "Claimed ✓" : "Claim +2 XP"}
          </button>
        </div>

        <p className="text-sm font-medium text-white leading-relaxed mt-1">
          {dailyJoke.text}
        </p>
        {dailyJoke.punchline && (
          <p className="text-sm font-serif-cresive text-[#D4AF37] mt-1.5 font-bold">
            {dailyJoke.punchline} {dailyJoke.emoji}
          </p>
        )}
      </div>

      {/* Category Pills Slider */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] uppercase tracking-widest text-[#f5f5f0]/60 font-mono">
            Categories
          </span>
          {funState.favoritedJokeIds.length > 0 && (
            <span className="text-[10px] text-[#D4AF37] font-mono">
              ❤️ {funState.favoritedJokeIds.length} Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "All"
                ? "bg-[#D4AF37] text-black shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                : "bg-[#101025] text-zinc-400 hover:text-white border border-white/5"
            }`}
          >
            😂 All Jokes
          </button>

          {JOKE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#D4AF37] text-black shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                  : "bg-[#101025] text-zinc-400 hover:text-white border border-white/5"
              }`}
            >
              {cat}
            </button>
          ))}

          {funState.favoritedJokeIds.length > 0 && (
            <button
              onClick={() => setSelectedCategory("Favorites")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                selectedCategory === "Favorites"
                  ? "bg-[#D4AF37] text-black shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                  : "bg-[#101025] text-rose-400 hover:text-rose-300 border border-rose-500/20"
              }`}
            >
              <Heart className="w-3 h-3 fill-current" />
              <span>Favorites</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Joke Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentJoke.id}
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -10 }}
          transition={{ duration: 0.2 }}
          className="relative min-h-[220px] rounded-3xl p-6 sm:p-7 bg-[#101025] border border-[#D4AF37]/40 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.1)] flex flex-col justify-between"
        >
          {/* Top card header */}
          <div className="flex items-center justify-between mb-4">
            <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#D4AF37] text-[10px] font-mono tracking-wider uppercase">
              {currentJoke.category}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isFavorite
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5"
                }`}
                title={isFavorite ? "Favorited" : "Add to Favorites (+2 XP)"}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? "fill-current text-rose-400" : ""}`} />
              </button>

              <button
                onClick={handleCopy}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 transition-all cursor-pointer"
                title="Copy Joke"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 transition-all cursor-pointer"
                title="Share Joke"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Joke Text */}
          <div className="my-auto py-2">
            <p className="text-base sm:text-lg font-medium text-white leading-relaxed whitespace-pre-line">
              {currentJoke.text}
            </p>

            {currentJoke.punchline && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 pt-4 border-t border-white/10 flex items-start gap-2"
              >
                <p className="text-base sm:text-lg font-serif-cresive font-bold text-[#D4AF37] leading-relaxed">
                  {currentJoke.punchline}
                </p>
                {currentJoke.emoji && (
                  <span className="text-xl shrink-0">{currentJoke.emoji}</span>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer controls inside card */}
          <div className="pt-5 border-t border-white/5 flex items-center justify-between gap-2 mt-4">
            <button
              onClick={handlePrevious}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Prev</span>
            </button>

            <button
              onClick={handleRandom}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Random Joke</span>
            </button>

            <button
              onClick={handleNext}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
            >
              <span className="hidden xs:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
