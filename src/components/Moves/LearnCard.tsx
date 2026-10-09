import React, { useState } from "react";
import { motion } from "motion/react";
import { BookOpen, Check, Sparkles, Compass } from "lucide-react";

interface LearnCardProps {
  isCompleted: boolean;
  onCompleteLearn: (note?: string) => void;
}

export const LearnCard: React.FC<LearnCardProps> = ({
  isCompleted,
  onCompleteLearn,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<string>("Read & Study");
  const [note, setNote] = useState<string>("");

  const learningModes = [
    { title: "Read & Study", desc: "Read books, articles, or course materials" },
    { title: "Skill Practice", desc: "Code, draw, play music, or practice language" },
    { title: "Build & Write", desc: "Create a project, write notes, solve problems" },
    { title: "Explore Concept", desc: "Dig deeply into a scientific or historical topic" },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0c1e] overflow-hidden transition-all duration-300 hover:border-emerald-500/30">
      <div className="h-1 bg-gradient-to-r from-emerald-600 via-teal-400 to-cyan-500" />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
              INTELLECTUAL EXPANSION
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              LEARN
            </h3>
            <p className="text-xs text-[#D4AF37] font-mono uppercase tracking-wider font-semibold mt-0.5">
              Improve something today.
            </p>
          </div>

          <div className="shrink-0">
            {isCompleted ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-mono font-bold">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>EXPANDED</span>
              </div>
            ) : (
              <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                ACTIVE
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed font-light">
          Compound your knowledge with small daily curiosity. Whether you read a chapter, practice a tool, or research a question—every insight builds sovereign capability.
        </p>

        {/* Learning Modality Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {learningModes.map((mode) => (
            <button
              key={mode.title}
              type="button"
              onClick={() => setSelectedActivity(mode.title)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedActivity === mode.title
                  ? "bg-emerald-950/60 border-emerald-400/50 text-emerald-200"
                  : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              <div className="text-xs font-semibold">{mode.title}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5 truncate">{mode.desc}</div>
            </button>
          ))}
        </div>

        {/* Optional Note */}
        {!isCompleted && (
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you learn today? (optional)"
            className="w-full bg-[#050510] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-400/50"
          />
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Awards +25 XP</span>
          </div>

          <button
            type="button"
            onClick={() => onCompleteLearn(note || selectedActivity)}
            disabled={isCompleted}
            className={`py-2 px-5 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
              isCompleted
                ? "bg-white/10 text-zinc-400 border border-white/10"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.3)]"
            }`}
          >
            {isCompleted ? "LEARNING LOGGED" : "COMPLETE LEARNING"}
          </button>
        </div>
      </div>
    </div>
  );
};
