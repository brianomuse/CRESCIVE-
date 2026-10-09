import React, { useState } from "react";
import { motion } from "motion/react";
import { Moon, Check, ShieldCheck, SunMedium, Smartphone } from "lucide-react";

interface RecoveryCardProps {
  isRecoveryDay: boolean;
  isCompleted: boolean;
  onRecordRecovery: (activityTitle?: string) => void;
}

export const RecoveryCard: React.FC<RecoveryCardProps> = ({
  isRecoveryDay,
  isCompleted,
  onRecordRecovery,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<string>("Adequate Sleep Prioritized");

  const recoveryOptions = [
    { id: "sleep", label: "Adequate Sleep Prioritized", desc: "Target 8–9 hours of restful sleep" },
    { id: "screen-break", label: "Screen Break Decompression", desc: "Step away from digital feeds before bed" },
    { id: "gentle-walk", label: "Gentle Walk / Sunlight", desc: "Light mobility and natural outdoor air" },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0c1e] overflow-hidden transition-all duration-300 hover:border-indigo-500/30">
      <div className="h-1 bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500" />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-indigo-400 font-semibold">
              RESTORATION & SLEEP
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              RECOVERY
            </h3>
            <p className="text-xs text-[#D4AF37] font-mono uppercase tracking-wider font-semibold mt-0.5">
              Rest is part of progress.
            </p>
          </div>

          <div className="shrink-0">
            {isCompleted ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-mono font-bold">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>RESTED</span>
              </div>
            ) : isRecoveryDay ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                CYCLE RECOVERY DAY
              </span>
            ) : (
              <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                DAILY REST
              </span>
            )}
          </div>
        </div>

        {/* Mindful Sleep & Recovery Notice */}
        <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200/90 leading-relaxed font-light space-y-1">
          <div className="font-semibold text-white flex items-center gap-1.5 text-xs font-mono">
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Give your body and mind time to recover.</span>
          </div>
          <p className="text-[11px] text-zinc-300">
            Healthy sleep and deliberate rest allow muscles to rebuild, memory to consolidate, and focus to renew. Rest is never wasted time—it is when adaptation happens.
          </p>
        </div>

        {/* Simple Restoration Choices */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase text-zinc-400 font-semibold">
            CHOOSE TODAY&apos;S REST EMPHASIS
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {recoveryOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedActivity(opt.label)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedActivity === opt.label
                    ? "bg-indigo-950/70 border-indigo-400/50 text-white"
                    : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                <div className="text-xs font-semibold">{opt.label}</div>
                <div className="text-[10px] text-zinc-400 mt-0.5 font-light">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>No sleep ranking or artificial competition.</span>
          </div>

          <button
            type="button"
            onClick={() => onRecordRecovery(selectedActivity)}
            disabled={isCompleted}
            className={`py-2 px-5 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
              isCompleted
                ? "bg-white/10 text-zinc-400 border border-white/10"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_4px_16px_rgba(99,102,241,0.3)]"
            }`}
          >
            {isCompleted ? "RECOVERY RECORDED" : "RECORD RECOVERY"}
          </button>
        </div>
      </div>
    </div>
  );
};
