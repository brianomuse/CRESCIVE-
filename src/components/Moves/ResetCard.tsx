import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Wind, Check, Play, Pause, RotateCcw, Sparkles } from "lucide-react";

interface ResetCardProps {
  isCompleted: boolean;
  onCompleteReset: () => void;
}

export const ResetCard: React.FC<ResetCardProps> = ({
  isCompleted,
  onCompleteReset,
}) => {
  const [isBreathing, setIsBreathing] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isBreathing && secondsRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsBreathing(false);
            onCompleteReset();
            return 0;
          }
          return prev - 1;
        });

        // 4s Inhale, 2s Hold, 4s Exhale cycle
        const cycle = secondsRemaining % 10;
        if (cycle >= 6) setBreathPhase("Inhale");
        else if (cycle >= 4) setBreathPhase("Hold");
        else setBreathPhase("Exhale");
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isBreathing, secondsRemaining, onCompleteReset]);

  const handleStartReset = () => {
    setIsBreathing(true);
    setSecondsRemaining(60);
  };

  const handlePauseReset = () => {
    setIsBreathing(false);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0c1e] overflow-hidden transition-all duration-300 hover:border-teal-500/30">
      <div className="h-1 bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-500" />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-teal-400 font-semibold">
              MENTAL DECOMPRESSION
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              RESET
            </h3>
            <p className="text-xs text-[#D4AF37] font-mono uppercase tracking-wider font-semibold mt-0.5">
              Take a quiet minute.
            </p>
          </div>

          <div className="shrink-0">
            {isCompleted ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-mono font-bold">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>CENTERED</span>
              </div>
            ) : (
              <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                ACTIVE
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed font-light">
          Step back from inputs and screens. Take 60 seconds to release tension, breathe with rhythm, and clear cognitive residue.
        </p>

        {/* Breathing Circle Area */}
        <div className="relative py-6 px-4 rounded-xl bg-gradient-to-b from-[#050510] to-[#0b0c1e] border border-white/10 flex flex-col items-center justify-center overflow-hidden">
          <motion.div
            animate={{
              scale: isBreathing ? (breathPhase === "Inhale" ? 1.25 : breathPhase === "Hold" ? 1.25 : 0.9) : 1,
              borderColor: isBreathing ? "rgba(6, 182, 212, 0.7)" : "rgba(255, 255, 255, 0.15)",
            }}
            transition={{ duration: breathPhase === "Hold" ? 0.3 : 4, ease: "easeInOut" }}
            className="w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center bg-cyan-950/20 shadow-[0_0_30px_rgba(6,182,212,0.15)]"
          >
            <Wind className="w-5 h-5 text-cyan-400 mb-1" />
            <span className="text-xs font-mono font-bold text-white">
              {isBreathing ? breathPhase : `${secondsRemaining}s`}
            </span>
          </motion.div>

          <div className="mt-3 text-center">
            <div className="text-[11px] font-mono text-cyan-300">
              {isBreathing ? `${secondsRemaining}s remaining` : "60-Second Mindful Breathing"}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              Inhale deeply through your nose, hold gently, and exhale smoothly.
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Awards +20 XP</span>
          </div>

          <div className="flex items-center gap-2">
            {!isBreathing ? (
              <button
                type="button"
                onClick={handleStartReset}
                className="py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold uppercase transition-all cursor-pointer"
              >
                {secondsRemaining < 60 && secondsRemaining > 0 ? "RESUME" : "START 60S RESET"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePauseReset}
                className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold uppercase transition-all cursor-pointer"
              >
                PAUSE
              </button>
            )}

            {!isCompleted && (
              <button
                type="button"
                onClick={onCompleteReset}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 font-mono text-xs transition-colors cursor-pointer"
              >
                MARK COMPLETE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
