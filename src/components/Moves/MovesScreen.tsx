import React, { useState } from "react";
import { motion } from "motion/react";
import { MoveItem } from "../../types";
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Trash2,
  Tag,
  Sparkles,
  Bell,
  Calendar,
  Play,
  Zap,
} from "lucide-react";
import { CRESCIVE_CATEGORIES } from "../../data/categories";

interface MovesScreenProps {
  moves: MoveItem[];
  onOpenCreateMove: (mode?: "create" | "ideas") => void;
  onToggleMove: (id: string) => void;
  onDeleteMove: (id: string) => void;
  onStartFocusSession?: (move: MoveItem | null, customDuration?: number) => void;
}

export const MovesScreen: React.FC<MovesScreenProps> = ({
  moves,
  onOpenCreateMove,
  onToggleMove,
  onDeleteMove,
  onStartFocusSession,
}) => {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");

  const filteredMoves = moves.filter((m) => {
    if (filter === "active" && m.completed) return false;
    if (filter === "completed" && !m.completed) return false;
    if (selectedDomain !== "all" && m.domain !== selectedDomain) return false;
    return true;
  });

  const completedCount = moves.filter((m) => m.completed).length;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#D4AF37] font-semibold">
            EXECUTION ARCHITECTURE
          </span>
          <h1 className="text-2xl sm:text-3xl font-light font-serif-cresive text-white tracking-wide">
            Your Moves
          </h1>
          <p className="text-xs text-zinc-400 font-light mt-0.5">
            Meaningful actions that compound over time. Not mere tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Flow Sanctuary Button */}
          <button
            id="btn-quick-flow-header"
            onClick={() => onStartFocusSession?.(null, 15)}
            className="py-2.5 px-3.5 rounded-full bg-[#101025] hover:bg-white/10 border border-[#06b6d4]/40 text-[#06b6d4] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all cursor-pointer whitespace-nowrap"
            title="Start 15-min Focus Sanctuary"
          >
            <Zap className="w-3.5 h-3.5 text-[#06b6d4]" />
            <span>⚡ Flow</span>
          </button>

          {/* Explore Move Ideas Button */}
          <button
            id="btn-explore-ideas-header"
            onClick={() => onOpenCreateMove("ideas")}
            className="py-2.5 px-4 rounded-full bg-[#101025] hover:bg-white/10 border border-[#D4AF37]/40 text-[#D4AF37] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>✨ Move Ideas</span>
          </button>

          {/* Create Move Button */}
          <button
            id="btn-create-move-header"
            onClick={() => onOpenCreateMove("create")}
            className="py-2.5 px-5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Create a Move</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1 bg-[#101025] p-1 rounded-2xl border border-white/10 text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`py-1.5 px-3 rounded-xl font-medium transition-all cursor-pointer ${
              filter === "all" ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            All ({moves.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`py-1.5 px-3 rounded-xl font-medium transition-all cursor-pointer ${
              filter === "active" ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            Active ({moves.length - completedCount})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`py-1.5 px-3 rounded-xl font-medium transition-all cursor-pointer ${
              filter === "completed" ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            Done ({completedCount})
          </button>
        </div>

        {/* Domain Filter Dropdown */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="bg-[#101025] border border-white/15 rounded-xl text-xs text-zinc-300 py-1.5 px-3 focus:outline-none cursor-pointer"
          >
            <option value="all">All Dimensions</option>
            {CRESCIVE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.title}>
                {cat.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List of Moves & Empty State */}
      {filteredMoves.length === 0 ? (
        <div className="py-16 px-6 rounded-3xl bg-[#101025] border border-[#D4AF37]/30 text-center flex flex-col items-center shadow-[0_15px_40px_-15px_rgba(212,175,55,0.15)]">
          <div className="w-14 h-14 rounded-2xl bg-[#050510] border border-[#D4AF37]/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <Sparkles className="w-6 h-6 text-[#D4AF37]" />
          </div>

          {moves.length === 0 ? (
            /* Section 13: Empty State */
            <div className="flex flex-col items-center max-w-md">
              <h3 className="text-xl font-light font-serif-cresive text-white tracking-wide">
                &ldquo;Nothing moving yet.&rdquo;
              </h3>
              <p className="text-xs text-[#D4AF37] font-semibold mt-1 mb-6 uppercase tracking-wider font-mono">
                Not sure what to start with?
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  id="btn-empty-create-move"
                  onClick={() => onOpenCreateMove("create")}
                  className="py-3 px-6 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_10px_25px_rgba(0,0,0,0.5)] hover:scale-105 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Create a Move</span>
                </button>
                <button
                  id="btn-empty-explore-ideas"
                  onClick={() => onOpenCreateMove("ideas")}
                  className="py-3 px-6 rounded-full bg-white/5 hover:bg-white/10 border border-[#D4AF37]/50 text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:scale-105 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span>✨ Explore Move Ideas</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-semibold text-white">No moves match your filter.</h3>
              <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4 leading-relaxed">
                Try switching filters or dimensions to view all your recorded moves.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMoves.map((move) => (
            <motion.div
              key={move.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                move.completed
                  ? "bg-[#050510]/50 border-white/5 opacity-65"
                  : "bg-[#101025] border-[#D4AF37]/30 hover:border-[#D4AF37]/60 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
              }`}
            >
              <button
                onClick={() => onToggleMove(move.id)}
                className="flex items-start gap-3.5 text-left flex-1 min-w-0 cursor-pointer pt-0.5"
              >
                <div className="shrink-0 mt-0.5">
                  {move.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-500 hover:text-[#D4AF37] transition-colors" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-sm sm:text-base font-bold tracking-wide ${
                      move.completed ? "line-through text-zinc-500" : "text-white"
                    }`}
                  >
                    {move.title}
                  </h4>

                  {move.notes && (
                    <p className="text-xs text-zinc-400 mt-1 font-light italic leading-relaxed">
                      &ldquo;{move.notes}&rdquo;
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px]">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#050510] border border-[#D4AF37]/30 text-[#D4AF37] font-semibold flex items-center gap-1 font-mono">
                      <Tag className="w-2.5 h-2.5 text-[#D4AF37]" />
                      {move.domain}
                    </span>

                    <span className="text-zinc-400 flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5 text-[#D4AF37]" />
                      {move.timeCommitment}
                    </span>

                    {move.scheduledTime && (
                      <span className="text-zinc-300 flex items-center gap-1 font-mono text-[10px]">
                        <Calendar className="w-2.5 h-2.5 text-[#D4AF37]" />
                        {move.scheduledDate || "Today"} {move.scheduledTime}
                      </span>
                    )}

                    {move.reminderEnabled && (
                      <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center gap-1 text-[10px] font-mono font-semibold">
                        <Bell className="w-2.5 h-2.5 text-[#D4AF37]" />
                        <span>Reminder Set</span>
                      </span>
                    )}

                    {move.completed && move.completedAt && (
                      <span className="text-emerald-400 font-mono text-[10px]">
                        ✓ Completed
                      </span>
                    )}
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                {!move.completed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartFocusSession?.(move);
                    }}
                    className="py-1.5 px-3 rounded-full bg-[#050510] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-semibold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    title="Enter Deep Work Sanctuary for this Move"
                  >
                    <Play className="w-3 h-3 fill-current text-[#D4AF37]" />
                    <span>Focus</span>
                  </button>
                )}

                <button
                  onClick={() => onDeleteMove(move.id)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Delete Move"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
