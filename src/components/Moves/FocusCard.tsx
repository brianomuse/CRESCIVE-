import React, { useState } from "react";
import { motion } from "motion/react";
import { Zap, Check, Play, Clock, Sparkles } from "lucide-react";

interface FocusCardProps {
  isCompleted: boolean;
  minutesCompleted: number;
  onStartFocusSession?: (duration: number) => void;
  onMarkFocusComplete: (minutes: number) => void;
}

export const FocusCard: React.FC<FocusCardProps> = ({
  isCompleted,
  minutesCompleted,
  onStartFocusSession,
  onMarkFocusComplete,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(15);

  const durationOptions = [15, 30, 60];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0c1e] overflow-hidden transition-all duration-300 hover:border-cyan-500/30">
      <div className="h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-[#D4AF37]" />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-semibold">
              DEEP WORK SANCTUARY
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              FOCUS
            </h3>
            <p className="text-xs text-[#D4AF37] font-mono uppercase tracking-wider font-semibold mt-0.5">
              Protect your attention.
            </p>
          </div>

          <div className="shrink-0">
            {isCompleted ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-mono font-bold">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>FOCUSED</span>
              </div>
            ) : (
              <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                ACTIVE
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed font-light">
          Step into a quiet, distraction-free Flow sanctuary. Single-task with intention, silence notifications, and accomplish deep work.
        </p>

        {/* Duration Selection */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase text-zinc-400 font-semibold">
            SELECT SESSION COMMITMENT
          </div>

          <div className="grid grid-cols-3 gap-2">
            {durationOptions.map((duration) => (
              <button
                key={duration}
                type="button"
                onClick={() => setSelectedDuration(duration)}
                className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedDuration === duration
                    ? "bg-cyan-950/70 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                <div className="text-sm font-mono font-bold">{duration} MIN</div>
                <div className="text-[9px] text-zinc-500 font-mono mt-0.5">FLOW MODE</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Awards +25 XP upon completion</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onStartFocusSession?.(selectedDuration)}
              className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(6,182,212,0.25)] transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-300" />
              <span>START {selectedDuration} MIN FLOW</span>
            </button>

            {!isCompleted && (
              <button
                type="button"
                onClick={() => onMarkFocusComplete(selectedDuration)}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 font-mono text-xs transition-colors cursor-pointer"
                title="Mark already completed offline"
              >
                LOG COMPLETED
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
