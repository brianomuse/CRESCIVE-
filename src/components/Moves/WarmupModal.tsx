import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Play, Pause, Check, ShieldCheck, Activity, RotateCcw } from "lucide-react";
import { WARMUP_MOVEMENTS } from "../../data/movesProgram";

interface WarmupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWarmupFinished: () => void;
}

export const WarmupModal: React.FC<WarmupModalProps> = ({
  isOpen,
  onClose,
  onWarmupFinished,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTimerRunning && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (currentStepIndex < WARMUP_MOVEMENTS.length - 1) {
              setCurrentStepIndex((idx) => idx + 1);
              return 30;
            } else {
              setIsTimerRunning(false);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, secondsRemaining, currentStepIndex]);

  if (!isOpen) return null;

  const currentMovement = WARMUP_MOVEMENTS[currentStepIndex];

  const handleStartWarmup = () => {
    setIsTimerRunning(true);
  };

  const handlePauseWarmup = () => {
    setIsTimerRunning(false);
  };

  const handleStartSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onWarmupFinished();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-[#0b0c1e] border border-cyan-500/30 rounded-3xl overflow-hidden shadow-2xl space-y-4"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-semibold">
              PREPARATION ARCHITECTURE
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              PREPARE
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Awaken your muscles, lubricate joints, and elevate nervous system readiness.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-mono transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>

        {/* Dynamic Preparation Guide Image */}
        <div className="px-4 sm:px-6">
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner">
            <img
              src="/assets/exercises/warmup.jpg"
              alt="Dynamic Warmup Demonstration"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-cyan-400/30 text-[10px] font-mono text-cyan-300">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>DYNAMIC MOBILITY</span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/10">
              <div>
                <div className="text-[10px] font-mono text-zinc-400 uppercase">
                  STEP {currentStepIndex + 1} OF {WARMUP_MOVEMENTS.length}
                </div>
                <div className="text-sm sm:text-base font-bold text-white">
                  {currentMovement.name}
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-cyan-300 font-bold text-lg">
                <span>{secondsRemaining}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Movement Steps Carousel */}
        <div className="px-4 sm:px-6 space-y-2">
          <p className="text-xs text-zinc-300 leading-relaxed">
            {currentMovement.instruction}
          </p>

          <div className="grid grid-cols-4 gap-2 pt-2">
            {WARMUP_MOVEMENTS.map((step, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentStepIndex(idx);
                  setSecondsRemaining(30);
                }}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  currentStepIndex === idx
                    ? "bg-cyan-950/60 border-cyan-400/50 text-cyan-200"
                    : idx < currentStepIndex
                    ? "bg-black/30 border-[#D4AF37]/30 text-zinc-400"
                    : "bg-white/5 border-white/5 text-zinc-500"
                }`}
              >
                <div className="text-[9px] font-mono uppercase truncate">Step {idx + 1}</div>
                <div className="text-[11px] font-semibold truncate text-white">{step.name}</div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              Move with ease. Warm-up is not a workout test—keep every movement smooth and gentle.
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 sm:p-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isTimerRunning ? (
              <button
                type="button"
                onClick={handleStartWarmup}
                className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>START WARM-UP</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePauseWarmup}
                className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>PAUSE</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSecondsRemaining(30);
                setIsTimerRunning(false);
              }}
              className="p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Reset current step"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleStartSession}
            className="w-full sm:w-auto py-3 px-8 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#e5c158] hover:to-[#c99718] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition-all cursor-pointer active:scale-98"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>START SESSION</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
