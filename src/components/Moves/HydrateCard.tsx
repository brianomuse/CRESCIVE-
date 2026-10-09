import React, { useState } from "react";
import { motion } from "motion/react";
import { Droplets, Check, Plus, ShieldCheck } from "lucide-react";

interface HydrateCardProps {
  breaksCount: number;
  isCompleted: boolean;
  onLogWaterBreak: () => void;
}

export const HydrateCard: React.FC<HydrateCardProps> = ({
  breaksCount,
  isCompleted,
  onLogWaterBreak,
}) => {
  const [justLogged, setJustLogged] = useState(false);

  const handleClick = () => {
    setJustLogged(true);
    onLogWaterBreak();
    setTimeout(() => setJustLogged(false), 900);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0c1e] overflow-hidden transition-all duration-300 hover:border-cyan-500/30">
      <div className="h-1 bg-gradient-to-r from-cyan-600 via-cyan-400 to-blue-500" />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-semibold">
              DAILY HYDRATION
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              HYDRATE
            </h3>
            <p className="text-xs text-[#D4AF37] font-mono uppercase tracking-wider font-semibold mt-0.5">
              Keep your day flowing.
            </p>
          </div>

          <div className="shrink-0">
            {isCompleted ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-mono font-bold">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>HYDRATED</span>
              </div>
            ) : (
              <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                ACTIVE
              </span>
            )}
          </div>
        </div>

        {/* Counter Display with Water-Flow Ripple */}
        <div className="relative p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-[#050510] to-[#0b0c1e] border border-cyan-500/20 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center transition-all ${
                  justLogged ? "scale-110 shadow-[0_0_20px_rgba(6,182,212,0.5)]" : ""
                }`}
              >
                <Droplets className="w-5 h-5 text-cyan-400" />
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase text-zinc-400">
                  WATER BREAKS TODAY
                </div>
                <div className="text-xl font-bold font-mono text-white flex items-center gap-2">
                  <span>{breaksCount}</span>
                  <span className="text-xs font-normal text-zinc-400">
                    {breaksCount === 1 ? "break recorded" : "breaks recorded"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClick}
              className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_4px_16px_rgba(6,182,212,0.25)] transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>LOG WATER BREAK</span>
            </button>
          </div>
        </div>

        {/* Natural Hydration Guidance (No arbitrary forced gallon goals) */}
        <div className="space-y-1.5 text-xs text-zinc-300 font-light">
          <p className="leading-relaxed">
            Drink water steadily across the day. Pay extra attention before, during, and after physical exercise, or in warm weather.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>No rigid competition. Listen to your body and stay refreshed.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
