import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CRESCIVE_CATEGORIES } from "../../data/categories";
import { LifeCategory, MoveItem, UserProfile } from "../../types";
import { CategoryIcon } from "../CategoryIcon";
import { CelestialConstellation3D } from "../Constellation/CelestialConstellation3D";
import {
  Plus,
  X,
  ArrowRight,
  Sparkles,
  Check,
  Link2,
  Compass,
  LayoutGrid,
  Maximize2,
  Zap,
} from "lucide-react";

interface CategoriesScreenProps {
  moves: MoveItem[];
  onOpenCreateMoveForDomain: (domainTitle: string) => void;
  userProfile?: UserProfile | null;
  onStartFocusSession?: (move: MoveItem | null, customDuration?: number) => void;
  defaultView?: "grid" | "3d";
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({
  moves,
  onOpenCreateMoveForDomain,
  userProfile,
  onStartFocusSession,
  defaultView = "3d",
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "3d">(defaultView);
  const [selectedCategory, setSelectedCategory] = useState<LifeCategory | null>(null);

  return (
    <div className="space-y-6 pb-24">
      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#D4AF37] font-semibold">
            THE LIVING LIFE MAP
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
            15 Life Dimensions
          </h1>
          <p className="text-xs text-zinc-400 font-light mt-0.5">
            Not isolated folders. An interconnected architecture of personal becoming.
          </p>
        </div>

        {/* 3D Constellation / Grid View Toggle */}
        <div className="flex items-center self-start sm:self-center p-1 rounded-2xl bg-[#050510] border border-white/10 shadow-inner">
          <button
            id="btn-view-3d-constellation"
            onClick={() => setViewMode("3d")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "3d"
                ? "bg-gradient-to-r from-[#D4AF37]/25 to-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/50 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>3D Constellation</span>
          </button>
          <button
            id="btn-view-grid"
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-white/15 text-white border border-white/20 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grid View</span>
          </button>
        </div>
      </div>

      {/* 3D CONSTELLATION EXPERIENCE */}
      {viewMode === "3d" && (
        <div className="space-y-4">
          <CelestialConstellation3D
            moves={moves}
            userProfile={userProfile}
            onOpenCreateMoveForDomain={onOpenCreateMoveForDomain}
            onStartFocusSession={onStartFocusSession}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      )}

      {/* Interconnection Banner */}
      <div className="p-4 rounded-2xl crescive-glass border border-amber-300/20 text-xs">
        <div className="flex items-center gap-2 text-[#F5D77F] font-semibold mb-1">
          <Link2 className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>The Interconnection Principle</span>
        </div>
        <p className="text-zinc-300 leading-relaxed">
          In CRESCIVE, goals don&apos;t live in silos. For example:{" "}
          <span className="text-amber-200">
            Career ➔ Knowledge (skills) ➔ Time (study blocks) ➔ Money (leverage) ➔ Health (sustainable pacing) ➔ Future
          </span>
          . Every choice ripples across the map.
        </p>
      </div>

      {/* 15 Categories Grid (Always rendered in Grid mode) */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CRESCIVE_CATEGORIES.map((cat) => {
            const catMoves = moves.filter((m) => m.domain === cat.title);
            const completedCount = catMoves.filter((m) => m.completed).length;

            return (
              <motion.div
                key={cat.id}
                whileHover={{ y: -3 }}
                onClick={() => setSelectedCategory(cat)}
                className="crescive-glass-card rounded-2xl p-4 border border-white/10 hover:border-amber-400/40 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border"
                      style={{ backgroundColor: `${cat.color}15`, borderColor: `${cat.color}40` }}
                    >
                      <CategoryIcon name={cat.iconName} className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-mono text-zinc-500 font-semibold">
                      {cat.number < 10 ? `0${cat.number}` : cat.number}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-wide">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">
                    {catMoves.length > 0 ? (
                      <span className="text-[#F5D77F] font-mono">
                        {completedCount}/{catMoves.length} Moves
                      </span>
                    ) : (
                      <span className="text-zinc-500 italic">Not defined yet</span>
                    )}
                  </span>
                  <span className="text-zinc-500 group-hover:text-white flex items-center gap-1">
                    <span>Explore</span>
                    <ArrowRight className="w-3 h-3 text-[#D4AF37]" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Category Detail Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg crescive-glass border border-amber-300/30 rounded-3xl p-6 sm:p-7 text-white shadow-[0_0_50px_rgba(212,175,55,0.25)] my-auto max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedCategory(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                  style={{
                    backgroundColor: `${selectedCategory.color}20`,
                    borderColor: `${selectedCategory.color}50`,
                  }}
                >
                  <CategoryIcon name={selectedCategory.iconName} className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                    DIMENSION 0{selectedCategory.number}
                  </span>
                  <h2 className="text-xl font-bold font-display text-white">
                    {selectedCategory.title}
                  </h2>
                </div>
              </div>

              <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                {selectedCategory.description}
              </p>

              {/* Subcategories */}
              <div className="mt-5">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#F5D77F] mb-2.5">
                  Sub-domains & Focus Areas
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedCategory.subcategories.map((sub) => (
                    <div
                      key={sub}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-200 flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                      <span className="truncate">{sub}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moves in this dimension */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#F5D77F]">
                    Connected Moves
                  </h4>
                  <button
                    onClick={() => {
                      const domainTitle = selectedCategory.title;
                      setSelectedCategory(null);
                      onOpenCreateMoveForDomain(domainTitle);
                    }}
                    className="py-1 px-2.5 rounded-lg gold-gradient-bg text-zinc-950 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Move</span>
                  </button>
                </div>

                {moves.filter((m) => m.domain === selectedCategory.title).length === 0 ? (
                  <div className="py-5 px-3 rounded-xl bg-black/30 border border-white/5 text-center text-xs text-zinc-500">
                    Not defined yet. What is one Move worth initiating in {selectedCategory.title}?
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {moves
                      .filter((m) => m.domain === selectedCategory.title)
                      .map((m) => (
                        <div
                          key={m.id}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                        >
                          <span className={m.completed ? "line-through text-zinc-500" : "text-white"}>
                            {m.title}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {m.timeCommitment}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
