import React, { useState } from "react";
import { motion } from "motion/react";
import { Heart, Check, Users, MessageSquare, Sparkles } from "lucide-react";

interface ConnectCardProps {
  isCompleted: boolean;
  onRecordConnect: (note?: string) => void;
}

export const ConnectCard: React.FC<ConnectCardProps> = ({
  isCompleted,
  onRecordConnect,
}) => {
  const [selectedAction, setSelectedAction] = useState<string>("Encouraged a Friend");
  const [note, setNote] = useState<string>("");

  const actions = [
    { label: "Talk to Someone", desc: "A meaningful conversation in person or on call" },
    { label: "Check on a Friend", desc: "Send a thoughtful check-in message" },
    { label: "Spend Time with Family", desc: "Present, undistracted connection at home" },
    { label: "Help Someone", desc: "Assist with a task, problem, or support" },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0c1e] overflow-hidden transition-all duration-300 hover:border-pink-500/30">
      <div className="h-1 bg-gradient-to-r from-pink-500 via-rose-400 to-[#D4AF37]" />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-pink-400 font-semibold">
              HUMAN CONNECTION
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              CONNECT
            </h3>
            <p className="text-xs text-[#D4AF37] font-mono uppercase tracking-wider font-semibold mt-0.5">
              People matter.
            </p>
          </div>

          <div className="shrink-0">
            {isCompleted ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-mono font-bold">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>CONNECTED</span>
              </div>
            ) : (
              <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                ACTIVE
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed font-light">
          Growth is deeply enriched by the people around us. Reach out, listen attentively, share encouragement, or simply be present with someone who matters.
        </p>

        {/* Action Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {actions.map((act) => (
            <button
              key={act.label}
              type="button"
              onClick={() => setSelectedAction(act.label)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedAction === act.label
                  ? "bg-pink-950/40 border-pink-400/50 text-pink-200"
                  : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              <div className="text-xs font-semibold">{act.label}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{act.desc}</div>
            </button>
          ))}
        </div>

        {!isCompleted && (
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Who did you connect with today? (optional)"
            className="w-full bg-[#050510] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-pink-400/50"
          />
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Awards +20 XP</span>
          </div>

          <button
            type="button"
            onClick={() => onRecordConnect(note || selectedAction)}
            disabled={isCompleted}
            className={`py-2 px-5 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
              isCompleted
                ? "bg-white/10 text-zinc-400 border border-white/10"
                : "bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-[0_4px_16px_rgba(244,63,94,0.3)]"
            }`}
          >
            {isCompleted ? "CONNECTION RECORDED" : "RECORD CONNECTION"}
          </button>
        </div>
      </div>
    </div>
  );
};
