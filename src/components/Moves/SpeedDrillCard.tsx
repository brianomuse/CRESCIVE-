import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, RotateCcw, Check, Wind, ShieldCheck, Footprints } from "lucide-react";
import { DailySpeedDrill } from "../../types";

interface SpeedDrillCardProps {
  drill?: DailySpeedDrill;
  isRecoveryDay: boolean;
  isCompleted: boolean;
  onCompleteDrill: () => void;
  onOpenWarmup: () => void;
}

export const SpeedDrillCard: React.FC<SpeedDrillCardProps> = ({
  drill,
  isRecoveryDay,
  isCompleted,
  onCompleteDrill,
  onOpenWarmup,
}) => {
  const [currentEffort, setCurrentEffort] = useState(1);
  const [phase, setPhase] = useState<"idle" | "work" | "recovery">("idle");
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [isInteractiveMode, setIsInteractiveMode] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalEfforts = drill?.efforts || 4;
  const workSeconds = drill?.workSeconds || 15;
  const recoverySeconds = drill?.recoverySeconds || 45;

  useEffect(() => {
    if (phase === "work" || phase === "recovery") {
      intervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (phase === "work") {
              setPhase("recovery");
              return recoverySeconds;
            } else {
              // Recovery ended
              if (currentEffort < totalEfforts) {
                setCurrentEffort((e) => e + 1);
                setPhase("work");
                return workSeconds;
              } else {
                setPhase("idle");
                onCompleteDrill();
                return 0;
              }
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, currentEffort, totalEfforts, workSeconds, recoverySeconds, onCompleteDrill]);

  const handleStartDrill = () => {
    setIsInteractiveMode(true);
    setCurrentEffort(1);
    setPhase("work");
    setSecondsRemaining(workSeconds);
  };

  const handlePause = () => {
    setPhase("idle");
  };

  const handleResume = () => {
    setPhase("work");
  };

  const handleReset = () => {
    setPhase("idle");
    setCurrentEffort(1);
    setSecondsRemaining(workSeconds);
  };

  if (isRecoveryDay) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0b0c1e] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
              RECOVERY DAY
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">NO SPRINT REQUIRED</span>
        </div>

        <h3 className="text-lg font-bold text-white tracking-wide">
          DAILY SPEED: REST & EASY WALK
        </h3>

        <p className="text-xs text-zinc-300 leading-relaxed font-light">
          No hard sprint required today. Recovery days allow tendon, neuromuscular, and cardiovascular adaptation. If desired, enjoy a gentle outdoor walk.
        </p>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onCompleteDrill}
            disabled={isCompleted}
            className={`py-2 px-4 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
              isCompleted
                ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            {isCompleted ? "RECOVERY NOTED" : "LOG EASY WALK / REST"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0c1e] overflow-hidden space-y-4">
      {/* Top Accent Strip */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-[#D4AF37]" />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-semibold">
                NEUROMUSCULAR COORDINATION
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                {totalEfforts} SHORT EFFORTS
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              DAILY SPEED
            </h3>
            <p className="text-xs text-[#D4AF37] font-mono uppercase tracking-wider font-semibold mt-0.5">
              Short effort. Full recovery.
            </p>
          </div>

          <div className="shrink-0">
            {isCompleted ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-mono font-bold">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>COMPLETE</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartDrill}
                className="px-4 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                START DRILL
              </button>
            )}
          </div>
        </div>

        {/* Sprint Visual Demo & Mechanics Guide */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-xl overflow-hidden bg-black border border-white/10">
          <img
            src="/assets/exercises/sprintTechnique.jpg"
            alt="Sprint Acceleration Technique"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20 pointer-events-none" />

          {/* Running State HUD */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-white">
            <div>
              <div className="text-[10px] font-mono text-zinc-400 uppercase">
                {phase === "work" ? "CURRENT EFFORT" : phase === "recovery" ? "RECOVERY PHASE" : "READY"}
              </div>
              <div className="text-sm font-bold font-mono text-cyan-300">
                {phase !== "idle" ? `EFFORT ${currentEffort} OF ${totalEfforts}` : `${totalEfforts} ACCELERATIONS`}
              </div>
            </div>

            {phase !== "idle" && (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-[9px] font-mono uppercase text-zinc-400">
                    {phase === "work" ? "RUN" : "WALK & BREATHE"}
                  </div>
                  <div className="text-lg font-bold font-mono text-[#D4AF37]">
                    {secondsRemaining}s
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Safety & Full Recovery Directive */}
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1 text-zinc-300">
            <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-[10px] uppercase font-bold">
              <Footprints className="w-3.5 h-3.5" />
              <span>WALK AND RECOVER FULLY BETWEEN EFFORTS</span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-300">
              {drill?.instructions}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-zinc-400">
            <button
              type="button"
              onClick={onOpenWarmup}
              className="text-cyan-400 hover:text-cyan-300 font-mono underline cursor-pointer"
            >
              WARM UP FIRST
            </button>
            <span className="font-light text-right">No racing. No leaderboards. Movement quality first.</span>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            {phase === "idle" ? (
              <button
                type="button"
                onClick={handleStartDrill}
                className="py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all cursor-pointer"
              >
                RUN DRILL TIMER
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePause}
                className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-all cursor-pointer"
              >
                PAUSE
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Reset drill"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {!isCompleted && (
            <button
              type="button"
              onClick={onCompleteDrill}
              className="py-2 px-4 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 font-mono text-xs font-bold uppercase transition-all cursor-pointer"
            >
              MARK COMPLETE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
