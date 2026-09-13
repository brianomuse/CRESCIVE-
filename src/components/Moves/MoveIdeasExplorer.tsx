import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, MoveIdea } from "../../types";
import {
  MOVE_IDEAS,
  MOVE_IDEAS_CATEGORIES,
  MOVE_TIME_FILTERS,
  MoveIdeaCategory,
} from "../../data/moveIdeas";
import {
  Search,
  Sparkles,
  Clock,
  Filter,
  Plus,
  ArrowRight,
  SlidersHorizontal,
  Compass,
  Check,
  Tag,
  Lightbulb,
} from "lucide-react";

interface MoveIdeasExplorerProps {
  userProfile?: UserProfile;
  onSelectIdea: (idea: MoveIdea, autoFocusCustomization?: boolean) => void;
  onSwitchToManual: () => void;
}

export const MoveIdeasExplorer: React.FC<MoveIdeasExplorerProps> = ({
  userProfile,
  onSelectIdea,
  onSwitchToManual,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MoveIdeaCategory>("All Categories");
  const [selectedDuration, setSelectedDuration] = useState<string>("All Durations");

  // Section 6: Compute Personalized Recommendations based ONLY on user-provided profile info
  const personalizedRecommendations = useMemo<MoveIdea[]>(() => {
    if (!userProfile) {
      // General balanced defaults if profile not available
      return MOVE_IDEAS.filter((i) =>
        ["kl-1", "hf-1", "tp-1", "cb-1"].includes(i.id)
      );
    }

    const userChapters = (userProfile.chapter || []).map((c) => c.toLowerCase());
    const userMatters = (userProfile.matters || []).map((m) => m.toLowerCase());
    const becomingText = (userProfile.becoming || "").toLowerCase();

    const scored = MOVE_IDEAS.map((idea) => {
      let score = 0;
      const catLower = idea.category.toLowerCase();
      const titleLower = idea.title.toLowerCase();
      const tags = idea.tags.map((t) => t.toLowerCase());

      // Match Chapters
      if (userChapters.includes("learning") && (catLower.includes("learning") || catLower.includes("education") || catLower.includes("reading"))) {
        score += 3;
      }
      if (userChapters.includes("building") && (catLower.includes("building") || catLower.includes("technology") || catLower.includes("creativity"))) {
        score += 3;
      }
      if (userChapters.includes("working") && (catLower.includes("career") || catLower.includes("time & productivity") || catLower.includes("leadership"))) {
        score += 3;
      }
      if (userChapters.includes("exploring") && (catLower.includes("experiences") || catLower.includes("hobbies") || catLower.includes("personal growth"))) {
        score += 3;
      }
      if (userChapters.includes("transitioning") && (catLower.includes("goals & direction") || catLower.includes("confidence") || catLower.includes("discipline"))) {
        score += 3;
      }

      // Match Matters (e.g. Sovereign Health, Wealth & Autonomy, Deep Knowledge, Creative Mastery, etc.)
      for (const m of userMatters) {
        if (m.includes("health") && catLower.includes("health")) score += 4;
        if (m.includes("wealth") && catLower.includes("money")) score += 4;
        if (m.includes("knowledge") && catLower.includes("learning")) score += 4;
        if (m.includes("creative") && (catLower.includes("creativity") || catLower.includes("building"))) score += 4;
        if (m.includes("connection") && catLower.includes("relationships")) score += 4;
        if (m.includes("autonomy") && (catLower.includes("discipline") || catLower.includes("direction"))) score += 4;
      }

      // Match Becoming keywords
      if (becomingText) {
        if (becomingText.includes("engineer") || becomingText.includes("code") || becomingText.includes("program")) {
          if (tags.includes("coding") || tags.includes("software")) score += 4;
        }
        if (becomingText.includes("writer") || becomingText.includes("author")) {
          if (tags.includes("writing") || tags.includes("reading")) score += 4;
        }
        if (becomingText.includes("leader") || becomingText.includes("entrepreneur")) {
          if (tags.includes("leadership") || tags.includes("initiative")) score += 4;
        }
      }

      return { idea, score };
    });

    const highScored = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
    if (highScored.length >= 3) {
      return highScored.slice(0, 4).map((s) => s.idea);
    }

    // Fallback if user profile info is minimal: provide robust general foundational ideas
    return MOVE_IDEAS.filter((i) =>
      ["kl-1", "hf-1", "tp-1", "cb-1"].includes(i.id)
    );
  }, [userProfile]);

  // Filtered Ideas based on Search, Category, and Duration
  const filteredIdeas = useMemo(() => {
    return MOVE_IDEAS.filter((idea) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = idea.title.toLowerCase().includes(q);
        const matchesCat = idea.category.toLowerCase().includes(q);
        const matchesExp = idea.explanation.toLowerCase().includes(q);
        const matchesTag = idea.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCat && !matchesExp && !matchesTag) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== "All Categories" && idea.category !== selectedCategory) {
        return false;
      }

      // Duration filter
      if (selectedDuration !== "All Durations" && idea.timeBucket !== selectedDuration) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedDuration]);

  // Color mapping helper for category styling
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Knowledge & Learning":
      case "Reading":
      case "School & Education":
        return { text: "text-sky-300", bg: "bg-sky-500/10", border: "border-sky-500/30" };
      case "Career & Work":
      case "Leadership":
        return { text: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/30" };
      case "Money":
        return { text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
      case "Health & Fitness":
        return { text: "text-teal-300", bg: "bg-teal-500/10", border: "border-teal-500/30" };
      case "Creativity":
      case "Creator & Building":
        return { text: "text-purple-300", bg: "bg-purple-500/10", border: "border-purple-500/30" };
      case "Relationships":
      case "Community & Helping Others":
        return { text: "text-rose-300", bg: "bg-rose-500/10", border: "border-rose-500/30" };
      case "Technology":
        return { text: "text-cyan-300", bg: "bg-cyan-500/10", border: "border-cyan-500/30" };
      default:
        return { text: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10", border: "border-[#D4AF37]/30" };
    }
  };

  return (
    <div className="space-y-5">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search ideas by title, skill, duration (e.g. python, walk, 30 min)..."
          className="w-full bg-[#050510] border border-white/10 focus:border-[#D4AF37]/60 rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm text-[#f5f5f0] placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Duration Filter Pills */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#D4AF37]" />
            <span>Time Available</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MOVE_TIME_FILTERS.map((duration) => (
            <button
              key={duration}
              onClick={() => setSelectedDuration(duration)}
              className={`py-1.5 px-3 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                selectedDuration === duration
                  ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {duration}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Horizontal Scroll / Grid */}
      <div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-1.5">
          <Filter className="w-3 h-3 text-[#D4AF37]" />
          <span>Life Dimension ({MOVE_IDEAS_CATEGORIES.length - 1} Categories)</span>
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
          {MOVE_IDEAS_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`py-1.5 px-3 rounded-xl text-xs whitespace-nowrap shrink-0 border transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37] font-semibold"
                  : "bg-white/[0.03] hover:bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Section 6: Recommended for You (when no search/category filter active or on initial view) */}
      {!searchQuery && selectedCategory === "All Categories" && selectedDuration === "All Durations" && (
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-[#D4AF37]/10 via-[#101025] to-[#7F00FF]/10 border border-[#D4AF37]/35 shadow-[0_0_25px_rgba(212,175,55,0.1)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Recommended for You
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[#D4AF37]/80">
              Calibrated to your Genesis
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {personalizedRecommendations.map((idea) => {
              const colors = getCategoryColor(idea.category);
              return (
                <div
                  key={`rec-${idea.id}`}
                  className="p-3.5 rounded-xl bg-[#050510]/90 border border-white/10 hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${colors.bg} ${colors.border} ${colors.text}`}>
                        {idea.category}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#D4AF37]" />
                        {idea.suggestedDuration}
                      </span>
                    </div>
                    <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                      {idea.title}
                    </h5>
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed font-light">
                      {idea.explanation}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectIdea(idea, false)}
                      className="py-1 px-2.5 rounded-lg text-[11px] font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      Customize
                    </button>
                    <button
                      onClick={() => onSelectIdea(idea, true)}
                      className="py-1 px-3 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <span>Use This Move</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 5: Notice that Move Ideas are suggestions/templates only */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono px-1">
        <span className="flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-[#D4AF37]/60" />
          <span>Templates only · Customize and confirm to add to your trajectory.</span>
        </span>
        <button
          type="button"
          onClick={onSwitchToManual}
          className="text-[#D4AF37] hover:underline cursor-pointer font-semibold whitespace-nowrap ml-2"
        >
          Create from scratch →
        </button>
      </div>

      {/* Ideas Card Grid */}
      {filteredIdeas.length === 0 ? (
        <div className="py-12 px-4 rounded-2xl bg-[#050510] border border-white/10 text-center">
          <p className="text-sm font-medium text-white">No ideas match your filter.</p>
          <p className="text-xs text-zinc-400 mt-1">
            Try adjusting your search query or reset filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All Categories");
              setSelectedDuration("All Durations");
            }}
            className="mt-3 py-1.5 px-4 rounded-full border border-white/15 text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[440px] overflow-y-auto pr-1">
          {filteredIdeas.map((idea) => {
            const colors = getCategoryColor(idea.category);
            return (
              <motion.div
                key={idea.id}
                layout
                className="p-4 rounded-2xl bg-[#050510]/80 border border-white/10 hover:border-[#D4AF37]/50 shadow-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${colors.bg} ${colors.border} ${colors.text} font-semibold`}>
                      {idea.category}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#D4AF37]" />
                      {idea.suggestedDuration}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors leading-snug">
                    {idea.title}
                  </h4>

                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed font-light">
                    {idea.explanation}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectIdea(idea, false)}
                    className="py-1.5 px-3 rounded-xl border border-white/10 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Customize
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectIdea(idea, true)}
                    className="py-1.5 px-4 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_5px_15px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Use This Move</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
