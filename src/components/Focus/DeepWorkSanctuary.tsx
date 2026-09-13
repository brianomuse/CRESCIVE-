import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MoveItem, SoundscapeId, FocusReflectionChoice, FunAchievement } from "../../types";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Clock,
  CheckCircle2,
  Tag,
  Headphones,
  Flame,
  Zap,
  Award,
  ChevronDown,
  Shield,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { focusAudioEngine } from "../../utils/focusAudioEngine";
import {
  parseDurationMinutes,
  recordFocusSessionCompletion,
  recordFocusReflection,
  FocusSessionResult,
} from "../../utils/focusStorage";
import { playCresciveChime, triggerVibration } from "../../utils/reminderEngine";
import { CresciveLogo } from "../CresciveLogo";

interface DeepWorkSanctuaryProps {
  move: MoveItem | null;
  customDurationMinutes?: number;
  isOpen: boolean;
  onClose: () => void;
  onMoveCompleted: (moveId: string) => void;
  onSessionFinished?: (result: FocusSessionResult) => void;
}

const SOUNDSCAPES: Array<{
  id: SoundscapeId;
  name: string;
  emoji: string;
  description: string;
}> = [
  { id: "none", name: "Silent", emoji: "🔇", description: "Pure silent sanctuary" },
  { id: "rain", name: "Cyber Rain", emoji: "🌧️", description: "Filtered rhythmic downpour" },
  { id: "cosmic", name: "Cosmic Drone", emoji: "🌌", description: "Deep celestial atmospheric wash" },
  { id: "focus", name: "Deep Focus", emoji: "🧘", description: "432Hz theta concentration drone" },
  { id: "cafe", name: "Café Murmur", emoji: "☕", description: "Cozy warm ambient room resonance" },
];

export const DeepWorkSanctuary: React.FC<DeepWorkSanctuaryProps> = ({
  move,
  customDurationMinutes,
  isOpen,
  onClose,
  onMoveCompleted,
  onSessionFinished,
}) => {
  // Session configuration
  const durationMinutes =
    customDurationMinutes || (move?.timeCommitment ? parseDurationMinutes(move.timeCommitment) : 15);
  const totalSeconds = Math.max(60, durationMinutes * 60);

  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [actualActiveSeconds, setActualActiveSeconds] = useState(0);

  // Micro-milestones tracking
  const [activeMilestone, setActiveMilestone] = useState<{
    percent: number;
    title: string;
    subtitle: string;
  } | null>(null);
  const hitMilestonesRef = useRef<Set<number>>(new Set());

  // Audio state
  const [selectedSoundscape, setSelectedSoundscape] = useState<SoundscapeId>("rain");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // Completion & Reflection state
  const [sessionResult, setSessionResult] = useState<FocusSessionResult | null>(null);
  const [selectedReflection, setSelectedReflection] = useState<FocusReflectionChoice | null>(null);
  const [reflectionBonusClaimed, setReflectionBonusClaimed] = useState(false);

  // High precision timing refs
  const lastTickTimestampRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<number | null>(null);
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const isCompletedRef = useRef(isCompleted);
  isCompletedRef.current = isCompleted;

  // Initialize or reset when sanctuary opens
  useEffect(() => {
    if (isOpen) {
      setRemainingSeconds(totalSeconds);
      setIsRunning(true);
      setIsCompleted(false);
      setShowExitConfirm(false);
      setActiveMilestone(null);
      setSessionResult(null);
      setSelectedReflection(null);
      setReflectionBonusClaimed(false);
      setActualActiveSeconds(0);
      hitMilestonesRef.current = new Set();
      lastTickTimestampRef.current = Date.now();

      // Start ambient audio if enabled
      if (selectedSoundscape !== "none" && !isAudioMuted) {
        focusAudioEngine.play(selectedSoundscape);
      }
    } else {
      focusAudioEngine.stop();
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      focusAudioEngine.stop();
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isOpen, totalSeconds]);

  // Handle Audio Changes
  const handleSelectSoundscape = (soundscape: SoundscapeId) => {
    setSelectedSoundscape(soundscape);
    if (soundscape === "none") {
      focusAudioEngine.stop();
    } else {
      setIsAudioMuted(false);
      focusAudioEngine.play(soundscape);
    }
    setShowAudioMenu(false);
  };

  const handleToggleMute = () => {
    const nextMuted = focusAudioEngine.toggleMute();
    setIsAudioMuted(nextMuted);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    focusAudioEngine.setVolume(newVol);
  };

  // Completion Handler
  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);
    setIsCompleted(true);
    focusAudioEngine.stop();
    playCresciveChime();
    triggerVibration([100, 50, 150]);

    // Record verified completion
    const result = recordFocusSessionCompletion({
      moveId: move?.id,
      moveTitle: move?.title || "Deep Work Session",
      domain: move?.domain || "Focus Sanctuary",
      durationMinutes,
      actualActiveSeconds: actualActiveSeconds + 1,
    });

    setSessionResult(result);

    // Notify parent to complete the Move
    if (move?.id) {
      onMoveCompleted(move.id);
    }
    if (onSessionFinished) {
      onSessionFinished(result);
    }
  }, [move, durationMinutes, actualActiveSeconds, onMoveCompleted, onSessionFinished]);

  // Timer Tick Engine with Real-Time Delta Accuracy
  useEffect(() => {
    if (!isOpen || isCompleted) return;

    timerIntervalRef.current = window.setInterval(() => {
      if (!isRunningRef.current || isCompletedRef.current) {
        lastTickTimestampRef.current = Date.now();
        return;
      }

      const now = Date.now();
      const deltaSeconds = (now - lastTickTimestampRef.current) / 1000;
      lastTickTimestampRef.current = now;

      // Cap delta to prevent background exploitation (max 1.5s step)
      const sanitizedStep = Math.min(1.5, Math.max(0.5, deltaSeconds));

      setActualActiveSeconds((prev) => prev + sanitizedStep);

      setRemainingSeconds((prev) => {
        const next = Math.max(0, prev - sanitizedStep);

        // Calculate progress percentage
        const progress = (totalSeconds - next) / totalSeconds;

        // Check 25% milestone
        if (progress >= 0.25 && !hitMilestonesRef.current.has(25)) {
          hitMilestonesRef.current.add(25);
          triggerMilestone(25, "FLOW DEEPENING", "25% of your sanctuary completed");
        }
        // Check 50% milestone
        if (progress >= 0.5 && !hitMilestonesRef.current.has(50)) {
          hitMilestonesRef.current.add(50);
          triggerMilestone(50, "HALF WAY THERE", "Peak momentum established");
        }
        // Check 75% milestone
        if (progress >= 0.75 && !hitMilestonesRef.current.has(75)) {
          hitMilestonesRef.current.add(75);
          triggerMilestone(75, "PEAK CLARITY", "Final stretch of deep focus");
        }

        if (next <= 0 && !isCompletedRef.current) {
          handleSessionComplete();
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isOpen, isCompleted, totalSeconds, handleSessionComplete]);

  // Trigger milestone notification banner
  const triggerMilestone = (percent: number, title: string, subtitle: string) => {
    setActiveMilestone({ percent, title, subtitle });
    playCresciveChime();
    setTimeout(() => {
      setActiveMilestone((current) => (current?.percent === percent ? null : current));
    }, 4500);
  };

  // Visibility change handling: If user leaves tab, track focus state
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isRunningRef.current) {
        lastTickTimestampRef.current = Date.now();
      } else if (!document.hidden) {
        lastTickTimestampRef.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Post-Session Reflection Submission
  const handleSelectReflection = (choice: FocusReflectionChoice) => {
    if (!sessionResult || reflectionBonusClaimed) return;
    setSelectedReflection(choice);
    const result = recordFocusReflection(sessionResult.session.id, choice);
    if (result.success) {
      setReflectionBonusClaimed(true);
      playCresciveChime();
    }
  };

  if (!isOpen) return null;

  // Format MM:SS
  const displayMins = Math.floor(remainingSeconds / 60);
  const displaySecs = Math.floor(remainingSeconds % 60);
  const formattedTime = `${String(displayMins).padStart(2, "0")}:${String(displaySecs).padStart(2, "0")}`;

  // Progress ratio 0.0 to 1.0
  const progressRatio = Math.min(1, Math.max(0, (totalSeconds - remainingSeconds) / totalSeconds));
  const circleRadius = 135;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div
      id="crescive-deep-work-sanctuary"
      className="fixed inset-0 z-[100] bg-[#030309] text-[#f5f5f0] flex flex-col justify-between p-4 sm:p-7 select-none overflow-hidden"
    >
      {/* Layered Subtle Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#D4AF37]/10 via-[#06b6d4]/5 to-transparent rounded-full blur-3xl opacity-75" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#D4AF37]/5 to-transparent rounded-full blur-2xl opacity-50" />
      </div>

      {/* TOP BAR: Brand Identity & Essential Audio Controls */}
      <header className="relative z-20 flex items-center justify-between w-full max-w-4xl mx-auto pt-1 sm:pt-2">
        <div className="flex items-center gap-3">
          <CresciveLogo className="w-9 h-9" roundedClassName="rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.3)]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-cresive text-xs sm:text-sm font-bold tracking-[0.2em] text-[#D4AF37] uppercase">
                DEEP WORK SANCTUARY
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#06b6d4]/15 border border-[#06b6d4]/30 text-[#06b6d4] font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${isRunning && !isCompleted ? "bg-[#06b6d4] animate-ping" : "bg-zinc-500"}`} />
                {isCompleted ? "COMPLETE" : isRunning ? "FLOW ACTIVE" : "PAUSED"}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-light truncate max-w-[200px] sm:max-w-xs">
              {move ? move.title : "Uninterrupted Focus Session"}
            </p>
          </div>
        </div>

        {/* Top Right: Sound Controls & Exit */}
        <div className="flex items-center gap-2">
          {/* Soundscape Selector Pill */}
          <div className="relative">
            <button
              id="sanctuary-btn-soundscape"
              onClick={() => setShowAudioMenu(!showAudioMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#101025] hover:bg-white/10 border border-[#D4AF37]/40 text-xs text-[#D4AF37] transition-all cursor-pointer shadow-sm"
              title="Select Soundscape"
            >
              <Headphones className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline font-mono">
                {SOUNDSCAPES.find((s) => s.id === selectedSoundscape)?.emoji}{" "}
                {SOUNDSCAPES.find((s) => s.id === selectedSoundscape)?.name}
              </span>
              <span className="sm:hidden font-mono">
                {SOUNDSCAPES.find((s) => s.id === selectedSoundscape)?.emoji}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {/* Soundscape Dropdown Menu */}
            <AnimatePresence>
              {showAudioMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-64 p-3 bg-[#0a0a1a] border border-[#D4AF37]/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-50 backdrop-blur-xl space-y-2"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-bold">
                      AMBIENT SOUNDSCAPE
                    </span>
                    <button
                      onClick={handleToggleMute}
                      className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title={isAudioMuted ? "Unmute" : "Mute"}
                    >
                      {isAudioMuted ? (
                        <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-1">
                    {SOUNDSCAPES.map((sound) => (
                      <button
                        key={sound.id}
                        onClick={() => handleSelectSoundscape(sound.id)}
                        className={`w-full p-2 rounded-xl text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          selectedSoundscape === sound.id
                            ? "bg-gradient-to-r from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/40 text-white"
                            : "hover:bg-white/5 text-zinc-300"
                        }`}
                      >
                        <span className="text-base">{sound.emoji}</span>
                        <div>
                          <p className="text-xs font-semibold text-white">{sound.name}</p>
                          <p className="text-[10px] text-zinc-400">{sound.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Volume Slider */}
                  {selectedSoundscape !== "none" && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-1">
                        <span>VOLUME</span>
                        <span>{Math.round(volume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Exit / Close Sanctuary Button */}
          <button
            id="sanctuary-btn-exit"
            onClick={() => {
              if (isCompleted) {
                onClose();
              } else {
                setShowExitConfirm(true);
              }
            }}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Exit Sanctuary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CENTER: Luminous Breathing Halo & Countdown Timer */}
      <main className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-lg mx-auto py-2">
        {/* Active Micro-Milestone Toast */}
        <AnimatePresence>
          {activeMilestone && !isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="absolute -top-12 z-30 px-4 py-2 rounded-full bg-[#101025] border border-[#D4AF37] text-white flex items-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.4)]"
            >
              <Zap className="w-4 h-4 text-[#D4AF37] animate-pulse" />
              <span className="text-xs font-bold font-mono tracking-wider text-[#D4AF37]">
                {activeMilestone.title}
              </span>
              <span className="text-zinc-400 text-xs">· {activeMilestone.subtitle}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Luminous Breathing Halo */}
        <div className="relative flex items-center justify-center w-[300px] h-[300px] sm:w-[350px] sm:h-[350px]">
          {/* Subtle Outer Breathing Glow Ring (expands/contracts rhythmically) */}
          <motion.div
            animate={{
              scale: isRunning && !isCompleted ? [1, 1.045, 1] : 1,
              opacity: isRunning && !isCompleted ? [0.45, 0.75, 0.45] : 0.3,
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full border border-[#D4AF37]/30 shadow-[0_0_60px_rgba(212,175,55,0.15)] pointer-events-none"
          />

          {/* Second Subtle Cyan Resonance Aura */}
          <motion.div
            animate={{
              scale: isRunning && !isCompleted ? [1.02, 0.98, 1.02] : 1,
              opacity: isRunning && !isCompleted ? [0.25, 0.5, 0.25] : 0.2,
            }}
            transition={{
              duration: 6.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -inset-4 rounded-full border border-[#06b6d4]/20 shadow-[0_0_40px_rgba(6,182,212,0.12)] pointer-events-none"
          />

          {/* SVG Circular Progress Track */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 320 320">
            <defs>
              <linearGradient id="cresciveHaloGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4AF37" />
                <stop offset="60%" stopColor="#F5D77F" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <filter id="haloGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Track Ring */}
            <circle
              cx="160"
              cy="160"
              r={circleRadius}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="6"
              fill="transparent"
            />

            {/* Foreground Luminous Progress Ring */}
            <circle
              cx="160"
              cy="160"
              r={circleRadius}
              stroke="url(#cresciveHaloGradient)"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              filter="url(#haloGlow)"
              className="transition-[stroke-dashoffset] duration-500 ease-linear"
            />
          </svg>

          {/* Center Content (Inside Halo) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            {/* Domain Pill */}
            <span className="px-2.5 py-0.5 rounded-full bg-[#101025] border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-mono font-semibold flex items-center gap-1 uppercase tracking-wider mb-2">
              <Tag className="w-2.5 h-2.5 text-[#D4AF37]" />
              {move?.domain || "Intentional Deep Work"}
            </span>

            {/* Countdown / Elapsed Timer */}
            <div className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-white drop-shadow-[0_0_20px_rgba(212,175,55,0.35)] my-1">
              {formattedTime}
            </div>

            {/* Move Title */}
            <p className="text-xs sm:text-sm text-zinc-300 font-medium max-w-[210px] truncate mt-1">
              {move?.title || "Focusing on Becoming"}
            </p>

            {/* Flow State Tag */}
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase">
              {isCompleted ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  MOVE COMPLETED
                </span>
              ) : isRunning ? (
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  BREATHE WITH THE HALO
                </span>
              ) : (
                <span className="text-amber-300 flex items-center gap-1">
                  <Pause className="w-3 h-3" />
                  SESSION PAUSED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Breathing Rhythm Subtle Guide */}
        {isRunning && !isCompleted && (
          <p className="text-[11px] text-zinc-400 font-light mt-6 tracking-wider">
            Inhale clarity · Exhale distraction · Protect your focus
          </p>
        )}
      </main>

      {/* BOTTOM CONTROLS: Pause, Resume, Sound, Progress */}
      <footer className="relative z-20 w-full max-w-md mx-auto pb-2 flex flex-col items-center gap-3">
        {!isCompleted ? (
          <div className="flex items-center justify-center gap-3 w-full">
            {/* Toggle Pause / Resume */}
            <button
              id="sanctuary-btn-toggle-play"
              onClick={() => {
                const nextState = !isRunning;
                setIsRunning(nextState);
                if (nextState) {
                  lastTickTimestampRef.current = Date.now();
                  if (selectedSoundscape !== "none" && !isAudioMuted) {
                    focusAudioEngine.play(selectedSoundscape);
                  }
                } else {
                  focusAudioEngine.stop();
                }
              }}
              className={`flex-1 py-3.5 px-6 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-all cursor-pointer ${
                isRunning
                  ? "bg-[#101025] hover:bg-white/10 border border-white/20 text-white hover:border-[#D4AF37]/50"
                  : "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-[0_0_25px_rgba(212,175,55,0.4)]"
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Session</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Flow</span>
                </>
              )}
            </button>

            {/* Quick Audio Mute / Unmute Button */}
            <button
              id="sanctuary-btn-mute"
              onClick={handleToggleMute}
              className={`p-3.5 rounded-full border transition-all cursor-pointer ${
                isAudioMuted
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-[#101025] hover:bg-white/10 border-white/15 text-[#D4AF37]"
              }`}
              title={isAudioMuted ? "Unmute Ambient Sound" : "Mute Ambient Sound"}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          /* COMPLETION & REFLECTION CARD */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-5 rounded-3xl bg-[#0a0a1a] border border-[#D4AF37]/50 text-center shadow-[0_20px_50px_rgba(0,0,0,0.95)]"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-lg font-serif-cresive font-bold text-white tracking-wide">
                FLOW COMPLETE
              </h3>
            </div>

            <p className="text-xs text-zinc-300">
              <span className="text-[#D4AF37] font-semibold">{durationMinutes} minutes</span> of deep,
              uninterrupted work completed.
            </p>

            {/* XP Breakdown Badge */}
            {sessionResult && (
              <div className="my-3 py-2 px-4 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 inline-flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-[#D4AF37]">
                  +{sessionResult.totalXp} XP EARNED
                </span>
                <span className="text-[10px] text-zinc-400">
                  (25 Move XP + {sessionResult.flowBonusXp} Flow Bonus)
                </span>
              </div>
            )}

            {/* Unlocked Achievements */}
            {sessionResult && sessionResult.newAchievements.length > 0 && (
              <div className="my-2 space-y-1.5">
                {sessionResult.newAchievements.map((ach) => (
                  <div
                    key={ach.id}
                    className="p-2 rounded-xl bg-[#101025] border border-amber-400/40 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{ach.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{ach.title}</p>
                        <p className="text-[10px] text-zinc-400">{ach.description}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#D4AF37] px-2 py-0.5 rounded bg-[#D4AF37]/15">
                      +{ach.xpReward} XP
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 10-Second Quick Reflection: "Did you experience friction or flow?" */}
            <div className="mt-3 pt-3 border-t border-white/10 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-300 font-semibold">
                  Did you experience friction or flow?
                </span>
                {reflectionBonusClaimed && (
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    +10 XP Bonus Claimed ✓
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "flow", label: "🌊 FLOW", desc: "Effortless & locked in" },
                  { id: "good", label: "🙂 GOOD", desc: "Steady & focused" },
                  { id: "some_friction", label: "⚡ SOME FRICTION", desc: "Resisted but pushed through" },
                  { id: "heavy_friction", label: "🧱 HEAVY FRICTION", desc: "Hard work, stayed with it" },
                ].map((item) => (
                  <button
                    key={item.id}
                    disabled={reflectionBonusClaimed}
                    onClick={() => handleSelectReflection(item.id as FocusReflectionChoice)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedReflection === item.id
                        ? "bg-[#D4AF37]/20 border-[#D4AF37] text-white"
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300"
                    }`}
                  >
                    <p className="text-xs font-bold text-white">{item.label}</p>
                    <p className="text-[10px] text-zinc-400">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Return to CRESCIVE Button */}
            <button
              id="sanctuary-btn-return-app"
              onClick={onClose}
              className="mt-4 w-full py-3 px-6 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(0,0,0,0.6)] hover:scale-102 active:scale-98 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Return to CRESCIVE</span>
            </button>
          </motion.div>
        )}
      </footer>

      {/* EXIT EARLY CONFIRMATION MODAL */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm p-6 rounded-3xl bg-[#101025] border border-white/15 text-center shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-white mb-1 font-serif-cresive">
                Leave Focus Sanctuary?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-5">
                Your session has {displayMins}m {displaySecs}s remaining. If you exit early, the Move
                will remain active and no completion XP will be awarded.
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider shadow-md hover:scale-102 transition-all cursor-pointer"
                >
                  Keep Focusing
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-full bg-transparent hover:bg-white/5 text-zinc-400 hover:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Exit Early
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
